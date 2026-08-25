import { X, ZoomIn, Download, ImageOff, Maximize2 } from 'lucide-react';
import { useRef, useCallback, useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useTemplate } from '../../hooks/use-templates';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import type { QrCode } from '../../types';
import { compositeQRCodeToBlob } from '../../utils/canvas-composer';

interface QRCodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: QrCode | null;
  guestName?: string;
}

// Session-level cache: keyed by qrLink|templateId|updatedAt
const compositedCache = new Map<string, string>();

function getCacheKey(qrLink: string, templateId: string, updatedAt: string) {
  return `${qrLink}|${templateId}|${updatedAt}`;
}

export default function QRCodePreviewModal({
  isOpen,
  onClose,
  qrCode,
  guestName = 'unknown',
}: QRCodePreviewModalProps) {
  const hiddenQrRef = useRef<HTMLDivElement>(null);
  const [composited, setComposited] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const eventId = qrCode?.eventId;
  const templateId = qrCode?.templateId;

  // Fallback: if no template assigned, use event's default template
  const { data: event } = useQuery({
    queryKey: ['events', eventId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/events/${eventId}`);
      return data;
    },
    enabled: !!eventId && !templateId,
  });

  const effectiveTemplateId = templateId || event?.defaultTemplateId;
  const { data: effectiveTemplate } = useTemplate(eventId, effectiveTemplateId);
  const template = effectiveTemplate;

  const qrLink = qrCode?.qrLink;

  const cacheKey =
    qrLink && effectiveTemplateId && template?.updatedAt
      ? getCacheKey(qrLink, String(effectiveTemplateId), template.updatedAt)
      : null;

  // Composite: draw background + QR at template position using centralized utility
  const compositeImage = useCallback(async () => {
    if (!template?.backgroundImage || !qrLink || !cacheKey) return;

    // Check cache first
    const cached = compositedCache.get(cacheKey);
    if (cached) {
      setComposited(cached);
      return;
    }

    const qrCanvas = hiddenQrRef.current?.querySelector('canvas');
    if (!qrCanvas) return;

    try {
      const blob = await compositeQRCodeToBlob({
        qrCanvas,
        template,
        numericId: qrCode.numericId,
        showNumericIdBelow: template.showNumericIdBelow,
        textColor: template.textColor,
        customTexts: template.customTexts,
      });

      // Convert blob to DataURL for the <img> tag
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        compositedCache.set(cacheKey, dataUrl);
        setComposited(dataUrl);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Composition failed:', error);
    }
  }, [qrCode, template, qrLink, cacheKey]);

  useEffect(() => {
    if (isOpen && template?.backgroundImage && qrLink) {
      if (cacheKey && compositedCache.has(cacheKey)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setComposited(compositedCache.get(cacheKey)!);
        return;
      }
      // Small delay to ensure hidden QR canvas is rendered
      const timer = setTimeout(compositeImage, 100);
      return () => clearTimeout(timer);
    }
    setComposited(null);
  }, [isOpen, template, qrLink, cacheKey, compositeImage]);

  const handleDownload = useCallback(() => {
    if (!qrCode) return;
    const identifier = guestName.replace(/\s+/g, '-').toLowerCase();
    const fileName = `qr-${identifier}-${qrCode.numericId}.png`;

    if (composited) {
      const a = document.createElement('a');
      a.href = composited;
      a.download = fileName;
      a.click();
      return;
    }

    const qrCanvas = hiddenQrRef.current?.querySelector('canvas');
    if (!qrCanvas) return;
    const a = document.createElement('a');
    a.href = qrCanvas.toDataURL('image/png');
    a.download = fileName;
    a.click();
  }, [qrCode, guestName, composited]);

  if (!isOpen || !qrCode) return null;

  const hasTemplate = !!template?.backgroundImage;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      >
        <div
          className="bg-background rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-border flex justify-between items-center">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-card-foreground">
                QR Code Preview
              </h3>
              <p className="text-xs text-muted truncate max-w-[250px]">
                ID: #{qrCode.numericId}{' '}
                {template && ` - Template: #${template.id}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-accent rounded-full text-muted transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 flex flex-col items-center gap-5">
            {qrLink && (
              <div ref={hiddenQrRef} className="hidden">
                <QRCodeCanvas
                  value={qrLink}
                  size={template?.qrSize || 512}
                  level="M"
                />
              </div>
            )}

            <div className="group relative w-full bg-accent rounded-xl border border-border overflow-hidden shadow-inner flex items-center justify-center min-h-[200px]">
              {!qrLink ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted">
                  <ImageOff className="w-10 h-10 opacity-30" />
                  <p className="text-sm italic">No QR link available</p>
                </div>
              ) : hasTemplate && composited ? (
                <>
                  <img
                    src={composited}
                    alt={`QR Code for ${guestName}`}
                    className="w-full h-auto"
                  />
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </>
              ) : hasTemplate && !composited ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted">
                  <div className="w-6 h-6 border-2 border-info border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs">Generating preview...</p>
                </div>
              ) : (
                <div className="p-6 bg-white rounded-2xl shadow-sm relative">
                  <QRCodeCanvas value={qrLink} size={240} level="M" />
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="absolute top-2 right-2 p-1.5 bg-black/5 hover:bg-black/10 text-muted rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {!hasTemplate && qrLink && (
              <p className="text-xs text-warning italic text-center">
                No template assigned — showing plain QR code
              </p>
            )}

            <div className="flex flex-col items-center gap-1 w-full">
              <span className="text-sm font-bold text-foreground">
                {guestName !== 'unknown'
                  ? guestName
                  : `QR Code #${qrCode.numericId}`}
              </span>
              <span className="text-xs text-muted break-all w-full text-center px-4 italic">
                {qrLink}
              </span>
            </div>

            <div className="grid grid-cols-2 w-full gap-3">
              {qrLink && (
                <a
                  href={qrLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-info text-white rounded-md text-sm font-bold hover:bg-info/90 transition-all shadow-md"
                >
                  <ZoomIn className="w-4 h-4" />
                  Open Link
                </a>
              )}
              <button
                onClick={handleDownload}
                disabled={!qrLink}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-success/30 text-success bg-background rounded-md text-sm font-medium hover:bg-success hover:text-white transition-all disabled:opacity-50 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in zoom-in duration-200"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <X className="w-8 h-8" />
          </button>

          <div
            className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {hasTemplate && composited ? (
              <img
                src={composited}
                alt="Fullscreen QR"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <div className="p-12 bg-white rounded-[2.5rem] shadow-2xl scale-150">
                <QRCodeCanvas value={qrLink!} size={256} level="H" />
              </div>
            )}
          </div>


        </div>
      )}
    </>
  );
}
