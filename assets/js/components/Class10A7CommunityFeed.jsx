import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Heart,
  Smile,
  Send,
  Image as ImageIcon,
  Mic,
  BarChart3,
  HelpCircle,
  Ghost,
  CheckCircle2,
  Pin,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Flame,
  Award,
  Users,
  BookOpen,
  Music,
  Headphones,
  Gamepad2,
  Home,
  Plus,
  Share2,
  MoreHorizontal,
  Bell,
  Search,
  Hash,
  Sparkles,
  ExternalLink,
  Check
} from 'lucide-react';

// ==========================================
// MOCK DATA: BÀI ĐĂNG, KÊNH & WIDGETS
// ==========================================
const INITIAL_CHANNELS = [
  { id: 'general', name: 'Bảng tin chung', icon: Hash, unread: 0, active: true },
  { id: 'study', name: 'Study Hub (Góc ôn tập)', icon: BookOpen, unread: 3, active: false },
  { id: 'lofi', name: 'Lofi & Chill Lounge', icon: Headphones, unread: 0, active: false, isVoice: true, membersCount: 5 },
  { id: 'confession', name: 'Góc ẩn danh Confessions', icon: Ghost, unread: 7, active: false },
  { id: 'game', name: 'Game & Giải trí', icon: Gamepad2, unread: 0, active: false },
];

const PINNED_ANNOUNCEMENT = {
  id: 'pinned-1',
  author: {
    name: 'Thầy Lê Đình Phát',
    role: 'GVCN Lớp 10A7',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    verified: true,
  },
  title: '📢 KẾ HOẠCH ÔN TẬP GIỮA KỲ I & ĐĂNG KÝ HỘI THAO 2026',
  content: 'Chào cả lớp 10A7! Thầy đã cập nhật đề cương ôn tập môn Toán và Ngữ Văn lên Study Hub. Các bạn chú ý thời hạn nộp bài tập tuần này vào trước 22:00 Chủ Nhật. Ngoài ra lớp chúng ta bắt đầu đăng ký các môn thi đấu Hội thao trường, các bạn đăng ký với Lớp trưởng nhé! Chúc cả lớp có một tuần học tập tràn đầy năng lượng! 🔥✨',
  time: 'Đã ghim · 2 giờ trước',
  tags: ['#ThongBaoChung', '#HoiThao10A7', '#OnTapGiuaKy'],
  attachment: {
    type: 'doc',
    title: 'De_cuong_Toan_10_Hoc_Ky_1_Chuan.pdf',
    size: '2.4 MB',
  },
  reactions: {
    heart: 38,
    laugh: 5,
    sparkle: 24,
    userReacted: { heart: true },
  },
  commentsCount: 14,
};

const INITIAL_POSTS = [
  {
    id: 'post-1',
    author: {
      name: 'Nguyễn Minh Thư',
      handle: '@minhthu_10a7',
      role: 'Lớp phó Học tập',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
      verified: false,
    },
    content: 'Mọi người ơi, bài 4 hình học phần tích vô hướng có ai có cách giải nhanh dạng này không ạ? Mình đang thử biến đổi theo tọa độ vectơ nhưng cảm giác hơi dài dòng, cần cao nhân cứu trợ với ạ! 📐📝',
    time: '45 phút trước',
    tags: ['#ToanHoc', '#HocNhom', '#HelpMe'],
    reactions: {
      heart: 16,
      laugh: 2,
      sparkle: 8,
      userReacted: { sparkle: true },
    },
    comments: [
      {
        id: 'c-1',
        author: {
          name: 'Trần Hoàng Nam',
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
          role: 'Thành viên 10A7',
        },
        content: 'Thử dùng hệ thức lượng trong tam giác vuông đi Thư ơi, vẽ thêm đường cao AH là ra trong 3 dòng luôn á!',
        time: '30 phút trước',
        likes: 5,
      },
      {
        id: 'c-2',
        author: {
          name: 'Thầy Lê Đình Phát',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          role: 'GVCN Lớp 10A7',
          verified: true,
        },
        content: 'Hoàng Nam gợi ý đúng hướng rồi đó em. Có thể xem lại Ví dụ 3 trang 42 SGK nhé, Thầy có chú thích kỹ phần phân tích vectơ.',
        time: '18 phút trước',
        likes: 12,
        isTeacher: true,
      },
    ],
  },
  {
    id: 'post-2',
    isIncognito: true,
    author: {
      name: 'Chiến thần ẩn danh #107',
      handle: '@anonymous',
      role: 'Thành viên ẩn danh',
      avatar: null,
    },
    content: 'Có ai đang nghe Lofi trong Music Lounge lúc 10h đêm không? Cảm giác vừa làm bài Lý vừa nghe mưa chill dã man luôn ấy 🎧🌧️ Chúc cả nhà 10A7 mai kiểm tra 15 phút Sử thật may mắn nha!',
    time: '1 giờ trước',
    tags: ['#Confession', '#Lofi10A7', '#NightVibes'],
    reactions: {
      heart: 29,
      laugh: 11,
      sparkle: 15,
      userReacted: { heart: true, laugh: false },
    },
    comments: [
      {
        id: 'c-3',
        author: {
          name: 'Lê Bảo Anh',
          avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80',
          role: 'Cán sự Văn thể',
        },
        content: 'Đang treo máy cày đề đây bạn ơi, playlist phòng chill hôm nay hay xuất sắc luôn!',
        time: '40 phút trước',
        likes: 4,
      },
    ],
  },
];

const LEADERBOARD_STUDENTS = [
  { id: 1, name: 'Phan Quốc Bảo', streak: 28, score: 1450, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', rank: 1 },
  { id: 2, name: 'Nguyễn Minh Thư', streak: 21, score: 1320, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', rank: 2 },
  { id: 3, name: 'Đặng Tuấn Kiệt', streak: 18, score: 1190, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', rank: 3 },
];

const ONLINE_MEMBERS = [
  { id: 1, name: 'Trần Gia Hân', status: 'Đang giải Toán', dot: 'bg-[#00F2FE]' },
  { id: 2, name: 'Lê Hoàng Long', status: 'Nghe Lofi Study', dot: 'bg-[#8B5CF6]' },
  { id: 3, name: 'Phạm Quỳnh Như', status: 'Phòng thoại #1', dot: 'bg-emerald-400' },
  { id: 4, name: 'Vũ Đức Trọng', status: 'Đang trực tuyến', dot: 'bg-emerald-400' },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Class10A7CommunityFeed() {
  // State
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [activeChannel, setActiveChannel] = useState('general');
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [pinnedItem, setPinnedItem] = useState(PINNED_ANNOUNCEMENT);

  // Post Composer State
  const [composerText, setComposerText] = useState('');
  const [isIncognito, setIsIncognito] = useState(false);
  const [selectedTag, setSelectedTag] = useState('#HocTap');

  // Interactive Comments & Reactions
  const [expandedComments, setExpandedComments] = useState({ 'post-1': true });
  const [commentInputs, setCommentInputs] = useState({});

  // Lofi Music Player State
  const [isPlaying, setIsPlaying] = useState(true);
  const [audioProgress, setAudioProgress] = useState(42);

  // Daily Trivia State
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [triviaSubmitted, setTriviaSubmitted] = useState(false);

  // Mobile Bottom Navigation Tab
  const [mobileTab, setMobileTab] = useState('feed');

  // Animation giả lập thanh sóng âm thanh khi nhạc chạy
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setAudioProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Xử lý tạo bài viết mới
  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!composerText.trim()) return;

    const newPost = {
      id: `post-${Date.now()}`,
      isIncognito,
      author: isIncognito
        ? {
            name: `Ẩn danh #${Math.floor(Math.random() * 900) + 100}`,
            handle: '@anonymous',
            role: 'Thành viên ẩn danh',
            avatar: null,
          }
        : {
            name: 'Tôi (Học sinh 10A7)',
            handle: '@toi_10a7',
            role: 'Học sinh 10A7',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          },
      content: composerText,
      time: 'Vừa xong',
      tags: [selectedTag, '#Lop10A7'],
      reactions: { heart: 1, laugh: 0, sparkle: 0, userReacted: { heart: true } },
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setComposerText('');
  };

  // Toggle Thả Reaction
  const handleToggleReaction = (postId, reactionType, isPinned = false) => {
    if (isPinned) {
      setPinnedItem((prev) => {
        const isCurrentlyReacted = prev.reactions.userReacted?.[reactionType];
        return {
          ...prev,
          reactions: {
            ...prev.reactions,
            [reactionType]: isCurrentlyReacted
              ? Math.max(0, prev.reactions[reactionType] - 1)
              : prev.reactions[reactionType] + 1,
            userReacted: {
              ...prev.reactions.userReacted,
              [reactionType]: !isCurrentlyReacted,
            },
          },
        };
      });
      return;
    }

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;
        const isCurrentlyReacted = post.reactions.userReacted?.[reactionType];
        return {
          ...post,
          reactions: {
            ...post.reactions,
            [reactionType]: isCurrentlyReacted
              ? Math.max(0, post.reactions[reactionType] - 1)
              : post.reactions[reactionType] + 1,
            userReacted: {
              ...post.reactions.userReacted,
              [reactionType]: !isCurrentlyReacted,
            },
          },
        };
      })
    );
  };

  // Gửi bình luận
  const handleAddComment = (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const newComment = {
      id: `c-${Date.now()}`,
      author: {
        name: 'Tôi (Học sinh 10A7)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        role: 'Học sinh 10A7',
      },
      content: text,
      time: 'Vừa xong',
      likes: 0,
    };

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: [...(post.comments || []), newComment],
        };
      })
    );

    setCommentInputs({ ...commentInputs, [postId]: '' });
    setExpandedComments({ ...expandedComments, [postId]: true });
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 font-sans antialiased selection:bg-[#00F2FE]/30 selection:text-white pb-20 lg:pb-8">
      {/* ================= TOP APP BAR (STICKY) ================= */}
      <header className="sticky top-0 z-40 bg-[#0B0E14]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Class Brand */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00F2FE] via-[#8B5CF6] to-[#00F2FE] p-[1.5px] transition-transform duration-300 group-hover:scale-105 shadow-[0_0_16px_rgba(0,242,254,0.35)]">
                <div className="w-full h-full bg-[#0B0E14] rounded-[10px] flex items-center justify-center font-extrabold text-sm tracking-wider text-[#00F2FE]">
                  10A7
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#0B0E14] rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1">
                  Lớp 10A7 <Sparkles className="w-3.5 h-3.5 text-[#00F2FE]" />
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/20 font-medium">
                  2026 – 2027
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Trung tâm GDNN - GDTX Huyện Định Quán</p>
            </div>
          </div>

          {/* Quick Search & User Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm bài học, tài liệu, hashtag..."
                className="w-full bg-[#151A23] border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-all"
              />
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl bg-[#151A23] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00F2FE] rounded-full animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00F2FE] rounded-full"></span>
            </button>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                alt="My Profile"
                className="w-8 h-8 rounded-full ring-2 ring-[#00F2FE]/50 object-cover"
              />
              <div className="hidden lg:block text-left text-xs leading-tight">
                <p className="font-semibold text-white">Bạn (Học sinh)</p>
                <p className="text-[10px] text-emerald-400 font-medium">● Đang trực tuyến</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN 3-COLUMN CONTAINER ================= */}
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_320px] gap-6 justify-center">

          {/* ================= CỘT 1: LEFT SIDEBAR (260px) ================= */}
          <aside className="hidden lg:flex flex-col gap-5 sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto pr-1 scrollbar-none">
            {/* Community Card Header */}
            <div className="bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00F2FE]/15 to-transparent rounded-bl-full pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#00F2FE] to-[#8B5CF6] p-[2px] shadow-[0_0_20px_rgba(0,242,254,0.3)]">
                  <div className="w-full h-full bg-[#0B0E14] rounded-[10px] flex items-center justify-center font-black text-lg text-[#00F2FE]">
                    10A7
                  </div>
                </div>
                <div>
                  <h2 className="font-bold text-sm text-white">Cộng đồng 10A7</h2>
                  <p className="text-[11px] text-slate-400">42 thành viên · 1 GVCN</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  18 bạn online
                </span>
                <span className="text-[#00F2FE] font-medium text-[11px] cursor-pointer hover:underline">
                  Xem DS lớp
                </span>
              </div>
            </div>

            {/* Channels Navigation */}
            <div className="bg-[#151A23] border border-white/10 rounded-2xl p-3 shadow-xl flex flex-col gap-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 py-1.5">
                Kênh thảo luận
              </p>
              {channels.map((channel) => {
                const IconComponent = channel.icon;
                const isActive = activeChannel === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#00F2FE]/15 to-[#8B5CF6]/10 text-[#00F2FE] border border-[#00F2FE]/30 shadow-[0_0_12px_rgba(0,242,254,0.15)]'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#00F2FE]' : 'text-slate-400'}`} />
                      <span className="truncate">{channel.name}</span>
                    </div>

                    {channel.isVoice ? (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        {channel.membersCount}
                      </div>
                    ) : channel.unread > 0 ? (
                      <span className="bg-[#8B5CF6] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {channel.unread}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Voice Soundwave Indicator Pill */}
            <div className="bg-gradient-to-r from-[#151A23] to-[#1a2230] border border-[#00F2FE]/20 rounded-2xl p-3.5 shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00F2FE]/10 flex items-center justify-center text-[#00F2FE]">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Lofi Study Room</p>
                  <p className="text-[10px] text-slate-400">5 bạn đang cùng học</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 h-4">
                <span className="w-1 bg-[#00F2FE] h-2.5 rounded-full animate-bounce"></span>
                <span className="w-1 bg-[#00F2FE] h-4 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1 bg-[#00F2FE] h-1.5 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </aside>

          {/* ================= CỘT 2: MAIN FEED (MAX 640px) ================= */}
          <section className="w-full max-w-[640px] mx-auto flex flex-col gap-6">

            {/* 1. PINNED TEACHER ANNOUNCEMENT (GOLD NEON BORDER) */}
            <div className="bg-[#151A23] border border-[#FFB800]/40 rounded-2xl p-5 shadow-[0_0_24px_rgba(255,184,0,0.12)] relative overflow-hidden transition-all hover:border-[#FFB800]/60">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-[#FFB800]/20 to-transparent w-40 h-full pointer-events-none"></div>

              {/* Pinned Badge & Author */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={pinnedItem.author.avatar}
                      alt={pinnedItem.author.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-[#FFB800]"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-[#FFB800] text-black p-0.5 rounded-full">
                      <Pin className="w-2.5 h-2.5 fill-black" />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">{pinnedItem.author.name}</span>
                      <CheckCircle2 className="w-4 h-4 text-[#00F2FE] fill-[#00F2FE]/20" />
                      <span className="text-[10px] bg-[#FFB800]/15 text-[#FFB800] px-2 py-0.5 rounded-full border border-[#FFB800]/30 font-semibold">
                        {pinnedItem.author.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{pinnedItem.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-[#FFB800] font-semibold bg-[#FFB800]/10 px-2.5 py-1 rounded-full border border-[#FFB800]/25">
                  <Pin className="w-3.5 h-3.5 fill-current" />
                  Ghim
                </div>
              </div>

              {/* Title & Body */}
              <h3 className="text-sm font-bold text-white mb-2 leading-snug hover:text-[#FFB800] transition-colors cursor-pointer">
                {pinnedItem.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line mb-3">
                {pinnedItem.content}
              </p>

              {/* Attachment Card */}
              {pinnedItem.attachment && (
                <div className="mb-3.5 flex items-center justify-between p-3 rounded-xl bg-[#0B0E14]/70 border border-white/10 hover:border-[#FFB800]/40 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#FFB800]/10 text-[#FFB800] flex items-center justify-center font-bold text-xs">
                      PDF
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-200 group-hover:text-[#FFB800] transition-colors">
                        {pinnedItem.attachment.title}
                      </p>
                      <p className="text-[10px] text-slate-400">{pinnedItem.attachment.size} · Đề cương chính thức</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#FFB800] transition-colors mr-1" />
                </div>
              )}

              {/* Hashtags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {pinnedItem.tags.map((tag, idx) => (
                  <span key={idx} className="text-[11px] text-[#00F2FE] hover:underline cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Reactions & Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleReaction(pinnedItem.id, 'heart', true)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      pinnedItem.reactions.userReacted?.heart
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${pinnedItem.reactions.userReacted?.heart ? 'fill-current' : ''}`} />
                    <span>{pinnedItem.reactions.heart}</span>
                  </button>

                  <button
                    onClick={() => handleToggleReaction(pinnedItem.id, 'sparkle', true)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      pinnedItem.reactions.userReacted?.sparkle
                        ? 'bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{pinnedItem.reactions.sparkle}</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {pinnedItem.commentsCount} phản hồi
                </span>
              </div>
            </div>

            {/* 2. MODERN POST CREATOR */}
            <div className="bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl">
              <form onSubmit={handleCreatePost}>
                <div className="flex items-start gap-3 mb-3">
                  {isIncognito ? (
                    <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 flex items-center justify-center text-[#8B5CF6] shadow-[0_0_12px_rgba(139,92,246,0.3)]">
                      <Ghost className="w-5 h-5 animate-pulse" />
                    </div>
                  ) : (
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                      alt="Avatar"
                      className="w-10 h-10 rounded-full ring-2 ring-white/10 object-cover"
                    />
                  )}

                  <div className="flex-1">
                    <textarea
                      value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      placeholder={
                        isIncognito
                          ? 'Đang ở chế độ Ẩn danh (Safe Incognito Mode). Viết điều bạn muốn chia sẻ bí mật...'
                          : 'Bạn đang nghĩ gì, 10A7-er? Đặt câu hỏi bài tập hoặc chia sẻ trải nghiệm...'
                      }
                      rows={3}
                      className="w-full bg-[#0B0E14]/60 border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Bottom Toolbar & Incognito Switch */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                  {/* Quick Pill Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#00F2FE]" />
                      <span>Ảnh / Media</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs transition-colors"
                    >
                      <Mic className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      <span>Audio</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bình chọn</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#FFB800]" />
                      <span>Hỏi bài</span>
                    </button>
                  </div>

                  {/* Incognito Toggle & Submit Button */}
                  <div className="flex items-center gap-3 ml-auto">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isIncognito}
                          onChange={(e) => setIsIncognito(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-9 h-5 rounded-full transition-colors ${
                            isIncognito ? 'bg-[#8B5CF6]' : 'bg-slate-700'
                          }`}
                        ></div>
                        <div
                          className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            isIncognito ? 'transform translate-x-4' : ''
                          }`}
                        ></div>
                      </div>
                      <span className={`text-[11px] font-medium flex items-center gap-1 ${isIncognito ? 'text-[#8B5CF6]' : 'text-slate-400'}`}>
                        <Ghost className="w-3 h-3" />
                        Ẩn danh
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={!composerText.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs transition-all shadow-[0_0_12px_rgba(0,242,254,0.3)]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Đăng bài</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* 3. COMMUNITY FEED POSTS */}
            <div className="flex flex-col gap-4">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-[#151A23] border border-white/10 rounded-2xl p-5 shadow-xl transition-all hover:border-white/15"
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {post.isIncognito ? (
                        <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.25)]">
                          <Ghost className="w-5 h-5" />
                        </div>
                      ) : (
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                        />
                      )}

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white">{post.author.name}</span>
                          {post.author.verified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00F2FE] fill-[#00F2FE]/20" />
                          )}
                          <span className="text-[10px] text-slate-400 font-normal">{post.author.handle}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-300">
                            {post.author.role}
                          </span>
                          <span>•</span>
                          <span>{post.time}</span>
                        </div>
                      </div>
                    </div>

                    <button className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <p className="text-xs text-slate-200 leading-relaxed mb-3 whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {post.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[11px] text-[#00F2FE] bg-[#00F2FE]/5 px-2 py-0.5 rounded-md border border-[#00F2FE]/15 hover:bg-[#00F2FE]/10 transition-colors cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Reaction Buttons & Comment Toggle */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                      {/* Heart Reaction */}
                      <button
                        onClick={() => handleToggleReaction(post.id, 'heart')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          post.reactions.userReacted?.heart
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.reactions.userReacted?.heart ? 'fill-current' : ''}`} />
                        <span>{post.reactions.heart}</span>
                      </button>

                      {/* Laugh Reaction */}
                      <button
                        onClick={() => handleToggleReaction(post.id, 'laugh')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          post.reactions.userReacted?.laugh
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <Smile className="w-3.5 h-3.5" />
                        <span>{post.reactions.laugh}</span>
                      </button>

                      {/* Sparkle Reaction */}
                      <button
                        onClick={() => handleToggleReaction(post.id, 'sparkle')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          post.reactions.userReacted?.sparkle
                            ? 'bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40 shadow-[0_0_8px_rgba(0,242,254,0.3)]'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{post.reactions.sparkle}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setExpandedComments({
                            ...expandedComments,
                            [post.id]: !expandedComments[post.id],
                          })
                        }
                        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.comments?.length || 0}</span>
                      </button>
                      <button className="text-slate-400 hover:text-white transition-colors">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* THREADED COMMENTS SECTION */}
                  {expandedComments[post.id] && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
                      {post.comments?.map((comment) => (
                        <div
                          key={comment.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-all ${
                            comment.isTeacher
                              ? 'bg-[#FFB800]/5 border border-[#FFB800]/20'
                              : 'bg-[#0B0E14]/50 border border-white/5'
                          }`}
                        >
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.name}
                            className={`w-7 h-7 rounded-full object-cover shrink-0 ${
                              comment.isTeacher ? 'ring-1.5 ring-[#FFB800]' : 'ring-1 ring-white/10'
                            }`}
                          />
                          <div className="flex-1 min-w-0 text-xs">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="font-semibold text-white truncate">{comment.author.name}</span>
                              {comment.isTeacher && (
                                <span className="text-[9px] bg-[#FFB800]/20 text-[#FFB800] px-1.5 py-0.2 rounded font-bold">
                                  Giáo viên
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500">• {comment.time}</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      ))}

                      {/* Comment Input Box */}
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(post.id);
                            }
                          }}
                          placeholder="Viết phản hồi cho bài này..."
                          className="flex-1 bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="p-2 rounded-xl bg-[#00F2FE]/10 hover:bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/30 transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          {/* ================= CỘT 3: RIGHT SIDEBAR (320px) ================= */}
          <aside className="hidden lg:flex flex-col gap-5 sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto pr-1 scrollbar-none">

            {/* 1. MINI MUSIC PLAYER ("Lofi Study Room") */}
            <div className="bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-28 h-28 bg-[#8B5CF6]/15 rounded-bl-full pointer-events-none"></div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Music className="w-4 h-4 text-[#00F2FE]" />
                  <span>Lofi Study Room 🎧</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  LIVE
                </span>
              </div>

              {/* Album Art & Title */}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&auto=format&fit=crop&q=80"
                    alt="Track Art"
                    className="w-full h-full object-cover"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-[#00F2FE] animate-ping"></span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">Midnight Study Beats</h4>
                  <p className="text-[11px] text-slate-400 truncate">Lofi Girl x 10A7 Chillhop</p>
                </div>
              </div>

              {/* Animated Frequency Bars */}
              <div className="flex items-end justify-between gap-1 h-6 mb-3 px-1">
                {[14, 24, 18, 28, 12, 22, 16, 26, 20, 15, 24, 18].map((val, idx) => (
                  <span
                    key={idx}
                    style={{
                      height: isPlaying ? `${Math.max(4, (val * (audioProgress % 4 + 1)) % 24)}px` : '4px',
                    }}
                    className="flex-1 bg-gradient-to-t from-[#00F2FE] to-[#8B5CF6] rounded-full transition-all duration-300"
                  ></span>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 h-1.5 rounded-full mb-3 overflow-hidden">
                <div
                  style={{ width: `${audioProgress}%` }}
                  className="h-full bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] rounded-full transition-all"
                ></div>
              </div>

              {/* Player Controls */}
              <div className="flex items-center justify-between text-slate-300">
                <Volume2 className="w-4 h-4 text-slate-400 cursor-pointer hover:text-white" />
                <div className="flex items-center gap-3">
                  <button className="hover:text-[#00F2FE] transition-colors">
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-9 h-9 rounded-full bg-[#00F2FE] text-black flex items-center justify-center shadow-[0_0_12px_rgba(0,242,254,0.4)] hover:scale-105 transition-all"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
                  </button>
                  <button className="hover:text-[#00F2FE] transition-colors">
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[10px] font-mono text-slate-400">01:42</span>
              </div>
            </div>

            {/* 2. DAILY TRIVIA & STREAK LEADERBOARD */}
            <div className="bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Flame className="w-4 h-4 text-[#FFB800] fill-[#FFB800]/20" />
                  <span>Đố vui & Streak 10A7</span>
                </div>
                <span className="text-[10px] text-[#FFB800] font-semibold flex items-center gap-0.5">
                  Top 3 <Award className="w-3 h-3 text-[#FFB800]" />
                </span>
              </div>

              {/* Interactive Mini Quiz */}
              <div className="p-3 rounded-xl bg-[#0B0E14]/70 border border-white/5">
                <p className="text-xs font-medium text-slate-200 mb-2">
                  ❓ Trong chuyển động thẳng biến đổi đều, công thức liên hệ vận tốc, gia tốc và quãng đường là?
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {['v² - v₀² = 2as', 'v = v₀ + a/t', 's = vt + at²', 'a = (v - v₀)t'].map((opt, i) => (
                    <button
                      key={i}
                      disabled={triviaSubmitted}
                      onClick={() => {
                        setSelectedAnswer(opt);
                        setTriviaSubmitted(true);
                      }}
                      className={`text-[11px] px-2.5 py-1.5 rounded-lg border text-left font-mono transition-all ${
                        selectedAnswer === opt
                          ? i === 0
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-rose-500/20 border-rose-400 text-rose-300'
                          : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {triviaSubmitted && (
                  <p className="text-[10px] text-emerald-400 mt-2 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Chính xác! Bạn nhận được +50 điểm và nối dài streak!
                  </p>
                )}
              </div>

              {/* Leaderboard Stack */}
              <div className="flex flex-col gap-2 pt-1">
                {LEADERBOARD_STUDENTS.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          st.rank === 1
                            ? 'bg-[#FFB800] text-black'
                            : st.rank === 2
                            ? 'bg-slate-300 text-black'
                            : 'bg-amber-700 text-white'
                        }`}
                      >
                        {st.rank}
                      </span>
                      <img src={st.avatar} alt={st.name} className="w-7 h-7 rounded-full object-cover" />
                      <span className="text-xs font-medium text-slate-200 truncate">{st.name}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-[#FFB800]">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{st.streak} ngày</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. LIVE ONLINE MEMBERS ROSTER */}
            <div className="bg-[#151A23] border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Users className="w-4 h-4 text-[#00F2FE]" />
                  <span>Trực tuyến (18)</span>
                </div>
                <span className="text-[11px] text-[#00F2FE] cursor-pointer hover:underline">Tất cả</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {ONLINE_MEMBERS.map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-200">
                          {member.name.slice(0, 1)}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#151A23] ${member.dot}`}
                        ></span>
                      </div>
                      <span className="text-slate-200 text-xs">{member.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-light">{member.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ================= MOBILE BOTTOM FLOATING DOCK (STICKY) ================= */}
      <nav className="lg:hidden fixed bottom-3 left-4 right-4 z-50 bg-[#151A23]/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setMobileTab('feed')}
            className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
              mobileTab === 'feed' ? 'text-[#00F2FE]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Bảng tin</span>
          </button>

          <button
            onClick={() => setMobileTab('study')}
            className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
              mobileTab === 'study' ? 'text-[#00F2FE]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-medium">Study Hub</span>
          </button>

          {/* Central Highlighted Post Button */}
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-[#00F2FE] to-[#8B5CF6] text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,242,254,0.4)] hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>

          <button
            onClick={() => setMobileTab('voice')}
            className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
              mobileTab === 'voice' ? 'text-[#00F2FE]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Headphones className="w-5 h-5" />
            <span className="text-[10px] font-medium">Lofi Room</span>
          </button>

          <button
            onClick={() => setMobileTab('roster')}
            className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
              mobileTab === 'roster' ? 'text-[#00F2FE]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Lớp 10A7</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
