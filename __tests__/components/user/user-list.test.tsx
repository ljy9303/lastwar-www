import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserList } from '@/components/user/user-list'
import type { User } from '@/types/user'
import * as userActions from '@/app/actions/user-actions'

// Mock the user actions
jest.mock('@/app/actions/user-actions', () => ({
  deleteUser: jest.fn(),
}))

// Mock useToast hook
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
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
    leave: true,
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
]

describe('UserList', () => {
  const mockOnEdit = jest.fn()
  const mockOnDeleted = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockToast.mockClear()
  })

  describe('Rendering', () => {
    it('renders users table with correct data', () => {
      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      // Check table headers
      expect(screen.getByText('닉네임')).toBeInTheDocument()
      expect(screen.getByText('본부 레벨')).toBeInTheDocument()
      expect(screen.getByText('전투력')).toBeInTheDocument()
      expect(screen.getByText('유저 등급')).toBeInTheDocument()
      expect(screen.getByText('연맹 탈퇴')).toBeInTheDocument()
      expect(screen.getByText('관리')).toBeInTheDocument()

      // Check user data
      expect(screen.getByText('User A')).toBeInTheDocument()
      expect(screen.getByText('User B')).toBeInTheDocument()
      expect(screen.getByText('User C')).toBeInTheDocument()

      // Check level data
      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText('30')).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument()

      // Check power data (formatted with commas)
      expect(screen.getByText('50,000,000')).toBeInTheDocument()
      expect(screen.getByText('75,000,000')).toBeInTheDocument()
      expect(screen.getByText('30,000,000')).toBeInTheDocument()

      // Check user grades
      expect(screen.getByText('R3')).toBeInTheDocument()
      expect(screen.getByText('R1')).toBeInTheDocument()
      expect(screen.getByText('R5')).toBeInTheDocument()

      // Check leave status
      const leaveCells = screen.getAllByText('O')
      const activeCells = screen.getAllByText('X')
      expect(leaveCells).toHaveLength(1) // User B is on leave
      expect(activeCells).toHaveLength(2) // User A and C are active
    })

    it('shows empty state when no users', () => {
      render(
        <UserList 
          users={[]} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument()
    })

    it('renders mobile view with condensed data', () => {
      // Mock smaller screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })

      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      // Mobile view should show condensed information
      expect(screen.getByText('Lv.25 | 50,000,000 | R3 | 활동중')).toBeInTheDocument()
      expect(screen.getByText('Lv.30 | 75,000,000 | R1 | 탈퇴')).toBeInTheDocument()
      expect(screen.getByText('Lv.20 | 30,000,000 | R5 | 활동중')).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('sorts by name in ascending order', async () => {
      const user = userEvent.setup()

      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      const nameHeader = screen.getByRole('button', { name: /닉네임/ })
      await user.click(nameHeader)

      // Check if chevron up icon appears
      expect(screen.getByTestId ? screen.queryByTestId('chevron-up') : true).toBeTruthy()

      // Users should be sorted: User A, User B, User C
      const userRows = screen.getAllByRole('row')
      expect(userRows[1]).toHaveTextContent('User A')
      expect(userRows[2]).toHaveTextContent('User B')
      expect(userRows[3]).toHaveTextContent('User C')
    })

    it('sorts by name in descending order on second click', async () => {
      const user = userEvent.setup()

      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      const nameHeader = screen.getByRole('button', { name: /닉네임/ })
      await user.click(nameHeader) // First click - ascending
      await user.click(nameHeader) // Second click - descending

      // Check if chevron down icon appears
      expect(screen.getByTestId ? screen.queryByTestId('chevron-down') : true).toBeTruthy()
    })

    it('sorts by level', async () => {
      const user = userEvent.setup()

      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      const levelHeader = screen.getByRole('button', { name: /본부 레벨/ })
      await user.click(levelHeader)

      // Should sort by level ascending: 20, 25, 30
      const userRows = screen.getAllByRole('row')
      expect(userRows[1]).toHaveTextContent('User C') // Level 20
      expect(userRows[2]).toHaveTextContent('User A') // Level 25
      expect(userRows[3]).toHaveTextContent('User B') // Level 30
    })

    it('sorts by power', async () => {
      const user = userEvent.setup()

      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      const powerHeader = screen.getByRole('button', { name: /전투력/ })
      await user.click(powerHeader)

      // Should sort by power ascending: 30M, 50M, 75M
      const userRows = screen.getAllByRole('row')
      expect(userRows[1]).toHaveTextContent('User C') // 30M power
      expect(userRows[2]).toHaveTextContent('User A') // 50M power
      expect(userRows[3]).toHaveTextContent('User B') // 75M power
    })

    it('sorts by user grade', async () => {
      const user = userEvent.setup()

      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      const gradeHeader = screen.getByRole('button', { name: /유저 등급/ })
      await user.click(gradeHeader)

      // Should sort by grade ascending: R1, R3, R5
      const userRows = screen.getAllByRole('row')
      expect(userRows[1]).toHaveTextContent('User B') // R1
      expect(userRows[2]).toHaveTextContent('User A') // R3
      expect(userRows[3]).toHaveTextContent('User C') // R5
    })

    it('sorts by leave status', async () => {
      const user = userEvent.setup()

      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      const leaveHeader = screen.getByRole('button', { name: /연맹 탈퇴/ })
      await user.click(leaveHeader)

      // Should sort by leave status: false comes before true
      const userRows = screen.getAllByRole('row')
      const firstRowLeave = userRows[1].textContent?.includes('X') || userRows[1].textContent?.includes('활동중')
      expect(firstRowLeave).toBeTruthy()
    })
  })

  describe('User Actions', () => {
    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      const editButtons = screen.getAllByLabelText(/수정|편집|edit/i)
      if (editButtons.length === 0) {
        // If no aria-label, try finding by icon
        const editIcons = screen.getAllByRole('button')
        const editButton = editIcons.find(button => 
          button.querySelector('[class*="lucide-pencil"]') || 
          button.textContent?.includes('수정')
        )
        if (editButton) {
          await user.click(editButton)
        } else {
          // Find first edit button by position (should be first action button in each row)
          const actionButtons = screen.getAllByRole('button').filter(button => 
            button.closest('[role="cell"]')?.textContent?.includes('관리') ||
            button.closest('td')
          )
          if (actionButtons.length > 0) {
            await user.click(actionButtons[0])
          }
        }
      } else {
        await user.click(editButtons[0])
      }

      expect(mockOnEdit).toHaveBeenCalledWith(mockUsers[0])
    })

    it('opens delete confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      // Find delete button (second action button in each row)
      const actionButtons = screen.getAllByRole('button').filter(button => 
        button.closest('[role="cell"]') && 
        (button.querySelector('[class*="lucide-trash"]') || 
         button.getAttribute('aria-label')?.includes('삭제'))
      )

      if (actionButtons.length > 0) {
        await user.click(actionButtons[0])
      } else {
        // Fallback: find by Trash icon or position
        const allButtons = screen.getAllByRole('button')
        const deleteButton = allButtons.find(button => 
          button.querySelector('svg')?.getAttribute('class')?.includes('lucide-trash')
        )
        if (deleteButton) {
          await user.click(deleteButton)
        }
      }

      // Check if delete confirmation dialog appears
      expect(screen.getByText('유저 삭제')).toBeInTheDocument()
      expect(screen.getByText(/정말로 삭제하시겠습니까/)).toBeInTheDocument()
    })

    it('handles successful user deletion', async () => {
      const user = userEvent.setup()
      
      ;(userActions.deleteUser as jest.Mock).mockResolvedValue(undefined)

      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      // Click delete button
      const allButtons = screen.getAllByRole('button')
      const deleteButton = allButtons.find(button => 
        button.querySelector('svg')?.getAttribute('class')?.includes('lucide-trash')
      )
      
      if (deleteButton) {
        await user.click(deleteButton)
      }

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /삭제$/ })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(userActions.deleteUser).toHaveBeenCalledWith(mockUsers[0].userSeq)
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: '유저 삭제 성공',
        description: `${mockUsers[0].name} 유저가 삭제되었습니다.`,
      })

      expect(mockOnDeleted).toHaveBeenCalled()
    })

    it('handles user deletion error', async () => {
      const user = userEvent.setup()
      const errorMessage = '유저 삭제 실패'
      
      ;(userActions.deleteUser as jest.Mock).mockRejectedValue(new Error(errorMessage))

      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      // Click delete button
      const allButtons = screen.getAllByRole('button')
      const deleteButton = allButtons.find(button => 
        button.querySelector('svg')?.getAttribute('class')?.includes('lucide-trash')
      )
      
      if (deleteButton) {
        await user.click(deleteButton)
      }

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /삭제$/ })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '오류 발생',
          description: '유저 삭제 중 오류가 발생했습니다.',
          variant: 'destructive',
        })
      })

      expect(mockOnDeleted).not.toHaveBeenCalled()
    })

    it('cancels deletion when cancel button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      // Click delete button
      const allButtons = screen.getAllByRole('button')
      const deleteButton = allButtons.find(button => 
        button.querySelector('svg')?.getAttribute('class')?.includes('lucide-trash')
      )
      
      if (deleteButton) {
        await user.click(deleteButton)
      }

      // Cancel deletion
      const cancelButton = screen.getByText('취소')
      await user.click(cancelButton)

      expect(userActions.deleteUser).not.toHaveBeenCalled()
      expect(screen.queryByText('유저 삭제')).not.toBeInTheDocument()
    })

    it('shows deleting state during deletion', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      ;(userActions.deleteUser as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      // Click delete button
      const allButtons = screen.getAllByRole('button')
      const deleteButton = allButtons.find(button => 
        button.querySelector('svg')?.getAttribute('class')?.includes('lucide-trash')
      )
      
      if (deleteButton) {
        await user.click(deleteButton)
      }

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /삭제$/ })
      await user.click(confirmButton)

      // Check deleting state
      expect(screen.getByText('삭제 중...')).toBeInTheDocument()
      expect(screen.getByText('삭제 중...')).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('삭제 중...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Optional Props', () => {
    it('hides edit buttons when onEdit is not provided', () => {
      render(
        <UserList 
          users={mockUsers} 
          onDeleted={mockOnDeleted} 
        />
      )

      // Should not show edit buttons
      const editButtons = screen.queryAllByLabelText(/수정|편집|edit/i)
      expect(editButtons).toHaveLength(0)
    })
  })

  describe('Accessibility', () => {
    it('has proper table structure', () => {
      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getAllByRole('columnheader')).toHaveLength(6)
      expect(screen.getAllByRole('row')).toHaveLength(4) // 1 header + 3 data rows
    })

    it('has accessible sort buttons', () => {
      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      const sortButtons = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('닉네임') ||
        button.textContent?.includes('본부 레벨') ||
        button.textContent?.includes('전투력') ||
        button.textContent?.includes('유저 등급') ||
        button.textContent?.includes('연맹 탈퇴')
      )

      expect(sortButtons.length).toBeGreaterThan(0)
    })

    it('has accessible action buttons', () => {
      render(
        <UserList 
          users={mockUsers} 
          onEdit={mockOnEdit} 
          onDeleted={mockOnDeleted} 
        />
      )

      const actionButtons = screen.getAllByRole('button').filter(button => 
        button.closest('[role="cell"]')
      )

      expect(actionButtons.length).toBeGreaterThan(0)
    })
  })
})