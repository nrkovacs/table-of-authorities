import { stripPinCite, buildTAFieldCode, buildIdTAFieldCode, buildTOAFieldCode, escapeFieldQuotes } from '../src/citation-parser/pincite-stripper';
import { CitationCategory } from '../src/citation-parser/types';

console.log('=== PIN CITE STRIPPER VERIFICATION ===\n');

// Test 1: Case with pin cite
const t1 = stripPinCite('Illinois v. Gates, 462 U.S. 213, 232 (1983)', CitationCategory.Cases);
console.log('TEST 1: Case with pin cite');
console.log(`  Input:  "Illinois v. Gates, 462 U.S. 213, 232 (1983)"`);
console.log(`  Long:   "${t1.longCite}"`);
console.log(`  Short:  "${t1.shortCite}"`);
console.log(`  Cat:    ${t1.categoryCode}`);
console.log(t1.longCite.includes('232') ? '  ❌ FAIL (pin cite not stripped)' : '  ✅ PASS');

// Test 2: Case without pin cite
const t2 = stripPinCite('Roe v. Wade, 410 U.S. 113 (1973)', CitationCategory.Cases);
console.log('\nTEST 2: Case without pin cite');
console.log(`  Long:  "${t2.longCite}"`);
console.log(`  Short: "${t2.shortCite}"`);
console.log(t2.shortCite === 'Wade' ? '  ✅ PASS' : `  ❌ FAIL (expected "Wade")`);

// Test 3: Case with signal word
const t3 = stripPinCite('See also Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009)', CitationCategory.Cases);
console.log('\nTEST 3: Signal word stripping');
console.log(`  Long:  "${t3.longCite}"`);
console.log(`  Short: "${t3.shortCite}"`);
console.log(!t3.longCite.startsWith('See') ? '  ✅ PASS' : '  ❌ FAIL (signal not stripped)');

// Test 4: Statute
const t4 = stripPinCite('42 U.S.C. § 1983', CitationCategory.Statutes);
console.log('\nTEST 4: Statute');
console.log(`  Long:  "${t4.longCite}"`);
console.log(`  Short: "${t4.shortCite}"`);
console.log(`  Cat:   ${t4.categoryCode}`);
console.log(t4.categoryCode === 2 ? '  ✅ PASS' : '  ❌ FAIL');

// Test 5: Build TA field code
const fc = buildTAFieldCode('Illinois v. Gates, 462 U.S. 213 (1983)', 'Gates', 1);
console.log('\nTEST 5: TA field code');
console.log(`  Code: ${fc}`);
console.log(fc.includes('\\l') && fc.includes('\\s') && fc.includes('\\c 1') ? '  ✅ PASS' : '  ❌ FAIL');

// Test 6: Build Id. TA field code
const idfc = buildIdTAFieldCode('Gates', 1);
console.log('\nTEST 6: Id. TA field code');
console.log(`  Code: ${idfc}`);
console.log(idfc.includes('\\s "Gates"') && idfc.includes('\\c 1') && !idfc.includes('\\l') ? '  ✅ PASS' : '  ❌ FAIL');

// Test 7: Build TOA field code
const toa = buildTOAFieldCode(1, true);
console.log('\nTEST 7: TOA field code');
console.log(`  Code: ${toa}`);
console.log(toa.includes('\\c 1') && toa.includes('\\p') ? '  ✅ PASS' : '  ❌ FAIL');

// Test 8: Quote escaping
const esc = escapeFieldQuotes('He said "hello" to the court');
console.log('\nTEST 8: Quote escaping');
console.log(`  Input:  He said "hello" to the court`);
console.log(`  Output: ${esc}`);
console.log(!esc.includes('"') || esc.includes('\u201D') ? '  ✅ PASS' : '  ❌ FAIL');

// Test 9: Multiple pin cites
const t9 = stripPinCite('Maryland v. Pringle, 540 U.S. 366, 371, 373-74 (2003)', CitationCategory.Cases);
console.log('\nTEST 9: Multiple pin cites');
console.log(`  Long:  "${t9.longCite}"`);
console.log(t9.longCite.includes('371') ? '  ❌ FAIL (pin cites not stripped)' : '  ✅ PASS');

console.log('\n=== DONE ===');
