'use client'

import Script from 'next/script'
import { generateJsonLd } from '@/lib/seo'
import { usePathname } from 'next/navigation'

export function JsonLd() {
  const pathname = usePathname()
  const jsonLd = generateJsonLd(pathname)

  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  )
}