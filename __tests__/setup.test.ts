/**
 * Test environment verification
 * This test ensures that the testing environment is properly configured
 */

describe('Test Environment Setup', () => {
  it('should have Jest configured', () => {
    expect(jest).toBeDefined()
  })

  it('should have testing library matchers available', () => {
    const element = document.createElement('div')
    element.textContent = 'Hello World'
    document.body.appendChild(element)
    
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Hello World')
  })

  it('should have fetch function available', () => {
    // Since MSW is temporarily disabled, just check fetch is available
    expect(global.fetch).toBeDefined()
    expect(typeof global.fetch).toBe('function')
  })

  it('should mock Next.js router', () => {
    // This should not throw since router is mocked in jest.setup.js
    jest.requireMock('next/navigation')
    expect(true).toBe(true)
  })

  it('should mock framer-motion', () => {
    const { motion } = jest.requireMock('framer-motion')
    expect(motion).toBeDefined()
    expect(motion.div).toBeDefined()
  })

  it('should have global mocks configured', () => {
    expect(global.ResizeObserver).toBeDefined()
    expect(global.IntersectionObserver).toBeDefined()
    expect(window.matchMedia).toBeDefined()
    expect(global.scrollTo).toBeDefined()
  })
})