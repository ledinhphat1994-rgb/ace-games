// Thống kê nhanh của sảnh (Học tập / Game) cho Quản trị trường: lịch sử 7 ngày theo giờ trường (UTC+7).
// Chỉ đọc D1 chính, không ghi. Nơi gọi đã chốt quyền (requireSchoolAdmin) trước khi vào đây.

import { SCHOOL_TIMEZONE, studyDate } from '../../shared/study-date'
import {
  SO_NGAY_THONG_KE,
  TRO_CHOI_THONG_KE,
  type LopHocTap,
  type NgayGame,
  type NgayHocTap,
  type SoLieuGame,
  type SoLieuHocTap,
  type ThongKeGame,
  type ThongKeHocTap,
} from '../../shared/protocol/thong-ke-sanh'
import type { GameType } from '../../shared/protocol/game'

/** Giờ trường cố định UTC+7 (Việt Nam không đổi giờ theo mùa). */
const LECH_GIO_MS = 7 * 3600 * 1000
/** Ngày giờ trường của mốc thời gian ms trong SQLite. */
const ngayTuMs = (cot: string) => `date((${cot} + ${LECH_GIO_MS}) / 1000, 'unixepoch')`

interface KhungNgay {
  homNay: string
  /** Đủ 7 ngày, cũ → mới. */
  cacNgay: string[]
  /** 0 giờ ngày đầu tiên theo giờ trường, dạng ms. */
  batDauMs: number
  /** Cùng mốc đó dạng chữ UTC 'YYYY-MM-DD HH:MM:SS' như D1 lưu CURRENT_TIMESTAMP. */
  batDauChuUtc: string
}

export function khungNgay(now: number): KhungNgay {
  const cacNgay = Array.from({ length: SO_NGAY_THONG_KE }, (_, i) =>
    studyDate(now - (SO_NGAY_THONG_KE - 1 - i) * 86400000, SCHOOL_TIMEZONE),
  )
  const batDauMs = Date.parse(`${cacNgay[0]}T00:00:00+07:00`)
  return {
    homNay: cacNgay[cacNgay.length - 1],
    cacNgay,
    batDauMs,
    batDauChuUtc: new Date(batDauMs).toISOString().slice(0, 19).replace('T', ' '),
  }
}

const so = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

export async function tinhThongKeHocTap(db: D1Database, now = Date.now()): Promise<ThongKeHocTap> {
  const k = khungNgay(now)
  const [phong, nguoiHoc, nguoiHoc7Ngay, buoiHoc, lop] = await db.batch([
    db
      .prepare(`SELECT date(tao_luc, '+7 hours') AS ngay, COUNT(*) AS n FROM phong WHERE tao_luc >= ?1 GROUP BY ngay`)
      .bind(k.batDauChuUtc),
    db
      .prepare(
        `SELECT study_date AS ngay, COUNT(DISTINCT account_id) AS n FROM study_activity_days
          WHERE study_date >= ?1 GROUP BY study_date`,
      )
      .bind(k.cacNgay[0]),
    db
      .prepare(`SELECT COUNT(DISTINCT account_id) AS n FROM study_activity_days WHERE study_date >= ?1`)
      .bind(k.cacNgay[0]),
    db
      .prepare(
        `SELECT ${ngayTuMs('started_at')} AS ngay, COUNT(*) AS n, COALESCE(SUM(duration_seconds), 0) AS giay
           FROM hoc_session_summary WHERE started_at >= ?1 GROUP BY ngay`,
      )
      .bind(k.batDauMs),
    db
      .prepare(
        `SELECT l.id AS lopId, l.ten AS ten,
                (SELECT COUNT(*) FROM tai_khoan_campus t
                  WHERE t.lop_id = l.id AND t.vai_tro = 'student' AND t.dang_hoat_dong = 1) AS siSo,
                (SELECT COUNT(DISTINCT s.account_id) FROM study_activity_days s
                   JOIN tai_khoan_campus t ON t.id = s.account_id
                  WHERE t.lop_id = l.id AND s.study_date = ?2) AS hocHomNay,
                (SELECT COUNT(DISTINCT s.account_id) FROM study_activity_days s
                   JOIN tai_khoan_campus t ON t.id = s.account_id
                  WHERE t.lop_id = l.id AND s.study_date >= ?1) AS hoc7Ngay
           FROM lop l WHERE l.dang_hoat_dong = 1 ORDER BY l.ten LIMIT 200`,
      )
      .bind(k.cacNgay[0], k.homNay),
  ])

  const theoNgay = new Map<string, NgayHocTap>(
    k.cacNgay.map((ngay) => [ngay, { ngay, phongTao: 0, nguoiHoc: 0, buoiHoc: 0, phutHoc: 0 }]),
  )
  for (const r of phong.results as { ngay: string; n: number }[]) {
    const d = theoNgay.get(r.ngay)
    if (d) d.phongTao = so(r.n)
  }
  for (const r of nguoiHoc.results as { ngay: string; n: number }[]) {
    const d = theoNgay.get(r.ngay)
    if (d) d.nguoiHoc = so(r.n)
  }
  for (const r of buoiHoc.results as { ngay: string; n: number; giay: number }[]) {
    const d = theoNgay.get(r.ngay)
    if (d) {
      d.buoiHoc = so(r.n)
      d.phutHoc = Math.round(so(r.giay) / 60)
    }
  }

  const dsNgay = [...theoNgay.values()]
  const homNay = theoNgay.get(k.homNay)!
  const tong7Ngay: SoLieuHocTap = {
    phongTao: dsNgay.reduce((t, d) => t + d.phongTao, 0),
    // Một học sinh học nhiều ngày chỉ tính một lần.
    nguoiHoc: so((nguoiHoc7Ngay.results[0] as { n?: number } | undefined)?.n),
    buoiHoc: dsNgay.reduce((t, d) => t + d.buoiHoc, 0),
    phutHoc: dsNgay.reduce((t, d) => t + d.phutHoc, 0),
  }

  return {
    loai: 'hoc_tap',
    homNay: k.homNay,
    theoNgay: dsNgay,
    tongHomNay: { phongTao: homNay.phongTao, nguoiHoc: homNay.nguoiHoc, buoiHoc: homNay.buoiHoc, phutHoc: homNay.phutHoc },
    tong7Ngay,
    theoLop: (lop.results as LopHocTap[]).map((r) => ({
      lopId: r.lopId,
      ten: r.ten,
      siSo: so(r.siSo),
      hocHomNay: so(r.hocHomNay),
      hoc7Ngay: so(r.hoc7Ngay),
    })),
  }
}

export async function tinhThongKeGame(db: D1Database, gameType: GameType | null, now = Date.now()): Promise<ThongKeGame> {
  const k = khungNgay(now)
  // Mỗi dòng là một người tham gia một ván: ván 1v1 đã kết thúc (chủ + khách) và lượt chơi đơn (trừ lượt bị chống gian lận loại).
  // Cột `van` = 1 ở đúng một dòng mỗi ván để đếm ván không bị nhân đôi.
  const suKien = `WITH ev AS (
      SELECT game_type AS g, ${ngayTuMs('ended_at')} AS d, host_account_id AS a, 1 AS van
        FROM game_matches WHERE status = 'ended' AND ended_at >= ?1 AND (?3 IS NULL OR game_type = ?3)
      UNION ALL
      SELECT game_type, ${ngayTuMs('ended_at')}, guest_account_id, 0
        FROM game_matches WHERE status = 'ended' AND ended_at >= ?1 AND guest_account_id IS NOT NULL AND (?3 IS NULL OR game_type = ?3)
      UNION ALL
      SELECT game_type, ${ngayTuMs('started_at')}, account_id, 1
        FROM game_sessions WHERE started_at >= ?1 AND status != 'rejected' AND (?3 IS NULL OR game_type = ?3)
    )`
  const homNay = `SUM(CASE WHEN d = ?2 THEN van ELSE 0 END) AS vanHomNay,
                  COUNT(DISTINCT CASE WHEN d = ?2 THEN a END) AS nguoiHomNay`
  const [theoTro, theoNgay, tong] = await db.batch([
    db.prepare(`${suKien} SELECT g, ${homNay}, SUM(van) AS van, COUNT(DISTINCT a) AS nguoi FROM ev GROUP BY g`).bind(k.batDauMs, k.homNay, gameType),
    db.prepare(`${suKien} SELECT d, SUM(van) AS van, COUNT(DISTINCT a) AS nguoi FROM ev GROUP BY d`).bind(k.batDauMs, k.homNay, gameType),
    db.prepare(`${suKien} SELECT ${homNay}, SUM(van) AS van, COUNT(DISTINCT a) AS nguoi FROM ev`).bind(k.batDauMs, k.homNay, gameType),
  ])

  type DongTong = { vanHomNay: number; nguoiHomNay: number; van: number; nguoi: number }
  const moiTro = new Map((theoTro.results as (DongTong & { g: string })[]).map((r) => [r.g, r]))
  const moiNgay = new Map((theoNgay.results as { d: string; van: number; nguoi: number }[]).map((r) => [r.d, r]))
  const t = (tong.results[0] ?? {}) as Partial<DongTong>

  return {
    loai: 'game',
    gameType,
    homNay: k.homNay,
    theoNgay: k.cacNgay.map<NgayGame>((ngay) => ({ ngay, van: so(moiNgay.get(ngay)?.van), nguoiChoi: so(moiNgay.get(ngay)?.nguoi) })),
    tongHomNay: { van: so(t.vanHomNay), nguoiChoi: so(t.nguoiHomNay) },
    tong7Ngay: { van: so(t.van), nguoiChoi: so(t.nguoi) },
    theoTroChoi: (gameType ? [gameType] : TRO_CHOI_THONG_KE).map((g) => {
      const r = moiTro.get(g)
      const homNayTro: SoLieuGame = { van: so(r?.vanHomNay), nguoiChoi: so(r?.nguoiHomNay) }
      return { gameType: g, homNay: homNayTro, bayNgay: { van: so(r?.van), nguoiChoi: so(r?.nguoi) } }
    }),
  }
}
