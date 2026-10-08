import { describe, it, expect } from 'vitest'
import thePhongGameRaw from '../src/features/games/ThePhongGame.tsx?raw'
import gameLobbyViewRaw from '../src/features/games/GameLobbyView.tsx?raw'
import modalRaw from '../src/features/engagement/AchievementsModal.tsx?raw'
import { ACHIEVEMENT_CATALOG } from '../worker/lib/engagement'

describe('AchievementsModal & Giải Đấu UI / UX Regression Tests', () => {
  it('1. Đổi chữ "VIP Giải đấu" thành "Giải đấu" trong ThePhongGame và GameLobbyView', () => {
    // Badge thẻ phòng game phải là "Giải đấu", không còn "VIP Giải đấu"
    expect(thePhongGameRaw).toContain('<span>Giải đấu</span>')
    expect(thePhongGameRaw).not.toContain('<span>VIP Giải đấu</span>')

    // Bộ lọc sảnh game phải có label "Giải đấu", không còn "VIP Giải đấu"
    expect(gameLobbyViewRaw).toContain("label: 'Giải đấu'")
    expect(gameLobbyViewRaw).not.toContain("label: 'VIP Giải đấu'")
  })

  it('2. Vùng 1: Card huy hiệu trong AchievementsModal thích ứng mobile dọc & ngang, không rớt dòng badge XP', () => {
    // Card huy hiệu có min-h-[80px] đảm bảo hiển thị trọn vẹn nội dung không bị cắt xén
    expect(modalRaw).toContain('min-h-[80px]')

    // Không còn flex-wrap gây rớt dòng badge XP xuống dưới tiêu đề
    expect(modalRaw).not.toContain('flex flex-wrap items-baseline justify-between')

    // Khóa badge XP ở cùng dòng bên phải với whitespace-nowrap và tabular-nums
    expect(modalRaw).toContain('flex items-center justify-between gap-1.5 min-w-0')
    expect(modalRaw).toContain('shrink-0 text-xs font-black text-amber-400 tabular-nums whitespace-nowrap')
  })

  it('3. Khung nội dung flex-1 min-h-0 và footer mt-auto shrink-0 luôn hiển thị nút trên mobile dọc và ngang', () => {
    // Khung cuộn flex-1 min-h-0 đồng nhất, chống giật CLS và thích ứng mọi chiều cao mobile
    expect(modalRaw).toContain('flex-1 min-h-0 overflow-y-auto overscroll-contain')

    // Cửa hàng vật phẩm đã được tách ra khỏi modal thành tựu
    expect(modalRaw).not.toContain('Cửa hàng vật phẩm')

    // Footer được cố định ở đáy modal với shrink-0 mt-auto đảm bảo luôn thấy nút bấm
    expect(modalRaw).toContain('mt-auto shrink-0')
    expect(modalRaw).toContain('Thoát')
  })

  it('4. Danh mục nhiệm vụ đa dạng bao phủ đầy đủ tính năng của web (20 nhiệm vụ)', () => {
    expect(ACHIEVEMENT_CATALOG.length).toBeGreaterThanOrEqual(20)

    const keys = ACHIEVEMENT_CATALOG.map((a) => a.key)
    // Game Arena
    expect(keys).toContain('chess_master')
    expect(keys).toContain('xiangqi_tactician')
    expect(keys).toContain('caro_strategist')
    expect(keys).toContain('snake_challenger')
    expect(keys).toContain('memory_ace')
    expect(keys).toContain('tournament_warrior')
    expect(keys).toContain('win_streak_hero')

    // Classroom / Học tập
    expect(keys).toContain('first_session')
    expect(keys).toContain('study_regular_5')
    expect(keys).toContain('whiteboard_creator')
    expect(keys).toContain('document_scholar')
    expect(keys).toContain('watch_together_sync')

    // Cộng đồng & Chuỗi
    expect(keys).toContain('friendship_circle')
    expect(keys).toContain('chat_communicator')
    expect(keys).toContain('streak_3')
    expect(keys).toContain('streak_7')
  })
})
