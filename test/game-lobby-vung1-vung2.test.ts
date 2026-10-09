import { describe, it, expect } from 'vitest'
import gameLobbyRaw from '../src/features/games/GameLobbyView.tsx?raw'
import thePhongGameRaw from '../src/features/games/ThePhongGame.tsx?raw'

describe('Game Lobby App Icon Grid 2 Hàng & Tạo Phòng Theo Game (User Request)', () => {
  describe('Vùng 1: App Icon squircle chuẩn Hình 1, xếp 2 hàng tĩnh, bấm game tạo phòng game đó', () => {
    it('hiển thị danh sách App Icon game với các icon 3D và Lucide', () => {
      expect(gameLobbyRaw).toContain('gameFilterCards')
      expect(gameLobbyRaw).toContain('<IconCrown3D')
      expect(gameLobbyRaw).toContain('<IconXiangqiPiece3D')
      expect(gameLobbyRaw).toContain('<IconCaroCubes3D')
      expect(gameLobbyRaw).toContain('<IconManaCrystal3D')
      expect(gameLobbyRaw).toContain('<IconSnakeApple3D')
      expect(gameLobbyRaw).toContain('<Gamepad2')
      expect(gameLobbyRaw).toContain('<Trophy')
      expect(gameLobbyRaw).toContain('<Users')
    })

    it('xếp các game thành 2 cột, kích thước icon app squircle to rõ chuẩn yêu cầu mới', () => {
      // Kích thước icon to rõ (size-20 sm:size-24 rounded-3xl)
      expect(gameLobbyRaw).toContain('size-20 sm:size-24')
      expect(gameLobbyRaw).toContain('rounded-3xl')
      // Lưới 2 cột để logo được to theo yêu cầu
      expect(gameLobbyRaw).toContain('grid grid-cols-2')
      // Không còn cuộn kéo ngang carouselRef hay cursor-grab
      expect(gameLobbyRaw).not.toContain('cursor-grab active:cursor-grabbing')
      expect(gameLobbyRaw).not.toContain('carouselRef')
    })

    it('bấm vào game và bấm vào tạo phòng thì tự động tạo phòng đúng game đó', () => {
      expect(gameLobbyRaw).toContain('handleCardSelect')
      expect(gameLobbyRaw).toContain('setGameMoiChon')
      expect(gameLobbyRaw).toContain('setTenPhongMoi')
      expect(gameLobbyRaw).toContain('data-testid="create-table-btn"')
      expect(gameLobbyRaw).toContain('setMoTaoBanModal(true)')
    })

    it('hiển thị số lượng phòng trên mỗi card và highlight khi chọn', () => {
      expect(gameLobbyRaw).toContain('roomCounts')
      expect(gameLobbyRaw).toContain('card.count')
      expect(gameLobbyRaw).toContain('selectedFilter === card.id')
    })
  })

  describe('Vùng 2: Lưới 3 hoặc 4 cột trên PC, card to rõ, chữ ngắn gọn vừa đủ', () => {
    it('lưới phòng game chia 3 hoặc 4 cột trên PC (lg:grid-cols-3 xl:grid-cols-4)', () => {
      expect(gameLobbyRaw).toContain('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')
    })

    it('card phòng game có chiều cao ổn định, icon to rõ và chữ ngắn gọn', () => {
      expect(thePhongGameRaw).toContain('min-h-[168px]')
      expect(thePhongGameRaw).toContain('size-16 sm:size-18')
      expect(thePhongGameRaw).toContain('truncate')
      expect(thePhongGameRaw).not.toContain('Chủ bàn:')
    })
  })
})
