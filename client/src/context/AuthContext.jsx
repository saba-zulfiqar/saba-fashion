// Authentication context.
// Persists the JWT + user profile in localStorage and exposes login/logout.
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("saba-user") || "null");
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("saba-token") || null);
  const [loading, setLoading] = useState(!!localStorage.getItem("saba-token"));

  // On mount (and whenever a token exists) validate it with GET /api/auth/me.
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    api("/api/auth/me")
      .then((data) => {
        if (!active) return;
        setUser(data.user);
        localStorage.setItem("saba-user", JSON.stringify(data.user));
      })
      .catch(() => {
        if (!active) return;
        logout();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function persist(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("saba-token", nextToken);
    localStorage.setItem("saba-user", JSON.stringify(nextUser));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("saba-token");
    localStorage.removeItem("saba-user");
  }

  const value = {
    user,
    token,
    loading,
    isAdmin: user?.role === "admin",
    login: (nextToken, nextUser) => persist(nextToken, nextUser),
    logout,
    setUser: (u) => {
      setUser(u);
      localStorage.setItem("saba-user", JSON.stringify(u));
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
