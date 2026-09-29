import React from 'react'
import { cn } from '@/lib/utils'

export interface GameCapturedTrayProps {
  // Quân cờ quân địch ăn được (quân của ta bị mất - nửa trên)
  enemyCaptured: number[]
  // Quân cờ quân ta ăn được (quân của địch bị bắt - nửa dưới)
  friendlyCaptured: number[]
  pawnType: number
  renderPiece: (type: number, isEnemyPiece: boolean, rotation: number) => React.ReactNode
  /** VÙNG 1+: Tin nhắn / bong bóng thoại đối thủ ở góc trên */
  topSlot?: React.ReactNode
  /** VÙNG 1: Nút cảm xúc & tin nhắn của ta ở góc dưới */
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
    <div className={cn('relative flex flex-col justify-between w-full h-full select-none transition-all', className)}>
      {/* NỬA TRÊN (50% CHIỀU CAO): VÙNG 1+ (Tin nhắn địch ở trên cùng) + Quân ta bị mất đổ về trung tâm */}
      <div className="flex flex-col justify-between h-1/2 w-full pb-2 overflow-visible">
        {/* VÙNG 1+: Tin nhắn địch xuất hiện ở đỉnh */}
        <div className="w-full flex justify-center shrink-0 min-h-0">
          {topSlot}
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
          <div className="flex-1" />
        )}
      </div>

      {/* VÙNG 2: ĐƯỜNG PHÂN CÁCH CỐ ĐỊNH CHÍNH GIỮA 50% CHIỀU CAO (NGĂN CÁCH 2 PHE KHÔNG BAO GIỜ BỊ LỆCH) */}
      <div className="w-full flex items-center justify-center shrink-0 my-0 py-1">
        <div
          className={cn(
            'w-full transition-all duration-300',
            hasCaptured
              ? 'h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_14px_rgba(251,191,36,0.95)] opacity-100'
              : 'h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-30'
          )}
        />
      </div>

      {/* NỬA DƯỚI (50% CHIỀU CAO): Quân ta ăn được đổ từ trung tâm xuống + VÙNG 1 (Nút icon & tin nhắn của ta) */}
      <div className="flex flex-col justify-between h-1/2 w-full pt-2 overflow-visible">
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
          <div className="flex-1" />
        )}

        {/* VÙNG 1: Nút cảm xúc chọn nhanh & bong bóng thoại của ta ở đáy */}
        <div className="w-full flex justify-center shrink-0 pt-1">
          {bottomSlot}
        </div>
      </div>
    </div>
  )
}
