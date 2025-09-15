import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Eye, EyeOff, Mail, Lock, ChevronRight, Sparkles, TrendingUp, Users, Globe, Play } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { apiService } from "../services/api";

interface LandingPageProps {
  onLogin: (userData: { email: string; name: string }) => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    
    try {
      // Use real API authentication
      const response = await apiService.demoLogin(email, password);
      
      // Store token in localStorage for persistence
      localStorage.setItem('authToken', response.access);
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      localStorage.setItem('userData', JSON.stringify(response.user));
      
      // Call onLogin with real user data
      onLogin({ 
        email: response.user.email, 
        name: response.user.name || response.user.username
      });
      
    } catch (error) {
      console.error('Login failed:', error);
      alert('Error de autenticación. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { email: 'maria.rodriguez@iesa.edu.ve', role: 'MBA Student', name: 'María Rodríguez' },
    { email: 'carlos.mendoza@corp.com', role: 'Senior Executive', name: 'Carlos Mendoza' },
    { email: 'ana.silva@startup.com', role: 'Entrepreneur', name: 'Ana Silva' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        {/* Dynamic particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Panel - Hero Section */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl text-center space-y-8">
            {/* Brand Header */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse-glow">
                  <span className="text-3xl font-bold text-white">O</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white animate-bounce"></div>
              </div>
              <div className="text-left">
                <h1 className="text-5xl font-bold text-white mb-2">
                  OASIS
                </h1>
                <p className="text-cyan-300 font-medium">by IESA Business School</p>
              </div>
            </div>

            {/* Hero Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm border border-cyan-300/30 rounded-full px-6 py-3">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <span className="text-cyan-300 font-medium">El Futuro del Aprendizaje Inmersivo</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Desarrolla competencias 
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"> ejecutivas </span>
                con IA avanzada
              </h2>

              <p className="text-xl text-white/80 leading-relaxed max-w-2xl">
                Practica decisiones críticas de C-Suite en simulaciones inmersivas. 
                Desde role-playing ejecutivo hasta coaching personalizado con inteligencia artificial.
              </p>

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="glass-card p-4 rounded-2xl hover-lift">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Play className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-white">Role-Playing IA</h3>
                  </div>
                  <p className="text-white/70 text-sm">Simulaciones ejecutivas con personajes de IA realistas</p>
                </div>

                <div className="glass-card p-4 rounded-2xl hover-lift">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-white">Analytics Avanzado</h3>
                  </div>
                  <p className="text-white/70 text-sm">Feedback detallado y métricas de rendimiento</p>
                </div>

                <div className="glass-card p-4 rounded-2xl hover-lift">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-white">Nivel C-Suite</h3>
                  </div>
                  <p className="text-white/70 text-sm">Escenarios de alta dirección empresarial</p>
                </div>

                <div className="glass-card p-4 rounded-2xl hover-lift">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-white">Contexto LATAM</h3>
                  </div>
                  <p className="text-white/70 text-sm">Mercados y regulaciones latinoamericanas</p>
                </div>
              </div>


            </div>
          </div>
        </div>

        {/* Right Panel - Authentication */}
        <div className="w-full max-w-md p-8 flex items-center justify-center">
          <Card className="w-full bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl">
            <CardHeader className="text-center pb-4">

              <CardTitle className="text-2xl text-gray-900">
                ¡Bienvenido de vuelta!
              </CardTitle>
              <p className="text-gray-600">
                Accede a tu entrenamiento ejecutivo personalizado
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email corporativo
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu.email@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>



                <Button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Validando credenciales...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Iniciar Sesión</span>
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Demo Accounts */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-600 text-sm mb-4 text-center">
                  🧪 Cuentas de demostración:
                </p>
                <div className="space-y-2">
                  {demoCredentials.map((demo, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setEmail(demo.email);
                        setPassword('demo123');
                      }}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-gray-900 font-medium text-sm">{demo.name}</p>
                          <p className="text-gray-500 text-xs">{demo.email}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                          {demo.role}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-500">
                <p className="text-xs">
                  Al continuar, aceptas nuestros términos de servicio y política de privacidad.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}