"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: "border-l-success bg-success-50 text-success-700",
  error: "border-l-danger bg-danger-50 text-danger-700",
  warning: "border-l-warning bg-warning-50 text-warning-700",
  info: "border-l-primary bg-primary-50 text-primary-700",
};

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <div
              key={toast.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border-l-4 bg-white p-4 shadow-lg ring-1 ring-black/5 animate-slide-in-right",
                colors[toast.type]
              )}
            >
              <Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm flex-1">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-60 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function toast(type: ToastType, message: string) {
  const id = ++toastId;
  const event = new CustomEvent("toast", { detail: { id, type, message } });
  window.dispatchEvent(event);
  setTimeout(() => {
    const removeEvent = new CustomEvent("toast-remove", { detail: { id } });
    window.dispatchEvent(removeEvent);
  }, 4000);
}
