extends "../../addons/gut/test.gd"

const TurretScript = preload("../../scripts/towers/Turret.gd")
const PathEnemyScript = preload("../../scripts/enemies/PathEnemy.gd")

func test_turret_target_locking_and_priority() -> void:
	var turret = TurretScript.new()
	turret.attack_range = 300.0
	turret.attack_cooldown = 0.5
	turret.position = Vector2(0, 0)
	add_child_autofree(turret)

	# Tạo Path2D có đường cong Curve2D trên scene tree
	var path2d = Path2D.new()
	var curve = Curve2D.new()
	curve.add_point(Vector2(0, 0))
	curve.add_point(Vector2(500, 0))
	path2d.curve = curve
	add_child_autofree(path2d)

	# Tạo 2 kẻ địch PathFollow2D nằm trong Path2D
	var enemy_a = PathEnemyScript.new()
	path2d.add_child(enemy_a)
	enemy_a.progress_ratio = 0.4
	enemy_a.position = Vector2(100, 0)

	var enemy_b = PathEnemyScript.new()
	path2d.add_child(enemy_b)
	enemy_b.progress_ratio = 0.75
	enemy_b.position = Vector2(150, 0)

	# Đưa cả 2 vào tầm ngắm
	turret._on_target_entered(enemy_a)
	turret._on_target_entered(enemy_b)

	turret._update_target_locking()
	assert_eq(turret.current_target, enemy_b, "Trụ ưu tiên quái có progress_ratio cao nhất (Enemy B = 0.75)")

	# Đưa quái C mới vào với progress_ratio cao hơn nữa (0.9)
	var enemy_c = PathEnemyScript.new()
	path2d.add_child(enemy_c)
	enemy_c.progress_ratio = 0.9
	enemy_c.position = Vector2(120, 0)
	turret._on_target_entered(enemy_c)

	# Cơ chế Target Locking: KHÔNG đổi quái khi mục tiêu hiện tại (Enemy B) vẫn còn sống và trong tầm
	turret._update_target_locking()
	assert_eq(turret.current_target, enemy_b, "Target Locking: Trụ giữ chặt mục tiêu đã khóa (Enemy B), không quét đổi quái mỗi frame!")

	# Khi Enemy B bị tiêu diệt hoặc rời tầm
	turret._on_target_exited(enemy_b)
	turret._update_target_locking()
	assert_eq(turret.current_target, enemy_c, "Khi Enemy B rời tầm/chết, trụ khóa ngay sang mục tiêu có progress_ratio cao nhất kế tiếp (Enemy C = 0.9)")

func test_turret_smooth_rotation_and_5_degree_firing_gate() -> void:
	var turret = TurretScript.new()
	turret.attack_range = 300.0
	turret.attack_cooldown = 0.1
	turret.rotation_speed = 6.0
	turret.position = Vector2(0, 0)
	add_child_autofree(turret)

	# Tạo Base tĩnh và GunHead
	var base = Node2D.new()
	base.name = "Base"
	turret.add_child(base)
	turret.base_node = base

	var gun_head = Node2D.new()
	gun_head.name = "GunHead"
	gun_head.rotation = 0.0 # Hướng ban đầu: 0 rad (sang phải)
	turret.add_child(gun_head)
	turret.gun_head = gun_head

	# Đặt mục tiêu ở góc 90 độ (phía dưới) trên Path2D
	var path_target = Path2D.new()
	var curve_t = Curve2D.new()
	curve_t.add_point(Vector2(0, 0))
	curve_t.add_point(Vector2(0, 300))
	path_target.curve = curve_t
	add_child_autofree(path_target)

	var target = PathEnemyScript.new()
	path_target.add_child(target)
	target.progress_ratio = 0.5
	target.position = Vector2(0, 150)

	turret._on_target_entered(target)
	turret._update_target_locking()

	# Ban đầu nòng ở 0 độ, mục tiêu ở 90 độ (lệch ~85 độ > 5 độ)
	var fired_targets: Array[Node2D] = []
	turret.fired.connect(func(t): fired_targets.append(t))

	# Frame 1: delta nhỏ (0.016s), nòng mới bắt đầu xoay cơ khí, chưa tới 5 độ
	turret._physics_process(0.016)
	assert_gt(gun_head.rotation, 0.0, "Nòng súng bắt đầu xoay mượt mà theo gia tốc cơ học")
	assert_eq(fired_targets.size(), 0, "Chưa nhả đạn vì góc lệch > 5 độ")
	assert_eq(base.rotation, 0.0, "Node Base hoàn toàn tĩnh (0.0 rad)")

	# Quay cưỡng bức vào sát mục tiêu (lệch 2 độ = 0.035 rad < 5 độ = 0.087 rad)
	gun_head.rotation = (PI / 2.0) - deg_to_rad(2.0)
	turret._cooldown_timer = 0.0
	turret._physics_process(0.016)

	assert_eq(fired_targets.size(), 1, "Khai hỏa thành công khi góc lệch nhỏ hơn 5 độ (lệch 2 độ)!")
	assert_eq(base.rotation, 0.0, "Node Base vẫn tĩnh 100% khi khai hỏa")

func test_path_enemy_properties_and_step_sync() -> void:
	var enemy = PathEnemyScript.new()
	enemy.max_hp = 100.0
	enemy.base_speed = 80.0
	enemy.current_speed = 80.0
	enemy.base_walk_speed = 80.0
	add_child_autofree(enemy)

	# 1. Kiểm tra rotates = false
	assert_false(enemy.rotates, "PathFollow2D BẮT BUỘC đặt rotates = false để chống bẻ góc giật cục và lộn ngược")

	# 2. Kiểm tra Offset Spacing
	assert_true(enemy.h_offset >= -15.0 and enemy.h_offset <= 15.0, "h_offset được sinh ngẫu nhiên trong khoảng [-15.0, 15.0] để giảm dồn cục")

	# 3. Tạo AnimationPlayer giả lập
	var anim_player = AnimationPlayer.new()
	anim_player.name = "AnimationPlayer"
	var anim_lib = AnimationLibrary.new()
	var anim = Animation.new()
	anim.length = 1.0
	anim_lib.add_animation("walk", anim)
	anim_player.add_animation_library("", anim_lib)
	enemy.add_child(anim_player)
	enemy.anim_player = anim_player
	anim_player.play("walk")

	# Khi tốc độ chuẩn 80 / 80 -> speed_scale = 1.0
	enemy._sync_step_animation()
	assert_almost_eq(anim_player.speed_scale, 1.0, 0.01, "Đồng bộ bước chân: tốc độ chuẩn tương ứng speed_scale 1.0")

	# Khi bị làm chậm 50% (current_speed = 40.0) -> speed_scale = 0.5
	enemy.current_speed = 40.0
	enemy._sync_step_animation()
	assert_almost_eq(anim_player.speed_scale, 0.5, 0.01, "Đồng bộ bước chân: bị làm chậm 50% thì nhịp bước chân giảm 50% (triệt tiêu trượt chân)")

	# Khi bị stun (current_speed = 0.0) -> speed_scale = 0.0
	enemy.current_speed = 0.0
	enemy._sync_step_animation()
	assert_eq(anim_player.speed_scale, 0.0, "Đồng bộ bước chân: khi dừng thì bước chân dừng hẳn")
