import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import type { UserRole } from '@/types';
import { ShieldAlert, ArrowRight, UserCheck, LogOut, ArrowLeft } from 'lucide-react';

// Spinner for loading state
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-soft">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-hairline border-t-primary rounded-full animate-spin" />
        <p className="text-body-sm text-muted">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Requires authentication. Redirects to /login if not authenticated.
 * For staff routes, offers a 1-click Demo Staff entrance.
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    if (location.pathname.startsWith('/staff')) {
      return (
        <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-[420px] bg-white border border-[#e2e4e9] rounded-2xl p-8 shadow-sm text-center">
            <Link
              to="/"
              className="text-2xl font-extrabold tracking-tight text-ink font-display mb-4 inline-block hover:opacity-90"
            >
              QueueEz
            </Link>
            <div className="w-12 h-12 bg-[#6e56cf]/10 text-[#6e56cf] rounded-xl flex items-center justify-center mx-auto mb-4">
              <UserCheck size={24} />
            </div>
            <h1 className="text-xl font-semibold text-ink mb-2">Staff Portal Access</h1>
            <p className="text-body-sm text-muted mb-6">
              You must be signed in with a Staff or Admin account to manage counters and serve the queue.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => signIn('staff@demo.com', 'demo')}
                className="w-full h-11 rounded-lg bg-[#6e56cf] hover:bg-[#5f45be] text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter as Demo Staff (Dr. Jane Smith)</span>
                <ArrowRight size={16} />
              </button>
              <Link
                to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
                className="w-full h-11 rounded-lg bg-surface-soft border border-hairline text-ink font-medium text-sm hover:bg-surface-strong transition-all flex items-center justify-center cursor-pointer"
              >
                Go to Standard Login
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
}

/**
 * Requires specific roles. Shows a friendly switch screen if role doesn't match.
 */
export function RequireRole({ roles }: { roles: UserRole[] }) {
  const { profile, isLoading, signIn, signOut } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <LoadingScreen />;
  if (!profile) return <Navigate to="/login" replace />;

  if (!roles.includes(profile.role)) {
    const isStaffTarget = roles.includes('staff') || roles.includes('facility_admin');

    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] bg-white border border-[#e2e4e9] rounded-2xl p-8 shadow-sm text-center">
          <Link
            to="/"
            className="text-2xl font-extrabold tracking-tight text-ink font-display mb-4 inline-block hover:opacity-90"
          >
            QueueEz
          </Link>
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-xl font-semibold text-ink mb-1.5">
            {isStaffTarget ? 'Staff Portal Access' : 'Restricted Section'}
          </h1>
          <p className="text-body-sm text-muted mb-6">
            You are currently signed in as{' '}
            <strong className="text-ink">{profile.full_name}</strong> ({profile.role}). This section requires{' '}
            <span className="font-semibold text-ink">{roles.join(' or ')}</span> privileges.
          </p>

          <div className="space-y-3">
            {isStaffTarget && (
              <button
                type="button"
                onClick={async () => {
                  await signIn('staff@demo.com', 'demo');
                }}
                className="w-full h-11 rounded-lg bg-[#6e56cf] hover:bg-[#5f45be] text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck size={16} />
                <span>Switch to Demo Staff Account</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const redirectPaths: Record<UserRole, string> = {
                  customer: '/app/dashboard',
                  staff: '/staff/queue',
                  facility_admin: '/admin/overview',
                  system_admin: '/system/organizations',
                };
                navigate(redirectPaths[profile.role] || '/app/dashboard');
              }}
              className="w-full h-11 rounded-lg bg-surface-soft border border-hairline text-ink font-medium text-sm hover:bg-surface-strong transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Return to {profile.role === 'customer' ? 'Customer' : 'Your'} Dashboard</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              className="w-full text-caption text-muted hover:text-error transition-colors flex items-center justify-center gap-1.5 pt-2"
            >
              <LogOut size={14} />
              <span>Sign out and use another account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

/**
 * Redirects authenticated users away from auth pages.
 */
export function GuestOnly() {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;

  if (isAuthenticated && profile) {
    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get('redirect');
    if (redirectParam && redirectParam.startsWith('/')) {
      return <Navigate to={redirectParam} replace />;
    }

    const redirectPaths: Record<UserRole, string> = {
      customer: '/app/dashboard',
      staff: '/staff/queue',
      facility_admin: '/admin/overview',
      system_admin: '/system/organizations',
    };
    return <Navigate to={redirectPaths[profile.role]} replace />;
  }

  return <Outlet />;
}
