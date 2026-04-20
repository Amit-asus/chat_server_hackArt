import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../../stores/chat.store';
import { useMessages } from '../../hooks/useMessages';
import MessageBubble from './MessageBubble';
import { formatDate } from '../../lib/utils';
import { Message } from '../../types';
import { Loader2 } from 'lucide-react';

export default function MessageList() {
  const { activeRoom, messages: storeMessages, setMessages, prependMessages } = useChatStore();
  const roomId = activeRoom?.id;
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMessages(roomId);

  // Populate store from query data
  useEffect(() => {
    if (!roomId || !data) return;
    const allMessages = data.pages.flatMap(p => p);
    setMessages(roomId, allMessages);
  }, [data, roomId]);

  const messages = roomId ? (storeMessages[roomId] || []) : [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50;

    // Load more when near top
    if (el.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Group messages by date
  const grouped = groupByDate(messages);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4"
    >
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 size={20} className="animate-spin text-indigo-400" />
        </div>
      )}

      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <Loader2 size={16} className="animate-spin text-gray-400" />
        </div>
      )}

      {grouped.map(({ date, messages: dayMsgs }) => (
        <div key={date}>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">{date}</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="space-y-1">
            {dayMsgs.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                showAvatar={i === 0 || dayMsgs[i - 1].sender.id !== msg.sender.id}
              />
            ))}
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}

function groupByDate(messages: Message[]) {
  const groups: Record<string, Message[]> = {};
  for (const msg of messages) {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
  }
  return Object.entries(groups).map(([date, msgs]) => ({ date, messages: msgs }));
}
