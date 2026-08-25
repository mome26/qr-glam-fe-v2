import type { QrTemplate, TemplateText } from '../types';

export interface CanvasCompositionOptions {
  qrCanvas: HTMLCanvasElement;
  template: QrTemplate | null;
  crossOrigin?: string;
  // Overrides/additions for batch generation or specific items
  numericId?: number;
  showNumericIdBelow?: boolean;
  numericIdSize?: number;
  textColor?: 'black' | 'white';
  customTexts?: TemplateText[];
}

/**
 * Draws a rounded rectangle path on a 2D context.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/**
 * Composites a background image from a template with a QR code canvas.
 * Returns a data URL string of the combined image.
 * If template is null, returns the QR canvas as-is (plain QR code).
 */
export async function compositeQRCode(
  options: CanvasCompositionOptions
): Promise<string> {
  const { 
    qrCanvas, 
    template, 
    crossOrigin = 'anonymous',
    numericId,
    showNumericIdBelow: overrideShowNumericId,
    numericIdSize: overrideNumericIdSize,
    textColor: overrideTextColor,
    customTexts: overrideCustomTexts
  } = options;

  // No template — return plain QR code as data URL
  if (!template) {
    return qrCanvas.toDataURL('image/png');
  }

  if (!template.backgroundImage) {
    throw new Error('Template has no background image');
  }

  // Resolve values from override or template
  const showNumericId = overrideShowNumericId ?? template.showNumericIdBelow ?? false;
  const numericIdSize = overrideNumericIdSize ?? template.numericIdSize ?? Math.max(16, template.qrSize * 0.1);
  const textColor = overrideTextColor ?? template.textColor ?? 'black';
  const customTexts = overrideCustomTexts ?? template.customTexts ?? [];

  return new Promise((resolve, reject) => {
    const bg = new Image();
    bg.crossOrigin = crossOrigin;
    bg.onload = () => {
      const canvas = document.createElement('canvas');
      // Use naturalWidth/Height to preserve original resolution
      canvas.width = bg.naturalWidth;
      canvas.height = bg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D context'));
        return;
      }

      // 1. Draw background
      ctx.drawImage(bg, 0, 0);

      // 2. Draw rounded background for QR code (Constitution Principle XII)
      // We add a small padding (e.g. 5% of QR size) for the white border
      const padding = template.qrSize * 0.05;
      const bgX = template.qrPositionX - padding;
      const bgY = template.qrPositionY - padding;
      const bgSize = template.qrSize + padding * 2;
      const borderRadius = template.qrSize * 0.1; // 10% of QR size for radius

      ctx.fillStyle = '#FFFFFF';
      drawRoundedRect(ctx, bgX, bgY, bgSize, bgSize, borderRadius);
      ctx.fill();

      // 3. Draw QR code at template position and size
      ctx.drawImage(
        qrCanvas,
        template.qrPositionX,
        template.qrPositionY,
        template.qrSize,
        template.qrSize
      );

      // 4. Draw Sequential Number (US1)
      if (showNumericId && numericId !== undefined) {
        const fontSize = numericIdSize;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = textColor === 'white' ? '#FFFFFF' : '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Positioned 10px below the white border (bgY + bgSize + 10)
        // or just relative to QR (template.qrPositionY + template.qrSize + padding + 10)
        const textX = template.qrPositionX + template.qrSize / 2;
        const textY = bgY + bgSize + 10;
        ctx.fillText(numericId.toString(), textX, textY);
      }

      // 5. Draw Custom Texts (US2)
      if (customTexts.length > 0) {
        ctx.fillStyle = textColor === 'white' ? '#FFFFFF' : '#000000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        
        customTexts.forEach(txt => {
          ctx.font = `${txt.size}px Inter, sans-serif`;
          ctx.fillText(txt.content, txt.positionX, txt.positionY);
        });
      }

      // 6. Return data URL
      resolve(canvas.toDataURL('image/png'));
    };
    bg.onerror = (e) => reject(new Error('Failed to load background image: ' + e));
    bg.src = template.backgroundImage!;
  });
}

/**
 * Composites a background image from a template with a QR code canvas and returns a Blob.
 */
export async function compositeQRCodeToBlob(
  options: CanvasCompositionOptions
): Promise<Blob> {
  const dataUrl = await compositeQRCode(options);
  const response = await fetch(dataUrl);
  return await response.blob();
}
