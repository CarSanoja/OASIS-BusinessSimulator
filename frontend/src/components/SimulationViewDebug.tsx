import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { apiService, type Simulation } from "../services/api";

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

interface SimulationViewDebugProps {
  scenario: Scenario;
  onBackToDashboard: () => void;
}

export function SimulationViewDebug({ scenario, onBackToDashboard }: SimulationViewDebugProps) {
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');

  console.log('SimulationViewDebug rendering with scenario:', scenario);

  useEffect(() => {
    const initializeSimulation = async () => {
      try {
        console.log('Initializing simulation for scenario:', scenario);
        setLoading(true);
        
        const newSimulation = await apiService.createSimulation({
          scenario: parseInt(scenario.id)
        });
        console.log('Created simulation:', newSimulation);
        setSimulation(newSimulation);
        
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

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !simulation) return;

    const messageContent = currentMessage;
    setCurrentMessage('');

    try {
      console.log('Sending message to simulation:', simulation.id, 'Content:', messageContent);
      
      const response = await apiService.sendMessage(simulation.id, messageContent);
      console.log('Received API response:', response);
      
      setMessages(prev => [...prev, response.user_message, response.ai_message]);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Error sending message');
    }
  };

  console.log('Render state:', { loading, error, messages: messages.length, simulation: !!simulation });

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Iniciando Simulación (Debug)</h3>
          <p className="text-white/70">Preparando entorno de aprendizaje...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
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
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button onClick={onBackToDashboard} className="mb-4">
            ← Volver al Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-4">Simulación Debug - {scenario.title}</h1>
          <p className="text-gray-300 mb-4">{scenario.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Categoría:</strong> {scenario.category}
            </div>
            <div>
              <strong>Dificultad:</strong> {scenario.difficulty}
            </div>
            <div>
              <strong>Duración:</strong> {scenario.duration}
            </div>
            <div>
              <strong>Participantes:</strong> {scenario.participants}
            </div>
          </div>
        </div>

        {simulation && (
          <div className="mb-8 p-4 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Simulación Activa</h2>
            <p><strong>ID:</strong> {simulation.id}</p>
            <p><strong>Estado:</strong> {simulation.status}</p>
            <p><strong>Iniciada:</strong> {new Date(simulation.started_at).toLocaleString()}</p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Chat</h2>
          <div className="space-y-4 mb-4">
            {messages.map((message, index) => (
              <div key={index} className={`p-4 rounded-lg ${
                message.sender === 'user' ? 'bg-blue-600 ml-8' : 'bg-gray-700 mr-8'
              }`}>
                <div className="font-semibold mb-1">
                  {message.sender === 'user' ? 'Tú' : 'AI'}
                </div>
                <div>{message.content}</div>
                <div className="text-xs opacity-70 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString()}
                  {message.emotion && ` • ${message.emotion}`}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!currentMessage.trim()}
              className="px-6"
            >
              Enviar
            </Button>
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Debug Info</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({ scenario, simulation, messages }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
