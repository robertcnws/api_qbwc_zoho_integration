from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.shortcuts import render, get_object_or_404
from django.db import transaction, IntegrityError
from django.db.models import Q, Count
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers
from datetime import datetime, timezone
from api_zoho_customers.models import ZohoCustomer
from api_zoho_items.models import ZohoItem
from api_zoho_invoices.models import ZohoFullInvoice
from .models import QbItem, QbCustomer, QbLoading
import difflib
import api_quickbook_soap.soap_service as soap_service
import xmltodict
import logging
import re
import json
import numpy as np
import pandas as pd
import rapidfuzz

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
insert = False

#############################################
# Endpoints to Serve SOAP Requests
#############################################

@csrf_exempt
def item_query(request):
    global soap_items
    return start_qbwc_query_request(request, 'ItemInventory', soap_items)

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

@csrf_exempt
def qbwc_items(request):
    
    if request.method == 'GET':
        
        soap_items_query = QbItem.objects.filter(never_match=False)
        batch_size = 200  
        soap_items = []
        
        for i in range(0, soap_items_query.count(), batch_size):
            batch = soap_items_query[i:i + batch_size]
            soap_items.extend(batch)  # Agregar datos al acumulador
            
        items_data = serializers.serialize('json', soap_items)
        
        return JsonResponse(items_data, safe=False)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def qbwc_customers(request):
    
    if request.method == 'GET':
        soap_customers_query = QbCustomer.objects.filter(never_match=False)
        batch_size = 200  # Ajusta este tamaño según tus necesidades
        soap_customers = []
        
        # Dividir en partes y procesar cada parte
        for i in range(0, soap_customers_query.count(), batch_size):
            batch = soap_customers_query[i:i + batch_size]
            soap_customers.extend(batch)  # Agregar datos al acumulador
        
        customers_data = serializers.serialize('json', soap_customers)
        
        return JsonResponse(customers_data, safe=False)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)


#############################################
# Force to sync AJAX methods
#############################################

@csrf_exempt
def force_to_sync_one_invoice_ajax(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            invoice_id = data.get('invoice', '')
            force_to_sync = data.get('force_to_sync', False)
            invoice_model = get_object_or_404(ZohoFullInvoice, invoice_id=invoice_id)
            invoice_model.force_to_sync = force_to_sync
            invoice_model.save()
            return JsonResponse({'status': 'success'}, status=200)
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)

@csrf_exempt
def force_to_sync_invoices_ajax(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            list_id = data.get('invoices', [])
            print(f"List ID: {list_id}")
            for invoice in list_id:
                invoice_model = get_object_or_404(ZohoFullInvoice, invoice_id=invoice)
                invoice_model.force_to_sync = True
                invoice_model.save()
            return JsonResponse({'status': 'success'}, status=200)
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)


#############################################
# Never match AJAX methods
#############################################


@require_POST
def never_match_items_ajax(request):
    try:
        items_json = request.POST.get('items', '[]')  # Obtener los datos del POST
        list_id = json.loads(items_json)  # Convertir JSON a lista
        print(f"List ID: {list_id}")
        for item in list_id:
            qb_item = get_object_or_404(QbItem, list_id=item)
            qb_item.never_match = True
            qb_item.save()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    

@require_POST    
def never_match_customers_ajax(request):
    try:
        customers_json = request.POST.get('customers', '[]')  # Obtener los datos del POST
        list_id = json.loads(customers_json)  # Convertir JSON a lista
        print(f"List ID: {list_id}")
        for customer in list_id:
            qb_customer = get_object_or_404(QbCustomer, list_id=customer)
            qb_customer.never_match = True
            qb_customer.save()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


#############################################
# Trying to get matched elements here
#############################################

@csrf_exempt
def matching_items(request):
    if request.method == 'GET':
        pattern = r'^[A-Za-z0-9]{8}\d-[A-Za-z0-9]{10}$'

        # Usar consultas eficientes con `values` y `annotate`
        qb_items = QbItem.objects.filter(matched=False, never_match=False).values_list('list_id', 'name')
        zoho_items = ZohoItem.objects.filter(
            Q(qb_list_id__isnull=True) | Q(qb_list_id='') | ~Q(qb_list_id__regex=pattern)
        ).values_list('item_id', 'name', 'sku')

        # Convertir a DataFrames de Pandas
        qb_df = pd.DataFrame(list(qb_items), columns=['list_id', 'name'])
        zoho_df = pd.DataFrame(list(zoho_items), columns=['item_id', 'name', 'sku'])

        # Preparar los arrays para comparación
        qb_names = qb_df['name'].to_numpy()
        zoho_names = zoho_df['name'].to_numpy()
        zoho_items_data = zoho_df[['item_id', 'name', 'sku']].to_dict(orient='records')

        # Crear un array vacío para almacenar los resultados
        similar_items = []

        # Comparar items usando `rapidfuzz` para comparación de cadenas más eficiente
        for qb_index, qb_name in enumerate(qb_names):
            dependences_list = []
            for zoho_item_data in zoho_items_data:
                zoho_name = zoho_item_data['name']
                seem = rapidfuzz.fuzz.ratio(qb_name, zoho_name) / 100  # Normaliza a un rango de 0 a 1
                if seem > 0.4:
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
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt
def matching_customers(request):
    if request.method == 'GET':
        global similar_customers
        similar_customers = []
        pattern = r'^[A-Za-z0-9]{8}\d-[A-Za-z0-9]{10}$'
        
        # Usar consultas eficientes con `values` para obtener solo los datos necesarios
        qb_customers = QbCustomer.objects.filter(matched=False, never_match=False).values_list('list_id', 'name', 'email', 'phone')
        zoho_customers = ZohoCustomer.objects.filter(
            Q(qb_list_id__isnull=True) | Q(qb_list_id='') | ~Q(qb_list_id__regex=pattern)
        ).values_list('contact_id', 'customer_name', 'email', 'phone')

        # Convertir a DataFrames de Pandas
        qb_df = pd.DataFrame(list(qb_customers), columns=['list_id', 'name', 'email', 'phone'])
        zoho_df = pd.DataFrame(list(zoho_customers), columns=['contact_id', 'customer_name', 'email', 'phone'])

        # Preparar arrays para comparación
        qb_emails = qb_df['email'].to_numpy()
        qb_phones = qb_df['phone'].to_numpy()
        zoho_customers_data = zoho_df[['contact_id', 'customer_name', 'email', 'phone']].to_dict(orient='records')

        # Crear una lista para almacenar los resultados
        similar_customers = []

        # Comparar clientes usando `rapidfuzz` para comparación de cadenas
        for qb_index, (qb_email, qb_phone) in enumerate(zip(qb_emails, qb_phones)):
            dependences_list = []
            for zoho_customer_data in zoho_customers_data:
                zoho_email = zoho_customer_data['email']
                zoho_phone = zoho_customer_data['phone']

                # Asegurarse de que al menos uno de los dos campos (email o teléfono) no esté vacío
                if (qb_email or qb_phone) and (zoho_email or zoho_phone):
                    # Comparar email y teléfono usando `rapidfuzz`
                    seem_email = rapidfuzz.fuzz.ratio(qb_email, zoho_email) / 100  # Normaliza a un rango de 0 a 1
                    seem_phone = rapidfuzz.fuzz.ratio(qb_phone, zoho_phone) / 100  # Normaliza a un rango de 0 a 1

                    if (seem_email > 0.7 or seem_phone > 0.7) and (zoho_customer_data['email'] == '' or not re.match(pattern, zoho_customer_data['email'])):
                        # Agregar coincidencias a la lista
                        dependences_list.append({
                            'zoho_customer_id': zoho_customer_data['contact_id'],
                            'zoho_customer': zoho_customer_data['customer_name'],
                            'email': zoho_customer_data['email'],
                            'seem_email': seem_email,
                            'coincidence_email': f'{round(seem_email * 100, 2)} %',
                            'phone': zoho_customer_data['phone'],
                            'seem_phone': seem_phone,
                            'coincidence_phone': f'{round(seem_phone * 100, 2)} %'
                        })

            if dependences_list:
                # Ordenar dependencias por `seem_email`
                sorted_dependences_list = sorted(dependences_list, key=lambda x: x['seem_email'], reverse=True)
                similar_customers.append({
                    'qb_customer_list_id': qb_df.iloc[qb_index]['list_id'],
                    'qb_customer_name': qb_df.iloc[qb_index]['name'],
                    'qb_customer_email': qb_email,
                    'qb_customer_phone': qb_phone,
                    'coincidences_by_order': sorted_dependences_list
                })
        
        return JsonResponse(similar_customers, safe=False)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)


#############################################
# Display matched elements
#############################################

@csrf_exempt
def matched_items(request):
    if request.method == 'GET':
    
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
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt
def matched_customers(request):
    if request.method == 'GET':
    
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
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt
def matched_invoices(request):
    if request.method == 'GET':
        stats = ZohoFullInvoice.objects.aggregate(
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

        # Obtener todas las facturas que necesitamos mostrar
        invoices = ZohoFullInvoice.objects.all()

        context = {
            'invoices': serializers.serialize('json', invoices),
            'matched_number': matched_number,
            'unmatched_number': unmatched_number,
            'unprocessed_number': unprocessed_number,
        }
        return JsonResponse(context, safe=False)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405) 
    


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

@require_POST
def match_one_item_ajax(request):
    action = request.POST['action']
    try:
        qb_list_id = request.POST['qb_item_list_id']
        zoho_item_id = request.POST['zoho_item_id']
        qb_item = get_object_or_404(QbItem, list_id=qb_list_id)
        zoho_item = get_object_or_404(ZohoItem, item_id=zoho_item_id)
        zoho_item.qb_list_id = qb_list_id if action == 'match' else ''
        zoho_item.save()
        qb_item.matched = True if action == 'match' else False
        qb_item.save()
        message = 'Item matched successfully' if action == 'match' else 'Item unmatched successfully'
        return JsonResponse({'status': 'success', 'message': message})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    

@require_POST
def match_one_customer_ajax(request):
    action = request.POST['action']
    print(f"Action: {action}")
    try:
        qb_list_id = request.POST['qb_customer_list_id']
        zoho_customer_id = request.POST['zoho_customer_id']
        qb_customer = get_object_or_404(QbCustomer, list_id=qb_list_id)
        zoho_customer = get_object_or_404(ZohoCustomer, contact_id=zoho_customer_id)
        zoho_customer.qb_list_id = qb_list_id if action == 'match' else ''
        zoho_customer.save()
        qb_customer.matched = True if action == 'match' else False
        qb_customer.save()
        message = 'Customer matched successfully' if action == 'match' else 'Customer unmatched successfully'
        return JsonResponse({'status': 'success', 'message': message})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    
    
#############################################    
# SOAP requests
#############################################

def start_qbwc_invoice_add_request(request):
    if request.method == 'POST':
        xml_data = request.body.decode('utf-8')
        response_xml = process_qbwc_invoice_add_request(xml_data)
        qb_loading = QbLoading.objects.filter(qb_module='invoices', qb_record_created=datetime.now(timezone.utc)).first()
        if not qb_loading:
            qb_loading = create_qb_loading_instance('invoices')
        else:
            qb_loading.qb_record_updated = datetime.now(timezone.utc)
        qb_loading.save()
        return HttpResponse(response_xml, content_type='text/xml')
    else:
        return HttpResponse(status=405)

def start_qbwc_query_request(request, query_object_name, list_of_objects):
    if request.method == 'POST':
        module = ''
        xml_data = request.body.decode('utf-8')
        # logger.debug(f"Received XML data: {xml_data}")
        # if 'ItemSalesTax' in xml_data:
        if f'{query_object_name}Ret' in xml_data:
            xml_dict = xmltodict.parse(xml_data)
            response_xml = xml_dict['soap:Envelope']['soap:Body']['receiveResponseXML']['response']
            data_dict = xmltodict.parse(response_xml)
            print(f"Data Dict: {data_dict}")
            if f'{query_object_name}QueryRs' in xml_data:
                elements_query_rs = data_dict['QBXML']['QBXMLMsgsRs'][f'{query_object_name}QueryRs'][f'{query_object_name}Ret']
                list_of_objects = [elem for elem in elements_query_rs]
                print(f"SOAP Elements ({query_object_name}): {list_of_objects}")
                if query_object_name == 'ItemInventory':
                    module = 'items'
                    items_saved = QbItem.objects.all()
                    items_to_save = []
                    for item in list_of_objects:
                        qb_item = QbItem.objects.create(
                            list_id=item['ListID'], 
                            name=item['Name'] if 'Name' in item else '',
                        )
                        existing_values = list(filter(lambda x: x.list_id == qb_item.list_id, items_saved))
                        if len(existing_values) == 0:
                            items_to_save.append(qb_item)
                            # qb_item.save()
                            
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
                                
                    save_items_in_batches(items_to_save, batch_size=100)
                    
                elif query_object_name == 'Customer':
                    module = 'customers'
                    customers_saved = QbCustomer.objects.all()
                    customers_to_save = []
                    for customer in list_of_objects:
                        qb_customer = QbCustomer.objects.create(
                            list_id=customer['ListID'], 
                            name=customer['FullName'] if 'FullName' in customer else '',  
                            email=customer['Email'] if 'Email' in customer else '', 
                            phone=customer['Phone'] if 'Phone' in customer else ''
                        )
                        existing_values = list(filter(lambda x: x.list_id == qb_customer.list_id, customers_saved))
                        if len(existing_values) == 0:
                            customers_to_save.append(qb_customer)
                            # qb_customer.save()
                            
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
                                        logger.error(f"Failed to save invoice {customer.list_id}: {e}")
                                
                    save_customers_in_batches(customers_to_save, batch_size=100)
                    
        if module != '':
            qb_loading = QbLoading.objects.filter(qb_module=module, qb_record_created=datetime.now(timezone.utc)).first()
            if not qb_loading:
                qb_loading = create_qb_loading_instance(module)
            else:
                qb_loading.qb_record_updated = datetime.now(timezone.utc)
            qb_loading.save()
                    
        response_xml = process_qbwc_query_request(xml_data, query_object_name)
        return HttpResponse(response_xml, content_type='text/xml')
    else:
        return HttpResponse(status=405)
        
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

def process_qbwc_query_request(xml_data, query_object_name):
    global counter
    global soap_customers
    global insert
    response = None
    try:
        xml_dict = xmltodict.parse(xml_data)
        body = xml_dict['soap:Envelope']['soap:Body']
        if 'authenticate' in body:
            response = soap_service.handle_authenticate(body)
        elif 'sendRequestXML' in body and counter == 0 and not insert:
            if query_object_name == 'ItemInventory':
                response = soap_service.generate_item_query_response()
            else:
                response = soap_service.generate_customer_query_response()
            insert = True
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
