import type { ReactionDetail } from '../../shared/protocol/campus'

export interface ActionReactionInput {
  action?: 'add' | 'remove' | 'replace' | 'increment'
  emoji?: string
  oldEmoji?: string
  emojis?: string[]
}

export function parseReactionData(raw: string | null | undefined): {
  emojis: string[]
  details: ReactionDetail[]
} {
  if (!raw) return { emojis: [], details: [] }
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const emojis = parsed.filter((item): item is string => typeof item === 'string' && item.length <= 10).slice(0, 3)
      return {
        emojis,
        details: emojis.map((emoji: string) => ({ emoji, count: 1, users: [] })),
      }
    }
    if (parsed && typeof parsed === 'object') {
      const emojis: string[] = Array.isArray(parsed.emojis)
        ? parsed.emojis.filter((item: unknown): item is string => typeof item === 'string' && item.length <= 10).slice(0, 3)
        : []
      let details: ReactionDetail[] = []
      if (Array.isArray(parsed.details)) {
        details = (parsed.details as ReactionDetail[])
          .filter((d) => d && typeof d.emoji === 'string')
          .slice(0, 3)
          .map((d) => ({
            emoji: d.emoji,
            count: typeof d.count === 'number' && d.count > 0 ? d.count : 1,
            users: Array.isArray(d.users) ? d.users : [],
          }))
      } else {
        details = emojis.map((emoji: string) => ({ emoji, count: 1, users: [] }))
      }
      return { emojis, details }
    }
  } catch {}
  return { emojis: [], details: [] }
}

export function xuLyCapNhatReactions(
  existingRaw: string | null | undefined,
  input: ActionReactionInput,
  currentUser: { id: number; name: string },
): {
  emojis: string[]
  details: ReactionDetail[]
  loi?: string
  statusCode?: number
} {
  let { emojis, details } = parseReactionData(existingRaw)

  // 1. Trường hợp caller gửi trực tiếp mảng emojis thô (ví dụ test suite hoặc xoá tất cả)
  if (Array.isArray(input.emojis)) {
    const targetEmojis = input.emojis.filter((e) => typeof e === 'string' && e.length <= 10).slice(0, 3)
    if (targetEmojis.length === 0) {
      return { emojis: [], details: [] }
    }

    // Cập nhật theo danh sách targetEmojis
    const nextDetails: ReactionDetail[] = []
    for (const em of targetEmojis) {
      const existing = details.find((d) => d.emoji === em)
      if (existing) {
        const hasUser = existing.users.some((u) => u.id === currentUser.id)
        nextDetails.push({
          emoji: em,
          count: hasUser ? existing.count : existing.count + 1,
          users: hasUser ? existing.users : [...existing.users, currentUser],
        })
      } else {
        nextDetails.push({
          emoji: em,
          count: 1,
          users: [currentUser],
        })
      }
    }
    return { emojis: targetEmojis, details: nextDetails.slice(0, 3) }
  }

  const { action = 'add', emoji: targetEmoji, oldEmoji } = input
  if (!targetEmoji && action !== 'remove') {
    return { emojis, details, loi: 'Thiếu emoji', statusCode: 400 }
  }

  // 2. Action: increment (Click thêm lần nữa vào emoji đã thả)
  if (action === 'increment' && targetEmoji) {
    const found = details.find((d) => d.emoji === targetEmoji)
    if (found) {
      found.count += 1
      if (!found.users.some((u) => u.id === currentUser.id)) {
        found.users.push(currentUser)
      }
    } else {
      if (details.length < 3) {
        details.push({ emoji: targetEmoji, count: 1, users: [currentUser] })
      }
    }
    emojis = details.map((d) => d.emoji)
    return { emojis, details }
  }

  // 3. Action: replace (Nhấn giữ im để đổi emoji của chính mình)
  if (action === 'replace' && targetEmoji && oldEmoji) {
    const foundOld = details.find((d) => d.emoji === oldEmoji)
    if (!foundOld) {
      return { emojis, details, loi: 'Không tìm thấy emoji cũ', statusCode: 404 }
    }
    // KIỂM TRA QUYỀN: Người dùng chỉ được sửa emoji của chính mình
    const userInOld = foundOld.users.some((u) => u.id === currentUser.id)
    if (foundOld.users.length > 0 && !userInOld) {
      return {
        emojis,
        details,
        loi: 'Bạn chỉ có thể sửa hoặc xóa biểu cảm do chính mình thả.',
        statusCode: 403,
      }
    }

    // Gỡ currentUser khỏi oldEmoji
    foundOld.users = foundOld.users.filter((u) => u.id !== currentUser.id)
    foundOld.count = Math.max(0, foundOld.count - 1)

    // Nếu oldEmoji không còn ai thì xoá hẳn
    if (foundOld.count <= 0 || foundOld.users.length === 0) {
      details = details.filter((d) => d.emoji !== oldEmoji)
    }

    // Thêm currentUser vào new targetEmoji
    const foundNew = details.find((d) => d.emoji === targetEmoji)
    if (foundNew) {
      foundNew.count += 1
      if (!foundNew.users.some((u) => u.id === currentUser.id)) {
        foundNew.users.push(currentUser)
      }
    } else {
      if (details.length < 3) {
        details.push({ emoji: targetEmoji, count: 1, users: [currentUser] })
      }
    }

    emojis = details.map((d) => d.emoji)
    return { emojis, details }
  }

  // 4. Action: remove (Double click để xoá emoji của chính mình)
  if (action === 'remove' && targetEmoji) {
    const found = details.find((d) => d.emoji === targetEmoji)
    if (!found) {
      return { emojis, details }
    }
    // KIỂM TRA QUYỀN: Người dùng chỉ được xoá emoji của chính mình
    const userInFound = found.users.some((u) => u.id === currentUser.id)
    if (found.users.length > 0 && !userInFound) {
      return {
        emojis,
        details,
        loi: 'Bạn chỉ có thể sửa hoặc xóa biểu cảm do chính mình thả.',
        statusCode: 403,
      }
    }

    // Gỡ currentUser khỏi emoji
    found.users = found.users.filter((u) => u.id !== currentUser.id)
    found.count = Math.max(0, found.count - 1)

    // Nếu không còn ai thả emoji này (hoặc count <= 0): XOÁ HẲN EMOJI ĐÓ LUÔN!
    // "nghĩa là có 3 hiển thị emoji thì khi xóa emoji đó sẽ còn 2 hiển thị chứ không thay thế bằng emoji trước đó"
    if (found.count <= 0 || found.users.length === 0) {
      details = details.filter((d) => d.emoji !== targetEmoji)
    }

    emojis = details.map((d) => d.emoji)
    return { emojis, details }
  }

  // 5. Action: add (Thả emoji mới)
  if (action === 'add' && targetEmoji) {
    const existing = details.find((d) => d.emoji === targetEmoji)
    if (existing) {
      if (!existing.users.some((u) => u.id === currentUser.id)) {
        existing.users.push(currentUser)
        existing.count += 1
      }
    } else {
      if (details.length >= 3) {
        // Thay thế vị trí cuối cùng
        details[2] = { emoji: targetEmoji, count: 1, users: [currentUser] }
      } else {
        details.push({ emoji: targetEmoji, count: 1, users: [currentUser] })
      }
    }
    emojis = details.map((d) => d.emoji)
    return { emojis, details }
  }

  return { emojis, details }
}
