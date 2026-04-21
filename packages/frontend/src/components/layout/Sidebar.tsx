import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, ChevronDown, Hash, Lock, 
  MessageCircle, Search, Radio, Shield, Users 
} from 'lucide-react';
import { useMyRooms } from '../../hooks/useRooms';
import { useFriends } from '../../hooks/useFriends';
import { useChatStore } from '../../stores/chat.store';
import { usePresenceStore } from '../../stores/presence.store';
import { useAuthStore } from '../../stores/auth.store';
import { Room } from '../../types';
import { cn } from '../../lib/utils';
import CreateRoomModal from '../rooms/CreateRoomModal';
import api from '../../lib/axios';
import { getSocket } from '../../socket';

export default function Sidebar() {
  const { data: rooms = [] } = useMyRooms();
  const { data: friends = [] } = useFriends();
  const { activeRoom, setActiveRoom, markRead, unreadCounts } = useChatStore();
  const { presence } = usePresenceStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [openSections, setOpenSections] = useState({ public: true, private: true, dms: true });
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [search, setSearch] = useState('');

  const publicRooms = rooms.filter(r => r.visibility === 'PUBLIC' && !r.isDirect);
  const privateRooms = rooms.filter(r => r.visibility === 'PRIVATE' && !r.isDirect);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const selectRoom = (room: Room) => {
    setActiveRoom(room);
    markRead(room.id);
    getSocket().emit('room:join', room.id);
    navigate('/');
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
    <>
      <aside className="w-72 bg-[#0a0a0c] border-r border-white/5 flex flex-col shrink-0 overflow-hidden relative">
        {/* Futuristic Background Glow */}
        <div className="absolute top-0 left-0 w-full h-32 bg-indigo-500/10 blur-[80px] -z-10" />
        
        {/* Search Header */}
        <div className="p-4 relative">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Jump to..."
              className="w-full bg-white/[0.03] border border-white/5 text-white placeholder-white/20 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/[0.06] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none px-3 pb-6 space-y-6">
          
          {/* Public Channels */}
          <SidebarSection 
            title="HackArt Channels" 
            icon={<Radio size={14} className="text-emerald-400" />}
            isOpen={openSections.public} 
            onToggle={() => toggleSection('public')}
            onAdd={() => setShowCreateRoom(true)}
          >
            {publicRooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map(room => (
              <RoomItem
                key={room.id}
                icon={<Hash size={16} />}
                name={room.name}
                isActive={activeRoom?.id === room.id}
                unread={unreadCounts[room.id] || 0}
                onClick={() => selectRoom(room)}
                accentColor="indigo"
              />
            ))}
          </SidebarSection>

          {/* Private Channels */}
          <SidebarSection 
            title="Private Vaults" 
            icon={<Shield size={14} className="text-amber-400" />}
            isOpen={openSections.private} 
            onToggle={() => toggleSection('private')}
          >
            {privateRooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map(room => (
              <RoomItem
                key={room.id}
                icon={<Lock size={16} />}
                name={room.name}
                isActive={activeRoom?.id === room.id}
                unread={unreadCounts[room.id] || 0}
                onClick={() => selectRoom(room)}
                accentColor="amber"
              />
            ))}
          </SidebarSection>

          {/* Direct Messages */}
          <SidebarSection 
            title="Active Operatives" 
            icon={<Users size={14} className="text-indigo-400" />}
            isOpen={openSections.dms} 
            onToggle={() => toggleSection('dms')}
          >
            {friends.map(({ friend, friendshipId }) => {
              if (friend.id === user?.id) return null;
              const status = presence[friend.id] || 'offline';
              const dmKey = `dm:${[user?.id, friend.id].sort().join(':')}`;
              return (
                <RoomItem
                  key={friendshipId}
                  isDM
                  status={status}
                  name={friend.username}
                  unread={unreadCounts[dmKey] || 0}
                  onClick={() => openDM(friend.id)}
                  isActive={activeRoom?.id === dmKey} // Adjust logic if needed
                />
              );
            })}
          </SidebarSection>
        </div>

        {/* User Profile Bar */}
        <div className="p-4 bg-white/[0.02] border-t border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="relative">
                <img
                  src={`https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(user?.username ?? 'default')}&backgroundColor=1e1b4b`}
                  alt={user?.username}
                  className="w-9 h-9 rounded-full border border-white/10 shadow-lg shadow-indigo-500/20 bg-indigo-950"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#0a0a0c] rounded-full" />
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user?.username}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-tighter">Status: Online</p>
             </div>
          </div>
        </div>
      </aside>

      <CreateRoomModal open={showCreateRoom} onClose={() => setShowCreateRoom(false)} />
    </>
  );
}

function SidebarSection({ title, icon, children, isOpen, onToggle, onAdd }: any) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 mb-1 group">
        <button 
          onClick={onToggle}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors"
        >
          {icon}
          {title}
          <ChevronDown size={10} className={cn("transition-transform duration-300", !isOpen && "-rotate-90")} />
        </button>
        {onAdd && (
          <button onClick={onAdd} className="text-white/20 hover:text-indigo-400 transition-colors">
            <Plus size={14} />
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-0.5"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoomItem({ name, icon, isActive, unread, onClick, accentColor = "indigo", isDM, status }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 relative group',
        isActive 
          ? 'bg-indigo-500/10 text-white shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]' 
          : 'text-white/50 hover:bg-white/[0.03] hover:text-white'
      )}
    >
      {/* Active Indicator Line */}
      {isActive && (
        <motion.div 
          layoutId="activeGlow"
          className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-r-full shadow-[0_0_10px_#6366f1]" 
        />
      )}

      {isDM ? (
        <div className="relative shrink-0">
          <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold">
            {name[0].toUpperCase()}
          </div>
          <div className={cn(
            "absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-[#0a0a0c]",
            status === 'online' ? "bg-green-500 shadow-[0_0_5px_#22c55e]" : "bg-gray-600"
          )} />
        </div>
      ) : (
        <span className={cn(
          "shrink-0 transition-colors",
          isActive ? `text-${accentColor}-400` : "text-white/20 group-hover:text-white/40"
        )}>
          {icon}
        </span>
      )}

      <span className={cn("truncate font-medium tracking-tight", isActive && "text-indigo-100")}>
        {name}
      </span>

      {unread > 0 && (
        <span className="ml-auto bg-indigo-600 text-white text-[10px] font-black rounded-md px-1.5 py-0.5 shadow-[0_0_10px_rgba(79,70,229,0.5)]">
          {unread}
        </span>
      )}
    </button>
  );
}