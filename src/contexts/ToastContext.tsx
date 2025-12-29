import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { ToastContainer, type ToastData, type ToastType } from '../components/common/Toast';

interface ToastContextValue {
  showToast: (options: {
    type: ToastType;
    title: string;
    message?: string;
    txDigest?: string;
    duration?: number;
  }) => void;
  showTxSuccess: (title: string, txDigest: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: {
      type: ToastType;
      title: string;
      message?: string;
      txDigest?: string;
      duration?: number;
    }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newToast: ToastData = {
        id,
        ...options,
      };

      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const showTxSuccess = useCallback(
    (title: string, txDigest: string, message?: string) => {
      showToast({
        type: 'success',
        title,
        message,
        txDigest,
        duration: 8000, // Longer duration for tx toasts
      });
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      showToast({
        type: 'error',
        title,
        message,
        duration: 6000,
      });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, showTxSuccess, showError }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
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
