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
  },
  {
    id: 'bubble-shooter',
    title: 'Bắn Trứng Khủng Long',
    subtitle: 'Bắn trứng nổ chuỗi dội tường kinh điển',
    category: 'arcade',
    categoryLabel: 'Arcade & Bắn Súng',
    description: 'Bắn các quả trứng cùng màu để tạo chuỗi từ 3 quả trở lên, dọn sạch tổ trứng trước khi trần sập.',
    instructions: [
      'Di chuyển chuột / vuốt ngón tay để ngắm hướng bắn.',
      'Nhấp chuột trái hoặc chạm để phóng quả trứng.',
      'Bắn trúng cụm từ 3 trứng cùng màu để nổ và làm rớt các chùm trứng lơ lửng.',
      'Nhấp chuột phải hoặc nút Đổi để hoán đổi quả trứng đang chuẩn bị bắn.'
    ],
    controls: {
      desktop: 'Chuột ngắm & Bắn / Phím Space / Chuột phải đổi trứng',
      mobile: 'Chạm kéo ngắm & Thả tay để bắn'
    },
    thumbnailIcon: '🥚',
    accentColor: 'from-amber-500 to-emerald-600',
    rating: 4.99,
    plays: 312000,
    tags: ['Bắn trứng', 'Dynomite', 'Bubble Shooter', 'Khủng long', 'Kinh điển', 'Arcade'],
    isHot: true,
    isNew: true
  },
  {
    id: 'gold-miner',
    title: 'Đào Vàng',
    subtitle: 'Thả móc câu kéo vàng khối & kim cương',
    category: 'arcade',
    categoryLabel: 'Arcade & Bắn Súng',
    description: 'Thả móc câu xoay góc để gắp các thỏi vàng quý giá, kim cương và túi bí ẩn để đạt chỉ tiêu từng màn.',
    instructions: [
      'Chờ móc câu đung đưa đến góc thích hợp rồi bấm chuột hoặc phím Space / Mũi tên xuống để thả móc.',
      'Gắp vàng to và kim cương để thu về số tiền lớn nhất.',
      'Tránh gắp phải đá tảng nặng nề làm mất nhiều thời gian.',
      'Nhấp nút Thuốc Nổ hoặc phím W / Mũi tên lên để phá hủy vật nặng đang kéo.',
      'Mua sắm vật phẩm trợ giúp giữa các màn chơi.'
    ],
    controls: {
      desktop: 'Chuột / Phím Space / Mũi tên xuống (Thả móc) • Phím W / Mũi tên lên (Ném thuốc nổ)',
      mobile: 'Chạm màn hình hoặc nút THẢ'
    },
    thumbnailIcon: '⛏️',
    accentColor: 'from-amber-400 to-yellow-600',
    rating: 4.99,
    plays: 345000,
    tags: ['Đào vàng', 'Gold Miner', 'Thợ mỏ', 'Khai khoáng', 'Kinh điển', 'Arcade'],
    isHot: true,
    isNew: false
  },
  {
    id: 'tank-1990',
    title: 'Xe Tăng 1990',
    subtitle: 'Bắn phá gạch, bảo vệ đại bàng căn cứ',
    category: 'arcade',
    categoryLabel: 'Arcade & Bắn Súng',
    description: 'Huyền thoại Battle City NES! Điều khiển xe tăng chiến đấu tiêu diệt các đợt xe tăng địch, ăn ngôi sao nâng cấp súng và bảo vệ an toàn cho căn cứ đại bàng.',
    instructions: [
      'Sử dụng phím WASD hoặc phím Mũi tên để di chuyển xe tăng 4 hướng.',
      'Bấm phím Space hoặc phím J để bắn pháo phá gạch và tiêu diệt xe tăng địch.',
      'Bảo vệ biểu tượng Đại Bàng ở đáy bản đồ bằng mọi giá, nếu đại bàng bị bắn trúng trò chơi sẽ kết thúc ngay.',
      'Thu thập các vật phẩm viện trợ: Ngôi sao (nâng cấp hỏa lực), Bom (hạ toàn bộ địch), Khiên (bất tử), Đồng hồ (đóng băng), Xẻng (tường thép bảo vệ đại bàng).'
    ],
    controls: {
      desktop: 'WASD / Mũi tên (Di chuyển) • Phím Space / J (Bắn)',
      mobile: 'D-Pad điều hướng ảo • Nút BẮN to tròn'
    },
    thumbnailIcon: '🎖️',
    accentColor: 'from-yellow-500 to-amber-700',
    rating: 4.99,
    plays: 512000,
    tags: ['Xe tăng', 'Battle City', 'Tank 1990', 'Bắn súng', 'NES', 'Kinh điển', 'Arcade'],
    isHot: true,
    isNew: false
  },
  {
    id: 'bomberman',
    title: 'Đặt Bom Cổ Điển',
    subtitle: 'Mê cung đặt bom phá gạch, tiêu diệt quái vật',
    category: 'arcade',
    categoryLabel: 'Arcade & Bắn Súng',
    description: 'Huyền thoại Bomberman / Dyna Blaster! Điều khiển hiệp sĩ Bomberman đặt bom hẹn giờ nổ chữ thập, phá gạch nhặt vật phẩm tăng tầm lửa, đá bom và tiêu diệt quái vật để mở Cổng Qua Màn.',
    instructions: [
      'Sử dụng các phím WASD hoặc phím Mũi tên để di chuyển trong mê cung.',
      'Bấm phím Space hoặc phím J để đặt quả bom hẹn giờ.',
      'Nhanh chóng chạy ra xa khỏi tầm nổ chữ thập của quả bom để tránh bị nổ trúng.',
      'Phá các khối gạch mềm để tìm Cổng Qua Màn và các vật phẩm tăng sức mạnh: Thêm Bom, Tăng Lửa, Giày Tốc Độ, Khiên Bất Tử, Đá Bom.',
      'Tiêu diệt toàn bộ quái vật mê cung để kích hoạt mở Cổng Qua Màn và bước vào cổng để chiến thắng!'
    ],
    controls: {
      desktop: 'WASD / Mũi tên (Di chuyển) • Phím Space / J (Đặt Bom)',
      mobile: 'D-Pad điều hướng ảo • Nút ĐẶT BOM'
    },
    thumbnailIcon: '💣',
    accentColor: 'from-amber-500 to-rose-600',
    rating: 4.99,
    plays: 685000,
    tags: ['Đặt bom', 'Bomberman', 'Dyna Blaster', 'Hành động', 'Mê cung', 'NES', 'Kinh điển', 'Arcade'],
    isHot: true,
    isNew: false
  },
  {
    id: 'galaga',
    title: 'Bắn Ruồi Không Gian',
    subtitle: 'Huyền thoại Galaga, ghép đôi Chiến Cơ Kép',
    category: 'arcade',
    categoryLabel: 'Arcade & Bắn Súng',
    description: 'Huyền thoại Bắn Ruồi Galaga Namco Arcade! Điều khiển chiến cơ không gian bắn hạ các đợt bầy ruồi ngoài hành tinh lượn nhào, giải cứu tàu bị bắt để kích hoạt Chiến Cơ Kép (Dual Fighter) nhân đôi hỏa lực!',
    instructions: [
      'Sử dụng phím A / D hoặc phím Mũi tên Trái / Phải để di chuyển tàu chiến ngang đáy màn hình.',
      'Bấm phím Space hoặc phím J để bắn pháo laser tiêu diệt bầy ruồi ngoài hành tinh.',
      'Cảnh giác chùm tia hút bắt giữ (Tractor Beam) màu xanh từ Boss Galaga trên cùng.',
      'Nếu tàu bị bắt, hãy xuất kích tàu mới và bắn hạ con Boss đang giữ tàu để giải cứu, ghép thành Chiến Cơ Kép 2 nòng súng hỏa lực gấp đôi!',
      'Cứ sau mỗi 3 màn chiến đấu sẽ có màn thử thách bắn thưởng (Challenging Stage) để rèn luyện độ chính xác và giành điểm thưởng tối đa.'
    ],
    controls: {
      desktop: 'A / D hoặc Mũi tên Trái / Phải (Di chuyển) • Phím Space / J (Bắn)',
      mobile: 'Nút mũi tên Trái / Phải ảo • Nút BẮN to tròn'
    },
    thumbnailIcon: '🚀',
    accentColor: 'from-cyan-500 to-blue-700',
    rating: 4.99,
    plays: 820000,
    tags: ['Bắn ruồi', 'Galaga', 'Bắn súng', 'Vũ trụ', 'Namco', 'Chiến cơ', 'Kinh điển', 'Arcade'],
    isHot: true,
    isNew: false
  },
  {
    id: 'road-fighter',
    title: 'Đua Xe Đường Phố',
    subtitle: 'Huyền thoại Road Fighter NES, bứt tốc 400 km/h',
    category: 'arcade',
    categoryLabel: 'Arcade & Bắn Súng',
    description: 'Huyền thoại Đua Xe Đường Phố Road Fighter Konami NES! Lái siêu xe thể thao đỏ lạng lách trên cao tốc với tốc độ xé gió 400 km/h, phản xạ đánh lái ngược chiều khi xe bị trượt đuôi, né tránh xe tải lớn & vũng dầu, nhặt xe thưởng nạp đầy nhiên liệu nitro về đích!',
    instructions: [
      'Sử dụng phím Mũi tên Trái / Phải (hoặc phím A / D) để điều khiển xe lạng lách qua các làn đường.',
      'Giữ phím Mũi tên Lên (hoặc W) để chạy Số Thấp (Low Gear, tốc độ tối đa ~196 km/h).',
      'Giữ phím Space (hoặc Shift / phím J) để kích hoạt Số Cao Siêu Tốc (Turbo Boost, xé gió tới 400 km/h).',
      'Nếu xe bị quẹt hoặc cán vũng dầu khiến đuôi xe lạng sang trái/phải, hãy lập tức đánh lái ngược chiều để lấy lại thăng bằng trước khi đâm vào dải phân cách.',
      'Chú ý tránh xe tải lớn và chạm vào các xe nạp xăng màu hồng (FUEL) để hồi phục bình nhiên liệu và tiếp tục chặng đua.'
    ],
    controls: {
      desktop: 'A / D hoặc Mũi tên Trái / Phải (Lái) • W / Mũi tên Lên (Số thấp) • Phím Space / Shift (Turbo) • S / Mũi tên Xuống (Phanh)',
      mobile: 'Nút mũi tên Trái / Phải ảo • Nút PHANH • Nút TURBO giữ tăng tốc'
    },
    thumbnailIcon: '🏎️',
    accentColor: 'from-red-600 via-amber-500 to-rose-600',
    rating: 4.99,
    plays: 910000,
    tags: ['Đua xe', 'Road Fighter', 'Konami', 'Tốc độ', 'NES', 'Siêu xe', 'Kinh điển', 'Arcade'],
    isHot: true,
    isNew: false
  },
  {
    id: 'zuma',
    title: 'Bắn Bi Cóc Zuma',
    subtitle: 'Huyền thoại Zuma Deluxe, giải mã đền thờ Aztec',
    category: 'puzzle',
    categoryLabel: 'Giải Đố & Trí Tuệ',
    description: 'Huyền thoại Bắn Bi Cóc Zuma Deluxe kinh điển! Điều khiển chú cóc đá thần thoại xoay 360 độ bắn phá các chuỗi ngọc ma thuật đang lăn theo rãnh xoắn ốc về phía miệng đầu lâu vàng, kích hoạt chuỗi combo nổ dây chuyền và bùa chú thần bí!',
    instructions: [
      'Di chuyển chuột (hoặc chạm ngón tay trên màn hình) để điều khiển Cóc Đá xoay hướng bắn.',
      'Bấm Chuột Trái (hoặc nút BẮN) để phóng viên ngọc trong miệng cóc vào chuỗi bi trên đường ray.',
      'Ghép từ 3 viên bi cùng màu trở lên để triệt tiêu chúng. Hai đầu chuỗi cùng màu sẽ tự động hút lại gần nhau tạo ra combo liên hoàn.',
      'Bấm Phím Space (hoặc Chuột Phải / nút ĐỔI BI) để tráo đổi nhanh giữa viên bi trong miệng và viên bi dự phòng trên lưng cóc.',
      'Bắn trúng các đồng tiền vàng (Coin) ở các góc để nhận thêm 500 điểm thưởng và lấp đầy thanh Zuma giải mã đền thờ.'
    ],
    controls: {
      desktop: 'Di chuyển chuột (Ngắm) • Chuột Trái (Bắn) • Chuột Phải hoặc Phím Space (Đổi bi)',
      mobile: 'Chạm kéo xoay hướng ngắm • Nút BẮN to tròn • Nút ĐỔI BI dự phòng'
    },
    thumbnailIcon: '🐸',
    accentColor: 'from-amber-500 via-emerald-600 to-yellow-600',
    rating: 4.99,
    plays: 950000,
    tags: ['Zuma', 'Bắn bi', 'PopCap', 'Giải đố', 'Match 3', 'Cóc đá', 'Kinh điển', 'Arcade'],
    isHot: true,
    isNew: false
  },
  {
    id: 'contra',
    title: 'Contra Cổ Điển',
    subtitle: 'Huyền thoại Rambo NES 1987, tiêu diệt sào huyệt Red Falcon',
    category: 'arcade',
    categoryLabel: 'Arcade & Bắn Súng',
    description: 'Huyền thoại bắn súng đi cảnh màn ngang Contra Konami 1987 kinh điển! Vào vai chiến binh biệt kích dũng mãnh Bill Rizer xâm nhập hòn đảo Galuga, ngắm bắn 8 hướng linh hoạt, nhảy lộn nhào né đạn, nhặt phù hiệu chim ưng bọc thép trang bị đạn chùm Spread Gun (S), súng máy Machine Gun (M) và Laser (L) hủy diệt phòng tuyến Red Falcon!',
    instructions: [
      'Sử dụng phím A / D (hoặc Mũi tên Trái / Phải) để di chuyển chạy qua các mỏm đá và rừng rậm nhiệt đới.',
      'Bấm phím W / Mũi tên Lên để ngắm bắn lên cao; Bấm phím S / Mũi tên Xuống để nằm rạp xuống đất né đạn hoặc ngụp lặn dưới nước.',
      'Kết hợp phím Chạy + Lên/Xuống để ngắm bắn chéo 8 hướng cực kỳ linh hoạt chuẩn xác.',
      'Bấm phím K (hoặc Space / X) để nhảy lộn nhào lên các tầng vách đá; Giữ phím S + K để nhảy hạ xuống tầng dưới.',
      'Bấm giữ phím J (hoặc Z / C) để xả súng tiêu diệt lính gác, tháp pháo xoay và lõi tim pháo đài Red Falcon.'
    ],
    controls: {
      desktop: 'A / D (Chạy) • W / S (Ngắm lên / Nằm rạp) • Phím K hoặc Space (Nhảy) • Phím J hoặc Z (Bắn 8 hướng)',
      mobile: 'Cần D-Pad 8 hướng ảo • Nút NHẢY • Nút BẮN hỏa lực'
    },
    thumbnailIcon: '🎖️',
    accentColor: 'from-red-600 via-amber-500 to-rose-700',
    rating: 5.0,
    plays: 1250000,
    tags: ['Contra', 'Rambo', 'Konami', 'Bắn súng', 'Đi cảnh', 'Đạn S', 'NES', 'Arcade', 'Kinh điển'],
    isHot: true,
    isNew: true
  },
  {
    id: 'mario',
    title: 'Super Mario',
    subtitle: 'Huyền thoại Nấm Mario 1985 giải cứu Công chúa Peach',
    category: 'arcade',
    categoryLabel: 'Phiêu Lưu & Nhảy Bậc',
    description: 'Huyền thoại phiêu lưu đi cảnh màn ngang Super Mario Bros nguyên bản 1985! Điều khiển anh chàng thợ sửa ống nước quả cảm vượt qua Vương quốc Nấm, húc khối gạch bí mật [?], thu thập tiền vàng, ăn nấm đỏ Super Mushroom biến lớn, hái hoa lửa Fire Flower bắn cầu lửa nảy đất, dẫm bẹp Goomba, sút mai rùa Koopa và hạ gục rồng Bowser trên cầu dung nham.',
    instructions: [
      'Phím A / D (hoặc Mũi tên Trái / Phải) để di chuyển chạy qua các đồi cỏ, đường hầm ngầm và lâu đài.',
      'Phím K hoặc Space để nhảy; Nhấn giữ lâu hơn để nhảy bổng cao qua các hố sâu và chướng ngại vật.',
      'Phím S hoặc Mũi tên Xuống để cúi người hoặc tụt xuống các đường ống nước ngầm bí mật.',
      'Phím J hoặc Z để chạy nhanh (Dash) và bắn cầu lửa khi đã nhặt Hoa Lửa (Fire Mario).',
      'Húc đầu vào khối [?] để mở nấm lớn, tiền vàng và ngôi sao bất tử; Dẫm lên đầu kẻ địch để tiêu diệt.'
    ],
    controls: {
      desktop: 'A / D (Chạy) • S (Cúi / Xuống ống) • Phím K / Space (Nhảy cao) • Phím J / Z (Bắn lửa & Tăng tốc)',
      mobile: 'D-Pad điều hướng bên trái • Nút B (Bắn lửa / Chạy nhanh) • Nút A (Nhảy) bên phải'
    },
    thumbnailIcon: '🍄',
    accentColor: 'from-red-600 via-orange-500 to-amber-500',
    rating: 5.0,
    plays: 1680000,
    tags: ['Mario', 'Nấm lùn', 'Super Mario', 'Nintendo', 'Đi cảnh', 'Retro', 'NES', 'Arcade', 'Kinh điển'],
    isHot: true,
    isNew: true
  },
  {
    id: 'duck-hunt',
    title: 'Bắn Vịt Cổ Điển',
    subtitle: 'Huyền thoại Bắn Vịt NES 1984 & Chú chó săn hóm hỉnh',
    category: 'arcade',
    categoryLabel: 'Bắn Súng Phản Xạ',
    description: 'Huyền thoại Bắn Vịt Duck Hunt NES 1984 kinh điển trên máy băng 4 nút! Cầm súng Zapper ngắm bắn những chú vịt trời bay lượn ngẫu hứng qua đồng cỏ bát ngát hoặc thử thách kỹ năng xạ thủ với chế độ Bắn Đĩa sét tốc độ cao (Clay Shooting). Hãy bắn thật chuẩn trước khi vịt kịp bay thoát lên trời xanh và để chú chó săn lém lỉnh cười nhạo bạn!',
    instructions: [
      'Rê chuột để di chuyển tâm ngắm súng Zapper và Nhấp chuột trái để bóp cò bắn.',
      'Trên điện thoại/tablet: Chạm ngón tay trực tiếp vào vịt hoặc đĩa bay để bắn tức thì.',
      'Mỗi lượt bay bạn có tối đa 3 viên đạn. Hãy bắn hạ mục tiêu trước khi vịt bay vọt lên trời.',
      'Bắn trúng nhiều mục tiêu liên tiếp để tích lũy điểm thưởng Combo và nhân hệ số điểm.',
      'Hoàn thành chỉ tiêu số lượng trúng trong mỗi vòng (Round) để tiến vào vòng tiếp theo với tốc độ bay nhanh hơn.'
    ],
    controls: {
      desktop: 'Chuột: Di chuyển tâm ngắm • Nhấp chuột trái: Bóp cò bắn • Phím 1, 2, 3: Đổi chế độ',
      mobile: 'Chạm tay trực tiếp vào vịt trời hoặc đĩa bay trên màn hình để bắn tức thì'
    },
    thumbnailIcon: '🦆',
    accentColor: 'from-amber-500 via-emerald-500 to-sky-500',
    rating: 4.99,
    plays: 1420000,
    tags: ['Bắn vịt', 'Duck Hunt', 'NES', 'Băng 4 nút', 'Súng Zapper', 'Retro', 'Arcade', 'Kinh điển', 'Phản xạ'],
    isHot: true,
    isNew: true
  },
  {
    id: 'circus-charlie',
    title: 'Xiếc Hề Cổ Điển',
    subtitle: 'Huyền thoại Circus Charlie NES 1984 - Cưỡi Sư Tử Nhảy Vòng Lửa',
    category: 'arcade',
    categoryLabel: 'Hành Động & Phản Xạ',
    description: 'Huyền thoại Xiếc Hề Circus Charlie kinh điển trên máy băng 4 nút NES 1984 của Konami! Cùng chú hề Charlie quả cảm trổ tài làm xiếc đỉnh cao: Cưỡi sư tử nhảy qua các vòng lửa đỏ rực và chậu lửa bốc cháy, giữ thăng bằng trên dây thép né tránh đàn khỉ nhào lộn, và nhảy bật trên các tấm bạt lò xo nhịp nhàng. Âm nhạc rộn rã cùng tiếng hò reo cổ vũ của khán giả rạp xiếc!',
    instructions: [
      'Phím A / D hoặc Mũi tên Trái / Phải để tăng tốc chạy tới hoặc ghìm cương lùi lại.',
      'Phím K hoặc Space để nhảy bổng; Căn chuẩn thời điểm để nhảy qua vòng lửa và chậu lửa.',
      'Nhảy qua các vòng lửa nhỏ và ăn túi tiền xu $ bên trong để nhận điểm thưởng khổng lồ.',
      'Màn 2: Đi dây né tránh đàn khỉ xanh và khỉ nâu nhảy vọt qua đầu.',
      'Vượt qua 100 mét đường chạy để đáp xuống bục vinh quang rực rỡ!'
    ],
    controls: {
      desktop: 'A / D (hoặc Mũi tên): Chạy tới / Lùi lại • Phím K / Space: Nhảy qua lửa • Phím 1, 2, 3: Chọn Màn',
      mobile: 'Nút mũi tên Trái / Phải bên trái • Nút Nhảy (JUMP) bên phải'
    },
    thumbnailIcon: '🎪',
    accentColor: 'from-amber-500 via-rose-500 to-indigo-600',
    rating: 5.0,
    plays: 1530000,
    tags: ['Xiếc hề', 'Circus Charlie', 'Konami', 'NES', 'Băng 4 nút', 'Cưỡi sư tử', 'Vòng lửa', 'Retro', 'Arcade', 'Kinh điển'],
    isHot: true,
    isNew: true
  },
  {
    id: 'dig-dug',
    title: 'Đào Đất Bơm Quái',
    subtitle: 'Huyền thoại Dig Dug Namco 1982 - Đào hầm & Bơm nổ quái vật',
    category: 'arcade',
    categoryLabel: 'Đào Hầm & Bơm Quái',
    description: 'Huyền thoại Dig Dug kinh điển của Namco (1982/1985) làm say mê hàng triệu game thủ máy thùng Arcade và máy băng 4 nút NES! Nhập vai chàng thợ đào dũng cảm Taizo Hori, dùng xẻng đào các đường hầm chằng chịt trong lòng đất sâu, phóng dây bơm hơi vào quái vật bong bóng Pooka và rồng phun lửa Fygar để bơm căng phồng cho tới khi chúng phát nổ tung tóe. Hãy khéo léo đào dưới những tảng đá khổng lồ để tảng đá rơi nghiền nát lũ quái vật bám đuôi và thu thập củ quả thưởng!',
    instructions: [
      'Dùng phím A / D / W / S hoặc Mũi tên để di chuyển và đào đường hầm xuyên qua các lớp đất sâu.',
      'Phím Space hoặc K để phóng ống bơm khí; Nhấn liên tục hoặc giữ phím để bơm quái vật căng phồng tới khi NỔ TUNG!',
      'Đào hầm ngay bên dưới tảng đá để tảng đá rung lắc rồi rơi xuống, đè bẹp lũ quái vật để nhận điểm thưởng Combo.',
      'Hãy cẩn thận: Quái rồng Fygar có thể khè ra luồng lửa thiêu đốt ngang hầm, và quái vật có thể biến thành bóng ma xuyên qua đất!',
      'Sau khi làm rơi 2 tảng đá, củ quả thưởng sẽ xuất hiện ở giữa bản đồ trong thời gian ngắn.'
    ],
    controls: {
      desktop: 'W / A / S / D hoặc Mũi tên: Di chuyển & Đào đất • Space / K: Phóng ống bơm & Bơm quái • R: Chơi lại',
      mobile: 'Cụm D-Pad 4 hướng bên trái • Nút BƠM (PUMP) lớn bên phải'
    },
    thumbnailIcon: '⛏️',
    accentColor: 'from-amber-600 via-orange-500 to-rose-600',
    rating: 5.0,
    plays: 1720000,
    tags: ['Dig Dug', 'Namco', 'NES', 'Băng 4 nút', 'Đào đất', 'Bơm quái', 'Pooka', 'Fygar', 'Arcade', 'Kinh điển', 'Retro'],
    isHot: true,
    isNew: true
  }
];
