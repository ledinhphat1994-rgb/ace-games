export function json(duLieu: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(duLieu), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  })
}

export function loi(thongDiep: string, status = 400): Response {
  return json({ ok: false, loi: thongDiep }, status)
}
