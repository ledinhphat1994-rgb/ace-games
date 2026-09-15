import { useNavigate, useParams, useSearchParams } from 'react-router'
import type { GameType } from '@shared/protocol/game'
import { usePhien } from '@/app/phien'
import { GameBoardView } from './GameBoardView'

const CAC_GAME_TYPE: readonly GameType[] = [
  'caro_15',
  'caro_9',
  'connect4',
  'reversi',
  'solo_2048',
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

  const actorKey = nguoiDung?.actorKey
  const actorName = nguoiDung ? (nguoiDung.ten || nguoiDung.username) : undefined

  // Chỉ có ở link vừa tạo bàn từ sảnh (?gameType=...&turn=...) — vào bàn có sẵn từ danh sách bàn đang mở
  // thì không kèm tham số này, để không vô tình khởi tạo lại ván đang chơi của người khác.
  const gameTypeParam = searchParams.get('gameType')
  const intendedGameType = laGameType(gameTypeParam) ? gameTypeParam : undefined
  const turnParam = Number(searchParams.get('turn'))
  const intendedTurnSeconds = intendedGameType && Number.isInteger(turnParam) && turnParam >= 10 && turnParam <= 120
    ? turnParam
    : undefined

  return (
    <GameBoardView
      gameId={gameId}
      myActorKey={actorKey}
      myActorName={actorName}
      onLeave={() => navigate('/arena')}
      intendedGameType={intendedGameType}
      intendedTurnSeconds={intendedTurnSeconds}
    />
  )
}
