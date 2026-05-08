from django.db import migrations, models


def backfill_sync_state(apps, schema_editor):
    ZohoFullInvoice = apps.get_model('api_zoho_invoices', 'ZohoFullInvoice')
    ZohoFullInvoice.objects.filter(inserted_in_qb=True).update(sync_state='confirmed')
    ZohoFullInvoice.objects.filter(inserted_in_qb=False).update(sync_state='pending')
    ZohoFullInvoice.objects.filter(inserted_in_qb__isnull=True).update(sync_state='pending')


def reverse_backfill(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api_zoho_invoices', '0015_alter_zohofullinvoice_adjustment_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='zohofullinvoice',
            name='qb_txn_id',
            field=models.CharField(blank=True, db_index=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='zohofullinvoice',
            name='qb_edit_sequence',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='zohofullinvoice',
            name='qb_inserted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='zohofullinvoice',
            name='last_qb_error',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='zohofullinvoice',
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
