// ─────────────────────────────────────────────────────────
// api.js — All backend API calls
//
// HOW IT WORKS:
// Every function here talks to your Node.js backend.
// The base URL comes from your .env file.
// JWT token is automatically sent with every request.
// If token expires, user is logged out automatically.
// ─────────────────────────────────────────────────────────

// This file unifies the app's API surface by delegating to the canonical
// `services/api.js` instance. That file configures cookies, CORS-friendly
// settings and interceptors for the frontend. Re-export common APIs here so
// existing imports to `../utils/api` continue to work.
import api, { authAPI as svcAuth, contractorAPI as svcContractor, reviewAPI as svcReview } from '../services/api';

export default api;

export const authAPI = svcAuth;
export const contractorAPI = svcContractor;
export const reviewAPI = svcReview;

// Additional convenience endpoints used by older codepaths — implement
// them using the same `api` instance so behavior is consistent.
export const listingAPI = {
  getPlans: () => api.get('/listings/plans'),
  purchase: (contractorId, planType) => api.post('/listings/purchase', { contractorId, planType }),
  getStatus: (contractorId) => api.get(`/listings/status/${contractorId}`),
};

export const locationAPI = {
  searchCities: (query) => api.get('/location/cities', { params: { q: query } }),
  reverseGeocode: (lat, lng) => api.get('/location/reverse', { params: { lat, lng } }),
};
