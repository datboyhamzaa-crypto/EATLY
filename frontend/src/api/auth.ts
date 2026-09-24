import { apiFetch } from "@/src/api/client";
import { PublicUser } from "@/src/types";

export type AuthResponse = { token: string; user: PublicUser };

export function registerRequest(name: string, email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function loginRequest(email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function meRequest() {
  return apiFetch<PublicUser>("/auth/me", {}, true);
}
