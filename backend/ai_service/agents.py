import os
import random
from typing import Dict, List, Any, Optional
from dataclasses import dataclass


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


class SimpleAIService:
    """Simplified AI service for basic functionality"""
    
    def __init__(self):
        self.response_templates = {
            'merger-negotiation': [
                "Interesante propuesta. Sin embargo, necesito ver números más específicos sobre el ROI proyectado. ¿Qué métricas concretas pueden demostrar el valor de esta adquisición?",
                "Me preocupa el timeline propuesto. En mi experiencia, las integraciones de este tipo toman al menos 12-18 meses. ¿Cómo planean acelerar el proceso?",
                "Los términos financieros parecen razonables, pero necesito entender mejor la estructura de governance post-adquisición. ¿Qué nivel de autonomía mantendrá el equipo actual?",
                "Excelente análisis del mercado. Sin embargo, ¿han considerado el impacto de la regulación financiera en los próximos 24 meses? Esto podría afectar significativamente las proyecciones."
            ],
            'crisis-leadership': [
                "CEO, la situación está escalando rápidamente. Los medios están pidiendo declaraciones y nuestros stakeholders principales están preocupados. ¿Cuál es nuestra estrategia de comunicación inmediata?",
                "Entiendo la necesidad de transparencia, pero debemos ser estratégicos. ¿Cómo vamos a manejar la narrativa para minimizar el daño reputacional mientras resolvemos el problema?",
                "La junta directiva está nerviosa y algunos miembros sugieren traer consultoría externa. ¿Cómo respondemos a esta presión mientras mantenemos el control interno?",
                "Me parece una estrategia sólida. ¿Qué recursos necesitamos para implementarla efectivamente y cuál es el timeline realista para ver resultados?"
            ],
            'startup-pitch': [
                "La oportunidad de mercado es interesante, pero necesito ver más tracción. ¿Cuáles son sus métricas de retención de usuarios y cuál es su costo de adquisición de clientes?",
                "El modelo de negocio tiene potencial, pero LATAM es un mercado complejo. ¿Cómo van a manejar las diferencias regulatorias entre países?",
                "Me gusta el equipo y la visión, pero la valoración parece alta para su etapa. ¿Estarían abiertos a discutir términos más conservadores?",
                "Impresionante progreso hasta ahora. ¿Cuál es su estrategia para escalar y cuándo esperan necesitar la próxima ronda de financiamiento?"
            ],
            'default': [
                "Entiendo su punto de vista. ¿Podría elaborar más sobre los aspectos específicos que considera más importantes?",
                "Interesante propuesta. Sin embargo, me gustaría conocer más detalles sobre la implementación práctica.",
                "Esa es una perspectiva válida. ¿Cómo ve usted que esto se alinea con nuestros objetivos estratégicos?",
                "Necesito más información para tomar una decisión informada. ¿Qué datos adicionales puede proporcionar?"
            ]
        }
    
    def generate_response(self, state: SimulationState) -> str:
        """Generate a contextual response based on the scenario"""
        scenario_id = self._detect_scenario_type(state.scenario_context)
        responses = self.response_templates.get(scenario_id, self.response_templates['default'])
        
        # Select response based on conversation length
        message_count = len([msg for msg in state.messages if msg.startswith('User:')])
        response_index = min(message_count - 1, len(responses) - 1)
        
        return responses[response_index]
    
    def _detect_scenario_type(self, context: str) -> str:
        """Detect scenario type based on context keywords"""
        context_lower = context.lower()
        
        if any(word in context_lower for word in ['fusión', 'adquisición', 'merger', 'm&a']):
            return 'merger-negotiation'
        elif any(word in context_lower for word in ['crisis', 'reputación', 'problema']):
            return 'crisis-leadership'
        elif any(word in context_lower for word in ['pitch', 'inversión', 'startup', 'financiamiento']):
            return 'startup-pitch'
        else:
            return 'default'
    
    def analyze_emotion(self, message: str) -> str:
        """Simple emotion analysis based on keywords"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['excelente', 'perfecto', 'acepto', 'de acuerdo']):
            return 'positive'
        elif any(word in message_lower for word in ['no', 'rechazo', 'imposible', 'problema']):
            return 'skeptical'
        else:
            return 'neutral'
    
    def generate_embedding(self, text: str) -> List[float]:
        """Simple embedding generation (placeholder)"""
        # For now, return a simple hash-based embedding
        import hashlib
        hash_obj = hashlib.md5(text.encode())
        hash_hex = hash_obj.hexdigest()
        
        # Convert to float array (simplified)
        embedding = []
        for i in range(0, min(len(hash_hex), 32), 2):
            embedding.append(float(int(hash_hex[i:i+2], 16)) / 255.0)
        
        # Pad to 1536 dimensions with zeros
        while len(embedding) < 1536:
            embedding.append(0.0)
        
        return embedding[:1536]


class SimulationAgent:
    def __init__(self):
        self.ai_service = SimpleAIService()
    
    def process_message(self, state: SimulationState) -> Dict[str, Any]:
        """Process a message and return AI response"""
        try:
            # Generate response
            response = self.ai_service.generate_response(state)
            
            # Analyze emotion from last user message
            last_user_message = ""
            for msg in reversed(state.messages):
                if msg.startswith('User:'):
                    last_user_message = msg[5:]  # Remove 'User:' prefix
                    break
            
            emotion = self.ai_service.analyze_emotion(last_user_message)
            
            # Simple objective progress tracking
            objective_progress = {}
            if any(word in last_user_message.lower() for word in ['acuerdo', 'acepto', 'sí']):
                # Mark first objective as completed
                if state.user_objectives:
                    objective_progress[state.user_objectives[0]] = True
            
            return {
                "response": response,
                "emotion": emotion,
                "objective_progress": objective_progress
            }
            
        except Exception as e:
            return {
                "response": "Disculpe, podría repetir su propuesta? Me gustaría entender mejor su perspectiva.",
                "emotion": "neutral",
                "objective_progress": {}
            }


# Create a simple AI router class for compatibility
class AIModelRouter:
    def __init__(self):
        self.ai_service = SimpleAIService()
    
    def generate_embedding(self, text: str) -> List[float]:
        return self.ai_service.generate_embedding(text)


# Singleton instance
simulation_agent = SimulationAgent()