---
trigger: always_on
---

# Quy tắc Homepage: Không Trùng Lặp Nội Dung (Zero Redundant Filler — Homepage Edition)

> **Nguồn gốc:** User yêu cầu ngày 2026-10-02 sau khi nhận thấy homepage
> hiển thị lại nội dung đã có đầy đủ ở các trang chuyên dụng.

## Quy tắc bắt buộc — KHÔNG BAO GIỜ vi phạm:

### 1. Không đặt "Phòng học trực tuyến" trên Homepage
- Trang `/learn` (Học tập) đã có toàn bộ danh sách phòng học, bộ lọc, tìm kiếm, tạo phòng.
- Homepage **TUYỆT ĐỐI KHÔNG** lặp lại carousel phòng học. Đây là nội dung trùng lặp.
- Nếu muốn thể hiện phòng học đang hoạt động, chỉ dùng dạng **badge số lượng** hoặc **activity card** trong "Hoạt động nổi bật" — không phải full carousel.

### 2. Không đặt link "Xem tất cả →" trùng với điều hướng chính
- "Bạn bè đang online" → đã có mục "Cộng đồng" ở sidebar — KHÔNG cần "Xem tất cả →"
- "Trò chuyện gần đây" → đã có nút mở chat trong header — KHÔNG cần "Xem tất cả →"
- "Sự kiện sắp diễn ra" → nếu cần → liên kết trực tiếp, không qua trang trung gian

### 3. Không tạo shortcut card trỏ về trang đã trong nav chính
- Sidebar đã có: Học tập, Game, Cộng đồng, Bảng xếp hạng
- Homepage **KHÔNG** được tạo thêm card/button nào chỉ để điều hướng đến 4 trang đó (ngoại trừ Vùng 2 Quick Nav là nhất quán với thiết kế mockup)

### 4. Zone 1+ = CTA Community + Tin nhắn nhanh (nằm ngay sau Hero)
- Sau Zone 1 (Hero Banner), Zone 1+ là 2-col section:
  - **Trái:** CTA tham gia cộng đồng (Crown icon, text, button)
  - **Phải:** Tin nhắn nhanh (quick message input + recent messages)
- Đây là nơi DUY NHẤT đặt CTA cộng đồng và quick message trên homepage

### 5. Quy tắc layout cố định Homepage
```
Zone 1  : Hero Banner (full width, ~480px)
Zone 1+ : CTA Community (left) + Tin nhắn nhanh (right) — full width, 2-col
Zone 2  : 4 Quick Nav Cards (shared container, glow icons 64px)
[2-col grid xl:grid-cols-12]
  Zone 3 (8-col): Hoạt động nổi bật (3 activity cards)
  Zone 5 (4-col): Bạn bè online + Trò chuyện + Vinh danh
```
