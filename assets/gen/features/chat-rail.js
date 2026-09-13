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
      console.log(`[API_CALL] /api/chat caller=taiClassChat(chat-rail) sauId=${sauId} t=${(/* @__PURE__ */ new Date()).toISOString()}`);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvY2hhdC1yYWlsLmpzeCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiXG5jb25zdCBFTU9KSV9DQVRFR09SSUVTID0gW1xuICB7XG4gICAgbmFtZTogJ01cdTFFQjd0IGNcdTAxQjBcdTFFRERpJyxcbiAgICBpY29uOiAnXHVEODNEXHVERTBBJyxcbiAgICBlbW9qaXM6IFsnXHVEODNEXHVERTAwJywgJ1x1RDgzRFx1REUwMycsICdcdUQ4M0RcdURFMDQnLCAnXHVEODNEXHVERTAxJywgJ1x1RDgzRFx1REUwNicsICdcdUQ4M0RcdURFMDUnLCAnXHVEODNEXHVERTAyJywgJ1x1RDgzRVx1REQyMycsICdcdUQ4M0RcdURFMEEnLCAnXHVEODNEXHVERTA3JywgJ1x1RDgzRFx1REU0MicsICdcdUQ4M0RcdURFNDMnLCAnXHVEODNEXHVERTA5JywgJ1x1RDgzRFx1REUwQycsICdcdUQ4M0RcdURFMEQnLCAnXHVEODNFXHVERDcwJywgJ1x1RDgzRFx1REUxOCcsICdcdUQ4M0RcdURFMEInLCAnXHVEODNEXHVERTFCJywgJ1x1RDgzRFx1REUxQycsICdcdUQ4M0VcdUREMkEnLCAnXHVEODNEXHVERTBFJywgJ1x1RDgzRVx1REQ3MycsICdcdUQ4M0VcdUREMjknLCAnXHVEODNFXHVERDE0JywgJ1x1RDgzRVx1REQyQicsICdcdUQ4M0RcdURFMzQnLCAnXHVEODNEXHVERTM3JywgJ1x1RDgzRVx1REQyRicsICdcdUQ4M0VcdUREMjAnXVxuICB9LFxuICB7XG4gICAgbmFtZTogJ0NcdTFFQTNtIHhcdTAwRkFjICYgVGF5JyxcbiAgICBpY29uOiAnXHUyNzY0XHVGRTBGJyxcbiAgICBlbW9qaXM6IFsnXHUyNzY0XHVGRTBGJywgJ1x1RDgzRVx1RERFMScsICdcdUQ4M0RcdURDOUInLCAnXHVEODNEXHVEQzlBJywgJ1x1RDgzRFx1REM5OScsICdcdUQ4M0RcdURDOUMnLCAnXHVEODNEXHVEREE0JywgJ1x1RDgzRVx1REQwRCcsICdcdUQ4M0RcdURDOTQnLCAnXHVEODNEXHVEQzk2JywgJ1x1RDgzRFx1REQyNScsICdcdUQ4M0RcdURDQUYnLCAnXHUyNzI4JywgJ1x1RDgzQ1x1REYxRicsICdcdTJCNTAnLCAnXHVEODNEXHVEQ0E1JywgJ1x1RDgzRFx1RENBQycsICdcdUQ4M0RcdURDNEQnLCAnXHVEODNEXHVEQzRFJywgJ1x1RDgzRFx1REM0RicsICdcdUQ4M0RcdURFNEMnLCAnXHVEODNFXHVERDFEJywgJ1x1RDgzRFx1REM0QScsICdcdTI3MENcdUZFMEYnLCAnXHVEODNFXHVERDFFJywgJ1x1RDgzRVx1REQxRicsICdcdUQ4M0RcdURDNEMnLCAnXHVEODNEXHVEQzRCJywgJ1x1RDgzRFx1REU0RiddXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVHJcdTAxQjBcdTFFRERuZyBoXHUxRUNEYyAmIFZ1aScsXG4gICAgaWNvbjogJ1x1RDgzQ1x1REY5MycsXG4gICAgZW1vamlzOiBbJ1x1RDgzRFx1RENEQScsICdcdUQ4M0RcdURDRDYnLCAnXHVEODNEXHVEQ0Q1JywgJ1x1RDgzRFx1RENENycsICdcdUQ4M0RcdURDRDgnLCAnXHVEODNDXHVERjkzJywgJ1x1RDgzQ1x1REZFQicsICdcdUQ4M0NcdURGOTInLCAnXHVEODNEXHVEQ0REJywgJ1x1MjcwRlx1RkUwRicsICdcdUQ4M0NcdURGQUYnLCAnXHVEODNDXHVERkFFJywgJ1x1RDgzQ1x1REZCMicsICdcdUQ4M0NcdURGQzYnLCAnXHVEODNFXHVERDQ3JywgJ1x1MjYxNScsICdcdUQ4M0NcdURGNTUnLCAnXHVEODNDXHVERjcwJywgJ1x1RDgzQ1x1REY4MicsICdcdUQ4M0RcdURFODAnLCAnXHVEODNEXHVEQ0ExJywgJ1x1RDgzQ1x1REY4OScsICdcdUQ4M0NcdURGODgnLCAnXHVEODNDXHVERkI1JywgJ1x1RDgzQ1x1REZCNicsICdcdUQ4M0RcdURDMzEnLCAnXHVEODNEXHVEQzM2JywgJ1x1RDgzQ1x1REYzOCcsICdcdUQ4M0NcdURGNDAnXVxuICB9XG5dO1xuXG5mdW5jdGlvbiBFbW9qaVBpY2tlclBvcHVwKHsgb25TZWxlY3QsIG9uQ2xvc2UgfSkge1xuICBjb25zdCBbYWN0aXZlQ2F0LCBzZXRBY3RpdmVDYXRdID0gUmVhY3QudXNlU3RhdGUoMCk7XG4gIGNvbnN0IHBvcHVwUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgaGFuZGxlT3V0c2lkZSA9IChlKSA9PiB7XG4gICAgICBpZiAocG9wdXBSZWYuY3VycmVudCAmJiAhcG9wdXBSZWYuY3VycmVudC5jb250YWlucyhlLnRhcmdldCkpIHtcbiAgICAgICAgb25DbG9zZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlT3V0c2lkZSk7XG4gICAgcmV0dXJuICgpID0+IGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZU91dHNpZGUpO1xuICB9LCBbb25DbG9zZV0pO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtwb3B1cFJlZn1cbiAgICAgIGNsYXNzTmFtZT1cImFic29sdXRlIGJvdHRvbS1mdWxsIG1iLTIgcmlnaHQtMCBsZWZ0LTAgei01MCBiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci1jeWFuLTUwMC8zMCByb3VuZGVkLTJ4bCBwLTIuNSBzaGFkb3ctMnhsIGJhY2tkcm9wLWJsdXIteGwgYW5pbWF0ZS1zY2FsZUluIG1heC13LVszMjBweF0gbXgtYXV0byBzbTptbC1hdXRvIHNtOm1yLTBcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHBiLTIgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIG1iLTJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBvdmVyZmxvdy14LWF1dG9cIj5cbiAgICAgICAgICB7RU1PSklfQ0FURUdPUklFUy5tYXAoKGNhdCwgaWR4KSA9PiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGtleT17Y2F0Lm5hbWV9XG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVDYXQoaWR4KX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMiBweS0xIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgc2hyaW5rLTAgJHthY3RpdmVDYXQgPT09IGlkeCA/ICdiZy1bIzAwRjJGRV0vMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAnIDogJ3RleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtci0xXCI+e2NhdC5pY29ufTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+e2NhdC5uYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICkpfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIG9uQ2xpY2s9e29uQ2xvc2V9XG4gICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LXhzIHB4LTEgc2hyaW5rLTBcIj5cbiAgICAgICAgICBcdTI3MTVcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtNiBnYXAtMSBtYXgtaC00MCBvdmVyZmxvdy15LWF1dG8gcC0xXCI+XG4gICAgICAgIHtFTU9KSV9DQVRFR09SSUVTW2FjdGl2ZUNhdF0uZW1vamlzLm1hcCgoZW1vamkpID0+IChcbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBrZXk9e2Vtb2ppfVxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvblNlbGVjdChlbW9qaSl9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTkgaC05IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtbGcgcm91bmRlZC14bCBob3ZlcjpiZy13aGl0ZS8xMCBhY3RpdmU6c2NhbGUtOTAgdHJhbnNpdGlvbi10cmFuc2Zvcm1cIj5cbiAgICAgICAgICAgIHtlbW9qaX1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgKSl9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENBTVBVUyBDSEFUICYgU09DSUFMIFJBSUwgKFBIQVNFIDREOiBDQU1QVVMgfCBMXHUxRURBUCB8IFRcdTAwRDRJKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBmdW5jdGlvbiBDYW1wdXNDaGF0UmFpbCh7IGF1dGgsIG9uUmVxdWlyZUF1dGgsIGNsYXNzTmFtZSA9ICcnLCBpc0FjdGl2ZSA9IHRydWUgfSkge1xuICBjb25zdCBbdGFiLCBzZXRUYWJdID0gUmVhY3QudXNlU3RhdGUoJ2NhbXB1cycpOyAvLyAnY2FtcHVzJyB8ICdjbGFzcycgfCAnbWUnXG4gIGNvbnN0IFtzaG93RW1vamlQaWNrZXIsIHNldFNob3dFbW9qaVBpY2tlcl0gPSBSZWFjdC51c2VTdGF0ZShudWxsKTsgLy8gJ2NhbXB1cycgfCAnY2xhc3MnIHwgJ2RtJyB8IG51bGxcblxuICBjb25zdCBoYW5kbGVJbnNlcnRFbW9qaSA9IChlbW9qaSwgdGFyZ2V0KSA9PiB7XG4gICAgaWYgKHRhcmdldCA9PT0gJ2NhbXB1cycpIHtcbiAgICAgIHNldENhbXB1c0lucHV0KHByZXYgPT4gcHJldiArIGVtb2ppKTtcbiAgICB9IGVsc2UgaWYgKHRhcmdldCA9PT0gJ2NsYXNzJykge1xuICAgICAgc2V0Q2xhc3NJbnB1dChwcmV2ID0+IHByZXYgKyBlbW9qaSk7XG4gICAgfSBlbHNlIGlmICh0YXJnZXQgPT09ICdkbScpIHtcbiAgICAgIHNldERtSW5wdXQocHJldiA9PiBwcmV2ICsgZW1vamkpO1xuICAgIH1cbiAgfTtcblxuICAvLyBBdHRlbnRpb24gJiBVbnJlYWQgc3RhdGUgKFBoYXNlIDRGKVxuICBjb25zdCBbdW5yZWFkQ2FtcHVzLCBzZXRVbnJlYWRDYW1wdXNdID0gUmVhY3QudXNlU3RhdGUoMCk7XG4gIGNvbnN0IFt1bnJlYWRDbGFzcywgc2V0VW5yZWFkQ2xhc3NdID0gUmVhY3QudXNlU3RhdGUoMCk7XG4gIGNvbnN0IFt1bnJlYWREbXMsIHNldFVucmVhZERtc10gPSBSZWFjdC51c2VTdGF0ZSh7fSk7XG4gIGNvbnN0IFt0b3RhbERtcywgc2V0VG90YWxEbXNdID0gUmVhY3QudXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtwZW5kaW5nRnJpZW5kUmVxdWVzdHNDb3VudCwgc2V0UGVuZGluZ0ZyaWVuZFJlcXVlc3RzQ291bnRdID0gUmVhY3QudXNlU3RhdGUoMCk7XG5cbiAgY29uc3QgaXNDYW1wdXNDb21wb3NpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBpc0NsYXNzQ29tcG9zaW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgaXNEbUNvbXBvc2luZ1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG5cbiAgY29uc3QgZm9ybWF0QmFkZ2UgPSAobnVtKSA9PiB7XG4gICAgaWYgKCFudW0gfHwgbnVtIDw9IDApIHJldHVybiBudWxsO1xuICAgIHJldHVybiBudW0gPiA5OSA/ICc5OSsnIDogU3RyaW5nKG51bSk7XG4gIH07XG5cbiAgLy8gQ2FtcHVzIENoYXQgc3RhdGVcbiAgY29uc3QgW2NhbXB1c01lc3NhZ2VzLCBzZXRDYW1wdXNNZXNzYWdlc10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFtjYW1wdXNJbnB1dCwgc2V0Q2FtcHVzSW5wdXRdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbY2FtcHVzU2VuZGluZywgc2V0Q2FtcHVzU2VuZGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtjYW1wdXNOb3RpY2UsIHNldENhbXB1c05vdGljZV0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IGxhc3RDYW1wdXNNZXNzYWdlSWRSZWYgPSBSZWFjdC51c2VSZWYoMCk7XG4gIGNvbnN0IGNhbXB1c0VuZFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcblxuICAvLyBDbGFzcyBDaGF0IHN0YXRlXG4gIGNvbnN0IFtjbGFzc01lc3NhZ2VzLCBzZXRDbGFzc01lc3NhZ2VzXSA9IFJlYWN0LnVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW2NsYXNzSW5wdXQsIHNldENsYXNzSW5wdXRdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbY2xhc3NTZW5kaW5nLCBzZXRDbGFzc1NlbmRpbmddID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbY2xhc3NOb3RpY2UsIHNldENsYXNzTm90aWNlXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2NsYXNzTG9wSWQsIHNldENsYXNzTG9wSWRdID0gUmVhY3QudXNlU3RhdGUoYXV0aD8udXNlcj8ubG9wSWQgfHwgMSk7XG4gIGNvbnN0IFt0ZWFjaGVyQ2xhc3Nlcywgc2V0VGVhY2hlckNsYXNzZXNdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbY2xhc3NUZW5Mb3AsIHNldENsYXNzVGVuTG9wXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgbGFzdENsYXNzTWVzc2FnZUlkUmVmID0gUmVhY3QudXNlUmVmKDApO1xuICBjb25zdCBjbGFzc0VuZFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcblxuICAvLyBUXHUwMEY0aSAoRnJpZW5kcyAmIERNKSBzdGF0ZVxuICBjb25zdCBbZnJpZW5kcywgc2V0RnJpZW5kc10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFtwZW5kaW5nSW5jb21pbmcsIHNldFBlbmRpbmdJbmNvbWluZ10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFthY3RpdmVGcmllbmQsIHNldEFjdGl2ZUZyaWVuZF0gPSBSZWFjdC51c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW2RtTWVzc2FnZXMsIHNldERtTWVzc2FnZXNdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbZG1JbnB1dCwgc2V0RG1JbnB1dF0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtkbVNlbmRpbmcsIHNldERtU2VuZGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtkbU5vdGljZSwgc2V0RG1Ob3RpY2VdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBsYXN0RG1NZXNzYWdlSWRSZWYgPSBSZWFjdC51c2VSZWYoMCk7XG4gIGNvbnN0IGRtRW5kUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuXG4gIC8vIEZyaWVuZCBTZWFyY2ggJiBTYWZldHkgTW9kYWwgc3RhdGVcbiAgY29uc3QgW3Nob3dBZGRGcmllbmQsIHNldFNob3dBZGRGcmllbmRdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2VhcmNoUXVlcnksIHNldFNlYXJjaFF1ZXJ5XSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3NlYXJjaFJlc3VsdHMsIHNldFNlYXJjaFJlc3VsdHNdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbc2VhcmNoTG9hZGluZywgc2V0U2VhcmNoTG9hZGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFthY3Rpb25GZWVkYmFjaywgc2V0QWN0aW9uRmVlZGJhY2tdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuXG4gIGNvbnN0IFtyZXBvcnRNb2RhbCwgc2V0UmVwb3J0TW9kYWxdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IFtyZXBvcnRSZWFzb24sIHNldFJlcG9ydFJlYXNvbl0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtyZXBvcnRpbmcsIHNldFJlcG9ydGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG5cbiAgLy8gU3RhYmxlIHJlZnMgZm9yIHNpbmdsZSBib3VuZGVkIHBvbGxpbmcgbG9vcFxuICBjb25zdCB0YWJSZWYgPSBSZWFjdC51c2VSZWYodGFiKTtcbiAgY29uc3QgYWN0aXZlRnJpZW5kUmVmID0gUmVhY3QudXNlUmVmKGFjdGl2ZUZyaWVuZCk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICB0YWJSZWYuY3VycmVudCA9IHRhYjtcbiAgfSwgW3RhYl0pO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYWN0aXZlRnJpZW5kUmVmLmN1cnJlbnQgPSBhY3RpdmVGcmllbmQ7XG4gICAgbGFzdERtTWVzc2FnZUlkUmVmLmN1cnJlbnQgPSAwO1xuICB9LCBbYWN0aXZlRnJpZW5kXSk7XG5cbiAgY29uc3QgaXNBY3RpdmVDYW1wdXNBY2NvdW50ID0gQm9vbGVhbighYXV0aD8uaXNHdWVzdCAmJiBhdXRoPy51c2VyKTtcbiAgY29uc3QgaGFzQ2xhc3NBY2Nlc3MgPSBCb29sZWFuKGF1dGg/LnVzZXI/LmlzVGVhY2hlciB8fCBhdXRoPy51c2VyPy5pc0xpbmtlZFN0dWRlbnQpO1xuXG4gIC8vIEd1YXJkOiBpZiB1c2VyIGxvc2VzIGNsYXNzIGFjY2VzcywgcmV2ZXJ0IHRhYiB0byAnY2FtcHVzJ1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghaGFzQ2xhc3NBY2Nlc3MgJiYgdGFiID09PSAnY2xhc3MnKSB7XG4gICAgICBzZXRUYWIoJ2NhbXB1cycpO1xuICAgIH1cbiAgfSwgW2hhc0NsYXNzQWNjZXNzLCB0YWJdKTtcblxuICAvLyBUXHUxRUEzaSB0clx1MUVBMW5nIHRoXHUwMEUxaSB0aW4gbmhcdTFFQUZuIGNoXHUwMUIwYSBcdTAxMTFcdTFFQ0RjIChQaGFzZSA0RilcbiAgY29uc3QgdGFpVW5yZWFkU3RhdGUgPSBSZWFjdC51c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFpc0FjdGl2ZUNhbXB1c0FjY291bnQpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvY2hhdC1yZWFkLXN0YXRlJyk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSB7XG4gICAgICAgIHNldFVucmVhZENhbXB1cyhkLmNhbXB1cyB8fCAwKTtcbiAgICAgICAgc2V0VW5yZWFkQ2xhc3MoZC5jbGFzcyB8fCAwKTtcbiAgICAgICAgc2V0VW5yZWFkRG1zKGQuZG1zIHx8IHt9KTtcbiAgICAgICAgc2V0VG90YWxEbXMoZC50b3RhbERtcyB8fCAwKTtcbiAgICAgICAgc2V0UGVuZGluZ0ZyaWVuZFJlcXVlc3RzQ291bnQoZC5wZW5kaW5nRnJpZW5kUmVxdWVzdHMgfHwgMCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9LCBbaXNBY3RpdmVDYW1wdXNBY2NvdW50XSk7XG5cbiAgY29uc3QgbWFya0NhbXB1c1JlYWQgPSBSZWFjdC51c2VDYWxsYmFjayhhc3luYyAobWF4SWQgPSAwKSA9PiB7XG4gICAgc2V0VW5yZWFkQ2FtcHVzKDApO1xuICAgIGlmICghaXNBY3RpdmVDYW1wdXNBY2NvdW50KSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZldGNoKCcvYXBpL2NoYXQtcmVhZC1zdGF0ZScsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGNoYW5uZWxUeXBlOiAnY2FtcHVzJywgY2hhbm5lbEtleTogJ2NhbXB1cycsIGxhc3RSZWFkSWQ6IG1heElkIH0pXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIHt9XG4gIH0sIFtpc0FjdGl2ZUNhbXB1c0FjY291bnRdKTtcblxuICBjb25zdCBtYXJrQ2xhc3NSZWFkID0gUmVhY3QudXNlQ2FsbGJhY2soYXN5bmMgKGxvcElkLCBtYXhJZCA9IDApID0+IHtcbiAgICBzZXRVbnJlYWRDbGFzcygwKTtcbiAgICBpZiAoIWlzQWN0aXZlQ2FtcHVzQWNjb3VudCB8fCAhbG9wSWQpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvY2hhdC1yZWFkLXN0YXRlJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgY2hhbm5lbFR5cGU6ICdjbGFzcycsIGNoYW5uZWxLZXk6ICdsb3A6JyArIGxvcElkLCBsYXN0UmVhZElkOiBtYXhJZCB9KVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCB7fVxuICB9LCBbaXNBY3RpdmVDYW1wdXNBY2NvdW50XSk7XG5cbiAgY29uc3QgbWFya0RtUmVhZCA9IFJlYWN0LnVzZUNhbGxiYWNrKGFzeW5jIChmcmllbmRJZCwgbWF4SWQgPSAwKSA9PiB7XG4gICAgc2V0VW5yZWFkRG1zKHByZXYgPT4gKHsgLi4ucHJldiwgW2ZyaWVuZElkXTogMCB9KSk7XG4gICAgaWYgKCFpc0FjdGl2ZUNhbXB1c0FjY291bnQgfHwgIWZyaWVuZElkKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZldGNoKCcvYXBpL2NoYXQtcmVhZC1zdGF0ZScsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGNoYW5uZWxUeXBlOiAnZG0nLCBjaGFubmVsS2V5OiAncGVlcjonICsgZnJpZW5kSWQsIGxhc3RSZWFkSWQ6IG1heElkIH0pXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIHt9XG4gIH0sIFtpc0FjdGl2ZUNhbXB1c0FjY291bnRdKTtcblxuICAvLyAxLiBUXHUxRUEzaSBDYW1wdXMgQ2hhdCBpbmNyZW1lbnRhbFxuICBjb25zdCB0YWlDYW1wdXNDaGF0ID0gUmVhY3QudXNlQ2FsbGJhY2soYXN5bmMgKHNhdUlkID0gMCkgPT4ge1xuICAgIGlmICghaXNBY3RpdmVDYW1wdXNBY2NvdW50KSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVybCA9IHNhdUlkID4gMCA/IGAvYXBpL2NhbXB1cy1jaGF0P3NhdUlkPSR7c2F1SWR9JmxpbWl0PTUwYCA6ICcvYXBpL2NhbXB1cy1jaGF0P2xpbWl0PTUwJztcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwgeyBoZWFkZXJzOiB7ICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicgfSB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2sgJiYgQXJyYXkuaXNBcnJheShkYXRhLm1lc3NhZ2VzKSkge1xuICAgICAgICBpZiAoc2F1SWQgPiAwKSB7XG4gICAgICAgICAgaWYgKGRhdGEubWVzc2FnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc2V0Q2FtcHVzTWVzc2FnZXMocHJldiA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSWRzID0gbmV3IFNldChwcmV2Lm1hcChtID0+IG0uaWQpKTtcbiAgICAgICAgICAgICAgY29uc3QgbmV3T25lcyA9IGRhdGEubWVzc2FnZXMuZmlsdGVyKG0gPT4gIWV4aXN0aW5nSWRzLmhhcyhtLmlkKSk7XG4gICAgICAgICAgICAgIGlmIChuZXdPbmVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHByZXY7XG4gICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBbLi4ucHJldiwgLi4ubmV3T25lc107XG4gICAgICAgICAgICAgIGxhc3RDYW1wdXNNZXNzYWdlSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KC4uLm5leHQubWFwKG0gPT4gbS5pZCB8fCAwKSk7XG4gICAgICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldENhbXB1c01lc3NhZ2VzKGRhdGEubWVzc2FnZXMpO1xuICAgICAgICAgIGlmIChkYXRhLm1lc3NhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGxhc3RDYW1wdXNNZXNzYWdlSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KC4uLmRhdGEubWVzc2FnZXMubWFwKG0gPT4gbS5pZCB8fCAwKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9LCBbaXNBY3RpdmVDYW1wdXNBY2NvdW50XSk7XG5cbiAgLy8gMi4gVFx1MUVBM2kgQ2xhc3MgQ2hhdCBpbmNyZW1lbnRhbFxuICBjb25zdCB0YWlDbGFzc0NoYXQgPSBSZWFjdC51c2VDYWxsYmFjayhhc3luYyAoc2F1SWQgPSAwKSA9PiB7XG4gICAgaWYgKCFoYXNDbGFzc0FjY2VzcykgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBsb3BQYXJhbSA9IGF1dGg/LnVzZXI/LmlzVGVhY2hlciAmJiBjbGFzc0xvcElkID8gYCZsb3BJZD0ke2NsYXNzTG9wSWR9YCA6ICcnO1xuICAgICAgY29uc3QgdXJsID0gc2F1SWQgPiAwID8gYC9hcGkvY2hhdD9zYXVJZD0ke3NhdUlkfSR7bG9wUGFyYW19YCA6IGAvYXBpL2NoYXQke2xvcFBhcmFtID8gJz8nICsgbG9wUGFyYW0uc2xpY2UoMSkgOiAnJ31gO1xuICAgICAgLy8gVFx1MUVBME0gVEhcdTFFRENJOiBjaFx1MUVBOW4gXHUwMTExb1x1MDBFMW4gcmVxdWVzdC1zdG9ybSAvYXBpL2NoYXQgXHUyMDE0IGdcdTFFRTEgZFx1MDBGMm5nIGxvZyBuXHUwMEUweSBjXHUwMEY5bmcgbFx1MDBGQWMgdlx1MUVEQmkgY2FtcHVzLWFwcC5qc3guXG4gICAgICBjb25zb2xlLmxvZyhgW0FQSV9DQUxMXSAvYXBpL2NoYXQgY2FsbGVyPXRhaUNsYXNzQ2hhdChjaGF0LXJhaWwpIHNhdUlkPSR7c2F1SWR9IHQ9JHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9YCk7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwsIHsgaGVhZGVyczogeyAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nIH0gfSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkYXRhLm9rKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGRhdGEuY2FjTG9wKSAmJiBkYXRhLmNhY0xvcC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgc2V0VGVhY2hlckNsYXNzZXMoZGF0YS5jYWNMb3ApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLnRlbkxvcCkgc2V0Q2xhc3NUZW5Mb3AoZGF0YS50ZW5Mb3ApO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkYXRhLnRpbk5oYW4pKSB7XG4gICAgICAgICAgaWYgKHNhdUlkID4gMCkge1xuICAgICAgICAgICAgaWYgKGRhdGEudGluTmhhbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHNldENsYXNzTWVzc2FnZXMocHJldiA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdJZHMgPSBuZXcgU2V0KHByZXYubWFwKG0gPT4gbS5pZCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld09uZXMgPSBkYXRhLnRpbk5oYW4uZmlsdGVyKG0gPT4gIWV4aXN0aW5nSWRzLmhhcyhtLmlkKSk7XG4gICAgICAgICAgICAgICAgaWYgKG5ld09uZXMubGVuZ3RoID09PSAwKSByZXR1cm4gcHJldjtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gWy4uLnByZXYsIC4uLm5ld09uZXNdO1xuICAgICAgICAgICAgICAgIGxhc3RDbGFzc01lc3NhZ2VJZFJlZi5jdXJyZW50ID0gTWF0aC5tYXgoLi4ubmV4dC5tYXAobSA9PiBtLmlkIHx8IDApKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldENsYXNzTWVzc2FnZXMoZGF0YS50aW5OaGFuKTtcbiAgICAgICAgICAgIGlmIChkYXRhLnRpbk5oYW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBsYXN0Q2xhc3NNZXNzYWdlSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KC4uLmRhdGEudGluTmhhbi5tYXAobSA9PiBtLmlkIHx8IDApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH0sIFtoYXNDbGFzc0FjY2VzcywgYXV0aD8udXNlcj8uaXNUZWFjaGVyLCBjbGFzc0xvcElkXSk7XG5cbiAgLy8gMy4gVFx1MUVBM2kgQlx1MUVBMW4gYlx1MDBFOCAmIExcdTFFRERpIG1cdTFFRERpXG4gIGNvbnN0IHRhaUZyaWVuZHMgPSBSZWFjdC51c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFpc0FjdGl2ZUNhbXB1c0FjY291bnQpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvY2FtcHVzLWZyaWVuZHMnLCB7IGhlYWRlcnM6IHsgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJyB9IH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZGF0YS5vaykge1xuICAgICAgICBzZXRGcmllbmRzKGRhdGEuZnJpZW5kcyB8fCBbXSk7XG4gICAgICAgIHNldFBlbmRpbmdJbmNvbWluZyhkYXRhLnBlbmRpbmdJbmNvbWluZyB8fCBbXSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9LCBbaXNBY3RpdmVDYW1wdXNBY2NvdW50XSk7XG5cbiAgLy8gNC4gVFx1MUVBM2kgdGluIG5oXHUxRUFGbiBETSBpbmNyZW1lbnRhbFxuICBjb25zdCB0YWlEbU1lc3NhZ2VzID0gUmVhY3QudXNlQ2FsbGJhY2soYXN5bmMgKGZyaWVuZElkLCBzYXVJZCA9IDApID0+IHtcbiAgICBpZiAoIWZyaWVuZElkIHx8ICFpc0FjdGl2ZUNhbXB1c0FjY291bnQpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdXJsID0gc2F1SWQgPiAwXG4gICAgICAgID8gYC9hcGkvY2FtcHVzLWRtP2ZyaWVuZEFjY291bnRJZD0ke2ZyaWVuZElkfSZzYXVJZD0ke3NhdUlkfSZsaW1pdD01MGBcbiAgICAgICAgOiBgL2FwaS9jYW1wdXMtZG0/ZnJpZW5kQWNjb3VudElkPSR7ZnJpZW5kSWR9JmxpbWl0PTUwYDtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwgeyBoZWFkZXJzOiB7ICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicgfSB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2sgJiYgQXJyYXkuaXNBcnJheShkYXRhLm1lc3NhZ2VzKSkge1xuICAgICAgICBpZiAoc2F1SWQgPiAwKSB7XG4gICAgICAgICAgaWYgKGRhdGEubWVzc2FnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc2V0RG1NZXNzYWdlcyhwcmV2ID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdJZHMgPSBuZXcgU2V0KHByZXYubWFwKG0gPT4gbS5pZCkpO1xuICAgICAgICAgICAgICBjb25zdCBuZXdPbmVzID0gZGF0YS5tZXNzYWdlcy5maWx0ZXIobSA9PiAhZXhpc3RpbmdJZHMuaGFzKG0uaWQpKTtcbiAgICAgICAgICAgICAgaWYgKG5ld09uZXMubGVuZ3RoID09PSAwKSByZXR1cm4gcHJldjtcbiAgICAgICAgICAgICAgY29uc3QgbmV4dCA9IFsuLi5wcmV2LCAuLi5uZXdPbmVzXTtcbiAgICAgICAgICAgICAgbGFzdERtTWVzc2FnZUlkUmVmLmN1cnJlbnQgPSBNYXRoLm1heCguLi5uZXh0Lm1hcChtID0+IG0uaWQgfHwgMCkpO1xuICAgICAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXREbU1lc3NhZ2VzKGRhdGEubWVzc2FnZXMpO1xuICAgICAgICAgIGlmIChkYXRhLm1lc3NhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGxhc3REbU1lc3NhZ2VJZFJlZi5jdXJyZW50ID0gTWF0aC5tYXgoLi4uZGF0YS5tZXNzYWdlcy5tYXAobSA9PiBtLmlkIHx8IDApKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH0sIFtpc0FjdGl2ZUNhbXB1c0FjY291bnRdKTtcblxuICAvLyBTSU5HTEUgQk9VTkRFRCBQT0xMSU5HIExPT1AgKDRzKTogZXhhY3RseSBvbmUgbG9vcCwgcG9sbHMgT05MWSBhY3RpdmUgdGFiLCBwYXVzZXMgd2hlbiBkcmF3ZXIgY2xvc2VkXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFpc0FjdGl2ZUNhbXB1c0FjY291bnQgfHwgIWlzQWN0aXZlKSByZXR1cm47XG5cbiAgICBpZiAodGFiID09PSAnY2FtcHVzJykge1xuICAgICAgdGFpQ2FtcHVzQ2hhdCgwKTtcbiAgICB9IGVsc2UgaWYgKHRhYiA9PT0gJ2NsYXNzJykge1xuICAgICAgaWYgKGhhc0NsYXNzQWNjZXNzKSB0YWlDbGFzc0NoYXQoMCk7XG4gICAgfSBlbHNlIGlmICh0YWIgPT09ICdtZScpIHtcbiAgICAgIGlmIChhY3RpdmVGcmllbmQpIHtcbiAgICAgICAgdGFpRG1NZXNzYWdlcyhhY3RpdmVGcmllbmQuYWNjb3VudElkLCAwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRhaUZyaWVuZHMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0YWlVbnJlYWRTdGF0ZSgpO1xuXG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlICE9PSAndmlzaWJsZScpIHJldHVybjtcbiAgICAgIGNvbnN0IGN1cnJlbnRUYWIgPSB0YWJSZWYuY3VycmVudDtcbiAgICAgIGNvbnN0IGN1cnJlbnRGcmllbmQgPSBhY3RpdmVGcmllbmRSZWYuY3VycmVudDtcblxuICAgICAgdGFpVW5yZWFkU3RhdGUoKTtcblxuICAgICAgaWYgKGN1cnJlbnRUYWIgPT09ICdjYW1wdXMnKSB7XG4gICAgICAgIHRhaUNhbXB1c0NoYXQobGFzdENhbXB1c01lc3NhZ2VJZFJlZi5jdXJyZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudFRhYiA9PT0gJ2NsYXNzJykge1xuICAgICAgICB0YWlDbGFzc0NoYXQobGFzdENsYXNzTWVzc2FnZUlkUmVmLmN1cnJlbnQpO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50VGFiID09PSAnbWUnKSB7XG4gICAgICAgIGlmIChjdXJyZW50RnJpZW5kKSB7XG4gICAgICAgICAgdGFpRG1NZXNzYWdlcyhjdXJyZW50RnJpZW5kLmFjY291bnRJZCwgbGFzdERtTWVzc2FnZUlkUmVmLmN1cnJlbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRhaUZyaWVuZHMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIDM1MDApO1xuXG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICB9LCBbaXNBY3RpdmVDYW1wdXNBY2NvdW50LCBoYXNDbGFzc0FjY2VzcywgaXNBY3RpdmUsIHRhYiwgYWN0aXZlRnJpZW5kPy5hY2NvdW50SWQsIGNsYXNzTG9wSWQsIHRhaUNhbXB1c0NoYXQsIHRhaUNsYXNzQ2hhdCwgdGFpRnJpZW5kcywgdGFpRG1NZXNzYWdlc10pO1xuXG4gIC8vIEF1dG8gc2Nyb2xsXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHRhYiA9PT0gJ2NhbXB1cycgJiYgY2FtcHVzRW5kUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNhbXB1c0VuZFJlZi5jdXJyZW50LnNjcm9sbEludG9WaWV3KHsgYmVoYXZpb3I6ICdzbW9vdGgnIH0pO1xuICAgIH1cbiAgfSwgW2NhbXB1c01lc3NhZ2VzLmxlbmd0aCwgdGFiXSk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAodGFiID09PSAnY2xhc3MnICYmIGNsYXNzRW5kUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNsYXNzRW5kUmVmLmN1cnJlbnQuc2Nyb2xsSW50b1ZpZXcoeyBiZWhhdmlvcjogJ3Ntb290aCcgfSk7XG4gICAgfVxuICB9LCBbY2xhc3NNZXNzYWdlcy5sZW5ndGgsIHRhYl0pO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHRhYiA9PT0gJ21lJyAmJiBhY3RpdmVGcmllbmQgJiYgZG1FbmRSZWYuY3VycmVudCkge1xuICAgICAgZG1FbmRSZWYuY3VycmVudC5zY3JvbGxJbnRvVmlldyh7IGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgICB9XG4gIH0sIFtkbU1lc3NhZ2VzLmxlbmd0aCwgdGFiLCBhY3RpdmVGcmllbmRdKTtcblxuICAvLyBHXHUxRUVEaSBDYW1wdXMgQ2hhdCAoUGhhc2UgNEY6IFNhZmUgQ2xlYXIgKyBJTUUgR3VhcmQpXG4gIGNvbnN0IGhhbmRsZVNlbmRDYW1wdXMgPSBhc3luYyAoZSkgPT4ge1xuICAgIGU/LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgdGV4dCA9IGNhbXB1c0lucHV0LnRyaW0oKTtcbiAgICBpZiAoIXRleHQgfHwgY2FtcHVzU2VuZGluZykgcmV0dXJuO1xuICAgIC8vIE9wdGltaXN0aWNhbGx5IGNsZWFyIGlucHV0IGltbWVkaWF0ZWx5IHNvIHVzZXIgY2FuIHR5cGUgbmV4dCBtZXNzYWdlXG4gICAgc2V0Q2FtcHVzSW5wdXQoJycpO1xuICAgIHNldENhbXB1c1NlbmRpbmcodHJ1ZSk7XG4gICAgc2V0Q2FtcHVzTm90aWNlKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvY2FtcHVzLWNoYXQnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBub2lEdW5nOiB0ZXh0IH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2sgJiYgZGF0YS5tZXNzYWdlKSB7XG4gICAgICAgIHNldENhbXB1c01lc3NhZ2VzKHByZXYgPT4ge1xuICAgICAgICAgIGNvbnN0IG5leHQgPSBbLi4ucHJldiwgZGF0YS5tZXNzYWdlXTtcbiAgICAgICAgICBsYXN0Q2FtcHVzTWVzc2FnZUlkUmVmLmN1cnJlbnQgPSBNYXRoLm1heChsYXN0Q2FtcHVzTWVzc2FnZUlkUmVmLmN1cnJlbnQsIGRhdGEubWVzc2FnZS5pZCB8fCAwKTtcbiAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgfSk7XG4gICAgICAgIG1hcmtDYW1wdXNSZWFkKGRhdGEubWVzc2FnZS5pZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRDYW1wdXNOb3RpY2UoZGF0YS5sb2kgfHwgJ0toXHUwMEY0bmcgZ1x1MUVFRGkgXHUwMTExXHUwMUIwXHUxRUUzYyB0aW4gbmhcdTFFQUZuLicpO1xuICAgICAgICAvLyBSZXN0b3JlIE9OTFkgaWYgdXNlciBoYXNuJ3Qgc3RhcnRlZCB0eXBpbmcgYSBuZXcgbWVzc2FnZVxuICAgICAgICBzZXRDYW1wdXNJbnB1dChjdXIgPT4gY3VyID8gY3VyIDogdGV4dCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRDYW1wdXNOb3RpY2UoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIGtoaSBnXHUxRUVEaSB0aW4gbmhcdTFFQUZuLicpO1xuICAgICAgc2V0Q2FtcHVzSW5wdXQoY3VyID0+IGN1ciA/IGN1ciA6IHRleHQpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRDYW1wdXNTZW5kaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gVGh1IGhcdTFFRDNpIHRpbiBuaFx1MUVBRm4gQ2FtcHVzXG4gIGNvbnN0IGhhbmRsZURlbGV0ZUNhbXB1cyA9IGFzeW5jIChpZCkgPT4ge1xuICAgIGlmICghY29uZmlybSgnQlx1MUVBMW4gY1x1MDBGMyBjaFx1MUVBRmMgbXVcdTFFRDFuIHRodSBoXHUxRUQzaSB0aW4gbmhcdTFFQUZuIG5cdTAwRTB5PycpKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL2NhbXB1cy1jaGF0P2lkPSR7aWR9YCwgeyBtZXRob2Q6ICdERUxFVEUnIH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZGF0YS5vaykge1xuICAgICAgICBzZXRDYW1wdXNNZXNzYWdlcyhwcmV2ID0+IHByZXYuZmlsdGVyKG0gPT4gbS5pZCAhPT0gaWQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFsZXJ0KGRhdGEubG9pIHx8ICdLaFx1MDBGNG5nIHRoXHUxRUMzIHhcdTAwRjNhIHRpbiBuaFx1MUVBRm4uJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBhbGVydCgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkga2hpIHhcdTAwRjNhIHRpbiBuaFx1MUVBRm4uJyk7XG4gICAgfVxuICB9O1xuXG4gIC8vIEdcdTFFRURpIENsYXNzIENoYXQgKFBoYXNlIDRGOiBTYWZlIENsZWFyICsgSU1FIEd1YXJkKVxuICBjb25zdCBoYW5kbGVTZW5kQ2xhc3MgPSBhc3luYyAoZSkgPT4ge1xuICAgIGU/LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgdGV4dCA9IGNsYXNzSW5wdXQudHJpbSgpO1xuICAgIGlmICghdGV4dCB8fCBjbGFzc1NlbmRpbmcpIHJldHVybjtcbiAgICBzZXRDbGFzc0lucHV0KCcnKTtcbiAgICBzZXRDbGFzc1NlbmRpbmcodHJ1ZSk7XG4gICAgc2V0Q2xhc3NOb3RpY2UoJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXlsb2FkID0geyBub2lEdW5nOiB0ZXh0IH07XG4gICAgICBpZiAoYXV0aD8udXNlcj8uaXNUZWFjaGVyICYmIGNsYXNzTG9wSWQpIHBheWxvYWQubG9wSWQgPSBjbGFzc0xvcElkO1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvY2hhdCcsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkYXRhLm9rICYmIGRhdGEudGluTmhhbikge1xuICAgICAgICBzZXRDbGFzc01lc3NhZ2VzKHByZXYgPT4ge1xuICAgICAgICAgIGNvbnN0IG5leHQgPSBbLi4ucHJldiwgZGF0YS50aW5OaGFuXTtcbiAgICAgICAgICBsYXN0Q2xhc3NNZXNzYWdlSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KGxhc3RDbGFzc01lc3NhZ2VJZFJlZi5jdXJyZW50LCBkYXRhLnRpbk5oYW4uaWQgfHwgMCk7XG4gICAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICAgIH0pO1xuICAgICAgICBtYXJrQ2xhc3NSZWFkKGNsYXNzTG9wSWQsIGRhdGEudGluTmhhbi5pZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRDbGFzc05vdGljZShkYXRhLmxvaSB8fCAnS2hcdTAwRjRuZyBnXHUxRUVEaSBcdTAxMTFcdTAxQjBcdTFFRTNjIHRpbiBuaFx1MUVBRm4uJyk7XG4gICAgICAgIHNldENsYXNzSW5wdXQoY3VyID0+IGN1ciA/IGN1ciA6IHRleHQpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0Q2xhc3NOb3RpY2UoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIGtoaSBnXHUxRUVEaSB0aW4gbmhcdTFFQUZuLicpO1xuICAgICAgc2V0Q2xhc3NJbnB1dChjdXIgPT4gY3VyID8gY3VyIDogdGV4dCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldENsYXNzU2VuZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIEdcdTFFRURpIHRpbiBuaFx1MUVBRm4gcmlcdTAwRUFuZyAoRE0gLSBQaGFzZSA0RjogU2FmZSBDbGVhciArIElNRSBHdWFyZClcbiAgY29uc3QgaGFuZGxlU2VuZERtID0gYXN5bmMgKGUpID0+IHtcbiAgICBlPy5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IHRleHQgPSBkbUlucHV0LnRyaW0oKTtcbiAgICBpZiAoIXRleHQgfHwgIWFjdGl2ZUZyaWVuZCB8fCBkbVNlbmRpbmcpIHJldHVybjtcbiAgICBzZXREbUlucHV0KCcnKTtcbiAgICBzZXREbVNlbmRpbmcodHJ1ZSk7XG4gICAgc2V0RG1Ob3RpY2UoJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9jYW1wdXMtZG0nLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyByZWNlaXZlckFjY291bnRJZDogYWN0aXZlRnJpZW5kLmFjY291bnRJZCwgbm9pRHVuZzogdGV4dCB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkYXRhLm9rICYmIGRhdGEubWVzc2FnZSkge1xuICAgICAgICBzZXREbU1lc3NhZ2VzKHByZXYgPT4ge1xuICAgICAgICAgIGNvbnN0IG5leHQgPSBbLi4ucHJldiwgZGF0YS5tZXNzYWdlXTtcbiAgICAgICAgICBsYXN0RG1NZXNzYWdlSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KGxhc3REbU1lc3NhZ2VJZFJlZi5jdXJyZW50LCBkYXRhLm1lc3NhZ2UuaWQgfHwgMCk7XG4gICAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICAgIH0pO1xuICAgICAgICBtYXJrRG1SZWFkKGFjdGl2ZUZyaWVuZC5hY2NvdW50SWQsIGRhdGEubWVzc2FnZS5pZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXREbU5vdGljZShkYXRhLmxvaSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyBnXHUxRUVEaSB0aW4gbmhcdTFFQUZuLicpO1xuICAgICAgICBzZXREbUlucHV0KGN1ciA9PiBjdXIgPyBjdXIgOiB0ZXh0KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldERtTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBraGkgZ1x1MUVFRGkgdGluIG5oXHUxRUFGbiByaVx1MDBFQW5nLicpO1xuICAgICAgc2V0RG1JbnB1dChjdXIgPT4gY3VyID8gY3VyIDogdGV4dCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldERtU2VuZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIFRcdTAwRUNtIGJcdTFFQTFuIGJcdTAwRTggKFRcdTFFRDFpIHRoaVx1MUVDM3UgNCBrXHUwMEZEIHRcdTFFRjEgdFx1MDBFQW4gXHUwMTExXHUwMTAzbmcgbmhcdTFFQURwIFx1MDExMVx1MUVDMyBiXHUxRUEzbyBtXHUxRUFEdCBkYW5oIGJcdTFFQTEpXG4gIGNvbnN0IGhhbmRsZVNlYXJjaEZyaWVuZHMgPSBhc3luYyAodmFsKSA9PiB7XG4gICAgc2V0U2VhcmNoUXVlcnkodmFsKTtcbiAgICBjb25zdCB0cmltbWVkID0gdmFsLnRyaW0oKTtcbiAgICBpZiAodHJpbW1lZC5sZW5ndGggPCA0KSB7XG4gICAgICBzZXRTZWFyY2hSZXN1bHRzKFtdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2V0U2VhcmNoTG9hZGluZyh0cnVlKTtcbiAgICBzZXRBY3Rpb25GZWVkYmFjaygnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL2NhbXB1cy1mcmllbmRzJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYWN0aW9uOiAnc2VhcmNoJywgcXVlcnk6IHRyaW1tZWQgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZGF0YS5vaykge1xuICAgICAgICBzZXRTZWFyY2hSZXN1bHRzKGRhdGEubGlzdCB8fCBbXSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fSBmaW5hbGx5IHtcbiAgICAgIHNldFNlYXJjaExvYWRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyBHXHUxRUVEaSBsXHUxRUREaSBtXHUxRUREaSBrXHUxRUJGdCBiXHUxRUExblxuICBjb25zdCBoYW5kbGVSZXF1ZXN0RnJpZW5kID0gYXN5bmMgKHRhcmdldElkKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL2NhbXB1cy1mcmllbmRzJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYWN0aW9uOiAncmVxdWVzdCcsIHRhcmdldEFjY291bnRJZDogdGFyZ2V0SWQgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZGF0YS5vaykge1xuICAgICAgICBzZXRBY3Rpb25GZWVkYmFjaygnXHUwMTEwXHUwMEUzIGdcdTFFRURpIGxcdTFFRERpIG1cdTFFRERpIGtcdTFFQkZ0IGJcdTFFQTFuLicpO1xuICAgICAgICBzZXRTZWFyY2hSZXN1bHRzKHByZXYgPT4gcHJldi5tYXAodSA9PiB1LmlkID09PSB0YXJnZXRJZCA/IHsgLi4udSwgZnJpZW5kc2hpcFN0YXR1czogJ3NlbnRfcGVuZGluZycgfSA6IHUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFsZXJ0KGRhdGEubG9pIHx8ICdLaFx1MDBGNG5nIHRoXHUxRUMzIGdcdTFFRURpIGxcdTFFRERpIG1cdTFFRERpLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgYWxlcnQoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIGtoaSBnXHUxRUVEaSBsXHUxRUREaSBtXHUxRUREaSBrXHUxRUJGdCBiXHUxRUExbi4nKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gQ2hcdTFFQTVwIG5oXHUxRUFEbiBrXHUxRUJGdCBiXHUxRUExblxuICBjb25zdCBoYW5kbGVBY2NlcHRGcmllbmQgPSBhc3luYyAocmVxSWQsIGZyb21BY2NJZCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9jYW1wdXMtZnJpZW5kcycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGFjdGlvbjogJ2FjY2VwdCcsIHJlcXVlc3RJZDogcmVxSWQsIHJlcXVlc3RlckFjY291bnRJZDogZnJvbUFjY0lkIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2spIHtcbiAgICAgICAgdGFpRnJpZW5kcygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWxlcnQoZGF0YS5sb2kgfHwgJ0xcdTFFRDdpIGtoaSBjaFx1MUVBNXAgbmhcdTFFQURuLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICAvLyBUXHUxRUVCIGNoXHUxRUQxaSBrXHUxRUJGdCBiXHUxRUExblxuICBjb25zdCBoYW5kbGVEZWNsaW5lRnJpZW5kID0gYXN5bmMgKHJlcUlkLCBmcm9tQWNjSWQpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvY2FtcHVzLWZyaWVuZHMnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhY3Rpb246ICdkZWNsaW5lJywgcmVxdWVzdElkOiByZXFJZCwgcmVxdWVzdGVyQWNjb3VudElkOiBmcm9tQWNjSWQgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZGF0YS5vaykge1xuICAgICAgICB0YWlGcmllbmRzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbGVydChkYXRhLmxvaSB8fCAnTFx1MUVEN2kga2hpIHRcdTFFRUIgY2hcdTFFRDFpLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICAvLyBIXHUxRUU3eSBrXHUxRUJGdCBiXHUxRUExblxuICBjb25zdCBoYW5kbGVVbmZyaWVuZCA9IGFzeW5jIChmcmllbmRJZCkgPT4ge1xuICAgIGlmICghY29uZmlybSgnQlx1MUVBMW4gY1x1MDBGMyBtdVx1MUVEMW4gaFx1MUVFN3kga1x1MUVCRnQgYlx1MUVBMW4gdlx1MUVEQmkgbmdcdTAxQjBcdTFFRERpIG5cdTAwRTB5PycpKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL2NhbXB1cy1mcmllbmRzJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYWN0aW9uOiAndW5mcmllbmQnLCBmcmllbmRBY2NvdW50SWQ6IGZyaWVuZElkIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2spIHtcbiAgICAgICAgc2V0QWN0aXZlRnJpZW5kKG51bGwpO1xuICAgICAgICB0YWlGcmllbmRzKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIC8vIENoXHUxRUI3biBuZ1x1MDFCMFx1MUVERGkgZFx1MDBGOW5nXG4gIGNvbnN0IGhhbmRsZUJsb2NrID0gYXN5bmMgKHRhcmdldElkKSA9PiB7XG4gICAgaWYgKCFjb25maXJtKCdCXHUxRUExbiBjXHUwMEYzIGNoXHUxRUFGYyBtdVx1MUVEMW4gY2hcdTFFQjduIG5nXHUwMUIwXHUxRUREaSBuXHUwMEUweT8gQ1x1MUVBMyBoYWkgYlx1MDBFQW4gc1x1MUVCRCBraFx1MDBGNG5nIHRoXHUxRUMzIG5oXHUxRUFGbiB0aW4gaG9cdTFFQjdjIGdcdTFFRURpIGxcdTFFRERpIG1cdTFFRERpIGtcdTFFQkZ0IGJcdTFFQTFuLicpKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL2NhbXB1cy1mcmllbmRzJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYWN0aW9uOiAnYmxvY2snLCB0YXJnZXRBY2NvdW50SWQ6IHRhcmdldElkIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2spIHtcbiAgICAgICAgc2V0QWN0aXZlRnJpZW5kKG51bGwpO1xuICAgICAgICB0YWlGcmllbmRzKCk7XG4gICAgICAgIGFsZXJ0KCdcdTAxMTBcdTAwRTMgY2hcdTFFQjduIG5nXHUwMUIwXHUxRUREaSBkXHUwMEY5bmcuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIC8vIEdcdTFFRURpIGJcdTAwRTFvIGNcdTAwRTFvIHZpIHBoXHUxRUExbVxuICBjb25zdCBoYW5kbGVTdWJtaXRSZXBvcnQgPSBhc3luYyAoZSkgPT4ge1xuICAgIGU/LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKCFyZXBvcnRSZWFzb24udHJpbSgpIHx8ICFyZXBvcnRNb2RhbD8udGFyZ2V0SWQgfHwgcmVwb3J0aW5nKSByZXR1cm47XG4gICAgc2V0UmVwb3J0aW5nKHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgICBhY3Rpb246ICdyZXBvcnQnLFxuICAgICAgICB0YXJnZXRBY2NvdW50SWQ6IHJlcG9ydE1vZGFsLnRhcmdldElkLFxuICAgICAgICByZWFzb246IHJlcG9ydFJlYXNvbi50cmltKClcbiAgICAgIH07XG4gICAgICBpZiAocmVwb3J0TW9kYWwubWVzc2FnZUlkKSB7XG4gICAgICAgIHBheWxvYWQubWVzc2FnZUlkID0gcmVwb3J0TW9kYWwubWVzc2FnZUlkO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvY2FtcHVzLWRtJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEub2spIHtcbiAgICAgICAgYWxlcnQoJ1x1MDExMFx1MDBFMyBnXHUxRUVEaSBiXHUwMEUxbyBjXHUwMEUxbyBjaG8gZ2lcdTAwRTFvIHZpXHUwMEVBbiB4ZW0geFx1MDBFOXQuJyk7XG4gICAgICAgIHNldFJlcG9ydE1vZGFsKG51bGwpO1xuICAgICAgICBzZXRSZXBvcnRSZWFzb24oJycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWxlcnQoZGF0YS5sb2kgfHwgJ0xcdTFFRDdpIGtoaSBnXHUxRUVEaSBiXHUwMEUxbyBjXHUwMEUxby4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIGFsZXJ0KCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBraGkgZ1x1MUVFRGkgYlx1MDBFMW8gY1x1MDBFMW8uJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFJlcG9ydGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBpZD1cImNhbXB1cy1jaGF0LXJhaWxcIiBjbGFzc05hbWU9e2BiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBzaGFkb3cteGwgZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gaC1bNTYwcHhdICR7Y2xhc3NOYW1lfWB9PlxuICAgICAgey8qIFJhaWwgSGVhZGVyIFx1MjAxNCBFWEFDVExZIDMgVEFCUzogQ2FtcHVzIHwgTFx1MUVEQnAgfCBUXHUwMEY0aSAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMyBweS0yIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYmctWyMxMTE2MjBdLzYwIHNocmluay0wXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBiZy1bIzBCMEUxNF0gcC0xIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB3LWZ1bGxcIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGlkPVwiY2hhdC10YWItY2FtcHVzXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgc2V0VGFiKCdjYW1wdXMnKTtcbiAgICAgICAgICAgICAgc2V0QWN0aXZlRnJpZW5kKG51bGwpO1xuICAgICAgICAgICAgICBtYXJrQ2FtcHVzUmVhZChsYXN0Q2FtcHVzTWVzc2FnZUlkUmVmLmN1cnJlbnQpO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXgtMSBweS0xLjUgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCB0ZXh0LWNlbnRlciBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMSAke3RhYiA9PT0gJ2NhbXB1cycgPyAnYmctWyMwMEYyRkVdIHRleHQtYmxhY2sgc2hhZG93LXNtJyA6ICd0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgIDxzcGFuPkNhbXB1czwvc3Bhbj5cbiAgICAgICAgICAgIHt1bnJlYWRDYW1wdXMgPiAwICYmIChcbiAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJiYWRnZS11bnJlYWQtY2FtcHVzXCIgY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuMiByb3VuZGVkLWZ1bGwgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLXJvc2UtNTAwIHRleHQtd2hpdGUgYW5pbWF0ZS1wdWxzZVwiPlxuICAgICAgICAgICAgICAgIHtmb3JtYXRCYWRnZSh1bnJlYWRDYW1wdXMpfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAge2hhc0NsYXNzQWNjZXNzICYmIChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGlkPVwiY2hhdC10YWItY2xhc3NcIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0VGFiKCdjbGFzcycpO1xuICAgICAgICAgICAgICAgIHNldEFjdGl2ZUZyaWVuZChudWxsKTtcbiAgICAgICAgICAgICAgICBtYXJrQ2xhc3NSZWFkKGNsYXNzTG9wSWQsIGxhc3RDbGFzc01lc3NhZ2VJZFJlZi5jdXJyZW50KTtcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleC0xIHB5LTEuNSByb3VuZGVkLWxnIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIHRleHQtY2VudGVyIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xICR7dGFiID09PSAnY2xhc3MnID8gJ2JnLVsjMDBGMkZFXSB0ZXh0LWJsYWNrIHNoYWRvdy1zbScgOiAndGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSd9YH0+XG4gICAgICAgICAgICAgIDxzcGFuPkxcdTFFREJwPC9zcGFuPlxuICAgICAgICAgICAgICB7dW5yZWFkQ2xhc3MgPiAwICYmIChcbiAgICAgICAgICAgICAgICA8c3BhbiBpZD1cImJhZGdlLXVucmVhZC1jbGFzc1wiIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZC1mdWxsIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy1jeWFuLTQwMCB0ZXh0LWJsYWNrXCI+XG4gICAgICAgICAgICAgICAgICB7Zm9ybWF0QmFkZ2UodW5yZWFkQ2xhc3MpfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICl9XG5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGlkPVwiY2hhdC10YWItbWVcIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRUYWIoJ21lJyk7IHRhaUZyaWVuZHMoKTsgfX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXgtMSBweS0xLjUgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCB0ZXh0LWNlbnRlciBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMSByZWxhdGl2ZSAke3RhYiA9PT0gJ21lJyA/ICdiZy1bIzAwRjJGRV0gdGV4dC1ibGFjayBzaGFkb3ctc20nIDogJ3RleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgPHNwYW4+VFx1MDBGNGk8L3NwYW4+XG4gICAgICAgICAgICB7KHRvdGFsRG1zICsgcGVuZGluZ0luY29taW5nLmxlbmd0aCArIHBlbmRpbmdGcmllbmRSZXF1ZXN0c0NvdW50KSA+IDAgJiYgKFxuICAgICAgICAgICAgICA8c3BhbiBpZD1cImJhZGdlLXVucmVhZC1tZVwiIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZC1mdWxsIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy1hbWJlci00MDAgdGV4dC1ibGFja1wiPlxuICAgICAgICAgICAgICAgIHtmb3JtYXRCYWRnZSh0b3RhbERtcyArIE1hdGgubWF4KHBlbmRpbmdJbmNvbWluZy5sZW5ndGgsIHBlbmRpbmdGcmllbmRSZXF1ZXN0c0NvdW50KSl9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBHdWVzdCBTdGF0ZSAqL31cbiAgICAgIHthdXRoPy5pc0d1ZXN0ID8gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBwLTUgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1jZW50ZXIgZ2FwLTMgYmctd2hpdGUvWzAuMDFdXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC0zeGxcIj5cdUQ4M0RcdUREMTA8L3NwYW4+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDBcIj5cdTAxMTBcdTAxMDNuZyBuaFx1MUVBRHAgXHUwMTExXHUxRUMzIHRoYW0gZ2lhIENoYXQ8L3A+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDBcIj5Uclx1MDBGMiBjaHV5XHUxRUM3biBjXHUwMEY5bmcgYlx1MUVBMW4gYlx1MDBFOCB2XHUwMEUwIGdpXHUwMEUxbyB2aVx1MDBFQW4gdG9cdTAwRTBuIHRyXHUwMUIwXHUxRUREbmcuPC9wPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9e29uUmVxdWlyZUF1dGh9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJtdC0xIHB4LTQgcHktMiByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyM4QjVDRjZdIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWV4dHJhYm9sZCBzaGFkb3ctbWQgaG92ZXI6b3BhY2l0eS05NSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgIFx1MDExMFx1MDEwM25nIG5oXHUxRUFEcCBuZ2F5XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKSA6IHRhYiA9PT0gJ2NhbXB1cycgPyAoXG4gICAgICAgIC8qIFx1MjUwMFx1MjUwMFx1MjUwMCBUQUI6IENBTVBVUyBDSEFUIChUT1x1MDBDME4gVFJcdTAxQUZcdTFFRENORyBcdTIwMTQgTVx1MUVDQ0kgVFx1MDBDMEkgS0hPXHUxRUEyTiBDQU1QVVMgSE9cdTFFQTBUIFx1MDExMFx1MUVEOE5HKSBcdTI1MDBcdTI1MDBcdTI1MDAgKi9cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBtaW4taC0wXCI+XG4gICAgICAgICAgey8qIE1lc3NhZ2UgTGlzdCAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy15LWF1dG8gcC0zIHNwYWNlLXktMi41IHRleHQteHNcIj5cbiAgICAgICAgICAgIHtjYW1wdXNNZXNzYWdlcy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1mdWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtY2VudGVyIHAtNFwiPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+Q2hcdTAxQjBhIGNcdTAwRjMgdGluIG5oXHUxRUFGbiBuXHUwMEUwby4gSFx1MDBFM3kgZ1x1MUVFRGkgbFx1MUVERGkgY2hcdTAwRTBvIFx1MDExMVx1MUVBN3UgdGlcdTAwRUFuITwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICBjYW1wdXNNZXNzYWdlcy5tYXAobXNnID0+IChcbiAgICAgICAgICAgICAgICA8ZGl2IGtleT17bXNnLmlkfSBjbGFzc05hbWU9e2Bncm91cCBmbGV4IGZsZXgtY29sICR7bXNnLmlzTWUgPyAnaXRlbXMtZW5kJyA6ICdpdGVtcy1zdGFydCd9YH0+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgbWItMC41IHB4LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwXCI+e21zZy5zZW5kZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAge21zZy5yb2xlID09PSAndGVhY2hlcicgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMSBweS0wLjIgcm91bmRlZCB0ZXh0LVs4cHhdIGZvbnQtYmxhY2sgYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwXCI+R1ZDTjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgKSA6IG1zZy5jbGFzc0JhZGdlID8gKFxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEgcHktMC4yIHJvdW5kZWQgdGV4dC1bOHB4XSBmb250LWJvbGQgYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzIwXCI+XHUyNzEzIHttc2cuY2xhc3NCYWRnZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAge25ldyBEYXRlKG1zZy5jcmVhdGVkQXQpLnRvTG9jYWxlVGltZVN0cmluZyhbXSwgeyBob3VyOiAnMi1kaWdpdCcsIG1pbnV0ZTogJzItZGlnaXQnIH0pfVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIHsobXNnLmlzTWUgfHwgYXV0aD8udXNlcj8uaXNWZXJpZmllZFRlYWNoZXIpICYmIChcbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBoYW5kbGVEZWxldGVDYW1wdXMobXNnLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wYWNpdHktMCBncm91cC1ob3ZlcjpvcGFjaXR5LTEwMCB0ZXh0LVsxMHB4XSB0ZXh0LXJvc2UtNDAwIGhvdmVyOnRleHQtcm9zZS0zMDAgdHJhbnNpdGlvbi1vcGFjaXR5IG1sLTFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJUaHUgaFx1MUVEM2kgdGluIG5oXHUxRUFGblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEuNSByb3VuZGVkLXhsIG1heC13LVs4NSVdIGJyZWFrLXdvcmRzIHRleHQteHMgbGVhZGluZy1yZWxheGVkICR7bXNnLmlzTWUgPyAnYmctWyMwMEYyRkVdLzE1IHRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMzAgcm91bmRlZC10ci1ub25lJyA6ICdiZy1bIzBCMEUxNF0gdGV4dC1zbGF0ZS0yMDAgYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQtdGwtbm9uZSd9YH0+XG4gICAgICAgICAgICAgICAgICAgIHttc2cuY29udGVudH1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxkaXYgcmVmPXtjYW1wdXNFbmRSZWZ9IC8+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7LyogUmF0ZSBsaW1pdCBub3RpY2UgKi99XG4gICAgICAgICAge2NhbXB1c05vdGljZSAmJiAoXG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJweC0zIHB5LTEgdGV4dC1bMTBweF0gdGV4dC1hbWJlci00MDAgYmctYW1iZXItNTAwLzEwIGJvcmRlci10IGJvcmRlci1hbWJlci01MDAvMjBcIj57Y2FtcHVzTm90aWNlfTwvcD5cbiAgICAgICAgICApfVxuXG4gICAgICAgICAgey8qIENvbXBvc2VyICovfVxuICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVTZW5kQ2FtcHVzfSBjbGFzc05hbWU9XCJwLTIgYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzEwIGJnLVsjMTExNjIwXS84MCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBzaHJpbmstMCByZWxhdGl2ZVwiPlxuICAgICAgICAgICAge3Nob3dFbW9qaVBpY2tlciA9PT0gJ2NhbXB1cycgJiYgKFxuICAgICAgICAgICAgICA8RW1vamlQaWNrZXJQb3B1cFxuICAgICAgICAgICAgICAgIG9uU2VsZWN0PXsoZW1vamkpID0+IGhhbmRsZUluc2VydEVtb2ppKGVtb2ppLCAnY2FtcHVzJyl9XG4gICAgICAgICAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd0Vtb2ppUGlja2VyKG51bGwpfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNob3dFbW9qaVBpY2tlcihzaG93RW1vamlQaWNrZXIgPT09ICdjYW1wdXMnID8gbnVsbCA6ICdjYW1wdXMnKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0yIHJvdW5kZWQteGwgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC15ZWxsb3ctMzAwIGhvdmVyOmJnLXdoaXRlLzUgdGV4dC1iYXNlIHRyYW5zaXRpb24tY29sb3JzIHNocmluay0wXCJcbiAgICAgICAgICAgICAgdGl0bGU9XCJUaFx1MDBFQW0gYmlcdTFFQzN1IHRcdTAxQjBcdTFFRTNuZyBjXHUxRUEzbSB4XHUwMEZBY1wiPlxuICAgICAgICAgICAgICBcdUQ4M0RcdURFMEFcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgIGlkPVwiaW5wdXQtY2FtcHVzLWNoYXRcIlxuICAgICAgICAgICAgICByb3dzPXsxfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIk5oXHUxRUFGbiB0aW4gdG9cdTAwRTBuIENhbXB1cy4uLlwiXG4gICAgICAgICAgICAgIHZhbHVlPXtjYW1wdXNJbnB1dH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Q2FtcHVzSW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ9eygpID0+IHsgaXNDYW1wdXNDb21wb3NpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ9eygpID0+IHsgaXNDYW1wdXNDb21wb3NpbmdSZWYuY3VycmVudCA9IGZhbHNlOyB9fVxuICAgICAgICAgICAgICBvbktleURvd249e2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiAhZS5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgICAgaWYgKGUubmF0aXZlRXZlbnQ/LmlzQ29tcG9zaW5nIHx8IGlzQ2FtcHVzQ29tcG9zaW5nUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIGhhbmRsZVNlbmRDYW1wdXMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIG1heExlbmd0aD17NTAwfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBweC0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS82MCByZXNpemUtbm9uZSBtaW4taC1bMzhweF0gbWF4LWgtMjRcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgIGlkPVwiYnRuLXNlbmQtY2FtcHVzLWNoYXRcIlxuICAgICAgICAgICAgICBkaXNhYmxlZD17IWNhbXB1c0lucHV0LnRyaW0oKSB8fCBjYW1wdXNTZW5kaW5nfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTIgcm91bmRlZC14bCBiZy1bIzAwRjJGRV0gaG92ZXI6YmctWyMwMGUxZWNdIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktMzAgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIHNocmluay0wXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgR1x1MUVFRGlcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogdGFiID09PSAnY2xhc3MnID8gKFxuICAgICAgICAvKiBcdTI1MDBcdTI1MDBcdTI1MDAgVEFCOiBMXHUxRURBUCAoQ0hBVCBOXHUxRUQ4SSBCXHUxRUQ4IExcdTFFREFQIFx1MjAxNCBDSFx1MUVDOCBEXHUwMEMwTkggQ0hPIFRIXHUwMEMwTkggVklcdTAwQ0FOIFx1MDExMFx1MDBDMyBYXHUwMEMxQyBNSU5IKSBcdTI1MDBcdTI1MDBcdTI1MDAgKi9cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBtaW4taC0wXCI+XG4gICAgICAgICAgey8qIENsYXNzIEhlYWRlciBpbmZvIGJhciAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMS41IGJnLVsjMEIwRTE0XSBib3JkZXItYiBib3JkZXItd2hpdGUvNSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC14c1wiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1ib2xkIHRleHQtY3lhbi0zMDBcIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERkVCIHtjbGFzc1RlbkxvcCB8fCBhdXRoPy51c2VyPy50ZW5Mb3AgfHwgJ1BoXHUwMEYybmcgY2hhdCBsXHUxRURCcCd9XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICB7YXV0aD8udXNlcj8uaXNUZWFjaGVyICYmIHRlYWNoZXJDbGFzc2VzLmxlbmd0aCA+IDEgJiYgKFxuICAgICAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICAgICAgdmFsdWU9e2NsYXNzTG9wSWR9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgaWQgPSBOdW1iZXIoZS50YXJnZXQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgc2V0Q2xhc3NMb3BJZChpZCk7XG4gICAgICAgICAgICAgICAgICBsYXN0Q2xhc3NNZXNzYWdlSWRSZWYuY3VycmVudCA9IDA7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xNSB0ZXh0LXdoaXRlIHRleHQtWzEwcHhdIGZvbnQtYm9sZCByb3VuZGVkLWxnIHB4LTIgcHktMSBmb2N1czpvdXRsaW5lLW5vbmVcIj5cbiAgICAgICAgICAgICAgICB7dGVhY2hlckNsYXNzZXMubWFwKGMgPT4gKFxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiBrZXk9e2MuaWR9IHZhbHVlPXtjLmlkfT57Yy50ZW59PC9vcHRpb24+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiBDbGFzcyBNZXNzYWdlIExpc3QgKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHAtMyBzcGFjZS15LTIuNSB0ZXh0LXhzXCI+XG4gICAgICAgICAgICB7Y2xhc3NNZXNzYWdlcy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1mdWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtY2VudGVyIHAtNFwiPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+Q2hcdTAxQjBhIGNcdTAwRjMgdGluIG5oXHUxRUFGbiBsXHUxRURCcC4gSFx1MDBFM3kgZ1x1MUVFRGkgbFx1MUVERGkgY2hcdTAwRTBvIFx1MDExMVx1MUVBN3UgdGlcdTAwRUFuITwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICBjbGFzc01lc3NhZ2VzLm1hcChtc2cgPT4gKFxuICAgICAgICAgICAgICAgIDxkaXYga2V5PXttc2cuaWR9IGNsYXNzTmFtZT17YGdyb3VwIGZsZXggZmxleC1jb2wgJHttc2cubGFUaW5DdWFUb2kgPyAnaXRlbXMtZW5kJyA6ICdpdGVtcy1zdGFydCd9YH0+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgbWItMC41IHB4LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwXCI+e21zZy50ZW5OZ3VvaUd1aX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIHttc2cudmFpVHJvID09PSAnZ2lhb192aWVuJyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMSBweS0wLjIgcm91bmRlZCB0ZXh0LVs4cHhdIGZvbnQtYmxhY2sgYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwXCI+R1ZDTjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHttc2cudGFvTHVjID8gbmV3IERhdGUobXNnLnRhb0x1Yy5yZXBsYWNlKCcgJywgJ1QnKSArICdaJykudG9Mb2NhbGVUaW1lU3RyaW5nKFtdLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSkgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YHB4LTIuNSBweS0xLjUgcm91bmRlZC14bCBtYXgtdy1bODUlXSBicmVhay13b3JkcyB0ZXh0LXhzIGxlYWRpbmctcmVsYXhlZCAke21zZy5sYVRpbkN1YVRvaSA/ICdiZy1jeWFuLTUwMC8yMCB0ZXh0LWN5YW4tMTAwIGJvcmRlciBib3JkZXItY3lhbi01MDAvNDAgcm91bmRlZC10ci1ub25lJyA6ICdiZy1bIzBCMEUxNF0gdGV4dC1zbGF0ZS0yMDAgYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQtdGwtbm9uZSd9YH0+XG4gICAgICAgICAgICAgICAgICAgIHttc2cubm9pRHVuZ31cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxkaXYgcmVmPXtjbGFzc0VuZFJlZn0gLz5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiBSYXRlIGxpbWl0IG5vdGljZSAqL31cbiAgICAgICAgICB7Y2xhc3NOb3RpY2UgJiYgKFxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwicHgtMyBweS0xIHRleHQtWzEwcHhdIHRleHQtYW1iZXItNDAwIGJnLWFtYmVyLTUwMC8xMCBib3JkZXItdCBib3JkZXItYW1iZXItNTAwLzIwXCI+e2NsYXNzTm90aWNlfTwvcD5cbiAgICAgICAgICApfVxuXG4gICAgICAgICAgey8qIENvbXBvc2VyICovfVxuICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVTZW5kQ2xhc3N9IGNsYXNzTmFtZT1cInAtMiBib3JkZXItdCBib3JkZXItd2hpdGUvMTAgYmctWyMxMTE2MjBdLzgwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHNocmluay0wIHJlbGF0aXZlXCI+XG4gICAgICAgICAgICB7c2hvd0Vtb2ppUGlja2VyID09PSAnY2xhc3MnICYmIChcbiAgICAgICAgICAgICAgPEVtb2ppUGlja2VyUG9wdXBcbiAgICAgICAgICAgICAgICBvblNlbGVjdD17KGVtb2ppKSA9PiBoYW5kbGVJbnNlcnRFbW9qaShlbW9qaSwgJ2NsYXNzJyl9XG4gICAgICAgICAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd0Vtb2ppUGlja2VyKG51bGwpfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNob3dFbW9qaVBpY2tlcihzaG93RW1vamlQaWNrZXIgPT09ICdjbGFzcycgPyBudWxsIDogJ2NsYXNzJyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiByb3VuZGVkLXhsIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQteWVsbG93LTMwMCBob3ZlcjpiZy13aGl0ZS81IHRleHQtYmFzZSB0cmFuc2l0aW9uLWNvbG9ycyBzaHJpbmstMFwiXG4gICAgICAgICAgICAgIHRpdGxlPVwiVGhcdTAwRUFtIGJpXHUxRUMzdSB0XHUwMUIwXHUxRUUzbmcgY1x1MUVBM20geFx1MDBGQWNcIj5cbiAgICAgICAgICAgICAgXHVEODNEXHVERTBBXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgICBpZD1cImlucHV0LWNsYXNzLWNoYXRcIlxuICAgICAgICAgICAgICByb3dzPXsxfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIk5oXHUxRUFGbiB0aW4gdlx1MUVEQmkgbFx1MUVEQnAuLi5cIlxuICAgICAgICAgICAgICB2YWx1ZT17Y2xhc3NJbnB1dH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Q2xhc3NJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25TdGFydD17KCkgPT4geyBpc0NsYXNzQ29tcG9zaW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPXsoKSA9PiB7IGlzQ2xhc3NDb21wb3NpbmdSZWYuY3VycmVudCA9IGZhbHNlOyB9fVxuICAgICAgICAgICAgICBvbktleURvd249e2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiAhZS5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgICAgaWYgKGUubmF0aXZlRXZlbnQ/LmlzQ29tcG9zaW5nIHx8IGlzQ2xhc3NDb21wb3NpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgaGFuZGxlU2VuZENsYXNzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICBtYXhMZW5ndGg9ezMwMH1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcHgtMyBweS0yIHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1jeWFuLTQwMC82MCByZXNpemUtbm9uZSBtaW4taC1bMzhweF0gbWF4LWgtMjRcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgIGlkPVwiYnRuLXNlbmQtY2xhc3MtY2hhdFwiXG4gICAgICAgICAgICAgIGRpc2FibGVkPXshY2xhc3NJbnB1dC50cmltKCkgfHwgY2xhc3NTZW5kaW5nfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTIgcm91bmRlZC14bCBiZy1jeWFuLTQwMCBob3ZlcjpiZy1jeWFuLTMwMCB0ZXh0LWJsYWNrIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTMwIGRpc2FibGVkOmN1cnNvci1ub3QtYWxsb3dlZCBzaHJpbmstMFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIEdcdTFFRURpXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKSA6IChcbiAgICAgICAgLyogXHUyNTAwXHUyNTAwXHUyNTAwIFRBQjogVFx1MDBENEkgKEJcdTFFQTBOIEJcdTAwQzggJiBUSU4gTkhcdTFFQUVOIFJJXHUwMENBTkcgMS0xKSBcdTI1MDBcdTI1MDBcdTI1MDAgKi9cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBtaW4taC0wXCI+XG4gICAgICAgICAgeyFhY3RpdmVGcmllbmQgPyAoXG4gICAgICAgICAgICAvKiBGUklFTkQgTElTVCBWSUVXICovXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgey8qIEZyaWVuZHMgVG9wIEJhciAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTIuNSBib3JkZXItYiBib3JkZXItd2hpdGUvNSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYmctWyMxMTE2MjBdLzQwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDBcIj5CXHUxRUExbiBiXHUwMEU4ICh7ZnJpZW5kcy5sZW5ndGh9KTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93QWRkRnJpZW5kKHRydWUpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy13aGl0ZS81IGhvdmVyOmJnLVsjMDBGMkZFXS8xNSBob3Zlcjp0ZXh0LVsjMDBGMkZFXSB0ZXh0LXNsYXRlLTMwMCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMVwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+Kzwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPktcdTFFQkZ0IGJcdTFFQTFuPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogUGVuZGluZyBSZXF1ZXN0cyBTZWN0aW9uICovfVxuICAgICAgICAgICAgICB7cGVuZGluZ0luY29taW5nLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC0yIGJvcmRlci1iIGJvcmRlci13aGl0ZS81IGJnLXB1cnBsZS05NTAvMjBcIj5cbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXB1cnBsZS0zMDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIG1iLTEuNSBweC0xXCI+TFx1MUVERGkgbVx1MUVERGkga1x1MUVCRnQgYlx1MUVBMW4gKHtwZW5kaW5nSW5jb21pbmcubGVuZ3RofSk8L3A+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMS41XCI+XG4gICAgICAgICAgICAgICAgICAgIHtwZW5kaW5nSW5jb21pbmcubWFwKHJlcSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3JlcS5yZXF1ZXN0SWR9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwLTEuNSByb3VuZGVkLWxnIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgdGV4dC14c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4tdy0wIHByLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtd2hpdGUgdHJ1bmNhdGUgdGV4dC1bMTFweF1cIj57cmVxLmRpc3BsYXlOYW1lfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTQwMFwiPkB7cmVxLnVzZXJuYW1lfSB7cmVxLmNsYXNzQmFkZ2UgPyBgXHUyMDIyICR7cmVxLmNsYXNzQmFkZ2V9YCA6ICcnfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBoYW5kbGVBY2NlcHRGcmllbmQocmVxLnJlcXVlc3RJZCwgcmVxLmZyb21BY2NvdW50SWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIgcHktMC41IHJvdW5kZWQgYmctZW1lcmFsZC01MDAvMjAgdGV4dC1lbWVyYWxkLTMwMCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTAxMTBcdTFFRDNuZyBcdTAwRkRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IGhhbmRsZURlY2xpbmVGcmllbmQocmVxLnJlcXVlc3RJZCwgcmVxLmZyb21BY2NvdW50SWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCBiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgdGV4dC1bMTBweF1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICB7LyogRnJpZW5kcyBMaXN0ICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy15LWF1dG8gcC0yIHNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICAgIHtmcmllbmRzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1mdWxsIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtY2VudGVyIHAtNFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBtYi0xXCI+XHVEODNEXHVEQzY1PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwXCI+Q2hcdTAxQjBhIGNcdTAwRjMgYlx1MUVBMW4gYlx1MDBFOCBuXHUwMEUwby48L3A+XG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwIG10LTFcIj5CXHUxRUE1bSBcIisgS1x1MUVCRnQgYlx1MUVBMW5cIiBcdTAxMTFcdTFFQzMgdFx1MDBFQ20gdlx1MDBFMCBrXHUxRUJGdCBuXHUxRUQxaSBjXHUwMEY5bmcgYlx1MUVBMW4gYlx1MDBFOCB0clx1MDFCMFx1MUVERG5nLjwvcD5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICBmcmllbmRzLm1hcChmID0+IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBrZXk9e2YuZnJpZW5kc2hpcElkfSB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldEFjdGl2ZUZyaWVuZChmKTsgbWFya0RtUmVhZChmLmFjY291bnRJZCk7IHRhaURtTWVzc2FnZXMoZi5hY2NvdW50SWQpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcC0yIHJvdW5kZWQteGwgYmctWyMwQjBFMTRdLzYwIGhvdmVyOmJnLVsjMDBGMkZFXS8xMCBib3JkZXIgYm9yZGVyLXdoaXRlLzUgaG92ZXI6Ym9yZGVyLVsjMDBGMkZFXS8zMCB0cmFuc2l0aW9uLWFsbCB0ZXh0LWxlZnQgZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy03IGgtNyByb3VuZGVkLWxnIGJnLWdyYWRpZW50LXRvLXRyIGZyb20tWyMwMEYyRkVdLzMwIHRvLVsjOEI1Q0Y2XS8zMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBmb250LWJvbGQgdGV4dC14cyB0ZXh0LXdoaXRlIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtmLmRpc3BsYXlOYW1lID8gZi5kaXNwbGF5TmFtZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSA6ICc/J31cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4tdy0wIGZsZXgtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIGdyb3VwLWhvdmVyOnRleHQtWyMwMEYyRkVdIHRyYW5zaXRpb24tY29sb3JzIHRydW5jYXRlXCI+e2YuZGlzcGxheU5hbWV9PC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCB0cnVuY2F0ZVwiPkB7Zi51c2VybmFtZX0ge2YuY2xhc3NCYWRnZSA/IGBcdTIwMjIgJHtmLmNsYXNzQmFkZ2V9YCA6ICcnfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtCb29sZWFuKHVucmVhZERtc1tmLmFjY291bnRJZF0pICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuMiByb3VuZGVkLWZ1bGwgYmctY3lhbi00MDAgdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQtWzlweF1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Zm9ybWF0QmFkZ2UodW5yZWFkRG1zW2YuYWNjb3VudElkXSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIGdyb3VwLWhvdmVyOnRleHQtd2hpdGUgdHJhbnNpdGlvbi1jb2xvcnNcIj5cdTIwM0E8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAvKiBQUklWQVRFIENPTlZFUlNBVElPTiBWSUVXICovXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgey8qIENvbnZvIEhlYWRlciAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zIHB5LTIgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBiZy1bIzExMTYyMF0vNjAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldEFjdGl2ZUZyaWVuZChudWxsKX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0xIHJvdW5kZWQtbGcgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LXhzIGZvbnQtYm9sZFwiIHRpdGxlPVwiUXVheSBsXHUxRUExaSBkYW5oIHNcdTAwRTFjaCBiXHUxRUExbiBiXHUwMEU4XCI+XG4gICAgICAgICAgICAgICAgICAgIFx1MjAzOVxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC13aGl0ZSB0cnVuY2F0ZVwiPnthY3RpdmVGcmllbmQuZGlzcGxheU5hbWV9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNDAwIHRydW5jYXRlXCI+QHthY3RpdmVGcmllbmQudXNlcm5hbWV9IHthY3RpdmVGcmllbmQuY2xhc3NCYWRnZSA/IGBcdTIwMjIgJHthY3RpdmVGcmllbmQuY2xhc3NCYWRnZX1gIDogJyd9PC9wPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogQ29udm8gU2FmZXR5IEFjdGlvbnMgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMVwiPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0UmVwb3J0TW9kYWwoeyB0YXJnZXRJZDogYWN0aXZlRnJpZW5kLmFjY291bnRJZCwgdGFyZ2V0TmFtZTogYWN0aXZlRnJpZW5kLmRpc3BsYXlOYW1lIH0pfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1hbWJlci0zMDAgaG92ZXI6Ymctd2hpdGUvNSB0cmFuc2l0aW9uLWFsbFwiIHRpdGxlPVwiQlx1MDBFMW8gY1x1MDBFMW8gbmdcdTAxQjBcdTFFRERpIGRcdTAwRjluZyBuXHUwMEUweVwiPlxuICAgICAgICAgICAgICAgICAgICBCXHUwMEUxbyBjXHUwMEUxb1xuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBoYW5kbGVCbG9jayhhY3RpdmVGcmllbmQuYWNjb3VudElkKX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtcm9zZS00MDAgaG92ZXI6Ymctd2hpdGUvNSB0cmFuc2l0aW9uLWFsbFwiIHRpdGxlPVwiQ2hcdTFFQjduIG5nXHUwMUIwXHUxRUREaSBuXHUwMEUweVwiPlxuICAgICAgICAgICAgICAgICAgICBDaFx1MUVCN25cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gaGFuZGxlVW5mcmllbmQoYWN0aXZlRnJpZW5kLmFjY291bnRJZCl9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXNsYXRlLTIwMCBob3ZlcjpiZy13aGl0ZS81IHRyYW5zaXRpb24tYWxsXCIgdGl0bGU9XCJIXHUxRUU3eSBrXHUxRUJGdCBiXHUxRUExblwiPlxuICAgICAgICAgICAgICAgICAgICBIXHUxRUU3eSBiXHUxRUExblxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBETSBNZXNzYWdlcyBMaXN0ICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy15LWF1dG8gcC0zIHNwYWNlLXktMiB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAge2RtTWVzc2FnZXMubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1jZW50ZXIgcC00XCI+XG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+Qlx1MUVBRnQgXHUwMTExXHUxRUE3dSB0clx1MDBGMiBjaHV5XHUxRUM3biByaVx1MDBFQW5nIHZcdTFFREJpIHthY3RpdmVGcmllbmQuZGlzcGxheU5hbWV9LjwvcD5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICBkbU1lc3NhZ2VzLm1hcChtc2cgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17bXNnLmlkfSBjbGFzc05hbWU9e2Bncm91cCBmbGV4IGZsZXgtY29sICR7bXNnLmlzTWUgPyAnaXRlbXMtZW5kJyA6ICdpdGVtcy1zdGFydCd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BweC0yLjUgcHktMS41IHJvdW5kZWQteGwgbWF4LXctWzg1JV0gYnJlYWstd29yZHMgdGV4dC14cyBsZWFkaW5nLXJlbGF4ZWQgJHttc2cuaXNNZSA/ICdiZy1bIzAwRjJGRV0vMjAgdGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCByb3VuZGVkLXRyLW5vbmUnIDogJ2JnLVsjMEIwRTE0XSB0ZXh0LXNsYXRlLTIwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtdGwtbm9uZSd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHttc2cuY29udGVudH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyFtc2cuaXNNZSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRSZXBvcnRNb2RhbCh7IHRhcmdldElkOiBhY3RpdmVGcmllbmQuYWNjb3VudElkLCB0YXJnZXROYW1lOiBhY3RpdmVGcmllbmQuZGlzcGxheU5hbWUsIG1lc3NhZ2VJZDogbXNnLmlkLCBtZXNzYWdlQ29udGVudDogbXNnLmNvbnRlbnQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtYW1iZXItMzAwIHRyYW5zaXRpb24tb3BhY2l0eSBwLTAuNVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJCXHUwMEUxbyBjXHUwMEUxbyB0aW4gbmhcdTFFQUZuIG5cdTAwRTB5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzRFx1REVBOVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOHB4XSB0ZXh0LXNsYXRlLTQwMCBtdC0wLjUgcHgtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge25ldyBEYXRlKG1zZy5jcmVhdGVkQXQpLnRvTG9jYWxlVGltZVN0cmluZyhbXSwgeyBob3VyOiAnMi1kaWdpdCcsIG1pbnV0ZTogJzItZGlnaXQnIH0pfVxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPGRpdiByZWY9e2RtRW5kUmVmfSAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogUmF0ZSBsaW1pdCBub3RpY2UgKi99XG4gICAgICAgICAgICAgIHtkbU5vdGljZSAmJiAoXG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwicHgtMyBweS0xIHRleHQtWzEwcHhdIHRleHQtYW1iZXItNDAwIGJnLWFtYmVyLTUwMC8xMCBib3JkZXItdCBib3JkZXItYW1iZXItNTAwLzIwXCI+e2RtTm90aWNlfTwvcD5cbiAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICB7LyogRE0gQ29tcG9zZXIgKi99XG4gICAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVTZW5kRG19IGNsYXNzTmFtZT1cInAtMiBib3JkZXItdCBib3JkZXItd2hpdGUvMTAgYmctWyMxMTE2MjBdLzgwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHNocmluay0wIHJlbGF0aXZlXCI+XG4gICAgICAgICAgICAgICAge3Nob3dFbW9qaVBpY2tlciA9PT0gJ2RtJyAmJiAoXG4gICAgICAgICAgICAgICAgICA8RW1vamlQaWNrZXJQb3B1cFxuICAgICAgICAgICAgICAgICAgICBvblNlbGVjdD17KGVtb2ppKSA9PiBoYW5kbGVJbnNlcnRFbW9qaShlbW9qaSwgJ2RtJyl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dFbW9qaVBpY2tlcihudWxsKX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNob3dFbW9qaVBpY2tlcihzaG93RW1vamlQaWNrZXIgPT09ICdkbScgPyBudWxsIDogJ2RtJyl9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTIgcm91bmRlZC14bCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXllbGxvdy0zMDAgaG92ZXI6Ymctd2hpdGUvNSB0ZXh0LWJhc2UgdHJhbnNpdGlvbi1jb2xvcnMgc2hyaW5rLTBcIlxuICAgICAgICAgICAgICAgICAgdGl0bGU9XCJUaFx1MDBFQW0gYmlcdTFFQzN1IHRcdTAxQjBcdTFFRTNuZyBjXHUxRUEzbSB4XHUwMEZBY1wiPlxuICAgICAgICAgICAgICAgICAgXHVEODNEXHVERTBBXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgICAgICBpZD1cImlucHV0LWRtLWNoYXRcIlxuICAgICAgICAgICAgICAgICAgcm93cz17MX1cbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtgTmhcdTFFQUZuIGNobyAke2FjdGl2ZUZyaWVuZC5kaXNwbGF5TmFtZX0uLi5gfVxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2RtSW5wdXR9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXREbUlucHV0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25TdGFydD17KCkgPT4geyBpc0RtQ29tcG9zaW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgICAgb25Db21wb3NpdGlvbkVuZD17KCkgPT4geyBpc0RtQ29tcG9zaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTsgfX1cbiAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiAhZS5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChlLm5hdGl2ZUV2ZW50Py5pc0NvbXBvc2luZyB8fCBpc0RtQ29tcG9zaW5nUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgaGFuZGxlU2VuZERtKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBtYXhMZW5ndGg9ezUwMH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHB4LTMgcHktMiB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzYwIHJlc2l6ZS1ub25lIG1pbi1oLVszOHB4XSBtYXgtaC0yNFwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXNlbmQtZG0tY2hhdFwiXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWRtSW5wdXQudHJpbSgpIHx8IGRtU2VuZGluZ31cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMiByb3VuZGVkLXhsIGJnLVsjMDBGMkZFXSBob3ZlcjpiZy1bIzAwZTFlY10gdGV4dC1ibGFjayB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS0zMCBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgc2hyaW5rLTBcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIEdcdTFFRURpXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIFx1MjUwMFx1MjUwMFx1MjUwMCBNT0RBTDogS1x1MUVCRVQgQlx1MUVBME4gKFNFQVJDSCBQT1BVUCkgXHUyNTAwXHUyNTAwXHUyNTAwICovfVxuICAgICAge3Nob3dBZGRGcmllbmQgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgei01MCBiZy1ibGFjay83NSBiYWNrZHJvcC1ibHVyLXNtIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTUgcm91bmRlZC0yeGwgbWF4LXctc20gdy1mdWxsIHAtNCBzaGFkb3ctMnhsIGZsZXggZmxleC1jb2wgZ2FwLTNcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHBiLTIgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTI3OTU8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+S1x1MUVCRnQgYlx1MUVBMW4gbVx1MUVEQmk8L3NwYW4+XG4gICAgICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHsgc2V0U2hvd0FkZEZyaWVuZChmYWxzZSk7IHNldFNlYXJjaFJlc3VsdHMoW10pOyBzZXRTZWFyY2hRdWVyeSgnJyk7IH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LXNtXCI+XHUyNzE1PC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiTmhcdTFFQURwIHRcdTAwRUFuIFx1MDExMVx1MDEwM25nIG5oXHUxRUFEcCAodFx1MUVEMWkgdGhpXHUxRUMzdSA0IGtcdTAwRkQgdFx1MUVGMSkuLi5cIlxuICAgICAgICAgICAgICAgIHZhbHVlPXtzZWFyY2hRdWVyeX1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBoYW5kbGVTZWFyY2hGcmllbmRzKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBweC0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXVwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwIG10LTFcIj5HXHUwMEY1IHRcdTFFRDFpIHRoaVx1MUVDM3UgNCBrXHUwMEZEIHRcdTFFRjEgKHRcdTAwRUFuIFx1MDExMVx1MDEwM25nIG5oXHUxRUFEcCkgXHUwMTExXHUxRUMzIHRcdTAwRUNtIGtpXHUxRUJGbSBiXHUxRUExbiBiXHUwMEU4LjwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7YWN0aW9uRmVlZGJhY2sgJiYgKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LWVtZXJhbGQtNDAwIGZvbnQtYm9sZFwiPnthY3Rpb25GZWVkYmFja308L3A+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1heC1oLTQ4IG92ZXJmbG93LXktYXV0byBzcGFjZS15LTEuNVwiPlxuICAgICAgICAgICAgICB7c2VhcmNoTG9hZGluZyA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCB0ZXh0LWNlbnRlciBweS0yXCI+XHUwMTEwYW5nIHRcdTAwRUNtIGtpXHUxRUJGbS4uLjwvcD5cbiAgICAgICAgICAgICAgKSA6IHNlYXJjaFJlc3VsdHMubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgIHNlYXJjaFF1ZXJ5LnRyaW0oKS5sZW5ndGggPj0gNCA/IChcbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIHRleHQtY2VudGVyIHB5LTJcIj5LaFx1MDBGNG5nIHRcdTAwRUNtIHRoXHUxRUE1eSB0XHUwMEUwaSBraG9cdTFFQTNuIHBoXHUwMEY5IGhcdTFFRTNwLjwvcD5cbiAgICAgICAgICAgICAgICApIDogbnVsbFxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIHNlYXJjaFJlc3VsdHMubWFwKHUgPT4gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3UuaWR9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwLTIgcm91bmRlZC14bCBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS81IHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4tdy0wIHByLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC13aGl0ZSB0cnVuY2F0ZVwiPnt1LmRpc3BsYXlOYW1lfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMFwiPkB7dS51c2VybmFtZX0ge3UuY2xhc3NCYWRnZSA/IGBcdTIwMjIgJHt1LmNsYXNzQmFkZ2V9YCA6ICcnfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIHt1LmZyaWVuZHNoaXBTdGF0dXMgPT09ICdmcmllbmRzJyA/IChcbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1lbWVyYWxkLTQwMCBzaHJpbmstMFwiPkJcdTFFQTFuIGJcdTAwRTg8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICkgOiB1LmZyaWVuZHNoaXBTdGF0dXMgPT09ICdzZW50X3BlbmRpbmcnID8gKFxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LWFtYmVyLTQwMCBzaHJpbmstMFwiPlx1MDExMFx1MDBFMyBnXHUxRUVEaSBsXHUxRUREaSBtXHUxRUREaTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgKSA6IHUuZnJpZW5kc2hpcFN0YXR1cyA9PT0gJ3JlY2VpdmVkX3BlbmRpbmcnID8gKFxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXB1cnBsZS00MDAgc2hyaW5rLTBcIj5cdTAxMTBhbmcgY2hcdTFFREQgYlx1MUVBMW4gZHV5XHUxRUM3dDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBoYW5kbGVSZXF1ZXN0RnJpZW5kKHUuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1bIzAwRjJGRV0gaG92ZXI6YmctWyMwMGUxZWNdIHRleHQtYmxhY2sgZm9udC1ib2xkIHRleHQtWzEwcHhdIHNocmluay0wIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBLXHUxRUJGdCBiXHUxRUExblxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBcdTI1MDBcdTI1MDBcdTI1MDAgTU9EQUw6IEJcdTAwQzFPIENcdTAwQzFPIEFOIFRPXHUwMEMwTiAoUkVQT1JUIFBPUFVQKSBcdTI1MDBcdTI1MDBcdTI1MDAgKi99XG4gICAgICB7cmVwb3J0TW9kYWwgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgei01MCBiZy1ibGFjay84MCBiYWNrZHJvcC1ibHVyLXNtIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNFwiPlxuICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVTdWJtaXRSZXBvcnR9IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IHJvdW5kZWQtMnhsIG1heC13LXNtIHctZnVsbCBwLTQgc2hhZG93LTJ4bCBmbGV4IGZsZXgtY29sIGdhcC0zXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwYi0yIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1hbWJlci0zMDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjZBMFx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57cmVwb3J0TW9kYWwubWVzc2FnZUlkID8gJ0JcdTAwRTFvIGNcdTAwRTFvIHRpbiBuaFx1MUVBRm4nIDogYEJcdTAwRTFvIGNcdTAwRTFvIG5nXHUwMUIwXHUxRUREaSBkXHUwMEY5bmc6ICR7cmVwb3J0TW9kYWwudGFyZ2V0TmFtZX1gfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0UmVwb3J0TW9kYWwobnVsbCl9IGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgdGV4dC1zbVwiPlx1MjcxNTwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICB7cmVwb3J0TW9kYWwubWVzc2FnZUNvbnRlbnQgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMi41IHJvdW5kZWQteGwgYmctYmxhY2svNDAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIGl0YWxpY1wiPlxuICAgICAgICAgICAgICAgIFwie3JlcG9ydE1vZGFsLm1lc3NhZ2VDb250ZW50LnNsaWNlKDAsIDEwMCl9e3JlcG9ydE1vZGFsLm1lc3NhZ2VDb250ZW50Lmxlbmd0aCA+IDEwMCA/ICcuLi4nIDogJyd9XCJcbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgQlx1MDBFMW8gY1x1MDBFMW8gc1x1MUVCRCBcdTAxMTFcdTAxQjBcdTFFRTNjIGNodXlcdTFFQzNuIHRoXHUxRUIzbmcgXHUwMTExXHUxRUJGbiBUcnVuZyB0XHUwMEUybSBLaVx1MUVDM20gZHV5XHUxRUM3dCBjXHUxRUU3YSBHaVx1MDBFMW8gdmlcdTAwRUFuLlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiTVx1MDBGNCB0XHUxRUEzIGxcdTAwRkQgZG8gYlx1MDBFMW8gY1x1MDBFMW8gKG5nXHUwMEY0biB0XHUxRUVCIGtoXHUwMEY0bmcgcGhcdTAwRjkgaFx1MUVFM3AsIGxcdTAwRTBtIHBoaVx1MUVDMW4sIHNwYW0uLi4pXCJcbiAgICAgICAgICAgICAgdmFsdWU9e3JlcG9ydFJlYXNvbn1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0UmVwb3J0UmVhc29uKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgbWF4TGVuZ3RoPXs1MDB9XG4gICAgICAgICAgICAgIHJvd3M9ezN9XG4gICAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtMiB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItYW1iZXItNDAwXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktZW5kIGdhcC0yIHB0LTFcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0UmVwb3J0TW9kYWwobnVsbCl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC14bCBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICBIXHUxRUU3eVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCIgZGlzYWJsZWQ9eyFyZXBvcnRSZWFzb24udHJpbSgpIHx8IHJlcG9ydGluZ31cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLWFtYmVyLTUwMCBob3ZlcjpiZy1hbWJlci00MDAgdGV4dC1ibGFjayB0ZXh0LXhzIGZvbnQtYm9sZCBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAge3JlcG9ydGluZyA/ICdcdTAxMTBhbmcgZ1x1MUVFRGkuLi4nIDogJ0dcdTFFRURpIGJcdTAwRTFvIGNcdTAwRTFvJ31cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICJBQUNBLE1BQU0sbUJBQW1CO0FBQUEsRUFDdkI7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFFBQVEsQ0FBQyxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sV0FBSTtBQUFBLEVBQzdMO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sUUFBUSxDQUFDLGdCQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxVQUFLLGFBQU0sVUFBSyxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sZ0JBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxXQUFJO0FBQUEsRUFDckw7QUFBQSxFQUNBO0FBQUEsSUFDRSxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixRQUFRLENBQUMsYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sZ0JBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLFVBQUssYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sV0FBSTtBQUFBLEVBQ3RMO0FBQ0Y7QUFFQSxTQUFTLGlCQUFpQixFQUFFLFVBQVUsUUFBUSxHQUFHO0FBQy9DLFFBQU0sQ0FBQyxXQUFXLFlBQVksSUFBSSxN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
