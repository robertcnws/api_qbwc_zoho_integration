from django.db import models
from django.utils import timezone

import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class ZohoFullSalesOrder(models.Model):

    SYNC_STATE_PENDING = 'pending'
    SYNC_STATE_SENT = 'sent'
    SYNC_STATE_CONFIRMED = 'confirmed'
    SYNC_STATE_FAILED = 'failed'
    SYNC_STATE_SKIPPED_DUPLICATE = 'skipped_duplicate'
    SYNC_STATE_CHOICES = [
        (SYNC_STATE_PENDING, 'Pending'),
        (SYNC_STATE_SENT, 'Sent to QB (awaiting response)'),
        (SYNC_STATE_CONFIRMED, 'Confirmed in QB'),
        (SYNC_STATE_FAILED, 'Failed in QB'),
        (SYNC_STATE_SKIPPED_DUPLICATE, 'Skipped — already in QB'),
    ]

    id = models.AutoField(primary_key=True)
    salesorder_id = models.CharField(max_length=32, unique=True, db_index=True)
    salesorder_number = models.CharField(max_length=64, db_index=True)
    date = models.DateField()
    status = models.CharField(max_length=64, db_index=True)
    customer_id = models.CharField(max_length=32, db_index=True)
    customer_name = models.CharField(max_length=255)
    qb_customer_list_id = models.CharField(max_length=100, blank=True, null=True)
    is_taxable = models.BooleanField(default=False)
    tax_id = models.CharField(max_length=32, blank=True, null=True)
    tax_name = models.CharField(max_length=128, blank=True, null=True)
    tax_percentage = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    line_items = models.JSONField(default=list, blank=True)
    currency_id = models.CharField(max_length=32, blank=True, null=True)
    currency_code = models.CharField(max_length=8, default="USD")
    currency_symbol = models.CharField(max_length=8, default="$")
    exchange_rate = models.DecimalField(max_digits=12, decimal_places=6, default=1)
    delivery_method = models.CharField(max_length=128, blank=True, null=True)
    total_quantity = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    sub_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    created_by_email = models.EmailField(blank=True, null=True)
    created_by_name = models.CharField(max_length=255, blank=True, null=True)
    salesperson_id = models.CharField(max_length=32, blank=True, null=True)
    salesperson_name = models.CharField(max_length=255, blank=True, null=True)
    is_test_order = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)
    payment_terms = models.IntegerField(default=0)
    payment_terms_label = models.CharField(max_length=128, blank=True, null=True)
    shipping_address = models.JSONField(default=dict, blank=True)
    billing_address = models.JSONField(default=dict, blank=True)
    custom_fields = models.JSONField(default=list, blank=True)          
    order_sub_statuses_raw = models.JSONField(default=list, blank=True) 
    shipment_sub_statuses = models.JSONField(default=list, blank=True)
    created_time = models.DateTimeField()
    last_modified_time = models.DateTimeField()
    zoho_org_id = models.CharField(max_length=32, db_index=True)
    reference_number = models.CharField(max_length=255, blank=True, null=True)
    inserted_in_qb = models.BooleanField(default=False, blank=True)
    items_unmatched = models.JSONField(default=list, blank=True)
    customer_unmatched = models.JSONField(default=list, blank=True)
    force_to_sync = models.BooleanField(default=False, blank=True)
    last_sync_date = models.DateField(default=timezone.now, blank=True, null=True)
    number_of_times_synced = models.IntegerField(default=0, blank=True)
    all_items_matched = models.BooleanField(default=False, blank=True)
    all_customer_matched = models.BooleanField(default=False, blank=True)

    qb_txn_id = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    qb_edit_sequence = models.CharField(max_length=20, blank=True, null=True)
    qb_inserted_at = models.DateTimeField(blank=True, null=True)
    last_qb_error = models.TextField(blank=True, null=True)
    sync_state = models.CharField(
        max_length=30,
        choices=SYNC_STATE_CHOICES,
        default=SYNC_STATE_PENDING,
        db_index=True,
    )


    def __str__(self):
        return f"{self.salesorder_number} - {self.customer_name}"
    
    def save(self, *args, **kwargs):
        if self.pk:  
            super(ZohoFullSalesOrder, self).save(*args, **kwargs)
        else:
            if not (
                ZohoFullSalesOrder.objects.filter(salesorder_id=self.salesorder_id).exists() or ZohoFullSalesOrder.objects.filter(salesorder_number=self.salesorder_number).exists()
                ):
                super(ZohoFullSalesOrder, self).save(*args, **kwargs)
            else:   
                logger.error(f"ZohoFullSalesOrder {self.salesorder_id} ({self.salesorder_number}) no guardado porque ya existe un objeto con el mismo salesorder_id")

    class Meta:
        verbose_name = "Zoho Full Sales Order"
        verbose_name_plural = "Zoho Full Sales Orders"
        indexes = [
            models.Index(fields=["date"]),
            models.Index(fields=["status"]),
            models.Index(fields=["customer_id"]),
        ]

