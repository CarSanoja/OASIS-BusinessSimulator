from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken


@api_view(['POST'])
@permission_classes([AllowAny])
def demo_login(request):
    """
    Demo login endpoint for quick access with predefined accounts
    """
    email = request.data.get('email')
    password = request.data.get('password')
    
    # Demo accounts
    demo_accounts = {
        'maria.rodriguez@iesa.edu.ve': 'María Rodríguez',
        'carlos.mendoza@corp.com': 'Carlos Mendoza', 
        'ana.silva@startup.com': 'Ana Silva'
    }
    
    if email in demo_accounts and password == 'demo123':
        # Create or get demo user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0],
                'first_name': demo_accounts[email].split(' ')[0],
                'last_name': demo_accounts[email].split(' ')[1] if len(demo_accounts[email].split(' ')) > 1 else '',
            }
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip(),
                'username': user.username
            }
        })
    
    return Response(
        {'error': 'Invalid credentials'}, 
        status=status.HTTP_401_UNAUTHORIZED
    )
