import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Search, Check, Loader2, AlertCircle } from 'lucide-react';
import { useInviteUser } from '../../hooks/useRooms';

interface Props {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}

export default function InviteUserModal({ open, onClose, roomId, roomName }: Props) {
  const [username, setUsername] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const inviteUser = useInviteUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setError('');
    setSuccess(false);
    try {
      await inviteUser.mutateAsync({ roomId, username: username.trim() });
      setSuccess(true);
      setUsername('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invitation failed');
    }
  };

  const handleClose = () => {
    setUsername('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-[110] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#0a0a0c]/95 backdrop-blur-3xl border border-amber-500/20 w-full max-w-sm rounded-[28px] overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.15)]"
          >
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-amber-500/10 blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="px-7 py-5 border-b border-white/5 flex items-center justify-between relative">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <UserPlus size={17} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-tight italic">Invite Operative</h2>
                  <p className="text-[9px] text-amber-500/60 font-bold uppercase tracking-[0.2em] truncate max-w-[160px]">
                    vault: {roomName}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 text-white/20 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-7 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                  Username
                </label>
                <div className="relative group">
                  <Search
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-400 transition-colors"
                  />
                  <input
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); setSuccess(false); }}
                    placeholder="Enter exact username..."
                    className="w-full bg-white/[0.03] border border-white/5 focus:border-amber-500/30 text-white placeholder-white/20 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                    autoFocus
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex items-center gap-2 bg-red-500/10 text-red-400 text-xs font-bold p-3 rounded-xl border border-red-500/20 uppercase tracking-tight"
                  >
                    <AlertCircle size={13} /> {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    key="success"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold p-3 rounded-xl border border-emerald-500/20 uppercase tracking-tight"
                  >
                    <Check size={13} /> Invitation dispatched successfully
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={inviteUser.isPending || !username.trim()}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 text-white font-black uppercase tracking-[0.2em] py-3.5 rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2.5 text-xs"
              >
                {inviteUser.isPending ? (
                  <><Loader2 size={14} className="animate-spin" /> Dispatching...</>
                ) : (
                  <><UserPlus size={14} /> Send Invitation</>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
