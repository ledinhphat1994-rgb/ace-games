import type { GameInfo } from '../types/game';

export const GAMES_CATALOG: GameInfo[] = [
  {
    id: '2048',
    title: '2048',
    subtitle: 'Trượt ghép số chạm mốc 2048',
    category: 'puzzle',
    categoryLabel: 'Trí Tuệ & Số',
    description: 'Ghép các ô cùng số chạm mốc 2048.',
    instructions: [
      'Trượt các ô số theo 4 hướng.',
      'Hai ô cùng số chạm nhau sẽ cộng đôi.',
      'Tạo ô 2048 để chiến thắng.'
    ],
    controls: {
      desktop: 'Mũi tên / WASD',
      mobile: 'Vuốt màn hình'
    },
    thumbnailIcon: '🔢',
    accentColor: 'from-amber-500 to-orange-600',
    rating: 4.9,
    plays: 124500,
    tags: ['2048', 'Số học', 'Trí tuệ', 'Logic'],
    isHot: true
  },
  {
    id: 'snake',
    title: 'Rắn Săn Mồi',
    subtitle: 'Rắn săn mồi cổ điển arcade',
    category: 'arcade',
    categoryLabel: 'Phản Xạ Cổ Điển',
    description: 'Ăn táo để dài ra và lập kỷ lục.',
    instructions: [
      'Điều khiển rắn ăn táo đỏ.',
      'Mỗi lần ăn táo sẽ dài ra và nhanh hơn.',
      'Tránh đâm tường hoặc tự cắn đuôi.'
    ],
    controls: {
      desktop: 'Mũi tên / WASD',
      mobile: 'Phím ảo / Vuốt'
    },
    thumbnailIcon: '🐍',
    accentColor: 'from-emerald-500 to-green-600',
    rating: 4.8,
    plays: 98300,
    tags: ['Rắn săn mồi', 'Retro', 'Arcade', 'Nokia'],
    isHot: true
  },
  {
    id: 'flappy',
    title: 'Flappy Bird',
    subtitle: 'Bay qua các khe ống nước',
    category: 'arcade',
    categoryLabel: 'Thử Thách Phản Xạ',
    description: 'Vượt chướng ngại vật lập kỷ lục điểm.',
    instructions: [
      'Bay lách qua khe các ống nước.',
      'Mỗi ống vượt qua được cộng 1 điểm.',
      'Tránh va chạm ống và rơi xuống đất.'
    ],
    controls: {
      desktop: 'Phím Space / Chuột',
      mobile: 'Chạm màn hình'
    },
    thumbnailIcon: '🐥',
    accentColor: 'from-yellow-400 to-amber-500',
    rating: 4.7,
    plays: 87100,
    tags: ['Flappy Bird', 'Phản xạ', 'Kỷ lục', 'Chim bay'],
    isHot: true
  },
  {
    id: 'caro',
    title: 'Cờ Caro',
    subtitle: 'Cờ Caro 10x10 & 3x3 cùng AI',
    category: 'strategy',
    categoryLabel: 'Chiến Thuật & Trí Tuệ',
    description: 'Đấu cờ caro 5 ô hoặc 3 ô với AI.',
    instructions: [
      'Đánh dấu X hoặc O vào ô trống.',
      'Tạo đủ hàng 5 ô để thắng.',
      'Chặn đối thủ tạo hàng liên tiếp.'
    ],
    controls: {
      desktop: 'Nhấp chuột',
      mobile: 'Chạm màn hình'
    },
    thumbnailIcon: '⭕',
    accentColor: 'from-indigo-500 to-purple-600',
    rating: 4.9,
    plays: 65400,
    tags: ['Cờ Caro', 'Tic Tac Toe', 'AI', 'Chiến thuật'],
    isNew: true
  },
  {
    id: 'minesweeper',
    title: 'Dò Mìn',
    subtitle: 'Rà phá bom mìn suy luận logic',
    category: 'classic',
    categoryLabel: 'Kinh Điển Văn Phòng',
    description: 'Mở hết ô an toàn và cắm cờ bãi mìn.',
    instructions: [
      'Nhấp mở ô để xem số mìn xung quanh.',
      'Cắm cờ vào ô nghi có mìn.',
      'Mở hết các ô sạch để chiến thắng.'
    ],
    controls: {
      desktop: 'Chuột trái mở, phải cắm cờ',
      mobile: 'Chạm mở, nút Cờ để cắm'
    },
    thumbnailIcon: '💣',
    accentColor: 'from-red-500 to-rose-600',
    rating: 4.8,
    plays: 54200,
    tags: ['Dò mìn', 'Minesweeper', 'Logic', 'Cổ điển'],
    isNew: true
  },
  {
    id: 'memory',
    title: 'Lật Hình',
    subtitle: 'Lật tìm các cặp hình trùng nhau',
    category: 'puzzle',
    categoryLabel: 'Rèn Luyện Trí Nhớ',
    description: 'Tìm hết các cặp thẻ với số lượt ít nhất.',
    instructions: [
      'Lật mở 2 lá bài mỗi lượt.',
      'Ghi nhớ vị trí các cặp giống nhau.',
      'Triệt tiêu toàn bộ thẻ để chiến thắng.'
    ],
    controls: {
      desktop: 'Nhấp chuột',
      mobile: 'Chạm màn hình'
    },
    thumbnailIcon: '🃏',
    accentColor: 'from-pink-500 to-rose-600',
    rating: 4.7,
    plays: 42100,
    tags: ['Trí nhớ', 'Lật bài', 'Tìm cặp', 'Thư giãn'],
    isNew: true
  },
  {
    id: 'tetris',
    title: 'Xếp Gạch',
    subtitle: 'Xếp gạch giải đố kinh điển',
    category: 'classic',
    categoryLabel: 'Kinh Điển Mọi Thời Đại',
    description: 'Xếp kín hàng gạch để ghi điểm combo.',
    instructions: [
      'Xoay và di chuyển khối gạch rơi.',
      'Lấp đầy hàng ngang để xóa gạch.',
      'Không để gạch chạm tới đỉnh.'
    ],
    controls: {
      desktop: '← → di chuyển, ↑ xoay, Space thả',
      mobile: 'Nút bấm D-Pad ảo'
    },
    thumbnailIcon: '🧱',
    accentColor: 'from-cyan-500 to-blue-600',
    rating: 4.95,
    plays: 185000,
    tags: ['Tetris', 'Xếp gạch', 'Retro', 'Kinh điển', 'Arcade'],
    isHot: true,
    isNew: true
  },
  {
    id: 'chess',
    title: 'Cờ Vua',
    subtitle: 'Cờ vua quốc tế đấu AI & 1v1',
    category: 'strategy',
    categoryLabel: 'Chiến Thuật Quốc Tế',
    description: 'Bảo vệ Vua và chiếu bí đối phương.',
    instructions: [
      'Chọn quân cờ để xem nước đi hợp lệ.',
      'Chiếu bí Vua đối phương để thắng.',
      'Hỗ trợ đấu AI và 2 người chơi.'
    ],
    controls: {
      desktop: 'Nhấp chuột',
      mobile: 'Chạm màn hình'
    },
    thumbnailIcon: '♟️',
    accentColor: 'from-amber-600 to-yellow-700',
    rating: 4.98,
    plays: 230000,
    tags: ['Cờ vua', 'Chess', 'Chiến thuật', 'Trí tuệ', '1v1'],
    isHot: true,
    isNew: true
  },
  {
    id: 'xiangqi',
    title: 'Cờ Tướng',
    subtitle: 'Cờ tướng Á Đông đấu AI & 1v1',
    category: 'strategy',
    categoryLabel: 'Kỳ Nghệ Á Đông',
    description: 'Chiếu bí Tướng đối phương để thắng.',
    instructions: [
      'Chọn quân cờ để xem nước đi hợp lệ.',
      'Phối hợp Xe, Pháo, Mã tấn công.',
      'Chiếu bí Tướng đối thủ để thắng.'
    ],
    controls: {
      desktop: 'Nhấp chuột',
      mobile: 'Chạm màn hình'
    },
    thumbnailIcon: '🏮',
    accentColor: 'from-rose-600 to-red-700',
    rating: 4.96,
    plays: 198000,
    tags: ['Cờ tướng', 'Xiangqi', 'Cổ điển', 'Chiến thuật', 'Trí tuệ'],
    isHot: true,
    isNew: true
  },
  {
    id: 'breakout',
    title: 'Phá Gạch',
    subtitle: 'Bắn bóng đập tan các hàng gạch',
    category: 'arcade',
    categoryLabel: 'Arcade Thử Thách',
    description: 'Đón bóng nảy và phá hủy toàn bộ gạch.',
    instructions: [
      'Đón bóng nảy phá vỡ các khối gạch.',
      'Đập vỡ hết gạch để qua màn.',
      'Không để bóng rơi xuống đáy.'
    ],
    controls: {
      desktop: 'Kéo chuột hoặc Mũi tên',
      mobile: 'Kéo ngón tay di chuyển'
    },
    thumbnailIcon: '🏓',
    accentColor: 'from-cyan-500 to-indigo-600',
    rating: 4.92,
    plays: 145000,
    tags: ['Phá gạch', 'Breakout', 'Arcade', 'Bóng nảy', 'Phản xạ'],
    isHot: true,
    isNew: true
  },
  {
    id: 'space-shooter',
    title: 'Chiến Cơ',
    subtitle: 'Bắn súng không gian diệt tàu địch',
    category: 'arcade',
    categoryLabel: 'Bắn Súng Không Gian',
    description: 'Né mưa đạn và tiêu diệt phi thuyền địch.',
    instructions: [
      'Di chuyển phi thuyền né đạn địch.',
      'Bắn la-de diệt từng đợt quái vật.',
      'Vượt qua các đợt để đạt điểm kỷ lục.'
    ],
    controls: {
      desktop: 'Mũi tên hoặc A/D lái, Space bắn',
      mobile: 'Kéo ngón tay di chuyển'
    },
    thumbnailIcon: '🚀',
    accentColor: 'from-violet-600 to-indigo-700',
    rating: 4.97,
    plays: 215000,
    tags: ['Bắn ruồi', 'Không gian', 'Phi thuyền', 'Arcade', 'Bắn súng'],
    isHot: true,
    isNew: true
  },
  {
    id: 'onet',
    title: 'Onet Nối Hình',
    subtitle: 'Nối cặp hình cổ điển Pikachu',
    category: 'puzzle',
    categoryLabel: 'Giải Đố & Phản Xạ',
    description: 'Nối 2 hình giống nhau không quá 3 đoạn gấp khúc.',
    instructions: [
      'Chọn 2 hình giống nhau để nối.',
      'Đường nối tối đa 3 đoạn gấp khúc.',
      'Xóa sạch bàn cờ để chiến thắng.'
    ],
    controls: {
      desktop: 'Nhấp chuột',
      mobile: 'Chạm màn hình'
    },
    thumbnailIcon: '🧩',
    accentColor: 'from-emerald-500 to-cyan-600',
    rating: 4.98,
    plays: 186000,
    tags: ['Onet', 'Pikachu', 'Nối hình', 'Giải đố', 'Kinh điển'],
    isHot: true,
    isNew: true
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    subtitle: 'Giải đố số 9x9 kinh điển',
    category: 'puzzle',
    categoryLabel: 'Giải Đố & Số',
    description: 'Điền các số từ 1 đến 9 không trùng hàng, cột và khối.',
    instructions: [
      'Điền số từ 1 đến 9 vào ô trống.',
      'Mỗi hàng, cột và khối 3x3 không trùng số.',
      'Điền kín bảng cờ chính xác để chiến thắng.'
    ],
    controls: {
      desktop: 'Nhấp chuột và phím 1-9',
      mobile: 'Chạm ô và bàn phím ảo'
    },
    thumbnailIcon: '🔢',
    accentColor: 'from-cyan-500 to-indigo-600',
    rating: 4.97,
    plays: 172000,
    tags: ['Sudoku', 'Số học', 'Trí tuệ', 'Logic', 'Kinh điển'],
    isHot: true,
    isNew: true
  },
  {
    id: 'pong',
    title: 'Bóng Bàn',
    subtitle: 'Bóng bàn phản xạ Arcade cổ điển',
    category: 'arcade',
    categoryLabel: 'Arcade Thử Thách',
    description: 'Đón bóng phản xạ ghi điểm vượt qua đối thủ.',
    instructions: [
      'Di chuyển thanh đỡ đón bóng nảy.',
      'Mỗi lần bóng qua thanh đối thủ được 1 điểm.',
      'Đạt mốc điểm quy định trước để chiến thắng.'
    ],
    controls: {
      desktop: 'Chuột hoặc phím W/S, Mũi tên',
      mobile: 'Chạm kéo thanh đỡ trên màn hình'
    },
    thumbnailIcon: '🏓',
    accentColor: 'from-cyan-500 to-rose-600',
    rating: 4.95,
    plays: 154000,
    tags: ['Pong', 'Bóng bàn', 'Arcade', 'Retro', 'Phản xạ', 'Kinh điển'],
    isHot: true,
    isNew: true
  },
  {
    id: 'pacman',
    title: 'Pac-Man',
    subtitle: 'Mê cung ăn đậu huyền thoại Arcade',
    category: 'arcade',
    categoryLabel: 'Arcade Kinh Điển',
    description: 'Ăn hết các hạt đậu trong mê cung và né 4 bóng ma.',
    instructions: [
      'Điều khiển Pac-Man ăn sạch các hạt đậu trên mê cung.',
      'Ăn hạt năng lượng lớn để phản đòn nuốt chửng 4 con ma.',
      'Thu thập hoa quả thưởng để đạt điểm kỷ lục tối đa.'
    ],
    controls: {
      desktop: 'Mũi tên / WASD',
      mobile: 'D-Pad ảo trên màn hình'
    },
    thumbnailIcon: '🟡',
    accentColor: 'from-yellow-400 to-amber-600',
    rating: 4.99,
    plays: 289000,
    tags: ['Pacman', 'Arcade', 'Retro', 'Mê cung', 'Kinh điển', 'Ăn đậu'],
    isHot: true,
    isNew: true
  },
  {
    id: 'jewels',
    title: 'Xếp Kim Cương',
    subtitle: 'Hoán đổi ngọc nổ combo rực rỡ',
    category: 'puzzle',
    categoryLabel: 'Giải Đố & Trí Tuệ',
    description: 'Ghép hàng từ 3 viên kim cương cùng màu để kích hoạt chuỗi nổ combo.',
    instructions: [
      'Nhấp chọn 2 viên ngọc kề nhau để hoán đổi vị trí.',
      'Tạo hàng ngang hoặc dọc từ 3 viên cùng màu trở lên.',
      'Tạo các chuỗi nổ dây chuyền (combo) để nhân điểm thưởng.'
    ],
    controls: {
      desktop: 'Nhấp chuột hoán đổi',
      mobile: 'Chạm chọn 2 viên ngọc'
    },
    thumbnailIcon: '💎',
    accentColor: 'from-fuchsia-500 to-indigo-600',
    rating: 4.98,
    plays: 245000,
    tags: ['Kim cương', 'Jewels', 'Match-3', 'Bejeweled', 'Giải đố', 'Xếp hình'],
    isHot: true,
    isNew: true
  }
];
