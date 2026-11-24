import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { text } from '../language';
import { clsx } from 'clsx';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}

const classBgByKind: Record<ToastKind, { text: string; bg: string }> = {
  success: {
    bg: 'bg-linear-to-tr from-emerald-500 to-green-500',
    text: 'text-white',
  },
  error: {
    bg: 'bg-linear-to-tr from-red-500 to-rose-600',
    text: 'text-white',
  },
  warning: {
    bg: 'bg-linear-to-tr from-amber-400 to-orange-500',
    text: 'text-white',
  },
  info: {
    bg: 'bg-linear-to-tr from-blue-500 to-indigo-500',
    text: 'text-white',
  },
};

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
            className={
              clsx(
                `alert w-fit border-none! rounded-sm min-w-50 shadow-lg`,
                classBgByKind[toast.kind].bg
              )
            }
            role={toast.kind === 'error' ? 'alert' : 'status'}
          >
            <span className={classBgByKind[toast.kind].text} >{toast.message}</span>
            <button
              type="button"
              className={
                clsx(
                  "btn btn-ghost btn-xs",
                  classBgByKind[toast.kind].text

                )
              }
              aria-label={text('common.toast.closeNotification')}
              onClick={dismiss}
            >
              {text('common.toast.close')}
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
