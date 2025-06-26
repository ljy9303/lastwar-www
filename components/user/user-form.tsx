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
          userGrade: "R5",
        },
  )

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let result: User

      if (mode === "create") {
        result = await createUser(formData as UserCreateRequest)
        toast({
          title: "유저 생성 성공",
          description: `${result.name} 유저가 생성되었습니다.`,
        })
      } else {
        if (!user) throw new Error("수정할 유저 정보가 없습니다.")
        result = await updateUser(user.userSeq, formData as UserUpdateRequest)
        toast({
          title: "유저 수정 성공",
          description: `${result.name} 유저 정보가 수정되었습니다.`,
        })
      }

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      console.error("유저 저장 실패:", error)
      toast({
        title: "오류 발생",
        description: error instanceof Error ? error.message : "유저 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">닉네임</Label>
        <Input id="name" value={formData.name || ""} onChange={(e) => handleChange("name", e.target.value)} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="level">본부 레벨</Label>
        <Input
          id="level"
          type="number"
          min={1}
          max={30}
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
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="userGrade">유저 등급</Label>
        <Select value={formData.userGrade || "R5"} onValueChange={(value) => handleChange("userGrade", value)}>
          <SelectTrigger>
            <SelectValue placeholder="유저 등급 선택" />
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
