import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, Lock, ArrowRight, MessageSquare, ShieldCheck, Cpu, Zap } from 'lucide-react';
import api from '../lib/axios';

const schema = z.object({
  email: z.string().email('Invalid email'),
  username: z.string().min(3, 'Min 3 chars').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
  password: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await api.post('/auth/register', {
        email: data.email,
        username: data.username,
        password: data.password,
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] flex overflow-hidden selection:bg-indigo-500/30">
      {/* LEFT COLUMN: Cinematic Branding */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex w-1/2 bg-[#0a0a0c] relative items-center justify-center p-12 overflow-hidden border-r border-white/5"
      >
        {/* Animated Background Decor */}
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-20 animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full blur-[120px] opacity-10" />
          {/* Cyber Grid Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <div className="w-16 h-16 bg-indigo-600/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
              <MessageSquare size={32} className="text-indigo-400" />
            </div>
            <h1 className="text-6xl font-black tracking-tighter mb-6 uppercase italic leading-none">
              HackArt<span className="text-indigo-500">.OS</span> <br /> 
              <span className="text-3xl text-white/50 not-italic font-medium tracking-normal">User Initialization</span>
            </h1>
          </motion.div>

          <div className="space-y-8">
            {[
              { icon: <ShieldCheck className="text-emerald-400" />, title: "Quantum Encryption", desc: "Military grade end-to-end security protocol." },
              { icon: <Zap className="text-amber-400" />, title: "Instant Sync", desc: "Sub-millisecond data propagation across nodes." },
              { icon: <Cpu className="text-indigo-400" />, title: "Neural Link", desc: "Advanced AI-driven communication interface." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className="flex items-start space-x-4 group"
              >
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover:border-indigo-500/50 transition-colors">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-white font-bold uppercase tracking-widest text-xs">{feature.title}</h4>
                  <p className="text-white/40 text-sm mt-1">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* RIGHT COLUMN: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-[#0a0a0c]/60 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/5 p-10 sm:p-12 relative overflow-hidden">
            <div className="mb-10 relative z-10">
              <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Sign Up</h2>
              <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em]">Deployment Phase: New Operative</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-red-500/10 text-red-400 text-xs font-bold rounded-xl px-4 py-3 mb-6 border border-red-500/20 flex items-center gap-2 uppercase tracking-tight"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  Alert: {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Email Terminal</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                    {...register('email')} 
                    type="email" 
                    className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-white placeholder-white/10 focus:bg-white/[0.05] focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" 
                    placeholder="OPERATIVE@NEXUS.SYSTEM" 
                  />
                </div>
                {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Unique Identifier</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                    {...register('username')} 
                    className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-white placeholder-white/10 focus:bg-white/[0.05] focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" 
                    placeholder="CALLSIGN" 
                  />
                </div>
                {errors.username && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.username.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Security Key</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input 
                      {...register('password')} 
                      type="password" 
                      className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-white placeholder-white/10 focus:bg-white/[0.05] focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" 
                      placeholder="••••••••" 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Verify Key</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input 
                      {...register('confirmPassword')} 
                      type="password" 
                      className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-white placeholder-white/10 focus:bg-white/[0.05] focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" 
                      placeholder="••••••••" 
                    />
                  </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(79, 70, 229, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white font-black uppercase tracking-[0.2em] py-5 rounded-[1.5rem] transition-all flex items-center justify-center space-x-3 mt-4"
              >
                <span>{isSubmitting ? 'Syncing...' : 'Initialize Operative'}</span>
                {!isSubmitting && <ArrowRight size={18} />}
              </motion.button>
            </form>

            <p className="text-center text-[10px] font-bold text-white/20 mt-10 uppercase tracking-widest">
              Already Indexed?{' '}
              <Link to="/login" className="text-indigo-500 hover:text-indigo-400 transition-colors ml-1 border-b border-indigo-500/20">Access Terminal</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}