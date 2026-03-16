import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api/notifications';
import { Pagination } from '../components/common/Pagination';
import { format } from 'timeago.js';

export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list', { unreadOnly, page }],
    queryFn: () =>
      notificationsApi.getAll({ unread_only: unreadOnly || undefined, page, per_page: 20 }).then((r) => r.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleClick = (notif: { id: string; is_read: boolean; link: string }) => {
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }
    navigate(notif.link);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <button
          onClick={() => markAllReadMutation.mutate()}
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Mark all as read
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setUnreadOnly(false); setPage(1); }}
          className={`px-3 py-1 rounded text-sm ${!unreadOnly ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          All
        </button>
        <button
          onClick={() => { setUnreadOnly(true); setPage(1); }}
          className={`px-3 py-1 rounded text-sm ${unreadOnly ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Unread
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : !data?.data.length ? (
        <p className="text-gray-500 text-center py-12">No notifications</p>
      ) : (
        <div className="space-y-1">
          {data.data.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`w-full text-left px-4 py-3 rounded-lg flex gap-3 hover:bg-gray-50 ${
                !notif.is_read ? 'bg-indigo-50' : 'bg-white'
              }`}
            >
              {!notif.is_read && (
                <span className="mt-1.5 h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
              )}
              <div className={!notif.is_read ? '' : 'pl-5'}>
                <p className={`text-sm ${!notif.is_read ? 'font-medium' : ''} text-gray-900`}>
                  {notif.title}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{notif.body}</p>
                <p className="text-xs text-gray-400 mt-1">{format(notif.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {data && data.pagination.total_pages > 1 && (
        <div className="mt-6">
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.total_pages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </div>
      )}
    </div>
  );
}
