/**
 * Real-world TOA comparison test
 * 
 * Reads extracted brief JSON files, runs our citation parser on the body text,
 * and compares detected citations against the actual Table of Authorities.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseDocument, CitationCategory, getIncludedCitations } from '../../src/citation-parser';
import { normalizeCitationText, extractCaseName } from '../../src/citation-parser/normalizer';

interface TOACitation {
  text: string;
  category: string;
  pages: string;
}

interface BriefData {
  source: string;
  total_pages: number;
  toa_start_page: number;
  toa_end_page: number;
  toa_text: string;
  toa_citations: TOACitation[];
  body_text: string;
  body_pages: Record<string, string>;
}

// Map our CitationCategory enum to ground truth category strings
function categoryToString(cat: CitationCategory): string {
  switch (cat) {
    case CitationCategory.Cases: return 'Cases';
    case CitationCategory.Statutes: return 'Statutes';
    case CitationCategory.Constitutional: return 'Constitutional';
    case CitationCategory.Rules: return 'Rules';
    case CitationCategory.Regulations: return 'Regulations';
    case CitationCategory.Treatises: return 'Treatises';
    case CitationCategory.Other: return 'Other';
    default: return 'Unknown';
  }
}

// Normalize a citation for fuzzy matching
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,;:'"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if detected citation matches a ground truth citation
function isMatch(detected: string, groundTruth: string): boolean {
  const dNorm = normalizeForComparison(detected);
  const gNorm = normalizeForComparison(groundTruth);
  
  // Exact match
  if (dNorm === gNorm) return true;
  
  // One contains the other
  if (dNorm.includes(gNorm) || gNorm.includes(dNorm)) return true;
  
  // Extract key identifiers and compare
  // For cases: check if both have same volume + reporter + page
  const caseIdPattern = /(\d+)\s+([a-z][a-z0-9.]+)\s+(\d+)/i;
  const dMatch = dNorm.match(caseIdPattern);
  const gMatch = gNorm.match(caseIdPattern);
  if (dMatch && gMatch) {
    if (dMatch[1] === gMatch[1] && dMatch[3] === gMatch[3]) {
      // Same volume and page, close enough reporter
      const dReporter = dMatch[2].replace(/\./g, '');
      const gReporter = gMatch[2].replace(/\./g, '');
      if (dReporter === gReporter) return true;
    }
  }
  
  // For statutes: check title + section
  const statPattern = /(\d+)\s+usc?\s+§?\s*(\d+)/i;
  const dStat = dNorm.match(statPattern);
  const gStat = gNorm.match(statPattern);
  if (dStat && gStat) {
    if (dStat[1] === gStat[1] && dStat[2] === gStat[2]) return true;
  }
  
  // For case names, check if both "v." citations share the same parties
  if (dNorm.includes(' v ') && gNorm.includes(' v ')) {
    const dParts = dNorm.split(' v ');
    const gParts = gNorm.split(' v ');
    if (dParts.length >= 2 && gParts.length >= 2) {
      const dP1 = dParts[0].trim().split(' ').pop() || '';
      const dP2 = dParts[1].trim().split(' ')[0] || '';
      const gP1 = gParts[0].trim().split(' ').pop() || '';
      const gP2 = gParts[1].trim().split(' ')[0] || '';
      if (dP1 === gP1 && dP2 === gP2) return true;
    }
  }
  
  return false;
}

function compareBrief(briefData: BriefData): void {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`BRIEF: ${briefData.source}`);
  console.log(`Total pages: ${briefData.total_pages}, TOA pages: ${briefData.toa_start_page}-${briefData.toa_end_page}`);
  console.log(`Ground truth TOA citations: ${briefData.toa_citations.length}`);
  console.log(`${'='.repeat(70)}`);
  
  // Build page map from body pages
  const pageMap = new Map<number, string>();
  for (const [pageNum, text] of Object.entries(briefData.body_pages)) {
    pageMap.set(parseInt(pageNum), text);
  }
  
  // Run our parser
  const result = parseDocument(briefData.body_text, pageMap);
  const detected = getIncludedCitations(result.citations);
  
  console.log(`\nOur parser detected: ${detected.length} citations (${result.citations.length} total incl. short forms)`);
  
  // Category breakdown
  const detectedByCategory = new Map<string, number>();
  for (const d of detected) {
    const cat = categoryToString(d.category);
    detectedByCategory.set(cat, (detectedByCategory.get(cat) || 0) + 1);
  }
  
  const groundTruthByCategory = new Map<string, number>();
  for (const g of briefData.toa_citations) {
    groundTruthByCategory.set(g.category, (groundTruthByCategory.get(g.category) || 0) + 1);
  }
  
  console.log('\nCategory breakdown:');
  console.log(`${'Category'.padEnd(20)} ${'Ground Truth'.padEnd(15)} ${'Detected'.padEnd(15)}`);
  console.log('-'.repeat(50));
  const allCategories = new Set([...detectedByCategory.keys(), ...groundTruthByCategory.keys()]);
  for (const cat of ['Cases', 'Statutes', 'Constitutional', 'Rules', 'Regulations', 'Treatises', 'Other']) {
    if (allCategories.has(cat)) {
      const gt = groundTruthByCategory.get(cat) || 0;
      const dt = detectedByCategory.get(cat) || 0;
      console.log(`${cat.padEnd(20)} ${String(gt).padEnd(15)} ${String(dt).padEnd(15)}`);
    }
  }
  
  // Match analysis: which ground truth citations did we find?
  const matched: string[] = [];
  const missed: string[] = [];
  const matchedGT = new Set<number>();
  
  for (let gi = 0; gi < briefData.toa_citations.length; gi++) {
    const gt = briefData.toa_citations[gi];
    let found = false;
    for (const d of detected) {
      if (isMatch(d.text, gt.text)) {
        found = true;
        matchedGT.add(gi);
        break;
      }
    }
    if (found) {
      matched.push(gt.text);
    } else {
      missed.push(`[${gt.category}] ${gt.text}`);
    }
  }
  
  // False positives: citations we detected that aren't in the ground truth
  const falsePositives: string[] = [];
  for (const d of detected) {
    let found = false;
    for (const gt of briefData.toa_citations) {
      if (isMatch(d.text, gt.text)) {
        found = true;
        break;
      }
    }
    if (!found) {
      falsePositives.push(`[${categoryToString(d.category)}] ${d.text}`);
    }
  }
  
  const recall = briefData.toa_citations.length > 0 
    ? (matched.length / briefData.toa_citations.length * 100).toFixed(1) 
    : 'N/A';
  const precision = detected.length > 0
    ? ((detected.length - falsePositives.length) / detected.length * 100).toFixed(1)
    : 'N/A';
  
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`RESULTS:`);
  console.log(`  Matched:          ${matched.length} / ${briefData.toa_citations.length}`);
  console.log(`  Missed:           ${missed.length}`);
  console.log(`  False positives:  ${falsePositives.length}`);
  console.log(`  Recall:           ${recall}%`);
  console.log(`  Precision:        ${precision}%`);
  
  if (missed.length > 0) {
    console.log(`\nMISSED CITATIONS (in ground truth but not detected):`);
    for (const m of missed.slice(0, 30)) {
      console.log(`  ✗ ${m}`);
    }
    if (missed.length > 30) {
      console.log(`  ... and ${missed.length - 30} more`);
    }
  }
  
  if (falsePositives.length > 0) {
    console.log(`\nFALSE POSITIVES (detected but not in ground truth):`);
    for (const fp of falsePositives.slice(0, 20)) {
      console.log(`  ⚠ ${fp}`);
    }
    if (falsePositives.length > 20) {
      console.log(`  ... and ${falsePositives.length - 20} more`);
    }
  }
}

// Main
const briefDir = __dirname;
const jsonFiles = fs.readdirSync(briefDir).filter(f => f.endsWith('.json'));

if (jsonFiles.length === 0) {
  console.error('No JSON brief files found. Run extract_briefs.py first.');
  process.exit(1);
}

console.log(`Found ${jsonFiles.length} brief(s) to compare.\n`);

for (const jsonFile of jsonFiles) {
  const data: BriefData = JSON.parse(fs.readFileSync(path.join(briefDir, jsonFile), 'utf-8'));
  compareBrief(data);
}

console.log('\n' + '='.repeat(70));
console.log('COMPARISON COMPLETE');
console.log('='.repeat(70));
