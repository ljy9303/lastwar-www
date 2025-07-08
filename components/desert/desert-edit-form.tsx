"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { updateDesert } from "@/lib/api-service"
import { Desert, DesertEditProps } from "@/types/desert"

const desertEditSchema = z.object({
  title: z.string().min(1, "사막전 제목을 입력해주세요").max(100, "제목은 100자 이하로 입력해주세요"),
  eventDate: z.string().min(1, "이벤트 날짜를 선택해주세요"),
})

type DesertEditFormData = z.infer<typeof desertEditSchema>

export function DesertEditForm({ desert, onUpdate, onCancel }: DesertEditProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<DesertEditFormData>({
    resolver: zodResolver(desertEditSchema),
    defaultValues: {
      title: desert.title,
      eventDate: desert.eventDate,
    },
  })

  const onSubmit = async (data: DesertEditFormData) => {
    setIsLoading(true)
    
    try {
      const updatedDesert = await updateDesert(desert.desertSeq, {
        title: data.title.trim(),
        eventDate: data.eventDate,
      })
      
      toast({
        title: "성공",
        description: "사막전이 성공적으로 수정되었습니다.",
      })
      
      onUpdate(updatedDesert)
    } catch (error) {
      console.error("사막전 수정 실패:", error)
      toast({
        title: "오류",
        description: "사막전 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    form.reset()
    onCancel()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>사막전 제목</FormLabel>
              <FormControl>
                <Input
                  placeholder="사막전 제목을 입력하세요"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이벤트 날짜</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
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
    </Form>
  )
}