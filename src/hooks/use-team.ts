import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import {
  teamApi,
  type InviteMemberPayload,
  type UpdateUserRolePayload,
} from '../api/teamApi';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'MEMBER';
}

export const useTeamMembers = () => {
  return useQuery<User[]>({
    queryKey: ['team'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users');
      return data;
    },
  });
};

export const useInviteTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteMemberPayload) => teamApi.inviteMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
};

export const useUpdateUserRole = (userId: string | number | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserRolePayload) => {
      if (!userId) throw new Error('User ID is required');
      return teamApi.updateRole(userId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
};

export const useDeleteTeamMember = (userId: string | number | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('User ID is required');
      return teamApi.removeMember(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
};
