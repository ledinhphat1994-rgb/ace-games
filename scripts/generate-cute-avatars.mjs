import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const outputDir = path.resolve('public/assets/avatars')

const specs = [
  // 16. Khủng Long Xanh Baby
  {
    id: 'avatar_16_dino_cute',
    name: 'Khủng Long Xanh Baby',
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_dino" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#bbf7d0"/>
          <stop offset="100%" stop-color="#4ade80"/>
        </radialGradient>
        <linearGradient id="body_dino" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6ee7b7"/>
          <stop offset="100%" stop-color="#10b981"/>
        </linearGradient>
        <linearGradient id="belly_dino" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="100%" stop-color="#facc15"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="60" fill="url(#bg_dino)"/>
      <circle cx="45" cy="55" r="9" fill="#ffffff" opacity="0.45"/>
      <circle cx="215" cy="70" r="14" fill="#ffffff" opacity="0.35"/>
      <circle cx="38" cy="195" r="12" fill="#ffffff" opacity="0.3"/>

      <!-- Spikes -->
      <polygon points="90,44 105,24 120,44" fill="#fb923c"/>
      <polygon points="120,40 135,18 150,40" fill="#fb923c"/>
      <polygon points="150,44 165,24 180,46" fill="#fb923c"/>

      <!-- Tail -->
      <path d="M 165 168 Q 220 178 228 142 Q 206 138 175 152 Z" fill="url(#body_dino)"/>
      <polygon points="214,139 224,127 228,142" fill="#fb923c"/>

      <!-- Body & Head -->
      <ellipse cx="128" cy="148" rx="62" ry="64" fill="url(#body_dino)"/>
      <ellipse cx="128" cy="116" rx="55" ry="50" fill="url(#body_dino)"/>

      <!-- Belly -->
      <ellipse cx="128" cy="160" rx="38" ry="40" fill="url(#belly_dino)"/>

      <!-- Cheeks -->
      <circle cx="94" cy="128" r="9" fill="#fb7185" opacity="0.6"/>
      <circle cx="162" cy="128" r="9" fill="#fb7185" opacity="0.6"/>

      <!-- Big sparkling eyes -->
      <ellipse cx="105" cy="110" rx="11" ry="14" fill="#1e293b"/>
      <circle cx="102" cy="106" r="4.5" fill="#ffffff"/>
      <circle cx="107" cy="114" r="2" fill="#ffffff"/>

      <ellipse cx="151" cy="110" rx="11" ry="14" fill="#1e293b"/>
      <circle cx="148" cy="106" r="4.5" fill="#ffffff"/>
      <circle cx="153" cy="114" r="2" fill="#ffffff"/>

      <!-- Smile -->
      <path d="M 120 126 Q 128 134 136 126" stroke="#064e3b" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M 124 128 Q 128 134 132 128 Z" fill="#fb7185"/>

      <!-- Arms -->
      <ellipse cx="104" cy="156" rx="10" ry="8" fill="#10b981" transform="rotate(20 104 156)"/>
      <ellipse cx="152" cy="156" rx="10" ry="8" fill="#10b981" transform="rotate(-20 152 156)"/>

      <!-- Feet -->
      <ellipse cx="106" cy="204" rx="16" ry="11" fill="#059669"/>
      <ellipse cx="150" cy="204" rx="16" ry="11" fill="#059669"/>
      <circle cx="98" cy="206" r="3" fill="#ffffff"/>
      <circle cx="106" cy="208" r="3" fill="#ffffff"/>
      <circle cx="114" cy="206" r="3" fill="#ffffff"/>
      <circle cx="142" cy="206" r="3" fill="#ffffff"/>
      <circle cx="150" cy="208" r="3" fill="#ffffff"/>
      <circle cx="158" cy="206" r="3" fill="#ffffff"/>
    </svg>
    `,
  },

  // 17. Thỏ Trắng Nơ Hồng
  {
    id: 'avatar_17_bunny_cute',
    name: 'Thỏ Trắng Nơ Hồng',
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_bunny" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fce7f3"/>
          <stop offset="100%" stop-color="#f472b6"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" rx="60" fill="url(#bg_bunny)"/>
      <circle cx="45" cy="50" r="10" fill="#ffffff" opacity="0.45"/>
      <circle cx="215" cy="65" r="12" fill="#ffffff" opacity="0.35"/>

      <!-- Bunny Ears -->
      <ellipse cx="98" cy="62" rx="16" ry="46" fill="#ffffff" transform="rotate(-12 98 62)"/>
      <ellipse cx="98" cy="64" rx="8" ry="34" fill="#fbcfe8" transform="rotate(-12 98 64)"/>

      <ellipse cx="158" cy="62" rx="16" ry="46" fill="#ffffff" transform="rotate(12 158 62)"/>
      <ellipse cx="158" cy="64" rx="8" ry="34" fill="#fbcfe8" transform="rotate(12 158 64)"/>

      <!-- Cute Bow on ear -->
      <polygon points="175,65 195,55 195,75" fill="#f43f5e"/>
      <polygon points="175,65 155,55 155,75" fill="#f43f5e"/>
      <circle cx="175" cy="65" r="5" fill="#fb7185"/>

      <!-- Body -->
      <ellipse cx="128" cy="180" rx="55" ry="45" fill="#ffffff"/>

      <!-- Head -->
      <circle cx="128" cy="132" r="52" fill="#ffffff"/>

      <!-- Cheeks -->
      <circle cx="92" cy="144" r="10" fill="#fda4af" opacity="0.7"/>
      <circle cx="164" cy="144" r="10" fill="#fda4af" opacity="0.7"/>

      <!-- Sparkling Eyes -->
      <ellipse cx="104" cy="128" rx="10" ry="13" fill="#1e1b4b"/>
      <circle cx="101" cy="124" r="4" fill="#ffffff"/>
      <circle cx="106" cy="132" r="2" fill="#ffffff"/>

      <ellipse cx="152" cy="128" rx="10" ry="13" fill="#1e1b4b"/>
      <circle cx="149" cy="124" r="4" fill="#ffffff"/>
      <circle cx="154" cy="132" r="2" fill="#ffffff"/>

      <!-- Cute Nose & Mouth -->
      <polygon points="128,138 124,134 132,134" fill="#f43f5e"/>
      <path d="M 124 142 Q 128 147 132 142" stroke="#475569" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M 128 138 L 128 143" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>

      <!-- Whiskers -->
      <line x1="75" y1="138" x2="60" y2="135" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
      <line x1="75" y1="144" x2="62" y2="146" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
      <line x1="181" y1="138" x2="196" y2="135" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
      <line x1="181" y1="144" x2="194" y2="146" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>

      <!-- Paws -->
      <ellipse cx="112" cy="178" rx="9" ry="11" fill="#f8fafc" stroke="#f1f5f9" stroke-width="2"/>
      <ellipse cx="144" cy="178" rx="9" ry="11" fill="#f8fafc" stroke="#f1f5f9" stroke-width="2"/>
      <!-- Feet -->
      <ellipse cx="98" cy="214" rx="16" ry="10" fill="#f8fafc"/>
      <ellipse cx="158" cy="214" rx="16" ry="10" fill="#f8fafc"/>
    </svg>
    `,
  },

  // 18. Chim Cánh Cụt Khăn Len
  {
    id: 'avatar_18_penguin_cute',
    name: 'Chim Cánh Cụt Khăn Len',
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_pen" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#bae6fd"/>
          <stop offset="100%" stop-color="#38bdf8"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" rx="60" fill="url(#bg_pen)"/>
      <circle cx="50" cy="55" r="10" fill="#ffffff" opacity="0.45"/>
      <circle cx="210" cy="65" r="14" fill="#ffffff" opacity="0.35"/>

      <!-- Feet -->
      <ellipse cx="106" cy="210" rx="18" ry="10" fill="#fb923c"/>
      <ellipse cx="150" cy="210" rx="18" ry="10" fill="#fb923c"/>

      <!-- Penguin Body (Black) -->
      <ellipse cx="128" cy="145" rx="64" ry="68" fill="#1e293b"/>

      <!-- Flippers/Wings -->
      <ellipse cx="68" cy="148" rx="14" ry="32" fill="#1e293b" transform="rotate(25 68 148)"/>
      <ellipse cx="188" cy="148" rx="14" ry="32" fill="#1e293b" transform="rotate(-25 188 148)"/>

      <!-- White Tummy & Face -->
      <ellipse cx="128" cy="148" rx="46" ry="54" fill="#ffffff"/>

      <!-- Warm Red Winter Scarf -->
      <rect x="90" y="142" width="76" height="18" rx="9" fill="#ef4444"/>
      <rect x="136" y="152" width="18" height="36" rx="8" fill="#dc2626"/>
      <line x1="138" y1="184" x2="138" y2="190" stroke="#fca5a5" stroke-width="2"/>
      <line x1="144" y1="184" x2="144" y2="190" stroke="#fca5a5" stroke-width="2"/>
      <line x1="150" y1="184" x2="150" y2="190" stroke="#fca5a5" stroke-width="2"/>

      <!-- Cheeks -->
      <circle cx="96" cy="128" r="8" fill="#fda4af" opacity="0.7"/>
      <circle cx="160" cy="128" r="8" fill="#fda4af" opacity="0.7"/>

      <!-- Eyes -->
      <ellipse cx="108" cy="116" rx="9" ry="12" fill="#0f172a"/>
      <circle cx="105" cy="112" r="4" fill="#ffffff"/>
      <circle cx="109" cy="120" r="1.5" fill="#ffffff"/>

      <ellipse cx="148" cy="116" rx="9" ry="12" fill="#0f172a"/>
      <circle cx="145" cy="112" r="4" fill="#ffffff"/>
      <circle cx="149" cy="120" r="1.5" fill="#ffffff"/>

      <!-- Cute Orange Beak -->
      <polygon points="128,124 118,118 138,118" fill="#f97316"/>
      <ellipse cx="128" cy="124" rx="8" ry="5" fill="#ea580c"/>

      <!-- Little Beanie / Winter Hat -->
      <path d="M 96 82 Q 128 58 160 82 Z" fill="#ef4444"/>
      <rect x="92" y="78" width="72" height="10" rx="5" fill="#ffffff"/>
      <circle cx="128" cy="58" r="9" fill="#ffffff"/>
    </svg>
    `,
  },

  // 19. Vịt Vàng Bé Bỏng
  {
    id: 'avatar_19_duck_cute',
    name: 'Vịt Vàng Bé Bỏng',
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_duck" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fed7aa"/>
          <stop offset="100%" stop-color="#f97316"/>
        </radialGradient>
        <linearGradient id="body_duck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="100%" stop-color="#facc15"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="60" fill="url(#bg_duck)"/>
      <circle cx="45" cy="50" r="9" fill="#ffffff" opacity="0.45"/>
      <circle cx="215" cy="65" r="12" fill="#ffffff" opacity="0.35"/>

      <!-- Feet -->
      <ellipse cx="106" cy="208" rx="16" ry="9" fill="#ea580c"/>
      <ellipse cx="150" cy="208" rx="16" ry="9" fill="#ea580c"/>

      <!-- Body -->
      <ellipse cx="128" cy="158" rx="62" ry="54" fill="url(#body_duck)"/>

      <!-- Head -->
      <circle cx="128" cy="110" r="48" fill="url(#body_duck)"/>

      <!-- Wings -->
      <ellipse cx="74" cy="158" rx="12" ry="24" fill="#eab308" transform="rotate(20 74 158)"/>
      <ellipse cx="182" cy="158" rx="12" ry="24" fill="#eab308" transform="rotate(-20 182 158)"/>

      <!-- Cheeks -->
      <circle cx="94" cy="120" r="9" fill="#fb7185" opacity="0.6"/>
      <circle cx="162" cy="120" r="9" fill="#fb7185" opacity="0.6"/>

      <!-- Big Eyes -->
      <ellipse cx="106" cy="102" rx="10" ry="13" fill="#1e293b"/>
      <circle cx="103" cy="98" r="4" fill="#ffffff"/>
      <circle cx="108" cy="106" r="2" fill="#ffffff"/>

      <ellipse cx="150" cy="102" rx="10" ry="13" fill="#1e293b"/>
      <circle cx="147" cy="98" r="4" fill="#ffffff"/>
      <circle cx="152" cy="106" r="2" fill="#ffffff"/>

      <!-- Duck Bill/Beak -->
      <ellipse cx="128" cy="118" rx="18" ry="10" fill="#f97316"/>
      <ellipse cx="128" cy="120" rx="12" ry="6" fill="#ea580c"/>

      <!-- Tiny sprout on head -->
      <path d="M 128 64 Q 122 48 116 52 Q 124 58 128 64" fill="#22c55e"/>
      <path d="M 128 64 Q 134 46 142 50 Q 134 58 128 64" fill="#22c55e"/>
    </svg>
    `,
  },

  // 20. Chuột Hamster Phúng Phính
  {
    id: 'avatar_20_hamster_cute',
    name: 'Chuột Hamster Phúng Phính',
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_ham" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fef3c7"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </radialGradient>
        <linearGradient id="ham_fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="60" fill="url(#bg_ham)"/>
      <circle cx="45" cy="50" r="10" fill="#ffffff" opacity="0.45"/>
      <circle cx="215" cy="65" r="12" fill="#ffffff" opacity="0.35"/>

      <!-- Round Ears -->
      <circle cx="86" cy="74" r="22" fill="url(#ham_fur)"/>
      <circle cx="86" cy="74" r="13" fill="#fbcfe8"/>

      <circle cx="170" cy="74" r="22" fill="url(#ham_fur)"/>
      <circle cx="170" cy="74" r="13" fill="#fbcfe8"/>

      <!-- Body -->
      <ellipse cx="128" cy="154" rx="66" ry="60" fill="url(#ham_fur)"/>

      <!-- White Chubby Cheeks & Belly -->
      <ellipse cx="128" cy="164" rx="52" ry="46" fill="#fffbeb"/>
      <ellipse cx="94" cy="142" rx="22" ry="20" fill="#ffffff"/>
      <ellipse cx="162" cy="142" rx="22" ry="20" fill="#ffffff"/>

      <!-- Rosy Cheeks -->
      <circle cx="88" cy="144" r="9" fill="#fb7185" opacity="0.6"/>
      <circle cx="168" cy="144" r="9" fill="#fb7185" opacity="0.6"/>

      <!-- Eyes -->
      <ellipse cx="106" cy="116" rx="9" ry="12" fill="#1e1b4b"/>
      <circle cx="103" cy="112" r="4" fill="#ffffff"/>
      <circle cx="108" cy="120" r="1.5" fill="#ffffff"/>

      <ellipse cx="150" cy="116" rx="9" ry="12" fill="#1e1b4b"/>
      <circle cx="147" cy="112" r="4" fill="#ffffff"/>
      <circle cx="152" cy="120" r="1.5" fill="#ffffff"/>

      <!-- Tiny Nose & Mouth -->
      <ellipse cx="128" cy="130" rx="5" ry="3.5" fill="#f43f5e"/>
      <path d="M 124 135 Q 128 139 132 135" stroke="#475569" stroke-width="2" fill="none"/>

      <!-- Tiny Sunflower Seed in hands -->
      <ellipse cx="128" cy="170" rx="10" ry="14" fill="#334155" stroke="#f8fafc" stroke-width="1.5"/>
      <line x1="128" y1="158" x2="128" y2="182" stroke="#64748b" stroke-width="1.5"/>

      <!-- Little Hands -->
      <circle cx="116" cy="170" r="7" fill="#fbcfe8"/>
      <circle cx="140" cy="170" r="7" fill="#fbcfe8"/>

      <!-- Feet -->
      <ellipse cx="98" cy="208" rx="14" ry="8" fill="#fbcfe8"/>
      <ellipse cx="158" cy="208" rx="14" ry="8" fill="#fbcfe8"/>
    </svg>
    `,
  },

  // 21. Cáo Fennec Cam Nhỏ
  {
    id: 'avatar_21_fox_cute',
    name: 'Cáo Fennec Cam Nhỏ',
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_fox" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fed7aa"/>
          <stop offset="100%" stop-color="#ea580c"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" rx="60" fill="url(#bg_fox)"/>
      <circle cx="45" cy="50" r="9" fill="#ffffff" opacity="0.45"/>
      <circle cx="215" cy="65" r="12" fill="#ffffff" opacity="0.35"/>

      <!-- Big Fennec Ears -->
      <polygon points="68,110 50,30 110,60" fill="#f97316"/>
      <polygon points="72,100 58,42 102,68" fill="#fef08a"/>

      <polygon points="188,110 206,30 146,60" fill="#f97316"/>
      <polygon points="184,100 198,42 154,68" fill="#fef08a"/>

      <!-- Fluffy Tail -->
      <path d="M 160 170 Q 225 180 220 130 Q 190 120 160 150 Z" fill="#f97316"/>
      <path d="M 205 138 Q 220 130 216 148 Z" fill="#ffffff"/>

      <!-- Body -->
      <ellipse cx="128" cy="164" rx="54" ry="50" fill="#f97316"/>

      <!-- Head -->
      <ellipse cx="128" cy="122" rx="58" ry="46" fill="#f97316"/>

      <!-- White Muzzle & Cheeks -->
      <path d="M 80 130 Q 128 170 176 130 Q 128 120 80 130 Z" fill="#ffffff"/>
      <circle cx="92" cy="132" r="8" fill="#fda4af" opacity="0.6"/>
      <circle cx="164" cy="132" r="8" fill="#fda4af" opacity="0.6"/>

      <!-- Eyes -->
      <ellipse cx="106" cy="112" rx="9" ry="12" fill="#1e293b"/>
      <circle cx="103" cy="108" r="4" fill="#ffffff"/>
      <circle cx="108" cy="116" r="1.5" fill="#ffffff"/>

      <ellipse cx="150" cy="112" rx="9" ry="12" fill="#1e293b"/>
      <circle cx="147" cy="108" r="4" fill="#ffffff"/>
      <circle cx="152" cy="116" r="1.5" fill="#ffffff"/>

      <!-- Nose -->
      <polygon points="128,138 122,132 134,132" fill="#0f172a"/>

      <!-- Feet -->
      <ellipse cx="106" cy="208" rx="14" ry="9" fill="#ffffff"/>
      <ellipse cx="150" cy="208" rx="14" ry="9" fill="#ffffff"/>
    </svg>
    `,
  },

  // 22. Gấu Koala Má Hồng
  {
    id: 'avatar_22_koala_cute',
    name: 'Gấu Koala Má Hồng',
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_koa" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#94a3b8"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" rx="60" fill="url(#bg_koa)"/>
      <circle cx="45" cy="50" r="10" fill="#ffffff" opacity="0.45"/>
      <circle cx="215" cy="65" r="12" fill="#ffffff" opacity="0.35"/>

      <!-- Fluffy Big Ears -->
      <circle cx="76" cy="85" r="28" fill="#64748b"/>
      <circle cx="76" cy="85" r="18" fill="#f1f5f9"/>

      <circle cx="180" cy="85" r="28" fill="#64748b"/>
      <circle cx="180" cy="85" r="18" fill="#f1f5f9"/>

      <!-- Body -->
      <ellipse cx="128" cy="165" rx="56" ry="50" fill="#64748b"/>
      <ellipse cx="128" cy="170" rx="36" ry="36" fill="#f1f5f9"/>

      <!-- Head -->
      <circle cx="128" cy="125" r="50" fill="#64748b"/>

      <!-- Big Shiny Koala Nose -->
      <ellipse cx="128" cy="126" rx="16" ry="22" fill="#1e293b"/>
      <ellipse cx="124" cy="116" rx="5" ry="7" fill="#475569" opacity="0.8"/>

      <!-- Rosy Cheeks -->
      <circle cx="92" cy="138" r="9" fill="#fda4af" opacity="0.7"/>
      <circle cx="164" cy="138" r="9" fill="#fda4af" opacity="0.7"/>

      <!-- Eyes -->
      <ellipse cx="102" cy="114" rx="8" ry="11" fill="#0f172a"/>
      <circle cx="100" cy="110" r="3.5" fill="#ffffff"/>

      <ellipse cx="154" cy="114" rx="8" ry="11" fill="#0f172a"/>
      <circle cx="152" cy="110" r="3.5" fill="#ffffff"/>

      <!-- Paws -->
      <ellipse cx="100" cy="175" rx="10" ry="12" fill="#475569"/>
      <ellipse cx="156" cy="175" rx="10" ry="12" fill="#475569"/>
      <ellipse cx="102" cy="210" rx="14" ry="9" fill="#475569"/>
      <ellipse cx="154" cy="210" rx="14" ry="9" fill="#475569"/>
    </svg>
    `,
  },

  // 23. Ếch Cốm Đội Lá Sen
  {
    id: 'avatar_23_frog_cute',
    name: 'Ếch Cốm Đội Lá Sen',
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_frg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#d9f99d"/>
          <stop offset="100%" stop-color="#84cc16"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" rx="60" fill="url(#bg_frg)"/>
      <circle cx="45" cy="50" r="9" fill="#ffffff" opacity="0.45"/>
      <circle cx="215" cy="65" r="12" fill="#ffffff" opacity="0.35"/>

      <!-- Big Eye Bumps -->
      <circle cx="95" cy="88" r="24" fill="#65a30d"/>
      <circle cx="161" cy="88" r="24" fill="#65a30d"/>

      <!-- Lotus Leaf on head -->
      <ellipse cx="128" cy="70" rx="34" ry="14" fill="#15803d"/>
      <line x1="128" y1="70" x2="128" y2="52" stroke="#166534" stroke-width="3" stroke-linecap="round"/>

      <!-- Frog Body & Head -->
      <ellipse cx="128" cy="155" rx="64" ry="58" fill="#65a30d"/>
      <ellipse cx="128" cy="118" rx="60" ry="46" fill="#65a30d"/>

      <!-- Light green belly -->
      <ellipse cx="128" cy="165" rx="42" ry="40" fill="#ecfccb"/>

      <!-- Big Eyes -->
      <ellipse cx="95" cy="88" rx="14" ry="16" fill="#ffffff"/>
      <ellipse cx="95" cy="88" rx="9" ry="11" fill="#0f172a"/>
      <circle cx="92" cy="84" r="4" fill="#ffffff"/>

      <ellipse cx="161" cy="88" rx="14" ry="16" fill="#ffffff"/>
      <ellipse cx="161" cy="88" rx="9" ry="11" fill="#0f172a"/>
      <circle cx="158" cy="84" r="4" fill="#ffffff"/>

      <!-- Cheeks -->
      <circle cx="86" cy="128" r="10" fill="#fb7185" opacity="0.6"/>
      <circle cx="170" cy="128" r="10" fill="#fb7185" opacity="0.6"/>

      <!-- Big Happy Smile -->
      <path d="M 108 126 Q 128 144 148 126" stroke="#14532d" stroke-width="3.5" stroke-linecap="round" fill="none"/>

      <!-- Hands & Feet -->
      <ellipse cx="80" cy="170" rx="10" ry="14" fill="#4d7c0f"/>
      <ellipse cx="176" cy="170" rx="10" ry="14" fill="#4d7c0f"/>
      <ellipse cx="98" cy="210" rx="18" ry="10" fill="#4d7c0f"/>
      <ellipse cx="158" cy="210" rx="18" ry="10" fill="#4d7c0f"/>
    </svg>
    `,
  },

  // 24. Heo Hồng Vương Miện
  {
    id: 'avatar_24_piggy_cute',
    name: 'Heo Hồng Vương Miện',
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_pig" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fbcfe8"/>
          <stop offset="100%" stop-color="#f472b6"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" rx="60" fill="url(#bg_pig)"/>
      <circle cx="45" cy="50" r="9" fill="#ffffff" opacity="0.45"/>
      <circle cx="215" cy="65" r="12" fill="#ffffff" opacity="0.35"/>

      <!-- Tiny Gold Crown -->
      <polygon points="112,68 116,48 122,58 128,44 134,58 140,48 144,68" fill="#facc15" stroke="#eab308" stroke-width="2"/>
      <circle cx="116" cy="46" r="2.5" fill="#ef4444"/>
      <circle cx="128" cy="42" r="2.5" fill="#3b82f6"/>
      <circle cx="140" cy="46" r="2.5" fill="#ef4444"/>

      <!-- Pig Ears -->
      <polygon points="80,105 70,65 105,80" fill="#f472b6"/>
      <polygon points="82,100 74,72 100,84" fill="#fda4af"/>

      <polygon points="176,105 186,65 151,80" fill="#f472b6"/>
      <polygon points="174,100 182,72 156,84" fill="#fda4af"/>

      <!-- Body -->
      <ellipse cx="128" cy="165" rx="62" ry="54" fill="#f472b6"/>

      <!-- Head -->
      <circle cx="128" cy="120" r="50" fill="#f472b6"/>

      <!-- Snout -->
      <ellipse cx="128" cy="128" rx="20" ry="14" fill="#fb7185"/>
      <ellipse cx="122" cy="128" rx="3.5" ry="5" fill="#9f1239"/>
      <ellipse cx="134" cy="128" rx="3.5" ry="5" fill="#9f1239"/>

      <!-- Cheeks -->
      <circle cx="88" cy="132" r="10" fill="#fda4af" opacity="0.7"/>
      <circle cx="168" cy="132" r="10" fill="#fda4af" opacity="0.7"/>

      <!-- Eyes -->
      <ellipse cx="104" cy="108" rx="9" ry="12" fill="#1e1b4b"/>
      <circle cx="101" cy="104" r="4" fill="#ffffff"/>

      <ellipse cx="152" cy="108" rx="9" ry="12" fill="#1e1b4b"/>
      <circle cx="149" cy="104" r="4" fill="#ffffff"/>

      <!-- Feet -->
      <ellipse cx="106" cy="208" rx="14" ry="9" fill="#db2777"/>
      <ellipse cx="150" cy="208" rx="14" ry="9" fill="#db2777"/>
    </svg>
    `,
  },

  // 25. Hổ Con Nhí Nhảnh
  {
    id: 'avatar_25_tiger_cute',
    name: 'Hổ Con Nhí Nhảnh',
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_tig" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" rx="60" fill="url(#bg_tig)"/>
      <circle cx="45" cy="50" r="9" fill="#ffffff" opacity="0.45"/>
      <circle cx="215" cy="65" r="12" fill="#ffffff" opacity="0.35"/>

      <!-- Round Ears -->
      <circle cx="82" cy="78" r="22" fill="#f97316"/>
      <circle cx="82" cy="78" r="13" fill="#fef08a"/>

      <circle cx="174" cy="78" r="22" fill="#f97316"/>
      <circle cx="174" cy="78" r="13" fill="#fef08a"/>

      <!-- Body -->
      <ellipse cx="128" cy="165" rx="58" ry="52" fill="#f97316"/>
      <ellipse cx="128" cy="170" rx="36" ry="38" fill="#ffffff"/>

      <!-- Head -->
      <circle cx="128" cy="122" r="50" fill="#f97316"/>

      <!-- Tiger Stripes on forehead -->
      <polygon points="128,78 124,94 132,94" fill="#78350f"/>
      <polygon points="112,86 116,98 122,96" fill="#78350f"/>
      <polygon points="144,86 140,98 134,96" fill="#78350f"/>

      <!-- Side Stripes -->
      <polygon points="78,118 92,120 78,126" fill="#78350f"/>
      <polygon points="178,118 164,120 178,126" fill="#78350f"/>

      <!-- White Snout -->
      <ellipse cx="128" cy="136" rx="24" ry="16" fill="#ffffff"/>

      <!-- Nose & Mouth -->
      <polygon points="128,132 122,126 134,126" fill="#ec4899"/>
      <path d="M 124 136 Q 128 142 132 136" stroke="#78350f" stroke-width="2.5" fill="none"/>

      <!-- Cheeks -->
      <circle cx="88" cy="134" r="9" fill="#fda4af" opacity="0.6"/>
      <circle cx="168" cy="134" r="9" fill="#fda4af" opacity="0.6"/>

      <!-- Eyes -->
      <ellipse cx="105" cy="114" rx="9" ry="12" fill="#1e1b4b"/>
      <circle cx="102" cy="110" r="4" fill="#ffffff"/>

      <ellipse cx="151" cy="114" rx="9" ry="12" fill="#1e1b4b"/>
      <circle cx="148" cy="110" r="4" fill="#ffffff"/>

      <!-- Feet -->
      <ellipse cx="106" cy="208" rx="14" ry="9" fill="#ea580c"/>
      <ellipse cx="150" cy="208" rx="14" ry="9" fill="#ea580c"/>
    </svg>
    `,
  },

  // 26. Kỳ Lân Cầu Vồng
  {
    id: 'avatar_26_unicorn_cute',
    name: 'Kỳ Lân Cầu Vồng',
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_uni" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#e0e7ff"/>
          <stop offset="100%" stop-color="#c084fc"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" rx="60" fill="url(#bg_uni)"/>
      <circle cx="45" cy="50" r="9" fill="#ffffff" opacity="0.45"/>
      <circle cx="215" cy="65" r="12" fill="#ffffff" opacity="0.35"/>

      <!-- Golden Horn with glow -->
      <polygon points="128,26 120,72 136,72" fill="#facc15" stroke="#f59e0b" stroke-width="2"/>
      <line x1="124" y1="42" x2="132" y2="40" stroke="#fbbf24" stroke-width="2"/>
      <line x1="122" y1="56" x2="134" y2="54" stroke="#fbbf24" stroke-width="2"/>

      <!-- Rainbow Mane -->
      <path d="M 100 68 Q 80 85 90 115" stroke="#f43f5e" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M 156 68 Q 176 85 166 115" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M 128 70 Q 148 85 142 110" stroke="#a855f7" stroke-width="7" stroke-linecap="round" fill="none"/>

      <!-- Unicorn Ears -->
      <polygon points="90,95 80,62 108,76" fill="#ffffff"/>
      <polygon points="92,90 85,68 104,78" fill="#fbcfe8"/>

      <polygon points="166,95 176,62 148,76" fill="#ffffff"/>
      <polygon points="164,90 171,68 152,78" fill="#fbcfe8"/>

      <!-- Body -->
      <ellipse cx="128" cy="170" rx="55" ry="48" fill="#ffffff"/>

      <!-- Head -->
      <circle cx="128" cy="126" r="48" fill="#ffffff"/>

      <!-- Snout -->
      <ellipse cx="128" cy="144" rx="18" ry="12" fill="#fce7f3"/>
      <ellipse cx="124" cy="144" rx="2.5" ry="3.5" fill="#f43f5e"/>
      <ellipse cx="132" cy="144" rx="2.5" ry="3.5" fill="#f43f5e"/>

      <!-- Cheeks -->
      <circle cx="94" cy="138" r="9" fill="#fda4af" opacity="0.7"/>
      <circle cx="162" cy="138" r="9" fill="#fda4af" opacity="0.7"/>

      <!-- Sparkling Anime Eyes -->
      <ellipse cx="106" cy="120" rx="9" ry="12" fill="#4338ca"/>
      <circle cx="103" cy="116" r="4" fill="#ffffff"/>
      <circle cx="108" cy="124" r="1.5" fill="#ffffff"/>

      <ellipse cx="150" cy="120" rx="9" ry="12" fill="#4338ca"/>
      <circle cx="147" cy="116" r="4" fill="#ffffff"/>
      <circle cx="152" cy="124" r="1.5" fill="#ffffff"/>

      <!-- Feet -->
      <ellipse cx="106" cy="210" rx="14" ry="9" fill="#fbcfe8"/>
      <ellipse cx="150" cy="210" rx="14" ry="9" fill="#fbcfe8"/>
    </svg>
    `,
  },

  // 27. Gấu Nâu Teddy Nơ Xanh
  {
    id: 'avatar_27_bear_cute',
    name: 'Gấu Nâu Teddy Nơ Xanh',
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_bear" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fed7aa"/>
          <stop offset="100%" stop-color="#b45309"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" rx="60" fill="url(#bg_bear)"/>
      <circle cx="45" cy="50" r="9" fill="#ffffff" opacity="0.45"/>
      <circle cx="215" cy="65" r="12" fill="#ffffff" opacity="0.35"/>

      <!-- Round Bear Ears -->
      <circle cx="82" cy="80" r="24" fill="#92400e"/>
      <circle cx="82" cy="80" r="14" fill="#fde68a"/>

      <circle cx="174" cy="80" r="24" fill="#92400e"/>
      <circle cx="174" cy="80" r="14" fill="#fde68a"/>

      <!-- Body -->
      <ellipse cx="128" cy="165" rx="60" ry="52" fill="#92400e"/>
      <ellipse cx="128" cy="170" rx="38" ry="38" fill="#fef3c7"/>

      <!-- Blue Bow Tie -->
      <polygon points="128,154 114,146 114,162" fill="#38bdf8"/>
      <polygon points="128,154 142,146 142,162" fill="#38bdf8"/>
      <circle cx="128" cy="154" r="4" fill="#0284c7"/>

      <!-- Head -->
      <circle cx="128" cy="122" r="50" fill="#92400e"/>

      <!-- Snout -->
      <ellipse cx="128" cy="132" rx="22" ry="16" fill="#fef3c7"/>
      <polygon points="128,128 122,122 134,122" fill="#451a03"/>
      <path d="M 124 134 Q 128 138 132 134" stroke="#451a03" stroke-width="2" fill="none"/>

      <!-- Cheeks -->
      <circle cx="88" cy="132" r="9" fill="#fda4af" opacity="0.6"/>
      <circle cx="168" cy="132" r="9" fill="#fda4af" opacity="0.6"/>

      <!-- Eyes -->
      <ellipse cx="106" cy="114" rx="8" ry="11" fill="#1e1b4b"/>
      <circle cx="103" cy="110" r="3.5" fill="#ffffff"/>

      <ellipse cx="150" cy="114" rx="8" ry="11" fill="#1e1b4b"/>
      <circle cx="147" cy="110" r="3.5" fill="#ffffff"/>

      <!-- Feet -->
      <ellipse cx="104" cy="208" rx="14" ry="9" fill="#78350f"/>
      <ellipse cx="152" cy="208" rx="14" ry="9" fill="#78350f"/>
    </svg>
    `,
  },

  // 28. Gà Con Vỏ Trứng
  {
    id: 'avatar_28_chick_cute',
    name: 'Gà Con Vỏ Trứng',
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_chk" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" rx="60" fill="url(#bg_chk)"/>
      <circle cx="45" cy="50" r="9" fill="#ffffff" opacity="0.45"/>
      <circle cx="215" cy="65" r="12" fill="#ffffff" opacity="0.35"/>

      <!-- Chick Head & Body -->
      <circle cx="128" cy="120" r="54" fill="#facc15"/>

      <!-- Broken Eggshell Bottom -->
      <path d="M 72 145 Q 128 220 184 145 L 170 155 L 156 142 L 142 155 L 128 140 L 114 155 L 100 142 L 86 155 Z" fill="#ffffff" stroke="#f1f5f9" stroke-width="2"/>

      <!-- Eggshell Hat on Top -->
      <path d="M 104 80 Q 128 50 152 80 L 142 75 L 128 85 L 114 75 Z" fill="#ffffff" stroke="#f1f5f9" stroke-width="2"/>

      <!-- Little Wings -->
      <ellipse cx="76" cy="135" rx="10" ry="16" fill="#eab308" transform="rotate(25 76 135)"/>
      <ellipse cx="180" cy="135" rx="10" ry="16" fill="#eab308" transform="rotate(-25 180 135)"/>

      <!-- Cheeks -->
      <circle cx="94" cy="126" r="9" fill="#fb7185" opacity="0.6"/>
      <circle cx="162" cy="126" r="9" fill="#fb7185" opacity="0.6"/>

      <!-- Eyes -->
      <ellipse cx="106" cy="112" rx="9" ry="12" fill="#1e293b"/>
      <circle cx="103" cy="108" r="4" fill="#ffffff"/>

      <ellipse cx="150" cy="112" rx="9" ry="12" fill="#1e293b"/>
      <circle cx="147" cy="108" r="4" fill="#ffffff"/>

      <!-- Beak -->
      <polygon points="128,124 120,118 136,118" fill="#f97316"/>
    </svg>
    `,
  },
]

async function run() {
  for (const s of specs) {
    const dest = path.join(outputDir, `${s.id}.webp`)
    await sharp(Buffer.from(s.svg.trim())).webp({ quality: 90 }).toFile(dest)
    console.log(`Generated ${s.id}.webp (${s.name})`)
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
