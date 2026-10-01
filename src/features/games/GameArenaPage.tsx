import { useNavigate } from 'react-router'
import type { GameType } from '@shared/protocol/game'
import { GameLobbyView } from './GameLobbyView'

export function GameArenaPage() {
  const navigate = useNavigate()

  return (
    <GameLobbyView
      onMoSanh={(gameType: GameType) => navigate(`/arena/${gameType}`)}
    />
  )
}
