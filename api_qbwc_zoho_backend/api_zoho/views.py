from django.shortcuts import redirect, render
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from django.core import serializers
from django.forms.models import model_to_dict
from django.db.models import Q, Count
from django.db.models.functions import TruncMonth, TruncDate
import requests
import os
import re
import logging
import json
from django.urls import reverse
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from datetime import datetime, timezone, timedelta
from .models import AppConfig, ZohoLoading, LoginUser, ApiTrackingLogs
from .forms import AppConfigForm
from .backup_db import create_backup
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from api_zoho_invoices.models import ZohoFullInvoice

#############################################
# Configura el logging
#############################################

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@ensure_csrf_cookie
def csrf_token_view(request):
    csrf_token = get_token(request)
    print(csrf_token)
    return JsonResponse({'csrftoken': csrf_token})

#############################################
# Login View
#############################################

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
            if user is not None:
                login(request, user)
                logger.info(f'User {username} logged in')
                manage_api_tracking_log(username, 'login', request.META.get('REMOTE_ADDR'), 'User logged in')
                return JsonResponse({'status': 'success', 'is_staff': 'admin' if user.is_staff else 'user', 'username': user.username}, status=200)
            return JsonResponse({'error': 'Invalid credentials'}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


#############################################
# Logout view
#############################################


@csrf_exempt
def logout_view(request):
    if request.method == 'GET':
        username = request.GET.get('username')
        logout(request) 
        if username:
            manage_api_tracking_log(username, 'logout', request.META.get('REMOTE_ADDR'), 'User logged out')
        return JsonResponse({'status': 'success'}, status=200)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


#############################################
# Users Fetch
#############################################

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        users = LoginUser.objects.filter(is_active=True).order_by('username')
        users_json = serializers.serialize('json', list(users)) 
        users_data = json.loads(users_json)
        
        for user in users_data:
            del user['fields']['password']
            user['fields']['role'] = 'Admin' if user['fields']['is_staff'] else 'User'
        
        return JsonResponse([user['fields'] for user in users_data], safe=False, status=200)
    
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)

#############################################
# Get User
#############################################

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_user(request, username):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        user = LoginUser.objects.filter(username=username).first()
        if not user:
            return JsonResponse({'error': 'User not found'}, status=404)
        user = model_to_dict(user)
        del user['password']
        user['role'] = 'Admin' if user['is_staff'] else 'User'
        return JsonResponse(user, status=200)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)

#############################################
# Manage User
#############################################

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manage_user(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        try:
            data = json.loads(request.body) 
            username = data.get('username')
            password = data.get('password')
            role = data.get('role')
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            email = data.get('email')
            is_new = data.get('is_new')
            is_staff = True if role == 'admin' else False
            logged_username = data.get('logged_username')
            user = LoginUser.objects.filter(username=username).first()
            if not user:
                user = LoginUser.objects.create_user(
                    username=username, email=email, password=password, is_staff=is_staff, first_name=first_name, last_name=last_name
                )
                action, message, msg_response = 'create_user', 'Create user', 'created'
            else:
                if not is_new:
                    user.first_name = first_name
                    user.last_name = last_name
                    user.email = email
                    user.is_staff = is_staff
                    user.set_password(password)
                    user.save()
                    action, message, msg_response = 'update_user', 'Update user', 'updated'
                else:
                    return JsonResponse({'error': 'User already exists'}, status=400)
        except LoginUser.DoesNotExist:
            return JsonResponse({'error': 'User not found or could not be created'}, status=404)
        user = model_to_dict(user)
        user['message'] = f'User {user["username"]} has been {msg_response}'
        logger.info(f'User {user["username"]} has been {msg_response}')
        manage_api_tracking_log(logged_username, action, request.META.get('REMOTE_ADDR'), message)
        return JsonResponse(user, status=200)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_user_status(request, username):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        try:
            data = json.loads(request.body) 
            logged_username = data.get('logged_username')
            user = LoginUser.objects.filter(username=username).first()
            if not user:
                return JsonResponse({'error': f'User {username} not found'}, status=404)
            else:
                user.is_active = not user.is_active
                user.save()
                action, message = 'set_user_status', 'Set user status'
        except LoginUser.DoesNotExist:
            return JsonResponse({'error': f'User {username} not found'}, status=404)
        user = model_to_dict(user)
        user['message'] = f'User {user["username"]} has been setted to {"active" if user["is_active"] else "inactive"}'
        logger.info(f'User {user["username"]} has been settet to {"active" if user["is_active"] else "inactive"}')
        manage_api_tracking_log(logged_username, action, request.META.get('REMOTE_ADDR'), message)
        return JsonResponse(user, status=200)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


#############################################
# Logging Fetch
#############################################

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_loggings(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        loggings = ApiTrackingLogs.objects.all().order_by('-log_modified', 'log_user')
        loggings_json = serializers.serialize('json', list(loggings)) 
        loggings_data = json.loads(loggings_json)
        
        return JsonResponse([log['fields'] for log in loggings_data], safe=False, status=200)
    
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


#############################################
# Auth URLs
#############################################


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_auth_url(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        app_config = AppConfig.objects.first()
        client_id = app_config.zoho_client_id
        redirect_uri = app_config.zoho_redirect_uri
        scopes = settings.ZOHO_SCOPE_INVOICES + ',' + settings.ZOHO_SCOPE_ITEMS + ',' + settings.ZOHO_SCOPE_CUSTOMERS
        auth_url = f"https://accounts.zoho.com/oauth/v2/auth?scope={scopes}&client_id={client_id}&response_type=code&access_type=offline&redirect_uri={redirect_uri}"
        # return redirect(auth_url)
        return JsonResponse({'auth_url': auth_url}, status=200)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


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


#############################################
# GET THE ZOHO API ACCESS TOKEN
#############################################

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def zoho_api_settings(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
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
        return JsonResponse(data, status=200)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


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


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def application_settings(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
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
    return JsonResponse({'status': 'error', 'message': 'Invalid token'}, status=401) 


@csrf_exempt
def zoho_loading(request):
    if request.method == 'GET':
        zoho_loading_items = ZohoLoading.objects.filter(zoho_module='items').order_by('-zoho_record_created').first()
        zoho_loading_invoices = ZohoLoading.objects.filter(zoho_module='invoices').order_by('-zoho_record_created').first()
        zoho_loading_customers = ZohoLoading.objects.filter(zoho_module='customers').order_by('-zoho_record_created').first()
        context = {
            'zoho_loading_items': model_to_dict(zoho_loading_items) if zoho_loading_items else {},
            'zoho_loading_invoices': model_to_dict(zoho_loading_invoices) if zoho_loading_invoices else {},
            'zoho_loading_customers': model_to_dict(zoho_loading_customers) if zoho_loading_customers else {},
        }
        return JsonResponse(context)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)  


def create_zoho_loading_instance(module):
    item = ZohoLoading()
    item.zoho_module = module
    item.zoho_record_created = datetime.now(timezone.utc)
    item.zoho_record_updated = datetime.now(timezone.utc)
    return item 


def validateJWTTokenRequest(request):
    auth_header = request.headers.get('Authorization')
    if auth_header:
        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        try:
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            return True if user else False
        except (InvalidToken, TokenError) as e:
            return False
    else:
        return False
    
#############################################
# QUERIES TO DATACHARTS
#############################################

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def data_invoice_historic_statistics(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        invoices = ZohoFullInvoice.objects.all()
        stats = invoices.aggregate(
                matched_number=Count('id', filter=Q(inserted_in_qb=True)),
                total_items_unmatched=Count('id', filter=Q(items_unmatched__isnull=False, items_unmatched__gt=0)),
                total_customers_unmatched=Count('id', filter=Q(customer_unmatched__isnull=False, customer_unmatched__gt=0)),
                unprocessed_number=Count('id', filter=Q(inserted_in_qb=False))
            )
        matched_number = stats['matched_number']
        total_items_unmatched = stats['total_items_unmatched']
        total_customers_unmatched = stats['total_customers_unmatched']
        unmatched_number = max(total_items_unmatched, total_customers_unmatched)
        unprocessed_number = stats['unprocessed_number'] - unmatched_number
        total_number = invoices.count()
        
        return JsonResponse({
            'matched_per_cent': matched_number / total_number if total_number > 0 else 0,
            'unmatched_per_cent': unmatched_number / total_number if total_number > 0 else 0,
            'unprocessed_per_cent': unprocessed_number / total_number if total_number > 0 else 0,
        }, status=200)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def data_invoice_monthly_statistics(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        five_months_ago = datetime.now() - timedelta(days=5*30)
        invoices = ZohoFullInvoice.objects.filter(date__gte=five_months_ago)
        
        stats = invoices.annotate(month=TruncMonth('date')).values('month').annotate(
            matched_number=Count('id', filter=Q(inserted_in_qb=True)),
            total_items_unmatched=Count('id', filter=Q(items_unmatched__isnull=False, items_unmatched__gt=0)),
            total_customers_unmatched=Count('id', filter=Q(customer_unmatched__isnull=False, customer_unmatched__gt=0)),
            unprocessed_number=Count('id', filter=Q(inserted_in_qb=False))
        ).order_by('month')
        
        response_data = []
        for stat in stats:
            month = stat['month'].strftime('%Y-%m') 
            total_number = invoices.filter(date__month=stat['month'].month, date__year=stat['month'].year).count()
            matched_number = stat['matched_number']
            total_items_unmatched = stat['total_items_unmatched']
            total_customers_unmatched = stat['total_customers_unmatched']
            unmatched_number = max(total_items_unmatched, total_customers_unmatched)
            unprocessed_number = stat['unprocessed_number'] - unmatched_number
            
            response_data.append({
                'month': month,
                'matched_number': matched_number,
                'unmatched_number': unmatched_number,
                'unprocessed_number': unprocessed_number,
                'total_number': total_number,
            })
        
        return JsonResponse(response_data, safe=False, status=200)
    
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def data_invoice_daily_statistics(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        seven_days_ago = datetime.now() - timedelta(days=7)
        
        invoices = ZohoFullInvoice.objects.filter(date__gte=seven_days_ago)
        
        stats = invoices.annotate(day=TruncDate('date')).values('day').annotate(
            matched_number=Count('id', filter=Q(inserted_in_qb=True)),
            total_items_unmatched=Count('id', filter=Q(items_unmatched__isnull=False, items_unmatched__gt=0)),
            total_customers_unmatched=Count('id', filter=Q(customer_unmatched__isnull=False, customer_unmatched__gt=0)),
            unprocessed_number=Count('id', filter=Q(inserted_in_qb=False))
        ).order_by('day')
        
        response_data = []
        for stat in stats:
            day = stat['day'].strftime('%Y-%m-%d')
            total_number = invoices.annotate(day=TruncDate('date')).filter(day=stat['day']).count()
            
            matched_number = stat['matched_number']
            total_items_unmatched = stat['total_items_unmatched']
            total_customers_unmatched = stat['total_customers_unmatched']
            unmatched_number = max(total_items_unmatched, total_customers_unmatched)
            unprocessed_number = stat['unprocessed_number'] - unmatched_number
            
            response_data.append({
                'day': day,
                'matched_number': matched_number,
                'unmatched_number': unmatched_number,
                'unprocessed_number': unprocessed_number,
                'total_number': total_number,
            })
        
        return JsonResponse(response_data, safe=False, status=200)
    
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


#############################################
# API Tracking Logs
#############################################

def manage_api_tracking_log(user, action, pc_ip, message):
    log = ApiTrackingLogs.objects.filter(log_user=user, log_action=action, log_pc_ip=pc_ip, log_message=message).first()
    if not log:
        log = ApiTrackingLogs()
        log.log_user = user
        log.log_action = action
        log.log_pc_ip = pc_ip
        log.log_created = datetime.now(timezone.utc)
        log.log_message = message
    log.log_modified = datetime.now(timezone.utc)
    log.save()


#############################################
# DO BACKUP DB
#############################################

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def do_backup_db(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        if create_backup():
            username = request.GET.get('username')
            manage_api_tracking_log(username, 'backup_db', request.META.get('REMOTE_ADDR'), 'Backup DB')
            return JsonResponse({'message': 'Backup DB started successfully.'}, status=200)
        return JsonResponse({'error': 'Error creating the backup.'}, status=500)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_backup_db(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        backup_dir = settings.PATH_FROM_BACKUP_DB
        files = os.listdir(backup_dir)
        files.sort(reverse=True)
        pattern = r"backup_(\d{8})_(\d{6})\.(\w+)"
        list_of_files = []
        
        for file in files:
        
            match = re.search(pattern, file)

            if match:
                date_str = match.group(1)  
                time_str = match.group(2)  
                file_type = match.group(3)
                
                # Convertir las cadenas de fecha y hora en un objeto datetime
                date_time_str = f"{date_str} {time_str}"
                date_time_obj = datetime.strptime(date_time_str, '%Y%m%d %H%M%S')
                
                file_path = os.path.join(backup_dir, file)
                file_size = os.path.getsize(file_path)
                formatted_size = format_size(file_size)
                
                list_of_files.append({
                    'file_name': file,
                    'date_time': date_time_obj.strftime('%Y-%m-%d %H:%M:%S'),
                    'file_type': file_type.upper(),
                    'size': formatted_size
                })
        
        return JsonResponse({'backups': list_of_files}, status=200)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


def format_size(size_bytes):
    """Convierte el tamaño en bytes a KB, MB o GB dependiendo del tamaño."""
    if size_bytes < 1024:
        return f"{size_bytes} bytes"
    elif size_bytes < 1024 ** 2:
        return f"{size_bytes / 1024:.2f} KB"
    elif size_bytes < 1024 ** 3:
        return f"{size_bytes / (1024 ** 2):.2f} MB"
    else:
        return f"{size_bytes / (1024 ** 3):.2f} GB"
    

def clean_phone_number(phone_number):
    # Filtra solo los caracteres que son dígitos y une los resultados en una sola cadena
    return ''.join([c for c in phone_number if c.isdigit()])