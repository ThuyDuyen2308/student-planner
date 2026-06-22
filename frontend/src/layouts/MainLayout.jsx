import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen, Calendar, LayoutDashboard,
  LogOut, User, Shield, Brain, ListTodo, GraduationCap,
  Target, Briefcase, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sync', label: 'Đồng bộ dữ liệu', icon: Target },
  { to: '/schedule', label: 'Lịch học', icon: Calendar },
  { to: '/deadline', label: 'Deadline', icon: ListTodo },
  { to: '/documents', label: 'Tài liệu', icon: BookOpen },
  { to: '/ai/summary', label: 'AI Tóm tắt', icon: Brain },
  { to: '/ai/quiz', label: 'AI Sinh câu hỏi', icon: Target },
  { to: '/ai/chatbot', label: 'AI Chatbot', icon: User },
  { to: '/ai/study-plan', label: 'AI Lập kế hoạch', icon: Briefcase },
  { to: '/profile', label: 'Hồ sơ cá nhân', icon: Shield },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(to + '/');

  const allNavItems = navItems;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-slate-800 bg-slate-900/80 backdrop-blur fixed h-screen overflow-y-auto">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shrink-0">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Student Planner</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role || 'user'}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {allNavItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive(to)
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-white truncate">{user?.fullname || user?.username}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email || 'Chưa cập nhật email'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-300 transition"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white">Student Planner</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-1 pt-16"
            onClick={e => e.stopPropagation()}>
            {allNavItems.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive(to)
                    ? 'bg-indigo-600/20 text-indigo-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon size={17} />{label}
              </Link>
            ))}
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 mt-4 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-300 transition">
              <LogOut size={16} />Đăng xuất
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
