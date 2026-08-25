import apiClient from './client';
import type { QrCode } from '../types';

export const qrCodeApi = {
  getQrCodes: async (eventId: string, params?: Record<string, unknown>) => {
    const { data } = await apiClient.get(`/events/${eventId}/qr-codes`, { params });
    return data;
  },

  update: async (eventId: string, qrCodeId: string, payload: { redirectLink?: string; templateId?: number | null }) => {
    const { data } = await apiClient.patch<QrCode>(`/events/${eventId}/qr-codes/${qrCodeId}`, payload);
    return data;
  },

  bulkUpdate: async (eventId: string, payload: { qrCodeIds: number[]; templateId?: number | null }) => {
    const { data } = await apiClient.post(`/events/${eventId}/qr-codes/bulk-update`, payload);
    return data;
  },

  bulkDownload: async (eventId: string, qrCodeIds: number[]) => {
    const { data } = await apiClient.post(`/events/${eventId}/qr-codes/bulk-download`, { qrCodeIds }, {
      responseType: 'blob',
    });
    return data;
  },

  getQrCodesByIds: async (eventId: string, ids: number[]) => {
    const { data } = await apiClient.get(`/events/${eventId}/qr-codes`, { 
      params: { ids: ids.join(','), limit: 100 } 
    });
    return data;
  },
  
  getNextId: async (eventId: string) => {
    const { data } = await apiClient.get<{ nextNumericId: number; maxBatchSize: number }>(
      `/events/${eventId}/qr-codes/next-id`,
    );
    return data;
  },

  generateBatch: async (eventId: string, payload: { count: number; templateId?: number }) => {
    const { data } = await apiClient.post<{ created: number; from: number; to: number }>(
      `/events/${eventId}/qr-codes/generate-batch`, 
      payload
    );
    return data;
  },
};
