import { parseText, CitationCategory } from '../../src/citation-parser';

describe('Citation Parser – Constitutional Citations', () => {
  test('detects U.S. Constitution article', () => {
    const result = parseText('U.S. Const. art. I, § 8 grants Congress certain powers.');
    const c = result.citations.find(c => c.category === CitationCategory.Constitutional);
    expect(c).toBeDefined();
    expect(c?.text).toContain('art. I');
  });

  test('detects U.S. Constitution amendment with section', () => {
    const result = parseText('U.S. Const. amend. XIV, § 1 protects equal protection.');
    const c = result.citations.find(c =>
      c.category === CitationCategory.Constitutional && c.text.includes('amend. XIV')
    );
    expect(c).toBeDefined();
  });

  test('detects U.S. Constitution amendment without section', () => {
    const result = parseText('U.S. Const. amend. IV protects against unreasonable searches.');
    const c = result.citations.find(c =>
      c.category === CitationCategory.Constitutional && c.text.includes('amend. IV')
    );
    expect(c).toBeDefined();
  });

  test('detects First Amendment', () => {
    const result = parseText('U.S. Const. amend. I protects free speech.');
    const c = result.citations.find(c =>
      c.category === CitationCategory.Constitutional && c.text.includes('amend. I')
    );
    expect(c).toBeDefined();
  });

  test('detects state constitution', () => {
    const result = parseText('Cal. Const. art. I, § 7 protects privacy.');
    const c = result.citations.find(c =>
      c.category === CitationCategory.Constitutional && c.text.includes('Cal.')
    );
    expect(c).toBeDefined();
  });

  test('detects Article III', () => {
    const result = parseText('U.S. Const. art. III, § 2 defines judicial power.');
    const c = result.citations.find(c => c.text.includes('art. III'));
    expect(c).toBeDefined();
  });
});
