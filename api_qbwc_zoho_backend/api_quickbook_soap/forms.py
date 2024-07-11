from django import forms
from .models import QbItem

class QbItemForm(forms.ModelForm):
    class Meta:
        model = QbItem
        fields = ['list_id', 'name', 'matched']