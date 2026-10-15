class_name Main3D
extends Node3D

## Main3D: Điều khiển chính Màn chơi Tower Defense 3D Low-Poly
## Tích hợp:
## 1. CameraController3D với 3 góc nhìn: Tactical (ISO) - Turret (TPS) - Top-Down (90°)
## 2. FloatingIslandProcedural với hòn đảo bay, đường ray Path3D và các bệ đặt tháp
## 3. Quái vật Robot 3D (Enemy3D) di chuyển và thanh máu nổi
## 4. Tháp lục giác 3D (Tower3D) với lõi pha lê bay xoay tròn và tia laser năng lượng
## 5. UI CanvasLayer hiện đại hiển thị HUD và các nút tương tác

const CameraControllerClass = preload("CameraController3D.gd")
const FloatingIslandClass = preload("FloatingIslandProcedural.gd")
const Enemy3DClass = preload("Enemy3D.gd")
const Tower3DClass = preload("Tower3D.gd")

# Trạng thái người chơi
var base_health: int = 20
var max_health: int = 20
var gold: int = 250
var score: int = 0
var current_wave: int = 0
var is_wave_active: bool = false
var _enemies_to_spawn: int = 0
var _spawn_timer: float = 0.0

# Node References
@onready var camera_controller: Node3D = $CameraController3D
@onready var island: Node3D = $FloatingIsland
@onready var towers_container: Node3D = $Towers

# UI References
@onready var label_hp: Label = $UI/HUD/TopBar/LabelHP
@onready var label_gold: Label = $UI/HUD/TopBar/LabelGold
@onready var label_wave: Label = $UI/HUD/TopBar/LabelWave
@onready var label_score: Label = $UI/HUD/TopBar/LabelScore

@onready var btn_cam_mode: Button = $UI/HUD/BottomBar/BtnCamMode
@onready var btn_start_wave: Button = $UI/HUD/BottomBar/ActionsHBox/BtnStartWave
@onready var btn_build_tower: Button = $UI/HUD/BottomBar/ActionsHBox/BtnBuildTower
@onready var btn_switch_2d: Button = $UI/HUD/BottomBar/ActionsHBox/BtnSwitch2D

@onready var web_bridge: Node = get_node_or_null("/root/WebBridge")

func _ready() -> void:
	# Cập nhật hiển thị HUD ban đầu
	_update_hud()

	# Đặt tháp mặc định lên bệ số 0
	_spawn_tower_at_index(0)

	# Kết nối sự kiện Camera Controller
	if camera_controller:
		camera_controller.camera_mode_changed.connect(_on_camera_mode_changed)

	# Kết nối các nút bấm UI
	btn_cam_mode.pressed.connect(_on_btn_cam_mode_pressed)
	btn_start_wave.pressed.connect(_on_btn_start_wave_pressed)
	btn_build_tower.pressed.connect(_on_btn_build_tower_pressed)
	btn_switch_2d.pressed.connect(_on_btn_switch_2d_pressed)

	if web_bridge:
		web_bridge.show_toast("Chào mừng đến Nguyên Mẫu 3D Low-Poly! Bấm [📷 ĐỔI GÓC NHÌN] để đổi camera.", "info")

func _process(delta: float) -> void:
	# Quản lý sinh quái vật theo nhịp thời gian
	if is_wave_active and _enemies_to_spawn > 0:
		_spawn_timer -= delta
		if _spawn_timer <= 0.0:
			_spawn_timer = 1.35
			_enemies_to_spawn -= 1
			_spawn_single_enemy()

	# Kiểm tra kết thúc wave khi hết quái
	if is_wave_active and _enemies_to_spawn <= 0:
		var enemies = get_tree().get_nodes_in_group("enemies_3d")
		if enemies.is_empty():
			is_wave_active = false
			btn_start_wave.disabled = false
			btn_start_wave.text = "🌊 WAVE %d" % (current_wave + 1)
			if web_bridge:
				web_bridge.show_toast("Dọn sạch Wave %d! Nhận thưởng hoàn thành." % current_wave, "success")

## Bắt đầu Wave tiếp theo
func _on_btn_start_wave_pressed() -> void:
	if is_wave_active:
		return
	current_wave += 1
	is_wave_active = true
	_enemies_to_spawn = 4 + current_wave * 2
	_spawn_timer = 0.5
	btn_start_wave.disabled = true
	btn_start_wave.text = "ĐANG ĐẤU..."
	_update_hud()

	if web_bridge:
		web_bridge.trigger_haptic("medium")

func _spawn_single_enemy() -> void:
	if not island or not island.path_3d:
		return

	var enemy = Enemy3DClass.new()
	enemy.add_to_group("enemies_3d")
	enemy.max_hp = 45.0 + float(current_wave) * 20.0
	enemy.move_speed = 3.6 + float(current_wave) * 0.35
	enemy.enemy_died.connect(_on_enemy_killed)
	enemy.enemy_escaped.connect(_on_enemy_escaped)

	island.path_3d.add_child(enemy)

func _on_enemy_killed(_enemy: Node3D, reward: int) -> void:
	gold += reward
	score += reward * 10
	_update_hud()

func _on_enemy_escaped(_enemy: Node3D) -> void:
	base_health = maxi(0, base_health - 1)
	_update_hud()
	if web_bridge:
		web_bridge.trigger_haptic("heavy")
		web_bridge.show_toast("⚠️ QUÁI ĐÃ XÂM NHẬP CĂN CỨ! -1 MÁU", "warning")

## Chuyển đổi góc nhìn Camera 3D
func _on_btn_cam_mode_pressed() -> void:
	if camera_controller:
		camera_controller.toggle_camera_mode()
	if web_bridge:
		web_bridge.trigger_haptic("selection")

func _on_camera_mode_changed(_mode: int, mode_name: String) -> void:
	if btn_cam_mode:
		btn_cam_mode.text = "📷 %s" % mode_name

## Đặt thêm tháp lên bệ trống
func _on_btn_build_tower_pressed() -> void:
	var tower_cost = 100
	if gold < tower_cost:
		if web_bridge:
			web_bridge.show_toast("Không đủ vàng! Cần %dG để xây tháp." % tower_cost, "warning")
			web_bridge.trigger_haptic("selection")
		return

	# Tìm bệ trống tiếp theo
	var built_count = towers_container.get_child_count() if towers_container else 0
	if built_count >= FloatingIslandClass.BUILD_SPOTS.size():
		if web_bridge:
			web_bridge.show_toast("Đã xây kín toàn bộ bệ tháp trên đảo!", "info")
		return

	gold -= tower_cost
	_spawn_tower_at_index(built_count)
	_update_hud()

	if web_bridge:
		web_bridge.show_toast("Đã xây tháp 3D thành công!", "success")
		web_bridge.trigger_haptic("medium")

func _spawn_tower_at_index(spot_idx: int) -> void:
	if spot_idx >= FloatingIslandClass.BUILD_SPOTS.size():
		return
	var spot_pos = FloatingIslandClass.BUILD_SPOTS[spot_idx]

	var tower = Tower3DClass.new()
	tower.position = spot_pos + Vector3(0.0, 0.15, 0.0)
	towers_container.add_child(tower)

	# Tự động gán làm mục tiêu cho Turret View nếu là tháp đầu tiên
	if spot_idx == 0 and camera_controller:
		camera_controller.selected_tower = tower

## Chuyển đổi qua lại giữa Scene 2D và Scene 3D
func _on_btn_switch_2d_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/Main.tscn")

func _update_hud() -> void:
	if label_hp: label_hp.text = "❤️ MÁU: %d/%d" % [base_health, max_health]
	if label_gold: label_gold.text = "💰 VÀNG: %d" % gold
	if label_wave: label_wave.text = "🌊 WAVE: %d" % current_wave
	if label_score: label_score.text = "🏆 ĐIỂM: %d" % score

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_SPACE, KEY_ENTER:
				if not is_wave_active:
					_on_btn_start_wave_pressed()
			KEY_C:
				_on_btn_cam_mode_pressed()
			KEY_B:
				_on_btn_build_tower_pressed()
