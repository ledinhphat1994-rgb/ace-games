import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme, type ThemePreference } from '@/app/theme'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
const options = [{ id: 'light', label: 'Sáng', Icon: Sun }, { id: 'dark', label: 'Tối', Icon: Moon }, { id: 'system', label: 'Theo thiết bị', Icon: Monitor }] as const
export function ThemeSwitch() {
  const { preference, resolved, setPreference } = useTheme()
  const Icon = resolved === 'dark' ? Moon : Sun
  return <Popover><PopoverTrigger render={<Button variant="ghost" size="icon-lg" aria-label="Giao diện" title="Giao diện" data-testid="theme-switch" />}><Icon className="size-4.5" /></PopoverTrigger>
    <PopoverContent align="end" className="w-52"><p className="px-2 text-xs font-semibold text-text-secondary">Giao diện</p>{options.map(option => <button type="button" key={option.id} aria-pressed={preference === option.id} onClick={() => setPreference(option.id as ThemePreference)} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm text-text-primary hover:bg-surface-overlay focus-visible:ring-2 focus-visible:ring-brand outline-none aria-pressed:bg-brand/10 aria-pressed:text-brand"><option.Icon className="size-4" />{option.label}</button>)}</PopoverContent>
  </Popover>
}
