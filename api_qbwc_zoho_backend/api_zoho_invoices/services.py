from django.http import JsonResponse
import api_zoho.views as api_zoho_views
from django.conf import settings
from django.db import transaction
from api_zoho.models import AppConfig, ZohoLoading   
from api_zoho_invoices.models import ZohoFullInvoice
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime as dtime
import requests
import logging
import datetime as dt

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def load_invoices_from_main_load(headers, params, username, pc_ip):
    logger.info("Starting to load invoices from Zoho Books Main Load")
    logger.info(f"Parameters: {params}")
    invoices_ids_saved = list(ZohoFullInvoice.objects.values_list('invoice_id', flat=True))
    url = f'{settings.MAIN_LOAD_URL_READ_INVOICES}'
    invoices_to_save = fetch_invoices(url, headers, params)
    if invoices_to_save is None:
        return JsonResponse({"error": "Failed to fetch invoices"}, status=500)

    # Procesar las facturas de forma paralela
    # invoices_to_save = fetch_full_invoices_parallel(invoices, headers)

    invoices_to_save, invoices_to_update = process_fetched_invoices(invoices_to_save, invoices_ids_saved)
    save_invoices_in_batches(invoices_to_save)
    update_invoices_in_batches(invoices_to_update)

    if invoices_to_save or invoices_to_update:
        update_zoho_loading(username, pc_ip)
        api_zoho_views.manage_notifications("Invoices have been loaded successfully from Zoho Books")

    return JsonResponse({'message': 'Invoices loaded successfully'}, status=200)
    
def fetch_invoices(url, headers, params):
    invoice_ids = []
    while True:
        try:
            response = requests.get(url, headers=headers, params=params, timeout=180)
            if response.status_code == 401:
                headers['Authorization'] = f'Token {settings.MAIN_LOAD_API_TOKEN}'
                response = requests.get(url, headers=headers, params=params, timeout=180)

            if response.status_code != 200:
                logger.error(f"Error fetching invoices: {response.text}")
                return None

            invoices = response.json().get('results', [])
            # invoice_ids.extend([invoice.get('invoice_id') for invoice in invoices])

            # Verificar si hay más páginas
            page_context = response.json().get('next', None)
            if not page_context:
                break
            params['page'] += 1
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching invoices: {e}")
            return None
    return invoices

# Descargar los detalles completos de las facturas de forma paralela
def fetch_full_invoices_parallel(invoice_ids, headers, max_workers=10):
    invoices_data = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_invoice = {executor.submit(fetch_full_invoice, invoice_id, headers): invoice_id for invoice_id in invoice_ids}
        for future in as_completed(future_to_invoice):
            invoice_data = future.result()
            if invoice_data:
                invoices_data.append(invoice_data)
    return invoices_data

# Obtener el detalle completo de una factura
def fetch_full_invoice(invoice_id, headers):
    get_url = f'{settings.ZOHO_URL_READ_INVOICES}/{invoice_id}/?organization_id={AppConfig.objects.first().zoho_org_id}'
    try:
        response = requests.get(get_url, headers=headers, timeout=180)
        if response.status_code == 200:
            return response.json().get('invoice')
        else:
            logger.error(f"Error fetching full invoice {invoice_id}: {response.text}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching full invoice {invoice_id}: {e}")
    return None

# Procesar las facturas obtenidas para verificar cuáles deben guardarse
def process_fetched_invoices(invoices_to_get, invoices_ids_saved):
    invoices_to_save = []
    invoices_to_update = []
    for data in invoices_to_get:
        new_invoice = create_invoice_instance(data)
        if new_invoice.invoice_id not in invoices_ids_saved:
            invoices_to_save.append(new_invoice)
        else:
            existing_invoice = ZohoFullInvoice.objects.filter(invoice_id=new_invoice.invoice_id).first()
            if existing_invoice:
                updated_invoice = edit_invoice_instance(existing_invoice, new_invoice)
                if updated_invoice:
                    invoices_to_update.append(updated_invoice)
    return invoices_to_save, invoices_to_update

# Guardar las facturas en la base de datos en lotes
def save_invoices_in_batches(invoices, batch_size=100):
    for i in range(0, len(invoices), batch_size):
        with transaction.atomic():
            ZohoFullInvoice.objects.bulk_create(invoices[i:i + batch_size])
            
            
def update_invoices_in_batches(invoices, batch_size=100):
    for i in range(0, len(invoices), batch_size):
        with transaction.atomic():
            ZohoFullInvoice.objects.bulk_update(invoices[i:i + batch_size], fields=[
                'invoice_number', 'date', 'due_date', 'customer_id', 'customer_name', 'email', 'status',
                'recurring_invoice_id', 'payment_terms', 'payment_terms_label', 'payment_reminder_enabled',
                'payment_discount', 'credits_applied', 'payment_made', 'reference_number', 'line_items',
                'allow_partial_payments', 'price_precision', 'sub_total', 'tax_total', 'discount_total',
                'discount_percent', 'discount', 'discount_applied_on_amount', 'discount_type',
                'tax_override_preference', 'is_discount_before_tax', 'adjustment', 'adjustment_description',
                'total', 'balance', 'is_inclusive_tax', 'sub_total_inclusive_of_tax', 'contact_category',
                'tax_rounding', 'taxes', 'tds_calculation_type', 'last_payment_date', 'contact_persons',
                'salesorder_id', 'salesorder_number', 'salesorders', 'contact_persons_details',
                'created_time', 'last_modified_time', 'created_date', 'created_by_name', 'estimate_id',
                'customer_default_billing_address',  'notes',  'terms','billing_address','shipping_address',
                'contact'
            ])
            
def update_zoho_loading(username, ip_address):
    current_time_utc = dt.datetime.now(dt.timezone.utc)
    zoho_loading = ZohoLoading.objects.filter(zoho_module='invoices', zoho_record_created=current_time_utc).first()
    if not zoho_loading:
        zoho_loading = api_zoho_views.create_zoho_loading_instance('invoices')
    else:
        zoho_loading.zoho_record_updated = current_time_utc
    zoho_loading.save()
    api_zoho_views.manage_api_tracking_log(username, 'load_invoices', ip_address, 'Loaded invoices from Zoho Books')
    
    
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
        instance.email = instance.email.lower() if instance.email else ''
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