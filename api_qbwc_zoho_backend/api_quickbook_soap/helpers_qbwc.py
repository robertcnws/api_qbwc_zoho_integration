# views_qbwc.py
import logging
from datetime import datetime, timezone, timedelta


from .models import QbLoading

logger = logging.getLogger(__name__)

BATCH_SIZE = 1000


# ---------- Helpers de Sync (mínimo cambio) ----------

def _get_last_sync_iso(query_object_name: str) -> str:
    module = 'customers' if query_object_name == 'Customer' else 'items'
    row = QbLoading.objects.filter(qb_module=module).order_by('-qb_record_updated', '-qb_record_created').first()
    base = None
    if row:
        base = row.qb_record_updated or row.qb_record_created
    if not base:
        base = datetime(2000, 1, 1, tzinfo=timezone.utc)
    dt = (base - timedelta(minutes=2)).astimezone(timezone.utc)
    return dt.strftime('%Y-%m-%dT%H:%M:%S%z')