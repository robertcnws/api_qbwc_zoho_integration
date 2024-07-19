from django.db import models

class ZohoItem(models.Model):
    id = models.AutoField(primary_key=True)
    item_id = models.CharField(max_length=50, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    item_name = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, null=True)
    sku = models.CharField(max_length=50, blank=True, null=True)
    created_time = models.DateTimeField()
    last_modified_time = models.DateTimeField()
    qb_list_id = models.CharField(max_length=50, blank=True, null=True)
    
    def save(self, *args, **kwargs):
        if self.pk:  # Si el objeto ya existe (tiene una clave primaria)
            # Permitir la actualización sin restricciones adicionales
            super(ZohoItem, self).save(*args, **kwargs)
        else:
            # Aplicar restricciones solo para la creación de nuevos objetos
            if not (
                ZohoItem.objects.filter(item_id=self.item_id).exists() or 
                (self.sku and ZohoItem.objects.filter(sku=self.sku).exists()) or 
                (self.qb_list_id and ZohoItem.objects.filter(qb_list_id=self.qb_list_id).exists())
            ) and self.status == 'active':
                super(ZohoItem, self).save(*args, **kwargs)
            else:
                print(f"ZohoItem {self.item_id} no guardado porque ya existe un objeto con el mismo item_id, sku, o qb_list_id, o el estado no es 'active'")

    def __str__(self):
        return self.name