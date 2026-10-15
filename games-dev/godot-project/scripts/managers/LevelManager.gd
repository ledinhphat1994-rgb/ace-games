class_name LevelManagerClass
extends Node

## LevelManager: Quản lý Hệ thống Đa Màn chơi & Lưu trữ Tiến trình (Save/Load)
## Hỗ trợ lưu trữ persistent qua FileAccess (IndexedDB trên Web / File JSON cục bộ)
## Đảm bảo F5 trình duyệt không bị mất màn chơi đã mở khóa và điểm số/sao.

signal level_unlocked(level_num: int)
signal level_completed(level_num: int, stars: int)

const SAVE_PATH: String = "user://level_progress.json"

var unlocked_level: int = 1
var current_level: int = 1
var level_stars: Dictionary = { "1": 0, "2": 0 }
var level_highscores: Dictionary = { "1": 0, "2": 0 }

@onready var web_bridge: Node = get_node_or_null("/root/WebBridge")

func _ready() -> void:
	load_progress()

## Kiểm tra xem màn chơi đã được mở khóa hay chưa
func is_level_unlocked(level_num: int) -> bool:
	return level_num <= unlocked_level

## Đặt màn chơi hiện tại cần chơi
func set_current_level(level_num: int) -> bool:
	if not is_level_unlocked(level_num):
		return false
	current_level = level_num
	return true

## Mở khóa màn chơi tiếp theo
func unlock_level(level_num: int) -> void:
	if level_num > unlocked_level:
		unlocked_level = level_num
		save_progress()
		emit_signal("level_unlocked", level_num)

## Ghi nhận hoàn thành màn chơi
func complete_level(level_num: int, stars: int = 3, score: int = 0) -> void:
	var key = str(level_num)
	var prev_stars = level_stars.get(key, 0)
	level_stars[key] = maxi(prev_stars, stars)

	var prev_score = level_highscores.get(key, 0)
	level_highscores[key] = maxi(prev_score, score)

	# Mở khóa màn kế tiếp nếu chưa mở
	if level_num + 1 > unlocked_level and level_num < 2:
		unlock_level(level_num + 1)
	else:
		save_progress()

	emit_signal("level_completed", level_num, stars)

## Lưu tiến trình chơi game vào JSON
func save_progress() -> void:
	var save_dict: Dictionary = {
		"unlocked_level": unlocked_level,
		"current_level": current_level,
		"level_stars": level_stars,
		"level_highscores": level_highscores
	}

	var json_str = JSON.stringify(save_dict)
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(json_str)
		file.close()

	# Đồng bộ dự phòng với localStorage trên Web nếu có
	if OS.has_feature("web"):
		JavaScriptBridge.eval("""
			try {
				localStorage.setItem('ace_anti_gravity_progress', %s);
			} catch (e) {
				console.warn('localStorage error:', e);
			}
		""" % JSON.stringify(json_str))

## Tải tiến trình chơi game từ JSON
func load_progress() -> void:
	var loaded: bool = false

	# 1. Thử đọc từ FileAccess chuẩn
	if FileAccess.file_exists(SAVE_PATH):
		var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
		if file:
			var content = file.get_as_text()
			file.close()
			var json = JSON.new()
			var err = json.parse(content)
			if err == OK and json.data is Dictionary:
				_apply_save_data(json.data)
				loaded = true

	# 2. Dự phòng đọc từ localStorage nếu chạy Web
	if not loaded and OS.has_feature("web"):
		var raw_js = JavaScriptBridge.eval("localStorage.getItem('ace_anti_gravity_progress');")
		if raw_js and raw_js is String and raw_js != "null":
			var json = JSON.new()
			var err = json.parse(raw_js)
			if err == OK and json.data is Dictionary:
				_apply_save_data(json.data)
				loaded = true

	# Nếu là lần đầu chơi, mặc định mở khóa Màn 1
	if not loaded:
		unlocked_level = 1
		current_level = 1

func _apply_save_data(data: Dictionary) -> void:
	if data.has("unlocked_level"):
		unlocked_level = clampi(int(data["unlocked_level"]), 1, 2)
	if data.has("current_level"):
		current_level = clampi(int(data["current_level"]), 1, 2)
	if data.has("level_stars") and data["level_stars"] is Dictionary:
		level_stars = data["level_stars"]
	if data.has("level_highscores") and data["level_highscores"] is Dictionary:
		level_highscores = data["level_highscores"]
