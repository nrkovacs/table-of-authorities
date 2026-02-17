import { CitationCategory } from '../../src/citation-parser/types';
import { normalizeCitationText, resolveShortForm } from '../../src/citation-parser/normalizer';
import { Citation } from '../../src/citation-parser/types';

function makeCitation(
  overrides: Partial<Citation> & { text: string; category: CitationCategory }
): Citation {
  return {
    id: overrides.id ?? `test_${Math.random().toString(36).substr(2, 6)}`,
    originalText: overrides.text,
    normalizedText: normalizeCitationText(overrides.text),
    pages: [1],
    isShortForm: false,
    isIncluded: true,
    ...overrides,
  };
}

describe('Citation Parser – Short Form Resolution', () => {
  const parents: Citation[] = [
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

  test('resolves supra citation to matching case', () => {
    const parentId = resolveShortForm('Brown, supra, at 495', parents);
    expect(parentId).toBe('brown-case');
  });

  test('resolves short case citation with volume/reporter', () => {
    const parentId = resolveShortForm('Brown, 347 U.S. at 490', parents);
    expect(parentId).toBe('brown-case');
  });

  test('returns null for Id. (requires positional context)', () => {
    const parentId = resolveShortForm('Id. at 100', parents);
    expect(parentId).toBeNull();
  });

  test('returns null for unresolvable supra', () => {
    const parentId = resolveShortForm('UnknownCase, supra, at 50', parents);
    expect(parentId).toBeNull();
  });
});
