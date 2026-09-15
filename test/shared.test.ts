import { describe, expect, it } from 'vitest'
import { chuanUrlVideo, layIdDrive, layIdYoutube, phanLoaiNguon } from '../shared/rooms/media'
import { conLaiPomodoro, viTriHienTai } from '../shared/rooms/timeline'

describe('link video phòng học', () => {
  it('chỉ nhận https; rỗng -> null; link lạ hoặc quá dài -> false', () => {
    expect(chuanUrlVideo('   ')).toBeNull()
    expect(chuanUrlVideo(undefined)).toBeNull()
    expect(chuanUrlVideo(' https://youtu.be/dQw4w9WgXcQ ')).toBe('https://youtu.be/dQw4w9WgXcQ')
    expect(chuanUrlVideo('http://youtu.be/dQw4w9WgXcQ')).toBe(false)
    expect(chuanUrlVideo('javascript:alert(1)')).toBe(false)
    expect(chuanUrlVideo('/api/video?khoa=1')).toBe(false)
    expect(chuanUrlVideo(`https://cdn.example.com/${'x'.repeat(1000)}.mp4`)).toBe(false)
  })

  it('nhận ra YouTube ở mọi dạng link phổ biến, không bị lừa bởi tên miền giả', () => {
    const cacLink = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ?t=42',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/live/dQw4w9WgXcQ',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    ]
    for (const url of cacLink) {
      expect(layIdYoutube(url)).toBe('dQw4w9WgXcQ')
      expect(phanLoaiNguon(url)).toBe('YOUTUBE')
    }
    expect(layIdYoutube('https://www.youtube.com/watch?v=ngan')).toBeNull()
    expect(layIdYoutube('https://youtube.com.gia-mao.example/watch?v=dQw4w9WgXcQ')).toBeNull()
  })

  it('Drive chỉ nhúng, file mp4/webm/ogg phát trực tiếp, còn lại không hỗ trợ', () => {
    expect(layIdDrive('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing')).toBe('1AbCdEfGhIjKlMnOp')
    expect(phanLoaiNguon('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view')).toBe('GOOGLE_DRIVE')
    expect(phanLoaiNguon('https://cdn.example.com/bai-giang.MP4?sig=1')).toBe('NATIVE_HTML5')
    expect(phanLoaiNguon('https://vimeo.com/123456')).toBe('UNSUPPORTED')
  })
})

describe('mốc thời gian đồng bộ', () => {
  it('video đang phát cộng thời gian trôi theo tốc độ; đang dừng giữ nguyên; đồng hồ lùi không làm lùi vị trí', () => {
    expect(viTriHienTai({ dangPhat: true, viTri: 10, tocDo: 1.5, capNhatLuc: 1_000 }, 5_000)).toBe(16)
    expect(viTriHienTai({ dangPhat: false, viTri: 10, tocDo: 2, capNhatLuc: 1_000 }, 9_000)).toBe(10)
    expect(viTriHienTai({ dangPhat: true, viTri: 3, tocDo: 1, capNhatLuc: 9_000 }, 1_000)).toBe(3)
  })

  it('Pomodoro chỉ trừ số giây tròn và không âm', () => {
    expect(conLaiPomodoro({ dangChay: true, conLai: 1500, capNhatLuc: 0 }, 2_999)).toBe(1498)
    expect(conLaiPomodoro({ dangChay: true, conLai: 5, capNhatLuc: 0 }, 60_000)).toBe(0)
    expect(conLaiPomodoro({ dangChay: false, conLai: 300, capNhatLuc: 0 }, 60_000)).toBe(300)
  })
})
