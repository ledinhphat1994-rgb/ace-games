const { useState } = React;


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
