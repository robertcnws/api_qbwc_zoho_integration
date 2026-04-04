from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^api_qbwc_zoho/ws/invoices/$', consumers.InvoicesConsumer.as_asgi()),
    re_path(r'^api_qbwc_zoho/ws/sales_orders/$', consumers.SalesOrdersConsumer.as_asgi()),
    re_path(r'^api_qbwc_zoho/ws/customers/$', consumers.CustomersConsumer.as_asgi()),
    re_path(r'^api_qbwc_zoho/ws/qbwc_items/$', consumers.QbwcItemsConsumer.as_asgi()),
    re_path(r'^api_qbwc_zoho/ws/qbwc_customers/$', consumers.QbwcCustomersConsumer.as_asgi()),
    re_path(r'^api_qbwc_zoho/ws/items/$', consumers.ItemsConsumer.as_asgi()),
]
