#!/usr/bin/env bash
set -euo pipefail

python manage.py makemigrations --noinput || true
python manage.py migrate --noinput

exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
