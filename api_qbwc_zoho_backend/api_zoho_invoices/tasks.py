from celery import shared_task
from django.http import HttpRequest
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .views import load_invoices
import logging
import json
import socket

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@shared_task
def load_invoices_periodic_task():
    run_load_invoices()
    logger.info("Task load_invoices_periodic_task successfully executed")
    

def get_jwt_token(username, password):
    user = authenticate(username=username, password=password)
    if user is None:
        return None
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
    
    
def get_local_ip():
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    return local_ip


def create_fake_request_with_data(token):
    request = HttpRequest()
    request.method = 'POST'
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
    request.META['REMOTE_ADDR'] = get_local_ip()
    request._body = json.dumps({
        'option': 'Yesterday',
        'username': 'admin', 
    }).encode('utf-8')
    request.content_type = 'application/json'
    return request


def run_load_invoices():
    username = 'admin'
    password = 'admin'
    tokens = get_jwt_token(username, password)
    if tokens:
        request = create_fake_request_with_data(tokens['access'])
        load_invoices(request, task_job=True)
    else:
        logger.error("Failed to obtain token")
