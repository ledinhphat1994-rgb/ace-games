// In 2D with Godot:
// Global transform of a child sprite with position P, scale S, rotation R:
// If local point is V:
// V_transformed = Transform2D(R, P).scaled(S) * V
// Specifically:
// When Sprite2D has:
// scale = (s_x, s_y)
// rotation = rot
// The direction of the sprite's X-axis in parent space is:
// dir = Vector2(cos(rot) * s_x, sin(rot) * s_y)
// Wait! If s_x < 0 and s_y > 0:
// dir.x = cos(rot) * (-1)
// dir.y = sin(rot) * (+1)
// The angle of dir is:
// angle = atan2(sin(rot), -cos(rot)) = PI - rot!

function checkDir(rot, sx, sy, localArtAngle) {
  // A vector pointing along the art barrel (which is at local angle localArtAngle):
  const vx = Math.cos(localArtAngle);
  const vy = Math.sin(localArtAngle);
  // Transform by scale then rotation:
  // In Godot, Transform2D:
  // X axis = Vector2(cos(rot), sin(rot)) * scale.x
  // Y axis = Vector2(-sin(rot), cos(rot)) * scale.y
  const trans_x = vx * Math.cos(rot) * sx - vy * Math.sin(rot) * sy;
  const trans_y = vx * Math.sin(rot) * sx + vy * Math.cos(rot) * sy;
  const worldAngle = Math.atan2(trans_y, trans_x) * 180 / Math.PI;
  return { trans_x, trans_y, worldAngle };
}

console.log('Facing RIGHT (sx=1):');
console.log('rot=0, art=0 (Gatling):', checkDir(0, 1, 1, 0));
console.log('rot=0, art=24 deg (Plasma):', checkDir(0, 1, 1, 24 * Math.PI / 180));
console.log('rot=-24 deg, art=24 deg (Plasma):', checkDir(-24 * Math.PI / 180, 1, 1, 24 * Math.PI / 180));

console.log('\nFacing LEFT (sx=-1):');
console.log('rot=0, art=0 (Gatling):', checkDir(0, -1, 1, 0));
console.log('rot=0, art=24 deg (Plasma):', checkDir(0, -1, 1, 24 * Math.PI / 180));
console.log('rot=-24 deg, art=24 deg (Plasma):', checkDir(-24 * Math.PI / 180, -1, 1, 24 * Math.PI / 180));
console.log('rot=+24 deg, art=24 deg (Plasma):', checkDir(+24 * Math.PI / 180, -1, 1, 24 * Math.PI / 180));
