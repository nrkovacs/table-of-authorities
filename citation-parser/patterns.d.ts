/**
 * Comprehensive regex patterns for legal citation detection
 * Based on Bluebook citation format
 */
import { CitationCategory, CitationPattern } from './types';
/**
 * All citation patterns
 */
export declare const ALL_PATTERNS: CitationPattern[];
/**
 * Get patterns for a specific category
 */
export declare function getPatternsByCategory(category: CitationCategory): CitationPattern[];
/**
 * Common reporter abbreviations for case validation
 */
export declare const REPORTER_ABBREVIATIONS: string[];
/**
 * Check if a string looks like a valid reporter abbreviation
 */
export declare function isValidReporter(reporter: string): boolean;
//# sourceMappingURL=patterns.d.ts.map