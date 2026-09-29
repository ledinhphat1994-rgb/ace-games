// Nội dung sảnh Rắn Săn Mồi (PvE): thiết lập ván ngay tại sảnh — độ khó + số rắn máy — rồi bấm "Chơi ngay" trên thanh công cụ
// (một nút duy nhất, như mọi sảnh). Thiết lập được nhớ theo thiết bị và dùng lại khi vào ván.

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { GameArt } from '../GameArt'
import { CAC_CAP_DO_MAY, CAP_DO_MAY } from '../cap-do-may'
import { mauNhanTroChoi } from '../mau-tro-choi'
import { ChonSoMay } from './ChonSoMay'
import { docThietLap, ghiThietLap, type ThietLapRan } from './thiet-lap'

export function SanhThietLapRan() {
  const [thietLap, setThietLap] = useState<ThietLapRan>(docThietLap)
  const doi = (moi: ThietLapRan) => {
    setThietLap(moi)
    ghiThietLap(moi)
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-9 px-4 py-6" data-testid="sanh-thiet-lap-ran">
      <div className="relative flex items-center justify-center py-2">
        <span
          aria-hidden
          className="absolute size-48 rounded-full opacity-35 blur-3xl motion-safe:animate-hao-quang-tho"
          style={{ backgroundColor: mauNhanTroChoi('solo_snake') }}
        />
        <div className="relative size-40 motion-safe:animate-troi-lo-lung drop-shadow-[0_12px_26px_rgb(0_0_0/0.5)]">
          <GameArt gameType="solo_snake" variant="glyph" className="size-full" />
        </div>
      </div>

      <div className="w-full max-w-sm space-y-6">
        <section aria-label="Độ khó">
          <p className="mb-2 text-center text-[11px] font-bold tracking-widest text-text-tertiary uppercase">Độ khó</p>
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5" role="group">
            {CAC_CAP_DO_MAY.map((lvl) => {
              const chon = thietLap.capDo === lvl
              return (
                <button
                  key={lvl}
                  type="button"
                  aria-pressed={chon}
                  onClick={() => doi({ ...thietLap, capDo: lvl })}
                  data-testid={`sanh-ran-do-kho-${lvl}`}
                  className={cn(
                    'flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-all cursor-pointer',
                    chon ? CAP_DO_MAY[lvl].chon : 'border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white',
                  )}
                >
                  <span className={cn('size-2 rounded-full', CAP_DO_MAY[lvl].cham)} />
                  {CAP_DO_MAY[lvl].nhan}
                </button>
              )
            })}
          </div>
        </section>

        <section aria-label="Số rắn máy">
          <p className="mb-2 text-center text-[11px] font-bold tracking-widest text-text-tertiary uppercase">Số rắn máy</p>
          <ChonSoMay
            soMay={thietLap.soMay}
            onChon={(soMay) => doi({ ...thietLap, soMay })}
            className="gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 [&>button]:h-11 [&>button]:rounded-xl [&>button]:text-sm"
          />
        </section>
      </div>
    </div>
  )
}
