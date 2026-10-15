extends "../../addons/gut/test.gd"

const LevelManagerScript = preload("../../scripts/managers/LevelManager.gd")
const EnemyScript = preload("../../scripts/enemies/Enemy.gd")
const PlasmaTowerScene = preload("../../scenes/towers/PlasmaTower.tscn")

func test_level_manager_unlock_and_save() -> void:
	var lm = LevelManagerScript.new()
	add_child_autofree(lm)

	# Khởi đầu Màn 1 đã mở, Màn 2 bị khóa
	lm.unlocked_level = 1
	lm.current_level = 1
	lm.level_stars = {"1": 0, "2": 0}

	assert_true(lm.is_level_unlocked(1), "Màn 1 phải mở khóa mặc định")
	assert_false(lm.is_level_unlocked(2), "Màn 2 ban đầu bị khóa")

	# Không thể chọn Màn 2 khi chưa mở khóa
	var can_set = lm.set_current_level(2)
	assert_false(can_set, "Không thể chuyển sang Màn 2 khi chưa mở khóa")

	# Chiến thắng Màn 1 với 3 sao
	lm.complete_level(1, 3, 450)
	assert_eq(lm.level_stars.get("1"), 3, "Màn 1 ghi nhận 3 sao")
	assert_true(lm.is_level_unlocked(2), "Chiến thắng Màn 1 phải tự động mở khóa Màn 2")

	# Bây giờ có thể chọn Màn 2
	var can_set_2 = lm.set_current_level(2)
	assert_true(can_set_2, "Đã có thể chuyển sang Màn 2 thành công")
	assert_eq(lm.current_level, 2, "Màn hiện tại là Màn 2")

func test_boss_titan_stats_and_emp_resistance() -> void:
	var boss = EnemyScript.new()
	add_child_autofree(boss)
	boss.setup_archetype(EnemyScript.Type.BOSS_TITAN)

	# Kiểm tra chỉ số Boss Titan
	assert_eq(boss.max_hp, 1500.0, "Boss Titan có 1500 HP máu cực đại")
	assert_eq(boss.current_hp, 1500.0, "Máu khởi đầu đầy đủ 1500 HP")
	assert_eq(boss.gold_reward, 150, "Hạ gục Boss Titan thưởng 150 Vàng")
	assert_eq(boss.knockback_resist, 0.85, "Kháng 85% lực đẩy lùi")

	# Thử nghiệm kỹ năng Sóng Xung Kích EMP lên Boss
	boss.apply_stun(2.5)
	# Boss Titan kháng hoàn toàn EMP Stun: không bị choáng (stun_timer = 0), chỉ bị giảm tốc độ 40% (slow_factor = 0.6)
	assert_eq(boss.stun_timer, 0.0, "Boss Titan kháng hoàn toàn EMP Stun (không bị đóng băng)")
	assert_eq(boss._slow_factor, 0.6, "Boss Titan bị giảm 40% tốc độ khi trúng EMP")
	assert_gt(boss._slow_timer, 0.0, "Thời gian làm chậm có hiệu lực")

func test_boss_titan_paralyze_tower() -> void:
	var tower = PlasmaTowerScene.instantiate()
	add_child_autofree(tower)
	tower.add_to_group("towers")

	assert_eq(tower.paralyze_timer, 0.0, "Tháp ban đầu hoạt động bình thường")

	# Boss phát luồng xung điện làm tê liệt tháp trong 3 giây
	tower.apply_paralyze(3.0)
	assert_eq(tower.paralyze_timer, 3.0, "Tháp bị tê liệt trong 3 giây")
	assert_false(tower.can_attack(), "Tháp không thể tấn công khi đang bị tê liệt")
