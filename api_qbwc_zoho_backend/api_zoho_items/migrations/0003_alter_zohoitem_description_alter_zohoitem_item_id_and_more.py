# Generated by Django 5.0.6 on 2024-06-26 18:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_zoho_items', '0002_remove_zohoitem_account_id_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='zohoitem',
            name='description',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='zohoitem',
            name='item_id',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name='zohoitem',
            name='item_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='zohoitem',
            name='name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='zohoitem',
            name='qb_list_id',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name='zohoitem',
            name='rate',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='zohoitem',
            name='sku',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name='zohoitem',
            name='status',
            field=models.CharField(blank=True, max_length=20),
        ),
    ]