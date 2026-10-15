shader_type canvas_item;

// Shockwave Ripple Distortion Shader (Godot 4)
// Hiệu ứng sóng chấn động lan tỏa từ tâm khi bắn đạn xung lực hoặc bom nổ.

uniform sampler2D SCREEN_TEXTURE : hint_screen_texture, filter_linear_mipmap;
uniform vec2 center = vec2(0.5, 0.5);
uniform float force : hint_range(0.0, 0.2) = 0.05;
uniform float size : hint_range(0.0, 1.0) = 0.0;
uniform float thickness : hint_range(0.01, 0.2) = 0.06;

void fragment() {
	float ratio = SCREEN_PIXEL_SIZE.x / SCREEN_PIXEL_SIZE.y;
	vec2 scaled_uv = (SCREEN_UV - vec2(0.5, 0.0)) / vec2(ratio, 1.0) + vec2(0.5, 0.0);
	float mask = (1.0 - smoothstep(size - 0.1, size, length(scaled_uv - center))) *
	             smoothstep(size - thickness - 0.1, size - thickness, length(scaled_uv - center));

	vec2 disp = normalize(scaled_uv - center) * force * mask;
	COLOR = texture(SCREEN_TEXTURE, SCREEN_UV - disp);
}
