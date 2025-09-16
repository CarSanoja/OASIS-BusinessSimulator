import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  ArrowLeft,
  Plus,
  Clock,
  Target,
  TrendingUp,
  Play,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Activity,
  FileText,
  ChevronRight
} from "lucide-react";
import { apiService } from "../services/api";
import { format, formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from "react-i18next";

interface Scenario {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: string;
  duration: string;
  objectives: string[];
}

interface Simulation {
  id: number;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  title: string;
  summary: string;
  last_message_preview: string;
  objectives_completed: number;
  total_objectives: number;
  final_score?: number;
}

interface SimulationStats {
  total_attempts: number;
  active_simulation?: number;
  best_score: number;
  average_duration: number;
  total_objectives_completed: number;
}

interface ScenarioHistoryViewProps {
  scenario: Scenario;
  onSelectSimulation: (simulationId: number) => void;
  onCreateNewSimulation: () => void;
  onBackToDashboard: () => void;
}

export function ScenarioHistoryView({
  scenario,
  onSelectSimulation,
  onCreateNewSimulation,
  onBackToDashboard
}: ScenarioHistoryViewProps) {
  const { t, i18n } = useTranslation(['simulation', 'common']);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [stats, setStats] = useState<SimulationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimulationHistory = async () => {
      try {
        setLoading(true);
        const response = await apiService.getSimulationsByScenario(parseInt(scenario.id));
        const mappedSimulations = response.simulations.map(sim => ({
          ...sim,
          status: (sim.status === 'active' || sim.status === 'completed' || sim.status === 'abandoned')
            ? sim.status as 'active' | 'completed' | 'abandoned'
            : 'completed' as const
        }));
        setSimulations(mappedSimulations);
        setStats(response.stats);
        setError(null);
      } catch (err) {
        console.error('Error fetching simulation history:', err);
        setError(t('simulation:errorLoadingHistory', { defaultValue: 'Error al cargar el historial de simulaciones' }));
      } finally {
        setLoading(false);
      }
    };

    fetchSimulationHistory();
  }, [scenario.id]);


  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return t('simulation:inProgress');
      case 'completed':
        return t('simulation:completed');
      case 'abandoned':
        return t('simulation:abandoned', { defaultValue: 'Abandonado' });
      default:
        return status;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    return 'text-red-600';
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">{t('simulation:loadingHistory', { defaultValue: 'Cargando Historial' })}</h3>
          <p className="text-white/70">{t('simulation:preparingSimulations', { defaultValue: 'Preparando tus simulaciones anteriores...' })}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-center text-white">
          <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-red-300">{t('common:error')}</h3>
          <p className="text-white/70 mb-4">{error}</p>
          <Button onClick={onBackToDashboard} className="bg-white text-gray-900 hover:bg-gray-100">
            {t('simulation:backToDashboard')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      <div className="h-full max-w-7xl mx-auto flex flex-col p-4 lg:p-6">
        {/* Hero Header Section */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 mb-4 lg:mb-6 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5"></div>
          <div className="relative p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackToDashboard}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('common:dashboard', { defaultValue: 'Dashboard' })}
                </Button>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">{scenario.title}</h1>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 self-start">
                      {scenario.category}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm lg:text-base">{scenario.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Clock className="h-4 w-4" />
                  <span>{scenario.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Target className="h-4 w-4" />
                  <span>{scenario.objectives.length} {t('simulation:objectives', { defaultValue: 'objetivos' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Dashboard Stats */}
        {stats && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-6 mb-4 lg:mb-6 flex-shrink-0">
            <div className="flex items-center gap-3 mb-4 lg:mb-6">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-gray-900">{t('simulation:performanceMetrics', { defaultValue: 'Métricas de Rendimiento' })}</h2>
                <p className="text-gray-600 text-sm lg:text-base">{t('simulation:executiveAnalysis', { defaultValue: 'Análisis ejecutivo de tu progreso' })}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                    {t('simulation:total', { defaultValue: 'Total' })}
                  </Badge>
                </div>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">{stats.total_attempts}</p>
                <p className="text-xs lg:text-sm text-gray-600">{t('simulation:sessions', { defaultValue: 'Sesiones' })}</p>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                    {t('simulation:score', { defaultValue: 'Score' })}
                  </Badge>
                </div>
                <p className={`text-xl lg:text-2xl font-bold mb-1 ${getScoreColor(stats.best_score)}`}>
                  {stats.best_score}%
                </p>
                <p className="text-xs lg:text-sm text-gray-600">{t('simulation:best', { defaultValue: 'Mejor' })}</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                    {t('simulation:time', { defaultValue: 'Tiempo' })}
                  </Badge>
                </div>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                  {formatDuration(Math.round(stats.average_duration))}
                </p>
                <p className="text-xs lg:text-sm text-gray-600">{t('simulation:average', { defaultValue: 'Promedio' })}</p>
              </div>

              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 text-xs">
                    {t('simulation:kpis', { defaultValue: 'KPIs' })}
                  </Badge>
                </div>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                  {stats.total_objectives_completed}
                </p>
                <p className="text-xs lg:text-sm text-gray-600">{t('simulation:objectives', { defaultValue: 'Objetivos' })}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-6 mb-4 lg:mb-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1">{t('simulation:sessionManagement', { defaultValue: 'Gestión de Sesiones' })}</h3>
              <p className="text-gray-600 text-xs lg:text-sm">
                {stats?.active_simulation
                  ? t('simulation:continueOrReview', { defaultValue: 'Continúa tu sesión activa o revisa el historial' })
                  : t('simulation:startNewSession', { defaultValue: 'Inicia una nueva sesión ejecutiva' })
                }
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={onCreateNewSimulation}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 lg:px-6 py-2 lg:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
                disabled={stats?.active_simulation !== undefined && stats.active_simulation !== null}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('simulation:newSession', { defaultValue: 'Nueva Sesión' })}
              </Button>
            </div>
          </div>
          {stats?.active_simulation && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-600" />
                <p className="text-amber-800 text-sm font-medium">
                  {t('simulation:activeSessionWarning', { defaultValue: 'Tienes una sesión activa. Complétala antes de iniciar una nueva.' })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Executive Session History */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-6 flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-4 lg:mb-6 flex-shrink-0">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl flex items-center justify-center">
              <Activity className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-gray-900">{t('simulation:sessionHistory', { defaultValue: 'Historial de Sesiones' })}</h2>
              <p className="text-gray-600 text-sm lg:text-base">{t('simulation:executiveExperiences', { defaultValue: 'Registro de experiencias ejecutivas' })}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 lg:space-y-4 pr-2">
            {simulations.length === 0 ? (
              <div className="text-center py-8 lg:py-12">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
                  <FileText className="h-8 w-8 lg:h-10 lg:w-10 text-gray-400" />
                </div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">{t('simulation:firstExperience', { defaultValue: 'Primera Experiencia' })}</h3>
                <p className="text-gray-600 mb-1 text-sm lg:text-base">{t('simulation:noSessionsYet', { defaultValue: 'Aún no has ejecutado ninguna sesión.' })}</p>
                <p className="text-gray-500 text-xs lg:text-sm">{t('simulation:startFirstExperience', { defaultValue: '¡Inicia tu primera experiencia ejecutiva!' })}</p>
              </div>
            ) : (
              simulations.map((simulation) => (
                <div
                  key={simulation.id}
                  className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 lg:p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group flex-shrink-0"
                  onClick={() => onSelectSimulation(simulation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 lg:mb-4">
                        <h3 className="text-base lg:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {simulation.title}
                        </h3>
                        <Badge className={`${
                          simulation.status === 'active'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : simulation.status === 'completed'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {getStatusText(simulation.status)}
                        </Badge>
                        {simulation.status === 'active' && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-700 font-medium">{t('simulation:live', { defaultValue: 'En vivo' })}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-3 lg:mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDistanceToNow(new Date(simulation.started_at), {
                              addSuffix: true,
                              locale: i18n.language === 'en' ? enUS : es
                            })}
                          </span>
                        </div>
                        {simulation.duration_minutes && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{formatDuration(simulation.duration_minutes)}</span>
                          </div>
                        )}
                        {simulation.final_score !== undefined && simulation.final_score !== null && (
                          <div className="flex items-center gap-2 text-sm">
                            <Target className="h-4 w-4 text-gray-500" />
                            <span className={`font-semibold ${
                              simulation.final_score >= 80 ? 'text-green-600' :
                              simulation.final_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {simulation.final_score}% Score
                            </span>
                          </div>
                        )}
                        {simulation.total_objectives > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{simulation.objectives_completed}/{simulation.total_objectives} {t('simulation:objectives', { defaultValue: 'objetivos' })}</span>
                          </div>
                        )}
                      </div>

                      {simulation.last_message_preview && (
                        <div className="bg-white rounded-lg p-3 border border-gray-100 mb-3 lg:mb-4">
                          <p className="text-gray-700 text-xs lg:text-sm italic line-clamp-2">
                            "{simulation.last_message_preview}"
                          </p>
                        </div>
                      )}

                      {simulation.total_objectives > 0 && (
                        <div className="flex items-center gap-3 lg:gap-4">
                          <span className="text-xs lg:text-sm text-gray-600 font-medium">{t('simulation:progress', { defaultValue: 'Progreso' })}:</span>
                          <div className="flex-1 max-w-xs">
                            <Progress
                              value={(simulation.objectives_completed / simulation.total_objectives) * 100}
                              className="h-1.5 lg:h-2"
                            />
                          </div>
                          <span className="text-xs lg:text-sm font-semibold text-gray-700">
                            {Math.round((simulation.objectives_completed / simulation.total_objectives) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs lg:text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSimulation(simulation.id);
                        }}
                      >
                        {simulation.status === 'active' ? t('simulation:continue', { defaultValue: 'Continuar' }) : t('simulation:review', { defaultValue: 'Revisar' })}
                      </Button>
                      <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}