import { stripPinCite, buildTAFieldCode, buildIdTAFieldCode, buildTOAFieldCode, escapeFieldQuotes } from '../src/citation-parser/pincite-stripper';
import { CitationCategory } from '../src/citation-parser/types';

console.log('=== PIN CITE STRIPPING & FIELD CODE VERIFICATION ===\n');

const cases = [
  {
    input: 'Illinois v. Gates, 462 U.S. 213, 232 (1983)',
    expectLong: 'Illinois v. Gates, 462 U.S. 213 (1983)',
    expectShort: 'Gates',
  },
  {
    input: 'Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007)',
    expectLong: 'Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007)',
    expectShort: 'Twombly',
  },
  {
    input: 'See also Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009)',
    expectLong: 'Ashcroft v. Iqbal, 556 U.S. 662 (2009)',
    expectShort: 'Iqbal',
  },
  {
    input: 'Maryland v. Pringle, 540 U.S. 366, 371-73 (2003)',
    expectLong: 'Maryland v. Pringle, 540 U.S. 366 (2003)',
    expectShort: 'Pringle',
  },
];

let pass = 0;
let fail = 0;

for (const tc of cases) {
  const result = stripPinCite(tc.input, CitationCategory.Cases);
  const longOk = result.longCite === tc.expectLong;
  const shortOk = result.shortCite === tc.expectShort;
  
  if (longOk && shortOk) {
    console.log(`✅ "${tc.input.substring(0, 40)}..."`);
    pass++;
  } else {
    console.log(`❌ "${tc.input.substring(0, 40)}..."`);
    if (!longOk) console.log(`   Long:  got "${result.longCite}" expected "${tc.expectLong}"`);
    if (!shortOk) console.log(`   Short: got "${result.shortCite}" expected "${tc.expectShort}"`);
    fail++;
  }
}

// Statute test
const statResult = stripPinCite('42 U.S.C. § 1983(a)(1)', CitationCategory.Statutes);
console.log(`\nStatute: "${statResult.longCite}" short="${statResult.shortCite}" cat=${statResult.categoryCode}`);
console.log(statResult.longCite === '42 U.S.C. § 1983' ? '✅ Statute pin cite stripped' : '❌ Statute pin cite NOT stripped');

// Field code generation
console.log('\n--- Field Code Generation ---');
const ta = buildTAFieldCode('Illinois v. Gates, 462 U.S. 213 (1983)', 'Gates', 1);
console.log(`TA field: ${ta}`);
console.log(ta === 'TA \\l "Illinois v. Gates, 462 U.S. 213 (1983)" \\s "Gates" \\c 1' ? '✅' : '❌');

const idTA = buildIdTAFieldCode('Gates', 1);
console.log(`Id. field: ${idTA}`);
console.log(idTA === 'TA \\s "Gates" \\c 1' ? '✅' : '❌');

const toa = buildTOAFieldCode(1, true);
console.log(`TOA field: ${toa}`);
console.log(toa.includes('TOA \\c 1 \\p') ? '✅' : '❌');

// Quote escaping
const escaped = escapeFieldQuotes('He said "hello" to her');
console.log(`\nQuote escape: "${escaped}"`);
console.log(!escaped.includes('"') || escaped.includes('\u201D') ? '✅ Quotes escaped' : '❌');

console.log(`\n=== ${pass + (fail === 0 ? 3 : 0)} passed, ${fail} failed ===`);
