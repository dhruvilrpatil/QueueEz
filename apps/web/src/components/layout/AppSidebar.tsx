import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Calendar, Users, Clock, Bell, User, LogOut,
  ChevronLeft, ChevronRight, Menu, X, Settings,
  BarChart2, ClipboardList, Building2, Layers, Shield
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

interface SidebarProps {
  role: 'customer' | 'staff' | 'facility_admin' | 'system_admin';
}

const customerLinks = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/app/queue', icon: Clock, label: 'Queue' },
  { to: '/app/history', icon: ClipboardList, label: 'History' },
  { to: '/app/notifications', icon: Bell, label: 'Notifications' },
  { to: '/app/profile', icon: User, label: 'Profile' },
];

const staffLinks = [
  { to: '/staff/queue', icon: Clock, label: 'Queue' },
  { to: '/staff/counter', icon: Layers, label: 'Counter' },
  { to: '/staff/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/staff/history', icon: ClipboardList, label: 'History' },
];

const adminLinks = [
  { to: '/admin/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/queues', icon: Clock, label: 'Queues' },
  { to: '/admin/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/admin/services', icon: Layers, label: 'Services' },
  { to: '/admin/counters', icon: Building2, label: 'Counters' },
  { to: '/admin/staff', icon: Users, label: 'Staff' },
  { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
  { to: '/admin/audit-logs', icon: Shield, label: 'Audit Logs' },
];

const systemLinks = [
  { to: '/system/organizations', icon: Building2, label: 'Organizations' },
  { to: '/system/facilities', icon: Layers, label: 'Facilities' },
  { to: '/system/users', icon: Users, label: 'Users' },
  { to: '/system/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/system/audit-logs', icon: Shield, label: 'Audit Logs' },
];

const roleLinks = {
  customer: customerLinks,
  staff: staffLinks,
  facility_admin: adminLinks,
  system_admin: systemLinks,
};

const roleTitles = {
  customer: 'Customer Portal',
  staff: 'Staff Dashboard',
  facility_admin: 'Admin Dashboard',
  system_admin: 'System Admin',
};

export function AppSidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const links = roleLinks[role] || customerLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b border-hairline flex items-center justify-between">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2 text-title-sm font-semibold text-ink">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center shrink-0">
              <Clock size={14} className="text-white" />
            </div>
            EzQueue
          </Link>
        )}
        {collapsed && (
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center mx-auto">
            <Clock size={14} className="text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-6 h-6 items-center justify-center text-muted hover:text-ink transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Role label */}
      {!collapsed && (
        <div className="px-4 py-2">
          <span className="text-caption text-muted font-medium">{roleTitles[role]}</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'sidebar-link',
                isActive && 'active',
                collapsed && 'justify-center px-2'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={16} className="shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-hairline">
        {profile && (
          <div className={clsx('flex items-center gap-2 mb-2', collapsed && 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-surface-card flex items-center justify-center text-caption font-semibold text-ink shrink-0">
              {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-caption font-semibold text-ink truncate">{profile.full_name}</p>
                <p className="text-caption text-muted truncate">{profile.email}</p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2 text-caption text-muted hover:text-error hover:bg-error/5 rounded-md transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title="Sign out"
        >
          <LogOut size={14} />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col bg-canvas border-r border-hairline h-screen sticky top-0 transition-all duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed bottom-4 right-4 z-50 w-12 h-12 bg-primary text-white rounded-full shadow-elevated flex items-center justify-center"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-canvas flex flex-col shadow-elevated">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}

// Layout wrapper for authenticated pages
export function AppLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: 'customer' | 'staff' | 'facility_admin' | 'system_admin';
}) {
  return (
    <div className="flex min-h-screen bg-surface-soft">
      <AppSidebar role={role} />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

// Page header component
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-display-sm text-ink">{title}</h1>
        {description && <p className="text-body-sm text-muted mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
