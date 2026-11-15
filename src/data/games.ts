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
      desktop: 'Kéo chuột / Mũi tên di chuyển',
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
      desktop: 'A/D / Mũi tên lái, Space bắn',
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
  }
];
