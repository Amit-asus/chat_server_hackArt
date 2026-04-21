import { useState } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Globe, Zap, ArrowRight } from 'lucide-react';
import Sidebar from './Sidebar';
import ChatArea from '../chat/ChatArea';
import MembersPanel from './MembersPanel';
import FriendRecommendationsPanel from './FriendRecommendationsPanel';
import TopNav from './TopNav';
import ContactsPage from '../contacts/ContactsPage';
import PublicRoomsPage from '../rooms/PublicRoomsPage';
import { useChatStore } from '../../stores/chat.store';

export default function MainLayout() {
  const activeRoom = useChatStore((s) => s.activeRoom);
  const [showMembers, setShowMembers] = useState(true);
  const location = useLocation();

  return (
    <div className="h-screen flex flex-col bg-[#050507] text-white overflow-hidden relative">
      {/* BACKGROUND LAYER: Animated Mesh Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-900/20 rounded-full blur-[100px]" />
      </div>

      <TopNav />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />

        <main className="flex-1 flex overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname + (activeRoom?.id || '')}
              initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 flex overflow-hidden"
            >
              <Routes location={location}>
                <Route path="/" element={
                  activeRoom
                    ? <ChatArea onToggleMembers={() => setShowMembers(v => !v)} />
                    : <WelcomeScreen />
                } />
                <Route path="/contacts" element={<ContactsPage />} />
                <Route path="/rooms" element={<PublicRoomsPage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {activeRoom && showMembers ? (
            <motion.div
              key="members"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="hidden xl:block"
            >
              <MembersPanel />
            </motion.div>
          ) : !activeRoom ? (
            <motion.div
              key="recommendations"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="hidden xl:block"
            >
              <FriendRecommendationsPanel />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 relative">
      {/* Welcome Graphics */}
      <div className="relative max-w-lg w-full text-center">
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0] 
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative inline-block mb-8"
        >
          {/* Glowing Orb */}
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.4)] rotate-12">
            <MessageSquare size={40} className="text-white -rotate-12" />
          </div>
          <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full -z-10 animate-pulse" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-4xl font-black tracking-tighter text-white mb-4 uppercase">
            System Ready <span className="text-indigo-500">_</span>
          </h2>
          <p className="text-gray-400 text-lg font-medium leading-relaxed mb-10">
            Welcome to the HackArt. Initialize your communication by selecting a decrypted channel or locating an operative.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/rooms"
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-indigo-500/50 transition-all group"
          >
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Globe size={24} />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase">Explore HackArt</span>
          </Link>

          <Link
            to="/contacts"
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-purple-500/50 transition-all group"
          >
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase">Find Operatives</span>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex items-center justify-center gap-2 text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          Neural Link Established
        </motion.div>
      </div>
    </div>
  );
}