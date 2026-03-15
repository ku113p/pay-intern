import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '../../api/applications';
import { useAuthStore } from '../../stores/auth';

export function ApplicationList() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: myApps, isLoading: loadingMine } = useQuery({
    queryKey: ['applications', 'mine'],
    queryFn: () => applicationsApi.getMine().then((r) => r.data),
  });

  const { data: received, isLoading: loadingReceived } = useQuery({
    queryKey: ['applications', 'received'],
    queryFn: () => applicationsApi.getMine({ as: 'listing_owner' }).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) =>
      applicationsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  if (loadingMine || loadingReceived) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Applications</h2>
        {!myApps?.data.length ? (
          <p className="text-gray-500 text-sm">No applications yet.</p>
        ) : (
          <div className="space-y-3">
            {myApps.data.map((app) => (
              <div key={app.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-1">
                  <p className="text-sm text-gray-600">Listing: {app.listing_id.slice(0, 8)}...</p>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-sm text-gray-700 mt-2">{app.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(app.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Received Applications
          {user?.role === 'company' ? ' (to your listings)' : ''}
        </h2>
        {!received?.data.length ? (
          <p className="text-gray-500 text-sm">No applications received.</p>
        ) : (
          <div className="space-y-3">
            {received.data.map((app) => (
              <div key={app.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-1">
                  <p className="text-sm text-gray-600">
                    From: {app.applicant_id.slice(0, 8)}... &middot; Listing: {app.listing_id.slice(0, 8)}...
                  </p>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-sm text-gray-700 mt-2">{app.message}</p>
                {app.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => statusMutation.mutate({ id: app.id, status: 'accepted' })}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => statusMutation.mutate({ id: app.id, status: 'rejected' })}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
