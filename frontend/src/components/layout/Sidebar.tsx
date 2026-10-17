import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  GitMerge,
  Cpu,
  BarChart3,
  GraduationCap,
  Scale,
  Sliders,
  MessageSquareCode,
  Bell,
  FileSpreadsheet,
  Settings,
  ChevronRight,
  X,
  Layers,
  Box,
  FolderPlus,
  LogIn,
  LogOut,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/employees', label: 'Employees', icon: Users },
    { to: '/projects', label: 'Projects', icon: Briefcase },
    { to: '/projects/create', label: 'Create Project', icon: FolderPlus, isHighlight: true },
    { to: '/matching', label: 'Smart Matching', icon: GitMerge },
    { to: '/optimization', label: 'Team Optimization', icon: Cpu },
    { to: '/skill-gaps', label: 'Skill Gap Analysis', icon: BarChart3 },
    { to: '/training', label: 'Training Catalog', icon: GraduationCap },
    { to: '/workload', label: 'Workload Balancer', icon: Scale },
    { to: '/simulation', label: 'What-If Simulator', icon: Sliders },
    { to: '/assistant', label: 'AI Assistant', icon: MessageSquareCode },
    { to: '/notifications', label: 'Notifications', icon: Bell, badgeCount: 3 },
    { to: '/reports', label: 'Reports & Exports', icon: FileSpreadsheet },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/login', label: 'Sign In / Switch Role', icon: LogIn },
  ];

  const displayName = user?.full_name || 'Marcus Vance';
  const displayRole = user?.role ? (user.role === 'admin' ? 'Administrator' : user.role === 'hr' ? 'HR Director' : user.role === 'pm' ? 'Lead PM' : 'Engineer') : 'HR Director';
  const displayInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'MV';

  return (
    <aside className="w-64 bg-[#0c1527] text-slate-300 flex flex-col shrink-0 select-none h-full relative z-30 border-r border-[#1e293b]">
      {/* Brand Header (Matches Reference Image with Isometric Cube & Tagline) */}
      <div className="pt-6 pb-5 px-5 border-b border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Isometric Logo Icon */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-white tracking-tight text-base leading-tight">
                TalentSync AI
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Smarter Teams. Stronger Tomorrow.
              </span>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.07]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badgeCount && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white leading-none">
                      {item.badgeCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Profile Footer (Matches Reference Image "Marcus Vance | HR Director >") */}
      <div className="p-3 border-t border-white/[0.08] bg-black/10">
        <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/[0.05] transition-colors">
          <div
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
            title="Account Settings"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {displayInitials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">{displayName}</p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors shrink-0 ml-1"
            title="Log out / Switch persona"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
