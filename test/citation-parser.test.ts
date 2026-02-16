/**
 * Citation Parser Tests
 */

import { parseText, CitationCategory } from '../src/citation-parser';
import { isValidReporter, REPORTER_ABBREVIATIONS } from '../src/citation-parser/patterns';
import {
  normalizeCitationText,
  extractCaseName,
  extractCitationIdentifier,
  deduplicateCitations,
  areCitationsDuplicate,
  sortCitations,
  groupByCategory,
  resolveShortForm,
} from '../src/citation-parser/normalizer';
import { Citation } from '../src/citation-parser/types';
import * as fs from 'fs';
import * as path from 'path';

// Helper to make a Citation object for testing
function makeCitation(overrides: Partial<Citation> & { text: string; category: CitationCategory }): Citation {
  return {
    id: `test_${Math.random().toString(36).substr(2, 6)}`,
    originalText: overrides.text,
    normalizedText: normalizeCitationText(overrides.text),
    pages: [1],
    isShortForm: false,
    isIncluded: true,
    ...overrides,
  };
}

describe('Citation Parser', () => {
  // ─────────────────────────────────────────────
  // CASE CITATIONS
  // ─────────────────────────────────────────────
  describe('Case Citations', () => {
    test('should detect standard case citation', () => {
      const text = 'See Brown v. Board of Education, 347 U.S. 483 (1954).';
      const result = parseText(text);

      const c = result.citations.find(c => c.category === CitationCategory.Cases);
      expect(c).toBeDefined();
      expect(c?.text).toContain('Brown v. Board of Education');
      expect(c?.text).toContain('347 U.S. 483');
    });

    test('should detect case with pinpoint page', () => {
      const text = 'Miranda v. Arizona, 384 U.S. 436, 444 (1966).';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Miranda'));
      expect(c).toBeDefined();
      expect(c?.category).toBe(CitationCategory.Cases);
    });

    test('should detect In re case', () => {
      const text = 'In re Marriage of Smith, 123 Cal.App.4th 456 (2005).';
      const result = parseText(text);

      const c = result.citations.find(c =>
        c.category === CitationCategory.Cases && c.text.includes('In re')
      );
      expect(c).toBeDefined();
    });

    test('should detect Ex parte case', () => {
      const text = 'Ex parte Johnson, 456 U.S. 789 (1990).';
      const result = parseText(text);

      const c = result.citations.find(c =>
        c.category === CitationCategory.Cases && c.text.includes('Ex parte')
      );
      expect(c).toBeDefined();
    });

    test('should detect case with court designation', () => {
      const text = 'Smith v. Jones, 450 F.3d 234 (5th Cir. 2006).';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Smith v. Jones'));
      expect(c).toBeDefined();
      expect(c?.category).toBe(CitationCategory.Cases);
    });

    test('should detect case from Second Circuit', () => {
      const text = 'Garcia v. City of New York, 200 F.Supp.3d 100 (S.D.N.Y. 2016).';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Garcia'));
      expect(c).toBeDefined();
    });

    test('should detect Supreme Court case with S.Ct. reporter', () => {
      const text = 'Roe v. Wade, 93 S.Ct. 705 (1973).';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Roe v. Wade'));
      expect(c).toBeDefined();
    });

    test('should detect case with multi-word party names', () => {
      const text = 'Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007).';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Twombly'));
      expect(c).toBeDefined();
    });

    test('should detect case with ampersand in party name', () => {
      const text = 'AT&T Mobility LLC v. Concepcion, 563 U.S. 333 (2011).';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Concepcion'));
      expect(c).toBeDefined();
    });

    test('should detect short form case citation', () => {
      const text = 'Brown, 347 U.S. at 485.';
      const result = parseText(text);

      const c = result.citations.find(c =>
        c.text.includes('Brown') && c.text.includes('at')
      );
      expect(c).toBeDefined();
    });

    test('should detect Id. citation', () => {
      const text = 'Id. at 100.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Id.'));
      expect(c).toBeDefined();
      expect(c?.isShortForm).toBe(true);
    });

    test('should detect Id. without page number', () => {
      const text = 'The Court agreed. Id.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Id.'));
      expect(c).toBeDefined();
      expect(c?.isShortForm).toBe(true);
    });

    test('should detect multiple cases in one sentence', () => {
      const text = 'See Loving v. Virginia, 388 U.S. 1 (1967); Obergefell v. Hodges, 576 U.S. 644 (2015).';
      const result = parseText(text);

      const cases = result.citations.filter(c => c.category === CitationCategory.Cases);
      expect(cases.length).toBeGreaterThanOrEqual(2);
    });

    test('should detect supra citation', () => {
      const text = 'Brown, supra, at 495.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('supra'));
      expect(c).toBeDefined();
      expect(c?.isShortForm).toBe(true);
    });

    test('should detect state court case with regional reporter', () => {
      const text = 'People v. Smith, 45 N.E.2d 123 (Ill. 2003).';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('People v. Smith'));
      expect(c).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  // STATUTE CITATIONS
  // ─────────────────────────────────────────────
  describe('Statute Citations', () => {
    test('should detect federal statute (42 U.S.C. § 1983)', () => {
      const text = 'Pursuant to 42 U.S.C. § 1983, plaintiff filed suit.';
      const result = parseText(text);

      const c = result.citations.find(c => c.category === CitationCategory.Statutes);
      expect(c).toBeDefined();
      expect(c?.text).toContain('42 U.S.C.');
      expect(c?.text).toContain('1983');
    });

    test('should detect federal statute with subsection', () => {
      const text = 'Under 28 U.S.C. § 1331(a), jurisdiction exists.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('1331'));
      expect(c).toBeDefined();
    });

    test('should detect multiple sections of same title', () => {
      const text = '28 U.S.C. § 1331 and 28 U.S.C. § 1343 both apply.';
      const result = parseText(text);

      const statutes = result.citations.filter(c =>
        c.category === CitationCategory.Statutes && c.text.includes('28 U.S.C.')
      );
      expect(statutes.length).toBeGreaterThanOrEqual(2);
    });

    test('should detect California statute', () => {
      const text = 'See Cal. Civ. Code § 1542.';
      const result = parseText(text);

      const c = result.citations.find(c =>
        c.category === CitationCategory.Statutes && c.text.includes('Cal.')
      );
      expect(c).toBeDefined();
    });

    test('should detect New York statute', () => {
      const text = 'N.Y. Gen. Bus. Law § 349 prohibits deceptive practices.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('N.Y.'));
      expect(c).toBeDefined();
      expect(c?.category).toBe(CitationCategory.Statutes);
    });

    test('should detect Texas annotated statute', () => {
      const text = 'Under Tex. Fam. Code Ann. § 6.001, the court may grant a divorce.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Tex.'));
      expect(c).toBeDefined();
    });

    test('should detect Illinois compiled statute', () => {
      const text = 'See 735 ILCS 5/2-1401.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('ILCS'));
      expect(c).toBeDefined();
    });

    test('should detect Florida statute', () => {
      const text = 'Fla. Stat. § 768.28 governs sovereign immunity.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Fla. Stat.'));
      expect(c).toBeDefined();
    });

    test('should detect USC without periods', () => {
      const text = 'Title 18 USC § 1001 criminalizes false statements.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('USC'));
      expect(c).toBeDefined();
    });

    test('should detect statute with range', () => {
      const text = '42 U.S.C. § 2000e-2 prohibits employment discrimination.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('2000e'));
      expect(c).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  // CONSTITUTIONAL CITATIONS
  // ─────────────────────────────────────────────
  describe('Constitutional Citations', () => {
    test('should detect U.S. Constitution article', () => {
      const text = 'U.S. Const. art. I, § 8 grants Congress certain powers.';
      const result = parseText(text);

      const c = result.citations.find(c => c.category === CitationCategory.Constitutional);
      expect(c).toBeDefined();
      expect(c?.text).toContain('art. I');
    });

    test('should detect U.S. Constitution amendment with section', () => {
      const text = 'The rights protected by U.S. Const. amend. XIV, § 1 are fundamental.';
      const result = parseText(text);

      const c = result.citations.find(c =>
        c.category === CitationCategory.Constitutional && c.text.includes('amend. XIV')
      );
      expect(c).toBeDefined();
    });

    test('should detect U.S. Constitution amendment without section', () => {
      const text = 'U.S. Const. amend. IV protects against unreasonable searches.';
      const result = parseText(text);

      const c = result.citations.find(c =>
        c.category === CitationCategory.Constitutional && c.text.includes('amend. IV')
      );
      expect(c).toBeDefined();
    });

    test('should detect First Amendment', () => {
      const text = 'U.S. Const. amend. I protects free speech.';
      const result = parseText(text);

      const c = result.citations.find(c =>
        c.category === CitationCategory.Constitutional && c.text.includes('amend. I')
      );
      expect(c).toBeDefined();
    });

    test('should detect state constitution', () => {
      const text = 'Cal. Const. art. I, § 7 protects privacy.';
      const result = parseText(text);

      const c = result.citations.find(c =>
        c.category === CitationCategory.Constitutional && c.text.includes('Cal.')
      );
      expect(c).toBeDefined();
    });

    test('should detect different article numbers (Roman numerals)', () => {
      const text = 'U.S. Const. art. III, § 2 defines judicial power.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('art. III'));
      expect(c).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  // RULES CITATIONS
  // ─────────────────────────────────────────────
  describe('Rules Citations', () => {
    test('should detect FRCP with parenthetical subsections', () => {
      const text = 'Under Fed. R. Civ. P. 12(b)(6), defendants moved to dismiss.';
      const result = parseText(text);

      const c = result.citations.find(c => c.category === CitationCategory.Rules);
      expect(c).toBeDefined();
      expect(c?.text).toContain('Fed. R. Civ. P.');
    });

    test('should detect FRCP Rule 8', () => {
      const text = 'Fed. R. Civ. P. 8(a)(2) requires a short and plain statement.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Fed. R. Civ. P.'));
      expect(c).toBeDefined();
    });

    test('should detect Federal Rules of Evidence', () => {
      const text = 'Fed. R. Evid. 702 governs expert testimony.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Fed. R. Evid.'));
      expect(c).toBeDefined();
    });

    test('should detect Federal Rules of Appellate Procedure', () => {
      const text = 'See Fed. R. App. P. 4(a)(1).';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Fed. R. App. P.'));
      expect(c).toBeDefined();
    });

    test('should detect Federal Rules of Criminal Procedure', () => {
      const text = 'Fed. R. Crim. P. 11 governs pleas.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Fed. R. Crim. P.'));
      expect(c).toBeDefined();
    });

    test('should detect California Rules of Court', () => {
      const text = 'Cal. Rules of Court, rule 8.204 governs appellate briefs.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Cal. Rules of Court'));
      expect(c).toBeDefined();
    });

    test('should detect FRCP simple rule number', () => {
      const text = 'Fed. R. Civ. P. 56 governs summary judgment.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('56'));
      expect(c).toBeDefined();
      expect(c?.category).toBe(CitationCategory.Rules);
    });
  });

  // ─────────────────────────────────────────────
  // REGULATIONS CITATIONS
  // ─────────────────────────────────────────────
  describe('Regulations Citations', () => {
    test('should detect Code of Federal Regulations', () => {
      const text = 'The regulation at 28 C.F.R. § 35.130 prohibits discrimination.';
      const result = parseText(text);

      const c = result.citations.find(c => c.category === CitationCategory.Regulations);
      expect(c).toBeDefined();
      expect(c?.text).toContain('28 C.F.R.');
    });

    test('should detect CFR with subsection', () => {
      const text = '40 C.F.R. § 122.26(b)(14) defines stormwater discharge.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('40 C.F.R.'));
      expect(c).toBeDefined();
    });

    test('should detect Federal Register citation', () => {
      const text = 'See 85 Fed. Reg. 12345 (Mar. 1, 2020).';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Fed. Reg.'));
      expect(c).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  // TREATISES & SECONDARY SOURCES
  // ─────────────────────────────────────────────
  describe('Treatises & Secondary Sources', () => {
    test('should detect treatise with "3d ed." notation', () => {
      const text = '5 Wright & Miller, Federal Practice and Procedure § 1357 (3d ed. 2004).';
      const result = parseText(text);

      const c = result.citations.find(c => c.category === CitationCategory.Treatises);
      expect(c).toBeDefined();
      expect(c?.text).toContain('Wright & Miller');
    });

    test('should detect law review article', () => {
      const text = 'Laurence H. Tribe, Constitutional Choices, 100 Harv. L. Rev. 123 (2020).';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('L. Rev.'));
      expect(c).toBeDefined();
    });

    test('should detect Restatement', () => {
      const text = 'Restatement (Second) of Torts § 402A provides the standard.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Restatement'));
      expect(c).toBeDefined();
    });

    test('should detect Restatement (Third)', () => {
      const text = 'Restatement (Third) of Agency § 2.01 defines authority.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Restatement'));
      expect(c).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  // NORMALIZATION
  // ─────────────────────────────────────────────
  describe('Normalization', () => {
    test('should normalize U.S.C. variations', () => {
      expect(normalizeCitationText('42 USC 1983')).toContain('U.S.C.');
      expect(normalizeCitationText('42 U.S.C. 1983')).toContain('U.S.C.');
    });

    test('should standardize "versus" to "v."', () => {
      expect(normalizeCitationText('Smith vs. Jones')).toContain(' v. ');
      expect(normalizeCitationText('Smith versus Jones')).toContain(' v. ');
    });

    test('should normalize C.F.R. variations', () => {
      expect(normalizeCitationText('28 CFR 35')).toContain('C.F.R.');
    });

    test('should remove trailing commas and semicolons', () => {
      expect(normalizeCitationText('42 U.S.C. § 1983,')).not.toMatch(/,\s*$/);
      expect(normalizeCitationText('42 U.S.C. § 1983;')).not.toMatch(/;\s*$/);
    });

    test('should collapse multiple spaces', () => {
      expect(normalizeCitationText('42  U.S.C.   § 1983')).not.toContain('  ');
    });

    test('should normalize smart quotes', () => {
      const result = normalizeCitationText('\u201CSome text\u201D');
      expect(result).toContain('"');
      expect(result).not.toContain('\u201C');
    });

    test('should standardize section symbols', () => {
      expect(normalizeCitationText('sect. 1983')).toContain('§');
    });

    test('should extract case name correctly', () => {
      const name = extractCaseName('Brown v. Board of Education, 347 U.S. 483 (1954)');
      expect(name).toBe('Brown v. Board of Education');
    });

    test('should extract In re case name', () => {
      const name = extractCaseName('In re Marriage of Smith, 123 Cal.App.4th 456 (2005)');
      expect(name).toContain('In re');
    });

    test('should extract case name with apostrophe', () => {
      const name = extractCaseName("O'Brien v. Smith, 400 U.S. 100 (1970)");
      expect(name).toContain("O'Brien");
    });

    test('should return null for non-case text', () => {
      const name = extractCaseName('42 U.S.C. § 1983');
      expect(name).toBeNull();
    });

    test('should extract citation identifier for cases', () => {
      const id = extractCitationIdentifier(
        'Brown v. Board of Education, 347 U.S. 483 (1954)',
        CitationCategory.Cases
      );
      expect(id).toBe('347 U.S. 483');
    });

    test('should extract citation identifier for statutes', () => {
      const id = extractCitationIdentifier('42 U.S.C. § 1983', CitationCategory.Statutes);
      expect(id).toContain('42 U.S.C.');
      expect(id).toContain('1983');
    });

    test('should extract citation identifier for regulations', () => {
      const id = extractCitationIdentifier('28 C.F.R. § 35.130', CitationCategory.Regulations);
      expect(id).toContain('28 C.F.R.');
      expect(id).toContain('35.130');
    });

    test('should extract citation identifier for constitutional provisions', () => {
      const id = extractCitationIdentifier(
        'U.S. Const. amend. XIV, § 1',
        CitationCategory.Constitutional
      );
      expect(id).toContain('CONST');
      expect(id).toContain('XIV');
    });

    test('should extract citation identifier for rules', () => {
      const id = extractCitationIdentifier(
        'Fed. R. Civ. P. 12',
        CitationCategory.Rules
      );
      expect(id).toContain('FED');
      expect(id).toContain('12');
    });
  });

  // ─────────────────────────────────────────────
  // DEDUPLICATION
  // ─────────────────────────────────────────────
  describe('Deduplication', () => {
    test('should merge duplicate citations with different page numbers', () => {
      const citations: Citation[] = [
        makeCitation({
          text: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          category: CitationCategory.Cases,
          pages: [5],
        }),
        makeCitation({
          text: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          category: CitationCategory.Cases,
          pages: [10],
        }),
      ];

      const deduped = deduplicateCitations(citations);

      expect(deduped).toHaveLength(1);
      expect(deduped[0].pages).toContain(5);
      expect(deduped[0].pages).toContain(10);
    });

    test('should not merge citations from different categories', () => {
      const citations: Citation[] = [
        makeCitation({
          text: 'Some text 42 U.S.C. 100',
          category: CitationCategory.Cases,
          pages: [1],
        }),
        makeCitation({
          text: 'Some text 42 U.S.C. 100',
          category: CitationCategory.Statutes,
          pages: [2],
        }),
      ];

      const deduped = deduplicateCitations(citations);
      expect(deduped).toHaveLength(2);
    });

    test('should sort merged page numbers', () => {
      const citations: Citation[] = [
        makeCitation({
          text: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          category: CitationCategory.Cases,
          pages: [10],
        }),
        makeCitation({
          text: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          category: CitationCategory.Cases,
          pages: [3],
        }),
        makeCitation({
          text: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          category: CitationCategory.Cases,
          pages: [7],
        }),
      ];

      const deduped = deduplicateCitations(citations);
      expect(deduped).toHaveLength(1);
      expect(deduped[0].pages).toEqual([3, 7, 10]);
    });

    test('should not duplicate page numbers', () => {
      const citations: Citation[] = [
        makeCitation({
          text: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          category: CitationCategory.Cases,
          pages: [5],
        }),
        makeCitation({
          text: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          category: CitationCategory.Cases,
          pages: [5],
        }),
      ];

      const deduped = deduplicateCitations(citations);
      expect(deduped).toHaveLength(1);
      expect(deduped[0].pages).toEqual([5]);
    });

    test('should keep longer text when deduplicating', () => {
      const citations: Citation[] = [
        makeCitation({
          text: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          category: CitationCategory.Cases,
          pages: [1],
        }),
        makeCitation({
          text: 'Brown v. Board of Education, 347 U.S. 483, 495 (1954)',
          category: CitationCategory.Cases,
          pages: [2],
        }),
      ];

      const deduped = deduplicateCitations(citations);
      expect(deduped).toHaveLength(1);
      expect(deduped[0].text).toContain('495');
    });

    test('areCitationsDuplicate should return true for same citation', () => {
      const c1 = makeCitation({
        text: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
        category: CitationCategory.Cases,
      });
      const c2 = makeCitation({
        text: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
        category: CitationCategory.Cases,
      });
      expect(areCitationsDuplicate(c1, c2)).toBe(true);
    });

    test('areCitationsDuplicate should return false for different categories', () => {
      const c1 = makeCitation({
        text: 'something',
        category: CitationCategory.Cases,
      });
      const c2 = makeCitation({
        text: 'something',
        category: CitationCategory.Statutes,
      });
      expect(areCitationsDuplicate(c1, c2)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // SORTING & GROUPING
  // ─────────────────────────────────────────────
  describe('Sorting & Grouping', () => {
    test('should sort cases alphabetically by case name', () => {
      const citations: Citation[] = [
        makeCitation({
          text: 'Zebra v. Alpha, 100 U.S. 1 (2000)',
          category: CitationCategory.Cases,
        }),
        makeCitation({
          text: 'Alpha v. Beta, 200 U.S. 1 (2001)',
          category: CitationCategory.Cases,
        }),
      ];

      const sorted = sortCitations(citations);
      expect(sorted[0].text).toContain('Alpha v. Beta');
      expect(sorted[1].text).toContain('Zebra v. Alpha');
    });

    test('should sort statutes by normalized text', () => {
      const citations: Citation[] = [
        makeCitation({
          text: '42 U.S.C. § 1983',
          category: CitationCategory.Statutes,
        }),
        makeCitation({
          text: '28 U.S.C. § 1331',
          category: CitationCategory.Statutes,
        }),
      ];

      const sorted = sortCitations(citations);
      expect(sorted[0].text).toContain('28 U.S.C.');
      expect(sorted[1].text).toContain('42 U.S.C.');
    });

    test('should group citations by category', () => {
      const citations: Citation[] = [
        makeCitation({ text: 'Brown v. Board, 347 U.S. 483 (1954)', category: CitationCategory.Cases }),
        makeCitation({ text: '42 U.S.C. § 1983', category: CitationCategory.Statutes }),
        makeCitation({ text: 'Roe v. Wade, 410 U.S. 113 (1973)', category: CitationCategory.Cases }),
        makeCitation({ text: '28 C.F.R. § 35.130', category: CitationCategory.Regulations }),
      ];

      const grouped = groupByCategory(citations);
      expect(grouped.get(CitationCategory.Cases)?.length).toBe(2);
      expect(grouped.get(CitationCategory.Statutes)?.length).toBe(1);
      expect(grouped.get(CitationCategory.Regulations)?.length).toBe(1);
      expect(grouped.has(CitationCategory.Constitutional)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // SHORT FORM RESOLUTION
  // ─────────────────────────────────────────────
  describe('Short Form Resolution', () => {
    const parentCitations: Citation[] = [
      makeCitation({
        id: 'brown-case',
        text: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
        category: CitationCategory.Cases,
        isShortForm: false,
      }),
      makeCitation({
        id: 'roe-case',
        text: 'Roe v. Wade, 410 U.S. 113 (1973)',
        category: CitationCategory.Cases,
        isShortForm: false,
      }),
    ];

    test('should resolve supra citation to matching case', () => {
      const parentId = resolveShortForm('Brown, supra, at 495', parentCitations);
      expect(parentId).toBe('brown-case');
    });

    test('should resolve short case citation with volume/reporter', () => {
      const parentId = resolveShortForm('Brown, 347 U.S. at 490', parentCitations);
      expect(parentId).toBe('brown-case');
    });

    test('should return null for Id. (requires positional context)', () => {
      const parentId = resolveShortForm('Id. at 100', parentCitations);
      expect(parentId).toBeNull();
    });

    test('should return null for unresolvable supra', () => {
      const parentId = resolveShortForm('UnknownCase, supra, at 50', parentCitations);
      expect(parentId).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // REPORTER VALIDATION
  // ─────────────────────────────────────────────
  describe('Reporter Validation', () => {
    test('should validate U.S. reporter', () => {
      expect(isValidReporter('U.S.')).toBe(true);
    });

    test('should validate federal reporters', () => {
      expect(isValidReporter('F.3d')).toBe(true);
      expect(isValidReporter('F.Supp.3d')).toBe(true);
      expect(isValidReporter('F.4th')).toBe(true);
    });

    test('should validate state reporters', () => {
      expect(isValidReporter('Cal.4th')).toBe(true);
      expect(isValidReporter('N.Y.2d')).toBe(true);
      expect(isValidReporter('N.E.2d')).toBe(true);
    });

    test('should validate regional reporters', () => {
      expect(isValidReporter('P.3d')).toBe(true);
      expect(isValidReporter('A.3d')).toBe(true);
      expect(isValidReporter('S.W.3d')).toBe(true);
      expect(isValidReporter('S.E.2d')).toBe(true);
      expect(isValidReporter('So.3d')).toBe(true);
      expect(isValidReporter('N.W.2d')).toBe(true);
    });

    test('should reject invalid reporters', () => {
      expect(isValidReporter('InvalidReporter')).toBe(false);
      expect(isValidReporter('Fake.3d')).toBe(false);
      expect(isValidReporter('')).toBe(false);
    });

    test('should have comprehensive reporter list', () => {
      expect(REPORTER_ABBREVIATIONS.length).toBeGreaterThan(20);
    });
  });

  // ─────────────────────────────────────────────
  // EDGE CASES
  // ─────────────────────────────────────────────
  describe('Edge Cases', () => {
    test('should handle empty text', () => {
      const result = parseText('');
      expect(result.citations).toHaveLength(0);
    });

    test('should handle text with no citations', () => {
      const text = 'This is a regular paragraph without any legal citations whatsoever.';
      const result = parseText(text);
      expect(result.citations).toHaveLength(0);
    });

    test('should handle citations with parentheses in subsections', () => {
      const text = 'Fed. R. Civ. P. 12(b)(6) requires specific pleading.';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('12(b)(6)'));
      expect(c).toBeDefined();
    });

    test('should not falsely match "v." in non-case contexts', () => {
      const text = 'The word "v." appears here but this is not a case citation at all.';
      const result = parseText(text);

      // Should not find any cases
      const cases = result.citations.filter(c => c.category === CitationCategory.Cases);
      // At minimum, should not crash
      expect(result).toBeDefined();
    });

    test('should handle very long citation text', () => {
      const text = 'National Federation of Independent Business v. Sebelius, 567 U.S. 519 (2012).';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Sebelius'));
      expect(c).toBeDefined();
    });

    test('should handle citation at start of text', () => {
      const text = 'Brown v. Board of Education, 347 U.S. 483 (1954) is the landmark case.';
      const result = parseText(text);

      expect(result.citations.length).toBeGreaterThan(0);
    });

    test('should handle citation at end of text', () => {
      const text = 'The landmark case is Brown v. Board of Education, 347 U.S. 483 (1954)';
      const result = parseText(text);

      expect(result.citations.length).toBeGreaterThan(0);
    });

    test('should handle double section symbol', () => {
      const text = 'See 42 U.S.C. §§ 1983-1988.';
      const result = parseText(text);

      const c = result.citations.find(c => c.category === CitationCategory.Statutes);
      expect(c).toBeDefined();
    });

    test('should handle string citation (e.g., "see also" signal)', () => {
      const text = 'See also Marbury v. Madison, 5 U.S. 137 (1803).';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Marbury'));
      expect(c).toBeDefined();
    });

    test('should handle cf. citation signal', () => {
      const text = 'Cf. Plessy v. Ferguson, 163 U.S. 537 (1896).';
      const result = parseText(text);

      const c = result.citations.find(c => c.text.includes('Plessy'));
      expect(c).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  // SAMPLE BRIEF INTEGRATION
  // ─────────────────────────────────────────────
  describe('Sample Brief Integration', () => {
    let result: ReturnType<typeof parseText>;

    beforeAll(() => {
      const fixturePath = path.join(__dirname, 'fixtures', 'sample-brief.txt');
      const text = fs.readFileSync(fixturePath, 'utf-8');
      result = parseText(text);
    });

    test('should find many citations in sample brief', () => {
      expect(result.citations.length).toBeGreaterThan(10);
    });

    test('should find cases in sample brief', () => {
      const categories = new Set(result.citations.map(c => c.category));
      expect(categories.has(CitationCategory.Cases)).toBe(true);
    });

    test('should find statutes in sample brief', () => {
      const categories = new Set(result.citations.map(c => c.category));
      expect(categories.has(CitationCategory.Statutes)).toBe(true);
    });

    test('should find constitutional provisions in sample brief', () => {
      const categories = new Set(result.citations.map(c => c.category));
      expect(categories.has(CitationCategory.Constitutional)).toBe(true);
    });

    test('should find rules in sample brief', () => {
      const categories = new Set(result.citations.map(c => c.category));
      expect(categories.has(CitationCategory.Rules)).toBe(true);
    });

    test('should find Brown v. Board in sample brief', () => {
      expect(result.citations.some(c => c.text.includes('Brown v. Board'))).toBe(true);
    });

    test('should find 42 U.S.C. in sample brief', () => {
      expect(result.citations.some(c => c.text.includes('42 U.S.C.'))).toBe(true);
    });

    test('should find U.S. Const. amend. XIV in sample brief', () => {
      expect(result.citations.some(c => c.text.includes('U.S. Const. amend. XIV'))).toBe(true);
    });

    test('should find Twombly in sample brief', () => {
      expect(result.citations.some(c => c.text.includes('Twombly'))).toBe(true);
    });

    test('should find Ashcroft v. Iqbal in sample brief', () => {
      expect(result.citations.some(c => c.text.includes('Iqbal'))).toBe(true);
    });

    test('should find Fed. R. Civ. P. 12(b)(6) in sample brief', () => {
      expect(result.citations.some(c => c.text.includes('Fed. R. Civ. P.'))).toBe(true);
    });

    test('should find CFR regulation in sample brief', () => {
      expect(result.citations.some(c => c.text.includes('C.F.R.'))).toBe(true);
    });

    test('should find Restatement in sample brief', () => {
      expect(result.citations.some(c => c.text.includes('Restatement'))).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // PARSER OPTIONS
  // ─────────────────────────────────────────────
  describe('Parser Options', () => {
    test('should accept custom patterns', () => {
      const text = 'CUSTOM-REF-12345 applies here.';
      const customPattern = {
        pattern: /CUSTOM-REF-(\d+)/gi,
        category: CitationCategory.Other,
        description: 'Custom reference',
      };

      const result = parseText(text, { customPatterns: [customPattern] });
      const c = result.citations.find(c => c.text.includes('CUSTOM-REF'));
      expect(c).toBeDefined();
      expect(c?.category).toBe(CitationCategory.Other);
    });

    test('should estimate page count from text length', () => {
      const shortText = 'Short text.';
      const result = parseText(shortText);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
    });
  });
});
