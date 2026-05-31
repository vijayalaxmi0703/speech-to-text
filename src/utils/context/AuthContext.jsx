import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Check localStorage/sessionStorage for existing auth
    const checkSession = () => {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const userData = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");

      if (token && userData) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        setUser(JSON.parse(userData));
      }
      setReady(true);
    };

    checkSession();
  }, []);

  const saveSession = (token, userData, remember = true) => {
    if (remember) {
      localStorage.setItem("authToken", token);
      localStorage.setItem("authUser", JSON.stringify(userData));
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("authUser");
    } else {
      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("authUser", JSON.stringify(userData));
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    }

    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(userData);
  };

  const login = async (email, password, remember = true) => {
    setAuthLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      console.log("Login response:", res.data);
      saveSession(res.data.token, res.data.user, remember);
      return res.data;
    } catch (error) {
      console.error("Login API error:", error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setAuthLoading(true);
    try {
      const res = await api.post("/api/auth/register", { name, email, password });
      // Auto-login after registration
      if (res.data.token) {
        saveSession(res.data.token, res.data.user, true);
      }
      return res.data;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authUser");
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        authLoading,
        login,
        register,
        logout,
        saveSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
