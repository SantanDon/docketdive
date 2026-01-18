"use client";

import * as React from "react";
import { createContext, useContext, useCallback, useState } from "react";

/**
 * Toast Notification System
 * 
 * Critical comparison to ChatGPT/Claude:
 * 
 * ChatGPT:
 * - Minimal toast notifications
 * - Appear at bottom of screen
 * - Auto-dismiss after ~3 seconds
 * - Simple success/error states
 * 
 * Claude:
 * - Toast notifications at top-right
 * - Smooth slide-in animations
 * - Clear dismiss button
 * - Multiple toast stacking
 * 
 * DocketDive Toast System:
 * - Positioned at bottom-right (less intrusive for chat)
 * - 5 second auto-dismiss (configurable)
 * - Swipe-to-dismiss gesture
 * - Stacked with proper spacing
 * - Success, error, warning, info variants
 * - Smooth enter/exit animations
 */

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string | undefined;
  duration?: number | undefined;
  action?: {
    label: string;
    onClick: () => void;
  } | undefined;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Maximum number of toasts to show at once
const MAX_TOASTS = 5;

// Default duration in ms
const DEFAULT_DURATION = 5000;

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">): string => {
    const id = `toast-${++toastCounter}`;
    const duration = toast.duration ?? DEFAULT_DURATION;

    setToasts((prev) => {
      // Limit to MAX_TOASTS, remove oldest if needed
      const newToasts = [...prev, { ...toast, id, duration }];
      if (newToasts.length > MAX_TOASTS) {
        return newToasts.slice(-MAX_TOASTS);
      }
      return newToasts;
    });

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

/**
 * Convenience functions for common toast types
 */
export function useToastActions() {
  const { addToast } = useToast();

  return {
    success: (title: string, description?: string) =>
      addToast({ type: "success", title, description }),
    error: (title: string, description?: string) =>
      addToast({ type: "error", title, description }),
    warning: (title: string, description?: string) =>
      addToast({ type: "warning", title, description }),
    info: (title: string, description?: string) =>
      addToast({ type: "info", title, description }),
  };
}

export { ToastContext };
