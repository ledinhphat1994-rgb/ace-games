class_name SciFiHoloReticle
extends Node2D

## SciFiHoloReticle: Vòng ngắm Radar Hologram chiến thuật quay trên mặt đất cho kỹ năng & phép thuật
## Áp dụng Shader cyber_grid_target.gdshader và tia laser dẫn đường từ quỹ đạo

var target_color: Color = Color(0.0, 0.95, 1.0, 1.0)
var radius: float = 140.0
var _shader_rect: ColorRect = null
var _mat: ShaderMaterial = null

func _ready() -> void:
	z_index = 5
	_shader_rect = ColorRect.new()
	_shader_rect.name = "ShaderRect"
	_shader_rect.size = Vector2(radius * 2.0, radius * 2.0)
	_shader_rect.position = -_shader_rect.size * 0.5
	_shader_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE

	_mat = ShaderMaterial.new()
	_mat.shader = preload("res://shaders/cyber_grid_target.gdshader")
	_mat.set_shader_parameter("reticle_color", target_color)
	_mat.set_shader_parameter("sweep_color", Color(target_color.r, target_color.g, target_color.b, 0.6))
	_shader_rect.material = _mat

	add_child(_shader_rect)

func set_reticle_color(col: Color) -> void:
	target_color = col
	if _mat:
		_mat.set_shader_parameter("reticle_color", col)
		_mat.set_shader_parameter("sweep_color", Color(col.r * 1.1, col.g * 1.1, col.b * 1.1, 0.65))
	queue_redraw()

func activate(duration: float = 1.2) -> void:
	visible = true
	var tw = create_tween()
	tw.tween_interval(duration)
	tw.tween_property(self, "modulate:a", 0.0, 0.3)
	tw.tween_callback(queue_free)

func _draw() -> void:
	# Tia Laser quỹ đạo (Orbital Laser Guide Line) từ đỉnh màn hình chiếu xuống tâm ngắm
	var top_sky_pos = Vector2(0.0, -global_position.y - 40.0)
	var laser_col = Color(target_color.r, target_color.g, target_color.b, 0.70)
	var core_laser = Color(1.0, 1.0, 1.0, 0.90)

	draw_line(top_sky_pos, Vector2.ZERO, laser_col, 2.5)
	draw_line(top_sky_pos, Vector2.ZERO, core_laser, 1.0)

	# Điểm chạm laser trung tâm
	draw_circle(Vector2.ZERO, 4.0, Color(1.0, 1.0, 1.0, 0.95))
	draw_circle(Vector2.ZERO, 8.0, Color(target_color.r, target_color.g, target_color.b, 0.40))
