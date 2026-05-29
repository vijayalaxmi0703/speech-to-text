import { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const storedUser = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");

    if (token && storedUser) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(JSON.parse(storedUser));
    }

    setReady(true);
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
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      console.log("Login response:", response.data);
      saveSession(response.data.token, response.data.user, remember);
      return response.data;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setAuthLoading(true);
    try {
      const response = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });

      console.log("Register response:", response.data);
      saveSession(response.data.token, response.data.user, true);
      return response.data;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
