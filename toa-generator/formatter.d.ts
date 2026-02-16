/**
 * TOA formatting utilities
 */
import { Citation, CitationCategory } from '../citation-parser/types';
export interface TOAFormatOptions {
    /** Use "passim" for citations on 6+ pages */
    passimThreshold: number;
    /** Maximum line length before wrapping */
    maxLineLength: number;
    /** Whether to include page counts */
    includePageCounts: boolean;
    /** Use dot leaders between citation and page numbers */
    useDotLeaders: boolean;
    /** Indentation for wrapped lines */
    wrapIndent: string;
}
/**
 * Format page numbers for a citation
 */
export declare function formatPageNumbers(pages: number[], options: TOAFormatOptions): string;
/**
 * Create dot leader between text and page numbers
 */
export declare function createDotLeader(citationText: string, pageNumbers: string, maxLength: number): string;
/**
 * Format a single citation line
 */
export declare function formatCitationLine(citation: Citation, options: TOAFormatOptions): string;
/**
 * Format case name with italics (using Word formatting markup)
 */
export declare function formatCaseName(citationText: string): string;
/**
 * Format a category section
 */
export declare function formatCategorySection(category: CitationCategory, citations: Citation[], options: TOAFormatOptions): string;
/**
 * Generate complete Table of Authorities text
 */
export declare function generateTOA(citationsByCategory: Map<CitationCategory, Citation[]>, options?: Partial<TOAFormatOptions>): string;
/**
 * Convert formatted text to Word OOXML for proper formatting
 * This handles italics, tabs, and other Word-specific formatting
 */
export declare function toWordOOXML(formattedText: string): string;
//# sourceMappingURL=formatter.d.ts.map