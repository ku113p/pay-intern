import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuthStore, type ActiveRole } from '../stores/auth';
import { toast } from 'sonner';

export function useRoleSwitch() {
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((s) => s.setTokens);

  return useMutation({
    mutationFn: (role: ActiveRole) => authApi.switchRole(role),
    onSuccess: (res) => {
      setTokens(res.data.access_token, res.data.refresh_token);
      queryClient.removeQueries();
      toast.success('Switched mode');
    },
    onError: () => {
      toast.error('Failed to switch mode');
    },
  });
}
