import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://thekedaar-api.onrender.com/api",
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      // Don't redirect for /auth/me — AuthContext handles that gracefully
      if (!url.includes("/auth/me") && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  sendOTP: (phone) => api.post("/auth/otp/request", { phone }),
  verifyOTP: (phone, otp) => api.post("/auth/otp/verify", { phone, otp }),
  sendEmailOTP: (email) => api.post("/auth/otp/email/request", { email }),
  verifyEmailOTP: (email, otp) => api.post("/auth/otp/email/verify", { email, otp }),
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  updateLocation: (data) => api.put("/auth/location", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (email, token, newPassword) => api.post("/auth/reset-password", { email, token, newPassword }),
  googleLogin: (credential) => api.post("/auth/google", credential),
};

export const contractorAPI = {
  getFeatured: () => api.get("/contractors/featured"),
  search: (params) => api.get("/contractors/search", { params }),
  getById: (id) => api.get(`/contractors/${id}`),
  getAll: (params) => api.get("/contractors", { params }),
  getMyProfile: () => api.get("/contractors/me/profile"),
  create: (data) => api.post("/contractors", data),
  updateMe: (data) => api.put("/contractors/me", data),
  update: (id, data) => api.put(`/contractors/${id}`, data),
  setAvail: (available) => api.patch("/contractors/me/availability", { available }),
  // Multipart uploads
  uploadMyPhoto: (formData) => api.post("/contractors/photo", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadMyWork: (formData) => api.post("/contractors/portfolio", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  setMyPortfolio: (photos) => api.put("/contractors/portfolio", { photos }),
  uploadPhoto: (id, formData) => api.post(`/contractors/${id}/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadWork: (id, formData) => api.post(`/contractors/${id}/portfolio`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadIdProof: (id, formData) => api.post(`/contractors/${id}/idproof`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  requestVerification: (id) => api.post(`/contractors/${id}/request-verification`),
  addPortfolioItem: (id, formData) => api.post(`/contractors/${id}/portfolio-items`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  removePortfolioItem: (id, itemId) => api.delete(`/contractors/${id}/portfolio-items/${itemId}`),
  // Base64 uploads
  uploadPhotoBase64: (base64) => api.post("/contractors/photo/base64", { image: base64 }),
  uploadWorkBase64: (base64Array) => api.post("/contractors/portfolio/base64", { images: base64Array }),
  addReview: (id, data) => api.post(`/contractors/${id}/reviews`, data),
  recordLead: (id) => api.post(`/contractors/${id}/lead`),
  report: (id, reason) => api.post(`/contractors/${id}/report`, { reason }),
};

export const reviewAPI = {
  getForContractor: (id) => api.get(`/reviews/contractor/${id}`),
  submit: (id, data) => api.post(`/reviews/contractor/${id}`, data),
};

export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  getActivity: () => api.get("/admin/activity"),
  getAnalytics: (days) => api.get("/admin/analytics", { params: { days } }),

  getUsers: (params) => api.get("/admin/users", { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post("/admin/users", data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  getContractors: (params) => api.get("/admin/contractors", { params }),
  getPendingContractors: () => api.get("/admin/contractors/pending"),
  createContractor: (data) => api.post("/admin/contractors", data),
  updateContractor: (id, data) => api.patch(`/admin/contractors/${id}`, data),
  verifyContractor: (id, data) => api.patch(`/admin/contractors/${id}/verify`, data),
  deleteContractor: (id) => api.delete(`/admin/contractors/${id}`),

  getReports: (status = "pending") => api.get("/admin/reports", { params: { status } }),
  resolveReport: (id, status) => api.patch(`/admin/reports/${id}`, { status }),

  getReviews: (params) => api.get("/admin/reviews", { params }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),

  getSettings: () => api.get("/admin/settings"),
  updateSettings: (data) => api.put("/admin/settings", data),

  // Service management
  getServiceCategories: (params) => api.get("/admin/service-categories", { params }),
  createServiceCategory: (data) => api.post("/admin/service-categories", data),
  updateServiceCategory: (id, data) => api.patch(`/admin/service-categories/${id}`, data),
  deleteServiceCategory: (id) => api.delete(`/admin/service-categories/${id}`),
  getAdminServices: (params) => api.get("/admin/services", { params }),
  createAdminService: (data) => api.post("/admin/services", data),
  updateAdminService: (id, data) => api.patch(`/admin/services/${id}`, data),
  deleteAdminService: (id) => api.delete(`/admin/services/${id}`),
  getServiceRequests: (params) => api.get("/admin/service-requests", { params }),
  updateServiceRequest: (id, data) => api.patch(`/admin/service-requests/${id}`, data),
};

export const servicesAPI = {
  getCategories: (type) => api.get("/services/categories", { params: { type } }),
  getCategory: (slug) => api.get(`/services/categories/${slug}`),
  getService: (slug) => api.get(`/services/${slug}`),
  searchServices: (params) => api.get("/services/search", { params }),
  submitRequest: (data) => api.post("/services/request", data),
  getMyRequests: () => api.get("/services/requests/me"),
};

export const chatAPI = {
  getChats: () => api.get("/chat"),
  initChat: (contractorId) => api.post("/chat/init", { contractorId }),
  getMessages: (chatId) => api.get(`/chat/${chatId}/messages`),
  sendMessage: (chatId, content) => api.post(`/chat/${chatId}/messages`, { content }),
};

export const bookingAPI = {
  quote: (data) => api.post("/bookings/quote", data),
  create: (data) => api.post("/bookings", data),
  verify: (data) => api.post("/bookings/verify", data),
  getMyBookings: () => api.get("/bookings/me"),
  completeBooking: (bookingId) => api.put(`/bookings/${bookingId}/complete`),
};

export const notificationAPI = {
  getMine: () => api.get("/notifications"),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};
