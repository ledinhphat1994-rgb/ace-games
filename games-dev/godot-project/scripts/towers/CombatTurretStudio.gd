class_name CombatTurretStudio
extends Node3D

## CombatTurretStudio: Phòng Trưng Bày & Thử Nghiệm Tháp Pháo 3D (Combat Turret)
## Cho phép:
## - Chiêm ngưỡng mô hình 3D nguyên bản từ file .glb
## - Thử nghiệm các hoạt ảnh: Action (Bắn giật nòng) & IDLE (Chờ)
## - Kiểm tra tiếp đất 100% chuẩn xác (Ground Contact Invariant - Rule 4 & 12)
## - Xoay 360 độ ngắm bắn theo chuột hoặc tự động quay vòng (Turntable)
## - Thử nghiệm bắn mục tiêu giả lập di động

const CombatTurret3DClass = preload("CombatTurret3D.gd")

var _is_turntable: bool = true
var _turntable_speed: float = 0.45
var _target_dummy: Node3D = null
var _dummy_angle: float = 0.0

@onready var camera_pivot: Node3D = $CameraPivot
@onready var camera_3d: Camera3D = $CameraPivot/Camera3D
@onready var turret_mount: Node3D = $TurretMount
@onready var label_status: Label = $UI/HUD/TopBar/LabelStatus
@onready var btn_fire: Button = $UI/HUD/BottomBar/HBox/BtnFire
@onready var btn_idle: Button = $UI/HUD/BottomBar/HBox/BtnIdle
@onready var btn_turntable: Button = $UI/HUD/BottomBar/HBox/BtnTurntable
@onready var btn_target: Button = $UI/HUD/BottomBar/HBox/BtnTarget
@onready var btn_cam_preset: Button = $UI/HUD/BottomBar/HBox/BtnCamPreset

var turret_instance: Node3D = null
var _cam_preset_idx: int = 0
const CAM_PRESETS = [
	{"name": "Chiến Thuật 3/4", "rot": Vector3(-20.0, 45.0, 0.0), "dist": 4.5, "y": 1.2},
	{"name": "Cận Cảnh Nòng Pháo", "rot": Vector3(-8.0, 15.0, 0.0), "dist": 2.6, "y": 1.4},
	{"name": "Chính Diện", "rot": Vector3(-5.0, 0.0, 0.0), "dist": 3.8, "y": 1.3},
	{"name": "Từ Trên Cao (Top-Down)", "rot": Vector3(-65.0, 45.0, 0.0), "dist": 5.5, "y": 0.5}
]

func _ready() -> void:
	_spawn_turret()
	_apply_camera_preset(0)

	btn_fire.pressed.connect(_on_btn_fire_pressed)
	btn_idle.pressed.connect(_on_btn_idle_pressed)
	btn_turntable.pressed.connect(_on_btn_turntable_pressed)
	btn_target.pressed.connect(_on_btn_target_pressed)
	btn_cam_preset.pressed.connect(_on_btn_cam_preset_pressed)

func _spawn_turret() -> void:
	if not turret_mount:
		return

	turret_instance = CombatTurret3DClass.new()
	# Tiếp đất chuẩn xác: Y = 0.0
	turret_instance.position = Vector3(0.0, 0.0, 0.0)
	turret_mount.add_child(turret_instance)

	if label_status:
		label_status.text = "THÁP PHÁO 3D: TIẾP ĐẤT Y=0.0 | HOẠT ẢNH: IDLE"

func _process(delta: float) -> void:
	# Tự động xoay turntable khi không có mục tiêu bay
	if _is_turntable and not _target_dummy and camera_pivot:
		camera_pivot.rotation.y += _turntable_speed * delta

	# Quỹ đạo di chuyển của mục tiêu bay giả lập
	if _target_dummy and is_instance_valid(_target_dummy):
		_dummy_angle += delta * 1.5
		var radius = 6.0
		_target_dummy.global_position = Vector3(
			sin(_dummy_angle) * radius,
			1.6 + sin(_dummy_angle * 2.5) * 0.4,
			cos(_dummy_angle) * radius
		)

func _on_btn_fire_pressed() -> void:
	if not turret_instance:
		return

	# Tạo mục tiêu tạm thời ở phía trước nếu chưa có
	var dummy = _target_dummy
	if not dummy:
		dummy = Node3D.new()
		dummy.position = turret_instance.global_position + turret_instance.global_transform.basis.z * 10.0 + Vector3(0.0, 1.4, 0.0)
		add_child(dummy)
		get_tree().create_timer(0.2).timeout.connect(dummy.queue_free)

	turret_instance._fire_at(dummy)
	if label_status:
		label_status.text = "THÁP PHÁO 3D: KHAI HỎA (ACTION) - GIẬT LÙI NÒNG ĐÔI & TIA NĂNG LƯỢNG"

func _on_btn_idle_pressed() -> void:
	if turret_instance and turret_instance._anim_player:
		turret_instance._anim_player.play("IDLE")
	if label_status:
		label_status.text = "THÁP PHÁO 3D: TRẠNG THÁI CHỜ (IDLE)"

func _on_btn_turntable_pressed() -> void:
	_is_turntable = not _is_turntable
	btn_turntable.text = "🔄 XOAY 360°: " + ("BẬT" if _is_turntable else "TẮT")

func _on_btn_target_pressed() -> void:
	if _target_dummy and is_instance_valid(_target_dummy):
		_target_dummy.queue_free()
		_target_dummy = null
		turret_instance.current_target = null
		btn_target.text = "🎯 THẢ MỤC TIÊU"
		if label_status:
			label_status.text = "ĐÃ HỦY MỤC TIÊU GIẢ LẬP"
	else:
		_create_target_drone()
		btn_target.text = "❌ XÓA MỤC TIÊU"
		if label_status:
			label_status.text = "MỤC TIÊU BAY ĐANG DI CHUYỂN - THÁP ĐANG BÁM ĐUỔI NGẮM BẮN"

func _create_target_drone() -> void:
	_target_dummy = Node3D.new()
	_target_dummy.name = "TargetDrone"
	_target_dummy.add_to_group("enemies_3d")

	# Mesh quả cầu năng lượng mục tiêu
	var sphere = MeshInstance3D.new()
	var sm = SphereMesh.new()
	sm.radius = 0.4
	sm.height = 0.8
	var mat = StandardMaterial3D.new()
	mat.albedo_color = Color(1.0, 0.25, 0.2)
	mat.emission_enabled = true
	mat.emission = Color(1.0, 0.2, 0.1)
	mat.emission_energy_multiplier = 3.0
	sphere.mesh = sm
	sphere.material_override = mat
	_target_dummy.add_child(sphere)

	# Script thuộc tính máu giả lập
	_target_dummy.set_script(load("res://scripts/3d/Enemy3D.gd"))
	_target_dummy.set("max_hp", 9999.0)
	_target_dummy.set("current_hp", 9999.0)

	add_child(_target_dummy)
	_dummy_angle = 0.0

func _on_btn_cam_preset_pressed() -> void:
	_cam_preset_idx = (_cam_preset_idx + 1) % CAM_PRESETS.size()
	_apply_camera_preset(_cam_preset_idx)

func _apply_camera_preset(idx: int) -> void:
	var p = CAM_PRESETS[idx]
	if btn_cam_preset:
		btn_cam_preset.text = "📷 " + p["name"]
	if camera_pivot and camera_3d:
		camera_pivot.rotation_degrees = Vector3(p["rot"].x, p["rot"].y, 0.0)
		camera_pivot.position.y = p["y"]
		camera_3d.position = Vector3(0.0, 0.0, p["dist"])
