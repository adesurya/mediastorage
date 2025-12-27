// utils/helpers.js
// Utility functions for Trending Video feature

/**
 * Format large numbers to readable format
 * @param {number} num - Number to format
 * @returns {string} Formatted number (e.g., 1000 -> 1K)
 */
const formatNumber = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Format timestamp to readable date
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date
 */
const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculate time ago from timestamp
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Time ago string (e.g., "2 hours ago")
 */
const timeAgo = (timestamp) => {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }

  return 'Just now';
};

/**
 * Sanitize search query
 * @param {string} query - Search query
 * @returns {string} Sanitized query
 */
const sanitizeQuery = (query) => {
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 255); // Limit length
};

/**
 * Generate cache key from query
 * @param {string} query - Search query
 * @returns {string} Cache key
 */
const generateCacheKey = (query) => {
  return `trending_video:${query.toLowerCase().trim().replace(/\s+/g, '_')}`;
};

/**
 * Parse pagination parameters
 * @param {object} query - Express req.query
 * @returns {object} Parsed pagination { page, limit }
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit };
};

/**
 * Calculate pagination metadata
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Pagination metadata
 */
const calculatePagination = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    startIndex: (page - 1) * limit,
    endIndex: Math.min(page * limit, total)
  };
};

/**
 * Validate video data structure
 * @param {object} video - Video object
 * @returns {boolean} Is valid
 */
const isValidVideoData = (video) => {
  return (
    video &&
    video.video_id &&
    video.author_name &&
    video.download_url &&
    video.cover
  );
};

/**
 * Extract error message from error object
 * @param {Error} error - Error object
 * @returns {string} Error message
 */
const extractErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.statusText) {
    return `API Error: ${error.response.status} - ${error.response.statusText}`;
  }
  return error.message || 'Unknown error occurred';
};

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} retries - Number of retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} Result of function
 */
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    await sleep(delay);
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

module.exports = {
  formatNumber,
  formatDate,
  timeAgo,
  sanitizeQuery,
  generateCacheKey,
  parsePagination,
  calculatePagination,
  isValidVideoData,
  extractErrorMessage,
  sleep,
  retryWithBackoff
};