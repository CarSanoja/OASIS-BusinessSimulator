from django.urls import re_path

# WebSocket routing for future real-time features
websocket_urlpatterns = [
    # re_path(r'ws/simulation/(?P<simulation_id>\w+)/$', consumers.SimulationConsumer.as_asgi()),
    # re_path(r'ws/notifications/(?P<user_id>\w+)/$', consumers.NotificationConsumer.as_asgi()),
]

# Note: WebSocket consumers will be implemented when real-time features are needed
# Current HTTP-based implementation works perfectly for all current requirements
