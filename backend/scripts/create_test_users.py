#!/usr/bin/env python3
"""
Test Users Creation Script for OASIS
Creates test users for login functionality
"""

import os
import sys
import django
from django.contrib.auth.models import User

# Add the project directory to Python path
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'oasis.settings')
django.setup()

def create_test_users():
    """Create test users for the OASIS application"""
    
    test_users = [
        {
            'username': 'admin',
            'email': 'admin@oasis.com',
            'password': 'admin123',
            'first_name': 'Admin',
            'last_name': 'User',
            'is_staff': True,
            'is_superuser': True
        },
        {
            'username': 'manager',
            'email': 'manager@oasis.com',
            'password': 'manager123',
            'first_name': 'Manager',
            'last_name': 'User',
            'is_staff': True,
            'is_superuser': False
        },
        {
            'username': 'user1',
            'email': 'user1@oasis.com',
            'password': 'user123',
            'first_name': 'Test',
            'last_name': 'User 1',
            'is_staff': False,
            'is_superuser': False
        },
        {
            'username': 'user2',
            'email': 'user2@oasis.com',
            'password': 'user123',
            'first_name': 'Test',
            'last_name': 'User 2',
            'is_staff': False,
            'is_superuser': False
        },
        {
            'username': 'demo',
            'email': 'demo@oasis.com',
            'password': 'demo123',
            'first_name': 'Demo',
            'last_name': 'User',
            'is_staff': False,
            'is_superuser': False
        }
    ]
    
    created_users = []
    
    for user_data in test_users:
        username = user_data['username']
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            print(f"User '{username}' already exists, skipping...")
            continue
            
        # Create user
        user = User.objects.create_user(
            username=user_data['username'],
            email=user_data['email'],
            password=user_data['password'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            is_staff=user_data['is_staff'],
            is_superuser=user_data['is_superuser']
        )
        
        created_users.append(user)
        print(f"Created user: {username} ({user.email})")
    
    print(f"\nSuccessfully created {len(created_users)} test users:")
    for user in created_users:
        print(f"- {user.username} ({user.email}) - {'Admin' if user.is_superuser else 'Staff' if user.is_staff else 'Regular'}")
    
    return created_users

if __name__ == '__main__':
    try:
        create_test_users()
        print("\nTest users creation completed successfully!")
    except Exception as e:
        print(f"Error creating test users: {e}")
        sys.exit(1)
