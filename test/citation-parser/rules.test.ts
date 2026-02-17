import { parseText, CitationCategory } from '../../src/citation-parser';

describe('Citation Parser – Rules Citations', () => {
  test('detects FRCP 12(b)(6)', () => {
    const result = parseText('Under Fed. R. Civ. P. 12(b)(6), defendants moved to dismiss.');
    const c = result.citations.find(c => c.category === CitationCategory.Rules);
    expect(c).toBeDefined();
    expect(c?.text).toContain('Fed. R. Civ. P.');
  });

  test('detects FRCP Rule 8', () => {
    const result = parseText('Fed. R. Civ. P. 8(a)(2) requires a short and plain statement.');
    const c = result.citations.find(c => c.text.includes('Fed. R. Civ. P.'));
    expect(c).toBeDefined();
  });

  test('detects Federal Rules of Evidence', () => {
    const result = parseText('Fed. R. Evid. 702 governs expert testimony.');
    const c = result.citations.find(c => c.text.includes('Fed. R. Evid.'));
    expect(c).toBeDefined();
  });

  test('detects Federal Rules of Appellate Procedure', () => {
    const result = parseText('See Fed. R. App. P. 4(a)(1).');
    const c = result.citations.find(c => c.text.includes('Fed. R. App. P.'));
    expect(c).toBeDefined();
  });

  test('detects Federal Rules of Criminal Procedure', () => {
    const result = parseText('Fed. R. Crim. P. 11 governs pleas.');
    const c = result.citations.find(c => c.text.includes('Fed. R. Crim. P.'));
    expect(c).toBeDefined();
  });

  test('detects California Rules of Court', () => {
    const result = parseText('Cal. Rules of Court, rule 8.204 governs appellate briefs.');
    const c = result.citations.find(c => c.text.includes('Cal. Rules of Court'));
    expect(c).toBeDefined();
  });

  test('detects simple FRCP rule number', () => {
    const result = parseText('Fed. R. Civ. P. 56 governs summary judgment.');
    const c = result.citations.find(c => c.category === CitationCategory.Rules);
    expect(c).toBeDefined();
    expect(c?.text).toContain('56');
  });
});
