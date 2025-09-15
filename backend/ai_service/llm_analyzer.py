import os
from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser


class EmotionAnalysis(BaseModel):
    """Structured emotion analysis of user message"""
    primary_emotion: Literal["positive", "negative", "neutral", "frustrated", "confident", "hesitant", "aggressive", "collaborative"] = Field(
        description="Primary emotion detected in the user's message"
    )
    confidence_score: float = Field(
        ge=0.0, le=1.0,
        description="Confidence in emotion detection (0.0 to 1.0)"
    )
    emotional_indicators: List[str] = Field(
        description="Specific words or phrases that indicate the emotion"
    )
    tone_shift: Optional[str] = Field(
        None,
        description="How the tone changed from previous messages, if applicable"
    )


class KeyPointsExtraction(BaseModel):
    """Structured extraction of key business points"""
    main_topics: List[str] = Field(
        description="Main business topics discussed in the message"
    )
    financial_mentions: List[str] = Field(
        description="Any financial figures, budgets, or monetary values mentioned"
    )
    strategic_concepts: List[str] = Field(
        description="Strategic business concepts or frameworks mentioned"
    )
    stakeholders_mentioned: List[str] = Field(
        description="People, roles, or organizations mentioned"
    )
    action_items: List[str] = Field(
        description="Specific actions or commitments proposed by the user"
    )
    concerns_raised: List[str] = Field(
        description="Concerns, objections, or risks mentioned"
    )


class BusinessImpactAssessment(BaseModel):
    """Structured business impact analysis"""
    impact_level: Literal["low", "medium", "high", "critical"] = Field(
        description="Overall business impact level of the message content"
    )
    financial_impact: Literal["none", "low", "medium", "high", "critical"] = Field(
        description="Potential financial impact of the topics discussed"
    )
    strategic_importance: Literal["low", "medium", "high", "critical"] = Field(
        description="Strategic importance of the decisions being discussed"
    )
    urgency_level: Literal["low", "medium", "high", "immediate"] = Field(
        description="Urgency level indicated in the message"
    )
    risk_factors: List[str] = Field(
        description="Potential risks identified in the user's message"
    )
    opportunities: List[str] = Field(
        description="Potential opportunities identified in the user's message"
    )


class ObjectiveProgress(BaseModel):
    """Structured objective progress analysis"""
    objective_text: str = Field(description="The specific objective being analyzed")
    completion_percentage: int = Field(
        ge=0, le=100,
        description="Estimated completion percentage for this objective"
    )
    is_fully_completed: bool = Field(
        description="Whether this objective has been fully achieved"
    )
    evidence_for_completion: List[str] = Field(
        description="Specific evidence from the conversation that supports this completion level"
    )
    remaining_requirements: List[str] = Field(
        description="What still needs to be done to complete this objective"
    )
    confidence_in_assessment: float = Field(
        ge=0.0, le=1.0,
        description="Confidence in this objective progress assessment"
    )


class EndConditionAnalysis(BaseModel):
    """Structured end condition detection"""
    condition_text: str = Field(description="The specific end condition being analyzed")
    is_met: bool = Field(description="Whether this end condition has been met")
    likelihood_of_meeting: float = Field(
        ge=0.0, le=1.0,
        description="Likelihood that this condition will be met soon (0.0 to 1.0)"
    )
    evidence: List[str] = Field(
        description="Evidence from the conversation that supports this assessment"
    )
    next_steps_needed: List[str] = Field(
        description="What needs to happen for this condition to be met"
    )


class ComprehensiveMessageAnalysis(BaseModel):
    """Complete structured analysis of a user message"""
    emotion_analysis: EmotionAnalysis
    key_points: KeyPointsExtraction
    business_impact: BusinessImpactAssessment
    objective_progress: List[ObjectiveProgress]
    end_condition_analysis: List[EndConditionAnalysis]
    conversation_summary: str = Field(
        description="Brief summary of where the conversation stands after this message"
    )
    recommended_ai_approach: str = Field(
        description="Recommended approach for the AI's next response"
    )


class LLMAnalyzer:
    """LLM-based analyzer using structured outputs"""
    
    def __init__(self):
        # For demo purposes, we'll simulate LLM analysis
        # In production, uncomment the line below with real API key
        # self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3, api_key=os.getenv("OPENAI_API_KEY"))
        self.use_simulation = True
    
    def analyze_message_comprehensive(
        self, 
        user_message: str,
        conversation_history: List[str],
        scenario_context: str,
        user_objectives: List[str],
        end_conditions: List[str],
        ai_personality: Dict[str, int]
    ) -> ComprehensiveMessageAnalysis:
        """Comprehensive LLM analysis of user message"""
        
        if self.use_simulation:
            # Simulated LLM analysis with intelligent logic
            return self._simulate_llm_analysis(
                user_message, conversation_history, scenario_context, 
                user_objectives, end_conditions, ai_personality
            )
        
        # Real LLM implementation (when API key is available)
        try:
            # Create parser for structured output
            parser = PydanticOutputParser(pydantic_object=ComprehensiveMessageAnalysis)
            
            # Build context-aware prompt
            prompt = ChatPromptTemplate.from_template("""
Eres un experto analista de comunicación empresarial y simulaciones de liderazgo. 
Analiza el siguiente mensaje del usuario en el contexto de una simulación empresarial.

CONTEXTO DEL ESCENARIO:
{scenario_context}

OBJETIVOS DEL USUARIO:
{user_objectives}

CONDICIONES DE FINALIZACIÓN:
{end_conditions}

HISTORIAL DE CONVERSACIÓN:
{conversation_history}

MENSAJE ACTUAL DEL USUARIO:
{user_message}

PERSONALIDAD DE LA IA (para entender el contexto):
- Analítico: {analytical}/100
- Paciencia: {patience}/100  
- Agresividad: {aggression}/100
- Flexibilidad: {flexibility}/100

Analiza este mensaje de manera comprehensiva y estructurada. Considera:

1. ANÁLISIS EMOCIONAL: ¿Qué emoción transmite el usuario? ¿Hay cambios de tono?

2. EXTRACCIÓN DE PUNTOS CLAVE: ¿Qué temas importantes menciona? ¿Números financieros? ¿Conceptos estratégicos?

3. IMPACTO EMPRESARIAL: ¿Qué tan importante es este mensaje para el negocio? ¿Qué riesgos u oportunidades presenta?

4. PROGRESO DE OBJETIVOS: Para cada objetivo del usuario, ¿qué tan cerca está de cumplirlo basado en este mensaje?

5. CONDICIONES DE FINALIZACIÓN: ¿Se ha cumplido alguna condición para terminar la simulación?

6. RECOMENDACIÓN: ¿Cómo debería responder la IA considerando su personalidad?

{format_instructions}
""")
            
            # Format the prompt
            formatted_prompt = prompt.format(
                scenario_context=scenario_context,
                user_objectives="\n".join(f"- {obj}" for obj in user_objectives),
                end_conditions="\n".join(f"- {cond}" for cond in end_conditions),
                conversation_history="\n".join(conversation_history[-5:]),
                user_message=user_message,
                analytical=ai_personality.get('analytical', 50),
                patience=ai_personality.get('patience', 50),
                aggression=ai_personality.get('aggression', 30),
                flexibility=ai_personality.get('flexibility', 50),
                format_instructions=parser.get_format_instructions()
            )
            
            # Get LLM analysis
            response = self.llm.invoke(formatted_prompt)
            analysis = parser.parse(response.content)
            return analysis
            
        except Exception as e:
            print(f"LLM Analysis error: {e}")
            # Fallback to simulated analysis
            return self._simulate_llm_analysis(
                user_message, conversation_history, scenario_context, 
                user_objectives, end_conditions, ai_personality
            )
    
    def _simulate_llm_analysis(
        self,
        user_message: str,
        conversation_history: List[str],
        scenario_context: str,
        user_objectives: List[str],
        end_conditions: List[str],
        ai_personality: Dict[str, int]
    ) -> ComprehensiveMessageAnalysis:
        """Simulate intelligent LLM analysis for demo purposes"""
        
        msg_lower = user_message.lower()
        
        # Intelligent emotion detection
        emotion = "neutral"
        confidence = 0.7
        indicators = []
        
        if any(word in msg_lower for word in ['acepto', 'perfecto', 'excelente', 'de acuerdo', 'sí']):
            emotion = "positive"
            confidence = 0.9
            indicators = ["palabras de aceptación"]
        elif any(word in msg_lower for word in ['no', 'rechazo', 'imposible', 'problema', 'preocupa']):
            emotion = "negative"
            confidence = 0.85
            indicators = ["palabras de rechazo o preocupación"]
        elif any(word in msg_lower for word in ['urgente', 'inmediatamente', 'rápido', 'ya']):
            emotion = "frustrated"
            confidence = 0.8
            indicators = ["indicadores de urgencia"]
        elif any(word in msg_lower for word in ['propongo', 'sugiero', 'plan', 'estrategia']):
            emotion = "confident"
            confidence = 0.75
            indicators = ["lenguaje propositivo"]
        
        # Extract financial mentions
        financial_mentions = []
        import re
        
        # Enhanced financial detection
        money_patterns = [
            r'\$\d+[KMB]?',           # $5M, $500K
            r'\d+K\s*usuarios?',      # 50K usuarios
            r'\d+%\s*mensual',        # 30% mensual
            r'Serie\s*[AB]',          # Serie A
            r'presupuesto',
            r'ROI',
            r'inversión',
            r'financiamiento'
        ]
        
        for pattern in money_patterns:
            matches = re.findall(pattern, user_message, re.IGNORECASE)
            financial_mentions.extend(matches)
        
        # Also check for numbers that might be financial
        number_matches = re.findall(r'\d+[KMB]?', user_message)
        for match in number_matches:
            if any(fin_word in user_message.lower() for fin_word in ['usuarios', 'crecimiento', 'millones', 'mil']):
                financial_mentions.append(match)
        
        # Extract strategic concepts
        strategic_concepts = []
        strategy_terms = ['estrategia', 'plan', 'visión', 'objetivo', 'meta', 'timeline', 'roadmap', 'framework', 'expansión', 'crecimiento', 'usuarios']
        for term in strategy_terms:
            if term in msg_lower:
                strategic_concepts.append(term)
        
        # Also extract business concepts
        business_concepts = ['Serie A', 'Q2', 'mensual', 'activos']
        for concept in business_concepts:
            if concept.lower() in msg_lower:
                strategic_concepts.append(concept)
        
        # Extract stakeholders
        stakeholders = []
        stakeholder_terms = ['CEO', 'CFO', 'equipo', 'junta', 'directorio', 'board', 'clientes', 'usuarios', 'Google', 'ex-Google']
        for term in stakeholder_terms:
            if term.lower() in msg_lower or term in user_message:
                stakeholders.append(term)
        
        # Extract action items
        action_items = []
        action_verbs = ['implementar', 'desarrollar', 'crear', 'establecer', 'definir', 'ejecutar']
        for verb in action_verbs:
            if verb in msg_lower:
                # Find the context around the verb
                words = user_message.split()
                for i, word in enumerate(words):
                    if verb in word.lower() and i < len(words) - 2:
                        action_context = " ".join(words[i:i+3])
                        action_items.append(action_context)
        
        # Assess business impact
        impact_level = "medium"
        if any(word in msg_lower for word in ['crisis', 'crítico', 'urgente', 'millones']):
            impact_level = "critical"
        elif any(word in msg_lower for word in ['importante', 'estratégico', 'clave', 'fundamental']):
            impact_level = "high"
        elif any(word in msg_lower for word in ['menor', 'simple', 'básico']):
            impact_level = "low"
        
        # Analyze objectives progress
        objective_progress = []
        for objective in user_objectives:
            completion_percentage = 0
            is_completed = False
            evidence = []
            remaining = [objective]
            
            # Intelligent objective matching
            obj_words = objective.lower().split()
            msg_words = msg_lower.split()
            
            # Check for direct mentions of objective concepts
            matches = len(set(obj_words) & set(msg_words))
            if matches > 0:
                completion_percentage = min(80, matches * 20)
                evidence.append(f"Menciona conceptos relacionados: {matches} coincidencias")
            
            # Check for completion indicators
            if any(word in msg_lower for word in ['acepto', 'acuerdo', 'aprobado', 'listo', 'completado']):
                completion_percentage = 90
                is_completed = True
                evidence.append("Indicadores de aceptación o finalización")
                remaining = []
            elif any(word in msg_lower for word in ['propongo', 'plan', 'vamos a']):
                completion_percentage = max(completion_percentage, 60)
                evidence.append("Propuesta o plan presentado")
                remaining = ["Necesita aceptación de la contraparte"]
            
            objective_progress.append(ObjectiveProgress(
                objective_text=objective,
                completion_percentage=completion_percentage,
                is_fully_completed=is_completed,
                evidence_for_completion=evidence,
                remaining_requirements=remaining,
                confidence_in_assessment=0.8
            ))
        
        # Generate conversation summary
        message_count = len([msg for msg in conversation_history if msg.startswith('User:')])
        if message_count <= 1:
            summary = "Inicio de conversación, estableciendo contexto"
        elif message_count <= 3:
            summary = "Conversación en desarrollo, intercambiando propuestas"
        else:
            summary = "Conversación avanzada, acercándose a decisiones"
        
        return ComprehensiveMessageAnalysis(
            emotion_analysis=EmotionAnalysis(
                primary_emotion=emotion,
                confidence_score=confidence,
                emotional_indicators=indicators,
                tone_shift=None
            ),
            key_points=KeyPointsExtraction(
                main_topics=strategic_concepts[:3],  # Top 3 topics
                financial_mentions=financial_mentions,
                strategic_concepts=strategic_concepts,
                stakeholders_mentioned=stakeholders,
                action_items=action_items,
                concerns_raised=[]
            ),
            business_impact=BusinessImpactAssessment(
                impact_level=impact_level,
                financial_impact="high" if financial_mentions else "low",
                strategic_importance=impact_level,
                urgency_level="immediate" if emotion == "frustrated" else "medium",
                risk_factors=[],
                opportunities=[]
            ),
            objective_progress=objective_progress,
            end_condition_analysis=[],  # Will be implemented
            conversation_summary=summary,
            recommended_ai_approach="Responder de manera profesional y contextual"
        )
    
    def _create_fallback_analysis(self, user_message: str, user_objectives: List[str], end_conditions: List[str]) -> ComprehensiveMessageAnalysis:
        """Fallback analysis if LLM fails"""
        return ComprehensiveMessageAnalysis(
            emotion_analysis=EmotionAnalysis(
                primary_emotion="neutral",
                confidence_score=0.6,
                emotional_indicators=["tono profesional"],
                tone_shift=None
            ),
            key_points=KeyPointsExtraction(
                main_topics=["comunicación empresarial"],
                financial_mentions=[],
                strategic_concepts=[],
                stakeholders_mentioned=[],
                action_items=[],
                concerns_raised=[]
            ),
            business_impact=BusinessImpactAssessment(
                impact_level="medium",
                financial_impact="low",
                strategic_importance="medium",
                urgency_level="medium",
                risk_factors=[],
                opportunities=[]
            ),
            objective_progress=[
                ObjectiveProgress(
                    objective_text=obj,
                    completion_percentage=30,
                    is_fully_completed=False,
                    evidence_for_completion=[],
                    remaining_requirements=["Más información necesaria"],
                    confidence_in_assessment=0.5
                ) for obj in user_objectives
            ],
            end_condition_analysis=[
                EndConditionAnalysis(
                    condition_text=cond,
                    is_met=False,
                    likelihood_of_meeting=0.3,
                    evidence=[],
                    next_steps_needed=["Continuar conversación"]
                ) for cond in end_conditions
            ],
            conversation_summary="Conversación en progreso con análisis básico",
            recommended_ai_approach="Continuar con enfoque profesional y solicitar más información"
        )
    
    def quick_emotion_analysis(self, message: str) -> str:
        """Quick emotion analysis for immediate response"""
        try:
            prompt = ChatPromptTemplate.from_template("""
Analiza la emoción en este mensaje empresarial en español:

Mensaje: "{message}"

Responde SOLO con una de estas opciones: positive, negative, neutral, frustrated, confident, hesitant, aggressive, collaborative

No agregues explicaciones, solo la emoción.
""")
            
            response = self.llm.invoke(prompt.format(message=message))
            emotion = response.content.strip().lower()
            
            # Validate response
            valid_emotions = ["positive", "negative", "neutral", "frustrated", "confident", "hesitant", "aggressive", "collaborative"]
            if emotion in valid_emotions:
                return emotion
            else:
                return "neutral"
                
        except Exception as e:
            return "neutral"  # Safe fallback


# Global analyzer instance
llm_analyzer = LLMAnalyzer()
