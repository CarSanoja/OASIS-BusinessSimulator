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
  Clock, 
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
  onBackToDashboard: () => void;
  onRestartSimulation: () => void;
}

export function FeedbackView({ 
  messages, 
  duration, 
  scenarioTitle, 
  onBackToDashboard, 
  onRestartSimulation 
}: FeedbackViewProps) {
  
  // Generate mock feedback data based on messages
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

  const feedback = generateFeedbackData();

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
              <p className="text-gray-600">{scenarioTitle} • {duration} minutos • Estándar IESA</p>
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
              <h2 className="text-2xl mb-2">Puntuación General</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {feedback.overallScore >= 85 
                  ? "¡Desempeño excepcional nivel C-Suite! Has demostrado competencias ejecutivas sólidas según estándares IESA de liderazgo empresarial."
                  : feedback.overallScore >= 70
                  ? "Buen desempeño gerencial. Tienes una base sólida con oportunidades específicas para alcanzar excelencia ejecutiva."
                  : "Oportunidad de desarrollo significativa. Este es un valioso punto de partida para fortalecer tus competencias de liderazgo."
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="strategy">Estrategia</TabsTrigger>
            <TabsTrigger value="communication">Comunicación</TabsTrigger>
            <TabsTrigger value="moments">Momentos Clave</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
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
                    Fortalezas Identificadas
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
                <CardTitle>Análisis de Tácticas Utilizadas</CardTitle>
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
                                <h4 className="font-medium text-sm text-blue-900 mb-1">Análisis del Coach IA</h4>
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
                              {message.sender === 'user' ? 'Tú' : 'Contraparte'}
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
                                  <span className="font-medium text-green-800">Técnica efectiva: </span>
                                  <span className="text-gray-700">
                                    Excelente uso de preguntas abiertas para generar diálogo constructivo.
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
                                  <span className="font-medium text-orange-800">Oportunidad: </span>
                                  <span className="text-gray-700">
                                    Considera ser más específico con los números para aumentar credibilidad.
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
                  <CardTitle>Plan de Desarrollo Ejecutivo IESA</CardTitle>
                  <p className="text-gray-600">Recomendaciones específicas alineadas con el curriculum de liderazgo y las competencias del programa MBA</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {feedback.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Recomendación {index + 1}</p>
                          <p className="text-blue-800">{recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Próximos Pasos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={onRestartSimulation} className="h-auto p-4 justify-start">
                      <RefreshCw className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">Repetir Simulación</div>
                        <div className="text-sm opacity-80">Aplica los aprendizajes</div>
                      </div>
                    </Button>
                    
                    <Button variant="outline" onClick={onBackToDashboard} className="h-auto p-4 justify-start">
                      <Target className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">Nuevo Escenario</div>
                        <div className="text-sm opacity-80">Practica habilidades diferentes</div>
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