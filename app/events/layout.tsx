import type { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'

export const metadata: Metadata = generateMetadata('/events')

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}