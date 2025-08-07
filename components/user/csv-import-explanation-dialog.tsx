"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileUp, Plus, RefreshCw, Info, CheckCircle, UserPlus, UserCheck } from "lucide-react"

interface CsvImportExplanationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function CsvImportExplanationDialog({ 
  isOpen, 
  onClose, 
  onConfirm 
}: CsvImportExplanationDialogProps) {

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-blue-500" />
파일 가져오기 안내
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 개요 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">자동 처리 방식</h3>
                  <p className="text-sm text-blue-800">
                    CSV 또는 Excel 파일의 연맹원 정보를 자동으로 분석하여 신규 생성 또는 기존 정보 업데이트를 진행합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 처리 방식 설명 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 신규 연맹원 생성 */}
            <Card className="border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <UserPlus className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900 mb-2">신규 연맹원 생성</h4>
                    <div className="space-y-1 text-sm text-green-800">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        <span>기존에 없는 닉네임</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        <span>새로운 연맹원으로 등록</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        <span>모든 정보 그대로 저장</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 기존 연맹원 업데이트 */}
            <Card className="border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <UserCheck className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-900 mb-2">기존 연맹원 업데이트</h4>
                    <div className="space-y-1 text-sm text-orange-800">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-3 w-3" />
                        <span>동일한 닉네임 발견</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-3 w-3" />
                        <span>레벨, 전투력, 등급 업데이트</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-3 w-3" />
                        <span>변경 히스토리 자동 기록</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CSV 형식 안내 */}
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">📄 필요한 데이터 형식</h4>
              <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                <div className="text-gray-600 mb-1">닉네임, 본부레벨, 전투력, 등급</div>
                <div className="text-gray-800">아빠꽁치, 30, 120.5, R5</div>
                <div className="text-gray-800">김철수, 29, 95.2, R4</div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                • 등급: R1, R2, R3, R4, R5 중 하나<br/>
                • 전투력: 숫자 (단위: 백만)<br/>
                • 레벨: 1~50 사이의 숫자
              </p>
            </CardContent>
          </Card>

          {/* 주의사항 */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-yellow-900 mb-2">⚠️ 주의사항</h4>
              <div className="space-y-1 text-sm text-yellow-800">
                <p>• 닉네임이 정확히 일치하는 경우 기존 연맹원 정보가 업데이트됩니다</p>
                <p>• 업데이트된 정보는 변경 히스토리에 자동으로 기록됩니다</p>
                <p>• 잘못된 형식의 데이터는 건너뛰고 오류 보고서를 제공합니다</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleConfirm} className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            파일 선택하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}