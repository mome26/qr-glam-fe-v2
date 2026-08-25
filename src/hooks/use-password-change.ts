import { useMutation } from '@tanstack/react-query';
import { userApi, type ChangePasswordPayload } from '../api/userApi';

export const useChangePassword = (userId: string | number | undefined) => {
  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      if (!userId) throw new Error('User ID is required');
      return userApi.changePassword(userId, payload);
    },
  });
};
