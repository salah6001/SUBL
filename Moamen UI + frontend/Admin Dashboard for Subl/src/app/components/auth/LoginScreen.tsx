import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../../lib/auth/AuthContext';
import { ApiError } from '../../lib/apiClient';
import { isAdminToken } from '../../lib/jwtDecode';
import { tokenStore } from '../../lib/tokenStore';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
  email: string;
  password: string;
}

export function LoginScreen() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch } = useForm<FormData>({
    defaultValues: { email: 'admin@onex.com', password: 'Admin@123!' },
  });

  const [email, password] = watch(['email', 'password']);

  // Tell the admin their session expired (set when a 401 bounced them here),
  // instead of silently showing the login form.
  useEffect(() => {
    try {
      if (sessionStorage.getItem('subl.sessionExpired')) {
        sessionStorage.removeItem('subl.sessionExpired');
        toast.info('Your session has expired. Please sign in again.');
      }
    } catch { /* no-op */ }
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      const token = tokenStore.getAccessToken();
      if (token && !isAdminToken(token)) {
        // Not an admin — hand the session to the user app and don't keep it here.
        tokenStore.clear();
        window.location.href = `http://localhost:3002/#token=${encodeURIComponent(token)}`;
        return;
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.displayMessage
          : err instanceof Error
          ? err.message
          : 'Login failed';
      toast.error(message);
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
          <button type="button" className="text-xs text-blue-500 hover:underline">
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
      </form>
    </AuthLayout>
  );
}
