"""
Django settings for project_api project.

Generated by 'django-admin startproject' using Django 5.0.6.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.0/ref/settings/
"""

from pathlib import Path
from celery.schedules import crontab
import environ
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-8=q+a0063s232#ebj-9l94lv8p+v4cb1%qh+-%su93w)4f@8w#'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

env = environ.Env(
    DEBUG=(bool, False)
)

# Lee el archivo .env
environ.Env.read_env()

# Configura las variables de entorno en settings.py
# DEBUG = env('DEBUG')
# SECRET_KEY = env('SECRET_KEY')

# Configuración adicional, por ejemplo:
# ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '10.1.10.216', '127.0.0.1'])

# ALLOWED_HOSTS = []
ALLOWED_HOSTS = ['localhost', '10.1.10.216', '127.0.0.1', 'host.docker.internal', 'integration.nws.com', 'api-integration-qbwc-zoho.nws.com']

# Env Vars
ENVIRONMENT = env('ENVIRONMENT')

ZOHO_SCOPE_INVOICES = env('ZOHO_SCOPE_INVOICES')
ZOHO_SCOPE_CUSTOMERS = env('ZOHO_SCOPE_CUSTOMERS')
ZOHO_SCOPE_ITEMS = env('ZOHO_SCOPE_ITEMS')
ZOHO_URL_READ_INVOICES = env('ZOHO_URL_READ_INVOICES')
ZOHO_URL_READ_CUSTOMERS = env('ZOHO_URL_READ_CUSTOMERS')
ZOHO_URL_READ_ITEMS = env('ZOHO_URL_READ_ITEMS')
ZOHO_TOKEN_URL = env('ZOHO_TOKEN_URL')
ZOHO_AUTH_URL = env('ZOHO_AUTH_URL')
SALES_TAX_LIST_ID = env('SALES_TAX_LIST_ID_DEV') if ENVIRONMENT == 'DEV' else env('SALES_TAX_LIST_ID_QA') if ENVIRONMENT == 'QA' else env('SALES_TAX_LIST_ID_PROD')
DB_NAME = env('DB_NAME_DEV') if ENVIRONMENT == 'DEV' else env('DB_NAME_QA') if ENVIRONMENT == 'QA' else env('DB_NAME_PROD')
DB_USER = env('DB_USER_DEV') if ENVIRONMENT == 'DEV' else env('DB_USER_QA') if ENVIRONMENT == 'QA' else env('DB_USER_PROD')
DB_PASSWORD = env('DB_PASSWORD_DEV') if ENVIRONMENT == 'DEV' else env('DB_PASSWORD_QA') if ENVIRONMENT == 'QA' else env('DB_PASSWORD_PROD')
DB_HOST = env('DB_HOST_DEV') if ENVIRONMENT == 'DEV' else env('DB_HOST_QA') if ENVIRONMENT == 'QA' else env('DB_HOST_PROD')
DB_PORT = env('DB_PORT')
DB_ENGINE = env('DB_ENGINE')
FRONTEND_URL = env('FRONTEND_URL_DEV') if ENVIRONMENT == 'DEV' else env('FRONTEND_URL_QA') if ENVIRONMENT == 'QA' else env('FRONTEND_URL_PROD')
SEEM_CUSTOMERS = env('SEEM_CUSTOMERS')
SEEM_ITEMS = env('SEEM_ITEMS')
ROUTE_TO_BACKUP_DB = env('ROUTE_TO_BACKUP_DB')
CONTAINER_NAME = env('CONTAINER_NAME')
PATH_FROM_BACKUP_DB = env('PATH_FROM_BACKUP_DB_DEV') if ENVIRONMENT == 'DEV' else env('PATH_FROM_BACKUP_DB_QA') if ENVIRONMENT == 'QA' else env('PATH_FROM_BACKUP_DB_PROD')
PATH_TO_BACKUP_DB = env('PATH_TO_BACKUP_DB')
TERMS = env('TERMS')
TEMPLATE_INVOICE_NAME = env('TEMPLATE_INVOICE_NAME_DEV') if ENVIRONMENT == 'DEV' else env('TEMPLATE_INVOICE_NAME_QA') if ENVIRONMENT == 'QA' else env('TEMPLATE_INVOICE_NAME_PROD')

# CELERY
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_BEAT_SCHEDULE = {
    'execute-load-invoices-periodic-task': {
        'task': 'api_zoho_invoices.tasks.load_invoices_periodic_task',
        # 'schedule': crontab(minute='*/1'), 
        'schedule': crontab(hour=8, minute=30)
    },
}

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://localhost:8000',
    'https://host.docker.internal',
    'https://integration.nws.com',
    'https://api-integration-qbwc-zoho.nws.com'
]

CSRF_COOKIE_SECURE = False  # False para desarrollo, True para producción

CSRF_COOKIE_NAME = 'csrftoken'

CSRF_COOKIE_HTTPONLY = False

CSRF_HEADER_NAME = 'HTTP_X_CSRFTOKEN'

CSRF_COOKIE_SAMESITE = 'None'

SESSION_COOKIE_SECURE = False  # False para desarrollo, True para producción

# CORS_ORIGIN_ALLOW_ALL = True  # Permitir todas las solicitudes de origen (para desarrollo)
# o para producción
# CORS_ORIGIN_WHITELIST = [
#     'http://localhost:3000',  # React frontend
# ]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://host.docker.internal",
    "https://integration.nws.com",
    "https://api-integration-qbwc-zoho.nws.com"
]

CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
]

CORS_ALLOW_HEADERS = [
    'Authorization',
    'Content-Type',
    'Accept',
    'x-requested-with',
    'accept',
    'origin',
    'user-agent',
    'dnt',
    'cache-control',
    'X-CSRFToken',
    'x-requested-with',
    'x-xsrf-token',
]

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'api_zoho',
    'api_zoho_customers',
    'api_zoho_items',
    'api_zoho_invoices',
    'api_quickbook_soap',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}


MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'project_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'project_api.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

DATABASES = {
    'default': {
        'ENGINE': f'{DB_ENGINE}',
        'NAME': f'{DB_NAME}',
        'USER': f'{DB_USER}',
        'PASSWORD': f'{DB_PASSWORD}',
        'HOST': f'{DB_HOST}',
        'PORT': f'{DB_PORT}',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

AUTHENTICATION_BACKENDS = ['api_zoho.auth_backends.LoginUserBackend', 'django.contrib.auth.backends.ModelBackend']
AUTH_USER_MODEL = 'api_zoho.LoginUser'


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'America/New_York'

USE_I18N = True

USE_TZ = True


## Static files (CSS, JavaScript, Images)
## https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = '/static/'
BASE_DIR_STATIC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKUP_DIR = os.path.join(BASE_DIR, 'backup')

MEDIA_URL = '/backup/'
MEDIA_ROOT = BACKUP_DIR

# print(BASE_DIR_STATIC)

# STATICFILES_DIRS = [
#     os.path.join(f'{BASE_DIR_STATIC}/project_api/', "static"),
# ]

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800  # 50 MB en bytes

