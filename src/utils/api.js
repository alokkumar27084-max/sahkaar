// ─────────────────────────────────────────────────────────
// api.js — All backend API calls
// ─────────────────────────────────────────────────────────
import api, {
  authAPI as svcAuth,
  contractorAPI as svcContractor,
  reviewAPI as svcReview,
  meetingAPI as svcMeeting,
  quickBookingAPI as svcQuickBooking,
  projectAPI as svcProject,
  labourAPI as svcLabour,
  subscriptionAPI as svcSubscription
} from '../services/api';

export default api;

export const authAPI = svcAuth;
export const contractorAPI = svcContractor;
export const reviewAPI = svcReview;
export const meetingAPI = svcMeeting;
export const quickBookingAPI = svcQuickBooking;
export const projectAPI = svcProject;
export const labourAPI = svcLabour;
export const subscriptionAPI = svcSubscription;

export const listingAPI = {
  getPlans: () => api.get('/listings/plans'),
  purchase: (contractorId, planType) => api.post('/listings/purchase', { contractorId, planType }),
  getStatus: (contractorId) => api.get(`/listings/status/${contractorId}`),
};

export const locationAPI = {
  searchCities: (query) => api.get('/location/cities', { params: { q: query } }),
  reverseGeocode: (lat, lng) => api.get('/location/reverse', { params: { lat, lng } }),
};
