import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, refreshToken } = useAuthStore();

  if (!isAuthenticated && !refreshToken) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated && refreshToken) {
    return <div className="flex items-center justify-center min-h-[200px] text-gray-500">Loading...</div>;
  }

  return <>{children}</>;
}
