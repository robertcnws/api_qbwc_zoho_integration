# Generated by Django 5.0.6 on 2024-06-28 13:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_zoho_invoices', '0006_alter_zohofullinvoice_created_date_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='adjustment',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='approvers_list',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='balance',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='bcy_adjustment',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='bcy_discount_total',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='bcy_shipping_charge',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='bcy_sub_total',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='bcy_tax_total',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='bcy_total',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='billing_address',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='computation_type',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='contact',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='contact_persons',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='contact_persons_details',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='created_by_id',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='created_by_name',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='credits_applied',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='currency_code',
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='currency_id',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='currency_name_formatted',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='currency_symbol',
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='current_sub_status',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='customer_default_billing_address',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='customer_id',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='customer_name',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='date',
            field=models.DateField(blank=True),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='deliverychallans',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='discount',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='discount_applied_on_amount',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='discount_percent',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=5),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='discount_total',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='discount_type',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='documents',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='due_date',
            field=models.DateField(blank=True),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='email',
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='exchange_rate',
            field=models.DecimalField(blank=True, decimal_places=2, default=1.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='inserted_in_qb',
            field=models.BooleanField(blank=True, default=False),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='invoice_id',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='invoice_number',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='invoice_source',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='invoice_url',
            field=models.URLField(blank=True),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='last_modified_by_id',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='line_items',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='lock_details',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='orientation',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='page_height',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='page_width',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='payment_discount',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='payment_made',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='payment_options',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='payment_terms',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='payment_terms_label',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='price_precision',
            field=models.IntegerField(blank=True, default=2),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='qr_code',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='reference_number',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='roundoff_value',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='sales_channel',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='salesorders',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='shipping_address',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='shipping_bills',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='shipping_charge',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='shipping_charge_exclusive_of_tax',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='shipping_charge_inclusive_of_tax',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='status',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='sub_statuses',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='sub_total',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='sub_total_inclusive_of_tax',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='tax_amount_withheld',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='tax_override_preference',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='tax_rounding',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='tax_total',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='taxes',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='tds_calculation_type',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='total',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='transaction_rounding_type',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='unused_retainer_payments',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohofullinvoice',
            name='write_off_amount',
            field=models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10),
        ),
    ]