const sharp = require('sharp');

// Test rotation geometry for Gatling and Plasma
// Gatling:
// Base texture 440 x 280.
// Let pivot on texture be (Px, Py).
// Let barrel axis in local texture coordinates be from (Px, Py) along angle theta_0.
// In Gatling:
// From grid_gatling.png:
// Pivot on gear: Px = 200, Py = 250.
// Barrel muzzle: Mx = 430, My = 135.
// Notice that the barrel is raised 115px above the bottom gear pivot!
// If we rotate the entire head around (200, 250), then when aiming up or down, the head rotates naturally on its mount!

console.log('Testing geometry');
