import { useState } from 'react';
import { Reply, Pencil, Trash2, Download } from 'lucide-react';
import { Message } from '../../types';
import { useAuthStore } from '../../stores/auth.store';
import { useChatStore } from '../../stores/chat.store';
import { useEditMessage, useDeleteMessage } from '../../hooks/useMessages';
import { formatTime, getInitials, bytesToSize, cn } from '../../lib/utils';
import { getSocket } from '../../socket';

interface Props {
  message: Message;
  showAvatar: boolean;
}

export default function MessageBubble({ message, showAvatar }: Props) {
  const { user } = useAuthStore();
  const { setReplyTo, removeMessage } = useChatStore();
  const editMutation = useEditMessage();
  const deleteMutation = useDeleteMessage();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');
  const [showActions, setShowActions] = useState(false);

  const isOwn = message.sender.id === user?.id;

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      const updated = await editMutation.mutateAsync({ messageId: message.id, content: editContent });
      getSocket().emit('message:updated', updated);
      setIsEditing(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return;
    try {
      await deleteMutation.mutateAsync(message.id);
      removeMessage(message.id, message.roomId);
      getSocket().emit('message:delete', { messageId: message.id, roomId: message.roomId });
    } catch {}
  };

  return (
    <div
      className="group flex gap-2.5 px-2 py-0.5 hover:bg-gray-50 rounded-lg"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="w-8 shrink-0">
        {showAvatar && (
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
            isOwn ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-700'
          )}>
            {getInitials(message.sender.username)}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {showAvatar && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className={cn(
              'text-sm font-semibold',
              isOwn ? 'text-indigo-600' : 'text-gray-800'
            )}>
              {message.sender.username}
            </span>
            <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
            {message.isEdited && <span className="text-xs text-gray-400 italic">edited</span>}
          </div>
        )}

        {/* Reply quote */}
        {message.replyTo && (
          <div className="border-l-2 border-indigo-300 pl-2 py-0.5 mb-1 bg-indigo-50 rounded-r text-xs">
            <span className="text-indigo-600 font-medium">{message.replyTo.sender.username}</span>
            <p className="text-gray-500 truncate">{message.replyTo.content}</p>
          </div>
        )}

        {/* Message content */}
        {isEditing ? (
          <div className="flex gap-2">
            <input
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="flex-1 border border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <button onClick={handleEdit} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg">Save</button>
            <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500 px-2">Cancel</button>
          </div>
        ) : (
          message.content && (
            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{message.content}</p>
          )
        )}

        {/* Attachments */}
        {message.attachments.map(att => (
          <AttachmentPreview key={att.id} attachment={att} />
        ))}
      </div>

      {/* Action buttons */}
      {showActions && !isEditing && (
        <div className="flex items-start gap-1 shrink-0 pt-0.5">
          <ActionBtn icon={<Reply size={13} />} title="Reply" onClick={() => setReplyTo(message)} />
          {isOwn && (
            <ActionBtn icon={<Pencil size={13} />} title="Edit" onClick={() => { setIsEditing(true); setEditContent(message.content || ''); }} />
          )}
          {isOwn && (
            <ActionBtn icon={<Trash2 size={13} />} title="Delete" onClick={handleDelete} danger />
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, title, onClick, danger }: { icon: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded-lg transition',
        danger ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
      )}
    >
      {icon}
    </button>
  );
}

function AttachmentPreview({ attachment }: { attachment: any }) {
  const isImage = attachment.mimeType.startsWith('image/');
  const downloadUrl = `/api/uploads/${isImage ? 'images' : 'files'}/${attachment.filename}`;

  if (isImage) {
    return (
      <div className="mt-1 max-w-xs">
        <img
          src={downloadUrl}
          alt={attachment.originalName}
          className="rounded-lg max-h-48 object-cover border border-gray-200"
        />
        {attachment.comment && <p className="text-xs text-gray-500 mt-0.5">{attachment.comment}</p>}
      </div>
    );
  }

  return (
    <div className="mt-1 inline-flex items-center gap-3 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 max-w-xs">
      <span className="text-2xl">📄</span>
      <div className="min-w-0">
        <p className="text-sm text-gray-700 font-medium truncate">{attachment.originalName}</p>
        <p className="text-xs text-gray-400">{bytesToSize(attachment.size)}</p>
        {attachment.comment && <p className="text-xs text-gray-500">{attachment.comment}</p>}
      </div>
      <a href={downloadUrl} download className="text-indigo-500 hover:text-indigo-700 shrink-0">
        <Download size={16} />
      </a>
    </div>
  );
}
