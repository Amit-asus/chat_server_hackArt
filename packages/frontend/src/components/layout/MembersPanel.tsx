import { useRoomMembers } from '../../hooks/useRooms';
import { useChatStore } from '../../stores/chat.store';
import { usePresenceStore } from '../../stores/presence.store';
import { getInitials, cn } from '../../lib/utils';
import ManageRoomModal from '../rooms/ManageRoomModal';
import { useState } from 'react';
import { Settings } from 'lucide-react';
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
      <aside className="w-52 bg-white border-l border-gray-200 flex flex-col shrink-0">
        <div className="px-3 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Members ({members.length})
          </h3>
          {(isAdminOrOwner || activeRoom.ownerId === user?.id) && (
            <button
              onClick={() => setShowManage(true)}
              className="text-gray-400 hover:text-indigo-600 transition"
              title="Manage room"
            >
              <Settings size={14} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
          {online.length > 0 && (
            <>
              <p className="text-xs text-gray-400 px-2 py-1">Online — {online.length}</p>
              {online.map(m => <MemberRow key={m.userId} member={m} status="online" />)}
            </>
          )}
          {afk.length > 0 && (
            <>
              <p className="text-xs text-gray-400 px-2 py-1 mt-2">AFK — {afk.length}</p>
              {afk.map(m => <MemberRow key={m.userId} member={m} status="afk" />)}
            </>
          )}
          {offline.length > 0 && (
            <>
              <p className="text-xs text-gray-400 px-2 py-1 mt-2">Offline — {offline.length}</p>
              {offline.map(m => <MemberRow key={m.userId} member={m} status="offline" />)}
            </>
          )}
        </div>

        <div className="p-2 border-t border-gray-100">
          <div className="bg-indigo-50 rounded-lg p-2 text-xs text-gray-500">
            <p className="font-medium text-gray-700 truncate">{activeRoom.name}</p>
            <p className="mt-0.5">{activeRoom.visibility === 'PUBLIC' ? 'Public' : 'Private'} room</p>
          </div>
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

function MemberRow({ member, status }: Readonly<{ member: RoomMember; status: string }>) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
      <span className={cn(
        'w-2 h-2 rounded-full shrink-0',
        status === 'online' && 'bg-green-500',
        status === 'afk' && 'bg-yellow-400',
        status === 'offline' && 'bg-gray-300',
      )} />
      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold shrink-0">
        {getInitials(member.user.username)}
      </div>
      <span className={cn(
        'text-sm truncate',
        status === 'offline' ? 'text-gray-400' : 'text-gray-700'
      )}>
        {member.user.username}
      </span>
      {member.role === 'ADMIN' && (
        <span className="ml-auto text-xs text-amber-500 shrink-0">★</span>
      )}
    </div>
  );
}
