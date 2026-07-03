'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg("A reset token is required to access this page. Please request a new link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage("Password updated successfully! Redirecting to login...");
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setErrorMsg(data.message || "Failed to reset password.");
      }
    } catch (e) {
      setErrorMsg("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
      <div className="text-center space-y-1.5">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent mb-2">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold font-display tracking-tight text-foreground">Set New Password</h1>
        <p className="text-[11px] text-muted-foreground">Establish a new credential for your luxury account.</p>
      </div>

      {message && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold rounded-lg p-3.5 flex items-center gap-2">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-lg p-3.5 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {token && !message && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-10 text-xs focus:border-accent"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-xs focus:border-accent"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-foreground text-background py-2.5 text-xs font-bold hover:bg-foreground/90 transition-all disabled:opacity-50"
          >
            {loading ? "Updating password..." : "Reset Password"}
          </button>
        </form>
      )}

      {!token && (
        <div className="text-center pt-2">
          <Link href="/forgot-password" className="rounded-full bg-foreground text-background px-6 py-2.5 text-xs font-bold hover:bg-foreground/90 transition-all inline-block">
            Request New Reset Link
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4 py-12">
      <Suspense fallback={
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
