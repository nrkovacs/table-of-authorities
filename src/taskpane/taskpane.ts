/**
 * AutoTOA — Task Pane Logic
 *
 * Architecture:
 *   1. SCAN  — regex-parse the document, extract & deduplicate citations
 *   2. MARK  — inject native { TA } fields next to each citation
 *              (with \l long cite, \s short cite, \c category)
 *   3. ID.   — one-click Id. resolver using session memory of last authority
 *   4. TOA   — Document Hygiene guard → insert native { TOA } fields per category
 */

import {
  parseDocument,
  Citation,
  CitationCategory,
  getCitationsByCategory,
} from '../citation-parser';
import {
  stripPinCite,
  getCategoryCode,
  buildTAFieldCode,
  buildIdTAFieldCode,
  buildTOAFieldCode,
  escapeFieldQuotes,
  StrippedCitation,
} from '../citation-parser/pincite-stripper';
import './taskpane.css';

/* ─── Global State ────────────────────────────────────────────────── */

let currentCitations: Citation[] = [];

/** Prepared TA data for each citation (long cite, short cite, category code) */
let preparedTA: Map<string, StrippedCitation> = new Map();

/** Session memory for the Id. resolver */
let lastMarkedShortCite: string | null = null;
let lastMarkedCategoryCode: number | null = null;

/* ─── Office Init ─────────────────────────────────────────────────── */

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    document.getElementById('scanButton')!.addEventListener('click', scanDocument);
    document.getElementById('markAllButton')!.addEventListener('click', markAllCitations);
    document.getElementById('markIdButton')!.addEventListener('click', markAsId);
    document.getElementById('generateButton')!.addEventListener('click', generateTOA);
    showStatus('Ready — click Scan to begin.', 'info');
  }
});

/* ─── Helpers ─────────────────────────────────────────────────────── */

function showStatus(msg: string, type: 'info' | 'error' | 'success') {
  const el = document.getElementById('status')!;
  const msgEl = document.getElementById('statusMessage')!;
  el.className = `status ${type}`;
  msgEl.textContent = msg;
  el.classList.remove('hidden');
}

function showProgress(pct: number, text: string) {
  const c = document.getElementById('progressContainer')!;
  const b = document.getElementById('progressBar')! as HTMLElement;
  const t = document.getElementById('progressText')!;
  c.classList.remove('hidden');
  b.style.width = `${pct}%`;
  t.textContent = text;
}

function hideProgress() {
  document.getElementById('progressContainer')!.classList.add('hidden');
}

function escapeHtml(text: string): string {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

/* ─── STEP 1: Scan Document ───────────────────────────────────────── */

async function scanDocument() {
  try {
    showProgress(0, 'Reading document…');
    (document.getElementById('scanButton') as HTMLButtonElement).disabled = true;

    await Word.run(async (context) => {
      const paragraphs = context.document.body.paragraphs;
      paragraphs.load('text');
      await context.sync();

      showProgress(30, 'Detecting citations…');

      // Build page map (rough: 3 000 chars ≈ 1 page)
      const pageMap = new Map<number, string>();
      let page = 1;
      let buf = '';
      for (const p of paragraphs.items) {
        buf += p.text + '\n';
        if (buf.length > 3000) {
          pageMap.set(page++, buf);
          buf = '';
        }
      }
      if (buf) pageMap.set(page, buf);

      showProgress(60, 'Deduplicating…');

      const fullText = Array.from(pageMap.values()).join('\n');
      const parsed = parseDocument(fullText, pageMap, {
        includeFootnotes:
          (document.getElementById('includeFootnotes') as HTMLInputElement)?.checked ?? true,
      });

      currentCitations = parsed.citations;

      // Prepare TA field data (strip pin cites, build short cites)
      preparedTA.clear();
      for (const cit of currentCitations) {
        if (!cit.isShortForm) {
          preparedTA.set(cit.id, stripPinCite(cit.text, cit.category as CitationCategory));
        }
      }

      showProgress(90, 'Rendering UI…');
      displayStats(currentCitations);
      displayCitations(currentCitations);

      // Show next steps
      document.getElementById('markSection')!.classList.remove('hidden');
      document.getElementById('idSection')!.classList.remove('hidden');
      document.getElementById('generateSection')!.classList.remove('hidden');

      hideProgress();
      const fullCount = currentCitations.filter((c) => !c.isShortForm).length;
      showStatus(`Found ${fullCount} unique citations (${currentCitations.length} total incl. short forms).`, 'success');
    });
  } catch (err: any) {
    hideProgress();
    showStatus(`Scan error: ${err.message}`, 'error');
  } finally {
    (document.getElementById('scanButton') as HTMLButtonElement).disabled = false;
  }
}

/* ─── Display helpers ─────────────────────────────────────────────── */

function displayStats(citations: Citation[]) {
  const el = document.getElementById('statsContent')!;
  const counts = new Map<string, number>();
  for (const c of citations) {
    if (!c.isShortForm) counts.set(c.category, (counts.get(c.category) || 0) + 1);
  }
  let html = '';
  for (const [cat, n] of counts) html += `<div class="stat-row"><span>${cat}</span><span>${n}</span></div>`;
  const total = citations.filter((c) => !c.isShortForm).length;
  html += `<div class="stat-row total"><span><b>Total</b></span><span><b>${total}</b></span></div>`;
  el.innerHTML = html;
  document.getElementById('stats')!.classList.remove('hidden');
}

function displayCitations(citations: Citation[]) {
  const content = document.getElementById('citationsContent')!;
  const grouped = getCitationsByCategory(citations);
  let html = '';

  for (const [category, cits] of grouped.entries()) {
    const full = cits.filter((c) => !c.isShortForm);
    if (!full.length) continue;

    html += `<div class="cat-group"><div class="cat-title">${category} (${full.length})</div>`;
    for (const cit of full) {
      const ta = preparedTA.get(cit.id);
      const longDisplay = ta ? ta.longCite : cit.text;
      const shortDisplay = ta ? ta.shortCite : '';
      html += `
        <label class="cite-row">
          <input type="checkbox" class="cite-cb"
                 data-id="${cit.id}" ${cit.isIncluded ? 'checked' : ''} />
          <div class="cite-body">
            <div class="cite-long">${escapeHtml(longDisplay)}</div>
            <div class="cite-short">Short: <em>${escapeHtml(shortDisplay)}</em></div>
            <div class="cite-pages">Pages: ${cit.pages.join(', ')}</div>
          </div>
        </label>`;
    }
    html += '</div>';
  }

  content.innerHTML = html;

  // Wire up checkboxes
  content.querySelectorAll('.cite-cb').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      const t = e.target as HTMLInputElement;
      const c = currentCitations.find((x) => x.id === t.dataset.id);
      if (c) c.isIncluded = t.checked;
    });
  });

  document.getElementById('citationsList')!.classList.remove('hidden');
}

/* ─── STEP 2: Mark All Citations (TA Field Injection) ─────────────── */

async function markAllCitations() {
  try {
    const btn = document.getElementById('markAllButton') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = '⏳ Marking…';

    const included = currentCitations.filter((c) => c.isIncluded && !c.isShortForm);
    if (!included.length) {
      showStatus('No citations selected.', 'error');
      return;
    }

    // TA field injection requires Word Desktop (WordApi 1.5+)
    if (!supportsNativeFields()) {
      showStatus(
        'TA field marking requires Word Desktop. In Word Online, skip to Step 3 — the TOA will be generated with formatted text.',
        'info'
      );
      return;
    }

    showProgress(0, 'Injecting TA fields…');

    await Word.run(async (context) => {
      for (let i = 0; i < included.length; i++) {
        const cit = included[i];
        const ta = preparedTA.get(cit.id);
        if (!ta) continue;

        showProgress(Math.round((i / included.length) * 90),
          `Marking ${i + 1}/${included.length}: ${ta.shortCite}`);

        const results = context.document.body.search(cit.text, {
          matchCase: false,
          matchWholeWord: false,
        });
        results.load('items');
        await context.sync();

        if (results.items.length > 0) {
          const range = results.items[0];
          const fieldCode = buildTAFieldCode(ta.longCite, ta.shortCite, ta.categoryCode);
          range.insertField(
            Word.InsertLocation.after,
            Word.FieldType.ta,
            fieldCode,
            false
          );
          await context.sync();

          lastMarkedShortCite = ta.shortCite;
          lastMarkedCategoryCode = ta.categoryCode;
          document.getElementById('lastMarkedCite')!.textContent = ta.shortCite;
        }
      }
    });

    showProgress(100, 'Done!');
    hideProgress();
    showStatus(`✅ Marked ${included.length} citations with native TA fields.`, 'success');
  } catch (err: any) {
    hideProgress();
    showStatus(`Mark error: ${err.message}`, 'error');
  } finally {
    const btn = document.getElementById('markAllButton') as HTMLButtonElement;
    btn.disabled = false;
    btn.textContent = '📌 2. Mark All Citations (TA Fields)';
  }
}

/* ─── Id. Resolver ────────────────────────────────────────────────── */

async function markAsId() {
  try {
    if (!supportsNativeFields()) {
      showStatus(
        'Id. marking requires Word Desktop. In Word Online, skip to Step 3.',
        'info'
      );
      return;
    }

    if (!lastMarkedShortCite || lastMarkedCategoryCode === null) {
      showStatus('No previous authority in session. Mark at least one citation first.', 'error');
      return;
    }

    await Word.run(async (context) => {
      const selection = context.document.getSelection();
      selection.load('text');
      await context.sync();

      if (!selection.text || selection.text.trim().length === 0) {
        showStatus('Select an "Id." reference in the document first.', 'error');
        return;
      }

      const fieldCode = buildIdTAFieldCode(lastMarkedShortCite!, lastMarkedCategoryCode!);
      selection.insertField(
        Word.InsertLocation.after,
        Word.FieldType.ta,
        fieldCode,
        false
      );
      await context.sync();

      showStatus(
        `✅ Marked "Id." → grouped under "${lastMarkedShortCite}" (cat ${lastMarkedCategoryCode}).`,
        'success'
      );
    });
  } catch (err: any) {
    showStatus(`Id. error: ${err.message}`, 'error');
  }
}

/* ─── STEP 3: TOA Generation ──────────────────────────────────────── */

/**
 * Detect whether the Word.FieldType.toa API is available (Word Desktop 1.5+).
 * Word Online does not support insertField / FieldType, so we fall back to
 * inserting the TOA as formatted paragraphs with dot leaders.
 */
function supportsNativeFields(): boolean {
  try {
    return typeof Word.FieldType !== 'undefined' && Word.FieldType.toa !== undefined;
  } catch {
    return false;
  }
}

async function generateTOA() {
  try {
    const btn = document.getElementById('generateButton') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = '⏳ Generating…';

    showProgress(0, 'Preparing TOA…');

    const included = currentCitations.filter((c) => c.isIncluded && !c.isShortForm);
    if (!included.length) {
      hideProgress();
      showStatus('No citations to include. Run Scan first.', 'error');
      return;
    }

    const useNative = supportsNativeFields();

    await Word.run(async (context) => {

      showProgress(10, 'Inserting page break…');

      /* ── Page break before TOA ─────────────────────────────────── */
      const selection = context.document.getSelection();
      selection.insertBreak(Word.BreakType.page, Word.InsertLocation.before);
      await context.sync();

      /* ── Title ──────────────────────────────────────────────────── */
      showProgress(20, 'Writing title…');
      const title = context.document.getSelection()
        .insertParagraph('TABLE OF AUTHORITIES', Word.InsertLocation.before);
      title.alignment = Word.Alignment.centered;
      title.font.bold = true;
      title.font.size = 14;
      title.font.name = 'Times New Roman';
      title.spaceAfter = 12;
      await context.sync();

      /* ── Category definitions (standard TOA order) ─────────────── */
      const categories = [
        { code: 1, name: 'CASES',                    category: CitationCategory.Cases },
        { code: 2, name: 'STATUTES',                 category: CitationCategory.Statutes },
        { code: 6, name: 'CONSTITUTIONAL PROVISIONS', category: CitationCategory.Constitutional },
        { code: 4, name: 'RULES',                    category: CitationCategory.Rules },
        { code: 5, name: 'REGULATIONS',              category: CitationCategory.Regulations },
        { code: 7, name: 'TREATISES',                category: CitationCategory.Treatises },
        { code: 3, name: 'OTHER AUTHORITIES',        category: CitationCategory.Other },
      ];

      const usedCats = new Set(included.map((c) => c.category));

      let step = 0;
      const totalCats = categories.filter((c) => usedCats.has(c.category)).length;

      for (const cat of categories) {
        if (!usedCats.has(cat.category)) continue;
        step++;

        showProgress(
          20 + Math.round((step / totalCats) * 70),
          `Writing ${cat.name}…`
        );

        /* ── Category heading ──────────────────────────────────── */
        const heading = context.document.getSelection()
          .insertParagraph(cat.name, Word.InsertLocation.before);
        heading.font.bold = true;
        heading.font.size = 12;
        heading.font.name = 'Times New Roman';
        heading.font.underline = Word.UnderlineType.single;
        heading.spaceBefore = 12;
        heading.spaceAfter = 6;
        await context.sync();

        if (useNative) {
          /* ── Native TOA field (Word Desktop) ───────────────── */
          const fieldPara = context.document.getSelection()
            .insertParagraph('', Word.InsertLocation.before);
          fieldPara.font.name = 'Times New Roman';
          fieldPara.font.size = 12;
          await context.sync();

          const toaCode = `\\h \\c "${cat.code}" \\p`;
          const fieldRange = fieldPara.getRange(Word.RangeLocation.content);
          fieldRange.insertField(
            Word.InsertLocation.replace,
            Word.FieldType.toa,
            toaCode,
            false
          );
          await context.sync();
        } else {
          /* ── Formatted-text fallback (Word Online) ─────────── */
          const catCitations = included
            .filter((c) => c.category === cat.category)
            .sort((a, b) => a.text.localeCompare(b.text));

          for (const cit of catCitations) {
            const ta = preparedTA.get(cit.id);
            const longCite = ta ? ta.longCite : cit.text;

            // Build page string
            const uniquePages = [...new Set(cit.pages)].sort((a, b) => a - b);
            const pageStr =
              uniquePages.length >= 6
                ? `${uniquePages.slice(0, 6).join(', ')}, passim`
                : uniquePages.join(', ');

            // Build dot-leader line: "Citation ........... 3, 7, 12"
            const MAX_LEN = 72;
            const baseLen = longCite.length + pageStr.length + 2;
            const dots =
              baseLen < MAX_LEN
                ? ' ' + '.'.repeat(Math.max(3, MAX_LEN - baseLen)) + ' '
                : ' ... ';
            const lineText = `${longCite}${dots}${pageStr}`;

            const para = context.document.getSelection()
              .insertParagraph(lineText, Word.InsertLocation.before);
            para.font.name = 'Times New Roman';
            para.font.size = 12;
            para.font.bold = false;

            // Italicize case names (everything up to the comma before the reporter)
            if (cat.category === CitationCategory.Cases) {
              const commaIdx = longCite.search(/,\s+\d/);
              if (commaIdx > 0) {
                const caseNameRange = para.getRange(Word.RangeLocation.whole);
                // We can't easily sub-range in Word Online, so we set the
                // entire paragraph to normal and accept no italics for now.
                // A future version could use insertHtml for richer formatting.
              }
            }
            await context.sync();
          }
        }
      }

      showProgress(95, 'Finalizing…');

      // Spacer paragraph
      context.document.getSelection()
        .insertParagraph('', Word.InsertLocation.before);
      await context.sync();
    });

    showProgress(100, 'Done!');
    hideProgress();

    if (useNative) {
      showStatus(
        '✅ TOA generated with native fields! Right-click → "Update Field" to render page numbers.',
        'success'
      );
    } else {
      showStatus(
        '✅ TOA generated! Page numbers are from the scan. For live page numbers, use Word Desktop.',
        'success'
      );
    }
  } catch (err: any) {
    hideProgress();
    showStatus(`TOA error: ${err.message}`, 'error');
  } finally {
    const btn = document.getElementById('generateButton') as HTMLButtonElement;
    btn.disabled = false;
    btn.textContent = '📄 3. Generate TOA at Cursor';
  }
}
