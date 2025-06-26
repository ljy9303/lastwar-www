/**
 * Basic test to verify Jest and testing environment works
 */

describe('Basic Test Environment', () => {
  it('should run Jest tests', () => {
    expect(2 + 2).toBe(4)
  })

  it('should have testing library matchers', () => {
    const element = document.createElement('div')
    element.textContent = 'Hello World'
    document.body.appendChild(element)
    
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Hello World')
  })

  it('should mock Next.js router', () => {
    const { useRouter } = require('next/navigation')
    const mockRouter = useRouter()
    
    expect(mockRouter.push).toBeDefined()
    expect(typeof mockRouter.push).toBe('function')
  })

  it('should have global mocks configured', () => {
    expect(global.ResizeObserver).toBeDefined()
    expect(global.IntersectionObserver).toBeDefined()
    expect(window.matchMedia).toBeDefined()
    expect(global.scrollTo).toBeDefined()
  })
})