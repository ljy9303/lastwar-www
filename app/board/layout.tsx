import type { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'

export const metadata: Metadata = generateMetadata('/board')

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}