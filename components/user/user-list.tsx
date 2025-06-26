"use client"

import { useState } from "react"
import type { User } from "@/types/user"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash, ChevronUp, ChevronDown } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteUser } from "@/app/actions/user-actions"
import { useToast } from "@/hooks/use-toast"

interface UserListProps {
  users: User[]
  onEdit?: (user: User) => void
  onDeleted?: () => void
}

export function UserList({ users, onEdit, onDeleted }: UserListProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const [sortField, setSortField] = useState<keyof User | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortField) return 0

    const aValue = a[sortField]
    const bValue = b[sortField]

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const handleDelete = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      await deleteUser(userToDelete.userSeq)
      toast({
        title: "유저 삭제 성공",
        description: `${userToDelete.name} 유저가 삭제되었습니다.`,
      })
      if (onDeleted) {
        onDeleted()
      }
    } catch (error) {
      console.error("유저 삭제 실패:", error)
      toast({
        title: "오류 발생",
        description: "유저 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setUserToDelete(null)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  닉네임
                  {sortField === "name" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </Button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("level")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  본부 레벨
                  {sortField === "level" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </Button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("power")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  전투력
                  {sortField === "power" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </Button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("userGrade")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  유저 등급
                  {sortField === "userGrade" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </Button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("leave")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  연맹 탈퇴
                  {sortField === "leave" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </Button>
              </TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.length > 0 ? (
              sortedUsers.map((user) => (
                <TableRow key={user.userSeq}>
                  <TableCell>
                    <div>
                      <div>{user.name}</div>
                      <div className="sm:hidden text-xs text-muted-foreground">
                        Lv.{user.level} | {user.power.toLocaleString()} | {user.userGrade} |{" "}
                        {user.leave ? "탈퇴" : "활동중"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{user.level}</TableCell>
                  <TableCell className="hidden sm:table-cell">{user.power.toLocaleString()}</TableCell>
                  <TableCell className="hidden sm:table-cell">{user.userGrade}</TableCell>
                  <TableCell className="hidden sm:table-cell">{user.leave ? "O" : "X"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <Button variant="ghost" size="icon" onClick={() => onEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>유저 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete?.name} 유저를 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
