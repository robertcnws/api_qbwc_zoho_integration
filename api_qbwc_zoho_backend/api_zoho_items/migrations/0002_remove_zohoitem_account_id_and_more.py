# Generated by Django 5.0.6 on 2024-06-25 15:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_zoho_items', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='zohoitem',
            name='account_id',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='account_name',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='actual_available_stock',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='available_stock',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='cf_qb_ref_id',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='cf_qb_ref_id_unformatted',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='has_attachment',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='image_document_id',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='image_name',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='image_type',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='is_linked_with_zohocrm',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='item_type',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='product_type',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='purchase_account_id',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='purchase_account_name',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='purchase_description',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='purchase_rate',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='reorder_level',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='source',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='stock_on_hand',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='tax_id',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='tax_name',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='tax_percentage',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='unit',
        ),
        migrations.RemoveField(
            model_name='zohoitem',
            name='zcrm_product_id',
        ),
        migrations.AddField(
            model_name='zohoitem',
            name='qb_list_id',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
