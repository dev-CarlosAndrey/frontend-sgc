import { createContext, useState } from "react";
import type { AuthContextData, AuthProviderProps, User } from "../types/auth";
import { api } from "../services/api";

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

  return (
    <AuthContext.Provider value={{ signed: !!user, user, login, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}