import { parseText, CitationCategory } from '../../src/citation-parser';

describe('Citation Parser – Case Citations', () => {
  test('detects standard case citation', () => {
    const result = parseText('See Brown v. Board of Education, 347 U.S. 483 (1954).');
    const c = result.citations.find(c => c.category === CitationCategory.Cases);
    expect(c).toBeDefined();
    expect(c?.text).toContain('Brown v. Board of Education');
    expect(c?.text).toContain('347 U.S. 483');
  });

  test('detects case with pinpoint page', () => {
    const result = parseText('Miranda v. Arizona, 384 U.S. 436, 444 (1966).');
    const c = result.citations.find(c => c.text.includes('Miranda'));
    expect(c).toBeDefined();
    expect(c?.category).toBe(CitationCategory.Cases);
  });

  test('detects In re case', () => {
    const result = parseText('In re Marriage of Smith, 123 Cal.App.4th 456 (2005).');
    const c = result.citations.find(c =>
      c.category === CitationCategory.Cases && c.text.includes('In re')
    );
    expect(c).toBeDefined();
  });

  test('detects Ex parte case', () => {
    const result = parseText('Ex parte Johnson, 456 U.S. 789 (1990).');
    const c = result.citations.find(c =>
      c.category === CitationCategory.Cases && c.text.includes('Ex parte')
    );
    expect(c).toBeDefined();
  });

  test('detects case with court designation', () => {
    const result = parseText('Smith v. Jones, 450 F.3d 234 (5th Cir. 2006).');
    const c = result.citations.find(c => c.text.includes('Smith v. Jones'));
    expect(c).toBeDefined();
    expect(c?.category).toBe(CitationCategory.Cases);
  });

  test('detects Supreme Court case with S.Ct. reporter', () => {
    const result = parseText('Roe v. Wade, 93 S.Ct. 705 (1973).');
    const c = result.citations.find(c => c.text.includes('Roe v. Wade'));
    expect(c).toBeDefined();
  });

  test('detects case with multi-word party names', () => {
    const result = parseText('Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007).');
    const c = result.citations.find(c => c.text.includes('Twombly'));
    expect(c).toBeDefined();
  });

  test('detects case with ampersand in party name', () => {
    const result = parseText('AT&T Mobility LLC v. Concepcion, 563 U.S. 333 (2011).');
    const c = result.citations.find(c => c.text.includes('Concepcion'));
    expect(c).toBeDefined();
  });

  test('detects short form case citation', () => {
    const result = parseText('Brown, 347 U.S. at 485.');
    const c = result.citations.find(c => c.text.includes('Brown') && c.text.includes('at'));
    expect(c).toBeDefined();
  });

  test('detects Id. citation', () => {
    const result = parseText('Id. at 100.');
    const c = result.citations.find(c => c.text.includes('Id.'));
    expect(c).toBeDefined();
    expect(c?.isShortForm).toBe(true);
  });

  test('detects multiple cases in one sentence', () => {
    const result = parseText(
      'See Loving v. Virginia, 388 U.S. 1 (1967); Obergefell v. Hodges, 576 U.S. 644 (2015).'
    );
    const cases = result.citations.filter(c => c.category === CitationCategory.Cases);
    expect(cases.length).toBeGreaterThanOrEqual(2);
  });

  test('detects supra citation', () => {
    const result = parseText('Brown, supra, at 495.');
    const c = result.citations.find(c => c.text.includes('supra'));
    expect(c).toBeDefined();
    expect(c?.isShortForm).toBe(true);
  });

  test('detects state court case with regional reporter', () => {
    const result = parseText('People v. Smith, 45 N.E.2d 123 (Ill. 2003).');
    const c = result.citations.find(c => c.text.includes('People v. Smith'));
    expect(c).toBeDefined();
  });

  test('detects Second Circuit case', () => {
    const result = parseText('Garcia v. City of New York, 200 F.Supp.3d 100 (S.D.N.Y. 2016).');
    const c = result.citations.find(c => c.text.includes('Garcia'));
    expect(c).toBeDefined();
  });

  test('detects case from F.4th reporter', () => {
    const result = parseText('Doe v. Roe, 22 F.4th 400 (9th Cir. 2022).');
    const c = result.citations.find(c => c.text.includes('Doe v. Roe'));
    expect(c).toBeDefined();
  });
});
