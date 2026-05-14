/**
 * ═══════════════════════════════════════════════════════════
 * SEFARIA CACHE SYSTEM
 * IndexedDB-powered offline-first caching for Torah texts
 * Phase 1: Smart caching with 24hr TTL and fallback chain
 * ═══════════════════════════════════════════════════════════
 */

const CACHE_NAME = 'sefaria-cache-v1';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DB_NAME = 'SefariaDB';
const DB_VERSION = 1;
const STORE_NAME = 'texts';

/**
 * Initialize IndexedDB
 */
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('category', 'category', { unique: false });
      }
    };
  });
}

/**
 * Store data in IndexedDB cache
 */
async function cacheSet(key, data, category = 'general') {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const cacheEntry = {
      key,
      data,
      category,
      timestamp: Date.now()
    };

    await new Promise((resolve, reject) => {
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log(`✅ Cached: ${key} (${category})`);
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

/**
 * Get data from IndexedDB cache
 */
async function cacheGet(key) {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const cacheEntry = await new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!cacheEntry) {
      console.log(`❌ Cache miss: ${key}`);
      return null;
    }

    // Check if cache expired
    const age = Date.now() - cacheEntry.timestamp;
    if (age > CACHE_EXPIRY) {
      console.log(`⏰ Cache expired: ${key} (${Math.round(age / 1000 / 60)} minutes old)`);
      await cacheDel(key); // Clean up expired entry
      return null;
    }

    console.log(`✅ Cache hit: ${key} (${Math.round(age / 1000)} seconds old)`);
    return cacheEntry.data;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Delete data from cache
 */
async function cacheDel(key) {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

/**
 * Clear all cache
 */
async function cacheClear() {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('🧹 Cache cleared');
    return true;
  } catch (error) {
    console.error('Cache clear error:', error);
    return false;
  }
}

/**
 * Get cache statistics
 */
async function cacheStats() {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const allKeys = await new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const allEntries = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const stats = {
      totalEntries: allKeys.length,
      categories: {},
      oldestEntry: null,
      newestEntry: null,
      totalSize: 0
    };

    allEntries.forEach(entry => {
      // Count by category
      stats.categories[entry.category] = (stats.categories[entry.category] || 0) + 1;

      // Track oldest/newest
      if (!stats.oldestEntry || entry.timestamp < stats.oldestEntry) {
        stats.oldestEntry = entry.timestamp;
      }
      if (!stats.newestEntry || entry.timestamp > stats.newestEntry) {
        stats.newestEntry = entry.timestamp;
      }

      // Estimate size
      stats.totalSize += JSON.stringify(entry.data).length;
    });

    console.log('📊 Cache Stats:', stats);
    return stats;
  } catch (error) {
    console.error('Cache stats error:', error);
    return null;
  }
}

/**
 * CACHE-FIRST FETCH STRATEGY
 * 1. Check IndexedDB cache
 * 2. If miss or expired, fetch from Sefaria API
 * 3. Cache response and return
 * 4. On error, return cached data even if expired (fallback)
 */
async function cachedFetch(url, options = {}) {
  const cacheKey = url;
  const category = options.category || 'api';

  try {
    // Step 1: Check cache first
    const cachedData = await cacheGet(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Step 2: Cache miss - fetch from network
    console.log(`🌐 Fetching from network: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Step 3: Cache the response
    await cacheSet(cacheKey, data, category);

    return data;

  } catch (error) {
    console.error(`❌ Fetch failed for ${url}:`, error);

    // Step 4: Fallback - try to return expired cache
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const expiredEntry = await new Promise((resolve, reject) => {
      const request = store.get(cacheKey);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (expiredEntry) {
      console.log(`🔄 Using expired cache as fallback: ${cacheKey}`);
      return expiredEntry.data;
    }

    // No cache available - throw error
    throw error;
  }
}

/**
 * Pre-load essential texts into cache
 * Call this on app initialization
 */
async function preloadEssentialTexts() {
  console.log('📥 Pre-loading essential texts...');

  const essentialTexts = [
    // Current week's parsha will be determined dynamically
    // For now, we'll just prepare the cache system
  ];

  try {
    const stats = await cacheStats();
    console.log(`✅ Cache initialized. ${stats.totalEntries} entries in cache.`);
    return stats;
  } catch (error) {
    console.error('Pre-load error:', error);
    return null;
  }
}

// Export functions for use in other scripts
window.SefariaCache = {
  init: initDB,
  get: cacheGet,
  set: cacheSet,
  del: cacheDel,
  clear: cacheClear,
  stats: cacheStats,
  fetch: cachedFetch,
  preload: preloadEssentialTexts
};

// Initialize cache on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDB().then(() => {
      console.log('✅ Sefaria cache initialized');
    });
  });
} else {
  initDB().then(() => {
    console.log('✅ Sefaria cache initialized');
  });
}
