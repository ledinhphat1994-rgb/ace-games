// Giữ chỗ trong lúc tải chunk của một trang: chiếm sẵn chiều cao để khung không sụt rồi nhảy (Zero CLS).
export function KhungChoTrang() {
  return <div className="min-h-[70vh] w-full" aria-busy="true" />
}
