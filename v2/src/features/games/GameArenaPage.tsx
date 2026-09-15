import { useNavigate } from 'react-router'
import { GameLobbyView } from './GameLobbyView'

export function GameArenaPage() {
  const navigate = useNavigate()

  return (
    <GameLobbyView
      onBackToHub={() => navigate('/')}
      onJoinRoom={(roomId) => navigate(`/game/${encodeURIComponent(roomId)}`)}
    />
  )
}
