from django.urls import path 
from . import views

app_name = 'api_zoho_statistics'

urlpatterns = [
    path('data/data_invoice_historic_statistics/', views.data_invoice_historic_statistics, name='data_invoice_historic_statistics'),
    path('data/data_invoice_monthly_statistics/', views.data_invoice_monthly_statistics, name='data_invoice_monthly_statistics'),
    path('data/data_invoice_daily_statistics/', views.data_invoice_daily_statistics, name='data_invoice_daily_statistics'),
    path('data/data_invoice_trend_statistics/', views.data_invoice_trend_statistics, name='data_invoice_trend_statistics'),
    path('data/data_customer_trend_statistics/', views.data_customer_trend_statistics, name='data_customer_trend_statistics'),
    path('data/data_item_trend_statistics/', views.data_item_trend_statistics, name='data_item_trend_statistics'),
    path('data/data_customer_matched_statistics/', views.data_customer_matched_statistics, name='data_customer_matched_statistics'),
    path('data/data_item_matched_statistics/', views.data_item_matched_statistics, name='data_item_matched_statistics'),
]