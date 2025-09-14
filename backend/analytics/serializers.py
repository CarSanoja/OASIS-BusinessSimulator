from rest_framework import serializers
from .models import UserProgress, CompetencyScore
from simulations.models import Simulation


class CompetencyScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompetencyScore
        fields = [
            'id', 'competency', 'current_score', 'target_score',
            'sessions_count', 'last_updated'
        ]
        read_only_fields = ['id', 'last_updated']


class UserProgressSerializer(serializers.ModelSerializer):
    competency_scores = CompetencyScoreSerializer(many=True, read_only=True, source='competency_scores')
    
    class Meta:
        model = UserProgress
        fields = [
            'id', 'total_simulations', 'average_score',
            'total_duration_minutes', 'last_activity', 'competency_scores'
        ]
        read_only_fields = ['id', 'last_activity']


class SimulationHistorySerializer(serializers.ModelSerializer):
    scenario_title = serializers.CharField(source='scenario.title', read_only=True)
    custom_simulation_title = serializers.CharField(source='custom_simulation.title', read_only=True)
    scenario_category = serializers.CharField(source='scenario.category', read_only=True)
    custom_simulation_category = serializers.CharField(source='custom_simulation.category', read_only=True)
    scenario_skills = serializers.ListField(source='scenario.skills', read_only=True)
    custom_simulation_skills = serializers.ListField(source='custom_simulation.skills', read_only=True)
    
    class Meta:
        model = Simulation
        fields = [
            'id', 'started_at', 'ended_at', 'duration_minutes', 'status',
            'scenario_title', 'custom_simulation_title', 'scenario_category',
            'custom_simulation_category', 'scenario_skills', 'custom_simulation_skills'
        ]
