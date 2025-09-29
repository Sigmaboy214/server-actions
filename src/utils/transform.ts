/**
 * Data transformation utilities for converting between objects and FormData
 */

/**
 * Converts a complex object to FormData, preserving nested structure
 * using dot notation (e.g., user.profile.name) and array indices (e.g., items[0].name)
 * 
 * @param obj - The object to convert to FormData
 * @param prefix - Optional prefix for all keys
 * @returns FormData representation of the object
 * 
 * @example
 * ```ts
 * const data = {
 *   user: { name: 'John', age: 30 },
 *   files: [file1, file2],
 *   createdAt: new Date()
 * };
 * 
 * const formData = objectToFormData(data);
 * // Creates keys: "user.name", "user.age", "files[0]", "files[1]", "createdAt"
 * ```
 */
export function objectToFormData(obj: any, prefix = ""): FormData {
  const formData = new FormData();

  function appendToFormData(value: any, key: string): void {
    if (value === null || value === undefined) {
      formData.append(key, "");
      return;
    }

    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        appendToFormData(item, `${key}[${index}]`);
      });
      return;
    }

    if (typeof value === "object" && value.constructor === Object) {
      Object.keys(value).forEach((nestedKey) => {
        const nestedValue = value[nestedKey];
        const fullKey = key ? `${key}.${nestedKey}` : nestedKey;
        appendToFormData(nestedValue, fullKey);
      });
      return;
    }

    if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else {
      formData.append(key, String(value));
    }
  }

  Object.keys(obj).forEach((key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    appendToFormData(obj[key], fullKey);
  });

  return formData;
}

/**
 * Converts FormData back to an object, reconstructing the original structure
 * based on dot notation and array indices
 * 
 * @param formData - The FormData to convert back to an object
 * @returns Reconstructed object with proper types
 * 
 * @example
 * ```ts
 * const formData = new FormData();
 * formData.append('user.name', 'John');
 * formData.append('user.age', '30');
 * 
 * const obj = formDataToObject(formData);
 * // Result: { user: { name: 'John', age: 30 } }
 * ```
 */
export function formDataToObject<T = any>(formData: FormData): T {
  const result: any = {};

  formData.forEach((value, key) => {
    setNestedValue(result, key, value);
  });

  return result as T;
}

/**
 * Helper function to set nested values using dot notation
 * Automatically converts string values to appropriate types (numbers, booleans, dates)
 */
function setNestedValue(
  obj: any,
  path: string,
  value: FormDataEntryValue
): void {
  const keys = path.split(/[.\[\]]/).filter(Boolean);
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const isNextKeyNumeric = !isNaN(Number(nextKey));

    if (!(key in current)) {
      current[key] = isNextKeyNumeric ? [] : {};
    }

    current = current[key];
  }

  const finalKey = keys[keys.length - 1];
  let processedValue: any = value;

  if (typeof value === "string") {
    // Convert ISO date strings back to Date objects
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      processedValue = new Date(value);
    }
    // Convert numeric strings to numbers
    else if (!isNaN(Number(value)) && value !== "") {
      processedValue = Number(value);
    }
    // Convert boolean strings
    else if (value === "true" || value === "false") {
      processedValue = value === "true";
    }
    // Convert empty strings to null
    else if (value === "") {
      processedValue = null;
    }
  }

  current[finalKey] = processedValue;
}
