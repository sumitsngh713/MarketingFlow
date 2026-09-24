import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Users,
  Clock,
  Target,
  Send,
  Mail,
  Linkedin,
  MessageSquare,
  CheckSquare,
  BarChart3,
  FileText,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Employees', path: '/employees', icon: Users, adminOnly: true },
    { label: 'Attendance', path: '/attendance', icon: Clock },
    { label: 'Leads & CRM', path: '/leads', icon: Target },
    { label: 'Campaigns', path: '/campaigns', icon: Send },
    { label: 'Email Outreach', path: '/email-outreach', icon: Mail },
    { label: 'LinkedIn Outreach', path: '/linkedin-outreach', icon: Linkedin },
    { label: 'WhatsApp Outreach', path: '/whatsapp-outreach', icon: MessageSquare },
    { label: 'Follow-ups', path: '/followups', icon: CheckSquare },
    { label: 'Reports', path: '/reports', icon: BarChart3, adminOnly: true },
    { label: 'Activity Logs', path: '/activity-logs', icon: FileText, adminOnly: true },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo & Name */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white leading-tight">
              MarketingFlow
            </div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-brand-400">
              {isAdmin ? 'Admin Workspace' : 'Employee Workspace'}
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </div>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-brand-400 flex-shrink-0">
              {user?.firstName?.[0] || 'U'}
              {user?.lastName?.[0] || ''}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                {isAdmin ? <Shield className="w-3 h-3 text-indigo-400" /> : null}
                <span>{user?.designation || user?.role}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
