# project/urls.py
from django.urls import path
from . import views

app_name = 'api_zoho_items'

urlpatterns = [
    path("list_items/", views.list_items, name="list_items"),
    path("load_items/", views.load_items, name="load_items"),
    path("view_item/<str:item_id>/", views.view_item, name="view_item"),
    path("match_one_item_ajax/", views.match_one_item_ajax, name="match_one_item_ajax"),
    path("unmatch_all_items_ajax/", views.unmatch_all_items_ajax, name="unmatch_all_items_ajax"),
]
