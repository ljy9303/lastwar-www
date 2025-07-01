import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserForm } from '@/components/user/user-form'
import type { User } from '@/types/user'
import * as userActions from '@/app/actions/user-actions'

// Mock the user actions
jest.mock('@/app/actions/user-actions', () => ({
  createUser: jest.fn(),
  updateUser: jest.fn(),
}))

// Mock useToast hook
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock user for testing
const mockUser: User = {
  userSeq: 1,
  name: 'Test User',
  level: 25,
  power: 50000000,
  leave: false,
  userGrade: 'R3',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('UserForm', () => {
  const mockOnSuccess = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockToast.mockClear()
  })

  describe('Create Mode', () => {
    it('renders create form with default values', () => {
      render(
        <UserForm 
          mode="create" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.getByLabelText('닉네임')).toHaveValue('')
      expect(screen.getByLabelText('본부 레벨')).toHaveValue(1)
      expect(screen.getByLabelText('전투력')).toHaveValue(0)
      expect(screen.getByLabelText('연맹 탈퇴 여부')).not.toBeChecked()
      expect(screen.getByText('추가')).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      render(
        <UserForm 
          mode="create" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      const submitButton = screen.getByText('추가')
      fireEvent.click(submitButton)

      // Check if form prevents submission with empty name
      expect(userActions.createUser).not.toHaveBeenCalled()
    })

    it('handles successful user creation', async () => {
      const user = userEvent.setup()
      const mockCreatedUser = { ...mockUser, userSeq: 2, name: 'New User' }
      
      ;(userActions.createUser as jest.Mock).mockResolvedValue(mockCreatedUser)

      render(
        <UserForm 
          mode="create" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      // Fill form
      await user.type(screen.getByLabelText('닉네임'), 'New User')
      await user.clear(screen.getByLabelText('본부 레벨'))
      await user.type(screen.getByLabelText('본부 레벨'), '20')
      await user.clear(screen.getByLabelText('전투력'))
      await user.type(screen.getByLabelText('전투력'), '30000000')

      // Submit form
      await user.click(screen.getByText('추가'))

      await waitFor(() => {
        expect(userActions.createUser).toHaveBeenCalledWith({
          name: 'New User',
          level: 20,
          power: 30000000,
          leave: false,
          userGrade: 'R5',
        })
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: '유저 생성 성공',
        description: 'New User 유저가 생성되었습니다.',
      })

      expect(mockOnSuccess).toHaveBeenCalledWith(mockCreatedUser)
    })

    it('handles user creation error', async () => {
      const user = userEvent.setup()
      const errorMessage = '유저 생성 실패'
      
      ;(userActions.createUser as jest.Mock).mockRejectedValue(new Error(errorMessage))

      render(
        <UserForm 
          mode="create" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      // Fill form
      await user.type(screen.getByLabelText('닉네임'), 'New User')

      // Submit form
      await user.click(screen.getByText('추가'))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '오류 발생',
          description: errorMessage,
          variant: 'destructive',
        })
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Edit Mode', () => {
    it('renders edit form with user data', () => {
      render(
        <UserForm 
          mode="edit" 
          user={mockUser}
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.getByLabelText('닉네임')).toHaveValue('Test User')
      expect(screen.getByLabelText('본부 레벨')).toHaveValue(25)
      expect(screen.getByLabelText('전투력')).toHaveValue(50000000)
      expect(screen.getByLabelText('연맹 탈퇴 여부')).not.toBeChecked()
      expect(screen.getByText('저장')).toBeInTheDocument()
    })

    it('handles successful user update', async () => {
      const user = userEvent.setup()
      const updatedUser = { ...mockUser, name: 'Updated User' }
      
      ;(userActions.updateUser as jest.Mock).mockResolvedValue(updatedUser)

      render(
        <UserForm 
          mode="edit" 
          user={mockUser}
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      // Update name
      const nameInput = screen.getByLabelText('닉네임')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated User')

      // Submit form
      await user.click(screen.getByText('저장'))

      await waitFor(() => {
        expect(userActions.updateUser).toHaveBeenCalledWith(mockUser.userSeq, {
          name: 'Updated User',
          level: 25,
          power: 50000000,
          leave: false,
          userGrade: 'R3',
        })
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: '유저 수정 성공',
        description: 'Updated User 유저 정보가 수정되었습니다.',
      })

      expect(mockOnSuccess).toHaveBeenCalledWith(updatedUser)
    })

    it('handles user update error', async () => {
      const user = userEvent.setup()
      const errorMessage = '유저 수정 실패'
      
      ;(userActions.updateUser as jest.Mock).mockRejectedValue(new Error(errorMessage))

      render(
        <UserForm 
          mode="edit" 
          user={mockUser}
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      // Submit form
      await user.click(screen.getByText('저장'))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '오류 발생',
          description: errorMessage,
          variant: 'destructive',
        })
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('throws error when user is not provided in edit mode', async () => {
      const user = userEvent.setup()
      
      ;(userActions.updateUser as jest.Mock).mockRejectedValue(new Error('수정할 유저 정보가 없습니다.'))

      render(
        <UserForm 
          mode="edit" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      // Try to submit without user data
      await user.click(screen.getByText('저장'))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '오류 발생',
          description: '수정할 유저 정보가 없습니다.',
          variant: 'destructive',
        })
      })
    })
  })

  describe('Form Interactions', () => {
    it('updates form fields correctly', async () => {
      const user = userEvent.setup()

      render(
        <UserForm 
          mode="create" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      // Test name input
      const nameInput = screen.getByLabelText('닉네임')
      await user.type(nameInput, 'Test Name')
      expect(nameInput).toHaveValue('Test Name')

      // Test level input
      const levelInput = screen.getByLabelText('본부 레벨')
      await user.clear(levelInput)
      await user.type(levelInput, '30')
      expect(levelInput).toHaveValue(30)

      // Test power input
      const powerInput = screen.getByLabelText('전투력')
      await user.clear(powerInput)
      await user.type(powerInput, '100000000')
      expect(powerInput).toHaveValue(100000000)

      // Test leave switch
      const leaveSwitch = screen.getByLabelText('연맹 탈퇴 여부')
      await user.click(leaveSwitch)
      expect(leaveSwitch).toBeChecked()

      // Test user grade select
      const gradeSelect = screen.getByDisplayValue('R5')
      await user.click(gradeSelect)
      await user.click(screen.getByText('R1'))
      expect(screen.getByDisplayValue('R1')).toBeInTheDocument()
    })

    it('shows submitting state during form submission', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      ;(userActions.createUser as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      )

      render(
        <UserForm 
          mode="create" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      await user.type(screen.getByLabelText('닉네임'), 'Test User')
      await user.click(screen.getByText('추가'))

      // Check submitting state
      expect(screen.getByText('처리 중...')).toBeInTheDocument()
      expect(screen.getByText('처리 중...')).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('추가')).toBeInTheDocument()
      })
    })

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <UserForm 
          mode="create" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      const cancelButton = screen.getByText('취소')
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('validates level range', () => {
      render(
        <UserForm 
          mode="create" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      const levelInput = screen.getByLabelText('본부 레벨')
      expect(levelInput).toHaveAttribute('min', '1')
      expect(levelInput).toHaveAttribute('max', '30')
    })

    it('validates power minimum value', () => {
      render(
        <UserForm 
          mode="create" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      const powerInput = screen.getByLabelText('전투력')
      expect(powerInput).toHaveAttribute('min', '0')
      expect(powerInput).toHaveAttribute('step', 'any')
    })
  })

  describe('Accessibility', () => {
    it('has proper labels for all form fields', () => {
      render(
        <UserForm 
          mode="create" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.getByLabelText('닉네임')).toBeInTheDocument()
      expect(screen.getByLabelText('본부 레벨')).toBeInTheDocument()
      expect(screen.getByLabelText('전투력')).toBeInTheDocument()
      expect(screen.getByLabelText('유저 등급')).toBeInTheDocument()
      expect(screen.getByLabelText('연맹 탈퇴 여부')).toBeInTheDocument()
    })

    it('has proper form structure', () => {
      render(
        <UserForm 
          mode="create" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
    })

    it('has submit button with proper type', () => {
      render(
        <UserForm 
          mode="create" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      )

      const submitButton = screen.getByRole('button', { name: '추가' })
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })
})