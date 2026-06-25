import { api } from "../apiClient";

/** Mirrors the backend `TokenResponse`. */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

/** Mirrors the backend `UserResponse` from `GET users/me`. */
export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string | null;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenResponse>("users/login", { email, password }),

  me: () => api.get<CurrentUser>("users/me"),
};
