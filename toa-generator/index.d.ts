/**
 * TOA Generator - Main module
 */
import { Citation, CitationCategory } from '../citation-parser/types';
import { TOAFormatOptions } from './formatter';
export interface TOAGeneratorOptions {
    /** Formatting options */
    format?: Partial<TOAFormatOptions>;
    /** Only include citations marked as included */
    onlyIncluded?: boolean;
    /** Return as Word OOXML instead of plain text */
    asOOXML?: boolean;
}
/**
 * Generate Table of Authorities from citations
 */
export declare function generateTableOfAuthorities(citations: Citation[], options?: TOAGeneratorOptions): string;
/**
 * Preview TOA without generating OOXML (for UI display)
 */
export declare function previewTableOfAuthorities(citations: Citation[], options?: Partial<TOAFormatOptions>): string;
/**
 * Count citations by category
 */
export declare function getCitationCounts(citations: Citation[]): Map<CitationCategory, number>;
export * from './formatter';
//# sourceMappingURL=index.d.ts.map