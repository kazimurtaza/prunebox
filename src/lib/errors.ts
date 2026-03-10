import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Standard error response format
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

/**
 * HTTP status codes enum for type safety
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Predefined error types
 */
export enum ErrorType {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  FORBIDDEN = 'FORBIDDEN',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELDS = 'MISSING_FIELDS',
  INVALID_REQUEST = 'INVALID_REQUEST',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
}

/**
 * Creates a standardized JSON error response
 */
export function apiError(
  error: ErrorType | string,
  message: string,
  status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
): NextResponse<ApiError> {
  // Log error for debugging
  if (status >= 500) {
    logger.error(`[API Error] ${status} ${error}: ${message}`);
  } else {
    logger.warn(`[API Error] ${status} ${error}: ${message}`);
  }

  return NextResponse.json(
    {
      error: {
        code: error,
        message,
        status,
      },
    },
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Pre-configured error responses for common scenarios
 */

export class ApiErrorResponse {
  static unauthorized(message = 'Authentication required') {
    return apiError(ErrorType.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);
  }

  static invalidToken(message = 'Invalid or expired access token') {
    return apiError(ErrorType.INVALID_TOKEN, message, HttpStatus.UNAUTHORIZED);
  }

  static badRequest(message = 'Invalid request') {
    return apiError(ErrorType.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST);
  }

  static missingFields(fields: string[] = []) {
    const message = fields.length > 0
      ? `Missing required fields: ${fields.join(', ')}`
      : 'Missing required fields';
    return apiError(ErrorType.MISSING_FIELDS, message, HttpStatus.BAD_REQUEST);
  }

  static notFound(resource = 'Resource') {
    return apiError(ErrorType.NOT_FOUND, `${resource} not found`, HttpStatus.NOT_FOUND);
  }

  static conflict(message = 'Resource conflict') {
    return apiError(ErrorType.CONFLICT, message, HttpStatus.CONFLICT);
  }

  static forbidden(message = 'Access forbidden') {
    return apiError(ErrorType.FORBIDDEN, message, HttpStatus.FORBIDDEN);
  }

  static internal(message = 'Internal server error') {
    return apiError(ErrorType.INTERNAL_ERROR, message, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return apiError(ErrorType.TOO_MANY_REQUESTS, message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

/**
 * Wrapper for API route handlers that provides automatic error handling
 * Use this to wrap your route handler logic
 */
export async function withErrorHandling(
  handler: () => Promise<NextResponse>,
  errorMessage = 'Internal server error'
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    logger.error('Unhandled error in API route:', error);

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: { target?: string[] } };

      // Unique constraint violation
      if (prismaError.code === 'P2002') {
        const target = prismaError.meta?.target?.join(', ') || 'resource';
        return apiError(
          ErrorType.ALREADY_EXISTS,
          `A record with this ${target} already exists`,
          HttpStatus.CONFLICT
        );
      }

      // Record not found
      if (prismaError.code === 'P2025') {
        return apiError(
          ErrorType.NOT_FOUND,
          'Record not found',
          HttpStatus.NOT_FOUND
        );
      }
    }

    return apiError(
      ErrorType.INTERNAL_ERROR,
      errorMessage,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Helper to validate request body fields
 */
export function requireFields<T extends Record<string, unknown>>(
  body: T,
  fields: (keyof T)[]
): { valid: boolean; missing?: string[] } {
  const missing = fields.filter((field) => !body[field]);

  if (missing.length > 0) {
    return { valid: false, missing: missing as string[] };
  }

  return { valid: true };
}
