from django.db import models
from django.contrib.postgres.fields import ArrayField


class Scenario(models.Model):
    DIFFICULTY_CHOICES = [
        ('Principiante', 'Principiante'),
        ('Intermedio', 'Intermedio'),
        ('Avanzado', 'Avanzado'),
    ]
    
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    description = models.TextField()
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    duration = models.CharField(max_length=50)
    participants = models.CharField(max_length=200)
    objectives = ArrayField(models.TextField(), default=list)
    skills = ArrayField(models.CharField(max_length=100), default=list)
    image_url = models.URLField(blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'scenarios'
        ordering = ['-created_at']


class CustomSimulation(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=50)
    skills = ArrayField(models.CharField(max_length=100), default=list)
    user_role = models.TextField()
    ai_role = models.TextField()
    ai_personality = models.JSONField(default=dict)
    ai_objectives = ArrayField(models.TextField(), default=list)
    user_objectives = ArrayField(models.TextField(), default=list)
    end_conditions = ArrayField(models.TextField(), default=list)
    knowledge_base = models.TextField(blank=True, null=True)
    is_published = models.BooleanField(default=False)
    created_by = models.ForeignKey('authentication.User', on_delete=models.CASCADE, related_name='custom_simulations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'custom_simulations'
        ordering = ['-created_at']
