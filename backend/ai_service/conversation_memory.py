from typing import List, Dict, Any, Optional
from django.db.models import Q
from simulations.models import Simulation, Message, ConversationInsights
from .llm_analyzer import ComprehensiveMessageAnalysis, llm_analyzer


class ConversationMemoryService:
    """Service to manage conversation insights and semantic memory"""
    
    def store_message_insights(self, message: Message, llm_analysis):
        """Store LLM analysis results in the message"""
        
        try:
            # Handle both ComprehensiveMessageAnalysis objects and dict results
            if hasattr(llm_analysis, 'key_points'):
                # Pydantic object
                message.key_points = llm_analysis.key_points.main_topics
                message.financial_mentions = llm_analysis.key_points.financial_mentions
                message.strategic_concepts = llm_analysis.key_points.strategic_concepts
                message.stakeholders_mentioned = llm_analysis.key_points.stakeholders_mentioned
                message.action_items = llm_analysis.key_points.action_items
                message.concerns_raised = llm_analysis.key_points.concerns_raised
                
                message.business_impact_level = llm_analysis.business_impact.impact_level
                message.urgency_level = llm_analysis.business_impact.urgency_level
                message.confidence_score = llm_analysis.emotion_analysis.confidence_score
                
                # Store complete analysis
                message.llm_analysis = {
                    'emotion_analysis': {
                        'primary_emotion': llm_analysis.emotion_analysis.primary_emotion,
                        'confidence_score': llm_analysis.emotion_analysis.confidence_score,
                        'emotional_indicators': llm_analysis.emotion_analysis.emotional_indicators
                    },
                    'conversation_summary': llm_analysis.conversation_summary
                }
            else:
                # Dict result - extract from nested structure
                message.key_points = llm_analysis.get('key_points', [])
                message.financial_mentions = llm_analysis.get('financial_mentions', [])
                message.strategic_concepts = llm_analysis.get('strategic_concepts', [])
                message.business_impact_level = llm_analysis.get('business_impact', 'medium')
                message.urgency_level = llm_analysis.get('urgency_level', 'medium')
                message.confidence_score = 0.7
                message.llm_analysis = llm_analysis
                
                # Also try to extract from nested dict if present
                if not message.financial_mentions and 'financial_mentions' in str(llm_analysis):
                    # Try to extract from string representation
                    import re
                    content = str(llm_analysis)
                    financial_matches = re.findall(r"'financial_mentions':\s*\[(.*?)\]", content)
                    if financial_matches:
                        # Extract individual items
                        items = re.findall(r"'([^']+)'", financial_matches[0])
                        message.financial_mentions = items[:5]  # Limit to 5 items
            
            message.save()
            
            # Update accumulated insights
            self.update_conversation_insights(message.simulation)
            
        except Exception as e:
            print(f"Error storing insights: {e}")
            # Continue without storing insights
    
    def update_conversation_insights(self, simulation: Simulation):
        """Update accumulated insights for the entire conversation"""
        
        # Get or create insights object
        insights, created = ConversationInsights.objects.get_or_create(
            simulation=simulation,
            defaults={
                'conversation_summary': 'Conversación iniciada',
                'highest_impact_level': 'medium',
                'peak_urgency_level': 'medium'
            }
        )
        
        # Get all user messages with analysis
        user_messages = simulation.messages.filter(sender='user').exclude(llm_analysis={})
        
        if not user_messages.exists():
            return insights
        
        # Accumulate all insights
        all_key_points = []
        all_financial = []
        all_strategic = []
        all_stakeholders = []
        all_actions = []
        all_concerns = []
        all_emotions = []
        
        impact_levels = []
        urgency_levels = []
        
        for msg in user_messages:
            all_key_points.extend(msg.key_points)
            all_financial.extend(msg.financial_mentions)
            all_strategic.extend(msg.strategic_concepts)
            all_stakeholders.extend(msg.stakeholders_mentioned)
            all_actions.extend(msg.action_items)
            all_concerns.extend(msg.concerns_raised)
            
            if msg.business_impact_level:
                impact_levels.append(msg.business_impact_level)
            if msg.urgency_level:
                urgency_levels.append(msg.urgency_level)
            if msg.emotion:
                all_emotions.append(msg.emotion)
        
        # Remove duplicates and update insights
        insights.all_key_points = list(set(all_key_points))
        insights.all_financial_mentions = list(set(all_financial))
        insights.all_strategic_concepts = list(set(all_strategic))
        insights.all_stakeholders = list(set(all_stakeholders))
        insights.all_action_items = list(set(all_actions))
        insights.all_concerns = list(set(all_concerns))
        
        # Determine highest impact and urgency
        impact_priority = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        if impact_levels:
            highest_impact = max(impact_levels, key=lambda x: impact_priority.get(x, 0))
            insights.highest_impact_level = highest_impact
        
        urgency_priority = {'immediate': 4, 'high': 3, 'medium': 2, 'low': 1}
        if urgency_levels:
            peak_urgency = max(urgency_levels, key=lambda x: urgency_priority.get(x, 0))
            insights.peak_urgency_level = peak_urgency
        
        # Track dominant emotions
        emotion_counts = {}
        for emotion in all_emotions:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        # Get top 3 emotions
        dominant_emotions = sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        insights.dominant_emotions = [emotion for emotion, count in dominant_emotions]
        
        # Generate conversation phases
        message_count = user_messages.count()
        if message_count <= 2:
            phase = "opening"
        elif message_count <= 5:
            phase = "development"
        elif message_count <= 8:
            phase = "negotiation"
        else:
            phase = "closing"
        
        insights.conversation_phases = insights.conversation_phases + [phase] if phase not in insights.conversation_phases else insights.conversation_phases
        
        # Update summary
        insights.conversation_summary = f"Conversación en fase {phase} con {message_count} intercambios. " \
                                      f"Temas principales: {', '.join(insights.all_key_points[:3])}. " \
                                      f"Impacto: {insights.highest_impact_level}."
        
        insights.save()
        return insights
    
    def get_conversation_context(self, simulation: Simulation) -> Dict[str, Any]:
        """Get accumulated conversation context for AI reference"""
        
        try:
            insights = simulation.insights
        except ConversationInsights.DoesNotExist:
            return {'summary': 'No insights available'}
        
        return {
            'conversation_summary': insights.conversation_summary,
            'key_topics_discussed': insights.all_key_points,
            'financial_data_mentioned': insights.all_financial_mentions,
            'strategic_concepts_covered': insights.all_strategic_concepts,
            'stakeholders_involved': insights.all_stakeholders,
            'proposed_actions': insights.all_action_items,
            'concerns_raised': insights.all_concerns,
            'conversation_phase': insights.conversation_phases[-1] if insights.conversation_phases else 'opening',
            'business_impact_level': insights.highest_impact_level,
            'urgency_level': insights.peak_urgency_level,
            'emotional_tone_progression': insights.dominant_emotions
        }
    
    def semantic_search_insights(self, simulation: Simulation, query: str) -> Dict[str, Any]:
        """Semantic search through conversation insights"""
        
        query_lower = query.lower()
        results = {
            'relevant_key_points': [],
            'relevant_financial_data': [],
            'relevant_stakeholders': [],
            'relevant_actions': [],
            'relevant_concerns': []
        }
        
        try:
            insights = simulation.insights
            
            # Enhanced search logic
            financial_keywords = ['financiero', 'dinero', 'presupuesto', 'inversión', 'serie', 'usuarios', 'crecimiento']
            strategic_keywords = ['estrategia', 'plan', 'estratégico', 'expansión', 'roadmap']
            stakeholder_keywords = ['equipo', 'CEO', 'personas', 'stakeholder', 'google']
            summary_keywords = ['key findings', 'resumen', 'resumir', 'conclusiones', 'puntos clave', 'aspectos', 'temas']
            
            # If it's a summary/key findings request, return ALL available data
            if any(keyword in query_lower for keyword in summary_keywords):
                results['relevant_key_points'] = insights.all_key_points
                results['relevant_financial_data'] = insights.all_financial_mentions
                results['relevant_stakeholders'] = insights.all_stakeholders
                results['relevant_actions'] = insights.all_action_items
                results['relevant_concerns'] = insights.all_concerns
            else:
                # Search financial data
                if any(keyword in query_lower for keyword in financial_keywords):
                    results['relevant_financial_data'] = insights.all_financial_mentions
                
                # Search strategic concepts  
                if any(keyword in query_lower for keyword in strategic_keywords):
                    results['relevant_key_points'] = insights.all_strategic_concepts
                
                # Search stakeholders
                if any(keyword in query_lower for keyword in stakeholder_keywords):
                    results['relevant_stakeholders'] = insights.all_stakeholders
            
            # General search in all data
            for point in insights.all_key_points:
                if any(word in point.lower() for word in query_lower.split()):
                    results['relevant_key_points'].append(point)
            
            for financial in insights.all_financial_mentions:
                if any(word in financial.lower() for word in query_lower.split()):
                    results['relevant_financial_data'].append(financial)
            
            for stakeholder in insights.all_stakeholders:
                if any(word in stakeholder.lower() for word in query_lower.split()):
                    results['relevant_stakeholders'].append(stakeholder)
            
            # Remove duplicates
            results['relevant_key_points'] = list(set(results['relevant_key_points']))
            results['relevant_financial_data'] = list(set(results['relevant_financial_data']))
            results['relevant_stakeholders'] = list(set(results['relevant_stakeholders']))
            
            # Add context summary
            results['context_summary'] = insights.conversation_summary
            results['search_query'] = query
            
        except ConversationInsights.DoesNotExist:
            results['context_summary'] = 'No insights available for search'
        
        return results
    
    def can_ai_answer_about_insights(self, simulation: Simulation, user_question: str) -> Dict[str, Any]:
        """Check if AI can answer questions about previous insights"""
        
        question_lower = user_question.lower()
        
        # Check what type of insight question this is
        insight_type = None
        
        # Financial keywords (check first for specificity)
        if any(word in question_lower for word in ['financiero', 'financieras', 'dinero', 'presupuesto', 'costo', 'precio', 'valor', 'inversion', 
                                                  'serie a', 'funding', 'revenue', 'arr', '$', 'millones', 'k', 'ingresos', 'cifras',
                                                  'numeros', 'metricas', 'economico', 'economicos', 'monetario']):
            insight_type = 'financial'
        
        # Key findings/summary keywords (broader detection)
        elif any(word in question_lower for word in ['key findings', 'puntos clave', 'conclusiones', 'resumen', 
                                                    'resumir']):
            insight_type = 'key_points'
        
        # General conversation questions (broader detection)
        elif any(word in question_lower for word in ['discutido', 'hablado', 'conversacion', 'mencionado',
                                                    'aspectos', 'temas', 'cubierto', 'tratado']):
            insight_type = 'key_points'
        
        # Strategic keywords
        elif any(word in question_lower for word in ['estrategia', 'estrategico', 'plan', 'enfoque', 'vision', 
                                                    'mision', 'objetivos', 'metas', 'direccion']):
            insight_type = 'strategic'
        
        # Stakeholder keywords  
        elif any(word in question_lower for word in ['equipo', 'personas', 'stakeholder', 'cliente', 'usuario', 
                                                    'inversor', 'socio', 'partner', 'ceo', 'team']):
            insight_type = 'stakeholders'
        
        # Action keywords
        elif any(word in question_lower for word in ['acciones', 'pasos', 'implementar', 'hacer', 'ejecutar', 
                                                    'realizar', 'siguiente', 'proximos', 'plan de accion']):
            insight_type = 'actions'
        
        # Concern keywords
        elif any(word in question_lower for word in ['problemas', 'preocupaciones', 'riesgos', 'desafios', 
                                                    'dificultades', 'obstaculos', 'concerns', 'issues']):
            insight_type = 'concerns'
        
        # Catch-all for questions about previous conversation
        elif any(word in question_lower for word in ['anterior', 'anteriormente', 'antes', 'previo', 'pasado',
                                                    'discutimos', 'hablamos', 'mencionamos', 'dijimos']):
            insight_type = 'general'
        
        if insight_type:
            # Get relevant insights - simplified to avoid recursion
            try:
                insights = simulation.insights
                relevant_data = {
                    'relevant_key_points': insights.all_key_points[:5],
                    'relevant_financial_data': insights.all_financial_mentions[:5],
                    'relevant_stakeholders': insights.all_stakeholders[:5],
                    'relevant_actions': insights.all_action_items[:5],
                    'relevant_concerns': insights.all_concerns[:5],
                    'context_summary': insights.conversation_summary
                }
            except:
                relevant_data = {
                    'relevant_key_points': [],
                    'relevant_financial_data': [],
                    'relevant_stakeholders': [],
                    'relevant_actions': [],
                    'relevant_concerns': [],
                    'context_summary': 'No insights available'
                }
            
            return {
                'can_answer': True,
                'insight_type': insight_type,
                'relevant_data': relevant_data,
                'suggested_response_approach': f"Referirse a insights previos sobre {insight_type}"
            }
        
        return {
            'can_answer': False,
            'insight_type': None,
            'relevant_data': {},
            'suggested_response_approach': "Respuesta normal sin referencia a insights"
        }


# Global service instance
conversation_memory = ConversationMemoryService()
