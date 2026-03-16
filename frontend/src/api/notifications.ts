import api from './client';
import type { PaginatedResponse } from './listings';

export interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  email_application_received: boolean;
  email_application_accepted: boolean;
  email_application_rejected: boolean;
  email_review_created: boolean;
  email_review_consented: boolean;
}

export const notificationsApi = {
  getAll: (params?: { unread_only?: boolean; page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),

  markRead: (id: string) =>
    api.put(`/notifications/${id}/read`),

  markAllRead: () =>
    api.put('/notifications/read-all'),

  getPreferences: () =>
    api.get<NotificationPreferences>('/notifications/preferences'),

  updatePreferences: (data: Partial<Omit<NotificationPreferences, 'user_id'>>) =>
    api.put<NotificationPreferences>('/notifications/preferences', data),
};
