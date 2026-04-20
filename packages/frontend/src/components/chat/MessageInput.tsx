import { useState, useRef, useCallback } from 'react';
import { Paperclip, Image, X, Send } from 'lucide-react';
import { useChatStore } from '../../stores/chat.store';
import { getSocket } from '../../socket';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';

export default function MessageInput() {
  const { activeRoom, replyTo, setReplyTo } = useChatStore();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTyping = () => {
    if (!activeRoom) return;
    getSocket().emit('typing:start', activeRoom.id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      getSocket().emit('typing:stop', activeRoom.id);
    }, 2000);
  };

  const sendMessage = useCallback(async () => {
    if (!content.trim() || !activeRoom || sending) return;
    setSending(true);
    try {
      const socket = getSocket();
      socket.emit('message:send', {
        roomId: activeRoom.id,
        content: content.trim(),
        replyToId: replyTo?.id,
      });
      setContent('');
      setReplyTo(null);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      getSocket().emit('typing:stop', activeRoom.id);
    } finally {
      setSending(false);
    }
  }, [content, activeRoom, sending, replyTo]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const uploadFile = async (file: File, type: 'image' | 'file') => {
    if (!activeRoom) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const endpoint = type === 'image' ? `/uploads/image/${activeRoom.id}` : `/uploads/file/${activeRoom.id}`;
      const res = await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Fetch the created message and broadcast
      const msgRes = await api.get(`/messages/room/${activeRoom.id}`);
      const msg = msgRes.data.messages.find((m: any) => m.id === res.data.messageId);
      if (msg) {
        addMessage(msg);
        getSocket().emit('message:send', { roomId: activeRoom.id, content: '', replyToId: undefined });
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) uploadFile(file, 'image');
      }
    }
  };

  if (!activeRoom) return null;

  return (
    <div className="bg-white border-t border-gray-100 p-3 shrink-0">
      {replyTo && (
        <div className="flex items-center gap-2 bg-indigo-50 border-l-2 border-indigo-400 rounded-r-lg px-3 py-1.5 mb-2 text-xs">
          <span className="text-indigo-600 font-medium">Replying to {replyTo.sender.username}</span>
          <span className="text-gray-400 truncate flex-1">{replyTo.content}</span>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-indigo-400 focus-within:bg-white transition">
        <textarea
          value={content}
          onChange={e => { setContent(e.target.value); handleTyping(); }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={1}
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none"
          placeholder={`Message ${activeRoom.name}...`}
          style={{ minHeight: '24px', maxHeight: '120px' }}
        />

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => imageRef.current?.click()}
            disabled={uploading}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Upload image"
          >
            <Image size={16} />
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Attach file"
          >
            <Paperclip size={16} />
          </button>
          <button
            onClick={sendMessage}
            disabled={!content.trim() || sending}
            className={cn(
              'p-1.5 rounded-lg transition',
              content.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-gray-300 cursor-not-allowed'
            )}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-1 px-1">Enter to send · Shift+Enter for new line · Paste image directly</p>

      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => {
        const f = e.target.files?.[0];
        if (f) uploadFile(f, 'image');
        e.target.value = '';
      }} />
      <input ref={fileRef} type="file" className="hidden" onChange={e => {
        const f = e.target.files?.[0];
        if (f) uploadFile(f, 'file');
        e.target.value = '';
      }} />
    </div>
  );
}
