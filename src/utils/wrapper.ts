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
 * - **Smart Response Detection**: Detects response patterns and handles accordingly
 * 
 * **Supported Response Patterns**:
 * 1. `{ ok: true, message: string, data: any }` → Uses your custom success message
 * 2. `{ ok: false, message: string, error: any }` → Throws error with your message
 * 3. `{ data: any, message?: string }` → Success with optional custom message
 * 4. `{ error: any, message?: string }` → Throws error with optional message
 * 5. `any` → Wraps in default success response
 * 
 * @param serverAction - Server action that returns data or response object
 * @returns Function that accepts FormData and returns ServerActionResponse with sanitized data
 * 
 * @example
 * ```ts
 * // Pattern 1: Direct data (auto-wrapped)
 * const getUser = withFormTransform(async (data: { id: string }) => {
 *   return await db.user.findUnique({ where: { id: data.id } });
 *   // → { ok: true, message: "Operation completed successfully", data: user }
 * });
 * 
 * // Pattern 2: Custom success message
 * const createUser = withFormTransform(async (data: CreateUserInput) => {
 *   const user = await db.user.create({ data });
 *   return {
 *     ok: true,
 *     message: "User created successfully",
 *     data: user
 *   };
 *   // → { ok: true, message: "User created successfully", data: user }
 * });
 * 
 * // Pattern 3: Error handling with custom message
 * const deleteUser = withFormTransform(async (data: { id: string }) => {
 *   const user = await db.user.findUnique({ where: { id: data.id } });
 *   if (!user) {
 *     return {
 *       ok: false,
 *       message: "User not found",
 *       error: new Error("User not found")
 *     };
 *     // → Throws error → { ok: false, message: "User not found", error: ... }
 *   }
 *   
 *   await db.user.delete({ where: { id: data.id } });
 *   return { ok: true, message: "User deleted successfully", data: null };
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
      
      // Check if result has the pattern of a response object with ok/error
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        const response = result as any;
        
        // Pattern 1: { ok: boolean, message: string, data?: any, error?: any }
        if (typeof response.ok === 'boolean') {
          if (response.ok) {
            // Success response - use the provided message and data
            return {
              ok: true,
              message: response.message || "Operation completed successfully",
              data: sanitizeDataForClient(response.data) as Sanitized<R>
            };
          } else {
            // Error response - throw error to trigger catch block
            const error = response.error || new Error(response.message || "Operation failed");
            throw error;
          }
        }
        
        // Pattern 2: { data: any, message?: string } (success)
        if ('data' in response && !('error' in response)) {
          return {
            ok: true,
            message: response.message || "Operation completed successfully",
            data: sanitizeDataForClient(response.data) as Sanitized<R>
          };
        }
        
        // Pattern 3: { error: any, message?: string } (error)
        if ('error' in response && !('data' in response)) {
          const error = response.error instanceof Error ? response.error : new Error(response.message || "Operation failed");
          throw error;
        }
      }
      
      // Regular data - wrap in success response
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
