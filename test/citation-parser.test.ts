/**
 * Citation Parser Tests
 */

import { parseText, CitationCategory } from '../src/citation-parser';
import { isValidReporter } from '../src/citation-parser/patterns';
import {
  normalizeCitationText,
  extractCaseName,
  extractCitationIdentifier,
  deduplicateCitations,
} from '../src/citation-parser/normalizer';
import * as fs from 'fs';
import * as path from 'path';

describe('Citation Parser', () => {
  describe('Case Citations', () => {
    test('should detect standard case citation', () => {
      const text = 'See Brown v. Board of Education, 347 U.S. 483 (1954).';
      const result = parseText(text);
      
      expect(result.citations.length).toBeGreaterThan(0);
      const caseCitation = result.citations.find(c => c.category === CitationCategory.Cases);
      expect(caseCitation).toBeDefined();
      expect(caseCitation?.text).toContain('Brown v. Board of Education');
      expect(caseCitation?.text).toContain('347 U.S. 483');
    });

    test('should detect In re case', () => {
      const text = 'In re Marriage of Smith, 123 Cal.App.4th 456 (2005).';
      const result = parseText(text);
      
      const caseCitation = result.citations.find(c => 
        c.category === CitationCategory.Cases && c.text.includes('In re')
      );
      expect(caseCitation).toBeDefined();
    });

    test('should detect Ex parte case', () => {
      const text = 'Ex parte Johnson, 456 U.S. 789 (1990).';
      const result = parseText(text);
      
      const caseCitation = result.citations.find(c => 
        c.category === CitationCategory.Cases && c.text.includes('Ex parte')
      );
      expect(caseCitation).toBeDefined();
    });

    test('should detect case with court designation', () => {
      const text = 'Miranda v. Arizona, 384 U.S. 436, 444 (1966).';
      const result = parseText(text);
      
      const caseCitation = result.citations.find(c => c.text.includes('Miranda'));
      expect(caseCitation).toBeDefined();
      expect(caseCitation?.category).toBe(CitationCategory.Cases);
    });

    test('should detect short form case citation', () => {
      const text = 'Brown, 347 U.S. at 485.';
      const result = parseText(text);
      
      const shortCitation = result.citations.find(c => 
        c.text.includes('Brown') && c.text.includes('at')
      );
      expect(shortCitation).toBeDefined();
    });

    test('should detect Id. citation', () => {
      const text = 'Id. at 100.';
      const result = parseText(text);
      
      const idCitation = result.citations.find(c => c.text.includes('Id.'));
      expect(idCitation).toBeDefined();
      expect(idCitation?.isShortForm).toBe(true);
    });
  });

  describe('Statute Citations', () => {
    test('should detect federal statute', () => {
      const text = 'Pursuant to 42 U.S.C. § 1983, plaintiff filed suit.';
      const result = parseText(text);
      
      const statute = result.citations.find(c => c.category === CitationCategory.Statutes);
      expect(statute).toBeDefined();
      expect(statute?.text).toContain('42 U.S.C.');
      expect(statute?.text).toContain('1983');
    });

    test('should detect California statute', () => {
      const text = 'See Cal. Civ. Code § 1542.';
      const result = parseText(text);
      
      const statute = result.citations.find(c => 
        c.category === CitationCategory.Statutes && c.text.includes('Cal.')
      );
      expect(statute).toBeDefined();
    });

    test('should detect New York statute', () => {
      const text = 'N.Y. Gen. Bus. Law § 349 prohibits deceptive practices.';
      const result = parseText(text);
      
      const statute = result.citations.find(c => c.text.includes('N.Y.'));
      expect(statute).toBeDefined();
      expect(statute?.category).toBe(CitationCategory.Statutes);
    });

    test('should detect Texas statute', () => {
      const text = 'Under Tex. Fam. Code Ann. § 6.001, the court may grant a divorce.';
      const result = parseText(text);
      
      const statute = result.citations.find(c => c.text.includes('Tex.'));
      expect(statute).toBeDefined();
    });

    test('should detect Illinois statute', () => {
      const text = 'See 735 ILCS 5/2-1401.';
      const result = parseText(text);
      
      const statute = result.citations.find(c => c.text.includes('ILCS'));
      expect(statute).toBeDefined();
    });
  });

  describe('Constitutional Citations', () => {
    test('should detect U.S. Constitution article', () => {
      const text = 'U.S. Const. art. I, § 8 grants Congress certain powers.';
      const result = parseText(text);
      
      const constitutional = result.citations.find(c => 
        c.category === CitationCategory.Constitutional
      );
      expect(constitutional).toBeDefined();
      expect(constitutional?.text).toContain('art. I');
    });

    test('should detect U.S. Constitution amendment', () => {
      const text = 'The rights protected by U.S. Const. amend. XIV, § 1 are fundamental.';
      const result = parseText(text);
      
      const constitutional = result.citations.find(c => 
        c.category === CitationCategory.Constitutional && c.text.includes('amend. XIV')
      );
      expect(constitutional).toBeDefined();
    });

    test('should detect state constitution', () => {
      const text = 'Cal. Const. art. I, § 7 protects privacy.';
      const result = parseText(text);
      
      const constitutional = result.citations.find(c => 
        c.category === CitationCategory.Constitutional && c.text.includes('Cal.')
      );
      expect(constitutional).toBeDefined();
    });
  });

  describe('Rules Citations', () => {
    test('should detect Federal Rules of Civil Procedure', () => {
      const text = 'Under Fed. R. Civ. P. 12(b)(6), defendants moved to dismiss.';
      const result = parseText(text);
      
      const rule = result.citations.find(c => c.category === CitationCategory.Rules);
      expect(rule).toBeDefined();
      expect(rule?.text).toContain('Fed. R. Civ. P.');
    });

    test('should detect Federal Rules of Evidence', () => {
      const text = 'Fed. R. Evid. 702 governs expert testimony.';
      const result = parseText(text);
      
      const rule = result.citations.find(c => c.text.includes('Fed. R. Evid.'));
      expect(rule).toBeDefined();
    });

    test('should detect Federal Rules of Appellate Procedure', () => {
      const text = 'See Fed. R. App. P. 4(a)(1).';
      const result = parseText(text);
      
      const rule = result.citations.find(c => c.text.includes('Fed. R. App. P.'));
      expect(rule).toBeDefined();
    });

    test('should detect California Rules of Court', () => {
      const text = 'Cal. Rules of Court, rule 8.204 governs appellate briefs.';
      const result = parseText(text);
      
      const rule = result.citations.find(c => c.text.includes('Cal. Rules of Court'));
      expect(rule).toBeDefined();
    });
  });

  describe('Regulations Citations', () => {
    test('should detect Code of Federal Regulations', () => {
      const text = 'The regulation at 28 C.F.R. § 35.130 prohibits discrimination.';
      const result = parseText(text);
      
      const regulation = result.citations.find(c => c.category === CitationCategory.Regulations);
      expect(regulation).toBeDefined();
      expect(regulation?.text).toContain('28 C.F.R.');
    });

    test('should detect Federal Register citation', () => {
      const text = 'See 85 Fed. Reg. 12345 (Mar. 1, 2020).';
      const result = parseText(text);
      
      const regulation = result.citations.find(c => c.text.includes('Fed. Reg.'));
      expect(regulation).toBeDefined();
    });
  });

  describe('Treatises & Secondary Sources', () => {
    test('should detect treatise citation', () => {
      const text = '5 Wright & Miller, Federal Practice and Procedure § 1357 (3d ed. 2004).';
      const result = parseText(text);
      
      const treatise = result.citations.find(c => c.category === CitationCategory.Treatises);
      expect(treatise).toBeDefined();
      expect(treatise?.text).toContain('Wright & Miller');
    });

    test('should detect law review article', () => {
      const text = 'Laurence H. Tribe, Constitutional Choices, 100 Harv. L. Rev. 123 (2020).';
      const result = parseText(text);
      
      const article = result.citations.find(c => c.text.includes('L. Rev.'));
      expect(article).toBeDefined();
    });

    test('should detect Restatement', () => {
      const text = 'Restatement (Second) of Torts § 402A provides the standard.';
      const result = parseText(text);
      
      const restatement = result.citations.find(c => c.text.includes('Restatement'));
      expect(restatement).toBeDefined();
    });
  });

  describe('Normalization', () => {
    test('should normalize U.S.C. variations', () => {
      expect(normalizeCitationText('42 USC 1983')).toContain('U.S.C.');
      expect(normalizeCitationText('42 U.S.C. 1983')).toContain('U.S.C.');
    });

    test('should standardize "versus" to "v."', () => {
      expect(normalizeCitationText('Smith vs. Jones')).toContain(' v. ');
      expect(normalizeCitationText('Smith versus Jones')).toContain(' v. ');
    });

    test('should extract case name correctly', () => {
      const name = extractCaseName('Brown v. Board of Education, 347 U.S. 483 (1954)');
      expect(name).toBe('Brown v. Board of Education');
    });

    test('should extract In re case name', () => {
      const name = extractCaseName('In re Marriage of Smith, 123 Cal.App.4th 456 (2005)');
      expect(name).toContain('In re');
    });

    test('should extract citation identifier for cases', () => {
      const id = extractCitationIdentifier(
        'Brown v. Board of Education, 347 U.S. 483 (1954)',
        CitationCategory.Cases
      );
      expect(id).toBe('347 U.S. 483');
    });

    test('should extract citation identifier for statutes', () => {
      const id = extractCitationIdentifier('42 U.S.C. § 1983', CitationCategory.Statutes);
      expect(id).toContain('42 U.S.C.');
      expect(id).toContain('1983');
    });
  });

  describe('Deduplication', () => {
    test('should merge duplicate citations with different page numbers', () => {
      const citations = [
        {
          id: '1',
          text: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          normalizedText: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          originalText: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          category: CitationCategory.Cases,
          pages: [5],
          isShortForm: false,
          isIncluded: true,
        },
        {
          id: '2',
          text: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          normalizedText: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          originalText: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          category: CitationCategory.Cases,
          pages: [10],
          isShortForm: false,
          isIncluded: true,
        },
      ];

      const deduped = deduplicateCitations(citations);
      
      expect(deduped).toHaveLength(1);
      expect(deduped[0].pages).toContain(5);
      expect(deduped[0].pages).toContain(10);
    });
  });

  describe('Sample Brief Integration', () => {
    test('should parse sample brief fixture', () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'sample-brief.txt');
      const text = fs.readFileSync(fixturePath, 'utf-8');
      
      const result = parseText(text);
      
      // Should find multiple citations
      expect(result.citations.length).toBeGreaterThan(10);
      
      // Should find all major categories
      const categories = new Set(result.citations.map(c => c.category));
      expect(categories.has(CitationCategory.Cases)).toBe(true);
      expect(categories.has(CitationCategory.Statutes)).toBe(true);
      expect(categories.has(CitationCategory.Constitutional)).toBe(true);
      expect(categories.has(CitationCategory.Rules)).toBe(true);
      
      // Should find specific citations
      expect(result.citations.some(c => c.text.includes('Brown v. Board'))).toBe(true);
      expect(result.citations.some(c => c.text.includes('42 U.S.C.'))).toBe(true);
      expect(result.citations.some(c => c.text.includes('U.S. Const. amend. XIV'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle citations with parentheses in subsections', () => {
      const text = 'Fed. R. Civ. P. 12(b)(6) requires specific pleading.';
      const result = parseText(text);
      
      const rule = result.citations.find(c => c.text.includes('12(b)(6)'));
      expect(rule).toBeDefined();
    });

    test('should handle multi-word state abbreviations', () => {
      const text = 'N.Y. Gen. Bus. Law § 349 applies.';
      const result = parseText(text);
      
      const statute = result.citations.find(c => c.text.includes('N.Y.'));
      expect(statute).toBeDefined();
    });

    test('should handle citations across multiple lines', () => {
      const text = `See Brown v. Board of Education,
        347 U.S. 483 (1954).`;
      const result = parseText(text);
      
      // This might not work perfectly without better regex, but should handle basic cases
      const citations = result.citations.filter(c => c.category === CitationCategory.Cases);
      expect(citations.length).toBeGreaterThan(0);
    });
  });

  describe('Reporter Validation', () => {
    test('should validate common reporters', () => {
      expect(isValidReporter('U.S.')).toBe(true);
      expect(isValidReporter('F.3d')).toBe(true);
      expect(isValidReporter('Cal.4th')).toBe(true);
      expect(isValidReporter('InvalidReporter')).toBe(false);
    });
  });
});
