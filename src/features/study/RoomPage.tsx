import { useNavigate, useParams } from 'react-router'
import { usePhien } from '@/app/phien'
import { CongLinkPhong } from '@/components/lobby/CongLinkPhong'
import { StudyRoomView } from './StudyRoomView'

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { nguoiDung } = usePhien()

  if (!roomId) return null
  // Link phòng bạn bè chia sẻ: chưa đăng nhập thì ở lại đúng link và mời đăng nhập — xong là vào phòng luôn.
  if (!nguoiDung) return <CongLinkPhong loai="phong" />

  return (
    <StudyRoomView
      roomId={roomId}
      nguoiDung={nguoiDung}
      onLeaveRoom={() => navigate('/')}
    />
  )
}
