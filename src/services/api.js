// ─────────────────────────────────────────────
// api.js — Central API service
//
// All HTTP requests go through this file.
// It automatically:
//   - Adds the backend URL prefix
//   - Sends cookies (for auth)
//   - Handles 401 errors (token expired → logout)
// ─────────────────────────────────────────────
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  sendOTP:     (phone)         => api.post("/auth/otp/request",      { phone }),
  verifyOTP:   (phone, otp)    => api.post("/auth/otp/verify",       { phone, otp }),
  register:    (data)          => api.post("/auth/register",          data),
  login:       (data)          => api.post("/auth/login",             data),
  logout:      ()              => api.post("/auth/logout"),
  me:          ()              => api.get("/auth/me"),
};

export const contractorAPI = {
  getFeatured: ()             => api.get("/contractors/featured"),
  search:      (params)        => api.get("/contractors/search",       { params }),
  getById:     (id)            => api.get(`/contractors/${id}`),
  getAll:      (params)        => api.get("/contractors", { params }),
  getMyProfile:()              => api.get("/contractors/me/profile"),
  create:      (data)          => api.post("/contractors",             data),
  updateMe:    (data)          => api.put("/contractors/me",            data),
  update:      (id, data)      => api.put(`/contractors/${id}`,         data),
  setAvail:    (available)     => api.patch("/contractors/me/availability", { available }),
  uploadMyPhoto:(formData)     => api.post("/contractors/photo", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadMyWork: (formData)     => api.post("/contractors/portfolio", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  setMyPortfolio:(photos)      => api.put("/contractors/portfolio", { photos }),
  uploadPhoto: (id, formData)  => api.post(`/contractors/${id}/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadWork:  (id, formData)  => api.post(`/contractors/${id}/portfolio`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadIdProof:(id, formData)  => api.post(`/contractors/${id}/idproof`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  addReview:   (id, data)      => api.post(`/contractors/${id}/reviews`, data),
  recordLead:  (id)            => api.post(`/contractors/${id}/lead`),
};

export const reviewAPI = {
  // Reviews are handled under contractor endpoints in the backend.
  getForContractor: (id)       => api.get(`/reviews/contractor/${id}`),
  submit:      (id, data)      => api.post(`/reviews/contractor/${id}`, data),
};

export const adminAPI = {
  getPendingContractors: ()      => api.get("/admin/contractors/pending"),
  verifyContractor: (id)         => api.patch(`/admin/contractors/${id}/verify`),
  getStats: ()                   => api.get("/admin/stats"),
  getReports: (status = "pending") => api.get("/admin/reports", { params: { status } }),
  resolveReport: (id, status)    => api.patch(`/admin/reports/${id}`, { status }),
};
