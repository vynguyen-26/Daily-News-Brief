import { useEffect, useState } from "react";
import { AuthContext } from "./authState";
import { apiUrl } from "../utils/api";

async function requestJson(path, options = {}) {
  // Auth calls use the same deployed API base URL as the rest of the app.
  const response = await fetch(apiUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        // On refresh, ask the server whether the auth cookie maps to a user.
        const data = await requestJson("/api/auth/me");
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  async function login(credentials) {
    const data = await requestJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    // The server sets the HTTP-only cookie; React only keeps display state.
    setUser(data.user);
    return data.user;
  }

  async function signup(account) {
    const data = await requestJson("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(account),
    });

    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await requestJson("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
