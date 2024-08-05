from django_cron import CronJobBase, Schedule
from django.conf import settings
from django.http import HttpRequest
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .views import load_invoices

class MyCronJob(CronJobBase):
    RUN_EVERY_MINS = 1  # Ejecutar una vez al día (en minutos)
    schedule = Schedule(run_every_mins=RUN_EVERY_MINS)
    code = 'api_zoho_invoices.load_invoices_cron_job'
    
    def do(self):
        print("Starting cron job")
        run_load_invoices()
        print("Cron job finished")
        

def get_jwt_token(username, password):
    user = authenticate(username=username, password=password)
    if user is None:
        return None  # O maneja el caso en que las credenciales no sean válidas
    
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
    
    
def create_fake_request_with_data(token):
    request = HttpRequest()
    request.method = 'POST'
    request.POST = {
        'option': 'Today',
    }
    request.content_type = 'application/json'
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {token["access"]}'
    return request


def run_load_invoices():
    username = 'admin'
    password = 'admin'
    tokens = get_jwt_token(username, password)
    if tokens:
        request = create_fake_request_with_data(tokens['access'])
        load_invoices(request)
    else:
        print("Failed to obtain token")