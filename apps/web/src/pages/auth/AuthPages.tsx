import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      toast.success('Welcome back!');
      // Redirect handled by GuestOnly guard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-title-sm font-semibold text-ink">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Clock size={18} className="text-white" />
            </div>
            EzQueue
          </Link>
        </div>

        <div className="bg-canvas border border-hairline rounded-xl p-8">
          <div className="mb-6">
            <h1 className="text-display-sm font-semibold text-ink mb-1">Welcome back</h1>
            <p className="text-body-sm text-muted">Sign in to your EzQueue account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-md text-body-sm text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-body-sm font-medium text-ink">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-body-sm text-brand-accent hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="input pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-body-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-ink font-semibold hover:underline">
              Create one
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-4 p-3 bg-surface-soft rounded-lg border border-hairline-soft">
            <p className="text-caption text-muted font-medium mb-2">Demo credentials:</p>
            <div className="space-y-1 text-caption text-muted font-mono">
              <p>customer@demo.com / demo1234</p>
              <p>staff@demo.com / demo1234</p>
              <p>admin@demo.com / demo1234</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(form.email, form.password, form.fullName);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-success text-2xl">✓</span>
          </div>
          <h2 className="text-display-sm text-ink font-semibold mb-2">Check your email</h2>
          <p className="text-body-sm text-muted mb-6">
            We sent a confirmation link to <strong>{form.email}</strong>.
            Click it to activate your account.
          </p>
          <Link to="/login">
            <Button variant="secondary">Back to sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-title-sm font-semibold text-ink">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Clock size={18} className="text-white" />
            </div>
            EzQueue
          </Link>
        </div>

        <div className="bg-canvas border border-hairline rounded-xl p-8">
          <div className="mb-6">
            <h1 className="text-display-sm font-semibold text-ink mb-1">Create your account</h1>
            <p className="text-body-sm text-muted">Join EzQueue and skip the wait</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-md text-body-sm text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              value={form.fullName}
              onChange={handleChange('fullName')}
              placeholder="Dhruvil Patel"
              required
              autoComplete="name"
            />
            <Input
              label="Email address"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
              hint="Minimum 8 characters"
            />
            <Input
              label="Confirm password"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              placeholder="Repeat your password"
              required
              autoComplete="new-password"
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-body-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-ink font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { supabase: _ } = { supabase: null }; // placeholder

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
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
      <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center bg-canvas border border-hairline rounded-xl p-8">
          <h2 className="text-display-sm text-ink font-semibold mb-2">Check your email</h2>
          <p className="text-body-sm text-muted">We sent a password reset link to {email}</p>
          <Link to="/login" className="mt-6 inline-block">
            <Button variant="secondary">Back to sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-title-sm font-semibold text-ink">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Clock size={18} className="text-white" />
            </div>
            EzQueue
          </Link>
        </div>
        <div className="bg-canvas border border-hairline rounded-xl p-8">
          <h1 className="text-display-sm font-semibold text-ink mb-1">Reset password</h1>
          <p className="text-body-sm text-muted mb-6">Enter your email and we'll send a reset link.</p>
          {error && (
            <div className="mb-4 p-3 bg-error/10 rounded-md text-body-sm text-error">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Send reset link
            </Button>
          </form>
          <p className="mt-4 text-center text-body-sm text-muted">
            <Link to="/login" className="text-ink font-semibold hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
