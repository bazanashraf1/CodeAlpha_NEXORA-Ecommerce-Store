
from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    ProductViewSet,
    CategoryViewSet,
    CartViewSet,
    OrderViewSet,
    ReviewViewSet,
    register,
    login,
    logout,
    profile,
)


router = DefaultRouter()

router.register(
    "products",
    ProductViewSet,
    basename="products"
)

router.register(
    "categories",
    CategoryViewSet,
    basename="categories"
)

router.register(
    "cart",
    CartViewSet,
    basename="cart"
)

router.register(
    "orders",
    OrderViewSet,
    basename="orders"
)

router.register(
    "reviews",
    ReviewViewSet,
    basename="reviews"
)


urlpatterns = [

    path(
        "",
        include(router.urls)
    ),

    # Authentication
    path(
        "auth/register/",
        register,
        name="register"
    ),

    path(
        "auth/login/",
        login,
        name="login"
    ),

    path(
        "auth/logout/",
        logout,
        name="logout"
    ),

    path(
        "auth/profile/",
        profile,
        name="profile"
    ),
]
