from django import forms
from .models import ZohoItem

class ZohoItemForm(forms.ModelForm):
    class Meta:
        model = ZohoItem
        fields = ['item_id', 'name', 'item_name', 'status', 'description', 'rate', 'sku', 'created_time', 'last_modified_time', 'qb_list_id']