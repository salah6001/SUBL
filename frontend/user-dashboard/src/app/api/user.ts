import { api } from "./client";

export interface UserMe {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType: string;
  status: string;
  companyName: string | null;
}

export interface UserProfile {
  id: string;
  userId: string;
  department: string;
  displayJobTitle: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  bio: string | null;
  skills: string[];
}

export const userApi = {
  getMe:      () => api.get<UserMe>("/users/me"),
  getProfile: () => api.get<UserProfile>("/users/me/profile"),
  updateMe:   (firstName: string, lastName: string, email?: string) =>
    api.put<void>("/users/me", { firstName, lastName, email }),
  updateProfile: (data: Partial<Pick<UserProfile, "phoneNumber" | "avatarUrl" | "bio" | "displayJobTitle">>) =>
    api.put<void>("/users/me/profile", data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<void>("/users/change-password", { currentPassword, newPassword }),
  deleteMyData: () => api.delete<void>("/users/me/data"),
};
