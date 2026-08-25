import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { QrCode } from '../types';
import type { PaginatedResponse, PaginationParams } from '../types/pagination';
import { generateQrLink } from '../utils/qr-link';

export interface QrCodeQueryParams extends PaginationParams {
  search?: string;
  assigned?: boolean;
}

export const useQrCodes = (eventId: string | undefined, params: QrCodeQueryParams = {}, options?: { urlHash?: string }) => {
  return useQuery<PaginatedResponse<QrCode>>({
    queryKey: ['qr-codes', eventId, params],
    queryFn: async () => {
      const { data } = await apiClient.get(`/events/${eventId}/qr-codes`, {
        params,
      });
      // Compute qrLink on frontend since backend doesn't serialize computed properties
      if (data?.data) {
        for (const qr of data.data) {
          qr.qrLink = generateQrLink(
            options?.urlHash,
            qr.numericId,
            qr.eventId as unknown as number,
          );
        }
      }
      return data;
    },
    enabled: !!eventId,
  });
};

export const useUpdateQrRedirectLink = (eventId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ qrId, redirectLink }: { qrId: string, redirectLink: string }) => {
      const { data } = await apiClient.patch(`/events/${eventId}/qr-codes/${qrId}/redirect-link`, {
        redirectLink,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes', eventId] });
    },
  });
};

export const useBulkUpdateQrCodes = (eventId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ qrCodeIds, templateId }: { qrCodeIds: number[]; templateId?: number | null }) => {
      const { data } = await apiClient.post(`/events/${eventId}/qr-codes/bulk-update`, { qrCodeIds, templateId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes', eventId] });
    },
  });
};

export const useGenerateBatchQrCodes = (eventId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ count, templateId }: { count: number; templateId?: number }) => {
      const { data } = await apiClient.post<{ created: number; from: number; to: number }>(
        `/events/${eventId}/qr-codes/generate-batch`,
        { count, templateId }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes', eventId] });
    },
  });
};

export const useUpdateQrCode = (eventId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ qrCodeId, payload }: { qrCodeId: string; payload: { redirectLink?: string; templateId?: number | null } }) => {
      const { data } = await apiClient.patch(`/events/${eventId}/qr-codes/${qrCodeId}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes', eventId] });
    },
  });
};
