import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import type { UserRole } from '@/types';

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
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}

/**
 * Requires specific roles. Redirects to appropriate dashboard if role doesn't match.
 */
export function RequireRole({ roles }: { roles: UserRole[] }) {
  const { profile, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!profile) return <Navigate to="/login" replace />;

  if (!roles.includes(profile.role)) {
    // Redirect to correct dashboard
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

/**
 * Redirects authenticated users away from auth pages.
 */
export function GuestOnly() {
  const { isAuthenticated, profile, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (isAuthenticated && profile) {
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
