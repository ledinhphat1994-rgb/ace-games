class_name EnemySpawner
extends Node2D

## EnemySpawner: Bộ điều khiển sinh quái & Quản lý 5 Đợt Quái (Wave Manager)
## Điều phối các chủng loại quái vật: Normal, Scout (Trinh sát), Tank (Thiết giáp).
## Quản lý hàng đợi xuất kích và phát tín hiệu theo dõi tiến độ đợt quái.

const EnemyScript = preload("Enemy.gd")

signal enemy_spawned(enemy: Node2D)
signal enemy_killed(reward: int)
signal enemy_escaped()
signal wave_started(wave_num: int, total_enemies: int)
signal wave_completed(wave_num: int)
signal all_waves_completed()
signal boss_spawned(boss: Node2D)
signal boss_hp_updated(current_hp: float, max_hp: float)
signal boss_defeated()

@export var enemy_scene: PackedScene = preload("../../scenes/enemies/Enemy.tscn")
@export var spawn_point: Marker2D
@export var enemies_container: Node2D
@export var current_level: int = 1

const MAX_WAVES: int = 5

var current_wave: int = 0
var is_wave_active: bool = false
var _wave_queue: Array[int] = [] ## Hàng đợi các Type cần sinh
var _spawn_delay_timer: float = 0.0
var _spawn_interval: float = 0.65 ## Khoảng cách giữa 2 quái xuất kích trong wave
var _total_enemies_in_wave: int = 0
var _spawned_in_wave: int = 0

# Thống kê chi tiết quái đã tiêu diệt
var killed_normal_count: int = 0
var killed_scout_count: int = 0
var killed_tank_count: int = 0
var killed_boss_count: int = 0
var total_killed_count: int = 0

@onready var web_bridge: Node = get_node_or_null("/root/WebBridge")

func _ready() -> void:
	if not enemies_container:
		enemies_container = self

func _process(delta: float) -> void:
	# 1. Sinh quái từ hàng đợi đợt quái
	if not _wave_queue.is_empty():
		_spawn_delay_timer += delta
		if _spawn_delay_timer >= _spawn_interval:
			_spawn_delay_timer = 0.0
			var next_type: int = _wave_queue.pop_front()
			_spawn_enemy_of_type(next_type)

	# 2. Kiểm tra hoàn thành wave khi hàng đợi rỗng và không còn quái sống trên sân
	elif is_wave_active:
		var active_count: int = get_active_enemy_count()
		if active_count == 0:
			is_wave_active = false
			_on_wave_cleared()

## Đặt màn chơi hiện tại (Màn 1 hoặc Màn 2)
func set_level(lvl: int) -> void:
	current_level = lvl
	current_wave = 0
	is_wave_active = false
	_wave_queue.clear()

## Khởi động Wave kế tiếp (1 đến 5)
func start_next_wave() -> bool:
	if is_wave_active or current_wave >= MAX_WAVES:
		return false

	current_wave += 1
	return start_wave(current_wave)

## Kích hoạt cụ thể một Wave
func start_wave(wave_num: int) -> bool:
	if wave_num < 1 or wave_num > MAX_WAVES:
		return false

	current_wave = wave_num
	is_wave_active = true
	_wave_queue.clear()
	_spawn_delay_timer = 0.0

	# Xây dựng danh sách quái theo từng Màn chơi (Level)
	if current_level == 1:
		_setup_level_1_wave(current_wave)
	else:
		_setup_level_2_wave(current_wave)

	_total_enemies_in_wave = _wave_queue.size()
	_spawned_in_wave = 0

	emit_signal("wave_started", current_wave, _total_enemies_in_wave)

	if web_bridge:
		web_bridge.trigger_haptic("medium")
		web_bridge.show_toast("ĐỢT %d BẮT ĐẦU (%d QUÁI VẬT)!" % [current_wave, _total_enemies_in_wave], "info")

	return true

## Cấu hình Wave Màn 1: Vành Đai Alpha (Thử thách cơ bản)
func _setup_level_1_wave(w: int) -> void:
	match w:
		1:
			for i in range(8):
				_wave_queue.append(EnemyScript.Type.NORMAL)
		2:
			for i in range(3):
				_wave_queue.append(EnemyScript.Type.NORMAL)
			for i in range(6):
				_wave_queue.append(EnemyScript.Type.SCOUT)
			for i in range(2):
				_wave_queue.append(EnemyScript.Type.NORMAL)
		3:
			for i in range(2):
				_wave_queue.append(EnemyScript.Type.TANK)
			for i in range(4):
				_wave_queue.append(EnemyScript.Type.NORMAL)
			for i in range(2):
				_wave_queue.append(EnemyScript.Type.TANK)
			for i in range(2):
				_wave_queue.append(EnemyScript.Type.NORMAL)
		4:
			for i in range(2):
				_wave_queue.append(EnemyScript.Type.TANK)
			for i in range(5):
				_wave_queue.append(EnemyScript.Type.SCOUT)
			for i in range(2):
				_wave_queue.append(EnemyScript.Type.TANK)
			for i in range(5):
				_wave_queue.append(EnemyScript.Type.SCOUT)
		5:
			for i in range(4):
				_wave_queue.append(EnemyScript.Type.NORMAL)
			for i in range(6):
				_wave_queue.append(EnemyScript.Type.SCOUT)
			for i in range(3):
				_wave_queue.append(EnemyScript.Type.TANK)
			for i in range(6):
				_wave_queue.append(EnemyScript.Type.SCOUT)
			for i in range(3):
				_wave_queue.append(EnemyScript.Type.TANK)
			for i in range(4):
				_wave_queue.append(EnemyScript.Type.NORMAL)

## Cấu hình Wave Màn 2: Hố Đen Kép Beta (Xuất hiện BOSS TITAN ở Wave 5)
func _setup_level_2_wave(w: int) -> void:
	match w:
		1:
			for i in range(6):
				_wave_queue.append(EnemyScript.Type.SCOUT)
			for i in range(4):
				_wave_queue.append(EnemyScript.Type.NORMAL)
		2:
			for i in range(8):
				_wave_queue.append(EnemyScript.Type.SCOUT)
			for i in range(4):
				_wave_queue.append(EnemyScript.Type.TANK)
			for i in range(4):
				_wave_queue.append(EnemyScript.Type.NORMAL)
		3:
			for i in range(6):
				_wave_queue.append(EnemyScript.Type.TANK)
			for i in range(8):
				_wave_queue.append(EnemyScript.Type.SCOUT)
			for i in range(4):
				_wave_queue.append(EnemyScript.Type.NORMAL)
		4:
			for i in range(8):
				_wave_queue.append(EnemyScript.Type.TANK)
			for i in range(10):
				_wave_queue.append(EnemyScript.Type.SCOUT)
			for i in range(6):
				_wave_queue.append(EnemyScript.Type.NORMAL)
		5:
			# WAVE 5 MÀN 2: TRẬN ĐẤU TRÙM "CHIẾN HẠM TITAN"
			# 4 Scout tiên phong -> 1 BOSS TITAN -> 3 Tank bọc hậu -> 6 Scout yểm trợ
			for i in range(4):
				_wave_queue.append(EnemyScript.Type.SCOUT)
			_wave_queue.append(EnemyScript.Type.BOSS_TITAN)
			for i in range(3):
				_wave_queue.append(EnemyScript.Type.TANK)
			for i in range(6):
				_wave_queue.append(EnemyScript.Type.SCOUT)

## Sinh quái vật theo chủng loại
func _spawn_enemy_of_type(type_index: int) -> CharacterBody2D:
	if not enemy_scene or not enemies_container:
		return null

	var enemy = enemy_scene.instantiate()
	if not enemy:
		return null

	# Thiết lập archetype cho quái
	if enemy.has_method("setup_archetype"):
		enemy.setup_archetype(type_index)

	# Điểm xuất phát bên trái màn hình với độ lệch Y ngẫu nhiên nhẹ
	var origin: Vector2 = spawn_point.global_position if spawn_point else Vector2(60, 520)
	var offset_y: float = randf_range(-30.0, 30.0)
	enemy.global_position = origin + Vector2(0, offset_y)

	# Kết nối tín hiệu của quái vật
	if enemy.has_signal("died"):
		enemy.died.connect(_on_enemy_died)
	if enemy.has_signal("escaped"):
		enemy.escaped.connect(_on_enemy_escaped)

	# Kết nối tín hiệu Boss nếu là BOSS_TITAN
	if enemy.get("enemy_type") == EnemyScript.Type.BOSS_TITAN:
		if enemy.has_signal("boss_hp_changed"):
			enemy.boss_hp_changed.connect(func(curr, max_val): emit_signal("boss_hp_updated", curr, max_val))
		if enemy.has_signal("boss_defeated"):
			enemy.boss_defeated.connect(func(_b): emit_signal("boss_defeated"))
		emit_signal("boss_spawned", enemy)
		emit_signal("boss_hp_updated", enemy.current_hp, enemy.max_hp)

	enemies_container.add_child(enemy)
	_spawned_in_wave += 1
	emit_signal("enemy_spawned", enemy)
	return enemy as CharacterBody2D

## Khi quái vật bị tiêu diệt
func _on_enemy_died(enemy: Node2D, reward: int) -> void:
	total_killed_count += 1
	if enemy and "enemy_type" in enemy:
		match enemy.enemy_type:
			EnemyScript.Type.NORMAL:
				killed_normal_count += 1
			EnemyScript.Type.SCOUT:
				killed_scout_count += 1
			EnemyScript.Type.TANK:
				killed_tank_count += 1
			EnemyScript.Type.BOSS_TITAN:
				killed_boss_count += 1
				emit_signal("boss_defeated")
	emit_signal("enemy_killed", reward)

## Trả về từ điển thống kê tiêu diệt quái vật
func get_kill_stats() -> Dictionary:
	return {
		"normal": killed_normal_count,
		"scout": killed_scout_count,
		"tank": killed_tank_count,
		"boss": killed_boss_count,
		"total": total_killed_count
	}

## Khi quái vật bay thoát qua cạnh phải
func _on_enemy_escaped(_enemy: Node2D) -> void:
	emit_signal("enemy_escaped")

## Xử lý khi hoàn thành quét sạch một Wave
func _on_wave_cleared() -> void:
	emit_signal("wave_completed", current_wave)

	if web_bridge:
		web_bridge.trigger_haptic("success")
		web_bridge.show_toast("ĐỢT %d HOÀN THÀNH!" % current_wave, "success")

	if current_wave >= MAX_WAVES:
		emit_signal("all_waves_completed")

## Đếm số quái vật đang còn sống trên màn hình
func get_active_enemy_count() -> int:
	if not enemies_container:
		return 0
	var count = 0
	for child in enemies_container.get_children():
		if is_instance_valid(child) and not child.is_queued_for_deletion():
			if child.is_in_group("enemies") or child.get_script() == EnemyScript:
				count += 1
	return count

## Hàm tương thích ngược
func spawn_wave(count: int = 5) -> void:
	for i in range(count):
		_wave_queue.append(EnemyScript.Type.NORMAL)
	is_wave_active = true
