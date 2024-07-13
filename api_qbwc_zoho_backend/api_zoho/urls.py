# project/urls.py
from django.urls import path  # Importa include
from . import views

app_name = 'api_zoho'

urlpatterns = [
    path("connect/", views.zoho_api_connect, name="zoho_api_connect"),
    path("zoho_loading/", views.zoho_loading, name="zoho_loading"),
    
    path("login/", views.login_view, name="login"),
    path("zoho_api_settings/", views.zoho_api_settings, name="zoho_api_settings"),
    path("application_settings/", views.application_settings, name="application_settings"),
    path("generate_auth_url/", views.generate_auth_url, name="generate_auth_url"),
    path("get_refresh_token/", views.get_refresh_token, name="get_refresh_token"),
    path("get_csrf_token/", views.csrf_token_view, name="get_csrf_token"),

]
