# project/urls.py
from django.urls import path  # Importa include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf.urls.static import static
from django.conf import settings
from . import views

app_name = 'api_zoho'

urlpatterns = [
    path("connect/", views.zoho_api_connect, name="zoho_api_connect"),
    
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("list_users/", views.list_users, name="list_users"),
    path("manage_user/", views.manage_user, name="manage_user"),
    path("view_user/", views.view_user, name="view_user"),
    path("zoho_api_settings/", views.zoho_api_settings, name="zoho_api_settings"),
    path("application_settings/", views.application_settings, name="application_settings"),
    path("generate_auth_url/", views.generate_auth_url, name="generate_auth_url"),
    path("get_refresh_token/", views.get_refresh_token, name="get_refresh_token"),
    path("get_csrf_token/", views.csrf_token_view, name="get_csrf_token"),
    path("zoho_loading/", views.zoho_loading, name="zoho_loading"),
    path("do_backup_db/", views.do_backup_db, name="do_backup_db"),
    path("download_backup_db/", views.download_backup_db, name="download_backup_db"),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('data/data_invoice_historic_statistics/', views.data_invoice_historic_statistics, name='data_invoice_historic_statistics'),
    path('data/data_invoice_monthly_statistics/', views.data_invoice_monthly_statistics, name='data_invoice_monthly_statistics'),
    path('data/data_invoice_daily_statistics/', views.data_invoice_daily_statistics, name='data_invoice_daily_statistics'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
