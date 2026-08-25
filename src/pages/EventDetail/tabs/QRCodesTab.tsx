import React, { useState, useEffect } from 'react';
import { Loader2, QrCode as QrIcon, Plus, Download, X } from 'lucide-react';
import { useQrCodes, useBulkUpdateQrCodes, useGenerateBatchQrCodes } from '../../../hooks/use-qr-codes';
import { Pagination } from '../../../components/shared/Pagination';
import { QRCodesTable } from '../../../components/qr-codes/QRCodesTable';
import { QRCodesToolbar } from '../../../components/qr-codes/QRCodesToolbar';
import { QRCodeBulkActions } from '../../../components/qr-codes/QRCodeBulkActions';
import { BulkAssignTemplateModal } from '../../../components/qr-codes/BulkAssignTemplateModal';
import { qrCodeApi } from '../../../api/qrCodeApi';
import { generateQrLink } from '../../../utils/qr-link';
import { GenerateQrModal } from '../../../components/qr-codes/GenerateQrModal';
import { BulkDownloadQRModal } from '../../../components/shared/BulkDownloadQRModal';
import { BulkQRProgress } from '../../../components/qr-codes/bulk-qr-progress';
import { useTemplates } from '../../../hooks/use-templates';
import { useBulkDownload } from '../../../hooks/use-bulk-download';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/use-auth';
import type { QrCode } from '../../../types';

interface QRCodesTabProps {
  eventId: string;
  urlHash?: string;
}

export const QRCodesTab: React.FC<QRCodesTabProps> = ({ eventId, urlHash }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [assigned, setAssigned] = useState<boolean | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [bulkDownloadMode, setBulkDownloadMode] = useState<'range' | 'qr-codes' | null>(null);
  const [generatedRange, setGeneratedRange] = useState<{ from: number; to: number; count: number } | null>(null);
  const limit = 10;
  const { user } = useAuth();
  const canEditQrCodes = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const { data: codesResponse, isLoading, refetch } = useQrCodes(eventId, {
    page,
    limit,
    search: search || undefined,
    assigned: assigned,
  }, { urlHash });

  const bulkUpdate = useBulkUpdateQrCodes(eventId);
  const generateBatch = useGenerateBatchQrCodes(eventId);

  const {
    status: bulkStatus,
    current: bulkCurrent,
    total: bulkTotal,
    startDownload: triggerBulkDownload,
    reset: resetBulk,
    HiddenQRRenderer,
  } = useBulkDownload();

  // For fallback template (shared with QRCodePreviewModal logic)
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

  const codes = codesResponse?.data || [];
  const totalPages = codesResponse?.totalPages || 1;
  const totalItems = codesResponse?.total || 0;

  // Principle VIII: Clear selection on page/filter changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIds([]);
  }, [page, search, assigned]);

  const handleGenerateBatch = async (count: number, templateId?: number) => {
    if (!eventId) return;
    try {
      const result = await generateBatch.mutateAsync({ count, templateId });
      void refetch();

      // Show download prompt for the newly created QR codes
      setGeneratedRange({ from: result.from, to: result.to, count: result.created });
    } catch (error) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const errorMsg =
        (Array.isArray(err?.response?.data?.message)
          ? err?.response?.data?.message?.[0]
          : err?.response?.data?.message) || 'Failed to generate batch';
      toast.error(errorMsg);
      throw error;
    }
  };

  const handleDownloadGenerated = async () => {
    if (!generatedRange) return;

    const { from, to, count } = generatedRange;
    setGeneratedRange(null);

    const p = toast.loading(`Preparing ${count} QR codes for download...`);
    try {
      // New QR codes are at the END of the list (ordered by numericId ASC).
      // We need to find them by fetching pages from the last page backwards.
      // The max limit per page is 100 from the backend.
      const perPage = 100;

      // Get total count — fetch just page 1 to get the total
      const firstPage = await qrCodeApi.getQrCodes(eventId, { page: 1, limit: 1 });
      const totalItems = firstPage.total || 0;

      // Fetch the last page where the newly generated codes should be
      const lastPage = Math.ceil(totalItems / perPage);
      console.log('[Download] Total items:', totalItems, 'Last page:', lastPage);

      // Fetch all pages that could contain the generated codes
      const allFetchedCodes: (QrCode & { guest?: { name?: string }; template?: unknown })[] = [];
      for (let pg = lastPage; pg >= 1; pg--) {
        const resp = await qrCodeApi.getQrCodes(eventId, { page: pg, limit: perPage });
        const codes = resp.data;
        if (!codes || codes.length === 0) continue;

        allFetchedCodes.push(...codes);

        // If we've gone back far enough to include all target codes, stop
        const minOnThisPage = (codes as QrCode[]).reduce(
          (min, c) => Math.min(min, c.numericId), Infinity
        );
        if (minOnThisPage < from) break;
      }

      console.log('[Download] Total fetched:', allFetchedCodes.length);

      const generatedCodes = allFetchedCodes.filter(
        (c) => c.numericId >= from && c.numericId <= to
      );
      console.log('[Download] Generated codes in range:', generatedCodes.length);

      if (generatedCodes.length === 0) {
        toast.error('Newly generated QR codes not found. Try using "Bulk Download of selected" from the table instead.', { id: p });
        return;
      }

      const defaultTemplate = eventDefaultTemplate || allTemplates.find(t => t.isDefault);
      console.log('[Download] Default template:', defaultTemplate?.name || 'none');

      const items = generatedCodes.map((code: QrCode & { guest?: { name?: string }; template?: unknown }) => {
        const template = (code.template || defaultTemplate || null) as unknown as { id: number; name: string; isDefault?: boolean; eventId?: number; qrPositionX?: number; qrPositionY?: number; qrSize?: number; };
        // Compute qrLink client-side (not serialized by backend) — spread into new object to avoid mutation issues
        const qrLink = generateQrLink(urlHash, code.numericId, Number(code.eventId));
        return {
          qrCode: { ...code, qrLink },
          template,
          guestName: code.guest?.name || `Guest #${code.numericId}`
        };
      });

      const hasTemplates = items.some((item: { template: unknown }) => !!item.template);
      const zipName = hasTemplates
        ? `qr-codes-${from}-to-${to}.zip`
        : `qr-codes-${from}-to-${to}-plain.zip`;

      console.log('[Download] Items prepared:', items.length, 'Has templates:', hasTemplates, 'Zip:', zipName);
      toast.dismiss(p);
      await triggerBulkDownload(items as unknown as Parameters<typeof triggerBulkDownload>[0], zipName);
      console.log('[Download] Download triggered successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to prepare download';
      console.error('[Download] Error:', err);
      toast.error(msg, { id: p });
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleAssignedChange = (value: boolean | undefined) => {
    setAssigned(value);
    setPage(1);
  };

  const handleBulkAssign = async (templateId: string | null) => {
    if (!eventId || selectedIds.length === 0) return;
    try {
      await bulkUpdate.mutateAsync({
        qrCodeIds: selectedIds,
        templateId: templateId ? Number(templateId) : null,
      });
      toast.success(`Successfully updated ${selectedIds.length} QR codes`);
      setSelectedIds([]);
      void refetch();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast.error('Selected template no longer exists.');
      } else {
        toast.error('Failed to bulk update QR codes');
      }
    }
  };

  const handleOpenBulkDownloadRange = () => {
    if (!canEditQrCodes) return;
    setBulkDownloadMode('range');
  };

  const handleOpenBulkDownloadSelected = () => {
    if (!canEditQrCodes || selectedIds.length === 0) return;
    setBulkDownloadMode('qr-codes');
  };

  return (
    <div className="flex flex-col gap-6">
      {canEditQrCodes && (
        <GenerateQrModal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          eventId={eventId}
          onGenerate={handleGenerateBatch}
        />
      )}

      {canEditQrCodes && (
        <BulkDownloadQRModal
          isOpen={bulkDownloadMode !== null}
          onClose={() => {
            setBulkDownloadMode(null);
            setSelectedIds([]);
          }}
          eventId={eventId}
          urlHash={urlHash}
          mode={bulkDownloadMode || 'range'}
          selectedQrIds={bulkDownloadMode === 'qr-codes' ? selectedIds : []}
        />
      )}

      {/* Download prompt for newly generated QR codes */}
      {generatedRange && (
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <Download className="w-5 h-5 text-info" />
                {generatedRange.count} QR Codes Created
              </h3>
              <p className="text-sm text-muted">
                #{generatedRange.from} – #{generatedRange.to} are ready to download.
              </p>
            </div>
            <button
              onClick={() => setGeneratedRange(null)}
              className="text-muted hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleDownloadGenerated}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-info rounded-lg hover:bg-info/90 transition-all shadow-md shadow-info/10 active:scale-95"
            >
              <Download className="w-4 h-4" />
              Download QR Codes
            </button>
            <button
              onClick={() => setGeneratedRange(null)}
              className="px-5 py-2 text-sm font-medium text-muted border border-border rounded-lg hover:bg-accent"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {canEditQrCodes && (
        <BulkAssignTemplateModal
          isOpen={isBulkAssignOpen}
          onClose={() => setIsBulkAssignOpen(false)}
          eventId={eventId}
          selectedCount={selectedIds.length}
          onAssign={handleBulkAssign}
        />
      )}

      <BulkQRProgress 
        isOpen={bulkStatus !== 'idle'}
        status={bulkStatus === 'idle' ? 'generating' : (bulkStatus as 'generating' | 'zipping' | 'completed' | 'error')}
        current={bulkCurrent}
        total={bulkTotal}
        onClose={resetBulk}
      />

      {HiddenQRRenderer}

      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-card-foreground flex items-center gap-2">
            <QrIcon className="w-6 h-6 text-info" />
            QR Codes
          </h2>
          <p className="text-xs text-muted font-medium">
            Manage {totalItems} unique scan entrypoints for your guests.
          </p>
        </div>

        {canEditQrCodes && (
          <div className="flex gap-2">
            <button
              onClick={handleOpenBulkDownloadRange}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-info bg-white border border-info/30 rounded-lg hover:bg-info/5 transition-all shadow-md shadow-info/10 active:scale-95"
            >
              <Download className="w-4 h-4" />
              Bulk Download
            </button>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-info rounded-lg hover:bg-info/90 transition-all shadow-md shadow-info/10 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Generate More
            </button>
          </div>
        )}
      </div>

      <QRCodesToolbar 
        search={search}
        onSearchChange={handleSearchChange}
        assigned={assigned}
        onAssignedChange={handleAssignedChange}
      />

      {canEditQrCodes && (
        <QRCodeBulkActions
          selectedCount={selectedIds.length}
          onBulkAssign={() => setIsBulkAssignOpen(true)}
          onOpenBulkDownload={handleOpenBulkDownloadSelected}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-border p-12 flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in-95">
           <Loader2 className="w-8 h-8 animate-spin text-info" />
           <span className="text-sm font-medium text-muted">Retrieving QR Code records...</span>
        </div>
      ) : (
        <>
          <QRCodesTable
            codes={codes}
            isLoading={isLoading}
            eventId={eventId}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            defaultTemplate={eventDefaultTemplate}
          />

          <Pagination 
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};
