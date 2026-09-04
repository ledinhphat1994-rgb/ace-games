# Quy ước viết mã

## Ngôn ngữ và cách đặt tên

- Tên tệp: tiếng Việt **không dấu**, nối bằng gạch ngang (`thoi-khoa-bieu.js`, `so-diem.js`).
- Tên biến/hàm: tiếng Việt không dấu kiểu lạc đà (`layPhien`, `bocXuLy`, `ngayHopLe`, `docThan`).
- Bình luận và mọi chữ hiện ra cho người dùng: tiếng Việt **có dấu**.
- Bình luận giải thích **vì sao** làm vậy, không diễn giải lại dòng code.

## Kiểu module

| Nơi | Kiểu |
|---|---|
| `functions/**`, `assets/js/**`, `giao-vien/**` | ES module (`import` / `export`) |
| `build.js`, `deploy.js`, `kiem-tra-tai-khoan.js`, `cong-cu/**` | CommonJS (`require`) |
| `sw.js` | Script service worker thuần, không import |

## Không thêm gì mới mà chưa hỏi

Không thêm thư viện, framework, bundler, TypeScript, CSS framework hay bước biên dịch.
Nếu thấy thật cần, **nói rõ lý do và chờ đồng ý** trước khi thêm.
Thư viện duy nhất đang dùng là `wrangler` (chỉ để phát triển và đăng trang).

## Viết một API

Luôn đi qua tiện ích trong `functions/_lib/api.js`:

```js
import { bocXuLy, json, loi, docThan, chuoi, ngayHopLe } from '../../_lib/api.js';

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const ten = chuoi(than.ten, 100);
  if (!ten) return loi('Chưa nhập tên.');
  await env.DB.prepare('INSERT INTO ... VALUES (?)').bind(ten).run();
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'quy' });
```

- Truy vấn D1 **luôn dùng `.bind(...)`**, không bao giờ nối chuỗi SQL.
- Nhiều câu liên quan nhau thì dùng `env.DB.batch([...])` để không lưu nửa vời.
- Trả lỗi bằng `loi('câu tiếng Việt dễ hiểu')`, không phô lỗi kỹ thuật cho giáo viên.

## Giao diện

- Dùng lại `assets/css/style.css` và `assets/css/quan-ly.css` cùng các biến CSS có sẵn.
- Vùng chạm tối thiểu 44×44 px; nút chỉ có biểu tượng phải có `aria-label`.
- Không dùng `innerHTML` với dữ liệu người dùng nhập — dùng `textContent`
  hoặc hàm tạo phần tử, để học sinh không chèn được HTML vào tên/ghi chú.
- Ngày lưu dạng `NĂM-THÁNG-NGÀY`, chỉ đổi sang `NGÀY/THÁNG/NĂM` khi hiển thị.

## Thêm tệp mới ở thư mục gốc

`build.js` chỉ sao chép những mục có tên trong `DANH_SACH_DANG`.
Tệp mới cần đăng lên mạng thì phải thêm tên vào danh sách đó; tệp nội bộ thì **đừng** thêm.
Đây là lớp chống đăng nhầm tệp bí mật, không phải chuyện quên sót.

## Sau khi sửa

```powershell
npm run kiem-tra-du-lieu   # JSON, cú pháp JS, rò rỉ mã bí mật
npm run lint               # ESLint (nếu đã cài)
```

Sửa gì ảnh hưởng đến cách giáo viên sử dụng thì **cập nhật `HUONG-DAN.md`** trong cùng lần sửa.
