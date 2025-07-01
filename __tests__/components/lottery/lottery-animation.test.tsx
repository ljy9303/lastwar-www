import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { LotteryAnimation } from '@/components/lottery/lottery-animation'
import type { User } from '@/types/user'
import confetti from 'canvas-confetti'

// Mock canvas-confetti
jest.mock('canvas-confetti', () => jest.fn())

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
}))

// Mock users for testing
const mockUsers: User[] = [
  {
    userSeq: 1,
    name: 'User A',
    level: 25,
    power: 50000000,
    leave: false,
    userGrade: 'R3',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    userSeq: 2,
    name: 'User B',
    level: 30,
    power: 75000000,
    leave: false,
    userGrade: 'R1',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    userSeq: 3,
    name: 'User C',
    level: 20,
    power: 30000000,
    leave: false,
    userGrade: 'R5',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    userSeq: 4,
    name: 'User D',
    level: 28,
    power: 60000000,
    leave: false,
    userGrade: 'R2',
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
  {
    userSeq: 5,
    name: 'User E',
    level: 22,
    power: 40000000,
    leave: false,
    userGrade: 'R4',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
]

describe('LotteryAnimation', () => {
  const mockOnAnimationComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(confetti as jest.Mock).mockClear()
    
    // Mock setTimeout and clearTimeout
    jest.useFakeTimers()
    jest.spyOn(global, 'setTimeout')
    jest.spyOn(global, 'clearTimeout')
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    it('returns null when not animating', () => {
      const { container } = render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={false}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('renders animation container when animating', () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      expect(screen.getByText('연맹원 랜덤 추첨 중...')).toBeInTheDocument()
      expect(screen.getByText('추첨 중...')).toBeInTheDocument()
    })

    it('displays correct user count information', () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      expect(screen.getByText('5명 중 2명 선정 중')).toBeInTheDocument()
    })

    it('shows slot machine effect with user data', () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={1}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Should display user information in slot machine format
      const userElements = screen.getAllByText(/Lv\.\d+/)
      expect(userElements.length).toBeGreaterThan(0)

      const powerElements = screen.getAllByText(/\d{1,3}(,\d{3})*/)
      expect(powerElements.length).toBeGreaterThan(0)
    })
  })

  describe('Animation Logic', () => {
    it('handles empty user list gracefully', () => {
      render(
        <LotteryAnimation
          selectedUsers={[]}
          winnerCount={2}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      expect(mockOnAnimationComplete).toHaveBeenCalledWith([])
    })

    it('handles zero winner count gracefully', () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={0}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      expect(mockOnAnimationComplete).toHaveBeenCalledWith([])
    })

    it('completes animation and shows winners', async () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Fast forward through animation
      act(() => {
        jest.advanceTimersByTime(10000) // Fast forward past animation duration
      })

      await waitFor(() => {
        expect(screen.getByText('🎉 추첨 완료! 🎉')).toBeInTheDocument()
      })

      expect(screen.getByText('2명의 당첨자가 선정되었습니다')).toBeInTheDocument()
    })

    it('calls onAnimationComplete with correct number of winners', async () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={3}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Fast forward through animation
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        expect(mockOnAnimationComplete).toHaveBeenCalled()
      })

      const callArgs = mockOnAnimationComplete.mock.calls[0][0]
      expect(callArgs).toHaveLength(3)
      expect(callArgs.every((winner: User) => mockUsers.includes(winner))).toBe(true)
    })

    it('ensures winners are unique users', async () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={5}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Fast forward through animation
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        expect(mockOnAnimationComplete).toHaveBeenCalled()
      })

      const winners = mockOnAnimationComplete.mock.calls[0][0]
      const uniqueWinners = new Set(winners.map((w: User) => w.userSeq))
      expect(uniqueWinners.size).toBe(winners.length)
    })

    it('limits winners to available user count', async () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers.slice(0, 2)} // Only 2 users
          winnerCount={5} // Request 5 winners
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Fast forward through animation
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        expect(mockOnAnimationComplete).toHaveBeenCalled()
      })

      const winners = mockOnAnimationComplete.mock.calls[0][0]
      expect(winners.length).toBeLessThanOrEqual(2) // Should not exceed available users
    })
  })

  describe('Confetti Effect', () => {
    it('triggers confetti when animation completes', async () => {
      // Mock getBoundingClientRect
      const mockGetBoundingClientRect = jest.fn(() => ({
        left: 100,
        right: 200,
        top: 50,
        bottom: 150,
        width: 100,
        height: 100,
      }))

      Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
        value: mockGetBoundingClientRect,
      })

      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={1}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Fast forward through animation
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        expect(confetti).toHaveBeenCalled()
      })

      expect(confetti).toHaveBeenCalledWith({
        particleCount: 100,
        spread: 70,
        origin: { x: expect.any(Number), y: expect.any(Number) },
      })
    })
  })

  describe('Winner Display', () => {
    it('displays winners with correct information', async () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Fast forward through animation
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        expect(screen.getByText('🎉 추첨 완료! 🎉')).toBeInTheDocument()
      })

      // Check for winner numbering
      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByText('#2')).toBeInTheDocument()

      // Check that winner information is displayed
      const winnerElements = screen.getAllByText(/Lv\.\d+/)
      expect(winnerElements.length).toBeGreaterThan(0)
    })

    it('handles single winner correctly', async () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={1}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Fast forward through animation
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        expect(screen.getByText('1명의 당첨자가 선정되었습니다')).toBeInTheDocument()
      })

      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.queryByText('#2')).not.toBeInTheDocument()
    })

    it('displays winner list in scrollable container when many winners', async () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={5}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Fast forward through animation
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        expect(screen.getByText('🎉 추첨 완료! 🎉')).toBeInTheDocument()
      })

      // Should have scrollable container
      const scrollableContainer = screen.getByText('#1').closest('.overflow-y-auto')
      expect(scrollableContainer).toBeInTheDocument()
      expect(scrollableContainer).toHaveClass('max-h-[300px]')
    })
  })

  describe('Animation States', () => {
    it('resets state when animation stops', () => {
      const { rerender } = render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Animation is running
      expect(screen.getByText('추첨 중...')).toBeInTheDocument()

      // Stop animation
      rerender(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={false}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Component should not render when not animating
      expect(screen.queryByText('추첨 중...')).not.toBeInTheDocument()
    })

    it('shows loading spinner during animation', () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Loading elements should be present
      expect(screen.getByText('추첨 중...')).toBeInTheDocument()
      
      // Check for spinner (Loader2 component)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('shows slot machine interface during animation', () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Slot machine elements should be present
      const slotContainer = screen.getByText('추첨 중...').closest('.relative')
      expect(slotContainer).toBeInTheDocument()

      // Should show user information in slots
      const userNames = mockUsers.map(user => user.name)
      const displayedUsers = userNames.filter(name => 
        screen.queryByText(name)
      )
      expect(displayedUsers.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('handles component unmount during animation', () => {
      const { unmount } = render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Start animation
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Unmount component
      expect(() => unmount()).not.toThrow()
    })

    it('handles rapid animation state changes', () => {
      const { rerender } = render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={false}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Rapidly toggle animation state
      rerender(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      rerender(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={false}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      rerender(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      expect(screen.getByText('추첨 중...')).toBeInTheDocument()
    })

    it('handles different winner counts appropriately', async () => {
      const testCases = [1, 3, 5, 10]

      for (const winnerCount of testCases) {
        const { unmount } = render(
          <LotteryAnimation
            selectedUsers={mockUsers}
            winnerCount={winnerCount}
            isAnimating={true}
            onAnimationComplete={mockOnAnimationComplete}
          />
        )

        expect(screen.getByText(`5명 중 ${winnerCount}명 선정 중`)).toBeInTheDocument()

        unmount()
        jest.clearAllMocks()
      }
    })
  })

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Should have proper heading
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toHaveTextContent('연맹원 랜덤 추첨 중...')
    })

    it('provides status information for screen readers', () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={2}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Status information should be available
      expect(screen.getByText('추첨 중...')).toBeInTheDocument()
      expect(screen.getByText('5명 중 2명 선정 중')).toBeInTheDocument()
    })

    it('maintains focus management during animation', async () => {
      render(
        <LotteryAnimation
          selectedUsers={mockUsers}
          winnerCount={1}
          isAnimating={true}
          onAnimationComplete={mockOnAnimationComplete}
        />
      )

      // Component should not interfere with focus
      expect(document.activeElement).toBeDefined()

      // Complete animation
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        expect(screen.getByText('🎉 추첨 완료! 🎉')).toBeInTheDocument()
      })

      // Focus should still be manageable
      expect(document.activeElement).toBeDefined()
    })
  })
})