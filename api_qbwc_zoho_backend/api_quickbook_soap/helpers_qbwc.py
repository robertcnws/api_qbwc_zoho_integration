# views_qbwc.py
import logging
import re
from datetime import datetime, timezone, timedelta

import xmltodict
from django.http import HttpResponse
from django.utils.timezone import now

from api_zoho.models import AppConfig
from .models import QbItem, QbCustomer, QbLoading
import api_zoho.views as api_zoho_views

logger = logging.getLogger(__name__)

BATCH_SIZE = 1000


# ---------- Helpers de Sync (mínimo cambio) ----------
def get_last_sync_utc(module: str) -> datetime | None:
    row = QbLoading.objects.filter(qb_module=module).order_by('-qb_record_created').first()
    if not row:
        return None
    return row.qb_record_updated or row.qb_record_created


def set_last_sync_utc(module: str) -> None:
    qb_loading = QbLoading.objects.filter(qb_module=module).order_by('-qb_record_created').first()
    if not qb_loading:
        qb_loading = create_qb_loading_instance(module)
    qb_loading.qb_record_updated = now()
    qb_loading.save()


def _format_qb_datetime(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S%z')


def _extract_iterator_info(data_dict: dict, query_object_name: str) -> tuple[int, str | None]:
    try:
        rs = data_dict['QBXML']['QBXMLMsgsRs'][f'{query_object_name}QueryRs']
        remaining = int(rs.get('@iteratorRemainingCount', '0'))
        iterator_id = rs.get('@iteratorID')
        return remaining, iterator_id
    except Exception:
        return 0, None


def _wrap_qbxml_in_soap(qbxml_payload: str) -> str:
    return f"""<?xml version="1.0" encoding="utf-8"?>
            <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
                <sendRequestXMLResponse xmlns="http://developer.intuit.com/">
                <sendRequestXMLResult><![CDATA[{qbxml_payload}]]></sendRequestXMLResult>
                </sendRequestXMLResponse>
            </soap:Body>
            </soap:Envelope>"""


def process_qbwc_query_request(xml_in: str, query_object_name: str) -> str:
    try:
        xml_dict = xmltodict.parse(xml_in)
        response_xml = xml_dict['soap:Envelope']['soap:Body']['receiveResponseXML']['response']
        data_dict = xmltodict.parse(response_xml)
    except Exception:
        data_dict = {}

    remaining, iterator_id = _extract_iterator_info(data_dict, query_object_name)

    if remaining and iterator_id:
        qbxml = f"""
            <QBXML>
            <QBXMLMsgsRq onError="stopOnError">
                <{query_object_name}QueryRq requestID="2" iterator="Continue">
                <IteratorID>{iterator_id}</IteratorID>
                <OwnerID>0</OwnerID>
                <MaxReturned>1000</MaxReturned>
                </{query_object_name}QueryRq>
            </QBXMLMsgsRq>
            </QBXML>
        """.strip()
    else:
        module = 'customers' if query_object_name == 'Customer' else 'items'
        last_sync = get_last_sync_utc(module)
        if not last_sync:
            last_sync = datetime(2000, 1, 1, tzinfo=timezone.utc)
        
        from_modified = _format_qb_datetime(last_sync - timedelta(minutes=2))
        qbxml = f"""
            <QBXML>
            <QBXMLMsgsRq onError="stopOnError">
                <{query_object_name}QueryRq requestID="1" iterator="Start">
                <FromModifiedDate>{from_modified}</FromModifiedDate>
                <OwnerID>0</OwnerID>
                <MaxReturned>1000</MaxReturned>
                </{query_object_name}QueryRq>
            </QBXMLMsgsRq>
            </QBXML>
        """.strip()

    return _wrap_qbxml_in_soap(qbxml)


def start_qbwc_query_request(request, query_object_name, list_of_objects=None):
    xml_data = request.body.decode('utf-8')
    module = ''

    if f'{query_object_name}Ret' in xml_data:
        xml_dict = xmltodict.parse(xml_data)
        response_xml = xml_dict['soap:Envelope']['soap:Body']['receiveResponseXML']['response']
        data_dict = xmltodict.parse(response_xml)
        
        if f'{query_object_name}QueryRs' in response_xml:
            ret = data_dict['QBXML']['QBXMLMsgsRs'][f'{query_object_name}QueryRs'].get(f'{query_object_name}Ret')
            list_of_objects = ret if isinstance(ret, list) else ([ret] if ret else [])
            logger.info(f"Number of {query_object_name} detected: {len(list_of_objects)}")

            # -------- ITEMS --------
            if query_object_name in ['ItemInventory', 'ItemSalesTax', 'ItemService',
                                     'ItemNonInventory', 'Item', 'ItemInventoryPart', 
                                     'ItemDiscount']:
                module = 'items'
                
                existing_ids = set(QbItem.objects.values_list('list_id', flat=True))

                to_insert = []
                to_update = []
                
                needed_ids = [i.get('ListID', '') for i in list_of_objects if i and i.get('ListID')]
                existing_map = {
                    it.list_id: it
                    for it in QbItem.objects.filter(list_id__in=needed_ids)
                }

                for it in list_of_objects:
                    if not it:
                        continue
                    list_id = it.get('ListID')
                    if not list_id:
                        continue
                    name = it.get('Name', '') or ''
                    item_type = query_object_name

                    if list_id not in existing_ids:
                        to_insert.append(QbItem(list_id=list_id, name=name, item_type=item_type))
                    else:
                        obj = existing_map.get(list_id)
                        if obj:
                            changed = False
                            if obj.name != name:
                                obj.name = name; changed = True
                            if obj.item_type != item_type:
                                obj.item_type = item_type; changed = True
                            if changed:
                                to_update.append(obj)

                if to_insert:
                    QbItem.objects.bulk_create(to_insert, ignore_conflicts=True, batch_size=BATCH_SIZE)

                if to_update:
                    for i in range(0, len(to_update), BATCH_SIZE):
                        QbItem.objects.bulk_update(
                            to_update[i:i+BATCH_SIZE],
                            fields=['name', 'item_type'],
                            batch_size=BATCH_SIZE
                        )

                logger.info(f"Number of {query_object_name} to save: {len(to_insert)}")
                logger.info(f"Number of {query_object_name} updated: {len(to_update)}")

            # -------- CUSTOMERS --------
            elif query_object_name == 'Customer':
                module = 'customers'

                existing_ids = set(QbCustomer.objects.values_list('list_id', flat=True))
                to_insert = []
                to_update = []

                needed_ids = [c.get('ListID', '') for c in list_of_objects if c and c.get('ListID')]
                existing_map = {
                    c.list_id: c
                    for c in QbCustomer.objects.filter(list_id__in=needed_ids)
                }

                for c in list_of_objects:
                    if not c:
                        continue
                    list_id = c.get('ListID')
                    if not list_id:
                        continue

                    full_name = (c.get('FullName', '') or '')
                    email = (c.get('Email') or '').lower()
                    phone = api_zoho_views.clean_phone_number(c.get('Phone', '') or '')

                    if list_id not in existing_ids:
                        to_insert.append(QbCustomer(
                            list_id=list_id, name=full_name, email=email, phone=phone
                        ))
                    else:
                        obj = existing_map.get(list_id)
                        if obj:
                            changed = False
                            if obj.name != full_name:
                                obj.name = full_name; changed = True
                            if obj.email != email:
                                obj.email = email; changed = True
                            if obj.phone != phone:
                                obj.phone = phone; changed = True
                            if changed:
                                to_update.append(obj)

                if to_insert:
                    QbCustomer.objects.bulk_create(to_insert, ignore_conflicts=True, batch_size=BATCH_SIZE)

                if to_update:
                    for i in range(0, len(to_update), BATCH_SIZE):
                        QbCustomer.objects.bulk_update(
                            to_update[i:i+BATCH_SIZE],
                            fields=['name', 'email', 'phone'],
                            batch_size=BATCH_SIZE
                        )

                logger.info(f"Number of {query_object_name} to save: {len(to_insert)}")
                logger.info(f"Number of {query_object_name} updated: {len(to_update)}")

    # -------- Tracking / Notificaciones (igual que tenías) --------
    if module:
        qb_loading = QbLoading.objects.filter(
            qb_module=module, qb_record_created=datetime.now(timezone.utc)
        ).first()
        if not qb_loading:
            qb_loading = create_qb_loading_instance(module)
        else:
            qb_loading.qb_record_updated = datetime.now(timezone.utc)
        qb_loading.save()

        app_config = AppConfig.objects.first()
        api_zoho_views.manage_api_tracking_log(
            f'{app_config.qb_username} (From QBWC)',
            f'load_{module}_from_qb',
            request.META.get('REMOTE_ADDR'),
            f'Load {module} from QuickBooks'
        )
        logger.info(f"QB Loading instance created/updated for module {module}")
        logger.info(f"Task done: {qb_loading}")
        module_object = re.sub(r'([a-z])([A-Z])', r'\1 \2', query_object_name)
        message_notification = f'All {module_object} have been loaded from QuickBooks'
        api_zoho_views.manage_notifications(message_notification)

    # -------- Construimos la próxima petición (Start/Continue) --------
    # Si remaining == 0, next será un Start con FromModifiedDate (delta), y marcamos last_sync.
    # Para saber si remaining==0, volvemos a parsear response_xml rápido:
    try:
        xml_dict = xmltodict.parse(request.body.decode('utf-8'))
        response_xml = xml_dict['soap:Envelope']['soap:Body']['receiveResponseXML']['response']
        data_dict = xmltodict.parse(response_xml)
        remaining, _ = _extract_iterator_info(data_dict, query_object_name)
    except Exception:
        remaining = 0

    if remaining == 0 and module:
        set_last_sync_utc(module)

    response_soap = process_qbwc_query_request(request.body.decode('utf-8'), query_object_name)
    return HttpResponse(response_soap, content_type='text/xml')


def create_qb_loading_instance(module):
    item = QbLoading()
    item.qb_module = module
    item.qb_record_created = datetime.now(timezone.utc)
    item.qb_record_updated = datetime.now(timezone.utc)
    return item 
