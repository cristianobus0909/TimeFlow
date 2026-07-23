import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { authStore } from '../../store/authStore';
import { toastStore } from '../../store/toastStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const registerSchema = z
  .object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    email: z.string().min(1, 'El email es obligatorio').email('Formato de correo no válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Debes confirmar tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { setAuth } = authStore();
  const { showToast } = toastStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async (response: any) => {
    setIsLoading(true);
    try {
      const data = await api.post('/auth/google', { idToken: response.credential }, { skipAuth: true });
      setAuth(data.user, data.accessToken);
      showToast('Registro completado con éxito. ¡Bienvenido a TimeFlow!');
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
          document.getElementById('google-register-btn'),
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
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const data = await api.post('/auth/register', {
        name: values.name,
        email: values.email,
        password: values.password,
      }, { skipAuth: true });
      
      setAuth(data.user, data.accessToken);
      showToast('Registro completado con éxito. ¡Bienvenido a TimeFlow!');
      navigate('/dashboard');
    } catch (e: any) {
      showToast(e.message || 'Error al registrar usuario.', 'error');
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
          <h2 className="text-xl font-bold text-zinc-100 mb-1">Crea tu cuenta gratis</h2>
          <p className="text-zinc-500 text-xs text-center">
            Comienza a trackear hoy mismo y refina tus presupuestos
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Nombre Completo"
            placeholder="Juan Pérez"
            type="text"
            leftIcon={<User className="w-4 h-4" />}
            error={errors.name?.message}
            {...register('name')}
          />

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
            placeholder="Min. 6 caracteres"
            type="password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Confirmar Contraseña"
            placeholder="••••••••"
            type="password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button type="submit" className="w-full mt-2" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Registrarme y empezar
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
          <div id="google-register-btn" className="w-full" style={{ minHeight: '40px' }} />
        </div>

        <p className="text-center text-xs text-zinc-500 mt-6">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="text-brand-purple hover:underline font-semibold cursor-pointer">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};
export default RegisterPage;
