from decimal import Decimal, InvalidOperation
from django.utils import timezone
from datetime import datetime, date

def nz_decimal(val, default="0"):
    # devuelve Decimal seguro
    if val in (None, "", " ", [], {}, False):
        return Decimal(default)
    try:
        return Decimal(str(val))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal(default)

def nz_int(val, default=0):
    if val in (None, "", " ", [], {}, False):
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        try:
            return int(float(val))
        except Exception:
            return default

def nz_str(val, default=""):
    if val is None:
        return default
    s = str(val).strip()
    return s if s else default

def nz_bool(val, default=False):
    if isinstance(val, bool):
        return val
    if val in (None, "", [], {}, "0", 0):
        return default
    # acepta "true"/"false", "yes"/"no", etc.
    return str(val).strip().lower() in {"1","true","t","yes","y","on"}

def nz_date(val, default=None):
    if isinstance(val, date) and not isinstance(val, datetime):
        return val
    if isinstance(val, datetime):
        return val.date()
    if not val:
        return default or timezone.now().date()
    s = str(val).strip()
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except Exception:
            pass
    # último intento: parsear ISO
    try:
        return datetime.fromisoformat(s).date()
    except Exception:
        return default or timezone.now().date()

def nz_datetime(val, default=None):
    if isinstance(val, datetime):
        return val if timezone.is_aware(val) else timezone.make_aware(val)
    if not val:
        return default or timezone.now()
    s = str(val).strip()
    try:
        dt = datetime.fromisoformat(s.replace("Z","+00:00"))
        return dt if timezone.is_aware(dt) else timezone.make_aware(dt)
    except Exception:
        return default or timezone.now()
