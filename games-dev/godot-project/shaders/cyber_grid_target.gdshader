shader_type canvas_item;

// Sci-Fi Tactical Reticle & Cyber Radar Grid Matrix Shader
// Features rotating concentric rings, radar sweep beam, digital crosshairs, and pulsing tactical ticks

uniform vec4 reticle_color : source_color = vec4(0.0, 0.95, 1.0, 1.0);
uniform vec4 sweep_color : source_color = vec4(0.3, 1.0, 0.8, 0.6);
uniform float rotation_speed : hint_range(-5.0, 5.0) = 1.5;
uniform float sweep_speed : hint_range(0.5, 10.0) = 2.4;
uniform float pulse_speed : hint_range(0.5, 10.0) = 3.0;
uniform float range_radius : hint_range(0.1, 0.5) = 0.46;
uniform float line_thickness : hint_range(0.001, 0.03) = 0.006;

void fragment() {
    vec2 p = UV - vec2(0.5);
    float dist = length(p);
    float angle = atan(p.y, p.x); // -PI to PI

    // Discard outside circular boundary
    if (dist > 0.49) {
        discard;
    }

    vec3 col = vec3(0.0);
    float alpha = 0.0;

    // 1. Concentric Circles (Outer ring, Middle ring, Inner Core)
    float ring1 = smoothstep(line_thickness * 1.5, 0.0, abs(dist - range_radius));
    float ring2 = smoothstep(line_thickness * 1.2, 0.0, abs(dist - (range_radius * 0.72)));
    float ring3 = smoothstep(line_thickness * 1.0, 0.0, abs(dist - (range_radius * 0.38)));
    float center_dot = smoothstep(0.035, 0.0, dist);

    float rings = ring1 + ring2 + ring3 + center_dot;
    col += reticle_color.rgb * rings;
    alpha += rings * 0.85;

    // 2. Rotating Dash Ticks on Outer Ring
    float rot_angle = angle + (TIME * rotation_speed);
    float ticks = step(0.65, sin(rot_angle * 16.0)) * smoothstep(0.02, 0.0, abs(dist - range_radius));
    col += reticle_color.rgb * ticks * 1.5;
    alpha += ticks * 0.9;

    // 3. Counter-rotating inner segmented brackets
    float inner_rot = angle - (TIME * rotation_speed * 1.4);
    float brackets = step(0.8, cos(inner_rot * 4.0)) * smoothstep(0.02, 0.0, abs(dist - (range_radius * 0.72)));
    col += vec3(1.0) * brackets;
    alpha += brackets;

    // 4. Digital Crosshair Lines (4 Cardinal directions)
    float cross_h = smoothstep(line_thickness, 0.0, abs(p.y)) * step(dist, range_radius * 1.02);
    float cross_v = smoothstep(line_thickness, 0.0, abs(p.x)) * step(dist, range_radius * 1.02);
    float crosshairs = max(cross_h, cross_v);
    col += reticle_color.rgb * crosshairs * 0.7;
    alpha += crosshairs * 0.5;

    // 5. Radar Sweep Line / Beam
    float sweep_angle = mod(angle - (TIME * sweep_speed), 6.2831853);
    float sweep_beam = smoothstep(0.85, 0.0, sweep_angle) * step(dist, range_radius);
    col += sweep_color.rgb * sweep_beam * 0.8;
    alpha += sweep_beam * 0.35;

    // 6. Subtle Hexagonal / Grid Matrix Hologram Ground Fill
    vec2 hex_grid = fract(UV * 18.0) - vec2(0.5);
    float hex_dots = smoothstep(0.06, 0.0, length(hex_grid)) * step(dist, range_radius);
    col += reticle_color.rgb * hex_dots * 0.4;
    alpha += hex_dots * 0.25;

    // Global Breathing Pulse
    float pulse = sin(TIME * pulse_speed) * 0.15 + 0.85;
    col *= pulse;
    alpha *= pulse;

    COLOR = vec4(col, clamp(alpha, 0.0, 0.95));
}
