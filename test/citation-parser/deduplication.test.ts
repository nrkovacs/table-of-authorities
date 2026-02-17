/**
 * Deduplication integration tests using parseDocument()
 * Verifies that the full pipeline (parse → deduplicate) works correctly
 * on multi-page documents.
 */
import { parseDocument } from '../../src/citation-parser';
import { extractCitationIdentifier } from '../../src/citation-parser/normalizer';
import { CitationCategory } from '../../src/citation-parser/types';

function makePageMap(pages: Record<number, string>): Map<number, string> {
  return new Map(Object.entries(pages).map(([k, v]) => [Number(k), v]));
}

describe('Deduplication – Multi-page Documents', () => {
  test('merges same case cited on multiple pages into one entry', () => {
    const pageMap = makePageMap({
      1: 'Illinois v. Gates, 462 U.S. 213, 232 (1983) requires probable cause.',
      3: 'As stated in Illinois v. Gates, 462 U.S. 213, 232 (1983), this standard applies.',
      5: 'See Illinois v. Gates, 462 U.S. 213 (1983).',
    });
    const result = parseDocument('', pageMap);
    const gates = result.citations.filter(
      c => c.text.includes('Illinois v. Gates') && !c.isShortForm
    );
    expect(gates).toHaveLength(1);
    expect(gates[0].pages).toContain(1);
    expect(gates[0].pages).toContain(3);
    expect(gates[0].pages).toContain(5);
  });

  test('keeps different cases as separate entries', () => {
    const pageMap = makePageMap({
      1: 'Illinois v. Gates, 462 U.S. 213 (1983). Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007).',
    });
    const result = parseDocument('', pageMap);
    const cases = result.citations.filter(
      c => c.category === CitationCategory.Cases && !c.isShortForm
    );
    expect(cases.length).toBeGreaterThanOrEqual(2);
    expect(cases.some(c => c.text.includes('Illinois v. Gates'))).toBe(true);
    expect(cases.some(c => c.text.includes('Twombly'))).toBe(true);
  });

  test('merges same statute cited on multiple pages', () => {
    const pageMap = makePageMap({
      1: 'Under 42 U.S.C. § 1983, a plaintiff may sue.',
      4: 'The claim arises under 42 U.S.C. § 1983.',
    });
    const result = parseDocument('', pageMap);
    const statute = result.citations.filter(
      c => c.category === CitationCategory.Statutes && c.text.includes('1983') && !c.isShortForm
    );
    expect(statute).toHaveLength(1);
    expect(statute[0].pages).toContain(1);
    expect(statute[0].pages).toContain(4);
  });

  test('keeps short-form citations separate from full citations', () => {
    const pageMap = makePageMap({
      1: 'In Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009), the Court held.',
      2: 'Iqbal, 556 U.S. at 678.',
    });
    const result = parseDocument('', pageMap);
    const fullForms = result.citations.filter(
      c => c.text.includes('Ashcroft v. Iqbal') && !c.isShortForm
    );
    const shortForms = result.citations.filter(
      c => c.text.includes('Iqbal') && c.isShortForm
    );
    expect(fullForms).toHaveLength(1);
    expect(shortForms.length).toBeGreaterThanOrEqual(1);
  });

  test('merges case with different pincites (same reporter cite)', () => {
    const pageMap = makePageMap({
      1: 'Maryland v. Pringle, 540 U.S. 366, 371 (2003).',
      3: 'Maryland v. Pringle, 540 U.S. 366, 373 (2003).',
    });
    const result = parseDocument('', pageMap);
    const pringle = result.citations.filter(
      c => c.text.includes('Maryland v. Pringle') && !c.isShortForm
    );
    expect(pringle).toHaveLength(1);
    expect(pringle[0].pages).toContain(1);
    expect(pringle[0].pages).toContain(3);
  });

  test('keeps different statute sections as separate entries', () => {
    const pageMap = makePageMap({
      1: 'Under 28 U.S.C. § 1292 and 42 U.S.C. § 1983.',
    });
    const result = parseDocument('', pageMap);
    const statutes = result.citations.filter(
      c => c.category === CitationCategory.Statutes && !c.isShortForm
    );
    expect(statutes.length).toBeGreaterThanOrEqual(2);
    const ids = statutes.map(c => extractCitationIdentifier(c.text, c.category));
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(statutes.length);
  });
});

describe('Deduplication – Identifier Consistency', () => {
  test('extractCitationIdentifier is stable across pincite variants', () => {
    const id1 = extractCitationIdentifier('Illinois v. Gates, 462 U.S. 213, 232 (1983)', CitationCategory.Cases);
    const id2 = extractCitationIdentifier('Illinois v. Gates, 462 U.S. 213 (1983)', CitationCategory.Cases);
    expect(id1).toBe(id2);
  });

  test('extractCitationIdentifier differs for different reporters', () => {
    const id1 = extractCitationIdentifier('Illinois v. Gates, 462 U.S. 213 (1983)', CitationCategory.Cases);
    const id2 = extractCitationIdentifier('Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007)', CitationCategory.Cases);
    expect(id1).not.toBe(id2);
  });
});
