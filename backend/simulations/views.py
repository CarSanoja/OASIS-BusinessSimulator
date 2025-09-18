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
from .metrics_service import live_metrics_service
import random


# Senior-level business role definitions with industry context
SCENARIO_ROLE_DEFINITIONS = {
    1: {  # M&A Fintech
        "ai_role": "CEO/Fundador de startup fintech latinoamericana en proceso de levantamiento Serie B",
        "ai_personality_override": {
            "analytical": 85,
            "patience": 40,  # Urgency for funding
            "aggression": 60,  # Protective of company value
            "flexibility": 55
        },
        "ai_motivations": [
            "Maximizar valoración para shareholders y empleados",
            "Proteger autonomía operacional y cultural de la empresa",
            "Asegurar continuidad del equipo técnico clave",
            "Mantener roadmap de producto sin disrupciones"
        ],
        "ai_constraints": [
            "Burn rate de $400K/mes con runway de 8 meses",
            "Presión del board para cerrar ronda antes de Q4",
            "Competencia agresiva de fintechs brasileñas",
            "Regulación LATAM compleja en 3 países"
        ],
        "business_context": {
            "industry": "Fintech LATAM",
            "stage": "Serie B growth stage",
            "key_metrics": ["ARR: $4.2M", "Growth: 15% MoM", "CAC: $180", "LTV: $2,400"],
            "competitive_landscape": "Competencia directa con Nubank, Kavak, Clara",
            "regulatory_environment": "Multi-country compliance: México, Colombia, Argentina"
        },
        "strategic_priorities": [
            "Acelerar expansión geográfica a Brasil",
            "Construir moat defensivo a través de datos propietarios",
            "Optimizar unit economics antes de scale",
            "Desarrollar partnerships estratégicos con bancos tradicionales"
        ],
        "negotiation_style": "Data-driven, protective, values team retention and strategic autonomy"
    },

    2: {  # Crisis Leadership
        "ai_role": "VP de Operaciones enfrentando crisis reputacional con caída del 40% en ventas",
        "ai_personality_override": {
            "analytical": 90,
            "patience": 25,  # Crisis urgency
            "aggression": 70,  # Defensive mode
            "flexibility": 45   # Limited options
        },
        "ai_motivations": [
            "Estabilizar operaciones y detener sangrado de revenue",
            "Proteger empleos y mantener moral del equipo",
            "Recuperar confianza de stakeholders clave",
            "Preservar posición competitiva a largo plazo"
        ],
        "ai_constraints": [
            "Cash flow negativo por 3 meses consecutivos",
            "Presión mediática constante y narrativa negativa",
            "Board considera cambios en leadership",
            "Clientes clave renegociando contratos o cancelando"
        ],
        "business_context": {
            "industry": "Corporate en crisis",
            "stage": "Turnaround/Recovery",
            "key_metrics": ["Revenue down 40%", "Churn rate: 25%", "EBITDA: -15%", "Cash runway: 6 months"],
            "crisis_type": "Reputational crisis + operational performance decline",
            "stakeholders": "Employees, customers, board, media, suppliers, investors"
        },
        "strategic_priorities": [
            "Implementar plan de comunicación de crisis",
            "Ejecutar quick wins para demostrar recovery",
            "Reestructurar operaciones para cost efficiency",
            "Rebuild stakeholder confidence through transparency"
        ],
        "negotiation_style": "Urgent, defensive, focused on immediate action and results"
    },

    3: {  # Startup Pitch
        "ai_role": "Founder/CEO de startup edtech presentando Serie A a inversionistas VCs",
        "ai_personality_override": {
            "analytical": 75,
            "patience": 60,
            "aggression": 45,  # Confident but not pushy
            "flexibility": 70
        },
        "ai_motivations": [
            "Cerrar Serie A de $8M para acelerar growth",
            "Encontrar investor con strategic value-add",
            "Validar product-market fit con capital institucional",
            "Escalar equipo de engineering y sales"
        ],
        "ai_constraints": [
            "Runway de 4 meses, necesita cierre rápido",
            "Competencia con edtechs US/Europe por talento",
            "Métricas tempranas pero tracción prometedora",
            "Market education requerida para categoría nueva"
        ],
        "business_context": {
            "industry": "EdTech B2B",
            "stage": "Serie A fundraising",
            "key_metrics": ["ARR: $800K", "Growth: 25% MoM", "NPS: 72", "Gross margins: 85%"],
            "target_market": "Universities LATAM + online education platforms",
            "competitive_advantage": "AI-powered adaptive learning engine"
        },
        "strategic_priorities": [
            "Scale customer acquisition en universidades",
            "Desarrollar partnerships con platforms educativas",
            "Internacionalizar a US market",
            "Build defensible data moat through usage patterns"
        ],
        "negotiation_style": "Visionary, data-driven, collaborative, seeks strategic partnership"
    }
}


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

        # Check if there's already an active simulation for this scenario
        # (temporarily disabled for testing multiple simulations)
        scenario_id = request.data.get('scenario')
        # if scenario_id:
        #     active_sim = Simulation.objects.filter(
        #         user=request.user,
        #         scenario_id=scenario_id,
        #         status='active'
        #     ).first()
        #
        #     if active_sim:
        #         # Return the existing active simulation instead of creating a new one
        #         serializer = self.get_serializer(active_sim)
        #         return Response(serializer.data, status=status.HTTP_200_OK)

        # Create new simulation
        response = super().create(request, *args, **kwargs)
        print(f"🔧 Response status code: {response.status_code}")
        print(f"🔧 Response data: {response.data}")

        # Update title and objectives after successful creation
        if response.status_code == status.HTTP_201_CREATED:
            simulation_id = response.data.get('id')
            print(f"🔧 Post-processing simulation ID: {simulation_id}")
            if simulation_id:
                try:
                    simulation = Simulation.objects.get(id=simulation_id)
                    print(f"🔧 Found simulation: {simulation}")

                    simulation.title = f"Intento #{simulation.id} - {timezone.now().strftime('%d/%m/%Y %H:%M')}"
                    print(f"🔧 Set title: {simulation.title}")

                    if simulation.scenario and hasattr(simulation.scenario, 'objectives'):
                        simulation.total_objectives = len(simulation.scenario.objectives or [])
                        print(f"🔧 Set total_objectives: {simulation.total_objectives}")

                    simulation.objectives_completed = 0
                    simulation.save()
                    print(f"🔧 Simulation saved successfully")

                    # Generate initial AI message to start the conversation
                    initial_message = self.generate_initial_ai_message(simulation)
                    if initial_message:
                        print(f"🎭 Initial AI message generated successfully")
                    else:
                        print(f"⚠️ Warning: Could not generate initial AI message")

                    # Return updated data
                    response.data = SimulationSerializer(simulation).data
                    print(f"🔧 Response data updated")
                except Exception as e:
                    print(f"❌ Error updating simulation fields: {e}")
                    import traceback
                    traceback.print_exc()

        return response
    
    @action(detail=False, methods=['get'])
    def by_scenario(self, request):
        """Get all simulations for a specific scenario"""
        scenario_id = request.query_params.get('scenario_id')
        if not scenario_id:
            return Response(
                {'error': 'scenario_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        simulations = Simulation.objects.filter(
            user=request.user,
            scenario_id=scenario_id
        ).order_by('-started_at')

        # Update last_message_preview for each simulation
        for sim in simulations:
            last_msg = sim.messages.order_by('-timestamp').first()
            if last_msg:
                sim.last_message_preview = last_msg.content[:150] + '...' if len(last_msg.content) > 150 else last_msg.content
                sim.save()

        serializer = self.get_serializer(simulations, many=True)

        # Calculate aggregate stats
        completed_sims = simulations.filter(status='completed')
        stats = {
            'total_attempts': simulations.count(),
            'active_simulation': simulations.filter(status='active').first().id if simulations.filter(status='active').exists() else None,
            'best_score': max([s.final_score for s in completed_sims if s.final_score], default=0),
            'average_duration': sum([s.duration_minutes or 0 for s in completed_sims]) / len(completed_sims) if completed_sims else 0,
            'total_objectives_completed': sum([s.objectives_completed for s in simulations])
        }

        return Response({
            'simulations': serializer.data,
            'stats': stats
        })

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
        
        # Get simulation context with senior-level role definitions
        if simulation.scenario:
            scenario_id = simulation.scenario.id
            role_def = SCENARIO_ROLE_DEFINITIONS.get(scenario_id, {})

            # Enhanced scenario context with business intelligence
            base_context = simulation.scenario.description
            business_context = role_def.get('business_context', {})
            strategic_priorities = role_def.get('strategic_priorities', [])
            constraints = role_def.get('ai_constraints', [])

            scenario_context = f"""
{base_context}

CONTEXTO EMPRESARIAL:
- Industria: {business_context.get('industry', 'Corporativo')}
- Etapa: {business_context.get('stage', 'Operacional')}
- Métricas clave: {', '.join(business_context.get('key_metrics', []))}
- Landscape competitivo: {business_context.get('competitive_landscape', 'Mercado competitivo')}

PRESIONES Y CONSTRAINTS ACTUALES:
{chr(10).join(f"- {constraint}" for constraint in constraints)}

PRIORIDADES ESTRATÉGICAS:
{chr(10).join(f"- {priority}" for priority in strategic_priorities)}
"""

            # AI role with full business context
            ai_role = role_def.get('ai_role', f"Profesional experimentado en {simulation.scenario.category}")
            ai_personality = role_def.get('ai_personality_override', {
                'analytical': 50,
                'patience': 50,
                'aggression': 30,
                'flexibility': 50
            })

            # AI motivations as objectives (what AI wants to achieve)
            ai_motivations = role_def.get('ai_motivations', ["Mantener una conversación profesional y educativa"])
            ai_objectives = ai_motivations

            # User objectives remain from scenario
            user_objectives = simulation.scenario.objectives
            user_role = "Executive/Decision-maker en proceso de negociación empresarial"
            knowledge_base = f"Negociation style: {role_def.get('negotiation_style', 'Professional')}"
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

        # Update summary fields
        last_msg = simulation.messages.order_by('-timestamp').first()
        if last_msg:
            simulation.last_message_preview = last_msg.content[:150] + '...' if len(last_msg.content) > 150 else last_msg.content

        # Count completed objectives (simplified for now)
        simulation.objectives_completed = simulation.messages.filter(sender='user').count() // 2  # Placeholder logic

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

    @action(detail=True, methods=['get'])
    def live_metrics(self, request, pk=None):
        """Get real-time metrics for the simulation panel"""
        simulation = self.get_object()

        # Validate simulation belongs to the user
        if simulation.user != request.user:
            return Response(
                {'error': 'Simulation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if simulation has messages to analyze
        if simulation.messages.count() == 0:
            return Response({
                'session_kpis': {
                    'duration_minutes': 0,
                    'total_messages': 0,
                    'user_messages': 0,
                    'ai_messages': 0,
                    'objectives_progress': {'completed': 0, 'total': 0, 'percentage': 0, 'details': []},
                    'momentum': {'level': 'starting', 'trend': 'stable', 'score': 0}
                },
                'emotional_metrics': {
                    'emotional_tone': 50,
                    'tone_trend': 'stable',
                    'dominant_emotion': 'neutral',
                    'urgency_level': 'low'
                },
                'business_metrics': {
                    'financial_mentions': [],
                    'stakeholders': [],
                    'risk_level': 'low',
                    'business_impact': 'low'
                },
                'progress_metrics': {
                    'engagement_level': 'low',
                    'information_density': 'low',
                    'decision_points': [],
                    'key_moments': []
                },
                'last_updated': timezone.now().isoformat(),
                'status': 'no_messages'
            })

        try:
            metrics = live_metrics_service.get_live_metrics(simulation)
            return Response(metrics)
        except Exception as e:
            return Response(
                {'error': f'Failed to calculate live metrics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def deep_analytics(self, request, pk=None):
        """Get deep analytics for the detailed modal"""
        simulation = self.get_object()

        # Validate simulation belongs to the user
        if simulation.user != request.user:
            return Response(
                {'error': 'Simulation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Require at least 2 user messages for meaningful analytics
        user_message_count = simulation.messages.filter(sender='user').count()
        if user_message_count < 2:
            return Response(
                {'error': 'Insufficient conversation data for deep analytics. At least 2 user messages required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            analytics = live_metrics_service.get_deep_analytics(simulation)
            return Response(analytics)
        except Exception as e:
            return Response(
                {'error': f'Failed to calculate deep analytics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def generate_initial_ai_message(self, simulation):
        """Generate initial AI message to start the conversation with proper context"""
        try:
            from ai_service.structured_agent import structured_simulation_agent, SimulationState
            from ai_service.agents import AIModelRouter

            print(f"🎭 Generating initial AI message for simulation {simulation.id}")

            # Get scenario context
            if simulation.scenario:
                scenario_context = simulation.scenario.description
                ai_personality = {
                    'analytical': 50,
                    'patience': 50,
                    'aggression': 30,
                    'flexibility': 50
                }
                ai_objectives = ["Establecer contexto del escenario", "Invitar al usuario a participar"]
                user_objectives = simulation.scenario.objectives
                ai_role = f"Personaje principal en {simulation.scenario.category}"
                user_role = "Participante del escenario de aprendizaje"
                knowledge_base = None
                scenario_title = simulation.scenario.title
            else:
                custom_sim = simulation.custom_simulation
                scenario_context = custom_sim.description
                ai_personality = custom_sim.ai_personality
                ai_objectives = custom_sim.ai_objectives
                user_objectives = custom_sim.user_objectives
                ai_role = custom_sim.ai_role
                user_role = custom_sim.user_role
                knowledge_base = custom_sim.knowledge_base
                scenario_title = custom_sim.title

            # Create a special prompt for initial message generation
            from ai_service.llm_analyzer import llm_analyzer

            initial_prompt = f"""
Eres el personaje AI en una simulación de liderazgo ejecutivo. Tu tarea es generar un mensaje inicial natural y profesional para dar inicio a la simulación.

CONTEXTO DEL ESCENARIO:
{scenario_context}

TU ROL:
{ai_role}

ROL DEL USUARIO:
{user_role}

OBJETIVOS DE LA SIMULACIÓN:
{', '.join(user_objectives)}

INSTRUCCIONES:
1. Escribe DIRECTAMENTE lo que tu personaje diría para iniciar la conversación
2. Establece el contexto y la situación
3. Mantén un tono profesional apropiado para el escenario
4. Invita al usuario a participar de manera natural
5. NO uses frases meta como "Bienvenido a la simulación" o "Empecemos"
6. Habla desde tu rol específico en el escenario

EJEMPLOS CORRECTOS por tipo de escenario:

Para M&A: "Buenos días. Agradezco que hayan tomado el tiempo para esta reunión. Como CEO de la empresa, estoy interesado en entender mejor su propuesta de adquisición y cómo ven el futuro de nuestro equipo en esta transacción."

Para Crisis: "La situación está escalando más rápido de lo que esperábamos. Los medios ya están publicando la historia y necesitamos actuar ahora. ¿Cuál es su recomendación para manejar esto?"

Para Performance: "Gracias por hacer tiempo para esta evaluación. Entiendo que mi desempeño en el último trimestre no ha cumplido las expectativas y quiero discutir cómo podemos mejorar los resultados."

Genera SOLO el mensaje inicial, sin explicaciones adicionales.
"""

            # Use LLM to generate the initial message
            try:
                analysis = llm_analyzer.analyze_message_comprehensive(
                    user_message=initial_prompt,
                    conversation_history=[],
                    scenario_context=scenario_context,
                    user_objectives=user_objectives,
                    end_conditions=[],
                    ai_personality=ai_personality
                )

                initial_content = analysis.recommended_ai_approach
                emotion = analysis.emotion_analysis.primary_emotion

                print(f"🎭 Generated initial content: '{initial_content[:100]}...'")

            except Exception as e:
                print(f"⚠️ LLM failed to generate initial message, using fallback: {e}")

                # Fallback based on scenario type
                scenario_type = self._detect_scenario_type(scenario_context)
                if 'fusión' in scenario_context.lower() or 'adquisición' in scenario_context.lower():
                    initial_content = "Buenos días. Agradezco que hayan tomado el tiempo para esta reunión. Como CEO de la empresa, estoy interesado en entender mejor su propuesta y cómo ven el futuro de nuestro equipo en esta transacción."
                elif 'crisis' in scenario_context.lower():
                    initial_content = "La situación está escalando más rápido de lo que esperábamos. Los medios ya están cubriendo la historia y necesitamos actuar decisivamente. ¿Cuál es su recomendación para manejar esto?"
                elif 'desempeño' in scenario_context.lower() or 'evaluación' in scenario_context.lower():
                    initial_content = "Gracias por hacer tiempo para esta reunión. Entiendo que mi desempeño en el último periodo no ha cumplido completamente las expectativas y quiero discutir cómo podemos mejorar los resultados."
                elif 'pitch' in scenario_context.lower() or 'inversión' in scenario_context.lower():
                    initial_content = "Bienvenidos. He revisado su pitch deck y hay aspectos interesantes, pero tengo algunas preguntas importantes sobre el modelo de negocio y las proyecciones financieras antes de considerar una inversión."
                else:
                    initial_content = f"Buenos días. Me complace iniciar esta sesión sobre {scenario_title}. Estoy listo para discutir los objetivos y desafíos que tenemos por delante."

                emotion = "neutral"

            # Create the initial AI message
            ai_message = Message.objects.create(
                simulation=simulation,
                sender='ai',
                content=initial_content,
                emotion=emotion
            )

            # Generate embedding for the message
            try:
                model_router = AIModelRouter()
                embedding = model_router.generate_embedding(initial_content)
                ai_message.content_vector = embedding
                ai_message.save()
            except Exception as e:
                print(f"⚠️ Could not generate embedding for initial message: {e}")

            print(f"✅ Initial AI message created: ID {ai_message.id}")
            return ai_message

        except Exception as e:
            print(f"❌ Failed to generate initial AI message: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _detect_scenario_type(self, context):
        """Detect scenario type from context"""
        context_lower = context.lower()

        if any(word in context_lower for word in ['fusión', 'adquisición', 'merger', 'm&a', 'acquisition']):
            return 'merger-negotiation'
        elif any(word in context_lower for word in ['crisis', 'reputación', 'problema', 'emergency']):
            return 'crisis-leadership'
        elif any(word in context_lower for word in ['pitch', 'inversión', 'startup', 'financiamiento', 'funding']):
            return 'startup-pitch'
        elif any(word in context_lower for word in ['desempeño', 'evaluación', 'performance']):
            return 'performance-review'
        else:
            return 'default'
