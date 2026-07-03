'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, User, ShieldCheck, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { user, register, loading: authLoading } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push(user.role === 'ADMIN' ? '/admin' : '/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg("All registration fields are required.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await register(name, email, password);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || "Registration request failed.");
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4 py-12">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
        
        {/* Brand identity */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent mb-2">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold font-display tracking-tight text-foreground">Create Account</h1>
          <p className="text-[11px] text-muted-foreground">Join NexCart and explore premium curated shopping.</p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-lg p-3 text-center">
            {errorMsg}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Victoria Sterling"
                required
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-xs focus:border-accent"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sterling@customer.com"
                required
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-xs focus:border-accent"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Password</label>
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
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-foreground text-background py-2.5 text-xs font-bold hover:bg-foreground/90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? "Registering..." : "Register Account"}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-[9px] uppercase"><span className="bg-card px-2 text-muted-foreground font-bold">Or register with</span></div>
        </div>

        <a
          href="/api/auth/google"
          className="w-full rounded-full border border-border bg-card hover:bg-secondary py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 text-foreground"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Register with Google
        </a>

        {/* Footer actions */}
        <div className="space-y-4 text-center pt-2 border-t border-border/60">
          <p className="text-[11px] text-muted-foreground">
            Already have a luxury account?{" "}
            <Link href="/login" className="text-accent font-bold hover:underline">
              Sign In
            </Link>
          </p>
          
          <div className="flex justify-center items-center gap-1.5 text-[9px] text-muted-foreground font-semibold bg-secondary/30 rounded-lg py-1.5">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <span>Encrypted credentials registration standard.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
