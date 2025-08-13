import { AIDesertRegistration } from "./components/AIDesertRegistration"

interface AIDesertAddPageProps {
  params: {
    desertSeq: string
  }
}

export default function AIDesertAddPage({ params }: AIDesertAddPageProps) {
  return <AIDesertRegistration desertSeq={parseInt(params.desertSeq)} />
}