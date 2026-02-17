# Table of Authorities Generator

> Automatically generate Tables of Authorities for legal briefs in Microsoft Word

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-148%20passing-brightgreen)](#-testing)

## 📋 Overview

The **Table of Authorities Generator** is a Microsoft Word Add-in that automates the tedious process of creating Tables of Authorities (TOA) for legal briefs. Instead of manually marking citations with TA fields (which can take 2–3 hours), this add-in scans your document, intelligently detects and categorizes legal citations, and generates a properly formatted TOA in seconds.

### Key Features

- 🔍 **Automatic Citation Detection** — Finds cases, statutes, constitutional provisions, rules, regulations, treatises, and more
- 📊 **Smart Categorization** — Organizes citations into 7 standard legal categories
- 🔗 **Deduplication** — Merges duplicate citations across pages, preserving all page references
- ✨ **Proper Formatting** — Court-ready TOAs with dot leaders, italic case names, and *passim* notation
- ✏️ **Review & Edit** — Review detected citations and exclude any you don't want
- 🌐 **Works in Word Online** — No local server needed; sideload directly from GitHub Pages
- 💻 **Native Fields on Desktop** — Uses Word's native TA/TOA fields when running on Word Desktop
- ⚡ **Fast** — Transforms a 2-hour manual task into a 2-minute automated process

## 🚀 Quick Start — Word Online (No Install)

The fastest way to try the add-in. No cloning, no build tools, no local server.

### Step 1: Download the manifest

Download **[manifest-ghpages.xml](https://raw.githubusercontent.com/nrkovacs/table-of-authorities/main/manifest-ghpages.xml)** (right-click → Save Link As).

This manifest points to the hosted version on GitHub Pages (`https://nrkovacs.github.io/table-of-authorities/`).

### Step 2: Open Word Online

Go to [word.new](https://word.new) or open any document at [office.com](https://www.office.com).

### Step 3: Sideload the add-in

1. Click **Insert** in the ribbon
2. Click **Add-ins** (or **Office Add-ins**)
3. Click **Upload My Add-in** (in the upper-right of the dialog)
4. Browse to the `manifest-ghpages.xml` file you downloaded and click **Upload**

### Step 4: Use the add-in

1. Click **Generate TOA** on the Home ribbon tab to open the task pane
2. Click **Scan Document** — the add-in reads your brief and detects all citations
3. Review the detected citations (uncheck any you want to exclude)
4. Place your cursor where you want the TOA inserted
5. Click **Generate TOA at Cursor**

> **Note:** In Word Online, the TOA is inserted as formatted text with dot leaders and page numbers from the scan. For native TOA fields with live page numbers, use Word Desktop.

## 💻 Installation — Word Desktop

For full native-field support (TA marking + live TOA page numbers):

### Option A: Use the GitHub Pages manifest (no local server)

Same steps as above, but sideload in Word Desktop instead:

- **Windows**: File → Options → Trust Center → Trust Center Settings → Trusted Add-in Catalogs, or use the Insert → Add-ins → Upload method
- **Mac**: Follow [Microsoft's sideloading guide for Mac](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/sideload-an-office-add-in-on-mac)

### Option B: Run locally (for development)

1. Clone and install:
   ```bash
   git clone https://github.com/nrkovacs/table-of-authorities.git
   cd table-of-authorities
   npm install
   ```

2. Start the dev server (serves on `https://localhost:3000`):
   ```bash
   npm run dev
   ```

3. Sideload `manifest.xml` (the localhost version) in Word using the methods above.

### Which manifest to use?

| Manifest | URLs point to | Use when |
|---|---|---|
| `manifest-ghpages.xml` | `https://nrkovacs.github.io/table-of-authorities/` | Normal use — no local server needed |
| `manifest.xml` | `https://localhost:3000` | Local development with `npm run dev` |

## 📖 Usage

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

### Word Online vs. Word Desktop

| Feature | Word Online | Word Desktop |
|---|:---:|:---:|
| Scan & detect citations | ✅ | ✅ |
| Review & exclude citations | ✅ | ✅ |
| Generate formatted TOA | ✅ (text with dot leaders) | ✅ (native TOA fields) |
| Mark citations with TA fields | ❌ | ✅ |
| Id. resolver | ❌ | ✅ |
| Live page numbers (Update Field) | ❌ | ✅ |

## 🎯 Supported Citation Types

### Cases
- `Brown v. Board of Education, 347 U.S. 483 (1954)`
- `In re Marriage of Smith, 123 Cal.App.4th 456 (2005)`
- `Ex parte Johnson, 456 U.S. 789 (1990)`
- Short forms: `Brown, 347 U.S. at 485` · `Id. at 100` · `Brown, supra, at 495`

### Statutes
- `42 U.S.C. § 1983` · `28 U.S.C. § 1331(a)` · `42 U.S.C. §§ 1983–1988`
- State: `Cal. Civ. Code § 1542` · `N.Y. Gen. Bus. Law § 349` · `Tex. Fam. Code Ann. § 6.001` · `Fla. Stat. § 768.28` · `735 ILCS 5/2-1401`

### Constitutional Provisions
- `U.S. Const. art. I, § 8` · `U.S. Const. amend. XIV, § 1`
- State: `Cal. Const. art. I, § 7`

### Rules
- `Fed. R. Civ. P. 12(b)(6)` · `Fed. R. Evid. 702` · `Fed. R. App. P. 4(a)(1)` · `Fed. R. Crim. P. 11`
- State: `Cal. Rules of Court, rule 8.204`

### Regulations
- `28 C.F.R. § 35.130` · `85 Fed. Reg. 12345 (Mar. 1, 2020)`

### Treatises & Secondary Sources
- `5 Wright & Miller, Federal Practice and Procedure § 1357 (3d ed. 2004)`
- `Laurence H. Tribe, American Constitutional Law § 16-14 (3d ed. 2000)`
- `Restatement (Second) of Torts § 402A`
- Law reviews: `Jane Doe, Legal Theory, 100 Harv. L. Rev. 123 (2020)`

## 🛠️ Development

### Project Structure

```
table-of-authorities/
├── src/
│   ├── taskpane/
│   │   ├── taskpane.html         # Task pane UI
│   │   ├── taskpane.ts           # Main task pane logic
│   │   └── taskpane.css          # Styling
│   ├── citation-parser/
│   │   ├── index.ts              # Parser orchestrator
│   │   ├── patterns.ts           # 50+ regex patterns
│   │   ├── normalizer.ts         # Deduplication & normalization
│   │   ├── pincite-stripper.ts   # Pin cite removal & TA field codes
│   │   ├── categories.ts         # Category definitions
│   │   └── types.ts              # TypeScript interfaces
│   └── toa-generator/
│       ├── index.ts              # TOA generation logic
│       └── formatter.ts          # Formatting (dot leaders, passim, OOXML)
├── test/
│   ├── citation-parser/          # 11 focused test files
│   │   ├── cases.test.ts
│   │   ├── statutes.test.ts
│   │   ├── constitutional.test.ts
│   │   ├── rules.test.ts
│   │   ├── regulations.test.ts
│   │   ├── treatises.test.ts
│   │   ├── normalizer.test.ts
│   │   ├── deduplication.test.ts
│   │   ├── reporters.test.ts
│   │   ├── edge-cases.test.ts
│   │   └── short-form.test.ts
│   ├── pincite-stripper.test.ts
│   ├── toa-generator.test.ts
│   ├── user_repro.test.ts
│   └── fixtures/
│       └── sample-brief.txt
├── demo/
│   └── demo.html                 # Standalone demo (no Word required)
├── manifest.xml                  # Office manifest (localhost)
├── manifest-ghpages.xml          # Office manifest (GitHub Pages)
├── vitest.config.ts
├── webpack.config.js
└── package.json
```

### Build Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server with hot reload (https://localhost:3000)
npm run build        # Production build
npm test             # Run all 148 tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Technology Stack

- **Office.js** — Microsoft Office Add-in API
- **TypeScript** — Type-safe throughout
- **Webpack** — Module bundler
- **Vitest** — Test framework (148 tests)

## 🧪 Testing

148 tests across 14 test files covering:

- **Citation detection** — Cases, statutes, constitutional provisions, rules, regulations, treatises
- **Normalization** — Text normalization, identifier extraction, sorting, grouping
- **Deduplication** — Multi-page merge, pincite variation handling, short-form separation
- **Pin cite stripping** — TA/TOA field code generation
- **TOA formatting** — Dot leaders, passim, category ordering, OOXML output
- **Edge cases** — Empty text, custom patterns, signal words, long case names
- **Integration** — Full sample brief parsing

```bash
$ npm test

 ✓ test/citation-parser/cases.test.ts (15 tests)
 ✓ test/citation-parser/statutes.test.ts (10 tests)
 ✓ test/citation-parser/normalizer.test.ts (28 tests)
 ✓ test/toa-generator.test.ts (24 tests)
 ✓ test/citation-parser/deduplication.test.ts (8 tests)
 ✓ test/pincite-stripper.test.ts (16 tests)
 ... and 8 more test files

 Test Files  14 passed (14)
      Tests  148 passed (148)
```

## 📚 Documentation

- **[Product Requirements Document](docs/PRD.md)** — Detailed feature specifications
- **[Live Demo](https://nrkovacs.github.io/table-of-authorities/demo/demo.html)** — Try citation parsing without Word
- **[Citation Patterns](src/citation-parser/patterns.ts)** — All regex patterns
- **[Type Definitions](src/citation-parser/types.ts)** — TypeScript interfaces

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Run `npm test` to ensure all 148 tests pass
5. Commit and push
6. Open a Pull Request

### Adding New Citation Patterns

1. Add the regex pattern to `src/citation-parser/patterns.ts`
2. Add test cases to the appropriate file in `test/citation-parser/`
3. Run `npm test` to verify
4. Update this README with examples

## 📝 License

MIT — see [LICENSE](LICENSE).

## 📊 Project Status

**Current Version:** 1.0.0

**Roadmap:**
- [ ] Bluebook format validation
- [ ] AI-powered citation detection for unusual formats
- [ ] Multi-document support
- [ ] Citation library (save frequently used citations)
- [ ] Shepardizing integration
- [ ] Court-specific formatting templates

## ⚖️ Disclaimer

This tool assists with formatting but does not provide legal advice. Users are responsible for verifying all citations are accurate and properly formatted.

---

**[⭐ Star this repo](https://github.com/nrkovacs/table-of-authorities)** if you find it helpful!
