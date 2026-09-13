
const EMOJI_CATEGORIES = [
  {
    name: 'Mặt cười',
    icon: '😊',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '😎', '🥳', '🤩', '🤔', '🤫', '😴', '😷', '🤯', '🤠']
  },
  {
    name: 'Cảm xúc & Tay',
    icon: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💖', '🔥', '💯', '✨', '🌟', '⭐', '💥', '💬', '👍', '👎', '👏', '🙌', '🤝', '👊', '✌️', '🤞', '🤟', '👌', '👋', '🙏']
  },
  {
    name: 'Trường học & Vui',
    icon: '🎓',
    emojis: ['📚', '📖', '📕', '📗', '📘', '🎓', '🏫', '🎒', '📝', '✏️', '🎯', '🎮', '🎲', '🏆', '🥇', '☕', '🍕', '🍰', '🎂', '🚀', '💡', '🎉', '🎈', '🎵', '🎶', '🐱', '🐶', '🌸', '🍀']
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
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute bottom-full mb-2 right-0 left-0 z-50 bg-[#151A23] border border-cyan-500/30 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl animate-scaleIn max-w-[320px] mx-auto sm:ml-auto sm:mr-0">
      <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {EMOJI_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveCat(idx)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${activeCat === idx ? 'bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40' : 'text-slate-400 hover:text-white'}`}>
              <span className="mr-1">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs px-1 shrink-0">
          ✕
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto p-1">
        {EMOJI_CATEGORIES[activeCat].emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="w-9 h-9 flex items-center justify-center text-lg rounded-xl hover:bg-white/10 active:scale-90 transition-transform">
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── CAMPUS CHAT & SOCIAL RAIL (PHASE 4D: CAMPUS | LỚP | TÔI) ───────────────────────────
export function CampusChatRail({ auth, onRequireAuth, className = '', isActive = true }) {
  const [tab, setTab] = React.useState('campus'); // 'campus' | 'class' | 'me'
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(null); // 'campus' | 'class' | 'dm' | null

  const handleInsertEmoji = (emoji, target) => {
    if (target === 'campus') {
      setCampusInput(prev => prev + emoji);
    } else if (target === 'class') {
      setClassInput(prev => prev + emoji);
    } else if (target === 'dm') {
      setDmInput(prev => prev + emoji);
    }
  };

  // Attention & Unread state (Phase 4F)
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
    return num > 99 ? '99+' : String(num);
  };

  // Campus Chat state
  const [campusMessages, setCampusMessages] = React.useState([]);
  const [campusInput, setCampusInput] = React.useState('');
  const [campusSending, setCampusSending] = React.useState(false);
  const [campusNotice, setCampusNotice] = React.useState('');
  const lastCampusMessageIdRef = React.useRef(0);
  const campusEndRef = React.useRef(null);

  // Class Chat state
  const [classMessages, setClassMessages] = React.useState([]);
  const [classInput, setClassInput] = React.useState('');
  const [classSending, setClassSending] = React.useState(false);
  const [classNotice, setClassNotice] = React.useState('');
  const [classLopId, setClassLopId] = React.useState(auth?.user?.lopId || 1);
  const [teacherClasses, setTeacherClasses] = React.useState([]);
  const [classTenLop, setClassTenLop] = React.useState('');
  const lastClassMessageIdRef = React.useRef(0);
  const classEndRef = React.useRef(null);

  // Tôi (Friends & DM) state
  const [friends, setFriends] = React.useState([]);
  const [pendingIncoming, setPendingIncoming] = React.useState([]);
  const [activeFriend, setActiveFriend] = React.useState(null);
  const [dmMessages, setDmMessages] = React.useState([]);
  const [dmInput, setDmInput] = React.useState('');
  const [dmSending, setDmSending] = React.useState(false);
  const [dmNotice, setDmNotice] = React.useState('');
  const lastDmMessageIdRef = React.useRef(0);
  const dmEndRef = React.useRef(null);

  // Friend Search & Safety Modal state
  const [showAddFriend, setShowAddFriend] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [actionFeedback, setActionFeedback] = React.useState('');

  const [reportModal, setReportModal] = React.useState(null);
  const [reportReason, setReportReason] = React.useState('');
  const [reporting, setReporting] = React.useState(false);

  // Stable refs for single bounded polling loop
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

  // Guard: if user loses class access, revert tab to 'campus'
  React.useEffect(() => {
    if (!hasClassAccess && tab === 'class') {
      setTab('campus');
    }
  }, [hasClassAccess, tab]);

  // Tải trạng thái tin nhắn chưa đọc (Phase 4F)
  const taiUnreadState = React.useCallback(async () => {
    if (!isActiveCampusAccount) return;
    try {
      const res = await fetch('/api/chat-read-state');
      const d = await res.json();
      if (d.ok) {
        setUnreadCampus(d.campus || 0);
        setUnreadClass(d.class || 0);
        setUnreadDms(d.dms || {});
        setTotalDms(d.totalDms || 0);
        setPendingFriendRequestsCount(d.pendingFriendRequests || 0);
      }
    } catch {}
  }, [isActiveCampusAccount]);

  const markCampusRead = React.useCallback(async (maxId = 0) => {
    setUnreadCampus(0);
    if (!isActiveCampusAccount) return;
    try {
      await fetch('/api/chat-read-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelType: 'campus', channelKey: 'campus', lastReadId: maxId })
      });
    } catch {}
  }, [isActiveCampusAccount]);

  const markClassRead = React.useCallback(async (lopId, maxId = 0) => {
    setUnreadClass(0);
    if (!isActiveCampusAccount || !lopId) return;
    try {
      await fetch('/api/chat-read-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelType: 'class', channelKey: 'lop:' + lopId, lastReadId: maxId })
      });
    } catch {}
  }, [isActiveCampusAccount]);

  const markDmRead = React.useCallback(async (friendId, maxId = 0) => {
    setUnreadDms(prev => ({ ...prev, [friendId]: 0 }));
    if (!isActiveCampusAccount || !friendId) return;
    try {
      await fetch('/api/chat-read-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelType: 'dm', channelKey: 'peer:' + friendId, lastReadId: maxId })
      });
    } catch {}
  }, [isActiveCampusAccount]);

  // 1. Tải Campus Chat incremental
  const taiCampusChat = React.useCallback(async (sauId = 0) => {
    if (!isActiveCampusAccount) return;
    try {
      const url = sauId > 0 ? `/api/campus-chat?sauId=${sauId}&limit=50` : '/api/campus-chat?limit=50';
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (data.ok && Array.isArray(data.messages)) {
        if (sauId > 0) {
          if (data.messages.length > 0) {
            setCampusMessages(prev => {
              const existingIds = new Set(prev.map(m => m.id));
              const newOnes = data.messages.filter(m => !existingIds.has(m.id));
              if (newOnes.length === 0) return prev;
              const next = [...prev, ...newOnes];
              lastCampusMessageIdRef.current = Math.max(...next.map(m => m.id || 0));
              return next;
            });
          }
        } else {
          setCampusMessages(data.messages);
          if (data.messages.length > 0) {
            lastCampusMessageIdRef.current = Math.max(...data.messages.map(m => m.id || 0));
          }
        }
      }
    } catch {}
  }, [isActiveCampusAccount]);

  // 2. Tải Class Chat incremental
  const taiClassChat = React.useCallback(async (sauId = 0) => {
    if (!hasClassAccess) return;
    try {
      const lopParam = auth?.user?.isTeacher && classLopId ? `&lopId=${classLopId}` : '';
      const url = sauId > 0 ? `/api/chat?sauId=${sauId}${lopParam}` : `/api/chat${lopParam ? '?' + lopParam.slice(1) : ''}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (data.ok) {
        if (Array.isArray(data.cacLop) && data.cacLop.length > 0) {
          setTeacherClasses(data.cacLop);
        }
        if (data.tenLop) setClassTenLop(data.tenLop);
        if (Array.isArray(data.tinNhan)) {
          if (sauId > 0) {
            if (data.tinNhan.length > 0) {
              setClassMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const newOnes = data.tinNhan.filter(m => !existingIds.has(m.id));
                if (newOnes.length === 0) return prev;
                const next = [...prev, ...newOnes];
                lastClassMessageIdRef.current = Math.max(...next.map(m => m.id || 0));
                return next;
              });
            }
          } else {
            setClassMessages(data.tinNhan);
            if (data.tinNhan.length > 0) {
              lastClassMessageIdRef.current = Math.max(...data.tinNhan.map(m => m.id || 0));
            }
          }
        }
      }
    } catch {}
  }, [hasClassAccess, auth?.user?.isTeacher, classLopId]);

  // 3. Tải Bạn bè & Lời mời
  const taiFriends = React.useCallback(async () => {
    if (!isActiveCampusAccount) return;
    try {
      const res = await fetch('/api/campus-friends', { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (data.ok) {
        setFriends(data.friends || []);
        setPendingIncoming(data.pendingIncoming || []);
      }
    } catch {}
  }, [isActiveCampusAccount]);

  // 4. Tải tin nhắn DM incremental
  const taiDmMessages = React.useCallback(async (friendId, sauId = 0) => {
    if (!friendId || !isActiveCampusAccount) return;
    try {
      const url = sauId > 0
        ? `/api/campus-dm?friendAccountId=${friendId}&sauId=${sauId}&limit=50`
        : `/api/campus-dm?friendAccountId=${friendId}&limit=50`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (data.ok && Array.isArray(data.messages)) {
        if (sauId > 0) {
          if (data.messages.length > 0) {
            setDmMessages(prev => {
              const existingIds = new Set(prev.map(m => m.id));
              const newOnes = data.messages.filter(m => !existingIds.has(m.id));
              if (newOnes.length === 0) return prev;
              const next = [...prev, ...newOnes];
              lastDmMessageIdRef.current = Math.max(...next.map(m => m.id || 0));
              return next;
            });
          }
        } else {
          setDmMessages(data.messages);
          if (data.messages.length > 0) {
            lastDmMessageIdRef.current = Math.max(...data.messages.map(m => m.id || 0));
          }
        }
      }
    } catch {}
  }, [isActiveCampusAccount]);

  // SINGLE BOUNDED POLLING LOOP (4s): exactly one loop, polls ONLY active tab, pauses when drawer closed
  React.useEffect(() => {
    if (!isActiveCampusAccount || !isActive) return;

    if (tab === 'campus') {
      taiCampusChat(0);
    } else if (tab === 'class') {
      if (hasClassAccess) taiClassChat(0);
    } else if (tab === 'me') {
      if (activeFriend) {
        taiDmMessages(activeFriend.accountId, 0);
      } else {
        taiFriends();
      }
    }

    taiUnreadState();

    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const currentTab = tabRef.current;
      const currentFriend = activeFriendRef.current;

      taiUnreadState();

      if (currentTab === 'campus') {
        taiCampusChat(lastCampusMessageIdRef.current);
      } else if (currentTab === 'class') {
        taiClassChat(lastClassMessageIdRef.current);
      } else if (currentTab === 'me') {
        if (currentFriend) {
          taiDmMessages(currentFriend.accountId, lastDmMessageIdRef.current);
        } else {
          taiFriends();
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isActiveCampusAccount, hasClassAccess, isActive, tab, activeFriend?.accountId, classLopId, taiCampusChat, taiClassChat, taiFriends, taiDmMessages]);

  // Auto scroll
  React.useEffect(() => {
    if (tab === 'campus' && campusEndRef.current) {
      campusEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [campusMessages.length, tab]);

  React.useEffect(() => {
    if (tab === 'class' && classEndRef.current) {
      classEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [classMessages.length, tab]);

  React.useEffect(() => {
    if (tab === 'me' && activeFriend && dmEndRef.current) {
      dmEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dmMessages.length, tab, activeFriend]);

  // Gửi Campus Chat (Phase 4F: Safe Clear + IME Guard)
  const handleSendCampus = async (e) => {
    e?.preventDefault();
    const text = campusInput.trim();
    if (!text || campusSending) return;
    // Optimistically clear input immediately so user can type next message
    setCampusInput('');
    setCampusSending(true);
    setCampusNotice('');
    try {
      const res = await fetch('/api/campus-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noiDung: text })
      });
      const data = await res.json();
      if (data.ok && data.message) {
        setCampusMessages(prev => {
          const next = [...prev, data.message];
          lastCampusMessageIdRef.current = Math.max(lastCampusMessageIdRef.current, data.message.id || 0);
          return next;
        });
        markCampusRead(data.message.id);
      } else {
        setCampusNotice(data.loi || 'Không gửi được tin nhắn.');
        // Restore ONLY if user hasn't started typing a new message
        setCampusInput(cur => cur ? cur : text);
      }
    } catch {
      setCampusNotice('Lỗi kết nối khi gửi tin nhắn.');
      setCampusInput(cur => cur ? cur : text);
    } finally {
      setCampusSending(false);
    }
  };

  // Thu hồi tin nhắn Campus
  const handleDeleteCampus = async (id) => {
    if (!confirm('Bạn có chắc muốn thu hồi tin nhắn này?')) return;
    try {
      const res = await fetch(`/api/campus-chat?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setCampusMessages(prev => prev.filter(m => m.id !== id));
      } else {
        alert(data.loi || 'Không thể xóa tin nhắn.');
      }
    } catch {
      alert('Lỗi kết nối khi xóa tin nhắn.');
    }
  };

  // Gửi Class Chat (Phase 4F: Safe Clear + IME Guard)
  const handleSendClass = async (e) => {
    e?.preventDefault();
    const text = classInput.trim();
    if (!text || classSending) return;
    setClassInput('');
    setClassSending(true);
    setClassNotice('');
    try {
      const payload = { noiDung: text };
      if (auth?.user?.isTeacher && classLopId) payload.lopId = classLopId;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok && data.tinNhan) {
        setClassMessages(prev => {
          const next = [...prev, data.tinNhan];
          lastClassMessageIdRef.current = Math.max(lastClassMessageIdRef.current, data.tinNhan.id || 0);
          return next;
        });
        markClassRead(classLopId, data.tinNhan.id);
      } else {
        setClassNotice(data.loi || 'Không gửi được tin nhắn.');
        setClassInput(cur => cur ? cur : text);
      }
    } catch {
      setClassNotice('Lỗi kết nối khi gửi tin nhắn.');
      setClassInput(cur => cur ? cur : text);
    } finally {
      setClassSending(false);
    }
  };

  // Gửi tin nhắn riêng (DM - Phase 4F: Safe Clear + IME Guard)
  const handleSendDm = async (e) => {
    e?.preventDefault();
    const text = dmInput.trim();
    if (!text || !activeFriend || dmSending) return;
    setDmInput('');
    setDmSending(true);
    setDmNotice('');
    try {
      const res = await fetch('/api/campus-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverAccountId: activeFriend.accountId, noiDung: text })
      });
      const data = await res.json();
      if (data.ok && data.message) {
        setDmMessages(prev => {
          const next = [...prev, data.message];
          lastDmMessageIdRef.current = Math.max(lastDmMessageIdRef.current, data.message.id || 0);
          return next;
        });
        markDmRead(activeFriend.accountId, data.message.id);
      } else {
        setDmNotice(data.loi || 'Không thể gửi tin nhắn.');
        setDmInput(cur => cur ? cur : text);
      }
    } catch {
      setDmNotice('Lỗi kết nối khi gửi tin nhắn riêng.');
      setDmInput(cur => cur ? cur : text);
    } finally {
      setDmSending(false);
    }
  };

  // Tìm bạn bè (Tối thiểu 4 ký tự tên đăng nhập để bảo mật danh bạ)
  const handleSearchFriends = async (val) => {
    setSearchQuery(val);
    const trimmed = val.trim();
    if (trimmed.length < 4) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    setActionFeedback('');
    try {
      const res = await fetch('/api/campus-friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query: trimmed })
      });
      const data = await res.json();
      if (data.ok) {
        setSearchResults(data.list || []);
      }
    } catch {} finally {
      setSearchLoading(false);
    }
  };

  // Gửi lời mời kết bạn
  const handleRequestFriend = async (targetId) => {
    try {
      const res = await fetch('/api/campus-friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', targetAccountId: targetId })
      });
      const data = await res.json();
      if (data.ok) {
        setActionFeedback('Đã gửi lời mời kết bạn.');
        setSearchResults(prev => prev.map(u => u.id === targetId ? { ...u, friendshipStatus: 'sent_pending' } : u));
      } else {
        alert(data.loi || 'Không thể gửi lời mời.');
      }
    } catch {
      alert('Lỗi kết nối khi gửi lời mời kết bạn.');
    }
  };

  // Chấp nhận kết bạn
  const handleAcceptFriend = async (reqId, fromAccId) => {
    try {
      const res = await fetch('/api/campus-friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', requestId: reqId, requesterAccountId: fromAccId })
      });
      const data = await res.json();
      if (data.ok) {
        taiFriends();
      } else {
        alert(data.loi || 'Lỗi khi chấp nhận.');
      }
    } catch {}
  };

  // Từ chối kết bạn
  const handleDeclineFriend = async (reqId, fromAccId) => {
    try {
      const res = await fetch('/api/campus-friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline', requestId: reqId, requesterAccountId: fromAccId })
      });
      const data = await res.json();
      if (data.ok) {
        taiFriends();
      } else {
        alert(data.loi || 'Lỗi khi từ chối.');
      }
    } catch {}
  };

  // Hủy kết bạn
  const handleUnfriend = async (friendId) => {
    if (!confirm('Bạn có muốn hủy kết bạn với người này?')) return;
    try {
      const res = await fetch('/api/campus-friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unfriend', friendAccountId: friendId })
      });
      const data = await res.json();
      if (data.ok) {
        setActiveFriend(null);
        taiFriends();
      }
    } catch {}
  };

  // Chặn người dùng
  const handleBlock = async (targetId) => {
    if (!confirm('Bạn có chắc muốn chặn người này? Cả hai bên sẽ không thể nhắn tin hoặc gửi lời mời kết bạn.')) return;
    try {
      const res = await fetch('/api/campus-friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block', targetAccountId: targetId })
      });
      const data = await res.json();
      if (data.ok) {
        setActiveFriend(null);
        taiFriends();
        alert('Đã chặn người dùng.');
      }
    } catch {}
  };

  // Gửi báo cáo vi phạm
  const handleSubmitReport = async (e) => {
    e?.preventDefault();
    if (!reportReason.trim() || !reportModal?.targetId || reporting) return;
    setReporting(true);
    try {
      const payload = {
        action: 'report',
        targetAccountId: reportModal.targetId,
        reason: reportReason.trim()
      };
      if (reportModal.messageId) {
        payload.messageId = reportModal.messageId;
      }
      const res = await fetch('/api/campus-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        alert('Đã gửi báo cáo cho giáo viên xem xét.');
        setReportModal(null);
        setReportReason('');
      } else {
        alert(data.loi || 'Lỗi khi gửi báo cáo.');
      }
    } catch {
      alert('Lỗi kết nối khi gửi báo cáo.');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div id="campus-chat-rail" className={`bg-[#151A23] border border-white/10 rounded-2xl shadow-xl flex flex-col overflow-hidden h-[560px] ${className}`}>
      {/* Rail Header — EXACTLY 3 TABS: Campus | Lớp | Tôi */}
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between bg-[#111620]/60 shrink-0">
        <div className="flex items-center gap-1.5 bg-[#0B0E14] p-1 rounded-xl border border-white/10 w-full">
          <button
            type="button"
            id="chat-tab-campus"
            onClick={() => {
              setTab('campus');
              setActiveFriend(null);
              markCampusRead(lastCampusMessageIdRef.current);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${tab === 'campus' ? 'bg-[#00F2FE] text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}>
            <span>Campus</span>
            {unreadCampus > 0 && (
              <span id="badge-unread-campus" className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                {formatBadge(unreadCampus)}
              </span>
            )}
          </button>

          {hasClassAccess && (
            <button
              type="button"
              id="chat-tab-class"
              onClick={() => {
                setTab('class');
                setActiveFriend(null);
                markClassRead(classLopId, lastClassMessageIdRef.current);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${tab === 'class' ? 'bg-[#00F2FE] text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              <span>Lớp</span>
              {unreadClass > 0 && (
                <span id="badge-unread-class" className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-cyan-400 text-black">
                  {formatBadge(unreadClass)}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            id="chat-tab-me"
            onClick={() => { setTab('me'); taiFriends(); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 relative ${tab === 'me' ? 'bg-[#00F2FE] text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}>
            <span>Tôi</span>
            {(totalDms + pendingIncoming.length + pendingFriendRequestsCount) > 0 && (
              <span id="badge-unread-me" className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-black">
                {formatBadge(totalDms + Math.max(pendingIncoming.length, pendingFriendRequestsCount))}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Guest State */}
      {auth?.isGuest ? (
        <div className="flex-1 p-5 flex flex-col items-center justify-center text-center gap-3 bg-white/[0.01]">
          <span className="text-3xl">🔐</span>
          <p className="text-xs font-bold text-slate-300">Đăng nhập để tham gia Chat</p>
          <p className="text-[11px] text-slate-400">Trò chuyện cùng bạn bè và giáo viên toàn trường.</p>
          <button type="button" onClick={onRequireAuth}
            className="mt-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black text-xs font-extrabold shadow-md hover:opacity-95 active:scale-95 transition-all">
            Đăng nhập ngay
          </button>
        </div>
      ) : tab === 'campus' ? (
        /* ─── TAB: CAMPUS CHAT (TOÀN TRƯỜNG — MỌI TÀI KHOẢN CAMPUS HOẠT ĐỘNG) ─── */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            {campusMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-4">
                <p className="text-[11px] text-slate-400">Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!</p>
              </div>
            ) : (
              campusMessages.map(msg => (
                <div key={msg.id} className={`group flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5 px-1">
                    <span className="text-[10px] font-bold text-slate-300">{msg.senderName}</span>
                    {msg.role === 'teacher' ? (
                      <span className="px-1 py-0.2 rounded text-[8px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">GVCN</span>
                    ) : msg.classBadge ? (
                      <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/20">✓ {msg.classBadge}</span>
                    ) : null}
                    <span className="text-[9px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {(msg.isMe || auth?.user?.isVerifiedTeacher) && (
                      <button type="button" onClick={() => handleDeleteCampus(msg.id)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-rose-400 hover:text-rose-300 transition-opacity ml-1"
                        title="Thu hồi tin nhắn">
                        ✕
                      </button>
                    )}
                  </div>
                  <div className={`px-2.5 py-1.5 rounded-xl max-w-[85%] break-words text-xs leading-relaxed ${msg.isMe ? 'bg-[#00F2FE]/15 text-white border border-[#00F2FE]/30 rounded-tr-none' : 'bg-[#0B0E14] text-slate-200 border border-white/5 rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={campusEndRef} />
          </div>

          {/* Rate limit notice */}
          {campusNotice && (
            <p className="px-3 py-1 text-[10px] text-amber-400 bg-amber-500/10 border-t border-amber-500/20">{campusNotice}</p>
          )}

          {/* Composer */}
          <form onSubmit={handleSendCampus} className="p-2 border-t border-white/10 bg-[#111620]/80 flex items-center gap-2 shrink-0 relative">
            {showEmojiPicker === 'campus' && (
              <EmojiPickerPopup
                onSelect={(emoji) => handleInsertEmoji(emoji, 'campus')}
                onClose={() => setShowEmojiPicker(null)}
              />
            )}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(showEmojiPicker === 'campus' ? null : 'campus')}
              className="p-2 rounded-xl text-slate-400 hover:text-yellow-300 hover:bg-white/5 text-base transition-colors shrink-0"
              title="Thêm biểu tượng cảm xúc">
              😊
            </button>
            <textarea
              id="input-campus-chat"
              rows={1}
              placeholder="Nhắn tin toàn Campus..."
              value={campusInput}
              onChange={e => setCampusInput(e.target.value)}
              onCompositionStart={() => { isCampusComposingRef.current = true; }}
              onCompositionEnd={() => { isCampusComposingRef.current = false; }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  if (e.nativeEvent?.isComposing || isCampusComposingRef.current) return;
                  e.preventDefault();
                  handleSendCampus();
                }
              }}
              maxLength={500}
              className="flex-1 bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/60 resize-none min-h-[38px] max-h-24"
            />
            <button
              type="submit"
              id="btn-send-campus-chat"
              disabled={!campusInput.trim() || campusSending}
              className="px-3 py-2 rounded-xl bg-[#00F2FE] hover:bg-[#00e1ec] text-black text-xs font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              Gửi
            </button>
          </form>
        </div>
      ) : tab === 'class' ? (
        /* ─── TAB: LỚP (CHAT NỘI BỘ LỚP — CHỈ DÀNH CHO THÀNH VIÊN ĐÃ XÁC MINH) ─── */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Class Header info bar */}
          <div className="px-3 py-1.5 bg-[#0B0E14] border-b border-white/5 flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-cyan-300">
              🏫 {classTenLop || auth?.user?.tenLop || 'Phòng chat lớp'}
            </span>
            {auth?.user?.isTeacher && teacherClasses.length > 1 && (
              <select
                value={classLopId}
                onChange={e => {
                  const id = Number(e.target.value);
                  setClassLopId(id);
                  lastClassMessageIdRef.current = 0;
                }}
                className="bg-[#151A23] border border-white/15 text-white text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none">
                {teacherClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.ten}</option>
                ))}
              </select>
            )}
          </div>

          {/* Class Message List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            {classMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-4">
                <p className="text-[11px] text-slate-400">Chưa có tin nhắn lớp. Hãy gửi lời chào đầu tiên!</p>
              </div>
            ) : (
              classMessages.map(msg => (
                <div key={msg.id} className={`group flex flex-col ${msg.laTinCuaToi ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5 px-1">
                    <span className="text-[10px] font-bold text-slate-300">{msg.tenNguoiGui}</span>
                    {msg.vaiTro === 'giao_vien' && (
                      <span className="px-1 py-0.2 rounded text-[8px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">GVCN</span>
                    )}
                    <span className="text-[9px] text-slate-400">
                      {msg.taoLuc ? new Date(msg.taoLuc.replace(' ', 'T') + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className={`px-2.5 py-1.5 rounded-xl max-w-[85%] break-words text-xs leading-relaxed ${msg.laTinCuaToi ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/40 rounded-tr-none' : 'bg-[#0B0E14] text-slate-200 border border-white/5 rounded-tl-none'}`}>
                    {msg.noiDung}
                  </div>
                </div>
              ))
            )}
            <div ref={classEndRef} />
          </div>

          {/* Rate limit notice */}
          {classNotice && (
            <p className="px-3 py-1 text-[10px] text-amber-400 bg-amber-500/10 border-t border-amber-500/20">{classNotice}</p>
          )}

          {/* Composer */}
          <form onSubmit={handleSendClass} className="p-2 border-t border-white/10 bg-[#111620]/80 flex items-center gap-2 shrink-0 relative">
            {showEmojiPicker === 'class' && (
              <EmojiPickerPopup
                onSelect={(emoji) => handleInsertEmoji(emoji, 'class')}
                onClose={() => setShowEmojiPicker(null)}
              />
            )}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(showEmojiPicker === 'class' ? null : 'class')}
              className="p-2 rounded-xl text-slate-400 hover:text-yellow-300 hover:bg-white/5 text-base transition-colors shrink-0"
              title="Thêm biểu tượng cảm xúc">
              😊
            </button>
            <textarea
              id="input-class-chat"
              rows={1}
              placeholder="Nhắn tin với lớp..."
              value={classInput}
              onChange={e => setClassInput(e.target.value)}
              onCompositionStart={() => { isClassComposingRef.current = true; }}
              onCompositionEnd={() => { isClassComposingRef.current = false; }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  if (e.nativeEvent?.isComposing || isClassComposingRef.current) return;
                  e.preventDefault();
                  handleSendClass();
                }
              }}
              maxLength={300}
              className="flex-1 bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 resize-none min-h-[38px] max-h-24"
            />
            <button
              type="submit"
              id="btn-send-class-chat"
              disabled={!classInput.trim() || classSending}
              className="px-3 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              Gửi
            </button>
          </form>
        </div>
      ) : (
        /* ─── TAB: TÔI (BẠN BÈ & TIN NHẮN RIÊNG 1-1) ─── */
        <div className="flex-1 flex flex-col min-h-0">
          {!activeFriend ? (
            /* FRIEND LIST VIEW */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Friends Top Bar */}
              <div className="p-2.5 border-b border-white/5 flex items-center justify-between bg-[#111620]/40 shrink-0">
                <span className="text-xs font-bold text-slate-300">Bạn bè ({friends.length})</span>
                <button type="button" onClick={() => setShowAddFriend(true)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00F2FE]/15 hover:text-[#00F2FE] text-slate-300 text-[11px] font-bold border border-white/10 transition-all flex items-center gap-1">
                  <span>+</span>
                  <span>Kết bạn</span>
                </button>
              </div>

              {/* Pending Requests Section */}
              {pendingIncoming.length > 0 && (
                <div className="p-2 border-b border-white/5 bg-purple-950/20">
                  <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1.5 px-1">Lời mời kết bạn ({pendingIncoming.length})</p>
                  <div className="space-y-1.5">
                    {pendingIncoming.map(req => (
                      <div key={req.requestId} className="flex items-center justify-between p-1.5 rounded-lg bg-[#0B0E14] border border-white/5 text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-white truncate text-[11px]">{req.displayName}</p>
                          <p className="text-[9px] text-slate-400">@{req.username} {req.classBadge ? `• ${req.classBadge}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => handleAcceptFriend(req.requestId, req.fromAccountId)}
                            className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-bold">
                            Đồng ý
                          </button>
                          <button type="button" onClick={() => handleDeclineFriend(req.requestId, req.fromAccountId)}
                            className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400 hover:text-white text-[10px]">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {friends.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <span className="text-2xl mb-1">👥</span>
                    <p className="text-xs text-slate-400">Chưa có bạn bè nào.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Bấm "+ Kết bạn" để tìm và kết nối cùng bạn bè trường.</p>
                  </div>
                ) : (
                  friends.map(f => (
                    <button key={f.friendshipId} type="button"
                      onClick={() => { setActiveFriend(f); markDmRead(f.accountId); taiDmMessages(f.accountId); }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-[#0B0E14]/60 hover:bg-[#00F2FE]/10 border border-white/5 hover:border-[#00F2FE]/30 transition-all text-left group">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#00F2FE]/30 to-[#8B5CF6]/30 flex items-center justify-center font-bold text-xs text-white shrink-0">
                          {f.displayName ? f.displayName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white group-hover:text-[#00F2FE] transition-colors truncate">{f.displayName}</p>
                          <p className="text-[10px] text-slate-400 truncate">@{f.username} {f.classBadge ? `• ${f.classBadge}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {Boolean(unreadDms[f.accountId]) && (
                          <span className="px-1.5 py-0.2 rounded-full bg-cyan-400 text-black font-black text-[9px]">
                            {formatBadge(unreadDms[f.accountId])}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 group-hover:text-white transition-colors">›</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* PRIVATE CONVERSATION VIEW */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Convo Header */}
              <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between bg-[#111620]/60 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button type="button" onClick={() => setActiveFriend(null)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold" title="Quay lại danh sách bạn bè">
                    ‹
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{activeFriend.displayName}</p>
                    <p className="text-[9px] text-slate-400 truncate">@{activeFriend.username} {activeFriend.classBadge ? `• ${activeFriend.classBadge}` : ''}</p>
                  </div>
                </div>

                {/* Convo Safety Actions */}
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setReportModal({ targetId: activeFriend.accountId, targetName: activeFriend.displayName })}
                    className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-amber-300 hover:bg-white/5 transition-all" title="Báo cáo người dùng này">
                    Báo cáo
                  </button>
                  <button type="button" onClick={() => handleBlock(activeFriend.accountId)}
                    className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-all" title="Chặn người này">
                    Chặn
                  </button>
                  <button type="button" onClick={() => handleUnfriend(activeFriend.accountId)}
                    className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all" title="Hủy kết bạn">
                    Hủy bạn
                  </button>
                </div>
              </div>

              {/* DM Messages List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
                {dmMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-4">
                    <p className="text-[11px] text-slate-400">Bắt đầu trò chuyện riêng với {activeFriend.displayName}.</p>
                  </div>
                ) : (
                  dmMessages.map(msg => (
                    <div key={msg.id} className={`group flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1">
                        <div className={`px-2.5 py-1.5 rounded-xl max-w-[85%] break-words text-xs leading-relaxed ${msg.isMe ? 'bg-[#00F2FE]/20 text-white border border-[#00F2FE]/40 rounded-tr-none' : 'bg-[#0B0E14] text-slate-200 border border-white/10 rounded-tl-none'}`}>
                          {msg.content}
                        </div>
                        {!msg.isMe && (
                          <button
                            type="button"
                            onClick={() => setReportModal({ targetId: activeFriend.accountId, targetName: activeFriend.displayName, messageId: msg.id, messageContent: msg.content })}
                            className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-amber-300 transition-opacity p-0.5"
                            title="Báo cáo tin nhắn này"
                          >
                            🚩
                          </button>
                        )}
                      </div>
                      <span className="text-[8px] text-slate-400 mt-0.5 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
                <div ref={dmEndRef} />
              </div>

              {/* Rate limit notice */}
              {dmNotice && (
                <p className="px-3 py-1 text-[10px] text-amber-400 bg-amber-500/10 border-t border-amber-500/20">{dmNotice}</p>
              )}

              {/* DM Composer */}
              <form onSubmit={handleSendDm} className="p-2 border-t border-white/10 bg-[#111620]/80 flex items-center gap-2 shrink-0 relative">
                {showEmojiPicker === 'dm' && (
                  <EmojiPickerPopup
                    onSelect={(emoji) => handleInsertEmoji(emoji, 'dm')}
                    onClose={() => setShowEmojiPicker(null)}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(showEmojiPicker === 'dm' ? null : 'dm')}
                  className="p-2 rounded-xl text-slate-400 hover:text-yellow-300 hover:bg-white/5 text-base transition-colors shrink-0"
                  title="Thêm biểu tượng cảm xúc">
                  😊
                </button>
                <textarea
                  id="input-dm-chat"
                  rows={1}
                  placeholder={`Nhắn cho ${activeFriend.displayName}...`}
                  value={dmInput}
                  onChange={e => setDmInput(e.target.value)}
                  onCompositionStart={() => { isDmComposingRef.current = true; }}
                  onCompositionEnd={() => { isDmComposingRef.current = false; }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      if (e.nativeEvent?.isComposing || isDmComposingRef.current) return;
                      e.preventDefault();
                      handleSendDm();
                    }
                  }}
                  maxLength={500}
                  className="flex-1 bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/60 resize-none min-h-[38px] max-h-24"
                />
                <button
                  type="submit"
                  id="btn-send-dm-chat"
                  disabled={!dmInput.trim() || dmSending}
                  className="px-3 py-2 rounded-xl bg-[#00F2FE] hover:bg-[#00e1ec] text-black text-xs font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  Gửi
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: KẾT BẠN (SEARCH POPUP) ─── */}
      {showAddFriend && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151A23] border border-white/15 rounded-2xl max-w-sm w-full p-4 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>➕</span>
                <span>Kết bạn mới</span>
              </h4>
              <button type="button" onClick={() => { setShowAddFriend(false); setSearchResults([]); setSearchQuery(''); }}
                className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <div>
              <input
                type="text"
                placeholder="Nhập tên đăng nhập (tối thiểu 4 ký tự)..."
                value={searchQuery}
                onChange={e => handleSearchFriends(e.target.value)}
                className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]"
              />
              <p className="text-[10px] text-slate-400 mt-1">Gõ tối thiểu 4 ký tự (tên đăng nhập) để tìm kiếm bạn bè.</p>
            </div>

            {actionFeedback && (
              <p className="text-[11px] text-emerald-400 font-bold">{actionFeedback}</p>
            )}

            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {searchLoading ? (
                <p className="text-[11px] text-slate-400 text-center py-2">Đang tìm kiếm...</p>
              ) : searchResults.length === 0 ? (
                searchQuery.trim().length >= 4 ? (
                  <p className="text-[11px] text-slate-400 text-center py-2">Không tìm thấy tài khoản phù hợp.</p>
                ) : null
              ) : (
                searchResults.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded-xl bg-[#0B0E14] border border-white/5 text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-white truncate">{u.displayName}</p>
                      <p className="text-[10px] text-slate-400">@{u.username} {u.classBadge ? `• ${u.classBadge}` : ''}</p>
                    </div>
                    {u.friendshipStatus === 'friends' ? (
                      <span className="text-[10px] font-bold text-emerald-400 shrink-0">Bạn bè</span>
                    ) : u.friendshipStatus === 'sent_pending' ? (
                      <span className="text-[10px] font-bold text-amber-400 shrink-0">Đã gửi lời mời</span>
                    ) : u.friendshipStatus === 'received_pending' ? (
                      <span className="text-[10px] font-bold text-purple-400 shrink-0">Đang chờ bạn duyệt</span>
                    ) : (
                      <button type="button" onClick={() => handleRequestFriend(u.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#00F2FE] hover:bg-[#00e1ec] text-black font-bold text-[10px] shrink-0 transition-all">
                        Kết bạn
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: BÁO CÁO AN TOÀN (REPORT POPUP) ─── */}
      {reportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmitReport} className="bg-[#151A23] border border-white/15 rounded-2xl max-w-sm w-full p-4 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>{reportModal.messageId ? 'Báo cáo tin nhắn' : `Báo cáo người dùng: ${reportModal.targetName}`}</span>
              </h4>
              <button type="button" onClick={() => setReportModal(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>
            {reportModal.messageContent && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 italic">
                "{reportModal.messageContent.slice(0, 100)}{reportModal.messageContent.length > 100 ? '...' : ''}"
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              Báo cáo sẽ được chuyển thẳng đến Trung tâm Kiểm duyệt của Giáo viên.
            </p>
            <textarea
              placeholder="Mô tả lý do báo cáo (ngôn từ không phù hợp, làm phiền, spam...)"
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              maxLength={500}
              rows={3}
              required
              className="w-full bg-[#0B0E14] border border-white/10 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={() => setReportModal(null)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs">
                Hủy
              </button>
              <button type="submit" disabled={!reportReason.trim() || reporting}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold disabled:opacity-50">
                {reporting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
