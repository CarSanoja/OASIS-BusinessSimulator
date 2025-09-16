from typing import Dict, List, Any, Optional
from django.db.models import Avg, Count, Max, Min
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta
from .models import Simulation, Message, ConversationInsights
from ai_service.conversation_memory import conversation_memory
import json
import logging

logger = logging.getLogger(__name__)


class LiveMetricsService:
    """Service for calculating real-time metrics during conversations"""

    def get_live_metrics(self, simulation: Simulation) -> Dict[str, Any]:
        """Get all live metrics for the panel lateral"""

        # Cache key for this simulation's metrics
        cache_key = f"live_metrics_{simulation.id}_{simulation.messages.count()}"

        # Try to get from cache first (cache for 30 seconds)
        cached_metrics = cache.get(cache_key)
        if cached_metrics:
            logger.debug(f"Returning cached metrics for simulation {simulation.id}")
            return cached_metrics

        try:
            messages = simulation.messages.all().order_by('timestamp')
            user_messages = messages.filter(sender='user')
            ai_messages = messages.filter(sender='ai')

            # Basic session info
            duration_minutes = self._calculate_duration(simulation)

            # Core KPIs
            session_kpis = {
                'duration_minutes': duration_minutes,
                'total_messages': messages.count(),
                'user_messages': user_messages.count(),
                'ai_messages': ai_messages.count(),
                'objectives_progress': self._calculate_objectives_progress(simulation),
                'momentum': self._calculate_momentum(messages)
            }

            # Emotional intelligence metrics
            emotional_metrics = self._calculate_emotional_metrics(messages)

            # Business intelligence metrics
            business_metrics = self._calculate_business_metrics(user_messages)

            # Progress indicators
            progress_metrics = self._calculate_progress_metrics(simulation)

            metrics_result = {
                'session_kpis': session_kpis,
                'emotional_metrics': emotional_metrics,
                'business_metrics': business_metrics,
                'progress_metrics': progress_metrics,
                'last_updated': timezone.now().isoformat()
            }

            # Cache the result for 30 seconds
            cache.set(cache_key, metrics_result, 30)
            logger.debug(f"Cached metrics for simulation {simulation.id}")

            return metrics_result

        except Exception as e:
            logger.error(f"Error calculating live metrics for simulation {simulation.id}: {e}")
            # Return default metrics if calculation fails
            return {
                'session_kpis': {
                    'duration_minutes': self._calculate_duration(simulation),
                    'total_messages': simulation.messages.count(),
                    'user_messages': simulation.messages.filter(sender='user').count(),
                    'ai_messages': simulation.messages.filter(sender='ai').count(),
                    'objectives_progress': {'completed': 0, 'total': 0, 'percentage': 0, 'details': []},
                    'momentum': {'level': 'starting', 'trend': 'stable', 'score': 50}
                },
                'emotional_metrics': {
                    'emotional_tone': 50,
                    'tone_trend': 'stable',
                    'dominant_emotion': 'neutral',
                    'urgency_level': 'medium'
                },
                'business_metrics': {
                    'financial_mentions': [],
                    'stakeholders': [],
                    'risk_level': 'medium',
                    'business_impact': 'medium'
                },
                'progress_metrics': {
                    'engagement_level': 'medium',
                    'information_density': 'medium',
                    'decision_points': [],
                    'key_moments': []
                },
                'last_updated': timezone.now().isoformat(),
                'error': 'Error calculating metrics - using defaults'
            }

    def get_deep_analytics(self, simulation: Simulation) -> Dict[str, Any]:
        """Get comprehensive analytics for the detailed modal"""

        # Cache key for deep analytics (cache longer since it's more expensive)
        cache_key = f"deep_analytics_{simulation.id}_{simulation.messages.count()}"

        # Try to get from cache first (cache for 2 minutes)
        cached_analytics = cache.get(cache_key)
        if cached_analytics:
            logger.debug(f"Returning cached deep analytics for simulation {simulation.id}")
            return cached_analytics

        try:
            messages = simulation.messages.all().order_by('timestamp')
            user_messages = messages.filter(sender='user')

            # Conversation flow analysis
            conversation_flow = self._analyze_conversation_flow(messages)

            # Business intelligence deep dive
            business_intelligence = self._analyze_business_intelligence(user_messages)

            # Performance coaching
            performance_coaching = self._analyze_performance_coaching(simulation)

            # Advanced metrics
            advanced_metrics = self._calculate_advanced_metrics(simulation)

            analytics_result = {
                'conversation_flow': conversation_flow,
                'business_intelligence': business_intelligence,
                'performance_coaching': performance_coaching,
                'advanced_metrics': advanced_metrics,
                'generated_at': timezone.now().isoformat()
            }

            # Cache the result for 2 minutes
            cache.set(cache_key, analytics_result, 120)
            logger.debug(f"Cached deep analytics for simulation {simulation.id}")

            return analytics_result

        except Exception as e:
            logger.error(f"Error calculating deep analytics for simulation {simulation.id}: {e}")
            # Return default analytics if calculation fails
            return {
                'conversation_flow': {
                    'emotional_journey': [],
                    'decision_points': [],
                    'communication_quality': {'overall_score': 50, 'data_driven': 0, 'strategic': 0, 'stakeholder_awareness': 0}
                },
                'business_intelligence': {
                    'financial_landscape': {'valuation_discussed': [], 'metrics_mentioned': [], 'funding_mentions': []},
                    'strategic_themes': [],
                    'risk_assessment': []
                },
                'performance_coaching': {
                    'strengths': [],
                    'growth_opportunities': ['Continuar practicando para mejorar análisis'],
                    'ai_insights': ['Error en análisis - datos insuficientes'],
                    'recommendations': ['Repetir simulación para obtener mejor análisis']
                },
                'advanced_metrics': {
                    'total_insights_captured': 0,
                    'avg_response_quality': 50,
                    'conversation_depth_score': 30,
                    'strategic_thinking_score': 40
                },
                'generated_at': timezone.now().isoformat(),
                'error': 'Error calculating analytics - using defaults'
            }

    def _calculate_duration(self, simulation: Simulation) -> int:
        """Calculate session duration in minutes"""
        now = timezone.now()
        duration = now - simulation.started_at
        return int(duration.total_seconds() / 60)

    def _calculate_objectives_progress(self, simulation: Simulation) -> Dict[str, Any]:
        """Calculate progress towards objectives"""
        if simulation.scenario:
            objectives = simulation.scenario.objectives or []
        else:
            objectives = simulation.custom_simulation.user_objectives or []

        if not objectives:
            return {'completed': 0, 'total': 0, 'percentage': 0, 'details': []}

        # Get progress from LLM analysis
        user_messages = simulation.messages.filter(sender='user')
        completed_objectives = 0
        objective_details = []

        for i, objective in enumerate(objectives):
            # Analyze if objective is progressing based on conversation
            progress_percentage = self._analyze_objective_progress(objective, user_messages)
            is_completed = progress_percentage >= 80

            if is_completed:
                completed_objectives += 1

            objective_details.append({
                'text': objective,
                'progress_percentage': progress_percentage,
                'is_completed': is_completed,
                'status': 'completed' if is_completed else 'in_progress' if progress_percentage > 30 else 'pending'
            })

        return {
            'completed': completed_objectives,
            'total': len(objectives),
            'percentage': int((completed_objectives / len(objectives)) * 100) if objectives else 0,
            'details': objective_details
        }

    def _calculate_momentum(self, messages) -> Dict[str, Any]:
        """Calculate conversation momentum"""
        if messages.count() < 2:
            return {'level': 'starting', 'trend': 'stable', 'score': 50}

        recent_messages = messages.order_by('-timestamp')[:4]

        # Calculate based on message frequency and length
        total_length = sum(len(msg.content) for msg in recent_messages)
        avg_length = total_length / recent_messages.count()

        # Calculate momentum score
        momentum_score = min(100, max(0, int(avg_length / 2 + messages.count() * 5)))

        if momentum_score >= 80:
            level = 'high'
            trend = 'accelerating'
        elif momentum_score >= 60:
            level = 'medium'
            trend = 'steady'
        elif momentum_score >= 40:
            level = 'low'
            trend = 'steady'
        else:
            level = 'starting'
            trend = 'building'

        return {
            'level': level,
            'trend': trend,
            'score': momentum_score
        }

    def _calculate_emotional_metrics(self, messages) -> Dict[str, Any]:
        """Calculate emotional intelligence metrics"""
        ai_messages = messages.filter(sender='ai').exclude(emotion__isnull=True)

        if not ai_messages.exists():
            return {
                'emotional_tone': 50,
                'tone_trend': 'stable',
                'dominant_emotion': 'neutral',
                'urgency_level': 'medium'
            }

        # Analyze emotion progression
        emotions = list(ai_messages.values_list('emotion', flat=True))

        # Calculate emotional tone score
        emotion_scores = {
            'positive': 80,
            'confident': 75,
            'collaborative': 70,
            'neutral': 50,
            'hesitant': 40,
            'skeptical': 30,
            'negative': 20,
            'frustrated': 15,
            'aggressive': 10
        }

        recent_emotions = emotions[-3:] if len(emotions) >= 3 else emotions
        emotional_tone = sum(emotion_scores.get(emotion, 50) for emotion in recent_emotions) / len(recent_emotions)

        # Determine trend
        if len(emotions) >= 2:
            early_avg = sum(emotion_scores.get(e, 50) for e in emotions[:len(emotions)//2]) / max(1, len(emotions)//2)
            recent_avg = sum(emotion_scores.get(e, 50) for e in emotions[len(emotions)//2:]) / max(1, len(emotions) - len(emotions)//2)

            if recent_avg > early_avg + 10:
                tone_trend = 'improving'
            elif recent_avg < early_avg - 10:
                tone_trend = 'declining'
            else:
                tone_trend = 'stable'
        else:
            tone_trend = 'stable'

        # Determine dominant emotion
        from collections import Counter
        emotion_counts = Counter(emotions)
        dominant_emotion = emotion_counts.most_common(1)[0][0] if emotion_counts else 'neutral'

        # Calculate urgency level
        user_messages = messages.filter(sender='user')
        urgency_keywords = ['urgente', 'inmediatamente', 'ya', 'rápido', 'pronto']
        urgency_mentions = sum(1 for msg in user_messages if any(word in msg.content.lower() for word in urgency_keywords))

        if urgency_mentions >= 2:
            urgency_level = 'high'
        elif urgency_mentions >= 1:
            urgency_level = 'medium'
        else:
            urgency_level = 'low'

        return {
            'emotional_tone': int(emotional_tone),
            'tone_trend': tone_trend,
            'dominant_emotion': dominant_emotion,
            'urgency_level': urgency_level
        }

    def _calculate_business_metrics(self, user_messages) -> Dict[str, Any]:
        """Calculate business intelligence metrics"""
        financial_mentions = []
        stakeholders = set()
        risk_level = 'low'

        for message in user_messages:
            # Extract financial mentions from stored analysis
            if message.financial_mentions:
                financial_mentions.extend(message.financial_mentions)

            # Extract stakeholders
            if message.stakeholders_mentioned:
                stakeholders.update(message.stakeholders_mentioned)

            # Assess risk level
            if message.business_impact_level in ['high', 'critical']:
                risk_level = 'high'
            elif message.business_impact_level == 'medium' and risk_level == 'low':
                risk_level = 'medium'

        return {
            'financial_mentions': list(set(financial_mentions))[:5],  # Top 5 unique mentions
            'stakeholders': list(stakeholders)[:5],  # Top 5 stakeholders
            'risk_level': risk_level,
            'business_impact': self._calculate_overall_business_impact(user_messages)
        }

    def _calculate_progress_metrics(self, simulation: Simulation) -> Dict[str, Any]:
        """Calculate progress indicators"""
        messages = simulation.messages.all()
        user_messages = messages.filter(sender='user')

        # Calculate engagement level
        if user_messages.count() == 0:
            engagement = 'low'
        elif user_messages.count() >= 5:
            engagement = 'high'
        else:
            engagement = 'medium'

        # Calculate information density
        total_chars = sum(len(msg.content) for msg in user_messages)
        avg_message_length = total_chars / max(1, user_messages.count())

        if avg_message_length >= 100:
            info_density = 'high'
        elif avg_message_length >= 50:
            info_density = 'medium'
        else:
            info_density = 'low'

        return {
            'engagement_level': engagement,
            'information_density': info_density,
            'decision_points': self._identify_decision_points(messages),
            'key_moments': self._identify_key_moments(messages)
        }

    def _analyze_objective_progress(self, objective: str, user_messages) -> int:
        """Analyze progress towards a specific objective"""
        objective_lower = objective.lower()
        progress_score = 0

        for message in user_messages:
            msg_lower = message.content.lower()

            # Check for objective-related keywords
            objective_words = objective_lower.split()
            matches = sum(1 for word in objective_words if word in msg_lower)
            if matches > 0:
                progress_score += min(30, matches * 10)

            # Check for completion indicators
            completion_words = ['acepto', 'de acuerdo', 'perfecto', 'listo', 'completado']
            if any(word in msg_lower for word in completion_words):
                progress_score += 40

            # Check for progress indicators
            progress_words = ['propongo', 'sugiero', 'plan', 'estrategia']
            if any(word in msg_lower for word in progress_words):
                progress_score += 20

        return min(100, progress_score)

    def _calculate_overall_business_impact(self, user_messages) -> str:
        """Calculate overall business impact level"""
        impact_levels = [msg.business_impact_level for msg in user_messages if msg.business_impact_level]

        if not impact_levels:
            return 'medium'

        if 'critical' in impact_levels:
            return 'critical'
        elif 'high' in impact_levels:
            return 'high'
        elif 'medium' in impact_levels:
            return 'medium'
        else:
            return 'low'

    def _identify_decision_points(self, messages) -> List[Dict[str, Any]]:
        """Identify key decision points in the conversation"""
        decision_points = []

        for i, message in enumerate(messages.filter(sender='user')):
            msg_lower = message.content.lower()

            # Look for decision indicators
            decision_words = ['acepto', 'rechazo', 'propongo', 'acepto', 'no acepto']
            if any(word in msg_lower for word in decision_words):
                decision_points.append({
                    'timestamp': message.timestamp.isoformat(),
                    'message_preview': message.content[:50] + '...' if len(message.content) > 50 else message.content,
                    'type': 'decision',
                    'impact': 'high' if any(word in msg_lower for word in ['acepto', 'rechazo']) else 'medium'
                })

        return decision_points[-3:]  # Return last 3 decision points

    def _identify_key_moments(self, messages) -> List[Dict[str, Any]]:
        """Identify key moments in the conversation"""
        key_moments = []

        user_messages = list(messages.filter(sender='user'))

        if user_messages:
            # First message is always a key moment
            first_msg = user_messages[0]
            key_moments.append({
                'timestamp': first_msg.timestamp.isoformat(),
                'message_preview': first_msg.content[:50] + '...' if len(first_msg.content) > 50 else first_msg.content,
                'type': 'opening',
                'significance': 'Estableció el tono inicial de la conversación'
            })

            # Look for turning points
            for i, message in enumerate(user_messages[1:], 1):
                # Look for emotional shifts or important mentions
                if (message.financial_mentions and len(message.financial_mentions) > 0) or \
                   (message.business_impact_level in ['high', 'critical']):
                    key_moments.append({
                        'timestamp': message.timestamp.isoformat(),
                        'message_preview': message.content[:50] + '...' if len(message.content) > 50 else message.content,
                        'type': 'breakthrough',
                        'significance': 'Momento de alto impacto empresarial'
                    })

            # Latest message is recent key moment
            if len(user_messages) > 1:
                last_msg = user_messages[-1]
                key_moments.append({
                    'timestamp': last_msg.timestamp.isoformat(),
                    'message_preview': last_msg.content[:50] + '...' if len(last_msg.content) > 50 else last_msg.content,
                    'type': 'latest',
                    'significance': 'Dirección actual de la conversación'
                })

        return key_moments[-3:]  # Return last 3 key moments

    # Deep Analytics Methods
    def _analyze_conversation_flow(self, messages) -> Dict[str, Any]:
        """Analyze conversation flow for deep analytics"""
        ai_messages = messages.filter(sender='ai').exclude(emotion__isnull=True)

        # Emotional journey
        emotional_journey = []
        for msg in ai_messages:
            emotional_journey.append({
                'timestamp': msg.timestamp.isoformat(),
                'emotion': msg.emotion,
                'message_preview': msg.content[:30] + '...' if len(msg.content) > 30 else msg.content
            })

        # Key decision points (detailed)
        decision_points = self._get_detailed_decision_points(messages)

        # Communication quality score
        comm_quality = self._calculate_communication_quality(messages)

        return {
            'emotional_journey': emotional_journey,
            'decision_points': decision_points,
            'communication_quality': comm_quality
        }

    def _analyze_business_intelligence(self, user_messages) -> Dict[str, Any]:
        """Deep business intelligence analysis"""
        # Financial landscape
        financial_data = self._analyze_financial_landscape(user_messages)

        # Strategic themes evolution
        strategic_themes = self._analyze_strategic_themes(user_messages)

        # Risk assessment
        risk_assessment = self._analyze_risks(user_messages)

        return {
            'financial_landscape': financial_data,
            'strategic_themes': strategic_themes,
            'risk_assessment': risk_assessment
        }

    def _analyze_performance_coaching(self, simulation: Simulation) -> Dict[str, Any]:
        """Performance coaching analysis"""
        user_messages = simulation.messages.filter(sender='user')

        # Strengths demonstrated
        strengths = self._identify_strengths(user_messages)

        # Growth opportunities
        growth_opportunities = self._identify_growth_opportunities(user_messages)

        # AI insights
        ai_insights = self._generate_ai_insights(simulation)

        # Next session recommendations
        recommendations = self._generate_recommendations(simulation)

        return {
            'strengths': strengths,
            'growth_opportunities': growth_opportunities,
            'ai_insights': ai_insights,
            'recommendations': recommendations
        }

    def _calculate_advanced_metrics(self, simulation: Simulation) -> Dict[str, Any]:
        """Calculate advanced metrics for deep analytics"""
        messages = simulation.messages.all()

        return {
            'total_insights_captured': messages.filter(sender='user').exclude(llm_analysis={}).count(),
            'avg_response_quality': self._calculate_avg_response_quality(messages.filter(sender='user')),
            'conversation_depth_score': self._calculate_conversation_depth(messages),
            'strategic_thinking_score': self._calculate_strategic_thinking_score(messages.filter(sender='user'))
        }

    # Helper methods for deep analytics
    def _get_detailed_decision_points(self, messages) -> List[Dict[str, Any]]:
        """Get detailed decision points with analysis"""
        decision_points = []
        user_messages = messages.filter(sender='user')

        for i, msg in enumerate(user_messages):
            if any(word in msg.content.lower() for word in ['acepto', 'propongo', 'sugiero', 'rechazo']):
                elapsed_time = int((msg.timestamp - messages.first().timestamp).total_seconds() / 60)
                decision_points.append({
                    'time': f"{elapsed_time}min",
                    'message': msg.content[:50] + '...' if len(msg.content) > 50 else msg.content,
                    'impact': 'positive' if any(word in msg.content.lower() for word in ['acepto', 'propongo']) else 'neutral',
                    'analysis': 'Decisión estratégica que movió la conversación hacia adelante'
                })

        return decision_points

    def _calculate_communication_quality(self, messages) -> Dict[str, Any]:
        """Calculate communication quality metrics"""
        user_messages = messages.filter(sender='user')

        if not user_messages.exists():
            return {'overall_score': 50, 'data_driven': 0, 'strategic': 0, 'stakeholder_awareness': 0}

        # Data-driven score
        financial_mentions = sum(len(msg.financial_mentions) for msg in user_messages if msg.financial_mentions)

        # Strategic score
        strategic_mentions = sum(len(msg.strategic_concepts) for msg in user_messages if msg.strategic_concepts)

        # Stakeholder awareness
        stakeholder_mentions = sum(len(msg.stakeholders_mentioned) for msg in user_messages if msg.stakeholders_mentioned)

        # Overall score calculation
        msg_count = user_messages.count()
        overall_score = min(100, 60 + (financial_mentions * 5) + (strategic_mentions * 3) + (stakeholder_mentions * 2))

        return {
            'overall_score': int(overall_score),
            'data_driven': financial_mentions,
            'strategic': strategic_mentions,
            'stakeholder_awareness': stakeholder_mentions
        }

    def _analyze_financial_landscape(self, user_messages) -> Dict[str, Any]:
        """Analyze financial landscape mentioned"""
        all_financial = []
        for msg in user_messages:
            if msg.financial_mentions:
                all_financial.extend(msg.financial_mentions)

        return {
            'valuation_discussed': list(set(m for m in all_financial if '$' in m))[:3],
            'metrics_mentioned': list(set(m for m in all_financial if any(word in m.lower() for word in ['usuarios', 'growth', '%'])))[:5],
            'funding_mentions': list(set(m for m in all_financial if 'serie' in m.lower()))[:2]
        }

    def _analyze_strategic_themes(self, user_messages) -> List[Dict[str, Any]]:
        """Analyze strategic themes evolution"""
        themes = {}

        for msg in user_messages:
            if msg.strategic_concepts:
                for concept in msg.strategic_concepts:
                    if concept not in themes:
                        themes[concept] = 0
                    themes[concept] += 1

        # Convert to list sorted by frequency
        theme_list = []
        for theme, count in sorted(themes.items(), key=lambda x: x[1], reverse=True):
            theme_list.append({
                'theme': theme,
                'frequency': count,
                'prominence': 'high' if count >= 3 else 'medium' if count >= 2 else 'low'
            })

        return theme_list[:5]  # Top 5 themes

    def _analyze_risks(self, user_messages) -> List[Dict[str, Any]]:
        """Analyze risk factors mentioned"""
        risks = []

        for msg in user_messages:
            if msg.concerns_raised:
                for concern in msg.concerns_raised:
                    risks.append({
                        'risk': concern,
                        'level': msg.business_impact_level or 'medium',
                        'mentioned_times': 1  # Could be improved to count across messages
                    })

        # Add some default risks based on content analysis
        risk_keywords = {
            'competencia': 'riesgo competitivo',
            'tiempo': 'riesgo temporal',
            'presupuesto': 'riesgo financiero'
        }

        for msg in user_messages:
            for keyword, risk_type in risk_keywords.items():
                if keyword in msg.content.lower():
                    risks.append({
                        'risk': risk_type,
                        'level': 'medium',
                        'mentioned_times': 1
                    })

        return risks[:5]  # Top 5 risks

    def _identify_strengths(self, user_messages) -> List[Dict[str, str]]:
        """Identify user strengths"""
        strengths = []

        # Analyze based on message characteristics
        if any(len(msg.financial_mentions) > 0 for msg in user_messages if msg.financial_mentions):
            strengths.append({
                'strength': 'Excelente preparación con datos específicos',
                'score': '9/10'
            })

        if any(len(msg.strategic_concepts) > 2 for msg in user_messages if msg.strategic_concepts):
            strengths.append({
                'strength': 'Pensamiento estratégico profundo',
                'score': '8/10'
            })

        if user_messages.count() >= 3:
            strengths.append({
                'strength': 'Comunicación sostenida y profesional',
                'score': '8/10'
            })

        return strengths[:5]

    def _identify_growth_opportunities(self, user_messages) -> List[str]:
        """Identify growth opportunities"""
        opportunities = []

        # Analyze gaps
        avg_length = sum(len(msg.content) for msg in user_messages) / max(1, user_messages.count())
        if avg_length < 50:
            opportunities.append('Desarrollar respuestas más detalladas y específicas')

        financial_msgs = sum(1 for msg in user_messages if msg.financial_mentions)
        if financial_msgs < user_messages.count() * 0.3:
            opportunities.append('Incorporar más datos financieros y métricas')

        if user_messages.count() < 3:
            opportunities.append('Mantener conversaciones más extensas para mejor práctica')

        return opportunities[:3]

    def _generate_ai_insights(self, simulation: Simulation) -> List[str]:
        """Generate AI insights about the conversation"""
        messages = simulation.messages.all()
        user_messages = messages.filter(sender='user')

        insights = []

        if user_messages.count() >= 2:
            insights.append('Usuario demostró progresión natural en la conversación')

        if any(msg.business_impact_level == 'high' for msg in user_messages):
            insights.append('Mensajes de alto impacto empresarial identificados')

        if any(len(msg.financial_mentions) > 0 for msg in user_messages if msg.financial_mentions):
            insights.append('Excelente uso de datos financieros para respaldar argumentos')

        return insights[:3]

    def _generate_recommendations(self, simulation: Simulation) -> List[str]:
        """Generate recommendations for next session"""
        recommendations = [
            'Practicar escenarios de mayor complejidad',
            'Desarrollar técnicas de manejo de objeciones',
            'Fortalecer storytelling empresarial'
        ]

        return recommendations[:3]

    def _calculate_avg_response_quality(self, user_messages) -> int:
        """Calculate average response quality"""
        if not user_messages.exists():
            return 50

        quality_scores = []
        for msg in user_messages:
            score = 60  # Base score

            # Add points for financial mentions
            if msg.financial_mentions:
                score += len(msg.financial_mentions) * 5

            # Add points for strategic concepts
            if msg.strategic_concepts:
                score += len(msg.strategic_concepts) * 3

            # Add points for message length
            if len(msg.content) > 100:
                score += 10
            elif len(msg.content) > 50:
                score += 5

            quality_scores.append(min(100, score))

        return int(sum(quality_scores) / len(quality_scores))

    def _calculate_conversation_depth(self, messages) -> int:
        """Calculate conversation depth score"""
        user_messages = messages.filter(sender='user')

        if not user_messages.exists():
            return 30

        depth_score = user_messages.count() * 10  # Base on message count

        # Add for complexity indicators
        complex_msgs = sum(1 for msg in user_messages if len(msg.content) > 100)
        depth_score += complex_msgs * 5

        # Add for business concepts
        business_msgs = sum(1 for msg in user_messages if msg.business_impact_level in ['high', 'critical'])
        depth_score += business_msgs * 10

        return min(100, depth_score)

    def _calculate_strategic_thinking_score(self, user_messages) -> int:
        """Calculate strategic thinking score"""
        if not user_messages.exists():
            return 40

        strategic_score = 40  # Base score

        # Count strategic indicators
        strategic_indicators = 0
        for msg in user_messages:
            if msg.strategic_concepts:
                strategic_indicators += len(msg.strategic_concepts)

        strategic_score += strategic_indicators * 5

        # Bonus for consistent strategic thinking
        strategic_msgs = sum(1 for msg in user_messages if msg.strategic_concepts)
        if strategic_msgs >= user_messages.count() * 0.5:
            strategic_score += 15

        return min(100, strategic_score)


# Global service instance
live_metrics_service = LiveMetricsService()