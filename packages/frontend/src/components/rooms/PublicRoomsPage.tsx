import { useState } from 'react';
import { Search, Plus, Users } from 'lucide-react';
import { usePublicRooms, useJoinRoom, useMyRooms, useCreateRoom } from '../../hooks/useRooms';
import { useChatStore } from '../../stores/chat.store';
import { useNavigate } from 'react-router-dom';
import { Room } from '../../types';
import { getSocket } from '../../socket';
import CreateRoomModal from './CreateRoomModal';

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
      alert(err.response?.data?.error || 'Failed to join room');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Public Rooms</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-xl transition"
          >
            <Plus size={16} /> Create Room
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="Search rooms..."
          />
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : publicRooms.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No rooms found</div>
        ) : (
          <div className="space-y-3">
            {publicRooms.map(room => (
              <div key={room.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between hover:border-indigo-300 transition">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">#{room.name}</p>
                  {room.description && <p className="text-sm text-gray-500 mt-0.5">{room.description}</p>}
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Users size={12} />
                    <span>{room._count?.members || 0} members</span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoin(room)}
                  className={
                    myRoomIds.has(room.id)
                      ? 'text-sm bg-indigo-50 text-indigo-600 border border-indigo-200 px-4 py-1.5 rounded-xl shrink-0 ml-4'
                      : 'text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl transition shrink-0 ml-4'
                  }
                >
                  {myRoomIds.has(room.id) ? 'Open ✓' : 'Join'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateRoomModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
