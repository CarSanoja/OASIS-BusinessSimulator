import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Slider } from "./ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { apiService, type CustomSimulation } from "../services/api";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Settings, 
  Users, 
  Target, 
  Brain, 
  Sparkles,
  Plus,
  Trash2,
  Play,
  Save,
  Upload,
  User,
  Bot,
  Lightbulb,
  Eye,
  EyeOff,
  FileText,
  Zap,
  Info,
  HelpCircle,
  BookOpen,
  AlertCircle,
  Star,
  Clock,
  Globe,
  TrendingUp,
  Building2,
  BarChart3
} from "lucide-react";

interface CreatorViewProps {
  onBackToDashboard: () => void;
  onSimulationCreated: (simulation: CustomSimulation) => void;
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

const AVAILABLE_SKILLS = [
  "Negociación", "Liderazgo", "Comunicación Asertiva", "Pensamiento Estratégico",
  "Resolución de Conflictos", "Toma de Decisiones", "Gestión de Crisis", 
  "Presentaciones", "Coaching", "Delegación", "Innovación", "Análisis Financiero"
];

const DIFFICULTY_LEVELS = [
  { value: "Principiante", label: "Principiante", color: "bg-green-500", description: "Ideal para primeras experiencias" },
  { value: "Intermedio", label: "Intermedio", color: "bg-yellow-500", description: "Requiere experiencia previa" },
  { value: "Avanzado", label: "Avanzado", color: "bg-red-500", description: "Para profesionales experimentados" },
  { value: "Experto", label: "Experto", color: "bg-purple-500", description: "Máximo nivel de complejidad" }
];

const CATEGORIES = [
  { value: "Liderazgo Ejecutivo", icon: Users, color: "text-blue-600" },
  { value: "Estrategia Corporativa", icon: Building2, color: "text-purple-600" },
  { value: "Emprendimiento", icon: Lightbulb, color: "text-orange-600" },
  { value: "Estrategia Global", icon: Globe, color: "text-green-600" },
  { value: "Gestión de Talento", icon: TrendingUp, color: "text-pink-600" },
  { value: "Gobernanza Corporativa", icon: BarChart3, color: "text-indigo-600" }
];

export function CreatorView({ onBackToDashboard, onSimulationCreated }: CreatorViewProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showAiObjectives, setShowAiObjectives] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<Partial<CustomSimulation>>({
    title: "",
    description: "",
    category: "",
    difficulty: "",
    skills: [],
    userRole: "",
    aiRole: "",
    aiPersonality: {
      analytical: 50,
      patience: 50,
      aggression: 30,
      flexibility: 50
    },
    aiObjectives: [""],
    userObjectives: [""],
    endConditions: [""],
    knowledgeBase: "",
    isPublished: false
  });

  const totalSteps = 5;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkillToggle = (skill: string) => {
    const currentSkills = formData.skills || [];
    if (currentSkills.includes(skill)) {
      setFormData({
        ...formData,
        skills: currentSkills.filter(s => s !== skill)
      });
    } else {
      setFormData({
        ...formData,
        skills: [...currentSkills, skill]
      });
    }
  };

  const handlePersonalityChange = (trait: keyof typeof formData.aiPersonality, value: number[]) => {
    setFormData({
      ...formData,
      aiPersonality: {
        ...formData.aiPersonality!,
        [trait]: value[0]
      }
    });
  };

  const addListItem = (field: 'aiObjectives' | 'userObjectives' | 'endConditions') => {
    const currentList = formData[field] || [''];
    setFormData({
      ...formData,
      [field]: [...currentList, '']
    });
  };

  const updateListItem = (field: 'aiObjectives' | 'userObjectives' | 'endConditions', index: number, value: string) => {
    const currentList = formData[field] || [''];
    const newList = [...currentList];
    newList[index] = value;
    setFormData({
      ...formData,
      [field]: newList
    });
  };

  const removeListItem = (field: 'aiObjectives' | 'userObjectives' | 'endConditions', index: number) => {
    const currentList = formData[field] || [''];
    if (currentList.length > 1) {
      setFormData({
        ...formData,
        [field]: currentList.filter((_, i) => i !== index)
      });
    }
  };

  const handleSave = async (publish: boolean = false) => {
    try {
      const simulationData = {
        title: formData.title || "",
        description: formData.description || "",
        category: formData.category || "Personalizado",
        difficulty: formData.difficulty || "Intermedio",
        skills: formData.skills || [],
        user_role: formData.userRole || "",
        ai_role: formData.aiRole || "",
        ai_personality: formData.aiPersonality!,
        ai_objectives: formData.aiObjectives?.filter(obj => obj.trim() !== '') || [],
        user_objectives: formData.userObjectives?.filter(obj => obj.trim() !== '') || [],
        end_conditions: formData.endConditions?.filter(cond => cond.trim() !== '') || [],
        knowledge_base: formData.knowledgeBase,
        is_published: false // Always create as draft first
      };

      // Create simulation via API
      const createdSimulation = await apiService.createCustomSimulation(simulationData);
      
      // If publish is requested, publish it
      if (publish && createdSimulation.id) {
        await apiService.publishCustomSimulation(createdSimulation.id);
        createdSimulation.isPublished = true;
      }

      // Convert to expected format for parent component
      const simulation: CustomSimulation = {
        id: createdSimulation.id,
        title: createdSimulation.title,
        description: createdSimulation.description,
        category: createdSimulation.category,
        difficulty: createdSimulation.difficulty,
        skills: createdSimulation.skills,
        userRole: createdSimulation.user_role,
        aiRole: createdSimulation.ai_role,
        aiPersonality: createdSimulation.ai_personality,
        aiObjectives: createdSimulation.ai_objectives,
        userObjectives: createdSimulation.user_objectives,
        endConditions: createdSimulation.end_conditions,
        knowledgeBase: createdSimulation.knowledge_base,
        isPublished: createdSimulation.is_published,
        createdBy: createdSimulation.created_by_name || "Usuario Actual",
        createdAt: new Date(createdSimulation.created_at)
      };

      onSimulationCreated(simulation);
    } catch (error) {
      console.error('Error saving simulation:', error);
      alert('Error al guardar la simulación. Por favor, intenta de nuevo.');
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.description && formData.difficulty && (formData.skills?.length || 0) > 0;
      case 2:
        return formData.userRole && formData.aiRole;
      case 3:
        return (formData.aiObjectives?.some(obj => obj.trim() !== '') || false);
      case 4:
        return (formData.userObjectives?.some(obj => obj.trim() !== '') || false) && 
               (formData.endConditions?.some(cond => cond.trim() !== '') || false);
      case 5:
        return true;
      default:
        return false;
    }
  };

  const getStepInfo = (step: number) => {
    switch (step) {
      case 1:
        return {
          title: "Información General",
          description: "Define la identidad y contexto de tu simulación",
          icon: Sparkles,
          color: "from-blue-600 to-purple-600"
        };
      case 2:
        return {
          title: "Definición de Roles",
          description: "Establece los personajes y sus contextos",
          icon: Users,
          color: "from-purple-600 to-pink-600"
        };
      case 3:
        return {
          title: "Personalidad de la IA",
          description: "Diseña el comportamiento de tu contraparte",
          icon: Brain,
          color: "from-orange-600 to-red-600"
        };
      case 4:
        return {
          title: "Objetivos y Metas",
          description: "Define cómo se gana y cuándo termina",
          icon: Target,
          color: "from-green-600 to-emerald-600"
        };
      case 5:
        return {
          title: "Revisión Final",
          description: "Confirma y publica tu simulación",
          icon: CheckCircle2,
          color: "from-indigo-600 to-purple-600"
        };
      default:
        return {
          title: "Paso",
          description: "Descripción del paso",
          icon: Settings,
          color: "from-gray-600 to-gray-600"
        };
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            {/* Hero Card */}
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Información General</h2>
                    <p className="text-blue-100">Dale identidad única a tu simulación</p>
                  </div>
                </div>
                
                <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-300/30">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-200 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        <strong>Consejo:</strong> Piensa en una situación real de tu experiencia profesional. 
                        Las mejores simulaciones se basan en desafíos auténticos que has enfrentado o podrías enfrentar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Label className="font-semibold text-gray-900">Título del Escenario</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Sé específico y atractivo. Ej: "Negociación de Presupuesto con el CFO" mejor que "Reunión de trabajo"</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        value={formData.title || ""}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ej: Negociación de Presupuesto de Marketing Q1"
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                      {formData.title && formData.title.length < 10 && (
                        <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Considera un título más descriptivo
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Label className="font-semibold text-gray-900">Categoría del Escenario</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Selecciona la categoría que mejor represente el tipo de competencia que se desarrollará</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              <div className="flex items-center gap-2">
                                <category.icon className={`h-4 w-4 ${category.color}`} />
                                {category.value}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Label className="font-semibold text-gray-900">Nivel de Dificultad</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Considera la experiencia previa necesaria y la complejidad de las decisiones involucradas</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                        <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
                          <SelectValue placeholder="Selecciona la dificultad" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
                                <div>
                                  <div className="font-medium">{level.label}</div>
                                  <div className="text-xs text-gray-500">{level.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Label className="font-semibold text-gray-900">Descripción del Contexto</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Incluye el contexto empresarial, la situación específica y por qué es importante</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Textarea
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Tu empresa está considerando expandirse a nuevos mercados, pero el CFO tiene dudas sobre el ROI proyectado. Como Director de Marketing, necesitas presentar un caso convincente para asegurar el presupuesto de $500K..."
                        className="bg-gray-50 border-gray-200 focus:bg-white h-32 resize-none"
                      />
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          {formData.description?.length || 0}/500 caracteres
                        </p>
                        {formData.description && formData.description.length < 100 && (
                          <p className="text-xs text-amber-600">Agrega más contexto para mayor realismo</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Label className="font-semibold text-gray-900">Competencias a Desarrollar</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Selecciona 2-4 competencias principales que los participantes practicarán</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200">
                        {AVAILABLE_SKILLS.map((skill) => (
                          <div
                            key={skill}
                            onClick={() => handleSkillToggle(skill)}
                            className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                              formData.skills?.includes(skill)
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={formData.skills?.includes(skill) || false}
                                readOnly
                                className="border-current"
                              />
                              <span className="text-sm font-medium">{skill}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {(formData.skills?.length || 0) > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-semibold text-blue-900 mb-2">Competencias Seleccionadas:</h4>
                          <div className="flex flex-wrap gap-2">
                            {formData.skills?.map((skill) => (
                              <Badge
                                key={skill}
                                className="bg-blue-100 text-blue-800 border border-blue-300"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-900 mb-2">💡 Consejos para Crear Simulaciones Exitosas</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-emerald-800">
                    <div className="space-y-2">
                      <p><strong>Sé específico:</strong> "Reunión con CFO sobre presupuesto Q1" es mejor que "Reunión importante"</p>
                      <p><strong>Contexto real:</strong> Basa tu simulación en situaciones que realmente podrían ocurrir</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>Competencias claras:</strong> Selecciona 2-4 habilidades principales que se practicarán</p>
                      <p><strong>Dificultad apropiada:</strong> Considera la experiencia de quien la usará</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            {/* Hero Card */}
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Users className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Definición de Roles</h2>
                    <p className="text-purple-100">Establece los personajes y su contexto</p>
                  </div>
                </div>
                
                <div className="bg-purple-500/20 backdrop-blur-sm rounded-xl p-4 border border-purple-300/30">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-purple-200 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-purple-100 text-sm leading-relaxed">
                        <strong>Clave del éxito:</strong> Define claramente quién es cada personaje, su trasfondo, 
                        motivaciones y presiones. Cuanto más detallado, más realista será la simulación.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* User Role Card */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-emerald-900">Tu Rol</h3>
                        <p className="text-emerald-700 text-sm">Quien serás en la simulación</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-emerald-800 font-medium mb-2 block">Describe tu personaje y contexto</Label>
                        <Textarea
                          value={formData.userRole || ""}
                          onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
                          placeholder="Eres el Director de Marketing de una startup fintech con 6 meses en la empresa. Tienes experiencia previa en marketing digital pero es tu primera vez liderando presupuestos grandes. La empresa está creciendo 30% trimestral y necesitas demostrar que el marketing puede escalar al mismo ritmo..."
                          className="bg-white border-emerald-200 focus:border-emerald-400 h-40 resize-none"
                        />
                        <div className="flex justify-between mt-2">
                          <p className="text-xs text-emerald-600">
                            {formData.userRole?.length || 0}/600 caracteres
                          </p>
                          {formData.userRole && formData.userRole.length < 100 && (
                            <p className="text-xs text-amber-600">Agrega más trasfondo para mayor inmersión</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-emerald-200">
                        <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Elementos clave a incluir:
                        </h4>
                        <ul className="text-sm text-emerald-700 space-y-1">
                          <li>• Tu posición y experiencia</li>
                          <li>• Tiempo en la empresa/industria</li>
                          <li>• Presiones o objetivos específicos</li>
                          <li>• Contexto de la situación actual</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* AI Role Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-purple-900">Rol de la IA</h3>
                        <p className="text-purple-700 text-sm">Tu contraparte en la simulación</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-purple-800 font-medium mb-2 block">Describe el personaje de IA</Label>
                        <Textarea
                          value={formData.aiRole || ""}
                          onChange={(e) => setFormData({ ...formData, aiRole: e.target.value })}
                          placeholder="Soy Patricia Mendoza, CFO de la empresa desde hace 5 años. Tengo un MBA de Wharton y experiencia previa en consultoría financiera. Soy conocida por ser muy analítica y cuidadosa con el presupuesto. He visto muchas propuestas de marketing que prometían mucho y no cumplieron. Este trimestre tengo presión del CEO para reducir gastos en 15%..."
                          className="bg-white border-purple-200 focus:border-purple-400 h-40 resize-none"
                        />
                        <div className="flex justify-between mt-2">
                          <p className="text-xs text-purple-600">
                            {formData.aiRole?.length || 0}/600 caracteres
                          </p>
                          {formData.aiRole && formData.aiRole.length < 100 && (
                            <p className="text-xs text-amber-600">Agrega más personalidad y motivaciones</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          Haz que tu IA sea realista:
                        </h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                          <li>• Nombre y posición específica</li>
                          <li>• Trasfondo profesional relevante</li>
                          <li>• Personalidad y estilo de comunicación</li>
                          <li>• Presiones o motivaciones actuales</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-3">✨ Ejemplo de Roles Bien Definidos</h3>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-emerald-700 mb-2">Tu Rol (Ejemplo):</h4>
                      <p className="text-gray-700 leading-relaxed">
                        "Eres Ana García, Directora de Expansión en RetailMax. Tienes 8 años de experiencia en retail y 2 años en la empresa. 
                        El CEO te ha pedido presentar el plan de expansión a Brasil, pero necesitas $2M de presupuesto. 
                        La competencia ya está allí y cada mes de retraso significa perder market share."
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-purple-700 mb-2">Rol de IA (Ejemplo):</h4>
                      <p className="text-gray-700 leading-relaxed">
                        "Soy Carlos Ruiz, CFO con 12 años en la empresa. Soy conservador financieramente y he visto fallar 2 expansiones previas. 
                        Tengo presión de la junta para mantener el EBITDA above 15%. Necesito ver números sólidos y un plan de contingencia claro antes de aprobar inversiones grandes."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            {/* Hero Card */}
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Brain className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Personalidad de la IA</h2>
                    <p className="text-orange-100">Dale vida a tu contraparte digital</p>
                  </div>
                </div>
                
                <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-300/30">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-red-200 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-100 text-sm leading-relaxed">
                        <strong>La magia está en los detalles:</strong> Estos ajustes determinan cómo la IA responderá, 
                        negocia y reacciona. Una IA impaciente creará urgencia, una analítica pedirá más datos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Personality Sliders */}
                  <div className="space-y-8">
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Zap className="h-6 w-6 text-orange-500" />
                        Rasgos de Personalidad
                      </h3>
                      
                      <div className="space-y-8">
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <Label className="text-gray-800 font-medium">Estilo de Pensamiento</Label>
                              <p className="text-sm text-gray-600">Cómo procesa información y toma decisiones</p>
                            </div>
                            <Badge className={`${
                              formData.aiPersonality?.analytical! > 70 ? 'bg-blue-100 text-blue-800' :
                              formData.aiPersonality?.analytical! > 30 ? 'bg-purple-100 text-purple-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {formData.aiPersonality?.analytical! > 70 ? "Muy Analítico" : 
                               formData.aiPersonality?.analytical! > 30 ? "Balanceado" : "Muy Intuitivo"}
                            </Badge>
                          </div>
                          <Slider
                            value={[formData.aiPersonality?.analytical || 50]}
                            onValueChange={(value) => handlePersonalityChange('analytical', value)}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>🎨 Intuitivo</span>
                            <span>📊 Analítico</span>
                          </div>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">
                              {formData.aiPersonality?.analytical! > 70 ? 
                                "Pedirá datos, métricas y análisis detallados antes de decidir" :
                                formData.aiPersonality?.analytical! > 30 ?
                                "Combinará datos con intuición empresarial" :
                                "Tomará decisiones basadas en experiencia e intuición"
                              }
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <Label className="text-gray-800 font-medium">Nivel de Paciencia</Label>
                              <p className="text-sm text-gray-600">Tolerancia para discusiones largas</p>
                            </div>
                            <Badge className={`${
                              formData.aiPersonality?.patience! > 70 ? 'bg-green-100 text-green-800' :
                              formData.aiPersonality?.patience! > 30 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {formData.aiPersonality?.patience! > 70 ? "Muy Paciente" : 
                               formData.aiPersonality?.patience! > 30 ? "Moderado" : "Impaciente"}
                            </Badge>
                          </div>
                          <Slider
                            value={[formData.aiPersonality?.patience || 50]}
                            onValueChange={(value) => handlePersonalityChange('patience', value)}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>⚡ Impaciente</span>
                            <span>🕰️ Muy Paciente</span>
                          </div>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">
                              {formData.aiPersonality?.patience! > 70 ? 
                                "Escuchará con atención y dará tiempo para explicaciones detalladas" :
                                formData.aiPersonality?.patience! > 30 ?
                                "Balanceará escuchar con avanzar hacia decisiones" :
                                "Buscará respuestas rápidas y decisiones inmediatas"
                              }
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <Label className="text-gray-800 font-medium">Estilo de Confrontación</Label>
                              <p className="text-sm text-gray-600">Cómo maneja desacuerdos y objeciones</p>
                            </div>
                            <Badge className={`${
                              formData.aiPersonality?.aggression! > 70 ? 'bg-red-100 text-red-800' :
                              formData.aiPersonality?.aggression! > 30 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {formData.aiPersonality?.aggression! > 70 ? "Confrontativo" : 
                               formData.aiPersonality?.aggression! > 30 ? "Asertivo" : "Diplomático"}
                            </Badge>
                          </div>
                          <Slider
                            value={[formData.aiPersonality?.aggression || 30]}
                            onValueChange={(value) => handlePersonalityChange('aggression', value)}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>🤝 Diplomático</span>
                            <span>💥 Confrontativo</span>
                          </div>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">
                              {formData.aiPersonality?.aggression! > 70 ? 
                                "Cuestionará directamente y presionará por respuestas específicas" :
                                formData.aiPersonality?.aggression! > 30 ?
                                "Planteará objeciones de manera directa pero profesional" :
                                "Expresará dudas de forma sutil y constructiva"
                              }
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <Label className="text-gray-800 font-medium">Flexibilidad Mental</Label>
                              <p className="text-sm text-gray-600">Apertura a cambiar de opinión</p>
                            </div>
                            <Badge className={`${
                              formData.aiPersonality?.flexibility! > 70 ? 'bg-green-100 text-green-800' :
                              formData.aiPersonality?.flexibility! > 30 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {formData.aiPersonality?.flexibility! > 70 ? "Muy Flexible" : 
                               formData.aiPersonality?.flexibility! > 30 ? "Moderado" : "Rígido"}
                            </Badge>
                          </div>
                          <Slider
                            value={[formData.aiPersonality?.flexibility || 50]}
                            onValueChange={(value) => handlePersonalityChange('flexibility', value)}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>🔒 Rígido</span>
                            <span>🌊 Muy Flexible</span>
                          </div>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">
                              {formData.aiPersonality?.flexibility! > 70 ? 
                                "Estará abierto a nuevas ideas y cambiará de posición con buenos argumentos" :
                                formData.aiPersonality?.flexibility! > 30 ?
                                "Considerará alternativas pero mantendrá cierta firmeza inicial" :
                                "Se mantendrá firme en su posición inicial y resistirá cambios"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Objectives & Knowledge Base */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-red-900 flex items-center gap-2">
                          <Target className="h-6 w-6 text-red-600" />
                          Objetivos Ocultos de la IA
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAiObjectives(!showAiObjectives)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100"
                        >
                          {showAiObjectives ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      <div className="mb-4 p-4 bg-white rounded-lg border border-red-200">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-red-800 leading-relaxed">
                              <strong>¿Qué son los objetivos ocultos?</strong> Son las verdaderas motivaciones de la IA, 
                              sus "agenda secreta" que guiará su comportamiento. Por ejemplo: "Reducir el presupuesto en 20%" 
                              o "Evitar comprometerse sin ver datos de ROI".
                            </p>
                          </div>
                        </div>
                      </div>

                      {showAiObjectives && (
                        <div className="space-y-3">
                          {formData.aiObjectives?.map((objective, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={objective}
                                onChange={(e) => updateListItem('aiObjectives', index, e.target.value)}
                                placeholder="Ej: Reducir el presupuesto solicitado en al menos 30% para cumplir directiva del CEO"
                                className="bg-white border-red-200 focus:border-red-400"
                              />
                              {formData.aiObjectives!.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeListItem('aiObjectives', index)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addListItem('aiObjectives')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Objetivo Oculto
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                      <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" />
                        Base de Conocimiento (Opcional)
                      </h3>
                      
                      <div className="mb-4 p-4 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-blue-800 leading-relaxed mb-2">
                              <strong>Información específica que la IA debe conocer:</strong>
                            </p>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li>• Datos financieros específicos de la empresa</li>
                              <li>• Historia de proyectos anteriores</li>
                              <li>• Políticas internas o restricciones</li>
                              <li>• Contexto de mercado o competencia</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <Textarea
                        value={formData.knowledgeBase || ""}
                        onChange={(e) => setFormData({ ...formData, knowledgeBase: e.target.value })}
                        placeholder="La empresa tuvo una caída de ventas del 15% el trimestre pasado. El presupuesto total de marketing es $500K anuales y ya se gastó 60%. Los competidores principales (CompetitorA y CompetitorB) están invirtiendo fuertemente en digital. El CEO estableció que cualquier inversión >$100K debe mostrar ROI en 6 meses..."
                        className="bg-white border-blue-200 focus:border-blue-400 h-32 resize-none"
                      />
                      <p className="text-xs text-blue-600 mt-2">
                        {formData.knowledgeBase?.length || 0}/800 caracteres
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            {/* Hero Card */}
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Target className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Objetivos y Metas</h2>
                    <p className="text-green-100">Define cómo se gana y cuándo termina</p>
                  </div>
                </div>
                
                <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-300/30">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-green-200 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-green-100 text-sm leading-relaxed">
                        <strong>El momento de la verdad:</strong> Los objetivos claros dan propósito a la simulación, 
                        mientras que las condiciones de finalización crean tensión y momentum. Piensa en múltiples formas de "ganar".
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* User Objectives */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      Objetivos del Usuario
                    </h3>
                    
                    <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-green-800 leading-relaxed mb-2">
                            <strong>¿Qué debe lograr el participante para tener éxito?</strong>
                          </p>
                          <ul className="text-sm text-green-700 space-y-1">
                            <li>• Sé específico y medible cuando sea posible</li>
                            <li>• Incluye objetivos primarios y secundarios</li>
                            <li>• Considera diferentes niveles de éxito</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {formData.userObjectives?.map((objective, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={objective}
                              onChange={(e) => updateListItem('userObjectives', index, e.target.value)}
                              placeholder="Ej: Conseguir aprobación de al menos $50K para la campaña de Q1"
                              className="bg-white border-green-200 focus:border-green-400"
                            />
                            {formData.userObjectives!.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeListItem('userObjectives', index)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {objective && objective.length < 20 && (
                            <p className="text-xs text-amber-600 ml-2">Sé más específico sobre qué constituye éxito</p>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addListItem('userObjectives')}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Objetivo
                      </Button>
                    </div>

                    <div className="mt-6 bg-white rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Ejemplos de buenos objetivos:
                      </h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• "Obtener aprobación de $75K del presupuesto solicitado"</li>
                        <li>• "Conseguir compromiso para piloto de 3 meses"</li>
                        <li>• "Identificar y abordar al menos 3 objeciones principales"</li>
                        <li>• "Establecer métricas de éxito claras y timeline"</li>
                      </ul>
                    </div>
                  </div>

                  {/* End Conditions */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                    <h3 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2">
                      <Clock className="h-6 w-6 text-yellow-600" />
                      Condiciones de Finalización
                    </h3>
                    
                    <div className="mb-4 p-4 bg-white rounded-lg border border-yellow-200">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-yellow-800 leading-relaxed mb-2">
                            <strong>¿Qué eventos terminan la simulación?</strong>
                          </p>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Acuerdos alcanzados (éxito total)</li>
                            <li>• Compromisos parciales (éxito parcial)</li>
                            <li>• Estancamientos o rechazos (reintento)</li>
                            <li>• Límites de tiempo o escalación</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {formData.endConditions?.map((condition, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={condition}
                              onChange={(e) => updateListItem('endConditions', index, e.target.value)}
                              placeholder="Ej: Se llega a un acuerdo específico sobre presupuesto y timeline"
                              className="bg-white border-yellow-200 focus:border-yellow-400"
                            />
                            {formData.endConditions!.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeListItem('endConditions', index)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {condition && condition.length < 15 && (
                            <p className="text-xs text-amber-600 ml-2">Describe más específicamente cuándo termina</p>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addListItem('endConditions')}
                        className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Condición
                      </Button>
                    </div>

                    <div className="mt-6 bg-white rounded-lg p-4 border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Ejemplos de condiciones claras:
                      </h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• "CFO aprueba presupuesto completo y firma acuerdo"</li>
                        <li>• "Se acuerda piloto con 50% del presupuesto inicial"</li>
                        <li>• "CFO solicita más información y agenda nueva reunión"</li>
                        <li>• "Después de 3 rondas de objeciones sin acuerdo"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Practices Card */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-900 mb-3">🎯 Mejores Prácticas para Objetivos Efectivos</h3>
                  <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div className="bg-white rounded-lg p-4 border border-indigo-200">
                      <h4 className="font-semibold text-green-700 mb-2">✅ Objetivos SMART</h4>
                      <p className="text-gray-700">Específicos, Medibles, Alcanzables, Relevantes y con Tiempo definido. "Conseguir $50K en 2 reuniones" mejor que "conseguir dinero".</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-indigo-200">
                      <h4 className="font-semibold text-blue-700 mb-2">🎭 Múltiples Finales</h4>
                      <p className="text-gray-700">Considera diferentes tipos de éxito: total, parcial, o "reintento con más información". No todo es blanco o negro.</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-indigo-200">
                      <h4 className="font-semibold text-purple-700 mb-2">🌟 Realismo</h4>
                      <p className="text-gray-700">Basa objetivos en resultados que realmente podrían ocurrir en situaciones empresariales reales.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            {/* Hero Card */}
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">¡Tu Simulación Está Lista!</h2>
                    <p className="text-indigo-100">Revisa y publica tu experiencia de aprendizaje</p>
                  </div>
                </div>
                
                <div className="bg-indigo-500/20 backdrop-blur-sm rounded-xl p-4 border border-indigo-300/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-indigo-200 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-indigo-100 text-sm leading-relaxed">
                        <strong>¡Felicitaciones!</strong> Has creado una simulación completa. Revisa los detalles y 
                        decide si quieres guardarla como borrador para ajustes futuros o publicarla inmediatamente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Summary */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Resumen de tu Simulación</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 font-medium">Título:</span>
                          <span className="text-gray-900 font-semibold text-right max-w-xs">{formData.title}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 font-medium">Categoría:</span>
                          <span className="text-gray-900 font-semibold">{formData.category}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Dificultad:</span>
                          <Badge className={`${
                            formData.difficulty === 'Principiante' ? 'bg-green-500/20 text-green-700 border-green-300' :
                            formData.difficulty === 'Intermedio' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-300' :
                            formData.difficulty === 'Avanzado' ? 'bg-red-500/20 text-red-700 border-red-300' :
                            'bg-purple-500/20 text-purple-700 border-purple-300'
                          }`}>
                            {formData.difficulty}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium block mb-2">Competencias:</span>
                          <div className="flex flex-wrap gap-2">
                            {formData.skills?.map((skill) => (
                              <Badge key={skill} className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                      <h3 className="text-xl font-bold text-green-900 mb-4">🎯 Objetivos del Usuario</h3>
                      <div className="space-y-3">
                        {formData.userObjectives?.filter(obj => obj.trim() !== '').map((objective, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-green-800 leading-relaxed">{objective}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                      <h3 className="text-xl font-bold text-yellow-900 mb-4">⏰ Condiciones de Finalización</h3>
                      <div className="space-y-3">
                        {formData.endConditions?.filter(cond => cond.trim() !== '').map((condition, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-yellow-800 leading-relaxed">{condition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Personality & Actions */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                      <h3 className="text-xl font-bold text-purple-900 mb-4">🤖 Personalidad de la IA</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <div className="text-center">
                              <div className="text-sm text-purple-600 font-medium">Estilo</div>
                              <div className="text-lg font-bold text-purple-800">
                                {formData.aiPersonality?.analytical! > 50 ? "Analítico" : "Intuitivo"}
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <div className="text-center">
                              <div className="text-sm text-purple-600 font-medium">Paciencia</div>
                              <div className="text-lg font-bold text-purple-800">
                                {formData.aiPersonality?.patience! > 70 ? "Alta" : 
                                 formData.aiPersonality?.patience! > 30 ? "Media" : "Baja"}
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <div className="text-center">
                              <div className="text-sm text-purple-600 font-medium">Confrontación</div>
                              <div className="text-lg font-bold text-purple-800">
                                {formData.aiPersonality?.aggression! > 70 ? "Alta" : 
                                 formData.aiPersonality?.aggression! > 30 ? "Media" : "Baja"}
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <div className="text-center">
                              <div className="text-sm text-purple-600 font-medium">Flexibilidad</div>
                              <div className="text-lg font-bold text-purple-800">
                                {formData.aiPersonality?.flexibility! > 70 ? "Alta" : 
                                 formData.aiPersonality?.flexibility! > 30 ? "Media" : "Baja"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                      <h3 className="text-xl font-bold text-blue-900 mb-4">🚀 Acciones Finales</h3>
                      <div className="space-y-4">
                        <Button
                          onClick={() => handleSave(false)}
                          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white h-12"
                        >
                          <Save className="h-5 w-5 mr-2" />
                          Guardar como Borrador
                        </Button>
                        <Button
                          onClick={() => handleSave(true)}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white h-12"
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          Publicar Simulación
                        </Button>
                        <Button
                          onClick={() => {/* TODO: Implementar test */}}
                          variant="outline"
                          className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 h-12"
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Probar Primero
                        </Button>
                      </div>

                      <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-blue-800 leading-relaxed">
                              <strong>¿Borrador o Publicado?</strong><br />
                              • <strong>Borrador:</strong> Solo tú puedes verla y modificarla<br />
                              • <strong>Publicado:</strong> Otros usuarios pueden descubrirla y usarla
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Congratulations Card */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-900 mb-3">🎉 ¡Felicitaciones por Crear tu Primera Simulación!</h3>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-emerald-800 leading-relaxed mb-3">
                        Has completado exitosamente la creación de una simulación personalizada. Tu experiencia de aprendizaje está lista para:
                      </p>
                      <ul className="text-emerald-700 space-y-1">
                        <li>• ✅ Desarrollar competencias específicas</li>
                        <li>• ✅ Practicar situaciones reales</li>
                        <li>• ✅ Recibir feedback inmediato de la IA</li>
                        <li>• ✅ Iterar y mejorar habilidades</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-emerald-800 leading-relaxed mb-3">
                        <strong>Próximos pasos recomendados:</strong>
                      </p>
                      <ul className="text-emerald-700 space-y-1">
                        <li>• 🧪 Prueba tu simulación primero</li>
                        <li>• 📝 Ajusta basado en la experiencia</li>
                        <li>• 🌍 Comparte con tu equipo</li>
                        <li>• 📊 Revisa el impacto en el aprendizaje</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepInfo = getStepInfo(currentStep);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onBackToDashboard}
                  className="border border-gray-200 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stepInfo.color} rounded-xl flex items-center justify-center`}>
                    <stepInfo.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Constructor de Simulaciones</h1>
                    <p className="text-gray-600 text-sm">{stepInfo.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-gray-600 text-sm mb-1">Paso {currentStep} de {totalSteps}</div>
                  <div className="w-48">
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {renderStep()}
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t border-gray-200 sticky bottom-0">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="border-gray-200 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i + 1 === currentStep
                        ? `bg-gradient-to-r ${stepInfo.color} w-8`
                        : i + 1 < currentStep
                        ? 'bg-green-400'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <div className="w-24" /> // Spacer for layout balance
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}