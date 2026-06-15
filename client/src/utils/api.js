const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

// In production, the static S3 frontend must call the deployed backend URL.
// In local dev, this stays empty so Vite can keep proxying /api requests.
export function apiUrl(path) {
  return `${API_URL}${path}`;
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    // Include the HTTP-only auth cookie on requests to the API server.
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || "Request failed");
  }

  return data;
}
