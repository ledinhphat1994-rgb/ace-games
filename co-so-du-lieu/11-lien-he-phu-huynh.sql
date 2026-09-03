-- Nhật ký liên hệ phụ huynh: mỗi lần gọi điện/gặp/nhắn tin cho phụ huynh một em,
-- ghi lại NGAY LÚC ĐÓ để không quên đã liên hệ chưa, nói gì, kết quả ra sao.
CREATE TABLE IF NOT EXISTS lien_he_phu_huynh (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  hoc_sinh_id INTEGER NOT NULL REFERENCES hoc_sinh(id),
  ngay        TEXT NOT NULL,
  hinh_thuc   TEXT NOT NULL DEFAULT 'goi_dien',  -- goi_dien | gap_truc_tiep | nhan_tin | khac
  noi_dung    TEXT NOT NULL,
  ket_qua     TEXT DEFAULT '',                   -- vd: "PH đã nắm, sẽ nhắc con"; để trống nếu chưa rõ
  tao_luc     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lien_he_hs ON lien_he_phu_huynh(hoc_sinh_id, ngay DESC);
