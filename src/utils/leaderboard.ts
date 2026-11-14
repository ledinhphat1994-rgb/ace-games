// Leaderboard Storage & Dynamic Ranking Manager for Ace Games

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  score: number;
  formattedScore: string;
  date: string;
  isCurrentUser?: boolean;
}

const DEFAULT_PLAYER_NAME = 'Bạn (Người Chơi)';

export const getPlayerName = (): string => {
  try {
    return localStorage.getItem('acegames_player_name') || DEFAULT_PLAYER_NAME;
  } catch {
    return DEFAULT_PLAYER_NAME;
  }
};

export const setPlayerName = (name: string): void => {
  try {
    const trimmed = name.trim().slice(0, 20) || DEFAULT_PLAYER_NAME;
    localStorage.setItem('acegames_player_name', trimmed);
    window.dispatchEvent(new CustomEvent('acegames:player_name_changed', { detail: { name: trimmed } }));
  } catch {}
};

// Seed arcade champions for all 11 games
const SEED_DATA: Record<string, { name: string; score: number; date: string }[]> = {
  flappy: [
    { name: 'AceDragon', score: 48, date: '14/11/2026' },
    { name: 'Phượng Hoàng', score: 37, date: '13/11/2026' },
    { name: 'Bạch Hổ', score: 29, date: '12/11/2026' },
    { name: 'Huyền Vũ', score: 22, date: '10/11/2026' },
    { name: 'SkyMaster', score: 16, date: '08/11/2026' },
    { name: 'GamerPro99', score: 12, date: '05/11/2026' },
  ],
  snake: [
    { name: 'Thần Xà 99', score: 65, date: '14/11/2026' },
    { name: 'PythonKing', score: 52, date: '13/11/2026' },
    { name: 'Vua Luồn Lách', score: 41, date: '11/11/2026' },
    { name: 'Rắn Hổ Mang', score: 33, date: '09/11/2026' },
    { name: 'GreenViper', score: 25, date: '07/11/2026' },
    { name: 'RetroCobra', score: 18, date: '04/11/2026' },
  ],
  '2048': [
    { name: 'MathMaster', score: 32680, date: '14/11/2026' },
    { name: 'Trí Tuệ Vàng', score: 24560, date: '12/11/2026' },
    { name: 'Bậc Thầy Logic', score: 18920, date: '10/11/2026' },
    { name: 'Khối Số Siêu Cấp', score: 14240, date: '08/11/2026' },
    { name: 'NumberCruncher', score: 9800, date: '06/11/2026' },
    { name: 'BlockWizard', score: 6420, date: '03/11/2026' },
  ],
  breakout: [
    { name: 'Vua Phá Đảo', score: 2850, date: '14/11/2026' },
    { name: 'BallWizard', score: 2340, date: '12/11/2026' },
    { name: 'Tia Chớp Xanh', score: 1950, date: '10/11/2026' },
    { name: 'Bắn Tỉa Gạch', score: 1520, date: '08/11/2026' },
    { name: 'CyberPaddle', score: 1210, date: '05/11/2026' },
    { name: 'NeonStriker', score: 940, date: '02/11/2026' },
  ],
  'space-shooter': [
    { name: 'Phi Đội Ace', score: 6850, date: '14/11/2026' },
    { name: 'StarLord', score: 5420, date: '13/11/2026' },
    { name: 'Thiên Hà Đỏ', score: 4190, date: '11/11/2026' },
    { name: 'Chiến Cơ Tối Thượng', score: 3260, date: '09/11/2026' },
    { name: 'GalaxyRanger', score: 2480, date: '06/11/2026' },
    { name: 'CosmicAce', score: 1850, date: '03/11/2026' },
  ],
  tetris: [
    { name: 'TetrisGod', score: 19400, date: '14/11/2026' },
    { name: 'Khối Gạch Ma Thuật', score: 15200, date: '12/11/2026' },
    { name: 'Xếp Hình Siêu Cấp', score: 11800, date: '10/11/2026' },
    { name: 'Bậc Thầy Phản Xạ', score: 8900, date: '07/11/2026' },
    { name: 'FastDropper', score: 6400, date: '04/11/2026' },
    { name: 'GridMaster', score: 4200, date: '01/11/2026' },
  ],
  caro: [
    { name: 'Cờ Thủ Huyền Thoại', score: 35, date: '14/11/2026' },
    { name: 'Độc Cô Cầu Bại', score: 28, date: '12/11/2026' },
    { name: 'Vua 5 Ô', score: 21, date: '10/11/2026' },
    { name: 'Kỳ Vương Caro', score: 16, date: '08/11/2026' },
    { name: 'Trí Tuệ Việt', score: 12, date: '05/11/2026' },
  ],
  minesweeper: [
    { name: 'Gỡ Mìn Thần Tốc', score: 32, date: '14/11/2026' },
    { name: 'Bombsweeper', score: 45, date: '12/11/2026' },
    { name: 'Chuyên Gia Dò Mìn', score: 58, date: '10/11/2026' },
    { name: 'Thợ Mìn Cừ Khôi', score: 74, date: '07/11/2026' },
    { name: 'Tinh Mắt', score: 95, date: '04/11/2026' },
  ],
  memory: [
    { name: 'Trí Nhớ Siêu Phàm', score: 14, date: '14/11/2026' },
    { name: 'Thần Đồng Ghi Nhớ', score: 18, date: '12/11/2026' },
    { name: 'Siêu Trí Tuệ', score: 22, date: '10/11/2026' },
    { name: 'Não Phải Vô Địch', score: 26, date: '07/11/2026' },
    { name: 'FlashMemory', score: 30, date: '04/11/2026' },
  ],
  chess: [
    { name: 'Đại Kiện Tướng Ace', score: 28, date: '14/11/2026' },
    { name: 'Grandmaster AI', score: 22, date: '12/11/2026' },
    { name: 'Vua Cờ Thế', score: 17, date: '09/11/2026' },
    { name: 'Chiến Lược Gia', score: 12, date: '06/11/2026' },
    { name: 'Bàn Cờ Đen Trắng', score: 8, date: '03/11/2026' },
  ],
  xiangqi: [
    { name: 'Kỳ Tiên Phương Đông', score: 32, date: '14/11/2026' },
    { name: 'Tướng Soái Vô Địch', score: 25, date: '12/11/2026' },
    { name: 'Đòn Pháo Thần Sầu', score: 19, date: '10/11/2026' },
    { name: 'Mã Nhảy Tung Hoành', score: 14, date: '07/11/2026' },
    { name: 'Khắc Tinh Xe Pháo', score: 9, date: '04/11/2026' },
  ],
};

// Retrieve user's local best score for a specific game
const getUserScore = (gameId: string): number => {
  try {
    switch (gameId) {
      case 'flappy': return parseInt(localStorage.getItem('acegames_flappy_best') || '0', 10);
      case 'snake': return parseInt(localStorage.getItem('acegames_snake_best') || '0', 10);
      case '2048': return parseInt(localStorage.getItem('acegames_2048_best') || '0', 10);
      case 'breakout': return parseInt(localStorage.getItem('acegames_breakout_best') || '0', 10);
      case 'space-shooter': return parseInt(localStorage.getItem('acegames_space_best') || '0', 10);
      case 'tetris': return parseInt(localStorage.getItem('acegames_tetris_best') || '0', 10);
      case 'caro': return parseInt(localStorage.getItem('acegames_caro_wins') || '0', 10);
      case 'chess': return parseInt(localStorage.getItem('acegames_chess_wins') || '0', 10);
      case 'xiangqi': return parseInt(localStorage.getItem('acegames_xiangqi_wins') || '0', 10);
      case 'minesweeper': return parseInt(localStorage.getItem('acegames_minesweeper_best') || '0', 10);
      case 'memory': return parseInt(localStorage.getItem('acegames_memory_best') || '0', 10);
      default: return 0;
    }
  } catch {
    return 0;
  }
};

export const getLeaderboard = (gameId: string): LeaderboardEntry[] => {
  const seeds = SEED_DATA[gameId] || SEED_DATA['flappy'];
  const userScore = getUserScore(gameId);
  const playerName = getPlayerName();

  // Clone seed list
  const list = seeds.map(s => ({
    name: s.name,
    score: s.score,
    date: s.date,
    isCurrentUser: false,
  }));

  // Insert user entry if user has scored or played
  list.push({
    name: playerName,
    score: userScore,
    date: 'Hôm nay',
    isCurrentUser: true,
  });

  // Sort descending by score (for minesweeper/memory, lower is better if score > 0)
  const isLowerBetter = gameId === 'minesweeper' || gameId === 'memory';
  if (isLowerBetter) {
    list.sort((a, b) => {
      if (a.score === 0) return 1;
      if (b.score === 0) return -1;
      return a.score - b.score;
    });
  } else {
    list.sort((a, b) => b.score - a.score);
  }

  // Format with ranks
  return list.slice(0, 10).map((item, idx) => ({
    id: `${gameId}-${idx}-${item.name}`,
    rank: idx + 1,
    name: item.name,
    score: item.score,
    formattedScore: item.score.toLocaleString('vi-VN'),
    date: item.date,
    isCurrentUser: item.isCurrentUser,
  }));
};
