import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Ban, UserMinus, UserPlus, Settings, Hash, Users, Trash2, Save, Cpu } from 'lucide-react';
import { Room } from '../../types';
import { useRoomMembers, useDeleteRoom } from '../../hooks/useRooms';
import { useAuthStore } from '../../stores/auth.store';
import { useChatStore } from '../../stores/chat.store';
import api from '../../lib/axios';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface Props { open: boolean; onClose: () => void; room: Room; }

const TABS = [
  { id: 'Members', icon: <Users size={14} /> },
  { id: 'Banned', icon: <Ban size={14} /> },
  { id: 'Invitations', icon: <UserPlus size={14} /> },
  { id: 'Settings', icon: <Settings size={14} /> }
] as const;

export default function ManageRoomModal({ open, onClose, room }: Props) {
  const [tab, setTab] = useState<typeof TABS[number]['id']>('Members');

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#0a0a0c]/90 backdrop-blur-3xl border border-white/10 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-white/[0.02]">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Command: <span className="text-indigo-500">#{room.name}</span></h2>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1 text-left">Node Configuration Interface</p>
              </div>
              <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex px-6 bg-white/[0.01] border-b border-white/5">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-4 transition-all duration-300",
                    tab === t.id ? "text-indigo-400" : "text-white/30 hover:text-white/60"
                  )}
                >
                  {t.icon}
                  {t.id}
                  {tab === t.id && (
                    <motion.div layoutId="tabGlow" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                  )}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {tab === 'Members' && <MembersTab room={room} />}
              {tab === 'Banned' && <BannedTab room={room} />}
              {tab === 'Invitations' && <InvitationsTab room={room} />}
              {tab === 'Settings' && <SettingsTab room={room} onClose={onClose} />}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function MembersTab({ room }: { room: Room }) {
  const { data: members = [] } = useRoomMembers(room.id);
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const action = async (fn: () => Promise<any>) => {
    try { 
      await fn(); 
      qc.invalidateQueries({ queryKey: ['rooms', room.id, 'members'] }); 
    } catch (e: any) { console.error(e.response?.data?.error || 'Action failed'); }
  };

  return (
    <div className="space-y-3 text-left">
      <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Authorized Operatives</h3>
      {members.map((m: any) => (
        <div key={m.userId} className="flex items-center gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/10">
            {m.user.username.slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-white uppercase tracking-wider">{m.user.username}</p>
            <div className="flex gap-2 mt-1">
              {m.role === 'ADMIN' && <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase tracking-widest border border-amber-500/20">★ Admin</span>}
              {room.ownerId === m.userId && <span className="text-[8px] font-black text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded uppercase tracking-widest border border-indigo-400/20">Node Owner</span>}
            </div>
          </div>
          {room.ownerId === user?.id && m.userId !== user?.id && room.ownerId !== m.userId && (
            <div className="flex gap-2">
              <ActionBtn 
                icon={<Shield size={12} />} 
                active={m.role === 'ADMIN'}
                onClick={() => action(() => m.role === 'ADMIN' 
                  ? api.delete(`/rooms/${room.id}/admin/${m.userId}`) 
                  : api.post(`/rooms/${room.id}/admin/${m.userId}`)
                )} 
              />
              <ActionBtn 
                icon={<Ban size={12} />} 
                danger 
                onClick={() => action(() => api.post(`/rooms/${room.id}/ban/${m.userId}`))} 
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SettingsTab({ room, onClose }: { room: Room; onClose: () => void }) {
  const deleteRoom = useDeleteRoom();
  const { setActiveRoom } = useChatStore();
  const navigate = useNavigate();
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description || '');
  const [visibility, setVisibility] = useState(room.visibility);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/rooms/${room.id}`, { name, description, visibility });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      onClose();
    } catch (e: any) { alert(e.response?.data?.error); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Node Identifier</label>
        <div className="relative">
          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          <input 
            value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/5 text-white rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Manifest Description</label>
        <textarea 
          value={description} onChange={e => setDescription(e.target.value)} rows={2}
          className="w-full bg-white/[0.03] border border-white/5 text-white rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none"
        />
      </div>

      <div className="flex justify-between items-end pt-4">
        <div className="space-y-4 flex flex-col items-start">
           <button onClick={save} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white font-black uppercase tracking-widest text-[10px] px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20">
             {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
             Confirm Overwrite
           </button>
           <div className="flex items-center gap-2 text-[8px] font-black text-white/10 uppercase tracking-[0.3em]">
             <Cpu size={10} /> System Overwrite Protocol
           </div>
        </div>

        <button 
          onClick={() => { if(confirm('Wipe node?')) deleteRoom.mutate(room.id); }}
          className="p-3 text-red-500/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

/* HELPER COMPONENTS */
function ActionBtn({ icon, onClick, danger, active }: { icon: any, onClick: () => void, danger?: boolean, active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2.5 rounded-xl transition-all border",
        danger ? "bg-red-500/5 border-red-500/10 text-red-500/40 hover:bg-red-500 hover:text-white" : 
        active ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
      )}
    >
      {icon}
    </button>
  );
}

function BannedTab({ room }: { room: Room }) {
  return <div className="text-white/40 text-xs italic uppercase tracking-widest py-10">Accessing Blacklisted Operatives...</div>;
}

function InvitationsTab({ room }: { room: Room }) {
  return <div className="text-white/40 text-xs italic uppercase tracking-widest py-10">Initializing Invitation Tunnel...</div>;
}

function Loader2(props: any) { return <Cpu {...props} className={cn(props.className, "animate-spin")} />; }