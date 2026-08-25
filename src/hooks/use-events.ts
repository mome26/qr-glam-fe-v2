import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { Event, GlobalStatistics } from '../types';

import type { PaginatedResponse, PaginationParams } from '../types/pagination';

export interface EventQueryParams extends PaginationParams {
  status?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

export const useEvents = (params?: EventQueryParams) => {
  return useQuery<PaginatedResponse<Event>>({
    queryKey: ['events', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/events', { params });
      return data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useUpcomingEvents = () => {
  return useQuery<Event[]>({
    queryKey: ['events', 'upcoming'],
    queryFn: async () => {
      const { data } = await apiClient.get('/events/upcoming');
      return data;
    },
  });
};

export const useEvent = (id: string | undefined) => {
  return useQuery<Event>({
    queryKey: ['events', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/events/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: { name: string; date: string; description?: string; status?: string }) => {
      const { data } = await apiClient.post('/events', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useUpdateEvent = (id: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Partial<Event>) => {
      const { data } = await apiClient.patch(`/events/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.setQueryData(['events', id], data);
    },
  });
};

export const useUpdateEventSettings = (id: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: {
      status?: string;
      visibility?: string;
      slug?: string;
      mediaSourceUrl?: string;
      urlStrategy?: string;
      requireAuthForQrScan?: boolean;
      scanPageTemplate?: string | null;
      scanPageTemplateId?: string | null;
    }) => {
      // Map frontend fields to backend format, omitting undefined/empty values
      const backendPayload: Record<string, unknown> = {
        eventStatus: payload.status,
        eventVisibility: payload.visibility,
        eventSlug: payload.slug,
        mediaSourceUrl: payload.mediaSourceUrl,
        urlStrategy: payload.urlStrategy,
        requireAuthForQrScan: payload.requireAuthForQrScan,
        scanPageTemplate: payload.scanPageTemplate,
        scanPageTemplateId: payload.scanPageTemplateId,
      };



      // Strip out keys with undefined values to keep payload clean
      Object.keys(backendPayload).forEach((key) => {
        if (backendPayload[key] === undefined) delete backendPayload[key];
      });

      const { data } = await apiClient.patch(
        `/events/${id}/settings`,
        backendPayload,
      );
      return data;
    },
    onSuccess: () => {
      // Invalidate all event-related queries so the refetch returns fresh data
      // (including the newly extracted mediaFolderId). Using generic ['events']
      // ensures we catch useEvent(slugWithId), useEvents(), etc. — not just
      // useEvent(numericId) which is what ['events', id] would target.
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useDeleteEvent = (id: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useGlobalStatistics = () => {
  return useQuery<GlobalStatistics>({
    queryKey: ['events', 'statistics', 'global'],
    queryFn: async () => {
      const { data } = await apiClient.get('/events/statistics/global');
      return data;
    },
  });
};
