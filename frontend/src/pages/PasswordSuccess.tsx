import { useNavigate } from 'react-router';
import { AuthLayout } from '@/components/AuthLayout';
import { CheckCircle } from 'lucide-react';

export default function PasswordSuccess() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-subl-blue-50 rounded-full flex items-center justify-center">
            <CheckCircle size={32} className="text-subl-blue-500" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-subl-grey-900 mb-2">Successfully</h2>
          <p className="text-sm text-subl-grey-500">You have successfully reset your password.</p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3.5 bg-subl-blue-500 hover:bg-subl-blue-600 text-white rounded-xl font-medium transition-colors"
        >
          Log In
        </button>
      </div>
    </AuthLayout>
  );
}
