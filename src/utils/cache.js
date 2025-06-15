/**
 * Simple cache utility for API responses
 * Helps reduce API calls when database connections are limited
 */

class SimpleCache {
  constructor() {
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Set data in cache with TTL
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, data, ttl = this.defaultTTL) {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  }

  /**
   * Get data from cache if not expired
   * @param {string} key - Cache key
   * @returns {any|null} - Cached data or null if expired/not found
   */
  get(key) {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      const now = Date.now();

      // Check if cache has expired
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        this.delete(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to delete cache:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Check if cache exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }
}

// Create and export singleton instance
const cache = new SimpleCache();

export default cache;

/**
 * Hook for using cache in React components
 * @param {string} key - Cache key
 * @param {function} fetcher - Function to fetch data if not cached
 * @param {number} ttl - Cache time to live
 * @returns {object} - {data, loading, error, refetch}
 */
export const useCache = (key, fetcher, ttl) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first unless forced refresh
      if (!force) {
        const cached = cache.get(key);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }
      }

      // Fetch new data
      const result = await fetcher();
      cache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [key]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true)
  };
};
