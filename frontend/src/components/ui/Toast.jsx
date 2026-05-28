import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastVariants = {
  success: 'bg-success-50 border-success-200 text-success-800 dark:bg-success-900/20 dark:border-success-800 dark:text-success-300',
  error: 'bg-danger-50 border-danger-200 text-danger-800 dark:bg-danger-900/20 dark:border-danger-800 dark:text-danger-300',
  warning: 'bg-warning-50 border-warning-200 text-warning-800 dark:bg-warning-900/20 dark:border-warning-800 dark:text-warning-300',
  info: 'bg-neutral-50 border-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300',
};

const Toast = React.forwardRef(({ 
  className, 
  type = 'info', 
  message, 
  onClose,
  ...props 
}, ref) => {
  const Icon = toastIcons[type] || toastIcons.info;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 100, y: 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 100, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={cn(
        'flex items-center gap-3 rounded-xl border-2 px-4 py-3 shadow-lg',
        toastVariants[type],
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="flex-1 text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
});

Toast.displayName = 'Toast';

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export { Toast, ToastContainer };
