import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Image, X, Send, Cpu, Loader2, AlertCircle, FileText } from 'lucide-react';
import { useChatStore } from '../../stores/chat.store';
import { useAuthStore } from '../../stores/auth.store';
import { useRoomMembers } from '../../hooks/useRooms';
import { getSocket } from '../../socket';
import api from '../../lib/axios';
import { cn, bytesToSize } from '../../lib/utils';

interface PendingFile {
  id: string;
  file: File;
  type: 'image' | 'file';
  preview?: string;
}

export default function MessageInput() {
  const { activeRoom, replyTo, setReplyTo } = useChatStore();
  const { user } = useAuthStore();
  const { data: members = [] } = useRoomMembers(activeRoom?.isDirect ? activeRoom.id : undefined);

  const dmPartner = activeRoom?.isDirect ? members.find(m => m.userId !== user?.id) : null;
  const placeholder = activeRoom?.isDirect
    ? `Message ${dmPartner?.user.username ?? '…'}`
    : `Transmit to ${activeRoom?.name ?? ''}...`;

  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Revoke object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      pendingFiles.forEach(pf => { if (pf.preview) URL.revokeObjectURL(pf.preview); });
    };
  }, [pendingFiles]);

  const addPendingFile = (file: File, type: 'image' | 'file') => {
    const preview = type === 'image' ? URL.createObjectURL(file) : undefined;
    setPendingFiles(prev => [...prev, { id: crypto.randomUUID(), file, type, preview }]);
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => {
      const pf = prev.find(p => p.id === id);
      if (pf?.preview) URL.revokeObjectURL(pf.preview);
      return prev.filter(p => p.id !== id);
    });
  };

  const handleTyping = () => {
    if (!activeRoom) return;
    getSocket().emit('typing:start', activeRoom.id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      getSocket().emit('typing:stop', activeRoom.id);
    }, 2000);
  };

  const canSend = (content.trim().length > 0 || pendingFiles.length > 0) && !sending;

  const sendMessage = useCallback(async () => {
    if (!canSend || !activeRoom) return;
    setSending(true);
    setUploadError(null);
    try {
      // Upload pending files first
      for (const pf of pendingFiles) {
        const formData = new FormData();
        formData.append('file', pf.file);
        const endpoint = pf.type === 'image'
          ? `/uploads/image/${activeRoom.id}`
          : `/uploads/file/${activeRoom.id}`;
        await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (pf.preview) URL.revokeObjectURL(pf.preview);
      }
      setPendingFiles([]);

      // Send text message if present
      if (content.trim()) {
        getSocket().emit('message:send', {
          roomId: activeRoom.id,
          content: content.trim(),
          replyToId: replyTo?.id,
        });
        setContent('');
        setReplyTo(null);
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      getSocket().emit('typing:stop', activeRoom.id);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Upload failed';
      setUploadError(msg);
      setTimeout(() => setUploadError(null), 4000);
    } finally {
      setSending(false);
    }
  }, [content, activeRoom, sending, replyTo, setReplyTo, pendingFiles, canSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) addPendingFile(file, 'image');
      }
    }
  };

  if (!activeRoom) return null;

  return (
    <div className="relative px-6 pb-6 pt-2 bg-transparent shrink-0">
      {/* Reply context */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-3 bg-indigo-500/10 backdrop-blur-md border border-indigo-500/20 rounded-t-2xl px-4 py-2 mb-[-1px] relative z-0 mx-2"
          >
            <div className="w-1 h-4 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">
                Referencing Operative // {replyTo.sender.username}
              </p>
              <p className="text-xs text-white/40 truncate italic">{replyTo.content}</p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="p-1 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload error */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 mb-2 text-xs text-red-400"
          >
            <AlertCircle size={14} />
            <span>{uploadError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending file previews */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex flex-wrap gap-2 mb-2 px-1"
          >
            {pendingFiles.map(pf => (
              <div key={pf.id} className="relative group/preview">
                {pf.type === 'image' && pf.preview ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={pf.preview}
                      alt={pf.file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/preview:opacity-100 transition-opacity" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 max-w-[180px]">
                    <FileText size={16} className="text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-white/80 font-bold truncate">{pf.file.name}</p>
                      <p className="text-[9px] text-white/30 uppercase tracking-tighter">{bytesToSize(pf.file.size)}</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => removePendingFile(pf.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1a1a22] border border-white/20 rounded-full flex items-center justify-center text-white/50 hover:text-red-400 hover:border-red-500/40 transition-all opacity-0 group-hover/preview:opacity-100 z-10"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[22px] blur opacity-0 group-focus-within:opacity-20 transition duration-500" />

        <div className="relative flex items-end gap-3 bg-[#121217]/80 backdrop-blur-2xl border border-white/10 rounded-[20px] p-2 pl-4 transition-all duration-300 focus-within:border-indigo-500/40 shadow-2xl">
          <div className="flex-1 py-2">
            <textarea
              value={content}
              onChange={e => { setContent(e.target.value); handleTyping(); }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              rows={1}
              className="w-full bg-transparent text-sm text-white placeholder-white/20 focus:outline-none resize-none custom-scrollbar font-medium"
              placeholder={pendingFiles.length > 0 ? 'Add a caption… (optional)' : placeholder}
              style={{ minHeight: '24px', maxHeight: '120px' }}
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 shrink-0">
            <button
              onClick={() => imageRef.current?.click()}
              disabled={sending}
              className="p-2 text-white/30 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all disabled:opacity-40"
              title="Upload Image"
            >
              <Image size={18} />
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={sending}
              className="p-2 text-white/30 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all disabled:opacity-40"
              title="Attach File"
            >
              <Paperclip size={18} />
            </button>

            <motion.button
              whileHover={{ scale: canSend ? 1.05 : 1 }}
              whileTap={{ scale: canSend ? 0.95 : 1 }}
              onClick={sendMessage}
              disabled={!canSend}
              className={cn(
                'p-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center',
                canSend
                  ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                  : 'bg-white/5 text-white/10 cursor-not-allowed'
              )}
            >
              {sending
                ? <Loader2 size={18} className="animate-spin" />
                : <Send size={18} className={cn(canSend && 'translate-x-0.5 -translate-y-0.5')} />
              }
            </motion.button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center px-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">
            <Cpu size={10} className="text-indigo-500/50" />
            <span>Neural Link Stable</span>
          </div>
        </div>
        <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest">
          [ Enter ] Transmit · [ Shift+Ent ] New Line
        </p>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => {
          Array.from(e.target.files ?? []).forEach(f => addPendingFile(f, 'image'));
          e.target.value = '';
        }}
      />
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => {
          Array.from(e.target.files ?? []).forEach(f => addPendingFile(f, 'file'));
          e.target.value = '';
        }}
      />
    </div>
  );
}
