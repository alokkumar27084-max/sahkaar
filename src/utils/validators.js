// ─────────────────────────────────────────────
// validators.js — Input validation functions
//
// Used in forms to check inputs BEFORE sending to backend.
// This is the FIRST security layer (backend validates too).
// ─────────────────────────────────────────────
import DOMPurify from "dompurify";

// Remove dangerous HTML tags from any string (prevents XSS attacks)
export function sanitize(str) {
  if (typeof str !== "string") return str;
  return DOMPurify.sanitize(str.trim());
}

// Indian mobile number: must be 10 digits, starts with 6-9
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone?.replace(/\s/g, ""));
}

// Basic email check
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim());
}

// Password: min 8 chars, must have letter + number
export function isValidPassword(pw) {
  return pw?.length >= 8 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);
}

// OTP: exactly 6 digits
export function isValidOTP(otp) {
  return /^\d{6}$/.test(otp?.trim());
}

// File upload validation
export function isValidImageFile(file) {
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];
  const MAX_SIZE_MB   = 5;
  if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, reason: "type" };
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return { ok: false, reason: "size" };
  return { ok: true };
}

// Rate (price): positive number
export function isValidRate(rate) {
  return !isNaN(rate) && Number(rate) > 0;
}

// Sanitize entire form object
export function sanitizeForm(formObj) {
  const clean = {};
  for (const [key, val] of Object.entries(formObj)) {
    clean[key] = typeof val === "string" ? sanitize(val) : val;
  }
  return clean;
}
