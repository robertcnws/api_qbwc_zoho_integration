# your_app_name/migrations/0001_initial.py
from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='ZohoFullSalesOrder',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('salesorder_id', models.CharField(max_length=32, unique=True, db_index=True)),
                ('salesorder_number', models.CharField(max_length=64, db_index=True)),
                ('date', models.DateField()),
                ('status', models.CharField(max_length=64, db_index=True)),
                ('customer_id', models.CharField(max_length=32, db_index=True)),
                ('customer_name', models.CharField(max_length=255)),
                ('qb_customer_list_id', models.CharField(blank=True, null=True, max_length=100)),
                ('is_taxable', models.BooleanField(default=False)),
                ('tax_id', models.CharField(blank=True, null=True, max_length=32)),
                ('tax_name', models.CharField(blank=True, null=True, max_length=128)),
                ('tax_percentage', models.DecimalField(max_digits=6, decimal_places=2, default=0)),
                ('line_items', models.JSONField(default=list, blank=True)),
                ('currency_id', models.CharField(blank=True, null=True, max_length=32)),
                ('currency_code', models.CharField(max_length=8, default='USD')),
                ('currency_symbol', models.CharField(max_length=8, default='$')),
                ('exchange_rate', models.DecimalField(max_digits=12, decimal_places=6, default=1)),
                ('delivery_method', models.CharField(blank=True, null=True, max_length=128)),
                ('total_quantity', models.DecimalField(max_digits=12, decimal_places=3, default=0)),
                ('sub_total', models.DecimalField(max_digits=14, decimal_places=2, default=0)),
                ('tax_total', models.DecimalField(max_digits=14, decimal_places=2, default=0)),
                ('total', models.DecimalField(max_digits=14, decimal_places=2, default=0)),
                ('created_by_email', models.EmailField(blank=True, null=True, max_length=254)),
                ('created_by_name', models.CharField(blank=True, null=True, max_length=255)),
                ('salesperson_id', models.CharField(blank=True, null=True, max_length=32)),
                ('salesperson_name', models.CharField(blank=True, null=True, max_length=255)),
                ('is_test_order', models.BooleanField(default=False)),
                ('notes', models.TextField(blank=True, null=True)),
                ('payment_terms', models.IntegerField(default=0)),
                ('payment_terms_label', models.CharField(blank=True, null=True, max_length=128)),
                ('shipping_address', models.JSONField(default=dict, blank=True)),
                ('billing_address', models.JSONField(default=dict, blank=True)),
                ('custom_fields', models.JSONField(default=list, blank=True)),
                ('order_sub_statuses_raw', models.JSONField(default=list, blank=True)),
                ('shipment_sub_statuses', models.JSONField(default=list, blank=True)),
                ('created_time', models.DateTimeField()),
                ('last_modified_time', models.DateTimeField()),
                ('zoho_org_id', models.CharField(max_length=32, db_index=True)),
                ('reference_number', models.CharField(blank=True, null=True, max_length=255)),
                ('inserted_in_qb', models.BooleanField(default=False, blank=True)),
                ('items_unmatched', models.JSONField(default=list, blank=True)),
                ('customer_unmatched', models.JSONField(default=list, blank=True)),
                ('force_to_sync', models.BooleanField(default=False, blank=True)),
                ('last_sync_date', models.DateField(default=django.utils.timezone.now, blank=True, null=True)),
                ('number_of_times_synced', models.IntegerField(default=0, blank=True)),
                ('all_items_matched', models.BooleanField(default=False, blank=True)),
                ('all_customer_matched', models.BooleanField(default=False, blank=True)),
            ],
            options={
                'verbose_name': 'Zoho Full Sales Order',
                'verbose_name_plural': 'Zoho Full Sales Orders',
                'indexes': [
                    models.Index(fields=['date'], name='zfsorder_date_idx'),
                    models.Index(fields=['status'], name='zfsorder_status_idx'),
                    models.Index(fields=['customer_id'], name='zfsorder_customer_idx'),
                ],
            },
        ),
    ]
