import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  TrendingUp,
  Clock,
  ChevronRight,
  Shield,
  Layers,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Play,
  Pause,
  DollarSign,
  Brain,
  Monitor,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { authStore } from '@/store/authStore';
import { api } from '@shared/services/api';
import { Button } from '@shared/components/Button';
import { toastStore } from '@/store/toastStore';
import { getCurrencySymbol } from '@shared/lib/currency';
import { Modal } from '@shared/components/Modal';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = authStore();
  const { showToast } = toastStore();
  const [isAnnual, setIsAnnual] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Gateway Modal triggers
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<'freelancer' | 'pro' | 'business' | null>(null);

  // Interactive Simulator States
  const [complexity, setComplexity] = useState<'low' | 'medium' | 'high'>('medium');
  const [pauses, setPauses] = useState<number>(15);
  const [runs, setRuns] = useState<number>(5);

  // Demo Carousel tab state
  const [activeTab, setActiveTab] = useState<'commandCenter' | 'timer' | 'financial' | 'ai'>('commandCenter');

  // Simulated Timer State
  const [simTimerRunning, setSimTimerRunning] = useState(true);
  const [simTimerSeconds, setSimTimerSeconds] = useState(3845); // 01:04:05

  useEffect(() => {
    let interval: any;
    if (simTimerRunning) {
      interval = setInterval(() => {
        setSimTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [simTimerRunning]);

  const formatSimTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const handleStartFree = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleBuyPlan = async (plan: 'freelancer' | 'pro' | 'business', gateway: 'stripe' | 'mercadopago' | 'mobbex') => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    setBillingLoading(true);
    try {
      const endpoint = gateway === 'stripe' 
        ? '/billing/checkout' 
        : gateway === 'mercadopago' 
          ? '/billing/mercadopago/checkout' 
          : '/billing/mobbex/checkout';

      const data = await api.post(endpoint, { plan });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      showToast(e.message || 'Error al iniciar la facturación.', 'error');
    } finally {
      setBillingLoading(false);
    }
  };

  // Dynamic Estimation Calculation Logic representing our Weighted EMA algorithm
  const calculateEstimate = () => {
    const baseHours = 8.5;
    const complexityMultiplier = complexity === 'low' ? 0.75 : complexity === 'medium' ? 1.0 : 1.45;
    
    // Efficiency increases with iterations (up to 30% reduction in hours)
    const learningCurveFactor = Math.max(0.7, 1 - (runs - 1) * 0.022);
    
    const calculatedWorkHours = baseHours * complexityMultiplier * learningCurveFactor;
    const calculatedPauseHours = pauses / 60;
    const finalTotalHours = calculatedWorkHours + calculatedPauseHours;

    let confidence = 'Bajo';
    let confidenceColor = 'text-amber-400 bg-amber-400/5 border-amber-400/10';
    if (runs >= 5 && runs < 12) {
      confidence = 'Medio';
      confidenceColor = 'text-indigo-400 bg-indigo-400/5 border-indigo-400/10';
    } else if (runs >= 12) {
      confidence = 'Alto';
      confidenceColor = 'text-emerald-400 bg-emerald-400/5 border-emerald-400/10';
    }

    const estimatedMinutes = Math.round((finalTotalHours - Math.floor(finalTotalHours)) * 60);

    return {
      hours: Math.floor(finalTotalHours),
      minutes: estimatedMinutes === 60 ? 59 : estimatedMinutes,
      confidence,
      confidenceColor,
      deviation: Math.max(2, Math.round(18 - (runs * 0.8)))
    };
  };

  const simResult = calculateEstimate();

  const faqItems = [
    {
      q: '¿Qué sucede al finalizar los 7 días de prueba gratis?',
      a: 'Una vez transcurridos los 7 días, tu acceso al sistema se pausará temporalmente y serás redirigido a la sección de selección de planes para suscribirte. Tus proyectos, tareas u hojas de horas no se perderán; todo se mantendrá seguro y volverá a estar disponible en el momento en que abones tu suscripción.',
    },
    {
      q: '¿Cómo funciona la estimación inteligente de proyectos?',
      a: 'TimeFlow no utiliza un promedio matemático simple. Aplica un algoritmo de promedio móvil ponderado (EMA) sobre tus ejecuciones anteriores de tareas similares. Esto significa que si mejoras tu velocidad o automatizas parte de tu flujo, las estimaciones futuras de proyectos se adaptarán automáticamente a tu ritmo de trabajo actual.',
    },
    {
      q: '¿Qué métodos de pago puedo utilizar para suscribirme?',
      a: 'Ofrecemos opciones seguras según tu ubicación. Si estás en Argentina, puedes utilizar Mercado Pago (con saldo, débito, crédito local o Rapipago/Pago Fácil) y Mobbex (tarjetas de crédito locales y planes de cuotas). Para el resto del mundo, procesamos pagos de forma segura en dólares mediante tarjetas internacionales con Stripe.',
    },
    {
      q: '¿Qué mide el "Nivel de Confianza"?',
      a: 'Calcula la desviación estándar de tus ejecuciones. Si tus tiempos dedicados a tareas recurrentes varían poco, el nivel de confianza será "Alto". Si los tiempos son muy volátiles o tienes menos de 5 sesiones grabadas para esa tarea, el nivel será "Bajo", indicando que requieres registrar más sesiones para tener una estimación exacta.',
    },
    {
      q: '¿Puedo cambiar de plan o cancelar en cualquier momento?',
      a: 'Sí, puedes hacer un upgrade, downgrade o cancelar tu suscripción en cualquier momento desde la sección de Configuración de tu Perfil. Si cancelas tu suscripción, mantendrás el acceso a tu plan actual hasta que finalice tu período de facturación mensual contratado.',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-150 select-text overflow-y-auto font-sans leading-relaxed">
      {/* Glow Ambient Circles */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header / Navbar */}
      <nav className="h-20 border-b border-zinc-900/60 backdrop-blur-md sticky top-0 bg-zinc-950/80 flex items-center justify-between px-8 z-50 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-purple flex items-center justify-center shadow-lg shadow-brand-purple/20">
            <Zap className="w-4 h-4 text-white fill-white/10" />
          </div>
          <span className="font-bold text-lg text-zinc-100 tracking-tight font-display">
            TimeFlow
          </span>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <a
            href="#features"
            className="hidden md:inline text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Características
          </a>
          <a
            href="#pricing"
            className="hidden md:inline text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Precios
          </a>
          <a
            href="#faq"
            className="hidden md:inline text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Preguntas
          </a>
          <span className="hidden md:inline h-4 w-px bg-zinc-800" />
          {isAuthenticated ? (
            <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
              Ir a la App
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Ingresar
              </button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Registrarse
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-24 text-center max-w-6xl mx-auto flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 border border-brand-purple/25 text-brand-purple text-[10px] font-bold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          PRODUCTIVITY INTELLIGENCE SUITE
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-zinc-100 font-display leading-[1.1] tracking-tight max-w-4xl mb-6">
          Deja de adivinar tus tiempos. <br />
          <span className="bg-gradient-to-r from-brand-purple via-indigo-400 to-pink-500 bg-clip-text text-transparent">
            Estima con precisión matemática.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-zinc-400 text-base md:text-lg max-w-2xl leading-relaxed mb-10">
          TimeFlow es el gestor inteligente de tiempos y finanzas que aprende de tu productividad histórica. Estimación automática de proyectos, cronómetro Picture-in-Picture y coach de IA para freelancers.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-16">
          <Button size="lg" onClick={handleStartFree} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Comenzar Gratis
          </Button>
          <a href="#features">
            <Button variant="secondary" size="lg">
              Ver Características
            </Button>
          </a>
        </div>

        {/* 🎯 SIMULADOR INTERACTIVO DE ESTIMACIONES */}
        <div className="w-full max-w-4xl rounded-3xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-purple via-indigo-500 to-pink-500" />
          
          <div className="text-left mb-6 border-b border-zinc-800/60 pb-4">
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Brain className="w-4 h-4 text-brand-purple" />
              Simulador del Algoritmo Ponderado de IA
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">
              Prueba cómo TimeFlow analiza tu historial de tareas para estimar la duración del proyecto automáticamente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Controles Sliders */}
            <div className="flex flex-col gap-6 text-left">
              {/* Complejidad */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-400">Complejidad del Trabajo</span>
                  <span className="font-bold text-brand-purple uppercase">{complexity === 'low' ? 'Baja' : complexity === 'medium' ? 'Media' : 'Alta'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['low', 'medium', 'high'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setComplexity(c)}
                      className={`py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        complexity === c
                          ? 'bg-brand-purple/10 border-brand-purple text-brand-purple'
                          : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-800 text-zinc-450'
                      }`}
                    >
                      {c === 'low' ? 'Baja' : c === 'medium' ? 'Media' : 'Alta'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Historial de Tareas */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-400">Ejecuciones de Tareas Grabadas</span>
                  <span className="font-bold text-zinc-200">{runs} {runs === 1 ? 'iteración' : 'iteraciones'}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={runs}
                  onChange={(e) => setRuns(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-brand-purple"
                />
                <span className="text-[9px] text-zinc-500">A más iteraciones grabadas, mayor es la precisión y menor la desviación.</span>
              </div>

              {/* Pausas */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-400">Pausas Promedio Estimadas</span>
                  <span className="font-bold text-zinc-200">{pauses} minutos</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={pauses}
                  onChange={(e) => setPauses(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-brand-purple"
                />
              </div>
            </div>

            {/* Resultado Visual */}
            <div className="bg-zinc-950 border border-zinc-850/80 p-6 rounded-2xl flex flex-col gap-6 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/5 rounded-full blur-2xl" />
              
              <div>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Tiempo Estimado por IA</span>
                <span className="text-3xl font-black text-zinc-100 font-display mt-1 block">
                  {simResult.hours}h {simResult.minutes}m
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/40">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block">Nivel de Confianza</span>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-1.5 ${simResult.confidenceColor}`}>
                    {simResult.confidence}
                  </span>
                </div>
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/40">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block">Desviación Máxima</span>
                  <span className="text-xs font-bold text-zinc-300 mt-2 block">
                    ± {simResult.deviation} min
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-[10px] text-emerald-400/90 font-medium bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Precisión del algoritmo de aprendizaje calculada sobre {runs} muestras.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 TABBED SHOWCASE CAROUSEL SECTION */}
      <section className="bg-zinc-950/40 border-t border-b border-zinc-900 py-24 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-brand-purple uppercase tracking-widest">Descubre la Experiencia</span>
            <h2 className="text-3xl font-extrabold text-zinc-100 font-display mt-2 mb-4">
              Explora los módulos de TimeFlow
            </h2>
            <p className="text-zinc-500 text-xs max-w-md mx-auto">
              Haz clic en las pestañas para ver cómo se estructuran y visualizan los módulos principales dentro de la suite.
            </p>
          </div>

          {/* Tabs Selector */}
          <div className="flex gap-2 flex-wrap justify-center bg-zinc-900 border border-zinc-850 p-1.5 rounded-2xl mb-10 max-w-xl">
            {(['commandCenter', 'timer', 'financial', 'ai'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-zinc-800 text-zinc-100 shadow-lg'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab === 'commandCenter' && 'Command Center'}
                {tab === 'timer' && 'Mini PiP Timer'}
                {tab === 'financial' && 'Finanzas'}
                {tab === 'ai' && 'Coach IA'}
              </button>
            ))}
          </div>

          {/* Active Tab Screen Render */}
          <div className="w-full max-w-4xl border border-zinc-850 bg-zinc-950/80 rounded-3xl p-6 relative overflow-hidden shadow-2xl min-h-[380px] flex items-center justify-center">
            {activeTab === 'commandCenter' && (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left">
                <div className="flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple flex items-center justify-center">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-200">Command Center consolidado</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Un centro de comando diseñado para no parpadear ni saturar. Reúne en un único panel la meta del día, los clientes más valiosos, alertas críticas de desvíos y sugerencias inteligentes de tareas prioritarias.
                  </p>
                  <ul className="flex flex-col gap-2 text-[11px] text-zinc-400 font-medium">
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-purple" /> Resumen inmediato Hoy vs Semana vs Mes</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-purple" /> Panel de alertas críticas automatizadas</li>
                  </ul>
                </div>
                {/* Visual Widget representation */}
                <div className="bg-zinc-900 border border-zinc-800/80 p-6 rounded-2xl flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Objetivo de Hoy</span>
                    <span className="text-xs text-brand-purple font-bold">92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase">Ingresos</span>
                      <span className="text-lg font-extrabold text-zinc-200">$184.00 USD</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase">Meta</span>
                      <span className="text-xs font-semibold text-zinc-400">$200.00 USD</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-850">
                    <div className="h-full bg-brand-purple rounded-full w-[92%]" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timer' && (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left">
                <div className="flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-200">Mini Temporizador Picture-in-Picture</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Soporte nativo para la API Document Picture-in-Picture de HTML5. Abre una píldora flotante persistente sobre el escritorio de tu sistema operativo con accesos rápidos por teclado para pausar y reanudar el cronómetro sin perder el foco.
                  </p>
                  <ul className="flex flex-col gap-2 text-[11px] text-zinc-400 font-medium">
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-purple" /> Control de pausas nativo en pantalla</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-purple" /> Shortcuts: Barra espaciadora para Pausa</li>
                  </ul>
                </div>
                {/* Visual Widget representation */}
                <div className="flex justify-center">
                  <div className="bg-zinc-900 border border-brand-purple/30 p-5 rounded-2xl w-60 shadow-xl shadow-brand-purple/5 flex flex-col items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-brand-purple text-white text-[7px] font-extrabold uppercase px-2 py-0.5 rounded-bl-lg tracking-widest">PiP Mode</div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Session Activa</span>
                    <span className="text-2xl font-black text-zinc-200 font-mono tracking-wider">{formatSimTime(simTimerSeconds)}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSimTimerRunning(!simTimerRunning)}
                        className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-450 hover:text-zinc-200 flex items-center justify-center cursor-pointer transition-all"
                      >
                        {simTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left">
                <div className="flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-200">Facturación & Control Contable</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Administra tus ingresos y egresos de forma automática. Crea facturas profesionales en PDF vinculando las sesiones de horas trackeadas de tus clientes y agrega pasarelas de pago Stripe con control de cuotas para planes SaaS.
                  </p>
                  <ul className="flex flex-col gap-2 text-[11px] text-zinc-400 font-medium">
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-purple" /> Exportaciones en PDF, CSV y Excel</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-purple" /> Importación de sesiones con un clic</li>
                  </ul>
                </div>
                {/* Visual Widget representation */}
                <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs border-b border-zinc-850 pb-2.5">
                    <span className="font-bold text-zinc-350">Factura #INV-0042</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Pagada</span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs text-zinc-400">
                    <div className="flex justify-between">
                      <span>Cliente:</span>
                      <span className="font-semibold text-zinc-300">Google Inc</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Horas Importadas:</span>
                      <span className="font-semibold text-zinc-300">14h 30m</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-zinc-850 font-bold text-zinc-200">
                      <span>Total Neto:</span>
                      <span>$580.00 USD</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left">
                <div className="flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple flex items-center justify-center">
                    <Brain className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-200">Coach de Productividad IA</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Un business coach privado impulsado por modelos avanzados (Gemini / Claude). Analiza tus desvíos de presupuesto en tiempo real, te ofrece sugerencias motivacionales cada mañana y te permite buscar datos usando lenguaje natural.
                  </p>
                  <ul className="flex flex-col gap-2 text-[11px] text-zinc-400 font-medium">
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-purple" /> Daily Briefing inteligente matutino</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-brand-purple" /> Alertas tempranas de riesgos de desvíos</li>
                  </ul>
                </div>
                {/* Visual Widget representation */}
                <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Consejo del Coach</span>
                  <p className="text-xs text-zinc-300 italic leading-relaxed">
                    "Detecté un aumento del 18% en tus pausas del proyecto Rediseño UI después de las 4 PM. Te sugiero programar tus tareas de alta complejidad por la mañana para optimizar tu rendimiento."
                  </p>
                  <span className="text-[10px] text-brand-purple font-semibold text-right block mt-2">• TimeFlow Coach</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Problem vs Solution */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-semibold text-brand-purple uppercase tracking-widest">El Dolor de Presupuestar</span>
            <h2 className="text-3xl font-extrabold text-zinc-100 font-display mt-2 mb-6">
              ¿Por qué tus estimaciones siempre se quedan cortas?
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Estimar proyectos basándote en la "intuición" o en un promedio simple es la principal causa de retrasos, presupuestos superados y pérdidas de dinero. Cada jornada es distinta, pero las tareas repetitivas muestran patrones claros.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-rose-500">✕</span>
                </div>
                <p className="text-xs font-medium text-zinc-400">
                  <strong className="text-zinc-200">Suposiciones subjetivas:</strong> Creer que maquetar una vista toma 2 horas porque "es fácil".
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-rose-500">✕</span>
                </div>
                <p className="text-xs font-medium text-zinc-400">
                  <strong className="text-zinc-200">Ignorar pausas e imprevistos:</strong> No contabilizar llamadas de soporte o tiempos de compilación.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 purple-glow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/10 rounded-full blur-[40px] pointer-events-none" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">La Solución TimeFlow</span>
            <h3 className="text-xl font-bold text-zinc-100 mt-2 mb-6">
              Promedio Móvil Ponderado & Medición Histórica
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed mb-6">
              TimeFlow integra un cronómetro profesional que registra cada ejecución. Al final de cada sesión, el algoritmo analiza la desviación estándar y ajusta el promedio móvil. Los registros más recientes tienen mayor relevancia, adaptándose a tu velocidad real.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center mt-4">
              <div className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-2xl">
                <TrendingUp className="w-5 h-5 text-brand-purple mx-auto mb-2" />
                <span className="text-[9px] text-zinc-500 font-semibold block uppercase">Cálculo</span>
                <span className="text-xs font-bold text-zinc-200">Ponderado</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-2xl">
                <Clock className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <span className="text-[9px] text-zinc-500 font-semibold block uppercase">Detección</span>
                <span className="text-xs font-bold text-zinc-200">Pausas</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-2xl">
                <Shield className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <span className="text-[9px] text-zinc-500 font-semibold block uppercase">Nivel</span>
                <span className="text-xs font-bold text-zinc-200">Confianza</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-brand-purple uppercase tracking-widest font-display">Planes de Suscripción</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-100 font-display mt-2 mb-4">
            Elige el plan ideal para tu negocio
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto mb-2">
            Todos los registros nuevos incluyen un **período de prueba completo gratis por 7 días**.
          </p>
          <p className="text-zinc-500 text-xs max-w-xl mx-auto mb-8">
            Si estás fuera de Argentina, se cobrará el equivalente en dólares ($15 / $25 / $45 USD) a través de Stripe.
          </p>

          {/* Pricing Toggle */}
          <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-850 p-1 rounded-full">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                !isAnnual ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Facturación Mensual
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isAnnual ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Facturación Anual
              <span className="bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {/* Freelancer Tier */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 flex flex-col justify-between hover:border-zinc-700/60 transition-all text-left">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-zinc-300">Freelancer</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Plan Básico</span>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-zinc-100 font-display">
                  {isAnnual ? '$12,000' : '$15,000'}
                </span>
                <span className="text-xs text-zinc-500 font-medium"> ARS / mes</span>
                <span className="text-[10px] text-zinc-500 block mt-1">Facturado {isAnnual ? 'anual' : 'mensual'}</span>
              </div>
              <ul className="flex flex-col gap-4 text-xs font-medium text-zinc-400 border-t border-zinc-800/80 pt-6 mb-8">
                <li className="flex items-center gap-2.5">
                  <ChevronRight className="w-4 h-4 text-brand-purple flex-shrink-0" />
                  Hasta 3 proyectos activos
                </li>
                <li className="flex items-center gap-2.5">
                  <ChevronRight className="w-4 h-4 text-brand-purple flex-shrink-0" />
                  Hasta 15 tareas registradas
                </li>
                <li className="flex items-center gap-2.5">
                  <ChevronRight className="w-4 h-4 text-brand-purple flex-shrink-0" />
                  Promedio matemático simple
                </li>
                <li className="flex items-center gap-2.5 text-zinc-650 line-through">
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  Conversión y selector de monedas
                </li>
                <li className="flex items-center gap-2.5 text-zinc-650 line-through">
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  Exportaciones e Inteligencia Coach IA
                </li>
              </ul>
            </div>
            <Button 
              variant="secondary" 
              className="w-full" 
              isLoading={billingLoading}
              onClick={() => {
                if (user?.subscriptionPlan === 'freelancer' && user?.subscriptionStatus === 'active') {
                  navigate('/dashboard');
                } else {
                  handleBuyPlan('freelancer', 'mercadopago');
                }
              }}
            >
              {user?.subscriptionPlan === 'freelancer' && user?.subscriptionStatus === 'active' ? 'Tu Plan Actual' : 'Adquirir Freelancer'}
            </Button>
          </div>

          {/* Pro Tier */}
          <div className="bg-zinc-900/60 border-2 border-brand-purple rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-brand-purple/5 text-left">
            <div className="absolute top-0 right-0 bg-brand-purple text-white text-[9px] font-extrabold uppercase px-4 py-1 rounded-bl-xl tracking-wider">
              Recomendado
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-zinc-200">Plan Pro</span>
                <span className="text-[10px] text-brand-purple font-bold uppercase tracking-wider">Profesional</span>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-zinc-100 font-display">
                  {isAnnual ? '$20,000' : '$25,000'}
                </span>
                <span className="text-xs text-zinc-500 font-medium"> ARS / mes</span>
                <span className="text-[10px] text-zinc-500 block mt-1">Facturado {isAnnual ? 'anual' : 'mensual'}</span>
              </div>
              <ul className="flex flex-col gap-4 text-xs font-medium text-zinc-300 border-t border-zinc-800/80 pt-6 mb-8">
                <li className="flex items-center gap-2.5">
                  <ChevronRight className="w-4 h-4 text-brand-purple flex-shrink-0" />
                  Proyectos activos ilimitados
                </li>
                <li className="flex items-center gap-2.5">
                  <ChevronRight className="w-4 h-4 text-brand-purple flex-shrink-0" />
                  Tareas creadas ilimitadas
                </li>
                <li className="flex items-center gap-2.5">
                  <ChevronRight className="w-4 h-4 text-brand-purple flex-shrink-0" />
                  <strong className="text-emerald-400">Promedio ponderado inteligente (EMA)</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <ChevronRight className="w-4 h-4 text-brand-purple flex-shrink-0" />
                  Desviación estándar y Nivel de Confianza
                </li>
                <li className="flex items-center gap-2.5">
                  <ChevronRight className="w-4 h-4 text-brand-purple flex-shrink-0" />
                  Selector contable de múltiples monedas
                </li>
                <li className="flex items-center gap-2.5">
                  <ChevronRight className="w-4 h-4 text-brand-purple flex-shrink-0" />
                  Exportador completo de reportes (PDF/Excel)
                </li>
                <li className="flex items-center gap-2.5 text-zinc-500 line-through">
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  Coach de IA y búsqueda semántica
                </li>
              </ul>
            </div>
            <Button 
              className="w-full" 
              isLoading={billingLoading}
              onClick={() => {
                if (user?.subscriptionPlan === 'pro' && user?.subscriptionStatus === 'active') {
                  navigate('/dashboard');
                } else {
                  handleBuyPlan('pro', 'mercadopago');
                }
              }}
            >
              {user?.subscriptionPlan === 'pro' && user?.subscriptionStatus === 'active' ? 'Tu Plan Actual' : 'Adquirir Pro'}
            </Button>
          </div>

          {/* Business Tier */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 flex flex-col justify-between hover:border-zinc-700/60 transition-all text-left">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-zinc-300">Business</span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-display">Elite</span>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-zinc-100 font-display">
                  {isAnnual ? '$36,000' : '$45,000'}
                </span>
                <span className="text-xs text-zinc-500 font-medium"> ARS / mes</span>
                <span className="text-[10px] text-zinc-500 block mt-1">Facturado {isAnnual ? 'anual' : 'mensual'}</span>
              </div>
              <ul className="flex flex-col gap-4 text-xs font-medium text-zinc-400 border-t border-zinc-800/80 pt-6 mb-8">
                <li className="flex items-center gap-2.5">
                  <ChevronRight className="w-4 h-4 text-brand-purple flex-shrink-0" />
                  <strong className="text-zinc-200">Todo lo incluido en Pro</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <ChevronRight className="w-4 h-4 text-brand-purple flex-shrink-0" />
                  Soporte prioritario para empresas
                </li>
                <li className="flex items-center gap-2.5">
                  <ChevronRight className="w-4 h-4 text-brand-purple flex-shrink-0" />
                  <strong className="text-brand-purple">Coach de IA & Daily Briefing inteligente</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <ChevronRight className="w-4 h-4 text-brand-purple flex-shrink-0" />
                  <strong className="text-brand-purple">Buscador semántico en lenguaje natural</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <ChevronRight className="w-4 h-4 text-brand-purple flex-shrink-0" />
                  Alertas tempranas de riesgos de desvíos
                </li>
              </ul>
            </div>
            <Button 
              variant="secondary" 
              className="w-full" 
              isLoading={billingLoading}
              onClick={() => {
                if (user?.subscriptionPlan === 'business' && user?.subscriptionStatus === 'active') {
                  navigate('/dashboard');
                } else {
                  handleBuyPlan('business', 'mercadopago');
                }
              }}
            >
              {user?.subscriptionPlan === 'business' && user?.subscriptionStatus === 'active' ? 'Tu Plan Actual' : 'Adquirir Business'}
            </Button>
          </div>
        </div>
      </section>

      {/* Accordion FAQ */}
      <section id="faq" className="py-24 px-6 border-t border-zinc-900 bg-zinc-950/20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-brand-purple uppercase tracking-widest">Dudas Frecuentes</span>
            <h2 className="text-3xl font-extrabold text-zinc-100 font-display mt-2">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {faqItems.map((item, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden transition-all duration-200 text-left"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-semibold text-sm text-zinc-200 hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-500 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-12 px-6 text-center text-xs text-zinc-600">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-purple" />
            <span className="font-bold text-zinc-400">TimeFlow SaaS</span>
          </div>
          <p>© 2026 TimeFlow. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* 💳 Modal de Selección de Pasarela de Pago */}
      <Modal
        isOpen={!!selectedPlanForCheckout}
        onClose={() => setSelectedPlanForCheckout(null)}
        title={`Suscribirse al Plan ${(selectedPlanForCheckout || '').toUpperCase()}`}
      >
        <div className="flex flex-col gap-4 py-2 text-left">
          <p className="text-xs text-zinc-400">
            Selecciona tu método de pago preferido para completar la suscripción.
          </p>

          <div className="flex flex-col gap-3 mt-2">
            {/* Mercado Pago */}
            <button
              onClick={() => {
                if (selectedPlanForCheckout) {
                  handleBuyPlan(selectedPlanForCheckout, 'mercadopago');
                  setSelectedPlanForCheckout(null);
                }
              }}
              className="flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-2xl cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs">
                  MP
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-zinc-200">Mercado Pago</h4>
                  <p className="text-[10px] text-zinc-500">Saldo, Débito, Tarjetas locales o Rapipago/Pago Fácil</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </button>

            {/* Mobbex */}
            <button
              onClick={() => {
                if (selectedPlanForCheckout) {
                  handleBuyPlan(selectedPlanForCheckout, 'mobbex');
                  setSelectedPlanForCheckout(null);
                }
              }}
              className="flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-2xl cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  MB
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-zinc-200">Mobbex</h4>
                  <p className="text-[10px] text-zinc-500">Tarjetas de crédito locales y planes de cuotas</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </button>

            {/* Stripe */}
            <button
              onClick={() => {
                if (selectedPlanForCheckout) {
                  handleBuyPlan(selectedPlanForCheckout, 'stripe');
                  setSelectedPlanForCheckout(null);
                }
              }}
              className="flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-2xl cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple font-bold text-xs">
                  ST
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-zinc-200">Stripe (Internacional)</h4>
                  <p className="text-[10px] text-zinc-500">Tarjetas de crédito internacionales (USD)</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </button>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="ghost" onClick={() => setSelectedPlanForCheckout(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default LandingPage;
