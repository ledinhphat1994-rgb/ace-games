import { useNavigate, useParams } from 'react-router'
import { usePhien } from '@/app/phien'
import { GameBoardView } from './GameBoardView'

export function GameRoomPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { nguoiDung } = usePhien()

  if (!gameId) {
    navigate('/arena', { replace: true })
    return null
  }

  const actorKey = nguoiDung?.actorKey
  const actorName = nguoiDung ? (nguoiDung.ten || nguoiDung.username) : undefined

  return (
    <GameBoardView
      gameId={gameId}
      myActorKey={actorKey}
      myActorName={actorName}
      onLeave={() => navigate('/arena')}
    />
  )
}
