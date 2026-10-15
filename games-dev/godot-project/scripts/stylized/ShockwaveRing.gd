class_name ShockwaveRing
extends Node2D

## ShockwaveRing: Vòng sóng xung kích tỏa tròn khi quả cầu Plasma phát nổ diện rộng

var max_radius: float = 80.0
var current_radius: float = 4.0
var wave_color: Color = Color(0.2, 0.95, 1.0, 0.85)
var duration: float = 0.32
var _time: float = 0.0

func trigger(radius: float, col: Color) -> void:
	max_radius = radius
	wave_color = col
	current_radius = 6.0
	_time = 0.0

func _process(delta: float) -> void:
	_time += delta
	if _time >= duration:
		queue_free()
		return

	var t = _time / duration
	current_radius = lerpf(6.0, max_radius, ease(t, 0.35))
	queue_redraw()

func _draw() -> void:
	var alpha = clampf(1.0 - (_time / duration), 0.0, 1.0)
	var col = Color(wave_color.r, wave_color.g, wave_color.b, wave_color.a * alpha)
	var width = clampf((1.0 - (_time / duration)) * 4.5, 1.0, 4.5)
	draw_arc(Vector2.ZERO, current_radius, 0, TAU, 36, col, width)
