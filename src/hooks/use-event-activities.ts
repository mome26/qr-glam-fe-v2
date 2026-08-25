import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { Activity } from '../types';
import type { PaginatedResponse } from '../types/pagination';

export const useEventActivities = (
  eventId: string | undefined,
  page = 1,
  limit = 10,
) => {
  return useQuery<PaginatedResponse<Activity>>({
    queryKey: ['activities', eventId, page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get(`/events/${eventId}/activities`, {
        params: { page, limit },
      });
      return data;
    },
    enabled: !!eventId,
  });
};
