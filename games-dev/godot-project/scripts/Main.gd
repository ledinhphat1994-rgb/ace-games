extends Node2D

## Main: Bộ điều khiển chính Màn chơi Tower Defense Phản Trọng Lực (Anti-Gravity TD)
## Tích hợp Vòng lặp trò chơi hoàn chỉnh (Complete Game Loop):
## 1. GameManager (Máu Căn Cứ, Kinh Tế Vàng, Trạng thái Thắng/Thua, Tốc độ x1/x2)
## 2. Shop Bar Mua Trụ & Kéo thả / Chạm đặt trụ với Range Indicator
## 3. EnemySpawner quản lý 5 Wave tăng dần độ khó
## 4. Điều khiển Trường Lực Trọng Lực (GravityZone)

const GravityZoneScript = preload("zones/GravityZone.gd")
const GravityZoneClass = GravityZoneScript
const EnemySpawnerClass = preload("enemies/EnemySpawner.gd")
const EnemyClass = preload("enemies/Enemy.gd")
const GameManagerClass = preload("managers/GameManager.gd")
const BaseTowerClass = preload("towers/BaseTower.gd")
const PlasmaTowerClass = preload("towers/PlasmaTower.gd")
const RailgunTowerClass = preload("towers/RailgunTower.gd")
const VoidPylonTowerClass = preload("towers/VoidPylonTower.gd")
const SoundSynthClass = preload("audio/SoundSynthesizer.gd")
const FloatingCombatText = preload("../templates/gdquest_helpers/FloatingCombatText.gd")
const CosmicEnvironmentClass = preload("environment/CosmicEnvironment.gd")

const PlasmaTowerScene = preload("../scenes/towers/PlasmaTower.tscn")
const RailgunTowerScene = preload("../scenes/towers/RailgunTower.tscn")
const VoidPylonTowerScene = preload("../scenes/towers/VoidPylonTower.tscn")

enum TowerType {
	NONE = -1,
	PLASMA = 0,
	RAILGUN = 1,
	VOID = 2
}

const TOWER_INFO = {
	TowerType.PLASMA: {
		"name": "Cung Plasma",
		"cost": 60,
		"range": 280.0,
		"color": Color(0.0, 0.95, 1.0, 1.0),
		"scene": PlasmaTowerScene
	},
	TowerType.RAILGUN: {
		"name": "Súng Railgun",
		"cost": 120,
		"range": 340.0,
		"color": Color(1.0, 0.72, 0.1, 1.0),
		"scene": RailgunTowerScene
	},
	TowerType.VOID: {
		"name": "Trụ Hư Không",
		"cost": 150,
		"range": 260.0,
		"color": Color(0.85, 0.1, 1.0, 1.0),
		"scene": VoidPylonTowerScene
	}
}

# Node References
@onready var game_manager: Node = $GameManager
@onready var gravity_zone: Node2D = $GravityZone
@onready var gravity_zone_b: Node2D = get_node_or_null("GravityZoneB")
@onready var enemy_spawner: Node2D = $EnemySpawner
@onready var spawn_point: Marker2D = $SpawnPoint
@onready var towers_container: Node2D = $Towers
@onready var enemies_container: Node2D = $EnemiesContainer

# UI References
@onready var label_title: Label = $UI/Header/TitleBox/LabelTitle
@onready var btn_menu: Button = $UI/Header/BtnMenu
@onready var btn_speed: Button = $UI/Header/BtnSpeed
@onready var btn_3d: Button = get_node_or_null("UI/Header/Btn3D")
@onready var btn_exit: Button = $UI/Header/BtnExit

@onready var label_health: Label = $UI/HUDBar/LabelHealth
@onready var label_gold: Label = $UI/HUDBar/LabelGold
@onready var label_wave: Label = $UI/HUDBar/LabelWave

@onready var label_mode: Label = $UI/ModeIndicator

# Boss Health Bar chuyên biệt cố định ở đỉnh màn hình
@onready var boss_health_bar: Control = $UI/BossHealthBar
@onready var label_boss_name: Label = $UI/BossHealthBar/VBox/HeaderHBox/LabelBossName
@onready var label_boss_hp: Label = $UI/BossHealthBar/VBox/HeaderHBox/LabelBossHP
@onready var boss_bar_fill: ColorRect = $UI/BossHealthBar/VBox/BarBg/BarFill

# Kỹ năng Tối thượng (Active Ultimate Skills)
@onready var btn_skill_emp: Button = $UI/ThumbZone/SkillsBar/BtnSkillEMP
@onready var btn_skill_blackhole: Button = $UI/ThumbZone/SkillsBar/BtnSkillBlackhole

# Nút Thao tác Trọng lực & Wave
@onready var btn_directional: Button = $UI/ThumbZone/HBox1/BtnDirectional
@onready var btn_repulse: Button = $UI/ThumbZone/HBox1/BtnRepulse
@onready var btn_attract: Button = $UI/ThumbZone/HBox1/BtnAttract
@onready var btn_start_wave: Button = $UI/ThumbZone/HBox1/BtnStartWave

# Thanh Shop Mua Trụ
@onready var btn_buy_plasma: Button = $UI/ThumbZone/ShopBar/BtnPlasma
@onready var btn_buy_railgun: Button = $UI/ThumbZone/ShopBar/BtnRailgun
@onready var btn_buy_void: Button = $UI/ThumbZone/ShopBar/BtnVoid
@onready var btn_cancel_build: Button = $UI/ThumbZone/ShopBar/BtnCancel

# Floating Tower Upgrade & Sell Menu
@onready var floating_tower_menu: Control = $UI/FloatingTowerMenu
@onready var label_selected_tower: Label = $UI/FloatingTowerMenu/Panel/VBox/HeaderBox/LabelTowerName
@onready var btn_close_tower_menu: Button = $UI/FloatingTowerMenu/Panel/VBox/HeaderBox/BtnCloseTower
@onready var btn_upgrade_tower: Button = $UI/FloatingTowerMenu/Panel/VBox/ActionsBox/BtnUpgradeTower
@onready var btn_sell_tower: Button = $UI/FloatingTowerMenu/Panel/VBox/ActionsBox/BtnSellTower

# Popup Game Over & Victory và Thống kê chi tiết
@onready var popup_game_over: Control = $UI/PopupGameOver
@onready var label_game_over_kills: Label = $UI/PopupGameOver/Panel/VBox/StatsBox/LabelKills
@onready var label_game_over_gold: Label = $UI/PopupGameOver/Panel/VBox/StatsBox/LabelGold
@onready var label_game_over_time: Label = $UI/PopupGameOver/Panel/VBox/StatsBox/LabelTime
@onready var btn_restart_fail: Button = $UI/PopupGameOver/Panel/VBox/BtnRestart

@onready var popup_victory: Control = $UI/PopupVictory
@onready var label_victory_kills: Label = $UI/PopupVictory/Panel/VBox/StatsBox/LabelKills
@onready var label_victory_gold: Label = $UI/PopupVictory/Panel/VBox/StatsBox/LabelGold
@onready var label_victory_time: Label = $UI/PopupVictory/Panel/VBox/StatsBox/LabelTime
@onready var btn_next_level: Button = $UI/PopupVictory/Panel/VBox/BtnNextLevel
@onready var btn_restart_win: Button = $UI/PopupVictory/Panel/VBox/BtnRestart

# Màn hình Chọn Màn Chơi (Level Select Screen)
@onready var level_select_modal: Control = $UI/LevelSelectModal
@onready var btn_close_level_select: Button = $UI/LevelSelectModal/Panel/VBox/HeaderBox/BtnCloseLevelSelect
@onready var btn_play_level_1: Button = $UI/LevelSelectModal/Panel/VBox/CardLevel1/VBox1/BtnPlayLevel1
@onready var btn_play_level_2: Button = $UI/LevelSelectModal/Panel/VBox/CardLevel2/VBox2/BtnPlayLevel2
@onready var label_status_level_1: Label = $UI/LevelSelectModal/Panel/VBox/CardLevel1/VBox1/Status1
@onready var label_status_level_2: Label = $UI/LevelSelectModal/Panel/VBox/CardLevel2/VBox2/Status2

# Quản lý Màn chơi & Tiến trình lưu trữ
@onready var level_manager: Node = get_node_or_null("/root/LevelManager")
var current_active_level: int = 1
var _active_drag_zone: Node2D = null

# Trạng thái đặt trụ & tương tác
var selected_tower_type: int = TowerType.NONE
var preview_placement_pos: Vector2 = Vector2.ZERO
var _is_dragging_zone: bool = false
var _is_dragging_build: bool = false

# Trạng thái chọn và nâng cấp trụ
var selected_tower: Node2D = null

# Hiệu ứng thị giác kỹ năng
var _emp_wave_anim: float = 0.0
var _blackhole_overload_anim: float = 0.0

var sound_synth: Node = null
var cosmic_env: Node2D = null
@onready var web_bridge: Node = get_node_or_null("/root/WebBridge")

func _ready() -> void:
	# Khởi tạo Hệ thống Môi trường & Bản đồ Vũ trụ (Cosmic Environment)
	cosmic_env = CosmicEnvironmentClass.new()
	cosmic_env.name = "CosmicEnvironment"
	cosmic_env.towers_container_ref = towers_container
	add_child(cosmic_env)
	move_child(cosmic_env, 2)

	# Khởi tạo SoundSynthesizer
	sound_synth = SoundSynthClass.new()
	sound_synth.name = "SoundSynthesizer"
	add_child(sound_synth)

	# Kết nối GameManager events
	if game_manager:
		game_manager.health_changed.connect(_on_health_changed)
		game_manager.gold_changed.connect(_on_gold_changed)
		game_manager.wave_updated.connect(_on_wave_updated)
		game_manager.speed_changed.connect(_on_speed_changed)
		game_manager.skill_cooldown_updated.connect(_on_skill_cooldown_updated)
		game_manager.game_over_triggered.connect(_on_game_over)
		game_manager.victory_triggered.connect(_on_victory)
		_on_health_changed(game_manager.base_health, game_manager.max_health)
		_on_gold_changed(game_manager.gold)
		_on_wave_updated(game_manager.current_wave, game_manager.max_waves)
		_on_skill_cooldown_updated(0.0, GameManagerClass.EMP_MAX_CD, 0.0, GameManagerClass.BLACKHOLE_MAX_CD)

	# Kết nối EnemySpawner events
	if enemy_spawner:
		enemy_spawner.enemy_killed.connect(_on_enemy_killed)
		enemy_spawner.enemy_escaped.connect(_on_enemy_escaped)
		enemy_spawner.wave_started.connect(_on_spawner_wave_started)
		enemy_spawner.wave_completed.connect(_on_spawner_wave_completed)
		enemy_spawner.all_waves_completed.connect(_on_all_waves_completed)
		enemy_spawner.boss_spawned.connect(_on_boss_spawned)
		enemy_spawner.boss_hp_updated.connect(_on_boss_hp_updated)
		enemy_spawner.boss_defeated.connect(_on_boss_defeated)

	# Kết nối UI Header Buttons
	btn_menu.pressed.connect(_open_level_select_modal)
	btn_speed.pressed.connect(_on_btn_speed_pressed)
	if btn_3d:
		btn_3d.pressed.connect(_on_btn_3d_pressed)
	btn_exit.pressed.connect(_on_btn_exit_pressed)

	btn_directional.pressed.connect(_on_btn_directional_pressed)
	btn_repulse.pressed.connect(_on_btn_repulse_pressed)
	btn_attract.pressed.connect(_on_btn_attract_pressed)
	btn_start_wave.pressed.connect(_on_btn_start_wave_pressed)

	# Kỹ năng Tối Thượng
	btn_skill_emp.pressed.connect(_on_btn_skill_emp_pressed)
	btn_skill_blackhole.pressed.connect(_on_btn_skill_blackhole_pressed)

	# Nâng cấp & Bán trụ
	btn_buy_plasma.pressed.connect(func(): _select_tower_to_build(TowerType.PLASMA))
	btn_buy_railgun.pressed.connect(func(): _select_tower_to_build(TowerType.RAILGUN))
	btn_buy_void.pressed.connect(func(): _select_tower_to_build(TowerType.VOID))
	btn_cancel_build.pressed.connect(_cancel_build_mode)

	btn_upgrade_tower.pressed.connect(_on_btn_upgrade_tower_pressed)
	btn_sell_tower.pressed.connect(_on_btn_sell_tower_pressed)
	btn_close_tower_menu.pressed.connect(_close_tower_menu)

	btn_restart_fail.pressed.connect(_on_btn_restart_pressed)
	btn_restart_win.pressed.connect(_on_btn_restart_pressed)
	btn_next_level.pressed.connect(_on_btn_next_level_pressed)

	# Kết nối Level Select Modal
	btn_close_level_select.pressed.connect(_close_level_select_modal)
	btn_play_level_1.pressed.connect(func(): _select_and_start_level(1))
	btn_play_level_2.pressed.connect(func(): _select_and_start_level(2))

	# Ẩn Popup kết thúc và Menu tháp ban đầu
	if popup_game_over:
		popup_game_over.visible = false
	if popup_victory:
		popup_victory.visible = false
	if btn_cancel_build:
		btn_cancel_build.visible = false
	if floating_tower_menu:
		floating_tower_menu.visible = false
	if boss_health_bar:
		boss_health_bar.visible = false
	if level_select_modal:
		level_select_modal.visible = false

	# Khởi tạo màn chơi ban đầu (theo LevelManager nếu có)
	var initial_level = 1
	if level_manager and "current_level" in level_manager:
		initial_level = level_manager.current_level
	setup_level(initial_level)
	_update_shop_buttons()

	if web_bridge:
		web_bridge.show_toast("Sẵn sàng! Chạm trụ để Nâng cấp/Bán • Dùng kỹ năng EMP & Hố đen!", "info")

func _process(delta: float) -> void:
	# Cập nhật animation sóng chấn kỹ năng
	var needs_redraw: bool = false
	if _emp_wave_anim > 0.0:
		_emp_wave_anim = maxf(0.0, _emp_wave_anim - delta * 1.8)
		needs_redraw = true
	if _blackhole_overload_anim > 0.0:
		_blackhole_overload_anim = maxf(0.0, _blackhole_overload_anim - delta * 1.4)
		needs_redraw = true
	if needs_redraw:
		queue_redraw()

	# Cập nhật trạng thái nút Start Wave nếu đang diễn ra wave
	if enemy_spawner and btn_start_wave:
		if enemy_spawner.is_wave_active:
			var active_count: int = enemy_spawner.get_active_enemy_count()
			btn_start_wave.text = "QUÁI CÒN: %d" % active_count
			btn_start_wave.disabled = true
		else:
			if enemy_spawner.current_wave < enemy_spawner.MAX_WAVES:
				btn_start_wave.text = "🌊 WAVE %d" % (enemy_spawner.current_wave + 1)
				btn_start_wave.disabled = false
			else:
				btn_start_wave.text = "HOÀN TẤT"
				btn_start_wave.disabled = true

func _unhandled_input(event: InputEvent) -> void:
	if game_manager and (game_manager.state == GameManagerClass.GameState.GAME_OVER or game_manager.state == GameManagerClass.GameState.VICTORY):
		return

	# 1. Xử lý Kéo thả / Chạm đặt trụ từ Shop Bar
	if selected_tower_type != TowerType.NONE:
		if event is InputEventMouseButton or event is InputEventScreenTouch:
			if event.is_pressed():
				var touch_pos = event.position
				# Chỉ xử lý nếu chạm trong vùng sân đấu
				if touch_pos.y >= 210.0 and touch_pos.y <= 990.0:
					var snap_pos = cosmic_env.get_nearest_pad(touch_pos, 44.0) if cosmic_env else Vector2.ZERO
					preview_placement_pos = snap_pos if snap_pos != Vector2.ZERO else touch_pos
					_is_dragging_build = true
					queue_redraw()
			else:
				if _is_dragging_build:
					_is_dragging_build = false
					_try_place_tower_at(preview_placement_pos)

		elif (event is InputEventMouseMotion or event is InputEventScreenDrag) and _is_dragging_build:
			var snap_pos = cosmic_env.get_nearest_pad(event.position, 44.0) if cosmic_env else Vector2.ZERO
			preview_placement_pos = snap_pos if snap_pos != Vector2.ZERO else event.position
			queue_redraw()
		return

	# 2. Xử lý Chạm vào trụ trên sân đấu (Chọn, Nâng cấp, Bán) hoặc Kéo Trọng lực (Vùng A / Vùng B)
	if event is InputEventMouseButton or event is InputEventScreenTouch:
		if event.is_pressed():
			var touch_pos = event.position
			if touch_pos.y >= 210.0 and touch_pos.y <= 990.0:
				# Kiểm tra xem có chạm trực tiếp vào một trụ đã xây sẵn hay không (bán kính nhạy 52px)
				var hit_tower: Node2D = null
				if towers_container:
					for t in towers_container.get_children():
						if is_instance_valid(t) and t is BaseTowerClass:
							if touch_pos.distance_to(t.global_position) <= 52.0:
								hit_tower = t
								break

				if hit_tower:
					_select_existing_tower(hit_tower)
					_is_dragging_zone = false
					_active_drag_zone = null
					return
				else:
					# Nếu chạm ra ngoài khu vực trụ -> Đóng menu lựa chọn trụ
					if floating_tower_menu and floating_tower_menu.visible:
						_close_tower_menu()

					# Xác định vùng trọng lực cần kéo: Vùng A hay Vùng B
					if current_active_level == 2 and gravity_zone_b and gravity_zone_b.visible:
						var dist_a = touch_pos.distance_to(gravity_zone.global_position)
						var dist_b = touch_pos.distance_to(gravity_zone_b.global_position)
						if dist_b < dist_a:
							_active_drag_zone = gravity_zone_b
						else:
							_active_drag_zone = gravity_zone
					else:
						_active_drag_zone = gravity_zone

					_is_dragging_zone = true
					_move_active_zone_to(touch_pos)
					if web_bridge:
						web_bridge.trigger_haptic("selection")
		else:
			_is_dragging_zone = false
			_active_drag_zone = null

	elif (event is InputEventMouseMotion or event is InputEventScreenDrag) and _is_dragging_zone:
		_move_active_zone_to(event.position)

func _move_active_zone_to(target_pos: Vector2) -> void:
	if _active_drag_zone:
		var clamped_y = clampf(target_pos.y, 240.0, 950.0)
		var clamped_x = clampf(target_pos.x, 80.0, 640.0)
		_active_drag_zone.position = Vector2(clamped_x, clamped_y)
	elif gravity_zone:
		var clamped_y = clampf(target_pos.y, 240.0, 950.0)
		var clamped_x = clampf(target_pos.x, 80.0, 640.0)
		gravity_zone.position = Vector2(clamped_x, clamped_y)

## Chọn loại tháp cần xây từ Shop Bar
func _select_tower_to_build(type: int) -> void:
	if selected_tower_type == type:
		_cancel_build_mode()
		return

	var info = TOWER_INFO.get(type)
	if not info:
		return

	if game_manager and game_manager.gold < info.cost:
		if web_bridge:
			web_bridge.show_toast("Không đủ vàng để mua %s (%dG)" % [info.name, info.cost], "warning")
			web_bridge.trigger_haptic("selection")
		return

	selected_tower_type = type
	preview_placement_pos = Vector2(360, 520)
	if btn_cancel_build:
		btn_cancel_build.visible = true
	_update_shop_buttons()
	queue_redraw()

	if web_bridge:
		web_bridge.trigger_haptic("light")
		web_bridge.show_toast("Chạm hoặc kéo vào sân chơi để đặt %s!" % info.name, "info")

## Hủy chế độ đặt trụ
func _cancel_build_mode() -> void:
	selected_tower_type = TowerType.NONE
	_is_dragging_build = false
	if btn_cancel_build:
		btn_cancel_build.visible = false
	_update_shop_buttons()
	queue_redraw()

## Kiểm tra vị trí đặt trụ có hợp lệ hay không
func is_placement_valid(pos: Vector2) -> bool:
	# 1. Nằm trong vùng chiến trường an toàn
	if pos.x < 80.0 or pos.x > 640.0 or pos.y < 230.0 or pos.y > 960.0:
		return false

	# 2. Không được quá gần điểm xuất phát quái vật (60, 520)
	if pos.distance_to(Vector2(60, 520)) < 85.0:
		return false

	# 3. Không được đặt đè trực tiếp lên tâm Gravity Zone A hoặc B
	if gravity_zone and pos.distance_to(gravity_zone.global_position) < 85.0:
		return false
	if current_active_level == 2 and gravity_zone_b and gravity_zone_b.visible:
		if pos.distance_to(gravity_zone_b.global_position) < 85.0:
			return false

	# 4. Không được đặt chồng đè lên các tháp hiện có (khoảng cách an toàn 72px)
	if towers_container:
		for tower in towers_container.get_children():
			if is_instance_valid(tower) and tower is Node2D:
				if pos.distance_to(tower.global_position) < 72.0:
					return false

	return true

## Tiến hành đặt trụ sau khi người chơi chạm xác nhận
func _try_place_tower_at(pos: Vector2) -> void:
	if selected_tower_type == TowerType.NONE:
		return

	# Hỗ trợ tự động hút vào bệ đặt trụ gần nhất nếu có
	if cosmic_env:
		var snap_pos = cosmic_env.get_nearest_pad(pos, 44.0)
		if snap_pos != Vector2.ZERO:
			pos = snap_pos

	var info = TOWER_INFO.get(selected_tower_type)
	if not info:
		_cancel_build_mode()
		return

	if not is_placement_valid(pos):
		if web_bridge:
			web_bridge.trigger_haptic("heavy")
			web_bridge.show_toast("Vị trí không hợp lệ! Hãy tránh tâm trọng lực và các trụ khác.", "warning")
		return

	# Trừ vàng qua GameManager
	if game_manager and game_manager.spend_gold(info.cost):
		var tower_scene: PackedScene = info.scene
		if tower_scene and towers_container:
			var tower = tower_scene.instantiate() as Node2D
			if tower:
				tower.global_position = pos
				towers_container.add_child(tower)
				_spawn_build_effect(pos, info.color)

				if web_bridge:
					web_bridge.trigger_haptic("medium")
					web_bridge.show_toast("Đã xây thành công %s!" % info.name, "success")

		_cancel_build_mode()
	else:
		_cancel_build_mode()

## Hiệu ứng hạt vòng sáng khi xây trụ thành công
func _spawn_build_effect(pos: Vector2, color: Color) -> void:
	var p = CPUParticles2D.new()
	p.global_position = pos
	p.emitting = true
	p.one_shot = true
	p.explosiveness = 0.95
	p.amount = 18
	p.lifetime = 0.35
	p.spread = 180.0
	p.initial_velocity_min = 60.0
	p.initial_velocity_max = 140.0
	p.scale_amount_min = 2.0
	p.scale_amount_max = 4.0
	p.color = color
	add_child(p)
	get_tree().create_timer(0.4).timeout.connect(p.queue_free)

func _draw() -> void:
	# 1. Vẽ hiệu ứng Sóng xung kích EMP toàn màn hình
	if _emp_wave_anim > 0.0:
		var emp_r = (1.0 - _emp_wave_anim) * 950.0
		var emp_col = Color(0.15, 0.95, 1.0, _emp_wave_anim * 0.75)
		draw_arc(Vector2(360, 520), emp_r, 0, TAU, 56, emp_col, 5.0 * _emp_wave_anim, true)
		draw_arc(Vector2(360, 520), maxf(10.0, emp_r - 20.0), 0, TAU, 48, Color(1, 1, 1, _emp_wave_anim * 0.5), 2.5 * _emp_wave_anim, true)

	# 2. Vẽ hiệu ứng Quá tải Hố Đen tỏa từ tâm GravityZone
	if _blackhole_overload_anim > 0.0:
		var center_pos = gravity_zone.global_position if gravity_zone else Vector2(360, 520)
		var bh_r = (1.0 - _blackhole_overload_anim) * 520.0
		var bh_col = Color(0.95, 0.35, 1.0, _blackhole_overload_anim * 0.85)
		draw_circle(center_pos, 45.0 * _blackhole_overload_anim, Color(0.1, 0.0, 0.2, 0.9))
		draw_arc(center_pos, bh_r, 0, TAU, 48, bh_col, 6.0 * _blackhole_overload_anim, true)
		draw_arc(center_pos, maxf(10.0, bh_r - 18.0), 0, TAU, 40, Color(1, 0.7, 1, _blackhole_overload_anim * 0.6), 3.0 * _blackhole_overload_anim, true)

	# 3. Vẽ vòng tròn tầm bắn và hình dáng Ghost Tower khi đang chọn đặt trụ
	if selected_tower_type != TowerType.NONE:
		var info = TOWER_INFO.get(selected_tower_type)
		if info:
			var valid = is_placement_valid(preview_placement_pos)
			var range_r = info.range
			var fill_color = Color(0.1, 0.9, 0.4, 0.16) if valid else Color(0.9, 0.15, 0.2, 0.18)
			var stroke_color = Color(0.2, 1.0, 0.5, 0.8) if valid else Color(1.0, 0.2, 0.25, 0.85)

			# Vòng tròn tầm bắn (Range Indicator)
			draw_circle(preview_placement_pos, range_r, fill_color)
			draw_arc(preview_placement_pos, range_r, 0, TAU, 48, stroke_color, 2.0, true)

			# Hình tròn thân tháp ghost preview to rõ 38px
			draw_circle(preview_placement_pos, 38.0, info.color * Color(1, 1, 1, 0.55))
			draw_arc(preview_placement_pos, 38.0, 0, TAU, 32, Color.WHITE, 2.0, true)
			draw_circle(preview_placement_pos, 12.0, Color.WHITE)

			# Dấu gạch chéo cảnh báo nếu không hợp lệ
			if not valid:
				draw_line(preview_placement_pos + Vector2(-18, -18), preview_placement_pos + Vector2(18, 18), Color(1, 0.2, 0.2, 0.95), 3.5)
				draw_line(preview_placement_pos + Vector2(-18, 18), preview_placement_pos + Vector2(18, -18), Color(1, 0.2, 0.2, 0.95), 3.5)

## Cập nhật trạng thái màu/mờ của các nút mua trụ trong Shop Bar
func _update_shop_buttons() -> void:
	var current_gold = game_manager.gold if game_manager else 200

	if btn_buy_plasma:
		btn_buy_plasma.disabled = (current_gold < 60)
		btn_buy_plasma.modulate = Color(1.2, 1.2, 1.2) if selected_tower_type == TowerType.PLASMA else Color.WHITE
	if btn_buy_railgun:
		btn_buy_railgun.disabled = (current_gold < 120)
		btn_buy_railgun.modulate = Color(1.2, 1.2, 1.2) if selected_tower_type == TowerType.RAILGUN else Color.WHITE
	if btn_buy_void:
		btn_buy_void.disabled = (current_gold < 150)
		btn_buy_void.modulate = Color(1.2, 1.2, 1.2) if selected_tower_type == TowerType.VOID else Color.WHITE

	if selected_tower:
		_update_tower_menu_content()

# ========================================================
# TƯƠNG TÁC CHỌN TRỤ, NÂNG CẤP & BÁN (TOWER INTERACTION)
# ========================================================

## Chọn trụ trên sân đấu để hiển thị Floating Menu
func _select_existing_tower(tower: Node2D) -> void:
	if selected_tower and selected_tower != tower:
		selected_tower.is_selected = false
		selected_tower.queue_redraw()

	selected_tower = tower
	selected_tower.is_selected = true
	selected_tower.queue_redraw()
	_update_tower_menu_content()

	# Căn chỉnh vị trí menu nổi phía trên đỉnh trụ an toàn trong màn hình
	if floating_tower_menu:
		var menu_w: float = 360.0
		var _menu_h: float = 140.0
		var t_pos = tower.global_position
		var target_x = clampf(t_pos.x - menu_w * 0.5, 20.0, 720.0 - menu_w - 20.0)
		var target_y = t_pos.y - 150.0
		if target_y < 210.0:
			target_y = t_pos.y + 55.0 # Nếu sát mép trên, lật xuống dưới trụ
		floating_tower_menu.position = Vector2(target_x, target_y)
		floating_tower_menu.visible = true

	if web_bridge:
		web_bridge.trigger_haptic("selection")

## Cập nhật thông tin chi tiết trên Floating Menu
func _update_tower_menu_content() -> void:
	if not selected_tower or not is_instance_valid(selected_tower):
		_close_tower_menu()
		return

	var t_name = "THÁP PHÒNG THỦ"
	if selected_tower is PlasmaTowerClass:
		t_name = "CUNG PLASMA"
	elif selected_tower is RailgunTowerClass:
		t_name = "SÚNG RAILGUN"
	elif selected_tower is VoidPylonTowerClass:
		t_name = "TRỤ HƯ KHÔNG"

	if label_selected_tower:
		label_selected_tower.text = "%s — CẤP %d" % [t_name, selected_tower.level]

	var current_gold = game_manager.gold if game_manager else 0

	# Nút Nâng cấp
	if btn_upgrade_tower:
		if selected_tower.can_upgrade():
			var up_cost = selected_tower.get_upgrade_cost()
			var next_lv = selected_tower.level + 1
			btn_upgrade_tower.text = "▲ NÂNG CẤP (LV%d)\n%dG" % [next_lv, up_cost]
			btn_upgrade_tower.disabled = (current_gold < up_cost)
		else:
			btn_upgrade_tower.text = "★ ĐÃ TỐI ĐA\n(CẤP 3)"
			btn_upgrade_tower.disabled = true

	# Nút Bán trụ
	if btn_sell_tower:
		var sell_val = selected_tower.get_sell_value()
		btn_sell_tower.text = "💰 BÁN TRỤ\n+%dG" % sell_val

## Bấm nút Nâng cấp trụ
func _on_btn_upgrade_tower_pressed() -> void:
	if not selected_tower or not is_instance_valid(selected_tower):
		return
	if not selected_tower.can_upgrade():
		return

	var up_cost = selected_tower.get_upgrade_cost()
	if game_manager and game_manager.spend_gold(up_cost):
		var _prev_lv = selected_tower.level
		selected_tower.upgrade()
		_spawn_build_effect(selected_tower.global_position, selected_tower.theme_color)
		_update_tower_menu_content()

		if web_bridge:
			web_bridge.show_toast("Thăng cấp thành công lên Cấp %d!" % selected_tower.level, "success")
			web_bridge.trigger_haptic("medium")
	else:
		if web_bridge:
			web_bridge.show_toast("Không đủ vàng để nâng cấp!", "warning")

## Bấm nút Bán trụ (hoàn lại 70% tổng tiền)
func _on_btn_sell_tower_pressed() -> void:
	if not selected_tower or not is_instance_valid(selected_tower):
		return

	var sell_val = selected_tower.get_sell_value()
	var tower_to_remove = selected_tower
	_close_tower_menu()

	if game_manager:
		game_manager.add_gold(sell_val)

	if sound_synth:
		sound_synth.play_sell()

	_spawn_build_effect(tower_to_remove.global_position, Color(1.0, 0.85, 0.2))
	tower_to_remove.queue_free()

	if web_bridge:
		web_bridge.show_toast("Đã bán trụ! Hoàn lại +%d Vàng." % sell_val, "info")
		web_bridge.trigger_haptic("selection")

## Đóng Menu lựa chọn trụ
func _close_tower_menu() -> void:
	if selected_tower and is_instance_valid(selected_tower):
		selected_tower.is_selected = false
		selected_tower.queue_redraw()
	selected_tower = null
	if floating_tower_menu:
		floating_tower_menu.visible = false

# ========================================================
# KỸ NĂNG PHẢN TRỌNG LỰC CHỦ ĐỘNG (ACTIVE ULTIMATE SKILLS)
# ========================================================

## Kích hoạt Sóng xung kích EMP (Đóng băng toàn bộ quái trong 2.5s)
func _on_btn_skill_emp_pressed() -> void:
	if not game_manager or not game_manager.use_emp():
		return

	_emp_wave_anim = 1.0
	queue_redraw()

	# Đóng băng (stun) toàn bộ quái vật trên sân
	if enemies_container:
		for enemy in enemies_container.get_children():
			if is_instance_valid(enemy) and enemy.has_method("apply_stun"):
				enemy.apply_stun(2.5)

	if sound_synth:
		sound_synth.play_emp_shockwave()

	if web_bridge:
		web_bridge.trigger_haptic("heavy")
		web_bridge.show_toast("⚡ SÓNG XUNG KÍCH EMP! TOÀN BỘ QUÁI BỊ ĐÓNG BĂNG 2.5 GIÂY!", "info")

## Kích hoạt Quá tải Hố Đen (Cưỡng chế hút toàn bộ quái về tâm GravityZone trong 3s)
func _on_btn_skill_blackhole_pressed() -> void:
	if not game_manager or not game_manager.use_blackhole():
		return

	_blackhole_overload_anim = 1.0
	queue_redraw()

	var pull_target = gravity_zone.global_position if gravity_zone else Vector2(360, 520)

	# Ép kéo toàn bộ quái vật về tâm
	if enemies_container:
		for enemy in enemies_container.get_children():
			if is_instance_valid(enemy) and enemy.has_method("apply_force_attract"):
				enemy.apply_force_attract(pull_target, 3.0)

	if sound_synth:
		sound_synth.play_blackhole_overload()

	if web_bridge:
		web_bridge.trigger_haptic("heavy")
		web_bridge.show_toast("🌀 QUÁ TẢI HỐ ĐEN! HÚT TOÀN BỘ QUÁI VẬT VỀ TÂM 3 GIÂY!", "warning")

## Cập nhật hiển thị thời gian hồi chiêu của 2 nút kỹ năng
func _on_skill_cooldown_updated(emp_cd: float, _emp_max: float, bh_cd: float, _bh_max: float) -> void:
	if btn_skill_emp:
		if emp_cd <= 0.0:
			btn_skill_emp.disabled = false
			btn_skill_emp.text = "⚡ SÓNG EMP"
			btn_skill_emp.modulate = Color.WHITE
		else:
			btn_skill_emp.disabled = true
			btn_skill_emp.text = "⚡ EMP (%.0fs)" % ceilf(emp_cd)
			btn_skill_emp.modulate = Color(0.65, 0.75, 0.85, 0.65)

	if btn_skill_blackhole:
		if bh_cd <= 0.0:
			btn_skill_blackhole.disabled = false
			btn_skill_blackhole.text = "🌀 QUÁ TẢI HỐ ĐEN"
			btn_skill_blackhole.modulate = Color.WHITE
		else:
			btn_skill_blackhole.disabled = true
			btn_skill_blackhole.text = "🌀 HỐ ĐEN (%.0fs)" % ceilf(bh_cd)
			btn_skill_blackhole.modulate = Color(0.65, 0.75, 0.85, 0.65)

# ========================================================
# EVENT HANDLERS & THỐNG KÊ KẾT THÚC VÁN ĐẤU
# ========================================================

func _on_health_changed(current: int, max_hp: int) -> void:
	if label_health:
		label_health.text = "❤️ MÁU: %d/%d" % [current, max_hp]
		if current <= 5:
			label_health.modulate = Color(1.0, 0.2, 0.2)
		else:
			label_health.modulate = Color.WHITE

func _on_gold_changed(current_gold: int) -> void:
	if label_gold:
		label_gold.text = "💰 VÀNG: %d" % current_gold
	_update_shop_buttons()

func _on_wave_updated(wave_num: int, max_wave: int) -> void:
	if label_wave:
		label_wave.text = "🌊 WAVE: %d/%d" % [wave_num, max_wave]

func _on_speed_changed(new_speed: float) -> void:
	if btn_speed:
		btn_speed.text = "⏩ x%.0f" % new_speed

func _populate_end_game_stats(is_victory: bool) -> void:
	var stats = enemy_spawner.get_kill_stats() if enemy_spawner else {"normal": 0, "scout": 0, "tank": 0, "boss": 0, "total": 0}
	var total_gold = game_manager.total_gold_earned if game_manager else 0
	var match_t = game_manager.get_formatted_match_time() if game_manager else "00:00"
	var current_w = game_manager.current_wave if game_manager else 1
	var wave_txt = "5/5 (HOÀN THÀNH)" if is_victory else "%d/5 Wave" % current_w

	var kills_str = "⚔️ QUÁI TIÊU DIỆT: %d (Thường: %d • Trinh sát: %d • Thiết giáp: %d%s)" % [
		stats["total"], stats["normal"], stats["scout"], stats["tank"],
		(" • TRÙM TITAN: %d" % stats["boss"]) if stats.get("boss", 0) > 0 else ""
	]
	var gold_str = "💰 TỔNG VÀNG KIẾM ĐƯỢC: %d Vàng" % total_gold
	var time_str = "⏱ THỜI GIAN: %s • WAVE: %s • MÀN: %d" % [match_t, wave_txt, current_active_level]

	if is_victory:
		if label_victory_kills: label_victory_kills.text = kills_str
		if label_victory_gold: label_victory_gold.text = gold_str
		if label_victory_time: label_victory_time.text = time_str
	else:
		if label_game_over_kills: label_game_over_kills.text = kills_str
		if label_game_over_gold: label_game_over_gold.text = gold_str
		if label_game_over_time: label_game_over_time.text = time_str

func _on_game_over() -> void:
	_populate_end_game_stats(false)
	if boss_health_bar:
		boss_health_bar.visible = false
	if popup_game_over:
		popup_game_over.visible = true

func _on_victory() -> void:
	_populate_end_game_stats(true)
	if boss_health_bar:
		boss_health_bar.visible = false

	# Tính số sao đạt được theo Máu Căn Cứ
	var stars = 3
	if game_manager:
		if game_manager.base_health < 10:
			stars = 1
		elif game_manager.base_health < 18:
			stars = 2

	# Ghi nhận hoàn thành màn chơi vào LevelManager
	if level_manager:
		level_manager.complete_level(current_active_level, stars, game_manager.total_gold_earned if game_manager else 0)

	# Điều khiển nút chuyển màn trên Popup Thắng cuộc
	if btn_next_level:
		if current_active_level == 1:
			btn_next_level.visible = true
			btn_next_level.text = "TIẾP TỤC QUA MÀN 2 ➔"
		else:
			btn_next_level.visible = false

	if popup_victory:
		popup_victory.visible = true

## Thiết lập Màn chơi cụ thể (Màn 1: Vành Đai Alpha hoặc Màn 2: Hố Đen Kép Beta)
func setup_level(level_num: int) -> void:
	current_active_level = clampi(level_num, 1, 2)

	if level_manager and level_manager.has_method("set_current_level"):
		level_manager.set_current_level(current_active_level)

	# 1. Dọn dẹp chiến trường cũ
	if enemies_container:
		for c in enemies_container.get_children():
			if is_instance_valid(c):
				c.queue_free()

	if boss_health_bar:
		boss_health_bar.visible = false

	_is_dragging_zone = false
	_active_drag_zone = null

	# 2. Cấu hình bản đồ và các Vùng Trọng Lực
	if current_active_level == 1:
		if label_title:
			label_title.text = "ACE GAMES — MÀN 1: VÀNH ĐAI ALPHA"
		if gravity_zone:
			gravity_zone.position = Vector2(360, 520)
			gravity_zone.force_type = GravityZoneScript.ForceType.RADIAL_ATTRACT
			gravity_zone.field_color = Color(0.3, 1.0, 0.5, 0.30)
		if gravity_zone_b:
			gravity_zone_b.visible = false
			gravity_zone_b.process_mode = Node.PROCESS_MODE_DISABLED

	elif current_active_level == 2:
		if label_title:
			label_title.text = "ACE GAMES — MÀN 2: HỐ ĐEN KÉP BETA"
		# Vùng A: Tâm Hút (Kéo vào tâm)
		if gravity_zone:
			gravity_zone.position = Vector2(260, 440)
			gravity_zone.force_type = GravityZoneScript.ForceType.RADIAL_ATTRACT
			gravity_zone.field_color = Color(0.3, 1.0, 0.5, 0.30)
		# Vùng B: Tâm Đẩy (Đẩy tỏa tròn tiếp tuyến)
		if gravity_zone_b:
			gravity_zone_b.visible = true
			gravity_zone_b.process_mode = Node.PROCESS_MODE_INHERIT
			gravity_zone_b.position = Vector2(460, 600)
			gravity_zone_b.force_type = GravityZoneScript.ForceType.RADIAL_REPULSE
			gravity_zone_b.field_color = Color(0.9, 0.3, 0.95, 0.30)

	_update_mode_label()

	# 3. Đồng bộ EnemySpawner và GameManager
	if enemy_spawner:
		enemy_spawner.set_level(current_active_level)

	if game_manager:
		game_manager.reset_state()

	if web_bridge:
		web_bridge.show_toast("Khởi động Màn %d! Chuẩn bị phòng thủ." % current_active_level, "info")

# ========================================================
# TƯƠNG TÁC BOSS TITAN & BOSS HEALTH BAR
# ========================================================

func _on_boss_spawned(boss: Node2D) -> void:
	if boss_health_bar:
		boss_health_bar.visible = true
	if boss and "current_hp" in boss and "max_hp" in boss:
		_update_boss_health_ui(boss.current_hp, boss.max_hp)
	if sound_synth:
		sound_synth.play_game_over()
	if web_bridge:
		web_bridge.show_toast("⚠️ CHIẾN HẠM TITAN XUẤT HIỆN! MÁU 1500 HP!", "warning")
		web_bridge.trigger_haptic("heavy")

func _on_boss_hp_updated(curr: float, max_val: float) -> void:
	_update_boss_health_ui(curr, max_val)

func _update_boss_health_ui(curr: float, max_val: float) -> void:
	if label_boss_hp:
		label_boss_hp.text = "%d / %d HP" % [int(curr), int(max_val)]
	if boss_bar_fill:
		var ratio = clampf(curr / max_val, 0.0, 1.0)
		boss_bar_fill.anchor_right = ratio

func _on_boss_defeated() -> void:
	if boss_health_bar:
		boss_health_bar.visible = false
	if sound_synth:
		sound_synth.play_wave_cleared()
	if web_bridge:
		web_bridge.show_toast("🏆 CHIẾN HẠM TITAN ĐÃ BỊ HẠ GỤC HOÀN TOÀN!", "success")
		web_bridge.trigger_haptic("success")

# ========================================================
# ĐIỀU HƯỚNG LEVEL SELECT SCREEN
# ========================================================

func _open_level_select_modal() -> void:
	if level_select_modal:
		level_select_modal.visible = true
	_refresh_level_select_ui()
	if web_bridge:
		web_bridge.trigger_haptic("light")

func _close_level_select_modal() -> void:
	if level_select_modal:
		level_select_modal.visible = false
	if web_bridge:
		web_bridge.trigger_haptic("light")

func _refresh_level_select_ui() -> void:
	var is_lvl2_unlocked: bool = false
	if level_manager and level_manager.has_method("is_level_unlocked"):
		is_lvl2_unlocked = level_manager.is_level_unlocked(2)

	if label_status_level_1:
		var s1 = level_manager.level_stars.get("1", 0) if level_manager else 0
		label_status_level_1.text = "⭐ TIẾN TRÌNH: %s" % ("ĐÃ THẮNG (%d Sao)" % s1 if s1 > 0 else "ĐÃ MỞ")

	if label_status_level_2:
		var s2 = level_manager.level_stars.get("2", 0) if level_manager else 0
		if is_lvl2_unlocked:
			label_status_level_2.text = "⭐ TIẾN TRÌNH: %s" % ("ĐÃ THẮNG (%d Sao)" % s2 if s2 > 0 else "ĐÃ MỞ KHÓA")
			label_status_level_2.modulate = Color(0.3, 1.0, 0.6)
		else:
			label_status_level_2.text = "🔒 MỞ KHÓA SAU KHI THẮNG MÀN 1"
			label_status_level_2.modulate = Color(1.0, 0.75, 0.25)

	if btn_play_level_2:
		btn_play_level_2.disabled = not is_lvl2_unlocked
		btn_play_level_2.text = "CHƠI MÀN 2" if is_lvl2_unlocked else "🔒 CHƯA MỞ KHÓA"

func _select_and_start_level(lvl: int) -> void:
	_close_level_select_modal()
	setup_level(lvl)

func _on_btn_next_level_pressed() -> void:
	if popup_victory:
		popup_victory.visible = false
	_select_and_start_level(2)

# ========================================================
# EVENT HANDLERS TỪ ENEMY SPAWNER
# ========================================================

func _on_enemy_killed(reward: int) -> void:
	if game_manager:
		game_manager.add_gold(reward)
	FloatingCombatText.spawn(self, Vector2(randf_range(240, 560), randf_range(380, 620)), "+%dG" % reward, Color(1.0, 0.85, 0.2))

func _on_enemy_escaped() -> void:
	if game_manager:
		game_manager.take_base_damage(1)
	if cosmic_env:
		cosmic_env.trigger_base_damage_feedback()
	FloatingCombatText.spawn(self, Vector2(670, 520), "-1❤️", Color(1.0, 0.25, 0.35))

func _on_spawner_wave_started(wave_num: int, _total: int) -> void:
	if game_manager:
		game_manager.set_wave(wave_num)

func _on_spawner_wave_completed(wave_num: int) -> void:
	if web_bridge:
		web_bridge.show_toast("Dọn sạch Wave %d! Chuẩn bị wave tiếp theo." % wave_num, "success")

func _on_all_waves_completed() -> void:
	if game_manager:
		game_manager.trigger_victory()

# Button Callbacks
func _on_btn_speed_pressed() -> void:
	if game_manager:
		game_manager.toggle_speed()

func _on_btn_start_wave_pressed() -> void:
	if enemy_spawner:
		enemy_spawner.start_next_wave()

func _on_btn_restart_pressed() -> void:
	setup_level(current_active_level)

func _on_btn_directional_pressed() -> void:
	if gravity_zone:
		gravity_zone.force_type = GravityZoneScript.ForceType.DIRECTIONAL
		gravity_zone.force_direction = Vector2.UP
		gravity_zone.field_color = Color(0.2, 0.8, 1.0, 0.28)
		_update_mode_label()
		if web_bridge:
			web_bridge.trigger_haptic("light")

func _on_btn_repulse_pressed() -> void:
	if gravity_zone:
		gravity_zone.force_type = GravityZoneScript.ForceType.RADIAL_REPULSE
		gravity_zone.field_color = Color(0.9, 0.3, 0.95, 0.30)
		_update_mode_label()
		if web_bridge:
			web_bridge.trigger_haptic("medium")

func _on_btn_attract_pressed() -> void:
	if gravity_zone:
		gravity_zone.force_type = GravityZoneScript.ForceType.RADIAL_ATTRACT
		gravity_zone.field_color = Color(0.3, 1.0, 0.5, 0.30)
		_update_mode_label()
		if web_bridge:
			web_bridge.trigger_haptic("medium")

func _on_btn_3d_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/Main3D.tscn")

func _on_btn_exit_pressed() -> void:
	if web_bridge:
		web_bridge.exit_game()

func _update_mode_label() -> void:
	if not label_mode or not gravity_zone:
		return

	if current_active_level == 2:
		label_mode.text = "TRƯỜNG TRỌNG LỰC KÉP: VÙNG A HÚT • VÙNG B ĐẨY"
		label_mode.modulate = Color(0.85, 0.45, 1.0)
		return

	match gravity_zone.force_type:
		GravityZoneScript.ForceType.DIRECTIONAL:
			label_mode.text = "TRỌNG LỰC: ĐẨY LÊN"
			label_mode.modulate = Color(0.3, 0.85, 1.0)
		GravityZoneScript.ForceType.RADIAL_REPULSE:
			label_mode.text = "TRỌNG LỰC: ĐẨY TỎA TRÒN"
			label_mode.modulate = Color(1.0, 0.4, 0.9)
		GravityZoneScript.ForceType.RADIAL_ATTRACT:
			label_mode.text = "TRỌNG LỰC: HỐ ĐEN HÚT TÂM"
			label_mode.modulate = Color(0.4, 1.0, 0.6)
