from django.db.models import Q
from api_zoho.models import AppConfig
from api_zoho_invoices.models import ZohoFullInvoice
from api_zoho_customers.models import ZohoCustomer
from api_zoho_items.models import ZohoItem
from datetime import date
import logging
import uuid
import re
import os

# Configura el logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

##############################################
############## Authentication ################
##############################################

def handle_authenticate(body):
    logger.debug("Handling authenticate request")
    app_config = AppConfig.objects.first()
    username = body['authenticate']['strUserName']
    password = body['authenticate']['strPassword']
    if username == app_config.qb_username and password == app_config.qb_password:
        ticket = str(uuid.uuid4())
        response_xml = f'''
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:qb="http://developer.intuit.com/">
            <soap:Header/>
            <soap:Body>
                <qb:authenticateResponse>
                    <qb:authenticateResult>
                        <qb:string>{ticket}</qb:string>
                        <qb:string></qb:string>
                    </qb:authenticateResult>
                </qb:authenticateResponse>
            </soap:Body>
        </soap:Envelope>
        '''
        return response_xml
    else:
        response_xml = '''
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:qb="http://developer.intuit.com/">
            <soap:Header/>
            <soap:Body>
                <qb:authenticateResponse>
                    <qb:authenticateResult>
                        <qb:string></qb:string>
                        <qb:string>nvu</qb:string>
                    </qb:authenticateResult>
                </qb:authenticateResponse>
            </soap:Body>
        </soap:Envelope>
        '''
        return response_xml
    
##############################################
############## Customer Query ################
##############################################

def generate_customer_query_response():
    data_xml = '''<CustomerQueryRq requestID="1">
                    <IncludeRetElement>ListID</IncludeRetElement>
                    <IncludeRetElement>FullName</IncludeRetElement>
                    <IncludeRetElement>FirstName</IncludeRetElement>
                    <IncludeRetElement>LastName</IncludeRetElement>
                    <IncludeRetElement>CompanyName</IncludeRetElement>
                    <IncludeRetElement>Phone</IncludeRetElement>
                    <IncludeRetElement>Email</IncludeRetElement>
                  </CustomerQueryRq>'''
    
    request_xml = f'''<?qbxml version="8.0"?>
                    <QBXML>
                        <QBXMLMsgsRq onError="stopOnError">
                            {data_xml}
                        </QBXMLMsgsRq>
                    </QBXML>'''
    
    response = f'''<?xml version="1.0" encoding="utf-8"?>
                    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:qb="http://developer.intuit.com/">
                        <soap:Header/>
                        <soap:Body>
                            <qb:sendRequestXMLResponse>
                                <qb:sendRequestXMLResult><![CDATA[{request_xml}]]></qb:sendRequestXMLResult>
                            </qb:sendRequestXMLResponse>
                        </soap:Body>
                    </soap:Envelope>'''
    
    return response

##############################################
################ Item Query ##################
##############################################

def generate_item_query_response(query_object_name):
    data_xml = f'''<{query_object_name}QueryRq requestID="2">
                    <IncludeRetElement>ListID</IncludeRetElement>
                    <IncludeRetElement>Name</IncludeRetElement>
                  </{query_object_name}QueryRq>'''
                  
    # data_xml = '''<ItemSalesTaxQueryRq requestID="2">
    #                 <IncludeRetElement>ListID</IncludeRetElement>
    #                 <IncludeRetElement>Name</IncludeRetElement>
    #               </ItemSalesTaxQueryRq>'''
    
    request_xml = f'''<?qbxml version="8.0"?>
                    <QBXML>
                        <QBXMLMsgsRq onError="stopOnError">
                            {data_xml}
                        </QBXMLMsgsRq>
                    </QBXML>'''
    
    response = f'''<?xml version="1.0" encoding="utf-8"?>
                    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:qb="http://developer.intuit.com/">
                        <soap:Header/>
                        <soap:Body>
                            <qb:sendRequestXMLResponse>
                                <qb:sendRequestXMLResult><![CDATA[{request_xml}]]></qb:sendRequestXMLResult>
                            </qb:sendRequestXMLResponse>
                        </soap:Body>
                    </soap:Envelope>'''
    
    return response

##############################################
############# Close Connection ###############
##############################################

def generate_close_connection_response():
    logger.debug("Generating close connection response")
    response_xml = '''<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:qb="http://developer.intuit.com/">
        <soap:Header/>
        <soap:Body>
            <qb:closeConnectionResponse>
                <qb:closeConnectionResult>Connection closed successfully</qb:closeConnectionResult>
            </qb:closeConnectionResponse>
        </soap:Body>
    </soap:Envelope>'''
    return response_xml

##############################################
############## Error Responses ###############
##############################################

def generate_unsupported_request_response():
    response_xml = '''<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                   xmlns:qb="http://developer.intuit.com/">
        <soap:Header/>
        <soap:Body>
            <qb:QBXML>
                <qb:QBXMLMsgsRs>
                    <qb:StatusMessage>Unsupported request</qb:StatusMessage>
                </qb:QBXMLMsgsRs>
            </qb:QBXML>
        </soap:Body>
    </soap:Envelope>'''
    return response_xml

def generate_error_response(error_message):
    response_xml = f'''<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                   xmlns:qb="http://developer.intuit.com/">
        <soap:Header/>
        <soap:Body>
            <qb:QBXML>
                <qb:QBXMLMsgsRs>
                    <qb:StatusMessage>Error processing request: {error_message}</qb:StatusMessage>
                </qb:QBXMLMsgsRs>
            </qb:QBXML>
        </soap:Body>
    </soap:Envelope>'''
    return response_xml

##############################################
############### Add Elements #################
##############################################

##############################################
############### Add Customer #################
##############################################

def generate_customer_add_response(zoho_final_customers):
    
    data_xml = ''
    
    for i in range(len(zoho_final_customers) - 20, len(zoho_final_customers)):
        data_xml += f'''<CustomerAddRq requestID="{i + 2}">
                            <CustomerAdd>
                                <Name>{zoho_final_customers[i].customer_name if zoho_final_customers[i].customer_name else "NO NAME"}</Name>
                                <CompanyName>{zoho_final_customers[i].company_name if zoho_final_customers[i].company_name else "NO COMPANY NAME"}</CompanyName>
                                <FirstName>{zoho_final_customers[i].first_name if zoho_final_customers[i].first_name else "NO FIRST NAME"}</FirstName>
                                <LastName>{zoho_final_customers[i].last_name if zoho_final_customers[i].last_name else "NO LAST NAME"}</LastName>
                                <Phone>{zoho_final_customers[i].phone if zoho_final_customers[i].phone else "NO PHONE"}</Phone>
                                <Email>{zoho_final_customers[i].email if zoho_final_customers[i].email else "not@email.com"}</Email>
                            </CustomerAdd>
                        </CustomerAddRq>'''
    
    request_xml = f'''<?qbxml version="8.0"?>
                      <QBXML>
                        <QBXMLMsgsRq onError="stopOnError">
                            {data_xml}
                        </QBXMLMsgsRq>
                      </QBXML>'''
    
    response = f'''<?xml version="1.0" encoding="utf-8"?>
                    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:qb="http://developer.intuit.com/">
                        <soap:Header/>
                        <soap:Body>
                            <qb:sendRequestXMLResponse>
                                <qb:sendRequestXMLResult><![CDATA[{request_xml}]]></qb:sendRequestXMLResult>
                            </qb:sendRequestXMLResponse>
                        </soap:Body>
                    </soap:Envelope>'''
    return response

##############################################
################# Add Item ###################
##############################################

def generate_item_add_response(zoho_final_items):
    # data_xml = '''<ItemNonInventoryAddRq>
    #                 <ItemNonInventoryAdd>
    #                     <Name>***Sample Item</Name>
    #                     <SalesOrPurchase>
    #                         <Desc>Sample item description</Desc>
    #                         <Price>100.00</Price>
    #                         <AccountRef>
    #                             <FullName>Construction Income</FullName>
    #                         </AccountRef>
    #                     </SalesOrPurchase>
    #                 </ItemNonInventoryAdd>
    #             </ItemNonInventoryAddRq>'''
    data_xml = ''
    for i in range(len(zoho_final_items) - 3, len(zoho_final_items) - 2):
        replace_name = re.sub(r'[/()]', ' ', zoho_final_items[i].name).strip()
        replace_name = re.sub(r'\s+', ' ', replace_name)    
        data_xml += f'''<ItemNonInventoryAddRq requestID="{i + 2}">
                            <ItemNonInventoryAdd>
                                <Name>{replace_name if zoho_final_items[i].name else "NO NAME"}</Name>
                                <SalesOrPurchase>
                                    <Desc>SKU: {zoho_final_items[i].sku if zoho_final_items[i].sku else "NO DESCRIPTION"}</Desc>
                                    <Price>{zoho_final_items[i].rate if zoho_final_items[i].rate else "0.00"}</Price>
                                    <AccountRef>
                                        <FullName>Construction Income</FullName>
                                    </AccountRef>
                                </SalesOrPurchase>
                            </ItemNonInventoryAdd>
                        </ItemNonInventoryAddRq>
                    '''
    
    request_xml = f'''<?qbxml version="8.0"?>
                      <QBXML>
                        <QBXMLMsgsRq onError="stopOnError">
                            {data_xml}
                        </QBXMLMsgsRq>
                      </QBXML>'''
    
    response = f'''<?xml version="1.0" encoding="utf-8"?>
                    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:qb="http://developer.intuit.com/">
                        <soap:Header/>
                        <soap:Body>
                            <qb:sendRequestXMLResponse>
                                <qb:sendRequestXMLResult><![CDATA[{request_xml}]]></qb:sendRequestXMLResult>
                            </qb:sendRequestXMLResponse>
                        </soap:Body>
                    </soap:Envelope>'''
    return response



##############################################
################ Add Invoice #################
##############################################

def generate_invoice_add_response_new_version():
    data_xml = '''<InvoiceAddRq requestID="2">
                        <InvoiceAdd>
                                <CustomerRef>   
                                    <ListID>8000006B-1719403672</ListID>
                                </CustomerRef>  
                                <TxnDate>2024-06-27</TxnDate>
                                <RefNumber>INV-000004</RefNumber>
                                <BillAddress>
                                    <Addr1>No Street</Addr1>
                                    <Addr2>No Number</Addr2>
                                    <City>No City</City>
                                    <State>No State</State>
                                    <PostalCode>00000</PostalCode>
                                </BillAddress>
                                <PONumber>PO000004</PONumber>
                                <TermsRef>
                                    <FullName>Net 30</FullName>
                                </TermsRef>
                                <InvoiceLineAdd>
                                    <ItemRef>
                                        <ListID>800000E6-1719336096</ListID>
                                    </ItemRef>
                                    <Desc>Aluminum Clip for Mullion / 4 Inch</Desc>
                                    <Quantity>2.0</Quantity>
                                    <Rate>268.0</Rate>
                                </InvoiceLineAdd>
                        </InvoiceAdd>
                    </InvoiceAddRq>
    '''
    request_xml = f'''<?qbxml version="13.0"?>
                    <QBXML>
                        <QBXMLMsgsRq onError="stopOnError">
                            {data_xml}
                        </QBXMLMsgsRq>
                    </QBXML>'''
    
    response = f'''<?xml version="1.0" encoding="utf-8"?>
                    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:qb="http://developer.intuit.com/">
                        <soap:Header/>
                        <soap:Body>
                            <qb:sendRequestXMLResponse>
                                <qb:sendRequestXMLResult><![CDATA[{request_xml}]]></qb:sendRequestXMLResult>
                            </qb:sendRequestXMLResponse>
                        </soap:Body>
                    </soap:Envelope>'''
    return response


def generate_invoice_add_response():
    today = date.today()
    logging.debug(f'Today: {today}')

    invoices = ZohoFullInvoice.objects.filter(Q(force_to_sync=True) | Q(date=today), inserted_in_qb=False)
    logging.debug(f'Length Invoices: {len(invoices)}')

    data_xml = ''
    response = None

    for i in range(len(invoices)):
        logging.debug(f'Invoice: {invoices[i].date}, {invoices[i].invoice_number}, {invoices[i].customer_id}, {invoices[i].customer_name}')

        items_xml = ''
        items_unmatched = []
        customers_unmatched = []
        counter_items_with_list_id = 0

        invoices[i].last_sync_date = today
        invoices[i].number_of_times_synced += 1

        for item in invoices[i].line_items:
            if isinstance(item, ZohoItem):
                desc = item.description if item.description else 'default_desc_value_if_not_found'
                name = item.name if item.name else 'default_name_value_if_not_found'
                sku = item.sku if item.sku else 'default_sku_value_if_not_found'
                quantity = item.quantity if item.quantity else 'default_quantity_value_if_not_found'
                rate = item.rate
            else:
                desc = item.get('description', 'default_desc_value_if_not_found')
                name = item.get('name', 'default_name_value_if_not_found')
                sku = item.get('sku', 'default_sku_value_if_not_found')
                quantity = item.get('quantity', 'default_quantity_value_if_not_found')
                rate = item.get('rate', 'default_rate_value_if_not_found')

            if sku == 'default_sku_value_if_not_found' or sku == '':
                zoho_item = ZohoItem.objects.filter(Q(name=desc) | Q(description=desc) | Q(name=name)).first()
            else:
                zoho_item = ZohoItem.objects.filter(Q(sku=sku)).first()

            logging.debug(f'Zoho Item: {zoho_item}')

            if zoho_item:
                if zoho_item.qb_list_id:
                    regex = re.compile(r'^[A-Za-z0-9]{8}-\d{10}$')
                    if regex.match(zoho_item.qb_list_id):
                        counter_items_with_list_id += 1
                        items_xml += f'''<InvoiceLineAdd>
                                        <ItemRef>
                                            <ListID>{zoho_item.qb_list_id}</ListID>
                                        </ItemRef>
                                        <Desc>{desc}</Desc>
                                        <Quantity>{quantity}</Quantity>
                                        <Rate>{rate}</Rate>
                                    </InvoiceLineAdd>'''
                    else:
                        logger.debug(f'Item {zoho_item} has a QB List ID that is not valid (Proceed to match)')
                        info_item_unmatched = {
                            'zoho_item_id': zoho_item.item_id,
                            'zoho_item_unmatched': zoho_item.name,
                            'reason': 'Item QB List ID is not valid (Proceed to match)'
                        }
                        items_unmatched.append(info_item_unmatched)
                else:
                    logger.debug(f'Item {zoho_item} has no QB List ID (Proceed to match)')
                    info_item_unmatched = {
                        'zoho_item_id': zoho_item.item_id,
                        'zoho_item_unmatched': zoho_item.name,
                        'reason': 'Item has no QB List ID (Proceed to match)'
                    }
                    items_unmatched.append(info_item_unmatched)
            else:
                logger.debug(f'Item {desc} has no match in Zoho Items')
                info_item_unmatched = {
                    'zoho_item_id': None,
                    'zoho_item_unmatched': desc,
                    'reason': 'Item does not exist in Zoho Items'
                }
                items_unmatched.append(info_item_unmatched)

        logging.debug(f'--------------------------------------------------------------------------------------------')

        if len(items_unmatched) > 0:
            invoices[i].items_unmatched = items_unmatched
            invoices[i].inserted_in_qb = False
            invoices[i].save()
        elif counter_items_with_list_id == len(invoices[i].line_items):
            invoices[i].items_unmatched = []
            invoices[i].save()

        zoho_customer = ZohoCustomer.objects.filter(contact_id=invoices[i].customer_id).first()

        if zoho_customer:
            if zoho_customer.qb_list_id:
                invoices[i].customer_unmatched = []

                street = invoices[i].billing_address['street'] if invoices[i].billing_address['street'] != '' else 'NO STREET'
                address = invoices[i].billing_address['address'] if invoices[i].billing_address['address'] != '' else 'NO ADDRESS'
                city = invoices[i].billing_address['city'] if invoices[i].billing_address['city'] != '' else 'NO CITY'
                state = invoices[i].billing_address['state'] if invoices[i].billing_address['state'] != '' else 'NO STATE'
                zip_code = invoices[i].billing_address['zip'] if invoices[i].billing_address['zip'] != '' else '00000'
                terms = invoices[i].terms if invoices[i].terms else 'Net 30'

                if counter_items_with_list_id == len(invoices[i].line_items):
                    if items_xml != '':
                        sales_tax_list_id = os.environ.get('SALES_TAX_LIST_ID')
                        data_xml += f'''<InvoiceAddRq requestID="{i + 2}">
                                        <InvoiceAdd>
                                            <CustomerRef>
                                                <ListID>{zoho_customer.qb_list_id}</ListID>
                                            </CustomerRef>
                                            <TxnDate>{invoices[i].date}</TxnDate>
                                            <RefNumber>{invoices[i].invoice_number}</RefNumber>
                                            <BillAddress>
                                                <Addr1>{street}</Addr1>
                                                <Addr2>{address}</Addr2>
                                                <City>{city}</City>
                                                <State>{state}</State>
                                                <PostalCode>{zip_code}</PostalCode>
                                            </BillAddress>
                                            <PONumber>{invoices[i].invoice_number}</PONumber>
                                            <TermsRef>
                                                <FullName>{terms}</FullName>
                                            </TermsRef>
                                            {items_xml}
                                            <InvoiceLineAdd>
                                                <ItemRef>
                                                    <ListID>{sales_tax_list_id}</ListID>
                                                </ItemRef>
                                            </InvoiceLineAdd>
                                        </InvoiceAdd>
                                    </InvoiceAddRq>'''

                    logger.debug(f'Data XML: {data_xml}')
                    invoices[i].inserted_in_qb = True
                    invoices[i].save()
            else:
                logger.debug(f'Customer {zoho_customer} has no QB List ID (Proceed to match)')
                customer_unmatched = {
                    'zoho_customer_id': zoho_customer.contact_id,
                    'zoho_customer_unmatched': zoho_customer.customer_name,
                    'reason': 'Customer is not matched in QuickBooks (Proceed to match)'
                }
                customers_unmatched.append(customer_unmatched)
                invoices[i].customer_unmatched = customers_unmatched
                invoices[i].inserted_in_qb = False
                invoices[i].save()
        else:
            logger.debug(f'Customer {invoices[i].customer_id} has no match in Zoho Customers')
            customer_unmatched = {
                'zoho_customer_id': invoices[i].customer_id,
                'zoho_customer_unmatched': 'Customer not found',
                'reason': 'Customer is not matched in Zoho Customers'
            }
            customers_unmatched.append(customer_unmatched)
            invoices[i].customer_unmatched = customers_unmatched
            invoices[i].inserted_in_qb = False
            invoices[i].save()

    if data_xml != '':
        request_xml = f'''<?qbxml version="8.0"?>
                                <QBXML>
                                    <QBXMLMsgsRq onError="stopOnError">
                                        {data_xml}
                                    </QBXMLMsgsRq>
                                </QBXML>'''

        response = f'''<?xml version="1.0" encoding="utf-8"?>
                                <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:qb="http://developer.intuit.com/">
                                    <soap:Header/>
                                    <soap:Body>
                                        <qb:sendRequestXMLResponse>
                                            <qb:sendRequestXMLResult><![CDATA[{request_xml}]]></qb:sendRequestXMLResult>
                                        </qb:sendRequestXMLResponse>
                                    </soap:Body>
                                </soap:Envelope>'''
    return response
