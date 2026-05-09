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
from api_zoho_sales_orders.models import ZohoFullSalesOrder
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
import api_quickbook_soap.helpers_qbwc as helpers_qbwc
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


def _notify_ws_group(kind, request=None, date_str=None):
    """Notify WS clients after a mutation. Resolves date from request query params if needed."""
    from api_ws.utils import notify_group
    try:
        if kind == 'invoices':
            d = date_str or (request.query_params.get('date') if request else None) or ''
            notify_group('invoices', get_matched_invoices_data(d))
        elif kind == 'sales_orders':
            d = date_str or (request.query_params.get('date') if request else None) or ''
            notify_group('sales_orders', get_matched_sales_orders_data(d))
        elif kind == 'qbwc_items':
            notify_group('qbwc_items', get_qbwc_items_data())
        elif kind == 'qbwc_customers':
            notify_group('qbwc_customers', get_qbwc_customers_data())
    except Exception as e:
        logger.error(f"WS notify error for {kind}: {e}")


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

@csrf_exempt
def sales_order_add_request(request):
    return start_qbwc_sales_order_add_request(request)

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
def force_to_sync_ajax(request, kind):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        try:
            data = json.loads(request.body)
            list_id = data.get('elements', [])
            username = data.get('username', '')
            class_obj = ZohoFullInvoice if kind == 'invoices' else ZohoFullSalesOrder
            print(f"List ID: {list_id}")
            for invoice in list_id:
                invoice_model = get_object_or_404(class_obj, invoice_id=invoice) if kind == 'invoices' else get_object_or_404(class_obj, salesorder_id=invoice)
                invoice_model.force_to_sync = not invoice_model.force_to_sync
                invoice_model.save()
                api_zoho_views.manage_api_tracking_log(username, f'force_to_sync_{kind}', request.META.get('REMOTE_ADDR'), f'Forced to sync {kind}')
            _notify_ws_group(kind, request)
            return JsonResponse({'status': 'success'}, status=200)
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid JWT Token'}, status=401)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unsync_ajax(request, kind):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        try:
            data = json.loads(request.body)
            list_id = data.get('elements', [])
            username = data.get('username', '')
            class_obj = ZohoFullInvoice if kind == 'invoices' else ZohoFullSalesOrder
            print(f"List ID: {list_id}")
            for invoice in list_id:
                invoice_model = get_object_or_404(class_obj, invoice_id=invoice) if kind == 'invoices' else get_object_or_404(class_obj, salesorder_id=invoice)
                invoice_model.inserted_in_qb = not invoice_model.inserted_in_qb
                invoice_model.save()
                api_zoho_views.manage_api_tracking_log(username, f'unsync_{kind}', request.META.get('REMOTE_ADDR'), f'Unsync {kind}')
            _notify_ws_group(kind, request)
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
            _notify_ws_group('qbwc_items')
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
            _notify_ws_group('qbwc_customers')
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
def matched(request, kind, filt):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        # Obtener la fecha desde los parámetros de consulta, o usar la fecha actual si no se proporciona
        date_str = request.GET.get('date')
        date_date = parse_date(date_str) if date_str else date.today()
        custom_item_ids = list(ZohoItem.objects.filter(is_custom=True).values_list('item_id', flat=True))
        cond = Q()
        for cid in custom_item_ids:
            cond |= Q(line_items__contains=[{"item_id": cid}])

        # Agregar filtro de fecha para obtener solo las facturas del día
        if kind == 'invoices':
            iterable = ZohoFullInvoice.objects.filter(date=date_date).order_by('-invoice_number')
            if filt == 'stock':
                iterable = iterable.exclude(cond)
        elif kind == 'sales_orders':
            iterable = ZohoFullSalesOrder.objects.filter(date=date_date).order_by('-salesorder_number')
            if filt == 'custom':
                iterable = iterable.filter(cond)
        
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

        for it in iterable:
            for item in it.line_items:
                item_id = item.get('item_id')
                if item_id in items_dict:
                    item['qb_list_id'] = items_dict[item_id]['qb_list_id']

            for item in it.items_unmatched:
                zoho_item_id = item.get('zoho_item_id')
                if zoho_item_id in items_dict:
                    item['qb_list_id'] = items_dict[zoho_item_id]['qb_list_id']

            customer_id = it.customer_id
            if customer_id in customers_dict:
                qb_customer_list_id = customers_dict[customer_id]['qb_list_id']

            for customer in it.customer_unmatched:
                zoho_customer_id = customer.get('zoho_customer_id')
                if zoho_customer_id in customers_dict:
                    customer['qb_list_id'] = customers_dict[zoho_customer_id]['qb_list_id']

            # cont_items = len(list(filter(lambda x: 'qb_list_id' in x, it.line_items)))
            cont_items = sum(1 for x in (it.line_items or []) if 'qb_list_id' in x)

            it.all_items_matched = cont_items == len(it.line_items)
            it.all_customer_matched = qb_customer_list_id != ''
            it.qb_customer_list_id = qb_customer_list_id
            it.save()
            qb_customer_list_id = ''

        # Calcular estadísticas basadas en las facturas del día
        stats = iterable.aggregate(
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
            'elements': serializers.serialize('json', iterable),
            'matched_number': matched_number,
            'unmatched_number': unmatched_number,
            'unprocessed_number': unprocessed_number,
        }
        return JsonResponse(context, safe=False)
    
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


def _get_matched_data(kind, filt, date_str):
    """
    Shared data-fetching logic for the matched view.
    Returns a plain dict (not HttpResponse) so it can be used by both the HTTP
    view and the WebSocket consumer.
    """
    try:
        date_date = parse_date(date_str) if date_str else date.today()
        custom_item_ids = list(ZohoItem.objects.filter(is_custom=True).values_list('item_id', flat=True))
        cond = Q()
        for cid in custom_item_ids:
            cond |= Q(line_items__contains=[{"item_id": cid}])

        if kind == 'invoices':
            iterable = ZohoFullInvoice.objects.filter(date=date_date).order_by('-invoice_number')
            if filt == 'stock':
                iterable = iterable.exclude(cond)
        elif kind == 'sales_orders':
            iterable = ZohoFullSalesOrder.objects.filter(date=date_date).order_by('-salesorder_number')
            if filt == 'custom':
                iterable = iterable.filter(cond)
        else:
            return {}

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

        for it in iterable:
            for item in it.line_items:
                item_id = item.get('item_id')
                if item_id in items_dict:
                    item['qb_list_id'] = items_dict[item_id]['qb_list_id']

            for item in it.items_unmatched:
                zoho_item_id = item.get('zoho_item_id')
                if zoho_item_id in items_dict:
                    item['qb_list_id'] = items_dict[zoho_item_id]['qb_list_id']

            customer_id = it.customer_id
            if customer_id in customers_dict:
                qb_customer_list_id = customers_dict[customer_id]['qb_list_id']

            for customer in it.customer_unmatched:
                zoho_customer_id = customer.get('zoho_customer_id')
                if zoho_customer_id in customers_dict:
                    customer['qb_list_id'] = customers_dict[zoho_customer_id]['qb_list_id']

            cont_items = sum(1 for x in (it.line_items or []) if 'qb_list_id' in x)

            it.all_items_matched = cont_items == len(it.line_items)
            it.all_customer_matched = qb_customer_list_id != ''
            it.qb_customer_list_id = qb_customer_list_id
            it.save()
            qb_customer_list_id = ''

        stats = iterable.aggregate(
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

        return {
            'elements': serializers.serialize('json', iterable),
            'matched_number': matched_number,
            'unmatched_number': unmatched_number,
            'unprocessed_number': unprocessed_number,
        }
    except Exception as e:
        logger.error(f'Error in _get_matched_data({kind}, {filt}): {e}')
        return {}


def get_matched_invoices_data(date_str):
    """WebSocket helper: returns invoices/stock data dict."""
    return _get_matched_data('invoices', 'stock', date_str)


def get_matched_sales_orders_data(date_str):
    """WebSocket helper: returns sales_orders/custom data dict."""
    return _get_matched_data('sales_orders', 'custom', date_str)


def get_qbwc_items_data():
    """WebSocket helper: returns QbItem list serialized as JSON string."""
    try:
        soap_items_query = QbItem.objects.filter(never_match=False, matched=False).order_by('name')
        batch_size = 200
        items = []
        for i in range(0, soap_items_query.count(), batch_size):
            batch = soap_items_query[i:i + batch_size]
            items.extend(batch)
        return serializers.serialize('json', items)
    except Exception as e:
        logger.error(f'Error in get_qbwc_items_data: {e}')
        return '[]'


def get_qbwc_customers_data():
    """WebSocket helper: returns QbCustomer list serialized as JSON string."""
    try:
        soap_customers_query = QbCustomer.objects.filter(never_match=False, matched=False).order_by('name')
        batch_size = 200
        customers = []
        for i in range(0, soap_customers_query.count(), batch_size):
            batch = soap_customers_query[i:i + batch_size]
            customers.extend(batch)
        return serializers.serialize('json', customers)
    except Exception as e:
        logger.error(f'Error in get_qbwc_customers_data: {e}')
        return '[]'


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
            _notify_ws_group('qbwc_items')
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
            _notify_ws_group('qbwc_customers')
            return JsonResponse({'status': 'success', 'message': message})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid JWT Token'}, status=401)
    
    
#############################################    
# SOAP requests
#############################################

def start_qbwc_sales_order_add_request(request):
    if request.method == 'POST':
        xml_data = request.body.decode('utf-8')
        response_xml = process_qbwc_sales_order_add_request(xml_data)
        qb_loading = QbLoading.objects.filter(qb_module='sales_orders', qb_record_created=datetime.now(timezone.utc)).first()
        app_config = AppConfig.objects.first()
        api_zoho_views.manage_api_tracking_log(f'{app_config.qb_username} (From QBWC)', 'sync_sales_orders_to_qb', request.META.get('REMOTE_ADDR'), 'Sync sales orders to QuickBooks')

        if not qb_loading:
            qb_loading = create_qb_loading_instance('sales_orders')
        else:
            qb_loading.qb_record_updated = datetime.now(timezone.utc)
        qb_loading.save()

        message_notification = 'Sales orders have been synced to QuickBooks'
        api_zoho_views.manage_notifications(message_notification)
        
        return HttpResponse(response_xml, content_type='text/xml')
    else:
        return HttpResponse(status=405)
    

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
        
        message_notification = 'Invoices have been synced to QuickBooks'
        api_zoho_views.manage_notifications(message_notification)
        
        return HttpResponse(response_xml, content_type='text/xml')
    else:
        return HttpResponse(status=405)
    

# def start_qbwc_query_request(request, query_object_name, list_of_objects):
#     helpers_qbwc.start_qbwc_query_request(request, query_object_name, list_of_objects)

# def start_qbwc_query_request(request, query_object_name, list_of_objects):
#     # query_object_name = 'Item' if query_object_name == 'ItemNonInventory' else query_object_name
#     if request.method == 'POST':
#         BATCH_SIZE = 1000
#         module = ''
#         xml_data = request.body.decode('utf-8')
#         if f'{query_object_name}Ret' in xml_data:
#             xml_dict = xmltodict.parse(xml_data)
#             response_xml = xml_dict['soap:Envelope']['soap:Body']['receiveResponseXML']['response']
#             data_dict = xmltodict.parse(response_xml)
#             if f'{query_object_name}QueryRs' in xml_data:
#                 elements_query_rs = data_dict['QBXML']['QBXMLMsgsRs'][f'{query_object_name}QueryRs'][f'{query_object_name}Ret']
#                 list_of_objects = [elem for elem in elements_query_rs] if isinstance(elements_query_rs, list) else [elements_query_rs]
#                 logger.info(f"Number of {query_object_name} detected: {len(list_of_objects)}")

#                 if query_object_name in ['ItemInventory','ItemSalesTax', 'ItemService', 'ItemNonInventory', 'Item', 'ItemInventoryPart', 'ItemDiscount']:
#                     module = 'items'
#                     existing_items_ids = set(QbItem.objects.values_list('list_id', flat=True))
#                     items_to_save = [
#                         QbItem(
#                             list_id=item.get('ListID', ''), 
#                             name=item.get('Name', ''), 
#                             item_type=query_object_name
#                         )
#                         for item in list_of_objects
#                         if item.get('ListID', '') not in existing_items_ids
#                     ]
#                     items_to_update = [
#                         item for item in list_of_objects
#                         if item.get('ListID', '') in existing_items_ids
#                     ]
#                     count_updated = 0
#                     for item in items_to_update:
#                         existing_item = QbItem.objects.filter(list_id=item.get('ListID', '')).first()
#                         if existing_item and existing_item.name != item.get('Name', ''):
#                             existing_item.name = item.get('Name', '')
#                             existing_item.item_type = query_object_name
#                             try:
#                                 existing_item.save()
#                                 count_updated += 1
#                             except IntegrityError as e:
#                                 logger.error(f"Failed to update item with list_id {existing_item.list_id}: {e}")
                            
#                     logger.info(f"Number of {query_object_name} to save: {len(items_to_save)}")
#                     logger.info(f"Number of {query_object_name} updated: {count_updated}")
                    
#                     save_items_in_batches(items_to_save)

#                 elif query_object_name == 'Customer':
#                     module = 'customers'
#                     existing_customers_ids = set(QbCustomer.objects.values_list('list_id', flat=True))
#                     customers_to_save = [
#                         QbCustomer(
#                             list_id=customer['ListID'],
#                             name=customer.get('FullName', ''),
#                             email=customer.get('Email', '').lower() if customer.get('Email', '') else '',
#                             phone=api_zoho_views.clean_phone_number(customer.get('Phone', '')) if customer.get('Phone', '') else '',
#                         )
#                         for customer in list_of_objects
#                         if customer['ListID'] not in existing_customers_ids
#                     ]
#                     if len(customers_to_save) > 0:
#                         QbCustomer.objects.bulk_create(customers_to_save, ignore_conflicts=True, batch_size=BATCH_SIZE)
#                     customers_to_update = [
#                         customer for customer in list_of_objects
#                         if customer['ListID'] in existing_customers_ids
#                     ]
#                     count_updated = 0
#                     for customer in customers_to_update:
#                         existing_customer = QbCustomer.objects.filter(list_id=customer['ListID']).first()
#                         if existing_customer:
#                             updated = False
#                             if existing_customer.name != customer.get('FullName', ''):
#                                 existing_customer.name = customer.get('FullName', '')
#                                 updated = True
#                             email = customer.get('Email', '').lower() if customer.get('Email', '') else ''
#                             if existing_customer.email != email:
#                                 existing_customer.email = email
#                                 updated = True
#                             phone = api_zoho_views.clean_phone_number(customer.get('Phone', '')) if customer.get('Phone', '') else ''
#                             if existing_customer.phone != phone:
#                                 existing_customer.phone = phone
#                                 updated = True
#                             if updated:
#                                 try:
#                                     existing_customer.save()
#                                     count_updated += 1
#                                 except IntegrityError as e:
#                                     logger.error(f"Failed to update customer with list_id {existing_customer.list_id}: {e}")
#                     # ajusta según tu RDS/CPU
               
#                     logger.info(f"Number of {query_object_name} to save: {len(customers_to_save)}")
#                     logger.info(f"Number of {query_object_name} updated: {count_updated}")
#                     # save_customers_in_batches(customers_to_save)

#         if module:
#             qb_loading = QbLoading.objects.filter(qb_module=module, qb_record_created=datetime.now(timezone.utc)).first()
#             if not qb_loading:
#                 qb_loading = create_qb_loading_instance(module)
#             else:
#                 qb_loading.qb_record_updated = datetime.now(timezone.utc)
#             qb_loading.save()
#             app_config = AppConfig.objects.first()
#             api_zoho_views.manage_api_tracking_log(f'{app_config.qb_username} (From QBWC)', f'load_{module}_from_qb', request.META.get('REMOTE_ADDR'), f'Load {module} from QuickBooks')
#             logger.info(f"QB Loading instance created/updated for module {module}")
#             logger.info(f"Task done: {qb_loading}")
#             module_object = re.sub(r'([a-z])([A-Z])', r'\1 \2', query_object_name)
#             message_notification = f'All {module_object} have been loaded from QuickBooks'
#             api_zoho_views.manage_notifications(message_notification)

#         response_xml = process_qbwc_query_request(xml_data, query_object_name)
#         return HttpResponse(response_xml, content_type='text/xml')
#     else:
#         return HttpResponse(status=405)


def start_qbwc_query_request(request, query_object_name, list_of_objects):
    if request.method == 'POST':
        BATCH_SIZE = 1000
        module = ''
        xml_data = request.body.decode('utf-8')
        
        try:
            xml_dict = xmltodict.parse(xml_data)
            response_xml = xml_dict['soap:Envelope']['soap:Body']['receiveResponseXML']['response']
        except Exception:
            response_xml = '' 
        
        if response_xml and f'{query_object_name}QueryRs' in response_xml:
            data_dict = xmltodict.parse(response_xml)
            query_rs = data_dict['QBXML']['QBXMLMsgsRs'][f'{query_object_name}QueryRs']
            
            status_code = query_rs.get('@statusCode')
            status_sev  = query_rs.get('@statusSeverity')
            status_msg  = query_rs.get('@statusMessage')
            logger.info("%sQueryRs statusCode=%s severity=%s message=%s",
                        query_object_name, status_code, status_sev, status_msg)
            
            elements_ret = query_rs.get(f'{query_object_name}Ret')
            if not elements_ret:
                logger.info(f"No hay {query_object_name}Ret en esta página de QBXML.")
                elements = []
            else:
                elements = elements_ret if isinstance(elements_ret, list) else [elements_ret]

            list_of_objects = elements
            logger.info(f"Number of {query_object_name} detected: {len(list_of_objects)}")

            # ---------------- ITEMS ----------------
            if query_object_name in ['ItemInventory','ItemSalesTax','ItemService','Item','ItemNonInventory','ItemInventoryPart','ItemDiscount']:
                module = 'items'
                existing_items_ids = set(QbItem.objects.values_list('list_id', flat=True))

                items_to_save = [
                    QbItem(
                        list_id=item.get('ListID', ''),
                        name=item.get('Name', '') or '',
                        item_type=query_object_name
                    )
                    for item in list_of_objects
                    if item and item.get('ListID', '') and item.get('ListID') not in existing_items_ids
                ]
                
                ids_needed = [i.get('ListID') for i in list_of_objects if i and i.get('ListID')]
                existing_map = {o.list_id: o for o in QbItem.objects.filter(list_id__in=ids_needed)}

                items_to_update_objs = []
                for item in list_of_objects:
                    if not item: continue
                    lid = item.get('ListID')
                    if not lid or lid not in existing_items_ids: continue
                    obj = existing_map.get(lid)
                    if not obj: continue
                    changed = False
                    new_name = item.get('Name', '') or ''
                    if obj.name != new_name:
                        obj.name = new_name; changed = True
                    if obj.item_type != query_object_name:
                        obj.item_type = query_object_name; changed = True
                    if changed:
                        items_to_update_objs.append(obj)

                if items_to_save:
                    QbItem.objects.bulk_create(items_to_save, ignore_conflicts=True, batch_size=BATCH_SIZE)
                if items_to_update_objs:
                    for i in range(0, len(items_to_update_objs), BATCH_SIZE):
                        QbItem.objects.bulk_update(items_to_update_objs[i:i+BATCH_SIZE], fields=['name','item_type'], batch_size=BATCH_SIZE)

                logger.info(f"[ITEMS] to save: {len(items_to_save)} | to update: {len(items_to_update_objs)}")

            # ---------------- CUSTOMERS ----------------
            elif query_object_name == 'Customer':
                module = 'customers'
                existing_customers_ids = set(QbCustomer.objects.values_list('list_id', flat=True))

                customers_to_save = []
                ids_needed = []
                for c in list_of_objects:
                    if not c: continue
                    lid = c.get('ListID')
                    if not lid: continue
                    ids_needed.append(lid)
                    if lid not in existing_customers_ids:
                        customers_to_save.append(QbCustomer(
                            list_id=lid,
                            name=(c.get('FullName','') or ''),
                            email=(c.get('Email') or '').lower(),
                            phone=api_zoho_views.clean_phone_number(c.get('Phone','') or '')
                        ))

                if customers_to_save:
                    QbCustomer.objects.bulk_create(customers_to_save, ignore_conflicts=True, batch_size=BATCH_SIZE)

                existing_map = {o.list_id: o for o in QbCustomer.objects.filter(list_id__in=ids_needed)}
                customers_to_update_objs = []
                for c in list_of_objects:
                    if not c: continue
                    lid = c.get('ListID')
                    if not lid or lid not in existing_customers_ids: continue
                    obj = existing_map.get(lid)
                    if not obj: continue
                    changed = False
                    new_name = (c.get('FullName','') or '')
                    new_email = (c.get('Email') or '').lower()
                    new_phone = api_zoho_views.clean_phone_number(c.get('Phone','') or '')
                    if obj.name != new_name: obj.name = new_name; changed = True
                    if obj.email != new_email: obj.email = new_email; changed = True
                    if obj.phone != new_phone: obj.phone = new_phone; changed = True
                    if changed:
                        customers_to_update_objs.append(obj)

                if customers_to_update_objs:
                    for i in range(0, len(customers_to_update_objs), BATCH_SIZE):
                        QbCustomer.objects.bulk_update(customers_to_update_objs[i:i+BATCH_SIZE], fields=['name','email','phone'], batch_size=BATCH_SIZE)

                logger.info(f"[CUSTOMERS] to save: {len(customers_to_save)} | to update: {len(customers_to_update_objs)}")
        
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
            module_object = re.sub(r'([a-z])([A-Z])', r'\1 \2', query_object_name)
            message_notification = f'All {module_object} have been loaded from QuickBooks'
            api_zoho_views.manage_notifications(message_notification)
        
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
    response = None
    try:
        xml_dict = xmltodict.parse(xml_data)
        body = xml_dict['soap:Envelope']['soap:Body']

        logger.debug("SOAP Body keys: %s", list(body.keys()))

        if helpers_qbwc._has_op(body, 'authenticate'):
            response = soap_service.handle_authenticate(body)

        elif helpers_qbwc._has_op(body, 'sendRequestXML'):
            if counter == 0:
                counter = 1
                from_modified = helpers_qbwc._get_last_sync_iso(query_object_name)
                logger.info("sendRequestXML first call. FromModifiedDate=%s", from_modified)

                if query_object_name in ['ItemInventory', 'ItemSalesTax', 'ItemService', 'Item',
                                         'ItemNonInventory', 'ItemInventoryPart', 'ItemDiscount']:
                    response = soap_service.generate_item_query_response(query_object_name, from_modified)
                else:
                    response = soap_service.generate_customer_query_response(from_modified)
            else:
                logger.info("sendRequestXML: no more requests. Returning empty request.")
                response = soap_service.generate_empty_request_response()

        elif helpers_qbwc._has_op(body, 'receiveResponseXML'):
            logger.info("receiveResponseXML: return 100 (done).")
            counter = 0
            response = soap_service.generate_receive_response(percent='100')

        elif helpers_qbwc._has_op(body, 'closeConnection'):
            logger.debug("Handling closeConnection")
            counter = 0
            response = soap_service.generate_close_connection_response()

        else:
            response = soap_service.generate_unsupported_request_response()

        return response

    except Exception as e:
        logger.error(f"Error processing request: {e}")
        counter = 0
        return soap_service.generate_error_response(str(e))

                    

# def process_qbwc_query_request(xml_data, query_object_name):
#     global counter
#     global soap_customers
#     response = None
#     try:
#         xml_dict = xmltodict.parse(xml_data)
#         body = xml_dict['soap:Envelope']['soap:Body']
        
#         logger.info("SOAP Body keys: %s", list(body.keys()))

#         if helpers_qbwc._has_op(body, 'authenticate'):
#             response = soap_service.handle_authenticate(body)

#         elif helpers_qbwc._has_op(body, 'sendRequestXML') and counter == 0:
#             counter += 1
#             from_modified = helpers_qbwc._get_last_sync_iso(query_object_name)
#             logger.info("sendRequestXML first call. FromModifiedDate=%s", from_modified)

#             if query_object_name in ['ItemInventory', 'ItemSalesTax', 'ItemService', 'Item',
#                                      'ItemNonInventory', 'ItemInventoryPart', 'ItemDiscount']:
#                 response = soap_service.generate_item_query_response(query_object_name, from_modified)
#             else:
#                 response = soap_service.generate_customer_query_response(from_modified)

#         elif helpers_qbwc._has_op(body, 'closeConnection'):
#             counter = 0
#             response = soap_service.generate_close_connection_response()

#         else:
#             response = soap_service.generate_unsupported_request_response()

#         return response

#     except Exception as e:
#         logger.error(f"Error processing request: {e}")
#         try:
#             counter = 0
#         except Exception:
#             pass
#         return soap_service.generate_error_response(str(e))

    

# def process_qbwc_query_request(xml_data, query_object_name):
#     global counter
#     global soap_customers
#     response = None
#     try:
#         xml_dict = xmltodict.parse(xml_data)
#         body = xml_dict['soap:Envelope']['soap:Body']
#         if 'authenticate' in body:
#             response = soap_service.handle_authenticate(body)
#         elif 'sendRequestXML' in body and counter == 0:
#             counter += 1
#             from_modified = helpers_qbwc._get_last_sync_iso(query_object_name)
#             if query_object_name in ['ItemInventory', 'ItemSalesTax', 'ItemService', 'Item', 'ItemNonInventory', 'ItemInventoryPart', 'ItemDiscount']:
#                 response = soap_service.generate_item_query_response(query_object_name, from_modified)
#             else:
#                 response = soap_service.generate_customer_query_response(from_modified)
#         elif 'closeConnection' in body:
#             counter = 0
#             response = soap_service.generate_close_connection_response()
#         else:
#             response = soap_service.generate_unsupported_request_response()
#         return response
#     except Exception as e:
#         logger.error(f"Error processing request: {e}")
#         return soap_service.generate_error_response(str(e))
    
    
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

        
def _apply_invoice_query_response(xml_data: str) -> None:
    """Parse InvoiceQueryRs. Each <InvoiceRet> means QB already has that
    RefNumber — mark the matching ZohoFullInvoice as skipped_duplicate and
    persist the existing TxnID so it's never Add'ed again. The Add filter
    excludes rows with qb_txn_id, so these are naturally skipped.

    Best-effort: errors are swallowed; the SOAP cycle must keep moving."""
    try:
        xml_dict = xmltodict.parse(xml_data)
        body = xml_dict['soap:Envelope']['soap:Body']
        recv_key = helpers_qbwc._get_op_key(body, 'receiveResponseXML')
        if not recv_key:
            return
        inner_xml = body[recv_key].get('response') or ''
        if not inner_xml or 'InvoiceQueryRs' not in inner_xml:
            return

        data = xmltodict.parse(inner_xml)
        msgs = data.get('QBXML', {}).get('QBXMLMsgsRs', {})
        rs = msgs.get('InvoiceQueryRs') or {}
        ret_node = rs.get('InvoiceRet')
        if not ret_node:
            logger.info("InvoiceQueryRs: no existing invoices found in QB for the queried RefNumbers.")
            return
        ret_iter = ret_node if isinstance(ret_node, list) else [ret_node]
        now = datetime.now(timezone.utc)
        marked = 0
        for ret in ret_iter:
            ref_num = ret.get('RefNumber') or ''
            txn_id = ret.get('TxnID') or ''
            edit_seq = ret.get('EditSequence') or ''
            if not ref_num or not txn_id:
                continue
            invoice = ZohoFullInvoice.objects.filter(invoice_number=ref_num).first()
            if not invoice:
                logger.warning("InvoiceQueryRs: no ZohoFullInvoice for RefNumber=%s", ref_num)
                continue
            invoice.qb_txn_id = txn_id
            invoice.qb_edit_sequence = edit_seq
            invoice.qb_inserted_at = invoice.qb_inserted_at or now
            invoice.inserted_in_qb = True
            invoice.force_to_sync = False
            invoice.sync_state = ZohoFullInvoice.SYNC_STATE_SKIPPED_DUPLICATE
            invoice.last_qb_error = None
            invoice.save(update_fields=[
                'qb_txn_id', 'qb_edit_sequence', 'qb_inserted_at',
                'inserted_in_qb', 'force_to_sync', 'sync_state', 'last_qb_error',
            ])
            marked += 1
        logger.info("InvoiceQueryRs: %d invoice(s) marked as skipped_duplicate (already in QB).", marked)
    except Exception as e:
        logger.error("Error parsing InvoiceQueryRs: %s", e)


def _apply_invoice_add_response(xml_data: str) -> None:
    """Parse the receiveResponseXML body for InvoiceAddRs and update each
    ZohoFullInvoice with the QB result (TxnID, sync_state, etc.).

    Errors here are swallowed: the SOAP cycle must keep moving (we must
    return 100 to QBWC regardless), and the operator can recover from logs.
    """
    try:
        xml_dict = xmltodict.parse(xml_data)
        body = xml_dict['soap:Envelope']['soap:Body']
        recv_key = helpers_qbwc._get_op_key(body, 'receiveResponseXML')
        if not recv_key:
            return
        inner_xml = body[recv_key].get('response') or ''
        if not inner_xml or 'InvoiceAddRs' not in inner_xml:
            return

        data = xmltodict.parse(inner_xml)
        msgs = data.get('QBXML', {}).get('QBXMLMsgsRs', {})
        rs_node = msgs.get('InvoiceAddRs')
        if not rs_node:
            return
        rs_iter = rs_node if isinstance(rs_node, list) else [rs_node]
        now = datetime.now(timezone.utc)

        for rs in rs_iter:
            request_id = rs.get('@requestID', '') or ''
            if not request_id.startswith('inv-'):
                logger.warning("InvoiceAddRs with unexpected requestID=%r", request_id)
                continue
            invoice_id = request_id[len('inv-'):]
            invoice = ZohoFullInvoice.objects.filter(invoice_id=invoice_id).first()
            if not invoice:
                logger.warning("InvoiceAddRs for unknown invoice_id=%s", invoice_id)
                continue

            status_code = rs.get('@statusCode', '') or ''
            status_sev = rs.get('@statusSeverity', '') or ''
            status_msg = rs.get('@statusMessage', '') or ''
            ret = rs.get('InvoiceRet') or {}

            if status_code == '0' and ret:
                invoice.qb_txn_id = ret.get('TxnID') or invoice.qb_txn_id
                invoice.qb_edit_sequence = ret.get('EditSequence') or invoice.qb_edit_sequence
                invoice.qb_inserted_at = now
                invoice.inserted_in_qb = True
                invoice.force_to_sync = False
                invoice.sync_state = ZohoFullInvoice.SYNC_STATE_CONFIRMED
                invoice.last_qb_error = None
                invoice.save(update_fields=[
                    'qb_txn_id', 'qb_edit_sequence', 'qb_inserted_at',
                    'inserted_in_qb', 'force_to_sync', 'sync_state', 'last_qb_error',
                ])
                logger.info("Invoice %s confirmed in QB (TxnID=%s)", invoice_id, invoice.qb_txn_id)
            else:
                msg_low = status_msg.lower()
                is_dup = 'duplicate' in msg_low or (
                    'already' in msg_low and ('used' in msg_low or 'exist' in msg_low)
                )
                if is_dup:
                    invoice.sync_state = ZohoFullInvoice.SYNC_STATE_SKIPPED_DUPLICATE
                    invoice.inserted_in_qb = True
                    invoice.force_to_sync = False
                else:
                    invoice.sync_state = ZohoFullInvoice.SYNC_STATE_FAILED
                    invoice.inserted_in_qb = False
                invoice.last_qb_error = f"[{status_code}/{status_sev}] {status_msg}"
                invoice.save(update_fields=[
                    'sync_state', 'inserted_in_qb', 'force_to_sync', 'last_qb_error',
                ])
                logger.warning(
                    "InvoiceAddRs invoice_id=%s status=%s severity=%s msg=%s",
                    invoice_id, status_code, status_sev, status_msg,
                )
    except Exception as e:
        logger.error("Error parsing InvoiceAddRs: %s", e)


def process_qbwc_invoice_add_request(xml_data):
    """Two-phase QBWC cycle for invoice insertion, in a single endpoint:

      counter=0: send PreferencesQueryRq + InvoiceQueryRq (by RefNumber) in
                 the SAME QBXMLMsgsRq block. The pref query surfaces a
                 notification if 'Warn about duplicate invoice numbers' is OFF;
                 the invoice query marks existing duplicates as
                 skipped_duplicate with their TxnID.
      counter=1: send InvoiceAddRq for the survivors. The Add filter excludes
                 anything with qb_txn_id, so duplicates from phase 1 are skipped.
      counter>=2: empty (signals QBWC we're done).

    receiveResponseXML dispatches by content (PreferencesQueryRs/InvoiceQueryRs/
    InvoiceAddRs) rather than by counter, since multiple Rs may coexist and the
    QBWC is free to pace the cycle.
    """
    global counter
    response = None
    try:
        xml_dict = xmltodict.parse(xml_data)
        body = xml_dict['soap:Envelope']['soap:Body']

        if helpers_qbwc._has_op(body, 'authenticate'):
            # Reset counter so a previous cycle that died without closeConnection
            # doesn't leave us stuck in phase 2 forever.
            counter = 0
            response = soap_service.handle_authenticate(body)

        elif helpers_qbwc._has_op(body, 'sendRequestXML'):
            if counter == 0:
                counter = 1
                response = soap_service.generate_invoice_pre_add_query_response()
            elif counter == 1:
                counter = 2
                response = soap_service.generate_invoice_add_response()
            else:
                logger.info("invoice_add: sendRequestXML after add phase. Returning empty.")
                response = soap_service.generate_empty_request_response()

        elif helpers_qbwc._has_op(body, 'receiveResponseXML'):
            recv_key = helpers_qbwc._get_op_key(body, 'receiveResponseXML')
            inner_xml = (body.get(recv_key) or {}).get('response') or '' if recv_key else ''
            # Multiple Rs may coexist in the same response (Pref + Query in
            # phase 1). Apply each parser independently.
            if 'PreferencesQueryRs' in inner_xml:
                _apply_preferences_query_response(xml_data)
            if 'InvoiceQueryRs' in inner_xml:
                _apply_invoice_query_response(xml_data)
            if 'InvoiceAddRs' in inner_xml:
                _apply_invoice_add_response(xml_data)
            response = soap_service.generate_receive_response(percent='100')

        elif helpers_qbwc._has_op(body, 'closeConnection'):
            counter = 0
            response = soap_service.generate_close_connection_response()

        else:
            response = soap_service.generate_unsupported_request_response()

        return response
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        counter = 0
        return soap_service.generate_error_response(str(e))
    
    
def _apply_preferences_query_response(xml_data: str) -> None:
    """Parse PreferencesRet and surface notifications for any "warn about
    duplicate {invoice,sales order} numbers" pref that is OFF in QB. Both
    flags live in SalesAndCustomersPreferences and arrive in the same response,
    so this single parser handles both. Best-effort: errors are swallowed so
    the SOAP cycle keeps moving."""
    try:
        xml_dict = xmltodict.parse(xml_data)
        body = xml_dict['soap:Envelope']['soap:Body']
        recv_key = helpers_qbwc._get_op_key(body, 'receiveResponseXML')
        if not recv_key:
            return
        inner_xml = body[recv_key].get('response') or ''
        if not inner_xml or 'PreferencesQueryRs' not in inner_xml:
            return
        data = xmltodict.parse(inner_xml)
        msgs = data.get('QBXML', {}).get('QBXMLMsgsRs', {})
        rs = msgs.get('PreferencesQueryRs') or {}
        ret = rs.get('PreferencesRet') or {}
        sc_prefs = ret.get('SalesAndCustomersPreferences') or {}

        checks = [
            ('IsWarnAboutDuplicateInvoiceNumbers', 'invoice numbers', 'invoices'),
            ('IsWarnAboutDuplicateSalesOrderNumbers', 'sales order numbers', 'sales orders'),
        ]
        for field, doc_label, txn_label in checks:
            warn = sc_prefs.get(field)
            if warn is None:
                logger.info("PreferencesQueryRs: %s not present in response.", field)
                continue
            is_enabled = str(warn).strip().lower() == 'true'
            if not is_enabled:
                api_zoho_views.manage_notifications(
                    f"Warning: 'Warn about duplicate {doc_label}' is OFF in QuickBooks. "
                    "Enable it in Edit > Preferences > Sales & Customers > Company Preferences "
                    f"to prevent duplicate {txn_label}."
                )
                logger.warning("QB pref %s is OFF.", field)
            else:
                logger.info("QB pref %s is ON.", field)
    except Exception as e:
        logger.error("Error parsing PreferencesQueryRs: %s", e)


def _apply_sales_order_query_response(xml_data: str) -> None:
    """Parse SalesOrderQueryRs. Each <SalesOrderRet> means QB already has that
    RefNumber — mark the matching ZohoFullSalesOrder as skipped_duplicate and
    persist the existing TxnID so it's never Add'ed again. The Add filter
    excludes rows with qb_txn_id, so these are naturally skipped.

    Best-effort: errors are swallowed; the SOAP cycle must keep moving."""
    try:
        xml_dict = xmltodict.parse(xml_data)
        body = xml_dict['soap:Envelope']['soap:Body']
        recv_key = helpers_qbwc._get_op_key(body, 'receiveResponseXML')
        if not recv_key:
            return
        inner_xml = body[recv_key].get('response') or ''
        if not inner_xml or 'SalesOrderQueryRs' not in inner_xml:
            return

        data = xmltodict.parse(inner_xml)
        msgs = data.get('QBXML', {}).get('QBXMLMsgsRs', {})
        rs = msgs.get('SalesOrderQueryRs') or {}
        ret_node = rs.get('SalesOrderRet')
        if not ret_node:
            logger.info("SalesOrderQueryRs: no existing sales orders found in QB for the queried RefNumbers.")
            return
        ret_iter = ret_node if isinstance(ret_node, list) else [ret_node]
        now = datetime.now(timezone.utc)
        marked = 0
        for ret in ret_iter:
            ref_num = ret.get('RefNumber') or ''
            txn_id = ret.get('TxnID') or ''
            edit_seq = ret.get('EditSequence') or ''
            if not ref_num or not txn_id:
                continue
            so = ZohoFullSalesOrder.objects.filter(salesorder_number=ref_num).first()
            if not so:
                logger.warning("SalesOrderQueryRs: no ZohoFullSalesOrder for RefNumber=%s", ref_num)
                continue
            so.qb_txn_id = txn_id
            so.qb_edit_sequence = edit_seq
            so.qb_inserted_at = so.qb_inserted_at or now
            so.inserted_in_qb = True
            so.force_to_sync = False
            so.sync_state = ZohoFullSalesOrder.SYNC_STATE_SKIPPED_DUPLICATE
            so.last_qb_error = None
            so.save(update_fields=[
                'qb_txn_id', 'qb_edit_sequence', 'qb_inserted_at',
                'inserted_in_qb', 'force_to_sync', 'sync_state', 'last_qb_error',
            ])
            marked += 1
        logger.info("SalesOrderQueryRs: %d sales order(s) marked as skipped_duplicate (already in QB).", marked)
    except Exception as e:
        logger.error("Error parsing SalesOrderQueryRs: %s", e)


def _apply_sales_order_add_response(xml_data: str) -> None:
    """Parse the receiveResponseXML body for SalesOrderAddRs and update each
    ZohoFullSalesOrder with the QB result (TxnID, sync_state, etc.).

    Errors are swallowed; the SOAP cycle must return 100 to QBWC regardless,
    and the operator can recover from logs.
    """
    try:
        xml_dict = xmltodict.parse(xml_data)
        body = xml_dict['soap:Envelope']['soap:Body']
        recv_key = helpers_qbwc._get_op_key(body, 'receiveResponseXML')
        if not recv_key:
            return
        inner_xml = body[recv_key].get('response') or ''
        if not inner_xml or 'SalesOrderAddRs' not in inner_xml:
            return

        data = xmltodict.parse(inner_xml)
        msgs = data.get('QBXML', {}).get('QBXMLMsgsRs', {})
        rs_node = msgs.get('SalesOrderAddRs')
        if not rs_node:
            return
        rs_iter = rs_node if isinstance(rs_node, list) else [rs_node]
        now = datetime.now(timezone.utc)

        for rs in rs_iter:
            request_id = rs.get('@requestID', '') or ''
            if not request_id.startswith('so-'):
                logger.warning("SalesOrderAddRs with unexpected requestID=%r", request_id)
                continue
            salesorder_id = request_id[len('so-'):]
            so = ZohoFullSalesOrder.objects.filter(salesorder_id=salesorder_id).first()
            if not so:
                logger.warning("SalesOrderAddRs for unknown salesorder_id=%s", salesorder_id)
                continue

            status_code = rs.get('@statusCode', '') or ''
            status_sev = rs.get('@statusSeverity', '') or ''
            status_msg = rs.get('@statusMessage', '') or ''
            ret = rs.get('SalesOrderRet') or {}

            if status_code == '0' and ret:
                so.qb_txn_id = ret.get('TxnID') or so.qb_txn_id
                so.qb_edit_sequence = ret.get('EditSequence') or so.qb_edit_sequence
                so.qb_inserted_at = now
                so.inserted_in_qb = True
                so.force_to_sync = False
                so.sync_state = ZohoFullSalesOrder.SYNC_STATE_CONFIRMED
                so.last_qb_error = None
                so.save(update_fields=[
                    'qb_txn_id', 'qb_edit_sequence', 'qb_inserted_at',
                    'inserted_in_qb', 'force_to_sync', 'sync_state', 'last_qb_error',
                ])
                logger.info("SalesOrder %s confirmed in QB (TxnID=%s)", salesorder_id, so.qb_txn_id)
            else:
                msg_low = status_msg.lower()
                is_dup = 'duplicate' in msg_low or (
                    'already' in msg_low and ('used' in msg_low or 'exist' in msg_low)
                )
                if is_dup:
                    so.sync_state = ZohoFullSalesOrder.SYNC_STATE_SKIPPED_DUPLICATE
                    so.inserted_in_qb = True
                    so.force_to_sync = False
                else:
                    so.sync_state = ZohoFullSalesOrder.SYNC_STATE_FAILED
                    so.inserted_in_qb = False
                so.last_qb_error = f"[{status_code}/{status_sev}] {status_msg}"
                so.save(update_fields=[
                    'sync_state', 'inserted_in_qb', 'force_to_sync', 'last_qb_error',
                ])
                logger.warning(
                    "SalesOrderAddRs salesorder_id=%s status=%s severity=%s msg=%s",
                    salesorder_id, status_code, status_sev, status_msg,
                )
    except Exception as e:
        logger.error("Error parsing SalesOrderAddRs: %s", e)


def process_qbwc_sales_order_add_request(xml_data):
    """Two-phase QBWC cycle for sales-order insertion, in a single endpoint:

      counter=0: send PreferencesQueryRq + SalesOrderQueryRq (by RefNumber) in
                 the SAME QBXMLMsgsRq block. The pref query surfaces a
                 notification if 'Warn about duplicate sales order numbers' is
                 OFF; the SO query marks existing duplicates as
                 skipped_duplicate with their TxnID.
      counter=1: send SalesOrderAddRq for the survivors. The Add filter excludes
                 anything with qb_txn_id, so duplicates from phase 1 are skipped.
      counter>=2: empty (signals QBWC we're done).

    receiveResponseXML dispatches by content (PreferencesQueryRs/
    SalesOrderQueryRs/SalesOrderAddRs) rather than by counter, since multiple
    Rs may coexist and the QBWC is free to pace the cycle.
    """
    global counter
    response = None
    try:
        xml_dict = xmltodict.parse(xml_data)
        body = xml_dict['soap:Envelope']['soap:Body']

        if helpers_qbwc._has_op(body, 'authenticate'):
            counter = 0
            response = soap_service.handle_authenticate(body)

        elif helpers_qbwc._has_op(body, 'sendRequestXML'):
            if counter == 0:
                counter = 1
                response = soap_service.generate_sales_order_pre_add_query_response()
            elif counter == 1:
                counter = 2
                response = soap_service.generate_sales_order_add_response()
            else:
                logger.info("sales_order_add: sendRequestXML after add phase. Returning empty.")
                response = soap_service.generate_empty_request_response()

        elif helpers_qbwc._has_op(body, 'receiveResponseXML'):
            recv_key = helpers_qbwc._get_op_key(body, 'receiveResponseXML')
            inner_xml = (body.get(recv_key) or {}).get('response') or '' if recv_key else ''
            if 'PreferencesQueryRs' in inner_xml:
                _apply_preferences_query_response(xml_data)
            if 'SalesOrderQueryRs' in inner_xml:
                _apply_sales_order_query_response(xml_data)
            if 'SalesOrderAddRs' in inner_xml:
                _apply_sales_order_add_response(xml_data)
            response = soap_service.generate_receive_response(percent='100')

        elif helpers_qbwc._has_op(body, 'closeConnection'):
            counter = 0
            response = soap_service.generate_close_connection_response()

        else:
            response = soap_service.generate_unsupported_request_response()

        return response
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        counter = 0
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
