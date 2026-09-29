// Trang chính sách bảo mật công khai (/privacy) — đường link khai báo với Google khi bật đăng nhập bằng Google.
// Đứng ngoài AuthGate: không cần đăng nhập, không gọi API. Nội dung phải khớp dữ liệu hệ thống thực sự lưu.

import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, GraduationCap } from 'lucide-react'

const NGAY_CAP_NHAT = '30/09/2026'

function Muc({ tieuDe, children }: { tieuDe: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold tracking-tight text-text-primary">{tieuDe}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-text-secondary">{children}</div>
    </section>
  )
}

function DanhSach({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5 marker:text-text-tertiary">{children}</ul>
}

export function PrivacyPage() {
  return (
    <div className="min-h-svh bg-background px-4 py-10 sm:px-6">
      <article className="mx-auto max-w-3xl space-y-8" data-testid="privacy-page">
        <header className="space-y-4">
          <div className="flex items-center gap-2 select-none">
            <span className="flex size-8 items-center justify-center rounded-xl border border-brand/30 bg-brand/10 text-brand">
              <GraduationCap className="size-4" />
            </span>
            <span className="text-xs font-semibold tracking-wider text-text-tertiary uppercase">Digital Campus · GDTX Định Quán</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Chính sách bảo mật</h1>
          <p className="text-xs text-text-tertiary">Cập nhật: {NGAY_CAP_NHAT}</p>
          <p className="text-sm leading-relaxed text-text-secondary">
            Digital Campus (gdtxdinhquan.com) là nền tảng học tập trực tuyến của GDTX Định Quán. Trang này cho biết chúng tôi thu thập
            những dữ liệu nào, dùng để làm gì, ai có thể xem và bạn có những quyền gì với dữ liệu của mình.
          </p>
        </header>

        <Muc tieuDe="1. Dữ liệu chúng tôi thu thập">
          <DanhSach>
            <li>
              <strong className="text-text-primary">Tài khoản:</strong> tên đăng nhập, tên hiển thị, ảnh đại diện (nếu bạn tải lên), vai
              trò (học sinh / giáo viên) và lớp. Mật khẩu chỉ được lưu ở dạng mã hoá một chiều, không ai xem được mật khẩu gốc.
            </li>
            <li>
              <strong className="text-text-primary">Đăng nhập bằng Google:</strong> khi bạn chọn đăng nhập hoặc liên kết tài khoản Google,
              chúng tôi nhận từ Google địa chỉ email, họ tên, ảnh đại diện và mã định danh tài khoản Google. Chúng tôi không nhận mật khẩu
              Gmail và không truy cập thư, danh bạ hay tệp trên Google Drive của bạn.
            </li>
            <li>
              <strong className="text-text-primary">Hoạt động học tập:</strong> phòng học đã tham gia, thời lượng học, điểm kinh nghiệm (XP),
              chuỗi ngày học, thành tích và điểm trò chơi.
            </li>
            <li>
              <strong className="text-text-primary">Nội dung bạn tạo:</strong> tin nhắn trong chat chung và chat phòng, bạn bè và lời mời kết
              bạn, nét vẽ trên bảng, tài liệu và hình ảnh tải lên phòng học, báo cáo vi phạm.
            </li>
            <li>
              <strong className="text-text-primary">Dữ liệu kỹ thuật:</strong> một mã phiên ngẫu nhiên cho thiết bị đang đăng nhập (mỗi tài
              khoản chỉ đăng nhập trên một thiết bị). Địa chỉ IP chỉ được dùng tạm để giới hạn số lần đăng nhập sai và yêu cầu khôi phục mật
              khẩu, tự xoá sau tối đa 15 phút.
            </li>
            <li>
              <strong className="text-text-primary">Giọng nói:</strong> âm thanh micro được truyền trực tiếp tới người cùng phòng, không ghi
              âm và không lưu lại.
            </li>
          </DanhSach>
        </Muc>

        <Muc tieuDe="2. Mục đích sử dụng">
          <DanhSach>
            <li>Đăng nhập, giữ an toàn tài khoản và chống dò mật khẩu.</li>
            <li>Gửi mã khôi phục mật khẩu tới Gmail đã liên kết khi chính bạn yêu cầu ở mục Quên mật khẩu.</li>
            <li>Vận hành phòng học, chat, bạn bè, trò chơi và bảng xếp hạng lớp.</li>
            <li>Giúp giáo viên theo dõi việc học và xử lý vi phạm.</li>
            <li>
              Thống kê sử dụng tổng hợp để cải thiện website. Dữ liệu thống kê không chứa nội dung tin nhắn, mật khẩu hay địa chỉ IP và tự
              xoá sau 60 ngày.
            </li>
          </DanhSach>
          <p>Chúng tôi không dùng dữ liệu của bạn để quảng cáo và không bán dữ liệu cho bất kỳ ai.</p>
        </Muc>

        <Muc tieuDe="3. Ai có thể xem dữ liệu">
          <DanhSach>
            <li>Người dùng khác thấy tên hiển thị, ảnh đại diện, tin nhắn bạn gửi và thứ hạng XP trong lớp.</li>
            <li>Giáo viên chủ nhiệm xem được thông tin học sinh lớp mình; quản trị viên trường quản lý tài khoản toàn trường.</li>
            <li>
              Nhà cung cấp hạ tầng: Cloudflare (lưu trữ và vận hành website), Google (chỉ khi bạn đăng nhập bằng Google) và YouTube (khi
              phòng học phát video YouTube, trình phát YouTube áp dụng chính sách riêng của Google).
            </li>
          </DanhSach>
          <p>Ngoài các bên trên, chúng tôi không chia sẻ dữ liệu cho bên thứ ba, trừ khi pháp luật yêu cầu.</p>
        </Muc>

        <Muc tieuDe="4. Lưu trữ và xoá dữ liệu">
          <DanhSach>
            <li>Chat phòng: mỗi phòng chỉ giữ 200 tin nhắn gần nhất.</li>
            <li>Tài liệu phòng học được xoá khỏi bộ nhớ khi bị thay, đóng, xoá hoặc khi phòng học đóng.</li>
            <li>Dữ liệu thống kê: tự xoá sau 60 ngày.</li>
            <li>Tài khoản và dữ liệu học tập được giữ cho đến khi bạn yêu cầu xoá.</li>
          </DanhSach>
        </Muc>

        <Muc tieuDe="5. Cookie">
          <DanhSach>
            <li>Cookie đăng nhập: giữ bạn ở trạng thái đã đăng nhập (bắt buộc).</li>
            <li>Cookie vào phòng có mật khẩu: ghi nhớ bạn đã nhập đúng mật khẩu phòng.</li>
          </DanhSach>
          <p>Chúng tôi không dùng cookie quảng cáo hay công cụ theo dõi của bên thứ ba.</p>
        </Muc>

        <Muc tieuDe="6. Quyền của bạn">
          <DanhSach>
            <li>Xem và sửa hồ sơ, đổi ảnh đại diện và mật khẩu tại trang Hồ sơ cá nhân.</li>
            <li>
              Yêu cầu xoá tài khoản, gỡ liên kết Google hoặc xoá dữ liệu bằng cách liên hệ giáo viên chủ nhiệm hoặc quản trị viên website.
            </li>
          </DanhSach>
        </Muc>

        <Muc tieuDe="7. Thay đổi chính sách">
          <p>Khi chính sách thay đổi, chúng tôi cập nhật nội dung và ngày cập nhật trên trang này.</p>
        </Muc>

        <Muc tieuDe="8. Liên hệ">
          <p>Mọi câu hỏi về dữ liệu cá nhân, vui lòng liên hệ giáo viên chủ nhiệm hoặc quản trị viên website Digital Campus · GDTX Định Quán.</p>
        </Muc>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
        >
          <ArrowLeft className="size-4" />
          Về Digital Campus
        </Link>
      </article>
    </div>
  )
}
