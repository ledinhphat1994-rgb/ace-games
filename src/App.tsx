import { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { GameCard } from './components/GameCard';
import { GameModal } from './components/GameModal';
import { ArcadeBackground } from './components/ArcadeBackground';
import { Footer } from './components/Footer';
import { GAMES_CATALOG } from './data/games';
import type { GameInfo, GameCategory } from './types/game';
import { soundManager } from './utils/sound';

export function App() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  
  // Tự động mở đúng game khi mở qua Link mời PVP (vd: ?game=xiangqi&room=1234)
  const [activeGame, setActiveGame] = useState<GameInfo | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const gameParam = params.get('game');
      if (gameParam) {
        return GAMES_CATALOG.find(g => g.id === gameParam) || null;
      }
    } catch {}
    return null;
  });

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('acegames_favorites') || '[]');
    } catch {
      return [];
    }
  });

  const handlePlayGame = (game: GameInfo) => {
    soundManager.playGameLaunch();
    setActiveGame(game);
  };

  const handleCloseActiveGame = () => {
    setActiveGame(null);
    // Dọn dẹp query param khi đóng game mà không cần reload trang
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
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

  // Filtered games
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
        (game.subtitle && game.subtitle.toLowerCase().includes(q)) ||
        game.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory, favorites]);

  return (
    <div className={`relative bg-[#05070c] text-gray-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-slate-950 ${
      activeGame ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen overflow-x-hidden'
    }`}>
      {/* Interactive Animated Cyberpunk Arcade Background */}
      <ArcadeBackground />

      {/* Top Navigation: Ẩn hoàn toàn khi đang chơi game để màn hình game Full 100% Viewport */}
      {!activeGame && (
        <Header
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q) setActiveGame(null);
          }}
          selectedCategory={selectedCategory}
          onCategoryChange={(cat) => {
            setSelectedCategory(cat);
            setActiveGame(null);
          }}
          onRandomGame={handleRandomGame}
        />
      )}

      {/* Main Content Arena: Full Màn Hình khi chơi game, Grid Catalog khi chọn game */}
      {activeGame ? (
        <GameModal
          game={activeGame}
          onClose={handleCloseActiveGame}
        />
      ) : (
        <main className="relative z-10 flex-1 max-w-[1360px] mx-auto w-full px-3 sm:px-6 py-4 sm:py-6">
          {/* Normal Catalog Mode: Show Game Cards Grid when not playing */}
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4.5">
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
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center text-gray-400 max-w-md mx-auto my-12">
              <span className="text-5xl mb-3 block">
                {selectedCategory === 'favorites' ? '💔' : '🔍'}
              </span>
              <h3 className="text-base font-bold text-white mb-1.5">
                {selectedCategory === 'favorites'
                  ? 'Chưa có game yêu thích'
                  : 'Không tìm thấy game'}
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                {selectedCategory === 'favorites'
                  ? 'Bấm ❤️ ở thẻ game để lưu vào đây.'
                  : 'Thử tìm từ khóa: cờ, 2048, rắn, gạch...'}
              </p>
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black rounded-full text-xs shadow-lg shadow-cyan-500/30 transition cursor-pointer"
              >
                Xem Toàn Bộ Game
              </button>
            </div>
          )}
        </main>
      )}

      {/* Footer: Shown ONLY in catalog mode, hidden when playing to avoid scrolling */}
      {!activeGame && <Footer />}
    </div>
  );
}

export default App;
