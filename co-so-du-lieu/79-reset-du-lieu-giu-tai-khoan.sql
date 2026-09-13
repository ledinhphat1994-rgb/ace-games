-- Owner xác nhận 13/09/2026: xóa dữ liệu thật, bỏ quản trị cũ, giữ tài khoản Campus.
-- Owner chỉ định ledinhphat là quản trị viên toàn trường.
-- Giữ tên lớp / khóa ngoại / mã GV / TOTP / phân quyền để tài khoản đang có còn đăng nhập được.
-- Không reset sqlite_sequence: không tái sử dụng định danh đã xuất hiện trong phiên cũ.
-- CHỈ chạy qua npm run migrate -- apply; dữ liệu này không phải migration tạo schema mới.
PRAGMA defer_foreign_keys = ON;
-- Dừng trước khi ghi nếu thiếu tài khoản owner (nhánh json không hợp lệ phát sinh lỗi SQL).
SELECT CASE WHEN COUNT(*) = 1 THEN 1 ELSE json('Tai khoan ledinhphat chua san sang') END AS owner_hop_le
FROM tai_khoan_campus
WHERE ten_dang_nhap = 'ledinhphat' AND dang_hoat_dong = 1;

UPDATE tai_khoan_campus SET la_admin_truong = 1, vai_tro = 'teacher', teacher_pending = 0
WHERE ten_dang_nhap = 'ledinhphat' AND dang_hoat_dong = 1;
-- Gỡ liên kết sổ học sinh ở DB, phiên được làm mới từ DB sau mỗi request.
UPDATE tai_khoan_campus SET hoc_sinh_id = NULL WHERE hoc_sinh_id IS NOT NULL;
UPDATE lop SET gioi_thieu = '', banner_anh_id = NULL, banner_hinh_url = NULL,
  banner_video_id = NULL, banner_video_url = NULL, hs_cong_khai_an = NULL, hs_can_su_hien = NULL
WHERE id IS NOT NULL;
DELETE FROM ma_dang_nhap WHERE vai_tro != 'teacher';

-- Xóa bảng con trước bảng cha theo khóa ngoại của schema THẬT trên D1 remote.
DELETE FROM "user_achievements" WHERE 1 = 1;
DELETE FROM "achievements" WHERE 1 = 1;
DELETE FROM "activity_log" WHERE 1 = 1;
DELETE FROM "am_thanh" WHERE 1 = 1;
DELETE FROM "bai_dang_binh_luan" WHERE 1 = 1;
DELETE FROM "bai_dang_cam_xuc" WHERE 1 = 1;
DELETE FROM "campus_bien_tap_vien" WHERE 1 = 1;
DELETE FROM "campus_block" WHERE 1 = 1;
DELETE FROM "campus_chat_message" WHERE 1 = 1;
DELETE FROM "campus_friendship" WHERE 1 = 1;
DELETE FROM "campus_highlight_curation" WHERE 1 = 1;
DELETE FROM "campus_private_message" WHERE 1 = 1;
DELETE FROM "campus_report" WHERE 1 = 1;
DELETE FROM "campus_thong_bao" WHERE 1 = 1;
DELETE FROM "chat_cai_dat" WHERE 1 = 1;
DELETE FROM "chat_cam_hoc_sinh" WHERE 1 = 1;
DELETE FROM "chat_read_state" WHERE 1 = 1;
DELETE FROM "chat_tin_nhan" WHERE 1 = 1;
DELETE FROM "checkpoint_chung" WHERE 1 = 1;
DELETE FROM "community_membership" WHERE 1 = 1;
DELETE FROM "diem_danh" WHERE 1 = 1;
DELETE FROM "diem_danh_checkpoint" WHERE 1 = 1;
DELETE FROM "game_phong" WHERE 1 = 1;
DELETE FROM "hinh_anh" WHERE 1 = 1;
DELETE FROM "hoat_dong_lop" WHERE 1 = 1;
DELETE FROM "leaderboard" WHERE 1 = 1;
DELETE FROM "lien_he_phu_huynh" WHERE 1 = 1;
DELETE FROM "ma_ca_nhan" WHERE 1 = 1;
DELETE FROM "ma_truy_cap_cong_dong" WHERE 1 = 1;
DELETE FROM "quy_dong" WHERE 1 = 1;
DELETE FROM "tai_khoan_phu" WHERE 1 = 1;
DELETE FROM "theo_doi" WHERE 1 = 1;
DELETE FROM "user_points" WHERE 1 = 1;
DELETE FROM "user_streaks" WHERE 1 = 1;
DELETE FROM "hoc_sinh" WHERE 1 = 1;
DELETE FROM "ke_hoach" WHERE 1 = 1;
DELETE FROM "lop_about" WHERE 1 = 1;
DELETE FROM "luot_truy_cap" WHERE 1 = 1;
DELETE FROM "nhat_ky_dang_nhap" WHERE 1 = 1;
DELETE FROM "nhat_ky_quan_tri" WHERE 1 = 1;
DELETE FROM "nhat_ky_truy_cap" WHERE 1 = 1;
DELETE FROM "phong_ban" WHERE 1 = 1;
DELETE FROM "phong_dong_bo_video" WHERE 1 = 1;
DELETE FROM "phong_focus_state" WHERE 1 = 1;
DELETE FROM "phong_grant" WHERE 1 = 1;
DELETE FROM "phong_note" WHERE 1 = 1;
DELETE FROM "phong_policy" WHERE 1 = 1;
DELETE FROM "phong_sheet_cell" WHERE 1 = 1;
DELETE FROM "phong_thanh_vien" WHERE 1 = 1;
DELETE FROM "phong_tin_nhan" WHERE 1 = 1;
DELETE FROM "phong_video_queue" WHERE 1 = 1;
DELETE FROM "phong_voice_pair" WHERE 1 = 1;
DELETE FROM "phong_wb_op" WHERE 1 = 1;
DELETE FROM "su_kien_campus" WHERE 1 = 1;
DELETE FROM "phong" WHERE 1 = 1;
DELETE FROM "quy_checkpoint" WHERE 1 = 1;
DELETE FROM "quy_chi" WHERE 1 = 1;
DELETE FROM "quy_dinh_ky" WHERE 1 = 1;
DELETE FROM "quy_khoan" WHERE 1 = 1;
DELETE FROM "tai_len_theo_ngay" WHERE 1 = 1;
DELETE FROM "thong_bao" WHERE 1 = 1;
DELETE FROM "tkb_o" WHERE 1 = 1;
DELETE FROM "tkb_phien_ban" WHERE 1 = 1;
DELETE FROM "video" WHERE 1 = 1;
DELETE FROM "watch_party" WHERE 1 = 1;
DELETE FROM "watch_party_sync_log" WHERE 1 = 1;
DELETE FROM "watch_room_collab" WHERE 1 = 1;
DELETE FROM "watch_room_voice_signal" WHERE 1 = 1;

PRAGMA defer_foreign_keys = OFF;
