/**
 * Citation category definitions and ordering
 */
import { CitationCategory } from './types';
/**
 * Standard order of citation categories in a Table of Authorities
 */
export declare const CATEGORY_ORDER: CitationCategory[];
/**
 * Display names for categories
 */
export declare const CATEGORY_DISPLAY_NAMES: Record<CitationCategory, string>;
/**
 * Get the sort order index for a category
 */
export declare function getCategoryOrder(category: CitationCategory): number;
/**
 * Get display name for a category
 */
export declare function getCategoryDisplayName(category: CitationCategory): string;
//# sourceMappingURL=categories.d.ts.map