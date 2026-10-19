shader_type canvas_item;

// 2026 AAA Quantum Shield Precision Reactor Core Shader
// Designed for compact high-tech reactor gauge tracks with segmented cell notches

uniform float health_ratio : hint_range(0.0, 1.0) = 1.0;
uniform vec4 plasma_color_high : source_color = vec4(0.0, 0.95, 0.75, 1.0);  // Emerald-Cyan Shield
uniform vec4 plasma_color_mid : source_color = vec4(1.0, 0.70, 0.15, 1.0);   // Amber Warning Pulse
uniform vec4 plasma_color_low : source_color = vec4(1.0, 0.15, 0.25, 1.0);   // Crimson Critical Core
uniform float wave_speed : hint_range(0.5, 8.0) = 2.4;
uniform float wave_frequency : hint_range(2.0, 30.0) = 12.0;
uniform float total_segments : hint_range(5.0, 30.0) = 20.0;

void fragment() {
    vec2 uv = UV;

    // Low Health Warning Glitch Strobe
    float is_critical = step(health_ratio, 0.25);
    float glitch_pulse = sin(TIME * 8.0) * 0.5 + 0.5;
    if (is_critical > 0.5) {
        float glitch_offset = sin(TIME * 24.0 + uv.y * 30.0) * 0.015 * glitch_pulse;
        uv.x += glitch_offset;
    }

    // Choose dynamic plasma color based on health ratio
    vec4 current_plasma_color;
    if (health_ratio > 0.5) {
        float t = (health_ratio - 0.5) * 2.0;
        current_plasma_color = mix(plasma_color_mid, plasma_color_high, t);
    } else {
        float t = health_ratio * 2.0;
        current_plasma_color = mix(plasma_color_low, plasma_color_mid, t);
    }
    if (is_critical > 0.5) {
        current_plasma_color = mix(current_plasma_color, vec4(1.0, 0.08, 0.18, 1.0), glitch_pulse * 0.7);
    }

    // Cylindrical Tube Shading (vertical optical curvature)
    float cyl_norm = abs(uv.y - 0.5) * 2.0;
    float cyl_highlight = 1.0 - smoothstep(0.0, 0.70, cyl_norm);
    float glass_top_gloss = smoothstep(0.10, 0.0, abs(uv.y - 0.20)) * 0.40;

    // Double Electromagnetic Plasma Wave
    float w1 = sin(uv.x * wave_frequency - TIME * wave_speed) * 0.035;
    float w2 = cos(uv.x * (wave_frequency * 1.6) + TIME * (wave_speed * 1.2)) * 0.025;
    float wave_offset = w1 + w2;

    // Plasma fill threshold
    float fill_edge = health_ratio + wave_offset * min(health_ratio, 1.0 - health_ratio * 0.2);
    float is_filled = step(uv.x, fill_edge);

    // Crest lighting (bright energy ridge at fluid boundary)
    float crest = smoothstep(0.025, 0.0, abs(uv.x - fill_edge)) * is_filled;

    // 20 Segmented reactor cell notches (Vạch chia 20 ô rõ nét)
    float cell_frac = fract(uv.x * total_segments);
    float is_divider = step(0.86, cell_frac) + step(cell_frac, 0.14);

    // Base trench background (Recessed dark carbon chamber)
    vec3 empty_chamber = vec3(0.03, 0.04, 0.07);
    empty_chamber += vec3(0.0, 0.08, 0.14) * (1.0 - is_divider) * 0.20 * cyl_highlight;

    // Controlled inner plasma fluid luminescence
    vec3 plasma_glow = current_plasma_color.rgb * (0.65 + cyl_highlight * 0.35);
    plasma_glow += vec3(0.9, 1.0, 1.0) * crest * 0.9;

    // Combine empty chamber and filled plasma
    vec3 final_rgb = mix(empty_chamber, plasma_glow, is_filled);

    // Deep titanium cell divider cuts
    final_rgb = mix(final_rgb, vec3(0.015, 0.02, 0.04), is_divider * 0.85);

    // Glass surface reflection & top specular streak
    final_rgb += vec3(0.75, 0.95, 1.0) * glass_top_gloss;

    COLOR = vec4(final_rgb, 1.0);
}
