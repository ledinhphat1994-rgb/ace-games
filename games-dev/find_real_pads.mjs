import sharp from 'sharp';

async function mapPads() {
  // Let's create an annotated version of island_map.jpg with a 100px and 20px grid
  // so we can read the EXACT pixel coordinates (x, y) of each pad directly!
  const width = 768;
  const height = 1376;

  let svgLines = [];
  // Vertical grid every 50px
  for (let x = 0; x <= width; x += 50) {
    const isMajor = (x % 100 === 0);
    svgLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${isMajor ? 'rgba(255,255,0,0.6)' : 'rgba(255,255,255,0.2)'}" stroke-width="${isMajor ? 1.5 : 0.8}"/>`);
    for (let y = 50; y < height; y += 150) {
      if (isMajor) {
        svgLines.push(`<text x="${x + 2}" y="${y}" fill="yellow" font-size="10" font-family="monospace">${x}</text>`);
      }
    }
  }

  // Horizontal grid every 50px
  for (let y = 0; y <= height; y += 50) {
    const isMajor = (y % 100 === 0);
    svgLines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${isMajor ? 'rgba(255,255,0,0.6)' : 'rgba(255,255,255,0.2)'}" stroke-width="${isMajor ? 1.5 : 0.8}"/>`);
    for (let x = 50; x < width; x += 150) {
      if (isMajor) {
        svgLines.push(`<text x="${x}" y="${y - 2}" fill="yellow" font-size="10" font-family="monospace">${y}</text>`);
      }
    }
  }

  const svg = Buffer.from(`<svg width="${width}" height="${height}">${svgLines.join('\n')}</svg>`);

  await sharp('games-dev/godot-project/assets/textures/island_map.jpg')
    .composite([{ input: svg }])
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/map_with_grid.jpg');

  console.log('Saved map_with_grid.jpg');
}

mapPads().catch(console.error);
