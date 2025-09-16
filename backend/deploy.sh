#!/bin/bash

# OASIS Backend Deployment Script
# Usage: ./deploy.sh [environment]
# Environment: production (default), staging

set -e  # Exit on any error

ENVIRONMENT=${1:-production}
APP_DIR="/opt/oasis"
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

echo "🚀 Starting deployment for OASIS Backend (${ENVIRONMENT})..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. This is not recommended for production."
fi

# Check if .env file exists
if [[ ! -f ".env.${ENVIRONMENT}" ]]; then
    print_error ".env.${ENVIRONMENT} file not found!"
    print_status "Please create .env.${ENVIRONMENT} from .env.${ENVIRONMENT}.example"
    exit 1
fi

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_header "Pulling latest code from repository"
git fetch --all
git reset --hard origin/main
print_status "✅ Code updated successfully"

print_header "Backing up database (if exists)"
if docker-compose -f $COMPOSE_FILE ps postgres | grep -q "Up"; then
    print_status "Creating database backup..."
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump -U ${POSTGRES_USER:-oasis_user} ${POSTGRES_DB:-oasis_db} > "backups/$BACKUP_FILE"
    print_status "✅ Database backup created: backups/$BACKUP_FILE"
else
    print_status "No existing database found, skipping backup"
fi

print_header "Stopping existing containers"
docker-compose -f $COMPOSE_FILE down
print_status "✅ Containers stopped"

print_header "Building new images"
docker-compose -f $COMPOSE_FILE build --no-cache
print_status "✅ Images built successfully"

print_header "Starting services"
docker-compose -f $COMPOSE_FILE up -d postgres redis
print_status "✅ Database and Redis started"

# Wait for database to be ready
print_status "Waiting for database to be ready..."
timeout 60 bash -c 'until docker-compose -f '$COMPOSE_FILE' exec postgres pg_isready -U ${POSTGRES_USER:-oasis_user}; do sleep 2; done'
print_status "✅ Database is ready"

print_header "Running database migrations"
docker-compose -f $COMPOSE_FILE run --rm django python manage.py migrate
print_status "✅ Database migrations completed"

print_header "Collecting static files"
docker-compose -f $COMPOSE_FILE run --rm django python manage.py collectstatic --noinput
print_status "✅ Static files collected"

print_header "Starting application services"
docker-compose -f $COMPOSE_FILE up -d django
print_status "✅ Django application started"

print_header "Starting reverse proxy"
docker-compose -f $COMPOSE_FILE up -d nginx
print_status "✅ Nginx reverse proxy started"

print_header "Health check"
sleep 10  # Give services time to start

# Check if Django is responding
if curl -f -s http://localhost/api/health/ > /dev/null; then
    print_status "✅ Application is healthy"
else
    print_error "❌ Application health check failed"
    print_status "Checking container logs..."
    docker-compose -f $COMPOSE_FILE logs --tail=50 django
    exit 1
fi

print_header "Cleaning up unused Docker resources"
docker system prune -f
print_status "✅ Docker cleanup completed"

print_header "Deployment completed successfully! 🎉"
print_status "Application is now running at: https://api.oasis.somosquanta.com"
print_status "Admin interface: https://api.oasis.somosquanta.com/admin/"

# Display running containers
print_header "Running containers"
docker-compose -f $COMPOSE_FILE ps

echo ""
print_status "💡 Useful commands:"
echo "  - View logs: docker-compose -f $COMPOSE_FILE logs -f [service]"
echo "  - Restart service: docker-compose -f $COMPOSE_FILE restart [service]"
echo "  - Enter container: docker-compose -f $COMPOSE_FILE exec [service] bash"
echo "  - Stop all: docker-compose -f $COMPOSE_FILE down"