'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.users || []);
      }
    } catch (e) {
      console.error("Failed to load customer list", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleRoleToggle = async (id: string, currentRole: 'ADMIN' | 'CUSTOMER') => {
    const nextRole = currentRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    if (!confirm(`Are you sure you want to change this user's role to ${nextRole}?`)) return;

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role: nextRole })
      });
      if (res.ok) {
        setCustomers(customers.map(c => c.id === id ? { ...c, role: nextRole } : c));
      }
    } catch (e) {
      console.error(e);
    }
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
      <div className="flex justify-between items-center border-b border-border/80 pb-4">
        <div>
          <h1 className="text-xl font-bold font-display">User Log</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Control registered accounts, audit permissions, and configure RBAC roles.</p>
        </div>
        <button
          onClick={fetchCustomers}
          className="p-2 border border-border rounded-full hover:bg-secondary text-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-wider pb-3 bg-secondary/15">
                <th className="py-3 px-4">Profile Avatar</th>
                <th>Name Details</th>
                <th>Email Reference</th>
                <th>Registered Date</th>
                <th>User Role</th>
                <th className="text-right px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/10">
                  <td className="py-3 px-4 shrink-0">
                    <img
                      src={c.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name || 'User')}`}
                      alt={c.name}
                      className="h-9 w-9 rounded-full object-cover border border-border bg-muted"
                    />
                  </td>
                  <td className="font-bold font-display text-foreground">
                    {c.name || 'Unspecified'}
                  </td>
                  <td className="font-semibold text-muted-foreground">{c.email}</td>
                  <td>{new Date(c.createdAt || Date.now()).toLocaleDateString()}</td>
                  <td>
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${c.role === 'ADMIN' ? 'bg-amber-500/10 text-accent border border-accent/20' : 'bg-blue-500/10 text-blue-600'}`}>
                      {c.role}
                    </span>
                  </td>
                  <td className="text-right px-4 whitespace-nowrap">
                    <button
                      onClick={() => handleRoleToggle(c.id, c.role)}
                      className="p-1.5 border border-border rounded hover:bg-secondary text-foreground inline-flex items-center gap-1 font-semibold"
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Toggle Permissions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
