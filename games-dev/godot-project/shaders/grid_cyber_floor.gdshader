shader_type canvas_item;

// Infinite Synthwave Cyber Grid Floor Shader (Godot 4)
// Lưới không gian phối cảnh chạy lướt vô tận dưới chân sân đấu Sci-Fi.

uniform vec4 grid_color : source_color = vec4(0.0, 0.85, 1.0, 0.45);
uniform vec4 horizon_color : source_color = vec4(0.5, 0.1, 0.8, 0.25);
uniform float grid_speed : hint_range(0.0, 5.0) = 0.8;
uniform float line_density : hint_range(5.0, 40.0) = 16.0;

void fragment() {
	vec2 uv = UV;
	float depth = 1.0 / max(uv.y, 0.001);

	// Tính tọa độ phối cảnh xa gần
	vec2 grid_uv;
	grid_uv.x = (uv.x - 0.5) * depth;
	grid_uv.y = depth - TIME * grid_speed;

	vec2 grid = fract(grid_uv * line_density);
	float lines = step(0.92, grid.x) + step(0.92, grid.y);
	lines = clamp(lines, 0.0, 1.0);

	// Mờ dần về phía đường chân trời
	float fade = smoothstep(0.0, 0.6, uv.y);
	vec4 final_color = mix(grid_color, horizon_color, 1.0 - uv.y) * lines * fade;

	COLOR = final_color;
}
