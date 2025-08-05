import type { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'

export const metadata: Metadata = generateMetadata('/votes')

export default function VotesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}