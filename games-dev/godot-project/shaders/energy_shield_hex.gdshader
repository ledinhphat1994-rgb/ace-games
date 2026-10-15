shader_type canvas_item;

// Hexagonal Energy Forcefield Shield Shader (Godot 4)
// Hiệu ứng màng chắn năng lượng tổ ong Sci-Fi bảo vệ căn cứ và tháp phòng thủ.

uniform vec4 shield_color : source_color = vec4(0.15, 0.85, 1.0, 0.7);
uniform vec4 impact_color : source_color = vec4(1.0, 0.4, 0.2, 0.9);
uniform float hex_scale : hint_range(5.0, 50.0) = 22.0;
uniform float line_thickness : hint_range(0.01, 0.15) = 0.05;
uniform float pulse_speed : hint_range(0.5, 8.0) = 2.5;
uniform float hit_intensity : hint_range(0.0, 1.0) = 0.0;

// Hàm tính tọa độ ô lục giác đều (Hexagonal Grid UV)
vec4 hex_coords(vec2 uv) {
	vec2 r = vec2(1.0, 1.7320508);
	vec2 h = r * 0.5;
	vec2 a = mod(uv, r) - h;
	vec2 b = mod(uv - h, r) - h;
	vec2 gv = dot(a, a) < dot(b, b) ? a : b;
	float x = abs(gv.x);
	float y = abs(gv.y);
	float d = max(x * 1.5 + y * 0.866025, y * 1.7320508);
	return vec4(gv.x, gv.y, d, 0.0);
}

void fragment() {
	vec2 uv = UV - vec2(0.5);
	float dist_from_center = length(uv) * 2.0;

	// Khối khiên hình tròn mờ dần về phía tâm
	float edge_fade = smoothstep(1.0, 0.6, dist_from_center) * smoothstep(0.0, 0.2, dist_from_center);

	// Lưới lục giác
	vec4 hex = hex_coords(uv * hex_scale);
	float hex_edge = smoothstep(0.85 - line_thickness, 0.85, hex.z);

	// Sóng năng lượng quét tuần hoàn từ trong ra ngoài
	float wave = sin(dist_from_center * 10.0 - TIME * pulse_speed) * 0.5 + 0.5;

	// Trộn màu cơ bản và màu va đập
	vec4 col = mix(shield_color, impact_color, hit_intensity);
	float alpha = (hex_edge * 0.75 + wave * 0.25 + hit_intensity * 0.4) * edge_fade;

	COLOR = vec4(col.rgb, alpha * col.a);
}
