import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { usePhien } from '@/app/phien'
import { StudyRoomView } from './StudyRoomView'

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { nguoiDung, moAuthModal } = usePhien()

  useEffect(() => {
    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      navigate('/', { replace: true })
    }
  }, [nguoiDung, moAuthModal, navigate])

  if (!roomId || !nguoiDung) {
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
