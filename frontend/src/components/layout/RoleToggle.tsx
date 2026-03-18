import { useAuthStore } from '../../stores/auth';

export function RoleToggle() {
  const { activeRole, setActiveRole, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !activeRole) return null;

  const isIndividual = activeRole === 'individual';
  const nextRole = isIndividual ? 'organization' : 'individual';

  return (
    <button
      onClick={() => setActiveRole(nextRole)}
      className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary-600 text-white shadow-lg opacity-70 hover:opacity-100 transition-all duration-200 flex items-center justify-center"
      title={`Switch to ${nextRole} mode`}
    >
      {isIndividual ? (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ) : (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )}
    </button>
  );
}
