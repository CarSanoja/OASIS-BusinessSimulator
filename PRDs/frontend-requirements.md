# OASIS - Product Requirements Document (PRD)
## Frontend Requirements by Screen and Component

### 1. Executive Summary

OASIS is an executive learning platform developed by IESA Business School that uses AI-powered role-playing simulations to develop critical business competencies. The platform consists of multiple modules (currently Role-Playing is active) with plans for AI Coaching, Predictive Analytics, and Skill Assessment.

### 2. Technical Stack

- **Framework**: React with TypeScript
- **UI Library**: Custom UI components with Radix UI base
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Charts**: Recharts
- **Forms**: React Hook Form
- **State Management**: React useState/useEffect

### 3. Core Data Models

#### User Model
```typescript
interface UserData {
  email: string;
  name: string;
}
```

#### Scenario Model
```typescript
interface Scenario {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  duration: string;
  participants: string;
  objectives: string[];
  skills: string[];
}
```

#### Message Model
```typescript
interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  emotion?: string;
}
```

#### Custom Simulation Model
```typescript
interface CustomSimulation {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  skills: string[];
  userRole: string;
  aiRole: string;
  aiPersonality: {
    analytical: number;
    patience: number;
    aggression: number;
    flexibility: number;
  };
  aiObjectives: string[];
  userObjectives: string[];
  endConditions: string[];
  knowledgeBase?: string;
  isPublished: boolean;
  createdBy: string;
  createdAt: Date;
}
```

### 4. Screens and Component Requirements

#### 4.1 Landing Page (`LandingPage.tsx`)

**Purpose**: Authentication and platform introduction

**Key Features**:
- Login form with email/password
- Demo accounts for quick access
- Platform value proposition
- Animated background with particles
- Feature highlights grid

**Backend Requirements**:
- `POST /api/auth/login` - Authenticate user
- Response: JWT token, user profile data
- Demo accounts should be pre-configured

#### 4.2 Dashboard View (`DashboardView.tsx`)

**Purpose**: Central hub for scenario selection and navigation

**Key Features**:
- Featured scenarios section
- Learning paths (future functionality)
- Complete scenario library with filtering
- Custom simulations display
- Search and filter by category/difficulty
- Module status indicators

**Backend Requirements**:
- `GET /api/scenarios` - List all available scenarios
- `GET /api/scenarios/featured` - Get featured scenarios
- `GET /api/learning-paths` - Get learning path recommendations
- `GET /api/custom-simulations?user_id={id}` - Get user's custom simulations
- Filtering parameters: category, difficulty, skills, search term

#### 4.3 Simulation View (`SimulationView.tsx`)

**Purpose**: Active simulation environment

**Key Features**:
- Real-time chat interface with AI
- Objective tracking system
- Emotional tone analysis (0-100 scale)
- Strategic alignment metrics
- Resource panel
- Timer and progress indicators
- Message input with multi-line support

**Backend Requirements**:
- `POST /api/simulations/start` - Initialize simulation session
- `POST /api/simulations/{id}/message` - Send user message
- `GET /api/simulations/{id}/response` - Get AI response
- `PUT /api/simulations/{id}/end` - End simulation
- WebSocket support for real-time communication
- AI integration for:
  - Natural language processing
  - Contextual responses based on scenario
  - Emotion detection
  - Objective progress tracking

#### 4.4 Feedback View (`FeedbackView.tsx`)

**Purpose**: Post-simulation analysis and learning

**Key Features**:
- Overall performance score (0-100)
- Competency breakdown (Strategy, Communication, Emotional Intelligence)
- Key moments analysis with AI coaching
- Sentiment evolution chart
- Tactics effectiveness bar chart
- Annotated transcript
- Personalized recommendations
- Export report functionality

**Backend Requirements**:
- `GET /api/simulations/{id}/analysis` - Get simulation analysis
- `GET /api/simulations/{id}/transcript` - Get annotated transcript
- `POST /api/simulations/{id}/export` - Generate PDF report
- Analysis should include:
  - Performance metrics calculation
  - Key moment identification
  - Strength/improvement areas
  - Personalized recommendations based on IESA curriculum

#### 4.5 Progress View (`ProgressView.tsx`)

**Purpose**: Personal development tracking

**Key Features**:
- Competency radar chart
- Historical performance tracking
- Learning path suggestions
- Simulation history
- Time distribution analytics
- Average scores and trends

**Backend Requirements**:
- `GET /api/users/{id}/progress` - Get user progress data
- `GET /api/users/{id}/competencies` - Get competency scores
- `GET /api/users/{id}/history` - Get simulation history
- `GET /api/users/{id}/analytics` - Get performance analytics
- Aggregation of:
  - Competency scores over time
  - Simulation completion data
  - Time spent per category
  - Improvement trends

#### 4.6 Creator View (`CreatorView.tsx`)

**Purpose**: Custom simulation creation wizard

**Key Features**:
- 5-step creation wizard
- AI personality configuration (4 sliders)
- Objective and end condition management
- Knowledge base input
- Real-time validation
- Save as draft or publish options

**Backend Requirements**:
- `POST /api/custom-simulations` - Create new simulation
- `PUT /api/custom-simulations/{id}` - Update simulation
- `POST /api/custom-simulations/{id}/publish` - Publish simulation
- `POST /api/custom-simulations/{id}/test` - Test simulation
- Validation for:
  - Required fields
  - Content appropriateness
  - AI personality bounds
  - Objective/condition logic

#### 4.7 Header Component (`Header.tsx`)

**Purpose**: Global navigation and user info

**Key Features**:
- User avatar with initials
- Current view indicator
- Module status badges
- Notification bell (future)
- Logout functionality

**Backend Requirements**:
- `POST /api/auth/logout` - Logout user
- `GET /api/notifications` - Get user notifications (future)

### 5. API Endpoints Summary

#### Authentication
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh` (for token refresh)

#### Scenarios
- `GET /api/scenarios`
- `GET /api/scenarios/featured`
- `GET /api/scenarios/{id}`

#### Simulations
- `POST /api/simulations/start`
- `POST /api/simulations/{id}/message`
- `GET /api/simulations/{id}/response`
- `PUT /api/simulations/{id}/end`
- `GET /api/simulations/{id}/analysis`
- `GET /api/simulations/{id}/transcript`
- `POST /api/simulations/{id}/export`

#### Custom Simulations
- `GET /api/custom-simulations`
- `POST /api/custom-simulations`
- `PUT /api/custom-simulations/{id}`
- `POST /api/custom-simulations/{id}/publish`
- `POST /api/custom-simulations/{id}/test`

#### User Progress
- `GET /api/users/{id}/progress`
- `GET /api/users/{id}/competencies`
- `GET /api/users/{id}/history`
- `GET /api/users/{id}/analytics`

#### Learning Paths
- `GET /api/learning-paths`
- `GET /api/learning-paths/{id}`

### 6. Key Integration Points

#### AI Service Requirements
- Natural language processing for chat interactions
- Personality-based response generation
- Emotion detection from text
- Objective progress analysis
- Performance scoring algorithms
- Recommendation engine for learning paths

#### Analytics Requirements
- Session tracking
- Performance metrics calculation
- Competency scoring system
- Time tracking
- Progress aggregation

### 7. Security Requirements
- JWT-based authentication
- Session management
- API rate limiting
- Input validation and sanitization
- CORS configuration for frontend domain

### 8. Performance Requirements
- Chat responses < 2 seconds
- Dashboard load < 1 second
- Real-time message delivery
- Support for concurrent simulations
- Efficient data pagination for large datasets

### 9. Future Considerations
- WebSocket implementation for real-time features
- Video integration for enhanced simulations
- Multi-language support (Spanish/English)
- Mobile app API compatibility
- Integration with IESA's existing LMS
