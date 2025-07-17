"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Edit2 } from "lucide-react"
import { updateNickname } from "@/lib/api-service"

interface NicknameEditModalProps {
  isOpen: boolean
  onClose: () => void
  currentNickname: string
  onSuccess: (newNickname: string) => void
}

export function NicknameEditModal({ 
  isOpen, 
  onClose, 
  currentNickname, 
  onSuccess 
}: NicknameEditModalProps) {
  const { toast } = useToast()
  const [nickname, setNickname] = useState(currentNickname)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nickname.trim()) {
      toast({
        title: "오류",
        description: "닉네임을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    if (nickname.trim() === currentNickname) {
      toast({
        title: "알림",
        description: "기존 닉네임과 동일합니다.",
        variant: "default"
      })
      return
    }

    if (nickname.trim().length < 2 || nickname.trim().length > 20) {
      toast({
        title: "오류",
        description: "닉네임은 2-20자 사이여야 합니다.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      const data = await updateNickname(nickname.trim())

      if (data.success) {
        toast({
          title: "성공",
          description: "닉네임이 변경되었습니다. 새로운 토큰으로 다시 로그인됩니다.",
          variant: "default"
        })
        
        onSuccess(nickname.trim())
        onClose()
      } else {
        throw new Error(data.message || '닉네임 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('닉네임 수정 오류:', error)
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : '닉네임 수정 중 오류가 발생했습니다.',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setNickname(currentNickname) // 원래 닉네임으로 되돌리기
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            닉네임 수정
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">새로운 닉네임</Label>
            <Input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="새로운 닉네임을 입력하세요"
              disabled={isLoading}
              maxLength={20}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              2-20자 사이로 입력해주세요. 현재: {nickname.length}자
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isLoading || nickname.trim() === currentNickname}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  수정 중...
                </>
              ) : (
                "수정하기"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}