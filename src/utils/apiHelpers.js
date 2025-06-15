import api from './axios.js';

/**
 * Utility for making API requests with retry logic and better error handling
 */

/**
 * Check if error is related to database connection limits
 * @param {Error} error - The error object
 * @returns {boolean}
 */
export const isConnectionError = (error) => {
  return error.response?.data?.message?.includes('max_connections_per_hour') ||
         error.response?.data?.message?.includes('Authentication to') ||
         error.response?.status === 503 ||
         error.code === 'ECONNREFUSED' ||
         error.isConnectionError;
};

/**
 * Wait for specified milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make API request with retry logic
 * @param {function} requestFn - Function that returns the API request promise
 * @param {object} options - Configuration options
 * @returns {Promise}
 */
export const apiRequestWithRetry = async (requestFn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    onRetry = null,
    retryCondition = isConnectionError
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's not a connection error or we've exceeded max retries
      if (!retryCondition(error) || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      
      console.log(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`);
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, maxRetries + 1, error);
      }

      await wait(delay);
    }
  }

  throw lastError;
};

/**
 * Enhanced API wrapper with built-in retry and caching
 */
export class EnhancedAPI {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get cache key for request
   */
  getCacheKey(url, params = {}) {
    return `${url}?${JSON.stringify(params)}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.cacheTTL;
  }

  /**
   * GET request with caching and retry
   */
  async get(url, params = {}, options = {}) {
    const cacheKey = this.getCacheKey(url, params);
    const cached = this.cache.get(cacheKey);

    // Return cached data if valid and not forcing refresh
    if (this.isCacheValid(cached) && !options.forceRefresh) {
      return { data: cached.data };
    }

    // Make request with retry logic
    const response = await apiRequestWithRetry(
      () => api.get(url, { params }),
      {
        maxRetries: options.maxRetries || 2,
        onRetry: options.onRetry
      }
    );

    // Cache the response
    this.cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });

    return response;
  }

  /**
   * POST request with retry (no caching for mutations)
   */
  async post(url, data = {}, options = {}) {
    return await apiRequestWithRetry(
      () => api.post(url, data),
      {
        maxRetries: options.maxRetries || 1, // Fewer retries for mutations
        onRetry: options.onRetry
      }
    );
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(url, params = {}) {
    const cacheKey = this.getCacheKey(url, params);
    this.cache.delete(cacheKey);
  }
}

// Export singleton instance
export const enhancedAPI = new EnhancedAPI();

export default enhancedAPI;
