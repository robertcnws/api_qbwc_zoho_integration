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
import api_zoho_customers.services as zoho_customer_services


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


@shared_task
def load_customers_task(headers, params, username, pc_ip):
    result = zoho_customer_services.load_customers_from_main_load(headers, params, username, pc_ip)
    return result