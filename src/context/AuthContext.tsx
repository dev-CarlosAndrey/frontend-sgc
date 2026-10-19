import { createContext, useEffect, useState } from "react";
import type { AuthContextData, AuthProviderProps, User } from "../types/auth";
import { api, SESSION_EXPIRED_EVENT } from "../services/api";

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    const storagedUser = localStorage.getItem("@SGC:user");
    return storagedUser ? JSON.parse(storagedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Chamada real ao backend Java
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      const { token, userId, name, email, role } = response.data;

      const loggedUser: User = { userId, name, email, role };

      localStorage.setItem("@SGC:token", token);
      localStorage.setItem("@SGC:user", JSON.stringify(loggedUser));

      setUser(loggedUser);
      return true;
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("@SGC:token");
    localStorage.removeItem("@SGC:user");
  };

  // Token expirado/inválido: o interceptor do axios avisa e encerramos a sessão
  useEffect(() => {
    const handleSessionExpired = () => {
      sessionStorage.setItem("@SGC:sessionExpired", "1");
      logout();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ signed: !!user, user, login, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}