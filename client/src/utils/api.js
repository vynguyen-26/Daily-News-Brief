export async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    // Include the HTTP-only auth cookie on same-origin API requests.
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
