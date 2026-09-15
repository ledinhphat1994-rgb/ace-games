import { createContext, useContext } from 'react'
import type { NguoiDung } from '@/lib/api'

export interface GiaTriPhien {
  nguoiDung: NguoiDung
  dangXuat: () => Promise<void>
  lamMoiPhien: () => Promise<void>
}

export const KHOA_PHIEN = ['phien'] as const

export const PhienContext = createContext<GiaTriPhien | null>(null)

export function usePhien(): GiaTriPhien {
  const giaTri = useContext(PhienContext)
  if (!giaTri) throw new Error('usePhien chỉ dùng được bên trong AuthGate.')
  return giaTri
}
