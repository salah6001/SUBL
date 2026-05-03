import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { AuthLayout } from '@/components/AuthLayout';
import { useAppState } from '@/hooks/useAppState';
import { authApi } from '@/api/auth';
import { toast } from 'sonner';

export default function VerifyCode() {
  const navigate = useNavigate();
  const { resetEmail, setResetCode } = useAppState();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < code.length - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { toast.error('Email not found, please restart'); return; }
    setLoading(true);
    try {
      await authApi.verifyCode({ email: resetEmail, code: code.join('') });
      setResetCode(code.join(''));
      navigate('/new-password');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!resetEmail) return;
    try {
      await authApi.forgotPassword({ email: resetEmail });
      toast.success('Code resent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend');
    }
  };

  return (
    <AuthLayout showBack onBack={() => navigate('/forgot-password')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-subl-grey-900 mb-1">Enter Verification Code</h2>
          <p className="text-sm text-subl-grey-500">Enter the confirmation code sent to your email</p>
        </div>

        <div className="flex gap-3 justify-center">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-lg font-semibold bg-subl-grey-50 border border-subl-grey-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-subl-blue-200 focus:border-subl-blue-300 transition-all"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || code.some((d) => !d)}
          className="w-full py-3.5 bg-subl-blue-500 hover:bg-subl-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Verifying…' : 'Verify Account'}
        </button>

        <p className="text-center text-sm text-subl-grey-500">
          Didn't receive the code?{' '}
          <button type="button" onClick={handleResend} className="text-subl-blue-500 font-medium hover:underline">
            Resend
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
