import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { QrCode, QrTemplate } from '../types';
import { compositeQRCodeToBlob } from './canvas-composer';

export interface BulkDownloadItem {
  qrCode: QrCode;
  template: QrTemplate | null;
  guestName: string;
}

export type ProgressCallback = (current: number, total: number) => void;

/**
 * Orchestrates sequential composition and ZIP generation for a set of QR codes.
 * 
 * @param items List of items to process
 * @param options.zipFilename Target filename for the archive
 * @param options.onProgress Callback for progress tracking
 * @param options.getQRCanvas Async function that returns a canvas for the QR code segment
 */
export async function downloadBulkQRs(
  items: BulkDownloadItem[],
  options: {
    zipFilename?: string;
    onProgress?: ProgressCallback;
    getQRCanvas: (item: BulkDownloadItem) => Promise<HTMLCanvasElement>;
  }
): Promise<void> {
  const { 
    zipFilename = 'bulk-qr-export.zip', 
    onProgress, 
    getQRCanvas 
  } = options;

  if (items.length === 0) {
    throw new Error('No items to process');
  }

  console.log('[bulk-qr-download] Processing', items.length, 'items, filename:', zipFilename);

  const zip = new JSZip();
  let successCount = 0;
  let failCount = 0;

  // Sequential processing to avoid memory spikes and UI freezing
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Pulse progress
    onProgress?.(i, items.length);

    try {
      // 1. Request the QR code as a canvas (usually rendered via hidden QRCodeCanvas)
      const qrCanvas = await getQRCanvas(item);

      // 2. Composite with the template background
      const blob = await compositeQRCodeToBlob({
        qrCanvas,
        template: item.template,
        numericId: item.qrCode.numericId,
        showNumericIdBelow: item.template?.showNumericIdBelow,
        numericIdSize: item.template?.numericIdSize,
        textColor: item.template?.textColor,
        customTexts: item.template?.customTexts,
      });

      // 3. Define filename: {numericId}_{guestName}.png
      const sanitizedName = item.guestName.trim().replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '_');
      const fileName = `${item.qrCode.numericId}_${sanitizedName || 'guest'}.png`;
      
      // 4. Add to ZIP
      zip.file(fileName, blob);
      successCount++;
    } catch (err) {
      console.error(`[bulk-qr-download] Failed to process QR code ${item.qrCode.numericId}:`, err);
      failCount++;
      // We continue with the next item instead of failing the whole batch
    }
  }

  // Final progress update
  onProgress?.(items.length, items.length);

  console.log('[bulk-qr-download] Done. Success:', successCount, 'Failed:', failCount);

  if (successCount === 0) {
    throw new Error(`All ${items.length} QR codes failed to process. Check browser console for details.`);
  }

  // Generate and save ZIP file
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  console.log('[bulk-qr-download] ZIP blob created, calling saveAs:', zipFilename);
  saveAs(zipBlob, zipFilename);
  console.log('[bulk-qr-download] saveAs completed');
}
