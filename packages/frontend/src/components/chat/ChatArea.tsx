import { useState } from 'react';
import { motion } from 'framer-motion';
import { Hash, Lock, Users, Terminal, Info, ShieldCheck, UserPlus, MessageCircle } from 'lucide-react';
import { useChatStore } from '../../stores/chat.store';
import { useAuthStore } from '../../stores/auth.store';
import { useRoomMembers } from '../../hooks/useRooms';
import { usePresenceStore } from '../../stores/presence.store';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { cn } from '../../lib/utils';
import InviteUserModal from '../rooms/InviteUserModal';

interface Props {
  onToggleMembers: () => void;
}

export default function ChatArea({ onToggleMembers }: Props) {
  const { activeRoom } = useChatStore();
  const { user } = useAuthStore();
  const { presence } = usePresenceStore();
  const [showInvite, setShowInvite] = useState(false);

  const { data: members = [] } = useRoomMembers(activeRoom?.isDirect ? activeRoom.id : undefined);

  if (!activeRoom) return null;

  const isDM = activeRoom.isDirect;
  const dmPartner = isDM ? members.find(m => m.userId !== user?.id) : null;
  const displayName = isDM ? (dmPartner?.user.username ?? '…') : activeRoom.name;
  const dmStatus = dmPartner ? (presence[dmPartner.userId] ?? 'offline') : null;

  const Icon = isDM ? MessageCircle : activeRoom.visibility === 'PRIVATE' ? Lock : Hash;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 flex flex-col overflow-hidden bg-transparent relative"
    >
      {/* HEADER: Floating Glass Console */}
      <div className="z-20 bg-[#0a0a0c]/40 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4 shrink-0 shadow-2xl">
        {/* Room Identity Icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 shadow-lg",
          !isDM && activeRoom.visibility === 'PRIVATE'
            ? "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/10"
            : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-indigo-500/10"
        )}>
          <Icon size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-black text-white text-base tracking-tighter uppercase italic">
              {displayName}
            </h2>
            {!isDM && activeRoom.visibility === 'PRIVATE' && (
              <span className="flex items-center gap-1 text-[8px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-[0.2em]">
                <ShieldCheck size={10} /> Encrypted
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-0.5">
            {isDM ? (
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  dmStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse' :
                  dmStatus === 'afk'    ? 'bg-yellow-400' : 'bg-white/20'
                )} />
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  {dmStatus === 'online' ? 'Online' : dmStatus === 'afk' ? 'Away' : 'Offline'}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Feed Active</p>
              </div>
            )}
            {!isDM && activeRoom.description && (
              <>
                <span className="text-white/10 text-xs">|</span>
                <p className="text-[10px] text-white/30 font-medium truncate max-w-[300px]">
                  {activeRoom.description}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {}}
            className="text-white/30 hover:text-white transition p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
            title="System Info"
          >
            <Info size={18} />
          </button>

          {activeRoom.visibility === 'PRIVATE' && !activeRoom.isDirect && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 text-white/40 hover:text-amber-400 transition-all px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 group"
              title="Invite Operative"
            >
              <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Invite</span>
            </button>
          )}

          <div className="w-px h-6 bg-white/5 mx-1" />

          <button
            onClick={onToggleMembers}
            className="flex items-center gap-2 text-white/40 hover:text-indigo-400 transition-all px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 group"
            title="Operatives"
          >
            <Users size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Operatives</span>
          </button>
        </div>
      </div>

      {/* MESSAGE STREAM */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Subtle Background Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-10" />
        
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
          <MessageList />
        </div>
      </div>

      {/* INPUT AREA: Floating Design */}
      <div className="px-6 pb-6 pt-2 bg-gradient-to-t from-[#050507] via-[#050507]/90 to-transparent">
        <div className="relative">
          {/* Glowing accent under the input */}
          <div className="absolute -inset-1 bg-indigo-500/10 blur-xl opacity-50 rounded-2xl" />
          <MessageInput />
        </div>
        <div className="mt-3 flex justify-between px-2 text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><Terminal size={8} /> Protocol: E2EE-V4</span>
            <span>Status: Connected</span>
          </div>
          <div className="animate-pulse">Buffer: Synced</div>
        </div>
      </div>

      <InviteUserModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        roomId={activeRoom.id}
        roomName={activeRoom.name}
      />
    </motion.div>
  );
}