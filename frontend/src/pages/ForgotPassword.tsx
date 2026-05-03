import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { AuthLayout } from '@/components/AuthLayout';
import { useAppState } from '@/hooks/useAppState';
import { authApi } from '@/api/auth';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { setResetEmail } = useAppState();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const email = watch('email');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: data.email });
      setResetEmail(data.email);
      navigate('/verify-code');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout showBack onBack={() => navigate('/login')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-subl-grey-900 mb-1">Forgot Password</h2>
          <p className="text-sm text-subl-grey-500">Enter your email and we will send you a confirmation code</p>
        </div>

        <div>
          <label htmlFor="forgot-email" className="block text-xs font-medium text-subl-grey-600 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-subl-grey-400" size={16} />
            <input
              id="forgot-email"
              type="email"
              placeholder="Write your email"
              className="w-full pl-10 pr-4 py-3 bg-subl-grey-50 border border-subl-grey-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-subl-blue-200 focus:border-subl-blue-300 transition-all"
              {...register('email')}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full py-3.5 bg-subl-blue-500 hover:bg-subl-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
