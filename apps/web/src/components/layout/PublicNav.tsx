import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Clock, Calendar } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';

export function PublicHeader() {
  const { isAuthenticated, profile } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getDashboardPath = () => {
    if (!profile) return '/app/dashboard';
    switch (profile.role) {
      case 'staff': return '/staff/queue';
      case 'facility_admin': return '/admin/overview';
      case 'system_admin': return '/system/organizations';
      default: return '/app/dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-canvas border-b border-hairline">
      <div className="container-content">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-semibold text-ink text-title-sm">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Clock size={16} className="text-white" />
            </div>
            EzQueue
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { to: '/facilities', label: 'Facilities' },
              { to: '/#features', label: 'Features' },
              { to: '/#how-it-works', label: 'How it works' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="px-3 py-2 text-body-sm font-medium text-muted hover:text-ink transition-colors rounded-md hover:bg-surface-soft"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate(getDashboardPath())} size="sm">
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-body-sm font-semibold text-ink hover:text-muted transition-colors"
                >
                  Sign in
                </Link>
                <Button onClick={() => navigate('/register')} size="sm">
                  Get started
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center text-ink"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-hairline py-4 space-y-1">
            {[
              { to: '/facilities', label: 'Facilities' },
              { to: '/#features', label: 'Features' },
              { to: '/#how-it-works', label: 'How it works' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-body-sm font-medium text-ink hover:bg-surface-soft rounded-md"
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-hairline-soft flex gap-2">
              {isAuthenticated ? (
                <Button onClick={() => navigate(getDashboardPath())} className="w-full" size="sm">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Link to="/login" className="flex-1">
                    <Button variant="secondary" className="w-full" size="sm">Sign in</Button>
                  </Link>
                  <Link to="/register" className="flex-1">
                    <Button className="w-full" size="sm">Get started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export function PublicFooter() {
  const footerLinks = {
    Product: [
      { label: 'Features', to: '/#features' },
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'Facilities', to: '/facilities' },
    ],
    Solutions: [
      { label: 'Clinics', to: '/facilities?category=clinic' },
      { label: 'Banks', to: '/facilities?category=bank' },
      { label: 'Government', to: '/facilities?category=government' },
    ],
    Company: [
      { label: 'About', to: '/about' },
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
    ],
    Support: [
      { label: 'Documentation', to: '/docs' },
      { label: 'Contact', to: '/contact' },
    ],
  };

  return (
    <footer className="bg-surface-dark text-on-dark-soft">
      <div className="container-content py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-semibold text-on-dark mb-3">
              <div className="w-7 h-7 bg-on-dark rounded-md flex items-center justify-center">
                <Clock size={14} className="text-surface-dark" />
              </div>
              EzQueue
            </div>
            <p className="text-body-sm text-on-dark-soft">
              Smart appointment and virtual queue management.
            </p>
          </div>
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-caption font-semibold text-on-dark mb-3">{group}</h4>
              <ul className="space-y-2">
                {links.map(({ label, to }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-body-sm text-on-dark-soft hover:text-on-dark transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-surface-dark-elevated pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-caption text-on-dark-soft">
          <p>&copy; {new Date().getFullYear()} EzQueue. All rights reserved.</p>
          <p>Built for Semester V FSD & SDM Project</p>
        </div>
      </div>
    </footer>
  );
}
