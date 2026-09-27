// Mã bàn do sảnh Game tạo ra phải qua được cổng WebSocket của máy chủ cho MỌI loại trò chơi.
// Hồi quy: mã dạng `caro_15-…` (có dấu gạch dưới) từng bị trả 400 nên bàn Caro 15×15 / 9×9 và
// "Ghép trận nhanh" không bao giờ kết nối được.
import { describe, expect, it } from 'vitest'
import type { GameType, GoiGame } from '../shared/protocol/game'
import { MAU_MA_BAN, laTroChoiDon, nenKhoiTaoBan, taoMaBan } from '../src/features/games/game-ids'
import workerRaw from '../worker/index.ts?raw'
import { dangNhapLayCookie, moKetNoi } from './ws'

const CAC_LOAI: readonly GameType[] = ['caro_15', 'chess', 'xiangqi', 'solo_memory', 'solo_snake']
const CAC_LOAI_1V1: readonly GameType[] = ['caro_15', 'chess', 'xiangqi']

describe('Mã bàn của sảnh Game', () => {
  it('khớp đúng mẫu mà cổng /ws/game/:maPhong của máy chủ đang dùng', () => {
    expect(workerRaw).toContain(`if (!${MAU_MA_BAN.toString()}.test(maPhong))`)
  })

  it('mọi loại trò chơi đều sinh mã hợp lệ, kể cả loại có dấu gạch dưới', () => {
    for (const loai of CAC_LOAI) {
      for (const random of [0, 0.5, 0.123456789, 0.999999]) {
        const ma = taoMaBan(loai, 1_790_000_000_000, random)
        expect(ma, `${loai} -> ${ma}`).toMatch(MAU_MA_BAN)
        expect(ma.startsWith(loai.replace(/_/g, '-') + '-')).toBe(true)
      }
    }
  })

  it('phân biệt trò chơi đơn với trò đối kháng', () => {
    expect(CAC_LOAI.filter(laTroChoiDon)).toEqual(['solo_memory', 'solo_snake'])
  })

  it('người tạo bàn khởi tạo cả bàn Caro 15×15 (trùng loại mặc định), chỉ khi bàn còn trống', () => {
    const trong = { status: 'waiting' as const, playerX: null, playerO: null }
    expect(nenKhoiTaoBan(trong, 'caro_15')).toBe(true)
    expect(nenKhoiTaoBan(trong, 'chess')).toBe(true)
    expect(nenKhoiTaoBan(trong, undefined)).toBe(false)
    expect(nenKhoiTaoBan({ ...trong, playerX: 'acc:1' }, 'caro_15')).toBe(false)
    expect(nenKhoiTaoBan({ ...trong, status: 'playing' }, 'caro_15')).toBe(false)
  })

  it('game.init trên bàn Caro 15×15 mới xếp người tạo vào ghế X và áp thời gian lượt đã chọn', async () => {
    const ma = taoMaBan('caro_15')
    const chu = await moKetNoi<GoiGame>(`/ws/game/${ma}`, await dangNhapLayCookie('qa.v2.thu1'))
    const snap = await chu.cho('game.snapshot')
    expect(nenKhoiTaoBan(snap.meta, 'caro_15')).toBe(true)
    chu.gui({ type: 'game.init', gameType: 'caro_15', turnSeconds: 15 })
    const dongBo = await chu.cho('game.sync')
    expect(dongBo.meta).toMatchObject({ gameType: 'caro_15', playerXName: 'QA Thử nghiệm 1', turnTimerSeconds: 15, status: 'waiting' })
    chu.dong()
  })

  it.each(CAC_LOAI_1V1)('bàn %s mới tạo kết nối được và nhận snapshot', async (loai) => {
    const ma = taoMaBan(loai)
    const ketNoi = await moKetNoi<GoiGame>(`/ws/game/${ma}`, await dangNhapLayCookie('qa.v2.thu1'))
    expect(ketNoi.status).toBe(101)
    await ketNoi.cho('game.snapshot')
    ketNoi.gui({ type: 'game.init', gameType: loai, turnSeconds: 30 })
    await ketNoi.cho('game.sync', (g) => g.meta.gameType === loai)
    ketNoi.dong()
  })

  it('mã kiểu cũ `caro_15-…` bị cổng máy chủ từ chối (lý do phải đổi định dạng)', async () => {
    const ketNoi = await moKetNoi<GoiGame>('/ws/game/caro_15-kieu-cu', await dangNhapLayCookie('qa.v2.thu1'))
    expect(ketNoi.status).toBe(400)
  })
})
