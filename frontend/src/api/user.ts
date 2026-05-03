import { api } from './client';
import type { User, UpdateProfileRequest, UpdateNotificationsRequest } from '@/types';

export const userApi = {
  getProfile: () => api.get<User>('/user/profile'),
  updateProfile: (data: UpdateProfileRequest) => api.put<User>('/user/profile', data),
  updateNotifications: (data: UpdateNotificationsRequest) =>
    api.patch<{ message: string }>('/user/notifications', data),
};
