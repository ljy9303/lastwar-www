import { AIDesertRegistration } from "./components/AIDesertRegistration"

interface AIDesertAddPageProps {
  params: Promise<{
    desertSeq: string
  }>
}

export default async function AIDesertAddPage({ params }: AIDesertAddPageProps) {
  const { desertSeq } = await params
  return <AIDesertRegistration desertSeq={parseInt(desertSeq)} />
}