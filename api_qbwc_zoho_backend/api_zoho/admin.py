from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import AppConfig, LoginUser

admin.site.register(LoginUser, UserAdmin)
admin.site.register(AppConfig)
