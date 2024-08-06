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
def load_invoices(request, task_job=False):
    if request:
        valid_token = api_zoho_views.validateJWTTokenRequest(request)
        if valid_token:
            logger.info("Loading invoices from Zoho Books")
            if task_job:
                try:
                    data = json.loads(request.body)
                    option = data.get('option', '')
                    username = data.get('username', '')
                except json.JSONDecodeError as e:
                    logger.error(f"JSON decode error: {str(e)}")
                    return JsonResponse({"message": "Invalid JSON"}, status=400)
            else:
                option = request.data.get('option', '')
                username = request.data.get('username', '')
            app_config = AppConfig.objects.first()
            try:
                headers = api_zoho_views.config_headers(request)  # Asegúrate de que esto esté configurado correctamente
            except Exception as e:
                logger.error(f"Error connecting to Zoho API: {str(e)}")
                context = {
                    'error': f"Error connecting to Zoho API (Load Invoices): {str(e)}",
                    'status_code': 500
                }
                return JsonResponse({'error': f"{context}"}, status=context['status_code'])
            invoices_saved = list(ZohoFullInvoice.objects.all())
            today = date.today()
            yesterday = today - timedelta(days=1)
            if option == 'Today':
                date_to_query = today.strftime('%Y-%m-%d')
            elif option == 'Yesterday':
                date_to_query = yesterday.strftime('%Y-%m-%d')
            else:
                try:
                    # Try to parse the option as a date
                    parsed_date = dtime.strptime(option, '%Y-%m-%d').date()
                    date_to_query = parsed_date.strftime('%Y-%m-%d')
                except ValueError:
                    # Handle the error if the date is not in the correct format
                    logger.error(f"Invalid date format provided: {option}")
                    context = {
                        'error': 'Invalid date format. Please provide a date in yyyy-MM-dd format.',
                        'status_code': 400
                    }
                    # return JsonResponse({'error': f"{context}"}, status=response.status_code)
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
                else:
                    existing_invoice = existing_invoices[new_invoice.invoice_id]
                    
                    if existing_invoice.last_modified_time != new_invoice.last_modified_time:
                        existing_invoice = edit_invoice_instance(existing_invoice, new_invoice)
                        existing_invoice.save()
            
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
                api_zoho_views.manage_api_tracking_log(username, 'load_invoices', request.META.get('REMOTE_ADDR'), 'Loaded invoices from Zoho Books')
            
            return JsonResponse({'message': 'Invoices loaded successfully'}, status=200)
        
        return JsonResponse({'error': 'Invalid JWT Token'}, status=401)
    
    return JsonResponse({'error': 'Invalid request'}, status=400)
    
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_invoice(request, invoice_id):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        try:
            invoice = ZohoFullInvoice.objects.filter(invoice_id=invoice_id).first()
            invoice.delete()
            username = request.data.get('username', '')
            api_zoho_views.manage_api_tracking_log(username, 'delete_invoice', request.META.get('REMOTE_ADDR'), f'Deleted invoice {invoice_id}')
            return JsonResponse({'status':'success', 'message': 'Invoice deleted successfully'}, status=200)
        except Exception as e:
            logger.error(f"Error deleting invoice: {e}")
            return JsonResponse({'error': 'Failed to delete invoice'}, status=500)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


def create_invoice_instance(data):
    try:
        instance = ZohoFullInvoice(
            invoice_id=data.get('invoice_id', '') if isinstance(data , dict) else data.invoice_id,
            invoice_number=data.get('invoice_number', '') if isinstance(data , dict) else data.invoice_number,
            date=parse_date(data.get('date')) if isinstance(data , dict) else data.date,
            due_date=parse_date(data.get('due_date')) if isinstance(data , dict) else data.due_date,
            customer_id=data.get('customer_id', '') if isinstance(data , dict) else data.customer_id,
            customer_name=data.get('customer_name', '') if isinstance(data , dict) else data.customer_name,
            email=data.get('email', '') if isinstance(data , dict) else data.email,
            status=data.get('status', '') if isinstance(data , dict) else data.status,
            recurring_invoice_id=data.get('recurring_invoice_id', '') if isinstance(data , dict) else data.recurring_invoice_id,
            payment_terms=data.get('payment_terms', 0) if isinstance(data , dict) else data.payment_terms,
            payment_terms_label=data.get('payment_terms_label', '') if isinstance(data , dict) else data.payment_terms_label,
            payment_reminder_enabled=data.get('payment_reminder_enabled', False) if isinstance(data , dict) else data.payment_reminder_enabled,
            payment_discount=data.get('payment_discount', 0.0) if isinstance(data , dict) else data.payment_discount,
            credits_applied=data.get('credits_applied', 0.0) if isinstance(data , dict) else data.credits_applied,
            payment_made=data.get('payment_made', 0.0) if isinstance(data , dict) else data.payment_made,
            reference_number=data.get('reference_number', '') if isinstance(data , dict) else data.reference_number,
            line_items=data.get('line_items', []) if isinstance(data , dict) else data.line_items,
            allow_partial_payments=data.get('allow_partial_payments', False) if isinstance(data , dict) else data.allow_partial_payments,
            price_precision=data.get('price_precision', 2) if isinstance(data , dict) else data.price_precision,
            sub_total=data.get('sub_total', 0.0) if isinstance(data , dict) else data.sub_total,
            tax_total=data.get('tax_total', 0.0) if isinstance(data , dict) else data.tax_total,
            discount_total=data.get('discount_total', 0.0) if isinstance(data , dict) else data.discount_total,
            discount_percent=data.get('discount_percent', 0.0) if isinstance(data , dict) else data.discount_percent,
            discount=data.get('discount', 0.0) if isinstance(data , dict) else data.discount,
            discount_applied_on_amount=data.get('discount_applied_on_amount', 0.0) if isinstance(data , dict) else data.discount_applied_on_amount,
            discount_type=data.get('discount_type', '') if isinstance(data , dict) else data.discount_type,
            tax_override_preference=data.get('tax_override_preference', '') if isinstance(data , dict) else data.tax_override_preference,
            is_discount_before_tax=data.get('is_discount_before_tax', True) if isinstance(data , dict) else data.is_discount_before_tax,
            adjustment=data.get('adjustment', 0.0) if isinstance(data , dict) else data.adjustment,
            adjustment_description=data.get('adjustment_description', '') if isinstance(data , dict) else data.adjustment_description,
            total=data.get('total', 0.0) if isinstance(data , dict) else data.total,
            balance=data.get('balance', 0.0) if isinstance(data , dict) else data.balance,
            is_inclusive_tax=data.get('is_inclusive_tax', False) if isinstance(data , dict) else data.is_inclusive_tax,
            sub_total_inclusive_of_tax=data.get('sub_total_inclusive_of_tax', 0.0) if isinstance(data , dict) else data.sub_total_inclusive_of_tax,
            contact_category=data.get('contact_category', '') if isinstance(data , dict) else data.contact_category,
            tax_rounding=data.get('tax_rounding', '') if isinstance(data , dict) else data.tax_rounding,
            taxes=data.get('taxes', []) if isinstance(data , dict) else data.taxes,
            tds_calculation_type=data.get('tds_calculation_type', '') if isinstance(data , dict) else data.tds_calculation_type,
            last_payment_date=parse_date(data.get('last_payment_date')) if isinstance(data , dict) else data.last_payment_date,
            contact_persons=data.get('contact_persons', []) if isinstance(data , dict) else data.contact_persons,
            salesorder_id=data.get('salesorder_id', '') if isinstance(data , dict) else data.salesorder_id,
            salesorder_number=data.get('salesorder_number', '') if isinstance(data , dict) else data.salesorder_number,
            salesorders=data.get('salesorders', []) if isinstance(data , dict) else data.salesorders,
            contact_persons_details=data.get('contact_persons_details', []) if isinstance(data , dict) else data.contact_persons_details,
            created_time=parse_date(data.get('created_time')) if isinstance(data , dict) else data.created_time,
            last_modified_time=parse_date(data.get('last_modified_time')) if isinstance(data , dict) else data.last_modified_time,
            created_date=parse_date(data.get('created_date')) if isinstance(data , dict) else data.created_date,
            created_by_name=data.get('created_by_name', '') if isinstance(data , dict) else data.created_by_name,
            estimate_id=data.get('estimate_id', '') if isinstance(data , dict) else data.estimate_id,
            customer_default_billing_address=data.get('customer_default_billing_address', {}) if isinstance(data , dict) else data.customer_default_billing_address,
            notes=data.get('notes', '') if isinstance(data , dict) else data.notes,
            terms=data.get('terms', '') if isinstance(data , dict) else data.terms,
            billing_address=data.get('billing_address', {}) if isinstance(data , dict) else data.billing_address,
            shipping_address=data.get('shipping_address', {}) if isinstance(data , dict) else data.shipping_address,
            contact=data.get('contact', {}) if isinstance(data , dict) else data.contact,
            inserted_in_qb=data.get('inserted_in_qb', False) if isinstance(data , dict) else data.inserted_in_qb,
            items_unmatched=data.get('items_unmatched', []) if isinstance(data , dict) else data.items_unmatched,
            customer_unmatched=data.get('customer_unmatched', []) if isinstance(data , dict) else data.customer_unmatched,
            force_to_sync=data.get('force_to_sync', False) if isinstance(data , dict) else data.force_to_sync,
            last_sync_date=parse_date(data.get('last_sync_date')) if isinstance(data , dict) else data.last_sync_date,
            number_of_times_synced=data.get('number_of_times_synced', 0) if isinstance(data , dict) else data.number_of_times_synced
        )
    except Exception as e:
        logger.error(f"Error creating instance: {e}")
        return None
    return instance


def edit_invoice_instance(existing_invoice, new_invoice):
    try:
        existing_invoice.invoice_number = new_invoice.invoice_number
        existing_invoice.date = new_invoice.date
        existing_invoice.due_date = new_invoice.due_date
        existing_invoice.customer_id = new_invoice.customer_id
        existing_invoice.customer_name = new_invoice.customer_name
        existing_invoice.email = new_invoice.email
        existing_invoice.status = new_invoice.status
        existing_invoice.recurring_invoice_id = new_invoice.recurring_invoice_id
        existing_invoice.payment_terms = new_invoice.payment_terms
        existing_invoice.payment_terms_label = new_invoice.payment_terms_label
        existing_invoice.payment_reminder_enabled = new_invoice.payment_reminder_enabled
        existing_invoice.payment_discount = new_invoice.payment_discount
        existing_invoice.credits_applied = new_invoice.credits_applied
        existing_invoice.payment_made = new_invoice.payment_made
        existing_invoice.reference_number = new_invoice.reference_number
        existing_invoice.line_items = new_invoice.line_items
        existing_invoice.allow_partial_payments = new_invoice.allow_partial_payments
        existing_invoice.price_precision = new_invoice.price_precision
        existing_invoice.sub_total = new_invoice.sub_total
        existing_invoice.tax_total = new_invoice.tax_total
        existing_invoice.discount_total = new_invoice.discount_total
        existing_invoice.discount_percent = new_invoice.discount_percent
        existing_invoice.discount = new_invoice.discount
        existing_invoice.discount_applied_on_amount = new_invoice.discount_applied_on_amount
        existing_invoice.discount_type = new_invoice.discount_type
        existing_invoice.tax_override_preference = new_invoice.tax_override_preference
        existing_invoice.is_discount_before_tax = new_invoice.is_discount_before_tax
        existing_invoice.adjustment = new_invoice.adjustment
        existing_invoice.adjustment_description = new_invoice.adjustment_description
        existing_invoice.total = new_invoice.total
        existing_invoice.balance = new_invoice.balance
        existing_invoice.is_inclusive_tax = new_invoice.is_inclusive_tax
        existing_invoice.sub_total_inclusive_of_tax = new_invoice.sub_total_inclusive_of_tax
        existing_invoice.contact_category = new_invoice.contact_category
        existing_invoice.tax_rounding = new_invoice.tax_rounding
        existing_invoice.taxes = new_invoice.taxes
        existing_invoice.tds_calculation_type = new_invoice.tds_calculation_type
        existing_invoice.last_payment_date = new_invoice.last_payment_date
        existing_invoice.contact_persons = new_invoice.contact_persons
        existing_invoice.salesorder_id = new_invoice.salesorder_id
        existing_invoice.salesorder_number = new_invoice.salesorder_number
        existing_invoice.salesorders = new_invoice.salesorders
        existing_invoice.contact_persons_details = new_invoice.contact_persons_details
        existing_invoice.created_time = new_invoice.created_time
        existing_invoice.last_modified_time = new_invoice.last_modified_time
        existing_invoice.created_date = new_invoice.created_date
        existing_invoice.created_by_name = new_invoice.created_by_name
        existing_invoice.estimate_id = new_invoice.estimate_id
        existing_invoice.customer_default_billing_address = new_invoice.customer_default_billing_address
        existing_invoice.notes = new_invoice.notes
        existing_invoice.terms = new_invoice.terms
        existing_invoice.billing_address = new_invoice.billing_address
        existing_invoice.shipping_address = new_invoice.shipping_address
        existing_invoice.contact = new_invoice.contact
        existing_invoice.inserted_in_qb = new_invoice.inserted_in_qb
        existing_invoice.items_unmatched = new_invoice.items_unmatched
        existing_invoice.customer_unmatched = new_invoice.customer_unmatched
        existing_invoice.last_sync_date = new_invoice.last_sync_date
        existing_invoice.number_of_times_synced = new_invoice.number_of_times_synced
    except Exception as e:
        logger.error(f"Error creating instance: {e}")
        return None
    return existing_invoice
    
    

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