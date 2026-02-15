import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Home, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const isHome = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="w-full py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-white p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">LinkVault</h1>
              <p className="text-purple-100 text-sm">Secure. Temporary. Simple.</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {!isHome && (
              <Link to="/" className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all">
                <Home className="w-4 h-4" />
                <span>New Upload</span>
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                  <User className="w-4 h-4" />
                  <span>{user?.username}</span>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all">
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link to="/register" className="flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all font-medium">
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;