import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  Bell,
  User,
  LogOut,
  Settings,
  BarChart2,
  ClipboardList,
  Building2,
  Layers,
  Shield,
  Menu,
  X,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

// ============================================================
// TYPES
// ============================================================
export interface NavItemType {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number | React.ReactNode;
}

export interface SidebarProps {
  role: 'customer' | 'staff' | 'facility_admin' | 'system_admin';
}

// ============================================================
// BADGE WITH DOT
// ============================================================
export function BadgeWithDot({
  children,
  color = 'success',
  size = 'sm',
}: {
  children: React.ReactNode;
  color?: 'success' | 'brand' | 'warning' | 'gray';
  type?: string;
  size?: 'sm' | 'md';
}) {
  const colorClasses = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    brand: 'bg-blue-50 text-blue-700 border-blue-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    gray: 'bg-surface-soft text-muted border-hairline',
  };
  const dotClasses = {
    success: 'bg-emerald-500',
    brand: 'bg-blue-500',
    warning: 'bg-amber-500',
    gray: 'bg-gray-400',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium border leading-none',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        colorClasses[color]
      )}
    >
      <span
        className={clsx(
          'rounded-full shrink-0 animate-pulse',
          size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
          dotClasses[color]
        )}
      />
      <span>{children}</span>
    </span>
  );
}

// ============================================================
// QUEUEEZ ROLE NAVIGATION CONFIGURATIONS (Flat - No Dropdowns)
// ============================================================
const customerNavItems: NavItemType[] = [
  { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Live Queue', href: '/app/queue', icon: Clock, badge: 'Live' },
  { label: 'Appointments', href: '/app/appointments', icon: Calendar },
  { label: 'History', href: '/app/history', icon: ClipboardList },
  { label: 'Facilities', href: '/facilities', icon: Building2 },
  { label: 'Notifications', href: '/app/notifications', icon: Bell, badge: 3 },
  { label: 'Profile', href: '/app/profile', icon: User },
];

const staffNavItems: NavItemType[] = [
  { label: 'Live Queue', href: '/staff/queue', icon: Clock, badge: 'Live' },
  { label: 'Counter Desk', href: '/staff/counter', icon: Layers },
  { label: 'Appointments', href: '/staff/appointments', icon: Calendar },
  { label: 'Served History', href: '/staff/history', icon: ClipboardList },
  { label: 'Facility Overview', href: '/admin/overview', icon: BarChart2 },
  { label: 'Notifications', href: '/app/notifications', icon: Bell, badge: 2 },
];

const adminNavItems: NavItemType[] = [
  { label: 'Facility Overview', href: '/admin/overview', icon: LayoutDashboard },
  { label: 'Live Queues', href: '/admin/queues', icon: Clock, badge: 'Live' },
  { label: 'Appointments', href: '/admin/appointments', icon: Calendar },
  { label: 'Services & Depts', href: '/admin/services', icon: Layers },
  { label: 'Service Counters', href: '/admin/counters', icon: Building2 },
  { label: 'Staff Directory', href: '/admin/staff', icon: Users },
  { label: 'Analytics & Reports', href: '/admin/analytics', icon: BarChart2 },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: Shield },
];

const systemNavItems: NavItemType[] = [
  { label: 'Organizations', href: '/system/organizations', icon: Building2 },
  { label: 'Facilities', href: '/system/facilities', icon: Layers },
  { label: 'Users & Roles', href: '/system/users', icon: Users },
  { label: 'System Analytics', href: '/system/analytics', icon: BarChart2 },
  { label: 'Security & Logs', href: '/system/audit-logs', icon: Shield },
];

const roleNavMap: Record<string, NavItemType[]> = {
  customer: customerNavItems,
  staff: staffNavItems,
  facility_admin: adminNavItems,
  system_admin: systemNavItems,
};

const roleTitleMap: Record<string, string> = {
  customer: 'Customer Portal',
  staff: 'Staff Counter',
  facility_admin: 'Facility Admin',
  system_admin: 'System Admin',
};

// ============================================================
// SIDEBAR NAVIGATION SIMPLE COMPONENT (Flat List - No Dropdowns)
// ============================================================
export function SidebarNavigationSimple({
  items,
  footerItems = [],
  role,
}: {
  items: NavItemType[];
  footerItems?: NavItemType[];
  role: 'customer' | 'staff' | 'facility_admin' | 'system_admin';
}) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Filter items by search query if any
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    return item.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderBadge = (badge?: string | number | React.ReactNode) => {
    if (!badge) return null;
    if (badge === 'Live') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 leading-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          Live
        </span>
      );
    }
    if (typeof badge === 'string' || typeof badge === 'number') {
      return (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-surface-soft text-ink border border-hairline">
          {badge}
        </span>
      );
    }
    return badge;
  };

  return (
    <div className="flex flex-col h-full bg-canvas select-none">
      {/* ── Brand Header (QueueEz + Role Badge) ────────────────── */}
      <div className="p-4 pb-3 border-b border-hairline">
        <div className="flex items-center justify-between mb-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-title-sm font-bold text-ink tracking-tight font-display hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs">
              <Clock size={16} />
            </div>
            <span className="text-xl font-extrabold text-ink">QueueEz</span>
          </Link>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface-soft border border-hairline text-muted">
            {roleTitleMap[role] || 'Workspace'}
          </span>
        </div>

        {/* Quick Search input */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu..."
            className="w-full h-8 pl-8 pr-2.5 text-xs rounded-lg border border-hairline bg-surface-soft text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* ── Main Scrollable Navigation Area (Flat Links, No Dropdowns) ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={clsx(
                'group flex items-center justify-between px-3 py-2.5 rounded-lg text-body-sm font-medium transition-all cursor-pointer',
                isActive
                  ? 'bg-surface-soft text-ink font-semibold border border-hairline shadow-2xs'
                  : 'text-muted hover:text-ink hover:bg-surface-soft/60'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  size={16}
                  className={clsx(
                    'shrink-0 transition-colors',
                    isActive ? 'text-ink' : 'text-muted group-hover:text-ink'
                  )}
                />
                <span className="truncate text-sm">{item.label}</span>
              </div>
              {renderBadge(item.badge)}
            </NavLink>
          );
        })}
      </div>

      {/* ── Footer Navigation Items (Settings only) ───────────── */}
      {footerItems.length > 0 && (
        <div className="px-3 py-2 border-t border-hairline space-y-0.5">
          {footerItems.map((fItem) => {
            const FIcon = fItem.icon;
            const isFActive = location.pathname === fItem.href;

            return (
              <NavLink
                key={fItem.label}
                to={fItem.href}
                className={clsx(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                  isFActive
                    ? 'bg-surface-soft text-ink font-semibold'
                    : 'text-muted hover:text-ink hover:bg-surface-soft'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <FIcon size={15} />
                  <span>{fItem.label}</span>
                </div>
                {renderBadge(fItem.badge)}
              </NavLink>
            );
          })}
        </div>
      )}

      {/* ── User Profile Footer ───────────────────────────────── */}
      <div className="p-3 border-t border-hairline bg-surface-soft/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink truncate leading-tight">
                {profile?.full_name || 'Demo User'}
              </p>
              <p className="text-[11px] text-muted truncate leading-tight">
                {profile?.email || 'user@demo.com'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="p-1.5 text-muted hover:text-error hover:bg-error/10 rounded-md transition-colors cursor-pointer shrink-0"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APPSIDEBAR COMPONENT (Fixed Width, No Collapsing)
// ============================================================
export function AppSidebar({ role }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = roleNavMap[role] || customerNavItems;

  const footerItems: NavItemType[] = [
    {
      label: 'Settings',
      href: role === 'facility_admin' || role === 'system_admin' ? '/admin/settings' : '/app/profile',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar: FIXED WIDTH (w-72 / 288px), NO COLLAPSING */}
      <aside className="hidden lg:flex flex-col w-72 bg-canvas border-r border-hairline h-screen sticky top-0 shrink-0 shadow-2xs z-30">
        <SidebarNavigationSimple
          items={items}
          footerItems={footerItems}
          role={role}
        />
      </aside>

      {/* Mobile Drawer Toggle */}
      <button
        type="button"
        className="lg:hidden fixed bottom-4 right-4 z-50 w-12 h-12 bg-primary text-white rounded-full shadow-elevated flex items-center justify-center cursor-pointer"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Sidebar Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-canvas flex flex-col shadow-elevated z-50">
            <SidebarNavigationSimple
              items={items}
              footerItems={footerItems}
              role={role}
            />
          </aside>
        </div>
      )}
    </>
  );
}

// ============================================================
// APP LAYOUT WRAPPER (Used across entire codebase)
// ============================================================
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
        <div className="max-w-7xl mx-auto p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}

// ============================================================
// PAGE HEADER COMPONENT
// ============================================================
export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-display-xs font-semibold text-ink tracking-tight">{title}</h1>
        {description && <p className="text-body-sm text-muted mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
