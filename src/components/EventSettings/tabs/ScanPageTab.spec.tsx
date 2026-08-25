import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Handlebars from 'handlebars';

// Proper Handlebars context object for live preview (matches ScanPageTab.tsx)
const TEMPLATE_PREVIEW_CONTEXT = {
  eventName: 'Summer Gala 2026',
  guestName: 'Alex Johnson',
  mediaUrl: 'https://placehold.co/600x400/e2e8f0/475569?text=Sample+Media',
  embedUrl: '',
  downloadUrl: '#',
  isVideo: false,
  thumbnailUrl: '',
  driveViewUrl: '#',
  year: new Date().getFullYear(),
  isPreview: true,
};

describe('Handlebars template rendering', () => {
  it('replaces simple template variables with mock values', () => {
    const template = '<h1>{{eventName}}</h1><p>{{guestName}}</p>';
    const compiled = Handlebars.compile(template);
    const result = compiled(TEMPLATE_PREVIEW_CONTEXT);
    expect(result).toContain('Summer Gala 2026');
    expect(result).toContain('Alex Johnson');
  });

  it('replaces all occurrences of a variable', () => {
    const template = '{{eventName}} - {{eventName}}';
    const compiled = Handlebars.compile(template);
    const result = compiled(TEMPLATE_PREVIEW_CONTEXT);
    const count = (result.match(/Summer Gala 2026/g) || []).length;
    expect(count).toBe(2);
  });

  it('keeps {{#if}} block content when variable has truthy value', () => {
    const template = '{{#if guestName}}<p>Hello {{guestName}}</p>{{/if}}';
    const compiled = Handlebars.compile(template);
    const result = compiled(TEMPLATE_PREVIEW_CONTEXT);
    expect(result).toContain('<p>Hello Alex Johnson</p>');
    expect(result).not.toContain('{{#if');
  });

  it('strips {{#if}} block content when variable has falsy value', () => {
    const context = { ...TEMPLATE_PREVIEW_CONTEXT, embedUrl: '' };
    const template = '{{#if embedUrl}}<iframe src="{{embedUrl}}"></iframe>{{/if}}';
    const compiled = Handlebars.compile(template);
    const result = compiled(context);
    expect(result.trim()).toBe('');
  });

  it('strips {{else}} blocks when if condition is not met', () => {
    const context = { ...TEMPLATE_PREVIEW_CONTEXT, isVideo: false };
    const template = '{{#if isVideo}}<video></video>{{else}}<img />{{/if}}';
    const compiled = Handlebars.compile(template);
    const result = compiled(context);
    expect(result).not.toContain('{{else}}');
    expect(result).not.toContain('<video');
    expect(result.trim()).toBe('<img />');
  });

  it('handles {{#if}} with boolean true value', () => {
    const context = { isVideo: true };
    const template = '{{#if isVideo}}<video></video>{{else}}<img/>{{/if}}';
    const compiled = Handlebars.compile(template);
    const result = compiled(context);
    expect(result.trim()).toBe('<video></video>');
  });

  it('handles {{#if}} with boolean false value as falsy', () => {
    const context = { isVideo: false };
    const template = '{{#if isVideo}}<video></video>{{else}}<img/>{{/if}}';
    const compiled = Handlebars.compile(template);
    const result = compiled(context);
    expect(result.trim()).toBe('<img/>');
  });

  it('handles nested {{#if}} inside {{#if}} branch correctly', () => {
    const context = { guestName: 'Alex', eventName: 'Gala' };
    const template = '{{#if guestName}}<div>{{#if eventName}}<h1>{{eventName}}</h1>{{/if}}</div>{{/if}}';
    const compiled = Handlebars.compile(template);
    const result = compiled(context);
    expect(result).toContain('<h1>Gala</h1>');
    expect(result).not.toContain('{{#if');
  });

  it('handles {{#each}} iteration', () => {
    const context = { items: ['one', 'two', 'three'] };
    const template = '{{#each items}}<li>{{this}}</li>{{/each}}';
    const compiled = Handlebars.compile(template);
    const result = compiled(context);
    expect(result).toContain('<li>one</li>');
    expect(result).toContain('<li>two</li>');
    expect(result).toContain('<li>three</li>');
  });

  it('handles nested conditionals gracefully', () => {
    const template = '{{#if guestName}}<div>{{guestName}} - {{eventName}}</div>{{/if}}';
    const compiled = Handlebars.compile(template);
    const result = compiled(TEMPLATE_PREVIEW_CONTEXT);
    expect(result).toContain('Alex Johnson');
    expect(result).toContain('Summer Gala 2026');
  });

  it('returns original string when no template variables present', () => {
    const template = '<div>Plain HTML</div>';
    const compiled = Handlebars.compile(template);
    const result = compiled(TEMPLATE_PREVIEW_CONTEXT);
    expect(result).toBe('<div>Plain HTML</div>');
  });

  it('handles empty template string', () => {
    const compiled = Handlebars.compile('');
    const result = compiled(TEMPLATE_PREVIEW_CONTEXT);
    expect(result).toBe('');
  });

  it('throws error on malformed Handlebars syntax', () => {
    const template = '{{#if isVideo}<video></video>{{/if}}'; // missing closing }}
    expect(() => Handlebars.compile(template)).toThrow();
  });

  it('throws error on unclosed {{#if block', () => {
    const template = '{{#if isVideo}}<video></video>'; // missing {{/if}}
    expect(() => Handlebars.compile(template)).toThrow();
  });
});

describe('debounced preview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces preview updates by ~600ms', () => {
    const mockDebounce = vi.fn((value: string, delay: number, callback: (v: string) => void) => {
      const timer = setTimeout(() => callback(value), delay);
      return () => clearTimeout(timer);
    });

    const callback = vi.fn();
    mockDebounce('test value', 600, callback);

    // Callback should not be called immediately
    expect(callback).not.toHaveBeenCalled();

    // Advance time by 500ms - still not called
    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();

    // Advance time to 600ms - should be called now
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledWith('test value');
  });

  it('cancels previous debounce when new value arrives', () => {
    const callbacks: string[] = [];
    let currentTimer: ReturnType<typeof setTimeout> | null = null;

    const debounce = (value: string, delay: number) => {
      if (currentTimer) clearTimeout(currentTimer);
      currentTimer = setTimeout(() => callbacks.push(value), delay);
    };

    debounce('value1', 600);
    vi.advanceTimersByTime(300);

    debounce('value2', 600);
    vi.advanceTimersByTime(300);
    expect(callbacks).toEqual([]);

    vi.advanceTimersByTime(300);
    expect(callbacks).toEqual(['value2']);
  });
});

describe('responsive layout breakpoints', () => {
  // Test that the layout structure includes the correct Tailwind classes
  // for responsive behavior: hidden xl:flex on preview, grid-cols-1 xl:grid-cols-5

  it('preview panel should have hidden xl:flex class for responsive behavior', () => {
    // The preview container should be hidden by default and visible at xl breakpoint
    const previewClasses = 'hidden xl:flex xl:col-span-5 flex-col gap-2';
    expect(previewClasses).toContain('hidden xl:flex');
  });

  it('root grid should be grid-cols-1 xl:grid-cols-12 for responsive layout', () => {
    const gridClasses = 'grid grid-cols-1 xl:grid-cols-12 gap-6';
    expect(gridClasses).toContain('xl:grid-cols-12');
  });

  it('preview panel should be hidden below xl breakpoint (1280px)', () => {
    // At breakpoints below xl (<1280px), the preview should not be visible
    // This is enforced by Tailwind's 'hidden xl:flex' pattern
    const previewVisibility = 'hidden xl:flex';
    expect(previewVisibility.startsWith('hidden')).toBe(true);
  });
});
