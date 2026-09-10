'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Clock, BellRing, Search, Users } from 'lucide-react';
import { Announcement } from './types';

interface AcknowledgmentInspectModalProps {
  isOpen: boolean;
  announcement: Announcement | null;
  onClose: () => void;
  onSendReminders?: () => void;
}

export default function AcknowledgmentInspectModal({
  isOpen,
  announcement,
  onClose,
  onSendReminders,
}: AcknowledgmentInspectModalProps) {
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACKNOWLEDGED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [remindedSent, setRemindedSent] = useState(false);

  if (!isOpen || !announcement) return null;

  const ackList = announcement.acknowledgments;
  const acknowledgedCount = ackList.filter((a) => a.acknowledged).length;
  const pendingCount = ackList.length - acknowledgedCount;

  const filteredStudents = ackList.filter((st) => {
    if (filterTab === 'ACKNOWLEDGED' && !st.acknowledged) return false;
    if (filterTab === 'PENDING' && st.acknowledged) return false;
    if (searchQuery.trim() && !st.studentName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleRemindClick = () => {
    setRemindedSent(true);
    if (onSendReminders) onSendReminders();
    setTimeout(() => setRemindedSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#151A23] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-scaleUp flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Báo Cáo Tiếp Nhận Thông Báo
            </h3>
            <p className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
              {announcement.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Summary Bar */}
        <div className="grid grid-cols-2 gap-2 my-3">
          <button
            type="button"
            onClick={() => setFilterTab('ACKNOWLEDGED')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              filterTab === 'ACKNOWLEDGED'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <p className="text-[11px] font-medium text-slate-400">Đã Xác Nhận Đọc</p>
            <p className="text-base font-extrabold text-emerald-400">
              {acknowledgedCount} <span className="text-xs font-normal text-slate-400">/ {ackList.length}</span>
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('PENDING')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              filterTab === 'PENDING'
                ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <p className="text-[11px] font-medium text-slate-400">Chưa Xem / Chưa Xác Nhận</p>
            <p className="text-base font-extrabold text-rose-400">
              {pendingCount} <span className="text-xs font-normal text-slate-400">học sinh</span>
            </p>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên học sinh trong lớp..."
            className="w-full bg-[#0B0E14] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]"
          />
        </div>

        {/* Student List Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
          {filteredStudents.map((st) => (
            <div
              key={st.studentId}
              className="flex items-center justify-between p-2 rounded-xl bg-[#0B0E14]/60 border border-white/5 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={st.avatar}
                  alt={st.studentName}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                />
                <div>
                  <p className="font-semibold text-white">{st.studentName}</p>
                  <p className="text-[10px] text-slate-400">Mã HS: {st.studentId}</p>
                </div>
              </div>

              <div>
                {st.acknowledged ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    {st.acknowledgedAt || 'Đã đọc'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    <Clock className="w-3 h-3" />
                    Chưa đọc
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredStudents.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-6">
              Không tìm thấy học sinh phù hợp với bộ lọc.
            </p>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs">
          <span className="text-slate-400 text-[11px]">
            Hiển thị {filteredStudents.length} / {ackList.length} học sinh
          </span>

          <button
            type="button"
            onClick={handleRemindClick}
            disabled={pendingCount === 0 || remindedSent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold hover:bg-amber-500/30 transition-all disabled:opacity-40"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>{remindedSent ? 'Đã Gửi Nhắc Nhở!' : `Gửi Nhắc Nhở (${pendingCount})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
