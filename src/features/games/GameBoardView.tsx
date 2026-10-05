import { useEffect, useState } from 'react'
import { ResponsiveActivityLayout } from '@/components/layout/ResponsiveActivityLayout'
import type { GameType } from '@shared/protocol/game'
import { useGame } from '../../hooks/use-game'
import { ChessBoard } from './chess/ChessBoard'
import { XiangqiBoard } from './xiangqi/XiangqiBoard'
import { CaroBoard } from './caro/CaroBoard'
import { GameSocialSidebar, type ChatBan } from './GameSocialSidebar'
import { ModalMoiNguoiChoi } from './ModalMoiNguoiChoi'
import { registerGameRoomChatBridge } from '@/lib/game-room-chat-bridge'
import { BlueprintArcadePattern } from '@/components/ui/blueprint-patterns'

interface GameBoardViewProps {
  gameId: string
  myActorKey?: string
  myActorName?: string
  onLeave: () => void
  /** Chỉ có khi VỪA tạo bàn từ sảnh — áp trò chơi/thời gian lượt đã chọn cho bàn còn trống. */
  intendedGameType?: GameType
  intendedTurnSeconds?: number
  intendedIsPrivate?: boolean
  intendedPassword?: string
}

export function GameBoardView({
  gameId,
  myActorKey,
  myActorName: _myActorName,
  onLeave,
  intendedGameType,
  intendedTurnSeconds,
  intendedIsPrivate,
  intendedPassword,
}: GameBoardViewProps) {
  const [moModalMoi, setMoModalMoi] = useState(false)

  // Một kết nối tới bàn (RoomDO) cho cả bàn cờ lẫn chat phòng: nước đi, đồng hồ lượt, biểu cảm và tin nhắn đều qua đây.
  const ban = useGame(
    gameId,
    myActorKey,
    intendedGameType,
    intendedTurnSeconds,
    intendedIsPrivate,
    intendedPassword,
  )
  const { meta, mySide } = ban

  const userRole = mySide ? 'player' : 'spectator'
  // Khách chưa đăng nhập không vào được bàn online: bàn cờ chỉ có chế độ chơi với máy / hai người một máy.
  const online = myActorKey ? ban : undefined
  const chatBan: ChatBan | undefined = online && {
    tinNhan: online.chat,
    gui: online.guiChat,
    daKetNoi: online.trangThai === 'da_ket_noi',
    playerX: meta.playerX,
    playerO: meta.playerO,
  }

  const loaiGame =
    meta.gameType ||
    intendedGameType ||
    (gameId.includes('xiangqi') ? 'xiangqi' : gameId.includes('chess') ? 'chess' : 'caro_15')
  const roomName =
    loaiGame === 'chess' ? 'Phòng Cờ Vua' : loaiGame === 'xiangqi' ? 'Phòng Cờ Tướng' : 'Phòng Cờ Caro'
  const numMatch = gameId.match(/\d+/)
  const soPhongHienThi = numMatch ? numMatch[0] : (gameId.replace(/\D/g, '') || '55')
  const isPrivate = Boolean(intendedIsPrivate || gameId.includes('rieng-tu'))

  useEffect(() => {
    if (!online || !chatBan) {
      registerGameRoomChatBridge(null)
      return
    }
    registerGameRoomChatBridge({
      messages: (online.chat ?? []).filter((m) => !m.text.startsWith('[SYS_')),
      onSend: online.guiChat,
      roomTitle: `${roomName} ${soPhongHienThi ? `#${soPhongHienThi}` : ''}`.trim(),
      roomMembers: online.thanhVien,
    })
    return () => {
      registerGameRoomChatBridge(null)
    }
  }, [online, online?.chat, online?.guiChat, online?.thanhVien, roomName, soPhongHienThi, chatBan])

  return (
    <ResponsiveActivityLayout
      utilityMode="floating"
      showFloatingTrigger={false}
      socialLabel="Chat phòng"
      finalFocusSelector="#game-leave-btn"
      social={
        chatBan ? (
          <GameSocialSidebar
            roomId={gameId}
            roomName={roomName}
            userRole={userRole}
            chatBan={chatBan}
            roomOnly={false}
          />
        ) : undefined
      }
    >
      <div className="game-stage relative flex min-w-0 w-full flex-1 flex-col items-center h-full overflow-y-auto overflow-x-hidden">
        <BlueprintArcadePattern className="opacity-20 pointer-events-none" />
        {meta.gameType === 'chess' ? (
          <ChessBoard
            onBack={onLeave}
            online={online}
            roomName={roomName}
            isPrivate={isPrivate}
            soPhongHienThi={soPhongHienThi}
            onInvite={() => setMoModalMoi(true)}
          />
        ) : meta.gameType === 'xiangqi' ? (
          <XiangqiBoard
            onBack={onLeave}
            online={online}
            gameId={gameId}
            roomName={roomName}
            isPrivate={isPrivate}
            soPhongHienThi={soPhongHienThi}
            onInvite={() => setMoModalMoi(true)}
          />
        ) : (
          <CaroBoard
            onBack={onLeave}
            online={online}
            roomName={roomName}
            isPrivate={isPrivate}
            soPhongHienThi={soPhongHienThi}
            onInvite={() => setMoModalMoi(true)}
          />
        )}
      </div>

      <ModalMoiNguoiChoi
        open={moModalMoi}
        onClose={() => setMoModalMoi(false)}
        gameId={gameId}
        roomName={roomName}
        isPrivate={isPrivate}
        password={intendedPassword}
      />
    </ResponsiveActivityLayout>
  )
}
