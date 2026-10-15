const sharp = require('sharp');

async function cleanBases() {
  // Let's inspect Gatling base (440 x 205)
  // The bottom base is below y = 60.
  // The top area above y = 60 has the gear remnants from y = 0 to 60.
  // Let's create a clean turntable on top of Gatling base!

  // Also for Plasma base (440 x 220)
  // The turntable is around y = 40 to 90.
  console.log('Inspecting bases...');
}
cleanBases();
