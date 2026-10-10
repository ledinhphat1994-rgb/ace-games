// Cụm chế độ chơi dùng chung mọi game: PvE (đấu máy, mở bảng chọn cấp độ) | PvP (đấu người).
// Một nơi duy nhất định nghĩa dáng nút, màu cấp độ và bảng chọn — Cờ Vua, Cờ Tướng, Caro, Trí Nhớ và Rắn Săn Mồi
// cùng dùng, nên đổi một chỗ là đổi cả năm. Game chỉ có PvE (Rắn Săn Mồi) dùng `chiPve` để không hiện PvP giả.

import type { ReactNode } from 'react'
import { Bot, ChevronDown, Swords } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CAC_CAP_DO_MAY, CAP_DO_MAY, type CapDoMay, type CheDoChoi } from './cap-do-may'
import { AiDifficultyHoldMenu } from './AiDifficultyHoldMenu'
import { useHoldBotDifficulty } from './useHoldBotDifficulty'

interface CumPvePvpProps {
  mode: CheDoChoi
  onModeChange: (mode: CheDoChoi) => void
  aiLevel: CapDoMay
  onAiLevelChange: (level: CapDoMay) => void
  /** PvP chuyển sang Online (bàn mở từ sảnh, đối thủ là người thật) thay vì hai người cùng máy. */
  onlineAvailable?: boolean
  /** Game chỉ có PvE: chỉ hiện nút PvE. */
  chiPve?: boolean
  /** Nội dung thêm trong bảng chọn của PvE (ví dụ số máy của Rắn Săn Mồi). */
  phuPve?: ReactNode
  /** Chữ ở chip cạnh PvE (mặc định là cấp độ). */
  nhanChip?: string
  /** Nội dung thêm trong bảng chọn của PvP (ví dụ thêm số bot tham gia cùng trong Rắn Săn Mồi). */
  phuPvp?: ReactNode
  /** Chữ ở chip cạnh PvP (ví dụ số bot). */
  nhanChipPvp?: string
  className?: string
}

export function CumPvePvp({
  mode,
  onModeChange,
  aiLevel,
  onAiLevelChange,
  onlineAvailable = false,
  chiPve = false,
  phuPve,
  nhanChip,
  phuPvp,
  nhanChipPvp,
  className,
}: CumPvePvpProps) {
  const laPvp = mode === 'online' || mode === 'pass_and_play'
  const {
    isDifficultyMenuOpen,
    closeDifficultyMenu,
    anchorRect: aiDifficultyAnchor,
    botHoldHandlers,
    wrapClickHandler,
  } = useHoldBotDifficulty(aiLevel)

  return (
    <div
      data-testid="cum-pve-pvp"
      className={cn(
        'grid gap-1 rounded-lg bg-surface-raised p-0.5 border border-border-default text-xs font-semibold shadow-xs shrink-0 h-8 box-border',
        chiPve ? 'grid-cols-1 w-[110px] sm:w-[124px]' : 'grid-cols-2 w-[160px] sm:w-[176px]',
        className,
      )}
    >
      <Popover>
        <PopoverTrigger
          render={
            <button
              type="button"
              {...botHoldHandlers}
              onClick={wrapClickHandler(() => onModeChange('ai'))}
              aria-label={mode === 'ai' ? 'Chế độ PvE (Đấu máy), chọn độ khó' : 'Chế độ PvE (Đấu máy)'}
              data-testid="che-do-pve"
              className={cn(
                'flex items-center justify-center gap-1 rounded-lg px-1.5 text-xs transition-all cursor-pointer h-full w-full font-black tracking-wide',
                mode === 'ai'
                  ? 'bg-brand text-primary-foreground shadow-sm ring-1 ring-white/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay',
              )}
              title="Nhấn để chơi PvE (Đấu máy) hoặc chọn độ khó"
            >
              <Bot className="size-3.5 shrink-0" />
              <span className="game-control-label">PvE</span>
              {mode === 'ai' && (
                <span
                  className={cn(
                    'game-control-detail text-[9px] font-black uppercase tracking-wider px-1 py-0.5 rounded-full border shadow-sm shrink-0 flex items-center gap-0.5 ml-0.5',
                    CAP_DO_MAY[aiLevel].chip,
                  )}
                >
                  {nhanChip ?? CAP_DO_MAY[aiLevel].nhan}
                  <ChevronDown className="size-2 opacity-70" />
                </span>
              )}
            </button>
          }
        />
        <PopoverContent
          align="center"
          side="bottom"
          sideOffset={6}
          className="w-56 p-2.5 bg-surface-raised border-border-default shadow-2xl text-xs"
        >
          <BangChonCapDo aiLevel={aiLevel} dangPve={mode === 'ai'} onChon={(lvl) => { onModeChange('ai'); onAiLevelChange(lvl) }}>
            {phuPve}
          </BangChonCapDo>
        </PopoverContent>
      </Popover>

      {!chiPve && (
        phuPvp ? (
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  onClick={() => onModeChange(onlineAvailable ? 'online' : 'pass_and_play')}
                  aria-label={laPvp ? 'Chế độ PvP (Đối kháng), chọn số bot' : 'Chế độ PvP (Đối kháng)'}
                  data-testid="che-do-pvp"
                  className={cn(
                    'flex items-center justify-center gap-1 rounded-lg px-1.5 text-xs transition-all cursor-pointer h-full w-full font-black tracking-wide',
                    laPvp
                      ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-sm ring-1 ring-white/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay',
                  )}
                  title="Nhấn để chơi PvP (Đối kháng) hoặc thêm bot"
                >
                  <Swords className="size-3.5 shrink-0" />
                  <span className="game-control-label">PvP</span>
                  {laPvp && (
                    <span
                      className="game-control-detail text-[9px] font-black uppercase tracking-wider px-1 py-0.5 rounded-full border border-amber-300/40 bg-amber-400/20 text-amber-200 shadow-sm shrink-0 flex items-center gap-0.5 ml-0.5"
                    >
                      {nhanChipPvp ?? 'Bot'}
                      <ChevronDown className="size-2 opacity-70" />
                    </span>
                  )}
                </button>
              }
            />
            <PopoverContent
              align="center"
              side="bottom"
              sideOffset={6}
              className="w-56 p-2.5 bg-surface-raised border-border-default shadow-2xl text-xs"
            >
              {phuPvp}
            </PopoverContent>
          </Popover>
        ) : (
          <button
            type="button"
            onClick={() => onModeChange(onlineAvailable ? 'online' : 'pass_and_play')}
            aria-label="Chế độ PvP (Đối kháng)"
            data-testid="che-do-pvp"
            className={cn(
              'flex items-center justify-center gap-1 rounded-lg px-1.5 text-xs transition-all cursor-pointer h-full w-full font-black tracking-wide',
              laPvp
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-sm ring-1 ring-white/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay',
            )}
            title="Chế độ PvP (Đối kháng)"
          >
            <Swords className="size-3.5 shrink-0" />
            <span className="game-control-label">PvP</span>
          </button>
        )
      )}

      {/* Popup chọn mức độ AI khi hold icon bot */}
      <AiDifficultyHoldMenu
        isOpen={isDifficultyMenuOpen}
        onClose={closeDifficultyMenu}
        anchorRect={aiDifficultyAnchor}
        currentLevel={aiLevel}
        onSelectLevel={(lvl) => {
          onModeChange('ai')
          onAiLevelChange(lvl)
        }}
        gameTitle="Đấu Máy"
      />
    </div>
  )
}

/** Bảng chọn cấp độ máy — dùng chung mọi game; `children` là phần riêng của game (thêm dưới danh sách cấp độ). */
export function BangChonCapDo({
  aiLevel,
  dangPve,
  onChon,
  children,
}: {
  aiLevel: CapDoMay
  dangPve: boolean
  onChon: (level: CapDoMay) => void
  children?: ReactNode
}) {
  return (
    <div data-testid="bang-chon-cap-do">
      <p className="mb-1.5 border-b border-white/10 px-1 pb-1.5 text-[11px] font-bold text-text-tertiary">Cấp độ máy</p>
      <div className="flex flex-col gap-1.5">
        {CAC_CAP_DO_MAY.map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => onChon(lvl)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left border',
              aiLevel === lvl && dangPve ? CAP_DO_MAY[lvl].chon : 'border-transparent text-slate-300 hover:bg-white/10 hover:text-white',
            )}
          >
            <span className={cn('size-2 rounded-full', CAP_DO_MAY[lvl].cham)} />
            <span>{CAP_DO_MAY[lvl].dai}</span>
          </button>
        ))}
      </div>
      {children}
    </div>
  )
}
