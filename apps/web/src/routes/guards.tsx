import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import type { UserRole } from '@/types';
import toast from 'react-hot-toast';
import { PageSkeleton } from '@/components/ui/Skeleton';

// Loading fallback with realistic page skeleton screen
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface-soft p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <PageSkeleton />
      </div>
    </div>
  );
}

const ROLE_HOME_PATHS: Record<UserRole, string> = {
  customer: '/app/dashboard',
  staff: '/staff/queue',
  facility_admin: '/admin/overview',
  system_admin: '/system/organizations',
};

/**
 * Validates whether a target path is allowed for a user role
 */
function isRolePathAllowed(role: UserRole, path: string): boolean {
  if (path.startsWith('/app') && role !== 'customer') return false;
  if (path.startsWith('/staff') && role !== 'staff') return false;
  if (path.startsWith('/admin') && role !== 'facility_admin' && role !== 'system_admin') return false;
  if (path.startsWith('/system') && role !== 'system_admin') return false;
  return true;
}

/**
 * Requires authentication. Redirects to /login if not authenticated.
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
}

/**
 * Requires specific roles.
 * Strictly prevents cross-entity access: if role does not match, immediately
 * redirects to the user's role-specific dashboard with a clear warning toast.
 */
export function RequireRole({ roles }: { roles: UserRole[] }) {
  const { profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;
  if (!profile) return <Navigate to="/login" replace />;

  // Dedicated security check: Only bootstrap email or demo admin allowed into Admin Portal
  if (roles.includes('facility_admin') || location.pathname.startsWith('/admin')) {
    const bootstrapEmail = (
      import.meta.env.VITE_BOOTSTRAP_ADMIN_EMAIL ||
      'jbondntd007@gmail.com'
    ).trim().toLowerCase();
    const isAuthorized =
      profile.email.trim().toLowerCase() === bootstrapEmail ||
      profile.email.trim().toLowerCase() === 'admin@demo.com';

    if (!isAuthorized) {
      toast.error(
        `Access Denied: Only authorized organization administrator (${bootstrapEmail}) can access the Admin Portal.`,
        { id: 'admin-unauthorized-guard', duration: 6000 }
      );
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  if (!roles.includes(profile.role)) {
    const targetPath = ROLE_HOME_PATHS[profile.role] || '/login';

    // Show single toast to explain redirection
    toast.error(
      `Access restricted. Redirected to your ${profile.role === 'customer' ? 'customer' : profile.role === 'staff' ? 'staff' : 'admin'} portal.`,
      { id: 'role-restricted-toast' }
    );

    return <Navigate to={targetPath} replace />;
  }

  return <Outlet />;
}

/**
 * Redirects authenticated users away from auth pages to their respective dashboard.
 */
export function GuestOnly() {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;

  if (isAuthenticated && profile) {
    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get('redirect');

    if (redirectParam && redirectParam.startsWith('/') && isRolePathAllowed(profile.role, redirectParam)) {
      return <Navigate to={redirectParam} replace />;
    }

    return <Navigate to={ROLE_HOME_PATHS[profile.role] || '/app/dashboard'} replace />;
  }

  return <Outlet />;
}
