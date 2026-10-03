import React, { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';
import { RequireAuth, RequireRole, GuestOnly } from './routes/guards';

// ── Public pages ─────────────────────────────────────────────
import { LandingPage } from './pages/public/LandingPage';
import { FacilitiesPage, FacilityDetailPage } from './pages/public/FacilitiesPage';
import {
  AboutPage,
  PrivacyPage,
  TermsPage,
  DocsPage,
  ContactPage,
} from './pages/public/CompanyPages';

// ── Auth pages ───────────────────────────────────────────────
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/auth/AuthPages';

// ── Customer pages (lazy) ────────────────────────────────────
const CustomerDashboard = lazy(() => import('./pages/customer/Dashboard'));
const QueueTicketPage = lazy(() => import('./pages/customer/QueuePage'));

// ── Profile page (shared across all three entities) ──────────
const ProfilePage = lazy(() => import('./pages/shared/ProfilePage'));

// ── Staff pages (lazy) ──────────────────────────────────────
const StaffQueueDashboard = lazy(() => import('./pages/staff/QueueDashboard'));

// ── Admin pages (lazy) ──────────────────────────────────────
const AdminOverview = lazy(() => import('./pages/admin/Overview'));

import { PageSkeleton } from './components/ui/Skeleton';

// Loading fallback with skeleton screen
function PageLoader() {
  return (
    <div className="min-h-screen bg-surface-soft p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <PageSkeleton />
      </div>
    </div>
  );
}

import { NotFoundPage } from './pages/public/NotFoundPage';

const router = createBrowserRouter([
  // Public routes
  { path: '/', element: <LandingPage /> },
  { path: '/facilities', element: <FacilitiesPage /> },
  { path: '/facilities/:facilityId', element: <FacilityDetailPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/docs', element: <DocsPage /> },
  { path: '/contact', element: <ContactPage /> },

  // Auth routes (only for guests)
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  // Authenticated routes
  {
    element: <RequireAuth />,
    children: [
      // Customer routes
      {
        element: <RequireRole roles={['customer']} />,
        children: [
          {
            path: '/app',
            children: [
              { index: true, element: <Navigate to="/app/dashboard" replace /> },
              {
                path: 'dashboard',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <CustomerDashboard />
                  </Suspense>
                ),
              },
              {
                path: 'queue/:ticketId',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <QueueTicketPage />
                  </Suspense>
                ),
              },
              {
                path: 'queue',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <CustomerDashboard />
                  </Suspense>
                ),
              },
              {
                path: 'appointments',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <CustomerDashboard />
                  </Suspense>
                ),
              },
              {
                path: 'history',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <CustomerDashboard />
                  </Suspense>
                ),
              },
              {
                path: 'notifications',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <CustomerDashboard />
                  </Suspense>
                ),
              },
              {
                path: 'profile',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <ProfilePage entityRole="customer" />
                  </Suspense>
                ),
              },
            ],
          },
        ],
      },

      // Staff routes (strictly staff)
      {
        element: <RequireRole roles={['staff']} />,
        children: [
          {
            path: '/staff',
            children: [
              { index: true, element: <Navigate to="/staff/queue" replace /> },
              {
                path: 'queue',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <StaffQueueDashboard />
                  </Suspense>
                ),
              },
              {
                path: 'counter',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <StaffQueueDashboard />
                  </Suspense>
                ),
              },
              {
                path: 'appointments',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <StaffQueueDashboard />
                  </Suspense>
                ),
              },
              {
                path: 'history',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <StaffQueueDashboard />
                  </Suspense>
                ),
              },
              {
                path: 'notifications',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <StaffQueueDashboard />
                  </Suspense>
                ),
              },
              {
                path: 'settings',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <ProfilePage entityRole="staff" />
                  </Suspense>
                ),
              },
              {
                path: 'profile',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <ProfilePage entityRole="staff" />
                  </Suspense>
                ),
              },
            ],
          },
        ],
      },

      // Admin routes
      {
        element: <RequireRole roles={['facility_admin', 'system_admin']} />,
        children: [
          {
            path: '/admin',
            children: [
              { index: true, element: <Navigate to="/admin/overview" replace /> },
              {
                path: 'overview',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <AdminOverview />
                  </Suspense>
                ),
              },
              { path: 'queues', element: <Suspense fallback={<PageLoader />}><AdminOverview /></Suspense> },
              { path: 'appointments', element: <Suspense fallback={<PageLoader />}><AdminOverview /></Suspense> },
              { path: 'services', element: <Suspense fallback={<PageLoader />}><AdminOverview /></Suspense> },
              { path: 'counters', element: <Suspense fallback={<PageLoader />}><AdminOverview /></Suspense> },
              { path: 'staff', element: <Suspense fallback={<PageLoader />}><AdminOverview /></Suspense> },
              { path: 'analytics', element: <Suspense fallback={<PageLoader />}><AdminOverview /></Suspense> },
              { path: 'settings', element: <Suspense fallback={<PageLoader />}><AdminOverview /></Suspense> },
              { path: 'audit-logs', element: <Suspense fallback={<PageLoader />}><AdminOverview /></Suspense> },
              {
                path: 'profile',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <ProfilePage entityRole="facility_admin" />
                  </Suspense>
                ),
              },
            ],
          },
        ],
      },

      // System routes
      {
        element: <RequireRole roles={['system_admin']} />,
        children: [
          {
            path: '/system',
            children: [
              { index: true, element: <Navigate to="/system/organizations" replace /> },
              { path: 'organizations', element: <Suspense fallback={<PageLoader />}><AdminOverview /></Suspense> },
              { path: 'facilities', element: <Suspense fallback={<PageLoader />}><AdminOverview /></Suspense> },
              { path: 'users', element: <Suspense fallback={<PageLoader />}><AdminOverview /></Suspense> },
              { path: 'analytics', element: <Suspense fallback={<PageLoader />}><AdminOverview /></Suspense> },
              { path: 'audit-logs', element: <Suspense fallback={<PageLoader />}><AdminOverview /></Suspense> },
              {
                path: 'profile',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <ProfilePage entityRole="system_admin" />
                  </Suspense>
                ),
              },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);

function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#111111',
            color: '#ffffff',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '8px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
          },
        }}
      />
    </Providers>
  );
}

export default App;
