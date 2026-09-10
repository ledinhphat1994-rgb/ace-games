'use client';

import React, { useState } from 'react';
import {
  Megaphone,
  CheckCircle2,
  Check,
  Eye,
  Paperclip,
  ChevronRight,
  Sparkles,
  Plus,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Announcement } from './types';

interface ClassAnnouncementBannerProps {
  announcement: Announcement;
  currentUserId: string;
  isTeacherMode: boolean;
  onToggleAcknowledge: (announcementId: string) => void;
  onReactionClick: (announcementId: string, emojiKey: string) => void;
  onOpenDetailModal: (announcement: Announcement) => void;
  onOpenInspectModal: (announcement: Announcement) => void;
  onOpenCreateModal: () => void;
}

export default function ClassAnnouncementBanner({
  announcement,
  currentUserId,
  isTeacherMode,
  onToggleAcknowledge,
  onReactionClick,
  onOpenDetailModal,
  onOpenInspectModal,
  onOpenCreateModal,
}: ClassAnnouncementBannerProps) {
  const [bouncingEmoji, setBouncingEmoji] = useState<string | null>(null);

  const ackCount = announcement.acknowledgments.filter((a) => a.acknowledged).length;
  const totalStudents = announcement.totalStudents;
  const userHasAcknowledged = announcement.acknowledgments.some(
    (a) => a.studentId === currentUserId && a.acknowledged
  );

  const handleReaction = (key: string) => {
    setBouncingEmoji(key);
    setTimeout(() => setBouncingEmoji(null), 600);
    onReactionClick(announcement.id, key);
  };

  const isEmergency = announcement.priority === 'EMERGENCY';

  return (
    <section
      aria-label="Thông báo phát sóng toàn lớp"
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-xl ${
        isEmergency
          ? 'bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-transparent border border-rose-500/40 shadow-[0_0_24px_rgba(244,63,94,0.15)]'
          : 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/35 backdrop-blur-md shadow-[0_0_24px_rgba(245,158,11,0.12)]'
      }`}
    >
      {/* Background ambient decorative glow */}
      <div
        className={`absolute -right-12 -top-12 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-25 ${
          isEmergency ? 'bg-rose-500' : 'bg-amber-400'
        }`}
      ></div>

      <div className="relative z-10 flex flex-col gap-3">
        {/* Top meta row: Badge, Author, Time, and Teacher Create Action */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            {/* Animated Pulsing Megaphone Badge */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-md ${
                isEmergency
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isEmergency ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
              ) : (
                <Megaphone className="w-4 h-4 text-amber-400" />
              )}
            </div>

            {/* Teacher Verified Info */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="font-extrabold text-white flex items-center gap-1">
                {announcement.author.name}
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00F2FE] fill-[#00F2FE]/20" />
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isEmergency
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                }`}
              >
                {isEmergency ? 'BÁO ĐỘNG ĐỎ' : announcement.author.role}
              </span>
              <span className="text-slate-400 text-[11px] flex items-center gap-1 ml-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {announcement.relativeTime}
              </span>
            </div>
          </div>

          {/* Teacher Broadcast Studio Action Trigger */}
          {isTeacherMode && (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs shadow-[0_0_12px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all ml-auto"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Tạo Thông Báo Mới</span>
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div
          onClick={() => onOpenDetailModal(announcement)}
          className="cursor-pointer group"
        >
          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug mb-1">
            {announcement.title}
          </h3>
          <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed line-clamp-2 sm:line-clamp-3">
            {announcement.content}
          </p>

          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-[#00F2FE] font-medium">
              <Paperclip className="w-3.5 h-3.5" />
              <span>
                Đính kèm: {announcement.attachments[0].name} ({announcement.attachments[0].size})
              </span>
              <span className="text-[10px] text-slate-400">• Bấm để xem chi tiết</span>
            </div>
          )}
        </div>

        {/* Micro-Actions Bottom Bar: Acknowledge Tracker & Reactions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/10 text-xs">
          {/* Reaction Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {Object.entries(announcement.reactions).map(([key, item]) => {
              const isBouncing = bouncingEmoji === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleReaction(key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all select-none ${
                    item.userReacted
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                  } ${isBouncing ? 'scale-125 transition-transform duration-200' : ''}`}
                >
                  <span className="text-sm">{item.emoji}</span>
                  <span className="font-mono text-[11px]">{item.count}</span>
                </button>
              );
            })}
          </div>

          {/* Acknowledge Button & Inspection */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Student 1-click Acknowledge Toggle */}
            <button
              type="button"
              onClick={() => onToggleAcknowledge(announcement.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                userHasAcknowledged
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:scale-105'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>
                {userHasAcknowledged
                  ? `Đã nhận (${ackCount}/${totalStudents})`
                  : `Xác nhận đã nhận (${ackCount}/${totalStudents})`}
              </span>
            </button>

            {/* Teacher Inspect Button */}
            {isTeacherMode && (
              <button
                type="button"
                onClick={() => onOpenInspectModal(announcement)}
                title="Xem danh sách học sinh đã xem và chưa xem thông báo"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-[#00F2FE]" />
                <span className="hidden sm:inline">Soi danh sách</span>
              </button>
            )}

            {/* Detail Modal Trigger Chevron */}
            <button
              type="button"
              onClick={() => onOpenDetailModal(announcement)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Xem toàn văn thông báo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
