import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarContent, AvatarFallback } from "./ui/avatar";
import { LogOut, User, Settings, BarChart3, Bell, Sparkles } from "lucide-react";

interface UserData {
  email: string;
  name: string;
}

interface HeaderProps {
  user: UserData;
  onLogout: () => void;
  currentView?: string;
}

export function Header({ user, onLogout, currentView = 'dashboard' }: HeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getViewTitle = (view: string) => {
    switch (view) {
      case 'dashboard': return 'Dashboard Principal';
      case 'simulation': return 'Simulación Activa';
      case 'feedback': return 'Análisis de Rendimiento';
      case 'progress': return 'Panel de Progreso';
      case 'creator': return 'Constructor de Simulaciones';
      default: return 'OASIS';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Brand + Current View */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold text-white">O</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  OASIS
                </h1>
                <p className="text-xs text-gray-500">by IESA</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <div className="h-6 w-px bg-gray-300"></div>
              <Badge variant="outline" className="text-xs font-medium">
                {getViewTitle(currentView)}
              </Badge>
            </div>
          </div>

          {/* Center: Status Indicators */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-800 font-medium">Módulo Role-Playing</span>
            </div>
            
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800 font-medium">3 módulos próximos</span>
            </div>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            </Button>

            {/* User Info + Logout */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl">
                <Avatar className="w-8 h-8">
                  <AvatarContent className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                    {getInitials(user.name)}
                  </AvatarContent>
                  <AvatarFallback className="bg-gray-200 text-gray-600 font-semibold text-sm">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              <Button 
                onClick={onLogout}
                variant="outline" 
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}