'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Tv,
  Gamepad2,
  Headphones,
  Ghost,
  Lock,
  Unlock,
  Users,
  Plus,
  ArrowLeft,
  Send,
  MessageSquare,
  Shield,
  ShieldAlert,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  Pin,
  Clock,
  Radio,
  Sliders,
  Smile,
  LogOut,
  Settings,
  HelpCircle,
  X,
  Flame,
  Award,
  CircleDot
} from 'lucide-react';

// =================================================================
// 1. TYPES & DATA STRUCTURES
// =================================================================
export type ViewState = 'LOBBY' | 'ROOM_ACTIVE';

export type ActivityType = 'CINEMA' | 'GAME_CARO' | 'LOFI_STUDY' | 'ANONYMOUS_QA';
export type RoomPrivacy = 'SOLO_POD' | 'DUO_POD' | 'SQUAD_POD' | 'PUBLIC_CLASS';

export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'STUDENT' | 'TEACHER' | 'CLASS_MONITOR';
  isSpeaking?: boolean;
  isMuted?: boolean;
  statusText?: string;
}

export interface DanmakuMessage {
  id: string;
  text: string;
  color: string;
  topPercent: number;
  speedSec: number;
}

export interface ChatMessage {
  id: string;
  roomId?: string;
  author: Member;
  text: string;
  timestamp: string;
  isAnonymous?: boolean;
  realAuthorName?: string;
}

export interface ActivityRoom {
  id: string;
  title: string;
  type: ActivityType;
  privacy: RoomPrivacy;
  host: Member;
  currentMembers: Member[];
  maxCapacity: number;
  thumbnail: string;
  isLocked?: boolean;
  pin?: string;
  meta: {
    videoTitle?: string;
    videoProgress?: string;
    videoUrl?: string;
    player1?: Member;
    player2?: Member;
    spectatorCount?: number;
    lofiTrack?: string;
    lofiArtist?: string;
  };
}

export interface Post {
  id: string;
  author: Member;
  isAnonymous?: boolean;
  realAuthorName?: string;
  title?: string;
  content: string;
  time: string;
  tags: string[];
  likes: number;
  commentsCount: number;
  isPinned?: boolean;
  userLiked?: boolean;
}

// =================================================================
// 2. MOCK REPOSITORIES & SEED DATA
// =================================================================
const CURRENT_USER: Member = {
  id: 'st-101',
  name: 'Trần Gia Hân',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  role: 'STUDENT',
  isSpeaking: false,
  isMuted: false,
  statusText: 'Đang online',
};

const TEACHER_USER: Member = {
  id: 'tc-01',
  name: 'Thầy Lê Đình Phát',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  role: 'TEACHER',
  statusText: 'GVCN 10A7',
};

const INITIAL_ROOMS: ActivityRoom[] = [
  {
    id: 'room-cinema-1',
    title: '🍿 Chiếu Phim & Xem Youtube Chung: Ôn Thi Lý 10',
    type: 'CINEMA',
    privacy: 'PUBLIC_CLASS',
    host: TEACHER_USER,
    maxCapacity: 45,
    thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
    currentMembers: [
      TEACHER_USER,
      CURRENT_USER,
      { id: 'st-102', name: 'Nguyễn Minh Thư', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', role: 'CLASS_MONITOR' },
      { id: 'st-103', name: 'Đặng Tuấn Kiệt', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', role: 'STUDENT' }
    ],
    meta: {
      videoTitle: 'Vật Lý 10: Chuyển Động Thẳng Biến Đổi Đều - Bài Giảng Minh Họa 3D',
      videoProgress: '14:28 / 38:50',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    }
  },
  {
    id: 'room-game-1',
    title: '⚔️ Đấu Trường Cờ Caro 15x15: Bảo vs Kiệt',
    type: 'GAME_CARO',
    privacy: 'DUO_POD',
    host: { id: 'st-104', name: 'Phan Quốc Bảo', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80', role: 'STUDENT' },
    maxCapacity: 2,
    thumbnail: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=500&auto=format&fit=crop&q=80',
    currentMembers: [
      { id: 'st-104', name: 'Phan Quốc Bảo', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80', role: 'STUDENT' },
      { id: 'st-103', name: 'Đặng Tuấn Kiệt', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', role: 'STUDENT' }
    ],
    meta: {
      player1: { id: 'st-104', name: 'Phan Quốc Bảo', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80', role: 'STUDENT' },
      player2: { id: 'st-103', name: 'Đặng Tuấn Kiệt', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', role: 'STUDENT' },
      spectatorCount: 12
    }
  },
  {
    id: 'room-lofi-1',
    title: '🎧 Lofi Study Cafe: Mưa Rơi & Đọc Sách',
    type: 'LOFI_STUDY',
    privacy: 'SQUAD_POD',
    host: { id: 'st-105', name: 'Lê Hoàng Long', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80', role: 'STUDENT' },
    maxCapacity: 6,
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    currentMembers: [
      { id: 'st-105', name: 'Lê Hoàng Long', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80', role: 'STUDENT' },
      { id: 'st-106', name: 'Phạm Quỳnh Như', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80', role: 'STUDENT' },
      { id: 'st-107', name: 'Vũ Đức Trọng', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80', role: 'STUDENT' },
      { id: 'st-108', name: 'Bùi Lan Chi', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', role: 'STUDENT' }
    ],
    meta: {
      lofiTrack: 'Midnight Study Session in Định Quán',
      lofiArtist: '10A7 Chillhop Collective'
    }
  },
  {
    id: 'room-solo-1',
    title: '🔒 Góc Tự Học Yên Tĩnh (Do Not Disturb)',
    type: 'LOFI_STUDY',
    privacy: 'SOLO_POD',
    host: { id: 'st-109', name: 'Ngô Thanh Sơn', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80', role: 'STUDENT' },
    maxCapacity: 1,
    isLocked: true,
    thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=80',
    currentMembers: [
      { id: 'st-109', name: 'Ngô Thanh Sơn', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80', role: 'STUDENT' }
    ],
    meta: {
      lofiTrack: 'Deep Focus Alpha Waves'
    }
  }
];

const INITIAL_POSTS: Post[] = [
  {
    id: 'post-pin-1',
    isPinned: true,
    author: TEACHER_USER,
    title: '📌 THÔNG BÁO QUAN TRỌNG: LỊCH ÔN TẬP TẬP TRUNG TRÊN CAMPUS',
    content: 'Tối nay từ 20:00 - 21:30, phòng Cinema Lounge sẽ phát bài giảng ôn tập Vật Lý 10 kèm giải đáp trực tiếp. Các em vào phòng đúng giờ, có thể bật micro hỏi bài hoặc dùng Danmaku để đặt câu hỏi trên màn hình nhé!',
    time: 'Ghim bởi GVCN · 1 giờ trước',
    tags: ['#OnThiHocKy', '#Campus10A7', '#ThongBaoChung'],
    likes: 42,
    commentsCount: 16,
    userLiked: true,
  },
  {
    id: 'post-anon-1',
    isAnonymous: true,
    realAuthorName: 'Lê Hoàng Long',
    author: {
      id: 'st-anon',
      name: 'Chiến thần Ẩn danh #407',
      avatar: '',
      role: 'STUDENT'
    },
    content: 'Đố vui: Có ai đang nghe ké đài DJ lớp mình lúc 22h không? Bác nào chọn list bài đêm nay đỉnh chóp thế! Xin tên track đang phát với ạ! 🎧✨',
    time: '25 phút trước',
    tags: ['#GocTamSu', '#Lofi10A7'],
    likes: 19,
    commentsCount: 6,
    userLiked: false,
  }
];

const INITIAL_CHATS: ChatMessage[] = [
  { id: 'm1', author: TEACHER_USER, text: 'Chào cả lớp! Ai vào phòng rồi nhớ mở âm lượng vừa đủ nghe nhé.', timestamp: '20:01' },
  { id: 'm2', author: CURRENT_USER, text: 'Dạ Thầy! Màn hình chiếu nét lắm ạ.', timestamp: '20:02' },
  { id: 'm3', author: { id: 'st-104', name: 'Phan Quốc Bảo', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80', role: 'STUDENT' }, text: 'Ai rảnh ra bàn Cờ Caro làm ván solo không nào? 🔥', timestamp: '20:03' },
  { id: 'm4', isAnonymous: true, realAuthorName: 'Lê Hoàng Long', author: { id: 'st-anon', name: 'Ẩn danh #407', avatar: '', role: 'STUDENT' }, text: 'Thầy ơi tí nữa có bài tập tính gia tốc rơi tự do không Thầy?', timestamp: '20:05' }
];

// =================================================================
// 3. MAIN DIGITAL CAMPUS COMPONENT
// =================================================================
export default function ClassDigitalCampus() {
  // Navigation & View States
  const [currentView, setCurrentView] = useState<ViewState>('LOBBY');
  const [selectedRoom, setSelectedRoom] = useState<ActivityRoom | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Teacher Moderation State
  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(false);
  const [revealedAuthors, setRevealedAuthors] = useState<Record<string, boolean>>({});

  // Rooms & Posts Data State
  const [rooms, setRooms] = useState<ActivityRoom[]>(INITIAL_ROOMS);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHATS);

  // Chat & Danmaku State
  const [chatInput, setChatInput] = useState<string>('');
  const [danmakuEnabled, setDanmakuEnabled] = useState<boolean>(true);
  const [danmakuList, setDanmakuList] = useState<DanmakuMessage[]>([
    { id: 'd1', text: 'Thầy giảng dễ hiểu quá! ❤️', color: '#00F2FE', topPercent: 15, speedSec: 8 },
    { id: 'd2', text: 'Đáp án là v = v0 + at nha mn 📐', color: '#FFB800', topPercent: 40, speedSec: 10 },
    { id: 'd3', text: '10A7 mãi đỉnh 🔥🔥🔥', color: '#F43F5E', topPercent: 68, speedSec: 7 },
  ]);

  // Create Room Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newRoomTitle, setNewRoomTitle] = useState<string>('');
  const [newRoomType, setNewRoomType] = useState<ActivityType>('CINEMA');
  const [newRoomPrivacy, setNewRoomPrivacy] = useState<RoomPrivacy>('SQUAD_POD');
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(6);
  const [newRoomPin, setNewRoomPin] = useState<string>('');

  // Interactive 15x15 Caro Board State (In Game Room)
  const [caroBoard, setCaroBoard] = useState<(string | null)[][]>(() =>
    Array(15).fill(null).map(() => Array(15).fill(null))
  );
  const [caroTurn, setCaroTurn] = useState<'X' | 'O'>('X');
  const [caroWinner, setCaroWinner] = useState<string | null>(null);

  // Post Composer State
  const [composerText, setComposerText] = useState<string>('');
  const [composerIncognito, setComposerIncognito] = useState<boolean>(false);

  // Classroom DJ Radio State
  const [djPlaying, setDjPlaying] = useState<boolean>(true);
  const [djTrackProgress, setDjTrackProgress] = useState<number>(35);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Simulated DJ Audio Progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (djPlaying) {
      interval = setInterval(() => {
        setDjTrackProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [djPlaying]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  // Enter Room (1-click transition)
  const handleJoinRoom = (room: ActivityRoom) => {
    if (room.isLocked && room.privacy === 'SOLO_POD') {
      alert('Phòng tự học cá nhân (SOLO POD) đang khóa: Do Not Disturb.');
      return;
    }
    setSelectedRoom(room);
    setCurrentView('ROOM_ACTIVE');
  };

  // Leave Room -> Return to Lobby
  const handleLeaveRoom = () => {
    setSelectedRoom(null);
    setCurrentView('LOBBY');
  };

  // Send Chat Message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Bad-word / Profanity basic safety guard
    const cleanText = chatInput.replace(/đm|vcl|vkl/gi, '***');

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      roomId: selectedRoom ? selectedRoom.id : undefined,
      author: CURRENT_USER,
      text: cleanText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);

    // If currently in active room, trigger Danmaku bullet comment!
    if (currentView === 'ROOM_ACTIVE' && danmakuEnabled) {
      const colors = ['#00F2FE', '#8B5CF6', '#10B981', '#FFB800', '#F43F5E'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const newDanmaku: DanmakuMessage = {
        id: `dm-${Date.now()}`,
        text: cleanText,
        color: randomColor,
        topPercent: Math.floor(Math.random() * 70) + 10,
        speedSec: Math.floor(Math.random() * 4) + 6,
      };
      setDanmakuList((prev) => [...prev, newDanmaku]);
    }

    setChatInput('');
  };

  // Create Room Submission
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;

    const createdRoom: ActivityRoom = {
      id: `room-${Date.now()}`,
      title: newRoomTitle,
      type: newRoomType,
      privacy: newRoomPrivacy,
      host: CURRENT_USER,
      maxCapacity: newRoomPrivacy === 'SOLO_POD' ? 1 : newRoomPrivacy === 'DUO_POD' ? 2 : newRoomCapacity,
      thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=80',
      currentMembers: [CURRENT_USER],
      isLocked: Boolean(newRoomPin),
      pin: newRoomPin || undefined,
      meta: {
        videoTitle: newRoomType === 'CINEMA' ? 'Video Buổi Học Lớp 10A7' : undefined,
        spectatorCount: 0,
        lofiTrack: newRoomType === 'LOFI_STUDY' ? 'Chill Study Beats' : undefined
      }
    };

    setRooms([createdRoom, ...rooms]);
    setShowCreateModal(false);
    // Instant 1-click transition into the newly created room
    handleJoinRoom(createdRoom);
  };

  // Caro Game Board Move
  const handleCaroCellClick = (r: number, c: number) => {
    if (caroBoard[r][c] || caroWinner) return;

    const newBoard = caroBoard.map((row) => [...row]);
    newBoard[r][c] = caroTurn;
    setCaroBoard(newBoard);

    // Simple 5 in a row check
    if (checkCaroWin(newBoard, r, c, caroTurn)) {
      setCaroWinner(`Người chơi ${caroTurn} đã chiến thắng! 🎉`);
    } else {
      setCaroTurn(caroTurn === 'X' ? 'O' : 'X');
    }
  };

  const checkCaroWin = (board: (string | null)[][], row: number, col: number, player: string): boolean => {
    const directions = [
      [0, 1],  // ngang
      [1, 0],  // dọc
      [1, 1],  // chéo chính
      [1, -1], // chéo phụ
    ];

    for (const [dx, dy] of directions) {
      let count = 1;
      // Duyệt chiều dương
      for (let step = 1; step < 5; step++) {
        const nr = row + dx * step;
        const nc = col + dy * step;
        if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && board[nr][nc] === player) {
          count++;
        } else break;
      }
      // Duyệt chiều âm
      for (let step = 1; step < 5; step++) {
        const nr = row - dx * step;
        const nc = col - dy * step;
        if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && board[nr][nc] === player) {
          count++;
        } else break;
      }
      if (count >= 5) return true;
    }
    return false;
  };

  // Reset Caro Game
  const resetCaroGame = () => {
    setCaroBoard(Array(15).fill(null).map(() => Array(15).fill(null)));
    setCaroWinner(null);
    setCaroTurn('X');
  };

  // Create Community Post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim()) return;

    const newPost: Post = {
      id: `post-${Date.now()}`,
      author: composerIncognito
        ? { id: 'anon', name: 'Thành viên Ẩn danh', avatar: '', role: 'STUDENT' }
        : CURRENT_USER,
      isAnonymous: composerIncognito,
      realAuthorName: composerIncognito ? CURRENT_USER.name : undefined,
      content: composerText,
      time: 'Vừa xong',
      tags: ['#Lop10A7', composerIncognito ? '#GocAnDanh' : '#ChiaSe'],
      likes: 1,
      commentsCount: 0,
      userLiked: true,
    };

    setPosts([newPost, ...posts]);
    setComposerText('');
  };

  // Toggle Reveal Anonymous Author (Teacher Only)
  const toggleRevealAuthor = (postId: string) => {
    setRevealedAuthors((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Filter Rooms
  const filteredRooms = rooms.filter((r) => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'CINEMA') return r.type === 'CINEMA';
    if (categoryFilter === 'GAME') return r.type === 'GAME_CARO';
    if (categoryFilter === 'LOFI') return r.type === 'LOFI_STUDY';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 font-sans antialiased selection:bg-[#00F2FE]/30 selection:text-white">

      {/* =================================================================
          TOP NAVIGATION & STATS BAR
      ================================================================= */}
      <header className="sticky top-0 z-40 bg-[#0B0E14]/90 backdrop-blur-xl border-b border-white/10 px-4 lg:px-6 h-16 flex items-center justify-between">
        {/* Class Logo Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00F2FE] via-[#8B5CF6] to-[#00F2FE] p-[1.5px] shadow-[0_0_16px_rgba(0,242,254,0.35)]">
            <div className="w-full h-full bg-[#0B0E14] rounded-[10px] flex items-center justify-center font-black text-sm text-[#00F2FE]">
              10A7
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
                Lớp 10A7 <Sparkles className="w-3.5 h-3.5 text-[#00F2FE]" />
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/20 font-semibold">
                Digital Campus
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Không Gian Sinh Hoạt Ảo & Phòng Học Tương Tác</p>
          </div>
        </div>

        {/* Live Quick Counters */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2 bg-[#151A23] px-3 py-1.5 rounded-xl border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">Trực tuyến: <strong className="text-white">24/39</strong></span>
          </div>

          <div className="flex items-center gap-2 bg-[#151A23] px-3 py-1.5 rounded-xl border border-white/10">
            <Radio className="w-3.5 h-3.5 text-[#00F2FE]" />
            <span className="text-slate-300">Phòng Đang Chạy: <strong className="text-[#00F2FE]">{rooms.length}</strong></span>
          </div>

          {/* Teacher Moderation Role Switch */}
          <div className="flex items-center gap-2 bg-[#151A23] px-3 py-1.5 rounded-xl border border-[#8B5CF6]/30">
            <Shield className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="text-xs text-slate-300">Chế độ GVCN:</span>
            <button
              onClick={() => setIsTeacherMode(!isTeacherMode)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                isTeacherMode
                  ? 'bg-[#8B5CF6] text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                  : 'bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {isTeacherMode ? 'BẬT (Kiểm Duyệt)' : 'TẮT'}
            </button>
          </div>
        </div>

        {/* User Identity Stack */}
        <div className="flex items-center gap-3">
          <img
            src={isTeacherMode ? TEACHER_USER.avatar : CURRENT_USER.avatar}
            alt="User"
            className={`w-9 h-9 rounded-full object-cover ring-2 ${
              isTeacherMode ? 'ring-[#FFB800]' : 'ring-[#00F2FE]'
            }`}
          />
          <div className="hidden sm:block text-left text-xs leading-tight">
            <p className="font-semibold text-white flex items-center gap-1">
              {isTeacherMode ? TEACHER_USER.name : CURRENT_USER.name}
              {isTeacherMode && <CheckCircle2 className="w-3.5 h-3.5 text-[#00F2FE]" />}
            </p>
            <p className="text-[10px] text-slate-400">
              {isTeacherMode ? 'Giáo Viên Chủ Nhiệm' : 'Học Sinh Lớp 10A7'}
            </p>
          </div>
        </div>
      </header>

      {/* =================================================================
          3-COLUMN DESKTOP LAYOUT CONTAINER (MAX 1440px)
      ================================================================= */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr_340px] gap-6">

        {/* -------------------------------------------------------------
            LEFT NAVIGATION RAIL (260px)
        ------------------------------------------------------------- */}
        <aside className="hidden lg:flex flex-col gap-5 sticky top-24 h-[calc(100vh-7.5rem)] overflow-y-auto pr-1">

          {/* Create Room Primary Action Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-extrabold text-xs tracking-wide shadow-[0_0_20px_rgba(0,242,254,0.35)] hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>TẠO PHÒNG HOẠT ĐỘNG MỚI</span>
          </button>

          {/* Activity Room Filter Menu */}
          <div className="bg-[#151A23] border border-white/10 rounded-2xl p-3 shadow-xl">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 py-1.5">
              Phân loại phòng
            </p>
            <nav className="flex flex-col gap-1 mt-1">
              {[
                { id: 'ALL', label: 'Tất Cả Hoạt Động', icon: Radio, count: rooms.length },
                { id: 'CINEMA', label: 'Rạp Chiếu & Xem Chung', icon: Tv, count: rooms.filter((r) => r.type === 'CINEMA').length },
                { id: 'GAME', label: 'Arcade & Cờ Caro 15x15', icon: Gamepad2, count: rooms.filter((r) => r.type === 'GAME_CARO').length },
                { id: 'LOFI', label: 'Lofi Study Cafes', icon: Headphones, count: rooms.filter((r) => r.type === 'LOFI_STUDY').length },
              ].map((cat) => {
                const IconComponent = cat.icon;
                const isActive = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategoryFilter(cat.id);
                      if (currentView === 'ROOM_ACTIVE') setCurrentView('LOBBY');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#00F2FE]/15 to-[#8B5CF6]/10 text-[#00F2FE] border border-[#00F2FE]/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-[#00F2FE]' : 'text-slate-400'}`} />
                      <span>{cat.label}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Pinned Homework & Deadlines Countdown Pill */}
          <div className="bg-[#151A23] border border-amber-400/30 rounded-2xl p-4 shadow-[0_0_15px_rgba(255,184,0,0.1)] relative overflow-hidden">
            <div className="flex items-center gap-2 text-[#FFB800] text-xs font-bold mb-2">
              <Clock className="w-4 h-4" />
              <span>Hạn Chót Sắp Đến</span>
            </div>
            <p className="text-xs text-slate-200 font-semibold mb-1">
              Nộp Bài Tập Hình Học Tuần 3
            </p>
            <p className="text-[11px] text-slate-400 mb-2">
              Chủ Nhật, 22:00 (Còn 2 ngày 5 giờ)
            </p>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#FFB800] w-3/4 h-full rounded-full"></div>
            </div>
          </div>
        </aside>

        {/* -------------------------------------------------------------
            CENTRAL DYNAMIC STAGE (820px)
        ------------------------------------------------------------- */}
        <main className="flex flex-col gap-6 min-w-0">

          {/* ===========================================================
              A. VIEW: ROOM_ACTIVE (IN-PLACE EXPANSION)
          =========================================================== */}
          {currentView === 'ROOM_ACTIVE' && selectedRoom && (
            <div className="flex flex-col gap-5 animate-fadeIn">
              {/* Active Room Top Bar */}
              <div className="flex items-center justify-between bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleLeaveRoom}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Rời Phòng (Về Lobby)</span>
                  </button>
                  <div className="h-4 w-px bg-white/10"></div>
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      {selectedRoom.title}
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/20">
                        {selectedRoom.privacy}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Chủ phòng: {selectedRoom.host.name} • Đang có {selectedRoom.currentMembers.length}/{selectedRoom.maxCapacity} thành viên
                    </p>
                  </div>
                </div>

                {/* Danmaku Toggle Switch */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 hidden sm:inline">Hiệu ứng Danmaku:</span>
                  <button
                    onClick={() => setDanmakuEnabled(!danmakuEnabled)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      danmakuEnabled
                        ? 'bg-[#00F2FE] text-black shadow-[0_0_10px_rgba(0,242,254,0.4)]'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {danmakuEnabled ? 'BẬT' : 'TẮT'}
                  </button>
                </div>
              </div>

              {/* 1. CINEMA ACTIVITY VIEW WITH DANMAKU OVERLAY */}
              {selectedRoom.type === 'CINEMA' && (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                  {/* Mock Video Stream */}
                  <img
                    src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=80"
                    alt="Video Lecture"
                    className="w-full h-full object-cover opacity-85"
                  />

                  {/* Danmaku Bullet Comments Sweeping Across Screen */}
                  {danmakuEnabled && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {danmakuList.map((dm) => (
                        <div
                          key={dm.id}
                          style={{
                            top: `${dm.topPercent}%`,
                            color: dm.color,
                            animation: `danmakuMove ${dm.speedSec}s linear infinite`,
                          }}
                          className="absolute whitespace-nowrap text-sm font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none px-3 py-1 rounded-full bg-black/30 border border-white/10"
                        >
                          {dm.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Theater Screen Controls Overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <button className="w-9 h-9 rounded-full bg-[#00F2FE] text-black flex items-center justify-center font-bold shadow-lg">
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      </button>
                      <div>
                        <p className="font-bold text-white truncate max-w-xs">{selectedRoom.meta.videoTitle}</p>
                        <p className="text-[10px] text-slate-400">{selectedRoom.meta.videoProgress}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold animate-pulse">
                        ĐỒNG BỘ TRỰC TIẾP
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ARCADE: PLAYABLE 15x15 CARO BOARD */}
              {selectedRoom.type === 'GAME_CARO' && (
                <div className="bg-[#151A23] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Lượt đi hiện tại:</span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                        caroTurn === 'X' ? 'bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40' : 'bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/40'
                      }`}>
                        Quân {caroTurn}
                      </span>
                    </div>

                    {caroWinner && (
                      <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30 animate-bounce">
                        {caroWinner}
                      </div>
                    )}

                    <button
                      onClick={resetCaroGame}
                      className="text-xs px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                    >
                      Chơi Lại Ván Mới
                    </button>
                  </div>

                  {/* 15x15 Caro Grid */}
                  <div className="overflow-x-auto max-w-full pb-2">
                    <div className="grid grid-cols-15 gap-[1px] bg-slate-700/50 p-[2px] rounded-lg border border-white/10 shadow-inner">
                      {caroBoard.map((row, r) =>
                        row.map((cell, c) => (
                          <button
                            key={`${r}-${c}`}
                            onClick={() => handleCaroCellClick(r, c)}
                            className={`w-6 h-6 sm:w-8 sm:h-8 bg-[#0B0E14] hover:bg-white/5 flex items-center justify-center font-bold text-xs transition-colors ${
                              cell === 'X' ? 'text-[#00F2FE]' : cell === 'O' ? 'text-[#8B5CF6]' : ''
                            }`}
                          >
                            {cell}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-3">
                    Luật: Xếp đủ 5 quân cờ liên tiếp trên cùng hàng ngang, dọc hoặc chéo để chiến thắng!
                  </p>
                </div>
              )}

              {/* 3. LOFI STUDY POD VIEW */}
              {selectedRoom.type === 'LOFI_STUDY' && (
                <div className="bg-[#151A23] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-white">Bàn Học Tập Tập Trung</h3>
                      <p className="text-xs text-slate-400">Micro của tất cả học sinh được đặt chế độ im lặng tự động.</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="text-xs text-emerald-400 font-bold">Yên lặng tuyệt đối</span>
                    </div>
                  </div>

                  {/* Student Study Desks Stack */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {selectedRoom.currentMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#0B0E14]/70 border border-white/10">
                        <img src={member.avatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-400/40" />
                        <div>
                          <p className="text-xs font-semibold text-white">{member.name}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <VolumeX className="w-3 h-3 text-rose-400" /> Đang giải đề
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===========================================================
              B. VIEW: LOBBY (HERO ACTIVITY CARDS & COMMUNITY FEED)
          =========================================================== */}
          {currentView === 'LOBBY' && (
            <>
              {/* Header Showcase Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Lobby Hoạt Động Trực Tiếp <Sparkles className="w-4 h-4 text-[#00F2FE]" />
                  </h2>
                  <p className="text-xs text-slate-400">Chọn một phòng để tham gia học tập, xem video hoặc giải trí cùng bạn bè</p>
                </div>
                <span className="text-xs text-[#00F2FE] font-medium hidden sm:inline">
                  {filteredRooms.length} phòng đang mở
                </span>
              </div>

              {/* HERO LIVE ACTIVITY GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRooms.map((room) => {
                  const isSoloLocked = room.privacy === 'SOLO_POD' && room.isLocked;

                  return (
                    <div
                      key={room.id}
                      className={`group relative bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all duration-300 ${
                        isSoloLocked
                          ? 'opacity-65 hover:border-slate-700'
                          : 'hover:border-[#00F2FE]/50 hover:shadow-[0_0_24px_rgba(0,242,254,0.15)]'
                      }`}
                    >
                      <div>
                        {/* Thumbnail & Privacy Badge */}
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-3 bg-black/40">
                          <img
                            src={room.thumbnail}
                            alt={room.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white">
                            {isSoloLocked ? <Lock className="w-3 h-3 text-rose-400" /> : <Unlock className="w-3 h-3 text-emerald-400" />}
                            <span>{room.privacy}</span>
                          </div>

                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-200">
                            {room.currentMembers.length}/{room.maxCapacity}
                          </div>

                          {room.type === 'CINEMA' && (
                            <div className="absolute bottom-2 left-2 bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold">
                              Rạp Chiếu Lớp
                            </div>
                          )}
                          {room.type === 'GAME_CARO' && (
                            <div className="absolute bottom-2 left-2 bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/40 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold">
                              Cờ Caro 15x15
                            </div>
                          )}
                        </div>

                        {/* Title & Host */}
                        <h3 className="text-sm font-bold text-white group-hover:text-[#00F2FE] transition-colors line-clamp-1 mb-1">
                          {room.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 mb-3 flex items-center gap-1">
                          Chủ phòng: <strong className="text-slate-300">{room.host.name}</strong>
                          {room.host.role === 'TEACHER' && <CheckCircle2 className="w-3 h-3 text-[#00F2FE]" />}
                        </p>
                      </div>

                      {/* Bottom Action Trigger */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                        {/* Current Member Avatar Stack */}
                        <div className="flex items-center -space-x-2 overflow-hidden">
                          {room.currentMembers.slice(0, 4).map((m) => (
                            <img
                              key={m.id}
                              src={m.avatar}
                              alt={m.name}
                              className="w-6 h-6 rounded-full ring-2 ring-[#151A23] object-cover"
                            />
                          ))}
                        </div>

                        {/* 1-Click Join Button */}
                        <button
                          onClick={() => handleJoinRoom(room)}
                          disabled={isSoloLocked}
                          className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${
                            isSoloLocked
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : room.type === 'CINEMA'
                              ? 'bg-[#00F2FE] text-black shadow-[0_0_12px_rgba(0,242,254,0.3)] hover:scale-105'
                              : 'bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black shadow-[0_0_12px_rgba(139,92,246,0.3)] hover:scale-105'
                          }`}
                        >
                          {isSoloLocked ? 'Đang Tự Học (Khóa)' : 'Tham Gia Ngay'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* LOWER COMMUNITY FEED & SAFE INCOGNITO COMPOSER */}
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Bảng Tin Thảo Luận Lớp 10A7 <MessageSquare className="w-4 h-4 text-[#8B5CF6]" />
                  </h3>
                  {isTeacherMode && (
                    <span className="text-[10px] bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/30 px-2 py-0.5 rounded font-bold">
                      Quyền GVCN: Đang Hiện Khả Năng Soi Danh Tính Ẩn Danh
                    </span>
                  )}
                </div>

                {/* Post Composer */}
                <div className="bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl">
                  <form onSubmit={handleCreatePost}>
                    <textarea
                      value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      placeholder={
                        composerIncognito
                          ? 'Chế độ Ẩn danh (Safe Anonymous). Thầy chủ nhiệm có quyền bảo mật danh tính khi có vi phạm...'
                          : 'Chia sẻ câu hỏi hoặc cảm nghĩ với cả lớp 10A7...'
                      }
                      rows={2}
                      className="w-full bg-[#0B0E14] border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00F2FE] transition-all resize-none mb-2"
                    />

                    <div className="flex items-center justify-between">
                      {/* Incognito Switch */}
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
                        <input
                          type="checkbox"
                          checked={composerIncognito}
                          onChange={(e) => setComposerIncognito(e.target.checked)}
                          className="w-4 h-4 accent-[#8B5CF6]"
                        />
                        <span className={`text-[11px] font-medium flex items-center gap-1 ${composerIncognito ? 'text-[#8B5CF6]' : 'text-slate-400'}`}>
                          <Ghost className="w-3.5 h-3.5" />
                          Đăng Ẩn Danh
                        </span>
                      </label>

                      <button
                        type="submit"
                        disabled={!composerText.trim()}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40"
                      >
                        Đăng Tin
                      </button>
                    </div>
                  </form>
                </div>

                {/* Posts Stream */}
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className={`bg-[#151A23] rounded-2xl p-4 shadow-xl border transition-all ${
                      post.isPinned
                        ? 'border-amber-400/40 shadow-[0_0_16px_rgba(255,184,0,0.1)]'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        {post.isAnonymous ? (
                          <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 flex items-center justify-center text-[#8B5CF6]">
                            <Ghost className="w-4 h-4" />
                          </div>
                        ) : (
                          <img src={post.author.avatar} className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white">{post.author.name}</span>
                            {post.author.role === 'TEACHER' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#00F2FE]" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">{post.time}</p>
                        </div>
                      </div>

                      {/* Teacher Reveal Button for Anonymous Posts */}
                      {post.isAnonymous && isTeacherMode && (
                        <button
                          onClick={() => toggleRevealAuthor(post.id)}
                          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30 hover:bg-[#FFB800]/25 transition-colors"
                        >
                          {revealedAuthors[post.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{revealedAuthors[post.id] ? `Tên thật: ${post.realAuthorName}` : 'Soi Tên Thật (GV)'}</span>
                        </button>
                      )}
                    </div>

                    {post.title && <h4 className="text-xs font-bold text-white mb-1.5">{post.title}</h4>}
                    <p className="text-xs text-slate-300 leading-relaxed mb-3 whitespace-pre-line">{post.content}</p>

                    <div className="flex items-center gap-3 pt-2 border-t border-white/5 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-rose-400">
                        ❤️ {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {post.commentsCount} phản hồi
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </main>

        {/* -------------------------------------------------------------
            RIGHT INTERACTIVE SIDEBAR (340px)
        ------------------------------------------------------------- */}
        <aside className="hidden lg:flex flex-col gap-5 sticky top-24 h-[calc(100vh-7.5rem)] overflow-y-auto pl-1">

          {/* 1. CLASSROOM DJ RADIO WIDGET */}
          <div className="bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Radio className="w-4 h-4 text-[#00F2FE]" />
                <span>Classroom DJ Radio 📻</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                LIVE
              </span>
            </div>

            <p className="text-xs font-bold text-white truncate">Lofi Study Chillhop · Đêm Muộn</p>
            <p className="text-[10px] text-slate-400 mb-3">Phát chung toàn bộ các phòng</p>

            {/* Audio Visualizer Equalizer */}
            <div className="flex items-end gap-1 h-6 mb-3 px-1">
              {[12, 22, 16, 26, 10, 20, 14, 24, 18, 12, 22, 15].map((val, i) => (
                <span
                  key={i}
                  style={{
                    height: djPlaying ? `${Math.max(4, (val * (djTrackProgress % 4 + 1)) % 24)}px` : '4px',
                  }}
                  className="flex-1 bg-gradient-to-t from-[#00F2FE] to-[#8B5CF6] rounded-full transition-all duration-300"
                ></span>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                onClick={() => setDjPlaying(!djPlaying)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10"
              >
                {djPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{djPlaying ? 'Tạm Dừng' : 'Phát Nhạc'}</span>
              </button>
              <span className="text-[10px] font-mono text-slate-400">02:15 / 03:45</span>
            </div>
          </div>

          {/* 2. VOICE CHANNEL ACTIVE PRESENCE BUBBLES */}
          <div className="bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Users className="w-4 h-4 text-[#00F2FE]" />
                <span>Thành Viên Trực Tuyến</span>
              </div>
              <span className="text-[10px] text-slate-400">Vòng xanh = Đang nói</span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {[TEACHER_USER, CURRENT_USER, ...INITIAL_ROOMS[1].currentMembers].map((member, i) => (
                <div key={member.id + i} className="relative group cursor-pointer">
                  <img
                    src={member.avatar}
                    className={`w-9 h-9 rounded-full object-cover transition-all ${
                      i % 2 === 0 ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#151A23] animate-pulse' : 'ring-1 ring-white/10'
                    }`}
                  />
                  <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#151A23]"></span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. REAL-TIME LIVE CHAT FEED */}
          <div className="bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white">Chat Trực Tiếp Lớp 10A7</span>
              <span className="text-[10px] text-[#00F2FE]">Đồng bộ tức thì</span>
            </div>

            {/* Chat List Scrollable */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-56">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="text-xs leading-relaxed bg-[#0B0E14]/60 p-2 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-[#00F2FE] truncate">{msg.author.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{msg.timestamp}</span>
                  </div>
                  <p className="text-slate-200">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhắn tin hoặc gửi Danmaku..."
                className="flex-1 bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-[#00F2FE] text-black font-bold shadow-[0_0_8px_rgba(0,242,254,0.3)] hover:scale-105 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* =================================================================
          CREATE ROOM MODAL
      ================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151A23] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#00F2FE]" />
                Tạo Phòng Hoạt Động Mới
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4 text-xs">
              {/* Room Title */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Tên Phòng Hoạt Động</label>
                <input
                  type="text"
                  required
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn Thi Lý Nhóm 3 / Thách Đấu Cờ Caro..."
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#00F2FE]"
                />
              </div>

              {/* Activity Type Selector */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Loại Hoạt Động</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'CINEMA' as ActivityType, label: 'Rạp Phim', icon: Tv },
                    { type: 'GAME_CARO' as ActivityType, label: 'Cờ Caro', icon: Gamepad2 },
                    { type: 'LOFI_STUDY' as ActivityType, label: 'Lofi Cafe', icon: Headphones },
                  ].map((act) => (
                    <button
                      key={act.type}
                      type="button"
                      onClick={() => setNewRoomType(act.type)}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border font-semibold transition-all ${
                        newRoomType === act.type
                          ? 'bg-[#00F2FE]/15 text-[#00F2FE] border-[#00F2FE]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <act.icon className="w-4 h-4" />
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy Matrix */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Quy Mô / Quyền Riêng Tư</label>
                <select
                  value={newRoomPrivacy}
                  onChange={(e) => setNewRoomPrivacy(e.target.value as RoomPrivacy)}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#00F2FE]"
                >
                  <option value="PUBLIC_CLASS">PUBLIC_CLASS (Mở cho cả lớp)</option>
                  <option value="SQUAD_POD">SQUAD_POD (Nhóm 2 - 8 bạn)</option>
                  <option value="DUO_POD">DUO_POD (Solo 1v1 hoặc 2 người)</option>
                  <option value="SOLO_POD">SOLO_POD (Khóa tự học cá nhân)</option>
                </select>
              </div>

              {/* Capacity Slider (if Squad) */}
              {newRoomPrivacy === 'SQUAD_POD' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-300">Giới Hạn Số Người:</label>
                    <span className="font-bold text-[#00F2FE]">{newRoomCapacity} bạn</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={8}
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                    className="w-full accent-[#00F2FE]"
                  />
                </div>
              )}

              {/* Optional PIN Code */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Mã PIN 4 số (Tùy chọn)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newRoomPin}
                  onChange={(e) => setNewRoomPin(e.target.value)}
                  placeholder="Để trống nếu không khóa..."
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#00F2FE]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 mt-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-extrabold shadow-[0_0_12px_rgba(0,242,254,0.4)]"
                >
                  Tạo & Vào Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Danmaku Move Animation Keyframes */}
      <style jsx global>{`
        @keyframes danmakuMove {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
