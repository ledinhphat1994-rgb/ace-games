import { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { GameCard } from './components/GameCard';
import { GameModal } from './components/GameModal';
import { AdBanner } from './components/AdBanner';
import { Footer } from './components/Footer';
import { GAMES_CATALOG } from './data/games';
import type { GameInfo, GameCategory } from './types/game';
import { Flame, Sparkles, Zap, Smartphone, Shield, Trophy, History } from 'lucide-react';

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
    setActiveGame(game);
    setRecents(prev => {
      const filtered = prev.filter(id => id !== game.id);
      const updated = [game.id, ...filtered].slice(0, 5);
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

  // Featured flagship game for Hero (Tetris or Chess)
  const featuredGame = GAMES_CATALOG.find(g => g.id === 'tetris') || GAMES_CATALOG[0];

  // Recently played game objects
  const recentGameObjects = useMemo(() => {
    return recents
      .map(id => GAMES_CATALOG.find(g => g.id === id))
      .filter((g): g is GameInfo => Boolean(g));
  }, [recents]);

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Top Ad Banner */}
        <AdBanner format="leaderboard" />

        {/* Recently Played Quick Bar */}
        {recentGameObjects.length > 0 && !searchQuery && selectedCategory === 'all' && (
          <div className="mb-6 flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 whitespace-nowrap pl-1">
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vừa Chơi:</span>
            </div>
            {recentGameObjects.map(game => (
              <button
                key={`recent-${game.id}`}
                onClick={() => handlePlayGame(game)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/60 rounded-xl text-xs font-semibold text-gray-200 whitespace-nowrap transition-all shadow-sm active:scale-95"
              >
                <span>{game.thumbnailIcon}</span>
                <span>{game.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Poki/CrazyGames Style Hero Banner */}
        {!searchQuery && selectedCategory === 'all' && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-cyan-500/30 p-6 sm:p-10 mb-8 shadow-2xl">
            {/* Background glowing gradients */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase tracking-wider mb-4 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Đấu Trường Game HTML5 Số 1 Việt Nam
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4 font-['Orbitron']">
                ACE GAMES <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                  CHƠI NGAY KHÔNG CẦN CÀI ĐẶT
                </span>
              </h1>
              <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                Tập hợp 9 tựa game kinh điển: Tetris, 2048, Cờ Vua, Cờ Tướng, Cờ Caro AI, Rắn Săn Mồi... Tải trang tức thì, 100% mượt mà trên iPhone, iPad, Android & Máy tính.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handlePlayGame(featuredGame)}
                  className="flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-cyan-500/25 transition transform hover:-translate-y-0.5 text-sm"
                >
                  <Flame className="w-4 h-4 fill-slate-950" /> Chơi Ngay: {featuredGame.title}
                </button>
                <div className="flex items-center gap-2 text-xs text-gray-300 bg-slate-900/80 backdrop-blur border border-slate-700/80 px-4 py-3 rounded-2xl">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Hơn 680,000+ Lượt Chơi Hàng Tuần</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Catalog Section (Poki Bento Grid) */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                {searchQuery
                  ? `Kết quả tìm kiếm cho "${searchQuery}"`
                  : selectedCategory === 'favorites'
                  ? 'Danh Sách Game Yêu Thích Của Bạn'
                  : selectedCategory === 'all'
                  ? 'Kho Game Đỉnh Cao Chọn Lọc'
                  : `Thể Loại: ${filteredGames[0]?.categoryLabel || ''}`}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Hiển thị {filteredGames.length} tựa game miễn phí sẵn sàng chơi ngay
              </p>
            </div>
          </div>

          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredGames.map((game, idx) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onPlay={handlePlayGame}
                  isFavorite={favorites.includes(game.id)}
                  onToggleFavorite={handleToggleFavorite}
                  isFeatured={selectedCategory === 'all' && !searchQuery && idx === 0}
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
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-cyan-500/20"
              >
                Xem Toàn Bộ Game
              </button>
            </div>
          )}
        </section>

        {/* Mid-page Ad Banner */}
        <AdBanner format="leaderboard" />

        {/* Feature Highlights (SEO & Trust Section) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 my-12">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-100 mb-1">Tải Ngay Trong 1 Giây</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Tất cả các game đều được tối ưu hóa siêu nhẹ, chỉ từ 1MB, chơi ngay lập tức không cần chờ đợi.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-100 mb-1">Tối Ưu Điện Thoại & Tablet</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Hỗ trợ cảm ứng vuốt mượt mà trên iPhone, iPad và điện thoại Android với nút điều khiển ảo D-Pad.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-100 mb-1">Mã Nguồn Mở & An Toàn</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                100% game tự do bản quyền, không theo dõi người dùng, an toàn cho mọi lứa tuổi giải trí.
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
