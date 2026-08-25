import React, { useState } from 'react';
import { QrCode, Loader2, Pencil, Layout } from 'lucide-react';
import type { QrCode as QrCodeType } from '../../types';
import { QRCodeEditModal } from './QRCodeEditModal';
import QRCodePreviewModal from './QRCodePreviewModal';
import { AssignTemplateModal } from './AssignTemplateModal';
import { useUpdateQrCode } from '../../hooks/use-qr-codes';
import { useAuth } from '../../hooks/use-auth';
import toast from 'react-hot-toast';

interface QRCodesTableProps {
  codes: QrCodeType[];
  isLoading: boolean;
  eventId: string;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
  defaultTemplate?: { id: string | number; name: string };
}

export const QRCodesTable: React.FC<QRCodesTableProps> = ({
  codes,
  isLoading,
  eventId,
  selectedIds = [],
  onSelectionChange,
  defaultTemplate,
}) => {
  const updateQrCode = useUpdateQrCode(eventId);
  const { user } = useAuth();
  const canEditQrCodes = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const [editModal, setEditModal] = useState<{ open: boolean; code: QrCodeType | null }>({
    open: false,
    code: null,
  });
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    code: QrCodeType | null;
  }>({
    open: false,
    code: null,
  });
  const [assignModal, setAssignModal] = useState<{
    open: boolean;
    code: QrCodeType | null;
  }>({
    open: false,
    code: null,
  });

  const toggleAll = () => {
    if (onSelectionChange) {
      if (selectedIds.length === codes.length && codes.length > 0) {
        onSelectionChange([]);
      } else {
        onSelectionChange(codes.map((c) => Number(c.id)));
      }
    }
  };

  const toggleOne = (id: number) => {
    if (onSelectionChange) {
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((i) => i !== id));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
    }
  };

  const handleUpdateRedirect = async (redirectLink: string) => {
    if (!editModal.code) return;
    try {
      await updateQrCode.mutateAsync({ qrCodeId: editModal.code.id, payload: { redirectLink } });
      toast.success('QR redirect link updated');
    } catch {
      toast.error('Failed to update QR redirect');
      throw new Error();
    }
  };

  const handleAssignTemplate = async (templateId: string | null) => {
    if (!assignModal.code) return;
    try {
      await updateQrCode.mutateAsync({
        qrCodeId: assignModal.code.id,
        payload: { templateId: templateId ? Number(templateId) : null }
      });
      toast.success('QR template assigned successfully');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const detail = err?.response?.data?.message;
      const msg = Array.isArray(detail) ? detail.join(', ') : detail || 'Failed to assign template';
      toast.error(msg);
      throw new Error();
    }
  };
  return (
    <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
      {canEditQrCodes && (
        <QRCodeEditModal
          isOpen={editModal.open}
          qrCode={editModal.code}
          onClose={() => setEditModal({ open: false, code: null })}
          onUpdate={handleUpdateRedirect}
        />
      )}
      <QRCodePreviewModal
        isOpen={previewModal.open}
        qrCode={previewModal.code}
        guestName={previewModal.code?.guest?.name}
        onClose={() => setPreviewModal({ open: false, code: null })}
      />
      {canEditQrCodes && (
        <AssignTemplateModal
          isOpen={assignModal.open}
          qrCode={assignModal.code}
          onClose={() => setAssignModal({ open: false, code: null })}
          onAssign={handleAssignTemplate}
        />
      )}
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-accent">
          <tr>
            {canEditQrCodes && (
              <th className="px-6 py-3 text-left w-10">
                <input
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  checked={codes.length > 0 && selectedIds.length === codes.length}
                  onChange={toggleAll}
                />
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              QR ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Assignment
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Guest
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Template
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-border">
          {isLoading ? (
            <tr>
              <td colSpan={canEditQrCodes ? 6 : 5} className="px-6 py-8 text-center text-muted">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading QR codes...
              </td>
            </tr>
          ) : codes.length > 0 ? (
            codes.map((code) => (
              <tr
                key={code.id}
                className={`hover:bg-accent transition-colors ${
                  selectedIds.includes(Number(code.id)) ? 'bg-info/5' : ''
                }`}
              >
                {canEditQrCodes && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                    <input
                      type="checkbox"
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      checked={selectedIds.includes(Number(code.id))}
                      onChange={() => toggleOne(Number(code.id))}
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent border border-border rounded flex items-center justify-center text-muted">
                      <QrCode className="w-4 h-4" />
                    </div>
                    #{code.numericId}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      code.guestId
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {code.guestId ? 'Assigned' : 'Unassigned'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                  {code.guest?.name || (
                    <span className="italic text-muted-foreground">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                  {code.template?.name ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent text-foreground">
                      {code.template.name}
                    </span>
                  ) : defaultTemplate ? (
                    <span className="text-xs text-muted-foreground">
                      {defaultTemplate.name} (default)
                    </span>
                  ) : (
                    <span className="italic text-muted-foreground">None</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setPreviewModal({ open: true, code })}
                      className="p-1.5 text-info hover:bg-info/10 rounded-md transition-all flex items-center gap-1.5"
                      title="View QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                      <span className="text-xs font-semibold">View QR</span>
                    </button>
                    {canEditQrCodes && (
                      <>
                        <button
                          onClick={() => setEditModal({ open: true, code })}
                          className="p-1.5 text-info hover:bg-info/10 rounded-md transition-all flex items-center gap-1.5"
                          title="Edit QR Code"
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="text-xs font-semibold">Edit</span>
                        </button>
                        <button
                          onClick={() => setAssignModal({ open: true, code })}
                          className="p-1.5 text-info hover:bg-info/10 rounded-md transition-all flex items-center gap-1.5"
                          title="Assign Template"
                        >
                          <Layout className="w-4 h-4" />
                          <span className="text-xs font-semibold">Assign Template</span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={canEditQrCodes ? 6 : 5} className="px-6 py-12 text-center text-muted italic">
                No QR codes found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
