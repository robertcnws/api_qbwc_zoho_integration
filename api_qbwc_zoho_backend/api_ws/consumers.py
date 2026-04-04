import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import logging

logger = logging.getLogger(__name__)


def get_jwt_user(token_key):
    try:
        from rest_framework_simplejwt.tokens import AccessToken
        from api_zoho.models import LoginUser
        token = AccessToken(token_key)
        return LoginUser.objects.get(id=token['user_id'])
    except Exception:
        return None


class BaseListConsumer(AsyncWebsocketConsumer):
    group_name = None

    async def connect(self):
        qs = dict(
            x.split('=') for x in self.scope['query_string'].decode().split('&') if '=' in x
        )
        token = qs.get('token', '')
        user = await database_sync_to_async(get_jwt_user)(token)
        if not user:
            await self.close()
            return
        self.user = user
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def list_update(self, event):
        """Receives group_send from views and forwards to the WebSocket client."""
        await self.send(text_data=json.dumps(event['data']))


class InvoicesConsumer(BaseListConsumer):
    group_name = 'invoices'


class SalesOrdersConsumer(BaseListConsumer):
    group_name = 'sales_orders'


class CustomersConsumer(BaseListConsumer):
    group_name = 'customers'


class QbwcItemsConsumer(BaseListConsumer):
    group_name = 'qbwc_items'


class QbwcCustomersConsumer(BaseListConsumer):
    group_name = 'qbwc_customers'


class ItemsConsumer(BaseListConsumer):
    group_name = 'items'
