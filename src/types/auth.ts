import type { ReactNode } from "react";

export interface User {
  userId: number;
  name: string;
  email: string;
  role: "ADMIN" | "TECHNICIAN" | "USER";
}

export interface AuthContextData {
  signed: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export interface ProtectedRouteProps {
  children: ReactNode;
}