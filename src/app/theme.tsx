import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
export type ThemePreference = 'light' | 'dark' | 'system'
const KEY = 'campus:theme'
export function readTheme(): ThemePreference {
  try { const value = localStorage.getItem(KEY); if (value === 'light' || value === 'dark' || value === 'system') return value } catch { /* Optional storage. */ }
  return 'dark'
}
const ThemeContext = createContext({ preference: 'dark' as ThemePreference, resolved: 'dark' as 'light' | 'dark', setPreference: (_: ThemePreference) => {} })
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setTheme] = useState(readTheme)
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)
  const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const changed = () => setSystemDark(media.matches)
    const storage = () => setTheme(readTheme())
    media.addEventListener('change', changed); window.addEventListener('storage', storage)
    return () => { media.removeEventListener('change', changed); window.removeEventListener('storage', storage) }
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.documentElement.classList.toggle('light', resolved === 'light')
    document.documentElement.dataset.theme = resolved
    document.documentElement.style.colorScheme = resolved
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0b1220' : '#f3f6fb')
  }, [resolved])
  const setPreference = (value: ThemePreference) => { setTheme(value); try { localStorage.setItem(KEY, value) } catch { /* Optional storage. */ } }
  return <ThemeContext.Provider value={{ preference, resolved, setPreference }}>{children}</ThemeContext.Provider>
}
export const useTheme = () => useContext(ThemeContext)
