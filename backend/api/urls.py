from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'bank-accounts', views.BankAccountViewSet, basename='bankaccount')
router.register(r'mutual-funds', views.MutualFundSchemeViewSet, basename='mutualfund')
router.register(r'transactions', views.MFTransactionViewSet, basename='transaction')
router.register(r'portfolio', views.PortfolioViewSet, basename='portfolio')

urlpatterns = [
    path('auth/register/', views.register, name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', views.get_current_user, name='current_user'),
    path('mutual-funds/purchase/', views.purchase_mutual_fund, name='purchase_mutual_fund'),
    path('', include(router.urls)),
]





