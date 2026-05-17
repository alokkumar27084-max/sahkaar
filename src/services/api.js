import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:5000/api" : "/api");

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("thekedaar_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      if (!url.includes("/auth/me") && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  verifyPhoneToken: (idToken) => api.post("/auth/otp/verify", { idToken }),
  verifyEmailToken: (idToken) => api.post("/auth/otp/email/verify", { idToken }),
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
  getPublicStats: () => api.get("/contractors/public-stats"),
  getFeatured: () => api.get("/contractors/featured"),
  search: (params) => api.get("/contractors/search", { params }),
  getById: (id) => api.get(`/contractors/${id}`),
  getAll: (params) => api.get("/contractors", { params }),
  getMyProfile: () => api.get("/contractors/me/profile"),
  create: (data) => api.post("/contractors", data),
  updateMe: (data) => api.put("/contractors/me", data),
  update: (id, data) => api.put(`/contractors/${id}`, data),
  setAvail: (available) => api.patch("/contractors/me/availability", { available }),
  uploadMyPhoto: (formData) => api.post("/contractors/photo", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadMyWork: (formData) => api.post("/contractors/portfolio", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  setMyPortfolio: (photos) => api.put("/contractors/portfolio", { photos }),
  uploadPhoto: (id, formData) => api.post(`/contractors/${id}/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadWork: (id, formData) => api.post(`/contractors/${id}/portfolio`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadIdProof: (id, formData) => api.post(`/contractors/${id}/idproof`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  requestVerification: (id) => api.post(`/contractors/${id}/request-verification`),
  addPortfolioItem: (id, formData) => api.post(`/contractors/${id}/portfolio-items`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  removePortfolioItem: (id, itemId) => api.delete(`/contractors/${id}/portfolio-items/${itemId}`),
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
};

export const chatAPI = {
  getChats: () => api.get("/chat"),
  initChat: (contractorId) => api.post("/chat/init", { contractorId }),
  getMessages: (chatId) => api.get(`/chat/${chatId}/messages`),
  sendMessage: (chatId, content) => api.post(`/chat/${chatId}/messages`, { content }),
  sendImage: (chatId, formData) => api.post(`/chat/${chatId}/messages/media`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
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

export const profileAPI = {
  getMe: () => api.get("/profiles/me"),
  updateMe: (data) => api.put("/profiles/me", data),
  uploadAvatar: (formData) =>
    api.post("/profiles/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const quoteAPI = {
  createQuote: (data) => api.post("/quotes", data),
  getQuotesByChat: (chatId) => api.get(`/quotes/chat/${chatId}`),
  getQuoteById: (id) => api.get(`/quotes/${id}`),
  updateQuoteStatus: (quoteId, status) => api.put(`/quotes/${quoteId}/status`, { status }),
};
