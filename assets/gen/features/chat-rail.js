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
      campusEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [campusMessages.length, tab]);
  React.useEffect(() => {
    if (tab === "class" && classEndRef.current) {
      classEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [classMessages.length, tab]);
  React.useEffect(() => {
    if (tab === "me" && activeFriend && dmEndRef.current) {
      dmEndRef.current.scrollIntoView({ behavior: "smooth" });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvY2hhdC1yYWlsLmpzeCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiXG5jb25zdCBFTU9KSV9DQVRFR09SSUVTID0gW1xuICB7XG4gICAgbmFtZTogJ01cdTFFQjd0IGNcdTAxQjBcdTFFRERpJyxcbiAgICBpY29uOiAnXHVEODNEXHVERTBBJyxcbiAgICBlbW9qaXM6IFsnXHVEODNEXHVERTAwJywgJ1x1RDgzRFx1REUwMycsICdcdUQ4M0RcdURFMDQnLCAnXHVEODNEXHVERTAxJywgJ1x1RDgzRFx1REUwNicsICdcdUQ4M0RcdURFMDUnLCAnXHVEODNEXHVERTAyJywgJ1x1RDgzRVx1REQyMycsICdcdUQ4M0RcdURFMEEnLCAnXHVEODNEXHVERTA3JywgJ1x1RDgzRFx1REU0MicsICdcdUQ4M0RcdURFNDMnLCAnXHVEODNEXHVERTA5JywgJ1x1RDgzRFx1REUwQycsICdcdUQ4M0RcdURFMEQnLCAnXHVEODNFXHVERDcwJywgJ1x1RDgzRFx1REUxOCcsICdcdUQ4M0RcdURFMEInLCAnXHVEODNEXHVERTFCJywgJ1x1RDgzRFx1REUxQycsICdcdUQ4M0VcdUREMkEnLCAnXHVEODNEXHVERTBFJywgJ1x1RDgzRVx1REQ3MycsICdcdUQ4M0VcdUREMjknLCAnXHVEODNFXHVERDE0JywgJ1x1RDgzRVx1REQyQicsICdcdUQ4M0RcdURFMzQnLCAnXHVEODNEXHVERTM3JywgJ1x1RDgzRVx1REQyRicsICdcdUQ4M0VcdUREMjAnXVxuICB9LFxuICB7XG4gICAgbmFtZTogJ0NcdTFFQTNtIHhcdTAwRkFjICYgVGF5JyxcbiAgICBpY29uOiAnXHUyNzY0XHVGRTBGJyxcbiAgICBlbW9qaXM6IFsnXHUyNzY0XHVGRTBGJywgJ1x1RDgzRVx1RERFMScsICdcdUQ4M0RcdURDOUInLCAnXHVEODNEXHVEQzlBJywgJ1x1RDgzRFx1REM5OScsICdcdUQ4M0RcdURDOUMnLCAnXHVEODNEXHVEREE0JywgJ1x1RDgzRVx1REQwRCcsICdcdUQ4M0RcdURDOTQnLCAnXHVEODNEXHVEQzk2JywgJ1x1RDgzRFx1REQyNScsICdcdUQ4M0RcdURDQUYnLCAnXHUyNzI4JywgJ1x1RDgzQ1x1REYxRicsICdcdTJCNTAnLCAnXHVEODNEXHVEQ0E1JywgJ1x1RDgzRFx1RENBQycsICdcdUQ4M0RcdURDNEQnLCAnXHVEODNEXHVEQzRFJywgJ1x1RDgzRFx1REM0RicsICdcdUQ4M0RcdURFNEMnLCAnXHVEODNFXHVERDFEJywgJ1x1RDgzRFx1REM0QScsICdcdTI3MENcdUZFMEYnLCAnXHVEODNFXHVERDFFJywgJ1x1RDgzRVx1REQxRicsICdcdUQ4M0RcdURDNEMnLCAnXHVEODNEXHVEQzRCJywgJ1x1RDgzRFx1REU0RiddXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVHJcdTAxQjBcdTFFRERuZyBoXHUxRUNEYyAmIFZ1aScsXG4gICAgaWNvbjogJ1x1RDgzQ1x1REY5MycsXG4gICAgZW1vamlzOiBbJ1x1RDgzRFx1RENEQScsICdcdUQ4M0RcdURDRDYnLCAnXHVEODNEXHVEQ0Q1JywgJ1x1RDgzRFx1RENENycsICdcdUQ4M0RcdURDRDgnLCAnXHVEODNDXHVERjkzJywgJ1x1RDgzQ1x1REZFQicsICdcdUQ4M0NcdURGOTInLCAnXHVEODNEXHVEQ0REJywgJ1x1MjcwRlx1RkUwRicsICdcdUQ4M0NcdURGQUYnLCAnXHVEODNDXHVERkFFJywgJ1x1RDgzQ1x1REZCMicsICdcdUQ4M0NcdURGQzYnLCAnXHVEODNFXHVERDQ3JywgJ1x1MjYxNScsICdcdUQ4M0NcdURGNTUnLCAnXHVEODNDXHVERjcwJywgJ1x1RDgzQ1x1REY4MicsICdcdUQ4M0RcdURFODAnLCAnXHVEODNEXHVEQ0ExJywgJ1x1RDgzQ1x1REY4OScsICdcdUQ4M0NcdURGODgnLCAnXHVEODNDXHVERkI1JywgJ1x1RDgzQ1x1REZCNicsICdcdUQ4M0RcdURDMzEnLCAnXHVEODNEXHVEQzM2JywgJ1x1RDgzQ1x1REYzOCcsICdcdUQ4M0NcdURGNDAnXVxuICB9XG5dO1xuXG5mdW5jdGlvbiBFbW9qaVBpY2tlclBvcHVwKHsgb25TZWxlY3QsIG9uQ2xvc2UgfSkge1xuICBjb25zdCBbYWN0aXZlQ2F0LCBzZXRBY3RpdmVDYXRdID0gUmVhY3QudXNlU3RhdGUoMCk7XG4gIGNvbnN0IHBvcHVwUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgaGFuZGxlT3V0c2lkZSA9IChlKSA9PiB7XG4gICAgICBpZiAocG9wdXBSZWYuY3VycmVudCAmJiAhcG9wdXBSZWYuY3VycmVudC5jb250YWlucyhlLnRhcmdldCkpIHtcbiAgICAgICAgb25DbG9zZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlT3V0c2lkZSk7XG4gICAgcmV0dXJuICgpID0+IGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZU91dHNpZGUpO1xuICB9LCBbb25DbG9zZV0pO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtwb3B1cFJlZn1cbiAgICAgIGNsYXNzTmFtZT1cImFic29sdXRlIGJvdHRvbS1mdWxsIG1iLTIgcmlnaHQtMCBsZWZ0LTAgei01MCBiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci1jeWFuLTUwMC8zMCByb3VuZGVkLTJ4bCBwLTIuNSBzaGFkb3ctMnhsIGJhY2tkcm9wLWJsdXIteGwgYW5pbWF0ZS1zY2FsZUluIG1heC13LVszMjBweF0gbXgtYXV0byBzbTptbC1hdXRvIHNtOm1yLTBcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHBiLTIgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIG1iLTJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBvdmVyZmxvdy14LWF1dG9cIj5cbiAgICAgICAgICB7RU1PSklfQ0FURUdPUklFUy5tYXAoKGNhdCwgaWR4KSA9PiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGtleT17Y2F0Lm5hbWV9XG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVDYXQoaWR4KX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMiBweS0xIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgc2hyaW5rLTAgJHthY3RpdmVDYXQgPT09IGlkeCA/ICdiZy1bIzAwRjJGRV0vMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAnIDogJ3RleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtci0xXCI+e2NhdC5pY29ufTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+e2NhdC5uYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICkpfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIG9uQ2xpY2s9e29uQ2xvc2V9XG4gICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LXhzIHB4LTEgc2hyaW5rLTBcIj5cbiAgICAgICAgICBcdTI3MTVcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtNiBnYXAtMSBtYXgtaC00MCBvdmVyZmxvdy15LWF1dG8gcC0xXCI+XG4gICAgICAgIHtFTU9KSV9DQVRFR09SSUVTW2FjdGl2ZUNhdF0uZW1vamlzLm1hcCgoZW1vamkpID0+IChcbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBrZXk9e2Vtb2ppfVxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvblNlbGVjdChlbW9qaSl9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTkgaC05IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtbGcgcm91bmRlZC14bCBob3ZlcjpiZy13aGl0ZS8xMCBhY3RpdmU6c2NhbGUtOTAgdHJhbnNpdGlvbi10cmFuc2Zvcm1cIj5cbiAgICAgICAgICAgIHtlbW9qaX1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgKSl9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENBTVBVUyBDSEFUICYgU09DSUFMIFJBSUwgKFBIQVNFIDREOiBDQU1QVVMgfCBMXHUxRURBUCB8IFRcdTAwRDRJKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBmdW5jdGlvbiBDYW1wdXNDaGF0UmFpbCh7IGF1dGgsIG9uUmVxdWlyZUF1dGgsIGNsYXNzTmFtZSA9ICcnLCBpc0FjdGl2ZSA9IHRydWUgfSkge1xuICBjb25zdCBbdGFiLCBzZXRUYWJdID0gUmVhY3QudXNlU3RhdGUoJ2NhbXB1cycpOyAvLyAnY2FtcHVzJyB8ICdjbGFzcycgfCAnbWUnXG4gIGNvbnN0IFtzaG93RW1vamlQaWNrZXIsIHNldFNob3dFbW9qaVBpY2tlcl0gPSBSZWFjdC51c2VTdGF0ZShudWxsKTsgLy8gJ2NhbXB1cycgfCAnY2xhc3MnIHwgJ2RtJyB8IG51bGxcblxuICBjb25zdCBoYW5kbGVJbnNlcnRFbW9qaSA9IChlbW9qaSwgdGFyZ2V0KSA9PiB7XG4gICAgaWYgKHRhcmdldCA9PT0gJ2NhbXB1cycpIHtcbiAgICAgIHNldENhbXB1c0lucHV0KHByZXYgPT4gcHJldiArIGVtb2ppKTtcbiAgICB9IGVsc2UgaWYgKHRhcmdldCA9PT0gJ2NsYXNzJykge1xuICAgICAgc2V0Q2xhc3NJbnB1dChwcmV2ID0+IHByZXYgKyBlbW9qaSk7XG4gICAgfSBlbHNlIGlmICh0YXJnZXQgPT09ICdkbScpIHtcbiAgICAgIHNldERtSW5wdXQocHJldiA9PiBwcmV2ICsgZW1vamkpO1xuICAgIH1cbiAgfTtcblxuICAvLyBBdHRlbnRpb24gJiBVbnJlYWQgc3RhdGUgKFBoYXNlIDRGKVxuICBjb25zdCBbdW5yZWFkQ2FtcHVzLCBzZXRVbnJlYWRDYW1wdXNdID0gUmVhY3QudXNlU3RhdGUoMCk7XG4gIGNvbnN0IFt1bnJlYWRDbGFzcywgc2V0VW5yZWFkQ2xhc3NdID0gUmVhY3QudXNlU3RhdGUoMCk7XG4gIGNvbnN0IFt1bnJlYWREbXMsIHNldFVucmVhZERtc10gPSBSZWFjdC51c2VTdGF0ZSh7fSk7XG4gIGNvbnN0IFt0b3RhbERtcywgc2V0VG90YWxEbXNdID0gUmVhY3QudXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtwZW5kaW5nRnJpZW5kUmVxdWVzdHNDb3VudCwgc2V0UGVuZGluZ0ZyaWVuZFJlcXVlc3RzQ291bnRdID0gUmVhY3QudXNlU3RhdGUoMCk7XG5cbiAgY29uc3QgaXNDYW1wdXNDb21wb3NpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBpc0NsYXNzQ29tcG9zaW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgaXNEbUNvbXBvc2luZ1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG5cbiAgY29uc3QgZm9ybWF0QmFkZ2UgPSAobnVtKSA9PiB7XG4gICAgaWYgKCFudW0gfHwgbnVtIDw9IDApIHJldHVybiBudWxsO1xuICAgIHJldHVybiBudW0gPiA5OSA/ICc5OSsnIDogU3RyaW5nKG51bSk7XG4gIH07XG5cbiAgLy8gQ2FtcHVzIENoYXQgc3RhdGVcbiAgY29uc3QgW2NhbXB1c01lc3NhZ2VzLCBzZXRDYW1wdXNNZXNzYWdlc10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFtjYW1wdXNJbnB1dCwgc2V0Q2FtcHVzSW5wdXRdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbY2FtcHVzU2VuZGluZywgc2V0Q2FtcHVzU2VuZGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtjYW1wdXNOb3RpY2UsIHNldENhbXB1c05vdGljZV0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IGxhc3RDYW1wdXNNZXNzYWdlSWRSZWYgPSBSZWFjdC51c2VSZWYoMCk7XG4gIGNvbnN0IGNhbXB1c0VuZFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcblxuICAvLyBDbGFzcyBDaGF0IHN0YXRlXG4gIGNvbnN0IFtjbGFzc01lc3NhZ2VzLCBzZXRDbGFzc01lc3NhZ2VzXSA9IFJlYWN0LnVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW2NsYXNzSW5wdXQsIHNldENsYXNzSW5wdXRdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbY2xhc3NTZW5kaW5nLCBzZXRDbGFzc1NlbmRpbmddID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbY2xhc3NOb3RpY2UsIHNldENsYXNzTm90aWNlXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2NsYXNzTG9wSWQsIHNldENsYXNzTG9wSWRdID0gUmVhY3QudXNlU3RhdGUoYXV0aD8udXNlcj8ubG9wSWQgfHwgMSk7XG4gIGNvbnN0IFt0ZWFjaGVyQ2xhc3Nlcywgc2V0VGVhY2hlckNsYXNzZXNdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbY2xhc3NUZW5Mb3AsIHNldENsYXNzVGVuTG9wXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgbGFzdENsYXNzTWVzc2FnZUlkUmVmID0gUmVhY3QudXNlUmVmKDApO1xuICBjb25zdCBjbGFzc0VuZFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcblxuICAvLyBUXHUwMEY0aSAoRnJpZW5kcyAmIERNKSBzdGF0ZVxuICBjb25zdCBbZnJpZW5kcywgc2V0RnJpZW5kc10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFtwZW5kaW5nSW5jb21pbmcsIHNldFBlbmRpbmdJbmNvbWluZ10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFthY3RpdmVGcmllbmQsIHNldEFjdGl2ZUZyaWVuZF0gPSBSZWFjdC51c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW2RtTWVzc2FnZXMsIHNldERtTWVzc2FnZXNdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbZG1JbnB1dCwgc2V0RG1JbnB1dF0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtkbVNlbmRpbmcsIHNldERtU2VuZGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtkbU5vdGljZSwgc2V0RG1Ob3RpY2VdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBsYXN0RG1NZXNzYWdlSWRSZWYgPSBSZWFjdC51c2VSZWYoMCk7XG4gIGNvbnN0IGRtRW5kUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuXG4gIC8vIEZyaWVuZCBTZWFyY2ggJiBTYWZldHkgTW9kYWwgc3RhdGVcbiAgY29uc3QgW3Nob3dBZGRGcmllbmQsIHNldFNob3dBZGRGcmllbmRdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2VhcmNoUXVlcnksIHNldFNlYXJjaFF1ZXJ5XSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3NlYXJjaFJlc3VsdHMsIHNldFNlYXJjaFJlc3VsdHNdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbc2VhcmNoTG9hZGluZywgc2V0U2VhcmNoTG9hZGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFthY3Rpb25GZWVkYmFjaywgc2V0QWN0aW9uRmVlZGJhY2tdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuXG4gIGNvbnN0IFtyZXBvcnRNb2RhbCwgc2V0UmVwb3J0TW9kYWxdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IFtyZXBvcnRSZWFzb24sIHNldFJlcG9ydFJlYXNvbl0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtyZXBvcnRpbmcsIHNldFJlcG9ydGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG5cbiAgLy8gU3RhYmxlIHJlZnMgZm9yIHNpbmdsZSBib3VuZGVkIHBvbGxpbmcgbG9vcFxuICBjb25zdCB0YWJSZWYgPSBSZWFjdC51c2VSZWYodGFiKTtcbiAgY29uc3QgYWN0aXZlRnJpZW5kUmVmID0gUmVhY3QudXNlUmVmKGFjdGl2ZUZyaWVuZCk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICB0YWJSZWYuY3VycmVudCA9IHRhYjtcbiAgfSwgW3RhYl0pO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYWN0aXZlRnJpZW5kUmVmLmN1cnJlbnQgPSBhY3RpdmVGcmllbmQ7XG4gICAgbGFzdERtTWVzc2FnZUlkUmVmLmN1cnJlbnQgPSAwO1xuICB9LCBbYWN0aXZlRnJpZW5kXSk7XG5cbiAgY29uc3QgaXNBY3RpdmVDYW1wdXNBY2NvdW50ID0gQm9vbGVhbighYXV0aD8uaXNHdWVzdCAmJiBhdXRoPy51c2VyKTtcbiAgY29uc3QgaGFzQ2xhc3NBY2Nlc3MgPSBCb29sZWFuKGF1dGg/LnVzZXI/LmlzVGVhY2hlciB8fCBhdXRoPy51c2VyPy5pc0xpbmtlZFN0dWRlbnQpO1xuXG4gIC8vIEd1YXJkOiBpZiB1c2VyIGxvc2VzIGNsYXNzIGFjY2VzcywgcmV2ZXJ0IHRhYiB0byAnY2FtcHVzJ1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghaGFzQ2xhc3NBY2Nlc3MgJiYgdGFiID09PSAnY2xhc3MnKSB7XG4gICAgICBzZXRUYWIoJ2NhbXB1cycpO1xuICAgIH1cbiAgfSwgW2hhc0NsYXNzQWNjZXNzLCB0YWJdKTtcblxuICAvLyBUXHUxRUEzaSB0clx1MUVBMW5nIHRoXHUwMEUxaSB0aW4gbmhcdTFFQUZuIGNoXHUwMUIwYSBcdTAxMTFcdTFFQ0RjIChQaGFzZSA0RilcbiAgY29uc3QgdGFpVW5yZWFkU3RhdGUgPSBSZWFjdC51c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFpc0FjdGl2ZUNhbXB1c0FjY291bnQpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvY2hhdC1yZWFkLXN0YXRlJyk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSB7XG4gICAgICAgIHNldFVucmVhZENhbXB1cyhkLmNhbXB1cyB8fCAwKTtcbiAgICAgICAgc2V0VW5yZWFkQ2xhc3MoZC5jbGFzcyB8fCAwKTtcbiAgICAgICAgc2V0VW5yZWFkRG1zKGQuZG1zIHx8IHt9KTtcbiAgICAgICAgc2V0VG90YWxEbXMoZC50b3RhbERtcyB8fCAwKTtcbiAgICAgICAgc2V0UGVuZGluZ0ZyaWVuZFJlcXVlc3RzQ291bnQoZC5wZW5kaW5nRnJpZW5kUmVxdWVzdHMgfHwgMCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9LCBbaXNBY3RpdmVDYW1wdXNBY2NvdW50XSk7XG5cbiAgY29uc3QgbWFya0NhbXB1c1JlYWQgPSBSZWFjdC51c2VDYWxsYmFjayhhc3luYyAobWF4SWQgPSAwKSA9PiB7XG4gICAgc2V0VW5yZWFkQ2FtcHVzKDApO1xuICAgIGlmICghaXNBY3RpdmVDYW1wdXNBY2NvdW50KSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZldGNoKCcvYXBpL2NoYXQtcmVhZC1zdGF0ZScsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGNoYW5uZWxUeXBlOiAnY2FtcHVzJywgY2hhbm5lbEtleTogJ2NhbXB1cycsIGxhc3RSZWFkSWQ6IG1heElkIH0pXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIHt9XG4gIH0sIFtpc0FjdGl2ZUNhbXB1c0FjY291bnRdKTtcblxuICBjb25zdCBtYXJrQ2xhc3NSZWFkID0gUmVhY3QudXNlQ2FsbGJhY2soYXN5bmMgKGxvcElkLCBtYXhJZCA9IDApID0+IHtcbiAgICBzZXRVbnJlYWRDbGFzcygwKTtcbiAgICBpZiAoIWlzQWN0aXZlQ2FtcHVzQWNjb3VudCB8fCAhbG9wSWQpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvY2hhdC1yZWFkLXN0YXRlJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgY2hhbm5lbFR5cGU6ICdjbGFzcycsIGNoYW5uZWxLZXk6ICdsb3A6JyArIGxvcElkLCBsYXN0UmVhZElkOiBtYXhJZCB9KVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCB7fVxuICB9LCBbaXNBY3RpdmVDYW1wdXNBY2NvdW50XSk7XG5cbiAgY29uc3QgbWFya0RtUmVhZCA9IFJlYWN0LnVzZUNhbGxiYWNrKGFzeW5jIChmcmllbmRJZCwgbWF4SWQgPSAwKSA9PiB7XG4gICAgc2V0VW5yZWFkRG1zKHByZXYgPT4gKHsgLi4ucHJldiwgW2ZyaWVuZElkXTogMCB9KSk7XG4gICAgaWYgKCFpc0FjdGl2ZUNhbXB1c0FjY291bnQgfHwgIWZyaWVuZElkKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZldGNoKCcvYXBpL2NoYXQtcmVhZC1zdGF0ZScsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGNoYW5uZWxUeXBlOiAnZG0nLCBjaGFubmVsS2V5OiAncGVlcjonICsgZnJpZW5kSWQsIGxhc3RSZWFkSWQ6IG1heElkIH0pXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIHt9XG4gIH0sIFtpc0FjdGl2ZUNhbXB1c0FjY291bnRdKTtcblxuICAvLyAxLiBUXHUxRUEzaSBDYW1wdXMgQ2hhdCBpbmNyZW1lbnRhbFxuICBjb25zdCB0YWlDYW1wdXNDaGF0ID0gUmVhY3QudXNlQ2FsbGJhY2soYXN5bmMgKHNhdUlkID0gMCkgPT4ge1xuICAgIGlmICghaXNBY3RpdmVDYW1wdXNBY2NvdW50KSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVybCA9IHNhdUlkID4gMCA/IGAvYXBpL2NhbXB1cy1jaGF0P3NhdUlkPSR7c2F1SWR9JmxpbWl0PTUwYCA6ICcvYXBpL2NhbXB1cy1jaGF0P2xpbWl0PTUwJztcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwgeyBoZWFkZXJzOiB7ICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicgfSB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2sgJiYgQXJyYXkuaXNBcnJheShkYXRhLm1lc3NhZ2VzKSkge1xuICAgICAgICBpZiAoc2F1SWQgPiAwKSB7XG4gICAgICAgICAgaWYgKGRhdGEubWVzc2FnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc2V0Q2FtcHVzTWVzc2FnZXMocHJldiA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSWRzID0gbmV3IFNldChwcmV2Lm1hcChtID0+IG0uaWQpKTtcbiAgICAgICAgICAgICAgY29uc3QgbmV3T25lcyA9IGRhdGEubWVzc2FnZXMuZmlsdGVyKG0gPT4gIWV4aXN0aW5nSWRzLmhhcyhtLmlkKSk7XG4gICAgICAgICAgICAgIGlmIChuZXdPbmVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHByZXY7XG4gICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBbLi4ucHJldiwgLi4ubmV3T25lc107XG4gICAgICAgICAgICAgIGxhc3RDYW1wdXNNZXNzYWdlSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KC4uLm5leHQubWFwKG0gPT4gbS5pZCB8fCAwKSk7XG4gICAgICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldENhbXB1c01lc3NhZ2VzKGRhdGEubWVzc2FnZXMpO1xuICAgICAgICAgIGlmIChkYXRhLm1lc3NhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGxhc3RDYW1wdXNNZXNzYWdlSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KC4uLmRhdGEubWVzc2FnZXMubWFwKG0gPT4gbS5pZCB8fCAwKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9LCBbaXNBY3RpdmVDYW1wdXNBY2NvdW50XSk7XG5cbiAgLy8gMi4gVFx1MUVBM2kgQ2xhc3MgQ2hhdCBpbmNyZW1lbnRhbFxuICBjb25zdCB0YWlDbGFzc0NoYXQgPSBSZWFjdC51c2VDYWxsYmFjayhhc3luYyAoc2F1SWQgPSAwKSA9PiB7XG4gICAgaWYgKCFoYXNDbGFzc0FjY2VzcykgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBsb3BQYXJhbSA9IGF1dGg/LnVzZXI/LmlzVGVhY2hlciAmJiBjbGFzc0xvcElkID8gYCZsb3BJZD0ke2NsYXNzTG9wSWR9YCA6ICcnO1xuICAgICAgY29uc3QgdXJsID0gc2F1SWQgPiAwID8gYC9hcGkvY2hhdD9zYXVJZD0ke3NhdUlkfSR7bG9wUGFyYW19YCA6IGAvYXBpL2NoYXQke2xvcFBhcmFtID8gJz8nICsgbG9wUGFyYW0uc2xpY2UoMSkgOiAnJ31gO1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2godXJsLCB7IGhlYWRlcnM6IHsgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJyB9IH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZGF0YS5vaykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkYXRhLmNhY0xvcCkgJiYgZGF0YS5jYWNMb3AubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHNldFRlYWNoZXJDbGFzc2VzKGRhdGEuY2FjTG9wKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF0YS50ZW5Mb3ApIHNldENsYXNzVGVuTG9wKGRhdGEudGVuTG9wKTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YS50aW5OaGFuKSkge1xuICAgICAgICAgIGlmIChzYXVJZCA+IDApIHtcbiAgICAgICAgICAgIGlmIChkYXRhLnRpbk5oYW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBzZXRDbGFzc01lc3NhZ2VzKHByZXYgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSWRzID0gbmV3IFNldChwcmV2Lm1hcChtID0+IG0uaWQpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdPbmVzID0gZGF0YS50aW5OaGFuLmZpbHRlcihtID0+ICFleGlzdGluZ0lkcy5oYXMobS5pZCkpO1xuICAgICAgICAgICAgICAgIGlmIChuZXdPbmVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHByZXY7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dCA9IFsuLi5wcmV2LCAuLi5uZXdPbmVzXTtcbiAgICAgICAgICAgICAgICBsYXN0Q2xhc3NNZXNzYWdlSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KC4uLm5leHQubWFwKG0gPT4gbS5pZCB8fCAwKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXRDbGFzc01lc3NhZ2VzKGRhdGEudGluTmhhbik7XG4gICAgICAgICAgICBpZiAoZGF0YS50aW5OaGFuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgbGFzdENsYXNzTWVzc2FnZUlkUmVmLmN1cnJlbnQgPSBNYXRoLm1heCguLi5kYXRhLnRpbk5oYW4ubWFwKG0gPT4gbS5pZCB8fCAwKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9LCBbaGFzQ2xhc3NBY2Nlc3MsIGF1dGg/LnVzZXI/LmlzVGVhY2hlciwgY2xhc3NMb3BJZF0pO1xuXG4gIC8vIDMuIFRcdTFFQTNpIEJcdTFFQTFuIGJcdTAwRTggJiBMXHUxRUREaSBtXHUxRUREaVxuICBjb25zdCB0YWlGcmllbmRzID0gUmVhY3QudXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xuICAgIGlmICghaXNBY3RpdmVDYW1wdXNBY2NvdW50KSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL2NhbXB1cy1mcmllbmRzJywgeyBoZWFkZXJzOiB7ICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicgfSB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2spIHtcbiAgICAgICAgc2V0RnJpZW5kcyhkYXRhLmZyaWVuZHMgfHwgW10pO1xuICAgICAgICBzZXRQZW5kaW5nSW5jb21pbmcoZGF0YS5wZW5kaW5nSW5jb21pbmcgfHwgW10pO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgfSwgW2lzQWN0aXZlQ2FtcHVzQWNjb3VudF0pO1xuXG4gIC8vIDQuIFRcdTFFQTNpIHRpbiBuaFx1MUVBRm4gRE0gaW5jcmVtZW50YWxcbiAgY29uc3QgdGFpRG1NZXNzYWdlcyA9IFJlYWN0LnVzZUNhbGxiYWNrKGFzeW5jIChmcmllbmRJZCwgc2F1SWQgPSAwKSA9PiB7XG4gICAgaWYgKCFmcmllbmRJZCB8fCAhaXNBY3RpdmVDYW1wdXNBY2NvdW50KSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVybCA9IHNhdUlkID4gMFxuICAgICAgICA/IGAvYXBpL2NhbXB1cy1kbT9mcmllbmRBY2NvdW50SWQ9JHtmcmllbmRJZH0mc2F1SWQ9JHtzYXVJZH0mbGltaXQ9NTBgXG4gICAgICAgIDogYC9hcGkvY2FtcHVzLWRtP2ZyaWVuZEFjY291bnRJZD0ke2ZyaWVuZElkfSZsaW1pdD01MGA7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwsIHsgaGVhZGVyczogeyAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nIH0gfSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkYXRhLm9rICYmIEFycmF5LmlzQXJyYXkoZGF0YS5tZXNzYWdlcykpIHtcbiAgICAgICAgaWYgKHNhdUlkID4gMCkge1xuICAgICAgICAgIGlmIChkYXRhLm1lc3NhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNldERtTWVzc2FnZXMocHJldiA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSWRzID0gbmV3IFNldChwcmV2Lm1hcChtID0+IG0uaWQpKTtcbiAgICAgICAgICAgICAgY29uc3QgbmV3T25lcyA9IGRhdGEubWVzc2FnZXMuZmlsdGVyKG0gPT4gIWV4aXN0aW5nSWRzLmhhcyhtLmlkKSk7XG4gICAgICAgICAgICAgIGlmIChuZXdPbmVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHByZXY7XG4gICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBbLi4ucHJldiwgLi4ubmV3T25lc107XG4gICAgICAgICAgICAgIGxhc3REbU1lc3NhZ2VJZFJlZi5jdXJyZW50ID0gTWF0aC5tYXgoLi4ubmV4dC5tYXAobSA9PiBtLmlkIHx8IDApKTtcbiAgICAgICAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0RG1NZXNzYWdlcyhkYXRhLm1lc3NhZ2VzKTtcbiAgICAgICAgICBpZiAoZGF0YS5tZXNzYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBsYXN0RG1NZXNzYWdlSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KC4uLmRhdGEubWVzc2FnZXMubWFwKG0gPT4gbS5pZCB8fCAwKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9LCBbaXNBY3RpdmVDYW1wdXNBY2NvdW50XSk7XG5cbiAgLy8gU0lOR0xFIEJPVU5ERUQgUE9MTElORyBMT09QICg0cyk6IGV4YWN0bHkgb25lIGxvb3AsIHBvbGxzIE9OTFkgYWN0aXZlIHRhYiwgcGF1c2VzIHdoZW4gZHJhd2VyIGNsb3NlZFxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghaXNBY3RpdmVDYW1wdXNBY2NvdW50IHx8ICFpc0FjdGl2ZSkgcmV0dXJuO1xuXG4gICAgaWYgKHRhYiA9PT0gJ2NhbXB1cycpIHtcbiAgICAgIHRhaUNhbXB1c0NoYXQoMCk7XG4gICAgfSBlbHNlIGlmICh0YWIgPT09ICdjbGFzcycpIHtcbiAgICAgIGlmIChoYXNDbGFzc0FjY2VzcykgdGFpQ2xhc3NDaGF0KDApO1xuICAgIH0gZWxzZSBpZiAodGFiID09PSAnbWUnKSB7XG4gICAgICBpZiAoYWN0aXZlRnJpZW5kKSB7XG4gICAgICAgIHRhaURtTWVzc2FnZXMoYWN0aXZlRnJpZW5kLmFjY291bnRJZCwgMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YWlGcmllbmRzKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGFpVW5yZWFkU3RhdGUoKTtcblxuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSAhPT0gJ3Zpc2libGUnKSByZXR1cm47XG4gICAgICBjb25zdCBjdXJyZW50VGFiID0gdGFiUmVmLmN1cnJlbnQ7XG4gICAgICBjb25zdCBjdXJyZW50RnJpZW5kID0gYWN0aXZlRnJpZW5kUmVmLmN1cnJlbnQ7XG5cbiAgICAgIHRhaVVucmVhZFN0YXRlKCk7XG5cbiAgICAgIGlmIChjdXJyZW50VGFiID09PSAnY2FtcHVzJykge1xuICAgICAgICB0YWlDYW1wdXNDaGF0KGxhc3RDYW1wdXNNZXNzYWdlSWRSZWYuY3VycmVudCk7XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnRUYWIgPT09ICdjbGFzcycpIHtcbiAgICAgICAgdGFpQ2xhc3NDaGF0KGxhc3RDbGFzc01lc3NhZ2VJZFJlZi5jdXJyZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudFRhYiA9PT0gJ21lJykge1xuICAgICAgICBpZiAoY3VycmVudEZyaWVuZCkge1xuICAgICAgICAgIHRhaURtTWVzc2FnZXMoY3VycmVudEZyaWVuZC5hY2NvdW50SWQsIGxhc3REbU1lc3NhZ2VJZFJlZi5jdXJyZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0YWlGcmllbmRzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCAzNTAwKTtcblxuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgfSwgW2lzQWN0aXZlQ2FtcHVzQWNjb3VudCwgaGFzQ2xhc3NBY2Nlc3MsIGlzQWN0aXZlLCB0YWIsIGFjdGl2ZUZyaWVuZD8uYWNjb3VudElkLCBjbGFzc0xvcElkLCB0YWlDYW1wdXNDaGF0LCB0YWlDbGFzc0NoYXQsIHRhaUZyaWVuZHMsIHRhaURtTWVzc2FnZXNdKTtcblxuICAvLyBBdXRvIHNjcm9sbFxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh0YWIgPT09ICdjYW1wdXMnICYmIGNhbXB1c0VuZFJlZi5jdXJyZW50KSB7XG4gICAgICBjYW1wdXNFbmRSZWYuY3VycmVudC5zY3JvbGxJbnRvVmlldyh7IGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgICB9XG4gIH0sIFtjYW1wdXNNZXNzYWdlcy5sZW5ndGgsIHRhYl0pO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHRhYiA9PT0gJ2NsYXNzJyAmJiBjbGFzc0VuZFJlZi5jdXJyZW50KSB7XG4gICAgICBjbGFzc0VuZFJlZi5jdXJyZW50LnNjcm9sbEludG9WaWV3KHsgYmVoYXZpb3I6ICdzbW9vdGgnIH0pO1xuICAgIH1cbiAgfSwgW2NsYXNzTWVzc2FnZXMubGVuZ3RoLCB0YWJdKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh0YWIgPT09ICdtZScgJiYgYWN0aXZlRnJpZW5kICYmIGRtRW5kUmVmLmN1cnJlbnQpIHtcbiAgICAgIGRtRW5kUmVmLmN1cnJlbnQuc2Nyb2xsSW50b1ZpZXcoeyBiZWhhdmlvcjogJ3Ntb290aCcgfSk7XG4gICAgfVxuICB9LCBbZG1NZXNzYWdlcy5sZW5ndGgsIHRhYiwgYWN0aXZlRnJpZW5kXSk7XG5cbiAgLy8gR1x1MUVFRGkgQ2FtcHVzIENoYXQgKFBoYXNlIDRGOiBTYWZlIENsZWFyICsgSU1FIEd1YXJkKVxuICBjb25zdCBoYW5kbGVTZW5kQ2FtcHVzID0gYXN5bmMgKGUpID0+IHtcbiAgICBlPy5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IHRleHQgPSBjYW1wdXNJbnB1dC50cmltKCk7XG4gICAgaWYgKCF0ZXh0IHx8IGNhbXB1c1NlbmRpbmcpIHJldHVybjtcbiAgICAvLyBPcHRpbWlzdGljYWxseSBjbGVhciBpbnB1dCBpbW1lZGlhdGVseSBzbyB1c2VyIGNhbiB0eXBlIG5leHQgbWVzc2FnZVxuICAgIHNldENhbXB1c0lucHV0KCcnKTtcbiAgICBzZXRDYW1wdXNTZW5kaW5nKHRydWUpO1xuICAgIHNldENhbXB1c05vdGljZSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL2NhbXB1cy1jaGF0Jywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbm9pRHVuZzogdGV4dCB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkYXRhLm9rICYmIGRhdGEubWVzc2FnZSkge1xuICAgICAgICBzZXRDYW1wdXNNZXNzYWdlcyhwcmV2ID0+IHtcbiAgICAgICAgICBjb25zdCBuZXh0ID0gWy4uLnByZXYsIGRhdGEubWVzc2FnZV07XG4gICAgICAgICAgbGFzdENhbXB1c01lc3NhZ2VJZFJlZi5jdXJyZW50ID0gTWF0aC5tYXgobGFzdENhbXB1c01lc3NhZ2VJZFJlZi5jdXJyZW50LCBkYXRhLm1lc3NhZ2UuaWQgfHwgMCk7XG4gICAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICAgIH0pO1xuICAgICAgICBtYXJrQ2FtcHVzUmVhZChkYXRhLm1lc3NhZ2UuaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Q2FtcHVzTm90aWNlKGRhdGEubG9pIHx8ICdLaFx1MDBGNG5nIGdcdTFFRURpIFx1MDExMVx1MDFCMFx1MUVFM2MgdGluIG5oXHUxRUFGbi4nKTtcbiAgICAgICAgLy8gUmVzdG9yZSBPTkxZIGlmIHVzZXIgaGFzbid0IHN0YXJ0ZWQgdHlwaW5nIGEgbmV3IG1lc3NhZ2VcbiAgICAgICAgc2V0Q2FtcHVzSW5wdXQoY3VyID0+IGN1ciA/IGN1ciA6IHRleHQpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0Q2FtcHVzTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBraGkgZ1x1MUVFRGkgdGluIG5oXHUxRUFGbi4nKTtcbiAgICAgIHNldENhbXB1c0lucHV0KGN1ciA9PiBjdXIgPyBjdXIgOiB0ZXh0KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0Q2FtcHVzU2VuZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIFRodSBoXHUxRUQzaSB0aW4gbmhcdTFFQUZuIENhbXB1c1xuICBjb25zdCBoYW5kbGVEZWxldGVDYW1wdXMgPSBhc3luYyAoaWQpID0+IHtcbiAgICBpZiAoIWNvbmZpcm0oJ0JcdTFFQTFuIGNcdTAwRjMgY2hcdTFFQUZjIG11XHUxRUQxbiB0aHUgaFx1MUVEM2kgdGluIG5oXHUxRUFGbiBuXHUwMEUweT8nKSkgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9jYW1wdXMtY2hhdD9pZD0ke2lkfWAsIHsgbWV0aG9kOiAnREVMRVRFJyB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2spIHtcbiAgICAgICAgc2V0Q2FtcHVzTWVzc2FnZXMocHJldiA9PiBwcmV2LmZpbHRlcihtID0+IG0uaWQgIT09IGlkKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbGVydChkYXRhLmxvaSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyB4XHUwMEYzYSB0aW4gbmhcdTFFQUZuLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgYWxlcnQoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIGtoaSB4XHUwMEYzYSB0aW4gbmhcdTFFQUZuLicpO1xuICAgIH1cbiAgfTtcblxuICAvLyBHXHUxRUVEaSBDbGFzcyBDaGF0IChQaGFzZSA0RjogU2FmZSBDbGVhciArIElNRSBHdWFyZClcbiAgY29uc3QgaGFuZGxlU2VuZENsYXNzID0gYXN5bmMgKGUpID0+IHtcbiAgICBlPy5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IHRleHQgPSBjbGFzc0lucHV0LnRyaW0oKTtcbiAgICBpZiAoIXRleHQgfHwgY2xhc3NTZW5kaW5nKSByZXR1cm47XG4gICAgc2V0Q2xhc3NJbnB1dCgnJyk7XG4gICAgc2V0Q2xhc3NTZW5kaW5nKHRydWUpO1xuICAgIHNldENsYXNzTm90aWNlKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcGF5bG9hZCA9IHsgbm9pRHVuZzogdGV4dCB9O1xuICAgICAgaWYgKGF1dGg/LnVzZXI/LmlzVGVhY2hlciAmJiBjbGFzc0xvcElkKSBwYXlsb2FkLmxvcElkID0gY2xhc3NMb3BJZDtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL2NoYXQnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZGF0YS5vayAmJiBkYXRhLnRpbk5oYW4pIHtcbiAgICAgICAgc2V0Q2xhc3NNZXNzYWdlcyhwcmV2ID0+IHtcbiAgICAgICAgICBjb25zdCBuZXh0ID0gWy4uLnByZXYsIGRhdGEudGluTmhhbl07XG4gICAgICAgICAgbGFzdENsYXNzTWVzc2FnZUlkUmVmLmN1cnJlbnQgPSBNYXRoLm1heChsYXN0Q2xhc3NNZXNzYWdlSWRSZWYuY3VycmVudCwgZGF0YS50aW5OaGFuLmlkIHx8IDApO1xuICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICB9KTtcbiAgICAgICAgbWFya0NsYXNzUmVhZChjbGFzc0xvcElkLCBkYXRhLnRpbk5oYW4uaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Q2xhc3NOb3RpY2UoZGF0YS5sb2kgfHwgJ0toXHUwMEY0bmcgZ1x1MUVFRGkgXHUwMTExXHUwMUIwXHUxRUUzYyB0aW4gbmhcdTFFQUZuLicpO1xuICAgICAgICBzZXRDbGFzc0lucHV0KGN1ciA9PiBjdXIgPyBjdXIgOiB0ZXh0KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldENsYXNzTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBraGkgZ1x1MUVFRGkgdGluIG5oXHUxRUFGbi4nKTtcbiAgICAgIHNldENsYXNzSW5wdXQoY3VyID0+IGN1ciA/IGN1ciA6IHRleHQpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRDbGFzc1NlbmRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyBHXHUxRUVEaSB0aW4gbmhcdTFFQUZuIHJpXHUwMEVBbmcgKERNIC0gUGhhc2UgNEY6IFNhZmUgQ2xlYXIgKyBJTUUgR3VhcmQpXG4gIGNvbnN0IGhhbmRsZVNlbmREbSA9IGFzeW5jIChlKSA9PiB7XG4gICAgZT8ucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCB0ZXh0ID0gZG1JbnB1dC50cmltKCk7XG4gICAgaWYgKCF0ZXh0IHx8ICFhY3RpdmVGcmllbmQgfHwgZG1TZW5kaW5nKSByZXR1cm47XG4gICAgc2V0RG1JbnB1dCgnJyk7XG4gICAgc2V0RG1TZW5kaW5nKHRydWUpO1xuICAgIHNldERtTm90aWNlKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvY2FtcHVzLWRtJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcmVjZWl2ZXJBY2NvdW50SWQ6IGFjdGl2ZUZyaWVuZC5hY2NvdW50SWQsIG5vaUR1bmc6IHRleHQgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZGF0YS5vayAmJiBkYXRhLm1lc3NhZ2UpIHtcbiAgICAgICAgc2V0RG1NZXNzYWdlcyhwcmV2ID0+IHtcbiAgICAgICAgICBjb25zdCBuZXh0ID0gWy4uLnByZXYsIGRhdGEubWVzc2FnZV07XG4gICAgICAgICAgbGFzdERtTWVzc2FnZUlkUmVmLmN1cnJlbnQgPSBNYXRoLm1heChsYXN0RG1NZXNzYWdlSWRSZWYuY3VycmVudCwgZGF0YS5tZXNzYWdlLmlkIHx8IDApO1xuICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICB9KTtcbiAgICAgICAgbWFya0RtUmVhZChhY3RpdmVGcmllbmQuYWNjb3VudElkLCBkYXRhLm1lc3NhZ2UuaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0RG1Ob3RpY2UoZGF0YS5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgZ1x1MUVFRGkgdGluIG5oXHUxRUFGbi4nKTtcbiAgICAgICAgc2V0RG1JbnB1dChjdXIgPT4gY3VyID8gY3VyIDogdGV4dCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXREbU5vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkga2hpIGdcdTFFRURpIHRpbiBuaFx1MUVBRm4gcmlcdTAwRUFuZy4nKTtcbiAgICAgIHNldERtSW5wdXQoY3VyID0+IGN1ciA/IGN1ciA6IHRleHQpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXREbVNlbmRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyBUXHUwMEVDbSBiXHUxRUExbiBiXHUwMEU4IChUXHUxRUQxaSB0aGlcdTFFQzN1IDQga1x1MDBGRCB0XHUxRUYxIHRcdTAwRUFuIFx1MDExMVx1MDEwM25nIG5oXHUxRUFEcCBcdTAxMTFcdTFFQzMgYlx1MUVBM28gbVx1MUVBRHQgZGFuaCBiXHUxRUExKVxuICBjb25zdCBoYW5kbGVTZWFyY2hGcmllbmRzID0gYXN5bmMgKHZhbCkgPT4ge1xuICAgIHNldFNlYXJjaFF1ZXJ5KHZhbCk7XG4gICAgY29uc3QgdHJpbW1lZCA9IHZhbC50cmltKCk7XG4gICAgaWYgKHRyaW1tZWQubGVuZ3RoIDwgNCkge1xuICAgICAgc2V0U2VhcmNoUmVzdWx0cyhbXSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNldFNlYXJjaExvYWRpbmcodHJ1ZSk7XG4gICAgc2V0QWN0aW9uRmVlZGJhY2soJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9jYW1wdXMtZnJpZW5kcycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGFjdGlvbjogJ3NlYXJjaCcsIHF1ZXJ5OiB0cmltbWVkIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2spIHtcbiAgICAgICAgc2V0U2VhcmNoUmVzdWx0cyhkYXRhLmxpc3QgfHwgW10pO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge30gZmluYWxseSB7XG4gICAgICBzZXRTZWFyY2hMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gR1x1MUVFRGkgbFx1MUVERGkgbVx1MUVERGkga1x1MUVCRnQgYlx1MUVBMW5cbiAgY29uc3QgaGFuZGxlUmVxdWVzdEZyaWVuZCA9IGFzeW5jICh0YXJnZXRJZCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9jYW1wdXMtZnJpZW5kcycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGFjdGlvbjogJ3JlcXVlc3QnLCB0YXJnZXRBY2NvdW50SWQ6IHRhcmdldElkIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2spIHtcbiAgICAgICAgc2V0QWN0aW9uRmVlZGJhY2soJ1x1MDExMFx1MDBFMyBnXHUxRUVEaSBsXHUxRUREaSBtXHUxRUREaSBrXHUxRUJGdCBiXHUxRUExbi4nKTtcbiAgICAgICAgc2V0U2VhcmNoUmVzdWx0cyhwcmV2ID0+IHByZXYubWFwKHUgPT4gdS5pZCA9PT0gdGFyZ2V0SWQgPyB7IC4uLnUsIGZyaWVuZHNoaXBTdGF0dXM6ICdzZW50X3BlbmRpbmcnIH0gOiB1KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbGVydChkYXRhLmxvaSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyBnXHUxRUVEaSBsXHUxRUREaSBtXHUxRUREaS4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIGFsZXJ0KCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBraGkgZ1x1MUVFRGkgbFx1MUVERGkgbVx1MUVERGkga1x1MUVCRnQgYlx1MUVBMW4uJyk7XG4gICAgfVxuICB9O1xuXG4gIC8vIENoXHUxRUE1cCBuaFx1MUVBRG4ga1x1MUVCRnQgYlx1MUVBMW5cbiAgY29uc3QgaGFuZGxlQWNjZXB0RnJpZW5kID0gYXN5bmMgKHJlcUlkLCBmcm9tQWNjSWQpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvY2FtcHVzLWZyaWVuZHMnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhY3Rpb246ICdhY2NlcHQnLCByZXF1ZXN0SWQ6IHJlcUlkLCByZXF1ZXN0ZXJBY2NvdW50SWQ6IGZyb21BY2NJZCB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkYXRhLm9rKSB7XG4gICAgICAgIHRhaUZyaWVuZHMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFsZXJ0KGRhdGEubG9pIHx8ICdMXHUxRUQ3aSBraGkgY2hcdTFFQTVwIG5oXHUxRUFEbi4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gVFx1MUVFQiBjaFx1MUVEMWkga1x1MUVCRnQgYlx1MUVBMW5cbiAgY29uc3QgaGFuZGxlRGVjbGluZUZyaWVuZCA9IGFzeW5jIChyZXFJZCwgZnJvbUFjY0lkKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL2NhbXB1cy1mcmllbmRzJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYWN0aW9uOiAnZGVjbGluZScsIHJlcXVlc3RJZDogcmVxSWQsIHJlcXVlc3RlckFjY291bnRJZDogZnJvbUFjY0lkIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2spIHtcbiAgICAgICAgdGFpRnJpZW5kcygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWxlcnQoZGF0YS5sb2kgfHwgJ0xcdTFFRDdpIGtoaSB0XHUxRUVCIGNoXHUxRUQxaS4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gSFx1MUVFN3kga1x1MUVCRnQgYlx1MUVBMW5cbiAgY29uc3QgaGFuZGxlVW5mcmllbmQgPSBhc3luYyAoZnJpZW5kSWQpID0+IHtcbiAgICBpZiAoIWNvbmZpcm0oJ0JcdTFFQTFuIGNcdTAwRjMgbXVcdTFFRDFuIGhcdTFFRTd5IGtcdTFFQkZ0IGJcdTFFQTFuIHZcdTFFREJpIG5nXHUwMUIwXHUxRUREaSBuXHUwMEUweT8nKSkgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9jYW1wdXMtZnJpZW5kcycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGFjdGlvbjogJ3VuZnJpZW5kJywgZnJpZW5kQWNjb3VudElkOiBmcmllbmRJZCB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkYXRhLm9rKSB7XG4gICAgICAgIHNldEFjdGl2ZUZyaWVuZChudWxsKTtcbiAgICAgICAgdGFpRnJpZW5kcygpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICAvLyBDaFx1MUVCN24gbmdcdTAxQjBcdTFFRERpIGRcdTAwRjluZ1xuICBjb25zdCBoYW5kbGVCbG9jayA9IGFzeW5jICh0YXJnZXRJZCkgPT4ge1xuICAgIGlmICghY29uZmlybSgnQlx1MUVBMW4gY1x1MDBGMyBjaFx1MUVBRmMgbXVcdTFFRDFuIGNoXHUxRUI3biBuZ1x1MDFCMFx1MUVERGkgblx1MDBFMHk/IENcdTFFQTMgaGFpIGJcdTAwRUFuIHNcdTFFQkQga2hcdTAwRjRuZyB0aFx1MUVDMyBuaFx1MUVBRm4gdGluIGhvXHUxRUI3YyBnXHUxRUVEaSBsXHUxRUREaSBtXHUxRUREaSBrXHUxRUJGdCBiXHUxRUExbi4nKSkgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9jYW1wdXMtZnJpZW5kcycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGFjdGlvbjogJ2Jsb2NrJywgdGFyZ2V0QWNjb3VudElkOiB0YXJnZXRJZCB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkYXRhLm9rKSB7XG4gICAgICAgIHNldEFjdGl2ZUZyaWVuZChudWxsKTtcbiAgICAgICAgdGFpRnJpZW5kcygpO1xuICAgICAgICBhbGVydCgnXHUwMTEwXHUwMEUzIGNoXHUxRUI3biBuZ1x1MDFCMFx1MUVERGkgZFx1MDBGOW5nLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICAvLyBHXHUxRUVEaSBiXHUwMEUxbyBjXHUwMEUxbyB2aSBwaFx1MUVBMW1cbiAgY29uc3QgaGFuZGxlU3VibWl0UmVwb3J0ID0gYXN5bmMgKGUpID0+IHtcbiAgICBlPy5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmICghcmVwb3J0UmVhc29uLnRyaW0oKSB8fCAhcmVwb3J0TW9kYWw/LnRhcmdldElkIHx8IHJlcG9ydGluZykgcmV0dXJuO1xuICAgIHNldFJlcG9ydGluZyh0cnVlKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcGF5bG9hZCA9IHtcbiAgICAgICAgYWN0aW9uOiAncmVwb3J0JyxcbiAgICAgICAgdGFyZ2V0QWNjb3VudElkOiByZXBvcnRNb2RhbC50YXJnZXRJZCxcbiAgICAgICAgcmVhc29uOiByZXBvcnRSZWFzb24udHJpbSgpXG4gICAgICB9O1xuICAgICAgaWYgKHJlcG9ydE1vZGFsLm1lc3NhZ2VJZCkge1xuICAgICAgICBwYXlsb2FkLm1lc3NhZ2VJZCA9IHJlcG9ydE1vZGFsLm1lc3NhZ2VJZDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL2NhbXB1cy1kbScsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkYXRhLm9rKSB7XG4gICAgICAgIGFsZXJ0KCdcdTAxMTBcdTAwRTMgZ1x1MUVFRGkgYlx1MDBFMW8gY1x1MDBFMW8gY2hvIGdpXHUwMEUxbyB2aVx1MDBFQW4geGVtIHhcdTAwRTl0LicpO1xuICAgICAgICBzZXRSZXBvcnRNb2RhbChudWxsKTtcbiAgICAgICAgc2V0UmVwb3J0UmVhc29uKCcnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFsZXJ0KGRhdGEubG9pIHx8ICdMXHUxRUQ3aSBraGkgZ1x1MUVFRGkgYlx1MDBFMW8gY1x1MDBFMW8uJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBhbGVydCgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkga2hpIGdcdTFFRURpIGJcdTAwRTFvIGNcdTAwRTFvLicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRSZXBvcnRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgaWQ9XCJjYW1wdXMtY2hhdC1yYWlsXCIgY2xhc3NOYW1lPXtgYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgc2hhZG93LXhsIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIGgtWzU2MHB4XSAke2NsYXNzTmFtZX1gfT5cbiAgICAgIHsvKiBSYWlsIEhlYWRlciBcdTIwMTQgRVhBQ1RMWSAzIFRBQlM6IENhbXB1cyB8IExcdTFFREJwIHwgVFx1MDBGNGkgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMiBib3JkZXItYiBib3JkZXItd2hpdGUvMTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGJnLVsjMTExNjIwXS82MCBzaHJpbmstMFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgYmctWyMwQjBFMTRdIHAtMSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdy1mdWxsXCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBpZD1cImNoYXQtdGFiLWNhbXB1c1wiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgIHNldFRhYignY2FtcHVzJyk7XG4gICAgICAgICAgICAgIHNldEFjdGl2ZUZyaWVuZChudWxsKTtcbiAgICAgICAgICAgICAgbWFya0NhbXB1c1JlYWQobGFzdENhbXB1c01lc3NhZ2VJZFJlZi5jdXJyZW50KTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4LTEgcHktMS41IHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgdGV4dC1jZW50ZXIgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEgJHt0YWIgPT09ICdjYW1wdXMnID8gJ2JnLVsjMDBGMkZFXSB0ZXh0LWJsYWNrIHNoYWRvdy1zbScgOiAndGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSd9YH0+XG4gICAgICAgICAgICA8c3Bhbj5DYW1wdXM8L3NwYW4+XG4gICAgICAgICAgICB7dW5yZWFkQ2FtcHVzID4gMCAmJiAoXG4gICAgICAgICAgICAgIDxzcGFuIGlkPVwiYmFkZ2UtdW5yZWFkLWNhbXB1c1wiIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZC1mdWxsIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy1yb3NlLTUwMCB0ZXh0LXdoaXRlIGFuaW1hdGUtcHVsc2VcIj5cbiAgICAgICAgICAgICAgICB7Zm9ybWF0QmFkZ2UodW5yZWFkQ2FtcHVzKX1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIHtoYXNDbGFzc0FjY2VzcyAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBpZD1cImNoYXQtdGFiLWNsYXNzXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRhYignY2xhc3MnKTtcbiAgICAgICAgICAgICAgICBzZXRBY3RpdmVGcmllbmQobnVsbCk7XG4gICAgICAgICAgICAgICAgbWFya0NsYXNzUmVhZChjbGFzc0xvcElkLCBsYXN0Q2xhc3NNZXNzYWdlSWRSZWYuY3VycmVudCk7XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXgtMSBweS0xLjUgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCB0ZXh0LWNlbnRlciBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMSAke3RhYiA9PT0gJ2NsYXNzJyA/ICdiZy1bIzAwRjJGRV0gdGV4dC1ibGFjayBzaGFkb3ctc20nIDogJ3RleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICA8c3Bhbj5MXHUxRURCcDwvc3Bhbj5cbiAgICAgICAgICAgICAge3VucmVhZENsYXNzID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJiYWRnZS11bnJlYWQtY2xhc3NcIiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQtZnVsbCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctY3lhbi00MDAgdGV4dC1ibGFja1wiPlxuICAgICAgICAgICAgICAgICAge2Zvcm1hdEJhZGdlKHVucmVhZENsYXNzKX1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuXG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBpZD1cImNoYXQtdGFiLW1lXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0VGFiKCdtZScpOyB0YWlGcmllbmRzKCk7IH19XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4LTEgcHktMS41IHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgdGV4dC1jZW50ZXIgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEgcmVsYXRpdmUgJHt0YWIgPT09ICdtZScgPyAnYmctWyMwMEYyRkVdIHRleHQtYmxhY2sgc2hhZG93LXNtJyA6ICd0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgIDxzcGFuPlRcdTAwRjRpPC9zcGFuPlxuICAgICAgICAgICAgeyh0b3RhbERtcyArIHBlbmRpbmdJbmNvbWluZy5sZW5ndGggKyBwZW5kaW5nRnJpZW5kUmVxdWVzdHNDb3VudCkgPiAwICYmIChcbiAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJiYWRnZS11bnJlYWQtbWVcIiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQtZnVsbCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctYW1iZXItNDAwIHRleHQtYmxhY2tcIj5cbiAgICAgICAgICAgICAgICB7Zm9ybWF0QmFkZ2UodG90YWxEbXMgKyBNYXRoLm1heChwZW5kaW5nSW5jb21pbmcubGVuZ3RoLCBwZW5kaW5nRnJpZW5kUmVxdWVzdHNDb3VudCkpfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogR3Vlc3QgU3RhdGUgKi99XG4gICAgICB7YXV0aD8uaXNHdWVzdCA/IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgcC01IGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtY2VudGVyIGdhcC0zIGJnLXdoaXRlL1swLjAxXVwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtM3hsXCI+XHVEODNEXHVERDEwPC9zcGFuPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwXCI+XHUwMTEwXHUwMTAzbmcgbmhcdTFFQURwIFx1MDExMVx1MUVDMyB0aGFtIGdpYSBDaGF0PC9wPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+VHJcdTAwRjIgY2h1eVx1MUVDN24gY1x1MDBGOW5nIGJcdTFFQTFuIGJcdTAwRTggdlx1MDBFMCBnaVx1MDBFMW8gdmlcdTAwRUFuIHRvXHUwMEUwbiB0clx1MDFCMFx1MUVERG5nLjwvcD5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXtvblJlcXVpcmVBdXRofVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwibXQtMSBweC00IHB5LTIgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjOEI1Q0Y2XSB0ZXh0LWJsYWNrIHRleHQteHMgZm9udC1leHRyYWJvbGQgc2hhZG93LW1kIGhvdmVyOm9wYWNpdHktOTUgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICBcdTAxMTBcdTAxMDNuZyBuaFx1MUVBRHAgbmdheVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICkgOiB0YWIgPT09ICdjYW1wdXMnID8gKFxuICAgICAgICAvKiBcdTI1MDBcdTI1MDBcdTI1MDAgVEFCOiBDQU1QVVMgQ0hBVCAoVE9cdTAwQzBOIFRSXHUwMUFGXHUxRURDTkcgXHUyMDE0IE1cdTFFQ0NJIFRcdTAwQzBJIEtIT1x1MUVBMk4gQ0FNUFVTIEhPXHUxRUEwVCBcdTAxMTBcdTFFRDhORykgXHUyNTAwXHUyNTAwXHUyNTAwICovXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgbWluLWgtMFwiPlxuICAgICAgICAgIHsvKiBNZXNzYWdlIExpc3QgKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHAtMyBzcGFjZS15LTIuNSB0ZXh0LXhzXCI+XG4gICAgICAgICAgICB7Y2FtcHVzTWVzc2FnZXMubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LWNlbnRlciBwLTRcIj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMFwiPkNoXHUwMUIwYSBjXHUwMEYzIHRpbiBuaFx1MUVBRm4gblx1MDBFMG8uIEhcdTAwRTN5IGdcdTFFRURpIGxcdTFFRERpIGNoXHUwMEUwbyBcdTAxMTFcdTFFQTd1IHRpXHUwMEVBbiE8L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgY2FtcHVzTWVzc2FnZXMubWFwKG1zZyA9PiAoXG4gICAgICAgICAgICAgICAgPGRpdiBrZXk9e21zZy5pZH0gY2xhc3NOYW1lPXtgZ3JvdXAgZmxleCBmbGV4LWNvbCAke21zZy5pc01lID8gJ2l0ZW1zLWVuZCcgOiAnaXRlbXMtc3RhcnQnfWB9PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IG1iLTAuNSBweC0xXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMFwiPnttc2cuc2VuZGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIHttc2cucm9sZSA9PT0gJ3RlYWNoZXInID8gKFxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEgcHktMC4yIHJvdW5kZWQgdGV4dC1bOHB4XSBmb250LWJsYWNrIGJnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMFwiPkdWQ048L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICkgOiBtc2cuY2xhc3NCYWRnZSA/IChcbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xIHB5LTAuMiByb3VuZGVkIHRleHQtWzhweF0gZm9udC1ib2xkIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8yMFwiPlx1MjcxMyB7bXNnLmNsYXNzQmFkZ2V9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHtuZXcgRGF0ZShtc2cuY3JlYXRlZEF0KS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JyB9KX1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICB7KG1zZy5pc01lIHx8IGF1dGg/LnVzZXI/LmlzVmVyaWZpZWRUZWFjaGVyKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gaGFuZGxlRGVsZXRlQ2FtcHVzKG1zZy5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcGFjaXR5LTAgZ3JvdXAtaG92ZXI6b3BhY2l0eS0xMDAgdGV4dC1bMTBweF0gdGV4dC1yb3NlLTQwMCBob3Zlcjp0ZXh0LXJvc2UtMzAwIHRyYW5zaXRpb24tb3BhY2l0eSBtbC0xXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiVGh1IGhcdTFFRDNpIHRpbiBuaFx1MUVBRm5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YHB4LTIuNSBweS0xLjUgcm91bmRlZC14bCBtYXgtdy1bODUlXSBicmVhay13b3JkcyB0ZXh0LXhzIGxlYWRpbmctcmVsYXhlZCAke21zZy5pc01lID8gJ2JnLVsjMDBGMkZFXS8xNSB0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIHJvdW5kZWQtdHItbm9uZScgOiAnYmctWyMwQjBFMTRdIHRleHQtc2xhdGUtMjAwIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLXRsLW5vbmUnfWB9PlxuICAgICAgICAgICAgICAgICAgICB7bXNnLmNvbnRlbnR9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8ZGl2IHJlZj17Y2FtcHVzRW5kUmVmfSAvPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgey8qIFJhdGUgbGltaXQgbm90aWNlICovfVxuICAgICAgICAgIHtjYW1wdXNOb3RpY2UgJiYgKFxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwicHgtMyBweS0xIHRleHQtWzEwcHhdIHRleHQtYW1iZXItNDAwIGJnLWFtYmVyLTUwMC8xMCBib3JkZXItdCBib3JkZXItYW1iZXItNTAwLzIwXCI+e2NhbXB1c05vdGljZX08L3A+XG4gICAgICAgICAgKX1cblxuICAgICAgICAgIHsvKiBDb21wb3NlciAqL31cbiAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU2VuZENhbXB1c30gY2xhc3NOYW1lPVwicC0yIGJvcmRlci10IGJvcmRlci13aGl0ZS8xMCBiZy1bIzExMTYyMF0vODAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgc2hyaW5rLTAgcmVsYXRpdmVcIj5cbiAgICAgICAgICAgIHtzaG93RW1vamlQaWNrZXIgPT09ICdjYW1wdXMnICYmIChcbiAgICAgICAgICAgICAgPEVtb2ppUGlja2VyUG9wdXBcbiAgICAgICAgICAgICAgICBvblNlbGVjdD17KGVtb2ppKSA9PiBoYW5kbGVJbnNlcnRFbW9qaShlbW9qaSwgJ2NhbXB1cycpfVxuICAgICAgICAgICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dFbW9qaVBpY2tlcihudWxsKX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93RW1vamlQaWNrZXIoc2hvd0Vtb2ppUGlja2VyID09PSAnY2FtcHVzJyA/IG51bGwgOiAnY2FtcHVzJyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiByb3VuZGVkLXhsIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQteWVsbG93LTMwMCBob3ZlcjpiZy13aGl0ZS81IHRleHQtYmFzZSB0cmFuc2l0aW9uLWNvbG9ycyBzaHJpbmstMFwiXG4gICAgICAgICAgICAgIHRpdGxlPVwiVGhcdTAwRUFtIGJpXHUxRUMzdSB0XHUwMUIwXHUxRUUzbmcgY1x1MUVBM20geFx1MDBGQWNcIj5cbiAgICAgICAgICAgICAgXHVEODNEXHVERTBBXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgICBpZD1cImlucHV0LWNhbXB1cy1jaGF0XCJcbiAgICAgICAgICAgICAgcm93cz17MX1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJOaFx1MUVBRm4gdGluIHRvXHUwMEUwbiBDYW1wdXMuLi5cIlxuICAgICAgICAgICAgICB2YWx1ZT17Y2FtcHVzSW5wdXR9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldENhbXB1c0lucHV0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0PXsoKSA9PiB7IGlzQ2FtcHVzQ29tcG9zaW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPXsoKSA9PiB7IGlzQ2FtcHVzQ29tcG9zaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTsgfX1cbiAgICAgICAgICAgICAgb25LZXlEb3duPXtlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChlLm5hdGl2ZUV2ZW50Py5pc0NvbXBvc2luZyB8fCBpc0NhbXB1c0NvbXBvc2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICBoYW5kbGVTZW5kQ2FtcHVzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICBtYXhMZW5ndGg9ezUwMH1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcHgtMyBweS0yIHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNjAgcmVzaXplLW5vbmUgbWluLWgtWzM4cHhdIG1heC1oLTI0XCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICBpZD1cImJ0bi1zZW5kLWNhbXB1cy1jaGF0XCJcbiAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjYW1wdXNJbnB1dC50cmltKCkgfHwgY2FtcHVzU2VuZGluZ31cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0yIHJvdW5kZWQteGwgYmctWyMwMEYyRkVdIGhvdmVyOmJnLVsjMDBlMWVjXSB0ZXh0LWJsYWNrIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTMwIGRpc2FibGVkOmN1cnNvci1ub3QtYWxsb3dlZCBzaHJpbmstMFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIEdcdTFFRURpXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKSA6IHRhYiA9PT0gJ2NsYXNzJyA/IChcbiAgICAgICAgLyogXHUyNTAwXHUyNTAwXHUyNTAwIFRBQjogTFx1MUVEQVAgKENIQVQgTlx1MUVEOEkgQlx1MUVEOCBMXHUxRURBUCBcdTIwMTQgQ0hcdTFFQzggRFx1MDBDME5IIENITyBUSFx1MDBDME5IIFZJXHUwMENBTiBcdTAxMTBcdTAwQzMgWFx1MDBDMUMgTUlOSCkgXHUyNTAwXHUyNTAwXHUyNTAwICovXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgbWluLWgtMFwiPlxuICAgICAgICAgIHsvKiBDbGFzcyBIZWFkZXIgaW5mbyBiYXIgKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSBiZy1bIzBCMEUxNF0gYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzUgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQteHNcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtYm9sZCB0ZXh0LWN5YW4tMzAwXCI+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REZFQiB7Y2xhc3NUZW5Mb3AgfHwgYXV0aD8udXNlcj8udGVuTG9wIHx8ICdQaFx1MDBGMm5nIGNoYXQgbFx1MUVEQnAnfVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAge2F1dGg/LnVzZXI/LmlzVGVhY2hlciAmJiB0ZWFjaGVyQ2xhc3Nlcy5sZW5ndGggPiAxICYmIChcbiAgICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICAgIHZhbHVlPXtjbGFzc0xvcElkfVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gTnVtYmVyKGUudGFyZ2V0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgIHNldENsYXNzTG9wSWQoaWQpO1xuICAgICAgICAgICAgICAgICAgbGFzdENsYXNzTWVzc2FnZUlkUmVmLmN1cnJlbnQgPSAwO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTUgdGV4dC13aGl0ZSB0ZXh0LVsxMHB4XSBmb250LWJvbGQgcm91bmRlZC1sZyBweC0yIHB5LTEgZm9jdXM6b3V0bGluZS1ub25lXCI+XG4gICAgICAgICAgICAgICAge3RlYWNoZXJDbGFzc2VzLm1hcChjID0+IChcbiAgICAgICAgICAgICAgICAgIDxvcHRpb24ga2V5PXtjLmlkfSB2YWx1ZT17Yy5pZH0+e2MudGVufTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7LyogQ2xhc3MgTWVzc2FnZSBMaXN0ICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXktYXV0byBwLTMgc3BhY2UteS0yLjUgdGV4dC14c1wiPlxuICAgICAgICAgICAge2NsYXNzTWVzc2FnZXMubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LWNlbnRlciBwLTRcIj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMFwiPkNoXHUwMUIwYSBjXHUwMEYzIHRpbiBuaFx1MUVBRm4gbFx1MUVEQnAuIEhcdTAwRTN5IGdcdTFFRURpIGxcdTFFRERpIGNoXHUwMEUwbyBcdTAxMTFcdTFFQTd1IHRpXHUwMEVBbiE8L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgY2xhc3NNZXNzYWdlcy5tYXAobXNnID0+IChcbiAgICAgICAgICAgICAgICA8ZGl2IGtleT17bXNnLmlkfSBjbGFzc05hbWU9e2Bncm91cCBmbGV4IGZsZXgtY29sICR7bXNnLmxhVGluQ3VhVG9pID8gJ2l0ZW1zLWVuZCcgOiAnaXRlbXMtc3RhcnQnfWB9PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IG1iLTAuNSBweC0xXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMFwiPnttc2cudGVuTmd1b2lHdWl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICB7bXNnLnZhaVRybyA9PT0gJ2dpYW9fdmllbicgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEgcHktMC4yIHJvdW5kZWQgdGV4dC1bOHB4XSBmb250LWJsYWNrIGJnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMFwiPkdWQ048L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7bXNnLnRhb0x1YyA/IG5ldyBEYXRlKG1zZy50YW9MdWMucmVwbGFjZSgnICcsICdUJykgKyAnWicpLnRvTG9jYWxlVGltZVN0cmluZyhbXSwgeyBob3VyOiAnMi1kaWdpdCcsIG1pbnV0ZTogJzItZGlnaXQnIH0pIDogJyd9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BweC0yLjUgcHktMS41IHJvdW5kZWQteGwgbWF4LXctWzg1JV0gYnJlYWstd29yZHMgdGV4dC14cyBsZWFkaW5nLXJlbGF4ZWQgJHttc2cubGFUaW5DdWFUb2kgPyAnYmctY3lhbi01MDAvMjAgdGV4dC1jeWFuLTEwMCBib3JkZXIgYm9yZGVyLWN5YW4tNTAwLzQwIHJvdW5kZWQtdHItbm9uZScgOiAnYmctWyMwQjBFMTRdIHRleHQtc2xhdGUtMjAwIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLXRsLW5vbmUnfWB9PlxuICAgICAgICAgICAgICAgICAgICB7bXNnLm5vaUR1bmd9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8ZGl2IHJlZj17Y2xhc3NFbmRSZWZ9IC8+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7LyogUmF0ZSBsaW1pdCBub3RpY2UgKi99XG4gICAgICAgICAge2NsYXNzTm90aWNlICYmIChcbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInB4LTMgcHktMSB0ZXh0LVsxMHB4XSB0ZXh0LWFtYmVyLTQwMCBiZy1hbWJlci01MDAvMTAgYm9yZGVyLXQgYm9yZGVyLWFtYmVyLTUwMC8yMFwiPntjbGFzc05vdGljZX08L3A+XG4gICAgICAgICAgKX1cblxuICAgICAgICAgIHsvKiBDb21wb3NlciAqL31cbiAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU2VuZENsYXNzfSBjbGFzc05hbWU9XCJwLTIgYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzEwIGJnLVsjMTExNjIwXS84MCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBzaHJpbmstMCByZWxhdGl2ZVwiPlxuICAgICAgICAgICAge3Nob3dFbW9qaVBpY2tlciA9PT0gJ2NsYXNzJyAmJiAoXG4gICAgICAgICAgICAgIDxFbW9qaVBpY2tlclBvcHVwXG4gICAgICAgICAgICAgICAgb25TZWxlY3Q9eyhlbW9qaSkgPT4gaGFuZGxlSW5zZXJ0RW1vamkoZW1vamksICdjbGFzcycpfVxuICAgICAgICAgICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dFbW9qaVBpY2tlcihudWxsKX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93RW1vamlQaWNrZXIoc2hvd0Vtb2ppUGlja2VyID09PSAnY2xhc3MnID8gbnVsbCA6ICdjbGFzcycpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTIgcm91bmRlZC14bCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXllbGxvdy0zMDAgaG92ZXI6Ymctd2hpdGUvNSB0ZXh0LWJhc2UgdHJhbnNpdGlvbi1jb2xvcnMgc2hyaW5rLTBcIlxuICAgICAgICAgICAgICB0aXRsZT1cIlRoXHUwMEVBbSBiaVx1MUVDM3UgdFx1MDFCMFx1MUVFM25nIGNcdTFFQTNtIHhcdTAwRkFjXCI+XG4gICAgICAgICAgICAgIFx1RDgzRFx1REUwQVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1jbGFzcy1jaGF0XCJcbiAgICAgICAgICAgICAgcm93cz17MX1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJOaFx1MUVBRm4gdGluIHZcdTFFREJpIGxcdTFFREJwLi4uXCJcbiAgICAgICAgICAgICAgdmFsdWU9e2NsYXNzSW5wdXR9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldENsYXNzSW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ9eygpID0+IHsgaXNDbGFzc0NvbXBvc2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgb25Db21wb3NpdGlvbkVuZD17KCkgPT4geyBpc0NsYXNzQ29tcG9zaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTsgfX1cbiAgICAgICAgICAgICAgb25LZXlEb3duPXtlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChlLm5hdGl2ZUV2ZW50Py5pc0NvbXBvc2luZyB8fCBpc0NsYXNzQ29tcG9zaW5nUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIGhhbmRsZVNlbmRDbGFzcygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgbWF4TGVuZ3RoPXszMDB9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHB4LTMgcHktMiB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItY3lhbi00MDAvNjAgcmVzaXplLW5vbmUgbWluLWgtWzM4cHhdIG1heC1oLTI0XCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICBpZD1cImJ0bi1zZW5kLWNsYXNzLWNoYXRcIlxuICAgICAgICAgICAgICBkaXNhYmxlZD17IWNsYXNzSW5wdXQudHJpbSgpIHx8IGNsYXNzU2VuZGluZ31cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0yIHJvdW5kZWQteGwgYmctY3lhbi00MDAgaG92ZXI6YmctY3lhbi0zMDAgdGV4dC1ibGFjayB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS0zMCBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgc2hyaW5rLTBcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICBHXHUxRUVEaVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9mb3JtPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICkgOiAoXG4gICAgICAgIC8qIFx1MjUwMFx1MjUwMFx1MjUwMCBUQUI6IFRcdTAwRDRJIChCXHUxRUEwTiBCXHUwMEM4ICYgVElOIE5IXHUxRUFFTiBSSVx1MDBDQU5HIDEtMSkgXHUyNTAwXHUyNTAwXHUyNTAwICovXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgbWluLWgtMFwiPlxuICAgICAgICAgIHshYWN0aXZlRnJpZW5kID8gKFxuICAgICAgICAgICAgLyogRlJJRU5EIExJU1QgVklFVyAqL1xuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBtaW4taC0wXCI+XG4gICAgICAgICAgICAgIHsvKiBGcmllbmRzIFRvcCBCYXIgKi99XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC0yLjUgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzUgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGJnLVsjMTExNjIwXS80MCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwXCI+Qlx1MUVBMW4gYlx1MDBFOCAoe2ZyaWVuZHMubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd0FkZEZyaWVuZCh0cnVlKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctd2hpdGUvNSBob3ZlcjpiZy1bIzAwRjJGRV0vMTUgaG92ZXI6dGV4dC1bIzAwRjJGRV0gdGV4dC1zbGF0ZS0zMDAgdGV4dC1bMTFweF0gZm9udC1ib2xkIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPis8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5LXHUxRUJGdCBiXHUxRUExbjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgey8qIFBlbmRpbmcgUmVxdWVzdHMgU2VjdGlvbiAqL31cbiAgICAgICAgICAgICAge3BlbmRpbmdJbmNvbWluZy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMiBib3JkZXItYiBib3JkZXItd2hpdGUvNSBiZy1wdXJwbGUtOTUwLzIwXCI+XG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1wdXJwbGUtMzAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciBtYi0xLjUgcHgtMVwiPkxcdTFFRERpIG1cdTFFRERpIGtcdTFFQkZ0IGJcdTFFQTFuICh7cGVuZGluZ0luY29taW5nLmxlbmd0aH0pPC9wPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICB7cGVuZGluZ0luY29taW5nLm1hcChyZXEgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtyZXEucmVxdWVzdElkfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcC0xLjUgcm91bmRlZC1sZyBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS81IHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLXctMCBwci0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXdoaXRlIHRydW5jYXRlIHRleHQtWzExcHhdXCI+e3JlcS5kaXNwbGF5TmFtZX08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1zbGF0ZS00MDBcIj5Ae3JlcS51c2VybmFtZX0ge3JlcS5jbGFzc0JhZGdlID8gYFx1MjAyMiAke3JlcS5jbGFzc0JhZGdlfWAgOiAnJ308L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gaGFuZGxlQWNjZXB0RnJpZW5kKHJlcS5yZXF1ZXN0SWQsIHJlcS5mcm9tQWNjb3VudElkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yIHB5LTAuNSByb3VuZGVkIGJnLWVtZXJhbGQtNTAwLzIwIHRleHQtZW1lcmFsZC0zMDAgaG92ZXI6YmctZW1lcmFsZC01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUwMTEwXHUxRUQzbmcgXHUwMEZEXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBoYW5kbGVEZWNsaW5lRnJpZW5kKHJlcS5yZXF1ZXN0SWQsIHJlcS5mcm9tQWNjb3VudElkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHRleHQtWzEwcHhdXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgey8qIEZyaWVuZHMgTGlzdCAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHAtMiBzcGFjZS15LTFcIj5cbiAgICAgICAgICAgICAgICB7ZnJpZW5kcy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtZnVsbCBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LWNlbnRlciBwLTRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC0yeGwgbWItMVwiPlx1RDgzRFx1REM2NTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTQwMFwiPkNoXHUwMUIwYSBjXHUwMEYzIGJcdTFFQTFuIGJcdTAwRTggblx1MDBFMG8uPC9wPlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCBtdC0xXCI+Qlx1MUVBNW0gXCIrIEtcdTFFQkZ0IGJcdTFFQTFuXCIgXHUwMTExXHUxRUMzIHRcdTAwRUNtIHZcdTAwRTAga1x1MUVCRnQgblx1MUVEMWkgY1x1MDBGOW5nIGJcdTFFQTFuIGJcdTAwRTggdHJcdTAxQjBcdTFFRERuZy48L3A+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgZnJpZW5kcy5tYXAoZiA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24ga2V5PXtmLmZyaWVuZHNoaXBJZH0gdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRBY3RpdmVGcmllbmQoZik7IG1hcmtEbVJlYWQoZi5hY2NvdW50SWQpOyB0YWlEbU1lc3NhZ2VzKGYuYWNjb3VudElkKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHAtMiByb3VuZGVkLXhsIGJnLVsjMEIwRTE0XS82MCBob3ZlcjpiZy1bIzAwRjJGRV0vMTAgYm9yZGVyIGJvcmRlci13aGl0ZS81IGhvdmVyOmJvcmRlci1bIzAwRjJGRV0vMzAgdHJhbnNpdGlvbi1hbGwgdGV4dC1sZWZ0IGdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctNyBoLTcgcm91bmRlZC1sZyBiZy1ncmFkaWVudC10by10ciBmcm9tLVsjMDBGMkZFXS8zMCB0by1bIzhCNUNGNl0vMzAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZm9udC1ib2xkIHRleHQteHMgdGV4dC13aGl0ZSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7Zi5kaXNwbGF5TmFtZSA/IGYuZGlzcGxheU5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgOiAnPyd9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLXctMCBmbGV4LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC13aGl0ZSBncm91cC1ob3Zlcjp0ZXh0LVsjMDBGMkZFXSB0cmFuc2l0aW9uLWNvbG9ycyB0cnVuY2F0ZVwiPntmLmRpc3BsYXlOYW1lfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDAgdHJ1bmNhdGVcIj5Ae2YudXNlcm5hbWV9IHtmLmNsYXNzQmFkZ2UgPyBgXHUyMDIyICR7Zi5jbGFzc0JhZGdlfWAgOiAnJ308L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7Qm9vbGVhbih1bnJlYWREbXNbZi5hY2NvdW50SWRdKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZC1mdWxsIGJnLWN5YW4tNDAwIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LVs5cHhdXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2Zvcm1hdEJhZGdlKHVucmVhZERtc1tmLmFjY291bnRJZF0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBncm91cC1ob3Zlcjp0ZXh0LXdoaXRlIHRyYW5zaXRpb24tY29sb3JzXCI+XHUyMDNBPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgLyogUFJJVkFURSBDT05WRVJTQVRJT04gVklFVyAqL1xuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBtaW4taC0wXCI+XG4gICAgICAgICAgICAgIHsvKiBDb252byBIZWFkZXIgKi99XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMyBweS0yIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYmctWyMxMTE2MjBdLzYwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVGcmllbmQobnVsbCl9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMSByb3VuZGVkLWxnIGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgdGV4dC14cyBmb250LWJvbGRcIiB0aXRsZT1cIlF1YXkgbFx1MUVBMWkgZGFuaCBzXHUwMEUxY2ggYlx1MUVBMW4gYlx1MDBFOFwiPlxuICAgICAgICAgICAgICAgICAgICBcdTIwMzlcbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtd2hpdGUgdHJ1bmNhdGVcIj57YWN0aXZlRnJpZW5kLmRpc3BsYXlOYW1lfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTQwMCB0cnVuY2F0ZVwiPkB7YWN0aXZlRnJpZW5kLnVzZXJuYW1lfSB7YWN0aXZlRnJpZW5kLmNsYXNzQmFkZ2UgPyBgXHUyMDIyICR7YWN0aXZlRnJpZW5kLmNsYXNzQmFkZ2V9YCA6ICcnfTwvcD5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgey8qIENvbnZvIFNhZmV0eSBBY3Rpb25zICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFJlcG9ydE1vZGFsKHsgdGFyZ2V0SWQ6IGFjdGl2ZUZyaWVuZC5hY2NvdW50SWQsIHRhcmdldE5hbWU6IGFjdGl2ZUZyaWVuZC5kaXNwbGF5TmFtZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtYW1iZXItMzAwIGhvdmVyOmJnLXdoaXRlLzUgdHJhbnNpdGlvbi1hbGxcIiB0aXRsZT1cIkJcdTAwRTFvIGNcdTAwRTFvIG5nXHUwMUIwXHUxRUREaSBkXHUwMEY5bmcgblx1MDBFMHlcIj5cbiAgICAgICAgICAgICAgICAgICAgQlx1MDBFMW8gY1x1MDBFMW9cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gaGFuZGxlQmxvY2soYWN0aXZlRnJpZW5kLmFjY291bnRJZCl9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXJvc2UtNDAwIGhvdmVyOmJnLXdoaXRlLzUgdHJhbnNpdGlvbi1hbGxcIiB0aXRsZT1cIkNoXHUxRUI3biBuZ1x1MDFCMFx1MUVERGkgblx1MDBFMHlcIj5cbiAgICAgICAgICAgICAgICAgICAgQ2hcdTFFQjduXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IGhhbmRsZVVuZnJpZW5kKGFjdGl2ZUZyaWVuZC5hY2NvdW50SWQpfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1zbGF0ZS0yMDAgaG92ZXI6Ymctd2hpdGUvNSB0cmFuc2l0aW9uLWFsbFwiIHRpdGxlPVwiSFx1MUVFN3kga1x1MUVCRnQgYlx1MUVBMW5cIj5cbiAgICAgICAgICAgICAgICAgICAgSFx1MUVFN3kgYlx1MUVBMW5cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogRE0gTWVzc2FnZXMgTGlzdCAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHAtMyBzcGFjZS15LTIgdGV4dC14c1wiPlxuICAgICAgICAgICAgICAgIHtkbU1lc3NhZ2VzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1mdWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtY2VudGVyIHAtNFwiPlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMFwiPkJcdTFFQUZ0IFx1MDExMVx1MUVBN3UgdHJcdTAwRjIgY2h1eVx1MUVDN24gcmlcdTAwRUFuZyB2XHUxRURCaSB7YWN0aXZlRnJpZW5kLmRpc3BsYXlOYW1lfS48L3A+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgZG1NZXNzYWdlcy5tYXAobXNnID0+IChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e21zZy5pZH0gY2xhc3NOYW1lPXtgZ3JvdXAgZmxleCBmbGV4LWNvbCAke21zZy5pc01lID8gJ2l0ZW1zLWVuZCcgOiAnaXRlbXMtc3RhcnQnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEuNSByb3VuZGVkLXhsIG1heC13LVs4NSVdIGJyZWFrLXdvcmRzIHRleHQteHMgbGVhZGluZy1yZWxheGVkICR7bXNnLmlzTWUgPyAnYmctWyMwMEYyRkVdLzIwIHRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgcm91bmRlZC10ci1ub25lJyA6ICdiZy1bIzBCMEUxNF0gdGV4dC1zbGF0ZS0yMDAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXRsLW5vbmUnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7bXNnLmNvbnRlbnR9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHshbXNnLmlzTWUgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0UmVwb3J0TW9kYWwoeyB0YXJnZXRJZDogYWN0aXZlRnJpZW5kLmFjY291bnRJZCwgdGFyZ2V0TmFtZTogYWN0aXZlRnJpZW5kLmRpc3BsYXlOYW1lLCBtZXNzYWdlSWQ6IG1zZy5pZCwgbWVzc2FnZUNvbnRlbnQ6IG1zZy5jb250ZW50IH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wYWNpdHktMCBncm91cC1ob3ZlcjpvcGFjaXR5LTEwMCB0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LWFtYmVyLTMwMCB0cmFuc2l0aW9uLW9wYWNpdHkgcC0wLjVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQlx1MDBFMW8gY1x1MDBFMW8gdGluIG5oXHUxRUFGbiBuXHUwMEUweVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0RcdURFQTlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzhweF0gdGV4dC1zbGF0ZS00MDAgbXQtMC41IHB4LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtuZXcgRGF0ZShtc2cuY3JlYXRlZEF0KS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JyB9KX1cbiAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxkaXYgcmVmPXtkbUVuZFJlZn0gLz5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgey8qIFJhdGUgbGltaXQgbm90aWNlICovfVxuICAgICAgICAgICAgICB7ZG1Ob3RpY2UgJiYgKFxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInB4LTMgcHktMSB0ZXh0LVsxMHB4XSB0ZXh0LWFtYmVyLTQwMCBiZy1hbWJlci01MDAvMTAgYm9yZGVyLXQgYm9yZGVyLWFtYmVyLTUwMC8yMFwiPntkbU5vdGljZX08L3A+XG4gICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgey8qIERNIENvbXBvc2VyICovfVxuICAgICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU2VuZERtfSBjbGFzc05hbWU9XCJwLTIgYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzEwIGJnLVsjMTExNjIwXS84MCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBzaHJpbmstMCByZWxhdGl2ZVwiPlxuICAgICAgICAgICAgICAgIHtzaG93RW1vamlQaWNrZXIgPT09ICdkbScgJiYgKFxuICAgICAgICAgICAgICAgICAgPEVtb2ppUGlja2VyUG9wdXBcbiAgICAgICAgICAgICAgICAgICAgb25TZWxlY3Q9eyhlbW9qaSkgPT4gaGFuZGxlSW5zZXJ0RW1vamkoZW1vamksICdkbScpfVxuICAgICAgICAgICAgICAgICAgICBvbkNsb3NlPXsoKSA9PiBzZXRTaG93RW1vamlQaWNrZXIobnVsbCl9XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93RW1vamlQaWNrZXIoc2hvd0Vtb2ppUGlja2VyID09PSAnZG0nID8gbnVsbCA6ICdkbScpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0yIHJvdW5kZWQteGwgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC15ZWxsb3ctMzAwIGhvdmVyOmJnLXdoaXRlLzUgdGV4dC1iYXNlIHRyYW5zaXRpb24tY29sb3JzIHNocmluay0wXCJcbiAgICAgICAgICAgICAgICAgIHRpdGxlPVwiVGhcdTAwRUFtIGJpXHUxRUMzdSB0XHUwMUIwXHUxRUUzbmcgY1x1MUVBM20geFx1MDBGQWNcIj5cbiAgICAgICAgICAgICAgICAgIFx1RDgzRFx1REUwQVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1kbS1jaGF0XCJcbiAgICAgICAgICAgICAgICAgIHJvd3M9ezF9XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17YE5oXHUxRUFGbiBjaG8gJHthY3RpdmVGcmllbmQuZGlzcGxheU5hbWV9Li4uYH1cbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtkbUlucHV0fVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0RG1JbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ9eygpID0+IHsgaXNEbUNvbXBvc2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ9eygpID0+IHsgaXNEbUNvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7IH19XG4gICAgICAgICAgICAgICAgICBvbktleURvd249e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5uYXRpdmVFdmVudD8uaXNDb21wb3NpbmcgfHwgaXNEbUNvbXBvc2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZVNlbmREbSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXs1MDB9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBweC0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS82MCByZXNpemUtbm9uZSBtaW4taC1bMzhweF0gbWF4LWgtMjRcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi1zZW5kLWRtLWNoYXRcIlxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFkbUlucHV0LnRyaW0oKSB8fCBkbVNlbmRpbmd9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTIgcm91bmRlZC14bCBiZy1bIzAwRjJGRV0gaG92ZXI6YmctWyMwMGUxZWNdIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktMzAgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIHNocmluay0wXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICBHXHUxRUVEaVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBcdTI1MDBcdTI1MDBcdTI1MDAgTU9EQUw6IEtcdTFFQkVUIEJcdTFFQTBOIChTRUFSQ0ggUE9QVVApIFx1MjUwMFx1MjUwMFx1MjUwMCAqL31cbiAgICAgIHtzaG93QWRkRnJpZW5kICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIHotNTAgYmctYmxhY2svNzUgYmFja2Ryb3AtYmx1ci1zbSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IHJvdW5kZWQtMnhsIG1heC13LXNtIHctZnVsbCBwLTQgc2hhZG93LTJ4bCBmbGV4IGZsZXgtY29sIGdhcC0zXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwYi0yIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC13aGl0ZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyNzk1PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPktcdTFFQkZ0IGJcdTFFQTFuIG1cdTFFREJpPC9zcGFuPlxuICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiB7IHNldFNob3dBZGRGcmllbmQoZmFsc2UpOyBzZXRTZWFyY2hSZXN1bHRzKFtdKTsgc2V0U2VhcmNoUXVlcnkoJycpOyB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgdGV4dC1zbVwiPlx1MjcxNTwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIk5oXHUxRUFEcCB0XHUwMEVBbiBcdTAxMTFcdTAxMDNuZyBuaFx1MUVBRHAgKHRcdTFFRDFpIHRoaVx1MUVDM3UgNCBrXHUwMEZEIHRcdTFFRjEpLi4uXCJcbiAgICAgICAgICAgICAgICB2YWx1ZT17c2VhcmNoUXVlcnl9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gaGFuZGxlU2VhcmNoRnJpZW5kcyhlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcHgtMyBweS0yIHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV1cIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCBtdC0xXCI+R1x1MDBGNSB0XHUxRUQxaSB0aGlcdTFFQzN1IDQga1x1MDBGRCB0XHUxRUYxICh0XHUwMEVBbiBcdTAxMTFcdTAxMDNuZyBuaFx1MUVBRHApIFx1MDExMVx1MUVDMyB0XHUwMEVDbSBraVx1MUVCRm0gYlx1MUVBMW4gYlx1MDBFOC48L3A+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAge2FjdGlvbkZlZWRiYWNrICYmIChcbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1lbWVyYWxkLTQwMCBmb250LWJvbGRcIj57YWN0aW9uRmVlZGJhY2t9PC9wPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYXgtaC00OCBvdmVyZmxvdy15LWF1dG8gc3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAge3NlYXJjaExvYWRpbmcgPyAoXG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgdGV4dC1jZW50ZXIgcHktMlwiPlx1MDExMGFuZyB0XHUwMEVDbSBraVx1MUVCRm0uLi48L3A+XG4gICAgICAgICAgICAgICkgOiBzZWFyY2hSZXN1bHRzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICBzZWFyY2hRdWVyeS50cmltKCkubGVuZ3RoID49IDQgPyAoXG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCB0ZXh0LWNlbnRlciBweS0yXCI+S2hcdTAwRjRuZyB0XHUwMEVDbSB0aFx1MUVBNXkgdFx1MDBFMGkga2hvXHUxRUEzbiBwaFx1MDBGOSBoXHUxRUUzcC48L3A+XG4gICAgICAgICAgICAgICAgKSA6IG51bGxcbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICBzZWFyY2hSZXN1bHRzLm1hcCh1ID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXt1LmlkfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcC0yIHJvdW5kZWQteGwgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvNSB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLXctMCBwci0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtd2hpdGUgdHJ1bmNhdGVcIj57dS5kaXNwbGF5TmFtZX08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDBcIj5Ae3UudXNlcm5hbWV9IHt1LmNsYXNzQmFkZ2UgPyBgXHUyMDIyICR7dS5jbGFzc0JhZGdlfWAgOiAnJ308L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICB7dS5mcmllbmRzaGlwU3RhdHVzID09PSAnZnJpZW5kcycgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtZW1lcmFsZC00MDAgc2hyaW5rLTBcIj5CXHUxRUExbiBiXHUwMEU4PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICApIDogdS5mcmllbmRzaGlwU3RhdHVzID09PSAnc2VudF9wZW5kaW5nJyA/IChcbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1hbWJlci00MDAgc2hyaW5rLTBcIj5cdTAxMTBcdTAwRTMgZ1x1MUVFRGkgbFx1MUVERGkgbVx1MUVERGk8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICkgOiB1LmZyaWVuZHNoaXBTdGF0dXMgPT09ICdyZWNlaXZlZF9wZW5kaW5nJyA/IChcbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1wdXJwbGUtNDAwIHNocmluay0wXCI+XHUwMTEwYW5nIGNoXHUxRUREIGJcdTFFQTFuIGR1eVx1MUVDN3Q8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gaGFuZGxlUmVxdWVzdEZyaWVuZCh1LmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctWyMwMEYyRkVdIGhvdmVyOmJnLVsjMDBlMWVjXSB0ZXh0LWJsYWNrIGZvbnQtYm9sZCB0ZXh0LVsxMHB4XSBzaHJpbmstMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgS1x1MUVCRnQgYlx1MUVBMW5cbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogXHUyNTAwXHUyNTAwXHUyNTAwIE1PREFMOiBCXHUwMEMxTyBDXHUwMEMxTyBBTiBUT1x1MDBDME4gKFJFUE9SVCBQT1BVUCkgXHUyNTAwXHUyNTAwXHUyNTAwICovfVxuICAgICAge3JlcG9ydE1vZGFsICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIHotNTAgYmctYmxhY2svODAgYmFja2Ryb3AtYmx1ci1zbSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTRcIj5cbiAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU3VibWl0UmVwb3J0fSBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xNSByb3VuZGVkLTJ4bCBtYXgtdy1zbSB3LWZ1bGwgcC00IHNoYWRvdy0yeGwgZmxleCBmbGV4LWNvbCBnYXAtM1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcGItMiBib3JkZXItYiBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtYW1iZXItMzAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTI2QTBcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3JlcG9ydE1vZGFsLm1lc3NhZ2VJZCA/ICdCXHUwMEUxbyBjXHUwMEUxbyB0aW4gbmhcdTFFQUZuJyA6IGBCXHUwMEUxbyBjXHUwMEUxbyBuZ1x1MDFCMFx1MUVERGkgZFx1MDBGOW5nOiAke3JlcG9ydE1vZGFsLnRhcmdldE5hbWV9YH08L3NwYW4+XG4gICAgICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFJlcG9ydE1vZGFsKG51bGwpfSBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHRleHQtc21cIj5cdTI3MTU8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAge3JlcG9ydE1vZGFsLm1lc3NhZ2VDb250ZW50ICYmIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTIuNSByb3VuZGVkLXhsIGJnLWJsYWNrLzQwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC14cyB0ZXh0LXNsYXRlLTMwMCBpdGFsaWNcIj5cbiAgICAgICAgICAgICAgICBcIntyZXBvcnRNb2RhbC5tZXNzYWdlQ29udGVudC5zbGljZSgwLCAxMDApfXtyZXBvcnRNb2RhbC5tZXNzYWdlQ29udGVudC5sZW5ndGggPiAxMDAgPyAnLi4uJyA6ICcnfVwiXG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICAgIEJcdTAwRTFvIGNcdTAwRTFvIHNcdTFFQkQgXHUwMTExXHUwMUIwXHUxRUUzYyBjaHV5XHUxRUMzbiB0aFx1MUVCM25nIFx1MDExMVx1MUVCRm4gVHJ1bmcgdFx1MDBFMm0gS2lcdTFFQzNtIGR1eVx1MUVDN3QgY1x1MUVFN2EgR2lcdTAwRTFvIHZpXHUwMEVBbi5cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIk1cdTAwRjQgdFx1MUVBMyBsXHUwMEZEIGRvIGJcdTAwRTFvIGNcdTAwRTFvIChuZ1x1MDBGNG4gdFx1MUVFQiBraFx1MDBGNG5nIHBoXHUwMEY5IGhcdTFFRTNwLCBsXHUwMEUwbSBwaGlcdTFFQzFuLCBzcGFtLi4uKVwiXG4gICAgICAgICAgICAgIHZhbHVlPXtyZXBvcnRSZWFzb259XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFJlcG9ydFJlYXNvbihlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgIG1heExlbmd0aD17NTAwfVxuICAgICAgICAgICAgICByb3dzPXszfVxuICAgICAgICAgICAgICByZXF1aXJlZFxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLWFtYmVyLTQwMFwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWVuZCBnYXAtMiBwdC0xXCI+XG4gICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFJlcG9ydE1vZGFsKG51bGwpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQteGwgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgSFx1MUVFN3lcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiIGRpc2FibGVkPXshcmVwb3J0UmVhc29uLnRyaW0oKSB8fCByZXBvcnRpbmd9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC14bCBiZy1hbWJlci01MDAgaG92ZXI6YmctYW1iZXItNDAwIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJvbGQgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIHtyZXBvcnRpbmcgPyAnXHUwMTEwYW5nIGdcdTFFRURpLi4uJyA6ICdHXHUxRUVEaSBiXHUwMEUxbyBjXHUwMEUxbyd9XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9mb3JtPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiQUFDQSxNQUFNLG1CQUFtQjtBQUFBLEVBQ3ZCO0FBQUEsSUFDRSxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixRQUFRLENBQUMsYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxh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
