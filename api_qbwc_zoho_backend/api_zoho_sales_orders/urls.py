# project/urls.py
from django.urls import path
from . import views

app_name = 'api_zoho_sales_orders'

urlpatterns = [
    path("list_sales_orders/", views.list_sales_orders, name="list_sales_orders"),
    path("load_sales_orders/", views.load_sales_orders, name="load_sales_orders"),
    path("delete_sales_order/<str:sales_order_id>/", views.delete_sales_order, name="delete_sales_order"),
    path("view_sales_order/<str:sales_order_id>/", views.view_sales_order, name="view_sales_order")
]
