export enum DesertEventType {
  A_TEAM_ONLY = "A_TEAM_ONLY",  // A조만 사용
  A_B_TEAM = "A_B_TEAM"         // A조, B조 모두 사용 (기존 방식)
}

export interface Desert {
  desertSeq: number
  title: string
  eventDate: string
  deleted: boolean
  eventType: DesertEventType
}

export interface DesertUpdate {
  title?: string
  eventDate?: string
  deleted?: boolean
  eventType?: DesertEventType
}

export interface DesertEditProps {
  desert: Desert
  onUpdate: (updatedDesert: Desert) => void
  onCancel: () => void
}

export interface DesertEditDialogProps {
  isOpen: boolean
  desert: Desert | null
  onClose: () => void
  onUpdate: (updatedDesert: Desert) => void
}