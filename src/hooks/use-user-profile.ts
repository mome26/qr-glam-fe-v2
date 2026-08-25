import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, type UpdateUserPayload } from '../api/userApi';

export const useUpdateProfile = (userId: string | number | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateUserPayload) => {
      if (!userId) throw new Error('User ID is required');
      return userApi.updateUser(userId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
};
