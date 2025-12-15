/**
 * API utility for handling requests with WAF protection
 * Gracefully handles ModSecurity blocked requests
 */

export class WAFBlockedError extends Error {
  constructor(message: string = 'Request blocked by security firewall') {
    super(message);
    this.name = 'WAFBlockedError';
  }
}

export class APIError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Safe fetch wrapper that handles WAF blocked responses
 */
export async function safeFetch<T = any>(
  url: string, 
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options;

  // Add default headers
  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle WAF blocked requests (403 Forbidden)
    if (response.status === 403) {
      throw new WAFBlockedError('🛡️ Request blocked by security firewall. Suspicious input detected.');
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Non-JSON response usually means WAF blocked it
      if (!response.ok) {
        throw new WAFBlockedError('🛡️ Request blocked by security firewall.');
      }
      // For successful non-JSON responses, return empty object
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.message || data.error || `Request failed with status ${response.status}`,
        response.status
      );
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }

    // Handle JSON parse errors (WAF returns HTML)
    if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
      throw new WAFBlockedError('🛡️ Request blocked by security firewall. Suspicious input detected.');
    }

    // Re-throw known errors
    if (err instanceof WAFBlockedError || err instanceof APIError) {
      throw err;
    }

    // Network errors
    if (err.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection.');
    }

    throw err;
  }
}

/**
 * Convenience methods
 */
export const api = {
  get: <T = any>(url: string, options?: FetchOptions) => 
    safeFetch<T>(url, { ...options, method: 'GET' }),
  
  post: <T = any>(url: string, body: any, options?: FetchOptions) =>
    safeFetch<T>(url, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(body) 
    }),
  
  put: <T = any>(url: string, body: any, options?: FetchOptions) =>
    safeFetch<T>(url, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(body) 
    }),
  
  delete: <T = any>(url: string, options?: FetchOptions) =>
    safeFetch<T>(url, { ...options, method: 'DELETE' }),
};

export default api;
