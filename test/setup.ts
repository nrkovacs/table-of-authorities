/**
 * Jest test setup
 */

// Mock Office.js if needed
global.Office = {
  onReady: jest.fn(),
  context: {},
} as any;

global.Word = {
  run: jest.fn(),
  InsertLocation: {
    before: 'before',
    after: 'after',
  },
} as any;
