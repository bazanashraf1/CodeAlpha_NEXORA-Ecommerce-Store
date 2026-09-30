
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from rest_framework import status, viewsets
from rest_framework.authentication import (
    TokenAuthentication,
    SessionAuthentication,
)
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    action,
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
    IsAdminUser,
)
from rest_framework.response import Response

from .models import (
    Category,
    Product,
    Cart,
    CartItem,
    Order,
    Review,
)

from .serializers import (
    CategorySerializer,
    ProductSerializer,
    UserSerializer,
    RegisterSerializer,
    CartSerializer,
    OrderSerializer,
    CreateOrderSerializer,
    ReviewSerializer,
)


# =========================================================
# PRODUCT API
# =========================================================

class ProductViewSet(viewsets.ModelViewSet):

    queryset = Product.objects.all()

    serializer_class = ProductSerializer

    def get_permissions(self):

        if self.action in [
            "list",
            "retrieve",
        ]:
            return [AllowAny()]

        return [IsAdminUser()]

    def get_queryset(self):

        queryset = Product.objects.filter(
            is_active=True
        )

        search = self.request.query_params.get(
            "search"
        )

        category = self.request.query_params.get(
            "category"
        )

        min_price = self.request.query_params.get(
            "min_price"
        )

        max_price = self.request.query_params.get(
            "max_price"
        )

        ordering = self.request.query_params.get(
            "ordering"
        )

        if search:
            queryset = queryset.filter(
                name__icontains=search
            )

        if category:
            queryset = queryset.filter(
                category__iexact=category
            )

        if min_price:
            queryset = queryset.filter(
                price__gte=min_price
            )

        if max_price:
            queryset = queryset.filter(
                price__lte=max_price
            )

        if ordering in [
            "price",
            "-price",
            "name",
            "-name",
            "created_at",
            "-created_at",
        ]:
            queryset = queryset.order_by(
                ordering
            )

        return queryset


# =========================================================
# CATEGORY API
# =========================================================

class CategoryViewSet(viewsets.ModelViewSet):

    queryset = Category.objects.filter(
        is_active=True
    )

    serializer_class = CategorySerializer

    def get_permissions(self):

        if self.action in [
            "list",
            "retrieve",
        ]:
            return [AllowAny()]

        return [IsAdminUser()]


# =========================================================
# CART API
# =========================================================

class CartViewSet(viewsets.ViewSet):

    authentication_classes = [
        TokenAuthentication,
        SessionAuthentication,
    ]

    permission_classes = [
        IsAuthenticated
    ]

    def get_cart(self, request):

        cart, _ = Cart.objects.get_or_create(
            user=request.user
        )

        return cart

    # GET /api/cart/

    def list(self, request):

        cart = self.get_cart(request)

        serializer = CartSerializer(
            cart
        )

        return Response(
            serializer.data
        )

    # POST /api/cart/add/

    @action(
        detail=False,
        methods=["post"],
        url_path="add"
    )
    def add(self, request):

        product_id = request.data.get(
            "product_id"
        )

        quantity = request.data.get(
            "quantity",
            1
        )

        try:
            product_id = int(product_id)
            quantity = int(quantity)
        except (
            TypeError,
            ValueError
        ):
            return Response(
                {
                    "detail":
                    "product_id and quantity must be valid numbers."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity < 1:
            return Response(
                {
                    "detail":
                    "Quantity must be at least 1."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(
                id=product_id,
                is_active=True
            )
        except Product.DoesNotExist:

            return Response(
                {
                    "detail":
                    "Product not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        cart = self.get_cart(request)

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={
                "quantity": quantity
            }
        )

        if not created:

            new_quantity = (
                item.quantity + quantity
            )

            if new_quantity > product.stock:
                return Response(
                    {
                        "detail":
                        f"Only {product.stock} unit(s) available."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            item.quantity = new_quantity
            item.save()

        if item.quantity > product.stock:

            item.quantity = product.stock
            item.save()

            return Response(
                {
                    "detail":
                    f"Only {product.stock} unit(s) available."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_201_CREATED
        )

    # PATCH /api/cart/update/

    @action(
        detail=False,
        methods=["patch"],
        url_path="update"
    )
    def update_item(self, request):

        item_id = request.data.get(
            "item_id"
        )

        quantity = request.data.get(
            "quantity"
        )

        try:
            item_id = int(item_id)
            quantity = int(quantity)
        except (
            TypeError,
            ValueError
        ):
            return Response(
                {
                    "detail":
                    "item_id and quantity must be valid numbers."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        cart = self.get_cart(request)

        try:
            item = CartItem.objects.select_related(
                "product"
            ).get(
                id=item_id,
                cart=cart
            )
        except CartItem.DoesNotExist:

            return Response(
                {
                    "detail":
                    "Cart item not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if quantity <= 0:

            item.delete()

            return Response(
                CartSerializer(cart).data
            )

        if quantity > item.product.stock:

            return Response(
                {
                    "detail":
                    f"Only {item.product.stock} unit(s) available."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        item.quantity = quantity
        item.save()

        return Response(
            CartSerializer(cart).data
        )

    # DELETE /api/cart/remove/

    @action(
        detail=False,
        methods=["delete"],
        url_path="remove"
    )
    def remove(self, request):

        item_id = request.data.get(
            "item_id"
        )

        try:
            item_id = int(item_id)
        except (
            TypeError,
            ValueError
        ):
            return Response(
                {
                    "detail":
                    "item_id must be a valid number."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        cart = self.get_cart(request)

        try:
            item = CartItem.objects.get(
                id=item_id,
                cart=cart
            )
        except CartItem.DoesNotExist:

            return Response(
                {
                    "detail":
                    "Cart item not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        item.delete()

        return Response(
            CartSerializer(cart).data
        )


# =========================================================
# ORDER API
# =========================================================

class OrderViewSet(viewsets.ModelViewSet):

    authentication_classes = [
        TokenAuthentication,
        SessionAuthentication,
    ]

    permission_classes = [
        IsAuthenticated
    ]

    serializer_class = OrderSerializer

    def get_queryset(self):

        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related(
            "items__product"
        )

    def create(self, request):

        serializer = CreateOrderSerializer(
            data=request.data,
            context={
                "request": request
            }
        )

        serializer.is_valid(
            raise_exception=True
        )

        order = serializer.save()

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )

    # POST /api/orders/<id>/cancel/

    @action(
        detail=True,
        methods=["post"],
        url_path="cancel"
    )
    def cancel(self, request, pk=None):

        try:
            order = self.get_queryset().get(
                pk=pk
            )
        except Order.DoesNotExist:

            return Response(
                {
                    "detail":
                    "Order not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if order.status != "pending":

            return Response(
                {
                    "detail":
                    "Only pending orders can be cancelled."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = "cancelled"
        order.save(
            update_fields=["status"]
        )

        return Response(
            OrderSerializer(order).data
        )


# =========================================================
# REVIEW API
# =========================================================

class ReviewViewSet(viewsets.ModelViewSet):

    queryset = Review.objects.select_related(
        "user",
        "product"
    )

    serializer_class = ReviewSerializer

    def get_permissions(self):

        if self.action in [
            "list",
            "retrieve",
        ]:
            return [AllowAny()]

        return [IsAuthenticated()]

    def get_queryset(self):

        queryset = super().get_queryset()

        product_id = self.request.query_params.get(
            "product"
        )

        if product_id:
            queryset = queryset.filter(
                product_id=product_id
            )

        return queryset

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )


# =========================================================
# REGISTER
# =========================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):

    serializer = RegisterSerializer(
        data=request.data
    )

    serializer.is_valid(
        raise_exception=True
    )

    user = serializer.save()

    token, _ = Token.objects.get_or_create(
        user=user
    )

    return Response(
        {
            "message":
            "Account created successfully.",
            "token":
            token.key,
            "user":
            UserSerializer(user).data,
        },
        status=status.HTTP_201_CREATED
    )


# =========================================================
# LOGIN
# =========================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):

    username = request.data.get(
        "username"
    )

    password = request.data.get(
        "password"
    )

    if not username or not password:

        return Response(
            {
                "detail":
                "Username and password are required."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(
        username=username,
        password=password
    )

    if user is None:

        return Response(
            {
                "detail":
                "Invalid username or password."
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    token, _ = Token.objects.get_or_create(
        user=user
    )

    Cart.objects.get_or_create(
        user=user
    )

    return Response(
        {
            "message":
            "Login successful.",
            "token":
            token.key,
            "user":
            UserSerializer(user).data,
        }
    )


# =========================================================
# LOGOUT
# =========================================================

@api_view(["POST"])
@authentication_classes([
    TokenAuthentication,
    SessionAuthentication,
])
@permission_classes([IsAuthenticated])
def logout(request):

    if hasattr(
        request.user,
        "auth_token"
    ):
        request.user.auth_token.delete()

    return Response(
        {
            "message":
            "Logged out successfully."
        }
    )


# =========================================================
# PROFILE
# =========================================================

@api_view(["GET"])
@authentication_classes([
    TokenAuthentication,
    SessionAuthentication,
])
@permission_classes([IsAuthenticated])
def profile(request):

    return Response(
        UserSerializer(
            request.user
        ).data
    )
