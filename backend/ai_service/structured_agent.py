import os
from typing import Dict, List, Any, Optional, Literal
from pydantic import BaseModel, Field
from dataclasses import dataclass
from .llm_analyzer import llm_analyzer, ComprehensiveMessageAnalysis
from .conversation_memory import conversation_memory


class AIResponse(BaseModel):
    """Structured AI response model"""
    content: str = Field(description="The main response content in Spanish")
    emotion: Literal["positive", "neutral", "skeptical", "concerned", "encouraging"] = Field(
        description="The emotional tone of the response"
    )
    confidence_level: int = Field(
        ge=1, le=10, 
        description="AI confidence in the response (1-10 scale)"
    )
    suggested_follow_up: Optional[str] = Field(
        None,
        description="Suggested follow-up question or topic"
    )
    key_points: List[str] = Field(
        description="Key points mentioned in the response"
    )
    business_impact: Literal["low", "medium", "high", "critical"] = Field(
        description="Business impact level of the topic discussed"
    )


class ObjectiveProgress(BaseModel):
    """Objective progress tracking"""
    objective_id: str = Field(description="The objective being tracked")
    progress_percentage: int = Field(ge=0, le=100, description="Progress percentage")
    is_completed: bool = Field(description="Whether the objective is completed")
    reasoning: str = Field(description="Why this progress was assigned")


class SimulationAnalysis(BaseModel):
    """Simulation performance analysis"""
    overall_score: int = Field(ge=0, le=100, description="Overall performance score")
    strategic_thinking: int = Field(ge=0, le=100, description="Strategic thinking score")
    communication_skills: int = Field(ge=0, le=100, description="Communication skills score")
    negotiation_effectiveness: int = Field(ge=0, le=100, description="Negotiation effectiveness")
    emotional_intelligence: int = Field(ge=0, le=100, description="Emotional intelligence score")
    
    strengths: List[str] = Field(description="Identified strengths")
    improvement_areas: List[str] = Field(description="Areas for improvement")
    specific_recommendations: List[str] = Field(description="Specific actionable recommendations")
    
    key_decision_moments: List[Dict[str, Any]] = Field(
        description="Critical decision moments in the simulation"
    )


@dataclass
class SimulationState:
    messages: List[str]
    scenario_context: str
    user_role: str
    ai_role: str
    ai_personality: Dict[str, int]
    ai_objectives: List[str]
    user_objectives: List[str]
    knowledge_base: Optional[str] = None
    current_emotion: str = "neutral"
    objective_progress: Dict[str, bool] = None


class StructuredAIService:
    """Enhanced AI service with structured outputs"""
    
    def __init__(self):
        self.response_templates = {
            'merger-negotiation': [
                {
                    "content": "Buenos días. Aprecio su interés en nuestra empresa. Sin embargo, antes de discutir valoraciones, necesito entender su visión estratégica para la integración. ¿Cómo planean mantener nuestra cultura de innovación y velocidad de desarrollo?",
                    "emotion": "neutral",
                    "confidence_level": 8,
                    "key_points": ["visión estratégica", "cultura de innovación", "velocidad de desarrollo"],
                    "business_impact": "high"
                },
                {
                    "content": "Entiendo su propuesta, pero los múltiplos que mencionan están por debajo del mercado. Empresas similares en LATAM se han vendido a 8-10x revenue. Tenemos métricas sólidas: 2.3M usuarios activos, crecimiento 30% trimestral. ¿Han considerado el valor estratégico de nuestra base de datos?",
                    "emotion": "skeptical", 
                    "confidence_level": 9,
                    "key_points": ["múltiplos de mercado", "métricas de crecimiento", "valor estratégico"],
                    "business_impact": "critical"
                },
                {
                    "content": "Me gusta su enfoque colaborativo. Pero tengo preocupaciones específicas sobre retención de talento. Mi equipo de blockchain está recibiendo ofertas de Big Tech. Si perdemos estos desarrolladores clave, la integración será un desastre. ¿Qué paquete de retención proponen?",
                    "emotion": "concerned",
                    "confidence_level": 7,
                    "key_points": ["retención de talento", "equipo blockchain", "paquete de retención"],
                    "business_impact": "critical"
                },
                {
                    "content": "Excelente. Los contratos de retención suenan razonables. Ahora sobre governance: necesito mantener autonomía operacional por 18 meses. También es crucial respetar nuestra cultura startup. ¿Cómo manejarán la integración con sus procesos corporativos?",
                    "emotion": "encouraging",
                    "confidence_level": 8,
                    "key_points": ["autonomía operacional", "cultura startup", "procesos corporativos"],
                    "business_impact": "high"
                }
            ],
            'crisis-leadership': [
                {
                    "content": "CEO, la situación está escalando rápidamente. Los medios están pidiendo declaraciones y nuestros stakeholders principales están preocupados. Tenemos 2 horas antes de la reunión de emergencia con la Junta. ¿Cuál es nuestra estrategia de comunicación inmediata?",
                    "emotion": "concerned",
                    "confidence_level": 9,
                    "key_points": ["escalación rápida", "medios", "stakeholders", "estrategia de comunicación"],
                    "business_impact": "critical"
                },
                {
                    "content": "Entiendo la necesidad de transparencia, pero debemos ser estratégicos. Nuestros competidores van a capitalizar esto. Ya vi movimientos en redes sociales. ¿Cómo vamos a counter-narrativar? ¿Y qué hacemos con los clientes enterprise que tienen contratos de $50M en riesgo?",
                    "emotion": "skeptical",
                    "confidence_level": 8,
                    "key_points": ["transparencia estratégica", "competidores", "clientes enterprise"],
                    "business_impact": "critical"
                },
                {
                    "content": "Buena estrategia de comunicación proactiva. Pero la junta está nerviosa. El Chairman pregunta si necesitamos consultoría externa, tal vez McKinsey para el recovery plan. ¿Cómo manejo esa conversación sin que parezca que estamos despidiendo gente en crisis?",
                    "emotion": "neutral",
                    "confidence_level": 7,
                    "key_points": ["junta nerviosa", "consultoría externa", "recovery plan"],
                    "business_impact": "high"
                },
                {
                    "content": "Sólido plan. Ya convoqué al equipo de comunicaciones. Una última preocupación: dos clientes enterprise pidieron reuniones 'urgentes'. Claramente van a renegociar términos o cancelar. ¿Cómo manejo estas conversaciones sin comprometer más revenue?",
                    "emotion": "encouraging",
                    "confidence_level": 8,
                    "key_points": ["equipo de comunicaciones", "clientes enterprise", "renegociación"],
                    "business_impact": "critical"
                }
            ],
            'startup-pitch': [
                {
                    "content": "Bienvenidos a nuestro fund. Hemos revisado su deck y EduTech Solutions nos interesa. Pero hemos visto muchos 'Netflix de la educación'. ¿Qué hace realmente diferente a su plataforma? Y más importante: veo $180K ARR con 50K usuarios. Eso es $3.60 por usuario anual. ¿Cómo llegan a unit economics rentables?",
                    "emotion": "skeptical",
                    "confidence_level": 9,
                    "key_points": ["diferenciación", "unit economics", "rentabilidad"],
                    "business_impact": "critical"
                },
                {
                    "content": "Interesante el modelo B2B2B con universidades. Pero LATAM es complicado - hemos visto startups quebrar por payments y regulación. ¿Cómo manejan las diferencias entre México (más maduro) y mercados como Colombia? Necesito ver más tracción antes de $5M.",
                    "emotion": "concerned",
                    "confidence_level": 7,
                    "key_points": ["modelo B2B2B", "LATAM challenges", "tracción"],
                    "business_impact": "high"
                },
                {
                    "content": "Me gusta la tracción con ITESM y Universidad de los Andes. Logos fuertes. Pero $20M pre-money parece alto para su etapa. Valoraciones han caído 40% este año. ¿Estarían abiertos a $15M pre-money? Y necesito clarity: ¿cuándo necesitarán Serie B?",
                    "emotion": "neutral",
                    "confidence_level": 8,
                    "key_points": ["tracción universitaria", "valoración", "Serie B timeline"],
                    "business_impact": "critical"
                },
                {
                    "content": "Razonable roadmap de 18 meses. Última pregunta antes de partners: ¿cuál es su strategy si OpenAI o Google lanzan algo similar gratis? La defensibilidad es clave en edtech. ¿Su moat está en contenido, datos de estudiantes, o relaciones universitarias?",
                    "emotion": "encouraging",
                    "confidence_level": 9,
                    "key_points": ["roadmap", "defensibilidad", "moat estratégico"],
                    "business_impact": "critical"
                }
            ]
        }
    
    def generate_structured_response(self, state: SimulationState) -> AIResponse:
        """Generate a structured response based on the scenario and conversation"""
        scenario_id = self._detect_scenario_type(state.scenario_context)
        templates = self.response_templates.get(scenario_id, [])
        
        if not templates:
            # Default structured response
            return AIResponse(
                content="Entiendo su punto de vista. ¿Podría elaborar más sobre los aspectos específicos que considera más importantes?",
                emotion="neutral",
                confidence_level=6,
                key_points=["comprensión", "elaboración", "aspectos específicos"],
                business_impact="medium"
            )
        
        # Get conversation context
        message_count = len([msg for msg in state.messages if msg.startswith('User:')])
        template_index = min(message_count - 1, len(templates) - 1)
        template = templates[template_index]
        
        # Create structured response
        response = AIResponse(
            content=template["content"],
            emotion=template["emotion"],
            confidence_level=template["confidence_level"],
            key_points=template["key_points"],
            business_impact=template["business_impact"]
        )
        
        # Enhance response based on AI personality
        response = self._enhance_with_personality(response, state.ai_personality)
        
        # Add suggested follow-up based on context
        response.suggested_follow_up = self._generate_follow_up(state, response)
        
        return response
    
    def _enhance_with_personality(self, response: AIResponse, personality: Dict[str, int]) -> AIResponse:
        """Enhance response based on AI personality traits"""
        analytical = personality.get('analytical', 50)
        patience = personality.get('patience', 50)
        aggression = personality.get('aggression', 30)
        flexibility = personality.get('flexibility', 50)
        
        # Analytical enhancement
        if analytical > 70:
            if 'datos' not in response.content.lower() and 'métricas' not in response.content.lower():
                response.content += " Necesito ver datos específicos y métricas concretas para evaluar esta propuesta adecuadamente."
                response.key_points.append("datos específicos requeridos")
        
        # Patience modification
        if patience < 30:
            response.content += " Necesito una respuesta rápida y decisiva."
            response.confidence_level = min(10, response.confidence_level + 1)
        
        # Aggression modification
        if aggression > 70:
            response.content = response.content.replace('Interesante', 'Francamente')
            response.content = response.content.replace('Me gusta', 'No estoy completamente convencido de')
            if response.emotion == "neutral":
                response.emotion = "skeptical"
        
        # Flexibility modification
        if flexibility < 30:
            response.content += " Mi posición en este tema es firme y basada en experiencia previa."
            response.confidence_level = min(10, response.confidence_level + 1)
        
        return response
    
    def _generate_follow_up(self, state: SimulationState, response: AIResponse) -> str:
        """Generate a suggested follow-up question"""
        if response.business_impact == "critical":
            return "¿Cómo propone mitigar los riesgos principales que hemos identificado?"
        elif response.business_impact == "high":
            return "¿Cuáles son los próximos pasos concretos que sugiere?"
        else:
            return "¿Hay algún aspecto adicional que debamos considerar?"
    
    def _detect_scenario_type(self, context: str) -> str:
        """Detect scenario type based on context keywords"""
        context_lower = context.lower()
        
        if any(word in context_lower for word in ['fusión', 'adquisición', 'merger', 'm&a', 'acquisition']):
            return 'merger-negotiation'
        elif any(word in context_lower for word in ['crisis', 'reputación', 'problema', 'emergency']):
            return 'crisis-leadership'
        elif any(word in context_lower for word in ['pitch', 'inversión', 'startup', 'financiamiento', 'funding']):
            return 'startup-pitch'
        else:
            return 'default'
    
    def analyze_objectives(self, state: SimulationState, user_message: str) -> List[ObjectiveProgress]:
        """Analyze objective progress based on conversation"""
        progress_list = []
        
        user_message_lower = user_message.lower()
        
        for i, objective in enumerate(state.user_objectives):
            # Simple keyword matching for progress
            progress_percentage = 0
            is_completed = False
            reasoning = "Objetivo en progreso"
            
            # Check for completion keywords
            if any(word in user_message_lower for word in ['acepto', 'acuerdo', 'aprobado', 'sí', 'perfecto']):
                progress_percentage = 85
                is_completed = True
                reasoning = "Usuario mostró aceptación o acuerdo"
            elif any(word in user_message_lower for word in ['considero', 'propongo', 'sugiero', 'plan']):
                progress_percentage = 60
                reasoning = "Usuario presentó propuesta o plan"
            elif any(word in user_message_lower for word in ['entiendo', 'comprendo', 'veo']):
                progress_percentage = 30
                reasoning = "Usuario mostró comprensión del tema"
            
            progress_list.append(ObjectiveProgress(
                objective_id=f"obj_{i}",
                progress_percentage=progress_percentage,
                is_completed=is_completed,
                reasoning=reasoning
            ))
        
        return progress_list
    
    def generate_simulation_analysis(self, messages: List[str], duration_minutes: int) -> SimulationAnalysis:
        """Generate structured simulation analysis"""
        user_messages = [msg for msg in messages if msg.startswith('User:')]
        message_count = len(user_messages)
        
        # Calculate scores based on message characteristics
        total_length = sum(len(msg) for msg in user_messages)
        avg_length = total_length / max(message_count, 1)
        
        # Base scoring algorithm
        base_score = min(95, 60 + message_count * 3 + (avg_length / 20))
        
        # Generate component scores
        overall_score = int(base_score + (hash(str(messages)) % 20) - 10)
        strategic_thinking = int(base_score + (hash(str(messages)) % 15) - 7)
        communication_skills = int(base_score + (hash(str(messages)) % 12) - 6)
        negotiation_effectiveness = int(base_score + (hash(str(messages)) % 18) - 9)
        emotional_intelligence = int(base_score + (hash(str(messages)) % 10) - 5)
        
        # Ensure scores are within bounds
        scores = [overall_score, strategic_thinking, communication_skills, negotiation_effectiveness, emotional_intelligence]
        scores = [max(0, min(100, score)) for score in scores]
        
        # Generate key decision moments
        key_moments = []
        for i, msg in enumerate(user_messages[:3]):  # Analyze first 3 user messages
            key_moments.append({
                "timestamp": f"{(i + 1) * 5}min",
                "message": msg[5:60] + "..." if len(msg) > 65 else msg[5:],  # Remove 'User:' prefix
                "impact_level": "high" if i == 0 else "medium",
                "analysis": f"Momento decisivo {i + 1}: Estrategia {'efectiva' if scores[0] > 70 else 'mejorable'}"
            })
        
        return SimulationAnalysis(
            overall_score=scores[0],
            strategic_thinking=scores[1], 
            communication_skills=scores[2],
            negotiation_effectiveness=scores[3],
            emotional_intelligence=scores[4],
            strengths=[
                "Preparación sólida con contexto empresarial apropiado",
                "Comunicación directa y profesional para nivel ejecutivo",
                "Comprensión del contexto y stakeholders involucrados",
                "Enfoque estratégico en las respuestas",
                "Manejo apropiado del timing en la conversación"
            ],
            improvement_areas=[
                "Ser más específico con métricas y datos cuantitativos",
                "Desarrollar mejor uso de silencios estratégicos",
                "Incorporar más análisis de riesgo en las propuestas",
                "Fortalecer storytelling para conexión emocional",
                "Mejorar timing para concesiones y compromisos"
            ],
            specific_recommendations=[
                "Estudiar casos Harvard sobre negociación en mercados emergentes",
                "Practicar técnicas de anchoring en negociaciones de alto valor",
                "Desarrollar framework personal para comunicación en crisis",
                "Incorporar design thinking en estrategias de transformación",
                "Fortalecer competencias en liderazgo cross-cultural"
            ],
            key_decision_moments=key_moments
        )


class StructuredSimulationAgent:
    """Enhanced simulation agent with structured outputs"""
    
    def __init__(self):
        self.ai_service = StructuredAIService()
    
    def process_message(self, state: SimulationState, simulation_obj=None) -> Dict[str, Any]:
        """Process a message using LLM analysis with conversation memory"""
        # Get last user message
        last_user_message = ""
        for msg in reversed(state.messages):
            if msg.startswith('User:'):
                last_user_message = msg[5:]
                break

        if not last_user_message:
            print("❌ ERROR: No user message found in conversation history")
            raise ValueError("No user message found in conversation history")

        print(f"🔍 Processing user message: '{last_user_message}'")
        print(f"🔍 Scenario context: {state.scenario_context[:100]}...")
        print(f"🔍 User objectives: {state.user_objectives}")

        # Get conversation context from memory (if available)
        conversation_context = {}
        if simulation_obj:
            try:
                conversation_context = conversation_memory.get_conversation_context(simulation_obj)
                print(f"🔍 Conversation context loaded: {len(conversation_context)} items")
            except Exception as e:
                print(f"⚠️ Warning: Could not load conversation context: {e}")
                conversation_context = {}

        # Use LLM for comprehensive analysis - NO FALLBACKS HERE
        print("🤖 Calling LLM analyzer for comprehensive analysis...")
        try:
            llm_analysis = llm_analyzer.analyze_message_comprehensive(
                user_message=last_user_message,
                conversation_history=state.messages,
                scenario_context=state.scenario_context,
                user_objectives=state.user_objectives,
                end_conditions=[],
                ai_personality=state.ai_personality,
                ai_role=state.ai_role,
                ai_objectives=state.ai_objectives,
                knowledge_base=state.knowledge_base or ""
            )
            print(f"✅ LLM analysis completed successfully")
            print(f"🔍 Detected emotion: {llm_analysis.emotion_analysis.primary_emotion}")
            print(f"🔍 Key points: {llm_analysis.key_points.main_topics}")
            print(f"🔍 Financial mentions: {llm_analysis.key_points.financial_mentions}")
            print(f"🔍 Business impact: {llm_analysis.business_impact.impact_level}")
            print(f"🔍 Role context - Power dynamics: {llm_analysis.role_context.power_dynamics}")
            print(f"🔍 Role context - Negotiation position: {llm_analysis.role_context.negotiation_position}")
            print(f"🔍 Recommended approach: {llm_analysis.recommended_ai_approach}")

        except Exception as e:
            print(f"❌ CRITICAL ERROR: LLM analysis failed completely: {e}")
            import traceback
            traceback.print_exc()
            raise Exception(f"LLM analysis failed: {e}")

        # Generate contextual response based on LLM analysis instead of templates
        print("🎭 Generating contextual response...")
        try:
            contextual_response = self._generate_contextual_response(
                last_user_message,
                llm_analysis,
                state
            )
            print(f"✅ Contextual response generated: '{contextual_response.content[:100]}...'")

        except Exception as e:
            print(f"❌ ERROR: Failed to generate contextual response: {e}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Failed to generate contextual response: {e}")

        # Enhance response with conversation context
        if conversation_context:
            try:
                contextual_response = self._enhance_with_conversation_context(
                    contextual_response, conversation_context, llm_analysis
                )
                print("✅ Response enhanced with conversation context")
            except Exception as e:
                print(f"⚠️ Warning: Could not enhance with conversation context: {e}")

        # Use LLM analysis to enhance the response
        try:
            enhanced_response = self._enhance_response_with_llm_analysis(
                contextual_response,
                llm_analysis
            )
            print(f"✅ Response enhanced with LLM analysis")

        except Exception as e:
            print(f"❌ ERROR: Failed to enhance response with LLM analysis: {e}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Failed to enhance response with LLM analysis: {e}")

        # Convert objective progress from LLM analysis
        objective_progress = {}
        try:
            for obj_progress in llm_analysis.objective_progress:
                if obj_progress.is_fully_completed:
                    objective_progress[obj_progress.objective_text] = True
            print(f"✅ Objective progress calculated: {objective_progress}")

        except Exception as e:
            print(f"⚠️ Warning: Could not calculate objective progress: {e}")
            objective_progress = {}

        final_result = {
            "response": enhanced_response.content,
            "emotion": llm_analysis.emotion_analysis.primary_emotion,
            "confidence_level": enhanced_response.confidence_level,
            "key_points": llm_analysis.key_points.main_topics,
            "business_impact": llm_analysis.business_impact.impact_level,
            "suggested_follow_up": enhanced_response.suggested_follow_up,
            "objective_progress": objective_progress,
            "llm_analysis": llm_analysis,  # Store complete analysis for persistence
            "conversation_context": conversation_context
        }

        print(f"🎉 Final response generated successfully: '{final_result['response'][:100]}...'")
        return final_result
    
    def _generate_contextual_response(self, user_message: str, llm_analysis: ComprehensiveMessageAnalysis, state: SimulationState) -> AIResponse:
        """Generate enterprise-grade contextual response using LLM analysis and role context"""

        print(f"🎭 Starting contextual response generation...")
        print(f"🎭 LLM recommended approach: '{llm_analysis.recommended_ai_approach}'")

        # PRIORITY 1: Use LLM's direct executive response if it's sophisticated and contextual
        base_response = llm_analysis.recommended_ai_approach

        # Check if LLM response is executive-level (contains business terms, specifics, numbers)
        is_executive_level = (
            base_response and
            len(base_response) > 80 and
            any(term in base_response.lower() for term in [
                'valoración', 'revenue', 'board', 'stakeholder', 'pipeline', 'metrics',
                'due diligence', 'growth', 'market', 'capital', 'competition', 'strategy'
            ]) and
            not any(generic in base_response.lower() for generic in [
                'mantener conversación', 'elaborar más', 'aspectos específicos', 'recomiendo que'
            ])
        )

        if is_executive_level:
            print(f"🎭 Using LLM executive-level response as primary")
            response_content = base_response
        else:
            print(f"🎭 Building executive response with role-specific context...")

            # PRIORITY 2: Build executive response using role context and business intelligence
            response_content = self._build_executive_response(
                user_message, llm_analysis, state
            )

        print(f"🎭 Generated response content: '{response_content[:100]}...'")

        # APPLY OBJECTIVE-DRIVEN STRATEGY
        print(f"🎯 Analyzing objective alignment...")
        objective_analysis = self._analyze_objective_alignment(user_message, llm_analysis, state)
        print(f"🎯 Objective strategy: {objective_analysis.get('negotiation_strategy', 'neutral')}")

        # Apply strategic modifications based on AI objectives vs user objectives
        strategic_response = self._apply_objective_driven_strategy(response_content, objective_analysis, state)
        print(f"🎯 Strategic response applied: '{strategic_response[:100]}...'")

        # Create structured AI response with enterprise metadata
        ai_response = AIResponse(
            content=strategic_response,
            emotion=llm_analysis.emotion_analysis.primary_emotion,
            confidence_level=min(95, 70 + len(strategic_response) // 20),  # Higher confidence for longer, detailed responses
            key_points=llm_analysis.key_points.main_topics,
            business_impact=llm_analysis.business_impact.impact_level,
            suggested_follow_up=self._generate_strategic_follow_up(llm_analysis, state)
        )

        return ai_response

    def _build_executive_response(self, user_message: str, llm_analysis: ComprehensiveMessageAnalysis, state: SimulationState) -> str:
        """Build executive-level response using role context and business intelligence"""

        # Extract role-specific context
        ai_role = state.ai_role
        ai_objectives = state.ai_objectives
        knowledge_base = state.knowledge_base or ""

        response_components = []

        # 1. Executive opening based on emotional context and role
        emotion = llm_analysis.emotion_analysis.primary_emotion
        if "CEO" in ai_role or "Founder" in ai_role:
            if emotion in ["frustrated", "aggressive"]:
                response_components.append("Entiendo la presión. Como founder, he pasado por situaciones similares.")
            elif emotion in ["confident", "positive"]:
                response_components.append("Me gusta esa confianza. Es el tipo de mentalidad que necesitamos.")
            else:
                response_components.append("Aprecio la claridad de su propuesta.")
        elif "VP" in ai_role or "Director" in ai_role:
            if emotion in ["frustrated", "aggressive"]:
                response_components.append("Comparto su sentido de urgencia. La situación requiere acción inmediata.")
            elif emotion in ["confident", "positive"]:
                response_components.append("Su aproximación es sólida. Vamos a profundizar en los detalles.")
            else:
                response_components.append("Revisemos los elementos clave de lo que plantea.")

        # 2. Address specific business context with expertise
        financial_mentions = llm_analysis.key_points.financial_mentions
        if financial_mentions:
            # Show industry expertise and business acumen
            financial_context = ", ".join(financial_mentions[:2])
            if "fintech" in state.scenario_context.lower():
                response_components.append(f"Respecto a {financial_context}, nuestros benchmarks con Nubank y Clara muestran diferentes dinámicas de valoración. Necesito entender mejor sus assumptions sobre nuestro multiple de revenue.")
            elif "crisis" in state.scenario_context.lower():
                response_components.append(f"Los números que menciona ({financial_context}) coinciden con nuestro análisis interno. Ya tenemos un plan de recovery que nos lleva a break-even en Q2.")
            else:
                response_components.append(f"Los aspectos financieros ({financial_context}) son críticos. ¿Cuál es el modelo de negocio detrás de estas proyecciones?")

        # 3. Strategic response based on AI objectives and constraints
        strategic_concepts = llm_analysis.key_points.strategic_concepts
        if strategic_concepts and ai_objectives:
            primary_objective = ai_objectives[0] if ai_objectives else ""
            if "valoración" in primary_objective.lower():
                response_components.append("Mi prioridad es maximizar value para todos los stakeholders. ¿Cómo estructura su oferta para alinear incentivos a largo plazo?")
            elif "estabilizar" in primary_objective.lower():
                response_components.append("Lo crítico es stabilizar operaciones. ¿Qué level de authority tiene para implementar las medidas que necesitamos?")
            elif "cerrar" in primary_objective.lower():
                response_components.append("Para cerrar esta ronda necesito ver commitment real. ¿Cuál es su timeline para due diligence y términos definitivos?")

        # 4. Add business pressure and time sensitivity
        if llm_analysis.business_impact.urgency_level == "immediate":
            response_components.append("El timing es crucial aquí. Tenemos board meeting en dos semanas y necesitamos clarity antes de esa fecha.")

        # 5. Strategic next steps with specific business context
        action_items = llm_analysis.key_points.action_items
        if action_items:
            actions = ", ".join(action_items[:2])
            response_components.append(f"Propongo que nos enfoquemos en {actions}. ¿Puede comprometerse a tener esos deliverables para viernes?")

        # Join with executive flow (not mechanical concatenation)
        if len(response_components) >= 3:
            # Create natural executive flow
            opening = response_components[0]
            business_context = " ".join(response_components[1:3])
            closing = response_components[-1] if len(response_components) > 3 else "¿Cuáles son los próximos pasos concretos?"

            return f"{opening} {business_context} {closing}"
        else:
            return " ".join(response_components) if response_components else "Necesito más detalles para evaluar esta propuesta adecuadamente."

    def _generate_strategic_follow_up(self, llm_analysis: ComprehensiveMessageAnalysis, state: SimulationState) -> str:
        """Generate strategic follow-up based on role and business context"""

        ai_role = state.ai_role

        if "CEO" in ai_role or "Founder" in ai_role:
            if llm_analysis.key_points.financial_mentions:
                return "¿Podría compartir su modelo financiero detallado y assumptions de crecimiento?"
            else:
                return "¿Cuál es su vision a 3 años para esta partnership/acquisition?"
        elif "VP" in ai_role or "Director" in ai_role:
            if llm_analysis.business_impact.impact_level == "critical":
                return "¿Qué recursos necesita para implementar esto inmediatamente?"
            else:
                return "¿Cómo mediremos el éxito de esta iniciativa?"
        else:
            return "¿Cuáles son los próximos pasos específicos que propone?"

    def _analyze_objective_alignment(self, user_message: str, llm_analysis: ComprehensiveMessageAnalysis, state: SimulationState) -> Dict[str, Any]:
        """Analyze alignment between user objectives and AI objectives to drive strategic responses"""

        ai_objectives = state.ai_objectives or []
        user_objectives = state.user_objectives or []

        alignment_analysis = {
            "conflicts": [],
            "alignments": [],
            "ai_defensive_points": [],
            "ai_leverage_points": [],
            "negotiation_strategy": "neutral"
        }

        # Analyze specific conflicts based on role and objectives
        if ai_objectives and user_objectives:
            # M&A Scenario Analysis
            if "fintech" in state.scenario_context.lower() and "valoración" in ' '.join(ai_objectives).lower():
                financial_mentions = llm_analysis.key_points.financial_mentions
                if financial_mentions:
                    # Extract any numbers mentioned
                    import re
                    numbers = []
                    for mention in financial_mentions:
                        number_match = re.findall(r'\$(\d+)M|\$(\d+)K|(\d+)%', mention)
                        if number_match:
                            numbers.extend([n for n in number_match[0] if n])

                    if numbers and any(int(n) > 20 for n in numbers if n.isdigit()):
                        alignment_analysis["conflicts"].append("Usuario ofrece valoración alta vs AI quiere maximizar value")
                        alignment_analysis["ai_defensive_points"].append("Nuestras métricas y benchmarks de mercado")
                        alignment_analysis["negotiation_strategy"] = "protective_with_data"

            # Crisis Scenario Analysis
            elif "crisis" in state.scenario_context.lower() and "estabilizar" in ' '.join(ai_objectives).lower():
                urgency_level = llm_analysis.business_impact.urgency_level
                if urgency_level == "immediate":
                    alignment_analysis["alignments"].append("Ambos reconocen urgencia de la situación")
                    alignment_analysis["ai_leverage_points"].append("Experiencia en crisis management")
                    alignment_analysis["negotiation_strategy"] = "collaborative_urgent"

        return alignment_analysis

    def _apply_objective_driven_strategy(self, base_response: str, objective_analysis: Dict[str, Any], state: SimulationState) -> str:
        """Apply objective-driven strategy to modify response based on AI goals"""

        strategy = objective_analysis.get("negotiation_strategy", "neutral")
        conflicts = objective_analysis.get("conflicts", [])
        leverage_points = objective_analysis.get("ai_leverage_points", [])

        # Modify response based on strategy
        if strategy == "protective_with_data":
            # Add data-driven pushback
            data_qualifier = "Basándome en nuestro track record y benchmarks de mercado, "
            if not base_response.startswith(data_qualifier[:20]):
                base_response = data_qualifier + base_response.lower()

        elif strategy == "collaborative_urgent":
            # Emphasize shared urgency and collaborative approach
            urgency_qualifier = "Compartimos esa urgencia. "
            if "urgencia" not in base_response.lower():
                base_response = urgency_qualifier + base_response

        # Add defensive points if there are conflicts
        if conflicts and leverage_points:
            leverage_point = leverage_points[0]
            base_response += f" Mi experiencia en {leverage_point} me dice que necesitamos ser estratégicos aquí."

        return base_response
    
    def _generate_insight_based_response(self, user_question: str, insight_check: Dict, context: Dict, state: SimulationState) -> Dict[str, Any]:
        """Generate response based on previous conversation insights"""
        
        insight_type = insight_check['insight_type']
        relevant_data = insight_check['relevant_data']
        
        response_content = ""
        
        # Always try to get data from semantic search
        if insight_type == 'financial':
            financial_data = relevant_data.get('relevant_financial_data', [])
            if financial_data:
                response_content = f"Respecto a los aspectos financieros, hemos mencionado: {', '.join(financial_data)}. "
            else:
                response_content = "En términos financieros, hemos tocado varios aspectos importantes. "
        
        elif insight_type == 'key_points':
            key_points = relevant_data.get('relevant_key_points', [])
            if key_points:
                response_content = f"Basándome en nuestra conversación, los puntos clave que hemos discutido incluyen: {', '.join(key_points[:3])}. "
            else:
                # Fallback - try to get ANY data from context
                all_data = []
                all_data.extend(relevant_data.get('relevant_financial_data', []))
                all_data.extend(relevant_data.get('relevant_stakeholders', []))
                all_data.extend(relevant_data.get('relevant_actions', []))
                if all_data:
                    response_content = f"Los key findings de nuestra conversación incluyen: {', '.join(all_data[:4])}. "
                else:
                    response_content = "Hasta ahora hemos cubierto varios temas importantes en nuestra conversación. "
        
        elif insight_type == 'strategic':
            strategic_concepts = relevant_data.get('relevant_key_points', [])
            if strategic_concepts:
                response_content = f"Estratégicamente, hemos discutido: {', '.join(strategic_concepts[:3])}. "
            else:
                # Try to get strategic data from other sources
                all_strategic = []
                all_strategic.extend(relevant_data.get('relevant_actions', []))
                all_strategic.extend(relevant_data.get('relevant_concerns', []))
                if all_strategic:
                    response_content = f"Los puntos estratégicos incluyen: {', '.join(all_strategic[:3])}. "
                else:
                    response_content = "Desde una perspectiva estratégica, "
        
        elif insight_type == 'stakeholders':
            stakeholders = relevant_data.get('relevant_stakeholders', [])
            if stakeholders:
                response_content = f"Considerando los stakeholders que hemos mencionado ({', '.join(stakeholders)}), "
            else:
                response_content = "En cuanto a los stakeholders involucrados, "
        
        elif insight_type == 'actions':
            actions = relevant_data.get('relevant_actions', [])
            if actions:
                response_content = f"Las acciones que hemos identificado incluyen: {', '.join(actions[:3])}. "
            else:
                response_content = "En términos de acciones concretas, "
        
        elif insight_type == 'general':
            # Generic insight response - combine all available data
            all_insights = []
            all_insights.extend(relevant_data.get('relevant_financial_data', []))
            all_insights.extend(relevant_data.get('relevant_key_points', []))
            all_insights.extend(relevant_data.get('relevant_stakeholders', []))
            all_insights.extend(relevant_data.get('relevant_actions', []))
            
            if all_insights:
                response_content = f"Revisando nuestra conversación anterior, hemos cubierto: {', '.join(all_insights[:4])}. "
            else:
                response_content = "En nuestra conversación previa hemos tocado varios temas importantes. "
        
        else:
            # Default insight response - combine all available data
            all_insights = []
            all_insights.extend(relevant_data.get('relevant_financial_data', []))
            all_insights.extend(relevant_data.get('relevant_key_points', []))
            all_insights.extend(relevant_data.get('relevant_stakeholders', []))
            all_insights.extend(relevant_data.get('relevant_actions', []))
            
            if all_insights:
                response_content = f"Basándome en nuestra conversación previa, hemos cubierto: {', '.join(all_insights[:4])}. "
            else:
                response_content = "Revisando nuestra conversación anterior, "
        
        # Add contextual continuation
        if context.get('business_impact_level') == 'critical':
            response_content += "Dado el impacto crítico de estos temas, necesitamos tomar decisiones concretas."
        else:
            response_content += "¿Hay algún aspecto específico que quieras profundizar?"
        
        # Collect all relevant points for key_points field
        all_key_points = []
        all_key_points.extend(relevant_data.get('relevant_key_points', []))
        all_key_points.extend(relevant_data.get('relevant_financial_data', []))
        all_key_points.extend(relevant_data.get('relevant_stakeholders', []))
        all_key_points.extend(relevant_data.get('relevant_actions', []))
        
        return {
            "response": response_content,
            "emotion": "neutral",
            "confidence_level": 9,  # High confidence when referencing previous data
            "key_points": all_key_points[:5],  # Return up to 5 key points
            "business_impact": context.get('business_impact_level', 'medium'),
            "suggested_follow_up": "¿Quieres que revisemos algún punto específico?",
            "objective_progress": {},
            "is_insight_based": True,
            "referenced_insights": relevant_data
        }
    
    def _enhance_with_conversation_context(self, response: AIResponse, context: Dict, llm_analysis: ComprehensiveMessageAnalysis) -> AIResponse:
        """Enhance response with accumulated conversation context"""
        
        # Reference previous financial discussions
        if context.get('financial_data_mentioned') and llm_analysis.key_points.financial_mentions:
            prev_financial = context['financial_data_mentioned']
            new_financial = llm_analysis.key_points.financial_mentions
            response.content += f" Considerando que anteriormente discutimos {', '.join(prev_financial[:2])}, "
        
        # Reference conversation phase
        phase = context.get('conversation_phase', 'opening')
        if phase == 'negotiation':
            response.content += " Estamos en una fase crítica de la negociación."
        elif phase == 'closing':
            response.content += " Nos acercamos a las decisiones finales."
        
        # Reference accumulated concerns
        if context.get('concerns_raised') and len(context['concerns_raised']) > 2:
            response.content += " Veo que hemos identificado varias preocupaciones importantes que debemos resolver."
        
        return response
    
    def _enhance_response_with_llm_analysis(self, base_response: AIResponse, llm_analysis: ComprehensiveMessageAnalysis) -> AIResponse:
        """Enhance AI response based on LLM analysis"""
        
        # Adjust response based on detected urgency
        if llm_analysis.business_impact.urgency_level == "immediate":
            base_response.content = f"Entiendo la urgencia de la situación. {base_response.content}"
        
        # Adjust based on financial mentions
        if llm_analysis.key_points.financial_mentions:
            financial_context = ", ".join(llm_analysis.key_points.financial_mentions)
            base_response.content += f" Respecto a los aspectos financieros que mencionas ({financial_context}), necesito más detalles."
        
        # Adjust based on concerns raised
        if llm_analysis.key_points.concerns_raised:
            base_response.content += " Veo que tienes algunas preocupaciones válidas que debemos abordar."
        
        # Update emotion based on LLM analysis
        emotion_mapping = {
            "positive": "encouraging",
            "negative": "concerned", 
            "frustrated": "concerned",
            "confident": "neutral",
            "hesitant": "encouraging",
            "aggressive": "skeptical",
            "collaborative": "encouraging"
        }
        
        llm_emotion = llm_analysis.emotion_analysis.primary_emotion
        if llm_emotion in emotion_mapping:
            base_response.emotion = emotion_mapping[llm_emotion]
        
        return base_response
    
    def _fallback_response(self) -> Dict[str, Any]:
        """NO MORE FALLBACKS - raise exceptions instead"""
        raise Exception("CRITICAL: System attempted to use fallback response. This should never happen.")
    
    def generate_analysis(self, messages: List[str], duration_minutes: int) -> Dict[str, Any]:
        """Generate structured simulation analysis"""
        try:
            analysis = self.ai_service.generate_simulation_analysis(messages, duration_minutes)
            return analysis.dict()
        except Exception as e:
            # Fallback analysis
            return {
                "overall_score": 75,
                "strategic_thinking": 73,
                "communication_skills": 78,
                "negotiation_effectiveness": 72,
                "emotional_intelligence": 76,
                "strengths": ["Comunicación clara", "Enfoque estratégico"],
                "improvement_areas": ["Más datos específicos", "Mejor timing"],
                "specific_recommendations": ["Estudiar casos de negociación", "Practicar storytelling"],
                "key_decision_moments": []
            }


# Create enhanced agent instance
structured_simulation_agent = StructuredSimulationAgent()
