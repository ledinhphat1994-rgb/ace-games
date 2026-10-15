shader_type canvas_item;

// Black Hole Gravitational Lensing Shader (Godot 4)
// Mô phỏng hiệu ứng bẻ cong không-thời gian và quầng sáng Einstein Ring xung quanh Hố đen.

uniform sampler2D SCREEN_TEXTURE : hint_screen_texture, filter_linear_mipmap;
uniform float strength : hint_range(0.0, 1.0) = 0.45;
uniform float black_hole_radius : hint_range(0.0, 0.5) = 0.18;
uniform float distortion_radius : hint_range(0.1, 1.0) = 0.48;
uniform vec4 accretion_color : source_color = vec4(0.3, 0.85, 1.0, 1.0);
uniform float ring_thickness : hint_range(0.01, 0.15) = 0.04;

void fragment() {
	vec2 center = vec2(0.5, 0.5);
	vec2 to_center = UV - center;
	float dist = length(to_center);
	vec2 dir = normalize(to_center);

	// Vùng Chân trời sự kiện (Event Horizon - Tâm hố đen tối sẫm)
	if (dist < black_hole_radius) {
		COLOR = vec4(0.01, 0.02, 0.05, 0.95);
		return;
	}

	// Quầng sáng Einstein Ring quanh miệng hố đen
	float ring_dist = abs(dist - black_hole_radius);
	float ring_intensity = smoothstep(ring_thickness, 0.0, ring_dist);

	// Tính toán góc bẻ cong không gian (Lensing deflection)
	if (dist < distortion_radius) {
		float factor = (1.0 - (dist - black_hole_radius) / (distortion_radius - black_hole_radius));
		float deflection = pow(factor, 2.2) * strength;
		vec2 distorted_screen_uv = SCREEN_UV - dir * deflection;

		vec4 background = texture(SCREEN_TEXTURE, distorted_screen_uv);
		vec4 ring = accretion_color * ring_intensity * 1.6;

		COLOR = mix(background, ring, ring_intensity * 0.85);
	} else {
		COLOR = texture(SCREEN_TEXTURE, SCREEN_UV);
	}
}
