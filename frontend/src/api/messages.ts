import api from './client';

export interface MessageResponse {
  id: string;
  application_id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface ConversationSummary {
  application_id: string;
  listing_title: string;
  other_party_id: string;
  other_party_name: string;
  other_party_role: string;
  last_message_body: string;
  last_message_at: string;
  unread_count: number;
}

export const messagesApi = {
  getConversations: () =>
    api.get<ConversationSummary[]>('/messages/conversations'),

  getUnreadCount: () =>
    api.get<{ count: number }>('/messages/conversations/unread-count'),

  getMessages: (applicationId: string, params?: { page?: number; per_page?: number }) =>
    api.get<MessageResponse[]>(`/messages/${applicationId}`, { params }),

  sendMessage: (applicationId: string, body: string) =>
    api.post<MessageResponse>(`/messages/${applicationId}`, { body }),

  markRead: (applicationId: string) =>
    api.put(`/messages/${applicationId}/read`),
};
