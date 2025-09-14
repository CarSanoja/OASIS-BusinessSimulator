from rest_framework import serializers
from .models import Scenario, CustomSimulation


class ScenarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scenario
        fields = [
            'id', 'title', 'category', 'description', 'difficulty',
            'duration', 'participants', 'objectives', 'skills',
            'image_url', 'is_featured', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomSimulationSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = CustomSimulation
        fields = [
            'id', 'title', 'description', 'category', 'difficulty',
            'skills', 'user_role', 'ai_role', 'ai_personality',
            'ai_objectives', 'user_objectives', 'end_conditions',
            'knowledge_base', 'is_published', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_by_name', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class CustomSimulationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomSimulation
        fields = [
            'title', 'description', 'category', 'difficulty',
            'skills', 'user_role', 'ai_role', 'ai_personality',
            'ai_objectives', 'user_objectives', 'end_conditions',
            'knowledge_base', 'is_published'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
