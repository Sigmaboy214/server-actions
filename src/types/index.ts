/**
 * Represents a successful server action response
 */
export type SuccessActionResponse<T> = {
  ok: true;
  message: string;
  data: T;
};

/**
 * Represents a failed server action response
 */
export type ErrorActionResponse = {
  ok: false;
  message: string;
  error: Error;
};

/**
 * Union type for all possible server action responses
 */
export type ServerActionResponse<T> =
  | SuccessActionResponse<T>
  | ErrorActionResponse;

/**
 * Configuration options for the useSAR hook
 *
 * @template T The expected data type returned by the server action
 */
export type SAROptions<T = any> = {
  /** Server action wrapped with withFormTransform */
  action: (...args: any[]) => Promise<ServerActionResponse<T>>;
  /** Condition to execute the action. If false, won't execute */
  condition?: boolean;
  /** Time in ms to keep data in cache. 0 = no cache */
  cacheTime?: number;
  /** Automatically execute when component mounts */
  revalidateOnMount?: boolean;
  /** Revalidate when window gains focus */
  revalidateOnFocus?: boolean;
  /** Minimum interval between requests to avoid duplicates (ms) */
  dedupingInterval?: number;
  /** Execute immediately on mount (ignores condition on first render) */
  executeOnMount?: boolean;
  /** Initial data to pass when executeOnMount is true */
  initialExecuteData?: FormData | Record<string, any>;
  /** Success callback */
  onSuccess?: (data: T) => void;
  /** Error callback */
  onError?: (error: string) => void;
};

/**
 * Return type of the useSAR hook
 *
 * @template T The expected data type returned by the server action
 */
export type SARReturn<T> = {
  /** Data returned by the last successful execution */
  data?: T;
  /** Error message from the last execution */
  error?: string;
  /** Current loading state */
  loading: boolean;
  /** Function to manually execute the server action */
  execute: (
    data?: FormData | Record<string, any>
  ) => Promise<ServerActionResponse<T> | void>;
  /** Function to refetch with the same previous data */
  refetch: () => Promise<ServerActionResponse<T> | void>;
  /** Directly mutate local data */
  mutate: (data: T | undefined) => void;
  /** Optimistic update with function */
  optimisticMutate: (updateFn: OptimisticUpdate<T>) => void;
  /** Clear data and error */
  reset: () => void;
};

/**
 * Function type for optimistic updates
 *
 * @template T The data type being updated
 * @param currentData The current data (may be undefined)
 * @returns The new data (may be undefined)
 */
export type OptimisticUpdate<T> = (currentData: T | undefined) => T | undefined;
