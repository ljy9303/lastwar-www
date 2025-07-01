export interface Desert {
  desertSeq: number
  title: string
  eventDate: string
  deleted: boolean
}

export interface DesertUpdate {
  title?: string
  eventDate?: string
  deleted?: boolean
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