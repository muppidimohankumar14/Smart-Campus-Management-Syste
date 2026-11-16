import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastMessage } from '../types/student';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0 no-print"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        const containerStyle = isSuccess
          ? 'border-emerald-200 bg-white text-slate-900 dark:border-emerald-800/70 dark:bg-slate-900 dark:text-slate-100'
          : isError
          ? 'border-red-200 bg-white text-slate-900 dark:border-red-800/70 dark:bg-slate-900 dark:text-slate-100'
          : 'border-blue-200 bg-white text-slate-900 dark:border-blue-800/70 dark:bg-slate-900 dark:text-slate-100';

        const iconStyle = isSuccess
          ? 'text-emerald-600 dark:text-emerald-400'
          : isError
          ? 'text-red-600 dark:text-red-400'
          : 'text-blue-600 dark:text-blue-400';

        return (
          <div
            key={toast.id}
            role="status"
            className={`flex items-start gap-3 rounded-xl border p-3.5 shadow-lg transition-all duration-150 ${containerStyle}`}
          >
            <div className={`mt-0.5 shrink-0 ${iconStyle}`}>
              {isSuccess ? (
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              ) : isError ? (
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Info className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-5">{toast.title}</p>
              {toast.message && (
                <p className="mt-0.5 text-xs leading-4 text-slate-600 dark:text-slate-400">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
