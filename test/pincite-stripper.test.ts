import {
  stripPinCite,
  buildTAFieldCode,
  buildIdTAFieldCode,
  buildTOAFieldCode,
  escapeFieldQuotes,
} from '../src/citation-parser/pincite-stripper';
import { CitationCategory } from '../src/citation-parser/types';

describe('Pincite Stripper – Case Citations', () => {
  test('strips pin cite from standard case', () => {
    const result = stripPinCite('Illinois v. Gates, 462 U.S. 213, 232 (1983)', CitationCategory.Cases);
    expect(result.longCite).toBe('Illinois v. Gates, 462 U.S. 213 (1983)');
    expect(result.longCite).not.toContain('232');
    expect(result.shortCite).toBe('Gates');
  });

  test('strips pin cite from Twombly', () => {
    const result = stripPinCite('Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007)', CitationCategory.Cases);
    expect(result.longCite).toBe('Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007)');
    expect(result.shortCite).toBe('Twombly');
  });

  test('strips signal word and pin cite', () => {
    const result = stripPinCite('See also Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009)', CitationCategory.Cases);
    expect(result.longCite).toBe('Ashcroft v. Iqbal, 556 U.S. 662 (2009)');
    expect(result.longCite.startsWith('See')).toBe(false);
    expect(result.shortCite).toBe('Iqbal');
  });

  test('handles case without pin cite', () => {
    const result = stripPinCite('Roe v. Wade, 410 U.S. 113 (1973)', CitationCategory.Cases);
    expect(result.longCite).toBe('Roe v. Wade, 410 U.S. 113 (1973)');
    expect(result.shortCite).toBe('Wade');
  });

  test('strips page range pin cite', () => {
    const result = stripPinCite('Maryland v. Pringle, 540 U.S. 366, 371-73 (2003)', CitationCategory.Cases);
    expect(result.longCite).toBe('Maryland v. Pringle, 540 U.S. 366 (2003)');
    expect(result.longCite).not.toContain('371');
  });

  test('strips multiple pin cites', () => {
    const result = stripPinCite('Maryland v. Pringle, 540 U.S. 366, 371, 373-74 (2003)', CitationCategory.Cases);
    expect(result.longCite).toBe('Maryland v. Pringle, 540 U.S. 366 (2003)');
    expect(result.longCite).not.toContain('371');
  });

  test('sets category code to 1 for cases', () => {
    const result = stripPinCite('Brown v. Board, 347 U.S. 483 (1954)', CitationCategory.Cases);
    expect(result.categoryCode).toBe(1);
  });
});

describe('Pincite Stripper – Statute Citations', () => {
  test('strips subsection from statute', () => {
    const result = stripPinCite('42 U.S.C. § 1983(a)(1)', CitationCategory.Statutes);
    expect(result.longCite).toBe('42 U.S.C. § 1983');
  });

  test('preserves statute without subsection', () => {
    const result = stripPinCite('42 U.S.C. § 1983', CitationCategory.Statutes);
    expect(result.longCite).toBe('42 U.S.C. § 1983');
  });

  test('sets category code to 2 for statutes', () => {
    const result = stripPinCite('42 U.S.C. § 1983', CitationCategory.Statutes);
    expect(result.categoryCode).toBe(2);
  });
});

describe('Pincite Stripper – Field Code Generation', () => {
  test('builds TA field code with long cite, short cite and category', () => {
    const fc = buildTAFieldCode('Illinois v. Gates, 462 U.S. 213 (1983)', 'Gates', 1);
    expect(fc).toBe('TA \\l "Illinois v. Gates, 462 U.S. 213 (1983)" \\s "Gates" \\c 1');
    expect(fc).toContain('\\l');
    expect(fc).toContain('\\s');
    expect(fc).toContain('\\c 1');
  });

  test('builds Id. TA field code (no long cite)', () => {
    const idfc = buildIdTAFieldCode('Gates', 1);
    expect(idfc).toBe('TA \\s "Gates" \\c 1');
    expect(idfc).not.toContain('\\l');
    expect(idfc).toContain('\\s "Gates"');
    expect(idfc).toContain('\\c 1');
  });

  test('builds TOA field code with passim', () => {
    const toa = buildTOAFieldCode(1, true);
    expect(toa).toContain('TOA \\c 1');
    expect(toa).toContain('\\p');
  });

  test('builds TOA field code without passim', () => {
    const toa = buildTOAFieldCode(2, false);
    expect(toa).toContain('TOA \\c 2');
    expect(toa).not.toContain('\\p');
  });
});

describe('Pincite Stripper – Quote Escaping', () => {
  test('escapes straight double quotes in field values', () => {
    const esc = escapeFieldQuotes('He said "hello" to the court');
    // Result must not contain raw ASCII double quotes mid-string
    const mid = esc.slice(1, esc.length - 1);
    expect(mid).not.toContain('"');
  });

  test('leaves text without quotes unchanged', () => {
    const text = 'no quotes here';
    expect(escapeFieldQuotes(text)).toBe(text);
  });
});
