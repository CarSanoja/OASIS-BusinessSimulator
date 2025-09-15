interface UserData {
  email: string;
  name: string;
  id: number;
  username: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: UserData;
}

interface Scenario {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: string;
  duration: string;
  participants: string;
  objectives: string[];
  skills: string[];
  image_url?: string;
  is_featured: boolean;
}

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

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  emotion?: string;
}

interface Simulation {
  id: number;
  scenario?: number;
  custom_simulation?: number;
  status: string;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
}

interface SimulationAnalysis {
  overall_score: number;
  strategic_score: number;
  communication_score: number;
  emotional_score: number;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  key_moments: Array<{
    time: string;
    message: string;
    impact: 'positive' | 'negative' | 'neutral';
    analysis: string;
  }>;
  tactics_used: Array<{
    tactic: string;
    effectiveness: number;
  }>;
}

class ApiService {
  private baseURL = '/api';
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  }


  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        
        if (response.status === 403) {
          throw new Error('No tienes permisos para realizar esta acción.');
        }
        
        if (response.status === 404) {
          throw new Error('El recurso solicitado no existe.');
        }
        
        if (response.status === 500) {
          throw new Error('Error interno del servidor. Por favor, intenta más tarde.');
        }
        
        const errorData = await response.text();
        throw new Error(`Error ${response.status}: ${errorData}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      }
      throw error;
    }
  }

  // Authentication
  async demoLogin(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/demo-login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.token = response.access;
    localStorage.setItem('access_token', response.access);
    localStorage.setItem('refresh_token', response.refresh);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await this.request('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh: refreshToken }),
        });
      }
    } catch (error) {
      console.warn('Server logout failed, proceeding with local logout:', error);
    } finally {
      // Always clear local storage
      this.token = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  getCurrentUser(): UserData | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  // Scenarios
  async getScenarios(filters?: {
    category?: string;
    difficulty?: string;
    search?: string;
  }): Promise<{ results: Scenario[] }> {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'all') {
      params.append('category', filters.category);
    }
    if (filters?.difficulty && filters.difficulty !== 'all') {
      params.append('difficulty', filters.difficulty);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const queryString = params.toString();
    const endpoint = `/scenarios/scenarios/${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{ results: Scenario[] }>(endpoint);
  }

  async getFeaturedScenarios(): Promise<Scenario[]> {
    return this.request<Scenario[]>('/scenarios/scenarios/featured/');
  }

  async getCategories(): Promise<string[]> {
    return this.request<string[]>('/scenarios/scenarios/categories/');
  }

  // Custom Simulations
  async getCustomSimulations(): Promise<CustomSimulation[]> {
    const response = await this.request<{ results: CustomSimulation[] }>('/scenarios/custom-simulations/');
    return response.results;
  }

  async createCustomSimulation(data: Partial<CustomSimulation>): Promise<CustomSimulation> {
    return this.request<CustomSimulation>('/scenarios/custom-simulations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async publishCustomSimulation(id: string): Promise<CustomSimulation> {
    return this.request<CustomSimulation>(`/scenarios/custom-simulations/${id}/publish/`, {
      method: 'POST',
    });
  }

  async testCustomSimulation(id: string, message: string): Promise<{
    response: string;
    emotion: string;
    status: string;
  }> {
    return this.request(`/scenarios/custom-simulations/${id}/test/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Simulations
  async createSimulation(data: { scenario?: number; custom_simulation?: number }): Promise<Simulation> {
    return this.request<Simulation>('/simulations/simulations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendMessage(simulationId: number, content: string): Promise<{
    user_message: Message;
    ai_message: Message;
    objective_progress: Record<string, boolean>;
  }> {
    return this.request(`/simulations/simulations/${simulationId}/send_message/`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async endSimulation(simulationId: number): Promise<{
    simulation: Simulation;
    analysis: SimulationAnalysis;
  }> {
    return this.request(`/simulations/simulations/${simulationId}/end_simulation/`, {
      method: 'POST',
    });
  }

  async getSimulationAnalysis(simulationId: number): Promise<SimulationAnalysis> {
    return this.request<SimulationAnalysis>(`/simulations/simulations/${simulationId}/analysis/`);
  }

  async getSimulationTranscript(simulationId: number): Promise<{
    transcript: Array<Message & { coaching_note?: string }>;
  }> {
    return this.request(`/simulations/simulations/${simulationId}/transcript/`);
  }

  // Analytics
  async getUserProgress(): Promise<{
    total_simulations: number;
    average_score: number;
    total_duration_minutes: number;
    competency_scores: Array<{
      competency: string;
      current_score: number;
      target_score: number;
      sessions_count: number;
    }>;
  }> {
    return this.request('/analytics/analytics/user_progress/');
  }

  async getCompetencies(): Promise<{
    competencies: Array<{
      competency: string;
      current_score: number;
      target_score: number;
      sessions_count: number;
    }>;
    radar_data: Array<{
      subject: string;
      current: number;
      target: number;
    }>;
  }> {
    return this.request('/analytics/analytics/competencies/');
  }

  async getSimulationHistory(): Promise<{
    history: Array<{
      id: number;
      title: string;
      category: string;
      started_at: string;
      duration_minutes: number;
      score: number;
      skills: string[];
    }>;
  }> {
    return this.request('/analytics/analytics/history/');
  }

  async getAnalytics(): Promise<{
    progress_over_time: Array<{ month: string; score: number }>;
    category_distribution: Array<{ category: string; percentage: number }>;
    key_metrics: {
      total_simulations: number;
      average_score: number;
      improvement_trend: number;
      total_duration: number;
    };
  }> {
    return this.request('/analytics/analytics/analytics/');
  }

  async getLearningPaths(): Promise<{
    learning_paths: Array<{
      id: string;
      title: string;
      description: string;
      priority: 'alta' | 'media' | 'baja';
      estimated_time: string;
      scenarios: string[];
    }>;
  }> {
    return this.request('/analytics/analytics/learning_paths/');
  }

  // Notifications
  async getNotifications(): Promise<{
    notifications: Array<{
      id: number;
      type: string;
      title: string;
      message: string;
      is_read: boolean;
      created_at: string;
    }>;
    unread_count: number;
  }> {
    return this.request('/notifications/notifications/list_notifications/');
  }

  async markNotificationRead(notificationId: number): Promise<void> {
    await this.request('/notifications/notifications/mark_read/', {
      method: 'POST',
      body: JSON.stringify({ notification_id: notificationId }),
    });
  }

  async getUnreadCount(): Promise<{ unread_count: number }> {
    return this.request('/notifications/notifications/unread_count/');
  }

}

export const apiService = new ApiService();
export type { UserData, Scenario, CustomSimulation, Message, Simulation, SimulationAnalysis };
