import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/services/api';
import { authStore } from '@/store/authStore';
import { toastStore } from '@/store/toastStore';
import { settingsStore } from '@/store/settingsStore';
import { Card } from '@shared/components/Card';
import { Button } from '@shared/components/Button';
import { Modal } from '@shared/components/Modal';
import { Sun, Moon, Volume2, Globe, Shield, Sparkles, CreditCard, DollarSign, Building } from 'lucide-react';
import { useTranslation } from '@shared/lib/translations';

export const SettingsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, updateUserSubscription } = authStore();
  const { showToast } = toastStore();
  const { settings, updateSettings, loadSettings, isLoading: settingsLoading } = settingsStore();
  const [billingLoading, setBillingLoading] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const { t } = useTranslation();

  // Sync settings when mounting settings page
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const [orgName, setOrgName] = useState('');
  const [baseRateInput, setBaseRateInput] = useState(String(settings.defaultHourlyRate || 25));

  useEffect(() => {
    if (settings.defaultHourlyRate !== undefined) {
      setBaseRateInput(String(settings.defaultHourlyRate));
    }
  }, [settings.defaultHourlyRate]);

  // Fetch active organization
  const { data: organization, refetch: refetchOrg } = useQuery({
    queryKey: ['myOrganization'],
    queryFn: () => api.get('/organizations/me'),
  });

  useEffect(() => {
    if (organization?.name) {
      setOrgName(organization.name);
    }
  }, [organization]);

  const updateOrgMutation = useMutation({
    mutationFn: (name: string) => api.put(`/organizations/${organization._id}`, { name }),
    onSuccess: () => {
      refetchOrg();
      queryClient.invalidateQueries({ queryKey: ['myOrganization'] });
      showToast('Nombre del espacio de trabajo actualizado.');
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al actualizar el espacio de trabajo.', 'error');
    }
  });

  const handleUpdateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      showToast('El nombre de la organización no puede estar vacío.', 'error');
      return;
    }
    updateOrgMutation.mutate(orgName);
  };

  // Read URL search params for billing success callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('billing_downgraded') === 'true') {
      updateUserSubscription('free', 'free');
      showToast('Suscripción cancelada correctamente (Simulado).');
      // clean url
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [showToast, updateUserSubscription]);

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
    showToast(`Tema cambiado a modo ${nextTheme === 'dark' ? 'oscuro' : 'claro'}.`);
  };

  const handleToggleSound = () => {
    const nextSound = !settings.soundAlerts;
    updateSettings({ soundAlerts: nextSound });
    showToast(nextSound ? 'Alertas sonoras activadas.' : 'Alertas sonoras desactivadas.');
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value as 'es' | 'en';
    updateSettings({ language: lang });
    showToast(`Idioma cambiado a ${lang === 'es' ? 'Español' : 'Inglés'}.`);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const curr = e.target.value;
    updateSettings({ currency: curr });
    showToast(`Moneda preferida cambiada a ${curr}.`);
  };

  const handleUpgradePlan = async (plan: 'freelancer' | 'pro' | 'business') => {
    setBillingLoading(true);
    try {
      const data = await api.post('/billing/mercadopago/checkout', { plan });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      showToast(e.message || 'Error al iniciar la facturación.', 'error');
    } finally {
      setBillingLoading(false);
    }
  };

  const handlePortalSession = async () => {
    setIsBillingModalOpen(true);
  };

  if (settingsLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse select-none">
        <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl w-48" />
        <div className="h-40 bg-zinc-900 border border-zinc-800 rounded-2xl" />
        <div className="h-48 bg-zinc-900 border border-zinc-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 select-text">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 font-display">{t('settingsTitle')}</h2>
        <p className="text-zinc-500 text-xs mt-0.5">{t('settingsSubtitle')}</p>
      </div>

      {/* SaaS Billing Panel */}
      <Card className="relative overflow-hidden border-zinc-800/80 bg-zinc-900/60">
        <div className="absolute top-0 right-0 w-44 h-44 bg-brand-purple/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple rounded-2xl mt-0.5">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t('billingPlan')}</span>
              <h3 className="text-sm font-bold text-zinc-200 mt-1 flex items-center gap-2">
                TimeFlow {user?.subscriptionPlan === 'pro' ? t('proBadge') : t('free')}
                {user?.subscriptionPlan === 'pro' && (
                  <span className="tf-badge-success">
                    {t('active')}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed max-w-md">
                {user?.subscriptionPlan === 'pro' ? t('billingProDesc') : t('billingFreeDesc')}
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 w-full md:w-auto">
            {['freelancer', 'pro', 'business'].includes(user?.subscriptionPlan || '') && user?.subscriptionStatus === 'active' ? (
              <Button
                onClick={handlePortalSession}
                isLoading={billingLoading}
                variant="secondary"
                className="w-full md:w-auto"
              >
                {t('billingPortalBtn')}
              </Button>
            ) : (
              <Button
                onClick={() => setIsBillingModalOpen(true)}
                leftIcon={<Sparkles className="w-4 h-4 fill-white/10" />}
                className="w-full md:w-auto"
              >
                Ver Planes de Pago
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Workspace Settings Panel */}
      <Card className="flex flex-col gap-6 text-left border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple rounded-2xl mt-0.5">
            <Building className="w-5 h-5" />
          </div>
          <div className="text-left w-full">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Espacio de Trabajo (Organización)</span>
            <h3 className="text-sm font-bold text-zinc-200 mt-1">Configuración del Workspace</h3>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
              Define el nombre de tu organización o empresa. Esto aparecerá en tus reportes y facturas.
            </p>

            {organization ? (
              <form onSubmit={handleUpdateOrg} className="flex gap-3 mt-4 max-w-md">
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Nombre de tu Organización"
                  className="flex-grow bg-zinc-950 border border-zinc-850 text-zinc-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-zinc-700"
                />
                <Button type="submit" size="sm" isLoading={updateOrgMutation.isPending}>
                  Guardar
                </Button>
              </form>
            ) : (
              <p className="text-xs text-zinc-400 mt-3 italic">Cargando datos del espacio de trabajo...</p>
            )}
          </div>
        </div>
      </Card>

      {/* Interface Settings Panel */}
      <Card className="flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-bold text-zinc-200 mb-1">{t('uiPreferences')}</h3>
          <p className="text-[10px] text-zinc-500">{t('uiPreferencesSub')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/60 text-xs">
          {/* Theme selection toggle */}
          <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-900">
            <div
              onClick={handleToggleTheme}
              className="flex items-center gap-3 cursor-pointer select-none group"
              title="Cambiar tema"
            >
              <div className={`p-2.5 rounded-xl border transition-all ${
                settings.theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800/80 text-zinc-400'
                  : 'bg-amber-50 border-amber-100 text-amber-600 shadow-sm'
              }`}>
                {settings.theme === 'dark' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-zinc-200">{t('settingTheme')}</span>
                <span className="text-[10px] text-zinc-500 mt-0.5">{t('settingThemeSub')}</span>
              </div>
            </div>
            <button
              onClick={handleToggleTheme}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 px-3.5 py-1.5 rounded-xl font-semibold hover:bg-zinc-850 cursor-pointer text-[11px]"
            >
              {settings.theme === 'dark' ? t('settingThemeBtnDark') : t('settingThemeBtnLight')}
            </button>
          </div>

          {/* Sound Notification Alert toggle */}
          <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-900">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border transition-all ${
                settings.soundAlerts
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
              }`}>
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-zinc-200">{t('settingSound')}</span>
                <span className="text-[10px] text-zinc-500 mt-0.5">{t('settingSoundSub')}</span>
              </div>
            </div>
            <button
              onClick={handleToggleSound}
              className={`border px-3.5 py-1.5 rounded-xl font-semibold cursor-pointer text-[11px] ${
                settings.soundAlerts
                  ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50'
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800'
              }`}
            >
              {settings.soundAlerts ? t('settingSoundOn') : t('settingSoundOff')}
            </button>
          </div>

          {/* Language dropdown selection */}
          <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-900 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
                <Globe className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-zinc-200">{t('settingLang')}</span>
                <span className="text-[10px] text-zinc-500 mt-0.5">{t('settingLangSub')}</span>
              </div>
            </div>
            <select
              value={settings.language}
              onChange={handleLanguageChange}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl px-3 py-1.5 font-semibold text-xs outline-none cursor-pointer"
            >
              <option value="es">Español (es)</option>
              <option value="en">English (en)</option>
            </select>
          </div>

          {/* Currency dropdown selection */}
          <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-900 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-550">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-zinc-200">Moneda del Sistema</span>
                <span className="text-[10px] text-zinc-500 mt-0.5">Establece la moneda predeterminada para el cálculo de ingresos y metas.</span>
              </div>
            </div>
            <select
              value={settings.currency || 'USD'}
              onChange={handleCurrencyChange}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl px-3 py-1.5 font-semibold text-xs outline-none cursor-pointer"
            >
              <option value="USD">Dólar Estadounidense ($ USD)</option>
              <option value="EUR">Euro (€ EUR)</option>
              <option value="ARS">Peso Argentino ($ ARS)</option>
              <option value="MXN">Peso Mexicano ($ MXN)</option>
              <option value="COP">Peso Colombiano ($ COP)</option>
              <option value="CLP">Peso Chileno ($ CLP)</option>
              <option value="PEN">Sol Peruano (S/. PEN)</option>
            </select>
          </div>

          {/* Default Hourly Rate input */}
          <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-900 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-emerald-500">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-zinc-200">Tarifa Hora Base por Defecto</span>
                <span className="text-[10px] text-zinc-500 mt-0.5">Monto cobrado por hora cuando un proyecto o tarea no tiene tarifa específica.</span>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const rateVal = parseFloat(baseRateInput) || 0;
                updateSettings({ defaultHourlyRate: rateVal });
                showToast(`Tarifa base por defecto guardada: $${rateVal.toFixed(2)} ${settings.currency || 'USD'}/h.`);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="number"
                step="0.5"
                min="0"
                value={baseRateInput}
                onChange={(e) => setBaseRateInput(e.target.value)}
                className="w-28 bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono font-bold rounded-xl px-3 py-1.5 text-xs text-right outline-none focus:border-brand-purple"
              />
              <span className="text-xs font-semibold text-zinc-400">{settings.currency || 'USD'}/h</span>
              <Button type="submit" size="sm" className="ml-1 py-1.5 px-3.5 text-xs font-bold">
                Guardar
              </Button>
            </form>
          </div>

          {/* Onboarding Guide toggle / reset */}
          <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-900 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-brand-purple">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-zinc-200">Guía de Primeros Pasos</span>
                <span className="text-[10px] text-zinc-500 mt-0.5">Reinicia el tour interactivo para aprender a crear clientes, proyectos y tareas.</span>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('tf_onboarding_completed');
                showToast('Guía de primeros pasos restablecida. Vuelve al Dashboard para iniciar el tour.');
              }}
              className="bg-brand-purple/10 border border-brand-purple/30 text-brand-purple hover:bg-brand-purple/20 px-3.5 py-1.5 rounded-xl font-semibold cursor-pointer text-[11px]"
            >
              Restablecer Tour
            </button>
          </div>
        </div>
      </Card>

      {/* Modern Subscription Billing Modal */}
      <Modal isOpen={isBillingModalOpen} onClose={() => setIsBillingModalOpen(false)} title="Administrar Facturación y Suscripción">
        <div className="flex flex-col gap-6 select-text text-left max-w-4xl w-full">
          {/* Current plan detail */}
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Plan Actual</span>
              <h4 className="text-sm font-bold text-zinc-200 mt-0.5">
                TimeFlow {user?.subscriptionPlan === 'free' ? 'Free (Básico)' : user?.subscriptionPlan?.toUpperCase()}
              </h4>
              <p className="text-zinc-500 text-[11px] mt-1 leading-relaxed">
                {user?.subscriptionStatus === 'trialing' && user?.trialPeriodEnd
                  ? `Tu prueba gratuita de 7 días finaliza el ${new Date(user.trialPeriodEnd).toLocaleDateString()}.`
                  : user?.subscriptionStatus === 'active' && user?.subscriptionPeriodEnd
                    ? `Tu licencia expira el ${new Date(user.subscriptionPeriodEnd).toLocaleDateString()}.`
                    : 'Estás en el plan básico gratuito. Mejora tu plan para tener proyectos y tareas ilimitadas.'}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border ${
                user?.subscriptionStatus === 'active' 
                  ? 'text-emerald-450 bg-emerald-950/20 border-emerald-900/50' 
                  : user?.subscriptionStatus === 'trialing' 
                    ? 'text-brand-purple bg-brand-purple/10 border-brand-purple/20' 
                    : 'text-zinc-500 bg-zinc-950 border-zinc-900'
              }`}>
                {user?.subscriptionStatus?.toUpperCase() || 'FREE'}
              </span>
            </div>
          </div>

          <div className="text-xs font-bold text-zinc-400 mt-2">Planes Disponibles (Mercado Pago)</div>

          {/* Pricing cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Freelancer Plan Card */}
            <div className={`bg-zinc-950/40 border rounded-2xl p-5 flex flex-col justify-between gap-4 text-left transition-all ${
              user?.subscriptionPlan === 'freelancer' && user?.subscriptionStatus === 'active' 
                ? 'border-brand-purple bg-brand-purple/5' 
                : 'border-zinc-850 hover:border-zinc-800'
            }`}>
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-zinc-200">Freelancer</span>
                  {user?.subscriptionPlan === 'freelancer' && user?.subscriptionStatus === 'active' && (
                    <span className="text-[8px] bg-brand-purple text-white px-2 py-0.5 rounded font-extrabold uppercase">Activo</span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-xl font-black text-zinc-100 font-display">$15,000</span>
                  <span className="text-[10px] text-zinc-500"> ARS / mes</span>
                </div>
                <ul className="flex flex-col gap-2 mt-4 text-[10px] text-zinc-500 font-medium leading-relaxed">
                  <li>• Max 3 proyectos activos</li>
                  <li>• Max 15 tareas totales</li>
                  <li>• Promedio simple de tiempos</li>
                  <li className="text-zinc-700 line-through">• Selector de monedas</li>
                  <li className="text-zinc-700 line-through">• Coach de IA / Reportes</li>
                </ul>
              </div>

              <Button
                size="sm"
                className="w-full text-xs font-bold py-1.5"
                variant={user?.subscriptionPlan === 'freelancer' && user?.subscriptionStatus === 'active' ? 'secondary' : 'primary'}
                isLoading={billingLoading}
                onClick={() => handleUpgradePlan('freelancer')}
              >
                {user?.subscriptionPlan === 'freelancer' && user?.subscriptionStatus === 'active' ? 'Renovar Plan' : 'Adquirir Freelancer'}
              </Button>
            </div>

            {/* Pro Plan Card */}
            <div className={`bg-zinc-950/40 border rounded-2xl p-5 flex flex-col justify-between gap-4 text-left transition-all relative overflow-hidden ${
              user?.subscriptionPlan === 'pro' && user?.subscriptionStatus === 'active' 
                ? 'border-brand-purple bg-brand-purple/5' 
                : 'border-zinc-850 hover:border-zinc-800'
            }`}>
              <div className="absolute top-0 right-0 bg-brand-purple text-white text-[7px] font-extrabold uppercase px-3 py-0.5 rounded-bl-lg tracking-wider">
                Popular
              </div>
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-zinc-200">Plan Pro</span>
                  {user?.subscriptionPlan === 'pro' && user?.subscriptionStatus === 'active' && (
                    <span className="text-[8px] bg-brand-purple text-white px-2 py-0.5 rounded font-extrabold uppercase">Activo</span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-xl font-black text-zinc-100 font-display">$25,000</span>
                  <span className="text-[10px] text-zinc-500"> ARS / mes</span>
                </div>
                <ul className="flex flex-col gap-2 mt-4 text-[10px] text-zinc-500 font-medium leading-relaxed">
                  <li>• Proyectos activos ilimitados</li>
                  <li>• Tareas ilimitadas</li>
                  <li className="text-emerald-450 font-semibold">• Estimación Weighted EMA</li>
                  <li>• Múltiples monedas (ARS/USD)</li>
                  <li>• Exportador PDF / Excel</li>
                  <li className="text-zinc-700 line-through">• Coach de IA / Briefs</li>
                </ul>
              </div>

              <Button
                size="sm"
                className="w-full text-xs font-bold py-1.5"
                variant={user?.subscriptionPlan === 'pro' && user?.subscriptionStatus === 'active' ? 'secondary' : 'primary'}
                isLoading={billingLoading}
                onClick={() => handleUpgradePlan('pro')}
              >
                {user?.subscriptionPlan === 'pro' && user?.subscriptionStatus === 'active' 
                  ? 'Renovar Plan' 
                  : user?.subscriptionPlan === 'freelancer' && user?.subscriptionStatus === 'active' 
                    ? 'Mejorar a Pro' 
                    : 'Adquirir Pro'}
              </Button>
            </div>

            {/* Business Plan Card */}
            <div className={`bg-zinc-950/40 border rounded-2xl p-5 flex flex-col justify-between gap-4 text-left transition-all ${
              user?.subscriptionPlan === 'business' && user?.subscriptionStatus === 'active' 
                ? 'border-brand-purple bg-brand-purple/5' 
                : 'border-zinc-850 hover:border-zinc-800'
            }`}>
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-zinc-200">Business</span>
                  {user?.subscriptionPlan === 'business' && user?.subscriptionStatus === 'active' && (
                    <span className="text-[8px] bg-brand-purple text-white px-2 py-0.5 rounded font-extrabold uppercase">Activo</span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-xl font-black text-zinc-100 font-display">$45,000</span>
                  <span className="text-[10px] text-zinc-500"> ARS / mes</span>
                </div>
                <ul className="flex flex-col gap-2 mt-4 text-[10px] text-zinc-500 font-medium leading-relaxed">
                  <li>• Todo lo incluido en Plan Pro</li>
                  <li className="text-brand-purple font-semibold">• Coach de IA integrado</li>
                  <li>• Sugerencias semánticas</li>
                  <li>• Daily Briefs de actividades</li>
                  <li>• Soporte premium prioritario</li>
                </ul>
              </div>

              <Button
                size="sm"
                className="w-full text-xs font-bold py-1.5"
                variant={user?.subscriptionPlan === 'business' && user?.subscriptionStatus === 'active' ? 'secondary' : 'primary'}
                isLoading={billingLoading}
                onClick={() => handleUpgradePlan('business')}
              >
                {user?.subscriptionPlan === 'business' && user?.subscriptionStatus === 'active' 
                  ? 'Renovar Plan' 
                  : ['freelancer', 'pro'].includes(user?.subscriptionPlan || '') && user?.subscriptionStatus === 'active' 
                    ? 'Mejorar a Business' 
                    : 'Adquirir Business'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default SettingsPage;
