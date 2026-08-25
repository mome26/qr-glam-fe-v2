import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { Maximize2, Move, Maximize, X, ImageIcon, Trash2, Plus, Type } from 'lucide-react';
import toast from 'react-hot-toast';
import type { TemplateText } from '../../types';
import { TextOverlayItem } from './TextOverlayItem';

interface QRGenerator {
  (version: number, errorCorrection: string): {
    addData: (data: string) => void;
    make: () => void;
    getModuleCount: () => number;
    isDark: (row: number, col: number) => boolean;
  }
}

interface VisualTemplateEditorProps {
  initialData?: {
    name?: string;
    backgroundImage?: string;
    qrPositionX: number;
    qrPositionY: number;
    qrSize: number;
    showNumericIdBelow?: boolean;
    numericIdSize?: number;
    textColor?: 'black' | 'white';
    customTexts?: TemplateText[];
  };
  onSave: (data: {
    name: string;
    backgroundImage: string;
    qrPositionX: number;
    qrPositionY: number;
    qrSize: number;
    showNumericIdBelow: boolean;
    numericIdSize?: number;
    textColor: 'black' | 'white';
    customTexts: TemplateText[];
  }) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

// A focused element is either the QR, the numeric ID label, or a custom text by its id
type FocusedElement = 'qr' | 'numericId' | string; // string = customText id

export const VisualTemplateEditor: React.FC<VisualTemplateEditorProps> = ({
  initialData,
  onSave,
  onCancel,
  isSaving = false,
}) => {
  // --- Form state ---
  const [name, setName] = useState(initialData?.name || '');
  const [bgDataUrl, setBgDataUrl] = useState<string | null>(initialData?.backgroundImage || null);
  const [qrX, setQrX] = useState(initialData?.qrPositionX || 100);
  const [qrY, setQrY] = useState(initialData?.qrPositionY || 100);
  const [qrSize, setQrSize] = useState(initialData?.qrSize || 500);
  const [showNumericIdBelow, setShowNumericIdBelow] = useState(initialData?.showNumericIdBelow ?? false);
  const [numericIdSize, setNumericIdSize] = useState(initialData?.numericIdSize || 50);
  // Default text color is white (only falls back when no initialData value present)
  const [textColor, setTextColor] = useState<'black' | 'white'>(initialData?.textColor ?? 'white');
  const [customTexts, setCustomTexts] = useState<TemplateText[]>(initialData?.customTexts || []);

  // --- UI state ---
  const [showGrid, setShowGrid] = useState(false);
  const [snapGrid, setSnapGrid] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);

  // focused element: 'qr', 'numericId', or a customText id — only one at a time
  const [focused, setFocused] = useState<FocusedElement | null>(null);
  const [bgError, setBgError] = useState(false);

  // --- Refs ---
  const previewImageRef = useRef<HTMLImageElement>(null);
  const qrWrapperRef = useRef<HTMLDivElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  // QR drag/resize handles
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const fullscreenWrapperRef = useRef<HTMLDivElement>(null);
  const originalDimensionsRef = useRef({ naturalWidth: 0, naturalHeight: 0 });
  // Per-text-overlay DOM refs for direct manipulation during drag (avoids React re-renders)
  const textElemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Mirror of customTexts as a ref so the drag handler can read current positions without closure stale data
  const customTextsRef = useRef<TemplateText[]>(customTexts);
  // Mirrors for textColor and showNumericIdBelow (read inside zero-React drag handler)
  const textColorRef = useRef<'black' | 'white'>(textColor);
  const showNumericIdBelowRef = useRef(showNumericIdBelow);
  const numericIdSizeRef = useRef(numericIdSize);

  // Refs for drag/resize to avoid stale closures
  const stateRef = useRef({ qrX, qrY, qrSize, scaleFactor, snapGrid, gridSize });

  // Track when the qrcode-generator CDN script is ready
  const [qrLibReady, setQrLibReady] = useState(
    !!(window as unknown as { qrcode: unknown }).qrcode,
  );

  // Preview numeric id is always 1 as a sample
  const previewNumericId = 1;

  useEffect(() => {
    stateRef.current = { qrX, qrY, qrSize, scaleFactor, snapGrid, gridSize };
  }, [qrX, qrY, qrSize, scaleFactor, snapGrid, gridSize]);

  // Keep customTextsRef in sync with state (used inside drag handler to avoid stale closures)
  useEffect(() => { customTextsRef.current = customTexts; }, [customTexts]);
  useEffect(() => { textColorRef.current = textColor; }, [textColor]);
  useEffect(() => { showNumericIdBelowRef.current = showNumericIdBelow; }, [showNumericIdBelow]);
  useEffect(() => { numericIdSizeRef.current = numericIdSize; }, [numericIdSize]);

  // Inject qrcode-generator
  useEffect(() => {
    if ((window as unknown as { qrcode: unknown }).qrcode) {
      setTimeout(() => setQrLibReady(true), 0);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
    s.onload = () => setQrLibReady(true);
    document.head.appendChild(s);
  }, []);

  // ---------------------------------------------------------------------------
  // Canvas drawing helpers
  // ---------------------------------------------------------------------------
  const drawQrCode = useCallback((canvas: HTMLCanvasElement, size: number, scale: number) => {
    const displaySize = Math.round(size * scale);
    canvas.width = displaySize;
    canvas.height = displaySize;
    const ctx = canvas.getContext('2d')!;

    const qrGenerator = (window as unknown as { qrcode: QRGenerator }).qrcode;
    if (!qrGenerator) return;
    const qr = qrGenerator(0, 'L');
    qr.addData('https://qr-glam.com/demo');
    qr.make();

    const moduleCount = qr.getModuleCount();
    const padding = displaySize * 0.05;
    const innerSize = displaySize - padding * 2;
    const innerCell = innerSize / moduleCount;
    const borderRadius = displaySize * 0.1;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(borderRadius, 0);
    ctx.arcTo(displaySize, 0, displaySize, displaySize, borderRadius);
    ctx.arcTo(displaySize, displaySize, 0, displaySize, borderRadius);
    ctx.arcTo(0, displaySize, 0, 0, borderRadius);
    ctx.arcTo(0, 0, displaySize, 0, borderRadius);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#000000';
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(
            Math.floor(padding + c * innerCell),
            Math.floor(padding + r * innerCell),
            Math.ceil(innerCell),
            Math.ceil(innerCell)
          );
        }
      }
    }
  }, []);

  const drawGrid = useCallback((canvas: HTMLCanvasElement, w: number, h: number, gSize: number) => {
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(100,150,200,0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += gSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += gSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }, []);

  const refreshPreview = useCallback(() => {
    if (!qrCanvasRef.current || !qrWrapperRef.current || !previewImageRef.current) return;
    const { qrX, qrY, qrSize, scaleFactor: scale } = stateRef.current;

    drawQrCode(qrCanvasRef.current, qrSize, scale);
    qrWrapperRef.current.style.left = Math.round(qrX * scale) + 'px';
    qrWrapperRef.current.style.top = Math.round(qrY * scale) + 'px';

    if (showGrid && gridCanvasRef.current) {
      drawGrid(gridCanvasRef.current, previewImageRef.current.offsetWidth, previewImageRef.current.offsetHeight, gridSize);
    }
  }, [drawQrCode, drawGrid, showGrid, gridSize]);

  // Draw text overlays on the dedicated overlay canvas
  const drawOverlays = useCallback((canvas: HTMLCanvasElement, sf: number) => {
    const ctx = canvas.getContext('2d');
    const img = previewImageRef.current;
    if (!ctx || !img) return;

    canvas.width = img.offsetWidth;
    canvas.height = img.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const color = textColor === 'white' ? '#FFFFFF' : '#000000';

    if (showNumericIdBelow) {
      const fontSize = numericIdSize * sf;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const padding = (qrSize * 0.05) * sf;
      const displaySize = qrSize * sf;
      const x = (qrX * sf) + displaySize / 2;
      const y = (qrY * sf) + displaySize + padding * 2 + (10 * sf);
      ctx.fillText(String(previewNumericId), x, y);
    }

    if (customTexts.length > 0) {
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      customTexts.forEach(txt => {
        ctx.font = `${txt.size * sf}px Inter, sans-serif`;
        ctx.fillText(txt.content, txt.positionX * sf, txt.positionY * sf);
      });
    }
  }, [showNumericIdBelow, numericIdSize, qrSize, qrX, qrY, textColor, customTexts, previewNumericId]);

  useEffect(() => {
    if (!overlayCanvasRef.current || !previewImageRef.current) return;
    drawOverlays(overlayCanvasRef.current, scaleFactor);
  }, [drawOverlays, scaleFactor, qrX, qrY, qrSize, textColor, customTexts]);

  // Custom text element position (used for initial render; during drag the div is moved directly)
  const textHandlePos = useCallback((txt: TemplateText) => {
    const sf = scaleFactor;
    return { x: txt.positionX * sf, y: txt.positionY * sf };
  }, [scaleFactor]);

  // ---------------------------------------------------------------------------
  // Handle images
  // ---------------------------------------------------------------------------
  const handleBgUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const bg = new Image();
      bg.src = src;
      bg.onload = () => {
        let ow = bg.naturalWidth;
        let oh = bg.naturalHeight;
        const maxW = 2000;
        let finalSrc = src;

        if (ow > maxW) {
          const ratio = maxW / ow;
          oh = Math.round(oh * ratio); ow = maxW;
          const rc = document.createElement('canvas');
          rc.width = ow; rc.height = oh;
          rc.getContext('2d')!.drawImage(bg, 0, 0, ow, oh);
          finalSrc = rc.toDataURL('image/jpeg', 0.9);
        }

        setBgDataUrl(finalSrc);
        setBgError(false);
        originalDimensionsRef.current = { naturalWidth: ow, naturalHeight: oh };

        setTimeout(() => {
          const img = previewImageRef.current;
          if (!img) return;
          const sf = (img.width / ow + img.height / oh) / 2;
          setScaleFactor(sf);
          const sz = Math.min(500, ow * 0.25);
          setQrSize(sz);
          const cx = (ow - sz) / 2;
          const cy = (oh - sz) / 2;
          setQrX(cx); setQrY(cy);
        }, 50);
      };
    };
    reader.readAsDataURL(file);
  };

  // ---------------------------------------------------------------------------
  // Unified drag/resize for QR, numeric ID label, and custom texts
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const snap = (v: number) => {
      const { snapGrid, gridSize } = stateRef.current;
      if (!snapGrid) return v;
      return Math.round(v / gridSize) * gridSize;
    };

    // Track live drag/resize values for text (committed to state only on mouseUp)
    let activeTextId: string | null = null;
    let liveTextLogX = 0, liveTextLogY = 0, liveTextSize = 0;
    let textResizeStartX = 0;

    type DragMode = 'qr-drag' | 'qr-resize' | 'text-drag' | 'text-resize';
    let activeMode: DragMode | null = null;
    let dragOffX = 0, dragOffY = 0, resizeStartX = 0;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest('.qr-drag-handle')) {
        activeMode = 'qr-drag';
        const rect = qrWrapperRef.current!.getBoundingClientRect();
        dragOffX = e.clientX - rect.left;
        dragOffY = e.clientY - rect.top;
        e.preventDefault();
        e.stopPropagation();
      } else if (target.closest('.qr-resize-handle')) {
        activeMode = 'qr-resize';
        resizeStartX = e.clientX;
        e.preventDefault();
        e.stopPropagation();
      } else {
        const textDrag = (target.closest('[data-text-drag]') as HTMLElement | null)?.dataset.textDrag;
        if (textDrag) {
          activeMode = 'text-drag';
          activeTextId = textDrag;
          const t = customTextsRef.current.find(x => x.id === textDrag);
          if (t) { liveTextLogX = t.positionX; liveTextLogY = t.positionY; }
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const textResize = (target.closest('[data-text-resize]') as HTMLElement | null)?.dataset.textResize;
        if (textResize) {
          activeMode = 'text-resize';
          activeTextId = textResize;
          const t = customTextsRef.current.find(x => x.id === textResize);
          if (t) { liveTextSize = t.size; }
          textResizeStartX = e.clientX;
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    // Helper: redraw overlay canvas imperatively (called during drag without React state)
    const redrawCanvas = (liveTexts: typeof customTextsRef.current) => {
      const canvas = overlayCanvasRef.current;
      const img = previewImageRef.current;
      if (!canvas || !img) return;
      const { scaleFactor: sf, qrX, qrY, qrSize } = stateRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = img.offsetWidth;
      canvas.height = img.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const color = textColorRef.current === 'white' ? '#FFFFFF' : '#000000';
      if (showNumericIdBelowRef.current) {
        const fSize = numericIdSizeRef.current * sf;
        ctx.font = `bold ${fSize}px Inter, sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const pad = (qrSize * 0.05) * sf;
        ctx.fillText('1', (qrX * sf) + (qrSize * sf) / 2, (qrY * sf) + (qrSize * sf) + pad * 2 + 10 * sf);
      }
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      liveTexts.forEach(t => {
        ctx.font = `${t.size * sf}px Inter, sans-serif`;
        ctx.fillText(t.content, t.positionX * sf, t.positionY * sf);
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!activeMode) return;
      const { scaleFactor: sf } = stateRef.current;
      const rect = previewContainerRef.current!.getBoundingClientRect();

      if (activeMode === 'qr-drag') {
        const px = e.clientX - rect.left - dragOffX;
        const py = e.clientY - rect.top - dragOffY;
        setQrX(Math.round(snap(px / sf)));
        setQrY(Math.round(snap(py / sf)));
      } else if (activeMode === 'qr-resize') {
        const deltaX = (e.clientX - resizeStartX) / sf;
        setQrSize(s => snap(Math.max(50, s + deltaX)));
        resizeStartX = e.clientX;
      } else if (activeMode === 'text-drag' && activeTextId) {
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        liveTextLogX = Math.round(snap(px / sf));
        liveTextLogY = Math.round(snap(py / sf));
        // Move div directly
        const div = textElemRefs.current.get(activeTextId);
        if (div) {
          const txt = customTextsRef.current.find(t => t.id === activeTextId);
          const fontSize = txt ? Math.round(txt.size * sf) : 0;
          div.style.left = Math.round(liveTextLogX * sf) + 'px';
          div.style.top = Math.round(liveTextLogY * sf - fontSize) + 'px';
        }
        const liveTexts = customTextsRef.current.map(t =>
          t.id === activeTextId ? { ...t, positionX: liveTextLogX, positionY: liveTextLogY } : t
        );
        redrawCanvas(liveTexts);
      } else if (activeMode === 'text-resize' && activeTextId) {
        const deltaX = e.clientX - textResizeStartX;
        liveTextSize = Math.max(8, liveTextSize + deltaX / sf);
        textResizeStartX = e.clientX;
        // Update div layout directly so handles follow the resize instantly
        const div = textElemRefs.current.get(activeTextId);
        if (div) {
          const txt = customTextsRef.current.find(t => t.id === activeTextId);
          if (txt) {
            const fontSize = Math.round(liveTextSize * sf);
            const liveY = txt.positionY;
            const displayW = Math.max(40, txt.content.length * fontSize * 0.6);
            div.style.minHeight = fontSize + 8 + 'px';
            div.style.minWidth = displayW + 'px';
            div.style.top = Math.round(liveY * sf - fontSize) + 'px';
          }
        }
        const liveTexts = customTextsRef.current.map(t =>
          t.id === activeTextId ? { ...t, size: liveTextSize } : t
        );
        redrawCanvas(liveTexts);
      }
    };

    const onMouseUp = () => {
      if (activeMode === 'text-drag' && activeTextId) {
        const id = activeTextId;
        const fx = liveTextLogX, fy = liveTextLogY;
        setCustomTexts(prev => prev.map(t => t.id === id ? { ...t, positionX: fx, positionY: fy } : t));
      } else if (activeMode === 'text-resize' && activeTextId) {
        const id = activeTextId;
        const fs = Math.round(liveTextSize);
        setCustomTexts(prev => prev.map(t => t.id === id ? { ...t, size: fs } : t));
      }
      activeMode = null;
      activeTextId = null;
    };

    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Update visual when state changes
  useEffect(() => { refreshPreview(); }, [qrX, qrY, qrSize, scaleFactor, showGrid, qrLibReady, refreshPreview]);

  // Deselect when clicking outside the preview
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!previewContainerRef.current?.contains(target)) {
        setFocused(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reposition QR drag/resize handles
  useEffect(() => {
    const dh = dragHandleRef.current;
    const rh = resizeHandleRef.current;
    if (!dh || !rh) return;
    const ds = qrSize * scaleFactor;
    dh.style.left = Math.round(qrX * scaleFactor + ds + 4) + 'px';
    dh.style.top = Math.round(qrY * scaleFactor) + 'px';
    rh.style.left = Math.round(qrX * scaleFactor + ds) + 'px';
    rh.style.top = Math.round(qrY * scaleFactor + ds) + 'px';
  }, [qrX, qrY, qrSize, scaleFactor]);

  // Fullscreen
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ResizeObserver for scale factor and grid
  useEffect(() => {
    const img = previewImageRef.current;
    if (!img || !bgDataUrl) return;
    const { naturalWidth: ow, naturalHeight: oh } = originalDimensionsRef.current;
    if (!ow || !oh) return;

    const observer = new ResizeObserver(() => {
      const sf = (img.offsetWidth / ow + img.offsetHeight / oh) / 2;
      setScaleFactor(sf);
      if (showGrid && gridCanvasRef.current) {
        drawGrid(gridCanvasRef.current, img.offsetWidth, img.offsetHeight, gridSize);
      }
    });
    observer.observe(img);
    return () => observer.disconnect();
  }, [bgDataUrl, showGrid, gridSize, drawGrid, drawOverlays]);

  // Edit mode: calculate scale factor from initialData
  useEffect(() => {
    if (!bgDataUrl || !initialData?.backgroundImage) return;
    const img = previewImageRef.current;
    if (!img) return;

    const computeScale = () => {
      const ow = img.naturalWidth;
      const oh = img.naturalHeight;
      if (!ow || !oh) return;
      originalDimensionsRef.current = { naturalWidth: ow, naturalHeight: oh };
      const sf = (img.offsetWidth / ow + img.offsetHeight / oh) / 2;
      setScaleFactor(sf);
      setTimeout(() => refreshPreview(), 0);
    };

    if (img.complete && img.naturalWidth > 0) {
      computeScale();
    } else {
      img.onload = computeScale;
    }
  }, [bgDataUrl, initialData?.backgroundImage, refreshPreview]);

  const toggleFullscreen = async () => {
    if (!fullscreenWrapperRef.current) return;
    if (!document.fullscreenElement) await fullscreenWrapperRef.current.requestFullscreen();
    else await document.exitFullscreen();
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error('Template name is required'); return; }
    if (!bgDataUrl) { toast.error('Background image is required'); return; }
    onSave({
      name,
      backgroundImage: bgDataUrl,
      qrPositionX: Math.round(qrX),
      qrPositionY: Math.round(qrY),
      qrSize: Math.round(qrSize),
      showNumericIdBelow,
      numericIdSize,
      textColor,
      customTexts,
    });
  };

  const addCustomText = () => {
    if (customTexts.length >= 10) {
      toast.error('Maximum 10 custom text overlays allowed');
      return;
    }
    const newItem: TemplateText = {
      id: self.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      content: 'New Text',
      size: 50,
      positionX: 100,
      positionY: 100,
    };
    setCustomTexts(prev => [...prev, newItem]);
    setFocused(newItem.id);
  };

  const qrFocused = focused === 'qr';


  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <label className="text-sm font-medium text-foreground">Template Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Minimalist Branding"
          className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-info/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Preview */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Layout Preview
            </h3>
            <button onClick={toggleFullscreen} className="text-xs text-info hover:underline flex items-center gap-1">
              <Maximize2 className="w-3" /> Fullscreen
            </button>
          </div>

          <div
            ref={fullscreenWrapperRef}
            className={`relative bg-accent rounded-xl border border-border overflow-hidden min-h-[300px] flex items-center justify-center ${isFullscreen ? 'p-12' : ''}`}
          >
            {bgDataUrl && !bgError ? (
              <div
                ref={previewContainerRef}
                className="relative inline-block"
                onClick={(e) => {
                  // Clicking directly on the container background deselects
                  if (e.target === previewContainerRef.current || e.target === previewImageRef.current) {
                    setFocused(null);
                  }
                }}
              >
                <img
                  ref={previewImageRef}
                  src={bgDataUrl}
                  alt="Preview"
                  className="max-w-full h-auto block"
                  onError={() => setBgError(true)}
                />

                {/* Grid canvas */}
                <canvas
                  ref={gridCanvasRef}
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{ display: showGrid ? 'block' : 'none' }}
                />

                {/* Text overlay canvas (always visible) */}
                <canvas ref={overlayCanvasRef} className="absolute top-0 left-0 pointer-events-none block" />

                {/* ---- QR Code element ---- */}
                <div
                  ref={qrWrapperRef}
                  className="absolute cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setFocused('qr'); }}
                >
                  <canvas
                    ref={qrCanvasRef}
                    className={`block rounded border-2 transition-all ${qrFocused ? 'border-info shadow-lg shadow-info/30' : 'border-transparent'}`}
                  />
                </div>

                {/* QR drag handle (move) */}
                <div
                  ref={dragHandleRef}
                  className="qr-drag-handle absolute bg-info text-white rounded-md p-1 cursor-grab active:cursor-grabbing shadow-lg z-20 transition-opacity"
                  style={{ width: 24, height: 24, opacity: qrFocused ? 1 : 0, pointerEvents: qrFocused ? 'auto' : 'none' }}
                  title="Move QR"
                >
                  <Move className="w-4 h-4" />
                </div>

                {/* QR resize handle */}
                <div
                  ref={resizeHandleRef}
                  className="qr-resize-handle absolute bg-success text-white rounded-md p-1 cursor-nwse-resize shadow-lg z-20 transition-opacity"
                  style={{ width: 24, height: 24, opacity: qrFocused ? 1 : 0, pointerEvents: qrFocused ? 'auto' : 'none' }}
                  title="Resize QR"
                >
                  <Maximize className="w-4 h-4" />
                </div>



                {/* ---- Custom text interactive elements ---- */}
                {customTexts.map(txt => {
                  const pos = textHandlePos(txt);
                  const isFocusedTxt = focused === txt.id;
                  const fontSize = Math.round(txt.size * scaleFactor);
                  const displayW = Math.max(40, txt.content.length * fontSize * 0.6);
                  return (
                    <div
                      key={txt.id}
                      ref={el => {
                        if (el) textElemRefs.current.set(txt.id, el);
                        else textElemRefs.current.delete(txt.id);
                      }}
                      className={`absolute cursor-pointer rounded border-2 transition-colors ${isFocusedTxt ? 'border-info shadow-lg shadow-info/30' : 'border-transparent hover:border-info/50'}`}
                      style={{
                        left: Math.round(pos.x) + 'px',
                        top: Math.round(pos.y - fontSize) + 'px',
                        minWidth: displayW + 'px',
                        minHeight: fontSize + 8 + 'px',
                      }}
                      onClick={(e) => { e.stopPropagation(); setFocused(txt.id); }}
                    >
                      {/* Move handle — Left side, centered vertically */}
                      <div
                        data-text-drag={txt.id}
                        className="absolute bg-info text-white rounded-md p-1 cursor-grab active:cursor-grabbing shadow-lg z-20 transition-opacity"
                        style={{
                          width: 24, height: 24,
                          top: '50%',
                          left: -32,
                          transform: 'translateY(-50%)',
                          opacity: isFocusedTxt ? 1 : 0,
                          pointerEvents: isFocusedTxt ? 'auto' : 'none',
                        }}
                        title="Move text"
                      >
                        <Move className="w-4 h-4" />
                      </div>
                      {/* Resize handle — Right side, centered vertically */}
                      <div
                        data-text-resize={txt.id}
                        className="absolute bg-success text-white rounded-md p-1 cursor-nwse-resize shadow-lg z-20 transition-opacity"
                        style={{
                          width: 24, height: 24,
                          top: '50%',
                          right: -32,
                          transform: 'translateY(-50%)',
                          opacity: isFocusedTxt ? 1 : 0,
                          pointerEvents: isFocusedTxt ? 'auto' : 'none',
                        }}
                        title="Resize text"
                      >
                        <Maximize className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground p-12">
                <ImageIcon className="w-12 h-12 opacity-20" />
                {bgError ? (
                  <>
                    <p className="text-sm text-error font-medium">Failed to load background image</p>
                    <button
                      onClick={() => { setBgError(false); refreshPreview(); }}
                      className="text-xs text-info hover:underline mb-2"
                    >
                      Retry Loading
                    </button>
                  </>
                ) : (
                  <p className="text-sm">Upload a background to start designing</p>
                )}
                <label className="bg-white border border-border px-4 py-2 rounded-lg text-sm text-foreground cursor-pointer hover:bg-accent">
                   {bgError ? 'Choose Different Image' : 'Browse Files'}
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleBgUpload(e.target.files[0])} />
                </label>
              </div>
            )}

            {isFullscreen && (
              <button onClick={toggleFullscreen} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Legend showing focus hint */}
          {bgDataUrl && (
            <p className="text-xs text-muted italic text-center">
              Click QR code or text label to select · drag blue pill to move
            </p>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold">Coordinates</h3>
              <button onClick={() => setBgDataUrl(null)} className="text-xs text-error hover:underline flex items-center gap-1">
                <Trash2 className="w-3" /> Change Background
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">X Position (px)</label>
                <input type="number" step="1" value={Math.round(qrX)} onChange={(e) => setQrX(Number(e.target.value))} className="w-full px-3 py-1.5 border border-border rounded-md text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">Y Position (px)</label>
                <input type="number" step="1" value={Math.round(qrY)} onChange={(e) => setQrY(Number(e.target.value))} className="w-full px-3 py-1.5 border border-border rounded-md text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">QR Size (px)</label>
                <input type="number" step="1" value={Math.round(qrSize)} onChange={(e) => setQrSize(Number(e.target.value))} className="w-full px-3 py-1.5 border border-border rounded-md text-sm" />
              </div>
            </div>

            {/* QR Settings */}
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider">QR Settings</h4>
              <div className="flex flex-col gap-4">
                <label className="flex items-center justify-between cursor-pointer text-sm font-medium">
                  <span>Show Number Below QR</span>
                  <input
                    type="checkbox"
                    checked={showNumericIdBelow}
                    onChange={(e) => setShowNumericIdBelow(e.target.checked)}
                    className="rounded text-info w-4 h-4"
                  />
                </label>
                {showNumericIdBelow && (
                  <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm font-medium text-muted">Number Text Size px</span>
                    <input
                      type="number"
                      step="1"
                      min="8"
                      max="200"
                      value={numericIdSize}
                      onChange={(e) => setNumericIdSize(Number(e.target.value))}
                      className="w-20 px-3 py-1 text-sm border border-border rounded shadow-inner"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Text Color</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTextColor('black')}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${textColor === 'black' ? 'border-info scale-110' : 'border-border'} bg-black`}
                      title="Black"
                    />
                    <button
                      onClick={() => setTextColor('white')}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${textColor === 'white' ? 'border-info scale-110' : 'border-border'} bg-white shadow-sm`}
                      title="White"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Overlays */}
            <div className="flex flex-col gap-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" /> Custom Overlays
                </h4>
                <button
                  onClick={addCustomText}
                  disabled={customTexts.length >= 10}
                  className="flex items-center gap-1 text-xs font-bold text-info hover:underline disabled:text-muted disabled:no-underline"
                >
                  <Plus className="w-3 h-3" /> Add Text {customTexts.length > 0 && `(${customTexts.length}/10)`}
                </button>
              </div>

              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {customTexts.length === 0 ? (
                  <div className="text-center py-6 bg-accent/30 rounded-lg border border-dashed border-border">
                    <p className="text-xs text-muted italic">No custom text overlays added.</p>
                  </div>
                ) : (
                  customTexts.map((txt) => (
                    <div
                      key={txt.id}
                      className={`rounded-lg transition-all ${focused === txt.id ? 'ring-2 ring-purple-400' : ''}`}
                      onClick={() => setFocused(txt.id)}
                    >
                      <TextOverlayItem
                        text={txt}
                        onChange={(updated) => {
                          setCustomTexts(customTexts.map(t => t.id === updated.id ? updated : t));
                        }}
                        onDelete={() => {
                          setCustomTexts(customTexts.filter(t => t.id !== txt.id));
                          if (focused === txt.id) setFocused(null);
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Editor Tools */}
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Editor Tools</h4>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="rounded text-info" />
                  Show Grid Lines
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={snapGrid} onChange={(e) => setSnapGrid(e.target.checked)} className="rounded text-info" />
                  Snap to Grid
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted font-medium">Grid Size</span>
                  <select value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} className="text-xs border border-border rounded p-1 bg-white outline-none">
                    <option value={10}>10px</option>
                    <option value={20}>20px</option>
                    <option value={50}>50px</option>
                    <option value={100}>100px</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="px-6 py-2 text-sm font-medium text-muted hover:text-foreground">
              Cancel
            </button>
            <button onClick={handleSave} disabled={isSaving} className="bg-info text-white px-8 py-2 rounded-lg text-sm font-bold shadow-lg shadow-info/20 hover:bg-info/90 flex items-center gap-2 disabled:opacity-50">
              {isSaving && <Maximize className="w-4 h-4 animate-spin" />}
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
