#!/usr/bin/env python3
"""
Extract text from real legal brief PDFs and split into:
1. The existing Table of Authorities (ground truth)
2. The brief body (what our parser will scan)

Outputs JSON files for each brief.
"""

import pdfplumber
import json
import re
import os
import sys

def extract_text_from_pdf(pdf_path):
    """Extract all text from a PDF, page by page."""
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            pages.append({"page_number": i + 1, "text": text})
    return pages

def find_toa_boundaries(pages):
    """Find the start and end of the Table of Authorities section."""
    toa_start_page = None
    toa_end_page = None
    
    for i, page in enumerate(pages):
        text = page["text"].upper()
        
        # Look for TOA header
        if toa_start_page is None:
            if re.search(r'TABLE\s+OF\s+AUTHORITIES', text):
                toa_start_page = i
                continue
        
        # Once we found TOA, look for end markers
        if toa_start_page is not None and toa_end_page is None:
            # TOA ends when we hit a new major section
            # Common endings: INTRODUCTION, STATEMENT, PRELIMINARY STATEMENT,
            # OPINION BELOW, OPINIONS BELOW, JURISDICTIONAL STATEMENT,
            # QUESTIONS PRESENTED, ISSUE PRESENTED, ARGUMENT
            end_markers = [
                r'^\s*INTRODUCTION\b',
                r'^\s*PRELIMINARY\s+STATEMENT\b',
                r'^\s*STATEMENT\s+OF\s+(?:THE\s+)?(?:CASE|FACTS|ISSUES)',
                r'^\s*STATEMENT\s+OF\s+JURISDICTION',
                r'^\s*JURISDICTIONAL\s+STATEMENT',
                r'^\s*OPINIONS?\s+BELOW',
                r'^\s*QUESTIONS?\s+PRESENTED',
                r'^\s*ISSUES?\s+PRESENTED',
                r'^\s*SUMMARY\s+OF\s+(?:THE\s+)?ARGUMENT',
                r'^\s*ARGUMENT\b',
                r'^\s*I\.\s+',  # Start of numbered argument sections
            ]
            
            for line in text.split('\n'):
                line_stripped = line.strip()
                for marker in end_markers:
                    if re.match(marker, line_stripped) and 'TABLE' not in line_stripped:
                        toa_end_page = i
                        break
                if toa_end_page is not None:
                    break
    
    return toa_start_page, toa_end_page

def extract_toa_citations(toa_text):
    """Parse the actual TOA text to extract cited authorities."""
    citations = []
    current_category = None
    
    category_patterns = [
        (r'^\s*CASES\b', 'Cases'),
        (r'^\s*STATUTES?\b', 'Statutes'),
        (r'^\s*CONSTITUTIONAL\s+PROVISIONS?\b', 'Constitutional Provisions'),
        (r'^\s*RULES?\b', 'Rules'),
        (r'^\s*REGULATIONS?\b', 'Regulations'),
        (r'^\s*TREAT(?:IS)?ES?\b', 'Treatises'),
        (r'^\s*OTHER\s+AUTHORITIES\b', 'Other Authorities'),
        (r'^\s*SECONDARY\s+(?:SOURCES|AUTHORITIES)\b', 'Treatises'),
        (r'^\s*LEGISLATIVE\s+MATERIALS?\b', 'Other Authorities'),
    ]
    
    for line in toa_text.split('\n'):
        line_stripped = line.strip()
        if not line_stripped:
            continue
        
        # Skip page headers and "Page(s)" labels
        if re.match(r'^(?:Page\(?s?\)?|TABLE\s+OF\s+AUTHORITIES)', line_stripped, re.IGNORECASE):
            continue
        if re.match(r'^\d+$', line_stripped):  # Just a page number
            continue
        if re.match(r'^[ivxlcdm]+$', line_stripped, re.IGNORECASE):  # Roman numeral page
            continue
        
        # Check for category headers
        is_category = False
        for pattern, cat_name in category_patterns:
            if re.match(pattern, line_stripped, re.IGNORECASE):
                current_category = cat_name
                is_category = True
                break
        
        if is_category:
            continue
        
        # Extract citation text (before dots/page numbers)
        # Pattern: citation text .... page numbers
        citation_match = re.match(r'^(.+?)(?:\s*\.{2,}\s*|\s{3,})(.+)$', line_stripped)
        if citation_match:
            citation_text = citation_match.group(1).strip()
            page_info = citation_match.group(2).strip()
            
            if citation_text and len(citation_text) > 3:
                citations.append({
                    'text': citation_text,
                    'category': current_category or 'Unknown',
                    'pages': page_info,
                })
        elif current_category and len(line_stripped) > 5 and not line_stripped.startswith('Page'):
            # Some TOAs don't use dot leaders; try to catch the citation anyway
            # Look for page number at end
            page_match = re.match(r'^(.+?)\s+(\d[\d,\s]*(?:passim)?)$', line_stripped)
            if page_match:
                citations.append({
                    'text': page_match.group(1).strip(),
                    'category': current_category,
                    'pages': page_match.group(2).strip(),
                })
    
    return citations

def process_brief(pdf_path):
    """Process a single brief PDF."""
    print(f"\n{'='*60}")
    print(f"Processing: {os.path.basename(pdf_path)}")
    print(f"{'='*60}")
    
    pages = extract_text_from_pdf(pdf_path)
    print(f"  Total pages: {len(pages)}")
    
    toa_start, toa_end = find_toa_boundaries(pages)
    print(f"  TOA pages: {toa_start} to {toa_end}")
    
    if toa_start is None:
        print("  WARNING: Could not find Table of Authorities!")
        return None
    
    if toa_end is None:
        toa_end = min(toa_start + 5, len(pages))  # Assume max 5 pages of TOA
        print(f"  WARNING: Could not find TOA end, assuming page {toa_end}")
    
    # Extract TOA text
    toa_text = '\n'.join(pages[i]["text"] for i in range(toa_start, toa_end))
    
    # Extract body text (everything after TOA)
    body_pages = {}
    for i in range(toa_end, len(pages)):
        body_pages[i + 1] = pages[i]["text"]
    body_text = '\n'.join(pages[i]["text"] for i in range(toa_end, len(pages)))
    
    # Parse the actual TOA
    toa_citations = extract_toa_citations(toa_text)
    print(f"  Citations in actual TOA: {len(toa_citations)}")
    for cat in set(c['category'] for c in toa_citations):
        count = len([c for c in toa_citations if c['category'] == cat])
        print(f"    {cat}: {count}")
    
    # Save results
    basename = os.path.splitext(os.path.basename(pdf_path))[0]
    output = {
        'source': os.path.basename(pdf_path),
        'total_pages': len(pages),
        'toa_start_page': toa_start + 1,
        'toa_end_page': toa_end + 1 if toa_end else None,
        'toa_text': toa_text,
        'toa_citations': toa_citations,
        'body_text': body_text,
        'body_pages': body_pages,
    }
    
    output_path = f"{basename}.json"
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    print(f"  Saved to: {output_path}")
    
    return output

def main():
    brief_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_files = sorted(f for f in os.listdir(brief_dir) if f.endswith('.pdf'))
    
    if not pdf_files:
        print("No PDF files found!")
        sys.exit(1)
    
    results = []
    for pdf_file in pdf_files:
        pdf_path = os.path.join(brief_dir, pdf_file)
        result = process_brief(pdf_path)
        if result:
            results.append(result)
    
    print(f"\n\nProcessed {len(results)} briefs successfully.")

if __name__ == '__main__':
    main()
