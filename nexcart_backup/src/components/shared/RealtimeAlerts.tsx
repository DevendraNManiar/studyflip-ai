'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Bell, X, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface AlertMessage {
  id: string;
  title: string;
  message: string;
}

export default function RealtimeAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  useEffect(() => {
    // Connect to Server-Sent Events stream
    const sse = new EventSource('/api/notifications/stream');

    sse.addEventListener('welcome', (e: MessageEvent) => {
      console.log("📡 SSE connection established.");
    });

    sse.addEventListener('order_update', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        // Only trigger alerts for the currently logged-in user
        if (user && data.userId === user.id) {
          const newAlert: AlertMessage = {
            id: `alert-${Date.now()}`,
            title: `Order Dispatched/Fulfillment Shift`,
            message: data.message || `Order ${data.orderNumber} status updated to ${data.status}.`
          };
          setAlerts((prev) => [newAlert, ...prev]);
        }
      } catch (err) {
        console.error("Failed to parse SSE payload:", err);
      }
    });

    sse.onerror = (err) => {
      console.warn("⚠️ SSE connection lost. EventSource attempting auto-reconnect...");
    };

    return () => {
      sse.close();
    };
  }, [user]);

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto bg-card text-foreground border border-accent/30 rounded-2xl p-4 flex gap-3 shadow-2xl backdrop-blur-md glassmorphism"
          >
            <div className="h-8 w-8 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center text-accent shrink-0">
              <Bell className="h-4.5 w-4.5 animate-bounce" />
            </div>
            
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-bold font-display flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-accent" />
                {alert.title}
              </h4>
              <p className="text-[11px] text-muted-foreground leading-normal">{alert.message}</p>
            </div>

            <button
              onClick={() => removeAlert(alert.id)}
              className="text-muted-foreground hover:text-foreground shrink-0 self-start p-1"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
