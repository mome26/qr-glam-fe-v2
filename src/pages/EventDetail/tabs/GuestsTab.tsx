import React, { useState } from 'react';
import { Plus, Download, Loader2, QrCode as QrCodeIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import GuestModal from '../../../components/guests/GuestModal';
import GuestImportModal from '../../../components/guests/GuestImportModal';
import GuestRowActions from '../../../components/guests/GuestRowActions';
import GuestDeleteConfirm from '../../../components/guests/GuestDeleteConfirm';
import { GuestFilters } from '../../../components/guests/GuestFilters';
import { GuestEmptyState } from '../../../components/guests/GuestEmptyState';
import GuestBulkActions from '../../../components/guests/GuestBulkActions';
import BulkAssignDialog from '../../../components/guests/BulkAssignDialog';
import { Pagination } from '../../../components/shared/Pagination';
import { BulkDownloadQRModal } from '../../../components/shared/BulkDownloadQRModal';
import QRCodePreviewModal from '../../../components/qr-codes/QRCodePreviewModal';
import {
  useGuests,
  useAddGuest,
  useUpdateGuest,
  useImportGuests,
} from '../../../hooks/use-guests';
import { useAuth } from '../../../hooks/use-auth';

import type { Guest, QrCode } from '../../../types';
import { guestApi } from '../../../api/guestApi';

interface GuestsTabProps {
  eventId: string | undefined;
  urlHash?: string;
}

interface SelectionState {
  selectedGuestIds: string[];
}

export const GuestsTab: React.FC<GuestsTabProps> = ({ eventId, urlHash }) => {
  const [selection, setSelection] = useState<SelectionState>({
    selectedGuestIds: [],
  });
  const [modalState, setModalState] = useState<{
    open: boolean;
    guest: Guest | null;
  }>({
    open: false,
    guest: null,
  });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    qrCode: QrCode | null;
    guestName?: string;
  }>({
    open: false,
    qrCode: null,
    guestName: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    guestId: string;
    name: string;
  }>({
    open: false,
    guestId: '',
    name: '',
  });

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [group, setGroup] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [isBulkDownloadModalOpen, setIsBulkDownloadModalOpen] = useState(false);

  const hasActiveFilters = !!search || !!status || !!role || !!group;

  const {
    data: guestsResponse,
    isLoading,
    refetch,
  } = useGuests(eventId, {
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
    role: role || undefined,
    group: group || undefined,
    includeDenied: status === 'Denied',
  }, { urlHash });

  const addGuest = useAddGuest(eventId);
  const updateGuest = useUpdateGuest(eventId);
  const importMutation = useImportGuests(eventId);
  const { user } = useAuth();
  const canEditGuests = user?.role === 'ADMIN' || user?.role === 'STAFF';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGuestSubmit = async (data: any) => {
    try {
      if (modalState.guest) {
        await updateGuest.mutateAsync({
          guestId: modalState.guest.id,
          payload: data,
        });
        toast.success('Guest updated successfully');
      } else {
        await addGuest.mutateAsync(data);
        toast.success('Guest added successfully');
      }
      setModalState({ open: false, guest: null });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const msg = Array.isArray(detail)
        ? detail.join(', ')
        : detail || (err as { message?: string })?.message || 'Failed to save guest';
      toast.error(msg);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await updateGuest.mutateAsync({
        guestId: deleteConfirm.guestId,
        payload: { status: 'Denied' },
      });
      toast.success('Guest denied successfully');
      setDeleteConfirm({ open: false, guestId: '', name: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deny guest';
      toast.error(msg);
    }
  };

  const handleCSVImport = async (file: File) => {
    const result = await importMutation.mutateAsync(file);
    void refetch();
    return result;
  };

  const handleExportCsv = async (guestIds?: string[]) => {
    if (!eventId) return;
    const p = toast.loading('Exporting guests...');
    try {
      const blob = await guestApi.exportCsv(eventId, guestIds);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'guests.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Guests exported', { id: p });
    } catch {
      toast.error('Failed to export guests', { id: p });
    }
  };

  const handleOpenBulkDownload = () => {
    if (!canEditGuests) return;
    setIsBulkDownloadModalOpen(true);
  };

  const handleBulkAssign = async (role: string) => {
    if (!eventId || selection.selectedGuestIds.length === 0) return;
    setIsBulkPending(true);
    try {
      await guestApi.bulkUpdate(eventId, selection.selectedGuestIds, { role });
      toast.success(
        `Assigned role "${role}" to ${selection.selectedGuestIds.length} guests`,
      );
      setSelection({ selectedGuestIds: [] });
      setBulkAssignOpen(false);
      void refetch();
    } catch {
      toast.error('Failed to bulk assign role');
    } finally {
      setIsBulkPending(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!eventId || selection.selectedGuestIds.length === 0) return;
    if (
      !window.confirm(
        `Deny ${selection.selectedGuestIds.length} selected guest(s)? Service access will be revoked.`,
      )
    )
      return;
    setIsBulkPending(true);
    try {
      await guestApi.bulkUpdate(eventId, selection.selectedGuestIds, {
        status: 'Denied',
      });
      toast.success(`${selection.selectedGuestIds.length} guests denied`);
      setSelection({ selectedGuestIds: [] });
      void refetch();
    } catch {
      toast.error('Failed to bulk deny guests');
    } finally {
      setIsBulkPending(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelection((prev) => {
      const next = prev.selectedGuestIds.includes(id)
        ? prev.selectedGuestIds.filter((gid) => gid !== id)
        : [...prev.selectedGuestIds, id];
      return { selectedGuestIds: next };
    });
  };

  const toggleSelectAll = (guestIds: string[]) => {
    if (guestIds.every((id) => selection.selectedGuestIds.includes(id))) {
      setSelection((prev) => ({
        selectedGuestIds: prev.selectedGuestIds.filter(
          (id) => !guestIds.includes(id),
        ),
      }));
    } else {
      setSelection((prev) => {
        const next = [...prev.selectedGuestIds];
        guestIds.forEach((id) => {
          if (!next.includes(id)) next.push(id);
        });
        return { selectedGuestIds: next };
      });
    }
  };

  const guests = guestsResponse?.data || [];
  const totalPages = guestsResponse?.totalPages || 1;
  const totalDenied = guestsResponse?.totalDenied || 0;

  return (
    <div className="flex flex-col gap-6">
      <BulkAssignDialog
        isOpen={bulkAssignOpen}
        selectedCount={selection.selectedGuestIds.length}
        onClose={() => setBulkAssignOpen(false)}
        onConfirm={handleBulkAssign}
        isPending={isBulkPending}
      />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-card-foreground">Guests</h2>
        {canEditGuests && (
          <div className="flex gap-2">
            <button
              onClick={() => handleExportCsv()}
              className="flex items-center gap-2 bg-background border border-border text-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-accent transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export All CSV
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 bg-background border border-border text-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-accent transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 rotate-180" />
              Import CSV
            </button>
            <button
              onClick={() => setModalState({ open: true, guest: null })}
              className="flex items-center gap-2 bg-info text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-info/90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Guest
            </button>
          </div>
        )}
      </div>

      {canEditGuests && (
        <GuestModal
          key={modalState.guest?.id ?? 'new'}
          isOpen={modalState.open}
          onClose={() => setModalState({ open: false, guest: null })}
          onSubmit={handleGuestSubmit}
          guest={modalState.guest}
          isPending={addGuest.isPending || updateGuest.isPending}
        />
      )}

      {canEditGuests && (
        <GuestImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSubmit={handleCSVImport}
          isPending={importMutation.isPending}
        />
      )}

      <QRCodePreviewModal
        isOpen={qrModal.open}
        onClose={() => setQrModal({ open: false, qrCode: null, guestName: '' })}
        qrCode={qrModal.qrCode}
        guestName={qrModal.guestName}
      />

      {canEditGuests && (
        <GuestDeleteConfirm
          isOpen={deleteConfirm.open}
          onClose={() => setDeleteConfirm({ open: false, guestId: '', name: '' })}
          onConfirm={handleDeleteConfirm}
          name={deleteConfirm.name}
          isPending={updateGuest.isPending}
        />
      )}

      {/* T018: Contextual Empty States (No guests vs All Denied vs No Results) */}
      {!isLoading && guests.length === 0 ? (
        !hasActiveFilters ? (
          totalDenied > 0 ? (
            <GuestEmptyState
              variant="all-denied"
              totalDenied={totalDenied}
              onToggleDenied={() => {
                setStatus('Denied');
                setPage(1);
              }}
              onAddGuest={canEditGuests ? () => setModalState({ open: true, guest: null }) : undefined}
            />
          ) : (
            <GuestEmptyState
              variant="no-guests"
              onAddGuest={canEditGuests ? () => setModalState({ open: true, guest: null }) : undefined}
              onImportClick={canEditGuests ? () => setIsImportModalOpen(true) : undefined}
            />
          )
        ) : (
          <GuestFilters
            search={search}
            status={status}
            role={role}
            group={group}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            onStatusChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            onRoleChange={(v) => {
              setRole(v);
              setPage(1);
            }}
            onGroupChange={(v) => {
              setGroup(v);
              setPage(1);
            }}
            onReset={() => {
              setSearch('');
              setStatus('');
              setRole('');
              setGroup('');
              setPage(1);
            }}
          />
        )
      ) : (
        <>
          <GuestFilters
            search={search}
            status={status}
            role={role}
            group={group}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            onStatusChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            onRoleChange={(v) => {
              setRole(v);
              setPage(1);
            }}
            onGroupChange={(v) => {
              setGroup(v);
              setPage(1);
            }}
            onReset={() => {
              setSearch('');
              setStatus('');
              setRole('');
              setGroup('');
              setPage(1);
            }}
          />
          {canEditGuests && (
            <GuestBulkActions
              selectedCount={selection.selectedGuestIds.length}
              onBulkAssign={() => setBulkAssignOpen(true)}
              onBulkDelete={handleBulkDelete}
              onExportCsv={() => handleExportCsv(selection.selectedGuestIds)}
              onOpenBulkDownload={handleOpenBulkDownload}
              onClearSelection={() => setSelection({ selectedGuestIds: [] })}
            />
          )}

          <div className="bg-background rounded-lg shadow-sm border border-border overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-accent">
                <tr>
                  {canEditGuests && (
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-border text-info focus:ring-info"
                        checked={
                          guests.length > 0 &&
                          guests.every((g) =>
                            selection.selectedGuestIds.includes(g.id),
                          )
                        }
                        onChange={() => toggleSelectAll(guests.map((g) => g.id))}
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : guests.length > 0 ? (
                  guests.map((guest) => (
                    <tr
                      key={guest.id}
                      className={`hover:bg-accent transition-colors group ${
                        selection.selectedGuestIds.includes(guest.id)
                          ? 'bg-info/5'
                          : ''
                      }`}
                    >
                      {canEditGuests && (
                        <td className="px-4 py-4 w-10">
                          <input
                            type="checkbox"
                            className="rounded border-border text-info focus:ring-info"
                            checked={selection.selectedGuestIds.includes(
                              guest.id,
                            )}
                            onChange={() => toggleSelect(guest.id)}
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {guest.name}
                          </span>
                          <span className="text-xs text-muted">
                            {guest.email ||
                              guest.phone ||
                              'No email or phone'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {guest.role || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {guest.group || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 inline-flex text-[11px] leading-4 font-semibold rounded-full border shadow-sm ${
                            guest.status === 'Complete'
                              ? 'bg-success/5 text-success border-success/20'
                              : guest.status === 'Pending'
                              ? 'bg-warning/5 text-warning border-warning/20'
                              : 'bg-error/5 text-error border-error/20'
                          }`}
                        >
                          {guest.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {canEditGuests ? (
                          <GuestRowActions
                            guest={guest}
                            onEdit={(g) => setModalState({ open: true, guest: g })}
                            onViewQr={(g) =>
                              setQrModal({
                                open: true,
                                qrCode: g.qrCode || null,
                                guestName: g.name,
                              })
                            }
                            onDelete={(id) =>
                              setDeleteConfirm({
                                open: true,
                                guestId: id,
                                name: guest.name,
                              })
                            }
                          />
                        ) : (
                          <button
                            onClick={() =>
                              setQrModal({
                                open: true,
                                qrCode: guest.qrCode || null,
                                guestName: guest.name,
                              })
                            }
                            className="p-1.5 text-muted hover:text-info hover:bg-info/10 rounded-md transition-all"
                            title="View QR Code"
                          >
                            <QrCodeIcon className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={canEditGuests ? 6 : 5}
                      className="px-6 py-8 text-center text-muted-foreground italic"
                    >
                      {hasActiveFilters
                        ? 'No guests match your current filters.'
                        : 'No guests found for this event'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {canEditGuests && (
        <BulkDownloadQRModal
          isOpen={isBulkDownloadModalOpen}
          onClose={() => {
            setIsBulkDownloadModalOpen(false);
            setSelection({ selectedGuestIds: [] });
          }}
          eventId={eventId || ''}
          urlHash={urlHash}
          mode="guests"
          selectedGuestIds={selection.selectedGuestIds}
        />
      )}
    </div>
  );
};
