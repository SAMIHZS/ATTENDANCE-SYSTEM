import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-6 py-3 border border-outline-subtle bg-white shadow-xl animate-in slide-in-from-right-full duration-300 ${
              toast.type === 'success' ? 'border-l-4 border-l-secondary' :
              toast.type === 'error' ? 'border-l-4 border-l-error' :
              toast.type === 'warning' ? 'border-l-4 border-l-primary' :
              'border-l-4 border-l-on-surface-variant'
            }`}
          >
            <span className={`material-symbols-outlined text-[18px] ${
              toast.type === 'success' ? 'text-secondary' :
              toast.type === 'error' ? 'text-error' :
              toast.type === 'warning' ? 'text-primary' :
              'text-on-surface-variant'
            }`}>
              {toast.type === 'success' ? 'check_circle' :
               toast.type === 'error' ? 'error' :
               toast.type === 'warning' ? 'warning' : 'info'}
            </span>
            <span className="font-label text-xs font-bold uppercase tracking-widest text-on-surface">
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
