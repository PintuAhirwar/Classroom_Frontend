export const API_BASE = 
  process.env.NEXT_PUBLIC_ENV === "local"
    ? "http://127.0.0.1:8000/api"
    : "https://classroom.onrender.com/api";

export function getAuthHeaders() {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };

  // Try localStorage first (for cases like verifyOtp), then cookies
  const access = localStorage.getItem("access");
  if (access && access !== "undefined" && access !== "null") {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access}`,
    };
  }
  // No header if no localStorage token; cookies will be sent automatically
  return { "Content-Type": "application/json" };
}

// Update refreshAccessToken to use cookies
async function refreshAccessToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',  // Add this
    });

    if (!res.ok) throw new Error("Failed to refresh token");

    const data = await res.json();
    if (!data.access) throw new Error("No access token");

    localStorage.setItem("access", data.access);
    return true;
  } catch (err) {
    console.warn("Token refresh failed:", err);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    if (typeof window !== "undefined") window.location.href = "/";
    return false;
  }
}

async function handleResp(res, retryRequest) {
  const text = await res.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
  const detail =
    data?.error ||
    data?.detail ||
    (typeof data === "string" ? data : null) ||
    `Request failed with status ${res.status}`;

  const error = new Error(detail);

  error.status = res.status;
  error.data = data;     // keep raw backend response
  error.url = res.url;

  throw error;
}

  return data;
}

// ---- CLEANED API GET (only once) ----
export async function apiGet(path) {
  const retry = () => apiGet(path);
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  console.log("🔍 Fetching URL:", url);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: 'include',  // Add this to send cookies
    });

    return handleResp(res, retry);
  } catch (err) {
    console.error("❌ Network/API GET error:", err);
    throw err;
  }
}

export async function apiPost(path, body) {
  const retry = () => apiPost(path, body);

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
    credentials: 'include',  // Add this
  });

  return handleResp(res, retry);
}

export async function apiDelete(path) {
  const retry = () => apiDelete(path);

  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: 'include',  // Add this
  });

  return handleResp(res, retry);
}
