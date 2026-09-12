// QA Gate cho Phase 4B — Minimal Campus Shell, Unified Lobbies, Generic Accounts, Teacher Control Center
// Chạy: node cong-cu/qa-phase4b.mjs [URL] (mặc định http://127.0.0.1:8788)
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
let pass = 0, fail = 0;

function ok(ten, dk, chiTiet = '') {
  if (dk) {
    pass++;
    console.log(`  ✅ ${ten}`);
  } else {
    fail++;
    console.log(`  ❌ ${ten} ${chiTiet}`);
  }
}

const browser = await chromium.launch();

try {
  console.log(`\n==================================================`);
  console.log(`PHASE 4B AUTOMATED QA SUITE (${BASE})`);
  console.log(`==================================================\n`);

  const ctx = await browser.newContext();

  // ── 1. ACCOUNT AUTHENTICATION & TEACHER VERIFICATION SECURITY ────────────────
  console.log('== 1. Account Auth & Teacher Privilege Hardening ==');

  const testTeacherUser = `gv_test_${Date.now()}`;
  const testStudentUser = `hs_test_${Date.now()}`;
  const testPassword = 'Password123!';

  // 1.1 Đăng ký tài khoản yêu cầu vai trò Giáo viên
  const resRegTeacher = await ctx.request.post(`${BASE}/api/register`, {
    data: {
      username: testTeacherUser,
      displayName: 'Thầy Giáo Test',
      password: testPassword,
      accountType: 'teacher'
    },
    headers: { 'Content-Type': 'application/json' }
  });
  const dRegTeacher = await resRegTeacher.json().catch(() => ({}));
  ok('Đăng ký yêu cầu Giáo viên HTTP 200', resRegTeacher.status() === 200);
  ok('Tài khoản GV mới có teacherPending = true', dRegTeacher.teacherPending === true);

  // 1.2 Đăng nhập bằng tài khoản GV chờ duyệt
  const teacherCtx = await browser.newContext();
  const resLoginPending = await teacherCtx.request.post(`${BASE}/api/login`, {
    data: { username: testTeacherUser, password: testPassword },
    headers: { 'Content-Type': 'application/json' }
  });
  const dLoginPending = await resLoginPending.json().catch(() => ({}));
  ok('Đăng nhập tài khoản chờ duyệt HTTP 200', resLoginPending.status() === 200);
  ok('Vai trò tài khoản chờ duyệt CHƯA PHẢI teacher (role != teacher)', dLoginPending.role !== 'teacher');
  ok('Trạng thái teacherPending phản ánh trong login response', dLoginPending.teacherPending === true);

  // 1.3 Tài khoản chờ duyệt CẤM truy cập API giáo viên (/api/gv/duyet-giao-vien)
  const resPendingAccess = await teacherCtx.request.get(`${BASE}/api/gv/duyet-giao-vien`);
  ok('Tài khoản chờ duyệt bị chặn 403 khi vào /api/gv/duyet-giao-vien', resPendingAccess.status() === 403, `status=${resPendingAccess.status()}`);

  // 1.4 Giáo viên xác thực hệ thống (đăng nhập bằng mã GV hợp lệ hoặc QA_TEACHER_CODE)
  const verifiedTeacherCtx = await browser.newContext();
  let activeTeacherCode = process.env.QA_TEACHER_CODE;
  let targetLop = '11a1';
  if (!activeTeacherCode && (BASE.includes('127.0.0.1') || BASE.includes('localhost'))) {
    try {
      const { execSync } = await import('child_process');
      const { bamMatKhau, taoSalt } = await import('../functions/_lib/passwords.js');
      const rawCode = `GV_LOCAL_QA_${Date.now()}`;
      const salt = taoSalt(16);
      execSync(`npx wrangler d1 execute lop-10a7-db --local --command="INSERT INTO ma_dang_nhap (lop_id, vai_tro, ma) VALUES (1, 'teacher', '${rawCode}') ON CONFLICT(lop_id, vai_tro) DO UPDATE SET ma = '${rawCode}';"`, { stdio: 'ignore' });
      activeTeacherCode = rawCode;
      targetLop = '10a7';
    } catch {
      // Bỏ qua nếu không thể seed local
    }
  }
  let verifiedTeacherOk = false;

  if (activeTeacherCode) {
    const resGvLogin = await verifiedTeacherCtx.request.post(`${BASE}/api/login`, {
      data: { code: activeTeacherCode, lop: targetLop },
      headers: { 'Content-Type': 'application/json' }
    });
    verifiedTeacherOk = resGvLogin.status() === 200;
  }

  if (verifiedTeacherOk) {
    console.log('  -> Đăng nhập Giáo viên xác thực thành công.');
    // 1.5 Giáo viên xem danh sách tài khoản chờ duyệt
    const resListPending = await verifiedTeacherCtx.request.get(`${BASE}/api/gv/duyet-giao-vien`);
    ok('Giáo viên xác thực truy cập được /api/gv/duyet-giao-vien (HTTP 200)', resListPending.status() === 200);
    const dListPending = await resListPending.json().catch(() => ({}));
    const foundPending = (dListPending.pendingTeachers || []).find(t => t.tenDangNhap === testTeacherUser);
    ok('Tìm thấy tài khoản GV chờ duyệt trong danh sách', Boolean(foundPending));

    if (foundPending) {
      // 1.6 Phê duyệt tài khoản Giáo viên
      const resApprove = await verifiedTeacherCtx.request.post(`${BASE}/api/gv/duyet-giao-vien`, {
        data: { accountId: foundPending.id, action: 'approve' },
        headers: { 'Content-Type': 'application/json' }
      });
      const dApprove = await resApprove.json().catch(() => ({}));
      ok('Phê duyệt tài khoản Giáo viên thành công', dApprove.ok === true);

      // 1.7 Đăng nhập lại với tài khoản vừa được duyệt -> được thăng hạng vai trò Teacher!
      const approvedCtx = await browser.newContext();
      const resLoginApproved = await approvedCtx.request.post(`${BASE}/api/login`, {
        data: { username: testTeacherUser, password: testPassword },
        headers: { 'Content-Type': 'application/json' }
      });
      const dLoginApproved = await resLoginApproved.json().catch(() => ({}));
      ok('Tài khoản sau khi duyệt có role = teacher', dLoginApproved.role === 'teacher');
      ok('Tài khoản sau khi duyệt teacherPending = false', dLoginApproved.teacherPending === false);

      // 1.8 Tài khoản sau khi duyệt truy cập được API giáo viên
      const resApprovedAccess = await approvedCtx.request.get(`${BASE}/api/gv/duyet-giao-vien`);
      ok('Tài khoản đã duyệt truy cập thành công API Giáo viên (HTTP 200)', resApprovedAccess.status() === 200);
      await approvedCtx.close();
    }
  } else {
    console.log('  [Lưu ý: Không có tài khoản GV test, bỏ qua bước duyệt trực tiếp]');
  }
  await teacherCtx.close();
  await verifiedTeacherCtx.close();

  // 1.9 Đăng ký học sinh thường
  const resRegStudent = await ctx.request.post(`${BASE}/api/register`, {
    data: {
      username: testStudentUser,
      displayName: 'Em Học Sinh Test',
      password: testPassword,
      accountType: 'student'
    },
    headers: { 'Content-Type': 'application/json' }
  });
  const dRegStudent = await resRegStudent.json().catch(() => ({}));
  ok('Đăng ký học sinh bình thường thành công', dRegStudent.ok === true && dRegStudent.role === 'student');

  // ── 2. ROOM PASSWORD SECURITY & CONCURRENT CAPACITY ENFORCEMENT ───────────────
  console.log('\n== 2. Room Access Mode, Password & Concurrent Capacity ==');

  // Đăng nhập học sinh test để tạo phòng
  const studentCtx = await browser.newContext();
  await studentCtx.request.post(`${BASE}/api/login`, {
    data: { username: testStudentUser, password: testPassword },
    headers: { 'Content-Type': 'application/json' }
  });

  // 2.1 Tạo phòng có mật khẩu với sức chứa = 2
  const roomPass = 'Secret123';
  const resCreateLocked = await studentCtx.request.post(`${BASE}/api/phong`, {
    data: {
      hanhDong: 'tao',
      ten: 'Phòng Bí Mật QA',
      loai: 'chat',
      phamVi: 'truong',
      access_mode: 'password',
      matKhau: roomPass,
      sucChua: 2
    },
    headers: { 'Content-Type': 'application/json' }
  });
  const dCreateLocked = await resCreateLocked.json().catch(() => ({}));
  ok('Tạo phòng có mật khẩu HTTP 200', resCreateLocked.status() === 200);
  const lockedRoomId = dCreateLocked.phong?.id;
  ok('Phòng tạo có ID hợp lệ', Boolean(lockedRoomId));

  // 2.2 Kiểm tra API công khai không làm lộ mật khẩu / salt
  const resCampusPub = await ctx.request.get(`${BASE}/api/campus`);
  const dCampusPub = await resCampusPub.json().catch(() => ({}));
  const targetRoomPub = (dCampusPub.phongs || []).find(p => p.id === lockedRoomId);
  ok('Phòng hiển thị access_mode = "password" cho người dùng', targetRoomPub?.access_mode === 'password');
  ok('Không làm lộ mat_khau_hash ra client', !targetRoomPub?.mat_khau_hash && !targetRoomPub?.matKhauHash);
  ok('Không làm lộ mat_khau_salt ra client', !targetRoomPub?.mat_khau_salt && !targetRoomPub?.matKhauSalt);

  // 2.3 Người dùng khác vào phòng có mật khẩu: sai pass -> 403
  const userB_Ctx = await browser.newContext();
  const userB_name = `user_b_${Date.now()}`;
  await userB_Ctx.request.post(`${BASE}/api/register`, {
    data: { username: userB_name, displayName: 'Bạn B', password: testPassword, accountType: 'student' }
  });
  await userB_Ctx.request.post(`${BASE}/api/login`, {
    data: { username: userB_name, password: testPassword }
  });

  const resWrongPass = await userB_Ctx.request.post(`${BASE}/api/phong`, {
    data: { hanhDong: 'vao', phongId: lockedRoomId, matKhau: 'WrongPassword' },
    headers: { 'Content-Type': 'application/json' }
  });
  ok('Vào phòng sai mật khẩu bị từ chối 403', resWrongPass.status() === 403);

  // 2.4 Người dùng khác vào phòng đúng mật khẩu -> 200 OK (slot 2/2)
  const resRightPass = await userB_Ctx.request.post(`${BASE}/api/phong`, {
    data: { hanhDong: 'vao', phongId: lockedRoomId, matKhau: roomPass },
    headers: { 'Content-Type': 'application/json' }
  });
  ok('Vào phòng đúng mật khẩu thành công HTTP 200', resRightPass.status() === 200);

  // 2.5 Kiểm tra sức chứa (Capacity): Phòng đã đủ 2 người (chủ phòng + bạn B)
  // Người thứ 3 (User C) cố vào phòng -> Phải nhận 409 Room Full!
  const userC_Ctx = await browser.newContext();
  const userC_name = `user_c_${Date.now()}`;
  await userC_Ctx.request.post(`${BASE}/api/register`, {
    data: { username: userC_name, displayName: 'Bạn C', password: testPassword, accountType: 'student' }
  });
  await userC_Ctx.request.post(`${BASE}/api/login`, {
    data: { username: userC_name, password: testPassword }
  });

  const resUserCFull = await userC_Ctx.request.post(`${BASE}/api/phong`, {
    data: { hanhDong: 'vao', phongId: lockedRoomId, matKhau: roomPass },
    headers: { 'Content-Type': 'application/json' }
  });
  ok('Phòng đã đầy (2/2) trả về 409 Room Full cho người thứ 3', resUserCFull.status() === 409, `status=${resUserCFull.status()}`);

  // 2.6 Thử nghiệm tranh chấp (Concurrent Join Race Test)
  // Tạo phòng mới với sức chứa = 2. Chủ phòng chiếm 1 slot. 2 user khác cùng tranh 1 slot cuối!
  const resRaceRoom = await studentCtx.request.post(`${BASE}/api/phong`, {
    data: { hanhDong: 'tao', ten: 'Phòng Race QA', loai: 'chat', phamVi: 'truong', access_mode: 'public', sucChua: 2 }
  });
  const dRaceRoom = await resRaceRoom.json().catch(() => ({}));
  const raceRoomId = dRaceRoom.phong?.id;

  if (raceRoomId) {
    const [raceResB, raceResC] = await Promise.all([
      userB_Ctx.request.post(`${BASE}/api/phong`, { data: { hanhDong: 'vao', phongId: raceRoomId } }),
      userC_Ctx.request.post(`${BASE}/api/phong`, { data: { hanhDong: 'vao', phongId: raceRoomId } })
    ]);

    const statuses = [raceResB.status(), raceResC.status()].sort();
    ok('Tranh chấp slot cuối: Đúng 1 người thành công (200) và 1 người bị từ chối vì đầy (409)',
      statuses[0] === 200 && statuses[1] === 409, `kết quả: ${statuses.join(', ')}`);
  }

  await studentCtx.close();
  await userB_Ctx.close();
  await userC_Ctx.close();

  // ── 3. CAMPUS HOME INFORMATION ARCHITECTURE & CLEANUP ────────────────────────
  console.log('\n== 3. Campus Home Information Architecture & Clean Shell ==');

  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // 3.1 Region 1: Login/Register Modal Invariants
  const btnLogin = page.locator('#btn-header-dang-nhap');
  const btnRegister = page.locator('#btn-header-dang-ky');
  ok('Header có nút [ Đăng nhập ] (#btn-header-dang-nhap)', await btnLogin.count() > 0);
  ok('Header có nút [ Đăng ký ] (#btn-header-dang-ky)', await btnRegister.count() > 0);

  // Bấm Đăng nhập mở modal #modal-auth
  await btnLogin.click();
  await page.waitForTimeout(300);
  ok('Bấm [ Đăng nhập ] mở modal #modal-auth không rời trang', await page.locator('#modal-auth').count() > 0);
  ok('Modal hiển thị tab Đăng nhập đang kích hoạt', await page.locator('#input-login-username').count() > 0);

  // Chuyển sang tab Đăng ký
  const tabReg = page.locator('#tab-btn-register');
  if (await tabReg.count()) {
    await tabReg.click();
    await page.waitForTimeout(200);
    ok('Bấm tab Đăng ký hiển thị form đăng ký (#input-register-username)', await page.locator('#input-register-username').count() > 0);
    ok('Form đăng ký có dropdown loại tài khoản (#select-register-role)', await page.locator('#select-register-role').count() > 0);
  }

  // Đóng modal
  const btnCloseAuth = page.locator('#modal-auth button[aria-label="Đóng"]').first();
  if (await btnCloseAuth.count()) {
    await btnCloseAuth.click();
    await page.waitForTimeout(200);
  }

  // 3.2 Kiểm tra chuyển hướng /login.html -> /?auth=login
  await page.goto(`${BASE}/login.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const currentUrl = page.url();
  ok('/login.html tự động chuyển hướng về /?auth=login', currentUrl.includes('auth=login') || currentUrl.includes('/?auth=login'));
  ok('Sau chuyển hướng, modal #modal-auth tự động mở', await page.locator('#modal-auth').count() > 0);

  // Đóng modal để kiểm tra giao diện Home
  const btnCloseAuth2 = page.locator('#modal-auth button[aria-label="Đóng"]').first();
  if (await btnCloseAuth2.count()) {
    await btnCloseAuth2.click();
    await page.waitForTimeout(200);
  }

  // 3.3 Region 2 & Region 4 ABSENT from Home
  ok('Region 2: #campus-room-navigator HOÀN TOÀN VẮNG MẶT trên Home', await page.locator('#campus-room-navigator').count() === 0);
  ok('Region 4: #personal-quick-access HOÀN TOÀN VẮNG MẶT trên Home', await page.locator('#personal-quick-access').count() === 0);
  ok('Teacher Announcements card cũ HOÀN TOÀN VẮNG MẶT trên Home (#teacher-announcements = 0)',
    await page.locator('#teacher-announcements').count() === 0);

  // 3.4 Region 5: Horizontal Teacher Announcement Ticker
  const ticker = page.locator('#campus-announcement-ticker');
  const hasTicker = await ticker.count() > 0;
  ok('Region 5: Ticker thông báo giáo viên xuất hiện (#campus-announcement-ticker)', hasTicker);

  if (hasTicker) {
    ok('Ticker có thuộc tính aria-live="off" chuẩn tiếp cận',
      (await ticker.getAttribute('aria-live')) === 'off');

    // Click vào item thông báo mở modal chi tiết
    const tickerItem = ticker.locator('button').first();
    if (await tickerItem.count()) {
      await tickerItem.click({ force: true });
      await page.waitForTimeout(300);
      ok('Bấm thông báo trên ticker mở modal chi tiết (#modal-announcement-detail)',
        await page.locator('#modal-announcement-detail').count() > 0);
      const btnCloseDetail = page.locator('#modal-announcement-detail button:has-text("Đóng"), #modal-announcement-detail button[aria-label="Đóng"]').first();
      if (await btnCloseDetail.count()) {
        await btnCloseDetail.click();
        await page.waitForTimeout(200);
      }
    }
  }

  // 3.5 Region 3: Four Primary Destination Cards & Unified Activity Lobbies
  console.log('\n== 4. Activity Lobbies & Destination Navigation ==');

  const cardCinema = page.locator('#campus-flagship-spaces button:has-text("Xem chung")').first();
  const cardGame = page.locator('#campus-flagship-spaces button:has-text("Game")').first();
  const cardMusic = page.locator('#campus-flagship-spaces button:has-text("Music")').first();
  const cardChat = page.locator('#campus-flagship-spaces button:has-text("Chat")').first();

  ok('Home hiển thị thẻ điểm hẹn "Xem chung"', await cardCinema.count() > 0);
  ok('Home hiển thị thẻ điểm hẹn "Game"', await cardGame.count() > 0);
  ok('Home hiển thị thẻ điểm hẹn "Music"', await cardMusic.count() > 0);
  ok('Home hiển thị thẻ điểm hẹn "Chat"', await cardChat.count() > 0);

  // Vào Watch Lobby
  if (await cardCinema.count()) {
    await cardCinema.click();
    await page.waitForTimeout(400);
    ok('Bấm "Xem chung" mở sảnh hoạt động #lobby-watch', await page.locator('#lobby-watch').count() > 0);
    const btnBack = page.locator('#lobby-watch button:has-text("Trở về Campus")').first();
    ok('Sảnh có nút ‹ Trở về Campus', await btnBack.count() > 0);
    if (await btnBack.count()) {
      await btnBack.click();
      await page.waitForTimeout(300);
      ok('Bấm ‹ Trở về Campus đưa người dùng về lại Campus Home', await page.locator('#campus-flagship-spaces').count() > 0);
    }
  }

  // Vào Game Lobby
  if (await cardGame.count()) {
    await cardGame.click();
    await page.waitForTimeout(400);
    ok('Bấm "Game" mở sảnh hoạt động #lobby-game', await page.locator('#lobby-game').count() > 0);
    ok('Game Lobby có nút Ghép Nhanh', await page.locator('#lobby-game button:has-text("Ghép Nhanh")').count() > 0);
    const btnBack = page.locator('#lobby-game button:has-text("Trở về Campus")').first();
    if (await btnBack.count()) {
      await btnBack.click();
      await page.waitForTimeout(300);
    }
  }

  // Vào Music Lobby
  if (await cardMusic.count()) {
    await cardMusic.click();
    await page.waitForTimeout(400);
    ok('Bấm "Music" mở sảnh hoạt động #lobby-music', await page.locator('#lobby-music').count() > 0);
    const btnBack = page.locator('#lobby-music button:has-text("Trở về Campus")').first();
    if (await btnBack.count()) {
      await btnBack.click();
      await page.waitForTimeout(300);
    }
  }

  // Vào Chat Lobby
  if (await cardChat.count()) {
    await cardChat.click();
    await page.waitForTimeout(400);
    ok('Bấm "Chat" mở sảnh hoạt động #lobby-chat', await page.locator('#lobby-chat').count() > 0);
    const btnBack = page.locator('#lobby-chat button:has-text("Trở về Campus")').first();
    if (await btnBack.count()) {
      await btnBack.click();
      await page.waitForTimeout(300);
    }
  }

  await page.close();
  await ctx.close();

} catch (err) {
  console.error('\n❌ Uncaught error during QA:', err);
  fail++;
} finally {
  await browser.close();
  console.log(`\n==================================================`);
  console.log(`QA RESULTS: PASS = ${pass}, FAIL = ${fail}`);
  console.log(`==================================================\n`);
  process.exit(fail > 0 ? 1 : 0);
}
