import { ImageResponse } from 'next/og'

// Image metadata
export const alt = 'LastWar 연맹 관리 시스템'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a', // slate-900
          backgroundImage: 'radial-gradient(circle at 25px 25px, #1e293b 2px, transparent 0), radial-gradient(circle at 75px 75px, #334155 2px, transparent 0)',
          backgroundSize: '100px 100px',
        }}
      >
        {/* Main Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: 20,
            }}
          >
            LastWar
          </div>
          <div
            style={{
              fontSize: 36,
              color: '#e2e8f0', // slate-200
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            연맹 관리 시스템
          </div>
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 40,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px 30px',
              backgroundColor: '#1e293b', // slate-800
              borderRadius: 16,
              border: '2px solid #3b82f6',
            }}
          >
            <div
              style={{
                fontSize: 24,
                color: '#3b82f6',
                fontWeight: 'bold',
                marginBottom: 8,
              }}
            >
              사막전 관리
            </div>
            <div
              style={{
                fontSize: 16,
                color: '#94a3b8', // slate-400
                textAlign: 'center',
              }}
            >
              실시간 이벤트 관리
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px 30px',
              backgroundColor: '#1e293b',
              borderRadius: 16,
              border: '2px solid #8b5cf6',
            }}
          >
            <div
              style={{
                fontSize: 24,
                color: '#8b5cf6',
                fontWeight: 'bold',
                marginBottom: 8,
              }}
            >
              연맹원 관리
            </div>
            <div
              style={{
                fontSize: 16,
                color: '#94a3b8',
                textAlign: 'center',
              }}
            >
              체계적인 멤버 관리
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px 30px',
              backgroundColor: '#1e293b',
              borderRadius: 16,
              border: '2px solid #10b981',
            }}
          >
            <div
              style={{
                fontSize: 24,
                color: '#10b981',
                fontWeight: 'bold',
                marginBottom: 8,
              }}
            >
              공략 공유
            </div>
            <div
              style={{
                fontSize: 16,
                color: '#94a3b8',
                textAlign: 'center',
              }}
            >
              최신 전략과 팁
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            fontSize: 20,
            color: '#64748b', // slate-500
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          LastWar 최고의 연맹 관리 플랫폼으로 당신의 연맹을 강화하세요
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}