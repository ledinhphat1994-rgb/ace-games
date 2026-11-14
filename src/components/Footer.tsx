import React from 'react';
import { Gamepad2, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-arcade-card border-t border-arcade-border/80 mt-16 py-10 text-xs text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Col */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white font-['Orbitron']">PLAYZONE</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Cổng web game HTML5 giải trí miễn phí số 1. Không cần cài đặt, không chứa mã độc, tải siêu nhanh và tối ưu tuyệt vời cho mọi thiết bị từ máy tính, laptop đến iPad và điện thoại.
            </p>
          </div>

          {/* Open source notice */}
          <div>
            <div className="flex items-center gap-1.5 text-gray-200 font-bold mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bản Quyền Tự Do & Minh Bạch</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Toàn bộ các tựa game trên nền tảng PlayZone được tích hợp từ các dự án mã nguồn mở có giấy phép tự do (MIT, Apache 2.0, CC0). Chúng tôi tôn trọng quyền tác giả và phát triển bền vững.
            </p>
          </div>

          {/* Quick links & contact */}
          <div>
            <span className="text-gray-200 font-bold block mb-3">Thông Tin & Hỗ Trợ</span>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="hover:text-indigo-400 transition">Giới Thiệu Về PlayZone</a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-indigo-400 transition">Chính Sách Quyền Riêng Tư (Privacy)</a>
              </li>
              <li>
                <a href="#terms" className="hover:text-indigo-400 transition">Điều Khoản Sử Dụng (Terms of Service)</a>
              </li>
              <li>
                <span className="text-gray-500">Liên hệ hợp tác: ledinhphat1994@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-arcade-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500">
          <p>© {new Date().getFullYear()} PlayZone Portal. Tự do phát triển bởi ledinhphat1994.</p>
          <p className="flex items-center gap-1">
            Được xây dựng với <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> và mã nguồn mở.
          </p>
        </div>
      </div>
    </footer>
  );
};
