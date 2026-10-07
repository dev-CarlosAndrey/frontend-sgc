import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ProtectedRouteProps } from "../types/auth"; 

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { signed } = useAuth();

  if (!signed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}