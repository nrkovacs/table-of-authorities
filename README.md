# Table of Authorities Generator

> Automatically generate Tables of Authorities for legal briefs in Microsoft Word

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 📋 Overview

The **Table of Authorities Generator** is a Microsoft Word Add-in that automates the tedious process of creating Tables of Authorities (TOA) for legal briefs. Instead of manually marking citations with TA fields (which can take 2-3 hours), this add-in scans your document, intelligently detects and categorizes legal citations, and generates a properly formatted TOA in seconds.

### Key Features

- 🔍 **Automatic Citation Detection** - Finds cases, statutes, constitutional provisions, rules, regulations, treatises, and more
- 📊 **Smart Categorization** - Automatically organizes citations into standard legal categories
- ✨ **Proper Formatting** - Generates court-ready TOAs with dot leaders, italic case names, and passim notation
- ✏️ **Review & Edit** - Review detected citations and exclude any you don't want in the TOA
- ⚡ **Fast** - Transforms a 2-hour manual task into a 2-minute automated process

## 🚀 Installation

### From Office Store (Coming Soon)

1. Open Microsoft Word
2. Go to **Insert** > **Get Add-ins**
3. Search for "Table of Authorities Generator"
4. Click **Add**

### Sideload for Development

1. Clone this repository:
   ```bash
   git clone https://github.com/nrkovacs/table-of-authorities.git
   cd table-of-authorities
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the add-in:
   ```bash
   npm run build
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

5. Sideload in Word:
   - **Windows**: Follow [these instructions](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/create-a-network-shared-folder-catalog-for-task-pane-and-content-add-ins)
   - **Mac**: Follow [these instructions](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/sideload-an-office-add-in-on-mac)
   - **Word Online**: Use the manifest.xml file

## 📖 Usage

### Quick Start

1. **Open your legal brief** in Microsoft Word

2. **Click the "Table of Authorities" button** in the Home ribbon

3. **Click "Scan Document"** to detect all citations

4. **Review the detected citations**:
   - Uncheck any citations you want to exclude
   - Citations are automatically grouped by category

5. **Click "Generate TOA"** to insert the Table of Authorities at your cursor position

### Example Input

Your brief might contain citations like:

```
As this Court held in Brown v. Board of Education, 347 U.S. 483 (1954), 
"separate educational facilities are inherently unequal." Pursuant to 
42 U.S.C. § 1983, Plaintiff brought suit alleging violations under 
U.S. Const. amend. XIV, § 1. Under Fed. R. Civ. P. 12(b)(6), Defendants 
moved to dismiss.
```

### Example Output

The add-in generates:

```
TABLE OF AUTHORITIES

CASES                                                          Page(s)

Brown v. Board of Education, 347 U.S. 483 (1954) ............. 3, 7, 12

STATUTES

42 U.S.C. § 1983 ............................................ 4, 9

CONSTITUTIONAL PROVISIONS

U.S. Const. amend. XIV, § 1 ................................. 10

RULES

Fed. R. Civ. P. 12(b)(6) .................................... 11
```

## 🎯 Supported Citation Types

The add-in detects citations in the following categories:

### 1. Cases
- **Standard**: `Brown v. Board of Education, 347 U.S. 483 (1954)`
- **In re**: `In re Marriage of Smith, 123 Cal.App.4th 456 (2005)`
- **Ex parte**: `Ex parte Johnson, 456 U.S. 789 (1990)`
- **Short form**: `Brown, 347 U.S. at 485`
- **Id.**: `Id. at 100`

### 2. Statutes
- **Federal**: `42 U.S.C. § 1983`
- **California**: `Cal. Civ. Code § 1542`
- **New York**: `N.Y. Gen. Bus. Law § 349`
- **Texas**: `Tex. Fam. Code Ann. § 6.001`
- **Florida**: `Fla. Stat. § 768.28`
- **Illinois**: `735 ILCS 5/2-1401`

### 3. Constitutional Provisions
- **U.S. Constitution - Article**: `U.S. Const. art. I, § 8`
- **U.S. Constitution - Amendment**: `U.S. Const. amend. XIV, § 1`
- **State Constitutions**: `Cal. Const. art. I, § 7`

### 4. Rules
- **Federal Rules of Civil Procedure**: `Fed. R. Civ. P. 12(b)(6)`
- **Federal Rules of Evidence**: `Fed. R. Evid. 702`
- **Federal Rules of Appellate Procedure**: `Fed. R. App. P. 4`
- **California Rules of Court**: `Cal. Rules of Court, rule 8.204`

### 5. Regulations
- **Code of Federal Regulations**: `28 C.F.R. § 35.130`
- **Federal Register**: `85 Fed. Reg. 12345 (Mar. 1, 2020)`

### 6. Treatises & Secondary Sources
- **Treatises**: `5 Wright & Miller, Federal Practice and Procedure § 1357 (3d ed. 2004)`
- **Law Reviews**: `Jane Doe, Legal Theory, 100 Harv. L. Rev. 123 (2020)`
- **Restatements**: `Restatement (Second) of Torts § 402A`

### 7. Other Authorities
Any citations that don't fit the above categories

## ⚙️ Settings

### Passim Threshold
Set how many pages a citation must appear on before using "passim" notation (default: 6 pages)

### Dot Leaders
Enable/disable dot leaders between citations and page numbers (default: enabled)

### Include Footnotes
Choose whether to scan citations in footnotes (default: enabled)

## 🛠️ Development

### Project Structure

```
table-of-authorities/
├── docs/
│   └── PRD.md                    # Product Requirements Document
├── src/
│   ├── taskpane/
│   │   ├── taskpane.html         # Task pane UI
│   │   ├── taskpane.ts           # Main task pane logic
│   │   └── taskpane.css          # Styling
│   ├── citation-parser/
│   │   ├── index.ts              # Main parser orchestrator
│   │   ├── patterns.ts           # Regex patterns for citation detection
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── categories.ts         # Category definitions
│   │   └── normalizer.ts         # Citation normalization
│   └── toa-generator/
│       ├── index.ts              # TOA generation logic
│       └── formatter.ts          # Formatting with dot leaders, passim
├── test/
│   ├── citation-parser.test.ts   # Parser tests (30+ test cases)
│   ├── toa-generator.test.ts     # Generator tests
│   └── fixtures/
│       └── sample-brief.txt      # Sample legal brief for testing
├── manifest.xml                  # Office Add-in manifest
├── package.json
├── tsconfig.json
├── webpack.config.js
└── jest.config.js
```

### Build Commands

```bash
# Install dependencies
npm install

# Development server (with hot reload)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm test:coverage

# Watch mode for tests
npm test:watch

# Lint code
npm run lint
```

### Technology Stack

- **Office.js** - Microsoft Office Add-in API
- **TypeScript** - Type-safe JavaScript
- **React** - UI framework (via vanilla TS for simplicity)
- **Webpack** - Module bundler
- **Jest** - Testing framework

## 🧪 Testing

The project includes comprehensive tests:

- **30+ test cases** for citation pattern detection
- **15+ test cases** for TOA formatting
- **Integration tests** with sample brief fixture
- **Edge case tests** for unusual citation formats

Run tests:
```bash
npm test
```

View coverage:
```bash
npm run test:coverage
```

## 📚 Documentation

- **[Product Requirements Document](docs/PRD.md)** - Detailed feature specifications
- **[Citation Patterns](src/citation-parser/patterns.ts)** - Regex patterns for all citation types
- **[Type Definitions](src/citation-parser/types.ts)** - TypeScript interfaces

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Adding New Citation Patterns

To add support for a new citation type:

1. Add the regex pattern to `src/citation-parser/patterns.ts`
2. Add test cases to `test/citation-parser.test.ts`
3. Update the README with examples

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature request? [Open an issue](https://github.com/nrkovacs/table-of-authorities/issues) on GitHub.

## 🙏 Acknowledgments

- Citation patterns based on The Bluebook (21st ed.)
- Inspired by the tedious manual process of creating TOAs
- Built for lawyers, by developers who care

## 📊 Project Status

**Current Version:** 1.0.0 (MVP)

**Roadmap:**
- [ ] Bluebook validation (check citation format)
- [ ] AI-powered citation detection for unusual formats
- [ ] Multi-document support
- [ ] Citation library (save frequently used citations)
- [ ] Shepardizing integration (check if cases are still good law)
- [ ] Court-specific formatting templates

## ⚖️ Legal Disclaimer

This tool assists with formatting but does not provide legal advice. Users are responsible for verifying all citations are accurate and properly formatted according to applicable court rules and citation manuals.

---

**Made with ⚖️ by [OpenClaw](https://github.com/nrkovacs)**

**Star this repo** if you find it helpful!
