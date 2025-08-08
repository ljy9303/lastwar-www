import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      )
    }

    // 파일을 Buffer로 변환
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // OCR 최적화된 이미지 압축 (Sharp 사용)
    const compressedBuffer = await sharp(buffer)
      .resize(800, 1200, { 
        fit: 'inside',           // 비율 유지
        withoutEnlargement: true // 확대 방지
      })
      .jpeg({ 
        quality: 75,             // 적당한 압축 (OCR에 최적화)
        progressive: true,       // 점진적 로딩
        mozjpeg: true           // 더 나은 압축 알고리즘
      })
      .toBuffer()

    // 압축 통계
    const originalSize = buffer.length
    const compressedSize = compressedBuffer.length
    const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100)

    // 응답 헤더 설정
    const response = new NextResponse(compressedBuffer)
    response.headers.set('Content-Type', 'image/jpeg')
    response.headers.set('Content-Length', compressedBuffer.length.toString())
    response.headers.set('X-Original-Size', originalSize.toString())
    response.headers.set('X-Compressed-Size', compressedSize.toString())
    response.headers.set('X-Compression-Ratio', `${compressionRatio}%`)

    return response

  } catch (error) {
    console.error('이미지 압축 실패:', error)
    return NextResponse.json(
      { error: '이미지 압축 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}