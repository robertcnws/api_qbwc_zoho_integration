from django.db import models
from django.utils import timezone

import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class ZohoFullInvoice(models.Model):
    id = models.AutoField(primary_key=True)
    invoice_id = models.CharField(max_length=100, blank=True)
    invoice_number = models.CharField(max_length=50, blank=True)
    date = models.DateField(blank=True)
    due_date = models.DateField(blank=True)
    customer_id = models.CharField(max_length=100, blank=True)
    customer_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    status = models.CharField(max_length=50, blank=True)
    recurring_invoice_id = models.CharField(max_length=100, blank=True)
    payment_terms = models.IntegerField(default=0, blank=True)
    payment_terms_label = models.CharField(max_length=100, blank=True)
    payment_reminder_enabled = models.BooleanField(default=False)
    payment_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, blank=True)
    credits_applied = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, blank=True)
    payment_made = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, blank=True)
    reference_number = models.CharField(max_length=50, blank=True)
    line_items = models.JSONField(default=list, blank=True)
    allow_partial_payments = models.BooleanField(default=False)
    price_precision = models.IntegerField(default=2, blank=True)
    sub_total = models.DecimalField(max_digits=10, decimal_places=2, blank=True)
    tax_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, blank=True)
    discount_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, blank=True)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.0, blank=True)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, blank=True)
    discount_applied_on_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, blank=True)
    discount_type = models.CharField(max_length=50, blank=True)
    tax_override_preference = models.CharField(max_length=50, blank=True)
    is_discount_before_tax = models.BooleanField(default=True)
    adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, blank=True)
    adjustment_description = models.CharField(max_length=255, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, blank=True)
    balance = models.DecimalField(max_digits=10, decimal_places=2, blank=True)
    is_inclusive_tax = models.BooleanField(default=False)
    sub_total_inclusive_of_tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, blank=True)
    contact_category = models.CharField(max_length=50, blank=True)
    tax_rounding = models.CharField(max_length=50, blank=True)
    taxes = models.JSONField(default=list, blank=True)
    tds_calculation_type = models.CharField(max_length=50, blank=True)
    last_payment_date = models.DateField(blank=True, null=True)
    contact_persons = models.JSONField(default=list, blank=True)
    salesorder_id = models.CharField(max_length=100, blank=True)
    salesorder_number = models.CharField(max_length=50, blank=True)
    salesorders = models.JSONField(default=list, blank=True)
    contact_persons_details = models.JSONField(default=list, blank=True)
    created_time = models.DateTimeField(blank=True)
    last_modified_time = models.DateTimeField(blank=True)
    created_date = models.DateField(blank=True)
    created_by_name = models.CharField(max_length=255, blank=True)
    estimate_id = models.CharField(max_length=100, blank=True)
    customer_default_billing_address = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    billing_address = models.JSONField(default=dict, blank=True)
    shipping_address = models.JSONField(default=dict, blank=True)
    contact = models.JSONField(default=dict, blank=True)
    inserted_in_qb = models.BooleanField(default=False, blank=True)
    items_unmatched = models.JSONField(default=list, blank=True)
    customer_unmatched = models.JSONField(default=list, blank=True)
    force_to_sync = models.BooleanField(default=False, blank=True)
    last_sync_date = models.DateField(default=timezone.now, blank=True, null=True)
    number_of_times_synced = models.IntegerField(default=0, blank=True)
    all_items_matched = models.BooleanField(default=False, blank=True)
    all_customer_matched = models.BooleanField(default=False, blank=True)
    qb_customer_list_id = models.CharField(max_length=100, blank=True, null=True)
    

    def __str__(self):
        return f"{self.invoice_number} - {self.customer_name}"
    
    def save(self, *args, **kwargs):
        if self.pk:  
            super(ZohoFullInvoice, self).save(*args, **kwargs)
        else:
            if not (
                ZohoFullInvoice.objects.filter(invoice_id=self.invoice_id).exists() or ZohoFullInvoice.objects.filter(invoice_number=self.invoice_number).exists()
                ):
                super(ZohoFullInvoice, self).save(*args, **kwargs)
            else:   
                logger.error(f"ZohoFullInvoice {self.invoice_id} ({self.invoice_number}) no guardado porque ya existe un objeto con el mismo invoice_id")

    class Meta:
        verbose_name = "Zoho Full Invoice"
        verbose_name_plural = "Zoho Full Invoices"

