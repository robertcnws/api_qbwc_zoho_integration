# Generated by Django 5.0.6 on 2024-06-27 17:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_zoho_invoices', '0005_alter_zohofullinvoice_options'),
    ]

    operations = [
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='created_date',
            field=models.DateField(blank=True),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='created_time',
            field=models.DateTimeField(blank=True),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='last_modified_time',
            field=models.DateTimeField(blank=True),
        ),
    ]