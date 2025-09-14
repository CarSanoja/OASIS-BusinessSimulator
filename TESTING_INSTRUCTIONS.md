# OASIS - Testing Instructions

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Terminal/Command line access
- `curl` and `jq` for API testing (optional but recommended)

### Start the Application
```bash
# Clone and navigate to project
cd /Users/carlos/Documents/OASIS

# Start all services
docker-compose up -d

# Check all containers are running
docker-compose ps
```

**Expected Output:**
```
NAME             IMAGE                    STATUS         PORTS
oasis-backend    oasis-backend           Up             0.0.0.0:8009->8000/tcp
oasis-frontend   oasis-frontend          Up             0.0.0.0:3009->80/tcp  
oasis-db         pgvector/pgvector:pg15  Up             5432/tcp
oasis-redis      redis:7-alpine          Up             6379/tcp
```

### Access Points
- **Frontend Application**: http://localhost:3009
- **Backend API**: http://localhost:8009
- **API through Frontend Proxy**: http://localhost:3009/api

## 🔐 Authentication Testing

### Demo Accounts (All use password: `demo123`)
1. **maria.rodriguez@iesa.edu.ve** - MBA Student
2. **carlos.mendoza@corp.com** - Senior Executive  
3. **ana.silva@startup.com** - Entrepreneur

### Get Authentication Token
```bash
# Method 1: Direct backend
curl -X POST http://localhost:8009/api/auth/demo-login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "maria.rodriguez@iesa.edu.ve", "password": "demo123"}'

# Method 2: Through frontend proxy (recommended)
curl -X POST http://localhost:3009/api/auth/demo-login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "maria.rodriguez@iesa.edu.ve", "password": "demo123"}'
```

### Extract Token for Further Testing
```bash
TOKEN=$(curl -s -X POST http://localhost:3009/api/auth/demo-login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "maria.rodriguez@iesa.edu.ve", "password": "demo123"}' | jq -r '.access')

echo "Token: $TOKEN"
```

## 📚 Scenarios API Testing

### List All Scenarios
```bash
curl -X GET http://localhost:3009/api/scenarios/scenarios/ \
  -H "Authorization: Bearer $TOKEN" | jq '.count'
```
**Expected**: `6` scenarios

### Get Featured Scenarios
```bash
curl -X GET http://localhost:3009/api/scenarios/scenarios/featured/ \
  -H "Authorization: Bearer $TOKEN" | jq 'length'
```
**Expected**: `2` featured scenarios

### Get Categories
```bash
curl -X GET http://localhost:3009/api/scenarios/scenarios/categories/ \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```
**Expected**: Array of 6 categories

### Filter Scenarios
```bash
# By category
curl -X GET "http://localhost:3009/api/scenarios/scenarios/?category=Liderazgo%20Ejecutivo" \
  -H "Authorization: Bearer $TOKEN" | jq '.count'

# By difficulty  
curl -X GET "http://localhost:3009/api/scenarios/scenarios/?difficulty=Avanzado" \
  -H "Authorization: Bearer $TOKEN" | jq '.count'

# By search term
curl -X GET "http://localhost:3009/api/scenarios/scenarios/?search=crisis" \
  -H "Authorization: Bearer $TOKEN" | jq '.count'
```

## 🎭 Simulation Testing

### Complete Simulation Flow
```bash
# 1. Create simulation
SIM_RESPONSE=$(curl -s -X POST http://localhost:3009/api/simulations/simulations/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenario": 1}')

SIM_ID=$(echo $SIM_RESPONSE | jq -r '.id')
echo "✅ Simulation Created: ID $SIM_ID"

# 2. Send first message
MSG1=$(curl -s -X POST http://localhost:3009/api/simulations/simulations/$SIM_ID/send_message/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Buenos días, estamos interesados en adquirir su empresa por $14M USD"}')

echo "✅ AI Response 1:"
echo $MSG1 | jq -r '.ai_message.content'
echo "Emotion: $(echo $MSG1 | jq -r '.ai_message.emotion')"

# 3. Send follow-up message
MSG2=$(curl -s -X POST http://localhost:3009/api/simulations/simulations/$SIM_ID/send_message/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Entendemos sus preocupaciones. Podemos ofrecer un plan de retención de 24 meses"}')

echo "✅ AI Response 2:"
echo $MSG2 | jq -r '.ai_message.content'

# 4. End simulation and get analysis
END_RESULT=$(curl -s -X POST http://localhost:3009/api/simulations/simulations/$SIM_ID/end_simulation/ \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Final Analysis:"
echo "Overall Score: $(echo $END_RESULT | jq -r '.analysis.overall_score')/100"
echo "Strategic Score: $(echo $END_RESULT | jq -r '.analysis.strategic_score')/100"
echo "Communication Score: $(echo $END_RESULT | jq -r '.analysis.communication_score')/100"
```

### Test Different Scenarios
```bash
# Crisis Leadership (Scenario 2)
SIM_ID=$(curl -s -X POST http://localhost:3009/api/simulations/simulations/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenario": 2}' | jq -r '.id')

curl -X POST http://localhost:3009/api/simulations/simulations/$SIM_ID/send_message/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Necesitamos actuar rápido para controlar esta crisis de reputación"}' | jq -r '.ai_message.content'

# Startup Pitch (Scenario 3)  
SIM_ID=$(curl -s -X POST http://localhost:3009/api/simulations/simulations/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenario": 3}' | jq -r '.id')

curl -X POST http://localhost:3009/api/simulations/simulations/$SIM_ID/send_message/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Estamos buscando $5M para nuestra serie A. Tenemos 50K usuarios activos"}' | jq -r '.ai_message.content'
```

## 🎨 Custom Simulation Testing

### Create Custom Simulation
```bash
CUSTOM_SIM=$(curl -s -X POST http://localhost:3009/api/scenarios/custom-simulations/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Negociación de Presupuesto Marketing Q1",
    "description": "Reunión con CFO para aprobar presupuesto de marketing digital",
    "category": "Liderazgo Ejecutivo",
    "difficulty": "Intermedio", 
    "skills": ["Negociación", "Presentación", "Análisis Financiero"],
    "user_role": "Director de Marketing con 3 años en la empresa. Necesitas $75K para campaña Q1 que proyecta 25% ROI.",
    "ai_role": "CFO conservador con 10 años en la empresa. Tienes presión de reducir gastos en 15% este trimestre.",
    "ai_personality": {
      "analytical": 85,
      "patience": 40, 
      "aggression": 65,
      "flexibility": 30
    },
    "ai_objectives": ["Reducir el presupuesto solicitado en al menos 30%", "Exigir métricas específicas de ROI"],
    "user_objectives": ["Conseguir al menos $50K aprobados", "Establecer métricas de éxito claras"],
    "end_conditions": ["Se llega a un acuerdo específico sobre presupuesto", "CFO solicita más información"],
    "knowledge_base": "La empresa tuvo caída de ventas 12% el trimestre pasado. Competidores están invirtiendo fuerte en digital.",
    "is_published": false
  }')

CUSTOM_ID=$(echo $CUSTOM_SIM | jq -r '.id')
echo "✅ Custom Simulation Created: ID $CUSTOM_ID"
```

### Test Custom Simulation
```bash
curl -X POST http://localhost:3009/api/scenarios/custom-simulations/$CUSTOM_ID/test/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Buenos días, necesitamos discutir el presupuesto de marketing para Q1"}' | jq -r '.response'
```

### Publish Custom Simulation
```bash
curl -X POST http://localhost:3009/api/scenarios/custom-simulations/$CUSTOM_ID/publish/ \
  -H "Authorization: Bearer $TOKEN" | jq -r '.is_published'
```

## 🔧 Development & Debugging

### Check Container Status
```bash
# View all containers
docker-compose ps

# View logs for specific service
docker-compose logs backend --tail=20
docker-compose logs frontend --tail=20
docker-compose logs db --tail=10

# Follow logs in real-time
docker-compose logs -f backend
```

### Database Operations
```bash
# Run Django commands inside backend container
docker exec oasis-backend python manage.py check
docker exec oasis-backend python manage.py migrate
docker exec oasis-backend python manage.py loaddata scenarios/fixtures/initial_scenarios.json

# Access Django shell
docker exec -it oasis-backend python manage.py shell

# Access PostgreSQL directly
docker exec -it oasis-db psql -U oasis -d oasis
```

### Restart Services
```bash
# Restart single service
docker-compose restart backend
docker-compose restart frontend

# Rebuild and restart
docker-compose up -d --build backend
docker-compose up -d --build frontend

# Full restart
docker-compose down && docker-compose up -d
```

## 🧪 Advanced Testing Scenarios

### Multi-User Testing
```bash
# Test with different users
TOKEN_MARIA=$(curl -s -X POST http://localhost:3009/api/auth/demo-login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "maria.rodriguez@iesa.edu.ve", "password": "demo123"}' | jq -r '.access')

TOKEN_CARLOS=$(curl -s -X POST http://localhost:3009/api/auth/demo-login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "carlos.mendoza@corp.com", "password": "demo123"}' | jq -r '.access')

# Create simulations for both users
curl -X POST http://localhost:3009/api/simulations/simulations/ \
  -H "Authorization: Bearer $TOKEN_MARIA" \
  -H "Content-Type: application/json" \
  -d '{"scenario": 1}'

curl -X POST http://localhost:3009/api/simulations/simulations/ \
  -H "Authorization: Bearer $TOKEN_CARLOS" \
  -H "Content-Type: application/json" \
  -d '{"scenario": 2}'
```

### Performance Testing
```bash
# Test rapid message sending
for i in {1..5}; do
  curl -s -X POST http://localhost:3009/api/simulations/simulations/1/send_message/ \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"Message $i: Testing rapid responses\"}" | jq -r '.ai_message.emotion'
done
```

### Error Testing
```bash
# Test without authentication
curl -X GET http://localhost:3009/api/scenarios/scenarios/

# Test with invalid token
curl -X GET http://localhost:3009/api/scenarios/scenarios/ \
  -H "Authorization: Bearer invalid_token"

# Test with invalid scenario ID
curl -X POST http://localhost:3009/api/simulations/simulations/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenario": 999}'
```

## 📊 Data Verification

### Check Database Content
```bash
# Count scenarios in database
docker exec oasis-backend python manage.py shell -c "
from scenarios.models import Scenario
print(f'Total scenarios: {Scenario.objects.count()}')
print(f'Featured scenarios: {Scenario.objects.filter(is_featured=True).count()}')
"

# Check user accounts
docker exec oasis-backend python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
print(f'Total users: {User.objects.count()}')
for user in User.objects.all():
    print(f'- {user.email}: {user.first_name} {user.last_name}')
"

# Check simulations
docker exec oasis-backend python manage.py shell -c "
from simulations.models import Simulation, Message
print(f'Total simulations: {Simulation.objects.count()}')
print(f'Total messages: {Message.objects.count()}')
print(f'Active simulations: {Simulation.objects.filter(status=\"active\").count()}')
"
```

## 🎯 Specific Feature Testing

### AI Response Variations by Scenario
```bash
# Test M&A scenario responses
TOKEN=$(curl -s -X POST http://localhost:3009/api/auth/demo-login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "maria.rodriguez@iesa.edu.ve", "password": "demo123"}' | jq -r '.access')

# Scenario 1: M&A Negotiation
SIM_ID=$(curl -s -X POST http://localhost:3009/api/simulations/simulations/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenario": 1}' | jq -r '.id')

echo "Testing M&A responses:"
curl -s -X POST http://localhost:3009/api/simulations/simulations/$SIM_ID/send_message/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "We want to acquire your company"}' | jq -r '.ai_message.content'

# Scenario 2: Crisis Leadership  
SIM_ID=$(curl -s -X POST http://localhost:3009/api/simulations/simulations/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenario": 2}' | jq -r '.id')

echo "Testing Crisis responses:"
curl -s -X POST http://localhost:3009/api/simulations/simulations/$SIM_ID/send_message/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "We need to handle this crisis immediately"}' | jq -r '.ai_message.content'
```

### Emotion Detection Testing
```bash
# Test positive emotion
curl -s -X POST http://localhost:3009/api/simulations/simulations/$SIM_ID/send_message/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Excelente propuesta, acepto completamente"}' | jq -r '.ai_message.emotion'

# Test skeptical emotion  
curl -s -X POST http://localhost:3009/api/simulations/simulations/$SIM_ID/send_message/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "No estoy de acuerdo, esto es imposible"}' | jq -r '.ai_message.emotion'

# Test neutral emotion
curl -s -X POST http://localhost:3009/api/simulations/simulations/$SIM_ID/send_message/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Necesito más información sobre este tema"}' | jq -r '.ai_message.emotion'
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Containers Not Starting
```bash
# Check Docker status
docker --version
docker-compose --version

# Clean restart
docker-compose down -v
docker-compose up -d --build
```

#### Database Connection Issues
```bash
# Check database logs
docker-compose logs db

# Verify database is ready
docker exec oasis-db pg_isready -U oasis

# Reset database
docker-compose down -v
docker-compose up -d db
# Wait 10 seconds
docker-compose up -d backend
```

#### Backend API Errors
```bash
# Check backend logs
docker-compose logs backend --tail=50

# Test backend health
curl -I http://localhost:8009/admin/

# Run Django check
docker exec oasis-backend python manage.py check
```

#### Frontend Build Issues
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend

# Test frontend serving
curl -I http://localhost:3009
```

### Debug Mode
```bash
# Enable Django debug mode (for development only)
docker-compose down
# Edit docker-compose.yml: change DEBUG=False to DEBUG=True
docker-compose up -d backend

# View detailed error messages
curl -X GET http://localhost:3009/api/scenarios/scenarios/
```

## 📈 Performance Testing

### Load Testing
```bash
# Test multiple rapid requests
for i in {1..10}; do
  curl -s -X GET http://localhost:3009/api/scenarios/scenarios/ \
    -H "Authorization: Bearer $TOKEN" | jq '.count' &
done
wait
echo "All requests completed"

# Test simulation message throughput
SIM_ID=$(curl -s -X POST http://localhost:3009/api/simulations/simulations/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenario": 1}' | jq -r '.id')

time for i in {1..5}; do
  curl -s -X POST http://localhost:3009/api/simulations/simulations/$SIM_ID/send_message/ \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"Performance test message $i\"}" > /dev/null
done
```

## 🔍 Monitoring

### Real-time Monitoring
```bash
# Monitor all logs
docker-compose logs -f

# Monitor specific service
docker-compose logs -f backend

# Monitor system resources
docker stats
```

### Health Checks
```bash
# Quick health check script
echo "=== OASIS HEALTH CHECK ==="
echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3009)"
echo "Backend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8009/admin/)"
echo "Database: $(docker exec oasis-db pg_isready -U oasis && echo "Ready" || echo "Not Ready")"
echo "Redis: $(docker exec oasis-redis redis-cli ping)"
```

## 🚀 Production Deployment Notes

### Environment Setup
1. Copy `env.example` to `.env`
2. Update API keys and secrets
3. Set `DEBUG=False` 
4. Configure proper domain names in `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`

### Security Checklist
- [ ] Change default SECRET_KEY
- [ ] Set strong database passwords
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS in production
- [ ] Set up proper logging
- [ ] Configure backup strategy

### Scaling Considerations
- Backend can be scaled horizontally with load balancer
- Database can be moved to managed service (AWS RDS, etc.)
- Redis can be clustered for high availability
- Frontend can be served from CDN
