import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Image, X, Send, Cpu, Loader2 } from 'lucide-react';
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
      getSocket().emit('message:send', {
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
  }, [content, activeRoom, sending, replyTo, setReplyTo]);

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
      await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Logic for broadcasting handled via server socket events generally
    } catch (err: any) {
      console.error(err.response?.data?.error || 'Upload failed');
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
    <div className="relative px-6 pb-6 pt-2 bg-transparent shrink-0">
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

      <div className="relative z-10 group">
        {/* Glow effect when active */}
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
              placeholder={`Transmit to ${activeRoom.name}...`}
              style={{ minHeight: '24px', maxHeight: '120px' }}
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 shrink-0">
            <button
              onClick={() => imageRef.current?.click()}
              disabled={uploading}
              className="p-2 text-white/30 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all"
              title="Upload Image"
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Image size={18} />}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="p-2 text-white/30 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all"
              title="Attach File"
            >
              <Paperclip size={18} />
            </button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!content.trim() || sending}
              className={cn(
                'p-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center',
                content.trim() 
                  ? 'bg-indigo-600 text-white shadow-indigo-500/20' 
                  : 'bg-white/5 text-white/10 cursor-not-allowed'
              )}
            >
              <Send size={18} className={cn(content.trim() && "translate-x-0.5 -translate-y-0.5")} />
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

      {/* Hidden Inputs */}
      <input 
        ref={imageRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f, 'image');
          e.target.value = '';
        }} 
      />
      <input 
        ref={fileRef} 
        type="file" 
        className="hidden" 
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f, 'file');
          e.target.value = '';
        }} 
      />
    </div>
  );
}