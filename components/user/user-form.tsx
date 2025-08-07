"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { UserCreateRequest, UserUpdateRequest, User } from "@/types/user"
import { createUser, updateUser } from "@/app/actions/user-actions"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserFormProps {
  user?: User
  onSuccess?: (user: User) => void
  onCancel?: () => void
  mode: "create" | "edit"
}

export function UserForm({ user, onSuccess, onCancel, mode }: UserFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nameError, setNameError] = useState<string>("")
  const [formData, setFormData] = useState<UserCreateRequest | UserUpdateRequest>(
    user
      ? {
          name: user.name,
          level: user.level,
          power: user.power,
          leave: user.leave,
          userGrade: user.userGrade,
        }
      : {
          name: "",
          level: 1,
          power: 0,
          leave: false,
          userGrade: "R1",
        },
  )

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // 닉네임 변경 시 에러 상태 초기화
    if (field === "name") {
      setNameError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let result: User

      if (mode === "create") {
        result = await createUser(formData as UserCreateRequest)
        toast({
          title: "연맹원 생성 성공",
          description: `${result.name} 연맹원이 생성되었습니다.`,
        })
      } else {
        if (!user) throw new Error("수정할 연맹원 정보가 없습니다.")
        result = await updateUser(user.userSeq, formData as UserUpdateRequest)
        toast({
          title: "연맹원 수정 성공",
          description: `${result.name} 연맹원 정보가 수정되었습니다.`,
        })
      }

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      console.error("연맹원 저장 실패:", error)
      
      // 닉네임 중복 에러인 경우 인풋 필드에 validation 표시
      if (error instanceof Error && error.message.includes("같은 연맹에 이미 존재하는 닉네임입니다")) {
        setNameError(error.message)
      } else {
        // 기타 에러는 토스트로 표시
        toast({
          title: "오류 발생",
          description: error instanceof Error ? error.message : "연맹원 저장 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">닉네임</Label>
        <Input 
          id="name" 
          value={formData.name || ""} 
          onChange={(e) => handleChange("name", e.target.value)} 
          className={nameError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
          required 
        />
        {nameError && (
          <p className="text-sm text-red-500 mt-1">{nameError}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="level">본부 레벨</Label>
        <Input
          id="level"
          type="number"
          min={1}
          max={35}
          value={formData.level || ""}
          onChange={(e) => handleChange("level", Number.parseInt(e.target.value))}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="power">전투력</Label>
        <Input
          id="power"
          type="number"
          step="any"
          min={0}
          value={formData.power || ""}
          onChange={(e) => handleChange("power", Number.parseFloat(e.target.value))}
          placeholder="예: 150.5 (1억 5천만)"
        />
        <p className="text-xs text-muted-foreground">
          소수점 입력 가능 (1 = 1백만, 1000 = 10억, 0.01 = 1만)
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="userGrade">연맹원 등급</Label>
        <Select value={formData.userGrade || "R1"} onValueChange={(value) => handleChange("userGrade", value)}>
          <SelectTrigger>
            <SelectValue placeholder="연맹원 등급 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="R5">R5</SelectItem>
            <SelectItem value="R4">R4</SelectItem>
            <SelectItem value="R3">R3</SelectItem>
            <SelectItem value="R2">R2</SelectItem>
            <SelectItem value="R1">R1</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="leave"
          checked={formData.leave || false}
          onCheckedChange={(checked) => handleChange("leave", checked)}
        />
        <Label htmlFor="leave">연맹 탈퇴 여부</Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "처리 중..." : mode === "create" ? "추가" : "저장"}
        </Button>
      </div>
    </form>
  )
}
