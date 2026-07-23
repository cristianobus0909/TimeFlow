import { useState } from 'react';
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
} from 'lucide-react';
import { authStore } from '@/store/authStore';
import { api } from '@shared/services/api';
import { Button } from '@shared/components/Button';
import { toastStore } from '@/store/toastStore';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = authStore();
  const { showToast } = toastStore();
  const [isAnnual, setIsAnnual] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleStartFree = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleBuyPro = async () => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    if (user?.subscriptionPlan === 'pro') {
      navigate('/dashboard');
      return;
    }

    setBillingLoading(true);
    try {
      const data = await api.post('/billing/checkout');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      showToast(e.message || 'Error al iniciar la facturación.', 'error');
    } finally {
      setBillingLoading(false);
    }
  };

  const faqItems = [
    {
      q: '¿Cómo funciona la estimación inteligente?',
      a: 'TimeFlow no utiliza un promedio matemático simple. Aplica un promedio móvil ponderado donde las últimas veces que realizaste una tarea tienen mayor peso. Si mejoras tu velocidad o automatizas parte de tu flujo, TimeFlow lo detectará y adaptará las estimaciones de tus proyectos en tiempo real.',
    },
    {
      q: '¿Puedo usar mi propia cuenta de Stripe para facturar?',
      a: 'TimeFlow es una aplicación SaaS completa lista para producción. Integra la pasarela de Stripe en modo Sandbox/Test para pruebas de desarrollo. Si deseas desplegarla comercialmente, solo debes reemplazar las variables de entorno de Stripe por tus claves de producción.',
    },
    {
      q: '¿Qué mide el "Nivel de Confianza"?',
      a: 'Calcula la desviación estándar de tus ejecuciones. Si tus tiempos varían muy poco, el nivel de confianza será "Alto". Si hay mucha volatilidad o tienes pocas muestras (menos de 5 ejecuciones), el nivel será "Bajo", indicando que necesitas registrar más sesiones para una estimación certera.',
    },
    {
      q: '¿Cómo puedo exportar mis datos?',
      a: 'Los usuarios del Plan Pro tienen acceso completo a exportaciones virtualizadas de todo el historial en formatos PDF, CSV y Excel para adjuntar en reportes de horas o facturas de clientes.',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 select-text overflow-y-auto">
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
        <div className="flex items-center gap-4">
          <a
            href="#features"
            className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Características
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Precios
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Preguntas
          </a>
          <span className="h-4 w-px bg-zinc-800" />
          {isAuthenticated ? (
            <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
              Ir a la App
            </Button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Iniciar sesión
              </button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Comenzar gratis
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-28 text-center max-w-4xl mx-auto flex flex-col items-center">
        {/* Glow Ring behind Hero */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-purple/10 blur-[100px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          Motor de Aprendizaje Ponderado Integrado
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-zinc-100 font-display leading-[1.1] tracking-tight max-w-3xl mb-6">
          Deja de adivinar tus tiempos. <br />
          <span className="bg-gradient-to-r from-brand-purple to-pink-500 bg-clip-text text-transparent">
            Estima con precisión matemática.
          </span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl leading-relaxed mb-10">
          TimeFlow mide el tiempo real que dedicas a tus tareas recurrentes, aprende de tu
          historial y autocalcula la duración de tus proyectos futuros de manera inteligente.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button size="lg" onClick={handleStartFree} rightIcon={<ArrowRight className="w-5 h-5" />}>
            Comienza gratis (sin tarjeta)
          </Button>
          <a href="#features">
            <Button variant="secondary" size="lg">
              Conocer más
            </Button>
          </a>
        </div>

        {/* Live Estimation Showcase Widget */}
        <div className="w-full max-w-3xl mt-16 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-purple to-pink-500" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/80 pb-4 mb-4">
            <div className="text-left">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest">Proyecto Activo</span>
              <h4 className="text-sm font-bold text-zinc-100">Rediseño UI & Maquetación Next.js</h4>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest">Tiempo Estimado</span>
                <p className="text-xs font-bold text-emerald-400">14h 45m (Precisión del 98%)</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest">Tiempo Real</span>
                <p className="text-xs font-bold text-zinc-300">14h 22m</p>
              </div>
            </div>
          </div>
          {/* Progress Bar comparison */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex justify-between text-xs font-medium text-zinc-400">
              <span>Progreso de Tareas (4/5 completadas)</span>
              <span className="text-brand-purple">92%</span>
            </div>
            <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
              <div className="h-full bg-gradient-to-r from-brand-purple to-brand-emerald rounded-full w-[92%]" />
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution */}
      <section id="features" className="border-t border-zinc-900 bg-zinc-950/30 py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-semibold text-brand-purple uppercase tracking-widest">El Dolor de Presupuestar</span>
            <h2 className="text-3xl font-extrabold text-zinc-100 font-display mt-2 mb-6">
              ¿Por qué tus estimaciones siempre se quedan cortas?
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Estimar proyectos basándote en la "intuición" o en un promedio simple es la
              principal causa de retrasos, presupuestos superados y pérdidas de dinero. Cada
              jornada es distinta, pero las tareas repetitivas muestran patrones claros.
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
              TimeFlow integra un cronómetro profesional que registra cada ejecución. Al final de
              cada sesión, el algoritmo analiza la desviación estándar y ajusta el promedio móvil.
              Los registros más recientes tienen mayor relevancia, adaptándose a tu velocidad real.
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
      <section id="pricing" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-brand-purple uppercase tracking-widest">Precios Claros</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-100 font-display mt-2 mb-4">
            Un precio simple para profesionales
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto mb-8">
            Comienza a estimar de forma gratuita y escala a funciones avanzadas cuando tu volumen
            de proyectos lo requiera.
          </p>

          {/* Pricing Toggle */}
          <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-1 rounded-full">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
          {/* Free Tier */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 flex flex-col justify-between hover:border-zinc-700/60 transition-all">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-zinc-300">Plan Free</span>
                <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Gratis</span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-zinc-100 font-display">$0</span>
                <span className="text-xs text-zinc-500 font-medium"> / por siempre</span>
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
                <li className="flex items-center gap-2.5 text-zinc-600 line-through">
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  Inteligencia de confianza y desviación
                </li>
                <li className="flex items-center gap-2.5 text-zinc-600 line-through">
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  Exportar reportes (PDF, CSV, Excel)
                </li>
              </ul>
            </div>
            <Button variant="secondary" className="w-full" onClick={handleStartFree}>
              Comenzar ahora
            </Button>
          </div>

          {/* Pro Tier */}
          <div className="bg-zinc-900 border-2 border-brand-purple rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-brand-purple/5">
            <div className="absolute top-0 right-0 bg-brand-purple text-white text-[9px] font-extrabold uppercase px-4 py-1 rounded-bl-xl tracking-wider">
              Recomendado
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-zinc-200">Plan Pro</span>
                <span className="text-xs text-brand-purple font-semibold uppercase tracking-wider">Suscripción</span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-zinc-100 font-display">
                  {isAnnual ? '$7.20' : '$9.00'}
                </span>
                <span className="text-xs text-zinc-500 font-medium"> USD / mes, facturado {isAnnual ? 'anual' : 'mensual'}</span>
              </div>
              <ul className="flex flex-col gap-4 text-xs font-medium text-zinc-300 border-t border-zinc-800 pt-6 mb-8">
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
                  Exportador completo de reportes
                </li>
              </ul>
            </div>
            <Button className="w-full" isLoading={billingLoading} onClick={handleBuyPro}>
              {user?.subscriptionPlan === 'pro' ? 'Ya eres Pro' : 'Adquirir Pro'}
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
                  className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden transition-all duration-200"
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
    </div>
  );
};
export default LandingPage;
