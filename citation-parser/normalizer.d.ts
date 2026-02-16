/**
 * Citation normalization and deduplication
 */
import { Citation, CitationCategory } from './types';
/**
 * Normalize a citation text for comparison and deduplication
 */
export declare function normalizeCitationText(text: string): string;
/**
 * Extract the case name from a case citation
 */
export declare function extractCaseName(citation: string): string | null;
/**
 * Extract the main citation identifier (for deduplication)
 * For cases: volume + reporter + page
 * For statutes: title + section
 */
export declare function extractCitationIdentifier(citation: string, category: CitationCategory): string;
/**
 * Check if two citations are duplicates
 */
export declare function areCitationsDuplicate(cit1: Citation, cit2: Citation): boolean;
/**
 * Deduplicate citations and merge page numbers
 */
export declare function deduplicateCitations(citations: Citation[]): Citation[];
/**
 * Try to resolve a short-form citation to its parent
 */
export declare function resolveShortForm(shortFormText: string, allCitations: Citation[]): string | null;
/**
 * Sort citations alphabetically within category
 */
export declare function sortCitations(citations: Citation[]): Citation[];
/**
 * Group citations by category
 */
export declare function groupByCategory(citations: Citation[]): Map<CitationCategory, Citation[]>;
//# sourceMappingURL=normalizer.d.ts.map