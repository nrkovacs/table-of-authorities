/**
 * TOA Generator - Main module
 */

import { Citation, CitationCategory } from '../citation-parser/types';
import { groupByCategory, getIncludedCitations } from '../citation-parser';
import { generateTOA, toWordOOXML, TOAFormatOptions } from './formatter';

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
export function generateTableOfAuthorities(
  citations: Citation[],
  options: TOAGeneratorOptions = {}
): string {
  // Filter citations if needed
  const citsToUse = options.onlyIncluded 
    ? citations.filter(c => c.isIncluded && !c.isShortForm)
    : citations.filter(c => !c.isShortForm);
  
  // Group by category
  const grouped = groupByCategory(citsToUse);
  
  // Generate formatted text
  const formattedText = generateTOA(grouped, options.format);
  
  // Convert to OOXML if requested
  if (options.asOOXML) {
    return toWordOOXML(formattedText);
  }
  
  return formattedText;
}

/**
 * Preview TOA without generating OOXML (for UI display)
 */
export function previewTableOfAuthorities(
  citations: Citation[],
  options: Partial<TOAFormatOptions> = {}
): string {
  return generateTableOfAuthorities(citations, { 
    format: options,
    onlyIncluded: true,
    asOOXML: false,
  });
}

/**
 * Count citations by category
 */
export function getCitationCounts(citations: Citation[]): Map<CitationCategory, number> {
  const counts = new Map<CitationCategory, number>();
  
  for (const citation of citations) {
    if (citation.isIncluded && !citation.isShortForm) {
      counts.set(citation.category, (counts.get(citation.category) || 0) + 1);
    }
  }
  
  return counts;
}

// Re-export formatter utilities
export * from './formatter';
