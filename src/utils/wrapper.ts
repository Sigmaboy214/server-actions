import type { ServerActionResponse } from "../types/index";
import { formDataToObject } from "./transform";

/**
 * Sanitizes data for client transmission by converting non-serializable types to safe formats
 * 
 * @param data - Any data to be sanitized
 * @returns Sanitized data safe for JSON serialization
 */
function sanitizeDataForClient(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeDataForClient);
  }

  if (typeof data === 'object') {
    // Convert Date objects to ISO strings
    if (data instanceof Date) {
      return data.toISOString();
    }

    // Convert File/Blob objects to metadata (not serializable)
    if (data instanceof File || data instanceof Blob) {
      return {
        name: data instanceof File ? data.name : 'blob',
        size: data.size,
        type: data.type,
        _isFile: true
      };
    }

    // Handle plain objects recursively
    if (data.constructor === Object) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = sanitizeDataForClient(value);
      }
      return sanitized;
    }
  }

  return data;
}

/**
 * Type helper for sanitized data transformation
 */
type Sanitized<T> = T extends Date 
  ? string 
  : T extends File 
  ? { name: string; size: number; type: string; _isFile: boolean }
  : T extends Blob
  ? { name: string; size: number; type: string; _isFile: boolean }
  : T extends (infer U)[]
  ? Sanitized<U>[]
  : T extends object
  ? { [K in keyof T]: Sanitized<T[K]> }
  : T;

/**
 * Wraps a server action to provide automatic data transformation and response wrapping
 * 
 * Features:
 * - Automatically transforms FormData to typed objects
 * - Wraps results in ServerActionResponse format
 * - Sanitizes data for client consumption
 * - Handles errors gracefully
 * 
 * @param serverAction - Server action that returns data directly
 * @returns Function that accepts FormData and returns ServerActionResponse with sanitized data
 * 
 * @example
 * ```ts
 * // Your server action (returns data directly)
 * const createUser = withFormTransform(async (data: { name: string }) => {
 *   return await db.user.create({ data });
 * });
 * 
 * // Usage (automatically handles FormData → object conversion)
 * const result = await createUser(formData);
 * // Result: { ok: true, message: "...", data: sanitizedUser }
 * ```
 */
export function withFormTransform<T, R>(
  serverAction: (data: T) => Promise<R> | R
) {
  return async (formData: FormData): Promise<ServerActionResponse<Sanitized<R>>> => {
    try {
      const parsedData = formDataToObject<T>(formData);
      const result = await serverAction(parsedData);
      const sanitizedResult = sanitizeDataForClient(result);

      return {
        ok: true,
        message: "Operation completed successfully",
        data: sanitizedResult as Sanitized<R>
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Error processing request",
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  };
}
