import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { QrTemplate } from '../types';
import type { PaginatedResponse, PaginationParams } from '../types/pagination';

export const useTemplates = (eventId: string | undefined, params: PaginationParams = {}) => {
  return useQuery<PaginatedResponse<QrTemplate>>({
    queryKey: ['templates', eventId, params],
    queryFn: async () => {
      const { data } = await apiClient.get(`/events/${eventId}/templates`, {
        params,
      });
      return data;
    },
    enabled: !!eventId,
  });
};

export const useTemplate = (eventId: string | undefined, templateId: string | undefined) => {
  return useQuery<QrTemplate>({
    queryKey: ['template', eventId, templateId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/events/${eventId}/templates/${templateId}`);
      return data;
    },
    enabled: !!eventId && !!templateId,
  });
};

export const useAddTemplate = (eventId: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Partial<QrTemplate>) => {
      const { data } = await apiClient.post(`/events/${eventId}/templates`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', eventId] });
    },
  });
};

export const useDeleteTemplate = (eventId: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data } = await apiClient.delete(`/events/${eventId}/templates/${templateId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', eventId] });
    },
  });
};

export const useSetDefaultTemplate = (eventId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data } = await apiClient.patch(`/events/${eventId}/default-template`, { templateId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
    },
  });
};

export const useUpdateTemplate = (eventId: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ templateId, payload }: { templateId: string; payload: Partial<QrTemplate> }) => {
      const { data } = await apiClient.patch(`/events/${eventId}/templates/${templateId}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', eventId] });
    },
  });
};

export const useDuplicateTemplate = (eventId: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data } = await apiClient.post(`/events/${eventId}/templates/${templateId}/duplicate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', eventId] });
    },
  });
};
