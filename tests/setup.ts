import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/levelup_test',
    OPENAI_API_KEY: 'test-key',
    ANTHROPIC_API_KEY: 'test-key',
    SESSION_SECRET: 'test-secret',
    REPL_ID: 'test-repl-id',
    REPLIT_DOMAINS: 'localhost',
  },
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    reload: vi.fn(),
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console methods in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});