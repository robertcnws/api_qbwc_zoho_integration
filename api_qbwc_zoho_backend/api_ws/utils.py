from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def notify_group(group_name, data):
    """Send data to all WebSocket clients in a group. Call from any Django view after a mutation."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        group_name,
        {'type': 'list_update', 'data': data}
    )
