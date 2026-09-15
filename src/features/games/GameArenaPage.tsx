import { useNavigate } from 'react-router'
import type { GameType } from '@shared/protocol/game'
import { GameLobbyView } from './GameLobbyView'

export function GameArenaPage() {
  const navigate = useNavigate()

  return (
    <GameLobbyView
      onBackToHub={() => navigate('/')}
      onCreateRoom={(roomId: string, gameType: GameType, turnSeconds: number) =>
        navigate(`/game/${encodeURIComponent(roomId)}?gameType=${gameType}&turn=${turnSeconds}`)
      }
      onJoinExisting={(roomId: string) => navigate(`/game/${encodeURIComponent(roomId)}`)}
    />
  )
}
