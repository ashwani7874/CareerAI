import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    localStorage.getItem("careerai_token")
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("careerai_user"));
    } catch {
      return null;
    }
  });

  const saveSession = (data) => {
    const receivedToken = data.token || data.accessToken;
    const receivedUser = data.user || data;

    if (!receivedToken) {
      throw new Error("The server did not return an authentication token.");
    }

    localStorage.setItem("careerai_token", receivedToken);
    localStorage.setItem("careerai_user", JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
  };

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    saveSession(response.data);
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    saveSession(response.data);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("careerai_token");
    localStorage.removeItem("careerai_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}