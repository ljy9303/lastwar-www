import type { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'

export const metadata: Metadata = generateMetadata('/users')

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}