import { Navigate } from "@tanstack/react-router";

export function AppNotFound() {
  return <Navigate to="/" replace />;
}
