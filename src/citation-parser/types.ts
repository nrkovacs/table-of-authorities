/**
 * Type definitions for citation parser
 */

export enum CitationCategory {
  Cases = 'Cases',
  Statutes = 'Statutes',
  Constitutional = 'Constitutional Provisions',
  Rules = 'Rules',
  Regulations = 'Regulations',
  Treatises = 'Treatises',
  Other = 'Other Authorities',
}

export interface Citation {
  /** Unique identifier */
  id: string;
  
  /** Full citation text */
  text: string;
  
  /** Short form text if applicable */
  shortText?: string;
  
  /** Citation category */
  category: CitationCategory;
  
  /** Page numbers where citation appears */
  pages: number[];
  
  /** Whether this is a short-form citation (Id., supra, etc.) */
  isShortForm: boolean;
  
  /** Reference to parent citation if this is a short form */
  parentCitationId?: string;
  
  /** Whether user has included this citation in TOA */
  isIncluded: boolean;
  
  /** Normalized text for deduplication */
  normalizedText: string;
  
  /** Original text as found in document (before normalization) */
  originalText: string;
}

export interface CitationMatch {
  /** The matched text */
  text: string;
  
  /** The category of citation */
  category: CitationCategory;
  
  /** Start position in the document */
  startIndex: number;
  
  /** End position in the document */
  endIndex: number;
  
  /** Page number where found */
  pageNumber: number;
  
  /** Whether this is a short-form citation */
  isShortForm: boolean;
}

export interface ParsedDocument {
  /** All detected citations */
  citations: Citation[];
  
  /** Total number of pages in document */
  totalPages: number;
  
  /** Document text */
  fullText: string;
}

export interface CitationPattern {
  /** Regex pattern */
  pattern: RegExp;
  
  /** Citation category this pattern matches */
  category: CitationCategory;
  
  /** Description of what this pattern matches */
  description: string;
  
  /** Whether matches from this pattern are short forms */
  isShortForm?: boolean;
}

export interface ParserOptions {
  /** Include citations from footnotes */
  includeFootnotes: boolean;
  
  /** Minimum confidence score (0-1) to include citation */
  minConfidence?: number;
  
  /** Custom patterns to add */
  customPatterns?: CitationPattern[];
}

export interface NormalizationResult {
  /** Normalized text */
  normalizedText: string;
  
  /** Whether this is a duplicate of another citation */
  isDuplicate: boolean;
  
  /** ID of the citation this duplicates (if any) */
  duplicateOf?: string;
}
