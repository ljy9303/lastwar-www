"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, QrCode, Copy, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

interface SponsorButtonProps {
  collapsed?: boolean
}

export default function SponsorButton({ collapsed = false }: SponsorButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // 환경변수에서 후원 정보 가져오기
  const sponsorInfo = {
    bankName: process.env.NEXT_PUBLIC_SPONSOR_BANK_NAME || "카카오뱅크",
    accountNumber: process.env.NEXT_PUBLIC_SPONSOR_ACCOUNT_NUMBER || "계좌번호 미설정",
    accountHolder: process.env.NEXT_PUBLIC_SPONSOR_ACCOUNT_HOLDER || "예금주 미설정",
    qrCodeUrl: process.env.NEXT_PUBLIC_SPONSOR_KAKAOPAY_URL || "https://qr.kakaopay.com/FTaBcD123xyz",
    qrImagePath: process.env.NEXT_PUBLIC_SPONSOR_QR_IMAGE || null
  }

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(`${sponsorInfo.bankName} ${sponsorInfo.accountNumber} ${sponsorInfo.accountHolder}`)
      setCopied(true)
      toast({
        title: "복사 완료",
        description: "계좌정보가 클립보드에 복사되었습니다.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "계좌정보 복사에 실패했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleKakaoPayClick = () => {
    window.open(sponsorInfo.qrCodeUrl, '_blank')
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={collapsed ? "icon" : "sm"}
          className={`${collapsed ? "w-full" : "w-full justify-start gap-2"} bg-gradient-to-r from-pink-50 to-red-50 border-pink-200 hover:from-pink-100 hover:to-red-100 text-pink-700 hover:text-pink-800 transition-all duration-200`}
          title={collapsed ? "후원하기" : undefined}
        >
          <Heart className="h-4 w-4 text-pink-500" />
          {!collapsed && <span className="font-medium">후원하기</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            후원하기
          </DialogTitle>
          <DialogDescription>
            서비스 운영에 도움을 주시는 여러분의 따뜻한 마음에 감사드립니다. 💙
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 카카오페이 후원 */}
          <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-yellow-600" />
                카카오페이로 후원하기
              </h3>
            </div>
            
            {/* QR 코드 이미지 또는 설명 */}
            {sponsorInfo.qrImagePath ? (
              <div className="flex flex-col items-center mb-4">
                <div className="relative w-40 h-40 mb-2 bg-white rounded-lg p-2 border">
                  <Image
                    src={sponsorInfo.qrImagePath}
                    alt="카카오페이 QR 코드"
                    fill
                    className="object-contain rounded"
                    onError={() => {
                      // 이미지 로드 실패 시 fallback 처리
                      console.warn('QR 이미지 로드 실패:', sponsorInfo.qrImagePath)
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  📱 카카오페이 앱으로 QR 코드를 스캔해주세요
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mb-3">
                QR 코드를 스캔하거나 버튼을 클릭하여 카카오페이로 간편하게 후원해보세요.
              </p>
            )}
            
            <Button
              onClick={handleKakaoPayClick}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold flex items-center justify-center gap-2"
            >
              💛 카카오페이로 후원하기
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          {/* 계좌 후원 */}
          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3">계좌로 후원하기</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">은행명:</span>
                <span className="font-medium">{sponsorInfo.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">계좌번호:</span>
                <span className="font-medium font-mono">{sponsorInfo.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">예금주:</span>
                <span className="font-medium">{sponsorInfo.accountHolder}</span>
              </div>
            </div>
            <Button
              onClick={handleCopyAccount}
              variant="outline"
              size="sm"
              className="w-full mt-3"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  계좌정보 복사
                </>
              )}
            </Button>
          </div>

          {/* 감사 메시지 */}
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              여러분의 후원으로 더 나은 서비스를 만들어나가겠습니다. 🙏
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}