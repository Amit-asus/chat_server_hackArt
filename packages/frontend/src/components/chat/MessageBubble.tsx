import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reply, Pencil, Trash2, Download, FileText, ImageIcon } from 'lucide-react';
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
    if (!confirm('Decommission this data packet?')) return;
    try {
      await deleteMutation.mutateAsync(message.id);
      removeMessage(message.id, message.roomId);
      getSocket().emit('message:delete', { messageId: message.id, roomId: message.roomId });
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "group flex gap-3 px-4 py-2 transition-all duration-300",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar with Status Ring */}
      <div className="relative shrink-0 mt-1">
        {showAvatar ? (
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black border transition-all duration-500",
            isOwn 
              ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
              : "bg-white/5 border-white/10 text-white/60"
          )}>
            {getInitials(message.sender.username)}
          </div>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* Message Content Area */}
      <div className={cn(
        "flex flex-col max-w-[75%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {showAvatar && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              isOwn ? "text-indigo-400" : "text-white/40"
            )}>
              {message.sender.username}
            </span>
            <span className="text-[9px] text-white/20 font-bold uppercase tracking-tighter">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}

        {/* Reply Context Block */}
        {message.replyTo && (
          <div className="mb-1 bg-white/[0.03] border-l-2 border-indigo-500/50 rounded-r-xl px-3 py-1.5 backdrop-blur-md">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">
              Ref // {message.replyTo.sender.username}
            </p>
            <p className="text-[11px] text-white/40 truncate italic leading-tight">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Bubble Shell */}
        <div className={cn(
          "relative group/bubble p-3 rounded-2xl border transition-all duration-300",
          isOwn 
            ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-50 rounded-tr-none shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:bg-indigo-600/20" 
            : "bg-white/[0.03] border-white/10 text-white/80 rounded-tl-none hover:bg-white/[0.06]"
        )}>
          {isEditing ? (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="bg-black/20 border border-indigo-500/30 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="text-[10px] font-black uppercase text-white/40 hover:text-white">Cancel</button>
                <button onClick={handleEdit} className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 underline">Save Update</button>
              </div>
            </div>
          ) : (
            message.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium tracking-tight">
                {message.content}
              </p>
            )
          )}

          {/* Action Overlay Toolbar */}
          <AnimatePresence>
            {showActions && !isEditing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "absolute -top-10 flex gap-1 p-1 bg-[#121217]/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-20",
                  isOwn ? "right-0" : "left-0"
                )}
              >
                <ActionBtn icon={<Reply size={14} />} title="Reply" onClick={() => setReplyTo(message)} />
                {isOwn && (
                  <>
                    <ActionBtn icon={<Pencil size={14} />} title="Edit" onClick={() => { setIsEditing(true); setEditContent(message.content || ''); }} />
                    <ActionBtn icon={<Trash2 size={14} />} title="Delete" onClick={handleDelete} danger />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Attachments Section */}
        <div className={cn("mt-2 space-y-2", isOwn ? "flex flex-col items-end" : "flex flex-col items-start")}>
          {message.attachments.map(att => (
            <AttachmentPreview key={att.id} attachment={att} isOwn={isOwn} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ActionBtn({ icon, title, onClick, danger }: { icon: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded-lg transition-all duration-200',
        danger ? 'text-red-400 hover:bg-red-500/20' : 'text-white/40 hover:text-indigo-400 hover:bg-white/5'
      )}
    >
      {icon}
    </button>
  );
}

function AttachmentPreview({ attachment, isOwn }: { attachment: any; isOwn: boolean }) {
  const isImage = attachment.mimeType.startsWith('image/');
  const downloadUrl = `/api/uploads/${isImage ? 'images' : 'files'}/${attachment.filename}`;

  if (isImage) {
    return (
      <div className="relative group/att">
        <img
          src={downloadUrl}
          alt={attachment.originalName}
          className="rounded-xl max-w-xs max-h-64 object-cover border border-white/10 hover:border-indigo-500/50 transition-all cursor-pointer"
        />
        <a 
          href={downloadUrl} 
          download 
          className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-lg text-white opacity-0 group-hover/att:opacity-100 transition-opacity"
        >
          <Download size={14} />
        </a>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 max-w-xs group/file hover:bg-white/[0.05] transition-all",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-indigo-400">
        <FileText size={20} />
      </div>
      <div className={cn("min-w-0 flex-1", isOwn ? "text-right" : "text-left")}>
        <p className="text-xs text-white font-bold truncate tracking-tight">{attachment.originalName}</p>
        <p className="text-[9px] text-white/30 font-black uppercase tracking-tighter">{bytesToSize(attachment.size)}</p>
      </div>
      <a href={downloadUrl} download className="text-white/20 hover:text-indigo-400 transition-colors">
        <Download size={16} />
      </a>
    </div>
  );
}