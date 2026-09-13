import { CampusHighlights } from './components/cards.js';
import { AnnouncementTicker, TheBaiDang } from './components/feed.js';
import { CampusChatRail } from './features/chat-rail.js';
import { ActivityLobby, CampusActivityUniverse, RoomPasswordModal } from './features/lobby.js';
import { AuthModal, CommunityBoardGateModal } from './features/modals.js';
import { CampusFocusRoom, CampusWatchTogether, StudyDock } from './features/study.js';
import { CAMPUS_GAMES, PRESET_AVATARS, dinhDangNgayGioVN, formatDateVN, formatTimeOnly, formatVND, idGoogleDrive, idYoutube, laVideoTrucTiepFe, normalizeCampusRoom, thoiGianTruoc, urlMediaFe } from './lib/helpers.js';
import { Ic } from './lib/icons.js';

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ─── Main Application Component ─────────────────────────────────────────────
function DigitalCampusApp() {
  // 1. Authentication State & Role Tiers
  // Role Tiers:
  // - Teacher (GVCN): isTeacher = true
  // - Authorized Student (Ban cán sự): isAuthorizedStudent = true (has quyen array or chucVu)
  // - Regular Student: regular member
  const [auth, setAuth] = useState({ loaded: false, isGuest: true, user: null });
  const [showAuthGate, setShowAuthGate] = useState(false);

  // Student Custom Avatar (persisted via localStorage)
  const [currentAvatar, setCurrentAvatar] = useState(() => {
    try {
      const saved = localStorage.getItem('user_custom_avatar');
      // Chỉ chấp nhận avatar SVG nội bộ (data:image/svg+xml) — loại bỏ URL ngoài cũ.
      if (saved && saved.startsWith('data:image/svg+xml')) return saved;
    } catch { /* bỏ qua */ }
    return PRESET_AVATARS[0].url;
  });
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNoiQuyModal, setShowNoiQuyModal] = useState(false);
  const [showGamificationModal, setShowGamificationModal] = useState(false);
  const [gamificationTab, setGamificationTab] = useState('achievements'); // 'achievements' | 'leaderboard'
  const [leaderboardCategory, setLeaderboardCategory] = useState('weeklyStudy'); // 'weeklyStudy' | 'topGamers' | 'attendanceStars' | 'mostHelpful'

  // 1.5 Gamification & Achievements Data State
  const [gamification, setGamification] = useState({
    loaded: false,
    allAchievements: [],
    achievements: [],
    streaks: [],
    points: { diemHienTai: 0, diemTong: 0, capDo: 1 },
    leaderboards: { weeklyStudy: [], topGamers: [], mostHelpful: [], attendanceStars: [] }
  });

  // 2. Navigation & Tabs
  const [currentLobby, setCurrentLobby] = useState(null); // 'CINEMA' | 'GAME' | 'LOFI' | 'CHAT' | null
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'

  const [showRoomPasswordModal, setShowRoomPasswordModal] = useState(false);
  const [selectedPasswordRoom, setSelectedPasswordRoom] = useState(null);

  // URL query check on mount (?auth=login / ?auth=register)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const authParam = sp.get('auth');
      const tabParam = sp.get('tab');
      if (authParam === 'login') {
        setAuthModalTab('login');
        setShowAuthModal(true);
      } else if (authParam === 'register' || tabParam === 'dang-ky') {
        setAuthModalTab('register');
        setShowAuthModal(true);
      }
    } catch {}
  }, []);

  const [activeTab, setActiveTab] = useState('campus'); // 'campus' | 'feed'
  const [feedSubTab, setFeedSubTab] = useState('ban-tin'); // 'ban-tin' | 'diem-danh' | 'thu-quy'
  const [activeChannel, setActiveChannel] = useState('# Bảng tin chung');
  const [currentView, setCurrentView] = useState('LOBBY'); // 'LOBBY' | 'ROOM_ACTIVE'
  const [activeRoom, setActiveRoom] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [campusSearch, setCampusSearch] = useState('');
  const [navExpandedCat, setNavExpandedCat] = useState(null); // 'CINEMA' | 'GAME' | 'LOFI' | 'CHAT' | null
  const [mobileSelectedCat, setMobileSelectedCat] = useState(null); // 'CINEMA' | 'GAME' | 'LOFI' | 'CHAT' | null
  const [viewAllCat, setViewAllCat] = useState(null); // 'CINEMA' | 'GAME' | 'LOFI' | 'CHAT' | null
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isRoomWide, setIsRoomWide] = useState(false);
  const [showMembersDropdown, setShowMembersDropdown] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // 2.5 Phase 4A Digital Campus Architecture States
  const [campusHighlights, setCampusHighlights] = useState([]);
  const [teacherAnnouncements, setTeacherAnnouncements] = useState([]);
  const [showCommunityGate, setShowCommunityGate] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Mobile Navigation State
  const [mobileNavVisible, setMobileNavVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sub-tabs for Attendance & Treasury
  const [ddTabSub, setDdTabSub] = useState('ngay');
  const [tqTabSub, setTqTabSub] = useState('thu');

  // 4. Class Real Data
  const [classData, setClassData] = useState({
    loaded: false,
    lop: { ten: 'Lớp 10A7', namHoc: '2026 – 2027', truong: 'Trung tâm GDNN - GDTX Huyện Định Quán', bannerHinhUrl: null, bannerVideoUrl: null },
    hocSinh: [],
    thongBao: [],
    hoatDongLop: [],
    quyKhoan: [],
    quyChi: [],
    quyDong: [],
    thuQuy: null,
    phienBanTkb: null
  });

  // 4.1 Class Selector & Switching State
  const classDropdownRef = useRef(null);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [dsLop, setDsLop] = useState([
    { id: 1, ten: 'Lớp 10A7', slug: '10a7', namHoc: '2026 – 2027' },
    { id: 2, ten: 'Lớp 11A1', slug: '11a1', namHoc: '2026 – 2027' }
  ]);

  // 5. Live Chat State — tin nhắn THẬT từ /api/chat + /api/chat-stream (SSE)
  const [chatMessages, setChatMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(null); // số người online thật từ SSE presence
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [showMobileChatRail, setShowMobileChatRail] = useState(false);
  const [isXlScreen, setIsXlScreen] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(min-width: 1280px)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(min-width: 1280px)');
    const onChange = (e) => setIsXlScreen(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    } else if (mql.addListener) {
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    }
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // 7. Attendance State
  const [attendance, setAttendance] = useState({
    loaded: false,
    danhSach: [],
    stats: null,
    ngay: new Date().toISOString().slice(0, 10),
    buoi: 'sang',
    loai: 'chinh',
    caNhan: null
  });

  // 8. Game Arena State — đấu THẬT qua /api/game (Phase 3B.1)
  const [arenaTab, setArenaTab] = useState('truong'); // 'truong' (mặc định) | 'lop'
  const [caroRooms, setCaroRooms] = useState(null); // null = chưa tải
  const [caroPhong, setCaroPhong] = useState(null); // phòng đang vào (chi tiết từ API)
  const [caroLoi, setCaroLoi] = useState('');
  const [quickState, setQuickState] = useState('LOBBY'); // 'LOBBY' | 'QUEUE_WAITING' | 'MATCH_FOUND' | 'GAME_ACTIVE' | 'GAME_OVER'
  const [queueTimer, setQueueTimer] = useState(0); // giây chờ
  const [quickWaitPhongId, setQuickWaitPhongId] = useState(null);
  const [matchFoundData, setMatchFoundData] = useState(null); // { doiThu: { ten, lopTen } }
  const [matchCountdown, setMatchCountdown] = useState(3);
  const [showTaoBanModal, setShowTaoBanModal] = useState(false);
  const [taoBanScope, setTaoBanScope] = useState('truong'); // 'truong' | 'lop'
  const [taoBanTen, setTaoBanTen] = useState('');
  const [taoBanDangGui, setTaoBanDangGui] = useState(false);

  // 9. DJ Radio State — tên bài THẬT từ /api/lop (nhacNen) / /api/nhac-nen-info
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioTitle, setRadioTitle] = useState('Nhạc nền của lớp');

  // 10. Phòng hoạt động động LIÊN LỚP — dữ liệu THẬT từ /api/phong + /api/phong-chat
  const [dsPhong, setDsPhong] = useState(null); // null = chưa tải
  const [showTaoPhong, setShowTaoPhong] = useState(false);
  const [showInlineTaoPhong, setShowInlineTaoPhong] = useState(false);
  const [tpForm, setTpForm] = useState({ ten: '', loai: 'chat', phamVi: 'truong', moTa: '', videoUrl: '', nhacUrl: '', access_mode: 'public', matKhau: '', sucChua: 8 });
  const [tpDangTao, setTpDangTao] = useState(false);
  const [tpLoi, setTpLoi] = useState('');
  const [phongChat, setPhongChat] = useState([]);
  const [phongThanhVien, setPhongThanhVien] = useState([]);
  const [phongMinhKhoa, setPhongMinhKhoa] = useState('');
  const [phongInput, setPhongInput] = useState('');
  const [phongLoi, setPhongLoi] = useState('');
  const [phongDangGui, setPhongDangGui] = useState(false);
  const phongSauIdRef = useRef(0);
  const phongChatEndRef = useRef(null);
  // Study Room governance (Phase 4G): vai trò + capability của mình + policy (staff)
  const phongVideoTimeRef = useRef(0);
  const [phongMyCaps, setPhongMyCaps] = useState({});
  const [phongPolicies, setPhongPolicies] = useState(null);
  const [phongGrants, setPhongGrants] = useState([]);
  const [phongVaiTro, setPhongVaiTro] = useState('member');
  const [phongIsStaff, setPhongIsStaff] = useState(false);
  const [phongDetailTick, setPhongDetailTick] = useState(0);
  // Sảnh chat toàn trường (phòng hệ thống) — khung chat góc phải lobby dùng kênh này
  const [sanhId, setSanhId] = useState(null);
  const [sanhChat, setSanhChat] = useState([]);
  const sanhSauIdRef = useRef(0);
  const sanhChatEndRef = useRef(null);
  // 11. Rail tiện ích bên phải campus — tab linh hoạt thay vì chiếm chỗ cố định
  const [railTab, setRailTab] = useState('chat'); // 'chat' | 'nhac' | 'su-kien'

  // 12. Sự kiện campus toàn trường (/api/su-kien — public) + occupancy duy nhất
  const [dsSuKien, setDsSuKien] = useState([]);
  const [dangHoatDong, setDangHoatDong] = useState(0);

  // 10. Notifications Center
  const [showNotifModal, setShowNotifModal] = useState(false);


  // Mã thiết bị bền vững để định danh lượt cảm xúc/bình luận khi đăng nhập bằng mã lớp
  // chung (không có hocSinhId). Chỉ là gợi ý — máy chủ vẫn trộn thêm phienId từ cookie
  // ký HMAC nên không thể giả mạo danh tính của phiên khác.
  const thietBiId = useMemo(() => {
    try {
      let id = localStorage.getItem('thietBiId');
      if (!id) {
        id = (crypto.randomUUID ? crypto.randomUUID() : `tb-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        localStorage.setItem('thietBiId', id);
      }
      return id;
    } catch { return 'thiet-bi-khong-ten'; }
  }, []);

  // ─── AUTHENTICATION CHECK ─────────────────────────────────────────────────
  const fetchAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/whoami');
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          const isT = data.role === 'teacher';
          const hasQuyen = Array.isArray(data.quyen) && data.quyen.length > 0;
          const isBCS = Boolean(data.chucVu) || hasQuyen;

          if (Array.isArray(data.dsLop) && data.dsLop.length > 0) {
            setDsLop(data.dsLop);
          }
          if (data.lop) {
            setClassData(prev => ({
              ...prev,
              lop: {
                ...prev.lop,
                ...data.lop,
                ten: data.lop.ten || prev.lop?.ten || 'Lớp 10A7',
                namHoc: data.lop.namHoc || prev.lop?.namHoc || '2026 – 2027'
              }
            }));
          }

          setAuth({
            loaded: true,
            isGuest: false,
            user: {
              name: data.ten || 'Thành viên',
              role: data.role || 'student',
              vaiTro: data.vaiTro || '',
              chucVu: data.chucVu || '',
              quyen: data.quyen || [],
              toSo: data.toSo || null,
              hocSinhId: data.hocSinhId || null,
              phuId: data.phuId || null,
              lopId: data.lopId || (data.lop?.id || null),
              tenLop: (data.isLinkedStudent || (data.role === 'student' && data.hocSinhId && data.lopId) || isT) ? (data.tenLop || data.lop?.ten || '') : '',
              namHoc: data.namHoc || (data.lop?.namHoc || '2026 – 2027'),
              isTeacher: isT,
              isSchoolAdmin: Boolean(data.isSchoolAdmin),
              isVerifiedTeacher: Boolean(data.isVerifiedTeacher || isT),
              isLinkedStudent: Boolean(data.isLinkedStudent || (data.role === 'student' && data.hocSinhId && data.lopId)),
              coQuyenCongDong: data.coQuyenCongDong === true,
              isAuthorizedStudent: !isT && isBCS
            }
          });
          return true;
        }
      }
    } catch {}
    setAuth({ loaded: true, isGuest: true, user: null });
    return false;
  }, []);

  // ─── FETCH REAL CLASS DATA ────────────────────────────────────────────────
  const fetchClassData = useCallback(async (isLoggedIn, customSlug = null) => {
    if (isLoggedIn) {
      try {
        const res = await fetch('/api/lop');
        if (res.ok) {
          const d = await res.json();
          if (d.ok) {
            setClassData(prev => ({
              ...prev,
              loaded: true,
              lop: d.lop || prev.lop || { ten: 'Lớp 10A7', namHoc: '2026 – 2027', truong: 'Trung tâm GDNN - GDTX Huyện Định Quán' },
              hocSinh: d.hocSinh || [],
              thongBao: d.thongBao || [],
              hoatDongLop: d.hoatDongLop || [],
              quyKhoan: d.quyKhoan || [],
              quyChi: d.quyChi || [],
              quyDong: d.quyDong || [],
              thuQuy: d.thuQuy || null,
              nhacNen: d.nhacNen || null,
              phienBanTkb: d.phienBanTkb || null
            }));
            if (d.nhacNen && d.nhacNen.tenBai) setRadioTitle(d.nhacNen.tenBai);
            return;
          }
        }
      } catch {}
    }

    // Guest fallback
    try {
      const slug = customSlug || (classData.lop?.slug) || '10a7';
      const res = await fetch(`/api/lop-cong-khai?lop=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const d = await res.json();
        if (d.ok && d.lop) {
          setClassData(prev => ({
            ...prev,
            loaded: true,
            lop: {
              ...d.lop,
              ten: d.lop.ten || 'Lớp 10A7',
              namHoc: d.lop.namHoc || '2026 – 2027',
              truong: d.lop.truong || 'Trung tâm GDNN - GDTX Huyện Định Quán'
            }
          }));
          return;
        }
      }
    } catch {}

    setClassData(prev => ({ ...prev, loaded: true }));
  }, [classData.lop?.slug]);

  // ─── FETCH REAL ATTENDANCE ────────────────────────────────────────────────
  const fetchAttendance = useCallback(async (customNgay, customBuoi, customLoai) => {
    if (auth.isGuest) return;
    try {
      const qNgay = customNgay || attendance.ngay || new Date().toISOString().slice(0, 10);
      const qBuoi = customBuoi || attendance.buoi || 'sang';
      const qLoai = customLoai || attendance.loai || 'chinh';
      const res = await fetch(`/api/diem-danh?ngay=${encodeURIComponent(qNgay)}&buoi=${encodeURIComponent(qBuoi)}&loai=${encodeURIComponent(qLoai)}`);
      if (res.ok) {
        const d = await res.json();
        if (d.ok && !d.an) {
          let list = d.danhSach || [];
          if ((!list || list.length === 0) && classData.hocSinh && classData.hocSinh.length > 0) {
            list = classData.hocSinh.map(hs => ({
              id: hs.id,
              soThuTu: hs.soThuTu || hs.stt,
              hoTen: hs.hoTen,
              lopNghe: hs.lopNghe,
              dienThoaiHs: hs.dienThoaiHs,
              trangThai: null,
              lyDo: ''
            }));
          }
          const coMat = list.filter(s => s.trangThai === 'co_mat').length;
          const vangCoPhep = list.filter(s => s.trangThai === 'phep' || s.trangThai === 'vang_phep').length;
          const vangKhongPhep = list.filter(s => s.trangThai === 'khong_phep' || s.trangThai === 'vang_khong_phep').length;
          const tre = list.filter(s => s.trangThai === 'tre').length;
          const tong = list.length || classData.hocSinh?.length || 0;
          const daGhi = coMat + vangCoPhep + vangKhongPhep + tre;
          const chuyenCan = daGhi > 0 ? ((coMat / daGhi) * 100).toFixed(1) : '100';

          setAttendance({
            loaded: true,
            danhSach: list,
            stats: { tong, coMat, vangCoPhep, vangKhongPhep, tre, chuyenCan },
            ngay: d.ngay || qNgay,
            buoi: (d.buoi || qBuoi).replace(/_phu$/, ''),
            loai: d.loai || qLoai,
            caNhan: d.caNhan || null
          });
        }
      }
    } catch (err) {
      console.warn('fetchAttendance error:', err);
    }
  }, [auth.isGuest, attendance.ngay, attendance.buoi, attendance.loai, classData.hocSinh]);

  // ─── FETCH LIVE CHAT ──────────────────────────────────────────────────────
  const fetchChat = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const d = await res.json();
        if (d.ok && d.tinNhan && d.tinNhan.length > 0) {
          setChatMessages(d.tinNhan);
        }
      }
    } catch {}
  }, []);

  // ─── REAL-TIME CHAT WITH SSE ───────────────────────────────────────────────
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (auth.isGuest) return;

    let pollInterval = null;

    try {
      if (typeof EventSource !== 'undefined') {
        const lastId = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1].id : 0;
        const eventSource = new EventSource(`/api/chat-stream?sauId=${lastId}`);
        eventSourceRef.current = eventSource;

        eventSource.addEventListener('connected', (event) => {
          try { console.log('SSE Connected:', JSON.parse(event.data)); } catch {}
        });

        eventSource.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.tinNhan && data.tinNhan.length > 0) {
              // Giữ tối đa 200 tin gần nhất — SSE chạy suốt phiên, không chặn sẽ phình DOM.
              setChatMessages(prev => [...prev, ...data.tinNhan].slice(-200));
            }
          } catch {}
        });

        eventSource.addEventListener('deleted', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.daXoaIds && data.daXoaIds.length > 0) {
              setChatMessages(prev => prev.filter(msg => !data.daXoaIds.includes(msg.id)));
            }
          } catch {}
        });

        eventSource.addEventListener('presence', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (typeof data.onlineCount === 'number') setOnlineCount(data.onlineCount);
          } catch {}
        });

        eventSource.addEventListener('error', () => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          if (!pollInterval) {
            pollInterval = setInterval(fetchChat, 4000);
          }
        });
      } else {
        pollInterval = setInterval(fetchChat, 4000);
      }
    } catch (error) {
      console.warn('SSE fallback to polling:', error);
      pollInterval = setInterval(fetchChat, 4000);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [auth.isGuest, fetchChat]);

  // ─── FETCH REAL GAMIFICATION & ACHIEVEMENTS ───────────────────────────────
  const fetchGamification = useCallback(async () => {
    try {
      const res = await fetch('/api/gamification');
      if (res.ok) {
        const d = await res.json();
        if (d.ok) {
          setGamification({
            loaded: true,
            allAchievements: d.allAchievements || [],
            achievements: d.achievements || [],
            streaks: d.streaks || [],
            points: d.points || { diemHienTai: 0, diemTong: 0, capDo: 1 },
            leaderboards: d.leaderboards || { weeklyStudy: [], topGamers: [], mostHelpful: [], attendanceStars: [] }
          });
        }
      }
    } catch (err) {
      console.warn('Lỗi tải gamification:', err);
    }
  }, []);

  // ─── INITIAL LIFECYCLE ────────────────────────────────────────────────────
  useEffect(() => {
    fetchAuth().then(isLoggedIn => {
      if (isLoggedIn) {
        fetchClassData(true);
        fetchChat();
        fetchGamification();
      }
    });
  }, [fetchAuth, fetchClassData, fetchChat, fetchGamification]);

  // Scroll chat to bottom ONLY when user is already near the bottom of the chat container
  // Never hijack page scroll — scroll only inside the chat box itself
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    if (isNearBottom) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages]);

  // ─── HASH ROUTING SYNC & SMOOTH SCROLLING ────────────────────────────────
  const navigateTab = useCallback((tabId, subTab = 'ban-tin') => {
    setActiveTab(tabId);
    setCurrentView('LOBBY');
    if (tabId === 'feed') {
      setFeedSubTab(subTab);
      if (subTab === 'diem-danh') setActiveChannel('📋 Sổ Điểm Danh');
      else if (subTab === 'thu-quy') setActiveChannel('💰 Quỹ Lớp Minh Bạch');
      else setActiveChannel('# Bảng tin chung');
    }
    // Intentionally no page scroll — user controls the page position

    let desired = '';
    if (tabId === 'campus') desired = '#/campus';
    else if (tabId === 'feed') {
      if (subTab === 'diem-danh') desired = '#/diem-danh';
      else if (subTab === 'thu-quy') desired = '#/thu-quy';
      else desired = '#/bang-tin-lop';
    }

    if (desired && location.hash !== desired) {
      history.pushState(null, '', location.pathname + location.search + desired);
    }
  }, []);

  // Sync URL hash <-> activeTab & feedSubTab
  useEffect(() => {
    const onHashChange = () => {
      const h = location.hash;
      if (h === '#/diem-danh' || h.startsWith('#/bang-tin-lop?tab=diem-danh')) {
        setActiveTab('feed');
        setFeedSubTab('diem-danh');
        setActiveChannel('📋 Sổ Điểm Danh');
        setCurrentView('LOBBY');
        if (!attendance.loaded) fetchAttendance();
      } else if (h === '#/thu-quy' || h.startsWith('#/bang-tin-lop?tab=thu-quy')) {
        setActiveTab('feed');
        setFeedSubTab('thu-quy');
        setActiveChannel('💰 Quỹ Lớp Minh Bạch');
        setCurrentView('LOBBY');
      } else if (h === '#/bang-tin-lop' || h.startsWith('#/bang-tin-lop') || h === '#/feed') {
        setActiveTab('feed');
        setFeedSubTab('ban-tin');
        setActiveChannel('# Bảng tin chung');
        setCurrentView('LOBBY');
      } else if (h === '#/campus' || h === '#campus-lobby' || h === '#campus' || !h || h === '#' || h === '#/') {
        setActiveTab('campus');
        setCurrentView('LOBBY');
      }
    };

    window.addEventListener('hashchange', onHashChange);
    onHashChange();
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [attendance.loaded, fetchAttendance]);

  // Load public class list on mount
  useEffect(() => {
    fetch('/api/lop-cong-khai')
      .then(r => r.json())
      .then(d => {
        if (d.ok && Array.isArray(d.danhSach) && d.danhSach.length > 0) {
          setDsLop(d.danhSach);
        }
      })
      .catch(() => {});
  }, []);

  // Close class dropdown on click outside
  useEffect(() => {
    const handleDocClick = (e) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target)) {
        setShowClassDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  // ─── SWITCH ACTIVE CLASS ──────────────────────────────────────────────────
  const handleSwitchClass = useCallback(async (targetLop) => {
    if (!targetLop) return;
    setShowClassDropdown(false);
    if (classData.lop?.id && targetLop.id && classData.lop.id === targetLop.id) return;

    try {
      const res = await fetch('/api/chuyen-lop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lopId: targetLop.id, slug: targetLop.slug })
      });
      const d = await res.json();
      if (d.ok && d.lop) {
        setClassData(prev => ({
          ...prev,
          lop: d.lop
        }));
        setAuth(prev => ({
          ...prev,
          user: prev.user ? {
            ...prev.user,
            lopId: d.lop.id,
            tenLop: d.lop.ten,
            namHoc: d.lop.namHoc
          } : null
        }));
        await fetchClassData(!auth.isGuest, d.lop.slug);
        setAttendance(prev => ({ ...prev, loaded: false, danhSach: [] }));
        if (!auth.isGuest) {
          await fetchAttendance();
        }
        navigateTab('feed', 'ban-tin');
      } else {
        alert(d.loi || d.message || 'Không thể chuyển lớp.');
      }
    } catch (e) {
      console.error('Lỗi khi chuyển lớp:', e);
    }
  }, [classData.lop?.id, auth.isGuest, fetchClassData, fetchAttendance, navigateTab]);

  // ─── DJ RADIO AUDIO CONTROL ───────────────────────────────────────────────
  const toggleRadio = () => {
    const audio = document.getElementById('bgAudio');
    if (!audio) return;

    if (radioPlaying) {
      audio.pause();
      setRadioPlaying(false);
    } else {
      audio.src = '/api/nhac-nen';
      audio.play().then(() => {
        setRadioPlaying(true);
      }).catch(err => {
        console.warn('Playback blocked or no audio source:', err);
        setRadioPlaying(false);
      });
    }
  };

  // ─── CỜ CARO THẬT QUA /api/game (PHASE 3B.1 GAME ARENA) ────────────────────
  const nguoiChoiIdCuaToi = auth.user?.isTeacher ? 999999
    : (auth.user?.hocSinhId || (auth.user?.role === 'phu' ? 800000 + (auth.user?.phuId || 1) : 100001));

  const taiDanhSachBanCaro = useCallback(async (tab = arenaTab) => {
    if (auth.isGuest) return;
    try {
      const res = await fetch(`/api/game?loai=co_caro&phamVi=${tab}`);
      const d = await res.json();
      if (d.ok) setCaroRooms(d.danhSachBan || []);
      else setCaroLoi(d.loi || '');
    } catch { /* giữ nguyên danh sách cũ */ }
  }, [auth.isGuest, arenaTab]);

  const taiPhongCaro = useCallback(async (phongId) => {
    try {
      const res = await fetch(`/api/game?phongId=${phongId}`);
      const d = await res.json();
      if (d.ok && d.phong) {
        setCaroPhong(d.phong);
        return d.phong;
      } else {
        setCaroPhong(null);
        return null;
      }
    } catch {
      return null;
    }
  }, []);

  // Quick Match: Bắt đầu tìm trận nhanh FIFO toàn trường
  const batDauTimTranNhanh = async () => {
    if (auth.isGuest) {
      if (typeof setAuthModalTab === 'function') setAuthModalTab('login');
      if (typeof setShowAuthModal === 'function') setShowAuthModal(true);
      return;
    }
    setCaroLoi('');
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'tim_tran_nhanh', loaiGame: 'co_caro' })
      });
      const d = await res.json();
      if (d.ok) {
        if ((d.matched || d.daGhep) && d.phongId) {
          const p = d.phong || await taiPhongCaro(d.phongId);
          if (p) setCaroPhong(p);
          const doiThuTen = d.doiThu?.ten || (p ? (p.isHost ? (p.guestName || p.khachTen) : (p.hostName || p.chuPhongTen)) : 'Đối thủ');
          const doiThuLop = d.doiThu?.lopTen || (p ? (p.lopTen || '') : '');
          setMatchFoundData({
            doiThu: { ten: doiThuTen, lopTen: doiThuLop },
            banTen: p?.tenBan || `Bàn #${d.phongId}`
          });
          setQuickWaitPhongId(null);
          setQuickState('MATCH_FOUND');
          setMatchCountdown(3);
        } else if ((d.waiting || d.choDoi) && d.phongId) {
          setQuickWaitPhongId(d.phongId);
          setQueueTimer(0);
          setQuickState('QUEUE_WAITING');
        } else if (d.resumed && d.phongId) {
          const p = d.phong || await taiPhongCaro(d.phongId);
          if (p) setCaroPhong(p);
          setQuickWaitPhongId(null);
          setQuickState('GAME_ACTIVE');
        }
      } else {
        setCaroLoi(d.loi || 'Không thể tìm trận nhanh lúc này.');
      }
    } catch {
      setCaroLoi('Mất kết nối máy chủ.');
    }
  };

  const handleQuickMatch = () => {
    batDauTimTranNhanh();
  };

  // Quick Match: Hủy tìm trận nhanh
  const huyTimTranNhanh = async () => {
    if (quickWaitPhongId) {
      try {
        await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hanhDong: 'huy_tim_tran', phongId: quickWaitPhongId })
        });
      } catch { /* bỏ qua */ }
    }
    setQuickWaitPhongId(null);
    setQuickState('LOBBY');
    setQueueTimer(0);
    taiDanhSachBanCaro();
  };

  // Polling và tăng timer khi đang ở QUEUE_WAITING (mỗi 1s tăng timer, mỗi 1.8s kiểm tra phòng)
  useEffect(() => {
    if (quickState !== 'QUEUE_WAITING' || !quickWaitPhongId) return;
    const timerIv = setInterval(() => {
      setQueueTimer(t => t + 1);
    }, 1000);

    const pollIv = setInterval(async () => {
      try {
        const res = await fetch(`/api/game?phongId=${quickWaitPhongId}`);
        const d = await res.json();
        if (d.ok && d.phong) {
          if (d.phong.trangThai === 'dang_choi') {
            setCaroPhong(d.phong);
            const doiThuTen = d.phong.chuPhongId === nguoiChoiIdCuaToi ? d.phong.khachTen : d.phong.chuPhongTen;
            const doiThuLop = d.phong.chuPhongId === nguoiChoiIdCuaToi ? (d.phong.khachLopTen || 'Khác') : (d.phong.lopTen || 'Khác');
            setMatchFoundData({
              doiThu: { ten: doiThuTen, lopTen: doiThuLop },
              banTen: d.phong.tenBan || `Bàn #${d.phong.id}`
            });
            setQuickWaitPhongId(null);
            setQuickState('MATCH_FOUND');
            setMatchCountdown(3);
          } else if (d.phong.trangThai === 'da_huy') {
            setQuickWaitPhongId(null);
            setQuickState('LOBBY');
            setCaroLoi('Phòng chờ đã bị hủy.');
          }
        }
      } catch { /* tiếp tục chờ */ }
    }, 1800);

    return () => {
      clearInterval(timerIv);
      clearInterval(pollIv);
    };
  }, [quickState, quickWaitPhongId, nguoiChoiIdCuaToi]);

  // Đếm ngược 3-2-1 khi MATCH_FOUND
  useEffect(() => {
    if (quickState !== 'MATCH_FOUND') return;
    if (matchCountdown <= 0) {
      setQuickState('GAME_ACTIVE');
      return;
    }
    const t = setTimeout(() => {
      setMatchCountdown(c => c - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [quickState, matchCountdown]);

  // Khi đang đứng trong một phòng cờ → poll trạng thái mỗi 1.8s để thấy nước đi đối thủ
  useEffect(() => {
    if (!caroPhong || !caroPhong.id) return;
    if (caroPhong.trangThai === 'ket_thuc' || caroPhong.trangThai === 'hoa') return;
    const iv = setInterval(() => taiPhongCaro(caroPhong.id), 1800);
    return () => clearInterval(iv);
  }, [caroPhong?.id, caroPhong?.trangThai, taiPhongCaro]);

  // Khi mở phòng GAME_CARO hoặc mở Navigator GAME → nạp danh sách bàn thật nếu đã đăng nhập.
  useEffect(() => {
    if (activeRoom?.type === 'GAME_CARO') {
      taiDanhSachBanCaro();
    }
  }, [activeRoom, taiDanhSachBanCaro]);

  useEffect(() => {
    if ((navExpandedCat === 'GAME' || mobileSelectedCat === 'GAME' || viewAllCat === 'GAME') && !auth.isGuest && caroRooms === null) {
      taiDanhSachBanCaro();
    }
  }, [navExpandedCat, mobileSelectedCat, viewAllCat, auth.isGuest, caroRooms, taiDanhSachBanCaro]);

  const taoBanCaro = async () => {
    if (auth.isGuest) { setShowAuthGate(true); return; }
    setCaroLoi('');
    setTaoBanDangGui(true);
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hanhDong: 'tao_ban',
          loaiGame: 'co_caro',
          phamVi: taoBanScope,
          tenBan: taoBanTen.trim() || undefined
        })
      });
      const d = await res.json();
      if (d.ok && d.phong) {
        setCaroPhong(d.phong);
        setActiveRoom({ id: 'caro-arena', type: 'GAME_CARO', title: '⚔️ Đấu Trường Cờ Caro 15x15' });
        setCurrentView('ROOM_ACTIVE');
        setQuickState('GAME_ACTIVE');
        setShowTaoBanModal(false);
        setTaoBanTen('');
        taiDanhSachBanCaro();
      } else {
        setCaroLoi(d.loi || 'Không tạo được bàn.');
      }
    } catch {
      setCaroLoi('Mất kết nối máy chủ.');
    } finally {
      setTaoBanDangGui(false);
    }
  };

  const vaoBanCaro = async (phongId) => {
    if (auth.isGuest) { setShowAuthGate(true); return; }
    setCaroLoi('');
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'vao_ban', phongId })
      });
      const d = await res.json();
      if (d.ok) {
        await taiPhongCaro(phongId);
        setActiveRoom({ id: 'caro-arena', type: 'GAME_CARO', title: '⚔️ Đấu Trường Cờ Caro 15x15' });
        setCurrentView('ROOM_ACTIVE');
        setQuickState('GAME_ACTIVE');
      } else {
        setCaroLoi(d.loi || 'Không vào được bàn.');
      }
    } catch {
      setCaroLoi('Mất kết nối máy chủ.');
    }
  };

  const danhCoCaro = async (r, c) => {
    if (!caroPhong || caroPhong.trangThai !== 'dang_choi') return;
    if (caroPhong.luotDiId !== nguoiChoiIdCuaToi) return;
    if (caroPhong.banCo?.[r]?.[c]) return;
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'danh_co', phongId: caroPhong.id, r, c })
      });
      const d = await res.json();
      if (d.ok) taiPhongCaro(caroPhong.id);
      else setCaroLoi(d.loi || '');
    } catch { setCaroLoi('Mất kết nối máy chủ.'); }
  };

  const vanMoiCaro = async () => {
    if (!caroPhong) return;
    setCaroLoi('');
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'van_moi', phongId: caroPhong.id })
      });
      const d = await res.json();
      if (d.ok) taiPhongCaro(caroPhong.id);
      else setCaroLoi(d.loi || 'Chưa mở được ván mới.');
    } catch { setCaroLoi('Mất kết nối máy chủ.'); }
  };

  const roiBanCaro = async () => {
    if (!caroPhong) return;
    try {
      await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'roi_ban', phongId: caroPhong.id })
      });
    } catch { /* bỏ qua */ }
    setCaroPhong(null);
    setQuickState('LOBBY');
    taiDanhSachBanCaro();
  };

  const thoatPhongGameArena = () => {
    if (quickState === 'QUEUE_WAITING' && quickWaitPhongId) {
      huyTimTranNhanh();
    }
    if (caroPhong) {
      roiBanCaro();
    }
    setQuickState('LOBBY');
    setCurrentView('LOBBY');
  };

  // ─── PHÒNG ĐỘNG LIÊN LỚP — mọi học sinh tạo được, lớp nào cũng vào được ──
  const taiDanhSachPhong = useCallback(async () => {
    try {
      // Khách → /api/campus (sanitized, chỉ phòng toàn trường, không danh tính).
      // Đã đăng nhập → /api/phong (đầy đủ, kèm phòng lớp mình + chủ phòng).
      const res = await fetch(auth.isGuest ? '/api/campus' : '/api/phong');
      const d = await res.json();
      if (d.ok) {
        const rawPhongs = d.phongs || [];
        const normalized = rawPhongs.map(p => normalizeCampusRoom(p, auth.isGuest));
        setDsPhong(normalized);
        setDangHoatDong(d.dangHoatDong || 0);
        if (d.suKien) setDsSuKien(d.suKien);
        const sanh = normalized.find(p => p.chuPhongKhoa === 'he-thong');
        if (sanh) setSanhId(sanh.id);
      }
    } catch { /* giữ nguyên danh sách cũ nếu lỗi mạng */ }
  }, [auth.isGuest]);

  // Sự kiện campus — endpoint public, ai cũng đọc được.
  const taiSuKien = useCallback(async () => {
    try {
      const res = await fetch('/api/su-kien');
      const d = await res.json();
      if (d.ok) setDsSuKien(d.suKien || []);
    } catch { /* bỏ qua */ }
  }, []);

  // Phase 4A: Campus Highlights — dữ liệu THẬT từ /api/campus-highlights (Server-authoritative, zero localStorage)
  const taiCampusHighlights = useCallback(async () => {
    try {
      const res = await fetch('/api/campus-highlights');
      const d = await res.json();
      if (d.ok && Array.isArray(d.highlights)) {
        setCampusHighlights(d.highlights);
      }
    } catch { /* giữ nguyên dữ liệu cũ nếu lỗi mạng */ }
  }, []);

  // Phase 4A: Teacher Announcements — dữ liệu THẬT từ /api/campus-thong-bao
  const taiTeacherAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/campus-thong-bao');
      const d = await res.json();
      if (d.ok && Array.isArray(d.thongBao)) {
        setTeacherAnnouncements(d.thongBao);
      }
    } catch { /* giữ nguyên dữ liệu cũ nếu lỗi mạng */ }
  }, []);

  const moBangTinCongDong = () => {
    if (auth.isGuest) {
      setAuthModalTab('login');
      setShowAuthModal(true);
      return;
    }
    if (auth.user?.coQuyenCongDong || auth.user?.isTeacher) {
      navigateTab('feed', 'ban-tin');
      return;
    }
    setShowCommunityGate(true);
  };

  useEffect(() => {
    if (!auth.loaded || activeTab !== 'feed' || auth.user?.coQuyenCongDong) return;
    navigateTab('campus');
    if (auth.isGuest) setShowAuthGate(true);
    else setShowCommunityGate(true);
  }, [auth.loaded, auth.isGuest, auth.user?.coQuyenCongDong, activeTab, navigateTab]);

  useEffect(() => {
    if (activeTab !== 'campus') return;
    taiDanhSachPhong();
    taiSuKien();
    taiCampusHighlights();
    taiTeacherAnnouncements();
    const iv = setInterval(taiDanhSachPhong, 15000);
    const iv2 = setInterval(taiSuKien, 60000);
    const iv3 = setInterval(taiCampusHighlights, 30000);
    const iv4 = setInterval(taiTeacherAnnouncements, 30000);
    return () => { clearInterval(iv); clearInterval(iv2); clearInterval(iv3); clearInterval(iv4); };
  }, [activeTab, taiDanhSachPhong, taiSuKien, taiCampusHighlights, taiTeacherAnnouncements]);

  const taoPhongMoi = async () => {
    if (auth.isGuest) { setAuthModalTab('login'); setShowAuthModal(true); return; }
    if (tpDangTao || tpForm.ten.trim().length < 2) return;
    if (tpForm.access_mode === 'password' && !tpForm.matKhau?.trim()) {
      setTpLoi('Vui lòng nhập mật khẩu cho phòng.');
      return;
    }
    setTpDangTao(true); setTpLoi('');
    try {
      const res = await fetch('/api/phong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'tao', ...tpForm, ten: tpForm.ten.trim() })
      });
      const d = await res.json();
      if (d.ok && d.phong) {
        setShowTaoPhong(false);
        setShowInlineTaoPhong(false);
        setTpForm({ ten: '', loai: 'chat', phamVi: 'truong', moTa: '', videoUrl: '', nhacUrl: '', access_mode: 'public', matKhau: '', sucChua: 8 });
        setPhongChat([]);
        phongSauIdRef.current = 0;
        setPhongThanhVien([{
          ten: auth.user?.ten || d.phong.chuPhongTen || 'Chủ phòng',
          vaiTro: (auth.user?.role === 'teacher' || auth.user?.role === 'admin') ? 'giao_vien' : 'hoc_sinh',
          vaiTroPhong: 'host',
          laChuPhong: 1
        }]);
        setPhongLoi('');
        setPhongInput('');
        try {
          const cu = JSON.parse(localStorage.getItem('phong_gan_day') || '[]');
          const ds = [{ id: d.phong.id, ten: d.phong.ten }, ...(Array.isArray(cu) ? cu : []).filter(x => x && x.id !== d.phong.id)].slice(0, 5);
          localStorage.setItem('phong_gan_day', JSON.stringify(ds));
        } catch { }
        setActiveRoom({ id: d.phong.id, type: 'PHONG', title: d.phong.ten, phong: d.phong });
        setCurrentView('ROOM_ACTIVE');
        taiDanhSachPhong();
      } else {
        setTpLoi(d.loi || 'Không tạo được phòng. Thử lại sau.');
      }
    } catch { setTpLoi('Mất kết nối máy chủ.'); }
    finally { setTpDangTao(false); }
  };

  const vaoPhong = async (p, matKhau = null) => {
    if (auth.isGuest) { setAuthModalTab('login'); setShowAuthModal(true); return; }
    if (p.access_mode === 'password' && !matKhau) {
      setSelectedPasswordRoom(p);
      setShowRoomPasswordModal(true);
      return;
    }
    try {
      const res = await fetch('/api/phong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'vao', phongId: p.id, ...(matKhau ? { matKhau } : {}) })
      });
      const d = await res.json();
      if (d.ok) {
        setShowRoomPasswordModal(false);
        setSelectedPasswordRoom(null);
        setPhongChat([]); phongSauIdRef.current = 0;
        setPhongThanhVien([]); setPhongLoi(''); setPhongInput('');
        try {
          const cu = JSON.parse(localStorage.getItem('phong_gan_day') || '[]');
          const ds = [{ id: p.id, ten: p.ten }, ...(Array.isArray(cu) ? cu : []).filter(x => x && x.id !== p.id)].slice(0, 5);
          localStorage.setItem('phong_gan_day', JSON.stringify(ds));
        } catch { }
        setActiveRoom({ id: p.id, type: 'PHONG', title: (d.phong || p).ten, phong: d.phong || p });
        setCurrentView('ROOM_ACTIVE');
        return null;
      } else {
        if (res.status === 403 && p.access_mode === 'password') {
          return 'Mật khẩu phòng không chính xác.';
        }
        if (res.status === 409) {
          return 'Phòng đã đạt sức chứa tối đa.';
        }
        return d.loi || 'Không vào được phòng này.';
      }
    } catch {
      return 'Mất kết nối máy chủ — chưa vào được phòng.';
    }
  };

  const roiPhongHienTai = async () => {
    const id = activeRoom?.id;
    try {
      await fetch('/api/phong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'roi', phongId: id })
      });
    } catch { /* bỏ qua */ }
    setIsFocusMode(false);
    setCurrentView('LOBBY');
    taiDanhSachPhong();
  };

  const dongPhongHienTai = async () => {
    const id = activeRoom?.id;
    try {
      const res = await fetch('/api/phong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'dong', phongId: id })
      });
      const d = await res.json();
      if (!d.ok) { alert(d.loi || 'Không đóng được phòng.'); return; }
    } catch { /* bỏ qua */ }
    setIsFocusMode(false);
    setCurrentView('LOBBY');
    taiDanhSachPhong();
  };

  // Hành động quản trị phòng (governance): set_co_host / kick / policy / grant / doi_mat_khau...
  const hanhDongPhong = async (hanhDong, extra = {}) => {
    try {
      const res = await fetch('/api/phong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong, phongId: activeRoom?.id, ...extra })
      });
      const d = await res.json();
      if (d.ok) setPhongDetailTick(t => t + 1);
      return d;
    } catch {
      return { ok: false, loi: 'Mất kết nối máy chủ.' };
    }
  };

  const guiTinPhong = async (e) => {
    e.preventDefault();
    const text = phongInput.trim();
    if (!text || phongDangGui || !activeRoom?.id) return;
    setPhongDangGui(true); setPhongLoi('');
    try {
      const res = await fetch('/api/phong-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phongId: activeRoom.id, noiDung: text })
      });
      const d = await res.json();
      if (d.ok && d.tinNhan) {
        phongSauIdRef.current = Math.max(phongSauIdRef.current, d.tinNhan.id);
        setPhongChat(prev => [...prev, d.tinNhan].slice(-200));
        setPhongInput('');
      } else {
        setPhongLoi(d.loi || 'Không gửi được tin nhắn.');
      }
    } catch { setPhongLoi('Mất kết nối máy chủ.'); }
    finally { setPhongDangGui(false); }
  };

  // Khi đang trong một phòng động: poll chi tiết (10s), tin nhắn (3s), heartbeat (20s).
  useEffect(() => {
    if (currentView !== 'ROOM_ACTIVE' || activeRoom?.type !== 'PHONG') return;
    const phongId = activeRoom.id;
    let alive = true;
    const taiChiTiet = async () => {
      try {
        const res = await fetch(`/api/phong?id=${phongId}`);
        const d = await res.json();
        if (!alive) return;
        if (d.ok) {
          setPhongThanhVien(d.thanhVien || []);
          setPhongMinhKhoa(d.minhKhoa || '');
          setPhongMyCaps(d.myCaps || {});
          setPhongVaiTro(d.vaiTroPhong || 'member');
          setPhongIsStaff(Boolean(d.isStaff || d.canControl));
          if (d.policies) setPhongPolicies(d.policies);
          if (d.grants) setPhongGrants(d.grants);
          setActiveRoom(prev => (prev && prev.type === 'PHONG' && prev.id === phongId ? { ...prev, phong: d.phong, title: d.phong.ten } : prev));
        } else if (res.status === 404 || d.code === 'room_banned') {
          setCurrentView('LOBBY');
          taiDanhSachPhong();
        }
      } catch { /* giữ màn hình, thử lại chu kỳ sau */ }
    };
    const taiTin = async () => {
      try {
        const res = await fetch(`/api/phong-chat?phongId=${phongId}&sauId=${phongSauIdRef.current}`);
        const d = await res.json();
        if (!alive) return;
        if (d.ok && d.tinNhan?.length) {
          phongSauIdRef.current = d.tinNhan[d.tinNhan.length - 1].id;
          setPhongChat(prev => [...prev, ...d.tinNhan].slice(-200));
        }
      } catch { /* bỏ qua */ }
    };
    const nhip = () => fetch('/api/phong', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hanhDong: 'nhip', phongId })
    }).catch(() => {});
    taiChiTiet(); taiTin(); nhip();
    const iv1 = setInterval(taiChiTiet, 10000);
    const iv2 = setInterval(taiTin, 3000);
    const iv3 = setInterval(nhip, 20000);
    return () => { alive = false; clearInterval(iv1); clearInterval(iv2); clearInterval(iv3); };
  }, [currentView, activeRoom?.type, activeRoom?.id, taiDanhSachPhong, phongDetailTick]);

  // Cuộn chat phòng xuống cuối khi có tin mới.
  useEffect(() => {
    phongChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [phongChat]);

  // Chat sảnh TOÀN TRƯỜNG (phòng hệ thống 'he-thong') — poll tin mới mỗi 4s.
  useEffect(() => {
    if (activeTab !== 'campus' || auth.isGuest || !sanhId) return;
    let alive = true;
    const taiTinSanh = async () => {
      try {
        const res = await fetch(`/api/phong-chat?phongId=${sanhId}&sauId=${sanhSauIdRef.current}`);
        const d = await res.json();
        if (!alive) return;
        if (d.ok && d.tinNhan?.length) {
          sanhSauIdRef.current = d.tinNhan[d.tinNhan.length - 1].id;
          setSanhChat(prev => [...prev, ...d.tinNhan].slice(-200));
        }
      } catch { /* bỏ qua lỗi mạng */ }
    };
    taiTinSanh();
    const iv = setInterval(taiTinSanh, 4000);
    return () => { alive = false; clearInterval(iv); };
  }, [activeTab, auth.isGuest, sanhId]);

  useEffect(() => {
    sanhChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sanhChat]);

  const guiTinSanh = async (e) => {
    e.preventDefault();
    if (auth.isGuest) { setShowAuthGate(true); return; }
    const text = chatInput.trim();
    if (!text || chatSending || !sanhId) return;
    setChatSending(true); setChatError('');
    try {
      const res = await fetch('/api/phong-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phongId: sanhId, noiDung: text })
      });
      const d = await res.json();
      if (d.ok && d.tinNhan) {
        sanhSauIdRef.current = Math.max(sanhSauIdRef.current, d.tinNhan.id);
        setSanhChat(prev => [...prev, d.tinNhan].slice(-200));
        setChatInput('');
      } else {
        setChatError(d.loi || 'Không gửi được tin nhắn. Thử lại sau.');
      }
    } catch {
      setChatError('Mất kết nối máy chủ — tin nhắn chưa được gửi.');
    } finally { setChatSending(false); }
  };

  // ─── XUẤT SỔ QUỸ RA CSV (UTF-8 BOM để Excel đọc đúng tiếng Việt) ─────────
  const xuatSoQuyCSV = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const dong = [
      ['SỔ QUỸ LỚP', classData.lop?.ten || '10A7'],
      ['Ngày xuất', new Date().toLocaleDateString('vi-VN')],
      [],
      ['TỔNG THU (VND)', financialSummary.thu],
      ['TỔNG CHI (VND)', financialSummary.chi],
      ['TỒN QUỸ (VND)', financialSummary.ton],
      [],
      ['DANH SÁCH KHOẢN THU'],
      ['Tên khoản thu', 'Đã thu (VND)'],
      ...(financialSummary.khoanList || []).map(k => [k.ten, k.tongDaThu || k.soTienMoiEm || 0]),
      [],
      ['DANH SÁCH KHOẢN CHI'],
      ['Ngày', 'Nội dung', 'Số tiền (VND)'],
      ...(financialSummary.chiList || []).map(c => [formatDateVN(c.ngay), c.noiDung, c.soTien])
    ];
    const csv = '\uFEFF' + dong.map(r => r.map(esc).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `so-quy-${String(classData.lop?.ten || 'lop').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  };

  // ─── FINANCIAL TOTALS ─────────────────────────────────────────────────────
  const financialSummary = useMemo(() => {
    const tq = classData.thuQuy;
    const thu = tq ? tq.tongThu : (classData.quyKhoan || []).reduce((acc, k) => acc + (Number(k.tongDaThu || k.soTien || k.so_tien) || 0), 0);
    const chi = tq ? tq.tongChi : (classData.quyChi || []).reduce((acc, c) => acc + (Number(c.soTien || c.so_tien) || 0), 0);
    const ton = tq ? tq.tonQuy : (thu - chi);
    const khoanList = tq ? tq.khoan : (classData.quyKhoan || []);
    const chiList = tq ? tq.chi : (classData.quyChi || []);
    const totalCount = classData.hocSinh?.length || 0;
    return { thu, chi, ton, khoanList, chiList, totalCount };
  }, [classData.thuQuy, classData.quyKhoan, classData.quyChi, classData.quyDong, classData.hocSinh]);

  // ─── DỮ LIỆU SỐNG CHO CAMPUS HERO & HOT NOW — suy ra từ /api/phong THẬT ───
  // Không bịa số liệu: chỉ hiển thị khi phòng có người (heartbeat < 90 giây).
  const phongCongDong = (dsPhong || []).filter(p => p.chuPhongKhoa !== 'he-thong');
  const phongXepTheoDoDong = [...phongCongDong].sort((a, b) => (b.soNguoi || 0) - (a.soNguoi || 0));
  const phongDongNhat = phongXepTheoDoDong.find(p => (p.soNguoi || 0) > 0) || null;
  const phongDangHot = phongXepTheoDoDong.filter(p => (p.soNguoi || 0) > 0).slice(0, 8);
  // "Gần đây" — kiểm tra mọi id trong localStorage với dữ liệu server hiện tại
  // (phòng đã đóng / bị xoá sẽ tự rơi ra, không tin localStorage làm chuẩn).
  let phongGanDayDs = [];
  try {
    const raw = JSON.parse(localStorage.getItem('phong_gan_day') || '[]');
    phongGanDayDs = (Array.isArray(raw) ? raw : [])
      .map(g => phongCongDong.find(p => p.id === g?.id)).filter(Boolean).slice(0, 5);
  } catch { }
  const phongGanDay = phongGanDayDs[0] || null;

  // Sự kiện campus suy ra cho hero/section — dữ liệu thật từ /api/su-kien.
  const skDangDienRa = dsSuKien.find(s => s.trangThai === 'dang_dien_ra' && s.noiBat)
    || dsSuKien.find(s => s.trangThai === 'dang_dien_ra') || null;
  const skSapToi = dsSuKien.filter(s => s.trangThai === 'sap_dien_ra')
    .sort((a, b) => (a.conLaiPhut || 0) - (b.conLaiPhut || 0))[0] || null;
  const skHomNay = dsSuKien.filter(s => s.homNay && s.trangThai !== 'da_ket_thuc');

  // ─── "DÀNH CHO BẠN" — selector thuần, tách khỏi JSX ─────────────────────
  // Ưu tiên: phòng gần đây còn mở → sự kiện sắp diễn ra → phòng đông nhất.
  const deXuatChoBan = (() => {
    const ds = [];
    phongGanDayDs.forEach(p => ds.push({ kieu: 'gan-day', phong: p }));
    if (skSapToi) ds.push({ kieu: 'su-kien', sk: skSapToi });
    const hotKhacGanDay = phongDangHot.filter(p => !phongGanDayDs.some(g => g.id === p.id)).slice(0, 3);
    hotKhacGanDay.forEach(p => ds.push({ kieu: 'phong', phong: p }));
    return ds.slice(0, 6);
  })();

  // Điều hướng bàn phím cho tab rail (WAI-ARIA tabs: ←/→ chuyển tab).
  const RAIL_TABS = ['chat', 'nhac', 'su-kien'];
  const xuLyPhimTabRail = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = RAIL_TABS.indexOf(railTab);
    const ke = RAIL_TABS[(i + (e.key === 'ArrowRight' ? 1 : RAIL_TABS.length - 1)) % RAIL_TABS.length];
    setRailTab(ke);
    document.getElementById(`railtab-${ke}`)?.focus();
  };

  // ─── ACTIVITY ROOM NAVIGATOR HELPER (REGION 2) ───────────────────────────
  const renderRoomNavList = (catId, isMobile = false) => {
    let rooms = [];
    let emptyMsg = '';
    let createText = '';
    let onCreate = null;

    if (catId === 'CINEMA') {
      rooms = phongCongDong.filter(p => p.loai === 'video');
      emptyMsg = 'Chưa có phòng xem';
      createText = '+ Tạo phòng';
      onCreate = () => {
        if (auth.isGuest) { setShowAuthGate(true); return; }
        setTpLoi('');
        setTpForm(f => ({ ...f, loai: 'video', ten: '' }));
        setShowTaoPhong(true);
        if (isMobile) setMobileSelectedCat(null);
      };
    } else if (catId === 'GAME') {
      const dsCaro = Array.isArray(caroRooms) ? caroRooms : [];
      const isLoading = !auth.isGuest && caroRooms === null;
      emptyMsg = 'Chưa có bàn cờ đang mở';
      createText = '+ Tạo bàn';
      onCreate = () => {
        if (auth.isGuest) { setShowAuthGate(true); return; }
        if (isMobile) setMobileSelectedCat(null);
        setActiveRoom({ id: 'caro-arena', type: 'GAME_CARO', title: '⚔️ Đấu Trường Cờ Caro 15x15' });
        setCurrentView('ROOM_ACTIVE');
        taoBanCaro();
      };
      const onVaoArena = () => {
        if (auth.isGuest) { setShowAuthGate(true); return; }
        if (isMobile) setMobileSelectedCat(null);
        setActiveRoom({ id: 'caro-arena', type: 'GAME_CARO', title: '⚔️ Đấu Trường Cờ Caro 15x15' });
        setCurrentView('ROOM_ACTIVE');
        taiDanhSachBanCaro();
      };
      const onQuickMatch = () => {
        if (auth.isGuest) { setShowAuthGate(true); return; }
        if (isMobile) setMobileSelectedCat(null);
        setActiveRoom({ id: 'caro-arena', type: 'GAME_CARO', title: '⚔️ Đấu Trường Cờ Caro 15x15' });
        setCurrentView('ROOM_ACTIVE');
        batDauTimTranNhanh();
      };

      return (
        <div id={`room-nav-list-${catId}`} className="flex flex-col gap-2 pt-1 pb-2">
          {/* Child game experience: Caro 15x15 */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Caro 15×15</span>
                {!auth.isGuest && dsCaro.length > 0 && (
                  <span className="text-[10px] text-amber-300 font-semibold">● {dsCaro.length} bàn</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={onQuickMatch}
                  aria-label="Quick Match Caro 15x15"
                  className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-black font-extrabold text-[10px] hover:opacity-90 active:scale-95 transition-all">
                  ⚡ Quick Match
                </button>
                <button onClick={onCreate}
                  aria-label="Tạo bàn cờ mới"
                  className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] active:scale-95 transition-all">
                  + Tạo bàn
                </button>
              </div>
            </div>
          </div>

          {auth.isGuest ? (
            <div id={`guest-nav-${catId}`} className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-center flex flex-col gap-1.5">
              <p className="text-[11px] text-slate-400">Đăng nhập để tham gia đấu trường</p>
              <button onClick={() => setShowAuthGate(true)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-black font-extrabold text-[11px] shadow-sm hover:opacity-90 active:scale-95 transition-all">
                Đăng nhập
              </button>
            </div>
          ) : isLoading ? (
            <div id={`loading-nav-${catId}`} className="px-3 py-3 rounded-xl bg-white/5 border border-white/5 text-center flex items-center justify-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div>
              <span className="text-[11px] text-slate-400 font-medium">Đang tải...</span>
            </div>
          ) : dsCaro.length === 0 ? (
            <div id={`empty-nav-${catId}`} className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-center flex flex-col gap-1.5">
              <p className="text-[11px] text-slate-400 mb-1">{emptyMsg}</p>
              <button onClick={onVaoArena}
                className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-black font-extrabold text-[11px] shadow-sm hover:opacity-90 active:scale-95 transition-all">
                Vào đấu trường
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {dsCaro.slice(0, 5).map(b => (
                <div key={b.id} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-[#0D111A] border border-white/5 hover:border-white/15 transition-all">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">Bàn #{b.id}</p>
                    <p className="text-[10px] text-amber-300 font-medium">
                      {b.trangThai === 'dang_choi' ? 'Đang đấu' : 'Chờ đối thủ'}
                    </p>
                  </div>
                  <button onClick={() => {
                    if (auth.isGuest) { setShowAuthGate(true); return; }
                    if (isMobile) setMobileSelectedCat(null);
                    vaoBanCaro(b.id);
                  }}
                    className="px-3 py-1 rounded-lg bg-[#00F2FE] text-black font-black text-[11px] hover:bg-[#00e1ec] active:scale-95 transition-all">
                    Vào
                  </button>
                </div>
              ))}
              {dsCaro.length > 5 && (
                <button onClick={() => { if (isMobile) setMobileSelectedCat(null); setViewAllCat(catId); }}
                  id={`btn-view-all-${catId}`}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/20 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all">
                  <span>Xem tất cả {dsCaro.length} bàn</span>
                  <span>→</span>
                </button>
              )}
              <div className="flex items-center justify-between pt-1 gap-2">
                <button onClick={onVaoArena} className="text-[11px] text-[#00F2FE] hover:underline font-bold">
                  Vào đấu trường →
                </button>
                <button onClick={onCreate} className="text-[11px] text-amber-300 hover:underline font-bold">
                  {createText}
                </button>
              </div>
            </div>
          )}
        </div>
      );
    } else if (catId === 'LOFI') {
      rooms = phongCongDong.filter(p => p.loai === 'nhac');
      emptyMsg = 'Chưa có phòng nhạc';
      createText = '+ Tạo phòng';
      onCreate = () => {
        if (auth.isGuest) { setShowAuthGate(true); return; }
        setTpLoi('');
        setTpForm(f => ({ ...f, loai: 'nhac', ten: '' }));
        setShowTaoPhong(true);
        if (isMobile) setMobileSelectedCat(null);
      };
    } else if (catId === 'CHAT') {
      rooms = phongCongDong.filter(p => p.loai === 'chat');
      emptyMsg = 'Chưa có phòng chat';
      createText = '+ Tạo phòng';
      onCreate = () => {
        if (auth.isGuest) { setShowAuthGate(true); return; }
        setTpLoi('');
        setTpForm(f => ({ ...f, loai: 'chat', ten: '' }));
        setShowTaoPhong(true);
        if (isMobile) setMobileSelectedCat(null);
      };
    }

    const maxRooms = rooms.slice(0, 5);

    return (
      <div id={`room-nav-list-${catId}`} className="flex flex-col gap-2 pt-1 pb-2">
        {catId === 'CHAT' && (
          <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 hover:border-teal-500/40 transition-all">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">Sảnh Trò Chuyện</p>
              <p className="text-[10px] text-teal-300 font-medium">Toàn trường</p>
            </div>
            <button onClick={() => { setRailTab('chat'); if (isMobile) setMobileSelectedCat(null); }}
              className="px-3 py-1 rounded-lg bg-[#00F2FE] text-black font-black text-[11px] hover:bg-[#00e1ec] active:scale-95 transition-all">
              Vào
            </button>
          </div>
        )}

        {rooms.length === 0 ? (
          <div id={`empty-nav-${catId}`} className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-center">
            <p className="text-[11px] text-slate-400 mb-1.5">{emptyMsg}</p>
            <button onClick={onCreate}
              className="text-[11px] text-[#00F2FE] hover:underline font-bold">
              {createText}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {maxRooms.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-[#0D111A] border border-white/5 hover:border-white/15 transition-all">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{p.ten}</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {(p.soNguoi || 0) > 0 ? (
                      <span className="text-emerald-400 font-bold">{p.soNguoi} đang {catId === 'CINEMA' ? 'xem' : (catId === 'LOFI' ? 'nghe' : 'tham gia')}</span>
                    ) : null}
                  </p>
                </div>
                <button onClick={() => { if (isMobile) setMobileSelectedCat(null); vaoPhong(p); }}
                  className="px-3 py-1 rounded-lg bg-[#00F2FE] text-black font-black text-[11px] hover:bg-[#00e1ec] active:scale-95 transition-all">
                  Vào
                </button>
              </div>
            ))}
            {rooms.length > 5 && (
              <button onClick={() => { if (isMobile) setMobileSelectedCat(null); setViewAllCat(catId); }}
                id={`btn-view-all-${catId}`}
                className="w-full py-1.5 px-2.5 rounded-lg bg-[#00F2FE]/10 hover:bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/20 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all">
                <span>Xem tất cả {rooms.length} phòng</span>
                <span>→</span>
              </button>
            )}
            <div className="flex items-center justify-between pt-1 gap-2">
              <span className="text-[10px] text-slate-400 font-medium">
                {rooms.length > 0 && `${rooms.length} phòng`}
                {rooms.length > 5 && (
                  <button onClick={() => { if (isMobile) setMobileSelectedCat(null); setViewAllCat(catId); }}
                    className="text-[#00F2FE] hover:underline font-bold ml-1">
                    · Xem tất cả →
                  </button>
                )}
              </span>
              <button onClick={onCreate} className="text-[11px] text-[#00F2FE] hover:underline font-bold">
                {createText}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── USER PROFILE DROPDOWN (STUDENT / TEACHER PORTAL) ─────────────────────
  const renderUserProfileDropdown = () => (
    <div className="relative">
      <button
        type="button"
        id="btn-user-menu"
        data-id="btn-user-profile-menu"
        onClick={() => setShowUserMenu(!showUserMenu)}
        title={auth.user?.name ? `${auth.user.name} • Menu học sinh` : "Hồ sơ cá nhân & Menu học sinh"}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-[#151A23] border border-white/10 hover:border-[#00F2FE]/50 transition-all hover:scale-105 active:scale-95 focus:outline-none shadow-sm group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00F2FE] to-[#8B5CF6] p-[1.5px] relative">
          <img src={currentAvatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0B0E14] shadow-sm"></span>
        </div>
        <div className="hidden xl:flex flex-col text-left pr-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-white group-hover:text-[#00F2FE] transition-colors leading-tight truncate max-w-[100px]">
              {auth.user?.name ? auth.user.name.split(' ').slice(-2).join(' ') : 'Học sinh'}
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#00F2FE]/20 text-[#00F2FE] text-[9px] font-black border border-[#00F2FE]/30">
              Lv.{gamification.points?.capDo || 1}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 leading-tight">
            {auth.user?.isTeacher ? 'GVCN' : (auth.user?.chucVu || (auth.user?.isLinkedStudent ? (auth.user?.tenLop || 'Lớp 10A7') : 'Thành viên'))}
          </span>
        </div>
        <svg className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${showUserMenu ? 'rotate-180 text-[#00F2FE]' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Click-away backdrop */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowUserMenu(false)}></div>
      )}

      {/* Dropdown Popover */}
      {showUserMenu && (
        <div id="user-profile-dropdown-popover" style={{ backgroundColor: '#121620' }} className="absolute right-0 top-full mt-2 w-80 sm:w-88 z-50 bg-[#121620] border border-white/20 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden animate-scaleIn">
          {/* Header Profile Section */}
          <div className="relative p-4 bg-[#181F2C] border-b border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="relative group cursor-pointer" onClick={() => { setShowAvatarModal(true); setShowUserMenu(false); }} title="Bấm để đổi avatar">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#00F2FE] shadow-[0_0_16px_rgba(0,242,254,0.35)] transition-transform group-hover:scale-105">
                  <img src={currentAvatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-white font-bold">
                  Đổi 🎨
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-white truncate">
                  {auth.user?.name || (auth.isGuest ? 'Khách viếng thăm' : 'Thành viên')}
                </h4>

                {/* Role Badge */}
                <div className="mt-1">
                  {auth.user?.isTeacher ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold shadow-sm">
                      <span>👑</span>
                      <span>GVCN</span>
                    </span>
                  ) : (auth.user?.isLinkedStudent && auth.user?.tenLop) ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold shadow-sm">
                      <span>✓</span>
                      <span>{auth.user.tenLop}</span>
                    </span>
                  ) : !auth.isGuest ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/20 border border-white/10 text-slate-300 text-[10px] font-medium shadow-sm">
                      <span>👤</span>
                      <span>Tài khoản Campus</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold shadow-sm">
                      <span>👤</span>
                      <span>Chưa đăng nhập</span>
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  {auth.user?.isTeacher
                    ? 'Trung tâm GDNN - GDTX Huyện Định Quán'
                    : (auth.user?.isLinkedStudent && auth.user?.tenLop)
                    ? `${auth.user.tenLop} • GDTX Định Quán`
                    : 'Thành viên Digital Campus'}
                </p>
              </div>
            </div>

            {/* Level & XP Progress Bar */}
            <div className="mt-3 p-2 rounded-2xl bg-[#0D111A] border border-white/5 shadow-inner">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-extrabold text-[#00F2FE] flex items-center gap-1">
                  <span>⭐</span>
                  <span>Cấp độ {gamification.points?.capDo || 1}</span>
                </span>
                <span className="text-slate-300 font-mono font-bold">
                  {(gamification.points?.diemHienTai || 0) % 100}/100 XP
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00F2FE] via-[#8B5CF6] to-[#FFB800] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(8, (gamification.points?.diemHienTai || 0) % 100))}%` }}>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Actions Menu — Single-line rows */}
          <div className="p-2 space-y-1 bg-[#121620]">
            {/* 1. Thành tựu · X huy hiệu */}
            <button
              type="button"
              id="dropdown-item-thanh-tuu"
              onClick={() => { setShowGamificationModal(true); setShowUserMenu(false); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-all text-xs text-slate-200 group">
              <div className="flex items-center gap-2.5">
                <span className="text-sm text-[#FFB800]">🏆</span>
                <span className="font-semibold text-white group-hover:text-[#00F2FE] transition-colors">Thành tựu</span>
              </div>
              <span className="text-[11px] font-bold text-amber-300 font-mono bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                {(gamification.achievements || []).length} huy hiệu
              </span>
            </button>

            {/* Class-specific rows: chỉ hiển thị với học sinh đã liên kết lớp hoặc giáo viên */}
            {(auth.user?.isLinkedStudent || auth.user?.isTeacher) && (
              <>
                {/* 2. Chuyên cần */}
                <button
                  type="button"
                  id="dropdown-item-chuyen-can"
                  onClick={() => { navigateTab('feed', 'diem-danh'); setDdTabSub('canhan'); setShowUserMenu(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-all text-xs text-slate-200 group">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm text-emerald-400">📊</span>
                    <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors">Chuyên cần</span>
                  </div>
                  <span className="text-xs text-slate-500 group-hover:text-slate-300">›</span>
                </button>

                {/* 3. Quỹ lớp */}
                <button
                  type="button"
                  id="dropdown-item-quy-lop"
                  onClick={() => { navigateTab('feed', 'thu-quy'); setShowUserMenu(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-all text-xs text-slate-200 group">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm text-amber-400">💰</span>
                    <span className="font-semibold text-white group-hover:text-amber-400 transition-colors">Quỹ lớp</span>
                  </div>
                  <span className="text-xs text-slate-500 group-hover:text-slate-300">›</span>
                </button>

                {/* 4. Nội quy */}
                <button
                  type="button"
                  id="dropdown-item-noi-quy"
                  onClick={() => { setShowNoiQuyModal(true); setShowUserMenu(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-all text-xs text-slate-200 group">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm text-blue-400">📜</span>
                    <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">Nội quy</span>
                  </div>
                  <span className="text-xs text-slate-500 group-hover:text-slate-300">›</span>
                </button>
              </>
            )}

          </div>

          {/* Footer */}
          <div className="p-3 bg-[#0D111A] border-t border-white/10">
            {!auth.isGuest ? (
              <a href="/api/logout"
                className="w-full py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
                <Ic name="logout" className="w-3.5 h-3.5" />
                <span>Đăng xuất tài khoản</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => { setAuthModalTab('login'); setShowAuthModal(true); setShowUserMenu(false); }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black text-xs font-black flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-all">
                <span>🔐</span>
                <span>Đăng nhập Học sinh / GVCN →</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const tenLopHienTai = classData.lop?.ten || auth.user?.tenLop || 'Lớp 10A7';
  const maLopHienTai = (tenLopHienTai || '').replace(/^Lớp\s*/i, '') || '10A7';
  const namHocHienTai = classData.lop?.namHoc || auth.user?.namHoc || '2026 – 2027';

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 font-sans antialiased flex flex-col selection:bg-[#00F2FE] selection:text-black">

      {/* ══════════════════════════════════════════════════════════════════════
           TOP HEADER BAR (NO "Trang chủ" BUTTON — 100% PARITY)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'campus' ? (
        /* SCREENSHOT 2 HEADER: DIGITAL CAMPUS HUB */
        <header className="sticky top-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-b border-white/10 px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3" />

          {/* Right Controls: Bảng Tin Cộng Đồng 📢 | Guest Login/Register OR Campus Live + Bell + Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button id="btn-nav-bang-tin" data-id="btn-goto-community-board"
              onClick={() => moBangTinCongDong()}
              className="px-3.5 sm:px-4 py-2 rounded-full bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-extrabold text-xs shadow-[0_0_16px_rgba(0,242,254,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shrink-0">
              <span>Bảng Tin</span>
              <span>📢</span>
            </button>

            {auth.user?.isTeacher && (
              <a
                id="btn-header-khu-quan-tri"
                data-id="btn-header-khu-quan-tri"
                href="/giao-vien/"
                className="px-3.5 sm:px-4 py-2 rounded-full bg-[#151A23] border border-amber-400/40 text-amber-300 hover:bg-amber-400/15 hover:border-amber-400 font-extrabold text-xs shadow-[0_0_12px_rgba(251,191,36,0.15)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                title="Mở Khu quản trị giáo viên">
                <span>🏛️</span>
                <span>Quản trị</span>
              </a>
            )}

            {auth.isGuest ? (
              /* Guest top-right actions: Đăng nhập & Đăng ký */
              <div id="campus-guest-auth-actions" className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  id="btn-header-dang-nhap"
                  data-id="header-btn-login"
                  onClick={() => { setAuthModalTab('login'); setShowAuthModal(true); }}
                  className="px-3 py-1.5 rounded-full bg-[#151A23] border border-white/15 text-slate-200 hover:text-white hover:border-[#00F2FE]/50 text-xs font-bold transition-all">
                  Đăng nhập
                </button>
                <button
                  type="button"
                  id="btn-header-dang-ky"
                  data-id="header-btn-register"
                  onClick={() => { setAuthModalTab('register'); setShowAuthModal(true); }}
                  className="px-3 py-1.5 rounded-full bg-[#00F2FE]/15 border border-[#00F2FE]/40 text-[#00F2FE] hover:bg-[#00F2FE]/25 text-xs font-bold transition-all">
                  Đăng ký
                </button>
              </div>
            ) : (
              /* Authenticated Member: Campus Live counter + Bell + Avatar */
              <>
                <div id="header-campus-live-badge" data-id="campus-live-counter" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151A23] border border-white/10 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-bold text-emerald-400 font-mono">{dangHoatDong || 0}</span>
                  <span className="text-slate-400">Campus Live</span>
                </div>

                {/* Bell Notification */}
                <button onClick={() => setShowNotifModal(true)} title="Thông báo Campus"
                  className="relative p-2 rounded-full bg-[#151A23] border border-white/10 text-slate-300 hover:text-white hover:border-[#00F2FE]/40 transition-all">
                  <Ic name="bell" className="w-4 h-4" />
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500"></span>
                </button>

                {/* Student Avatar & Dropdown Menu */}
                {renderUserProfileDropdown()}
              </>
            )}
          </div>
        </header>
      ) : (
        /* SCREENSHOT 1 HEADER: BẢNG TIN CỘNG ĐỒNG LỚP */
        <header className="sticky top-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-b border-white/10 px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo Branding & Class Switcher Dropdown */}
          <div className="relative" ref={classDropdownRef}>
            <button
              type="button"
              id="btn-class-switcher"
              onClick={() => setShowClassDropdown(prev => !prev)}
              className="flex items-center gap-2.5 sm:gap-3 p-1 -ml-1 rounded-xl hover:bg-white/5 transition-all text-left group"
              title="Bấm để chuyển lớp học khác">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00F2FE] to-[#8B5CF6] p-[1.5px] shadow-[0_0_14px_rgba(0,242,254,0.35)] flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#0B0E14] rounded-[10px] flex items-center justify-center font-black text-xs text-[#00F2FE]">
                  {maLopHienTai}
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm text-white tracking-tight group-hover:text-[#00F2FE] transition-colors">{tenLopHienTai}</span>
                <span className="text-[#00F2FE] text-xs">✦</span>
                <span className="text-xs text-slate-300 font-medium hidden sm:inline">{namHocHienTai}</span>
                <span className="text-slate-400 group-hover:text-white text-xs transition-transform duration-200">▾</span>
              </div>
            </button>

            {/* Dropdown danh sách lớp học */}
            {showClassDropdown && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-[#151A23] border border-white/15 rounded-2xl p-2.5 shadow-2xl z-50 animate-scaleIn backdrop-blur-xl">
                <div className="px-2.5 py-1.5 border-b border-white/10 flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chuyển lớp học</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F2FE]/15 text-[#00F2FE] font-bold">{dsLop.length || 1} lớp</span>
                </div>
                <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                  {dsLop.map(l => {
                    const isCurrent = (classData.lop?.id && l.id ? classData.lop.id === l.id : (classData.lop?.ten === l.ten || (classData.lop?.slug && classData.lop.slug === l.slug)));
                    return (
                      <button
                        key={l.id || l.slug}
                        type="button"
                        onClick={() => handleSwitchClass(l)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isCurrent
                            ? 'bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}>
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[10px] text-[#00F2FE]">
                            {(l.ten || '').replace(/^Lớp\s*/i, '')}
                          </span>
                          <div className="text-left">
                            <p className="font-bold text-white text-xs leading-tight">{l.ten}</p>
                            <p className="text-[10px] text-slate-400 leading-tight">{l.namHoc || namHocHienTai}</p>
                          </div>
                        </div>
                        {isCurrent && <span className="text-[#00F2FE] text-xs font-bold">✓ Đang xem</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Controls: Digital Campus 🚀 | Search Bar | Online Counter | Bell | Student Profile */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigateTab('campus')}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-extrabold text-xs shadow-[0_0_16px_rgba(0,242,254,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5">
              <span>Digital Campus</span>
              <span>🚀</span>
            </button>

            {auth.user?.isTeacher && (
              <a
                id="btn-header-khu-quan-tri-feed"
                data-id="btn-header-khu-quan-tri-feed"
                href="/giao-vien/"
                className="px-3.5 sm:px-4 py-2 rounded-full bg-[#151A23] border border-amber-400/40 text-amber-300 hover:bg-amber-400/15 hover:border-amber-400 font-extrabold text-xs shadow-[0_0_12px_rgba(251,191,36,0.15)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                title="Mở Khu quản trị giáo viên">
                <span>🏛️</span>
                <span>Quản trị</span>
              </a>
            )}

            {/* Search Bar — lọc bài đăng trên Bảng tin theo từ khoá */}
            <div className="hidden md:flex items-center gap-2 bg-[#151A23] border border-white/10 rounded-full px-4 py-1.5 text-xs text-slate-400 w-64 focus-within:border-[#00F2FE]">
              <Ic name="search" className="w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Tìm trong bảng tin..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full" />
            </div>

            {/* Online Counter for Feed */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#151A23] border border-white/10 text-xs text-slate-300" title="Trực tuyến">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>

            {/* Bell Notification */}
            <button onClick={() => setShowNotifModal(true)} title={`Thông báo ${tenLopHienTai}`}
              className="relative p-2 rounded-full bg-[#151A23] border border-white/10 text-slate-300 hover:text-white hover:border-[#00F2FE]/40 transition-all">
              <Ic name="bell" className="w-4 h-4" />
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500"></span>
            </button>

            {/* Student Avatar & Dropdown Menu */}
            {renderUserProfileDropdown()}
          </div>
        </header>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           MAIN VIEW 1: DIGITAL CAMPUS HUB (MATCHING SCREENSHOT 2)
      {/* ══════════════════════════════════════════════════════════════════════
           MAIN VIEW 1: DIGITAL CAMPUS HUB (MATCHING SCREENSHOT 2)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'campus' && (
        <div className={`w-full ${currentView === 'ROOM_ACTIVE' && isRoomWide ? 'px-2 sm:px-4 lg:px-6' : 'px-4 sm:px-6 lg:px-7 2xl:px-8'} py-5 flex-1 flex flex-col gap-5 animate-fadeIn`} id="campus-lobby">
          {/* Region 5: Horizontal Teacher Announcement Ticker */}
          {!(currentView === 'ROOM_ACTIVE' && isRoomWide) && (
            <div className="w-full">
              <AnnouncementTicker
                announcements={teacherAnnouncements}
                onSelectAnnouncement={tb => setSelectedAnnouncement(tb)}
              />
            </div>
          )}

          <div className={
            currentView === 'ROOM_ACTIVE' && isRoomWide
              ? "w-full flex flex-col gap-5"
              : "grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_340px] 2xl:grid-cols-[330px_minmax(0,1fr)_340px] lg:grid-cols-[300px_minmax(0,1fr)] gap-5 2xl:gap-6 items-start w-full"
          }>
            {/* Left Column: Highlights Rail (Vùng 3 — ẩn khi bật Toàn màn hình) */}
            {!(currentView === 'ROOM_ACTIVE' && isRoomWide) && (
              <aside id="campus-left-nav" className="flex flex-col gap-4 order-2 lg:order-1 w-full lg:w-[300px] xl:w-[320px] 2xl:w-[330px] shrink-0">
                <CampusHighlights
                  highlights={campusHighlights}
                  onVaoGame={() => {
                    setCurrentLobby('GAME');
                    if (!auth.isGuest) taiDanhSachBanCaro();
                  }}
                  onVaoPhong={(phongId) => {
                    const p = (phongCongDong || []).find(x => x.id === phongId);
                    if (p) vaoPhong(p);
                  }}
                  onVaoSuKien={() => {
                    navigateTab('feed', 'ban-tin');
                  }}
                />
              </aside>
            )}

            {/* Center Column: 4 Flagship Destinations OR Activity Lobby */}
            <main id="campus-main-content" className={`flex flex-col gap-6 min-w-0 w-full ${currentView === 'ROOM_ACTIVE' && isRoomWide ? 'order-1' : 'order-1 lg:order-2'}`}>
              {currentView === 'ROOM_ACTIVE' && activeRoom ? (
                /* ACTIVE ROOM CENTER EXPERIENCE — PERSISTENT 3-COLUMN CAMPUS SHELL */
                <div className="flex flex-col gap-5 w-full animate-fadeIn" id="campus-active-room-container">
                  {/* Top Bar inside Active Room — Gọn gàng, Nổi bật, Không nút thừa */}
                  <div className="flex items-center justify-between bg-[#151A23] border border-white/10 rounded-2xl p-3 sm:p-3.5 shadow-xl gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <button
                        id="btn-back-to-lobby"
                        data-id="btn-back-to-lobby"
                        onClick={() => {
                          if (activeRoom.type === 'PHONG') roiPhongHienTai();
                          else if (activeRoom.type === 'GAME_CARO') thoatPhongGameArena();
                          setIsRoomWide(false);
                          setCurrentView('LOBBY');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10 transition-all hover:scale-105 active:scale-95 shrink-0"
                        title="Quay lại sảnh hoạt động">
                        <span>‹</span> <span>Sảnh</span>
                      </button>
                      <button
                        id="btn-roi-phong-top"
                        data-id="btn-roi-phong-top"
                        onClick={() => {
                          if (activeRoom.type === 'PHONG') roiPhongHienTai();
                          else if (activeRoom.type === 'GAME_CARO') thoatPhongGameArena();
                          setIsRoomWide(false);
                          setCurrentView('LOBBY');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-xs font-bold text-rose-300 border border-rose-500/30 transition-all hover:scale-105 active:scale-95 shrink-0"
                        title={activeRoom.type === 'PHONG' ? 'Rời phòng học' : 'Thoát bàn đấu'}>
                        <Ic name="left" className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">{activeRoom.type === 'PHONG' ? 'Rời phòng' : 'Thoát bàn'}</span>
                      </button>
                      <div className="h-4 w-[1px] bg-white/15 hidden sm:block"></div>
                      <div className="flex items-center gap-2 min-w-0">
                        <h2 className="text-sm font-black text-white truncate max-w-[140px] sm:max-w-xs md:max-w-sm">{activeRoom.title}</h2>
                        {activeRoom.phong?.phamVi && (
                          <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${activeRoom.phong.phamVi === 'truong' ? 'bg-[#00F2FE]/15 text-[#00F2FE] border-[#00F2FE]/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                            {activeRoom.phong.phamVi === 'truong' ? '🌐 Toàn trường' : `🔒 Lớp ${activeRoom.phong.lopTen || ''}`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Dropdown người trong phòng */}
                      {activeRoom.type === 'PHONG' && (
                        <div className="relative">
                          <button
                            id="btn-room-members-dropdown"
                            type="button"
                            onClick={() => setShowMembersDropdown(prev => !prev)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${showMembersDropdown ? 'bg-[#00F2FE]/20 text-[#00F2FE] border-[#00F2FE]/50' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'}`}
                            title="Danh sách thành viên đang trong phòng">
                            <span>👥</span>
                            <span>Trong phòng ({phongThanhVien.length})</span>
                            <span className="text-[10px] opacity-60">▾</span>
                          </button>
                          {showMembersDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-[#151A23] border border-white/15 rounded-2xl p-3 shadow-2xl z-40 animate-scaleIn">
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Trong phòng ({phongThanhVien.length})</span>
                                <button onClick={() => setShowMembersDropdown(false)} className="text-slate-400 hover:text-white text-xs px-1">✕</button>
                              </div>
                              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
                                {phongThanhVien.map(tv => (
                                  <div key={tv.khoa} className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg hover:bg-white/5">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${tv.vaiTro === 'giao_vien' ? 'bg-[#00F2FE]' : 'bg-emerald-400'}`}></span>
                                    <span className="text-slate-200 font-semibold truncate">{tv.ten}</span>
                                    {Boolean(tv.laChuPhong) && <span className="text-[9px] text-amber-400 font-bold shrink-0">★ chủ phòng</span>}
                                    {tv.lopTen && <span className="text-[9px] text-slate-500 ml-auto shrink-0">{tv.lopTen}</span>}
                                  </div>
                                ))}
                                {phongThanhVien.length === 0 && (
                                  <p className="text-[11px] text-slate-500 text-center py-2">Đang tải thành viên…</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sao chép link mời */}
                      {activeRoom.type === 'PHONG' && (
                        <button
                          type="button"
                          id="btn-copy-room-link-header"
                          onClick={() => {
                            const url = `${window.location.origin}/#/campus?phong=${activeRoom.id}`;
                            navigator.clipboard?.writeText(url).then(() => {
                              setLinkCopied(true);
                              setTimeout(() => setLinkCopied(false), 2000);
                            });
                          }}
                          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-all"
                          title="Sao chép liên kết mời vào phòng">
                          <span>🔗</span>
                          <span>{linkCopied ? 'Đã chép' : 'Mời'}</span>
                        </button>
                      )}

                      {/* Nút TOÀN MÀN HÌNH / THU GỌN — RẤT NỔI BẬT */}
                      <button
                        id="btn-room-fullscreen"
                        data-id="btn-room-fullscreen"
                        type="button"
                        onClick={() => setIsRoomWide(prev => !prev)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer ${
                          isRoomWide
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.35)] hover:brightness-110'
                            : 'bg-gradient-to-r from-[#00F2FE] via-[#00c6ff] to-[#3B82F6] text-black border border-[#00F2FE]/60 shadow-[0_0_18px_rgba(0,242,254,0.4)] hover:brightness-110 hover:scale-105'
                        }`}
                        title={isRoomWide ? "Thu gọn về giao diện 3 cột" : "Toàn màn hình (ẩn cột trái & phải)"}>
                        <span className="text-sm">{isRoomWide ? '🗗' : '⛶'}</span>
                        <span>{isRoomWide ? 'Thu gọn' : 'Toàn màn hình'}</span>
                      </button>

                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 shrink-0 pl-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="hidden sm:inline">ONLINE</span>
                      </span>
                    </div>
                  </div>

                  {/* Mobile Chat button (< 1280px) inside active room (ẩn khi toàn màn hình) */}
                  {!(isRoomWide) && (
                    <div className="xl:hidden flex items-center justify-between px-1">
                      <span className="text-[11px] text-slate-400 font-medium">Hoạt động đang diễn ra</span>
                      <button type="button" onClick={() => setShowMobileChatRail(true)}
                        id="mobile-active-campus-chat-btn"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151A23] hover:bg-[#1E2532] border border-white/10 text-xs font-bold text-white shadow-md transition-all">
                        <span>💬</span>
                        <span>Campus Chat</span>
                      </button>
                    </div>
                  )}

                  {activeRoom.type === 'GAME_CARO' && (
            <div className="bg-[#151A23] border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center">
              {auth.isGuest ? (
                /* CHẾ ĐỘ KHÁCH: AUTH GATE CTA */
                <div className="bg-[#10141D] border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center max-w-md mx-auto w-full my-4">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl mb-4">
                    ⚔️
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Đấu Trường Cờ Caro 15×15</h3>
                  <p className="text-xs text-slate-400 mb-6 max-w-sm">
                    Khu vực thi đấu trí tuệ đối kháng trực tiếp giữa học sinh toàn trường. Vui lòng đăng nhập tài khoản học sinh để tham gia thi đấu!
                  </p>
                  <button onClick={() => setShowAuthGate(true)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2">
                    <span>🔐</span>
                    <span>Đăng nhập để thi đấu</span>
                  </button>
                </div>
              ) : quickState === 'QUEUE_WAITING' ? (
                /* TRẠNG THÁI: ĐANG TÌM TRẬN NHANH (ANIMATED RADAR PULSE) */
                <div className="bg-[#0B0E14] border border-[#00F2FE]/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center max-w-md mx-auto w-full my-4 animate-fadeIn">
                  <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                    <div className="absolute inset-0 rounded-full bg-[#00F2FE]/10 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full bg-[#00F2FE]/20 animate-pulse"></div>
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00F2FE]/30 to-[#8B5CF6]/30 border border-[#00F2FE]/50 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(0,242,254,0.3)]">
                      ⚡
                    </div>
                  </div>

                  <h3 className="text-base font-black text-white mb-1">Đang Tìm Trận Nhanh Toàn Trường…</h3>
                  <p className="text-xs text-slate-400 mb-5">Hệ thống đang ghép cặp tự động với học sinh cùng hoặc khác lớp</p>

                  <div className="bg-[#151A23] border border-white/10 rounded-2xl px-6 py-3 mb-6">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">Thời gian chờ</p>
                    <p className="text-2xl font-black font-mono text-[#00F2FE]">
                      {String(Math.floor(queueTimer / 60)).padStart(2, '0')}:{String(queueTimer % 60).padStart(2, '0')}
                    </p>
                  </div>

                  <button onClick={huyTimTranNhanh}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-bold border border-white/10 hover:border-rose-500/30 transition-all">
                    ✕ Hủy Tìm Trận
                  </button>
                </div>
              ) : quickState === 'MATCH_FOUND' ? (
                /* TRẠNG THÁI: ĐÃ TÌM THẤY ĐỐI THỦ (VS COUNTDOWN 3-2-1) */
                <div className="bg-[#0B0E14] border border-emerald-500/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center max-w-lg mx-auto w-full my-4 animate-scaleIn">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-black text-xs uppercase tracking-wider mb-4 animate-pulse">
                    🎉 ĐÃ TÌM THẤY ĐỐI THỦ!
                  </span>

                  <h3 className="text-sm font-bold text-slate-400 mb-6">{matchFoundData?.banTen || 'Bàn Đấu Toàn Trường'}</h3>

                  <div className="flex items-center justify-center gap-4 w-full mb-6">
                    <div className="flex-1 bg-[#151A23] border border-[#00F2FE]/30 rounded-2xl p-4 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40 flex items-center justify-center text-xl font-black mb-2">
                        X
                      </div>
                      <p className="text-xs font-black text-white truncate max-w-[120px]">{auth.user?.hoTen || 'Bạn'}</p>
                      <span className="text-[10px] text-slate-400 mt-0.5">Lớp {auth.user?.lopTen || '10A7'}</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-xs font-black text-amber-400">VS</span>
                      <div className="w-10 h-10 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-lg font-black mt-1 animate-bounce">
                        {matchCountdown > 0 ? matchCountdown : 'GO!'}
                      </div>
                    </div>

                    <div className="flex-1 bg-[#151A23] border border-[#FFB800]/30 rounded-2xl p-4 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40 flex items-center justify-center text-xl font-black mb-2">
                        O
                      </div>
                      <p className="text-xs font-black text-white truncate max-w-[120px]">{matchFoundData?.doiThu?.ten || 'Đối thủ'}</p>
                      <span className="text-[10px] text-slate-400 mt-0.5">Lớp {matchFoundData?.doiThu?.lopTen || 'Khác'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">Trận đấu đang khởi động trong giây lát...</p>
                </div>
              ) : caroPhong ? (
                /* BÀN CỜ: TRẠNG THÁI THẬT TỪ MÁY CHỦ, POLL ĐỂ THẤY NƯỚC ĐI ĐỐI THỦ */
                <div className="flex flex-col items-center w-full max-w-[620px]">
                  <div className="flex items-center justify-between w-full mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white truncate max-w-[200px]">{caroPhong.tenBan || `Bàn #${caroPhong.id}`}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${caroPhong.phamVi === 'truong' ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-blue-500/15 text-blue-300 border-blue-500/30'}`}>
                        {caroPhong.phamVi === 'truong' ? '🌐 Toàn trường' : `🔒 Chỉ lớp ${caroPhong.lopTen || ''}`}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-black text-xs border ${caroPhong.trangThai === 'cho_nguoi' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : caroPhong.trangThai === 'dang_choi' ? 'bg-[#00F2FE]/15 text-[#00F2FE] border-[#00F2FE]/40' : 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
                        {caroPhong.trangThai === 'cho_nguoi' ? '⏳ Chờ đối thủ…'
                          : caroPhong.trangThai === 'dang_choi'
                            ? (caroPhong.luotDiId === nguoiChoiIdCuaToi ? '🎯 Lượt của bạn' : '⌛ Lượt đối thủ')
                            : '🏁 Đã kết thúc'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(caroPhong.trangThai === 'ket_thuc' || caroPhong.trangThai === 'hoa') && (
                        <button onClick={vanMoiCaro}
                          className="px-3.5 py-1.5 rounded-xl bg-[#00F2FE]/15 text-[#00F2FE] text-xs font-bold border border-[#00F2FE]/30 hover:bg-[#00F2FE]/25 transition-all">
                          🔄 Ván Mới
                        </button>
                      )}
                      <button onClick={roiBanCaro}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-all">
                        Rời bàn
                      </button>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-2 mb-3">
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${caroPhong.luotDiId === caroPhong.chuPhongId && caroPhong.trangThai === 'dang_choi' ? 'bg-[#00F2FE]/10 border-[#00F2FE]/50 shadow-[0_0_10px_rgba(0,242,254,0.15)]' : 'bg-[#0B0E14] border-white/5'}`}>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{caroPhong.chuPhongTen} {caroPhong.chuPhongId === nguoiChoiIdCuaToi ? '(Bạn)' : ''}</p>
                        <p className="text-[10px] text-slate-400 truncate">Lớp {caroPhong.lopTen || '10A7'}</p>
                      </div>
                      <span className="w-7 h-7 rounded-lg bg-[#00F2FE]/20 text-[#00F2FE] font-black text-sm flex items-center justify-center shrink-0">X</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${caroPhong.khachId && caroPhong.luotDiId === caroPhong.khachId && caroPhong.trangThai === 'dang_choi' ? 'bg-[#FFB800]/10 border-[#FFB800]/50 shadow-[0_0_10px_rgba(255,184,0,0.15)]' : 'bg-[#0B0E14] border-white/5'}`}>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{caroPhong.khachTen ? `${caroPhong.khachTen} ${caroPhong.khachId === nguoiChoiIdCuaToi ? '(Bạn)' : ''}` : 'Đang chờ đối thủ…'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{caroPhong.khachLopTen ? `Lớp ${caroPhong.khachLopTen}` : '—'}</p>
                      </div>
                      <span className="w-7 h-7 rounded-lg bg-[#FFB800]/20 text-[#FFB800] font-black text-sm flex items-center justify-center shrink-0">O</span>
                    </div>
                  </div>

                  {(caroPhong.trangThai === 'ket_thuc' || caroPhong.trangThai === 'hoa') && (
                    <div className="w-full mb-3 px-6 py-2.5 rounded-2xl bg-[#00F2FE]/20 border border-[#00F2FE]/50 text-center animate-scaleIn">
                      <span className="text-sm font-extrabold text-[#00F2FE]">
                        {caroPhong.trangThai === 'hoa' ? 'Ván đấu hoà! 🤝'
                          : caroPhong.nguoiThangId === nguoiChoiIdCuaToi ? 'Bạn đã thắng! 🎉'
                          : `${caroPhong.nguoiThangId === caroPhong.chuPhongId ? caroPhong.chuPhongTen : caroPhong.khachTen} giành chiến thắng! 🏆`}
                      </span>
                    </div>
                  )}

                  {caroLoi && <p className="text-xs text-rose-400 mb-2 w-full text-center">{caroLoi}</p>}

                  <div className="grid gap-0.5 p-2 bg-[#0B0E14] border border-white/15 rounded-2xl shadow-inner max-w-[520px] w-full aspect-square"
                       style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
                    {(caroPhong.banCo || Array(15).fill(null).map(() => Array(15).fill(null))).map((row, r) => (
                      row.map((cell, c) => (
                        <button key={`${r}-${c}`} onClick={() => danhCoCaro(r, c)}
                          disabled={!caroPhong || caroPhong.trangThai !== 'dang_choi' || caroPhong.luotDiId !== nguoiChoiIdCuaToi || Boolean(cell)}
                          className={`aspect-square rounded-[3px] flex items-center justify-center font-black text-[10px] sm:text-xs transition-colors ${!cell ? 'bg-[#151A23]/60 hover:bg-white/10' : cell === 'X' ? 'bg-[#00F2FE]/20 text-[#00F2FE]' : 'bg-[#FFB800]/20 text-[#FFB800]'}`}>
                          {cell}
                        </button>
                      ))
                    ))}
                  </div>
                </div>
              ) : (
                /* SẢNH ĐẤU TRƯỜNG HYBRID: QUICK MATCH HERO CTA + OPEN LOBBY DISCOVERY */
                <div className="w-full max-w-[620px] flex flex-col gap-4">
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#151A23] via-[#10141D] to-[#1E1735] border border-white/10 p-5 shadow-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">⚔️</span>
                          <h3 className="text-base font-black text-white">GAME ARENA — CARO 15×15</h3>
                        </div>
                        <p className="text-xs text-slate-400">
                          Đấu trường trí tuệ đối kháng trực tiếp. Ghép trận tức thì toàn trường hoặc mở bàn thách đấu.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <button onClick={batDauTimTranNhanh}
                          className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-black font-black text-xs shadow-[0_0_18px_rgba(245,158,11,0.3)] hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5">
                          <span className="animate-pulse">⚡</span>
                          <span>TÌM TRẬN NHANH</span>
                        </button>
                        <button onClick={() => setShowTaoBanModal(true)}
                          className="px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs border border-white/10 transition-all flex items-center gap-1">
                          <span>+</span> Tạo bàn
                        </button>
                      </div>
                    </div>
                  </div>

                  {caroLoi && <p className="text-xs text-rose-400 text-center">{caroLoi}</p>}

                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setArenaTab('truong'); taiDanhSachBanCaro('truong'); }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${arenaTab === 'truong' ? 'bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/40 shadow-sm' : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'}`}>
                        <span>🌐</span>
                        <span>Toàn trường</span>
                      </button>
                      <button onClick={() => { setArenaTab('lop'); taiDanhSachBanCaro('lop'); }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${arenaTab === 'lop' ? 'bg-amber-400/15 text-amber-300 border border-amber-400/40 shadow-sm' : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'}`}>
                        <span>🔒</span>
                        <span>Lớp tôi</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">{caroRooms?.length || 0} bàn đang mở</span>
                      <button onClick={() => taiDanhSachBanCaro(arenaTab)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-all"
                        title="Làm mới danh sách">
                        🔄
                      </button>
                    </div>
                  </div>

                  {caroRooms === null ? (
                    <p className="text-xs text-slate-500 text-center py-8">Đang tải danh sách bàn…</p>
                  ) : caroRooms.length === 0 ? (
                    <div className="text-center py-10 bg-[#0B0E14] rounded-2xl border border-white/5 p-6">
                      <p className="text-2xl mb-2">🎲</p>
                      <p className="text-sm font-bold text-slate-300 mb-1">Chưa có bàn nào đang mở ở chế độ này</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Bấm <strong className="text-amber-400">"Tìm trận nhanh"</strong> để hệ thống tự ghép cặp hoặc bấm <strong className="text-[#00F2FE]">"+ Tạo bàn"</strong> để mở sảnh thách đấu nhé!
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {caroRooms.map(ban => (
                        <div key={ban.id} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0B0E14] border border-white/10 hover:border-[#00F2FE]/40 transition-all">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-bold text-white truncate">{ban.tenBan || `Bàn #${ban.id}`}</p>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${ban.phamVi === 'truong' ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-blue-500/15 text-blue-300 border-blue-500/30'}`}>
                                {ban.phamVi === 'truong' ? 'Toàn trường' : `Lớp ${ban.lopTen || ''}`}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Chủ bàn: <strong className="text-slate-300">{ban.chuPhongTen}</strong> ({ban.lopTen || '10A7'})
                              {ban.khachTen ? ` vs ${ban.khachTen} (${ban.khachLopTen || 'Khác'})` : ' • đang chờ đối thủ'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {ban.trangThai === 'cho_nguoi' ? (
                              <>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  ⏳ Chờ người
                                </span>
                                <button onClick={() => vaoBanCaro(ban.id)}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#00F2FE] text-black font-black text-xs hover:bg-[#00e1ec] active:scale-95 transition-all shadow-sm flex items-center gap-1">
                                  <span>⚔️</span>
                                  <span>Thách đấu</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>Đang thi đấu</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PHÒNG ĐỘNG DO THÀNH VIÊN TẠO — chat phòng + thành viên + nội dung theo loại */}
          {activeRoom.type === 'PHONG' && activeRoom.phong && (() => {
            const p = activeRoom.phong;
            let cauHinh = {};
            try { cauHinh = p.cauHinh ? JSON.parse(p.cauHinh) : {}; } catch { /* bỏ qua */ }
            const yt = cauHinh.videoUrl ? idYoutube(cauHinh.videoUrl) : null;
            const drv = cauHinh.videoUrl ? idGoogleDrive(cauHinh.videoUrl) : null;
            const trucTiep = cauHinh.videoUrl && !yt && !drv && laVideoTrucTiepFe(cauHinh.videoUrl) ? urlMediaFe(cauHinh.videoUrl) : '';
            const laChuPhong = Boolean(p.laChuPhong || p.canControl || (phongMinhKhoa && p.chuPhongKhoa === phongMinhKhoa));
            return (
              <div className={isFocusMode && p.loai === 'nhac' ? "max-w-2xl mx-auto w-full" : "flex flex-col gap-5 w-full"}>
                <div className="flex flex-col gap-5 min-w-0 w-full">
                  {/* VÙNG 1: Nội dung theo loại phòng (Player/Video) */}
                  {p.loai === 'video' ? (
                    <CampusWatchTogether
                      phong={p}
                      phongMinhKhoa={phongMinhKhoa}
                      auth={auth}
                      dongPhongHienTai={dongPhongHienTai}
                      soNguoi={phongThanhVien.length}
                      myCaps={phongMyCaps}
                      videoTimeRef={phongVideoTimeRef}
                    />
                  ) : p.loai === 'nhac' ? (
                    <CampusFocusRoom
                      phong={p}
                      phongMinhKhoa={phongMinhKhoa}
                      auth={auth}
                      dongPhongHienTai={dongPhongHienTai}
                      soNguoi={phongThanhVien.length}
                      isFocusMode={isFocusMode}
                      setIsFocusMode={setIsFocusMode}
                    />
                  ) : (
                    <>
                      {/* Thông tin phòng cho các loại khác */}
                      <div className="bg-[#151A23] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${p.phamVi === 'truong' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                          {p.phamVi === 'truong' ? '🌐 Toàn trường — mọi lớp vào được' : `🔒 Chỉ lớp ${p.lopTen || ''}`}
                        </span>
                        <span className="text-[11px] text-slate-400">Chủ phòng: <strong className="text-slate-200">{p.chuPhongTen}</strong></span>
                        {(laChuPhong || auth.user?.isTeacher) && p.chuPhongKhoa !== 'he-thong' && (
                          <button type="button" onClick={dongPhongHienTai}
                            className="ml-auto px-3 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30">
                            Đóng phòng
                          </button>
                        )}
                        {p.moTa && <p className="w-full text-[11px] text-slate-400 leading-relaxed">{p.moTa}</p>}
                      </div>

                      {p.loai === 'game' && (
                        <div className="bg-[#151A23] border border-white/10 rounded-2xl p-5 text-center">
                          <Ic name="game" className="w-8 h-8 text-[#FFB800] mx-auto mb-2" />
                          <p className="text-xs text-slate-300 font-bold mb-1">Phòng tập kết game</p>
                          <p className="text-[11px] text-slate-500 mb-3">Hẹn nhau ở đây rồi vào Đấu Trường Caro để so tài trí tuệ.</p>
                          <button type="button" onClick={() => {
                            if (auth.isGuest) { setShowAuthGate(true); return; }
                            setActiveRoom({ id: 'caro-arena', type: 'GAME_CARO', title: '⚔️ Đấu Trường Cờ Caro 15x15' });
                            taiDanhSachBanCaro();
                          }}
                            className="px-4 py-2 rounded-xl bg-[#FFB800]/20 text-[#FFB800] text-xs font-bold border border-[#FFB800]/30 hover:bg-[#FFB800]/30">
                            ⚔️ Vào Đấu Trường Caro →
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* VÙNG 2: Study Dock (YouTube Workspace) OR Standard Room Chat */}
                  {p.loai === 'video' ? (
                    <StudyDock
                      phong={p}
                      phongMinhKhoa={phongMinhKhoa}
                      auth={auth}
                      phongChat={phongChat}
                      myCaps={phongMyCaps}
                      isStaff={phongIsStaff}
                      vaiTroPhong={phongVaiTro}
                      thanhVien={phongThanhVien}
                      policies={phongPolicies}
                      grants={phongGrants}
                      videoTimeRef={phongVideoTimeRef}
                      hanhDongPhong={hanhDongPhong}
                      onSendPhongChat={async (noiDung) => {
                        const res = await fetch('/api/phong-chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            phongId: p.id, noiDung,
                            videoTimeSec: Math.floor(phongVideoTimeRef.current || 0) || null
                          })
                        });
                        const d = await res.json();
                        if (d.ok && d.tinNhan) {
                          phongSauIdRef.current = Math.max(phongSauIdRef.current, d.tinNhan.id);
                          setPhongChat(prev => [...prev, d.tinNhan].slice(-200));
                        } else {
                          throw new Error(d.loi || 'Gửi tin nhắn thất bại');
                        }
                      }}
                      onXoaTinPhong={(tinId) => setPhongChat(prev => prev.filter(t => t.id !== tinId))}
                    />
                  ) : !(isFocusMode && p.loai === 'nhac') && (
                    <div className="bg-[#151A23] border border-white/10 rounded-2xl p-4 flex flex-col min-h-[320px]">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-3 pb-2 border-b border-white/10">
                        Chat phòng{p.phamVi === 'truong' ? ' — liên lớp' : ''}
                      </p>
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-80">
                        {phongChat.length === 0 && (
                          <p className="text-[11px] text-slate-500 text-center py-6">Chưa có tin nhắn — gửi lời chào đầu tiên!</p>
                        )}
                        {phongChat.map((m, idx) => (
                          <div key={m.id || idx} className="text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-bold ${m.vaiTro === 'giao_vien' ? 'text-[#00F2FE]' : 'text-slate-200'}`}>
                                {m.tenNguoiGui || 'Thành viên'}
                              </span>
                              {m.lopTen && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500 border border-white/10">{m.lopTen}</span>}
                              <span className="text-[10px] text-slate-500 font-mono ml-auto">{formatTimeOnly(m.taoLuc)}</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed break-words">{m.noiDung}</p>
                          </div>
                        ))}
                        <div ref={phongChatEndRef} />
                      </div>
                      {phongLoi && <p className="text-[11px] text-rose-400 mt-2">{phongLoi}</p>}
                      <form onSubmit={guiTinPhong} className="mt-3 flex items-center gap-2">
                        <input type="text" value={phongInput} onChange={e => setPhongInput(e.target.value)}
                          placeholder="Nhắn cho mọi người trong phòng..." maxLength={500}
                          className="flex-1 bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]" />
                        <button type="submit" disabled={phongDangGui}
                          className="p-2.5 rounded-xl bg-[#00F2FE] text-black hover:bg-[#00e1ec] transition-all shadow-[0_0_10px_rgba(0,242,254,0.3)] disabled:opacity-50">
                          <Ic name="send" className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
                </div>
              ) : currentLobby ? (
                <ActivityLobby
                  lobbyId={currentLobby}
                  onBack={() => {
                    setShowInlineTaoPhong(false);
                    setShowTaoPhong(false);
                    setShowTaoBanModal(false);
                    setCurrentLobby(null);
                    navigateTab('campus');
                  }}
                  onOpenTaoPhong={(loai, url, title) => {
                    if (auth.isGuest) { setAuthModalTab('login'); setShowAuthModal(true); return; }
                    setTpLoi('');
                    setTpForm(f => ({
                      ...f,
                      loai: loai || 'chat',
                      ten: title ? title.slice(0, 40) : (loai === 'video' ? 'Phòng học YouTube' : ''),
                      videoUrl: url || f.videoUrl || '',
                      access_mode: 'public',
                      matKhau: '',
                      sucChua: 8,
                      phamVi: 'truong'
                    }));
                    setShowInlineTaoPhong(true);
                  }}
                  dsPhong={phongCongDong || []}
                  caroRooms={caroRooms || []}
                  onVaoPhong={vaoPhong}
                  onVaoBanCaro={vaoBanCaro}
                  onTaoBanCaro={() => {
                    if (auth.isGuest) { setAuthModalTab('login'); setShowAuthModal(true); return; }
                    setShowTaoBanModal(true);
                  }}
                  onQuickMatch={handleQuickMatch}
                  auth={auth}
                  taoPhongCtl={{
                    show: showInlineTaoPhong, form: tpForm, setForm: setTpForm,
                    loi: tpLoi, dangTao: tpDangTao, submit: taoPhongMoi, setShow: setShowInlineTaoPhong
                  }}
                  taoBanCtl={{
                    show: showTaoBanModal, ten: taoBanTen, setTen: setTaoBanTen,
                    scope: taoBanScope, setScope: setTaoBanScope,
                    loi: caroLoi, dangTao: taoBanDangGui, submit: taoBanCaro, setShow: setShowTaoBanModal
                  }}
                />
              ) : (
                <>
                  {/* Mobile Chat button (< 1280px) */}
                  <div className="xl:hidden flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-400">Campus Hub</span>
                    <button type="button" onClick={() => setShowMobileChatRail(true)}
                      id="mobile-campus-chat-btn"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151A23] hover:bg-[#1E2532] border border-white/10 text-xs font-bold text-white shadow-md transition-all">
                      <span>💬</span>
                      <span>Chat & Bạn bè</span>
                    </button>
                  </div>

                  <CampusActivityUniverse
                    onVaoHocTap={() => setCurrentLobby('CINEMA')}
                    onVaoGame={() => {
                      setCurrentLobby('GAME');
                      if (!auth.isGuest) taiDanhSachBanCaro();
                    }}
                    soPhongHocTap={(phongCongDong || []).filter(p => p.loai === 'video').length}
                    soBanGame={(caroRooms || []).filter(b => b.trangThai === 'dang_choi').length}
                  />
                </>
              )}
            </main>

            {/* Right Column: Campus Chat Rail (Desktop >= 1280px) — Ẩn khi toàn màn hình phòng học (Vùng 4) */}
            {isXlScreen && !(currentView === 'ROOM_ACTIVE' && isRoomWide) && (
              <aside className="flex flex-col gap-4 order-3 sticky top-[72px] self-start w-full xl:w-[340px] shrink-0">
                <CampusChatRail
                  auth={auth}
                  isActive={activeTab === 'campus'}
                  onRequireAuth={() => { setAuthModalTab('login'); setShowAuthModal(true); }}
                />
              </aside>
            )}
          </div>
        </div>
      )}

      {!isXlScreen && showMobileChatRail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-[#151A23] border border-white/15 rounded-t-3xl sm:rounded-3xl w-full max-w-lg h-[85vh] max-h-[640px] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#111620]">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campus Chat & Bạn bè</h3>
              </div>
              <button type="button" onClick={() => setShowMobileChatRail(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white text-sm transition-all">
                ✕
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <CampusChatRail
                auth={auth}
                isActive={true}
                onRequireAuth={() => { setShowMobileChatRail(false); setAuthModalTab('login'); setShowAuthModal(true); }}
                className="h-full rounded-none border-none shadow-none"
              />
            </div>
          </div>
        </div>
      )}

{activeTab === 'feed' && auth.user?.coQuyenCongDong && (
        <div className="max-w-[1440px] mx-auto px-4 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-[260px_1fr_340px] gap-6 items-start animate-fadeIn">

          {/* ─── LEFT COLUMN: TIỆN ÍCH LỚP (PHASE 4C) ─── */}
          <aside className="flex flex-col gap-4 sticky top-[56px] self-start">
            {/* Tiện ích thiết yếu */}
            <div className="bg-[#151A23] border border-white/10 rounded-2xl p-3 shadow-xl">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 mb-2">Tiện ích</p>
              <div className="flex flex-col gap-1.5">
                <button
                  id="btn-feed-subtab-ban-tin"
                  onClick={() => {
                    navigateTab('feed', 'ban-tin');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${feedSubTab === 'ban-tin' ? 'bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 shadow-[0_0_12px_rgba(0,242,254,0.15)]' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                  <span className="flex items-center gap-2">
                    <span>📢</span>
                    <span>Bảng tin lớp</span>
                  </span>
                </button>

                <button
                  id="btn-feed-subtab-diem-danh"
                  onClick={() => {
                    navigateTab('feed', 'diem-danh');
                    if (!attendance.loaded) fetchAttendance();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${feedSubTab === 'diem-danh' ? 'bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 shadow-[0_0_12px_rgba(0,242,254,0.15)]' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                  <span className="flex items-center gap-2">
                    <span>📋</span>
                    <span>Điểm danh</span>
                  </span>
                </button>

                <button
                  id="btn-feed-subtab-thu-quy"
                  onClick={() => {
                    navigateTab('feed', 'thu-quy');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${feedSubTab === 'thu-quy' ? 'bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 shadow-[0_0_12px_rgba(0,242,254,0.15)]' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                  <span className="flex items-center gap-2">
                    <span>💰</span>
                    <span>Quỹ lớp</span>
                  </span>
                </button>
              </div>
            </div>
          </aside>

          {/* ─── CENTER COLUMN: PINNED POST, COMPOSER, FEED OR MODULES ─── */}
          <main className="flex flex-col gap-5 min-w-0 w-full">

            {feedSubTab === 'ban-tin' && (
              <>
                {/* 1. THÔNG BÁO ĐÃ GHIM — mục thong_bao.ghim=1 THẬT mới nhất */}
                {(() => {
                  const tbGhim = (classData.thongBao || []).find(t => t.ghim);
                  if (!tbGhim) return null;
                  return (
                    <div className="bg-[#151A23] border border-amber-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#00F2FE]/40">
                            <img src={PRESET_AVATARS[7].url} alt={maLopHienTai} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-white">Bảng Tin {maLopHienTai}</span>
                              <span className="text-[#00F2FE] text-xs">✓</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-[#FFB800] border border-amber-500/30 font-bold">
                                Thông báo lớp
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">Đã ghim • {thoiGianTruoc(tbGhim.taoLuc || tbGhim.ngay)}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-[#FFB800] border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                          <span>📌</span>
                          <span>Ghim</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-white mb-2 leading-relaxed">
                        {tbGhim.tieuDe}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed mb-4 whitespace-pre-line line-clamp-4">
                        {tbGhim.noiDung}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-white/5 text-slate-300 font-bold flex items-center gap-1.5">
                            <span>❤️</span> <span>{tbGhim.tongCamXuc || 0}</span>
                          </span>
                          <span className="flex items-center gap-1 text-slate-500"><Ic name="eye" className="w-3.5 h-3.5" /> {tbGhim.luotXem || 0} lượt xem</span>
                        </div>
                        <span>{tbGhim.tongBinhLuan || 0} phản hồi</span>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. POST COMPOSER — chỉ GVCN / cán sự được cấp quyền 'hoat-dong-lop' */}
                {/* 3. FEED POSTS — dữ liệu THẬT từ /api/lop (hoat_dong_lop + thong_bao, đã trừ mục ghim) */}
                {(() => {
                  const tbGhimId = (classData.thongBao || []).find(t => t.ghim)?.id;
                  const dsBaiDang = [
                    ...(classData.hoatDongLop || []),
                    ...(classData.thongBao || []).filter(t => t.id !== tbGhimId)
                  ].sort((a, b) => String(b.taoLuc || b.ngay || '').localeCompare(String(a.taoLuc || a.ngay || '')));

                  const tuKhoa = searchQuery.trim().toLowerCase();
                  const dsLoc = tuKhoa
                    ? dsBaiDang.filter(x => `${x.tieuDe || ''} ${x.chuThich || ''} ${x.noiDung || ''}`.toLowerCase().includes(tuKhoa))
                    : dsBaiDang;

                  if (!classData.loaded) {
                    return <p className="text-xs text-slate-500 text-center py-8">Đang tải bảng tin…</p>;
                  }
                  if (dsLoc.length === 0) {
                    return (
                      <div className="bg-[#151A23] border border-white/10 rounded-2xl p-8 text-center shadow-xl">
                        <p className="text-2xl mb-2">{tuKhoa ? '🔍' : '📭'}</p>
                        <p className="text-sm font-bold text-white mb-1">{tuKhoa ? `Không tìm thấy "${searchQuery.trim()}"` : 'Bảng tin còn trống'}</p>
                        <p className="text-xs text-slate-400">
                          {tuKhoa ? 'Thử từ khoá khác ngắn gọn hơn.'
                            : auth.isGuest
                              ? 'Đăng nhập để xem các bài đăng và hoạt động của lớp.'
                              : 'Chưa có nội dung trong bảng tin lớp.'}
                        </p>
                      </div>
                    );
                  }
                  return dsLoc.map(bai => (
                    <TheBaiDang key={`bd-${bai.id}-${bai.chuThich !== undefined ? 'hd' : 'tb'}`}
                      bai={bai} thietBiId={thietBiId} auth={auth} onCanDangNhap={() => setShowAuthGate(true)} />
                  ));
                })()}
              </>
            )}

            {/* SỔ ĐIỂM DANH */}
            {feedSubTab === 'diem-danh' && (
              <div id="khuDiemDanh" className="bg-[#151A23] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Sổ Điểm Danh & Chuyên Cần {tenLopHienTai}</h3>
                  </div>
                  <div id="ddTabLoai" className="flex items-center gap-1 bg-[#0B0E14] p-1 rounded-xl border border-white/10">
                    <button onClick={() => setDdTabSub('ngay')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${ddTabSub === 'ngay' ? 'bg-[#00F2FE] text-black' : 'text-slate-400'}`}>
                      Hôm Nay
                    </button>
                    <button onClick={() => setDdTabSub('ca_nhan')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${ddTabSub === 'ca_nhan' ? 'bg-[#00F2FE] text-black' : 'text-slate-400'}`}>
                      Cá Nhân
                    </button>
                  </div>
                </div>

                {ddTabSub === 'ca_nhan' && (
                  <div className="rounded-xl border border-white/10 p-4 bg-[#0B0E14]/40">
                    {!attendance.caNhan ? (
                      <p className="text-xs text-slate-400 text-center py-4">
                        Đăng nhập bằng <strong>mã cá nhân</strong> để xem chuyên cần và lịch sử vắng của riêng bạn.
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-center text-[10px]">
                          <div className="p-3 rounded-xl bg-[#151A23] border border-white/5">
                            <span className="block text-slate-400 mb-1">Tổng buổi đã ghi</span>
                            <span className="font-black text-white text-base">{attendance.caNhan.chinh?.tong ?? 0}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-[#151A23] border border-white/5">
                            <span className="block text-slate-400 mb-1">Chuyên cần</span>
                            <span className="font-black text-emerald-400 text-base">{attendance.caNhan.chinh?.tiLe != null ? `${attendance.caNhan.chinh.tiLe}%` : '—'}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-[#151A23] border border-white/5">
                            <span className="block text-slate-400 mb-1">Vắng có phép</span>
                            <span className="font-black text-sky-400 text-base">{attendance.caNhan.chinh?.vang_phep ?? 0}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-[#151A23] border border-white/5">
                            <span className="block text-slate-400 mb-1">Vắng không phép</span>
                            <span className="font-black text-rose-400 text-base">{attendance.caNhan.chinh?.vang_khong_phep ?? 0}</span>
                          </div>
                        </div>
                        {(attendance.caNhan.chinh?.lichSuVang || []).length > 0 ? (
                          <div>
                            <h5 className="text-[11px] font-bold text-slate-300 mb-2 uppercase tracking-wider">Lịch sử vắng / đi trễ gần nhất</h5>
                            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                              {attendance.caNhan.chinh.lichSuVang.map((v, i) => (
                                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#151A23] border border-white/5 text-xs">
                                  <span className="text-slate-300 font-semibold">{formatDateVN(v.ngay)} • Buổi {v.buoi === 'chieu' ? 'chiều' : 'sáng'}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.trangThai === 'vang_phep' ? 'bg-sky-500/15 text-sky-400' : v.trangThai === 'tre' ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'}`}>
                                    {v.trangThai === 'vang_phep' ? 'Vắng có phép' : v.trangThai === 'tre' ? 'Đi trễ' : 'Vắng không phép'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-emerald-400/80 text-center">✅ Không có lượt vắng/trễ nào được ghi — giữ phong độ nhé!</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {ddTabSub === 'ngay' && (
                <div id="ddLopKhoi" className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] bg-[#0B0E14]/60">
                        <th className="py-2 px-3">STT</th>
                        <th className="py-2 px-3">Họ và Tên</th>
                        <th className="py-2 px-3">Lớp Nghề</th>
                        <th className="py-2 px-3 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {attendance.danhSach?.map((hs, i) => (
                        <tr key={hs.id || i} className="hover:bg-white/5">
                          <td className="py-2 px-3 text-slate-500 font-mono">{hs.soThuTu || (i+1)}</td>
                          <td className="py-2 px-3 font-semibold text-white">{hs.hoTen}</td>
                          <td className="py-2 px-3 text-slate-400">{hs.lopNghe || '—'}</td>
                          <td className="py-2 px-3 text-center">
                            {hs.trangThai === 'co_mat' && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Có mặt</span>}
                            {hs.trangThai === 'phep' && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">Vắng phép</span>}
                            {hs.trangThai === 'khong_phep' && <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold">K.Phép</span>}
                            {!hs.trangThai && <span className="text-slate-500 text-[10px]">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
                {/* Chuyên cần CÁ NHÂN — dữ liệu thật của học sinh đang đăng nhập */}
                <div id="ddCaNhan">
                  {attendance.caNhan && (
                    <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-[#00F2FE]/8 to-[#8B5CF6]/8 border border-[#00F2FE]/25">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
                        <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          <span>🎓</span>
                          <span>Chuyên cần của {attendance.caNhan.hoTen || 'bạn'}</span>
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 font-bold">
                          {attendance.caNhan.chinh?.tiLe != null ? `${attendance.caNhan.chinh.tiLe}% chuyên cần` : 'Chưa có dữ liệu'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                        <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                          <span className="block text-slate-400 mb-0.5">Có mặt</span>
                          <span className="font-black text-emerald-400 text-sm">{attendance.caNhan.chinh?.co_mat ?? 0}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                          <span className="block text-slate-400 mb-0.5">Đi trễ</span>
                          <span className="font-black text-amber-400 text-sm">{attendance.caNhan.chinh?.tre ?? 0}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                          <span className="block text-slate-400 mb-0.5">Vắng phép</span>
                          <span className="font-black text-sky-400 text-sm">{attendance.caNhan.chinh?.vang_phep ?? 0}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                          <span className="block text-slate-400 mb-0.5">Không phép</span>
                          <span className="font-black text-rose-400 text-sm">{attendance.caNhan.chinh?.vang_khong_phep ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* THỦ QUỸ MINH BẠCH */}
            {feedSubTab === 'thu-quy' && (
              <div id="thu-quy" className="bg-[#151A23] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Thủ Quỹ {tenLopHienTai}</h3>

                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={xuatSoQuyCSV}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      📥 Xuất CSV
                    </button>
                    <button onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold border border-white/10">
                      🖨️ In A4
                    </button>
                  </div>
                </div>

                <div id="tqTongQuan" className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[#0B0E14] rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400">Tổng thu</span>
                    <p className="text-sm font-black text-emerald-400">{formatVND(financialSummary.thu)}</p>
                  </div>
                  <div className="p-3 bg-[#0B0E14] rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400">Tổng chi</span>
                    <p className="text-sm font-black text-rose-400">{formatVND(financialSummary.chi)}</p>
                  </div>
                  <div className="p-3 bg-[#0B0E14] rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400">Tồn quỹ</span>
                    <p className="text-sm font-black text-[#00F2FE]">{formatVND(financialSummary.ton)}</p>
                  </div>
                </div>

                <div id="tqKhoan" className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Danh Sách Khoản Thu</h4>
                  {(financialSummary.khoanList || []).length === 0 ? (
                    <p className="text-[11px] text-slate-500">Chưa có khoản thu nào được tạo.</p>
                  ) : financialSummary.khoanList.map((k, i) => (
                    <div key={k.id || i} className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-xl text-xs border border-white/5">
                      <span className="font-semibold text-slate-200">{k.ten}</span>
                      <span className="font-bold text-[#00F2FE]">{formatVND(k.tongDaThu || k.soTienMoiEm)}</span>
                    </div>
                  ))}
                </div>

                {/* Danh sách khoản CHI thật từ quy_chi */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Danh Sách Khoản Chi</h4>
                  {(financialSummary.chiList || []).length === 0 ? (
                    <p className="text-[11px] text-slate-500">Chưa có khoản chi nào.</p>
                  ) : financialSummary.chiList.map((c, i) => (
                    <div key={c.id || i} className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-xl text-xs border border-white/5">
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-200 block truncate">{c.noiDung}</span>
                        <span className="text-[10px] text-slate-500">{formatDateVN(c.ngay)}{c.ghiChu ? ` • ${c.ghiChu}` : ''}</span>
                      </div>
                      <span className="font-bold text-rose-400 shrink-0">-{formatVND(c.soTien)}</span>
                    </div>
                  ))}
                </div>
                <div id="khuInBaoCaoA4"></div>
              </div>
            )}
          </main>

          {/* ─── RIGHT COLUMN: BẢNG VÀNG TUẦN & TRỰC TUYẾN (PHASE 4C) ─── */}
          <aside className="flex flex-col gap-4 sticky top-[56px] self-start">
            {/* Bảng Vàng Tuần — Top 3 THẬT từ /api/gamification */}
            <div className="bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <span>🏆</span>
                  <span>Bảng Vàng Tuần {maLopHienTai}</span>
                </div>
                <button onClick={() => setShowGamificationModal(true)}
                  className="text-[10px] text-amber-400 font-bold hover:underline">Top BXH</button>
              </div>

              {(() => {
                const top3 = (gamification.leaderboards?.weeklyStudy || []).slice(0, 3);
                if (top3.length === 0) {
                  return (
                    <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-3 text-xs text-slate-400 text-center">
                      <p>Chưa có dữ liệu xếp hạng tuần này.</p>
                    </div>
                  );
                }
                const huyHieu = ['🥇', '🥈', '🥉'];
                return (
                  <div className="space-y-2 text-xs">
                    {top3.map((hs, idx) => (
                      <div key={hs.hocSinhId || idx} className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 text-center font-bold text-amber-400 shrink-0">{idx + 1} {huyHieu[idx]}</span>
                          <span className="font-semibold text-white truncate">{hs.hoTen}</span>
                        </div>
                        <span className="text-amber-400 font-bold text-[11px] shrink-0">{hs.diem} XP</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Region 3: Canonical Class Online Card */}
            <div id="class-online-card" className="bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Online</span>
              </div>
              <div className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                {onlineCount !== null ? onlineCount : '—'} / {classData.hocSinh?.length || '—'}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           MODAL 1: TÙY BIẾN AVATAR & HỒ SƠ CÁ NHÂN (STUDENT AVATAR CUSTOMIZER)
      ══════════════════════════════════════════════════════════════════════ */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151A23] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>🎨</span>
                <span>Tùy Biến Avatar & Hồ Sơ {tenLopHienTai}</span>
              </h3>
              <button onClick={() => setShowAvatarModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <Ic name="x" className="w-5 h-5" />
              </button>
            </div>

            {/* Current Active Avatar Preview */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#0B0E14] border border-white/10 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#00F2FE] shadow-[0_0_12px_rgba(0,242,254,0.3)]">
                <img src={currentAvatar} alt="Current" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{auth.user?.name || ('Học sinh ' + maLopHienTai)}</p>
                <p className="text-xs text-[#00F2FE] font-medium">{auth.user?.chucVu || (auth.user?.isTeacher ? 'Giáo viên chủ nhiệm' : 'Thành viên lớp')}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Avatar hiển thị trên Bảng Tin & Chat</p>
              </div>
            </div>

            {/* Preset Avatar Selection Grid */}
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">Chọn Avatar Phong Cách Bạn Thích:</p>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {PRESET_AVATARS.map(av => (
                <button key={av.id} onClick={() => {
                  setCurrentAvatar(av.url);
                  localStorage.setItem('user_custom_avatar', av.url);
                }}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group ${currentAvatar === av.url ? 'border-[#00F2FE] scale-105 shadow-[0_0_12px_rgba(0,242,254,0.4)]' : 'border-white/10 hover:border-white/40'}`}>
                  <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                  {currentAvatar === av.url && (
                    <div className="absolute inset-0 bg-[#00F2FE]/20 flex items-center justify-center">
                      <span className="w-4 h-4 rounded-full bg-[#00F2FE] text-black text-[10px] font-black flex items-center justify-center">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button onClick={() => setShowAvatarModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-extrabold text-xs shadow-lg">
              Lưu & Áp Dụng Avatar
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           MODAL 2: THÔNG BÁO LỚP 10A7
      ══════════════════════════════════════════════════════════════════════ */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151A23] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-scaleIn max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Ic name="bell" className="w-5 h-5 text-[#00F2FE]" />
                <span>Thông Báo {tenLopHienTai}</span>
              </h3>
              <button onClick={() => setShowNotifModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <Ic name="x" className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {classData.thongBao && classData.thongBao.length > 0 ? (
                classData.thongBao.map((tb, idx) => (
                  <div key={tb.id || idx} className="bg-[#0B0E14] border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-[#00F2FE]">{formatDateVN(tb.ngay)}</span>
                      {tb.ghim && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-[#FFB800] font-bold">Ghim</span>}
                    </div>
                    <h4 className="text-sm font-bold text-white mb-2">{tb.tieuDe}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{tb.noiDung}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">🔔</p>
                  <p className="text-sm font-bold text-white mb-1">Chưa có thông báo nào</p>
                  <p className="text-xs text-slate-400">Chưa có thông báo trong bảng tin lớp.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           MODAL 2.5: SỔ TAY NỘI QUY & VĂN HÓA LỚP 10A7
      ══════════════════════════════════════════════════════════════════════ */}
      {showNoiQuyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151A23] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-scaleIn max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>📜</span>
                <span>Sổ Tay Nội Quy & Văn Hóa {tenLopHienTai}</span>
              </h3>
              <button onClick={() => setShowNoiQuyModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <Ic name="x" className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1 text-xs text-slate-300">
              <div className="p-3.5 rounded-2xl bg-[#0B0E14] border border-white/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#00F2FE]/20 text-[#00F2FE] font-black text-xs flex items-center justify-center">1</span>
                  <h4 className="font-bold text-white text-sm">Chuyên cần & Giờ giấc</h4>
                </div>
                <p className="leading-relaxed text-slate-400">
                  Có mặt trước 6h45 sáng. Tự giác điểm danh 1-Touch hoặc báo ban cán sự. Trường hợp vắng cần nộp giấy phép có chữ ký phụ huynh trước tiết 1.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0B0E14] border border-white/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">2</span>
                  <h4 className="font-bold text-white text-sm">Học tập tích cực & Tương tác</h4>
                </div>
                <p className="leading-relaxed text-slate-400">
                  Tận dụng Bảng Tin & Study Hub để trao đổi bài học, nộp bài tập đúng hạn (trước 22h Chủ Nhật hàng tuần). Tích cực sinh hoạt nhóm.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0B0E14] border border-white/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-black text-xs flex items-center justify-center">3</span>
                  <h4 className="font-bold text-white text-sm">Văn hóa mạng & Tôn trọng</h4>
                </div>
                <p className="leading-relaxed text-slate-400">
                  Khi dùng tính năng Ẩn danh: tuyệt đối không công kích, xúc phạm, tung tin giả hoặc spam. Giữ gìn sự văn minh và đoàn kết nội bộ lớp.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0B0E14] border border-white/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#FFB800]/20 text-[#FFB800] font-black text-xs flex items-center justify-center">4</span>
                  <h4 className="font-bold text-white text-sm">Minh bạch quỹ lớp & Trách nhiệm</h4>
                </div>
                <p className="leading-relaxed text-slate-400">
                  Toàn bộ các khoản thu chi được thủ quỹ công khai 100% trên hệ thống. Học sinh theo dõi và đóng quỹ đúng kỳ để phục vụ hoạt động chung.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0B0E14] border border-white/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-black text-xs flex items-center justify-center">5</span>
                  <h4 className="font-bold text-white text-sm">Bảo mật tài khoản cá nhân</h4>
                </div>
                <p className="leading-relaxed text-slate-400">
                  Mỗi học sinh chịu trách nhiệm với mã định danh của mình. Không cho mượn tài khoản hoặc điểm danh hộ người khác.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 mt-3">
              <button onClick={() => setShowNoiQuyModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-extrabold text-xs shadow-lg hover:opacity-95 transition-all">
                Đã hiểu & Cam kết thực hiện ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           MODAL 2.6: ĐẤU TRƯỜNG THÀNH TỰU & BẢNG VINH DANH LỚP 10A7 (GAMIFICATION)
      ══════════════════════════════════════════════════════════════════════ */}
      {showGamificationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div style={{ backgroundColor: '#121620' }}
            className="bg-[#121620] border border-white/20 rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-[0_25px_60px_rgba(0,0,0,0.95)] animate-scaleIn max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FFB800] to-[#8B5CF6] p-[1.5px] flex items-center justify-center shadow-[0_0_15px_rgba(255,184,0,0.35)]">
                  <div className="w-full h-full bg-[#121620] rounded-[14px] flex items-center justify-center text-lg">
                    🏆
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight">
                    Đấu Trường Thành Tựu & Bảng Vinh Danh
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cộng đồng học tập & thi đua tích cực {tenLopHienTai}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowGamificationModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                <Ic name="x" className="w-5 h-5" />
              </button>
            </div>

            {/* Micro Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="p-3 rounded-2xl bg-[#181F2C] border border-white/5 shadow-sm">
                <span className="text-[10px] text-slate-400 block mb-1">Cấp độ hiện tại</span>
                <span className="text-base font-black text-[#00F2FE] flex items-center gap-1">
                  <span>⭐</span>
                  <span>Lv.{gamification.points?.capDo || 1}</span>
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#181F2C] border border-white/5 shadow-sm">
                <span className="text-[10px] text-slate-400 block mb-1">Tổng điểm tích lũy</span>
                <span className="text-base font-black text-[#FFB800] flex items-center gap-1">
                  <span>💎</span>
                  <span>{gamification.points?.diemTong || 0} XP</span>
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#181F2C] border border-white/5 shadow-sm">
                <span className="text-[10px] text-slate-400 block mb-1">Huy hiệu đã đạt</span>
                <span className="text-base font-black text-purple-400 flex items-center gap-1">
                  <span>🎖️</span>
                  <span>{gamification.achievements?.length || 0}/{gamification.allAchievements?.length || 8}</span>
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#181F2C] border border-white/5 shadow-sm">
                <span className="text-[10px] text-slate-400 block mb-1">Chuỗi ngày đỉnh cao</span>
                <span className="text-base font-black text-rose-400 flex items-center gap-1">
                  <span>🔥</span>
                  <span>{gamification.streaks?.[0]?.streakLonNhat || gamification.streaks?.[0]?.streakHienTai || 1} ngày</span>
                </span>
              </div>
            </div>

            {/* Main Tabs Navigation */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#0D111A] border border-white/10 mb-4">
              <button onClick={() => setGamificationTab('achievements')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${gamificationTab === 'achievements' ? 'bg-[#181F2C] text-[#00F2FE] border border-[#00F2FE]/30 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                <span>🎖️</span>
                <span>Bộ Sưu Tập Huy Hiệu ({gamification.achievements?.length || 0})</span>
              </button>
              <button onClick={() => setGamificationTab('leaderboard')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${gamificationTab === 'leaderboard' ? 'bg-[#181F2C] text-[#FFB800] border border-[#FFB800]/30 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                <span>👑</span>
                <span>Bảng Xếp Hạng Tuần</span>
              </button>
            </div>

            {/* Tab 1: Danh sách Huy Hiệu / Achievements */}
            {gamificationTab === 'achievements' && (
              <div className="overflow-y-auto flex-1 pr-1 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(!gamification.allAchievements || gamification.allAchievements.length === 0) && (
                    <div className="col-span-full p-8 text-center bg-[#181F2C] border border-white/5 rounded-2xl">
                      <span className="text-3xl block mb-2">🎖️</span>
                      <h4 className="text-xs font-bold text-white mb-1">Chưa có danh sách huy hiệu</h4>
                      <p className="text-[11px] text-slate-400">Hệ thống thành tựu đang được khởi tạo — hãy hoạt động tích cực để mở khoá huy hiệu đầu tiên!</p>
                    </div>
                  )}
                  {(gamification.allAchievements || []).map(a => {
                    const userUnlocked = gamification.achievements?.find(ua => ua.ma === a.ma);
                    const loaiColor = a.loai === 'legendary' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
                                      a.loai === 'epic' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                      a.loai === 'rare' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
                                      'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';

                    return (
                      <div key={a.ma || a.id}
                        className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${userUnlocked ? 'bg-[#181F2C] border-white/10 shadow-sm' : 'bg-[#0D111A]/80 border-white/5 opacity-75'}`}>
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${userUnlocked ? 'bg-gradient-to-tr from-[#00F2FE]/20 to-[#8B5CF6]/20 border border-[#00F2FE]/40 shadow-[0_0_12px_rgba(0,242,254,0.25)]' : 'bg-white/5 border border-white/10 grayscale'}`}>
                          {a.icon || '🎖️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <h4 className="text-xs font-extrabold text-white truncate">{a.ten}</h4>
                            <span className="text-[10px] font-black text-[#FFB800] shrink-0">+{a.diem} XP</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug mb-2 line-clamp-2">{a.mo_ta}</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${loaiColor}`}>
                              {a.loai}
                            </span>
                            {userUnlocked ? (
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                <span>✓</span> <span>Đã mở</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                <span>🔒</span> <span>Chưa mở</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Bảng Xếp Hạng Tuần */}
            {gamificationTab === 'leaderboard' && (
              <div className="overflow-y-auto flex-1 pr-1 flex flex-col gap-3">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: 'weeklyStudy', name: '📚 Chăm Chỉ Học', icon: '📚' },
                    { id: 'topGamers', name: '🎮 Cao Thủ Caro', icon: '🎮' },
                    { id: 'attendanceStars', name: '⭐ Chuyên Cần', icon: '⭐' },
                    { id: 'mostHelpful', name: '🤝 Bạn Tích Cực', icon: '🤝' }
                  ].map(cat => (
                    <button key={cat.id} onClick={() => setLeaderboardCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs transition-all flex items-center gap-1.5 ${leaderboardCategory === cat.id ? 'bg-[#FFB800] text-black shadow-[0_0_12px_rgba(255,184,0,0.35)]' : 'bg-[#181F2C] text-slate-300 hover:bg-white/10'}`}>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>

                {/* Leaderboard List */}
                <div className="space-y-2">
                  {(() => {
                    const currentList = gamification.leaderboards?.[leaderboardCategory] || [];
                    if (currentList.length === 0) {
                      return (
                        <div className="p-8 text-center bg-[#181F2C] border border-white/5 rounded-2xl">
                          <span className="text-3xl block mb-2">🌟</span>
                          <h4 className="text-xs font-bold text-white mb-1">Chưa có dữ liệu xếp hạng tuần này</h4>
                          <p className="text-[11px] text-slate-400">
                            Hãy tích cực tham gia hoạt động, gửi tin nhắn và ôn tập để trở thành người dẫn đầu!
                          </p>
                        </div>
                      );
                    }
                    return currentList.map((item, idx) => {
                      const rank = idx + 1;
                      const isTop1 = rank === 1;
                      const isTop2 = rank === 2;
                      const isTop3 = rank === 3;
                      const badgeBg = isTop1 ? 'bg-[#FFB800] text-black shadow-[0_0_10px_rgba(255,184,0,0.4)]' :
                                      isTop2 ? 'bg-slate-300 text-black' :
                                      isTop3 ? 'bg-amber-700 text-white' : 'bg-white/10 text-slate-400';

                      return (
                        <div key={item.hocSinhId || idx}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isTop1 ? 'bg-gradient-to-r from-amber-500/15 via-[#181F2C] to-[#181F2C] border-[#FFB800]/40' : 'bg-[#181F2C] border-white/5'}`}>
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${badgeBg}`}>
                              {rank}
                            </span>
                            <div>
                              <h4 className="text-xs font-extrabold text-white">{item.hoTen}</h4>
                              <p className="text-[10px] text-slate-400">Học sinh {tenLopHienTai}</p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-[#FFB800] font-mono">
                            {item.diem} XP
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-white/10 mt-3 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                Tích cực hoạt động hằng ngày để thăng hạng và mở khóa huy hiệu! 🚀
              </span>
              <button onClick={() => setShowGamificationModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           MODAL: TẤT CẢ PHÒNG HOẠT ĐỘNG (VIEW ALL CHO TỪNG DANH MỤC)
      ══════════════════════════════════════════════════════════════════════ */}
      {viewAllCat && (
        <div id="modal-campus-view-all-rooms" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div id={viewAllCat === 'GAME' ? 'modal-game-hub' : undefined} className="w-full max-w-lg bg-[#121620] border border-white/20 rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col animate-scaleIn">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">
                  {viewAllCat === 'CINEMA' ? '🎬' : (viewAllCat === 'GAME' ? '🎮' : (viewAllCat === 'LOFI' ? '🎧' : '💬'))}
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {viewAllCat === 'CINEMA' ? 'Tất cả phòng Xem chung'
                      : (viewAllCat === 'GAME' ? 'Game'
                      : (viewAllCat === 'LOFI' ? 'Tất cả phòng Music'
                      : 'Tất cả phòng Chat'))}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {viewAllCat === 'GAME'
                      ? 'Danh sách trò chơi Campus'
                      : `${phongCongDong.filter(p => viewAllCat === 'CINEMA' ? p.loai === 'video' : (viewAllCat === 'LOFI' ? p.loai === 'nhac' : p.loai === 'chat')).length} phòng đang hoạt động`}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewAllCat(null)}
                aria-label="Đóng"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-all">
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 flex flex-col gap-2 my-1">
              {viewAllCat === 'GAME' ? (
                <div id="campus-game-hub" className="flex flex-col gap-3">
                  {CAMPUS_GAMES.map(game => {
                    const ds = caroRooms || [];
                    return (
                      <div key={game.id} className="p-4 rounded-2xl bg-[#0D111A] border border-white/10 hover:border-amber-400/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
                            {game.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-white">{game.title}</h4>
                              {!auth.isGuest && ds.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                  ● {ds.length} bàn đang mở
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{game.moTa}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => {
                              setViewAllCat(null);
                              if (auth.isGuest) { setShowAuthGate(true); return; }
                              setActiveRoom({ id: 'caro-arena', type: 'GAME_CARO', title: 'Game Arena · Caro 15×15' });
                              setCurrentView('ROOM_ACTIVE');
                              taiDanhSachBanCaro();
                            }}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-extrabold text-xs shadow-md hover:opacity-90 active:scale-95 transition-all">
                            Vào đấu trường
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {!auth.isGuest && (caroRooms || []).length > 0 && (
                    <div className="mt-2 pt-3 border-t border-white/10">
                      <p className="text-xs font-bold text-slate-300 mb-2">Các bàn cờ Caro đang mở:</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {(caroRooms || []).map(b => (
                          <div key={b.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-white">Bàn #{b.id}</span>
                              <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${b.trangThai === 'dang_choi' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                {b.trangThai === 'dang_choi' ? 'Đang đấu' : 'Chờ đối thủ'}
                              </span>
                            </div>
                            <button onClick={() => {
                              setViewAllCat(null);
                              vaoBanCaro(b.id);
                            }}
                              className="px-3 py-1 rounded-lg bg-[#00F2FE] text-black font-bold text-xs hover:bg-[#00e1ec] active:scale-95 transition-all">
                              Vào bàn
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                (() => {
                  const loai = viewAllCat === 'CINEMA' ? 'video' : (viewAllCat === 'LOFI' ? 'nhac' : 'chat');
                  const ds = phongCongDong.filter(p => p.loai === loai);
                  if (ds.length === 0) {
                    return (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        Chưa có phòng nào trong danh mục này. Hãy tạo phòng mới!
                      </div>
                    );
                  }
                  return ds.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#0D111A] border border-white/5 hover:border-white/15 transition-all">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{p.ten}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          {(p.soNguoi || 0) > 0 ? (
                            <span className="text-emerald-400 font-bold">{p.soNguoi} người đang tham gia</span>
                          ) : (
                            <span>Sẵn sàng</span>
                          )}
                          {p.moTa && <span className="truncate max-w-[200px] text-slate-500">• {p.moTa}</span>}
                        </div>
                      </div>
                      <button onClick={() => {
                        setViewAllCat(null);
                        vaoPhong(p);
                      }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#00F2FE] text-black font-black text-xs hover:bg-[#00e1ec] active:scale-95 transition-all shadow-sm">
                        Vào Phòng
                      </button>
                    </div>
                  ));
                })()
              )}
            </div>

            <div className="pt-3 border-t border-white/10 mt-2 flex items-center justify-between">
              <button onClick={() => setViewAllCat(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all">
                Đóng
              </button>
              {viewAllCat === 'GAME' ? (
                <button onClick={() => {
                  setViewAllCat(null);
                  if (auth.isGuest) { setShowAuthGate(true); return; }
                  setActiveRoom({ id: 'caro-arena', type: 'GAME_CARO', title: 'Game Arena · Caro 15×15' });
                  setCurrentView('ROOM_ACTIVE');
                  setShowTaoBanModal(true);
                }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-extrabold text-xs shadow-md hover:opacity-90 active:scale-95 transition-all">
                  + Tạo bàn Caro
                </button>
              ) : (
                <button onClick={() => {
                  setViewAllCat(null);
                  if (auth.isGuest) { setShowAuthGate(true); return; }
                  setTpLoi('');
                  setTpForm(f => ({ ...f, loai: viewAllCat === 'CINEMA' ? 'video' : (viewAllCat === 'LOFI' ? 'nhac' : 'chat'), ten: '' }));
                  setShowTaoPhong(true);
                }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-black text-xs shadow-md hover:opacity-95 active:scale-95 transition-all">
                  + Mở Phòng Mới
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           MODAL: TẠO PHÒNG HOẠT ĐỘNG (mọi thành viên đăng nhập đều mở được)
      ══════════════════════════════════════════════════════════════════════ */}
      {showTaoPhong && !currentLobby && activeTab === 'campus' && currentView === 'LOBBY' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151A23] border border-[#00F2FE]/30 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-white">Tạo Phòng Hoạt Động</h3>
              <button onClick={() => setShowTaoPhong(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400">
                <Ic name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Tên phòng *</label>
                <input type="text" value={tpForm.ten} onChange={e => setTpForm(f => ({ ...f, ten: e.target.value }))}
                  placeholder="VD: Góc ôn thi Toán, FC bóng đá..." maxLength={80}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]" />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Loại phòng</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'video', label: '🍿 Học tập / Video' },
                    { id: 'chat', label: '💬 Chat & Thảo luận' },
                    { id: 'game', label: '🎮 Tập kết game' }
                  ].map(l => (
                    <button key={l.id} type="button" onClick={() => setTpForm(f => ({ ...f, loai: l.id }))}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-left transition-all ${tpForm.loai === l.id ? 'bg-[#00F2FE]/15 text-[#00F2FE] border-[#00F2FE]/40' : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/25'}`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {tpForm.loai === 'video' && (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Link video *</label>
                  <input type="text" value={tpForm.videoUrl} onChange={e => setTpForm(f => ({ ...f, videoUrl: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=... hoặc link Drive/mp4" maxLength={1000}
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]" />
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Mô tả ngắn</label>
                <input type="text" value={tpForm.moTa} onChange={e => setTpForm(f => ({ ...f, moTa: e.target.value }))}
                  placeholder="Phòng này để làm gì?" maxLength={300}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]" />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Chế độ truy cập</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setTpForm(f => ({ ...f, access_mode: 'public', matKhau: '' }))}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border text-left transition-all ${(!tpForm.access_mode || tpForm.access_mode === 'public') ? 'bg-cyan-500/15 text-[#00F2FE] border-cyan-500/40' : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/25'}`}>
                    🌐 Công khai
                  </button>
                  <button type="button" onClick={() => setTpForm(f => ({ ...f, access_mode: 'password' }))}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border text-left transition-all ${tpForm.access_mode === 'password' ? 'bg-amber-500/15 text-amber-300 border-amber-500/40' : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/25'}`}>
                    🔒 Có mật khẩu
                  </button>
                </div>
              </div>

              {tpForm.access_mode === 'password' && (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block mb-1">Mật khẩu phòng *</label>
                  <input type="password" value={tpForm.matKhau || ''} onChange={e => setTpForm(f => ({ ...f, matKhau: e.target.value }))}
                    placeholder="Nhập mật khẩu cho phòng" maxLength={100}
                    className="w-full bg-[#0B0E14] border border-amber-500/30 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" />
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Sức chứa tối đa (người) — phòng học tối đa 12</label>
                <input type="number" min={2} max={12} value={tpForm.sucChua || 8} onChange={e => setTpForm(f => ({ ...f, sucChua: Math.min(12, Math.max(2, Number(e.target.value) || 8)) }))}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F2FE]" />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Ai được vào?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setTpForm(f => ({ ...f, phamVi: 'truong' }))}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-left transition-all ${tpForm.phamVi === 'truong' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/25'}`}>
                    🌐 Toàn trường
                    <span className="block text-[9px] font-normal opacity-70 mt-0.5">Học sinh mọi lớp</span>
                  </button>
                  <button type="button" onClick={() => setTpForm(f => ({ ...f, phamVi: 'lop' }))}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-left transition-all ${tpForm.phamVi === 'lop' ? 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/40' : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/25'}`}>
                    🔒 Chỉ lớp mình
                    <span className="block text-[9px] font-normal opacity-70 mt-0.5">Riêng lớp của bạn</span>
                  </button>
                </div>
              </div>

              {tpLoi && <p className="text-[11px] text-rose-400">{tpLoi}</p>}

              <button onClick={taoPhongMoi} disabled={tpDangTao || tpForm.ten.trim().length < 2}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-extrabold text-xs shadow-lg hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {tpDangTao ? 'Đang tạo…' : '🚀 Mở phòng ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           MODAL: TẠO BÀN ĐẤU CARO 15x15 (CHỌN TOÀN TRƯỜNG / LỚP TÔI)
      ══════════════════════════════════════════════════════════════════════ */}
      {showTaoBanModal && currentLobby !== 'GAME' && (
        <div id="modal-tao-ban-caro" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#151A23] border border-[#00F2FE]/30 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚔️</span>
                <h3 className="text-base font-extrabold text-white">Tạo Bàn Đấu Caro 15×15</h3>
              </div>
              <button onClick={() => setShowTaoBanModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                <Ic name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                  Tên bàn đấu (Tùy chọn)
                </label>
                <input type="text" value={taoBanTen} onChange={e => setTaoBanTen(e.target.value)}
                  placeholder="VD: Giao lưu cờ caro, Đấu trí cuối tuần..." maxLength={60}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]" />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                  Phạm vi bàn đấu *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setTaoBanScope('truong')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-left transition-all ${taoBanScope === 'truong' ? 'bg-purple-500/15 text-purple-300 border-purple-500/50 shadow-sm' : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/25'}`}>
                    🌐 Toàn trường
                    <span className="block text-[9px] font-normal opacity-70 mt-0.5">Mọi học sinh trong trường</span>
                  </button>
                  <button type="button" onClick={() => setTaoBanScope('lop')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-left transition-all ${taoBanScope === 'lop' ? 'bg-[#00F2FE]/15 text-[#00F2FE] border-[#00F2FE]/50 shadow-sm' : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/25'}`}>
                    🔒 Chỉ lớp tôi
                    <span className="block text-[9px] font-normal opacity-70 mt-0.5">Chỉ bạn cùng lớp vào được</span>
                  </button>
                </div>
              </div>

              {caroLoi && <p className="text-[11px] text-rose-400">{caroLoi}</p>}

              <div className="flex items-center gap-2 pt-1">
                <button type="button" onClick={() => setShowTaoBanModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 transition-all">
                  Hủy
                </button>
                <button onClick={taoBanCaro} disabled={taoBanDangGui}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-extrabold text-xs shadow-lg hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {taoBanDangGui ? 'Đang tạo…' : '🚀 Tạo bàn ngay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL TẠO SỰ KIỆN CAMPUS — chỉ giáo viên thấy (API cũng chặn) ─── */}
      {showAuthGate && (
        <div id="modal-auth-gate" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151A23] border border-[#8B5CF6]/40 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center animate-scaleIn">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#00F2FE] flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg">
              🔐
            </div>
            <h3 className="text-base font-extrabold text-white mb-2">Yêu Cầu Đăng Nhập</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Vui lòng đăng nhập để tham gia chat, gửi bài viết và sinh hoạt cùng lớp.
            </p>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => { setAuthModalTab('login'); setShowAuthModal(true); setShowAuthGate(false); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-extrabold text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all">
                Đăng nhập ngay →
              </button>
              <button onClick={() => setShowAuthGate(false)} className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-semibold">
                Tiếp tục xem trang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MÃ TRUY CẬP BẢNG TIN CỘNG ĐỒNG */}
      <CommunityBoardGateModal
        isOpen={showCommunityGate}
        onClose={() => setShowCommunityGate(false)}
        onDirectLogin={() => { setAuthModalTab('login'); setShowAuthModal(true); setShowCommunityGate(false); }}
        onSuccess={async () => {
          await fetchAuth();
          await fetchClassData(true);
          setShowCommunityGate(false);
          navigateTab('feed', 'ban-tin');
        }}
      />

      {/* PHASE 4B MODALS */}
      <AuthModal
        isOpen={showAuthModal}
        initialTab={authModalTab}
        onClose={() => setShowAuthModal(false)}
        onSuccess={async () => {
          await fetchAuth();
          await taiTeacherAnnouncements();
          await taiDanhSachPhong();
        }}
      />

      <RoomPasswordModal
        room={selectedPasswordRoom}
        isOpen={showRoomPasswordModal}
        onClose={() => { setShowRoomPasswordModal(false); setSelectedPasswordRoom(null); }}
        onJoin={async (r, pwd) => {
          return await vaoPhong(r, pwd);
        }}
      />

      {/* MODAL: XEM CHI TIẾT THÔNG BÁO GIÁO VIÊN */}
      {selectedAnnouncement && (
        <div id="modal-announcement-detail" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#151A23] border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <span className="text-xs font-black uppercase text-[#00F2FE] tracking-wider">{selectedAnnouncement.loai || 'Thông Báo'}</span>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all">✕</button>
            </div>
            <h3 className="text-base font-black text-white mb-2 leading-snug">{selectedAnnouncement.tieuDe}</h3>
            <p className="text-[11px] text-slate-400 mb-4">{selectedAnnouncement.nguoiTaoTen || 'Ban Giám Hiệu'} · {dinhDangNgayGioVN(selectedAnnouncement.xuatBanLuc || selectedAnnouncement.taoLuc)}</p>
            <div className="bg-[#0B0E14] border border-white/5 rounded-2xl p-4 text-xs text-slate-200 leading-relaxed max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
              {selectedAnnouncement.noiDung}
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={() => setSelectedAnnouncement(null)} className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="mobile-bottom-nav mobile-only">
          <div className="flex justify-around items-center">
            <button
              onClick={() => navigateTab('campus')}
              className={`mobile-nav-item mobile-touch-target ${activeTab === 'campus' ? 'active' : ''}`}
            >
              <Ic name="home" className="w-5 h-5" />
              <span>Campus</span>
            </button>
            <button
              onClick={() => navigateTab('feed', 'ban-tin')}
              className={`mobile-nav-item mobile-touch-target ${activeTab === 'feed' ? 'active' : ''}`}
            >
              <Ic name="community" className="w-5 h-5" />
              <span>Bảng tin</span>
            </button>
            <button
              onClick={() => {
                if (auth.user?.isTeacher) {
                  navigateTab('feed', 'diem-danh');
                } else {
                  navigateTab('feed', 'thu-quy');
                }
              }}
              className={`mobile-nav-item mobile-touch-target ${feedSubTab === 'diem-danh' || feedSubTab === 'thu-quy' ? 'active' : ''}`}
            >
              <Ic name="book" className="w-5 h-5" />
              <span>{auth.user?.isTeacher ? 'Điểm danh' : 'Quỹ'}</span>
            </button>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="mobile-nav-item mobile-touch-target"
            >
              <Ic name="user" className="w-5 h-5" />
              <span>Tôi</span>
            </button>
          </div>
        </nav>
      )}

    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<DigitalCampusApp />);
