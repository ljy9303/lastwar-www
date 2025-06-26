import { render, screen } from '@/lib/test-utils'

// Example component for testing
const ExampleComponent: React.FC<{ title: string; count?: number }> = ({ 
  title, 
  count = 0 
}) => {
  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {count}</p>
      <button onClick={() => {}}>Click me</button>
    </div>
  )
}

describe('ExampleComponent', () => {
  it('should render title correctly', () => {
    render(<ExampleComponent title="Test Title" />)
    
    expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument()
  })

  it('should render count with default value', () => {
    render(<ExampleComponent title="Test" />)
    
    expect(screen.getByText('Count: 0')).toBeInTheDocument()
  })

  it('should render count with provided value', () => {
    render(<ExampleComponent title="Test" count={5} />)
    
    expect(screen.getByText('Count: 5')).toBeInTheDocument()
  })

  it('should render button', () => {
    render(<ExampleComponent title="Test" />)
    
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('should be wrapped by test provider', () => {
    render(<ExampleComponent title="Test" />)
    
    expect(screen.getByTestId('test-wrapper')).toBeInTheDocument()
  })
})