from django.shortcuts import render
from django.http import JsonResponse
import api_zoho.views as api_zoho_views
from django.conf import settings
from api_zoho.models import AppConfig, ZohoLoading   
from api_zoho_customers.models import ZohoCustomer 
from django.utils.dateparse import parse_datetime 
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST
from django.db import transaction
from django.db.models import Q
from django.core import serializers
from django.views.decorators.csrf import csrf_exempt
from django.forms.models import model_to_dict
from api_quickbook_soap.models import QbCustomer
from datetime import date as dt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .tasks import load_customers_task

import datetime
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def match_one_customer_ajax(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        if request.body:
            data = json.loads(request.body)
            action = data.get('action')
            try:
                qb_list_id = data.get('qb_customer_list_id')
                zoho_customer_id = data.get('contact_id')
                qb_customer = get_object_or_404(QbCustomer, list_id=qb_list_id)
                zoho_customer = get_object_or_404(ZohoCustomer, contact_id=zoho_customer_id)
                zoho_customer.qb_list_id = qb_list_id if action == 'match' else ''
                zoho_customer.save()
                qb_customer.matched = True if action == 'match' else False
                qb_customer.save()
                message = 'Customer matched successfully' if action == 'match' else 'Customer unmatched successfully'
                return JsonResponse({'status': 'success', 'message': message}, status=200)
            except Exception as e:
                return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
        return JsonResponse({'status': 'error', 'message': 'No data provided'}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid token'}, status=401)
    

#############################################
# Unmatch all AJAX
#############################################

@require_POST
def unmatch_all_customers_ajax(request):
    if request.method == 'POST':
        unmatch_data = request.POST.get('unmatch_data')
        if unmatch_data:
            unmatch_data = json.loads(unmatch_data)
            for item in unmatch_data:
                qb_customer_list_id = item.get('qb_customer_list_id')
                zoho_customer_id = item.get('zoho_customer_id')
                
                # Aquí puedes añadir la lógica para deshacer la coincidencia
                # Ejemplo de cómo deshacer la coincidencia:
                qb_customer = QbCustomer.objects.filter(list_id=qb_customer_list_id).first()
                zoho_customer = ZohoCustomer.objects.filter(contact_id=zoho_customer_id).first()
                if qb_customer and zoho_customer:
                    # Ejemplo: Actualizar el estado de coincidencia
                    qb_customer.matched = False
                    qb_customer.save()
                    zoho_customer.qb_list_id = ''
                    zoho_customer.save()
                
            return JsonResponse({'status': 'success', 'message': 'All customers were successfully unmatched.'})
        else:
            return JsonResponse({'status': 'error', 'message': 'No data provided.'})
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})

#############################################
# View Customer Details
#############################################


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_customer(request, customer_id):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        
        pattern = r'^[A-Za-z0-9]{8}-[A-Za-z0-9]{10}$'
        
        zoho_customer = ZohoCustomer.objects.filter(contact_id=customer_id).first()

        # Consultar los datos necesarios de las tablas
        qb_customers = QbCustomer.objects.filter(matched=False, never_match=False).values_list('list_id', 'name', 'email', 'phone')

        # Convertir a DataFrames de Pandas
        qb_df = pd.DataFrame(list(qb_customers), columns=['list_id', 'name', 'email', 'phone'])

        # Preparar arrays para comparación
        qb_customers_data = qb_df[['list_id', 'name', 'email', 'phone']].to_dict(orient='records')
        zoho_email = zoho_customer.email
        zoho_phone = zoho_customer.phone
        dependences_list = []
        sorted_dependences_list = []

        # Comparar clientes usando `rapidfuzz` para comparación de cadenas
            
        if not zoho_customer.qb_list_id or zoho_customer.qb_list_id == '':
            for qb_customer_data in qb_customers_data:
                qb_email = qb_customer_data['email']
                qb_phone = qb_customer_data['phone']
                
                if (zoho_email or zoho_phone) and (qb_email or qb_phone):
                        # Comparar email y teléfono usando `rapidfuzz`
                    seem_email = rapidfuzz.fuzz.ratio(zoho_email, qb_email) / 100 if zoho_email and qb_email else 0
                    seem_phone = rapidfuzz.fuzz.ratio(zoho_phone, qb_phone) / 100 if zoho_phone and qb_phone else 0

                    if seem_email > float(settings.SEEM_CUSTOMERS) or seem_phone > float(settings.SEEM_CUSTOMERS):
                            # Agregar coincidencias a la lista
                        dependences_list.append({
                                'qb_customer_list_id': qb_customer_data['list_id'],
                                'qb_customer_name': qb_customer_data['name'],
                                'email': qb_email,
                                'seem_email': seem_email,
                                'coincidence_email': f'{round(seem_email * 100, 2)} %',
                                'phone': qb_phone,
                                'seem_phone': seem_phone,
                                'coincidence_phone': f'{round(seem_phone * 100, 2)} %',
                                'company_name': qb_customer_data['name'] 
                        })

                if dependences_list:
                    # Ordenar dependencias por `seem_email`
                    sorted_dependences_list = sorted(dependences_list, key=lambda x: x['seem_email'], reverse=True)
                else:
                    sorted_dependences_list = []
        
        zoho_customer = model_to_dict(zoho_customer)

        zoho_customer['coincidences'] = sorted_dependences_list
        if zoho_customer['qb_list_id']:
            zoho_customer['matched'] = True if re.match(pattern, zoho_customer['qb_list_id']) else False
        else:
            zoho_customer['matched'] = False
        
        return JsonResponse(zoho_customer)
    
    return JsonResponse({'status': 'error', 'error': 'Invalid token'}, status=401)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def  list_customers(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        customers_list_query = ZohoCustomer.objects.all().order_by('contact_name')
        batch_size = 200  # Ajusta este tamaño según tus necesidades
        customers_list = []
        
        # Dividir en partes y procesar cada parte
        for i in range(0, customers_list_query.count(), batch_size):
            batch = customers_list_query[i:i + batch_size]
            customers_list.extend(batch)  # Agregar datos al acumulador
        
        items_data = serializers.serialize('json', customers_list)
        
        return JsonResponse(items_data, safe=False)
    
    return JsonResponse({'error': 'Invalid token'}, status=401)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def load_customers(request):
    valid_token = api_zoho_views.validateJWTTokenRequest(request)
    if valid_token:
        app_config = AppConfig.objects.first()
        try:
            headers = api_zoho_views.config_headers(request) 
        except Exception as e:
            logger.error(f"Error connecting to Zoho API: {str(e)}")
            context = {
                'error': f"Error connecting to Zoho API (Load Customers): {str(e)}",
                'status_code': 500
            }
            return render(request, 'api_zoho/error.html', context)

        params = {
            'page': 1,
            'per_page': 200, 
            'organization_id': app_config.zoho_org_id,
        } 
        
        # Llama a la tarea asíncrona
        result = load_customers_task.delay(headers, params)

        return JsonResponse({'message': 'Customer load started', 'task_id': result.id}, status=202)
    
    return JsonResponse({'error': 'Invalid JWT token'}, status=401)




# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def load_customers(request):
    # valid_token = api_zoho_views.validateJWTTokenRequest(request)
    # if valid_token:
    #     app_config = AppConfig.objects.first()
    #     try:
    #         headers = api_zoho_views.config_headers(request)  # Asegúrate de que esto esté configurado correctamente
    #     except Exception as e:
    #         logger.error(f"Error connecting to Zoho API: {str(e)}")
    #         context = {
    #             'error': f"Error connecting to Zoho API (Load Customers): {str(e)}",
    #             'status_code': 500
    #         }
    #         return render(request, 'api_zoho/error.html', context)
    #     customers_saved = list(ZohoCustomer.objects.all())
    #     today = dt.today().strftime('%Y-%m-%d')

    #     params = {
    #         'page': 1,
    #         'per_page': 200,  # Asegúrate de que este sea el valor máximo permitido por la API
    #         'organization_id': app_config.zoho_org_id,
    #     } if len(customers_saved) == 0 else {
    #         'page': 1,
    #         'per_page': 200,  # Asegúrate de que este sea el valor máximo permitido por la API
    #         'organization_id': app_config.zoho_org_id,
    #         'created_time_start': f'{today}',
    #     }  

    #     url = f'{settings.ZOHO_URL_READ_CUSTOMERS}'
    #     customers_to_save = []
    #     customers_to_get = [] 

    #     while True:
    #         try:
    #             response = requests.get(url, headers=headers, params=params)
    #             if response.status_code == 401:  # Si el token ha expirado
    #                 new_zoho_token = api_zoho_views.refresh_zoho_token()
    #                 headers['Authorization'] = f'Zoho-oauthtoken {new_zoho_token}'
    #                 response = requests.get(url, headers=headers, params=params)  # Reintenta la solicitud
    #             elif response.status_code != 200:
    #                 logger.error(f"Error fetching customers: {response.text}")
    #                 context = {
    #                     'error': response.text,
    #                     'status_code': response.status_code
    #                 }
    #                 return render(request, 'api_zoho/error.html', context)
    #             else:
    #                 response.raise_for_status()
    #                 customers = response.json()
    #                 if customers.get('contacts', []):
    #                     customers_to_get.extend(customers['contacts'])
    #                 if 'page_context' in customers and 'has_more_page' in customers['page_context'] and customers['page_context']['has_more_page']:
    #                     params['page'] += 1  # Avanza a la siguiente página
    #                 else:
    #                     break  # Sal del bucle si no hay más páginas
    #         except requests.exceptions.RequestException as e:
    #             logger.error(f"Error fetching customers: {e}")
    #             return JsonResponse({"error": "Failed to fetch customers"}, status=500)
        
    #     existing_customers = {customer.contact_id: customer for customer in customers_saved}
    #     existing_emails = {customer.email: customer for customer in customers_saved}

    #     for data in customers_to_get:
    #         new_customer = create_customer_instance(data)
    #         if new_customer.contact_id not in existing_customers and new_customer.email not in existing_emails and new_customer.status == 'active':
    #             customers_to_save.append(new_customer)

    #     def save_customers_in_batches(customers, batch_size=100):
    #         for i in range(0, len(customers), batch_size):
    #             batch = customers[i:i + batch_size]
    #             with transaction.atomic():
    #                 ZohoCustomer.objects.bulk_create(batch)
        
    #     save_customers_in_batches(customers_to_save, batch_size=100)
        
    #     if len(customers_to_get) > 0:
    #         current_time_utc = datetime.datetime.now(datetime.timezone.utc)
    #         zoho_loading = ZohoLoading.objects.filter(zoho_module='customers', zoho_record_created=current_time_utc).first()
    #         if not zoho_loading:
    #             zoho_loading = api_zoho_views.create_zoho_loading_instance('customers')
    #         else:
    #             zoho_loading.zoho_record_updated = current_time_utc
    #         zoho_loading.save()
    
    #     return JsonResponse({'message': 'Customers loaded successfully'}, status=200)
    
    # return JsonResponse({'error': 'Invalid JWT token'}, status=401)


@login_required(login_url='login')
def manage_customers(request):
    similar_customers = []

    # Consultar los datos necesarios de las tablas
    qb_customers = QbCustomer.objects.filter(matched=False, never_match=False).values_list('list_id', 'name', 'email', 'phone')
    zoho_customers = ZohoCustomer.objects.all().values_list('contact_id', 'customer_name', 'email', 'phone', 'qb_list_id', 'company_name')

    # Convertir a DataFrames de Pandas
    qb_df = pd.DataFrame(list(qb_customers), columns=['list_id', 'name', 'email', 'phone'])
    zoho_df = pd.DataFrame(list(zoho_customers), columns=['contact_id', 'customer_name', 'email', 'phone', 'qb_list_id', 'company_name'])

    # Preparar arrays para comparación
    qb_customers_data = qb_df[['list_id', 'name', 'email', 'phone']].to_dict(orient='records')
    zoho_emails = zoho_df['email'].to_numpy()
    zoho_phones = zoho_df['phone'].to_numpy()

    # Comparar clientes usando `rapidfuzz` para comparación de cadenas
    for zoho_index, (zoho_email, zoho_phone) in enumerate(zip(zoho_emails, zoho_phones)):
        dependences_list = []
        if not zoho_df.iloc[zoho_index]['qb_list_id']:
            for qb_customer_data in qb_customers_data:
                qb_email = qb_customer_data['email']
                qb_phone = qb_customer_data['phone']

                # Asegurarse de que al menos uno de los dos campos (email o teléfono) no esté vacío
                if (zoho_email or zoho_phone) and (qb_email or qb_phone):
                    # Comparar email y teléfono usando `rapidfuzz`
                    seem_email = rapidfuzz.fuzz.ratio(zoho_email, qb_email) / 100 if zoho_email and qb_email else 0
                    seem_phone = rapidfuzz.fuzz.ratio(zoho_phone, qb_phone) / 100 if zoho_phone and qb_phone else 0

                    if seem_email > 0.7 or seem_phone > 0.7:
                        # Agregar coincidencias a la lista
                        dependences_list.append({
                            'qb_customer_list_id': qb_customer_data['list_id'],
                            'qb_customer_name': qb_customer_data['name'],
                            'email': qb_email,
                            'seem_email': seem_email,
                            'coincidence_email': f'{round(seem_email * 100, 2)} %',
                            'phone': qb_phone,
                            'seem_phone': seem_phone,
                            'coincidence_phone': f'{round(seem_phone * 100, 2)} %',
                            'company_name': qb_customer_data['name']  # Asegúrate de usar el campo correcto si es necesario
                        })

            if dependences_list:
                # Ordenar dependencias por `seem_email`
                sorted_dependences_list = sorted(dependences_list, key=lambda x: x['seem_email'], reverse=True)
            else:
                sorted_dependences_list = []
        else:
            # Si ya tiene un `qb_list_id`, no tiene dependencias
            sorted_dependences_list = []

        similar_customers.append({
            'zoho_customer_id': zoho_df.iloc[zoho_index]['contact_id'],
            'zoho_customer_name': zoho_df.iloc[zoho_index]['customer_name'],
            'zoho_customer_email': zoho_email,
            'zoho_customer_phone': zoho_phone,
            'zoho_company_name': zoho_df.iloc[zoho_index]['company_name'],
            'zoho_qb_list_id': zoho_df.iloc[zoho_index]['qb_list_id'],
            'coincidences_by_order': sorted_dependences_list
        })

    context = {'customers': similar_customers}
    return render(request, 'api_zoho_customers/manage_customers.html', context)


def replace_single_quotes(data):
    return json.dumps(data).replace("'", '"')
    

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
