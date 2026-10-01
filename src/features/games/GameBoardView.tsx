import { ResponsiveActivityLayout } from '@/components/layout/ResponsiveActivityLayout'
import type { GameType } from '@shared/protocol/game'
import { useGame } from '../../hooks/use-game'
import { ChessBoard } from './chess/ChessBoard'
import { XiangqiBoard } from './xiangqi/XiangqiBoard'
import { CaroBoard } from './caro/CaroBoard'
import { GameSocialSidebar, type ChatBan } from './GameSocialSidebar'

interface GameBoardViewProps {
  gameId: string
  myActorKey?: string
  myActorName?: string
  onLeave: () => void
  /** Chỉ có khi VỪA tạo bàn từ sảnh — áp trò chơi/thời gian lượt đã chọn cho bàn còn trống. */
  intendedGameType?: GameType
  intendedTurnSeconds?: number
}

export function GameBoardView({
  gameId,
  myActorKey,
  myActorName: _myActorName,
  onLeave,
  intendedGameType,
  intendedTurnSeconds,
}: GameBoardViewProps) {
  // Một kết nối tới bàn (RoomDO) cho cả bàn cờ lẫn chat phòng: nước đi, đồng hồ lượt, biểu cảm và tin nhắn đều qua đây.
  const ban = useGame(gameId, myActorKey, intendedGameType, intendedTurnSeconds)
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

  const roomName = meta.gameType === 'chess' ? 'Phòng Cờ Vua' : meta.gameType === 'xiangqi' ? 'Phòng Cờ Tướng' : 'Phòng Cờ Caro'
  return (
    <ResponsiveActivityLayout
      utilityMode="floating"
      showFloatingTrigger={false}
      socialLabel="Chat phòng"
      finalFocusSelector='[data-testid="game-room-chat-trigger"]'
      social={
        chatBan ? (
          <GameSocialSidebar
            roomId={gameId}
            roomName={roomName}
            userRole={userRole}
            chatBan={chatBan}
            roomOnly={true}
          />
        ) : undefined
      }
    >
      <div className="game-stage flex min-w-0 w-full flex-col rounded-2xl border border-border-default bg-surface/85 backdrop-blur-md p-2 sm:p-4 shadow-sm">
        {meta.gameType === 'chess' ? (
          <ChessBoard onBack={onLeave} online={online} />
        ) : meta.gameType === 'xiangqi' ? (
          <XiangqiBoard onBack={onLeave} online={online} />
        ) : (
          <CaroBoard onBack={onLeave} online={online} />
        )}
      </div>
    </ResponsiveActivityLayout>
  )
}
