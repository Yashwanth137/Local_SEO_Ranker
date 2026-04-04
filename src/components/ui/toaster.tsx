"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";

// ── Toast Types ──
type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

// ── Global Event Bus (avoids Context coupling for server components) ──
type ToastListener = (toast: Toast) => void;
const listeners: Set<ToastListener> = new Set();

export function toast(message: string, variant: ToastVariant = "info") {
  const newToast: Toast = { id: crypto.randomUUID(), message, variant };
  listeners.forEach((fn) => fn(newToast));
}

// ── Icons & Colors ──
const variantConfig: Record<ToastVariant, { icon: React.ReactNode; border: string; bg: string }> = {
  success: {
    icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
  },
  error: {
    icon: <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />,
    border: "border-red-500/30",
    bg: "bg-red-500/10",
  },
  info: {
    icon: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/10",
  },
};

// ── Toaster Component ──
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler: ToastListener = (t) => {
      setToasts((prev) => [...prev, t]);
      // Auto-dismiss after 4s
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const cfg = variantConfig[t.variant];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border ${cfg.border} ${cfg.bg} backdrop-blur-lg shadow-lg shadow-black/20`}
            >
              {cfg.icon}
              <span className="text-sm text-foreground flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
