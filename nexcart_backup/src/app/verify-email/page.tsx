'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Loader2, Sparkles, ArrowRight } from 'lucide-react';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function verify() {
      if (!token) {
        setVerifying(false);
        setMessage("Invalid verification request link. Token is missing.");
        return;
      }
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();
        setVerifying(false);
        if (res.ok && data.success) {
          setSuccess(true);
          setMessage("Your email address was successfully verified! Your luxury account is now active.");
        } else {
          setSuccess(false);
          setMessage(data.message || "Email verification failed or token expired.");
        }
      } catch (err) {
        setVerifying(false);
        setSuccess(false);
        setMessage("Failed to connect to the server.");
      }
    }
    verify();
  }, [token]);

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-md text-center">
      <div className="space-y-1.5">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent mb-2">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold font-display tracking-tight text-foreground">Email Verification</h1>
        <p className="text-[11px] text-muted-foreground">Activating your premium account credentials.</p>
      </div>

      {verifying && (
        <div className="flex flex-col items-center justify-center py-6 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-xs text-muted-foreground">Verifying security token...</p>
        </div>
      )}

      {!verifying && (
        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            {success ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : (
              <AlertCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            {message}
          </p>

          <div className="pt-4 border-t border-border/60">
            {success ? (
              <Link
                href="/login"
                className="rounded-full bg-foreground text-background px-8 py-3 text-xs font-bold hover:bg-foreground/90 transition-all inline-flex items-center gap-1.5"
              >
                Sign In <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/"
                className="rounded-full border border-border bg-card text-foreground px-8 py-3 text-xs font-bold hover:bg-secondary transition-all inline-block"
              >
                Return to Shop
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4 py-12">
      <Suspense fallback={
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      }>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
