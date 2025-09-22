#!/bin/bash

# Wait for database to be ready
echo "Waiting for database..."
while ! nc -z postgres 5432; do
  sleep 0.1
done
echo "Database started"

# Create migrations and migrate
echo "Creating migrations..."
python manage.py makemigrations authentication
python manage.py makemigrations scenarios
python manage.py makemigrations simulations
python manage.py makemigrations analytics

echo "Applying migrations..."
python manage.py migrate

# Load initial data
echo "Loading initial data..."
python manage.py loaddata scenarios/fixtures/initial_scenarios.json || echo "Fixtures already loaded or not found"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start server
echo "Starting server..."
exec "$@"
