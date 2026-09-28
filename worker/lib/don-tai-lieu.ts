// Dọn tệp tài liệu phòng học khỏi R2 để không tốn chỗ lưu trữ:
// - ngay khi người trình chiếu thay tài liệu khác / đóng tài liệu, hoặc xoá tài liệu (không còn đường mở lại);
// - hằng đêm: tài liệu đã xoá mà tệp còn sót, tài liệu của phòng đã đóng.
// Dòng D1 giữ lại làm lịch sử (deleted_at); object_key = '' nghĩa là tệp đã dọn.

interface MoiTruongDon {
  DB: D1Database
  ANH: R2Bucket
}

/** Xoá hẳn tệp của một tài liệu trong phòng. Trả về true nếu có tệp được dọn. */
export async function donMotTaiLieu(env: MoiTruongDon, roomId: number, docId: number, bayGio = Date.now()): Promise<boolean> {
  const dong = await env.DB.prepare("SELECT object_key FROM phong_tai_lieu WHERE id = ?1 AND room_id = ?2 AND object_key != ''")
    .bind(docId, roomId)
    .first<{ object_key: string }>()
  if (!dong) return false
  await env.ANH.delete(dong.object_key)
  await env.DB.prepare("UPDATE phong_tai_lieu SET object_key = '', deleted_at = COALESCE(deleted_at, ?3) WHERE id = ?1 AND room_id = ?2")
    .bind(docId, roomId, bayGio)
    .run()
  return true
}

/** Dọn định kỳ: tài liệu đã xoá (tệp còn sót) và tài liệu của phòng đã đóng. Trả về số tệp đã dọn. */
export async function donTaiLieuBoDo(env: MoiTruongDon, bayGio = Date.now(), gioiHan = 500): Promise<number> {
  const { results } = await env.DB.prepare(
    `SELECT d.id, d.object_key FROM phong_tai_lieu d JOIN phong p ON p.id = d.room_id
     WHERE d.object_key != '' AND (d.deleted_at IS NOT NULL OR p.trang_thai = 'dong')
     LIMIT ?1`,
  )
    .bind(gioiHan)
    .all<{ id: number; object_key: string }>()
  if (results.length === 0) return 0
  await env.ANH.delete(results.map((r) => r.object_key))
  const capNhat = env.DB.prepare("UPDATE phong_tai_lieu SET object_key = '', deleted_at = COALESCE(deleted_at, ?2) WHERE id = ?1")
  await env.DB.batch(results.map((r) => capNhat.bind(r.id, bayGio)))
  return results.length
}
