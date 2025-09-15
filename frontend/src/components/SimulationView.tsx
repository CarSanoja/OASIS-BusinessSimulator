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
        setLoading(true);
        
        // Create simulation
        const newSimulation = await apiService.createSimulation({
          scenario: parseInt(scenario.id)
        });
        setSimulation(newSimulation);
        
        // Add welcome message
        const welcomeMessage: Message = {
          id: '1',
          sender: 'ai',
          content: getWelcomeMessage(scenario),
          timestamp: new Date(),
          emotion: 'neutral'
        };
        setMessages([welcomeMessage]);
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize simulation');
        console.error('Error initializing simulation:', err);
      } finally {
        setLoading(false);
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

  const getAIResponse = (userMessage: string, messageHistory: Message[]) => {
    // Simulated AI responses based on scenario and context
    const responses = {
      'merger-negotiation': [
        "Roberto me susurra que esos múltiplos están por debajo del mercado. Miren, empresas similares en Chile y Argentina se han vendido a 8-10x revenue. Nosotros tenemos 2.3 millones de usuarios activos y crecemos 30% trimestral. ¿Han considerado el valor estratégico de nuestra base de datos de comportamiento financiero?",
        "Me gusta su enfoque colaborativo. Pero tengo preocupaciones específicas: mi equipo de blockchain está recibiendo ofertas de Facebook y Google. Si pierdo a estos 12 desarrolladores, la integración será un desastre. ¿Qué paquete de retención proponen? Y sobre el timeline, necesitamos mantener nuestra velocidad de innovación.",
        "Excelente. Los contratos de retención de 24 meses con bonos de integración suenan razonables. Ahora, sobre governance: quiero mantener autonomía operacional por 18 meses. También necesitamos que se respete nuestra cultura startup. ¿Cómo van a manejar la integración con sus procesos corporativos más estructurados?",
        "Perfecto. Me gusta que entiendan la importancia del fit cultural. Una pregunta final: nuestros planes incluyen expansión a Brasil en Q2. ¿Esta adquisición acelera o retrasa esos planes? Y sobre el tema regulatorio, ¿tienen experiencia con SISBEN y la superintendencia financiera colombiana?"
      ],
      'crisis-leadership': [
        "CEO, acabo de colgar con Reuters. Quieren una declaración en 30 minutos. El CTO dice que el breach afectó 2.3 millones de cuentas, incluye números de tarjetas pero las claves están encriptadas. Legal recomienda disclosure completo, pero Marketing dice que eso nos destruye. ¿Cuál es su call?",
        "Entiendo la transparencia, pero necesitamos pensar estratégicamente. Nuestros competidores van a capitalizar esto. Ya vi tweets de FinCompete diciendo que sus sistemas son 'más seguros que los nuestros'. ¿Cómo vamos a counter-narrativar? ¿Y qué hacemos con los clientes enterprise? Tenemos contratos de $50M en riesgo.",
        "Buena estrategia de comunicación proactiva. Pero la junta está nerviosa. El Chairman me pregunta si necesitamos traer consultoría externa, tal vez McKinsey para el recovery plan. También mencionó que podríamos necesitar un Chief Security Officer nuevo. ¿Cómo manejo esa conversación sin que parezca que estamos despidiendo gente en crisis?",
        "Sólido. Ya convoqué al equipo de comunicaciones y al CTO para implementar su plan. Una última cosa: nuestro Chief Revenue Officer dice que dos clientes enterprise ya pidieron reuniones 'urgentes'. Claramente van a renegociar términos o cancelar. ¿Cómo manejo estas conversaciones sin comprometer más revenue?"
      ],
      'startup-pitch': [
        "Interesante market size, pero hemos visto muchos 'Netflix de la educación'. ¿Qué hace realmente diferente a EduTech? Y más importante: sus métricas de engagement son buenas, pero ¿dónde está la monetización? Solo veo $180K ARR con 50K usuarios. Eso es $3.60 por usuario por año. ¿Cómo llegan a unit economics rentables?",
        "Ok, el modelo B2B2B con universidades suena más sólido. Pero LATAM es complicado - hemos visto startups quebrar por problemas de payments y regulación. ¿Cómo van a manejar las diferencias entre México (más maduro) y mercados como Colombia o Perú? Y honestamente, necesito ver más tracción antes de $5M. ¿Qué pueden lograr con $2M?",
        "Me gusta la traction con ITESM y Universidad de los Andes. Esos son logos fuertes. Pero $20M pre-money parece alto para su etapa. Hemos visto valoraciones caer 40% este año. ¿Estarían abiertos a $15M pre-money? Y necesito entender: si les damos $5M, ¿cuándo necesitarán Serie B? No queremos ser su único investor en la próxima ronda.",
        "Razonable. Me gusta que tengan clarity sobre el roadmap de 18 meses. Ultima pregunta antes de ir a partners: ¿cuál es su strategy si OpenAI o Google lanzan algo similar gratis? La defensibilidad es clave en edtech. ¿Su moat está en contenido, datos de estudiantes, o relaciones con universidades?"
      ],
      'international-expansion': [
        "Interesante approach, pero veamos los números reales. ¿$6M para Brasil y $4M para México en 24 meses? Brasil tiene complejidad fiscal brutal - ICMS, ISS, federal taxes. Y México tiene ANTAD, que controla retail distribution. ¿Han modelado esos compliance costs? Porque nuestros lawyers dicen que solo setup legal puede tomar 8-12 meses.",
        "Ok, but let's talk execution risk. Nuestro último intento internacional (Chile 2019) fue un disaster. Perdimos $3M porque subestimamos local competition y consumer behavior. ¿Qué differentiated intel tienen sobre estos mercados? Y sobre local hiring: ¿van a enviar expats o contratar local talent? El costo de expats puede destruir su P&L.",
        "Buenos socios locales, pero necesito entender governance. ¿Joint venture 50/50 o subsidiary model? Y sobre logistics: nuestro supply chain está optimizado para US/Canada. LATAM significa new suppliers, different quality standards, currency hedging. ¿Han stress-tested el model con 30% devaluation scenarios?",
        "Solid risk management framework. Una preocupación final: competitive response. Si tenemos éxito rápido, local players van a react aggressively - probablemente con price wars. ¿Cuál es nuestra sustainable competitive advantage? ¿Y están dispuestos a absorber 18-24 meses de losses mientras establecemos market position?"
      ],
      'team-performance': [
        "Aprecio que tengas ideas, pero necesitamos abordar los números directamente. Q3 y Q4 estuvieron 23% y 31% debajo de target respectivamente. El pipeline está débil y hemos perdido dos deals grandes con clientes existentes. Como líder, necesito entender qué está pasando. ¿Es el market, el team, o necesitas support diferente?",
        "Entiendo los challenges del market, pero otros VPs de ventas en la industria están hitting targets. Me preocupa que tu team también esté struggle - tres SDRs pidieron transfer a otras divisiones. ¿Hay friction en leadership style o approach? Quiero ayudarte succeed, pero necesito honest assessment de qué cambiar.",
        "Ok, valuable feedback sobre resources y training. Pero tengamos clarity sobre next steps: necesito ver improvement específico en Q1. ¿Qué commitments puedes hacer? Y sobre team morale - quiero entender si hay systemic issues. ¿Deberíamos traer external sales consultant para fresh perspective?",
        "Perfecto, me gusta tu ownership del situation y el plan específico. Vamos a implement esas changes y te doy full support. Pero seamos clear sobre expectations: Q1 necesita ser recovery quarter. Si by March no vemos progress hacia targets, tendremos que consider other options. ¿Estás comfortable con ese timeline y accountability?"
      ],
      'board-strategic-planning': [
        "CEO, hemos estudiado sus proyecciones, pero tengo questions específicas de nuestro audit committee. Digital transformation de $50M es massive bet. ¿Cómo validaron el ROI de 23% que proyectan? Y sobre risk mitigation: hemos visto large corporations struggle con digital initiatives. ¿Qué lessons learned de casos como GE o Ford incorporaron?",
        "Interesante methodology, pero necesito entender competitive implications. Si invertimos $50M en 3 años, ¿qué pasa si Amazon o Google entran a nuestro space? ¿Esta transformación nos hace más defensible o más vulnerable? Y sobre implementation: ¿internal development vs partnerships vs acquisitions?",
        "Solid framework para partnerships, pero el board tiene fiduciary concerns. ¿Cuál es el worst-case scenario? Si digital adoption toma más tiempo del esperado, ¿podemos scale back investment sin comprometer core business? Y sobre talent: necesitaremos CTO level expertise. ¿internal promotion vs external hire?",
        "Excellent presentation. Me gusta la phase-gate approach y los clear milestones. Pero before final approval, necesito entender governance structure. ¿Quién oversees esta transformation? ¿Report directo a usted o separate committee? Y sobre shareholder communication: esto va a affect short-term margins. ¿Cuál es la narrative para analysts?"
      ]
    };

    const scenarioResponses = responses[scenario.id as keyof typeof responses] || responses['merger-negotiation'];
    const messageCount = messageHistory.filter(m => m.sender === 'user').length;
    const responseIndex = Math.min(messageCount - 1, scenarioResponses.length - 1);
    
    return scenarioResponses[responseIndex];
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !simulation) return;

    const messageContent = currentMessage;
    setCurrentMessage('');
    setIsAiTyping(true);

    try {
      // Send message to API and get AI response
      const response = await apiService.sendMessage(simulation.id, messageContent);
      
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
      
      // Add both user and AI messages to state
      setMessages(prev => [...prev, userMessage, aiMessage]);
      
      // Update objective progress
      setObjectiveProgress(prev => ({ ...prev, ...response.objective_progress }));
      
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

  const getToneColor = (tone: number) => {
    if (tone >= 70) return 'text-green-400';
    if (tone >= 40) return 'text-blue-400';
    return 'text-red-400';
  };

  const getToneBgColor = (tone: number) => {
    if (tone >= 70) return 'bg-green-500/20';
    if (tone >= 40) return 'bg-blue-500/20';
    return 'bg-red-500/20';
  };

  const getStrategicColor = (alignment: number) => {
    if (alignment >= 80) return 'text-emerald-400';
    if (alignment >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  if (loading) {
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

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ minHeight: 'calc(100vh - 80px)' }}>
      {/* Animated background - Same as Landing Page */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40"></div>
        
        {/* Animated particles - Same pattern as Landing Page */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-60"></div>
        <div className="absolute top-1/6 right-1/3 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-40" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/6 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-50" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-60" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-1/3 right-1/5 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-30" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 flex min-h-full">
        {/* Left Sidebar - Context Panel */}
        <div className="w-80 glass-card border-r border-white/10 p-6 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBackToDashboard}
              className="glass-card text-white hover:bg-white/20 border border-white/20"
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
          <div className="glass-card p-6 rounded-2xl mb-6 border border-white/20">
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
            <div className="glass-card p-4 rounded-2xl border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-pink-400" />
                  <span className="text-white text-sm">Tono Emocional</span>
                </div>
                <span className={`font-semibold ${getToneColor(emotionalTone)}`}>
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

            <div className="glass-card p-4 rounded-2xl border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-white text-sm">Alineación Estratégica</span>
                </div>
                <span className={`font-semibold ${getStrategicColor(strategicAlignment)}`}>
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
          <div className="glass-card p-4 rounded-2xl border border-white/20 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-purple-400" />
              <span className="text-white font-medium">Recursos Disponibles</span>
            </div>
            <div className="space-y-2">
              <div className="glass-card p-3 rounded-xl border-l-4 border-blue-400">
                <span className="text-white text-sm">Datos Financieros Q4</span>
              </div>
              <div className="glass-card p-3 rounded-xl border-l-4 border-green-400">
                <span className="text-white text-sm">Análisis de Mercado</span>
              </div>
              <div className="glass-card p-3 rounded-xl border-l-4 border-purple-400">
                <span className="text-white text-sm">Marco Regulatorio</span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="glass-card p-4 rounded-2xl border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-cyan-400" />
              <span className="text-white font-medium">Competencias</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {scenario.skills.map((skill) => (
                <Badge 
                  key={skill} 
                  className="glass-card text-white border-white/20 text-xs"
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
          <div className="glass-card border-b border-white/10 p-6 m-4 rounded-2xl">
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
                        : 'glass-card text-white border border-white/20'
                    }`}>
                      <p className="leading-relaxed">{message.content}</p>
                      {message.emotion && message.sender === 'ai' && (
                        <div className="mt-3 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-cyan-400" />
                          <Badge className="glass-card text-white border-white/20 text-xs">
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
                  <div className="glass-card p-6 rounded-2xl border border-white/20">
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
              <div className="glass-card p-4 rounded-2xl border border-white/20">
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