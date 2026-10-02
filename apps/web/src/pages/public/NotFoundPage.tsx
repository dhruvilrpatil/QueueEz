import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();

  const handleGoHome = () => {
    if (!isAuthenticated || !profile) {
      navigate('/');
      return;
    }
    switch (profile.role) {
      case 'staff':
        navigate('/staff/queue');
        break;
      case 'facility_admin':
        navigate('/admin/overview');
        break;
      case 'system_admin':
        navigate('/system/organizations');
        break;
      default:
        navigate('/app/dashboard');
        break;
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      handleGoHome();
    }
  };

  return (
    <div className="relative min-h-screen bg-canvas flex flex-col items-center justify-center px-4 overflow-hidden select-none">
      {/* Giant faint 404 watermark background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
      >
        <span className="text-[18rem] sm:text-[26rem] md:text-[34rem] font-extrabold text-[#f2f4f7] leading-none tracking-tighter">
          404
        </span>
      </div>

      {/* Main content centered */}
      <div className="relative z-10 max-w-lg text-center mx-auto px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-ink tracking-tight font-display mb-3">
          We lost this page
        </h1>
        <p className="text-base text-muted max-w-md mx-auto mb-8 font-sans">
          The page you are looking for doesn't exist or has been moved.
        </p>

        {/* Action buttons (Search removed as requested) */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleGoBack}
            className="h-11 px-5 rounded-lg border border-hairline bg-white hover:bg-surface-soft text-ink font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Go back</span>
          </button>

          <button
            type="button"
            onClick={handleGoHome}
            className="h-11 px-6 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center cursor-pointer"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
