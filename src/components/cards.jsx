import { PHONG_LOAI_UI, trangThaiPhong } from '../lib/helpers.js';
import { Ic } from '../lib/icons.js';


// Thẻ hoạt động — variant 'compact' (Hot Now strip) và 'standard' (lưới chính).
export function TheHoatDong({ p, onVao, compact = false }) {
  const ui = PHONG_LOAI_UI[p.loai] || PHONG_LOAI_UI.chat;
  const tt = trangThaiPhong(p);
  return (
    <div className={`bg-[#151A23] border border-white/10 rounded-2xl shadow-xl flex flex-col gap-3 hover:border-white/25 transition-all ${compact ? 'p-3.5 min-w-[240px] w-[240px] shrink-0' : 'p-4'}`}>
      <div className="flex items-start gap-3">
        <div className={`${compact ? 'w-9 h-9' : 'w-10 h-10'} rounded-xl flex items-center justify-center shrink-0 border`}
          style={{ backgroundColor: `${ui.mau}15`, borderColor: `${ui.mau}40` }}>
          <Ic name={ui.icon} className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-white truncate">{p.ten}</h4>
            <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-black border flex items-center gap-1 ${tt.lopMau}`}>
              <span className={`w-1 h-1 rounded-full ${tt.cham}`}></span>{tt.nhan}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate mt-0.5">
            {ui.nhan}{p.chuPhongTen ? ` • ${p.chuPhongTen}` : ''}{p.lopTen ? ` • ${p.lopTen}` : ''} • {p.phamVi === 'lop' ? '🔒 Chỉ lớp' : '🌐 Toàn trường'}
          </p>
        </div>
      </div>
      {p.moTa && !compact && <p className="text-[11px] text-slate-400 line-clamp-2">{p.moTa}</p>}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
        <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${p.soNguoi > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
          <span className={`w-2 h-2 rounded-full ${p.soNguoi > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
          <span>{p.soNguoi || 0} đang trong phòng</span>
        </span>
        <button onClick={onVao}
          className="px-4 py-1.5 rounded-full bg-[#00F2FE] text-black font-bold text-xs hover:bg-[#00e1ec] transition-all">
          Vào phòng
        </button>
      </div>
    </div>
  );
}

// ─── CAMPUS PRESENTATION COMPONENTS (PHASE 3A) ──────────────────────────────
export function CampusSectionHeader({ title, subtitle, icon, badge, extra }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-base sm:text-lg shrink-0 shadow-sm">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg lg:text-xl font-black text-white tracking-tight truncate">{title}</h3>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-[#00F2FE]">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-0.5 line-clamp-1">{subtitle}</p>}
        </div>
      </div>
      {extra && <div className="shrink-0">{extra}</div>}
    </div>
  );
}

export function CampusSpaceCard({
  id,
  theme = 'youtube',
  title,
  metric,
  onAction,
  sceneType = 'cinema'
}) {
  const portalId = id || ((sceneType === 'arena' || sceneType === 'game') ? 'campus-space-game' : (sceneType === 'cinema' ? 'campus-space-cinema' : (sceneType === 'music' ? 'campus-space-music' : 'campus-space-chat')));
  const dataId = (sceneType === 'arena' || sceneType === 'game') ? 'space-game' : (sceneType === 'cinema' ? 'space-cinema' : (sceneType === 'music' ? 'space-music' : 'space-chat'));

  const portalStyles = {
    youtube: {
      bg: 'radial-gradient(circle at 50% 35%, rgba(239, 68, 68, 0.22) 0%, rgba(24, 7, 7, 0.96) 60%, #110606 100%)',
      glow: 'rgba(239, 68, 68, 0.4)',
      primary: '#EF4444',
      accent: 'text-[#EF4444]',
      orbBg: 'radial-gradient(circle, rgba(239, 68, 68, 0.32) 0%, rgba(45, 10, 10, 0.9) 70%, rgba(0, 0, 0, 0.95) 100%)',
      ringColor: '#EF4444',
      floatClass: 'portal-float-youtube'
    },
    cyan: {
      bg: 'radial-gradient(circle at 50% 35%, rgba(239, 68, 68, 0.22) 0%, rgba(24, 7, 7, 0.96) 60%, #110606 100%)',
      glow: 'rgba(239, 68, 68, 0.4)',
      primary: '#EF4444',
      accent: 'text-[#EF4444]',
      orbBg: 'radial-gradient(circle, rgba(239, 68, 68, 0.32) 0%, rgba(45, 10, 10, 0.9) 70%, rgba(0, 0, 0, 0.95) 100%)',
      ringColor: '#EF4444',
      floatClass: 'portal-float-youtube'
    },
    game: {
      bg: 'radial-gradient(circle at 50% 35%, rgba(255, 184, 0, 0.18) 0%, rgba(28, 18, 4, 0.96) 60%, #15120a 100%)',
      glow: 'rgba(255, 184, 0, 0.35)',
      primary: '#FFB800',
      accent: 'text-[#FFB800]',
      orbBg: 'radial-gradient(circle, rgba(255, 184, 0, 0.25) 0%, rgba(42, 26, 6, 0.85) 70%, rgba(0, 0, 0, 0.95) 100%)',
      ringColor: '#FFB800',
      floatClass: 'portal-float-game'
    },
    amber: {
      bg: 'radial-gradient(circle at 50% 35%, rgba(255, 184, 0, 0.18) 0%, rgba(28, 18, 4, 0.96) 60%, #15120a 100%)',
      glow: 'rgba(255, 184, 0, 0.35)',
      primary: '#FFB800',
      accent: 'text-[#FFB800]',
      orbBg: 'radial-gradient(circle, rgba(255, 184, 0, 0.25) 0%, rgba(42, 26, 6, 0.85) 70%, rgba(0, 0, 0, 0.95) 100%)',
      ringColor: '#FFB800',
      floatClass: 'portal-float-game'
    },
    music: {
      bg: 'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.18) 0%, rgba(22, 10, 43, 0.96) 60%, #120924 100%)',
      glow: 'rgba(139, 92, 246, 0.35)',
      primary: '#8B5CF6',
      accent: 'text-[#8B5CF6]',
      orbBg: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(32, 13, 61, 0.85) 70%, rgba(0, 0, 0, 0.95) 100%)',
      ringColor: '#8B5CF6',
      floatClass: 'portal-float-music'
    },
    violet: {
      bg: 'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.18) 0%, rgba(22, 10, 43, 0.96) 60%, #120924 100%)',
      glow: 'rgba(139, 92, 246, 0.35)',
      primary: '#8B5CF6',
      accent: 'text-[#8B5CF6]',
      orbBg: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(32, 13, 61, 0.85) 70%, rgba(0, 0, 0, 0.95) 100%)',
      ringColor: '#8B5CF6',
      floatClass: 'portal-float-music'
    }
  };

  const st = portalStyles[theme] || portalStyles.youtube;

  return (
    <button
      id={portalId}
      data-id={dataId}
      type="button"
      onClick={onAction}
      aria-label={metric ? `${title}, ${metric}` : title}
      className="group relative w-full rounded-[32px] overflow-hidden flex flex-col items-center justify-between p-6 sm:p-7 min-h-[390px] sm:min-h-[430px] transition-all duration-300 hover:scale-[1.02] cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#00F2FE]/50 shadow-[0_12px_36px_rgba(0,0,0,0.5)]"
      style={{
        background: st.bg,
        boxShadow: `0 16px 48px -12px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.12), 0 0 28px -8px ${st.glow}`
      }}
    >
      {/* Ambient background glow pulse */}
      <div
        className="absolute top-1/4 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 opacity-60 group-hover:opacity-90 portal-pulse-glow"
        style={{ background: st.glow, color: st.primary }}
        aria-hidden="true"
      />

      {/* Top Visual: Large Floating Orbital Scene (Stable Click Target, Moving Visual Inside) */}
      <div className="relative w-full flex-1 flex flex-col items-center justify-center pointer-events-none" aria-hidden="true">
        {sceneType === 'cinema' && (
          <div className={`relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center ${st.floatClass}`}>
            {/* Circular ripple scan */}
            <div className="absolute inset-0 rounded-full border border-red-500/30 portal-scan-ripple" />
            <div className="absolute inset-4 rounded-full border border-red-500/20 portal-scan-ripple" style={{ animationDelay: '1.5s' }} />

            {/* Orbiting dashed playback ring */}
            <svg className="absolute inset-2 w-40 h-40 sm:w-44 sm:h-44 portal-orbit-slow" viewBox="0 0 180 180" fill="none">
              <circle cx="90" cy="90" r="82" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.45" strokeDasharray="6 8" />
              <circle cx="90" cy="8" r="5.5" fill="#EF4444" className="drop-shadow-[0_0_10px_#EF4444]" />
            </svg>

            {/* Light Cone behind orb */}
            <svg className="absolute top-0 w-36 h-28 cinema-ray pointer-events-none" viewBox="0 0 180 120" fill="none">
              <defs>
                <linearGradient id="ytLightBeam" x1="90" y1="0" x2="90" y2="120" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#EF4444" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#EF4444" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points="90,10 20,110 160,110" fill="url(#ytLightBeam)" />
            </svg>

            {/* Central YouTube Orb */}
            <div
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_12px_rgba(255,255,255,0.2)] transition-transform duration-500 group-hover:scale-105"
              style={{ background: st.orbBg, border: '1.5px solid rgba(239, 68, 68, 0.55)' }}
            >
              <div className="w-10 h-10 rounded-full bg-red-500/25 border border-red-400/50 flex items-center justify-center pl-0.5 text-red-300 text-lg shadow-[0_0_18px_rgba(239,68,68,0.7)]">
                ▶
              </div>
              <span className="mt-1.5 text-xs font-black tracking-widest text-white uppercase group-hover:text-red-300 transition-colors">
                YouTube
              </span>
            </div>
          </div>
        )}

        {sceneType === 'game' && (
          <div className={`relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center ${st.floatClass}`}>
            {/* Outer rotating dashed ring */}
            <svg className="absolute inset-2 w-40 h-40 sm:w-44 sm:h-44 portal-orbit-rev" viewBox="0 0 180 180" fill="none">
              <circle cx="90" cy="90" r="82" stroke="#FFB800" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="8 6" />
              <circle cx="90" cy="8" r="5" fill="#FFB800" className="drop-shadow-[0_0_8px_#FFB800]" />
            </svg>

            {/* Orbiting X & O pieces */}
            <svg className="absolute inset-0 w-full h-full portal-orbit-slow" viewBox="0 0 180 180" fill="none">
              <g transform="translate(90, 90)">
                <g transform="translate(58, -48)">
                  <line x1="-7" y1="-7" x2="7" y2="7" stroke="#00F2FE" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="7" y1="-7" x2="-7" y2="7" stroke="#00F2FE" strokeWidth="2.5" strokeLinecap="round" />
                </g>
                <circle cx="-58" cy="48" r="7" stroke="#FFB800" strokeWidth="2.5" fill="none" />
              </g>
            </svg>

            {/* Central Arena Orb */}
            <div
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_12px_rgba(255,255,255,0.2)] transition-transform duration-500 group-hover:scale-105"
              style={{ background: st.orbBg, border: '1.5px solid rgba(255, 184, 0, 0.45)' }}
            >
              <div className="flex items-center gap-1">
                <span className="text-xl font-black text-amber-400 drop-shadow-[0_0_12px_rgba(255,184,0,0.8)] tracking-widest">
                  GAME
                </span>
              </div>
              <span className="mt-1 text-[11px] font-extrabold tracking-wider text-slate-300 uppercase group-hover:text-amber-300 transition-colors">
                Đấu trường
              </span>
            </div>
          </div>
        )}

        {sceneType === 'music' && (
          <div className={`relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center ${st.floatClass}`}>
            {/* Rotating dashed ring */}
            <svg className="absolute inset-2 w-40 h-40 sm:w-44 sm:h-44 portal-orbit-slow" viewBox="0 0 180 180" fill="none">
              <circle cx="90" cy="90" r="82" stroke="#8B5CF6" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="5 7" />
              <circle cx="90" cy="8" r="5" fill="#8B5CF6" className="drop-shadow-[0_0_8px_#8B5CF6]" />
            </svg>

            {/* Radial audio pulse */}
            <div className="absolute inset-6 rounded-full border border-purple-400/30 portal-pulse-glow" style={{ color: '#8B5CF6' }} />

            {/* Equalizer bars below core */}
            <div className="absolute bottom-3 flex items-end justify-center gap-1.5 h-8">
              <div className="w-1 bg-purple-400 rounded-full eq-bar" style={{ height: '14px' }} />
              <div className="w-1 bg-purple-400 rounded-full eq-bar" style={{ height: '26px', animationDelay: '0.2s' }} />
              <div className="w-1 bg-purple-300 rounded-full eq-bar" style={{ height: '32px', animationDelay: '0.4s' }} />
              <div className="w-1 bg-purple-400 rounded-full eq-bar" style={{ height: '22px', animationDelay: '0.1s' }} />
              <div className="w-1 bg-purple-400 rounded-full eq-bar" style={{ height: '12px', animationDelay: '0.35s' }} />
            </div>

            {/* Central Disc / Core */}
            <div
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_12px_rgba(255,255,255,0.2)] transition-transform duration-500 group-hover:scale-105"
              style={{ background: st.orbBg, border: '1.5px solid rgba(139, 92, 246, 0.45)' }}
            >
              <span className="text-xl font-black text-purple-300 drop-shadow-[0_0_12px_rgba(139,92,246,0.8)] tracking-widest">
                MUSIC
              </span>
              <span className="mt-1 text-[11px] font-extrabold tracking-wider text-slate-300 uppercase group-hover:text-purple-300 transition-colors">
                Tập trung & Lofi
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Minimal live state footer */}
      <div className="w-full flex items-center justify-center min-h-[28px] pt-3 pointer-events-none">
        {metric ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-xs font-extrabold text-emerald-400 backdrop-blur-sm shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{metric}</span>
          </span>
        ) : (
          <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors flex items-center gap-1">
            <span>Khám phá ngay</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        )}
      </div>
    </button>
  );
}

export function CampusHeroStage({
  badge,
  tieuDe = 'Digital Campus',
  subTieuDe = 'GDTX Định Quán',
  dangHoatDong,
  phongMoCount,
  ctaChinh,
  ctaPhu,
  theme = 'welcome'
}) {
  const bgGradients = {
    game: 'linear-gradient(120deg, #140d02 0%, #291803 40%, #151A23 100%)',
    cinema: 'linear-gradient(120deg, #051424 0%, #0c203b 40%, #151A23 100%)',
    music: 'linear-gradient(120deg, #130726 0%, #200d3d 40%, #151A23 100%)',
    event: 'linear-gradient(120deg, #1c0824 0%, #2d0e3a 40%, #151A23 100%)',
    welcome: 'linear-gradient(120deg, #09101d 0%, #0e1a30 45%, #181230 100%)',
  };

  const borderColors = {
    game: 'border-[#FFB800]/30',
    cinema: 'border-[#00F2FE]/30',
    music: 'border-[#8B5CF6]/30',
    event: 'border-purple-500/35',
    welcome: 'border-[#00F2FE]/25',
  };

  return (
    <div id="campus-hero-stage" className={`relative rounded-3xl overflow-hidden border ${borderColors[theme] || borderColors.welcome} shadow-2xl transition-all duration-500`}
      style={{ background: bgGradients[theme] || bgGradients.welcome, minHeight: '140px' }}>
      <div className="absolute -top-24 -right-16 w-80 h-80 bg-[#00F2FE]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 p-5 sm:p-6 lg:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {badge && (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider mb-2 shadow-sm ${badge.lop}`}>
              {badge.cham && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>}
              <span>{badge.txt}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
              <span>{tieuDe}</span>
              {subTieuDe && <span className="text-slate-400 font-bold ml-1.5"> · {subTieuDe}</span>}
            </h2>
            {dangHoatDong > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{dangHoatDong} đang hoạt động</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {ctaChinh && (
            <button onClick={ctaChinh.fn}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-extrabold text-xs sm:text-sm shadow-[0_0_20px_rgba(0,242,254,0.35)] hover:opacity-95 active:scale-95 transition-all whitespace-nowrap">
              {ctaChinh.txt}
            </button>
          )}
          {ctaPhu && (
            <button onClick={ctaPhu.fn}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/15 transition-all whitespace-nowrap truncate max-w-[200px]">
              {ctaPhu.txt}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CampusPulseStatus({ dangHoatDong, phongMoCount, skHomNayCount, onMoPhong, onVaoCaro, onMoNhac }) {
  if (dangHoatDong === 0 && phongMoCount === 0) {
    return (
      <div id="campus-pulse-status" className="bg-gradient-to-r from-[#121927] to-[#16122a] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
            🌱
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white">Campus đang yên tĩnh</h4>
            <p className="text-xs text-slate-400 mt-0.5">Các phòng sinh hoạt số luôn sẵn sàng — mở hoạt động đầu tiên hôm nay cùng bạn bè!</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button onClick={onMoPhong} className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-slate-200 transition-all">
            🎬 Mở phòng xem
          </button>
          <button onClick={onVaoCaro} className="px-3.5 py-1.5 rounded-xl bg-[#FFB800]/10 hover:bg-[#FFB800]/20 border border-[#FFB800]/30 text-xs font-bold text-[#FFB800] transition-all">
            ⚔️ Đấu Caro
          </button>
          <button onClick={onMoNhac} className="px-3.5 py-1.5 rounded-xl bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-xs font-bold text-[#8B5CF6] transition-all">
            🎧 Nghe nhạc
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="campus-pulse-status" className="bg-[#121824] border border-white/10 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-2 font-bold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{dangHoatDong} bạn đang tham gia</span>
        </span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-300 font-semibold">
          <strong className="text-white font-black">{phongMoCount}</strong> không gian hoạt động
        </span>
        {skHomNayCount > 0 && (
          <>
            <span className="text-slate-500">|</span>
            <span className="text-amber-400 font-semibold">
              📅 <strong className="font-black">{skHomNayCount}</strong> sự kiện hôm nay
            </span>
          </>
        )}
      </div>
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        Digital Commons
      </span>
    </div>
  );
}

// ─── CAMPUS HIGHLIGHTS COMPONENT (PHASE 4G COMPACT SIDE RAIL) ─────────────────────────
export function CampusHighlights({ highlights = [], onVaoGame, onVaoPhong, onVaoSuKien }) {
  const rows = highlights.slice(0, 4);

  return (
    <div
      id="campus-highlights"
      className="bg-[#121722]/90 backdrop-blur-xl border border-white/10 hover:border-cyan-400/30 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between transition-all min-h-[460px] sm:min-h-[500px]"
    >
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h3 className="text-xs font-black text-white tracking-widest uppercase">Tiêu điểm Campus</h3>
          </div>
          {rows.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>TRỰC TIẾP</span>
            </span>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="py-16 px-3 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <p className="text-2xl">🌱</p>
            <p className="text-xs font-bold text-slate-300">Campus đang yên tĩnh</p>
            <p className="text-[11px] text-slate-500">Hoạt động nổi bật sẽ xuất hiện tại đây khi bắt đầu</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((h, idx) => (
              <div
                key={h.id || idx}
                onClick={() => {
                  if (h.loai === 'game' && onVaoGame) onVaoGame();
                  else if (h.phongId && onVaoPhong) onVaoPhong(h.phongId);
                  else if (h.loai === 'event' && onVaoSuKien) onVaoSuKien();
                }}
                className="group p-2.5 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-400/30 transition-all cursor-pointer flex items-center gap-3 shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400/15 to-purple-400/15 border border-white/10 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 group-hover:border-cyan-400/40 transition-transform">
                  {h.icon || h.bieuTuong || '⭐'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 font-mono">
                      {h.category || h.badge || 'NỔI BẬT'}
                    </span>
                    {h.metric && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold ml-auto shrink-0">
                        {h.metric}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {h.title || h.tieuDe}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {h.sub || h.chiTiet}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 mt-3">
        <span>GDTX Định Quán</span>
        <span className="text-cyan-400 font-mono">2026–2027</span>
      </div>
    </div>
  );
}
