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
    
    class Meta:
        db_table = 'messages'
        ordering = ['timestamp']


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
