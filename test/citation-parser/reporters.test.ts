import { isValidReporter, REPORTER_ABBREVIATIONS } from '../../src/citation-parser/patterns';

describe('Citation Parser – Reporter Validation', () => {
  test('validates U.S. reporter', () => {
    expect(isValidReporter('U.S.')).toBe(true);
  });

  test('validates federal appellate reporters', () => {
    expect(isValidReporter('F.3d')).toBe(true);
    expect(isValidReporter('F.4th')).toBe(true);
  });

  test('validates federal supplement reporters', () => {
    expect(isValidReporter('F.Supp.2d')).toBe(true);
    expect(isValidReporter('F.Supp.3d')).toBe(true);
  });

  test('validates California reporters', () => {
    expect(isValidReporter('Cal.4th')).toBe(true);
  });

  test('validates New York reporters', () => {
    expect(isValidReporter('N.Y.2d')).toBe(true);
    expect(isValidReporter('N.E.2d')).toBe(true);
  });

  test('validates regional reporters', () => {
    expect(isValidReporter('P.3d')).toBe(true);
    expect(isValidReporter('A.3d')).toBe(true);
    expect(isValidReporter('S.W.3d')).toBe(true);
    expect(isValidReporter('S.E.2d')).toBe(true);
    expect(isValidReporter('So.3d')).toBe(true);
    expect(isValidReporter('N.W.2d')).toBe(true);
  });

  test('rejects invalid reporters', () => {
    expect(isValidReporter('InvalidReporter')).toBe(false);
    expect(isValidReporter('Fake.3d')).toBe(false);
    expect(isValidReporter('')).toBe(false);
  });

  test('has comprehensive reporter list (>20 entries)', () => {
    expect(REPORTER_ABBREVIATIONS.length).toBeGreaterThan(20);
  });
});
