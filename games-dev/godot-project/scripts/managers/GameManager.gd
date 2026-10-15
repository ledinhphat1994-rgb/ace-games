class_name GameManager
extends Node

## GameManager: Quản lý Kinh tế, Máu Căn Cứ và Vòng Lặp Trạng Thái Trò Chơi
## Điều phối Vàng (Gold), Máu (Base Health), Wave, Game Over và Victory.

signal health_changed(current: int, max_hp: int)
signal gold_changed(current_gold: int)
signal wave_updated(wave_num: int, max_wave: int)
signal game_over_triggered()
signal victory_triggered()
signal speed_changed(new_speed: float)
signal skill_cooldown_updated(emp_cd: float, emp_max: float, bh_cd: float, bh_max: float)

enum GameState {
	PLAYING,
	PAUSED,
	VICTORY,
	GAME_OVER
}

@export var max_health: int = 20
@export var starting_gold: int = 200
@export var max_waves: int = 5

const EMP_MAX_CD: float = 20.0
const BLACKHOLE_MAX_CD: float = 30.0

var base_health: int = 20
var gold: int = 200
var current_wave: int = 1
var state: GameState = GameState.PLAYING
var current_speed: float = 1.0

# Thống kê và Kỹ năng
var total_gold_earned: int = 200
var match_time: float = 0.0
var emp_cooldown: float = 0.0
var blackhole_cooldown: float = 0.0

@onready var web_bridge: Node = get_node_or_null("/root/WebBridge")

func _ready() -> void:
	reset_game()

func _process(delta: float) -> void:
	if state == GameState.PLAYING:
		match_time += delta
		var cd_changed: bool = false
		if emp_cooldown > 0.0:
			emp_cooldown = maxf(0.0, emp_cooldown - delta)
			cd_changed = true
		if blackhole_cooldown > 0.0:
			blackhole_cooldown = maxf(0.0, blackhole_cooldown - delta)
			cd_changed = true
		if cd_changed:
			emit_signal("skill_cooldown_updated", emp_cooldown, EMP_MAX_CD, blackhole_cooldown, BLACKHOLE_MAX_CD)

func reset_game() -> void:
	base_health = max_health
	gold = starting_gold
	total_gold_earned = starting_gold
	match_time = 0.0
	emp_cooldown = 0.0
	blackhole_cooldown = 0.0
	current_wave = 1
	state = GameState.PLAYING
	current_speed = 1.0
	Engine.time_scale = 1.0

	emit_signal("health_changed", base_health, max_health)
	emit_signal("gold_changed", gold)
	emit_signal("wave_updated", current_wave, max_waves)
	emit_signal("speed_changed", current_speed)
	emit_signal("skill_cooldown_updated", emp_cooldown, EMP_MAX_CD, blackhole_cooldown, BLACKHOLE_MAX_CD)

## Trừ máu khi quái vật bay thoát qua cạnh phải căn cứ
func take_base_damage(amount: int = 1) -> void:
	if state != GameState.PLAYING:
		return

	base_health = maxi(0, base_health - amount)
	emit_signal("health_changed", base_health, max_health)

	if web_bridge:
		web_bridge.trigger_haptic("heavy")

	if base_health <= 0:
		trigger_game_over()

## Thêm vàng (tiêu diệt quái hoặc thưởng wave)
func add_gold(amount: int) -> void:
	if state != GameState.PLAYING and state != GameState.PAUSED:
		return
	gold += amount
	total_gold_earned += amount
	emit_signal("gold_changed", gold)

	if web_bridge:
		web_bridge.trigger_haptic("light")

## Kiểm tra và trừ vàng khi mua trụ hoặc nâng cấp
func spend_gold(amount: int) -> bool:
	if gold < amount:
		if web_bridge:
			web_bridge.trigger_haptic("selection")
			web_bridge.show_toast("Không đủ vàng! Cần %d vàng." % amount, "warning")
		return false

	gold -= amount
	emit_signal("gold_changed", gold)

	if web_bridge:
		web_bridge.trigger_haptic("medium")
	return true

## Kích hoạt kỹ năng Sóng xung kích EMP
func can_use_emp() -> bool:
	return emp_cooldown <= 0.0 and state == GameState.PLAYING

func use_emp() -> bool:
	if not can_use_emp():
		return false
	emp_cooldown = EMP_MAX_CD
	emit_signal("skill_cooldown_updated", emp_cooldown, EMP_MAX_CD, blackhole_cooldown, BLACKHOLE_MAX_CD)
	return true

## Kích hoạt kỹ năng Quá tải Hố Đen
func can_use_blackhole() -> bool:
	return blackhole_cooldown <= 0.0 and state == GameState.PLAYING

func use_blackhole() -> bool:
	if not can_use_blackhole():
		return false
	blackhole_cooldown = BLACKHOLE_MAX_CD
	emit_signal("skill_cooldown_updated", emp_cooldown, EMP_MAX_CD, blackhole_cooldown, BLACKHOLE_MAX_CD)
	return true

## Trả về thời gian ván đấu định dạng mm:ss
func get_formatted_match_time() -> String:
	var total_sec = int(match_time)
	var mins = int(float(total_sec) / 60.0)
	var secs = total_sec % 60
	return "%02d:%02d" % [mins, secs]

## Chuyển sang Wave kế tiếp
func set_wave(wave_num: int) -> void:
	current_wave = clampi(wave_num, 1, max_waves)
	emit_signal("wave_updated", current_wave, max_waves)

## Đổi tốc độ game (x1 hoặc x2)
func toggle_speed() -> float:
	if current_speed <= 1.0:
		current_speed = 2.0
	else:
		current_speed = 1.0

	Engine.time_scale = current_speed
	emit_signal("speed_changed", current_speed)

	if web_bridge:
		web_bridge.trigger_haptic("selection")
		web_bridge.show_toast("Tốc độ trò chơi: x%.0f" % current_speed, "info")

	return current_speed

## Kích hoạt thua cuộc
func trigger_game_over() -> void:
	if state == GameState.GAME_OVER:
		return
	state = GameState.GAME_OVER
	emit_signal("game_over_triggered")

	if web_bridge:
		web_bridge.trigger_haptic("heavy")
		web_bridge.show_toast("CĂN CỨ BỊ PHÁ HỦY! TRÒ CHƠI KẾT THÚC.", "error")

## Kích hoạt chiến thắng
func trigger_victory() -> void:
	if state == GameState.VICTORY or state == GameState.GAME_OVER:
		return
	state = GameState.VICTORY
	emit_signal("victory_triggered")

	if web_bridge:
		web_bridge.trigger_haptic("success")
		web_bridge.show_toast("CHIẾN THẮNG! BẢO VỆ CĂN CỨ HOÀN THÀNH!", "success")

## Đặt lại trạng thái màn chơi về ban đầu mà không tải lại scene
func reset_state() -> void:
	Engine.time_scale = 1.0
	base_health = max_health
	gold = 200
	current_wave = 1
	match_time = 0.0
	state = GameState.PLAYING
	emp_cooldown = 0.0
	blackhole_cooldown = 0.0
	emit_signal("health_changed", base_health, max_health)
	emit_signal("gold_changed", gold)
	emit_signal("wave_updated", current_wave, max_waves)
	emit_signal("skill_cooldown_updated", emp_cooldown, EMP_MAX_CD, blackhole_cooldown, BLACKHOLE_MAX_CD)
	emit_signal("speed_changed", 1.0)

## Chơi lại màn chơi
func restart() -> void:
	reset_state()
