import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_api.settings')
django.setup()

from django.core.management import call_command
from api_zoho.models import LoginUser

def create_superuser():
    username = os.getenv('DJANGO_SUPERUSER_USERNAME')
    email = os.getenv('DJANGO_SUPERUSER_EMAIL')
    password = os.getenv('DJANGO_SUPERUSER_PASSWORD')
    
    super_user = LoginUser.objects.filter(username=username).first()

    if super_user is None:
        print("Creating superuser...")
        call_command('createsuperuser', '--noinput', '--username', username)
        user = LoginUser.objects.get(username=username)
        user.set_password(password)
        user.email = email
        user.save()
        print("Superuser created!")
    else:
        print("Superuser already exists.")
        print("Skipping superuser creation.")
        print("If you want to change the superuser password, please do it manually.")
        print("If you want to change the superuser email, please do it manually.")
        print("If you want to delete the superuser, please do it manually.")
        print("If you want to create a new superuser, please delete the existing one first.")
        print("If you want to create a new superuser with the same username, please delete the existing one first.")

def create_loginuser():
    username = os.getenv('LOGINUSER_USERNAME')
    email = os.getenv('LOGINUSER_EMAIL')
    password = os.getenv('LOGINUSER_PASSWORD')
    
    login_user = LoginUser.objects.filter(username=username).first()

    if login_user is None:
        print("Creating LoginUser...")
        LoginUser.objects.create_user(username=username, email=email, password=password, is_staff=True)
        print("LoginUser created!")
    else:
        print("LoginUser already exists.")
        print("Skipping LoginUser creation.")
        print("If you want to change the LoginUser password, please do it manually.")
        print("If you want to change the LoginUser email, please do it manually.")
        print("If you want to delete the LoginUser, please do it manually.")
        print("If you want to create a new LoginUser, please delete the existing one first.")
        print("If you want to create a new LoginUser with the same username, please delete the existing one first.")

if __name__ == "__main__":
    create_superuser()
    create_loginuser()
