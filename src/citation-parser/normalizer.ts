/**
 * Citation normalization and deduplication
 */

import { Citation, CitationCategory } from './types';

/**
 * Normalize a citation text for comparison and deduplication
 */
export function normalizeCitationText(text: string): string {
  let normalized = text.trim();
  
  // Remove multiple spaces
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Standardize section symbols
  normalized = normalized.replace(/§§/g, '§').replace(/sect\./gi, '§');
  
  // Standardize U.S.C. variations
  normalized = normalized.replace(/\bU\.?S\.?C\.?\b/gi, 'U.S.C.');
  normalized = normalized.replace(/\bUSC\b/gi, 'U.S.C.');
  
  // Standardize C.F.R. variations
  normalized = normalized.replace(/\bC\.?F\.?R\.?\b/gi, 'C.F.R.');
  normalized = normalized.replace(/\bCFR\b/gi, 'C.F.R.');
  
  // Standardize "versus" to "v."
  normalized = normalized.replace(/\s+(?:vs\.|versus)\s+/gi, ' v. ');
  
  // Remove trailing punctuation (except periods in abbreviations)
  normalized = normalized.replace(/[,;]\s*$/, '');
  
  // Normalize quotes
  normalized = normalized.replace(/[""]/g, '"').replace(/['']/g, "'");
  
  return normalized;
}

/**
 * Extract the case name from a case citation
 */
export function extractCaseName(citation: string): string | null {
  // Try to match case name pattern: Party v. Party, stopping before volume number
  const match = citation.match(/^([A-Z][A-Za-z\s&.'-]+)\s+v\.\s+([A-Z][A-Za-z\s&.'-]+?)(?:,\s*\d|\s+\d)/i);
  if (match) {
    return `${match[1].trim()} v. ${match[2].trim()}`;
  }
  
  // Try In re / Ex parte pattern
  const inReMatch = citation.match(/^(?:In re|Ex parte)\s+([A-Z][A-Za-z\s&.,'-]+)/i);
  if (inReMatch) {
    return inReMatch[0].trim();
  }
  
  return null;
}

/**
 * Extract the main citation identifier (for deduplication)
 * For cases: volume + reporter + page
 * For statutes: title + section
 */
export function extractCitationIdentifier(citation: string, category: CitationCategory): string {
  switch (category) {
    case CitationCategory.Cases: {
      // Extract volume, reporter, and first page: "347 U.S. 483"
      const match = citation.match(/(\d+)\s+([A-Za-z.0-9]+)\s+(\d+)/);
      if (match) {
        return `${match[1]} ${match[2]} ${match[3]}`.toUpperCase();
      }
      break;
    }
    
    case CitationCategory.Statutes: {
      // Extract title and section: "42 U.S.C. § 1983"
      const uscMatch = citation.match(/(\d+)\s+U\.?S\.?C\.?\s+§\s*([\d\w\-]+)/i);
      if (uscMatch) {
        return `${uscMatch[1]} U.S.C. ${uscMatch[2]}`.toUpperCase();
      }
      
      // State statute
      const stateMatch = citation.match(/([A-Za-z.]+)\s+[A-Za-z.\s]*\s+§\s*([\d\w\-\.]+)/i);
      if (stateMatch) {
        return `${stateMatch[1]} ${stateMatch[2]}`.toUpperCase();
      }
      break;
    }
    
    case CitationCategory.Constitutional: {
      // Extract constitution reference
      const match = citation.match(/(U\.S\.|[A-Z][A-Za-z.]+)\s+Const\.\s+(art\.|amend\.)\s+([IVXLCDM\d]+)/i);
      if (match) {
        return `${match[1]} Const. ${match[2]} ${match[3]}`.toUpperCase();
      }
      break;
    }
    
    case CitationCategory.Rules: {
      // Extract rule reference
      const match = citation.match(/(Fed\.|[A-Z][A-Za-z.]+)\s+R\.\s+([A-Za-z.]+)\s+P\.\s+([\d]+)/i);
      if (match) {
        return `${match[1]} R. ${match[2]} P. ${match[3]}`.toUpperCase();
      }
      break;
    }
    
    case CitationCategory.Regulations: {
      // Extract regulation reference
      const match = citation.match(/(\d+)\s+C\.F\.R\.\s+§\s*([\d\w\-\.]+)/i);
      if (match) {
        return `${match[1]} C.F.R. ${match[2]}`.toUpperCase();
      }
      break;
    }
  }
  
  // Fallback: use normalized text
  return normalizeCitationText(citation).toUpperCase();
}

/**
 * Check if two citations are duplicates
 */
export function areCitationsDuplicate(cit1: Citation, cit2: Citation): boolean {
  // Must be same category
  if (cit1.category !== cit2.category) {
    return false;
  }
  
  // Compare identifiers
  const id1 = extractCitationIdentifier(cit1.text, cit1.category);
  const id2 = extractCitationIdentifier(cit2.text, cit2.category);
  
  return id1 === id2;
}

/**
 * Deduplicate citations and merge page numbers
 */
export function deduplicateCitations(citations: Citation[]): Citation[] {
  const uniqueCitations: Citation[] = [];
  const seenIdentifiers = new Map<string, number>(); // identifier -> index in uniqueCitations
  
  for (const citation of citations) {
    const identifier = extractCitationIdentifier(citation.text, citation.category);
    
    if (seenIdentifiers.has(identifier)) {
      // Merge page numbers into existing citation
      const existingIndex = seenIdentifiers.get(identifier)!;
      const existing = uniqueCitations[existingIndex];
      
      // Add new pages
      const newPages = citation.pages.filter((p) => !existing.pages.includes(p));
      existing.pages.push(...newPages);
      existing.pages.sort((a, b) => a - b);
      
      // Use longer text (more complete citation)
      if (citation.text.length > existing.text.length) {
        existing.text = citation.text;
        existing.normalizedText = citation.normalizedText;
      }
    } else {
      // Add as new citation
      seenIdentifiers.set(identifier, uniqueCitations.length);
      uniqueCitations.push({ ...citation });
    }
  }
  
  return uniqueCitations;
}

/**
 * Try to resolve a short-form citation to its parent
 */
export function resolveShortForm(
  shortFormText: string,
  allCitations: Citation[]
): string | null {
  // Handle "Id." - refers to immediately preceding citation
  if (/^Id\./i.test(shortFormText)) {
    // In a real implementation, would need context about position in document
    // For now, return null (caller should handle based on position)
    return null;
  }
  
  // Handle "Smith, supra" - look for case with that name
  const supraMatch = shortFormText.match(/^([A-Z][A-Za-z]+),\s+supra/i);
  if (supraMatch) {
    const name = supraMatch[1].toLowerCase();
    
    // Find case containing this name
    for (const cit of allCitations) {
      if (cit.category === CitationCategory.Cases && !cit.isShortForm) {
        const caseName = extractCaseName(cit.text);
        if (caseName && caseName.toLowerCase().includes(name)) {
          return cit.id;
        }
      }
    }
  }
  
  // Handle short case citation: "Brown, 347 U.S. at 485"
  const shortCaseMatch = shortFormText.match(/^([A-Z][A-Za-z]+),\s+(\d+)\s+([A-Za-z.0-9]+)\s+at/i);
  if (shortCaseMatch) {
    const name = shortCaseMatch[1].toLowerCase();
    const volume = shortCaseMatch[2];
    const reporter = shortCaseMatch[3];
    
    // Find matching case
    for (const cit of allCitations) {
      if (cit.category === CitationCategory.Cases && !cit.isShortForm) {
        const caseName = extractCaseName(cit.text);
        const caseMatch = cit.text.match(/(\d+)\s+([A-Za-z.0-9]+)\s+(\d+)/);
        
        if (
          caseName &&
          caseName.toLowerCase().includes(name) &&
          caseMatch &&
          caseMatch[1] === volume &&
          caseMatch[2].toLowerCase() === reporter.toLowerCase()
        ) {
          return cit.id;
        }
      }
    }
  }
  
  return null;
}

/**
 * Sort citations alphabetically within category
 */
export function sortCitations(citations: Citation[]): Citation[] {
  return [...citations].sort((a, b) => {
    // For cases, sort by case name
    if (a.category === CitationCategory.Cases && b.category === CitationCategory.Cases) {
      const nameA = extractCaseName(a.text) || a.text;
      const nameB = extractCaseName(b.text) || b.text;
      return nameA.localeCompare(nameB, 'en', { sensitivity: 'base' });
    }
    
    // For others, sort by normalized text
    return a.normalizedText.localeCompare(b.normalizedText, 'en', { sensitivity: 'base' });
  });
}

/**
 * Group citations by category
 */
export function groupByCategory(citations: Citation[]): Map<CitationCategory, Citation[]> {
  const groups = new Map<CitationCategory, Citation[]>();
  
  for (const citation of citations) {
    if (!groups.has(citation.category)) {
      groups.set(citation.category, []);
    }
    groups.get(citation.category)!.push(citation);
  }
  
  // Sort within each group
  for (const [category, cits] of groups.entries()) {
    groups.set(category, sortCitations(cits));
  }
  
  return groups;
}
