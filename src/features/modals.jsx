const { useState, useEffect } = React;
import { formatTimeOnly } from '../lib/helpers.js';
import { Ic } from '../lib/icons.js';


// ─── AUTH MODAL (REGION 1 - PHASE 4B) ───────────────────────────────────────
export function AuthModal({ isOpen, initialTab = 'login', onClose, onSuccess }) {
  const [tab, setTab] = React.useState(initialTab);
  const [loginForm, setLoginForm] = React.useState({ username: '', password: '' });
  const [regForm, setRegForm] = React.useState({ hoTen: '', username: '', password: '', rePassword: '', loaiTaiKhoan: 'student' });
  const [dangXuLy, setDangXuLy] = React.useState(false);
  const [loi, setLoi] = React.useState('');
  const [thanhCong, setThanhCong] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setLoi('');
      setThanhCong('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (dangXuLy) return;
    setLoi('');
    setThanhCong('');
    const u = loginForm.username.trim();
    const p = loginForm.password;
    if (!u || !p) {
      setLoi('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }
    setDangXuLy(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });
      const d = await res.json();
      if (d.ok) {
        setThanhCong('Đăng nhập thành công!');
        if (onSuccess) await onSuccess(d);
        onClose();
      } else {
        setLoi(d.loi || d.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch {
      setLoi('Lỗi kết nối máy chủ. Thử lại sau.');
    } finally {
      setDangXuLy(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (dangXuLy) return;
    setLoi('');
    setThanhCong('');
    const ht = regForm.hoTen.trim();
    const u = regForm.username.trim();
    const p = regForm.password;
    const rp = regForm.rePassword;
    const lt = regForm.loaiTaiKhoan;

    if (!ht || !u || !p) {
      setLoi('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    if (p.length < 6) {
      setLoi('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (p !== rp) {
      setLoi('Mật khẩu xác nhận không khớp.');
      return;
    }

    setDangXuLy(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: ht, hoTen: ht, username: u, password: p, accountType: lt, loaiTaiKhoan: lt })
      });
      const d = await res.json();
      if (d.ok) {
        if (d.teacherPending) {
          setThanhCong('Đăng ký thành công! Yêu cầu tài khoản Giáo viên đang chờ duyệt từ quản trị viên trường.');
        } else {
          setThanhCong('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
        }
        setTab('login');
        setLoginForm({ username: u, password: '' });
      } else {
        setLoi(d.loi || d.message || 'Không thể đăng ký tài khoản.');
      }
    } catch {
      setLoi('Lỗi kết nối máy chủ. Thử lại sau.');
    } finally {
      setDangXuLy(false);
    }
  };

  return (
    <div id="modal-auth" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#151A23] border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scaleIn">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏫</span>
            <h3 className="text-base font-black text-white">Digital Campus</h3>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-all">
            ✕
          </button>
        </div>

        <div className="flex rounded-2xl bg-[#0D111A] p-1 mb-4 border border-white/5">
          <button
            type="button"
            id="tab-btn-login"
            onClick={() => { setTab('login'); setLoi(''); setThanhCong(''); }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${tab === 'login' ? 'bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black shadow-md' : 'text-slate-400 hover:text-white'}`}>
            Đăng nhập
          </button>
          <button
            type="button"
            id="tab-btn-register"
            onClick={() => { setTab('register'); setLoi(''); setThanhCong(''); }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${tab === 'register' ? 'bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black shadow-md' : 'text-slate-400 hover:text-white'}`}>
            Đăng ký
          </button>
        </div>

        {thanhCong && (
          <div className="p-3 mb-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold">
            {thanhCong}
          </div>
        )}
        {loi && (
          <div className="p-3 mb-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-bold">
            {loi}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Tên đăng nhập / Email:</label>
              <input
                type="text"
                id="input-login-username"
                value={loginForm.username}
                onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                placeholder="VD: minh_10a7"
                className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Mật khẩu:</label>
              <input
                type="password"
                id="input-login-password"
                value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              id="btn-submit-login"
              disabled={dangXuLy}
              className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-black text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all disabled:opacity-50">
              {dangXuLy ? 'Đang xác thực...' : 'Đăng nhập vào Campus'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Họ và tên / Tên hiển thị:</label>
              <input
                type="text"
                id="input-register-hoten"
                value={regForm.hoTen}
                onChange={e => setRegForm(f => ({ ...f, hoTen: e.target.value }))}
                placeholder="VD: Nguyễn Văn Minh"
                className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Tên đăng nhập:</label>
              <input
                type="text"
                id="input-register-username"
                value={regForm.username}
                onChange={e => setRegForm(f => ({ ...f, username: e.target.value }))}
                placeholder="VD: minh_nguyen"
                className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Mật khẩu:</label>
                <input
                  type="password"
                  id="input-register-password"
                  value={regForm.password}
                  onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="≥ 6 ký tự"
                  className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Nhập lại:</label>
                <input
                  type="password"
                  id="input-register-repassword"
                  value={regForm.rePassword}
                  onChange={e => setRegForm(f => ({ ...f, rePassword: e.target.value }))}
                  placeholder="Xác nhận"
                  className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Loại tài khoản:</label>
              <select
                id="select-register-role"
                value={regForm.loaiTaiKhoan}
                onChange={e => setRegForm(f => ({ ...f, loaiTaiKhoan: e.target.value }))}
                className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none">
                <option value="student">Học sinh</option>
                <option value="teacher">Giáo viên</option>
                <option value="external">Người dùng khác</option>
              </select>
            </div>
            {regForm.loaiTaiKhoan === 'teacher' && (
              <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-[11px] leading-relaxed">
                ⚠️ <strong>Lưu ý:</strong> Tài khoản Giáo viên sẽ ở trạng thái chờ duyệt. Quản trị viên/Giáo viên xác thực sẽ phê duyệt trước khi cấp quyền.
              </div>
            )}
            <button
              type="submit"
              id="btn-submit-register"
              disabled={dangXuLy}
              className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-black text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all disabled:opacity-50">
              {dangXuLy ? 'Đang đăng ký...' : 'Tạo tài khoản Campus'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── TEACHER ANNOUNCEMENTS COMPONENT (VÙNG 4 MỚI) ───────────────────────────
// ─── TEACHER ANNOUNCEMENTS COMPONENT (VÙNG 4 MỚI) ───────────────────────────
export function TeacherAnnouncements({
  announcements = [],
  permissions,
  quyen = {},
  onSoanTin,
  onOpenEditor,
  onSuaTin,
  onXoaTin,
  onDeleteAnnouncement,
  onDuyetTin,
  onApproveAnnouncement,
  onXemChiTiet,
  onSelectAnnouncement,
  onQuanLyMaMoi,
  onQuanLyBienTap
}) {
  const q = permissions || quyen || {};
  const handleSoan = onSoanTin || onOpenEditor;
  const handleSua = onSuaTin || onOpenEditor;
  const handleXoa = onXoaTin || onDeleteAnnouncement;
  const handleDuyet = onDuyetTin || onApproveAnnouncement;
  const handleXem = onXemChiTiet || onSelectAnnouncement;

  return (
    <div id="teacher-announcements" className="bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-sm">📢</span>
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Thông Báo Giáo Viên</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {q.laGiaoVien && (
            <>
              <button
                type="button"
                onClick={onQuanLyMaMoi}
                id="btn-quan-ly-ma-moi"
                title="Quản lý mã mời vào Bảng tin lớp"
                className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-[#00F2FE] border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1 transition-all">
                <span>🔑</span>
                <span className="hidden sm:inline">Mã mời</span>
              </button>
              <button
                type="button"
                onClick={onQuanLyBienTap}
                id="btn-quan-ly-bien-tap"
                title="Quản lý biên tập viên học sinh"
                className="px-2 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[10px] font-bold flex items-center gap-1 transition-all">
                <span>👥</span>
                <span className="hidden sm:inline">Biên tập</span>
              </button>
            </>
          )}
          {(q.laGiaoVien || q.laBienTapVien) && (
            <button
              type="button"
              onClick={() => handleSoan && handleSoan(null)}
              id="btn-soan-thong-bao"
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-black text-[10px] shadow-sm hover:scale-105 active:scale-95 transition-all">
              + Soạn tin
            </button>
          )}
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="py-6 px-3 text-center rounded-xl bg-white/[0.02] border border-white/5">
          <p className="text-xs text-slate-400">Chưa có thông báo mới từ giáo viên</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
          {announcements.map(tb => (
            <div key={tb.id}
              className={`p-3 rounded-xl border transition-all ${tb.ghim ? 'bg-gradient-to-br from-amber-500/10 via-[#0D111A] to-purple-500/10 border-amber-500/30 shadow-sm' : 'bg-[#0D111A]/80 border-white/5 hover:border-white/20'}`}>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tb.ghim === 1 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black flex items-center gap-1">
                      <span>📌</span>
                      <span>Ghim</span>
                    </span>
                  )}
                  {tb.loai === 'tin_khan' && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black">
                      🚨 Tin khẩn
                    </span>
                  )}
                  {tb.loai === 'lich_hoc' && (
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-black">
                      📅 Lịch học
                    </span>
                  )}
                  {tb.trangThai === 'pending_review' && (
                    <span className="px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[9px] font-black">
                      ⏳ Chờ duyệt
                    </span>
                  )}
                  {tb.trangThai === 'draft' && (
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/40 text-[9px] font-black">
                      📝 Nháp
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {tb.xuatBanLuc ? formatTimeOnly(tb.xuatBanLuc) : (tb.taoLuc ? formatTimeOnly(tb.taoLuc) : '')}
                </span>
              </div>

              <h4 onClick={() => handleXem && handleXem(tb)}
                className="text-xs font-bold text-white hover:text-[#00F2FE] cursor-pointer transition-colors leading-snug line-clamp-2 mb-1">
                {tb.tieuDe}
              </h4>

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                {tb.noiDung}
              </p>

              <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span>{tb.nguoiTaoVaiTro === 'teacher' ? '👨‍🏫 GVCN:' : '✍️ BBT:'}</span>
                  <span className="font-semibold text-slate-400">{tb.nguoiTaoTen}</span>
                </span>
                <div className="flex items-center gap-2">
                  {(q.laGiaoVien && tb.trangThai === 'pending_review') && (
                    <button
                      type="button"
                      id={`btn-duyet-bai-${tb.id}`}
                      onClick={() => handleDuyet(tb.id)}
                      className="text-[#00F2FE] hover:underline font-bold">
                      Duyệt
                    </button>
                  )}
                  {tb.coQuyenSua && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSua(tb)}
                        className="text-slate-400 hover:text-white font-medium">
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleXoa(tb.id)}
                        className="text-rose-400 hover:text-rose-300 font-medium">
                        Xoá
                      </button>
                    </>
                  )}

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PERSONAL QUICK ACCESS COMPONENT (VÙNG 1 GỘP VÀO 1X) ─────────────────────
export function PersonalQuickAccess({
  auth,
  categoryFilter,
  setCategoryFilter,
  phongDangHotCount = 0,
  onOpenGamification,
  onOpenAvatar,
  navigateTab
}) {
  return (
    <div id="personal-quick-access" className="bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-sm">🧭</span>
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Lối Tắt & Cá Nhân</h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">10A7 Hub</span>
      </div>

      {/* A. ĐIỀU HƯỚNG CÁ NHÂN (VÙNG 1 ĐÃ GỘP) */}
      <div className="flex flex-col gap-1">
        <button onClick={() => setCategoryFilter('ALL')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${categoryFilter === 'ALL' ? 'bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <div className="flex items-center gap-2.5">
            <Ic name="home" className="w-4 h-4" />
            <span>Trang chủ Campus</span>
          </div>
          <span className="text-[10px] text-slate-500">Tất cả</span>
        </button>

        <button onClick={() => setCategoryFilter('HOT')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${categoryFilter === 'HOT' ? 'bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <div className="flex items-center gap-2.5">
            <Ic name="sparkles" className="w-4 h-4 text-[#00F2FE]" />
            <span>Sôi động</span>
          </div>
          {phongDangHotCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-[#00F2FE] text-[10px] font-black">
              {phongDangHotCount}
            </span>
          )}
        </button>

        <button onClick={onOpenGamification}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-slate-300 hover:bg-white/5 hover:text-white">
          <div className="flex items-center gap-2.5">
            <Ic name="trophy" className="w-4 h-4 text-amber-400" />
            <span>Thành tựu & Vinh danh</span>
          </div>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black">
            TOP BXH
          </span>
        </button>
      </div>

      {/* B. TIỆN ÍCH CÁ NHÂN */}
      <div className="pt-2 border-t border-white/5 flex flex-col gap-1">
        <p className="text-[10px] uppercase font-black tracking-wider text-slate-500 px-1 mb-1">TIỆN ÍCH LỚP HỌC</p>

        {!auth.isGuest ? (
          <>
            <button onClick={onOpenAvatar}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all">
              <div className="flex items-center gap-2.5">
                <span>🎨</span>
                <span>Hồ sơ & Đổi Avatar</span>
              </div>
              <span className="text-slate-500 text-xs">›</span>
            </button>

            <button onClick={() => navigateTab('feed', 'diem-danh')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all">
              <div className="flex items-center gap-2.5">
                <span>📊</span>
                <span>Chuyên cần & Điểm danh</span>
              </div>
              <span className="text-slate-500 text-xs">›</span>
            </button>

            <button onClick={() => navigateTab('feed', 'thu-quy')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all">
              <div className="flex items-center gap-2.5">
                <span>💰</span>
                <span>Sổ quỹ lớp 10A7</span>
              </div>
              <span className="text-slate-500 text-xs">›</span>
            </button>

            <button onClick={() => navigateTab('feed', 'so-tay')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all">
              <div className="flex items-center gap-2.5">
                <span>📖</span>
                <span>Sổ tay nội quy</span>
              </div>
              <span className="text-slate-500 text-xs">›</span>
            </button>
          </>
        ) : (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-[11px] text-slate-400 mb-2">Đăng nhập để xem điểm danh & quỹ lớp</p>
            <a href="/login.html"
              className="inline-block w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-extrabold text-xs shadow-sm hover:opacity-95 transition-all">
              Đăng nhập tài khoản
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMMUNITY BOARD GATE MODAL (MÃ TRUY CẬP - PHASE 4A.1) ─────────────────
export function CommunityBoardGateModal({ isOpen, onClose, onSuccess, onDirectLogin }) {
  const [maCode, setMaCode] = useState('');
  const [dangKiemTra, setDangKiemTra] = useState(false);
  const [loi, setLoi] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!maCode.trim() || dangKiemTra) return;
    setDangKiemTra(true);
    setLoi('');

    try {
      const res = await fetch('/api/kiem-tra-ma-cong-dong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maCode: maCode.trim() })
      });
      const d = await res.json();
      if (d.ok && d.daThanhVien) {
        await onSuccess(d);
      } else {
        setLoi(d.loi || 'Mã truy cập không chính xác hoặc không thuộc tài khoản của em.');
      }
    } catch {
      setLoi('Không thể kiểm tra mã lúc này. Thử lại sau.');
    } finally {
      setDangKiemTra(false);
    }
  };

  return (
    <div id="modal-community-gate" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#151A23] border border-cyan-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scaleIn">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00F2FE] to-[#8B5CF6] flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg">
          🔐
        </div>
        <h3 className="text-base font-black text-white text-center mb-1">Truy Cập Bảng Tin Cộng Đồng</h3>
        <p className="text-xs text-slate-300 text-center mb-5 leading-relaxed">
          Bảng tin cộng đồng lớp 10A7 là không gian nội bộ dành riêng cho lớp. Vui lòng nhập mã truy cập do giáo viên cấp riêng để kích hoạt quyền thành viên.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Mã truy cập giáo viên cấp riêng:</label>
            <input
              type="text"
              id="input-community-gate-code"
              data-id="input-ma-truy-cap"
              value={maCode}
              onChange={e => { setMaCode(e.target.value.toUpperCase()); setLoi(''); }}
              placeholder="VD: A7-K9QP-X4T2"
              className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase tracking-wider focus:outline-none"
              autoFocus
            />
          </div>

          {loi && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-center">
              {loi}
            </p>
          )}

          <button
            type="submit"
            id="btn-submit-community-gate"
            data-id="btn-xac-nhan-ma-cong-dong"
            disabled={dangKiemTra || !maCode.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-extrabold text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all disabled:opacity-40"
          >
            {dangKiemTra ? 'Đang kích hoạt...' : 'Kích hoạt quyền thành viên →'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <button onClick={onDirectLogin} className="text-[#00F2FE] hover:underline font-bold">
            Đăng nhập tài khoản
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TEACHER ACCESS CODE MODAL (PHASE 4A.1) ──────────────────────────────────
export function TeacherAccessCodeModal({ isOpen, onClose, hocSinhList = [] }) {
  const [tab, setTab] = useState('danh_sach'); // 'danh_sach' | 'tao_moi' | 'thanh_vien'
  const [danhSachMa, setDanhSachMa] = useState([]);
  const [thanhVien, setThanhVien] = useState([]);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState('');
  const [thongBao, setThongBao] = useState('');

  // Form tạo mới
  const [targetHocSinhId, setTargetHocSinhId] = useState('');
  const [tenGoi, setTenGoi] = useState('');
  const [soNgayHetHan, setSoNgayHetHan] = useState('7');
  const [maMoiTao, setMaMoiTao] = useState(null);
  const [dangTao, setDangTao] = useState(false);
  const [daCopy, setDaCopy] = useState(false);

  const taiDuLieu = async () => {
    setDangTai(true);
    try {
      const res = await fetch('/api/gv/ma-cong-dong');
      const d = await res.json();
      if (d.ok) {
        setDanhSachMa(d.danhSachMa || []);
        setThanhVien(d.thanhVien || []);
      } else {
        setLoi(d.loi || 'Không thể tải dữ liệu mã mời.');
      }
    } catch {
      setLoi('Không thể tải dữ liệu mã mời.');
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoi('');
      setThongBao('');
      setMaMoiTao(null);
      setDaCopy(false);
      taiDuLieu();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTaoMa = async (e) => {
    e.preventDefault();
    setDangTao(true);
    setLoi('');
    setThongBao('');
    try {
      const res = await fetch('/api/gv/ma-cong-dong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hanhDong: 'tao_ma',
          hocSinhId: targetHocSinhId ? Number(targetHocSinhId) : null,
          tenGoi: tenGoi.trim() || undefined,
          soNgayHetHan: Number(soNgayHetHan) || 7,
          soLanDungToiDa: 1
        })
      });
      const d = await res.json();
      if (d.ok) {
        setMaMoiTao(d);
        setThongBao(d.thongBao);
        taiDuLieu();
      } else {
        setLoi(d.loi || 'Không thể tạo mã mời.');
      }
    } catch {
      setLoi('Lỗi máy chủ khi tạo mã mời.');
    } finally {
      setDangTao(false);
    }
  };

  const handleThuHoiMa = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi mã mời này không? Mã sẽ bị vô hiệu hóa ngay lập tức.')) return;
    try {
      const res = await fetch('/api/gv/ma-cong-dong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'thu_hoi_ma', id })
      });
      const d = await res.json();
      if (d.ok) {
        taiDuLieu();
      } else {
        alert(d.loi || 'Không thể thu hồi mã.');
      }
    } catch {
      alert('Lỗi kết nối khi thu hồi mã.');
    }
  };

  const handleThuHoiThanhVien = async (hocSinhId, tenHs) => {
    if (!confirm(`Bạn có chắc chắn muốn thu hồi quyền thành viên Bảng tin của em ${tenHs}?`)) return;
    try {
      const res = await fetch('/api/gv/ma-cong-dong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'thu_hoi_thanh_vien', hocSinhId })
      });
      const d = await res.json();
      if (d.ok) {
        taiDuLieu();
      } else {
        alert(d.loi || 'Không thể thu hồi quyền thành viên.');
      }
    } catch {
      alert('Lỗi kết nối khi thu hồi quyền thành viên.');
    }
  };

  const copyMa = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setDaCopy(true);
      setTimeout(() => setDaCopy(false), 2500);
    }
  };

  return (
    <div id="modal-teacher-access-codes" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#151A23] border border-cyan-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#181F2C]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔑</span>
            <div>
              <h3 className="text-sm font-black text-white">Quản Lý Mã Mời Bảng Tin Cộng Đồng</h3>
              <p className="text-[10px] text-slate-400">Cấp mã riêng từng học sinh & quản lý thành viên lớp</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all">
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-2 px-5 pt-3 pb-2 border-b border-white/10 bg-[#10141D]">
          <button
            onClick={() => { setTab('danh_sach'); setMaMoiTao(null); }}
            id="tab-btn-codes-list"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${tab === 'danh_sach' ? 'bg-[#00F2FE] text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}>
            📋 Danh sách mã ({danhSachMa.length})
          </button>
          <button
            onClick={() => setTab('tao_moi')}
            id="tab-btn-codes-create"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${tab === 'tao_moi' ? 'bg-[#00F2FE] text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}>
            ✨ Tạo mã mời mới
          </button>
          <button
            onClick={() => { setTab('thanh_vien'); setMaMoiTao(null); }}
            id="tab-btn-codes-members"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${tab === 'thanh_vien' ? 'bg-[#00F2FE] text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}>
            👥 Thành viên Bảng tin ({thanhVien.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'tao_moi' ? (
            <div>
              {maMoiTao ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-[#0E131E] to-purple-500/15 border border-cyan-500/40 text-center animate-fadeIn">
                  <div className="text-2xl mb-2">🎉</div>
                  <h4 className="text-sm font-black text-white mb-1">Mã Mời Đã Được Tạo Thành Công!</h4>
                  <p className="text-xs text-slate-300 mb-4">
                    {maMoiTao.hocSinhTen ? `Cấp riêng cho: ${maMoiTao.hocSinhTen}` : 'Mã chung cho lớp'}
                  </p>
                  <div className="inline-flex max-w-full flex-wrap justify-center items-center gap-3 bg-[#0B0E14] border border-cyan-400/40 rounded-2xl px-5 py-3 mb-4 shadow-inner">
                    <span className="min-w-0 break-all font-mono text-sm sm:text-xl font-black text-[#00F2FE]">
                      {maMoiTao.maCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyMa(maMoiTao.maCode)}
                      id="btn-copy-new-invite-code"
                      className="px-3 py-1.5 rounded-xl bg-[#00F2FE] text-black text-xs font-black hover:opacity-90 active:scale-95 transition-all">
                      {daCopy ? '✓ Đã chép' : '📋 Sao chép'}
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-300 font-medium max-w-md mx-auto leading-relaxed">
                    ⚠️ Lưu ý: Vì lý do an toàn, mã bí mật chỉ hiển thị đầy đủ 1 lần duy nhất tại đây. Hãy sao chép và gửi trực tiếp cho học sinh!
                  </p>
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => { setMaMoiTao(null); setTab('danh_sach'); }}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-all">
                      ← Xem danh sách mã đã cấp
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleTaoMa} className="flex flex-col gap-4 max-w-md mx-auto">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Chọn học sinh được cấp mã:
                    </label>
                    <select
                      id="select-invite-target-student"
                      required
                      value={targetHocSinhId}
                      onChange={e => setTargetHocSinhId(e.target.value)}
                      className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none">
                      <option value="">-- Chọn học sinh --</option>
                      {hocSinhList.map(hs => (
                        <option key={hs.id} value={hs.id}>
                          {hs.soThuTu ? `${hs.soThuTu}. ` : ''}{hs.hoTen}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Tên gợi nhớ (Tùy chọn):
                    </label>
                    <input
                      type="text"
                      value={tenGoi}
                      onChange={e => setTenGoi(e.target.value)}
                      placeholder="VD: Mã mời em Nguyễn Văn A"
                      className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Thời hạn sử dụng mã:
                    </label>
                    <select
                      value={soNgayHetHan}
                      onChange={e => setSoNgayHetHan(e.target.value)}
                      className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none">
                      <option value="1">1 ngày</option>
                      <option value="3">3 ngày</option>
                      <option value="7">7 ngày (Khuyến nghị)</option>
                      <option value="30">30 ngày</option>
                    </select>
                  </div>

                  {loi && (
                    <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-center">
                      {loi}
                    </p>
                  )}

                  <button
                    type="submit"
                    id="btn-submit-create-invite-code"
                    disabled={dangTao || !targetHocSinhId}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-black text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 mt-2">
                    {dangTao ? 'Đang tạo mã...' : 'Tạo mã mời'}
                  </button>
                </form>
              )}
            </div>
          ) : tab === 'thanh_vien' ? (
            /* TAB THÀNH VIÊN */
            <div>
              {thanhVien.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Chưa có học sinh nào kích hoạt quyền thành viên Bảng tin.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {thanhVien.map(tv => (
                    <div key={tv.id} className="p-3 rounded-xl bg-[#0B0E14] border border-white/5 flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white">
                          {tv.soThuTu ? `${tv.soThuTu}. ` : ''}{tv.hoTen}
                        </h5>
                        <p className="text-[10px] text-slate-400">
                          Kích hoạt: {tv.grantedAt ? new Date(tv.grantedAt).toLocaleString('vi-VN') : 'Không rõ'}
                          {tv.maHienThi ? ` · Qua mã: ${tv.maHienThi}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleThuHoiThanhVien(tv.hocSinhId, tv.hoTen)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-bold transition-all">
                        Thu hồi quyền
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* TAB DANH SÁCH MÃ */
            <div>
              {dangTai ? (
                <div className="py-8 text-center text-xs text-slate-400">Đang tải danh sách mã...</div>
              ) : danhSachMa.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-slate-400 mb-3">Chưa có mã mời nào được tạo cho lớp.</p>
                  <button
                    onClick={() => setTab('tao_moi')}
                    className="px-3 py-1.5 rounded-xl bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40 text-xs font-bold">
                    + Tạo mã mời đầu tiên
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {danhSachMa.map(m => (
                    <div key={m.id} className="p-3 rounded-xl bg-[#0B0E14] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs font-black text-cyan-300">
                            {m.maHienThi || 'MÃ-BẢO-MẬT'}
                          </span>
                          {m.trangThai === 'chua_dung' && (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold">
                              Chưa dùng
                            </span>
                          )}
                          {m.trangThai === 'da_dung' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                              Đã kích hoạt {m.daDungBoiHocSinhTen ? `(${m.daDungBoiHocSinhTen})` : ''}
                            </span>
                          )}
                          {m.trangThai === 'het_han' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                              Đã hết hạn
                            </span>
                          )}
                          {m.trangThai === 'thu_hoi' && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30 text-[9px] font-bold">
                              Đã thu hồi
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium">
                          {m.tenGoi || (m.hocSinhTen ? `Mã mời em ${m.hocSinhTen}` : 'Mã mời')}
                          {m.hocSinhTen ? <span className="text-[#00F2FE]"> (Dành riêng cho: {m.hocSinhTen})</span> : ''}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Tạo: {m.taoLuc ? new Date(m.taoLuc).toLocaleDateString('vi-VN') : ''}
                          {m.hetHanLuc ? ` · Hạn: ${new Date(m.hetHanLuc).toLocaleDateString('vi-VN')}` : ' · Không hết hạn'}
                          {` · Lượt: ${m.soLanDaDung}/${m.soLanDungToiDa}`}
                        </p>
                      </div>

                      {m.hocSinhId && (
                        <button type="button" onClick={() => {
                          setTargetHocSinhId(String(m.hocSinhId));
                          setMaMoiTao(null);
                          setTab('tao_moi');
                        }} className="px-2.5 py-2 text-xs text-cyan-300 self-start">
                          Cấp lại mã
                        </button>
                      )}
                      {m.dangHoatDong === 1 && m.trangThai === 'chua_dung' && (
                        <button
                          type="button"
                          onClick={() => handleThuHoiMa(m.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-bold self-start sm:self-center transition-all">
                          Thu hồi mã
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TEACHER STUDENT EDITOR MODAL (PHASE 4A.1) ───────────────────────────────
export function TeacherEditorModal({ isOpen, onClose, hocSinhList = [] }) {
  const [danhSachBtv, setDanhSachBtv] = useState([]);
  const [selectedHocSinhId, setSelectedHocSinhId] = useState('');
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState('');
  const [thongBao, setThongBao] = useState('');

  const taiDuLieu = async () => {
    setDangTai(true);
    try {
      const res = await fetch('/api/gv/bien-tap-vien');
      const d = await res.json();
      if (d.ok) setDanhSachBtv(d.bienTapVien || []);
      else setLoi(d.loi || 'Không tải được danh sách biên tập viên.');
    } catch {
      setLoi('Không tải được danh sách biên tập viên.');
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoi('');
      setThongBao('');
      setSelectedHocSinhId('');
      taiDuLieu();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCapQuyen = async (e) => {
    e.preventDefault();
    if (!selectedHocSinhId) return;
    setLoi('');
    setThongBao('');
    try {
      const res = await fetch('/api/gv/bien-tap-vien', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'cap_quyen', hocSinhId: Number(selectedHocSinhId) })
      });
      const d = await res.json();
      if (d.ok) {
        setThongBao(d.thongBao);
        setSelectedHocSinhId('');
        taiDuLieu();
      } else {
        setLoi(d.loi || 'Không thể cấp quyền.');
      }
    } catch {
      setLoi('Lỗi khi cấp quyền biên tập viên.');
    }
  };

  const handleThuHoi = async (hocSinhId, tenHs) => {
    if (!confirm(`Bạn có chắc chắn muốn thu hồi quyền biên tập viên của em ${tenHs}?`)) return;
    try {
      const res = await fetch('/api/gv/bien-tap-vien', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'thu_hoi', hocSinhId })
      });
      const d = await res.json();
      if (d.ok) {
        taiDuLieu();
      } else {
        alert(d.loi || 'Không thể thu hồi quyền.');
      }
    } catch {
      alert('Lỗi kết nối khi thu hồi quyền.');
    }
  };

  return (
    <div id="modal-teacher-editor-management" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#151A23] border border-purple-500/30 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#181F2C]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">👥</span>
            <div>
              <h3 className="text-sm font-black text-white">Quản Lý Biên Tập Viên Học Sinh</h3>
              <p className="text-[10px] text-slate-400">Ủy quyền học sinh viết bài nháp & gửi giáo viên duyệt</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Cấp quyền mới */}
          <form onSubmit={handleCapQuyen} className="p-4 rounded-2xl bg-[#0B0E14] border border-white/10 flex flex-col gap-2.5">
            <label className="text-xs font-bold text-white block">
              + Chọn học sinh trong lớp để cấp quyền:
            </label>
            <div className="flex gap-2">
              <select
                id="select-editor-target-student"
                value={selectedHocSinhId}
                onChange={e => setSelectedHocSinhId(e.target.value)}
                className="flex-1 bg-[#151A23] border border-white/15 focus:border-purple-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                <option value="">-- Chọn học sinh --</option>
                {hocSinhList.map(hs => (
                  <option key={hs.id} value={hs.id}>
                    {hs.soThuTu ? `${hs.soThuTu}. ` : ''}{hs.hoTen}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                id="btn-submit-grant-editor"
                disabled={!selectedHocSinhId}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-md disabled:opacity-40 transition-all shrink-0">
                Cấp quyền
              </button>
            </div>
            {thongBao && <p className="text-[11px] text-emerald-400">{thongBao}</p>}
            {loi && <p className="text-[11px] text-rose-400">{loi}</p>}
          </form>

          {/* Danh sách hiện tại */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              Danh sách biên tập viên ({danhSachBtv.length})
            </h4>
            {dangTai ? (
              <p className="text-xs text-slate-400 text-center py-4">Đang tải...</p>
            ) : danhSachBtv.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Chưa có học sinh nào được cấp quyền biên tập.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {danhSachBtv.map(b => (
                  <div key={b.hocSinhId} className="p-3 rounded-xl bg-[#0B0E14] border border-white/5 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white">
                        {b.soThuTu ? `${b.soThuTu}. ` : ''}{b.hoTen}
                      </h5>
                      <span className="text-[10px] text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded-md font-medium">
                        Soạn nháp & gửi duyệt
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleThuHoi(b.hocSinhId, b.hoTen)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-bold transition-all">
                      Thu hồi
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CONTENT EDITOR & PREVIEW MODAL ──────────────────────────────────────────
export function ContentEditorModal({
  isOpen,
  onClose,
  initialData = null,
  quyen = {},
  isTeacher = false,
  onSaveSuccess,
  onSuccess
}) {
  const isGiaoVien = (quyen && quyen.laGiaoVien) || isTeacher;
  const quyenMerged = { ...quyen, laGiaoVien: isGiaoVien };
  const handleSaveDone = onSaveSuccess || onSuccess;

  const [tab, setTab] = useState('edit'); // 'edit' | 'preview'
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile' | 'card'

  const [tieuDe, setTieuDe] = useState('');
  const [noiDung, setNoiDung] = useState('');
  const [anhBia, setAnhBia] = useState('');
  const [loai, setLoai] = useState('thong_bao');
  const [phamVi, setPhamVi] = useState('toan_truong');
  const [ghim, setGhim] = useState(false);
  const [uuTien, setUuTien] = useState(0);
  const [dangLuu, setDangLuu] = useState(false);
  const [thongBaoLoi, setThongBaoLoi] = useState('');

  useEffect(() => {
    if (initialData) {
      setTieuDe(initialData.tieuDe || '');
      setNoiDung(initialData.noiDung || '');
      setAnhBia(initialData.anhBia || '');
      setLoai(initialData.loai || 'thong_bao');
      setPhamVi(initialData.phamVi || 'toan_truong');
      setGhim(initialData.ghim === 1);
      setUuTien(initialData.uuTien || 0);
    } else {
      setTieuDe('');
      setNoiDung('');
      setAnhBia('');
      setLoai('thong_bao');
      setPhamVi('toan_truong');
      setGhim(false);
      setUuTien(0);
    }
    setTab('edit');
    setThongBaoLoi('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleLuu = async (trangThaiMongMuon) => {
    if (!tieuDe.trim()) {
      setThongBaoLoi('Vui lòng nhập tiêu đề thông báo.');
      return;
    }
    if (!noiDung.trim()) {
      setThongBaoLoi('Vui lòng nhập nội dung thông báo.');
      return;
    }

    setDangLuu(true);
    setThongBaoLoi('');

    try {
      const payload = {
        id: initialData?.id,
        tieuDe: tieuDe.trim(),
        noiDung: noiDung.trim(),
        anhBia: anhBia.trim() || null,
        loai,
        phamVi,
        ghim: isGiaoVien ? (ghim ? 1 : 0) : 0,
        uuTien: isGiaoVien ? Number(uuTien) : 0,
        trangThai: trangThaiMongMuon
      };

      const res = await fetch('/api/campus-thong-bao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (d.ok) {
        if (handleSaveDone) handleSaveDone(d);
        onClose();
      } else {
        setThongBaoLoi(d.loi || 'Không thể lưu thông báo.');
      }
    } catch {
      setThongBaoLoi('Lỗi kết nối máy chủ. Thử lại sau.');
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <div id="content-editor-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-[#151A23] border border-white/20 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#181F2C]">
          <div className="flex items-center gap-3">
            <span className="text-xl">✍️</span>
            <div>
              <h3 className="text-sm font-black text-white">
                {initialData ? 'Chỉnh Sửa Thông Báo' : 'Soạn Thảo Thông Báo Mới'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {isGiaoVien ? 'Quyền Giáo Viên / Quản trị viên' : 'Quyền Biên Tập Viên Học Sinh'}
              </p>
            </div>
          </div>

          {/* Edit / Preview Segmented Switcher */}
          <div className="flex items-center bg-[#0B0E14] border border-white/10 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setTab('edit')}
              id="tab-btn-editor-edit"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'edit' ? 'bg-[#00F2FE] text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              ✍️ Soạn thảo
            </button>
            <button
              type="button"
              onClick={() => { setTab('preview'); setPreviewDevice('desktop'); }}
              id="tab-preview-desktop"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'preview' && previewDevice === 'desktop' ? 'bg-[#00F2FE] text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              🖥️ Desktop
            </button>
            <button
              type="button"
              onClick={() => { setTab('preview'); setPreviewDevice('mobile'); }}
              id="tab-preview-mobile"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'preview' && previewDevice === 'mobile' ? 'bg-[#00F2FE] text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              📱 Mobile
            </button>
            <button
              type="button"
              onClick={() => { setTab('preview'); setPreviewDevice('card'); }}
              id="tab-preview-card"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'preview' && previewDevice === 'card' ? 'bg-[#00F2FE] text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              📇 Thẻ
            </button>
          </div>

          <button type="button" onClick={onClose}
            id="btn-dong-editor-modal"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'edit' ? (
            /* EDIT FORM */
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tiêu đề thông báo <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  id="input-editor-tieu-de"
                  value={tieuDe}
                  onChange={e => setTieuDe(e.target.value)}
                  placeholder="VD: Lịch thi học kỳ 1 và kế hoạch ôn tập"
                  className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Loại nội dung</label>
                  <select
                    id="select-editor-loai"
                    value={loai}
                    onChange={e => setLoai(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none">
                    <option value="thong_bao">📢 Thông báo chính thức</option>
                    <option value="tin_khan">🚨 Tin khẩn cấp</option>
                    <option value="lich_hoc">📅 Lịch học / Kiểm tra</option>
                    <option value="nhac_nho">⏰ Lời nhắc nhở nộp bài</option>
                    <option value="noi_quy">📖 Nội quy cập nhật</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Phạm vi hiển thị</label>
                  <select
                    id="select-editor-pham-vi"
                    value={phamVi}
                    onChange={e => setPhamVi(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none">
                    <option value="toan_truong">🌐 Toàn trường (Digital Campus)</option>
                    <option value="lop">🏫 Lớp 10A7 (Bảng tin nội bộ)</option>
                    <option value="cong_dong">👥 Cộng đồng liên quan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Link ảnh bìa / minh hoạ (tùy chọn)</label>
                <input
                  type="text"
                  id="input-editor-anh-bia"
                  value={anhBia}
                  onChange={e => setAnhBia(e.target.value)}
                  placeholder="https://... hoặc /assets/..."
                  className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nội dung chi tiết <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="textarea-editor-noi-dung"
                  rows={6}
                  value={noiDung}
                  onChange={e => setNoiDung(e.target.value)}
                  placeholder="Nhập nội dung đầy đủ của thông báo..."
                  className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl p-3.5 text-xs sm:text-sm text-white focus:outline-none leading-relaxed"
                />
              </div>

              {quyen.laGiaoVien && (
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="checkbox-editor-ghim"
                      checked={ghim}
                      onChange={e => setGhim(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00F2FE] focus:ring-0 bg-[#0B0E14] border-white/20"
                    />
                    <span className="text-xs font-bold text-amber-300">📌 Ghim lên đầu mục thông báo</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Ưu tiên hiển thị trên cùng</span>
                </div>
              )}

              {thongBaoLoi && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-center">
                  {thongBaoLoi}
                </p>
              )}
            </div>
          ) : (
            /* PREVIEW MODE */
            <div className="flex flex-col gap-4">
              {/* Preview Device Selectors */}
              <div className="flex items-center justify-center gap-2 pb-3 border-b border-white/10">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${previewDevice === 'desktop' ? 'bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40' : 'text-slate-400 hover:text-white'}`}>
                  🖥️ Máy tính (Desktop)
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${previewDevice === 'mobile' ? 'bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40' : 'text-slate-400 hover:text-white'}`}>
                  📱 Điện thoại (390px)
                </button>
                <button
                  onClick={() => setPreviewDevice('card')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${previewDevice === 'card' ? 'bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40' : 'text-slate-400 hover:text-white'}`}>
                  📇 Thẻ danh sách (Card)
                </button>
              </div>

              {/* Live Preview Screen Container */}
              <div className="flex justify-center p-2 bg-black/40 rounded-2xl">
                {previewDevice === 'card' ? (
                  /* CARD PREVIEW */
                  <div className="w-full max-w-sm p-4 rounded-xl bg-[#0D111A] border border-white/10 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {ghim && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-black">
                            📌 Ghim
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 rounded-full bg-[#00F2FE]/20 text-[#00F2FE] text-[9px] font-black">
                          {loai === 'tin_khan' ? '🚨 Tin khẩn' : (loai === 'lich_hoc' ? '📅 Lịch học' : '📢 Thông báo')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Vừa xong</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1.5 line-clamp-2">
                      {tieuDe || 'Tiêu đề thông báo mẫu'}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed mb-2">
                      {noiDung || 'Nội dung thông báo sẽ xuất hiện ở đây sau khi bạn nhập liệu.'}
                    </p>
                    <div className="pt-2 border-t border-white/5 text-[10px] text-slate-500 flex justify-between">
                      <span>{quyen.laGiaoVien ? '👨‍🏫 GVCN' : '✍️ Ban Biên Tập'}</span>
                      <span className="text-[#00F2FE]">Xem chi tiết →</span>
                    </div>
                  </div>
                ) : (
                  /* FULL PREVIEW (Desktop or Mobile) */
                  <div
                    className={`bg-[#151A23] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${previewDevice === 'mobile' ? 'w-[390px] p-4 text-xs' : 'w-full p-6 text-sm'}`}>
                    {anhBia && (
                      <div className="mb-4 rounded-xl overflow-hidden max-h-48 border border-white/10">
                        <img src={anhBia} alt="Banner" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {ghim && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                          📌 GHIM TRÊN CÙNG
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black">
                        {loai === 'tin_khan' ? '🚨 TIN KHẨN' : (loai === 'lich_hoc' ? '📅 LỊCH HỌC / THI' : '📢 THÔNG BÁO CHÍNH THỨC')}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Phạm vi: {phamVi === 'toan_truong' ? 'Toàn trường' : 'Lớp 10A7'}
                      </span>
                    </div>

                    <h2 className={`font-black text-white leading-snug mb-3 ${previewDevice === 'mobile' ? 'text-sm' : 'text-lg'}`}>
                      {tieuDe || 'Tiêu đề thông báo mẫu'}
                    </h2>

                    <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10 text-xs text-slate-400">
                      <span className="font-semibold text-[#00F2FE]">
                        {quyen.laGiaoVien ? '👨‍🏫 Giáo Viên Chủ Nhiệm' : '✍️ Biên Tập Viên Học Sinh'}
                      </span>
                      <span>•</span>
                      <span>Hôm nay</span>
                    </div>

                    <div className="text-slate-300 leading-relaxed whitespace-pre-line">
                      {noiDung || 'Nội dung thông báo sẽ xuất hiện chi tiết ở đây.'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-white/10 bg-[#181F2C]">
          <div className="text-[11px] text-slate-400">
            {quyen.laGiaoVien
              ? '✨ Bạn có quyền xuất bản trực tiếp ngay lập tức.'
              : (quyen.duocPhepDang
                ? '✨ Bạn đã được giáo viên cấp quyền đăng trực tiếp.'
                : '⏳ Bản thảo của bạn sẽ được gửi giáo viên duyệt trước khi xuất bản.')}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleLuu('draft')}
              id="btn-editor-luu-nhap"
              disabled={dangLuu}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-all disabled:opacity-50">
              Lưu bản nháp
            </button>

            {quyen.laGiaoVien || quyen.duocPhepDang ? (
              <button
                onClick={() => handleLuu('published')}
                id="btn-editor-xuat-ban"
                disabled={dangLuu}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black text-xs font-black shadow-lg hover:opacity-95 active:scale-95 transition-all disabled:opacity-50">
                {dangLuu ? 'Đang lưu...' : 'Xuất bản ngay →'}
              </button>
            ) : (
              <button
                onClick={() => handleLuu('pending_review')}
                id="btn-editor-gui-duyet"
                disabled={dangLuu}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-black shadow-lg hover:opacity-95 active:scale-95 transition-all disabled:opacity-50">
                {dangLuu ? 'Đang gửi...' : 'Gửi giáo viên duyệt →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
