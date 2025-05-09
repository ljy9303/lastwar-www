import { type NextRequest, NextResponse } from "next/server"

// API_BASE_URL을 그대로 사용 (프로토콜 변경 없이)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://43.203.90.157:8080"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")
  const url = new URL(request.url)
  const queryString = url.search

  console.log(`프록시 GET 요청: ${API_BASE_URL}/${path}${queryString}`)

  try {
    const response = await fetch(`${API_BASE_URL}/${path}${queryString}`, {
      headers: {
        "Content-Type": "application/json",
      },
      // 서버 측에서는 안전하지 않은 HTTP 요청 허용
      // @ts-ignore
      next: { revalidate: 0 }, // 캐싱 비활성화
    })

    const data = await response.text()
    console.log(`프록시 GET 응답: ${response.status}`, data.substring(0, 100))

    return new NextResponse(data || "{}", {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error(`API 프록시 오류 (GET ${path}):`, error)
    return NextResponse.json({ error: "API 요청 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")

  console.log(`프록시 POST 요청: ${API_BASE_URL}/${path}`)

  try {
    const body = await request.text()
    const response = await fetch(`${API_BASE_URL}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      // 서버 측에서는 안전하지 않은 HTTP 요청 허용
      // @ts-ignore
      next: { revalidate: 0 }, // 캐싱 비활성화
    })

    const data = await response.text()
    console.log(`프록시 POST 응답: ${response.status}`, data.substring(0, 100))

    return new NextResponse(data || "{}", {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error(`API 프록시 오류 (POST ${path}):`, error)
    return NextResponse.json({ error: "API 요청 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")

  console.log(`프록시 PATCH 요청: ${API_BASE_URL}/${path}`)

  try {
    const body = await request.text()
    const response = await fetch(`${API_BASE_URL}/${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      // 서버 측에서는 안전하지 않은 HTTP 요청 허용
      // @ts-ignore
      next: { revalidate: 0 }, // 캐싱 비활성화
    })

    const data = await response.text()
    console.log(`프록시 PATCH 응답: ${response.status}`, data.substring(0, 100))

    return new NextResponse(data || "{}", {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error(`API 프록시 오류 (PATCH ${path}):`, error)
    return NextResponse.json({ error: "API 요청 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")

  console.log(`프록시 DELETE 요청: ${API_BASE_URL}/${path}`)

  try {
    const response = await fetch(`${API_BASE_URL}/${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      // 서버 측에서는 안전하지 않은 HTTP 요청 허용
      // @ts-ignore
      next: { revalidate: 0 }, // 캐싱 비활성화
    })

    const data = await response.text()
    console.log(`프록시 DELETE 응답: ${response.status}`, data.substring(0, 100))

    return new NextResponse(data || "{}", {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error(`API 프록시 오류 (DELETE ${path}):`, error)
    return NextResponse.json({ error: "API 요청 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
}
