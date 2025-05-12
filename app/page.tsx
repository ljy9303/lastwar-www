import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Users, UserSquare, Shuffle } from "lucide-react"

export default function Home() {
  const features = [
    {
      title: "유저 관리",
      description: "게임 유저 정보를 수동으로 관리하고 히스토리를 확인합니다.",
      icon: Users,
      href: "/users",
    },
    {
      title: "사막전 관리",
      description: "사막전 이벤트를 생성하고 관리합니다.",
      icon: UserSquare,
      href: "/events",
    },
    {
      title: "연맹원 랜덤뽑기",
      description: "연맹원 중에서 랜덤으로 인원을 선발합니다.",
      icon: Shuffle,
      href: "/lottery",
    },
  ]

  return (
    <div className="container mx-auto py-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">1242 ROKK 이벤트 관리 시스템</h1>
      <p className="text-muted-foreground mb-8 text-center">이벤트 매치를 효율적으로 관리하기 위한 시스템입니다.</p>

      {/* 메인 페이지의 카드 그리드를 동일한 비율로 조정합니다. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {features.map((feature) => (
          <Card key={feature.title} className="hover:shadow-md transition-shadow h-full flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
              <feature.icon className="h-6 w-6 mb-2 text-primary" />
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col justify-end flex-grow pt-4">
              <Link href={feature.href} className="w-full mt-auto">
                <Button className="w-full">바로가기</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
