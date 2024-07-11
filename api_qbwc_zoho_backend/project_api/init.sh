#!/bin/sh
set -e

# Ejecutar las migraciones
python manage.py makemigrations
python manage.py migrate

# # Crear el superusuario si no existe
# if [ $(python manage.py shell -c "from api_zoho.models import LoginUser; print(LoginUser.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').count())") -eq 0 ]; then
#     echo "Creating superuser..."
#     python manage.py createsuperuser --noinput --username $DJANGO_SUPERUSER_USERNAME --email $DJANGO_SUPERUSER_EMAIL
#     echo "Superuser created!"
# fi

# # Crear LoginUser si no existe
# if [ $(python manage.py shell -c "from api_zoho.models import LoginUser; print(LoginUser.objects.filter(username='$LOGINUSER_USERNAME').count())") -eq 0 ]; then
#     echo "Creating LoginUser..."
#     python manage.py shell -c "from api_zoho.models import LoginUser; LoginUser.objects.create_user(username='$LOGINUSER_USERNAME', email='$LOGINUSER_EMAIL', password='$LOGINUSER_PASSWORD')"
#     echo "LoginUser created!"
# fi

# Ejecutar Gunicorn
exec gunicorn --bind 0.0.0.0:8000 project_api.wsgi:application
