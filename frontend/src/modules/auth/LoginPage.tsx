import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react';
import { api } from '@shared/services/api';
import { authStore } from '@/store/authStore';
import { toastStore } from '@/store/toastStore';
import { Button } from '@shared/components/Button';
import { Input } from '@shared/components/Input';

const loginSchema = z.object({
  email: z.string().min(1, 'El email es obligatorio').email('Formato de correo no válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = authStore();
  const { showToast } = toastStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async (response: any) => {
    setIsLoading(true);
    try {
      const data = await api.post('/auth/google', { idToken: response.credential }, { skipAuth: true });
      setAuth(data.user, data.accessToken);
      showToast('Sesión iniciada correctamente con Google.');
      navigate('/dashboard');
    } catch (e: any) {
      showToast(e.message || 'Error al iniciar sesión con Google.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogleBtn = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          callback: handleGoogleLogin,
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'outline', size: 'large', width: 380 }
        );
      } else {
        setTimeout(initializeGoogleBtn, 100);
      }
    };

    initializeGoogleBtn();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const data = await api.post('/auth/login', values, { skipAuth: true });
      setAuth(data.user, data.accessToken);
      showToast('Sesión iniciada correctamente.');
      navigate('/dashboard');
    } catch (e: any) {
      showToast(e.message || 'Error de credenciales al iniciar sesión.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 relative overflow-hidden select-text">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-purple/10 blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-4 group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-brand-purple flex items-center justify-center shadow-lg shadow-brand-purple/20 transition-transform group-hover:scale-105">
              <Zap className="w-5 h-5 text-white fill-white/10" />
            </div>
            <span className="font-extrabold text-xl text-zinc-100 tracking-tight font-display">
              TimeFlow
            </span>
          </Link>
          <h2 className="text-xl font-bold text-zinc-100 mb-1">Bienvenido de nuevo</h2>
          <p className="text-zinc-500 text-xs text-center">
            Inicia sesión para gestionar tus tareas y cotizaciones de proyectos
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Input
            label="Correo Electrónico"
            placeholder="tu@ejemplo.com"
            type="email"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            type="password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" className="w-full mt-2" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Iniciar Sesión
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <span className="relative px-3 bg-zinc-900 text-xs text-zinc-500 uppercase tracking-wider">
            O continuar con
          </span>
        </div>

        {/* Google Button */}
        <div className="w-full flex justify-center mb-6">
          <div id="google-signin-btn" className="w-full" style={{ minHeight: '40px' }} />
        </div>

        <p className="text-center text-xs text-zinc-500 mt-6">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="text-brand-purple hover:underline font-semibold cursor-pointer">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
};
export default LoginPage;
