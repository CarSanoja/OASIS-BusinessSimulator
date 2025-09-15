import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import { 
  ArrowLeft, 
  Send, 
  Target, 
  User, 
  Bot, 
  AlertCircle,
  CheckCircle2,
  Timer,
  FileText,
  TrendingUp,
  Activity,
  Thermometer,
  Play,
  Users,
  BookOpen
} from "lucide-react";
import { apiService, type Message, type Simulation } from "../services/api";

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  emotion?: string;
}

interface Scenario {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: string;
  duration: string;
  participants: string;
  objectives: string[];
  skills: string[];
}

interface SimulationViewProps {
  scenario: Scenario;
  onEndSimulation: (messages: Message[], duration: number) => void;
  onBackToDashboard: () => void;
}

export function SimulationView({ scenario, onEndSimulation, onBackToDashboard }: SimulationViewProps) {
  console.log('SimulationView rendering with scenario:', scenario);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [startTime] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [objectiveProgress, setObjectiveProgress] = useState<Record<string, boolean>>({});
  const [emotionalTone, setEmotionalTone] = useState(50);
  const [strategicAlignment, setStrategicAlignment] = useState(75);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize simulation
  useEffect(() => {
    const initializeSimulation = async () => {
      try {
        console.log('Initializing simulation for scenario:', scenario);
        setLoading(true);
        
        // Create simulation
        const newSimulation = await apiService.createSimulation({
          scenario: parseInt(scenario.id)
        });
        console.log('Created simulation:', newSimulation);
        setSimulation(newSimulation);
        
        // Add welcome message
        const welcomeMessage: Message = {
          id: '1',
          sender: 'ai',
          content: getWelcomeMessage(scenario),
          timestamp: new Date(),
          emotion: 'neutral'
        };
        console.log('Setting welcome message:', welcomeMessage);
        setMessages([welcomeMessage]);
        
        setError(null);
        console.log('Simulation initialized successfully');
      } catch (err) {
        console.error('Error initializing simulation:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize simulation');
      } finally {
        setLoading(false);
        console.log('Loading set to false');
      }
    };

    initializeSimulation();
  }, [scenario]);

  const getWelcomeMessage = (scenario: Scenario) => {
    switch (scenario.id) {
      case 'merger-negotiation':
        return "Buenos días. Soy María Elena Vásquez, CEO de FinTech Colombia, y mi CFO Roberto Silva. Entendemos que Grupo Financiero LATAM está interesado en adquirir nuestra empresa. Hemos crecido 400% en los últimos 24 meses y somos líderes en pagos digitales. ¿Cuál es su propuesta inicial y visión estratégica para la adquisición?";
      case 'crisis-leadership':
        return "CEO, necesitamos actuar rápido. Las redes sociales están explotando por el incidente de seguridad de datos. Nuestras acciones cayeron 35% en pre-market y tenemos una reunión de emergencia con la Junta en 2 horas. Los medios quieren declaraciones inmediatas. ¿Cuál es su estrategia de respuesta?";
      case 'startup-pitch':
        return "Bienvenido a Andreessen Horowitz. Soy Jennifer Martinez, Managing Partner de nuestro fondo LatAm. Hemos revisado su deck y nos interesa EduTech Solutions. Tenemos 25 minutos. Cuéntanos: ¿por qué su empresa va a revolucionar la educación en América Latina y por qué deberíamos invertir $5M ahora?";
      case 'international-expansion':
        return "Hemos estado esperando esta presentación. Como CEO, necesito entender su plan para Brasil y México. Tenemos $10M presupuestados, pero el board quiere ver ROI en 18 meses. Los mercados latinoamericanos son complejos. ¿Cómo vamos a ejecutar esto sin repetir los errores de nuestros competidores?";
      case 'team-performance':
        return "Gracias por tomar el tiempo para esta reunión. Sé que hemos estado posponiendo esta conversación, pero creo que es importante hablar sobre mi desempeño. He estado en esta empresa 15 años y siempre he dado lo mejor de mí. Estos últimos trimestres han sido difíciles, pero tengo ideas sobre cómo mejorar...";
      case 'board-strategic-planning':
        return "CEO, hemos revisado los documentos preliminares. Como Presidente del Directorio, debo decir que algunos miembros tienen reservas sobre la transformación digital propuesta. $50M es una inversión considerable. Necesitamos entender cómo esto va a generar valor a largo plazo y cuáles son los riesgos reales. Proceda con su presentación.";
      default:
        return "Buenos días. Estoy listo para comenzar esta simulación empresarial. ¿Cómo desea proceder con el escenario?";
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !simulation) return;

    const messageContent = currentMessage;
    setCurrentMessage('');
    setIsAiTyping(true);

    try {
      console.log('Sending message to simulation:', simulation.id, 'Content:', messageContent);
      
      // Send message to API and get AI response
      const response = await apiService.sendMessage(simulation.id, messageContent);
      
      console.log('Received API response:', response);
      
      // Validate response structure
      if (!response || !response.user_message || !response.ai_message) {
        throw new Error('Invalid API response structure');
      }
      
      // Convert API response to our Message format
      const userMessage: Message = {
        id: response.user_message.id.toString(),
        sender: 'user',
        content: response.user_message.content,
        timestamp: new Date(response.user_message.timestamp),
        emotion: response.user_message.emotion
      };

      const aiMessage: Message = {
        id: response.ai_message.id.toString(),
        sender: 'ai',
        content: response.ai_message.content,
        timestamp: new Date(response.ai_message.timestamp),
        emotion: response.ai_message.emotion
      };
      
      console.log('Converted messages:', { userMessage, aiMessage });
      
      // Add both user and AI messages to state
      setMessages(prev => {
        const newMessages = [...prev, userMessage, aiMessage];
        console.log('Updated messages array:', newMessages);
        return newMessages;
      });
      
      // Update objective progress
      if (response.objective_progress) {
        setObjectiveProgress(prev => ({ ...prev, ...response.objective_progress }));
      }
      
      // Update emotional tone based on AI response emotion
      if (response.ai_message.emotion === 'skeptical') {
        setEmotionalTone(prev => Math.max(20, prev - 15));
      } else if (response.ai_message.emotion === 'positive') {
        setEmotionalTone(prev => Math.min(90, prev + 10));
      } else {
        setEmotionalTone(prev => prev + (Math.random() - 0.5) * 10);
      }

      // Update strategic alignment based on message characteristics
      const hasStrategicKeywords = messageContent.toLowerCase().includes('estrategia') ||
                                  messageContent.toLowerCase().includes('objetivo') ||
                                  messageContent.toLowerCase().includes('plan') ||
                                  messageContent.toLowerCase().includes('riesgo');
      
      if (hasStrategicKeywords && messageContent.length > 50) {
        setStrategicAlignment(prev => Math.min(100, prev + 5));
      } else if (messageContent.length < 20) {
        setStrategicAlignment(prev => Math.max(30, prev - 3));
      }
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Error sending message');
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        content: 'Disculpe, hubo un problema técnico. ¿Podría repetir su mensaje?',
        timestamp: new Date(),
        emotion: 'neutral'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleEndSimulation = async () => {
    if (!simulation) return;
    
    try {
      const duration = Math.round((currentTime.getTime() - startTime.getTime()) / 1000 / 60);
      
      // End simulation via API
      const result = await apiService.endSimulation(simulation.id);
      
      // Pass the analysis data to the feedback view
      onEndSimulation(messages, duration);
    } catch (err) {
      console.error('Error ending simulation:', err);
      // Still proceed to feedback view even if API call fails
      const duration = Math.round((currentTime.getTime() - startTime.getTime()) / 1000 / 60);
      onEndSimulation(messages, duration);
    }
  };

  const getElapsedTime = () => {
    const elapsed = Math.round((currentTime.getTime() - startTime.getTime()) / 1000 / 60);
    return `${elapsed} min`;
  };

  const getCompletedObjectives = () => {
    return Object.keys(objectiveProgress).length;
  };

  console.log('Render state:', { loading, error, messages: messages.length, simulation: !!simulation });

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Iniciando Simulación</h3>
          <p className="text-white/70">Preparando entorno de aprendizaje...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-center text-white">
          <h3 className="text-xl font-semibold mb-2 text-red-300">Error al Iniciar Simulación</h3>
          <p className="text-white/70 mb-4">{error}</p>
          <Button onClick={onBackToDashboard} className="bg-white text-gray-900 hover:bg-gray-100">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  console.log('Rendering main simulation view');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="relative z-10 flex min-h-full">
        {/* Left Sidebar - Context Panel */}
        <div className="w-80 bg-black/20 backdrop-blur-sm border-r border-white/10 p-6 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBackToDashboard}
              className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-cyan-400" />
                <span className="text-white font-semibold">Simulación Activa</span>
              </div>
              <p className="text-white/70 text-sm">{scenario.category}</p>
            </div>
          </div>

          {/* Scenario Info Card */}
          <div className="bg-black/20 backdrop-blur-sm p-6 rounded-2xl mb-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{scenario.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Timer className="h-4 w-4 text-cyan-400" />
                  <span className="text-white/70 text-sm">{getElapsedTime()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <Badge className={`${
                scenario.difficulty === 'Principiante' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                scenario.difficulty === 'Intermedio' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
                'bg-red-500/20 text-red-300 border-red-400/30'
              }`}>
                {scenario.difficulty}
              </Badge>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Users className="h-4 w-4" />
                <span>{scenario.participants}</span>
              </div>
            </div>

            <Separator className="bg-white/20 mb-4" />

            {/* Objectives Progress */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-cyan-400" />
                <span className="text-white font-medium">Objetivos de Misión</span>
              </div>
              <div className="space-y-2">
                {scenario.objectives.map((objective, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    {objectiveProgress[objective] ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-white/40 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={`${
                      objectiveProgress[objective] 
                        ? 'text-green-300 line-through' 
                        : 'text-white/90'
                    }`}>
                      {objective}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/70 mb-2">
                  <span>Progreso de Misión</span>
                  <span>{getCompletedObjectives()}/{scenario.objectives.length}</span>
                </div>
                <Progress 
                  value={(getCompletedObjectives() / scenario.objectives.length) * 100} 
                  className="h-2 bg-white/20"
                />
              </div>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="space-y-4 mb-6">
            <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-pink-400" />
                  <span className="text-white text-sm">Tono Emocional</span>
                </div>
                <span className={`font-semibold ${
                  emotionalTone >= 70 ? 'text-green-400' :
                  emotionalTone >= 40 ? 'text-blue-400' : 'text-red-400'
                }`}>
                  {Math.round(emotionalTone)}%
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    emotionalTone >= 70 ? 'bg-green-400' :
                    emotionalTone >= 40 ? 'bg-blue-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${emotionalTone}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-white text-sm">Alineación Estratégica</span>
                </div>
                <span className={`font-semibold ${
                  strategicAlignment >= 80 ? 'text-emerald-400' :
                  strategicAlignment >= 60 ? 'text-yellow-400' : 'text-orange-400'
                }`}>
                  {Math.round(strategicAlignment)}%
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    strategicAlignment >= 80 ? 'bg-emerald-400' :
                    strategicAlignment >= 60 ? 'bg-yellow-400' : 'bg-orange-400'
                  }`}
                  style={{ width: `${strategicAlignment}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/20 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-purple-400" />
              <span className="text-white font-medium">Recursos Disponibles</span>
            </div>
            <div className="space-y-2">
              <div className="bg-black/20 backdrop-blur-sm p-3 rounded-xl border-l-4 border-blue-400">
                <span className="text-white text-sm">Datos Financieros Q4</span>
              </div>
              <div className="bg-black/20 backdrop-blur-sm p-3 rounded-xl border-l-4 border-green-400">
                <span className="text-white text-sm">Análisis de Mercado</span>
              </div>
              <div className="bg-black/20 backdrop-blur-sm p-3 rounded-xl border-l-4 border-purple-400">
                <span className="text-white text-sm">Marco Regulatorio</span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-cyan-400" />
              <span className="text-white font-medium">Competencias</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {scenario.skills.map((skill) => (
                <Badge 
                  key={skill} 
                  className="bg-black/20 text-white border-white/20 text-xs"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-6 m-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Simulación Empresarial</h3>
                  <p className="text-white/70 text-sm">{scenario.participants}</p>
                </div>
              </div>
              <Button 
                onClick={handleEndSimulation}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
              >
                Finalizar Simulación
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 max-w-4xl mx-auto pb-6">
              {messages.map((message, index) => (
                <div 
                  key={message.id} 
                  className={`flex gap-4 ${message.sender === 'user' ? 'justify-end' : ''}`}
                >
                  {message.sender === 'ai' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-3xl ${message.sender === 'user' ? 'order-first' : ''}`}>
                    <div className={`p-6 rounded-2xl ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white ml-auto' 
                        : 'bg-black/20 backdrop-blur-sm text-white border border-white/20'
                    }`}>
                      <p className="leading-relaxed">{message.content}</p>
                      {message.emotion && message.sender === 'ai' && (
                        <div className="mt-3 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-cyan-400" />
                          <Badge className="bg-black/20 text-white border-white/20 text-xs">
                            {message.emotion}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-white/60 mt-2 px-6">
                      {message.timestamp.toLocaleTimeString()} • {message.sender === 'user' ? 'Tú' : 'Contraparte'}
                    </p>
                  </div>

                  {message.sender === 'user' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isAiTyping && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-black/20 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <p className="text-white/60 text-sm mt-2">Analizando tu estrategia...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                <div className="flex gap-4">
                  <Textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Escribe tu respuesta estratégica..."
                    className="flex-1 min-h-[60px] resize-none bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isAiTyping}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!currentMessage.trim() || isAiTyping}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
