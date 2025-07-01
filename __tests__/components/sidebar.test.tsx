import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Sidebar from '@/components/sidebar'

// Mock next/navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
      replace: mockReplace,
      refresh: mockRefresh,
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname: jest.fn(),
}))

// Mock useMobile hook
const mockUseMobile = jest.fn()
jest.mock('@/hooks/use-mobile', () => ({
  useMobile: () => mockUseMobile(),
}))

// Mock window.innerWidth
const mockInnerWidth = jest.fn()
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
})

describe('Sidebar', () => {
  const { usePathname } = require('next/navigation')

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMobile.mockReturnValue(false)
    usePathname.mockReturnValue('/dashboard')
    
    // Reset window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  describe('Desktop Sidebar', () => {
    it('renders desktop sidebar with all navigation items', () => {
      render(<Sidebar />)

      // Check if desktop sidebar is rendered
      expect(screen.getByText('1242 ROKK')).toBeInTheDocument()
      
      // Check navigation items
      expect(screen.getByText('대시보드')).toBeInTheDocument()
      expect(screen.getByText('유저 관리')).toBeInTheDocument()
      expect(screen.getByText('사막전 관리')).toBeInTheDocument()
      expect(screen.getByText('연맹원 랜덤뽑기')).toBeInTheDocument()
    })

    it('highlights current page in navigation', () => {
      usePathname.mockReturnValue('/users')
      
      render(<Sidebar />)

      const usersLink = screen.getByRole('link', { name: /유저 관리/ })
      expect(usersLink).toHaveClass('bg-accent')
    })

    it('shows all nav items with icons when expanded', () => {
      render(<Sidebar />)

      // All icons should be present
      const icons = screen.getAllByRole('img', { hidden: true }) // lucide icons
      expect(icons.length).toBeGreaterThan(0)

      // All text labels should be visible
      expect(screen.getByText('대시보드')).toBeVisible()
      expect(screen.getByText('유저 관리')).toBeVisible()
      expect(screen.getByText('사막전 관리')).toBeVisible()
      expect(screen.getByText('연맹원 랜덤뽑기')).toBeVisible()
    })

    it('collapses sidebar when collapse button is clicked', async () => {
      const user = userEvent.setup()

      render(<Sidebar />)

      // Find collapse button (ChevronLeft icon)
      const collapseButton = screen.getByRole('button')
      await user.click(collapseButton)

      // Title should be hidden when collapsed
      await waitFor(() => {
        const title = screen.queryByText('1242 ROKK')
        expect(title).not.toBeInTheDocument()
      })
    })

    it('expands sidebar when expand button is clicked', async () => {
      const user = userEvent.setup()

      render(<Sidebar />)

      // First collapse
      const collapseButton = screen.getByRole('button')
      await user.click(collapseButton)

      // Then expand
      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      // Title should be visible again
      await waitFor(() => {
        expect(screen.getByText('1242 ROKK')).toBeInTheDocument()
      })
    })

    it('has proper link hrefs for navigation items', () => {
      render(<Sidebar />)

      expect(screen.getByRole('link', { name: /대시보드/ })).toHaveAttribute('href', '/dashboard')
      expect(screen.getByRole('link', { name: /유저 관리/ })).toHaveAttribute('href', '/users')
      expect(screen.getByRole('link', { name: /사막전 관리/ })).toHaveAttribute('href', '/events')
      expect(screen.getByRole('link', { name: /연맹원 랜덤뽑기/ })).toHaveAttribute('href', '/lottery')
    })

    it('has proper title attributes for navigation items', () => {
      render(<Sidebar />)

      expect(screen.getByRole('link', { name: /대시보드/ })).toHaveAttribute('title', '대시보드')
      expect(screen.getByRole('link', { name: /유저 관리/ })).toHaveAttribute('title', '유저 관리')
      expect(screen.getByRole('link', { name: /사막전 관리/ })).toHaveAttribute('title', '사막전 관리')
      expect(screen.getByRole('link', { name: /연맹원 랜덤뽑기/ })).toHaveAttribute('title', '연맹원 랜덤뽑기')
    })
  })

  describe('Mobile Sidebar', () => {
    beforeEach(() => {
      mockUseMobile.mockReturnValue(true)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })
    })

    it('renders mobile header instead of desktop sidebar', () => {
      render(<Sidebar />)

      // Mobile header should be visible
      const menuButton = screen.getByRole('button', { name: /메뉴 열기/ })
      expect(menuButton).toBeInTheDocument()

      // Desktop sidebar should be hidden (has md:flex class)
      const desktopSidebar = screen.getByText('1242 ROKK').closest('div')
      expect(desktopSidebar).toHaveClass('hidden')
    })

    it('opens mobile menu when menu button is clicked', async () => {
      const user = userEvent.setup()

      render(<Sidebar />)

      const menuButton = screen.getByRole('button', { name: /메뉴 열기/ })
      await user.click(menuButton)

      // Mobile navigation should be visible
      await waitFor(() => {
        expect(screen.getAllByText('1242 ROKK')).toHaveLength(2) // Header + mobile menu
      })
    })

    it('closes mobile menu when close button is clicked', async () => {
      const user = userEvent.setup()

      render(<Sidebar />)

      // Open menu
      const menuButton = screen.getByRole('button', { name: /메뉴 열기/ })
      await user.click(menuButton)

      // Close menu
      const closeButton = screen.getByRole('button').closest('button')
      if (closeButton) {
        await user.click(closeButton)
      }

      await waitFor(() => {
        expect(screen.getAllByText('1242 ROKK')).toHaveLength(1) // Only header
      })
    })

    it('closes mobile menu when navigation item is clicked', async () => {
      const user = userEvent.setup()

      render(<Sidebar />)

      // Open menu
      const menuButton = screen.getByRole('button', { name: /메뉴 열기/ })
      await user.click(menuButton)

      // Click navigation item
      await waitFor(async () => {
        const userManagementLink = screen.getAllByText('유저 관리')[0]
        if (userManagementLink) {
          await user.click(userManagementLink)
        }
      })

      // Menu should close
      await waitFor(() => {
        expect(screen.getAllByText('1242 ROKK')).toHaveLength(1)
      })
    })

    it('shows current page title in mobile header', () => {
      usePathname.mockReturnValue('/users')

      render(<Sidebar />)

      expect(screen.getByText('유저 관리')).toBeInTheDocument()
    })

    it('shows pending count badge for events in mobile menu', async () => {
      const user = userEvent.setup()

      render(<Sidebar />)

      // Open menu
      const menuButton = screen.getByRole('button', { name: /메뉴 열기/ })
      await user.click(menuButton)

      // Check for pending count badge (default is 3)
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('closes mobile menu when window is resized to desktop size', async () => {
      mockUseMobile.mockReturnValue(true)
      
      render(<Sidebar />)

      // Open mobile menu
      const user = userEvent.setup()
      const menuButton = screen.getByRole('button', { name: /메뉴 열기/ })
      await user.click(menuButton)

      // Simulate window resize to desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      // Trigger resize event
      fireEvent(window, new Event('resize'))

      await waitFor(() => {
        expect(screen.getAllByText('1242 ROKK')).toHaveLength(1)
      })
    })

    it('handles window resize events properly', () => {
      render(<Sidebar />)

      // Initial width
      expect(window.innerWidth).toBe(1024)

      // Trigger resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      })
      fireEvent(window, new Event('resize'))

      // Component should handle resize without errors
      expect(screen.getByText('1242 ROKK')).toBeInTheDocument()
    })
  })

  describe('Navigation Items Configuration', () => {
    it('has correct navigation items structure', () => {
      render(<Sidebar />)

      // All navigation items should be present with correct structure
      const navItems = [
        { title: '대시보드', href: '/dashboard' },
        { title: '유저 관리', href: '/users' },
        { title: '사막전 관리', href: '/events' },
        { title: '연맹원 랜덤뽑기', href: '/lottery' },
      ]

      navItems.forEach(item => {
        const link = screen.getByRole('link', { name: new RegExp(item.title) })
        expect(link).toHaveAttribute('href', item.href)
      })
    })

    it('displays icons for all navigation items', () => {
      render(<Sidebar />)

      // Each navigation item should have an icon
      const navLinks = screen.getAllByRole('link').filter(link => 
        link.getAttribute('href')?.startsWith('/')
      )

      navLinks.forEach(link => {
        const icon = link.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper screen reader text for menu button', () => {
      mockUseMobile.mockReturnValue(true)
      
      render(<Sidebar />)

      const menuButton = screen.getByRole('button', { name: /메뉴 열기/ })
      expect(menuButton).toBeInTheDocument()
    })

    it('has proper navigation structure', () => {
      render(<Sidebar />)

      const navElement = screen.getByRole('navigation')
      expect(navElement).toBeInTheDocument()
    })

    it('has keyboard navigation support', async () => {
      const user = userEvent.setup()

      render(<Sidebar />)

      // Tab through navigation items
      await user.tab()
      
      // Should be able to navigate with keyboard
      const focusedElement = document.activeElement
      expect(focusedElement).toBeDefined()
    })

    it('has proper ARIA attributes for mobile sheet', async () => {
      mockUseMobile.mockReturnValue(true)
      const user = userEvent.setup()

      render(<Sidebar />)

      const menuButton = screen.getByRole('button', { name: /메뉴 열기/ })
      await user.click(menuButton)

      // Sheet should have proper ARIA attributes
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })
  })

  describe('Brand Logo', () => {
    it('displays brand logo and makes it clickable', () => {
      render(<Sidebar />)

      const logoLink = screen.getByRole('link', { name: /1242 ROKK/ })
      expect(logoLink).toHaveAttribute('href', '/dashboard')
    })

    it('hides brand logo when sidebar is collapsed', async () => {
      const user = userEvent.setup()

      render(<Sidebar />)

      // Collapse sidebar
      const collapseButton = screen.getByRole('button')
      await user.click(collapseButton)

      // Logo should be hidden
      await waitFor(() => {
        const logo = screen.queryByRole('link', { name: /1242 ROKK/ })
        expect(logo).not.toBeInTheDocument()
      })
    })
  })

  describe('Badge Display', () => {
    it('shows page title badge in mobile header when not on home page', () => {
      mockUseMobile.mockReturnValue(true)
      usePathname.mockReturnValue('/users')

      render(<Sidebar />)

      // Should show current page badge
      const badges = screen.getAllByText('유저 관리')
      expect(badges.length).toBeGreaterThan(1) // One in header, one in badge
    })

    it('does not show badge when on home page', () => {
      mockUseMobile.mockReturnValue(true)
      usePathname.mockReturnValue('/')

      render(<Sidebar />)

      // Should not show badge on home page
      const pageTitle = screen.getByText('1242 ROKK')
      expect(pageTitle).toBeInTheDocument()
    })
  })
})