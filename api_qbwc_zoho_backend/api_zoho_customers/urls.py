# project/urls.py
from django.urls import path
from . import views

app_name = 'api_zoho_customers'

urlpatterns = [
    path("list_customers/", views.list_customers, name="list_customers"),
    path("load_customers/", views.load_customers, name="load_customers"),
    path("manage_customers/", views.manage_customers, name="manage_customers"),
    path("view_customer/<str:customer_id>/", views.view_customer, name="view_customer"),
    path("match_one_customer_ajax/", views.match_one_customer_ajax, name="match_one_customer_ajax"),
    path("unmatch_all_customers_ajax/", views.unmatch_all_customers_ajax, name="unmatch_all_customers_ajax"),
]
