
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    Category,
    Product,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Review,
)


# =========================================================
# CATEGORY
# =========================================================

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


# =========================================================
# PRODUCT
# =========================================================

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "category",
            "stock",
            "image",
            "rating",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


# =========================================================
# USER
# =========================================================

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
        ]
        read_only_fields = ["id", "username"]


# =========================================================
# REGISTER
# =========================================================

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    password2 = serializers.CharField(
        write_only=True,
        min_length=6
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password2",
            "first_name",
            "last_name",
        ]

    def validate_email(self, value):
        value = value.lower().strip()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({
                "password2": "Passwords do not match."
            })

        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")

        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        Cart.objects.get_or_create(user=user)

        return user


# =========================================================
# CART ITEM
# =========================================================

class CartItemSerializer(serializers.ModelSerializer):

    product = ProductSerializer(read_only=True)

    product_id = serializers.IntegerField(
        write_only=True,
        required=False
    )

    item_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_id",
            "quantity",
            "item_total",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "item_total",
            "created_at",
            "updated_at",
        ]

    def get_item_total(self, obj):
        return obj.product.price * obj.quantity


# =========================================================
# CART
# =========================================================

class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(
        many=True,
        read_only=True
    )

    subtotal = serializers.SerializerMethodField()
    tax = serializers.SerializerMethodField()
    shipping = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            "id",
            "items",
            "subtotal",
            "tax",
            "shipping",
            "total",
            "created_at",
            "updated_at",
        ]

    def get_subtotal(self, obj):
        return sum(
            (
                item.product.price * item.quantity
                for item in obj.items.select_related("product").all()
            ),
            Decimal("0.00")
        )

    def get_tax(self, obj):
        subtotal = self.get_subtotal(obj)
        return (subtotal * Decimal("0.10")).quantize(
            Decimal("0.01")
        )

    def get_shipping(self, obj):
        return Decimal("0.00")

    def get_total(self, obj):
        return (
            self.get_subtotal(obj)
            + self.get_tax(obj)
            + self.get_shipping(obj)
        )


# =========================================================
# ORDER ITEM
# =========================================================

class OrderItemSerializer(serializers.ModelSerializer):

    product_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "price",
            "subtotal",
        ]

    def get_product_name(self, obj):
        if obj.product:
            return obj.product.name

        return "Deleted Product"


# =========================================================
# ORDER
# =========================================================

class OrderSerializer(serializers.ModelSerializer):

    items = OrderItemSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer_name",
            "email",
            "phone",
            "address",
            "payment_method",
            "status",
            "subtotal",
            "tax",
            "shipping",
            "total",
            "items",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "order_number",
            "subtotal",
            "tax",
            "shipping",
            "total",
            "status",
            "created_at",
            "updated_at",
        ]


# =========================================================
# CREATE ORDER
# =========================================================

class CreateOrderSerializer(serializers.Serializer):

    customer_name = serializers.CharField(
        max_length=150
    )

    email = serializers.EmailField()

    phone = serializers.CharField(
        max_length=30
    )

    address = serializers.CharField()

    payment_method = serializers.ChoiceField(
        choices=[
            ("cod", "Cash on Delivery"),
            ("card", "Card"),
            ("bank", "Bank Transfer"),
        ]
    )

    def create(self, validated_data):

        user = self.context["request"].user

        cart, _ = Cart.objects.get_or_create(
            user=user
        )

        cart_items = list(
            cart.items.select_related("product").all()
        )

        if not cart_items:
            raise serializers.ValidationError(
                "Your cart is empty."
            )

        subtotal = Decimal("0.00")

        for item in cart_items:

            if not item.product.is_active:
                raise serializers.ValidationError(
                    f"{item.product.name} is no longer available."
                )

            if item.quantity > item.product.stock:
                raise serializers.ValidationError(
                    f"Only {item.product.stock} unit(s) of "
                    f"{item.product.name} are available."
                )

            subtotal += (
                item.product.price * item.quantity
            )

        tax = (
            subtotal * Decimal("0.10")
        ).quantize(Decimal("0.01"))

        shipping = Decimal("0.00")

        total = (
            subtotal
            + tax
            + shipping
        ).quantize(Decimal("0.01"))

        order = Order.objects.create(
            user=user,
            customer_name=validated_data["customer_name"],
            email=validated_data["email"],
            phone=validated_data["phone"],
            address=validated_data["address"],
            payment_method=validated_data["payment_method"],
            subtotal=subtotal,
            tax=tax,
            shipping=shipping,
            total=total,
        )

        order.order_number = f"NX-{order.id:06d}"
        order.save(
            update_fields=["order_number"]
        )

        for item in cart_items:

            item_subtotal = (
                item.product.price * item.quantity
            ).quantize(Decimal("0.01"))

            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price,
                subtotal=item_subtotal,
            )

            item.product.stock -= item.quantity
            item.product.save(
                update_fields=["stock"]
            )

        cart.items.all().delete()

        return order


# =========================================================
# REVIEW
# =========================================================

class ReviewSerializer(serializers.ModelSerializer):

    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "product",
            "user",
            "user_name",
            "rating",
            "comment",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "user_name",
            "created_at",
            "updated_at",
        ]

    def get_user_name(self, obj):
        return obj.user.username

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Rating must be between 1 and 5."
            )

        return value
