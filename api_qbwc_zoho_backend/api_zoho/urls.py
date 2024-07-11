# project/urls.py
from django.contrib import admin
from django.urls import path, include  # Importa include
from . import views

app_name = 'api_zoho'

urlpatterns = [
    path("generate_auth_url/", views.generate_auth_url, name="generate_auth_url"),
    path("get_refresh_token/", views.get_refresh_token, name="get_refresh_token"),
    path("settings/", views.zoho_api_settings, name="zoho_api_settings"),
    path("connect/", views.zoho_api_connect, name="zoho_api_connect"),
    path("application_settings/", views.application_settings, name="application_settings"),
    path("zoho_loading/", views.zoho_loading, name="zoho_loading"),
]
