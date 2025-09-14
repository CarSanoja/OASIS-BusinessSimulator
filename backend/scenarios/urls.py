from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'scenarios', views.ScenarioViewSet)
router.register(r'custom-simulations', views.CustomSimulationViewSet, basename='customsimulation')

urlpatterns = [
    path('', include(router.urls)),
]
