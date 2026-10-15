extends "../../addons/gut/test.gd"

const GameManagerScript = preload("../../scripts/managers/GameManager.gd")
const PlasmaTowerScene = preload("../../scenes/towers/PlasmaTower.tscn")
const RailgunTowerScript = preload("../../scripts/towers/RailgunTower.gd")
const VoidPylonTowerScript = preload("../../scripts/towers/VoidPylonTower.gd")
const EnemyScript = preload("../../scripts/enemies/Enemy.gd")

func test_tower_upgrade_and_sell() -> void:
	var tower = PlasmaTowerScene.instantiate()
	add_child_autofree(tower)

	assert_eq(tower.level, 1, "Trụ khởi đầu ở Cấp 1")
	assert_eq(tower.base_cost, 60, "Giá gốc Plasma là 60G")
	assert_eq(tower.total_invested, 60, "Tổng đầu tư ban đầu là 60G")

	# Chi phí nâng cấp cấp 2 = 70% giá gốc = 42G
	assert_eq(tower.get_upgrade_cost(), 42, "Chi phí nâng Cấp 2 là 42G")
	assert_true(tower.can_upgrade(), "Trụ có thể nâng cấp")

	var initial_dmg = tower.base_damage
	var initial_range = tower.attack_range
	var ok2 = tower.upgrade()
	assert_true(ok2, "Thăng cấp lên Cấp 2 thành công")
	assert_eq(tower.level, 2, "Trụ hiện ở Cấp 2")
	assert_eq(tower.total_invested, 102, "Tổng đầu tư sau cấp 2 là 102G")
	assert_gt(tower.base_damage, initial_dmg, "Sát thương tăng khi lên Cấp 2")
	assert_gt(tower.attack_range, initial_range, "Tầm bắn tăng khi lên Cấp 2")

	# Chi phí nâng cấp cấp 3 = 120% giá gốc = 72G
	assert_eq(tower.get_upgrade_cost(), 72, "Chi phí nâng Cấp 3 là 72G")
	var ok3 = tower.upgrade()
	assert_true(ok3, "Thăng cấp lên Cấp 3 thành công")
	assert_eq(tower.level, 3, "Trụ hiện ở Cấp 3")
	assert_eq(tower.total_invested, 174, "Tổng đầu tư sau cấp 3 là 174G")
	assert_false(tower.can_upgrade(), "Cấp 3 là tối đa, không thể nâng thêm")

	# Bán trụ hoàn lại 70% tổng tiền đã đầu tư = int(174 * 0.7) = 121G
	var sell_val = tower.get_sell_value()
	assert_eq(sell_val, 121, "Bán trụ cấp 3 hoàn lại 121 Vàng (70% của 174G)")

func test_active_skills_and_stats() -> void:
	var gm = GameManagerScript.new()
	add_child_autofree(gm)

	assert_true(gm.can_use_emp(), "Sẵn sàng dùng EMP ban đầu")
	assert_true(gm.can_use_blackhole(), "Sẵn sàng dùng Hố Đen ban đầu")

	var ok_emp = gm.use_emp()
	assert_true(ok_emp, "Kích hoạt EMP thành công")
	assert_eq(gm.emp_cooldown, 20.0, "Cooldown EMP là 20 giây")
	assert_false(gm.can_use_emp(), "Đang hồi chiêu không thể dùng tiếp")

	var ok_bh = gm.use_blackhole()
	assert_true(ok_bh, "Kích hoạt Quá tải Hố Đen thành công")
	assert_eq(gm.blackhole_cooldown, 30.0, "Cooldown Hố Đen là 30 giây")
	assert_false(gm.can_use_blackhole(), "Đang hồi chiêu không thể dùng tiếp")

func test_enemy_stun_and_force_attract() -> void:
	var enemy = EnemyScript.new()
	add_child_autofree(enemy)

	enemy.apply_stun(2.5)
	assert_eq(enemy.stun_timer, 2.5, "Thời gian choáng EMP là 2.5 giây")

	enemy.apply_force_attract(Vector2(360, 520), 3.0)
	assert_eq(enemy.force_attract_timer, 3.0, "Thời gian quá tải hố đen là 3.0 giây")
	assert_eq(enemy.force_attract_target, Vector2(360, 520), "Tâm hút hố đen chuẩn xác")
