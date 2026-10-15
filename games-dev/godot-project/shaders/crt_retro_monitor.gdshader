shader_type canvas_item;

// CRT Monitor & Retro Scanline Shader (Godot 4)
// Hiệu ứng màn hình điện tử cổ điển với sọc quét, cong nhẹ góc và viền tối Vignette.

uniform sampler2D SCREEN_TEXTURE : hint_screen_texture, filter_linear_mipmap;
uniform float scanline_count : hint_range(50.0, 800.0) = 360.0;
uniform float scanline_intensity : hint_range(0.0, 1.0) = 0.22;
uniform float curvature : hint_range(0.0, 0.1) = 0.025;
uniform float vignette_intensity : hint_range(0.0, 1.0) = 0.35;

void fragment() {
	vec2 uv = SCREEN_UV;

	// Hiệu ứng cong lồi thấu kính màn hình CRT
	vec2 uv_offset = uv - vec2(0.5);
	uv = uv + uv_offset * dot(uv_offset, uv_offset) * curvature;

	// Cắt góc viền ngoài nếu vượt quá màn hình
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
		COLOR = vec4(0.0, 0.0, 0.0, 1.0);
		return;
	}

	vec4 col = texture(SCREEN_TEXTURE, uv);

	// Sọc quét ngang (Scanlines)
	float scanline = sin(uv.y * scanline_count * TAU) * 0.5 + 0.5;
	col.rgb -= scanline * scanline_intensity;

	// Viền tối bốn góc (Vignette)
	float dist_center = length(uv_offset);
	float vignette = smoothstep(0.7, 0.2, dist_center);
	col.rgb *= mix(1.0 - vignette_intensity, 1.0, vignette);

	COLOR = col;
}
