"""
URL configuration for project_api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
import api_zoho.views as zoho_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('logout/', zoho_views.logout_view, name='logout'),
    path('', zoho_views.login_view, name='login'),
    path('home/', zoho_views.home, name='home'),
    path('api_zoho/', include('api_zoho.urls')), 
    path('api_zoho_customers/', include('api_zoho_customers.urls')), 
    path('api_zoho_items/', include('api_zoho_items.urls')), 
    path('api_zoho_invoices/', include('api_zoho_invoices.urls')), 
    path('api_quickbook_soap/', include('api_quickbook_soap.urls')),
]
