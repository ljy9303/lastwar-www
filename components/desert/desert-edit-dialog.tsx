"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { updateDesert } from "@/lib/api-service"
import { Desert, DesertEditDialogProps } from "@/types/desert"

export function DesertEditDialog({ isOpen, desert, onClose, onUpdate }: DesertEditDialogProps) {
  const [title, setTitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (desert) {
      setTitle(desert.title)
      setEventDate(desert.eventDate)
    }
  }, [desert])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!desert) return
    
    if (!title.trim()) {
      toast({
        title: "오류",
        description: "사막전 제목을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!eventDate) {
      toast({
        title: "오류", 
        description: "이벤트 날짜를 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    
    try {
      const updatedDesert = await updateDesert(desert.desertSeq, {
        title: title.trim(),
        eventDate,
      })
      
      toast({
        title: "성공",
        description: "사막전이 성공적으로 수정되었습니다.",
      })
      
      onUpdate(updatedDesert)
      onClose()
    } catch (error) {
      console.error("사막전 수정 실패:", error)
      
      // 에러 메시지 추출
      const errorMessage = error instanceof Error ? error.message : "사막전 수정 중 오류가 발생했습니다."
      
      // 중복 날짜 에러 메시지인지 확인
      const isDuplicateError =
        errorMessage.includes("이미 존재") || 
        errorMessage.includes("중복") || 
        errorMessage.includes("해당 날짜")
      
      // 권한 관련 에러 메시지인지 확인
      const isPermissionError = 
        errorMessage.includes("다른 연맹") || 
        errorMessage.includes("권한") ||
        errorMessage.includes("수정할 수 없습니다")
      
      let description = errorMessage
      if (isDuplicateError) {
        const selectedDate = new Date(eventDate).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        description = `선택한 날짜(${selectedDate})에 이미 사막전이 존재합니다. 다른 날짜를 선택해주세요.`
      } else if (isPermissionError) {
        description = "이 사막전을 수정할 권한이 없습니다."
      }
      
      toast({
        title: "사막전 수정 실패",
        description,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (desert) {
      setTitle(desert.title)
      setEventDate(desert.eventDate)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>사막전 수정</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">사막전 제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="사막전 제목을 입력하세요"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="eventDate">이벤트 날짜</Label>
            <Input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "수정 중..." : "수정"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}