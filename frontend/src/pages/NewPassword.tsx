import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { AuthLayout } from '@/components/AuthLayout';
import { useAppState } from '@/hooks/useAppState';
import { authApi } from '@/api/auth';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

export default function NewPassword() {
  const navigate = useNavigate();
  const { resetEmail, resetCode } = useAppState();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const [password, confirmPassword] = watch(['password', 'confirmPassword']);
  const passwordsMatch = password === confirmPassword;

  const onSubmit = async (data: FormData) => {
    if (!resetEmail) { toast.error('Session expired, please restart'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({ email: resetEmail, code: resetCode ?? '', password: data.password });
      navigate('/password-success');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout showBack onBack={() => navigate('/verify-code')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-subl-grey-900 mb-1">Create New Password</h2>
          <p className="text-sm text-subl-grey-500">A strong password helps prevent unauthorized access to your email account.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="new-password" className="block text-xs font-medium text-subl-grey-600 mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-subl-grey-400" size={16} />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Write your new password"
                className="w-full pl-10 pr-10 py-3 bg-subl-grey-50 border border-subl-grey-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-subl-blue-200 focus:border-subl-blue-300 transition-all"
                {...register('password')}
              />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-subl-grey-400">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-xs font-medium text-subl-grey-600 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-subl-grey-400" size={16} />
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Write your confirmed new password"
                className="w-full pl-10 pr-10 py-3 bg-subl-grey-50 border border-subl-grey-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-subl-blue-200 focus:border-subl-blue-300 transition-all"
                {...register('confirmPassword')}
              />
              <button type="button" aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'} onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-subl-grey-400">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !password || !passwordsMatch}
          className="w-full py-3.5 bg-subl-blue-500 hover:bg-subl-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Create Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
