# Generated by Django 5.0.6 on 2024-06-27 15:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_zoho_invoices', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='zohoinvoice',
            name='inserted_in_qb',
            field=models.BooleanField(default=False),
        ),
    ]