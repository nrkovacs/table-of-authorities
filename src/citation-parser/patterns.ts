/**
 * Comprehensive regex patterns for legal citation detection
 * Based on Bluebook citation format
 */

import { CitationCategory, CitationPattern } from './types';

/**
 * CASE CITATIONS
 * Pattern: Party v. Party, Volume Reporter Page (Court Year)
 */
const CASE_PATTERNS: CitationPattern[] = [
  {
    // Standard case citation: Brown v. Board of Education, 347 U.S. 483 (1954)
    pattern: /\b([A-Z][A-Za-z\s&.,'-]+)\s+v\.\s+([A-Z][A-Za-z\s&.,'-]+),\s+(\d+)\s+([A-Z][A-Za-z0-9.]+)\s+(\d+)(?:,\s+(\d+))?\s+\((?:([A-Z][A-Za-z.\s]+)\s+)?(\d{4})\)/gi,
    category: CitationCategory.Cases,
    description: 'Standard case citation',
  },
  {
    // In re / Ex parte cases: In re Marriage of Smith, 123 Cal. App. 4th 456 (2005)
    pattern: /\b(?:In re|Ex parte)\s+([A-Z][A-Za-z\s&.,'-]+),\s+(\d+)\s+([A-Z][A-Za-z0-9.\s]+)\s+(\d+)(?:,\s+(\d+))?\s+\((?:([A-Z][A-Za-z.\s]+)\s+)?(\d{4})\)/gi,
    category: CitationCategory.Cases,
    description: 'In re / Ex parte case citation',
  },
  {
    // Short form case citation: Brown, 347 U.S. at 485
    pattern: /\b([A-Z][A-Za-z]+),\s+(\d+)\s+([A-Z][A-Za-z0-9.]+)\s+at\s+(\d+)/gi,
    category: CitationCategory.Cases,
    description: 'Short form case citation',
  },
  {
    // Id. citation (reference to immediately preceding citation)
    pattern: /\bId\.\s*(?:at\s+(\d+))?/gi,
    category: CitationCategory.Cases,
    description: 'Id. citation',
    isShortForm: true,
  },
];

/**
 * STATUTE CITATIONS
 */
const STATUTE_PATTERNS: CitationPattern[] = [
  {
    // Federal statute: 42 U.S.C. § 1983
    pattern: /\b(\d+)\s+U\.?S\.?C\.?\s+§+\s*([\d\w\-]+(?:\([a-z0-9]+\))?(?:\s*-\s*[\d\w]+)?)/gi,
    category: CitationCategory.Statutes,
    description: 'Federal statute (U.S.C.)',
  },
  {
    // California Code: Cal. Civ. Code § 1542
    pattern: /\bCal\.\s+([A-Z][A-Za-z.]+)\s+Code\s+§\s*([\d\w\-]+(?:\([a-z0-9]+\)?)?)/gi,
    category: CitationCategory.Statutes,
    description: 'California statute',
  },
  {
    // New York statute: N.Y. Gen. Bus. Law § 349
    pattern: /\bN\.Y\.\s+([A-Z][A-Za-z.\s]+)\s+(?:Law\s+)?§\s*([\d\w\-]+(?:\([a-z0-9]+\)?)?)/gi,
    category: CitationCategory.Statutes,
    description: 'New York statute',
  },
  {
    // Texas statute: Tex. Fam. Code Ann. § 6.001
    pattern: /\bTex\.\s+([A-Z][A-Za-z.]+)\s+Code\s+Ann\.\s+§\s*([\d\w\-\.]+(?:\([a-z0-9]+\)?)?)/gi,
    category: CitationCategory.Statutes,
    description: 'Texas statute',
  },
  {
    // Florida statute: Fla. Stat. § 768.28
    pattern: /\bFla\.\s+Stat\.\s+§\s*([\d\w\-\.]+(?:\([a-z0-9]+\)?)?)/gi,
    category: CitationCategory.Statutes,
    description: 'Florida statute',
  },
  {
    // Illinois statute: 735 ILCS 5/2-1401
    pattern: /\b(\d+)\s+ILCS\s+([\d\w\/\-]+)/gi,
    category: CitationCategory.Statutes,
    description: 'Illinois statute',
  },
  {
    // Generic state statute pattern: [State] [Code] § [Number]
    pattern: /\b([A-Z][A-Za-z.]+)\s+([A-Z][A-Za-z.\s]+)\s+(?:Code\s+)?§\s*([\d\w\-\.]+(?:\([a-z0-9]+\)?)?)/gi,
    category: CitationCategory.Statutes,
    description: 'Generic state statute',
  },
];

/**
 * CONSTITUTIONAL PROVISIONS
 */
const CONSTITUTIONAL_PATTERNS: CitationPattern[] = [
  {
    // U.S. Constitution - Article: U.S. Const. art. I, § 8
    pattern: /\bU\.?S\.?\s+Const\.\s+art\.\s+([IVXLCDM]+)(?:,\s+§\s*(\d+))?/gi,
    category: CitationCategory.Constitutional,
    description: 'U.S. Constitution article',
  },
  {
    // U.S. Constitution - Amendment: U.S. Const. amend. XIV, § 1
    pattern: /\bU\.?S\.?\s+Const\.\s+amend\.\s+([IVXLCDM]+)(?:,\s+§\s*(\d+))?/gi,
    category: CitationCategory.Constitutional,
    description: 'U.S. Constitution amendment',
  },
  {
    // State constitution: Cal. Const. art. I, § 7
    pattern: /\b([A-Z][A-Za-z.]+)\s+Const\.\s+art\.\s+([IVXLCDM]+)(?:,\s+§\s*(\d+))?/gi,
    category: CitationCategory.Constitutional,
    description: 'State constitution',
  },
];

/**
 * RULES CITATIONS
 */
const RULES_PATTERNS: CitationPattern[] = [
  {
    // Federal Rules of Civil Procedure: Fed. R. Civ. P. 12(b)(6)
    pattern: /\bFed\.\s+R\.\s+Civ\.\s+P\.\s+([\d]+(?:\([a-z0-9]+\))*)/gi,
    category: CitationCategory.Rules,
    description: 'Federal Rules of Civil Procedure',
  },
  {
    // Federal Rules of Evidence: Fed. R. Evid. 702
    pattern: /\bFed\.\s+R\.\s+Evid\.\s+([\d]+(?:\([a-z0-9]+\)?)*)/gi,
    category: CitationCategory.Rules,
    description: 'Federal Rules of Evidence',
  },
  {
    // Federal Rules of Appellate Procedure: Fed. R. App. P. 4
    pattern: /\bFed\.\s+R\.\s+App\.\s+P\.\s+([\d]+(?:\([a-z0-9]+\)?)*)/gi,
    category: CitationCategory.Rules,
    description: 'Federal Rules of Appellate Procedure',
  },
  {
    // Federal Rules of Criminal Procedure: Fed. R. Crim. P. 11
    pattern: /\bFed\.\s+R\.\s+Crim\.\s+P\.\s+([\d]+(?:\([a-z0-9]+\)?)*)/gi,
    category: CitationCategory.Rules,
    description: 'Federal Rules of Criminal Procedure',
  },
  {
    // California Rules of Court: Cal. Rules of Court, rule 8.204
    pattern: /\bCal\.\s+Rules?\s+of\s+Court,?\s+rule\s+([\d\.]+(?:\([a-z0-9]+\)?)*)/gi,
    category: CitationCategory.Rules,
    description: 'California Rules of Court',
  },
  {
    // State rules (generic): [State] R. Civ. P. [Number]
    pattern: /\b([A-Z][A-Za-z.]+)\s+R\.\s+([A-Za-z.]+)\s+P\.\s+([\d]+(?:\([a-z0-9]+\)?)*)/gi,
    category: CitationCategory.Rules,
    description: 'State rules',
  },
];

/**
 * REGULATIONS CITATIONS
 */
const REGULATIONS_PATTERNS: CitationPattern[] = [
  {
    // Code of Federal Regulations: 28 C.F.R. § 35.130
    pattern: /\b(\d+)\s+C\.F\.R\.\s+§\s*([\d\w\-\.]+(?:\([a-z0-9]+\)?)?)/gi,
    category: CitationCategory.Regulations,
    description: 'Code of Federal Regulations',
  },
  {
    // Federal Register: 85 Fed. Reg. 12345 (Mar. 1, 2020)
    pattern: /\b(\d+)\s+Fed\.\s+Reg\.\s+(\d+)\s+\(([A-Za-z.]+\s+\d+,\s+\d{4})\)/gi,
    category: CitationCategory.Regulations,
    description: 'Federal Register',
  },
];

/**
 * TREATISES & SECONDARY SOURCES
 */
const TREATISES_PATTERNS: CitationPattern[] = [
  {
    // Treatise: 5 Wright & Miller, Federal Practice and Procedure § 1357 (3d ed. 2004)
    pattern: /\b(\d+)\s+([A-Z][A-Za-z\s&]+),\s+([A-Za-z\s&]+)\s+§\s*([\d\.]+)\s+\((\d+(?:st|nd|rd|th)\s+ed\.\s+\d{4})\)/gi,
    category: CitationCategory.Treatises,
    description: 'Treatise with edition',
  },
  {
    // Law review article: Jane Doe, Legal Theory, 100 Harv. L. Rev. 123 (2020)
    pattern: /\b([A-Z][A-Za-z\s.]+),\s+([A-Za-z\s:]+),\s+(\d+)\s+([A-Z][A-Za-z.\s]+)\s+L\.\s+Rev\.\s+(\d+)\s+\((\d{4})\)/gi,
    category: CitationCategory.Treatises,
    description: 'Law review article',
  },
  {
    // Restatement: Restatement (Second) of Torts § 402A
    pattern: /\bRestatement\s+\(([A-Za-z]+)\)\s+of\s+([A-Za-z\s]+)\s+§\s*([\d\w]+)/gi,
    category: CitationCategory.Treatises,
    description: 'Restatement',
  },
  {
    // Witkin (California): 1 Witkin, Summary of Cal. Law § 123 (10th ed. 2005)
    pattern: /\b(\d+)\s+Witkin,\s+([A-Za-z\s.]+)\s+§\s*([\d]+)\s+\((\d+(?:st|nd|rd|th)\s+ed\.\s+\d{4})\)/gi,
    category: CitationCategory.Treatises,
    description: 'Witkin treatise',
  },
];

/**
 * SUPRA CITATIONS (short form references)
 */
const SUPRA_PATTERNS: CitationPattern[] = [
  {
    // Supra citation: Smith, supra, at 123
    pattern: /\b([A-Z][A-Za-z]+),\s+supra(?:,\s+(?:note\s+\d+,\s+)?at\s+(\d+))?/gi,
    category: CitationCategory.Cases, // Default to cases, will be adjusted based on context
    description: 'Supra citation',
    isShortForm: true,
  },
];

/**
 * All citation patterns
 */
export const ALL_PATTERNS: CitationPattern[] = [
  ...CASE_PATTERNS,
  ...STATUTE_PATTERNS,
  ...CONSTITUTIONAL_PATTERNS,
  ...RULES_PATTERNS,
  ...REGULATIONS_PATTERNS,
  ...TREATISES_PATTERNS,
  ...SUPRA_PATTERNS,
];

/**
 * Get patterns for a specific category
 */
export function getPatternsByCategory(category: CitationCategory): CitationPattern[] {
  return ALL_PATTERNS.filter((p) => p.category === category);
}

/**
 * Common reporter abbreviations for case validation
 */
export const REPORTER_ABBREVIATIONS = [
  'U.S.', 'S.Ct.', 'L.Ed.', 'F.', 'F.2d', 'F.3d', 'F.4th', 
  'F.Supp.', 'F.Supp.2d', 'F.Supp.3d',
  'Cal.', 'Cal.2d', 'Cal.3d', 'Cal.4th', 'Cal.5th',
  'Cal.App.', 'Cal.App.2d', 'Cal.App.3d', 'Cal.App.4th', 'Cal.App.5th',
  'N.Y.', 'N.Y.2d', 'N.Y.3d', 'N.E.', 'N.E.2d', 'N.E.3d',
  'P.', 'P.2d', 'P.3d', 'A.', 'A.2d', 'A.3d',
  'S.W.', 'S.W.2d', 'S.W.3d', 'S.E.', 'S.E.2d',
  'So.', 'So.2d', 'So.3d', 'N.W.', 'N.W.2d',
];

/**
 * Check if a string looks like a valid reporter abbreviation
 */
export function isValidReporter(reporter: string): boolean {
  const normalized = reporter.trim().replace(/\s+/g, '');
  return REPORTER_ABBREVIATIONS.some((r) => r.replace(/\./g, '') === normalized.replace(/\./g, ''));
}
