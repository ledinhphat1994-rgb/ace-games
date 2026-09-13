// GEN TU src/features/modals.jsx — KHONG SUA TAY
const { useState } = React;
export function AuthModal({ isOpen, initialTab = "login", onClose, onSuccess }) {
  const [tab, setTab] = React.useState(initialTab);
  const [loginForm, setLoginForm] = React.useState({ username: "", password: "" });
  const [regForm, setRegForm] = React.useState({ hoTen: "", username: "", password: "", rePassword: "", loaiTaiKhoan: "student" });
  const [dangXuLy, setDangXuLy] = React.useState(false);
  const [loi, setLoi] = React.useState("");
  const [thanhCong, setThanhCong] = React.useState("");
  React.useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setLoi("");
      setThanhCong("");
    }
  }, [isOpen, initialTab]);
  if (!isOpen) return null;
  const handleLogin = async (e) => {
    e.preventDefault();
    if (dangXuLy) return;
    setLoi("");
    setThanhCong("");
    const u = loginForm.username.trim();
    const p = loginForm.password;
    if (!u || !p) {
      setLoi("Vui l\xF2ng nh\u1EADp \u0111\u1EA7y \u0111\u1EE7 t\xEAn \u0111\u0103ng nh\u1EADp v\xE0 m\u1EADt kh\u1EA9u.");
      return;
    }
    setDangXuLy(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p })
      });
      const d = await res.json();
      if (d.ok) {
        setThanhCong("\u0110\u0103ng nh\u1EADp th\xE0nh c\xF4ng!");
        if (onSuccess) await onSuccess(d);
        onClose();
      } else {
        setLoi(d.loi || d.message || "T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c.");
      }
    } catch {
      setLoi("L\u1ED7i k\u1EBFt n\u1ED1i m\xE1y ch\u1EE7. Th\u1EED l\u1EA1i sau.");
    } finally {
      setDangXuLy(false);
    }
  };
  const handleRegister = async (e) => {
    e.preventDefault();
    if (dangXuLy) return;
    setLoi("");
    setThanhCong("");
    const ht = regForm.hoTen.trim();
    const u = regForm.username.trim();
    const p = regForm.password;
    const rp = regForm.rePassword;
    const lt = regForm.loaiTaiKhoan;
    if (!ht || !u || !p) {
      setLoi("Vui l\xF2ng \u0111i\u1EC1n \u0111\u1EA7y \u0111\u1EE7 c\xE1c th\xF4ng tin b\u1EAFt bu\u1ED9c.");
      return;
    }
    if (p.length < 6) {
      setLoi("M\u1EADt kh\u1EA9u ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1.");
      return;
    }
    if (p !== rp) {
      setLoi("M\u1EADt kh\u1EA9u x\xE1c nh\u1EADn kh\xF4ng kh\u1EDBp.");
      return;
    }
    setDangXuLy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: ht, hoTen: ht, username: u, password: p, accountType: lt, loaiTaiKhoan: lt })
      });
      const d = await res.json();
      if (d.ok) {
        if (d.teacherPending) {
          setThanhCong("\u0110\u0103ng k\xFD th\xE0nh c\xF4ng! Y\xEAu c\u1EA7u t\xE0i kho\u1EA3n Gi\xE1o vi\xEAn \u0111ang ch\u1EDD duy\u1EC7t t\u1EEB qu\u1EA3n tr\u1ECB vi\xEAn tr\u01B0\u1EDDng.");
        } else {
          setThanhCong("\u0110\u0103ng k\xFD t\xE0i kho\u1EA3n th\xE0nh c\xF4ng! B\u1EA1n c\xF3 th\u1EC3 \u0111\u0103ng nh\u1EADp ngay.");
        }
        setTab("login");
        setLoginForm({ username: u, password: "" });
      } else {
        setLoi(d.loi || d.message || "Kh\xF4ng th\u1EC3 \u0111\u0103ng k\xFD t\xE0i kho\u1EA3n.");
      }
    } catch {
      setLoi("L\u1ED7i k\u1EBFt n\u1ED1i m\xE1y ch\u1EE7. Th\u1EED l\u1EA1i sau.");
    } finally {
      setDangXuLy(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { id: "modal-auth", className: "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#151A23] border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scaleIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between pb-3 border-b border-white/10 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-lg" }, "\u{1F3EB}"), /* @__PURE__ */ React.createElement("h3", { className: "text-base font-black text-white" }, "Digital Campus")), /* @__PURE__ */ React.createElement("button", { onClick: onClose, "aria-label": "\u0110\xF3ng", className: "w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-all" }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "flex rounded-2xl bg-[#0D111A] p-1 mb-4 border border-white/5" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "tab-btn-login",
      onClick: () => {
        setTab("login");
        setLoi("");
        setThanhCong("");
      },
      className: `flex-1 py-2 text-xs font-black rounded-xl transition-all ${tab === "login" ? "bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black shadow-md" : "text-slate-400 hover:text-white"}`
    },
    "\u0110\u0103ng nh\u1EADp"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "tab-btn-register",
      onClick: () => {
        setTab("register");
        setLoi("");
        setThanhCong("");
      },
      className: `flex-1 py-2 text-xs font-black rounded-xl transition-all ${tab === "register" ? "bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black shadow-md" : "text-slate-400 hover:text-white"}`
    },
    "\u0110\u0103ng k\xFD"
  )), thanhCong && /* @__PURE__ */ React.createElement("div", { className: "p-3 mb-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold" }, thanhCong), loi && /* @__PURE__ */ React.createElement("div", { className: "p-3 mb-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-bold" }, loi), tab === "login" ? /* @__PURE__ */ React.createElement("form", { onSubmit: handleLogin, className: "flex flex-col gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-[11px] font-bold text-slate-300 block mb-1" }, "T\xEAn \u0111\u0103ng nh\u1EADp / Email:"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      id: "input-login-username",
      value: loginForm.username,
      onChange: (e) => setLoginForm((f) => ({ ...f, username: e.target.value })),
      placeholder: "VD: minh_10a7",
      className: "w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none",
      autoFocus: true
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-[11px] font-bold text-slate-300 block mb-1" }, "M\u1EADt kh\u1EA9u:"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      id: "input-login-password",
      value: loginForm.password,
      onChange: (e) => setLoginForm((f) => ({ ...f, password: e.target.value })),
      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      className: "w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
    }
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      id: "btn-submit-login",
      disabled: dangXuLy,
      className: "mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-black text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
    },
    dangXuLy ? "\u0110ang x\xE1c th\u1EF1c..." : "\u0110\u0103ng nh\u1EADp v\xE0o Campus"
  )) : /* @__PURE__ */ React.createElement("form", { onSubmit: handleRegister, className: "flex flex-col gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-[11px] font-bold text-slate-300 block mb-1" }, "H\u1ECD v\xE0 t\xEAn / T\xEAn hi\u1EC3n th\u1ECB:"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      id: "input-register-hoten",
      value: regForm.hoTen,
      onChange: (e) => setRegForm((f) => ({ ...f, hoTen: e.target.value })),
      placeholder: "VD: Nguy\u1EC5n V\u0103n Minh",
      className: "w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none",
      autoFocus: true
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-[11px] font-bold text-slate-300 block mb-1" }, "T\xEAn \u0111\u0103ng nh\u1EADp:"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      id: "input-register-username",
      value: regForm.username,
      onChange: (e) => setRegForm((f) => ({ ...f, username: e.target.value })),
      placeholder: "VD: minh_nguyen",
      className: "w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-[11px] font-bold text-slate-300 block mb-1" }, "M\u1EADt kh\u1EA9u:"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      id: "input-register-password",
      value: regForm.password,
      onChange: (e) => setRegForm((f) => ({ ...f, password: e.target.value })),
      placeholder: "\u2265 6 k\xFD t\u1EF1",
      className: "w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-[11px] font-bold text-slate-300 block mb-1" }, "Nh\u1EADp l\u1EA1i:"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      id: "input-register-repassword",
      value: regForm.rePassword,
      onChange: (e) => setRegForm((f) => ({ ...f, rePassword: e.target.value })),
      placeholder: "X\xE1c nh\u1EADn",
      className: "w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
    }
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-[11px] font-bold text-slate-300 block mb-1" }, "Lo\u1EA1i t\xE0i kho\u1EA3n:"), /* @__PURE__ */ React.createElement(
    "select",
    {
      id: "select-register-role",
      value: regForm.loaiTaiKhoan,
      onChange: (e) => setRegForm((f) => ({ ...f, loaiTaiKhoan: e.target.value })),
      className: "w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
    },
    /* @__PURE__ */ React.createElement("option", { value: "student" }, "H\u1ECDc sinh"),
    /* @__PURE__ */ React.createElement("option", { value: "teacher" }, "Gi\xE1o vi\xEAn"),
    /* @__PURE__ */ React.createElement("option", { value: "external" }, "Ng\u01B0\u1EDDi d\xF9ng kh\xE1c")
  )), regForm.loaiTaiKhoan === "teacher" && /* @__PURE__ */ React.createElement("div", { className: "p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-[11px] leading-relaxed" }, "\u26A0\uFE0F ", /* @__PURE__ */ React.createElement("strong", null, "L\u01B0u \xFD:"), " T\xE0i kho\u1EA3n Gi\xE1o vi\xEAn s\u1EBD \u1EDF tr\u1EA1ng th\xE1i ch\u1EDD duy\u1EC7t. Qu\u1EA3n tr\u1ECB vi\xEAn/Gi\xE1o vi\xEAn x\xE1c th\u1EF1c s\u1EBD ph\xEA duy\u1EC7t tr\u01B0\u1EDBc khi c\u1EA5p quy\u1EC1n."), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      id: "btn-submit-register",
      disabled: dangXuLy,
      className: "mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-black text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
    },
    dangXuLy ? "\u0110ang \u0111\u0103ng k\xFD..." : "T\u1EA1o t\xE0i kho\u1EA3n Campus"
  ))));
}
export function CommunityBoardGateModal({ isOpen, onClose, onSuccess, onDirectLogin }) {
  const [maCode, setMaCode] = useState("");
  const [dangKiemTra, setDangKiemTra] = useState(false);
  const [loi, setLoi] = useState("");
  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!maCode.trim() || dangKiemTra) return;
    setDangKiemTra(true);
    setLoi("");
    try {
      const res = await fetch("/api/kiem-tra-ma-cong-dong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maCode: maCode.trim() })
      });
      const d = await res.json();
      if (d.ok && d.daThanhVien) {
        await onSuccess(d);
      } else {
        setLoi(d.loi || "M\xE3 truy c\u1EADp kh\xF4ng ch\xEDnh x\xE1c ho\u1EB7c kh\xF4ng thu\u1ED9c t\xE0i kho\u1EA3n c\u1EE7a em.");
      }
    } catch {
      setLoi("Kh\xF4ng th\u1EC3 ki\u1EC3m tra m\xE3 l\xFAc n\xE0y. Th\u1EED l\u1EA1i sau.");
    } finally {
      setDangKiemTra(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { id: "modal-community-gate", className: "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#151A23] border border-cyan-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scaleIn" }, /* @__PURE__ */ React.createElement("div", { className: "w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00F2FE] to-[#8B5CF6] flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg" }, "\u{1F510}"), /* @__PURE__ */ React.createElement("h3", { className: "text-base font-black text-white text-center mb-1" }, "Truy C\u1EADp B\u1EA3ng Tin C\u1ED9ng \u0110\u1ED3ng"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-300 text-center mb-5 leading-relaxed" }, "B\u1EA3ng tin c\u1ED9ng \u0111\u1ED3ng l\u1EDBp 10A7 l\xE0 kh\xF4ng gian n\u1ED9i b\u1ED9 d\xE0nh ri\xEAng cho l\u1EDBp. Vui l\xF2ng nh\u1EADp m\xE3 truy c\u1EADp do gi\xE1o vi\xEAn c\u1EA5p ri\xEAng \u0111\u1EC3 k\xEDch ho\u1EA1t quy\u1EC1n th\xE0nh vi\xEAn."), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "flex flex-col gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-[11px] font-bold text-slate-300 block mb-1" }, "M\xE3 truy c\u1EADp gi\xE1o vi\xEAn c\u1EA5p ri\xEAng:"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      id: "input-community-gate-code",
      "data-id": "input-ma-truy-cap",
      value: maCode,
      onChange: (e) => {
        setMaCode(e.target.value.toUpperCase());
        setLoi("");
      },
      placeholder: "VD: A7-K9QP-X4T2",
      className: "w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase tracking-wider focus:outline-none",
      autoFocus: true
    }
  )), loi && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-center" }, loi), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      id: "btn-submit-community-gate",
      "data-id": "btn-xac-nhan-ma-cong-dong",
      disabled: dangKiemTra || !maCode.trim(),
      className: "w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-extrabold text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all disabled:opacity-40"
    },
    dangKiemTra ? "\u0110ang k\xEDch ho\u1EA1t..." : "K\xEDch ho\u1EA1t quy\u1EC1n th\xE0nh vi\xEAn \u2192"
  )), /* @__PURE__ */ React.createElement("div", { className: "mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs" }, /* @__PURE__ */ React.createElement("button", { onClick: onDirectLogin, className: "text-[#00F2FE] hover:underline font-bold" }, "\u0110\u0103ng nh\u1EADp t\xE0i kho\u1EA3n"), /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "text-slate-400 hover:text-white" }, "\u0110\xF3ng"))));
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvbW9kYWxzLmpzeCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgeyB1c2VTdGF0ZSB9ID0gUmVhY3Q7XG5cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIEFVVEggTU9EQUwgKFJFR0lPTiAxIC0gUEhBU0UgNEIpIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuZXhwb3J0IGZ1bmN0aW9uIEF1dGhNb2RhbCh7IGlzT3BlbiwgaW5pdGlhbFRhYiA9ICdsb2dpbicsIG9uQ2xvc2UsIG9uU3VjY2VzcyB9KSB7XG4gIGNvbnN0IFt0YWIsIHNldFRhYl0gPSBSZWFjdC51c2VTdGF0ZShpbml0aWFsVGFiKTtcbiAgY29uc3QgW2xvZ2luRm9ybSwgc2V0TG9naW5Gb3JtXSA9IFJlYWN0LnVzZVN0YXRlKHsgdXNlcm5hbWU6ICcnLCBwYXNzd29yZDogJycgfSk7XG4gIGNvbnN0IFtyZWdGb3JtLCBzZXRSZWdGb3JtXSA9IFJlYWN0LnVzZVN0YXRlKHsgaG9UZW46ICcnLCB1c2VybmFtZTogJycsIHBhc3N3b3JkOiAnJywgcmVQYXNzd29yZDogJycsIGxvYWlUYWlLaG9hbjogJ3N0dWRlbnQnIH0pO1xuICBjb25zdCBbZGFuZ1h1THksIHNldERhbmdYdUx5XSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2xvaSwgc2V0TG9pXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3RoYW5oQ29uZywgc2V0VGhhbmhDb25nXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChpc09wZW4pIHtcbiAgICAgIHNldFRhYihpbml0aWFsVGFiKTtcbiAgICAgIHNldExvaSgnJyk7XG4gICAgICBzZXRUaGFuaENvbmcoJycpO1xuICAgIH1cbiAgfSwgW2lzT3BlbiwgaW5pdGlhbFRhYl0pO1xuXG4gIGlmICghaXNPcGVuKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBoYW5kbGVMb2dpbiA9IGFzeW5jIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmIChkYW5nWHVMeSkgcmV0dXJuO1xuICAgIHNldExvaSgnJyk7XG4gICAgc2V0VGhhbmhDb25nKCcnKTtcbiAgICBjb25zdCB1ID0gbG9naW5Gb3JtLnVzZXJuYW1lLnRyaW0oKTtcbiAgICBjb25zdCBwID0gbG9naW5Gb3JtLnBhc3N3b3JkO1xuICAgIGlmICghdSB8fCAhcCkge1xuICAgICAgc2V0TG9pKCdWdWkgbFx1MDBGMm5nIG5oXHUxRUFEcCBcdTAxMTFcdTFFQTd5IFx1MDExMVx1MUVFNyB0XHUwMEVBbiBcdTAxMTFcdTAxMDNuZyBuaFx1MUVBRHAgdlx1MDBFMCBtXHUxRUFEdCBraFx1MUVBOXUuJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNldERhbmdYdUx5KHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9sb2dpbicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHVzZXJuYW1lOiB1LCBwYXNzd29yZDogcCB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSB7XG4gICAgICAgIHNldFRoYW5oQ29uZygnXHUwMTEwXHUwMTAzbmcgbmhcdTFFQURwIHRoXHUwMEUwbmggY1x1MDBGNG5nIScpO1xuICAgICAgICBpZiAob25TdWNjZXNzKSBhd2FpdCBvblN1Y2Nlc3MoZCk7XG4gICAgICAgIG9uQ2xvc2UoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldExvaShkLmxvaSB8fCBkLm1lc3NhZ2UgfHwgJ1RcdTAwRUFuIFx1MDExMVx1MDEwM25nIG5oXHUxRUFEcCBob1x1MUVCN2MgbVx1MUVBRHQga2hcdTFFQTl1IGtoXHUwMEY0bmcgY2hcdTAwRURuaCB4XHUwMEUxYy4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuIFRoXHUxRUVEIGxcdTFFQTFpIHNhdS4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RGFuZ1h1THkoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBoYW5kbGVSZWdpc3RlciA9IGFzeW5jIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmIChkYW5nWHVMeSkgcmV0dXJuO1xuICAgIHNldExvaSgnJyk7XG4gICAgc2V0VGhhbmhDb25nKCcnKTtcbiAgICBjb25zdCBodCA9IHJlZ0Zvcm0uaG9UZW4udHJpbSgpO1xuICAgIGNvbnN0IHUgPSByZWdGb3JtLnVzZXJuYW1lLnRyaW0oKTtcbiAgICBjb25zdCBwID0gcmVnRm9ybS5wYXNzd29yZDtcbiAgICBjb25zdCBycCA9IHJlZ0Zvcm0ucmVQYXNzd29yZDtcbiAgICBjb25zdCBsdCA9IHJlZ0Zvcm0ubG9haVRhaUtob2FuO1xuXG4gICAgaWYgKCFodCB8fCAhdSB8fCAhcCkge1xuICAgICAgc2V0TG9pKCdWdWkgbFx1MDBGMm5nIFx1MDExMWlcdTFFQzFuIFx1MDExMVx1MUVBN3kgXHUwMTExXHUxRUU3IGNcdTAwRTFjIHRoXHUwMEY0bmcgdGluIGJcdTFFQUZ0IGJ1XHUxRUQ5Yy4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHAubGVuZ3RoIDwgNikge1xuICAgICAgc2V0TG9pKCdNXHUxRUFEdCBraFx1MUVBOXUgcGhcdTFFQTNpIGNcdTAwRjMgXHUwMEVEdCBuaFx1MUVBNXQgNiBrXHUwMEZEIHRcdTFFRjEuJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChwICE9PSBycCkge1xuICAgICAgc2V0TG9pKCdNXHUxRUFEdCBraFx1MUVBOXUgeFx1MDBFMWMgbmhcdTFFQURuIGtoXHUwMEY0bmcga2hcdTFFREJwLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldERhbmdYdUx5KHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9yZWdpc3RlcicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGRpc3BsYXlOYW1lOiBodCwgaG9UZW46IGh0LCB1c2VybmFtZTogdSwgcGFzc3dvcmQ6IHAsIGFjY291bnRUeXBlOiBsdCwgbG9haVRhaUtob2FuOiBsdCB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSB7XG4gICAgICAgIGlmIChkLnRlYWNoZXJQZW5kaW5nKSB7XG4gICAgICAgICAgc2V0VGhhbmhDb25nKCdcdTAxMTBcdTAxMDNuZyBrXHUwMEZEIHRoXHUwMEUwbmggY1x1MDBGNG5nISBZXHUwMEVBdSBjXHUxRUE3dSB0XHUwMEUwaSBraG9cdTFFQTNuIEdpXHUwMEUxbyB2aVx1MDBFQW4gXHUwMTExYW5nIGNoXHUxRUREIGR1eVx1MUVDN3QgdFx1MUVFQiBxdVx1MUVBM24gdHJcdTFFQ0IgdmlcdTAwRUFuIHRyXHUwMUIwXHUxRUREbmcuJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0VGhhbmhDb25nKCdcdTAxMTBcdTAxMDNuZyBrXHUwMEZEIHRcdTAwRTBpIGtob1x1MUVBM24gdGhcdTAwRTBuaCBjXHUwMEY0bmchIEJcdTFFQTFuIGNcdTAwRjMgdGhcdTFFQzMgXHUwMTExXHUwMTAzbmcgbmhcdTFFQURwIG5nYXkuJyk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0VGFiKCdsb2dpbicpO1xuICAgICAgICBzZXRMb2dpbkZvcm0oeyB1c2VybmFtZTogdSwgcGFzc3dvcmQ6ICcnIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0TG9pKGQubG9pIHx8IGQubWVzc2FnZSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyBcdTAxMTFcdTAxMDNuZyBrXHUwMEZEIHRcdTAwRTBpIGtob1x1MUVBM24uJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRMb2koJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LiBUaFx1MUVFRCBsXHUxRUExaSBzYXUuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldERhbmdYdUx5KGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGlkPVwibW9kYWwtYXV0aFwiIGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgei01MCBiZy1ibGFjay84NSBiYWNrZHJvcC1ibHVyLW1kIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNCBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8yMCByb3VuZGVkLTN4bCBwLTYgbWF4LXctbWQgdy1mdWxsIHNoYWRvdy0yeGwgYW5pbWF0ZS1zY2FsZUluXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHBiLTMgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIG1iLTRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWxnXCI+XHVEODNDXHVERkVCPC9zcGFuPlxuICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtYmFzZSBmb250LWJsYWNrIHRleHQtd2hpdGVcIj5EaWdpdGFsIENhbXB1czwvaDM+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtvbkNsb3NlfSBhcmlhLWxhYmVsPVwiXHUwMTEwXHUwMEYzbmdcIiBjbGFzc05hbWU9XCJ3LTggaC04IHJvdW5kZWQtZnVsbCBiZy13aGl0ZS8xMCBob3ZlcjpiZy13aGl0ZS8yMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IHJvdW5kZWQtMnhsIGJnLVsjMEQxMTFBXSBwLTEgbWItNCBib3JkZXIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGlkPVwidGFiLWJ0bi1sb2dpblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldFRhYignbG9naW4nKTsgc2V0TG9pKCcnKTsgc2V0VGhhbmhDb25nKCcnKTsgfX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXgtMSBweS0yIHRleHQteHMgZm9udC1ibGFjayByb3VuZGVkLXhsIHRyYW5zaXRpb24tYWxsICR7dGFiID09PSAnbG9naW4nID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyM4QjVDRjZdIHRleHQtYmxhY2sgc2hhZG93LW1kJyA6ICd0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgIFx1MDExMFx1MDEwM25nIG5oXHUxRUFEcFxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgaWQ9XCJ0YWItYnRuLXJlZ2lzdGVyXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0VGFiKCdyZWdpc3RlcicpOyBzZXRMb2koJycpOyBzZXRUaGFuaENvbmcoJycpOyB9fVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleC0xIHB5LTIgdGV4dC14cyBmb250LWJsYWNrIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgJHt0YWIgPT09ICdyZWdpc3RlcicgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzhCNUNGNl0gdGV4dC1ibGFjayBzaGFkb3ctbWQnIDogJ3RleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgXHUwMTEwXHUwMTAzbmcga1x1MDBGRFxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7dGhhbmhDb25nICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMyBtYi0zIHJvdW5kZWQteGwgYmctZW1lcmFsZC01MDAvMTUgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LWVtZXJhbGQtMzAwIHRleHQteHMgdGV4dC1jZW50ZXIgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICB7dGhhbmhDb25nfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgICB7bG9pICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMyBtYi0zIHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTUgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0ZXh0LXJvc2UtMzAwIHRleHQteHMgdGV4dC1jZW50ZXIgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICB7bG9pfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHt0YWIgPT09ICdsb2dpbicgPyAoXG4gICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZUxvZ2lufSBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC0zXCI+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwIGJsb2NrIG1iLTFcIj5UXHUwMEVBbiBcdTAxMTFcdTAxMDNuZyBuaFx1MUVBRHAgLyBFbWFpbDo8L2xhYmVsPlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1sb2dpbi11c2VybmFtZVwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e2xvZ2luRm9ybS51c2VybmFtZX1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRMb2dpbkZvcm0oZiA9PiAoeyAuLi5mLCB1c2VybmFtZTogZS50YXJnZXQudmFsdWUgfSkpfVxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiVkQ6IG1pbmhfMTBhN1wiXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IGZvY3VzOmJvcmRlci1bIzAwRjJGRV0gcm91bmRlZC14bCBweC0zLjUgcHktMi41IHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lXCJcbiAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMCBibG9jayBtYi0xXCI+TVx1MUVBRHQga2hcdTFFQTl1OjwvbGFiZWw+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1sb2dpbi1wYXNzd29yZFwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e2xvZ2luRm9ybS5wYXNzd29yZH1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRMb2dpbkZvcm0oZiA9PiAoeyAuLi5mLCBwYXNzd29yZDogZS50YXJnZXQudmFsdWUgfSkpfVxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiXHUyMDIyXHUyMDIyXHUyMDIyXHUyMDIyXHUyMDIyXHUyMDIyXHUyMDIyXHUyMDIyXCJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXSByb3VuZGVkLXhsIHB4LTMuNSBweS0yLjUgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmVcIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICBpZD1cImJ0bi1zdWJtaXQtbG9naW5cIlxuICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ1h1THl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm10LTIgdy1mdWxsIHB5LTIuNSByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyM4QjVDRjZdIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIHNoYWRvdy1sZyBob3ZlcjpvcGFjaXR5LTk1IGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgIHtkYW5nWHVMeSA/ICdcdTAxMTBhbmcgeFx1MDBFMWMgdGhcdTFFRjFjLi4uJyA6ICdcdTAxMTBcdTAxMDNuZyBuaFx1MUVBRHAgdlx1MDBFMG8gQ2FtcHVzJ31cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlUmVnaXN0ZXJ9IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTNcIj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDAgYmxvY2sgbWItMVwiPkhcdTFFQ0Qgdlx1MDBFMCB0XHUwMEVBbiAvIFRcdTAwRUFuIGhpXHUxRUMzbiB0aFx1MUVDQjo8L2xhYmVsPlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1yZWdpc3Rlci1ob3RlblwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e3JlZ0Zvcm0uaG9UZW59XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0UmVnRm9ybShmID0+ICh7IC4uLmYsIGhvVGVuOiBlLnRhcmdldC52YWx1ZSB9KSl9XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJWRDogTmd1eVx1MUVDNW4gVlx1MDEwM24gTWluaFwiXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IGZvY3VzOmJvcmRlci1bIzAwRjJGRV0gcm91bmRlZC14bCBweC0zLjUgcHktMiB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZVwiXG4gICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDAgYmxvY2sgbWItMVwiPlRcdTAwRUFuIFx1MDExMVx1MDEwM25nIG5oXHUxRUFEcDo8L2xhYmVsPlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1yZWdpc3Rlci11c2VybmFtZVwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e3JlZ0Zvcm0udXNlcm5hbWV9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0UmVnRm9ybShmID0+ICh7IC4uLmYsIHVzZXJuYW1lOiBlLnRhcmdldC52YWx1ZSB9KSl9XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJWRDogbWluaF9uZ3V5ZW5cIlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xNSBmb2N1czpib3JkZXItWyMwMEYyRkVdIHJvdW5kZWQteGwgcHgtMy41IHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmVcIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwIGJsb2NrIG1iLTFcIj5NXHUxRUFEdCBraFx1MUVBOXU6PC9sYWJlbD5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgICAgICBpZD1cImlucHV0LXJlZ2lzdGVyLXBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtyZWdGb3JtLnBhc3N3b3JkfVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0UmVnRm9ybShmID0+ICh7IC4uLmYsIHBhc3N3b3JkOiBlLnRhcmdldC52YWx1ZSB9KSl9XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlx1MjI2NSA2IGtcdTAwRkQgdFx1MUVGMVwiXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXSByb3VuZGVkLXhsIHB4LTMuNSBweS0yIHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwIGJsb2NrIG1iLTFcIj5OaFx1MUVBRHAgbFx1MUVBMWk6PC9sYWJlbD5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgICAgICBpZD1cImlucHV0LXJlZ2lzdGVyLXJlcGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e3JlZ0Zvcm0ucmVQYXNzd29yZH1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFJlZ0Zvcm0oZiA9PiAoeyAuLi5mLCByZVBhc3N3b3JkOiBlLnRhcmdldC52YWx1ZSB9KSl9XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlhcdTAwRTFjIG5oXHUxRUFEblwiXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXSByb3VuZGVkLXhsIHB4LTMuNSBweS0yIHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMCBibG9jayBtYi0xXCI+TG9cdTFFQTFpIHRcdTAwRTBpIGtob1x1MUVBM246PC9sYWJlbD5cbiAgICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICAgIGlkPVwic2VsZWN0LXJlZ2lzdGVyLXJvbGVcIlxuICAgICAgICAgICAgICAgIHZhbHVlPXtyZWdGb3JtLmxvYWlUYWlLaG9hbn1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRSZWdGb3JtKGYgPT4gKHsgLi4uZiwgbG9haVRhaUtob2FuOiBlLnRhcmdldC52YWx1ZSB9KSl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IGZvY3VzOmJvcmRlci1bIzAwRjJGRV0gcm91bmRlZC14bCBweC0zLjUgcHktMiB0ZXh0LXhzIHRleHQtd2hpdGUgZm9jdXM6b3V0bGluZS1ub25lXCI+XG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInN0dWRlbnRcIj5IXHUxRUNEYyBzaW5oPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInRlYWNoZXJcIj5HaVx1MDBFMW8gdmlcdTAwRUFuPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImV4dGVybmFsXCI+TmdcdTAxQjBcdTFFRERpIGRcdTAwRjluZyBraFx1MDBFMWM8L29wdGlvbj5cbiAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHtyZWdGb3JtLmxvYWlUYWlLaG9hbiA9PT0gJ3RlYWNoZXInICYmIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTIuNSByb3VuZGVkLXhsIGJnLXB1cnBsZS01MDAvMTUgYm9yZGVyIGJvcmRlci1wdXJwbGUtNTAwLzMwIHRleHQtcHVycGxlLTIwMCB0ZXh0LVsxMXB4XSBsZWFkaW5nLXJlbGF4ZWRcIj5cbiAgICAgICAgICAgICAgICBcdTI2QTBcdUZFMEYgPHN0cm9uZz5MXHUwMUIwdSBcdTAwRkQ6PC9zdHJvbmc+IFRcdTAwRTBpIGtob1x1MUVBM24gR2lcdTAwRTFvIHZpXHUwMEVBbiBzXHUxRUJEIFx1MUVERiB0clx1MUVBMW5nIHRoXHUwMEUxaSBjaFx1MUVERCBkdXlcdTFFQzd0LiBRdVx1MUVBM24gdHJcdTFFQ0IgdmlcdTAwRUFuL0dpXHUwMEUxbyB2aVx1MDBFQW4geFx1MDBFMWMgdGhcdTFFRjFjIHNcdTFFQkQgcGhcdTAwRUEgZHV5XHUxRUM3dCB0clx1MDFCMFx1MUVEQmMga2hpIGNcdTFFQTVwIHF1eVx1MUVDMW4uXG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgIGlkPVwiYnRuLXN1Ym1pdC1yZWdpc3RlclwiXG4gICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nWHVMeX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXQtMiB3LWZ1bGwgcHktMi41IHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzhCNUNGNl0gdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQteHMgc2hhZG93LWxnIGhvdmVyOm9wYWNpdHktOTUgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAge2RhbmdYdUx5ID8gJ1x1MDExMGFuZyBcdTAxMTFcdTAxMDNuZyBrXHUwMEZELi4uJyA6ICdUXHUxRUExbyB0XHUwMEUwaSBraG9cdTFFQTNuIENhbXB1cyd9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIENvbW11bml0eUJvYXJkR2F0ZU1vZGFsKHsgaXNPcGVuLCBvbkNsb3NlLCBvblN1Y2Nlc3MsIG9uRGlyZWN0TG9naW4gfSkge1xuICBjb25zdCBbbWFDb2RlLCBzZXRNYUNvZGVdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbZGFuZ0tpZW1UcmEsIHNldERhbmdLaWVtVHJhXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2xvaSwgc2V0TG9pXSA9IHVzZVN0YXRlKCcnKTtcblxuICBpZiAoIWlzT3BlbikgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgaGFuZGxlU3VibWl0ID0gYXN5bmMgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKCFtYUNvZGUudHJpbSgpIHx8IGRhbmdLaWVtVHJhKSByZXR1cm47XG4gICAgc2V0RGFuZ0tpZW1UcmEodHJ1ZSk7XG4gICAgc2V0TG9pKCcnKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9raWVtLXRyYS1tYS1jb25nLWRvbmcnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtYUNvZGU6IG1hQ29kZS50cmltKCkgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vayAmJiBkLmRhVGhhbmhWaWVuKSB7XG4gICAgICAgIGF3YWl0IG9uU3VjY2VzcyhkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldExvaShkLmxvaSB8fCAnTVx1MDBFMyB0cnV5IGNcdTFFQURwIGtoXHUwMEY0bmcgY2hcdTAwRURuaCB4XHUwMEUxYyBob1x1MUVCN2Mga2hcdTAwRjRuZyB0aHVcdTFFRDljIHRcdTAwRTBpIGtob1x1MUVBM24gY1x1MUVFN2EgZW0uJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRMb2koJ0toXHUwMEY0bmcgdGhcdTFFQzMga2lcdTFFQzNtIHRyYSBtXHUwMEUzIGxcdTAwRkFjIG5cdTAwRTB5LiBUaFx1MUVFRCBsXHUxRUExaSBzYXUuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldERhbmdLaWVtVHJhKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGlkPVwibW9kYWwtY29tbXVuaXR5LWdhdGVcIiBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIHotNTAgYmctYmxhY2svODUgYmFja2Ryb3AtYmx1ci1tZCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTQgYW5pbWF0ZS1mYWRlSW5cIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItY3lhbi01MDAvNDAgcm91bmRlZC0zeGwgcC02IG1heC13LW1kIHctZnVsbCBzaGFkb3ctMnhsIGFuaW1hdGUtc2NhbGVJblwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTQgaC0xNCByb3VuZGVkLTJ4bCBiZy1ncmFkaWVudC10by10ciBmcm9tLVsjMDBGMkZFXSB0by1bIzhCNUNGNl0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC0yeGwgbXgtYXV0byBtYi0zIHNoYWRvdy1sZ1wiPlxuICAgICAgICAgIFx1RDgzRFx1REQxMFxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtYmFzZSBmb250LWJsYWNrIHRleHQtd2hpdGUgdGV4dC1jZW50ZXIgbWItMVwiPlRydXkgQ1x1MUVBRHAgQlx1MUVBM25nIFRpbiBDXHUxRUQ5bmcgXHUwMTEwXHUxRUQzbmc8L2gzPlxuICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIHRleHQtY2VudGVyIG1iLTUgbGVhZGluZy1yZWxheGVkXCI+XG4gICAgICAgICAgQlx1MUVBM25nIHRpbiBjXHUxRUQ5bmcgXHUwMTExXHUxRUQzbmcgbFx1MUVEQnAgMTBBNyBsXHUwMEUwIGtoXHUwMEY0bmcgZ2lhbiBuXHUxRUQ5aSBiXHUxRUQ5IGRcdTAwRTBuaCByaVx1MDBFQW5nIGNobyBsXHUxRURCcC4gVnVpIGxcdTAwRjJuZyBuaFx1MUVBRHAgbVx1MDBFMyB0cnV5IGNcdTFFQURwIGRvIGdpXHUwMEUxbyB2aVx1MDBFQW4gY1x1MUVBNXAgcmlcdTAwRUFuZyBcdTAxMTFcdTFFQzMga1x1MDBFRGNoIGhvXHUxRUExdCBxdXlcdTFFQzFuIHRoXHUwMEUwbmggdmlcdTAwRUFuLlxuICAgICAgICA8L3A+XG5cbiAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVN1Ym1pdH0gY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtM1wiPlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwIGJsb2NrIG1iLTFcIj5NXHUwMEUzIHRydXkgY1x1MUVBRHAgZ2lcdTAwRTFvIHZpXHUwMEVBbiBjXHUxRUE1cCByaVx1MDBFQW5nOjwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICBpZD1cImlucHV0LWNvbW11bml0eS1nYXRlLWNvZGVcIlxuICAgICAgICAgICAgICBkYXRhLWlkPVwiaW5wdXQtbWEtdHJ1eS1jYXBcIlxuICAgICAgICAgICAgICB2YWx1ZT17bWFDb2RlfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB7IHNldE1hQ29kZShlLnRhcmdldC52YWx1ZS50b1VwcGVyQ2FzZSgpKTsgc2V0TG9pKCcnKTsgfX1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJWRDogQTctSzlRUC1YNFQyXCJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IGZvY3VzOmJvcmRlci1bIzAwRjJGRV0gcm91bmRlZC14bCBweC00IHB5LTIuNSB0ZXh0LXNtIHRleHQtd2hpdGUgZm9udC1tb25vIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciBmb2N1czpvdXRsaW5lLW5vbmVcIlxuICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7bG9pICYmIChcbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1yb3NlLTQwMCBiZy1yb3NlLTUwMC8xMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzIwIHJvdW5kZWQteGwgcC0yLjUgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAge2xvaX1cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICApfVxuXG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICBpZD1cImJ0bi1zdWJtaXQtY29tbXVuaXR5LWdhdGVcIlxuICAgICAgICAgICAgZGF0YS1pZD1cImJ0bi14YWMtbmhhbi1tYS1jb25nLWRvbmdcIlxuICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdLaWVtVHJhIHx8ICFtYUNvZGUudHJpbSgpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB5LTIuNSByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyM4QjVDRjZdIHRleHQtYmxhY2sgZm9udC1leHRyYWJvbGQgdGV4dC14cyBzaGFkb3ctbGcgaG92ZXI6b3BhY2l0eS05NSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS00MFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAge2RhbmdLaWVtVHJhID8gJ1x1MDExMGFuZyBrXHUwMEVEY2ggaG9cdTFFQTF0Li4uJyA6ICdLXHUwMEVEY2ggaG9cdTFFQTF0IHF1eVx1MUVDMW4gdGhcdTAwRTBuaCB2aVx1MDBFQW4gXHUyMTkyJ31cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9mb3JtPlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtNCBwdC0zIGJvcmRlci10IGJvcmRlci13aGl0ZS8xMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC14c1wiPlxuICAgICAgICAgIDxidXR0b24gb25DbGljaz17b25EaXJlY3RMb2dpbn0gY2xhc3NOYW1lPVwidGV4dC1bIzAwRjJGRV0gaG92ZXI6dW5kZXJsaW5lIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgXHUwMTEwXHUwMTAzbmcgbmhcdTFFQURwIHRcdTAwRTBpIGtob1x1MUVBM25cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e29uQ2xvc2V9IGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGVcIj5cbiAgICAgICAgICAgIFx1MDExMFx1MDBGM25nXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiQUFBQSxNQUFNLEVBQUUsU0FBUyxJQUFJO0FBSWQsZ0JBQVMsVUFBVSxFQUFFLFFBQVEsYUFBYSxTQUFTLFNBQVMsVUFBVSxHQUFHO0FBQzlFLFFBQU0sQ0FBQyxLQUFLLE1BQU0sSUFBSSxNQUFNLFNBQVMsVUFBVTtBQUMvQyxRQUFNLENBQUMsV0FBVyxZQUFZLElBQUksTUFBTSxTQUFTLEVBQUUsVUFBVSxJQUFJLFVBQVUsR0FBRyxDQUFDO0FBQy9FLFFBQU0sQ0FBQyxTQUFTLFVBQVUsSUFBSSxNQUFNLFNBQVMsRUFBRSxPQUFPLElBQUksVUFBVSxJQUFJLFVBQVUsSUFBSSxZQUFZLElBQUksY0FBYyxVQUFVLENBQUM7QUFDL0gsUUFBTSxDQUFDLFVBQVUsV0FBVyxJQUFJLE1BQU0sU0FBUyxLQUFLO0FBQ3BELFFBQU0sQ0FBQyxLQUFLLE1BQU0sSUFBSSxNQUFNLFNBQVMsRUFBRTtBQUN2QyxRQUFNLENBQUMsV0FBVyxZQUFZLElBQUksTUFBTSxTQUFTLEVBQUU7QUFFbkQsUUFBTSxVQUFVLE1BQU07QUFDcEIsUUFBSSxRQUFRO0FBQ1YsYUFBTyxVQUFVO0FBQ2pCLGFBQU8sRUFBRTtBQUNULG1CQUFhLEVBQUU7QUFBQSxJQUNqQjtBQUFBLEVBQ0YsR0FBRyxDQUFDLFFBQVEsVUFBVSxDQUFDO0FBRXZCLE1BQUksQ0FBQyxPQUFRLFFBQU87QUFFcEIsUUFBTSxjQUFjLE9BQU8sTUFBTTtBQUMvQixNQUFFLGVBQWU7QUFDakIsUUFBSSxTQUFVO0FBQ2QsV0FBTyxFQUFFO0FBQ1QsaUJBQWEsRUFBRTtBQUNmLFVBQU0sSUFBSSxVQUFVLFNBQVMsS0FBSztBQUNsQyxVQUFNLElBQUksVUFBVTtBQUNwQixRQUFJLENBQUMsS0FBSyxDQUFDLEdBQUc7QUFDWixhQUFPLDRHQUFpRDtBQUN4RDtBQUFBLElBQ0Y7QUFDQSxnQkFBWSxJQUFJO0FBQ2hCLFFBQUk7QUFDRixZQUFNLE1BQU0sTUFBTSxNQUFNLGNBQWM7QUFBQSxRQUNwQyxRQUFRO0FBQUEsUUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLFFBQzlDLE1BQU0sS0FBSyxVQUFVLEVBQUUsVUFBVSxHQUFHLFVBQVUsRUFBRSxDQUFDO0FBQUEsTUFDbkQsQ0FBQztBQUNELFlBQU0sSUFBSSxNQUFNLElBQUksS0FBSztBQUN6QixVQUFJLEVBQUUsSUFBSTtBQUNSLHFCQUFhLDRDQUF1QjtBQUNwQyxZQUFJLFVBQVcsT0FBTSxVQUFVLENBQUM7QUFDaEMsZ0JBQVE7QUFBQSxNQUNWLE9BQU87QUFDTCxlQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsd0ZBQThDO0FBQUEsTUFDN0U7QUFBQSxJQUNGLFFBQVE7QUFDTixhQUFPLG9FQUFtQztBQUFBLElBQzVDLFVBQUU7QUFDQSxrQkFBWSxLQUFLO0FBQUEsSUFDbkI7QUFBQSxFQUNGO0FBRUEsUUFBTSxpQkFBaUIsT0FBTyxNQUFNO0FBQ2xDLE1BQUUsZUFBZTtBQUNqQixRQUFJLFNBQVU7QUFDZCxXQUFPLEVBQUU7QUFDVCxpQkFBYSxFQUFFO0FBQ2YsVUFBTSxLQUFLLFFBQVEsTUFBTSxLQUFLO0FBQzlCLFVBQU0sSUFBSSxRQUFRLFNBQVMsS0FBSztBQUNoQyxVQUFNLElBQUksUUFBUTtBQUNsQixVQUFNLEtBQUssUUFBUTtBQUNuQixVQUFNLEtBQUssUUFBUTtBQUVuQixRQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHO0FBQ25CLGFBQU8sK0ZBQThDO0FBQ3JEO0FBQUEsSUFDRjtBQUNBLFFBQUksRUFBRSxTQUFTLEdBQUc7QUFDaEIsYUFBTyxxRUFBbUM7QUFDMUM7QUFBQSxJQUNGO0FBQ0EsUUFBSSxNQUFNLElBQUk7QUFDWixhQUFPLHlEQUErQjtBQUN0QztBQUFBLElBQ0Y7QUFFQSxnQkFBWSxJQUFJO0FBQ2hCLFFBQUk7QUFDRixZQUFNLE1BQU0sTUFBTSxNQUFNLGlCQUFpQjtBQUFBLFFBQ3ZDLFFBQVE7QUFBQSxRQUNSLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsUUFDOUMsTUFBTSxLQUFLLFVBQVUsRUFBRSxhQUFhLElBQUksT0FBTyxJQUFJLFVBQVUsR0FBRyxVQUFVLEdBQUcsYUFBYSxJQUFJLGNBQWMsR0FBRyxDQUFDO0FBQUEsTUFDbEgsQ0FBQztBQUNELFlBQU0sSUFBSSxNQUFNLElBQUksS0FBSztBQUN6QixVQUFJLEVBQUUsSUFBSTtBQUNSLFlBQUksRUFBRSxnQkFBZ0I7QUFDcEIsdUJBQWEsNktBQXlGO0FBQUEsUUFDeEcsT0FBTztBQUNMLHVCQUFhLGlIQUEwRDtBQUFBLFFBQ3pFO0FBQ0EsZUFBTyxPQUFPO0FBQ2QscUJBQWEsRUFBRSxVQUFVLEdBQUcsVUFBVSxHQUFHLENBQUM7QUFBQSxNQUM1QyxPQUFPO0FBQ0wsZUFBTyxFQUFFLE9BQU8sRUFBRSxXQUFXLDJEQUE4QjtBQUFBLE1BQzdEO0FBQUEsSUFDRixRQUFRO0FBQ04sYUFBTyxvRUFBbUM7QUFBQSxJQUM1QyxVQUFFO0FBQ0Esa0JBQVksS0FBSztBQUFBLElBQ25CO0FBQUEsRUFDRjtBQUVBLFNBQ0Usb0NBQUMsU0FBSSxJQUFHLGNBQWEsV0FBVSx5R0FDN0Isb0NBQUMsU0FBSSxXQUFVLG9HQUNiLG9DQUFDLFNBQUksV0FBVSwwRUFDYixvQ0FBQyxTQUFJLFdBQVUsNkJBQ2Isb0NBQUMsVUFBSyxXQUFVLGFBQVUsV0FBRSxHQUM1QixvQ0FBQyxRQUFHLFdBQVUscUNBQWtDLGdCQUFjLENBQ2hFLEdBQ0Esb0NBQUMsWUFBTyxTQUFTLFNBQVMsY0FBVyxnQkFBTyxXQUFVLDBKQUF1SixRQUU3TSxDQUNGLEdBRUEsb0NBQUMsU0FBSSxXQUFVLGtFQUNiO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxJQUFHO0FBQUEsTUFDSCxTQUFTLE1BQU07QUFBRSxlQUFPLE9BQU87QUFBRyxlQUFPLEVBQUU7QUFBRyxxQkFBYSxFQUFFO0FBQUEsTUFBRztBQUFBLE1BQ2hFLFdBQVcsNERBQTRELFFBQVEsVUFBVSxzRUFBc0UsaUNBQWlDO0FBQUE7QUFBQSxJQUFJO0FBQUEsRUFFdE0sR0FDQTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsTUFBSztBQUFBLE1BQ0wsSUFBRztBQUFBLE1BQ0gsU0FBUyxNQUFNO0FBQUUsZUFBTyxVQUFVO0FBQUcsZUFBTyxFQUFFO0FBQUcscUJBQWEsRUFBRTtBQUFBLE1BQUc7QUFBQSxNQUNuRSxXQUFXLDREQUE0RCxRQUFRLGFBQWEsc0VBQXNFLGlDQUFpQztBQUFBO0FBQUEsSUFBSTtBQUFBLEVBRXpNLENBQ0YsR0FFQyxhQUNDLG9DQUFDLFNBQUksV0FBVSx1SEFDWixTQUNILEdBRUQsT0FDQyxvQ0FBQyxTQUFJLFdBQVUsOEdBQ1osR0FDSCxHQUdELFFBQVEsVUFDUCxvQ0FBQyxVQUFLLFVBQVUsYUFBYSxXQUFVLHlCQUNyQyxvQ0FBQyxhQUNDLG9DQUFDLFdBQU0sV0FBVSxxREFBa0QsMENBQXNCLEdBQ3pGO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxJQUFHO0FBQUEsTUFDSCxPQUFPLFVBQVU7QUFBQSxNQUNqQixVQUFVLE9BQUssYUFBYSxRQUFNLEVBQUUsR0FBRyxHQUFHLFVBQVUsRUFBRSxPQUFPLE1BQU0sRUFBRTtBQUFBLE1BQ3JFLGFBQVk7QUFBQSxNQUNaLFdBQVU7QUFBQSxNQUNWLFdBQVM7QUFBQTtBQUFBLEVBQ1gsQ0FDRixHQUNBLG9DQUFDLGFBQ0Msb0NBQUMsV0FBTSxXQUFVLHFEQUFrRCxxQkFBUyxHQUM1RTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsTUFBSztBQUFBLE1BQ0wsSUFBRztBQUFBLE1BQ0gsT0FBTyxVQUFVO0FBQUEsTUFDakIsVUFBVSxPQUFLLGFBQWEsUUFBTSxFQUFFLEdBQUcsR0FBRyxVQUFVLEVBQUUsT0FBTyxNQUFNLEVBQUU7QUFBQSxNQUNyRSxhQUFZO0FBQUEsTUFDWixXQUFVO0FBQUE7QUFBQSxFQUNaLENBQ0YsR0FDQTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsTUFBSztBQUFBLE1BQ0wsSUFBRztBQUFBLE1BQ0gsVUFBVTtBQUFBLE1BQ1YsV0FBVTtBQUFBO0FBQUEsSUFDVCxXQUFXLGtDQUFxQjtBQUFBLEVBQ25DLENBQ0YsSUFFQSxvQ0FBQyxVQUFLLFVBQVUsZ0JBQWdCLFdBQVUseUJBQ3hDLG9DQUFDLGFBQ0Msb0NBQUMsV0FBTSxXQUFVLHFEQUFrRCxtREFBeUIsR0FDNUY7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLElBQUc7QUFBQSxNQUNILE9BQU8sUUFBUTtBQUFBLE1BQ2YsVUFBVSxPQUFLLFdBQVcsUUFBTSxFQUFFLEdBQUcsR0FBRyxPQUFPLEVBQUUsT0FBTyxNQUFNLEVBQUU7QUFBQSxNQUNoRSxhQUFZO0FBQUEsTUFDWixXQUFVO0FBQUEsTUFDVixXQUFTO0FBQUE7QUFBQSxFQUNYLENBQ0YsR0FDQSxvQ0FBQyxhQUNDLG9DQUFDLFdBQU0sV0FBVSxxREFBa0Qsa0NBQWMsR0FDakY7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLElBQUc7QUFBQSxNQUNILE9BQU8sUUFBUTtBQUFBLE1BQ2YsVUFBVSxPQUFLLFdBQVcsUUFBTSxFQUFFLEdBQUcsR0FBRyxVQUFVLEVBQUUsT0FBTyxNQUFNLEVBQUU7QUFBQSxNQUNuRSxhQUFZO0FBQUEsTUFDWixXQUFVO0FBQUE7QUFBQSxFQUNaLENBQ0YsR0FDQSxvQ0FBQyxTQUFJLFdBQVUsNEJBQ2Isb0NBQUMsYUFDQyxvQ0FBQyxXQUFNLFdBQVUscURBQWtELHFCQUFTLEdBQzVFO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxJQUFHO0FBQUEsTUFDSCxPQUFPLFFBQVE7QUFBQSxNQUNmLFVBQVUsT0FBSyxXQUFXLFFBQU0sRUFBRSxHQUFHLEdBQUcsVUFBVSxFQUFFLE9BQU8sTUFBTSxFQUFFO0FBQUEsTUFDbkUsYUFBWTtBQUFBLE1BQ1osV0FBVTtBQUFBO0FBQUEsRUFDWixDQUNGLEdBQ0Esb0NBQUMsYUFDQyxvQ0FBQyxXQUFNLFdBQVUscURBQWtELHFCQUFTLEdBQzVFO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxJQUFHO0FBQUEsTUFDSCxPQUFPLFFBQVE7QUFBQSxNQUNmLFVBQVUsT0FBSyxXQUFXLFFBQU0sRUFBRSxHQUFHLEdBQUcsWUFBWSxFQUFFLE9BQU8sTUFBTSxFQUFFO0FBQUEsTUFDckUsYUFBWTtBQUFBLE1BQ1osV0FBVTtBQUFBO0FBQUEsRUFDWixDQUNGLENBQ0YsR0FDQSxvQ0FBQyxhQUNDLG9DQUFDLFdBQU0sV0FBVSxxREFBa0QsOEJBQWUsR0FDbEY7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLElBQUc7QUFBQSxNQUNILE9BQU8sUUFBUTtBQUFBLE1BQ2YsVUFBVSxPQUFLLFdBQVcsUUFBTSxFQUFFLEdBQUcsR0FBRyxjQUFjLEVBQUUsT0FBTyxNQUFNLEVBQUU7QUFBQSxNQUN2RSxXQUFVO0FBQUE7QUFBQSxJQUNWLG9DQUFDLFlBQU8sT0FBTSxhQUFVLGVBQVE7QUFBQSxJQUNoQyxvQ0FBQyxZQUFPLE9BQU0sYUFBVSxpQkFBUztBQUFBLElBQ2pDLG9DQUFDLFlBQU8sT0FBTSxjQUFXLGlDQUFlO0FBQUEsRUFDMUMsQ0FDRixHQUNDLFFBQVEsaUJBQWlCLGFBQ3hCLG9DQUFDLFNBQUksV0FBVSwrR0FBNEcsaUJBQ3RILG9DQUFDLGdCQUFPLGdCQUFNLEdBQVMsME5BQzVCLEdBRUY7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLElBQUc7QUFBQSxNQUNILFVBQVU7QUFBQSxNQUNWLFdBQVU7QUFBQTtBQUFBLElBQ1QsV0FBVyxzQ0FBb0I7QUFBQSxFQUNsQyxDQUNGLENBRUosQ0FDRjtBQUVKO0FBRU8sZ0JBQVMsd0JBQXdCLEVBQUUsUUFBUSxTQUFTLFdBQVcsY0FBYyxHQUFHO0FBQ3JGLFFBQU0sQ0FBQyxRQUFRLFNBQVMsSUFBSSxTQUFTLEVBQUU7QUFDdkMsUUFBTSxDQUFDLGFBQWEsY0FBYyxJQUFJLFNBQVMsS0FBSztBQUNwRCxRQUFNLENBQUMsS0FBSyxNQUFNLElBQUksU0FBUyxFQUFFO0FBRWpDLE1BQUksQ0FBQyxPQUFRLFFBQU87QUFFcEIsUUFBTSxlQUFlLE9BQU8sTUFBTTtBQUNoQyxNQUFFLGVBQWU7QUFDakIsUUFBSSxDQUFDLE9BQU8sS0FBSyxLQUFLLFlBQWE7QUFDbkMsbUJBQWUsSUFBSTtBQUNuQixXQUFPLEVBQUU7QUFFVCxRQUFJO0FBQ0YsWUFBTSxNQUFNLE1BQU0sTUFBTSw4QkFBOEI7QUFBQSxRQUNwRCxRQUFRO0FBQUEsUUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLFFBQzlDLE1BQU0sS0FBSyxVQUFVLEVBQUUsUUFBUSxPQUFPLEtBQUssRUFBRSxDQUFDO0FBQUEsTUFDaEQsQ0FBQztBQUNELFlBQU0sSUFBSSxNQUFNLElBQUksS0FBSztBQUN6QixVQUFJLEVBQUUsTUFBTSxFQUFFLGFBQWE7QUFDekIsY0FBTSxVQUFVLENBQUM7QUFBQSxNQUNuQixPQUFPO0FBQ0wsZUFBTyxFQUFFLE9BQU8sMkdBQWdFO0FBQUEsTUFDbEY7QUFBQSxJQUNGLFFBQVE7QUFDTixhQUFPLDZFQUE2QztBQUFBLElBQ3RELFVBQUU7QUFDQSxxQkFBZSxLQUFLO0FBQUEsSUFDdEI7QUFBQSxFQUNGO0FBRUEsU0FDRSxvQ0FBQyxTQUFJLElBQUcsd0JBQXVCLFdBQVUseUdBQ3ZDLG9DQUFDLFNBQUksV0FBVSx1R0FDYixvQ0FBQyxTQUFJLFdBQVUsMElBQXVJLFdBRXRKLEdBQ0Esb0NBQUMsUUFBRyxXQUFVLHNEQUFtRCxzREFBMkIsR0FDNUYsb0NBQUMsT0FBRSxXQUFVLDZEQUEwRCxxUUFFdkUsR0FFQSxvQ0FBQyxVQUFLLFVBQVUsY0FBYyxXQUFVLHlCQUN0QyxvQ0FBQyxhQUNDLG9DQUFDLFdBQU0sV0FBVSxxREFBa0Qsd0RBQWdDLEdBQ25HO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxJQUFHO0FBQUEsTUFDSCxXQUFRO0FBQUEsTUFDUixPQUFPO0FBQUEsTUFDUCxVQUFVLE9BQUs7QUFBRSxrQkFBVSxFQUFFLE9BQU8sTUFBTSxZQUFZLENBQUM7QUFBRyxlQUFPLEVBQUU7QUFBQSxNQUFHO0FBQUEsTUFDdEUsYUFBWTtBQUFBLE1BQ1osV0FBVTtBQUFBLE1BQ1YsV0FBUztBQUFBO0FBQUEsRUFDWCxDQUNGLEdBRUMsT0FDQyxvQ0FBQyxPQUFFLFdBQVUsaUdBQ1YsR0FDSCxHQUdGO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxJQUFHO0FBQUEsTUFDSCxXQUFRO0FBQUEsTUFDUixVQUFVLGVBQWUsQ0FBQyxPQUFPLEtBQUs7QUFBQSxNQUN0QyxXQUFVO0FBQUE7QUFBQSxJQUVULGNBQWMsbUNBQXNCO0FBQUEsRUFDdkMsQ0FDRixHQUVBLG9DQUFDLFNBQUksV0FBVSxrRkFDYixvQ0FBQyxZQUFPLFNBQVMsZUFBZSxXQUFVLDhDQUEyQyw0Q0FFckYsR0FDQSxvQ0FBQyxZQUFPLFNBQVMsU0FBUyxXQUFVLHFDQUFrQyxjQUV0RSxDQUNGLENBQ0YsQ0FDRjtBQUVKOyIsCiAgIm5hbWVzIjogW10KfQo=
