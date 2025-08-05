import type { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'

export const metadata: Metadata = generateMetadata('/squads')

export default function SquadsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}