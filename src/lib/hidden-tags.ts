/**
 * Hidden Tags Configuration
 *
 * These tags are used internally for core flows and system functionality
 * but should not be displayed prominently in the UI (like in the users table).
 *
 * They represent system states and automation markers that are automatically
 * managed by Manychat flows.
 */

export const HIDDEN_TAGS = [
  'registradoapi',           // API registration confirmation
  'messagescountinsta',      // Message count tracker flow
  'storiescountinsta',       // Story interactions tracker flow
  'commentcountinsta',       // Comment count tracker flow
] as const;

export type HiddenTag = typeof HIDDEN_TAGS[number];

/**
 * Check if a tag should be hidden from prominent UI displays
 */
export function isHiddenTag(tagName: string): boolean {
  return HIDDEN_TAGS.includes(tagName.toLowerCase() as any);
}

/**
 * Filter out hidden tags from a list of tags
 */
export function filterVisibleTags<T extends { name: string }>(tags: T[]): T[] {
  return tags.filter(tag => !isHiddenTag(tag.name));
}

/**
 * Get hidden tags from a list of tags
 */
export function getHiddenTags<T extends { name: string }>(tags: T[]): T[] {
  return tags.filter(tag => isHiddenTag(tag.name));
}

/**
 * Get information about why a tag is hidden
 */
export function getHiddenTagInfo(tagName: string): { reason: string; flow?: string } | null {
  const tag = tagName.toLowerCase();

  switch (tag) {
    case 'registradoapi':
      return {
        reason: 'API registration marker',
        flow: 'Contact API Registration',
      };
    case 'messagescountinsta':
      return {
        reason: 'Message count tracker',
        flow: 'Instagram Messages Counter',
      };
    case 'storiescountinsta':
      return {
        reason: 'Story interactions tracker',
        flow: 'Instagram Stories Counter',
      };
    case 'commentcountinsta':
      return {
        reason: 'Comment count tracker',
        flow: 'Instagram Comments Counter',
      };
    default:
      return null;
  }
}
