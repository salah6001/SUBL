import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { AuthLayout } from '@/components/AuthLayout';
import { useAppState } from '@/hooks/useAppState';
import { authApi } from '@/api/auth';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { tryDemoLogin } from '@/lib/demoAuth';

const schema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAppState();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const [email, password] = watch(['email', 'password']);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { token, user } = tryDemoLogin(data.email, data.password) ?? await authApi.login(data);
      setAuth(token, user);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-subl-grey-900 mb-1">Log In</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-subl-grey-600 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-subl-grey-400" size={16} />
              <input
                id="login-email"
                type="email"
                placeholder="Write your email"
                className="w-full pl-10 pr-4 py-3 bg-subl-grey-50 border border-subl-grey-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-subl-blue-200 focus:border-subl-blue-300 transition-all"
                {...register('email')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-subl-grey-600 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-subl-grey-400" size={16} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Write your password"
                className="w-full pl-10 pr-10 py-3 bg-subl-grey-50 border border-subl-grey-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-subl-blue-200 focus:border-subl-blue-300 transition-all"
                {...register('password')}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subl-grey-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-xs text-subl-blue-500 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full py-3.5 bg-subl-blue-500 hover:bg-subl-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>

        <p className="text-center text-sm text-subl-grey-500">
          Don't have an account?{' '}
          <button type="button" onClick={() => navigate('/signup')} className="text-subl-blue-500 font-medium hover:underline">
            Create your account
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
