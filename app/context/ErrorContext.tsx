'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { APIError, ErrorCode, getErrorMessage } from '@/lib/error-types';

interface ErrorContextType {
  error: APIError | null;
  showError: (error: APIError | Error | string) => void;
  clearError: () => void;
  setError: (error: APIError | null) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

/**
 * Error Context Provider
 * Manages global error state for the application
 */
export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<APIError | null>(null);

  const showError = useCallback((err: APIError | Error | string) => {
    let apiError: APIError;

    if (err instanceof APIError) {
      apiError = err;
    } else if (err instanceof Error) {
      apiError = new APIError(
        ErrorCode.SERVER_ERROR,
        err.message || 'An unexpected error occurred',
        500
      );
    } else if (typeof err === 'string') {
      apiError = new APIError(ErrorCode.SERVER_ERROR, err, 500);
    } else {
      apiError = new APIError(
        ErrorCode.SERVER_ERROR,
        'An unexpected error occurred',
        500
      );
    }

    setError(apiError);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: ErrorContextType = {
    error,
    showError,
    clearError,
    setError,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

/**
 * Hook to use error context
 */
export function useError(): ErrorContextType {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
}

/**
 * Hook to show error
 */
export function useShowError() {
  const { showError } = useError();
  return showError;
}

/**
 * Hook to clear error
 */
export function useClearError() {
  const { clearError } = useError();
  return clearError;
}
