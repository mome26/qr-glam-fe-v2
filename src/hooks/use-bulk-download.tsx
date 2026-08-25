import { useState, useCallback, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { downloadBulkQRs } from '../utils/bulk-qr-download';
import type { BulkDownloadItem } from '../utils/bulk-qr-download';

export type DownloadStatus = 'idle' | 'generating' | 'zipping' | 'completed' | 'error';

/**
 * Hook to manage client-side bulk QR download state and hidden rendering.
 */
export function useBulkDownload() {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [activeItem, setActiveItem] = useState<{ value: string; size: number } | null>(null);
  
  const qrRef = useRef<HTMLDivElement>(null);

  const startDownload = useCallback(async (
    items: BulkDownloadItem[],
    zipName: string = 'qrs-export.zip'
  ) => {
    if (items.length === 0) {
      throw new Error('No items to download');
    }

    console.log('[BulkDownload] Starting download for', items.length, 'items, zip:', zipName);
    console.log('[BulkDownload] First item qrCode.qrLink:', items[0].qrCode.qrLink);
    setTotal(items.length);
    setCurrent(0);
    setStatus('generating');

    try {
      await downloadBulkQRs(items, {
        zipFilename: zipName,
        onProgress: (curr) => {
           setCurrent(curr);
           console.log('[BulkDownload] Progress:', curr + '/' + items.length);
           if (curr === items.length) setStatus('zipping');
        },
        getQRCanvas: async (item) => {
          console.log('[BulkDownload] Rendering QR for numericId:', item.qrCode.numericId, 'size:', item.template?.qrSize || 512);
          // 1. Set the values so the hidden component re-renders
          setActiveItem({
            value: item.qrCode.qrLink,
            size: item.template?.qrSize || 512
          });

          // 2. Wait for the tick and the canvas rendering
          return new Promise<HTMLCanvasElement>((resolve, reject) => {
            // Wait for React to finish rendering the new QR state
            setTimeout(() => {
              const canvas = qrRef.current?.querySelector('canvas');
              if (canvas) {
                resolve(canvas);
              } else {
                reject(new Error('Hidden QR canvas not found'));
              }
            }, 100); // 100ms should be safe for DOM refresh and canvas drawing
          });
        }
      });
      console.log('[BulkDownload] downloadBulkQRs completed, setting status completed');
      setStatus('completed');
    } catch (err) {
      console.error('Bulk download failed:', err);
      setStatus('error');
      throw err; // Re-throw so caller can handle errors
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setCurrent(0);
    setTotal(0);
    setActiveItem(null);
  }, []);

  /**
   * IMPORTANT: Render this component in your tab/page to provide the
   * hidden canvas source for the bulk generation logic.
   */
  const HiddenQRRenderer = activeItem ? (
    <div 
      ref={qrRef} 
      className="hidden fixed -left-[9999px] -top-[9999px]" 
      style={{ visibility: 'hidden', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <QRCodeCanvas 
        value={activeItem.value} 
        size={activeItem.size} 
        level="M" 
      />
    </div>
  ) : null;

  return {
    status,
    current,
    total,
    startDownload,
    reset,
    HiddenQRRenderer,
  };
}
