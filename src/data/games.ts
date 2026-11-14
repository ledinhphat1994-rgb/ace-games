import type { GameInfo } from '../types/game';

export const GAMES_CATALOG: GameInfo[] = [
  {
    id: '2048',
    title: '2048 Cổ Điển',
    category: 'puzzle',
    categoryLabel: 'Trí Tuệ & Số Học',
    description: 'Trượt các ô số giống nhau để hợp nhất và chạm mốc 2048 kỳ diệu! Game giải đố gây nghiện hàng đầu thế giới.',
    instructions: [
      'Dùng phím mũi tên hoặc vuốt trên màn hình để di chuyển toàn bộ các ô.',
      'Khi hai ô có cùng số chạm vào nhau, chúng sẽ cộng lại thành một ô có giá trị gấp đôi.',
      'Mục tiêu cao nhất là tạo ra được ô số 2048 và đạt điểm kỷ lục!'
    ],
    controls: {
      desktop: 'Phím mũi tên (↑ ↓ ← →) hoặc W, A, S, D',
      mobile: 'Vuốt ngón tay lên, xuống, trái, phải'
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
    title: 'Rắn Săn Mồi Retro',
    category: 'arcade',
    categoryLabel: 'Phản Xạ Cổ Điển',
    description: 'Huyền thoại game rắn săn mồi Nokia với đồ họa arcade neon hiện đại, ăn táo để dài ra và lập kỷ lục điểm số!',
    instructions: [
      'Điều khiển chú rắn di chuyển quanh màn hình để ăn các quả táo đỏ.',
      'Mỗi lần ăn táo, thân rắn sẽ dài ra và tốc độ sẽ tăng dần.',
      'Tránh đâm đầu vào tường hoặc tự cắn vào đuôi của chính mình!'
    ],
    controls: {
      desktop: 'Phím mũi tên hoặc W, A, S, D',
      mobile: 'D-Pad nút bấm ảo hoặc vuốt màn hình'
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
    title: 'Flappy Bird HTML5',
    category: 'arcade',
    categoryLabel: 'Thử Thách Phản Xạ',
    description: 'Điều khiển chú chim vượt qua mê cung những ống nước xanh. Cực kỳ thử thách lòng kiên nhẫn!',
    instructions: [
      'Nhấp chuột hoặc chạm vào màn hình để chim đập cánh bay lên.',
      'Nếu không chạm, chim sẽ tự động rơi xuống do trọng lực.',
      'Khéo léo căn nhịp bay để lọt qua khoảng trống giữa các ống nước.'
    ],
    controls: {
      desktop: 'Phím Space (Cách) hoặc Chuột trái',
      mobile: 'Chạm nhẹ ngón tay vào màn hình'
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
    title: 'Cờ Caro / Tic-Tac-Toe AI',
    category: 'strategy',
    categoryLabel: 'Chiến Thuật & Trí Tuệ',
    description: 'Trò chơi cờ caro quen thuộc thời đi học! Thách đấu với AI thuật toán Minimax hoặc chơi cùng bạn bè trên cùng máy.',
    instructions: [
      'Người chơi thay phiên nhau đánh dấu X hoặc O vào các ô trống.',
      'Người đầu tiên tạo được 3 dấu thẳng hàng (ngang, dọc hoặc chéo) sẽ giành chiến thắng!',
      'Thử sức với chế độ "Bất Khả Chiến Bại" để xem bạn có thể thắng được AI không.'
    ],
    controls: {
      desktop: 'Nhấp chuột vào ô trống',
      mobile: 'Chạm ngón tay vào ô trống'
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
    title: 'Dò Mìn Cổ Điển',
    category: 'classic',
    categoryLabel: 'Kinh Điển Văn Phòng',
    description: 'Game dò mìn huyền thoại Windows! Suy luận logic từ các con số để cắm cờ toàn bộ bãi mìn mà không bị nổ.',
    instructions: [
      'Nhấp vào một ô để mở. Con số hiện ra cho biết số lượng mìn ở 8 ô xung quanh.',
      'Dùng suy luận logic để xác định ô nào chứa mìn và cắm cờ đánh dấu.',
      'Mở toàn bộ các ô an toàn để chiến thắng!'
    ],
    controls: {
      desktop: 'Chuột trái để mở ô, Chuột phải để cắm cờ',
      mobile: 'Chạm để mở ô, bật nút [Cờ] để cắm cờ'
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
    title: 'Lật Hình Tìm Cặp (Memory Match)',
    category: 'puzzle',
    categoryLabel: 'Rèn Luyện Trí Nhớ',
    description: 'Lật tìm các cặp thẻ bài giống nhau trong thời gian ngắn nhất. Thích hợp cho cả trẻ em và người lớn xả stress!',
    instructions: [
      'Nhấp vào từng lá bài để lật mở hình ảnh bên dưới.',
      'Ghi nhớ vị trí các hình và lật 2 lá bài giống nhau để triệt tiêu chúng.',
      'Hoàn thành việc tìm tất cả các cặp thẻ với số lượt mở ít nhất để đạt 3 sao!'
    ],
    controls: {
      desktop: 'Nhấp chuột chọn lá bài',
      mobile: 'Chạm ngón tay chọn lá bài'
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
    title: 'Tetris Xếp Gạch Cổ Điển',
    category: 'classic',
    categoryLabel: 'Kinh Điển Mọi Thời Đại',
    description: 'Huyền thoại xếp gạch mọi thời đại! Xếp các khối gạch tetrominoes kín hàng để ghi điểm combo và chạm kỷ lục thế giới.',
    instructions: [
      'Điều khiển các khối gạch rơi xuống, xoay góc hợp lý để xếp khít vào nhau.',
      'Mỗi khi lấp đầy 1 hoặc nhiều hàng ngang, hàng gạch sẽ biến mất và bạn được cộng điểm thưởng.',
      'Khối gạch xếp chồng chạm đến đỉnh thì ván chơi sẽ kết thúc!'
    ],
    controls: {
      desktop: 'Mũi tên ← → di chuyển, ↑ xoay, ↓ hạ nhanh, Phím Cách rơi ngay',
      mobile: 'Nút bấm cảm ứng D-Pad tiện lợi trên màn hình'
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
    title: 'Cờ Vua Quốc Tế (Chess AI)',
    category: 'strategy',
    categoryLabel: 'Chiến Thuật Quốc Tế',
    description: 'Bàn cờ 8×8 tiêu chuẩn quốc tế! Đấu trí chiến thuật đỉnh cao cùng AI nhiều cấp độ hoặc so tài 2 người chơi trên cùng thiết bị.',
    instructions: [
      'Chạm hoặc nhấp chuột vào quân cờ để xem các nước đi hợp lệ.',
      'Bảo vệ Vua của bạn và tìm cách chiếu bí Vua đối phương.',
      'Hỗ trợ chế độ Đấu Máy thông minh và chế độ 2 Người chơi đối kháng.'
    ],
    controls: {
      desktop: 'Nhấp chuột chọn quân và ô đích đến',
      mobile: 'Chạm ngón tay chọn quân và ô di chuyển'
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
    title: 'Cờ Tướng Đông Phương (Xiangqi AI)',
    category: 'strategy',
    categoryLabel: 'Kỳ Nghệ Á Đông',
    description: 'Bàn cờ 9×10 kinh điển sông Sở Hà Hán Giới! Tấn công Cửu Cung, phối hợp Xe Pháo Mã cùng AI hoặc bạn bè.',
    instructions: [
      'Nhấp chọn quân cờ để hiển thị các chấm xanh nước đi hợp lệ.',
      'Sĩ Tượng thủ cung, Mã phóng càn quét, Pháo cách ngòi bắn phá thành.',
      'Chiếu bí Tướng đối phương để giành thắng lợi vinh quang!'
    ],
    controls: {
      desktop: 'Nhấp chuột chọn quân cờ và nước đi',
      mobile: 'Chạm chọn quân cờ và điểm đến'
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
    title: 'Bắn Bóng Phá Gạch (Breakout)',
    category: 'arcade',
    categoryLabel: 'Arcade Thử Thách',
    description: 'Bắn bóng đập tan toàn bộ các hàng gạch màu rực rỡ! Di chuyển thanh trượt nhịp nhàng và bắt kịp tốc độ bóng nảy cực gắt.',
    instructions: [
      'Di chuyển chuột, vuốt màn hình hoặc dùng phím A/D để trượt thanh đỡ.',
      'Bấm phím Cách hoặc chạm màn hình để phóng quả bóng đầu tiên.',
      'Phá hủy toàn bộ các hàng gạch nhiều màu để chiến thắng mà không để rơi bóng.'
    ],
    controls: {
      desktop: 'Kéo chuột hoặc Phím Mũi tên ← → / A D, Phím Cách bắn bóng',
      mobile: 'Kéo ngón tay trên màn hình để trượt thanh đỡ'
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
    title: 'Chiến Cơ Không Gian (Space Arcade)',
    category: 'arcade',
    categoryLabel: 'Bắn Súng Không Gian',
    description: 'Điều khiển phi thuyền không gian né làn mưa đạn la-de, tiêu diệt hạm đội quái vật ngoài hành tinh để bảo vệ vũ trụ.',
    instructions: [
      'Dùng phím A/D hoặc mũi tên ← → (hoặc kéo chuột/ngón tay) để di chuyển tàu.',
      'Bấm phím Cách hoặc chạm màn hình để liên tục khai hỏa tia la-de.',
      'Tiêu diệt toàn bộ hạm đội địch qua từng đợt tấn công để ghi điểm kỷ lục.'
    ],
    controls: {
      desktop: 'Phím A/D hoặc Mũi tên di chuyển, Phím Cách bắn la-de',
      mobile: 'Kéo ngón tay trên màn hình để vừa di chuyển vừa bắn tự động'
    },
    thumbnailIcon: '🚀',
    accentColor: 'from-violet-600 to-indigo-700',
    rating: 4.97,
    plays: 215000,
    tags: ['Bắn ruồi', 'Không gian', 'Phi thuyền', 'Arcade', 'Bắn súng'],
    isHot: true,
    isNew: true
  }
];
