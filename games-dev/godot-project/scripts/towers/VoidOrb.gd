class_name VoidOrb
extends Node2D

## VoidOrb: Quả cầu ma pháp Hư Không
## Bay tới vị trí mục tiêu và phát nổ thành Vòng xoáy Hư Không (VoidVortex).

const VortexScene = preload("../../scenes/towers/VoidVortex.tscn")

@export var speed: float = 520.0
@export var orb_color: Color = Color(0.85, 0.1, 1.0, 1.0)
@export var vortex_radius: float = 80.0

var target_position: Vector2 = Vector2.ZERO
var target_node: Node2D = null
var _pulse: float = 0.0

func _physics_process(delta: float) -> void:
	_pulse += delta * 12.0
	if _pulse > TAU:
		_pulse -= TAU

	# Nếu mục tiêu còn sống, cập nhật tọa độ đích
	if is_instance_valid(target_node):
		target_position = target_node.global_position

	var dir = (target_position - global_position)
	var dist = dir.length()
	var step = speed * delta

	if dist <= step or dist < 24.0:
		_detonate()
		return

	global_position += dir.normalized() * step
	queue_redraw()

func _detonate() -> void:
	if VortexScene:
		var vortex = VortexScene.instantiate()
		if vortex:
			vortex.radius = vortex_radius
			vortex.global_position = global_position
			get_tree().current_scene.add_child(vortex)
	queue_free()

func _draw() -> void:
	var r = 12.0 + sin(_pulse) * 2.5
	# Vầng hào quang tím
	draw_circle(Vector2.ZERO, r + 8.0, Color(orb_color.r, orb_color.g, orb_color.b, 0.30))
	draw_circle(Vector2.ZERO, r + 4.0, Color(orb_color.r, orb_color.g, orb_color.b, 0.60))
	# Thân quả cầu
	draw_circle(Vector2.ZERO, r, orb_color)
	# Lõi sáng trắng
	draw_circle(Vector2.ZERO, 5.0, Color.WHITE)
