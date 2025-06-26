// Polyfill for Node.js environment - must be first
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Response and Request if not available
if (typeof Response === 'undefined') {
  global.Response = require('node-fetch').Response
}
if (typeof Request === 'undefined') {
  global.Request = require('node-fetch').Request
}

import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    a: ({ children, ...props }) => <a {...props}>{children}</a>,
  },
  AnimatePresence: ({ children }) => children,
  useMotionValue: () => ({ set: jest.fn(), get: jest.fn() }),
  useTransform: () => ({}),
  useSpring: () => ({}),
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
}))

// Mock canvas-confetti
jest.mock('canvas-confetti', () => jest.fn())

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock scrollTo
global.scrollTo = jest.fn()

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn()
}

// MSW server setup - temporarily disabled due to Node.js compatibility issues
// TODO: Fix MSW setup for Node.js environment
// let server

// beforeAll(async () => {
//   // Dynamically import MSW server to avoid early loading issues
//   const { server: mswServer } = await import('./lib/mocks/server')
//   server = mswServer
  
//   // Start the interception on test startup
//   server.listen({
//     onUnhandledRequest: 'warn',
//   })
// })

// afterEach(() => {
//   // Reset any request handlers that are declared on a per-test basis
//   if (server) {
//     server.resetHandlers()
//   }
// })

// afterAll(() => {
//   // Clean up after the tests are finished
//   if (server) {
//     server.close()
//   }
// })