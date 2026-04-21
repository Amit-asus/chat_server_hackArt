import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Check, X, MessageCircle, UserMinus, Shield, Search, Radio, Cpu, Activity } from 'lucide-react';
import { useFriends, useFriendRequests, useSendFriendRequest, useAcceptRequest, useDeclineRequest, useRemoveFriend } from '../../hooks/useFriends';
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

  const [addUsername, setAddUsername] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSendRequest = async () => {
    if (!addUsername.trim()) return;
    try {
      await sendRequest.mutateAsync({ username: addUsername.trim() });
      setFeedback(`Protocol initiated: Request sent to ${addUsername}`);
      setAddUsername('');
      setTimeout(() => setFeedback(''), 4000);
    } catch (e: any) {
      setFeedback(e.response?.data?.error || 'Authorization failed');
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

        {/* ADD OPERATIVE: GHOST INPUT */}
        <section className="relative group max-w-2xl">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl opacity-50 group-focus-within:opacity-100 transition duration-700" />
          <div className="relative bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
              <Search size={14} /> Global Operative Search
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  value={addUsername}
                  onChange={e => setAddUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
                  placeholder="Enter operative callsign..."
                  className="w-full bg-white/[0.03] border border-white/5 text-white placeholder-white/20 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all font-medium"
                />
              </div>
              <button
                onClick={handleSendRequest}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <UserPlus size={16} /> Link Operative
              </button>
            </div>
            <AnimatePresence>
              {feedback && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="text-[10px] text-indigo-400 mt-4 font-black uppercase tracking-widest bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10"
                >
                  {feedback}
                </motion.p>
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