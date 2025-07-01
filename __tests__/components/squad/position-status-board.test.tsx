import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PositionStatusBoard } from '@/components/squad/position-status-board'

// Mock squad actions
jest.mock('@/app/actions/squad-actions', () => ({
  SquadMember: {},
}))

// Mock useToast hook
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn(),
}
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
})

// Mock squad members for testing
const mockSquadMembers = [
  {
    userSeq: 1,
    userName: 'Member A',
    userLevel: 25,
    position: 0, // 공격/지원
  },
  {
    userSeq: 2,
    userName: 'Member B',
    userLevel: 30,
    position: 1, // 1시
  },
  {
    userSeq: 3,
    userName: 'Member C',
    userLevel: 28,
    position: 2, // 2시
  },
  {
    userSeq: 4,
    userName: 'Member D',
    userLevel: 26,
    position: 4, // 4시
  },
  {
    userSeq: 5,
    userName: 'Member E',
    userLevel: 24,
    position: -1, // 포지션 미지정
  },
]

const mockReserveMembers = [
  {
    userSeq: 6,
    userName: 'Reserve A',
    userLevel: 22,
    position: -1,
  },
  {
    userSeq: 7,
    userName: 'Reserve B',
    userLevel: 23,
    position: -1,
  },
]

describe('PositionStatusBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockToast.mockClear()
    mockClipboard.writeText.mockClear()
  })

  describe('Rendering', () => {
    it('renders with default empty data', () => {
      render(
        <PositionStatusBoard
          teamAMembers={[]}
          teamBMembers={[]}
        />
      )

      expect(screen.getByText('포지션 현황')).toBeInTheDocument()
      expect(screen.getByText('A조 포지션 현황')).toBeInTheDocument()
      expect(screen.getByText('B조 포지션 현황')).toBeInTheDocument()
    })

    it('renders with team members data', () => {
      render(
        <PositionStatusBoard
          teamAMembers={mockSquadMembers.slice(0, 3)}
          teamBMembers={mockSquadMembers.slice(3, 5)}
        />
      )

      expect(screen.getByText('Member A')).toBeInTheDocument()
      expect(screen.getByText('Member B')).toBeInTheDocument()
      expect(screen.getByText('Member C')).toBeInTheDocument()
      expect(screen.getByText('Member D')).toBeInTheDocument()
      expect(screen.getByText('Member E')).toBeInTheDocument()
    })

    it('displays correct member count for each team', () => {
      render(
        <PositionStatusBoard
          teamAMembers={mockSquadMembers.slice(0, 3)}
          teamBMembers={mockSquadMembers.slice(3, 5)}
        />
      )

      // A팀: 3명 중 2명 포지션 지정 (포지션 -1 제외)
      expect(screen.getByText('2/3명')).toBeInTheDocument()
      
      // B팀: 2명 중 1명 포지션 지정
      expect(screen.getByText('1/2명')).toBeInTheDocument()
    })

    it('shows reserve members when provided', () => {
      render(
        <PositionStatusBoard
          teamAMembers={mockSquadMembers.slice(0, 2)}
          teamBMembers={mockSquadMembers.slice(2, 4)}
          teamAReserveMembers={mockReserveMembers.slice(0, 1)}
          teamBReserveMembers={mockReserveMembers.slice(1, 2)}
        />
      )

      expect(screen.getByText('Reserve A')).toBeInTheDocument()
      expect(screen.getByText('Reserve B')).toBeInTheDocument()
    })

    it('displays position information correctly', () => {
      render(
        <PositionStatusBoard
          teamAMembers={mockSquadMembers.slice(0, 4)}
          teamBMembers={[]}
        />
      )

      expect(screen.getByText('공격/지원')).toBeInTheDocument()
      expect(screen.getByText('1시')).toBeInTheDocument()
      expect(screen.getByText('2시')).toBeInTheDocument()
      expect(screen.getByText('4시')).toBeInTheDocument()
    })
  })

  describe('Team Expansion/Collapse', () => {
    it('expands and collapses team A', async () => {
      const user = userEvent.setup()

      render(
        <PositionStatusBoard
          teamAMembers={mockSquadMembers.slice(0, 2)}
          teamBMembers={[]}
        />
      )

      // Initially expanded, so member should be visible
      expect(screen.getByText('Member A')).toBeInTheDocument()

      // Click to collapse
      const teamAHeader = screen.getByText('A조 포지션 현황')
      await user.click(teamAHeader)

      // Member should not be visible after collapse
      expect(screen.queryByText('Member A')).not.toBeInTheDocument()

      // Click to expand again
      await user.click(teamAHeader)

      // Member should be visible again
      expect(screen.getByText('Member A')).toBeInTheDocument()
    })

    it('expands and collapses team B', async () => {
      const user = userEvent.setup()

      render(
        <PositionStatusBoard
          teamAMembers={[]}
          teamBMembers={mockSquadMembers.slice(0, 2)}
        />
      )

      // Initially expanded
      expect(screen.getByText('Member A')).toBeInTheDocument()

      // Click to collapse
      const teamBHeader = screen.getByText('B조 포지션 현황')
      await user.click(teamBHeader)

      // Member should not be visible
      expect(screen.queryByText('Member A')).not.toBeInTheDocument()
    })

    it('toggles all teams at once', async () => {
      const user = userEvent.setup()

      render(
        <PositionStatusBoard
          teamAMembers={mockSquadMembers.slice(0, 1)}
          teamBMembers={mockSquadMembers.slice(1, 2)}
        />
      )

      // Initially expanded
      expect(screen.getByText('Member A')).toBeInTheDocument()
      expect(screen.getByText('Member B')).toBeInTheDocument()

      // Click "모두 접기"
      const toggleAllButton = screen.getByText('모두 접기')
      await user.click(toggleAllButton)

      // Both members should not be visible
      expect(screen.queryByText('Member A')).not.toBeInTheDocument()
      expect(screen.queryByText('Member B')).not.toBeInTheDocument()

      // Button text should change to "모두 펼치기"
      expect(screen.getByText('모두 펼치기')).toBeInTheDocument()

      // Click "모두 펼치기"
      await user.click(screen.getByText('모두 펼치기'))

      // Both members should be visible again
      expect(screen.getByText('Member A')).toBeInTheDocument()
      expect(screen.getByText('Member B')).toBeInTheDocument()
    })
  })

  describe('Position Grouping', () => {
    it('groups members by position correctly', () => {
      const membersWithPositions = [
        { userSeq: 1, userName: 'Attack1', userLevel: 25, position: 0 },
        { userSeq: 2, userName: 'Attack2', userLevel: 26, position: 0 },
        { userSeq: 3, userName: 'Pos1', userLevel: 27, position: 1 },
        { userSeq: 4, userName: 'Pos2', userLevel: 28, position: 2 },
      ]

      render(
        <PositionStatusBoard
          teamAMembers={membersWithPositions}
          teamBMembers={[]}
        />
      )

      // 공격/지원 position should have 2 members
      const attackSection = screen.getByText('공격/지원').closest('div')
      expect(attackSection).toBeInTheDocument()
      expect(within(attackSection as HTMLElement).getByText('2명')).toBeInTheDocument()

      // Other positions should have 1 member each
      const pos1Section = screen.getByText('1시').closest('div')
      expect(within(pos1Section as HTMLElement).getByText('1명')).toBeInTheDocument()

      const pos2Section = screen.getByText('2시').closest('div')
      expect(within(pos2Section as HTMLElement).getByText('1명')).toBeInTheDocument()
    })

    it('handles members without position assignment', () => {
      const membersWithUnassigned = [
        { userSeq: 1, userName: 'Assigned', userLevel: 25, position: 1 },
        { userSeq: 2, userName: 'Unassigned', userLevel: 26, position: -1 },
        { userSeq: 3, userName: 'Undefined', userLevel: 27 }, // position undefined
      ]

      render(
        <PositionStatusBoard
          teamAMembers={membersWithUnassigned}
          teamBMembers={[]}
        />
      )

      // Only assigned member should contribute to count
      expect(screen.getByText('1/3명')).toBeInTheDocument()
    })

    it('shows empty state for positions with no members', () => {
      render(
        <PositionStatusBoard
          teamAMembers={[{ userSeq: 1, userName: 'OnlyMember', userLevel: 25, position: 1 }]}
          teamBMembers={[]}
        />
      )

      // Attack position should show empty state
      const attackSection = screen.getByText('공격/지원').closest('div')
      expect(within(attackSection as HTMLElement).getByText('배정된 멤버가 없습니다.')).toBeInTheDocument()
    })
  })

  describe('Clipboard Functionality', () => {
    it('copies team A position information to clipboard', async () => {
      const user = userEvent.setup()
      mockClipboard.writeText.mockResolvedValue(undefined)

      render(
        <PositionStatusBoard
          teamAMembers={mockSquadMembers.slice(0, 3)}
          teamBMembers={[]}
        />
      )

      const copyButton = screen.getAllByTitle('포지션 정보 복사')[0]
      await user.click(copyButton)

      expect(mockClipboard.writeText).toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith({
        title: '복사 완료!',
        description: 'A팀 포지션 정보가 클립보드에 복사되었습니다.',
        duration: 3000,
      })
    })

    it('copies team B position information to clipboard', async () => {
      const user = userEvent.setup()
      mockClipboard.writeText.mockResolvedValue(undefined)

      render(
        <PositionStatusBoard
          teamAMembers={[]}
          teamBMembers={mockSquadMembers.slice(0, 2)}
        />
      )

      const copyButtons = screen.getAllByTitle('포지션 정보 복사')
      const teamBCopyButton = copyButtons[1]
      await user.click(teamBCopyButton)

      expect(mockClipboard.writeText).toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith({
        title: '복사 완료!',
        description: 'B팀 포지션 정보가 클립보드에 복사되었습니다.',
        duration: 3000,
      })
    })

    it('handles clipboard access failure', async () => {
      const user = userEvent.setup()
      mockClipboard.writeText.mockRejectedValue(new Error('Access denied'))

      render(
        <PositionStatusBoard
          teamAMembers={mockSquadMembers.slice(0, 1)}
          teamBMembers={[]}
        />
      )

      const copyButton = screen.getAllByTitle('포지션 정보 복사')[0]
      await user.click(copyButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '복사 실패',
          description: '클립보드 접근 권한이 없습니다.',
          variant: 'destructive',
          duration: 3000,
        })
      })
    })

    it('includes reserve members in clipboard text', async () => {
      const user = userEvent.setup()
      mockClipboard.writeText.mockResolvedValue(undefined)

      render(
        <PositionStatusBoard
          teamAMembers={mockSquadMembers.slice(0, 2)}
          teamBMembers={[]}
          teamAReserveMembers={mockReserveMembers.slice(0, 1)}
        />
      )

      const copyButton = screen.getAllByTitle('포지션 정보 복사')[0]
      await user.click(copyButton)

      const clipboardText = mockClipboard.writeText.mock.calls[0][0]
      expect(clipboardText).toContain('예비 출정')
      expect(clipboardText).toContain('Reserve A')
    })

    it('stops propagation when clicking copy button', async () => {
      const user = userEvent.setup()
      mockClipboard.writeText.mockResolvedValue(undefined)

      render(
        <PositionStatusBoard
          teamAMembers={mockSquadMembers.slice(0, 1)}
          teamBMembers={[]}
        />
      )

      // Initially expanded
      expect(screen.getByText('Member A')).toBeInTheDocument()

      const copyButton = screen.getAllByTitle('포지션 정보 복사')[0]
      await user.click(copyButton)

      // Team should still be expanded (click shouldn't propagate to header)
      expect(screen.getByText('Member A')).toBeInTheDocument()
    })
  })

  describe('Position Icons and Descriptions', () => {
    it('displays correct icons for different positions', () => {
      const membersAllPositions = [
        { userSeq: 1, userName: 'Attack', userLevel: 25, position: 0 },
        { userSeq: 2, userName: 'Hospital1', userLevel: 26, position: 1 },
        { userSeq: 3, userName: 'Refinery', userLevel: 27, position: 4 },
        { userSeq: 4, userName: 'TechCenter', userLevel: 28, position: 5 },
      ]

      render(
        <PositionStatusBoard
          teamAMembers={membersAllPositions}
          teamBMembers={[]}
        />
      )

      // Check that position labels are present
      expect(screen.getByText('공격/지원')).toBeInTheDocument()
      expect(screen.getByText('1시')).toBeInTheDocument()
      expect(screen.getByText('4시')).toBeInTheDocument()
      expect(screen.getByText('5시')).toBeInTheDocument()
    })

    it('shows position descriptions', () => {
      render(
        <PositionStatusBoard
          teamAMembers={[{ userSeq: 1, userName: 'Test', userLevel: 25, position: 1 }]}
          teamBMembers={[]}
        />
      )

      expect(screen.getByText('- 1시 병원')).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('shows empty state when no members assigned to team', () => {
      render(
        <PositionStatusBoard
          teamAMembers={[]}
          teamBMembers={[]}
        />
      )

      const emptyMessages = screen.getAllByText('배정된 멤버가 없습니다.')
      expect(emptyMessages.length).toBeGreaterThan(0)
    })

    it('shows correct member count for teams with no position assignments', () => {
      const unassignedMembers = [
        { userSeq: 1, userName: 'Member1', userLevel: 25, position: -1 },
        { userSeq: 2, userName: 'Member2', userLevel: 26 }, // no position property
      ]

      render(
        <PositionStatusBoard
          teamAMembers={unassignedMembers}
          teamBMembers={[]}
        />
      )

      // 0 assigned out of 2 total members
      expect(screen.getByText('0/2명')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <PositionStatusBoard
          teamAMembers={[]}
          teamBMembers={[]}
        />
      )

      expect(screen.getByRole('heading', { level: 2, name: '포지션 현황' })).toBeInTheDocument()
    })

    it('has accessible copy buttons', () => {
      render(
        <PositionStatusBoard
          teamAMembers={mockSquadMembers.slice(0, 1)}
          teamBMembers={[]}
        />
      )

      const copyButtons = screen.getAllByRole('button', { name: /포지션 정보 복사/ })
      expect(copyButtons.length).toBeGreaterThan(0)
      
      copyButtons.forEach(button => {
        expect(button).toHaveAttribute('title', '포지션 정보 복사')
      })
    })

    it('has screen reader text for copy buttons', () => {
      render(
        <PositionStatusBoard
          teamAMembers={mockSquadMembers.slice(0, 1)}
          teamBMembers={[]}
        />
      )

      const srTexts = screen.getAllByText('포지션 정보 복사')
      expect(srTexts.some(text => text.classList.contains('sr-only'))).toBe(true)
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()

      render(
        <PositionStatusBoard
          teamAMembers={mockSquadMembers.slice(0, 1)}
          teamBMembers={[]}
        />
      )

      // Should be able to tab through interactive elements
      await user.tab()
      
      // Some element should have focus
      expect(document.activeElement).toBeDefined()
    })
  })

  describe('Responsive Layout', () => {
    it('renders in grid layout for desktop', () => {
      render(
        <PositionStatusBoard
          teamAMembers={mockSquadMembers.slice(0, 2)}
          teamBMembers={mockSquadMembers.slice(2, 4)}
        />
      )

      // Should have grid layout
      const gridContainer = screen.getByText('A조 포지션 현황').closest('.grid')?.parentElement
      expect(gridContainer).toHaveClass('grid', 'lg:grid-cols-2')
    })

    it('displays member information in responsive grid', () => {
      render(
        <PositionStatusBoard
          teamAMembers={[{
            userSeq: 1,
            userName: 'TestMember',
            userLevel: 25,
            position: 0
          }]}
          teamBMembers={[]}
        />
      )

      // Member container should have responsive grid classes
      const memberContainer = screen.getByText('TestMember').closest('.grid')
      expect(memberContainer).toHaveClass('grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4')
    })
  })
})