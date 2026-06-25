import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthLayout } from './AuthLayout';
import { login, logout } from '../../api/auth';
import { isAdminToken } from '../../lib/jwtDecode';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onLogin: () => void;
  onGoSignUp: () => void;
}

interface FormData {
  email: string;
  password: string;
}

export function LoginScreen({ onLogin, onGoSignUp }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch } = useForm<FormData>({
    defaultValues: { email: 'user@company.com', password: 'User@123!' },
  });

  const [email, password] = watch(['email', 'password']);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const resp = await login(data.email, data.password);
      if (isAdminToken(resp.accessToken)) {
        // Admins belong on the admin app — hand off the session and don't keep
        // it in this (user) app's storage.
        logout();
        window.location.href = `http://localhost:3001/#token=${encodeURIComponent(resp.accessToken)}`;
        return;
      }
      onLogin();
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
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Log In</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="login-email"
                type="email"
                placeholder="Write your email"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
                {...register('email')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Write your password"
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
                {...register('password')}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            className="text-xs text-blue-500 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <button type="button" onClick={onGoSignUp} className="text-blue-500 font-medium hover:underline">
            Create your account
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
