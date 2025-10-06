import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthAPI, setAuthToken } from "@/lib/api";

type User = { id: number; name: string; email: string; role: string } | null;

type AuthValue = {
  user: User;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { name: string; email: string; password: string; role?: string }) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
      setAuthToken(t);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await AuthAPI.login({ email, password });
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));
    setAuthToken(res.token);
    return res.user;
  };

  const register = async (payload: { name: string; email: string; password: string; role?: string }) => {
    const res = await AuthAPI.register(payload);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));
    setAuthToken(res.token);
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
  };

  const value = useMemo(() => ({ user, token, login, register, logout }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


