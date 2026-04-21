import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowDown, Database, Cpu } from 'lucide-react';
import { useChatStore } from '../../stores/chat.store';
import { useMessages } from '../../hooks/useMessages';
import MessageBubble from './MessageBubble';
import { formatDate } from '../../lib/utils';
import { Message } from '../../types';
import { cn } from '../../lib/utils';

export default function MessageList() {
  const { activeRoom, messages: storeMessages, setMessages } = useChatStore();
  const roomId = activeRoom?.id;
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMessages(roomId);

  useEffect(() => {
    if (!roomId || !data) return;
    const allMessages = data.pages.flatMap(p => p);
    setMessages(roomId, allMessages);
  }, [data, roomId, setMessages]);

  const messages = roomId ? (storeMessages[roomId] || []) : [];

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages.length]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    isAtBottomRef.current = atBottom;
    setShowScrollDown(!atBottom);

    if (el.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const grouped = groupByDate(messages);

  return (
    <div className="flex-1 relative flex flex-col min-h-0 bg-transparent">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth custom-scrollbar relative"
      >
        {/* Loading States */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="relative">
              <Loader2 size={32} className="animate-spin text-indigo-500/50" />
              <Cpu size={16} className="absolute inset-0 m-auto text-indigo-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500/40 animate-pulse">
              Decrypting Channel Feed...
            </p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {hasNextPage && (
              <button 
                onClick={() => fetchNextPage()}
                className="w-full py-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-indigo-400 transition-colors"
              >
                {isFetchingNextPage ? 'Syncing Older Packets...' : 'Fetch Previous Data Log'}
              </button>
            )}

            {grouped.map(({ date, messages: dayMsgs }) => (
              <div key={date} className="space-y-4 mb-8">
                {/* Date Divider */}
                <div className="sticky top-2 z-10 flex justify-center my-6">
                  <div className="bg-[#121217]/80 backdrop-blur-md border border-white/5 px-4 py-1 rounded-full shadow-2xl">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">
                      Timeline: {date}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  {dayMsgs.map((msg, i) => {
                    const isFirstFromUser = i === 0 || dayMsgs[i - 1].sender.id !== msg.sender.id;
                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        showAvatar={isFirstFromUser}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Floating Scroll-to-Bottom Button */}
      <AnimatePresence>
        {showScrollDown && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-6 right-8 p-3 bg-indigo-600 text-white rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:bg-indigo-500 transition-all z-30 group"
          >
            <ArrowDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Connection Metadata Footer */}
      <div className="absolute bottom-0 left-0 w-full h-12 pointer-events-none bg-gradient-to-t from-[#050507] to-transparent z-20" />
    </div>
  );
}

function groupByDate(messages: Message[]) {
  const groups: Record<string, Message[]> = {};
  // Sort messages ascending by time for grouping logic
  const sorted = [...messages].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  for (const msg of sorted) {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
  }
  return Object.entries(groups).map(([date, msgs]) => ({ date, messages: msgs }));
}