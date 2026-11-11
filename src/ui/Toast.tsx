import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastOptions {
  id?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<(ToastOptions & { id: string })[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ id = Math.random().toString(36).slice(2), type = 'info', message, duration = 5000, action }: ToastOptions) => {
      setToasts((prev) => [...prev, { id, type, message, duration, action }]);
      if (duration > 0) {
        setTimeout(() => {
          hideToast(id);
        }, duration);
      }
    },
    [hideToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none toast-container no-print"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const icons = {
            info: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
            success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
            warning: <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          };

          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg text-slate-800 dark:text-slate-100 animate-in slide-in-from-bottom-2"
              role="alert"
            >
              <div className="flex items-center gap-3">
                {icons[toast.type || 'info']}
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <div className="flex items-center gap-2">
                {toast.action && (
                  <button
                    onClick={() => {
                      toast.action?.onClick();
                      hideToast(toast.id);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors"
                  >
                    {toast.action.label}
                  </button>
                )}
                <button
                  onClick={() => hideToast(toast.id)}
                  aria-label="Dismiss toast"
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

