import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/services/api';
import { authStore } from '@/store/authStore';
import { toastStore } from '@/store/toastStore';
import { settingsStore } from '@/store/settingsStore';
import { Card } from '@shared/components/Card';
import { Button } from '@shared/components/Button';
import { Sun, Moon, Volume2, Globe, Shield, Sparkles, CreditCard } from 'lucide-react';
import { useTranslation } from '@shared/lib/translations';

export const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { user, updateUserSubscription } = authStore();
  const { showToast } = toastStore();
  const { settings, updateSettings, loadSettings, isLoading: settingsLoading } = settingsStore();
  const [billingLoading, setBillingLoading] = useState(false);
  const { t } = useTranslation();

  // Sync settings when mounting settings page
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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

  const handleCheckoutPro = async () => {
    setBillingLoading(true);
    try {
      const data = await api.post('/billing/checkout');
      if (data.url) {
        // Redirection to Stripe (or mock dashboard success link)
        window.location.href = data.url;
      }
    } catch (e: any) {
      showToast(e.message || 'Error al iniciar la facturación.', 'error');
    } finally {
      setBillingLoading(false);
    }
  };

  const handlePortalSession = async () => {
    setBillingLoading(true);
    try {
      const data = await api.post('/billing/portal');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      showToast(e.message || 'Error al abrir el portal de facturación.', 'error');
    } finally {
      setBillingLoading(false);
    }
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
            {user?.subscriptionPlan === 'pro' ? (
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
                onClick={handleCheckoutPro}
                isLoading={billingLoading}
                leftIcon={<Sparkles className="w-4 h-4 fill-white/10" />}
                className="w-full md:w-auto"
              >
                {t('billingUpgradeBtn')}
              </Button>
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
        </div>
      </Card>
    </div>
  );
};
export default SettingsPage;
