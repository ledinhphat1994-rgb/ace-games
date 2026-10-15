import sharp from 'sharp';

async function testSplitTurret() {
  // Let's inspect splitting Gatling:
  // tower_gatling_gun.png: 500 x 480
  // Base is the bottom turntable ring and 4 legs: y from ~250 to 460
  // Head is the gun mechanism and rotating barrels: y from 30 to ~330

  // Or let's see how the sprite looks if we inspect it closely.
  // Actually, let's see what happens if we rotate the whole head with a proper pivot,
  // or if separating base and head gives a 10x better visual.
  console.log('Testing turret parts...');
}
testSplitTurret().catch(console.error);
