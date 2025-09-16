import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { SimulationView } from './components/SimulationView';
import { FeedbackView } from './components/FeedbackView';
import { ProgressView } from './components/ProgressView';
import { CreatorView } from './components/CreatorView';
import { ScenarioHistoryView } from './components/ScenarioHistoryView';
import { apiService, type Scenario as ApiScenario, type CustomSimulation as ApiCustomSimulation, type UserData as ApiUserData, type Simulation as ApiSimulation } from './services/api';

// Use API types directly
type Scenario = ApiScenario;
type CustomSimulation = ApiCustomSimulation;
type UserData = ApiUserData;
type Simulation = ApiSimulation;

type AppState = 'landing' | 'dashboard' | 'simulation' | 'feedback' | 'progress' | 'creator' | 'scenario-history';

export default function AppRouter() {
  const [user, setUser] = useState<UserData | null>(null);
  const [currentView, setCurrentView] = useState<AppState>('landing');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [simulationData, setSimulationData] = useState<{ messages: any[]; duration: number } | null>(null);
  const [customSimulations, setCustomSimulations] = useState<CustomSimulation[]>([]);
  const [activeSimulation, setActiveSimulation] = useState<Simulation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSimulationId, setSelectedSimulationId] = useState<number | null>(null);
  const [scenariosCache, setScenariosCache] = useState<Scenario[]>([]);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  const navigate = useNavigate();

  // Helper function to load scenarios with cache
  const loadScenariosWithCache = async (): Promise<Scenario[]> => {
    // Return cache if available
    if (scenariosCache.length > 0) {
      return scenariosCache;
    }

    // Prevent multiple simultaneous calls
    if (isLoadingScenarios) {
      return [];
    }

    try {
      setIsLoadingScenarios(true);
      const scenariosResponse = await apiService.getScenarios();
      setScenariosCache(scenariosResponse.results);
      return scenariosResponse.results;
    } catch (error) {
      console.error('Error loading scenarios:', error);
      return [];
    } finally {
      setIsLoadingScenarios(false);
    }
  };

  // Helper function to find scenario by ID
  const findScenarioById = async (scenarioId: string): Promise<Scenario | null> => {
    const scenarios = await loadScenariosWithCache();
    return scenarios.find(s => s.id.toString() === scenarioId) || null;
  };

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

  const handleLogout = async () => {
    try {
      // Clear API service token first
      apiService.setToken('');

      // Call server logout
      await apiService.logout();
    } catch (error) {
      console.warn('Server logout failed, proceeding with local logout:', error);
    } finally {
      // Always clear local state
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
    }
  };

  const handleStartSimulation = async (scenario: Scenario) => {
    console.log('Starting simulation for scenario:', scenario);
    setSelectedScenario(scenario);
    navigate(`/scenario/${scenario.id}/history`);
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

  const handleStartScenarioFromId = async (scenarioId: string) => {
    try {
      const scenario = await findScenarioById(scenarioId);
      if (scenario) {
        await handleStartSimulation(scenario);
      }
    } catch (error) {
      console.error('Error loading scenario:', error);
    }
  };

  const handleSelectSimulation = (simulationId: number) => {
    setSelectedSimulationId(simulationId);
    setCurrentView('simulation');
    if (selectedScenario) {
      navigate(`/simulation/${selectedScenario.id}`);
    }
  };

  const handleCreateNewSimulation = async () => {
    if (selectedScenario) {
      setSelectedSimulationId(null);
      setCurrentView('simulation');

      try {
        // Create simulation
        const newSimulation = await apiService.createSimulation({
          scenario: parseInt(selectedScenario.id)
        });
        console.log('Simulation created:', newSimulation);
        setActiveSimulation(newSimulation);

        navigate(`/simulation/${selectedScenario.id}`);
      } catch (err) {
        console.error('Error creating simulation:', err);
        setError(err instanceof Error ? err.message : 'Error creating simulation');
      }
    }
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
      
      <Route path="/scenario/:scenarioId/history" element={<ScenarioHistoryRoute />} />
      <Route path="/simulation/:scenarioId" element={<SimulationRoute />} />
      <Route path="/feedback/:scenarioId" element={<FeedbackRoute />} />
      <Route path="/progress" element={<ProgressRoute />} />
      <Route path="/creator" element={<CreatorRoute />} />
    </Routes>
  );

  // Route components
  function ScenarioHistoryRoute() {
    const { scenarioId } = useParams<{ scenarioId: string }>();

    useEffect(() => {
      // If we don't have the selected scenario, load it
      if (!selectedScenario || selectedScenario.id.toString() !== scenarioId) {
        const loadScenario = async () => {
          try {
            const scenario = await findScenarioById(scenarioId!);
            if (scenario) {
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
      }
    }, [scenarioId, navigate, selectedScenario]);

    if (!selectedScenario) {
      return (
        <div className="h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
          <div className="text-white text-lg">Cargando historial...</div>
        </div>
      );
    }

    return (
      <div>
        <Header user={user!} onLogout={handleLogout} currentView="dashboard" />
        <ScenarioHistoryView
          scenario={selectedScenario}
          onSelectSimulation={handleSelectSimulation}
          onCreateNewSimulation={handleCreateNewSimulation}
          onBackToDashboard={handleBackToDashboard}
        />
      </div>
    );
  }

  function SimulationRoute() {
    const { scenarioId } = useParams<{ scenarioId: string }>();
    
    console.log('SimulationRoute rendered with scenarioId:', scenarioId);
    console.log('Current selectedScenario:', selectedScenario);
    
    useEffect(() => {
      console.log('SimulationRoute useEffect triggered');
      // If we don't have the selected scenario, load it
      if (!selectedScenario || selectedScenario.id.toString() !== scenarioId) {
        console.log('Loading scenario because:', { 
          selectedScenario: !!selectedScenario, 
          selectedScenarioId: selectedScenario?.id,
          scenarioId: scenarioId,
          idMatch: selectedScenario?.id === scenarioId 
        });
        const loadScenario = async () => {
          try {
            const scenario = await findScenarioById(scenarioId!);
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
        <SimulationView
          scenario={{...selectedScenario, is_featured: selectedScenario.is_featured || false}}
          onEndSimulation={handleEndSimulation}
          onBackToDashboard={() => navigate(`/scenario/${selectedScenario.id}/history`)}
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
          const scenario = await findScenarioById(scenarioId!);
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
          onStartScenario={handleStartScenarioFromId}
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
