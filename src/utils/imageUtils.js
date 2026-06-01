/**
 * Image utility for handling URLs correctly
 */
import defaultAvatar from "../assets/default_avatar.png";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : '/api');
const BACKEND_BASE_URL = API_BASE_URL.replace('/api', '');

/**
 * Convert a relative image path to a full URL
 * @param {string} imagePath - The image path (can be relative like /uploads/xyz, a full URL, or a base64 data URI)
 * @returns {string} Full image URL
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23ccc%22/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2255%25%22%20font-size%3D%2210%22%20text-anchor%3D%22middle%22%20fill%3D%22%23666%22%3EAvatar%3C/text%3E%3C/svg%3E';

  // Base64 data URIs — return as-is
  if (imagePath.startsWith('data:image/')) {
    return imagePath;
  }

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
const DEFAULT_AVATAR_SVG = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23ccc%22/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2255%25%22%20font-size%3D%2210%22%20text-anchor%3D%22middle%22%20fill%3D%22%23666%22%3EAvatar%3C/text%3E%3C/svg%3E';

export function getSafeImageUrl(imagePath, fallback = defaultAvatar || DEFAULT_AVATAR_SVG) {
  if (!imagePath) return fallback;
  return getImageUrl(imagePath);
}

/**
 * Get a safe avatar URL, falling back to local default avatar PNG
 * @param {string} avatarPath
 * @returns {string} Safe avatar URL
 */
export function getAvatarUrl(avatarPath) {
  if (!avatarPath) return defaultAvatar;
  return getImageUrl(avatarPath);
}
