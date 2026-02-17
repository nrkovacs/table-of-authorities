import { parseText, CitationCategory } from '../../src/citation-parser';

describe('Citation Parser – Edge Cases', () => {
  test('handles empty text gracefully', () => {
    const result = parseText('');
    expect(result.citations).toHaveLength(0);
  });

  test('handles text with no citations', () => {
    const text = 'This is a regular paragraph without any legal citations whatsoever.';
    const result = parseText(text);
    expect(result.citations).toHaveLength(0);
  });

  test('handles citations with parenthetical subsections', () => {
    const result = parseText('Fed. R. Civ. P. 12(b)(6) requires specific pleading.');
    const c = result.citations.find(c => c.text.includes('12(b)(6)'));
    expect(c).toBeDefined();
  });

  test('handles very long case name', () => {
    const text = 'National Federation of Independent Business v. Sebelius, 567 U.S. 519 (2012).';
    const result = parseText(text);
    const c = result.citations.find(c => c.text.includes('Sebelius'));
    expect(c).toBeDefined();
  });

  test('handles citation at start of text', () => {
    const text = 'Brown v. Board of Education, 347 U.S. 483 (1954) is the landmark case.';
    const result = parseText(text);
    expect(result.citations.length).toBeGreaterThan(0);
  });

  test('handles citation at end of text without period', () => {
    const text = 'The landmark case is Brown v. Board of Education, 347 U.S. 483 (1954)';
    const result = parseText(text);
    expect(result.citations.length).toBeGreaterThan(0);
  });

  test('handles "see also" signal prefix', () => {
    const result = parseText('See also Marbury v. Madison, 5 U.S. 137 (1803).');
    const c = result.citations.find(c => c.text.includes('Marbury'));
    expect(c).toBeDefined();
  });

  test('handles "cf." signal prefix', () => {
    const result = parseText('Cf. Plessy v. Ferguson, 163 U.S. 537 (1896).');
    const c = result.citations.find(c => c.text.includes('Plessy'));
    expect(c).toBeDefined();
  });

  test('accepts custom patterns', () => {
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

  test('estimates page count from text length', () => {
    const result = parseText('Short text.');
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });
});
