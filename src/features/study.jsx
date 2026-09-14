const { useState, useEffect, useRef } = React;
import { dinhDangGiayPhut, idGoogleDrive, idYoutube, laVideoTrucTiepFe, napYouTubeIframeApi, urlMediaFe } from '../lib/helpers.js';

// Bỏ qua tick khi tab đang ở NỀN — tránh cộng dồn request Cloudflare vô ích khi không ai xem.
// Không dùng cho poll tín hiệu thời gian thực (vd voice signaling) vì bỏ lỡ tick có thể làm treo
// bắt tay kết nối hoặc trễ tín hiệu "rời voice" của người kia.
const khiHienThi = (fn) => () => { if (document.visibilityState === 'visible') fn(); };


// Ô nhập link thêm vào hàng đợi — dùng chung cho StudyDock và CampusWatchTogether
export function QueueInput({ onAdd, onAddNext }) {
  const [v, setV] = React.useState('');
  const ok = v.trim().length > 0;
  return (
    <div className="flex items-center gap-1.5">
      <input
        id="input-queue-add"
        type="url"
        value={v}
        onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && ok) { e.preventDefault(); onAdd(v.trim()); setV(''); } }}
        placeholder="Thêm link video vào hàng đợi…"
        className="flex-1 bg-[#0B0E14] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/50"
      />
      <button type="button" id="btn-queue-add-next" disabled={!ok}
        onClick={() => { onAddNext(v.trim()); setV(''); }}
        className="px-2.5 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/30 text-[10px] font-bold hover:bg-violet-500/25 disabled:opacity-30 whitespace-nowrap">
        +Phát kế
      </button>
      <button type="button" id="btn-queue-enqueue" disabled={!ok}
        onClick={() => { onAdd(v.trim()); setV(''); }}
        className="px-2.5 py-1.5 rounded-lg bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 text-[10px] font-bold hover:bg-[#00F2FE]/25 disabled:opacity-30 whitespace-nowrap">
        +Cuối hàng
      </button>
    </div>
  );
}

// ─── STUDY DOCK: KHÔNG GIAN CỘNG TÁC PHÒNG YOUTUBE (PHASE 4F) ────────────────
export function StudyDock({ phong, phongMinhKhoa: _phongMinhKhoa, auth, phongChat = [], onSendPhongChat, onXoaTinPhong,
  myCaps = {}, isStaff = false, vaiTroPhong = 'member', thanhVien = [],
  policies = null, grants = [], videoTimeRef, seekVideo, hanhDongPhong,
  canControl: _canControl = false, dongPhongHienTai: _dongPhongHienTai }) {
  const [dockTab, setDockTab] = React.useState('chat'); // 'chat' | 'notes' | 'whiteboard' | 'sheet' | 'voice' | 'quan-tri'
  const [showEmoji, setShowEmoji] = React.useState(false);

  // Capability phía client chỉ để ẩn/hiện UI — mọi quyền thật do server quyết.
  const coQuyen = (cap) => myCaps[cap] !== false;
  const layViTriVideo = () => Math.floor(videoTimeRef?.current || 0) || null;
  // Bấm mốc thời gian → gửi event cho CampusWatchTogether xử lý
  // (có video_control → tua chung cả phòng; không → tua cục bộ player của mình).
  const yeuCauTua = (sec) => {
    if (sec == null || !(sec >= 0)) return;
    if (seekVideo) { seekVideo(sec, myCaps.video_control === true); return; }
    window.dispatchEvent(new CustomEvent('sr-seek', { detail: { phongId: phong.id, sec } }));
  };

  // 1. Room Chat State
  const [chatInput, setChatInput] = React.useState('');
  const [chatSending, setChatSending] = React.useState(false);
  const chatComposingRef = React.useRef(false);
  const chatEndRef = React.useRef(null);

  React.useEffect(() => {
    if (dockTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [phongChat.length, dockTab]);

  const handleSendRoomChat = (e) => {
    e?.preventDefault();
    const txt = chatInput.trim();
    if (!txt || chatSending) return;
    setChatInput('');
    setChatSending(true);
    if (onSendPhongChat) {
      Promise.resolve(onSendPhongChat(txt)).catch(() => {
        setChatInput(cur => cur ? cur : txt);
      }).finally(() => {
        setChatSending(false);
      });
    } else {
      setChatSending(false);
    }
  };

  // 2. Shared Notes — entry append (mỗi người thêm ghi chú riêng, không ghi đè nhau)
  const [notesList, setNotesList] = React.useState([]);
  const [noteInput, setNoteInput] = React.useState('');
  const [noteWithTime, setNoteWithTime] = React.useState(true);
  const [notesCanWrite, setNotesCanWrite] = React.useState(true);
  const [notesNotice, setNotesNotice] = React.useState('');
  const notesVersionRef = React.useRef(0);
  const noteComposingRef = React.useRef(false);

  React.useEffect(() => {
    if (dockTab !== 'notes') return;
    let active = true;
    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/phong-collab?phongId=${phong.id}&resource=notes`);
        const d = await res.json();
        if (active && d.ok) {
          setNotesList(Array.isArray(d.payload?.notes) ? d.payload.notes : []);
          notesVersionRef.current = d.version || 0;
          setNotesCanWrite(d.canWrite !== false);
        } else if (active && d.code === 'capability_off') {
          setNotesCanWrite(false);
        }
      } catch {}
    };
    fetchNotes();
    const interval = setInterval(khiHienThi(fetchNotes), 3000);
    return () => { active = false; clearInterval(interval); };
  }, [phong.id, dockTab]);

  const themGhiChu = async () => {
    const text = noteInput.trim();
    if (!text) return;
    setNotesNotice('');
    try {
      const res = await fetch('/api/phong-collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phongId: phong.id,
          resource: 'notes',
          payload: { text, videoTimeSec: noteWithTime ? layViTriVideo() : null }
        })
      });
      const d = await res.json();
      if (d.ok) {
        setNoteInput('');
        setNotesList(prev => [...prev, { id: d.id, ten: auth.user?.ten || 'Bạn', noiDung: text, videoTimeSec: noteWithTime ? layViTriVideo() : null, cuaToi: 1 }]);
      } else {
        setNotesNotice(d.loi || 'Không lưu được ghi chú.');
      }
    } catch { setNotesNotice('Lỗi kết nối.'); }
  };

  const xoaGhiChu = async (id) => {
    try {
      const res = await fetch('/api/phong-collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phongId: phong.id, resource: 'notes', action: 'xoa_note', id })
      });
      const d = await res.json();
      if (d.ok) setNotesList(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  // 3. Shared Whiteboard State
  const canvasRef = React.useRef(null);
  const [wbStrokes, setWbStrokes] = React.useState([]);
  const [wbColor, setWbColor] = React.useState('#00F2FE');
  const [wbWidth, setWbWidth] = React.useState(3);
  const [wbTool, setWbTool] = React.useState('pen');
  const isDrawingRef = React.useRef(false);
  const currentStrokeRef = React.useRef(null);
  const wbVersionRef = React.useRef(0);

  const redrawCanvas = React.useCallback((strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach(s => {
      if (!s.points || s.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = s.tool === 'eraser' ? '#0B0E14' : (s.color || '#00F2FE');
      ctx.lineWidth = s.width || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    });
  }, []);

  const [wbCanWrite, setWbCanWrite] = React.useState(true);

  // Áp 1 op vào mảng strokes (replay append-only): 'stroke' thêm nét, 'clear' xoá sạch.
  const apDungOp = (strokes, op) => {
    if (op.type === 'clear') return [];
    if (op.type === 'stroke' && op.stroke) return [...strokes, op.stroke];
    return strokes;
  };

  React.useEffect(() => {
    if (dockTab !== 'whiteboard') return;
    let active = true;
    const fetchWb = async () => {
      try {
        const res = await fetch(`/api/phong-collab?phongId=${phong.id}&resource=whiteboard&sauId=${wbVersionRef.current}`);
        const d = await res.json();
        if (active && d.ok) {
          const ops = Array.isArray(d.payload?.ops) ? d.payload.ops : [];
          if (ops.length) {
            // Nếu có op 'clear' trong loạt mới → build lại từ đầu cho chắc
            if (ops.some(o => o.type === 'clear')) {
              const full = await fetch(`/api/phong-collab?phongId=${phong.id}&resource=whiteboard&sauId=0`);
              const df = await full.json();
              if (active && df.ok) {
                const allOps = Array.isArray(df.payload?.ops) ? df.payload.ops : [];
                const rebuilt = allOps.reduce(apDungOp, []);
                setWbStrokes(rebuilt);
                redrawCanvas(rebuilt);
              }
            } else {
              setWbStrokes(prev => {
                const next = ops.reduce(apDungOp, prev);
                redrawCanvas(next);
                return next;
              });
            }
          }
          wbVersionRef.current = d.version || 0;
          setWbCanWrite(d.canWrite !== false);
        } else if (active && d.code === 'capability_off') {
          setWbCanWrite(false);
        }
      } catch {}
    };
    fetchWb();
    const interval = setInterval(khiHienThi(fetchWb), 3000);
    return () => { active = false; clearInterval(interval); };
  }, [phong.id, dockTab, redrawCanvas]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    isDrawingRef.current = true;
    currentStrokeRef.current = {
      tool: wbTool,
      color: wbColor,
      width: wbTool === 'eraser' ? 16 : wbWidth,
      points: [{ x, y }]
    };
  };

  const drawMove = (e) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    currentStrokeRef.current.points.push({ x, y });
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = currentStrokeRef.current.tool === 'eraser' ? '#0B0E14' : currentStrokeRef.current.color;
    ctx.lineWidth = currentStrokeRef.current.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pts = currentStrokeRef.current.points;
    if (pts.length >= 2) {
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }
  };

  const stopDrawing = async () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 1) {
      const stroke = currentStrokeRef.current;
      const nextStrokes = [...wbStrokes, stroke];
      setWbStrokes(nextStrokes);
      currentStrokeRef.current = null;
      try {
        const res = await fetch('/api/phong-collab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phongId: phong.id,
            resource: 'whiteboard',
            payload: { type: 'stroke', stroke }
          })
        });
        const d = await res.json();
        if (d.ok && d.id) wbVersionRef.current = Math.max(wbVersionRef.current, d.id);
      } catch {}
    }
  };

  const clearWhiteboard = async () => {
    if (!confirm('Bạn có chắc muốn xóa sạch bảng vẽ? (chỉ quản trị phòng)')) return;
    try {
      const res = await fetch('/api/phong-collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phongId: phong.id,
          resource: 'whiteboard',
          payload: { type: 'clear' }
        })
      });
      const d = await res.json();
      if (d.ok) {
        setWbStrokes([]);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    } catch {}
  };

  // 4. Shared Sheet State (8 cols x 10 rows) — upsert từng ô, không whole-doc conflict
  const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const [sheetCells, setSheetCells] = React.useState({});
  const [sheetCanWrite, setSheetCanWrite] = React.useState(true);
  const sheetSaveTimersRef = React.useRef({});
  const sheetFocusedCellRef = React.useRef(null);
  const sheetPollRef = React.useRef(0);

  React.useEffect(() => {
    if (dockTab !== 'sheet') return;
    let active = true;
    const fetchSheet = async () => {
      try {
        const res = await fetch(`/api/phong-collab?phongId=${phong.id}&resource=sheet`);
        const d = await res.json();
        if (active && d.ok) {
          const incoming = d.payload?.cells || {};
          // Không ghi đè ô đang gõ dở
          setSheetCells(prev => {
            const merged = { ...incoming };
            const dangGo = sheetFocusedCellRef.current;
            if (dangGo && prev[dangGo] !== undefined) merged[dangGo] = prev[dangGo];
            return merged;
          });
          setSheetCanWrite(d.canWrite !== false);
        } else if (active && d.code === 'capability_off') {
          setSheetCanWrite(false);
        }
      } catch {}
    };
    fetchSheet();
    const interval = setInterval(khiHienThi(fetchSheet), 3000);
    return () => { active = false; clearInterval(interval); };
  }, [phong.id, dockTab]);

  const handleCellChange = (cellKey, val) => {
    setSheetCells(prev => ({ ...prev, [cellKey]: val }));
    const timers = sheetSaveTimersRef.current;
    if (timers[cellKey]) clearTimeout(timers[cellKey]);
    timers[cellKey] = setTimeout(async () => {
      try {
        await fetch('/api/phong-collab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phongId: phong.id,
            resource: 'sheet',
            payload: { cell: cellKey, value: val }
          })
        });
      } catch {}
    }, 800);
  };

  // 5. 1-to-1 WebRTC Voice Chat — pair-bound (tối đa 1 cặp/phòng, signaling riêng tư)
  const [voiceJoined, setVoiceJoined] = React.useState(false);
  const [micMuted, setMicMuted] = React.useState(true); // Default OFF
  const [voiceState, setVoiceState] = React.useState('disconnected');
  const [voiceNotice, setVoiceNotice] = React.useState('');
  const [voicePair, setVoicePair] = React.useState(null);       // {active, aTen, bTen, youIn, slot}
  const [voiceRequested, setVoiceRequested] = React.useState(false);
  const [yeuCauVoice, setYeuCauVoice] = React.useState([]);     // staff: danh sách xin quyền
  const pcRef = React.useRef(null);
  const localStreamRef = React.useRef(null);
  const remoteAudioRef = React.useRef(null);
  const lastSignalIdRef = React.useRef(0);
  const voicePollTimerRef = React.useRef(null);
  const voiceSlotRef = React.useRef(null);
  const voiceJoinedRef = React.useRef(false);
  const pendingCandidatesRef = React.useRef([]);
  voiceJoinedRef.current = voiceJoined;

  const dungKetNoiVoice = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
    setMicMuted(true);
  };

  // Poll trạng thái cặp + tín hiệu của partner (server chỉ trả signal của người trong cặp).
  const pollVoice = async () => {
    try {
      const res = await fetch(`/api/phong-collab?phongId=${phong.id}&action=voice_poll&sauId=${lastSignalIdRef.current}`);
      const d = await res.json();
      if (!d.ok) return;
      if (d.pair) setVoicePair(d.pair);
      if (Array.isArray(d.yeuCauVoice)) setYeuCauVoice(d.yeuCauVoice);
      const pc = pcRef.current;
      if (!voiceJoinedRef.current || !pc) return;
      for (const sig of d.signals || []) {
        lastSignalIdRef.current = Math.max(lastSignalIdRef.current, sig.id);
        try {
          if (sig.signalType === 'offer') {
            // Offer mới hoặc re-offer (đối phương bật mic muộn) đều set lại remote + trả answer.
            await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
            // Xả các candidate tới sớm trước khi có remoteDescription.
            for (const c of pendingCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
            }
            pendingCandidatesRef.current = [];
            const ans = await pc.createAnswer();
            await pc.setLocalDescription(ans);
            await fetch('/api/phong-collab', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phongId: phong.id, action: 'voice_signal', signalType: 'answer', payload: ans })
            });
          } else if (sig.signalType === 'answer') {
            if (pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
              for (const c of pendingCandidatesRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
              }
              pendingCandidatesRef.current = [];
            }
          } else if (sig.signalType === 'candidate') {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(sig.payload)).catch(() => {});
            } else {
              pendingCandidatesRef.current.push(sig.payload);
            }
          } else if (sig.signalType === 'leave') {
            setVoiceNotice('Người kia đã ngắt voice.');
            setVoiceState('disconnected');
            dungKetNoiVoice();
            setVoiceJoined(false);
            voiceSlotRef.current = null;
          }
        } catch { /* bỏ qua signal lỗi */ }
      }
    } catch {}
  };

  // Poll chạy khi tab voice mở (xem trạng thái cặp) hoặc đang trong cặp.
  React.useEffect(() => {
    if (dockTab !== 'voice' && !voiceJoined) return;
    pollVoice();
    voicePollTimerRef.current = setInterval(pollVoice, 1500);
    return () => { if (voicePollTimerRef.current) clearInterval(voicePollTimerRef.current); };
  }, [phong.id, dockTab, voiceJoined]);

  const joinVoice = async () => {
    setVoiceNotice('Đang xin chỗ trong cặp voice...');
    setVoiceState('connecting');
    try {
      // 1. Giành slot trên server trước (server-authoritative: tối đa 1 cặp 1-1/phòng)
      const joinRes = await fetch('/api/phong-collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phongId: phong.id, action: 'voice_join' })
      });
      const joinData = await joinRes.json();
      if (!joinData.ok) {
        if (joinData.code === 'grant_required') {
          setVoiceNotice('Bạn cần được cấp quyền voice — hãy bấm "Xin quyền voice".');
        } else {
          setVoiceNotice(joinData.loi || 'Không thể tham gia voice.');
        }
        setVoiceState('disconnected');
        return;
      }
      voiceSlotRef.current = joinData.slot;
      setVoiceJoined(true);

      // 2. Xin mic TRƯỚC khi tạo offer — track phải có sẵn trong SDP negotiation,
      //    addTrack sau khi đã bắt tay mà không renegotiate → người kia không nghe được.
      //    Mic khởi đầu muted (enabled=false) — user tự bật bằng nút Mic.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream.getAudioTracks().forEach(t => { t.enabled = false; });
        localStreamRef.current = stream;
      } catch {
        setVoiceNotice('Không xin được micro — bạn chỉ nghe được, không nói được.');
      }

      // 3. Tạo peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/phong-collab', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phongId: phong.id,
              action: 'voice_signal',
              signalType: 'candidate',
              payload: event.candidate
            })
          }).catch(() => {});
        }
      };

      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === 'connected') {
          setVoiceState('connected');
          setVoiceNotice('✓ Đang kết nối thoại 1-1 trực tiếp.');
        } else if (s === 'failed' || s === 'disconnected') {
          setVoiceState('disconnected');
          setVoiceNotice('Mất kết nối thoại (mạng chặn P2P nếu không có TURN).');
        }
      };

      // 4. Slot 'b' (người vào sau) tạo offer; slot 'a' chờ offer từ poll.
      if (joinData.slot === 'b') {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await fetch('/api/phong-collab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phongId: phong.id, action: 'voice_signal', signalType: 'offer', payload: offer })
        });
        setVoiceNotice('Đã vào cặp — đang bắt tay với ' + (voicePair?.aTen || 'người kia') + '…');
      } else {
        setVoiceNotice('Bạn là người đầu tiên — chờ thêm 1 người vào voice…');
      }
    } catch (err) {
      setVoiceNotice('Lỗi kết nối voice: ' + err.message);
      setVoiceState('disconnected');
    }
  };

  const xinQuyenVoice = async () => {
    try {
      const res = await fetch('/api/phong-collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phongId: phong.id, action: 'voice_request' })
      });
      const d = await res.json();
      if (d.ok && d.granted) {
        setVoiceNotice('Bạn đã được phép voice — bấm Tham gia.');
      } else if (d.ok) {
        setVoiceRequested(true);
        setVoiceNotice('Đã gửi yêu cầu — chờ quản trị phòng duyệt.');
      } else {
        setVoiceNotice(d.loi || 'Không gửi được yêu cầu.');
      }
    } catch { setVoiceNotice('Lỗi kết nối.'); }
  };

  const ngatVoiceCap = async () => {
    if (!confirm('Ngắt cặp voice đang hoạt động?')) return;
    await fetch('/api/phong-collab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phongId: phong.id, action: 'voice_end' })
    }).catch(() => {});
    pollVoice();
  };

  const toggleMic = async () => {
    if (micMuted) {
      try {
        if (!localStreamRef.current) {
          // Mic bị từ chối lúc join → xin lại; addTrack muộn cần renegotiate (offer mới).
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = stream;
          const pc = pcRef.current;
          if (pc) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              await fetch('/api/phong-collab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phongId: phong.id, action: 'voice_signal', signalType: 'offer', payload: offer })
              });
            } catch { /* renegotiation thất bại — nghe vẫn được */ }
          }
        } else {
          localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
        }
        setMicMuted(false);
      } catch (err) {
        alert('Không thể mở micro: ' + err.message);
      }
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
      }
      setMicMuted(true);
    }
  };

  const leaveVoice = () => {
    fetch('/api/phong-collab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phongId: phong.id, action: 'voice_signal', signalType: 'leave', payload: {} })
    }).catch(() => {});
    dungKetNoiVoice();
    setVoiceJoined(false);
    setVoiceState('disconnected');
    voiceSlotRef.current = null;
    setVoiceNotice('Đã ngắt voice.');
  };

  return (
    <div id="study-dock-container" className="bg-gradient-to-b from-[#161b26] to-[#0f141d] border border-white/[0.08] rounded-2xl p-4 flex flex-col h-full min-h-[420px] lg:min-h-[480px] shadow-xl">
      {/* Study Dock Tab Navigation — Gọn gàng, thẩm mỹ, nút nổi bật */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="tab-study-chat"
            type="button"
            onClick={() => setDockTab('chat')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              dockTab === 'chat'
                ? 'bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black shadow-[0_0_15px_rgba(0,242,254,0.35)] border border-[#00F2FE]/50'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105'
            }`}>
            <span>💬</span>
            <span>Chat phòng</span>
          </button>
          <button
            id="tab-study-notes"
            type="button"
            onClick={() => setDockTab('notes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              dockTab === 'notes'
                ? 'bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black shadow-[0_0_15px_rgba(0,242,254,0.35)] border border-[#00F2FE]/50'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105'
            }`}>
            <span>📝</span>
            <span>Ghi chú</span>
          </button>
          <button
            id="tab-study-whiteboard"
            type="button"
            onClick={() => setDockTab('whiteboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              dockTab === 'whiteboard'
                ? 'bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black shadow-[0_0_15px_rgba(0,242,254,0.35)] border border-[#00F2FE]/50'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105'
            }`}>
            <span>🎨</span>
            <span>Bảng vẽ</span>
          </button>
          <button
            id="tab-study-sheet"
            type="button"
            onClick={() => setDockTab('sheet')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              dockTab === 'sheet'
                ? 'bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black shadow-[0_0_15px_rgba(0,242,254,0.35)] border border-[#00F2FE]/50'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105'
            }`}>
            <span>📊</span>
            <span>Bảng tính</span>
          </button>
          <button
            id="tab-study-voice"
            type="button"
            onClick={() => setDockTab('voice')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              dockTab === 'voice'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-[0_0_15px_rgba(251,191,36,0.35)] border border-amber-400/50'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105'
            }`}>
            <span>🎙️</span>
            <span>Voice (1-1)</span>
          </button>
          <button
            id="tab-study-members"
            type="button"
            onClick={() => setDockTab('members')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              dockTab === 'members'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-black shadow-[0_0_15px_rgba(52,211,153,0.35)] border border-emerald-400/50'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105'
            }`}>
            <span>👥</span>
            <span>Thành viên{thanhVien.length > 0 ? ` (${thanhVien.length})` : ''}</span>
          </button>

          {isStaff && (
            <button
              id="tab-study-quan-tri"
              type="button"
              onClick={() => setDockTab('quan-tri')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                dockTab === 'quan-tri'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.35)] border border-violet-500/50'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105'
              }`}>
              <span>⚙️</span>
              <span>Quyền</span>
            </button>
          )}
        </div>
      </div>

      {/* Dock Content Body */}
      <div className="flex-1 flex flex-col pt-3 min-h-[300px]">
        {/* TAB 1: CHAT PHÒNG */}
        {dockTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-72 lg:max-h-[380px] xl:max-h-[440px] text-xs">
              {phongChat.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-8">Chưa có tin nhắn — hãy gửi câu hỏi hoặc trao đổi về bài giảng!</p>
              ) : (
                phongChat.map((m, idx) => (
                  <div key={m.id || idx} className="text-xs group">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-slate-300 text-[11px]">{m.tenNguoiGui}</span>
                      {m.vaiTro === 'giao_vien' ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">GVCN</span>
                      ) : m.lopTen ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/20">{m.lopTen}</span>
                      ) : null}
                      <span className="text-[10px] text-slate-500">
                        {m.taoLuc ? new Date(m.taoLuc.replace(' ', 'T') + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      {isStaff && (
                        <button
                          type="button"
                          title="Xoá tin nhắn này (quản trị phòng)"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/phong-chat?phongId=${phong.id}&id=${m.id}`, { method: 'DELETE' });
                              const d = await res.json();
                              if (d.ok && onXoaTinPhong) onXoaTinPhong(m.id);
                            } catch { /* bỏ qua */ }
                          }}
                          className="opacity-0 group-hover:opacity-100 px-1 text-[9px] text-slate-500 hover:text-rose-400 transition-all">
                          ✕
                        </button>
                      )}
                    </div>
                    <p className="bg-[#0B0E14] border border-white/5 hover:border-[#00F2FE]/15 rounded-xl px-3 py-2 text-slate-200 text-xs leading-relaxed break-words transition-colors">
                      {m.noiDung}
                    </p>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendRoomChat} className="pt-2 border-t border-white/8 flex flex-col gap-2 mt-auto">
              {/* Emoji panel */}
              {showEmoji && (
                <div className="flex flex-wrap gap-1 p-2 bg-[#0B0E14] border border-white/10 rounded-2xl">
                  {['😊','😂','🥰','😎','🤔','😅','😭','🔥','❤️','👍','🙏','🎉','✅','💯','👋','📚','✏️','🎯','🌟','💡','⚡','🏆','🤝','💪','🤩'].map(em => (
                    <button key={em} type="button"
                      onClick={() => { setChatInput(v => v + em); setShowEmoji(false); }}
                      className="text-lg hover:scale-125 transition-transform active:scale-95 px-1">{em}</button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <textarea
                    id="input-phong-chat"
                    rows={1}
                    placeholder={coQuyen('chat') ? 'Nhắn tin phòng học...' : 'Chat đang bị khóa'}
                    value={chatInput}
                    disabled={!coQuyen('chat')}
                    onChange={e => setChatInput(e.target.value)}
                    onCompositionStart={() => { chatComposingRef.current = true; }}
                    onCompositionEnd={() => { chatComposingRef.current = false; }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        if (e.nativeEvent?.isComposing || chatComposingRef.current) return;
                        e.preventDefault();
                        handleSendRoomChat();
                      }
                    }}
                    maxLength={500}
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/50 focus:shadow-[0_0_12px_rgba(0,242,254,0.12)] resize-none min-h-[38px] max-h-24 disabled:opacity-40 transition-all"
                  />
                </div>
                {/* Emoji button */}
                <button
                  type="button"
                  disabled={!coQuyen('chat')}
                  onClick={() => setShowEmoji(v => !v)}
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-base transition-all disabled:opacity-30 shrink-0 active:scale-90 ${
                    showEmoji ? 'bg-[#00F2FE]/20 border border-[#00F2FE]/40 text-[#00F2FE]' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Chọn emoji">
                  😊
                </button>
                {/* Send button */}
                <button
                  type="submit"
                  id="btn-send-phong-chat"
                  disabled={!chatInput.trim() || chatSending || !coQuyen('chat')}
                  className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#00F2FE] to-[#3B82F6] text-black flex items-center justify-center font-black transition-all disabled:opacity-30 shrink-0 hover:brightness-110 active:scale-90 shadow-[0_0_12px_rgba(0,242,254,0.3)]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: GHI CHÚ CỘNG TÁC — entry append, có gắn mốc video */}
        {dockTab === 'notes' && (
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Ghi chú chung của phòng — mỗi người thêm một dòng, có thể gắn mốc video</span>
              {notesNotice && <span className="text-rose-300 font-bold">{notesNotice}</span>}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-64 min-h-[180px] bg-[#0B0E14] border border-white/10 rounded-xl p-2.5">
              {notesList.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-8">Chưa có ghi chú — thêm dòng đầu tiên cho cả phòng.</p>
              ) : (
                notesList.map((n) => (
                  <div key={n.id} className="flex items-start gap-2 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400">{n.ten}</span>
                        {n.videoTimeSec != null && n.videoTimeSec > 0 && (
                          <button
                            type="button"
                            onClick={() => yeuCauTua(n.videoTimeSec)}
                            className="px-1.5 py-0.2 rounded text-[9px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30">
                            ▶ {dinhDangGiayPhut(n.videoTimeSec)}
                          </button>
                        )}
                        <span className="text-[9px] text-slate-600 font-mono">
                          {n.taoLuc ? new Date(n.taoLuc.replace(' ', 'T') + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed break-words">{n.noiDung}</p>
                    </div>
                    {(n.cuaToi || isStaff) && (
                      <button
                        type="button"
                        onClick={() => xoaGhiChu(n.id)}
                        title="Xoá ghi chú"
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 text-[10px] px-1 transition-all">
                        ✕
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            {notesCanWrite ? (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!e.nativeEvent?.isComposing && !noteComposingRef.current) themGhiChu();
                }}
                className="flex items-center gap-2"
              >
                <input
                  id="study-note-input"
                  type="text"
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  onCompositionStart={() => { noteComposingRef.current = true; }}
                  onCompositionEnd={() => { noteComposingRef.current = false; }}
                  placeholder="Thêm ghi chú cho phòng..."
                  maxLength={1000}
                  className="flex-1 bg-[#0B0E14] border border-white/10 focus:border-[#00F2FE]/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setNoteWithTime(v => !v)}
                  title={noteWithTime ? 'Đang gắn mốc video vào ghi chú' : 'Không gắn mốc video'}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all ${noteWithTime ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                  ⏱
                </button>
                <button
                  type="submit"
                  id="btn-add-note"
                  disabled={!noteInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#00F2FE] text-black text-xs font-black disabled:opacity-30">
                  Thêm
                </button>
              </form>
            ) : (
              <p className="text-[11px] text-amber-300/80 text-center py-1">🔒 Ghi chú đang ở chế độ chỉ xem — quản trị phòng đã khóa.</p>
            )}
          </div>
        )}

        {/* TAB 3: BẢNG VẼ CỘNG TÁC (SHARED WHITEBOARD) */}
        {dockTab === 'whiteboard' && (
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs pb-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-wb-pen"
                  onClick={() => setWbTool('pen')}
                  disabled={!wbCanWrite}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-40 ${wbTool === 'pen' ? 'bg-[#00F2FE] text-black' : 'bg-white/10 text-slate-300'}`}>
                  ✏️ Bút vẽ
                </button>
                <button
                  type="button"
                  id="btn-wb-eraser"
                  onClick={() => setWbTool('eraser')}
                  disabled={!wbCanWrite}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-40 ${wbTool === 'eraser' ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-300'}`}>
                  🧹 Tẩy
                </button>
                <div className="flex items-center gap-1 ml-2">
                  {['#00F2FE', '#FFB800', '#F43F5E', '#FFFFFF'].map(c => (
                    <button
                      key={c}
                      type="button"
                      disabled={!wbCanWrite}
                      onClick={() => { setWbColor(c); setWbTool('pen'); }}
                      className={`w-5 h-5 rounded-full border disabled:opacity-40 ${wbColor === c && wbTool === 'pen' ? 'scale-110 border-white ring-2 ring-cyan-400' : 'border-transparent'}`}
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
              {isStaff && (
                <button
                  type="button"
                  id="btn-wb-clear"
                  onClick={clearWhiteboard}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-300 border border-white/10 text-xs font-bold">
                  Xóa bảng
                </button>
              )}
            </div>
            <div className="flex-1 bg-[#0B0E14] border border-white/10 rounded-xl overflow-hidden flex items-center justify-center relative touch-none min-h-[220px]">
              {!wbCanWrite && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-[11px] text-amber-300/90 font-bold">
                  🔒 Bảng vẽ đang ở chế độ chỉ xem
                </div>
              )}
              <canvas
                id="study-whiteboard-canvas"
                ref={canvasRef}
                width={640}
                height={320}
                onMouseDown={wbCanWrite ? startDrawing : undefined}
                onMouseMove={wbCanWrite ? drawMove : undefined}
                onMouseUp={wbCanWrite ? stopDrawing : undefined}
                onMouseLeave={wbCanWrite ? stopDrawing : undefined}
                onTouchStart={wbCanWrite ? startDrawing : undefined}
                onTouchMove={wbCanWrite ? drawMove : undefined}
                onTouchEnd={wbCanWrite ? stopDrawing : undefined}
                className={`w-full h-full ${wbCanWrite ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
              />
            </div>
          </div>
        )}

        {/* TAB 4: BẢNG TÍNH CỘNG TÁC (SHARED SHEET 8x10) */}
        {dockTab === 'sheet' && (
          <div className="flex-1 flex flex-col gap-2 overflow-x-auto">
            <div className="text-[11px] text-slate-400">
              Bảng tính phân tích số liệu / mốc thời gian học tập (Lưu tự động)
            </div>
            <div className="flex-1 overflow-auto max-h-72 border border-white/10 rounded-xl bg-[#0B0E14]">
              <table id="study-sheet-table" className="w-full text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-400 border-b border-white/10 font-mono">
                    <th className="w-8 p-1 text-center border-r border-white/10 text-[10px]">#</th>
                    {COLS.map(c => (
                      <th key={c} className="p-1.5 text-center border-r border-white/10 min-w-[70px] text-[11px] font-bold text-cyan-300">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(r => (
                    <tr key={r} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="p-1 text-center bg-white/5 text-slate-500 font-mono text-[10px] border-r border-white/10">
                        {r}
                      </td>
                      {COLS.map(c => {
                        const cellKey = `${c}${r}`;
                        return (
                          <td key={cellKey} className="p-0 border-r border-white/5">
                            <input
                              type="text"
                              data-cell={cellKey}
                              value={sheetCells[cellKey] || ''}
                              readOnly={!sheetCanWrite}
                              onFocus={() => { sheetFocusedCellRef.current = cellKey; }}
                              onBlur={() => { sheetFocusedCellRef.current = null; }}
                              onChange={e => sheetCanWrite && handleCellChange(cellKey, e.target.value)}
                              className={`w-full bg-transparent px-2 py-1 text-xs text-white focus:bg-[#151A23] focus:outline-none focus:ring-1 focus:ring-[#00F2FE] ${!sheetCanWrite ? 'opacity-60 cursor-not-allowed' : ''}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: 1-TO-1 WEBRTC VOICE — pair-bound, có xin quyền */}
        {dockTab === 'voice' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
            <audio ref={remoteAudioRef} autoPlay />
            <div className="w-16 h-16 rounded-3xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              🎙️
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Thoại Trực Tiếp 1-1 Trong Phòng</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Mỗi phòng tối đa một cặp voice 1-1. Micro mặc định tắt khi chưa bật.
              </p>
            </div>

            {/* Trạng thái cặp hiện tại */}
            {voicePair?.active !== undefined && (
              <p className="text-[11px] font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                {voicePair?.aTen ? `${voicePair.aTen}${voicePair.bTen ? ' ↔ ' + voicePair.bTen : ' · đang chờ người thứ 2'}` : 'Chưa có cặp voice nào'}
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap justify-center">
              {!voiceJoined ? (
                <>
                  {coQuyen('voice') ? (
                    <button
                      type="button"
                      id="btn-voice-join"
                      onClick={joinVoice}
                      disabled={voicePair?.active && !voicePair?.youIn}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40">
                      {voicePair?.active ? 'Đang có cặp voice khác' : voicePair?.aTen ? 'Vào cặp với ' + voicePair.aTen : 'Tham gia voice'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="btn-voice-request"
                      onClick={xinQuyenVoice}
                      disabled={voiceRequested}
                      className="px-5 py-2.5 rounded-xl bg-white/10 text-slate-200 border border-white/15 font-bold text-xs hover:bg-white/15 transition-all disabled:opacity-50">
                      {voiceRequested ? '⏳ Đang chờ duyệt…' : '🙋 Xin quyền voice'}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    id="btn-voice-toggle-mic"
                    onClick={toggleMic}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${micMuted ? 'bg-white/10 text-slate-300 hover:bg-white/15' : 'bg-emerald-500 text-black'}`}>
                    <span>{micMuted ? '🔇 Bật Mic' : '🎙️ Mic Đang Bật'}</span>
                  </button>
                  <button
                    type="button"
                    id="btn-voice-leave"
                    onClick={leaveVoice}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 transition-all">
                    Rời voice
                  </button>
                </>
              )}
              {isStaff && voicePair?.aTen && !voicePair?.youIn && (
                <button
                  type="button"
                  id="btn-voice-end"
                  onClick={ngatVoiceCap}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/25 text-xs font-bold hover:bg-rose-500/20 transition-all">
                  Ngắt cặp voice
                </button>
              )}
            </div>

            {/* Staff: danh sách xin quyền voice */}
            {isStaff && yeuCauVoice.length > 0 && (
              <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-2.5 text-left">
                <p className="text-[10px] uppercase font-bold tracking-wider text-amber-300 mb-1.5">Đang xin quyền voice</p>
                {yeuCauVoice.map(r => (
                  <div key={r.khoa} className="flex items-center gap-2 text-xs py-1">
                    <span className="text-slate-200 font-semibold flex-1 truncate">{r.ten || 'Thành viên'}</span>
                    <button
                      type="button"
                      onClick={async () => { const d = await hanhDongPhong?.('grant', { khoaTV: r.khoa, capability: 'voice', on: true }); if (d?.ok) setYeuCauVoice(prev => prev.filter(x => x.khoa !== r.khoa)); }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold hover:bg-emerald-500/30">
                      Duyệt
                    </button>
                    <button
                      type="button"
                      onClick={async () => { const d = await hanhDongPhong?.('grant', { khoaTV: r.khoa, capability: 'voice', on: false }); if (d?.ok) setYeuCauVoice(prev => prev.filter(x => x.khoa !== r.khoa)); }}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/25 text-[10px] font-bold hover:bg-rose-500/25">
                      Từ chối
                    </button>
                  </div>
                ))}
              </div>
            )}

            {voiceNotice && (
              <p id="voice-status-notice" className="text-xs text-slate-300 font-mono bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                {voiceNotice}
              </p>
            )}
            <p className="text-[10px] text-slate-500 max-w-xs">
              * Ghi chú: Kết nối thoại P2P yêu cầu mạng không chặn UDP. Restrictive NAT có thể cần relay TURN.
            </p>
          </div>
        )}

        {/* TAB 7: THÀNH VIÊN TRONG PHÒNG */}
        {dockTab === 'members' && (
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-80 lg:max-h-[420px] pr-1">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <span>👥</span>
                <span>Thành viên trong phòng ({thanhVien.length})</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Đang trực tuyến
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {thanhVien.map((tv, idx) => {
                const laHost = tv.laChuPhong === 1 || tv.vaiTroPhong === 'host';
                const laGV = tv.vaiTro === 'giao_vien';
                const laCoHost = tv.vaiTroPhong === 'cohost';
                const grantVoice = grants.some(g => g.khoaTV === tv.khoa && g.capability === 'voice');
                const grantVideo = grants.some(g => g.khoaTV === tv.khoa && g.capability === 'video_control');

                return (
                  <div
                    key={tv.khoa || tv.ten || idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-teal-500/25 transition-all">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-xs font-black text-teal-300 shrink-0">
                      {tv.avatar ? (
                        <img src={tv.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        (tv.ten || '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200 truncate">{tv.ten}</span>
                        {laHost && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                            👑 Host
                          </span>
                        )}
                        {laGV && !laHost && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/30 shrink-0">
                            🎓 Giáo viên
                          </span>
                        )}
                        {laCoHost && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0">
                            ⭐ Co-host
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {tv.lopTen ? `Lớp ${tv.lopTen}` : (laGV ? 'Giáo viên trường' : 'Học sinh')}
                      </span>
                    </div>

                    {/* Member actions nếu là host/GV */}
                    {(vaiTroPhong === 'host' || auth.user?.isTeacher) && !laHost && tv.khoa && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => hanhDongPhong?.('set_co_host', { khoaTV: tv.khoa, on: !laCoHost })}
                          title={laCoHost ? 'Thu quyền co-host' : 'Cấp co-host'}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
                            laCoHost
                              ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                          }`}>
                          co-host
                        </button>
                        <button
                          type="button"
                          onClick={() => hanhDongPhong?.('grant', { khoaTV: tv.khoa, capability: 'voice', on: !grantVoice })}
                          title="Cấp/thu quyền mic"
                          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] border transition-all ${
                            grantVoice
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                          }`}>
                          🎙️
                        </button>
                        <button
                          type="button"
                          onClick={() => hanhDongPhong?.('grant', { khoaTV: tv.khoa, capability: 'video_control', on: !grantVideo })}
                          title="Cấp/thu quyền video"
                          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] border transition-all ${
                            grantVideo
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                          }`}>
                          🎥
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Kick ${tv.ten} khỏi phòng?`)) {
                              const d = await hanhDongPhong?.('kick', { khoaTV: tv.khoa });
                              if (d && !d.ok) alert(d.loi || 'Không kick được.');
                            }
                          }}
                          title="Kick khỏi phòng"
                          className="w-6 h-6 rounded flex items-center justify-center text-[10px] border bg-rose-500/10 text-rose-300 border-rose-500/25 hover:bg-rose-500/25">
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {thanhVien.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Chưa có thành viên nào trong phòng.
                </div>
              )}
            </div>
          </div>
        )}



        {/* TAB 6: QUẢN TRỊ PHÒNG (staff only) — policy matrix + member actions */}
        {dockTab === 'quan-tri' && isStaff && (
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-80 pr-1">
            {/* Quick actions theo mô hình đã chốt */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={async () => {
                  for (const cap of ['notes', 'whiteboard', 'sheet']) {
                    await hanhDongPhong?.('policy', { capability: cap, enabled: 1, accessMode: 'staff_only' });
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-bold hover:bg-rose-500/25">
                🔒 Khóa cộng tác (chỉ xem)
              </button>
              <button
                type="button"
                onClick={async () => {
                  for (const cap of ['notes', 'whiteboard', 'sheet']) {
                    await hanhDongPhong?.('policy', { capability: cap, enabled: 1, accessMode: 'everyone' });
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold hover:bg-emerald-500/25">
                🔓 Mở cộng tác cho mọi người
              </button>
            </div>

            {/* Policy matrix */}
            <div className="bg-[#0B0E14] border border-white/10 rounded-xl p-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">Chính sách công cụ</p>
              <div className="space-y-1.5">
                {[
                  ['video_control', 'Điều khiển phát (play/pause/tua)'],
                  ['video_change', 'Đổi video đang phát'],
                  ['queue', 'Hàng đợi video'],
                  ['chat', 'Chat phòng'],
                  ['notes', 'Ghi chú chung'],
                  ['whiteboard', 'Bảng vẽ'],
                  ['sheet', 'Bảng tính'],
                  ['voice', 'Voice 1-1'],
                  ['invite', 'Mời người vào phòng'],
                ].map(([cap, nhan]) => {
                  const pol = policies?.[cap] || { enabled: 1, access_mode: 'staff_only' };
                  return (
                    <div key={cap} className="flex items-center gap-2 text-xs">
                      <span className="flex-1 text-slate-300 truncate">{nhan}</span>
                      <button
                        type="button"
                        onClick={() => hanhDongPhong?.('policy', { capability: cap, enabled: pol.enabled ? 0 : 1, accessMode: pol.access_mode })}
                        title={pol.enabled ? 'Đang bật — bấm để tắt' : 'Đang tắt — bấm để bật'}
                        className={`w-8 h-4.5 px-0.5 rounded-full border transition-all flex items-center ${pol.enabled ? 'bg-emerald-500/30 border-emerald-500/40 justify-end' : 'bg-white/5 border-white/15 justify-start'}`}>
                        <span className={`w-3 h-3 rounded-full ${pol.enabled ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                      </button>
                      <select
                        value={pol.access_mode}
                        disabled={!pol.enabled}
                        onChange={e => hanhDongPhong?.('policy', { capability: cap, enabled: 1, accessMode: e.target.value })}
                        className="bg-[#151A23] border border-white/10 rounded-lg px-1.5 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-[#00F2FE]/50 disabled:opacity-40">
                        <option value="staff_only">Quản trị</option>
                        <option value="selected_members">Một số người</option>
                        <option value="everyone">Mọi người</option>
                      </select>
                    </div>
                  );
                })}
                <div className="flex items-center gap-2 text-xs opacity-60">
                  <span className="flex-1 text-slate-400">Kiểm duyệt (kick/xoá tin)</span>
                  <span className="text-[9px] font-bold text-amber-300 border border-amber-500/30 rounded px-1.5 py-0.5">LUÔN QUẢN TRỊ</span>
                </div>
              </div>
            </div>

            {/* Quản lý thành viên */}
            <div className="bg-[#0B0E14] border border-white/10 rounded-xl p-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">Thành viên & quyền riêng</p>
              <div className="space-y-1.5">
                {(thanhVien || []).map(tv => {
                  const laHost = Boolean(tv.laChuPhong);
                  const laGV = tv.vaiTro === 'giao_vien';
                  const laCoHost = tv.vaiTroPhong === 'co_host';
                  const grantVoice = (grants || []).some(g => g.khoa === tv.khoa && g.capability === 'voice' && g.trangThai === 'granted');
                  const grantVideo = (grants || []).some(g => g.khoa === tv.khoa && g.capability === 'video_control' && g.trangThai === 'granted');
                  return (
                    <div key={tv.khoa || tv.ten} className="flex items-center gap-1.5 text-xs flex-wrap">
                      <span className="text-slate-200 font-semibold truncate max-w-[110px]">{tv.ten}</span>
                      {laHost && <span className="text-[9px] text-amber-400 font-bold">★ host</span>}
                      {laGV && <span className="text-[9px] text-[#00F2FE] font-bold">GV</span>}
                      {laCoHost && <span className="text-[9px] text-violet-300 font-bold">co-host</span>}
                      {!laHost && !laGV && tv.khoa && (
                        <span className="ml-auto flex items-center gap-1">
                          {(vaiTroPhong === 'host' || auth.user?.isTeacher) && (
                            <button
                              type="button"
                              onClick={() => hanhDongPhong?.('set_co_host', { khoaTV: tv.khoa, on: !laCoHost })}
                              title={laCoHost ? 'Thu quyền co-host' : 'Cấp co-host'}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${laCoHost ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}>
                              co-host
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => hanhDongPhong?.('grant', { khoaTV: tv.khoa, capability: 'voice', on: !grantVoice })}
                            title="Cấp/thu quyền voice"
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${grantVoice ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}>
                            🎙
                          </button>
                          <button
                            type="button"
                            onClick={() => hanhDongPhong?.('grant', { khoaTV: tv.khoa, capability: 'video_control', on: !grantVideo })}
                            title="Cấp/thu quyền điều khiển video"
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${grantVideo ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}>
                            ▶
                          </button>
                          <button
                            type="button"
                            onClick={async () => { if (confirm(`Kick ${tv.ten} khỏi phòng?`)) { const d = await hanhDongPhong?.('kick', { khoaTV: tv.khoa }); if (d && !d.ok) alert(d.loi || 'Không kick được.'); } }}
                            title="Kick khỏi phòng"
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-rose-500/10 text-rose-300 border-rose-500/25 hover:bg-rose-500/25">
                            kick
                          </button>
                        </span>
                      )}
                    </div>
                  );
                })}
                {(thanhVien || []).length === 0 && <p className="text-[11px] text-slate-500">Chưa có thành viên.</p>}
              </div>
            </div>

            {/* Đổi/bỏ mật khẩu — chỉ host/GV */}
            {(vaiTroPhong === 'host' || auth.user?.isTeacher) && (
              <div className="bg-[#0B0E14] border border-white/10 rounded-xl p-3 flex items-center gap-2">
                <input
                  type="password"
                  placeholder="Mật khẩu mới (để trống = bỏ mật khẩu)"
                  id="input-phong-mat-khau-moi"
                  maxLength={100}
                  className="flex-1 bg-[#151A23] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/50"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const el = document.getElementById('input-phong-mat-khau-moi');
                    const mk = el?.value || '';
                    const d = mk.trim()
                      ? await hanhDongPhong?.('doi_mat_khau', { matKhauMoi: mk.trim() })
                      : await hanhDongPhong?.('bo_mat_khau', {});
                    if (d && !d.ok) alert(d.loi || 'Không đổi được mật khẩu.');
                    if (el) el.value = '';
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold hover:bg-amber-500/25">
                  Đổi / Bỏ
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CampusWatchTogether({
  phong,
  phongMinhKhoa: _phongMinhKhoa,
  auth,
  dongPhongHienTai: _dongPhongHienTai,
  soNguoi: _soNguoi,
  myCaps,
  videoTimeRef,
  isRoomWide,
  hanhDongPhong: _hanhDongPhong,
  isStaff = false,
}) {
  const [watchState, setWatchState] = useState({
    playing: false,
    positionSeconds: 0,
    basePositionSeconds: 0,
    playbackRate: 1.0,
    revision: 1,
    updatedAt: '',
    serverNow: '',
    updatedBy: ''
  });
  const [canControl, setCanControl] = useState(Boolean(
    auth?.user?.isTeacher || phong?.canControl || phong?.laChuPhong || myCaps?.video_control || myCaps?.video_change || isStaff
  ));
  const [_watchCaps, setWatchCaps] = useState({});
  const getInitialVideoUrl = () => {
    let c = {};
    try { c = phong?.cauHinh ? JSON.parse(phong.cauHinh) : {}; } catch { }
    return c.videoUrl || phong?.videoUrl || '';
  };

  const getInitialProvider = (u) => {
    if (!u) return 'UNSUPPORTED';
    if (idYoutube(u)) return 'YOUTUBE';
    if (idGoogleDrive(u)) return 'GOOGLE_DRIVE';
    if (laVideoTrucTiepFe(u)) return 'NATIVE_HTML5';
    return 'UNSUPPORTED';
  };

  const initUrl = getInitialVideoUrl();
  const [activeVideoUrl, setActiveVideoUrl] = useState(initUrl);
  const [provider, setProvider] = useState(() => getInitialProvider(initUrl));
  const [hasInteracted, setHasInteracted] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dangGuiLenh, setDangGuiLenh] = useState(false);
  const [loi, setLoi] = useState('');

  // ─── CẤU HÌNH VIDEO, TÌM KIẾM YOUTUBE & HÀNG ĐỢI TẠI VÙNG 1 ───
  const [mediaTab, setMediaTab] = useState('search'); // 'search' | 'queue'
  const [videoMoi, setVideoMoi] = useState('');
  const [dangDoiVideo, setDangDoiVideo] = useState(false);
  const [loiVideo, setLoiVideo] = useState('');
  const [thongBaoVideo, setThongBaoVideo] = useState('');

  // YouTube Search State
  const [ytQuery, setYtQuery] = useState('');
  const [ytResults, setYtResults] = useState([]);
  const [searchingYt, setSearchingYt] = useState(false);
  const [searchLoi, setSearchLoi] = useState('');

  // Queue State
  const [queueList, setQueueList] = useState([]);
  const [queueBusy, setQueueBusy] = useState(false);
  const [daMoRongStudio, setDaMoRongStudio] = useState(true);

  useEffect(() => {
    if (phong?.canControl || phong?.laChuPhong || auth?.user?.isTeacher || myCaps?.video_control || myCaps?.video_change || isStaff) {
      setCanControl(true);
    }
  }, [phong?.canControl, phong?.laChuPhong, auth?.user?.isTeacher, myCaps, isStaff]);

  // Tải danh sách hàng đợi từ server
  const taiQueue = async () => {
    try {
      const res = await fetch(`/api/phong-queue?phongId=${phong.id}&action=list`);
      const d = await res.json();
      if (d.ok) setQueueList(d.queue || []);
    } catch {}
  };

  useEffect(() => {
    taiQueue();
    const timer = setInterval(khiHienThi(taiQueue), 4000);
    return () => clearInterval(timer);
  }, [phong.id]);

  // Đổi video đang phát
  const doiVideo = async (url, title) => {
    const u = String(url || videoMoi || ytQuery || '').trim();
    if (!u || dangDoiVideo) return;
    setDangDoiVideo(true);
    setLoiVideo('');
    try {
      const res = await fetch('/api/phong-watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phongId: phong.id, action: 'set_video', videoUrl: u, autoPlay: true })
      });
      const d = await res.json();
      if (!d.ok) {
        setLoiVideo(d.loi || 'Không đổi được video.');
      } else {
        setActiveVideoUrl(u);
        setProvider(getInitialProvider(u));
        setVideoMoi('');
        if (d.state) {
          setWatchState(d.state);
          setLocalTime(0);
        }
        const newYtId = idYoutube(u);
        if (newYtId && ytPlayerRef.current && ytReadyRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          try {
            ytPlayerRef.current.loadVideoById({ videoId: newYtId, startSeconds: 0 });
            ytPlayerRef.current.playVideo();
          } catch {}
        }
        setThongBaoVideo(`Đang phát: ${title || u}`);
        setTimeout(() => setThongBaoVideo(''), 4000);
        taiQueue();
      }
    } catch {
      setLoiVideo('Mất kết nối máy chủ.');
    } finally {
      setDangDoiVideo(false);
    }
  };

  // Tìm kiếm YouTube
  const timKiemYouTube = async (e, tuKhoa) => {
    e?.preventDefault();
    const q = String(tuKhoa || ytQuery || '').trim();
    if (!q || searchingYt) return;
    if (tuKhoa) setYtQuery(tuKhoa);

    // Nếu người dùng dán liên kết video YouTube
    const idYt = idYoutube(q);
    if (idYt) {
      setYtResults([{
        videoId: idYt,
        title: 'Video YouTube (từ liên kết đã dán)',
        channelTitle: 'YouTube',
        thumbnail: `https://i.ytimg.com/vi/${idYt}/hqdefault.jpg`,
        publishedAt: 'Trực tiếp'
      }]);
      setSearchLoi('');
      setMediaTab('search');
      return;
    }

    setSearchingYt(true);
    setSearchLoi('');
    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(q)}`);
      const d = await res.json();
      if (d.ok && Array.isArray(d.items)) {
        if (d.items.length === 0) {
          setSearchLoi('Không tìm thấy video nào phù hợp với từ khóa này.');
        } else {
          setYtResults(d.items);
          setMediaTab('search');
        }
      } else {
        setSearchLoi(d.loi || 'Không thể tìm kiếm video lúc này.');
      }
    } catch {
      setSearchLoi('Lỗi kết nối khi tìm kiếm YouTube.');
    } finally {
      setSearchingYt(false);
    }
  };

  // Thao tác hàng đợi (enqueue, add_next, play_now, skip, remove)
  const hanhDongQueue = async (action, extra = {}) => {
    if (queueBusy) return;
    setQueueBusy(true);
    setLoiVideo('');
    try {
      const res = await fetch('/api/phong-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phongId: phong.id, action, ...extra })
      });
      const d = await res.json();
      if (!d.ok) {
        setLoiVideo(d.loi || 'Thao tác hàng đợi thất bại.');
      } else {
        if (action === 'enqueue') {
          setThongBaoVideo(`Đã thêm vào cuối hàng đợi: ${extra.title || 'Video'}`);
          setTimeout(() => setThongBaoVideo(''), 3500);
        } else if (action === 'add_next') {
          setThongBaoVideo(`Đã thêm phát kế tiếp: ${extra.title || 'Video'}`);
          setTimeout(() => setThongBaoVideo(''), 3500);
        } else if (action === 'play_now' || action === 'skip') {
          if (d.videoUrl) {
            setActiveVideoUrl(d.videoUrl);
            setProvider(getInitialProvider(d.videoUrl));
            if (d.state) {
              setWatchState(d.state);
              setLocalTime(0);
            }
            const newYtId = idYoutube(d.videoUrl);
            if (newYtId && ytPlayerRef.current && ytReadyRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
              try {
                ytPlayerRef.current.loadVideoById({ videoId: newYtId, startSeconds: 0 });
                ytPlayerRef.current.playVideo();
              } catch {}
            }
          }
          setThongBaoVideo('Đang chuyển video...');
          setTimeout(() => setThongBaoVideo(''), 3000);
        }
        await taiQueue();
      }
    } catch {
      setLoiVideo('Mất kết nối máy chủ.');
    } finally {
      setQueueBusy(false);
    }
  };

  const videoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytContainerId = `yt-player-${phong.id}`;
  const isSeekingRef = useRef(false);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    let c = {};
    try { c = phong?.cauHinh ? JSON.parse(phong.cauHinh) : {}; } catch { }
    const nextUrl = c.videoUrl || phong?.videoUrl || '';
    if (nextUrl && nextUrl !== activeVideoUrl) {
      setActiveVideoUrl(nextUrl);
      setProvider(getInitialProvider(nextUrl));
    }
  }, [phong?.cauHinh, phong?.videoUrl]);

  const videoUrl = activeVideoUrl;
  const ytId = videoUrl ? idYoutube(videoUrl) : null;
  const drvId = videoUrl ? idGoogleDrive(videoUrl) : null;
  const trucTiepUrl = videoUrl && !ytId && !drvId && laVideoTrucTiepFe(videoUrl) ? urlMediaFe(videoUrl) : '';

  const [ytApiFailed, setYtApiFailed] = useState(false);
  const [_ytPlayerReady, setYtPlayerReady] = useState(false);
  const ytReadyRef = useRef(false);
  const currentYtIdRef = useRef(null);

  // Khởi tạo và quản lý YouTube IFrame Player (hỗ trợ tái sử dụng loadVideoById & fallback trực tiếp)
  useEffect(() => {
    if (!ytId) return;
    let destroyed = false;
    let retryTimer = null;
    let fallbackTimer = null;
    let attempts = 0;

    // Nếu player đã tồn tại và đã sẵn sàng: chuyển video trực tiếp qua loadVideoById (tránh destroy DOM gây lỗi mất khung)
    if (ytPlayerRef.current && ytReadyRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      try {
        if (currentYtIdRef.current !== ytId) {
          currentYtIdRef.current = ytId;
          const startSec = Number(watchState.positionSeconds || 0);
          ytPlayerRef.current.loadVideoById({
            videoId: ytId,
            startSeconds: startSec
          });
          if (watchState.playing) {
            ytPlayerRef.current.playVideo();
          }
        }
        return;
      } catch (e) {
        console.warn('Lỗi khi loadVideoById, khởi tạo lại player:', e);
      }
    }

    currentYtIdRef.current = ytId;

    // Fallback: nếu sau 3.2s mà YouTube API chưa sẵn sàng hoặc bị chặn bởi adblock/mạng, kích hoạt iframe trực tiếp
    fallbackTimer = setTimeout(() => {
      if (!destroyed && !ytReadyRef.current) {
        console.warn('YouTube IFrame API không phản hồi sau 3.2s -> kích hoạt fallback iframe trực tiếp.');
        setYtApiFailed(true);
      }
    }, 3200);

    const khoiTaoPlayer = () => {
      if (destroyed) return;
      const el = document.getElementById(ytContainerId);
      if (!el) {
        if (attempts++ < 30) {
          retryTimer = setTimeout(khoiTaoPlayer, 80);
        } else {
          setYtApiFailed(true);
        }
        return;
      }

      // Destroy player cũ nếu có trước khi tạo mới trên container
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
        ytReadyRef.current = false;
        setYtPlayerReady(false);
      }

      try {
        if (!window.YT || !window.YT.Player) {
          if (attempts++ < 30) {
            retryTimer = setTimeout(khoiTaoPlayer, 100);
          } else {
            setYtApiFailed(true);
          }
          return;
        }

        const originUrl = typeof window !== 'undefined' ? window.location.origin : '';

        ytPlayerRef.current = new window.YT.Player(ytContainerId, {
          width: '100%',
          height: '100%',
          videoId: ytId,
          playerVars: {
            autoplay: watchState.playing ? 1 : 0,
            controls: canControl ? 1 : 0,
            disablekb: canControl ? 0 : 1,
            enablejsapi: 1,
            origin: originUrl,
            widget_referrer: typeof window !== 'undefined' ? window.location.href : '',
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            fs: 1
          },
          events: {
            onReady: (event) => {
              if (destroyed) return;
              if (fallbackTimer) clearTimeout(fallbackTimer);
              ytReadyRef.current = true;
              setYtPlayerReady(true);
              setYtApiFailed(false);

              if (event.target.getDuration) {
                const d = event.target.getDuration();
                if (d > 0) setDuration(d);
              }
              if (watchState.positionSeconds > 0 && event.target.seekTo) {
                try { event.target.seekTo(watchState.positionSeconds, true); } catch {}
              }
              if (watchState.playing && event.target.playVideo) {
                try { event.target.playVideo(); } catch {}
              }
            },
            onStateChange: (event) => {
              if (canControl && !dangGuiLenh && !isSeekingRef.current) {
                if (event.data === 1 && !watchState.playing) {
                  guiLenh('play', event.target.getCurrentTime());
                } else if (event.data === 2 && watchState.playing) {
                  guiLenh('pause', event.target.getCurrentTime());
                } else if (event.data === 0) {
                  // Video YouTube kết thúc -> tự động chuyển sang video tiếp theo trong hàng đợi
                  hanhDongQueue('skip');
                }
              }
            },
            onError: (err) => {
              console.warn('YouTube Player báo lỗi mã:', err?.data);
              // Nếu gặp lỗi cấm nhúng (101, 150) hoặc lỗi player, kích hoạt fallback trực tiếp
              setYtApiFailed(true);
            }
          }
        });
      } catch (err) {
        console.warn('Lỗi khởi tạo YT Player:', err);
        setYtApiFailed(true);
      }
    };

    napYouTubeIframeApi(() => {
      setTimeout(khoiTaoPlayer, 60);
    });

    return () => {
      destroyed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [ytId, phong.id, canControl]);

  // Áp dụng trạng thái đồng bộ từ server
  const apDungDongBo = (st, ctrl, prov) => {
    if (!st) return;
    const nowMs = Date.now();
    const _serverTimeMs = st.serverNow ? new Date(st.serverNow).getTime() : nowMs;
    const updateTimeMs = st.updatedAt ? new Date(String(st.updatedAt).replace(' ', 'T') + (String(st.updatedAt).includes('T') ? '' : 'Z')).getTime() : nowMs;
    const elapsedSec = Math.max(0, (nowMs - updateTimeMs) / 1000);

    let targetPos = Number(st.positionSeconds || 0);
    if (st.playing) {
      targetPos = Number(st.basePositionSeconds || 0) + (elapsedSec * (st.playbackRate || 1.0));
    }
    setLocalTime(Math.max(0, Math.floor(targetPos)));

    if (ctrl && isSeekingRef.current) return;

    if (prov === 'NATIVE_HTML5' && videoRef.current) {
      const v = videoRef.current;
      if (st.playing) {
        const drift = Math.abs(v.currentTime - targetPos);
        if (drift > 1.5) {
          v.currentTime = targetPos;
        }
        if (v.paused && (hasInteracted || hasInteractedRef.current || ctrl)) {
          v.play().catch(() => {});
        }
        if (v.playbackRate !== (st.playbackRate || 1.0)) {
          v.playbackRate = st.playbackRate || 1.0;
        }
      } else {
        if (!v.paused) v.pause();
        const drift = Math.abs(v.currentTime - st.positionSeconds);
        if (drift > 0.8) {
          v.currentTime = st.positionSeconds;
        }
      }
    } else if (prov === 'YOUTUBE') {
      if (ytPlayerRef.current && ytPlayerRef.current.getPlayerState) {
        const p = ytPlayerRef.current;
        try {
          const cur = p.getCurrentTime() || 0;
          const drift = Math.abs(cur - targetPos);
          if (st.playing) {
            if (drift > 1.5) {
              p.seekTo(targetPos, true);
            }
            const ps = p.getPlayerState();
            if (ps !== 1 && ps !== 3 && (hasInteracted || ctrl)) {
              p.playVideo();
            }
          } else {
            const ps = p.getPlayerState();
            if (ps === 1) p.pauseVideo();
            if (Math.abs(cur - st.positionSeconds) > 0.8) {
              p.seekTo(st.positionSeconds, true);
            }
          }
        } catch { }
      } else if (ytApiFailed) {
        const ifr = document.querySelector(`iframe#yt-fallback-${phong.id}`);
        if (ifr && ifr.contentWindow) {
          try {
            if (st.playing) {
              ifr.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            } else {
              ifr.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            }
          } catch {}
        }
      }
    }
  };

  // Poll trạng thái máy chủ mỗi 2.5s
  useEffect(() => {
    let active = true;
    const fetchWatch = async () => {
      try {
        const res = await fetch(`/api/phong-watch?phongId=${phong.id}`);
        const d = await res.json();
        if (!active) return;
        if (d.ok && d.state) {
          setWatchState(d.state);
          setCanControl(Boolean(d.canControl));
          if (d.caps) setWatchCaps(d.caps);
          setProvider(d.provider || 'UNSUPPORTED');
          if (d.phong?.videoUrl && d.phong.videoUrl !== activeVideoUrl) {
            setActiveVideoUrl(d.phong.videoUrl);
          }
          apDungDongBo(d.state, Boolean(d.canControl), d.provider || 'UNSUPPORTED');
        }
      } catch { }
    };

    fetchWatch();
    const timer = setInterval(khiHienThi(fetchWatch), 2500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [phong.id, hasInteracted]);

  // Timer tăng localTime đều đặn khi playing
  useEffect(() => {
    if (!watchState.playing) return;
    const tick = setInterval(() => {
      if (!isSeekingRef.current) {
        setLocalTime(t => t + 1);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [watchState.playing]);

  // Gửi lệnh điều khiển (Play / Pause / Seek)
  const guiLenh = async (action, customPos) => {
    if (dangGuiLenh) return;
    setDangGuiLenh(true);
    setLoi('');

    let pos = customPos;
    if (pos === undefined) {
      if (provider === 'NATIVE_HTML5' && videoRef.current) {
        pos = videoRef.current.currentTime;
      } else if (provider === 'YOUTUBE' && ytPlayerRef.current?.getCurrentTime) {
        pos = ytPlayerRef.current.getCurrentTime();
      } else {
        pos = localTime;
      }
    }
    pos = Math.max(0, Number((pos || 0).toFixed(2)));

    // Cập nhật lạc quan trên local player
    if (action === 'play') {
      if (provider === 'NATIVE_HTML5' && videoRef.current) videoRef.current.play().catch(() => {});
      else if (provider === 'YOUTUBE') {
        if (ytPlayerRef.current?.playVideo) {
          try { ytPlayerRef.current.playVideo(); } catch {}
        }
        if (ytApiFailed) {
          const ifr = document.querySelector(`iframe#yt-fallback-${phong.id}`);
          ifr?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }
      }
    } else if (action === 'pause') {
      if (provider === 'NATIVE_HTML5' && videoRef.current) videoRef.current.pause();
      else if (provider === 'YOUTUBE') {
        if (ytPlayerRef.current?.pauseVideo) {
          try { ytPlayerRef.current.pauseVideo(); } catch {}
        }
        if (ytApiFailed) {
          const ifr = document.querySelector(`iframe#yt-fallback-${phong.id}`);
          ifr?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
      }
    } else if (action === 'seek') {
      if (provider === 'NATIVE_HTML5' && videoRef.current) videoRef.current.currentTime = pos;
      else if (provider === 'YOUTUBE') {
        if (ytPlayerRef.current?.seekTo) {
          try { ytPlayerRef.current.seekTo(pos, true); } catch {}
        }
        if (ytApiFailed) {
          const ifr = document.querySelector(`iframe#yt-fallback-${phong.id}`);
          ifr?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [pos, true] }), '*');
        }
      }
    }

    try {
      const res = await fetch('/api/phong-watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phongId: phong.id,
          action,
          position: pos,
          expectedRevision: watchState.revision,
          playbackRate: watchState.playbackRate || 1.0
        })
      });
      const d = await res.json();
      if (d.ok && d.state) {
        setWatchState(d.state);
        setLocalTime(Math.floor(d.state.positionSeconds || pos));
      } else if (d.conflict && d.state) {
        setWatchState(d.state);
        apDungDongBo(d.state, canControl, provider);
      } else {
        setLoi(d.loi || 'Lỗi cập nhật phát video.');
      }
    } catch {
      setLoi('Mất kết nối máy chủ.');
    } finally {
      setDangGuiLenh(false);
    }
  };

  // Đồng bộ vị trí video hiện tại ra ngoài để chat gắn timestamp
  useEffect(() => {
    if (videoTimeRef) videoTimeRef.current = localTime;
  }, [localTime, videoTimeRef]);



  // Nhận yêu cầu tua từ StudyDock (bấm mốc video trong chat/ghi chú).
  // Có quyền điều khiển → phát lệnh seek chung; không → chỉ tua cục bộ player của mình.
  useEffect(() => {
    const onSeekReq = (e) => {
      if (e.detail?.phongId !== phong.id) return;
      const sec = Math.max(0, Number(e.detail.sec) || 0);
      if (canControl) {
        guiLenh('seek', sec);
      } else {
        if (provider === 'NATIVE_HTML5' && videoRef.current) videoRef.current.currentTime = sec;
        else if (provider === 'YOUTUBE' && ytPlayerRef.current?.seekTo) ytPlayerRef.current.seekTo(sec, true);
        setLocalTime(Math.floor(sec));
      }
    };
    window.addEventListener('sr-seek', onSeekReq);
    return () => window.removeEventListener('sr-seek', onSeekReq);
  }, [phong.id, canControl, provider, watchState.revision]);

  const handleStartViewing = () => {
    hasInteractedRef.current = true;
    setHasInteracted(true);
    if (provider === 'NATIVE_HTML5' && videoRef.current) {
      const v = videoRef.current;
      const p = v.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          if (!watchState.playing) {
            v.pause();
          }
        }).catch(() => {});
      }
    } else if (provider === 'YOUTUBE' && ytPlayerRef.current?.playVideo) {
      if (watchState.playing) ytPlayerRef.current.playVideo();
    }
  };

  return (
    <div className="flex flex-col gap-4 min-w-0 w-full">
      {/* Khung phát video chính — khung neon mờ đồng bộ hệ game arena */}
      <div className="relative w-full aspect-video bg-gradient-to-b from-[#05070b] to-black rounded-2xl overflow-hidden border border-[#00F2FE]/15 ring-1 ring-white/5 shadow-[0_0_60px_rgba(0,242,254,0.07),0_30px_60px_-15px_rgba(0,0,0,0.7)]">
        {/* Overlay Autoplay / Gesture cho người xem */}
        {!hasInteracted && !canControl && (provider === 'YOUTUBE' || provider === 'NATIVE_HTML5') && (
          <div className="absolute inset-0 z-20 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40 flex items-center justify-center text-2xl mb-3 shadow-[0_0_25px_rgba(0,242,254,0.35)] animate-pulse">
              🎬
            </div>
            <p className="text-sm font-black text-white mb-1">Xem Chung Cùng Phòng</p>
            <p className="text-xs text-slate-300 max-w-xs mb-4">
              Bấm nút bên dưới để cấp quyền âm thanh và cùng theo dõi timeline với chủ phòng.
            </p>
            <button
              id="btn-viewer-start-watch"
              type="button"
              onClick={handleStartViewing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#3B82F6] text-black font-black text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2">
              <span>▶</span>
              <span>Bắt đầu xem cùng phòng</span>
            </button>
          </div>
        )}

        {/* Video elements theo provider */}
        {ytId ? (
          ytApiFailed ? (
            <div key={`yt-fallback-wrap-${phong.id}-${ytId}`} className="w-full h-full relative">
              <iframe
                id={`yt-fallback-${phong.id}`}
                key={`yt-iframe-${ytId}`}
                src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=${watchState.playing ? 1 : 0}&start=${Math.floor(localTime || 0)}&enablejsapi=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&rel=0&modestbranding=1&playsinline=1`}
                title={phong.ten || 'YouTube Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur border border-white/10 text-[10px] text-slate-300 pointer-events-none flex items-center gap-1 shadow">
                <span>⚡</span>
                <span>Phát trực tiếp YouTube</span>
              </div>
            </div>
          ) : (
            <div key={`yt-wrap-${phong.id}`} className="w-full h-full flex items-center justify-center">
              <div id={ytContainerId} className="w-full h-full" />
            </div>
          )
        ) : drvId ? (
          <iframe
            src={`https://drive.google.com/file/d/${drvId}/preview`}
            title={phong.ten}
            allow="autoplay; fullscreen"
            allowFullScreen
            className="w-full h-full"
          />
        ) : trucTiepUrl ? (
          <video
            ref={videoRef}
            src={trucTiepUrl}
            playsInline
            data-testid="study-video-player"
            controls={canControl}
            className="w-full h-full object-contain"
            onLoadedMetadata={e => {
              if (e.target.duration > 0) setDuration(e.target.duration);
            }}
            onPlay={() => {
              if (canControl && !watchState.playing && !dangGuiLenh) {
                guiLenh('play', videoRef.current?.currentTime);
              }
            }}
            onPause={() => {
              if (canControl && watchState.playing && !dangGuiLenh) {
                guiLenh('pause', videoRef.current?.currentTime);
              }
            }}
            onEnded={() => {
              if (canControl) hanhDongQueue('skip');
            }}
            onSeeked={() => {
              if (!canControl || dangGuiLenh || isSeekingRef.current) return;
              const cur = videoRef.current?.currentTime;
              if (cur === undefined) return;
              // Chống vòng lặp: mọi gán currentTime nội bộ (optimistic seek, drift-correction
              // của apDungDongBo) đều bắn 'seeked'. Chỉ gửi lệnh khi vị trí lệch khỏi
              // vị trí server kỳ vọng >1.5s — tức người dùng thật sự tua qua thanh controls.
              const st = watchState;
              const updMs = st?.updatedAt ? new Date(String(st.updatedAt).replace(' ', 'T') + (String(st.updatedAt).includes('T') ? '' : 'Z')).getTime() : Date.now();
              const elapsed = Math.max(0, (Date.now() - updMs) / 1000);
              const kyVong = st?.playing
                ? Number(st.basePositionSeconds || 0) + elapsed * (st.playbackRate || 1)
                : Number(st?.positionSeconds || 0);
              if (Math.abs(cur - kyVong) > 1.5) guiLenh('seek', cur);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-xs text-slate-500 p-6 text-center">
            <span className="text-2xl mb-2">⚠️</span>
            <span>Link video không hỗ trợ phát trực tiếp hoặc không hợp lệ.</span>
          </div>
        )}
      </div>

      {/* Thông báo riêng cho Google Drive */}
      {drvId && (
        <div className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-300">
          <span className="text-sm">ℹ️</span>
          <span>Google Drive phát ở chế độ <strong>Xem độc lập</strong> (Google Drive không hỗ trợ API điều khiển từ xa).</span>
        </div>
      )}

      {/* Thanh điều khiển Host — ẩn khi fullscreen */}
      {!isRoomWide && (
      <div className="bg-gradient-to-b from-[#161b26] to-[#0f141d] border border-[#00F2FE]/10 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-3 shadow-xl">


        {/* Thanh công cụ phát chung (chỉ hiển thị cho Host / Teacher khi dùng provider có thể điều khiển) */}
        {canControl && (provider === 'NATIVE_HTML5' || provider === 'YOUTUBE') && (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-white/10">
            <button
              id="btn-host-watch-toggle"
              type="button"
              onClick={() => guiLenh(watchState.playing ? 'pause' : 'play')}
              disabled={dangGuiLenh}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-50 ${
                watchState.playing
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-gradient-to-r from-[#00F2FE] to-[#00c6ff] text-black shadow-[0_0_15px_rgba(0,242,254,0.35)] hover:brightness-110'
              }`}>
              <span>{watchState.playing ? '⏸' : '▶'}</span>
              <span>{watchState.playing ? 'Tạm Dừng Cả Phòng' : 'Phát Chung Cả Phòng'}</span>
            </button>

            <div className="flex-1 flex items-center gap-2.5 w-full">
              <span id="host-duration-label" className="text-[11px] font-mono text-slate-400 shrink-0">
                {dinhDangGiayPhut(localTime)}
              </span>
              <input
                id="host-seek-slider"
                type="range"
                min="0"
                max={duration > 0 ? duration : Math.max(localTime, 300)}
                step="1"
                value={localTime}
                onMouseDown={() => { isSeekingRef.current = true; }}
                onTouchStart={() => { isSeekingRef.current = true; }}
                onChange={e => setLocalTime(Number(e.target.value))}
                onMouseUp={e => {
                  isSeekingRef.current = false;
                  guiLenh('seek', Number(e.target.value));
                }}
                onTouchEnd={e => {
                  isSeekingRef.current = false;
                  guiLenh('seek', Number(e.target.value));
                }}
                className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00F2FE]"
              />
              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                {duration > 0 ? dinhDangGiayPhut(duration) : '--:--'}
              </span>
            </div>
          </div>
        )}

        {loi && <p className="text-xs text-rose-400">{loi}</p>}
        {phong.moTa && <p className="text-[11px] text-slate-400 leading-relaxed pt-1">{phong.moTa}</p>}

      </div>
      )}

      {/* ─── VÙNG 1: TRUNG TÂM CẤU HÌNH VIDEO & HÀNG ĐỢI YOUTUBE TRỰC TIẾP ─── */}
      {!isRoomWide && (
        <div id="vung1-youtube-studio" className="bg-gradient-to-b from-[#161b26] to-[#0f141d] border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-xl">
          {/* Header trung tâm */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00F2FE]/20 to-violet-500/20 text-[#00F2FE] border border-[#00F2FE]/30 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(0,242,254,0.25)]">
                🎬
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <span>Cấu hình Video & Hàng đợi YouTube</span>
                  {queueList.filter(q => q.trangThai === 'queued').length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 text-[10px] font-bold">
                      {queueList.filter(q => q.trangThai === 'queued').length} đang chờ
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400">Tìm kiếm video, đưa vào hàng chờ và chạy video khác đồng bộ cả phòng</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Tab selector */}
              <div className="flex items-center bg-[#0B0E14] p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  id="btn-media-tab-search"
                  onClick={() => setMediaTab('search')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                    mediaTab === 'search'
                      ? 'bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}>
                  <span>🔍</span>
                  <span>Tìm YouTube</span>
                </button>
                <button
                  type="button"
                  id="btn-media-tab-queue"
                  onClick={() => setMediaTab('queue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                    mediaTab === 'queue'
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}>
                  <span>📋</span>
                  <span>Hàng đợi ({queueList.filter(q => q.trangThai === 'queued').length})</span>
                </button>
              </div>

              {/* Toggle thu gọn */}
              <button
                type="button"
                id="btn-toggle-studio"
                onClick={() => setDaMoRongStudio(!daMoRongStudio)}
                title={daMoRongStudio ? 'Thu gọn' : 'Mở rộng'}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 flex items-center justify-center text-xs font-bold transition-all">
                {daMoRongStudio ? '▲' : '▼'}
              </button>
            </div>
          </div>

          {/* Toast thông báo / Lỗi */}
          {thongBaoVideo && (
            <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <span>✨</span>
              <span>{thongBaoVideo}</span>
            </div>
          )}
          {loiVideo && (
            <div className="px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <span>⚠️</span>
              <span>{loiVideo}</span>
            </div>
          )}

          {daMoRongStudio && (
            <>
              {/* TAB 1: TÌM KIẾM YOUTUBE & ĐỔI VIDEO */}
              {mediaTab === 'search' && (
                <div className="flex flex-col gap-3">
                  {/* Ô tìm kiếm / dán link đa năng */}
                  <form onSubmit={(e) => timKiemYouTube(e)} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                        <input
                          id="input-vung1-youtube-search"
                          type="text"
                          value={ytQuery}
                          onChange={e => setYtQuery(e.target.value)}
                          placeholder="Nhập từ khóa tìm kiếm YouTube (vd: lofi học bài...) hoặc dán link video..."
                          className="w-full bg-[#0B0E14] border border-white/10 focus:border-[#00F2FE]/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        id="btn-vung1-tim-kiem"
                        disabled={!ytQuery.trim() || searchingYt}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-md disabled:opacity-40 whitespace-nowrap flex items-center gap-1.5 cursor-pointer">
                        {searchingYt ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            <span>Đang tìm...</span>
                          </>
                        ) : (
                          <>
                            <span>🔍</span>
                            <span>Tìm kiếm</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Action buttons phụ khi ô input là 1 link video trực tiếp */}
                    {Boolean(ytQuery.trim().startsWith('http://') || ytQuery.trim().startsWith('https://') || ytQuery.includes('youtu')) && (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-[#0B0E14]/80 border border-[#00F2FE]/20 flex-wrap animate-fadeIn">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>🔗</span>
                          <span>Phát hiện liên kết video:</span>
                        </span>
                        <button
                          type="button"
                          id="btn-vung1-phat-ngay-link"
                          onClick={() => doiVideo(ytQuery.trim(), 'Video từ liên kết')}
                          disabled={dangDoiVideo}
                          className="px-2.5 py-1 rounded-lg bg-[#00F2FE] text-black text-xs font-black hover:bg-[#00e1ec] active:scale-95 shadow-sm">
                          ▶ Phát ngay cả phòng
                        </button>
                        <button
                          type="button"
                          id="btn-vung1-enqueue-link"
                          onClick={() => hanhDongQueue('enqueue', { videoUrl: ytQuery.trim(), title: 'Video từ liên kết' })}
                          disabled={queueBusy}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30">
                          + Thêm vào cuối hàng đợi
                        </button>
                        <button
                          type="button"
                          id="btn-vung1-add-next-link"
                          onClick={() => hanhDongQueue('add_next', { videoUrl: ytQuery.trim(), title: 'Video từ liên kết' })}
                          disabled={queueBusy}
                          className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-bold hover:bg-violet-500/30">
                          + Phát kế tiếp
                        </button>
                      </div>
                    )}
                  </form>

                  {/* Trạng thái lỗi tìm kiếm */}
                  {searchLoi && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                      <span>⚠️ {searchLoi}</span>
                      <button type="button" onClick={() => setSearchLoi('')} className="text-amber-400 font-bold hover:underline">Đóng</button>
                    </div>
                  )}

                  {/* Kết quả tìm kiếm YouTube */}
                  {ytResults.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <span>📺</span>
                          <span>Kết quả YouTube ({ytResults.length} video):</span>
                        </span>
                        <button
                          type="button"
                          id="btn-vung1-dong-ket-qua"
                          onClick={() => { setYtResults([]); setSearchLoi(''); }}
                          className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-bold">
                          ✕ Đóng kết quả
                        </button>
                      </div>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {ytResults.map((item, idx) => {
                          const vUrl = `https://www.youtube.com/watch?v=${item.videoId}`;
                          return (
                            <div
                              key={item.videoId || idx}
                              className="group bg-[#0B0E14] hover:bg-[#121721] border border-white/10 hover:border-[#00F2FE]/30 rounded-xl p-2.5 flex items-center gap-3 transition-all">
                              {/* Thumbnail */}
                              <div className="relative w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-white/5">
                                <img
                                  src={item.thumbnail}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  loading="lazy"
                                />
                                <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono text-white">
                                  YouTube
                                </span>
                              </div>

                              {/* Thông tin video */}
                              <div className="flex-1 min-w-0">
                                <h5 className="text-xs font-bold text-slate-200 line-clamp-2 group-hover:text-[#00F2FE] transition-colors" title={item.title}>
                                  {item.title}
                                </h5>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 truncate">
                                  <span>{item.channelTitle || 'Kênh YouTube'}</span>
                                  {item.publishedAt && <span>• {item.publishedAt}</span>}
                                </div>
                              </div>

                              {/* Bộ 3 nút thao tác */}
                              <div className="flex flex-col sm:flex-row items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  title="Chạy video này ngay lập tức cho cả phòng"
                                  onClick={() => doiVideo(vUrl, item.title)}
                                  disabled={dangDoiVideo}
                                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00F2FE] to-[#00c6ff] text-black font-black text-[11px] shadow-sm hover:brightness-110 active:scale-95 disabled:opacity-40 whitespace-nowrap">
                                  ▶ Phát ngay
                                </button>
                                <button
                                  type="button"
                                  title="Thêm vào cuối hàng đợi"
                                  onClick={() => hanhDongQueue('enqueue', { videoUrl: vUrl, title: item.title })}
                                  disabled={queueBusy}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 text-[11px] font-bold active:scale-95 disabled:opacity-40 whitespace-nowrap">
                                  + Hàng chờ
                                </button>
                                <button
                                  type="button"
                                  title="Thêm để phát kế tiếp sau video hiện tại"
                                  onClick={() => hanhDongQueue('add_next', { videoUrl: vUrl, title: item.title })}
                                  disabled={queueBusy}
                                  className="px-2.5 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 text-[10px] font-bold active:scale-95 disabled:opacity-40 whitespace-nowrap">
                                  + Kế tiếp
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Gợi ý từ khóa tìm kiếm nhanh khi chưa search */
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Gợi ý chủ đề học tập & thư giãn:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { label: '🎧 Lofi học tập', q: 'lofi hip hop radio beats to relax study to' },
                          { label: '🌧️ Tiếng mưa & Piano', q: 'rain sounds relaxing piano study focus' },
                          { label: '☕ Nhạc quán cà phê', q: 'coffee shop jazz piano chill study' },
                          { label: '📚 Tập trung ôn thi', q: 'study music alpha waves concentration' },
                          { label: '🔬 Thí nghiệm Hóa học', q: 'thí nghiệm hóa học thú vị' },
                        ].map((chip) => (
                          <button
                            key={chip.q}
                            type="button"
                            onClick={(e) => timKiemYouTube(e, chip.q)}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-[#00F2FE] border border-white/10 text-[11px] transition-all cursor-pointer">
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: QUẢN LÝ HÀNG ĐỢI (QUEUE) */}
              {mediaTab === 'queue' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>📋</span>
                      <span>Hàng đợi video ({queueList.filter(q => q.trangThai === 'queued').length} chờ)</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {queueList.some(q => q.trangThai === 'queued') && (
                        <button
                          type="button"
                          id="btn-vung1-queue-skip"
                          onClick={() => hanhDongQueue('skip')}
                          disabled={queueBusy}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/25 disabled:opacity-40 flex items-center gap-1 cursor-pointer">
                          <span>⏭</span>
                          <span>Bỏ qua / Bài tiếp</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={taiQueue}
                        title="Làm mới hàng đợi"
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs border border-white/10 cursor-pointer">
                        🔄
                      </button>
                    </div>
                  </div>

                  {/* Thêm link nhanh vào queue */}
                  <QueueInput
                    onAdd={(u, t) => hanhDongQueue('enqueue', { videoUrl: u, title: t })}
                    onAddNext={(u, t) => hanhDongQueue('add_next', { videoUrl: u, title: t })}
                  />

                  {/* Danh sách video trong hàng đợi */}
                  {queueList.length === 0 ? (
                    <div className="p-5 rounded-xl bg-[#0B0E14] border border-white/5 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5">
                      <span className="text-2xl">📋</span>
                      <p className="font-bold text-slate-300">Hàng đợi hiện đang trống</p>
                      <p className="text-[11px] text-slate-500 max-w-sm">
                        Chuyển sang tab <strong>Tìm YouTube</strong> hoặc dán liên kết vào ô trên để phát lần lượt các bài học & video giải trí.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {queueList.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className={`flex items-center gap-2.5 bg-[#0B0E14] border rounded-xl p-2 transition-all ${
                            q.trangThai === 'playing'
                              ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(52,211,153,0.15)] bg-emerald-950/20'
                              : 'border-white/5 hover:border-white/15'
                          }`}>
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                              q.trangThai === 'playing'
                                ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                                : 'bg-white/10 text-slate-400'
                            }`}>
                            {q.trangThai === 'playing' ? '▶' : idx + 1}
                          </span>

                          {q.thumb && (
                            <img src={q.thumb} alt="" className="w-12 h-7 rounded-md object-cover shrink-0 border border-white/10" loading="lazy" />
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-200 font-bold truncate">
                              {q.title || q.videoUrl}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {q.trangThai === 'playing' ? (
                                <span className="text-emerald-400 font-bold">● Đang phát</span>
                              ) : (
                                <span>Thêm bởi: {q.addedBy || 'Thành viên'}</span>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {q.trangThai === 'queued' && (
                              <button
                                type="button"
                                title="Phát video này ngay"
                                onClick={() => hanhDongQueue('play_now', { id: q.id })}
                                disabled={queueBusy}
                                className="px-2.5 py-1 rounded-lg bg-[#00F2FE]/20 text-[#00F2FE] hover:bg-[#00F2FE]/30 text-xs font-black active:scale-95 cursor-pointer">
                                ▶ Phát
                              </button>
                            )}
                            {q.trangThai === 'queued' && (
                              <button
                                type="button"
                                title="Xóa khỏi hàng đợi"
                                onClick={() => hanhDongQueue('remove', { id: q.id })}
                                disabled={queueBusy}
                                className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-xs font-black flex items-center justify-center active:scale-95 cursor-pointer">
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>

  );
}


// ─── Component: Campus Focus Room (Study Café & Pomodoro Session) ─────────────
export function CampusFocusRoom({
  phong,
  phongMinhKhoa,
  auth,
  dongPhongHienTai,
  soNguoi,
  isFocusMode,
  setIsFocusMode
}) {
  const [focusState, setFocusState] = useState({
    phase: 'focus',
    status: 'paused',
    durationSeconds: 1500,
    remainingSeconds: 1500,
    preset: '25_5',
    revision: 1,
    canControl: false,
    updatedAt: null,
    serverNow: null
  });
  const [localRemaining, setLocalRemaining] = useState(1500);
  const [dangGuiLenh, setDangGuiLenh] = useState(false);
  const [loi, setLoi] = useState('');

  // Audio state (Ambient playback)
  let cauHinh = {};
  try { cauHinh = phong.cauHinh ? JSON.parse(phong.cauHinh) : {}; } catch { /* bỏ qua */ }
  const nhacUrl = cauHinh.nhacUrl ? urlMediaFe(cauHinh.nhacUrl) : '';
  const audioRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.5);
  const [audioMuted, setAudioMuted] = useState(false);
  const [hasInteractedAudio, setHasInteractedAudio] = useState(false);

  // Authorization
  const [canControl, setCanControl] = useState(Boolean(auth.user?.isTeacher || phong?.canControl || phong?.laChuPhong));
  const isHost = canControl;

  // Sync state reconciliation helper
  const apDungFocusState = (st) => {
    if (!st) return;
    setFocusState(st);
    const rem = Number(st.remainingSeconds ?? 1500);
    setLocalRemaining(rem);
  };

  // 1. Polling Focus State (every 3000ms) with visibility reconciliation & strict cleanup
  useEffect(() => {
    let active = true;

    const fetchFocus = async () => {
      try {
        const res = await fetch(`/api/phong-focus?phongId=${encodeURIComponent(phong.id)}`);
        if (!res.ok) return;
        const d = await res.json();
        if (active && d.ok && d.state) {
          if (typeof d.canControl === 'boolean') {
            setCanControl(d.canControl);
          }
          apDungFocusState(d.state);
        }
      } catch {
        /* bỏ qua khi hủy kết nối */
      }
    };

    fetchFocus();
    const timer = setInterval(fetchFocus, 3000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active) {
        fetchFocus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [phong.id]);

  // 2. Local Countdown Tick (every 1000ms when status === 'running')
  useEffect(() => {
    if (focusState.status !== 'running') return;
    const tick = setInterval(() => {
      setLocalRemaining(r => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [focusState.status]);

  // 3. Command dispatcher with optimistic concurrency (revision check & conflict handling)
  const guiLenh = async (action, extraPayload = {}) => {
    if (dangGuiLenh) return;
    setDangGuiLenh(true);
    setLoi('');

    try {
      const res = await fetch('/api/phong-focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phongId: phong.id,
          action,
          expectedRevision: focusState.revision,
          ...extraPayload
        })
      });

      const d = await res.json();
      if (d.ok && d.state) {
        apDungFocusState(d.state);
      } else if (res.status === 409 && d.state) {
        // Concurrency conflict: adopt latest server state
        apDungFocusState(d.state);
        setLoi('Đã đồng bộ lại phiên theo máy chủ.');
      } else {
        setLoi(d.loi || 'Không thể cập nhật trạng thái phòng học tập.');
      }
    } catch {
      setLoi('Lỗi kết nối máy chủ.');
    } finally {
      setDangGuiLenh(false);
    }
  };

  // 4. Ambient Audio Controls
  const batAmThanh = () => {
    setHasInteractedAudio(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setAudioPlaying(true);
      }).catch(err => {
        console.warn('Autoplay blocked or audio load error:', err);
      });
    }
  };

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      batAmThanh();
    }
  };

  const toggleAudioMute = () => {
    if (!audioRef.current) return;
    const newMute = !audioMuted;
    audioRef.current.muted = newMute;
    setAudioMuted(newMute);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setAudioVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val > 0 && audioMuted) {
        audioRef.current.muted = false;
        setAudioMuted(false);
      }
    }
  };

  const isBreak = focusState.phase === 'break';
  const isRunning = focusState.status === 'running';
  const duration = focusState.durationSeconds || (isBreak ? 300 : 1500);
  const progressPercent = Math.min(100, Math.max(0, ((duration - localRemaining) / duration) * 100));

  return (
    <div className="flex flex-col gap-4 min-w-0 w-full">
      {/* Hidden Audio element for ambient soundtrack */}
      {nhacUrl && (
        <audio
          ref={audioRef}
          src={nhacUrl}
          loop
          preload="none"
          onEnded={() => setAudioPlaying(false)}
          onError={() => setAudioPlaying(false)}
        />
      )}

      {/* Header bar: Presence, Host badge, Focus Mode toggle, Close Room */}
      <div className="bg-[#151A23] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${phong.phamVi === 'truong' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>
            {phong.phamVi === 'truong' ? '🌐 Toàn trường' : `🔒 Lớp ${phong.lopTen || ''}`}
          </span>
          <span id="focus-host-badge" className="text-[11px] text-slate-400">
            Chủ phòng: <strong className="text-slate-200">{phong.chuPhongTen}</strong>
          </span>
          <span id="focus-room-presence" className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/20 font-semibold">
            👥 {soNguoi || 1} người đang cùng tập trung
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {isFocusMode && (
            <span id="focus-mode-active-indicator" className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 animate-pulse">
              🎯 Đang bật Focus Mode
            </span>
          )}
          <button
            id="btn-focus-mode-toggle"
            type="button"
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${isFocusMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'}`}>
            <span>🎯</span>
            <span>{isFocusMode ? '↩ Thoát Focus Mode' : 'Focus Mode'}</span>
          </button>

          {canControl && phong.chuPhongKhoa !== 'he-thong' && (
            <button
              type="button"
              onClick={dongPhongHienTai}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 transition-all">
              Đóng phòng
            </button>
          )}
        </div>
      </div>

      {/* Main Focus Centerpiece Card */}
      <div className={`relative overflow-hidden rounded-3xl border transition-all p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl ${isBreak ? 'bg-gradient-to-b from-[#1E1710] to-[#13110E] border-amber-500/30' : 'bg-gradient-to-b from-[#0F1E28] to-[#0A1219] border-[#00F2FE]/30'}`}>
        {/* Glow backdrop accent */}
        <div className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${isBreak ? 'bg-amber-500' : 'bg-[#00F2FE]'}`} />
        <div className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${isBreak ? 'bg-orange-500' : 'bg-indigo-500'}`} />

        {/* Phase & Status Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6 z-10">
          <span
            id="focus-phase-badge"
            className={`px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-sm ${isBreak ? 'bg-amber-500/15 text-amber-300 border-amber-500/40' : 'bg-[#00F2FE]/15 text-[#00F2FE] border-[#00F2FE]/40'}`}>
            {isBreak ? '☕ Giờ Nghỉ Ngơi (Break)' : '🍅 Phiên Tập Trung (Focus)'}
          </span>

          <span
            id="focus-status-badge"
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${isRunning ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            <span>{isRunning ? 'Đang đếm' : 'Tạm dừng'}</span>
          </span>

          <button
            id="btn-focus-preset-toggle"
            type="button"
            disabled={!canControl || dangGuiLenh}
            onClick={() => canControl && guiLenh('set_preset', { preset: focusState.preset === '50_10' ? '25_5' : '50_10' })}
            title={canControl ? 'Bấm để đổi chu kỳ Pomodoro' : 'Chu kỳ Pomodoro hiện tại'}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all ${canControl ? 'hover:scale-105 active:scale-95 cursor-pointer bg-white/10 text-white border-white/20' : 'cursor-default bg-white/5 text-slate-400 border-white/10'}`}>
            ⚙️ {focusState.preset === '50_10' ? '50 / 10 phút' : '25 / 5 phút'}
          </button>
        </div>

        {/* Massive Timer Display */}
        <div className="my-2 sm:my-4 z-10">
          <span
            id="focus-timer-display"
            className={`font-mono text-6xl sm:text-8xl font-black tracking-widest block transition-all select-none ${isBreak ? 'text-amber-300 drop-shadow-[0_0_35px_rgba(245,158,11,0.35)]' : 'text-[#00F2FE] drop-shadow-[0_0_35px_rgba(0,242,254,0.35)]'}`}>
            {dinhDangGiayPhut(localRemaining)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md h-2 bg-black/40 rounded-full overflow-hidden border border-white/10 my-4 z-10">
          <div
            className={`h-full transition-all duration-1000 ${isBreak ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-[#00F2FE] to-[#3B82F6]'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Control Buttons for Host/Teacher */}
        {canControl ? (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 z-10">
            {!isRunning ? (
              <button
                id="btn-focus-start"
                type="button"
                disabled={dangGuiLenh}
                onClick={() => guiLenh('start')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-black font-black text-sm shadow-[0_0_20px_rgba(52,211,153,0.3)] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
                <span>▶</span>
                <span>Bắt đầu</span>
              </button>
            ) : (
              <button
                id="btn-focus-pause"
                type="button"
                disabled={dangGuiLenh}
                onClick={() => guiLenh('pause')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-sm shadow-[0_0_20px_rgba(251,191,36,0.3)] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
                <span>⏸</span>
                <span>Tạm dừng</span>
              </button>
            )}

            <button
              id="btn-focus-reset"
              type="button"
              disabled={dangGuiLenh}
              onClick={() => guiLenh('reset')}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-sm font-bold border border-white/15 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50">
              <span>🔄</span>
              <span>Đặt lại</span>
            </button>

            {isBreak ? (
              <button
                id="btn-focus-start-focus"
                type="button"
                disabled={dangGuiLenh}
                onClick={() => guiLenh('start_focus')}
                className="px-4 py-3 rounded-2xl bg-[#00F2FE]/20 hover:bg-[#00F2FE]/30 text-[#00F2FE] text-sm font-bold border border-[#00F2FE]/40 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50">
                <span>🎯</span>
                <span>Vào Tập trung</span>
              </button>
            ) : (
              <button
                id="btn-focus-start-break"
                type="button"
                disabled={dangGuiLenh}
                onClick={() => guiLenh('start_break')}
                className="px-4 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-bold border border-amber-500/40 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50">
                <span>☕</span>
                <span>Nghỉ ngơi</span>
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 mt-3 z-10">
            ⏳ Đồng hồ Pomodoro do chủ phòng điều phối — hãy tập trung hết mình vào công việc/học tập nhé!
          </p>
        )}

        {loi && <p className="text-xs text-rose-400 mt-4 z-10">{loi}</p>}
      </div>

      {/* Ambient Audio Player Card */}
      {nhacUrl ? (
        <div className="bg-[#151A23] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 border transition-all ${audioPlaying ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40 shadow-[0_0_15px_rgba(139,92,246,0.3)] animate-pulse' : 'bg-white/5 text-slate-400 border-white/10'}`}>
              🎧
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Âm thanh nền Ambient</p>
              <p className="text-[11px] text-slate-400 truncate">
                {audioPlaying ? 'Đang phát không gian học tập' : 'Âm thanh cục bộ theo thiết bị'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            {!hasInteractedAudio && !audioPlaying && (
              <button
                id="btn-start-focus-audio"
                type="button"
                onClick={batAmThanh}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white text-xs font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shrink-0">
                <span>🔊</span>
                <span>Bật âm thanh tập trung</span>
              </button>
            )}

            <button
              id="focus-audio-toggle"
              type="button"
              onClick={toggleAudioPlay}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${audioPlaying ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40' : 'bg-white/5 text-slate-300 border-white/10'}`}>
              <span>{audioPlaying ? '⏸ Tạm dừng' : '▶ Phát tiếp'}</span>
            </button>

            <button
              type="button"
              onClick={toggleAudioMute}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs transition-all">
              {audioMuted || audioVolume === 0 ? '🔇' : '🔉'}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioMuted ? 0 : audioVolume}
              onChange={handleVolumeChange}
              className="w-24 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
              title="Âm lượng nhạc nền"
            />
          </div>
        </div>
      ) : (
        <div className="bg-[#151A23] border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-[11px] text-slate-500">
            ☕ Phòng ở chế độ tĩnh lặng (chưa gắn link âm thanh nền) — Chuyên tâm tối đa vào bài vở.
          </p>
        </div>
      )}

      {phong.moTa && (
        <p className="text-[11px] text-slate-400 px-2 leading-relaxed">
          {phong.moTa}
        </p>
      )}
    </div>
  );
}
