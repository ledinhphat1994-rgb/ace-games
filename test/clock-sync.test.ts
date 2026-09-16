import { describe, expect, it } from 'vitest'
import { ClockSyncManager, tinhMedian } from '../src/features/study/clock-sync'

describe('ClockSyncManager — Unit Invariants & Robust Filtering', () => {
  it('tinhMedian: tính trung vị chính xác cho mảng chẵn và lẻ', () => {
    expect(tinhMedian([])).toBe(0)
    expect(tinhMedian([42])).toBe(42)
    expect(tinhMedian([10, 50, 20])).toBe(20)
    expect(tinhMedian([10, 20, 30, 40])).toBe(25)
    expect(tinhMedian([100, -50, 0])).toBe(0)
  })

  it('Normal RTT: tính toán độ trễ và serverClockOffset chính xác', () => {
    const mgr = new ClockSyncManager()
    const clientWall = 10000
    const clientPerf = 1000

    const t = mgr.createPing(clientWall, clientPerf)
    expect(t).toBe(clientWall)

    // Server nhận ping sau 50ms, clock server chạy trước 500ms
    // Midpoint của client = 10000 + 50 = 10050
    // Server now lúc đó = 10050 + 500 = 10550
    const pongPerf = 1100 // RTT = 100ms
    const serverNow = 10550

    const res = mgr.processPong(t, serverNow, pongPerf)
    expect(res.accepted).toBe(true)
    expect(res.rtt).toBe(100)
    expect(res.offset).toBe(500)
    expect(res.medianOffset).toBe(500)
    expect(mgr.getMedianOffset()).toBe(500)
    expect(mgr.getLastRtt()).toBe(100)
  })

  it('Jitter Outlier: bộ lọc Rolling Median loại bỏ nhiễu đột biến', () => {
    const mgr = new ClockSyncManager()

    // 5 mẫu bình thường có offset ~50ms
    for (let i = 1; i <= 5; i++) {
      const pingT = mgr.createPing(10000 * i, 1000 * i)
      mgr.processPong(pingT, 10000 * i + 10 + 50, 1000 * i + 20) // RTT = 20ms, offset = 50ms
    }
    expect(mgr.getMedianOffset()).toBe(50)

    // 1 mẫu đột biến do nghẽn mạng / lag CPU (offset nhảy vọt lên 3500ms)
    const spikePing = mgr.createPing(60000, 6000)
    const spikeRes = mgr.processPong(spikePing, 60000 + 50 + 3500, 6100) // RTT = 100ms, offset = 3500ms
    expect(spikeRes.accepted).toBe(true)
    // Median vẫn là 50ms, không bị kéo theo đột biến
    expect(mgr.getMedianOffset()).toBe(50)
  })

  it('Stale Pong: pong gửi sai t hoặc trễ không có trong pending pings bị từ chối', () => {
    const mgr = new ClockSyncManager([100])
    expect(mgr.getMedianOffset()).toBe(100)

    // Gửi pong với timestamp lạ không tồn tại trong outstanding pings
    const res = mgr.processPong(999999, 1234567, 5000)
    expect(res.accepted).toBe(false)
    expect(res.medianOffset).toBe(100)
    expect(mgr.getMedianOffset()).toBe(100)
  })

  it('Duplicate Pong: pong gửi trùng lặp cùng một timestamp t bị từ chối ở lần thứ hai', () => {
    const mgr = new ClockSyncManager()
    const t = mgr.createPing(1000, 100)

    // Lần 1: Chấp nhận
    const res1 = mgr.processPong(t, 1200, 150)
    expect(res1.accepted).toBe(true)

    // Lần 2: Cùng t -> Stale/Duplicate -> Từ chối
    const res2 = mgr.processPong(t, 1200, 155)
    expect(res2.accepted).toBe(false)
  })

  it('Absurd RTT & Offset: từ chối các mẫu phi lý', () => {
    const mgr = new ClockSyncManager([50])

    // RTT âm
    const t1 = mgr.createPing(2000, 500)
    const res1 = mgr.processPong(t1, 2100, 400) // perf = 400 < 500
    expect(res1.accepted).toBe(false)

    // RTT quá lớn (> 5000ms)
    const t2 = mgr.createPing(3000, 500)
    const res2 = mgr.processPong(t2, 3100, 6000) // RTT = 5500ms
    expect(res2.accepted).toBe(false)

    // Offset quá lớn (> 24h)
    const t3 = mgr.createPing(4000, 500)
    const res3 = mgr.processPong(t3, 4000 + 100000000, 520) // offset > 24h
    expect(res3.accepted).toBe(false)

    expect(mgr.getMedianOffset()).toBe(50)
  })

  it('Reset: dọn dẹp sạch outstanding pings và mẫu khi ngắt kết nối', () => {
    const mgr = new ClockSyncManager([50, 60, 70])
    mgr.createPing(1000, 100)
    expect(mgr.getSamples().length).toBe(3)

    mgr.reset()
    expect(mgr.getSamples().length).toBe(0)
    expect(mgr.getMedianOffset()).toBe(0)
    expect(mgr.getLastRtt()).toBeNull()

    // Sau khi reset, ping cũ t = 1000 không còn nhận được
    const res = mgr.processPong(1000, 1050, 120)
    expect(res.accepted).toBe(false)
  })
})
