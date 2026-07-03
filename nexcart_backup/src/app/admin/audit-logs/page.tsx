'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Loader2, Calendar, User, Info } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/admin/audit-logs');
        if (res.ok) {
          const data = await res.json();
          setLogs(data.auditLogs);
        }
      } catch (e) {
        console.error("Failed to load audit logs", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return 'text-red-500 font-bold';
    if (action.includes('CREATE') || action.includes('REGISTER')) return 'text-green-600 dark:text-green-400 font-semibold';
    if (action.includes('LOGIN')) return 'text-blue-500 font-semibold';
    return 'text-foreground font-medium';
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-border/80 pb-4">
        <div>
          <h1 className="text-xl font-bold font-display">Security Audits</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Chronological system audit logs of database alterations, security checkouts, and admin actions.</p>
        </div>
      </div>

      {/* Audit Logs list */}
      {logs.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm divide-y divide-border/60">
          {logs.map((log) => (
            <div key={log.id} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs hover:bg-secondary/10 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded bg-secondary border border-border font-mono text-[9px] ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <p className="text-foreground leading-relaxed flex items-start gap-1.5 font-sans">
                  <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {log.details}
                </p>
              </div>

              {log.userId && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-semibold shrink-0 bg-secondary/50 rounded-lg px-3 py-1.5 border border-border/50 self-start sm:self-center">
                  <User className="h-3.5 w-3.5" />
                  <span>UID: {log.userId.substring(0, 12)}...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-border bg-card rounded-2xl p-6">
          <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-sm font-bold text-foreground font-display font-semibold">Zero logs recorded</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
            Register or authenticate account logins to begin populated audit logs.
          </p>
        </div>
      )}

    </div>
  );
}
