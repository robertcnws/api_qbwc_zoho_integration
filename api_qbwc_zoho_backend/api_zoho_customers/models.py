from django.db import models
import api_zoho.views as api_zoho_views 

import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class ZohoCustomer(models.Model):
    id = models.AutoField(primary_key=True)
    contact_id = models.CharField(max_length=50)
    contact_name = models.CharField(max_length=255)
    customer_name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    mobile = models.CharField(max_length=20, blank=True)
    created_time = models.DateTimeField()
    created_time_formatted = models.CharField(max_length=50)
    last_modified_time = models.DateTimeField()
    last_modified_time_formatted = models.CharField(max_length=50)
    qb_list_id = models.CharField(max_length=50, blank=True)
    
    
    def save(self, *args, **kwargs):
        if self.pk:
            return super(ZohoCustomer, self).save(*args, **kwargs)
        else:
            if not (ZohoCustomer.objects.filter(contact_id=self.contact_id).exists() or ZohoCustomer.objects.filter(email=self.email).exists()):
                super(ZohoCustomer, self).save(*args, **kwargs)
            else:
                logger.error(f"ZohoCustomer {self.contact_id} no guardado porque ya existe un objeto con el mismo contact_id o email")

    def __str__(self):
        return self.contact_name
