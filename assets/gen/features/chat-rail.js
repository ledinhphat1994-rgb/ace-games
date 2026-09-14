// GEN TU src/features/chat-rail.jsx — KHONG SUA TAY
const EMOJI_CATEGORIES = [
  {
    name: "M\u1EB7t c\u01B0\u1EDDi",
    icon: "\u{1F60A}",
    emojis: ["\u{1F600}", "\u{1F603}", "\u{1F604}", "\u{1F601}", "\u{1F606}", "\u{1F605}", "\u{1F602}", "\u{1F923}", "\u{1F60A}", "\u{1F607}", "\u{1F642}", "\u{1F643}", "\u{1F609}", "\u{1F60C}", "\u{1F60D}", "\u{1F970}", "\u{1F618}", "\u{1F60B}", "\u{1F61B}", "\u{1F61C}", "\u{1F92A}", "\u{1F60E}", "\u{1F973}", "\u{1F929}", "\u{1F914}", "\u{1F92B}", "\u{1F634}", "\u{1F637}", "\u{1F92F}", "\u{1F920}"]
  },
  {
    name: "C\u1EA3m x\xFAc & Tay",
    icon: "\u2764\uFE0F",
    emojis: ["\u2764\uFE0F", "\u{1F9E1}", "\u{1F49B}", "\u{1F49A}", "\u{1F499}", "\u{1F49C}", "\u{1F5A4}", "\u{1F90D}", "\u{1F494}", "\u{1F496}", "\u{1F525}", "\u{1F4AF}", "\u2728", "\u{1F31F}", "\u2B50", "\u{1F4A5}", "\u{1F4AC}", "\u{1F44D}", "\u{1F44E}", "\u{1F44F}", "\u{1F64C}", "\u{1F91D}", "\u{1F44A}", "\u270C\uFE0F", "\u{1F91E}", "\u{1F91F}", "\u{1F44C}", "\u{1F44B}", "\u{1F64F}"]
  },
  {
    name: "Tr\u01B0\u1EDDng h\u1ECDc & Vui",
    icon: "\u{1F393}",
    emojis: ["\u{1F4DA}", "\u{1F4D6}", "\u{1F4D5}", "\u{1F4D7}", "\u{1F4D8}", "\u{1F393}", "\u{1F3EB}", "\u{1F392}", "\u{1F4DD}", "\u270F\uFE0F", "\u{1F3AF}", "\u{1F3AE}", "\u{1F3B2}", "\u{1F3C6}", "\u{1F947}", "\u2615", "\u{1F355}", "\u{1F370}", "\u{1F382}", "\u{1F680}", "\u{1F4A1}", "\u{1F389}", "\u{1F388}", "\u{1F3B5}", "\u{1F3B6}", "\u{1F431}", "\u{1F436}", "\u{1F338}", "\u{1F340}"]
  }
];
function EmojiPickerPopup({ onSelect, onClose }) {
  const [activeCat, setActiveCat] = React.useState(0);
  const popupRef = React.useRef(null);
  React.useEffect(() => {
    const handleOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [onClose]);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: popupRef,
      className: "absolute bottom-full mb-2 right-0 left-0 z-50 bg-[#151A23] border border-cyan-500/30 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl animate-scaleIn max-w-[320px] mx-auto sm:ml-auto sm:mr-0"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between pb-2 border-b border-white/10 mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 overflow-x-auto" }, EMOJI_CATEGORIES.map((cat, idx) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: cat.name,
        type: "button",
        onClick: () => setActiveCat(idx),
        className: `px-2 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${activeCat === idx ? "bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40" : "text-slate-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", { className: "mr-1" }, cat.icon),
      /* @__PURE__ */ React.createElement("span", null, cat.name)
    ))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onClose,
        className: "text-slate-400 hover:text-white text-xs px-1 shrink-0"
      },
      "\u2715"
    )),
    /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-6 gap-1 max-h-40 overflow-y-auto p-1" }, EMOJI_CATEGORIES[activeCat].emojis.map((emoji) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: emoji,
        type: "button",
        onClick: () => onSelect(emoji),
        className: "w-9 h-9 flex items-center justify-center text-lg rounded-xl hover:bg-white/10 active:scale-90 transition-transform"
      },
      emoji
    )))
  );
}
export function CampusChatRail({ auth, onRequireAuth, className = "", isActive = true }) {
  const [tab, setTab] = React.useState("campus");
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(null);
  const handleInsertEmoji = (emoji, target) => {
    if (target === "campus") {
      setCampusInput((prev) => prev + emoji);
    } else if (target === "class") {
      setClassInput((prev) => prev + emoji);
    } else if (target === "dm") {
      setDmInput((prev) => prev + emoji);
    }
  };
  const [unreadCampus, setUnreadCampus] = React.useState(0);
  const [unreadClass, setUnreadClass] = React.useState(0);
  const [unreadDms, setUnreadDms] = React.useState({});
  const [totalDms, setTotalDms] = React.useState(0);
  const [pendingFriendRequestsCount, setPendingFriendRequestsCount] = React.useState(0);
  const isCampusComposingRef = React.useRef(false);
  const isClassComposingRef = React.useRef(false);
  const isDmComposingRef = React.useRef(false);
  const formatBadge = (num) => {
    if (!num || num <= 0) return null;
    return num > 99 ? "99+" : String(num);
  };
  const [campusMessages, setCampusMessages] = React.useState([]);
  const [campusInput, setCampusInput] = React.useState("");
  const [campusSending, setCampusSending] = React.useState(false);
  const [campusNotice, setCampusNotice] = React.useState("");
  const lastCampusMessageIdRef = React.useRef(0);
  const campusEndRef = React.useRef(null);
  const [classMessages, setClassMessages] = React.useState([]);
  const [classInput, setClassInput] = React.useState("");
  const [classSending, setClassSending] = React.useState(false);
  const [classNotice, setClassNotice] = React.useState("");
  const [classLopId, setClassLopId] = React.useState(auth?.user?.lopId || 1);
  const [teacherClasses, setTeacherClasses] = React.useState([]);
  const [classTenLop, setClassTenLop] = React.useState("");
  const lastClassMessageIdRef = React.useRef(0);
  const classEndRef = React.useRef(null);
  const [friends, setFriends] = React.useState([]);
  const [pendingIncoming, setPendingIncoming] = React.useState([]);
  const [activeFriend, setActiveFriend] = React.useState(null);
  const [dmMessages, setDmMessages] = React.useState([]);
  const [dmInput, setDmInput] = React.useState("");
  const [dmSending, setDmSending] = React.useState(false);
  const [dmNotice, setDmNotice] = React.useState("");
  const lastDmMessageIdRef = React.useRef(0);
  const dmEndRef = React.useRef(null);
  const [showAddFriend, setShowAddFriend] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [actionFeedback, setActionFeedback] = React.useState("");
  const [reportModal, setReportModal] = React.useState(null);
  const [reportReason, setReportReason] = React.useState("");
  const [reporting, setReporting] = React.useState(false);
  const tabRef = React.useRef(tab);
  const activeFriendRef = React.useRef(activeFriend);
  React.useEffect(() => {
    tabRef.current = tab;
  }, [tab]);
  React.useEffect(() => {
    activeFriendRef.current = activeFriend;
    lastDmMessageIdRef.current = 0;
  }, [activeFriend]);
  const isActiveCampusAccount = Boolean(!auth?.isGuest && auth?.user);
  const hasClassAccess = Boolean(auth?.user?.isTeacher || auth?.user?.isLinkedStudent);
  React.useEffect(() => {
    if (!hasClassAccess && tab === "class") {
      setTab("campus");
    }
  }, [hasClassAccess, tab]);
  const taiUnreadState = React.useCallback(async () => {
    if (!isActiveCampusAccount) return;
    try {
      const res = await fetch("/api/chat-read-state");
      const d = await res.json();
      if (d.ok) {
        setUnreadCampus(d.campus || 0);
        setUnreadClass(d.class || 0);
        setUnreadDms(d.dms || {});
        setTotalDms(d.totalDms || 0);
        setPendingFriendRequestsCount(d.pendingFriendRequests || 0);
      }
    } catch {
    }
  }, [isActiveCampusAccount]);
  const markCampusRead = React.useCallback(async (maxId = 0) => {
    setUnreadCampus(0);
    if (!isActiveCampusAccount) return;
    try {
      await fetch("/api/chat-read-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelType: "campus", channelKey: "campus", lastReadId: maxId })
      });
    } catch {
    }
  }, [isActiveCampusAccount]);
  const markClassRead = React.useCallback(async (lopId, maxId = 0) => {
    setUnreadClass(0);
    if (!isActiveCampusAccount || !lopId) return;
    try {
      await fetch("/api/chat-read-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelType: "class", channelKey: "lop:" + lopId, lastReadId: maxId })
      });
    } catch {
    }
  }, [isActiveCampusAccount]);
  const markDmRead = React.useCallback(async (friendId, maxId = 0) => {
    setUnreadDms((prev) => ({ ...prev, [friendId]: 0 }));
    if (!isActiveCampusAccount || !friendId) return;
    try {
      await fetch("/api/chat-read-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelType: "dm", channelKey: "peer:" + friendId, lastReadId: maxId })
      });
    } catch {
    }
  }, [isActiveCampusAccount]);
  const taiCampusChat = React.useCallback(async (sauId = 0) => {
    if (!isActiveCampusAccount) return;
    try {
      const url = sauId > 0 ? `/api/campus-chat?sauId=${sauId}&limit=50` : "/api/campus-chat?limit=50";
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      const data = await res.json();
      if (data.ok && Array.isArray(data.messages)) {
        if (sauId > 0) {
          if (data.messages.length > 0) {
            setCampusMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newOnes = data.messages.filter((m) => !existingIds.has(m.id));
              if (newOnes.length === 0) return prev;
              const next = [...prev, ...newOnes];
              lastCampusMessageIdRef.current = Math.max(...next.map((m) => m.id || 0));
              return next;
            });
          }
        } else {
          setCampusMessages(data.messages);
          if (data.messages.length > 0) {
            lastCampusMessageIdRef.current = Math.max(...data.messages.map((m) => m.id || 0));
          }
        }
      }
    } catch {
    }
  }, [isActiveCampusAccount]);
  const taiClassChat = React.useCallback(async (sauId = 0) => {
    if (!hasClassAccess) return;
    try {
      const lopParam = auth?.user?.isTeacher && classLopId ? `&lopId=${classLopId}` : "";
      const url = sauId > 0 ? `/api/chat?sauId=${sauId}${lopParam}` : `/api/chat${lopParam ? "?" + lopParam.slice(1) : ""}`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      const data = await res.json();
      if (data.ok) {
        if (Array.isArray(data.cacLop) && data.cacLop.length > 0) {
          setTeacherClasses(data.cacLop);
        }
        if (data.tenLop) setClassTenLop(data.tenLop);
        if (Array.isArray(data.tinNhan)) {
          if (sauId > 0) {
            if (data.tinNhan.length > 0) {
              setClassMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m.id));
                const newOnes = data.tinNhan.filter((m) => !existingIds.has(m.id));
                if (newOnes.length === 0) return prev;
                const next = [...prev, ...newOnes];
                lastClassMessageIdRef.current = Math.max(...next.map((m) => m.id || 0));
                return next;
              });
            }
          } else {
            setClassMessages(data.tinNhan);
            if (data.tinNhan.length > 0) {
              lastClassMessageIdRef.current = Math.max(...data.tinNhan.map((m) => m.id || 0));
            }
          }
        }
      }
    } catch {
    }
  }, [hasClassAccess, auth?.user?.isTeacher, classLopId]);
  const taiFriends = React.useCallback(async () => {
    if (!isActiveCampusAccount) return;
    try {
      const res = await fetch("/api/campus-friends", { headers: { "Accept": "application/json" } });
      const data = await res.json();
      if (data.ok) {
        setFriends(data.friends || []);
        setPendingIncoming(data.pendingIncoming || []);
      }
    } catch {
    }
  }, [isActiveCampusAccount]);
  const taiDmMessages = React.useCallback(async (friendId, sauId = 0) => {
    if (!friendId || !isActiveCampusAccount) return;
    try {
      const url = sauId > 0 ? `/api/campus-dm?friendAccountId=${friendId}&sauId=${sauId}&limit=50` : `/api/campus-dm?friendAccountId=${friendId}&limit=50`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      const data = await res.json();
      if (data.ok && Array.isArray(data.messages)) {
        if (sauId > 0) {
          if (data.messages.length > 0) {
            setDmMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newOnes = data.messages.filter((m) => !existingIds.has(m.id));
              if (newOnes.length === 0) return prev;
              const next = [...prev, ...newOnes];
              lastDmMessageIdRef.current = Math.max(...next.map((m) => m.id || 0));
              return next;
            });
          }
        } else {
          setDmMessages(data.messages);
          if (data.messages.length > 0) {
            lastDmMessageIdRef.current = Math.max(...data.messages.map((m) => m.id || 0));
          }
        }
      }
    } catch {
    }
  }, [isActiveCampusAccount]);
  React.useEffect(() => {
    if (!isActiveCampusAccount || !isActive) return;
    if (tab === "campus") {
      taiCampusChat(0);
    } else if (tab === "class") {
      if (hasClassAccess) taiClassChat(0);
    } else if (tab === "me") {
      if (activeFriend) {
        taiDmMessages(activeFriend.accountId, 0);
      } else {
        taiFriends();
      }
    }
    taiUnreadState();
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const currentTab = tabRef.current;
      const currentFriend = activeFriendRef.current;
      taiUnreadState();
      if (currentTab === "campus") {
        taiCampusChat(lastCampusMessageIdRef.current);
      } else if (currentTab === "class") {
        taiClassChat(lastClassMessageIdRef.current);
      } else if (currentTab === "me") {
        if (currentFriend) {
          taiDmMessages(currentFriend.accountId, lastDmMessageIdRef.current);
        } else {
          taiFriends();
        }
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isActiveCampusAccount, hasClassAccess, isActive, tab, activeFriend?.accountId, classLopId, taiCampusChat, taiClassChat, taiFriends, taiDmMessages]);
  React.useEffect(() => {
    if (tab === "campus" && campusEndRef.current) {
      const p = campusEndRef.current.parentElement;
      if (p && p.scrollHeight > p.clientHeight) {
        p.scrollTo({ top: p.scrollHeight, behavior: "smooth" });
      } else {
        campusEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    }
  }, [campusMessages.length, tab]);
  React.useEffect(() => {
    if (tab === "class" && classEndRef.current) {
      const p = classEndRef.current.parentElement;
      if (p && p.scrollHeight > p.clientHeight) {
        p.scrollTo({ top: p.scrollHeight, behavior: "smooth" });
      } else {
        classEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    }
  }, [classMessages.length, tab]);
  React.useEffect(() => {
    if (tab === "me" && activeFriend && dmEndRef.current) {
      const p = dmEndRef.current.parentElement;
      if (p && p.scrollHeight > p.clientHeight) {
        p.scrollTo({ top: p.scrollHeight, behavior: "smooth" });
      } else {
        dmEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    }
  }, [dmMessages.length, tab, activeFriend]);
  const handleSendCampus = async (e) => {
    e?.preventDefault();
    const text = campusInput.trim();
    if (!text || campusSending) return;
    setCampusInput("");
    setCampusSending(true);
    setCampusNotice("");
    try {
      const res = await fetch("/api/campus-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noiDung: text })
      });
      const data = await res.json();
      if (data.ok && data.message) {
        setCampusMessages((prev) => {
          const next = [...prev, data.message];
          lastCampusMessageIdRef.current = Math.max(lastCampusMessageIdRef.current, data.message.id || 0);
          return next;
        });
        markCampusRead(data.message.id);
      } else {
        setCampusNotice(data.loi || "Kh\xF4ng g\u1EEDi \u0111\u01B0\u1EE3c tin nh\u1EAFn.");
        setCampusInput((cur) => cur ? cur : text);
      }
    } catch {
      setCampusNotice("L\u1ED7i k\u1EBFt n\u1ED1i khi g\u1EEDi tin nh\u1EAFn.");
      setCampusInput((cur) => cur ? cur : text);
    } finally {
      setCampusSending(false);
    }
  };
  const handleDeleteCampus = async (id) => {
    if (!confirm("B\u1EA1n c\xF3 ch\u1EAFc mu\u1ED1n thu h\u1ED3i tin nh\u1EAFn n\xE0y?")) return;
    try {
      const res = await fetch(`/api/campus-chat?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setCampusMessages((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert(data.loi || "Kh\xF4ng th\u1EC3 x\xF3a tin nh\u1EAFn.");
      }
    } catch {
      alert("L\u1ED7i k\u1EBFt n\u1ED1i khi x\xF3a tin nh\u1EAFn.");
    }
  };
  const handleSendClass = async (e) => {
    e?.preventDefault();
    const text = classInput.trim();
    if (!text || classSending) return;
    setClassInput("");
    setClassSending(true);
    setClassNotice("");
    try {
      const payload = { noiDung: text };
      if (auth?.user?.isTeacher && classLopId) payload.lopId = classLopId;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok && data.tinNhan) {
        setClassMessages((prev) => {
          const next = [...prev, data.tinNhan];
          lastClassMessageIdRef.current = Math.max(lastClassMessageIdRef.current, data.tinNhan.id || 0);
          return next;
        });
        markClassRead(classLopId, data.tinNhan.id);
      } else {
        setClassNotice(data.loi || "Kh\xF4ng g\u1EEDi \u0111\u01B0\u1EE3c tin nh\u1EAFn.");
        setClassInput((cur) => cur ? cur : text);
      }
    } catch {
      setClassNotice("L\u1ED7i k\u1EBFt n\u1ED1i khi g\u1EEDi tin nh\u1EAFn.");
      setClassInput((cur) => cur ? cur : text);
    } finally {
      setClassSending(false);
    }
  };
  const handleSendDm = async (e) => {
    e?.preventDefault();
    const text = dmInput.trim();
    if (!text || !activeFriend || dmSending) return;
    setDmInput("");
    setDmSending(true);
    setDmNotice("");
    try {
      const res = await fetch("/api/campus-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverAccountId: activeFriend.accountId, noiDung: text })
      });
      const data = await res.json();
      if (data.ok && data.message) {
        setDmMessages((prev) => {
          const next = [...prev, data.message];
          lastDmMessageIdRef.current = Math.max(lastDmMessageIdRef.current, data.message.id || 0);
          return next;
        });
        markDmRead(activeFriend.accountId, data.message.id);
      } else {
        setDmNotice(data.loi || "Kh\xF4ng th\u1EC3 g\u1EEDi tin nh\u1EAFn.");
        setDmInput((cur) => cur ? cur : text);
      }
    } catch {
      setDmNotice("L\u1ED7i k\u1EBFt n\u1ED1i khi g\u1EEDi tin nh\u1EAFn ri\xEAng.");
      setDmInput((cur) => cur ? cur : text);
    } finally {
      setDmSending(false);
    }
  };
  const handleSearchFriends = async (val) => {
    setSearchQuery(val);
    const trimmed = val.trim();
    if (trimmed.length < 4) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    setActionFeedback("");
    try {
      const res = await fetch("/api/campus-friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", query: trimmed })
      });
      const data = await res.json();
      if (data.ok) {
        setSearchResults(data.list || []);
      }
    } catch {
    } finally {
      setSearchLoading(false);
    }
  };
  const handleRequestFriend = async (targetId) => {
    try {
      const res = await fetch("/api/campus-friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", targetAccountId: targetId })
      });
      const data = await res.json();
      if (data.ok) {
        setActionFeedback("\u0110\xE3 g\u1EEDi l\u1EDDi m\u1EDDi k\u1EBFt b\u1EA1n.");
        setSearchResults((prev) => prev.map((u) => u.id === targetId ? { ...u, friendshipStatus: "sent_pending" } : u));
      } else {
        alert(data.loi || "Kh\xF4ng th\u1EC3 g\u1EEDi l\u1EDDi m\u1EDDi.");
      }
    } catch {
      alert("L\u1ED7i k\u1EBFt n\u1ED1i khi g\u1EEDi l\u1EDDi m\u1EDDi k\u1EBFt b\u1EA1n.");
    }
  };
  const handleAcceptFriend = async (reqId, fromAccId) => {
    try {
      const res = await fetch("/api/campus-friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", requestId: reqId, requesterAccountId: fromAccId })
      });
      const data = await res.json();
      if (data.ok) {
        taiFriends();
      } else {
        alert(data.loi || "L\u1ED7i khi ch\u1EA5p nh\u1EADn.");
      }
    } catch {
    }
  };
  const handleDeclineFriend = async (reqId, fromAccId) => {
    try {
      const res = await fetch("/api/campus-friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline", requestId: reqId, requesterAccountId: fromAccId })
      });
      const data = await res.json();
      if (data.ok) {
        taiFriends();
      } else {
        alert(data.loi || "L\u1ED7i khi t\u1EEB ch\u1ED1i.");
      }
    } catch {
    }
  };
  const handleUnfriend = async (friendId) => {
    if (!confirm("B\u1EA1n c\xF3 mu\u1ED1n h\u1EE7y k\u1EBFt b\u1EA1n v\u1EDBi ng\u01B0\u1EDDi n\xE0y?")) return;
    try {
      const res = await fetch("/api/campus-friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unfriend", friendAccountId: friendId })
      });
      const data = await res.json();
      if (data.ok) {
        setActiveFriend(null);
        taiFriends();
      }
    } catch {
    }
  };
  const handleBlock = async (targetId) => {
    if (!confirm("B\u1EA1n c\xF3 ch\u1EAFc mu\u1ED1n ch\u1EB7n ng\u01B0\u1EDDi n\xE0y? C\u1EA3 hai b\xEAn s\u1EBD kh\xF4ng th\u1EC3 nh\u1EAFn tin ho\u1EB7c g\u1EEDi l\u1EDDi m\u1EDDi k\u1EBFt b\u1EA1n.")) return;
    try {
      const res = await fetch("/api/campus-friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "block", targetAccountId: targetId })
      });
      const data = await res.json();
      if (data.ok) {
        setActiveFriend(null);
        taiFriends();
        alert("\u0110\xE3 ch\u1EB7n ng\u01B0\u1EDDi d\xF9ng.");
      }
    } catch {
    }
  };
  const handleSubmitReport = async (e) => {
    e?.preventDefault();
    if (!reportReason.trim() || !reportModal?.targetId || reporting) return;
    setReporting(true);
    try {
      const payload = {
        action: "report",
        targetAccountId: reportModal.targetId,
        reason: reportReason.trim()
      };
      if (reportModal.messageId) {
        payload.messageId = reportModal.messageId;
      }
      const res = await fetch("/api/campus-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        alert("\u0110\xE3 g\u1EEDi b\xE1o c\xE1o cho gi\xE1o vi\xEAn xem x\xE9t.");
        setReportModal(null);
        setReportReason("");
      } else {
        alert(data.loi || "L\u1ED7i khi g\u1EEDi b\xE1o c\xE1o.");
      }
    } catch {
      alert("L\u1ED7i k\u1EBFt n\u1ED1i khi g\u1EEDi b\xE1o c\xE1o.");
    } finally {
      setReporting(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { id: "campus-chat-rail", className: `bg-[#151A23] border border-white/10 rounded-2xl shadow-xl flex flex-col overflow-hidden h-[560px] ${className}` }, /* @__PURE__ */ React.createElement("div", { className: "px-3 py-2 border-b border-white/10 flex items-center justify-between bg-[#111620]/60 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 bg-[#0B0E14] p-1 rounded-xl border border-white/10 w-full" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "chat-tab-campus",
      onClick: () => {
        setTab("campus");
        setActiveFriend(null);
        markCampusRead(lastCampusMessageIdRef.current);
      },
      className: `flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${tab === "campus" ? "bg-[#00F2FE] text-black shadow-sm" : "text-slate-400 hover:text-white"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "Campus"),
    unreadCampus > 0 && /* @__PURE__ */ React.createElement("span", { id: "badge-unread-campus", className: "px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse" }, formatBadge(unreadCampus))
  ), hasClassAccess && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "chat-tab-class",
      onClick: () => {
        setTab("class");
        setActiveFriend(null);
        markClassRead(classLopId, lastClassMessageIdRef.current);
      },
      className: `flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${tab === "class" ? "bg-[#00F2FE] text-black shadow-sm" : "text-slate-400 hover:text-white"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "L\u1EDBp"),
    unreadClass > 0 && /* @__PURE__ */ React.createElement("span", { id: "badge-unread-class", className: "px-1.5 py-0.2 rounded-full text-[9px] font-black bg-cyan-400 text-black" }, formatBadge(unreadClass))
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "chat-tab-me",
      onClick: () => {
        setTab("me");
        taiFriends();
      },
      className: `flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 relative ${tab === "me" ? "bg-[#00F2FE] text-black shadow-sm" : "text-slate-400 hover:text-white"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "T\xF4i"),
    totalDms + pendingIncoming.length + pendingFriendRequestsCount > 0 && /* @__PURE__ */ React.createElement("span", { id: "badge-unread-me", className: "px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-black" }, formatBadge(totalDms + Math.max(pendingIncoming.length, pendingFriendRequestsCount)))
  ))), auth?.isGuest ? /* @__PURE__ */ React.createElement("div", { className: "flex-1 p-5 flex flex-col items-center justify-center text-center gap-3 bg-white/[0.01]" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl" }, "\u{1F510}"), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-300" }, "\u0110\u0103ng nh\u1EADp \u0111\u1EC3 tham gia Chat"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400" }, "Tr\xF2 chuy\u1EC7n c\xF9ng b\u1EA1n b\xE8 v\xE0 gi\xE1o vi\xEAn to\xE0n tr\u01B0\u1EDDng."), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onRequireAuth,
      className: "mt-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black text-xs font-extrabold shadow-md hover:opacity-95 active:scale-95 transition-all"
    },
    "\u0110\u0103ng nh\u1EADp ngay"
  )) : tab === "campus" ? (
    /* ─── TAB: CAMPUS CHAT (TOÀN TRƯỜNG — MỌI TÀI KHOẢN CAMPUS HOẠT ĐỘNG) ─── */
    /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-h-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-3 space-y-2.5 text-xs" }, campusMessages.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "h-full flex items-center justify-center text-center p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400" }, "Ch\u01B0a c\xF3 tin nh\u1EAFn n\xE0o. H\xE3y g\u1EEDi l\u1EDDi ch\xE0o \u0111\u1EA7u ti\xEAn!")) : campusMessages.map((msg) => /* @__PURE__ */ React.createElement("div", { key: msg.id, className: `group flex flex-col ${msg.isMe ? "items-end" : "items-start"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 mb-0.5 px-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-slate-300" }, msg.senderName), msg.role === "teacher" ? /* @__PURE__ */ React.createElement("span", { className: "px-1 py-0.2 rounded text-[8px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30" }, "GVCN") : msg.classBadge ? /* @__PURE__ */ React.createElement("span", { className: "px-1 py-0.2 rounded text-[8px] font-bold bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/20" }, "\u2713 ", msg.classBadge) : null, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-slate-400" }, new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), (msg.isMe || auth?.user?.isVerifiedTeacher) && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleDeleteCampus(msg.id),
        className: "opacity-0 group-hover:opacity-100 text-[10px] text-rose-400 hover:text-rose-300 transition-opacity ml-1",
        title: "Thu h\u1ED3i tin nh\u1EAFn"
      },
      "\u2715"
    )), /* @__PURE__ */ React.createElement("div", { className: `px-2.5 py-1.5 rounded-xl max-w-[85%] break-words text-xs leading-relaxed ${msg.isMe ? "bg-[#00F2FE]/15 text-white border border-[#00F2FE]/30 rounded-tr-none" : "bg-[#0B0E14] text-slate-200 border border-white/5 rounded-tl-none"}` }, msg.content))), /* @__PURE__ */ React.createElement("div", { ref: campusEndRef })), campusNotice && /* @__PURE__ */ React.createElement("p", { className: "px-3 py-1 text-[10px] text-amber-400 bg-amber-500/10 border-t border-amber-500/20" }, campusNotice), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSendCampus, className: "p-2 border-t border-white/10 bg-[#111620]/80 flex items-center gap-2 shrink-0 relative" }, showEmojiPicker === "campus" && /* @__PURE__ */ React.createElement(
      EmojiPickerPopup,
      {
        onSelect: (emoji) => handleInsertEmoji(emoji, "campus"),
        onClose: () => setShowEmojiPicker(null)
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowEmojiPicker(showEmojiPicker === "campus" ? null : "campus"),
        className: "p-2 rounded-xl text-slate-400 hover:text-yellow-300 hover:bg-white/5 text-base transition-colors shrink-0",
        title: "Th\xEAm bi\u1EC3u t\u01B0\u1EE3ng c\u1EA3m x\xFAc"
      },
      "\u{1F60A}"
    ), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        id: "input-campus-chat",
        rows: 1,
        placeholder: "Nh\u1EAFn tin to\xE0n Campus...",
        value: campusInput,
        onChange: (e) => setCampusInput(e.target.value),
        onCompositionStart: () => {
          isCampusComposingRef.current = true;
        },
        onCompositionEnd: () => {
          isCampusComposingRef.current = false;
        },
        onKeyDown: (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            if (e.nativeEvent?.isComposing || isCampusComposingRef.current) return;
            e.preventDefault();
            handleSendCampus();
          }
        },
        maxLength: 500,
        className: "flex-1 bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/60 resize-none min-h-[38px] max-h-24"
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        id: "btn-send-campus-chat",
        disabled: !campusInput.trim() || campusSending,
        className: "px-3 py-2 rounded-xl bg-[#00F2FE] hover:bg-[#00e1ec] text-black text-xs font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
      },
      "G\u1EEDi"
    )))
  ) : tab === "class" ? (
    /* ─── TAB: LỚP (CHAT NỘI BỘ LỚP — CHỈ DÀNH CHO THÀNH VIÊN ĐÃ XÁC MINH) ─── */
    /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-h-0" }, /* @__PURE__ */ React.createElement("div", { className: "px-3 py-1.5 bg-[#0B0E14] border-b border-white/5 flex items-center justify-between text-xs" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-bold text-cyan-300" }, "\u{1F3EB} ", classTenLop || auth?.user?.tenLop || "Ph\xF2ng chat l\u1EDBp"), auth?.user?.isTeacher && teacherClasses.length > 1 && /* @__PURE__ */ React.createElement(
      "select",
      {
        value: classLopId,
        onChange: (e) => {
          const id = Number(e.target.value);
          setClassLopId(id);
          lastClassMessageIdRef.current = 0;
        },
        className: "bg-[#151A23] border border-white/15 text-white text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none"
      },
      teacherClasses.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.ten))
    )), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-3 space-y-2.5 text-xs" }, classMessages.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "h-full flex items-center justify-center text-center p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400" }, "Ch\u01B0a c\xF3 tin nh\u1EAFn l\u1EDBp. H\xE3y g\u1EEDi l\u1EDDi ch\xE0o \u0111\u1EA7u ti\xEAn!")) : classMessages.map((msg) => /* @__PURE__ */ React.createElement("div", { key: msg.id, className: `group flex flex-col ${msg.laTinCuaToi ? "items-end" : "items-start"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 mb-0.5 px-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-slate-300" }, msg.tenNguoiGui), msg.vaiTro === "giao_vien" && /* @__PURE__ */ React.createElement("span", { className: "px-1 py-0.2 rounded text-[8px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30" }, "GVCN"), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-slate-400" }, msg.taoLuc ? (/* @__PURE__ */ new Date(msg.taoLuc.replace(" ", "T") + "Z")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "")), /* @__PURE__ */ React.createElement("div", { className: `px-2.5 py-1.5 rounded-xl max-w-[85%] break-words text-xs leading-relaxed ${msg.laTinCuaToi ? "bg-cyan-500/20 text-cyan-100 border border-cyan-500/40 rounded-tr-none" : "bg-[#0B0E14] text-slate-200 border border-white/5 rounded-tl-none"}` }, msg.noiDung))), /* @__PURE__ */ React.createElement("div", { ref: classEndRef })), classNotice && /* @__PURE__ */ React.createElement("p", { className: "px-3 py-1 text-[10px] text-amber-400 bg-amber-500/10 border-t border-amber-500/20" }, classNotice), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSendClass, className: "p-2 border-t border-white/10 bg-[#111620]/80 flex items-center gap-2 shrink-0 relative" }, showEmojiPicker === "class" && /* @__PURE__ */ React.createElement(
      EmojiPickerPopup,
      {
        onSelect: (emoji) => handleInsertEmoji(emoji, "class"),
        onClose: () => setShowEmojiPicker(null)
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowEmojiPicker(showEmojiPicker === "class" ? null : "class"),
        className: "p-2 rounded-xl text-slate-400 hover:text-yellow-300 hover:bg-white/5 text-base transition-colors shrink-0",
        title: "Th\xEAm bi\u1EC3u t\u01B0\u1EE3ng c\u1EA3m x\xFAc"
      },
      "\u{1F60A}"
    ), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        id: "input-class-chat",
        rows: 1,
        placeholder: "Nh\u1EAFn tin v\u1EDBi l\u1EDBp...",
        value: classInput,
        onChange: (e) => setClassInput(e.target.value),
        onCompositionStart: () => {
          isClassComposingRef.current = true;
        },
        onCompositionEnd: () => {
          isClassComposingRef.current = false;
        },
        onKeyDown: (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            if (e.nativeEvent?.isComposing || isClassComposingRef.current) return;
            e.preventDefault();
            handleSendClass();
          }
        },
        maxLength: 300,
        className: "flex-1 bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 resize-none min-h-[38px] max-h-24"
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        id: "btn-send-class-chat",
        disabled: !classInput.trim() || classSending,
        className: "px-3 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
      },
      "G\u1EEDi"
    )))
  ) : (
    /* ─── TAB: TÔI (BẠN BÈ & TIN NHẮN RIÊNG 1-1) ─── */
    /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-h-0" }, !activeFriend ? (
      /* FRIEND LIST VIEW */
      /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-h-0" }, /* @__PURE__ */ React.createElement("div", { className: "p-2.5 border-b border-white/5 flex items-center justify-between bg-[#111620]/40 shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-slate-300" }, "B\u1EA1n b\xE8 (", friends.length, ")"), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setShowAddFriend(true),
          className: "px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00F2FE]/15 hover:text-[#00F2FE] text-slate-300 text-[11px] font-bold border border-white/10 transition-all flex items-center gap-1"
        },
        /* @__PURE__ */ React.createElement("span", null, "+"),
        /* @__PURE__ */ React.createElement("span", null, "K\u1EBFt b\u1EA1n")
      )), pendingIncoming.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "p-2 border-b border-white/5 bg-purple-950/20" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1.5 px-1" }, "L\u1EDDi m\u1EDDi k\u1EBFt b\u1EA1n (", pendingIncoming.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5" }, pendingIncoming.map((req) => /* @__PURE__ */ React.createElement("div", { key: req.requestId, className: "flex items-center justify-between p-1.5 rounded-lg bg-[#0B0E14] border border-white/5 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 pr-2" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-white truncate text-[11px]" }, req.displayName), /* @__PURE__ */ React.createElement("p", { className: "text-[9px] text-slate-400" }, "@", req.username, " ", req.classBadge ? `\u2022 ${req.classBadge}` : "")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 shrink-0" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => handleAcceptFriend(req.requestId, req.fromAccountId),
          className: "px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-bold"
        },
        "\u0110\u1ED3ng \xFD"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => handleDeclineFriend(req.requestId, req.fromAccountId),
          className: "px-1.5 py-0.5 rounded bg-white/5 text-slate-400 hover:text-white text-[10px]"
        },
        "\u2715"
      )))))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-2 space-y-1" }, friends.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col items-center justify-center text-center p-4" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl mb-1" }, "\u{1F465}"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400" }, "Ch\u01B0a c\xF3 b\u1EA1n b\xE8 n\xE0o."), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-400 mt-1" }, 'B\u1EA5m "+ K\u1EBFt b\u1EA1n" \u0111\u1EC3 t\xECm v\xE0 k\u1EBFt n\u1ED1i c\xF9ng b\u1EA1n b\xE8 tr\u01B0\u1EDDng.')) : friends.map((f) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: f.friendshipId,
          type: "button",
          onClick: () => {
            setActiveFriend(f);
            markDmRead(f.accountId);
            taiDmMessages(f.accountId);
          },
          className: "w-full flex items-center justify-between p-2 rounded-xl bg-[#0B0E14]/60 hover:bg-[#00F2FE]/10 border border-white/5 hover:border-[#00F2FE]/30 transition-all text-left group"
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 rounded-lg bg-gradient-to-tr from-[#00F2FE]/30 to-[#8B5CF6]/30 flex items-center justify-center font-bold text-xs text-white shrink-0" }, f.displayName ? f.displayName.charAt(0).toUpperCase() : "?"), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-white group-hover:text-[#00F2FE] transition-colors truncate" }, f.displayName), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-400 truncate" }, "@", f.username, " ", f.classBadge ? `\u2022 ${f.classBadge}` : ""))),
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 shrink-0" }, Boolean(unreadDms[f.accountId]) && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded-full bg-cyan-400 text-black font-black text-[9px]" }, formatBadge(unreadDms[f.accountId])), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-400 group-hover:text-white transition-colors" }, "\u203A"))
      ))))
    ) : (
      /* PRIVATE CONVERSATION VIEW */
      /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-h-0" }, /* @__PURE__ */ React.createElement("div", { className: "px-3 py-2 border-b border-white/10 flex items-center justify-between bg-[#111620]/60 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 min-w-0" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setActiveFriend(null),
          className: "p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold",
          title: "Quay l\u1EA1i danh s\xE1ch b\u1EA1n b\xE8"
        },
        "\u2039"
      ), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-white truncate" }, activeFriend.displayName), /* @__PURE__ */ React.createElement("p", { className: "text-[9px] text-slate-400 truncate" }, "@", activeFriend.username, " ", activeFriend.classBadge ? `\u2022 ${activeFriend.classBadge}` : ""))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setReportModal({ targetId: activeFriend.accountId, targetName: activeFriend.displayName }),
          className: "px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-amber-300 hover:bg-white/5 transition-all",
          title: "B\xE1o c\xE1o ng\u01B0\u1EDDi d\xF9ng n\xE0y"
        },
        "B\xE1o c\xE1o"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => handleBlock(activeFriend.accountId),
          className: "px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-all",
          title: "Ch\u1EB7n ng\u01B0\u1EDDi n\xE0y"
        },
        "Ch\u1EB7n"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => handleUnfriend(activeFriend.accountId),
          className: "px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all",
          title: "H\u1EE7y k\u1EBFt b\u1EA1n"
        },
        "H\u1EE7y b\u1EA1n"
      ))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-3 space-y-2 text-xs" }, dmMessages.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "h-full flex items-center justify-center text-center p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400" }, "B\u1EAFt \u0111\u1EA7u tr\xF2 chuy\u1EC7n ri\xEAng v\u1EDBi ", activeFriend.displayName, ".")) : dmMessages.map((msg) => /* @__PURE__ */ React.createElement("div", { key: msg.id, className: `group flex flex-col ${msg.isMe ? "items-end" : "items-start"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("div", { className: `px-2.5 py-1.5 rounded-xl max-w-[85%] break-words text-xs leading-relaxed ${msg.isMe ? "bg-[#00F2FE]/20 text-white border border-[#00F2FE]/40 rounded-tr-none" : "bg-[#0B0E14] text-slate-200 border border-white/10 rounded-tl-none"}` }, msg.content), !msg.isMe && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setReportModal({ targetId: activeFriend.accountId, targetName: activeFriend.displayName, messageId: msg.id, messageContent: msg.content }),
          className: "opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-amber-300 transition-opacity p-0.5",
          title: "B\xE1o c\xE1o tin nh\u1EAFn n\xE0y"
        },
        "\u{1F6A9}"
      )), /* @__PURE__ */ React.createElement("span", { className: "text-[8px] text-slate-400 mt-0.5 px-1" }, new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })))), /* @__PURE__ */ React.createElement("div", { ref: dmEndRef })), dmNotice && /* @__PURE__ */ React.createElement("p", { className: "px-3 py-1 text-[10px] text-amber-400 bg-amber-500/10 border-t border-amber-500/20" }, dmNotice), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSendDm, className: "p-2 border-t border-white/10 bg-[#111620]/80 flex items-center gap-2 shrink-0 relative" }, showEmojiPicker === "dm" && /* @__PURE__ */ React.createElement(
        EmojiPickerPopup,
        {
          onSelect: (emoji) => handleInsertEmoji(emoji, "dm"),
          onClose: () => setShowEmojiPicker(null)
        }
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setShowEmojiPicker(showEmojiPicker === "dm" ? null : "dm"),
          className: "p-2 rounded-xl text-slate-400 hover:text-yellow-300 hover:bg-white/5 text-base transition-colors shrink-0",
          title: "Th\xEAm bi\u1EC3u t\u01B0\u1EE3ng c\u1EA3m x\xFAc"
        },
        "\u{1F60A}"
      ), /* @__PURE__ */ React.createElement(
        "textarea",
        {
          id: "input-dm-chat",
          rows: 1,
          placeholder: `Nh\u1EAFn cho ${activeFriend.displayName}...`,
          value: dmInput,
          onChange: (e) => setDmInput(e.target.value),
          onCompositionStart: () => {
            isDmComposingRef.current = true;
          },
          onCompositionEnd: () => {
            isDmComposingRef.current = false;
          },
          onKeyDown: (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              if (e.nativeEvent?.isComposing || isDmComposingRef.current) return;
              e.preventDefault();
              handleSendDm();
            }
          },
          maxLength: 500,
          className: "flex-1 bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/60 resize-none min-h-[38px] max-h-24"
        }
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "submit",
          id: "btn-send-dm-chat",
          disabled: !dmInput.trim() || dmSending,
          className: "px-3 py-2 rounded-xl bg-[#00F2FE] hover:bg-[#00e1ec] text-black text-xs font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        },
        "G\u1EEDi"
      )))
    ))
  ), showAddFriend && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#151A23] border border-white/15 rounded-2xl max-w-sm w-full p-4 shadow-2xl flex flex-col gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between pb-2 border-b border-white/10" }, /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-bold text-white flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u2795"), /* @__PURE__ */ React.createElement("span", null, "K\u1EBFt b\u1EA1n m\u1EDBi")), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        setShowAddFriend(false);
        setSearchResults([]);
        setSearchQuery("");
      },
      className: "text-slate-400 hover:text-white text-sm"
    },
    "\u2715"
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Nh\u1EADp t\xEAn \u0111\u0103ng nh\u1EADp (t\u1ED1i thi\u1EC3u 4 k\xFD t\u1EF1)...",
      value: searchQuery,
      onChange: (e) => handleSearchFriends(e.target.value),
      className: "w-full bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]"
    }
  ), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-400 mt-1" }, "G\xF5 t\u1ED1i thi\u1EC3u 4 k\xFD t\u1EF1 (t\xEAn \u0111\u0103ng nh\u1EADp) \u0111\u1EC3 t\xECm ki\u1EBFm b\u1EA1n b\xE8.")), actionFeedback && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-emerald-400 font-bold" }, actionFeedback), /* @__PURE__ */ React.createElement("div", { className: "max-h-48 overflow-y-auto space-y-1.5" }, searchLoading ? /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 text-center py-2" }, "\u0110ang t\xECm ki\u1EBFm...") : searchResults.length === 0 ? searchQuery.trim().length >= 4 ? /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 text-center py-2" }, "Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n ph\xF9 h\u1EE3p.") : null : searchResults.map((u) => /* @__PURE__ */ React.createElement("div", { key: u.id, className: "flex items-center justify-between p-2 rounded-xl bg-[#0B0E14] border border-white/5 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 pr-2" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-white truncate" }, u.displayName), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-400" }, "@", u.username, " ", u.classBadge ? `\u2022 ${u.classBadge}` : "")), u.friendshipStatus === "friends" ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-emerald-400 shrink-0" }, "B\u1EA1n b\xE8") : u.friendshipStatus === "sent_pending" ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-amber-400 shrink-0" }, "\u0110\xE3 g\u1EEDi l\u1EDDi m\u1EDDi") : u.friendshipStatus === "received_pending" ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-purple-400 shrink-0" }, "\u0110ang ch\u1EDD b\u1EA1n duy\u1EC7t") : /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleRequestFriend(u.id),
      className: "px-2.5 py-1 rounded-lg bg-[#00F2FE] hover:bg-[#00e1ec] text-black font-bold text-[10px] shrink-0 transition-all"
    },
    "K\u1EBFt b\u1EA1n"
  )))))), reportModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmitReport, className: "bg-[#151A23] border border-white/15 rounded-2xl max-w-sm w-full p-4 shadow-2xl flex flex-col gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between pb-2 border-b border-white/10" }, /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-bold text-amber-300 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("span", null, reportModal.messageId ? "B\xE1o c\xE1o tin nh\u1EAFn" : `B\xE1o c\xE1o ng\u01B0\u1EDDi d\xF9ng: ${reportModal.targetName}`)), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setReportModal(null), className: "text-slate-400 hover:text-white text-sm" }, "\u2715")), reportModal.messageContent && /* @__PURE__ */ React.createElement("div", { className: "p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 italic" }, '"', reportModal.messageContent.slice(0, 100), reportModal.messageContent.length > 100 ? "..." : "", '"'), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400" }, "B\xE1o c\xE1o s\u1EBD \u0111\u01B0\u1EE3c chuy\u1EC3n th\u1EB3ng \u0111\u1EBFn Trung t\xE2m Ki\u1EC3m duy\u1EC7t c\u1EE7a Gi\xE1o vi\xEAn."), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      placeholder: "M\xF4 t\u1EA3 l\xFD do b\xE1o c\xE1o (ng\xF4n t\u1EEB kh\xF4ng ph\xF9 h\u1EE3p, l\xE0m phi\u1EC1n, spam...)",
      value: reportReason,
      onChange: (e) => setReportReason(e.target.value),
      maxLength: 500,
      rows: 3,
      required: true,
      className: "w-full bg-[#0B0E14] border border-white/10 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-end gap-2 pt-1" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setReportModal(null),
      className: "px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs"
    },
    "H\u1EE7y"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: !reportReason.trim() || reporting,
      className: "px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold disabled:opacity-50"
    },
    reporting ? "\u0110ang g\u1EEDi..." : "G\u1EEDi b\xE1o c\xE1o"
  )))));
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvY2hhdC1yYWlsLmpzeCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiXG5jb25zdCBFTU9KSV9DQVRFR09SSUVTID0gW1xuICB7XG4gICAgbmFtZTogJ01cdTFFQjd0IGNcdTAxQjBcdTFFRERpJyxcbiAgICBpY29uOiAnXHVEODNEXHVERTBBJyxcbiAgICBlbW9qaXM6IFsnXHVEODNEXHVERTAwJywgJ1x1RDgzRFx1REUwMycsICdcdUQ4M0RcdURFMDQnLCAnXHVEODNEXHVERTAxJywgJ1x1RDgzRFx1REUwNicsICdcdUQ4M0RcdURFMDUnLCAnXHVEODNEXHVERTAyJywgJ1x1RDgzRVx1REQyMycsICdcdUQ4M0RcdURFMEEnLCAnXHVEODNEXHVERTA3JywgJ1x1RDgzRFx1REU0MicsICdcdUQ4M0RcdURFNDMnLCAnXHVEODNEXHVERTA5JywgJ1x1RDgzRFx1REUwQycsICdcdUQ4M0RcdURFMEQnLCAnXHVEODNFXHVERDcwJywgJ1x1RDgzRFx1REUxOCcsICdcdUQ4M0RcdURFMEInLCAnXHVEODNEXHVERTFCJywgJ1x1RDgzRFx1REUxQycsICdcdUQ4M0VcdUREMkEnLCAnXHVEODNEXHVERTBFJywgJ1x1RDgzRVx1REQ3MycsICdcdUQ4M0VcdUREMjknLCAnXHVEODNFXHVERDE0JywgJ1x1RDgzRVx1REQyQicsICdcdUQ4M0RcdURFMzQnLCAnXHVEODNEXHVERTM3JywgJ1x1RDgzRVx1REQyRicsICdcdUQ4M0VcdUREMjAnXVxuICB9LFxuICB7XG4gICAgbmFtZTogJ0NcdTFFQTNtIHhcdTAwRkFjICYgVGF5JyxcbiAgICBpY29uOiAnXHUyNzY0XHVGRTBGJyxcbiAgICBlbW9qaXM6IFsnXHUyNzY0XHVGRTBGJywgJ1x1RDgzRVx1RERFMScsICdcdUQ4M0RcdURDOUInLCAnXHVEODNEXHVEQzlBJywgJ1x1RDgzRFx1REM5OScsICdcdUQ4M0RcdURDOUMnLCAnXHVEODNEXHVEREE0JywgJ1x1RDgzRVx1REQwRCcsICdcdUQ4M0RcdURDOTQnLCAnXHVEODNEXHVEQzk2JywgJ1x1RDgzRFx1REQyNScsICdcdUQ4M0RcdURDQUYnLCAnXHUyNzI4JywgJ1x1RDgzQ1x1REYxRicsICdcdTJCNTAnLCAnXHVEODNEXHVEQ0E1JywgJ1x1RDgzRFx1RENBQycsICdcdUQ4M0RcdURDNEQnLCAnXHVEODNEXHVEQzRFJywgJ1x1RDgzRFx1REM0RicsICdcdUQ4M0RcdURFNEMnLCAnXHVEODNFXHVERDFEJywgJ1x1RDgzRFx1REM0QScsICdcdTI3MENcdUZFMEYnLCAnXHVEODNFXHVERDFFJywgJ1x1RDgzRVx1REQxRicsICdcdUQ4M0RcdURDNEMnLCAnXHVEODNEXHVEQzRCJywgJ1x1RDgzRFx1REU0RiddXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVHJcdTAxQjBcdTFFRERuZyBoXHUxRUNEYyAmIFZ1aScsXG4gICAgaWNvbjogJ1x1RDgzQ1x1REY5MycsXG4gICAgZW1vamlzOiBbJ1x1RDgzRFx1RENEQScsICdcdUQ4M0RcdURDRDYnLCAnXHVEODNEXHVEQ0Q1JywgJ1x1RDgzRFx1RENENycsICdcdUQ4M0RcdURDRDgnLCAnXHVEODNDXHVERjkzJywgJ1x1RDgzQ1x1REZFQicsICdcdUQ4M0NcdURGOTInLCAnXHVEODNEXHVEQ0REJywgJ1x1MjcwRlx1RkUwRicsICdcdUQ4M0NcdURGQUYnLCAnXHVEODNDXHVERkFFJywgJ1x1RDgzQ1x1REZCMicsICdcdUQ4M0NcdURGQzYnLCAnXHVEODNFXHVERDQ3JywgJ1x1MjYxNScsICdcdUQ4M0NcdURGNTUnLCAnXHVEODNDXHVERjcwJywgJ1x1RDgzQ1x1REY4MicsICdcdUQ4M0RcdURFODAnLCAnXHVEODNEXHVEQ0ExJywgJ1x1RDgzQ1x1REY4OScsICdcdUQ4M0NcdURGODgnLCAnXHVEODNDXHVERkI1JywgJ1x1RDgzQ1x1REZCNicsICdcdUQ4M0RcdURDMzEnLCAnXHVEODNEXHVEQzM2JywgJ1x1RDgzQ1x1REYzOCcsICdcdUQ4M0NcdURGNDAnXVxuICB9XG5dO1xuXG5mdW5jdGlvbiBFbW9qaVBpY2tlclBvcHVwKHsgb25TZWxlY3QsIG9uQ2xvc2UgfSkge1xuICBjb25zdCBbYWN0aXZlQ2F0LCBzZXRBY3RpdmVDYXRdID0gUmVhY3QudXNlU3RhdGUoMCk7XG4gIGNvbnN0IHBvcHVwUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgaGFuZGxlT3V0c2lkZSA9IChlKSA9PiB7XG4gICAgICBpZiAocG9wdXBSZWYuY3VycmVudCAmJiAhcG9wdXBSZWYuY3VycmVudC5jb250YWlucyhlLnRhcmdldCkpIHtcbiAgICAgICAgb25DbG9zZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlT3V0c2lkZSk7XG4gICAgcmV0dXJuICgpID0+IGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZU91dHNpZGUpO1xuICB9LCBbb25DbG9zZV0pO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtwb3B1cFJlZn1cbiAgICAgIGNsYXNzTmFtZT1cImFic29sdXRlIGJvdHRvbS1mdWxsIG1iLTIgcmlnaHQtMCBsZWZ0LTAgei01MCBiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci1jeWFuLTUwMC8zMCByb3VuZGVkLTJ4bCBwLTIuNSBzaGFkb3ctMnhsIGJhY2tkcm9wLWJsdXIteGwgYW5pbWF0ZS1zY2FsZUluIG1heC13LVszMjBweF0gbXgtYXV0byBzbTptbC1hdXRvIHNtOm1yLTBcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHBiLTIgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIG1iLTJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBvdmVyZmxvdy14LWF1dG9cIj5cbiAgICAgICAgICB7RU1PSklfQ0FURUdPUklFUy5tYXAoKGNhdCwgaWR4KSA9PiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGtleT17Y2F0Lm5hbWV9XG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVDYXQoaWR4KX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMiBweS0xIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgc2hyaW5rLTAgJHthY3RpdmVDYXQgPT09IGlkeCA/ICdiZy1bIzAwRjJGRV0vMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAnIDogJ3RleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtci0xXCI+e2NhdC5pY29ufTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+e2NhdC5uYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICkpfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIG9uQ2xpY2s9e29uQ2xvc2V9XG4gICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LXhzIHB4LTEgc2hyaW5rLTBcIj5cbiAgICAgICAgICBcdTI3MTVcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtNiBnYXAtMSBtYXgtaC00MCBvdmVyZmxvdy15LWF1dG8gcC0xXCI+XG4gICAgICAgIHtFTU9KSV9DQVRFR09SSUVTW2FjdGl2ZUNhdF0uZW1vamlzLm1hcCgoZW1vamkpID0+IChcbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBrZXk9e2Vtb2ppfVxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvblNlbGVjdChlbW9qaSl9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTkgaC05IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtbGcgcm91bmRlZC14bCBob3ZlcjpiZy13aGl0ZS8xMCBhY3RpdmU6c2NhbGUtOTAgdHJhbnNpdGlvbi10cmFuc2Zvcm1cIj5cbiAgICAgICAgICAgIHtlbW9qaX1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgKSl9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENBTVBVUyBDSEFUICYgU09DSUFMIFJBSUwgKFBIQVNFIDREOiBDQU1QVVMgfCBMXHUxRURBUCB8IFRcdTAwRDRJKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBmdW5jdGlvbiBDYW1wdXNDaGF0UmFpbCh7IGF1dGgsIG9uUmVxdWlyZUF1dGgsIGNsYXNzTmFtZSA9ICcnLCBpc0FjdGl2ZSA9IHRydWUgfSkge1xuICBjb25zdCBbdGFiLCBzZXRUYWJdID0gUmVhY3QudXNlU3RhdGUoJ2NhbXB1cycpOyAvLyAnY2FtcHVzJyB8ICdjbGFzcycgfCAnbWUnXG4gIGNvbnN0IFtzaG93RW1vamlQaWNrZXIsIHNldFNob3dFbW9qaVBpY2tlcl0gPSBSZWFjdC51c2VTdGF0ZShudWxsKTsgLy8gJ2NhbXB1cycgfCAnY2xhc3MnIHwgJ2RtJyB8IG51bGxcblxuICBjb25zdCBoYW5kbGVJbnNlcnRFbW9qaSA9IChlbW9qaSwgdGFyZ2V0KSA9PiB7XG4gICAgaWYgKHRhcmdldCA9PT0gJ2NhbXB1cycpIHtcbiAgICAgIHNldENhbXB1c0lucHV0KHByZXYgPT4gcHJldiArIGVtb2ppKTtcbiAgICB9IGVsc2UgaWYgKHRhcmdldCA9PT0gJ2NsYXNzJykge1xuICAgICAgc2V0Q2xhc3NJbnB1dChwcmV2ID0+IHByZXYgKyBlbW9qaSk7XG4gICAgfSBlbHNlIGlmICh0YXJnZXQgPT09ICdkbScpIHtcbiAgICAgIHNldERtSW5wdXQocHJldiA9PiBwcmV2ICsgZW1vamkpO1xuICAgIH1cbiAgfTtcblxuICAvLyBBdHRlbnRpb24gJiBVbnJlYWQgc3RhdGUgKFBoYXNlIDRGKVxuICBjb25zdCBbdW5yZWFkQ2FtcHVzLCBzZXRVbnJlYWRDYW1wdXNdID0gUmVhY3QudXNlU3RhdGUoMCk7XG4gIGNvbnN0IFt1bnJlYWRDbGFzcywgc2V0VW5yZWFkQ2xhc3NdID0gUmVhY3QudXNlU3RhdGUoMCk7XG4gIGNvbnN0IFt1bnJlYWREbXMsIHNldFVucmVhZERtc10gPSBSZWFjdC51c2VTdGF0ZSh7fSk7XG4gIGNvbnN0IFt0b3RhbERtcywgc2V0VG90YWxEbXNdID0gUmVhY3QudXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtwZW5kaW5nRnJpZW5kUmVxdWVzdHNDb3VudCwgc2V0UGVuZGluZ0ZyaWVuZFJlcXVlc3RzQ291bnRdID0gUmVhY3QudXNlU3RhdGUoMCk7XG5cbiAgY29uc3QgaXNDYW1wdXNDb21wb3NpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBpc0NsYXNzQ29tcG9zaW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgaXNEbUNvbXBvc2luZ1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG5cbiAgY29uc3QgZm9ybWF0QmFkZ2UgPSAobnVtKSA9PiB7XG4gICAgaWYgKCFudW0gfHwgbnVtIDw9IDApIHJldHVybiBudWxsO1xuICAgIHJldHVybiBudW0gPiA5OSA/ICc5OSsnIDogU3RyaW5nKG51bSk7XG4gIH07XG5cbiAgLy8gQ2FtcHVzIENoYXQgc3RhdGVcbiAgY29uc3QgW2NhbXB1c01lc3NhZ2VzLCBzZXRDYW1wdXNNZXNzYWdlc10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFtjYW1wdXNJbnB1dCwgc2V0Q2FtcHVzSW5wdXRdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbY2FtcHVzU2VuZGluZywgc2V0Q2FtcHVzU2VuZGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtjYW1wdXNOb3RpY2UsIHNldENhbXB1c05vdGljZV0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IGxhc3RDYW1wdXNNZXNzYWdlSWRSZWYgPSBSZWFjdC51c2VSZWYoMCk7XG4gIGNvbnN0IGNhbXB1c0VuZFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcblxuICAvLyBDbGFzcyBDaGF0IHN0YXRlXG4gIGNvbnN0IFtjbGFzc01lc3NhZ2VzLCBzZXRDbGFzc01lc3NhZ2VzXSA9IFJlYWN0LnVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW2NsYXNzSW5wdXQsIHNldENsYXNzSW5wdXRdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbY2xhc3NTZW5kaW5nLCBzZXRDbGFzc1NlbmRpbmddID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbY2xhc3NOb3RpY2UsIHNldENsYXNzTm90aWNlXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2NsYXNzTG9wSWQsIHNldENsYXNzTG9wSWRdID0gUmVhY3QudXNlU3RhdGUoYXV0aD8udXNlcj8ubG9wSWQgfHwgMSk7XG4gIGNvbnN0IFt0ZWFjaGVyQ2xhc3Nlcywgc2V0VGVhY2hlckNsYXNzZXNdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbY2xhc3NUZW5Mb3AsIHNldENsYXNzVGVuTG9wXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgbGFzdENsYXNzTWVzc2FnZUlkUmVmID0gUmVhY3QudXNlUmVmKDApO1xuICBjb25zdCBjbGFzc0VuZFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcblxuICAvLyBUXHUwMEY0aSAoRnJpZW5kcyAmIERNKSBzdGF0ZVxuICBjb25zdCBbZnJpZW5kcywgc2V0RnJpZW5kc10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFtwZW5kaW5nSW5jb21pbmcsIHNldFBlbmRpbmdJbmNvbWluZ10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFthY3RpdmVGcmllbmQsIHNldEFjdGl2ZUZyaWVuZF0gPSBSZWFjdC51c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW2RtTWVzc2FnZXMsIHNldERtTWVzc2FnZXNdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbZG1JbnB1dCwgc2V0RG1JbnB1dF0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtkbVNlbmRpbmcsIHNldERtU2VuZGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtkbU5vdGljZSwgc2V0RG1Ob3RpY2VdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBsYXN0RG1NZXNzYWdlSWRSZWYgPSBSZWFjdC51c2VSZWYoMCk7XG4gIGNvbnN0IGRtRW5kUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuXG4gIC8vIEZyaWVuZCBTZWFyY2ggJiBTYWZldHkgTW9kYWwgc3RhdGVcbiAgY29uc3QgW3Nob3dBZGRGcmllbmQsIHNldFNob3dBZGRGcmllbmRdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2VhcmNoUXVlcnksIHNldFNlYXJjaFF1ZXJ5XSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3NlYXJjaFJlc3VsdHMsIHNldFNlYXJjaFJlc3VsdHNdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbc2VhcmNoTG9hZGluZywgc2V0U2VhcmNoTG9hZGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFthY3Rpb25GZWVkYmFjaywgc2V0QWN0aW9uRmVlZGJhY2tdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuXG4gIGNvbnN0IFtyZXBvcnRNb2RhbCwgc2V0UmVwb3J0TW9kYWxdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IFtyZXBvcnRSZWFzb24sIHNldFJlcG9ydFJlYXNvbl0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtyZXBvcnRpbmcsIHNldFJlcG9ydGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG5cbiAgLy8gU3RhYmxlIHJlZnMgZm9yIHNpbmdsZSBib3VuZGVkIHBvbGxpbmcgbG9vcFxuICBjb25zdCB0YWJSZWYgPSBSZWFjdC51c2VSZWYodGFiKTtcbiAgY29uc3QgYWN0aXZlRnJpZW5kUmVmID0gUmVhY3QudXNlUmVmKGFjdGl2ZUZyaWVuZCk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICB0YWJSZWYuY3VycmVudCA9IHRhYjtcbiAgfSwgW3RhYl0pO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYWN0aXZlRnJpZW5kUmVmLmN1cnJlbnQgPSBhY3RpdmVGcmllbmQ7XG4gICAgbGFzdERtTWVzc2FnZUlkUmVmLmN1cnJlbnQgPSAwO1xuICB9LCBbYWN0aXZlRnJpZW5kXSk7XG5cbiAgY29uc3QgaXNBY3RpdmVDYW1wdXNBY2NvdW50ID0gQm9vbGVhbighYXV0aD8uaXNHdWVzdCAmJiBhdXRoPy51c2VyKTtcbiAgY29uc3QgaGFzQ2xhc3NBY2Nlc3MgPSBCb29sZWFuKGF1dGg/LnVzZXI/LmlzVGVhY2hlciB8fCBhdXRoPy51c2VyPy5pc0xpbmtlZFN0dWRlbnQpO1xuXG4gIC8vIEd1YXJkOiBpZiB1c2VyIGxvc2VzIGNsYXNzIGFjY2VzcywgcmV2ZXJ0IHRhYiB0byAnY2FtcHVzJ1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghaGFzQ2xhc3NBY2Nlc3MgJiYgdGFiID09PSAnY2xhc3MnKSB7XG4gICAgICBzZXRUYWIoJ2NhbXB1cycpO1xuICAgIH1cbiAgfSwgW2hhc0NsYXNzQWNjZXNzLCB0YWJdKTtcblxuICAvLyBUXHUxRUEzaSB0clx1MUVBMW5nIHRoXHUwMEUxaSB0aW4gbmhcdTFFQUZuIGNoXHUwMUIwYSBcdTAxMTFcdTFFQ0RjIChQaGFzZSA0RilcbiAgY29uc3QgdGFpVW5yZWFkU3RhdGUgPSBSZWFjdC51c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFpc0FjdGl2ZUNhbXB1c0FjY291bnQpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvY2hhdC1yZWFkLXN0YXRlJyk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSB7XG4gICAgICAgIHNldFVucmVhZENhbXB1cyhkLmNhbXB1cyB8fCAwKTtcbiAgICAgICAgc2V0VW5yZWFkQ2xhc3MoZC5jbGFzcyB8fCAwKTtcbiAgICAgICAgc2V0VW5yZWFkRG1zKGQuZG1zIHx8IHt9KTtcbiAgICAgICAgc2V0VG90YWxEbXMoZC50b3RhbERtcyB8fCAwKTtcbiAgICAgICAgc2V0UGVuZGluZ0ZyaWVuZFJlcXVlc3RzQ291bnQoZC5wZW5kaW5nRnJpZW5kUmVxdWVzdHMgfHwgMCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9LCBbaXNBY3RpdmVDYW1wdXNBY2NvdW50XSk7XG5cbiAgY29uc3QgbWFya0NhbXB1c1JlYWQgPSBSZWFjdC51c2VDYWxsYmFjayhhc3luYyAobWF4SWQgPSAwKSA9PiB7XG4gICAgc2V0VW5yZWFkQ2FtcHVzKDApO1xuICAgIGlmICghaXNBY3RpdmVDYW1wdXNBY2NvdW50KSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZldGNoKCcvYXBpL2NoYXQtcmVhZC1zdGF0ZScsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGNoYW5uZWxUeXBlOiAnY2FtcHVzJywgY2hhbm5lbEtleTogJ2NhbXB1cycsIGxhc3RSZWFkSWQ6IG1heElkIH0pXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIHt9XG4gIH0sIFtpc0FjdGl2ZUNhbXB1c0FjY291bnRdKTtcblxuICBjb25zdCBtYXJrQ2xhc3NSZWFkID0gUmVhY3QudXNlQ2FsbGJhY2soYXN5bmMgKGxvcElkLCBtYXhJZCA9IDApID0+IHtcbiAgICBzZXRVbnJlYWRDbGFzcygwKTtcbiAgICBpZiAoIWlzQWN0aXZlQ2FtcHVzQWNjb3VudCB8fCAhbG9wSWQpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvY2hhdC1yZWFkLXN0YXRlJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgY2hhbm5lbFR5cGU6ICdjbGFzcycsIGNoYW5uZWxLZXk6ICdsb3A6JyArIGxvcElkLCBsYXN0UmVhZElkOiBtYXhJZCB9KVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCB7fVxuICB9LCBbaXNBY3RpdmVDYW1wdXNBY2NvdW50XSk7XG5cbiAgY29uc3QgbWFya0RtUmVhZCA9IFJlYWN0LnVzZUNhbGxiYWNrKGFzeW5jIChmcmllbmRJZCwgbWF4SWQgPSAwKSA9PiB7XG4gICAgc2V0VW5yZWFkRG1zKHByZXYgPT4gKHsgLi4ucHJldiwgW2ZyaWVuZElkXTogMCB9KSk7XG4gICAgaWYgKCFpc0FjdGl2ZUNhbXB1c0FjY291bnQgfHwgIWZyaWVuZElkKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZldGNoKCcvYXBpL2NoYXQtcmVhZC1zdGF0ZScsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGNoYW5uZWxUeXBlOiAnZG0nLCBjaGFubmVsS2V5OiAncGVlcjonICsgZnJpZW5kSWQsIGxhc3RSZWFkSWQ6IG1heElkIH0pXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIHt9XG4gIH0sIFtpc0FjdGl2ZUNhbXB1c0FjY291bnRdKTtcblxuICAvLyAxLiBUXHUxRUEzaSBDYW1wdXMgQ2hhdCBpbmNyZW1lbnRhbFxuICBjb25zdCB0YWlDYW1wdXNDaGF0ID0gUmVhY3QudXNlQ2FsbGJhY2soYXN5bmMgKHNhdUlkID0gMCkgPT4ge1xuICAgIGlmICghaXNBY3RpdmVDYW1wdXNBY2NvdW50KSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVybCA9IHNhdUlkID4gMCA/IGAvYXBpL2NhbXB1cy1jaGF0P3NhdUlkPSR7c2F1SWR9JmxpbWl0PTUwYCA6ICcvYXBpL2NhbXB1cy1jaGF0P2xpbWl0PTUwJztcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwgeyBoZWFkZXJzOiB7ICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicgfSB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2sgJiYgQXJyYXkuaXNBcnJheShkYXRhLm1lc3NhZ2VzKSkge1xuICAgICAgICBpZiAoc2F1SWQgPiAwKSB7XG4gICAgICAgICAgaWYgKGRhdGEubWVzc2FnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc2V0Q2FtcHVzTWVzc2FnZXMocHJldiA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSWRzID0gbmV3IFNldChwcmV2Lm1hcChtID0+IG0uaWQpKTtcbiAgICAgICAgICAgICAgY29uc3QgbmV3T25lcyA9IGRhdGEubWVzc2FnZXMuZmlsdGVyKG0gPT4gIWV4aXN0aW5nSWRzLmhhcyhtLmlkKSk7XG4gICAgICAgICAgICAgIGlmIChuZXdPbmVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHByZXY7XG4gICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBbLi4ucHJldiwgLi4ubmV3T25lc107XG4gICAgICAgICAgICAgIGxhc3RDYW1wdXNNZXNzYWdlSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KC4uLm5leHQubWFwKG0gPT4gbS5pZCB8fCAwKSk7XG4gICAgICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldENhbXB1c01lc3NhZ2VzKGRhdGEubWVzc2FnZXMpO1xuICAgICAgICAgIGlmIChkYXRhLm1lc3NhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGxhc3RDYW1wdXNNZXNzYWdlSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KC4uLmRhdGEubWVzc2FnZXMubWFwKG0gPT4gbS5pZCB8fCAwKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9LCBbaXNBY3RpdmVDYW1wdXNBY2NvdW50XSk7XG5cbiAgLy8gMi4gVFx1MUVBM2kgQ2xhc3MgQ2hhdCBpbmNyZW1lbnRhbFxuICBjb25zdCB0YWlDbGFzc0NoYXQgPSBSZWFjdC51c2VDYWxsYmFjayhhc3luYyAoc2F1SWQgPSAwKSA9PiB7XG4gICAgaWYgKCFoYXNDbGFzc0FjY2VzcykgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBsb3BQYXJhbSA9IGF1dGg/LnVzZXI/LmlzVGVhY2hlciAmJiBjbGFzc0xvcElkID8gYCZsb3BJZD0ke2NsYXNzTG9wSWR9YCA6ICcnO1xuICAgICAgY29uc3QgdXJsID0gc2F1SWQgPiAwID8gYC9hcGkvY2hhdD9zYXVJZD0ke3NhdUlkfSR7bG9wUGFyYW19YCA6IGAvYXBpL2NoYXQke2xvcFBhcmFtID8gJz8nICsgbG9wUGFyYW0uc2xpY2UoMSkgOiAnJ31gO1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2godXJsLCB7IGhlYWRlcnM6IHsgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJyB9IH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZGF0YS5vaykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkYXRhLmNhY0xvcCkgJiYgZGF0YS5jYWNMb3AubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHNldFRlYWNoZXJDbGFzc2VzKGRhdGEuY2FjTG9wKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF0YS50ZW5Mb3ApIHNldENsYXNzVGVuTG9wKGRhdGEudGVuTG9wKTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YS50aW5OaGFuKSkge1xuICAgICAgICAgIGlmIChzYXVJZCA+IDApIHtcbiAgICAgICAgICAgIGlmIChkYXRhLnRpbk5oYW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBzZXRDbGFzc01lc3NhZ2VzKHByZXYgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSWRzID0gbmV3IFNldChwcmV2Lm1hcChtID0+IG0uaWQpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdPbmVzID0gZGF0YS50aW5OaGFuLmZpbHRlcihtID0+ICFleGlzdGluZ0lkcy5oYXMobS5pZCkpO1xuICAgICAgICAgICAgICAgIGlmIChuZXdPbmVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHByZXY7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dCA9IFsuLi5wcmV2LCAuLi5uZXdPbmVzXTtcbiAgICAgICAgICAgICAgICBsYXN0Q2xhc3NNZXNzYWdlSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KC4uLm5leHQubWFwKG0gPT4gbS5pZCB8fCAwKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXRDbGFzc01lc3NhZ2VzKGRhdGEudGluTmhhbik7XG4gICAgICAgICAgICBpZiAoZGF0YS50aW5OaGFuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgbGFzdENsYXNzTWVzc2FnZUlkUmVmLmN1cnJlbnQgPSBNYXRoLm1heCguLi5kYXRhLnRpbk5oYW4ubWFwKG0gPT4gbS5pZCB8fCAwKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9LCBbaGFzQ2xhc3NBY2Nlc3MsIGF1dGg/LnVzZXI/LmlzVGVhY2hlciwgY2xhc3NMb3BJZF0pO1xuXG4gIC8vIDMuIFRcdTFFQTNpIEJcdTFFQTFuIGJcdTAwRTggJiBMXHUxRUREaSBtXHUxRUREaVxuICBjb25zdCB0YWlGcmllbmRzID0gUmVhY3QudXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xuICAgIGlmICghaXNBY3RpdmVDYW1wdXNBY2NvdW50KSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL2NhbXB1cy1mcmllbmRzJywgeyBoZWFkZXJzOiB7ICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicgfSB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2spIHtcbiAgICAgICAgc2V0RnJpZW5kcyhkYXRhLmZyaWVuZHMgfHwgW10pO1xuICAgICAgICBzZXRQZW5kaW5nSW5jb21pbmcoZGF0YS5wZW5kaW5nSW5jb21pbmcgfHwgW10pO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgfSwgW2lzQWN0aXZlQ2FtcHVzQWNjb3VudF0pO1xuXG4gIC8vIDQuIFRcdTFFQTNpIHRpbiBuaFx1MUVBRm4gRE0gaW5jcmVtZW50YWxcbiAgY29uc3QgdGFpRG1NZXNzYWdlcyA9IFJlYWN0LnVzZUNhbGxiYWNrKGFzeW5jIChmcmllbmRJZCwgc2F1SWQgPSAwKSA9PiB7XG4gICAgaWYgKCFmcmllbmRJZCB8fCAhaXNBY3RpdmVDYW1wdXNBY2NvdW50KSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVybCA9IHNhdUlkID4gMFxuICAgICAgICA/IGAvYXBpL2NhbXB1cy1kbT9mcmllbmRBY2NvdW50SWQ9JHtmcmllbmRJZH0mc2F1SWQ9JHtzYXVJZH0mbGltaXQ9NTBgXG4gICAgICAgIDogYC9hcGkvY2FtcHVzLWRtP2ZyaWVuZEFjY291bnRJZD0ke2ZyaWVuZElkfSZsaW1pdD01MGA7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwsIHsgaGVhZGVyczogeyAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nIH0gfSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkYXRhLm9rICYmIEFycmF5LmlzQXJyYXkoZGF0YS5tZXNzYWdlcykpIHtcbiAgICAgICAgaWYgKHNhdUlkID4gMCkge1xuICAgICAgICAgIGlmIChkYXRhLm1lc3NhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNldERtTWVzc2FnZXMocHJldiA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSWRzID0gbmV3IFNldChwcmV2Lm1hcChtID0+IG0uaWQpKTtcbiAgICAgICAgICAgICAgY29uc3QgbmV3T25lcyA9IGRhdGEubWVzc2FnZXMuZmlsdGVyKG0gPT4gIWV4aXN0aW5nSWRzLmhhcyhtLmlkKSk7XG4gICAgICAgICAgICAgIGlmIChuZXdPbmVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHByZXY7XG4gICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBbLi4ucHJldiwgLi4ubmV3T25lc107XG4gICAgICAgICAgICAgIGxhc3REbU1lc3NhZ2VJZFJlZi5jdXJyZW50ID0gTWF0aC5tYXgoLi4ubmV4dC5tYXAobSA9PiBtLmlkIHx8IDApKTtcbiAgICAgICAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0RG1NZXNzYWdlcyhkYXRhLm1lc3NhZ2VzKTtcbiAgICAgICAgICBpZiAoZGF0YS5tZXNzYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBsYXN0RG1NZXNzYWdlSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KC4uLmRhdGEubWVzc2FnZXMubWFwKG0gPT4gbS5pZCB8fCAwKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9LCBbaXNBY3RpdmVDYW1wdXNBY2NvdW50XSk7XG5cbiAgLy8gU0lOR0xFIEJPVU5ERUQgUE9MTElORyBMT09QICg0cyk6IGV4YWN0bHkgb25lIGxvb3AsIHBvbGxzIE9OTFkgYWN0aXZlIHRhYiwgcGF1c2VzIHdoZW4gZHJhd2VyIGNsb3NlZFxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghaXNBY3RpdmVDYW1wdXNBY2NvdW50IHx8ICFpc0FjdGl2ZSkgcmV0dXJuO1xuXG4gICAgaWYgKHRhYiA9PT0gJ2NhbXB1cycpIHtcbiAgICAgIHRhaUNhbXB1c0NoYXQoMCk7XG4gICAgfSBlbHNlIGlmICh0YWIgPT09ICdjbGFzcycpIHtcbiAgICAgIGlmIChoYXNDbGFzc0FjY2VzcykgdGFpQ2xhc3NDaGF0KDApO1xuICAgIH0gZWxzZSBpZiAodGFiID09PSAnbWUnKSB7XG4gICAgICBpZiAoYWN0aXZlRnJpZW5kKSB7XG4gICAgICAgIHRhaURtTWVzc2FnZXMoYWN0aXZlRnJpZW5kLmFjY291bnRJZCwgMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YWlGcmllbmRzKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGFpVW5yZWFkU3RhdGUoKTtcblxuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSAhPT0gJ3Zpc2libGUnKSByZXR1cm47XG4gICAgICBjb25zdCBjdXJyZW50VGFiID0gdGFiUmVmLmN1cnJlbnQ7XG4gICAgICBjb25zdCBjdXJyZW50RnJpZW5kID0gYWN0aXZlRnJpZW5kUmVmLmN1cnJlbnQ7XG5cbiAgICAgIHRhaVVucmVhZFN0YXRlKCk7XG5cbiAgICAgIGlmIChjdXJyZW50VGFiID09PSAnY2FtcHVzJykge1xuICAgICAgICB0YWlDYW1wdXNDaGF0KGxhc3RDYW1wdXNNZXNzYWdlSWRSZWYuY3VycmVudCk7XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnRUYWIgPT09ICdjbGFzcycpIHtcbiAgICAgICAgdGFpQ2xhc3NDaGF0KGxhc3RDbGFzc01lc3NhZ2VJZFJlZi5jdXJyZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudFRhYiA9PT0gJ21lJykge1xuICAgICAgICBpZiAoY3VycmVudEZyaWVuZCkge1xuICAgICAgICAgIHRhaURtTWVzc2FnZXMoY3VycmVudEZyaWVuZC5hY2NvdW50SWQsIGxhc3REbU1lc3NhZ2VJZFJlZi5jdXJyZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0YWlGcmllbmRzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCAzNTAwKTtcblxuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgfSwgW2lzQWN0aXZlQ2FtcHVzQWNjb3VudCwgaGFzQ2xhc3NBY2Nlc3MsIGlzQWN0aXZlLCB0YWIsIGFjdGl2ZUZyaWVuZD8uYWNjb3VudElkLCBjbGFzc0xvcElkLCB0YWlDYW1wdXNDaGF0LCB0YWlDbGFzc0NoYXQsIHRhaUZyaWVuZHMsIHRhaURtTWVzc2FnZXNdKTtcblxuICAvLyBBdXRvIHNjcm9sbCAtIGFuIHRvXHUwMEUwbiBraFx1MDBGNG5nIGdpXHUxRUFEdCB0cmFuZ1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh0YWIgPT09ICdjYW1wdXMnICYmIGNhbXB1c0VuZFJlZi5jdXJyZW50KSB7XG4gICAgICBjb25zdCBwID0gY2FtcHVzRW5kUmVmLmN1cnJlbnQucGFyZW50RWxlbWVudDtcbiAgICAgIGlmIChwICYmIHAuc2Nyb2xsSGVpZ2h0ID4gcC5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgcC5zY3JvbGxUbyh7IHRvcDogcC5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbXB1c0VuZFJlZi5jdXJyZW50LnNjcm9sbEludG9WaWV3KHsgYmVoYXZpb3I6ICdzbW9vdGgnLCBibG9jazogJ25lYXJlc3QnLCBpbmxpbmU6ICduZWFyZXN0JyB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtjYW1wdXNNZXNzYWdlcy5sZW5ndGgsIHRhYl0pO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHRhYiA9PT0gJ2NsYXNzJyAmJiBjbGFzc0VuZFJlZi5jdXJyZW50KSB7XG4gICAgICBjb25zdCBwID0gY2xhc3NFbmRSZWYuY3VycmVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgaWYgKHAgJiYgcC5zY3JvbGxIZWlnaHQgPiBwLmNsaWVudEhlaWdodCkge1xuICAgICAgICBwLnNjcm9sbFRvKHsgdG9wOiBwLnNjcm9sbEhlaWdodCwgYmVoYXZpb3I6ICdzbW9vdGgnIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2xhc3NFbmRSZWYuY3VycmVudC5zY3JvbGxJbnRvVmlldyh7IGJlaGF2aW9yOiAnc21vb3RoJywgYmxvY2s6ICduZWFyZXN0JywgaW5saW5lOiAnbmVhcmVzdCcgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCBbY2xhc3NNZXNzYWdlcy5sZW5ndGgsIHRhYl0pO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHRhYiA9PT0gJ21lJyAmJiBhY3RpdmVGcmllbmQgJiYgZG1FbmRSZWYuY3VycmVudCkge1xuICAgICAgY29uc3QgcCA9IGRtRW5kUmVmLmN1cnJlbnQucGFyZW50RWxlbWVudDtcbiAgICAgIGlmIChwICYmIHAuc2Nyb2xsSGVpZ2h0ID4gcC5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgcC5zY3JvbGxUbyh7IHRvcDogcC5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRtRW5kUmVmLmN1cnJlbnQuc2Nyb2xsSW50b1ZpZXcoeyBiZWhhdmlvcjogJ3Ntb290aCcsIGJsb2NrOiAnbmVhcmVzdCcsIGlubGluZTogJ25lYXJlc3QnIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSwgW2RtTWVzc2FnZXMubGVuZ3RoLCB0YWIsIGFjdGl2ZUZyaWVuZF0pO1xuXG4gIC8vIEdcdTFFRURpIENhbXB1cyBDaGF0IChQaGFzZSA0RjogU2FmZSBDbGVhciArIElNRSBHdWFyZClcbiAgY29uc3QgaGFuZGxlU2VuZENhbXB1cyA9IGFzeW5jIChlKSA9PiB7XG4gICAgZT8ucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCB0ZXh0ID0gY2FtcHVzSW5wdXQudHJpbSgpO1xuICAgIGlmICghdGV4dCB8fCBjYW1wdXNTZW5kaW5nKSByZXR1cm47XG4gICAgLy8gT3B0aW1pc3RpY2FsbHkgY2xlYXIgaW5wdXQgaW1tZWRpYXRlbHkgc28gdXNlciBjYW4gdHlwZSBuZXh0IG1lc3NhZ2VcbiAgICBzZXRDYW1wdXNJbnB1dCgnJyk7XG4gICAgc2V0Q2FtcHVzU2VuZGluZyh0cnVlKTtcbiAgICBzZXRDYW1wdXNOb3RpY2UoJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9jYW1wdXMtY2hhdCcsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG5vaUR1bmc6IHRleHQgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZGF0YS5vayAmJiBkYXRhLm1lc3NhZ2UpIHtcbiAgICAgICAgc2V0Q2FtcHVzTWVzc2FnZXMocHJldiA9PiB7XG4gICAgICAgICAgY29uc3QgbmV4dCA9IFsuLi5wcmV2LCBkYXRhLm1lc3NhZ2VdO1xuICAgICAgICAgIGxhc3RDYW1wdXNNZXNzYWdlSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KGxhc3RDYW1wdXNNZXNzYWdlSWRSZWYuY3VycmVudCwgZGF0YS5tZXNzYWdlLmlkIHx8IDApO1xuICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICB9KTtcbiAgICAgICAgbWFya0NhbXB1c1JlYWQoZGF0YS5tZXNzYWdlLmlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldENhbXB1c05vdGljZShkYXRhLmxvaSB8fCAnS2hcdTAwRjRuZyBnXHUxRUVEaSBcdTAxMTFcdTAxQjBcdTFFRTNjIHRpbiBuaFx1MUVBRm4uJyk7XG4gICAgICAgIC8vIFJlc3RvcmUgT05MWSBpZiB1c2VyIGhhc24ndCBzdGFydGVkIHR5cGluZyBhIG5ldyBtZXNzYWdlXG4gICAgICAgIHNldENhbXB1c0lucHV0KGN1ciA9PiBjdXIgPyBjdXIgOiB0ZXh0KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldENhbXB1c05vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkga2hpIGdcdTFFRURpIHRpbiBuaFx1MUVBRm4uJyk7XG4gICAgICBzZXRDYW1wdXNJbnB1dChjdXIgPT4gY3VyID8gY3VyIDogdGV4dCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldENhbXB1c1NlbmRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyBUaHUgaFx1MUVEM2kgdGluIG5oXHUxRUFGbiBDYW1wdXNcbiAgY29uc3QgaGFuZGxlRGVsZXRlQ2FtcHVzID0gYXN5bmMgKGlkKSA9PiB7XG4gICAgaWYgKCFjb25maXJtKCdCXHUxRUExbiBjXHUwMEYzIGNoXHUxRUFGYyBtdVx1MUVEMW4gdGh1IGhcdTFFRDNpIHRpbiBuaFx1MUVBRm4gblx1MDBFMHk/JykpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvY2FtcHVzLWNoYXQ/aWQ9JHtpZH1gLCB7IG1ldGhvZDogJ0RFTEVURScgfSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkYXRhLm9rKSB7XG4gICAgICAgIHNldENhbXB1c01lc3NhZ2VzKHByZXYgPT4gcHJldi5maWx0ZXIobSA9PiBtLmlkICE9PSBpZCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWxlcnQoZGF0YS5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgeFx1MDBGM2EgdGluIG5oXHUxRUFGbi4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIGFsZXJ0KCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBraGkgeFx1MDBGM2EgdGluIG5oXHUxRUFGbi4nKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gR1x1MUVFRGkgQ2xhc3MgQ2hhdCAoUGhhc2UgNEY6IFNhZmUgQ2xlYXIgKyBJTUUgR3VhcmQpXG4gIGNvbnN0IGhhbmRsZVNlbmRDbGFzcyA9IGFzeW5jIChlKSA9PiB7XG4gICAgZT8ucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCB0ZXh0ID0gY2xhc3NJbnB1dC50cmltKCk7XG4gICAgaWYgKCF0ZXh0IHx8IGNsYXNzU2VuZGluZykgcmV0dXJuO1xuICAgIHNldENsYXNzSW5wdXQoJycpO1xuICAgIHNldENsYXNzU2VuZGluZyh0cnVlKTtcbiAgICBzZXRDbGFzc05vdGljZSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBheWxvYWQgPSB7IG5vaUR1bmc6IHRleHQgfTtcbiAgICAgIGlmIChhdXRoPy51c2VyPy5pc1RlYWNoZXIgJiYgY2xhc3NMb3BJZCkgcGF5bG9hZC5sb3BJZCA9IGNsYXNzTG9wSWQ7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9jaGF0Jywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2sgJiYgZGF0YS50aW5OaGFuKSB7XG4gICAgICAgIHNldENsYXNzTWVzc2FnZXMocHJldiA9PiB7XG4gICAgICAgICAgY29uc3QgbmV4dCA9IFsuLi5wcmV2LCBkYXRhLnRpbk5oYW5dO1xuICAgICAgICAgIGxhc3RDbGFzc01lc3NhZ2VJZFJlZi5jdXJyZW50ID0gTWF0aC5tYXgobGFzdENsYXNzTWVzc2FnZUlkUmVmLmN1cnJlbnQsIGRhdGEudGluTmhhbi5pZCB8fCAwKTtcbiAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgfSk7XG4gICAgICAgIG1hcmtDbGFzc1JlYWQoY2xhc3NMb3BJZCwgZGF0YS50aW5OaGFuLmlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldENsYXNzTm90aWNlKGRhdGEubG9pIHx8ICdLaFx1MDBGNG5nIGdcdTFFRURpIFx1MDExMVx1MDFCMFx1MUVFM2MgdGluIG5oXHUxRUFGbi4nKTtcbiAgICAgICAgc2V0Q2xhc3NJbnB1dChjdXIgPT4gY3VyID8gY3VyIDogdGV4dCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRDbGFzc05vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkga2hpIGdcdTFFRURpIHRpbiBuaFx1MUVBRm4uJyk7XG4gICAgICBzZXRDbGFzc0lucHV0KGN1ciA9PiBjdXIgPyBjdXIgOiB0ZXh0KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0Q2xhc3NTZW5kaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gR1x1MUVFRGkgdGluIG5oXHUxRUFGbiByaVx1MDBFQW5nIChETSAtIFBoYXNlIDRGOiBTYWZlIENsZWFyICsgSU1FIEd1YXJkKVxuICBjb25zdCBoYW5kbGVTZW5kRG0gPSBhc3luYyAoZSkgPT4ge1xuICAgIGU/LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgdGV4dCA9IGRtSW5wdXQudHJpbSgpO1xuICAgIGlmICghdGV4dCB8fCAhYWN0aXZlRnJpZW5kIHx8IGRtU2VuZGluZykgcmV0dXJuO1xuICAgIHNldERtSW5wdXQoJycpO1xuICAgIHNldERtU2VuZGluZyh0cnVlKTtcbiAgICBzZXREbU5vdGljZSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL2NhbXB1cy1kbScsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHJlY2VpdmVyQWNjb3VudElkOiBhY3RpdmVGcmllbmQuYWNjb3VudElkLCBub2lEdW5nOiB0ZXh0IH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2sgJiYgZGF0YS5tZXNzYWdlKSB7XG4gICAgICAgIHNldERtTWVzc2FnZXMocHJldiA9PiB7XG4gICAgICAgICAgY29uc3QgbmV4dCA9IFsuLi5wcmV2LCBkYXRhLm1lc3NhZ2VdO1xuICAgICAgICAgIGxhc3REbU1lc3NhZ2VJZFJlZi5jdXJyZW50ID0gTWF0aC5tYXgobGFzdERtTWVzc2FnZUlkUmVmLmN1cnJlbnQsIGRhdGEubWVzc2FnZS5pZCB8fCAwKTtcbiAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgfSk7XG4gICAgICAgIG1hcmtEbVJlYWQoYWN0aXZlRnJpZW5kLmFjY291bnRJZCwgZGF0YS5tZXNzYWdlLmlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldERtTm90aWNlKGRhdGEubG9pIHx8ICdLaFx1MDBGNG5nIHRoXHUxRUMzIGdcdTFFRURpIHRpbiBuaFx1MUVBRm4uJyk7XG4gICAgICAgIHNldERtSW5wdXQoY3VyID0+IGN1ciA/IGN1ciA6IHRleHQpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0RG1Ob3RpY2UoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIGtoaSBnXHUxRUVEaSB0aW4gbmhcdTFFQUZuIHJpXHUwMEVBbmcuJyk7XG4gICAgICBzZXREbUlucHV0KGN1ciA9PiBjdXIgPyBjdXIgOiB0ZXh0KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RG1TZW5kaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gVFx1MDBFQ20gYlx1MUVBMW4gYlx1MDBFOCAoVFx1MUVEMWkgdGhpXHUxRUMzdSA0IGtcdTAwRkQgdFx1MUVGMSB0XHUwMEVBbiBcdTAxMTFcdTAxMDNuZyBuaFx1MUVBRHAgXHUwMTExXHUxRUMzIGJcdTFFQTNvIG1cdTFFQUR0IGRhbmggYlx1MUVBMSlcbiAgY29uc3QgaGFuZGxlU2VhcmNoRnJpZW5kcyA9IGFzeW5jICh2YWwpID0+IHtcbiAgICBzZXRTZWFyY2hRdWVyeSh2YWwpO1xuICAgIGNvbnN0IHRyaW1tZWQgPSB2YWwudHJpbSgpO1xuICAgIGlmICh0cmltbWVkLmxlbmd0aCA8IDQpIHtcbiAgICAgIHNldFNlYXJjaFJlc3VsdHMoW10pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZXRTZWFyY2hMb2FkaW5nKHRydWUpO1xuICAgIHNldEFjdGlvbkZlZWRiYWNrKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvY2FtcHVzLWZyaWVuZHMnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhY3Rpb246ICdzZWFyY2gnLCBxdWVyeTogdHJpbW1lZCB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkYXRhLm9rKSB7XG4gICAgICAgIHNldFNlYXJjaFJlc3VsdHMoZGF0YS5saXN0IHx8IFtdKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9IGZpbmFsbHkge1xuICAgICAgc2V0U2VhcmNoTG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIEdcdTFFRURpIGxcdTFFRERpIG1cdTFFRERpIGtcdTFFQkZ0IGJcdTFFQTFuXG4gIGNvbnN0IGhhbmRsZVJlcXVlc3RGcmllbmQgPSBhc3luYyAodGFyZ2V0SWQpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvY2FtcHVzLWZyaWVuZHMnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhY3Rpb246ICdyZXF1ZXN0JywgdGFyZ2V0QWNjb3VudElkOiB0YXJnZXRJZCB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkYXRhLm9rKSB7XG4gICAgICAgIHNldEFjdGlvbkZlZWRiYWNrKCdcdTAxMTBcdTAwRTMgZ1x1MUVFRGkgbFx1MUVERGkgbVx1MUVERGkga1x1MUVCRnQgYlx1MUVBMW4uJyk7XG4gICAgICAgIHNldFNlYXJjaFJlc3VsdHMocHJldiA9PiBwcmV2Lm1hcCh1ID0+IHUuaWQgPT09IHRhcmdldElkID8geyAuLi51LCBmcmllbmRzaGlwU3RhdHVzOiAnc2VudF9wZW5kaW5nJyB9IDogdSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWxlcnQoZGF0YS5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgZ1x1MUVFRGkgbFx1MUVERGkgbVx1MUVERGkuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBhbGVydCgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkga2hpIGdcdTFFRURpIGxcdTFFRERpIG1cdTFFRERpIGtcdTFFQkZ0IGJcdTFFQTFuLicpO1xuICAgIH1cbiAgfTtcblxuICAvLyBDaFx1MUVBNXAgbmhcdTFFQURuIGtcdTFFQkZ0IGJcdTFFQTFuXG4gIGNvbnN0IGhhbmRsZUFjY2VwdEZyaWVuZCA9IGFzeW5jIChyZXFJZCwgZnJvbUFjY0lkKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL2NhbXB1cy1mcmllbmRzJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYWN0aW9uOiAnYWNjZXB0JywgcmVxdWVzdElkOiByZXFJZCwgcmVxdWVzdGVyQWNjb3VudElkOiBmcm9tQWNjSWQgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZGF0YS5vaykge1xuICAgICAgICB0YWlGcmllbmRzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbGVydChkYXRhLmxvaSB8fCAnTFx1MUVEN2kga2hpIGNoXHUxRUE1cCBuaFx1MUVBRG4uJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIC8vIFRcdTFFRUIgY2hcdTFFRDFpIGtcdTFFQkZ0IGJcdTFFQTFuXG4gIGNvbnN0IGhhbmRsZURlY2xpbmVGcmllbmQgPSBhc3luYyAocmVxSWQsIGZyb21BY2NJZCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9jYW1wdXMtZnJpZW5kcycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGFjdGlvbjogJ2RlY2xpbmUnLCByZXF1ZXN0SWQ6IHJlcUlkLCByZXF1ZXN0ZXJBY2NvdW50SWQ6IGZyb21BY2NJZCB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkYXRhLm9rKSB7XG4gICAgICAgIHRhaUZyaWVuZHMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFsZXJ0KGRhdGEubG9pIHx8ICdMXHUxRUQ3aSBraGkgdFx1MUVFQiBjaFx1MUVEMWkuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIC8vIEhcdTFFRTd5IGtcdTFFQkZ0IGJcdTFFQTFuXG4gIGNvbnN0IGhhbmRsZVVuZnJpZW5kID0gYXN5bmMgKGZyaWVuZElkKSA9PiB7XG4gICAgaWYgKCFjb25maXJtKCdCXHUxRUExbiBjXHUwMEYzIG11XHUxRUQxbiBoXHUxRUU3eSBrXHUxRUJGdCBiXHUxRUExbiB2XHUxRURCaSBuZ1x1MDFCMFx1MUVERGkgblx1MDBFMHk/JykpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvY2FtcHVzLWZyaWVuZHMnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhY3Rpb246ICd1bmZyaWVuZCcsIGZyaWVuZEFjY291bnRJZDogZnJpZW5kSWQgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZGF0YS5vaykge1xuICAgICAgICBzZXRBY3RpdmVGcmllbmQobnVsbCk7XG4gICAgICAgIHRhaUZyaWVuZHMoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gQ2hcdTFFQjduIG5nXHUwMUIwXHUxRUREaSBkXHUwMEY5bmdcbiAgY29uc3QgaGFuZGxlQmxvY2sgPSBhc3luYyAodGFyZ2V0SWQpID0+IHtcbiAgICBpZiAoIWNvbmZpcm0oJ0JcdTFFQTFuIGNcdTAwRjMgY2hcdTFFQUZjIG11XHUxRUQxbiBjaFx1MUVCN24gbmdcdTAxQjBcdTFFRERpIG5cdTAwRTB5PyBDXHUxRUEzIGhhaSBiXHUwMEVBbiBzXHUxRUJEIGtoXHUwMEY0bmcgdGhcdTFFQzMgbmhcdTFFQUZuIHRpbiBob1x1MUVCN2MgZ1x1MUVFRGkgbFx1MUVERGkgbVx1MUVERGkga1x1MUVCRnQgYlx1MUVBMW4uJykpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvY2FtcHVzLWZyaWVuZHMnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhY3Rpb246ICdibG9jaycsIHRhcmdldEFjY291bnRJZDogdGFyZ2V0SWQgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZGF0YS5vaykge1xuICAgICAgICBzZXRBY3RpdmVGcmllbmQobnVsbCk7XG4gICAgICAgIHRhaUZyaWVuZHMoKTtcbiAgICAgICAgYWxlcnQoJ1x1MDExMFx1MDBFMyBjaFx1MUVCN24gbmdcdTAxQjBcdTFFRERpIGRcdTAwRjluZy4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gR1x1MUVFRGkgYlx1MDBFMW8gY1x1MDBFMW8gdmkgcGhcdTFFQTFtXG4gIGNvbnN0IGhhbmRsZVN1Ym1pdFJlcG9ydCA9IGFzeW5jIChlKSA9PiB7XG4gICAgZT8ucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAoIXJlcG9ydFJlYXNvbi50cmltKCkgfHwgIXJlcG9ydE1vZGFsPy50YXJnZXRJZCB8fCByZXBvcnRpbmcpIHJldHVybjtcbiAgICBzZXRSZXBvcnRpbmcodHJ1ZSk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICAgIGFjdGlvbjogJ3JlcG9ydCcsXG4gICAgICAgIHRhcmdldEFjY291bnRJZDogcmVwb3J0TW9kYWwudGFyZ2V0SWQsXG4gICAgICAgIHJlYXNvbjogcmVwb3J0UmVhc29uLnRyaW0oKVxuICAgICAgfTtcbiAgICAgIGlmIChyZXBvcnRNb2RhbC5tZXNzYWdlSWQpIHtcbiAgICAgICAgcGF5bG9hZC5tZXNzYWdlSWQgPSByZXBvcnRNb2RhbC5tZXNzYWdlSWQ7XG4gICAgICB9XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9jYW1wdXMtZG0nLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZGF0YS5vaykge1xuICAgICAgICBhbGVydCgnXHUwMTEwXHUwMEUzIGdcdTFFRURpIGJcdTAwRTFvIGNcdTAwRTFvIGNobyBnaVx1MDBFMW8gdmlcdTAwRUFuIHhlbSB4XHUwMEU5dC4nKTtcbiAgICAgICAgc2V0UmVwb3J0TW9kYWwobnVsbCk7XG4gICAgICAgIHNldFJlcG9ydFJlYXNvbignJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbGVydChkYXRhLmxvaSB8fCAnTFx1MUVEN2kga2hpIGdcdTFFRURpIGJcdTAwRTFvIGNcdTAwRTFvLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgYWxlcnQoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIGtoaSBnXHUxRUVEaSBiXHUwMEUxbyBjXHUwMEUxby4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0UmVwb3J0aW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGlkPVwiY2FtcHVzLWNoYXQtcmFpbFwiIGNsYXNzTmFtZT17YGJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHNoYWRvdy14bCBmbGV4IGZsZXgtY29sIG92ZXJmbG93LWhpZGRlbiBoLVs1NjBweF0gJHtjbGFzc05hbWV9YH0+XG4gICAgICB7LyogUmFpbCBIZWFkZXIgXHUyMDE0IEVYQUNUTFkgMyBUQUJTOiBDYW1wdXMgfCBMXHUxRURCcCB8IFRcdTAwRjRpICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zIHB5LTIgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBiZy1bIzExMTYyMF0vNjAgc2hyaW5rLTBcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGJnLVsjMEIwRTE0XSBwLTEgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHctZnVsbFwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgaWQ9XCJjaGF0LXRhYi1jYW1wdXNcIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICBzZXRUYWIoJ2NhbXB1cycpO1xuICAgICAgICAgICAgICBzZXRBY3RpdmVGcmllbmQobnVsbCk7XG4gICAgICAgICAgICAgIG1hcmtDYW1wdXNSZWFkKGxhc3RDYW1wdXNNZXNzYWdlSWRSZWYuY3VycmVudCk7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleC0xIHB5LTEuNSByb3VuZGVkLWxnIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIHRleHQtY2VudGVyIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xICR7dGFiID09PSAnY2FtcHVzJyA/ICdiZy1bIzAwRjJGRV0gdGV4dC1ibGFjayBzaGFkb3ctc20nIDogJ3RleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgPHNwYW4+Q2FtcHVzPC9zcGFuPlxuICAgICAgICAgICAge3VucmVhZENhbXB1cyA+IDAgJiYgKFxuICAgICAgICAgICAgICA8c3BhbiBpZD1cImJhZGdlLXVucmVhZC1jYW1wdXNcIiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQtZnVsbCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctcm9zZS01MDAgdGV4dC13aGl0ZSBhbmltYXRlLXB1bHNlXCI+XG4gICAgICAgICAgICAgICAge2Zvcm1hdEJhZGdlKHVucmVhZENhbXB1cyl9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICB7aGFzQ2xhc3NBY2Nlc3MgJiYgKFxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgaWQ9XCJjaGF0LXRhYi1jbGFzc1wiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRUYWIoJ2NsYXNzJyk7XG4gICAgICAgICAgICAgICAgc2V0QWN0aXZlRnJpZW5kKG51bGwpO1xuICAgICAgICAgICAgICAgIG1hcmtDbGFzc1JlYWQoY2xhc3NMb3BJZCwgbGFzdENsYXNzTWVzc2FnZUlkUmVmLmN1cnJlbnQpO1xuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4LTEgcHktMS41IHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgdGV4dC1jZW50ZXIgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEgJHt0YWIgPT09ICdjbGFzcycgPyAnYmctWyMwMEYyRkVdIHRleHQtYmxhY2sgc2hhZG93LXNtJyA6ICd0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgPHNwYW4+TFx1MUVEQnA8L3NwYW4+XG4gICAgICAgICAgICAgIHt1bnJlYWRDbGFzcyA+IDAgJiYgKFxuICAgICAgICAgICAgICAgIDxzcGFuIGlkPVwiYmFkZ2UtdW5yZWFkLWNsYXNzXCIgY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuMiByb3VuZGVkLWZ1bGwgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLWN5YW4tNDAwIHRleHQtYmxhY2tcIj5cbiAgICAgICAgICAgICAgICAgIHtmb3JtYXRCYWRnZSh1bnJlYWRDbGFzcyl9XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKX1cblxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgaWQ9XCJjaGF0LXRhYi1tZVwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldFRhYignbWUnKTsgdGFpRnJpZW5kcygpOyB9fVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleC0xIHB5LTEuNSByb3VuZGVkLWxnIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIHRleHQtY2VudGVyIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xIHJlbGF0aXZlICR7dGFiID09PSAnbWUnID8gJ2JnLVsjMDBGMkZFXSB0ZXh0LWJsYWNrIHNoYWRvdy1zbScgOiAndGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSd9YH0+XG4gICAgICAgICAgICA8c3Bhbj5UXHUwMEY0aTwvc3Bhbj5cbiAgICAgICAgICAgIHsodG90YWxEbXMgKyBwZW5kaW5nSW5jb21pbmcubGVuZ3RoICsgcGVuZGluZ0ZyaWVuZFJlcXVlc3RzQ291bnQpID4gMCAmJiAoXG4gICAgICAgICAgICAgIDxzcGFuIGlkPVwiYmFkZ2UtdW5yZWFkLW1lXCIgY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuMiByb3VuZGVkLWZ1bGwgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLWFtYmVyLTQwMCB0ZXh0LWJsYWNrXCI+XG4gICAgICAgICAgICAgICAge2Zvcm1hdEJhZGdlKHRvdGFsRG1zICsgTWF0aC5tYXgocGVuZGluZ0luY29taW5nLmxlbmd0aCwgcGVuZGluZ0ZyaWVuZFJlcXVlc3RzQ291bnQpKX1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIEd1ZXN0IFN0YXRlICovfVxuICAgICAge2F1dGg/LmlzR3Vlc3QgPyAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIHAtNSBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LWNlbnRlciBnYXAtMyBiZy13aGl0ZS9bMC4wMV1cIj5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTN4bFwiPlx1RDgzRFx1REQxMDwvc3Bhbj5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMFwiPlx1MDExMFx1MDEwM25nIG5oXHUxRUFEcCBcdTAxMTFcdTFFQzMgdGhhbSBnaWEgQ2hhdDwvcD5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMFwiPlRyXHUwMEYyIGNodXlcdTFFQzduIGNcdTAwRjluZyBiXHUxRUExbiBiXHUwMEU4IHZcdTAwRTAgZ2lcdTAwRTFvIHZpXHUwMEVBbiB0b1x1MDBFMG4gdHJcdTAxQjBcdTFFRERuZy48L3A+XG4gICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17b25SZXF1aXJlQXV0aH1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cIm10LTEgcHgtNCBweS0yIHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzhCNUNGNl0gdGV4dC1ibGFjayB0ZXh0LXhzIGZvbnQtZXh0cmFib2xkIHNoYWRvdy1tZCBob3ZlcjpvcGFjaXR5LTk1IGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgXHUwMTEwXHUwMTAzbmcgbmhcdTFFQURwIG5nYXlcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogdGFiID09PSAnY2FtcHVzJyA/IChcbiAgICAgICAgLyogXHUyNTAwXHUyNTAwXHUyNTAwIFRBQjogQ0FNUFVTIENIQVQgKFRPXHUwMEMwTiBUUlx1MDFBRlx1MUVEQ05HIFx1MjAxNCBNXHUxRUNDSSBUXHUwMEMwSSBLSE9cdTFFQTJOIENBTVBVUyBIT1x1MUVBMFQgXHUwMTEwXHUxRUQ4TkcpIFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIG1pbi1oLTBcIj5cbiAgICAgICAgICB7LyogTWVzc2FnZSBMaXN0ICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXktYXV0byBwLTMgc3BhY2UteS0yLjUgdGV4dC14c1wiPlxuICAgICAgICAgICAge2NhbXB1c01lc3NhZ2VzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1jZW50ZXIgcC00XCI+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDBcIj5DaFx1MDFCMGEgY1x1MDBGMyB0aW4gbmhcdTFFQUZuIG5cdTAwRTBvLiBIXHUwMEUzeSBnXHUxRUVEaSBsXHUxRUREaSBjaFx1MDBFMG8gXHUwMTExXHUxRUE3dSB0aVx1MDBFQW4hPC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIGNhbXB1c01lc3NhZ2VzLm1hcChtc2cgPT4gKFxuICAgICAgICAgICAgICAgIDxkaXYga2V5PXttc2cuaWR9IGNsYXNzTmFtZT17YGdyb3VwIGZsZXggZmxleC1jb2wgJHttc2cuaXNNZSA/ICdpdGVtcy1lbmQnIDogJ2l0ZW1zLXN0YXJ0J31gfT5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBtYi0wLjUgcHgtMVwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDBcIj57bXNnLnNlbmRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICB7bXNnLnJvbGUgPT09ICd0ZWFjaGVyJyA/IChcbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xIHB5LTAuMiByb3VuZGVkIHRleHQtWzhweF0gZm9udC1ibGFjayBiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzBcIj5HVkNOPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICApIDogbXNnLmNsYXNzQmFkZ2UgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMSBweS0wLjIgcm91bmRlZCB0ZXh0LVs4cHhdIGZvbnQtYm9sZCBiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMjBcIj5cdTI3MTMge21zZy5jbGFzc0JhZGdlfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7bmV3IERhdGUobXNnLmNyZWF0ZWRBdCkudG9Mb2NhbGVUaW1lU3RyaW5nKFtdLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSl9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgeyhtc2cuaXNNZSB8fCBhdXRoPy51c2VyPy5pc1ZlcmlmaWVkVGVhY2hlcikgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IGhhbmRsZURlbGV0ZUNhbXB1cyhtc2cuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHRleHQtWzEwcHhdIHRleHQtcm9zZS00MDAgaG92ZXI6dGV4dC1yb3NlLTMwMCB0cmFuc2l0aW9uLW9wYWNpdHkgbWwtMVwiXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlRodSBoXHUxRUQzaSB0aW4gbmhcdTFFQUZuXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BweC0yLjUgcHktMS41IHJvdW5kZWQteGwgbWF4LXctWzg1JV0gYnJlYWstd29yZHMgdGV4dC14cyBsZWFkaW5nLXJlbGF4ZWQgJHttc2cuaXNNZSA/ICdiZy1bIzAwRjJGRV0vMTUgdGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCByb3VuZGVkLXRyLW5vbmUnIDogJ2JnLVsjMEIwRTE0XSB0ZXh0LXNsYXRlLTIwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC10bC1ub25lJ31gfT5cbiAgICAgICAgICAgICAgICAgICAge21zZy5jb250ZW50fVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICkpXG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPGRpdiByZWY9e2NhbXB1c0VuZFJlZn0gLz5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiBSYXRlIGxpbWl0IG5vdGljZSAqL31cbiAgICAgICAgICB7Y2FtcHVzTm90aWNlICYmIChcbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInB4LTMgcHktMSB0ZXh0LVsxMHB4XSB0ZXh0LWFtYmVyLTQwMCBiZy1hbWJlci01MDAvMTAgYm9yZGVyLXQgYm9yZGVyLWFtYmVyLTUwMC8yMFwiPntjYW1wdXNOb3RpY2V9PC9wPlxuICAgICAgICAgICl9XG5cbiAgICAgICAgICB7LyogQ29tcG9zZXIgKi99XG4gICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVNlbmRDYW1wdXN9IGNsYXNzTmFtZT1cInAtMiBib3JkZXItdCBib3JkZXItd2hpdGUvMTAgYmctWyMxMTE2MjBdLzgwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHNocmluay0wIHJlbGF0aXZlXCI+XG4gICAgICAgICAgICB7c2hvd0Vtb2ppUGlja2VyID09PSAnY2FtcHVzJyAmJiAoXG4gICAgICAgICAgICAgIDxFbW9qaVBpY2tlclBvcHVwXG4gICAgICAgICAgICAgICAgb25TZWxlY3Q9eyhlbW9qaSkgPT4gaGFuZGxlSW5zZXJ0RW1vamkoZW1vamksICdjYW1wdXMnKX1cbiAgICAgICAgICAgICAgICBvbkNsb3NlPXsoKSA9PiBzZXRTaG93RW1vamlQaWNrZXIobnVsbCl9XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2hvd0Vtb2ppUGlja2VyKHNob3dFbW9qaVBpY2tlciA9PT0gJ2NhbXB1cycgPyBudWxsIDogJ2NhbXB1cycpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTIgcm91bmRlZC14bCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXllbGxvdy0zMDAgaG92ZXI6Ymctd2hpdGUvNSB0ZXh0LWJhc2UgdHJhbnNpdGlvbi1jb2xvcnMgc2hyaW5rLTBcIlxuICAgICAgICAgICAgICB0aXRsZT1cIlRoXHUwMEVBbSBiaVx1MUVDM3UgdFx1MDFCMFx1MUVFM25nIGNcdTFFQTNtIHhcdTAwRkFjXCI+XG4gICAgICAgICAgICAgIFx1RDgzRFx1REUwQVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1jYW1wdXMtY2hhdFwiXG4gICAgICAgICAgICAgIHJvd3M9ezF9XG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiTmhcdTFFQUZuIHRpbiB0b1x1MDBFMG4gQ2FtcHVzLi4uXCJcbiAgICAgICAgICAgICAgdmFsdWU9e2NhbXB1c0lucHV0fVxuICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRDYW1wdXNJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25TdGFydD17KCkgPT4geyBpc0NhbXB1c0NvbXBvc2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgb25Db21wb3NpdGlvbkVuZD17KCkgPT4geyBpc0NhbXB1c0NvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7IH19XG4gICAgICAgICAgICAgIG9uS2V5RG93bj17ZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInICYmICFlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgICBpZiAoZS5uYXRpdmVFdmVudD8uaXNDb21wb3NpbmcgfHwgaXNDYW1wdXNDb21wb3NpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgaGFuZGxlU2VuZENhbXB1cygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgbWF4TGVuZ3RoPXs1MDB9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHB4LTMgcHktMiB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzYwIHJlc2l6ZS1ub25lIG1pbi1oLVszOHB4XSBtYXgtaC0yNFwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgaWQ9XCJidG4tc2VuZC1jYW1wdXMtY2hhdFwiXG4gICAgICAgICAgICAgIGRpc2FibGVkPXshY2FtcHVzSW5wdXQudHJpbSgpIHx8IGNhbXB1c1NlbmRpbmd9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMiByb3VuZGVkLXhsIGJnLVsjMDBGMkZFXSBob3ZlcjpiZy1bIzAwZTFlY10gdGV4dC1ibGFjayB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS0zMCBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgc2hyaW5rLTBcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICBHXHUxRUVEaVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9mb3JtPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICkgOiB0YWIgPT09ICdjbGFzcycgPyAoXG4gICAgICAgIC8qIFx1MjUwMFx1MjUwMFx1MjUwMCBUQUI6IExcdTFFREFQIChDSEFUIE5cdTFFRDhJIEJcdTFFRDggTFx1MUVEQVAgXHUyMDE0IENIXHUxRUM4IERcdTAwQzBOSCBDSE8gVEhcdTAwQzBOSCBWSVx1MDBDQU4gXHUwMTEwXHUwMEMzIFhcdTAwQzFDIE1JTkgpIFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIG1pbi1oLTBcIj5cbiAgICAgICAgICB7LyogQ2xhc3MgSGVhZGVyIGluZm8gYmFyICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgYmctWyMwQjBFMTRdIGJvcmRlci1iIGJvcmRlci13aGl0ZS81IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB0ZXh0LXhzXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LWJvbGQgdGV4dC1jeWFuLTMwMFwiPlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGRUIge2NsYXNzVGVuTG9wIHx8IGF1dGg/LnVzZXI/LnRlbkxvcCB8fCAnUGhcdTAwRjJuZyBjaGF0IGxcdTFFREJwJ31cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIHthdXRoPy51c2VyPy5pc1RlYWNoZXIgJiYgdGVhY2hlckNsYXNzZXMubGVuZ3RoID4gMSAmJiAoXG4gICAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgICB2YWx1ZT17Y2xhc3NMb3BJZH1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBpZCA9IE51bWJlcihlLnRhcmdldC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICBzZXRDbGFzc0xvcElkKGlkKTtcbiAgICAgICAgICAgICAgICAgIGxhc3RDbGFzc01lc3NhZ2VJZFJlZi5jdXJyZW50ID0gMDtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IHRleHQtd2hpdGUgdGV4dC1bMTBweF0gZm9udC1ib2xkIHJvdW5kZWQtbGcgcHgtMiBweS0xIGZvY3VzOm91dGxpbmUtbm9uZVwiPlxuICAgICAgICAgICAgICAgIHt0ZWFjaGVyQ2xhc3Nlcy5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIGtleT17Yy5pZH0gdmFsdWU9e2MuaWR9PntjLnRlbn08L29wdGlvbj5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgey8qIENsYXNzIE1lc3NhZ2UgTGlzdCAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy15LWF1dG8gcC0zIHNwYWNlLXktMi41IHRleHQteHNcIj5cbiAgICAgICAgICAgIHtjbGFzc01lc3NhZ2VzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1jZW50ZXIgcC00XCI+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDBcIj5DaFx1MDFCMGEgY1x1MDBGMyB0aW4gbmhcdTFFQUZuIGxcdTFFREJwLiBIXHUwMEUzeSBnXHUxRUVEaSBsXHUxRUREaSBjaFx1MDBFMG8gXHUwMTExXHUxRUE3dSB0aVx1MDBFQW4hPC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIGNsYXNzTWVzc2FnZXMubWFwKG1zZyA9PiAoXG4gICAgICAgICAgICAgICAgPGRpdiBrZXk9e21zZy5pZH0gY2xhc3NOYW1lPXtgZ3JvdXAgZmxleCBmbGV4LWNvbCAke21zZy5sYVRpbkN1YVRvaSA/ICdpdGVtcy1lbmQnIDogJ2l0ZW1zLXN0YXJ0J31gfT5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBtYi0wLjUgcHgtMVwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDBcIj57bXNnLnRlbk5ndW9pR3VpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAge21zZy52YWlUcm8gPT09ICdnaWFvX3ZpZW4nICYmIChcbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xIHB5LTAuMiByb3VuZGVkIHRleHQtWzhweF0gZm9udC1ibGFjayBiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzBcIj5HVkNOPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAge21zZy50YW9MdWMgPyBuZXcgRGF0ZShtc2cudGFvTHVjLnJlcGxhY2UoJyAnLCAnVCcpICsgJ1onKS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JyB9KSA6ICcnfVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEuNSByb3VuZGVkLXhsIG1heC13LVs4NSVdIGJyZWFrLXdvcmRzIHRleHQteHMgbGVhZGluZy1yZWxheGVkICR7bXNnLmxhVGluQ3VhVG9pID8gJ2JnLWN5YW4tNTAwLzIwIHRleHQtY3lhbi0xMDAgYm9yZGVyIGJvcmRlci1jeWFuLTUwMC80MCByb3VuZGVkLXRyLW5vbmUnIDogJ2JnLVsjMEIwRTE0XSB0ZXh0LXNsYXRlLTIwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC10bC1ub25lJ31gfT5cbiAgICAgICAgICAgICAgICAgICAge21zZy5ub2lEdW5nfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICkpXG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPGRpdiByZWY9e2NsYXNzRW5kUmVmfSAvPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgey8qIFJhdGUgbGltaXQgbm90aWNlICovfVxuICAgICAgICAgIHtjbGFzc05vdGljZSAmJiAoXG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJweC0zIHB5LTEgdGV4dC1bMTBweF0gdGV4dC1hbWJlci00MDAgYmctYW1iZXItNTAwLzEwIGJvcmRlci10IGJvcmRlci1hbWJlci01MDAvMjBcIj57Y2xhc3NOb3RpY2V9PC9wPlxuICAgICAgICAgICl9XG5cbiAgICAgICAgICB7LyogQ29tcG9zZXIgKi99XG4gICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVNlbmRDbGFzc30gY2xhc3NOYW1lPVwicC0yIGJvcmRlci10IGJvcmRlci13aGl0ZS8xMCBiZy1bIzExMTYyMF0vODAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgc2hyaW5rLTAgcmVsYXRpdmVcIj5cbiAgICAgICAgICAgIHtzaG93RW1vamlQaWNrZXIgPT09ICdjbGFzcycgJiYgKFxuICAgICAgICAgICAgICA8RW1vamlQaWNrZXJQb3B1cFxuICAgICAgICAgICAgICAgIG9uU2VsZWN0PXsoZW1vamkpID0+IGhhbmRsZUluc2VydEVtb2ppKGVtb2ppLCAnY2xhc3MnKX1cbiAgICAgICAgICAgICAgICBvbkNsb3NlPXsoKSA9PiBzZXRTaG93RW1vamlQaWNrZXIobnVsbCl9XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2hvd0Vtb2ppUGlja2VyKHNob3dFbW9qaVBpY2tlciA9PT0gJ2NsYXNzJyA/IG51bGwgOiAnY2xhc3MnKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0yIHJvdW5kZWQteGwgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC15ZWxsb3ctMzAwIGhvdmVyOmJnLXdoaXRlLzUgdGV4dC1iYXNlIHRyYW5zaXRpb24tY29sb3JzIHNocmluay0wXCJcbiAgICAgICAgICAgICAgdGl0bGU9XCJUaFx1MDBFQW0gYmlcdTFFQzN1IHRcdTAxQjBcdTFFRTNuZyBjXHUxRUEzbSB4XHUwMEZBY1wiPlxuICAgICAgICAgICAgICBcdUQ4M0RcdURFMEFcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgIGlkPVwiaW5wdXQtY2xhc3MtY2hhdFwiXG4gICAgICAgICAgICAgIHJvd3M9ezF9XG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiTmhcdTFFQUZuIHRpbiB2XHUxRURCaSBsXHUxRURCcC4uLlwiXG4gICAgICAgICAgICAgIHZhbHVlPXtjbGFzc0lucHV0fVxuICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRDbGFzc0lucHV0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0PXsoKSA9PiB7IGlzQ2xhc3NDb21wb3NpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ9eygpID0+IHsgaXNDbGFzc0NvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7IH19XG4gICAgICAgICAgICAgIG9uS2V5RG93bj17ZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInICYmICFlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgICBpZiAoZS5uYXRpdmVFdmVudD8uaXNDb21wb3NpbmcgfHwgaXNDbGFzc0NvbXBvc2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICBoYW5kbGVTZW5kQ2xhc3MoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIG1heExlbmd0aD17MzAwfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBweC0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLWN5YW4tNDAwLzYwIHJlc2l6ZS1ub25lIG1pbi1oLVszOHB4XSBtYXgtaC0yNFwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgaWQ9XCJidG4tc2VuZC1jbGFzcy1jaGF0XCJcbiAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjbGFzc0lucHV0LnRyaW0oKSB8fCBjbGFzc1NlbmRpbmd9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMiByb3VuZGVkLXhsIGJnLWN5YW4tNDAwIGhvdmVyOmJnLWN5YW4tMzAwIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktMzAgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIHNocmluay0wXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgR1x1MUVFRGlcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogKFxuICAgICAgICAvKiBcdTI1MDBcdTI1MDBcdTI1MDAgVEFCOiBUXHUwMEQ0SSAoQlx1MUVBME4gQlx1MDBDOCAmIFRJTiBOSFx1MUVBRU4gUklcdTAwQ0FORyAxLTEpIFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIG1pbi1oLTBcIj5cbiAgICAgICAgICB7IWFjdGl2ZUZyaWVuZCA/IChcbiAgICAgICAgICAgIC8qIEZSSUVORCBMSVNUIFZJRVcgKi9cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgbWluLWgtMFwiPlxuICAgICAgICAgICAgICB7LyogRnJpZW5kcyBUb3AgQmFyICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMi41IGJvcmRlci1iIGJvcmRlci13aGl0ZS81IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBiZy1bIzExMTYyMF0vNDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMFwiPkJcdTFFQTFuIGJcdTAwRTggKHtmcmllbmRzLmxlbmd0aH0pPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dBZGRGcmllbmQodHJ1ZSl9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXdoaXRlLzUgaG92ZXI6YmctWyMwMEYyRkVdLzE1IGhvdmVyOnRleHQtWyMwMEYyRkVdIHRleHQtc2xhdGUtMzAwIHRleHQtWzExcHhdIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj4rPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+S1x1MUVCRnQgYlx1MUVBMW48L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBQZW5kaW5nIFJlcXVlc3RzIFNlY3Rpb24gKi99XG4gICAgICAgICAgICAgIHtwZW5kaW5nSW5jb21pbmcubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTIgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzUgYmctcHVycGxlLTk1MC8yMFwiPlxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtcHVycGxlLTMwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgbWItMS41IHB4LTFcIj5MXHUxRUREaSBtXHUxRUREaSBrXHUxRUJGdCBiXHUxRUExbiAoe3BlbmRpbmdJbmNvbWluZy5sZW5ndGh9KTwvcD5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAge3BlbmRpbmdJbmNvbWluZy5tYXAocmVxID0+IChcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17cmVxLnJlcXVlc3RJZH0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHAtMS41IHJvdW5kZWQtbGcgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvNSB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi13LTAgcHItMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC13aGl0ZSB0cnVuY2F0ZSB0ZXh0LVsxMXB4XVwiPntyZXEuZGlzcGxheU5hbWV9PC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNDAwXCI+QHtyZXEudXNlcm5hbWV9IHtyZXEuY2xhc3NCYWRnZSA/IGBcdTIwMjIgJHtyZXEuY2xhc3NCYWRnZX1gIDogJyd9PC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IGhhbmRsZUFjY2VwdEZyaWVuZChyZXEucmVxdWVzdElkLCByZXEuZnJvbUFjY291bnRJZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMiBweS0wLjUgcm91bmRlZCBiZy1lbWVyYWxkLTUwMC8yMCB0ZXh0LWVtZXJhbGQtMzAwIGhvdmVyOmJnLWVtZXJhbGQtNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MDExMFx1MUVEM25nIFx1MDBGRFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gaGFuZGxlRGVjbGluZUZyaWVuZChyZXEucmVxdWVzdElkLCByZXEuZnJvbUFjY291bnRJZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIGJnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LVsxMHB4XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgIHsvKiBGcmllbmRzIExpc3QgKi99XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXktYXV0byBwLTIgc3BhY2UteS0xXCI+XG4gICAgICAgICAgICAgICAge2ZyaWVuZHMubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLWZ1bGwgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1jZW50ZXIgcC00XCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtMnhsIG1iLTFcIj5cdUQ4M0RcdURDNjU8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDBcIj5DaFx1MDFCMGEgY1x1MDBGMyBiXHUxRUExbiBiXHUwMEU4IG5cdTAwRTBvLjwvcD5cbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDAgbXQtMVwiPkJcdTFFQTVtIFwiKyBLXHUxRUJGdCBiXHUxRUExblwiIFx1MDExMVx1MUVDMyB0XHUwMEVDbSB2XHUwMEUwIGtcdTFFQkZ0IG5cdTFFRDFpIGNcdTAwRjluZyBiXHUxRUExbiBiXHUwMEU4IHRyXHUwMUIwXHUxRUREbmcuPC9wPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgIGZyaWVuZHMubWFwKGYgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGtleT17Zi5mcmllbmRzaGlwSWR9IHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0QWN0aXZlRnJpZW5kKGYpOyBtYXJrRG1SZWFkKGYuYWNjb3VudElkKTsgdGFpRG1NZXNzYWdlcyhmLmFjY291bnRJZCk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwLTIgcm91bmRlZC14bCBiZy1bIzBCMEUxNF0vNjAgaG92ZXI6YmctWyMwMEYyRkVdLzEwIGJvcmRlciBib3JkZXItd2hpdGUvNSBob3Zlcjpib3JkZXItWyMwMEYyRkVdLzMwIHRyYW5zaXRpb24tYWxsIHRleHQtbGVmdCBncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTcgaC03IHJvdW5kZWQtbGcgYmctZ3JhZGllbnQtdG8tdHIgZnJvbS1bIzAwRjJGRV0vMzAgdG8tWyM4QjVDRjZdLzMwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGZvbnQtYm9sZCB0ZXh0LXhzIHRleHQtd2hpdGUgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge2YuZGlzcGxheU5hbWUgPyBmLmRpc3BsYXlOYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpIDogJz8nfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi13LTAgZmxleC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtd2hpdGUgZ3JvdXAtaG92ZXI6dGV4dC1bIzAwRjJGRV0gdHJhbnNpdGlvbi1jb2xvcnMgdHJ1bmNhdGVcIj57Zi5kaXNwbGF5TmFtZX08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwIHRydW5jYXRlXCI+QHtmLnVzZXJuYW1lfSB7Zi5jbGFzc0JhZGdlID8gYFx1MjAyMiAke2YuY2xhc3NCYWRnZX1gIDogJyd9PC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge0Jvb2xlYW4odW5yZWFkRG1zW2YuYWNjb3VudElkXSkgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQtZnVsbCBiZy1jeWFuLTQwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC1bOXB4XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtmb3JtYXRCYWRnZSh1bnJlYWREbXNbZi5hY2NvdW50SWRdKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDAgZ3JvdXAtaG92ZXI6dGV4dC13aGl0ZSB0cmFuc2l0aW9uLWNvbG9yc1wiPlx1MjAzQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIC8qIFBSSVZBVEUgQ09OVkVSU0FUSU9OIFZJRVcgKi9cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgbWluLWgtMFwiPlxuICAgICAgICAgICAgICB7LyogQ29udm8gSGVhZGVyICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMiBib3JkZXItYiBib3JkZXItd2hpdGUvMTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGJnLVsjMTExNjIwXS82MCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlRnJpZW5kKG51bGwpfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTEgcm91bmRlZC1sZyBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIHRleHQteHMgZm9udC1ib2xkXCIgdGl0bGU9XCJRdWF5IGxcdTFFQTFpIGRhbmggc1x1MDBFMWNoIGJcdTFFQTFuIGJcdTAwRThcIj5cbiAgICAgICAgICAgICAgICAgICAgXHUyMDM5XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIHRydW5jYXRlXCI+e2FjdGl2ZUZyaWVuZC5kaXNwbGF5TmFtZX08L3A+XG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1zbGF0ZS00MDAgdHJ1bmNhdGVcIj5Ae2FjdGl2ZUZyaWVuZC51c2VybmFtZX0ge2FjdGl2ZUZyaWVuZC5jbGFzc0JhZGdlID8gYFx1MjAyMiAke2FjdGl2ZUZyaWVuZC5jbGFzc0JhZGdlfWAgOiAnJ308L3A+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIHsvKiBDb252byBTYWZldHkgQWN0aW9ucyAqL31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRSZXBvcnRNb2RhbCh7IHRhcmdldElkOiBhY3RpdmVGcmllbmQuYWNjb3VudElkLCB0YXJnZXROYW1lOiBhY3RpdmVGcmllbmQuZGlzcGxheU5hbWUgfSl9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LWFtYmVyLTMwMCBob3ZlcjpiZy13aGl0ZS81IHRyYW5zaXRpb24tYWxsXCIgdGl0bGU9XCJCXHUwMEUxbyBjXHUwMEUxbyBuZ1x1MDFCMFx1MUVERGkgZFx1MDBGOW5nIG5cdTAwRTB5XCI+XG4gICAgICAgICAgICAgICAgICAgIEJcdTAwRTFvIGNcdTAwRTFvXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IGhhbmRsZUJsb2NrKGFjdGl2ZUZyaWVuZC5hY2NvdW50SWQpfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1yb3NlLTQwMCBob3ZlcjpiZy13aGl0ZS81IHRyYW5zaXRpb24tYWxsXCIgdGl0bGU9XCJDaFx1MUVCN24gbmdcdTAxQjBcdTFFRERpIG5cdTAwRTB5XCI+XG4gICAgICAgICAgICAgICAgICAgIENoXHUxRUI3blxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBoYW5kbGVVbmZyaWVuZChhY3RpdmVGcmllbmQuYWNjb3VudElkKX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtc2xhdGUtMjAwIGhvdmVyOmJnLXdoaXRlLzUgdHJhbnNpdGlvbi1hbGxcIiB0aXRsZT1cIkhcdTFFRTd5IGtcdTFFQkZ0IGJcdTFFQTFuXCI+XG4gICAgICAgICAgICAgICAgICAgIEhcdTFFRTd5IGJcdTFFQTFuXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgey8qIERNIE1lc3NhZ2VzIExpc3QgKi99XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXktYXV0byBwLTMgc3BhY2UteS0yIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICB7ZG1NZXNzYWdlcy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LWNlbnRlciBwLTRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDBcIj5CXHUxRUFGdCBcdTAxMTFcdTFFQTd1IHRyXHUwMEYyIGNodXlcdTFFQzduIHJpXHUwMEVBbmcgdlx1MUVEQmkge2FjdGl2ZUZyaWVuZC5kaXNwbGF5TmFtZX0uPC9wPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgIGRtTWVzc2FnZXMubWFwKG1zZyA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXttc2cuaWR9IGNsYXNzTmFtZT17YGdyb3VwIGZsZXggZmxleC1jb2wgJHttc2cuaXNNZSA/ICdpdGVtcy1lbmQnIDogJ2l0ZW1zLXN0YXJ0J31gfT5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YHB4LTIuNSBweS0xLjUgcm91bmRlZC14bCBtYXgtdy1bODUlXSBicmVhay13b3JkcyB0ZXh0LXhzIGxlYWRpbmctcmVsYXhlZCAke21zZy5pc01lID8gJ2JnLVsjMDBGMkZFXS8yMCB0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIHJvdW5kZWQtdHItbm9uZScgOiAnYmctWyMwQjBFMTRdIHRleHQtc2xhdGUtMjAwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC10bC1ub25lJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge21zZy5jb250ZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IW1zZy5pc01lICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFJlcG9ydE1vZGFsKHsgdGFyZ2V0SWQ6IGFjdGl2ZUZyaWVuZC5hY2NvdW50SWQsIHRhcmdldE5hbWU6IGFjdGl2ZUZyaWVuZC5kaXNwbGF5TmFtZSwgbWVzc2FnZUlkOiBtc2cuaWQsIG1lc3NhZ2VDb250ZW50OiBtc2cuY29udGVudCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcGFjaXR5LTAgZ3JvdXAtaG92ZXI6b3BhY2l0eS0xMDAgdGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1hbWJlci0zMDAgdHJhbnNpdGlvbi1vcGFjaXR5IHAtMC41XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkJcdTAwRTFvIGNcdTAwRTFvIHRpbiBuaFx1MUVBRm4gblx1MDBFMHlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNEXHVERUE5XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs4cHhdIHRleHQtc2xhdGUtNDAwIG10LTAuNSBweC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bmV3IERhdGUobXNnLmNyZWF0ZWRBdCkudG9Mb2NhbGVUaW1lU3RyaW5nKFtdLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8ZGl2IHJlZj17ZG1FbmRSZWZ9IC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBSYXRlIGxpbWl0IG5vdGljZSAqL31cbiAgICAgICAgICAgICAge2RtTm90aWNlICYmIChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJweC0zIHB5LTEgdGV4dC1bMTBweF0gdGV4dC1hbWJlci00MDAgYmctYW1iZXItNTAwLzEwIGJvcmRlci10IGJvcmRlci1hbWJlci01MDAvMjBcIj57ZG1Ob3RpY2V9PC9wPlxuICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgIHsvKiBETSBDb21wb3NlciAqL31cbiAgICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVNlbmREbX0gY2xhc3NOYW1lPVwicC0yIGJvcmRlci10IGJvcmRlci13aGl0ZS8xMCBiZy1bIzExMTYyMF0vODAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgc2hyaW5rLTAgcmVsYXRpdmVcIj5cbiAgICAgICAgICAgICAgICB7c2hvd0Vtb2ppUGlja2VyID09PSAnZG0nICYmIChcbiAgICAgICAgICAgICAgICAgIDxFbW9qaVBpY2tlclBvcHVwXG4gICAgICAgICAgICAgICAgICAgIG9uU2VsZWN0PXsoZW1vamkpID0+IGhhbmRsZUluc2VydEVtb2ppKGVtb2ppLCAnZG0nKX1cbiAgICAgICAgICAgICAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd0Vtb2ppUGlja2VyKG51bGwpfVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2hvd0Vtb2ppUGlja2VyKHNob3dFbW9qaVBpY2tlciA9PT0gJ2RtJyA/IG51bGwgOiAnZG0nKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiByb3VuZGVkLXhsIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQteWVsbG93LTMwMCBob3ZlcjpiZy13aGl0ZS81IHRleHQtYmFzZSB0cmFuc2l0aW9uLWNvbG9ycyBzaHJpbmstMFwiXG4gICAgICAgICAgICAgICAgICB0aXRsZT1cIlRoXHUwMEVBbSBiaVx1MUVDM3UgdFx1MDFCMFx1MUVFM25nIGNcdTFFQTNtIHhcdTAwRkFjXCI+XG4gICAgICAgICAgICAgICAgICBcdUQ4M0RcdURFMEFcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtZG0tY2hhdFwiXG4gICAgICAgICAgICAgICAgICByb3dzPXsxfVxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e2BOaFx1MUVBRm4gY2hvICR7YWN0aXZlRnJpZW5kLmRpc3BsYXlOYW1lfS4uLmB9XG4gICAgICAgICAgICAgICAgICB2YWx1ZT17ZG1JbnB1dH1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldERtSW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0PXsoKSA9PiB7IGlzRG1Db21wb3NpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPXsoKSA9PiB7IGlzRG1Db21wb3NpbmdSZWYuY3VycmVudCA9IGZhbHNlOyB9fVxuICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXtlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInICYmICFlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGUubmF0aXZlRXZlbnQ/LmlzQ29tcG9zaW5nIHx8IGlzRG1Db21wb3NpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVTZW5kRG0oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17NTAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcHgtMyBweS0yIHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNjAgcmVzaXplLW5vbmUgbWluLWgtWzM4cHhdIG1heC1oLTI0XCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tc2VuZC1kbS1jaGF0XCJcbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshZG1JbnB1dC50cmltKCkgfHwgZG1TZW5kaW5nfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0yIHJvdW5kZWQteGwgYmctWyMwMEYyRkVdIGhvdmVyOmJnLVsjMDBlMWVjXSB0ZXh0LWJsYWNrIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTMwIGRpc2FibGVkOmN1cnNvci1ub3QtYWxsb3dlZCBzaHJpbmstMFwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgR1x1MUVFRGlcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogXHUyNTAwXHUyNTAwXHUyNTAwIE1PREFMOiBLXHUxRUJFVCBCXHUxRUEwTiAoU0VBUkNIIFBPUFVQKSBcdTI1MDBcdTI1MDBcdTI1MDAgKi99XG4gICAgICB7c2hvd0FkZEZyaWVuZCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZml4ZWQgaW5zZXQtMCB6LTUwIGJnLWJsYWNrLzc1IGJhY2tkcm9wLWJsdXItc20gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00XCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xNSByb3VuZGVkLTJ4bCBtYXgtdy1zbSB3LWZ1bGwgcC00IHNoYWRvdy0yeGwgZmxleCBmbGV4LWNvbCBnYXAtM1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcGItMiBib3JkZXItYiBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtd2hpdGUgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1Mjc5NTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5LXHUxRUJGdCBiXHUxRUExbiBtXHUxRURCaTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4geyBzZXRTaG93QWRkRnJpZW5kKGZhbHNlKTsgc2V0U2VhcmNoUmVzdWx0cyhbXSk7IHNldFNlYXJjaFF1ZXJ5KCcnKTsgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHRleHQtc21cIj5cdTI3MTU8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJOaFx1MUVBRHAgdFx1MDBFQW4gXHUwMTExXHUwMTAzbmcgbmhcdTFFQURwICh0XHUxRUQxaSB0aGlcdTFFQzN1IDQga1x1MDBGRCB0XHUxRUYxKS4uLlwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e3NlYXJjaFF1ZXJ5fVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGhhbmRsZVNlYXJjaEZyaWVuZHMoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHB4LTMgcHktMiB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdXCJcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDAgbXQtMVwiPkdcdTAwRjUgdFx1MUVEMWkgdGhpXHUxRUMzdSA0IGtcdTAwRkQgdFx1MUVGMSAodFx1MDBFQW4gXHUwMTExXHUwMTAzbmcgbmhcdTFFQURwKSBcdTAxMTFcdTFFQzMgdFx1MDBFQ20ga2lcdTFFQkZtIGJcdTFFQTFuIGJcdTAwRTguPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHthY3Rpb25GZWVkYmFjayAmJiAoXG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtZW1lcmFsZC00MDAgZm9udC1ib2xkXCI+e2FjdGlvbkZlZWRiYWNrfTwvcD5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWF4LWgtNDggb3ZlcmZsb3cteS1hdXRvIHNwYWNlLXktMS41XCI+XG4gICAgICAgICAgICAgIHtzZWFyY2hMb2FkaW5nID8gKFxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIHRleHQtY2VudGVyIHB5LTJcIj5cdTAxMTBhbmcgdFx1MDBFQ20ga2lcdTFFQkZtLi4uPC9wPlxuICAgICAgICAgICAgICApIDogc2VhcmNoUmVzdWx0cy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgc2VhcmNoUXVlcnkudHJpbSgpLmxlbmd0aCA+PSA0ID8gKFxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgdGV4dC1jZW50ZXIgcHktMlwiPktoXHUwMEY0bmcgdFx1MDBFQ20gdGhcdTFFQTV5IHRcdTAwRTBpIGtob1x1MUVBM24gcGhcdTAwRjkgaFx1MUVFM3AuPC9wPlxuICAgICAgICAgICAgICAgICkgOiBudWxsXG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgc2VhcmNoUmVzdWx0cy5tYXAodSA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17dS5pZH0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHAtMiByb3VuZGVkLXhsIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgdGV4dC14c1wiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi13LTAgcHItMlwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXdoaXRlIHRydW5jYXRlXCI+e3UuZGlzcGxheU5hbWV9PC9wPlxuICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwXCI+QHt1LnVzZXJuYW1lfSB7dS5jbGFzc0JhZGdlID8gYFx1MjAyMiAke3UuY2xhc3NCYWRnZX1gIDogJyd9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAge3UuZnJpZW5kc2hpcFN0YXR1cyA9PT0gJ2ZyaWVuZHMnID8gKFxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LWVtZXJhbGQtNDAwIHNocmluay0wXCI+Qlx1MUVBMW4gYlx1MDBFODwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgKSA6IHUuZnJpZW5kc2hpcFN0YXR1cyA9PT0gJ3NlbnRfcGVuZGluZycgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtYW1iZXItNDAwIHNocmluay0wXCI+XHUwMTEwXHUwMEUzIGdcdTFFRURpIGxcdTFFRERpIG1cdTFFRERpPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICApIDogdS5mcmllbmRzaGlwU3RhdHVzID09PSAncmVjZWl2ZWRfcGVuZGluZycgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtcHVycGxlLTQwMCBzaHJpbmstMFwiPlx1MDExMGFuZyBjaFx1MUVERCBiXHUxRUExbiBkdXlcdTFFQzd0PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IGhhbmRsZVJlcXVlc3RGcmllbmQodS5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXSBob3ZlcjpiZy1bIzAwZTFlY10gdGV4dC1ibGFjayBmb250LWJvbGQgdGV4dC1bMTBweF0gc2hyaW5rLTAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIEtcdTFFQkZ0IGJcdTFFQTFuXG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIFx1MjUwMFx1MjUwMFx1MjUwMCBNT0RBTDogQlx1MDBDMU8gQ1x1MDBDMU8gQU4gVE9cdTAwQzBOIChSRVBPUlQgUE9QVVApIFx1MjUwMFx1MjUwMFx1MjUwMCAqL31cbiAgICAgIHtyZXBvcnRNb2RhbCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZml4ZWQgaW5zZXQtMCB6LTUwIGJnLWJsYWNrLzgwIGJhY2tkcm9wLWJsdXItc20gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00XCI+XG4gICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVN1Ym1pdFJlcG9ydH0gY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTUgcm91bmRlZC0yeGwgbWF4LXctc20gdy1mdWxsIHAtNCBzaGFkb3ctMnhsIGZsZXggZmxleC1jb2wgZ2FwLTNcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHBiLTIgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LWFtYmVyLTMwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyNkEwXHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPntyZXBvcnRNb2RhbC5tZXNzYWdlSWQgPyAnQlx1MDBFMW8gY1x1MDBFMW8gdGluIG5oXHUxRUFGbicgOiBgQlx1MDBFMW8gY1x1MDBFMW8gbmdcdTAxQjBcdTFFRERpIGRcdTAwRjluZzogJHtyZXBvcnRNb2RhbC50YXJnZXROYW1lfWB9PC9zcGFuPlxuICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRSZXBvcnRNb2RhbChudWxsKX0gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LXNtXCI+XHUyNzE1PC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHtyZXBvcnRNb2RhbC5tZXNzYWdlQ29udGVudCAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC0yLjUgcm91bmRlZC14bCBiZy1ibGFjay80MCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQteHMgdGV4dC1zbGF0ZS0zMDAgaXRhbGljXCI+XG4gICAgICAgICAgICAgICAgXCJ7cmVwb3J0TW9kYWwubWVzc2FnZUNvbnRlbnQuc2xpY2UoMCwgMTAwKX17cmVwb3J0TW9kYWwubWVzc2FnZUNvbnRlbnQubGVuZ3RoID4gMTAwID8gJy4uLicgOiAnJ31cIlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgICBCXHUwMEUxbyBjXHUwMEUxbyBzXHUxRUJEIFx1MDExMVx1MDFCMFx1MUVFM2MgY2h1eVx1MUVDM24gdGhcdTFFQjNuZyBcdTAxMTFcdTFFQkZuIFRydW5nIHRcdTAwRTJtIEtpXHUxRUMzbSBkdXlcdTFFQzd0IGNcdTFFRTdhIEdpXHUwMEUxbyB2aVx1MDBFQW4uXG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJNXHUwMEY0IHRcdTFFQTMgbFx1MDBGRCBkbyBiXHUwMEUxbyBjXHUwMEUxbyAobmdcdTAwRjRuIHRcdTFFRUIga2hcdTAwRjRuZyBwaFx1MDBGOSBoXHUxRUUzcCwgbFx1MDBFMG0gcGhpXHUxRUMxbiwgc3BhbS4uLilcIlxuICAgICAgICAgICAgICB2YWx1ZT17cmVwb3J0UmVhc29ufVxuICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRSZXBvcnRSZWFzb24oZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICBtYXhMZW5ndGg9ezUwMH1cbiAgICAgICAgICAgICAgcm93cz17M31cbiAgICAgICAgICAgICAgcmVxdWlyZWRcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0yIHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1hbWJlci00MDBcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1lbmQgZ2FwLTIgcHQtMVwiPlxuICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRSZXBvcnRNb2RhbChudWxsKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgdGV4dC14c1wiPlxuICAgICAgICAgICAgICAgIEhcdTFFRTd5XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIiBkaXNhYmxlZD17IXJlcG9ydFJlYXNvbi50cmltKCkgfHwgcmVwb3J0aW5nfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQteGwgYmctYW1iZXItNTAwIGhvdmVyOmJnLWFtYmVyLTQwMCB0ZXh0LWJsYWNrIHRleHQteHMgZm9udC1ib2xkIGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICB7cmVwb3J0aW5nID8gJ1x1MDExMGFuZyBnXHUxRUVEaS4uLicgOiAnR1x1MUVFRGkgYlx1MDBFMW8gY1x1MDBFMW8nfVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIkFBQ0EsTUFBTSxtQkFBbUI7QUFBQSxFQUN2QjtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sUUFBUSxDQUFDLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxXQUFJO0FBQUEsRUFDN0w7QUFBQSxFQUNBO0FBQUEsSUFDRSxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixR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
