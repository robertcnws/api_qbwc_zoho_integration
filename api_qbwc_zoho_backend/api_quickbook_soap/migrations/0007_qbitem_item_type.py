# Generated by Django 5.0.6 on 2024-07-26 15:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_quickbook_soap', '0006_qbloading'),
    ]

    operations = [
        migrations.AddField(
            model_name='qbitem',
            name='item_type',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]