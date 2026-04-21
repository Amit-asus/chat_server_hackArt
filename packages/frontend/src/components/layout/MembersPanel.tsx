import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Shield, Activity, Cpu, Globe, Lock } from 'lucide-react';
import { useRoomMembers } from '../../hooks/useRooms';
import { useChatStore } from '../../stores/chat.store';
import { usePresenceStore } from '../../stores/presence.store';
import { getInitials, cn } from '../../lib/utils';
import ManageRoomModal from '../rooms/ManageRoomModal';
import { useAuthStore } from '../../stores/auth.store';
import type { RoomMember } from '../../types';

export default function MembersPanel() {
  const { activeRoom } = useChatStore();
  const { data: members = [] } = useRoomMembers(activeRoom?.id);
  const { presence } = usePresenceStore();
  const { user } = useAuthStore();
  const [showManage, setShowManage] = useState(false);

  if (!activeRoom) return null;

  const online = members.filter((m: RoomMember) => presence[m.userId] === 'online');
  const afk = members.filter((m: RoomMember) => presence[m.userId] === 'afk');
  const offline = members.filter((m: RoomMember) => !['online', 'afk'].includes(presence[m.userId]));

  const isAdminOrOwner = members.find((m: RoomMember) => m.userId === user?.id)?.role === 'ADMIN';

  return (
    <>
      <aside className="w-60 bg-[#0a0a0c]/60 backdrop-blur-3xl border-l border-white/5 flex flex-col shrink-0 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[80px] -z-10" />

        {/* Tactical Header */}
        <div className="px-4 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-indigo-500 animate-pulse" />
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                Live Roster
              </h3>
            </div>
            <p className="text-[9px] text-indigo-400 font-bold tracking-tighter mt-0.5">
              {members.length} NODES IDENTIFIED
            </p>
          </div>
          {(isAdminOrOwner || activeRoom.ownerId === user?.id) && (
            <motion.button
              whileHover={{ rotate: 90, color: '#818cf8' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowManage(true)}
              className="text-white/20 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            >
              <Settings size={16} />
            </motion.button>
          )}
        </div>

        {/* Scrollable Operatives List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
          <MemberSection title="Active Link" list={online} status="online" />
          <MemberSection title="Dormant" list={afk} status="afk" />
          <MemberSection title="Offline" list={offline} status="offline" />
        </div>

        {/* Room Status Footer */}
        <div className="p-4 bg-white/[0.02] border-t border-white/5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-indigo-600/5 border border-indigo-500/20 rounded-2xl p-3 relative group overflow-hidden"
          >
            {/* Visual Scanline Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent h-1/2 w-full animate-scanline pointer-events-none" />

            <div className="flex items-center gap-2 mb-1">
              {activeRoom.visibility === 'PUBLIC' ? <Globe size={10} className="text-indigo-400" /> : <Lock size={10} className="text-amber-500" />}
              <p className="text-[10px] font-black text-white uppercase tracking-tighter truncate">
                {activeRoom.name}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu size={10} className="text-white/20" />
              <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.2em]">
                {activeRoom.visibility} PROTOCOL
              </p>
            </div>
          </motion.div>
        </div>
      </aside>

      <ManageRoomModal
        open={showManage}
        onClose={() => setShowManage(false)}
        room={activeRoom}
      />
    </>
  );
}

function MemberSection({ title, list, status }: { title: string, list: RoomMember[], status: string }) {
  if (list.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] px-2 mb-3">
        {title} // {list.length}
      </p>
      <div className="space-y-0.5">
        {list.map((m, idx) => (
          <MemberRow key={m.userId} member={m} status={status} delay={idx} />
        ))}
      </div>
    </div>
  );
}

function MemberRow({ member, status, delay }: { member: RoomMember; status: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.03 }}
      whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.03)" }}
      className="flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer group transition-all"
    >
      <div className="relative">
        {/* Modern Squared Avatar */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all duration-300",
          status === 'offline'
            ? "bg-white/5 border-white/5 text-white/20"
            : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 group-hover:border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.05)]"
        )}>
          {getInitials(member.user.username)}
        </div>

        {/* Neon Status Glow */}
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0c]',
          status === 'online' && 'bg-green-500 shadow-[0_0_10px_#22c55e]',
          status === 'afk' && 'bg-yellow-400',
          status === 'offline' && 'bg-white/10',
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <span className={cn(
          'text-xs font-bold tracking-tight block truncate',
          status === 'offline' ? 'text-white/20' : 'text-white/70 group-hover:text-white transition-colors'
        )}>
          {member.user.username}
        </span>
        {status !== 'offline' && (
          <span className="text-[8px] text-white/20 uppercase font-black tracking-widest leading-none">
            Operative
          </span>
        )}
      </div>

      {member.role === 'ADMIN' && (
        <Shield size={10} className="text-amber-500/40 group-hover:text-amber-500 transition-colors shrink-0" />
      )}
    </motion.div>
  );
}