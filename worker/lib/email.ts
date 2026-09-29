// Gửi email qua Cloudflare Email Service (binding send_email "EMAIL", gói Workers Paid có sẵn 3.000 thư/tháng).
// Địa chỉ gửi phải thuộc tên miền đã onboard ở Compute > Email Service > Email Sending; chưa onboard thì send() ném lỗi.

export const DIA_CHI_GUI: EmailAddress = { name: 'Digital Campus · GDTX Định Quán', email: 'no-reply@gdtxdinhquan.com' }

const thoatHtml = (chuoi: string) =>
  chuoi.replace(/[&<>"']/g, (k) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[k] ?? k)

/** Thư mã khôi phục mật khẩu (6 số, hiệu lực 15 phút, dùng 1 lần). Không đặt mã ở tiêu đề để không lộ qua thông báo màn hình khoá. */
export function taoThuMaKhoiPhuc(p: { to: string; ten: string; code: string }): EmailMessageBuilder {
  const ten = thoatHtml(p.ten)
  return {
    from: DIA_CHI_GUI,
    to: p.to,
    subject: 'Mã khôi phục mật khẩu Digital Campus',
    text: [
      `Chào ${p.ten},`,
      '',
      `Mã khôi phục mật khẩu của bạn là: ${p.code}`,
      'Mã có hiệu lực 15 phút và chỉ dùng được 1 lần.',
      'Nhập mã ở mục Quên mật khẩu trên gdtxdinhquan.com để đặt mật khẩu mới.',
      '',
      'Nếu bạn không yêu cầu, hãy bỏ qua thư này — mật khẩu của bạn không thay đổi.',
    ].join('\n'),
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0f172a">
  <p>Chào ${ten},</p>
  <p>Mã khôi phục mật khẩu của bạn là:</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:16px 0">${p.code}</p>
  <p>Mã có hiệu lực <b>15 phút</b> và chỉ dùng được <b>1 lần</b>. Nhập mã ở mục <b>Quên mật khẩu</b> trên gdtxdinhquan.com để đặt mật khẩu mới.</p>
  <p style="color:#64748b;font-size:13px">Nếu bạn không yêu cầu, hãy bỏ qua thư này — mật khẩu của bạn không thay đổi.</p>
</div>`,
  }
}
