from rest_framework import serializers
from .models import Simulation, Message, SimulationAnalysis
from scenarios.models import Scenario, CustomSimulation


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'emotion', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class SimulationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    scenario_title = serializers.CharField(source='scenario.title', read_only=True)
    custom_simulation_title = serializers.CharField(source='custom_simulation.title', read_only=True)

    class Meta:
        model = Simulation
        fields = [
            'id', 'user', 'scenario', 'custom_simulation', 'status',
            'started_at', 'ended_at', 'duration_minutes', 'messages',
            'scenario_title', 'custom_simulation_title',
            'title', 'summary', 'last_message_preview',
            'objectives_completed', 'total_objectives', 'final_score'
        ]
        read_only_fields = [
            'id', 'user', 'started_at', 'ended_at', 'duration_minutes',
            'messages', 'scenario_title', 'custom_simulation_title',
            'title', 'summary', 'last_message_preview',
            'objectives_completed', 'total_objectives', 'final_score'
        ]


class SimulationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Simulation
        fields = ['id', 'scenario', 'custom_simulation', 'status', 'started_at']
        read_only_fields = ['id', 'status', 'started_at']
    
    def validate(self, data):
        # Must have either scenario or custom_simulation, but not both
        if not data.get('scenario') and not data.get('custom_simulation'):
            raise serializers.ValidationError("Must specify either scenario or custom_simulation")
        
        if data.get('scenario') and data.get('custom_simulation'):
            raise serializers.ValidationError("Cannot specify both scenario and custom_simulation")
        
        return data
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SimulationAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = SimulationAnalysis
        fields = [
            'id', 'simulation', 'overall_score', 'strategic_score',
            'communication_score', 'emotional_score', 'strengths',
            'improvements', 'recommendations', 'key_moments',
            'tactics_used', 'created_at'
        ]
        read_only_fields = ['id', 'simulation', 'created_at']
