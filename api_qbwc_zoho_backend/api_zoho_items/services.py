from django.http import JsonResponse
import api_zoho.views as api_zoho_views
from django.conf import settings
from api_zoho.models import ZohoLoading 
from api_zoho_items.models import ZohoItem 
from django.utils.dateparse import parse_datetime 
from django.db import transaction
import datetime
import requests
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def load_items_from_main_load(headers, params, username, pc_ip):
    url = f'{settings.MAIN_LOAD_URL_READ_ITEMS}'
    items_to_save = []
    items_to_get = []
    items_saved = list(ZohoItem.objects.all())
    
    logger.info(f"Fetching items from Zoho Books API at {url} with params {params}")
    
    while True:
        try:
            response = requests.get(url, headers=headers, params=params)
            if response.status_code == 401:  # Si el token ha expirado
                new_token = api_zoho_views.refresh_zoho_token()
                headers['Authorization'] = f'Zoho-oauthtoken {new_token}'
                response = requests.get(url, headers=headers, params=params)  # Reintenta la solicitud
            elif response.status_code != 200:
                logger.error(f"Error fetching items: {response.text}")
                return JsonResponse({'error': response.text}, status=response.status_code)
            else:
                response.raise_for_status()
                items = response.json()
                if items.get('results', []):
                    items_to_get.extend(items['results'])
                # Verifica si hay más páginas para obtener
                if 'next' in items and items['next']:
                    params['page'] += 1  # Avanza a la siguiente página
                else:
                    break  # Sal del bucle si no hay más páginas
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching items: {e}")
            return JsonResponse({'error': 'Failed to fetch items'}, status=500)
    
    existing_items = {item.item_id: item for item in items_saved}

    for data in items_to_get:
        new_item = create_item_instance(data)
        if new_item.item_id not in existing_items:
            items_to_save.append(new_item)
    
    def save_items_in_batches(items, batch_size=100):
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            with transaction.atomic():
                ZohoItem.objects.bulk_create(batch)
    
    save_items_in_batches(items_to_save, batch_size=100)
    
    if len(items_to_get) > 0:
        current_time_utc = datetime.datetime.now(datetime.timezone.utc)
        zoho_loading, created = ZohoLoading.objects.update_or_create(
            zoho_module='items',
            defaults={'zoho_record_created': current_time_utc, 'zoho_record_updated': current_time_utc}
        )
        if created:
            zoho_loading.save()
        api_zoho_views.manage_api_tracking_log(username, 'load_items', pc_ip, 'Loaded items from Zoho Books')
        message_notification = f"Items have been loaded successfully from Zoho Books"
        api_zoho_views.manage_notifications(message_notification)
            
    return JsonResponse({'message': 'Items loaded successfully'}, status=200)


def create_item_instance(data):
    item = ZohoItem()
    item.item_id = data.get('item_id')
    item.name = data.get('name')
    item.item_name = data.get('item_name')
    item.status = data.get('status')
    item.description = data.get('description', '')
    item.rate = data.get('rate', 0.0)
    item.sku = data.get('sku')
    item.created_time = parse_datetime(data.get('created_time'))
    item.last_modified_time = parse_datetime(data.get('last_modified_time'))
    item.qb_list_id = data.get('cf_qb_ref_id')
    return item