/**
 * Verify deduplication logic for citations
 */
import { parseDocument, Citation } from '../src/citation-parser';
import { deduplicateCitations, extractCitationIdentifier, areCitationsDuplicate } from '../src/citation-parser/normalizer';
import { CitationCategory } from '../src/citation-parser/types';

// Helper to build a page map
function makePageMap(pages: Record<number, string>): Map<number, string> {
  return new Map(Object.entries(pages).map(([k, v]) => [Number(k), v]));
}

console.log('=== DEDUPLICATION VERIFICATION ===\n');

// ── Test 1: Same case cited on multiple pages should merge ──
console.log('TEST 1: Same case on multiple pages');
const pageMap1 = makePageMap({
  1: 'The Court held in Illinois v. Gates, 462 U.S. 213, 232 (1983) that probable cause is required.',
  3: 'As stated in Illinois v. Gates, 462 U.S. 213, 232 (1983), this standard applies.',
  5: 'See Illinois v. Gates, 462 U.S. 213 (1983).',
});
const result1 = parseDocument('', pageMap1);
const gatesCitations = result1.citations.filter(c => 
  c.text.includes('Illinois v. Gates') && !c.isShortForm
);
console.log(`  Full-form "Illinois v. Gates" citations: ${gatesCitations.length} (expected: 1)`);
if (gatesCitations.length === 1) {
  console.log(`  Pages: [${gatesCitations[0].pages.join(', ')}] (expected: [1, 3, 5])`);
  console.log(`  ✅ PASS`);
} else {
  console.log(`  ❌ FAIL — got ${gatesCitations.length} instead of 1`);
  gatesCitations.forEach(c => console.log(`    "${c.text}" pages=[${c.pages}]`));
}

// ── Test 2: Different cases should NOT merge ──
console.log('\nTEST 2: Different cases stay separate');
const pageMap2 = makePageMap({
  1: 'Illinois v. Gates, 462 U.S. 213 (1983). Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007).',
});
const result2 = parseDocument('', pageMap2);
const cases2 = result2.citations.filter(c => c.category === CitationCategory.Cases && !c.isShortForm);
console.log(`  Unique cases found: ${cases2.length} (expected: 2)`);
cases2.forEach(c => console.log(`    - "${c.text}"`));
console.log(cases2.length === 2 ? '  ✅ PASS' : '  ❌ FAIL');

// ── Test 3: Same statute cited differently should merge ──
console.log('\nTEST 3: Same statute deduplication');
const pageMap3 = makePageMap({
  1: 'Under 42 U.S.C. § 1983, a plaintiff may sue.',
  4: 'The claim arises under 42 U.S.C. § 1983.',
});
const result3 = parseDocument('', pageMap3);
const statute3 = result3.citations.filter(c => 
  c.category === CitationCategory.Statutes && c.text.includes('1983') && !c.isShortForm
);
console.log(`  "42 U.S.C. § 1983" citations: ${statute3.length} (expected: 1)`);
if (statute3.length === 1) {
  console.log(`  Pages: [${statute3[0].pages.join(', ')}] (expected: [1, 4])`);
  console.log(`  ✅ PASS`);
} else {
  console.log(`  ❌ FAIL`);
}

// ── Test 4: Short-form citations should be separate from full citations ──
console.log('\nTEST 4: Short-form vs full-form separation');
const pageMap4 = makePageMap({
  1: 'In Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009), the Court held.',
  2: 'Iqbal, 556 U.S. at 678.',
});
const result4 = parseDocument('', pageMap4);
const iqbalFull = result4.citations.filter(c => c.text.includes('Ashcroft v. Iqbal') && !c.isShortForm);
const iqbalShort = result4.citations.filter(c => c.text.includes('Iqbal') && c.isShortForm);
console.log(`  Full-form Iqbal: ${iqbalFull.length} (expected: 1)`);
console.log(`  Short-form Iqbal: ${iqbalShort.length} (expected: ≥1)`);
console.log(iqbalFull.length === 1 ? '  ✅ PASS (full-form)' : '  ❌ FAIL (full-form)');

// ── Test 5: extractCitationIdentifier consistency ──
console.log('\nTEST 5: Identifier extraction consistency');
const id_a = extractCitationIdentifier('Illinois v. Gates, 462 U.S. 213, 232 (1983)', CitationCategory.Cases);
const id_b = extractCitationIdentifier('Illinois v. Gates, 462 U.S. 213 (1983)', CitationCategory.Cases);
const id_c = extractCitationIdentifier('Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007)', CitationCategory.Cases);
console.log(`  Gates full cite id:    "${id_a}"`);
console.log(`  Gates shorter cite id: "${id_b}"`);
console.log(`  Twombly id:            "${id_c}"`);
console.log(`  Gates ids match: ${id_a === id_b} (expected: true)`);
console.log(`  Gates ≠ Twombly: ${id_a !== id_c} (expected: true)`);
console.log(id_a === id_b && id_a !== id_c ? '  ✅ PASS' : '  ❌ FAIL');

// ── Test 6: Same case with pincite vs without ──
console.log('\nTEST 6: Case with different pincites should still merge');
const pageMap6 = makePageMap({
  1: 'Maryland v. Pringle, 540 U.S. 366, 371 (2003).',
  3: 'Maryland v. Pringle, 540 U.S. 366, 373 (2003).',
});
const result6 = parseDocument('', pageMap6);
const pringle = result6.citations.filter(c => c.text.includes('Maryland v. Pringle') && !c.isShortForm);
console.log(`  "Maryland v. Pringle" citations: ${pringle.length} (expected: 1)`);
if (pringle.length === 1) {
  console.log(`  Pages: [${pringle[0].pages.join(', ')}] (expected: [1, 3])`);
  console.log(`  Text kept: "${pringle[0].text}"`);
  console.log(`  ✅ PASS`);
} else {
  console.log(`  ❌ FAIL`);
  pringle.forEach(c => console.log(`    "${c.text}" id=${extractCitationIdentifier(c.text, c.category)}`));
}

// ── Test 7: Different sections of same statute should NOT merge ──
console.log('\nTEST 7: Different statute sections stay separate');
const pageMap7 = makePageMap({
  1: 'Under 28 U.S.C. § 1292 and 42 U.S.C. § 1983.',
});
const result7 = parseDocument('', pageMap7);
const statutes7 = result7.citations.filter(c => c.category === CitationCategory.Statutes && !c.isShortForm);
console.log(`  Unique statutes: ${statutes7.length} (expected: 2)`);
statutes7.forEach(c => console.log(`    - "${c.text}" → id="${extractCitationIdentifier(c.text, c.category)}"`));
console.log(statutes7.length === 2 ? '  ✅ PASS' : '  ❌ FAIL');

// ── Test 8: Large real-world-like scenario ──
console.log('\nTEST 8: Real-world brief deduplication');
const pageMap8 = makePageMap({
  1: `JURISDICTIONAL STATEMENT
This Court has jurisdiction pursuant to 28 U.S.C. § 1292.
STATEMENT OF THE CASE
The Supreme Court held in Illinois v. Gates, 462 U.S. 213, 232 (1983) that probable cause is required.`,
  2: `In Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007), the Court stated.
See also Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009).
Under Fed. R. Civ. P. 12(b)(6), dismissal is appropriate.`,
  3: `Iqbal, 556 U.S. at 678. The arrests were made pursuant to TEX. CRIM. PROC. CODE § 2.13.
The Fourth Amendment, U.S. Const. amend. IV, requires probable cause.
See Maryland v. Pringle, 540 U.S. 366, 371 (2003).`,
  4: `As this Court recognized in Morin v. Caire, 77 F.3d 116, 120 (5th Cir. 1996).
See also Papasan v. Allain, 478 U.S. 265, 286 (1986). Mitchell v. Forsyth, 472 U.S. 511 (1985).
Illinois v. Gates, 462 U.S. 213 (1983). Gentilello v. Rege, 623 F.3d 540, 544 (5th Cir. 2010).`,
});
const result8 = parseDocument('', pageMap8);
const fullCitations = result8.citations.filter(c => !c.isShortForm);
const shortCitations = result8.citations.filter(c => c.isShortForm);

console.log(`  Total citations: ${result8.citations.length}`);
console.log(`  Full-form (unique): ${fullCitations.length}`);
console.log(`  Short-form: ${shortCitations.length}`);

// Check Illinois v. Gates is deduplicated (appears on pages 1 and 4)
const gates8 = fullCitations.filter(c => c.text.includes('Illinois v. Gates'));
console.log(`\n  Illinois v. Gates (full-form): ${gates8.length} (expected: 1)`);
if (gates8.length === 1) {
  console.log(`    Pages: [${gates8[0].pages.join(', ')}] (should include 1 and 4)`);
  const hasPage1 = gates8[0].pages.includes(1);
  const hasPage4 = gates8[0].pages.includes(4);
  console.log(`    Has page 1: ${hasPage1}, Has page 4: ${hasPage4}`);
  console.log(hasPage1 && hasPage4 ? '    ✅ PASS' : '    ❌ FAIL');
} else {
  console.log('    ❌ FAIL');
}

// Summary
console.log('\n  All full-form citations:');
fullCitations.forEach(c => {
  console.log(`    [${c.category}] "${c.text.substring(0, 60)}..." pages=[${c.pages.join(',')}]`);
});

console.log('\n=== DONE ===');
