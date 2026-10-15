shader_type canvas_item;

// Holographic Neon Glow Pulse Shader (Godot 4)
// Tăng cường phát sáng viền và nhịp thở năng lượng (Energy Pulse) cho các đối tượng Sci-Fi.

uniform vec4 glow_color : source_color = vec4(0.0, 0.95, 1.0, 1.0);
uniform float pulse_speed : hint_range(0.5, 10.0) = 3.0;
uniform float min_glow : hint_range(0.2, 1.0) = 0.65;
uniform float max_glow : hint_range(1.0, 3.0) = 1.6;

void fragment() {
	vec4 base_color = texture(TEXTURE, UV);

	// Chu kỳ phát sáng nhấp nháy êm dịu (Breathing Sine Wave)
	float pulse = (sin(TIME * pulse_speed) * 0.5 + 0.5);
	float intensity = mix(min_glow, max_glow, pulse);

	vec3 boosted = base_color.rgb * glow_color.rgb * intensity;
	COLOR = vec4(boosted, base_color.a * glow_color.a);
}
