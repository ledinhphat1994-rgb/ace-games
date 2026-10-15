import sharp from 'sharp';

async function createSplitSprites() {
  // 1. Gatling Gun: 500 x 480
  // Base: y from 280 to 475.
  // We can extract base from y=275 to 480.
  // Wait, in base, the turret sits above y=280.
  // If we extract base with a transparent top,
  // and turret with transparent bottom:

  // Let's create an alpha mask or polygon mask for Gatling base and turret:
  // Base polygon:
  // For Gatling base:
  // Turntable top is an ellipse at y ~ 280-320.
  // Let's create Gatling Base:
  // Everything below y=290 is base.
  // The mounting hinge brackets are at x: 230 to 300, y: 250 to 310.

  // Even simpler and cleaner:
  // We can create high quality base and turret images:

  // Gatling Base:
  // Mask: keep y >= 280.
  // Gatling Turret:
  // Mask: keep y <= 310.

  console.log('Generating split sprites with sharp...');

  // Let's inspect with a script
}
