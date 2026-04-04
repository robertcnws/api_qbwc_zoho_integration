# project/urls.py
from django.urls import path
from . import views

app_name = 'api_zoho_sales_orders'

urlpatterns = [
    path("list_purchase_orders/", views.list_purchase_orders, name="list_purchase_orders"),
    path("load_purchase_orders/", views.load_purchase_orders, name="load_purchase_orders"),
    path("delete_purchase_order/<str:purchase_order_id>/", views.delete_purchase_order, name="delete_purchase_order"),
    path("view_purchase_order/<str:purchase_order_id>/", views.view_purchase_order, name="view_purchase_order")
]
