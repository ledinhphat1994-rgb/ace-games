import { useNavigate, useParams } from 'react-router'
import { usePhien } from '@/app/phien'
import { StudyRoomView } from './StudyRoomView'

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { nguoiDung } = usePhien()

  if (!roomId) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <StudyRoomView
      roomId={roomId}
      nguoiDung={nguoiDung}
      onLeaveRoom={() => navigate('/')}
    />
  )
}
