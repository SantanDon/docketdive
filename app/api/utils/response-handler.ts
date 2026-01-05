/**
 * API Response Handler
 * Standardizes all API responses (success & error)
 * Ensures consistent format and proper error sanitization
 */

import { APIError, ErrorCode, normalizeError } from '@/lib/error-types';

interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    statusCode: number;
    details: Record<string, any> | undefined;
    errorId: string;
    timestamp: string;
  };
}

/**
 * Create successful response
 */
export function successResponse<T>(data: T, statusCode: number = 200): Response {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return Response.json(response, { status: statusCode });
}

/**
 * Create error response
 * Sanitizes sensitive information for production
 */
export function errorResponse(error: APIError | Error, statusCode?: number): Response {
  const apiError = error instanceof APIError ? error : normalizeError(error);
  const status = statusCode || apiError.statusCode;
  
  // Generate error ID for tracking
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Log error for monitoring
  console.error(`[API Error] ${errorId}`, {
    code: apiError.code,
    message: apiError.message,
    statusCode: status,
    details: apiError.details,
  });

  const response: ErrorResponse = {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      statusCode: status,
      // Only include details in development
      details: process.env.NODE_ENV === 'development' ? apiError.details : undefined,
      errorId,
      timestamp: new Date().toISOString(),
    },
  };

  return Response.json(response, { status });
}

/**
 * Validation error response
 */
export function validationError(message: string, details?: Record<string, any>): Response {
  return errorResponse(
    new APIError(ErrorCode.VALIDATION_FAILED, message, 400, details)
  );
}

/**
 * Authentication error response
 */
export function authError(message: string = 'Authentication required'): Response {
  return errorResponse(
    new APIError(ErrorCode.AUTH_REQUIRED, message, 401)
  );
}

/**
 * Not found error response
 */
export function notFoundError(resource: string = 'Resource'): Response {
  return errorResponse(
    new APIError(ErrorCode.NOT_FOUND, `${resource} not found`, 404)
  );
}

/**
 * Server error response
 */
export function serverError(message: string = 'Internal server error', details?: Record<string, any>): Response {
  return errorResponse(
    new APIError(ErrorCode.SERVER_ERROR, message, 500, details)
  );
}

/**
 * Handle try-catch in API routes
 * Automatically normalizes errors and returns proper response
 */
export async function handleApiOperation<T>(
  operation: () => Promise<T>,
  successStatusCode: number = 200
): Promise<Response> {
  try {
    const data = await operation();
    return successResponse(data, successStatusCode);
  } catch (error) {
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Check if response is successful
 */
export function isSuccessResponse(response: SuccessResponse<any> | ErrorResponse): response is SuccessResponse<any> {
  return response.success === true;
}

/**
 * Check if response is error
 */
export function isErrorResponse(response: SuccessResponse<any> | ErrorResponse): response is ErrorResponse {
  return response.success === false;
}
