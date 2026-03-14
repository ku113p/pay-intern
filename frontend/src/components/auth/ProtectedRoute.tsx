import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, refreshToken } = useAuthStore();

  if (!isAuthenticated && !refreshToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
