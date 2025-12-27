from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, BankAccount, MutualFundScheme, Portfolio, MFTransaction

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )

@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'account_number', 'bank_name', 'balance', 'created_at')
    search_fields = ('account_number', 'user__username', 'bank_name')
    list_filter = ('bank_name', 'created_at')

@admin.register(MutualFundScheme)
class MutualFundSchemeAdmin(admin.ModelAdmin):
    list_display = ('name', 'scheme_code', 'category', 'nav', 'is_active', 'updated_at')
    search_fields = ('name', 'scheme_code')
    list_filter = ('category', 'is_active', 'created_at')

@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ('user', 'scheme', 'units', 'invested_amount', 'updated_at')
    search_fields = ('user__username', 'scheme__name')
    list_filter = ('created_at', 'updated_at')

@admin.register(MFTransaction)
class MFTransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'scheme', 'transaction_type', 'units', 'amount', 'transaction_date')
    search_fields = ('user__username', 'scheme__name')
    list_filter = ('transaction_type', 'transaction_date')
    readonly_fields = ('transaction_date',)
