import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Users, TrendingUp, Lightbulb, Clock, Target, BarChart3, Building2, Globe, Search, Filter, Star, Play, BookOpen, Award, Zap, ChevronRight, ArrowRight, Plus, Settings, Sparkles } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { apiService, type Scenario, type CustomSimulation } from "../services/api";
import { useTranslation } from "react-i18next";

// Remove hardcoded scenarios - will be loaded from API

interface LearningPath {
  id: string;
  title: string;
  description: string;
  scenarios: string[];
  totalTime: string;
  difficulty: string;
  icon: string;
  color: string;
}

const learningPaths: LearningPath[] = [
  {
    id: 'leadership-mastery',
    title: 'Maestría en Liderazgo Ejecutivo',
    description: 'De gerente a CEO: desarrolla las competencias críticas para liderar organizaciones complejas',
    scenarios: ['crisis-leadership', 'team-performance', 'board-strategic-planning'],
    totalTime: '2-3 horas',
    difficulty: 'Avanzado',
    icon: '👑',
    color: 'from-purple-600 to-pink-600'
  },
  {
    id: 'strategic-thinking',
    title: 'MBA en Estrategia Corporativa',
    description: 'Construye músculos estratégicos para decisiones de alto impacto en mercados competitivos',
    scenarios: ['merger-negotiation', 'international-expansion', 'board-strategic-planning'],
    totalTime: '3-4 horas',
    difficulty: 'Avanzado',
    icon: '🎯',
    color: 'from-blue-600 to-cyan-600'
  },
  {
    id: 'entrepreneur-journey',
    title: 'El Camino del Emprendedor',
    description: 'De la idea al exit: navega el ecosistema emprendedor desde pitch hasta adquisición',
    scenarios: ['startup-pitch', 'merger-negotiation', 'crisis-leadership'],
    totalTime: '2-3 horas',
    difficulty: 'Intermedio',
    icon: '🚀',
    color: 'from-orange-600 to-red-600'
  }
];


interface DashboardViewProps {
  onStartSimulation: (scenario: any) => void;
  onViewProgress: () => void;
  onViewCreator: () => void;
  customSimulations: CustomSimulation[];
  onCustomSimulationsLoaded?: (simulations: CustomSimulation[]) => void;
}

export function DashboardView({ onStartSimulation, onViewProgress, onViewCreator, customSimulations, onCustomSimulationsLoaded }: DashboardViewProps) {
  const { t } = useTranslation(['dashboard', 'common']);

  // Enhanced debug logging for custom simulations
  console.log('🎨 [DashboardView] Component rendered/re-rendered');
  console.log('🎨 [DashboardView] Received customSimulations prop:', customSimulations.length, 'simulations');
  console.log('📋 [DashboardView] Custom simulations data:', customSimulations);
  console.log('🔍 [DashboardView] customSimulations type:', typeof customSimulations);
  console.log('🔍 [DashboardView] Is customSimulations array?', Array.isArray(customSimulations));

  // Log each simulation individually
  customSimulations.forEach((sim, index) => {
    console.log(`📱 [DashboardView] Simulation ${index + 1}:`, {
      id: sim.id,
      title: sim.title,
      category: sim.category,
      isPublished: sim.isPublished,
      createdAt: sim.createdAt
    });
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [activeSection, setActiveSection] = useState<'featured' | 'paths' | 'library'>('featured');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [featuredScenarios, setFeaturedScenarios] = useState<Scenario[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [localCustomSimulations, setLocalCustomSimulations] = useState<CustomSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load data from API
  useEffect(() => {
    // console.log('🔍 DashboardView useEffect triggered:', {
    //   selectedCategory,
    //   selectedDifficulty,
    //   searchTerm,
    //   debouncedSearchTerm,
    //   loading,
    //   isCallInProgress,
    //   timestamp: new Date().toISOString()
    // });

    // Prevent multiple simultaneous calls
    if (isCallInProgress) {
      // console.log('⏸️ Skipping API call - call already in progress');
      return;
    }

    const loadData = async () => {
      try {
        // console.log('📡 Starting API calls...');
        setIsCallInProgress(true);
        setLoading(true);
        
        // Load scenarios
        const scenariosResponse = await apiService.getScenarios({
          category: selectedCategory,
          difficulty: selectedDifficulty,
          search: debouncedSearchTerm
        });
        setScenarios(scenariosResponse.results);

        // Load featured scenarios
        const featuredResponse = await apiService.getFeaturedScenarios();
        setFeaturedScenarios(featuredResponse);

        // Load categories
        const categoriesResponse = await apiService.getCategories();
        setCategories(categoriesResponse);

        // Load custom simulations (this was missing!)
        console.log('🔄 [DashboardView] Loading custom simulations...');
        const customSimulationsResponse = await apiService.getCustomSimulations();
        console.log('✅ [DashboardView] Custom simulations loaded:', customSimulationsResponse.length);

        // Store in local state for immediate use
        setLocalCustomSimulations(customSimulationsResponse);

        // Update parent state if callback provided
        if (onCustomSimulationsLoaded) {
          onCustomSimulationsLoaded(customSimulationsResponse);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
        setIsCallInProgress(false);
      }
    };

    loadData();
  }, [selectedCategory, selectedDifficulty, debouncedSearchTerm]);

  const getDifficultyStars = (difficulty: string) => {
    const stars = difficulty === t('dashboard:beginnerLevel') ? 1 : difficulty === t('dashboard:intermediateLevel') ? 2 : 3;
    return Array.from({ length: 3 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < stars ? 'fill-current text-yellow-400' : 'text-gray-400'}`} 
      />
    ));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Estrategia Corporativa': return <Building2 className="h-4 w-4" />;
      case 'Liderazgo Ejecutivo': return <Users className="h-4 w-4" />;
      case 'Emprendimiento': return <Lightbulb className="h-4 w-4" />;
      case 'Estrategia Global': return <Globe className="h-4 w-4" />;
      case 'Gestión de Talento': return <TrendingUp className="h-4 w-4" />;
      case 'Gobernanza Corporativa': return <BarChart3 className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  // Filter scenarios (filtering is now done by API, but keep for client-side search)
  const filteredScenarios = scenarios;
  const difficulties = [t('dashboard:beginnerLevel'), t('dashboard:intermediateLevel'), t('dashboard:advancedLevel')];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5"></div>
        <div className="relative w-full px-4 md:px-6 lg:px-8 xl:px-12 py-16">
          <div className="text-center max-w-4xl mx-auto">
            {/* Brand Header */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">O</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  OASIS
                </h1>
              </div>
            </div>

            {/* Value Proposition */}
            <div className="space-y-6 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                {t('dashboard:platformTitle', { defaultValue: 'Tu Plataforma de' })}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> {t('dashboard:learningEmpowerment', { defaultValue: 'Empoderamiento del Aprendizaje' })}</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                {t('dashboard:platformDescription', { defaultValue: 'Experimenta el futuro del aprendizaje inmersivo con IA. Desde simulaciones ejecutivas hasta próximos módulos revolucionarios, OASIS transforma cómo desarrollas habilidades críticas para el éxito profesional.' })}
              </p>
              
              {/* Preview of upcoming features */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-4 py-2">
                  🎭 Role-Playing {t('dashboard:executive', { defaultValue: 'Ejecutivo' })} <span className="ml-1 text-green-600">• {t('dashboard:active', { defaultValue: 'Activo' })}</span>
                </Badge>
                <Badge className="bg-gray-100 text-gray-600 border-gray-200 px-4 py-2">
                  🧠 {t('dashboard:smartCoaching', { defaultValue: 'Coaching Inteligente' })} <span className="ml-1 text-amber-600">• {t('dashboard:comingSoon', { defaultValue: 'Próximamente' })}</span>
                </Badge>
                <Badge className="bg-gray-100 text-gray-600 border-gray-200 px-4 py-2">
                  📈 {t('dashboard:predictiveAnalysis', { defaultValue: 'Análisis Predictivo' })} <span className="ml-1 text-amber-600">• {t('dashboard:comingSoon', { defaultValue: 'Próximamente' })}</span>
                </Badge>
                <Badge className="bg-gray-100 text-gray-600 border-gray-200 px-4 py-2">
                  🎯 {t('dashboard:skillAssessment', { defaultValue: 'Skill Assessment' })} <span className="ml-1 text-amber-600">• {t('dashboard:comingSoon', { defaultValue: 'Próximamente' })}</span>
                </Badge>
              </div>
            </div>

            {/* CTA Section */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                onClick={() => setActiveSection('featured')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <Play className="h-5 w-5 mr-2" />
                {t('dashboard:exploreRolePlaying', { defaultValue: 'Explorar Role-Playing' })}
              </Button>
              <Button 
                onClick={onViewProgress}
                variant="outline"
                size="lg"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-xl"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                {t('dashboard:myDashboard', { defaultValue: 'Mi Dashboard' })}
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <span>{t('dashboard:professionalsEmpowered', { defaultValue: '+2,500 profesionales empoderados' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span>{t('dashboard:module1Active', { defaultValue: 'Módulo 1: Role-Playing activo' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span>{t('dashboard:modulesInDevelopment', { count: 3, defaultValue: '3 módulos más en desarrollo' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-40">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
            <nav className="flex flex-col sm:flex-row gap-1 bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
              <button
                onClick={() => setActiveSection('featured')}
                className={`px-3 sm:px-6 py-2 rounded-md font-medium transition-all text-sm sm:text-base ${
                  activeSection === 'featured'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🏆 {t('dashboard:featuredModule', { defaultValue: 'Módulo Destacado' })}
              </button>
              <button
                onClick={() => setActiveSection('paths')}
                className={`px-3 sm:px-6 py-2 rounded-md font-medium transition-all text-sm sm:text-base ${
                  activeSection === 'paths'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🎯 {t('dashboard:structuredPrograms', { defaultValue: 'Programas Estructurados' })}
              </button>
              <button
                onClick={() => setActiveSection('library')}
                className={`px-3 sm:px-6 py-2 rounded-md font-medium transition-all text-sm sm:text-base ${
                  activeSection === 'library'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📚 {t('dashboard:completeCatalog', { defaultValue: 'Catálogo Completo' })}
              </button>
            </nav>

            {/* Creator Button */}
            <Button 
              onClick={onViewCreator}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('dashboard:createSimulationButton')}
            </Button>

            {activeSection === 'library' && (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    placeholder={t('dashboard:searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t('dashboard:category', { defaultValue: 'Categoría' })} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('dashboard:allCategories', { defaultValue: 'Todas las categorías' })}</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Modules Preview */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-y border-gray-200">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 py-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">🚀 {t('dashboard:futureOfLearning', { defaultValue: 'El Futuro del Aprendizaje Inmersivo' })}</h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              {t('dashboard:oasisRevolutionizing', { defaultValue: 'OASIS está revolucionando el desarrollo profesional. Mientras disfrutas nuestro módulo de Role-Playing, estamos construyendo el futuro del aprendizaje personalizado.' })}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">{t('dashboard:comingSoon', { defaultValue: 'Próximamente' })}</Badge>
              </div>
              <div className="text-3xl mb-4">🧠</div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">{t('dashboard:aiCoachingTitle', { defaultValue: 'AI Coaching Personalizado' })}</h4>
              <p className="text-gray-600 text-sm mb-4">
                {t('dashboard:aiCoachingDesc', { defaultValue: 'Coach inteligente que adapta el aprendizaje a tu estilo, fortalezas y áreas de oportunidad únicos.' })}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                <span>{t('dashboard:inActiveDevelopment', { defaultValue: 'En desarrollo activo' })}</span>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Q2 2024</Badge>
              </div>
              <div className="text-3xl mb-4">📊</div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">{t('dashboard:predictiveAnalyticsTitle', { defaultValue: 'Analytics Predictivo' })}</h4>
              <p className="text-gray-600 text-sm mb-4">
                {t('dashboard:predictiveAnalyticsDesc', { defaultValue: 'Predicciones de rendimiento y recomendaciones de carrera basadas en tu progreso y mercado laboral.' })}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>{t('dashboard:researchAndDesign', { defaultValue: 'Investigación y diseño' })}</span>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Q3 2024</Badge>
              </div>
              <div className="text-3xl mb-4">🎯</div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">{t('dashboard:skillAssessment360Title', { defaultValue: 'Skill Assessment 360°' })}</h4>
              <p className="text-gray-600 text-sm mb-4">
                {t('dashboard:skillAssessment360Desc', { defaultValue: 'Evaluación comprehensiva de competencias con feedback de pares, superiores y análisis de mercado.' })}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>{t('dashboard:conceptAndValidation', { defaultValue: 'Concepto y validación' })}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              {t('dashboard:wantToBePartOfFuture', { defaultValue: '¿Quieres ser parte del futuro?' })}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium ml-1">{t('dashboard:joinBetaProgram', { defaultValue: 'Únete a nuestro programa beta' })}</a>
            </p>
          </div>
        </div>
      </div>

      {/* Custom Simulations Section */}
      {customSimulations.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-y border-purple-200">
          <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 py-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-500" />
                🎨 {t('dashboard:customSimulations')}
              </h3>
              <p className="text-gray-600 max-w-3xl mx-auto">
                {t('dashboard:customSimulationsDesc', { defaultValue: 'Experiencias de aprendizaje que creaste para ti y tu equipo' })}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {customSimulations.slice(0, 6).map((simulation) => (
                <div key={simulation.id} className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                        <Settings className="h-5 w-5 text-white" />
                      </div>
                      <Badge className={`${
                        simulation.difficulty === t('dashboard:beginnerLevel') ? 'bg-green-500/20 text-green-700' :
                        simulation.difficulty === t('dashboard:intermediateLevel') ? 'bg-yellow-500/20 text-yellow-700' :
                        simulation.difficulty === t('dashboard:advancedLevel') ? 'bg-red-500/20 text-red-700' :
                        'bg-purple-500/20 text-purple-700'
                      }`}>
                        {simulation.difficulty}
                      </Badge>
                    </div>
                    <Badge className={`${
                      simulation.isPublished 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    } text-xs`}>
                      {simulation.isPublished ? t('dashboard:published', { defaultValue: 'Publicado' }) : t('dashboard:draft', { defaultValue: 'Borrador' })}
                    </Badge>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {simulation.title}
                  </h4>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {simulation.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {simulation.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {simulation.skills.length > 3 && (
                      <Badge className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
                        +{simulation.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {new Date(simulation.createdAt).toLocaleDateString()}
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      onClick={() => {
                        // Convert custom simulation to standard scenario format
                        const scenario = {
                          id: simulation.id,
                          title: simulation.title,
                          category: simulation.category,
                          description: simulation.description,
                          difficulty: simulation.difficulty as 'Principiante' | 'Intermedio' | 'Avanzado',
                          duration: '20-30 min',
                          participants: 'Personalizado',
                          image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
                          objectives: simulation.userObjectives,
                          skills: simulation.skills
                        };
                        onStartSimulation(scenario);
                      }}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Iniciar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {customSimulations.length > 6 && (
              <div className="text-center mt-8">
                <Button 
                  variant="outline"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  Ver Todas las Simulaciones ({customSimulations.length})
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 py-12">
        {/* Featured Scenarios */}
        {activeSection === 'featured' && (
          <div className="space-y-16">
            {/* Hero Scenario */}
            <section>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('dashboard:rolePlayingWeeklyScenario', { defaultValue: '🔥 Módulo Role-Playing: Escenario de la Semana' })}</h3>
                <p className="text-gray-600">{t('dashboard:firstModuleDescription', { defaultValue: 'El primer módulo de OASIS: simulaciones inmersivas para desarrollo de competencias ejecutivas' })}</p>
              </div>
              
              <div className="relative bg-gradient-to-r from-red-600 to-pink-600 rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative p-12 text-white">
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-red-500/20 text-red-200 border-red-300">
                          <Users className="h-3 w-3 mr-1" />
                          Liderazgo Ejecutivo
                        </Badge>
                        <div className="flex gap-1">
                          {getDifficultyStars('Avanzado')}
                        </div>
                      </div>
                      
                      <h4 className="text-4xl font-bold leading-tight">
                        {t('dashboard:crisisLeadershipTitle', { defaultValue: 'Liderazgo en Crisis Corporativa' })}
                      </h4>
                      
                      <p className="text-xl text-red-100 leading-relaxed">
                        {t('dashboard:crisisScenarioDescription', { defaultValue: 'Una crisis de reputación amenaza la supervivencia de tu empresa. Las acciones cayeron 40%, los medios atacan, y tu equipo está en pánico. ¿Cómo lideras en el momento más crítico?' })}
                      </p>
                      
                      <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-300/30">
                        <p className="text-red-100 text-sm">
                          <strong>{t('dashboard:rolePlayingModule', { defaultValue: 'Módulo Role-Playing' })}:</strong> {t('dashboard:rolePlayingExperience', { defaultValue: 'Experimenta decisiones de alto impacto en un entorno seguro.' })}
                          {t('dashboard:consequencesDescription', { defaultValue: 'Cada elección tiene consecuencias reales que afectan el resultado de la simulación.' })}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-6 text-red-200">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          20-30 min
                        </span>
                        <span className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          4 objetivos críticos
                        </span>
                      </div>
                      
                      <Button 
                        onClick={() => {
                          const crisisScenario = featuredScenarios.find(s => s.title.includes('Crisis'));
                          if (crisisScenario) {
                            onStartSimulation({
                              ...crisisScenario,
                              image: crisisScenario.image_url || ''
                            });
                          }
                        }}
                        size="lg"
                        className="bg-white text-red-600 hover:bg-red-50 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        disabled={loading || featuredScenarios.length === 0}
                      >
                        <Play className="h-5 w-5 mr-2" />
                        {loading ? t('common:loading') : t('dashboard:acceptChallenge', { defaultValue: 'Aceptar el Desafío' })}
                      </Button>
                    </div>
                    
                    <div className="relative">
                      <ImageWithFallback
                        src={featuredScenarios.find(s => s.title.includes('Crisis'))?.image_url || 'https://images.unsplash.com/photo-1589639293663-f9399bb41721?w=400'}
                        alt="Crisis Leadership"
                        className="w-full h-80 object-cover rounded-2xl shadow-2xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl"></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Start Cards */}
            <section>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('dashboard:perfectToStart', { defaultValue: '⚡ Perfectos para Comenzar' })}</h3>
                <p className="text-gray-600">{t('dashboard:idealSimulationsDescription', { defaultValue: 'Simulaciones ideales para tu primera experiencia de aprendizaje inmersivo' })}</p>
              </div>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">{t('dashboard:loadingScenarios')}</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600 mb-4">Error: {error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Reintentar
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  {scenarios.filter(s => s.difficulty === 'Intermedio').slice(0, 2).map((scenario, index) => (
                    <div key={scenario.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                      <div className="relative h-48 overflow-hidden">
                        <ImageWithFallback
                          src={scenario.image_url || 'https://images.unsplash.com/photo-1551135049-8a33b5883817?w=400'}
                          alt={scenario.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                            {getCategoryIcon(scenario.category)}
                            <span className="ml-1">{scenario.category}</span>
                          </Badge>
                        </div>
                        <div className="absolute top-4 right-4 flex gap-1">
                          {getDifficultyStars(scenario.difficulty)}
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {scenario.title}
                        </h4>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {scenario.description}
                        </p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {scenario.duration}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {scenario.difficulty}
                          </Badge>
                        </div>
                        
                        <Button 
                          onClick={() => onStartSimulation({
                            ...scenario,
                            image: scenario.image_url || ''
                          })}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg"
                        >
                          Comenzar Simulación
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Learning Paths */}
        {activeSection === 'paths' && (
          <div className="space-y-12">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">🎯 Programas de Desarrollo Estructurados</h3>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Rutas de aprendizaje diseñadas por expertos que combinan múltiples simulaciones 
                para el desarrollo integral de competencias profesionales críticas.
              </p>
              
              {/* Coming Soon Banner */}
              <div className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-amber-800 font-medium">
                  Próximamente: Programas que integran múltiples módulos de aprendizaje
                </span>
              </div>
            </div>

            <div className="grid gap-8">
              {learningPaths.map((path, index) => (
                <div key={path.id} className={`relative bg-gradient-to-r ${path.color} rounded-3xl overflow-hidden shadow-2xl`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative p-8 lg:p-12 text-white">
                    <div className="grid lg:grid-cols-3 gap-8 items-center">
                      <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">{path.icon}</div>
                          <div>
                            <h4 className="text-2xl lg:text-3xl font-bold">{path.title}</h4>
                            <div className="flex items-center gap-4 mt-2 text-white/80">
                              <span>{path.totalTime}</span>
                              <span>•</span>
                              <span>{path.difficulty}</span>
                              <span>•</span>
                              <span>{path.scenarios.length} simulaciones</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-lg text-white/90 leading-relaxed">
                          {path.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          {path.scenarios.map(scenarioId => {
                            const scenario = scenarios.find(s => s.id === scenarioId);
                            return scenario ? (
                              <Badge key={scenarioId} className="bg-white/20 text-white border-white/30">
                                {scenario.title}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                        
                        <Button 
                          onClick={() => {
                            const firstScenario = scenarios.find(s => s.id === path.scenarios[0]);
                            if (firstScenario) onStartSimulation(firstScenario);
                          }}
                          size="lg"
                          className="bg-white text-gray-900 hover:bg-white/90 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Comenzar Ruta de Aprendizaje
                        </Button>
                      </div>
                      
                      <div className="relative">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                          <h5 className="font-semibold mb-4 text-white">🎯 Lo que aprenderás:</h5>
                          <ul className="space-y-2 text-white/90">
                            {path.scenarios.map((scenarioId, idx) => {
                              const scenario = scenarios.find(s => s.id === scenarioId);
                              return scenario ? (
                                <li key={idx} className="flex items-start gap-2">
                                  <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{scenario.skills[0]}</span>
                                </li>
                              ) : null;
                            })}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete Library */}
        {activeSection === 'library' && (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('dashboard:rolePlayingCatalog', { defaultValue: '📚 Catálogo del Módulo Role-Playing' })}</h3>
              <p className="text-gray-600">
                {filteredScenarios.length === scenarios.length 
                  ? `${scenarios.length} simulaciones ejecutivas disponibles en nuestro primer módulo`
                  : `${filteredScenarios.length} de ${scenarios.length} simulaciones encontradas`
                }
              </p>
              
              {/* Module info */}
              <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-blue-800 font-medium">
                  Módulo 1/4 • Más módulos de aprendizaje llegarán pronto
                </span>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando catálogo...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Error: {error}</p>
                <Button onClick={() => window.location.reload()}>
                  Reintentar
                </Button>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Custom Simulations Section - Most Important! */}
                {localCustomSimulations.length > 0 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-purple-900 mb-2 flex items-center justify-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        🎨 {t('dashboard:customSimulations', { defaultValue: 'Tus Simulaciones Personalizadas' })}
                      </h4>
                      <p className="text-purple-700 text-sm">
                        {localCustomSimulations.length} simulacion{localCustomSimulations.length === 1 ? '' : 'es'} creada{localCustomSimulations.length === 1 ? '' : 's'} por ti
                      </p>
                    </div>

                    <div className="grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                      {localCustomSimulations.map((simulation) => (
                        <div
                          key={simulation.id}
                          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-purple-200 group cursor-pointer"
                          onClick={() => {
                            // Convert to scenario format and go to history (same as system scenarios)
                            const scenarioFormat = {
                              id: simulation.id,
                              title: simulation.title,
                              category: simulation.category,
                              description: simulation.description,
                              difficulty: simulation.difficulty,
                              duration: '30 min',
                              participants: 'Tú vs IA',
                              objectives: simulation.userObjectives,
                              skills: simulation.skills,
                              is_featured: false
                            };
                            onStartSimulation(scenarioFormat);
                          }}
                        >
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-3">
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                {simulation.category}
                              </Badge>
                              <Badge variant="outline" className={
                                simulation.difficulty === 'Avanzado' ? 'border-red-200 text-red-700' :
                                simulation.difficulty === 'Intermedio' ? 'border-yellow-200 text-yellow-700' :
                                'border-green-200 text-green-700'
                              }>
                                {simulation.difficulty}
                              </Badge>
                            </div>

                            <h5 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors">
                              {simulation.title}
                            </h5>

                            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                              {simulation.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="text-xs text-purple-600">
                                Por {simulation.createdBy}
                              </div>
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => {
                                  // Convert to scenario format and go to history (same as system scenarios)
                                  const scenarioFormat = {
                                    id: simulation.id,
                                    title: simulation.title,
                                    category: simulation.category,
                                    description: simulation.description,
                                    difficulty: simulation.difficulty,
                                    duration: '30 min',
                                    participants: 'Tú vs IA',
                                    objectives: simulation.userObjectives,
                                    skills: simulation.skills,
                                    is_featured: false
                                  };
                                  onStartSimulation(scenarioFormat);
                                }}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Ver Historial
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 pt-8">
                      <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">
                        📚 Simulaciones del Sistema
                      </h4>
                    </div>
                  </div>
                )}

                {/* Regular Scenarios Grid */}
                <div className="grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                  {filteredScenarios.map((scenario, index) => (
                  <div key={scenario.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
                    <div className="relative h-48 overflow-hidden">
                      <ImageWithFallback
                        src={scenario.image_url || 'https://images.unsplash.com/photo-1551135049-8a33b5883817?w=400'}
                        alt={scenario.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                      
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                          {getCategoryIcon(scenario.category)}
                          <span className="ml-1">{scenario.category}</span>
                        </Badge>
                      </div>
                      
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <div className="flex gap-1">
                          {getDifficultyStars(scenario.difficulty)}
                        </div>
                        <Badge className={`text-xs ${
                          scenario.difficulty === 'Principiante' ? 'bg-green-500/20 text-green-200 border-green-300' :
                          scenario.difficulty === 'Intermedio' ? 'bg-yellow-500/20 text-yellow-200 border-yellow-300' :
                          'bg-red-500/20 text-red-200 border-red-300'
                        }`}>
                          {scenario.difficulty}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {scenario.title}
                      </h4>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {scenario.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {scenario.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {scenario.participants.split(',').length} stakeholders
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">Competencias clave:</p>
                        <div className="flex flex-wrap gap-1">
                          {scenario.skills.slice(0, 2).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {scenario.skills.length > 2 && (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              +{scenario.skills.length - 2} más
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => onStartSimulation({
                          ...scenario,
                          image: scenario.image_url || ''
                        })}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg"
                      >
                        Comenzar Simulación
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}