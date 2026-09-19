import { exports } from 'cloudflare:workers'
import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiPhong } from '../shared/protocol/room'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'

/** Chèn phòng học loại 'video' vào D1, trả về id */
async function chenPhong(
  ten: string,
  chuPhongKhoa = 'acc:1',
): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO phong
       (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten,
        access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, 'truong', NULL, ?2, 'Host', 'public', 20, 'mo')
     RETURNING id`,
  )
    .bind(ten, chuPhongKhoa)
    .first<{ id: number }>()
  if (!res) throw new Error('Không chèn được phòng vào D1')
  return res.id
}

describe('Learning Session v1 Subsystems (Server Authority & Lifecycle)', () => {
  it('1. Session Goal: Host sets and clears goal, member attempt is rejected', async () => {
    const roomId = await chenPhong('Phòng Học Mục Tiêu')
    const cHost = await dangNhapLayCookie('qa.v2.thu1')
    const cMember = await dangNhapLayCookie('qa.v2.thu2')

    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
    const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cMember)

    await host.cho('room.snapshot')
    await member.cho('room.snapshot')

    // Host sets goal
    host.gui({
      type: 'session.action',
      data: { action: 'goal.set', text: 'Ôn tập Giải tích chương 2' },
    })
    const gGoal = await member.cho('session.goal.sync', (g) => g.goal?.text === 'Ôn tập Giải tích chương 2')
    expect(gGoal.goal?.text).toBe('Ôn tập Giải tích chương 2')
    expect(gGoal.goal?.setBy).toBe('QA Thử nghiệm 1')

    // Member attempts to overwrite goal -> ignored by server
    member.gui({
      type: 'session.action',
      data: { action: 'goal.set', text: 'Hack goal by member' },
    })
    await host.khongNhan('session.goal.sync', (g) => g.goal?.text === 'Hack goal by member', 300)

    // Host clears goal
    host.gui({
      type: 'session.action',
      data: { action: 'goal.clear' },
    })
    const gClear = await member.cho('session.goal.sync', (g) => g.goal === null)
    expect(gClear.goal).toBeNull()

    host.dong()
    member.dong()
  })

  it('2. Task Checklist: Host manages tasks, each user ticks independently', async () => {
    const roomId = await chenPhong('Phòng Học Nhiệm Vụ')
    const cHost = await dangNhapLayCookie('qa.v2.thu1')
    const cMember = await dangNhapLayCookie('qa.v2.thu2')

    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
    const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cMember)

    await host.cho('room.snapshot')
    await member.cho('room.snapshot')

    // Host adds 2 tasks
    host.gui({
      type: 'session.action',
      data: { action: 'task.add', text: 'Bài tập 1 trang 45' },
    })
    const gTask1 = await member.cho('session.tasks.sync', (g) => g.tasks.length === 1)
    expect(gTask1.tasks[0].text).toBe('Bài tập 1 trang 45')
    const taskId1 = gTask1.tasks[0].id

    host.gui({
      type: 'session.action',
      data: { action: 'task.add', text: 'Bài tập 2 trang 45' },
    })
    const gTask2 = await member.cho('session.tasks.sync', (g) => g.tasks.length === 2)
    const taskId2 = gTask2.tasks[1].id

    // Member attempts to add task -> ignored
    member.gui({
      type: 'session.action',
      data: { action: 'task.add', text: 'Unauthorized Task' },
    })
    await host.khongNhan('session.tasks.sync', (g) => g.tasks.some((t) => t.text === 'Unauthorized Task'), 300)

    // Member (acc:2, accountId: 2) ticks task 1
    member.gui({
      type: 'session.action',
      data: { action: 'task.tick', taskId: taskId1 },
    })
    const gTick1 = await host.cho('session.tasks.sync', (g) => (g.completionMap[taskId1] ?? []).includes(2))
    expect(gTick1.completionMap[taskId1]).toContain(2)

    // Host (acc:1, accountId: 1) also ticks task 1
    host.gui({
      type: 'session.action',
      data: { action: 'task.tick', taskId: taskId1 },
    })
    const gTick2 = await member.cho('session.tasks.sync', (g) => (g.completionMap[taskId1] ?? []).includes(1))
    expect(gTick2.completionMap[taskId1]).toEqual(expect.arrayContaining([1, 2]))

    // Member unticks task 1
    member.gui({
      type: 'session.action',
      data: { action: 'task.untick', taskId: taskId1 },
    })
    const gUntick = await host.cho(
      'session.tasks.sync',
      (g) => (g.completionMap[taskId1] ?? []).includes(1) && !(g.completionMap[taskId1] ?? []).includes(2),
    )
    expect(gUntick.completionMap[taskId1]).toEqual([1])

    // Host removes task 2
    host.gui({
      type: 'session.action',
      data: { action: 'task.remove', taskId: taskId2 },
    })
    const gRemove = await member.cho('session.tasks.sync', (g) => g.tasks.length === 1)
    expect(gRemove.tasks.find((t) => t.id === taskId2)).toBeUndefined()

    host.dong()
    member.dong()
  })

  it('3. Session Timer: Host controls countdown, member cannot alter timer', async () => {
    const roomId = await chenPhong('Phòng Học Đồng Hồ')
    const cHost = await dangNhapLayCookie('qa.v2.thu1')
    const cMember = await dangNhapLayCookie('qa.v2.thu2')

    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
    const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cMember)

    await host.cho('room.snapshot')
    await member.cho('room.snapshot')

    // Host starts timer for 15 minutes (900s)
    host.gui({
      type: 'session.action',
      data: { action: 'timer.start', durationSeconds: 900 },
    })
    const gTimerStart = await member.cho('session.timer.sync', (g) => g.state.running && g.state.durationSeconds === 900)
    expect(gTimerStart.state.running).toBe(true)
    expect(gTimerStart.state.durationSeconds).toBe(900)
    expect(gTimerStart.state.endsAt).toBeGreaterThan(Date.now())

    // Member attempts to reset timer -> rejected/ignored
    member.gui({
      type: 'session.action',
      data: { action: 'timer.reset' },
    })
    await host.khongNhan('session.timer.sync', (g) => !g.state.running && g.state.remaining === 0, 300)

    // Host pauses timer
    host.gui({
      type: 'session.action',
      data: { action: 'timer.pause' },
    })
    const gTimerPause = await member.cho('session.timer.sync', (g) => !g.state.running)
    expect(gTimerPause.state.running).toBe(false)

    // Host resets timer
    host.gui({
      type: 'session.action',
      data: { action: 'timer.reset' },
    })
    const gTimerReset = await member.cho('session.timer.sync', (g) => g.state.remaining === 900 && !g.state.running)
    expect(gTimerReset.state.remaining).toBe(900)

    host.dong()
    member.dong()
  })

  it('4. Quick Poll: Host creates poll, member votes, host closes poll with live tallies', async () => {
    const roomId = await chenPhong('Phòng Bình Chọn Nhanh')
    const cHost = await dangNhapLayCookie('qa.v2.thu1')
    const cMember = await dangNhapLayCookie('qa.v2.thu2')

    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
    const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cMember)

    await host.cho('room.snapshot')
    await member.cho('room.snapshot')

    // Host creates quick poll
    host.gui({
      type: 'session.action',
      data: {
        action: 'poll.create',
        question: 'Độ khó bài 3 thế nào?',
        options: ['Dễ', 'Trung bình', 'Khó'],
      },
    })
    const gPollCreate = await member.cho('session.poll.sync', (g) => g.poll !== null && !g.poll.closed)
    expect(gPollCreate.poll?.question).toBe('Độ khó bài 3 thế nào?')
    expect(gPollCreate.poll?.options.length).toBe(3)
    const pollId = gPollCreate.poll!.id
    const opt0Id = gPollCreate.poll!.options[0].id

    // Member votes for option 0
    member.gui({
      type: 'session.action',
      data: {
        action: 'poll.vote',
        pollId,
        optionId: opt0Id,
      },
    })
    const gPollVote = await host.cho(
      'session.poll.sync',
      (g) => (g.voteCounts?.[opt0Id] ?? 0) >= 1,
    )
    expect(gPollVote.voteCounts?.[opt0Id]).toBe(1)

    // Host closes poll
    host.gui({
      type: 'session.action',
      data: { action: 'poll.close' },
    })
    const gPollClose = await member.cho('session.poll.sync', (g) => g.poll?.closed === true)
    expect(gPollClose.poll?.closed).toBe(true)

    host.dong()
    member.dong()
  })

  it('5. Session Lifecycle & Summary: Start, End, Summary Broadcast & D1 Persistence', async () => {
    const roomId = await chenPhong('Phòng Tổng Kết Buổi Học')
    const cHost = await dangNhapLayCookie('qa.v2.thu1')
    const cMember = await dangNhapLayCookie('qa.v2.thu2')

    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
    const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cMember)

    await host.cho('room.snapshot')
    await member.cho('room.snapshot')

    // Set goal and task before starting
    host.gui({
      type: 'session.action',
      data: { action: 'goal.set', text: 'Hoàn thành 10 câu trắc nghiệm' },
    })
    await member.cho('session.goal.sync')

    host.gui({
      type: 'session.action',
      data: { action: 'task.add', text: 'Trắc nghiệm câu 1-5' },
    })
    const gT = await member.cho('session.tasks.sync')
    const tId = gT.tasks[0].id

    // Member ticks task
    member.gui({
      type: 'session.action',
      data: { action: 'task.tick', taskId: tId },
    })
    await host.cho('session.tasks.sync', (g) => (g.completionMap[tId] ?? []).length > 0)

    // Host starts session
    host.gui({
      type: 'session.action',
      data: { action: 'session.start' },
    })
    // Give room a short moment for startedAt
    await new Promise((r) => setTimeout(r, 100))

    // Host ends session
    host.gui({
      type: 'session.action',
      data: { action: 'session.end' },
    })

    const gSummary = await member.cho('session.summary')
    expect(gSummary.summary.goal).toBe('Hoàn thành 10 câu trắc nghiệm')
    expect(gSummary.summary.taskCount).toBe(1)
    expect(gSummary.summary.taskCompletionRates[tId]).toBeGreaterThanOrEqual(1)
    expect(gSummary.summary.activeMembers.length).toBeGreaterThanOrEqual(1)

    // Verify D1 persistence in hoc_session_summary
    const row = await env.DB.prepare(
      'SELECT * FROM hoc_session_summary WHERE phong_id = ?1 ORDER BY started_at DESC LIMIT 1',
    )
      .bind(roomId)
      .first<{ id: string; summary_json: string }>()

    expect(row).toBeDefined()
    expect(row?.id).toBe(gSummary.summary.sessionId)
    const parsed = JSON.parse(row!.summary_json)
    expect(parsed.goal).toBe('Hoàn thành 10 câu trắc nghiệm')

    host.dong()
    member.dong()
  })

  it('6. REST API: GET /api/rooms/:id/sessions authorization & retrieval', async () => {
    const roomId = await chenPhong('Phòng REST Sessions')
    const cTeacher = await dangNhapLayCookie('qa.v2.gv')
    const cStudent = await dangNhapLayCookie('qa.v2.thu1')

    // Chèn trước một bản ghi summary vào D1
    await env.DB.prepare(
      `INSERT INTO hoc_session_summary
         (id, phong_id, started_at, ended_at, duration_seconds, summary_json)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
      .bind(
        'sess_test_123',
        roomId,
        Date.now() - 3600000,
        Date.now(),
        3600,
        JSON.stringify({
          sessionId: 'sess_test_123',
          roomId,
          goal: 'Luyện đề thi THPTQG',
          durationSeconds: 3600,
          taskCount: 2,
          activeMembers: ['QA Thử nghiệm 1'],
        }),
      )
      .run()

    // 1. Unauthenticated -> 401
    const unauthRes = await exports.default.fetch(`${GOC}/api/rooms/${roomId}/sessions`)
    expect(unauthRes.status).toBe(401)

    // 2. Student -> 403
    const studentRes = await exports.default.fetch(`${GOC}/api/rooms/${roomId}/sessions`, {
      headers: { Cookie: cStudent },
    })
    expect(studentRes.status).toBe(403)

    // 3. Teacher -> 200 OK
    const teacherRes = await exports.default.fetch(`${GOC}/api/rooms/${roomId}/sessions`, {
      headers: { Cookie: cTeacher },
    })
    expect(teacherRes.status).toBe(200)
    const data = await teacherRes.json() as { sessions: Array<{ sessionId: string; goal: string }> }
    expect(data.sessions).toBeDefined()
    expect(data.sessions.length).toBeGreaterThanOrEqual(1)
    expect(data.sessions[0].sessionId).toBe('sess_test_123')
    expect(data.sessions[0].goal).toBe('Luyện đề thi THPTQG')
  })
})
