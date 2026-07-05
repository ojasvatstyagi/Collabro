import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, WifiOff } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import { projectsApi, ChatMessage } from '../../services/api/projects';
import { errorMessage } from '../../utils/errors';

const POLL_INTERVAL_MS = 5000;
const MAX_BACKOFF_MS = 60000;

const ChatTab: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  // Set while the server cannot be reached or refuses us; cleared by the next good poll
  const [connectionProblem, setConnectionProblem] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetches the newest page and reports how it went; it never throws.
  const loadMessages = useCallback(async (): Promise<'ok' | 'failed' | 'forbidden'> => {
    if (!projectId) return 'failed';
    try {
      const res = await projectsApi.getProjectMessages(projectId, 0, 50);
      if (res.data) {
        // The backend returns newest first; the chat shows oldest first so the newest is at the bottom
        setMessages([...res.data.content].reverse());
      }
      setConnectionProblem(null);
      return 'ok';
    } catch (err) {
      setConnectionProblem(errorMessage(err, 'Connection lost'));
      // 403: no longer a member of this project, so there is nothing to keep asking for
      return (err as { status?: number })?.status === 403 ? 'forbidden' : 'failed';
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Poll every 5s; after failures wait twice as long each time (up to a minute) instead of
  // hammering a struggling server, and do not poll while the tab is in the background.
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let delay = POLL_INTERVAL_MS;

    const tick = async () => {
      if (document.visibilityState === 'visible') {
        const outcome = await loadMessages();
        if (cancelled || outcome === 'forbidden') return;
        delay = outcome === 'ok' ? POLL_INTERVAL_MS : Math.min(delay * 2, MAX_BACKOFF_MS);
      }
      timer = setTimeout(tick, delay);
    };
    tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [projectId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = newMessage.trim();
    if (!content || !projectId || isSending) return;

    try {
      setIsSending(true);
      const res = await projectsApi.sendProjectMessage(projectId, content);
      const sent = res.data;
      if (sent) {
        // Functional update and an id check: a poll may have delivered this message already
        setMessages((prev) =>
          prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]
        );
      }
      setNewMessage('');
    } catch (err) {
      // The text stays in the box so nothing the user typed is lost
      toast.error(errorMessage(err, 'Could not send your message'));
    } finally {
      setIsSending(false);
    }
  };

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

      {connectionProblem && (
        <div className="flex items-center gap-2 border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300">
          <WifiOff className="h-4 w-4" />
          {connectionProblem}. Retrying...
        </div>
      )}

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
