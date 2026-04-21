import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash, Lock, ShieldCheck, Globe, Cpu, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateRoom } from '../../hooks/useRooms';
import { cn } from '../../lib/utils';

const schema = z.object({
  name: z.string().min(2).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Letters, numbers, - and _ only'),
  description: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateRoomModal({ open, onClose }: Props) {
  const createRoom = useCreateRoom();
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { visibility: 'PUBLIC' },
  });

  const selectedVisibility = watch('visibility');

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await createRoom.mutateAsync(data);
      reset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Initialization failed');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
          {/* Backdrop Blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#0a0a0c]/90 backdrop-blur-3xl border border-white/10 w-full max-w-md rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Initialize Node<span className="text-indigo-500">_</span></h2>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">Channel Creation Protocol</p>
              </div>
              <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
              {error && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="bg-red-500/10 text-red-400 text-xs font-bold p-3 rounded-xl border border-red-500/20 uppercase tracking-tight"
                >
                  System Alert: {error}
                </motion.div>
              )}

              {/* Room Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Node Identifier</label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={16} />
                  <input
                    {...register('name')}
                    className="w-full bg-white/[0.03] border border-white/5 text-white placeholder-white/20 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium"
                    placeholder="e.g. secure-comms"
                  />
                </div>
                {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.name.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Purpose Description</label>
                <input
                  {...register('description')}
                  className="w-full bg-white/[0.03] border border-white/5 text-white placeholder-white/20 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium"
                  placeholder="What is the objective of this channel?"
                />
              </div>

              {/* Visibility Cards */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Access Level</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Public Card */}
                  <label className={cn(
                    "relative flex flex-col items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-300",
                    selectedVisibility === 'PUBLIC' 
                      ? "bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  )}>
                    <input {...register('visibility')} type="radio" value="PUBLIC" className="hidden" />
                    <Globe size={20} className={selectedVisibility === 'PUBLIC' ? "text-indigo-400" : "text-white/20"} />
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", selectedVisibility === 'PUBLIC' ? "text-white" : "text-white/40")}>Public</span>
                  </label>

                  {/* Private Card */}
                  <label className={cn(
                    "relative flex flex-col items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-300",
                    selectedVisibility === 'PRIVATE' 
                      ? "bg-amber-600/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  )}>
                    <input {...register('visibility')} type="radio" value="PRIVATE" className="hidden" />
                    <Lock size={20} className={selectedVisibility === 'PRIVATE' ? "text-amber-400" : "text-white/20"} />
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", selectedVisibility === 'PRIVATE' ? "text-white" : "text-white/40")}>Private</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white font-black uppercase tracking-[0.2em] py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 text-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Initializing...
                  </>
                ) : (
                  <>
                    <Cpu size={16} /> Deploy Node
                  </>
                )}
              </motion.button>

              <div className="pt-2 flex justify-center">
                <div className="flex items-center gap-2 text-[8px] font-black text-white/10 uppercase tracking-[0.3em]">
                  <ShieldCheck size={10} /> Secure Encryption Enabled
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}