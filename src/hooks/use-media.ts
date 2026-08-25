import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { PaginatedResponse, PaginationParams } from '../types/pagination';

export interface Media {
  id: string;
  title: string;
  url: string;
  type: 'photo' | 'video' | 'document';
  status: 'pending' | 'approved' | 'rejected';
  eventId: string;
  guestId?: string;
  driveFileId?: string;
}

export type MediaFilters = PaginationParams & {
  type?: string;
};

export const useMedia = (eventId: string | undefined, params: MediaFilters = {}) => {
  return useQuery<PaginatedResponse<Media>>({
    queryKey: ['media', eventId, params],
    queryFn: async () => {
      const { data } = await apiClient.get(`/events/${eventId}/media`, {
        params,
      });
      return data;
    },
    enabled: !!eventId,
  });
};
