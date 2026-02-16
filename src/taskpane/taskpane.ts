/**
 * Task pane main logic - Office.js integration
 */

import { parseDocument, Citation, getCitationsByCategory } from '../citation-parser';
import { generateTableOfAuthorities } from '../toa-generator';
import './taskpane.css';

// Global state
let currentCitations: Citation[] = [];

/**
 * Initialize Office Add-in
 */
Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    // Attach event handlers
    document.getElementById('scanButton')?.addEventListener('click', scanDocument);
    document.getElementById('generateButton')?.addEventListener('click', generateTOA);
    
    // Show initial message
    showStatus('Ready to scan document', 'info');
  }
});

/**
 * Show status message
 */
function showStatus(message: string, type: 'info' | 'error' | 'success') {
  const statusEl = document.getElementById('status');
  const messageEl = document.getElementById('statusMessage');
  
  if (statusEl && messageEl) {
    statusEl.className = `status ${type}`;
    messageEl.textContent = message;
    statusEl.classList.remove('hidden');
  }
}

/**
 * Hide status message
 */
function hideStatus() {
  document.getElementById('status')?.classList.add('hidden');
}

/**
 * Show/update progress bar
 */
function showProgress(percent: number, text: string) {
  const container = document.getElementById('progressContainer');
  const bar = document.getElementById('progressBar');
  const textEl = document.getElementById('progressText');
  
  if (container && bar && textEl) {
    container.classList.remove('hidden');
    bar.style.width = `${percent}%`;
    textEl.textContent = text;
  }
}

/**
 * Hide progress bar
 */
function hideProgress() {
  document.getElementById('progressContainer')?.classList.add('hidden');
}

/**
 * Scan the document for citations
 */
async function scanDocument() {
  try {
    hideStatus();
    showProgress(0, 'Reading document...');
    
    const scanButton = document.getElementById('scanButton') as HTMLButtonElement;
    if (scanButton) scanButton.disabled = true;
    
    // Read document content with page numbers
    await Word.run(async (context) => {
      showProgress(20, 'Extracting text...');
      
      const body = context.document.body;
      const paragraphs = body.paragraphs;
      
      // Load paragraph text
      paragraphs.load('text');
      await context.sync();
      
      showProgress(40, 'Analyzing citations...');
      
      // Build page map (simplified - real implementation would use sections/page breaks)
      const pageMap = new Map<number, string>();
      const charsPerPage = 3000; // Rough estimate
      let currentPage = 1;
      let currentPageText = '';
      
      for (let i = 0; i < paragraphs.items.length; i++) {
        const para = paragraphs.items[i];
        currentPageText += para.text + '\n';
        
        // Estimate page breaks
        if (currentPageText.length > charsPerPage) {
          pageMap.set(currentPage, currentPageText);
          currentPage++;
          currentPageText = '';
        }
      }
      
      // Add remaining text
      if (currentPageText) {
        pageMap.set(currentPage, currentPageText);
      }
      
      showProgress(60, 'Detecting citation patterns...');
      
      // Get settings
      const includeFootnotes = (document.getElementById('includeFootnotes') as HTMLInputElement)?.checked ?? true;
      
      // Parse citations
      const fullText = Array.from(pageMap.values()).join('\n');
      const parsed = parseDocument(fullText, pageMap, {
        includeFootnotes,
      });
      
      showProgress(80, 'Organizing citations...');
      
      currentCitations = parsed.citations;
      
      showProgress(100, 'Done!');
      
      // Display results
      displayStatistics(currentCitations);
      displayCitations(currentCitations);
      
      // Enable generate button
      const generateButton = document.getElementById('generateButton') as HTMLButtonElement;
      if (generateButton) generateButton.disabled = false;
      
      hideProgress();
      showStatus(`Found ${currentCitations.length} citations`, 'success');
    });
    
  } catch (error: any) {
    console.error('Error scanning document:', error);
    hideProgress();
    showStatus(`Error: ${error.message || 'Failed to scan document'}`, 'error');
  } finally {
    const scanButton = document.getElementById('scanButton') as HTMLButtonElement;
    if (scanButton) scanButton.disabled = false;
  }
}

/**
 * Display citation statistics
 */
function displayStatistics(citations: Citation[]) {
  const statsEl = document.getElementById('stats');
  const contentEl = document.getElementById('statsContent');
  
  if (!statsEl || !contentEl) return;
  
  // Count by category
  const counts = new Map<string, number>();
  for (const cit of citations) {
    if (!cit.isShortForm) {
      const category = cit.category;
      counts.set(category, (counts.get(category) || 0) + 1);
    }
  }
  
  // Build HTML
  let html = '';
  for (const [category, count] of counts.entries()) {
    html += `
      <div class="stat-item">
        <span class="stat-label">${category}</span>
        <span class="stat-value">${count}</span>
      </div>
    `;
  }
  
  const total = citations.filter(c => !c.isShortForm).length;
  html += `
    <div class="stat-item">
      <span class="stat-label"><strong>Total Citations</strong></span>
      <span class="stat-value"><strong>${total}</strong></span>
    </div>
  `;
  
  contentEl.innerHTML = html;
  statsEl.classList.remove('hidden');
}

/**
 * Display citations grouped by category
 */
function displayCitations(citations: Citation[]) {
  const listEl = document.getElementById('citationsList');
  const contentEl = document.getElementById('citationsContent');
  
  if (!listEl || !contentEl) return;
  
  // Group by category
  const grouped = getCitationsByCategory(citations);
  
  // Build HTML
  let html = '';
  for (const [category, cits] of grouped.entries()) {
    const nonShortForm = cits.filter(c => !c.isShortForm);
    if (nonShortForm.length === 0) continue;
    
    html += `<div class="category-section">`;
    html += `<div class="category-header">${category} (${nonShortForm.length})</div>`;
    
    for (const cit of nonShortForm) {
      const pages = cit.pages.join(', ');
      html += `
        <div class="citation-item">
          <input 
            type="checkbox" 
            class="citation-checkbox" 
            data-citation-id="${cit.id}"
            ${cit.isIncluded ? 'checked' : ''}
          />
          <div class="citation-text">
            ${escapeHtml(cit.text)}
            <div class="citation-pages">Pages: ${pages}</div>
          </div>
        </div>
      `;
    }
    
    html += `</div>`;
  }
  
  contentEl.innerHTML = html;
  
  // Attach checkbox event handlers
  contentEl.querySelectorAll('.citation-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const citId = target.dataset.citationId;
      const citation = currentCitations.find(c => c.id === citId);
      if (citation) {
        citation.isIncluded = target.checked;
      }
    });
  });
  
  listEl.classList.remove('hidden');
}

/**
 * Generate and insert Table of Authorities
 */
async function generateTOA() {
  try {
    hideStatus();
    showProgress(0, 'Preparing Table of Authorities...');
    
    const generateButton = document.getElementById('generateButton') as HTMLButtonElement;
    if (generateButton) generateButton.disabled = true;
    
    // Get settings
    const passimThreshold = parseInt(
      (document.getElementById('passimThreshold') as HTMLInputElement)?.value || '6'
    );
    const useDotLeaders = (document.getElementById('useDotLeaders') as HTMLInputElement)?.checked ?? true;
    
    showProgress(30, 'Formatting citations...');
    
    // Generate TOA text
    const toaText = generateTableOfAuthorities(currentCitations, {
      onlyIncluded: true,
      asOOXML: false,
      format: {
        passimThreshold,
        useDotLeaders,
      },
    });
    
    showProgress(60, 'Inserting into document...');
    
    // Insert into Word document
    await Word.run(async (context) => {
      const selection = context.document.getSelection();
      
      // Insert at cursor position
      const range = selection.insertParagraph(toaText, Word.InsertLocation.before);
      range.font.size = 12;
      range.font.name = 'Times New Roman';
      
      await context.sync();
      
      showProgress(100, 'Complete!');
    });
    
    hideProgress();
    
    const includedCount = currentCitations.filter(c => c.isIncluded && !c.isShortForm).length;
    showStatus(`Table of Authorities generated with ${includedCount} citations`, 'success');
    
  } catch (error: any) {
    console.error('Error generating TOA:', error);
    hideProgress();
    showStatus(`Error: ${error.message || 'Failed to generate TOA'}`, 'error');
  } finally {
    const generateButton = document.getElementById('generateButton') as HTMLButtonElement;
    if (generateButton) generateButton.disabled = false;
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
