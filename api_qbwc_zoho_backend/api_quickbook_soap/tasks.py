from celery import shared_task
from django.db import transaction, IntegrityError
from datetime import datetime, timezone
from datetime import date as date
from .models import QbItem, QbCustomer, QbLoading
import api_quickbook_soap.soap_service as soap_service
import xmltodict
import logging
import re
import json
import numpy as np
import pandas as pd
import rapidfuzz


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@shared_task
def start_qbwc_query_request_task(auth_result, xml_data, query_object_name, list_of_objects, counter, insert):
    if auth_result['status'] == 'success':
        try:
            logger.debug(f"Received XML data: {xml_data}")

            # Intentar parsear el XML
            try:
                xml_dict = xmltodict.parse(xml_data)
                logger.debug(f"Parsed XML dictionary: {xml_dict}")
            except xmltodict.expat.ExpatError as e:
                logger.error(f"XML Parsing Error: {e}")
                return {"status": "error", "message": "Invalid XML format"}

            # Extraer el XML de respuesta
            response_xml = xml_dict.get('soap:Envelope', {}).get('soap:Body', {}).get('receiveResponseXML', {}).get('response', '')
            if not response_xml:
                logger.error("Missing response XML in the parsed data")
                return {"status": "error", "message": "Missing response XML"}

            # Intentar parsear el XML de respuesta
            try:
                data_dict = xmltodict.parse(response_xml)
                logger.debug(f"Parsed response XML dictionary: {data_dict}")
            except xmltodict.expat.ExpatError as e:
                logger.error(f"Response XML Parsing Error: {e}")
                return {"status": "error", "message": "Invalid response XML format"}

            # Verificar la existencia de los elementos esperados
            if f'{query_object_name}QueryRs' in data_dict.get('QBXML', {}).get('QBXMLMsgsRs', {}):
                elements_query_rs = data_dict['QBXML']['QBXMLMsgsRs'][f'{query_object_name}QueryRs'].get(f'{query_object_name}Ret', [])
                list_of_objects = [elem for elem in elements_query_rs]

                if query_object_name == 'ItemInventory':
                    module = 'items'
                    items_saved = QbItem.objects.all()
                    items_to_save = []
                    for item in list_of_objects:
                        try:
                            qb_item = QbItem(
                                list_id=item.get('ListID', ''), 
                                name=item.get('Name', '')
                            )
                            existing_values = list(filter(lambda x: x.list_id == qb_item.list_id, items_saved))
                            if not existing_values:
                                items_to_save.append(qb_item)
                        except KeyError as e:
                            logger.error(f"Missing expected field in item data: {e}")

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
                        try:
                            qb_customer = QbCustomer(
                                list_id=customer.get('ListID', ''), 
                                name=customer.get('FullName', ''),  
                                email=customer.get('Email', ''), 
                                phone=customer.get('Phone', '')
                            )
                            existing_values = list(filter(lambda x: x.list_id == qb_customer.list_id, customers_saved))
                            if not existing_values:
                                customers_to_save.append(qb_customer)
                        except KeyError as e:
                            logger.error(f"Missing expected field in customer data: {e}")

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
                                        logger.error(f"Failed to save customer with list_id {customer.list_id}: {e}")

                    save_customers_in_batches(customers_to_save, batch_size=100)

            else:
                logger.error(f"Query object name '{query_object_name}' not found in the response")
                return {"status": "error", "message": "Query object name not found in response"}

            if module:
                try:
                    qb_loading = QbLoading.objects.filter(qb_module=module, qb_record_created=datetime.now(timezone.utc)).first()
                    if not qb_loading:
                        qb_loading = create_qb_loading_instance(module)
                    else:
                        qb_loading.qb_record_updated = datetime.now(timezone.utc)
                    qb_loading.save()
                except Exception as e:
                    logger.error(f"Error updating QbLoading instance: {e}")
                    return {"status": "error", "message": "Error updating QbLoading instance"}

            response_xml = process_qbwc_query_request(xml_data, query_object_name, counter, insert)
            return {"status": "success", "response_xml": response_xml}

        except Exception as e:
            logger.error(f"Unhandled error: {e}")
            return {"status": "error", "message": "Internal Server Error"}
    else:
        return {"status": "error", "message": "Authentication failed"}
    

@shared_task
def authenticate_qbwc_request_task(xml_data):
    result = process_qbwc_query_request(xml_data, None, 0, False)
    authentication_result = {"status": "success"} if result != None else {"status": "error"}
    return authentication_result 
    

def process_qbwc_query_request(xml_data, query_object_name, counter, insert):
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
    
    
def create_qb_loading_instance(module):
    item = QbLoading()
    item.qb_module = module
    item.qb_record_created = datetime.now(timezone.utc)
    item.qb_record_updated = datetime.now(timezone.utc)
    return item 