import { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { GameCard } from './components/GameCard';
import { GameModal } from './components/GameModal';
import { AdBanner } from './components/AdBanner';
import { Footer } from './components/Footer';
import { GAMES_CATALOG } from './data/games';
import type { GameInfo, GameCategory } from './types/game';
import { Flame, Sparkles, Zap, Smartphone, Shield, Trophy } from 'lucide-react';

export function App() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [activeGame, setActiveGame] = useState<GameInfo | null>(null);

  // Filter games based on search & category
  const filteredGames = useMemo(() => {
    return GAMES_CATALOG.filter(game => {
      const matchCategory = selectedCategory === 'all' || game.category === selectedCategory;
      const matchQuery =
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchQuery;
    });
  }, [searchQuery, selectedCategory]);

  const hotGame = GAMES_CATALOG.find(g => g.id === '2048') || GAMES_CATALOG[0];

  return (
    <div className="min-h-screen bg-arcade-bg text-gray-100 flex flex-col font-sans">
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

        {/* Hero Banner (Only show when not actively searching) */}
        {!searchQuery && selectedCategory === 'all' && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 border border-indigo-500/30 p-6 sm:p-10 mb-8 shadow-2xl">
            {/* Background glowing orbs */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" /> Kho Game HTML5 Miễn Phí 100%
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4 font-['Orbitron']">
                CHƠI GAME ONLINE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-400 to-indigo-300">
                  KHÔNG CẦN CÀI ĐẶT
                </span>
              </h1>
              <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                Trải nghiệm những tựa game giải đố, trí tuệ và phản xạ kinh điển nhất. Tải tức thì trong 1 giây, siêu mượt trên điện thoại, máy tính bảng và PC.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setActiveGame(hotGame)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-2xl shadow-lg shadow-orange-500/25 transition transform hover:-translate-y-0.5 text-sm"
                >
                  <Flame className="w-4 h-4 fill-slate-950" /> Chơi Ngay: {hotGame.title}
                </button>
                <div className="flex items-center gap-2 text-xs text-gray-300 bg-black/40 backdrop-blur border border-white/10 px-4 py-3 rounded-2xl">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Hơn 450,000+ Lượt Chơi Tuần Này</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Catalog Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : selectedCategory === 'all' ? 'Tất Cả Tựa Game Nổi Bật' : `Thể loại: ${filteredGames[0]?.categoryLabel || ''}`}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Hiển thị {filteredGames.length} tựa game sẵn sàng chơi ngay
              </p>
            </div>
          </div>

          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredGames.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  onPlay={setActiveGame}
                />
              ))}
            </div>
          ) : (
            <div className="bg-arcade-card border border-arcade-border rounded-2xl p-12 text-center text-gray-400">
              <span className="text-5xl mb-3 block">🔍</span>
              <h3 className="text-lg font-bold text-gray-200 mb-1">Không tìm thấy tựa game nào!</h3>
              <p className="text-xs mb-4">Hãy thử tìm kiếm với từ khóa khác như "2048", "rắn", "flappy", "cờ"...</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
              >
                Xóa Bộ Lọc
              </button>
            </div>
          )}
        </section>

        {/* Mid-page Ad Banner */}
        <AdBanner format="leaderboard" />

        {/* Feature Highlights (SEO & Trust Section) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 my-12">
          <div className="bg-arcade-card/60 border border-arcade-border/60 rounded-2xl p-5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-200 mb-1">Tải Ngay Trong 1 Giây</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Tất cả các game đều được tối ưu hóa siêu nhẹ, chỉ từ 1MB, chơi ngay lập tức không cần chờ đợi.
              </p>
            </div>
          </div>

          <div className="bg-arcade-card/60 border border-arcade-border/60 rounded-2xl p-5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-200 mb-1">Tối Ưu Điện Thoại & Tablet</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Hỗ trợ cảm ứng vuốt mượt mà trên iPhone, iPad và điện thoại Android với nút điều khiển ảo D-Pad.
              </p>
            </div>
          </div>

          <div className="bg-arcade-card/60 border border-arcade-border/60 rounded-2xl p-5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-200 mb-1">Mã Nguồn Mở & An Toàn</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                100% game tự do bản quyền, không yêu cầu cấp quyền riêng tư, an toàn cho mọi lứa tuổi.
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
