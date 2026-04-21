import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Check, Clock } from 'lucide-react';
import { useUserSearch, useFriends, useSendFriendRequest } from '../../hooks/useFriends';
import { useAuthStore } from '../../stores/auth.store';
import { cn } from '../../lib/utils';

export default function FriendRecommendationsPanel() {
  const [query, setQuery] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const { data: searchResults = [], isLoading } = useUserSearch(query);
  const { data: friends = [] } = useFriends();
  const sendRequest = useSendFriendRequest();
  const currentUser = useAuthStore((s) => s.user);

  const friendIds = new Set(friends.map((f) => f.friend.id));

  const candidates = searchResults.filter(
    (u) => u.id !== currentUser?.id && !friendIds.has(u.id)
  );

  const handleAdd = async (username: string, userId: string) => {
    try {
      await sendRequest.mutateAsync({ username });
      setSentIds((prev) => new Set(prev).add(userId));
    } catch {}
  };

  return (
    <div className="w-72 h-full border-l border-white/5 bg-[#07070a]/80 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/5">
        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
          <UserPlus size={12} className="text-indigo-400" />
          Discover Operatives
        </h2>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search username..."
            className="w-full bg-white/[0.03] border border-white/5 text-white text-xs placeholder-white/20 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:bg-white/[0.05] transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-1">
        {isLoading && (
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest text-center py-8">
            Scanning...
          </p>
        )}

        {!isLoading && candidates.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
              {query ? 'No operatives found' : 'No users available'}
            </p>
          </div>
        )}

        <AnimatePresence>
          {candidates.map((user, i) => {
            const sent = sentIds.has(user.id);
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all group"
              >
                <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center text-[10px] font-black border border-indigo-500/10 flex-shrink-0">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="flex-1 text-xs font-bold text-white/70 truncate uppercase tracking-wide">
                  {user.username}
                </span>
                <button
                  onClick={() => !sent && handleAdd(user.username, user.id)}
                  disabled={sent || sendRequest.isPending}
                  className={cn(
                    'flex-shrink-0 p-1.5 rounded-lg transition-all',
                    sent
                      ? 'bg-green-500/10 text-green-400 cursor-default'
                      : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white opacity-0 group-hover:opacity-100'
                  )}
                  title={sent ? 'Request sent' : 'Send friend request'}
                >
                  {sent ? <Check size={14} /> : <UserPlus size={14} />}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer count */}
      <div className="px-5 py-3 border-t border-white/5">
        <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">
          {candidates.length} operative{candidates.length !== 1 ? 's' : ''} found
        </p>
      </div>
    </div>
  );
}
