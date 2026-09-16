export interface PingRecord {
  clientWall: number
  clientPerf: number
}

export function tinhMedian(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * NTP-style RTT midpoint clock-offset estimator.
 * Measures round-trip time (RTT) between client and server via ping/pong,
 * calculates estimated offset at RTT midpoint: serverNow - (clientWall + rtt / 2),
 * filters abnormal samples, and computes a rolling 7-sample median offset.
 */
export class ClockSyncManager {
  private outstandingPings = new Map<number, PingRecord>()
  private samples: number[] = []
  private medianOffset = 0
  private lastRtt: number | null = null

  constructor(initialSamples: number[] = []) {
    this.samples = [...initialSamples].slice(-7)
    if (this.samples.length > 0) {
      this.medianOffset = Math.round(tinhMedian(this.samples))
    }
  }

  createPing(nowWall = Date.now(), nowPerf = typeof performance !== 'undefined' ? performance.now() : Date.now()): number {
    // Dọn dẹp các ping cũ quá 15s chống tràn bộ nhớ
    const cutoff = nowWall - 15000
    for (const [t, record] of this.outstandingPings.entries()) {
      if (record.clientWall < cutoff) {
        this.outstandingPings.delete(t)
      }
    }
    this.outstandingPings.set(nowWall, { clientWall: nowWall, clientPerf: nowPerf })
    return nowWall
  }

  processPong(
    pongT: number,
    serverNow: number,
    nowPerf = typeof performance !== 'undefined' ? performance.now() : Date.now(),
  ): { accepted: boolean; rtt?: number; offset?: number; medianOffset: number } {
    if (!Number.isFinite(pongT) || !Number.isFinite(serverNow)) {
      return { accepted: false, medianOffset: this.medianOffset }
    }

    const ping = this.outstandingPings.get(pongT)
    if (!ping) {
      // Bỏ qua pong trễ hoặc trùng lặp
      return { accepted: false, medianOffset: this.medianOffset }
    }
    this.outstandingPings.delete(pongT)

    const rtt = nowPerf - ping.clientPerf
    // Loại bỏ RTT bất thường (< 0ms hoặc > 5000ms)
    if (rtt < 0 || rtt > 5000) {
      return { accepted: false, medianOffset: this.medianOffset }
    }

    const clientMidpoint = ping.clientWall + rtt / 2
    const sampleOffset = serverNow - clientMidpoint

    // Loại bỏ sai lệch offset phi lý (> 24h)
    if (Math.abs(sampleOffset) > 86400000) {
      return { accepted: false, medianOffset: this.medianOffset }
    }

    this.lastRtt = rtt
    this.samples = [...this.samples, sampleOffset].slice(-7)
    this.medianOffset = Math.round(tinhMedian(this.samples))

    return {
      accepted: true,
      rtt,
      offset: sampleOffset,
      medianOffset: this.medianOffset,
    }
  }

  reset(): void {
    this.outstandingPings.clear()
    this.samples = []
    this.medianOffset = 0
    this.lastRtt = null
  }

  getMedianOffset(): number {
    return this.medianOffset
  }

  getSamples(): number[] {
    return [...this.samples]
  }

  getLastRtt(): number | null {
    return this.lastRtt
  }
}
