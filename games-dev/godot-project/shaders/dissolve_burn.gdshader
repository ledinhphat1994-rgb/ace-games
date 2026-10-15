shader_type canvas_item;

// Procedural Dissolve & Burn Border Shader (Godot 4)
// Hiệu ứng tan biến tro tàn và viền phát lửa dùng khi quái vật hoặc trụ phòng thủ bị hủy.

uniform float dissolve_amount : hint_range(0.0, 1.0) = 0.0;
uniform float burn_size : hint_range(0.0, 0.25) = 0.08;
uniform vec4 burn_color : source_color = vec4(1.0, 0.45, 0.1, 1.0);
uniform vec4 burn_core : source_color = vec4(1.0, 0.95, 0.4, 1.0);

// Hàm hash sinh noise mượt
float hash2(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = hash2(i);
	float b = hash2(i + vec2(1.0, 0.0));
	float c = hash2(i + vec2(0.0, 1.0));
	float d = hash2(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void fragment() {
	vec4 main_texture = texture(TEXTURE, UV);
	if (main_texture.a < 0.01) {
		discard;
	}

	// Tính mẫu noise procedural
	float n = noise(UV * 8.0);

	// Nếu giá trị noise nhỏ hơn ngưỡng tan biến -> loại bỏ pixel
	if (n < dissolve_amount) {
		discard;
	}

	// Hiệu ứng viền phát lửa cháy rực (Burn Edge)
	if (n < dissolve_amount + burn_size) {
		float burn_factor = (n - dissolve_amount) / burn_size;
		vec4 edge_col = mix(burn_core, burn_color, burn_factor);
		COLOR = vec4(edge_col.rgb * 1.5, main_texture.a);
	} else {
		COLOR = main_texture;
	}
}
