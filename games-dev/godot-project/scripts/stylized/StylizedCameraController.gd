class_name StylizedCameraController
extends Camera2D

## StylizedCameraController: Điều khiển Camera 2.5D Đa Tầm Nhìn & Cận Cảnh Siêu Nét
## Hỗ trợ:
## 1. Mode 0: TACTICAL (Cận cảnh 1.42x - Tập trung chiến trường chính, chi tiết to rõ cực nét)
## 2. Mode 1: OVERVIEW (Toàn cảnh 1.0x - Bao quát trọn vẹn hòn đảo bay)
## 3. Mode 2: ACTION_FOCUS (Theo dõi 1.75x - Bám đuổi theo quái vật đi đầu)
## 4. Kéo rê tự do (Pan) & Phóng to thu nhỏ (Zoom) bằng cử chỉ chuột / cảm ứng

enum CameraMode {
	TACTICAL = 0,
	OVERVIEW = 1,
	ACTION_FOCUS = 2
}

var current_mode: CameraMode = CameraMode.TACTICAL

# Tọa độ và Zoom mục tiêu (Căn chỉnh chuẩn theo Chiến trường Đại lục 1376x768)
var target_pos: Vector2 = Vector2(688.0, 420.0)
var target_zoom: Vector2 = Vector2(1.25, 1.25)

# Mục tiêu bám theo (trong chế độ ACTION_FOCUS)
var follow_target: Node2D = null

# Giới hạn khung hình
var pan_limit_min: Vector2 = Vector2(250.0, 180.0)
var pan_limit_max: Vector2 = Vector2(1150.0, 580.0)

# Trạng thái kéo rê chuột
var _is_dragging: bool = false
var _drag_start_mouse: Vector2 = Vector2.ZERO
var _drag_start_pos: Vector2 = Vector2.ZERO

signal camera_mode_changed(mode_name: String)

func _ready() -> void:
	enabled = true
	make_current()
	position = target_pos
	zoom = target_zoom
	_apply_mode(CameraMode.TACTICAL, true)

func _process(delta: float) -> void:
	# Chế độ bám theo quái vật
	if current_mode == CameraMode.ACTION_FOCUS:
		if is_instance_valid(follow_target) and not follow_target.is_queued_for_deletion():
			target_pos = follow_target.global_position
		else:
			# Tìm quái vật đi đầu khác
			var enemies = get_tree().get_nodes_in_group("animated_enemies")
			if not enemies.is_empty():
				follow_target = enemies[0]
				target_pos = follow_target.global_position
			else:
				target_pos = Vector2(688.0, 420.0)

	# LERP mượt mà vị trí và zoom của Camera
	position = position.lerp(target_pos, delta * 7.5)
	zoom = zoom.lerp(target_zoom, delta * 7.5)

func _unhandled_input(event: InputEvent) -> void:
	# Kéo rê bằng chuột phải hoặc giữ chuột giữa hoặc kéo rê khi chạm
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_RIGHT or event.button_index == MOUSE_BUTTON_MIDDLE:
			if event.is_pressed():
				_is_dragging = true
				_drag_start_mouse = event.position
				_drag_start_pos = target_pos
			else:
				_is_dragging = false
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP:
			# Phóng to
			var new_z = clampf(target_zoom.x + 0.12, 0.85, 2.2)
			target_zoom = Vector2(new_z, new_z)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			# Thu nhỏ
			var new_z = clampf(target_zoom.x - 0.12, 0.85, 2.2)
			target_zoom = Vector2(new_z, new_z)

	elif event is InputEventMouseMotion and _is_dragging:
		var diff = (event.position - _drag_start_mouse) / zoom.x
		target_pos = _drag_start_pos - diff
		target_pos.x = clampf(target_pos.x, pan_limit_min.x, pan_limit_max.x)
		target_pos.y = clampf(target_pos.y, pan_limit_min.y, pan_limit_max.y)

## Chuyển đổi lần lượt giữa các góc nhìn
func cycle_camera_mode() -> String:
	match current_mode:
		CameraMode.TACTICAL:
			_apply_mode(CameraMode.OVERVIEW, false)
		CameraMode.OVERVIEW:
			_apply_mode(CameraMode.ACTION_FOCUS, false)
		CameraMode.ACTION_FOCUS:
			_apply_mode(CameraMode.TACTICAL, false)
	return get_mode_display_name()

func set_mode(mode: CameraMode) -> void:
	_apply_mode(mode, false)

func get_mode_display_name() -> String:
	match current_mode:
		CameraMode.TACTICAL:
			return "CẬN CẢNH (CHIẾN THUẬT)"
		CameraMode.OVERVIEW:
			return "TOÀN CẢNH (ĐẢO BAY)"
		CameraMode.ACTION_FOCUS:
			return "THEO DÕI QUÁI"
	return "CAMERA"

func _apply_mode(mode: CameraMode, instant: bool) -> void:
	current_mode = mode
	match current_mode:
		CameraMode.TACTICAL:
			target_pos = Vector2(688.0, 420.0)
			target_zoom = Vector2(1.25, 1.25)
		CameraMode.OVERVIEW:
			target_pos = Vector2(688.0, 384.0)
			target_zoom = Vector2(1.0, 1.0)
		CameraMode.ACTION_FOCUS:
			target_zoom = Vector2(1.40, 1.40)
			var enemies = get_tree().get_nodes_in_group("animated_enemies")
			if not enemies.is_empty():
				follow_target = enemies[0]
				target_pos = follow_target.global_position
			else:
				target_pos = Vector2(688.0, 420.0)

	if instant:
		position = target_pos
		zoom = target_zoom

	camera_mode_changed.emit(get_mode_display_name())
