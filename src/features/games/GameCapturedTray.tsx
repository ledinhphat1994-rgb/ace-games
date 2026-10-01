import React from 'react'
import { cn } from '@/lib/utils'

export interface GameCapturedTrayProps {
  // Quân cờ quân địch ăn được (quân của ta bị mất - nửa trên)
  enemyCaptured: number[]
  // Quân cờ quân ta ăn được (quân của địch bị bắt - nửa dưới)
  friendlyCaptured: number[]
  pawnType: number
  renderPiece: (type: number, isEnemyPiece: boolean, rotation: number) => React.ReactNode
  /** VÙNG 2: Tin nhắn / bong bóng thoại đối thủ ở góc trên */
  topSlot?: React.ReactNode
  /** VÙNG 1+: Tin nhắn / bong bóng thoại của ta ở góc dưới */
  bottomSlot?: React.ReactNode
  className?: string
}

const ROTATIONS = [-4, 3, -2, 5, -3, 2, -5, 4, -1, 3, -4, 2, 5, -2, 4]

export function GameCapturedTray({
  enemyCaptured = [],
  friendlyCaptured = [],
  pawnType,
  renderPiece,
  topSlot,
  bottomSlot,
  className,
}: GameCapturedTrayProps) {
  const safeEnemy = Array.isArray(enemyCaptured) ? enemyCaptured : []
  const safeFriendly = Array.isArray(friendlyCaptured) ? friendlyCaptured : []
  const hasCaptured = safeEnemy.length > 0 || safeFriendly.length > 0

  const enemyPawns = safeEnemy.filter((t) => t === pawnType)
  const enemyMajors = safeEnemy.filter((t) => t !== pawnType)

  const friendlyPawns = safeFriendly.filter((t) => t === pawnType)
  const friendlyMajors = safeFriendly.filter((t) => t !== pawnType)

  return (
    <div
      className={cn(
        'w-full h-full rounded-2xl border border-border-default/80 bg-surface/90 shadow-xl backdrop-blur-md p-3 flex flex-col justify-between select-none transition-all duration-300',
        className,
      )}
    >
      {/* NỬA TRÊN (50% CHIỀU CAO): VÙNG 1+ (Tin nhắn địch ở trên cùng) + Quân ta bị mất đổ về trung tâm */}
      <div className="flex flex-col justify-between h-1/2 w-full pb-1 overflow-visible">
        {/* VÙNG 1+: Tin nhắn địch xuất hiện ở đỉnh */}
        <div className="w-full flex justify-center shrink-0 min-h-0 mb-1">
          {topSlot}
        </div>

        {/* Tiêu đề góc địch */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400/90 mb-1 shrink-0">
          <span className="size-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
          <span>Chiến tích Đối thủ</span>
        </div>

        {/* Quân cờ địch ăn được xếp đổ từ trung tâm lên phía địch */}
        {safeEnemy.length > 0 ? (
          <div className="flex flex-col-reverse gap-2 w-full mt-auto overflow-y-auto max-h-[140px] xl:max-h-[160px] p-0.5">
            {/* Chốt nằm sát trung tâm */}
            {enemyPawns.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {enemyPawns.map((type, idx) => (
                  <React.Fragment key={`ep-${idx}`}>
                    {renderPiece(type, false, ROTATIONS[idx % ROTATIONS.length])}
                  </React.Fragment>
                ))}
              </div>
            )}
            {/* Quân lớn đổ xa hơn về phía địch */}
            {enemyMajors.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {enemyMajors.map((type, idx) => (
                  <React.Fragment key={`em-${idx}`}>
                    {renderPiece(type, false, ROTATIONS[(idx + 4) % ROTATIONS.length])}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-2 text-text-tertiary/60">
            <span className="text-[11px] font-medium">Chưa bắt được quân</span>
          </div>
        )}
      </div>

      {/* VÙNG 2: ĐƯỜNG PHÂN CÁCH TRUNG TÂM CỐ ĐỊNH CHÍNH GIỮA */}
      <div className="w-full flex items-center justify-center gap-2 py-1 shrink-0 my-0">
        <div
          className={cn(
            'h-px flex-1 transition-all duration-300',
            hasCaptured
              ? 'bg-gradient-to-r from-transparent via-amber-400/50 to-transparent shadow-[0_0_6px_rgba(251,191,36,0.3)]'
              : 'bg-gradient-to-r from-transparent via-border-default/50 to-transparent'
          )}
        />
        <span className="text-[9px] font-black uppercase tracking-widest text-warning/90 px-1">
          Chiến Lợi Phẩm
        </span>
        <div
          className={cn(
            'h-px flex-1 transition-all duration-300',
            hasCaptured
              ? 'bg-gradient-to-r from-transparent via-amber-400/50 to-transparent shadow-[0_0_6px_rgba(251,191,36,0.3)]'
              : 'bg-gradient-to-r from-transparent via-border-default/50 to-transparent'
          )}
        />
      </div>

      {/* NỬA DƯỚI (50% CHIỀU CAO): Quân ta ăn được đổ từ trung tâm xuống + VÙNG 1 (Nút icon & tin nhắn của ta) */}
      <div className="flex flex-col justify-between h-1/2 w-full pt-1 overflow-visible">
        {/* Quân cờ ta ăn được đổ từ trung tâm xuống */}
        {safeFriendly.length > 0 ? (
          <div className="flex flex-col gap-2 w-full mb-auto overflow-y-auto max-h-[140px] xl:max-h-[160px] p-0.5">
            {/* Chốt nằm sát trung tâm */}
            {friendlyPawns.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {friendlyPawns.map((type, idx) => (
                  <React.Fragment key={`fp-${idx}`}>
                    {renderPiece(type, true, ROTATIONS[idx % ROTATIONS.length])}
                  </React.Fragment>
                ))}
              </div>
            )}
            {/* Quân lớn đổ xa hơn về phía ta */}
            {friendlyMajors.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {friendlyMajors.map((type, idx) => (
                  <React.Fragment key={`fm-${idx}`}>
                    {renderPiece(type, true, ROTATIONS[(idx + 4) % ROTATIONS.length])}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-2 text-text-tertiary/60">
            <span className="text-[11px] font-medium">Sẵn sàng xuất trận ⚔️</span>
          </div>
        )}

        {/* Tiêu đề góc của ta */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400/90 mt-1 shrink-0">
          <span className="size-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
          <span>Chiến tích của Bạn</span>
        </div>

        {/* VÙNG 1: Nút cảm xúc chọn nhanh & bong bóng thoại của ta ở đáy */}
        <div className="w-full flex justify-center shrink-0 pt-1">
          {bottomSlot}
        </div>
      </div>
    </div>
  )
}
