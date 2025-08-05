import type { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'

export const metadata: Metadata = generateMetadata('/surveys')

export default function SurveysLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}