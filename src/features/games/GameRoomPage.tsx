import { useNavigate, useParams, useSearchParams } from 'react-router'
import type { GameType } from '@shared/protocol/game'
import { usePhien } from '@/app/phien'
import { GameBoardView } from './GameBoardView'
import { SoloGamePage } from './SoloGamePage'
import type { SoloGameType } from './SoloGameStage'
import { useState } from 'react'
import { Lock, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { doanGameTypeTuMaBan, laTroChoiDon } from './game-ids'
import { CongLinkPhong } from '@/components/lobby/CongLinkPhong'
import { BlueprintArcadePattern } from '@/components/ui/blueprint-patterns'

const CAC_GAME_TYPE: readonly GameType[] = [
  'caro_15',
  'chess',
  'xiangqi',
  'solo_memory',
  'solo_snake',
]
const laGameType = (v: string | null): v is GameType => v !== null && (CAC_GAME_TYPE as readonly string[]).includes(v)

export function GameRoomPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { nguoiDung } = usePhien()
  const [searchParams] = useSearchParams()

  // Kiểm tra bảo mật mật khẩu phòng riêng tư
  const [matKhauNhap, setMatKhauNhap] = useState('')
  const [hienMatKhau, setHienMatKhau] = useState(false)
  const [loiMatKhau, setLoiMatKhau] = useState<string | null>(null)
  const [dangXacThuc, setDangXacThuc] = useState(false)
  const [daMoKhoa, setDaMoKhoa] = useState(() => {
    if (!gameId) return true
    const isPrivate = gameId.includes('rieng-tu') || searchParams.get('accessMode') === 'password'
    const savedPw =
      sessionStorage.getItem(`dc_game_pw_${gameId}`) ||
      localStorage.getItem(`dc_game_pw_${gameId}`) ||
      null
    if (!isPrivate && !savedPw) return true // Không phải phòng riêng tư cần mật khẩu
    const passParam = searchParams.get('pass')
    if (passParam && savedPw && passParam === savedPw) return true
    if (passParam && !savedPw) return true // Có pass từ link mời hoặc đã xác thực từ sảnh
    if (sessionStorage.getItem(`dc_game_auth_${gameId}`) === 'ok') return true
    return false
  })

  if (!gameId) {
    navigate('/arena', { replace: true })
    return null
  }

  // Khách chưa đăng nhập không được vào bàn chơi: hiển thị Cổng đăng nhập vào bàn
  if (!nguoiDung) {
    return <CongLinkPhong loai="ban" />
  }

  // Rời bàn / trò chơi: quay về sảnh của đúng trò đó (vào từ sảnh có ?sanh=, bàn vừa tạo có ?gameType=).
  const sanhParam = searchParams.get('sanh')
  const actorKey = nguoiDung?.actorKey
  const actorName = nguoiDung ? (nguoiDung.ten || nguoiDung.username) : undefined

  // Chỉ có ở link vừa tạo bàn từ sảnh (?gameType=...&turn=...) — vào bàn có sẵn từ danh sách bàn đang mở
  // thì không kèm tham số này, để không vô tình khởi tạo lại ván đang chơi của người khác.
  const gameTypeParam = searchParams.get('gameType')
  const intendedGameType = laGameType(gameTypeParam)
    ? gameTypeParam
    : laGameType(gameId)
      ? (gameId as GameType)
      : doanGameTypeTuMaBan(gameId)

  const sanhVe = laGameType(sanhParam) ? sanhParam : intendedGameType
  const roiBan = () => {
    void sanhVe
    // navigate(sanhVe ? `/arena/${sanhVe}` : '/arena')
    navigate('/arena')
  }

  // Trò chơi đơn không có bàn WebSocket: dựng khu chơi riêng thay vì bàn đối kháng.
  if (intendedGameType && laTroChoiDon(intendedGameType)) {
    const turnParam = searchParams.get('turn')
    const turnVal = turnParam ? Number(turnParam) : undefined
    return (
      <SoloGamePage
        gameType={intendedGameType as SoloGameType}
        onLeave={roiBan}
        initialTurnSeconds={Number.isFinite(turnVal) ? turnVal : undefined}
      />
    )
  }

  // Nếu phòng riêng tư chưa được mở khóa mật khẩu -> hiển thị giao diện nhập mật khẩu
  if (!daMoKhoa) {
    const onXacNhanMoKhoa = async () => {
      if (dangXacThuc) return
      const pw = matKhauNhap.trim()
      if (!pw) {
        setLoiMatKhau('Vui lòng nhập mật khẩu phòng.')
        return
      }
      setDangXacThuc(true)
      setLoiMatKhau(null)
      try {
        const res = await fetch(`/api/game/${encodeURIComponent(gameId)}/verify-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pw }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.ok) {
          setLoiMatKhau(data.message || 'Mật khẩu phòng không chính xác. Vui lòng thử lại.')
          setDangXacThuc(false)
          return
        }
        sessionStorage.setItem(`dc_game_auth_${gameId}`, 'ok')
        sessionStorage.setItem(`dc_game_pw_${gameId}`, pw)
        localStorage.setItem(`dc_game_pw_${gameId}`, pw)
        setDaMoKhoa(true)
      } catch {
        setLoiMatKhau('Không thể xác thực mật khẩu. Vui lòng thử lại.')
      } finally {
        setDangXacThuc(false)
      }
    }

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="relative overflow-hidden w-full max-w-sm p-6 rounded-2xl border border-sky-500/30 bg-gradient-to-b from-slate-900/95 via-slate-900/98 to-slate-950/98 shadow-2xl space-y-4 text-center">
          <BlueprintArcadePattern className="opacity-75 pointer-events-none" />
          <div className="relative z-10 size-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="size-6" />
          </div>
          <div className="relative z-10">
            <h2 className="text-base font-bold text-text-primary">Bàn đấu riêng tư</h2>
          </div>
          <div className="space-y-2 text-left">
            <div className="relative">
              <input
                type={hienMatKhau ? 'text' : 'password'}
                value={matKhauNhap}
                onChange={(e) => {
                  setMatKhauNhap(e.target.value)
                  if (loiMatKhau) setLoiMatKhau(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && onXacNhanMoKhoa()}
                placeholder="Nhập mật khẩu phòng..."
                className="w-full h-10 pl-3 pr-10 text-xs rounded-xl border border-border-default bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={() => setHienMatKhau(!hienMatKhau)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-1 cursor-pointer"
              >
                {hienMatKhau ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {loiMatKhau && <p className="text-[11px] text-red-400 font-medium">{loiMatKhau}</p>}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={roiBan} className="flex-1 rounded-xl text-xs">
              <ArrowLeft className="size-3.5 mr-1" />
              <span>Quay lại</span>
            </Button>
            <Button size="sm" onClick={onXacNhanMoKhoa} className="flex-1 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white">
              <KeyRound className="size-3.5 mr-1" />
              <span>Vào bàn</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Link bàn bạn bè chia sẻ (không phải bàn vừa tạo từ sảnh): khách phải đăng nhập mới vào được bàn online,
  // nếu không sẽ chỉ thấy bàn chơi với máy thay vì bàn của bạn.
  if (!nguoiDung && !intendedGameType) return <CongLinkPhong loai="ban" />

  const turnParam = Number(searchParams.get('turn'))
  const intendedTurnSeconds = intendedGameType && Number.isInteger(turnParam) && turnParam >= 10 && turnParam <= 120
    ? turnParam
    : undefined

  const isPrivateParam = gameId.includes('rieng-tu') || searchParams.get('accessMode') === 'password'
  const passParam = searchParams.get('pass') || sessionStorage.getItem(`dc_game_pw_${gameId}`) || localStorage.getItem(`dc_game_pw_${gameId}`) || undefined

  return (
    <GameBoardView
      gameId={gameId}
      myActorKey={actorKey}
      myActorName={actorName}
      onLeave={roiBan}
      intendedGameType={intendedGameType}
      intendedTurnSeconds={intendedTurnSeconds}
      intendedIsPrivate={isPrivateParam}
      intendedPassword={passParam}
    />
  )
}
