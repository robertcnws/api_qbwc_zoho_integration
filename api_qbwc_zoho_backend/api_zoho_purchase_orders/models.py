from django.db import models
from django.utils import timezone

import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class ZohoPurchaseOrder(models.Model):
    id = models.AutoField(primary_key=True)
    purchaseorder_id = models.CharField(max_length=64, unique=True, db_index=True)
    purchaseorder_number = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    reference_number = models.CharField(max_length=128, blank=True, null=True)
    status = models.CharField(max_length=32, blank=True, null=True, db_index=True)

    # ========= Vendor =========
    vendor_id = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    vendor_name = models.CharField(max_length=255, blank=True, null=True)

    # ========= Dates =========
    date = models.DateField(blank=True, null=True, db_index=True)
    expected_delivery_date = models.DateField(blank=True, null=True)
    delivery_date = models.DateField(blank=True, null=True)
    created_time = models.DateTimeField(blank=True, null=True, db_index=True)
    last_modified_time = models.DateTimeField(blank=True, null=True, db_index=True)

    # ========= Currency =========
    currency_id = models.CharField(max_length=64, blank=True, null=True)
    currency_code = models.CharField(max_length=16, blank=True, null=True)
    currency_symbol = models.CharField(max_length=8, blank=True, null=True)
    exchange_rate = models.FloatField(blank=True, null=True)

    # ========= Flags =========
    is_drop_shipment = models.BooleanField(blank=True, null=True)
    is_backorder = models.BooleanField(blank=True, null=True)
    can_send_in_mail = models.BooleanField(blank=True, null=True)
    is_pre_gst = models.BooleanField(blank=True, null=True)
    is_reverse_charge_applied = models.BooleanField(blank=True, null=True)

    # ========= Totals =========
    sub_total = models.FloatField(blank=True, null=True)
    tax_total = models.FloatField(blank=True, null=True)
    total = models.FloatField(blank=True, null=True)
    price_precision = models.IntegerField(blank=True, null=True)

    # ========= Relations =========
    salesorder_id = models.CharField(max_length=64, blank=True, null=True)
    pricebook_id = models.CharField(max_length=64, blank=True, null=True)
    ship_via = models.CharField(max_length=128, blank=True, null=True)
    ship_via_id = models.CharField(max_length=64, blank=True, null=True)

    # ========= GST =========
    gst_treatment = models.CharField(max_length=64, blank=True, null=True)
    gst_no = models.CharField(max_length=64, blank=True, null=True)
    source_of_supply = models.CharField(max_length=128, blank=True, null=True)
    destination_of_supply = models.CharField(max_length=128, blank=True, null=True)

    # ========= Misc =========
    notes = models.TextField(blank=True, null=True)
    terms = models.TextField(blank=True, null=True)
    attention = models.CharField(max_length=255, blank=True, null=True)
    attachment_name = models.CharField(max_length=255, blank=True, null=True)
    template_id = models.CharField(max_length=64, blank=True, null=True)
    template_name = models.CharField(max_length=255, blank=True, null=True)
    template_type = models.CharField(max_length=64, blank=True, null=True)
    
    # ========= Location =========
    location_id = models.CharField(max_length=64, blank=True, null=True)
    location_name = models.CharField(max_length=255, blank=True, null=True)

    # ========= Dynamic LISTS =========
    # In Postgres these should be JSONB so you can store "list of dicts" safely.
    contact_persons_associated = models.JSONField(blank=True, null=True, default=list)
    custom_fields = models.JSONField(blank=True, null=True, default=list)
    line_items = models.JSONField(blank=True, null=True, default=list)
    taxes = models.JSONField(blank=True, null=True, default=list)
    billing_address = models.JSONField(blank=True, null=True, default=list)
    delivery_address = models.JSONField(blank=True, null=True, default=list)
    purchasereceives = models.JSONField(blank=True, null=True, default=list)
    bills = models.JSONField(blank=True, null=True, default=list)
    
    # ========= Catch-all =========
    raw_payload = models.JSONField(blank=True, null=True, default=dict)

    zoho_org_id = models.CharField(max_length=32, blank=True, null=True, db_index=True)
    
    inserted_in_qb = models.BooleanField(default=False, blank=True)
    items_unmatched = models.JSONField(default=list, blank=True)
    customer_unmatched = models.JSONField(default=list, blank=True)
    force_to_sync = models.BooleanField(default=False, blank=True)
    last_sync_date = models.DateField(default=timezone.now, blank=True, null=True)
    number_of_times_synced = models.IntegerField(default=0, blank=True)
    all_items_matched = models.BooleanField(default=False, blank=True)
    all_customer_matched = models.BooleanField(default=False, blank=True)

    class Meta:
        db_table = "zoho_purchase_orders"
        indexes = [
            models.Index(fields=["purchaseorder_id"]),
            models.Index(fields=["purchaseorder_number"]),
            models.Index(fields=["vendor_id"]),
            models.Index(fields=["status"]),
            models.Index(fields=["zoho_org_id"]),
            models.Index(fields=["-created_time"]),
            models.Index(fields=["-date"]),
            models.Index(fields=["-last_modified_time"]),
        ]
        
    def __str__(self):
        return self.purchaseorder_number or self.purchaseorder_id
    
    def save(self, *args, **kwargs):
        if self.pk:  
            super(ZohoPurchaseOrder, self).save(*args, **kwargs)
        else:
            if not (
                ZohoPurchaseOrder.objects.filter(purchaseorder_id=self.purchaseorder_id).exists() or ZohoPurchaseOrder.objects.filter(purchaseorder_number=self.purchaseorder_number).exists()
                ):
                super(ZohoPurchaseOrder, self).save(*args, **kwargs)
            else:   
                logger.error(f"ZohoPurchaseOrder {self.purchaseorder_id} ({self.purchaseorder_number}) no guardado porque ya existe un objeto con el mismo purchaseorder_id")

