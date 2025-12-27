from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Sum, F
from decimal import Decimal, ROUND_DOWN

from .models import BankAccount, MutualFundScheme, Portfolio, MFTransaction
from .serializers import (
    UserRegistrationSerializer, UserSerializer, BankAccountSerializer,
    BankAccountUpdateSerializer, BalanceUpdateSerializer,
    MutualFundSchemeSerializer, NAVUpdateSerializer, MFTransactionSerializer,
    MFPurchaseSerializer, PortfolioSerializer, UserPortfolioSerializer
)
from .permissions import IsAdmin, IsCustomer, IsAdminOrReadOnly, IsOwnerOrAdmin

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    @action(detail=True, methods=['get'])
    def portfolio(self, request, pk=None):
        user = self.get_object()
        portfolios = Portfolio.objects.filter(user=user).select_related('scheme')

        total_invested = portfolios.aggregate(
            total=Sum('invested_amount')
        )['total'] or Decimal('0.00')

        total_current_value = sum([p.current_value() for p in portfolios])
        total_profit_loss = total_current_value - total_invested

        data = {
            'user': UserSerializer(user).data,
            'portfolios': PortfolioSerializer(portfolios, many=True).data,
            'total_invested': total_invested,
            'total_current_value': total_current_value,
            'total_profit_loss': total_profit_loss,
        }

        # Return data directly to avoid serialization issues
        return Response(data)


class BankAccountViewSet(viewsets.ModelViewSet):
    serializer_class = BankAccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return BankAccount.objects.all()
        return BankAccount.objects.filter(user=self.request.user)

    # --- Prevent Duplicate Account Creation ---
    def create(self, request, *args, **kwargs):
        if BankAccount.objects.filter(user=request.user).exists():
            return Response(
                {"error": "You already have a bank account linked. Please refresh the page."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = BankAccountUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(BankAccountSerializer(instance).data)

    @action(detail=True, methods=['post'])
    def update_balance(self, request, pk=None):
        bank_account = self.get_object()
        serializer = BalanceUpdateSerializer(data=request.data)

        if serializer.is_valid():
            amount = serializer.validated_data['amount']
            operation = serializer.validated_data['operation']

            if operation == 'ADD':
                bank_account.balance += amount
            elif operation == 'SET':
                bank_account.balance = amount

            bank_account.save()
            return Response(BankAccountSerializer(bank_account).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MutualFundSchemeViewSet(viewsets.ModelViewSet):
    queryset = MutualFundScheme.objects.all()
    serializer_class = MutualFundSchemeSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = MutualFundScheme.objects.all()
        if self.request.user.role != 'ADMIN':
            queryset = queryset.filter(is_active=True)
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def update_nav(self, request, pk=None):
        scheme = self.get_object()
        serializer = NAVUpdateSerializer(data=request.data)

        if serializer.is_valid():
            scheme.nav = serializer.validated_data['nav']
            scheme.save()
            return Response(MutualFundSchemeSerializer(scheme).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MFTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MFTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return MFTransaction.objects.all().select_related('user', 'scheme')
        return MFTransaction.objects.filter(user=self.request.user).select_related('scheme')


# --- FINAL FIXED PURCHASE FUNCTION ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_mutual_fund(request):
    try:
        serializer = MFPurchaseSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        scheme_id = serializer.validated_data['scheme_id']
        amount = serializer.validated_data['amount']
        user = request.user

        # Use atomic transaction block for safety
        with transaction.atomic():
            # 1. Lock Bank Account (Must be inside atomic block)
            try:
                bank_account = BankAccount.objects.select_for_update().get(user=user)
            except BankAccount.DoesNotExist:
                return Response(
                    {'error': 'Bank account not found. Please add bank details first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Check Balance
            if bank_account.balance < amount:
                return Response(
                    {'error': f'Insufficient balance. Available: {bank_account.balance}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 3. Get Scheme
            try:
                scheme = MutualFundScheme.objects.get(id=scheme_id, is_active=True)
            except MutualFundScheme.DoesNotExist:
                return Response(
                    {'error': 'Mutual fund scheme not found or inactive.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 4. Calculate Units (Decimal Precision Fix)
            # Quantize rounds to 4 decimal places (e.g. 7.9397) to fit DB
            raw_units = Decimal(amount) / Decimal(scheme.nav)
            units = raw_units.quantize(Decimal("0.0001"), rounding=ROUND_DOWN)

            # 5. Deduct Balance
            bank_account.balance -= Decimal(amount)
            bank_account.save()

            # 6. Create Transaction
            mf_transaction = MFTransaction.objects.create(
                user=user,
                scheme=scheme,
                transaction_type='BUY',
                units=units,
                nav_at_transaction=scheme.nav,
                amount=amount
            )

            # 7. Update Portfolio
            portfolio, created = Portfolio.objects.get_or_create(
                user=user,
                scheme=scheme,
                defaults={'units': Decimal('0.0000'), 'invested_amount': Decimal('0.00')}
            )

            portfolio.units += units
            portfolio.invested_amount += Decimal(amount)
            portfolio.save()

            return Response({
                'message': 'Purchase successful!',
                'units_allotted': float(units),
                'remaining_balance': float(bank_account.balance),
                'transaction': MFTransactionSerializer(mf_transaction).data,
                'portfolio': PortfolioSerializer(portfolio).data
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"Purchase Error: {str(e)}") # Log unexpected errors
        return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PortfolioViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PortfolioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return Portfolio.objects.all().select_related('user', 'scheme')
        return Portfolio.objects.filter(user=self.request.user).select_related('scheme')

    @action(detail=False, methods=['get'])
    def summary(self, request):
        user = request.user
        portfolios = Portfolio.objects.filter(user=user).select_related('scheme')

        total_invested = portfolios.aggregate(
            total=Sum('invested_amount')
        )['total'] or Decimal('0.00')

        total_current_value = sum([p.current_value() for p in portfolios])
        total_profit_loss = total_current_value - total_invested

        # --- FIX: Return Data Directly (Avoids 'int' has no pk error) ---
        data = {
            'user': UserSerializer(user).data,
            'portfolios': PortfolioSerializer(portfolios, many=True).data,
            'total_invested': total_invested,
            'total_current_value': total_current_value,
            'total_profit_loss': total_profit_loss,
        }

        # Do NOT pass data to UserPortfolioSerializer here
        return Response(data)