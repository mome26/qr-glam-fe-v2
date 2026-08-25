import apiClient from './client';
import type { Guest } from '../types';
import type { PaginatedResponse } from '../types/pagination';

export interface GuestQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  group?: string;
  includeDenied?: boolean;
  orderBy?: string;
}

export interface CreateGuestPayload {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  group?: string;
  status?: string;
}

export type UpdateGuestPayload = Partial<CreateGuestPayload> & {
  templateId?: number | null;
};

export const guestApi = {
  getGuests: async (eventId: string, params?: GuestQueryParams) => {
    const { data } = await apiClient.get<PaginatedResponse<Guest>>(`/events/${eventId}/guests`, { params });
    return data;
  },

  getGuest: async (eventId: string, guestId: string) => {
    const { data } = await apiClient.get<Guest>(`/events/${eventId}/guests/${guestId}`);
    return data;
  },

  createGuest: async (eventId: string, payload: CreateGuestPayload) => {
    const { data } = await apiClient.post<Guest>(`/events/${eventId}/guests`, payload);
    return data;
  },

  updateGuest: async (eventId: string, guestId: string, payload: UpdateGuestPayload) => {
    const { data } = await apiClient.patch<Guest>(`/events/${eventId}/guests/${guestId}`, payload);
    return data;
  },

  deleteGuest: async (eventId: string, guestId: string) => {
    await apiClient.delete(`/events/${eventId}/guests/${guestId}`);
  },

  batchCreateGuests: async (eventId: string, payload: CreateGuestPayload[]) => {
    const { data } = await apiClient.post<Guest[]>(`/events/${eventId}/guests/batch`, payload);
    return data;
  },

  bulkUpdate: async (eventId: string, guestIds: string[], fields: { role?: string; group?: string; status?: string }) => {
    await apiClient.post(`/events/${eventId}/guests/bulk-update`, { guestIds, ...fields });
  },

  bulkDelete: async (eventId: string, guestIds: string[]) => {
    await apiClient.post(`/events/${eventId}/guests/bulk-delete`, { guestIds });
  },

  exportCsv: async (eventId: string, guestIds?: string[]): Promise<Blob> => {
    const body = guestIds && guestIds.length > 0 ? { guestIds: guestIds.map(Number) } : {};
    const response = await apiClient.post(`/events/${eventId}/guests/export-csv`, body, { responseType: 'blob' });
    return response.data as Blob;
  },

  importCsvApi: async (eventId: string, file: File): Promise<{ created: number; duplicates: number }> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<{ created: number; duplicates: number }>(
      `/events/${eventId}/guests/import-csv`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },
};
