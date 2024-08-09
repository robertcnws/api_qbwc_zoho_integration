from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.shortcuts import render, get_object_or_404
from django.db import transaction, IntegrityError
from django.db.models import Q, Count
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers
from django.utils.dateparse import parse_date
from django.conf import settings
from datetime import datetime, timezone
from datetime import date as date
from api_zoho_customers.models import ZohoCustomer
from api_zoho_items.models import ZohoItem
from api_zoho_invoices.models import ZohoFullInvoice
from api_zoho.models import AppConfig
from .models import QbItem, QbCustomer, QbLoading
from .tasks import start_qbwc_query_request_task, authenticate_qbwc_request_task
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from celery import chain
from lxml import etree
import difflib
import api_quickbook_soap.soap_service as soap_service
import api_zoho.views as api_zoho_views
import xmltodict
import logging
import re
import json
import numpy as np
import pandas as pd
import rapidfuzz
import math

#############################################
# Configura el logging
#############################################

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

#############################################
# Declarar variables globales
#############################################

counter = 0
soap_customers = []
soap_items = []
similar_customers = []
similar_items = []

#############################################
# Endpoints to Serve SOAP Requests
#############################################

@csrf_exempt
def item_query(request, item_type):
    global soap_items
    return start_qbwc_query_request(request, item_type, soap_items)

@csrf_exempt
def customer_query(request):
    global soap_customers
    return start_qbwc_query_request(request, 'Customer', soap_customers)

@csrf_exempt
def invoice_add_request(request):
    return start_qbwc_invoice_add_request(request)


#############################################
# Home page
#############################################

@login_required(login_url='login')
def quickbook_api_settings(request):
    global soap_customers
    global soap_items
    return render(request, 'api_quickbook_soap/quickbook_api_settings.html')

#############################################
# Trying to get elements here
#############################################

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def qbwc_items(request, is_never_match):
    
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        never_match = True if is_never_match == 'true' else False if is_never_match == 'false' else None
        soap_items_query = QbItem.objects.filter(never_match=never_match).order_by('name') \
                          if never_match is not None else QbItem.objects.filter(never_match=False,matched=False).order_by('name')
        batch_size = 200  
        soap_items = []
        
        for i in range(0, soap_items_query.count(), batch_size):
            batch = soap_items_query[i:i + batch_size]
            soap_items.extend(batch)  # Agregar datos al acumulador
            
        items_data = serializers.serialize('json', soap_items)
        
        return JsonResponse(items_data, safe=False)
    
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def qbwc_customers(request, is_never_match):
    
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        never_match = True if is_never_match == 'true' else False if is_never_match == 'false' else None
        soap_customers_query = QbCustomer.objects.filter(never_match=never_match).order_by('name') \
                               if never_match is not None else QbCustomer.objects.filter(never_match=False,matched=False).order_by('name')
        batch_size = 200  
        soap_customers = []
        
        for i in range(0, soap_customers_query.count(), batch_size):
            batch = soap_customers_query[i:i + batch_size]
            soap_customers.extend(batch)  # Agregar datos al acumulador
        
        customers_data = serializers.serialize('json', soap_customers)
        
        return JsonResponse(customers_data, safe=False)
    
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


#############################################
# Force to sync AJAX methods
#############################################

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def force_to_sync_one_invoice_ajax(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        try:
            data = json.loads(request.body)
            invoice_id = data.get('invoice', '')
            force_to_sync = data.get('force_to_sync', False)
            username = data.get('username', '')
            invoice_model = get_object_or_404(ZohoFullInvoice, invoice_id=invoice_id)
            invoice_model.force_to_sync = force_to_sync
            invoice_model.save()
            api_zoho_views.manage_api_tracking_log(username, 'force_to_sync_one_invoice', request.META.get('REMOTE_ADDR'), 'Forced to sync one invoice')
            
            return JsonResponse({'status': 'success'}, status=200)
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid JWT Token'}, status=401)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def force_to_sync_invoices_ajax(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        try:
            data = json.loads(request.body)
            list_id = data.get('invoices', [])
            username = data.get('username', '')
            print(f"List ID: {list_id}")
            for invoice in list_id:
                invoice_model = get_object_or_404(ZohoFullInvoice, invoice_id=invoice)
                invoice_model.force_to_sync = True
                invoice_model.save()
                api_zoho_views.manage_api_tracking_log(username, 'force_to_sync_invoices', request.META.get('REMOTE_ADDR'), 'Forced to sync invoices')
            return JsonResponse({'status': 'success'}, status=200)
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid JWT Token'}, status=401)


#############################################
# Never match AJAX methods
#############################################


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def never_match_items_ajax(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        try:
            data = json.loads(request.body)
            list_id = data.get('items', [])
            to_match = data.get('to_match', False)
            username = data.get('username', '')
            for item in list_id:
                qb_item = get_object_or_404(QbItem, list_id=item)
                qb_item.never_match = not to_match
                qb_item.save()
                action, message = ('never_match_items', 'Never match items') if not to_match else ('undo_never_match_items', 'Undo never match items')
                api_zoho_views.manage_api_tracking_log(username, action, request.META.get('REMOTE_ADDR'), message)
            return JsonResponse({'message': 'success', 'status': 200})
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid JWT Token'}, status=401)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def never_match_customers_ajax(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        try:
            data = json.loads(request.body)
            list_id = data.get('customers', [])
            to_match = data.get('to_match', False)
            username = data.get('username', '')
            for customer in list_id:
                qb_customer = get_object_or_404(QbCustomer, list_id=customer)
                qb_customer.never_match = not to_match
                qb_customer.save()
                action, message = ('never_match_customers', 'Never match customers') if not to_match else ('undo_never_match_customers', 'Undo never match customers')
                api_zoho_views.manage_api_tracking_log(username, action, request.META.get('REMOTE_ADDR'), message)
            return JsonResponse({'message': 'success'}, status=200)
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid JWT Token'}, status=401)


#############################################
# Trying to get matched elements here
#############################################

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def matching_items(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        pattern = r'^[A-Za-z0-9]{8}-[A-Za-z0-9]{10}$'

        # Usar consultas eficientes con `values` y `annotate`
        qb_items = QbItem.objects.filter(matched=False, never_match=False).values_list('list_id', 'name').order_by('name')
        zoho_items = ZohoItem.objects.filter(
            Q(qb_list_id__isnull=True) | Q(qb_list_id='') | ~Q(qb_list_id__regex=pattern)
        ).values_list('item_id', 'name', 'sku', 'qb_list_id')
        
        # Convertir a DataFrames de Pandas
        qb_df = pd.DataFrame(list(qb_items), columns=['list_id', 'name'])
        zoho_df = pd.DataFrame(list(zoho_items), columns=['item_id', 'name', 'sku', 'qb_list_id'])

        # Preparar los arrays para comparación
        qb_names = qb_df['name'].to_numpy()
        zoho_items_data = zoho_df[['item_id', 'name', 'sku', 'qb_list_id']].to_dict(orient='records')

        # Crear un array vacío para almacenar los resultados
        similar_items = []

        # Comparar items usando `rapidfuzz` para comparación de cadenas más eficiente
        for qb_index, qb_name in enumerate(qb_names):
            dependences_list = []
            for zoho_item_data in zoho_items_data:
                zoho_name = zoho_item_data['name']
                seem = rapidfuzz.fuzz.ratio(qb_name, zoho_name) / 100  # Normaliza a un rango de 0 a 1
                if seem > float(settings.SEEM_ITEMS):
                    # Agregar coincidencias a la lista
                    dependences_list.append({
                        'zoho_item_id': zoho_item_data['item_id'],
                        'zoho_item': zoho_item_data['name'],
                        'zoho_item_sku': zoho_item_data['sku'],
                        'seem': seem,
                        'coincidence': f'{round(seem * 100, 2)} %'
                    })

            if dependences_list:
                # Ordenar dependencias
                sorted_dependences_list = sorted(dependences_list, key=lambda x: x['seem'], reverse=True)
                similar_items.append({
                    'qb_item_list_id': qb_df.iloc[qb_index]['list_id'],
                    'qb_item_name': qb_name,
                    'coincidences_by_order': sorted_dependences_list
                })
                
        return JsonResponse(similar_items, safe=False)
    
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def matching_customers(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        pattern = r'^[A-Za-z0-9]{8}-[A-Za-z0-9]{10}$'

        # Obtener datos de clientes
        qb_customers = QbCustomer.objects.filter(matched=False, never_match=False).values_list('list_id', 'name', 'email', 'phone').order_by('name')
        zoho_customers = ZohoCustomer.objects.filter(
            Q(qb_list_id__isnull=True) | Q(qb_list_id='') | ~Q(qb_list_id__regex=pattern)
        ).values_list('contact_id', 'customer_name', 'email', 'phone', 'company_name')
        logger.info(f"Length Zoho customers: {len(zoho_customers)}")

        # Convertir a DataFrames de Pandas
        qb_df = pd.DataFrame(list(qb_customers), columns=['list_id', 'name', 'email', 'phone'])
        zoho_df = pd.DataFrame(list(zoho_customers), columns=['contact_id', 'customer_name', 'email', 'phone', 'company_name'])

        # Preparar arrays para comparación
        qb_emails = qb_df['email'].to_numpy()
        qb_phones = qb_df['phone'].to_numpy()
        zoho_customers_data = zoho_df[['contact_id', 'customer_name', 'email', 'phone', 'company_name']].to_dict(orient='records')

        # Tamaño de lote para procesamiento
        batch_size = 1000
        num_batches = math.ceil(len(qb_df) / batch_size)
        similar_customers = []

        try:
            threshold = float(settings.SEEM_CUSTOMERS)
        except ValueError:
            return JsonResponse({'error': 'Invalid SEEM_CUSTOMERS value'}, status=500)

        for batch_num in range(num_batches):
            start_idx = batch_num * batch_size
            end_idx = min((batch_num + 1) * batch_size, len(qb_df))
            qb_batch = qb_df.iloc[start_idx:end_idx]
            qb_emails_batch = qb_emails[start_idx:end_idx]
            qb_phones_batch = qb_phones[start_idx:end_idx]

            for qb_index, (qb_email, qb_phone) in enumerate(zip(qb_emails_batch, qb_phones_batch)):
                dependences_list = []
                for zoho_customer_data in zoho_customers_data:
                    zoho_email = zoho_customer_data['email']
                    zoho_phone = zoho_customer_data['phone']

                    if (qb_email or qb_phone) and (zoho_email or zoho_phone):
                        try:
                            seem_email = rapidfuzz.fuzz.ratio(qb_email, zoho_email) / 100 if qb_email and zoho_email else 0
                            seem_phone = rapidfuzz.fuzz.ratio(qb_phone, zoho_phone) / 100 if qb_phone and zoho_phone else 0

                            if (seem_email > threshold or seem_phone > threshold):
                                dependences_list.append({
                                    'zoho_customer_id': zoho_customer_data['contact_id'],
                                    'zoho_customer': zoho_customer_data['customer_name'],
                                    'zoho_company_name': zoho_customer_data['company_name'],
                                    'email': zoho_customer_data['email'],
                                    'seem_email': seem_email,
                                    'coincidence_email': f'{round(seem_email * 100, 2)} %',
                                    'phone': zoho_customer_data['phone'],
                                    'seem_phone': seem_phone,
                                    'coincidence_phone': f'{round(seem_phone * 100, 2)} %'
                                })
                        except Exception as e:
                            logger.error(f"Error during similarity comparison: {e}")

                if dependences_list:
                    sorted_dependences_list = sorted(dependences_list, key=lambda x: x['seem_email'], reverse=True)
                    similar_customers.append({
                        'qb_customer_list_id': qb_batch.iloc[qb_index]['list_id'],
                        'qb_customer_name': qb_batch.iloc[qb_index]['name'],
                        'qb_customer_email': qb_email,
                        'qb_customer_phone': qb_phone,
                        'coincidences_by_order': sorted_dependences_list
                    })

        return JsonResponse(similar_customers, safe=False)

    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


#############################################
# Display matched elements
#############################################

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def matched_items(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
    
        qb_items = QbItem.objects.filter(matched=True).values('list_id', 'name')

        # Crear un diccionario para buscar rápidamente los ítems de ZohoItem por `qb_list_id`
        zoho_items_dict = ZohoItem.objects.filter(
            qb_list_id__isnull=False
        ).exclude(
            qb_list_id=''
        ).values('qb_list_id', 'item_id', 'name', 'sku')

        # Crear un conjunto para almacenar los ítems coincidentes
        matched_items = []

        # Convertir `zoho_items_dict` a un diccionario para una búsqueda rápida
        zoho_items_dict = {item['qb_list_id']: item for item in zoho_items_dict}

        for qb_item in qb_items:
            # Buscar si hay un ítem de ZohoItem con el mismo `qb_list_id`
            zoho_item = zoho_items_dict.get(qb_item['list_id'])
            if zoho_item:
                matched = {
                    'zoho_item_id': zoho_item['item_id'],
                    'zoho_item': zoho_item['name'],
                    'zoho_item_sku': zoho_item['sku'],
                    'qb_item_name': qb_item['name'],
                    'qb_item_list_id': qb_item['list_id'],
                    'zoho_item_qb_list_id': zoho_item['qb_list_id']
                }
                matched_items.append(matched)
        
        return JsonResponse(matched_items, safe=False)
    
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def matched_customers(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
    
        qb_customers = QbCustomer.objects.filter(matched=True).values('list_id', 'name')

        # Crear un diccionario para buscar rápidamente los clientes de ZohoCustomer por `qb_list_id`
        zoho_customers_dict = ZohoCustomer.objects.filter(
            qb_list_id__isnull=False
        ).exclude(
            qb_list_id=''
        ).values('qb_list_id', 'contact_id', 'customer_name', 'email', 'phone', 'company_name')

        # Convertir `zoho_customers_dict` a un diccionario para una búsqueda rápida
        zoho_customers_dict = {customer['qb_list_id']: customer for customer in zoho_customers_dict}

        # Crear una lista para almacenar los clientes coincidentes
        matched_customers = []

        for qb_customer in qb_customers:
            # Buscar si hay un cliente de ZohoCustomer con el mismo `qb_list_id`
            zoho_customer = zoho_customers_dict.get(qb_customer['list_id'])
            if zoho_customer:
                matched = {
                    'zoho_customer_id': zoho_customer['contact_id'],
                    'zoho_customer': zoho_customer['customer_name'],
                    'zoho_customer_email': zoho_customer['email'],
                    'zoho_customer_phone': zoho_customer['phone'],
                    'zoho_customer_company': zoho_customer['company_name'],
                    'qb_customer_name': qb_customer['name'],
                    'qb_customer_list_id': qb_customer['list_id'],
                    'zoho_customer_qb_list_id': zoho_customer['qb_list_id']
                }
                matched_customers.append(matched)
        
        return JsonResponse(matched_customers, safe=False)
    
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def matched_invoices(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        # Obtener la fecha desde los parámetros de consulta, o usar la fecha actual si no se proporciona
        date_str = request.GET.get('date')
        date_date = parse_date(date_str) if date_str else date.today()

        # Agregar filtro de fecha para obtener solo las facturas del día
        invoices = ZohoFullInvoice.objects.filter(date=date_date).order_by('-invoice_number')
        
        pattern = r'^[A-Za-z0-9]{8}-[A-Za-z0-9]{10}$'
        all_items = ZohoItem.objects.filter(Q(qb_list_id__regex=pattern)).values_list('item_id', 'qb_list_id')
        df = pd.DataFrame(list(all_items), columns=['item_id', 'qb_list_id'])
        all_items_data = df[['item_id', 'qb_list_id']].to_dict(orient='records')
        all_customers = ZohoCustomer.objects.filter(Q(qb_list_id__regex=pattern)).values_list('contact_id', 'qb_list_id')
        dfc = pd.DataFrame(list(all_customers), columns=['contact_id', 'qb_list_id'])
        all_customers_data = dfc[['contact_id', 'qb_list_id']].to_dict(orient='records')
        qb_customer_list_id = ''
        
        items_dict = {item['item_id']: item for item in all_items_data}
        customers_dict = {customer['contact_id']: customer for customer in all_customers_data}

        for invoice in invoices:
            for item in invoice.line_items:
                item_id = item.get('item_id')
                if item_id in items_dict:
                    item['qb_list_id'] = items_dict[item_id]['qb_list_id']

            for item in invoice.items_unmatched:
                zoho_item_id = item.get('zoho_item_id')
                if zoho_item_id in items_dict:
                    item['qb_list_id'] = items_dict[zoho_item_id]['qb_list_id']

            customer_id = invoice.customer_id
            if customer_id in customers_dict:
                qb_customer_list_id = customers_dict[customer_id]['qb_list_id']

            for customer in invoice.customer_unmatched:
                zoho_customer_id = customer.get('zoho_customer_id')
                if zoho_customer_id in customers_dict:
                    customer['qb_list_id'] = customers_dict[zoho_customer_id]['qb_list_id']
            
            cont_items = len(list(filter(lambda x: 'qb_list_id' in x, invoice.line_items)))
                        
            invoice.all_items_matched = cont_items == len(invoice.line_items)
            invoice.all_customer_matched = qb_customer_list_id != ''
            invoice.qb_customer_list_id = qb_customer_list_id
            invoice.save()
            qb_customer_list_id = ''

        # Calcular estadísticas basadas en las facturas del día
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

        # Serializar las facturas para la respuesta
        context = {
            'invoices': serializers.serialize('json', invoices),
            'matched_number': matched_number,
            'unmatched_number': unmatched_number,
            'unprocessed_number': unprocessed_number,
        }
        return JsonResponse(context, safe=False)
    
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)
    


#############################################
# AJAX methods
#############################################
# Match all by first element
#############################################

@require_POST
def match_all_first_items_ajax(request):
    global similar_items
    filter_similar_items = list(filter(lambda x: len(x['coincidences_by_order']) > 0, similar_items))
    action = request.POST['action']  
    try:
        for item in filter_similar_items:
            if item['coincidences_by_order']:
                zoho_item = ZohoItem.objects.get(item_id=item['coincidences_by_order'][0]['zoho_item_id'])
                qb_item = QbItem.objects.get(list_id=item['qb_item_list_id'])
                zoho_item.qb_list_id = item['qb_item_list_id'] if action == 'match' else ''
                zoho_item.save()
                qb_item.matched = True if action == 'match' else False
                qb_item.save()
        return JsonResponse({'status': 'success', 'message': 'Items matched successfully'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    

@require_POST
def match_all_first_customers_ajax(request):
    global similar_customers
    filter_similar_customers = list(filter(lambda x: len(x['coincidences_by_order']) > 0, similar_customers))
    action = request.POST['action']  
    try:
        for customer in filter_similar_customers:
            if customer['coincidences_by_order']:
                zoho_customer = ZohoCustomer.objects.get(contact_id=customer['coincidences_by_order'][0]['zoho_customer_id'])
                qb_customer = QbCustomer.objects.get(list_id=customer['qb_customer_list_id'])
                zoho_customer.qb_list_id = customer['qb_item_list_id'] if action == 'match' else ''
                zoho_customer.save()
                qb_customer.matched = True if action == 'match' else False
                qb_customer.save()
        return JsonResponse({'status': 'success', 'message': 'Customers matched successfully'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


#############################################
# Match one by selected element
#############################################

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def match_one_item_ajax(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        action = request.POST['action']
        try:
            qb_list_id = request.POST['qb_item_list_id']
            zoho_item_id = request.POST['zoho_item_id']
            username = request.POST['username']
            qb_item = get_object_or_404(QbItem, list_id=qb_list_id)
            zoho_item = get_object_or_404(ZohoItem, item_id=zoho_item_id)
            zoho_item.qb_list_id = qb_list_id if action == 'match' else ''
            zoho_item.save()
            qb_item.matched = True if action == 'match' else False
            qb_item.save()
            message = 'Item matched successfully' if action == 'match' else 'Item unmatched successfully'
            api_zoho_views.manage_api_tracking_log(username, f'{action}_item', request.META.get('REMOTE_ADDR'), f'{action.capitalize()} item')
            return JsonResponse({'status': 'success', 'message': message})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid JWT Token'}, status=401)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def match_one_customer_ajax(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    logger.info(f"Request: {request}")
    if valid_token:
        action = request.POST['action']
        logger.info(f"Action: {action}")
        try:
            qb_list_id = request.POST['qb_customer_list_id']
            zoho_customer_id = request.POST['zoho_customer_id']
            username = request.POST['username']
            qb_customer = get_object_or_404(QbCustomer,list_id=qb_list_id)
            zoho_customer = get_object_or_404(ZohoCustomer, contact_id=zoho_customer_id)
            zoho_customer.qb_list_id = qb_list_id if action == 'match' else ''
            zoho_customer.save()
            qb_customer.matched = True if action == 'match' else False
            qb_customer.save()
            message = 'Customer matched successfully' if action == 'match' else 'Customer unmatched successfully'
            api_zoho_views.manage_api_tracking_log(username, f'{action}_customer', request.META.get('REMOTE_ADDR'), f'{action.capitalize()} customer')
            return JsonResponse({'status': 'success', 'message': message})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid JWT Token'}, status=401)
    
    
#############################################    
# SOAP requests
#############################################

def start_qbwc_invoice_add_request(request):
    if request.method == 'POST':
        xml_data = request.body.decode('utf-8')
        response_xml = process_qbwc_invoice_add_request(xml_data)
        qb_loading = QbLoading.objects.filter(qb_module='invoices', qb_record_created=datetime.now(timezone.utc)).first()
        app_config = AppConfig.objects.first()
        api_zoho_views.manage_api_tracking_log(f'{app_config.qb_username} (From QBWC)', 'sync_invoices_to_qb', request.META.get('REMOTE_ADDR'), 'Sync invoices to QuickBooks')
        if not qb_loading:
            qb_loading = create_qb_loading_instance('invoices')
        else:
            qb_loading.qb_record_updated = datetime.now(timezone.utc)
        qb_loading.save()
        
        return HttpResponse(response_xml, content_type='text/xml')
    else:
        return HttpResponse(status=405)
    
    
def start_qbwc_query_request(request, query_object_name, list_of_objects):
    # query_object_name = 'Item' if query_object_name == 'ItemNonInventory' else query_object_name
    if request.method == 'POST':
        module = ''
        xml_data = request.body.decode('utf-8')
        if f'{query_object_name}Ret' in xml_data:
            xml_dict = xmltodict.parse(xml_data)
            response_xml = xml_dict['soap:Envelope']['soap:Body']['receiveResponseXML']['response']
            data_dict = xmltodict.parse(response_xml)
            if f'{query_object_name}QueryRs' in xml_data:
                elements_query_rs = data_dict['QBXML']['QBXMLMsgsRs'][f'{query_object_name}QueryRs'][f'{query_object_name}Ret']
                list_of_objects = [elem for elem in elements_query_rs] if isinstance(elements_query_rs, list) else [elements_query_rs]
                logger.info(f"Number of {query_object_name} detected: {len(list_of_objects)}")

                if query_object_name in ['ItemInventory','ItemSalesTax', 'ItemService', 'ItemNonInventory', 'Item']:
                    module = 'items'
                    existing_items_ids = set(QbItem.objects.values_list('list_id', flat=True))
                    items_to_save = [
                        QbItem(
                            list_id=item.get('ListID', ''), 
                            name=item.get('Name', ''), 
                            item_type=query_object_name)
                        for item in list_of_objects
                        if item.get('ListID', '') not in existing_items_ids
                    ]
                    logger.info(f"Number of {query_object_name} to save: {len(items_to_save)}")
                    save_items_in_batches(items_to_save)

                elif query_object_name == 'Customer':
                    module = 'customers'
                    existing_customers_ids = set(QbCustomer.objects.values_list('list_id', flat=True))
                    customers_to_save = [
                        QbCustomer(
                            list_id=customer['ListID'],
                            name=customer.get('FullName', ''),
                            email=customer.get('Email', '').lower() if customer.get('Email', '') else '',
                            phone=api_zoho_views.clean_phone_number(customer.get('Phone', '')) if customer.get('Phone', '') else '',
                        )
                        for customer in list_of_objects
                        if customer['ListID'] not in existing_customers_ids
                    ]
                    logger.info(f"Number of {query_object_name} to save: {len(customers_to_save)}")
                    save_customers_in_batches(customers_to_save)

        if module:
            qb_loading = QbLoading.objects.filter(qb_module=module, qb_record_created=datetime.now(timezone.utc)).first()
            if not qb_loading:
                qb_loading = create_qb_loading_instance(module)
            else:
                qb_loading.qb_record_updated = datetime.now(timezone.utc)
            qb_loading.save()
            app_config = AppConfig.objects.first()
            api_zoho_views.manage_api_tracking_log(f'{app_config.qb_username} (From QBWC)', f'load_{module}_from_qb', request.META.get('REMOTE_ADDR'), f'Load {module} from QuickBooks')
            logger.info(f"QB Loading instance created/updated for module {module}")
            logger.info(f"Task done: {qb_loading}")

        response_xml = process_qbwc_query_request(xml_data, query_object_name)
        return HttpResponse(response_xml, content_type='text/xml')
    else:
        return HttpResponse(status=405)
    

def save_items_in_batches(items_to_save, batch_size=100):
    for i in range(0, len(items_to_save), batch_size):
        batch = items_to_save[i:i + batch_size]
        try:
            with transaction.atomic():
                QbItem.objects.bulk_create(batch)
        except IntegrityError as e:
            logger.error(f"IntegrityError during bulk_create: {e}")
            for item in batch:
                try:
                    item.save()
                except IntegrityError as e:
                    logger.error(f"Failed to save item with list_id {item.list_id}: {e}")
                    

def save_customers_in_batches(customers_to_save, batch_size=100):
    for i in range(0, len(customers_to_save), batch_size):
        batch = customers_to_save[i:i + batch_size]
        try:
            with transaction.atomic():
                QbCustomer.objects.bulk_create(batch)
        except IntegrityError as e:
            logger.error(f"IntegrityError during bulk_create: {e}")
            for customer in batch:
                try:
                    customer.save()
                except IntegrityError as e:
                    logger.error(f"Failed to save customer {customer.list_id}: {e}")
    

def process_qbwc_query_request(xml_data, query_object_name):
    global counter
    global soap_customers
    response = None
    try:
        xml_dict = xmltodict.parse(xml_data)
        body = xml_dict['soap:Envelope']['soap:Body']
        if 'authenticate' in body:
            response = soap_service.handle_authenticate(body)
        elif 'sendRequestXML' in body and counter == 0:
            counter += 1
            if query_object_name in ['ItemInventory', 'ItemSalesTax', 'ItemService', 'Item', 'ItemNonInventory']:
                response = soap_service.generate_item_query_response(query_object_name)
            else:
                response = soap_service.generate_customer_query_response()
        elif 'closeConnection' in body:
            counter = 0
            response = soap_service.generate_close_connection_response()
        else:
            response = soap_service.generate_unsupported_request_response()
        return response
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return soap_service.generate_error_response(str(e))
    
    
def create_xml_response(task_id):
    # Crear el elemento raíz del SOAP Envelope
    envelope = etree.Element("{http://schemas.xmlsoap.org/soap/envelope/}Envelope", nsmap={
        "soap": "http://schemas.xmlsoap.org/soap/envelope/",
        "qb": "http://developer.intuit.com/"
    })
    
    # Crear el elemento Header (vacío en este caso)
    header = etree.SubElement(envelope, "{http://schemas.xmlsoap.org/soap/envelope/}Header")
    
    # Crear el elemento Body
    body = etree.SubElement(envelope, "{http://schemas.xmlsoap.org/soap/envelope/}Body")
    
    # Crear el elemento authenticateResponse dentro de Body
    authenticate_response = etree.SubElement(body, "{http://developer.intuit.com/}authenticateResponse")
    
    # Crear el elemento authenticateResult dentro de authenticateResponse
    authenticate_result = etree.SubElement(authenticate_response, "{http://developer.intuit.com/}authenticateResult")
    
    # Crear el primer string elemento dentro de authenticateResult
    string_element1 = etree.SubElement(authenticate_result, "{http://developer.intuit.com/}string")
    string_element1.text = task_id  # Usar el task_id como ticket
    
    # Crear el segundo string elemento dentro de authenticateResult (vacío)
    string_element2 = etree.SubElement(authenticate_result, "{http://developer.intuit.com/}string")
    string_element2.text = ""

    # Convertir el árbol XML a una cadena
    xml_str = etree.tostring(envelope, pretty_print=True, xml_declaration=True, encoding='UTF-8')
    
    # Devolver la respuesta HTTP con el XML y el tipo de contenido correcto
    return HttpResponse(xml_str, content_type='text/xml')

        
def process_qbwc_invoice_add_request(xml_data):
    global counter
    response = None
    try:
        xml_dict = xmltodict.parse(xml_data)
        body = xml_dict['soap:Envelope']['soap:Body']
        if 'authenticate' in body:
            response = soap_service.handle_authenticate(body)
        elif 'sendRequestXML' in body and counter == 0:
            counter += 1
            response = soap_service.generate_invoice_add_response()
        elif 'closeConnection' in body:
            counter = 0
            response = soap_service.generate_close_connection_response()
        else:
            response = soap_service.generate_unsupported_request_response()
        return response
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return soap_service.generate_error_response(str(e))


    

#############################################
# View to show loaded data
#############################################

def qbwc_loading(request):
    qb_loading_items = QbLoading.objects.filter(qb_module='items').order_by('-qb_record_created').first()
    qb_loading_invoices = QbLoading.objects.filter(qb_module='invoices').order_by('-qb_record_created').first()
    qb_loading_customers = QbLoading.objects.filter(qb_module='customers').order_by('-qb_record_created').first()
    context = {
        'qb_loading_items': qb_loading_items,
        'qb_loading_invoices': qb_loading_invoices,
        'qb_loading_customers': qb_loading_customers
    }
    return render(request, 'api_quickbook_soap/qbwc_loading.html', context)


#############################################
# Create QBWC Loading instance
#############################################


def create_qb_loading_instance(module):
    item = QbLoading()
    item.qb_module = module
    item.qb_record_created = datetime.now(timezone.utc)
    item.qb_record_updated = datetime.now(timezone.utc)
    return item 
