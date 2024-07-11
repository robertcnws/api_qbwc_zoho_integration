from django.db import models

import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class QbItem(models.Model):
    id = models.AutoField(primary_key=True)
    list_id = models.CharField(max_length=50, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    matched = models.BooleanField(default=False)
    never_match = models.BooleanField(default=False)
    
    
    def save(self, *args, **kwargs):
        if self.pk:  
            super(QbItem, self).save(*args, **kwargs)
        else:
            if not (QbItem.objects.filter(list_id=self.list_id).exists() or QbItem.objects.filter(name=self.name).exists()):
                super(QbItem, self).save(*args, **kwargs)
            else:
                logger.error(f"QbItem {self.name} no guardado porque ya existe un objeto con el mismo list_id o name")

    def __str__(self):
        return self.name
    
class QbCustomer(models.Model):
    id = models.AutoField(primary_key=True)
    list_id = models.CharField(max_length=50, blank=True, null=True)   
    name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    matched = models.BooleanField(default=False)
    never_match = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if self.pk:  
            super(QbCustomer, self).save(*args, **kwargs)
        else:
            if not (
                QbCustomer.objects.filter(list_id=self.list_id).exists() or 
                QbCustomer.objects.filter(email=self.email).exists() or 
                QbCustomer.objects.filter(phone=self.phone).exists()
            ):
                super(QbCustomer, self).save(*args, **kwargs)
            else:
                logger.error(f"QbCustomer {self.name} no guardado porque ya existe un objeto con el mismo list_id, email o phone")

    def __str__(self):
        return self.name
    

class QbLoading(models.Model):
    id = models.AutoField(primary_key=True, blank=True)
    qb_module = models.CharField(max_length=255, blank=True)
    qb_record_status = models.CharField(max_length=255, blank=True)
    qb_record_message = models.TextField(blank=True)
    qb_record_created = models.DateField(blank=True)
    qb_record_updated = models.DateTimeField(blank=True)

    def __str__(self):
        return f"{self.qb_module} - {self.qb_record_updated} - {self.qb_record_status}"
