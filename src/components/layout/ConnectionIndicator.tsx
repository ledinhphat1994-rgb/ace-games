import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { TrangThaiKetNoiCampus } from '@/hooks/use-campus'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface ConnectionIndicatorProps {
  trangThai: TrangThaiKetNoiCampus
  onlineCount: number
  latencyMs: number | null
  onDoDoTre: () => void
  onKetNoiLai: () => void
}

export function ConnectionIndicator({
  trangThai,
  onlineCount,
  latencyMs,
  onDoDoTre,
  onKetNoiLai,
}: ConnectionIndicatorProps) {
  if (trangThai === 'phien_bi_thay') {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Phiên bị thay thế</span>
      </div>
    )
  }

  if (trangThai === 'dang_ket_noi') {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
        <RefreshCw className="h-3 w-3 animate-spin shrink-0" />
        <span className="hidden sm:inline">Đang kết nối…</span>
      </div>
    )
  }

  if (trangThai === 'mat_ket_noi') {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Mất kết nối</span>
        <button
          type="button"
          onClick={onKetNoiLai}
          className="ml-1 underline hover:text-destructive-foreground cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    )
  }

  // Da ket noi
  return (
    <Popover>
      <PopoverTrigger
        className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
        title="Trạng thái kết nối phòng học số"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="hidden sm:inline">{onlineCount} trực tuyến</span>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 border-border/80 bg-[#0f172a]/95 p-3 text-xs shadow-xl backdrop-blur-md"
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <span className="font-semibold text-foreground">Trực tuyến</span>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              {onlineCount} người
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Độ trễ máy chủ (RTT)</span>
            <span className="font-mono font-semibold text-foreground">
              {latencyMs !== null ? `${latencyMs} ms` : '—'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs border-border/70 hover:bg-white/5"
            onClick={onDoDoTre}
          >
            <Wifi className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
            Đo lại ping
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
