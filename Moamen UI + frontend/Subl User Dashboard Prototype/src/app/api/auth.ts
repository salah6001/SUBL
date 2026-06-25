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
  setToken(res.accessToken, res.refreshToken);
  return res;
}

export async function signup(email: string, firstName: string, lastName: string, password: string, phoneNumber?: string): Promise<void> {
  await api.post("/users/register", { email, firstName, lastName, password, phoneNumber });
}

export function logout() {
  setToken(null, null);
}
