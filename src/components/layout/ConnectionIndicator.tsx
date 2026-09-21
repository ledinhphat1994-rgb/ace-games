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

const pillBase = 'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-colors duration-150 select-none'

export function ConnectionIndicator({
  trangThai,
  onlineCount,
  latencyMs,
  onDoDoTre,
  onKetNoiLai,
}: ConnectionIndicatorProps) {
  if (trangThai === 'phien_bi_thay') {
    return (
      <div className={`${pillBase} border-destructive/30 bg-destructive/10 text-destructive`}>
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Phiên bị thay thế</span>
      </div>
    )
  }

  if (trangThai === 'dang_ket_noi') {
    return (
      <div className={`${pillBase} border-warning/25 bg-warning/10 text-warning`}>
        <RefreshCw className="h-3 w-3 animate-spin shrink-0" />
        <span className="hidden sm:inline">Đang kết nối…</span>
      </div>
    )
  }

  if (trangThai === 'mat_ket_noi') {
    return (
      <div className={`${pillBase} border-destructive/30 bg-destructive/10 text-destructive`}>
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Mất kết nối</span>
        <button
          type="button"
          onClick={onKetNoiLai}
          className="ml-1 underline hover:opacity-80 cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    )
  }

  // Connected
  return (
    <Popover>
      <PopoverTrigger
        className={`${pillBase} border-success/25 bg-success/10 text-success hover:bg-success/18 cursor-pointer`}
        title="Trạng thái kết nối phòng học số"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        <span className="hidden sm:inline">{onlineCount} trực tuyến</span>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-60 border-border-default bg-surface-raised/95 p-3 text-xs shadow-2xl backdrop-blur-md"
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <span className="font-semibold text-text-primary">Trực tuyến</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 border border-success/20 px-2 py-0.5 text-xs font-semibold text-success">
              {onlineCount} người
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Độ trễ máy chủ (RTT)</span>
            <span className="font-mono font-semibold text-text-primary">
              {latencyMs !== null ? `${latencyMs} ms` : '—'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={onDoDoTre}
          >
            <Wifi className="h-3.5 w-3.5 text-success" />
            Đo lại ping
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
