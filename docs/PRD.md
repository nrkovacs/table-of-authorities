# Product Requirements Document: Table of Authorities Add-in for Microsoft Word

**Version:** 1.0  
**Date:** February 16, 2026  
**Author:** OpenClaw Development Team

---

## Executive Summary

This document outlines the requirements for a Microsoft Word Add-in that automates the creation of Tables of Authorities (TOA) for legal briefs. The add-in will use intelligent pattern matching to detect legal citations, categorize them, and generate a properly formatted Table of Authorities that complies with legal citation standards.

---

## 1. Problem Statement

### 1.1 Current Pain Points

Legal professionals face significant challenges when creating Tables of Authorities:

1. **Manual Labor**: Microsoft Word's built-in TOA feature requires manually marking every citation with a TA (Table of Authorities Entry) field, which is extremely time-consuming
2. **Error-Prone**: Manual marking leads to missed citations, duplicates, and categorization errors
3. **Time-Intensive**: A typical appellate brief with 50+ citations can take 2-3 hours to mark manually
4. **Last-Minute Changes**: When citations are added or removed late in the drafting process, the entire TOA must be reviewed and updated
5. **Learning Curve**: Junior attorneys and paralegals often struggle with Word's TA field syntax
6. **Inconsistent Results**: Different staff members may categorize the same citation differently

### 1.2 Impact

- **Billable Hours Lost**: 2-3 hours per brief × $200-400/hour = $400-1,200 wasted per document
- **Deadline Stress**: TOA creation is often rushed at the last minute before filing deadlines
- **Quality Issues**: Manual errors can damage credibility with courts

---

## 2. Target Users

### 2.1 Primary Users

1. **Paralegals** (40% of users)
   - Typically responsible for finalizing briefs
   - Need fast, reliable automation
   - May have limited technical expertise

2. **Associate Attorneys** (35% of users)
   - Draft briefs and need to check TOA accuracy
   - Value time savings and accuracy
   - Comfortable with technology

3. **Legal Secretaries** (15% of users)
   - Format and finalize documents
   - Need simple, foolproof tools

### 2.2 Secondary Users

4. **Solo Practitioners** (10% of users)
   - Handle all aspects of brief preparation
   - Price-sensitive
   - Need efficiency tools

---

## 3. Product Vision

**"One-Click Table of Authorities"**

A Microsoft Word Add-in that scans a legal brief, intelligently detects and categorizes all citations, and generates a court-ready Table of Authorities in seconds — transforming a 2-hour manual task into a 2-minute automated process.

---

## 4. Core Features

### 4.1 Automatic Citation Detection

**Description**: Scan the entire Word document and identify legal citations using pattern matching.

**Citation Categories** (in standard order):

1. **Cases**
   - Pattern: `Party Name v. Party Name, Volume Reporter Page (Court Year)`
   - Examples: 
     - `Brown v. Board of Education, 347 U.S. 483 (1954)`
     - `Marbury v. Madison, 5 U.S. 137 (1803)`
     - `In re Marriage of Smith, 123 Cal.App.4th 456 (2005)`

2. **Statutes**
   - Federal: `XX U.S.C. § XXXX`
   - State: Various formats
     - `Cal. Civ. Code § XXX`
     - `N.Y. Gen. Bus. Law § XXX`
     - `Tex. Fam. Code Ann. § XXX`
   - Examples:
     - `42 U.S.C. § 1983`
     - `Cal. Civ. Code § 1542`

3. **Constitutional Provisions**
   - Federal: `U.S. Const. art. [I-VII] | amend. [I-XXVII]`
   - State: `[State] Const. art. X, § Y`
   - Examples:
     - `U.S. Const. amend. XIV, § 1`
     - `Cal. Const. art. I, § 7`

4. **Rules**
   - Federal Rules of Civil Procedure: `Fed. R. Civ. P. XX`
   - Federal Rules of Evidence: `Fed. R. Evid. XXX`
   - Federal Rules of Appellate Procedure: `Fed. R. App. P. XX`
   - State rules: Various formats
   - Examples:
     - `Fed. R. Civ. P. 12(b)(6)`
     - `Fed. R. Evid. 702`

5. **Regulations**
   - Code of Federal Regulations: `XX C.F.R. § XX.XXX`
   - Examples:
     - `28 C.F.R. § 35.130`
     - `40 C.F.R. § 1508.27`

6. **Treatises & Secondary Sources**
   - Law review articles, treatises, legal encyclopedias
   - Examples:
     - `5 Wright & Miller, Federal Practice and Procedure § 1357 (3d ed. 2004)`
     - `1 Witkin, Summary of Cal. Law § 123 (10th ed. 2005)`
     - `Jane Doe, Legal Theory in Practice, 100 Harv. L. Rev. 123 (2020)`

7. **Other Authorities**
   - Legislative history, executive materials, internet sources
   - Anything not fitting the above categories

**Technical Requirements**:
- Use regex patterns for each citation type
- Handle short-form citations (`Id.`, `Id. at XX`, `Smith, supra, at XX`)
- Detect citations across line breaks
- Ignore citations in footnotes/endnotes (configurable)
- Case-insensitive matching where appropriate

### 4.2 Citation Normalization

**Description**: Clean and standardize detected citations.

**Features**:
- **Deduplication**: Identify when the same authority is cited multiple times
- **Short vs. Long Form**: Link short-form citations to their full citation
  - "Brown, 347 U.S. at 485" → "Brown v. Board of Education, 347 U.S. 483 (1954)"
  - "Id. at 100" → link to previous citation
- **Case Name Formatting**: Standardize italics, capitalization
- **Citation Variants**: Recognize different ways of citing the same authority
  - "42 USC 1983" vs. "42 U.S.C. § 1983"

### 4.3 Page Number Tracking

**Description**: Track which page(s) of the brief each citation appears on.

**Features**:
- Use Office.js API to get page numbers
- Handle citations spanning multiple pages
- Support "passim" notation (6+ different pages)
- Account for page breaks and sections
- Exclude citations in Table of Contents, TOA itself

### 4.4 Review & Edit Interface

**Description**: Task pane UI for reviewing detected citations before generating TOA.

**UI Elements**:
- **Scan Button**: "Scan Document for Citations"
- **Citation List**: Grouped by category, with:
  - Checkbox for each citation (include/exclude)
  - Citation text (editable)
  - Category dropdown (re-categorize if needed)
  - Page numbers (display only)
  - Count of occurrences
- **Statistics**: 
  - Total citations found
  - Breakdown by category
  - Estimated time saved
- **Actions**:
  - "Remove Duplicate"
  - "Mark as Short Form of..."
  - "Edit Citation Text"

### 4.5 TOA Generation

**Description**: Generate and insert a properly formatted Table of Authorities.

**Formatting Requirements**:
- **Category Headers**: Bold, all caps (e.g., "CASES")
- **Alphabetical Sorting**: Within each category
- **Dot Leaders**: Between citation and page numbers
- **Page Number Format**: 
  - Single page: `5`
  - Multiple pages: `3, 7, 12`
  - Passim: `2, 5, 8, 9, 12, 15, passim`
- **Case Name Italics**: Automatically italicize party names
- **Spacing**: Proper line spacing and indentation
- **Alignment**: Citation left-aligned, page numbers right-aligned

**Insertion Options**:
- Insert at cursor position
- Insert at beginning of document
- Replace existing TOA
- Preview before inserting

### 4.6 Settings & Configuration

**Description**: User-configurable options.

**Settings**:
- Include/exclude footnotes
- Passim threshold (default: 6 pages)
- Custom category order
- Citation format preferences (Bluebook, ALWD, California Style Manual)
- Auto-scan on document open (opt-in)

---

## 5. User Experience Flow

### 5.1 First-Time User Flow

1. User installs add-in from Office Store
2. Opens a legal brief in Word
3. Clicks "Table of Authorities" in ribbon/task pane
4. Task pane opens with brief tutorial
5. Clicks "Scan Document" button
6. Add-in scans document (progress indicator)
7. Citations appear in categorized list
8. User reviews citations (can edit/remove/recategorize)
9. Clicks "Generate Table of Authorities"
10. TOA is inserted at cursor position
11. Success message with statistics

### 5.2 Returning User Flow

1. Opens legal brief
2. Opens task pane (one click)
3. Clicks "Scan Document"
4. Reviews detected citations (quick scan)
5. Clicks "Generate TOA"
6. Done

### 5.3 Edge Cases

- **No citations found**: Display helpful message with tips
- **Ambiguous citations**: Flag for user review
- **Document too large**: Show progress, allow cancellation
- **Existing TOA**: Prompt to replace or insert new
- **Unsupported citation format**: Add to "Other Authorities" with flag

---

## 6. Technical Architecture

### 6.1 Technology Stack

- **Platform**: Office Add-in (Office.js)
- **Frontend**: React + TypeScript
- **UI Framework**: Fluent UI (Office Fabric UI)
- **Build Tool**: Webpack
- **Testing**: Jest + React Testing Library
- **Package Manager**: npm

### 6.2 System Components

```
┌─────────────────────────────────────────┐
│         Word Document                    │
│  (via Office.js API)                     │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│      Task Pane Controller                │
│  - Scan document                         │
│  - Coordinate components                 │
│  - Handle user interactions              │
└───────┬──────────────────────────┬───────┘
        │                          │
        ▼                          ▼
┌──────────────────┐      ┌──────────────────┐
│ Citation Parser  │      │   TOA Generator  │
│ - Regex patterns │      │ - Format output  │
│ - Normalizer     │      │ - Sort citations │
│ - Categorizer    │      │ - Apply styling  │
└──────────────────┘      └──────────────────┘
        │                          │
        └──────────┬───────────────┘
                   ▼
           ┌──────────────┐
           │  React UI    │
           │ - Citation   │
           │   list       │
           │ - Controls   │
           └──────────────┘
```

### 6.3 Key Modules

**Citation Parser Module** (`src/citation-parser/`)
- `patterns.ts`: Regex patterns for each citation type
- `index.ts`: Main parser orchestrator
- `types.ts`: TypeScript interfaces
- `categories.ts`: Category definitions
- `normalizer.ts`: Deduplication and normalization logic

**TOA Generator Module** (`src/toa-generator/`)
- `index.ts`: Main generation logic
- `formatter.ts`: Formatting with dot leaders, passim, etc.

**Task Pane Module** (`src/taskpane/`)
- `taskpane.ts`: Main entry point, Office.js integration
- `taskpane.html`: UI structure
- `taskpane.css`: Styling
- `components/`: React components

### 6.4 Data Models

**Citation Interface**:
```typescript
interface Citation {
  id: string;
  text: string;              // Full citation text
  shortText?: string;        // Short form if applicable
  category: CitationCategory;
  pages: number[];           // Page numbers where it appears
  isShortForm: boolean;
  parentCitationId?: string; // For short forms
  isIncluded: boolean;       // User can exclude
}
```

**Citation Category Enum**:
```typescript
enum CitationCategory {
  Cases = 'Cases',
  Statutes = 'Statutes',
  Constitutional = 'Constitutional Provisions',
  Rules = 'Rules',
  Regulations = 'Regulations',
  Treatises = 'Treatises',
  Other = 'Other Authorities'
}
```

### 6.5 Office.js Integration

**Document Reading**:
```typescript
await Word.run(async (context) => {
  const paragraphs = context.document.body.paragraphs;
  paragraphs.load('text, pageNumber');
  await context.sync();
  // Extract text with page numbers
});
```

**TOA Insertion**:
```typescript
await Word.run(async (context) => {
  const range = context.document.getSelection();
  range.insertParagraph(toaText, Word.InsertLocation.before);
  // Apply formatting via OOXML
});
```

### 6.6 Performance Considerations

- **Large Documents**: Process in chunks, show progress
- **Real-Time Feedback**: Debounce user edits
- **Caching**: Cache parsed citations until document changes
- **Lazy Loading**: Load UI components on demand

---

## 7. Testing Strategy

### 7.1 Unit Tests

**Citation Parser Tests** (`test/citation-parser.test.ts`):
- Test each regex pattern individually (30+ test cases)
- Test edge cases:
  - Citations with unusual punctuation
  - Multi-line citations
  - Nested parentheses
  - Unicode characters (em dash, etc.)
  - State-specific citation formats
- Test normalizer:
  - Deduplication logic
  - Short-form resolution
  - Case name standardization

**TOA Generator Tests** (`test/toa-generator.test.ts`):
- Test alphabetical sorting
- Test dot leader generation
- Test passim logic (6+ pages)
- Test category grouping
- Test page number formatting

### 7.2 Integration Tests

- Test full scan-to-generation flow with sample document
- Test Office.js API mocks
- Test UI interactions

### 7.3 Test Fixtures

**Sample Brief** (`test/fixtures/sample-brief.txt`):
- Realistic legal brief text (5-10 pages)
- Include all citation types
- Include famous cases (Brown, Marbury, Miranda, Roe, etc.)
- Include Id., supra citations
- Include edge cases

**Test Brief Document** (`test/fixtures/test-brief.docx`):
- Word document for manual testing
- Pre-populated with diverse citations
- Can be sideloaded with add-in for end-to-end testing

### 7.4 Test Coverage Goals

- Citation parser: >95% coverage
- TOA generator: >90% coverage
- Overall: >85% coverage

---

## 8. Success Metrics

### 8.1 Performance Metrics

- **Scan Speed**: <5 seconds for 50-page document
- **Accuracy**: >95% citation detection rate
- **False Positives**: <5% of detected citations
- **Time Savings**: Reduce 2-hour task to <5 minutes

### 8.2 User Satisfaction Metrics

- **Net Promoter Score (NPS)**: Target >50
- **User Retention**: >70% monthly active usage
- **Support Tickets**: <5% of users need support
- **User Rating**: >4.5 stars (Office Store)

### 8.3 Business Metrics

- **Downloads**: 1,000 in first 3 months
- **Active Users**: 500 monthly active users in first 6 months
- **Conversion Rate** (if freemium): >10% free to paid

---

## 9. Development Phases

### Phase 1: MVP (Weeks 1-4)

**Features**:
- Basic citation detection (cases, statutes, rules)
- Simple TOA generation (no passim, basic formatting)
- Task pane UI with scan and generate buttons
- Manual testing only

**Deliverables**:
- Working add-in installable via sideload
- Basic documentation

### Phase 2: Enhanced Detection (Weeks 5-6)

**Features**:
- Add constitutional, regulations, treatises categories
- Implement short-form resolution
- Add passim logic
- Comprehensive test suite

**Deliverables**:
- 30+ unit tests
- Sample brief fixture

### Phase 3: UI Polish (Weeks 7-8)

**Features**:
- Review/edit interface
- Settings panel
- Error handling and validation
- Progress indicators

**Deliverables**:
- Production-ready UI
- User documentation

### Phase 4: Beta Testing (Weeks 9-10)

**Features**:
- Bug fixes from beta testers
- Performance optimization
- Accessibility improvements

**Deliverables**:
- Beta tester feedback report
- Polished product ready for launch

---

## 10. Future Enhancements

### 10.1 Version 2.0 Features

1. **Bluebook Validation**
   - Check citations against Bluebook rules
   - Suggest corrections for malformed citations
   - Highlight stylistic inconsistencies

2. **AI-Powered Detection**
   - Use NLP to detect citations that don't match regex patterns
   - Learn from user corrections
   - Suggest citation completions

3. **Citation Library**
   - Save frequently used citations
   - Share citation libraries within firm
   - Import from Westlaw/LexisNexis

4. **Shepardizing Integration**
   - Check whether cases are still good law
   - Flag overruled or superseded authorities
   - Integration with legal research platforms

5. **Multi-Document Support**
   - Generate consolidated TOA for multiple documents
   - Copy citations between documents

6. **Advanced Formatting**
   - Support for court-specific formatting rules
   - Custom templates (9th Circuit, Supreme Court, etc.)
   - Export to PDF with hyperlinked citations

7. **Collaboration Features**
   - Track who added/edited citations
   - Comment on citations
   - Version control for TOA

### 10.2 Platform Expansion

- **Google Docs Add-on**: Reach users on Google Workspace
- **Desktop App**: Standalone version for batch processing
- **Web App**: Upload Word doc, get TOA
- **Mobile**: Review citations on iOS/Android

---

## 11. Risks & Mitigation

### 11.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Regex patterns miss citations | High | Medium | Extensive testing, user feedback, AI fallback |
| Office.js API limitations | High | Low | Research APIs early, prototype critical features |
| Poor performance on large docs | Medium | Medium | Optimize parsing, use Web Workers |
| Browser compatibility issues | Medium | Low | Test on all supported Office platforms |

### 11.2 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low user adoption | High | Medium | Partner with legal tech communities, offer free tier |
| Competing products | Medium | High | Focus on superior UX and accuracy |
| Negative reviews from errors | High | Medium | Thorough testing, clear disclaimers, good support |
| Security/privacy concerns | High | Low | No data sent to external servers, privacy-first |

### 11.3 Legal/Regulatory Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Liability for citation errors | High | Low | Disclaim "check all citations" in EULA |
| Unauthorized practice of law | Medium | Very Low | Tool assists but doesn't provide legal advice |

---

## 12. Compliance & Security

### 12.1 Data Privacy

- **No Data Collection**: Add-in processes documents locally only
- **No External Calls**: All computation in-browser
- **GDPR Compliant**: No personal data collected
- **Attorney-Client Privilege**: Documents never leave user's machine

### 12.2 Security

- **Code Signing**: Sign manifest and code
- **Input Validation**: Sanitize all user inputs
- **XSS Prevention**: Use React's built-in protections
- **Dependency Scanning**: Regular npm audit

---

## 13. Documentation Requirements

### 13.1 User Documentation

- **Installation Guide**: How to install from Office Store
- **Quick Start Guide**: 5-minute tutorial
- **User Manual**: Comprehensive feature documentation
- **FAQ**: Common questions and troubleshooting
- **Video Tutorials**: Screen recordings of key workflows

### 13.2 Developer Documentation

- **README.md**: Project overview, setup instructions
- **CONTRIBUTING.md**: How to contribute
- **API Documentation**: Document all public functions
- **Code Comments**: JSDoc for all TypeScript interfaces

---

## 14. Open Questions

1. **Pricing Model**: Free vs. Freemium vs. Paid?
   - Option A: Completely free (open source, community-driven)
   - Option B: Free for basic, $9.99/month for advanced features
   - Option C: $29 one-time purchase

2. **Citation Format Standards**: Focus on Bluebook only, or support multiple?
   - Bluebook (most common)
   - ALWD Citation Manual
   - California Style Manual
   - Others?

3. **Target Jurisdiction**: US-focused or international?
   - Phase 1: US federal and California state
   - Future: Expand to other states, countries

4. **Distribution**: Office Store only or other channels?
   - Office Store (primary)
   - Direct download from website
   - Enterprise licensing for law firms

---

## 15. Conclusion

This Table of Authorities Add-in addresses a real pain point for legal professionals: the tedious, error-prone task of manually marking citations for TOA generation. By automating citation detection and formatting, we can save users 2+ hours per document while improving accuracy.

The MVP focuses on core functionality (detect, categorize, generate) with a clean UI. Future enhancements will add advanced features like Bluebook validation and AI-powered detection.

**Success depends on**:
- **Accuracy**: Regex patterns must be comprehensive and well-tested
- **Ease of Use**: One-click simplicity for non-technical users
- **Performance**: Fast scanning even for large documents
- **Reliability**: Consistent results that users can trust

With proper execution, this add-in can become the standard tool for TOA generation in legal practice.

---

**Next Steps**:
1. Review and approve this PRD
2. Set up development environment
3. Begin Phase 1 implementation
4. Recruit beta testers from legal community

---

*Document Version: 1.0*  
*Last Updated: February 16, 2026*  
*Status: Draft - Awaiting Approval*
