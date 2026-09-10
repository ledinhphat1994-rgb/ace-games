'use client';

import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, Sparkles, Volume2 } from 'lucide-react';
import { Announcement } from './types';

interface EmergencyAlertOverlayProps {
  announcement: Announcement | null;
  onAcknowledgeAndDismiss: (announcementId: string) => void;
}

export default function EmergencyAlertOverlay({
  announcement,
  onAcknowledgeAndDismiss,
}: EmergencyAlertOverlayProps) {
  const [countdown, setCountdown] = useState(3);
  const [canDismiss, setCanDismiss] = useState(false);

  React.useEffect(() => {
    if (!announcement || announcement.priority !== 'EMERGENCY') return;

    setCountdown(3);
    setCanDismiss(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanDismiss(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [announcement]);

  if (!announcement || announcement.priority !== 'EMERGENCY') return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="relative max-w-lg w-full bg-[#141923] border-2 border-rose-500 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(244,63,94,0.4)] overflow-hidden">
        {/* Ambient background pulsing red glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-rose-500/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        {/* Warning Icon Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-bounce">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-rose-400 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30">
              THÔNG BÁO KHẨN CẤP · BÁO ĐỘNG ĐỎ
            </span>
            <h2 className="text-lg font-black text-white mt-1 leading-snug">
              {announcement.title}
            </h2>
          </div>
        </div>

        {/* Author Meta */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-4 pb-3 border-b border-white/10">
          <span className="font-bold text-white">{announcement.author.name}</span>
          <span>•</span>
          <span className="text-amber-400 font-semibold">{announcement.author.role}</span>
          <span>•</span>
          <span>{announcement.relativeTime}</span>
        </div>

        {/* Long content text */}
        <div className="bg-[#0B0E14] border border-rose-500/30 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed max-h-60 overflow-y-auto mb-6 whitespace-pre-line shadow-inner">
          {announcement.content}
        </div>

        {/* Mandatory Student Acknowledge Button */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={!canDismiss}
            onClick={() => onAcknowledgeAndDismiss(announcement.id)}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-2xl ${
              canDismiss
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.5)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {canDismiss
                ? 'TÔI ĐÃ ĐỌC VÀ HIỂU THÔNG BÁO NÀY'
                : `Vui lòng đọc kỹ thông báo (${countdown}s)...`}
            </span>
          </button>
          <p className="text-center text-[11px] text-slate-400">
            Học sinh cần xác nhận đã nhận thông báo trước khi tiếp tục các hoạt động tại Campus.
          </p>
        </div>
      </div>
    </div>
  );
}
