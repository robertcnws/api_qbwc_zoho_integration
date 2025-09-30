from django.shortcuts import render
from django.http import JsonResponse
from django.utils.timezone import make_aware
from datetime import datetime as dtime
from datetime import date, timedelta
import api_zoho.views as api_zoho_views
from django.conf import settings
from django.db import transaction
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.forms.models import model_to_dict
from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError
from django.db.models import Q
from api_zoho.models import AppConfig, ZohoLoading   
from api_zoho_sales_orders.models import ZohoFullSalesOrder
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from api_zoho_items.models import ZohoItem
from api_zoho_customers.models import ZohoCustomer 
from api_zoho_invoices.views import handle_option_date 
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.utils import timezone
from django.utils.dateparse import parse_datetime, parse_date
from utils.helpers import nz_str, nz_int, nz_bool, nz_decimal, nz_date, nz_datetime
import requests
import json
import logging
import datetime as dt
import pandas as pd

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_sales_order(request, sales_order_id):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        pattern = r'^[A-Za-z0-9]{8}-[A-Za-z0-9]{10}$'
        zoho_sales_order = ZohoFullSalesOrder.objects.get(salesorder_id=sales_order_id)
        all_items = ZohoItem.objects.filter(Q(qb_list_id__regex=pattern)).values_list('item_id', 'qb_list_id')
        df = pd.DataFrame(list(all_items), columns=['item_id', 'qb_list_id'])
        all_items_data = df[['item_id', 'qb_list_id']].to_dict(orient='records')
        all_customers = ZohoCustomer.objects.filter(Q(qb_list_id__regex=pattern)).values_list('contact_id', 'qb_list_id')
        dfc = pd.DataFrame(list(all_customers), columns=['contact_id', 'qb_list_id'])
        all_customers_data = dfc[['contact_id', 'qb_list_id']].to_dict(orient='records')
        qb_customer_list_id = ''
        
        for zoho_item in all_items_data: 
            for item in zoho_sales_order.line_items:
                if item.get('item_id') == zoho_item['item_id']:
                    item['qb_list_id'] = zoho_item['qb_list_id']

            for item in zoho_sales_order.items_unmatched:
                if item.get('zoho_item_id') == zoho_item['item_id']:
                    item['qb_list_id'] = zoho_item['qb_list_id']
                    
        for zoho_customer in all_customers_data:
            if zoho_sales_order.customer_id == zoho_customer['contact_id']:
                qb_customer_list_id = zoho_customer['qb_list_id']
            for customer in zoho_sales_order.customer_unmatched:
                if customer.get('zoho_customer_id') == zoho_customer['contact_id']:
                    customer['qb_list_id'] = zoho_customer['qb_list_id']
                    
        cont_items = len(list(filter(lambda x: 'qb_list_id' in x, zoho_sales_order.line_items)))

        zoho_sales_order.all_items_matched = cont_items == len(zoho_sales_order.line_items)
        zoho_sales_order.all_customer_matched = qb_customer_list_id != ''
        zoho_sales_order.qb_customer_list_id = qb_customer_list_id
        zoho_sales_order.save()

        zoho_sales_order = model_to_dict(zoho_sales_order)

        context = {
            'sales_order': zoho_sales_order
        }
        return JsonResponse(context, status=200)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


@login_required(login_url='login')
def list_sales_orders(request):
    sales_order_list_query = ZohoFullSalesOrder.objects.all().order_by('-salesorder_number')
    batch_size = 200  # Ajusta este tamaño según tus necesidades
    sales_orders_list = []
    
    # Dividir en partes y procesar cada parte
    for i in range(0, sales_order_list_query.count(), batch_size):
        batch = sales_order_list_query[i:i + batch_size]
        sales_orders_list.extend(batch)

    context = {'sales_orders': sales_orders_list}
    return render(request, 'api_zoho_sales_orders/list_sales_orders.html', context)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def load_sales_orders(request, task_job=False):
    if request:
        valid_token = api_zoho_views.validateJWTTokenRequest(request)
        if not valid_token:
            return JsonResponse({'error': 'Invalid JWT Token'}, status=401)
        logger.info("Loading sales orders from Main Load Data System")
        if task_job:
            logger.info("Task job initiated load_sales_orders")
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error in task job for Sales Orders: {str(e)}")
                return JsonResponse({"message": "Invalid JSON"}, status=400)
        else:
            logger.info("User initiated load_sales_orders")
            data = request.data or request.query_params
            logger.debug(f"Request content_type={request.content_type}, data={data}")
            if not data:
                return JsonResponse({'error': 'No data provided'}, status=400)
            
        username = data.get('username', '') if not task_job else 'system_task_job'
        
        today, yesterday = date.today(), date.today() - timedelta(days=1)
        date_to_query = handle_option_date(data.get('option', None), today, yesterday)
        if not date_to_query:
            return JsonResponse({'error': 'Invalid date format. Use yyyy-MM-dd format.'}, status=400)
        response = fetch_sales_orders(date_to_query)
        logger.debug(f"Fetched {response.get('count', 0)} sales orders from Main Load Data System")
        if 'error' in response:
            return JsonResponse({'error': response['error']}, status=500)
        records = _unwrap_sales_orders(response)

        created, updated, skipped, errors = 0, 0, 0, 0
        created_ids, updated_ids, skipped_ids, error_details = [], [], [], []
        
        try:
            with transaction.atomic(): 
                for raw in records:
                    if not isinstance(raw, dict):
                        skipped += 1
                        skipped_ids.append(str(raw))
                        continue

                    rec = _coerce_dates(dict(raw))
                    salesorder_id = rec.get("salesorder_id") or rec.get("sales_order_id")
                    if not salesorder_id:
                        skipped += 1
                        skipped_ids.append(rec.get("salesorder_number") or "<no-id>")
                        continue

                    try:
                        with transaction.atomic():
                            existing = (
                                ZohoFullSalesOrder.objects
                                .filter(salesorder_id=salesorder_id)
                                .first()
                            )

                            if existing:
                                edited = edit_sales_order_instance(existing, rec)
                                if edited is None:
                                    raise ValueError("edit_failed")
                                edited.save()
                                updated += 1
                                updated_ids.append(salesorder_id)
                            else:
                                instance = create_sales_order_instance(rec)
                                if instance is None:
                                    raise ValueError("create_failed")
                                instance.save()
                                created += 1
                                created_ids.append(salesorder_id)

                    except IntegrityError as ie:
                        logger.exception("IntegrityError on salesorder %s", salesorder_id)
                        errors += 1
                        error_details.append({"id": salesorder_id, "reason": f"integrity_error: {ie}"})
                    except Exception as e:
                        logger.exception("Unexpected error on salesorder %s", salesorder_id)
                        errors += 1
                        error_details.append({"id": salesorder_id, "reason": f"unexpected: {e}"})

        except Exception as e:
            logger.exception("Transaction failed while loading sales orders")
            return JsonResponse({"error": f"transaction_failed: {e}"}, status=500)
        
        if len(records) > 0:
            current_time_utc = dt.datetime.now(dt.timezone.utc)
            zoho_loading, created = ZohoLoading.objects.update_or_create(
                zoho_module='sales_orders',
                defaults={'zoho_record_created': current_time_utc, 'zoho_record_updated': current_time_utc}
            )
            if created:
                zoho_loading.save()
            api_zoho_views.manage_api_tracking_log(username, 'load_sales_orders', request.META.get('REMOTE_ADDR'), 'Loaded sales orders from Zoho Books')
            message_notification = f"Sales Orders have been loaded successfully from Zoho Books"
            api_zoho_views.manage_notifications(message_notification)

        summary = {
            "date_queried": str(date_to_query),
            "total_received": len(records),
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "errors": errors,
            "created_ids": created_ids,
            "updated_ids": updated_ids,
            "skipped_ids": skipped_ids,
            "error_details": error_details,
        }
        return JsonResponse(summary, status=200)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)

#############################################
# HEADERS
#############################################

def main_load_config_headers():
    token = settings.API_MAIN_DATA_TOKEN
    headers = {
        "Authorization": f"Token {token}"
    }
    return headers

#############################################
# FETCH SALES ORDERS
#############################################

def fetch_sales_orders(date_to_query):
    print(f"Fetching sales orders with data: {date_to_query}")
    headers = main_load_config_headers()
    params = []
    url = f'{settings.API_MAIN_DATA_URL}/zoho/sales_orders_to_service/?'
    if date_to_query and date_to_query != '':
        params.append(f"date={date_to_query}")
    params.append("is_recent=true")
    if len(params) > 0:
        url = f"{url}{'&'.join(params)}"
    items_to_get = []
    session = requests.Session()
    page = 1
    while True:
        try:
            paged_url = f"{url}&page={page}" if '?' in url else f"{url}?page={page}"
            response = session.get(paged_url, headers=headers)
            response.raise_for_status()
            items = response.json()
            items_confirmed = list(items.get('results', []))
            items_to_get.extend(items_confirmed)
            if not items.get('next', None):
                break
            page += 1
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching sales orders: {e}")
            return {'error': 'Failed to fetch sales orders to reward points'}
    return {'count': len(items_to_get), 'results': items_to_get}
    
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_sales_order(request, sales_order_id):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        try:
            sales_order = ZohoFullSalesOrder.objects.filter(sales_order_id=sales_order_id).first()
            sales_order.delete()
            username = request.data.get('username', '')
            api_zoho_views.manage_api_tracking_log(username, 'delete_sales_order', request.META.get('REMOTE_ADDR'), f'Deleted sales order {sales_order_id}')
            return JsonResponse({'status':'success', 'message': 'Sales order deleted successfully'}, status=200)
        except Exception as e:
            logger.error(f"Error deleting sales order: {e}")
            return JsonResponse({'error': 'Failed to delete sales order'}, status=500)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


def create_sales_order_instance(data):
    try:
        is_dict = isinstance(data, dict)
        get = (lambda k, d=None: data.get(k, d)) if is_dict else (lambda k, d=None: getattr(data, k, d))

        instance = ZohoFullSalesOrder(
            # IDs / básicos
            salesorder_id=nz_str(get('salesorder_id', '')),
            salesorder_number=nz_str(get('salesorder_number', '')),

            date=nz_date(get('date')),
            status=nz_str(get('status', '')),
            customer_id=nz_str(get('customer_id', '')),
            customer_name=nz_str(get('customer_name', '')),

            qb_customer_list_id=nz_str(get('qb_customer_list_id', None)) or None,

            # Números/decimales (¡no permitir ''!)
            is_taxable=nz_bool(get('is_taxable', False)),
            tax_id=nz_str(get('tax_id', None)) or None,
            tax_name=nz_str(get('tax_name', None)) or None,
            tax_percentage=nz_decimal(get('tax_percentage', 0)),
            exchange_rate=nz_decimal(get('exchange_rate', 1)),
            total_quantity=nz_int(get('total_quantity', 0)),
            sub_total=nz_decimal(get('sub_total', 0)),
            tax_total=nz_decimal(get('tax_total', 0)),
            total=nz_decimal(get('total', 0)),

            # Estructuras JSON (listas/dicts) — si vienen vacías, setear default válido
            line_items=get('line_items') or [],
            currency_id=nz_str(get('currency_id', None)) or None,
            currency_code=nz_str(get('currency_code', 'USD')) or 'USD',
            currency_symbol=nz_str(get('currency_symbol', '$')) or '$',
            delivery_method=nz_str(get('delivery_method', None)) or None,

            created_by_email=nz_str(get('created_by_email', None)) or None,
            created_by_name=nz_str(get('created_by_name', None)) or None,
            salesperson_id=nz_str(get('salesperson_id', None)) or None,
            salesperson_name=nz_str(get('salesperson_name', None)) or None,

            is_test_order=nz_bool(get('is_test_order', False)),
            notes=nz_str(get('notes', None)) or None,
            payment_terms=nz_int(get('payment_terms', 0)),
            payment_terms_label=nz_str(get('payment_terms_label', None)) or None,

            shipping_address=get('shipping_address') or {},
            billing_address=get('billing_address') or {},
            custom_fields=get('custom_fields') or [],

            order_sub_statuses_raw=get('order_sub_statuses_raw') or get('order_sub_statuses') or [],
            shipment_sub_statuses=get('shipment_sub_statuses') or [],

            created_time=nz_datetime(get('created_time')),
            last_modified_time=nz_datetime(get('last_modified_time')),

            zoho_org_id=nz_str(get('zoho_org_id', '')),
            reference_number=nz_str(get('reference_number', None)) or None,

            inserted_in_qb=nz_bool(get('inserted_in_qb', False)),
            items_unmatched=get('items_unmatched') or [],
            customer_unmatched=get('customer_unmatched') or [],
            force_to_sync=nz_bool(get('force_to_sync', False)),
            last_sync_date=nz_date(get('last_sync_date')),
            number_of_times_synced=nz_int(get('number_of_times_synced', 0)),
            all_items_matched=nz_bool(get('all_items_matched', False)),
            all_customer_matched=nz_bool(get('all_customer_matched', False)),
        )

        # normaliza email
        if instance.created_by_email:
            instance.created_by_email = instance.created_by_email.lower()

        # (opcional pero MUY útil) valida antes de guardar para ver el campo exacto que falla
        instance.full_clean()  # lanza ValidationError con campo específico

        return instance

    except Exception as e:
        logger.exception("Error creating ZohoFullSalesOrder instance (coercion/validation): %s", e)
        return None



def edit_sales_order_instance(existing_order, new_order):
    try:
        is_dict = isinstance(new_order, dict)
        get = (lambda k,d=None:new_order.get(k,d)) if is_dict else (lambda k,d=None:getattr(new_order,k,d))

        # Identificadores / básicos
        existing_order.salesorder_id = nz_str(get('salesorder_id', existing_order.salesorder_id))
        existing_order.salesorder_number = nz_str(get('salesorder_number', existing_order.salesorder_number))
        existing_order.date = nz_date(get('date', existing_order.date))
        existing_order.status = nz_str(get('status', existing_order.status))
        existing_order.customer_id = nz_str(get('customer_id', existing_order.customer_id))
        existing_order.customer_name = nz_str(get('customer_name', existing_order.customer_name))
        existing_order.qb_customer_list_id = nz_str(get('qb_customer_list_id', existing_order.qb_customer_list_id)) or None

        # Impuestos / moneda / totales
        existing_order.is_taxable = nz_bool(get('is_taxable', existing_order.is_taxable))
        existing_order.tax_id = nz_str(get('tax_id', existing_order.tax_id)) or None
        existing_order.tax_name = nz_str(get('tax_name', existing_order.tax_name)) or None
        existing_order.tax_percentage = nz_decimal(get('tax_percentage', existing_order.tax_percentage))
        existing_order.line_items = get('line_items', existing_order.line_items) or []
        existing_order.currency_id = nz_str(get('currency_id', existing_order.currency_id)) or None
        existing_order.currency_code = nz_str(get('currency_code', existing_order.currency_code or 'USD')) or 'USD'
        existing_order.currency_symbol = nz_str(get('currency_symbol', existing_order.currency_symbol or '$')) or '$'
        existing_order.exchange_rate = nz_decimal(get('exchange_rate', existing_order.exchange_rate))
        existing_order.delivery_method = nz_str(get('delivery_method', existing_order.delivery_method)) or None
        existing_order.total_quantity = nz_int(get('total_quantity', existing_order.total_quantity))
        existing_order.sub_total = nz_decimal(get('sub_total', existing_order.sub_total))
        existing_order.tax_total = nz_decimal(get('tax_total', existing_order.tax_total))
        existing_order.total = nz_decimal(get('total', existing_order.total))

        # Creación / vendedor
        created_by_email_val = get('created_by_email', existing_order.created_by_email)
        existing_order.created_by_email = (nz_str(created_by_email_val).lower() if created_by_email_val else None)
        existing_order.created_by_name = nz_str(get('created_by_name', existing_order.created_by_name)) or None
        existing_order.salesperson_id = nz_str(get('salesperson_id', existing_order.salesperson_id)) or None
        existing_order.salesperson_name = nz_str(get('salesperson_name', existing_order.salesperson_name)) or None

        # Extras
        existing_order.is_test_order = nz_bool(get('is_test_order', existing_order.is_test_order))
        existing_order.notes = nz_str(get('notes', existing_order.notes)) or None
        existing_order.payment_terms = nz_int(get('payment_terms', existing_order.payment_terms))
        existing_order.payment_terms_label = nz_str(get('payment_terms_label', existing_order.payment_terms_label)) or None

        # Direcciones / personalizados
        existing_order.shipping_address = get('shipping_address', existing_order.shipping_address) or {}
        existing_order.billing_address = get('billing_address', existing_order.billing_address) or {}
        existing_order.custom_fields = get('custom_fields', existing_order.custom_fields) or []

        # Sub-estados y shipments
        oss = get('order_sub_statuses_raw', None)
        if oss is None:
            oss = get('order_sub_statuses', existing_order.order_sub_statuses_raw)
        existing_order.order_sub_statuses_raw = oss or []
        existing_order.shipment_sub_statuses = get('shipment_sub_statuses', existing_order.shipment_sub_statuses) or []

        # Tiempos
        existing_order.created_time = nz_datetime(get('created_time', existing_order.created_time))
        existing_order.last_modified_time = nz_datetime(get('last_modified_time', existing_order.last_modified_time))

        # Org / referencia
        existing_order.zoho_org_id = nz_str(get('zoho_org_id', existing_order.zoho_org_id))
        existing_order.reference_number = nz_str(get('reference_number', existing_order.reference_number)) or None

        # Flags internos
        existing_order.inserted_in_qb = nz_bool(get('inserted_in_qb', existing_order.inserted_in_qb))
        existing_order.items_unmatched = get('items_unmatched', existing_order.items_unmatched) or []
        existing_order.customer_unmatched = get('customer_unmatched', existing_order.customer_unmatched) or []
        existing_order.force_to_sync = nz_bool(get('force_to_sync', existing_order.force_to_sync))
        existing_order.last_sync_date = nz_date(get('last_sync_date', existing_order.last_sync_date or timezone.now().date()))
        existing_order.number_of_times_synced = nz_int(get('number_of_times_synced', existing_order.number_of_times_synced))
        existing_order.all_items_matched = nz_bool(get('all_items_matched', existing_order.all_items_matched))
        existing_order.all_customer_matched = nz_bool(get('all_customer_matched', existing_order.all_customer_matched))

        existing_order.full_clean()
        return existing_order
    except ValidationError as ve:
        logger.exception("ValidationError editing ZohoFullSalesOrder: %s", getattr(ve, 'message_dict', ve))
        return None
    except Exception as e:
        logger.exception("Error editing ZohoFullSalesOrder instance: %s", e)
        return None

    

def _unwrap_sales_orders(response):
    # logger.debug(f"Unwrapping sales orders from response: {response}")
    if isinstance(response, list):
        return response
    if isinstance(response, dict):
        for key in ("sales_orders", "salesorders", "data", "orders", "results"):
            if key in response and isinstance(response[key], list):
                return response[key]
    return [response] if isinstance(response, dict) else []


def _coerce_dates(record):
    def take(v):
        if isinstance(v, dict) and "date" in v:
            return v["date"]
        return v
    
    for k in ("date", "created_time", "last_modified_time", "last_sync_date"):
        if k in record:
            raw = take(record[k])
            if k in ("created_time", "last_modified_time"):
                dt = parse_datetime(raw) if isinstance(raw, str) else None
                if dt:
                    record[k] = dt
            else:
                d = parse_date(raw) if isinstance(raw, str) else None
                if d:
                    record[k] = d
    return record