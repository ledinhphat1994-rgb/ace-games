'use client';

import React, { useState } from 'react';
import { X, Megaphone, AlertTriangle, Clock, Paperclip, Send } from 'lucide-react';
import { Announcement, AnnouncementPriority } from './types';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAnnouncement: (newAnnouncement: Partial<Announcement>) => void;
}

export default function CreateAnnouncementModal({
  isOpen,
  onClose,
  onCreateAnnouncement,
}: CreateAnnouncementModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('NORMAL');
  const [expiresIn, setExpiresIn] = useState('2h');
  const [attachmentTitle, setAttachmentTitle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onCreateAnnouncement({
      title,
      content,
      priority,
      expiresAt: expiresIn,
      attachments: attachmentTitle.trim()
        ? [
            {
              name: attachmentTitle.trim(),
              size: '1.8 MB',
              url: '#',
              type: 'pdf',
            },
          ]
        : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#151A23] border border-amber-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Studio Phát Sóng Thông Báo Lớp 10A7</h3>
              <p className="text-[11px] text-slate-400">Dành riêng cho Giáo viên Chủ nhiệm & Cán bộ lớp</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* Priority Selection */}
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">Mức Độ Ưu Tiên Phát Sóng</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPriority('NORMAL')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border font-bold transition-all text-left ${
                  priority === 'NORMAL'
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="leading-tight">TIÊU CHUẨN</p>
                  <p className="text-[10px] font-normal text-slate-400">Ghim banner & khung chat</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPriority('EMERGENCY')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border font-bold transition-all text-left ${
                  priority === 'EMERGENCY'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/60 shadow-[0_0_16px_rgba(244,63,94,0.3)] animate-pulse'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <p className="leading-tight">BÁO ĐỘNG ĐỎ</p>
                  <p className="text-[10px] font-normal text-slate-400">Khóa màn hình bắt buộc đọc</p>
                </div>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">Tiêu Đề Thông Báo</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Lịch thi giữa kỳ I / Thay đổi thời khóa biểu ngày mai..."
              className="w-full bg-[#0B0E14] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">Nội Dung Chi Tiết</label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung thông báo đầy đủ để học sinh nắm rõ..."
              className="w-full bg-[#0B0E14] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
            />
          </div>

          {/* Attachment Title & Expiration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Tệp Đính Kèm (Nếu có)</label>
              <div className="relative">
                <Paperclip className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={attachmentTitle}
                  onChange={(e) => setAttachmentTitle(e.target.value)}
                  placeholder="De_cuong_on_tap.pdf"
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Thời Gian Hết Hạn</label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full bg-[#0B0E14] border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="2h">Sau 2 giờ</option>
                <option value="end_of_day">Cuối ngày hôm nay (23:59)</option>
                <option value="3_days">Sau 3 ngày</option>
                <option value="never">Ghim cố định (Không tự hủy)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Phát Sóng Ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
