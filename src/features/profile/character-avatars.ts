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
]
