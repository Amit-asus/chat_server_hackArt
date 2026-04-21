import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Check, X, MessageCircle, UserMinus, Shield, Search, Radio, Cpu, Activity, Loader2, UserCheck } from 'lucide-react';
import { useFriends, useFriendRequests, useSendFriendRequest, useAcceptRequest, useDeclineRequest, useRemoveFriend, useUserSearch } from '../../hooks/useFriends';
import { usePresenceStore } from '../../stores/presence.store';
import { cn } from '../../lib/utils';
import api from '../../lib/axios';
import { useChatStore } from '../../stores/chat.store';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../../socket';

export default function ContactsPage() {
  const { data: friends = [] } = useFriends();
  const { data: requests = [] } = useFriendRequests();
  const { presence } = usePresenceStore();
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptRequest();
  const declineRequest = useDeclineRequest();
  const removeFriend = useRemoveFriend();
  const { setActiveRoom, markRead } = useChatStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendErrors, setSendErrors] = useState<Record<string, string>>({});

  const { data: searchResults = [], isFetching: searching } = useUserSearch(searchQuery);

  const friendIds = new Set(friends.map(f => f.friend.id));

  const handleSend = async (userId: string, username: string) => {
    setSendingId(userId);
    setSendErrors(prev => { const n = { ...prev }; delete n[userId]; return n; });
    try {
      await sendRequest.mutateAsync({ username });
      setSentIds(prev => new Set(prev).add(userId));
    } catch (e: any) {
      setSendErrors(prev => ({ ...prev, [userId]: e.response?.data?.error || 'Failed' }));
    } finally {
      setSendingId(null);
    }
  };

  const openDM = async (friendId: string) => {
    try {
      const res = await api.post(`/rooms/dm/${friendId}`);
      const room = res.data.room;
      setActiveRoom(room);
      markRead(room.id);
      getSocket().emit('room:join', room.id);
      navigate('/');
    } catch {}
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-transparent custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* TOP HUD SECTION */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-1">
              <Activity size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Network Manager</span>
            </div>
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none">
              Operatives<span className="text-indigo-600">.DB</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <StatCard label="Active Nodes" value={friends.length} color="indigo" />
            <StatCard label="Signals" value={requests.length} color="amber" />
          </div>
        </header>

        {/* LIVE USER SEARCH */}
        <section className="relative group max-w-2xl">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl opacity-50 group-focus-within:opacity-100 transition duration-700" />
          <div className="relative bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] flex items-center gap-2">
              <Search size={14} /> Locate Operatives
            </h2>

            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              {searching && (
                <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />
              )}
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by username (min 2 chars)..."
                className="w-full bg-white/[0.03] border border-white/5 text-white placeholder-white/20 rounded-2xl pl-12 pr-12 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all font-medium"
              />
            </div>

            {/* Results */}
            <AnimatePresence mode="wait">
              {searchQuery.trim().length >= 2 && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-2"
                >
                  {searchResults.length === 0 && !searching ? (
                    <p className="text-center text-[10px] text-white/20 font-black uppercase tracking-widest py-4">
                      No operatives found for "{searchQuery}"
                    </p>
                  ) : (
                    searchResults.map(u => {
                      const isFriend = friendIds.has(u.id);
                      const isSent = sentIds.has(u.id);
                      const isSending = sendingId === u.id;
                      const err = sendErrors[u.id];
                      const status = presence[u.id] || 'offline';

                      return (
                        <motion.div
                          key={u.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/20 hover:bg-white/[0.05] transition-all"
                        >
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            <img
                              src={`https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(u.username)}&backgroundColor=1e1b4b`}
                              alt={u.username}
                              className="w-10 h-10 rounded-xl border border-white/10 bg-indigo-950"
                            />
                            <div className={cn(
                              'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0c]',
                              status === 'online' ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' :
                              status === 'afk' ? 'bg-yellow-400' : 'bg-white/10'
                            )} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white uppercase tracking-tight truncate">{u.username}</p>
                            <p className={cn(
                              'text-[9px] font-bold uppercase tracking-wider',
                              status === 'online' ? 'text-green-400' : 'text-white/20'
                            )}>{status}</p>
                          </div>

                          {/* Action */}
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            {isFriend ? (
                              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                                <UserCheck size={11} /> Connected
                              </span>
                            ) : isSent ? (
                              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
                                <Check size={11} /> Request Sent
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSend(u.id, u.username)}
                                disabled={isSending}
                                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-1.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                              >
                                {isSending
                                  ? <Loader2 size={11} className="animate-spin" />
                                  : <><UserPlus size={11} /> Add</>
                                }
                              </button>
                            )}
                            {err && (
                              <p className="text-[9px] text-red-400 font-bold uppercase tracking-tight">{err}</p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* PENDING TRANSMISSIONS */}
          <div className="xl:col-span-4 space-y-6">
            <SectionHeader title="Incoming Signals" icon={<Radio size={16} />} count={requests.length} />
            <div className="space-y-3">
              <AnimatePresence>
                {requests.length === 0 ? (
                  <EmptyPlaceholder text="No unauthorized signals detected" />
                ) : (
                  requests.map((req: any) => (
                    <RequestCard 
                      key={req.id} 
                      req={req} 
                      onAccept={() => acceptRequest.mutate(req.id)} 
                      onDecline={() => declineRequest.mutate(req.id)} 
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ACTIVE NODES GRID */}
          <div className="xl:col-span-8 space-y-6">
            <SectionHeader title="Verified Operatives" icon={<Cpu size={16} />} count={friends.length} />
            {friends.length === 0 ? (
              <EmptyPlaceholder text="Network isolated. Locate operatives to begin sync." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map(({ friendshipId, friend }) => (
                  <OperativeCard 
                    key={friendshipId}
                    friend={friend}
                    status={presence[friend.id] || 'offline'}
                    onMessage={() => openDM(friend.id)}
                    onRemove={() => { if (confirm(`Decommission ${friend.username}?`)) removeFriend.mutate(friend.id); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* HELPER COMPONENTS */

function StatCard({ label, value, color }: { label: string, value: number, color: 'indigo' | 'amber' }) {
  return (
    <div className="px-6 py-2 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center min-w-[100px]">
      <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">{label}</p>
      <p className={cn("text-2xl font-black italic tracking-tighter", color === 'indigo' ? "text-indigo-500" : "text-amber-500")}>
        {value.toString().padStart(2, '0')}
      </p>
    </div>
  );
}

function SectionHeader({ title, icon, count }: { title: string, icon: any, count: number }) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-3 text-white/40">
        <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">{title}</h3>
      </div>
      <div className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded text-white/20 tracking-tighter">
        QTY: {count}
      </div>
    </div>
  );
}

function RequestCard({ req, onAccept, onDecline }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4 group hover:bg-white/[0.05] transition-all"
    >
      <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
        <Shield size={18} className="text-amber-500 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-white uppercase tracking-tight">{req.requester.username}</p>
        <p className="text-[10px] text-amber-500/50 font-bold uppercase tracking-tighter leading-none mt-1">Pending Sync</p>
      </div>
      <div className="flex gap-1.5">
        <button onClick={onAccept} className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all"><Check size={16} /></button>
        <button onClick={onDecline} className="p-2 bg-white/5 text-white/40 rounded-lg hover:bg-red-500 hover:text-white transition-all"><X size={16} /></button>
      </div>
    </motion.div>
  );
}

function OperativeCard({ friend, status, onMessage, onRemove }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-[#0a0a0c]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 flex items-center gap-5 group hover:border-indigo-500/30 transition-all overflow-hidden relative"
    >
      {/* Background Decorative Element */}
      <div className={cn(
        "absolute -right-4 -top-4 w-20 h-20 blur-3xl opacity-10 transition-opacity group-hover:opacity-20",
        status === 'online' ? "bg-green-500" : "bg-white"
      )} />

      <div className="relative shrink-0">
        <img
          src={`https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(friend.username)}&backgroundColor=1e1b4b`}
          alt={friend.username}
          className="w-14 h-14 rounded-2xl border border-white/10 bg-indigo-950/50 p-1 shadow-inner group-hover:border-indigo-500/40 transition-colors"
        />
        <div className={cn(
          'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-[#0a0a0c]',
          status === 'online' ? 'bg-green-500 shadow-[0_0_12px_#22c55e]' : 
          status === 'afk' ? 'bg-yellow-400' : 'bg-white/10'
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-base font-black text-white uppercase tracking-wider truncate">{friend.username}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded",
            status === 'online' ? "text-green-400 bg-green-500/10" : "text-white/20 bg-white/5"
          )}>{status}</span>
        </div>
      </div>

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
        <button
          onClick={onMessage}
          className="p-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20"
        >
          <MessageCircle size={18} />
        </button>
        <button
          onClick={onRemove}
          className="p-3 bg-white/5 text-white/30 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all"
        >
          <UserMinus size={18} />
        </button>
      </div>
    </motion.div>
  );
}

function EmptyPlaceholder({ text }: { text: string }) {
  return (
    <div className="py-12 bg-white/[0.01] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center px-6">
      <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] italic">{text}</p>
    </div>
  );
}