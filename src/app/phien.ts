import { createContext, useContext } from 'react'
import type { NguoiDung } from '@/lib/api'
import type { AuthMode } from '@/features/auth/AuthModal'

export interface GiaTriPhien {
  nguoiDung: NguoiDung | null
  dangXuat: () => Promise<void>
  lamMoiPhien: () => Promise<void>
  moAuthModal: (cheDo?: AuthMode) => void
}

export const KHOA_PHIEN = ['phien'] as const

export const PhienContext = createContext<GiaTriPhien | null>(null)

export function usePhien(): GiaTriPhien {
  const giaTri = useContext(PhienContext)
  if (!giaTri) throw new Error('usePhien chỉ dùng được bên trong AuthGate.')
  return giaTri
}
