from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import random


class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def user_progress(self, request):
        """Get comprehensive user progress data"""
        # Simplified response for now
        return Response({
            'total_simulations': 3,
            'average_score': 75,
            'total_duration_minutes': 45,
            'competency_scores': [
                {'competency': 'Negociación', 'current_score': 82, 'target_score': 90, 'sessions_count': 2},
                {'competency': 'Liderazgo', 'current_score': 75, 'target_score': 88, 'sessions_count': 1},
                {'competency': 'Comunicación', 'current_score': 88, 'target_score': 92, 'sessions_count': 3},
                {'competency': 'Estrategia', 'current_score': 70, 'target_score': 85, 'sessions_count': 1},
                {'competency': 'Crisis Management', 'current_score': 65, 'target_score': 80, 'sessions_count': 1},
                {'competency': 'Innovación', 'current_score': 78, 'target_score': 85, 'sessions_count': 2}
            ]
        })
    
    @action(detail=False, methods=['get'])
    def competencies(self, request):
        """Get detailed competency breakdown"""
        competencies = [
            {'competency': 'Negociación', 'current_score': 82, 'target_score': 90, 'sessions_count': 2},
            {'competency': 'Liderazgo', 'current_score': 75, 'target_score': 88, 'sessions_count': 1},
            {'competency': 'Comunicación', 'current_score': 88, 'target_score': 92, 'sessions_count': 3},
            {'competency': 'Estrategia', 'current_score': 70, 'target_score': 85, 'sessions_count': 1},
            {'competency': 'Crisis Management', 'current_score': 65, 'target_score': 80, 'sessions_count': 1},
            {'competency': 'Innovación', 'current_score': 78, 'target_score': 85, 'sessions_count': 2}
        ]
        
        radar_data = [
            {'subject': comp['competency'], 'current': comp['current_score'], 'target': comp['target_score']}
            for comp in competencies
        ]
        
        return Response({
            'competencies': competencies,
            'radar_data': radar_data
        })
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get simulation history with performance data"""
        # Simplified history data
        history_data = [
            {
                'id': 1,
                'title': 'Negociación de Fusión y Adquisición',
                'category': 'Estrategia Corporativa',
                'started_at': '2024-01-10T10:00:00Z',
                'duration_minutes': 28,
                'score': 87,
                'skills': ['Negociación estratégica', 'Análisis financiero']
            },
            {
                'id': 2,
                'title': 'Liderazgo en Crisis Corporativa', 
                'category': 'Liderazgo Ejecutivo',
                'started_at': '2024-01-08T14:30:00Z',
                'duration_minutes': 32,
                'score': 75,
                'skills': ['Liderazgo en crisis', 'Comunicación estratégica']
            },
            {
                'id': 3,
                'title': 'Pitch a Inversionistas',
                'category': 'Emprendimiento', 
                'started_at': '2024-01-05T16:15:00Z',
                'duration_minutes': 24,
                'score': 82,
                'skills': ['Storytelling', 'Presentación ejecutiva']
            }
        ]
        
        return Response({'history': history_data})
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get comprehensive analytics dashboard data"""
        return Response({
            'progress_over_time': [
                {'month': 'Oct', 'score': 65},
                {'month': 'Nov', 'score': 72}, 
                {'month': 'Dic', 'score': 78},
                {'month': 'Ene', 'score': 82}
            ],
            'category_distribution': [
                {'category': 'Estrategia Corporativa', 'percentage': 45, 'duration': 67},
                {'category': 'Liderazgo Ejecutivo', 'percentage': 30, 'duration': 45},
                {'category': 'Emprendimiento', 'percentage': 25, 'duration': 38}
            ],
            'key_metrics': {
                'total_simulations': 3,
                'average_score': 78,
                'improvement_trend': 17,
                'total_duration': 150
            }
        })
    
    @action(detail=False, methods=['get'])
    def learning_paths(self, request):
        """Get personalized learning path recommendations"""
        learning_paths = [
            {
                'id': 'crisis-leadership',
                'title': 'Maestría en Gestión de Crisis',
                'description': 'Fortalece tus habilidades para liderar en situaciones de alta presión y incertidumbre.',
                'priority': 'alta',
                'estimated_time': '3-4 sesiones',
                'scenarios': ['crisis-leadership', 'team-performance', 'board-strategic-planning']
            },
            {
                'id': 'strategic-thinking', 
                'title': 'Pensamiento Estratégico Avanzado',
                'description': 'Desarrolla tu capacidad de análisis y planificación estratégica a largo plazo.',
                'priority': 'media',
                'estimated_time': '4-5 sesiones',
                'scenarios': ['international-expansion', 'merger-negotiation', 'board-strategic-planning']
            },
            {
                'id': 'executive-presence',
                'title': 'Presencia Ejecutiva y Comunicación', 
                'description': 'Perfecciona tu comunicación y presencia en entornos de alta dirección.',
                'priority': 'baja',
                'estimated_time': '2-3 sesiones',
                'scenarios': ['startup-pitch', 'team-performance']
            }
        ]
        
        return Response({'learning_paths': learning_paths})
