import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Timer,
  Target,
  TrendingUp,
  Thermometer,
  Activity,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Users,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye
} from "lucide-react";
import { apiService } from "../services/api";
import { useTranslation } from "react-i18next";

interface LiveMetrics {
  session_kpis: {
    duration_minutes: number;
    total_messages: number;
    user_messages: number;
    ai_messages: number;
    objectives_progress: {
      completed: number;
      total: number;
      percentage: number;
      details: Array<{
        text: string;
        progress_percentage: number;
        is_completed: boolean;
        status: 'completed' | 'in_progress' | 'pending';
      }>;
    };
    momentum: {
      level: 'high' | 'medium' | 'low' | 'starting';
      trend: 'accelerating' | 'steady' | 'building' | 'stable';
      score: number;
    };
  };
  emotional_metrics: {
    emotional_tone: number;
    tone_trend: 'improving' | 'declining' | 'stable';
    dominant_emotion: string;
    urgency_level: 'high' | 'medium' | 'low';
  };
  business_metrics: {
    financial_mentions: string[];
    stakeholders: string[];
    risk_level: 'high' | 'medium' | 'low';
    business_impact: 'critical' | 'high' | 'medium' | 'low';
  };
  progress_metrics: {
    engagement_level: 'high' | 'medium' | 'low';
    information_density: 'high' | 'medium' | 'low';
    decision_points: Array<{
      timestamp: string;
      message_preview: string;
      type: string;
      impact: string;
    }>;
    key_moments: Array<{
      timestamp: string;
      message_preview: string;
      type: string;
      significance: string;
    }>;
  };
  last_updated: string;
}

interface LiveMetricsPanelProps {
  simulationId: number;
  onViewDeepAnalytics: () => void;
  onRefresh?: () => void;
}

export function LiveMetricsPanel({ simulationId, onViewDeepAnalytics, onRefresh }: LiveMetricsPanelProps) {
  const { t } = useTranslation(['metrics', 'common']);
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Auto-refresh metrics every 10 seconds
  useEffect(() => {
    if (!simulationId) return;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await apiService.getLiveMetrics(simulationId);
        setMetrics(data);
        setError(null);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Error fetching live metrics:', err);
        setError(err instanceof Error ? err.message : t('metrics:errorFetchingMetrics', { defaultValue: 'Error fetching metrics' }));
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Set up auto-refresh
    const interval = setInterval(fetchMetrics, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [simulationId]);

  if (loading && !metrics) {
    return (
      <div className="w-72 lg:w-80 bg-white border-r border-gray-200 shadow-lg flex flex-col">
        <div className="p-6 flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">{t('metrics:loadingMetrics', { defaultValue: 'Cargando métricas...' })}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-72 lg:w-80 bg-white border-r border-gray-200 shadow-lg flex flex-col">
        <div className="p-6 flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={onRefresh} size="sm" variant="outline">
              {t('metrics:retry', { defaultValue: 'Reintentar' })}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const getMomentumIcon = (trend: string) => {
    switch (trend) {
      case 'accelerating':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-blue-600" />;
    }
  };

  const getToneColor = (tone: number) => {
    if (tone >= 70) return 'text-green-600';
    if (tone >= 40) return 'text-blue-600';
    return 'text-red-600';
  };

  const getToneBgColor = (tone: number) => {
    if (tone >= 70) return 'bg-green-500';
    if (tone >= 40) return 'bg-blue-500';
    return 'bg-red-500';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="w-72 lg:w-80 bg-white border-r border-gray-200 shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{t('metrics:liveMetrics', { defaultValue: 'Métricas Live' })}</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">{t('metrics:live', { defaultValue: 'En vivo' })}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">

        {/* Session KPIs */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-600" />
              {t('metrics:executiveSession', { defaultValue: 'Sesión Ejecutiva' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('metrics:duration', { defaultValue: 'Duración' })}</span>
              <span className="text-sm font-semibold text-gray-900">
                {metrics.session_kpis.duration_minutes} {t('metrics:min', { defaultValue: 'min' })}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('metrics:objectives', { defaultValue: 'Objetivos' })}</span>
              <span className="text-sm font-semibold text-gray-900">
                {metrics.session_kpis.objectives_progress.completed}/
                {metrics.session_kpis.objectives_progress.total}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                {t('metrics:momentum', { defaultValue: 'Momentum' })}
                {getMomentumIcon(metrics.session_kpis.momentum.trend)}
              </span>
              <Badge className={`text-xs ${
                metrics.session_kpis.momentum.level === 'high' ? 'bg-green-100 text-green-800' :
                metrics.session_kpis.momentum.level === 'medium' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {metrics.session_kpis.momentum.level}
              </Badge>
            </div>

            <Progress
              value={metrics.session_kpis.objectives_progress.percentage}
              className="h-2"
            />
          </CardContent>
        </Card>

        {/* Emotional Intelligence */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-purple-600" />
              {t('metrics:emotionalIntelligence', { defaultValue: 'Inteligencia Emocional' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('metrics:climate', { defaultValue: 'Clima' })}</span>
              <span className={`text-sm font-bold ${getToneColor(metrics.emotional_metrics.emotional_tone)}`}>
                {metrics.emotional_metrics.emotional_tone}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getToneBgColor(metrics.emotional_metrics.emotional_tone)}`}
                style={{ width: `${metrics.emotional_metrics.emotional_tone}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('metrics:trend', { defaultValue: 'Tendencia' })}</span>
              <Badge className={`text-xs ${
                metrics.emotional_metrics.tone_trend === 'improving' ? 'bg-green-100 text-green-800' :
                metrics.emotional_metrics.tone_trend === 'declining' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {metrics.emotional_metrics.tone_trend}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('metrics:urgency', { defaultValue: 'Urgencia' })}</span>
              <Badge className={`text-xs ${
                metrics.emotional_metrics.urgency_level === 'high' ? 'bg-red-100 text-red-800' :
                metrics.emotional_metrics.urgency_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {metrics.emotional_metrics.urgency_level}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Business Intelligence */}
        <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Business Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {metrics.business_metrics.financial_mentions.length > 0 && (
              <div>
                <span className="text-xs text-gray-600 block mb-1">{t('metrics:financial', { defaultValue: 'Financiero' })}</span>
                <div className="flex flex-wrap gap-1">
                  {metrics.business_metrics.financial_mentions.slice(0, 3).map((mention, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {mention}
                    </Badge>
                  ))}
                  {metrics.business_metrics.financial_mentions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{metrics.business_metrics.financial_mentions.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {metrics.business_metrics.stakeholders.length > 0 && (
              <div>
                <span className="text-xs text-gray-600 block mb-1">{t('metrics:stakeholders', { defaultValue: 'Stakeholders' })}</span>
                <div className="flex flex-wrap gap-1">
                  {metrics.business_metrics.stakeholders.slice(0, 3).map((stakeholder, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {stakeholder}
                    </Badge>
                  ))}
                  {metrics.business_metrics.stakeholders.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{metrics.business_metrics.stakeholders.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('metrics:impact', { defaultValue: 'Impacto' })}</span>
              <Badge className={`text-xs ${getImpactColor(metrics.business_metrics.business_impact)}`}>
                {metrics.business_metrics.business_impact}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('metrics:risk', { defaultValue: 'Riesgo' })}</span>
              <Badge className={`text-xs ${getRiskColor(metrics.business_metrics.risk_level)}`}>
                {metrics.business_metrics.risk_level}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Progress Details */}
        <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-4 w-4 text-slate-600" />
              {t('metrics:detailedProgress', { defaultValue: 'Progreso Detallado' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {metrics.session_kpis.objectives_progress.details.slice(0, 3).map((objective, index) => (
              <div key={index} className="flex items-start gap-2">
                {objective.is_completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 border-2 border-gray-300 rounded-full mt-0.5 flex-shrink-0"></div>
                )}
                <div className="flex-1 min-w-0">
                  <span className={`text-xs block leading-tight ${
                    objective.is_completed ? 'text-green-700 line-through' : 'text-gray-700'
                  }`}>
                    {objective.text.length > 60 ? objective.text.substring(0, 60) + '...' : objective.text}
                  </span>
                  <div className="mt-1">
                    <Progress value={objective.progress_percentage} className="h-1" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-100">
          <CardContent className="pt-6">
            <Button
              onClick={onViewDeepAnalytics}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              size="sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('metrics:viewDetailedAnalysis', { defaultValue: 'Ver Análisis Detallado' })}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{t('metrics:lastUpdate', { defaultValue: 'Última actualización' })}</span>
          <span>{lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}