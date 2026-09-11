-- ==============================================================================
-- SCHEMA CHUẨN TOÀN BỘ CƠ SỞ DỮ LIỆU — HỆ THỐNG QUẢN LÝ LỚP HỌC (CLOUDFLARE D1)
-- ==============================================================================
-- Tệp này tổng hợp đầy đủ cấu trúc của tất cả các bảng, ràng buộc và chỉ mục (index).
-- Dùng để:
--   1. Khởi tạo một cơ sở dữ liệu mới hoàn toàn (Local hoặc Remote).
--   2. Tham chiếu cấu trúc bảng chuẩn khi bảo trì, sửa lỗi hoặc mở rộng tính năng.
--   3. Xuất backup / restore nhanh chóng cho các năm học tiếp theo.
-- ==============================================================================

-- 1. BẢNG QUẢN LÝ LỚP VÀ CẤU HÌNH ĐA LỚP
CREATE TABLE IF NOT EXISTS lop (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ten          TEXT NOT NULL,                         -- Vd: "Lớp 10A7", "Lớp 11A1"
  khoa_hoc     TEXT NOT NULL,                         -- Vd: "2026-2027"
  nam_hoc      TEXT NOT NULL,                         -- Vd: "2026-2027"
  truong       TEXT NOT NULL DEFAULT 'GDTX Định Quán',
  slug         TEXT UNIQUE,                           -- Vd: "10a7", "11a1"
  banner       TEXT,                                  -- Khoá ảnh banner lưu trên R2
  tao_luc      TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lop_slug ON lop(slug);

-- 2. HỌC SINH
CREATE TABLE IF NOT EXISTS hoc_sinh (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  stt                     INTEGER NOT NULL,
  ho_ten                  TEXT NOT NULL,
  gioi_tinh               TEXT NOT NULL CHECK(gioi_tinh IN ('Nam', 'Nữ')),
  ngay_sinh               TEXT,
  to_so                   INTEGER NOT NULL DEFAULT 1,
  chuc_vu                 TEXT NOT NULL DEFAULT 'Học sinh',
  so_dien_thoai           TEXT,
  so_dien_thoai_phu_huynh TEXT,
  ghi_chu                 TEXT,
  lop_id                  INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc                 TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hoc_sinh_lop ON hoc_sinh(lop_id, stt);

-- 3. MÃ ĐĂNG NHẬP RIÊNG CỦA TỪNG HỌC SINH (MÃ CÁ NHÂN)
CREATE TABLE IF NOT EXISTS ma_ca_nhan (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  hoc_sinh_id     INTEGER NOT NULL UNIQUE REFERENCES hoc_sinh(id) ON DELETE CASCADE,
  ma_bam          TEXT NOT NULL,
  muoi            TEXT NOT NULL,
  quyen           TEXT DEFAULT '',                    -- Cán sự được cấp quyền: 'quy', 'diem_danh'...
  thiet_bi        TEXT,                               -- phienId duy nhất để quản lý "1 tài khoản 1 phiên"
  dang_hoat_dong  INTEGER NOT NULL DEFAULT 1,
  lop_id          INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ma_ca_nhan_lop ON ma_ca_nhan(lop_id, hoc_sinh_id);

-- 4. TÀI KHOẢN PHỤ (CÁN SỰ ĐẶC BIỆT / TRỢ GIẢNG)
CREATE TABLE IF NOT EXISTS tai_khoan_phu (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  ten             TEXT NOT NULL,
  vai_tro         TEXT NOT NULL,
  ma_bam          TEXT NOT NULL,
  muoi            TEXT NOT NULL,
  quyen           TEXT NOT NULL DEFAULT '',
  dang_hoat_dong  INTEGER NOT NULL DEFAULT 1,
  thiet_bi        TEXT,                               -- phienId duy nhất của phiên đăng nhập hiện tại
  lop_id          INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tai_khoan_phu_lop ON tai_khoan_phu(lop_id);

-- 5. MÃ ĐĂNG NHẬP CHUNG (LỚP / GIÁO VIÊN THEO LỚP)
CREATE TABLE IF NOT EXISTS ma_dang_nhap (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  loai     TEXT NOT NULL CHECK(loai IN ('hoc_sinh', 'giao_vien')),
  ma_bam   TEXT NOT NULL,
  muoi     TEXT NOT NULL,
  lop_id   INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc  TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ma_dang_nhap_lop ON ma_dang_nhap(lop_id, loai);

-- 6. ĐIỂM DANH HỌC SINH
CREATE TABLE IF NOT EXISTS diem_danh (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ngay        TEXT NOT NULL,
  hoc_sinh_id INTEGER NOT NULL REFERENCES hoc_sinh(id) ON DELETE CASCADE,
  trang_thai  TEXT NOT NULL CHECK(trang_thai IN ('co_mat', 'tre', 'phep', 'khong_phep')),
  ghi_chu     TEXT,
  lop_id      INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc     TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ngay, hoc_sinh_id, lop_id)
);
CREATE INDEX IF NOT EXISTS idx_diem_danh_ngay ON diem_danh(lop_id, ngay);
CREATE INDEX IF NOT EXISTS idx_diem_danh_hs ON diem_danh(lop_id, hoc_sinh_id);

-- 7. LỊCH SỬ & KHÔI PHỤC ĐIỂM DANH (CHECKPOINT)
CREATE TABLE IF NOT EXISTS diem_danh_checkpoint (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  ngay            TEXT NOT NULL,
  hanh_dong       TEXT NOT NULL,
  nguoi_thuc_hien TEXT NOT NULL DEFAULT '',
  du_lieu         TEXT NOT NULL,                      -- JSON lưu trạng thái trước khi sửa
  lop_id          INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_diem_danh_checkpoint ON diem_danh_checkpoint(lop_id, ngay, id DESC);

-- 8. THÔNG BÁO LỚP HỌC
CREATE TABLE IF NOT EXISTS thong_bao (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  tieu_de             TEXT NOT NULL,
  tieu_de_dinh_dang   TEXT,
  noi_dung            TEXT NOT NULL,
  noi_dung_dinh_dang  TEXT,
  ghim                INTEGER NOT NULL DEFAULT 0,
  quan_trong          INTEGER NOT NULL DEFAULT 0,
  moc_su_kien         TEXT,                           -- YYYY-MM-DD
  nhac_id             INTEGER,
  video_id            INTEGER,
  video_tep_khoa      TEXT,
  lop_id              INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc             TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_thong_bao_lop ON thong_bao(lop_id, ghim DESC, id DESC);

-- 9. QUỸ LỚP: CÁC KHOẢN THU
CREATE TABLE IF NOT EXISTS quy_khoan (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ten         TEXT NOT NULL,
  so_tien     INTEGER NOT NULL,
  ghi_chu     TEXT,
  da_dong     INTEGER NOT NULL DEFAULT 0,
  lop_id      INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc     TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_quy_khoan_lop ON quy_khoan(lop_id);

-- 10. QUỸ LỚP: CHI TIẾT ĐÓNG TIỀN THEO HỌC SINH
CREATE TABLE IF NOT EXISTS quy_dong (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  khoan_id    INTEGER NOT NULL REFERENCES quy_khoan(id) ON DELETE CASCADE,
  hoc_sinh_id INTEGER NOT NULL REFERENCES hoc_sinh(id) ON DELETE CASCADE,
  ngay_dong   TEXT NOT NULL,
  so_tien     INTEGER NOT NULL,
  ghi_chu     TEXT,
  lop_id      INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc     TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(khoan_id, hoc_sinh_id)
);
CREATE INDEX IF NOT EXISTS idx_quy_dong_khoan ON quy_dong(lop_id, khoan_id);
CREATE INDEX IF NOT EXISTS idx_quy_dong_hs ON quy_dong(lop_id, hoc_sinh_id);

-- 11. QUỸ LỚP: CÁC KHOẢN CHI TIÊU
CREATE TABLE IF NOT EXISTS quy_chi (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ngay        TEXT NOT NULL,
  noi_dung    TEXT NOT NULL,
  so_tien     INTEGER NOT NULL,
  loai_chi    TEXT NOT NULL DEFAULT 'chung',
  ghi_chu     TEXT,
  nguoi_chi   TEXT,
  lop_id      INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc     TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_quy_chi_ngay ON quy_chi(lop_id, ngay DESC);

-- 12. QUỸ LỚP: CHECKPOINT KHÔI PHỤC
CREATE TABLE IF NOT EXISTS quy_checkpoint (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  hanh_dong       TEXT NOT NULL,
  nguoi_thuc_hien TEXT NOT NULL DEFAULT '',
  du_lieu         TEXT NOT NULL,
  lop_id          INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_quy_checkpoint_lop ON quy_checkpoint(lop_id, id DESC);

-- 13. QUỸ LỚP: CẤU HÌNH ĐỊNH KỲ
CREATE TABLE IF NOT EXISTS quy_dinh_ky (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  ten      TEXT NOT NULL,
  so_tien  INTEGER NOT NULL,
  chu_ky   TEXT NOT NULL CHECK(chu_ky IN ('thang', 'hoc_ky', 'nam')),
  lop_id   INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc  TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 14. THƯ VIỆN HÌNH ẢNH (LƯU TRỮ TRÊN CLOUDFLARE R2)
CREATE TABLE IF NOT EXISTS hinh_anh (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  khoa        TEXT NOT NULL UNIQUE,                   -- Khoá đối tượng trong R2 bucket
  chu_thich   TEXT,
  noi_bat     INTEGER NOT NULL DEFAULT 0,
  phan_loai   TEXT DEFAULT 'chung',
  kich_thuoc  INTEGER DEFAULT 0,
  da_xoa_luc  TEXT,                                   -- Thùng rác (ẩn khỏi thư viện)
  lop_id      INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc     TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hinh_anh_lop ON hinh_anh(lop_id, noi_bat DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_hinh_anh_rac ON hinh_anh(lop_id, da_xoa_luc);

-- 15. THƯ VIỆN ÂM THANH (LƯU TRÊN R2)
CREATE TABLE IF NOT EXISTS am_thanh (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  khoa        TEXT NOT NULL UNIQUE,
  ten         TEXT NOT NULL,
  kieu        TEXT NOT NULL DEFAULT 'audio/mpeg',
  kich_thuoc  INTEGER DEFAULT 0,
  da_xoa_luc  TEXT,
  lop_id      INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc     TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_am_thanh_lop ON am_thanh(lop_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_am_thanh_rac ON am_thanh(lop_id, da_xoa_luc);

-- 16. THƯ VIỆN VIDEO (LƯU TRÊN R2)
CREATE TABLE IF NOT EXISTS video (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  khoa        TEXT NOT NULL UNIQUE,
  ten         TEXT NOT NULL,
  kieu        TEXT NOT NULL DEFAULT 'video/mp4',
  kich_thuoc  INTEGER DEFAULT 0,
  da_xoa_luc  TEXT,
  lop_id      INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc     TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_video_lop ON video(lop_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_video_rac ON video(lop_id, da_xoa_luc);

-- 17. HOẠT ĐỘNG LỚP
CREATE TABLE IF NOT EXISTS hoat_dong_lop (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  tieu_de             TEXT NOT NULL,
  tieu_de_dinh_dang   TEXT,
  noi_dung            TEXT,
  noi_dung_dinh_dang  TEXT,
  loai                TEXT DEFAULT 'anh',             -- 'anh', 'video', 'bai_viet'
  khoa_anh            TEXT,
  tep_id              INTEGER,
  ngay                TEXT,
  ghim                INTEGER DEFAULT 0,
  lop_id              INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc             TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hoat_dong_lop ON hoat_dong_lop(lop_id, ghim DESC, id DESC);

-- 18. THỜI KHOÁ BIỂU: PHIÊN BẢN & Ô TIẾT HỌC
CREATE TABLE IF NOT EXISTS tkb_phien_ban (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ten         TEXT NOT NULL,
  ap_dung_tu  TEXT NOT NULL,                          -- YYYY-MM-DD
  hien_tai    INTEGER NOT NULL DEFAULT 0,
  lop_id      INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc     TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tkb_phien_ban ON tkb_phien_ban(lop_id, hien_tai DESC);

CREATE TABLE IF NOT EXISTS tkb_o (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  phien_ban_id  INTEGER NOT NULL REFERENCES tkb_phien_ban(id) ON DELETE CASCADE,
  thu           INTEGER NOT NULL CHECK(thu BETWEEN 2 AND 7),
  tiet          INTEGER NOT NULL CHECK(tiet BETWEEN 1 AND 10),
  mon           TEXT NOT NULL,
  lop_id        INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id)
);
CREATE INDEX IF NOT EXISTS idx_tkb_o ON tkb_o(lop_id, phien_ban_id, thu, tiet);

-- 19. CHECKPOINT DÙNG CHUNG (THÔNG BÁO, TKB, HOẠT ĐỘNG LỚP)
CREATE TABLE IF NOT EXISTS checkpoint_chung (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tinh_nang       TEXT NOT NULL,                      -- 'thong-bao' | 'thoi-khoa-bieu' | 'hoat-dong-lop'
  hanh_dong       TEXT NOT NULL,
  nguoi_thuc_hien TEXT NOT NULL DEFAULT '',
  du_lieu         TEXT NOT NULL,
  lop_id          INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_checkpoint_chung ON checkpoint_chung(lop_id, tinh_nang, id DESC);

-- 20. GIỚI HẠN TẢI LÊN FILE MỖI NGÀY (CHỐNG TRÀN BỘ NHỚ R2)
CREATE TABLE IF NOT EXISTS tai_len_theo_ngay (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ngay        TEXT NOT NULL,
  dung_luong  INTEGER NOT NULL DEFAULT 0,
  lop_id      INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  UNIQUE(ngay, lop_id)
);
CREATE INDEX IF NOT EXISTS idx_tai_len_ngay ON tai_len_theo_ngay(lop_id, ngay);

-- 21. NHẬT KÝ ĐĂNG NHẬP & TRUY CẬP HỆ THỐNG
CREATE TABLE IF NOT EXISTS nhat_ky_dang_nhap (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  hoc_sinh_id  INTEGER,
  thoi_gian    TEXT DEFAULT CURRENT_TIMESTAMP,
  ip           TEXT,
  user_agent   TEXT,
  lop_id       INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id)
);
CREATE INDEX IF NOT EXISTS idx_nhat_ky_dang_nhap ON nhat_ky_dang_nhap(lop_id, thoi_gian DESC);

CREATE TABLE IF NOT EXISTS nhat_ky_truy_cap (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  duong_dan  TEXT NOT NULL,
  ip         TEXT,
  thoi_gian  TEXT DEFAULT CURRENT_TIMESTAMP,
  lop_id     INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id)
);
CREATE INDEX IF NOT EXISTS idx_nhat_ky_truy_cap ON nhat_ky_truy_cap(lop_id, thoi_gian DESC);

-- 22. CẤU HÌNH PHÒNG CHAT (RATE LIMIT, BẬT/TẮT CHAT LỚP)
CREATE TABLE IF NOT EXISTS chat_cai_dat (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  lop_id              INTEGER NOT NULL UNIQUE REFERENCES lop(id),
  dang_mo             INTEGER NOT NULL DEFAULT 1,     -- 1: Mở chat, 0: Giáo viên tạm khoá
  gian_cach_giay      INTEGER NOT NULL DEFAULT 5,     -- Số giây giữa 2 tin nhắn (Rate limit)
  thong_bao_ghim      TEXT,                           -- Nội quy ghim đầu khung chat
  cap_nhat_luc        TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_cai_dat_lop ON chat_cai_dat(lop_id);

-- 23. TIN NHẮN TÁN GẪU LỚP HỌC
CREATE TABLE IF NOT EXISTS chat_tin_nhan (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  lop_id          INTEGER NOT NULL REFERENCES lop(id),
  hoc_sinh_id     INTEGER REFERENCES hoc_sinh(id) ON DELETE SET NULL,
  ten_nguoi_gui   TEXT NOT NULL,
  vai_tro         TEXT NOT NULL DEFAULT 'hoc_sinh',   -- 'hoc_sinh' | 'giao_vien' | 'he_thong'
  noi_dung        TEXT NOT NULL,
  da_xoa          INTEGER NOT NULL DEFAULT 0,
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_tin_nhan_lop ON chat_tin_nhan(lop_id, id ASC);

-- 24. DANH SÁCH HỌC SINH BỊ CẤM CHAT
CREATE TABLE IF NOT EXISTS chat_cam_hoc_sinh (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  hoc_sinh_id     INTEGER NOT NULL REFERENCES hoc_sinh(id) ON DELETE CASCADE,
  lop_id          INTEGER NOT NULL REFERENCES lop(id),
  ly_do           TEXT,
  den_luc         TEXT,
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(hoc_sinh_id, lop_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_cam_hs ON chat_cam_hoc_sinh(lop_id, hoc_sinh_id);

-- 25. KHUNG TRÒ CHƠI ĐỐI KHÁNG (CỜ TƯỚNG, CỜ CARO...)
CREATE TABLE IF NOT EXISTS game_phong (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  lop_id          INTEGER NOT NULL,
  loai_game       TEXT NOT NULL,
  ten_ban         TEXT NOT NULL,
  chu_phong_id    INTEGER NOT NULL,
  chu_phong_ten   TEXT NOT NULL,
  khach_id        INTEGER,
  khach_ten       TEXT,
  trang_thai      TEXT NOT NULL DEFAULT 'cho_nguoi',
  luot_di_id      INTEGER,
  du_lieu_ban_co  TEXT,
  nguoi_thang_id  INTEGER,
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP,
  cap_nhat_luc    TEXT DEFAULT CURRENT_TIMESTAMP,
  pham_vi         TEXT NOT NULL DEFAULT 'lop' CHECK (pham_vi IN ('lop', 'truong')),
  kieu_ghep       TEXT NOT NULL DEFAULT 'thu_cong' CHECK (kieu_ghep IN ('thu_cong', 'nhanh'))
);
CREATE INDEX IF NOT EXISTS idx_game_phong_lop ON game_phong(lop_id, loai_game, trang_thai);
CREATE INDEX IF NOT EXISTS idx_game_arena_lobby ON game_phong(pham_vi, loai_game, trang_thai, kieu_ghep);
CREATE UNIQUE INDEX IF NOT EXISTS uq_quick_match_waiting
ON game_phong(chu_phong_id, loai_game)
WHERE pham_vi = 'truong' AND kieu_ghep = 'nhanh' AND trang_thai = 'cho_nguoi';

-- 26. PHÒNG HOẠT ĐỘNG CAMPUS & HIỆN DIỆN & CHAT RIÊNG
CREATE TABLE IF NOT EXISTS phong (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  loai            TEXT NOT NULL DEFAULT 'chat',
  ten             TEXT NOT NULL,
  mo_ta           TEXT,
  pham_vi         TEXT NOT NULL DEFAULT 'truong',
  lop_id          INTEGER REFERENCES lop(id),
  chu_phong_khoa  TEXT NOT NULL,
  chu_phong_ten   TEXT NOT NULL,
  cau_hinh        TEXT,
  trang_thai      TEXT NOT NULL DEFAULT 'mo',
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP,
  cap_nhat_luc    TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_phong_mo ON phong(trang_thai, pham_vi, lop_id);

CREATE TABLE IF NOT EXISTS phong_thanh_vien (
  phong_id        INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  khoa            TEXT NOT NULL,
  hoc_sinh_id     INTEGER,
  ten             TEXT NOT NULL,
  vai_tro         TEXT NOT NULL DEFAULT 'hoc_sinh',
  lop_id          INTEGER,
  hoat_dong_luc   TEXT NOT NULL,
  vao_luc         TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (phong_id, khoa)
);
CREATE INDEX IF NOT EXISTS idx_ptv_phong ON phong_thanh_vien(phong_id);

CREATE TABLE IF NOT EXISTS phong_tin_nhan (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  phong_id        INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  khoa            TEXT NOT NULL,
  hoc_sinh_id     INTEGER,
  ten_nguoi_gui   TEXT NOT NULL,
  vai_tro         TEXT NOT NULL DEFAULT 'hoc_sinh',
  lop_id          INTEGER,
  noi_dung        TEXT NOT NULL,
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ptn_phong ON phong_tin_nhan(phong_id, id);

-- 27. ĐỒNG BỘ PHÁT VIDEO WATCH TOGETHER (PHASE 3C.1)
CREATE TABLE IF NOT EXISTS phong_dong_bo_video (
  phong_id            INTEGER PRIMARY KEY REFERENCES phong(id) ON DELETE CASCADE,
  trang_thai          TEXT NOT NULL DEFAULT 'paused',
  vi_tri_giay         REAL NOT NULL DEFAULT 0,
  toc_do              REAL NOT NULL DEFAULT 1.0,
  revision            INTEGER NOT NULL DEFAULT 1,
  cap_nhat_luc        TEXT DEFAULT CURRENT_TIMESTAMP,
  nguoi_cap_nhat_khoa TEXT,
  nguoi_cap_nhat_ten  TEXT
);
CREATE INDEX IF NOT EXISTS idx_pdbv_phong ON phong_dong_bo_video(phong_id);

-- 28. ĐỒNG BỘ PHIÊN TẬP TRUNG FOCUS ROOM / STUDY CAFÉ (PHASE 3D.1)
CREATE TABLE IF NOT EXISTS phong_focus_state (
  phong_id                INTEGER PRIMARY KEY REFERENCES phong(id) ON DELETE CASCADE,
  giai_doan               TEXT NOT NULL DEFAULT 'focus',
  trang_thai              TEXT NOT NULL DEFAULT 'paused',
  thoi_luong_giay         INTEGER NOT NULL DEFAULT 1500,
  thoi_gian_con_lai_giay  INTEGER NOT NULL DEFAULT 1500,
  preset                  TEXT NOT NULL DEFAULT '25_5',
  revision                INTEGER NOT NULL DEFAULT 1,
  cap_nhat_luc            TEXT DEFAULT CURRENT_TIMESTAMP,
  nguoi_cap_nhat_khoa     TEXT,
  nguoi_cap_nhat_ten      TEXT
);
CREATE INDEX IF NOT EXISTS idx_pfs_phong ON phong_focus_state(phong_id);

-- 29. THÔNG BÁO GIÁO VIÊN & BIÊN TẬP CAMPUS (PHASE 4A)
CREATE TABLE IF NOT EXISTS campus_thong_bao (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  tieu_de             TEXT NOT NULL,
  noi_dung            TEXT NOT NULL,
  noi_dung_dinh_dang  TEXT,
  anh_bia_url         TEXT,
  loai                TEXT NOT NULL DEFAULT 'thong_bao' CHECK (loai IN ('thong_bao', 'nhac_nho', 'lich_thi', 'tin_khan')),
  pham_vi             TEXT NOT NULL DEFAULT 'truong' CHECK (pham_vi IN ('truong', 'lop')),
  lop_id              INTEGER REFERENCES lop(id),
  trang_thai          TEXT NOT NULL DEFAULT 'published' CHECK (trang_thai IN ('draft', 'pending_review', 'published', 'archived')),
  ghim                INTEGER NOT NULL DEFAULT 0,
  uu_tien             INTEGER NOT NULL DEFAULT 0,
  nguoi_tao_khoa      TEXT NOT NULL,
  nguoi_tao_ten       TEXT NOT NULL,
  nguoi_tao_vai_tro   TEXT NOT NULL DEFAULT 'giao_vien' CHECK (nguoi_tao_vai_tro IN ('giao_vien', 'bien_tap_vien', 'admin')),
  nguoi_duyet_ten     TEXT,
  xuat_ban_luc        TEXT,
  cap_nhat_luc        TEXT DEFAULT CURRENT_TIMESTAMP,
  tao_luc             TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ctb_pham_vi ON campus_thong_bao(pham_vi, trang_thai, ghim DESC, tao_luc DESC);
CREATE INDEX IF NOT EXISTS idx_ctb_lop ON campus_thong_bao(lop_id, trang_thai);

-- 30. MÃ TRUY CẬP BẢNG TIN CỘNG ĐỒNG (PHASE 4A)
CREATE TABLE IF NOT EXISTS ma_truy_cap_cong_dong (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  ma_code             TEXT NOT NULL UNIQUE,
  lop_id              INTEGER NOT NULL REFERENCES lop(id) ON DELETE CASCADE,
  ten_goi             TEXT NOT NULL,
  so_lan_dung_toi_da  INTEGER DEFAULT 0,
  so_lan_da_dung      INTEGER NOT NULL DEFAULT 0,
  het_han_luc         TEXT,
  dang_hoat_dong      INTEGER NOT NULL DEFAULT 1,
  tao_boi_khoa        TEXT,
  tao_luc             TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mtccd_code ON ma_truy_cap_cong_dong(ma_code, dang_hoat_dong);

-- 31. HỌC SINH ĐƯỢC ỦY QUYỀN BIÊN TẬP (PHASE 4A)
CREATE TABLE IF NOT EXISTS campus_bien_tap_vien (
  hoc_sinh_id         INTEGER NOT NULL REFERENCES hoc_sinh(id) ON DELETE CASCADE,
  lop_id              INTEGER NOT NULL REFERENCES lop(id) ON DELETE CASCADE,
  duoc_phep_dang      INTEGER NOT NULL DEFAULT 0,
  nguoi_cap_khoa      TEXT NOT NULL,
  tao_luc             TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (hoc_sinh_id, lop_id)
);
CREATE INDEX IF NOT EXISTS idx_cbtv_lop ON campus_bien_tap_vien(lop_id);
