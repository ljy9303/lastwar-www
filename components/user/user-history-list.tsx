"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { UserHistoryChange } from "@/components/user/user-history-change"
import { getUserHistory } from "@/app/actions/user-history-actions"
import type { UserHistoryItem, UserHistoryResponse } from "@/types/user-history"
import { useToast } from "@/hooks/use-toast"

export function UserHistoryList() {
  const { toast } = useToast()
  const [historyData, setHistoryData] = useState<UserHistoryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 10

  // 히스토리 데이터 로드
  const loadHistoryData = async (page = 0) => {
    setIsLoading(true)
    try {
      const data = await getUserHistory({ page, size: pageSize })
      setHistoryData(data)
    } catch (error) {
      console.error("히스토리 로드 실패:", error)
      toast({
        title: "오류 발생",
        description: "변경 히스토리를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 페이지 변경 처리
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadHistoryData(page)
  }

  // 초기 로드
  useEffect(() => {
    loadHistoryData()
  }, [])

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "yyyy년 MM월 dd일 HH:mm", { locale: ko })
    } catch (error) {
      return dateString
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (!historyData || historyData.empty) {
    return <div className="text-center py-8 text-muted-foreground">변경 히스토리가 없습니다.</div>
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">날짜</TableHead>
              <TableHead>유저</TableHead>
              <TableHead>변경 내역</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historyData.content.map((item: UserHistoryItem) => (
              <TableRow key={item.userHistory.historyId}>
                <TableCell className="hidden md:table-cell whitespace-nowrap">
                  {formatDate(item.userHistory.updatedAt)}
                </TableCell>
                <TableCell>
                  <div>
                    <div>{item.userName}</div>
                    <div className="md:hidden text-xs text-muted-foreground">
                      {formatDate(item.userHistory.updatedAt)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <UserHistoryChange changes={item.userHistory.changes} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {historyData.totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={historyData.totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  )
}
