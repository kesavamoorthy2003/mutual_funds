from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import BankAccount, MutualFundScheme, Portfolio, MFTransaction
from decimal import Decimal

User = get_user_model()

# --- USER SERIALIZERS ---
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password2', 'first_name', 'last_name', 'role')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
            role=validated_data.get('role', 'CUSTOMER')
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role')
        read_only_fields = ('id',)


# --- BANK ACCOUNT SERIALIZERS ---
class BankAccountSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = BankAccount
        fields = ('id', 'user', 'user_username', 'account_number', 'ifsc_code',
                  'bank_name', 'balance', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def validate_balance(self, value):
        if value < 0:
            raise serializers.ValidationError("Balance cannot be negative.")
        return value


class BankAccountUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = ('account_number', 'ifsc_code', 'bank_name')


class BalanceUpdateSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    operation = serializers.ChoiceField(choices=['ADD', 'SET'])

    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Amount cannot be negative.")
        return value


# --- MUTUAL FUND SCHEME SERIALIZERS ---
class MutualFundSchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MutualFundScheme
        fields = ('id', 'name', 'scheme_code', 'description', 'category',
                  'nav', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_nav(self, value):
        if value <= 0:
            raise serializers.ValidationError("NAV must be greater than zero.")
        return value


class NAVUpdateSerializer(serializers.Serializer):
    nav = serializers.DecimalField(max_digits=10, decimal_places=4)

    def validate_nav(self, value):
        if value <= 0:
            raise serializers.ValidationError("NAV must be greater than zero.")
        return value


# --- TRANSACTION & PURCHASE SERIALIZERS ---
class MFTransactionSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    scheme_name = serializers.CharField(source='scheme.name', read_only=True)

    class Meta:
        model = MFTransaction
        fields = ('id', 'user', 'user_username', 'scheme', 'scheme_name',
                  'transaction_type', 'units', 'nav_at_transaction', 'amount', 'transaction_date')
        read_only_fields = ('id', 'user', 'nav_at_transaction', 'transaction_date')


class MFPurchaseSerializer(serializers.Serializer):
    scheme_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Investment amount must be greater than zero.")
        if value < Decimal('100.00'):
            raise serializers.ValidationError("Minimum investment amount is 100.")
        return value

    def validate_scheme_id(self, value):
        try:
            scheme = MutualFundScheme.objects.get(id=value, is_active=True)
        except MutualFundScheme.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive mutual fund scheme.")
        return value


# --- PORTFOLIO SERIALIZERS ---
class PortfolioSerializer(serializers.ModelSerializer):
    scheme_name = serializers.CharField(source='scheme.name', read_only=True)
    scheme_code = serializers.CharField(source='scheme.scheme_code', read_only=True)
    current_nav = serializers.DecimalField(source='scheme.nav', max_digits=10, decimal_places=4, read_only=True)
    current_value = serializers.SerializerMethodField()
    profit_loss = serializers.SerializerMethodField()
    profit_loss_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = ('id', 'user', 'scheme', 'scheme_name', 'scheme_code',
                  'units', 'invested_amount', 'current_nav', 'current_value',
                  'profit_loss', 'profit_loss_percentage', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def get_current_value(self, obj):
        return float(obj.current_value())

    def get_profit_loss(self, obj):
        return float(obj.profit_loss())

    def get_profit_loss_percentage(self, obj):
        if obj.invested_amount > 0:
            return float((obj.profit_loss() / obj.invested_amount) * 100)
        return 0.0


class UserPortfolioSerializer(serializers.Serializer):
    user = UserSerializer()
    portfolios = PortfolioSerializer(many=True)
    total_invested = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_current_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_profit_loss = serializers.DecimalField(max_digits=15, decimal_places=2)