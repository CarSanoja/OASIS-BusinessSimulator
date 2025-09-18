import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  X,
  TrendingUp,
  Users,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Clock,
  BarChart3,
  Lightbulb,
  Star,
  ArrowRight,
  Activity,
  MessageSquare
} from "lucide-react";
import { apiService } from "../services/api";
import { useTranslation } from "react-i18next";

interface DeepAnalytics {
  conversation_flow: {
    emotional_journey: Array<{
      timestamp: string;
      emotion: string;
      message_preview: string;
    }>;
    decision_points: Array<{
      time: string;
      message: string;
      impact: 'positive' | 'neutral' | 'negative';
      analysis: string;
    }>;
    communication_quality: {
      overall_score: number;
      data_driven: number;
      strategic: number;
      stakeholder_awareness: number;
    };
  };
  business_intelligence: {
    financial_landscape: {
      valuation_discussed: string[];
      metrics_mentioned: string[];
      funding_mentions: string[];
    };
    strategic_themes: Array<{
      theme: string;
      frequency: number;
      prominence: 'high' | 'medium' | 'low';
    }>;
    risk_assessment: Array<{
      risk: string;
      level: 'high' | 'medium' | 'low';
      mentioned_times: number;
    }>;
  };
  performance_coaching: {
    strengths: Array<{
      strength: string;
      score: string;
    }>;
    growth_opportunities: string[];
    ai_insights: string[];
    recommendations: string[];
  };
  advanced_metrics: {
    total_insights_captured: number;
    avg_response_quality: number;
    conversation_depth_score: number;
    strategic_thinking_score: number;
  };
  generated_at: string;
}

interface DeepAnalyticsModalProps {
  simulationId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function DeepAnalyticsModal({ simulationId, isOpen, onClose }: DeepAnalyticsModalProps) {
  const { t } = useTranslation(['analytics', 'common']);
  const [analytics, setAnalytics] = useState<DeepAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insufficientData, setInsufficientData] = useState(false);
  const [activeTab, setActiveTab] = useState("conversation");

  useEffect(() => {
    if (isOpen && simulationId) {
      fetchAnalytics();
    }
  }, [isOpen, simulationId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      setInsufficientData(false);
      const data = await apiService.getDeepAnalytics(simulationId);
      setAnalytics(data);
    } catch (err) {

      // Check if it's the insufficient data error
      if (err instanceof Error && err.message.includes('Insufficient conversation data')) {
        setInsufficientData(true);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Error fetching analytics');
        setInsufficientData(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'positive':
      case 'confident':
        return 'bg-green-100 text-green-800';
      case 'negative':
      case 'frustrated':
        return 'bg-red-100 text-red-800';
      case 'skeptical':
      case 'hesitant':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getProminenceColor = (prominence: string) => {
    switch (prominence) {
      case 'high':
        return 'bg-purple-100 text-purple-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Análisis Profundo</h2>
            <p className="text-gray-600">Insights detallados de tu sesión ejecutiva</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-full p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analizando conversación...</p>
              </div>
            </div>
          ) : insufficientData ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md mx-auto p-6">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-amber-600 text-sm">!</span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  🔍 Análisis aún no disponible
                </h3>

                <p className="text-gray-600 mb-4 leading-relaxed">
                  Para generar un análisis detallado necesitas mantener una conversación más extensa.
                </p>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Continúa la simulación con al menos 2 intercambios más</strong> para desbloquear:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 text-left">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Análisis de flujo conversacional
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Inteligencia empresarial avanzada
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Coaching de rendimiento personalizado
                    </li>
                  </ul>
                </div>

                <p className="text-blue-600 font-medium text-sm">
                  ¡Sigue conversando para desbloquear insights valiosos!
                </p>

                <Button onClick={fetchAnalytics} variant="outline" className="mt-4">
                  Verificar nuevamente
                </Button>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchAnalytics} variant="outline">
                  Reintentar
                </Button>
              </div>
            </div>
          ) : analytics ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
                <TabsTrigger value="conversation" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Flujo de Conversación
                </TabsTrigger>
                <TabsTrigger value="business" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Business Intelligence
                </TabsTrigger>
                <TabsTrigger value="coaching" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Performance Coaching
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-6">
                <TabsContent value="conversation" className="mt-0 space-y-6">
                  {/* Emotional Journey */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Viaje Emocional
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.conversation_flow.emotional_journey.map((point, index) => (
                          <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {new Date(point.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <Badge className={getEmotionColor(point.emotion)}>
                              {point.emotion}
                            </Badge>
                            <span className="text-sm text-gray-700 flex-1">
                              {point.message_preview}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Decision Points */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Puntos de Decisión Clave
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.conversation_flow.decision_points.map((point, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={getImpactColor(point.impact)}>
                                {point.impact}
                              </Badge>
                              <span className="text-sm font-medium text-gray-900">{point.time}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{point.message}</p>
                            <p className="text-xs text-gray-600 italic">{point.analysis}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Communication Quality */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                        Calidad de Comunicación
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Puntaje General</span>
                            <span className="text-lg font-bold text-gray-900">
                              {analytics.conversation_flow.communication_quality.overall_score}/100
                            </span>
                          </div>
                          <Progress value={analytics.conversation_flow.communication_quality.overall_score} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Datos Específicos</span>
                            <span className="text-sm font-semibold text-blue-600">
                              {analytics.conversation_flow.communication_quality.data_driven} menciones
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Pensamiento Estratégico</span>
                            <span className="text-sm font-semibold text-green-600">
                              {analytics.conversation_flow.communication_quality.strategic} conceptos
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Conciencia de Stakeholders</span>
                            <span className="text-sm font-semibold text-purple-600">
                              {analytics.conversation_flow.communication_quality.stakeholder_awareness} menciones
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="business" className="mt-0 space-y-6">
                  {/* Financial Landscape */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Panorama Financiero
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Valuación Discutida</h4>
                          <div className="space-y-1">
                            {analytics.business_intelligence.financial_landscape.valuation_discussed.map((val, index) => (
                              <Badge key={index} variant="outline" className="mr-1 mb-1">
                                {val}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Métricas Mencionadas</h4>
                          <div className="space-y-1">
                            {analytics.business_intelligence.financial_landscape.metrics_mentioned.map((metric, index) => (
                              <Badge key={index} variant="outline" className="mr-1 mb-1">
                                {metric}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Rondas de Financiamiento</h4>
                          <div className="space-y-1">
                            {analytics.business_intelligence.financial_landscape.funding_mentions.map((funding, index) => (
                              <Badge key={index} variant="outline" className="mr-1 mb-1">
                                {funding}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strategic Themes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-blue-600" />
                        Evolución de Temas Estratégicos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.business_intelligence.strategic_themes.map((theme, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-900">{theme.theme}</span>
                              <Badge className={getProminenceColor(theme.prominence)}>
                                {theme.prominence}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Frecuencia:</span>
                              <span className="text-sm font-semibold text-gray-900">{theme.frequency}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Assessment */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Evaluación de Riesgos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.business_intelligence.risk_assessment.map((risk, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-900">{risk.risk}</span>
                              <Badge className={getRiskColor(risk.level)}>
                                {risk.level}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-600">
                              Mencionado {risk.mentioned_times} vez{risk.mentioned_times !== 1 ? 'es' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="coaching" className="mt-0 space-y-6">
                  {/* Strengths */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-600" />
                        Fortalezas Demostradas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.performance_coaching.strengths.map((strength, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-sm text-gray-900">{strength.strength}</span>
                            <Badge className="bg-green-100 text-green-800">
                              {strength.score}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Growth Opportunities */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-blue-600" />
                        Oportunidades de Crecimiento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.performance_coaching.growth_opportunities.map((opportunity, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-900">{opportunity}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        Insights de IA
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.performance_coaching.ai_insights.map((insight, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <Brain className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-900 italic">"{insight}"</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                        Recomendaciones para Próxima Sesión
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.performance_coaching.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-900">{recommendation}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Advanced Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                        Métricas Avanzadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-indigo-50 rounded-lg">
                          <div className="text-2xl font-bold text-indigo-600">
                            {analytics.advanced_metrics.avg_response_quality}
                          </div>
                          <div className="text-sm text-gray-600">Calidad Promedio de Respuesta</div>
                        </div>

                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {analytics.advanced_metrics.conversation_depth_score}
                          </div>
                          <div className="text-sm text-gray-600">Profundidad de Conversación</div>
                        </div>

                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {analytics.advanced_metrics.strategic_thinking_score}
                          </div>
                          <div className="text-sm text-gray-600">Pensamiento Estratégico</div>
                        </div>

                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {analytics.advanced_metrics.total_insights_captured}
                          </div>
                          <div className="text-sm text-gray-600">Insights Capturados</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {analytics && (
              <span>Generado el {new Date(analytics.generated_at).toLocaleString()}</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              Exportar Reporte
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}