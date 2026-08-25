import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { EventStatistics } from '../types';

export const useEventStatistics = (eventId: string | undefined) => {
  return useQuery<EventStatistics>({
    queryKey: ['event-statistics', eventId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/events/${eventId}/statistics`);
      return data;
    },
    enabled: !!eventId,
  });
};
