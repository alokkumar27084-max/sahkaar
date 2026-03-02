/**
 * Image utility for handling URLs correctly
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND_BASE_URL = API_BASE_URL.replace('/api', '');

/**
 * Convert a relative image path to a full URL
 * @param {string} imagePath - The image path (can be relative like /uploads/xyz or a full URL)
 * @returns {string} Full image URL
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return '/default-contractor.png';
  
  // If it's already a full URL (starts with http)
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it starts with /uploads/, prepend the backend base URL
  if (imagePath.startsWith('/uploads/')) {
    return `${BACKEND_BASE_URL}${imagePath}`;
  }
  
  // If it's a relative path starting with uploads, prepend the backend base URL
  if (imagePath.startsWith('uploads/')) {
    return `${BACKEND_BASE_URL}/${imagePath}`;
  }
  
  // Default fallback
  return imagePath;
}

/**
 * Get a safe image path for display with error handling
 * @param {string} imagePath
 * @param {string} fallback - Fallback image URL
 * @returns {string} Image URL
 */
export function getSafeImageUrl(imagePath, fallback = '/default-contractor.png') {
  return getImageUrl(imagePath) || fallback;
}
