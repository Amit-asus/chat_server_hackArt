import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Users, Hash, Globe, ArrowUpRight, Loader2, Sparkles } from 'lucide-react';
import { usePublicRooms, useJoinRoom, useMyRooms } from '../../hooks/useRooms';
import { useChatStore } from '../../stores/chat.store';
import { useNavigate } from 'react-router-dom';
import { Room } from '../../types';
import { getSocket } from '../../socket';
import CreateRoomModal from './CreateRoomModal';
import { cn } from '../../lib/utils';

export default function PublicRoomsPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { data: publicRooms = [], isLoading } = usePublicRooms(search);
  const { data: myRooms = [] } = useMyRooms();
  const joinRoom = useJoinRoom();
  const { setActiveRoom, markRead } = useChatStore();
  const navigate = useNavigate();

  const myRoomIds = new Set(myRooms.map(r => r.id));

  const emitJoin = (roomId: string) => {
    const s = getSocket();
    if (s.connected) {
      s.emit('room:join', roomId);
    } else {
      s.once('connect', () => s.emit('room:join', roomId));
    }
  };

  const handleJoin = async (room: Room) => {
    try {
      if (myRoomIds.has(room.id)) {
        setActiveRoom(room);
        markRead(room.id);
        emitJoin(room.id);
        navigate('/');
      } else {
        const joined = await joinRoom.mutateAsync(room.id);
        setActiveRoom(joined);
        markRead(joined.id);
        emitJoin(joined.id);
        navigate('/');
      }
    } catch (err: any) {
      console.error(err.response?.data?.error || 'Failed to join frequency');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-transparent custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Globe size={18} className="animate-spin-slow" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Global Frequency Scanner</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              Discovery<span className="text-indigo-500">_</span>
            </h1>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreate(true)}
            className="relative flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black uppercase tracking-widest text-[11px] px-6 py-3.5 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_40px_rgba(99,102,241,0.7)] transition-all overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Sparkles size={14} strokeWidth={2.5} className="text-yellow-300 drop-shadow-[0_0_4px_rgba(253,224,71,0.8)]" />
            <span>Initialize Room</span>
            <Plus size={15} strokeWidth={3} className="opacity-80" />
          </motion.button>
        </header>

        {/* SEARCH CONSOLE */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl opacity-50 group-focus-within:opacity-100 transition duration-500" />
          <div className="relative">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0a0a0c]/60 backdrop-blur-2xl border border-white/5 rounded-[22px] pl-14 pr-6 py-5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all tracking-wide text-lg"
              placeholder="Filter by frequency name or keyword..."
            />
          </div>
        </div>

        {/* MAIN GRID */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Synchronizing Nexus Nodes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
            <AnimatePresence mode="popLayout">
              {publicRooms.map((room, idx) => {
                const isMember = myRoomIds.has(room.id);
                return (
                  <motion.div
                    layout
                    key={room.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-[24px] opacity-0 group-hover:opacity-100 transition duration-500" />
                    <div className="relative h-full bg-white/[0.02] border border-white/5 rounded-[24px] p-6 backdrop-blur-sm flex flex-col hover:bg-white/[0.05] hover:border-white/10 transition-all">
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/10">
                          <Hash size={20} />
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/[0.05] px-2.5 py-1 rounded-lg border border-white/5">
                          <Users size={12} className="text-white/40" />
                          <span className="text-[10px] font-black text-white/60 tracking-tighter">
                            {room._count?.members || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight group-hover:text-indigo-300 transition-colors">
                          {room.name}
                        </h3>
                        <p className="text-sm text-white/30 font-medium line-clamp-2 leading-relaxed italic">
                          {room.description || "No description broadcasted for this node."}
                        </p>
                      </div>

                      <div className="mt-6 pt-6 border-t border-white/5">
                        <button
                          onClick={() => handleJoin(room)}
                          className={cn(
                            "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all",
                            isMember 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black" 
                              : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 hover:-translate-y-0.5"
                          )}
                        >
                          {isMember ? (
                            <>Enter Channel <ArrowUpRight size={14} /></>
                          ) : (
                            <>Initialize Link <Sparkles size={14} /></>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && publicRooms.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 bg-white/[0.01] border border-dashed border-white/10 rounded-[32px]"
          >
            <div className="inline-flex p-4 rounded-full bg-white/5 text-white/20 mb-4">
              <Search size={32} />
            </div>
            <h3 className="text-white/60 font-black uppercase tracking-widest">No Signals Found</h3>
            <p className="text-white/20 text-xs mt-2 font-bold uppercase tracking-tighter italic">Adjust your scanner or initialize a new node.</p>
          </motion.div>
        )}
      </div>

      <CreateRoomModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}