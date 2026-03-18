import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { applicationsApi } from '../../api/applications';
import { StatusBadge } from '../common/StatusBadge';
import { ContactInfoCard } from './ContactInfoCard';

export function ApplicationList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: myApps, isLoading: loadingMine } = useQuery({
    queryKey: ['applications', 'mine'],
    queryFn: () => applicationsApi.getMine({ per_page: 20 }).then((r) => r.data),
  });

  const { data: received, isLoading: loadingReceived } = useQuery({
    queryKey: ['applications', 'received'],
    queryFn: () => applicationsApi.getMine({ as: 'listing_owner', per_page: 20 }).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'accepted' | 'rejected' | 'withdrawn' }) =>
      applicationsApi.updateStatus(id, status),
    onSuccess: (_data, { status }) => {
      toast.success(`Application ${status}`);
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: () => {
      toast.error('Failed to update application status');
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
                  <Link to={`/listings/${app.listing_id}`} className="text-sm text-primary-600 hover:text-primary-500">
                    {app.listing_title || app.listing_id.slice(0, 8) + '...'}
                  </Link>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={app.status} />
                    {app.status === 'pending' && (
                      <button
                        onClick={() => statusMutation.mutate({ id: app.id, status: 'withdrawn' })}
                        disabled={statusMutation.isPending}
                        className="text-xs text-gray-600 hover:text-gray-800 border border-gray-300 px-2 py-0.5 rounded"
                      >
                        Withdraw
                      </button>
                    )}
                    {app.status === 'accepted' && (
                      <Link
                        to={`/messages/${app.id}`}
                        className="text-xs text-primary-600 hover:text-primary-800 border border-primary-200 px-2 py-0.5 rounded"
                      >
                        Message
                      </Link>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-2">{app.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(app.created_at).toLocaleDateString()}
                </p>
                {app.status === 'accepted' && (
                  <ContactInfoCard applicationId={app.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Received Applications
        </h2>
        {!received?.data.length ? (
          <p className="text-gray-500 text-sm">No applications received.</p>
        ) : (
          <div className="space-y-3">
            {received.data.map((app) => (
              <div key={app.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-1">
                  <p className="text-sm text-gray-600">
                    <span className="text-primary-600">
                      {app.applicant_name || 'Applicant'}
                    </span>
                    {' · '}
                    <Link to={`/listings/${app.listing_id}`} className="text-primary-600 hover:text-primary-500">
                      {app.listing_title || app.listing_id.slice(0, 8) + '...'}
                    </Link>
                  </p>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-sm text-gray-700 mt-2">{app.message}</p>
                <div className="flex gap-2 mt-3">
                  {app.status === 'pending' && (
                    <>
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
                    </>
                  )}
                  {app.status === 'accepted' && (
                    <>
                      <button
                        onClick={() => navigate(`/applications/${app.id}/review`, {
                          state: { listingId: app.listing_id, listingTitle: app.listing_title, applicantName: app.applicant_name }
                        })}
                        className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
                      >
                        Write Review
                      </button>
                      <Link
                        to={`/messages/${app.id}`}
                        className="bg-white text-primary-600 border border-primary-200 px-3 py-1 rounded text-sm hover:bg-primary-50"
                      >
                        Message
                      </Link>
                    </>
                  )}
                </div>
                {app.status === 'accepted' && (
                  <ContactInfoCard applicationId={app.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
