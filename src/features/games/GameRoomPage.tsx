import { useNavigate, useParams, useSearchParams } from 'react-router'
import type { GameType } from '@shared/protocol/game'
import { usePhien } from '@/app/phien'
import { GameBoardView } from './GameBoardView'
import { SoloGamePage } from './SoloGamePage'
import type { SoloGameType } from './SoloGameStage'
import { laTroChoiDon } from './game-ids'
import { CongLinkPhong } from '@/components/lobby/CongLinkPhong'

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

  if (!gameId) {
    navigate('/arena', { replace: true })
    return null
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
      : undefined

  const sanhVe = laGameType(sanhParam) ? sanhParam : intendedGameType
  const roiBan = () => navigate(sanhVe ? `/arena/${sanhVe}` : '/arena')

  // Trò chơi đơn không có bàn WebSocket: dựng khu chơi riêng thay vì bàn đối kháng.
  if (intendedGameType && laTroChoiDon(intendedGameType)) {
    return <SoloGamePage gameType={intendedGameType as SoloGameType} onLeave={roiBan} />
  }

  // Link bàn bạn bè chia sẻ (không phải bàn vừa tạo từ sảnh): khách phải đăng nhập mới vào được bàn online,
  // nếu không sẽ chỉ thấy bàn chơi với máy thay vì bàn của bạn.
  if (!nguoiDung && !intendedGameType) return <CongLinkPhong loai="ban" />

  const turnParam = Number(searchParams.get('turn'))
  const intendedTurnSeconds = intendedGameType && Number.isInteger(turnParam) && turnParam >= 10 && turnParam <= 120
    ? turnParam
    : undefined

  return (
    <GameBoardView
      gameId={gameId}
      myActorKey={actorKey}
      myActorName={actorName}
      onLeave={roiBan}
      intendedGameType={intendedGameType}
      intendedTurnSeconds={intendedTurnSeconds}
    />
  )
}
