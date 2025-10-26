export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://taxhub.onrender.com/api";

export function getAuthHeaders() {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };

  const access = localStorage.getItem("access");
  if (access && access !== "undefined" && access !== "null") {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access}`,
    };
  }
  return { "Content-Type": "application/json" };
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh || refresh === "undefined" || refresh === "null") return false;

  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    // If refresh fails (token expired/invalid)
    if (!res.ok) throw new Error("Failed to refresh token");

    const data = await res.json();
    if (!data.access) throw new Error("No access token in refresh response");

    localStorage.setItem("access", data.access);
    return true;
  } catch (err) {
    console.warn("Token refresh failed:", err);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    // Optional: redirect to login if needed
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return false;
  }
}

async function handleResp(res, retryRequest) {
  const text = await res.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { raw: text };
  }

  if (!res.ok) {
    const detail = data?.detail || data?.error || data;

    // ---- Token invalid or expired ----
    if (typeof detail === "string" && detail.includes("Given token not valid")) {
      console.warn("Access token invalid or expired, attempting refresh...");
      const refreshed = await refreshAccessToken();

      if (refreshed && retryRequest) {
        return retryRequest(); // Retry once with the new token
      }
    }

    // ---- Unauthorized (e.g., refresh also failed) ----
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    const e = new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    e.response = data;
    throw e;
  }

  return data;
}

// ----------------------------
// Generic API helpers
// ----------------------------
export async function apiGet(path) {
  const retry = () => apiGet(path);
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResp(res, retry);
}

export async function apiPost(path, body) {
  const retry = () => apiPost(path, body);
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResp(res, retry);
}

export async function apiDelete(path) {
  const retry = () => apiDelete(path);
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResp(res, retry);
}
