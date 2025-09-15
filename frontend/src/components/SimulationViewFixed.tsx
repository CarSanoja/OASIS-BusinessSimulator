import React, { useState, useEffect, useRef } from 'react';
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
  BookOpen,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
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
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  duration: string;
  participants: string;
  objectives: string[];
  skills: string[];
}

interface SimulationViewProps {
  scenario: Scenario;
  simulation?: Simulation | null;
  onEndSimulation: (messages: Message[], duration: number) => void;
  onBackToDashboard: () => void;
}

export function SimulationView({ scenario, simulation: propSimulation, onEndSimulation, onBackToDashboard }: SimulationViewProps) {
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Initialize simulation and load messages
  useEffect(() => {
    console.log('SimulationView useEffect - initializing simulation');
    console.log('Prop simulation:', propSimulation);
    console.log('Local simulation state:', simulation);
    
    const initializeSimulation = async () => {
      try {
        setLoading(true);
        
        // Use prop simulation if available, otherwise create new one
        let simToUse = propSimulation;
        
        if (!simToUse) {
          console.log('Creating new simulation for scenario:', scenario.id);
          simToUse = await apiService.createSimulation({
            scenario: parseInt(scenario.id)
          });
          console.log('Simulation created:', simToUse);
        } else {
          console.log('Using existing simulation:', simToUse);
        }
        
        setSimulation(simToUse);
        
        // Load existing messages
        await loadMessages(simToUse.id, 1);
        
        setLoading(false);
      } catch (err) {
        console.error('Error creating simulation:', err);
        setError(err instanceof Error ? err.message : 'Error creating simulation');
        setLoading(false);
      }
    };

    // Only initialize if we don't have a simulation yet
    if (!simulation) {
      initializeSimulation();
    }
  }, [scenario.id, propSimulation]); // Include propSimulation in dependencies

  // Load messages function
  const loadMessages = async (simulationId: number, page: number) => {
    try {
      setLoadingMoreMessages(true);
      const response = await apiService.getMessages(simulationId, page, 20);
      
      // Convert API messages to local Message format
      const newMessages: Message[] = response.results.map(msg => ({
        id: msg.id.toString(),
        sender: msg.sender,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        emotion: msg.emotion
      }));

      if (page === 1) {
        // First page - replace all messages
        setMessages(newMessages);
      } else {
        // Subsequent pages - prepend to existing messages
        setMessages(prev => [...newMessages, ...prev]);
      }

      setHasMoreMessages(response.pagination.has_next);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  // Load more messages when scrolling to top
  const loadMoreMessages = async () => {
    if (!simulation || loadingMoreMessages || !hasMoreMessages) return;
    
    const nextPage = currentPage + 1;
    await loadMessages(simulation.id, nextPage);
  };

  // Auto-scroll to bottom when new messages arrive (only if user is at bottom)
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
      
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  // Handle scroll for infinite loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const isAtTop = container.scrollTop <= 100;
    
    if (isAtTop && hasMoreMessages && !loadingMoreMessages) {
      loadMoreMessages();
    }
  };

  const getElapsedTime = () => {
    const elapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCompletedObjectives = () => {
    return Object.values(objectiveProgress).filter(Boolean).length;
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !simulation || isAiTyping) return;

    const messageContent = currentMessage.trim();
    setCurrentMessage('');
    setIsAiTyping(true);

    try {
      console.log('Sending message to simulation:', simulation.id, 'Content:', messageContent);
      const response = await apiService.sendMessage(simulation.id, messageContent);
      console.log('Received API response:', response);
      
      if (!response || !response.user_message || !response.ai_message) {
        throw new Error('Invalid API response structure');
      }
      
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
      setMessages(prev => {
        const newMessages = [...prev, userMessage, aiMessage];
        console.log('Updated messages array:', newMessages);
        return newMessages;
      });

      // Update objective progress
      if (response.objective_progress) {
        setObjectiveProgress(prev => ({
          ...prev,
          ...response.objective_progress
        }));
      }

      // Simulate emotional tone and strategic alignment changes
      setEmotionalTone(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 20)));
      setStrategicAlignment(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 15)));

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Error sending message');
      
      // Create error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        content: 'Disculpe, hubo un error procesando su mensaje. Por favor, intente nuevamente.',
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
      const duration = Math.floor((Date.now() - startTime.getTime()) / 1000);
      await apiService.endSimulation(simulation.id);
      onEndSimulation(messages, duration);
    } catch (err) {
      console.error('Error ending simulation:', err);
      // Still end the simulation locally
      const duration = Math.floor((Date.now() - startTime.getTime()) / 1000);
      onEndSimulation(messages, duration);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Iniciando simulación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <p className="text-white text-lg mb-4">{error}</p>
          <Button 
            onClick={onBackToDashboard}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  console.log('Rendering main simulation view');

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
      {/* Top Header - Fixed */}
      <div className="flex-shrink-0 bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBackToDashboard}
              className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-cyan-400" />
              <span className="text-white font-semibold">Simulación Activa</span>
              <span className="text-white/70 text-sm">• {scenario.category}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
            >
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <Button 
              onClick={handleEndSimulation}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
            >
              Finalizar Simulación
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Context Panel */}
        {sidebarOpen && (
          <div className="w-80 bg-black/20 backdrop-blur-sm border-r border-white/10 p-6 flex flex-col overflow-y-auto">
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
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="flex-shrink-0 bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Simulación Empresarial</h3>
                <p className="text-white/70 text-sm">{scenario.participants}</p>
              </div>
            </div>
          </div>

          {/* Messages Area - Takes remaining space */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4"
            onScroll={handleScroll}
          >
            {/* Loading indicator for more messages */}
            {loadingMoreMessages && (
              <div className="flex justify-center py-4">
                <div className="text-white/60 text-sm">Cargando mensajes anteriores...</div>
              </div>
            )}
            
            <div className="max-w-4xl mx-auto space-y-6">
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
          </div>

          {/* Message Input - Fixed at bottom */}
          <div className="flex-shrink-0 p-4 border-t border-white/10">
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