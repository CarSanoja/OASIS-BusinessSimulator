from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class NotificationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def list_notifications(self, request):
        """Get user notifications"""
        # Simplified notifications for demo
        notifications = [
            {
                'id': 1,
                'type': 'simulation_complete',
                'title': '¡Simulación Completada!',
                'message': 'Has completado la simulación de Crisis Leadership con una puntuación de 68/100.',
                'is_read': False,
                'created_at': '2025-09-14T16:54:58Z'
            },
            {
                'id': 2,
                'type': 'achievement',
                'title': 'Logro Desbloqueado',
                'message': 'Has alcanzado el nivel "Negociador Competente" en simulaciones de M&A.',
                'is_read': False,
                'created_at': '2025-09-14T16:20:30Z'
            },
            {
                'id': 3,
                'type': 'new_scenario',
                'title': 'Nuevo Escenario Disponible',
                'message': 'Se ha agregado un nuevo escenario: "Transformación Digital en PYMES".',
                'is_read': True,
                'created_at': '2025-09-14T10:00:00Z'
            }
        ]
        
        unread_count = len([n for n in notifications if not n['is_read']])
        
        return Response({
            'notifications': notifications,
            'unread_count': unread_count
        })
    
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        """Mark notification as read"""
        notification_id = request.data.get('notification_id')
        # In real implementation, would update database
        return Response({'message': 'Notification marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get unread notification count"""
        return Response({'unread_count': 2})
