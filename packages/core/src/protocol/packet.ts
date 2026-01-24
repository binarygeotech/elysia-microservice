export interface Packet {
  id?: string
  pattern: string
  data?: any
  meta?: any
  isEvent?: boolean
}
