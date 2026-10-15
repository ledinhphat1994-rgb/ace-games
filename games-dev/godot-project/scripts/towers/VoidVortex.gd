class_name VoidVortex
extends Node2D

## VoidVortex: Vòng xoáy năng lượng Hư Không (AoE Vortex)
## Triệu hồi bởi Tháp Ma Pháp Hư Không. Giam hãm quái vật, làm chậm 60% và rút máu liên tục trong 2 giây.

@export var radius: float = 80.0
@export var duration: float = 2.0
@export var dps: float = 24.0 # Sát thương mỗi giây
@export var slow_factor: float = 0.40 # Giảm tốc độ còn 40%

var _lifetime: float = 0.0
var _spin_angle: float = 0.0
var _enemies_inside: Array[Node2D] = []

@onready var area: Area2D = $Area2D
@onready var shape: CollisionShape2D = $Area2D/CollisionShape2D

func _ready() -> void:
	if area:
		area.collision_layer = 0
		area.collision_mask = 2 # Lớp kẻ địch
		area.body_entered.connect(_on_body_entered)
		area.body_exited.connect(_on_body_exited)

	if shape and shape.shape is CircleShape2D:
		shape.shape.radius = radius

	queue_redraw()

func _physics_process(delta: float) -> void:
	_lifetime += delta
	_spin_angle += delta * 6.0
	if _spin_angle > TAU:
		_spin_angle -= TAU

	# Rút máu liên tục (DoT) và làm chậm quái trong vòng xoáy
	for body in _enemies_inside:
		if is_instance_valid(body) and not body.is_queued_for_deletion():
			if body.has_method("take_damage"):
				body.take_damage(dps * delta)
			if body.has_method("apply_slow"):
				body.apply_slow(slow_factor, 0.2)

	queue_redraw()

	if _lifetime >= duration:
		queue_free()

func _on_body_entered(body: Node2D) -> void:
	if not _enemies_inside.has(body):
		_enemies_inside.append(body)

func _on_body_exited(body: Node2D) -> void:
	_enemies_inside.erase(body)

func _draw() -> void:
	var progress = _lifetime / duration
	var alpha = (1.0 - progress * 0.7) * 0.85
	var vortex_col = Color(0.85, 0.1, 1.0, alpha)

	# 1. Vẽ nền vòng xoáy năng lượng mờ
	draw_circle(Vector2.ZERO, radius, Color(0.4, 0.02, 0.5, alpha * 0.35))

	# 2. Vẽ 3 vòng cung xoáy năng lượng quay tròn
	for k in range(3):
		var base_rot = _spin_angle + (float(k) / 3.0) * TAU
		var arc_pts: PackedVector2Array = []
		for i in range(16):
			var t = float(i) / 16.0
			var r = lerpf(radius * 0.2, radius, t)
			var a = base_rot + t * 2.5
			arc_pts.append(Vector2(cos(a), sin(a)) * r)
		draw_polyline(arc_pts, vortex_col, 2.5)

	# 3. Lõi hắc ám ở tâm
	draw_circle(Vector2.ZERO, 10.0 + sin(_spin_angle * 2.0) * 2.5, Color(0.1, 0.0, 0.18, 0.95))
	draw_circle(Vector2.ZERO, 5.0, Color(1.0, 0.6, 1.0, alpha))
