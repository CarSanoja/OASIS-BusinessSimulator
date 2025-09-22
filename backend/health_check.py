"""
Health Check Endpoint for OASIS Backend
Provides system health status for monitoring and load balancers
"""

from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.conf import settings
import redis
import os
from datetime import datetime


def health_check(request):
    """
    Comprehensive health check endpoint
    Returns HTTP 200 if all systems are healthy, HTTP 503 otherwise
    """
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': getattr(settings, 'VERSION', '1.0.0'),
        'services': {}
    }

    overall_healthy = True

    # Check Database Connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        health_status['services']['database'] = {
            'status': 'healthy',
            'response_time_ms': 0  # Would need timing for actual response time
        }
    except Exception as e:
        health_status['services']['database'] = {
            'status': 'unhealthy',
            'error': str(e)
        }
        overall_healthy = False

    # Check Redis Connection
    try:
        redis_url = os.getenv('REDIS_URL') or getattr(settings, 'CELERY_BROKER_URL', 'redis://localhost:6379')
        redis_client = redis.from_url(redis_url)
        redis_client.ping()
        health_status['services']['redis'] = {
            'status': 'healthy',
            'response_time_ms': 0
        }
    except Exception as e:
        health_status['services']['redis'] = {
            'status': 'unhealthy',
            'error': str(e)
        }
        overall_healthy = False

    # Check OpenAI API Key (without making actual call)
    openai_key = getattr(settings, 'OPENAI_API_KEY', None) or os.getenv('OPENAI_API_KEY')
    if openai_key and len(openai_key) > 20:  # Basic validation
        health_status['services']['openai'] = {
            'status': 'configured',
            'key_present': True
        }
    else:
        health_status['services']['openai'] = {
            'status': 'not_configured',
            'key_present': False
        }
        # Don't mark as unhealthy, just note configuration issue

    # Check Disk Space
    try:
        statvfs = os.statvfs('/')
        free_space_gb = (statvfs.f_frsize * statvfs.f_available) / (1024**3)
        total_space_gb = (statvfs.f_frsize * statvfs.f_blocks) / (1024**3)
        usage_percent = ((total_space_gb - free_space_gb) / total_space_gb) * 100

        disk_status = 'healthy'
        if usage_percent > 90:
            disk_status = 'critical'
            overall_healthy = False
        elif usage_percent > 80:
            disk_status = 'warning'

        health_status['services']['disk'] = {
            'status': disk_status,
            'usage_percent': round(usage_percent, 2),
            'free_space_gb': round(free_space_gb, 2),
            'total_space_gb': round(total_space_gb, 2)
        }
    except Exception as e:
        health_status['services']['disk'] = {
            'status': 'unknown',
            'error': str(e)
        }

    # Update overall status
    if not overall_healthy:
        health_status['status'] = 'unhealthy'

    # Return appropriate HTTP status code
    status_code = 200 if overall_healthy else 503

    return JsonResponse(health_status, status=status_code)


def simple_health_check(request):
    """
    Simple health check that just returns OK
    Useful for basic load balancer health checks
    """
    return JsonResponse({
        'status': 'ok',
        'timestamp': datetime.now().isoformat()
    })