import { useState } from 'react';
import { UserPlus, Check, X, MessageCircle, UserMinus } from 'lucide-react';
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
  const [addMsg, setAddMsg] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSendRequest = async () => {
    if (!addUsername.trim()) return;
    try {
      await sendRequest.mutateAsync({ username: addUsername.trim() });
      setFeedback(`Friend request sent to ${addUsername}`);
      setAddUsername('');
    } catch (e: any) {
      setFeedback(e.response?.data?.error || 'Failed');
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
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Contacts</h1>

        {/* Add Friend */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Add Friend</h2>
          <div className="flex gap-2">
            <input
              value={addUsername}
              onChange={e => setAddUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
              placeholder="Enter username..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSendRequest}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-xl transition"
            >
              <UserPlus size={15} /> Send Request
            </button>
          </div>
          {feedback && <p className="text-sm text-gray-500 mt-2">{feedback}</p>}
        </div>

        {/* Pending Requests */}
        {requests.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl mb-5 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-700">Friend Requests ({requests.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {requests.map((req: any) => (
                <div key={req.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold">
                    {req.requester.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{req.requester.username}</p>
                    {req.message && <p className="text-xs text-gray-500 truncate">"{req.message}"</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest.mutate(req.id)}
                      className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                    >
                      <Check size={12} /> Accept
                    </button>
                    <button
                      onClick={() => declineRequest.mutate(req.id)}
                      className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition"
                    >
                      <X size={12} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">Friends ({friends.length})</h2>
          </div>
          {friends.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">No friends yet. Add some above!</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {friends.map(({ friendshipId, friend }) => {
                const status = presence[friend.id] || 'offline';
                return (
                  <div key={friendshipId} className="px-4 py-3 flex items-center gap-3">
                    <span className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      status === 'online' && 'bg-green-500',
                      status === 'afk' && 'bg-yellow-400',
                      status === 'offline' && 'bg-gray-300',
                    )} />
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold">
                      {friend.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{friend.username}</p>
                      <p className="text-xs text-gray-400 capitalize">{status}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDM(friend.id)}
                        className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition"
                      >
                        <MessageCircle size={12} /> Message
                      </button>
                      <button
                        onClick={() => { if (confirm(`Remove ${friend.username}?`)) removeFriend.mutate(friend.id); }}
                        className="flex items-center gap-1 text-xs bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition"
                      >
                        <UserMinus size={12} /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
