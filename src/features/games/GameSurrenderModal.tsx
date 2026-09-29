import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { PlayMode } from './GamePlayToolbar'

export interface GameSurrenderModalProps {
  isOpen: boolean
  onClose: () => void
  mode: PlayMode
  surrenderSideName: string // e.g. "Bên Đỏ", "Bên Đen", "Quân Trắng"
  opponentSideName: string // e.g. "Bên Đen", "Bên Đỏ", "Quân Đen"
  attemptNumber: number // Giữ để tương thích các bàn cũ; Caro luôn truyền 1 vì không đếm số lần
  onSurrenderSuccess: () => void
  /** Các bàn cũ còn truyền nhưng không còn luồng nào gọi tới — giữ tùy chọn để khỏi vỡ typecheck. */
  onSurrenderRejected?: () => void
}

export function GameSurrenderModal({
  isOpen,
  onClose,
  mode,
  surrenderSideName,
  opponentSideName,
  attemptNumber: _attemptNumber,
  onSurrenderSuccess,
  onSurrenderRejected: _onSurrenderRejected,
}: GameSurrenderModalProps) {
  const [stage, setStage] = useState<'prompt' | 'countdown'>('prompt')
  const [timeLeft, setTimeLeft] = useState(5)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Bàn cờ vẽ lại liên tục (đồng hồ lượt online nhảy 4 lần mỗi giây) nên callback đổi mỗi lần vẽ: giữ bản mới nhất
  // trong ref để thanh đếm ngược không bị khởi động lại từ đầu mãi mãi.
  const thanhCongRef = useRef(onSurrenderSuccess)
  const tenDoiThuRef = useRef(opponentSideName)
  useEffect(() => {
    thanhCongRef.current = onSurrenderSuccess
    tenDoiThuRef.current = opponentSideName
  })

  // Đảm bảo mỗi khi mở modal, LUÔN LUÔN bắt đầu từ bước 1 (prompt) và thời gian 5s
  useEffect(() => {
    if (isOpen) {
      setStage('prompt')
      setTimeLeft(5)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isOpen])

  // Dọn dẹp interval khi unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  // Thanh đếm ngược 5 giây CHỈ hoạt động khi người chơi đã bấm "Xác nhận" (stage === 'countdown')
  useEffect(() => {
    if (!isOpen || stage !== 'countdown') {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const batDau = Date.now()
    const interval = setInterval(() => {
      const conLai = 5 - Math.floor((Date.now() - batDau) / 1000)
      if (conLai <= 0) {
        clearInterval(interval)
        timerRef.current = null
        thanhCongRef.current()
        return
      }
      setTimeLeft(conLai)
    }, 1000)
    timerRef.current = interval

    return () => {
      clearInterval(interval)
      timerRef.current = null
    }
  }, [isOpen, stage])

  if (!isOpen) return null

  // Bắt đầu đếm ngược 5s sau khi người chơi bấm "Xác nhận"
  const handleStartCountdown = () => {
    // Ván online: máy chủ chốt ván ngay khi nhận lệnh xin thua (không có bước chờ đối thủ đồng ý).
    if (mode === 'online') {
      onSurrenderSuccess()
      return
    }
    setTimeLeft(5)
    setStage('countdown')
  }

  // Hủy bỏ ở Bước 1: Chưa gửi yêu cầu, không tính lượt xin thua
  const handleCancelPrompt = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setStage('prompt')
    setTimeLeft(5)
    onClose()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // Chỉ cho phép hủy khi đang ở bước 1 (prompt). Khi đã bấm Xác nhận (countdown) thì không hủy.
          if (stage === 'prompt') {
            handleCancelPrompt()
          }
        }
      }}
    >
      <DialogContent className="max-w-xs p-4 bg-[#0e1628]/95 border border-white/15 text-slate-100 backdrop-blur-xl shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-1.5 text-center">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-black uppercase tracking-wider text-white">
              Yêu cầu xin thua
            </DialogTitle>
          </div>

          {/* GIAI ĐOẠN 1: Người chơi bấm nút Xin thua -> Thanh 5s CHƯA hoạt động, có bước xác nhận */}
          {stage === 'prompt' ? (
            <div className="space-y-3 pt-1 text-left">
              <p className="text-xs text-slate-300 leading-relaxed">
                Bạn có chắc chắn muốn gửi yêu cầu xin thua ván này không?
              </p>

              {/* Thanh thời gian tĩnh (chưa kích hoạt) */}
              <div className="space-y-1 pt-1 opacity-70">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Thời gian phản hồi</span>
                  <span className="font-mono font-bold text-slate-400">5s (chưa kích hoạt)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-white/5">
                  <div className="h-full w-full bg-slate-600 rounded-full" />
                </div>
              </div>

              {/* 2 nút: Hủy bỏ & Xác nhận */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelPrompt}
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-slate-200 text-xs h-9 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </Button>

                <Button
                  size="sm"
                  onClick={handleStartCountdown}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-9 font-bold shadow-md cursor-pointer"
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          ) : (
            /* GIAI ĐOẠN 2: Đã qua bước xác nhận -> Đang đếm ngược thời gian chờ đối phương xác nhận. Không có nút hủy bỏ hay đồng ý nào khác. */
            <div className="space-y-3 pt-1 text-left">
              <p className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-amber-400">{surrenderSideName}</span> đã xác nhận xin thua. Đang chờ{' '}
                <span className="font-bold text-cyan-300">{opponentSideName}</span> xác nhận…
              </p>

              {/* Thanh progress thời gian 5s đang đếm ngược */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Thời gian chờ</span>
                  <span className="font-mono font-black text-amber-400 text-sm">{timeLeft}s</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(timeLeft / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Thông báo trạng thái đang chờ đối phương phản hồi */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-slate-400 text-xs">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                </span>
                <span>Đang chờ đối phương xác nhận…</span>
              </div>
            </div>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
