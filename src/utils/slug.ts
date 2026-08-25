/**
 * Validates a slug format: lowercase alphanumeric + hyphens only, 3-50 chars.
 */
export const validateSlug = (slug: string): string | null => {
  if (!slug) return null;
  if (slug.length < 3) return 'Slug must be at least 3 characters long';
  if (slug.length > 50) return 'Slug cannot exceed 50 characters';
  
  const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!regex.test(slug)) {
    return 'Slug can only contain lowercase letters, numbers, and hyphens (no spaces or double hyphens)';
  }
  
  return null;
};

/**
 * Generates a URL-safe slug from a string.
 */
export const generateSlug = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Legacy compatibility exports
 */
export const generateEventSlug = generateSlug;

export const extractIdFromSlug = (slug: string | null | undefined): string => {
  if (!slug) return '';
  const parts = slug.split('-');
  return parts[parts.length - 1]; // Assume last part is ID
};
