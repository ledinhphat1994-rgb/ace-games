const sharp = require('sharp');

// Test 4 angles for Gatling:
// Target at:
// 1. East (+X): aim_angle = 0
// 2. North-East (+X, -Y): aim_angle = -45 deg
// 3. North-West (-X, -Y): aim_angle = -135 deg
// 4. West (-X): aim_angle = 180 deg

console.log('Rendering angles');
