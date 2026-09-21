import sharp from 'sharp'
import path from 'node:path'

const BRAIN_UPLOAD = 'C:/Users/lepha/.gemini/antigravity-ide/brain/e6edbd18-3ae2-46b7-8200-83491b8941d2/.user_uploaded'
const OUT_DIR = path.resolve('public/assets')

async function run() {
  console.log('Extracting and optimizing art assets from reference mockups...')

  // ──────────────────────────────────────────────────────────────────────────
  // 1. CAMPUS & HOME
  // ──────────────────────────────────────────────────────────────────────────
  const homeMockup = path.join(BRAIN_UPLOAD, 'media_1789945260068.jpg')

  // Clean hero illustration (student looking at Digital Campus building)
  await sharp(homeMockup)
    .extract({ left: 370, top: 52, width: 620, height: 161 })
    .resize(1240, 322, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'campus/hero_illustration.webp'))

  // Full hero banner (for desktop wide)
  await sharp(homeMockup)
    .extract({ left: 34, top: 52, width: 956, height: 161 })
    .resize(1912, 322, { fit: 'cover' })
    .webp({ quality: 92 })
    .toFile(path.join(OUT_DIR, 'campus/hero_banner.webp'))

  // Campus building focus
  await sharp(homeMockup)
    .extract({ left: 590, top: 62, width: 260, height: 145 })
    .resize(520, 290, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'campus/campus_building.webp'))

  // Quote scenic landscape
  await sharp(homeMockup)
    .extract({ left: 787, top: 472, width: 203, height: 51 })
    .resize(406, 102, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'campus/quote_landscape.webp'))

  // 3 Destination Cards art backgrounds
  await sharp(homeMockup)
    .extract({ left: 145, top: 279, width: 135, height: 104 })
    .resize(270, 208, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'learning/card_learning.webp'))

  await sharp(homeMockup)
    .extract({ left: 403, top: 279, width: 135, height: 104 })
    .resize(270, 208, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'games/card_game.webp'))

  await sharp(homeMockup)
    .extract({ left: 661, top: 279, width: 135, height: 104 })
    .resize(270, 208, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'community/card_community.webp'))

  // 4 Home Room Cards thumbnails
  await sharp(homeMockup)
    .extract({ left: 35, top: 423, width: 178, height: 100 })
    .resize(356, 200, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'learning/room_math.webp'))

  await sharp(homeMockup)
    .extract({ left: 224, top: 423, width: 178, height: 100 })
    .resize(356, 200, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'learning/room_physics.webp'))

  await sharp(homeMockup)
    .extract({ left: 413, top: 423, width: 178, height: 100 })
    .resize(356, 200, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'learning/room_tech.webp'))

  await sharp(homeMockup)
    .extract({ left: 602, top: 423, width: 178, height: 100 })
    .resize(356, 200, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'learning/room_study.webp'))

  console.log('✓ Campus & Home assets extracted.')

  // ──────────────────────────────────────────────────────────────────────────
  // 2. LEARNING
  // ──────────────────────────────────────────────────────────────────────────
  const learningMockup = path.join(BRAIN_UPLOAD, 'media_1789945291296.jpg')

  // Learning Hero banner artwork (student studying with headphones)
  await sharp(learningMockup)
    .extract({ left: 370, top: 52, width: 620, height: 140 })
    .resize(1240, 280, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'learning/learning_hero.webp'))

  // Room YouTube
  await sharp(learningMockup)
    .extract({ left: 280, top: 395, width: 220, height: 120 })
    .resize(440, 240, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'learning/room_youtube.webp'))

  // Room Cyber Security
  await sharp(learningMockup)
    .extract({ left: 520, top: 395, width: 220, height: 120 })
    .resize(440, 240, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'learning/room_security.webp'))

  // Graduation cap quote card
  await sharp(learningMockup)
    .extract({ left: 760, top: 375, width: 230, height: 140 })
    .resize(460, 280, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'learning/learning_quote.webp'))

  console.log('✓ Learning assets extracted.')

  // ──────────────────────────────────────────────────────────────────────────
  // 3. GAME ARENA
  // ──────────────────────────────────────────────────────────────────────────
  const gameMockup = path.join(BRAIN_UPLOAD, 'media_1789945259917.jpg')

  // Featured Game Caro Hero Board artwork
  await sharp(gameMockup)
    .extract({ left: 300, top: 52, width: 460, height: 185 })
    .resize(920, 370, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'games/game_hero_caro.webp'))

  // Game covers
  // Caro 3D board
  await sharp(gameMockup)
    .extract({ left: 35, top: 300, width: 178, height: 105 })
    .resize(356, 210, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'games/cover_caro.webp'))

  // Chess 3D
  await sharp(gameMockup)
    .extract({ left: 224, top: 300, width: 178, height: 105 })
    .resize(356, 210, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'games/cover_chess.webp'))

  // 2048 3D
  await sharp(gameMockup)
    .extract({ left: 413, top: 300, width: 178, height: 105 })
    .resize(356, 210, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'games/cover_2048.webp'))

  // Snake 3D
  await sharp(gameMockup)
    .extract({ left: 602, top: 300, width: 178, height: 105 })
    .resize(356, 210, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'games/cover_snake.webp'))

  // Caro 9x9 (special variant based on Caro board crop)
  await sharp(gameMockup)
    .extract({ left: 55, top: 310, width: 140, height: 95 })
    .resize(356, 210, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'games/cover_caro9.webp'))

  // Gaming promo banner on right
  await sharp(gameMockup)
    .extract({ left: 770, top: 395, width: 220, height: 120 })
    .resize(440, 240, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'games/gaming_poster.webp'))

  console.log('✓ Game assets extracted.')

  // ──────────────────────────────────────────────────────────────────────────
  // 4. COMMUNITY
  // ──────────────────────────────────────────────────────────────────────────
  const communityMockup = path.join(BRAIN_UPLOAD, 'media_1789945259953.jpg')

  // Community Hero banner (students sitting outside campus building at dusk)
  await sharp(communityMockup)
    .extract({ left: 260, top: 52, width: 500, height: 175 })
    .resize(1000, 350, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'community/community_hero.webp'))

  console.log('✓ Community assets extracted.')

  // ──────────────────────────────────────────────────────────────────────────
  // 5. PROFILE & AVATARS
  // ──────────────────────────────────────────────────────────────────────────
  const profileMockup = path.join(BRAIN_UPLOAD, 'media_1789945260005.jpg')

  // Panoramic Profile Cover
  await sharp(profileMockup)
    .extract({ left: 190, top: 52, width: 800, height: 150 })
    .resize(1600, 300, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'profile/profile_cover.webp'))

  // Clean hero character avatar (boy with hoodie)
  await sharp(profileMockup)
    .extract({ left: 63, top: 130, width: 108, height: 108 })
    .resize(256, 256, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'avatars/avatar_01_boy.webp'))

  // 12 Character Avatars
  const avatarSpecs = [
    { name: 'avatar_01_boy.webp', left: 63, top: 130, width: 108, height: 108 }, // high res hero
    { name: 'avatar_02_boy_glasses.webp', left: 414, top: 310, width: 90, height: 78 },
    { name: 'avatar_03_girl_peace.webp', left: 524, top: 310, width: 90, height: 78 },
    { name: 'avatar_04_boy_gamer.webp', left: 634, top: 310, width: 90, height: 78 },
    { name: 'avatar_05_girl_smile.webp', left: 744, top: 310, width: 90, height: 78 },
    { name: 'avatar_06_boy_cap.webp', left: 854, top: 310, width: 90, height: 78 },
    { name: 'avatar_07_cat_gamer.webp', left: 304, top: 405, width: 90, height: 78 },
    { name: 'avatar_08_shiba.webp', left: 414, top: 405, width: 90, height: 78 },
    { name: 'avatar_09_boy_white_hair.webp', left: 524, top: 405, width: 90, height: 78 },
    { name: 'avatar_10_girl_headphones.webp', left: 634, top: 405, width: 90, height: 78 },
    { name: 'avatar_11_flat_boy.webp', left: 744, top: 405, width: 90, height: 78 },
    { name: 'avatar_12_flat_girl.webp', left: 854, top: 405, width: 90, height: 78 },
  ]

  for (const a of avatarSpecs) {
    await sharp(profileMockup)
      .extract({ left: a.left, top: a.top, width: a.width, height: a.height })
      .resize(256, 256, { fit: 'cover' })
      .webp({ quality: 95 })
      .toFile(path.join(OUT_DIR, 'avatars', a.name))
  }

  console.log('✓ Profile & 12 Avatar assets extracted.')

  // ──────────────────────────────────────────────────────────────────────────
  // 6. STUDY ROOM CLASSROOM
  // ──────────────────────────────────────────────────────────────────────────
  const studyMockup = path.join(BRAIN_UPLOAD, 'media_1789945260055.jpg')

  // Center Math slide with quadratic formula & graph
  await sharp(studyMockup)
    .extract({ left: 34, top: 90, width: 725, height: 320 })
    .resize(1450, 640, { fit: 'contain', background: '#0a0f1d' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'classroom/study_slide_math.webp'))

  // 5 Participant webcam tiles
  const participantSpecs = [
    { name: 'user_teacher.webp', left: 35, top: 425, width: 118, height: 70 },
    { name: 'user_student_minh.webp', left: 160, top: 425, width: 108, height: 70 },
    { name: 'user_student_thao.webp', left: 275, top: 425, width: 108, height: 70 },
    { name: 'user_student_long.webp', left: 390, top: 425, width: 108, height: 70 },
    { name: 'user_student_anh.webp', left: 505, top: 425, width: 108, height: 70 },
  ]

  for (const p of participantSpecs) {
    await sharp(studyMockup)
      .extract({ left: p.left, top: p.top, width: p.width, height: p.height })
      .resize(236, 140, { fit: 'cover' })
      .webp({ quality: 95 })
      .toFile(path.join(OUT_DIR, 'classroom', p.name))
  }

  console.log('✓ Classroom slide and participant webcam tiles extracted.')

  // ──────────────────────────────────────────────────────────────────────────
  // 7. ADMIN
  // ──────────────────────────────────────────────────────────────────────────
  const adminMockup = path.join(BRAIN_UPLOAD, 'media_1789945297674.jpg')

  // Admin Hero background
  await sharp(adminMockup)
    .extract({ left: 450, top: 52, width: 540, height: 135 })
    .resize(1080, 270, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'admin/admin_hero.webp'))

  // Admin left sidebar poster "Better Students Brighter Tomorrow"
  await sharp(adminMockup)
    .extract({ left: 9, top: 358, width: 114, height: 160 })
    .resize(228, 320, { fit: 'cover' })
    .webp({ quality: 95 })
    .toFile(path.join(OUT_DIR, 'admin/admin_poster.webp'))

  console.log('✓ Admin assets extracted.')

  console.log('\n>>> ALL ART ASSETS SUCCESSFULLY EXTRACTED & OPTIMIZED TO WEBP! <<<')
}

run().catch((err) => {
  console.error('Extraction failed:', err)
  process.exit(1)
})
