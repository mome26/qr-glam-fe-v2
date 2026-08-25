import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestApi, type GuestQueryParams, type CreateGuestPayload, type UpdateGuestPayload } from '../api/guestApi';
import { generateQrLink } from '../utils/qr-link';

export const useGuests = (eventId: string | undefined, params?: GuestQueryParams, options?: { urlHash?: string }) => {
  return useQuery({
    queryKey: ['guests', eventId, params],
    queryFn: async () => {
      const data = await guestApi.getGuests(eventId!, params);
      // Compute qrLink on frontend for guest QR codes
      if (data?.data) {
        for (const guest of data.data) {
          if (guest.qrCode) {
            (guest.qrCode as { qrLink?: string }).qrLink = generateQrLink(
              options?.urlHash,
              guest.qrCode.numericId,
              guest.eventId as unknown as number,
            );
          }
        }
      }
      return data;
    },
    enabled: !!eventId,
  });
};

export const useGuest = (eventId: string | undefined, guestId: string | undefined) => {
  return useQuery({
    queryKey: ['guest', eventId, guestId],
    queryFn: () => guestApi.getGuest(eventId!, guestId!),
    enabled: !!eventId && !!guestId,
  });
};

export const useAddGuest = (eventId: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateGuestPayload) => guestApi.createGuest(eventId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] }); // For attendee counts
    },
  });
};

export const useUpdateGuest = (eventId: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ guestId, payload }: { guestId: string; payload: UpdateGuestPayload }) => 
      guestApi.updateGuest(eventId!, guestId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
      queryClient.invalidateQueries({ queryKey: ['guest', eventId, data.id] });
    },
  });
};

export const useDeleteGuest = (eventId: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (guestId: string) => guestApi.deleteGuest(eventId!, guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
    },
  });
};

export const useBatchGuests = (eventId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGuestPayload[]) =>
      guestApi.batchCreateGuests(eventId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
    },
  });
};

export const useImportGuests = (eventId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => guestApi.importCsvApi(eventId!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
    },
  });
};
