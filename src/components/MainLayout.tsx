import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, LogOut, Store, Menu as MenuIcon,
  ShoppingBag, BarChart3, Users, Star, MapPin, ChevronRight, PackagePlus,
} from 'lucide-react';
import api from '../api/axiosConfig';

// ── Per-role visual theme ────────────────────────────────────────────────────
interface RoleTheme {
  sidebar: string;          // aside bg
  logoFrom: string;         // gradient from
  logoTo: string;           // gradient to
  logoShadow: string;       // shadow colour
  subtitle: string;         // "Management Portal" text colour
  activeNav: string;        // active nav item bg + text
  activeIcon: string;       // active icon colour
  activeChevron: string;    // active chevron colour
  logoutHover: string;      // logout button hover
  headerName: string;       // first-name accent in header
  headerBadge: string;      // role badge in header (bg + text + border)
  roleBadge: string;        // role badge in sidebar
}

const THEMES: Record<string, RoleTheme> = {
  ADMIN: {
    sidebar:      'bg-[#18090A]',
    logoFrom:     'from-red-500',
    logoTo:       'to-rose-700',
    logoShadow:   'shadow-red-900/40',
    subtitle:     'text-red-400/60',
    activeNav:    'bg-red-600/25 text-red-300',
    activeIcon:   'text-red-400',
    activeChevron:'text-red-500/60',
    logoutHover:  'hover:text-red-400 hover:bg-red-500/10',
    headerName:   'text-red-600',
    headerBadge:  'bg-red-50 text-red-700 border-red-200',
    roleBadge:    'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  HQ_MANAGER: {
    sidebar:      'bg-[#09080F]',
    logoFrom:     'from-violet-500',
    logoTo:       'to-indigo-700',
    logoShadow:   'shadow-violet-900/40',
    subtitle:     'text-violet-400/60',
    activeNav:    'bg-violet-600/25 text-violet-300',
    activeIcon:   'text-violet-400',
    activeChevron:'text-violet-500/60',
    logoutHover:  'hover:text-violet-400 hover:bg-violet-500/10',
    headerName:   'text-violet-600',
    headerBadge:  'bg-violet-50 text-violet-700 border-violet-200',
    roleBadge:    'bg-violet-500/20 text-violet-300 border-violet-500/30',
  },
  BRANCH_MANAGER: {
    sidebar:      'bg-[#080F0A]',
    logoFrom:     'from-emerald-500',
    logoTo:       'to-teal-700',
    logoShadow:   'shadow-emerald-900/40',
    subtitle:     'text-emerald-400/60',
    activeNav:    'bg-emerald-600/25 text-emerald-300',
    activeIcon:   'text-emerald-400',
    activeChevron:'text-emerald-500/60',
    logoutHover:  'hover:text-emerald-400 hover:bg-emerald-500/10',
    headerName:   'text-emerald-600',
    headerBadge:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    roleBadge:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  CHEF: {
    sidebar:      'bg-[#140C04]',
    logoFrom:     'from-orange-500',
    logoTo:       'to-amber-700',
    logoShadow:   'shadow-orange-900/40',
    subtitle:     'text-orange-400/60',
    activeNav:    'bg-orange-600/25 text-orange-300',
    activeIcon:   'text-orange-400',
    activeChevron:'text-orange-500/60',
    logoutHover:  'hover:text-orange-400 hover:bg-orange-500/10',
    headerName:   'text-orange-600',
    headerBadge:  'bg-orange-50 text-orange-700 border-orange-200',
    roleBadge:    'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  WAITER: {
    sidebar:      'bg-[#060E14]',
    logoFrom:     'from-sky-500',
    logoTo:       'to-blue-700',
    logoShadow:   'shadow-sky-900/40',
    subtitle:     'text-sky-400/60',
    activeNav:    'bg-sky-600/25 text-sky-300',
    activeIcon:   'text-sky-400',
    activeChevron:'text-sky-500/60',
    logoutHover:  'hover:text-sky-400 hover:bg-sky-500/10',
    headerName:   'text-sky-600',
    headerBadge:  'bg-sky-50 text-sky-700 border-sky-200',
    roleBadge:    'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  CUSTOMER: {
    sidebar:      'bg-[#070F0B]',
    logoFrom:     'from-green-500',
    logoTo:       'to-emerald-700',
    logoShadow:   'shadow-green-900/40',
    subtitle:     'text-green-400/60',
    activeNav:    'bg-green-600/25 text-green-300',
    activeIcon:   'text-green-400',
    activeChevron:'text-green-500/60',
    logoutHover:  'hover:text-green-400 hover:bg-green-500/10',
    headerName:   'text-green-600',
    headerBadge:  'bg-green-50 text-green-700 border-green-200',
    roleBadge:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
};

const DEFAULT_THEME: RoleTheme = THEMES.ADMIN;

// ── Component ────────────────────────────────────────────────────────────────
const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [branchName, setBranchName] = useState<string | null>(null);

  const theme = THEMES[user?.role ?? ''] ?? DEFAULT_THEME;

  useEffect(() => {
    if (
      (user?.role === 'BRANCH_MANAGER' || user?.role === 'WAITER' || user?.role === 'CHEF') &&
      user.branch_id
    ) {
      api.get(`/branches/${user.branch_id}`)
        .then(r => setBranchName(r.data?.name ?? null))
        .catch(() => setBranchName(null));
    }
  }, [user]);

  const handleLogout = () => { logout(); navigate('/'); };

  const navItems = [
    { label: 'Dashboard',      icon: LayoutDashboard, path: '/dashboard',      roles: ['ADMIN', 'HQ_MANAGER', 'WAITER', 'BRANCH_MANAGER', 'CHEF', 'CUSTOMER'] },
    { label: 'Users',          icon: Users,           path: '/admin/users',    roles: ['ADMIN'] },
    { label: 'Branches',       icon: Store,           path: '/branches',       roles: ['ADMIN', 'HQ_MANAGER', 'BRANCH_MANAGER'] },
    { label: 'Order Food',     icon: ShoppingBag,     path: '/orders',         roles: ['CUSTOMER'] },
    { label: 'Orders',         icon: ShoppingBag,     path: '/orders',         roles: ['WAITER', 'CHEF', 'BRANCH_MANAGER', 'ADMIN', 'HQ_MANAGER'] },
    { label: 'Menu',           icon: MenuIcon,        path: '/menu',           roles: ['CHEF', 'HQ_MANAGER', 'ADMIN', 'WAITER', 'CUSTOMER'] },
    { label: 'Recommendations',icon: Star,            path: '/recommendations',roles: ['CUSTOMER'] },
    { label: 'Branch Report',  icon: BarChart3,       path: '/reports',        roles: ['BRANCH_MANAGER'] },
    { label: 'Reports',        icon: BarChart3,       path: '/reports',        roles: ['HQ_MANAGER', 'ADMIN'] },
    { label: 'Restock Orders', icon: PackagePlus,     path: '/restock',        roles: ['BRANCH_MANAGER', 'ADMIN', 'HQ_MANAGER'] },
  ];

  const filteredNav = navItems.filter(item => user && item.roles.includes(user.role));
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.email ?? '';
  const roleLabel = user?.role?.replace(/_/g, ' ') ?? '';

  return (
    <div className="flex h-screen bg-gray-50">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`w-64 flex flex-col ${theme.sidebar} border-r border-white/5 shadow-xl`}>

        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-9 h-9 bg-gradient-to-br ${theme.logoFrom} ${theme.logoTo} rounded-xl flex items-center justify-center shadow-lg ${theme.logoShadow}`}>
              <span className="text-white font-black text-base select-none">S</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight">Steakz</span>
          </div>
          <p className={`text-[10px] ${theme.subtitle} font-semibold uppercase tracking-[0.15em] ml-12`}>
            Management Portal
          </p>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-sm font-semibold text-white truncate">{displayName}</p>
          {branchName && (
            <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5 truncate">
              <MapPin className="w-3 h-3 shrink-0" />{branchName}
            </p>
          )}
          <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${theme.roleBadge}`}>
            {roleLabel}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {filteredNav.map(item => (
            <NavLink
              key={item.path + item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? `${theme.activeNav} shadow-sm`
                    : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-4 h-4 shrink-0 ${isActive ? theme.activeIcon : ''}`} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className={`w-3.5 h-3.5 ml-auto ${theme.activeChevron}`} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-500 ${theme.logoutHover} rounded-lg transition-all`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto flex flex-col">

        {/* Top header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shadow-sm shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              Welcome back,{' '}
              <span className={theme.headerName}>{displayName.split(' ')[0]}</span>
            </h2>
            {branchName && (
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />{branchName}
              </p>
            )}
          </div>
          <span className={`px-3 py-1.5 border rounded-full text-xs font-bold uppercase tracking-wide ${theme.headerBadge}`}>
            {roleLabel}
          </span>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
