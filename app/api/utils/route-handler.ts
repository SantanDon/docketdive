/**
 * Route Handler Wrapper
 * Higher-order function that wraps API route handlers with error handling
 * Automatically catches errors and returns proper error responses
 */

import { errorResponse } from './response-handler';
import { normalizeError } from '@/lib/error-types';

/**
 * Wrap an async API route handler with error handling
 * Usage: export const POST = withErrorHandling(async (req) => { ... });
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      // Call the actual route handler
      const response = await handler(req);
      return response;
    } catch (error) {
      // Normalize the error and return error response
      const apiError = normalizeError(error);
      return errorResponse(apiError);
    }
  };
}

/**
 * Wrap GET method
 */
export function GET(handler: (req: Request) => Promise<Response>) {
  return withErrorHandling(handler);
}

/**
 * Wrap POST method
 */
export function POST(handler: (req: Request) => Promise<Response>) {
  return withErrorHandling(handler);
}

/**
 * Wrap PUT method
 */
export function PUT(handler: (req: Request) => Promise<Response>) {
  return withErrorHandling(handler);
}

/**
 * Wrap DELETE method
 */
export function DELETE(handler: (req: Request) => Promise<Response>) {
  return withErrorHandling(handler);
}

/**
 * Wrap PATCH method
 */
export function PATCH(handler: (req: Request) => Promise<Response>) {
  return withErrorHandling(handler);
}

/**
 * Parse JSON request body with validation
 */
export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Validate required fields in object
 */
export function validateRequired(data: Record<string, any>, requiredFields: string[]): void {
  const missing = requiredFields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Validate enum value
 */
export function validateEnum<T>(value: any, enumValues: T[], fieldName: string): void {
  if (!enumValues.includes(value)) {
    throw new Error(
      `Invalid ${fieldName}. Must be one of: ${enumValues.join(', ')}`
    );
  }
}

/**
 * Example usage in an API route:
 * 
 * // app/api/example/route.ts
 * import { POST } from '@/app/api/utils/route-handler';
 * import { successResponse, validationError } from '@/app/api/utils/response-handler';
 * import { parseJsonBody, validateRequired } from '@/app/api/utils/route-handler';
 * 
 * export const POST = async (req: Request) => {
 *   const body = await parseJsonBody(req);
 *   validateRequired(body, ['name', 'email']);
 *   
 *   // Process request
 *   const result = await someOperation(body);
 *   return successResponse(result);
 * };
 */
