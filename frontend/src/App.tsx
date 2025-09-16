import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SimulationView } from './components/SimulationView';
import { SimulationViewDebug } from './components/SimulationViewDebug';
import { SimulationView as SimulationViewFixed } from './components/SimulationViewFixed';
import { FeedbackView } from './components/FeedbackView';
import { ProgressView } from './components/ProgressView';
import { CreatorView } from './components/CreatorView';
import { ScenarioHistoryView } from './components/ScenarioHistoryView';
import { apiService } from './services/api';

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
  is_featured: boolean;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  emotion?: string;
}

interface UserData {
  email: string;
  name: string;
}

interface CustomSimulation {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  skills: string[];
  userRole: string;
  aiRole: string;
  aiPersonality: {
    analytical: number;
    patience: number;
    aggression: number;
    flexibility: number;
  };
  aiObjectives: string[];
  userObjectives: string[];
  endConditions: string[];
  knowledgeBase?: string;
  isPublished: boolean;
  createdBy: string;
  createdAt: Date;
}

type AppState = 'landing' | 'dashboard' | 'simulation' | 'feedback' | 'progress' | 'creator' | 'scenario-history';

export default function App() {
  const [currentView, setCurrentView] = useState<AppState>('landing');
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [simulationData, setSimulationData] = useState<{
    messages: Message[];
    duration: number;
  } | null>(null);
  const [customSimulations, setCustomSimulations] = useState<CustomSimulation[]>([]);
  const [selectedSimulationId, setSelectedSimulationId] = useState<number | null>(null);

  // Check for existing session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('userData') || localStorage.getItem('oasis-user') || localStorage.getItem('user');
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('access_token');
    
    if (savedUser && authToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setCurrentView('dashboard');
        // Ensure API service has the token
        apiService.setToken(authToken);
      } catch (error) {
        // Clear invalid session data
        localStorage.removeItem('oasis-user');
        localStorage.removeItem('userData');
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('access_token');
      }
    }
  }, []);

  const handleLogin = (userData: UserData) => {
    setUser(userData);
    setCurrentView('dashboard');
    localStorage.setItem('oasis-user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      // Call API logout to invalidate tokens
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    // Clear local state and storage
    setUser(null);
    setCurrentView('landing');
    setSelectedScenario(null);
    setSimulationData(null);
    localStorage.removeItem('oasis-user');
    localStorage.removeItem('userData');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('access_token');
  };

  const handleStartSimulation = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setCurrentView('scenario-history');
  };

  const handleSelectSimulation = (simulationId: number) => {
    setSelectedSimulationId(simulationId);
    setCurrentView('simulation');
  };

  const handleCreateNewSimulation = () => {
    setSelectedSimulationId(null);
    setCurrentView('simulation');
  };

  const handleEndSimulation = (messages: Message[], duration: number) => {
    setSimulationData({ messages, duration });
    setCurrentView('feedback');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedScenario(null);
    setSimulationData(null);
  };

  const handleRestartSimulation = () => {
    setCurrentView('simulation');
  };

  const handleViewProgress = () => {
    setCurrentView('progress');
  };

  const handleViewCreator = () => {
    setCurrentView('creator');
  };

  const handleStartScenario = (scenarioId: string) => {
    // En implementación real, buscaría el escenario por ID
    const scenario = {
      id: scenarioId,
      title: 'Escenario desde progreso',
      category: 'Test',
      description: 'Test',
      difficulty: 'Intermedio',
      duration: '20 min',
      participants: 'Test',
      objectives: ['Test'],
      skills: ['Test'],
      is_featured: false
    };
    setSelectedScenario(scenario);
    setCurrentView('simulation');
  };

  const handleSimulationCreated = (simulation: CustomSimulation) => {
    setCustomSimulations(prev => [...prev, simulation]);
    // Mostrar notificación de éxito y regresar al dashboard
    setCurrentView('dashboard');
  };

  // Show landing page if not authenticated
  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  switch (currentView) {
    case 'scenario-history':
      return selectedScenario ? (
        <div>
          <Header user={user} onLogout={handleLogout} currentView="dashboard" />
          <ScenarioHistoryView
            scenario={selectedScenario}
            onSelectSimulation={handleSelectSimulation}
            onCreateNewSimulation={handleCreateNewSimulation}
            onBackToDashboard={handleBackToDashboard}
          />
        </div>
      ) : null;

    case 'simulation':
      return selectedScenario ? (
        <div>
          <Header user={user} onLogout={handleLogout} currentView="simulation" />
          <SimulationView
            scenario={{...selectedScenario, is_featured: selectedScenario.is_featured || false}}
            onEndSimulation={handleEndSimulation}
            onBackToDashboard={() => setCurrentView('scenario-history')}
          />
        </div>
      ) : null;

    case 'feedback':
      return selectedScenario && simulationData ? (
        <div>
          <Header user={user} onLogout={handleLogout} currentView="feedback" />
          <FeedbackView
            messages={simulationData.messages}
            duration={simulationData.duration}
            scenarioTitle={selectedScenario.title}
            onBackToDashboard={handleBackToDashboard}
            onRestartSimulation={handleRestartSimulation}
          />
        </div>
      ) : null;

    case 'progress':
      return (
        <div>
          <Header user={user} onLogout={handleLogout} currentView="progress" />
          <ProgressView
            onBackToDashboard={handleBackToDashboard}
            onStartScenario={handleStartScenario}
          />
        </div>
      );

    case 'creator':
      return (
        <div>
          <Header user={user} onLogout={handleLogout} currentView="creator" />
          <CreatorView
            onBackToDashboard={handleBackToDashboard}
            onSimulationCreated={handleSimulationCreated}
          />
        </div>
      );

    default:
      return (
        <div>
          <Header user={user} onLogout={handleLogout} currentView="dashboard" />
          <DashboardView 
            onStartSimulation={handleStartSimulation}
            onViewProgress={handleViewProgress}
            onViewCreator={handleViewCreator}
            customSimulations={customSimulations}
          />
        </div>
      );
  }
}