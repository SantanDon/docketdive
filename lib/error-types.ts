/**
 * Error Types & Constants for DocketDive
 * Standardized error handling across API & Frontend
 */

export enum ErrorCode {
  // Client Errors (4xx)
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  
  // Server Errors (5xx)
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  
  // Domain-Specific Errors
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  OCR_FAILED = 'OCR_FAILED',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  RAG_FAILED = 'RAG_FAILED',
  
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  REQUEST_FAILED = 'REQUEST_FAILED',
}

/**
 * API Error class - all errors should be converted to this
 */
export class APIError extends Error {
  constructor(
    public code: ErrorCode = ErrorCode.SERVER_ERROR,
    public message: string = 'An unexpected error occurred',
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIError';
  }

  /**
   * Convert to JSON-safe object for API responses
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: process.env.NODE_ENV === 'development' ? this.details : undefined,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Specific error classes for different scenarios
 */
export class ValidationError extends APIError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.VALIDATION_FAILED, message, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthError extends APIError {
  constructor(message: string = 'Authentication required', details?: Record<string, any>) {
    super(ErrorCode.AUTH_REQUIRED, message, 401, details);
    this.name = 'AuthError';
  }
}

export class UploadError extends APIError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.UPLOAD_FAILED, message, 400, details);
    this.name = 'UploadError';
  }
}

export class DatabaseError extends APIError {
  constructor(message: string = 'Database operation failed', details?: Record<string, any>) {
    super(ErrorCode.DATABASE_ERROR, message, 500, details);
    this.name = 'DatabaseError';
  }
}

export class ProcessingError extends APIError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.PROCESSING_FAILED, message, 500, details);
    this.name = 'ProcessingError';
  }
}

/**
 * Error messages map for consistent user-facing messages
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_FAILED]: 'Please check your input and try again',
  [ErrorCode.AUTH_REQUIRED]: 'You need to log in to perform this action',
  [ErrorCode.AUTH_INVALID]: 'Invalid credentials. Please try again',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found',
  [ErrorCode.CONFLICT]: 'This resource already exists',
  [ErrorCode.SERVER_ERROR]: 'An unexpected error occurred. Please try again',
  [ErrorCode.DATABASE_ERROR]: 'Database error. Please try again later',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is currently unavailable. Please try again later',
  [ErrorCode.TIMEOUT]: 'Request timed out. Please try again',
  [ErrorCode.UPLOAD_FAILED]: 'Failed to upload file. Please try again',
  [ErrorCode.PROCESSING_FAILED]: 'Failed to process request. Please try again',
  [ErrorCode.OCR_FAILED]: 'Failed to process document. Please try again',
  [ErrorCode.ANALYSIS_FAILED]: 'Failed to analyze document. Please try again',
  [ErrorCode.RAG_FAILED]: 'Failed to retrieve information. Please try again',
  [ErrorCode.NETWORK_ERROR]: 'Network connection error. Please check your connection',
  [ErrorCode.REQUEST_FAILED]: 'Request failed. Please try again',
};

/**
 * Normalize any error to APIError for consistent handling
 */
export function normalizeError(error: unknown): APIError {
  // Already an APIError
  if (error instanceof APIError) {
    return error;
  }

  // Error object
  if (error instanceof Error) {
    // Check for specific error types
    if (error.name === 'AbortError' || error.message === 'Aborted') {
      return new APIError(ErrorCode.TIMEOUT, 'Request was cancelled', 408);
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new APIError(ErrorCode.NETWORK_ERROR, 'Network connection error', 0);
    }

    // Default to server error
    return new APIError(
      ErrorCode.SERVER_ERROR,
      error.message || 'An unexpected error occurred',
      500,
      {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }
    );
  }

  // String error
  if (typeof error === 'string') {
    return new APIError(ErrorCode.SERVER_ERROR, error, 500);
  }

  // Unknown error type
  return new APIError(ErrorCode.SERVER_ERROR, 'An unexpected error occurred', 500);
}

/**
 * Get user-friendly message for error code
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.SERVER_ERROR];
}

/**
 * Check if error is client error (4xx)
 */
export function isClientError(statusCode: number): boolean {
  return statusCode >= 400 && statusCode < 500;
}

/**
 * Check if error is server error (5xx)
 */
export function isServerError(statusCode: number): boolean {
  return statusCode >= 500 && statusCode < 600;
}
