import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const mockupsDir = path.resolve('public/assets/design_mockups');
const outDir = path.resolve('public/assets/cyber_mockups');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function processMockups() {
  const tasks = [
    { src: 'home-banner.png', out: 'home_hero_bg.webp' },
    { src: 'learning-banner.png', out: 'learning_hero_bg.webp' },
    { src: 'game-banner.png', out: 'game_hero_bg.webp' },
    { src: 'community-banner.png', out: 'community_hero_bg.webp' },
    { src: 'leaderboard-banner.png', out: 'leaderboard_hero_bg.webp' },
    { src: 'classroom-banner.png', out: 'classroom_hero_bg.webp' },
    { src: 'chess-match.png', out: 'chess_hero_bg.webp' },
  ];

  for (const t of tasks) {
    const srcPath = path.join(mockupsDir, t.src);
    const outPath = path.join(outDir, t.out);
    if (fs.existsSync(srcPath)) {
      console.log(`Converting ${t.src} -> ${t.out}...`);
      await sharp(srcPath)
        .webp({ quality: 85 })
        .toFile(outPath);
      const stat = fs.statSync(outPath);
      console.log(`  Done: ${(stat.size / 1024).toFixed(1)} KB`);
    } else {
      console.warn(`File not found: ${srcPath}`);
    }
  }

  // Also extract hero art portions
  try {
    const homeSrc = path.join(mockupsDir, 'home-banner.png');
    const metadata = await sharp(homeSrc).metadata();
    console.log('Home image dimensions:', metadata.width, 'x', metadata.height);
    if (metadata.width && metadata.height) {
      // Top hero banner portion
      const cropW = Math.round(metadata.width * 0.62);
      const cropH = Math.round(metadata.height * 0.35);
      const cropX = Math.round(metadata.width * 0.145);
      const cropY = Math.round(metadata.height * 0.088);

      await sharp(homeSrc)
        .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
        .webp({ quality: 88 })
        .toFile(path.join(outDir, 'home_hero_banner.webp'));
      console.log('  Extracted home_hero_banner.webp');
    }
  } catch (err) {
    console.error('Error cropping hero:', err);
  }
}

processMockups()
  .then(() => console.log('ALL MOCKUPS PROCESSED SUCCESSFULLY'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
