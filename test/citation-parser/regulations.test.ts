import { parseText, CitationCategory } from '../../src/citation-parser';

describe('Citation Parser – Regulations Citations', () => {
  test('detects Code of Federal Regulations', () => {
    const result = parseText('The regulation at 28 C.F.R. § 35.130 prohibits discrimination.');
    const c = result.citations.find(c => c.category === CitationCategory.Regulations);
    expect(c).toBeDefined();
    expect(c?.text).toContain('28 C.F.R.');
  });

  test('detects CFR with subsection', () => {
    const result = parseText('40 C.F.R. § 122.26(b)(14) defines stormwater discharge.');
    const c = result.citations.find(c => c.text.includes('40 C.F.R.'));
    expect(c).toBeDefined();
  });

  test('detects Federal Register citation', () => {
    const result = parseText('See 85 Fed. Reg. 12345 (Mar. 1, 2020).');
    const c = result.citations.find(c => c.text.includes('Fed. Reg.'));
    expect(c).toBeDefined();
  });
});
