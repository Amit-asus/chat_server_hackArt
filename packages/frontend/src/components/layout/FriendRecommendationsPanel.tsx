import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Check, Loader2, Wifi } from 'lucide-react';
import { useUserSearch, useFriends, useSendFriendRequest } from '../../hooks/useFriends';
import { usePresenceStore } from '../../stores/presence.store';
import { useAuthStore } from '../../stores/auth.store';
import { cn } from '../../lib/utils';

export default function FriendRecommendationsPanel() {
  const [query, setQuery] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { data: allUsers = [], isLoading } = useUserSearch(query);
  const { data: friends = [] } = useFriends();
  const { presence } = usePresenceStore();
  const sendRequest = useSendFriendRequest();
  const currentUser = useAuthStore((s) => s.user);

  const friendIds = new Set(friends.map((f) => f.friend.id));

  const candidates = allUsers
    .filter((u) => u.id !== currentUser?.id && !friendIds.has(u.id))
    .sort((a, b) => {
      const order = { online: 0, afk: 1, offline: 2 };
      const sa = order[presence[a.id] ?? 'offline'] ?? 2;
      const sb = order[presence[b.id] ?? 'offline'] ?? 2;
      return sa - sb;
    });

  const onlineCount = candidates.filter(u => (presence[u.id] ?? 'offline') === 'online').length;

  const handleAdd = async (username: string, userId: string) => {
    setSendingId(userId);
    try {
      await sendRequest.mutateAsync({ username });
      setSentIds((prev) => new Set(prev).add(userId));
    } catch {}
    setSendingId(null);
  };

  return (
    <div className="w-72 h-full border-l border-white/5 bg-[#07070a]/80 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
            <UserPlus size={12} className="text-indigo-400" />
            Discover Operatives
          </h2>
          {onlineCount > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
              <Wifi size={9} />
              {onlineCount} live
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
          {isLoading && query && (
            <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter operatives..."
            className="w-full bg-white/[0.03] border border-white/5 text-white text-xs placeholder-white/20 rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:bg-white/[0.05] transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-3 py-3 space-y-0.5">
        {isLoading && !query && (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={18} className="text-indigo-400/40 animate-spin" />
          </div>
        )}

        {!isLoading && candidates.length === 0 && (
          <div className="py-12 text-center px-4">
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
              {query ? `No results for "${query}"` : 'No other users yet'}
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {candidates.map((user, i) => {
            const sent = sentIds.has(user.id);
            const sending = sendingId === user.id;
            const status = presence[user.id] ?? 'offline';

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white/[0.04] transition-all group"
              >
                {/* Avatar + presence dot */}
                <div className="relative shrink-0">
                  <img
                    src={`https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(user.username)}&backgroundColor=1e1b4b`}
                    alt={user.username}
                    className="w-8 h-8 rounded-xl border border-indigo-500/10 bg-indigo-950"
                  />
                  <div className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#07070a]',
                    status === 'online'  ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' :
                    status === 'afk'    ? 'bg-yellow-400' :
                                          'bg-white/10'
                  )} />
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white/80 truncate uppercase tracking-wide">
                    {user.username}
                  </p>
                  <p className={cn(
                    'text-[9px] font-bold uppercase tracking-wider leading-none mt-0.5',
                    status === 'online' ? 'text-green-400' :
                    status === 'afk'   ? 'text-yellow-400' :
                                         'text-white/20'
                  )}>
                    {status}
                  </p>
                </div>

                {/* Add button */}
                <button
                  onClick={() => !sent && !sending && handleAdd(user.username, user.id)}
                  disabled={sent || sending}
                  className={cn(
                    'shrink-0 p-1.5 rounded-lg transition-all',
                    sent
                      ? 'bg-green-500/10 text-green-400 cursor-default'
                      : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white opacity-0 group-hover:opacity-100'
                  )}
                  title={sent ? 'Request sent' : 'Send friend request'}
                >
                  {sending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : sent ? (
                    <Check size={14} />
                  ) : (
                    <UserPlus size={14} />
                  )}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
        <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">
          {candidates.length} operative{candidates.length !== 1 ? 's' : ''}
        </p>
        {onlineCount > 0 && (
          <p className="text-[9px] text-green-400/60 font-black uppercase tracking-[0.15em]">
            {onlineCount} online
          </p>
        )}
      </div>
    </div>
  );
}
