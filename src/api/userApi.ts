import apiClient from './client';
import type { User } from '../context/auth-context-core';

export interface UpdateUserPayload {
  name?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const userApi = {
  updateUser: async (userId: string | number, payload: UpdateUserPayload) => {
    const { data } = await apiClient.patch<User>(`/users/${userId}`, payload);
    return data;
  },

  changePassword: async (
    userId: string | number,
    payload: ChangePasswordPayload,
  ) => {
    const { data } = await apiClient.patch<{ message: string }>(
      `/users/${userId}/password`,
      payload,
    );
    return data;
  },
};
