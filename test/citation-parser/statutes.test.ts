import { parseText, CitationCategory } from '../../src/citation-parser';

describe('Citation Parser – Statute Citations', () => {
  test('detects federal statute 42 U.S.C. § 1983', () => {
    const result = parseText('Pursuant to 42 U.S.C. § 1983, plaintiff filed suit.');
    const c = result.citations.find(c => c.category === CitationCategory.Statutes);
    expect(c).toBeDefined();
    expect(c?.text).toContain('42 U.S.C.');
    expect(c?.text).toContain('1983');
  });

  test('detects federal statute with subsection', () => {
    const result = parseText('Under 28 U.S.C. § 1331(a), jurisdiction exists.');
    const c = result.citations.find(c => c.text.includes('1331'));
    expect(c).toBeDefined();
  });

  test('detects multiple sections of the same title', () => {
    const result = parseText('28 U.S.C. § 1331 and 28 U.S.C. § 1343 both apply.');
    const statutes = result.citations.filter(c =>
      c.category === CitationCategory.Statutes && c.text.includes('28 U.S.C.')
    );
    expect(statutes.length).toBeGreaterThanOrEqual(2);
  });

  test('detects California statute', () => {
    const result = parseText('See Cal. Civ. Code § 1542.');
    const c = result.citations.find(c =>
      c.category === CitationCategory.Statutes && c.text.includes('Cal.')
    );
    expect(c).toBeDefined();
  });

  test('detects New York statute', () => {
    const result = parseText('N.Y. Gen. Bus. Law § 349 prohibits deceptive practices.');
    const c = result.citations.find(c => c.text.includes('N.Y.'));
    expect(c).toBeDefined();
    expect(c?.category).toBe(CitationCategory.Statutes);
  });

  test('detects Illinois compiled statute', () => {
    const result = parseText('See 735 ILCS 5/2-1401.');
    const c = result.citations.find(c => c.text.includes('ILCS'));
    expect(c).toBeDefined();
  });

  test('detects Florida statute', () => {
    const result = parseText('Fla. Stat. § 768.28 governs sovereign immunity.');
    const c = result.citations.find(c => c.text.includes('Fla. Stat.'));
    expect(c).toBeDefined();
  });

  test('detects USC without periods', () => {
    const result = parseText('Title 18 USC § 1001 criminalizes false statements.');
    const c = result.citations.find(c => c.text.includes('USC'));
    expect(c).toBeDefined();
  });

  test('detects statute with hyphenated section number', () => {
    const result = parseText('42 U.S.C. § 2000e-2 prohibits employment discrimination.');
    const c = result.citations.find(c => c.text.includes('2000e'));
    expect(c).toBeDefined();
  });

  test('detects double section symbol', () => {
    const result = parseText('See 42 U.S.C. §§ 1983-1988.');
    const c = result.citations.find(c => c.category === CitationCategory.Statutes);
    expect(c).toBeDefined();
  });
});
