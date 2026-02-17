import { CitationCategory } from '../../src/citation-parser/types';
import {
  normalizeCitationText,
  extractCaseName,
  extractCitationIdentifier,
  deduplicateCitations,
  areCitationsDuplicate,
  sortCitations,
  groupByCategory,
} from '../../src/citation-parser/normalizer';
import { Citation } from '../../src/citation-parser/types';

function makeCitation(
  overrides: Partial<Citation> & { text: string; category: CitationCategory }
): Citation {
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

describe('Normalizer – Text Normalization', () => {
  test('standardizes "vs." to "v."', () => {
    expect(normalizeCitationText('Smith vs. Jones')).toContain(' v. ');
  });

  test('standardizes "versus" to "v."', () => {
    expect(normalizeCitationText('Smith versus Jones')).toContain(' v. ');
  });

  test('normalizes U.S.C. variations', () => {
    expect(normalizeCitationText('42 USC 1983')).toContain('U.S.C.');
  });

  test('normalizes C.F.R. variations', () => {
    expect(normalizeCitationText('28 CFR 35')).toContain('C.F.R.');
  });

  test('removes trailing commas', () => {
    expect(normalizeCitationText('42 U.S.C. § 1983,')).not.toMatch(/,\s*$/);
  });

  test('collapses multiple spaces', () => {
    expect(normalizeCitationText('42  U.S.C.   § 1983')).not.toContain('  ');
  });

  test('normalizes smart quotes', () => {
    const result = normalizeCitationText('\u201CSome text\u201D');
    expect(result).toContain('"');
    expect(result).not.toContain('\u201C');
  });

  test('standardizes section symbol', () => {
    expect(normalizeCitationText('sect. 1983')).toContain('§');
  });
});

describe('Normalizer – Case Name Extraction', () => {
  test('extracts case name correctly', () => {
    expect(extractCaseName('Brown v. Board of Education, 347 U.S. 483 (1954)')).toBe(
      'Brown v. Board of Education'
    );
  });

  test('extracts In re case name', () => {
    const name = extractCaseName('In re Marriage of Smith, 123 Cal.App.4th 456 (2005)');
    expect(name).toContain('In re');
  });

  test("extracts case name with apostrophe", () => {
    const name = extractCaseName("O'Brien v. Smith, 400 U.S. 100 (1970)");
    expect(name).toContain("O'Brien");
  });

  test('returns null for non-case text', () => {
    expect(extractCaseName('42 U.S.C. § 1983')).toBeNull();
  });
});

describe('Normalizer – Identifier Extraction', () => {
  test('extracts case identifier (volume reporter page)', () => {
    const id = extractCitationIdentifier(
      'Brown v. Board of Education, 347 U.S. 483 (1954)',
      CitationCategory.Cases
    );
    expect(id).toBe('347 U.S. 483');
  });

  test('ignores pincite when extracting case identifier', () => {
    const id1 = extractCitationIdentifier('Brown v. Board, 347 U.S. 483, 490 (1954)', CitationCategory.Cases);
    const id2 = extractCitationIdentifier('Brown v. Board, 347 U.S. 483 (1954)', CitationCategory.Cases);
    expect(id1).toBe(id2);
  });

  test('extracts statute identifier', () => {
    const id = extractCitationIdentifier('42 U.S.C. § 1983', CitationCategory.Statutes);
    expect(id).toContain('42 U.S.C.');
    expect(id).toContain('1983');
  });

  test('extracts regulation identifier', () => {
    const id = extractCitationIdentifier('28 C.F.R. § 35.130', CitationCategory.Regulations);
    expect(id).toContain('28 C.F.R.');
    expect(id).toContain('35.130');
  });

  test('extracts constitutional identifier', () => {
    const id = extractCitationIdentifier('U.S. Const. amend. XIV, § 1', CitationCategory.Constitutional);
    expect(id).toContain('XIV');
  });

  test('extracts rule identifier', () => {
    const id = extractCitationIdentifier('Fed. R. Civ. P. 12', CitationCategory.Rules);
    expect(id).toContain('12');
  });

  test('different cases produce different identifiers', () => {
    const id1 = extractCitationIdentifier('Brown v. Board, 347 U.S. 483 (1954)', CitationCategory.Cases);
    const id2 = extractCitationIdentifier('Twombly, 550 U.S. 544 (2007)', CitationCategory.Cases);
    expect(id1).not.toBe(id2);
  });
});

describe('Normalizer – Deduplication', () => {
  test('merges duplicate citations with different page numbers', () => {
    const citations: Citation[] = [
      makeCitation({ text: 'Brown v. Board of Education, 347 U.S. 483 (1954)', category: CitationCategory.Cases, pages: [5] }),
      makeCitation({ text: 'Brown v. Board of Education, 347 U.S. 483 (1954)', category: CitationCategory.Cases, pages: [10] }),
    ];
    const deduped = deduplicateCitations(citations);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].pages).toContain(5);
    expect(deduped[0].pages).toContain(10);
  });

  test('does not merge citations from different categories', () => {
    const citations: Citation[] = [
      makeCitation({ text: '42 U.S.C. 100', category: CitationCategory.Cases, pages: [1] }),
      makeCitation({ text: '42 U.S.C. 100', category: CitationCategory.Statutes, pages: [2] }),
    ];
    expect(deduplicateCitations(citations)).toHaveLength(2);
  });

  test('sorts merged page numbers', () => {
    const citations: Citation[] = [
      makeCitation({ text: 'Brown v. Board, 347 U.S. 483 (1954)', category: CitationCategory.Cases, pages: [10] }),
      makeCitation({ text: 'Brown v. Board, 347 U.S. 483 (1954)', category: CitationCategory.Cases, pages: [3] }),
      makeCitation({ text: 'Brown v. Board, 347 U.S. 483 (1954)', category: CitationCategory.Cases, pages: [7] }),
    ];
    const deduped = deduplicateCitations(citations);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].pages).toEqual([3, 7, 10]);
  });

  test('does not duplicate page numbers', () => {
    const citations: Citation[] = [
      makeCitation({ text: 'Brown v. Board, 347 U.S. 483 (1954)', category: CitationCategory.Cases, pages: [5] }),
      makeCitation({ text: 'Brown v. Board, 347 U.S. 483 (1954)', category: CitationCategory.Cases, pages: [5] }),
    ];
    const deduped = deduplicateCitations(citations);
    expect(deduped[0].pages).toEqual([5]);
  });

  test('areCitationsDuplicate returns true for same citation', () => {
    const c1 = makeCitation({ text: 'Brown v. Board, 347 U.S. 483 (1954)', category: CitationCategory.Cases });
    const c2 = makeCitation({ text: 'Brown v. Board, 347 U.S. 483 (1954)', category: CitationCategory.Cases });
    expect(areCitationsDuplicate(c1, c2)).toBe(true);
  });

  test('areCitationsDuplicate returns false for different categories', () => {
    const c1 = makeCitation({ text: 'something', category: CitationCategory.Cases });
    const c2 = makeCitation({ text: 'something', category: CitationCategory.Statutes });
    expect(areCitationsDuplicate(c1, c2)).toBe(false);
  });
});

describe('Normalizer – Sorting & Grouping', () => {
  test('sorts cases alphabetically by case name', () => {
    const citations: Citation[] = [
      makeCitation({ text: 'Zebra v. Alpha, 100 U.S. 1 (2000)', category: CitationCategory.Cases }),
      makeCitation({ text: 'Alpha v. Beta, 200 U.S. 1 (2001)', category: CitationCategory.Cases }),
    ];
    const sorted = sortCitations(citations);
    expect(sorted[0].text).toContain('Alpha v. Beta');
    expect(sorted[1].text).toContain('Zebra v. Alpha');
  });

  test('sorts statutes numerically', () => {
    const citations: Citation[] = [
      makeCitation({ text: '42 U.S.C. § 1983', category: CitationCategory.Statutes }),
      makeCitation({ text: '28 U.S.C. § 1331', category: CitationCategory.Statutes }),
    ];
    const sorted = sortCitations(citations);
    expect(sorted[0].text).toContain('28 U.S.C.');
    expect(sorted[1].text).toContain('42 U.S.C.');
  });

  test('groups citations by category', () => {
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
