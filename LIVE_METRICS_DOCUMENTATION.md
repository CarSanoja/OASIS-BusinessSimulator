# 📊 Sistema de Métricas en Tiempo Real - OASIS

## 🎯 Descripción General

El sistema de métricas en tiempo real de OASIS proporciona análisis avanzado de conversaciones durante las simulaciones ejecutivas, ofreciendo insights instantáneos y análisis profundo post-conversación.

## 🏗️ Arquitectura

### Backend
- **Servicio de Métricas** (`metrics_service.py`): Motor de análisis centralizado
- **Endpoints REST**: API endpoints para datos en tiempo real
- **Cache Redis**: Optimización de rendimiento con cache inteligente
- **Integración LLM**: Análisis avanzado usando modelos de lenguaje

### Frontend
- **LiveMetricsPanel**: Panel lateral en tiempo real
- **DeepAnalyticsModal**: Modal de análisis profundo
- **Auto-refresh**: Actualización automática cada 10 segundos

## 📈 Funcionalidades Implementadas

### 🔴 Panel Lateral (Tiempo Real)

#### **1. Session KPIs**
- **Duración**: Tiempo transcurrido desde inicio
- **Mensajes**: Conteo total, usuario y AI
- **Objetivos**: Progreso hacia objetivos del escenario
- **Momentum**: Nivel de intensidad de la conversación

#### **2. Inteligencia Emocional**
- **Clima Emocional**: Porcentaje de tono positivo/negativo (0-100%)
- **Tendencia**: Improving, stable, declining
- **Emoción Dominante**: Confident, positive, neutral, skeptical, etc.
- **Nivel de Urgencia**: Low, medium, high

#### **3. Business Intelligence**
- **Menciones Financieras**: $14M, Serie A, 50K usuarios, etc.
- **Stakeholders**: CEO, equipo, usuarios, inversores
- **Nivel de Riesgo**: Low, medium, high
- **Impacto Empresarial**: Critical, high, medium, low

#### **4. Progreso Detallado**
- **Lista de Objetivos**: Estado individual de cada objetivo
- **Porcentaje de Completitud**: 0-100% por objetivo
- **Indicadores Visuales**: Checkmarks, progress bars

### 🔍 Modal de Análisis Profundo

#### **Tab 1: Conversation Flow**
- **Viaje Emocional**: Timeline de cambios emocionales
- **Puntos de Decisión**: Momentos clave con análisis de impacto
- **Calidad de Comunicación**: Score general + métricas específicas

#### **Tab 2: Business Intelligence**
- **Panorama Financiero**: Valuaciones, métricas, funding discutido
- **Temas Estratégicos**: Evolución y frecuencia de conceptos
- **Evaluación de Riesgos**: Riesgos identificados con nivel

#### **Tab 3: Performance Coaching**
- **Fortalezas Demostradas**: Puntos fuertes con scores
- **Oportunidades de Crecimiento**: Áreas de mejora
- **Insights de IA**: Análisis generado por LLM
- **Recomendaciones**: Próximos pasos sugeridos

## 🛠️ Implementación Técnica

### Endpoints API

#### `GET /api/simulations/{id}/live_metrics/`
**Propósito**: Métricas en tiempo real para panel lateral
**Cache**: 30 segundos
**Validaciones**:
- Usuario es propietario de la simulación
- Retorna métricas básicas si no hay mensajes

```json
{
  "session_kpis": {
    "duration_minutes": 15,
    "total_messages": 8,
    "objectives_progress": {
      "completed": 2,
      "total": 4,
      "percentage": 50,
      "details": [...]
    },
    "momentum": {
      "level": "high",
      "trend": "accelerating",
      "score": 85
    }
  },
  "emotional_metrics": {
    "emotional_tone": 75,
    "tone_trend": "improving",
    "dominant_emotion": "confident",
    "urgency_level": "medium"
  },
  "business_metrics": {
    "financial_mentions": ["$14M", "Serie A"],
    "stakeholders": ["CEO", "Equipo técnico"],
    "risk_level": "medium",
    "business_impact": "high"
  },
  "progress_metrics": {
    "engagement_level": "high",
    "information_density": "high",
    "decision_points": [...],
    "key_moments": [...]
  }
}
```

#### `GET /api/simulations/{id}/deep_analytics/`
**Propósito**: Análisis profundo para modal
**Cache**: 2 minutos
**Validaciones**:
- Usuario es propietario de la simulación
- Mínimo 2 mensajes de usuario requeridos

```json
{
  "conversation_flow": {
    "emotional_journey": [...],
    "decision_points": [...],
    "communication_quality": {
      "overall_score": 87,
      "data_driven": 9,
      "strategic": 12,
      "stakeholder_awareness": 7
    }
  },
  "business_intelligence": {
    "financial_landscape": {...},
    "strategic_themes": [...],
    "risk_assessment": [...]
  },
  "performance_coaching": {
    "strengths": [...],
    "growth_opportunities": [...],
    "ai_insights": [...],
    "recommendations": [...]
  },
  "advanced_metrics": {
    "avg_response_quality": 79,
    "conversation_depth_score": 85,
    "strategic_thinking_score": 78
  }
}
```

### Componentes Frontend

#### `LiveMetricsPanel.tsx`
```typescript
interface LiveMetricsPanelProps {
  simulationId: number;
  onViewDeepAnalytics: () => void;
  onRefresh?: () => void;
}
```
**Características**:
- Auto-refresh cada 10 segundos
- Diseño responsivo (oculto en móviles)
- Estados de loading y error
- 4 secciones organizadas con gradientes

#### `DeepAnalyticsModal.tsx`
```typescript
interface DeepAnalyticsModalProps {
  simulationId: number;
  isOpen: boolean;
  onClose: () => void;
}
```
**Características**:
- Modal overlay de pantalla completa
- 3 tabs navegables
- Scroll interno para contenido extenso
- Botón de exportar (futuro)

## 🚀 Optimizaciones Implementadas

### **Cache Inteligente**
- **Live Metrics**: Cache 30 segundos (frecuencia alta)
- **Deep Analytics**: Cache 2 minutos (análisis costoso)
- **Cache Key**: Incluye ID simulación + número de mensajes

### **Error Handling**
- **Fallbacks Graceful**: Métricas por defecto si falla cálculo
- **Validaciones de Entrada**: Verificación de permisos y datos
- **Logging Detallado**: Para debugging y monitoreo

### **Performance**
- **Queries Optimizadas**: Filtros eficientes en BD
- **Paginación Implícita**: Límites en listas largas
- **Cálculos Incrementales**: Evita recálculos innecesarios

## 🎨 UX/UI Design

### **Panel Lateral**
- **280px** width en desktop, oculto en móvil
- **Gradientes sutiles** para diferenciación visual
- **Iconografía consistente** con Lucide icons
- **Typography scale** responsiva (xs/sm/base)

### **Modal Profundo**
- **6xl max-width** (1152px) para contenido extenso
- **90vh height** para maximizar espacio
- **Color coding** para tipos de métricas
- **Badges dinámicos** basados en nivel de impacto

## 📊 Métricas Calculadas

### **60+ Métricas Disponibles**

#### **Tiempo Real (Panel)**
1. **Sesión**: Duración, mensajes, momentum
2. **Emocional**: Tono, tendencia, urgencia
3. **Business**: Financiero, stakeholders, riesgo
4. **Progreso**: Objetivos, engagement, densidad

#### **Análisis Profundo (Modal)**
1. **Flujo**: Viaje emocional, decisiones, calidad
2. **Inteligencia**: Financiero, temas, riesgos
3. **Coaching**: Fortalezas, crecimiento, IA insights
4. **Avanzadas**: Calidad, profundidad, estrategia

## 🔧 Configuración y Deployment

### **Variables de Entorno**
```bash
# Cache (Redis requerido para producción)
REDIS_URL=redis://localhost:6379

# Logging level
LOG_LEVEL=INFO

# Cache timeout (segundos)
LIVE_METRICS_CACHE_TIMEOUT=30
DEEP_ANALYTICS_CACHE_TIMEOUT=120
```

### **Dependencias Añadidas**
```python
# Backend
django-redis>=5.0.0  # Para cache

# Frontend
# Ninguna dependencia nueva (usa UI components existentes)
```

## 🧪 Testing

### **Endpoints Validados**
- ✅ `/live_metrics/` responde con estructura correcta
- ✅ `/deep_analytics/` responde con análisis completo
- ✅ Cache funciona correctamente
- ✅ Error handling maneja casos edge
- ✅ Validaciones de seguridad implementadas

### **Frontend Validado**
- ✅ LiveMetricsPanel carga y refresca
- ✅ DeepAnalyticsModal abre y navega
- ✅ Integración con SimulationView funciona
- ✅ Responsive design en diferentes pantallas

## 🚀 Roadmap Futuro

### **Corto Plazo**
- [ ] WebSocket para updates en tiempo real
- [ ] Exportar reportes a PDF
- [ ] Métricas comparativas entre sesiones

### **Mediano Plazo**
- [ ] ML predictions para outcome de conversación
- [ ] Análisis de sentiment más granular
- [ ] Integración con sistema de notifications

### **Largo Plazo**
- [ ] Dashboard de analytics a nivel de organización
- [ ] A/B testing de estrategias de conversación
- [ ] Análisis de voz en tiempo real

## 📋 Guía de Uso

### **Para Usuarios**
1. **Iniciar Simulación**: Panel lateral aparece automáticamente
2. **Durante Conversación**: Métricas se actualizan cada 10 segundos
3. **Ver Análisis Profundo**: Click en "Ver Análisis Detallado"
4. **Navegar Tabs**: Explorar diferentes aspectos del análisis

### **Para Desarrolladores**
1. **Extender Métricas**: Añadir métodos al `LiveMetricsService`
2. **Modificar UI**: Componentes modulares fácilmente editables
3. **Añadir Cache**: Usar patrones establecidos para nuevas funciones
4. **Debug**: Logs detallados disponibles en `/logs/`

---

## ✅ Estado del Proyecto

**🎉 IMPLEMENTACIÓN COMPLETA**
- ✅ Backend: Servicio + Endpoints + Cache + Error Handling
- ✅ Frontend: Panel + Modal + Integración + Responsive
- ✅ Testing: Funcional + Rendimiento + Seguridad
- ✅ Documentación: Completa y detallada

**Ready for Production!** 🚀