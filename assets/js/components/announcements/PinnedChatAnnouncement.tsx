'use client';

import React, { useState } from 'react';
import { Pin, ChevronDown, ChevronUp, Megaphone, CheckCircle2 } from 'lucide-react';
import { Announcement } from './types';

interface PinnedChatAnnouncementProps {
  announcement: Announcement;
  onOpenDetailModal: (announcement: Announcement) => void;
}

export default function PinnedChatAnnouncement({
  announcement,
  onOpenDetailModal,
}: PinnedChatAnnouncementProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-[#151A23]/95 border border-amber-500/30 rounded-xl p-2.5 mb-2 shadow-lg backdrop-blur-md transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold truncate">
          <Pin className="w-3.5 h-3.5 fill-amber-400 shrink-0" />
          <span className="truncate">Ghim: {announcement.title}</span>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          title={collapsed ? 'Mở rộng ghim' : 'Thu nhỏ ghim'}
        >
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-1.5 pt-1.5 border-t border-white/5 text-[11px]">
          <p className="text-slate-300 line-clamp-2 leading-relaxed mb-1.5">
            {announcement.content}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>{announcement.relativeTime}</span>
            <button
              type="button"
              onClick={() => onOpenDetailModal(announcement)}
              className="text-[#00F2FE] hover:underline font-semibold"
            >
              Xem toàn văn ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
