from django.db import models


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('simulation_complete', 'Simulation Complete'),
        ('new_scenario', 'New Scenario Available'),
        ('achievement', 'Achievement Unlocked'),
        ('reminder', 'Practice Reminder'),
    ]
    
    user = models.ForeignKey('authentication.User', on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
