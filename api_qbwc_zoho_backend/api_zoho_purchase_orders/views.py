from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import api_zoho_purchase_orders.services as zoho_purchase_order_services
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_purchase_order(request, purchase_order_id):
    return zoho_purchase_order_services.view_purchase_order(request, purchase_order_id)


@login_required(login_url='login')
def list_purchase_orders(request):
    return zoho_purchase_order_services.list_purchase_orders(request)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def load_purchase_orders(request, task_job=False):
    return zoho_purchase_order_services.load_purchase_orders(request, task_job)

    
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_purchase_order(request, purchase_order_id):
    return zoho_purchase_order_services.delete_purchase_order(request, purchase_order_id)