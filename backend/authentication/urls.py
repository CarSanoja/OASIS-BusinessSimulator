from django.urls import path, include
from . import views

urlpatterns = [
    path('', include('djoser.urls')),
    path('', include('djoser.urls.jwt')),
    path('demo-login/', views.demo_login, name='demo_login'),
    path('logout/', views.logout, name='logout'),
]
