/**
 * React Server Actions Library
 * 
 * A comprehensive library for handling React Server Actions with automatic
 * FormData/Object transformation, data sanitization, and advanced React hooks.
 * 
 * @example
 * ```tsx
 * // Server side
 * const createUser = withFormTransform(async (data: { name: string }) => {
 *   return await db.user.create({ data });
 * });
 * 
 * // Client side
 * const { data, loading, execute } = useSAR({
 *   action: createUser,
 *   executeOnMount: false
 * });
 * ```
 */

// Core types
export type { ServerActionResponse } from "./types/index";

// Data transformation utilities
export { formDataToObject, objectToFormData } from "./utils/transform";

// Server action utilities
export { withFormTransform } from "./utils/wrapper";
export { serverActionRequest } from "./utils/request";

// Response helpers
export { createSuccessResponse, createErrorResponse, sanitizeForTransport } from "./utils/response";
export type { Sanitized } from "./utils/response";

// React hooks
export { useSAR } from "./hooks/useSAR";

// Hook types
export type { SAROptions, SARReturn, OptimisticUpdate } from "./types/index";
