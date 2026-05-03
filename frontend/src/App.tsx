import { Routes, Route, Navigate } from 'react-router';
import { useAppState } from '@/hooks/useAppState';
import { Toaster } from '@/components/ui/sonner';
import Onboarding from './pages/Onboarding';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyCode from './pages/VerifyCode';
import NewPassword from './pages/NewPassword';
import PasswordSuccess from './pages/PasswordSuccess';
import StressAssessment from './pages/StressAssessment';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import SubiAI from './pages/SubiAI';
import Settings from './pages/Settings';

function Landing() {
  const { hasCompletedOnboarding, isAuthenticated, hasCompletedAssessment } = useAppState();

  if (!hasCompletedOnboarding) return <Navigate to="/onboarding" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasCompletedAssessment) return <Navigate to="/assessment" replace />;
  return <Navigate to="/dashboard" replace />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppState();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AssessmentGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasCompletedAssessment } = useAppState();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasCompletedAssessment) return <Navigate to="/assessment" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/new-password" element={<NewPassword />} />
        <Route path="/password-success" element={<PasswordSuccess />} />
        <Route path="/assessment" element={<ProtectedRoute><StressAssessment /></ProtectedRoute>} />
        <Route path="/dashboard" element={<AssessmentGuard><Dashboard /></AssessmentGuard>} />
        <Route path="/articles" element={<AssessmentGuard><Articles /></AssessmentGuard>} />
        <Route path="/articles/:id" element={<AssessmentGuard><ArticleDetail /></AssessmentGuard>} />
        <Route path="/subl-ai" element={<AssessmentGuard><SubiAI /></AssessmentGuard>} />
        <Route path="/settings" element={<AssessmentGuard><Settings /></AssessmentGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
