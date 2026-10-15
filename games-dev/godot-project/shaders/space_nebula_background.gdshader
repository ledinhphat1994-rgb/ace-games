shader_type canvas_item;

// Procedural Deep Space Nebula & Starfield Shader (Godot 4)
// Sinh nền vũ trụ, bụi sao và mây tinh vân hoàn toàn bằng toán học (Zero-texture / Zero-allocation).

uniform vec4 deep_space_color : source_color = vec4(0.008, 0.03, 0.09, 1.0);
uniform vec4 nebula_cyan : source_color = vec4(0.05, 0.35, 0.65, 0.45);
uniform vec4 nebula_magenta : source_color = vec4(0.55, 0.12, 0.45, 0.35);
uniform float star_density : hint_range(50.0, 400.0) = 180.0;
uniform float animation_speed : hint_range(0.0, 0.2) = 0.02;

// Hàm sinh số ngẫu nhiên giả lập (Pseudo-random hash)
float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

// Hàm 2D Value Noise mượt mà
float noise2d(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);

	float a = hash21(i);
	float b = hash21(i + vec2(1.0, 0.0));
	float c = hash21(i + vec2(0.0, 1.0));
	float d = hash21(i + vec2(1.0, 1.0));

	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractional Brownian Motion (FBM) tạo mây tinh vân nhiều tầng
float fbm(vec2 p) {
	float total = 0.0;
	float amplitude = 0.5;
	for (int i = 0; i < 4; i++) {
		total += noise2d(p) * amplitude;
		p *= 2.08;
		amplitude *= 0.5;
	}
	return total;
}

void fragment() {
	vec2 uv = UV;
	float t = TIME * animation_speed;

	// 1. Tầng mây tinh vân thứ nhất (Nebula Cloud Layer 1)
	vec2 q = uv * 3.2 + vec2(t * 0.4, t * 0.15);
	float neb1 = fbm(q);

	// 2. Tầng mây tinh vân thứ hai (Nebula Cloud Layer 2)
	vec2 r = uv * 2.4 - vec2(t * 0.2, t * 0.35);
	float neb2 = fbm(r + neb1);

	// Trộn màu nền không gian sâu
	vec4 base = deep_space_color;
	base = mix(base, nebula_cyan, neb1 * 0.65);
	base = mix(base, nebula_magenta, neb2 * 0.55);

	// 3. Tầng bụi sao lấp lánh (Starfield Layer)
	vec2 star_grid = uv * star_density;
	vec2 star_id = floor(star_grid);
	float star_rnd = hash21(star_id);

	if (star_rnd > 0.955) {
		vec2 star_pos = fract(star_grid) - 0.5;
		float dist = length(star_pos);
		float twinkle = sin(TIME * 3.5 + star_rnd * 20.0) * 0.3 + 0.7;
		float star_glow = smoothstep(0.24, 0.02, dist) * twinkle;
		base += vec4(0.85, 0.95, 1.0, 1.0) * star_glow;
	}

	COLOR = base;
}
