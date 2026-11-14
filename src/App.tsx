import { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GameCard } from './components/GameCard';
import { GameModal } from './components/GameModal';
import { AdBanner } from './components/AdBanner';
import { Footer } from './components/Footer';
import { GAMES_CATALOG } from './data/games';
import type { GameInfo, GameCategory } from './types/game';
import { Flame, Sparkles, Zap, Smartphone, Shield, History, Play, Sword, Gamepad2, Puzzle } from 'lucide-react';
import { soundManager } from './utils/sound';
import { GameCover } from './components/GameCover';

export function App() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [activeGame, setActiveGame] = useState<GameInfo | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  const handleRandomGame = () => {
    const randomGame = GAMES_CATALOG[Math.floor(Math.random() * GAMES_CATALOG.length)];
    handlePlayGame(randomGame);
  };

  // Filtered games based on search & category
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

  // Featured flagship game for Hero (Space Shooter or Breakout)
  const featuredGame = GAMES_CATALOG.find(g => g.id === 'space-shooter') || GAMES_CATALOG[0];

  // Recently played game objects
  const recentGameObjects = useMemo(() => {
    return recents
      .map(id => GAMES_CATALOG.find(g => g.id === id))
      .filter((g): g is GameInfo => Boolean(g));
  }, [recents]);

  // Section groupings for CrazyGames Rails
  const trendingGames = useMemo(() => GAMES_CATALOG.filter(g => g.isHot || g.isNew), []);
  const strategyGames = useMemo(() => GAMES_CATALOG.filter(g => g.category === 'strategy'), []);
  const arcadeGames = useMemo(() => GAMES_CATALOG.filter(g => g.category === 'arcade' || g.category === 'classic'), []);
  const puzzleGames = useMemo(() => GAMES_CATALOG.filter(g => g.category === 'puzzle'), []);

  return (
    <div className="min-h-screen bg-[#070b14] text-gray-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-slate-950">
      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Main Body with CrazyGames Sidebar & Rails */}
      <div className="flex-1 flex w-full">
        {/* Left Sidebar */}
        <Sidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onRandomGame={handleRandomGame}
          favoritesCount={favorites.length}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 px-3 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
          {/* Top Promotional Ad Banner */}
          <AdBanner format="leaderboard" />

          {/* Recently Played Quick Launch Bar */}
          {recentGameObjects.length > 0 && !searchQuery && selectedCategory === 'all' && (
            <div className="mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
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

          {/* CrazyGames Style Spotlight Hero Showcase */}
          {!searchQuery && selectedCategory === 'all' && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-white/10 p-5 sm:p-8 md:p-9 mb-8 shadow-2xl">
              {/* Ambient neon radial glows */}
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/25 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-fuchsia-600/25 rounded-full blur-[100px] pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                {/* Left Column: Headline and Actions */}
                <div className="lg:col-span-7">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 text-[11px] font-black uppercase tracking-wider mb-3 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CỔNG GAME ĐỈNH CAO HTML5 60FPS</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3 font-['Orbitron']">
                    ACE GAMES PRO <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 drop-shadow-sm">
                      CHƠI NGAY MIỄN PHÍ
                    </span>
                  </h1>

                  <p className="text-gray-300 text-xs sm:text-sm mb-6 leading-relaxed max-w-xl">
                    11 trò chơi arcade & trí tuệ hàng đầu: <b className="text-white">Chiến Cơ Không Gian, Cờ Vua AI, Cờ Tướng, Phá Gạch, Tetris, 2048</b>... 
                    Tối ưu âm thanh arcade zero-latency, 100% mượt mà trên iPhone, Android, iPad & PC.
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

                    <button
                      onMouseEnter={() => soundManager.playCardHover()}
                      onClick={handleRandomGame}
                      className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-amber-400 font-bold text-xs sm:text-sm transition cursor-pointer"
                    >
                      <span>🎲 Game Ngẫu Nhiên</span>
                    </button>
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
                        <Flame className="w-3.5 h-3.5 fill-white" /> GAME NỔI BẬT NHẤT
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

          {/* CRAZYGAMES MODE: SHOW THEMATIC RAILS WHEN BROWSING 'ALL' */}
          {selectedCategory === 'all' && !searchQuery ? (
            <div className="space-y-10 mb-12">
              {/* Rail 1: Trending Now (Bento Grid) */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 font-['Orbitron']">
                    <Flame className="w-5 h-5 text-rose-500 fill-rose-500" />
                    <span>Game Đang Thịnh Hành (Trending)</span>
                  </h2>
                  <span className="text-xs text-cyan-400 font-bold cursor-pointer hover:underline">
                    {trendingGames.length} tựa game
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {trendingGames.map((game, idx) => (
                    <GameCard
                      key={`trend-${game.id}`}
                      game={game}
                      onPlay={handlePlayGame}
                      isFavorite={favorites.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                      isFeatured={idx === 0}
                      size={idx === 1 ? 'wide' : 'normal'}
                    />
                  ))}
                </div>
              </section>

              {/* Rail 2: Chess & Strategy (Cờ & Đấu Trí) */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 font-['Orbitron']">
                    <Sword className="w-5 h-5 text-amber-400" />
                    <span>Cờ & Đấu Trí Đỉnh Cao (AI Engine)</span>
                  </h2>
                  <span className="text-xs text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                    Thuật toán Minimax FIDE
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-4.5">
                  {strategyGames.map(game => (
                    <GameCard
                      key={`strat-${game.id}`}
                      game={game}
                      onPlay={handlePlayGame}
                      isFavorite={favorites.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                      size="wide"
                    />
                  ))}
                </div>
              </section>

              {/* Rail 3: Classic Arcade & Action */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 font-['Orbitron']">
                    <Gamepad2 className="w-5 h-5 text-cyan-400" />
                    <span>Huyền Thoại Arcade (60 FPS)</span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {arcadeGames.map(game => (
                    <GameCard
                      key={`arcade-${game.id}`}
                      game={game}
                      onPlay={handlePlayGame}
                      isFavorite={favorites.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </section>

              {/* Rail 4: Puzzles & Numbers */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 font-['Orbitron']">
                    <Puzzle className="w-5 h-5 text-purple-400" />
                    <span>Giải Đố & Rèn Luyện Trí Não</span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-4.5">
                  {puzzleGames.map(game => (
                    <GameCard
                      key={`puz-${game.id}`}
                      game={game}
                      onPlay={handlePlayGame}
                      isFavorite={favorites.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                      size="wide"
                    />
                  ))}
                </div>
              </section>
            </div>
          ) : (
            /* FILTERED / SEARCH VIEW */
            <section className="mb-12">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 font-['Orbitron']">
                    <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                    {searchQuery
                      ? `Kết Quả: "${searchQuery}"`
                      : selectedCategory === 'favorites'
                      ? 'Bộ Sưu Tập Game Yêu Thích Của Bạn'
                      : `Thể Loại: ${filteredGames[0]?.categoryLabel || ''}`}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Tìm thấy {filteredGames.length} trò chơi phù hợp
                  </p>
                </div>
              </div>

              {filteredGames.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                  {filteredGames.map((game, idx) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onPlay={handlePlayGame}
                      isFavorite={favorites.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                      isFeatured={idx === 0}
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
                      : 'Hãy thử tìm kiếm với từ khóa khác như "cờ", "chiến cơ", "tetris", "2048"...'}
                  </p>
                  <button
                    onMouseEnter={() => soundManager.playCardHover()}
                    onClick={() => {
                      soundManager.playButtonClick();
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    Xem Toàn Bộ Game
                  </button>
                </div>
              )}
            </section>
          )}

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
      </div>

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
