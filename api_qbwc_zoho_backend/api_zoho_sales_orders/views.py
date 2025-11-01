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
from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError
from django.db.models import Q
from api_zoho.models import AppConfig, ZohoLoading   
from api_zoho_sales_orders.models import ZohoFullSalesOrder
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from api_zoho_items.models import ZohoItem
from api_zoho_customers.models import ZohoCustomer 
from api_zoho_invoices.views import handle_option_date 
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.utils import timezone
from django.utils.dateparse import parse_datetime, parse_date
from utils.helpers import nz_str, nz_int, nz_bool, nz_decimal, nz_date, nz_datetime
import api_zoho_sales_orders.services as zoho_sales_order_services
import requests
import json
import logging
import datetime as dt
import pandas as pd

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_sales_order(request, sales_order_id):
    return zoho_sales_order_services.view_sales_order(request, sales_order_id)


@login_required(login_url='login')
def list_sales_orders(request):
    return zoho_sales_order_services.list_sales_orders(request)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def load_sales_orders(request, task_job=False):
    return zoho_sales_order_services.load_sales_orders(request, task_job)

    
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_sales_order(request, sales_order_id):
    return zoho_sales_order_services.delete_sales_order(request, sales_order_id)