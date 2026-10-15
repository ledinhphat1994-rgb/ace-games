const sharp = require('sharp');

// Let's check Gatling:
// Pivot at (200, 250) vs (200, 140)?
// In grid_gatling.png:
// Notice the turret body:
// The barrel is horizontal at y = 135 from x = 200 to x = 430.
// Is the barrel axis at y = 135?
// Delta Y = 0, Delta X = 230 => angle is 0 rad!
// But where is the pivot of rotation?
// The turret base mount is at (200, 250).
// If it rotates around (200, 250), then when rotated by angle theta:
// The barrel will be offset from (200, 250).
// BUT if the pivot of rotation is at the center of the turret (around x = 200, y = 135 or gear mount),
// let's check where the base connects to the turret!

console.log('Check pivots');
