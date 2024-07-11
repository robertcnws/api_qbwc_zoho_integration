from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

# Create your models here.
class AppConfig(models.Model):
    app_id = models.AutoField(primary_key=True)
    # Zoho API connection fields
    zoho_client_id = models.CharField(max_length=255, blank=True, null=True)
    zoho_client_secret = models.CharField(max_length=255, blank=True, null=True)
    zoho_org_id = models.CharField(max_length=255, blank=True, null=True)
    zoho_redirect_uri = models.CharField(max_length=255, blank=True, null=True)
    zoho_refresh_time = models.DurationField(blank=True, null=True)
    zoho_refresh_token = models.CharField(max_length=255, blank=True, null=True)
    zoho_access_token = models.CharField(max_length=255, blank=True, null=True)
    zoho_connection_configured = models.BooleanField(default=False)
    # QBWC fields
    qb_username = models.CharField(max_length=255, blank=True, null=True)
    qb_password = models.CharField(max_length=255, blank=True, null=True)
    qb_owner_id = models.CharField(max_length=255, blank=True, null=True)
    

    def save(self, *args, **kwargs):
        required_fields = [
            self.zoho_client_id,
            self.zoho_client_secret,
            self.zoho_org_id,
            self.zoho_redirect_uri,
        ]
        self.zoho_connection_configured = all(field is not None and field != "" for field in required_fields)
        if self.pk:
            return super(AppConfig, self).save(*args, **kwargs)
        else:
            if not AppConfig.objects.first():
                super(AppConfig, self).save(*args, **kwargs)
            else:
                raise Exception("App Configuration already exists")

    def __str__(self):
        return "App Configuration"

class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(username, password, **extra_fields)

class LoginUser(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.username
    
class ZohoLoading(models.Model):
    id = models.AutoField(primary_key=True, blank=True)
    zoho_module = models.CharField(max_length=255, blank=True)
    zoho_record_status = models.CharField(max_length=255, blank=True)
    zoho_record_message = models.TextField(blank=True)
    zoho_record_created = models.DateField(blank=True)
    zoho_record_updated = models.DateTimeField(blank=True)

    def __str__(self):
        return f"{self.zoho_module} - {self.zoho_record_updated} - {self.zoho_record_status}"
