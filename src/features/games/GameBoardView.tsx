import type { GameType } from '@shared/protocol/game'
import { useGame } from '../../hooks/use-game'
import { ChessBoard } from './chess/ChessBoard'
import { XiangqiBoard } from './xiangqi/XiangqiBoard'
import { CaroBoard } from './caro/CaroBoard'
import { GameArenaLeaderboard } from './GameArenaLeaderboard'
import { GameSocialSidebar } from './GameSocialSidebar'

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
  const {
    meta,
    mySide,
  } = useGame(gameId, myActorKey, intendedGameType, intendedTurnSeconds)

  const userRole = mySide ? 'player' : 'spectator'

  // Cờ vua: Tích hợp chế độ bàn cờ đầy đủ chuẩn 3 cột
  if (meta.gameType === 'chess') {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_370px] 2xl:grid-cols-[380px_minmax(0,1fr)_380px] items-stretch w-full">
          {/* Cột 1 (Trái): Bảng xếp hạng */}
          <div className="min-w-0 order-2 lg:order-1 h-[700px] xl:h-[720px] 2xl:h-[740px]">
            <GameArenaLeaderboard defaultGame="chess" className="h-full" />
          </div>

          {/* Cột 2 (Trung tâm): Bàn cờ Cờ Vua & Thanh điều khiển */}
          <div className="min-w-0 order-1 lg:order-2 h-[700px] xl:h-[720px] 2xl:h-[740px] rounded-2xl border border-white/10 bg-gradient-to-b from-[#0d1424]/75 to-[#070b14]/75 backdrop-blur-md shadow-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-between overflow-hidden">
            <ChessBoard onBack={onLeave} />
          </div>

          {/* Cột 3 (Phải): Khung Chat Phòng, Chat Chung, Bạn bè */}
          <div className="min-w-0 order-3 lg:col-span-2 xl:col-span-1 h-[700px] xl:h-[720px] 2xl:h-[740px]">
            <GameSocialSidebar roomId={gameId} roomName="Phòng Cờ Vua" userRole={userRole} className="h-full" />
          </div>
        </div>
      </div>
    )
  }

  // Cờ tướng: Tích hợp chế độ bàn cờ đầy đủ chuẩn 3 cột
  if (meta.gameType === 'xiangqi') {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_370px] 2xl:grid-cols-[380px_minmax(0,1fr)_380px] items-stretch w-full">
          {/* Cột 1 (Trái): Bảng xếp hạng */}
          <div className="min-w-0 order-2 lg:order-1 h-[700px] xl:h-[720px] 2xl:h-[740px]">
            <GameArenaLeaderboard defaultGame="xiangqi" className="h-full" />
          </div>

          {/* Cột 2 (Trung tâm): Bàn cờ Cờ Tướng & Thanh điều khiển */}
          <div className="min-w-0 order-1 lg:order-2 h-[700px] xl:h-[720px] 2xl:h-[740px] rounded-2xl border border-white/10 bg-gradient-to-b from-[#0d1424]/75 to-[#070b14]/75 backdrop-blur-md shadow-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-between overflow-hidden">
            <XiangqiBoard onBack={onLeave} />
          </div>

          {/* Cột 3 (Phải): Khung Chat Phòng, Chat Chung, Bạn bè */}
          <div className="min-w-0 order-3 lg:col-span-2 xl:col-span-1 h-[700px] xl:h-[720px] 2xl:h-[740px]">
            <GameSocialSidebar roomId={gameId} roomName="Phòng Cờ Tướng" userRole={userRole} className="h-full" />
          </div>
        </div>
      </div>
    )
  }

  // Cờ Caro (caro_15): Chuẩn hoá giao diện theo khuôn mẫu Cờ Tướng
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-3.5 sm:gap-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_370px] 2xl:grid-cols-[380px_minmax(0,1fr)_380px] items-stretch w-full">
        {/* Cột 1 (Trái): Bảng xếp hạng */}
        <div className="min-w-0 order-2 lg:order-1 h-[720px] xl:h-[750px] 2xl:h-[780px]">
          <GameArenaLeaderboard defaultGame="caro_15" className="h-full" />
        </div>

        {/* Cột 2 (Trung tâm): Bàn cờ Caro 15x15 & Thanh điều khiển */}
        <div className="min-w-0 order-1 lg:order-2 h-[720px] xl:h-[750px] 2xl:h-[780px] rounded-2xl border border-white/10 bg-gradient-to-b from-[#0d1424]/75 to-[#070b14]/75 backdrop-blur-md shadow-2xl p-2.5 sm:p-3 flex flex-col items-center justify-between overflow-hidden">
          <CaroBoard onBack={onLeave} />
        </div>

        {/* Cột 3 (Phải): Khung Chat Phòng, Chat Chung, Bạn bè */}
        <div className="min-w-0 order-3 lg:col-span-2 xl:col-span-1 h-[720px] xl:h-[750px] 2xl:h-[780px]">
          <GameSocialSidebar roomId={gameId} roomName="Phòng Cờ Caro" userRole={userRole} className="h-full" />
        </div>
      </div>
    </div>
  )
}
