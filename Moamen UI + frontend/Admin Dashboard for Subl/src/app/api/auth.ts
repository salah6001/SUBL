import { api, setToken } from "./client";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  tokenType: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/users/login", { email, password });
  setToken(res.accessToken);
  return res;
}

export function logout() {
  setToken(null);
}
