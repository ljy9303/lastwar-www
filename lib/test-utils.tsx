import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Custom matchers and utilities
export const mockUser = {
  userSeq: 1,
  name: 'TestUser',
  level: 50,
  power: 1000000,
  userGrade: 'L1',
  leave: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const mockDesert = {
  id: 1,
  name: 'Test Desert',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Test utilities for common assertions
export const waitForLoadingToFinish = () => new Promise(resolve => setTimeout(resolve, 0))

export const createMockProps = (overrides: Record<string, any> = {}) => ({
  ...overrides,
})

// Mock Next.js router for tests
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
}

// Helper to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))