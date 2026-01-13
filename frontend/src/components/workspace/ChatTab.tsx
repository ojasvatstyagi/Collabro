import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Button from '../ui/Button';
import { projectsApi, ChatMessage } from '../../services/api/projects';

const ChatTab: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for messages every 5 seconds
  useEffect(() => {
    if (projectId) {
      loadMessages();
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!projectId) return;
    try {
      // Load first page for now
      const res = await projectsApi.getProjectMessages(projectId, 0, 50);
      if (res.success && res.data) {
        // Reverse to show oldest first (if coming from DESC sort of backend)
        // Backend returns DESC (newest first). We want to display oldest at top?
        // Typically chat is stored newest at bottom.
        // So valid sort is DESC.
        // We receive [Newest, ..., Oldest]
        // We want to render [Oldest, ..., Newest] so that Newest is at bottom.
        const sorted = [...res.data.content].reverse();

        // Simple deduplication or overwrite
        setMessages(sorted);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to load messages', err);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !projectId || isSending) return;

    try {
      setIsSending(true);
      const res = await projectsApi.sendProjectMessage(projectId, newMessage);
      if (res.success && res.data) {
        setMessages([...messages, res.data]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Need a way to identify current user for alignment.
  // Ideally we decode JWT or fetch profile.
  // For V1, we just render left/right based on senderId match?
  // We don't have current userId easily here without context or decoding token.
  // Let's assume all messages on left for now, or maybe check a 'me' endpoint.
  // Or just left-align everyone for "Msg Board" style.

  // Actually, let's assume valid "Message Board" style where alignment matters less
  // or we can try to fetch "me" once.

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px] border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden dark:bg-brand-dark-lighter dark:border-gray-700">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-brand-dark">
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="rounded-full bg-gray-100 p-4 mb-4 dark:bg-gray-800">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="flex-shrink-0">
                {msg.senderAvatar ? (
                  <img
                    src={msg.senderAvatar}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange text-xs font-bold">
                    {msg.senderName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col max-w-[80%]">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {msg.senderName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-gray-200 text-gray-800 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            disabled={isSending}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          <Button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            leftIcon={isSending ? undefined : <Send className="h-4 w-4" />}
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatTab;
