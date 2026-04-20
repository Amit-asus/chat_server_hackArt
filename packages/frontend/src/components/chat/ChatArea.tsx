import { Hash, Lock, Users } from 'lucide-react';
import { useChatStore } from '../../stores/chat.store';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface Props {
  onToggleMembers: () => void;
}

export default function ChatArea({ onToggleMembers }: Props) {
  const { activeRoom } = useChatStore();

  if (!activeRoom) return null;

  const Icon = activeRoom.visibility === 'PRIVATE' ? Lock : Hash;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Room header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <Icon size={18} className="text-indigo-500" />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 text-sm">{activeRoom.name}</h2>
          {activeRoom.description && (
            <p className="text-xs text-gray-400 truncate">{activeRoom.description}</p>
          )}
        </div>
        <button
          onClick={onToggleMembers}
          className="text-gray-400 hover:text-indigo-600 transition p-1.5 rounded-lg hover:bg-indigo-50"
          title="Toggle members"
        >
          <Users size={16} />
        </button>
      </div>

      <MessageList />
      <MessageInput />
    </div>
  );
}
