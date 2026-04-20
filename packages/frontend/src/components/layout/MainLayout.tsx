import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatArea from '../chat/ChatArea';
import MembersPanel from './MembersPanel';
import TopNav from './TopNav';
import ContactsPage from '../contacts/ContactsPage';
import PublicRoomsPage from '../rooms/PublicRoomsPage';
import { useChatStore } from '../../stores/chat.store';

export default function MainLayout() {
  const activeRoom = useChatStore((s) => s.activeRoom);
  const [showMembers, setShowMembers] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex overflow-hidden">
          <Routes>
            <Route path="/" element={
              activeRoom
                ? <ChatArea onToggleMembers={() => setShowMembers(v => !v)} />
                : <WelcomeScreen />
            } />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/rooms" element={<PublicRoomsPage />} />
          </Routes>
        </main>
        {activeRoom && showMembers && <MembersPanel />}
      </div>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex-1 flex items-center justify-center text-center">
      <div>
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-xl font-semibold text-gray-700">Welcome to ChatApp</h2>
        <p className="text-gray-400 mt-2">Select a room or contact to start chatting</p>
        <a
          href="/rooms"
          className="inline-block mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition"
        >
          Browse Public Rooms
        </a>
      </div>
    </div>
  );
}
