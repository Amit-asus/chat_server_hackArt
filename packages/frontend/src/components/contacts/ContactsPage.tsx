import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Check, X, MessageCircle, UserMinus, Shield, Search, Users } from 'lucide-react';
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
    <div className="flex-1 overflow-y-auto p-8 bg-transparent custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Operatives<span className="text-indigo-500">_</span></h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mt-1">Personnel Management Interface</p>
          </div>
          <div className="flex gap-4 text-center">
            <div className="px-4 py-1 bg-white/[0.03] border border-white/10 rounded-lg">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Active</p>
              <p className="text-lg font-black text-indigo-400">{friends.length}</p>
            </div>
            <div className="px-4 py-1 bg-white/[0.03] border border-white/10 rounded-lg">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Pending</p>
              <p className="text-lg font-black text-amber-400">{requests.length}</p>
            </div>
          </div>
        </header>

        {/* Add Friend - Futuristic Input */}
        <section className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur opacity-75 rounded-2xl transition group-focus-within:opacity-100" />
          <div className="relative bg-[#0a0a0c]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <UserPlus size={14} className="text-indigo-400" /> 
              Locate New Operative
            </h2>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  value={addUsername}
                  onChange={e => setAddUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
                  placeholder="Enter unique identification..."
                  className="w-full bg-white/[0.03] border border-white/5 text-white placeholder-white/20 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
              <button
                onClick={handleSendRequest}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-indigo-500/50 text-sm uppercase tracking-widest"
              >
                Request Access
              </button>
            </div>
            <AnimatePresence>
              {feedback && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="text-xs text-indigo-400 mt-3 font-bold uppercase tracking-tighter"
                >
                  {feedback}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Pending Requests Column */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] px-2">Incoming Transmissions</h3>
            {requests.length === 0 ? (
              <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-2xl py-12 text-center">
                <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No pending signals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req: any) => (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }}
                    key={req.id} 
                    className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4 group hover:bg-white/[0.05] transition-all"
                  >
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                      <Shield size={18} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white uppercase tracking-tight">{req.requester.username}</p>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-tighter leading-none mt-1 italic italic">Pending Authorization</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => acceptRequest.mutate(req.id)} className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all"><Check size={16} /></button>
                      <button onClick={() => declineRequest.mutate(req.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"><X size={16} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Friends List Column */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] px-2">Established Neural Links</h3>
            {friends.length === 0 ? (
              <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-2xl py-20 text-center">
                <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Operative database empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {friends.map(({ friendshipId, friend }) => {
                  const status = presence[friend.id] || 'offline';
                  return (
                    <motion.div 
                      whileHover={{ scale: 1.01, x: 5 }}
                      key={friendshipId} 
                      className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4 group hover:bg-white/[0.08] transition-all relative overflow-hidden"
                    >
                      {/* Active Status Glow Overlay */}
                      {status === 'online' && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                      )}

                      <div className="relative">
                        <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center text-sm font-black border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                          {friend.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className={cn(
                          'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#050507] shadow-sm',
                          status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 
                          status === 'afk' ? 'bg-yellow-400' : 'bg-white/10'
                        )} />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-black text-white uppercase tracking-wider">{friend.username}</p>
                        <p className={cn(
                          "text-[9px] font-black uppercase tracking-[0.1em]",
                          status === 'online' ? "text-green-400" : "text-white/20"
                        )}>{status}</p>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openDM(friend.id)}
                          className="flex items-center gap-2 text-[10px] font-black bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-400 transition-all uppercase tracking-widest"
                        >
                          <MessageCircle size={14} /> Link
                        </button>
                        <button
                          onClick={() => { if (confirm(`Decommission ${friend.username}?`)) removeFriend.mutate(friend.id); }}
                          className="p-2 bg-red-500/10 text-red-400/40 hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-all"
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}