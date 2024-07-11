from django.shortcuts import render
from django.http import JsonResponse
import api_zoho.views as api_zoho_views
from django.conf import settings
from api_zoho.models import AppConfig, ZohoLoading 
from api_zoho_items.models import ZohoItem 
from django.utils.dateparse import parse_datetime 
from django.db import transaction
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.shortcuts import render, get_object_or_404
from datetime import datetime, timezone
from api_quickbook_soap.models import QbItem  
import pandas as pd
import rapidfuzz  
import requests
import json
import logging
import re

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


#############################################
# Match one AJAX
#############################################

@require_POST
def match_one_item_ajax(request):
    action = request.POST['action']
    logger.debug(f"Action: {action}")
    try:
        qb_list_id = request.POST['qb_item_list_id']
        zoho_item_id = request.POST['item_id']
        qb_item = get_object_or_404(QbItem, list_id=qb_list_id)
        zoho_item = get_object_or_404(ZohoItem, item_id=zoho_item_id)
        zoho_item.qb_list_id = qb_list_id if action == 'match' else ''
        zoho_item.save()
        qb_item.matched = True if action == 'match' else False
        qb_item.save()
        return JsonResponse({'status': 'success', 'message': 'Item matched successfully'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    
    
#############################################
# Unmatch all AJAX
#############################################

@require_POST
def unmatch_all_items_ajax(request):
    if request.method == 'POST':
        unmatch_data = request.POST.get('unmatch_data')
        if unmatch_data:
            unmatch_data = json.loads(unmatch_data)
            for item in unmatch_data:
                qb_item_list_id = item.get('qb_item_list_id')
                zoho_item_id = item.get('zoho_item_id')
                
                # Aquí puedes añadir la lógica para deshacer la coincidencia
                # Ejemplo de cómo deshacer la coincidencia:
                qb_item = QbItem.objects.filter(list_id=qb_item_list_id).first()
                zoho_item = ZohoItem.objects.filter(item_id=zoho_item_id).first()
                if qb_item and zoho_item:
                    # Ejemplo: Actualizar el estado de coincidencia
                    qb_item.matched = False
                    qb_item.save()
                    zoho_item.qb_list_id = ''
                    zoho_item.save()
                
            return JsonResponse({'status': 'success', 'message': 'All items were successfully unmatched.'})
        else:
            return JsonResponse({'status': 'error', 'message': 'No data provided.'})
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})
    
    
#############################################
# View Item Details
#############################################


@login_required(login_url='login')
def view_item(request, item_id):

    zoho_item = ZohoItem.objects.get(id=item_id)

    # Consultar los datos necesarios de las tablas
    qb_items = QbItem.objects.filter(matched=False, never_match=False).values_list('list_id', 'name')

    # Convertir a DataFrames de Pandas
    qb_df = pd.DataFrame(list(qb_items), columns=['list_id', 'name'])

    # Preparar arrays para comparación
    qb_items_data = qb_df[['list_id', 'name']].to_dict(orient='records')
    zoho_name = zoho_item.name
    dependences_list = []

    # Comparar items usando `rapidfuzz` para comparación de cadenas
    for qb_item_data in qb_items_data:
        qb_name = qb_item_data['name']
            
        if zoho_name and qb_name:
                # Comparar nombres usando `rapidfuzz`
            seem_name = rapidfuzz.fuzz.ratio(zoho_name, qb_name) / 100 if zoho_name and qb_name else 0
                
            # logger.debug(f"Comparing {zoho_name} with {qb_name}")
            # logger.debug(f"Name similarity: {seem_name}")

            if seem_name > 0.7:
                    # Agregar coincidencias a la lista
                dependences_list.append({
                        'qb_item_list_id': qb_item_data['list_id'],
                        'qb_item_name': qb_name,
                        'seem_name': seem_name,
                        'coincidence_name': f'{round(seem_name * 100, 2)} %',
                })

    if dependences_list:
            # Ordenar dependencias por `seem_name`
        sorted_dependences_list = sorted(dependences_list, key=lambda x: x['seem_name'], reverse=True)
    else:
        sorted_dependences_list = []
    
    context = {'item': zoho_item, 'coincidences' : sorted_dependences_list}
    
    return render(request, 'api_zoho_items/view_item.html', context)


@login_required(login_url='login')  
def list_items(request):
    items_list_query = ZohoItem.objects.all()
    batch_size = 200  # Ajusta este tamaño según tus necesidades
    items_list = []
    
    # Dividir en partes y procesar cada parte
    for i in range(0, items_list_query.count(), batch_size):
        batch = items_list_query[i:i + batch_size]
        items_list.extend(batch) 
        
    regex = re.compile(r'^[A-Za-z0-9]{8}-\d{10}$')  # Cambia esto según tu necesidad

    # Añadir atributo 'matched' a cada item si cumple con la expresión regular
    for item in items_list:
        item.matched = bool(regex.match(item.qb_list_id)) if item.qb_list_id else False
        # logger.debug(f"Item {item.item_id} name: {item.name} matched: {item.matched} qb_list_id: {item.qb_list_id}") 
        
    context = {'items': items_list}
    return render(request, 'api_zoho_items/list_items.html', context)


@login_required(login_url='login')  
def load_items(request):
    app_config = AppConfig.objects.first()
    try:
        headers = api_zoho_views.config_headers(request)  # Asegúrate de que esto esté configurado correctamente
    except Exception as e:
        logger.error(f"Error connecting to Zoho API: {str(e)}")
        context = {
            'error': f"Error connecting to Zoho API (Load Items): {str(e)}",
            'status_code': 500
        }
        return render(request, 'api_zoho/error.html', context)
    items_saved = list(ZohoItem.objects.all())
    
    params = {
        'organization_id': app_config.zoho_org_id,
        'page': 1,       # Página inicial
        'per_page': 200,  # Cantidad de resultados por página
        'status': 'active'  # Solo items activos
    }
        
    url = f'{settings.ZOHO_URL_READ_ITEMS}'
    items_to_save = []
    items_to_get = []
    
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
                return render(request, 'api_zoho/error.html', context)
            else:
                response.raise_for_status()
                items = response.json()
                if items.get('items', []):
                    items_to_get.extend(items['items'])
                # Verifica si hay más páginas para obtener
                if 'page_context' in items and 'has_more_page' in items['page_context'] and items['page_context']['has_more_page']:
                    params['page'] += 1  # Avanza a la siguiente página
                else:
                    break  # Sal del bucle si no hay más páginas
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching items: {e}")
            return JsonResponse({"error": "Failed to fetch items"}, status=500)
    
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
        zoho_loading = ZohoLoading.objects.filter(zoho_module='items', zoho_record_created=datetime.now(timezone.utc)).first()
        if not zoho_loading:
            zoho_loading = api_zoho_views.create_zoho_loading_instance('items')
        else:
            zoho_loading.zoho_record_updated = datetime.now(timezone.utc)
        zoho_loading.save()
    
    return render(request, 'api_zoho_items/load_items.html')

    

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