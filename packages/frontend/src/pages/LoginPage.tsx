import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, MessageSquare, ShieldCheck, Zap, Cpu } from 'lucide-react';
import api from '../lib/axios';
import { useAuthStore } from '../stores/auth.store';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await api.post('/auth/login', data);
      setAuth(res.data.user, res.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] flex overflow-hidden selection:bg-indigo-500/30">
      {/* LEFT COLUMN: Cinematic Visuals */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex w-1/2 bg-[#0a0a0c] relative items-center justify-center p-12 overflow-hidden border-r border-white/5"
      >
        {/* Animated Background Decor */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-indigo-500 rounded-full blur-[120px] opacity-20 animate-pulse" />
          <div className="absolute bottom-[-5%] right-[-5%] w-96 h-96 bg-indigo-900 rounded-full blur-[120px] opacity-20" />
          {/* Cyber Grid Mask */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-16 h-16 bg-indigo-600/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
              <MessageSquare size={32} className="text-indigo-400" />
            </div>
            <h1 className="text-6xl font-black tracking-tighter mb-6 uppercase italic">
              Access<br /> 
              <span className="text-indigo-500 not-italic">Granted.</span>
            </h1>
          </motion.div>

          <div className="space-y-8 mt-12">
            <div className="flex items-start space-x-4 group">
              <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-all">
                <Zap size={20} className="text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-white uppercase tracking-widest text-xs">Neural Sync</h4>
                <p className="text-white/40 text-sm mt-1">Real-time data propagation across active nodes.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 group">
              <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-all">
                <ShieldCheck size={20} className="text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-white uppercase tracking-widest text-xs">Secure Uplink</h4>
                <p className="text-white/40 text-sm mt-1">End-to-end encrypted tunnels for every session.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* RIGHT COLUMN: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="bg-[#0a0a0c]/60 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 p-10 sm:p-12 relative overflow-hidden">
            <div className="mb-10 text-left relative z-10">
              <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter italic">Terminal Login</h2>
              <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em]">Status: Awaiting Credentials</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-red-500/10 text-red-400 text-[10px] font-black rounded-xl px-4 py-3 mb-6 border border-red-500/20 flex items-center gap-2 uppercase tracking-widest"
                >
                  <Cpu size={14} className="animate-pulse" />
                  Alert: {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Identity: Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                    {...register('email')} 
                    type="email" 
                    className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-white placeholder-white/10 focus:bg-white/[0.05] focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" 
                    placeholder="OPERATIVE@NEXUS.SYS" 
                  />
                </div>
                {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Security: Access Key</label>
                  <a href="#" className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter hover:text-indigo-400 transition-colors underline-offset-4 hover:underline">Restore Key?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                    {...register('password')} 
                    type="password" 
                    className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-white placeholder-white/10 focus:bg-white/[0.05] focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" 
                    placeholder="••••••••" 
                  />
                </div>
                {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.password.message}</p>}
              </div>

              <motion.button 
                whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(79, 70, 229, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white font-black uppercase tracking-[0.2em] py-5 rounded-[1.5rem] transition-all flex items-center justify-center space-x-3 mt-8 shadow-xl shadow-indigo-500/10"
              >
                <span>{isSubmitting ? 'Verifying...' : 'Establish Connection'}</span>
                {!isSubmitting && <ArrowRight size={18} />}
              </motion.button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center relative z-10">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                No active index?{' '}
                <Link to="/register" className="text-indigo-500 hover:text-indigo-400 transition-colors ml-1 border-b border-indigo-500/20">
                  Initialize Operative
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}