export interface CharacterAvatar {
  id: string
  name: string
  category: 'nhan_vat' | 'anime' | 'cute' | 'minimal'
  src: string
}

export const CHARACTER_AVATARS: CharacterAvatar[] = [
  { id: 'boy_hoodie', name: 'Nam sinh Hoodie', category: 'anime', src: '/assets/avatars/avatar_01_boy.webp' },
  { id: 'boy_glasses', name: 'Nam sinh Kính cận', category: 'nhan_vat', src: '/assets/avatars/avatar_02_boy_glasses.webp' },
  { id: 'girl_peace', name: 'Nữ sinh Peace', category: 'anime', src: '/assets/avatars/avatar_03_girl_peace.webp' },
  { id: 'boy_gamer', name: 'Gamer Nam', category: 'nhan_vat', src: '/assets/avatars/avatar_04_boy_gamer.webp' },
  { id: 'girl_smile', name: 'Nữ sinh Tóc ngắn', category: 'nhan_vat', src: '/assets/avatars/avatar_05_girl_smile.webp' },
  { id: 'boy_cap', name: 'Nam sinh Nón ngược', category: 'nhan_vat', src: '/assets/avatars/avatar_06_boy_cap.webp' },
  { id: 'cat_gamer', name: 'Mèo Tai nghe Cute', category: 'cute', src: '/assets/avatars/avatar_07_cat_gamer.webp' },
  { id: 'shiba_smile', name: 'Cún Shiba Vui vẻ', category: 'cute', src: '/assets/avatars/avatar_08_shiba.webp' },
  { id: 'boy_white_hair', name: 'Bạch Kim Thời Thượng', category: 'anime', src: '/assets/avatars/avatar_09_boy_white_hair.webp' },
  { id: 'girl_headphones', name: 'Cyberpunk Girl', category: 'nhan_vat', src: '/assets/avatars/avatar_10_girl_headphones.webp' },
  { id: 'flat_boy', name: 'Flat Art Nam', category: 'minimal', src: '/assets/avatars/avatar_11_flat_boy.webp' },
  { id: 'flat_girl', name: 'Flat Art Nữ', category: 'minimal', src: '/assets/avatars/avatar_12_flat_girl.webp' },
  // 13-15: Avatar 3D Pixar Hoạt hình Cute
  { id: 'panda_cute', name: 'Gấu Trúc Panda', category: 'cute', src: '/assets/avatars/avatar_13_panda_cute.webp' },
  { id: 'corgi_cute', name: 'Cún Corgi Hoodie', category: 'cute', src: '/assets/avatars/avatar_14_corgi_cute.webp' },
  { id: 'kitten_cute', name: 'Mèo Pastel Cute', category: 'cute', src: '/assets/avatars/avatar_15_kitten_cute.webp' },
  // 16-28: Hoạt hình dễ thương
  { id: 'dino_cute', name: 'Khủng Long Baby', category: 'cute', src: '/assets/avatars/avatar_16_dino_cute.webp' },
  { id: 'bunny_cute', name: 'Thỏ Trắng Nơ Hồng', category: 'cute', src: '/assets/avatars/avatar_17_bunny_cute.webp' },
  { id: 'penguin_cute', name: 'Chim Cánh Cụt', category: 'cute', src: '/assets/avatars/avatar_18_penguin_cute.webp' },
  { id: 'duck_cute', name: 'Vịt Vàng Bé Bỏng', category: 'cute', src: '/assets/avatars/avatar_19_duck_cute.webp' },
  { id: 'hamster_cute', name: 'Chuột Hamster', category: 'cute', src: '/assets/avatars/avatar_20_hamster_cute.webp' },
  { id: 'fox_cute', name: 'Cáo Fennec Cam', category: 'cute', src: '/assets/avatars/avatar_21_fox_cute.webp' },
  { id: 'koala_cute', name: 'Gấu Koala Má Hồng', category: 'cute', src: '/assets/avatars/avatar_22_koala_cute.webp' },
  { id: 'frog_cute', name: 'Ếch Cốm Đội Sen', category: 'cute', src: '/assets/avatars/avatar_23_frog_cute.webp' },
  { id: 'piggy_cute', name: 'Heo Hồng Vương Miện', category: 'cute', src: '/assets/avatars/avatar_24_piggy_cute.webp' },
  { id: 'tiger_cute', name: 'Hổ Con Nhí Nhảnh', category: 'cute', src: '/assets/avatars/avatar_25_tiger_cute.webp' },
  { id: 'unicorn_cute', name: 'Kỳ Lân Cầu Vồng', category: 'cute', src: '/assets/avatars/avatar_26_unicorn_cute.webp' },
  { id: 'bear_cute', name: 'Gấu Nâu Teddy', category: 'cute', src: '/assets/avatars/avatar_27_bear_cute.webp' },
  { id: 'chick_cute', name: 'Gà Con Vỏ Trứng', category: 'cute', src: '/assets/avatars/avatar_28_chick_cute.webp' },
]
