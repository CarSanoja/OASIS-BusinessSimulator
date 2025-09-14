from django.db import models
from django.contrib.postgres.fields import ArrayField


class UserProgress(models.Model):
    user = models.OneToOneField('authentication.User', on_delete=models.CASCADE, related_name='progress')
    total_simulations = models.IntegerField(default=0)
    average_score = models.FloatField(default=0)
    total_duration_minutes = models.IntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_progress'


class CompetencyScore(models.Model):
    user = models.ForeignKey('authentication.User', on_delete=models.CASCADE, related_name='competency_scores')
    competency = models.CharField(max_length=100)
    current_score = models.IntegerField(default=0)
    target_score = models.IntegerField(default=85)
    sessions_count = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'competency_scores'
        unique_together = ['user', 'competency']
