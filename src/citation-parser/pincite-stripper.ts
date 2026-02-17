/**
 * Pin Cite Stripper — extracts Long Citation and Short Citation from raw text.
 *
 * Long Citation:  the full citation as it should appear in the TOA
 *                 (party names, volume, reporter, first page, year)
 * Short Citation: abbreviated form used for \s switch grouping
 *                 (typically party name or first-party shorthand)
 *
 * Pin cites (", at 485", ", 232") are stripped from the Long form
 * so that Word's TOA groups all references to the same authority.
 */

import { CitationCategory } from './types';

export interface StrippedCitation {
  /** Full citation without pin cite — used for TA \l switch */
  longCite: string;
  /** Abbreviated citation — used for TA \s switch */
  shortCite: string;
  /** Category code 1-7 for TA \c switch */
  categoryCode: number;
}

/** Map our enum categories to Word's TA \c codes (1–16) */
const CATEGORY_CODES: Record<string, number> = {
  [CitationCategory.Cases]: 1,
  [CitationCategory.Statutes]: 2,
  [CitationCategory.Other]: 3,
  [CitationCategory.Rules]: 4,
  [CitationCategory.Regulations]: 5,
  [CitationCategory.Constitutional]: 6,
  [CitationCategory.Treatises]: 7,
};

export function getCategoryCode(category: string): number {
  return CATEGORY_CODES[category] ?? 3;
}

/**
 * Strip pin cite from a case citation.
 *
 * "Illinois v. Gates, 462 U.S. 213, 232 (1983)"
 *  → long:  "Illinois v. Gates, 462 U.S. 213 (1983)"
 *  → short: "Gates"
 *
 * "Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007)"
 *  → long:  "Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007)"
 *  → short: "Twombly"
 */
export function stripCasePinCite(raw: string): { longCite: string; shortCite: string } {
  let longCite = raw.trim();

  // Remove signal words from the beginning
  longCite = longCite.replace(/^(?:See\s+(?:also\s+)?|Cf\.\s+|Accord\s+|But\s+see\s+)/i, '').trim();

  // Strip pin cite: ", 232" or ", at 232" before the parenthetical year
  // Pattern: (first page)(, pin cite(s))( (year))
  longCite = longCite.replace(
    /(\d+)\s*(?:,\s*\d+(?:\s*[-–]\s*\d+)?)+(\s*\([^)]*\))/,
    '$1$2'
  );

  // Also handle "at" pin cites: "462 U.S. 213, at 232 (1983)"
  longCite = longCite.replace(
    /(\d+)\s*,\s*at\s+\d+(?:\s*[-–]\s*\d+)?(\s*\([^)]*\))/,
    '$1$2'
  );

  // Extract short cite (respondent/second party name)
  let shortCite = '';
  // Match "Party v. Party" — party names can be multi-word with periods, commas, etc.
  const vMatch = raw.match(/([A-Z][A-Za-z.,' -]+?)\s+v\.\s+([A-Z][A-Za-z.,' -]+?)(?:,\s*\d|\s+\d)/);
  if (vMatch) {
    // Use the respondent's last meaningful word as short cite
    const respondent = vMatch[2].trim();
    // Extract last capitalized word (e.g., "Bell Atlantic Corp." → take last word before period)
    const words = respondent.split(/\s+/).filter(w => /^[A-Z]/.test(w) && !/^(?:Corp|Inc|Ltd|LLC|Co|v)\.?$/i.test(w));
    shortCite = words.length > 0 ? words[words.length - 1].replace(/[.,]$/, '') : respondent.split(/\s+/)[0];
  }

  // Handle "In re" / "Ex parte"
  if (!shortCite) {
    const inReMatch = raw.match(/(?:In re|Ex parte)\s+([A-Z][A-Za-z'-]+)/i);
    if (inReMatch) {
      shortCite = inReMatch[0].trim();
    }
  }

  if (!shortCite) {
    // Fallback: use first capitalized word
    const firstWord = longCite.match(/^([A-Z][A-Za-z'-]+)/);
    shortCite = firstWord ? firstWord[1] : longCite.substring(0, 30);
  }

  return { longCite, shortCite };
}

/**
 * Strip pin cite from a statute citation.
 * Statutes don't have pin cites in the same way, but we still
 * normalize for consistent TA field generation.
 *
 * "42 U.S.C. § 1983(a)(1)" → long: "42 U.S.C. § 1983", short: "42 U.S.C. § 1983"
 */
export function stripStatutePinCite(raw: string): { longCite: string; shortCite: string } {
  let longCite = raw.trim();
  // Remove subsection references for grouping: § 1983(a)(1) → § 1983
  longCite = longCite.replace(/(§\s*[\d\w.-]+)\([^)]*\)(?:\([^)]*\))*/g, '$1');
  return { longCite, shortCite: longCite };
}

/**
 * Generic: strip pin cite based on category.
 */
export function stripPinCite(raw: string, category: CitationCategory): StrippedCitation {
  const catCode = getCategoryCode(category);

  switch (category) {
    case CitationCategory.Cases: {
      const { longCite, shortCite } = stripCasePinCite(raw);
      return { longCite, shortCite, categoryCode: catCode };
    }
    case CitationCategory.Statutes: {
      const { longCite, shortCite } = stripStatutePinCite(raw);
      return { longCite, shortCite, categoryCode: catCode };
    }
    default: {
      // For rules, regs, constitutional, treatises — use as-is
      const cleaned = raw.replace(/^(?:See\s+(?:also\s+)?|Cf\.\s+)/i, '').trim();
      return { longCite: cleaned, shortCite: cleaned, categoryCode: catCode };
    }
  }
}

/**
 * Escape double quotes for TA field syntax.
 * TA \l "some \"quoted\" text" would break the field — we must escape.
 */
export function escapeFieldQuotes(text: string): string {
  // Replace " with Unicode right double quotation mark (safe in fields)
  return text.replace(/"/g, '\u201D');
}

/**
 * Build the TA field code string.
 *
 * @param longCite  — goes in \l "..."
 * @param shortCite — goes in \s "..."
 * @param categoryCode — goes in \c N
 * @returns field code like: TA \l "Long Cite" \s "Short" \c 1
 */
export function buildTAFieldCode(longCite: string, shortCite: string, categoryCode: number): string {
  const l = escapeFieldQuotes(longCite);
  const s = escapeFieldQuotes(shortCite);
  return `TA \\l "${l}" \\s "${s}" \\c ${categoryCode}`;
}

/**
 * Build an Id.-only TA field code (only \s switch, for grouping).
 */
export function buildIdTAFieldCode(shortCite: string, categoryCode: number): string {
  const s = escapeFieldQuotes(shortCite);
  return `TA \\s "${s}" \\c ${categoryCode}`;
}

/**
 * Build a TOA field code for a category.
 *
 * @param categoryCode — \c N
 * @param usePassim — whether to add \p switch
 * @returns field code like: TOA \c 1 \p
 */
export function buildTOAFieldCode(categoryCode: number, usePassim: boolean = true): string {
  let code = `TOA \\c ${categoryCode}`;
  if (usePassim) code += ' \\p';
  // Add \e " " for tab leader (Section 508 accessible dot leaders)
  code += ' \\e "  "';
  return code;
}
