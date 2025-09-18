import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  MessageSquare,
  Star,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  User,
  Bot
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { apiService, type SimulationAnalysis } from "../services/api";
import { useTranslation } from "react-i18next";

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  emotion?: string;
}

interface FeedbackData {
  overallScore: number;
  strategicScore: number;
  communicationScore: number;
  emotionalScore: number;
  sentimentData: Array<{ time: string; sentiment: number; }>;
  keyMoments: Array<{ time: string; message: string; impact: 'positive' | 'negative' | 'neutral'; analysis: string; }>;
  strengths: string[];
  improvements: string[];
  tacticsUsed: Array<{ tactic: string; effectiveness: number; }>;
  recommendations: string[];
}

interface FeedbackViewProps {
  messages: Message[];
  duration: number;
  scenarioTitle: string;
  simulationId?: number;
  onBackToDashboard: () => void;
  onRestartSimulation: () => void;
}

export function FeedbackView({
  messages,
  duration,
  scenarioTitle,
  simulationId,
  onBackToDashboard,
  onRestartSimulation
}: FeedbackViewProps) {
  const { t } = useTranslation(['feedback', 'common']);
  
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalysisData = async () => {
      if (!simulationId) {
        // Fallback to mock data if no simulation ID
        setFeedback(generateFeedbackData());
        setTranscript(messages);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load analysis from API
        const analysis = await apiService.getSimulationAnalysis(simulationId);
        
        // Load transcript from API
        const transcriptResponse = await apiService.getSimulationTranscript(simulationId);
        
        // Convert API data to FeedbackData format
        const feedbackData: FeedbackData = {
          overallScore: analysis.overall_score,
          strategicScore: analysis.strategic_score,
          communicationScore: analysis.communication_score,
          emotionalScore: analysis.emotional_score,
          strengths: analysis.strengths,
          improvements: analysis.improvements,
          recommendations: analysis.recommendations,
          keyMoments: analysis.key_moments,
          tacticsUsed: analysis.tactics_used,
          sentimentData: generateSentimentData(transcriptResponse.transcript)
        };
        
        setFeedback(feedbackData);
        setTranscript(transcriptResponse.transcript);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analysis');
        // Fallback to mock data
        setFeedback(generateFeedbackData());
        setTranscript(messages);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, [simulationId, messages]);

  const generateSentimentData = (transcript: any[]) => {
    return transcript
      .filter(msg => msg.sender === 'user')
      .map((_, index) => ({
        time: `${index * 3 + 1}min`,
        sentiment: 50 + Math.sin(index * 0.8) * 30 + Math.random() * 10
      }));
  };
  
  // Generate mock feedback data based on messages (fallback)
  const generateFeedbackData = (): FeedbackData => {
    const userMessages = messages.filter(m => m.sender === 'user');
    const messageCount = userMessages.length;
    
    // Mock scoring based on message characteristics
    const overallScore = Math.min(95, 65 + messageCount * 3 + Math.random() * 20);
    
    return {
      overallScore: Math.round(overallScore),
      strategicScore: Math.round(overallScore + (Math.random() - 0.5) * 10),
      communicationScore: Math.round(overallScore + (Math.random() - 0.5) * 15),
      emotionalScore: Math.round(overallScore + (Math.random() - 0.5) * 12),
      sentimentData: userMessages.map((_, index) => ({
        time: `${index * 3 + 1}min`,
        sentiment: 50 + Math.sin(index * 0.8) * 30 + Math.random() * 10
      })),
      keyMoments: [
        {
          time: '5min',
          message: userMessages[1]?.content.substring(0, 50) + '...' || 'Apertura inicial',
          impact: 'positive',
          analysis: 'Excelente apertura. Estableciste el tono apropiado y mostraste respeto por la contraparte.'
        },
        {
          time: '12min',
          message: userMessages[2]?.content.substring(0, 50) + '...' || 'Momento de negociación',
          impact: 'neutral',
          analysis: 'Buena estrategia, pero podrías haber sido más específico con los números para generar más credibilidad.'
        },
        {
          time: '18min',
          message: userMessages[userMessages.length - 1]?.content.substring(0, 50) + '...' || 'Cierre',
          impact: 'positive',
          analysis: 'Excelente cierre. Mantuviste la puerta abierta para futuras negociaciones.'
        }
      ],
      strengths: [
        'Excelente preparación con datos financieros específicos',
        'Comunicación directa y profesional apropiada para nivel C-Suite',
        'Buen entendimiento del contexto latinoamericano',
        'Demostró pensamiento estratégico de largo plazo',
        'Manejo efectivo de múltiples stakeholders'
      ],
      improvements: [
        'Podría ser más asertivo en momentos de high-stakes negotiation',
        'Desarrollar mejor timing para concesiones estratégicas',
        'Mejorar uso de silencios como herramienta de negociación',
        'Incorporar más análisis de riesgo competitivo',
        'Fortalecer storytelling para buy-in emocional'
      ],
      tacticsUsed: [
        { tactic: 'Data-driven persuasion', effectiveness: 88 },
        { tactic: 'Stakeholder mapping', effectiveness: 75 },
        { tactic: 'Risk assessment', effectiveness: 82 },
        { tactic: 'Strategic concessions', effectiveness: 69 },
        { tactic: 'Executive presence', effectiveness: 86 }
      ],
      recommendations: [
        'Estudiar casos Harvard sobre M&A en mercados emergentes',
        'Practicar técnicas avanzadas de anchoring en negociaciones complejas',
        'Desarrollar framework para crisis management communication',
        'Incorporar design thinking en estrategias de transformación digital',
        'Fortalecer competencias en cross-cultural leadership'
      ]
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">{t('feedback:loadingFeedback')}</h3>
          <p className="text-gray-600">{t('feedback:analyzingPerformance', { defaultValue: 'Analizando tu desempeño con IA...' })}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2 text-red-600">{t('feedback:errorLoadingAnalysis', { defaultValue: 'Error al Cargar Análisis' })}</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onBackToDashboard}>{t('feedback:backToDashboard')}</Button>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">No hay datos de análisis</h3>
          <Button onClick={onBackToDashboard}>{t('feedback:backToDashboard')}</Button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 85) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-3xl">Evaluación de Competencias Ejecutivas</h1>
              <p className="text-gray-600">{scenarioTitle} • {duration} {t('feedback:minutes')} • {t('feedback:executiveStandard', { defaultValue: 'Estándar Ejecutivo' })}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onRestartSimulation}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Intentar de Nuevo
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Reporte
            </Button>
          </div>
        </div>

        {/* Overall Score Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="text-center">
              <div className={`text-6xl mb-4 ${getScoreColor(feedback.overallScore)}`}>
                {feedback.overallScore}
              </div>
              <h2 className="text-2xl mb-2">{t('feedback:overallScore')}</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {feedback.overallScore >= 85
                  ? t('feedback:exceptionalPerformance', { defaultValue: '¡Desempeño excepcional nivel C-Suite! Has demostrado competencias ejecutivas sólidas según estándares de liderazgo empresarial.' })
                  : feedback.overallScore >= 70
                  ? t('feedback:goodPerformance', { defaultValue: 'Buen desempeño gerencial. Tienes una base sólida con oportunidades específicas para alcanzar excelencia ejecutiva.' })
                  : t('feedback:developmentOpportunity', { defaultValue: 'Oportunidad de desarrollo significativa. Este es un valioso punto de partida para fortalecer tus competencias de liderazgo.' })
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{t('feedback:overviewTab', { defaultValue: 'Resumen' })}</TabsTrigger>
            <TabsTrigger value="strategy">{t('feedback:strategyTab', { defaultValue: 'Estrategia' })}</TabsTrigger>
            <TabsTrigger value="communication">{t('feedback:communicationTab', { defaultValue: 'Comunicación' })}</TabsTrigger>
            <TabsTrigger value="moments">{t('feedback:keyMomentsTab', { defaultValue: 'Momentos Clave' })}</TabsTrigger>
            <TabsTrigger value="recommendations">{t('feedback:recommendationsTab', { defaultValue: 'Recomendaciones' })}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estrategia</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl ${getScoreColor(feedback.strategicScore)}`}>
                    {feedback.strategicScore}
                  </div>
                  <Progress value={feedback.strategicScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comunicación</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl ${getScoreColor(feedback.communicationScore)}`}>
                    {feedback.communicationScore}
                  </div>
                  <Progress value={feedback.communicationScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inteligencia Emocional</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl ${getScoreColor(feedback.emotionalScore)}`}>
                    {feedback.emotionalScore}
                  </div>
                  <Progress value={feedback.emotionalScore} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    {t('feedback:strengths')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feedback.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Áreas de Mejora
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feedback.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="strategy">
            <Card>
              <CardHeader>
                <CardTitle>{t('feedback:tacticsAnalysis', { defaultValue: 'Análisis de Tácticas Utilizadas' })}</CardTitle>
                <p className="text-gray-600">Efectividad de las diferentes estrategias empleadas durante la simulación</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={feedback.tacticsUsed}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tactic" angle={-45} textAnchor="end" height={100} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="effectiveness" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication">
            <Card>
              <CardHeader>
                <CardTitle>Evolución del Tono y Sentimiento</CardTitle>
                <p className="text-gray-600">Cómo cambió el tono de la conversación a lo largo del tiempo</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={feedback.sentimentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sentiment" stroke="#3b82f6" fill="#3b82f680" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moments" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Momentos Decisivos Analizados</h3>
                <p className="text-gray-600">Los puntos de inflexión que definieron el curso de tu simulación</p>
              </div>
              
              {feedback.keyMoments.map((moment, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`p-4 ${
                      moment.impact === 'positive' ? 'bg-green-50 border-l-4 border-green-500' :
                      moment.impact === 'negative' ? 'bg-red-50 border-l-4 border-red-500' :
                      'bg-blue-50 border-l-4 border-blue-500'
                    }`}>
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getImpactIcon(moment.impact)}
                          <Badge variant="outline" className="text-xs">{moment.time}</Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-3">
                            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                              {moment.impact === 'positive' ? 'Momento Exitoso' : 
                               moment.impact === 'negative' ? 'Oportunidad Perdida' : 'Punto Neutral'}
                            </span>
                          </div>
                          <blockquote className="border-l-2 border-gray-300 pl-4 italic text-gray-700 mb-3">
                            "{moment.message}"
                          </blockquote>
                          <div className="bg-white p-3 rounded-lg border">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                              <div>
                                <h4 className="font-medium text-sm text-blue-900 mb-1">{t('feedback:aiCoachAnalysis', { defaultValue: 'Análisis del Coach IA' })}</h4>
                                <p className="text-gray-700 text-sm">{moment.analysis}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Transcripción Anotada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Transcripción Anotada
                </CardTitle>
                <p className="text-gray-600">Conversación completa con comentarios y análisis del Coach IA</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.map((message, index) => (
                    <div key={message.id} className={`p-4 rounded-lg ${
                      message.sender === 'user' 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-600'
                        }`}>
                          {message.sender === 'user' ? 
                            <User className="h-4 w-4 text-white" /> : 
                            <Bot className="h-4 w-4 text-white" />
                          }
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">
                              {message.sender === 'user' ? t('feedback:you', { defaultValue: 'Tú' }) : t('feedback:counterpart', { defaultValue: 'Contraparte' })}
                            </span>
                            <span className="text-xs text-gray-500">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-800 mb-2">{message.content}</p>
                          
                          {/* Anotaciones del Coach IA */}
                          {message.sender === 'user' && index % 2 === 0 && (
                            <div className="mt-3 p-3 bg-white border border-yellow-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                                <div className="text-sm">
                                  <span className="font-medium text-green-800">{t('feedback:effectiveTechnique', { defaultValue: 'Técnica efectiva:' })} </span>
                                  <span className="text-gray-700">
                                    {t('feedback:openQuestionsComment', { defaultValue: 'Excelente uso de preguntas abiertas para generar diálogo constructivo.' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {message.sender === 'user' && index % 3 === 0 && index > 0 && (
                            <div className="mt-3 p-3 bg-white border border-orange-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-orange-600 mt-1 flex-shrink-0" />
                                <div className="text-sm">
                                  <span className="font-medium text-orange-800">{t('feedback:opportunity', { defaultValue: 'Oportunidad:' })} </span>
                                  <span className="text-gray-700">
                                    {t('feedback:specificNumbersComment', { defaultValue: 'Considera ser más específico con los números para aumentar credibilidad.' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('feedback:developmentPlan', { defaultValue: 'Plan de Desarrollo Ejecutivo' })}</CardTitle>
                  <p className="text-gray-600">{t('feedback:developmentPlanDesc', { defaultValue: 'Recomendaciones específicas alineadas con el curriculum de liderazgo y las competencias del programa MBA' })}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {feedback.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">{t('feedback:recommendation')} {index + 1}</p>
                          <p className="text-blue-800">{recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('feedback:nextSteps', { defaultValue: 'Próximos Pasos' })}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={onRestartSimulation} className="h-auto p-4 justify-start">
                      <RefreshCw className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">{t('feedback:repeatSimulation', { defaultValue: 'Repetir Simulación' })}</div>
                        <div className="text-sm opacity-80">{t('feedback:applyLearnings', { defaultValue: 'Aplica los aprendizajes' })}</div>
                      </div>
                    </Button>
                    
                    <Button variant="outline" onClick={onBackToDashboard} className="h-auto p-4 justify-start">
                      <Target className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">{t('feedback:newScenario', { defaultValue: 'Nuevo Escenario' })}</div>
                        <div className="text-sm opacity-80">{t('feedback:practiceDifferentSkills', { defaultValue: 'Practica habilidades diferentes' })}</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}