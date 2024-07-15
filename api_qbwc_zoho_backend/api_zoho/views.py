from django.shortcuts import redirect, render
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from django.core import serializers
from django.forms.models import model_to_dict
import requests
import os
import logging
import json
from django.urls import reverse
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from datetime import datetime, timezone
from .models import AppConfig, ZohoLoading
from .forms import ApiZohoForm, LoginForm, AppConfigForm

#############################################
# Configura el logging
#############################################

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def csrf_token_view(request):
    csrf_token = get_token(request)
    return JsonResponse({'csrfToken': csrf_token})

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  # Carga los datos JSON del cuerpo de la solicitud
            username = data.get('username')  # Obtiene el nombre de usuario del JSON
            password = data.get('password')  # Obtiene la contraseña del JSON

            # Verifica si se recibieron los datos necesarios
            if not username or not password:
                return JsonResponse({'error': 'Username and password required'}, status=400)
            user = authenticate(request, username=username, password=password)
            logger.info(user)   
            if user is not None:
                login(request, user)
                logger.info('User logged in')
                return JsonResponse({'status': 'success'}, status=200)
            return JsonResponse({'error': 'Invalid credentials'}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def logout_view(request):
    if request.method == 'GET':
        logout(request) 
        return JsonResponse({'status': 'success'}, status=200)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def generate_auth_url(request):
    if request.method == 'GET':
        app_config = AppConfig.objects.first()
        client_id = app_config.zoho_client_id
        redirect_uri = app_config.zoho_redirect_uri
        scopes = settings.ZOHO_SCOPE_INVOICES + ',' + settings.ZOHO_SCOPE_ITEMS + ',' + settings.ZOHO_SCOPE_CUSTOMERS
        auth_url = f"https://accounts.zoho.com/oauth/v2/auth?scope={scopes}&client_id={client_id}&response_type=code&access_type=offline&redirect_uri={redirect_uri}"
        # return redirect(auth_url)
        return JsonResponse({'auth_url': auth_url})
    return JsonResponse({'error': 'Method not allowed'}, status=405)


def get_access_token(client_id, client_secret, refresh_token):
    logger.info('Getting access token')
    token_url = "https://accounts.zoho.com/oauth/v2/token"
    if not refresh_token:
        raise Exception("Refresh token is missing")
    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }
    response = requests.post(token_url, data=payload)
    if response.status_code == 200:
        access_token = response.json()["access_token"]
    else:
        raise Exception("Error retrieving access token")
    logger.info(access_token)
    logger.info(refresh_token)
    return access_token


def refresh_zoho_token():
    app_config = AppConfig.objects.first()
    refresh_url = "https://accounts.zoho.com/oauth/v2/token"
    payload = {
        'refresh_token': app_config.zoho_refresh_token,
        'client_id': app_config.zoho_client_id,
        'client_secret': app_config.zoho_client_secret,
        'grant_type': 'refresh_token'
    }
    response = requests.post(refresh_url, data=payload)
    if response.status_code == 200:
        new_token = response.json().get('access_token')
        app_config.zoho_access_token = new_token
        app_config.save()
        return new_token
    else:
        raise Exception("Failed to refresh Zoho token")


@csrf_exempt
def get_refresh_token(request):
    authorization_code = request.GET.get("code", None)
    if not authorization_code:
        return JsonResponse({'error': 'Authorization code is missing'}, status=400)
    
    app_config = AppConfig.objects.first()
    token_url = "https://accounts.zoho.com/oauth/v2/token"
    data = {
        "code": authorization_code,
        "client_id": app_config.zoho_client_id,
        "client_secret": app_config.zoho_client_secret,
        "redirect_uri": app_config.zoho_redirect_uri,
        "grant_type": "authorization_code",
    }

    try:
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        response_json = response.json()
        access_token = response_json.get("access_token", None)
        refresh_token = response_json.get("refresh_token", None)

        if access_token and refresh_token:
            app_config.zoho_refresh_token = refresh_token
            app_config.zoho_access_token = access_token
            app_config.save()
            # Redirige a una página de éxito o muestra un mensaje
            return redirect(f'{settings.FRONTEND_URL}/integration')
        else:
            return JsonResponse({'error': 'Failed to obtain access_token and/or refresh_token'}, status=400)

    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)


# GET THE ZOHO API ACCESS TOKEN
@csrf_exempt
def zoho_api_settings(request):
    if request.method == 'GET':
        app_config = AppConfig.objects.first()
        if not app_config:
            app_config = AppConfig.objects.create()

        connected = (
            app_config.zoho_connection_configured
            and app_config.zoho_refresh_token is not None
            or ""
        )
        auth_url = None
        if not connected:
            auth_url = reverse("api_zoho:generate_auth_url")
        app_config_json = serializers.serialize('json', [app_config])
        app_config_data = json.loads(app_config_json)[0]['fields']
        data = {
            "app_config": app_config_data,
            "connected": connected,
            "auth_url": auth_url,
            "zoho_connection_configured": app_config.zoho_connection_configured,
        }
        return JsonResponse(data)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@login_required(login_url='login')
def zoho_api_connect(request):
    app_config = AppConfig.objects.first()
    if app_config.zoho_connection_configured:
        try:
            get_access_token(
                app_config.zoho_client_id,
                app_config.zoho_client_secret,
                app_config.zoho_refresh_token,
            )
            messages.success(request, "Zoho API connected successfully.")
        except Exception as e:
            messages.error(request, f"Error connecting to Zoho API: {str(e)}")
    else:
        messages.warning(request, "Zoho API connection is not configured yet.")
    return JsonResponse({'message': 'Zoho API connected successfully.'}, status=200)
    # return redirect("api_zoho:zoho_api_settings")


def config_headers(request):
    app_config = AppConfig.objects.first()
    access_token = app_config.zoho_access_token
    if not access_token:
        access_token = get_access_token(
            app_config.zoho_client_id,
            app_config.zoho_client_secret,
            app_config.zoho_refresh_token,
        )
        app_config.zoho_access_token = access_token
        app_config.save()
    headers = {
        "Authorization": f"Zoho-oauthtoken {access_token}"
    }
    return headers


@login_required(login_url='login')
def home(request):
    return render(request, 'api_zoho/base.html')    


# @login_required(login_url='login')  
# def application_settings(request):
#     app_config = AppConfig.objects.first()
#     if request.method == 'POST':
#         app_config.zoho_client_id = request.POST.get('zoho_client_id')
#         logger.info(app_config.zoho_client_id)  
#         app_config.zoho_client_secret = request.POST.get('zoho_client_secret')
#         app_config.zoho_redirect_uri = request.POST.get('zoho_redirect_uri')
#         app_config.zoho_org_id = request.POST.get('zoho_organization_id')
#         app_config.qb_username = request.POST.get('qb_username')
#         app_config.qb_password = request.POST.get('qb_password')
#         app_config.save()
#         messages.success(request, 'Application settings have been updated successfully.')
#     context = {
#         'app_config': app_config
#     }
#     return render(request, 'api_zoho/application_settings.html', context=context)


@csrf_exempt  
def application_settings(request):
    try:
        app_config = AppConfig.objects.first()  # Obtén la primera instancia de AppConfig
    except AppConfig.DoesNotExist:
        return JsonResponse({'error': 'No configuration found.'}, status=404)

    if request.method == 'GET':
        form = AppConfigForm(instance=app_config)
        data = form.initial
        return JsonResponse(data)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body) 
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)

        logger.info(f'POST Data: {data}')

        form = AppConfigForm(data, instance=app_config)
        if form.is_valid():
            form.save()
            return JsonResponse({'message': 'Application settings have been updated successfully.'}, status=200)
        else:
            logger.error(f'Form Errors: {form.errors}')
            return JsonResponse(form.errors, status=400)

    elif request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'content-type, authorization, x-csrftoken'
        return response


@csrf_exempt
def zoho_loading(request):
    if request.method == 'GET':
        zoho_loading_items = ZohoLoading.objects.filter(zoho_module='items').order_by('-zoho_record_created').first()
        zoho_loading_invoices = ZohoLoading.objects.filter(zoho_module='invoices').order_by('-zoho_record_created').first()
        zoho_loading_customers = ZohoLoading.objects.filter(zoho_module='customers').order_by('-zoho_record_created').first()
        context = {
            'zoho_loading_items': model_to_dict(zoho_loading_items),
            'zoho_loading_invoices': model_to_dict(zoho_loading_invoices),
            'zoho_loading_customers': model_to_dict(zoho_loading_customers)
        }
        return JsonResponse(context)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)  


def create_zoho_loading_instance(module):
    item = ZohoLoading()
    item.zoho_module = module
    item.zoho_record_created = datetime.now(timezone.utc)
    item.zoho_record_updated = datetime.now(timezone.utc)
    return item 