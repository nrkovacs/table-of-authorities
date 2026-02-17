import { parseText, CitationCategory } from '../../src/citation-parser';

describe('Citation Parser – Treatises & Secondary Sources', () => {
  test('detects treatise with edition notation', () => {
    const result = parseText(
      '5 Wright & Miller, Federal Practice and Procedure § 1357 (3d ed. 2004).'
    );
    const c = result.citations.find(c => c.category === CitationCategory.Treatises);
    expect(c).toBeDefined();
    expect(c?.text).toContain('Wright & Miller');
  });

  test('detects law review article', () => {
    const result = parseText(
      'Jane Doe, Legal Theory, 100 Harv. L. Rev. 123 (2020).'
    );
    const c = result.citations.find(c => c.text.includes('L. Rev.'));
    expect(c).toBeDefined();
    expect(c?.category).toBe(CitationCategory.Treatises);
  });

  test('detects Restatement (Second)', () => {
    const result = parseText('Restatement (Second) of Torts § 402A provides the standard.');
    const c = result.citations.find(c => c.text.includes('Restatement'));
    expect(c).toBeDefined();
    expect(c?.category).toBe(CitationCategory.Treatises);
  });

  test('detects Restatement (Third)', () => {
    const result = parseText('Restatement (Third) of Agency § 2.01 defines authority.');
    const c = result.citations.find(c => c.text.includes('Restatement'));
    expect(c).toBeDefined();
    expect(c?.category).toBe(CitationCategory.Treatises);
  });

  test('detects treatise without volume number', () => {
    const result = parseText(
      'Laurence H. Tribe, American Constitutional Law § 16-14 (3d ed. 2000).'
    );
    const c = result.citations.find(c => c.text.includes('Tribe'));
    expect(c).toBeDefined();
    expect(c?.category).toBe(CitationCategory.Treatises);
  });
});
