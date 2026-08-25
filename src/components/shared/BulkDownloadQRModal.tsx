import React, { useState, useEffect } from 'react';
import { X, Download, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBulkDownload } from '../../hooks/use-bulk-download';
import { useAuth } from '../../hooks/use-auth';
import { qrCodeApi } from '../../api/qrCodeApi';
import { guestApi } from '../../api/guestApi';
import { generateQrLink } from '../../utils/qr-link';
import { BulkQRProgress } from '../qr-codes/bulk-qr-progress';
import type { BulkDownloadItem } from '../../utils/bulk-qr-download';
import type { QrCode } from '../../types';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { useTemplates } from '../../hooks/use-templates';

type BulkDownloadMode = 'guests' | 'qr-codes' | 'range';

interface BulkDownloadQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  urlHash?: string;
  mode: BulkDownloadMode;
  selectedGuestIds?: string[];
  selectedQrIds?: number[];
}

export const BulkDownloadQRModal: React.FC<BulkDownloadQRModalProps> = ({
  isOpen,
  onClose,
  eventId,
  urlHash,
  mode,
  selectedGuestIds = [],
  selectedQrIds = [],
}) => {
  const { user } = useAuth();
  const canDownload = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const [startFrom, setStartFrom] = useState<number>(1);
  const [endAt, setEndAt] = useState<number>(10);
  const [totalQrCodes, setTotalQrCodes] = useState<number>(0);
  const [isLoadingTotal, setIsLoadingTotal] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const {
    status: bulkStatus,
    current: bulkCurrent,
    total: bulkTotal,
    startDownload: triggerBulkDownload,
    reset: resetBulk,
    HiddenQRRenderer,
  } = useBulkDownload();

  const { data: event } = useQuery({
    queryKey: ['events', eventId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/events/${eventId}`);
      return data;
    },
    enabled: !!eventId,
  });

  const { data: templatesResp } = useTemplates(eventId, { limit: 100 });
  const allTemplates = templatesResp?.data || [];
  const eventDefaultTemplate = allTemplates.find(t => Number(t.id) === event?.defaultTemplateId);

  // Load total QR codes count for range mode
  useEffect(() => {
    if (isOpen && mode === 'range' && eventId) {
      setIsLoadingTotal(true);
      qrCodeApi.getQrCodes(eventId, { page: 1, limit: 1 })
        .then((data) => {
          setTotalQrCodes(data.total || 0);
          if (data.total) {
            setEndAt(data.total);
          }
        })
        .catch(() => setTotalQrCodes(0))
        .finally(() => setIsLoadingTotal(false));
    }
  }, [isOpen, mode, eventId]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && mode === 'range') {
      setStartFrom(1);
    }
  }, [isOpen, mode]);

  const handleClose = () => {
    if (bulkStatus === 'idle' || bulkStatus === 'completed' || bulkStatus === 'error') {
      resetBulk();
      onClose();
    }
  };

  const fetchQrDataAndDownload = async (qrNumericIds: number[], guestMap: Map<number, { name: string }>) => {
    if (qrNumericIds.length === 0) {
      toast.error('No QR codes found for selection');
      return;
    }

    const selectedCodesResp = await qrCodeApi.getQrCodesByIds(eventId, qrNumericIds);
    const selectedCodes = selectedCodesResp.data;
    const defaultTemplate = eventDefaultTemplate || allTemplates.find(t => t.isDefault);

    const items: BulkDownloadItem[] = selectedCodes.map((code: QrCode & { guest?: { name?: string }; template?: unknown }) => {
      const guest = guestMap.get(code.numericId);
      const template = (code.template || defaultTemplate || null) as unknown as BulkDownloadItem['template'];
      const qrLink = generateQrLink(urlHash, code.numericId, Number(code.eventId));
      return {
        qrCode: { ...code, qrLink },
        template,
        guestName: guest?.name || code.guest?.name || `Guest #${code.numericId}`,
      };
    });

    const hasTemplates = items.some((item) => !!item.template);
    const zipName = hasTemplates
      ? `bulk-qrs-event-${eventId}.zip`
      : `bulk-qrs-event-${eventId}-plain.zip`;

    await triggerBulkDownload(items, zipName);
  };

  const handleGuestsDownload = async () => {
    if (!eventId || selectedGuestIds.length === 0) return;

    setIsPending(true);
    const p = toast.loading(`Preparing ${selectedGuestIds.length} QR codes for download...`);
    try {
      // Fetch all guests with pagination (backend max limit is 100 per page)
      const perPage = 100;
      const firstPage = await guestApi.getGuests(eventId, { limit: 1 });
      const totalGuests = firstPage.total || 0;
      const totalPages = Math.ceil(totalGuests / perPage);

      const allGuests: { id: string; name: string; qrCode?: QrCode }[] = [];
      for (let pg = 1; pg <= totalPages; pg++) {
        const resp = await guestApi.getGuests(eventId, { page: pg, limit: perPage });
        if (resp.data && resp.data.length > 0) {
          allGuests.push(...resp.data);
        }
      }

      const selectedGuests = allGuests.filter(g => selectedGuestIds.includes(g.id));
      const qrNumericIds = selectedGuests
        .map(g => g.qrCode?.numericId)
        .filter((id): id is number => id != null);

      const guestMap = new Map<number, { name: string }>(
        selectedGuests.map(g => [g.qrCode!.numericId, { name: g.name }])
      );

      toast.dismiss(p);
      await fetchQrDataAndDownload(qrNumericIds, guestMap);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to prepare batch for download';
      toast.error(msg, { id: p });
    } finally {
      setIsPending(false);
    }
  };

  const handleQrCodesDownload = async () => {
    if (!eventId || selectedQrIds.length === 0) return;

    setIsPending(true);
    const p = toast.loading(`Preparing ${selectedQrIds.length} QR codes for download...`);
    try {
      const guestMap = new Map<number, { name: string }>();
      toast.dismiss(p);
      await fetchQrDataAndDownload(selectedQrIds, guestMap);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to prepare batch for download';
      toast.error(msg, { id: p });
    } finally {
      setIsPending(false);
    }
  };

  const handleRangeDownload = async () => {
    if (!eventId || startFrom < 1 || endAt < startFrom || endAt > totalQrCodes) return;

    const count = endAt - startFrom + 1;
    setIsPending(true);
    const p = toast.loading(`Preparing ${count} QR codes for download...`);
    try {
      const perPage = 100;
      const startPage = Math.max(1, Math.ceil(startFrom / perPage));
      const endPage = Math.min(Math.ceil(totalQrCodes / perPage), Math.ceil(endAt / perPage));

      const allFetchedCodes: (QrCode & { guest?: { name?: string }; template?: unknown })[] = [];
      for (let pg = startPage; pg <= endPage; pg++) {
        const resp = await qrCodeApi.getQrCodes(eventId, { page: pg, limit: perPage });
        const codes = resp.data;
        if (!codes || codes.length === 0) continue;
        allFetchedCodes.push(...codes);
      }

      const rangeCodes = allFetchedCodes.filter(
        (c) => c.numericId >= startFrom && c.numericId <= endAt
      );

      if (rangeCodes.length === 0) {
        toast.error(`No QR codes found in range #${startFrom} - #${endAt}.`, { id: p });
        return;
      }

      const items: BulkDownloadItem[] = rangeCodes.map((code) => {
        const template = (code.template || eventDefaultTemplate || allTemplates.find(t => t.isDefault) || null) as unknown as BulkDownloadItem['template'];
        const qrLink = generateQrLink(urlHash, code.numericId, Number(code.eventId));
        return {
          qrCode: { ...code, qrLink },
          template,
          guestName: code.guest?.name || `Guest #${code.numericId}`,
        };
      });

      const hasTemplates = items.some((item) => !!item.template);
      const zipName = hasTemplates
        ? `qr-codes-${startFrom}-to-${endAt}.zip`
        : `qr-codes-${startFrom}-to-${endAt}-plain.zip`;

      toast.dismiss(p);
      await triggerBulkDownload(items, zipName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to prepare download';
      toast.error(msg, { id: p });
    } finally {
      setIsPending(false);
    }
  };

  const handleSubmit = async () => {
    if (!canDownload) return;

    switch (mode) {
      case 'guests':
        await handleGuestsDownload();
        break;
      case 'qr-codes':
        await handleQrCodesDownload();
        break;
      case 'range':
        await handleRangeDownload();
        break;
    }
  };

  if (!isOpen) return null;

  const isProcessing = bulkStatus !== 'idle' && bulkStatus !== 'completed' && bulkStatus !== 'error';
  const isDisabled = isPending || isProcessing || !canDownload;

  const count = mode === 'range' ? (endAt >= startFrom ? endAt - startFrom + 1 : 0) : 0;

  const title = mode === 'guests'
    ? 'Bulk Download QR Codes'
    : mode === 'qr-codes'
      ? `Bulk Download ${selectedQrIds.length} QR Code${selectedQrIds.length !== 1 ? 's' : ''}`
      : 'Bulk Download QR Codes by Range';

  return (
    <>
      {!isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background w-full max-w-md rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-info" />
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              </div>
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          <div className="p-6 space-y-4">
            {!canDownload && (
              <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>You don't have permission to download QR codes.</span>
              </div>
            )}

            {mode === 'range' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Starting from
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={totalQrCodes}
                    value={startFrom}
                    onChange={(e) => setStartFrom(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-info/20 focus:border-info outline-none transition-all text-sm"
                    placeholder="Enter starting ID"
                    autoFocus
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Ending at
                  </label>
                  <input
                    type="number"
                    min={startFrom}
                    max={totalQrCodes}
                    value={endAt}
                    onChange={(e) => setEndAt(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-info/20 focus:border-info outline-none transition-all text-sm"
                    placeholder="Enter ending ID"
                    disabled={isProcessing}
                  />
                </div>

                <div className="pt-2 pb-1 px-4 bg-accent/30 rounded-lg border border-border/50">
                  <div className="flex justify-between items-center text-xs py-1.5 font-medium">
                    <span className="text-muted-foreground">Total QR Codes Available</span>
                    <span className="font-mono font-bold text-foreground">
                      {isLoadingTotal ? <Loader2 className="w-3 h-3 animate-spin inline" /> : `#${totalQrCodes}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5 border-t border-border/50 font-medium">
                    <span className="text-muted-foreground">Will Download</span>
                    <span className="font-mono font-bold text-foreground">
                      #{startFrom} - #{endAt} ({count} codes)
                    </span>
                  </div>
                </div>
              </>
            )}

            {mode === 'guests' && (
              <p className="text-sm text-muted">
                Download QR codes for <span className="font-medium text-foreground">{selectedGuestIds.length}</span> selected guest{selectedGuestIds.length !== 1 ? 's' : ''}.
              </p>
            )}

            {mode === 'qr-codes' && (
              <p className="text-sm text-muted">
                Download <span className="font-medium text-foreground">{selectedQrIds.length}</span> selected QR code{selectedQrIds.length !== 1 ? 's' : ''}.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              {canDownload && (
                <button
                  onClick={() => {
                    handleSubmit();
                  }}
                  disabled={isDisabled || (mode === 'range' && (count < 1 || startFrom < 1 || endAt > totalQrCodes))}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-info rounded-lg hover:bg-info/90 transition-colors disabled:opacity-50 shadow-sm shadow-info/10"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === 'range' ? `Download ${count} QR${count > 1 ? 's' : ''}` : 'Download'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {HiddenQRRenderer}
      <BulkQRProgress
        isOpen={bulkStatus !== 'idle'}
        status={bulkStatus === 'idle' ? 'generating' : (bulkStatus as 'generating' | 'zipping' | 'completed' | 'error')}
        current={bulkCurrent}
        total={bulkTotal}
        onClose={() => {
          resetBulk();
          onClose();
        }}
      />
    </>
  );
};
