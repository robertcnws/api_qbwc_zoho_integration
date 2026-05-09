from django.db import migrations, models


def backfill_sync_state(apps, schema_editor):
    ZohoFullSalesOrder = apps.get_model('api_zoho_sales_orders', 'ZohoFullSalesOrder')
    ZohoFullSalesOrder.objects.filter(inserted_in_qb=True).update(sync_state='confirmed')
    ZohoFullSalesOrder.objects.filter(inserted_in_qb=False).update(sync_state='pending')


def reverse_backfill(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api_zoho_sales_orders', '0002_rename_zfsorder_date_idx_api_zoho_sa_date_0f001e_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='zohofullsalesorder',
            name='qb_txn_id',
            field=models.CharField(blank=True, db_index=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='zohofullsalesorder',
            name='qb_edit_sequence',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='zohofullsalesorder',
            name='qb_inserted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='zohofullsalesorder',
            name='last_qb_error',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='zohofullsalesorder',
            name='sync_state',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('sent', 'Sent to QB (awaiting response)'),
                    ('confirmed', 'Confirmed in QB'),
                    ('failed', 'Failed in QB'),
                    ('skipped_duplicate', 'Skipped — already in QB'),
                ],
                db_index=True,
                default='pending',
                max_length=30,
            ),
        ),
        migrations.RunPython(backfill_sync_state, reverse_backfill),
    ]
