import { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { GameCard } from './components/GameCard';
import { GameModal } from './components/GameModal';
import { AdBanner } from './components/AdBanner';
import { Footer } from './components/Footer';
import { GAMES_CATALOG } from './data/games';
import type { GameInfo, GameCategory } from './types/game';
import { Flame, Sparkles, Zap, Smartphone, Shield, History, Play, Volume2 } from 'lucide-react';
import { soundManager } from './utils/sound';
import { GameCover } from './components/GameCover';

export function App() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [activeGame, setActiveGame] = useState<GameInfo | null>(null);

  // Favorites in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('acegames_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Recently played in localStorage
  const [recents, setRecents] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('acegames_recents') || '[]');
    } catch {
      return [];
    }
  });

  const handlePlayGame = (game: GameInfo) => {
    soundManager.playGameLaunch();
    setActiveGame(game);
    setRecents(prev => {
      const filtered = prev.filter(id => id !== game.id);
      const updated = [game.id, ...filtered].slice(0, 6);
      localStorage.setItem('acegames_recents', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleFavorite = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const exists = prev.includes(gameId);
      const updated = exists ? prev.filter(id => id !== gameId) : [...prev, gameId];
      localStorage.setItem('acegames_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  // Filter games based on search, category and favorites
  const filteredGames = useMemo(() => {
    return GAMES_CATALOG.filter(game => {
      if (selectedCategory === 'favorites') {
        if (!favorites.includes(game.id)) return false;
      } else if (selectedCategory !== 'all') {
        if (game.category !== selectedCategory) return false;
      }

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        game.title.toLowerCase().includes(q) ||
        game.description.toLowerCase().includes(q) ||
        game.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory, favorites]);

  // Featured flagship game for Hero (Tetris or Breakout)
  const featuredGame = GAMES_CATALOG.find(g => g.id === 'breakout') || GAMES_CATALOG[0];

  // Recently played game objects
  const recentGameObjects = useMemo(() => {
    return recents
      .map(id => GAMES_CATALOG.find(g => g.id === id))
      .filter((g): g is GameInfo => Boolean(g));
  }, [recents]);

  return (
    <div className="min-h-screen bg-[#070b14] text-gray-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-slate-950">
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Top Promotional Ad Banner */}
        <AdBanner format="leaderboard" />

        {/* Recently Played Quick Launch Bar */}
        {recentGameObjects.length > 0 && !searchQuery && selectedCategory === 'all' && (
          <div className="mb-5 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-400 whitespace-nowrap pl-1">
              <History className="w-3.5 h-3.5" />
              <span>Vừa Chơi:</span>
            </div>
            {recentGameObjects.map(game => (
              <button
                key={`recent-${game.id}`}
                onMouseEnter={() => soundManager.playCardHover()}
                onClick={() => handlePlayGame(game)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-400/80 rounded-full text-xs font-bold text-gray-200 whitespace-nowrap transition-all shadow-sm active:scale-95 group"
              >
                <span className="text-sm group-hover:scale-110 transition-transform">{game.thumbnailIcon}</span>
                <span>{game.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Poki/CrazyGames Style Spotlight Hero Showcase */}
        {!searchQuery && selectedCategory === 'all' && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-white/10 p-5 sm:p-8 md:p-10 mb-8 shadow-2xl">
            {/* Ambient neon radial glows */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/25 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-fuchsia-600/25 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* Left Column: Headline and Actions */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 text-[11px] font-black uppercase tracking-wider mb-3 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ĐẤU TRƯỜNG WEB GAME 60FPS</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3 font-['Orbitron']">
                  CHƠI GAME ĐỈNH CAO <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 drop-shadow-sm">
                    KHÔNG CẦN CÀI ĐẶT
                  </span>
                </h1>

                <p className="text-gray-300 text-xs sm:text-sm mb-6 leading-relaxed max-w-xl">
                  Khám phá 10 tựa game tuyển chọn: <b className="text-white">Cờ Vua AI, Cờ Tướng, Tetris, Phá Gạch, 2048, Rắn Săn Mồi</b>... 
                  Âm thanh sống động, tương thích hoàn hảo mọi thiết bị di động & máy tính.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onMouseEnter={() => soundManager.playCardHover()}
                    onClick={() => handlePlayGame(featuredGame)}
                    className="flex items-center gap-2.5 px-6 sm:px-8 py-3.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black rounded-2xl shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all transform hover:-translate-y-1 active:scale-95 text-sm sm:text-base cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-slate-950" />
                    <span>CHƠI NGAY: {featuredGame.title}</span>
                  </button>

                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl">
                    <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Hiệu Ứng Âm Thanh Arcade</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Featured Card Preview */}
              <div className="lg:col-span-5">
                <div
                  onClick={() => handlePlayGame(featuredGame)}
                  onMouseEnter={() => soundManager.playCardHover()}
                  className="group relative aspect-[16/10] rounded-3xl overflow-hidden cursor-pointer border-2 border-cyan-400/60 shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_60px_rgba(6,182,212,0.5)] bg-slate-900"
                >
                  <GameCover gameId={featuredGame.id} className="w-full h-full" />
                  
                  {/* Glowing Play overlay */}
                  <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-cyan-400/90 text-slate-950 flex items-center justify-center shadow-2xl group-hover:scale-115 transition-transform duration-300">
                      <Play className="w-7 h-7 fill-slate-950 ml-1" />
                    </div>
                  </div>

                  {/* Top Badge */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-rose-500 text-white px-3 py-1 rounded-full shadow-lg">
                      <Flame className="w-3.5 h-3.5 fill-white" /> GAME THỊNH HÀNH
                    </span>
                  </div>

                  {/* Bottom title scrim */}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{featuredGame.categoryLabel}</span>
                      <h4 className="text-base font-black text-white">{featuredGame.title}</h4>
                    </div>
                    <span className="text-xs font-black text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/40">
                      ★ {featuredGame.rating}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Catalog Section (Poki Bento Visual Grid) */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 font-['Orbitron']">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                {searchQuery
                  ? `Kết Quả: "${searchQuery}"`
                  : selectedCategory === 'favorites'
                  ? 'Bộ Sưu Tập Yêu Thích Của Bạn'
                  : selectedCategory === 'all'
                  ? 'Kho Trò Chơi Tuyển Chọn'
                  : `Danh Mục: ${filteredGames[0]?.categoryLabel || ''}`}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {filteredGames.length} tựa game HTML5 tốc độ cao • Nhấp để chơi ngay lập tức
              </p>
            </div>
          </div>

          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4.5">
              {filteredGames.map((game, idx) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onPlay={handlePlayGame}
                  isFavorite={favorites.includes(game.id)}
                  onToggleFavorite={handleToggleFavorite}
                  isFeatured={selectedCategory === 'all' && !searchQuery && idx === 0}
                  size={selectedCategory === 'all' && !searchQuery && idx === 1 ? 'wide' : 'normal'}
                />
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-gray-400">
              <span className="text-5xl mb-3 block">
                {selectedCategory === 'favorites' ? '💔' : '🔍'}
              </span>
              <h3 className="text-lg font-bold text-gray-200 mb-1">
                {selectedCategory === 'favorites'
                  ? 'Chưa có tựa game nào trong danh sách Yêu Thích'
                  : 'Không tìm thấy tựa game nào!'}
              </h3>
              <p className="text-xs mb-4">
                {selectedCategory === 'favorites'
                  ? 'Hãy bấm vào biểu tượng Trái Tim ❤️ ở các thẻ game để lưu lại những game bạn thích nhất!'
                  : 'Hãy thử tìm kiếm với từ khóa khác như "cờ", "tetris", "2048", "rắn"...'}
              </p>
              <button
                onMouseEnter={() => soundManager.playCardHover()}
                onClick={() => {
                  soundManager.playButtonClick();
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-cyan-500/20"
              >
                Xem Toàn Bộ Game
              </button>
            </div>
          )}
        </section>

        {/* Feature Highlights (Trust & Quality Badges) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 my-10">
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 flex items-start gap-4 shadow-lg hover:border-cyan-500/40 transition-colors">
            <div className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white mb-1">Tải Tức Thì 60 FPS</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Tất cả các tựa game được biên dịch bằng TypeScript siêu nhẹ, khởi chạy ngay tức khắc không cần tải thêm dữ liệu.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 flex items-start gap-4 shadow-lg hover:border-purple-500/40 transition-colors">
            <div className="p-3 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex-shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white mb-1">Cảm Ứng Di Động Chuẩn Xác</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Hỗ trợ vuốt chạm đa điểm trên iPhone, iPad, Android với cụm phím ảo D-Pad chuyên dụng.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 flex items-start gap-4 shadow-lg hover:border-emerald-500/40 transition-colors">
            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white mb-1">Âm Thanh Arcade Chân Thực</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Tích hợp bộ tổng hợp âm thanh Web Audio API zero-latency, mang đến cảm giác giải trí như trên máy điện tử cầm tay.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Active Game Modal */}
      {activeGame && (
        <GameModal
          game={activeGame}
          onClose={() => setActiveGame(null)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
