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
export declare function getCategoryCode(category: string): number;
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
export declare function stripCasePinCite(raw: string): {
    longCite: string;
    shortCite: string;
};
/**
 * Strip pin cite from a statute citation.
 * Statutes don't have pin cites in the same way, but we still
 * normalize for consistent TA field generation.
 *
 * "42 U.S.C. § 1983(a)(1)" → long: "42 U.S.C. § 1983", short: "42 U.S.C. § 1983"
 */
export declare function stripStatutePinCite(raw: string): {
    longCite: string;
    shortCite: string;
};
/**
 * Generic: strip pin cite based on category.
 */
export declare function stripPinCite(raw: string, category: CitationCategory): StrippedCitation;
/**
 * Escape double quotes for TA field syntax.
 * TA \l "some \"quoted\" text" would break the field — we must escape.
 */
export declare function escapeFieldQuotes(text: string): string;
/**
 * Build the TA field code string.
 *
 * @param longCite  — goes in \l "..."
 * @param shortCite — goes in \s "..."
 * @param categoryCode — goes in \c N
 * @returns field code like: TA \l "Long Cite" \s "Short" \c 1
 */
export declare function buildTAFieldCode(longCite: string, shortCite: string, categoryCode: number): string;
/**
 * Build an Id.-only TA field code (only \s switch, for grouping).
 */
export declare function buildIdTAFieldCode(shortCite: string, categoryCode: number): string;
/**
 * Build a TOA field code for a category.
 *
 * @param categoryCode — \c N
 * @param usePassim — whether to add \p switch
 * @returns field code like: TOA \c 1 \p
 */
export declare function buildTOAFieldCode(categoryCode: number, usePassim?: boolean): string;
//# sourceMappingURL=pincite-stripper.d.ts.map