# project/urls.py
from django.urls import path
from . import views

app_name = 'api_zoho_invoices'

urlpatterns = [
    path("list_invoices/", views.list_invoices, name="list_invoices"),
    path("load_invoices/", views.load_invoices, name="load_invoices"),
    path("delete_invoice/<str:invoice_id>/", views.delete_invoice, name="delete_invoice"),
    path("view_invoice/<str:invoice_id>/", views.view_invoice, name="view_invoice")
]
