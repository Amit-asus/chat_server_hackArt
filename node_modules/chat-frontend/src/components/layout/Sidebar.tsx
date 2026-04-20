import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, ChevronRight, Hash, Lock, MessageCircle } from 'lucide-react';
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

  const [pubOpen, setPubOpen] = useState(true);
  const [privOpen, setPrivOpen] = useState(true);
  const [contactsOpen, setContactsOpen] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [search, setSearch] = useState('');

  const publicRooms = rooms.filter(r => r.visibility === 'PUBLIC' && !r.isDirect);
  const privateRooms = rooms.filter(r => r.visibility === 'PRIVATE' && !r.isDirect);

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

  const filteredPublic = publicRooms.filter(r => r.name.includes(search.toLowerCase()));
  const filteredPrivate = privateRooms.filter(r => r.name.includes(search.toLowerCase()));

  return (
    <>
      <aside className="w-64 bg-[#3d3a6b] flex flex-col shrink-0 overflow-hidden">
        <div className="p-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:bg-white/20"
          />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-4 space-y-1">
          {/* Public Rooms */}
          <div>
            <button
              onClick={() => setPubOpen(v => !v)}
              className="w-full flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white/60 uppercase tracking-wider hover:text-white/80"
            >
              {pubOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Public Rooms
              <button
                onClick={(e) => { e.stopPropagation(); setShowCreateRoom(true); }}
                className="ml-auto text-white/60 hover:text-white"
              >
                <Plus size={14} />
              </button>
            </button>

            {pubOpen && filteredPublic.map(room => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={activeRoom?.id === room.id}
                unread={unreadCounts[room.id] || 0}
                onClick={() => selectRoom(room)}
              />
            ))}
          </div>

          {/* Private Rooms */}
          <div className="mt-2">
            <button
              onClick={() => setPrivOpen(v => !v)}
              className="w-full flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white/60 uppercase tracking-wider hover:text-white/80"
            >
              {privOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Private Rooms
            </button>

            {privOpen && filteredPrivate.map(room => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={activeRoom?.id === room.id}
                unread={unreadCounts[room.id] || 0}
                onClick={() => selectRoom(room)}
              />
            ))}
          </div>

          {/* Contacts */}
          <div className="mt-2">
            <button
              onClick={() => setContactsOpen(v => !v)}
              className="w-full flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white/60 uppercase tracking-wider hover:text-white/80"
            >
              {contactsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Contacts
            </button>

            {contactsOpen && friends.map(({ friend, friendshipId }) => {
              if (friend.id === user?.id) return null;
              const status = presence[friend.id] || 'offline';
              return (
                <button
                  key={friendshipId}
                  onClick={() => openDM(friend.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 text-sm text-white/80 hover:text-white text-left"
                >
                  <PresenceDot status={status} />
                  <span className="truncate">{friend.username}</span>
                  {(unreadCounts[`dm:${[user?.id, friend.id].sort().join(':')}`] || 0) > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                      {unreadCounts[`dm:${[user?.id, friend.id].sort().join(':')}`]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <CreateRoomModal open={showCreateRoom} onClose={() => setShowCreateRoom(false)} />
    </>
  );
}

function RoomItem({ room, isActive, unread, onClick }: {
  room: Room; isActive: boolean; unread: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm text-left transition',
        isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      <span className="flex items-center gap-1.5 truncate">
        {room.visibility === 'PRIVATE'
          ? <Lock size={13} className="shrink-0 opacity-70" />
          : <Hash size={13} className="shrink-0 opacity-70" />
        }
        <span className="truncate">{room.isDirect ? <MessageCircle size={13} className="inline mr-1" /> : ''}{room.name}</span>
      </span>
      {unread > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none shrink-0">
          {unread}
        </span>
      )}
    </button>
  );
}

function PresenceDot({ status }: { status: string }) {
  return (
    <span className={cn(
      'w-2 h-2 rounded-full shrink-0',
      status === 'online' && 'bg-green-400',
      status === 'afk' && 'bg-yellow-400',
      status === 'offline' && 'bg-gray-500',
    )} />
  );
}
