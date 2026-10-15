extends "../../addons/gut/test.gd"

## TestGameManager: Unit test kiểm thử logic kinh tế và máu căn cứ bằng GUT
const GameManager = preload("../../scripts/managers/GameManager.gd")

var _gm: Node = null

func before_each() -> void:
	_gm = GameManager.new()
	add_child_autofree(_gm)
	_gm._ready()

func test_initial_values() -> void:
	assert_eq(_gm.base_health, 20, "Máu căn cứ ban đầu phải là 20")
	assert_eq(_gm.gold, 200, "Vàng khởi điểm phải là 200")
	assert_eq(_gm.current_wave, 1, "Wave ban đầu phải là 1")
	assert_eq(_gm.state, GameManager.GameState.PLAYING, "Trạng thái ban đầu phải là PLAYING")

func test_take_damage() -> void:
	_gm.take_base_damage(3)
	assert_eq(_gm.base_health, 17, "Sau khi trừ 3 mạng phải còn 17")

func test_spend_gold_success() -> void:
	var success: bool = _gm.spend_gold(60)
	assert_true(success, "Phải mua được trụ khi đủ vàng")
	assert_eq(_gm.gold, 140, "Số vàng sau khi mua 60G phải còn 140G")

func test_spend_gold_insufficient() -> void:
	var success: bool = _gm.spend_gold(500)
	assert_false(success, "Không được mua khi thiếu vàng")
	assert_eq(_gm.gold, 200, "Số vàng không được đổi khi mua thất bại")

func test_game_over_on_zero_health() -> void:
	_gm.take_base_damage(25)
	assert_eq(_gm.base_health, 0, "Máu không được âm")
	assert_eq(_gm.state, GameManager.GameState.GAME_OVER, "Trạng thái phải chuyển sang GAME_OVER")
