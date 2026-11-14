import React from 'react';

interface AdBannerProps {
  format?: 'leaderboard' | 'rectangle' | 'banner';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ format = 'leaderboard', className = '' }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center my-4 ${className}`}>
      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
        — Vị Trí Quảng Cáo Tài Trợ (Google AdSense) —
      </span>

      {format === 'leaderboard' && (
        <div className="w-full max-w-[728px] h-[90px] bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-dashed border-indigo-500/30 rounded-xl flex items-center justify-center text-center p-3 text-xs text-gray-400 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3">
            <span className="text-xl">📢</span>
            <div>
              <p className="font-semibold text-gray-300">Banner Quảng Cáo Tối Ưu Doanh Thu (728x90)</p>
              <p className="text-[11px] text-gray-500">Tự động gắn mã Google AdSense / Ezoic khi trang web xuất bản</p>
            </div>
          </div>
        </div>
      )}

      {format === 'rectangle' && (
        <div className="w-[300px] h-[250px] bg-gradient-to-b from-slate-900 via-slate-800/40 to-slate-900 border border-dashed border-amber-500/30 rounded-xl flex flex-col items-center justify-center text-center p-4 text-xs text-gray-400 shadow-sm">
          <span className="text-2xl mb-1">🎯</span>
          <p className="font-semibold text-gray-300">Quảng Cáo Hình Chữ Nhật (300x250)</p>
          <p className="text-[11px] text-gray-500 mt-1">Vị trí cạnh game có tỷ lệ click (CTR) cao nhất</p>
        </div>
      )}

      {format === 'banner' && (
        <div className="w-full max-w-[320px] sm:max-w-[468px] h-[60px] bg-slate-900 border border-dashed border-slate-700 rounded-lg flex items-center justify-center text-xs text-gray-400">
          <span>Quảng Cáo Mobile (320x50)</span>
        </div>
      )}
    </div>
  );
};
