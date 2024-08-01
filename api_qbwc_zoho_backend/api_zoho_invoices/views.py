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
from django.db.models import Q
from api_zoho.models import AppConfig, ZohoLoading   
from api_zoho_invoices.models import ZohoFullInvoice
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from api_zoho_items.models import ZohoItem
from api_zoho_customers.models import ZohoCustomer  
import requests
import json
import logging
import datetime as dt
import pandas as pd

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_invoice(request, invoice_id):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        pattern = r'^[A-Za-z0-9]{8}-[A-Za-z0-9]{10}$'
        zoho_invoice = ZohoFullInvoice.objects.get(invoice_id=invoice_id)
        all_items = ZohoItem.objects.filter(Q(qb_list_id__regex=pattern)).values_list('item_id', 'qb_list_id')
        df = pd.DataFrame(list(all_items), columns=['item_id', 'qb_list_id'])
        all_items_data = df[['item_id', 'qb_list_id']].to_dict(orient='records')
        all_customers = ZohoCustomer.objects.filter(Q(qb_list_id__regex=pattern)).values_list('contact_id', 'qb_list_id')
        dfc = pd.DataFrame(list(all_customers), columns=['contact_id', 'qb_list_id'])
        all_customers_data = dfc[['contact_id', 'qb_list_id']].to_dict(orient='records')
        qb_customer_list_id = ''
        
        for zoho_item in all_items_data: 
            for item in zoho_invoice.line_items:
                if item.get('item_id') == zoho_item['item_id']:
                    item['qb_list_id'] = zoho_item['qb_list_id']
                    
            for item in zoho_invoice.items_unmatched:
                if item.get('zoho_item_id') == zoho_item['item_id']:
                    item['qb_list_id'] = zoho_item['qb_list_id']
                    
        for zoho_customer in all_customers_data:
            if zoho_invoice.customer_id == zoho_customer['contact_id']:
                qb_customer_list_id = zoho_customer['qb_list_id']
            for customer in zoho_invoice.customer_unmatched:
                if customer.get('zoho_customer_id') == zoho_customer['contact_id']:
                    customer['qb_list_id'] = zoho_customer['qb_list_id']
                    
        cont_items = len(list(filter(lambda x: 'qb_list_id' in x, zoho_invoice.line_items)))
                        
        zoho_invoice.all_items_matched = cont_items == len(zoho_invoice.line_items)
        zoho_invoice.all_customer_matched = qb_customer_list_id != ''
        zoho_invoice.qb_customer_list_id = qb_customer_list_id
        zoho_invoice.save()
        
        zoho_invoice = model_to_dict(zoho_invoice)
        
        
        context = {
            'invoice': zoho_invoice
        }
        return JsonResponse(context, status=200)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


@login_required(login_url='login')
def list_invoices(request):
    invoice_list_query = ZohoFullInvoice.objects.all().order_by('-invoice_number')
    batch_size = 200  # Ajusta este tamaño según tus necesidades
    invoice_list = []
    
    # Dividir en partes y procesar cada parte
    for i in range(0, invoice_list_query.count(), batch_size):
        batch = invoice_list_query[i:i + batch_size]
        invoice_list.extend(batch)  
        
    context = {'invoices': invoice_list}
    return render(request, 'api_zoho_invoices/list_invoices.html', context)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def load_invoices(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        option = request.data.get('option', '')
        app_config = AppConfig.objects.first()
        try:
            headers = api_zoho_views.config_headers(request)  # Asegúrate de que esto esté configurado correctamente
        except Exception as e:
            logger.error(f"Error connecting to Zoho API: {str(e)}")
            context = {
                'error': f"Error connecting to Zoho API (Load Invoices): {str(e)}",
                'status_code': 500
            }
            return render(request, 'api_zoho/error.html', context)
        invoices_saved = list(ZohoFullInvoice.objects.all())
        today = date.today()
        yesterday = today - timedelta(days=1)
        date_to_query = today.strftime('%Y-%m-%d') if option == 'Today' else yesterday.strftime('%Y-%m-%d')
        # today = '2024-06-28'
        params = {
            'organization_id': app_config.zoho_org_id,  # ID de la organización en Zoho Books
            'page': 1,       # Página inicial
            'per_page': 200,  # Cantidad de resultados por página
            'date_start': f'{date_to_query}',  # Filtrar por fecha actual
            'date_end': f'{date_to_query}'     # Filtrar por fecha actual
        }
        
        url = f'{settings.ZOHO_URL_READ_INVOICES}'
        invoices_to_save = []
        invoices_to_get = []
        
        while True:
            try:
                response = requests.get(url, headers=headers, params=params)
                if response.status_code == 401:  # Si el token ha expirado
                    new_token = api_zoho_views.refresh_zoho_token()
                    headers['Authorization'] = f'Zoho-oauthtoken {new_token}'
                    response = requests.get(url, headers=headers, params=params)  # Reintenta la solicitud
                elif response.status_code != 200:
                    logger.error(f"Error fetching customers: {response.text}")
                    context = {
                        'error': response.text,
                        'status_code': response.status_code
                    }
                    return JsonResponse({'error': f"Error fetching customers: {response.text}"}, status=response.status_code)
                else:
                    response.raise_for_status()
                    invoices = response.json()
                    if 'invoices' in invoices:
                        for invoice in invoices.get('invoices', []):
                            data = json.loads(invoice) if isinstance(invoice, str) else invoice
                            get_url = f'{settings.ZOHO_URL_READ_INVOICES}/{data.get("invoice_id")}/?organization_id={app_config.zoho_org_id}'
                            response = requests.get(get_url, headers=headers)
                            if response.status_code == 200:
                                response.raise_for_status()
                                full_invoice = response.json()
                                data = json.loads(full_invoice.get('invoice')) if isinstance(full_invoice.get('invoice'), str) else full_invoice.get('invoice')
                                invoices_to_get.append(data)
                            
                    # Verifica si hay más páginas para obtener
                    if 'page_context' in invoices and 'has_more_page' in invoices['page_context'] and invoices['page_context']['has_more_page']:
                        params['page'] += 1  # Avanza a la siguiente página
                    else:
                        break  # Sal del bucle si no hay más páginas
            except requests.exceptions.RequestException as e:
                logger.error(f"Error fetching invoices: {e}")
                return JsonResponse({"error": "Failed to fetch invoices"}, status=500)
        
        existing_invoices = {invoice.invoice_id: invoice for invoice in invoices_saved}

        for data in invoices_to_get:
            new_invoice = create_invoice_instance(data)
            if new_invoice.invoice_id not in existing_invoices:
                invoices_to_save.append(new_invoice)
        
        def save_invoices_in_batches(invoices, batch_size=100):
            for i in range(0, len(invoices), batch_size):
                batch = invoices[i:i + batch_size]
                with transaction.atomic():
                    ZohoFullInvoice.objects.bulk_create(batch)
        
        save_invoices_in_batches(invoices_to_save, batch_size=100)
        
        if len(invoices_to_get) > 0:
            current_time_utc = dt.datetime.now(dt.timezone.utc)
            zoho_loading = ZohoLoading.objects.filter(zoho_module='invoices', zoho_record_created=current_time_utc).first()
            if not zoho_loading:
                zoho_loading = api_zoho_views.create_zoho_loading_instance('invoices')
            else:
                zoho_loading.zoho_record_updated = current_time_utc
            zoho_loading.save()
        
        return JsonResponse({'message': 'Invoices loaded successfully'}, status=200)
    
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_invoice(request, invoice_id):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        try:
            invoice = ZohoFullInvoice.objects.filter(invoice_id=invoice_id).first()
            invoice.delete()
            return JsonResponse({'status':'success', 'message': 'Invoice deleted successfully'}, status=200)
        except Exception as e:
            logger.error(f"Error deleting invoice: {e}")
            return JsonResponse({'error': 'Failed to delete invoice'}, status=500)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


def create_invoice_instance(data):
    try:
        instance = ZohoFullInvoice(
            invoice_id=data.get('invoice_id', ''),
            invoice_number=data.get('invoice_number', ''),
            date=parse_date(data.get('date')),
            due_date=parse_date(data.get('due_date')),
            customer_id=data.get('customer_id', ''),
            customer_name=data.get('customer_name', ''),
            email=data.get('email', ''),
            status=data.get('status', ''),
            recurring_invoice_id=data.get('recurring_invoice_id', ''),
            payment_terms=data.get('payment_terms', 0),
            payment_terms_label=data.get('payment_terms_label', ''),
            payment_reminder_enabled=data.get('payment_reminder_enabled', False),
            payment_discount=data.get('payment_discount', 0.0),
            credits_applied=data.get('credits_applied', 0.0),
            payment_made=data.get('payment_made', 0.0),
            reference_number=data.get('reference_number', ''),
            line_items=data.get('line_items', []),
            allow_partial_payments=data.get('allow_partial_payments', False),
            price_precision=data.get('price_precision', 2),
            sub_total=data.get('sub_total', 0.0),
            tax_total=data.get('tax_total', 0.0),
            discount_total=data.get('discount_total', 0.0),
            discount_percent=data.get('discount_percent', 0.0),
            discount=data.get('discount', 0.0),
            discount_applied_on_amount=data.get('discount_applied_on_amount', 0.0),
            discount_type=data.get('discount_type', ''),
            tax_override_preference=data.get('tax_override_preference', ''),
            is_discount_before_tax=data.get('is_discount_before_tax', True),
            adjustment=data.get('adjustment', 0.0),
            adjustment_description=data.get('adjustment_description', ''),
            total=data.get('total', 0.0),
            balance=data.get('balance', 0.0),
            is_inclusive_tax=data.get('is_inclusive_tax', False),
            sub_total_inclusive_of_tax=data.get('sub_total_inclusive_of_tax', 0.0),
            contact_category=data.get('contact_category', ''),
            tax_rounding=data.get('tax_rounding', ''),
            taxes=data.get('taxes', []),
            tds_calculation_type=data.get('tds_calculation_type', ''),
            last_payment_date=parse_date(data.get('last_payment_date')),
            contact_persons=data.get('contact_persons', []),
            salesorder_id=data.get('salesorder_id', ''),
            salesorder_number=data.get('salesorder_number', ''),
            salesorders=data.get('salesorders', []),
            contact_persons_details=data.get('contact_persons_details', []),
            created_time=parse_date(data.get('created_time')),
            last_modified_time=parse_date(data.get('last_modified_time')),
            created_date=parse_date(data.get('created_date')),
            created_by_name=data.get('created_by_name', ''),
            estimate_id=data.get('estimate_id', ''),
            customer_default_billing_address=data.get('customer_default_billing_address', {}),
            notes=data.get('notes', ''),
            terms=data.get('terms', ''),
            billing_address=data.get('billing_address', {}),
            shipping_address=data.get('shipping_address', {}),
            contact=data.get('contact', {}),
            inserted_in_qb=data.get('inserted_in_qb', False),
            items_unmatched=data.get('items_unmatched', []),
            customer_unmatched=data.get('customer_unmatched', []),
            force_to_sync=data.get('force_to_sync', False),
            last_sync_date=parse_date(data.get('last_sync_date')),
            number_of_times_synced=data.get('number_of_times_synced', 0)
        )
    except Exception as e:
        logger.error(f"Error creating instance: {e}")
        return None
    return instance
    

def parse_date(datetime_str):
    if not datetime_str:
        return None
    try:
        # Parse the datetime string assuming it has a timezone
        aware_datetime = dtime.fromisoformat(datetime_str)
        # date = aware_datetime.date().strftime('%Y-%m-%d')
        date = aware_datetime.date()
        return date
    except ValueError:
        # If parsing fails, return None or handle it appropriately
        return None