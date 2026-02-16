/**
 * Main citation parser orchestrator
 */

import { Citation, CitationMatch, CitationCategory, CitationPattern, ParsedDocument, ParserOptions } from './types';
import { ALL_PATTERNS } from './patterns';
import {
  normalizeCitationText,
  deduplicateCitations,
  resolveShortForm,
  groupByCategory,
} from './normalizer';

/**
 * Generate a unique ID for a citation
 */
function generateCitationId(): string {
  return `cit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse a document and extract all citations
 */
export function parseDocument(
  text: string,
  pageMap: Map<number, string>, // Maps page number to text content
  options: Partial<ParserOptions> = {}
): ParsedDocument {
  const opts: ParserOptions = {
    includeFootnotes: true,
    minConfidence: 0.7,
    customPatterns: [],
    ...options,
  };
  
  const allPatterns = [...ALL_PATTERNS, ...(opts.customPatterns || [])];
  const matches: CitationMatch[] = [];
  
  // Process each page
  for (const [pageNumber, pageText] of pageMap.entries()) {
    // Find all matches on this page
    for (const pattern of allPatterns) {
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      let match: RegExpExecArray | null;
      
      while ((match = regex.exec(pageText)) !== null) {
        matches.push({
          text: match[0],
          category: pattern.category,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          pageNumber,
          isShortForm: pattern.isShortForm || false,
        });
      }
    }
  }
  
  // Convert matches to citations
  const citations: Citation[] = matches.map((match) => ({
    id: generateCitationId(),
    text: match.text,
    originalText: match.text,
    normalizedText: normalizeCitationText(match.text),
    category: match.category,
    pages: [match.pageNumber],
    isShortForm: match.isShortForm,
    isIncluded: true,
  }));
  
  // Deduplicate citations (merge same citation on different pages)
  const dedupedCitations = deduplicateCitations(citations);
  
  // Resolve short forms
  for (const citation of dedupedCitations) {
    if (citation.isShortForm) {
      const parentId = resolveShortForm(citation.text, dedupedCitations);
      if (parentId) {
        citation.parentCitationId = parentId;
      }
    }
  }
  
  return {
    citations: dedupedCitations,
    totalPages: pageMap.size,
    fullText: text,
  };
}

/**
 * Parse text with simple page estimation (for testing)
 */
export function parseText(text: string, options: Partial<ParserOptions> = {}): ParsedDocument {
  // Estimate pages (rough: 3000 chars per page)
  const charsPerPage = 3000;
  const pageCount = Math.ceil(text.length / charsPerPage);
  
  const pageMap = new Map<number, string>();
  for (let i = 0; i < pageCount; i++) {
    const start = i * charsPerPage;
    const end = Math.min((i + 1) * charsPerPage, text.length);
    pageMap.set(i + 1, text.substring(start, end));
  }
  
  return parseDocument(text, pageMap, options);
}

/**
 * Get citations grouped by category
 */
export function getCitationsByCategory(citations: Citation[]): Map<CitationCategory, Citation[]> {
  return groupByCategory(citations);
}

/**
 * Filter citations to only included ones
 */
export function getIncludedCitations(citations: Citation[]): Citation[] {
  return citations.filter((c) => c.isIncluded && !c.isShortForm);
}

/**
 * Get statistics about parsed citations
 */
export function getCitationStats(citations: Citation[]): {
  total: number;
  byCategory: Map<CitationCategory, number>;
  shortForms: number;
  included: number;
} {
  const byCategory = new Map<CitationCategory, number>();
  let shortForms = 0;
  let included = 0;
  
  for (const citation of citations) {
    byCategory.set(citation.category, (byCategory.get(citation.category) || 0) + 1);
    if (citation.isShortForm) shortForms++;
    if (citation.isIncluded && !citation.isShortForm) included++;
  }
  
  return {
    total: citations.length,
    byCategory,
    shortForms,
    included,
  };
}

// Export all types and utilities
export * from './types';
export * from './categories';
export * from './patterns';
export * from './normalizer';
