import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { SimulationView as SimulationViewFixed } from './components/SimulationViewFixed';
import { FeedbackView } from './components/FeedbackView';
import { ProgressView } from './components/ProgressView';
import { CreatorView } from './components/CreatorView';
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
  image_url: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  image: string;
}

interface Simulation {
  id: number;
  scenario: number;
  custom_simulation: number | null;
  status: string;
  started_at: string;
}

interface UserData {
  id: number;
  name: string;
}

interface CustomSimulation {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  skills: string[];
  user_role: string;
  ai_role: string;
  ai_personality: Record<string, number>;
  ai_objectives: string[];
  user_objectives: string[];
  end_conditions: string[];
  knowledge_base: string;
  is_published: boolean;
  createdAt: Date;
}

type AppState = 'landing' | 'dashboard' | 'simulation' | 'feedback' | 'progress' | 'creator';

export default function AppRouter() {
  const [user, setUser] = useState<UserData | null>(null);
  const [currentView, setCurrentView] = useState<AppState>('landing');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [simulationData, setSimulationData] = useState<{ messages: any[]; duration: number } | null>(null);
  const [customSimulations, setCustomSimulations] = useState<CustomSimulation[]>([]);
  const [activeSimulation, setActiveSimulation] = useState<Simulation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('landing');
    setSelectedScenario(null);
    setSimulationData(null);
    setCustomSimulations([]);
    localStorage.removeItem('oasis-user');
    localStorage.removeItem('userData');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refreshToken');
    navigate('/');
  };

  const handleStartSimulation = async (scenario: Scenario) => {
    console.log('Starting simulation for scenario:', scenario);
    setSelectedScenario(scenario);
    setCurrentView('simulation');
    
    try {
      // Create simulation in the router
      const newSimulation = await apiService.createSimulation({
        scenario: parseInt(scenario.id)
      });
      console.log('Simulation created in router:', newSimulation);
      setActiveSimulation(newSimulation);
      
      navigate(`/simulation/${scenario.id}`);
    } catch (err) {
      console.error('Error creating simulation:', err);
      setError(err instanceof Error ? err.message : 'Error creating simulation');
    }
  };

  const handleEndSimulation = (messages: any[], duration: number) => {
    setSimulationData({ messages, duration });
    setCurrentView('feedback');
    navigate(`/feedback/${selectedScenario?.id}`);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedScenario(null);
    setSimulationData(null);
    navigate('/dashboard');
  };

  const handleViewProgress = () => {
    setCurrentView('progress');
    navigate('/progress');
  };

  const handleViewCreator = () => {
    setCurrentView('creator');
    navigate('/creator');
  };

  const handleSimulationCreated = (simulation: CustomSimulation) => {
    setCustomSimulations(prev => [...prev, simulation]);
    setCurrentView('dashboard');
    navigate('/dashboard');
  };

  const handleRestartSimulation = () => {
    if (selectedScenario) {
      setCurrentView('simulation');
      navigate(`/simulation/${selectedScenario.id}`);
    }
  };

  // If user is not logged in, show landing page
  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <Routes>
      <Route path="/" element={
        <div>
          <Header user={user} onLogout={handleLogout} currentView="dashboard" />
          <DashboardView 
            onStartSimulation={handleStartSimulation}
            onViewProgress={handleViewProgress}
            onViewCreator={handleViewCreator}
            customSimulations={customSimulations}
          />
        </div>
      } />
      
      <Route path="/dashboard" element={
        <div>
          <Header user={user} onLogout={handleLogout} currentView="dashboard" />
          <DashboardView 
            onStartSimulation={handleStartSimulation}
            onViewProgress={handleViewProgress}
            onViewCreator={handleViewCreator}
            customSimulations={customSimulations}
          />
        </div>
      } />
      
      <Route path="/simulation/:scenarioId" element={<SimulationRoute />} />
      <Route path="/feedback/:scenarioId" element={<FeedbackRoute />} />
      <Route path="/progress" element={<ProgressRoute />} />
      <Route path="/creator" element={<CreatorRoute />} />
    </Routes>
  );

  // Route components
  function SimulationRoute() {
    const { scenarioId } = useParams<{ scenarioId: string }>();
    
    console.log('SimulationRoute rendered with scenarioId:', scenarioId);
    console.log('Current selectedScenario:', selectedScenario);
    
    useEffect(() => {
      console.log('SimulationRoute useEffect triggered');
      // If we don't have the selected scenario, load it
      if (!selectedScenario || selectedScenario.id !== scenarioId) {
        console.log('Loading scenario because:', { selectedScenario: !!selectedScenario, idMatch: selectedScenario?.id === scenarioId });
        const loadScenario = async () => {
          try {
            const scenarios = await apiService.getScenarios();
            const scenario = scenarios.find(s => s.id === scenarioId);
            if (scenario) {
              console.log('Found scenario:', scenario);
              setSelectedScenario(scenario);
            } else {
              console.error('Scenario not found:', scenarioId);
              navigate('/dashboard');
            }
          } catch (error) {
            console.error('Error loading scenario:', error);
            navigate('/dashboard');
          }
        };
        
        loadScenario();
      } else {
        console.log('Scenario already loaded, skipping load');
      }
    }, [scenarioId, navigate, selectedScenario]);

    if (!selectedScenario) {
      return (
        <div className="h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
          <div className="text-white text-lg">Cargando simulación...</div>
        </div>
      );
    }

    return (
      <div>
        <Header user={user!} onLogout={handleLogout} currentView="simulation" />
        <SimulationViewFixed
          scenario={selectedScenario}
          simulation={activeSimulation}
          onEndSimulation={handleEndSimulation}
          onBackToDashboard={handleBackToDashboard}
        />
      </div>
    );
  }

  function FeedbackRoute() {
    const { scenarioId } = useParams<{ scenarioId: string }>();
    
    useEffect(() => {
      // Load scenario data based on scenarioId
      const loadScenario = async () => {
        try {
          const scenarios = await apiService.getScenarios();
          const scenario = scenarios.find(s => s.id === scenarioId);
          if (scenario) {
            setSelectedScenario(scenario);
          }
        } catch (error) {
          console.error('Error loading scenario:', error);
          navigate('/dashboard');
        }
      };
      
      loadScenario();
    }, [scenarioId, navigate]);

    if (!selectedScenario || !simulationData) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        <Header user={user!} onLogout={handleLogout} currentView="feedback" />
        <FeedbackView
          messages={simulationData.messages}
          duration={simulationData.duration}
          scenarioTitle={selectedScenario.title}
          onBackToDashboard={handleBackToDashboard}
          onRestartSimulation={handleRestartSimulation}
        />
      </div>
    );
  }

  function ProgressRoute() {
    return (
      <div>
        <Header user={user!} onLogout={handleLogout} currentView="progress" />
        <ProgressView
          onBackToDashboard={handleBackToDashboard}
          onStartScenario={handleStartSimulation}
        />
      </div>
    );
  }

  function CreatorRoute() {
    return (
      <div>
        <Header user={user!} onLogout={handleLogout} currentView="creator" />
        <CreatorView
          onBackToDashboard={handleBackToDashboard}
          onSimulationCreated={handleSimulationCreated}
        />
      </div>
    );
  }
}
