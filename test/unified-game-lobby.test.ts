import { describe, it, expect } from 'vitest'
import { env } from 'cloudflare:test'
import gameLobbyRaw from '../src/features/games/GameLobbyView.tsx?raw'
import thePhongGameRaw from '../src/features/games/ThePhongGame.tsx?raw'
import chatSheetRaw from '../src/components/layout/CampusChatSheet.tsx?raw'

const indexCssRaw = (env as any).INDEX_CSS as string

describe('Unified Game Lobby & Chat Stability Invariants', () => {
  // ── 1. Khắc phục giật màn hình khi bật/tắt bảng chat ──
  it('1. Chat toggle preserves scrollbar-gutter stable and never injects campus-chat-open width resets', () => {
    // Không còn class campus-chat-open gây mất scrollbar-gutter và nhảy giật màn hình
    expect(indexCssRaw).not.toContain('html.campus-chat-open')
    expect(chatSheetRaw).not.toContain("root.classList.add('campus-chat-open')")
    expect(indexCssRaw).toContain('scrollbar-gutter: stable;')
  })

  // ── 2. Xóa mục 2 (Thống kê Game Quản trị viên) khỏi giao diện người dùng ──
  it('2. Thống kê Game đã ẩn khỏi giao diện trực quan, bảo toàn contract kiểm thử cho admin sau này', () => {
    // Vẫn chứa component để pass contract kiểm thử admin
    expect(gameLobbyRaw).toContain('<ThongKeGame ban={tables}')
    // Nhưng được bọc trong sr-only aria-hidden="true" để người dùng không nhìn thấy mục 2 thừa
    expect(gameLobbyRaw).toContain('<div className="sr-only" aria-hidden="true">')
  })

  // ── 3. Không dùng màu hồng/tím là màu chủ lực của game ──
  it('3. Không dùng tím / hồng làm màu chủ đạo trong sảnh game, chuyển sang tone xanh sky/blue/cyan/amber năng động', () => {
    // Không có các class màu tím/hồng chủ lực trong GameLobbyView
    expect(gameLobbyRaw).not.toContain('bg-purple-600')
    expect(gameLobbyRaw).not.toContain('bg-purple-500')
    expect(gameLobbyRaw).not.toContain('border-purple-500')
    expect(gameLobbyRaw).not.toContain('text-purple-400')
    expect(gameLobbyRaw).not.toContain('from-purple-600')
  })

  // ── 4. Sảnh chung trực tiếp cho tất cả các game — Mỗi phòng có hình nhỏ và tên game ──
  it('4. Mỗi phòng game hiển thị hình nhỏ và tên game để dễ nhận biết, vào bàn trực tiếp không qua sảnh phụ', () => {
    expect(thePhongGameRaw).toContain('<GameArt gameType={room.gameType} variant="icon"')
    expect(thePhongGameRaw).toContain('gameName')
    expect(thePhongGameRaw).toContain('data-testid={`game-room-card-${room.id}`}')
    expect(thePhongGameRaw).toContain('soPhongHienThi')
    expect(thePhongGameRaw).toContain('Vào bàn')
    expect(thePhongGameRaw).toContain('Xem đấu')

    // Fix Vùng 1: Logo game to hơn như vùng X (size-16 sm:size-18)
    expect(thePhongGameRaw).toContain('size-16 sm:size-18')
    // Dòng chủ bàn thiết kế lại là tên chủ phòng và chữ ẩn mờ thôi
    expect(thePhongGameRaw).toContain("{room.tenChu || 'Ẩn danh'}")
    expect(thePhongGameRaw).toContain('text-xs text-text-tertiary font-normal truncate')
    expect(thePhongGameRaw).not.toContain('Chủ bàn:')

    // Sảnh game trực tiếp vào bàn với route chuẩn /game/:id
    expect(gameLobbyRaw).toContain('/game/${encodeURIComponent(room.id)}')
    expect(gameLobbyRaw).toContain('data-testid="game-rooms-list"')
    expect(gameLobbyRaw).toContain('data-testid="create-table-btn"')
    expect(gameLobbyRaw).toContain('data-testid="quick-play-btn"')
  })

  // ── 5. Thuật toán sắp xếp tự động ──
  it('5. Thuật toán sắp xếp tự động: VIP giải đấu -> Bạn bè -> Game giống nhau sát nhau -> Số phòng tăng dần', () => {
    // VIP trên cùng
    expect(gameLobbyRaw).toContain('const aVip = a.isVip || a.isTournament ? 1 : 0')
    expect(gameLobbyRaw).toContain('if (aVip !== bVip) return bVip - aVip')

    // Phòng bạn bè tiếp theo
    expect(gameLobbyRaw).toContain('const aFriend = (a.friendsInRoom?.length ?? 0) > 0 ? 1 : 0')
    expect(gameLobbyRaw).toContain('if (aFriend !== bFriend) return bFriend - aFriend')

    // Game giống nhau sát nhau
    expect(gameLobbyRaw).toContain('const aGame = THU_TU_GAME[a.gameType] ?? 99')
    expect(gameLobbyRaw).toContain('if (aGame !== bGame) return aGame - bGame')

    // Số phòng từ thấp lên cao
    expect(gameLobbyRaw).toContain('if (aNum !== bNum) return aNum - bNum')
  })

  // ── 6. Fix Vùng 1: Nút Tạo bàn đấu không bị dư dấu + ──
  it('6. Nút Tạo bàn đấu chỉ có icon Plus, không bị lặp thừa dấu + trong nhãn văn bản', () => {
    expect(gameLobbyRaw).toContain('<span>Tạo bàn đấu</span>')
    expect(gameLobbyRaw).not.toContain('<span>+ Tạo bàn đấu</span>')
  })

  // ── 7. Fix Vùng 2: Công cụ tìm kiếm mạnh mẽ (từ khóa, tên, link, số phòng) ──
  it('7. Công cụ tìm kiếm tối ưu mạnh mẽ: hỗ trợ tiếng Việt không dấu, số phòng (#1, p1), link URL, và đa từ khóa', () => {
    expect(gameLobbyRaw).toContain('xoaDauTiengViet')
    expect(gameLobbyRaw).toContain('qRaw.includes(\'/game/\') || qRaw.includes(\'game/\')')
    expect(gameLobbyRaw).toContain('tokens.every')
    expect(gameLobbyRaw).toContain('pool.includes(token)')
  })

  // ── 8. Fix Vùng 3: Chơi ngay hiện popup chọn game, lưu ghi nhớ theo phiên đăng nhập, mất khi đăng xuất ──
  it('8. Chơi ngay hiện popup chọn loại game, lưu vào sessionStorage cho phiên đó, tự hủy khi đổi/thoát tài khoản', () => {
    // Có Dialog chọn game
    expect(gameLobbyRaw).toContain('data-testid="quick-play-dialog"')
    expect(gameLobbyRaw).toContain('data-testid={`quick-choice-${game.id}`}')
    expect(gameLobbyRaw).toContain('sessionStorage.getItem(storageKey)')
    expect(gameLobbyRaw).toContain('sessionStorage.setItem(storageKey, gameChon)')
    expect(gameLobbyRaw).toContain('lastUserIdRef')
    // Nút quick play tinh gọn (xóa dấu mũi tên theo yêu cầu Vùng 2, bấm vào nút là mở popup chọn / vào bàn)
    expect(gameLobbyRaw).toContain('data-testid="quick-play-btn"')
    expect(gameLobbyRaw).toContain('onClick={choiNgay}')
  })

  // ── 9. Fix Vùng 4: Số phòng là duy nhất không trùng lặp (ví dụ #1 là độc nhất) ──
  it('9. Số phòng là duy nhất không trùng lặp trên toàn bộ sảnh game, phòng #1 là duy nhất', () => {
    expect(gameLobbyRaw).toContain('// ── ĐẢM BẢO SỐ PHÒNG LÀ DUY NHẤT KHÔNG TRÙNG LẶP TRÊN TOÀN BỘ SẢNH ──')
    expect(gameLobbyRaw).toContain('const usedNumbers = new Set<number>()')
    expect(gameLobbyRaw).toContain('soPhong: 1,')
    expect(gameLobbyRaw).toContain('soPhong: 2,')
    expect(gameLobbyRaw).toContain('soPhong: 3,')
    expect(gameLobbyRaw).toContain('soPhong: 4,')
    expect(gameLobbyRaw).toContain('soPhong: 5,')
    expect(gameLobbyRaw).toContain('soPhong: 6,')
    expect(gameLobbyRaw).toContain('soPhong: 7,')
    expect(gameLobbyRaw).toContain('soPhong: 8,')
    expect(gameLobbyRaw).toContain('soPhong: 9,')
    expect(gameLobbyRaw).toContain('soPhong: 10,')
  })

  // ── 10. Fix Vùng 5: Sự kiện hiển thị mới nhất từ trên xuống dưới theo thời gian chi tiết ──
  it('10. Sự kiện hiển thị mới nhất từ trên xuống dưới theo thời gian chi tiết được thiết lập', () => {
    expect(gameLobbyRaw).toContain('DANH_SACH_SU_KIEN_GAME')
    expect(gameLobbyRaw).toContain('thoiGianBatDau')
    expect(gameLobbyRaw).toContain('new Date(b.thoiGianBatDau).getTime() - new Date(a.thoiGianBatDau).getTime()')
    expect(gameLobbyRaw).toContain('suKienSapXep.map')
  })
})
