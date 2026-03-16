import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { useAuthStore } from '../stores/auth';
import { format } from 'timeago.js';

export function MessagesPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.getConversations().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', applicationId],
    queryFn: () => messagesApi.getMessages(applicationId!).then((r) => r.data),
    enabled: !!applicationId,
    refetchInterval: 10_000,
  });

  // Mark messages as read when viewing a thread (only once per thread visit)
  const markedReadRef = useRef<string | null>(null);

  useEffect(() => {
    if (applicationId && messages && messages.some((m) => !m.is_read) && markedReadRef.current !== applicationId) {
      markedReadRef.current = applicationId;
      messagesApi.markRead(applicationId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['messages-unread'] });
      });
    }
  }, [applicationId, messages, queryClient]);

  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: () => messagesApi.sendMessage(applicationId!, newMessage),
    onSuccess: () => {
      setNewMessage('');
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate();
  };

  const activeConversation = conversations?.find((c) => c.application_id === applicationId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>

      <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white" style={{ minHeight: '500px' }}>
        {/* Conversation list */}
        <div className={`w-full md:w-80 flex-shrink-0 border-r border-gray-200 overflow-y-auto ${applicationId ? 'hidden md:block' : ''}`}>
          {!conversations?.length && (
            <p className="text-gray-500 text-sm p-4">No conversations yet. Messages appear after an application is accepted.</p>
          )}
          {conversations?.map((conv) => (
            <button
              key={conv.application_id}
              onClick={() => navigate(`/messages/${conv.application_id}`)}
              className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 ${
                conv.application_id === applicationId ? 'bg-indigo-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 text-sm">{conv.other_party_name}</span>
                {conv.unread_count > 0 && (
                  <span className="bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{conv.listing_title}</p>
              <p className="text-xs text-gray-400 mt-1 truncate">{conv.last_message_body}</p>
              <p className="text-xs text-gray-300 mt-0.5">{format(conv.last_message_at + 'Z')}</p>
            </button>
          ))}
        </div>

        {/* Thread */}
        <div className={`flex-1 flex flex-col ${!applicationId ? 'hidden md:flex' : 'flex'}`}>
          {!applicationId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation to start messaging
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="p-3 border-b border-gray-200 flex items-center gap-3">
                <button
                  onClick={() => navigate('/messages')}
                  className="md:hidden text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {activeConversation && (
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{activeConversation.other_party_name}</p>
                    <p className="text-xs text-gray-500">{activeConversation.listing_title}</p>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages?.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 ${
                          isMe
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {!isMe && (
                          <p className="text-xs font-medium text-gray-500 mb-1">{msg.sender_name}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {format(msg.created_at + 'Z')}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={2000}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendMutation.isPending}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
