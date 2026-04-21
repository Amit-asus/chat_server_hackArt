import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
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
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* LEFT COLUMN: Visual Branding */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex w-1/2 bg-indigo-600 relative items-center justify-center p-12 overflow-hidden"
      >
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-40 animate-pulse" />
          <div className="absolute bottom-[-5%] right-[-5%] w-96 h-96 bg-indigo-800 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
              <MessageSquare size={32} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-6">
              Welcome back <br /> 
              <span className="text-indigo-200 text-4xl">Ready to talk?</span>
            </h1>
          </motion.div>

          <div className="space-y-8 mt-12">
            <div className="flex items-start space-x-4">
              <div className="bg-indigo-500/30 p-2 rounded-lg">
                <Zap size={20} className="text-indigo-200" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Instant Sync</h4>
                <p className="text-indigo-100/70 text-sm">Your messages sync across all devices instantly.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-indigo-500/30 p-2 rounded-lg">
                <ShieldCheck size={20} className="text-indigo-200" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Secure by Design</h4>
                <p className="text-indigo-100/70 text-sm">End-to-end encryption for every single chat.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* RIGHT COLUMN: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50/30">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-10 sm:p-12">
            <div className="mb-10 text-left">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Sign In</h2>
              <p className="text-gray-500 mt-2">Enter your credentials to access your chats.</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-600 text-sm rounded-2xl px-4 py-3 mb-6 border border-red-100 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input 
                    {...register('email')} 
                    type="email" 
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" 
                    placeholder="name@example.com" 
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
                  <a href="#" className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter hover:text-indigo-700 transition-colors">Forgot?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input 
                    {...register('password')} 
                    type="password" 
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" 
                    placeholder="••••••••" 
                  />
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.password.message}</p>}
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 mt-8"
              >
                <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
                {!isSubmitting && <ArrowRight size={18} />}
              </motion.button>
            </form>

            <div className="mt-10 pt-8 border-t border-gray-50 flex flex-col items-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-bold underline-offset-4 hover:underline transition-all">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}