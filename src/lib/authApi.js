import { apiPost, apiGet } from "./api";

/**
 * Register user & send OTP
 */
export async function registerUser(payload) {
  return apiPost("/auth/register/", payload);
}

/**
 * Verify OTP
 */
export async function verifyOtp(payload) {
  return apiPost("/auth/verify-otp/", payload);
}

/**
 * Login user
 */
export async function loginUser(payload) {
  return apiPost("/auth/login/", payload);
}

/**
 * Logout user
 */
export async function logoutUser() {
  return apiPost("/auth/logout/", {});
}

/**
 * Get current user (assumes endpoint exists and requires auth)
 */
export async function getUser() {
  return apiGet("/auth/profile/");  // Adjust if your backend uses /auth/profile/, /auth/me/, etc.
}
