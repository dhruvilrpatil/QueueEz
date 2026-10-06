import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Check, Shield, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import toast from 'react-hot-toast';

// ── Google Icon ──────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

// ============================================================
// LOGIN PAGE
// ============================================================
export function LoginPage({ isAdminPortal = false }: { isAdminPortal?: boolean }) {
  const { signIn, signInWithGoogle, signInWithAdminGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const errorParam = searchParams.get('error');
  const isAdminView = isAdminPortal || searchParams.get('admin') === 'true' || redirectParam?.startsWith('/admin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAdminGoogleLoading, setIsAdminGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loggedInProfile = await signIn(email.trim().toLowerCase(), password);
      toast.success('Welcome back!');

      const roleHomeMap: Record<string, string> = {
        facility_admin: '/admin/overview',
        system_admin: '/system/organizations',
        staff: '/staff/queue',
        customer: '/app/dashboard',
      };

      const rolePath = roleHomeMap[loggedInProfile.role] || '/app/dashboard';

      if (redirectParam && redirectParam.startsWith('/')) {
        const isAllowed =
          (redirectParam.startsWith('/admin') && (loggedInProfile.role === 'facility_admin' || loggedInProfile.role === 'system_admin')) ||
          (redirectParam.startsWith('/staff') && (loggedInProfile.role === 'staff' || loggedInProfile.role === 'facility_admin' || loggedInProfile.role === 'system_admin')) ||
          (redirectParam.startsWith('/app') && loggedInProfile.role === 'customer');

        if (isAllowed) {
          navigate(redirectParam, { replace: true });
        } else {
          navigate(rolePath, { replace: true });
        }
      } else {
        navigate(rolePath, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle(redirectParam || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setIsGoogleLoading(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    setIsAdminGoogleLoading(true);
    setError('');
    try {
      await signInWithAdminGoogle('/admin/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin Google sign-in failed');
      setIsAdminGoogleLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setIsLoading(true);
    setError('');
    try {
      const loggedInProfile = await signIn(demoEmail, 'demo1234');
      toast.success(`Logged in as ${loggedInProfile.full_name}`);
      const roleHomeMap: Record<string, string> = {
        facility_admin: '/admin/overview',
        system_admin: '/system/organizations',
        staff: '/staff/queue',
        customer: '/app/dashboard',
      };
      navigate(roleHomeMap[loggedInProfile.role] || '/admin/overview', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[390px] flex flex-col items-center">
        {/* Top Text Brand */}
        <Link
          to="/"
          className="text-3xl font-extrabold tracking-tight text-ink font-display mb-6 hover:opacity-90 transition-opacity"
        >
          QueueEz
        </Link>

        {isAdminView ? (
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
              <Shield size={13} className="text-primary" />
              <span>Admin Portal Access</span>
            </div>
            <h1 className="text-[26px] font-bold text-ink tracking-tight leading-tight">
              Sign in to Admin
            </h1>
            <p className="text-sm text-muted mt-1.5">
              Strictly restricted to <strong className="text-ink">jbondntd007@gmail.com</strong>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-7 text-center">
            <h1 className="text-[26px] font-semibold text-ink tracking-tight leading-tight">
              Log in to your account
            </h1>
            <p className="text-sm text-muted mt-2">
              Welcome back! Please enter your details.
            </p>
          </div>
        )}

        {/* Unauthorized Admin Error Banner */}
        {errorParam === 'unauthorized_admin' && (
          <div className="w-full mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-left flex items-start gap-2.5 shadow-2xs">
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-900">Access Denied: Unauthorized Account</p>
              <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                Only the designated administrator Google account (<strong className="underline">jbondntd007@gmail.com</strong>) has access to the Admin Portal. The account you selected does not have administrator privileges.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="w-full mb-4 p-3 bg-error/10 border border-error/20 rounded-lg text-body-sm text-error text-center">
            {error}
          </div>
        )}

        {/* ── DEDICATED ADMIN LOGIN (Google Authorized Only) ── */}
        <div className="w-full mb-6 p-4 rounded-xl border border-hairline bg-surface-soft/80 backdrop-blur-xs flex flex-col items-center shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Shield size={16} className="text-primary shrink-0" />
            <span className="text-xs font-bold text-ink uppercase tracking-wider font-display">
              Dedicated Admin Login
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
              Owner Only
            </span>
          </div>
          <p className="text-[11px] text-muted text-center mb-3">
            Only <strong className="text-ink">jbondntd007@gmail.com</strong> Google account can sign in to admin
          </p>

          <button
            id="admin-google-login-btn"
            type="button"
            onClick={handleAdminGoogleLogin}
            disabled={isAdminGoogleLoading || isGoogleLoading || isLoading}
            className="w-full h-[46px] flex items-center justify-center gap-2.5 bg-ink hover:bg-neutral-800 active:bg-black text-white rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed group relative"
          >
            {isAdminGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0">
                  <GoogleIcon />
                </div>
                <span>Sign in as Admin with Google</span>
                <Lock size={13} className="text-muted group-hover:text-white transition-colors ml-1" />
              </>
            )}
          </button>
        </div>

        {/* OR Divider with Regular Email/Password Login */}
        <div className="relative w-full mb-5 flex items-center justify-center">
          <div className="w-full border-t border-hairline" />
          <span className="absolute bg-canvas px-3 text-[11px] font-medium text-muted tracking-wider">
            OR REGULAR LOGIN
          </span>
        </div>

        {/* Standard Email / Password Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3.5">
          <div>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
              className="w-full h-[44px] px-3.5 rounded-lg border border-hairline text-sm text-ink placeholder:text-muted outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
            />
          </div>

          <div className="space-y-1">
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full h-[44px] pl-3.5 pr-10 rounded-lg border border-hairline text-sm text-ink placeholder:text-muted outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors p-1"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-muted hover:text-ink transition-colors mt-0.5"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full h-[44px] rounded-lg bg-primary hover:bg-primary-active active:bg-black text-on-primary font-medium text-sm transition-all shadow-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Continue with email'
            )}
          </button>
        </form>

        {/* Regular Google Sign-In for Customers */}
        <div className="w-full mt-3">
          <button
            id="login-google"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full h-[44px] flex items-center justify-center gap-3 bg-white border border-hairline hover:bg-surface-soft hover:border-gray-400 rounded-lg text-sm font-medium text-ink transition-all cursor-pointer shadow-2xs disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                <span>Continue with Google (Customer)</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Demo Access (For Academic / Evaluator Mode) */}
        <div className="w-full mt-6 pt-5 border-t border-hairline">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider text-center mb-2.5">
            Quick Persona Login (Academic / Evaluator Mode)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@demo.com')}
              disabled={isLoading}
              className="py-1.5 px-2 rounded-lg bg-surface-soft hover:bg-surface border border-hairline hover:border-primary/40 text-xs font-semibold text-ink transition-all text-center cursor-pointer disabled:opacity-50"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('staff@demo.com')}
              disabled={isLoading}
              className="py-1.5 px-2 rounded-lg bg-surface-soft hover:bg-surface border border-hairline hover:border-primary/40 text-xs font-semibold text-ink transition-all text-center cursor-pointer disabled:opacity-50"
            >
              Staff
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('customer@demo.com')}
              disabled={isLoading}
              className="py-1.5 px-2 rounded-lg bg-surface-soft hover:bg-surface border border-hairline hover:border-primary/40 text-xs font-semibold text-ink transition-all text-center cursor-pointer disabled:opacity-50"
            >
              Customer
            </button>
          </div>
        </div>

        {/* Bottom Link */}
        <p className="mt-7 text-center text-sm text-body">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-primary font-semibold hover:underline transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

// ============================================================
// SIGNUP PAGE (Create an account)
// ============================================================
export function RegisterPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password, fullName);
      setSuccess(true);
      toast.success('Account created! Check your email to verify.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed');
      setIsGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[380px] text-center">
          <Link
            to="/"
            className="text-3xl font-extrabold tracking-tight text-ink font-display block mb-6"
          >
            QueueEz
          </Link>
          <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-success stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-semibold text-ink mb-2">Check your email</h2>
          <p className="text-sm text-muted mb-6">
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full h-[44px] rounded-lg bg-primary hover:bg-primary-active text-on-primary font-medium text-sm transition-colors"
          >
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[380px] flex flex-col items-center">
        {/* Top Text Brand */}
        <Link
          to="/"
          className="text-3xl font-extrabold tracking-tight text-ink font-display mb-6 hover:opacity-90 transition-opacity"
        >
          QueueEz
        </Link>

        <h1 className="text-[26px] font-semibold text-ink text-center tracking-tight leading-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted text-center mt-2 mb-7">
          Start managing your appointments and digital queues.
        </p>

        {error && (
          <div className="w-full mb-4 p-3 bg-error/10 border border-error/20 rounded-lg text-body-sm text-error text-center">
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3.5">
          <div>
            <input
              id="register-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
              required
              className="w-full h-[44px] px-3.5 rounded-lg border border-hairline text-sm text-ink placeholder:text-muted outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
            />
          </div>

          <div>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
              className="w-full h-[44px] px-3.5 rounded-lg border border-hairline text-sm text-ink placeholder:text-muted outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
            />
          </div>

          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password (min. 8 characters)"
              required
              autoComplete="new-password"
              className="w-full h-[44px] pl-3.5 pr-10 rounded-lg border border-hairline text-sm text-ink placeholder:text-muted outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors p-1"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Primary CTA styled per DESIGN.md */}
          <button
            id="register-submit"
            type="submit"
            disabled={isLoading}
            className="w-full h-[44px] rounded-lg bg-primary hover:bg-primary-active active:bg-black text-on-primary font-medium text-sm transition-all shadow-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Get started'
            )}
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative w-full my-6 flex items-center justify-center">
          <div className="w-full border-t border-hairline" />
          <span className="absolute bg-canvas px-3 text-[11px] font-medium text-muted tracking-wider">
            OR
          </span>
        </div>

        {/* Social Buttons: Google Only */}
        <div className="w-full space-y-2.5">
          <button
            id="register-google"
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            className="w-full h-[44px] flex items-center justify-center gap-3 bg-white border border-hairline hover:bg-surface-soft hover:border-gray-400 rounded-lg text-sm font-medium text-ink transition-all cursor-pointer shadow-2xs disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                <span>Sign up with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Bottom Link */}
        <p className="mt-7 text-center text-sm text-body">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

// ============================================================
// FORGOT PASSWORD PAGE
// ============================================================
export function ForgotPasswordPage() {
  const { supabase } = useAuth() as unknown as { supabase: { auth: { resetPasswordForEmail: (email: string, opts: unknown) => Promise<{ error: Error | null }> } } };
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[380px] text-center">
          <Link
            to="/"
            className="text-3xl font-extrabold tracking-tight text-ink font-display block mb-6"
          >
            QueueEz
          </Link>
          <h2 className="text-2xl font-semibold text-ink mb-2">Check your email</h2>
          <p className="text-sm text-muted mb-6">We sent a password reset link to {email}</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full h-[44px] rounded-lg bg-primary hover:bg-primary-active text-on-primary font-medium text-sm transition-colors"
          >
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[380px] flex flex-col items-center">
        <Link
          to="/"
          className="text-3xl font-extrabold tracking-tight text-ink font-display mb-6 hover:opacity-90 transition-opacity"
        >
          QueueEz
        </Link>
        <h1 className="text-[26px] font-semibold text-ink text-center tracking-tight leading-tight">
          Reset password
        </h1>
        <p className="text-sm text-muted text-center mt-2 mb-7">
          Enter your email and we&apos;ll send a reset link.
        </p>

        {error && (
          <div className="w-full mb-4 p-3 bg-error/10 border border-error/20 rounded-lg text-body-sm text-error text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full h-[44px] px-3.5 rounded-lg border border-hairline text-sm text-ink placeholder:text-muted outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
          />

          <button
            id="forgot-submit"
            type="submit"
            disabled={isLoading}
            className="w-full h-[44px] rounded-lg bg-primary hover:bg-primary-active active:bg-black text-on-primary font-medium text-sm transition-all shadow-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Send reset link'
            )}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-body">
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
