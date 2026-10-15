class_name CameraController3D
extends Node3D

## CameraController3D: Hệ thống điều khiển Camera 3D Đa Tầm Nhìn (Multi-Perspective Camera System)
## Hỗ trợ 3 chế độ quan sát linh hoạt:
## 1. TACTICAL VIEW: Góc nhìn Isometric 45 độ, cho phép xoay 360 độ quanh tâm map bằng chuột/cảm ứng, zoom in/out.
## 2. TURRET VIEW: Camera dịch chuyển mượt về ngay sau đỉnh tháp được chọn, nòng súng xoay theo góc ngắm.
## 3. TOP_DOWN VIEW: Góc nhìn thẳng 90 độ từ trên xuống để người chơi quan sát tổng thể và đặt tháp chuẩn xác.

enum CameraMode {
	TACTICAL = 0,
	TURRET = 1,
	TOP_DOWN = 2
}

@export var current_mode: CameraMode = CameraMode.TACTICAL

# Tham chiếu Camera3D bên trong
var camera: Camera3D = null

# Thiết lập cho TACTICAL VIEW
var pivot_yaw: float = deg_to_rad(-15.0)    # Góc xoay ngang hơi chéo để thấy toàn chiều dài đảo
var pivot_pitch: float = deg_to_rad(-45.0) # Góc nghiêng chuẩn Isometric 45 độ
var distance: float = 42.0                 # Khoảng cách tối ưu bao quát trọn vẹn đảo bay
var target_center: Vector3 = Vector3(0.0, 0.5, 0.0)

# Giới hạn góc và cự ly
const MIN_DISTANCE: float = 16.0
const MAX_DISTANCE: float = 55.0
const MIN_PITCH: float = deg_to_rad(-78.0)
const MAX_PITCH: float = deg_to_rad(-18.0)

# Thiết lập cho TURRET VIEW
var selected_tower: Node3D = null

# Biến theo dõi thao tác chuột/cảm ứng
var _is_dragging: bool = false
var _last_mouse_pos: Vector2 = Vector2.ZERO

# Tween chuyển đổi góc nhìn mượt mà
var _active_tween: Tween = null
var _is_transitioning: bool = false

signal camera_mode_changed(new_mode: int, mode_name: String)

func _ready() -> void:
	# Tự động tìm hoặc tạo Camera3D
	camera = get_node_or_null("Camera3D")
	if not camera:
		camera = Camera3D.new()
		camera.name = "Camera3D"
		camera.current = true
		camera.fov = 55.0
		camera.near = 0.5
		camera.far = 250.0
		add_child(camera)

	_apply_tactical_transform_instant()

func _process(delta: float) -> void:
	if _is_transitioning:
		return

	match current_mode:
		CameraMode.TACTICAL:
			_update_tactical_camera(delta)
		CameraMode.TURRET:
			_update_turret_camera(delta)
		CameraMode.TOP_DOWN:
			_update_top_down_camera(delta)

## Chuyển đổi luân phiên giữa các góc nhìn
func toggle_camera_mode() -> void:
	var next_mode = (int(current_mode) + 1) % 3
	set_camera_mode(next_mode)

## Đặt chế độ Camera với hiệu ứng Tween chuyển đổi mượt mà
func set_camera_mode(mode: int, target_tower_node: Node3D = null) -> void:
	current_mode = mode as CameraMode
	if target_tower_node:
		selected_tower = target_tower_node

	var target_pos: Vector3 = Vector3.ZERO
	var target_rot: Vector3 = Vector3.ZERO
	var mode_name: String = ""

	match current_mode:
		CameraMode.TACTICAL:
			mode_name = "CHIẾN THUẬT (3D ISO)"
			var offset = Vector3(
				sin(pivot_yaw) * cos(pivot_pitch) * distance,
				-sin(pivot_pitch) * distance,
				cos(pivot_yaw) * cos(pivot_pitch) * distance
			)
			target_pos = target_center + offset
			var temp_basis = Basis.looking_at(target_center - target_pos, Vector3.UP)
			target_rot = temp_basis.get_euler()

		CameraMode.TURRET:
			mode_name = "GÓC NHÌN THÁP (TURRET TPS)"
			if is_instance_valid(selected_tower):
				var t_pos = selected_tower.global_position
				var t_rot_y = selected_tower.rotation.y
				# Đặt camera phía sau và hơi cao hơn đỉnh tháp một chút
				var back_dir = -Vector3.FORWARD.rotated(Vector3.UP, t_rot_y)
				target_pos = t_pos + back_dir * 4.5 + Vector3(0.0, 3.2, 0.0)
				var look_target = t_pos + Vector3.FORWARD.rotated(Vector3.UP, t_rot_y) * 12.0 + Vector3(0.0, 1.5, 0.0)
				var temp_basis = Basis.looking_at(look_target - target_pos, Vector3.UP)
				target_rot = temp_basis.get_euler()
			else:
				# Nếu chưa có tháp được chọn, quay lại Tactical
				current_mode = CameraMode.TACTICAL
				set_camera_mode(CameraMode.TACTICAL)
				return

		CameraMode.TOP_DOWN:
			mode_name = "NHÌN THẲNG LƯỚI (TOP-DOWN 90°)"
			target_pos = target_center + Vector3(0.0, distance * 1.15, 0.0)
			target_rot = Vector3(deg_to_rad(-89.9), 0.0, 0.0)

	_animate_camera_to(target_pos, target_rot)
	emit_signal("camera_mode_changed", current_mode, mode_name)

## Tween chuyển động mượt mà vị trí và góc quay camera
func _animate_camera_to(target_pos: Vector3, target_rot: Vector3) -> void:
	if not camera:
		return

	if _active_tween and _active_tween.is_valid():
		_active_tween.kill()

	_is_transitioning = true
	_active_tween = create_tween().set_parallel(true).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	_active_tween.tween_property(camera, "global_position", target_pos, 0.65)
	_active_tween.tween_property(camera, "rotation", target_rot, 0.65)
	_active_tween.chain().tween_callback(func(): _is_transitioning = false)

func _apply_tactical_transform_instant() -> void:
	if not camera:
		return
	var offset = Vector3(
		sin(pivot_yaw) * cos(pivot_pitch) * distance,
		-sin(pivot_pitch) * distance,
		cos(pivot_yaw) * cos(pivot_pitch) * distance
	)
	camera.global_position = target_center + offset
	camera.look_at(target_center, Vector3.UP)

func _update_tactical_camera(delta: float) -> void:
	if not camera:
		return
	var target_pos = target_center + Vector3(
		sin(pivot_yaw) * cos(pivot_pitch) * distance,
		-sin(pivot_pitch) * distance,
		cos(pivot_yaw) * cos(pivot_pitch) * distance
	)
	camera.global_position = camera.global_position.lerp(target_pos, delta * 14.0)
	camera.look_at(target_center, Vector3.UP)

func _update_turret_camera(delta: float) -> void:
	if not camera or not is_instance_valid(selected_tower):
		current_mode = CameraMode.TACTICAL
		return

	var t_pos = selected_tower.global_position
	var t_rot_y = selected_tower.rotation.y
	var back_dir = -Vector3.FORWARD.rotated(Vector3.UP, t_rot_y)
	var target_pos = t_pos + back_dir * 4.2 + Vector3(0.0, 2.8, 0.0)
	var look_target = t_pos + Vector3.FORWARD.rotated(Vector3.UP, t_rot_y) * 14.0 + Vector3(0.0, 1.2, 0.0)

	camera.global_position = camera.global_position.lerp(target_pos, delta * 12.0)
	camera.look_at(look_target, Vector3.UP)

func _update_top_down_camera(delta: float) -> void:
	if not camera:
		return
	var target_pos = target_center + Vector3(0.0, distance * 1.15, 0.0)
	camera.global_position = camera.global_position.lerp(target_pos, delta * 14.0)
	camera.rotation = Vector3(deg_to_rad(-89.9), 0.0, 0.0)

func _unhandled_input(event: InputEvent) -> void:
	# 1. Thao tác xoay 360 độ góc nhìn Tactical bằng kéo chuột phải hoặc giữ chuột trái/touch
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_RIGHT or event.button_index == MOUSE_BUTTON_LEFT:
			if event.is_pressed():
				_is_dragging = true
				_last_mouse_pos = event.position
			else:
				_is_dragging = false

		# Zoom in / Zoom out bằng con lăn chuột
		if event.button_index == MOUSE_BUTTON_WHEEL_UP and event.is_pressed():
			distance = clampf(distance - 1.8, MIN_DISTANCE, MAX_DISTANCE)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.is_pressed():
			distance = clampf(distance + 1.8, MIN_DISTANCE, MAX_DISTANCE)

	elif event is InputEventMouseMotion and _is_dragging:
		var delta_move = event.position - _last_mouse_pos
		_last_mouse_pos = event.position

		if current_mode == CameraMode.TACTICAL:
			# Xoay quanh trục Y (Yaw) và trục X (Pitch)
			pivot_yaw -= delta_move.x * 0.0075
			pivot_pitch = clampf(pivot_pitch + delta_move.y * 0.0055, MIN_PITCH, MAX_PITCH)

		elif current_mode == CameraMode.TURRET and is_instance_valid(selected_tower):
			# Khi ở Turret View, di chuyển chuột làm xoay nòng tháp!
			if selected_tower.has_method("rotate_turret_manually"):
				selected_tower.rotate_turret_manually(-delta_move.x * 0.01)

	# Hỗ trợ cảm ứng trên thiết bị di động
	elif event is InputEventScreenTouch:
		if event.is_pressed():
			_is_dragging = true
			_last_mouse_pos = event.position
		else:
			_is_dragging = false

	elif event is InputEventScreenDrag and _is_dragging:
		var delta_move = event.relative
		if current_mode == CameraMode.TACTICAL:
			pivot_yaw -= delta_move.x * 0.0075
			pivot_pitch = clampf(pivot_pitch + delta_move.y * 0.0055, MIN_PITCH, MAX_PITCH)
