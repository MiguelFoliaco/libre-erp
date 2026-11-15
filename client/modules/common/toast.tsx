import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  notify: (kind: ToastKind, message: string) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const nextId = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
    setToast(null);
  }, []);

  const notify = useCallback(
    (kind: ToastKind, message: string) => {
      if (timeout.current) clearTimeout(timeout.current);
      setToast({ id: ++nextId.current, kind, message });
      timeout.current = setTimeout(dismiss, 5000);
    },
    [dismiss],
  );

  useEffect(() => () => {
    if (timeout.current) clearTimeout(timeout.current);
  }, []);

  return (
    <ToastContext.Provider value={{ notify, dismiss }}>
      {children}
      {toast && (
        <div className="toast z-10000 toast-top toast-end ">
          <div
            key={toast.id}
            className={`alert alert-${toast.kind} max-w-sm shadow-lg`}
            role={toast.kind === 'error' ? 'alert' : 'status'}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              aria-label="Cerrar notificación"
              onClick={dismiss}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
