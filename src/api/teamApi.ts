import apiClient from './client';
import type { User } from '../context/auth-context-core';

export interface InviteMemberPayload {
  email: string;
  role: string;
}

export interface UpdateUserRolePayload {
  role: string;
}

export const teamApi = {
  inviteMember: async (payload: InviteMemberPayload) => {
    const { data } = await apiClient.post<User>('/users/invite', payload);
    return data;
  },

  updateRole: async (
    userId: string | number,
    payload: UpdateUserRolePayload,
  ) => {
    const { data } = await apiClient.patch<User>(
      `/users/${userId}/role`,
      payload,
    );
    return data;
  },

  removeMember: async (userId: string | number) => {
    const { data } = await apiClient.delete<{ success: boolean }>(
      `/users/${userId}`,
    );
    return data;
  },
};
