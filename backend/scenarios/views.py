from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Scenario, CustomSimulation
from .serializers import ScenarioSerializer, CustomSimulationSerializer, CustomSimulationCreateSerializer
from ai_service.agents import simulation_agent


class ScenarioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Scenario.objects.all()
    serializer_class = ScenarioSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Scenario.objects.all()
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category and category != 'all':
            queryset = queryset.filter(category=category)
        
        # Filter by difficulty
        difficulty = self.request.query_params.get('difficulty', None)
        if difficulty and difficulty != 'all':
            queryset = queryset.filter(difficulty=difficulty)
        
        # Search in title, description, and skills
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(skills__overlap=[search])
            )
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured scenarios"""
        featured_scenarios = Scenario.objects.filter(is_featured=True)
        serializer = self.get_serializer(featured_scenarios, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all available categories"""
        categories = Scenario.objects.values_list('category', flat=True).distinct()
        return Response(list(categories))


class CustomSimulationViewSet(viewsets.ModelViewSet):
    serializer_class = CustomSimulationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own simulations and published ones
        return CustomSimulation.objects.filter(
            Q(created_by=self.request.user) | Q(is_published=True)
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CustomSimulationCreateSerializer
        return CustomSimulationSerializer
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a custom simulation"""
        simulation = self.get_object()
        
        # Only the creator can publish
        if simulation.created_by != request.user:
            return Response(
                {'error': 'You can only publish your own simulations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        simulation.is_published = True
        simulation.save()
        
        serializer = self.get_serializer(simulation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test a custom simulation with a sample interaction"""
        simulation = self.get_object()
        
        # Only the creator can test
        if simulation.created_by != request.user:
            return Response(
                {'error': 'You can only test your own simulations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create a test state
        from ai_service.agents import SimulationState
        
        test_message = request.data.get('message', 'Hola, estoy listo para comenzar.')
        
        state = SimulationState(
            messages=[f"User: {test_message}"],
            scenario_context=simulation.description,
            user_role=simulation.user_role,
            ai_role=simulation.ai_role,
            ai_personality=simulation.ai_personality,
            ai_objectives=simulation.ai_objectives,
            user_objectives=simulation.user_objectives,
            knowledge_base=simulation.knowledge_base
        )
        
        try:
            result = simulation_agent.process_message(state)
            return Response({
                'response': result['response'],
                'emotion': result['emotion'],
                'status': 'success'
            })
        except Exception as e:
            return Response({
                'error': f'Test failed: {str(e)}',
                'status': 'error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
