import { describe, it, expect } from 'vitest'
import gameLobbyRaw from '../src/features/games/GameLobbyView.tsx?raw'
import thePhongGameRaw from '../src/features/games/ThePhongGame.tsx?raw'

describe('Game Lobby Vùng 1 & Vùng 2 Enhancements', () => {
  describe('Vùng 1: Card từng game to rõ, icon to rõ, kéo qua kéo lại', () => {
    it('hiển thị danh sách card lọc game to rõ với các icon 3D và Lucide', () => {
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

    it('hỗ trợ tương tác kéo qua kéo lại (drag-to-scroll) mượt mà bằng chuột và 2 nút điều hướng', () => {
      expect(gameLobbyRaw).toContain('handleDragStart')
      expect(gameLobbyRaw).toContain('handleDragMove')
      expect(gameLobbyRaw).toContain('handleDragEnd')
      expect(gameLobbyRaw).toContain('carouselRef')
      expect(gameLobbyRaw).toContain('cuonTrai')
      expect(gameLobbyRaw).toContain('cuonPhai')
      expect(gameLobbyRaw).toContain('cursor-grab active:cursor-grabbing')
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
