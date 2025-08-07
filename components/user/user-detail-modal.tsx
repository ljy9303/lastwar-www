"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { UserDetailResponse, UserHistory, UserPowerHistory, UserDesertRecord } from "@/types/user"
import { getUserDetail, getUserHistory, getUserDesertRecords } from "@/lib/api-service"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { UserHistoryChange } from "./user-history-change"

interface UserDetailModalProps {
  isOpen: boolean
  onClose: () => void
  userSeq: number | null
}

export default function UserDetailModal({ isOpen, onClose, userSeq }: UserDetailModalProps) {
  const [userDetail, setUserDetail] = useState<UserDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [historyData, setHistoryData] = useState<any>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(3)
  const [desertRecordsData, setDesertRecordsData] = useState<any>(null)
  const [desertRecordsLoading, setDesertRecordsLoading] = useState(false)
  const [desertCurrentPage, setDesertCurrentPage] = useState(0)
  const [desertPageSize] = useState(5)

  useEffect(() => {
    if (isOpen && userSeq) {
      setCurrentPage(0) // 페이지 초기화
      setDesertCurrentPage(0) // 사막전 페이지 초기화
      loadUserDetail()
      loadUserHistory(0) // 첫 페이지 로드
      loadDesertRecords(0) // 사막전 기록 첫 페이지 로드
    }
  }, [isOpen, userSeq])

  useEffect(() => {
    if (isOpen && userSeq) {
      loadUserHistory(currentPage)
    }
  }, [currentPage])

  useEffect(() => {
    if (isOpen && userSeq) {
      loadDesertRecords(desertCurrentPage)
    }
  }, [desertCurrentPage])

  const loadUserDetail = async () => {
    if (!userSeq) return
    
    try {
      setLoading(true)
      const data = await getUserDetail(userSeq)
      setUserDetail(data)
    } catch (error) {
      console.error("연맹원 상세정보 로드 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserHistory = async (page: number) => {
    if (!userSeq) return
    
    try {
      setHistoryLoading(true)
      const data = await getUserHistory(userSeq, page, pageSize)
      setHistoryData(data)
    } catch (error) {
      console.error("연맹원 히스토리 로드 실패:", error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleNextPage = () => {
    if (historyData && currentPage < historyData.totalPages - 1) {
      handlePageChange(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      handlePageChange(currentPage - 1)
    }
  }

  const loadDesertRecords = async (page: number) => {
    if (!userSeq) return
    
    try {
      setDesertRecordsLoading(true)
      const data = await getUserDesertRecords(userSeq, page, desertPageSize)
      setDesertRecordsData(data)
    } catch (error) {
      console.error("사막전 기록 로드 실패:", error)
    } finally {
      setDesertRecordsLoading(false)
    }
  }

  const handleDesertPageChange = (page: number) => {
    setDesertCurrentPage(page)
  }

  const handleDesertNextPage = () => {
    if (desertRecordsData && desertCurrentPage < desertRecordsData.totalPages - 1) {
      handleDesertPageChange(desertCurrentPage + 1)
    }
  }

  const handleDesertPrevPage = () => {
    if (desertCurrentPage > 0) {
      handleDesertPageChange(desertCurrentPage - 1)
    }
  }


  // 포지션 값을 라벨로 변환하는 함수
  const getPositionLabel = (position: number | null): string => {
    if (position === null || position === undefined) return "포지션 없음"
    if (position === -1) return "포지션 없음"
    if (position === 0) return "공격/지원"
    if (position === 1) return "1시"
    if (position === 2) return "2시"
    if (position === 4) return "4시"
    if (position === 5) return "5시"
    if (position === 7) return "7시"
    if (position === 8) return "8시"
    if (position === 10) return "10시"
    if (position === 11) return "11시"
    return "포지션 없음"
  }

  // Intent Type (사전조사 희망) 값을 라벨로 변환하는 함수
  const getPreferenceLabel = (intentType: string | null): string => {
    if (!intentType || intentType === 'NONE') return "안함"
    if (intentType === 'A_TEAM') return "A조"
    if (intentType === 'B_TEAM') return "B조"
    if (intentType === 'A_RESERVE') return "A조 예비"
    if (intentType === 'B_RESERVE') return "B조 예비"
    if (intentType === 'AB_POSSIBLE') return "AB 가능"
    if (intentType === 'AB_IMPOSSIBLE') return "AB 불가능"
    return "안함"
  }

  // Desert Type (확정된 팀) 값을 라벨로 변환하는 함수
  const getTeamName = (desertType: string | null): string => {
    if (!desertType || desertType === 'NONE') return "미배정"
    if (desertType === 'A_TEAM') return "A조"
    if (desertType === 'B_TEAM') return "B조"
    if (desertType === 'A_RESERVE') return "A조 예비"
    if (desertType === 'B_RESERVE') return "B조 예비"
    if (desertType === 'AB_POSSIBLE') return "AB 가능"
    return "미배정"
  }


  const getPowerChartData = (powerHistory: UserPowerHistory[]) => {
    return powerHistory.map((item) => ({
      date: format(new Date(item.updatedAt), 'MM/dd HH:mm', { locale: ko }),
      power: item.power,
      fullDate: item.updatedAt
    })).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()) // 오래된 순으로 정렬
  }

  if (!isOpen || !userSeq) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            연맹원 상세정보 {userDetail?.user.name && `- ${userDetail.user.name}`}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : userDetail ? (
          <Tabs defaultValue="overview" className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="overview">개요</TabsTrigger>
              <TabsTrigger value="history">변경이력</TabsTrigger>
              <TabsTrigger value="desert">사막전 통계</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 overflow-y-auto p-1">
              <div className="h-full space-y-4">
                {/* 기본 정보 카드 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>기본 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">닉네임</label>
                      <p className="text-lg font-semibold">{userDetail.user.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">레벨</label>
                      <p className="text-lg font-semibold">{userDetail.user.level}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">전투력</label>
                      <p className="text-lg font-semibold">
                        {userDetail.user.power ? `${userDetail.user.power}M` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">등급</label>
                      <Badge variant="outline">{userDetail.user.userGrade}</Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">가입일</label>
                      <p className="text-sm">
                        {format(new Date(userDetail.user.createdAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">최종 수정일</label>
                      <p className="text-sm">
                        {format(new Date(userDetail.user.updatedAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 전투력 히스토리 그래프 카드 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>전투력 변화 그래프</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userDetail.powerHistory.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getPowerChartData(userDetail.powerHistory)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis tickFormatter={(value) => value.toLocaleString()} />
                            <Tooltip 
                              formatter={(value: number) => [`${value}M`, '전투력']}
                              labelFormatter={(label, payload) => {
                                if (payload && payload[0]) {
                                  return format(new Date(payload[0].payload.fullDate), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })
                                }
                                return label
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="power" 
                              stroke="#8884d8" 
                              strokeWidth={2}
                              dot={{ fill: '#8884d8' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">전투력 이력이 없습니다.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-y-auto p-1">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle>변경 이력</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    </div>
                  ) : historyData && historyData.content && historyData.content.length > 0 ? (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 space-y-3 overflow-y-auto mb-4">
                        {historyData.content.map((history: UserHistory) => (
                          <div key={history.historyId} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium">
                                {format(new Date(history.updatedAt), 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <UserHistoryChange changes={history.changes} />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* 페이지네이션 */}
                      <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
                        <div className="text-sm text-gray-500">
                          {historyData.totalElements}개 중 {historyData.size * historyData.number + 1}-{Math.min(historyData.size * (historyData.number + 1), historyData.totalElements)}개 표시
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevPage}
                            disabled={historyData.first}
                          >
                            이전
                          </Button>
                          <span className="text-sm px-2">
                            {historyData.number + 1} / {historyData.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={historyData.last}
                          >
                            다음
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">변경 이력이 없습니다.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="desert" className="flex-1 overflow-y-auto p-1">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle>사막전 통계</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  {/* 통계 요약 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {userDetail.desertStats.totalDeserts}
                      </div>
                      <div className="text-sm text-gray-500">총 사막전 수</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {userDetail.desertStats.attendedDeserts}
                      </div>
                      <div className="text-sm text-gray-500">참석한 사막전</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {userDetail.desertStats.attendanceRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">참석률</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {userDetail.desertStats.averagePosition !== null 
                          ? getPositionLabel(userDetail.desertStats.averagePosition)
                          : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">평균 포지션</div>
                    </div>
                  </div>

                  {/* 사막전 기록 목록 */}
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold mb-4">사막전 기록</h4>
                    {desertRecordsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    ) : desertRecordsData && desertRecordsData.content && desertRecordsData.content.length > 0 ? (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          {desertRecordsData.content.map((record: UserDesertRecord) => (
                            <div key={`${record.desertSeq}-${record.userSeq}`} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h5 className="font-semibold text-lg">{record.desertTitle}</h5>
                                  <p className="text-sm text-gray-500">
                                    {format(new Date(record.eventDate), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                    record.participated 
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {record.participated ? '참석' : '불참'}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">포지션:</span>
                                  <span className="ml-2 font-medium">
                                    {record.position !== null ? getPositionLabel(record.position) : 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">희망팀:</span>
                                  <span className="ml-2 font-medium">
                                    {getPreferenceLabel(record.intentType)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">배정팀:</span>
                                  <span className="ml-2 font-medium">
                                    {getTeamName(record.desertType)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* 사막전 기록 페이지네이션 */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-gray-500">
                            {desertRecordsData.totalElements}개 중 {desertRecordsData.size * desertRecordsData.number + 1}-{Math.min(desertRecordsData.size * (desertRecordsData.number + 1), desertRecordsData.totalElements)}개 표시
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDesertPrevPage}
                              disabled={desertRecordsData.first}
                            >
                              이전
                            </Button>
                            <span className="text-sm px-2">
                              {desertRecordsData.number + 1} / {desertRecordsData.totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDesertNextPage}
                              disabled={desertRecordsData.last}
                            >
                              다음
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">사막전 기록이 없습니다.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">연맹원 정보를 불러올 수 없습니다.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}