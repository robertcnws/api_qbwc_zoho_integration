from celery import shared_task

from datetime import datetime as dt
from django.conf import settings
from django.db import transaction
from django.http import JsonResponse
from django.utils.dateparse import parse_datetime
from .models import ZohoCustomer
from api_zoho.models import ZohoLoading
import logging
import requests
import datetime
import api_zoho.views as api_zoho_views


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


@shared_task
def load_customers_task(headers, params):
    # app_config = AppConfig.objects.get(id=app_config_id)
    
    url = f'{settings.ZOHO_URL_READ_CUSTOMERS}'
    customers_to_save = []
    customers_to_get = []

    while True:
        try:
            response = requests.get(url, headers=headers, params=params)
            if response.status_code == 401:  # Si el token ha expirado
                new_zoho_token = api_zoho_views.refresh_zoho_token()
                headers['Authorization'] = f'Zoho-oauthtoken {new_zoho_token}'
                response = requests.get(url, headers=headers, params=params)  # Reintenta la solicitud
            elif response.status_code != 200:
                logger.error(f"Error fetching customers: {response.text}")
                return {'error': response.text, 'status_code': response.status_code}
            else:
                response.raise_for_status()
                customers = response.json()
                if customers.get('contacts', []):
                    customers_to_get.extend(customers['contacts'])
                if 'page_context' in customers and 'has_more_page' in customers['page_context'] and customers['page_context']['has_more_page']:
                    params['page'] += 1  # Avanza a la siguiente página
                else:
                    break  # Sal del bucle si no hay más páginas
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching customers: {e}")
            return {"error": "Failed to fetch customers", "status": 500}
    
    customers_saved = list(ZohoCustomer.objects.all())
    existing_customers = {customer.contact_id: customer for customer in customers_saved}
    # existing_emails = {customer.email: customer for customer in customers_saved}

    for data in customers_to_get:
        new_customer = create_customer_instance(data)
        if new_customer.contact_id not in existing_customers and new_customer.status == 'active':
            customers_to_save.append(new_customer)

    def save_customers_in_batches(customers, batch_size=100):
        for i in range(0, len(customers), batch_size):
            batch = customers[i:i + batch_size]
            with transaction.atomic():
                ZohoCustomer.objects.bulk_create(batch)
    
    save_customers_in_batches(customers_to_save, batch_size=100)
    
    if len(customers_to_get) > 0:
        current_time_utc = datetime.datetime.now(datetime.timezone.utc)
        zoho_loading = ZohoLoading.objects.filter(zoho_module='customers', zoho_record_created=current_time_utc).first()
        if not zoho_loading:
            zoho_loading = api_zoho_views.create_zoho_loading_instance('customers')
        else:
            zoho_loading.zoho_record_updated = current_time_utc
        zoho_loading.save()
    
    return {'message': 'Customers loaded successfully', 'status': 200}


def create_customer_instance(data):
    customer = ZohoCustomer()
    customer.contact_id = data.get('contact_id')
    customer.contact_name = data.get('contact_name')
    customer.customer_name = data.get('customer_name')
    customer.company_name = data.get('company_name', '')
    customer.status = data.get('status')
    customer.first_name = data.get('first_name')
    customer.last_name = data.get('last_name')
    customer.email = data.get('email')
    customer.phone = data.get('phone', '')
    customer.mobile = data.get('mobile', '')
    customer.created_time = parse_datetime(data.get('created_time'))
    customer.created_time_formatted = data.get('created_time_formatted', '')
    customer.last_modified_time = parse_datetime(data.get('last_modified_time'))
    customer.last_modified_time_formatted = data.get('last_modified_time_formatted', '')
    return customer
