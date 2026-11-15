import React from 'react';
import { UserX, RefreshCw, X } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface OpponentLeftModalProps {
  isOpen: boolean;
  opponentName?: string;
  onClose: () => void;
  onFindNewMatch?: () => void;
}

export const OpponentLeftModal: React.FC<OpponentLeftModalProps> = ({
  isOpen,
  opponentName = 'Đối thủ',
  onClose,
  onFindNewMatch,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    soundManager.playButtonClick();
    onClose();
  };

  const handleFindNew = () => {
    soundManager.playButtonClick();
    onClose();
    if (onFindNewMatch) {
      onFindNewMatch();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xs sm:max-w-sm bg-slate-950/95 border border-rose-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col items-center text-center">
        {/* Nút đóng góc phải */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon huy hiệu nổi bật */}
        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mb-3.5 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
          <UserX className="w-7 h-7 text-rose-400" />
        </div>

        {/* Tiêu đề ngắn gọn, dễ hiểu */}
        <h3 className="text-xl sm:text-2xl font-black text-rose-400 mb-2 tracking-wide">
          ĐỐI THỦ ĐÃ RỜI PHÒNG
        </h3>

        {/* Nội dung thông báo */}
        <p className="text-xs sm:text-sm text-gray-300 mb-6 font-medium leading-relaxed">
          <span className="text-white font-bold">{opponentName.toUpperCase()}</span> đã thoát khỏi bàn đấu.
        </p>

        {/* Các nút hành động */}
        <div className="flex flex-col w-full gap-2.5">
          {onFindNewMatch && (
            <button
              onClick={handleFindNew}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.35)] transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tìm Trận Mới</span>
            </button>
          )}

          <button
            onClick={handleClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-gray-300 hover:text-white font-bold text-xs sm:text-sm transition cursor-pointer active:scale-95"
          >
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
