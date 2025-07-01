import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserFilter } from '@/components/user/user-filter'
import type { UserSearchParams } from '@/types/user'

describe('UserFilter', () => {
  const mockOnFilter = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders all filter fields with default values', () => {
      render(<UserFilter onFilter={mockOnFilter} />)

      expect(screen.getByLabelText('닉네임')).toBeInTheDocument()
      expect(screen.getByLabelText('닉네임')).toHaveValue('')
      
      expect(screen.getByLabelText('연맹 탈퇴 여부')).toBeInTheDocument()
      expect(screen.getByLabelText('유저 등급')).toBeInTheDocument()
      
      expect(screen.getByRole('button', { name: '초기화' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /검색/ })).toBeInTheDocument()
    })

    it('renders with initial filter values', () => {
      const initialFilters: UserSearchParams = {
        name: 'Test User',
        leave: true,
        userGrade: 'R3',
        minLevel: 20,
        maxLevel: 30,
        power: 50000000,
      }

      render(<UserFilter onFilter={mockOnFilter} initialFilters={initialFilters} />)

      expect(screen.getByLabelText('닉네임')).toHaveValue('Test User')
      expect(screen.getByDisplayValue('탈퇴')).toBeInTheDocument()
      expect(screen.getByDisplayValue('R3')).toBeInTheDocument()
    })

    it('has proper form structure', () => {
      render(<UserFilter onFilter={mockOnFilter} />)

      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
      
      const submitButton = screen.getByRole('button', { name: /검색/ })
      expect(submitButton).toHaveAttribute('type', 'submit')
      
      const resetButton = screen.getByRole('button', { name: '초기화' })
      expect(resetButton).toHaveAttribute('type', 'button')
    })
  })

  describe('Name Filter', () => {
    it('updates name filter correctly', async () => {
      const user = userEvent.setup()

      render(<UserFilter onFilter={mockOnFilter} />)

      const nameInput = screen.getByLabelText('닉네임')
      await user.type(nameInput, 'Test User')

      expect(nameInput).toHaveValue('Test User')
    })

    it('submits with name filter', async () => {
      const user = userEvent.setup()

      render(<UserFilter onFilter={mockOnFilter} />)

      const nameInput = screen.getByLabelText('닉네임')
      await user.type(nameInput, 'Test User')

      const submitButton = screen.getByRole('button', { name: /검색/ })
      await user.click(submitButton)

      expect(mockOnFilter).toHaveBeenCalledWith({
        name: 'Test User',
        leave: undefined,
        userGrade: undefined,
        minLevel: undefined,
        maxLevel: undefined,
        power: undefined,
      })
    })
  })

  describe('Leave Status Filter', () => {
    it('changes leave filter to true', async () => {
      const user = userEvent.setup()

      render(<UserFilter onFilter={mockOnFilter} />)

      const leaveSelect = screen.getByLabelText('연맹 탈퇴 여부')
      await user.click(leaveSelect)
      
      const leaveOption = screen.getByText('탈퇴')
      await user.click(leaveOption)

      expect(screen.getByDisplayValue('탈퇴')).toBeInTheDocument()
    })

    it('changes leave filter to false', async () => {
      const user = userEvent.setup()

      render(<UserFilter onFilter={mockOnFilter} />)

      const leaveSelect = screen.getByLabelText('연맹 탈퇴 여부')
      await user.click(leaveSelect)
      
      const activeOption = screen.getByText('활동중')
      await user.click(activeOption)

      expect(screen.getByDisplayValue('활동중')).toBeInTheDocument()
    })

    it('resets leave filter to all', async () => {
      const user = userEvent.setup()

      render(<UserFilter onFilter={mockOnFilter} initialFilters={{ leave: true }} />)

      const leaveSelect = screen.getByLabelText('연맹 탈퇴 여부')
      await user.click(leaveSelect)
      
      const allOption = screen.getByText('전체')
      await user.click(allOption)

      expect(screen.getByDisplayValue('전체')).toBeInTheDocument()
    })

    it('submits with leave filter', async () => {
      const user = userEvent.setup()

      render(<UserFilter onFilter={mockOnFilter} />)

      const leaveSelect = screen.getByLabelText('연맹 탈퇴 여부')
      await user.click(leaveSelect)
      
      const leaveOption = screen.getByText('탈퇴')
      await user.click(leaveOption)

      const submitButton = screen.getByRole('button', { name: /검색/ })
      await user.click(submitButton)

      expect(mockOnFilter).toHaveBeenCalledWith({
        name: '',
        leave: true,
        userGrade: undefined,
        minLevel: undefined,
        maxLevel: undefined,
        power: undefined,
      })
    })
  })

  describe('User Grade Filter', () => {
    it('changes user grade filter', async () => {
      const user = userEvent.setup()

      render(<UserFilter onFilter={mockOnFilter} />)

      const gradeSelect = screen.getByLabelText('유저 등급')
      await user.click(gradeSelect)
      
      const r3Option = screen.getByText('R3')
      await user.click(r3Option)

      expect(screen.getByDisplayValue('R3')).toBeInTheDocument()
    })

    it('resets user grade filter to all', async () => {
      const user = userEvent.setup()

      render(<UserFilter onFilter={mockOnFilter} initialFilters={{ userGrade: 'R3' }} />)

      const gradeSelect = screen.getByLabelText('유저 등급')
      await user.click(gradeSelect)
      
      const allOption = screen.getByText('전체')
      await user.click(allOption)

      expect(screen.getByDisplayValue('전체')).toBeInTheDocument()
    })

    it('submits with user grade filter', async () => {
      const user = userEvent.setup()

      render(<UserFilter onFilter={mockOnFilter} />)

      const gradeSelect = screen.getByLabelText('유저 등급')
      await user.click(gradeSelect)
      
      const r1Option = screen.getByText('R1')
      await user.click(r1Option)

      const submitButton = screen.getByRole('button', { name: /검색/ })
      await user.click(submitButton)

      expect(mockOnFilter).toHaveBeenCalledWith({
        name: '',
        leave: undefined,
        userGrade: 'R1',
        minLevel: undefined,
        maxLevel: undefined,
        power: undefined,
      })
    })

    it('tests all user grade options', async () => {
      const user = userEvent.setup()
      const grades = ['R5', 'R4', 'R3', 'R2', 'R1']

      for (const grade of grades) {
        render(<UserFilter onFilter={mockOnFilter} />)

        const gradeSelect = screen.getByLabelText('유저 등급')
        await user.click(gradeSelect)
        
        const gradeOption = screen.getByText(grade)
        await user.click(gradeOption)

        expect(screen.getByDisplayValue(grade)).toBeInTheDocument()
      }
    })
  })

  describe('Form Submission', () => {
    it('submits form on enter key in name input', async () => {
      const user = userEvent.setup()

      render(<UserFilter onFilter={mockOnFilter} />)

      const nameInput = screen.getByLabelText('닉네임')
      await user.type(nameInput, 'Test User{enter}')

      expect(mockOnFilter).toHaveBeenCalledWith({
        name: 'Test User',
        leave: undefined,
        userGrade: undefined,
        minLevel: undefined,
        maxLevel: undefined,
        power: undefined,
      })
    })

    it('submits with multiple filters', async () => {
      const user = userEvent.setup()

      render(<UserFilter onFilter={mockOnFilter} />)

      // Set name filter
      const nameInput = screen.getByLabelText('닉네임')
      await user.type(nameInput, 'Test User')

      // Set leave filter
      const leaveSelect = screen.getByLabelText('연맹 탈퇴 여부')
      await user.click(leaveSelect)
      const activeOption = screen.getByText('활동중')
      await user.click(activeOption)

      // Set grade filter
      const gradeSelect = screen.getByLabelText('유저 등급')
      await user.click(gradeSelect)
      const r3Option = screen.getByText('R3')
      await user.click(r3Option)

      // Submit
      const submitButton = screen.getByRole('button', { name: /검색/ })
      await user.click(submitButton)

      expect(mockOnFilter).toHaveBeenCalledWith({
        name: 'Test User',
        leave: false,
        userGrade: 'R3',
        minLevel: undefined,
        maxLevel: undefined,
        power: undefined,
      })
    })

    it('prevents default form submission', async () => {
      const user = userEvent.setup()
      const mockPreventDefault = jest.fn()

      render(<UserFilter onFilter={mockOnFilter} />)

      const form = screen.getByRole('form')
      fireEvent.submit(form, { preventDefault: mockPreventDefault })

      expect(mockOnFilter).toHaveBeenCalled()
    })
  })

  describe('Reset Functionality', () => {
    it('resets all filters to default values', async () => {
      const user = userEvent.setup()

      const initialFilters: UserSearchParams = {
        name: 'Test User',
        leave: true,
        userGrade: 'R3',
      }

      render(<UserFilter onFilter={mockOnFilter} initialFilters={initialFilters} />)

      // Verify initial values
      expect(screen.getByLabelText('닉네임')).toHaveValue('Test User')
      expect(screen.getByDisplayValue('탈퇴')).toBeInTheDocument()
      expect(screen.getByDisplayValue('R3')).toBeInTheDocument()

      // Reset
      const resetButton = screen.getByRole('button', { name: '초기화' })
      await user.click(resetButton)

      // Verify reset values
      expect(screen.getByLabelText('닉네임')).toHaveValue('')
      expect(screen.getByDisplayValue('전체')).toBeInTheDocument()
    })

    it('calls onFilter with reset values', async () => {
      const user = userEvent.setup()

      const initialFilters: UserSearchParams = {
        name: 'Test User',
        leave: true,
        userGrade: 'R3',
      }

      render(<UserFilter onFilter={mockOnFilter} initialFilters={initialFilters} />)

      const resetButton = screen.getByRole('button', { name: '초기화' })
      await user.click(resetButton)

      expect(mockOnFilter).toHaveBeenCalledWith({
        name: '',
        leave: undefined,
        userGrade: undefined,
        minLevel: undefined,
        maxLevel: undefined,
        power: undefined,
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper labels for all form fields', () => {
      render(<UserFilter onFilter={mockOnFilter} />)

      expect(screen.getByLabelText('닉네임')).toBeInTheDocument()
      expect(screen.getByLabelText('연맹 탈퇴 여부')).toBeInTheDocument()
      expect(screen.getByLabelText('유저 등급')).toBeInTheDocument()
    })

    it('has proper placeholders', () => {
      render(<UserFilter onFilter={mockOnFilter} />)

      expect(screen.getByPlaceholderText('닉네임 검색...')).toBeInTheDocument()
    })

    it('has keyboard navigation support', async () => {
      const user = userEvent.setup()

      render(<UserFilter onFilter={mockOnFilter} />)

      const nameInput = screen.getByLabelText('닉네임')
      
      // Tab navigation should work
      await user.tab()
      expect(nameInput).toHaveFocus()
    })

    it('has proper button roles and types', () => {
      render(<UserFilter onFilter={mockOnFilter} />)

      const submitButton = screen.getByRole('button', { name: /검색/ })
      const resetButton = screen.getByRole('button', { name: '초기화' })

      expect(submitButton).toHaveAttribute('type', 'submit')
      expect(resetButton).toHaveAttribute('type', 'button')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty string values correctly', async () => {
      const user = userEvent.setup()

      render(<UserFilter onFilter={mockOnFilter} />)

      const nameInput = screen.getByLabelText('닉네임')
      await user.type(nameInput, 'test')
      await user.clear(nameInput)

      const submitButton = screen.getByRole('button', { name: /검색/ })
      await user.click(submitButton)

      expect(mockOnFilter).toHaveBeenCalledWith({
        name: '',
        leave: undefined,
        userGrade: undefined,
        minLevel: undefined,
        maxLevel: undefined,
        power: undefined,
      })
    })

    it('handles undefined initial filters', () => {
      render(<UserFilter onFilter={mockOnFilter} initialFilters={undefined} />)

      expect(screen.getByLabelText('닉네임')).toHaveValue('')
      expect(screen.getByDisplayValue('전체')).toBeInTheDocument()
    })

    it('handles partial initial filters', () => {
      const partialFilters: UserSearchParams = {
        name: 'Test',
        // leave and userGrade are undefined
      }

      render(<UserFilter onFilter={mockOnFilter} initialFilters={partialFilters} />)

      expect(screen.getByLabelText('닉네임')).toHaveValue('Test')
      expect(screen.getByDisplayValue('전체')).toBeInTheDocument()
    })
  })
})