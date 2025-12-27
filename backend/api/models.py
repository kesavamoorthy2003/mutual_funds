from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

# 1. Custom User Model
class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('CUSTOMER', 'Customer'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='CUSTOMER')
   

    def __str__(self):
        return f"{self.username} ({self.role})"

    class Meta:
        db_table = 'users'


# 2. Bank Account Model (Linked 1-to-1 with User)
class BankAccount(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='bank_account')
    account_number = models.CharField(max_length=20, unique=True)
    ifsc_code = models.CharField(max_length=11)
    bank_name = models.CharField(max_length=100)
    balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.bank_name}"

    class Meta:
        db_table = 'bank_accounts'


# 3. Mutual Fund Scheme Model
class MutualFundScheme(models.Model):
    name = models.CharField(max_length=200, unique=True)
    scheme_code = models.CharField(max_length=20, unique=True)
    description = models.TextField()
    category = models.CharField(max_length=50)
    nav = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        validators=[MinValueValidator(Decimal('0.0001'))]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (NAV: {self.nav})"

    class Meta:
        db_table = 'mutual_fund_schemes'


# 4. Portfolio Model (Tracks User's Holdings)
class Portfolio(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolios')
    scheme = models.ForeignKey(MutualFundScheme, on_delete=models.CASCADE, related_name='portfolios')
    units = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        default=Decimal('0.0000'),
        validators=[MinValueValidator(Decimal('0.0000'))]
    )
    invested_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def current_value(self):
        return self.units * self.scheme.nav

    def profit_loss(self):
        return self.current_value() - self.invested_amount

    def __str__(self):
        return f"{self.user.username} - {self.scheme.name} ({self.units} units)"

    class Meta:
        db_table = 'portfolios'
        unique_together = ('user', 'scheme')


# 5. Transaction Model (Tracks History)
class MFTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    scheme = models.ForeignKey(MutualFundScheme, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=4, choices=TRANSACTION_TYPES, default='BUY')
    units = models.DecimalField(max_digits=12, decimal_places=4)
    nav_at_transaction = models.DecimalField(max_digits=10, decimal_places=4)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} {self.units} units of {self.scheme.name}"

    class Meta:
        db_table = 'mf_transactions'
        ordering = ['-transaction_date']