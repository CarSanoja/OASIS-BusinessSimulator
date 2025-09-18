import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarContent, AvatarFallback } from "./ui/avatar";
import { LogOut, User, Settings, BarChart3, Globe, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";

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
  const { t, i18n } = useTranslation(['common', 'dashboard']);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  // Close language dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      case 'dashboard': return t('dashboard:title');
      case 'simulation': return t('common:activeSimulation', { defaultValue: 'Simulación Activa' });
      case 'feedback': return t('common:performanceAnalysis', { defaultValue: 'Análisis de Rendimiento' });
      case 'progress': return t('common:progressPanel', { defaultValue: 'Panel de Progreso' });
      case 'creator': return t('common:simulationBuilder', { defaultValue: 'Constructor de Simulaciones' });
      default: return 'OASIS';
    }
  };

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('oasisLanguage', lng);
    setIsLanguageDropdownOpen(false);
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
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <div className="h-6 w-px bg-gray-300"></div>
              <Badge variant="outline" className="text-xs font-medium">
                {getViewTitle(currentView)}
              </Badge>
            </div>
          </div>


          {/* Right: User Menu */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative" ref={languageDropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
                }}
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
              </Button>

              {isLanguageDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 min-w-[150px]">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => {
                        changeLanguage(language.code);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between text-gray-700 hover:text-gray-900"
                    >
                      <div className="flex items-center gap-2">
                        <span>{language.flag}</span>
                        <span className="text-sm">{language.name}</span>
                      </div>
                      {i18n.language === language.code && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
                <span className="hidden sm:inline">{t('common:logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}