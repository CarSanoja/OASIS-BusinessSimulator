import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  ArrowLeft, 
  Target, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  Award,
  BookOpen,
  ArrowRight,
  Zap
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { apiService } from "../services/api";
import { useTranslation } from "react-i18next";

interface CompetencyData {
  competency: string;
  current: number;
  target: number;
  sessions: number;
}

interface SimulationHistory {
  id: string;
  title: string;
  category: string;
  date: string;
  score: number;
  duration: number;
  skills: string[];
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  priority: 'alta' | 'media' | 'baja';
  estimatedTime: string;
  scenarios: string[];
}

interface ProgressViewProps {
  onBackToDashboard: () => void;
  onStartScenario: (scenarioId: string) => void;
}

export function ProgressView({ onBackToDashboard, onStartScenario }: ProgressViewProps) {
  const { t } = useTranslation(['progress', 'common']);
  const [competencyData, setCompetencyData] = useState<CompetencyData[]>([]);
  const [simulationHistory, setSimulationHistory] = useState<SimulationHistory[]>([]);
  const [progressOverTime, setProgressOverTime] = useState<any[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<any>({});
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProgressData = async () => {
      try {
        setLoading(true);
        
        // Load user progress
        const progressResponse = await apiService.getUserProgress();
        
        // Convert to CompetencyData format
        const competencies = progressResponse.competency_scores.map(comp => ({
          competency: comp.competency,
          current: comp.current_score,
          target: comp.target_score,
          sessions: comp.sessions_count
        }));
        setCompetencyData(competencies);

        // Load analytics data
        const analyticsResponse = await apiService.getAnalytics();
        setProgressOverTime(analyticsResponse.progress_over_time);
        setKeyMetrics(analyticsResponse.key_metrics);

        // Load simulation history
        const historyResponse = await apiService.getSimulationHistory();
        const mappedHistory = historyResponse.history.map(item => ({
          id: item.id.toString(),
          title: item.title,
          category: item.category,
          date: item.started_at,
          score: item.score,
          duration: item.duration_minutes,
          skills: item.skills
        }));
        setSimulationHistory(mappedHistory);

        // Load learning paths
        const learningPathsResponse = await apiService.getLearningPaths();
        const mappedPaths = learningPathsResponse.learning_paths.map(path => ({
          id: path.id,
          title: path.title,
          description: path.description,
          priority: path.priority,
          estimatedTime: path.estimated_time,
          scenarios: path.scenarios
        }));
        setLearningPaths(mappedPaths);

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('progress:failedToLoadData', { defaultValue: 'Failed to load progress data' }));
        console.error('Error loading progress data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProgressData();
  }, []);

  // All data now loaded from API in useEffect

  const radarData = competencyData.map(item => ({
    subject: item.competency,
    current: item.current,
    target: item.target
  }));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const averageScore = competencyData.length > 0 
    ? Math.round(competencyData.reduce((acc, item) => acc + item.current, 0) / competencyData.length)
    : keyMetrics.average_score || 0;
  const totalSessions = keyMetrics.total_simulations || simulationHistory.length;
  const improvementTrend = keyMetrics.improvement_trend || (
    progressOverTime.length > 1 
      ? progressOverTime[progressOverTime.length - 1].score - progressOverTime[0].score 
      : 0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">{t('progress:loadingProgress', { defaultValue: 'Cargando Progreso' })}</h3>
          <p className="text-gray-600">{t('progress:analyzingDevelopment', { defaultValue: 'Analizando tu desarrollo profesional...' })}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2 text-red-600">{t('progress:errorLoadingProgress', { defaultValue: 'Error al Cargar Progreso' })}</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onBackToDashboard}>{t('simulation:backToDashboard', { defaultValue: 'Volver al Dashboard' })}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common:dashboard', { defaultValue: 'Dashboard' })}
            </Button>
            <div>
              <h1 className="text-3xl">{t('progress:personalProgressPanel', { defaultValue: 'Panel de Progreso Personal' })}</h1>
              <p className="text-gray-600">{t('progress:executiveDevelopmentTrajectory', { defaultValue: 'Tu trayectoria de desarrollo ejecutivo' })}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('progress:averageScore', { defaultValue: 'Puntuación Promedio' })}</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl ${getScoreColor(averageScore)}`}>{averageScore}</div>
              <p className="text-xs text-muted-foreground">{t('progress:allCompetencies', { defaultValue: 'Todas las competencias' })}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('progress:completedSessions', { defaultValue: 'Sesiones Completadas' })}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{totalSessions}</div>
              <p className="text-xs text-muted-foreground">{t('progress:thisMonth', { defaultValue: 'Este mes' })}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('progress:improvementTrend', { defaultValue: 'Tendencia de Mejora' })}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-green-600">+{improvementTrend}</div>
              <p className="text-xs text-muted-foreground">{t('progress:lastFourMonths', { defaultValue: 'Últimos 4 meses' })}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('progress:nextGoal', { defaultValue: 'Próximo Objetivo' })}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">85+</div>
              <p className="text-xs text-muted-foreground">{t('progress:crisisManagement', { defaultValue: 'Gestión de Crisis' })}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="competencies" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="competencies">{t('progress:competencyMap', { defaultValue: 'Mapa de Competencias' })}</TabsTrigger>
            <TabsTrigger value="history">{t('progress:history', { defaultValue: 'Historial' })}</TabsTrigger>
            <TabsTrigger value="learning-paths">{t('progress:learningPaths', { defaultValue: 'Rutas de Aprendizaje' })}</TabsTrigger>
            <TabsTrigger value="analytics">{t('progress:analytics', { defaultValue: 'Analíticas' })}</TabsTrigger>
          </TabsList>

          <TabsContent value="competencies" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('progress:competencyProfile', { defaultValue: 'Perfil de Competencias' })}</CardTitle>
                  <p className="text-gray-600">{t('progress:currentVsTargetLevels', { defaultValue: 'Nivel actual vs. objetivos por competencia' })}</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name={t('progress:current', { defaultValue: 'Actual' })} dataKey="current" stroke="#3b82f6" fill="#3b82f680" />
                      <Radar name={t('progress:target', { defaultValue: 'Objetivo' })} dataKey="target" stroke="#ef4444" fill="transparent" strokeDasharray="5 5" />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Competency List */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('progress:competencyDetail', { defaultValue: 'Detalle por Competencia' })}</CardTitle>
                  <p className="text-gray-600">{t('progress:progressAndPracticeSessions', { defaultValue: 'Progreso y sesiones de práctica' })}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {competencyData.map((item) => (
                      <div key={item.competency} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{item.competency}</span>
                            <span className="text-sm text-gray-500 ml-2">({item.sessions} {t('progress:sessions', { defaultValue: 'sesiones' })})</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-medium ${getScoreColor(item.current)}`}>
                              {item.current}/100
                            </span>
                            <div className="text-xs text-gray-500">{t('progress:goal', { defaultValue: 'Meta' })}: {item.target}</div>
                          </div>
                        </div>
                        <Progress value={item.current} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>{t('progress:simulationHistory', { defaultValue: 'Historial de Simulaciones' })}</CardTitle>
                <p className="text-gray-600">{t('progress:allCompletedPracticeSessions', { defaultValue: 'Todas tus sesiones de práctica completadas' })}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {simulationHistory.map((simulation) => (
                    <div key={simulation.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{simulation.title}</h4>
                            <Badge variant="outline">{simulation.category}</Badge>
                            <div className={`text-sm font-medium ${getScoreColor(simulation.score)}`}>
                              {simulation.score}/100
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(simulation.date).toLocaleDateString()}
                            </span>
                            <span>{simulation.duration} {t('progress:min', { defaultValue: 'min' })}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {simulation.skills.map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          {t('progress:viewReport', { defaultValue: 'Ver Reporte' })}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="learning-paths">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('progress:suggestedLearningPaths', { defaultValue: 'Rutas de Aprendizaje Sugeridas' })}</h3>
                <p className="text-gray-600">
                  {t('progress:performanceBasedOpportunities', { defaultValue: 'Basándose en tu rendimiento, el sistema ha identificado estas áreas de oportunidad prioritarias' })}
                </p>
              </div>

              <div className="space-y-4">
                {learningPaths.map((path) => (
                  <Card key={path.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-lg font-semibold">{path.title}</h4>
                            <Badge className={getPriorityColor(path.priority)} variant="outline">
                              {path.priority === 'alta' ? `🔥 ${t('progress:high', { defaultValue: 'Alta' })}` : path.priority === 'media' ? `⚡ ${t('progress:medium', { defaultValue: 'Media' })}` : `📚 ${t('progress:low', { defaultValue: 'Baja' })}`} {t('progress:priority', { defaultValue: 'Prioridad' })}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-4">{path.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Zap className="h-4 w-4" />
                              {path.estimatedTime}
                            </span>
                            <span>{path.scenarios.length} {t('progress:scenarios', { defaultValue: 'escenarios' })}</span>
                          </div>
                        </div>
                        <Button className="ml-4">
                          <span>{t('progress:startPath', { defaultValue: 'Comenzar Ruta' })}</span>
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('progress:performanceEvolution', { defaultValue: 'Evolución del Rendimiento' })}</CardTitle>
                  <p className="text-gray-600">{t('progress:progressOverTime', { defaultValue: 'Tu progreso a lo largo del tiempo' })}</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progressOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('progress:timeDistribution', { defaultValue: 'Distribución de Tiempo' })}</CardTitle>
                  <p className="text-gray-600">{t('progress:timeInvestedByCategory', { defaultValue: 'Tiempo invertido por categoría' })}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{t('progress:corporateStrategy', { defaultValue: 'Estrategia Corporativa' })}</span>
                        <span className="text-sm">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{t('progress:executiveLeadership', { defaultValue: 'Liderazgo Ejecutivo' })}</span>
                        <span className="text-sm">30%</span>
                      </div>
                      <Progress value={30} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{t('progress:entrepreneurship', { defaultValue: 'Emprendimiento' })}</span>
                        <span className="text-sm">25%</span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
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