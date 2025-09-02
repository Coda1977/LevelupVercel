import { vi } from 'vitest';

// Integration test setup - runs against real-ish environment

// Mock external APIs to avoid hitting real services during tests
vi.mock('@server/openai.ts', () => ({
  getChatResponse: vi.fn().mockResolvedValue('Mocked AI response'),
  getOpenAIChatResponse: vi.fn().mockResolvedValue('Mocked AI response'),
  getChatResponseStream: vi.fn().mockImplementation(async function* () {
    yield 'Mocked';
    yield ' streaming';
    yield ' response';
  }),
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ text: 'Mocked Anthropic response' }],
      }),
    },
  })),
}));

// Mock audio generation to avoid file system operations
vi.mock('@server/audio.ts', () => ({
  generateAudio: vi.fn().mockResolvedValue('/mocked/audio/path.mp3'),
  generateHighQualityAudio: vi.fn().mockResolvedValue('/mocked/audio/hq-path.mp3'),
  deleteAudioFile: vi.fn().mockResolvedValue(undefined),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/levelup_test';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.SESSION_SECRET = 'test-session-secret-for-integration-tests';
process.env.REPL_ID = 'test-repl-id';
process.env.REPLIT_DOMAINS = 'localhost,127.0.0.1';

// Global test timeout
vi.setConfig({ testTimeout: 30000 });