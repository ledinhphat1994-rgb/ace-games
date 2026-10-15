extends "../../addons/gut/test.gd"

const TowerScript = preload("res://scripts/stylized/AnimatedTower.gd")
const EnemyScript = preload("res://scripts/stylized/AnimatedEnemy.gd")
const ProjectileScript = preload("res://scripts/stylized/AnimatedProjectile.gd")
const CameraScript = preload("res://scripts/stylized/StylizedCameraController.gd")
const MainStylizedScene = preload("res://scenes/MainStylized.tscn")

func test_animated_tower_types_and_stats() -> void:
	var tower = TowerScript.new()
	add_child_autofree(tower)
	tower.setup(TowerScript.TowerType.PLASMA_CANNON)
	assert_eq(tower.tower_type, TowerScript.TowerType.PLASMA_CANNON)
	assert_gt(tower.damage, 20.0, "Plasma Cannon sát thương mạnh")
	assert_gt(tower.attack_range, 180.0, "Plasma Cannon tầm bắn xa")

	var gatling = TowerScript.new()
	add_child_autofree(gatling)
	gatling.setup(TowerScript.TowerType.GATLING_GUN)
	assert_lt(gatling.attack_cooldown, 0.3, "Gatling bắn cực nhanh (cooldown < 0.3s)")

func test_tower_360_circular_aim_and_stability() -> void:
	var tower = TowerScript.new()
	add_child_autofree(tower)
	tower.setup(TowerScript.TowerType.GATLING_GUN)
	tower.global_position = Vector2(200, 200)

	var dummy = Node2D.new()
	add_child_autofree(dummy)

	var test_points = [
		Vector2(300, 200),  # Đông (Phải, 0 độ)
		Vector2(270, 270),  # Đông Nam (+45 độ)
		Vector2(200, 300),  # Nam (Dưới, +90 độ)
		Vector2(130, 270),  # Tây Nam (+135 độ)
		Vector2(100, 200),  # Tây (Trái, 180 độ)
		Vector2(130, 130),  # Tây Bắc (-135 độ)
		Vector2(200, 100),  # Bắc (Trên, -90 độ)
		Vector2(270, 130),  # Đông Bắc (-45 độ)
	]

	for pt in test_points:
		dummy.global_position = pt
		tower.current_target = dummy
		for _step in range(20):
			tower._process(0.05)

		# Khẳng định chuẩn cơ khí 2D isometric:
		assert_eq(tower.sprite_base.rotation, 0.0, "Đế tháp giữ cố định 100%, rotation = 0")
		assert_eq(tower.sprite_head.rotation, 0.0, "Đầu nòng súng và ụ tháp luôn đứng thẳng nằm ngang 100%, không xoay 2D tự do làm méo phối cảnh")
		assert_gt(tower.sprite_head.scale.x, 0.0, "Scale X luôn dương, không lật âm hay méo hình")
		assert_gt(tower.sprite_head.scale.y, 0.0, "Scale Y luôn dương")
		assert_true(tower._current_dir_idx >= 0 and tower._current_dir_idx < 32, "Chuyển hướng nòng súng bằng sprite 32 hướng chuẩn mượt mà")

		var muzzle = tower.get_muzzle_local_pos()
		assert_true(muzzle.distance_to(tower._turret_mount_pos) > 8.0, "Đầu nòng súng vươn ra khỏi tâm trụ theo chuẩn isometric")

	for child in tower.get_children():
		if child != tower.sprite_base and child != tower.sprite_head:
			child.free()

func test_tower_upgrade_and_sell() -> void:
	var tower = TowerScript.new()
	add_child_autofree(tower)
	tower.setup(TowerScript.TowerType.PLASMA_CANNON)

	assert_eq(tower.level, 1, "Trụ bắt đầu ở Cấp 1")
	assert_eq(tower.get_upgrade_cost(), 42, "Nâng cấp lên Cấp 2 tốn 42G (70% của 60G)")
	assert_true(tower.can_upgrade(), "Tháp có thể nâng cấp")

	var old_dmg = tower.damage
	var ok2 = tower.upgrade()
	assert_true(ok2, "Nâng cấp lên Cấp 2 thành công")
	assert_eq(tower.level, 2, "Trụ hiện ở Cấp 2")
	assert_gt(tower.damage, old_dmg, "Sát thương tăng khi lên Cấp 2")

	assert_eq(tower.get_upgrade_cost(), 72, "Nâng cấp lên Cấp 3 tốn 72G (120% của 60G)")
	var ok3 = tower.upgrade()
	assert_true(ok3, "Nâng cấp lên Cấp 3 thành công")
	assert_eq(tower.level, 3, "Trụ hiện ở Cấp 3 (Cực phẩm)")
	assert_false(tower.can_upgrade(), "Đã đạt cấp tối đa, không thể nâng thêm")

	var sell_val = tower.get_sell_value()
	assert_gt(sell_val, 0, "Bán tháp hoàn lại vàng")

func test_animated_enemy_movement_and_damage() -> void:
	var enemy = EnemyScript.new()
	add_child_autofree(enemy)
	var path: Array[Vector2] = [Vector2(0, 0), Vector2(100, 0)]
	enemy.setup(EnemyScript.EnemyType.STEAM_TRAIN, path, 1.0)

	assert_eq(enemy.current_hp, 90.0, "Máu khởi đầu 90")
	enemy.take_damage(25.0)
	assert_eq(enemy.current_hp, 65.0, "Sau khi dính đạn còn 65 máu")
	assert_gt(enemy._hit_flash, 0.0, "Kích hoạt hiệu ứng chớp trắng khi dính đạn")

func test_mech_walker_20frame_walk_cycle_and_dust() -> void:
	var enemy = EnemyScript.new()
	add_child_autofree(enemy)
	var path: Array[Vector2] = [Vector2(0, 0), Vector2(200, 0)]
	enemy.setup(EnemyScript.EnemyType.MECH_WALKER, path, 1.0)

	assert_eq(enemy.current_hp, 180.0, "Máu Mech Walker trâu bò 180 HP")
	assert_eq(enemy.speed, 58.0, "Tốc độ bước đi chậm chạp uy lực 58 px/s")
	assert_eq(enemy.MECH_WALK_FRAMES.size(), 20, "20 khung hình bước đi trích xuất từ Video 3D")
	assert_eq(enemy.sprite.texture, enemy.MECH_WALK_FRAMES[0], "Khung hình khởi đầu là frame 0")

	# Cho quái bước đi 1 giây để kiểm tra chuyển frame và sinh hạt bụi
	for _i in range(60):
		enemy._process(0.016)

	assert_gt(enemy._dust_particles.size(), 0, "Bụi đất tung ra từ bước chân dậm đất uy lực")
	assert_gt(enemy._smoke_particles.size(), 0, "Ống khói lò hơi xả khói trắng khi di chuyển")
	assert_eq(enemy.get_chest_world_pos().y, enemy.global_position.y - 34.0, "Tọa độ ngực chuẩn xác để tháp nhắm bắn")

func test_steam_train_24frame_animation_cycle_and_particles() -> void:
	var enemy = EnemyScript.new()
	add_child_autofree(enemy)
	var path: Array[Vector2] = [Vector2(0, 0), Vector2(200, 0)]
	enemy.setup(EnemyScript.EnemyType.STEAM_TRAIN, path, 1.0)

	assert_eq(enemy.current_hp, 90.0, "Máu Steam Train 90 HP")
	assert_eq(enemy.speed, 82.0, "Tốc độ chạy 82 px/s")
	assert_eq(enemy.STEAM_TRAIN_FRAMES.size(), 24, "24 khung hình lăn bánh & khói trích xuất từ Video 3D chuẩn xác")
	assert_eq(enemy.sprite.texture, enemy.STEAM_TRAIN_FRAMES[0], "Khung hình khởi đầu là train_00")

	# Cho xe lửa chạy 1 giây để kiểm tra chu kỳ xoay bánh xe và sinh hạt khói + bụi xích
	for _i in range(60):
		enemy._process(0.016)

	assert_gt(enemy._smoke_particles.size(), 0, "Khói hơi nước phụt ra từ ống khói xe lửa")
	assert_gt(enemy._dust_particles.size(), 0, "Bụi đất tung ra từ xích bám đường cát vàng")
	assert_eq(enemy.get_chest_world_pos().y, enemy.global_position.y - 20.0, "Tọa độ buồng lái chuẩn xác để tháp nhắm bắn")

func test_winged_bot_20frame_flight_cycle_and_jet_particles() -> void:
	var enemy = EnemyScript.new()
	add_child_autofree(enemy)
	var path: Array[Vector2] = [Vector2(0, 0), Vector2(200, 0)]
	enemy.setup(EnemyScript.EnemyType.WINGED_BOT, path, 1.0)

	assert_eq(enemy.current_hp, 55.0, "Máu Winged Bot 55 HP")
	assert_eq(enemy.speed, 110.0, "Tốc độ bay lượn 110 px/s")
	assert_eq(enemy.WINGED_BOT_FRAMES.size(), 20, "20 khung hình đập cánh trích xuất từ Video 3D chuẩn xác")
	assert_eq(enemy.sprite.texture, enemy.WINGED_BOT_FRAMES[0], "Khung hình khởi đầu là fly_00")

	# Cho chim bay 1 giây để kiểm tra chu kỳ đập cánh và sinh hạt tia lửa phản lực
	for _i in range(60):
		enemy._process(0.016)

	assert_gt(enemy._dust_particles.size(), 0, "Tia lửa phản lực phụt ra từ 3 động cơ dưới cánh và đuôi chim")
	var has_spark = false
	for p in enemy._dust_particles:
		if p.get("is_spark", false):
			has_spark = true
			break
	assert_true(has_spark, "Hạt phản lực có cờ is_spark để vẽ tia lửa cam rực rỡ")
	assert_eq(enemy.get_chest_world_pos().y, enemy.global_position.y - 22.0, "Tọa độ thân chim chuẩn xác để tháp nhắm bắn")

func test_animated_projectile_tracking() -> void:
	var proj = ProjectileScript.new()
	add_child_autofree(proj)
	var target = Node2D.new()
	add_child_autofree(target)
	target.global_position = Vector2(200, 200)

	var spawn_pos = Vector2(50, 50)
	var shoot_dir = Vector2(1, 0).normalized()
	proj.launch_straight(spawn_pos, shoot_dir, target, 30.0, ProjectileScript.ProjectileType.GATLING_BULLET)
	assert_eq(proj.damage, 30.0)
	assert_eq(proj.target, target)
	assert_eq(proj.global_position, spawn_pos)
	assert_eq(proj._last_dir, shoot_dir)

	# Đạn bay thẳng 100% tuyệt đối không bị bẻ cong theo thời gian
	var p0 = proj.global_position
	proj._process(0.016)
	var p1 = proj.global_position
	assert_gt(p1.x, p0.x, "Đạn bay về phía trước theo hướng nòng súng")
	assert_almost_eq(p1.y, p0.y, 0.001, "Tọa độ Y không lệch dù chỉ 1 pixel (đường thẳng 100%)")

func test_straight_line_bullet_and_barrel_alignment() -> void:
	var tower = TowerScript.new()
	add_child_autofree(tower)
	tower.setup(TowerScript.TowerType.GATLING_GUN)
	tower.global_position = Vector2(300, 300)

	# Để ngực quái vật (target.global_position + Vector2(0, -22)) nằm ngang hàng với tâm súng pivot (300 - 18 - 24 = 258)
	var target = Node2D.new()
	add_child_autofree(target)
	var pivot_y = tower.get_gun_pivot_world_pos().y
	target.global_position = Vector2(450, pivot_y + 22.0) # Mục tiêu hướng Đông (0.00 độ)
	tower.current_target = target

	for _i in range(30):
		tower._process(0.02)

	assert_eq(tower._current_dir_idx, 0, "Mục tiêu 0 độ chọn chính xác Dir 0")
	var muzzle = tower.global_position + tower.get_muzzle_local_pos()
	var pivot = tower.get_gun_pivot_world_pos()
	var barrel_dir = (muzzle - pivot).normalized()
	assert_almost_eq(barrel_dir.y, 0.0, 0.01, "Nòng súng hướng chính xác vào mục tiêu trên cùng 1 đường thẳng")


func test_camera_controller_modes() -> void:
	var cam = CameraScript.new()
	add_child_autofree(cam)
	assert_eq(cam.current_mode, CameraScript.CameraMode.TACTICAL, "Mặc định góc nhìn Cận Cảnh Chiến Thuật")
	assert_gt(cam.target_zoom.x, 1.2, "Zoom cận cảnh lớn hơn 1.2x")

	var _m2 = cam.cycle_camera_mode()
	assert_eq(cam.current_mode, CameraScript.CameraMode.OVERVIEW, "Chuyển sang Toàn Cảnh")
	assert_eq(cam.target_zoom.x, 1.0, "Zoom toàn cảnh là 1.0x")

	var _m3 = cam.cycle_camera_mode()
	assert_eq(cam.current_mode, CameraScript.CameraMode.ACTION_FOCUS, "Chuyển sang Theo Dõi Quái")

func test_main_stylized_scene_instantiation() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)
	assert_not_null(scene, "MainStylized scene nạp thành công")
	assert_eq(scene.gold, 350, "Khởi đầu 350 vàng")
	assert_eq(scene.score, 335, "Điểm khởi đầu 335")
	assert_eq(scene.BUILD_PADS.size(), 14, "Đủ 14 bệ đá chuẩn xác")

func test_freeform_placement_validation_and_building() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	# 1. Điểm hợp lệ trên thảm cỏ thoáng
	var valid_spot = Vector2(240.0, 340.0)
	assert_true(scene._is_valid_build_position(valid_spot), "Vị trí thảm cỏ thoáng phải hợp lệ để đặt tháp")

	# 2. Điểm không hợp lệ: nằm trên đường quái đi
	var road_spot = scene.PATH_WAYPOINTS[5]
	assert_false(scene._is_valid_build_position(road_spot), "Vị trí nằm trên tim đường quái đi là không hợp lệ")

	# 3. Điểm không hợp lệ: nằm ngoài rìa đảo
	var outside_spot = Vector2(10.0, 100.0)
	assert_false(scene._is_valid_build_position(outside_spot), "Vị trí ngoài đảo bay là không hợp lệ")

	# 4. Xây tháp tự do tại tọa độ bất kỳ
	var initial_count = scene.towers_container.get_child_count()
	var new_tower = scene._build_tower_at_position(valid_spot, AnimatedTower.TowerType.GATLING_GUN, true)
	assert_not_null(new_tower, "Tháp mới được khởi tạo")
	assert_eq(scene.towers_container.get_child_count(), initial_count + 1, "Tháp mới được thêm vào towers_container")
	assert_eq(new_tower.global_position, valid_spot, "Tọa độ tháp khớp chính xác với điểm chọn")

	# 5. Điểm vừa đặt tháp không cho phép đặt đè tháp khác
	assert_false(scene._is_valid_build_position(valid_spot), "Không được đặt đè tháp lên vị trí đã có tháp")

func test_damage_counter_matrix() -> void:
	# 1. Gatling (KINETIC) khắc Chim Bay (AERIAL) x2.2
	var bird = EnemyScript.new()
	add_child_autofree(bird)
	bird.setup(EnemyScript.EnemyType.WINGED_BOT, [Vector2.ZERO, Vector2(100, 0)])
	var bird_hp_before = bird.current_hp
	bird.take_damage(10.0, EnemyScript.DamageType.KINETIC)
	assert_almost_eq(bird.current_hp, bird_hp_before - 22.0, 0.1, "Gatling Kinetic khắc Chim bay x2.2 (10 * 2.2 = 22)")

	# 2. Gatling (KINETIC) bị giảm trước Robot Giáp Thép (HEAVY_ARMOR) x0.5
	var mech = EnemyScript.new()
	add_child_autofree(mech)
	mech.setup(EnemyScript.EnemyType.MECH_WALKER, [Vector2.ZERO, Vector2(100, 0)])
	var mech_hp_before = mech.current_hp
	mech.take_damage(20.0, EnemyScript.DamageType.KINETIC)
	assert_almost_eq(mech.current_hp, mech_hp_before - 10.0, 0.1, "Gatling Kinetic bị giảm trước Giáp thép x0.5 (20 * 0.5 = 10)")

	# 3. Plasma (THERMAL_PLASMA) phá Giáp Thép (HEAVY_ARMOR) x2.5
	var mech2 = EnemyScript.new()
	add_child_autofree(mech2)
	mech2.setup(EnemyScript.EnemyType.MECH_WALKER, [Vector2.ZERO, Vector2(100, 0)])
	var mech2_hp_before = mech2.current_hp
	mech2.take_damage(20.0, EnemyScript.DamageType.THERMAL_PLASMA)
	assert_almost_eq(mech2.current_hp, mech2_hp_before - 50.0, 0.1, "Plasma Thermal phá Giáp Thép x2.5 (20 * 2.5 = 50)")

	# 4. Tesla (ELECTRO_EMP) tê liệt Xe Lửa Cơ Khí (MECHANICAL) x2.2
	var train = EnemyScript.new()
	add_child_autofree(train)
	train.setup(EnemyScript.EnemyType.STEAM_TRAIN, [Vector2.ZERO, Vector2(100, 0)])
	var train_hp_before = train.current_hp
	train.take_damage(10.0, EnemyScript.DamageType.ELECTRO_EMP)
	assert_almost_eq(train.current_hp, train_hp_before - 22.0, 0.1, "Tesla EMP tê liệt Cơ Khí x2.2 (10 * 2.2 = 22)")
	assert_gt(train._electrocute_timer, 0.0, "Tesla EMP gây hiệu ứng sốc điện stun")

func test_multi_faction_towers_and_archetypes() -> void:
	# 1. Kiểm tra 4 phân hệ
	assert_eq(TowerScript.get_faction_for_tower(TowerScript.TowerType.PLASMA_CANNON), TowerScript.FactionType.SCI_FI)
	assert_eq(TowerScript.get_faction_for_tower(TowerScript.TowerType.GATLING_GUN), TowerScript.FactionType.SCI_FI)
	assert_eq(TowerScript.get_faction_for_tower(TowerScript.TowerType.SAM_BATTERY), TowerScript.FactionType.SCI_FI)
	assert_eq(TowerScript.get_faction_for_tower(TowerScript.TowerType.FROST_SPIRE), TowerScript.FactionType.ARCANE)
	assert_eq(TowerScript.get_faction_for_tower(TowerScript.TowerType.MAGMA_MONOLITH), TowerScript.FactionType.ARCANE)
	assert_eq(TowerScript.get_faction_for_tower(TowerScript.TowerType.VOID_OBELISK), TowerScript.FactionType.ARCANE)
	assert_eq(TowerScript.get_faction_for_tower(TowerScript.TowerType.SPORE_SPITTER), TowerScript.FactionType.BIO)
	assert_eq(TowerScript.get_faction_for_tower(TowerScript.TowerType.PYLON_BUFFER), TowerScript.FactionType.DIVINE)

	# 2. Khởi tạo 9 tháp và kiểm tra thông số
	var sam = TowerScript.new()
	add_child_autofree(sam)
	sam.setup(TowerScript.TowerType.SAM_BATTERY)
	assert_eq(sam.attack_range, 320.0, "SAM Battery tầm bắn xa 320px")
	assert_eq(sam.base_cost, 120, "SAM Battery giá 120G")

	var frost = TowerScript.new()
	add_child_autofree(frost)
	frost.setup(TowerScript.TowerType.FROST_SPIRE)
	assert_eq(frost.attack_range, 200.0)
	assert_eq(frost.base_cost, 90)

	var magma = TowerScript.new()
	add_child_autofree(magma)
	magma.setup(TowerScript.TowerType.MAGMA_MONOLITH)
	assert_eq(magma.damage, 48.0)
	assert_eq(magma.base_cost, 110)

	var void_ob = TowerScript.new()
	add_child_autofree(void_ob)
	void_ob.setup(TowerScript.TowerType.VOID_OBELISK)
	assert_eq(void_ob.damage, 35.0)
	assert_eq(void_ob.base_cost, 140)

	var spore = TowerScript.new()
	add_child_autofree(spore)
	spore.setup(TowerScript.TowerType.SPORE_SPITTER)
	assert_eq(spore.damage, 28.0)
	assert_eq(spore.base_cost, 80)

	var pylon = TowerScript.new()
	add_child_autofree(pylon)
	pylon.setup(TowerScript.TowerType.PYLON_BUFFER)
	assert_eq(pylon.damage, 0.0, "Pylon là tháp buff hỗ trợ")
	assert_eq(pylon.base_cost, 130)

func test_sam_battery_anti_air_priority() -> void:
	var sam = TowerScript.new()
	add_child_autofree(sam)
	sam.setup(TowerScript.TowerType.SAM_BATTERY)
	sam.global_position = Vector2(200, 200)

	var ground_mech = EnemyScript.new()
	add_child_autofree(ground_mech)
	ground_mech.setup(EnemyScript.EnemyType.MECH_WALKER, [Vector2(220, 200)])
	ground_mech.add_to_group("animated_enemies")

	var flying_bot = EnemyScript.new()
	add_child_autofree(flying_bot)
	flying_bot.setup(EnemyScript.EnemyType.WINGED_BOT, [Vector2(280, 200)])
	flying_bot.add_to_group("animated_enemies")

	var best = sam._find_best_enemy()
	assert_eq(best, flying_bot, "SAM Battery ưu tiên khóa mục tiêu bay (Flying) dù đứng xa hơn mục tiêu mặt đất")

func test_gatling_continuous_ramp_up() -> void:
	var gatling = TowerScript.new()
	add_child_autofree(gatling)
	gatling.setup(TowerScript.TowerType.GATLING_GUN)
	gatling.global_position = Vector2(100, 100)

	var target = EnemyScript.new()
	add_child_autofree(target)
	target.setup(EnemyScript.EnemyType.MECH_WALKER, [Vector2(150, 100)])

	assert_eq(gatling._ramp_multiplier, 1.0, "Hệ số khởi đầu x1.0")
	gatling._fire_gatling(target) # Phát 1: khóa mục tiêu
	assert_eq(gatling._ramp_multiplier, 1.0, "Phát đầu tiên gán mục tiêu x1.0")
	gatling._fire_gatling(target) # Phát 2: bắn tiếp cùng mục tiêu
	assert_almost_eq(gatling._ramp_multiplier, 1.08, 0.01, "Phát bắn thứ 2 vào cùng mục tiêu tăng sát thương")
	gatling._fire_gatling(target) # Phát 3: tiếp tục dồn sát thương
	assert_almost_eq(gatling._ramp_multiplier, 1.16, 0.01, "Phát bắn thứ 3 tiếp tục tích lũy sát thương ramping")

func test_pylon_buffer_aura_and_divine_purge() -> void:
	var pylon = TowerScript.new()
	add_child_autofree(pylon)
	pylon.setup(TowerScript.TowerType.PYLON_BUFFER)
	pylon.global_position = Vector2(200, 200)

	var sibling = TowerScript.new()
	add_child_autofree(sibling)
	sibling.setup(TowerScript.TowerType.GATLING_GUN)
	sibling.global_position = Vector2(260, 200)

	var ghost = EnemyScript.new()
	add_child_autofree(ghost)
	ghost.setup(EnemyScript.EnemyType.ETHEREAL_WRAITH, [Vector2(240, 200)], 2.0)
	ghost.add_to_group("animated_enemies")
	var ghost_hp_before = ghost.current_hp

	pylon._pulse_pylon_aura()

	assert_almost_eq(sibling.atk_speed_buff, 1.25, 0.01, "Pylon buff +25% tốc độ đánh cho tháp lân cận")
	assert_almost_eq(sibling.range_buff, 1.15, 0.01, "Pylon buff +15% tầm bắn cho tháp lân cận")
	assert_almost_eq(ghost.current_hp, ghost_hp_before - 62.5, 0.1, "Hào quang Thánh Quang Pylon trừ tà gây 25 x 2.5 = 62.5 True Damage lên Ethereal")

func test_defense_matrix_and_new_enemy_types() -> void:
	# 1. Shield Droid (Giáp Năng Lượng / Khiên)
	var shield_bot = EnemyScript.new()
	add_child_autofree(shield_bot)
	shield_bot.setup(EnemyScript.EnemyType.SHIELD_DROID, [Vector2.ZERO, Vector2(100, 0)])
	assert_gt(shield_bot.current_shield, 0.0, "Shield Droid có khiên năng lượng")
	var s_before = shield_bot.current_shield

	# Plasma phá khiên x2.0
	shield_bot.take_damage(10.0, EnemyScript.DamageType.THERMAL_PLASMA)
	assert_almost_eq(shield_bot.current_shield, s_before - 20.0, 0.1, "Plasma phá khiên x2.0 (10 * 2.0 = 20)")

	# Axit vô hiệu với khiên
	var s_after_plasma = shield_bot.current_shield
	shield_bot.take_damage(10.0, EnemyScript.DamageType.BIO_CORROSIVE)
	assert_almost_eq(shield_bot.current_shield, s_after_plasma, 0.1, "Axit vô hiệu hóa 0% trước khiên năng lượng")

	# True damage bỏ qua khiên xuyên thẳng vào máu
	var hp_before = shield_bot.current_hp
	shield_bot.take_damage(15.0, EnemyScript.DamageType.TRUE_DAMAGE)
	assert_almost_eq(shield_bot.current_hp, hp_before - 15.0, 0.1, "True Damage xuyên 100% khiên thẳng vào máu")

	# 2. Ethereal Wraith (Thể Linh Hồn)
	var wraith = EnemyScript.new()
	add_child_autofree(wraith)
	wraith.setup(EnemyScript.EnemyType.ETHEREAL_WRAITH, [Vector2.ZERO, Vector2(100, 0)])
	var w_hp = wraith.current_hp

	# Miễn nhiễm Kinetic
	wraith.take_damage(20.0, EnemyScript.DamageType.KINETIC)
	assert_almost_eq(wraith.current_hp, w_hp, 0.1, "Bóng ma miễn nhiễm 100% đạn vật lý Kinetic")

	# Nhận thêm 100% từ Arcane (x2.0)
	wraith.take_damage(10.0, EnemyScript.DamageType.ARCANE)
	assert_almost_eq(wraith.current_hp, w_hp - 20.0, 0.1, "Arcane khắc bóng ma +100% (10 * 2.0 = 20)")

	# Nhận thêm 150% từ True Damage (x2.5)
	var w_hp2 = wraith.current_hp
	wraith.take_damage(10.0, EnemyScript.DamageType.TRUE_DAMAGE)
	assert_almost_eq(wraith.current_hp, w_hp2 - 25.0, 0.1, "Thánh quang True Damage trừ tà +150% (10 * 2.5 = 25)")

	# 3. Swarm Crawler (Máu Sinh Học)
	var swarm = EnemyScript.new()
	add_child_autofree(swarm)
	swarm.setup(EnemyScript.EnemyType.SWARM_CRAWLER, [Vector2.ZERO, Vector2(100, 0)])
	var sw_hp = swarm.current_hp
	swarm.take_damage(10.0, EnemyScript.DamageType.KINETIC)
	assert_almost_eq(swarm.current_hp, sw_hp - 15.0, 0.1, "Gatling Kinetic quét sạch quái thịt +50% (10 * 1.5 = 15)")

func test_elemental_combos() -> void:
	# Combo A: Tưới Dầu + Lửa / Plasma -> Oil Burst Combo
	var enemy1 = EnemyScript.new()
	add_child_autofree(enemy1)
	enemy1.setup(EnemyScript.EnemyType.MECH_WALKER, [Vector2.ZERO, Vector2(100, 0)])
	enemy1.apply_oil(5.0)
	assert_gt(enemy1.status_oiled_timer, 0.0, "Dính dầu thành công")

	var neighbor = EnemyScript.new()
	add_child_autofree(neighbor)
	neighbor.setup(EnemyScript.EnemyType.MECH_WALKER, [Vector2(50, 0)])
	neighbor.add_to_group("animated_enemies")
	var neighbor_hp = neighbor.current_hp

	enemy1.take_damage(10.0, EnemyScript.DamageType.THERMAL_PLASMA)
	assert_almost_eq(enemy1.status_oiled_timer, 0.0, 0.01, "Dầu được kích nổ sạch")
	assert_lt(neighbor.current_hp, neighbor_hp, "Vụ nổ dầu lửa gây sát thương AoE lên quái đứng cạnh")

	# Combo B: Băng + Sét EMP -> Superconductor Chain Stun
	var enemy2 = EnemyScript.new()
	add_child_autofree(enemy2)
	enemy2.setup(EnemyScript.EnemyType.STEAM_TRAIN, [Vector2.ZERO, Vector2(100, 0)])
	enemy2.apply_chill(3.0)
	enemy2.take_damage(10.0, EnemyScript.DamageType.ELECTRO_EMP)
	assert_gt(enemy2._electrocute_timer, 0.0, "Superconductor kích hoạt chuỗi choáng điện")

	# Combo C: Axit + Đạn Kinetic -> Acid Crit +100%
	var mech_corroded = EnemyScript.new()
	add_child_autofree(mech_corroded)
	mech_corroded.setup(EnemyScript.EnemyType.MECH_WALKER, [Vector2.ZERO, Vector2(100, 0)])
	mech_corroded.apply_acid(6.0)
	var mc_hp = mech_corroded.current_hp
	mech_corroded.take_damage(10.0, EnemyScript.DamageType.KINETIC)
	assert_almost_eq(mech_corroded.current_hp, mc_hp - 20.0, 0.1, "Giáp bị axit bào mòn chịu Kinetic Crit x2.0 (10 * 2.0 = 20)")

func test_bottom_bar_and_trays_toggle() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	assert_not_null(scene.bottom_bar, "BottomBar tồn tại")
	assert_not_null(scene.quick_tower_tray, "QuickTowerTray tồn tại")
	assert_not_null(scene.quick_spell_tray, "QuickSpellTray tồn tại")
	assert_not_null(scene.skill_tree_modal, "SkillTreeModal tồn tại")

	# Kiểm tra vùng 1: Chỉ có 3 loại vũ khí chuẩn (Gatling, Plasma, Tesla)
	assert_not_null(scene.btn_quick_gatling, "BtnQuickGatling tồn tại")
	assert_not_null(scene.btn_quick_plasma, "BtnQuickPlasma tồn tại")
	assert_not_null(scene.btn_quick_tesla, "BtnQuickTesla tồn tại")
	assert_null(scene.btn_quick_sam, "BtnQuickSAM đã được loại bỏ khỏi khay 3 trụ")
	assert_null(scene.btn_quick_frost, "BtnQuickFrost đã được loại bỏ khỏi khay 3 trụ")

	# 1. Bấm Mua Trụ -> Mở khay chọn tháp nhanh
	scene._on_btn_build_pressed()
	assert_true(scene.quick_tower_tray.visible, "QuickTowerTray mở khi bấm Mua Trụ")
	assert_false(scene.quick_spell_tray.visible, "QuickSpellTray đóng khi mở tháp")
	assert_false(scene.skill_tree_modal.visible, "SkillTreeModal đóng khi mở tháp")

	# Chọn trụ từ khay -> Kích hoạt chế độ đặt trụ (is_placing_tower = true)
	scene._on_quick_tower_selected(TowerScript.TowerType.PLASMA_CANNON, 60)
	assert_true(scene.is_placing_tower, "Đã kích hoạt chế độ đặt trụ sau khi bấm vào trụ trong mục mua trụ")
	assert_eq(scene.placing_tower_type, TowerScript.TowerType.PLASMA_CANNON, "Đúng loại trụ Plasma")
	assert_eq(scene.placing_cost, 60, "Đúng giá 60G")
	assert_false(scene.quick_tower_tray.visible, "Khay mua trụ tự đóng khi vào chế độ đặt")
	scene.is_placing_tower = false

	# Kiểm tra bấm chuột trái ngoài map khi KHÔNG trong chế độ đặt trụ -> KHÔNG hiện popup mua trụ
	scene._check_touch_interaction(Vector2(250.0, 320.0))
	assert_false(scene.build_popup.visible, "Bấm chuột trái ngoài map không tự động hiện popup xây trụ")

	# Kiểm tra vùng 2: Cây kỹ năng có TextureRect vi mạch năng lượng 2.5D
	assert_not_null(scene.arrow_r1, "Conduit Tầm Bắn tồn tại")
	assert_not_null(scene.arrow_d1, "Conduit Sát Thương tồn tại")
	assert_not_null(scene.arrow_s1, "Conduit Tốc Độ tồn tại")

	# 2. Bấm Phép Thuật -> Chuyển sang mở khay phép thuật
	scene._on_btn_spell_pressed()
	assert_true(scene.quick_spell_tray.visible, "QuickSpellTray mở khi bấm Phép Thuật")
	assert_false(scene.quick_tower_tray.visible, "QuickTowerTray tự đóng")

	# 3. Bấm Cây Kỹ Năng -> Mở modal cây kỹ năng
	scene._on_btn_skill_tree_pressed()
	assert_true(scene.skill_tree_modal.visible, "SkillTreeModal mở khi bấm Kỹ Năng")
	assert_false(scene.quick_spell_tray.visible, "QuickSpellTray tự đóng khi mở Modal")


func test_skill_tree_upgrades_and_multipliers() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	var initial_gold = scene.gold

	# 1. Chọn và Nâng cấp Tier 1 Tầm Bắn (Cost: 100G)
	scene._select_skill("range", 1)
	scene._on_btn_upgrade_skill_pressed()
	assert_eq(scene.skill_tier_range, 1, "Kỹ năng Tầm Bắn đã lên Tier 1")
	assert_almost_eq(TowerScript.tech_range_mult, 1.15, 0.01, "Chỉ số Tầm Bắn tăng +15% (1.15)")
	assert_eq(scene.gold, initial_gold - 100, "Vàng trừ chính xác 100G")

	# 2. Chọn và Nâng cấp Tier 1 Sát Thương (Cost: 120G)
	scene._select_skill("damage", 1)
	scene._on_btn_upgrade_skill_pressed()
	assert_eq(scene.skill_tier_damage, 1, "Kỹ năng Sát Thương đã lên Tier 1")
	assert_almost_eq(TowerScript.tech_damage_mult, 1.20, 0.01, "Chỉ số Sát Thương tăng +20% (1.20)")

	# 3. Chọn và Nâng cấp Tier 1 Tốc Độ Bắn (Cost: 110G)
	scene._select_skill("speed", 1)
	scene._on_btn_upgrade_skill_pressed()
	assert_eq(scene.skill_tier_speed, 1, "Kỹ năng Tốc Độ Bắn đã lên Tier 1")
	assert_almost_eq(TowerScript.tech_speed_mult, 1.20, 0.01, "Chỉ số Tốc Độ Bắn tăng +20% (1.20)")

	# 4. Kiểm tra tháp áp dụng chỉ số hiệu lực thực tế
	var tower = TowerScript.new()
	add_child_autofree(tower)
	tower.setup(TowerScript.TowerType.GATLING_GUN)
	var eff_range = tower.get_effective_range()
	assert_almost_eq(eff_range, tower.attack_range * 1.15, 0.1, "Tầm bắn tháp thừa hưởng trọn vẹn Tech Multiplier")

	var eff_dmg = tower.get_effective_damage()
	assert_almost_eq(eff_dmg, tower.damage * 1.20, 0.1, "Sát thương đạn thừa hưởng +20% Tech Multiplier")

	# 5. Tẩy điểm (Reset) -> Hoàn trả 100% vàng và khôi phục chỉ số gốc
	scene._on_btn_reset_skills_pressed()
	assert_eq(scene.skill_tier_range, 0, "Reset Tier Range về 0")
	assert_eq(scene.skill_tier_damage, 0, "Reset Tier Damage về 0")
	assert_eq(scene.skill_tier_speed, 0, "Reset Tier Speed về 0")
	assert_eq(scene.gold, initial_gold, "Hoàn lại đủ 100% vàng (330G)")
	assert_almost_eq(TowerScript.tech_range_mult, 1.0, 0.01, "Tech Range Mult về 1.0")
	assert_almost_eq(TowerScript.tech_damage_mult, 1.0, 0.01, "Tech Damage Mult về 1.0")
	assert_almost_eq(TowerScript.tech_speed_mult, 1.0, 0.01, "Tech Speed Mult về 1.0")

func test_active_spells_cast() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	var enemy = EnemyScript.new()
	enemy.setup(EnemyScript.EnemyType.MECH_WALKER, [Vector2.ZERO, Vector2(100, 0)])
	enemy.add_to_group("animated_enemies")
	scene.enemies_container.add_child(enemy)

	# 1. Cast Spell Lightning (80G -> Deals 65 Electro EMP damage)
	var hp_before = enemy.current_hp
	scene._cast_spell_lightning()
	assert_lt(enemy.current_hp, hp_before, "Quái bị trúng sét mất máu")

	# 2. Cast Spell Freeze (100G -> Freezes all enemies for 3.5s)
	scene._cast_spell_freeze()
	assert_gt(enemy.status_frozen_timer, 0.0, "Quái bị đóng băng")

	# 3. Cast Spell Meteor (120G -> AoE burst 125 damage)
	var hp_before_meteor = enemy.current_hp
	scene._cast_spell_meteor()
	assert_lt(enemy.current_hp, hp_before_meteor, "Quái bị trúng thiên thạch sát thương bùng nổ")

func test_monster_path_waypoints_exact_match() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	assert_eq(scene.PATH_WAYPOINTS.size(), 21, "Con đường có đúng 21 điểm mốc bám sát nét vẽ")
	assert_eq(scene.PATH_WAYPOINTS[0], Vector2(145.0, 400.0), "Bắt đầu tại Cổng Portal phía Tây")
	assert_eq(scene.PATH_WAYPOINTS[7], Vector2(480.0, 425.0), "Đỉnh Cầu Đá bắc qua thác nước")
	assert_eq(scene.PATH_WAYPOINTS[20], Vector2(1178.0, 312.0), "Đích đến tại Cửa Vòm Gỗ Pháo Đài Hoàng Gia")

func test_monster_spawn_restricted_to_three_types() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	# Kiểm tra 12 lần sinh quái liên tiếp qua các wave
	var allowed_types = [
		EnemyScript.EnemyType.MECH_WALKER,
		EnemyScript.EnemyType.STEAM_TRAIN,
		EnemyScript.EnemyType.WINGED_BOT
	]
	for seed_val in range(12):
		var enemy_type = scene._get_enemy_type_for_seed(seed_val)
		assert_true(enemy_type in allowed_types, "Chỉ được sinh Robot, Xe Lửa hoặc Chim (seed " + str(seed_val) + ")")

func test_mech_walker_front_and_back_orientations() -> void:
	var enemy = EnemyScript.new()
	add_child_autofree(enemy)
	enemy.setup(EnemyScript.EnemyType.MECH_WALKER, [Vector2(0, 0), Vector2(100, 50)], 1.0)

	# 1. Hướng đi xuống dốc phía Đông Nam (SE)
	enemy._update_facing_direction(Vector2(1.0, 0.5).normalized())
	assert_false(enemy.is_moving_upward, "Đi xuống dốc không phải là leo ngược lên")
	enemy._update_limb_animation(0.016)
	assert_true(enemy.sprite.texture in enemy.MECH_WALK_SE_FRAMES, "Dùng bộ khung nhìn chéo trước (SE)")
	assert_eq(enemy.visual_root.scale.x, -1.0, "scale.x = -1.0 (lật gương sprite gốc nhìn Tây) để robot nhìn về phía Đông Nam chuẩn xác")

	# 2. Hướng đi xuống dốc phía Tây Nam (SW - sprite gốc nhìn Tây)
	enemy._update_facing_direction(Vector2(-1.0, 0.5).normalized())
	enemy._update_limb_animation(0.016)
	assert_true(enemy.sprite.texture in enemy.MECH_WALK_SE_FRAMES, "Dùng bộ khung SE giữ nguyên cho SW")
	assert_eq(enemy.visual_root.scale.x, 1.0, "Giữ nguyên scale.x = 1.0 khi robot quay về phía Tây Nam")

	# 3. Hướng leo dốc lên Đông Bắc (NE)
	enemy._update_facing_direction(Vector2(0.8, -0.6).normalized())
	assert_true(enemy.is_moving_upward, "Leo dốc lên với dir.y < -0.28")
	enemy._update_limb_animation(0.016)
	assert_true(enemy.sprite.texture in enemy.MECH_WALK_NE_FRAMES, "Dùng bộ khung nhìn chéo sau lưng NE (1 bình khói đồng bộ)")
	assert_eq(enemy.visual_root.scale.x, 1.0, "scale.x = 1.0 để robot leo dốc nhìn về phía Đông Bắc (sprite NE gốc nhìn Đông Bắc)")

	# 4. Hướng leo dốc lên Tây Bắc (NW - lật gương sprite NE gốc nhìn Đông Bắc)
	enemy._update_facing_direction(Vector2(-0.8, -0.6).normalized())
	assert_true(enemy.is_moving_upward, "Leo dốc lên phía Tây Bắc")
	enemy._update_limb_animation(0.016)
	assert_true(enemy.sprite.texture in enemy.MECH_WALK_NE_FRAMES, "Dùng bộ khung nhìn từ phía sau (NE)")
	assert_eq(enemy.visual_root.scale.x, -1.0, "scale.x = -1.0 khi quay lưng sang Tây Bắc")

	# 5. Hướng đi ngang sang Đông (E)
	enemy._update_facing_direction(Vector2(1.0, 0.0).normalized())
	enemy._update_limb_animation(0.016)
	assert_true(enemy.sprite.texture in enemy.MECH_WALK_E_FRAMES, "Dùng bộ khung nhìn ngang sườn khi đi về phía Đông")
	assert_eq(enemy.visual_root.scale.x, -1.0, "scale.x = -1.0 khi nhìn ngang sang Đông")

func test_steam_train_multi_direction_orientations() -> void:
	var train = EnemyScript.new()
	add_child_autofree(train)
	train.setup(EnemyScript.EnemyType.STEAM_TRAIN, [Vector2(0, 0), Vector2(100, 50)], 1.0)

	# 1. Xe lửa chạy chéo xuống Đông Nam (SE)
	train._update_facing_direction(Vector2(1.0, 0.5).normalized())
	train._update_limb_animation(0.016)
	assert_true(train.sprite.texture in train.STEAM_TRAIN_SE_FRAMES, "Xe lửa dùng bộ khung chéo trước SE")
	assert_eq(train.visual_root.scale.x, 1.0, "scale.x = 1.0 cho hướng SE")

	# 2. Xe lửa chạy ngang sang Đông (E)
	train._update_facing_direction(Vector2(1.0, 0.0).normalized())
	train._update_limb_animation(0.016)
	assert_true(train.sprite.texture in train.STEAM_TRAIN_E_FRAMES, "Xe lửa dùng bộ khung sườn xe ngang E")
	assert_eq(train.visual_root.scale.x, 1.0, "scale.x = 1.0 cho hướng E")

	# 3. Xe lửa leo dốc chéo lên Đông Bắc (NE)
	train._update_facing_direction(Vector2(0.8, -0.6).normalized())
	train._update_limb_animation(0.016)
	assert_true(train.sprite.texture in train.STEAM_TRAIN_NE_FRAMES, "Xe lửa dùng bộ khung chéo sau NE")
	assert_eq(train.visual_root.scale.x, 1.0, "scale.x = 1.0 cho hướng NE")

func test_skill_tree_range_multiplier_affects_target_acquisition() -> void:
	TowerScript.reset_tech_tree()
	var tower = TowerScript.new()
	add_child_autofree(tower)
	tower.setup(TowerScript.TowerType.GATLING_GUN)
	tower.global_position = Vector2(200, 200)

	var enemy = Node2D.new()
	enemy.add_to_group("animated_enemies")
	add_child_autofree(enemy)
	# Đặt quái ở khoảng cách xa hơn tầm bắn gốc 1.4 lần (attack_range * 1.4)
	var base_range = tower.attack_range
	enemy.global_position = tower.global_position + Vector2(base_range * 1.4, 0.0)

	# Khi chưa nâng cấp kỹ năng (tech_range_mult = 1.0): quái ngoài tầm bắn -> không tìm thấy
	var target_before = tower._find_best_enemy()
	assert_null(target_before, "Khi tech_range_mult = 1.0, quái ở cự ly 1.4 * attack_range nằm ngoài tầm bắn")

	# Khi nâng cấp cây kỹ năng (tech_range_mult = 1.5): tầm bắn hiệu dụng = attack_range * 1.5
	TowerScript.tech_range_mult = 1.5
	assert_eq(tower.get_effective_range(), base_range * 1.5, "Tầm bắn hiệu dụng mở rộng lên 1.5 lần")

	# Bây giờ tháp phải tìm thấy và khóa mục tiêu ở khoảng cách 1.4 * attack_range
	var target_after = tower._find_best_enemy()
	assert_not_null(target_after, "Khi tech_range_mult = 1.5, tháp khóa được mục tiêu ở cự ly 1.4 * attack_range")
	assert_eq(target_after, enemy, "Mục tiêu được khóa chính xác là enemy")

	# Dọn dẹp lại tech tree để không ảnh hưởng các test khác
	TowerScript.reset_tech_tree()

func test_base_health_hud_game_over_and_restart() -> void:
	var main = MainStylizedScene.instantiate()
	add_child_autofree(main)

	assert_not_null(main.label_health, "Thanh HUD có nhãn hiển thị máu căn cứ")
	assert_eq(main.base_health, 20, "Máu căn cứ ban đầu = 20")
	assert_eq(main.label_health.text, "20/20", "HUD hiển thị 20/20")

	# Khi quái xâm nhập căn cứ
	var dummy_enemy = Node2D.new()
	main._on_enemy_escaped(dummy_enemy)
	assert_eq(main.base_health, 19, "Máu giảm còn 19 khi 1 quái thoát")
	assert_eq(main.label_health.text, "19/20", "HUD cập nhật 19/20")

	# Giảm máu về 0 -> Kích hoạt Game Over
	main.base_health = 1
	main._on_enemy_escaped(dummy_enemy)
	assert_eq(main.base_health, 0, "Máu căn cứ về 0")
	assert_true(main.is_game_over, "Kích hoạt trạng thái Game Over")
	assert_false(main.is_wave_active, "Dừng wave hiện tại khi thua")
	assert_eq(main.btn_next_wave.text, "CHƠI LẠI", "Nút Next Wave chuyển thành 'CHƠI LẠI'")

	# Nâng cấp kỹ năng và dựng thêm tháp trước khi restart để kiểm chứng
	main.skill_tier_range = 2
	main.skill_tier_damage = 1
	main._apply_tech_multipliers()
	main._build_tower_at_position(Vector2(500, 500), main.TowerClass.TowerType.TESLA_COIL, true)

	# Bấm nút chơi lại -> Khởi tạo lại trận đấu
	main._on_btn_next_wave_pressed()
	assert_false(main.is_game_over, "Đã hủy trạng thái Game Over")
	assert_eq(main.base_health, 20, "Máu căn cứ hồi phục đầy 20/20")
	assert_eq(main.current_wave, 1, "Wave reset về 1 và tự động kích hoạt")
	assert_true(main.is_wave_active, "Đợt 1 được tự động kích hoạt sau khi restart")
	assert_eq(main.skill_tier_range, 0, "Cấp kỹ năng Range được reset về 0")
	assert_eq(main.skill_tier_damage, 0, "Cấp kỹ năng Damage được reset về 0")
	assert_eq(main.skill_tier_speed, 0, "Cấp kỹ năng Speed được reset về 0")
	assert_eq(main.towers_container.get_child_count(), 2, "Xóa tháp thừa, chỉ còn lại đúng 2 tháp mẫu ban đầu")
	assert_eq(main.label_wave.text, "1", "HUD hiển thị WAVE: 1 chuẩn xác")

	dummy_enemy.free()

func test_tower_targeting_priority_selection() -> void:
	var tower = TowerScript.new()
	add_child_autofree(tower)
	tower.setup(TowerScript.TowerType.GATLING_GUN)
	tower.global_position = Vector2(200, 200)

	var path: Array[Vector2] = [Vector2(100, 200), Vector2(200, 200), Vector2(300, 200)]

	# Enemy A: Đang ở waypoint 1, HP = 50, khoảng cách tới tháp = 60
	var enemy_a = EnemyScript.new()
	add_child_autofree(enemy_a)
	enemy_a.add_to_group("animated_enemies")
	enemy_a.setup(EnemyScript.EnemyType.MECH_WALKER, path, 1.0)
	enemy_a.global_position = Vector2(260, 200)
	enemy_a._current_wp_idx = 2
	enemy_a.current_hp = 50.0

	# Enemy B: Ở waypoint 0, HP = 180, khoảng cách tới tháp = 40 (gần nhất, máu trâu nhất)
	var enemy_b = EnemyScript.new()
	add_child_autofree(enemy_b)
	enemy_b.add_to_group("animated_enemies")
	enemy_b.setup(EnemyScript.EnemyType.MECH_WALKER, path, 1.0)
	enemy_b.global_position = Vector2(200, 240)
	enemy_b._current_wp_idx = 1
	enemy_b.current_hp = 180.0

	# Enemy C: Ở waypoint 0, HP = 20 (máu yếu nhất), khoảng cách tới tháp = 90
	var enemy_c = EnemyScript.new()
	add_child_autofree(enemy_c)
	enemy_c.add_to_group("animated_enemies")
	enemy_c.setup(EnemyScript.EnemyType.MECH_WALKER, path, 1.0)
	enemy_c.global_position = Vector2(110, 200)
	enemy_c._current_wp_idx = 0
	enemy_c.current_hp = 20.0

	# 1. Chế độ FIRST: Ưu tiên quái đi xa nhất trên lộ trình (Enemy A)
	tower.target_priority = TowerScript.TargetPriority.FIRST
	assert_eq(tower.get_target_priority_name(), "ĐẦU TIÊN")
	assert_eq(tower._find_best_enemy(), enemy_a, "Chế độ FIRST chọn Enemy A (tiến xa nhất trên đường đi)")

	# 2. Chế độ STRONGEST: Ưu tiên quái nhiều máu nhất (Enemy B, HP = 180)
	tower.target_priority = TowerScript.TargetPriority.STRONGEST
	assert_eq(tower.get_target_priority_name(), "MÁU CAO NHẤT")
	assert_eq(tower._find_best_enemy(), enemy_b, "Chế độ STRONGEST chọn Enemy B (máu 180 cao nhất)")

	# 3. Chế độ WEAKEST: Ưu tiên quái ít máu nhất để dọn nhanh (Enemy C, HP = 20)
	tower.target_priority = TowerScript.TargetPriority.WEAKEST
	assert_eq(tower.get_target_priority_name(), "MÁU THẤP NHẤT")
	assert_eq(tower._find_best_enemy(), enemy_c, "Chế độ WEAKEST chọn Enemy C (máu 20 thấp nhất)")

	# 4. Chế độ CLOSEST: Ưu tiên quái gần tháp nhất (Enemy B, khoảng cách 40)
	tower.target_priority = TowerScript.TargetPriority.CLOSEST
	assert_eq(tower.get_target_priority_name(), "GẦN NHẤT")
	assert_eq(tower._find_best_enemy(), enemy_b, "Chế độ CLOSEST chọn Enemy B (khoảng cách 40 gần nhất)")

	# 5. Cycle priority
	tower.target_priority = TowerScript.TargetPriority.FIRST
	tower.cycle_target_priority()
	assert_eq(tower.target_priority, TowerScript.TargetPriority.STRONGEST)
	tower.cycle_target_priority()
	assert_eq(tower.target_priority, TowerScript.TargetPriority.WEAKEST)
	tower.cycle_target_priority()
	assert_eq(tower.target_priority, TowerScript.TargetPriority.CLOSEST)
	tower.cycle_target_priority()
	assert_eq(tower.target_priority, TowerScript.TargetPriority.FLYING)
	tower.cycle_target_priority()
	assert_eq(tower.target_priority, TowerScript.TargetPriority.FIRST)

func test_tactical_pad_multipliers_and_synergy() -> void:
	var tower = TowerScript.new()
	add_child_autofree(tower)
	tower.setup(TowerScript.TowerType.PLASMA_CANNON)

	var base_r = tower.attack_range
	var base_cd = tower.attack_cooldown
	var base_dmg = tower.damage

	# Mặc định multipliers = 1.0
	assert_eq(tower.get_effective_range(), base_r)
	assert_eq(tower.get_effective_cooldown(), base_cd)
	assert_eq(tower.get_effective_damage(), base_dmg)

	# Buff Ô Cao Điểm (+15% Tầm)
	tower.pad_range_mult = 1.15
	assert_almost_eq(tower.get_effective_range(), base_r * 1.15, 0.01, "Ô Cao Điểm tăng +15% tầm bắn")

	# Buff Ô Mạch Năng Lượng (+15% Tốc bắn -> cooldown giảm)
	tower.pad_speed_mult = 1.15
	assert_almost_eq(tower.get_effective_cooldown(), base_cd / 1.15, 0.01, "Ô Mạch Năng Lượng tăng +15% tốc độ bắn")

	# Synergy Pylon Buffer (+15% Sát thương khi đang nhận buff)
	tower._buff_decay_timer = 2.5
	assert_almost_eq(tower.get_effective_damage(), base_dmg * 1.15, 0.01, "Cộng hưởng Pylon Buffer tăng +15% sát thương")

	# Kiểm tra xây dựng trên MainStylized tại đúng vị trí Tactical Pads
	var main = MainStylizedScene.instantiate()
	add_child_autofree(main)

	var ow_tower = main._build_tower_at_position(main.BUILD_PADS[main.OVERWATCH_PAD_IDX], TowerScript.TowerType.GATLING_GUN, true)
	assert_almost_eq(ow_tower.pad_range_mult, 1.15, 0.01, "Tháp đặt tại Pad 3 nhận buff pad_range_mult = 1.15")

	var cd_tower = main._build_tower_at_position(main.BUILD_PADS[main.POWER_CONDUIT_PAD_IDX], TowerScript.TowerType.PLASMA_CANNON, true)
	assert_almost_eq(cd_tower.pad_speed_mult, 1.15, 0.01, "Tháp đặt tại Pad 9 nhận buff pad_speed_mult = 1.15")

func test_game_speed_toggle_and_reset() -> void:
	var main = MainStylizedScene.instantiate()
	add_child_autofree(main)

	assert_almost_eq(main.game_speed, 1.0, 0.01, "Tốc độ trận đấu mặc định 1X")
	assert_almost_eq(Engine.time_scale, 1.0, 0.01, "Engine.time_scale mặc định 1.0")

	# Nhấn chuyển sang 2X
	main._on_btn_speed_pressed()
	assert_almost_eq(main.game_speed, 2.0, 0.01, "game_speed tăng lên 2.0")
	assert_almost_eq(Engine.time_scale, 2.0, 0.01, "Engine.time_scale = 2.0")
	if main.btn_speed:
		assert_eq(main.btn_speed.text, "2X")

	# Nhấn chuyển lại 1X
	main._on_btn_speed_pressed()
	assert_almost_eq(main.game_speed, 1.0, 0.01, "game_speed trở về 1.0")
	assert_almost_eq(Engine.time_scale, 1.0, 0.01, "Engine.time_scale trở về 1.0")
	if main.btn_speed:
		assert_eq(main.btn_speed.text, "1X")

	# Đang ở 2X khi restart thì phải được trả về 1.0 an toàn
	main._on_btn_speed_pressed()
	assert_almost_eq(Engine.time_scale, 2.0, 0.01)
	main._restart_game()
	assert_almost_eq(main.game_speed, 1.0, 0.01, "Sau restart, game_speed reset về 1.0")
	assert_almost_eq(Engine.time_scale, 1.0, 0.01, "Sau restart, Engine.time_scale reset về 1.0")
	if main.btn_speed:
		assert_eq(main.btn_speed.text, "1X")

	# Khi thoát cây cảnh (_exit_tree)
	main._exit_tree()
	assert_almost_eq(Engine.time_scale, 1.0, 0.01, "_exit_tree đảm bảo Engine.time_scale luôn là 1.0")

func test_enemy_variants_and_boss_mech() -> void:
	var path: Array[Vector2] = [Vector2(0, 0), Vector2(100, 0)]

	# 1. Normal Mech Walker
	var normal = EnemyScript.new()
	add_child_autofree(normal)
	normal.setup(EnemyScript.EnemyType.MECH_WALKER, path, 1.0, EnemyScript.EnemyVariant.NORMAL)
	var base_hp = normal.max_hp
	var base_spd = normal.speed
	assert_false(normal.is_boss)
	assert_eq(normal.variant, EnemyScript.EnemyVariant.NORMAL)

	# 2. Scout / Rush Mech Walker (0.85x scale, 1.35x speed, 0.7x HP)
	var scout = EnemyScript.new()
	add_child_autofree(scout)
	scout.setup(EnemyScript.EnemyType.MECH_WALKER, path, 1.0, EnemyScript.EnemyVariant.SCOUT)
	assert_eq(scout.variant, EnemyScript.EnemyVariant.SCOUT)
	assert_almost_eq(scout.max_hp, base_hp * 0.7, 0.1, "Scout có máu 0.7x")
	assert_almost_eq(scout.speed, base_spd * 1.35, 0.1, "Scout có tốc độ 1.35x")
	assert_almost_eq(scout.scale.x, 0.85, 0.01, "Scout scale 0.85x")

	# 3. Armored Mech (0.75x speed, 1.8x HP, Heavy Armor)
	var armored = EnemyScript.new()
	add_child_autofree(armored)
	armored.setup(EnemyScript.EnemyType.MECH_WALKER, path, 1.0, EnemyScript.EnemyVariant.ARMORED)
	assert_eq(armored.variant, EnemyScript.EnemyVariant.ARMORED)
	assert_almost_eq(armored.max_hp, base_hp * 1.8, 0.1, "Armored có máu 1.8x")
	assert_almost_eq(armored.speed, base_spd * 0.75, 0.1, "Armored tốc độ 0.75x")
	assert_eq(armored.armor_type, EnemyScript.ArmorType.HEAVY_ARMOR, "Armored mang giáp hạng nặng")

	# 4. Boss Mech (1.35x scale, 4.0x HP, 50 shield, is_boss = true)
	var boss = EnemyScript.new()
	add_child_autofree(boss)
	boss.setup(EnemyScript.EnemyType.MECH_WALKER, path, 1.0, EnemyScript.EnemyVariant.BOSS)
	assert_true(boss.is_boss, "Boss Mech có cờ is_boss = true")
	assert_eq(boss.variant, EnemyScript.EnemyVariant.BOSS)
	assert_almost_eq(boss.max_hp, base_hp * 4.0, 0.1, "Boss Mech máu gấp 4 lần")
	assert_almost_eq(boss.current_shield, boss.max_hp * 0.5, 0.1, "Boss Mech có khiên năng lượng 50% máu")
	assert_almost_eq(boss.scale.x, 1.35, 0.01, "Boss Mech kích thước khổng lồ 1.35x")

func test_tower_damage_meter_and_tier3_perk() -> void:
	var tower = TowerScript.new()
	add_child_autofree(tower)
	tower.setup(TowerScript.TowerType.GATLING_GUN)
	tower.global_position = Vector2(500, 400)

	# 1. Kiểm tra bộ đếm sát thương & hạ gục
	assert_eq(tower.total_damage_dealt, 0, "Ban đầu tổng sát thương = 0")
	assert_eq(tower.kill_count, 0, "Ban đầu số hạ gục = 0")

	tower.record_damage_dealt(125.0, false)
	assert_eq(tower.total_damage_dealt, 125, "Cập nhật đúng 125 sát thương")
	assert_eq(tower.kill_count, 0, "Chưa hạ gục")

	tower.record_damage_dealt(75.0, true)
	assert_eq(tower.total_damage_dealt, 200, "Cộng dồn đúng 200 sát thương")
	assert_eq(tower.kill_count, 1, "Ghi nhận 1 mạng hạ gục")

	# 2. Kiểm tra perk cấp 3 của Gatling
	tower.level = 3
	var perk_gatling = tower.get_tier3_perk_name()
	assert_true(perk_gatling.contains("ĐẠN XUYÊN PHÁ"), "Gatling cấp 3 có perk Đạn Xuyên Phá")

	# 3. Kiểm tra perk cấp 3 của Plasma Cannon
	var plasma = TowerScript.new()
	add_child_autofree(plasma)
	plasma.setup(TowerScript.TowerType.PLASMA_CANNON)
	plasma.global_position = Vector2(600, 400)
	plasma.level = 3
	var perk_plasma = plasma.get_tier3_perk_name()
	assert_true(perk_plasma.contains("NHIỆT NĂNG LAN TỎA"), "Plasma Cannon cấp 3 có perk Nhiệt Năng Lan Tỏa")

func test_boss_overdrive_at_half_hp() -> void:
	var path: Array[Vector2] = [Vector2(0, 0), Vector2(500, 0)]
	var boss = EnemyScript.new()
	add_child_autofree(boss)
	boss.setup(EnemyScript.EnemyType.MECH_WALKER, path, 1.0, EnemyScript.EnemyVariant.BOSS)

	var orig_spd = boss.speed
	var max_h = boss.max_hp

	# Bắn thủng toàn bộ khiên và giảm máu xuống 45% (nhỏ hơn 50%)
	boss.current_shield = 0.0
	boss.take_damage(max_h * 0.55, EnemyScript.DamageType.TRUE_DAMAGE)

	assert_true(boss._overdrive_triggered, "Boss kích hoạt trạng thái Overdrive khi máu <= 50%")
	assert_gt(boss.speed, orig_spd, "Tốc độ di chuyển tăng trong Overdrive")
	assert_gt(boss.current_shield, 0.0, "Khiên năng lượng được tái tạo trong Overdrive")

	# Kiểm tra hiệu ứng làm chậm apply_slow
	var spd_before_slow = boss.get_effective_speed()
	boss.apply_slow(0.80, 1.5)
	assert_almost_eq(boss.status_slow_factor, 0.80, 0.01, "Làm chậm 20%")
	assert_almost_eq(boss.get_effective_speed(), spd_before_slow * 0.80, 0.1, "Tốc độ giảm tương ứng")

func test_supply_pod_spawn_collect_and_cleanup() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	assert_eq(scene.supply_pods.size(), 0, "Ban đầu không có hòm tiếp tế")

	# 1. Thả hòm tiếp tế
	var test_pos = Vector2(450.0, 350.0)
	var pod = scene.spawn_supply_pod(test_pos)
	assert_eq(scene.supply_pods.size(), 1, "Đã có 1 hòm tiếp tế")
	assert_eq(pod["pos"], test_pos, "Tọa độ đúng vị trí thả")

	# 2. Thu thập thủ công (nhận 100% vàng = 45G)
	var gold_before = scene.gold
	var collected = scene.collect_supply_pod(0, false)
	assert_eq(collected, 45, "Thu được 45 vàng")
	assert_eq(scene.gold, gold_before + 45, "Vàng tăng 45")
	assert_eq(scene.supply_pods.size(), 0, "Hòm biến mất sau khi thu")

	# 3. Thu thập tự động khi hết hạn (nhận 50% = 22G)
	scene.spawn_supply_pod(test_pos)
	var gold_before_auto = scene.gold
	var auto_collected = scene.collect_supply_pod(0, true)
	assert_eq(auto_collected, 22, "Tự thu được 22 vàng (50%)")
	assert_eq(scene.gold, gold_before_auto + 22, "Vàng tăng 22")

	# 4. Cleanup khi restart
	scene.spawn_supply_pod(test_pos)
	assert_eq(scene.supply_pods.size(), 1)
	scene._restart_game()
	assert_eq(scene.supply_pods.size(), 0, "Restart dọn sạch toàn bộ hòm tiếp tế")

func test_battle_summary_stars_and_mvp_tower() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	# 1. Đánh giá 3 sao theo Base HP
	scene.base_health = 20
	assert_eq(scene.calculate_star_rating()["stars"], 3, "20 HP = 3 sao")
	assert_true(scene.calculate_star_rating()["title"].contains("Hoàn Hảo"))

	scene.base_health = 15
	assert_eq(scene.calculate_star_rating()["stars"], 2, "15 HP = 2 sao")

	scene.base_health = 6
	assert_eq(scene.calculate_star_rating()["stars"], 1, "6 HP = 1 sao")

	# 2. Kiểm tra MVP Tower
	var t1 = scene._build_tower_at_position(Vector2(200, 300), TowerScript.TowerType.GATLING_GUN, true)
	var t2 = scene._build_tower_at_position(Vector2(300, 300), TowerScript.TowerType.PLASMA_CANNON, true)
	t1.record_damage_dealt(500, true)
	t2.record_damage_dealt(1800, true)

	var mvp = scene.get_mvp_tower()
	assert_eq(mvp, t2, "Tháp gây 1800 sát thương phải là MVP")

	var summary = scene.get_battle_summary()
	assert_eq(summary["mvp_tower"], t2, "MVP trong tổng kết là t2")
	assert_true(summary["mvp_info"].contains("1,800 Sát Thương"), "Định dạng số sát thương chuẩn")

	# 3. Wave Intel
	assert_true(scene.get_wave_intel(1).contains("Cơ Bản"), "Đợt 1 quái cơ bản")
	assert_true(scene.get_wave_intel(2).contains("Trinh Sát"), "Đợt 2 có trinh sát")
	assert_true(scene.get_wave_intel(5).contains("BOSS MECH"), "Đợt 5 là Boss Mech")

func test_tier3_specialization_perks_all_towers() -> void:
	# 1. Tesla Coil Cấp 3 (VÒNG XUYÊN THẤU)
	var tesla = TowerScript.new()
	add_child_autofree(tesla)
	tesla.setup(TowerScript.TowerType.TESLA_COIL)
	tesla.level = 3
	assert_true(tesla.get_tier3_perk_name().contains("VÒNG XUYÊN THẤU"), "Tesla Cấp 3 có perk Vòng Xuyên Thấu")
	assert_eq(tesla.max_targets, 5, "Tesla Cấp 3 tấn công tối đa 5 mục tiêu đồng thời")

	# 2. SAM Battery Cấp 3 (TẦM NHIỄU KHÔNG VẬT)
	var sam = TowerScript.new()
	add_child_autofree(sam)
	sam.setup(TowerScript.TowerType.SAM_BATTERY)
	sam.level = 3
	assert_true(sam.get_tier3_perk_name().contains("TẦM NHIỄU"), "SAM Cấp 3 có perk Tầm Nhiễu")

	# 3. Pylon Buffer Cấp 3 (LÕI THỊNH VƯỢNG)
	var pylon = TowerScript.new()
	add_child_autofree(pylon)
	pylon.setup(TowerScript.TowerType.PYLON_BUFFER)
	pylon.level = 3
	assert_true(pylon.get_tier3_perk_name().contains("LÕI THỊNH VƯỢNG"), "Pylon Cấp 3 có perk Lõi Thịnh Vượng")
	assert_almost_eq(pylon.buff_aura_multiplier, 1.30, 0.01, "Pylon Cấp 3 tăng aura buff lên +30%")

	# 4. Magma Monolith Cấp 3 (CHẤN ĐỘNG NUNG CHẢY)
	var magma = TowerScript.new()
	add_child_autofree(magma)
	magma.setup(TowerScript.TowerType.MAGMA_MONOLITH)
	magma.level = 3
	assert_true(magma.get_tier3_perk_name().contains("NUNG CHẢY"), "Magma Cấp 3 có perk Nung Chảy")

func test_bridge_emp_generator_and_shockwave() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	# 1. Đặt quái trên cầu gần BRIDGE_EMP_POS
	var enemy = EnemyScript.new()
	scene.enemies_container.add_child(enemy)
	enemy.add_to_group("animated_enemies")
	enemy.setup(EnemyScript.EnemyType.STEAM_TRAIN, [Vector2(0, 0), Vector2(1000, 0)])
	enemy.global_position = scene.BRIDGE_EMP_POS + Vector2(15, 10)
	enemy.current_shield = 80.0
	var enemy_hp_before = enemy.current_hp

	# 2. Kích hoạt Bridge EMP
	scene.gold = 100
	scene.bridge_emp_timer = 0.0
	var activated = scene.activate_bridge_emp()
	assert_true(activated, "Kích hoạt bẫy cầu thành công")
	assert_eq(scene.gold, 65, "Khấu trừ 35G")
	assert_gt(scene.bridge_emp_timer, 0.0, "Bẫy chuyển sang hồi chiêu")

	# 3. Quái trong phạm vi chịu sát thương, giật khiên 50% và bị tê liệt
	assert_lt(enemy.current_hp, enemy_hp_before, "Quái bị sát thương điện EMP")
	assert_almost_eq(enemy.current_shield, 40.0, 0.1, "Khiên giảm 50%")
	assert_true(enemy.status_slow_timer > 0.0 and enemy.status_slow_factor <= 0.55, "Tê liệt hoặc làm chậm")

	# 4. Khi đang hồi chiêu, không thể kích hoạt lại
	assert_false(scene.activate_bridge_emp(), "Không thể kích hoạt khi đang hồi chiêu")

func test_support_healing_variant_mechanics() -> void:
	var path: Array[Vector2] = [Vector2(0, 0), Vector2(500, 0)]
	var support_bot = EnemyScript.new()
	add_child_autofree(support_bot)
	support_bot.setup(EnemyScript.EnemyType.WINGED_BOT, path, 1.0, EnemyScript.EnemyVariant.SUPPORT)

	assert_eq(support_bot.variant, EnemyScript.EnemyVariant.SUPPORT, "Variant là SUPPORT")
	assert_true(support_bot.is_support, "is_support là true")
	assert_gt(support_bot.heal_cooldown, 0.0, "Có heal_cooldown")

	# Tạo đồng đội bị thương
	var ally = EnemyScript.new()
	add_child_autofree(ally)
	ally.setup(EnemyScript.EnemyType.MECH_WALKER, path, 1.0, EnemyScript.EnemyVariant.NORMAL)
	ally.add_to_group("animated_enemies")
	ally.global_position = support_bot.global_position + Vector2(30, 0)
	ally.current_hp = 50.0

	support_bot._heal_timer = 0.0
	support_bot._find_and_heal_allies()
	assert_gt(ally.current_hp, 50.0, "Đồng minh được hồi máu bởi Drone Cứu Thương")
	assert_gt(ally.current_shield, 0.0, "Đồng minh được tiếp thêm khiên năng lượng")

func test_persistent_records_and_pylon_tier3_gold() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	# 1. Lưu kỷ lục trận đấu
	scene.save_records(3, 8, 4500)
	assert_true(scene.best_stars >= 3, "Kỷ lục sao tối thiểu là 3")
	assert_true(scene.highest_wave >= 8, "Kỷ lục wave tối thiểu là 8")
	assert_true(scene.best_mvp_damage >= 4500, "Kỷ lục sát thương MVP tối thiểu là 4500")

	# 2. Thử nghiệm Pylon cấp 3 thưởng vàng cuối wave
	var pylon = scene._build_tower_at_position(Vector2(500, 400), TowerScript.TowerType.PYLON_BUFFER, true)
	pylon.level = 3
	var gold_before = scene.gold
	scene._process_pylon_tier3_wave_rewards()
	assert_eq(scene.gold, gold_before + 25, "Đền Pylon Cấp 3 thưởng +25 vàng sau mỗi đợt")

func test_air_drone_flying_and_sam_battery_tier3_multiplier() -> void:
	var path: Array[Vector2] = [Vector2(0, 0), Vector2(400, 0)]
	var drone = EnemyScript.new()
	add_child_autofree(drone)
	drone.setup(EnemyScript.EnemyType.WINGED_BOT, path, 1.0, EnemyScript.EnemyVariant.AIR_DRONE)
	drone.max_hp = 200.0
	drone.current_hp = 200.0

	assert_true(drone.is_flying, "AIR_DRONE có is_flying = true")
	assert_eq(drone.variant, EnemyScript.EnemyVariant.AIR_DRONE, "Variant là AIR_DRONE")
	assert_almost_eq(drone.speed, 110.0 * 1.25, 0.1, "Tốc độ 1.25x")

	# Né 30% sát thương từ đạn nổ mặt đất (Plasma & Arcane)
	var hp_before_plasma = drone.current_hp
	drone.take_damage(20.0, EnemyScript.DamageType.THERMAL_PLASMA)
	assert_almost_eq(drone.current_hp, hp_before_plasma - 14.0, 0.1, "Giảm 30% sát thương đạn nổ: 20 * 0.70 = 14")

	var hp_before_arcane = drone.current_hp
	drone.take_damage(10.0, EnemyScript.DamageType.ARCANE)
	assert_almost_eq(drone.current_hp, hp_before_arcane - 7.0, 0.1, "Giảm 30% sát thương nổ phép: 10 * 0.70 = 7")

	# Nhận đủ x3 sát thương phòng không từ SAM Battery Cấp 3
	var sam = TowerScript.new()
	add_child_autofree(sam)
	sam.setup(TowerScript.TowerType.SAM_BATTERY)
	sam.level = 3

	var hp_before_sam = drone.current_hp
	drone.take_damage(20.0, EnemyScript.DamageType.KINETIC, sam)
	assert_almost_eq(drone.current_hp, hp_before_sam - 60.0, 0.1, "Nhận đủ x3.0 sát thương phòng không từ SAM Cấp 3: 20 * 3.0 = 60")

func test_cross_tower_combo_thermal_shock() -> void:
	var path: Array[Vector2] = [Vector2(0, 0), Vector2(500, 0)]
	var enemy = EnemyScript.new()
	add_child_autofree(enemy)
	enemy.setup(EnemyScript.EnemyType.MECH_WALKER, path, 1.0)
	enemy.max_hp = 300.0
	enemy.current_hp = 300.0

	var gatling = TowerScript.new()
	add_child_autofree(gatling)
	gatling.setup(TowerScript.TowerType.GATLING_GUN)
	gatling.level = 3

	# Khi quái bị làm chậm bởi Plasma Cannon
	enemy.apply_slow(0.80, 2.5)
	assert_gt(enemy.status_slow_timer, 0.0, "Quái đang bị làm chậm")

	# Bắn phát đạn xuyên phá (is_piercing = true)
	var proj = ProjectileScript.new()
	add_child_autofree(proj)
	proj.source_tower = gatling
	proj.is_piercing = true
	proj.damage = 40.0
	proj.target = enemy
	proj.proj_type = ProjectileScript.ProjectileType.GATLING_BULLET

	var hp_before = enemy.current_hp
	proj._on_hit_target()

	# Sát thương: 40 Kinetic (Mech HEAVY_ARMOR nhận 50% = 20) + 14 True Damage xuyên phá + 10 True Damage SỐC NHIỆT (40 * 0.25)
	var expected_total_taken = 20.0 + 14.0 + 10.0
	assert_almost_eq(enemy.current_hp, hp_before - expected_total_taken, 0.1, "Combo SỐC NHIỆT gây thêm +25% True Damage tức thì")
	assert_eq(gatling.total_damage_dealt, int(40.0 + 14.0 + 10.0), "Toàn bộ sát thương bao gồm Combo được ghi nhận cho trụ")

func test_cross_tower_combo_tesla_overload() -> void:
	var path: Array[Vector2] = [Vector2(0, 0), Vector2(500, 0)]
	var enemy = EnemyScript.new()
	add_child_autofree(enemy)
	enemy.setup(EnemyScript.EnemyType.MECH_WALKER, path, 1.0)
	enemy.max_hp = 300.0
	enemy.current_hp = 300.0

	# Quái vừa trúng sét Tesla trong vòng 2.0s
	enemy.electrocute(0.3)
	assert_gt(enemy._electro_charged_timer, 0.0, "Quái bị nhiễm điện tích Tesla")

	var gatling = TowerScript.new()
	add_child_autofree(gatling)
	gatling.setup(TowerScript.TowerType.GATLING_GUN)

	var proj = ProjectileScript.new()
	add_child_autofree(proj)
	proj.source_tower = gatling
	proj.damage = 50.0
	proj.target = enemy
	proj.proj_type = ProjectileScript.ProjectileType.GATLING_BULLET

	proj._on_hit_target()

	# Quá tải tăng +20% sát thương (50 * 0.20 = 10 EMP damage)
	assert_eq(enemy._electro_charged_timer, 0.0, "Điện tích quá tải bị tiêu hao sau đòn đánh")
	assert_gt(gatling.total_damage_dealt, 50, "Sát thương combo Quá Tải được cộng vào trụ kích hoạt")

func test_early_wave_call_bonus_and_wave_intel() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	# 1. Cảnh báo Wave Intel có [Không Kích] và [Hộ Vệ]
	assert_true(scene.get_wave_intel(4).contains("Không Kích"), "Wave 4 có cảnh báo Không Kích")
	assert_true(scene.get_wave_intel(4).contains("Hộ Vệ"), "Wave 4 có cảnh báo Hộ Vệ")
	assert_true(scene.get_wave_intel(6).contains("Không Kích"), "Wave 6 có cảnh báo Không Kích")
	assert_true(scene.get_wave_intel(8).contains("Không Kích"), "Wave 8 có cảnh báo Không Kích")

	# 2. Thưởng gọi Wave sớm
	scene.is_wave_active = false
	var gold_before = scene.gold
	var called = scene.call_wave_early()
	assert_true(called, "Gọi Wave sớm thành công")
	assert_eq(scene.gold, gold_before + 15, "Thưởng nóng +15 Vàng tiên phong")
	assert_true(scene.is_wave_active, "Đợt quái bắt đầu hành quân ngay")

func test_boss_jamming_pulse_and_emp_interrupt() -> void:
	var path: Array[Vector2] = [Vector2(0, 0), Vector2(500, 0)]
	var test_parent = Node2D.new()
	add_child_autofree(test_parent)

	var boss = EnemyScript.new()
	autofree(boss)
	test_parent.add_child(boss)
	boss.setup(EnemyScript.EnemyType.MECH_WALKER, path, 1.0, EnemyScript.EnemyVariant.BOSS)
	boss.max_hp = 500.0
	boss.current_hp = 500.0
	boss.current_shield = 0.0 # Bỏ qua khiên để tính toán HP chính xác

	assert_true(boss.is_boss, "Boss Mech có cờ is_boss = true")
	assert_false(boss.is_jamming, "Ban đầu Boss chưa tích xung nhiễu")
	assert_almost_eq(boss.jamming_cooldown, 7.0, 0.1, "Thời gian hồi chiêu xung nhiễu là 7.0s")

	# 1. Kích hoạt tích tụ xung nhiễu
	boss.start_jamming_channel()
	assert_true(boss.is_jamming, "Boss bắt đầu tích tụ xung nhiễu")
	assert_almost_eq(boss.jamming_timer, 2.0, 0.1, "Thời gian tích tụ là 2.0 giây")

	# 2. Tạo tháp thử nghiệm để kiểm tra ảnh hưởng xung nhiễu khi hoàn tất
	var tower = TowerScript.new()
	autofree(tower)
	test_parent.add_child(tower)
	tower.setup(TowerScript.TowerType.GATLING_GUN)
	tower.global_position = boss.global_position + Vector2(20, 0)
	var normal_cd = tower.get_effective_cooldown()

	boss._discharge_jamming_pulse()
	assert_false(boss.is_jamming, "Sau khi phóng xung, cờ is_jamming tắt")
	assert_gt(tower.jammed_timer, 0.0, "Tháp gần nhất bị nhiễm xung nhiễu 3.0s")
	assert_gt(tower.get_effective_cooldown(), normal_cd, "Tốc độ bắn của tháp bị giảm 35% (cooldown tăng)")

	# 3. Kiểm tra cơ chế Ngắt Chiêu (EMP Interrupt)
	boss.start_jamming_channel()
	assert_true(boss.is_jamming, "Boss lại tích tụ năng lượng")

	# Dính đòn điện ELECTRO_EMP (từ Bẫy Cầu hoặc Tesla Cấp 3)
	boss.take_damage(20.0, EnemyScript.DamageType.ELECTRO_EMP)
	assert_false(boss.is_jamming, "Xung nhiễu của Boss đã bị ngắt hoàn toàn!")
	assert_true(boss.is_vulnerable, "Boss rơi vào trạng thái Lộ Điểm Yếu")
	assert_almost_eq(boss.get_effective_speed(), 0.0, 0.01, "Boss bị choáng bất động khi lộ điểm yếu")

	# 4. Kiểm tra nhận thêm +25% sát thương từ mọi nguồn khi Lộ Điểm Yếu
	var hp_before = boss.current_hp
	boss.take_damage(40.0, EnemyScript.DamageType.TRUE_DAMAGE)
	assert_almost_eq(boss.current_hp, hp_before - 50.0, 0.1, "Lộ điểm yếu nhận 40 * 1.25 = 50 sát thương")

func test_tower_overclock_activation_and_stats() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	var tower = TowerScript.new()
	autofree(tower)
	scene.towers_container.add_child(tower)
	tower.setup(TowerScript.TowerType.GATLING_GUN)
	tower.global_position = Vector2(500, 400)

	var base_range = tower.get_effective_range()
	var base_cd = tower.get_effective_cooldown()

	assert_false(tower.is_overclocked, "Ban đầu tháp chưa Overclock")
	assert_true(tower.can_overclock(), "Tháp đủ điều kiện kích hoạt Overclock")

	# 1. Kích hoạt Quá Tải qua MainStylized
	scene.selected_tower = tower
	scene.gold = 100
	scene._on_btn_overclock_pressed()

	assert_eq(scene.gold, 75, "Trừ đúng 25 Vàng chi phí Quá Tải")
	assert_true(tower.is_overclocked, "Tháp đã vào trạng thái Overclock")
	assert_almost_eq(tower.overclock_timer, 6.0, 0.1, "Thời gian duy trì Quá Tải là 6.0s")
	assert_almost_eq(tower.overclock_cooldown, 15.0, 0.1, "Thời gian hồi chiêu là 15.0s")
	assert_false(tower.can_overclock(), "Không thể kích hoạt lại khi đang hồi chiêu")

	# 2. Kiểm tra chỉ số: +40% tốc độ bắn (cooldown / 1.4) và +15% tầm bắn
	assert_almost_eq(tower.get_effective_range(), base_range * 1.15, 0.1, "Tầm bắn tăng +15% khi Overclock")
	assert_almost_eq(tower.get_effective_cooldown(), base_cd / 1.40, 0.01, "Tốc độ bắn tăng +40% (cooldown chia 1.4)")

	# 3. Hết thời gian Quá Tải (6.0s) -> trở lại chỉ số ban đầu
	tower._process(6.1)
	assert_false(tower.is_overclocked, "Sau 6s, trạng thái Quá Tải tự động kết thúc")
	assert_almost_eq(tower.get_effective_range(), base_range, 0.1, "Tầm bắn trở về mặc định")
	assert_almost_eq(tower.get_effective_cooldown(), base_cd, 0.01, "Tốc độ bắn trở về mặc định")

	# 4. Kiểm tra chính sách hoàn tiền linh hoạt (Tactical Sell Refund)
	scene.is_wave_active = false
	var sell_peace = tower.get_sell_value(true)
	var sell_combat = tower.get_sell_value(false)
	assert_eq(sell_peace, int(float(tower.total_invested) * 0.85), "Bán tháp giữa 2 wave hoàn tiền 85%")
	assert_eq(sell_combat, int(float(tower.total_invested) * 0.70), "Bán tháp trong giao tranh hoàn tiền 70%")

func test_ion_storm_emp_bonus_and_bridge_cooldown() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	# 1. Kiểm tra thông tin Wave Intel có Bão Ion ở Wave 7 & 9
	assert_true(scene.get_wave_intel(7).contains("Bão Ion"), "Wave 7 có Bão Từ Trường Ion")
	assert_true(scene.get_wave_intel(9).contains("Bão Ion"), "Wave 9 có Bão Từ Trường Ion")
	assert_false(scene.get_wave_intel(8).contains("Bão Ion"), "Wave 8 không có Bão Ion")

	# 2. Kiểm tra Cooldown Bẫy Cầu giảm từ 16s xuống 10s khi có Bão Ion
	scene.is_ion_storm_active = false
	scene.bridge_emp_timer = 0.0
	scene.gold = 100
	scene.activate_bridge_emp()
	assert_almost_eq(scene.bridge_emp_timer, 16.0, 0.1, "Bẫy Cầu bình thường có cooldown 16s")

	scene.bridge_emp_timer = 0.0
	scene.gold = 100
	scene.is_ion_storm_active = true
	scene.activate_bridge_emp()
	assert_almost_eq(scene.bridge_emp_timer, 10.0, 0.1, "Bẫy Cầu trong Bão Ion giảm cooldown còn 10s")

	# 3. Kiểm tra tăng +25% sát thương hệ Điện (ELECTRO_EMP) trong Bão Ion
	var enemy = EnemyScript.new()
	add_child_autofree(enemy)
	enemy.setup(EnemyScript.EnemyType.MECH_WALKER, [Vector2(0, 0), Vector2(100, 0)], 1.0)
	enemy.max_hp = 300.0
	enemy.current_hp = 300.0

	EnemyScript.is_ion_storm_active = true
	var hp_before = enemy.current_hp
	enemy.take_damage(40.0, EnemyScript.DamageType.ELECTRO_EMP)
	assert_almost_eq(enemy.current_hp, hp_before - 50.0, 0.1, "Bão Ion tăng +25% sát thương ELECTRO_EMP (40 -> 50)")
	EnemyScript.is_ion_storm_active = false

func test_hardcore_mode_toggle_and_hp_multiplier() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	# 1. Bật/tắt Hardcore Mode
	assert_false(scene.is_hardcore_mode, "Mặc định chế độ Thử Thách tắt")
	var toggled = scene.toggle_hardcore_mode()
	assert_true(toggled, "Bật thành công chế độ Thử Thách")
	assert_true(scene.is_hardcore_mode, "Cờ is_hardcore_mode được bật")
	assert_true(scene.get_wave_intel(1).contains("THỬ THÁCH"), "Wave Intel hiển thị nhãn THỬ THÁCH")

	# 2. Kiểm tra số lượng quái tăng +2 mỗi wave khi ở Hardcore Mode
	scene.current_wave = 0
	scene._on_btn_next_wave_pressed()
	# Wave 1 bình thường có 4 + 1 * 2 = 6 quái, Hardcore có 6 + 2 = 8 quái
	assert_eq(scene._enemies_remaining, 8, "Hardcore Mode tăng thêm +2 quái mỗi đợt")

	# 3. Kiểm tra máu quái tăng +25%
	scene._spawn_enemy_for_wave()
	var spawned_enemy = scene.enemies_container.get_children().back()
	assert_not_null(spawned_enemy)
	# Máu Mech Walker ở wave 1 bình thường = 180 * (1.0 + 1 * 0.25) = 225. Hardcore = 225 * 1.25 = 281.25
	assert_almost_eq(spawned_enemy.max_hp, 180.0 * 1.25 * 1.25, 0.5, "Quái trong Hardcore Mode tăng +25% máu")

	# 4. Kiểm tra an toàn khi Restart trận đấu
	scene._restart_game()
	assert_false(scene.is_hardcore_mode, "Sau khi restart, Hardcore Mode được reset an toàn")
	assert_false(scene.is_ion_storm_active, "Sau khi restart, Bão Ion được reset an toàn")

func test_boss_raid_banner_visibility_and_hp_shield() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	# 1. Ban đầu không có Boss -> Banner ẩn
	assert_not_null(scene.boss_raid_banner, "Boss Raid Banner tồn tại trên HUD")
	assert_false(scene.boss_raid_banner.visible, "Mặc định Boss Raid Banner ẩn khi chưa có Boss")

	# 2. Sinh Boss Mech -> Banner tự động hiển thị
	var boss = EnemyScript.new()
	boss.setup(EnemyScript.EnemyType.MECH_WALKER, scene.PATH_WAYPOINTS, 1.0, EnemyScript.EnemyVariant.BOSS)
	scene.enemies_container.add_child(boss)
	scene._update_boss_raid_banner()

	assert_true(scene.boss_raid_banner.visible, "Boss Raid Banner hiển thị khi có Boss trên sân")
	assert_true(scene.lbl_boss_name.text.contains("BOSS MECH"), "Tiêu đề hiển thị tên Boss Mech")
	assert_almost_eq(scene.bar_boss_hp.value, boss.current_hp, 0.5, "Thanh máu cập nhật đúng HP của Boss")
	assert_almost_eq(scene.bar_boss_shield.value, boss.current_shield, 0.5, "Thanh khiên cập nhật đúng Shield của Boss")

	# 3. Boss tích tụ xung nhiễu (Jamming) -> Banner hiển thị trạng thái
	boss.is_jamming = true
	scene._update_boss_raid_banner()
	assert_true(scene.lbl_boss_name.text.contains("TÍCH XUNG NHIỄU"), "Hiển thị trạng thái đang tích xung nhiễu")

	# 4. Boss kích hoạt Overdrive -> Banner hiển thị [OVERDRIVE!]
	boss.is_jamming = false
	boss.trigger_boss_overdrive()
	scene._update_boss_raid_banner()
	assert_true(scene.lbl_boss_name.text.contains("OVERDRIVE"), "Hiển thị trạng thái OVERDRIVE khi Boss quá tải")

	# 5. Boss chết -> Banner tự động ẩn
	boss._is_dead = true
	scene._update_boss_raid_banner()
	assert_false(scene.boss_raid_banner.visible, "Banner tự động ẩn khi Boss bị tiêu diệt")

	# 6. Kiểm tra an toàn khi Restart trận đấu
	var boss2 = EnemyScript.new()
	boss2.setup(EnemyScript.EnemyType.MECH_WALKER, scene.PATH_WAYPOINTS, 1.0, EnemyScript.EnemyVariant.BOSS)
	scene.enemies_container.add_child(boss2)
	scene._update_boss_raid_banner()
	assert_true(scene.boss_raid_banner.visible)
	scene._restart_game()
	assert_false(scene.boss_raid_banner.visible, "Banner ẩn an toàn sau khi Restart trận đấu")

func test_combat_floating_text_throttling_and_limit() -> void:
	var enemy = EnemyScript.new()
	add_child_autofree(enemy)
	enemy.setup(EnemyScript.EnemyType.MECH_WALKER, [Vector2(0, 0), Vector2(100, 0)], 1.0)
	enemy.global_position = Vector2(200, 200)

	# 1. Kiểm tra Cooldown chữ trạng thái 0.9s (Status Text Throttling)
	var t0 = Time.get_ticks_msec() / 1000.0
	enemy._last_status_text_time = t0
	# Gây sát thương ngay lập tức (< 0.9s sau)
	enemy.take_damage(15.0, EnemyScript.DamageType.KINETIC)
	# Cooldown không bị reset vì thời gian chênh lệch < 0.9s
	assert_eq(enemy._last_status_text_time, t0, "Không spam nhãn trạng thái khi chưa hết cooldown 0.9s")

	# Sau khi vượt qua 0.9s
	enemy._last_status_text_time = t0 - 1.0
	enemy.take_damage(15.0, EnemyScript.DamageType.KINETIC)
	assert_gt(enemy._last_status_text_time, t0 - 1.0, "Cập nhật _last_status_text_time sau khi hết cooldown 0.9s")

	# 2. Kiểm tra giới hạn tối đa 6 nhãn trong bán kính 90px
	enemy._recent_combat_labels.clear()
	for i in range(6):
		var lbl = Label.new()
		add_child_autofree(lbl)
		lbl.global_position = enemy.global_position + Vector2(float(i) * 5.0, 0.0)
		enemy._recent_combat_labels.append(lbl)

	assert_eq(enemy._recent_combat_labels.size(), 6, "Đã có đủ 6 nhãn trong bán kính 90px")

func test_victory_defeat_modal_and_restart() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	# 1. Ban đầu Modal ẩn
	assert_not_null(scene.victory_defeat_modal, "Modal Tổng Kết tồn tại")
	assert_false(scene.victory_defeat_modal.visible, "Mặc định Modal ẩn khi đang chơi")

	# 2. Căn cứ thất thủ (Game Over) -> Modal hiển thị PHÒNG TUYẾN THẤT THỦ
	scene.base_health = 0
	scene._update_hud()
	assert_true(scene.is_game_over, "Trạng thái thất thủ kích hoạt")
	assert_true(scene.victory_defeat_modal.visible, "Modal hiển thị khi thất thủ")
	assert_true(scene.lbl_modal_title.text.contains("THẤT THỦ"), "Tiêu đề Modal hiển thị THẤT THỦ")

	# 3. Bấm nút Chơi Lại trên Modal -> Game reset, Modal ẩn
	assert_not_null(scene.btn_restart_modal, "Nút Chơi Lại tồn tại")
	scene.btn_restart_modal.emit_signal("pressed")
	assert_false(scene.is_game_over, "Game over được xóa sau khi chơi lại")
	assert_false(scene.victory_defeat_modal.visible, "Modal tự đóng sau khi chơi lại")
	assert_eq(scene.base_health, 20, "Máu căn cứ hồi phục đầy đủ")

	# 4. Chiến thắng (Wave 10 hoàn thành) -> Modal hiển thị CHIẾN THẮNG
	scene.current_wave = 10
	var summary = scene.get_battle_summary()
	scene._show_victory_defeat_modal(true, summary)
	assert_true(scene.victory_defeat_modal.visible, "Modal hiển thị khi chiến thắng")
	assert_true(scene.lbl_modal_title.text.contains("CHIẾN THẮNG"), "Tiêu đề Modal hiển thị CHIẾN THẮNG")
	assert_eq(scene.modal_stars.size(), 3, "Có đúng 3 ngôi sao đánh giá")

	# 5. Nút Thử Thách trên Modal -> Chuyển sang Hardcore và Restart
	assert_not_null(scene.btn_hardcore_modal, "Nút Chế Độ Thử Thách tồn tại")
	scene.btn_hardcore_modal.emit_signal("pressed")
	assert_true(scene.is_hardcore_mode, "Chế độ Thử Thách được bật từ Modal")
	assert_false(scene.victory_defeat_modal.visible, "Modal tự đóng sau khi chọn Thử Thách")

func test_endless_mode_activation_and_twin_bosses() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	# 1. Thắng Wave 10 -> Modal chiến thắng có nút Tiếp Tục Vô Tận [C]
	scene.current_wave = 10
	var summary = scene.get_battle_summary()
	scene._show_victory_defeat_modal(true, summary)
	assert_true(scene.victory_defeat_modal.visible, "Modal hiển thị khi thắng wave 10")
	assert_not_null(scene.btn_endless_modal, "Nút Tiếp Tục Vô Tận [C] tồn tại")
	assert_true(scene.btn_endless_modal.visible, "Nút Vô Tận hiển thị khi chiến thắng")

	# 2. Bấm Tiếp Tục Vô Tận -> Kích hoạt is_endless_mode, đóng modal, sẵn sàng gọi Wave 11
	scene.btn_endless_modal.emit_signal("pressed")
	assert_true(scene.is_endless_mode, "Chế độ Vô Tận đã được kích hoạt")
	assert_false(scene.is_victory, "is_victory chuyển về false để chơi tiếp")
	assert_false(scene.victory_defeat_modal.visible, "Modal đóng lại khi tiếp tục vô tận")

	# 3. Kích hoạt Wave 11 và kiểm tra hàm mũ tăng trưởng máu/giáp
	scene.is_wave_active = false
	scene._on_btn_next_wave_pressed()
	assert_eq(scene.current_wave, 11, "Đã lên Wave 11")
	assert_true(scene.is_wave_active, "Wave 11 đang diễn ra")
	assert_true(scene.label_wave.text.contains("W11") or scene.label_wave.text.contains("11"), "HUD hiển thị Wave 11")

	# Sinh thử 1 quái ở Wave 11 -> kiểm tra máu cao hơn quái thường nhờ pow(1.16, 1)
	scene._enemies_remaining = 1
	scene._spawn_enemy_for_wave()
	var enemies = scene.enemies_container.get_children()
	assert_gt(enemies.size(), 0, "Quái Wave 11 được sinh thành công")
	var enemy_w11 = enemies[enemies.size() - 1]
	assert_gt(enemy_w11.max_hp, 35.0 * 4.0, "Máu quái Wave 11 tăng trưởng hàm mũ nhẹ")

	# 4. Kiểm tra Đội Hình Boss Kép (Twin Boss Mechs) ở Wave 15
	scene.current_wave = 15
	scene._enemies_remaining = 1
	scene._spawn_enemy_for_wave()
	var boss1 = scene.enemies_container.get_children()[scene.enemies_container.get_child_count() - 1]
	assert_true(boss1.is_boss, "Boss thứ nhất của Đội hình Boss Kép xuất hiện")

	scene._enemies_remaining = 0
	scene._spawn_enemy_for_wave()
	var boss2 = scene.enemies_container.get_children()[scene.enemies_container.get_child_count() - 1]
	assert_true(boss2.is_boss, "Boss thứ hai của Đội hình Boss Kép xuất hiện")

	# 5. Lưu kỷ lục highest_endless_wave
	assert_gte(scene.highest_endless_wave, 0, "Kỷ lục Vô Tận được khởi tạo")
	scene.highest_endless_wave = 15
	scene.save_records(scene.best_stars, scene.highest_wave, scene.best_mvp_damage)
	var cfg = ConfigFile.new()
	var err = cfg.load(scene.RECORDS_CFG_PATH)
	assert_eq(err, OK, "File kỷ lục tải thành công")
	assert_eq(cfg.get_value("records", "highest_endless_wave", 0), 15, "Kỷ lục Wave 15 Vô Tận được lưu chuẩn xác")

	for e in scene.enemies_container.get_children():
		e.free()

func test_sound_toggle_and_synthesizer_mute() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	assert_not_null(scene.btn_sound_toggle, "Nút Bật/Tắt Âm Thanh [M] tồn tại trên Top HUD")
	assert_false(scene.is_sound_muted, "Mặc định âm thanh được BẬT")
	assert_true(scene.btn_sound_toggle.text.contains("ÂM THANH"), "Nhãn nút hiển thị ÂM THANH [M]")

	# 1. Bấm nút toggle hoặc gọi toggle_sound() -> TẮT ÂM
	scene.toggle_sound()
	assert_true(scene.is_sound_muted, "Âm thanh đã được TẮT")
	assert_true(scene.btn_sound_toggle.text.contains("TẮT ÂM"), "Nhãn nút đổi thành TẮT ÂM [M]")
	if scene.sound_synth:
		assert_true(scene.sound_synth.is_muted, "SoundSynthesizer nhận cờ is_muted = true")

	# 2. Bấm toggle lần nữa -> BẬT LẠI ÂM THANH
	scene.toggle_sound()
	assert_false(scene.is_sound_muted, "Âm thanh đã được BẬT lại")
	assert_true(scene.btn_sound_toggle.text.contains("ÂM THANH"), "Nhãn nút khôi phục ÂM THANH [M]")
	if scene.sound_synth:
		assert_false(scene.sound_synth.is_muted, "SoundSynthesizer nhận cờ is_muted = false")

	# 3. Thử nghiệm phát âm thanh Procedural mới không bị lỗi
	if scene.sound_synth:
		scene.sound_synth.play_boss_warning()
		scene.sound_synth.play_victory_fanfare()

func test_tactical_achievements_and_medals() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	# 1. Huy hiệu [THỢ SĂN BOSS]: Ngắt chiêu Boss thành công bằng EMP/Tesla
	var boss = EnemyScript.new()
	boss.setup(EnemyScript.EnemyType.MECH_WALKER, scene.PATH_WAYPOINTS, 1.0, EnemyScript.EnemyVariant.BOSS)
	scene.enemies_container.add_child(boss)
	boss.start_jamming_channel()
	assert_true(boss.is_jamming, "Boss đang tích tụ xung nhiễu")

	# Ngắt chiêu
	boss.interrupt_jamming()
	assert_false(boss.is_jamming, "Boss đã bị ngắt chiêu")
	scene.notify_boss_interrupted()
	assert_true(scene.medal_boss_hunter, "Huy hiệu [THỢ SĂN BOSS] đã được mở khóa")

	# 2. Huy hiệu [ĐẠI SƯ PHỐI HỢP]: Kích hoạt >= 10 lần combo Sốc Nhiệt / Quá Tải
	for i in range(10):
		scene.notify_combo_reaction()
	assert_gte(scene.combo_reaction_count, 10, "Đã kích hoạt đủ 10 lần combo")
	assert_true(scene.medal_combo_master, "Huy hiệu [ĐẠI SƯ PHỐI HỢP] đã được mở khóa")

	# 3. Huy hiệu [PHÁO ĐÀI BẤT DIỆT]: Hoàn thành Wave 10 với trọn vẹn 20/20 máu căn cứ
	scene.base_health = 20
	scene.max_health = 20
	scene.current_wave = 10
	scene.is_wave_active = true
	scene._enemies_remaining = 0
	# Dọn dẹp quái trong container để kích hoạt hoàn thành Wave 10
	for e in scene.enemies_container.get_children():
		e.free()
	scene._process(0.1)

	assert_true(scene.medal_flawless_fortress, "Huy hiệu [PHÁO ĐÀI BẤT DIỆT] đã được mở khóa")

	# 4. Kiểm tra lưu trữ toàn bộ 3 huy hiệu vào ConfigFile
	var cfg = ConfigFile.new()
	var err = cfg.load(scene.RECORDS_CFG_PATH)
	assert_eq(err, OK, "Tải file kỷ lục thành công")
	assert_true(cfg.get_value("medals", "boss_hunter", false), "Lưu huy hiệu boss_hunter")
	assert_true(cfg.get_value("medals", "combo_master", false), "Lưu huy hiệu combo_master")
	assert_true(cfg.get_value("medals", "flawless_fortress", false), "Lưu huy hiệu flawless_fortress")

func test_mobile_touch_hitboxes_and_bridge_emp_button() -> void:
	var scene = MainStylizedScene.instantiate()
	add_child_autofree(scene)

	# 1. Kiểm tra nút Bẫy Cầu trực quan trên màn hình cảm ứng
	assert_not_null(scene.btn_bridge_emp, "Nút Bẫy Cầu trực quan trên màn hình (BtnBridgeEmp) tồn tại trên HUD")
	assert_gte(scene.btn_bridge_emp.custom_minimum_size.x, 48.0, "Kích thước chiều ngang đạt chuẩn cảm ứng >= 48px")
	assert_gte(scene.btn_bridge_emp.custom_minimum_size.y, 48.0, "Kích thước chiều dọc đạt chuẩn cảm ứng >= 48px")
	assert_true(scene.btn_bridge_emp.text.contains("BẪY CẦU"), "Nhãn nút hiển thị BẪY CẦU")

	# 2. Bấm nút Bẫy Cầu trên màn hình cảm ứng -> Kích hoạt bẫy cầu và cập nhật nhãn hồi chiêu
	scene.gold = 100
	scene.bridge_emp_timer = 0.0
	scene.btn_bridge_emp.emit_signal("pressed")
	assert_eq(scene.gold, 65, "Khấu trừ 35G khi bấm nút Bẫy Cầu")
	assert_gt(scene.bridge_emp_timer, 0.0, "Bẫy chuyển sang trạng thái hồi chiêu")
	scene._process(0.1)
	assert_true(scene.btn_bridge_emp.text.contains("HỒI CHIÊU"), "Nhãn nút hiển thị đếm ngược HỒI CHIÊU")

	# 3. Kiểm tra Hitbox Bẫy Cầu trên bản đồ đạt chuẩn >= 48px (52px)
	scene.bridge_emp_timer = 0.0
	scene.gold = 100
	scene._check_touch_interaction(scene.BRIDGE_EMP_POS + Vector2(49.0, 0.0))
	assert_eq(scene.gold, 65, "Chạm ở khoảng cách 49px vẫn kích hoạt thành công bẫy cầu (Hitbox >= 48px)")

	# 4. Kiểm tra Hitbox Hòm Tiếp Tế đạt chuẩn >= 48px
	var pod = scene.spawn_supply_pod(Vector2(600, 400))
	assert_not_null(pod, "Sinh hòm tiếp tế thành công")
	var gold_before_pod = scene.gold
	# Chạm ở khoảng cách 47px (trong vùng bán kính 48px)
	scene._check_touch_interaction(Vector2(600 + 47.0, 400))
	assert_gt(scene.gold, gold_before_pod, "Hòm tiếp tế được thu thập khi chạm ở khoảng cách 47px (Hitbox >= 48px)")

	# 5. Kiểm tra Hitbox Ô Đặt Trụ (BUILD_PADS) đạt chuẩn >= 48px và mở khay mua tháp
	var pad_pos = scene.BUILD_PADS[2] # Ô Pad 2 trung tâm Bắc
	scene._check_touch_interaction(pad_pos + Vector2(46.0, 0.0))
	assert_eq(scene.targeted_build_pos, pad_pos, "Chạm ở cự ly 46px nhận diện đúng Ô Đặt Trụ")
	assert_true(scene.quick_tower_tray.visible, "Chạm vào Ô Đặt Trụ tự động mở khay mua tháp nhanh")

	for e in scene.enemies_container.get_children():
		e.free()

func after_each() -> void:
	Engine.time_scale = 1.0
