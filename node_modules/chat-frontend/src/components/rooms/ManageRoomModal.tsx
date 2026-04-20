import { useState } from 'react';
import { X, Shield, Ban, UserMinus, UserPlus } from 'lucide-react';
import { Room } from '../../types';
import { useRoomMembers, useDeleteRoom, useLeaveRoom } from '../../hooks/useRooms';
import { useAuthStore } from '../../stores/auth.store';
import { useChatStore } from '../../stores/chat.store';
import api from '../../lib/axios';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface Props { open: boolean; onClose: () => void; room: Room; }

const TABS = ['Members', 'Banned', 'Invitations', 'Settings'] as const;

export default function ManageRoomModal({ open, onClose, room }: Props) {
  const [tab, setTab] = useState<typeof TABS[number]>('Members');
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Manage: #{room.name}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="flex border-b border-gray-100 px-4">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm px-4 py-3 border-b-2 transition ${tab === t ? 'border-indigo-500 text-indigo-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'Members' && <MembersTab room={room} onClose={onClose} />}
          {tab === 'Banned' && <BannedTab room={room} />}
          {tab === 'Invitations' && <InvitationsTab room={room} />}
          {tab === 'Settings' && <SettingsTab room={room} onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}

function MembersTab({ room, onClose }: { room: Room; onClose: () => void }) {
  const { data: members = [] } = useRoomMembers(room.id);
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const action = async (fn: () => Promise<any>) => {
    try { await fn(); qc.invalidateQueries({ queryKey: ['rooms', room.id, 'members'] }); }
    catch (e: any) { alert(e.response?.data?.error || 'Action failed'); }
  };

  return (
    <div className="space-y-2">
      {members.map((m: any) => (
        <div key={m.userId} className="flex items-center gap-3 py-2 border-b border-gray-50">
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-800">{m.user.username}</span>
            {m.role === 'ADMIN' && <span className="ml-2 text-xs text-amber-500">★ Admin</span>}
            {room.ownerId === m.userId && <span className="ml-2 text-xs text-indigo-500">Owner</span>}
          </div>
          {room.ownerId === user?.id && m.userId !== user?.id && room.ownerId !== m.userId && (
            <div className="flex gap-1">
              {m.role === 'ADMIN'
                ? <Btn label="Remove admin" onClick={() => action(() => api.delete(`/rooms/${room.id}/admin/${m.userId}`))} />
                : <Btn label="Make admin" icon={<Shield size={12} />} onClick={() => action(() => api.post(`/rooms/${room.id}/admin/${m.userId}`))} />
              }
              <Btn label="Ban" icon={<Ban size={12} />} danger onClick={() => action(() => api.post(`/rooms/${room.id}/ban/${m.userId}`))} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BannedTab({ room }: { room: Room }) {
  const [banned, setBanned] = useState<any[]>([]);
  const qc = useQueryClient();

  useState(() => {
    api.get(`/rooms/${room.id}/banned`).then(r => setBanned(r.data.banned)).catch(() => {});
  });

  const unban = async (userId: string) => {
    try {
      await api.delete(`/rooms/${room.id}/ban/${userId}`);
      setBanned(b => b.filter(u => u.userId !== userId));
    } catch (e: any) { alert(e.response?.data?.error); }
  };

  return (
    <div>
      {banned.length === 0 ? <p className="text-sm text-gray-400">No banned users</p> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="text-left py-2">Username</th>
              <th className="text-left py-2">Banned by</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {banned.map((b: any) => (
              <tr key={b.userId} className="border-b border-gray-50">
                <td className="py-2 text-gray-700">{b.user.username}</td>
                <td className="py-2 text-gray-500">{b.bannedBy.username}</td>
                <td className="py-2">
                  <button onClick={() => unban(b.userId)} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg">Unban</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function InvitationsTab({ room }: { room: Room }) {
  const [username, setUsername] = useState('');
  const [msg, setMsg] = useState('');

  const invite = async () => {
    try {
      await api.post(`/rooms/${room.id}/invite`, { username });
      setMsg(`Invitation sent to ${username}`);
      setUsername('');
    } catch (e: any) { setMsg(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">Invite a user by username</p>
      <div className="flex gap-2">
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Enter username..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
        />
        <button onClick={invite} className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
          Send Invite
        </button>
      </div>
      {msg && <p className="text-sm text-gray-500 mt-2">{msg}</p>}
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
    } catch (e: any) { alert(e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete room "${room.name}"? This cannot be undone.`)) return;
    try {
      await deleteRoom.mutateAsync(room.id);
      setActiveRoom(null);
      navigate('/');
      onClose();
    } catch (e: any) { alert(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Room name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
        <div className="flex gap-4">
          {['PUBLIC', 'PRIVATE'].map(v => (
            <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" checked={visibility === v} onChange={() => setVisibility(v as any)} className="accent-indigo-600" />
              {v}
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-between pt-2">
        <button onClick={save} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm px-5 py-2 rounded-xl transition">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        <button onClick={handleDelete} className="bg-red-50 hover:bg-red-100 text-red-600 text-sm px-5 py-2 rounded-xl border border-red-200 transition">
          Delete room
        </button>
      </div>
    </div>
  );
}

function Btn({ label, onClick, danger, icon }: { label: string; onClick: () => void; danger?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition ${danger ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
    >
      {icon}{label}
    </button>
  );
}
