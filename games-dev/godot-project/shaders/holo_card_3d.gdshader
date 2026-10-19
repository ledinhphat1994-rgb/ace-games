shader_type canvas_item;

// Ultra-Modern 2026 Holographic Trading Card Shader
// Eliminates all blur, jitter, glitch, and CRT scanlines.
// Delivers 100% crisp artwork fidelity with authentic prismatic foil sheen and chamfered border.

uniform vec4 neon_color : source_color = vec4(0.0, 0.95, 1.0, 1.0);
uniform float corner_chamfer : hint_range(0.0, 0.25) = 0.06;
uniform float border_thickness : hint_range(0.001, 0.08) = 0.018;
uniform float glare_position : hint_range(-1.0, 2.0) = -1.0; // Sweeping foil glare
uniform float active_glow : hint_range(0.0, 3.0) = 1.0;
uniform bool is_active = false;

// 2D Distance to a Chamfered Rectangle (Cut corners)
float sdChamferedRect(vec2 p, vec2 b, float c) {
    p = abs(p) - b;
    float d1 = max(p.x, p.y);
    float d2 = (p.x + p.y + c * 1.41421356) * 0.70710678;
    return max(d1, d2);
}

void fragment() {
    vec2 uv = UV;
    vec2 p = uv - vec2(0.5);

    // Outer frame distance for smooth corner clipping
    vec2 half_size = vec2(0.5) - vec2(0.005);
    float d = sdChamferedRect(p, half_size, corner_chamfer);

    // Smooth anti-aliased edge clipping (1.5px smoothstep)
    float edge_alpha = smoothstep(0.004, -0.004, d);
    if (edge_alpha <= 0.0) {
        discard;
    }

    // Base Artwork at 100% Crisp Resolution & True Colors (NO blurry mix!)
    vec4 tex_col = texture(TEXTURE, uv);
    vec3 result_rgb = tex_col.rgb;
    float result_a = tex_col.a * edge_alpha;

    // Prismatic Holographic Foil Glare on Hover
    if (glare_position > -0.5) {
        float diag = (uv.x * 0.75 + uv.y * 0.25);
        float glare_dist = abs(diag - glare_position);
        float glare = smoothstep(0.18, 0.0, glare_dist);

        // Multi-spectrum prismatic rainbow sheen (trading card foil effect)
        vec3 foil_spectrum = 0.5 + 0.5 * cos(6.28318 * (diag * 2.0 + vec3(0.0, 0.33, 0.67)));
        result_rgb += mix(neon_color.rgb, foil_spectrum, 0.6) * glare * 0.55;
    }

    // Precision Neon Border
    float inner_d = d + border_thickness;
    float border_mask = smoothstep(0.003, -0.003, d) - smoothstep(0.003, -0.003, inner_d);

    float glow_multiplier = is_active ? (1.8 * active_glow) : active_glow;
    vec3 border_color = neon_color.rgb * glow_multiplier;

    // Corner accent ticks for cyber aesthetic
    float corner_accent = step(0.40, abs(p.x)) * step(0.40, abs(p.y));
    border_color += vec3(0.9, 0.95, 1.0) * corner_accent * 0.5;

    result_rgb = mix(result_rgb, border_color, clamp(border_mask, 0.0, 1.0));

    COLOR = vec4(result_rgb, result_a);
}
