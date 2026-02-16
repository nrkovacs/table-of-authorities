/**
 * Main citation parser orchestrator
 */
import { Citation, CitationCategory, ParsedDocument, ParserOptions } from './types';
/**
 * Parse a document and extract all citations
 */
export declare function parseDocument(text: string, pageMap: Map<number, string>, // Maps page number to text content
options?: Partial<ParserOptions>): ParsedDocument;
/**
 * Parse text with simple page estimation (for testing)
 */
export declare function parseText(text: string, options?: Partial<ParserOptions>): ParsedDocument;
/**
 * Get citations grouped by category
 */
export declare function getCitationsByCategory(citations: Citation[]): Map<CitationCategory, Citation[]>;
/**
 * Filter citations to only included ones
 */
export declare function getIncludedCitations(citations: Citation[]): Citation[];
/**
 * Get statistics about parsed citations
 */
export declare function getCitationStats(citations: Citation[]): {
    total: number;
    byCategory: Map<CitationCategory, number>;
    shortForms: number;
    included: number;
};
export * from './types';
export * from './categories';
export * from './patterns';
export * from './normalizer';
//# sourceMappingURL=index.d.ts.map