/**
 * Test setup – compatible with Vitest globals mode.
 * Mocks Office.js APIs that are not available in Node.
 */
import { vi } from 'vitest';

(global as any).Office = {
  onReady: vi.fn(),
  context: {},
};

(global as any).Word = {
  run: vi.fn(),
  InsertLocation: { before: 'before', after: 'after' },
};
