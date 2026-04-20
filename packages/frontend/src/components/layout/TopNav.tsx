import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { disconnectSocket } from '../../socket';
import api from '../../lib/axios';
import { getInitials } from '../../lib/utils';

export default function TopNav() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuth();
      disconnectSocket();
      navigate('/login');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-4 shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">C</span>
        </div>
        <span className="font-semibold text-gray-900 text-sm">ChatApp</span>
      </div>

      <nav className="flex gap-1 ml-4">
        <Link to="/rooms" className="px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
          Public Rooms
        </Link>
        <Link to="/contacts" className="px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
          Contacts
        </Link>
      </nav>

      <div className="ml-auto relative">
        <button
          onClick={() => setShowMenu(v => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
        >
          <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {getInitials(user?.username || '')}
          </div>
          <span className="text-sm text-gray-700 font-medium">{user?.username}</span>
          <span className="text-gray-400 text-xs">▾</span>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg w-44 z-50 py-1">
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
