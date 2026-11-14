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
  const [activeGame, setActiveGame] = useState<GameInfo | null>(null);

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
    setTimeout(() => {
      const el = document.getElementById('active-game-arena');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
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
        game.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory, favorites]);

  return (
    <div className="relative min-h-screen bg-[#05070c] text-gray-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-slate-950 overflow-x-hidden">
      {/* Interactive Animated Cyberpunk Arcade Background */}
      <ArcadeBackground />

      {/* Top Navigation */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onRandomGame={handleRandomGame}
      />

      {/* Main Content Arena: VÙNG 2 (Central Container, Max-width: 1360px) */}
      <main className="relative z-10 flex-1 max-w-[1360px] mx-auto w-full py-4 sm:py-6 px-3 sm:px-6">
        {/* Active Game Player - Defaults directly to VÙNG 2 area */}
        {activeGame && (
          <div id="active-game-arena" className="w-full">
            <GameModal
              game={activeGame}
              onClose={() => setActiveGame(null)}
            />
          </div>
        )}

        {/* Catalog Section Header when a game is actively playing */}
        {activeGame && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🕹️</span>
              <h3 className="text-base sm:text-lg font-black text-white font-['Orbitron']">
                Khám Phá Các Trò Chơi Khác
              </h3>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              {filteredGames.length} trò chơi có sẵn
            </span>
          </div>
        )}

        {/* Game Cards Grid */}
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4.5">
            {filteredGames.map((game, idx) => (
              <GameCard
                key={game.id}
                game={game}
                onPlay={handlePlayGame}
                isFavorite={favorites.includes(game.id)}
                onToggleFavorite={handleToggleFavorite}
                isFeatured={!activeGame && selectedCategory === 'all' && !searchQuery && idx === 0}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center text-gray-400 max-w-md mx-auto my-12">
            <span className="text-5xl mb-3 block">
              {selectedCategory === 'favorites' ? '💔' : '🔍'}
            </span>
            <h3 className="text-lg font-bold text-white mb-2">
              {selectedCategory === 'favorites'
                ? 'Chưa có game nào trong mục Yêu Thích'
                : 'Không tìm thấy trò chơi phù hợp!'}
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              {selectedCategory === 'favorites'
                ? 'Hãy bấm vào biểu tượng Trái Tim ❤️ ở các thẻ game để lưu lại những trò chơi yêu thích nhất.'
                : 'Hãy thử tìm với từ khóa khác như "cờ", "tetris", "rắn", "bắn súng"...'}
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

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
