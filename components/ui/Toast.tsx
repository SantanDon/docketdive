"use client";

import * as React from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast, type Toast as ToastType, type ToastType as ToastVariant } from "@/context/ToastContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Toast Component
 * 
 * Renders individual toast notifications with:
 * - Smooth enter/exit animations
 * - Swipe-to-dismiss gesture
 * - Type-specific icons and colors
 * - Optional action button
 */

const toastIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
};

const toastStyles: Record<ToastVariant, string> = {
  success: "bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
  error: "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
  warning: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
  info: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
};

const iconStyles: Record<ToastVariant, string> = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
};

interface ToastItemProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    // Dismiss if dragged far enough to the right
    if (info.offset.x > 100 || info.velocity.x > 500) {
      onDismiss(toast.id);
    }
  };

  return (
    <motion.div
      layout
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 100, scale: 0.9 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 100, scale: 0.9 }}
      transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", damping: 25, stiffness: 300 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.5 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-xl border shadow-lg",
        "backdrop-blur-sm",
        "cursor-grab active:cursor-grabbing",
        "min-w-[300px] max-w-[400px]",
        toastStyles[toast.type],
        isDragging && "shadow-xl"
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className={cn("flex-shrink-0 mt-0.5", iconStyles[toast.type])}>
        {toastIcons[toast.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-sm opacity-80">{toast.description}</p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4 opacity-60" />
      </button>

      {/* Progress bar for auto-dismiss */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: "linear" }}
          className="absolute bottom-0 left-0 right-0 h-1 bg-current opacity-20 origin-left rounded-b-xl"
        />
      )}
    </motion.div>
  );
}

/**
 * Toast Container
 * Renders all active toasts in a stack
 */
export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Simple toast trigger for testing
 */
export function ToastDemo() {
  const { addToast } = useToast();

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => addToast({ type: "success", title: "Success!", description: "Your action was completed." })}
        className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm"
      >
        Success Toast
      </button>
      <button
        onClick={() => addToast({ type: "error", title: "Error", description: "Something went wrong." })}
        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm"
      >
        Error Toast
      </button>
      <button
        onClick={() => addToast({ type: "warning", title: "Warning", description: "Please review this." })}
        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm"
      >
        Warning Toast
      </button>
      <button
        onClick={() => addToast({ type: "info", title: "Info", description: "Here's some information." })}
        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm"
      >
        Info Toast
      </button>
    </div>
  );
}

export { ToastItem };
