from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from datetime import timedelta
from .models import Simulation, Message, SimulationAnalysis
from .serializers import (
    SimulationSerializer, 
    SimulationCreateSerializer, 
    MessageSerializer,
    SimulationAnalysisSerializer
)
from ai_service.agents import simulation_agent, SimulationState, AIModelRouter
from ai_service.structured_agent import structured_simulation_agent
from ai_service.conversation_memory import conversation_memory
import random


class SimulationViewSet(viewsets.ModelViewSet):
    serializer_class = SimulationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Simulation.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SimulationCreateSerializer
        return SimulationSerializer
    
    def create(self, request, *args, **kwargs):
        print(f"🔍 DEBUG: Received data: {request.data}")
        print(f"🔍 DEBUG: Data type: {type(request.data)}")
        return super().create(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get paginated messages for a simulation"""
        simulation = self.get_object()
        
        # Get pagination parameters
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        # Calculate offset for reverse pagination (newest first)
        total_messages = simulation.messages.count()
        offset = max(0, total_messages - (page * page_size))
        limit = page_size
        
        # Get messages in reverse chronological order (newest first)
        messages = simulation.messages.order_by('-timestamp')[offset:offset + limit]
        
        # Serialize messages
        serializer = MessageSerializer(messages, many=True)
        
        # Calculate pagination info
        has_next = offset > 0
        has_previous = (page * page_size) < total_messages
        
        return Response({
            'results': serializer.data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_messages': total_messages,
                'has_next': has_next,
                'has_previous': has_previous,
                'next_page': page + 1 if has_next else None,
                'previous_page': page - 1 if has_previous else None
            }
        })
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message in the simulation and get AI response"""
        simulation = self.get_object()
        
        if simulation.status != 'active':
            return Response(
                {'error': 'Simulation is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        content = request.data.get('content', '').strip()
        if not content:
            return Response(
                {'error': 'Message content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user message
        user_message = Message.objects.create(
            simulation=simulation,
            sender='user',
            content=content
        )
        
        # Generate embedding for the message
        try:
            model_router = AIModelRouter()
            embedding = model_router.generate_embedding(content)
            user_message.content_vector = embedding
            user_message.save()
        except Exception as e:
            # Continue without embedding if it fails
            pass
        
        # Prepare AI state
        messages = []
        for msg in simulation.messages.all().order_by('timestamp'):
            if msg.sender == 'user':
                messages.append(f"User: {msg.content}")
            else:
                messages.append(f"AI: {msg.content}")
        
        # Get simulation context
        if simulation.scenario:
            scenario_context = simulation.scenario.description
            ai_personality = {
                'analytical': 50,
                'patience': 50, 
                'aggression': 30,
                'flexibility': 50
            }
            ai_objectives = ["Mantener una conversación profesional y educativa"]
            user_objectives = simulation.scenario.objectives
            ai_role = f"Profesional experimentado en {simulation.scenario.category}"
            user_role = "Participante del escenario de aprendizaje"
            knowledge_base = None
        else:
            custom_sim = simulation.custom_simulation
            scenario_context = custom_sim.description
            ai_personality = custom_sim.ai_personality
            ai_objectives = custom_sim.ai_objectives
            user_objectives = custom_sim.user_objectives
            ai_role = custom_sim.ai_role
            user_role = custom_sim.user_role
            knowledge_base = custom_sim.knowledge_base
        
        state = SimulationState(
            messages=messages,
            scenario_context=scenario_context,
            user_role=user_role,
            ai_role=ai_role,
            ai_personality=ai_personality,
            ai_objectives=ai_objectives,
            user_objectives=user_objectives,
            knowledge_base=knowledge_base
        )
        
        try:
            # Get structured AI response with conversation memory
            result = structured_simulation_agent.process_message(state, simulation)
            
            # Store LLM analysis in user message
            try:
                # Extract LLM analysis data properly
                llm_data = result.get('llm_analysis')
                if hasattr(llm_data, 'key_points'):
                    # Direct Pydantic object
                    conversation_memory.store_message_insights(user_message, llm_data)
                else:
                    # Create analysis dict with extracted data
                    analysis_data = {
                        'key_points': result.get('key_points', []),
                        'financial_mentions': llm_data.key_points.financial_mentions if hasattr(llm_data, 'key_points') else [],
                        'strategic_concepts': llm_data.key_points.strategic_concepts if hasattr(llm_data, 'key_points') else [],
                        'stakeholders_mentioned': llm_data.key_points.stakeholders_mentioned if hasattr(llm_data, 'key_points') else [],
                        'business_impact': result.get('business_impact', 'medium'),
                        'urgency_level': llm_data.business_impact.urgency_level if hasattr(llm_data, 'business_impact') else 'medium',
                        'conversation_summary': llm_data.conversation_summary if hasattr(llm_data, 'conversation_summary') else ''
                    }
                    
                    conversation_memory.store_message_insights(user_message, analysis_data)
            except Exception as e:
                print(f"Error storing insights: {e}")
                # Try manual extraction as fallback
                try:
                    import re
                    content = user_message.content
                    financial_data = re.findall(r'\$\d+[KMB]?|Serie\s*[AB]|\d+K\s*usuarios|\d+%', content, re.IGNORECASE)
                    strategic_data = [word for word in ['plan', 'estrategia', 'expansión', 'crecimiento'] if word in content.lower()]
                    
                    user_message.financial_mentions = financial_data[:5]
                    user_message.strategic_concepts = strategic_data[:5]
                    user_message.business_impact_level = 'high' if financial_data else 'medium'
                    user_message.save()
                    
                    print(f"Manual extraction saved: {financial_data}, {strategic_data}")
                except Exception as e2:
                    print(f"Manual extraction also failed: {e2}")
            
            # Create AI message with enhanced data
            ai_message = Message.objects.create(
                simulation=simulation,
                sender='ai',
                content=result['response'],
                emotion=result.get('emotion', 'neutral')
            )
            
            # Generate embedding for AI message
            try:
                ai_embedding = model_router.generate_embedding(result['response'])
                ai_message.content_vector = ai_embedding
                ai_message.save()
            except Exception as e:
                pass
            
            return Response({
                'user_message': MessageSerializer(user_message).data,
                'ai_message': MessageSerializer(ai_message).data,
                'objective_progress': result.get('objective_progress', {}),
                'ai_metadata': {
                    'confidence_level': result.get('confidence_level', 5),
                    'key_points': result.get('key_points', []),
                    'business_impact': result.get('business_impact', 'medium'),
                    'suggested_follow_up': result.get('suggested_follow_up', '')
                }
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate AI response: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def end_simulation(self, request, pk=None):
        """End the simulation and generate analysis"""
        simulation = self.get_object()
        
        if simulation.status != 'active':
            return Response(
                {'error': 'Simulation is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update simulation status
        simulation.status = 'completed'
        simulation.ended_at = timezone.now()
        duration = simulation.ended_at - simulation.started_at
        simulation.duration_minutes = int(duration.total_seconds() / 60)
        simulation.save()
        
        # Generate analysis
        analysis = self._generate_analysis(simulation)
        
        return Response({
            'simulation': SimulationSerializer(simulation).data,
            'analysis': SimulationAnalysisSerializer(analysis).data
        })
    
    @action(detail=True, methods=['get'])
    def analysis(self, request, pk=None):
        """Get simulation analysis"""
        simulation = self.get_object()
        
        try:
            analysis = simulation.analysis
            return Response(SimulationAnalysisSerializer(analysis).data)
        except SimulationAnalysis.DoesNotExist:
            # Generate analysis if it doesn't exist
            if simulation.status == 'completed':
                analysis = self._generate_analysis(simulation)
                return Response(SimulationAnalysisSerializer(analysis).data)
            else:
                return Response(
                    {'error': 'Analysis not available for active simulations'},
                    status=status.HTTP_400_BAD_REQUEST
                )
    
    @action(detail=True, methods=['get'])
    def transcript(self, request, pk=None):
        """Get annotated transcript with LLM insights"""
        simulation = self.get_object()
        messages = simulation.messages.all().order_by('timestamp')
        
        transcript = []
        for i, message in enumerate(messages):
            transcript_entry = {
                'id': message.id,
                'sender': message.sender,
                'content': message.content,
                'timestamp': message.timestamp,
                'emotion': message.emotion
            }
            
            # Add LLM insights for user messages
            if message.sender == 'user' and message.llm_analysis:
                transcript_entry['llm_insights'] = {
                    'key_points': message.key_points,
                    'financial_mentions': message.financial_mentions,
                    'strategic_concepts': message.strategic_concepts,
                    'business_impact_level': message.business_impact_level,
                    'urgency_level': message.urgency_level,
                    'confidence_score': message.confidence_score
                }
            
            # Add coaching annotations
            if message.sender == 'user' and i % 2 == 0:
                transcript_entry['coaching_note'] = self._generate_coaching_note(message, i)
            
            transcript.append(transcript_entry)
        
        return Response({'transcript': transcript})
    
    @action(detail=True, methods=['get'])
    def insights(self, request, pk=None):
        """Get accumulated conversation insights"""
        simulation = self.get_object()
        
        try:
            insights = conversation_memory.get_conversation_context(simulation)
            return Response({'insights': insights})
        except Exception as e:
            return Response({'error': 'No insights available'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def search_insights(self, request, pk=None):
        """Semantic search through conversation insights"""
        simulation = self.get_object()
        query = request.data.get('query', '')
        
        if not query:
            return Response({'error': 'Query parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            search_results = conversation_memory.semantic_search_insights(simulation, query)
            return Response({'search_results': search_results})
        except Exception as e:
            return Response({'error': 'Search failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _generate_analysis(self, simulation):
        """Generate analysis for completed simulation"""
        messages = simulation.messages.all()
        user_messages = messages.filter(sender='user')
        
        # Calculate scores based on message characteristics
        message_count = len(user_messages)
        total_length = sum(len(msg.content) for msg in user_messages)
        avg_length = total_length / max(message_count, 1)
        
        # Base scores
        base_score = min(95, 60 + message_count * 2 + (avg_length / 10))
        
        overall_score = int(base_score + random.randint(-5, 10))
        strategic_score = int(base_score + random.randint(-10, 15))
        communication_score = int(base_score + random.randint(-8, 12))
        emotional_score = int(base_score + random.randint(-7, 8))
        
        # Generate analysis data
        analysis = SimulationAnalysis.objects.create(
            simulation=simulation,
            overall_score=overall_score,
            strategic_score=strategic_score,
            communication_score=communication_score,
            emotional_score=emotional_score,
            strengths=[
                'Excelente preparación con datos específicos',
                'Comunicación directa y profesional apropiada para nivel ejecutivo',
                'Buen entendimiento del contexto empresarial',
                'Demostró pensamiento estratégico de largo plazo',
                'Manejo efectivo de múltiples stakeholders'
            ],
            improvements=[
                'Podría ser más asertivo en momentos de alta presión',
                'Desarrollar mejor timing para concesiones estratégicas',
                'Mejorar uso de silencios como herramienta de negociación',
                'Incorporar más análisis de riesgo competitivo',
                'Fortalecer storytelling para buy-in emocional'
            ],
            recommendations=[
                'Estudiar casos Harvard sobre negociación en mercados emergentes',
                'Practicar técnicas avanzadas de anchoring en negociaciones complejas',
                'Desarrollar framework para crisis management communication',
                'Incorporar design thinking en estrategias de transformación',
                'Fortalecer competencias en cross-cultural leadership'
            ],
            key_moments=self._generate_key_moments(messages),
            tactics_used=[
                {'tactic': 'Data-driven persuasion', 'effectiveness': random.randint(70, 95)},
                {'tactic': 'Stakeholder mapping', 'effectiveness': random.randint(65, 90)},
                {'tactic': 'Risk assessment', 'effectiveness': random.randint(70, 90)},
                {'tactic': 'Strategic concessions', 'effectiveness': random.randint(60, 85)},
                {'tactic': 'Executive presence', 'effectiveness': random.randint(75, 95)}
            ]
        )
        
        return analysis
    
    def _generate_key_moments(self, messages):
        """Generate key moments from the conversation"""
        key_moments = []
        user_messages = [msg for msg in messages if msg.sender == 'user']
        
        if len(user_messages) >= 1:
            key_moments.append({
                'time': '5min',
                'message': user_messages[0].content[:50] + '...',
                'impact': 'positive',
                'analysis': 'Excelente apertura. Estableciste el tono apropiado y mostraste respeto por la contraparte.'
            })
        
        if len(user_messages) >= 2:
            key_moments.append({
                'time': f'{len(user_messages) * 2 + 3}min',
                'message': user_messages[len(user_messages)//2].content[:50] + '...',
                'impact': 'neutral',
                'analysis': 'Buena estrategia, pero podrías haber sido más específico con los números para generar más credibilidad.'
            })
        
        if len(user_messages) >= 3:
            key_moments.append({
                'time': f'{len(user_messages) * 3}min',
                'message': user_messages[-1].content[:50] + '...',
                'impact': 'positive',
                'analysis': 'Excelente cierre. Mantuviste la puerta abierta para futuras negociaciones.'
            })
        
        return key_moments
    
    def _generate_coaching_note(self, message, index):
        """Generate coaching note for user message"""
        coaching_notes = [
            "Excelente uso de preguntas abiertas para generar diálogo constructivo.",
            "Considera ser más específico con los números para aumentar credibilidad.",
            "Buen uso de storytelling para conectar emocionalmente.",
            "Podrías haber aprovechado mejor este momento para una concesión estratégica."
        ]
        
        return coaching_notes[index % len(coaching_notes)]
