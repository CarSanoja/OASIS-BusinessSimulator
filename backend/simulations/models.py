from django.db import models
from django.contrib.postgres.fields import ArrayField


class Simulation(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]
    
    user = models.ForeignKey('authentication.User', on_delete=models.CASCADE, related_name='simulations')
    scenario = models.ForeignKey('scenarios.Scenario', on_delete=models.CASCADE, null=True, blank=True)
    custom_simulation = models.ForeignKey('scenarios.CustomSimulation', on_delete=models.CASCADE, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'simulations'
        ordering = ['-started_at']


class Message(models.Model):
    SENDER_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI'),
    ]
    
    simulation = models.ForeignKey(Simulation, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    content = models.TextField()
    emotion = models.CharField(max_length=50, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # LLM Analysis Metadata (for user messages)
    llm_analysis = models.JSONField(default=dict, blank=True)
    key_points = ArrayField(models.CharField(max_length=200), default=list, blank=True)
    financial_mentions = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    strategic_concepts = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    stakeholders_mentioned = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    action_items = ArrayField(models.CharField(max_length=200), default=list, blank=True)
    concerns_raised = ArrayField(models.CharField(max_length=200), default=list, blank=True)
    
    # Business Analysis
    business_impact_level = models.CharField(max_length=20, blank=True, null=True)
    urgency_level = models.CharField(max_length=20, blank=True, null=True)
    confidence_score = models.FloatField(default=0.0)
    
    # Objective Progress
    objective_progress_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'messages'
        ordering = ['timestamp']


class ConversationInsights(models.Model):
    """Accumulated insights from conversation analysis"""
    simulation = models.OneToOneField(Simulation, on_delete=models.CASCADE, related_name='insights')
    
    # Accumulated Data
    all_key_points = ArrayField(models.CharField(max_length=200), default=list)
    all_financial_mentions = ArrayField(models.CharField(max_length=100), default=list)
    all_strategic_concepts = ArrayField(models.CharField(max_length=100), default=list)
    all_stakeholders = ArrayField(models.CharField(max_length=100), default=list)
    all_action_items = ArrayField(models.CharField(max_length=200), default=list)
    all_concerns = ArrayField(models.CharField(max_length=200), default=list)
    
    # Business Intelligence
    highest_impact_level = models.CharField(max_length=20, default='medium')
    peak_urgency_level = models.CharField(max_length=20, default='medium')
    dominant_emotions = ArrayField(models.CharField(max_length=50), default=list)
    
    # Conversation Flow
    conversation_phases = models.JSONField(default=list)  # Track conversation evolution
    decision_points = models.JSONField(default=list)      # Track key decision moments
    
    # Summary Intelligence
    conversation_summary = models.TextField(blank=True)
    main_conclusions = ArrayField(models.TextField(), default=list)
    unresolved_issues = ArrayField(models.TextField(), default=list)
    
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'conversation_insights'


class SimulationAnalysis(models.Model):
    simulation = models.OneToOneField(Simulation, on_delete=models.CASCADE, related_name='analysis')
    overall_score = models.IntegerField()
    strategic_score = models.IntegerField()
    communication_score = models.IntegerField()
    emotional_score = models.IntegerField()
    strengths = ArrayField(models.TextField(), default=list)
    improvements = ArrayField(models.TextField(), default=list)
    recommendations = ArrayField(models.TextField(), default=list)
    key_moments = models.JSONField(default=list)
    tactics_used = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'simulation_analyses'
