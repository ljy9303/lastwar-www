"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Heart, QrCode, Copy, Check, ExternalLink, Smartphone, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"

interface SponsorButtonProps {
  collapsed?: boolean
}

export default function SponsorButton({ collapsed = false }: SponsorButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const isMobileScreen = useMobile()

  // 실제 모바일 디바이스 감지 (User Agent 기반)
  useEffect(() => {
    const checkMobileDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileKeywords = ['android', 'iphone', 'ipad', 'mobile', 'tablet']
      return mobileKeywords.some(keyword => userAgent.includes(keyword))
    }
    setIsMobileDevice(checkMobileDevice())
  }, [])

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
    if (isMobileDevice) {
      // 모바일 디바이스에서는 카카오페이 앱으로 연결 시도
      try {
        window.location.href = sponsorInfo.qrCodeUrl
      } catch (error) {
        toast({
          title: "카카오페이 앱 실행 실패",
          description: "카카오페이 앱이 설치되지 않았거나 실행할 수 없습니다. 아래 QR 코드를 스캔해주세요.",
          variant: "destructive"
        })
      }
    } else {
      // 데스크톱에서는 안내 메시지 표시
      toast({
        title: "모바일에서 이용해주세요",
        description: "카카오페이는 모바일 앱에서만 사용 가능합니다. QR 코드를 모바일로 스캔해주세요.",
        variant: "default"
      })
    }
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
            더 나은 콘텐츠 제작에 보탬이 되어주시는 여러분의 따뜻한 마음에 감사드립니다. 💙
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
            
            {/* 환경별 안내 메시지 */}
            <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                {isMobileDevice ? (
                  <Smartphone className="h-4 w-4 text-blue-600" />
                ) : (
                  <Monitor className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-sm font-medium text-blue-800">
                  {isMobileDevice ? "모바일 환경" : "데스크톱 환경"}
                </span>
              </div>
              <p className="text-xs text-blue-700">
                {isMobileDevice 
                  ? "버튼을 클릭하면 카카오페이 앱으로 이동합니다."
                  : "QR 코드를 모바일 기기로 스캔해주세요. 웹에서는 카카오페이를 직접 사용할 수 없습니다."
                }
              </p>
            </div>

            {/* QR 코드 이미지 */}
            {sponsorInfo.qrImagePath && (
              <div className="flex flex-col items-center mb-4">
                <div className="relative w-40 h-40 mb-2 bg-white rounded-lg p-2 border">
                  <Image
                    src={sponsorInfo.qrImagePath}
                    alt="카카오페이 QR 코드"
                    fill
                    className="object-contain rounded"
                    onError={() => {
                      console.warn('QR 이미지 로드 실패:', sponsorInfo.qrImagePath)
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  📱 카카오페이 앱으로 QR 코드를 스캔해주세요
                </p>
              </div>
            )}
            
            <Button
              onClick={handleKakaoPayClick}
              className={`w-full font-semibold flex items-center justify-center gap-2 ${
                isMobileDevice 
                  ? "bg-yellow-400 hover:bg-yellow-500 text-gray-900" 
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-help"
              }`}
            >
              💛 {isMobileDevice ? "카카오페이로 후원하기" : "QR 코드를 스캔해주세요"}
              {isMobileDevice ? (
                <ExternalLink className="h-4 w-4" />
              ) : (
                <QrCode className="h-4 w-4" />
              )}
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
              여러분의 후원으로 더 나은 콘텐츠 제작에 힘쓰겠습니다. 🙏
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}