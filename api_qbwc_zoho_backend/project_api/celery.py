# project_api/celery.py

from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# Establece el módulo de configuración para Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_api.settings')

app = Celery('project_api')

# Lee la configuración de Django
app.config_from_object('django.conf:settings', namespace='CELERY')

# Carga tareas de todos los módulos de la aplicación Django
app.autodiscover_tasks()
