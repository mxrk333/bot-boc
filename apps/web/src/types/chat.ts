/** Shared chat types used across App and chat components. */

export interface Source {
  name: string
  url: string
}

export interface Message {
  id: string
  role: 'bot' | 'user'
  content: string
  timestamp: string
  sources?: Source[]
  imageUrl?: string
}
