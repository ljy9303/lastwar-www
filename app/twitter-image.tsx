import { ImageResponse } from 'next/og'

// Image metadata
export const alt = 'LastWar 연맹 관리 시스템'
export const size = {
  width: 1200,
  height: 600,
}

export const contentType = 'image/png'

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      // Twitter Card JSX element
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
          backgroundSize: '60px 60px',
          backgroundPosition: '0 0, 0 30px, 30px -30px, -30px 0px',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 30,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            LastWar
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 32,
              color: '#e2e8f0',
              fontWeight: '700',
              marginBottom: 20,
            }}
          >
            연맹 관리의 새로운 기준
          </div>
          
          <div
            style={{
              fontSize: 20,
              color: '#94a3b8',
              marginBottom: 30,
              maxWidth: 800,
            }}
          >
            사막전 관리 • 연맹원 관리 • 공략 공유 • 실시간 투표
          </div>

          {/* CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 32px',
              backgroundColor: '#3b82f6',
              borderRadius: 12,
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
            }}
          >
            지금 시작하기 →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}