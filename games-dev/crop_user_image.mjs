import sharp from 'sharp';

async function cropUserScreenshot() {
  const userImg = 'C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.user_uploaded/media_1791710752159.png';

  // The image is vertical phone resolution. Let's inspect its width and height:
  const meta = await sharp(userImg).metadata();
  console.log('User image size:', meta.width, meta.height);

  // Let's crop:
  // 1. Blue tower at Pad 6
  // 2. Green tower at Pad 3
  // 3. Mech monster
  // In a ~500 x 1000 or similar image:
  await sharp(userImg)
    .extract({
      left: Math.round(meta.width * 0.55),
      top: Math.round(meta.height * 0.35),
      width: Math.round(meta.width * 0.30),
      height: Math.round(meta.height * 0.20)
    })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/user_crop_blue_tower.png');

  await sharp(userImg)
    .extract({
      left: Math.round(meta.width * 0.50),
      top: Math.round(meta.height * 0.20),
      width: Math.round(meta.width * 0.35),
      height: Math.round(meta.height * 0.18)
    })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/user_crop_mech.png');

  console.log('Saved user_crop_blue_tower.png and user_crop_mech.png');
}

cropUserScreenshot().catch(console.error);
