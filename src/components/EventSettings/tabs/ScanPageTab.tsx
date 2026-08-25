import React, { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { Save, Eye, RotateCcw, Loader2, AlertTriangle, Info, Maximize2, Minimize2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUpdateEventSettings } from '../../../hooks/use-events';
import apiClient from '../../../api/client';

const Editor = lazy(() => import('@monaco-editor/react'));

// Handlebars types for lazy loading
type HandlebarsInstance = typeof import('handlebars');

const MAX_TEMPLATE_LENGTH = 65000;

interface TemplateMeta {
  id: string;
  label: string;
  language: string;
  isDefault?: boolean;
  contentHash?: string;
}

// Module-level cache for template metadata (static server-side data)
let cachedTemplates: TemplateMeta[] | null = null;

// ── localStorage-backed content cache ────────────────────────────────────────
// Keys are template IDs; values are raw HTML strings.
// The cache version allows future cache-busting if template files change.
const LS_CACHE_KEY = 'qrglam_scan_tpl_v1';
const LS_HASHES_KEY = 'qrglam_scan_tpl_hashes_v1';

function lsReadCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function lsWriteCache(id: string, content: string): void {
  try {
    const store = lsReadCache();
    store[id] = content;
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify(store));
  } catch {
    // Quota exceeded or private browsing — silently ignore
  }
}

function lsGetContent(id: string): string | undefined {
  return lsReadCache()[id];
}

function lsReadHashes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_HASHES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function lsWriteHash(id: string, hash: string): void {
  try {
    const store = lsReadHashes();
    store[id] = hash;
    localStorage.setItem(LS_HASHES_KEY, JSON.stringify(store));
  } catch {
    // Silently ignore
  }
}

/**
 * Invalidate a single template from the content cache if its hash mismatches
 * the current server-side hash. Returns true if the cache entry was stale
 * (and thus removed).
 */
function lsInvalidateIfStale(id: string, serverHash: string): boolean {
  const storedHash = lsReadHashes()[id];
  if (storedHash !== undefined && storedHash !== serverHash) {
    try {
      const store = lsReadCache();
      delete store[id];
      localStorage.setItem(LS_CACHE_KEY, JSON.stringify(store));
    } catch {
      // Silently ignore
    }
    return true;
  }
  return false;
}

/**
 * Given the full templates list from the API, invalidate all stale entries.
 * Should be called right after fetching template metadata.
 */
function invalidateStaleTemplates(
  templates: Array<{ id: string; contentHash?: string }>,
): void {
  for (const t of templates) {
    if (t.contentHash) {
      lsInvalidateIfStale(t.id, t.contentHash);
    }
  }
}


// Proper Handlebars context object for live preview
const TEMPLATE_PREVIEW_CONTEXT = {
  eventName: 'Summer Gala 2026',
  guestName: 'Alex Johnson',
  mediaUrl: 'https://placehold.co/600x400/e2e8f0/475569?text=Sample+Media',
  embedUrl: 'https://www.youtube.com/embed/oznr-1-poSU',
  downloadUrl: 'https://drive.google.com/uc?export=download&id=mockVideoId123',
  isVideo: true,
  thumbnailUrl: 'https://placehold.co/640x360/1e293b/94a3b8?text=Video+Thumbnail',
  driveViewUrl: 'https://drive.google.com/drive/folders/mockFolderId',
  year: new Date().getFullYear(),
  isPreview: true,
  mediaItems: [
    { name: 'Photo 1', url: 'https://placehold.co/100x100?text=P1' },
    { name: 'Photo 2', url: 'https://placehold.co/100x100?text=P2' },
  ],
};

function generatePreviewHtml(
  template: string,
  handlebars: HandlebarsInstance | null,
  onError: (error: string | null) => void,
): string {
  if (!handlebars) {
    return `<div style="padding:40px;text-align:center;color:#6b7280;font-family:sans-serif;background:#f9fafb;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <p style="font-size:24px;margin-bottom:8px;">&#9888;&#65039;</p>
      <p style="font-size:14px;font-weight:500;">Loading preview engine...</p>
    </div>`;
  }

  try {
    const compiled = handlebars.compile(template);
    const result = compiled(TEMPLATE_PREVIEW_CONTEXT);
    onError(null);
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown compilation error';
    onError(message);
    return '';
  }
}

interface ScanPageTabProps {
  eventId: string;
  scanPageTemplate?: string | null;
  /** Named built-in template ID saved to DB (mutually exclusive with scanPageTemplate) */
  scanPageTemplateId?: string | null;
}

export const ScanPageTab: React.FC<ScanPageTabProps> = ({
  eventId,
  scanPageTemplate,
  scanPageTemplateId,
}) => {
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [editorValue, setEditorValue] = useState<string>('');
  const updateSettings = useUpdateEventSettings(eventId);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showVariablesInfo, setShowVariablesInfo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lazy-loaded Handlebars instance
  const [handlebars, setHandlebars] = useState<HandlebarsInstance | null>(null);
  const [compilationError, setCompilationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('handlebars').then((hb) => {
      if (!cancelled) {
        setHandlebars(hb);
      }
    }).catch((error) => {
      console.error('Failed to load Handlebars:', error);
    });
    return () => { cancelled = true; };
  }, []);

  // Debounced value for live preview
  const [debouncedValue, setDebouncedValue] = useState(editorValue);

  // Track default template content for unsaved-changes comparison
  const [defaultTemplateContent, setDefaultTemplateContent] = useState<string | null>(null);

  // Tracks the editor value at the moment of the last successful save.
  // Using a ref so it is updated synchronously without triggering a re-render.
  const lastSavedContentRef = useRef<string | null>(null);

  // T027: beforeunload handler — warn when navigating away with unsaved changes
  useEffect(() => {
    const hasUnsavedChanges = () => {
      // If we have saved at least once this session, use that as the baseline.
      if (lastSavedContentRef.current !== null) {
        return editorValue !== lastSavedContentRef.current;
      }
      // Otherwise fall back to the prop value coming from the parent.
      if (scanPageTemplate != null) {
        return editorValue !== scanPageTemplate;
      }
      // When no saved template, compare against loaded default
      if (defaultTemplateContent != null) {
        return editorValue !== defaultTemplateContent;
      }
      return false;
    };

    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [editorValue, scanPageTemplate, defaultTemplateContent]);

  // Centralized helper to get template content: hits localStorage cache first, falls back to API.
  const fetchAndCacheTemplateContent = useCallback(async (templateId: string): Promise<string | null> => {
    const cached = lsGetContent(templateId);
    if (cached !== undefined) return cached;
    try {
      const { data } = await apiClient.get(
        `/events/${eventId}/scan-page/templates/${encodeURIComponent(templateId)}/content`,
        { responseType: 'text' },
      );
      const content = data as string;
      lsWriteCache(templateId, content);
      // Also store the hash from the templates list if available
      const tpl = cachedTemplates?.find((t) => t.id === templateId);
      if (tpl?.contentHash) {
        lsWriteHash(templateId, tpl.contentHash);
      }
      return content;
    } catch {
      return null;
    }
  }, [eventId]);

  // Fetch templates on mount and initialize editor
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // ── 1. Load template metadata (always fetch to get current contentHashes) ─
      setIsLoadingTemplates(true);
      try {
        const { data: templateList } = await apiClient.get(
          `/events/${eventId}/scan-page/templates`,
        );
        if (!cancelled) {
          const tpl = templateList as TemplateMeta[];
          cachedTemplates = tpl;
          setTemplates(tpl);
          // Invalidate stale content cache entries whose hashes no longer match
          invalidateStaleTemplates(tpl);
        }
      } catch {
        if (!cancelled) toast.error('Failed to load templates');
      } finally {
        if (!cancelled) setIsLoadingTemplates(false);
      }

      if (cancelled) return;

      // ── 2. Resolve initial editor content ───────────────────────────────
      if (scanPageTemplate != null) {
        // User previously saved fully custom HTML
        setEditorValue(scanPageTemplate);
        setSelectedTemplate('custom');
      } else if (scanPageTemplateId) {
        // User previously saved a named template — load its content for display
        const content = await fetchAndCacheTemplateContent(scanPageTemplateId);
        if (!cancelled && content !== null) {
          setEditorValue(content);
          setSelectedTemplate(scanPageTemplateId);
          setDefaultTemplateContent(content);
        }
      } else {
        // No saved preference — load the default template
        const defaultTemplate =
          cachedTemplates?.find((t) => t.isDefault) ||
          cachedTemplates?.find((t) => t.language === 'en') ||
          (cachedTemplates && cachedTemplates.length > 0 ? cachedTemplates[0] : null);

        if (!defaultTemplate) {
          if (!cancelled) toast.error('No default template available');
          return;
        }
        const content = await fetchAndCacheTemplateContent(defaultTemplate.id);
        if (!cancelled && content !== null) {
          setEditorValue(content);
          setSelectedTemplate(defaultTemplate.id);
          setDefaultTemplateContent(content);
        }
      }
    }

    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, fetchAndCacheTemplateContent]);

  // Live dropdown state detection — auto-switch to "Custom" or back to a named template
  // Only runs when editor content changes AFTER templates are loaded.
  // Uses localStorage cache — no API calls here.
  useEffect(() => {
    if (isLoadingTemplates || templates.length === 0 || editorValue === '') return;

    let matchedId: string | null = null;
    for (const t of templates) {
      const cached = lsGetContent(t.id);
      if (cached !== undefined && cached === editorValue) {
        matchedId = t.id;
        break;
      }
    }

    if (matchedId !== null && selectedTemplate !== matchedId) {
      setSelectedTemplate(matchedId);
    } else if (matchedId === null && selectedTemplate !== 'custom') {
      setSelectedTemplate('custom');
    }
  }, [editorValue, templates, selectedTemplate, isLoadingTemplates]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(editorValue), 600);
    return () => clearTimeout(timer);
  }, [editorValue]);

  const previewHtml = useMemo(() => {
    const html = generatePreviewHtml(
      debouncedValue,
      handlebars,
      setCompilationError,
    );
    if (!html && debouncedValue && handlebars) {
      return '';
    }
    return html;
  }, [debouncedValue, handlebars]);

  const charCount = editorValue.length;
  const isOverLimit = charCount > MAX_TEMPLATE_LENGTH;

  const handleTemplateSelect = useCallback(async (templateId: string) => {
    if (templateId === 'custom') return;
    const content = await fetchAndCacheTemplateContent(templateId);
    if (content !== null) {
      setEditorValue(content);
      setSelectedTemplate(templateId);
    } else {
      toast.error('Failed to load template content');
    }
  }, [fetchAndCacheTemplateContent]);

  const handleSave = useCallback(async () => {
    if (isOverLimit) {
      toast.error(`Template exceeds maximum length of ${MAX_TEMPLATE_LENGTH} characters`);
      return;
    }

    const isNamed = selectedTemplate !== null && selectedTemplate !== 'custom';

    if (isNamed) {
      // ── Named template selected ──────────────────────────────────────────
      // Only save if it differs from what's already persisted
      const alreadySaved =
        scanPageTemplateId === selectedTemplate &&
        (scanPageTemplate == null || scanPageTemplate === '');
      if (alreadySaved) {
        toast('No changes to save', { icon: 'ℹ️' });
        return;
      }
      try {
        await updateSettings.mutateAsync({
          scanPageTemplateId: selectedTemplate,
          scanPageTemplate: null,
        } as never);
        // Record current editor content as "clean" baseline immediately.
        lastSavedContentRef.current = editorValue;
        toast.success('Scan page template saved');
      } catch (error: unknown) {
        const e = error as { response?: { data?: { message?: string } }; message?: string };
        toast.error(e?.response?.data?.message || e.message || 'Failed to save template');
      }
    } else {
      // ── Custom / modified content ────────────────────────────────────────
      // Compare against what's currently saved in the DB
      const currentSaved = scanPageTemplate ?? defaultTemplateContent ?? '';
      if (editorValue === currentSaved && scanPageTemplateId == null) {
        toast('No changes to save', { icon: 'ℹ️' });
        return;
      }
      try {
        await updateSettings.mutateAsync({
          scanPageTemplate: editorValue,
          scanPageTemplateId: null,
        } as never);
        // Record current editor content as "clean" baseline immediately.
        lastSavedContentRef.current = editorValue;
        toast.success('Scan page template saved');
      } catch (error: unknown) {
        const e = error as { response?: { data?: { message?: string } }; message?: string };
        toast.error(e?.response?.data?.message || e.message || 'Failed to save template');
      }
    }
  }, [
    editorValue, isOverLimit, updateSettings, selectedTemplate,
    scanPageTemplate, scanPageTemplateId, defaultTemplateContent,
  ]);

  const handlePreview = useCallback(async () => {
    setIsPreviewing(true);
    try {
      const { data } = await apiClient.post(
        `/events/${eventId}/scan-page/preview`,
        { template: editorValue },
        { responseType: 'text' },
      );
      const blob = new Blob([data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } }; message?: string };
      const message = apiError?.response?.data?.message || apiError.message || 'Preview failed';
      toast.error(typeof message === 'string' ? message : JSON.stringify(message));
    } finally {
      setIsPreviewing(false);
    }
  }, [editorValue, eventId]);

  const handleReset = useCallback(async () => {
    try {
      await updateSettings.mutateAsync({ scanPageTemplate: null, scanPageTemplateId: null } as never);
      // Load default template from localStorage cache with API fallback
      const defaultTemplate =
        templates.find((t) => t.isDefault) ||
        templates.find((t) => t.language === 'en') ||
        (templates.length > 0 ? templates[0] : null);

      if (!defaultTemplate) throw new Error('No default template available');

      const content = await fetchAndCacheTemplateContent(defaultTemplate.id);
      if (content === null) throw new Error('Failed to load default template content');
      setEditorValue(content);
      setSelectedTemplate(defaultTemplate.id);
      setDefaultTemplateContent(content);
      setShowResetConfirm(false);
      toast.success('Template reset to default');
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(e?.response?.data?.message || e.message || 'Reset failed');
    }
  }, [updateSettings, templates, fetchAndCacheTemplateContent]);

  return (
    <>
    <div className={`flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-300 ${isFullscreen ? 'hidden' : ''}`}>
      {/* Compact header: title + description left, action buttons right */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">Scan Page Template</h3>
          <p className="text-sm text-muted-foreground">
            Customize the HTML template that guests see when they scan a QR code.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending || isOverLimit}
            className="flex items-center gap-2 bg-info text-white rounded-lg px-5 py-2.5 text-sm font-bold hover:bg-info/90 transition-all shadow-lg shadow-info/10 disabled:opacity-50"
          >
            {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Template
          </button>
          <button
            onClick={handlePreview}
            disabled={isPreviewing}
            className="flex items-center gap-2 bg-accent/20 text-foreground border border-border rounded-lg px-5 py-2.5 text-sm font-bold hover:bg-accent/40 transition-all disabled:opacity-50"
          >
            {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Preview
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 text-error/80 hover:text-error border border-error/20 hover:border-error/40 rounded-lg px-5 py-2.5 text-sm font-bold transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2 bg-accent/20 text-foreground border border-border rounded-lg px-5 py-2.5 text-sm font-bold hover:bg-accent/40 transition-all"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? 'Exit' : 'Dock'}
          </button>
        </div>
      </div>

      {/* Character count warning */}
      {isOverLimit && (
        <div className="flex items-center gap-2 text-error text-xs font-bold animate-in slide-in-from-top-1">
          <AlertTriangle className="w-4 h-4" />
          Template exceeds maximum length of {MAX_TEMPLATE_LENGTH} characters ({charCount.toLocaleString()} / {MAX_TEMPLATE_LENGTH.toLocaleString()})
        </div>
      )}

      {/* Split layout: Editor + Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Editor section — 7/12 ≈ 58% */}
        <div className="xl:col-span-7 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">Editor</h4>
              <button
                onClick={() => setShowVariablesInfo(true)}
                className="flex items-center justify-center w-5 h-5 rounded hover:bg-accent/40 transition-colors cursor-help"
                title="View template variables"
              >
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              {/* Template selector dropdown */}
              <select
                value={selectedTemplate ?? 'custom'}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                disabled={isLoadingTemplates}
                className="text-xs border border-border rounded px-2 py-1 bg-background"
              >
                {isLoadingTemplates && (
                  <option value="" disabled>Loading templates...</option>
                )}
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} ({t.language})
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {charCount.toLocaleString()} / {MAX_TEMPLATE_LENGTH.toLocaleString()}
              </span>
            </div>
          </div>
          <div
            className="border border-border rounded-xl overflow-hidden"
            style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center h-full bg-accent/5 text-muted-foreground text-sm">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading editor...
              </div>
            }>
              <Editor
                height="100%"
                defaultLanguage="html"
                value={editorValue}
                onChange={(value) => setEditorValue(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </Suspense>
          </div>
        </div>

        {/* Preview section — 5/12 ≈ 42%, hidden on small screens */}
        <div className="hidden xl:flex xl:col-span-5 flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Live Preview</h4>
            <span className="text-[11px] text-muted-foreground italic">Mock data &bull; Updates as you type</span>
          </div>
          <div
            className="border border-border rounded-xl overflow-hidden flex-1 relative"
            style={{ minHeight: '500px', overflowY: 'auto' }}
          >
            <iframe
              srcDoc={previewHtml}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full border-0"
              title="Live template preview"
            />
            {compilationError && (
              <div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm p-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h5 className="text-red-900 font-bold mb-2">Compilation Error</h5>
                <p className="text-red-700 text-sm max-w-[80%] leading-relaxed">
                  {compilationError}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Fullscreen Dock Mode */}
    {isFullscreen && (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Fullscreen header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">Scan Page Template</h3>
            <p className="text-sm text-muted-foreground">
              Customize the HTML template that guests see when they scan a QR code.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={updateSettings.isPending || isOverLimit}
              className="flex items-center gap-2 bg-info text-white rounded-lg px-5 py-2.5 text-sm font-bold hover:bg-info/90 transition-all shadow-lg shadow-info/10 disabled:opacity-50"
            >
              {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Template
            </button>
            <button
              onClick={handlePreview}
              disabled={isPreviewing}
              className="flex items-center gap-2 bg-accent/20 text-foreground border border-border rounded-lg px-5 py-2.5 text-sm font-bold hover:bg-accent/40 transition-all disabled:opacity-50"
            >
              {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Preview
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 text-error/80 hover:text-error border border-error/20 hover:border-error/40 rounded-lg px-5 py-2.5 text-sm font-bold transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-2 bg-accent/20 text-foreground border border-border rounded-lg px-5 py-2.5 text-sm font-bold hover:bg-accent/40 transition-all"
              title="Exit fullscreen"
            >
              <Minimize2 className="w-4 h-4" />
              Exit
            </button>
          </div>
        </div>

        {/* Character count warning */}
        {isOverLimit && (
          <div className="flex items-center gap-2 text-error text-xs font-bold px-6 py-2 animate-in slide-in-from-top-1">
            <AlertTriangle className="w-4 h-4" />
            Template exceeds maximum length of {MAX_TEMPLATE_LENGTH} characters ({charCount.toLocaleString()} / {MAX_TEMPLATE_LENGTH.toLocaleString()})
          </div>
        )}

        {/* Fullscreen split layout */}
        <div className="flex-1 grid grid-cols-2 gap-6 p-6">
          {/* Editor section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">Editor</h4>
                <button
                  onClick={() => setShowVariablesInfo(true)}
                  className="flex items-center justify-center w-5 h-5 rounded hover:bg-accent/40 transition-colors cursor-help"
                  title="View template variables"
                >
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                {/* Template selector dropdown */}
                <select
                  value={selectedTemplate ?? 'custom'}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  disabled={isLoadingTemplates}
                  className="text-xs border border-border rounded px-2 py-1 bg-background"
                >
                  {isLoadingTemplates && (
                    <option value="" disabled>Loading templates...</option>
                  )}
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} ({t.language})
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {charCount.toLocaleString()} / {MAX_TEMPLATE_LENGTH.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex-1 border border-border rounded-xl overflow-hidden">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full bg-accent/5 text-muted-foreground text-sm">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading editor...
                </div>
              }>
                <Editor
                  height="100%"
                  defaultLanguage="html"
                  value={editorValue}
                  onChange={(value) => setEditorValue(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </Suspense>
            </div>
          </div>

          {/* Preview section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Live Preview</h4>
              <span className="text-[11px] text-muted-foreground italic">Mock data &bull; Updates as you type</span>
            </div>
            <div className="flex-1 border border-border rounded-xl overflow-hidden relative">
              <iframe
                srcDoc={previewHtml}
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-full border-0"
                title="Live template preview"
              />
              {compilationError && (
                <div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm p-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h5 className="text-red-900 font-bold mb-2">Compilation Error</h5>
                  <p className="text-red-700 text-sm max-w-[80%] leading-relaxed">
                    {compilationError}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Reset Confirmation Modal - rendered outside all containers for proper z-index */}
    {showResetConfirm && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-xl border border-border shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-8 flex flex-col gap-6">
            <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center text-warning">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">Reset to Default</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                This will replace your custom template with the default scan page template. Your current changes will be lost.
              </p>
            </div>
          </div>
          <div className="px-8 py-6 bg-accent/20 border-t border-border flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="order-2 sm:order-1 px-6 py-3 text-sm font-bold text-muted hover:text-foreground transition-colors"
              disabled={updateSettings.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              disabled={updateSettings.isPending}
              className="order-1 sm:order-2 px-8 py-3 bg-warning text-white rounded-xl text-sm font-bold hover:bg-warning/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-warning/20 disabled:opacity-50"
            >
              {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Reset Template
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Template Variables Modal - rendered outside all containers for proper z-index */}
    {showVariablesInfo && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-xl border border-border shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight text-foreground">Template Variables</h3>
              <button
                onClick={() => setShowVariablesInfo(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              These variables are substituted with mock values in the live preview and real values at render time.
            </p>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-accent/20">
                    <th className="text-left px-3 py-2 font-semibold text-foreground">Variable</th>
                    <th className="text-left px-3 py-2 font-semibold text-foreground">Mock Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(TEMPLATE_PREVIEW_CONTEXT).map(([key, value]) => {
                    let displayValue: string;
                    if (typeof value === 'boolean') {
                      displayValue = value.toString();
                    } else if (Array.isArray(value)) {
                      displayValue = value.length > 0
                        ? `[${value.length} item${value.length > 1 ? 's' : ''}]`
                        : '[]';
                    } else if (typeof value === 'object' && value !== null) {
                      displayValue = JSON.stringify(value);
                    } else {
                      displayValue = String(value);
                    }
                    const varName = `{{${key}}}`;
                    return (
                      <tr key={key} className="font-mono text-xs">
                        <td className="px-3 py-2 text-info">{varName}</td>
                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]" title={displayValue}>
                          {displayValue || <span className="italic text-[11px]">(empty)</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setShowVariablesInfo(false)}
              className="px-6 py-2.5 bg-info text-white rounded-lg text-sm font-bold hover:bg-info/90 transition-all self-end"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
};
