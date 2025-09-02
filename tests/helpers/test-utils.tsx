import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock user with authentication state
export const mockAuthenticatedUser = {
  id: 'test-user-id',
  name: 'Test User',
  firstName: 'Test',
  email: 'test@example.com',
};

export const mockUnauthenticatedUser = null;

// Mock chapter data
export const mockChapter = {
  id: 1,
  title: 'Test Chapter',
  slug: 'test-chapter',
  description: 'A test chapter for testing',
  content: '<p>This is test content</p>',
  categoryId: 1,
  chapterNumber: 1,
  estimatedMinutes: 5,
  contentType: 'lesson' as const,
  audioUrl: null,
  completed: false,
};

// Mock category data
export const mockCategory = {
  id: 1,
  title: 'Test Category',
  slug: 'test-category',
  description: 'A test category',
  sortOrder: 1,
};

// Mock progress data
export const mockProgress = {
  id: 1,
  userId: 'test-user-id',
  chapterId: 1,
  completed: true,
  completedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Utility to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));