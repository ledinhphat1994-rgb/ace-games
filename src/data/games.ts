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
  }
];
