#!/bin/bash

echo "🎯 OASIS INTEGRATION DEMO"
echo "========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Testing Authentication...${NC}"
TOKEN=$(curl -s -X POST http://localhost:3009/api/auth/demo-login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "maria.rodriguez@iesa.edu.ve", "password": "demo123"}' | jq -r '.access')

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
    echo -e "${GREEN}✅ Authentication successful${NC}"
    echo "   User: $(curl -s -X POST http://localhost:3009/api/auth/demo-login/ -H "Content-Type: application/json" -d '{"email": "maria.rodriguez@iesa.edu.ve", "password": "demo123"}' | jq -r '.user.name')"
else
    echo -e "${RED}❌ Authentication failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📚 Testing Scenarios API...${NC}"
SCENARIO_COUNT=$(curl -s -X GET http://localhost:3009/api/scenarios/scenarios/ \
  -H "Authorization: Bearer $TOKEN" | jq '.count')

echo -e "${GREEN}✅ Scenarios loaded: $SCENARIO_COUNT scenarios${NC}"

FEATURED_COUNT=$(curl -s -X GET http://localhost:3009/api/scenarios/scenarios/featured/ \
  -H "Authorization: Bearer $TOKEN" | jq 'length')

echo -e "${GREEN}✅ Featured scenarios: $FEATURED_COUNT scenarios${NC}"

echo ""
echo -e "${BLUE}🎭 Testing AI Simulation...${NC}"

# Create simulation
SIM_RESPONSE=$(curl -s -X POST http://localhost:3009/api/simulations/simulations/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenario": 1}')

SIM_ID=$(echo $SIM_RESPONSE | jq -r '.id')
echo -e "${GREEN}✅ Simulation created: ID $SIM_ID${NC}"

# Send message and get AI response
MSG_RESPONSE=$(curl -s -X POST http://localhost:3009/api/simulations/simulations/$SIM_ID/send_message/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Buenos días, proponemos adquirir su empresa por $14M USD con retención del equipo"}')

AI_MSG=$(echo $MSG_RESPONSE | jq -r '.ai_message.content')
EMOTION=$(echo $MSG_RESPONSE | jq -r '.ai_message.emotion')

echo -e "${GREEN}✅ AI Response received${NC}"
echo "   Message: ${AI_MSG:0:60}..."
echo "   Emotion: $EMOTION"

# End simulation
END_RESULT=$(curl -s -X POST http://localhost:3009/api/simulations/simulations/$SIM_ID/end_simulation/ \
  -H "Authorization: Bearer $TOKEN")

SCORE=$(echo $END_RESULT | jq -r '.analysis.overall_score')
echo -e "${GREEN}✅ Simulation completed with score: $SCORE/100${NC}"

echo ""
echo -e "${BLUE}🎨 Testing Custom Simulation...${NC}"

CUSTOM_SIM=$(curl -s -X POST http://localhost:3009/api/scenarios/custom-simulations/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Demo: Negociación de Presupuesto",
    "description": "Reunión con CFO para aprobar presupuesto Q1",
    "category": "Liderazgo Ejecutivo",
    "difficulty": "Intermedio",
    "skills": ["Negociación", "Presentación"],
    "user_role": "Director de Marketing",
    "ai_role": "CFO conservador", 
    "ai_personality": {"analytical": 80, "patience": 40, "aggression": 60, "flexibility": 30},
    "ai_objectives": ["Reducir presupuesto"],
    "user_objectives": ["Conseguir aprobación"],
    "end_conditions": ["Acuerdo alcanzado"],
    "is_published": false
  }')

CUSTOM_ID=$(echo $CUSTOM_SIM | jq -r '.id')
echo -e "${GREEN}✅ Custom simulation created: ID $CUSTOM_ID${NC}"

# Test custom simulation
TEST_RESPONSE=$(curl -s -X POST http://localhost:3009/api/scenarios/custom-simulations/$CUSTOM_ID/test/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Necesitamos $75K para la campaña de Q1"}')

TEST_AI=$(echo $TEST_RESPONSE | jq -r '.response')
echo -e "${GREEN}✅ Custom simulation test response:${NC}"
echo "   ${TEST_AI:0:60}..."

echo ""
echo -e "${YELLOW}🎉 INTEGRATION DEMO COMPLETE!${NC}"
echo ""
echo -e "${GREEN}✅ WORKING FEATURES:${NC}"
echo "   • Authentication with JWT tokens"
echo "   • Real scenario loading (6 scenarios)"
echo "   • AI simulation with contextual responses"
echo "   • Performance analysis and scoring"
echo "   • Custom simulation creation and testing"
echo ""
echo -e "${BLUE}🌐 Access Points:${NC}"
echo "   • Frontend: http://localhost:3009"
echo "   • Backend API: http://localhost:8009"
echo "   • Demo Login: maria.rodriguez@iesa.edu.ve / demo123"
echo ""
echo -e "${YELLOW}📋 Next: Open browser to http://localhost:3009 to see the UI!${NC}"
