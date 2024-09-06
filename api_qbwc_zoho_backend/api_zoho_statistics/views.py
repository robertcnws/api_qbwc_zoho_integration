from django.shortcuts import render

from django.http import JsonResponse
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth, TruncDate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
from django.utils import timezone
from api_zoho_invoices.models import ZohoFullInvoice
from api_zoho_customers.models import ZohoCustomer
from api_zoho_items.models import ZohoItem
from api_zoho.views import validateJWTTokenRequest

import math

import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

#############################################
# QUERIES TO DATACHARTS
#############################################

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def data_invoice_historic_statistics(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        invoices = ZohoFullInvoice.objects.all()
        stats = invoices.aggregate(
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
        total_number = invoices.count()
        
        return JsonResponse({
            'matched_per_cent': matched_number / total_number if total_number > 0 else 0,
            'unmatched_per_cent': unmatched_number / total_number if total_number > 0 else 0,
            'unprocessed_per_cent': unprocessed_number / total_number if total_number > 0 else 0,
        }, status=200)
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def data_invoice_monthly_statistics(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        five_months_ago = datetime.now() - timedelta(days=5*30)
        invoices = ZohoFullInvoice.objects.filter(date__gte=five_months_ago)
        
        stats = invoices.annotate(month=TruncMonth('date')).values('month').annotate(
            matched_number=Count('id', filter=Q(inserted_in_qb=True)),
            total_items_unmatched=Count('id', filter=Q(items_unmatched__isnull=False, items_unmatched__gt=0)),
            total_customers_unmatched=Count('id', filter=Q(customer_unmatched__isnull=False, customer_unmatched__gt=0)),
            unprocessed_number=Count('id', filter=Q(inserted_in_qb=False))
        ).order_by('month')
        
        response_data = []
        for stat in stats:
            month = stat['month'].strftime('%Y-%m') 
            total_number = invoices.filter(date__month=stat['month'].month, date__year=stat['month'].year).count()
            matched_number = stat['matched_number']
            total_items_unmatched = stat['total_items_unmatched']
            total_customers_unmatched = stat['total_customers_unmatched']
            unmatched_number = max(total_items_unmatched, total_customers_unmatched)
            unprocessed_number = stat['unprocessed_number'] - unmatched_number
            
            response_data.append({
                'month': month,
                'matched_number': matched_number,
                'unmatched_number': unmatched_number,
                'unprocessed_number': unprocessed_number,
                'total_number': total_number,
            })
        
        return JsonResponse(response_data, safe=False, status=200)
    
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def data_invoice_daily_statistics(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        seven_days_ago = datetime.now() - timedelta(days=7)
        
        invoices = ZohoFullInvoice.objects.filter(date__gte=seven_days_ago)
        
        stats = invoices.annotate(day=TruncDate('date')).values('day').annotate(
            matched_number=Count('id', filter=Q(inserted_in_qb=True)),
            total_items_unmatched=Count('id', filter=Q(items_unmatched__isnull=False, items_unmatched__gt=0)),
            total_customers_unmatched=Count('id', filter=Q(customer_unmatched__isnull=False, customer_unmatched__gt=0)),
            unprocessed_number=Count('id', filter=Q(inserted_in_qb=False))
        ).order_by('day')
        
        response_data = []
        for stat in stats:
            day = stat['day'].strftime('%Y-%m-%d')
            total_number = invoices.annotate(day=TruncDate('date')).filter(day=stat['day']).count()
            
            matched_number = stat['matched_number']
            total_items_unmatched = stat['total_items_unmatched']
            total_customers_unmatched = stat['total_customers_unmatched']
            unmatched_number = max(total_items_unmatched, total_customers_unmatched)
            unprocessed_number = stat['unprocessed_number'] - unmatched_number
            
            response_data.append({
                'day': day,
                'matched_number': matched_number,
                'unmatched_number': unmatched_number,
                'unprocessed_number': unprocessed_number,
                'total_number': total_number,
            })
        
        return JsonResponse(response_data, safe=False, status=200)
    
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def data_invoice_trend_statistics(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        today = datetime.now()
        start_of_week = today - timedelta(days=today.weekday())  # Start of the current week
        end_of_week = start_of_week + timedelta(days=6)  # End of the current week

        # Total historic invoices with inserted_in_qb=True
        total_invoices = ZohoFullInvoice.objects.filter(inserted_in_qb=True).count()

        # Weekly trend
        weekly_data = ZohoFullInvoice.objects.filter(
            inserted_in_qb=True,
            date__range=[start_of_week, end_of_week]
        ).values('date').annotate(count=Count('id')).order_by('date')

        trend = {}
        trend['current_week'] = weekly_data.last()['count'] if weekly_data else 0
        previous_week_start = start_of_week - timedelta(weeks=1)
        previous_week_end = previous_week_start + timedelta(days=6)
        previous_week_data = ZohoFullInvoice.objects.filter(
                inserted_in_qb=True,
                date__range=[previous_week_start, previous_week_end]
        ).count()
        trend['previous_week'] = previous_week_data

        change = trend['current_week'] - trend['previous_week']
        trend['change'] = change
        trend['direction'] = 'up' if change > 0 else 'down'

        return JsonResponse({
            'total': total_invoices,
            'trend': trend
        })
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def data_customer_trend_statistics(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        today = timezone.now()
        start_of_week = today - timedelta(days=today.weekday()) 
        end_of_week = start_of_week + timedelta(days=6)

        # Total histórico de clientes con created_time en el rango de fechas
        total_customers = ZohoCustomer.objects.count()

        # Tendencia semanal
        weekly_data = ZohoCustomer.objects.filter(
            created_time__range=[start_of_week, end_of_week]
        ).values('created_time').annotate(count=Count('id')).order_by('created_time')

        logger.info(f'Weekly data: {len(weekly_data)}')

        trend = {}
        trend['current_week'] = weekly_data.last()['count'] if weekly_data else 0
        previous_week_start = start_of_week - timedelta(weeks=1)
        previous_week_end = previous_week_start + timedelta(days=6)
        previous_week_data = ZohoCustomer.objects.filter(
            created_time__range=[previous_week_start, previous_week_end]
        ).count()
        trend['previous_week'] = previous_week_data

        change = trend['current_week'] - trend['previous_week']
        trend['change'] = change
        trend['direction'] = 'up' if change > 0 else 'down'

        return JsonResponse({
            'total': total_customers,
            'trend': trend
        })
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def data_item_trend_statistics(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        today = timezone.now()
        start_of_week = today - timedelta(days=today.weekday()) 
        end_of_week = start_of_week + timedelta(days=6)

        # Total histórico de clientes con created_time en el rango de fechas
        total_customers = ZohoItem.objects.count()

        # Tendencia semanal
        weekly_data = ZohoItem.objects.filter(
            created_time__range=[start_of_week, end_of_week]
        ).values('created_time').annotate(count=Count('id')).order_by('created_time')

        logger.info(f'Weekly data: {len(weekly_data)}')

        trend = {}
        trend['current_week'] = weekly_data.last()['count'] if weekly_data else 0
        previous_week_start = start_of_week - timedelta(weeks=1)
        previous_week_end = previous_week_start + timedelta(days=6)
        previous_week_data = ZohoItem.objects.filter(
            created_time__range=[previous_week_start, previous_week_end]
        ).count()
        trend['previous_week'] = previous_week_data

        change = trend['current_week'] - trend['previous_week']
        trend['change'] = change
        trend['direction'] = 'up' if change > 0 else 'down'

        return JsonResponse({
            'total': total_customers,
            'trend': trend
        })
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def data_customer_matched_statistics(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        
        total_customers = ZohoCustomer.objects.count()
        
        pattern = r'^[A-Za-z0-9]{8}-[A-Za-z0-9]{10}$'
        
        total_not_matched_customers = ZohoCustomer.objects.filter(
            Q(qb_list_id__isnull=True) | Q(qb_list_id='') | ~Q(qb_list_id__regex=pattern)
        ).count()
        
        total_matched = total_customers - total_not_matched_customers
        
        per_cent_matched = math.floor((total_matched / total_customers) * 100) if total_customers > 0 else 0
        
        per_cent_not_matched = 100 - per_cent_matched

        trend = {}
        trend['total_not_matched_customers'] = total_not_matched_customers
        trend['total_matched'] = total_matched
        trend['per_cent_matched'] = per_cent_matched
        trend['per_cent_not_matched'] = per_cent_not_matched

        return JsonResponse({
            'total': total_customers,
            'trend': trend
        })
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def data_item_matched_statistics(request):
    valid_token = validateJWTTokenRequest(request)
    if valid_token:
        
        total_items = ZohoItem.objects.count()
        
        pattern = r'^[A-Za-z0-9]{8}-[A-Za-z0-9]{10}$'
        
        total_not_matched_items = ZohoItem.objects.filter(
            Q(qb_list_id__isnull=True) | Q(qb_list_id='') | ~Q(qb_list_id__regex=pattern)
        ).count()
        
        total_matched = total_items - total_not_matched_items
        
        per_cent_matched = math.floor((total_matched / total_items) * 100) if total_items > 0 else 0
        
        per_cent_not_matched = 100 - per_cent_matched

        trend = {}
        trend['total_not_matched_items'] = total_not_matched_items
        trend['total_matched'] = total_matched
        trend['per_cent_matched'] = per_cent_matched
        trend['per_cent_not_matched'] = per_cent_not_matched

        return JsonResponse({
            'total': total_items,
            'trend': trend
        })
    return JsonResponse({'error': 'Invalid JWT Token'}, status=401)