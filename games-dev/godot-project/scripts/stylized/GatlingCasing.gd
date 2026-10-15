class_name GatlingCasing
extends Node2D

## GatlingCasing: Vỏ đạn đồng văng ra từ súng máy Gatling theo video tham chiếu
## Văng từ buồng đạn sang hông, xoay tít trong không trung, nảy 2 nhịp trên mặt đất và phát ra tiếng leng keng kim loại

var velocity: Vector2 = Vector2.ZERO
var gravity: float = 520.0
var ground_y: float = 0.0
var _bounces: int = 0
var _max_bounces: int = 2
var _lifetime: float = 1.10
var _time: float = 0.0
var _rotation_speed: float = 20.0
var _has_hit_ground: bool = false
var _sound_played: bool = false

var sound_synth: SoundSynthesizer = null

func setup(start_pos: Vector2, shoot_dir: Vector2, pad_ground_y: float, synth: SoundSynthesizer = null) -> void:
	global_position = start_pos
	ground_y = pad_ground_y
	sound_synth = synth

	# Văng ngược hướng bắn sang hông và chếch lên trên (như trong video)
	var side_dir = -shoot_dir.x if abs(shoot_dir.x) > 0.05 else (1.0 if randf() > 0.5 else -1.0)
	velocity = Vector2(side_dir * randf_range(75.0, 135.0) + randf_range(-15.0, 15.0), -randf_range(120.0, 190.0))
	_rotation_speed = randf_range(-28.0, 28.0)

func _process(delta: float) -> void:
	_time += delta
	if _time >= _lifetime:
		queue_free()
		return

	if not _has_hit_ground:
		velocity.y += gravity * delta
		global_position += velocity * delta
		rotation += _rotation_speed * delta

		# Va chạm mặt đất / mặt đĩa đá
		if global_position.y >= ground_y:
			global_position.y = ground_y
			_bounces += 1

			if not _sound_played:
				_sound_played = true
				if sound_synth and is_instance_valid(sound_synth):
					sound_synth.play_casing_drop()

			if _bounces <= _max_bounces and abs(velocity.y) > 40.0:
				velocity.y = -velocity.y * 0.40
				velocity.x *= 0.60
				_rotation_speed *= 0.50
			else:
				_has_hit_ground = true
				velocity = Vector2.ZERO
				_rotation_speed = 0.0
	else:
		# Nằm yên trên mặt đất và mờ dần
		pass

	queue_redraw()

func _draw() -> void:
	var alpha = clampf(1.0 - (_time / _lifetime) * 0.9, 0.0, 1.0)

	# Vỏ đạn kim loại màu vàng đồng óng ánh
	var brass_col = Color(0.96, 0.80, 0.22, alpha)
	var dark_brass = Color(0.72, 0.54, 0.12, alpha)
	var shine_col = Color(1.0, 0.98, 0.75, alpha)

	# Đáy vỏ đạn (rim)
	draw_rect(Rect2(-3.2, -1.3, 1.2, 2.6), dark_brass)
	# Thân vỏ đạn (cylinder body)
	draw_rect(Rect2(-2.0, -1.1, 4.4, 2.2), brass_col)
	# Vệt sáng kim loại phản chiếu
	draw_rect(Rect2(-1.8, -0.6, 3.8, 0.8), shine_col)
