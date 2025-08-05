import type { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'

export const metadata: Metadata = generateMetadata('/desert-results')

export default function DesertResultsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}