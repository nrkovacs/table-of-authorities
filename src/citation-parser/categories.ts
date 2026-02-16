/**
 * Citation category definitions and ordering
 */

import { CitationCategory } from './types';

/**
 * Standard order of citation categories in a Table of Authorities
 */
export const CATEGORY_ORDER: CitationCategory[] = [
  CitationCategory.Cases,
  CitationCategory.Statutes,
  CitationCategory.Constitutional,
  CitationCategory.Rules,
  CitationCategory.Regulations,
  CitationCategory.Treatises,
  CitationCategory.Other,
];

/**
 * Display names for categories
 */
export const CATEGORY_DISPLAY_NAMES: Record<CitationCategory, string> = {
  [CitationCategory.Cases]: 'CASES',
  [CitationCategory.Statutes]: 'STATUTES',
  [CitationCategory.Constitutional]: 'CONSTITUTIONAL PROVISIONS',
  [CitationCategory.Rules]: 'RULES',
  [CitationCategory.Regulations]: 'REGULATIONS',
  [CitationCategory.Treatises]: 'TREATISES',
  [CitationCategory.Other]: 'OTHER AUTHORITIES',
};

/**
 * Get the sort order index for a category
 */
export function getCategoryOrder(category: CitationCategory): number {
  return CATEGORY_ORDER.indexOf(category);
}

/**
 * Get display name for a category
 */
export function getCategoryDisplayName(category: CitationCategory): string {
  return CATEGORY_DISPLAY_NAMES[category];
}
