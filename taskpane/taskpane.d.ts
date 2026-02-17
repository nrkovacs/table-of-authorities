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
import './taskpane.css';
//# sourceMappingURL=taskpane.d.ts.map