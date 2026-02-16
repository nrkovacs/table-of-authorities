/**
 * TOA formatting utilities
 */

import { Citation, CitationCategory } from '../citation-parser/types';
import { CATEGORY_ORDER, getCategoryDisplayName } from '../citation-parser/categories';

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

const DEFAULT_OPTIONS: TOAFormatOptions = {
  passimThreshold: 6,
  maxLineLength: 80,
  includePageCounts: false,
  useDotLeaders: true,
  wrapIndent: '  ',
};

/**
 * Format page numbers for a citation
 */
export function formatPageNumbers(pages: number[], options: TOAFormatOptions): string {
  const sortedPages = [...new Set(pages)].sort((a, b) => a - b);
  
  // Check for passim
  if (sortedPages.length >= options.passimThreshold) {
    // Show first few pages, then "passim"
    const displayPages = sortedPages.slice(0, options.passimThreshold);
    return `${displayPages.join(', ')}, passim`;
  }
  
  return sortedPages.join(', ');
}

/**
 * Create dot leader between text and page numbers
 */
export function createDotLeader(
  citationText: string,
  pageNumbers: string,
  maxLength: number
): string {
  const totalTextLength = citationText.length + pageNumbers.length;
  
  if (totalTextLength >= maxLength - 3) {
    // Too long for one line, wrap
    return ` ............. ${pageNumbers}`;
  }
  
  const dotsNeeded = maxLength - totalTextLength - 2;
  const dots = '.'.repeat(Math.max(1, dotsNeeded));
  
  return ` ${dots} ${pageNumbers}`;
}

/**
 * Format a single citation line
 */
export function formatCitationLine(
  citation: Citation,
  options: TOAFormatOptions
): string {
  const pageNumbers = formatPageNumbers(citation.pages, options);
  
  if (options.useDotLeaders) {
    const leader = createDotLeader(citation.text, pageNumbers, options.maxLineLength);
    return `${citation.text}${leader}`;
  }
  
  return `${citation.text} ${pageNumbers}`;
}

/**
 * Format case name with italics (using Word formatting markup)
 */
export function formatCaseName(citationText: string): string {
  // Extract case name for italicizing
  // Pattern: "Party v. Party" or "In re Party"
  
  const vPattern = /^([A-Z][A-Za-z\s&.'-]+\s+v\.\s+[A-Z][A-Za-z\s&.'-]+?)(?=,\s*\d|\s+\d)/;
  const inRePattern = /^((?:In re|Ex parte)\s+[A-Z][A-Za-z\s&.'-]+?)(?=,\s*\d|\s+\d)/;
  
  let match = citationText.match(vPattern);
  if (!match) {
    match = citationText.match(inRePattern);
  }
  
  if (match) {
    const caseName = match[1];
    // Return with italic markers (to be applied in Word)
    return citationText.replace(caseName, `_${caseName}_`);
  }
  
  return citationText;
}

/**
 * Format a category section
 */
export function formatCategorySection(
  category: CitationCategory,
  citations: Citation[],
  options: TOAFormatOptions
): string {
  const lines: string[] = [];
  
  // Category header
  lines.push('');
  lines.push(getCategoryDisplayName(category));
  lines.push('');
  
  // Add "Page(s)" subheader for better formatting
  if (citations.length > 0) {
    const pageLabel = options.includePageCounts ? 'Page(s)' : '';
    if (pageLabel) {
      lines.push(`${' '.repeat(60)}${pageLabel}`);
      lines.push('');
    }
  }
  
  // Format each citation
  for (const citation of citations) {
    let text = citation.text;
    
    // Italicize case names
    if (category === CitationCategory.Cases) {
      text = formatCaseName(text);
    }
    
    const formatted = formatCitationLine(
      { ...citation, text },
      options
    );
    
    lines.push(formatted);
  }
  
  return lines.join('\n');
}

/**
 * Generate complete Table of Authorities text
 */
export function generateTOA(
  citationsByCategory: Map<CitationCategory, Citation[]>,
  options: Partial<TOAFormatOptions> = {}
): string {
  const opts: TOAFormatOptions = { ...DEFAULT_OPTIONS, ...options };
  const sections: string[] = [];
  
  // Title
  sections.push('TABLE OF AUTHORITIES');
  sections.push('');
  
  // Format each category in standard order
  for (const category of CATEGORY_ORDER) {
    const citations = citationsByCategory.get(category);
    if (citations && citations.length > 0) {
      sections.push(formatCategorySection(category, citations, opts));
    }
  }
  
  return sections.join('\n');
}

/**
 * Convert formatted text to Word OOXML for proper formatting
 * This handles italics, tabs, and other Word-specific formatting
 */
export function toWordOOXML(formattedText: string): string {
  const lines = formattedText.split('\n');
  let ooxml = '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">';
  ooxml += '<w:body>';
  
  for (const line of lines) {
    ooxml += '<w:p>';
    
    if (line.trim() === 'TABLE OF AUTHORITIES') {
      // Title: centered, bold, larger font
      ooxml += '<w:pPr><w:jc w:val="center"/></w:pPr>';
      ooxml += '<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr>';
      ooxml += `<w:t>${line}</w:t></w:r>`;
    } else if (line.trim() && line.trim() === line.trim().toUpperCase() && line.trim().length > 3) {
      // Category header: bold, all caps
      ooxml += '<w:r><w:rPr><w:b/></w:rPr>';
      ooxml += `<w:t>${line}</w:t></w:r>`;
    } else if (line.includes('_')) {
      // Line with italics (case names)
      const parts = line.split('_');
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
          // Normal text
          ooxml += `<w:r><w:t xml:space="preserve">${escapeXml(parts[i])}</w:t></w:r>`;
        } else {
          // Italic text
          ooxml += '<w:r><w:rPr><w:i/></w:rPr>';
          ooxml += `<w:t xml:space="preserve">${escapeXml(parts[i])}</w:t></w:r>`;
        }
      }
    } else {
      // Regular line
      ooxml += `<w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r>`;
    }
    
    ooxml += '</w:p>';
  }
  
  ooxml += '</w:body>';
  ooxml += '</w:document>';
  
  return ooxml;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
