/**
 * TOA Generator Tests
 */

import {
  generateTableOfAuthorities,
  formatPageNumbers,
  formatCaseName,
  getCitationCounts,
} from '../src/toa-generator';
import { Citation, CitationCategory } from '../src/citation-parser/types';

// Helper to create test citations
function createCitation(
  text: string,
  category: CitationCategory,
  pages: number[]
): Citation {
  return {
    id: Math.random().toString(),
    text,
    originalText: text,
    normalizedText: text.toLowerCase(),
    category,
    pages,
    isShortForm: false,
    isIncluded: true,
  };
}

describe('TOA Generator', () => {
  describe('Page Number Formatting', () => {
    test('should format single page number', () => {
      const result = formatPageNumbers([5], {
        passimThreshold: 6,
        maxLineLength: 80,
        includePageCounts: false,
        useDotLeaders: true,
        wrapIndent: '  ',
      });
      
      expect(result).toBe('5');
    });

    test('should format multiple page numbers', () => {
      const result = formatPageNumbers([3, 7, 12], {
        passimThreshold: 6,
        maxLineLength: 80,
        includePageCounts: false,
        useDotLeaders: true,
        wrapIndent: '  ',
      });
      
      expect(result).toBe('3, 7, 12');
    });

    test('should sort page numbers', () => {
      const result = formatPageNumbers([12, 3, 7], {
        passimThreshold: 6,
        maxLineLength: 80,
        includePageCounts: false,
        useDotLeaders: true,
        wrapIndent: '  ',
      });
      
      expect(result).toBe('3, 7, 12');
    });

    test('should use passim for 6+ pages', () => {
      const result = formatPageNumbers([2, 5, 8, 9, 12, 15, 20], {
        passimThreshold: 6,
        maxLineLength: 80,
        includePageCounts: false,
        useDotLeaders: true,
        wrapIndent: '  ',
      });
      
      expect(result).toContain('passim');
      expect(result).toContain('2');
    });

    test('should respect custom passim threshold', () => {
      const result = formatPageNumbers([1, 2, 3, 4, 5], {
        passimThreshold: 4,
        maxLineLength: 80,
        includePageCounts: false,
        useDotLeaders: true,
        wrapIndent: '  ',
      });
      
      expect(result).toContain('passim');
    });

    test('should remove duplicate page numbers', () => {
      const result = formatPageNumbers([5, 5, 5, 10], {
        passimThreshold: 6,
        maxLineLength: 80,
        includePageCounts: false,
        useDotLeaders: true,
        wrapIndent: '  ',
      });
      
      expect(result).toBe('5, 10');
    });
  });

  describe('Case Name Formatting', () => {
    test('should mark case name for italics with v.', () => {
      const result = formatCaseName('Brown v. Board of Education, 347 U.S. 483 (1954)');
      expect(result).toContain('_Brown v. Board of Education_');
    });

    test('should mark In re case for italics', () => {
      const result = formatCaseName('In re Marriage of Smith, 123 Cal.App.4th 456 (2005)');
      expect(result).toContain('_In re Marriage of Smith_');
    });

    test('should mark Ex parte case for italics', () => {
      const result = formatCaseName('Ex parte Johnson, 456 U.S. 789 (1990)');
      expect(result).toContain('_Ex parte Johnson_');
    });

    test('should not modify non-case text', () => {
      const text = '42 U.S.C. § 1983';
      const result = formatCaseName(text);
      expect(result).toBe(text);
    });
  });

  describe('Table Generation', () => {
    test('should generate TOA with single category', () => {
      const citations = [
        createCitation('Brown v. Board of Education, 347 U.S. 483 (1954)', CitationCategory.Cases, [5, 10]),
        createCitation('Miranda v. Arizona, 384 U.S. 436 (1966)', CitationCategory.Cases, [8]),
      ];

      const result = generateTableOfAuthorities(citations);

      expect(result).toContain('TABLE OF AUTHORITIES');
      expect(result).toContain('CASES');
      expect(result).toContain('Brown v. Board of Education');
      expect(result).toContain('Miranda v. Arizona');
      expect(result).toContain('5, 10');
      expect(result).toContain('8');
    });

    test('should generate TOA with multiple categories', () => {
      const citations = [
        createCitation('Brown v. Board of Education, 347 U.S. 483 (1954)', CitationCategory.Cases, [5]),
        createCitation('42 U.S.C. § 1983', CitationCategory.Statutes, [10]),
        createCitation('U.S. Const. amend. XIV, § 1', CitationCategory.Constitutional, [15]),
        createCitation('Fed. R. Civ. P. 12(b)(6)', CitationCategory.Rules, [20]),
      ];

      const result = generateTableOfAuthorities(citations);

      expect(result).toContain('CASES');
      expect(result).toContain('STATUTES');
      expect(result).toContain('CONSTITUTIONAL PROVISIONS');
      expect(result).toContain('RULES');
      expect(result).toContain('Brown v. Board of Education');
      expect(result).toContain('42 U.S.C.');
      expect(result).toContain('U.S. Const. amend. XIV');
      expect(result).toContain('Fed. R. Civ. P.');
    });

    test('should sort citations alphabetically within category', () => {
      const citations = [
        createCitation('Zebra Corp. v. Apple Inc., 123 F.3d 456 (2000)', CitationCategory.Cases, [5]),
        createCitation('Apple Inc. v. Samsung, 789 F.3d 123 (2010)', CitationCategory.Cases, [10]),
        createCitation('Microsoft v. Google, 456 F.3d 789 (2005)', CitationCategory.Cases, [15]),
      ];

      const result = generateTableOfAuthorities(citations);

      const appleIndex = result.indexOf('Apple Inc. v. Samsung');
      const microsoftIndex = result.indexOf('Microsoft v. Google');
      const zebraIndex = result.indexOf('Zebra Corp. v. Apple Inc.');

      expect(appleIndex).toBeLessThan(microsoftIndex);
      expect(microsoftIndex).toBeLessThan(zebraIndex);
    });

    test('should use dot leaders when enabled', () => {
      const citations = [
        createCitation('Brown v. Board of Education, 347 U.S. 483 (1954)', CitationCategory.Cases, [5]),
      ];

      const result = generateTableOfAuthorities(citations, {
        format: { useDotLeaders: true },
      });

      expect(result).toContain('.');
    });

    test('should respect onlyIncluded option', () => {
      const citations = [
        { ...createCitation('Brown v. Board, 347 U.S. 483 (1954)', CitationCategory.Cases, [5]), isIncluded: true },
        { ...createCitation('Miranda v. Arizona, 384 U.S. 436 (1966)', CitationCategory.Cases, [10]), isIncluded: false },
      ];

      const result = generateTableOfAuthorities(citations, { onlyIncluded: true });

      expect(result).toContain('Brown');
      expect(result).not.toContain('Miranda');
    });

    test('should exclude short-form citations from TOA', () => {
      const citations = [
        createCitation('Brown v. Board of Education, 347 U.S. 483 (1954)', CitationCategory.Cases, [5]),
        { ...createCitation('Id. at 485', CitationCategory.Cases, [6]), isShortForm: true },
      ];

      const result = generateTableOfAuthorities(citations);

      expect(result).toContain('Brown');
      expect(result).not.toContain('Id.');
    });

    test('should handle empty citations list', () => {
      const result = generateTableOfAuthorities([]);

      expect(result).toContain('TABLE OF AUTHORITIES');
      // Should have header but no citations
    });

    test('should handle category with no citations', () => {
      const citations = [
        createCitation('Brown v. Board of Education, 347 U.S. 483 (1954)', CitationCategory.Cases, [5]),
      ];

      const result = generateTableOfAuthorities(citations);

      // Should only show CASES category
      expect(result).toContain('CASES');
      expect(result).not.toContain('STATUTES');
    });
  });

  describe('Citation Counts', () => {
    test('should count citations by category', () => {
      const citations = [
        createCitation('Brown v. Board, 347 U.S. 483 (1954)', CitationCategory.Cases, [5]),
        createCitation('Miranda v. Arizona, 384 U.S. 436 (1966)', CitationCategory.Cases, [10]),
        createCitation('42 U.S.C. § 1983', CitationCategory.Statutes, [15]),
        createCitation('U.S. Const. amend. XIV', CitationCategory.Constitutional, [20]),
      ];

      const counts = getCitationCounts(citations);

      expect(counts.get(CitationCategory.Cases)).toBe(2);
      expect(counts.get(CitationCategory.Statutes)).toBe(1);
      expect(counts.get(CitationCategory.Constitutional)).toBe(1);
    });

    test('should exclude non-included citations from counts', () => {
      const citations = [
        createCitation('Brown v. Board, 347 U.S. 483 (1954)', CitationCategory.Cases, [5]),
        { ...createCitation('Miranda v. Arizona, 384 U.S. 436 (1966)', CitationCategory.Cases, [10]), isIncluded: false },
      ];

      const counts = getCitationCounts(citations);

      expect(counts.get(CitationCategory.Cases)).toBe(1);
    });

    test('should exclude short-form citations from counts', () => {
      const citations = [
        createCitation('Brown v. Board, 347 U.S. 483 (1954)', CitationCategory.Cases, [5]),
        { ...createCitation('Id. at 485', CitationCategory.Cases, [6]), isShortForm: true },
      ];

      const counts = getCitationCounts(citations);

      expect(counts.get(CitationCategory.Cases)).toBe(1);
    });
  });

  describe('Integration: Complete TOA', () => {
    test('should generate realistic TOA', () => {
      const citations = [
        createCitation('Brown v. Board of Education, 347 U.S. 483 (1954)', CitationCategory.Cases, [3, 7, 12]),
        createCitation('Marbury v. Madison, 5 U.S. 137 (1803)', CitationCategory.Cases, [5]),
        createCitation('Miranda v. Arizona, 384 U.S. 436 (1966)', CitationCategory.Cases, [2, 8, 15]),
        createCitation('42 U.S.C. § 1983', CitationCategory.Statutes, [4, 9]),
        createCitation('28 U.S.C. § 1331', CitationCategory.Statutes, [6]),
        createCitation('U.S. Const. amend. XIV, § 1', CitationCategory.Constitutional, [10]),
        createCitation('Fed. R. Civ. P. 12(b)(6)', CitationCategory.Rules, [11]),
        createCitation('28 C.F.R. § 35.130', CitationCategory.Regulations, [13]),
      ];

      const result = generateTableOfAuthorities(citations);

      // Check structure
      expect(result).toContain('TABLE OF AUTHORITIES');
      
      // Check all categories appear in correct order
      const casesIndex = result.indexOf('CASES');
      const statutesIndex = result.indexOf('STATUTES');
      const constIndex = result.indexOf('CONSTITUTIONAL PROVISIONS');
      const rulesIndex = result.indexOf('RULES');
      const regsIndex = result.indexOf('REGULATIONS');

      expect(casesIndex).toBeGreaterThan(0);
      expect(casesIndex).toBeLessThan(statutesIndex);
      expect(statutesIndex).toBeLessThan(constIndex);
      expect(constIndex).toBeLessThan(rulesIndex);
      expect(rulesIndex).toBeLessThan(regsIndex);

      // Check specific citations
      expect(result).toContain('Brown v. Board of Education');
      expect(result).toContain('3, 7, 12');
      expect(result).toContain('42 U.S.C. § 1983');
      expect(result).toContain('4, 9');
    });
  });

  describe('Formatting Options', () => {
    test('should respect custom passim threshold', () => {
      const citations = [
        createCitation('Brown v. Board, 347 U.S. 483 (1954)', CitationCategory.Cases, [1, 2, 3, 4, 5]),
      ];

      const result = generateTableOfAuthorities(citations, {
        format: { passimThreshold: 4 },
      });

      expect(result).toContain('passim');
    });

    test('should generate OOXML when requested', () => {
      const citations = [
        createCitation('Brown v. Board, 347 U.S. 483 (1954)', CitationCategory.Cases, [5]),
      ];

      const result = generateTableOfAuthorities(citations, { asOOXML: true });

      expect(result).toContain('<w:document');
      expect(result).toContain('<w:i/>'); // Italic tag
    });
  });
});
