import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { AuthLayout } from '@/components/AuthLayout';
import { useAppState } from '@/hooks/useAppState';
import { authApi } from '@/api/auth';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

export default function SignUp() {
  const navigate = useNavigate();
  const { setAuth, completeOnboarding } = useAppState();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', password: '', confirmPassword: '' },
  });

  const [name, phone, email, password, confirmPassword] = watch(['name', 'phone', 'email', 'password', 'confirmPassword']);
  const allFilled = !!(name && phone && email && password && confirmPassword);

  const onSubmit = async (data: FormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await authApi.signup({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      setAuth(token, user);
      completeOnboarding();
      navigate('/assessment');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-subl-grey-900 mb-1">Sign Up</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="signup-name" className="block text-xs font-medium text-subl-grey-600 mb-1.5">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-subl-grey-400" size={16} />
              <input
                id="signup-name"
                type="text"
                placeholder="Write your name"
                className="w-full pl-10 pr-4 py-3 bg-subl-grey-50 border border-subl-grey-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-subl-blue-200 focus:border-subl-blue-300 transition-all"
                {...register('name')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-phone" className="block text-xs font-medium text-subl-grey-600 mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-subl-grey-400" size={16} />
              <input
                id="signup-phone"
                type="tel"
                placeholder="Write your phone number"
                className="w-full pl-10 pr-4 py-3 bg-subl-grey-50 border border-subl-grey-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-subl-blue-200 focus:border-subl-blue-300 transition-all"
                {...register('phone')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-xs font-medium text-subl-grey-600 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-subl-grey-400" size={16} />
              <input
                id="signup-email"
                type="email"
                placeholder="Write your email"
                className="w-full pl-10 pr-4 py-3 bg-subl-grey-50 border border-subl-grey-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-subl-blue-200 focus:border-subl-blue-300 transition-all"
                {...register('email')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-xs font-medium text-subl-grey-600 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-subl-grey-400" size={16} />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Write your password"
                className="w-full pl-10 pr-10 py-3 bg-subl-grey-50 border border-subl-grey-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-subl-blue-200 focus:border-subl-blue-300 transition-all"
                {...register('password')}
              />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-subl-grey-400">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="signup-confirm-password" className="block text-xs font-medium text-subl-grey-600 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-subl-grey-400" size={16} />
              <input
                id="signup-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Write your confirmed password"
                className="w-full pl-10 pr-10 py-3 bg-subl-grey-50 border border-subl-grey-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-subl-blue-200 focus:border-subl-blue-300 transition-all"
                {...register('confirmPassword')}
              />
              <button type="button" aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'} onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-subl-grey-400">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="privacy"
            aria-label="privacy"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-subl-grey-300 text-subl-blue-500 focus:ring-subl-blue-200"
          />
          <label htmlFor="privacy" className="text-xs text-subl-grey-500 leading-relaxed">
            By creating an account, I accept <span className="text-subl-blue-500 underline cursor-pointer">Privacy Policy</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !agreed || !allFilled}
          className="w-full py-3.5 bg-subl-blue-500 hover:bg-subl-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account…' : 'Sign Up'}
        </button>

        <p className="text-center text-sm text-subl-grey-500">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/login')} className="text-subl-blue-500 font-medium hover:underline">
            Log In
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
