// GEN TU src/features/study.jsx — KHONG SUA TAY
const { useState, useEffect, useRef } = React;
import { dinhDangGiayPhut, idGoogleDrive, idYoutube, laVideoTrucTiepFe, napYouTubeIframeApi, urlMediaFe } from "../lib/helpers.js";
const khiHienThi = (fn) => () => {
  if (document.visibilityState === "visible") fn();
};
export function QueueInput({ onAdd, onAddNext }) {
  const [v, setV] = React.useState("");
  const ok = v.trim().length > 0;
  return /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "input-queue-add",
      type: "url",
      value: v,
      onChange: (e) => setV(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter" && ok) {
          e.preventDefault();
          onAdd(v.trim());
          setV("");
        }
      },
      placeholder: "Th\xEAm link video v\xE0o h\xE0ng \u0111\u1EE3i\u2026",
      className: "flex-1 bg-[#0B0E14] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/50"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-queue-add-next",
      disabled: !ok,
      onClick: () => {
        onAddNext(v.trim());
        setV("");
      },
      className: "px-2.5 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/30 text-[10px] font-bold hover:bg-violet-500/25 disabled:opacity-30 whitespace-nowrap"
    },
    "+Ph\xE1t k\u1EBF"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-queue-enqueue",
      disabled: !ok,
      onClick: () => {
        onAdd(v.trim());
        setV("");
      },
      className: "px-2.5 py-1.5 rounded-lg bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 text-[10px] font-bold hover:bg-[#00F2FE]/25 disabled:opacity-30 whitespace-nowrap"
    },
    "+Cu\u1ED1i h\xE0ng"
  ));
}
export function StudyDock({
  phong,
  phongMinhKhoa,
  auth,
  phongChat = [],
  onSendPhongChat,
  onXoaTinPhong,
  myCaps = {},
  isStaff = false,
  vaiTroPhong = "member",
  thanhVien = [],
  policies = null,
  grants = [],
  videoTimeRef,
  seekVideo,
  hanhDongPhong,
  canControl: _canControl = false,
  dongPhongHienTai: _dongPhongHienTai,
  isRoomWide = false
}) {
  const [dockTab, setDockTab] = React.useState("chat");
  const [showEmoji, setShowEmoji] = React.useState(false);
  const coQuyen = (cap) => myCaps[cap] !== false;
  const layViTriVideo = () => Math.floor(videoTimeRef?.current || 0) || null;
  const yeuCauTua = (sec) => {
    if (sec == null || !(sec >= 0)) return;
    if (seekVideo) {
      seekVideo(Number(sec), myCaps.video_control === true);
      return;
    }
    window.dispatchEvent(new CustomEvent("sr-seek", { detail: { phongId: phong?.id, sec: Number(sec) } }));
  };
  const [chatInput, setChatInput] = React.useState("");
  const [chatSending, setChatSending] = React.useState(false);
  const chatComposingRef = React.useRef(false);
  const chatEndRef = React.useRef(null);
  React.useEffect(() => {
    if (dockTab === "chat" && chatEndRef.current) {
      const p = chatEndRef.current.parentElement;
      if (p && p.scrollHeight > p.clientHeight) {
        p.scrollTo({ top: p.scrollHeight, behavior: "smooth" });
      }
    }
  }, [phongChat.length, dockTab]);
  const handleSendRoomChat = (e) => {
    e?.preventDefault();
    const txt = chatInput.trim();
    if (!txt || chatSending) return;
    setChatInput("");
    setChatSending(true);
    if (onSendPhongChat) {
      Promise.resolve(onSendPhongChat(txt)).catch(() => {
        setChatInput((cur) => cur ? cur : txt);
      }).finally(() => {
        setChatSending(false);
      });
    } else {
      setChatSending(false);
    }
  };
  const [notesList, setNotesList] = React.useState([]);
  const [noteInput, setNoteInput] = React.useState("");
  const [noteWithTime, setNoteWithTime] = React.useState(true);
  const [notesCanWrite, setNotesCanWrite] = React.useState(true);
  const [notesNotice, setNotesNotice] = React.useState("");
  const notesVersionRef = React.useRef(0);
  const noteComposingRef = React.useRef(false);
  React.useEffect(() => {
    if (dockTab !== "notes") return;
    let active = true;
    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/phong-collab?phongId=${phong.id}&resource=notes`);
        const d = await res.json();
        if (active && d.ok) {
          setNotesList(Array.isArray(d.payload?.notes) ? d.payload.notes : []);
          notesVersionRef.current = d.version || 0;
          setNotesCanWrite(d.canWrite !== false);
        } else if (active && d.code === "capability_off") {
          setNotesCanWrite(false);
        }
      } catch {
      }
    };
    fetchNotes();
    const interval = setInterval(khiHienThi(fetchNotes), 3e3);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [phong.id, dockTab]);
  const themGhiChu = async () => {
    const text = noteInput.trim();
    if (!text) return;
    setNotesNotice("");
    try {
      const res = await fetch("/api/phong-collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phongId: phong.id,
          resource: "notes",
          payload: { text, videoTimeSec: noteWithTime ? layViTriVideo() : null }
        })
      });
      const d = await res.json();
      if (d.ok) {
        setNoteInput("");
        setNotesList((prev) => [...prev, { id: d.id, ten: auth.user?.ten || "B\u1EA1n", noiDung: text, videoTimeSec: noteWithTime ? layViTriVideo() : null, cuaToi: 1 }]);
      } else {
        setNotesNotice(d.loi || "Kh\xF4ng l\u01B0u \u0111\u01B0\u1EE3c ghi ch\xFA.");
      }
    } catch {
      setNotesNotice("L\u1ED7i k\u1EBFt n\u1ED1i.");
    }
  };
  const xoaGhiChu = async (id) => {
    try {
      const res = await fetch("/api/phong-collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phongId: phong.id, resource: "notes", action: "xoa_note", id })
      });
      const d = await res.json();
      if (d.ok) setNotesList((prev) => prev.filter((n) => n.id !== id));
    } catch {
    }
  };
  const canvasRef = React.useRef(null);
  const [wbStrokes, setWbStrokes] = React.useState([]);
  const [wbColor, setWbColor] = React.useState("#00F2FE");
  const [wbWidth, setWbWidth] = React.useState(3);
  const [wbTool, setWbTool] = React.useState("pen");
  const isDrawingRef = React.useRef(false);
  const currentStrokeRef = React.useRef(null);
  const wbVersionRef = React.useRef(0);
  const redrawCanvas = React.useCallback((strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach((s) => {
      if (!s.points || s.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = s.tool === "eraser" ? "#0B0E14" : s.color || "#00F2FE";
      ctx.lineWidth = s.width || 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    });
  }, []);
  const [wbCanWrite, setWbCanWrite] = React.useState(true);
  const apDungOp = (strokes, op) => {
    if (op.type === "clear") return [];
    if (op.type === "stroke" && op.stroke) return [...strokes, op.stroke];
    return strokes;
  };
  React.useEffect(() => {
    if (dockTab !== "whiteboard") return;
    let active = true;
    const fetchWb = async () => {
      try {
        const res = await fetch(`/api/phong-collab?phongId=${phong.id}&resource=whiteboard&sauId=${wbVersionRef.current}`);
        const d = await res.json();
        if (active && d.ok) {
          const ops = Array.isArray(d.payload?.ops) ? d.payload.ops : [];
          if (ops.length) {
            if (ops.some((o) => o.type === "clear")) {
              const full = await fetch(`/api/phong-collab?phongId=${phong.id}&resource=whiteboard&sauId=0`);
              const df = await full.json();
              if (active && df.ok) {
                const allOps = Array.isArray(df.payload?.ops) ? df.payload.ops : [];
                const rebuilt = allOps.reduce(apDungOp, []);
                setWbStrokes(rebuilt);
                redrawCanvas(rebuilt);
              }
            } else {
              setWbStrokes((prev) => {
                const next = ops.reduce(apDungOp, prev);
                redrawCanvas(next);
                return next;
              });
            }
          }
          wbVersionRef.current = d.version || 0;
          setWbCanWrite(d.canWrite !== false);
        } else if (active && d.code === "capability_off") {
          setWbCanWrite(false);
        }
      } catch {
      }
    };
    fetchWb();
    const interval = setInterval(khiHienThi(fetchWb), 3e3);
    return () => {
      active = false;
      clearInterval(interval);
    };
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
      width: wbTool === "eraser" ? 16 : wbWidth,
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
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.strokeStyle = currentStrokeRef.current.tool === "eraser" ? "#0B0E14" : currentStrokeRef.current.color;
    ctx.lineWidth = currentStrokeRef.current.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
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
        const res = await fetch("/api/phong-collab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phongId: phong.id,
            resource: "whiteboard",
            payload: { type: "stroke", stroke }
          })
        });
        const d = await res.json();
        if (d.ok && d.id) wbVersionRef.current = Math.max(wbVersionRef.current, d.id);
      } catch {
      }
    }
  };
  const clearWhiteboard = async () => {
    if (!confirm("B\u1EA1n c\xF3 ch\u1EAFc mu\u1ED1n x\xF3a s\u1EA1ch b\u1EA3ng v\u1EBD? (ch\u1EC9 qu\u1EA3n tr\u1ECB ph\xF2ng)")) return;
    try {
      const res = await fetch("/api/phong-collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phongId: phong.id,
          resource: "whiteboard",
          payload: { type: "clear" }
        })
      });
      const d = await res.json();
      if (d.ok) {
        setWbStrokes([]);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    } catch {
    }
  };
  const COLS = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const [sheetCells, setSheetCells] = React.useState({});
  const [sheetCanWrite, setSheetCanWrite] = React.useState(true);
  const sheetSaveTimersRef = React.useRef({});
  const sheetFocusedCellRef = React.useRef(null);
  const sheetPollRef = React.useRef(0);
  React.useEffect(() => {
    if (dockTab !== "sheet") return;
    let active = true;
    const fetchSheet = async () => {
      try {
        const res = await fetch(`/api/phong-collab?phongId=${phong.id}&resource=sheet`);
        const d = await res.json();
        if (active && d.ok) {
          const incoming = d.payload?.cells || {};
          setSheetCells((prev) => {
            const merged = { ...incoming };
            const dangGo = sheetFocusedCellRef.current;
            if (dangGo && prev[dangGo] !== void 0) merged[dangGo] = prev[dangGo];
            return merged;
          });
          setSheetCanWrite(d.canWrite !== false);
        } else if (active && d.code === "capability_off") {
          setSheetCanWrite(false);
        }
      } catch {
      }
    };
    fetchSheet();
    const interval = setInterval(khiHienThi(fetchSheet), 3e3);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [phong.id, dockTab]);
  const handleCellChange = (cellKey, val) => {
    setSheetCells((prev) => ({ ...prev, [cellKey]: val }));
    const timers = sheetSaveTimersRef.current;
    if (timers[cellKey]) clearTimeout(timers[cellKey]);
    timers[cellKey] = setTimeout(async () => {
      try {
        await fetch("/api/phong-collab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phongId: phong.id,
            resource: "sheet",
            payload: { cell: cellKey, value: val }
          })
        });
      } catch {
      }
    }, 800);
  };
  const [voiceJoined, setVoiceJoined] = React.useState(false);
  const [micMuted, setMicMuted] = React.useState(true);
  const [voiceState, setVoiceState] = React.useState("disconnected");
  const [voiceNotice, setVoiceNotice] = React.useState("");
  const [voicePair, setVoicePair] = React.useState(null);
  const [voiceRequested, setVoiceRequested] = React.useState(false);
  const [yeuCauVoice, setYeuCauVoice] = React.useState([]);
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
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
    setMicMuted(true);
  };
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
          if (sig.signalType === "offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
            for (const c of pendingCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {
              });
            }
            pendingCandidatesRef.current = [];
            const ans = await pc.createAnswer();
            await pc.setLocalDescription(ans);
            await fetch("/api/phong-collab", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phongId: phong.id, action: "voice_signal", signalType: "answer", payload: ans })
            });
          } else if (sig.signalType === "answer") {
            if (pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
              for (const c of pendingCandidatesRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {
                });
              }
              pendingCandidatesRef.current = [];
            }
          } else if (sig.signalType === "candidate") {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(sig.payload)).catch(() => {
              });
            } else {
              pendingCandidatesRef.current.push(sig.payload);
            }
          } else if (sig.signalType === "leave") {
            setVoiceNotice("Ng\u01B0\u1EDDi kia \u0111\xE3 ng\u1EAFt voice.");
            setVoiceState("disconnected");
            dungKetNoiVoice();
            setVoiceJoined(false);
            voiceSlotRef.current = null;
          }
        } catch {
        }
      }
    } catch {
    }
  };
  React.useEffect(() => {
    if (dockTab !== "voice" && !voiceJoined) return;
    pollVoice();
    voicePollTimerRef.current = setInterval(pollVoice, 1500);
    return () => {
      if (voicePollTimerRef.current) clearInterval(voicePollTimerRef.current);
    };
  }, [phong.id, dockTab, voiceJoined]);
  const joinVoice = async () => {
    setVoiceNotice("\u0110ang xin ch\u1ED7 trong c\u1EB7p voice...");
    setVoiceState("connecting");
    try {
      const joinRes = await fetch("/api/phong-collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phongId: phong.id, action: "voice_join" })
      });
      const joinData = await joinRes.json();
      if (!joinData.ok) {
        if (joinData.code === "grant_required") {
          setVoiceNotice('B\u1EA1n c\u1EA7n \u0111\u01B0\u1EE3c c\u1EA5p quy\u1EC1n voice \u2014 h\xE3y b\u1EA5m "Xin quy\u1EC1n voice".');
        } else {
          setVoiceNotice(joinData.loi || "Kh\xF4ng th\u1EC3 tham gia voice.");
        }
        setVoiceState("disconnected");
        return;
      }
      voiceSlotRef.current = joinData.slot;
      setVoiceJoined(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
        localStreamRef.current = stream;
      } catch {
        setVoiceNotice("Kh\xF4ng xin \u0111\u01B0\u1EE3c micro \u2014 b\u1EA1n ch\u1EC9 nghe \u0111\u01B0\u1EE3c, kh\xF4ng n\xF3i \u0111\u01B0\u1EE3c.");
      }
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      pcRef.current = pc;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
      }
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch("/api/phong-collab", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phongId: phong.id,
              action: "voice_signal",
              signalType: "candidate",
              payload: event.candidate
            })
          }).catch(() => {
          });
        }
      };
      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {
          });
        }
      };
      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "connected") {
          setVoiceState("connected");
          setVoiceNotice("\u2713 \u0110ang k\u1EBFt n\u1ED1i tho\u1EA1i 1-1 tr\u1EF1c ti\u1EBFp.");
        } else if (s === "failed" || s === "disconnected") {
          setVoiceState("disconnected");
          setVoiceNotice("M\u1EA5t k\u1EBFt n\u1ED1i tho\u1EA1i (m\u1EA1ng ch\u1EB7n P2P n\u1EBFu kh\xF4ng c\xF3 TURN).");
        }
      };
      if (joinData.slot === "b") {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await fetch("/api/phong-collab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phongId: phong.id, action: "voice_signal", signalType: "offer", payload: offer })
        });
        setVoiceNotice("\u0110\xE3 v\xE0o c\u1EB7p \u2014 \u0111ang b\u1EAFt tay v\u1EDBi " + (voicePair?.aTen || "ng\u01B0\u1EDDi kia") + "\u2026");
      } else {
        setVoiceNotice("B\u1EA1n l\xE0 ng\u01B0\u1EDDi \u0111\u1EA7u ti\xEAn \u2014 ch\u1EDD th\xEAm 1 ng\u01B0\u1EDDi v\xE0o voice\u2026");
      }
    } catch (err) {
      setVoiceNotice("L\u1ED7i k\u1EBFt n\u1ED1i voice: " + err.message);
      setVoiceState("disconnected");
    }
  };
  const xinQuyenVoice = async () => {
    try {
      const res = await fetch("/api/phong-collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phongId: phong.id, action: "voice_request" })
      });
      const d = await res.json();
      if (d.ok && d.granted) {
        setVoiceNotice("B\u1EA1n \u0111\xE3 \u0111\u01B0\u1EE3c ph\xE9p voice \u2014 b\u1EA5m Tham gia.");
      } else if (d.ok) {
        setVoiceRequested(true);
        setVoiceNotice("\u0110\xE3 g\u1EEDi y\xEAu c\u1EA7u \u2014 ch\u1EDD qu\u1EA3n tr\u1ECB ph\xF2ng duy\u1EC7t.");
      } else {
        setVoiceNotice(d.loi || "Kh\xF4ng g\u1EEDi \u0111\u01B0\u1EE3c y\xEAu c\u1EA7u.");
      }
    } catch {
      setVoiceNotice("L\u1ED7i k\u1EBFt n\u1ED1i.");
    }
  };
  const ngatVoiceCap = async () => {
    if (!confirm("Ng\u1EAFt c\u1EB7p voice \u0111ang ho\u1EA1t \u0111\u1ED9ng?")) return;
    await fetch("/api/phong-collab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phongId: phong.id, action: "voice_end" })
    }).catch(() => {
    });
    pollVoice();
  };
  const toggleMic = async () => {
    if (micMuted) {
      try {
        if (!localStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = stream;
          const pc = pcRef.current;
          if (pc) {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              await fetch("/api/phong-collab", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phongId: phong.id, action: "voice_signal", signalType: "offer", payload: offer })
              });
            } catch {
            }
          }
        } else {
          localStreamRef.current.getAudioTracks().forEach((t) => {
            t.enabled = true;
          });
        }
        setMicMuted(false);
      } catch (err) {
        alert("Kh\xF4ng th\u1EC3 m\u1EDF micro: " + err.message);
      }
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
      }
      setMicMuted(true);
    }
  };
  const leaveVoice = () => {
    fetch("/api/phong-collab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phongId: phong.id, action: "voice_signal", signalType: "leave", payload: {} })
    }).catch(() => {
    });
    dungKetNoiVoice();
    setVoiceJoined(false);
    setVoiceState("disconnected");
    voiceSlotRef.current = null;
    setVoiceNotice("\u0110\xE3 ng\u1EAFt voice.");
  };
  return /* @__PURE__ */ React.createElement("div", { id: "study-dock-container", style: { overflowAnchor: "none" }, className: `bg-gradient-to-b from-[#161b26] to-[#0f141d] border border-white/[0.08] rounded-2xl p-4 flex flex-col shadow-xl ${isRoomWide ? "min-h-[calc(100vh-160px)] h-full flex-1" : "h-[620px] lg:h-[680px]"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 pb-3 border-b border-white/10 flex-wrap shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "tab-study-chat",
      type: "button",
      onClick: () => setDockTab("chat"),
      className: `px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${dockTab === "chat" ? "bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black shadow-[0_0_15px_rgba(0,242,254,0.35)] border border-[#00F2FE]/50" : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC}"),
    /* @__PURE__ */ React.createElement("span", null, "Chat ph\xF2ng")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "tab-study-notes",
      type: "button",
      onClick: () => setDockTab("notes"),
      className: `px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${dockTab === "notes" ? "bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black shadow-[0_0_15px_rgba(0,242,254,0.35)] border border-[#00F2FE]/50" : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4DD}"),
    /* @__PURE__ */ React.createElement("span", null, "Ghi ch\xFA")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "tab-study-whiteboard",
      type: "button",
      onClick: () => setDockTab("whiteboard"),
      className: `px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${dockTab === "whiteboard" ? "bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black shadow-[0_0_15px_rgba(0,242,254,0.35)] border border-[#00F2FE]/50" : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F3A8}"),
    /* @__PURE__ */ React.createElement("span", null, "B\u1EA3ng v\u1EBD")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "tab-study-sheet",
      type: "button",
      onClick: () => setDockTab("sheet"),
      className: `px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${dockTab === "sheet" ? "bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black shadow-[0_0_15px_rgba(0,242,254,0.35)] border border-[#00F2FE]/50" : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4CA}"),
    /* @__PURE__ */ React.createElement("span", null, "B\u1EA3ng t\xEDnh")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "tab-study-voice",
      type: "button",
      onClick: () => setDockTab("voice"),
      className: `px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${dockTab === "voice" ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-[0_0_15px_rgba(251,191,36,0.35)] border border-amber-400/50" : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F399}\uFE0F"),
    /* @__PURE__ */ React.createElement("span", null, "Voice (1-1)")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "tab-study-members",
      type: "button",
      onClick: () => setDockTab("members"),
      className: `px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${dockTab === "members" ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-black shadow-[0_0_15px_rgba(52,211,153,0.35)] border border-emerald-400/50" : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F465}"),
    /* @__PURE__ */ React.createElement("span", null, "Th\xE0nh vi\xEAn", thanhVien.length > 0 ? ` (${thanhVien.length})` : "")
  ), isStaff && /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "tab-study-quan-tri",
      type: "button",
      onClick: () => setDockTab("quan-tri"),
      className: `px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${dockTab === "quan-tri" ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.35)] border border-violet-500/50" : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u2699\uFE0F"),
    /* @__PURE__ */ React.createElement("span", null, "Quy\u1EC1n")
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col pt-3 min-h-0 h-full overflow-hidden" }, dockTab === "chat" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-h-0 h-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 text-xs" }, phongChat.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 text-center py-8" }, "Ch\u01B0a c\xF3 tin nh\u1EAFn \u2014 h\xE3y g\u1EEDi c\xE2u h\u1ECFi ho\u1EB7c trao \u0111\u1ED5i v\u1EC1 b\xE0i gi\u1EA3ng!") : phongChat.map((m, idx) => {
    const myName = String(auth?.user?.hoTen || auth?.user?.name || auth?.user?.ten || "").trim();
    const laChinhMinh = Boolean(
      m.cuaToi || m.khoa && phongMinhKhoa && m.khoa === phongMinhKhoa || myName && m.tenNguoiGui && m.tenNguoiGui.trim().toLowerCase() === myName.toLowerCase()
    );
    const timeStr = m.taoLuc ? (/* @__PURE__ */ new Date(m.taoLuc.replace(" ", "T") + (m.taoLuc.includes("T") ? "" : "Z"))).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: m.id || idx,
        className: `flex flex-col group w-full ${laChinhMinh ? "items-end" : "items-start"}`
      },
      /* @__PURE__ */ React.createElement("div", { className: `flex items-center gap-1.5 mb-1 text-[11px] ${laChinhMinh ? "flex-row-reverse" : ""}` }, /* @__PURE__ */ React.createElement("span", { className: `font-extrabold ${laChinhMinh ? "text-[#00F2FE]" : "text-slate-200"}` }, m.tenNguoiGui), laChinhMinh && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded text-[9px] font-black bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40 shadow-sm" }, "B\u1EA1n"), m.vaiTro === "giao_vien" ? /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30" }, "GVCN") : m.lopTen ? /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/20" }, m.lopTen) : null, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500 font-mono" }, timeStr), isStaff && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          title: "Xo\xE1 tin nh\u1EAFn n\xE0y (qu\u1EA3n tr\u1ECB ph\xF2ng)",
          onClick: async () => {
            try {
              const res = await fetch(`/api/phong-chat?phongId=${phong.id}&id=${m.id}`, { method: "DELETE" });
              const d = await res.json();
              if (d.ok && onXoaTinPhong) onXoaTinPhong(m.id);
            } catch {
            }
          },
          className: "opacity-0 group-hover:opacity-100 px-1 text-[9px] text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
        },
        "\u2715"
      )),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `max-w-[85%] sm:max-w-[78%] px-3.5 py-2 text-xs leading-relaxed break-words shadow-md transition-all ${laChinhMinh ? "rounded-2xl rounded-tr-xs bg-gradient-to-r from-[#00b4d8]/25 via-[#0077b6]/30 to-[#00F2FE]/20 border border-[#00F2FE]/40 text-white shadow-[0_0_15px_rgba(0,242,254,0.12)]" : "rounded-2xl rounded-tl-xs bg-[#0B0E14] border border-white/10 hover:border-white/20 text-slate-200"}`
        },
        /* @__PURE__ */ React.createElement("p", { className: "whitespace-pre-wrap" }, m.noiDung),
        m.videoTimeSec != null && m.videoTimeSec >= 0 && /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => yeuCauTua(m.videoTimeSec),
            className: "mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-cyan-400/20 text-[#00F2FE] border border-[#00F2FE]/30 hover:bg-[#00F2FE]/30 transition-all cursor-pointer"
          },
          /* @__PURE__ */ React.createElement("span", null, "\u25B6"),
          /* @__PURE__ */ React.createElement("span", null, dinhDangGiayPhut(m.videoTimeSec))
        )
      )
    );
  }), /* @__PURE__ */ React.createElement("div", { ref: chatEndRef })), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSendRoomChat, className: "pt-2 border-t border-white/8 flex flex-col gap-2 mt-auto shrink-0" }, showEmoji && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1 p-2 bg-[#0B0E14] border border-white/10 rounded-2xl" }, ["\u{1F60A}", "\u{1F602}", "\u{1F970}", "\u{1F60E}", "\u{1F914}", "\u{1F605}", "\u{1F62D}", "\u{1F525}", "\u2764\uFE0F", "\u{1F44D}", "\u{1F64F}", "\u{1F389}", "\u2705", "\u{1F4AF}", "\u{1F44B}", "\u{1F4DA}", "\u270F\uFE0F", "\u{1F3AF}", "\u{1F31F}", "\u{1F4A1}", "\u26A1", "\u{1F3C6}", "\u{1F91D}", "\u{1F4AA}", "\u{1F929}"].map((em) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: em,
      type: "button",
      onClick: () => {
        setChatInput((v) => v + em);
        setShowEmoji(false);
      },
      className: "text-lg hover:scale-125 transition-transform active:scale-95 px-1"
    },
    em
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "relative flex-1" }, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      id: "input-phong-chat",
      rows: 1,
      placeholder: coQuyen("chat") ? "Nh\u1EAFn tin ph\xF2ng h\u1ECDc..." : "Chat \u0111ang b\u1ECB kh\xF3a",
      value: chatInput,
      disabled: !coQuyen("chat"),
      onChange: (e) => setChatInput(e.target.value),
      onCompositionStart: () => {
        chatComposingRef.current = true;
      },
      onCompositionEnd: () => {
        chatComposingRef.current = false;
      },
      onKeyDown: (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          if (e.nativeEvent?.isComposing || chatComposingRef.current) return;
          e.preventDefault();
          handleSendRoomChat();
        }
      },
      maxLength: 500,
      className: "w-full bg-[#0B0E14] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/50 focus:shadow-[0_0_12px_rgba(0,242,254,0.12)] resize-none min-h-[38px] max-h-24 disabled:opacity-40 transition-all"
    }
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      disabled: !coQuyen("chat"),
      onClick: () => setShowEmoji((v) => !v),
      className: `w-9 h-9 rounded-2xl flex items-center justify-center text-base transition-all disabled:opacity-30 shrink-0 active:scale-90 ${showEmoji ? "bg-[#00F2FE]/20 border border-[#00F2FE]/40 text-[#00F2FE]" : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"}`,
      title: "Ch\u1ECDn emoji"
    },
    "\u{1F60A}"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      id: "btn-send-phong-chat",
      disabled: !chatInput.trim() || chatSending || !coQuyen("chat"),
      className: "w-9 h-9 rounded-2xl bg-gradient-to-br from-[#00F2FE] to-[#3B82F6] text-black flex items-center justify-center font-black transition-all disabled:opacity-30 shrink-0 hover:brightness-110 active:scale-90 shadow-[0_0_12px_rgba(0,242,254,0.3)]"
    },
    /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", className: "w-4 h-4" }, /* @__PURE__ */ React.createElement("path", { d: "M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" }))
  )))), dockTab === "notes" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-2 min-h-0 h-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] text-slate-400 shrink-0" }, /* @__PURE__ */ React.createElement("span", null, "Ghi ch\xFA chung c\u1EE7a ph\xF2ng \u2014 m\u1ED7i ng\u01B0\u1EDDi th\xEAm m\u1ED9t d\xF2ng, c\xF3 th\u1EC3 g\u1EAFn m\u1ED1c video"), notesNotice && /* @__PURE__ */ React.createElement("span", { className: "text-rose-300 font-bold" }, notesNotice)), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 bg-[#0B0E14] border border-white/10 rounded-xl p-2.5" }, notesList.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 text-center py-8" }, "Ch\u01B0a c\xF3 ghi ch\xFA \u2014 th\xEAm d\xF2ng \u0111\u1EA7u ti\xEAn cho c\u1EA3 ph\xF2ng.") : notesList.map((n) => /* @__PURE__ */ React.createElement("div", { key: n.id, className: "flex items-start gap-2 group" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-slate-400" }, n.ten), n.videoTimeSec != null && n.videoTimeSec > 0 && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => yeuCauTua(n.videoTimeSec),
      className: "px-1.5 py-0.2 rounded text-[9px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30"
    },
    "\u25B6 ",
    dinhDangGiayPhut(n.videoTimeSec)
  ), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-slate-600 font-mono" }, n.taoLuc ? (/* @__PURE__ */ new Date(n.taoLuc.replace(" ", "T") + "Z")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-200 leading-relaxed break-words" }, n.noiDung)), (n.cuaToi || isStaff) && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => xoaGhiChu(n.id),
      title: "Xo\xE1 ghi ch\xFA",
      className: "opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 text-[10px] px-1 transition-all"
    },
    "\u2715"
  )))), notesCanWrite ? /* @__PURE__ */ React.createElement(
    "form",
    {
      onSubmit: (e) => {
        e.preventDefault();
        if (!e.nativeEvent?.isComposing && !noteComposingRef.current) themGhiChu();
      },
      className: "flex items-center gap-2"
    },
    /* @__PURE__ */ React.createElement(
      "input",
      {
        id: "study-note-input",
        type: "text",
        value: noteInput,
        onChange: (e) => setNoteInput(e.target.value),
        onCompositionStart: () => {
          noteComposingRef.current = true;
        },
        onCompositionEnd: () => {
          noteComposingRef.current = false;
        },
        placeholder: "Th\xEAm ghi ch\xFA cho ph\xF2ng...",
        maxLength: 1e3,
        className: "flex-1 bg-[#0B0E14] border border-white/10 focus:border-[#00F2FE]/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
      }
    ),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setNoteWithTime((v) => !v),
        title: noteWithTime ? "\u0110ang g\u1EAFn m\u1ED1c video v\xE0o ghi ch\xFA" : "Kh\xF4ng g\u1EAFn m\u1ED1c video",
        className: `px-2.5 py-2 rounded-xl text-xs font-bold border transition-all ${noteWithTime ? "bg-violet-500/20 text-violet-300 border-violet-500/40" : "bg-white/5 text-slate-500 border-white/10"}`
      },
      "\u23F1"
    ),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        id: "btn-add-note",
        disabled: !noteInput.trim(),
        className: "px-4 py-2 rounded-xl bg-[#00F2FE] text-black text-xs font-black disabled:opacity-30"
      },
      "Th\xEAm"
    )
  ) : /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-amber-300/80 text-center py-1" }, "\u{1F512} Ghi ch\xFA \u0111ang \u1EDF ch\u1EBF \u0111\u1ED9 ch\u1EC9 xem \u2014 qu\u1EA3n tr\u1ECB ph\xF2ng \u0111\xE3 kh\xF3a.")), dockTab === "whiteboard" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-2 min-h-0 h-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 flex-wrap text-xs pb-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-wb-pen",
      onClick: () => setWbTool("pen"),
      disabled: !wbCanWrite,
      className: `px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-40 ${wbTool === "pen" ? "bg-[#00F2FE] text-black" : "bg-white/10 text-slate-300"}`
    },
    "\u270F\uFE0F B\xFAt v\u1EBD"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-wb-eraser",
      onClick: () => setWbTool("eraser"),
      disabled: !wbCanWrite,
      className: `px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-40 ${wbTool === "eraser" ? "bg-rose-500 text-white" : "bg-white/10 text-slate-300"}`
    },
    "\u{1F9F9} T\u1EA9y"
  ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 ml-2" }, ["#00F2FE", "#FFB800", "#F43F5E", "#FFFFFF"].map((c) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: c,
      type: "button",
      disabled: !wbCanWrite,
      onClick: () => {
        setWbColor(c);
        setWbTool("pen");
      },
      className: `w-5 h-5 rounded-full border disabled:opacity-40 ${wbColor === c && wbTool === "pen" ? "scale-110 border-white ring-2 ring-cyan-400" : "border-transparent"}`,
      style: { background: c },
      title: c
    }
  )))), isStaff && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-wb-clear",
      onClick: clearWhiteboard,
      className: "px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-300 border border-white/10 text-xs font-bold"
    },
    "X\xF3a b\u1EA3ng"
  )), /* @__PURE__ */ React.createElement("div", { className: "flex-1 bg-[#0B0E14] border border-white/10 rounded-xl overflow-hidden flex items-center justify-center relative touch-none min-h-[220px]" }, !wbCanWrite && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-[11px] text-amber-300/90 font-bold" }, "\u{1F512} B\u1EA3ng v\u1EBD \u0111ang \u1EDF ch\u1EBF \u0111\u1ED9 ch\u1EC9 xem"), /* @__PURE__ */ React.createElement(
    "canvas",
    {
      id: "study-whiteboard-canvas",
      ref: canvasRef,
      width: 640,
      height: 320,
      onMouseDown: wbCanWrite ? startDrawing : void 0,
      onMouseMove: wbCanWrite ? drawMove : void 0,
      onMouseUp: wbCanWrite ? stopDrawing : void 0,
      onMouseLeave: wbCanWrite ? stopDrawing : void 0,
      onTouchStart: wbCanWrite ? startDrawing : void 0,
      onTouchMove: wbCanWrite ? drawMove : void 0,
      onTouchEnd: wbCanWrite ? stopDrawing : void 0,
      className: `w-full h-full ${wbCanWrite ? "cursor-crosshair" : "cursor-not-allowed"}`
    }
  ))), dockTab === "sheet" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-2 overflow-x-auto min-h-0 h-full" }, /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-slate-400 shrink-0" }, "B\u1EA3ng t\xEDnh ph\xE2n t\xEDch s\u1ED1 li\u1EC7u / m\u1ED1c th\u1EDDi gian h\u1ECDc t\u1EADp (L\u01B0u t\u1EF1 \u0111\u1ED9ng)"), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-auto border border-white/10 rounded-xl bg-[#0B0E14] min-h-0" }, /* @__PURE__ */ React.createElement("table", { id: "study-sheet-table", className: "w-full text-xs text-slate-300 border-collapse" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "bg-white/5 text-slate-400 border-b border-white/10 font-mono" }, /* @__PURE__ */ React.createElement("th", { className: "w-8 p-1 text-center border-r border-white/10 text-[10px]" }, "#"), COLS.map((c) => /* @__PURE__ */ React.createElement("th", { key: c, className: "p-1.5 text-center border-r border-white/10 min-w-[70px] text-[11px] font-bold text-cyan-300" }, c)))), /* @__PURE__ */ React.createElement("tbody", null, ROWS.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r, className: "border-b border-white/5 hover:bg-white/[0.02]" }, /* @__PURE__ */ React.createElement("td", { className: "p-1 text-center bg-white/5 text-slate-500 font-mono text-[10px] border-r border-white/10" }, r), COLS.map((c) => {
    const cellKey = `${c}${r}`;
    return /* @__PURE__ */ React.createElement("td", { key: cellKey, className: "p-0 border-r border-white/5" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        "data-cell": cellKey,
        value: sheetCells[cellKey] || "",
        readOnly: !sheetCanWrite,
        onFocus: () => {
          sheetFocusedCellRef.current = cellKey;
        },
        onBlur: () => {
          sheetFocusedCellRef.current = null;
        },
        onChange: (e) => sheetCanWrite && handleCellChange(cellKey, e.target.value),
        className: `w-full bg-transparent px-2 py-1 text-xs text-white focus:bg-[#151A23] focus:outline-none focus:ring-1 focus:ring-[#00F2FE] ${!sheetCanWrite ? "opacity-60 cursor-not-allowed" : ""}`
      }
    ));
  }))))))), dockTab === "voice" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col items-center justify-center p-6 text-center gap-4" }, /* @__PURE__ */ React.createElement("audio", { ref: remoteAudioRef, autoPlay: true }), /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 rounded-3xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.2)]" }, "\u{1F399}\uFE0F"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "text-sm font-black text-white" }, "Tho\u1EA1i Tr\u1EF1c Ti\u1EBFp 1-1 Trong Ph\xF2ng"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 max-w-xs mt-1" }, "M\u1ED7i ph\xF2ng t\u1ED1i \u0111a m\u1ED9t c\u1EB7p voice 1-1. Micro m\u1EB7c \u0111\u1ECBnh t\u1EAFt khi ch\u01B0a b\u1EADt.")), voicePair?.active !== void 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10" }, voicePair?.aTen ? `${voicePair.aTen}${voicePair.bTen ? " \u2194 " + voicePair.bTen : " \xB7 \u0111ang ch\u1EDD ng\u01B0\u1EDDi th\u1EE9 2"}` : "Ch\u01B0a c\xF3 c\u1EB7p voice n\xE0o"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 flex-wrap justify-center" }, !voiceJoined ? /* @__PURE__ */ React.createElement(React.Fragment, null, coQuyen("voice") ? /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-voice-join",
      onClick: joinVoice,
      disabled: voicePair?.active && !voicePair?.youIn,
      className: "px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
    },
    voicePair?.active ? "\u0110ang c\xF3 c\u1EB7p voice kh\xE1c" : voicePair?.aTen ? "V\xE0o c\u1EB7p v\u1EDBi " + voicePair.aTen : "Tham gia voice"
  ) : /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-voice-request",
      onClick: xinQuyenVoice,
      disabled: voiceRequested,
      className: "px-5 py-2.5 rounded-xl bg-white/10 text-slate-200 border border-white/15 font-bold text-xs hover:bg-white/15 transition-all disabled:opacity-50"
    },
    voiceRequested ? "\u23F3 \u0110ang ch\u1EDD duy\u1EC7t\u2026" : "\u{1F64B} Xin quy\u1EC1n voice"
  )) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-voice-toggle-mic",
      onClick: toggleMic,
      className: `px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${micMuted ? "bg-white/10 text-slate-300 hover:bg-white/15" : "bg-emerald-500 text-black"}`
    },
    /* @__PURE__ */ React.createElement("span", null, micMuted ? "\u{1F507} B\u1EADt Mic" : "\u{1F399}\uFE0F Mic \u0110ang B\u1EADt")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-voice-leave",
      onClick: leaveVoice,
      className: "px-4 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 transition-all"
    },
    "R\u1EDDi voice"
  )), isStaff && voicePair?.aTen && !voicePair?.youIn && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-voice-end",
      onClick: ngatVoiceCap,
      className: "px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/25 text-xs font-bold hover:bg-rose-500/20 transition-all"
    },
    "Ng\u1EAFt c\u1EB7p voice"
  )), isStaff && yeuCauVoice.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-2.5 text-left" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] uppercase font-bold tracking-wider text-amber-300 mb-1.5" }, "\u0110ang xin quy\u1EC1n voice"), yeuCauVoice.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.khoa, className: "flex items-center gap-2 text-xs py-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-slate-200 font-semibold flex-1 truncate" }, r.ten || "Th\xE0nh vi\xEAn"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: async () => {
        const d = await hanhDongPhong?.("grant", { khoaTV: r.khoa, capability: "voice", on: true });
        if (d?.ok) setYeuCauVoice((prev) => prev.filter((x) => x.khoa !== r.khoa));
      },
      className: "px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold hover:bg-emerald-500/30"
    },
    "Duy\u1EC7t"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: async () => {
        const d = await hanhDongPhong?.("grant", { khoaTV: r.khoa, capability: "voice", on: false });
        if (d?.ok) setYeuCauVoice((prev) => prev.filter((x) => x.khoa !== r.khoa));
      },
      className: "px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/25 text-[10px] font-bold hover:bg-rose-500/25"
    },
    "T\u1EEB ch\u1ED1i"
  )))), voiceNotice && /* @__PURE__ */ React.createElement("p", { id: "voice-status-notice", className: "text-xs text-slate-300 font-mono bg-black/40 px-3 py-1.5 rounded-lg border border-white/5" }, voiceNotice), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 max-w-xs" }, "* Ghi ch\xFA: K\u1EBFt n\u1ED1i tho\u1EA1i P2P y\xEAu c\u1EA7u m\u1EA1ng kh\xF4ng ch\u1EB7n UDP. Restrictive NAT c\xF3 th\u1EC3 c\u1EA7n relay TURN.")), dockTab === "members" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-3 min-h-0 h-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between pb-2 border-b border-white/10" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-black text-white flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F465}"), /* @__PURE__ */ React.createElement("span", null, "Th\xE0nh vi\xEAn trong ph\xF2ng (", thanhVien.length, ")")), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-400" }, "\u0110ang tr\u1EF1c tuy\u1EBFn")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-2 overflow-y-auto pr-1 min-h-0" }, thanhVien.map((tv, idx) => {
    const laHost = tv.laChuPhong === 1 || tv.vaiTroPhong === "host";
    const laGV = tv.vaiTro === "giao_vien";
    const laCoHost = tv.vaiTroPhong === "cohost";
    const grantVoice = grants.some((g) => g.khoaTV === tv.khoa && g.capability === "voice");
    const grantVideo = grants.some((g) => g.khoaTV === tv.khoa && g.capability === "video_control");
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: tv.khoa || tv.ten || idx,
        className: "flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-teal-500/25 transition-all"
      },
      /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-xs font-black text-teal-300 shrink-0" }, tv.avatar ? /* @__PURE__ */ React.createElement("img", { src: tv.avatar, alt: "", className: "w-full h-full rounded-full object-cover" }) : (tv.ten || "?").charAt(0).toUpperCase()),
      /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-slate-200 truncate" }, tv.ten), laHost && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0" }, "\u{1F451} Host"), laGV && !laHost && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[9px] font-black bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/30 shrink-0" }, "\u{1F393} Gi\xE1o vi\xEAn"), laCoHost && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[9px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0" }, "\u2B50 Co-host")), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500 block truncate" }, tv.lopTen ? `L\u1EDBp ${tv.lopTen}` : laGV ? "Gi\xE1o vi\xEAn tr\u01B0\u1EDDng" : "H\u1ECDc sinh")),
      (vaiTroPhong === "host" || auth.user?.isTeacher) && !laHost && tv.khoa && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 shrink-0" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => hanhDongPhong?.("set_co_host", { khoaTV: tv.khoa, on: !laCoHost }),
          title: laCoHost ? "Thu quy\u1EC1n co-host" : "C\u1EA5p co-host",
          className: `px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${laCoHost ? "bg-violet-500/20 text-violet-300 border-violet-500/40" : "bg-white/5 text-slate-400 border-white/10 hover:text-white"}`
        },
        "co-host"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => hanhDongPhong?.("grant", { khoaTV: tv.khoa, capability: "voice", on: !grantVoice }),
          title: "C\u1EA5p/thu quy\u1EC1n mic",
          className: `w-6 h-6 rounded flex items-center justify-center text-[10px] border transition-all ${grantVoice ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-white/5 text-slate-400 border-white/10 hover:text-white"}`
        },
        "\u{1F399}\uFE0F"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => hanhDongPhong?.("grant", { khoaTV: tv.khoa, capability: "video_control", on: !grantVideo }),
          title: "C\u1EA5p/thu quy\u1EC1n video",
          className: `w-6 h-6 rounded flex items-center justify-center text-[10px] border transition-all ${grantVideo ? "bg-blue-500/20 text-blue-300 border-blue-500/40" : "bg-white/5 text-slate-400 border-white/10 hover:text-white"}`
        },
        "\u{1F3A5}"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: async () => {
            if (confirm(`Kick ${tv.ten} kh\u1ECFi ph\xF2ng?`)) {
              const d = await hanhDongPhong?.("kick", { khoaTV: tv.khoa });
              if (d && !d.ok) alert(d.loi || "Kh\xF4ng kick \u0111\u01B0\u1EE3c.");
            }
          },
          title: "Kick kh\u1ECFi ph\xF2ng",
          className: "w-6 h-6 rounded flex items-center justify-center text-[10px] border bg-rose-500/10 text-rose-300 border-rose-500/25 hover:bg-rose-500/25"
        },
        "\u2715"
      ))
    );
  }), thanhVien.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "text-center py-8 text-slate-500 text-xs" }, "Ch\u01B0a c\xF3 th\xE0nh vi\xEAn n\xE0o trong ph\xF2ng."))), dockTab === "quan-tri" && isStaff && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-3 overflow-y-auto min-h-0 pr-1 h-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: async () => {
        for (const cap of ["notes", "whiteboard", "sheet"]) {
          await hanhDongPhong?.("policy", { capability: cap, enabled: 1, accessMode: "staff_only" });
        }
      },
      className: "px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-bold hover:bg-rose-500/25"
    },
    "\u{1F512} Kh\xF3a c\u1ED9ng t\xE1c (ch\u1EC9 xem)"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: async () => {
        for (const cap of ["notes", "whiteboard", "sheet"]) {
          await hanhDongPhong?.("policy", { capability: cap, enabled: 1, accessMode: "everyone" });
        }
      },
      className: "px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold hover:bg-emerald-500/25"
    },
    "\u{1F513} M\u1EDF c\u1ED9ng t\xE1c cho m\u1ECDi ng\u01B0\u1EDDi"
  )), /* @__PURE__ */ React.createElement("div", { className: "bg-[#0B0E14] border border-white/10 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2" }, "Ch\xEDnh s\xE1ch c\xF4ng c\u1EE5"), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5" }, [
    ["video_control", "\u0110i\u1EC1u khi\u1EC3n ph\xE1t (play/pause/tua)"],
    ["video_change", "\u0110\u1ED5i video \u0111ang ph\xE1t"],
    ["queue", "H\xE0ng \u0111\u1EE3i video"],
    ["chat", "Chat ph\xF2ng"],
    ["notes", "Ghi ch\xFA chung"],
    ["whiteboard", "B\u1EA3ng v\u1EBD"],
    ["sheet", "B\u1EA3ng t\xEDnh"],
    ["voice", "Voice 1-1"],
    ["invite", "M\u1EDDi ng\u01B0\u1EDDi v\xE0o ph\xF2ng"]
  ].map(([cap, nhan]) => {
    const pol = policies?.[cap] || { enabled: 1, access_mode: "staff_only" };
    return /* @__PURE__ */ React.createElement("div", { key: cap, className: "flex items-center gap-2 text-xs" }, /* @__PURE__ */ React.createElement("span", { className: "flex-1 text-slate-300 truncate" }, nhan), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => hanhDongPhong?.("policy", { capability: cap, enabled: pol.enabled ? 0 : 1, accessMode: pol.access_mode }),
        title: pol.enabled ? "\u0110ang b\u1EADt \u2014 b\u1EA5m \u0111\u1EC3 t\u1EAFt" : "\u0110ang t\u1EAFt \u2014 b\u1EA5m \u0111\u1EC3 b\u1EADt",
        className: `w-8 h-4.5 px-0.5 rounded-full border transition-all flex items-center ${pol.enabled ? "bg-emerald-500/30 border-emerald-500/40 justify-end" : "bg-white/5 border-white/15 justify-start"}`
      },
      /* @__PURE__ */ React.createElement("span", { className: `w-3 h-3 rounded-full ${pol.enabled ? "bg-emerald-400" : "bg-slate-500"}` })
    ), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: pol.access_mode,
        disabled: !pol.enabled,
        onChange: (e) => hanhDongPhong?.("policy", { capability: cap, enabled: 1, accessMode: e.target.value }),
        className: "bg-[#151A23] border border-white/10 rounded-lg px-1.5 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-[#00F2FE]/50 disabled:opacity-40"
      },
      /* @__PURE__ */ React.createElement("option", { value: "staff_only" }, "Qu\u1EA3n tr\u1ECB"),
      /* @__PURE__ */ React.createElement("option", { value: "selected_members" }, "M\u1ED9t s\u1ED1 ng\u01B0\u1EDDi"),
      /* @__PURE__ */ React.createElement("option", { value: "everyone" }, "M\u1ECDi ng\u01B0\u1EDDi")
    ));
  }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-xs opacity-60" }, /* @__PURE__ */ React.createElement("span", { className: "flex-1 text-slate-400" }, "Ki\u1EC3m duy\u1EC7t (kick/xo\xE1 tin)"), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-bold text-amber-300 border border-amber-500/30 rounded px-1.5 py-0.5" }, "LU\xD4N QU\u1EA2N TR\u1ECA")))), /* @__PURE__ */ React.createElement("div", { className: "bg-[#0B0E14] border border-white/10 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2" }, "Th\xE0nh vi\xEAn & quy\u1EC1n ri\xEAng"), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5" }, (thanhVien || []).map((tv) => {
    const laHost = Boolean(tv.laChuPhong);
    const laGV = tv.vaiTro === "giao_vien";
    const laCoHost = tv.vaiTroPhong === "co_host";
    const grantVoice = (grants || []).some((g) => g.khoa === tv.khoa && g.capability === "voice" && g.trangThai === "granted");
    const grantVideo = (grants || []).some((g) => g.khoa === tv.khoa && g.capability === "video_control" && g.trangThai === "granted");
    return /* @__PURE__ */ React.createElement("div", { key: tv.khoa || tv.ten, className: "flex items-center gap-1.5 text-xs flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-slate-200 font-semibold truncate max-w-[110px]" }, tv.ten), laHost && /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-amber-400 font-bold" }, "\u2605 host"), laGV && /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-[#00F2FE] font-bold" }, "GV"), laCoHost && /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-violet-300 font-bold" }, "co-host"), !laHost && !laGV && tv.khoa && /* @__PURE__ */ React.createElement("span", { className: "ml-auto flex items-center gap-1" }, (vaiTroPhong === "host" || auth.user?.isTeacher) && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => hanhDongPhong?.("set_co_host", { khoaTV: tv.khoa, on: !laCoHost }),
        title: laCoHost ? "Thu quy\u1EC1n co-host" : "C\u1EA5p co-host",
        className: `px-1.5 py-0.5 rounded text-[9px] font-bold border ${laCoHost ? "bg-violet-500/20 text-violet-300 border-violet-500/40" : "bg-white/5 text-slate-400 border-white/10 hover:text-white"}`
      },
      "co-host"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => hanhDongPhong?.("grant", { khoaTV: tv.khoa, capability: "voice", on: !grantVoice }),
        title: "C\u1EA5p/thu quy\u1EC1n voice",
        className: `px-1.5 py-0.5 rounded text-[9px] font-bold border ${grantVoice ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-white/5 text-slate-400 border-white/10 hover:text-white"}`
      },
      "\u{1F399}"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => hanhDongPhong?.("grant", { khoaTV: tv.khoa, capability: "video_control", on: !grantVideo }),
        title: "C\u1EA5p/thu quy\u1EC1n \u0111i\u1EC1u khi\u1EC3n video",
        className: `px-1.5 py-0.5 rounded text-[9px] font-bold border ${grantVideo ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-white/5 text-slate-400 border-white/10 hover:text-white"}`
      },
      "\u25B6"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: async () => {
          if (confirm(`Kick ${tv.ten} kh\u1ECFi ph\xF2ng?`)) {
            const d = await hanhDongPhong?.("kick", { khoaTV: tv.khoa });
            if (d && !d.ok) alert(d.loi || "Kh\xF4ng kick \u0111\u01B0\u1EE3c.");
          }
        },
        title: "Kick kh\u1ECFi ph\xF2ng",
        className: "px-1.5 py-0.5 rounded text-[9px] font-bold border bg-rose-500/10 text-rose-300 border-rose-500/25 hover:bg-rose-500/25"
      },
      "kick"
    )));
  }), (thanhVien || []).length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500" }, "Ch\u01B0a c\xF3 th\xE0nh vi\xEAn."))), (vaiTroPhong === "host" || auth.user?.isTeacher) && /* @__PURE__ */ React.createElement("div", { className: "bg-[#0B0E14] border border-white/10 rounded-xl p-3 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      placeholder: "M\u1EADt kh\u1EA9u m\u1EDBi (\u0111\u1EC3 tr\u1ED1ng = b\u1ECF m\u1EADt kh\u1EA9u)",
      id: "input-phong-mat-khau-moi",
      maxLength: 100,
      className: "flex-1 bg-[#151A23] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/50"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: async () => {
        const el = document.getElementById("input-phong-mat-khau-moi");
        const mk = el?.value || "";
        const d = mk.trim() ? await hanhDongPhong?.("doi_mat_khau", { matKhauMoi: mk.trim() }) : await hanhDongPhong?.("bo_mat_khau", {});
        if (d && !d.ok) alert(d.loi || "Kh\xF4ng \u0111\u1ED5i \u0111\u01B0\u1EE3c m\u1EADt kh\u1EA9u.");
        if (el) el.value = "";
      },
      className: "px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold hover:bg-amber-500/25"
    },
    "\u0110\u1ED5i / B\u1ECF"
  )))));
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
  isStaff = false
}) {
  const [watchState, setWatchState] = useState({
    playing: false,
    positionSeconds: 0,
    basePositionSeconds: 0,
    playbackRate: 1,
    revision: 1,
    updatedAt: "",
    serverNow: "",
    updatedBy: ""
  });
  const [canControl, setCanControl] = useState(Boolean(
    auth?.user?.isTeacher || phong?.canControl || phong?.laChuPhong || myCaps?.video_control || myCaps?.video_change || isStaff
  ));
  const [_watchCaps, setWatchCaps] = useState({});
  const getInitialVideoUrl = () => {
    let c = {};
    try {
      c = phong?.cauHinh ? JSON.parse(phong.cauHinh) : {};
    } catch {
    }
    return c.videoUrl || phong?.videoUrl || "";
  };
  const getInitialProvider = (u) => {
    if (!u) return "UNSUPPORTED";
    if (idYoutube(u)) return "YOUTUBE";
    if (idGoogleDrive(u)) return "GOOGLE_DRIVE";
    if (laVideoTrucTiepFe(u)) return "NATIVE_HTML5";
    return "UNSUPPORTED";
  };
  const initUrl = getInitialVideoUrl();
  const [activeVideoUrl, setActiveVideoUrl] = useState(initUrl);
  const [provider, setProvider] = useState(() => getInitialProvider(initUrl));
  const [hasInteracted, setHasInteracted] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dangGuiLenh, setDangGuiLenh] = useState(false);
  const [loi, setLoi] = useState("");
  const [mediaTab, setMediaTab] = useState("search");
  const [videoMoi, setVideoMoi] = useState("");
  const [dangDoiVideo, setDangDoiVideo] = useState(false);
  const [loiVideo, setLoiVideo] = useState("");
  const [thongBaoVideo, setThongBaoVideo] = useState("");
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState([]);
  const [searchingYt, setSearchingYt] = useState(false);
  const [searchLoi, setSearchLoi] = useState("");
  const [queueList, setQueueList] = useState([]);
  const [queueBusy, setQueueBusy] = useState(false);
  const [daMoRongStudio, setDaMoRongStudio] = useState(true);
  useEffect(() => {
    if (phong?.canControl || phong?.laChuPhong || auth?.user?.isTeacher || myCaps?.video_control || myCaps?.video_change || isStaff) {
      setCanControl(true);
    }
  }, [phong?.canControl, phong?.laChuPhong, auth?.user?.isTeacher, myCaps, isStaff]);
  const taiQueue = async () => {
    try {
      const res = await fetch(`/api/phong-queue?phongId=${phong.id}&action=list`);
      const d = await res.json();
      if (d.ok) setQueueList(d.queue || []);
    } catch {
    }
  };
  useEffect(() => {
    taiQueue();
    const timer = setInterval(khiHienThi(taiQueue), 4e3);
    return () => clearInterval(timer);
  }, [phong.id]);
  const doiVideo = async (url, title) => {
    const u = String(url || videoMoi || ytQuery || "").trim();
    if (!u || dangDoiVideo) return;
    setDangDoiVideo(true);
    setLoiVideo("");
    try {
      const res = await fetch("/api/phong-watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phongId: phong.id, action: "set_video", videoUrl: u, autoPlay: true })
      });
      const d = await res.json();
      if (!d.ok) {
        setLoiVideo(d.loi || "Kh\xF4ng \u0111\u1ED5i \u0111\u01B0\u1EE3c video.");
      } else {
        setActiveVideoUrl(u);
        setProvider(getInitialProvider(u));
        setVideoMoi("");
        if (d.state) {
          setWatchState(d.state);
          setLocalTime(0);
        }
        hasTriggeredSkipRef.current = false;
        durationRef.current = 0;
        setDuration(0);
        const newYtId = idYoutube(u);
        if (newYtId && ytPlayerRef.current && ytReadyRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
          try {
            ytPlayerRef.current.loadVideoById({ videoId: newYtId, startSeconds: 0 });
            ytPlayerRef.current.playVideo();
          } catch {
          }
        }
        setThongBaoVideo(`\u0110ang ph\xE1t: ${title || u}`);
        setTimeout(() => setThongBaoVideo(""), 4e3);
        taiQueue();
      }
    } catch {
      setLoiVideo("M\u1EA5t k\u1EBFt n\u1ED1i m\xE1y ch\u1EE7.");
    } finally {
      setDangDoiVideo(false);
    }
  };
  const timKiemYouTube = async (e, tuKhoa) => {
    e?.preventDefault();
    const q = String(tuKhoa || ytQuery || "").trim();
    if (!q || searchingYt) return;
    if (tuKhoa) setYtQuery(tuKhoa);
    const idYt = idYoutube(q);
    if (idYt) {
      setYtResults([{
        videoId: idYt,
        title: "Video YouTube (t\u1EEB li\xEAn k\u1EBFt \u0111\xE3 d\xE1n)",
        channelTitle: "YouTube",
        thumbnail: `https://i.ytimg.com/vi/${idYt}/hqdefault.jpg`,
        publishedAt: "Tr\u1EF1c ti\u1EBFp"
      }]);
      setSearchLoi("");
      setMediaTab("search");
      return;
    }
    setSearchingYt(true);
    setSearchLoi("");
    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(q)}`);
      const d = await res.json();
      if (d.ok && Array.isArray(d.items)) {
        if (d.items.length === 0) {
          setSearchLoi("Kh\xF4ng t\xECm th\u1EA5y video n\xE0o ph\xF9 h\u1EE3p v\u1EDBi t\u1EEB kh\xF3a n\xE0y.");
        } else {
          setYtResults(d.items);
          setMediaTab("search");
        }
      } else {
        setSearchLoi(d.loi || "Kh\xF4ng th\u1EC3 t\xECm ki\u1EBFm video l\xFAc n\xE0y.");
      }
    } catch {
      setSearchLoi("L\u1ED7i k\u1EBFt n\u1ED1i khi t\xECm ki\u1EBFm YouTube.");
    } finally {
      setSearchingYt(false);
    }
  };
  const videoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytContainerId = `yt-player-${phong.id}`;
  const isSeekingRef = useRef(false);
  const hasInteractedRef = useRef(false);
  const durationRef = useRef(0);
  const hasTriggeredSkipRef = useRef(false);
  const isSkippingRef = useRef(false);
  const hanhDongQueue = async (action, extra = {}) => {
    if (action === "skip") {
      if (isSkippingRef.current) return;
      isSkippingRef.current = true;
      hasTriggeredSkipRef.current = true;
    } else {
      if (queueBusy) return;
      setQueueBusy(true);
    }
    setLoiVideo("");
    try {
      const res = await fetch("/api/phong-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phongId: phong.id, action, ...extra })
      });
      const d = await res.json();
      if (!d.ok) {
        setLoiVideo(d.loi || "Thao t\xE1c h\xE0ng \u0111\u1EE3i th\u1EA5t b\u1EA1i.");
        if (action === "skip") {
          hasTriggeredSkipRef.current = false;
          isSkippingRef.current = false;
        }
      } else {
        if (action === "enqueue") {
          setThongBaoVideo(`\u0110\xE3 th\xEAm v\xE0o cu\u1ED1i h\xE0ng \u0111\u1EE3i: ${extra.title || "Video"}`);
          setTimeout(() => setThongBaoVideo(""), 3500);
        } else if (action === "add_next") {
          setThongBaoVideo(`\u0110\xE3 th\xEAm ph\xE1t k\u1EBF ti\u1EBFp: ${extra.title || "Video"}`);
          setTimeout(() => setThongBaoVideo(""), 3500);
        } else if (action === "play_now" || action === "skip") {
          hasTriggeredSkipRef.current = false;
          isSkippingRef.current = false;
          durationRef.current = 0;
          setDuration(0);
          if (d.videoUrl) {
            setActiveVideoUrl(d.videoUrl);
            setProvider(getInitialProvider(d.videoUrl));
            if (d.state) {
              setWatchState(d.state);
              setLocalTime(0);
            }
            const newYtId = idYoutube(d.videoUrl);
            if (newYtId && ytPlayerRef.current && ytReadyRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
              try {
                ytPlayerRef.current.loadVideoById({ videoId: newYtId, startSeconds: 0 });
                ytPlayerRef.current.playVideo();
              } catch {
              }
            }
            setThongBaoVideo("\u0110ang chuy\u1EC3n video ti\u1EBFp theo...");
            setTimeout(() => setThongBaoVideo(""), 3e3);
          } else if (d.empty) {
            hasTriggeredSkipRef.current = true;
            isSkippingRef.current = false;
            setThongBaoVideo("H\xE0ng \u0111\u1EE3i \u0111\xE3 h\u1EBFt video.");
            setTimeout(() => setThongBaoVideo(""), 3e3);
          }
        }
        await taiQueue();
      }
    } catch {
      setLoiVideo("M\u1EA5t k\u1EBFt n\u1ED1i m\xE1y ch\u1EE7.");
      if (action === "skip") {
        hasTriggeredSkipRef.current = false;
        isSkippingRef.current = false;
      }
    } finally {
      if (action !== "skip") {
        setQueueBusy(false);
      }
    }
  };
  useEffect(() => {
    let c = {};
    try {
      c = phong?.cauHinh ? JSON.parse(phong.cauHinh) : {};
    } catch {
    }
    const nextUrl = c.videoUrl || phong?.videoUrl || "";
    if (nextUrl && nextUrl !== activeVideoUrl) {
      hasTriggeredSkipRef.current = false;
      isSkippingRef.current = false;
      durationRef.current = 0;
      setDuration(0);
      setActiveVideoUrl(nextUrl);
      setProvider(getInitialProvider(nextUrl));
    }
  }, [phong?.cauHinh, phong?.videoUrl]);
  const videoUrl = activeVideoUrl;
  const ytId = videoUrl ? idYoutube(videoUrl) : null;
  const drvId = videoUrl ? idGoogleDrive(videoUrl) : null;
  const trucTiepUrl = videoUrl && !ytId && !drvId && laVideoTrucTiepFe(videoUrl) ? urlMediaFe(videoUrl) : "";
  const [_ytPlayerReady, setYtPlayerReady] = useState(false);
  const ytReadyRef = useRef(false);
  const currentYtIdRef = useRef(null);
  const hasSeekedInitRef = useRef(false);
  const lastHostSyncTimeRef = useRef(0);
  useEffect(() => {
    const onMsg = (e) => {
      let data = e.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          if (data.includes("event=")) {
            try {
              const params = new URLSearchParams(data);
              data = {
                event: params.get("event"),
                info: params.get("info") ? JSON.parse(params.get("info")) : params.get("info")
              };
            } catch {
              return;
            }
          } else {
            return;
          }
        }
      }
      if (!data || typeof data !== "object") return;
      const d = Number(data.info?.duration || data.duration || 0);
      if (d > 0) {
        durationRef.current = d;
        setDuration((prev) => prev > 0 ? prev : d);
      }
      const cur = Number(data.info?.currentTime);
      if (!isNaN(cur) && cur >= 0 && !isSeekingRef.current) {
        setLocalTime(Math.floor(cur));
      }
      const isEnded = data.event === "onStateChange" && (data.info === 0 || data.info?.playerState === 0) || data.event === "infoDelivery" && data.info?.playerState === 0 || data.info && data.info.playerState === 0;
      if (isEnded) {
        if (canControl && !isSkippingRef.current && !hasTriggeredSkipRef.current) {
          console.log("YouTube iframe postMessage: Video k\u1EBFt th\xFAc -> t\u1EF1 \u0111\u1ED9ng chuy\u1EC3n ti\u1EBFp video ti\u1EBFp theo");
          hanhDongQueue("skip");
        }
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [canControl, phong.id]);
  useEffect(() => {
    if (!ytId) return;
    const ifr = document.getElementById(ytContainerId);
    if (!ifr) return;
    const t = setInterval(() => {
      try {
        ifr.contentWindow?.postMessage(JSON.stringify({ event: "listening" }), "*");
      } catch {
      }
    }, 1500);
    return () => clearInterval(t);
  }, [ytId, phong.id]);
  useEffect(() => {
    if (!ytId) return;
    let destroyed = false;
    let retryTimer = null;
    let attempts = 0;
    if (ytPlayerRef.current && ytReadyRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
      try {
        if (currentYtIdRef.current !== ytId) {
          currentYtIdRef.current = ytId;
          durationRef.current = 0;
          setDuration(0);
          hasTriggeredSkipRef.current = false;
          isSkippingRef.current = false;
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
        console.warn("L\u1ED7i loadVideoById:", e);
      }
    }
    currentYtIdRef.current = ytId;
    hasSeekedInitRef.current = false;
    const khoiTaoPlayer = () => {
      if (destroyed) return;
      const el = document.getElementById(ytContainerId);
      if (!el) {
        if (attempts++ < 30) {
          retryTimer = setTimeout(khoiTaoPlayer, 100);
        }
        return;
      }
      if (!window.YT || !window.YT.Player) {
        if (attempts++ < 30) {
          retryTimer = setTimeout(khoiTaoPlayer, 150);
        }
        return;
      }
      try {
        ytPlayerRef.current = new window.YT.Player(el, {
          events: {
            onReady: (event) => {
              if (destroyed) return;
              ytReadyRef.current = true;
              setYtPlayerReady(true);
              if (event.target.getDuration) {
                const d = event.target.getDuration();
                if (d > 0) {
                  durationRef.current = d;
                  setDuration(d);
                }
              }
              const nowMs = Date.now();
              const updateTimeMs = watchState.updatedAt ? (/* @__PURE__ */ new Date(String(watchState.updatedAt).replace(" ", "T") + (String(watchState.updatedAt).includes("T") ? "" : "Z"))).getTime() : nowMs;
              const elapsedSec = Math.max(0, (nowMs - updateTimeMs) / 1e3);
              let tPos = Number(watchState.positionSeconds || 0);
              if (watchState.playing) {
                tPos = Number(watchState.basePositionSeconds != null ? watchState.basePositionSeconds : watchState.positionSeconds) + elapsedSec * (watchState.playbackRate || 1);
              }
              if (tPos > 0 && event.target.seekTo) {
                hasSeekedInitRef.current = true;
                try {
                  event.target.seekTo(tPos, true);
                } catch {
                }
              }
              if (watchState.playing && (canControl || hasInteractedRef.current || hasInteracted) && event.target.playVideo) {
                try {
                  event.target.playVideo();
                } catch {
                }
              }
            },
            onStateChange: (event) => {
              if (event.target && event.target.getDuration) {
                const d = event.target.getDuration();
                if (d > 0 && durationRef.current === 0) {
                  durationRef.current = d;
                  setDuration(d);
                }
              }
              if (event.data === 0) {
                if (canControl && !isSkippingRef.current && !hasTriggeredSkipRef.current) {
                  console.log("YT Player onStateChange === 0 (ENDED) -> t\u1EF1 \u0111\u1ED9ng chuy\u1EC3n ti\u1EBFp h\xE0ng \u0111\u1EE3i");
                  hanhDongQueue("skip");
                  return;
                }
              }
              if (canControl && !dangGuiLenh && !isSeekingRef.current) {
                if (event.data === 1 && !watchState.playing) {
                  guiLenh("play", event.target.getCurrentTime());
                } else if (event.data === 2 && watchState.playing) {
                  guiLenh("pause", event.target.getCurrentTime());
                }
              }
            }
          }
        });
      } catch (err) {
        console.warn("L\u1ED7i k\u1EBFt n\u1ED1i YouTube Player API:", err);
      }
    };
    napYouTubeIframeApi(() => {
      setTimeout(khoiTaoPlayer, 100);
    });
    return () => {
      destroyed = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [ytId, phong.id, canControl]);
  const apDungDongBo = (st, ctrl, prov) => {
    if (!st) return;
    const nowMs = Date.now();
    const updateTimeMs = st.updatedAt ? (/* @__PURE__ */ new Date(String(st.updatedAt).replace(" ", "T") + (String(st.updatedAt).includes("T") ? "" : "Z"))).getTime() : nowMs;
    const elapsedSec = Math.max(0, (nowMs - updateTimeMs) / 1e3);
    let targetPos = Number(st.positionSeconds || 0);
    if (st.playing) {
      targetPos = Number(st.basePositionSeconds != null ? st.basePositionSeconds : st.positionSeconds) + elapsedSec * (st.playbackRate || 1);
    }
    if (ctrl) {
      if (isSeekingRef.current) return;
      if (prov === "YOUTUBE" && ytPlayerRef.current?.getCurrentTime) {
        try {
          const cur = ytPlayerRef.current.getCurrentTime();
          if (cur > 0 && !isNaN(cur)) setLocalTime(Math.floor(cur));
        } catch {
        }
      }
      return;
    }
    setLocalTime(Math.max(0, Math.floor(targetPos)));
    if (prov === "NATIVE_HTML5" && videoRef.current) {
      const v = videoRef.current;
      if (!hasSeekedInitRef.current && targetPos > 0) {
        hasSeekedInitRef.current = true;
        v.currentTime = targetPos;
      }
      if (st.playing) {
        const drift = Math.abs(v.currentTime - targetPos);
        if (drift > 3) {
          v.currentTime = targetPos;
        }
        if (v.paused && (hasInteracted || hasInteractedRef.current)) {
          v.play().catch(() => {
          });
        }
      } else {
        if (!v.paused) v.pause();
        const drift = Math.abs(v.currentTime - st.positionSeconds);
        if (drift > 2) {
          v.currentTime = st.positionSeconds;
        }
      }
    } else if (prov === "YOUTUBE") {
      const ifr = document.getElementById(ytContainerId);
      const p = ytPlayerRef.current;
      let cur = null;
      let ps = null;
      if (p && typeof p.getCurrentTime === "function") {
        try {
          cur = p.getCurrentTime();
        } catch {
        }
      }
      if (p && typeof p.getPlayerState === "function") {
        try {
          ps = p.getPlayerState();
        } catch {
        }
      }
      if (!hasSeekedInitRef.current && targetPos > 0) {
        hasSeekedInitRef.current = true;
        if (p?.seekTo) {
          try {
            p.seekTo(targetPos, true);
          } catch {
          }
        }
        ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [targetPos, true] }), "*");
      }
      if (cur !== null && !isNaN(cur)) {
        const drift = Math.abs(cur - targetPos);
        if (st.playing) {
          if (drift > 4) {
            if (p?.seekTo) {
              try {
                p.seekTo(targetPos, true);
              } catch {
              }
            }
            ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [targetPos, true] }), "*");
          }
          if ((ps === 2 || ps === 5) && (hasInteracted || hasInteractedRef.current)) {
            if (p?.playVideo) {
              try {
                p.playVideo();
              } catch {
              }
            }
            ifr?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
          }
        } else {
          if (ps === 1) {
            if (p?.pauseVideo) {
              try {
                p.pauseVideo();
              } catch {
              }
            }
            ifr?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
          }
          if (drift > 2) {
            if (p?.seekTo) {
              try {
                p.seekTo(st.positionSeconds, true);
              } catch {
              }
            }
            ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [st.positionSeconds, true] }), "*");
          }
        }
      } else {
        if (targetPos > 0 && (hasInteracted || hasInteractedRef.current)) {
          ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [targetPos, true] }), "*");
          if (st.playing) {
            ifr?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
          }
        }
      }
    }
  };
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
          setProvider(d.provider || "UNSUPPORTED");
          if (d.phong?.videoUrl && d.phong.videoUrl !== activeVideoUrl) {
            setActiveVideoUrl(d.phong.videoUrl);
          }
          apDungDongBo(d.state, Boolean(d.canControl), d.provider || "UNSUPPORTED");
        }
      } catch {
      }
    };
    fetchWatch();
    const timer = setInterval(khiHienThi(fetchWatch), 2500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [phong.id, hasInteracted]);
  useEffect(() => {
    if (!watchState.playing) return;
    const tick = setInterval(() => {
      if (isSeekingRef.current) return;
      let curTime = null;
      if (provider === "YOUTUBE" && ytPlayerRef.current) {
        try {
          const p = ytPlayerRef.current;
          if (p.getDuration) {
            const d = p.getDuration();
            if (d > 0) {
              durationRef.current = d;
              if (duration === 0) setDuration(d);
            }
          }
          if (p.getCurrentTime) {
            const cur = p.getCurrentTime();
            if (cur !== void 0 && cur !== null && !isNaN(cur)) {
              curTime = cur;
              setLocalTime(Math.floor(cur));
            }
          }
          if (p.getPlayerState && p.getPlayerState() === 0) {
            if (canControl && !isSkippingRef.current && !hasTriggeredSkipRef.current) {
              console.log("PlayerState === 0 -> t\u1EF1 \u0111\u1ED9ng chuy\u1EC3n ti\u1EBFp h\xE0ng \u0111\u1EE3i");
              hanhDongQueue("skip");
              return;
            }
          }
        } catch {
        }
      }
      const maxDur = durationRef.current || duration;
      const currentPos = curTime !== null ? curTime : localTime;
      if (maxDur > 5 && (currentPos >= maxDur - 1.2 || localTime >= maxDur)) {
        if (canControl && !isSkippingRef.current && !hasTriggeredSkipRef.current) {
          console.log(`Positional Watchdog: currentPos (${currentPos.toFixed(1)}s) >= duration (${maxDur}s) -> t\u1EF1 \u0111\u1ED9ng chuy\u1EC3n ti\u1EBFp`);
          hanhDongQueue("skip");
          return;
        }
      }
      if (canControl && curTime !== null && curTime > 0 && !dangGuiLenh && !isSeekingRef.current) {
        const nowMs = Date.now();
        const updateTimeMs = watchState.updatedAt ? (/* @__PURE__ */ new Date(String(watchState.updatedAt).replace(" ", "T") + (String(watchState.updatedAt).includes("T") ? "" : "Z"))).getTime() : nowMs;
        const elapsedSec = Math.max(0, (nowMs - updateTimeMs) / 1e3);
        const expectedServerPos = Number(watchState.basePositionSeconds != null ? watchState.basePositionSeconds : watchState.positionSeconds) + elapsedSec * (watchState.playbackRate || 1);
        const hostDrift = Math.abs(curTime - expectedServerPos);
        if (hostDrift > 4 || nowMs - lastHostSyncTimeRef.current > 2e4 && hostDrift > 2) {
          lastHostSyncTimeRef.current = nowMs;
          guiLenh("seek", curTime);
        }
      }
      if (curTime === null) {
        setLocalTime((t) => maxDur > 0 ? Math.min(t + 1, Math.floor(maxDur)) : t + 1);
      }
    }, 1e3);
    return () => clearInterval(tick);
  }, [watchState.playing, provider, duration, localTime, canControl]);
  const guiLenh = async (action, customPos) => {
    if (dangGuiLenh) return;
    setDangGuiLenh(true);
    setLoi("");
    let pos = customPos;
    if (pos === void 0) {
      if (provider === "NATIVE_HTML5" && videoRef.current) {
        pos = videoRef.current.currentTime;
      } else if (provider === "YOUTUBE" && ytPlayerRef.current?.getCurrentTime) {
        pos = ytPlayerRef.current.getCurrentTime();
      } else {
        pos = localTime;
      }
    }
    pos = Math.max(0, Number((pos || 0).toFixed(2)));
    if (action === "play") {
      if (provider === "NATIVE_HTML5" && videoRef.current) videoRef.current.play().catch(() => {
      });
      else if (provider === "YOUTUBE") {
        if (ytPlayerRef.current?.playVideo) {
          try {
            ytPlayerRef.current.playVideo();
          } catch {
          }
        }
        const ifr = document.getElementById(ytContainerId);
        ifr?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
      }
    } else if (action === "pause") {
      if (provider === "NATIVE_HTML5" && videoRef.current) videoRef.current.pause();
      else if (provider === "YOUTUBE") {
        if (ytPlayerRef.current?.pauseVideo) {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch {
          }
        }
        const ifr = document.getElementById(ytContainerId);
        ifr?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
      }
    } else if (action === "seek") {
      if (provider === "NATIVE_HTML5" && videoRef.current) videoRef.current.currentTime = pos;
      else if (provider === "YOUTUBE") {
        if (ytPlayerRef.current?.seekTo) {
          try {
            ytPlayerRef.current.seekTo(pos, true);
          } catch {
          }
        }
        const ifr = document.getElementById(ytContainerId);
        ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [pos, true] }), "*");
      }
    }
    try {
      const res = await fetch("/api/phong-watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phongId: phong.id,
          action,
          position: pos,
          expectedRevision: watchState.revision,
          playbackRate: watchState.playbackRate || 1
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
        setLoi(d.loi || "L\u1ED7i c\u1EADp nh\u1EADt ph\xE1t video.");
      }
    } catch {
      setLoi("M\u1EA5t k\u1EBFt n\u1ED1i m\xE1y ch\u1EE7.");
    } finally {
      setDangGuiLenh(false);
    }
  };
  useEffect(() => {
    if (videoTimeRef) videoTimeRef.current = localTime;
  }, [localTime, videoTimeRef]);
  useEffect(() => {
    const onSeekReq = (e) => {
      if (e.detail?.phongId && String(e.detail.phongId) !== String(phong?.id)) return;
      const sec = Math.max(0, Number(e.detail?.sec) || 0);
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true;
        setHasInteracted(true);
      }
      setLocalTime(Math.floor(sec));
      if (provider === "NATIVE_HTML5" && videoRef.current) {
        videoRef.current.currentTime = sec;
      } else if (provider === "YOUTUBE") {
        if (ytPlayerRef.current?.seekTo) {
          try {
            ytPlayerRef.current.seekTo(sec, true);
          } catch {
          }
        }
        const ifr = document.getElementById(ytContainerId);
        ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [sec, true] }), "*");
      }
      if (canControl) {
        guiLenh("seek", sec);
      }
    };
    window.addEventListener("sr-seek", onSeekReq);
    return () => window.removeEventListener("sr-seek", onSeekReq);
  }, [phong?.id, canControl, provider, watchState?.revision]);
  const handleStartViewing = () => {
    hasInteractedRef.current = true;
    setHasInteracted(true);
    const nowMs = Date.now();
    const updateTimeMs = watchState.updatedAt ? (/* @__PURE__ */ new Date(String(watchState.updatedAt).replace(" ", "T") + (String(watchState.updatedAt).includes("T") ? "" : "Z"))).getTime() : nowMs;
    const elapsedSec = Math.max(0, (nowMs - updateTimeMs) / 1e3);
    let targetPos = Number(watchState.positionSeconds || 0);
    if (watchState.playing) {
      targetPos = Number(watchState.basePositionSeconds != null ? watchState.basePositionSeconds : watchState.positionSeconds) + elapsedSec * (watchState.playbackRate || 1);
    }
    targetPos = Math.max(0, Number(targetPos.toFixed(2)));
    hasSeekedInitRef.current = true;
    setLocalTime(Math.floor(targetPos));
    if (provider === "NATIVE_HTML5" && videoRef.current) {
      const v = videoRef.current;
      if (targetPos > 0) v.currentTime = targetPos;
      if (watchState.playing) {
        v.play().catch(() => {
        });
      } else {
        v.pause();
      }
    } else if (provider === "YOUTUBE") {
      const ifr = document.getElementById(ytContainerId);
      if (targetPos > 0) {
        if (ytPlayerRef.current?.seekTo) {
          try {
            ytPlayerRef.current.seekTo(targetPos, true);
          } catch {
          }
        }
        ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [targetPos, true] }), "*");
      }
      if (watchState.playing) {
        if (ytPlayerRef.current?.playVideo) {
          try {
            ytPlayerRef.current.playVideo();
          } catch {
          }
        }
        ifr?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
      } else {
        if (ytPlayerRef.current?.pauseVideo) {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch {
          }
        }
        ifr?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
      }
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-4 min-w-0 w-full" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-full aspect-video bg-gradient-to-b from-[#05070b] to-black rounded-2xl overflow-hidden border border-[#00F2FE]/15 ring-1 ring-white/5 shadow-[0_0_60px_rgba(0,242,254,0.07),0_30px_60px_-15px_rgba(0,0,0,0.7)]" }, !hasInteracted && !canControl && (provider === "YOUTUBE" || provider === "NATIVE_HTML5") && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 z-20 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "w-14 h-14 rounded-full bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40 flex items-center justify-center text-2xl mb-3 shadow-[0_0_25px_rgba(0,242,254,0.35)] animate-pulse" }, "\u{1F3AC}"), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-black text-white mb-1" }, "Xem Chung C\xF9ng Ph\xF2ng"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-300 max-w-xs mb-4" }, "B\u1EA5m n\xFAt b\xEAn d\u01B0\u1EDBi \u0111\u1EC3 c\u1EA5p quy\u1EC1n \xE2m thanh v\xE0 c\xF9ng theo d\xF5i timeline v\u1EDBi ch\u1EE7 ph\xF2ng."), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-viewer-start-watch",
      type: "button",
      onClick: handleStartViewing,
      className: "px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#3B82F6] text-black font-black text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u25B6"),
    /* @__PURE__ */ React.createElement("span", null, "B\u1EAFt \u0111\u1EA7u xem c\xF9ng ph\xF2ng")
  )), ytId ? /* @__PURE__ */ React.createElement("div", { key: `yt-wrap-${phong.id}`, className: "w-full h-full relative flex items-center justify-center bg-black" }, /* @__PURE__ */ React.createElement(
    "iframe",
    {
      id: ytContainerId,
      key: `yt-frame-${phong.id}`,
      src: `https://www.youtube.com/embed/${ytId}?enablejsapi=1&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}&widget_referrer=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&rel=0&modestbranding=1&playsinline=1`,
      title: phong.ten || "YouTube Video",
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
      allowFullScreen: true,
      className: "w-full h-full border-0"
    }
  )) : drvId ? /* @__PURE__ */ React.createElement(
    "iframe",
    {
      src: `https://drive.google.com/file/d/${drvId}/preview`,
      title: phong.ten,
      allow: "autoplay; fullscreen",
      allowFullScreen: true,
      className: "w-full h-full"
    }
  ) : trucTiepUrl ? /* @__PURE__ */ React.createElement(
    "video",
    {
      ref: videoRef,
      src: trucTiepUrl,
      playsInline: true,
      "data-testid": "study-video-player",
      controls: canControl,
      className: "w-full h-full object-contain",
      onLoadedMetadata: (e) => {
        if (e.target.duration > 0) setDuration(e.target.duration);
      },
      onPlay: () => {
        if (canControl && !watchState.playing && !dangGuiLenh) {
          guiLenh("play", videoRef.current?.currentTime);
        }
      },
      onPause: () => {
        if (canControl && watchState.playing && !dangGuiLenh) {
          guiLenh("pause", videoRef.current?.currentTime);
        }
      },
      onEnded: () => {
        if (canControl) hanhDongQueue("skip");
      },
      onSeeked: () => {
        if (!canControl || dangGuiLenh || isSeekingRef.current) return;
        const cur = videoRef.current?.currentTime;
        if (cur === void 0) return;
        const st = watchState;
        const updMs = st?.updatedAt ? (/* @__PURE__ */ new Date(String(st.updatedAt).replace(" ", "T") + (String(st.updatedAt).includes("T") ? "" : "Z"))).getTime() : Date.now();
        const elapsed = Math.max(0, (Date.now() - updMs) / 1e3);
        const kyVong = st?.playing ? Number(st.basePositionSeconds || 0) + elapsed * (st.playbackRate || 1) : Number(st?.positionSeconds || 0);
        if (Math.abs(cur - kyVong) > 1.5) guiLenh("seek", cur);
      }
    }
  ) : /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center h-full text-xs text-slate-500 p-6 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl mb-2" }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "Link video kh\xF4ng h\u1ED7 tr\u1EE3 ph\xE1t tr\u1EF1c ti\u1EBFp ho\u1EB7c kh\xF4ng h\u1EE3p l\u1EC7."))), drvId && /* @__PURE__ */ React.createElement("div", { className: "px-3.5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-300" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm" }, "\u2139\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "Google Drive ph\xE1t \u1EDF ch\u1EBF \u0111\u1ED9 ", /* @__PURE__ */ React.createElement("strong", null, "Xem \u0111\u1ED9c l\u1EADp"), " (Google Drive kh\xF4ng h\u1ED7 tr\u1EE3 API \u0111i\u1EC1u khi\u1EC3n t\u1EEB xa).")), !isRoomWide && /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-b from-[#161b26] to-[#0f141d] border border-[#00F2FE]/10 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-3 shadow-xl" }, canControl && (provider === "NATIVE_HTML5" || provider === "YOUTUBE") && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-white/10" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-host-watch-toggle",
      type: "button",
      onClick: () => guiLenh(watchState.playing ? "pause" : "play"),
      disabled: dangGuiLenh,
      className: `w-full sm:w-auto px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-50 ${watchState.playing ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]" : "bg-gradient-to-r from-[#00F2FE] to-[#00c6ff] text-black shadow-[0_0_15px_rgba(0,242,254,0.35)] hover:brightness-110"}`
    },
    /* @__PURE__ */ React.createElement("span", null, watchState.playing ? "\u23F8" : "\u25B6"),
    /* @__PURE__ */ React.createElement("span", null, watchState.playing ? "T\u1EA1m D\u1EEBng C\u1EA3 Ph\xF2ng" : "Ph\xE1t Chung C\u1EA3 Ph\xF2ng")
  ), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex items-center gap-2.5 w-full" }, /* @__PURE__ */ React.createElement("span", { id: "host-duration-label", className: "text-[11px] font-mono text-slate-400 shrink-0" }, dinhDangGiayPhut(localTime)), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "host-seek-slider",
      type: "range",
      min: "0",
      max: duration > 0 ? duration : Math.max(localTime, 300),
      step: "1",
      value: localTime,
      onMouseDown: () => {
        isSeekingRef.current = true;
      },
      onTouchStart: () => {
        isSeekingRef.current = true;
      },
      onChange: (e) => setLocalTime(Number(e.target.value)),
      onMouseUp: (e) => {
        isSeekingRef.current = false;
        guiLenh("seek", Number(e.target.value));
      },
      onTouchEnd: (e) => {
        isSeekingRef.current = false;
        guiLenh("seek", Number(e.target.value));
      },
      className: "flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00F2FE]"
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono text-slate-400 shrink-0" }, duration > 0 ? dinhDangGiayPhut(duration) : "--:--"))), loi && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-400" }, loi), phong.moTa && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 leading-relaxed pt-1" }, phong.moTa)), !isRoomWide && /* @__PURE__ */ React.createElement("div", { id: "vung1-youtube-studio", style: { overflowAnchor: "none" }, className: "bg-gradient-to-b from-[#161b26] to-[#0f141d] border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 pb-2.5 border-b border-white/10 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-8 h-8 rounded-xl bg-gradient-to-br from-[#00F2FE]/20 to-violet-500/20 text-[#00F2FE] border border-[#00F2FE]/30 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(0,242,254,0.25)]" }, "\u{1F3AC}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "text-xs sm:text-sm font-black text-white flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "C\u1EA5u h\xECnh Video & H\xE0ng \u0111\u1EE3i YouTube"), queueList.filter((q) => q.trangThai === "queued").length > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded-full bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 text-[10px] font-bold" }, queueList.filter((q) => q.trangThai === "queued").length, " \u0111ang ch\u1EDD")), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-400" }, "T\xECm ki\u1EBFm video, \u0111\u01B0a v\xE0o h\xE0ng ch\u1EDD v\xE0 ch\u1EA1y video kh\xE1c \u0111\u1ED3ng b\u1ED9 c\u1EA3 ph\xF2ng"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center bg-[#0B0E14] p-1 rounded-xl border border-white/10" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-media-tab-search",
      onClick: () => setMediaTab("search"),
      className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${mediaTab === "search" ? "bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black shadow-md" : "text-slate-400 hover:text-white"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F50D}"),
    /* @__PURE__ */ React.createElement("span", null, "T\xECm YouTube")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-media-tab-queue",
      onClick: () => setMediaTab("queue"),
      className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${mediaTab === "queue" ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md" : "text-slate-400 hover:text-white"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"),
    /* @__PURE__ */ React.createElement("span", null, "H\xE0ng \u0111\u1EE3i (", queueList.filter((q) => q.trangThai === "queued").length, ")")
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-toggle-studio",
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        const curY = window.scrollY;
        setDaMoRongStudio((prev) => !prev);
        requestAnimationFrame(() => {
          if (window.scrollY !== curY) {
            window.scrollTo({ top: curY, behavior: "instant" });
          }
        });
      },
      title: daMoRongStudio ? "Thu g\u1ECDn" : "M\u1EDF r\u1ED9ng",
      className: "w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
    },
    daMoRongStudio ? "\u25B2" : "\u25BC"
  ))), thongBaoVideo && /* @__PURE__ */ React.createElement("div", { className: "px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn" }, /* @__PURE__ */ React.createElement("span", null, "\u2728"), /* @__PURE__ */ React.createElement("span", null, thongBaoVideo)), loiVideo && /* @__PURE__ */ React.createElement("div", { className: "px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fadeIn" }, /* @__PURE__ */ React.createElement("span", null, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("span", null, loiVideo)), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `transition-all duration-300 ease-in-out overflow-hidden flex flex-col min-h-0 ${daMoRongStudio ? "max-h-[380px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`,
      style: { overflowAnchor: "none" }
    },
    /* @__PURE__ */ React.createElement("div", { className: "h-[340px] flex flex-col min-h-0 overflow-hidden shrink-0" }, mediaTab === "search" && /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col gap-2.5 min-h-0" }, /* @__PURE__ */ React.createElement("form", { onSubmit: (e) => timKiemYouTube(e), className: "flex flex-col gap-2 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "relative flex-1" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" }, "\u{1F50D}"), /* @__PURE__ */ React.createElement(
      "input",
      {
        id: "input-vung1-youtube-search",
        type: "text",
        value: ytQuery,
        onChange: (e) => setYtQuery(e.target.value),
        placeholder: "Nh\u1EADp t\u1EEB kh\xF3a t\xECm ki\u1EBFm YouTube (vd: lofi h\u1ECDc b\xE0i...) ho\u1EB7c d\xE1n link video...",
        className: "w-full bg-[#0B0E14] border border-white/10 focus:border-[#00F2FE]/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
      }
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        id: "btn-vung1-tim-kiem",
        disabled: !ytQuery.trim() || searchingYt,
        className: "px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-md disabled:opacity-40 whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
      },
      searchingYt ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "animate-spin" }, "\u23F3"), /* @__PURE__ */ React.createElement("span", null, "\u0110ang t\xECm...")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", null, "\u{1F50D}"), /* @__PURE__ */ React.createElement("span", null, "T\xECm ki\u1EBFm"))
    )), Boolean(ytQuery.trim().startsWith("http://") || ytQuery.trim().startsWith("https://") || ytQuery.includes("youtu")) && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 p-2 rounded-xl bg-[#0B0E14]/80 border border-[#00F2FE]/20 flex-wrap animate-fadeIn" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-slate-400 flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F517}"), /* @__PURE__ */ React.createElement("span", null, "Ph\xE1t hi\u1EC7n li\xEAn k\u1EBFt video:")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        id: "btn-vung1-phat-ngay-link",
        onClick: () => doiVideo(ytQuery.trim(), "Video t\u1EEB li\xEAn k\u1EBFt"),
        disabled: dangDoiVideo,
        className: "px-2.5 py-1 rounded-lg bg-[#00F2FE] text-black text-xs font-black hover:bg-[#00e1ec] active:scale-95 shadow-sm"
      },
      "\u25B6 Ph\xE1t ngay c\u1EA3 ph\xF2ng"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        id: "btn-vung1-enqueue-link",
        onClick: () => hanhDongQueue("enqueue", { videoUrl: ytQuery.trim(), title: "Video t\u1EEB li\xEAn k\u1EBFt" }),
        disabled: queueBusy,
        className: "px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30"
      },
      "+ Th\xEAm v\xE0o cu\u1ED1i h\xE0ng \u0111\u1EE3i"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        id: "btn-vung1-add-next-link",
        onClick: () => hanhDongQueue("add_next", { videoUrl: ytQuery.trim(), title: "Video t\u1EEB li\xEAn k\u1EBFt" }),
        disabled: queueBusy,
        className: "px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-bold hover:bg-violet-500/30"
      },
      "+ Ph\xE1t k\u1EBF ti\u1EBFp"
    ))), searchLoi && /* @__PURE__ */ React.createElement("div", { className: "p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between shrink-0" }, /* @__PURE__ */ React.createElement("span", null, "\u26A0\uFE0F ", searchLoi), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setSearchLoi(""), className: "text-amber-400 font-bold hover:underline" }, "\u0110\xF3ng")), ytResults.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-1.5 min-h-0 overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-xs text-slate-400 shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-300 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4FA}"), /* @__PURE__ */ React.createElement("span", null, "K\u1EBFt qu\u1EA3 YouTube (", ytResults.length, " video):")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        id: "btn-vung1-dong-ket-qua",
        onClick: () => {
          setYtResults([]);
          setSearchLoi("");
        },
        className: "px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-bold cursor-pointer"
      },
      "\u2715 \u0110\xF3ng k\u1EBFt qu\u1EA3"
    )), /* @__PURE__ */ React.createElement("div", { className: "flex-1 space-y-2 overflow-y-auto pr-1 min-h-0" }, ytResults.map((item, idx) => {
      const vUrl = `https://www.youtube.com/watch?v=${item.videoId}`;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: item.videoId || idx,
          className: "group bg-[#0B0E14] hover:bg-[#121721] border border-white/10 hover:border-[#00F2FE]/30 rounded-xl p-2.5 flex items-center gap-3 transition-all"
        },
        /* @__PURE__ */ React.createElement("div", { className: "relative w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-white/5" }, /* @__PURE__ */ React.createElement(
          "img",
          {
            src: item.thumbnail,
            alt: item.title,
            className: "w-full h-full object-cover group-hover:scale-105 transition-transform",
            loading: "lazy"
          }
        ), /* @__PURE__ */ React.createElement("span", { className: "absolute bottom-1 right-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono text-white" }, "YouTube")),
        /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("h5", { className: "text-xs font-bold text-slate-200 line-clamp-2 group-hover:text-[#00F2FE] transition-colors", title: item.title }, item.title), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-1 text-[10px] text-slate-400 truncate" }, /* @__PURE__ */ React.createElement("span", null, item.channelTitle || "K\xEAnh YouTube"), item.publishedAt && /* @__PURE__ */ React.createElement("span", null, "\u2022 ", item.publishedAt))),
        /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row items-center gap-1.5 shrink-0" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            title: "Ch\u1EA1y video n\xE0y ngay l\u1EADp t\u1EE9c cho c\u1EA3 ph\xF2ng",
            onClick: () => doiVideo(vUrl, item.title),
            disabled: dangDoiVideo,
            className: "px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00F2FE] to-[#00c6ff] text-black font-black text-[11px] shadow-sm hover:brightness-110 active:scale-95 disabled:opacity-40 whitespace-nowrap cursor-pointer"
          },
          "\u25B6 Ph\xE1t ngay"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            title: "Th\xEAm v\xE0o cu\u1ED1i h\xE0ng \u0111\u1EE3i",
            onClick: () => hanhDongQueue("enqueue", { videoUrl: vUrl, title: item.title }),
            disabled: queueBusy,
            className: "px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 text-[11px] font-bold active:scale-95 disabled:opacity-40 whitespace-nowrap cursor-pointer"
          },
          "+ H\xE0ng ch\u1EDD"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            title: "Th\xEAm \u0111\u1EC3 ph\xE1t k\u1EBF ti\u1EBFp sau video hi\u1EC7n t\u1EA1i",
            onClick: () => hanhDongQueue("add_next", { videoUrl: vUrl, title: item.title }),
            disabled: queueBusy,
            className: "px-2.5 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 text-[10px] font-bold active:scale-95 disabled:opacity-40 whitespace-nowrap cursor-pointer"
          },
          "+ K\u1EBF ti\u1EBFp"
        ))
      );
    }))) : (
      /* Gợi ý từ khóa tìm kiếm nhanh + khung thông tin giữ chiều cao cố định */
      /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col justify-between gap-2 min-h-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1.5 shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-wider" }, "G\u1EE3i \xFD ch\u1EE7 \u0111\u1EC1 h\u1ECDc t\u1EADp & th\u01B0 gi\xE3n:"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 flex-wrap" }, [
        { label: "\u{1F3A7} Lofi h\u1ECDc t\u1EADp", q: "lofi hip hop radio beats to relax study to" },
        { label: "\u{1F327}\uFE0F Ti\u1EBFng m\u01B0a & Piano", q: "rain sounds relaxing piano study focus" },
        { label: "\u2615 Nh\u1EA1c qu\xE1n c\xE0 ph\xEA", q: "coffee shop jazz piano chill study" },
        { label: "\u{1F4DA} T\u1EADp trung \xF4n thi", q: "study music alpha waves concentration" },
        { label: "\u{1F52C} Th\xED nghi\u1EC7m H\xF3a h\u1ECDc", q: "th\xED nghi\u1EC7m h\xF3a h\u1ECDc th\xFA v\u1ECB" }
      ].map((chip) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: chip.q,
          type: "button",
          onClick: (e) => timKiemYouTube(e, chip.q),
          className: "px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-[#00F2FE] border border-white/10 text-[11px] transition-all cursor-pointer"
        },
        chip.label
      )))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col items-center justify-center p-3 bg-[#0B0E14]/60 border border-white/5 rounded-xl text-center text-xs text-slate-400 gap-1 min-h-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, "\u{1F4FA}"), /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-300" }, "T\xECm ki\u1EBFm & Ph\xE1t video YouTube"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 max-w-sm" }, "Nh\u1EADp t\u1EEB kh\xF3a b\xE0i h\u1ECDc ho\u1EB7c d\xE1n li\xEAn k\u1EBFt YouTube \u1EDF tr\xEAn \u0111\u1EC3 t\xECm ki\u1EBFm v\xE0 ph\xE1t \u0111\u1ED3ng b\u1ED9 cho t\u1EA5t c\u1EA3 th\xE0nh vi\xEAn trong ph\xF2ng.")))
    )), mediaTab === "queue" && /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col gap-2.5 min-h-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between flex-wrap gap-2 shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-slate-300 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"), /* @__PURE__ */ React.createElement("span", null, "H\xE0ng \u0111\u1EE3i video (", queueList.filter((q) => q.trangThai === "queued").length, " ch\u1EDD)")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, queueList.some((q) => q.trangThai === "queued") && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        id: "btn-vung1-queue-skip",
        onClick: () => hanhDongQueue("skip"),
        disabled: queueBusy,
        className: "px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/25 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u23ED"),
      /* @__PURE__ */ React.createElement("span", null, "B\u1ECF qua / B\xE0i ti\u1EBFp")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: taiQueue,
        title: "L\xE0m m\u1EDBi h\xE0ng \u0111\u1EE3i",
        className: "px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs border border-white/10 cursor-pointer"
      },
      "\u{1F504}"
    ))), /* @__PURE__ */ React.createElement("div", { className: "shrink-0" }, /* @__PURE__ */ React.createElement(
      QueueInput,
      {
        onAdd: (u, t) => hanhDongQueue("enqueue", { videoUrl: u, title: t }),
        onAddNext: (u, t) => hanhDongQueue("add_next", { videoUrl: u, title: t })
      }
    )), queueList.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col items-center justify-center p-4 bg-[#0B0E14]/60 border border-white/5 rounded-xl text-center text-xs text-slate-400 gap-1.5 min-h-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u{1F4CB}"), /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-300" }, "H\xE0ng \u0111\u1EE3i hi\u1EC7n \u0111ang tr\u1ED1ng"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 max-w-sm" }, "Chuy\u1EC3n sang tab ", /* @__PURE__ */ React.createElement("strong", null, "T\xECm YouTube"), " ho\u1EB7c d\xE1n li\xEAn k\u1EBFt v\xE0o \xF4 tr\xEAn \u0111\u1EC3 \u0111\u01B0a video v\xE0o danh s\xE1ch ph\xE1t li\xEAn t\u1EE5c.")) : /* @__PURE__ */ React.createElement("div", { className: "flex-1 space-y-1.5 overflow-y-auto pr-1 min-h-0" }, queueList.map((q, idx) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: q.id || idx,
        className: `flex items-center gap-2.5 bg-[#0B0E14] border rounded-xl p-2 transition-all ${q.trangThai === "playing" ? "border-emerald-500/40 shadow-[0_0_15px_rgba(52,211,153,0.15)] bg-emerald-950/20" : "border-white/5 hover:border-white/15"}`
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          className: `w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${q.trangThai === "playing" ? "bg-emerald-500 text-black shadow-[0_0_10px_rgba(52,211,153,0.4)]" : "bg-white/10 text-slate-400"}`
        },
        q.trangThai === "playing" ? "\u25B6" : idx + 1
      ),
      q.thumb && /* @__PURE__ */ React.createElement("img", { src: q.thumb, alt: "", className: "w-12 h-7 rounded-md object-cover shrink-0 border border-white/10", loading: "lazy" }),
      /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-200 font-bold truncate" }, q.title || q.videoUrl), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 truncate" }, q.trangThai === "playing" ? /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-bold" }, "\u25CF \u0110ang ph\xE1t") : /* @__PURE__ */ React.createElement("span", null, "Th\xEAm b\u1EDFi: ", q.addedBy || "Th\xE0nh vi\xEAn"))),
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 shrink-0" }, q.trangThai === "queued" && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          title: "Ph\xE1t video n\xE0y ngay",
          onClick: () => hanhDongQueue("play_now", { id: q.id }),
          disabled: queueBusy,
          className: "px-2.5 py-1 rounded-lg bg-[#00F2FE]/20 text-[#00F2FE] hover:bg-[#00F2FE]/30 text-xs font-black active:scale-95 cursor-pointer"
        },
        "\u25B6 Ph\xE1t"
      ), q.trangThai === "queued" && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          title: "X\xF3a kh\u1ECFi h\xE0ng \u0111\u1EE3i",
          onClick: () => hanhDongQueue("remove", { id: q.id }),
          disabled: queueBusy,
          className: "w-7 h-7 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-xs font-black flex items-center justify-center active:scale-95 cursor-pointer"
        },
        "\u2715"
      ))
    )))))
  )));
}
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
    phase: "focus",
    status: "paused",
    durationSeconds: 1500,
    remainingSeconds: 1500,
    preset: "25_5",
    revision: 1,
    canControl: false,
    updatedAt: null,
    serverNow: null
  });
  const [localRemaining, setLocalRemaining] = useState(1500);
  const [dangGuiLenh, setDangGuiLenh] = useState(false);
  const [loi, setLoi] = useState("");
  let cauHinh = {};
  try {
    cauHinh = phong.cauHinh ? JSON.parse(phong.cauHinh) : {};
  } catch {
  }
  const nhacUrl = cauHinh.nhacUrl ? urlMediaFe(cauHinh.nhacUrl) : "";
  const audioRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.5);
  const [audioMuted, setAudioMuted] = useState(false);
  const [hasInteractedAudio, setHasInteractedAudio] = useState(false);
  const [canControl, setCanControl] = useState(Boolean(auth.user?.isTeacher || phong?.canControl || phong?.laChuPhong));
  const isHost = canControl;
  const apDungFocusState = (st) => {
    if (!st) return;
    setFocusState(st);
    const rem = Number(st.remainingSeconds ?? 1500);
    setLocalRemaining(rem);
  };
  useEffect(() => {
    let active = true;
    const fetchFocus = async () => {
      try {
        const res = await fetch(`/api/phong-focus?phongId=${encodeURIComponent(phong.id)}`);
        if (!res.ok) return;
        const d = await res.json();
        if (active && d.ok && d.state) {
          if (typeof d.canControl === "boolean") {
            setCanControl(d.canControl);
          }
          apDungFocusState(d.state);
        }
      } catch {
      }
    };
    fetchFocus();
    const timer = setInterval(fetchFocus, 3e3);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && active) {
        fetchFocus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [phong.id]);
  useEffect(() => {
    if (focusState.status !== "running") return;
    const tick = setInterval(() => {
      setLocalRemaining((r) => Math.max(0, r - 1));
    }, 1e3);
    return () => clearInterval(tick);
  }, [focusState.status]);
  const guiLenh = async (action, extraPayload = {}) => {
    if (dangGuiLenh) return;
    setDangGuiLenh(true);
    setLoi("");
    try {
      const res = await fetch("/api/phong-focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        apDungFocusState(d.state);
        setLoi("\u0110\xE3 \u0111\u1ED3ng b\u1ED9 l\u1EA1i phi\xEAn theo m\xE1y ch\u1EE7.");
      } else {
        setLoi(d.loi || "Kh\xF4ng th\u1EC3 c\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i ph\xF2ng h\u1ECDc t\u1EADp.");
      }
    } catch {
      setLoi("L\u1ED7i k\u1EBFt n\u1ED1i m\xE1y ch\u1EE7.");
    } finally {
      setDangGuiLenh(false);
    }
  };
  const batAmThanh = () => {
    setHasInteractedAudio(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setAudioPlaying(true);
      }).catch((err) => {
        console.warn("Autoplay blocked or audio load error:", err);
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
  const isBreak = focusState.phase === "break";
  const isRunning = focusState.status === "running";
  const duration = focusState.durationSeconds || (isBreak ? 300 : 1500);
  const progressPercent = Math.min(100, Math.max(0, (duration - localRemaining) / duration * 100));
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-4 min-w-0 w-full" }, nhacUrl && /* @__PURE__ */ React.createElement(
    "audio",
    {
      ref: audioRef,
      src: nhacUrl,
      loop: true,
      preload: "none",
      onEnded: () => setAudioPlaying(false),
      onError: () => setAudioPlaying(false)
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "bg-[#151A23] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-1 rounded-full text-[10px] font-bold border ${phong.phamVi === "truong" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-slate-400 border-white/10"}` }, phong.phamVi === "truong" ? "\u{1F310} To\xE0n tr\u01B0\u1EDDng" : `\u{1F512} L\u1EDBp ${phong.lopTen || ""}`), /* @__PURE__ */ React.createElement("span", { id: "focus-host-badge", className: "text-[11px] text-slate-400" }, "Ch\u1EE7 ph\xF2ng: ", /* @__PURE__ */ React.createElement("strong", { className: "text-slate-200" }, phong.chuPhongTen)), /* @__PURE__ */ React.createElement("span", { id: "focus-room-presence", className: "text-[11px] px-2.5 py-0.5 rounded-full bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/20 font-semibold" }, "\u{1F465} ", soNguoi || 1, " ng\u01B0\u1EDDi \u0111ang c\xF9ng t\u1EADp trung")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 ml-auto" }, isFocusMode && /* @__PURE__ */ React.createElement("span", { id: "focus-mode-active-indicator", className: "text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 animate-pulse" }, "\u{1F3AF} \u0110ang b\u1EADt Focus Mode"), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-focus-mode-toggle",
      type: "button",
      onClick: () => setIsFocusMode(!isFocusMode),
      className: `px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${isFocusMode ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]" : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F3AF}"),
    /* @__PURE__ */ React.createElement("span", null, isFocusMode ? "\u21A9 Tho\xE1t Focus Mode" : "Focus Mode")
  ), canControl && phong.chuPhongKhoa !== "he-thong" && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: dongPhongHienTai,
      className: "px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 transition-all"
    },
    "\u0110\xF3ng ph\xF2ng"
  ))), /* @__PURE__ */ React.createElement("div", { className: `relative overflow-hidden rounded-3xl border transition-all p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl ${isBreak ? "bg-gradient-to-b from-[#1E1710] to-[#13110E] border-amber-500/30" : "bg-gradient-to-b from-[#0F1E28] to-[#0A1219] border-[#00F2FE]/30"}` }, /* @__PURE__ */ React.createElement("div", { className: `absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${isBreak ? "bg-amber-500" : "bg-[#00F2FE]"}` }), /* @__PURE__ */ React.createElement("div", { className: `absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${isBreak ? "bg-orange-500" : "bg-indigo-500"}` }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-center gap-2.5 mb-6 z-10" }, /* @__PURE__ */ React.createElement(
    "span",
    {
      id: "focus-phase-badge",
      className: `px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-sm ${isBreak ? "bg-amber-500/15 text-amber-300 border-amber-500/40" : "bg-[#00F2FE]/15 text-[#00F2FE] border-[#00F2FE]/40"}`
    },
    isBreak ? "\u2615 Gi\u1EDD Ngh\u1EC9 Ng\u01A1i (Break)" : "\u{1F345} Phi\xEAn T\u1EADp Trung (Focus)"
  ), /* @__PURE__ */ React.createElement(
    "span",
    {
      id: "focus-status-badge",
      className: `px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${isRunning ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-slate-500/15 text-slate-400 border-slate-500/30"}`
    },
    /* @__PURE__ */ React.createElement("span", { className: `w-2 h-2 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}` }),
    /* @__PURE__ */ React.createElement("span", null, isRunning ? "\u0110ang \u0111\u1EBFm" : "T\u1EA1m d\u1EEBng")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-focus-preset-toggle",
      type: "button",
      disabled: !canControl || dangGuiLenh,
      onClick: () => canControl && guiLenh("set_preset", { preset: focusState.preset === "50_10" ? "25_5" : "50_10" }),
      title: canControl ? "B\u1EA5m \u0111\u1EC3 \u0111\u1ED5i chu k\u1EF3 Pomodoro" : "Chu k\u1EF3 Pomodoro hi\u1EC7n t\u1EA1i",
      className: `px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all ${canControl ? "hover:scale-105 active:scale-95 cursor-pointer bg-white/10 text-white border-white/20" : "cursor-default bg-white/5 text-slate-400 border-white/10"}`
    },
    "\u2699\uFE0F ",
    focusState.preset === "50_10" ? "50 / 10 ph\xFAt" : "25 / 5 ph\xFAt"
  )), /* @__PURE__ */ React.createElement("div", { className: "my-2 sm:my-4 z-10" }, /* @__PURE__ */ React.createElement(
    "span",
    {
      id: "focus-timer-display",
      className: `font-mono text-6xl sm:text-8xl font-black tracking-widest block transition-all select-none ${isBreak ? "text-amber-300 drop-shadow-[0_0_35px_rgba(245,158,11,0.35)]" : "text-[#00F2FE] drop-shadow-[0_0_35px_rgba(0,242,254,0.35)]"}`
    },
    dinhDangGiayPhut(localRemaining)
  )), /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-md h-2 bg-black/40 rounded-full overflow-hidden border border-white/10 my-4 z-10" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `h-full transition-all duration-1000 ${isBreak ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-[#00F2FE] to-[#3B82F6]"}`,
      style: { width: `${progressPercent}%` }
    }
  )), canControl ? /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-center gap-3 mt-4 z-10" }, !isRunning ? /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-focus-start",
      type: "button",
      disabled: dangGuiLenh,
      onClick: () => guiLenh("start"),
      className: "px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-black font-black text-sm shadow-[0_0_20px_rgba(52,211,153,0.3)] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u25B6"),
    /* @__PURE__ */ React.createElement("span", null, "B\u1EAFt \u0111\u1EA7u")
  ) : /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-focus-pause",
      type: "button",
      disabled: dangGuiLenh,
      onClick: () => guiLenh("pause"),
      className: "px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-sm shadow-[0_0_20px_rgba(251,191,36,0.3)] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u23F8"),
    /* @__PURE__ */ React.createElement("span", null, "T\u1EA1m d\u1EEBng")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-focus-reset",
      type: "button",
      disabled: dangGuiLenh,
      onClick: () => guiLenh("reset"),
      className: "px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-sm font-bold border border-white/15 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F504}"),
    /* @__PURE__ */ React.createElement("span", null, "\u0110\u1EB7t l\u1EA1i")
  ), isBreak ? /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-focus-start-focus",
      type: "button",
      disabled: dangGuiLenh,
      onClick: () => guiLenh("start_focus"),
      className: "px-4 py-3 rounded-2xl bg-[#00F2FE]/20 hover:bg-[#00F2FE]/30 text-[#00F2FE] text-sm font-bold border border-[#00F2FE]/40 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F3AF}"),
    /* @__PURE__ */ React.createElement("span", null, "V\xE0o T\u1EADp trung")
  ) : /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-focus-start-break",
      type: "button",
      disabled: dangGuiLenh,
      onClick: () => guiLenh("start_break"),
      className: "px-4 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-bold border border-amber-500/40 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u2615"),
    /* @__PURE__ */ React.createElement("span", null, "Ngh\u1EC9 ng\u01A1i")
  )) : /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-3 z-10" }, "\u23F3 \u0110\u1ED3ng h\u1ED3 Pomodoro do ch\u1EE7 ph\xF2ng \u0111i\u1EC1u ph\u1ED1i \u2014 h\xE3y t\u1EADp trung h\u1EBFt m\xECnh v\xE0o c\xF4ng vi\u1EC7c/h\u1ECDc t\u1EADp nh\xE9!"), loi && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-400 mt-4 z-10" }, loi)), nhacUrl ? /* @__PURE__ */ React.createElement("div", { className: "bg-[#151A23] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3.5 min-w-0 w-full sm:w-auto" }, /* @__PURE__ */ React.createElement("div", { className: `w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 border transition-all ${audioPlaying ? "bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40 shadow-[0_0_15px_rgba(139,92,246,0.3)] animate-pulse" : "bg-white/5 text-slate-400 border-white/10"}` }, "\u{1F3A7}"), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-white truncate" }, "\xC2m thanh n\u1EC1n Ambient"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 truncate" }, audioPlaying ? "\u0110ang ph\xE1t kh\xF4ng gian h\u1ECDc t\u1EADp" : "\xC2m thanh c\u1EE5c b\u1ED9 theo thi\u1EBFt b\u1ECB"))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end" }, !hasInteractedAudio && !audioPlaying && /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-start-focus-audio",
      type: "button",
      onClick: batAmThanh,
      className: "px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white text-xs font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shrink-0"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F50A}"),
    /* @__PURE__ */ React.createElement("span", null, "B\u1EADt \xE2m thanh t\u1EADp trung")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "focus-audio-toggle",
      type: "button",
      onClick: toggleAudioPlay,
      className: `px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${audioPlaying ? "bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40" : "bg-white/5 text-slate-300 border-white/10"}`
    },
    /* @__PURE__ */ React.createElement("span", null, audioPlaying ? "\u23F8 T\u1EA1m d\u1EEBng" : "\u25B6 Ph\xE1t ti\u1EBFp")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: toggleAudioMute,
      className: "p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs transition-all"
    },
    audioMuted || audioVolume === 0 ? "\u{1F507}" : "\u{1F509}"
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "range",
      min: "0",
      max: "1",
      step: "0.05",
      value: audioMuted ? 0 : audioVolume,
      onChange: handleVolumeChange,
      className: "w-24 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]",
      title: "\xC2m l\u01B0\u1EE3ng nh\u1EA1c n\u1EC1n"
    }
  ))) : /* @__PURE__ */ React.createElement("div", { className: "bg-[#151A23] border border-white/5 rounded-2xl p-4 text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500" }, "\u2615 Ph\xF2ng \u1EDF ch\u1EBF \u0111\u1ED9 t\u0129nh l\u1EB7ng (ch\u01B0a g\u1EAFn link \xE2m thanh n\u1EC1n) \u2014 Chuy\xEAn t\xE2m t\u1ED1i \u0111a v\xE0o b\xE0i v\u1EDF.")), phong.moTa && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 px-2 leading-relaxed" }, phong.moTa));
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvc3R1ZHkuanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9ID0gUmVhY3Q7XG5pbXBvcnQgeyBkaW5oRGFuZ0dpYXlQaHV0LCBpZEdvb2dsZURyaXZlLCBpZFlvdXR1YmUsIGxhVmlkZW9UcnVjVGllcEZlLCBuYXBZb3VUdWJlSWZyYW1lQXBpLCB1cmxNZWRpYUZlIH0gZnJvbSAnLi4vbGliL2hlbHBlcnMuanMnO1xuXG4vLyBCXHUxRUNGIHF1YSB0aWNrIGtoaSB0YWIgXHUwMTExYW5nIFx1MUVERiBOXHUxRUMwTiBcdTIwMTQgdHJcdTAwRTFuaCBjXHUxRUQ5bmcgZFx1MUVEM24gcmVxdWVzdCBDbG91ZGZsYXJlIHZcdTAwRjQgXHUwMEVEY2gga2hpIGtoXHUwMEY0bmcgYWkgeGVtLlxuLy8gS2hcdTAwRjRuZyBkXHUwMEY5bmcgY2hvIHBvbGwgdFx1MDBFRG4gaGlcdTFFQzd1IHRoXHUxRUREaSBnaWFuIHRoXHUxRUYxYyAodmQgdm9pY2Ugc2lnbmFsaW5nKSB2XHUwMEVDIGJcdTFFQ0YgbFx1MUVFMSB0aWNrIGNcdTAwRjMgdGhcdTFFQzMgbFx1MDBFMG0gdHJlb1xuLy8gYlx1MUVBRnQgdGF5IGtcdTFFQkZ0IG5cdTFFRDFpIGhvXHUxRUI3YyB0clx1MUVDNSB0XHUwMEVEbiBoaVx1MUVDN3UgXCJyXHUxRUREaSB2b2ljZVwiIGNcdTFFRTdhIG5nXHUwMUIwXHUxRUREaSBraWEuXG5jb25zdCBraGlIaWVuVGhpID0gKGZuKSA9PiAoKSA9PiB7IGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09ICd2aXNpYmxlJykgZm4oKTsgfTtcblxuXG4vLyBcdTAwRDQgbmhcdTFFQURwIGxpbmsgdGhcdTAwRUFtIHZcdTAwRTBvIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIFx1MjAxNCBkXHUwMEY5bmcgY2h1bmcgY2hvIFN0dWR5RG9jayB2XHUwMEUwIENhbXB1c1dhdGNoVG9nZXRoZXJcbmV4cG9ydCBmdW5jdGlvbiBRdWV1ZUlucHV0KHsgb25BZGQsIG9uQWRkTmV4dCB9KSB7XG4gIGNvbnN0IFt2LCBzZXRWXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3Qgb2sgPSB2LnRyaW0oKS5sZW5ndGggPiAwO1xuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgPGlucHV0XG4gICAgICAgIGlkPVwiaW5wdXQtcXVldWUtYWRkXCJcbiAgICAgICAgdHlwZT1cInVybFwiXG4gICAgICAgIHZhbHVlPXt2fVxuICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRWKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgb25LZXlEb3duPXtlID0+IHsgaWYgKGUua2V5ID09PSAnRW50ZXInICYmIG9rKSB7IGUucHJldmVudERlZmF1bHQoKTsgb25BZGQodi50cmltKCkpOyBzZXRWKCcnKTsgfSB9fVxuICAgICAgICBwbGFjZWhvbGRlcj1cIlRoXHUwMEVBbSBsaW5rIHZpZGVvIHZcdTAwRTBvIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXHUyMDI2XCJcbiAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMi41IHB5LTEuNSB0ZXh0LVsxMXB4XSB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MFwiXG4gICAgICAvPlxuICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJidG4tcXVldWUtYWRkLW5leHRcIiBkaXNhYmxlZD17IW9rfVxuICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IG9uQWRkTmV4dCh2LnRyaW0oKSk7IHNldFYoJycpOyB9fVxuICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMS41IHJvdW5kZWQtbGcgYmctdmlvbGV0LTUwMC8xNSB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy12aW9sZXQtNTAwLzI1IGRpc2FibGVkOm9wYWNpdHktMzAgd2hpdGVzcGFjZS1ub3dyYXBcIj5cbiAgICAgICAgK1BoXHUwMEUxdCBrXHUxRUJGXG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGlkPVwiYnRuLXF1ZXVlLWVucXVldWVcIiBkaXNhYmxlZD17IW9rfVxuICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IG9uQWRkKHYudHJpbSgpKTsgc2V0VignJyk7IH19XG4gICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLVsjMDBGMkZFXS8yNSBkaXNhYmxlZDpvcGFjaXR5LTMwIHdoaXRlc3BhY2Utbm93cmFwXCI+XG4gICAgICAgICtDdVx1MUVEMWkgaFx1MDBFMG5nXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFNUVURZIERPQ0s6IEtIXHUwMEQ0TkcgR0lBTiBDXHUxRUQ4TkcgVFx1MDBDMUMgUEhcdTAwRDJORyBZT1VUVUJFIChQSEFTRSA0RikgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5leHBvcnQgZnVuY3Rpb24gU3R1ZHlEb2NrKHsgcGhvbmcsIHBob25nTWluaEtob2EsIGF1dGgsIHBob25nQ2hhdCA9IFtdLCBvblNlbmRQaG9uZ0NoYXQsIG9uWG9hVGluUGhvbmcsXG4gIG15Q2FwcyA9IHt9LCBpc1N0YWZmID0gZmFsc2UsIHZhaVRyb1Bob25nID0gJ21lbWJlcicsIHRoYW5oVmllbiA9IFtdLFxuICBwb2xpY2llcyA9IG51bGwsIGdyYW50cyA9IFtdLCB2aWRlb1RpbWVSZWYsIHNlZWtWaWRlbywgaGFuaERvbmdQaG9uZyxcbiAgY2FuQ29udHJvbDogX2NhbkNvbnRyb2wgPSBmYWxzZSwgZG9uZ1Bob25nSGllblRhaTogX2RvbmdQaG9uZ0hpZW5UYWksIGlzUm9vbVdpZGUgPSBmYWxzZSB9KSB7XG4gIGNvbnN0IFtkb2NrVGFiLCBzZXREb2NrVGFiXSA9IFJlYWN0LnVzZVN0YXRlKCdjaGF0Jyk7IC8vICdjaGF0JyB8ICdub3RlcycgfCAnd2hpdGVib2FyZCcgfCAnc2hlZXQnIHwgJ3ZvaWNlJyB8ICdxdWFuLXRyaSdcbiAgY29uc3QgW3Nob3dFbW9qaSwgc2V0U2hvd0Vtb2ppXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcblxuICAvLyBDYXBhYmlsaXR5IHBoXHUwMEVEYSBjbGllbnQgY2hcdTFFQzkgXHUwMTExXHUxRUMzIFx1MUVBOW4vaGlcdTFFQzduIFVJIFx1MjAxNCBtXHUxRUNEaSBxdXlcdTFFQzFuIHRoXHUxRUFEdCBkbyBzZXJ2ZXIgcXV5XHUxRUJGdC5cbiAgY29uc3QgY29RdXllbiA9IChjYXApID0+IG15Q2Fwc1tjYXBdICE9PSBmYWxzZTtcbiAgY29uc3QgbGF5VmlUcmlWaWRlbyA9ICgpID0+IE1hdGguZmxvb3IodmlkZW9UaW1lUmVmPy5jdXJyZW50IHx8IDApIHx8IG51bGw7XG4gIC8vIEJcdTFFQTVtIG1cdTFFRDFjIHRoXHUxRUREaSBnaWFuIFx1MjE5MiBnXHUxRUVEaSBldmVudCBjaG8gQ2FtcHVzV2F0Y2hUb2dldGhlciB4XHUxRUVEIGxcdTAwRkRcbiAgLy8gKGNcdTAwRjMgdmlkZW9fY29udHJvbCBcdTIxOTIgdHVhIGNodW5nIGNcdTFFQTMgcGhcdTAwRjJuZzsga2hcdTAwRjRuZyBcdTIxOTIgdHVhIGNcdTFFRTVjIGJcdTFFRDkgcGxheWVyIGNcdTFFRTdhIG1cdTAwRUNuaCkuXG4gIGNvbnN0IHlldUNhdVR1YSA9IChzZWMpID0+IHtcbiAgICBpZiAoc2VjID09IG51bGwgfHwgIShzZWMgPj0gMCkpIHJldHVybjtcbiAgICBpZiAoc2Vla1ZpZGVvKSB7IHNlZWtWaWRlbyhOdW1iZXIoc2VjKSwgbXlDYXBzLnZpZGVvX2NvbnRyb2wgPT09IHRydWUpOyByZXR1cm47IH1cbiAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3NyLXNlZWsnLCB7IGRldGFpbDogeyBwaG9uZ0lkOiBwaG9uZz8uaWQsIHNlYzogTnVtYmVyKHNlYykgfSB9KSk7XG4gIH07XG5cbiAgLy8gMS4gUm9vbSBDaGF0IFN0YXRlXG4gIGNvbnN0IFtjaGF0SW5wdXQsIHNldENoYXRJbnB1dF0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtjaGF0U2VuZGluZywgc2V0Q2hhdFNlbmRpbmddID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBjaGF0Q29tcG9zaW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgY2hhdEVuZFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiID09PSAnY2hhdCcgJiYgY2hhdEVuZFJlZi5jdXJyZW50KSB7XG4gICAgICBjb25zdCBwID0gY2hhdEVuZFJlZi5jdXJyZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgICBpZiAocCAmJiBwLnNjcm9sbEhlaWdodCA+IHAuY2xpZW50SGVpZ2h0KSB7XG4gICAgICAgIHAuc2Nyb2xsVG8oeyB0b3A6IHAuc2Nyb2xsSGVpZ2h0LCBiZWhhdmlvcjogJ3Ntb290aCcgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCBbcGhvbmdDaGF0Lmxlbmd0aCwgZG9ja1RhYl0pO1xuXG4gIGNvbnN0IGhhbmRsZVNlbmRSb29tQ2hhdCA9IChlKSA9PiB7XG4gICAgZT8ucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCB0eHQgPSBjaGF0SW5wdXQudHJpbSgpO1xuICAgIGlmICghdHh0IHx8IGNoYXRTZW5kaW5nKSByZXR1cm47XG4gICAgc2V0Q2hhdElucHV0KCcnKTtcbiAgICBzZXRDaGF0U2VuZGluZyh0cnVlKTtcbiAgICBpZiAob25TZW5kUGhvbmdDaGF0KSB7XG4gICAgICBQcm9taXNlLnJlc29sdmUob25TZW5kUGhvbmdDaGF0KHR4dCkpLmNhdGNoKCgpID0+IHtcbiAgICAgICAgc2V0Q2hhdElucHV0KGN1ciA9PiBjdXIgPyBjdXIgOiB0eHQpO1xuICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgIHNldENoYXRTZW5kaW5nKGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRDaGF0U2VuZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIDIuIFNoYXJlZCBOb3RlcyBcdTIwMTQgZW50cnkgYXBwZW5kIChtXHUxRUQ3aSBuZ1x1MDFCMFx1MUVERGkgdGhcdTAwRUFtIGdoaSBjaFx1MDBGQSByaVx1MDBFQW5nLCBraFx1MDBGNG5nIGdoaSBcdTAxMTFcdTAwRTggbmhhdSlcbiAgY29uc3QgW25vdGVzTGlzdCwgc2V0Tm90ZXNMaXN0XSA9IFJlYWN0LnVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW25vdGVJbnB1dCwgc2V0Tm90ZUlucHV0XSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW25vdGVXaXRoVGltZSwgc2V0Tm90ZVdpdGhUaW1lXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBbbm90ZXNDYW5Xcml0ZSwgc2V0Tm90ZXNDYW5Xcml0ZV0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW25vdGVzTm90aWNlLCBzZXROb3Rlc05vdGljZV0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IG5vdGVzVmVyc2lvblJlZiA9IFJlYWN0LnVzZVJlZigwKTtcbiAgY29uc3Qgbm90ZUNvbXBvc2luZ1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiAhPT0gJ25vdGVzJykgcmV0dXJuO1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoTm90ZXMgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT1ub3Rlc2ApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBkLm9rKSB7XG4gICAgICAgICAgc2V0Tm90ZXNMaXN0KEFycmF5LmlzQXJyYXkoZC5wYXlsb2FkPy5ub3RlcykgPyBkLnBheWxvYWQubm90ZXMgOiBbXSk7XG4gICAgICAgICAgbm90ZXNWZXJzaW9uUmVmLmN1cnJlbnQgPSBkLnZlcnNpb24gfHwgMDtcbiAgICAgICAgICBzZXROb3Rlc0NhbldyaXRlKGQuY2FuV3JpdGUgIT09IGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RpdmUgJiYgZC5jb2RlID09PSAnY2FwYWJpbGl0eV9vZmYnKSB7XG4gICAgICAgICAgc2V0Tm90ZXNDYW5Xcml0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIGZldGNoTm90ZXMoKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGtoaUhpZW5UaGkoZmV0Y2hOb3RlcyksIDMwMDApO1xuICAgIHJldHVybiAoKSA9PiB7IGFjdGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludGVydmFsKTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiXSk7XG5cbiAgY29uc3QgdGhlbUdoaUNodSA9IGFzeW5jICgpID0+IHtcbiAgICBjb25zdCB0ZXh0ID0gbm90ZUlucHV0LnRyaW0oKTtcbiAgICBpZiAoIXRleHQpIHJldHVybjtcbiAgICBzZXROb3Rlc05vdGljZSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgcmVzb3VyY2U6ICdub3RlcycsXG4gICAgICAgICAgcGF5bG9hZDogeyB0ZXh0LCB2aWRlb1RpbWVTZWM6IG5vdGVXaXRoVGltZSA/IGxheVZpVHJpVmlkZW8oKSA6IG51bGwgfVxuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSB7XG4gICAgICAgIHNldE5vdGVJbnB1dCgnJyk7XG4gICAgICAgIHNldE5vdGVzTGlzdChwcmV2ID0+IFsuLi5wcmV2LCB7IGlkOiBkLmlkLCB0ZW46IGF1dGgudXNlcj8udGVuIHx8ICdCXHUxRUExbicsIG5vaUR1bmc6IHRleHQsIHZpZGVvVGltZVNlYzogbm90ZVdpdGhUaW1lID8gbGF5VmlUcmlWaWRlbygpIDogbnVsbCwgY3VhVG9pOiAxIH1dKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldE5vdGVzTm90aWNlKGQubG9pIHx8ICdLaFx1MDBGNG5nIGxcdTAxQjB1IFx1MDExMVx1MDFCMFx1MUVFM2MgZ2hpIGNoXHUwMEZBLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggeyBzZXROb3Rlc05vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkuJyk7IH1cbiAgfTtcblxuICBjb25zdCB4b2FHaGlDaHUgPSBhc3luYyAoaWQpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIHJlc291cmNlOiAnbm90ZXMnLCBhY3Rpb246ICd4b2Ffbm90ZScsIGlkIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHNldE5vdGVzTGlzdChwcmV2ID0+IHByZXYuZmlsdGVyKG4gPT4gbi5pZCAhPT0gaWQpKTtcbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gMy4gU2hhcmVkIFdoaXRlYm9hcmQgU3RhdGVcbiAgY29uc3QgY2FudmFzUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBbd2JTdHJva2VzLCBzZXRXYlN0cm9rZXNdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbd2JDb2xvciwgc2V0V2JDb2xvcl0gPSBSZWFjdC51c2VTdGF0ZSgnIzAwRjJGRScpO1xuICBjb25zdCBbd2JXaWR0aCwgc2V0V2JXaWR0aF0gPSBSZWFjdC51c2VTdGF0ZSgzKTtcbiAgY29uc3QgW3diVG9vbCwgc2V0V2JUb29sXSA9IFJlYWN0LnVzZVN0YXRlKCdwZW4nKTtcbiAgY29uc3QgaXNEcmF3aW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgY3VycmVudFN0cm9rZVJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgd2JWZXJzaW9uUmVmID0gUmVhY3QudXNlUmVmKDApO1xuXG4gIGNvbnN0IHJlZHJhd0NhbnZhcyA9IFJlYWN0LnVzZUNhbGxiYWNrKChzdHJva2VzKSA9PiB7XG4gICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFjYW52YXMpIHJldHVybjtcbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgc3Ryb2tlcy5mb3JFYWNoKHMgPT4ge1xuICAgICAgaWYgKCFzLnBvaW50cyB8fCBzLnBvaW50cy5sZW5ndGggPCAyKSByZXR1cm47XG4gICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzLnRvb2wgPT09ICdlcmFzZXInID8gJyMwQjBFMTQnIDogKHMuY29sb3IgfHwgJyMwMEYyRkUnKTtcbiAgICAgIGN0eC5saW5lV2lkdGggPSBzLndpZHRoIHx8IDM7XG4gICAgICBjdHgubGluZUNhcCA9ICdyb3VuZCc7XG4gICAgICBjdHgubGluZUpvaW4gPSAncm91bmQnO1xuICAgICAgY3R4Lm1vdmVUbyhzLnBvaW50c1swXS54LCBzLnBvaW50c1swXS55KTtcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcy5wb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3R4LmxpbmVUbyhzLnBvaW50c1tpXS54LCBzLnBvaW50c1tpXS55KTtcbiAgICAgIH1cbiAgICAgIGN0eC5zdHJva2UoKTtcbiAgICB9KTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IFt3YkNhbldyaXRlLCBzZXRXYkNhbldyaXRlXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpO1xuXG4gIC8vIFx1MDBDMXAgMSBvcCB2XHUwMEUwbyBtXHUxRUEzbmcgc3Ryb2tlcyAocmVwbGF5IGFwcGVuZC1vbmx5KTogJ3N0cm9rZScgdGhcdTAwRUFtIG5cdTAwRTl0LCAnY2xlYXInIHhvXHUwMEUxIHNcdTFFQTFjaC5cbiAgY29uc3QgYXBEdW5nT3AgPSAoc3Ryb2tlcywgb3ApID0+IHtcbiAgICBpZiAob3AudHlwZSA9PT0gJ2NsZWFyJykgcmV0dXJuIFtdO1xuICAgIGlmIChvcC50eXBlID09PSAnc3Ryb2tlJyAmJiBvcC5zdHJva2UpIHJldHVybiBbLi4uc3Ryb2tlcywgb3Auc3Ryb2tlXTtcbiAgICByZXR1cm4gc3Ryb2tlcztcbiAgfTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAnd2hpdGVib2FyZCcpIHJldHVybjtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaFdiID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mcmVzb3VyY2U9d2hpdGVib2FyZCZzYXVJZD0ke3diVmVyc2lvblJlZi5jdXJyZW50fWApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBkLm9rKSB7XG4gICAgICAgICAgY29uc3Qgb3BzID0gQXJyYXkuaXNBcnJheShkLnBheWxvYWQ/Lm9wcykgPyBkLnBheWxvYWQub3BzIDogW107XG4gICAgICAgICAgaWYgKG9wcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIE5cdTFFQkZ1IGNcdTAwRjMgb3AgJ2NsZWFyJyB0cm9uZyBsb1x1MUVBMXQgbVx1MUVEQmkgXHUyMTkyIGJ1aWxkIGxcdTFFQTFpIHRcdTFFRUIgXHUwMTExXHUxRUE3dSBjaG8gY2hcdTFFQUZjXG4gICAgICAgICAgICBpZiAob3BzLnNvbWUobyA9PiBvLnR5cGUgPT09ICdjbGVhcicpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGZ1bGwgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT13aGl0ZWJvYXJkJnNhdUlkPTBgKTtcbiAgICAgICAgICAgICAgY29uc3QgZGYgPSBhd2FpdCBmdWxsLmpzb24oKTtcbiAgICAgICAgICAgICAgaWYgKGFjdGl2ZSAmJiBkZi5vaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbE9wcyA9IEFycmF5LmlzQXJyYXkoZGYucGF5bG9hZD8ub3BzKSA/IGRmLnBheWxvYWQub3BzIDogW107XG4gICAgICAgICAgICAgICAgY29uc3QgcmVidWlsdCA9IGFsbE9wcy5yZWR1Y2UoYXBEdW5nT3AsIFtdKTtcbiAgICAgICAgICAgICAgICBzZXRXYlN0cm9rZXMocmVidWlsdCk7XG4gICAgICAgICAgICAgICAgcmVkcmF3Q2FudmFzKHJlYnVpbHQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzZXRXYlN0cm9rZXMocHJldiA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dCA9IG9wcy5yZWR1Y2UoYXBEdW5nT3AsIHByZXYpO1xuICAgICAgICAgICAgICAgIHJlZHJhd0NhbnZhcyhuZXh0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHdiVmVyc2lvblJlZi5jdXJyZW50ID0gZC52ZXJzaW9uIHx8IDA7XG4gICAgICAgICAgc2V0V2JDYW5Xcml0ZShkLmNhbldyaXRlICE9PSBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aXZlICYmIGQuY29kZSA9PT0gJ2NhcGFiaWxpdHlfb2ZmJykge1xuICAgICAgICAgIHNldFdiQ2FuV3JpdGUoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfTtcbiAgICBmZXRjaFdiKCk7XG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChraGlIaWVuVGhpKGZldGNoV2IpLCAzMDAwKTtcbiAgICByZXR1cm4gKCkgPT4geyBhY3RpdmUgPSBmYWxzZTsgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7IH07XG4gIH0sIFtwaG9uZy5pZCwgZG9ja1RhYiwgcmVkcmF3Q2FudmFzXSk7XG5cbiAgY29uc3Qgc3RhcnREcmF3aW5nID0gKGUpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICBpZiAoIWNhbnZhcykgcmV0dXJuO1xuICAgIGNvbnN0IHJlY3QgPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgY2xpZW50WCA9IGUuY2xpZW50WCA/PyAoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXT8uY2xpZW50WCk7XG4gICAgY29uc3QgY2xpZW50WSA9IGUuY2xpZW50WSA/PyAoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXT8uY2xpZW50WSk7XG4gICAgY29uc3QgeCA9IGNsaWVudFggLSByZWN0LmxlZnQ7XG4gICAgY29uc3QgeSA9IGNsaWVudFkgLSByZWN0LnRvcDtcbiAgICBpc0RyYXdpbmdSZWYuY3VycmVudCA9IHRydWU7XG4gICAgY3VycmVudFN0cm9rZVJlZi5jdXJyZW50ID0ge1xuICAgICAgdG9vbDogd2JUb29sLFxuICAgICAgY29sb3I6IHdiQ29sb3IsXG4gICAgICB3aWR0aDogd2JUb29sID09PSAnZXJhc2VyJyA/IDE2IDogd2JXaWR0aCxcbiAgICAgIHBvaW50czogW3sgeCwgeSB9XVxuICAgIH07XG4gIH07XG5cbiAgY29uc3QgZHJhd01vdmUgPSAoZSkgPT4ge1xuICAgIGlmICghaXNEcmF3aW5nUmVmLmN1cnJlbnQgfHwgIWN1cnJlbnRTdHJva2VSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgIGlmICghY2FudmFzKSByZXR1cm47XG4gICAgY29uc3QgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBjbGllbnRYID0gZS5jbGllbnRYID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRYKTtcbiAgICBjb25zdCBjbGllbnRZID0gZS5jbGllbnRZID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRZKTtcbiAgICBjb25zdCB4ID0gY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICBjb25zdCB5ID0gY2xpZW50WSAtIHJlY3QudG9wO1xuICAgIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5wb2ludHMucHVzaCh7IHgsIHkgfSk7XG4gICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC50b29sID09PSAnZXJhc2VyJyA/ICcjMEIwRTE0JyA6IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5jb2xvcjtcbiAgICBjdHgubGluZVdpZHRoID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LndpZHRoO1xuICAgIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcbiAgICBjdHgubGluZUpvaW4gPSAncm91bmQnO1xuICAgIGNvbnN0IHB0cyA9IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5wb2ludHM7XG4gICAgaWYgKHB0cy5sZW5ndGggPj0gMikge1xuICAgICAgY3R4Lm1vdmVUbyhwdHNbcHRzLmxlbmd0aCAtIDJdLngsIHB0c1twdHMubGVuZ3RoIC0gMl0ueSk7XG4gICAgICBjdHgubGluZVRvKHB0c1twdHMubGVuZ3RoIC0gMV0ueCwgcHRzW3B0cy5sZW5ndGggLSAxXS55KTtcbiAgICAgIGN0eC5zdHJva2UoKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgc3RvcERyYXdpbmcgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFpc0RyYXdpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGlzRHJhd2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRTdHJva2VSZWYuY3VycmVudCAmJiBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQucG9pbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNvbnN0IHN0cm9rZSA9IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudDtcbiAgICAgIGNvbnN0IG5leHRTdHJva2VzID0gWy4uLndiU3Ryb2tlcywgc3Ryb2tlXTtcbiAgICAgIHNldFdiU3Ryb2tlcyhuZXh0U3Ryb2tlcyk7XG4gICAgICBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgICAgcmVzb3VyY2U6ICd3aGl0ZWJvYXJkJyxcbiAgICAgICAgICAgIHBheWxvYWQ6IHsgdHlwZTogJ3N0cm9rZScsIHN0cm9rZSB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoZC5vayAmJiBkLmlkKSB3YlZlcnNpb25SZWYuY3VycmVudCA9IE1hdGgubWF4KHdiVmVyc2lvblJlZi5jdXJyZW50LCBkLmlkKTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9XG4gIH07XG5cbiAgY29uc3QgY2xlYXJXaGl0ZWJvYXJkID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghY29uZmlybSgnQlx1MUVBMW4gY1x1MDBGMyBjaFx1MUVBRmMgbXVcdTFFRDFuIHhcdTAwRjNhIHNcdTFFQTFjaCBiXHUxRUEzbmcgdlx1MUVCRD8gKGNoXHUxRUM5IHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nKScpKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgcmVzb3VyY2U6ICd3aGl0ZWJvYXJkJyxcbiAgICAgICAgICBwYXlsb2FkOiB7IHR5cGU6ICdjbGVhcicgfVxuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSB7XG4gICAgICAgIHNldFdiU3Ryb2tlcyhbXSk7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgICAgICBpZiAoY2FudmFzKSB7XG4gICAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIC8vIDQuIFNoYXJlZCBTaGVldCBTdGF0ZSAoOCBjb2xzIHggMTAgcm93cykgXHUyMDE0IHVwc2VydCB0XHUxRUVCbmcgXHUwMEY0LCBraFx1MDBGNG5nIHdob2xlLWRvYyBjb25mbGljdFxuICBjb25zdCBDT0xTID0gWydBJywgJ0InLCAnQycsICdEJywgJ0UnLCAnRicsICdHJywgJ0gnXTtcbiAgY29uc3QgUk9XUyA9IFsxLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCA5LCAxMF07XG4gIGNvbnN0IFtzaGVldENlbGxzLCBzZXRTaGVldENlbGxzXSA9IFJlYWN0LnVzZVN0YXRlKHt9KTtcbiAgY29uc3QgW3NoZWV0Q2FuV3JpdGUsIHNldFNoZWV0Q2FuV3JpdGVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IHNoZWV0U2F2ZVRpbWVyc1JlZiA9IFJlYWN0LnVzZVJlZih7fSk7XG4gIGNvbnN0IHNoZWV0Rm9jdXNlZENlbGxSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHNoZWV0UG9sbFJlZiA9IFJlYWN0LnVzZVJlZigwKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAnc2hlZXQnKSByZXR1cm47XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG4gICAgY29uc3QgZmV0Y2hTaGVldCA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPXNoZWV0YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2spIHtcbiAgICAgICAgICBjb25zdCBpbmNvbWluZyA9IGQucGF5bG9hZD8uY2VsbHMgfHwge307XG4gICAgICAgICAgLy8gS2hcdTAwRjRuZyBnaGkgXHUwMTExXHUwMEU4IFx1MDBGNCBcdTAxMTFhbmcgZ1x1MDBGNSBkXHUxRURGXG4gICAgICAgICAgc2V0U2hlZXRDZWxscyhwcmV2ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IHsgLi4uaW5jb21pbmcgfTtcbiAgICAgICAgICAgIGNvbnN0IGRhbmdHbyA9IHNoZWV0Rm9jdXNlZENlbGxSZWYuY3VycmVudDtcbiAgICAgICAgICAgIGlmIChkYW5nR28gJiYgcHJldltkYW5nR29dICE9PSB1bmRlZmluZWQpIG1lcmdlZFtkYW5nR29dID0gcHJldltkYW5nR29dO1xuICAgICAgICAgICAgcmV0dXJuIG1lcmdlZDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzZXRTaGVldENhbldyaXRlKGQuY2FuV3JpdGUgIT09IGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RpdmUgJiYgZC5jb2RlID09PSAnY2FwYWJpbGl0eV9vZmYnKSB7XG4gICAgICAgICAgc2V0U2hlZXRDYW5Xcml0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIGZldGNoU2hlZXQoKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGtoaUhpZW5UaGkoZmV0Y2hTaGVldCksIDMwMDApO1xuICAgIHJldHVybiAoKSA9PiB7IGFjdGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludGVydmFsKTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2VsbENoYW5nZSA9IChjZWxsS2V5LCB2YWwpID0+IHtcbiAgICBzZXRTaGVldENlbGxzKHByZXYgPT4gKHsgLi4ucHJldiwgW2NlbGxLZXldOiB2YWwgfSkpO1xuICAgIGNvbnN0IHRpbWVycyA9IHNoZWV0U2F2ZVRpbWVyc1JlZi5jdXJyZW50O1xuICAgIGlmICh0aW1lcnNbY2VsbEtleV0pIGNsZWFyVGltZW91dCh0aW1lcnNbY2VsbEtleV0pO1xuICAgIHRpbWVyc1tjZWxsS2V5XSA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgICAgcmVzb3VyY2U6ICdzaGVldCcsXG4gICAgICAgICAgICBwYXlsb2FkOiB7IGNlbGw6IGNlbGxLZXksIHZhbHVlOiB2YWwgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH0sIDgwMCk7XG4gIH07XG5cbiAgLy8gNS4gMS10by0xIFdlYlJUQyBWb2ljZSBDaGF0IFx1MjAxNCBwYWlyLWJvdW5kICh0XHUxRUQxaSBcdTAxMTFhIDEgY1x1MUVCN3AvcGhcdTAwRjJuZywgc2lnbmFsaW5nIHJpXHUwMEVBbmcgdFx1MDFCMClcbiAgY29uc3QgW3ZvaWNlSm9pbmVkLCBzZXRWb2ljZUpvaW5lZF0gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFttaWNNdXRlZCwgc2V0TWljTXV0ZWRdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7IC8vIERlZmF1bHQgT0ZGXG4gIGNvbnN0IFt2b2ljZVN0YXRlLCBzZXRWb2ljZVN0YXRlXSA9IFJlYWN0LnVzZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgY29uc3QgW3ZvaWNlTm90aWNlLCBzZXRWb2ljZU5vdGljZV0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFt2b2ljZVBhaXIsIHNldFZvaWNlUGFpcl0gPSBSZWFjdC51c2VTdGF0ZShudWxsKTsgICAgICAgLy8ge2FjdGl2ZSwgYVRlbiwgYlRlbiwgeW91SW4sIHNsb3R9XG4gIGNvbnN0IFt2b2ljZVJlcXVlc3RlZCwgc2V0Vm9pY2VSZXF1ZXN0ZWRdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbeWV1Q2F1Vm9pY2UsIHNldFlldUNhdVZvaWNlXSA9IFJlYWN0LnVzZVN0YXRlKFtdKTsgICAgIC8vIHN0YWZmOiBkYW5oIHNcdTAwRTFjaCB4aW4gcXV5XHUxRUMxblxuICBjb25zdCBwY1JlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgbG9jYWxTdHJlYW1SZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHJlbW90ZUF1ZGlvUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBsYXN0U2lnbmFsSWRSZWYgPSBSZWFjdC51c2VSZWYoMCk7XG4gIGNvbnN0IHZvaWNlUG9sbFRpbWVyUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB2b2ljZVNsb3RSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHZvaWNlSm9pbmVkUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgcGVuZGluZ0NhbmRpZGF0ZXNSZWYgPSBSZWFjdC51c2VSZWYoW10pO1xuICB2b2ljZUpvaW5lZFJlZi5jdXJyZW50ID0gdm9pY2VKb2luZWQ7XG5cbiAgY29uc3QgZHVuZ0tldE5vaVZvaWNlID0gKCkgPT4ge1xuICAgIGlmIChsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldFRyYWNrcygpLmZvckVhY2godCA9PiB0LnN0b3AoKSk7XG4gICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHBjUmVmLmN1cnJlbnQpIHtcbiAgICAgIHBjUmVmLmN1cnJlbnQuY2xvc2UoKTtcbiAgICAgIHBjUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIH1cbiAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50ID0gW107XG4gICAgc2V0TWljTXV0ZWQodHJ1ZSk7XG4gIH07XG5cbiAgLy8gUG9sbCB0clx1MUVBMW5nIHRoXHUwMEUxaSBjXHUxRUI3cCArIHRcdTAwRURuIGhpXHUxRUM3dSBjXHUxRUU3YSBwYXJ0bmVyIChzZXJ2ZXIgY2hcdTFFQzkgdHJcdTFFQTMgc2lnbmFsIGNcdTFFRTdhIG5nXHUwMUIwXHUxRUREaSB0cm9uZyBjXHUxRUI3cCkuXG4gIGNvbnN0IHBvbGxWb2ljZSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mYWN0aW9uPXZvaWNlX3BvbGwmc2F1SWQ9JHtsYXN0U2lnbmFsSWRSZWYuY3VycmVudH1gKTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSByZXR1cm47XG4gICAgICBpZiAoZC5wYWlyKSBzZXRWb2ljZVBhaXIoZC5wYWlyKTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGQueWV1Q2F1Vm9pY2UpKSBzZXRZZXVDYXVWb2ljZShkLnlldUNhdVZvaWNlKTtcbiAgICAgIGNvbnN0IHBjID0gcGNSZWYuY3VycmVudDtcbiAgICAgIGlmICghdm9pY2VKb2luZWRSZWYuY3VycmVudCB8fCAhcGMpIHJldHVybjtcbiAgICAgIGZvciAoY29uc3Qgc2lnIG9mIGQuc2lnbmFscyB8fCBbXSkge1xuICAgICAgICBsYXN0U2lnbmFsSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KGxhc3RTaWduYWxJZFJlZi5jdXJyZW50LCBzaWcuaWQpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ29mZmVyJykge1xuICAgICAgICAgICAgLy8gT2ZmZXIgbVx1MUVEQmkgaG9cdTFFQjdjIHJlLW9mZmVyIChcdTAxMTFcdTFFRDFpIHBoXHUwMUIwXHUwMUExbmcgYlx1MUVBRHQgbWljIG11XHUxRUQ5bikgXHUwMTExXHUxRUMxdSBzZXQgbFx1MUVBMWkgcmVtb3RlICsgdHJcdTFFQTMgYW5zd2VyLlxuICAgICAgICAgICAgYXdhaXQgcGMuc2V0UmVtb3RlRGVzY3JpcHRpb24obmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbihzaWcucGF5bG9hZCkpO1xuICAgICAgICAgICAgLy8gWFx1MUVBMyBjXHUwMEUxYyBjYW5kaWRhdGUgdFx1MUVEQmkgc1x1MUVEQm0gdHJcdTAxQjBcdTFFREJjIGtoaSBjXHUwMEYzIHJlbW90ZURlc2NyaXB0aW9uLlxuICAgICAgICAgICAgZm9yIChjb25zdCBjIG9mIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuYWRkSWNlQ2FuZGlkYXRlKG5ldyBSVENJY2VDYW5kaWRhdGUoYykpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGFucyA9IGF3YWl0IHBjLmNyZWF0ZUFuc3dlcigpO1xuICAgICAgICAgICAgYXdhaXQgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihhbnMpO1xuICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdhbnN3ZXInLCBwYXlsb2FkOiBhbnMgfSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdhbnN3ZXInKSB7XG4gICAgICAgICAgICBpZiAocGMuc2lnbmFsaW5nU3RhdGUgPT09ICdoYXZlLWxvY2FsLW9mZmVyJykge1xuICAgICAgICAgICAgICBhd2FpdCBwYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKHNpZy5wYXlsb2FkKSk7XG4gICAgICAgICAgICAgIGZvciAoY29uc3QgYyBvZiBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGMuYWRkSWNlQ2FuZGlkYXRlKG5ldyBSVENJY2VDYW5kaWRhdGUoYykpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50ID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ2NhbmRpZGF0ZScpIHtcbiAgICAgICAgICAgIGlmIChwYy5yZW1vdGVEZXNjcmlwdGlvbikge1xuICAgICAgICAgICAgICBhd2FpdCBwYy5hZGRJY2VDYW5kaWRhdGUobmV3IFJUQ0ljZUNhbmRpZGF0ZShzaWcucGF5bG9hZCkpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQucHVzaChzaWcucGF5bG9hZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ2xlYXZlJykge1xuICAgICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ05nXHUwMUIwXHUxRUREaSBraWEgXHUwMTExXHUwMEUzIG5nXHUxRUFGdCB2b2ljZS4nKTtcbiAgICAgICAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgZHVuZ0tldE5vaVZvaWNlKCk7XG4gICAgICAgICAgICBzZXRWb2ljZUpvaW5lZChmYWxzZSk7XG4gICAgICAgICAgICB2b2ljZVNsb3RSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgc2lnbmFsIGxcdTFFRDdpICovIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gUG9sbCBjaFx1MUVBMXkga2hpIHRhYiB2b2ljZSBtXHUxRURGICh4ZW0gdHJcdTFFQTFuZyB0aFx1MDBFMWkgY1x1MUVCN3ApIGhvXHUxRUI3YyBcdTAxMTFhbmcgdHJvbmcgY1x1MUVCN3AuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICd2b2ljZScgJiYgIXZvaWNlSm9pbmVkKSByZXR1cm47XG4gICAgcG9sbFZvaWNlKCk7XG4gICAgdm9pY2VQb2xsVGltZXJSZWYuY3VycmVudCA9IHNldEludGVydmFsKHBvbGxWb2ljZSwgMTUwMCk7XG4gICAgcmV0dXJuICgpID0+IHsgaWYgKHZvaWNlUG9sbFRpbWVyUmVmLmN1cnJlbnQpIGNsZWFySW50ZXJ2YWwodm9pY2VQb2xsVGltZXJSZWYuY3VycmVudCk7IH07XG4gIH0sIFtwaG9uZy5pZCwgZG9ja1RhYiwgdm9pY2VKb2luZWRdKTtcblxuICBjb25zdCBqb2luVm9pY2UgPSBhc3luYyAoKSA9PiB7XG4gICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMGFuZyB4aW4gY2hcdTFFRDcgdHJvbmcgY1x1MUVCN3Agdm9pY2UuLi4nKTtcbiAgICBzZXRWb2ljZVN0YXRlKCdjb25uZWN0aW5nJyk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIDEuIEdpXHUwMEUwbmggc2xvdCB0clx1MDBFQW4gc2VydmVyIHRyXHUwMUIwXHUxRURCYyAoc2VydmVyLWF1dGhvcml0YXRpdmU6IHRcdTFFRDFpIFx1MDExMWEgMSBjXHUxRUI3cCAxLTEvcGhcdTAwRjJuZylcbiAgICAgIGNvbnN0IGpvaW5SZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfam9pbicgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgam9pbkRhdGEgPSBhd2FpdCBqb2luUmVzLmpzb24oKTtcbiAgICAgIGlmICgham9pbkRhdGEub2spIHtcbiAgICAgICAgaWYgKGpvaW5EYXRhLmNvZGUgPT09ICdncmFudF9yZXF1aXJlZCcpIHtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnQlx1MUVBMW4gY1x1MUVBN24gXHUwMTExXHUwMUIwXHUxRUUzYyBjXHUxRUE1cCBxdXlcdTFFQzFuIHZvaWNlIFx1MjAxNCBoXHUwMEUzeSBiXHUxRUE1bSBcIlhpbiBxdXlcdTFFQzFuIHZvaWNlXCIuJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2Uoam9pbkRhdGEubG9pIHx8ICdLaFx1MDBGNG5nIHRoXHUxRUMzIHRoYW0gZ2lhIHZvaWNlLicpO1xuICAgICAgICB9XG4gICAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2b2ljZVNsb3RSZWYuY3VycmVudCA9IGpvaW5EYXRhLnNsb3Q7XG4gICAgICBzZXRWb2ljZUpvaW5lZCh0cnVlKTtcblxuICAgICAgLy8gMi4gWGluIG1pYyBUUlx1MDFBRlx1MUVEQUMga2hpIHRcdTFFQTFvIG9mZmVyIFx1MjAxNCB0cmFjayBwaFx1MUVBM2kgY1x1MDBGMyBzXHUxRUI1biB0cm9uZyBTRFAgbmVnb3RpYXRpb24sXG4gICAgICAvLyAgICBhZGRUcmFjayBzYXUga2hpIFx1MDExMVx1MDBFMyBiXHUxRUFGdCB0YXkgbVx1MDBFMCBraFx1MDBGNG5nIHJlbmVnb3RpYXRlIFx1MjE5MiBuZ1x1MDFCMFx1MUVERGkga2lhIGtoXHUwMEY0bmcgbmdoZSBcdTAxMTFcdTAxQjBcdTFFRTNjLlxuICAgICAgLy8gICAgTWljIGtoXHUxRURGaSBcdTAxMTFcdTFFQTd1IG11dGVkIChlbmFibGVkPWZhbHNlKSBcdTIwMTQgdXNlciB0XHUxRUYxIGJcdTFFQUR0IGJcdTFFQjFuZyBuXHUwMEZBdCBNaWMuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7IGF1ZGlvOiB0cnVlLCB2aWRlbzogZmFsc2UgfSk7XG4gICAgICAgIHN0cmVhbS5nZXRBdWRpb1RyYWNrcygpLmZvckVhY2godCA9PiB7IHQuZW5hYmxlZCA9IGZhbHNlOyB9KTtcbiAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudCA9IHN0cmVhbTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnS2hcdTAwRjRuZyB4aW4gXHUwMTExXHUwMUIwXHUxRUUzYyBtaWNybyBcdTIwMTQgYlx1MUVBMW4gY2hcdTFFQzkgbmdoZSBcdTAxMTFcdTAxQjBcdTFFRTNjLCBraFx1MDBGNG5nIG5cdTAwRjNpIFx1MDExMVx1MDFCMFx1MUVFM2MuJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIDMuIFRcdTFFQTFvIHBlZXIgY29ubmVjdGlvblxuICAgICAgY29uc3QgcGMgPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oe1xuICAgICAgICBpY2VTZXJ2ZXJzOiBbeyB1cmxzOiAnc3R1bjpzdHVuLmwuZ29vZ2xlLmNvbToxOTMwMicgfV1cbiAgICAgIH0pO1xuICAgICAgcGNSZWYuY3VycmVudCA9IHBjO1xuICAgICAgaWYgKGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRUcmFja3MoKS5mb3JFYWNoKHQgPT4gcGMuYWRkVHJhY2sodCwgbG9jYWxTdHJlYW1SZWYuY3VycmVudCkpO1xuICAgICAgfVxuXG4gICAgICBwYy5vbmljZWNhbmRpZGF0ZSA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQuY2FuZGlkYXRlKSB7XG4gICAgICAgICAgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsXG4gICAgICAgICAgICAgIHNpZ25hbFR5cGU6ICdjYW5kaWRhdGUnLFxuICAgICAgICAgICAgICBwYXlsb2FkOiBldmVudC5jYW5kaWRhdGVcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBwYy5vbnRyYWNrID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChyZW1vdGVBdWRpb1JlZi5jdXJyZW50ICYmIGV2ZW50LnN0cmVhbXNbMF0pIHtcbiAgICAgICAgICByZW1vdGVBdWRpb1JlZi5jdXJyZW50LnNyY09iamVjdCA9IGV2ZW50LnN0cmVhbXNbMF07XG4gICAgICAgICAgcmVtb3RlQXVkaW9SZWYuY3VycmVudC5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBwYy5vbmNvbm5lY3Rpb25zdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgcyA9IHBjLmNvbm5lY3Rpb25TdGF0ZTtcbiAgICAgICAgaWYgKHMgPT09ICdjb25uZWN0ZWQnKSB7XG4gICAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnY29ubmVjdGVkJyk7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MjcxMyBcdTAxMTBhbmcga1x1MUVCRnQgblx1MUVEMWkgdGhvXHUxRUExaSAxLTEgdHJcdTFFRjFjIHRpXHUxRUJGcC4nKTtcbiAgICAgICAgfSBlbHNlIGlmIChzID09PSAnZmFpbGVkJyB8fCBzID09PSAnZGlzY29ubmVjdGVkJykge1xuICAgICAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSB0aG9cdTFFQTFpIChtXHUxRUExbmcgY2hcdTFFQjduIFAyUCBuXHUxRUJGdSBraFx1MDBGNG5nIGNcdTAwRjMgVFVSTikuJyk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIDQuIFNsb3QgJ2InIChuZ1x1MDFCMFx1MUVERGkgdlx1MDBFMG8gc2F1KSB0XHUxRUExbyBvZmZlcjsgc2xvdCAnYScgY2hcdTFFREQgb2ZmZXIgdFx1MUVFQiBwb2xsLlxuICAgICAgaWYgKGpvaW5EYXRhLnNsb3QgPT09ICdiJykge1xuICAgICAgICBjb25zdCBvZmZlciA9IGF3YWl0IHBjLmNyZWF0ZU9mZmVyKCk7XG4gICAgICAgIGF3YWl0IHBjLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpO1xuICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ29mZmVyJywgcGF5bG9hZDogb2ZmZXIgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBcdTAwRTMgdlx1MDBFMG8gY1x1MUVCN3AgXHUyMDE0IFx1MDExMWFuZyBiXHUxRUFGdCB0YXkgdlx1MUVEQmkgJyArICh2b2ljZVBhaXI/LmFUZW4gfHwgJ25nXHUwMUIwXHUxRUREaSBraWEnKSArICdcdTIwMjYnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdCXHUxRUExbiBsXHUwMEUwIG5nXHUwMUIwXHUxRUREaSBcdTAxMTFcdTFFQTd1IHRpXHUwMEVBbiBcdTIwMTQgY2hcdTFFREQgdGhcdTAwRUFtIDEgbmdcdTAxQjBcdTFFRERpIHZcdTAwRTBvIHZvaWNlXHUyMDI2Jyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBzZXRWb2ljZU5vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkgdm9pY2U6ICcgKyBlcnIubWVzc2FnZSk7XG4gICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgeGluUXV5ZW5Wb2ljZSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3JlcXVlc3QnIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgZC5ncmFudGVkKSB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdCXHUxRUExbiBcdTAxMTFcdTAwRTMgXHUwMTExXHUwMUIwXHUxRUUzYyBwaFx1MDBFOXAgdm9pY2UgXHUyMDE0IGJcdTFFQTVtIFRoYW0gZ2lhLicpO1xuICAgICAgfSBlbHNlIGlmIChkLm9rKSB7XG4gICAgICAgIHNldFZvaWNlUmVxdWVzdGVkKHRydWUpO1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwXHUwMEUzIGdcdTFFRURpIHlcdTAwRUF1IGNcdTFFQTd1IFx1MjAxNCBjaFx1MUVERCBxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZyBkdXlcdTFFQzd0LicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoZC5sb2kgfHwgJ0toXHUwMEY0bmcgZ1x1MUVFRGkgXHUwMTExXHUwMUIwXHUxRUUzYyB5XHUwMEVBdSBjXHUxRUE3dS4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHsgc2V0Vm9pY2VOb3RpY2UoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpLicpOyB9XG4gIH07XG5cbiAgY29uc3QgbmdhdFZvaWNlQ2FwID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghY29uZmlybSgnTmdcdTFFQUZ0IGNcdTFFQjdwIHZvaWNlIFx1MDExMWFuZyBob1x1MUVBMXQgXHUwMTExXHUxRUQ5bmc/JykpIHJldHVybjtcbiAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2VfZW5kJyB9KVxuICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICBwb2xsVm9pY2UoKTtcbiAgfTtcblxuICBjb25zdCB0b2dnbGVNaWMgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKG1pY011dGVkKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoIWxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAvLyBNaWMgYlx1MUVDQiB0XHUxRUVCIGNoXHUxRUQxaSBsXHUwMEZBYyBqb2luIFx1MjE5MiB4aW4gbFx1MUVBMWk7IGFkZFRyYWNrIG11XHUxRUQ5biBjXHUxRUE3biByZW5lZ290aWF0ZSAob2ZmZXIgbVx1MUVEQmkpLlxuICAgICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgYXVkaW86IHRydWUsIHZpZGVvOiBmYWxzZSB9KTtcbiAgICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50ID0gc3RyZWFtO1xuICAgICAgICAgIGNvbnN0IHBjID0gcGNSZWYuY3VycmVudDtcbiAgICAgICAgICBpZiAocGMpIHtcbiAgICAgICAgICAgIHN0cmVhbS5nZXRUcmFja3MoKS5mb3JFYWNoKHRyYWNrID0+IHBjLmFkZFRyYWNrKHRyYWNrLCBzdHJlYW0pKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IG9mZmVyID0gYXdhaXQgcGMuY3JlYXRlT2ZmZXIoKTtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihvZmZlcik7XG4gICAgICAgICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnb2ZmZXInLCBwYXlsb2FkOiBvZmZlciB9KVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiByZW5lZ290aWF0aW9uIHRoXHUxRUE1dCBiXHUxRUExaSBcdTIwMTQgbmdoZSB2XHUxRUFCbiBcdTAxMTFcdTAxQjBcdTFFRTNjICovIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRBdWRpb1RyYWNrcygpLmZvckVhY2godCA9PiB7IHQuZW5hYmxlZCA9IHRydWU7IH0pO1xuICAgICAgICB9XG4gICAgICAgIHNldE1pY011dGVkKGZhbHNlKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBhbGVydCgnS2hcdTAwRjRuZyB0aFx1MUVDMyBtXHUxRURGIG1pY3JvOiAnICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldEF1ZGlvVHJhY2tzKCkuZm9yRWFjaCh0ID0+IHsgdC5lbmFibGVkID0gZmFsc2U7IH0pO1xuICAgICAgfVxuICAgICAgc2V0TWljTXV0ZWQodHJ1ZSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGxlYXZlVm9pY2UgPSAoKSA9PiB7XG4gICAgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdsZWF2ZScsIHBheWxvYWQ6IHt9IH0pXG4gICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgIGR1bmdLZXROb2lWb2ljZSgpO1xuICAgIHNldFZvaWNlSm9pbmVkKGZhbHNlKTtcbiAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICB2b2ljZVNsb3RSZWYuY3VycmVudCA9IG51bGw7XG4gICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMFx1MDBFMyBuZ1x1MUVBRnQgdm9pY2UuJyk7XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGlkPVwic3R1ZHktZG9jay1jb250YWluZXJcIiBzdHlsZT17eyBvdmVyZmxvd0FuY2hvcjogJ25vbmUnIH19IGNsYXNzTmFtZT17YGJnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzE2MWIyNl0gdG8tWyMwZjE0MWRdIGJvcmRlciBib3JkZXItd2hpdGUvWzAuMDhdIHJvdW5kZWQtMnhsIHAtNCBmbGV4IGZsZXgtY29sIHNoYWRvdy14bCAke2lzUm9vbVdpZGUgPyAnbWluLWgtW2NhbGMoMTAwdmgtMTYwcHgpXSBoLWZ1bGwgZmxleC0xJyA6ICdoLVs2MjBweF0gbGc6aC1bNjgwcHhdJ31gfT5cbiAgICAgIHsvKiBTdHVkeSBEb2NrIFRhYiBOYXZpZ2F0aW9uIFx1MjAxNCBHXHUxRUNEbiBnXHUwMEUwbmcsIHRoXHUxRUE5bSBtXHUxRUY5LCBuXHUwMEZBdCBuXHUxRUQ1aSBiXHUxRUFEdCAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIHBiLTMgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIGZsZXgtd3JhcCBzaHJpbmstMFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LWNoYXRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdjaGF0Jyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnY2hhdCdcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENBQzwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkNoYXQgcGhcdTAwRjJuZzwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1ub3Rlc1wiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ25vdGVzJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnbm90ZXMnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDREQ8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5HaGkgY2hcdTAwRkE8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktd2hpdGVib2FyZFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3doaXRlYm9hcmQnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICd3aGl0ZWJvYXJkJ1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkE4PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Qlx1MUVBM25nIHZcdTFFQkQ8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktc2hlZXRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdzaGVldCcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3NoZWV0J1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0NBPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Qlx1MUVBM25nIHRcdTAwRURuaDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS12b2ljZVwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3ZvaWNlJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAndm9pY2UnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1hbWJlci01MDAgdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMjUxLDE5MSwzNiwwLjM1KV0gYm9yZGVyIGJvcmRlci1hbWJlci00MDAvNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERjk5XHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Vm9pY2UgKDEtMSk8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktbWVtYmVyc1wiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ21lbWJlcnMnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdtZW1iZXJzJ1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1lbWVyYWxkLTQwMCB0by10ZWFsLTUwMCB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSg1MiwyMTEsMTUzLDAuMzUpXSBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNDAwLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REM2NTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPlRoXHUwMEUwbmggdmlcdTAwRUFue3RoYW5oVmllbi5sZW5ndGggPiAwID8gYCAoJHt0aGFuaFZpZW4ubGVuZ3RofSlgIDogJyd9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAge2lzU3RhZmYgJiYgKFxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1xdWFuLXRyaVwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdxdWFuLXRyaScpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdxdWFuLXRyaSdcbiAgICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS12aW9sZXQtNTAwIHRvLXB1cnBsZS01MDAgdGV4dC13aGl0ZSBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMTM5LDkyLDI0NiwwLjM1KV0gYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzUwJ1xuICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MjY5OVx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+UXV5XHUxRUMxbjwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBEb2NrIENvbnRlbnQgQm9keSAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgcHQtMyBtaW4taC0wIGgtZnVsbCBvdmVyZmxvdy1oaWRkZW5cIj5cbiAgICAgICAgey8qIFRBQiAxOiBDSEFUIFBIXHUwMEQyTkcgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAnY2hhdCcgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgbWluLWgtMCBoLWZ1bGxcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXktYXV0byBzcGFjZS15LTMgcHItMSBtaW4taC0wIHRleHQteHNcIj5cbiAgICAgICAgICAgICAge3Bob25nQ2hhdC5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDAgdGV4dC1jZW50ZXIgcHktOFwiPkNoXHUwMUIwYSBjXHUwMEYzIHRpbiBuaFx1MUVBRm4gXHUyMDE0IGhcdTAwRTN5IGdcdTFFRURpIGNcdTAwRTJ1IGhcdTFFQ0ZpIGhvXHUxRUI3YyB0cmFvIFx1MDExMVx1MUVENWkgdlx1MUVDMSBiXHUwMEUwaSBnaVx1MUVBM25nITwvcD5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICBwaG9uZ0NoYXQubWFwKChtLCBpZHgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG15TmFtZSA9IFN0cmluZyhhdXRoPy51c2VyPy5ob1RlbiB8fCBhdXRoPy51c2VyPy5uYW1lIHx8IGF1dGg/LnVzZXI/LnRlbiB8fCAnJykudHJpbSgpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgbGFDaGluaE1pbmggPSBCb29sZWFuKFxuICAgICAgICAgICAgICAgICAgICBtLmN1YVRvaSB8fFxuICAgICAgICAgICAgICAgICAgICAobS5raG9hICYmIHBob25nTWluaEtob2EgJiYgbS5raG9hID09PSBwaG9uZ01pbmhLaG9hKSB8fFxuICAgICAgICAgICAgICAgICAgICAobXlOYW1lICYmIG0udGVuTmd1b2lHdWkgJiYgbS50ZW5OZ3VvaUd1aS50cmltKCkudG9Mb3dlckNhc2UoKSA9PT0gbXlOYW1lLnRvTG93ZXJDYXNlKCkpXG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgY29uc3QgdGltZVN0ciA9IG0udGFvTHVjID8gbmV3IERhdGUobS50YW9MdWMucmVwbGFjZSgnICcsICdUJykgKyAobS50YW9MdWMuaW5jbHVkZXMoJ1QnKSA/ICcnIDogJ1onKSkudG9Mb2NhbGVUaW1lU3RyaW5nKFtdLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSkgOiAnJztcblxuICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgIGtleT17bS5pZCB8fCBpZHh9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleCBmbGV4LWNvbCBncm91cCB3LWZ1bGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhQ2hpbmhNaW5oID8gJ2l0ZW1zLWVuZCcgOiAnaXRlbXMtc3RhcnQnXG4gICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgIHsvKiBIZWFkZXIgdGhcdTAwRjRuZyB0aW4gbmdcdTAxQjBcdTFFRERpIGdcdTFFRURpICovfVxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBtYi0xIHRleHQtWzExcHhdICR7bGFDaGluaE1pbmggPyAnZmxleC1yb3ctcmV2ZXJzZScgOiAnJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YGZvbnQtZXh0cmFib2xkICR7bGFDaGluaE1pbmggPyAndGV4dC1bIzAwRjJGRV0nIDogJ3RleHQtc2xhdGUtMjAwJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge20udGVuTmd1b2lHdWl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bGFDaGluaE1pbmggJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCBzaGFkb3ctc21cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBCXHUxRUExblxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAge20udmFpVHJvID09PSAnZ2lhb192aWVuJyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuMiByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBHVkNOXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICkgOiBtLmxvcFRlbiA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuMiByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8yMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHttLmxvcFRlbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCBmb250LW1vbm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge3RpbWVTdHJ9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7aXNTdGFmZiAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlhvXHUwMEUxIHRpbiBuaFx1MUVBRm4gblx1MDBFMHkgKHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nKVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY2hhdD9waG9uZ0lkPSR7cGhvbmcuaWR9JmlkPSR7bS5pZH1gLCB7IG1ldGhvZDogJ0RFTEVURScgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZC5vayAmJiBvblhvYVRpblBob25nKSBvblhvYVRpblBob25nKG0uaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCB7IC8qIGJcdTFFQ0YgcXVhICovIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wYWNpdHktMCBncm91cC1ob3ZlcjpvcGFjaXR5LTEwMCBweC0xIHRleHQtWzlweF0gdGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1yb3NlLTQwMCB0cmFuc2l0aW9uLWFsbCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICB7LyogQnViYmxlIHRpbiBuaFx1MUVBRm4gKi99XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgbWF4LXctWzg1JV0gc206bWF4LXctWzc4JV0gcHgtMy41IHB5LTIgdGV4dC14cyBsZWFkaW5nLXJlbGF4ZWQgYnJlYWstd29yZHMgc2hhZG93LW1kIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxhQ2hpbmhNaW5oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAncm91bmRlZC0yeGwgcm91bmRlZC10ci14cyBiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMGI0ZDhdLzI1IHZpYS1bIzAwNzdiNl0vMzAgdG8tWyMwMEYyRkVdLzIwIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIHRleHQtd2hpdGUgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjEyKV0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAncm91bmRlZC0yeGwgcm91bmRlZC10bC14cyBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3Zlcjpib3JkZXItd2hpdGUvMjAgdGV4dC1zbGF0ZS0yMDAnXG4gICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ3aGl0ZXNwYWNlLXByZS13cmFwXCI+e20ubm9pRHVuZ308L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bS52aWRlb1RpbWVTZWMgIT0gbnVsbCAmJiBtLnZpZGVvVGltZVNlYyA+PSAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHlldUNhdVR1YShtLnZpZGVvVGltZVNlYyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXQtMS41IGlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBweC0yIHB5LTAuNSByb3VuZGVkLWxnIHRleHQtWzEwcHhdIGZvbnQtYmxhY2sgYmctY3lhbi00MDAvMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMzAgaG92ZXI6YmctWyMwMEYyRkVdLzMwIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHUyNUI2PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPntkaW5oRGFuZ0dpYXlQaHV0KG0udmlkZW9UaW1lU2VjKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDxkaXYgcmVmPXtjaGF0RW5kUmVmfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVTZW5kUm9vbUNoYXR9IGNsYXNzTmFtZT1cInB0LTIgYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzggZmxleCBmbGV4LWNvbCBnYXAtMiBtdC1hdXRvIHNocmluay0wXCI+XG4gICAgICAgICAgICAgIHsvKiBFbW9qaSBwYW5lbCAqL31cbiAgICAgICAgICAgICAge3Nob3dFbW9qaSAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBnYXAtMSBwLTIgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGxcIj5cbiAgICAgICAgICAgICAgICAgIHtbJ1x1RDgzRFx1REUwQScsJ1x1RDgzRFx1REUwMicsJ1x1RDgzRVx1REQ3MCcsJ1x1RDgzRFx1REUwRScsJ1x1RDgzRVx1REQxNCcsJ1x1RDgzRFx1REUwNScsJ1x1RDgzRFx1REUyRCcsJ1x1RDgzRFx1REQyNScsJ1x1Mjc2NFx1RkUwRicsJ1x1RDgzRFx1REM0RCcsJ1x1RDgzRFx1REU0RicsJ1x1RDgzQ1x1REY4OScsJ1x1MjcwNScsJ1x1RDgzRFx1RENBRicsJ1x1RDgzRFx1REM0QicsJ1x1RDgzRFx1RENEQScsJ1x1MjcwRlx1RkUwRicsJ1x1RDgzQ1x1REZBRicsJ1x1RDgzQ1x1REYxRicsJ1x1RDgzRFx1RENBMScsJ1x1MjZBMScsJ1x1RDgzQ1x1REZDNicsJ1x1RDgzRVx1REQxRCcsJ1x1RDgzRFx1RENBQScsJ1x1RDgzRVx1REQyOSddLm1hcChlbSA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24ga2V5PXtlbX0gdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRDaGF0SW5wdXQodiA9PiB2ICsgZW0pOyBzZXRTaG93RW1vamkoZmFsc2UpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtbGcgaG92ZXI6c2NhbGUtMTI1IHRyYW5zaXRpb24tdHJhbnNmb3JtIGFjdGl2ZTpzY2FsZS05NSBweC0xXCI+e2VtfTwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIGZsZXgtMVwiPlxuICAgICAgICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtcGhvbmctY2hhdFwiXG4gICAgICAgICAgICAgICAgICAgIHJvd3M9ezF9XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtjb1F1eWVuKCdjaGF0JykgPyAnTmhcdTFFQUZuIHRpbiBwaFx1MDBGMm5nIGhcdTFFQ0RjLi4uJyA6ICdDaGF0IFx1MDExMWFuZyBiXHUxRUNCIGtoXHUwMEYzYSd9XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtjaGF0SW5wdXR9XG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshY29RdXllbignY2hhdCcpfVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRDaGF0SW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ9eygpID0+IHsgY2hhdENvbXBvc2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICAgICAgb25Db21wb3NpdGlvbkVuZD17KCkgPT4geyBjaGF0Q29tcG9zaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTsgfX1cbiAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXtlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLm5hdGl2ZUV2ZW50Py5pc0NvbXBvc2luZyB8fCBjaGF0Q29tcG9zaW5nUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZVNlbmRSb29tQ2hhdCgpO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXs1MDB9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBweC00IHB5LTIuNSB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwIGZvY3VzOnNoYWRvdy1bMF8wXzEycHhfcmdiYSgwLDI0MiwyNTQsMC4xMildIHJlc2l6ZS1ub25lIG1pbi1oLVszOHB4XSBtYXgtaC0yNCBkaXNhYmxlZDpvcGFjaXR5LTQwIHRyYW5zaXRpb24tYWxsXCJcbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgey8qIEVtb2ppIGJ1dHRvbiAqL31cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshY29RdXllbignY2hhdCcpfVxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2hvd0Vtb2ppKHYgPT4gIXYpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy05IGgtOSByb3VuZGVkLTJ4bCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LWJhc2UgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS0zMCBzaHJpbmstMCBhY3RpdmU6c2NhbGUtOTAgJHtcbiAgICAgICAgICAgICAgICAgICAgc2hvd0Vtb2ppID8gJ2JnLVsjMDBGMkZFXS8yMCBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCB0ZXh0LVsjMDBGMkZFXScgOiAnYmctd2hpdGUvNSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgaG92ZXI6Ymctd2hpdGUvMTAnXG4gICAgICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ2hcdTFFQ0RuIGVtb2ppXCI+XG4gICAgICAgICAgICAgICAgICBcdUQ4M0RcdURFMEFcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICB7LyogU2VuZCBidXR0b24gKi99XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi1zZW5kLXBob25nLWNoYXRcIlxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjaGF0SW5wdXQudHJpbSgpIHx8IGNoYXRTZW5kaW5nIHx8ICFjb1F1eWVuKCdjaGF0Jyl9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTkgaC05IHJvdW5kZWQtMnhsIGJnLWdyYWRpZW50LXRvLWJyIGZyb20tWyMwMEYyRkVdIHRvLVsjM0I4MkY2XSB0ZXh0LWJsYWNrIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS0zMCBzaHJpbmstMCBob3ZlcjpicmlnaHRuZXNzLTExMCBhY3RpdmU6c2NhbGUtOTAgc2hhZG93LVswXzBfMTJweF9yZ2JhKDAsMjQyLDI1NCwwLjMpXVwiPlxuICAgICAgICAgICAgICAgICAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIiBjbGFzc05hbWU9XCJ3LTQgaC00XCI+XG4gICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMy40NzggMi40MDVhLjc1Ljc1IDAgMDAtLjkyNi45NGwyLjQzMiA3LjkwNUgxMy41YS43NS43NSAwIDAxMCAxLjVINC45ODRsLTIuNDMyIDcuOTA1YS43NS43NSAwIDAwLjkyNi45NCA2MC41MTkgNjAuNTE5IDAgMDAxOC40NDUtOC45ODYuNzUuNzUgMCAwMDAtMS4yMThBNjAuNTE3IDYwLjUxNyAwIDAwMy40NzggMi40MDV6XCIgLz5cbiAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDI6IEdISSBDSFx1MDBEQSBDXHUxRUQ4TkcgVFx1MDBDMUMgXHUyMDE0IGVudHJ5IGFwcGVuZCwgY1x1MDBGMyBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdub3RlcycgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTIgbWluLWgtMCBoLWZ1bGxcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgIDxzcGFuPkdoaSBjaFx1MDBGQSBjaHVuZyBjXHUxRUU3YSBwaFx1MDBGMm5nIFx1MjAxNCBtXHUxRUQ3aSBuZ1x1MDFCMFx1MUVERGkgdGhcdTAwRUFtIG1cdTFFRDl0IGRcdTAwRjJuZywgY1x1MDBGMyB0aFx1MUVDMyBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbzwvc3Bhbj5cbiAgICAgICAgICAgICAge25vdGVzTm90aWNlICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtcm9zZS0zMDAgZm9udC1ib2xkXCI+e25vdGVzTm90aWNlfTwvc3Bhbj59XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXktYXV0byBzcGFjZS15LTIgcHItMSBtaW4taC0wIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0yLjVcIj5cbiAgICAgICAgICAgICAge25vdGVzTGlzdC5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDAgdGV4dC1jZW50ZXIgcHktOFwiPkNoXHUwMUIwYSBjXHUwMEYzIGdoaSBjaFx1MDBGQSBcdTIwMTQgdGhcdTAwRUFtIGRcdTAwRjJuZyBcdTAxMTFcdTFFQTd1IHRpXHUwMEVBbiBjaG8gY1x1MUVBMyBwaFx1MDBGMm5nLjwvcD5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICBub3Rlc0xpc3QubWFwKChuKSA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17bi5pZH0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1zdGFydCBnYXAtMiBncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBmbGV4LXdyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTQwMFwiPntuLnRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bi52aWRlb1RpbWVTZWMgIT0gbnVsbCAmJiBuLnZpZGVvVGltZVNlYyA+IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geWV1Q2F1VHVhKG4udmlkZW9UaW1lU2VjKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCBob3ZlcjpiZy12aW9sZXQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2IHtkaW5oRGFuZ0dpYXlQaHV0KG4udmlkZW9UaW1lU2VjKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTYwMCBmb250LW1vbm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge24udGFvTHVjID8gbmV3IERhdGUobi50YW9MdWMucmVwbGFjZSgnICcsICdUJykgKyAnWicpLnRvTG9jYWxlVGltZVN0cmluZyhbXSwgeyBob3VyOiAnMi1kaWdpdCcsIG1pbnV0ZTogJzItZGlnaXQnIH0pIDogJyd9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTIwMCBsZWFkaW5nLXJlbGF4ZWQgYnJlYWstd29yZHNcIj57bi5ub2lEdW5nfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIHsobi5jdWFUb2kgfHwgaXNTdGFmZikgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geG9hR2hpQ2h1KG4uaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJYb1x1MDBFMSBnaGkgY2hcdTAwRkFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHRleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtcm9zZS00MDAgdGV4dC1bMTBweF0gcHgtMSB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICB7bm90ZXNDYW5Xcml0ZSA/IChcbiAgICAgICAgICAgICAgPGZvcm1cbiAgICAgICAgICAgICAgICBvblN1Ym1pdD17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICBpZiAoIWUubmF0aXZlRXZlbnQ/LmlzQ29tcG9zaW5nICYmICFub3RlQ29tcG9zaW5nUmVmLmN1cnJlbnQpIHRoZW1HaGlDaHUoKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgaWQ9XCJzdHVkeS1ub3RlLWlucHV0XCJcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtub3RlSW5wdXR9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXROb3RlSW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0PXsoKSA9PiB7IG5vdGVDb21wb3NpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPXsoKSA9PiB7IG5vdGVDb21wb3NpbmdSZWYuY3VycmVudCA9IGZhbHNlOyB9fVxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJUaFx1MDBFQW0gZ2hpIGNoXHUwMEZBIGNobyBwaFx1MDBGMm5nLi4uXCJcbiAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17MTAwMH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwIHJvdW5kZWQteGwgcHgtMyBweS0yIHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0Tm90ZVdpdGhUaW1lKHYgPT4gIXYpfVxuICAgICAgICAgICAgICAgICAgdGl0bGU9e25vdGVXaXRoVGltZSA/ICdcdTAxMTBhbmcgZ1x1MUVBRm4gbVx1MUVEMWMgdmlkZW8gdlx1MDBFMG8gZ2hpIGNoXHUwMEZBJyA6ICdLaFx1MDBGNG5nIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvJ31cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTIuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7bm90ZVdpdGhUaW1lID8gJ2JnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlci12aW9sZXQtNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNTAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICAgICAgICBcdTIzRjFcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLWFkZC1ub3RlXCJcbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshbm90ZUlucHV0LnRyaW0oKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMiByb3VuZGVkLXhsIGJnLVsjMDBGMkZFXSB0ZXh0LWJsYWNrIHRleHQteHMgZm9udC1ibGFjayBkaXNhYmxlZDpvcGFjaXR5LTMwXCI+XG4gICAgICAgICAgICAgICAgICBUaFx1MDBFQW1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1hbWJlci0zMDAvODAgdGV4dC1jZW50ZXIgcHktMVwiPlx1RDgzRFx1REQxMiBHaGkgY2hcdTAwRkEgXHUwMTExYW5nIFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgY2hcdTFFQzkgeGVtIFx1MjAxNCBxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZyBcdTAxMTFcdTAwRTMga2hcdTAwRjNhLjwvcD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRBQiAzOiBCXHUxRUEyTkcgVlx1MUVCQyBDXHUxRUQ4TkcgVFx1MDBDMUMgKFNIQVJFRCBXSElURUJPQVJEKSAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICd3aGl0ZWJvYXJkJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMiBtaW4taC0wIGgtZnVsbFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgZmxleC13cmFwIHRleHQteHMgcGItMVwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi13Yi1wZW5cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0V2JUb29sKCdwZW4nKX1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshd2JDYW5Xcml0ZX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTIuNSBweS0xIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgZGlzYWJsZWQ6b3BhY2l0eS00MCAke3diVG9vbCA9PT0gJ3BlbicgPyAnYmctWyMwMEYyRkVdIHRleHQtYmxhY2snIDogJ2JnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwJ31gfT5cbiAgICAgICAgICAgICAgICAgIFx1MjcwRlx1RkUwRiBCXHUwMEZBdCB2XHUxRUJEXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi13Yi1lcmFzZXJcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0V2JUb29sKCdlcmFzZXInKX1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshd2JDYW5Xcml0ZX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTIuNSBweS0xIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgZGlzYWJsZWQ6b3BhY2l0eS00MCAke3diVG9vbCA9PT0gJ2VyYXNlcicgPyAnYmctcm9zZS01MDAgdGV4dC13aGl0ZScgOiAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAnfWB9PlxuICAgICAgICAgICAgICAgICAgXHVEODNFXHVEREY5IFRcdTFFQTl5XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBtbC0yXCI+XG4gICAgICAgICAgICAgICAgICB7WycjMDBGMkZFJywgJyNGRkI4MDAnLCAnI0Y0M0Y1RScsICcjRkZGRkZGJ10ubWFwKGMgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAga2V5PXtjfVxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshd2JDYW5Xcml0ZX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldFdiQ29sb3IoYyk7IHNldFdiVG9vbCgncGVuJyk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy01IGgtNSByb3VuZGVkLWZ1bGwgYm9yZGVyIGRpc2FibGVkOm9wYWNpdHktNDAgJHt3YkNvbG9yID09PSBjICYmIHdiVG9vbCA9PT0gJ3BlbicgPyAnc2NhbGUtMTEwIGJvcmRlci13aGl0ZSByaW5nLTIgcmluZy1jeWFuLTQwMCcgOiAnYm9yZGVyLXRyYW5zcGFyZW50J31gfVxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6IGMgfX1cbiAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17Y31cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAge2lzU3RhZmYgJiYgKFxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4td2ItY2xlYXJcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17Y2xlYXJXaGl0ZWJvYXJkfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy13aGl0ZS81IGhvdmVyOmJnLXJvc2UtNTAwLzIwIHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXhzIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgWFx1MDBGM2EgYlx1MUVBM25nXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgb3ZlcmZsb3ctaGlkZGVuIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJlbGF0aXZlIHRvdWNoLW5vbmUgbWluLWgtWzIyMHB4XVwiPlxuICAgICAgICAgICAgICB7IXdiQ2FuV3JpdGUgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgaW5zZXQtMCB6LTEwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLWJsYWNrLzQwIHRleHQtWzExcHhdIHRleHQtYW1iZXItMzAwLzkwIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgXHVEODNEXHVERDEyIEJcdTFFQTNuZyB2XHUxRUJEIFx1MDExMWFuZyBcdTFFREYgY2hcdTFFQkYgXHUwMTExXHUxRUQ5IGNoXHUxRUM5IHhlbVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8Y2FudmFzXG4gICAgICAgICAgICAgICAgaWQ9XCJzdHVkeS13aGl0ZWJvYXJkLWNhbnZhc1wiXG4gICAgICAgICAgICAgICAgcmVmPXtjYW52YXNSZWZ9XG4gICAgICAgICAgICAgICAgd2lkdGg9ezY0MH1cbiAgICAgICAgICAgICAgICBoZWlnaHQ9ezMyMH1cbiAgICAgICAgICAgICAgICBvbk1vdXNlRG93bj17d2JDYW5Xcml0ZSA/IHN0YXJ0RHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvbk1vdXNlTW92ZT17d2JDYW5Xcml0ZSA/IGRyYXdNb3ZlIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uTW91c2VVcD17d2JDYW5Xcml0ZSA/IHN0b3BEcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17d2JDYW5Xcml0ZSA/IHN0b3BEcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uVG91Y2hTdGFydD17d2JDYW5Xcml0ZSA/IHN0YXJ0RHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvblRvdWNoTW92ZT17d2JDYW5Xcml0ZSA/IGRyYXdNb3ZlIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uVG91Y2hFbmQ9e3diQ2FuV3JpdGUgPyBzdG9wRHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgaC1mdWxsICR7d2JDYW5Xcml0ZSA/ICdjdXJzb3ItY3Jvc3NoYWlyJyA6ICdjdXJzb3Itbm90LWFsbG93ZWQnfWB9XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDQ6IEJcdTFFQTJORyBUXHUwMENETkggQ1x1MUVEOE5HIFRcdTAwQzFDIChTSEFSRUQgU0hFRVQgOHgxMCkgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAnc2hlZXQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0yIG92ZXJmbG93LXgtYXV0byBtaW4taC0wIGgtZnVsbFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICBCXHUxRUEzbmcgdFx1MDBFRG5oIHBoXHUwMEUybiB0XHUwMEVEY2ggc1x1MUVEMSBsaVx1MUVDN3UgLyBtXHUxRUQxYyB0aFx1MUVERGkgZ2lhbiBoXHUxRUNEYyB0XHUxRUFEcCAoTFx1MDFCMHUgdFx1MUVGMSBcdTAxMTFcdTFFRDluZylcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3ctYXV0byBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgYmctWyMwQjBFMTRdIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgPHRhYmxlIGlkPVwic3R1ZHktc2hlZXQtdGFibGVcIiBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC14cyB0ZXh0LXNsYXRlLTMwMCBib3JkZXItY29sbGFwc2VcIj5cbiAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItYiBib3JkZXItd2hpdGUvMTAgZm9udC1tb25vXCI+XG4gICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJ3LTggcC0xIHRleHQtY2VudGVyIGJvcmRlci1yIGJvcmRlci13aGl0ZS8xMCB0ZXh0LVsxMHB4XVwiPiM8L3RoPlxuICAgICAgICAgICAgICAgICAgICB7Q09MUy5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgPHRoIGtleT17Y30gY2xhc3NOYW1lPVwicC0xLjUgdGV4dC1jZW50ZXIgYm9yZGVyLXIgYm9yZGVyLXdoaXRlLzEwIG1pbi13LVs3MHB4XSB0ZXh0LVsxMXB4XSBmb250LWJvbGQgdGV4dC1jeWFuLTMwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge2N9XG4gICAgICAgICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAge1JPV1MubWFwKHIgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8dHIga2V5PXtyfSBjbGFzc05hbWU9XCJib3JkZXItYiBib3JkZXItd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS9bMC4wMl1cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0xIHRleHQtY2VudGVyIGJnLXdoaXRlLzUgdGV4dC1zbGF0ZS01MDAgZm9udC1tb25vIHRleHQtWzEwcHhdIGJvcmRlci1yIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3J9XG4gICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICB7Q09MUy5tYXAoYyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjZWxsS2V5ID0gYCR7Y30ke3J9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBrZXk9e2NlbGxLZXl9IGNsYXNzTmFtZT1cInAtMCBib3JkZXItciBib3JkZXItd2hpdGUvNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS1jZWxsPXtjZWxsS2V5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3NoZWV0Q2VsbHNbY2VsbEtleV0gfHwgJyd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFkT25seT17IXNoZWV0Q2FuV3JpdGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkZvY3VzPXsoKSA9PiB7IHNoZWV0Rm9jdXNlZENlbGxSZWYuY3VycmVudCA9IGNlbGxLZXk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IHsgc2hlZXRGb2N1c2VkQ2VsbFJlZi5jdXJyZW50ID0gbnVsbDsgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNoZWV0Q2FuV3JpdGUgJiYgaGFuZGxlQ2VsbENoYW5nZShjZWxsS2V5LCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgYmctdHJhbnNwYXJlbnQgcHgtMiBweS0xIHRleHQteHMgdGV4dC13aGl0ZSBmb2N1czpiZy1bIzE1MUEyM10gZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLVsjMDBGMkZFXSAkeyFzaGVldENhbldyaXRlID8gJ29wYWNpdHktNjAgY3Vyc29yLW5vdC1hbGxvd2VkJyA6ICcnfWB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRBQiA1OiAxLVRPLTEgV0VCUlRDIFZPSUNFIFx1MjAxNCBwYWlyLWJvdW5kLCBjXHUwMEYzIHhpbiBxdXlcdTFFQzFuICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ3ZvaWNlJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC02IHRleHQtY2VudGVyIGdhcC00XCI+XG4gICAgICAgICAgICA8YXVkaW8gcmVmPXtyZW1vdGVBdWRpb1JlZn0gYXV0b1BsYXkgLz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xNiBoLTE2IHJvdW5kZWQtM3hsIGJnLWFtYmVyLTQwMC8xNSBib3JkZXIgYm9yZGVyLWFtYmVyLTQwMC8zMCB0ZXh0LWFtYmVyLTQwMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LTN4bCBzaGFkb3ctWzBfMF8yMHB4X3JnYmEoMjQ1LDE1OCwxMSwwLjIpXVwiPlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcdUZFMEZcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlXCI+VGhvXHUxRUExaSBUclx1MUVGMWMgVGlcdTFFQkZwIDEtMSBUcm9uZyBQaFx1MDBGMm5nPC9oND5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBtYXgtdy14cyBtdC0xXCI+XG4gICAgICAgICAgICAgICAgTVx1MUVEN2kgcGhcdTAwRjJuZyB0XHUxRUQxaSBcdTAxMTFhIG1cdTFFRDl0IGNcdTFFQjdwIHZvaWNlIDEtMS4gTWljcm8gbVx1MUVCN2MgXHUwMTExXHUxRUNCbmggdFx1MUVBRnQga2hpIGNoXHUwMUIwYSBiXHUxRUFEdC5cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBUclx1MUVBMW5nIHRoXHUwMEUxaSBjXHUxRUI3cCBoaVx1MUVDN24gdFx1MUVBMWkgKi99XG4gICAgICAgICAgICB7dm9pY2VQYWlyPy5hY3RpdmUgIT09IHVuZGVmaW5lZCAmJiAoXG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBiZy13aGl0ZS81IHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICAgIHt2b2ljZVBhaXI/LmFUZW4gPyBgJHt2b2ljZVBhaXIuYVRlbn0ke3ZvaWNlUGFpci5iVGVuID8gJyBcdTIxOTQgJyArIHZvaWNlUGFpci5iVGVuIDogJyBcdTAwQjcgXHUwMTExYW5nIGNoXHUxRUREIG5nXHUwMUIwXHUxRUREaSB0aFx1MUVFOSAyJ31gIDogJ0NoXHUwMUIwYSBjXHUwMEYzIGNcdTFFQjdwIHZvaWNlIG5cdTAwRTBvJ31cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyBmbGV4LXdyYXAganVzdGlmeS1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgeyF2b2ljZUpvaW5lZCA/IChcbiAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAge2NvUXV5ZW4oJ3ZvaWNlJykgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1qb2luXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtqb2luVm9pY2V9XG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZvaWNlUGFpcj8uYWN0aXZlICYmICF2b2ljZVBhaXI/LnlvdUlufVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMi41IHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1vcmFuZ2UtNTAwIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIHNoYWRvdy1sZyBob3ZlcjpvcGFjaXR5LTkwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3ZvaWNlUGFpcj8uYWN0aXZlID8gJ1x1MDExMGFuZyBjXHUwMEYzIGNcdTFFQjdwIHZvaWNlIGtoXHUwMEUxYycgOiB2b2ljZVBhaXI/LmFUZW4gPyAnVlx1MDBFMG8gY1x1MUVCN3Agdlx1MUVEQmkgJyArIHZvaWNlUGFpci5hVGVuIDogJ1RoYW0gZ2lhIHZvaWNlJ31cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2UtcmVxdWVzdFwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17eGluUXV5ZW5Wb2ljZX1cbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dm9pY2VSZXF1ZXN0ZWR9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNSBweS0yLjUgcm91bmRlZC14bCBiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTIwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IGZvbnQtYm9sZCB0ZXh0LXhzIGhvdmVyOmJnLXdoaXRlLzE1IHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7dm9pY2VSZXF1ZXN0ZWQgPyAnXHUyM0YzIFx1MDExMGFuZyBjaFx1MUVERCBkdXlcdTFFQzd0XHUyMDI2JyA6ICdcdUQ4M0RcdURFNEIgWGluIHF1eVx1MUVDMW4gdm9pY2UnfVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLXRvZ2dsZS1taWNcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVNaWN9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTQgcHktMi41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke21pY011dGVkID8gJ2JnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOmJnLXdoaXRlLzE1JyA6ICdiZy1lbWVyYWxkLTUwMCB0ZXh0LWJsYWNrJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+e21pY011dGVkID8gJ1x1RDgzRFx1REQwNyBCXHUxRUFEdCBNaWMnIDogJ1x1RDgzQ1x1REY5OVx1RkUwRiBNaWMgXHUwMTEwYW5nIEJcdTFFQUR0J308L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLWxlYXZlXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17bGVhdmVWb2ljZX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8yMCB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMzAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgUlx1MUVERGkgdm9pY2VcbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICB7aXNTdGFmZiAmJiB2b2ljZVBhaXI/LmFUZW4gJiYgIXZvaWNlUGFpcj8ueW91SW4gJiYgKFxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2UtZW5kXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e25nYXRWb2ljZUNhcH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMi41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzI1IHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzIwIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICBOZ1x1MUVBRnQgY1x1MUVCN3Agdm9pY2VcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogU3RhZmY6IGRhbmggc1x1MDBFMWNoIHhpbiBxdXlcdTFFQzFuIHZvaWNlICovfVxuICAgICAgICAgICAge2lzU3RhZmYgJiYgeWV1Q2F1Vm9pY2UubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIG1heC13LXNtIGJnLXdoaXRlLzUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtMi41IHRleHQtbGVmdFwiPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdGV4dC1hbWJlci0zMDAgbWItMS41XCI+XHUwMTEwYW5nIHhpbiBxdXlcdTFFQzFuIHZvaWNlPC9wPlxuICAgICAgICAgICAgICAgIHt5ZXVDYXVWb2ljZS5tYXAociA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17ci5raG9hfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIHB5LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0yMDAgZm9udC1zZW1pYm9sZCBmbGV4LTEgdHJ1bmNhdGVcIj57ci50ZW4gfHwgJ1RoXHUwMEUwbmggdmlcdTAwRUFuJ308L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHIua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246IHRydWUgfSk7IGlmIChkPy5vaykgc2V0WWV1Q2F1Vm9pY2UocHJldiA9PiBwcmV2LmZpbHRlcih4ID0+IHgua2hvYSAhPT0gci5raG9hKSk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1lbWVyYWxkLTUwMC8yMCB0ZXh0LWVtZXJhbGQtMzAwIGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLWVtZXJhbGQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgRHV5XHUxRUM3dFxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHsgY29uc3QgZCA9IGF3YWl0IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogci5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogZmFsc2UgfSk7IGlmIChkPy5vaykgc2V0WWV1Q2F1Vm9pY2UocHJldiA9PiBwcmV2LmZpbHRlcih4ID0+IHgua2hvYSAhPT0gci5raG9hKSk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1yb3NlLTUwMC8xNSB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMjUgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgVFx1MUVFQiBjaFx1MUVEMWlcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICB7dm9pY2VOb3RpY2UgJiYgKFxuICAgICAgICAgICAgICA8cCBpZD1cInZvaWNlLXN0YXR1cy1ub3RpY2VcIiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIGZvbnQtbW9ubyBiZy1ibGFjay80MCBweC0zIHB5LTEuNSByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItd2hpdGUvNVwiPlxuICAgICAgICAgICAgICAgIHt2b2ljZU5vdGljZX1cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIG1heC13LXhzXCI+XG4gICAgICAgICAgICAgICogR2hpIGNoXHUwMEZBOiBLXHUxRUJGdCBuXHUxRUQxaSB0aG9cdTFFQTFpIFAyUCB5XHUwMEVBdSBjXHUxRUE3dSBtXHUxRUExbmcga2hcdTAwRjRuZyBjaFx1MUVCN24gVURQLiBSZXN0cmljdGl2ZSBOQVQgY1x1MDBGMyB0aFx1MUVDMyBjXHUxRUE3biByZWxheSBUVVJOLlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNzogVEhcdTAwQzBOSCBWSVx1MDBDQU4gVFJPTkcgUEhcdTAwRDJORyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdtZW1iZXJzJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMyBtaW4taC0wIGgtZnVsbFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcGItMiBib3JkZXItYiBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJsYWNrIHRleHQtd2hpdGUgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REM2NTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5UaFx1MDBFMG5oIHZpXHUwMEVBbiB0cm9uZyBwaFx1MDBGMm5nICh7dGhhbmhWaWVuLmxlbmd0aH0pPC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICAgICAgXHUwMTEwYW5nIHRyXHUxRUYxYyB0dXlcdTFFQkZuXG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0yIG92ZXJmbG93LXktYXV0byBwci0xIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAge3RoYW5oVmllbi5tYXAoKHR2LCBpZHgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBsYUhvc3QgPSB0di5sYUNodVBob25nID09PSAxIHx8IHR2LnZhaVRyb1Bob25nID09PSAnaG9zdCc7XG4gICAgICAgICAgICAgICAgY29uc3QgbGFHViA9IHR2LnZhaVRybyA9PT0gJ2dpYW9fdmllbic7XG4gICAgICAgICAgICAgICAgY29uc3QgbGFDb0hvc3QgPSB0di52YWlUcm9QaG9uZyA9PT0gJ2NvaG9zdCc7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JhbnRWb2ljZSA9IGdyYW50cy5zb21lKGcgPT4gZy5raG9hVFYgPT09IHR2Lmtob2EgJiYgZy5jYXBhYmlsaXR5ID09PSAndm9pY2UnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBncmFudFZpZGVvID0gZ3JhbnRzLnNvbWUoZyA9PiBnLmtob2FUViA9PT0gdHYua2hvYSAmJiBnLmNhcGFiaWxpdHkgPT09ICd2aWRlb19jb250cm9sJyk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICBrZXk9e3R2Lmtob2EgfHwgdHYudGVuIHx8IGlkeH1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSBwLTIuNSByb3VuZGVkLXhsIGJnLXdoaXRlL1swLjAzXSBob3ZlcjpiZy13aGl0ZS9bMC4wNl0gYm9yZGVyIGJvcmRlci13aGl0ZS81IGhvdmVyOmJvcmRlci10ZWFsLTUwMC8yNSB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctOCBoLTggcm91bmRlZC1mdWxsIGJnLWdyYWRpZW50LXRvLWJyIGZyb20tdGVhbC01MDAvMjAgdG8tZW1lcmFsZC01MDAvMjAgYm9yZGVyIGJvcmRlci10ZWFsLTUwMC8zMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXhzIGZvbnQtYmxhY2sgdGV4dC10ZWFsLTMwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHt0di5hdmF0YXIgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17dHYuYXZhdGFyfSBhbHQ9XCJcIiBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIHJvdW5kZWQtZnVsbCBvYmplY3QtY292ZXJcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAodHYudGVuIHx8ICc/JykuY2hhckF0KDApLnRvVXBwZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgbWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS0yMDAgdHJ1bmNhdGVcIj57dHYudGVufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUhvc3QgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzRFx1REM1MSBIb3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICB7bGFHViAmJiAhbGFIb3N0ICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy1bIzAwRjJGRV0vMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMzAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0NcdURGOTMgR2lcdTAwRTFvIHZpXHUwMEVBblxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAge2xhQ29Ib3N0ICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy12aW9sZXQtNTAwLzIwIHRleHQtdmlvbGV0LTMwMCBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvMzAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTJCNTAgQ28taG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIGJsb2NrIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dHYubG9wVGVuID8gYExcdTFFREJwICR7dHYubG9wVGVufWAgOiAobGFHViA/ICdHaVx1MDBFMW8gdmlcdTAwRUFuIHRyXHUwMUIwXHUxRUREbmcnIDogJ0hcdTFFQ0RjIHNpbmgnKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIHsvKiBNZW1iZXIgYWN0aW9ucyBuXHUxRUJGdSBsXHUwMEUwIGhvc3QvR1YgKi99XG4gICAgICAgICAgICAgICAgICAgIHsodmFpVHJvUGhvbmcgPT09ICdob3N0JyB8fCBhdXRoLnVzZXI/LmlzVGVhY2hlcikgJiYgIWxhSG9zdCAmJiB0di5raG9hICYmIChcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ3NldF9jb19ob3N0JywgeyBraG9hVFY6IHR2Lmtob2EsIG9uOiAhbGFDb0hvc3QgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtsYUNvSG9zdCA/ICdUaHUgcXV5XHUxRUMxbiBjby1ob3N0JyA6ICdDXHUxRUE1cCBjby1ob3N0J31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhQ29Ib3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy12aW9sZXQtNTAwLzIwIHRleHQtdmlvbGV0LTMwMCBib3JkZXItdmlvbGV0LTUwMC80MCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY28taG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHR2Lmtob2EsIGNhcGFiaWxpdHk6ICd2b2ljZScsIG9uOiAhZ3JhbnRWb2ljZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDXHUxRUE1cC90aHUgcXV5XHUxRUMxbiBtaWNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTYgaC02IHJvdW5kZWQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTBweF0gYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JhbnRWb2ljZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlci1hbWJlci01MDAvNDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzQ1x1REY5OVx1RkUwRlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHR2Lmtob2EsIGNhcGFiaWxpdHk6ICd2aWRlb19jb250cm9sJywgb246ICFncmFudFZpZGVvIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNcdTFFQTVwL3RodSBxdXlcdTFFQzFuIHZpZGVvXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy02IGgtNiByb3VuZGVkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYW50VmlkZW9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWJsdWUtNTAwLzIwIHRleHQtYmx1ZS0zMDAgYm9yZGVyLWJsdWUtNTAwLzQwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0NcdURGQTVcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25maXJtKGBLaWNrICR7dHYudGVufSBraFx1MUVDRmkgcGhcdTAwRjJuZz9gKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IGF3YWl0IGhhbmhEb25nUGhvbmc/Ligna2ljaycsIHsga2hvYVRWOiB0di5raG9hIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQgJiYgIWQub2spIGFsZXJ0KGQubG9pIHx8ICdLaFx1MDBGNG5nIGtpY2sgXHUwMTExXHUwMUIwXHUxRUUzYy4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiS2ljayBraFx1MUVDRmkgcGhcdTAwRjJuZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctNiBoLTYgcm91bmRlZCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LVsxMHB4XSBib3JkZXIgYmctcm9zZS01MDAvMTAgdGV4dC1yb3NlLTMwMCBib3JkZXItcm9zZS01MDAvMjUgaG92ZXI6Ymctcm9zZS01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0pfVxuXG4gICAgICAgICAgICAgIHt0aGFuaFZpZW4ubGVuZ3RoID09PSAwICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHB5LTggdGV4dC1zbGF0ZS01MDAgdGV4dC14c1wiPlxuICAgICAgICAgICAgICAgICAgQ2hcdTAxQjBhIGNcdTAwRjMgdGhcdTAwRTBuaCB2aVx1MDBFQW4gblx1MDBFMG8gdHJvbmcgcGhcdTAwRjJuZy5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG5cblxuICAgICAgICB7LyogVEFCIDY6IFFVXHUxRUEyTiBUUlx1MUVDQSBQSFx1MDBEMk5HIChzdGFmZiBvbmx5KSBcdTIwMTQgcG9saWN5IG1hdHJpeCArIG1lbWJlciBhY3Rpb25zICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ3F1YW4tdHJpJyAmJiBpc1N0YWZmICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0zIG92ZXJmbG93LXktYXV0byBtaW4taC0wIHByLTEgaC1mdWxsXCI+XG4gICAgICAgICAgICB7LyogUXVpY2sgYWN0aW9ucyB0aGVvIG1cdTAwRjQgaFx1MDBFQ25oIFx1MDExMVx1MDBFMyBjaFx1MUVEMXQgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjYXAgb2YgWydub3RlcycsICd3aGl0ZWJvYXJkJywgJ3NoZWV0J10pIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdwb2xpY3knLCB7IGNhcGFiaWxpdHk6IGNhcCwgZW5hYmxlZDogMSwgYWNjZXNzTW9kZTogJ3N0YWZmX29ubHknIH0pO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xNSB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdGV4dC1bMTFweF0gZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgXHVEODNEXHVERDEyIEtoXHUwMEYzYSBjXHUxRUQ5bmcgdFx1MDBFMWMgKGNoXHUxRUM5IHhlbSlcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNhcCBvZiBbJ25vdGVzJywgJ3doaXRlYm9hcmQnLCAnc2hlZXQnXSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiAxLCBhY2Nlc3NNb2RlOiAnZXZlcnlvbmUnIH0pO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC14bCBiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtMzAwIGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMzAgdGV4dC1bMTFweF0gZm9udC1ib2xkIGhvdmVyOmJnLWVtZXJhbGQtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgXHVEODNEXHVERDEzIE1cdTFFREYgY1x1MUVEOW5nIHRcdTAwRTFjIGNobyBtXHUxRUNEaSBuZ1x1MDFCMFx1MUVERGlcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFBvbGljeSBtYXRyaXggKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0zXCI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdGV4dC1zbGF0ZS00MDAgbWItMlwiPkNoXHUwMEVEbmggc1x1MDBFMWNoIGNcdTAwRjRuZyBjXHUxRUU1PC9wPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMS41XCI+XG4gICAgICAgICAgICAgICAge1tcbiAgICAgICAgICAgICAgICAgIFsndmlkZW9fY29udHJvbCcsICdcdTAxMTBpXHUxRUMxdSBraGlcdTFFQzNuIHBoXHUwMEUxdCAocGxheS9wYXVzZS90dWEpJ10sXG4gICAgICAgICAgICAgICAgICBbJ3ZpZGVvX2NoYW5nZScsICdcdTAxMTBcdTFFRDVpIHZpZGVvIFx1MDExMWFuZyBwaFx1MDBFMXQnXSxcbiAgICAgICAgICAgICAgICAgIFsncXVldWUnLCAnSFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdmlkZW8nXSxcbiAgICAgICAgICAgICAgICAgIFsnY2hhdCcsICdDaGF0IHBoXHUwMEYybmcnXSxcbiAgICAgICAgICAgICAgICAgIFsnbm90ZXMnLCAnR2hpIGNoXHUwMEZBIGNodW5nJ10sXG4gICAgICAgICAgICAgICAgICBbJ3doaXRlYm9hcmQnLCAnQlx1MUVBM25nIHZcdTFFQkQnXSxcbiAgICAgICAgICAgICAgICAgIFsnc2hlZXQnLCAnQlx1MUVBM25nIHRcdTAwRURuaCddLFxuICAgICAgICAgICAgICAgICAgWyd2b2ljZScsICdWb2ljZSAxLTEnXSxcbiAgICAgICAgICAgICAgICAgIFsnaW52aXRlJywgJ01cdTFFRERpIG5nXHUwMUIwXHUxRUREaSB2XHUwMEUwbyBwaFx1MDBGMm5nJ10sXG4gICAgICAgICAgICAgICAgXS5tYXAoKFtjYXAsIG5oYW5dKSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBwb2wgPSBwb2xpY2llcz8uW2NhcF0gfHwgeyBlbmFibGVkOiAxLCBhY2Nlc3NfbW9kZTogJ3N0YWZmX29ubHknIH07XG4gICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17Y2FwfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmxleC0xIHRleHQtc2xhdGUtMzAwIHRydW5jYXRlXCI+e25oYW59PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdwb2xpY3knLCB7IGNhcGFiaWxpdHk6IGNhcCwgZW5hYmxlZDogcG9sLmVuYWJsZWQgPyAwIDogMSwgYWNjZXNzTW9kZTogcG9sLmFjY2Vzc19tb2RlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e3BvbC5lbmFibGVkID8gJ1x1MDExMGFuZyBiXHUxRUFEdCBcdTIwMTQgYlx1MUVBNW0gXHUwMTExXHUxRUMzIHRcdTFFQUZ0JyA6ICdcdTAxMTBhbmcgdFx1MUVBRnQgXHUyMDE0IGJcdTFFQTVtIFx1MDExMVx1MUVDMyBiXHUxRUFEdCd9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTggaC00LjUgcHgtMC41IHJvdW5kZWQtZnVsbCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgJHtwb2wuZW5hYmxlZCA/ICdiZy1lbWVyYWxkLTUwMC8zMCBib3JkZXItZW1lcmFsZC01MDAvNDAganVzdGlmeS1lbmQnIDogJ2JnLXdoaXRlLzUgYm9yZGVyLXdoaXRlLzE1IGp1c3RpZnktc3RhcnQnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdy0zIGgtMyByb3VuZGVkLWZ1bGwgJHtwb2wuZW5hYmxlZCA/ICdiZy1lbWVyYWxkLTQwMCcgOiAnYmctc2xhdGUtNTAwJ31gfT48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3BvbC5hY2Nlc3NfbW9kZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshcG9sLmVuYWJsZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiAxLCBhY2Nlc3NNb2RlOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMS41IHB5LTEgdGV4dC1bMTBweF0gdGV4dC1zbGF0ZS0yMDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTAgZGlzYWJsZWQ6b3BhY2l0eS00MFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInN0YWZmX29ubHlcIj5RdVx1MUVBM24gdHJcdTFFQ0I8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJzZWxlY3RlZF9tZW1iZXJzXCI+TVx1MUVEOXQgc1x1MUVEMSBuZ1x1MDFCMFx1MUVERGk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJldmVyeW9uZVwiPk1cdTFFQ0RpIG5nXHUwMUIwXHUxRUREaTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIG9wYWNpdHktNjBcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZsZXgtMSB0ZXh0LXNsYXRlLTQwMFwiPktpXHUxRUMzbSBkdXlcdTFFQzd0IChraWNrL3hvXHUwMEUxIHRpbik8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIGZvbnQtYm9sZCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMCByb3VuZGVkIHB4LTEuNSBweS0wLjVcIj5MVVx1MDBENE4gUVVcdTFFQTJOIFRSXHUxRUNBPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogUXVcdTFFQTNuIGxcdTAwRkQgdGhcdTAwRTBuaCB2aVx1MDBFQW4gKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0zXCI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdGV4dC1zbGF0ZS00MDAgbWItMlwiPlRoXHUwMEUwbmggdmlcdTAwRUFuICYgcXV5XHUxRUMxbiByaVx1MDBFQW5nPC9wPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMS41XCI+XG4gICAgICAgICAgICAgICAgeyh0aGFuaFZpZW4gfHwgW10pLm1hcCh0diA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUhvc3QgPSBCb29sZWFuKHR2LmxhQ2h1UGhvbmcpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgbGFHViA9IHR2LnZhaVRybyA9PT0gJ2dpYW9fdmllbic7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUNvSG9zdCA9IHR2LnZhaVRyb1Bob25nID09PSAnY29faG9zdCc7XG4gICAgICAgICAgICAgICAgICBjb25zdCBncmFudFZvaWNlID0gKGdyYW50cyB8fCBbXSkuc29tZShnID0+IGcua2hvYSA9PT0gdHYua2hvYSAmJiBnLmNhcGFiaWxpdHkgPT09ICd2b2ljZScgJiYgZy50cmFuZ1RoYWkgPT09ICdncmFudGVkJyk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBncmFudFZpZGVvID0gKGdyYW50cyB8fCBbXSkuc29tZShnID0+IGcua2hvYSA9PT0gdHYua2hvYSAmJiBnLmNhcGFiaWxpdHkgPT09ICd2aWRlb19jb250cm9sJyAmJiBnLnRyYW5nVGhhaSA9PT0gJ2dyYW50ZWQnKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXt0di5raG9hIHx8IHR2LnRlbn0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSB0ZXh0LXhzIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtMjAwIGZvbnQtc2VtaWJvbGQgdHJ1bmNhdGUgbWF4LXctWzExMHB4XVwiPnt0di50ZW59PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIHtsYUhvc3QgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LWFtYmVyLTQwMCBmb250LWJvbGRcIj5cdTI2MDUgaG9zdDwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAge2xhR1YgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LVsjMDBGMkZFXSBmb250LWJvbGRcIj5HVjwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAge2xhQ29Ib3N0ICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC12aW9sZXQtMzAwIGZvbnQtYm9sZFwiPmNvLWhvc3Q8L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgIHshbGFIb3N0ICYmICFsYUdWICYmIHR2Lmtob2EgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWwtYXV0byBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7KHZhaVRyb1Bob25nID09PSAnaG9zdCcgfHwgYXV0aC51c2VyPy5pc1RlYWNoZXIpICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/Lignc2V0X2NvX2hvc3QnLCB7IGtob2FUVjogdHYua2hvYSwgb246ICFsYUNvSG9zdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtsYUNvSG9zdCA/ICdUaHUgcXV5XHUxRUMxbiBjby1ob3N0JyA6ICdDXHUxRUE1cCBjby1ob3N0J31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgJHtsYUNvSG9zdCA/ICdiZy12aW9sZXQtNTAwLzIwIHRleHQtdmlvbGV0LTMwMCBib3JkZXItdmlvbGV0LTUwMC80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjby1ob3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHR2Lmtob2EsIGNhcGFiaWxpdHk6ICd2b2ljZScsIG9uOiAhZ3JhbnRWb2ljZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNcdTFFQTVwL3RodSBxdXlcdTFFQzFuIHZvaWNlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyICR7Z3JhbnRWb2ljZSA/ICdiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERjk5XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndmlkZW9fY29udHJvbCcsIG9uOiAhZ3JhbnRWaWRlbyB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNcdTFFQTVwL3RodSBxdXlcdTFFQzFuIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gdmlkZW9cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgJHtncmFudFZpZGVvID8gJ2JnLWN5YW4tNTAwLzIwIHRleHQtY3lhbi0zMDAgYm9yZGVyLWN5YW4tNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7IGlmIChjb25maXJtKGBLaWNrICR7dHYudGVufSBraFx1MUVDRmkgcGhcdTAwRjJuZz9gKSkgeyBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdraWNrJywgeyBraG9hVFY6IHR2Lmtob2EgfSk7IGlmIChkICYmICFkLm9rKSBhbGVydChkLmxvaSB8fCAnS2hcdTAwRjRuZyBraWNrIFx1MDExMVx1MDFCMFx1MUVFM2MuJyk7IH0gfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIktpY2sga2hcdTFFQ0ZpIHBoXHUwMEYybmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgYmctcm9zZS01MDAvMTAgdGV4dC1yb3NlLTMwMCBib3JkZXItcm9zZS01MDAvMjUgaG92ZXI6Ymctcm9zZS01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBraWNrXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICB7KHRoYW5oVmllbiB8fCBbXSkubGVuZ3RoID09PSAwICYmIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwXCI+Q2hcdTAxQjBhIGNcdTAwRjMgdGhcdTAwRTBuaCB2aVx1MDBFQW4uPC9wPn1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFx1MDExMFx1MUVENWkvYlx1MUVDRiBtXHUxRUFEdCBraFx1MUVBOXUgXHUyMDE0IGNoXHUxRUM5IGhvc3QvR1YgKi99XG4gICAgICAgICAgICB7KHZhaVRyb1Bob25nID09PSAnaG9zdCcgfHwgYXV0aC51c2VyPy5pc1RlYWNoZXIpICYmIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtMyBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiTVx1MUVBRHQga2hcdTFFQTl1IG1cdTFFREJpIChcdTAxMTFcdTFFQzMgdHJcdTFFRDFuZyA9IGJcdTFFQ0YgbVx1MUVBRHQga2hcdTFFQTl1KVwiXG4gICAgICAgICAgICAgICAgICBpZD1cImlucHV0LXBob25nLW1hdC1raGF1LW1vaVwiXG4gICAgICAgICAgICAgICAgICBtYXhMZW5ndGg9ezEwMH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIHB4LTIuNSBweS0xLjUgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MFwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wdXQtcGhvbmctbWF0LWtoYXUtbW9pJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1rID0gZWw/LnZhbHVlIHx8ICcnO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gbWsudHJpbSgpXG4gICAgICAgICAgICAgICAgICAgICAgPyBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2RvaV9tYXRfa2hhdScsIHsgbWF0S2hhdU1vaTogbWsudHJpbSgpIH0pXG4gICAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2JvX21hdF9raGF1Jywge30pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZCAmJiAhZC5vaykgYWxlcnQoZC5sb2kgfHwgJ0toXHUwMEY0bmcgXHUwMTExXHUxRUQ1aSBcdTAxMTFcdTAxQjBcdTFFRTNjIG1cdTFFQUR0IGtoXHUxRUE5dS4nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsKSBlbC52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQtbGcgYmctYW1iZXItNTAwLzE1IHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1hbWJlci01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICAgIFx1MDExMFx1MUVENWkgLyBCXHUxRUNGXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gQ2FtcHVzV2F0Y2hUb2dldGhlcih7XG4gIHBob25nLFxuICBwaG9uZ01pbmhLaG9hOiBfcGhvbmdNaW5oS2hvYSxcbiAgYXV0aCxcbiAgZG9uZ1Bob25nSGllblRhaTogX2RvbmdQaG9uZ0hpZW5UYWksXG4gIHNvTmd1b2k6IF9zb05ndW9pLFxuICBteUNhcHMsXG4gIHZpZGVvVGltZVJlZixcbiAgaXNSb29tV2lkZSxcbiAgaGFuaERvbmdQaG9uZzogX2hhbmhEb25nUGhvbmcsXG4gIGlzU3RhZmYgPSBmYWxzZSxcbn0pIHtcbiAgY29uc3QgW3dhdGNoU3RhdGUsIHNldFdhdGNoU3RhdGVdID0gdXNlU3RhdGUoe1xuICAgIHBsYXlpbmc6IGZhbHNlLFxuICAgIHBvc2l0aW9uU2Vjb25kczogMCxcbiAgICBiYXNlUG9zaXRpb25TZWNvbmRzOiAwLFxuICAgIHBsYXliYWNrUmF0ZTogMS4wLFxuICAgIHJldmlzaW9uOiAxLFxuICAgIHVwZGF0ZWRBdDogJycsXG4gICAgc2VydmVyTm93OiAnJyxcbiAgICB1cGRhdGVkQnk6ICcnXG4gIH0pO1xuICBjb25zdCBbY2FuQ29udHJvbCwgc2V0Q2FuQ29udHJvbF0gPSB1c2VTdGF0ZShCb29sZWFuKFxuICAgIGF1dGg/LnVzZXI/LmlzVGVhY2hlciB8fCBwaG9uZz8uY2FuQ29udHJvbCB8fCBwaG9uZz8ubGFDaHVQaG9uZyB8fCBteUNhcHM/LnZpZGVvX2NvbnRyb2wgfHwgbXlDYXBzPy52aWRlb19jaGFuZ2UgfHwgaXNTdGFmZlxuICApKTtcbiAgY29uc3QgW193YXRjaENhcHMsIHNldFdhdGNoQ2Fwc10gPSB1c2VTdGF0ZSh7fSk7XG4gIGNvbnN0IGdldEluaXRpYWxWaWRlb1VybCA9ICgpID0+IHtcbiAgICBsZXQgYyA9IHt9O1xuICAgIHRyeSB7IGMgPSBwaG9uZz8uY2F1SGluaCA/IEpTT04ucGFyc2UocGhvbmcuY2F1SGluaCkgOiB7fTsgfSBjYXRjaCB7IH1cbiAgICByZXR1cm4gYy52aWRlb1VybCB8fCBwaG9uZz8udmlkZW9VcmwgfHwgJyc7XG4gIH07XG5cbiAgY29uc3QgZ2V0SW5pdGlhbFByb3ZpZGVyID0gKHUpID0+IHtcbiAgICBpZiAoIXUpIHJldHVybiAnVU5TVVBQT1JURUQnO1xuICAgIGlmIChpZFlvdXR1YmUodSkpIHJldHVybiAnWU9VVFVCRSc7XG4gICAgaWYgKGlkR29vZ2xlRHJpdmUodSkpIHJldHVybiAnR09PR0xFX0RSSVZFJztcbiAgICBpZiAobGFWaWRlb1RydWNUaWVwRmUodSkpIHJldHVybiAnTkFUSVZFX0hUTUw1JztcbiAgICByZXR1cm4gJ1VOU1VQUE9SVEVEJztcbiAgfTtcblxuICBjb25zdCBpbml0VXJsID0gZ2V0SW5pdGlhbFZpZGVvVXJsKCk7XG4gIGNvbnN0IFthY3RpdmVWaWRlb1VybCwgc2V0QWN0aXZlVmlkZW9VcmxdID0gdXNlU3RhdGUoaW5pdFVybCk7XG4gIGNvbnN0IFtwcm92aWRlciwgc2V0UHJvdmlkZXJdID0gdXNlU3RhdGUoKCkgPT4gZ2V0SW5pdGlhbFByb3ZpZGVyKGluaXRVcmwpKTtcbiAgY29uc3QgW2hhc0ludGVyYWN0ZWQsIHNldEhhc0ludGVyYWN0ZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9jYWxUaW1lLCBzZXRMb2NhbFRpbWVdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtkdXJhdGlvbiwgc2V0RHVyYXRpb25dID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtkYW5nR3VpTGVuaCwgc2V0RGFuZ0d1aUxlbmhdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9pLCBzZXRMb2ldID0gdXNlU3RhdGUoJycpO1xuXG4gIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDXHUxRUE0VSBIXHUwMENDTkggVklERU8sIFRcdTAwQ0NNIEtJXHUxRUJFTSBZT1VUVUJFICYgSFx1MDBDME5HIFx1MDExMFx1MUVFMkkgVFx1MUVBMEkgVlx1MDBEOU5HIDEgXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IFttZWRpYVRhYiwgc2V0TWVkaWFUYWJdID0gdXNlU3RhdGUoJ3NlYXJjaCcpOyAvLyAnc2VhcmNoJyB8ICdxdWV1ZSdcbiAgY29uc3QgW3ZpZGVvTW9pLCBzZXRWaWRlb01vaV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtkYW5nRG9pVmlkZW8sIHNldERhbmdEb2lWaWRlb10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2lWaWRlbywgc2V0TG9pVmlkZW9dID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbdGhvbmdCYW9WaWRlbywgc2V0VGhvbmdCYW9WaWRlb10gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gWW91VHViZSBTZWFyY2ggU3RhdGVcbiAgY29uc3QgW3l0UXVlcnksIHNldFl0UXVlcnldID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbeXRSZXN1bHRzLCBzZXRZdFJlc3VsdHNdID0gdXNlU3RhdGUoW10pO1xuICBjb25zdCBbc2VhcmNoaW5nWXQsIHNldFNlYXJjaGluZ1l0XSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3NlYXJjaExvaSwgc2V0U2VhcmNoTG9pXSA9IHVzZVN0YXRlKCcnKTtcblxuICAvLyBRdWV1ZSBTdGF0ZVxuICBjb25zdCBbcXVldWVMaXN0LCBzZXRRdWV1ZUxpc3RdID0gdXNlU3RhdGUoW10pO1xuICBjb25zdCBbcXVldWVCdXN5LCBzZXRRdWV1ZUJ1c3ldID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbZGFNb1JvbmdTdHVkaW8sIHNldERhTW9Sb25nU3R1ZGlvXSA9IHVzZVN0YXRlKHRydWUpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nIHx8IGF1dGg/LnVzZXI/LmlzVGVhY2hlciB8fCBteUNhcHM/LnZpZGVvX2NvbnRyb2wgfHwgbXlDYXBzPy52aWRlb19jaGFuZ2UgfHwgaXNTdGFmZikge1xuICAgICAgc2V0Q2FuQ29udHJvbCh0cnVlKTtcbiAgICB9XG4gIH0sIFtwaG9uZz8uY2FuQ29udHJvbCwgcGhvbmc/LmxhQ2h1UGhvbmcsIGF1dGg/LnVzZXI/LmlzVGVhY2hlciwgbXlDYXBzLCBpc1N0YWZmXSk7XG5cbiAgLy8gVFx1MUVBM2kgZGFuaCBzXHUwMEUxY2ggaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdFx1MUVFQiBzZXJ2ZXJcbiAgY29uc3QgdGFpUXVldWUgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLXF1ZXVlP3Bob25nSWQ9JHtwaG9uZy5pZH0mYWN0aW9uPWxpc3RgKTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHNldFF1ZXVlTGlzdChkLnF1ZXVlIHx8IFtdKTtcbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICB0YWlRdWV1ZSgpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaSh0YWlRdWV1ZSksIDQwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgfSwgW3Bob25nLmlkXSk7XG5cbiAgLy8gXHUwMTEwXHUxRUQ1aSB2aWRlbyBcdTAxMTFhbmcgcGhcdTAwRTF0XG4gIGNvbnN0IGRvaVZpZGVvID0gYXN5bmMgKHVybCwgdGl0bGUpID0+IHtcbiAgICBjb25zdCB1ID0gU3RyaW5nKHVybCB8fCB2aWRlb01vaSB8fCB5dFF1ZXJ5IHx8ICcnKS50cmltKCk7XG4gICAgaWYgKCF1IHx8IGRhbmdEb2lWaWRlbykgcmV0dXJuO1xuICAgIHNldERhbmdEb2lWaWRlbyh0cnVlKTtcbiAgICBzZXRMb2lWaWRlbygnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXdhdGNoJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3NldF92aWRlbycsIHZpZGVvVXJsOiB1LCBhdXRvUGxheTogdHJ1ZSB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghZC5vaykge1xuICAgICAgICBzZXRMb2lWaWRlbyhkLmxvaSB8fCAnS2hcdTAwRjRuZyBcdTAxMTFcdTFFRDVpIFx1MDExMVx1MDFCMFx1MUVFM2MgdmlkZW8uJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRBY3RpdmVWaWRlb1VybCh1KTtcbiAgICAgICAgc2V0UHJvdmlkZXIoZ2V0SW5pdGlhbFByb3ZpZGVyKHUpKTtcbiAgICAgICAgc2V0VmlkZW9Nb2koJycpO1xuICAgICAgICBpZiAoZC5zdGF0ZSkge1xuICAgICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgICAgc2V0TG9jYWxUaW1lKDApO1xuICAgICAgICB9XG4gICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gMDtcbiAgICAgICAgc2V0RHVyYXRpb24oMCk7XG4gICAgICAgIGNvbnN0IG5ld1l0SWQgPSBpZFlvdXR1YmUodSk7XG4gICAgICAgIGlmIChuZXdZdElkICYmIHl0UGxheWVyUmVmLmN1cnJlbnQgJiYgeXRSZWFkeVJlZi5jdXJyZW50ICYmIHR5cGVvZiB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkKHsgdmlkZW9JZDogbmV3WXRJZCwgc3RhcnRTZWNvbmRzOiAwIH0pO1xuICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTtcbiAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgc2V0VGhvbmdCYW9WaWRlbyhgXHUwMTEwYW5nIHBoXHUwMEUxdDogJHt0aXRsZSB8fCB1fWApO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCA0MDAwKTtcbiAgICAgICAgdGFpUXVldWUoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaVZpZGVvKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RGFuZ0RvaVZpZGVvKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gVFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmVcbiAgY29uc3QgdGltS2llbVlvdVR1YmUgPSBhc3luYyAoZSwgdHVLaG9hKSA9PiB7XG4gICAgZT8ucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBxID0gU3RyaW5nKHR1S2hvYSB8fCB5dFF1ZXJ5IHx8ICcnKS50cmltKCk7XG4gICAgaWYgKCFxIHx8IHNlYXJjaGluZ1l0KSByZXR1cm47XG4gICAgaWYgKHR1S2hvYSkgc2V0WXRRdWVyeSh0dUtob2EpO1xuXG4gICAgLy8gTlx1MUVCRnUgbmdcdTAxQjBcdTFFRERpIGRcdTAwRjluZyBkXHUwMEUxbiBsaVx1MDBFQW4ga1x1MUVCRnQgdmlkZW8gWW91VHViZVxuICAgIGNvbnN0IGlkWXQgPSBpZFlvdXR1YmUocSk7XG4gICAgaWYgKGlkWXQpIHtcbiAgICAgIHNldFl0UmVzdWx0cyhbe1xuICAgICAgICB2aWRlb0lkOiBpZFl0LFxuICAgICAgICB0aXRsZTogJ1ZpZGVvIFlvdVR1YmUgKHRcdTFFRUIgbGlcdTAwRUFuIGtcdTFFQkZ0IFx1MDExMVx1MDBFMyBkXHUwMEUxbiknLFxuICAgICAgICBjaGFubmVsVGl0bGU6ICdZb3VUdWJlJyxcbiAgICAgICAgdGh1bWJuYWlsOiBgaHR0cHM6Ly9pLnl0aW1nLmNvbS92aS8ke2lkWXR9L2hxZGVmYXVsdC5qcGdgLFxuICAgICAgICBwdWJsaXNoZWRBdDogJ1RyXHUxRUYxYyB0aVx1MUVCRnAnXG4gICAgICB9XSk7XG4gICAgICBzZXRTZWFyY2hMb2koJycpO1xuICAgICAgc2V0TWVkaWFUYWIoJ3NlYXJjaCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldFNlYXJjaGluZ1l0KHRydWUpO1xuICAgIHNldFNlYXJjaExvaSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3lvdXR1YmUtc2VhcmNoP3E9JHtlbmNvZGVVUklDb21wb25lbnQocSl9YCk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIEFycmF5LmlzQXJyYXkoZC5pdGVtcykpIHtcbiAgICAgICAgaWYgKGQuaXRlbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgc2V0U2VhcmNoTG9pKCdLaFx1MDBGNG5nIHRcdTAwRUNtIHRoXHUxRUE1eSB2aWRlbyBuXHUwMEUwbyBwaFx1MDBGOSBoXHUxRUUzcCB2XHUxRURCaSB0XHUxRUVCIGtoXHUwMEYzYSBuXHUwMEUweS4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRZdFJlc3VsdHMoZC5pdGVtcyk7XG4gICAgICAgICAgc2V0TWVkaWFUYWIoJ3NlYXJjaCcpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRTZWFyY2hMb2koZC5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgdFx1MDBFQ20ga2lcdTFFQkZtIHZpZGVvIGxcdTAwRkFjIG5cdTAwRTB5LicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0U2VhcmNoTG9pKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBraGkgdFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmUuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFNlYXJjaGluZ1l0KGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdmlkZW9SZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IHl0UGxheWVyUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCB5dENvbnRhaW5lcklkID0gYHl0LXBsYXllci0ke3Bob25nLmlkfWA7XG4gIGNvbnN0IGlzU2Vla2luZ1JlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGhhc0ludGVyYWN0ZWRSZWYgPSB1c2VSZWYoZmFsc2UpO1xuICBjb25zdCBkdXJhdGlvblJlZiA9IHVzZVJlZigwKTtcbiAgY29uc3QgaGFzVHJpZ2dlcmVkU2tpcFJlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGlzU2tpcHBpbmdSZWYgPSB1c2VSZWYoZmFsc2UpO1xuXG4gIC8vIFRoYW8gdFx1MDBFMWMgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgKGVucXVldWUsIGFkZF9uZXh0LCBwbGF5X25vdywgc2tpcCwgcmVtb3ZlKVxuICBjb25zdCBoYW5oRG9uZ1F1ZXVlID0gYXN5bmMgKGFjdGlvbiwgZXh0cmEgPSB7fSkgPT4ge1xuICAgIGlmIChhY3Rpb24gPT09ICdza2lwJykge1xuICAgICAgaWYgKGlzU2tpcHBpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChxdWV1ZUJ1c3kpIHJldHVybjtcbiAgICAgIHNldFF1ZXVlQnVzeSh0cnVlKTtcbiAgICB9XG4gICAgc2V0TG9pVmlkZW8oJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1xdWV1ZScsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb24sIC4uLmV4dHJhIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSB7XG4gICAgICAgIHNldExvaVZpZGVvKGQubG9pIHx8ICdUaGFvIHRcdTAwRTFjIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHRoXHUxRUE1dCBiXHUxRUExaS4nKTtcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ3NraXAnKSB7XG4gICAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChhY3Rpb24gPT09ICdlbnF1ZXVlJykge1xuICAgICAgICAgIHNldFRob25nQmFvVmlkZW8oYFx1MDExMFx1MDBFMyB0aFx1MDBFQW0gdlx1MDBFMG8gY3VcdTFFRDFpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpOiAke2V4dHJhLnRpdGxlIHx8ICdWaWRlbyd9YCk7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUaG9uZ0Jhb1ZpZGVvKCcnKSwgMzUwMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAnYWRkX25leHQnKSB7XG4gICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbyhgXHUwMTEwXHUwMEUzIHRoXHUwMEVBbSBwaFx1MDBFMXQga1x1MUVCRiB0aVx1MUVCRnA6ICR7ZXh0cmEudGl0bGUgfHwgJ1ZpZGVvJ31gKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCAzNTAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdwbGF5X25vdycgfHwgYWN0aW9uID09PSAnc2tpcCcpIHtcbiAgICAgICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gMDtcbiAgICAgICAgICBzZXREdXJhdGlvbigwKTtcbiAgICAgICAgICBpZiAoZC52aWRlb1VybCkge1xuICAgICAgICAgICAgc2V0QWN0aXZlVmlkZW9VcmwoZC52aWRlb1VybCk7XG4gICAgICAgICAgICBzZXRQcm92aWRlcihnZXRJbml0aWFsUHJvdmlkZXIoZC52aWRlb1VybCkpO1xuICAgICAgICAgICAgaWYgKGQuc3RhdGUpIHtcbiAgICAgICAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgICAgICAgc2V0TG9jYWxUaW1lKDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbmV3WXRJZCA9IGlkWW91dHViZShkLnZpZGVvVXJsKTtcbiAgICAgICAgICAgIGlmIChuZXdZdElkICYmIHl0UGxheWVyUmVmLmN1cnJlbnQgJiYgeXRSZWFkeVJlZi5jdXJyZW50ICYmIHR5cGVvZiB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQoeyB2aWRlb0lkOiBuZXdZdElkLCBzdGFydFNlY29uZHM6IDAgfSk7XG4gICAgICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbygnXHUwMTEwYW5nIGNodXlcdTFFQzNuIHZpZGVvIHRpXHUxRUJGcCB0aGVvLi4uJyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCAzMDAwKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGQuZW1wdHkpIHtcbiAgICAgICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNldFRob25nQmFvVmlkZW8oJ0hcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIFx1MDExMVx1MDBFMyBoXHUxRUJGdCB2aWRlby4nKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VGhvbmdCYW9WaWRlbygnJyksIDMwMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0YWlRdWV1ZSgpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0TG9pVmlkZW8oJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgICAgaWYgKGFjdGlvbiA9PT0gJ3NraXAnKSB7XG4gICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKGFjdGlvbiAhPT0gJ3NraXAnKSB7XG4gICAgICAgIHNldFF1ZXVlQnVzeShmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbGV0IGMgPSB7fTtcbiAgICB0cnkgeyBjID0gcGhvbmc/LmNhdUhpbmggPyBKU09OLnBhcnNlKHBob25nLmNhdUhpbmgpIDoge307IH0gY2F0Y2ggeyB9XG4gICAgY29uc3QgbmV4dFVybCA9IGMudmlkZW9VcmwgfHwgcGhvbmc/LnZpZGVvVXJsIHx8ICcnO1xuICAgIGlmIChuZXh0VXJsICYmIG5leHRVcmwgIT09IGFjdGl2ZVZpZGVvVXJsKSB7XG4gICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IDA7XG4gICAgICBzZXREdXJhdGlvbigwKTtcbiAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKG5leHRVcmwpO1xuICAgICAgc2V0UHJvdmlkZXIoZ2V0SW5pdGlhbFByb3ZpZGVyKG5leHRVcmwpKTtcbiAgICB9XG4gIH0sIFtwaG9uZz8uY2F1SGluaCwgcGhvbmc/LnZpZGVvVXJsXSk7XG5cbiAgY29uc3QgdmlkZW9VcmwgPSBhY3RpdmVWaWRlb1VybDtcbiAgY29uc3QgeXRJZCA9IHZpZGVvVXJsID8gaWRZb3V0dWJlKHZpZGVvVXJsKSA6IG51bGw7XG4gIGNvbnN0IGRydklkID0gdmlkZW9VcmwgPyBpZEdvb2dsZURyaXZlKHZpZGVvVXJsKSA6IG51bGw7XG4gIGNvbnN0IHRydWNUaWVwVXJsID0gdmlkZW9VcmwgJiYgIXl0SWQgJiYgIWRydklkICYmIGxhVmlkZW9UcnVjVGllcEZlKHZpZGVvVXJsKSA/IHVybE1lZGlhRmUodmlkZW9VcmwpIDogJyc7XG5cbiAgY29uc3QgW195dFBsYXllclJlYWR5LCBzZXRZdFBsYXllclJlYWR5XSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgeXRSZWFkeVJlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGN1cnJlbnRZdElkUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBoYXNTZWVrZWRJbml0UmVmID0gdXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgbGFzdEhvc3RTeW5jVGltZVJlZiA9IHVzZVJlZigwKTtcblxuICAvLyBcdTI1MDBcdTI1MDAgVFx1MUVBNk5HIDE6IExcdTFFQUZuZyBuZ2hlIHRyXHUxRUYxYyB0aVx1MUVCRnAgdGluIG5oXHUxRUFGbiBwb3N0TWVzc2FnZSB0XHUxRUVCIFlvdVR1YmUgSUZyYW1lIFx1MjUwMFx1MjUwMFxuICAvLyBZb3VUdWJlIElGcmFtZSBsdVx1MDBGNG4gcGhcdTAwRTF0IGNcdTAwRTFjIHNcdTFFRjEga2lcdTFFQzduIG9uU3RhdGVDaGFuZ2UgJiBpbmZvRGVsaXZlcnkgcmEgcGFyZW50IHdpbmRvd1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IG9uTXNnID0gKGUpID0+IHtcbiAgICAgIGxldCBkYXRhID0gZS5kYXRhO1xuICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICBpZiAoZGF0YS5pbmNsdWRlcygnZXZlbnQ9JykpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoZGF0YSk7XG4gICAgICAgICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgZXZlbnQ6IHBhcmFtcy5nZXQoJ2V2ZW50JyksXG4gICAgICAgICAgICAgICAgaW5mbzogcGFyYW1zLmdldCgnaW5mbycpID8gSlNPTi5wYXJzZShwYXJhbXMuZ2V0KCdpbmZvJykpIDogcGFyYW1zLmdldCgnaW5mbycpXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGNhdGNoIHsgcmV0dXJuOyB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghZGF0YSB8fCB0eXBlb2YgZGF0YSAhPT0gJ29iamVjdCcpIHJldHVybjtcblxuICAgICAgLy8gQ1x1MUVBRHAgbmhcdTFFQUR0IFx1MDExMVx1MUVEOSBkXHUwMEUwaSB2aWRlbyB0aFx1MUVGMWMgdFx1MUVCRiAoZHVyYXRpb24pXG4gICAgICBjb25zdCBkID0gTnVtYmVyKGRhdGEuaW5mbz8uZHVyYXRpb24gfHwgZGF0YS5kdXJhdGlvbiB8fCAwKTtcbiAgICAgIGlmIChkID4gMCkge1xuICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gZDtcbiAgICAgICAgc2V0RHVyYXRpb24ocHJldiA9PiAocHJldiA+IDAgPyBwcmV2IDogZCkpO1xuICAgICAgfVxuXG4gICAgICAvLyBDXHUxRUFEcCBuaFx1MUVBRHQgdGhcdTFFRERpIGdpYW4gdGhcdTFFRjFjIHRcdTFFQkZcbiAgICAgIGNvbnN0IGN1ciA9IE51bWJlcihkYXRhLmluZm8/LmN1cnJlbnRUaW1lKTtcbiAgICAgIGlmICghaXNOYU4oY3VyKSAmJiBjdXIgPj0gMCAmJiAhaXNTZWVraW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IoY3VyKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE5oXHUxRUFEbiBkaVx1MUVDN24gdHJcdTFFQTFuZyB0aFx1MDBFMWkga1x1MUVCRnQgdGhcdTAwRkFjIHZpZGVvOiAwID0gRU5ERURcbiAgICAgIGNvbnN0IGlzRW5kZWQgPSAoZGF0YS5ldmVudCA9PT0gJ29uU3RhdGVDaGFuZ2UnICYmIChkYXRhLmluZm8gPT09IDAgfHwgZGF0YS5pbmZvPy5wbGF5ZXJTdGF0ZSA9PT0gMCkpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgKGRhdGEuZXZlbnQgPT09ICdpbmZvRGVsaXZlcnknICYmIGRhdGEuaW5mbz8ucGxheWVyU3RhdGUgPT09IDApIHx8XG4gICAgICAgICAgICAgICAgICAgICAgKGRhdGEuaW5mbyAmJiBkYXRhLmluZm8ucGxheWVyU3RhdGUgPT09IDApO1xuXG4gICAgICBpZiAoaXNFbmRlZCkge1xuICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiAhaXNTa2lwcGluZ1JlZi5jdXJyZW50ICYmICFoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnWW91VHViZSBpZnJhbWUgcG9zdE1lc3NhZ2U6IFZpZGVvIGtcdTFFQkZ0IHRoXHUwMEZBYyAtPiB0XHUxRUYxIFx1MDExMVx1MUVEOW5nIGNodXlcdTFFQzNuIHRpXHUxRUJGcCB2aWRlbyB0aVx1MUVCRnAgdGhlbycpO1xuICAgICAgICAgIGhhbmhEb25nUXVldWUoJ3NraXAnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uTXNnKTtcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBvbk1zZyk7XG4gIH0sIFtjYW5Db250cm9sLCBwaG9uZy5pZF0pO1xuXG4gIC8vIEdcdTFFRURpIGxpc3RlbmluZyBoYW5kc2hha2UgXHUwMTExXHUxRUNCbmgga1x1MUVGMyB2XHUwMEUwbyBpZnJhbWUgWW91VHViZSBcdTAxMTFcdTFFQzMga1x1MDBFRGNoIGhvXHUxRUExdCBldmVudCBzdHJlYW1cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXl0SWQpIHJldHVybjtcbiAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICBpZiAoIWlmcikgcmV0dXJuO1xuICAgIGNvbnN0IHQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBpZnIuY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2xpc3RlbmluZycgfSksICcqJyk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfSwgMTUwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodCk7XG4gIH0sIFt5dElkLCBwaG9uZy5pZF0pO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBUXHUxRUE2TkcgMjogS2hcdTFFREZpIHRcdTFFQTFvIHZcdTAwRTAga1x1MUVCRnQgblx1MUVEMWkgWW91VHViZSBJRnJhbWUgUGxheWVyIEFQSSB0clx1MUVGMWMgdGlcdTFFQkZwIHZcdTAwRTBvIGlmcmFtZSBcdTI1MDBcdTI1MDBcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXl0SWQpIHJldHVybjtcbiAgICBsZXQgZGVzdHJveWVkID0gZmFsc2U7XG4gICAgbGV0IHJldHJ5VGltZXIgPSBudWxsO1xuICAgIGxldCBhdHRlbXB0cyA9IDA7XG5cbiAgICAvLyBOXHUxRUJGdSBwbGF5ZXIgXHUwMTExXHUwMEUzIHRcdTFFRDNuIHRcdTFFQTFpIHZcdTAwRTAgc1x1MUVCNW4gc1x1MDBFMG5nOiBjaHV5XHUxRUMzbiBiXHUwMEUwaSB0XHUxRUU5YyB0aFx1MDBFQyBxdWEgbG9hZFZpZGVvQnlJZCAoa2hcdTAwRjRuZyByZWxvYWQgRE9NL2lmcmFtZSlcbiAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFJlYWR5UmVmLmN1cnJlbnQgJiYgdHlwZW9mIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKGN1cnJlbnRZdElkUmVmLmN1cnJlbnQgIT09IHl0SWQpIHtcbiAgICAgICAgICBjdXJyZW50WXRJZFJlZi5jdXJyZW50ID0geXRJZDtcbiAgICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gMDtcbiAgICAgICAgICBzZXREdXJhdGlvbigwKTtcbiAgICAgICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICBjb25zdCBzdGFydFNlYyA9IE51bWJlcih3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQoe1xuICAgICAgICAgICAgdmlkZW9JZDogeXRJZCxcbiAgICAgICAgICAgIHN0YXJ0U2Vjb25kczogc3RhcnRTZWNcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignTFx1MUVEN2kgbG9hZFZpZGVvQnlJZDonLCBlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjdXJyZW50WXRJZFJlZi5jdXJyZW50ID0geXRJZDtcbiAgICBoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgPSBmYWxzZTtcblxuICAgIGNvbnN0IGtob2lUYW9QbGF5ZXIgPSAoKSA9PiB7XG4gICAgICBpZiAoZGVzdHJveWVkKSByZXR1cm47XG4gICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgaWYgKCFlbCkge1xuICAgICAgICBpZiAoYXR0ZW1wdHMrKyA8IDMwKSB7XG4gICAgICAgICAgcmV0cnlUaW1lciA9IHNldFRpbWVvdXQoa2hvaVRhb1BsYXllciwgMTAwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICghd2luZG93LllUIHx8ICF3aW5kb3cuWVQuUGxheWVyKSB7XG4gICAgICAgIGlmIChhdHRlbXB0cysrIDwgMzApIHtcbiAgICAgICAgICByZXRyeVRpbWVyID0gc2V0VGltZW91dChraG9pVGFvUGxheWVyLCAxNTApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudCA9IG5ldyB3aW5kb3cuWVQuUGxheWVyKGVsLCB7XG4gICAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICBvblJlYWR5OiAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGRlc3Ryb3llZCkgcmV0dXJuO1xuICAgICAgICAgICAgICB5dFJlYWR5UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICAgICAgICBzZXRZdFBsYXllclJlYWR5KHRydWUpO1xuXG4gICAgICAgICAgICAgIGlmIChldmVudC50YXJnZXQuZ2V0RHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gZXZlbnQudGFyZ2V0LmdldER1cmF0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKGQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gZDtcbiAgICAgICAgICAgICAgICAgIHNldER1cmF0aW9uKGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIFRcdTAwRURuaCB2XHUxRUNCIHRyXHUwMEVEIHRoXHUxRUREaSBnaWFuIGhpXHUxRUM3biB0XHUxRUExaSBjXHUxRUU3YSBwaFx1MDBGMm5nIFx1MDExMVx1MUVDMyBzZWVrIG5nYXkgbFx1MDBGQWMga2hcdTFFREZpIHRcdTFFQTFvXG4gICAgICAgICAgICAgIGNvbnN0IG5vd01zID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgY29uc3QgdXBkYXRlVGltZU1zID0gd2F0Y2hTdGF0ZS51cGRhdGVkQXQgPyBuZXcgRGF0ZShTdHJpbmcod2F0Y2hTdGF0ZS51cGRhdGVkQXQpLnJlcGxhY2UoJyAnLCAnVCcpICsgKFN0cmluZyh3YXRjaFN0YXRlLnVwZGF0ZWRBdCkuaW5jbHVkZXMoJ1QnKSA/ICcnIDogJ1onKSkuZ2V0VGltZSgpIDogbm93TXM7XG4gICAgICAgICAgICAgIGNvbnN0IGVsYXBzZWRTZWMgPSBNYXRoLm1heCgwLCAobm93TXMgLSB1cGRhdGVUaW1lTXMpIC8gMTAwMCk7XG4gICAgICAgICAgICAgIGxldCB0UG9zID0gTnVtYmVyKHdhdGNoU3RhdGUucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgICAgICAgICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgdFBvcyA9IE51bWJlcih3YXRjaFN0YXRlLmJhc2VQb3NpdGlvblNlY29uZHMgIT0gbnVsbCA/IHdhdGNoU3RhdGUuYmFzZVBvc2l0aW9uU2Vjb25kcyA6IHdhdGNoU3RhdGUucG9zaXRpb25TZWNvbmRzKSArIChlbGFwc2VkU2VjICogKHdhdGNoU3RhdGUucGxheWJhY2tSYXRlIHx8IDEuMCkpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKHRQb3MgPiAwICYmIGV2ZW50LnRhcmdldC5zZWVrVG8pIHtcbiAgICAgICAgICAgICAgICBoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRyeSB7IGV2ZW50LnRhcmdldC5zZWVrVG8odFBvcywgdHJ1ZSk7IH0gY2F0Y2gge31cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcgJiYgKGNhbkNvbnRyb2wgfHwgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50IHx8IGhhc0ludGVyYWN0ZWQpICYmIGV2ZW50LnRhcmdldC5wbGF5VmlkZW8pIHtcbiAgICAgICAgICAgICAgICB0cnkgeyBldmVudC50YXJnZXQucGxheVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uU3RhdGVDaGFuZ2U6IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ICYmIGV2ZW50LnRhcmdldC5nZXREdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBldmVudC50YXJnZXQuZ2V0RHVyYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAoZCA+IDAgJiYgZHVyYXRpb25SZWYuY3VycmVudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IGQ7XG4gICAgICAgICAgICAgICAgICBzZXREdXJhdGlvbihkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBWaWRlbyBrXHUxRUJGdCB0aFx1MDBGQWM6IGtcdTAwRURjaCBob1x1MUVBMXQgY2h1eVx1MUVDM24gYlx1MDBFMGkgbmdheSBsXHUxRUFEcCB0XHUxRUU5Y1xuICAgICAgICAgICAgICBpZiAoZXZlbnQuZGF0YSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmICFpc1NraXBwaW5nUmVmLmN1cnJlbnQgJiYgIWhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1lUIFBsYXllciBvblN0YXRlQ2hhbmdlID09PSAwIChFTkRFRCkgLT4gdFx1MUVGMSBcdTAxMTFcdTFFRDluZyBjaHV5XHUxRUMzbiB0aVx1MUVCRnAgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2knKTtcbiAgICAgICAgICAgICAgICAgIGhhbmhEb25nUXVldWUoJ3NraXAnKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiAhZGFuZ0d1aUxlbmggJiYgIWlzU2Vla2luZ1JlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGEgPT09IDEgJiYgIXdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaCgncGxheScsIGV2ZW50LnRhcmdldC5nZXRDdXJyZW50VGltZSgpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmRhdGEgPT09IDIgJiYgd2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oKCdwYXVzZScsIGV2ZW50LnRhcmdldC5nZXRDdXJyZW50VGltZSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkgWW91VHViZSBQbGF5ZXIgQVBJOicsIGVycik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIG5hcFlvdVR1YmVJZnJhbWVBcGkoKCkgPT4ge1xuICAgICAgc2V0VGltZW91dChraG9pVGFvUGxheWVyLCAxMDApO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGRlc3Ryb3llZCA9IHRydWU7XG4gICAgICBpZiAocmV0cnlUaW1lcikgY2xlYXJUaW1lb3V0KHJldHJ5VGltZXIpO1xuICAgIH07XG4gIH0sIFt5dElkLCBwaG9uZy5pZCwgY2FuQ29udHJvbF0pO1xuXG4gIC8vIFx1MDBDMXAgZFx1MUVFNW5nIHRyXHUxRUExbmcgdGhcdTAwRTFpIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgdFx1MUVFQiBzZXJ2ZXIgKGNoXHUxRUQxbmcgZ2lcdTFFQUR0IGNoXHUxRUFEcCBjaFx1MUVERG4gY2hvIGNcdTFFQTMgSG9zdCBsXHUxRUFCbiBOZ1x1MDFCMFx1MUVERGkgeGVtKVxuICBjb25zdCBhcER1bmdEb25nQm8gPSAoc3QsIGN0cmwsIHByb3YpID0+IHtcbiAgICBpZiAoIXN0KSByZXR1cm47XG4gICAgY29uc3Qgbm93TXMgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHVwZGF0ZVRpbWVNcyA9IHN0LnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyhzdC51cGRhdGVkQXQpLnJlcGxhY2UoJyAnLCAnVCcpICsgKFN0cmluZyhzdC51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKSA6IG5vd01zO1xuICAgIGNvbnN0IGVsYXBzZWRTZWMgPSBNYXRoLm1heCgwLCAobm93TXMgLSB1cGRhdGVUaW1lTXMpIC8gMTAwMCk7XG5cbiAgICBsZXQgdGFyZ2V0UG9zID0gTnVtYmVyKHN0LnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICBpZiAoc3QucGxheWluZykge1xuICAgICAgdGFyZ2V0UG9zID0gTnVtYmVyKHN0LmJhc2VQb3NpdGlvblNlY29uZHMgIT0gbnVsbCA/IHN0LmJhc2VQb3NpdGlvblNlY29uZHMgOiBzdC5wb3NpdGlvblNlY29uZHMpICsgKGVsYXBzZWRTZWMgKiAoc3QucGxheWJhY2tSYXRlIHx8IDEuMCkpO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBOR1VZXHUwMENBTiBUXHUxRUFFQyBWXHUwMEMwTkc6IENIXHUxRUU2IFBIXHUwMEQyTkcgTFx1MDBDMCBOR1VcdTFFRDJOIFBIXHUwMEMxVCAoU09VUkNFIE9GIFRSVVRIKSBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICAvLyBWaWRlbyBjXHUxRUU3YSBDaFx1MUVFNyBwaFx1MDBGMm5nIFx1MDExMWFuZyBwaFx1MDBFMXQgdFx1MUVGMSBuaGlcdTAwRUFuIG1cdTAxQjBcdTFFRTN0IG1cdTAwRTAgNjBmcHMgdHJcdTAwRUFuIFlvdVR1YmUuXG4gICAgLy8gVHV5XHUxRUM3dCBcdTAxMTFcdTFFRDFpIEtIXHUwMEQ0TkcgZ1x1MUVDRGkgc2Vla1RvIGhheSBcdTAwRTlwIHBsYXlWaWRlbyBsXHUwMEUwbSBnaVx1MUVBRHQgbFx1MDBGOWkva2hcdTFFRjFuZyBoXHUwMEVDbmggdmlkZW8gY1x1MUVFN2EgQ2hcdTFFRTcgcGhcdTAwRjJuZyFcbiAgICBpZiAoY3RybCkge1xuICAgICAgaWYgKGlzU2Vla2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICBpZiAocHJvdiA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LmdldEN1cnJlbnRUaW1lKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY3VyID0geXRQbGF5ZXJSZWYuY3VycmVudC5nZXRDdXJyZW50VGltZSgpO1xuICAgICAgICAgIGlmIChjdXIgPiAwICYmICFpc05hTihjdXIpKSBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjdXIpKTtcbiAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBcdTAxMTBcdTFFRDBJIFZcdTFFREFJIEhcdTFFQ0NDIFNJTkggLyBOR1x1MDFBRlx1MUVEQ0kgWEVNIFRST05HIFBIXHUwMEQyTkcgXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgc2V0TG9jYWxUaW1lKE1hdGgubWF4KDAsIE1hdGguZmxvb3IodGFyZ2V0UG9zKSkpO1xuXG4gICAgaWYgKHByb3YgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHYgPSB2aWRlb1JlZi5jdXJyZW50O1xuICAgICAgaWYgKCFoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgJiYgdGFyZ2V0UG9zID4gMCkge1xuICAgICAgICBoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICB2LmN1cnJlbnRUaW1lID0gdGFyZ2V0UG9zO1xuICAgICAgfVxuICAgICAgaWYgKHN0LnBsYXlpbmcpIHtcbiAgICAgICAgY29uc3QgZHJpZnQgPSBNYXRoLmFicyh2LmN1cnJlbnRUaW1lIC0gdGFyZ2V0UG9zKTtcbiAgICAgICAgaWYgKGRyaWZ0ID4gMy4wKSB7XG4gICAgICAgICAgdi5jdXJyZW50VGltZSA9IHRhcmdldFBvcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodi5wYXVzZWQgJiYgKGhhc0ludGVyYWN0ZWQgfHwgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSkge1xuICAgICAgICAgIHYucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCF2LnBhdXNlZCkgdi5wYXVzZSgpO1xuICAgICAgICBjb25zdCBkcmlmdCA9IE1hdGguYWJzKHYuY3VycmVudFRpbWUgLSBzdC5wb3NpdGlvblNlY29uZHMpO1xuICAgICAgICBpZiAoZHJpZnQgPiAyLjApIHtcbiAgICAgICAgICB2LmN1cnJlbnRUaW1lID0gc3QucG9zaXRpb25TZWNvbmRzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcm92ID09PSAnWU9VVFVCRScpIHtcbiAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgY29uc3QgcCA9IHl0UGxheWVyUmVmLmN1cnJlbnQ7XG4gICAgICBsZXQgY3VyID0gbnVsbDtcbiAgICAgIGxldCBwcyA9IG51bGw7XG4gICAgICBpZiAocCAmJiB0eXBlb2YgcC5nZXRDdXJyZW50VGltZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0cnkgeyBjdXIgPSBwLmdldEN1cnJlbnRUaW1lKCk7IH0gY2F0Y2gge31cbiAgICAgIH1cbiAgICAgIGlmIChwICYmIHR5cGVvZiBwLmdldFBsYXllclN0YXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRyeSB7IHBzID0gcC5nZXRQbGF5ZXJTdGF0ZSgpOyB9IGNhdGNoIHt9XG4gICAgICB9XG5cbiAgICAgIC8vIEluaXRpYWwgc2VlayBuXHUxRUJGdSBuZ1x1MDFCMFx1MUVERGkgeGVtIGNoXHUwMUIwYSB0XHUxRUVCbmcgdHVhIFx1MDExMVx1MUVCRm4gbVx1MUVEMWMgY1x1MUVFN2EgY2hcdTFFRTcgcGhcdTAwRjJuZ1xuICAgICAgaWYgKCFoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgJiYgdGFyZ2V0UG9zID4gMCkge1xuICAgICAgICBoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICBpZiAocD8uc2Vla1RvKSB7IHRyeSB7IHAuc2Vla1RvKHRhcmdldFBvcywgdHJ1ZSk7IH0gY2F0Y2gge30gfVxuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFt0YXJnZXRQb3MsIHRydWVdIH0pLCAnKicpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY3VyICE9PSBudWxsICYmICFpc05hTihjdXIpKSB7XG4gICAgICAgIGNvbnN0IGRyaWZ0ID0gTWF0aC5hYnMoY3VyIC0gdGFyZ2V0UG9zKTtcbiAgICAgICAgaWYgKHN0LnBsYXlpbmcpIHtcbiAgICAgICAgICBpZiAoZHJpZnQgPiA0LjApIHtcbiAgICAgICAgICAgIGlmIChwPy5zZWVrVG8pIHsgdHJ5IHsgcC5zZWVrVG8odGFyZ2V0UG9zLCB0cnVlKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFt0YXJnZXRQb3MsIHRydWVdIH0pLCAnKicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoKHBzID09PSAyIHx8IHBzID09PSA1KSAmJiAoaGFzSW50ZXJhY3RlZCB8fCBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpKSB7XG4gICAgICAgICAgICBpZiAocD8ucGxheVZpZGVvKSB7IHRyeSB7IHAucGxheVZpZGVvKCk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZSgne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBsYXlWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHBzID09PSAxKSB7XG4gICAgICAgICAgICBpZiAocD8ucGF1c2VWaWRlbykgeyB0cnkgeyBwLnBhdXNlVmlkZW8oKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKCd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwicGF1c2VWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGRyaWZ0ID4gMi4wKSB7XG4gICAgICAgICAgICBpZiAocD8uc2Vla1RvKSB7IHRyeSB7IHAuc2Vla1RvKHN0LnBvc2l0aW9uU2Vjb25kcywgdHJ1ZSk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbc3QucG9zaXRpb25TZWNvbmRzLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFBsYXllciB3cmFwcGVyIGNoXHUwMUIwYSBjXHUwMEYzIGN1cnJlbnRUaW1lLCBnXHUxRUVEaSB0clx1MUVGMWMgdGlcdTFFQkZwIHBvc3RNZXNzYWdlIHZcdTAwRTBvIGlmcmFtZSBuXHUxRUJGdSBuZ1x1MDFCMFx1MUVERGkgeGVtIFx1MDExMVx1MDBFMyB0XHUwMUIwXHUwMUExbmcgdFx1MDBFMWNcbiAgICAgICAgaWYgKHRhcmdldFBvcyA+IDAgJiYgKGhhc0ludGVyYWN0ZWQgfHwgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSkge1xuICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3RhcmdldFBvcywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICAgICAgaWYgKHN0LnBsYXlpbmcpIHtcbiAgICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoJ3tcImV2ZW50XCI6XCJjb21tYW5kXCIsXCJmdW5jXCI6XCJwbGF5VmlkZW9cIixcImFyZ3NcIjpcIlwifScsICcqJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFBvbGwgdHJcdTFFQTFuZyB0aFx1MDBFMWkgbVx1MDBFMXkgY2hcdTFFRTcgbVx1MUVEN2kgMi41c1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoV2F0Y2ggPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy13YXRjaD9waG9uZ0lkPSR7cGhvbmcuaWR9YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoIWFjdGl2ZSkgcmV0dXJuO1xuICAgICAgICBpZiAoZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgICBzZXRDYW5Db250cm9sKEJvb2xlYW4oZC5jYW5Db250cm9sKSk7XG4gICAgICAgICAgaWYgKGQuY2Fwcykgc2V0V2F0Y2hDYXBzKGQuY2Fwcyk7XG4gICAgICAgICAgc2V0UHJvdmlkZXIoZC5wcm92aWRlciB8fCAnVU5TVVBQT1JURUQnKTtcbiAgICAgICAgICBpZiAoZC5waG9uZz8udmlkZW9VcmwgJiYgZC5waG9uZy52aWRlb1VybCAhPT0gYWN0aXZlVmlkZW9VcmwpIHtcbiAgICAgICAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKGQucGhvbmcudmlkZW9VcmwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhcER1bmdEb25nQm8oZC5zdGF0ZSwgQm9vbGVhbihkLmNhbkNvbnRyb2wpLCBkLnByb3ZpZGVyIHx8ICdVTlNVUFBPUlRFRCcpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHsgfVxuICAgIH07XG5cbiAgICBmZXRjaFdhdGNoKCk7XG4gICAgY29uc3QgdGltZXIgPSBzZXRJbnRlcnZhbChraGlIaWVuVGhpKGZldGNoV2F0Y2gpLCAyNTAwKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICB9O1xuICB9LCBbcGhvbmcuaWQsIGhhc0ludGVyYWN0ZWRdKTtcblxuICAvLyBcdTI1MDBcdTI1MDAgVFx1MUVBNk5HIDMgJiA0OiBQb3NpdGlvbmFsIFdhdGNoZG9nICYgQ1x1MUVBRHAgbmhcdTFFQUR0IGxvY2FsVGltZSBtXHUwMUIwXHUxRUUzdCBtXHUwMEUwIFx1MjUwMFx1MjUwMFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghd2F0Y2hTdGF0ZS5wbGF5aW5nKSByZXR1cm47XG4gICAgY29uc3QgdGljayA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmIChpc1NlZWtpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuXG4gICAgICBsZXQgY3VyVGltZSA9IG51bGw7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgcCA9IHl0UGxheWVyUmVmLmN1cnJlbnQ7XG4gICAgICAgICAgaWYgKHAuZ2V0RHVyYXRpb24pIHtcbiAgICAgICAgICAgIGNvbnN0IGQgPSBwLmdldER1cmF0aW9uKCk7XG4gICAgICAgICAgICBpZiAoZCA+IDApIHtcbiAgICAgICAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IGQ7XG4gICAgICAgICAgICAgIGlmIChkdXJhdGlvbiA9PT0gMCkgc2V0RHVyYXRpb24oZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwLmdldEN1cnJlbnRUaW1lKSB7XG4gICAgICAgICAgICBjb25zdCBjdXIgPSBwLmdldEN1cnJlbnRUaW1lKCk7XG4gICAgICAgICAgICBpZiAoY3VyICE9PSB1bmRlZmluZWQgJiYgY3VyICE9PSBudWxsICYmICFpc05hTihjdXIpKSB7XG4gICAgICAgICAgICAgIGN1clRpbWUgPSBjdXI7XG4gICAgICAgICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKGN1cikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocC5nZXRQbGF5ZXJTdGF0ZSAmJiBwLmdldFBsYXllclN0YXRlKCkgPT09IDApIHtcbiAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmICFpc1NraXBwaW5nUmVmLmN1cnJlbnQgJiYgIWhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUGxheWVyU3RhdGUgPT09IDAgLT4gdFx1MUVGMSBcdTAxMTFcdTFFRDluZyBjaHV5XHUxRUMzbiB0aVx1MUVCRnAgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2knKTtcbiAgICAgICAgICAgICAgaGFuaERvbmdRdWV1ZSgnc2tpcCcpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIHt9XG4gICAgICB9XG5cbiAgICAgIC8vIEdpXHUwMEUxbSBzXHUwMEUxdCB2XHUxRUNCIHRyXHUwMEVEOiBuXHUxRUJGdSB2aWRlbyBcdTAxMTFcdTAwRTMgcGhcdTAwRTF0IFx1MDExMVx1MUVCRm4gZ2lcdTAwRTJ5IGN1XHUxRUQxaSBjXHUwMEY5bmcgaG9cdTFFQjdjIHF1XHUwMEUxIGR1cmF0aW9uXG4gICAgICBjb25zdCBtYXhEdXIgPSBkdXJhdGlvblJlZi5jdXJyZW50IHx8IGR1cmF0aW9uO1xuICAgICAgY29uc3QgY3VycmVudFBvcyA9IGN1clRpbWUgIT09IG51bGwgPyBjdXJUaW1lIDogbG9jYWxUaW1lO1xuICAgICAgaWYgKG1heER1ciA+IDUgJiYgKGN1cnJlbnRQb3MgPj0gbWF4RHVyIC0gMS4yIHx8IGxvY2FsVGltZSA+PSBtYXhEdXIpKSB7XG4gICAgICAgIGlmIChjYW5Db250cm9sICYmICFpc1NraXBwaW5nUmVmLmN1cnJlbnQgJiYgIWhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBQb3NpdGlvbmFsIFdhdGNoZG9nOiBjdXJyZW50UG9zICgke2N1cnJlbnRQb3MudG9GaXhlZCgxKX1zKSA+PSBkdXJhdGlvbiAoJHttYXhEdXJ9cykgLT4gdFx1MUVGMSBcdTAxMTFcdTFFRDluZyBjaHV5XHUxRUMzbiB0aVx1MUVCRnBgKTtcbiAgICAgICAgICBoYW5oRG9uZ1F1ZXVlKCdza2lwJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjYW5Db250cm9sICYmIGN1clRpbWUgIT09IG51bGwgJiYgY3VyVGltZSA+IDAgJiYgIWRhbmdHdWlMZW5oICYmICFpc1NlZWtpbmdSZWYuY3VycmVudCkge1xuICAgICAgICBjb25zdCBub3dNcyA9IERhdGUubm93KCk7XG4gICAgICAgIGNvbnN0IHVwZGF0ZVRpbWVNcyA9IHdhdGNoU3RhdGUudXBkYXRlZEF0ID8gbmV3IERhdGUoU3RyaW5nKHdhdGNoU3RhdGUudXBkYXRlZEF0KS5yZXBsYWNlKCcgJywgJ1QnKSArIChTdHJpbmcod2F0Y2hTdGF0ZS51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKSA6IG5vd01zO1xuICAgICAgICBjb25zdCBlbGFwc2VkU2VjID0gTWF0aC5tYXgoMCwgKG5vd01zIC0gdXBkYXRlVGltZU1zKSAvIDEwMDApO1xuICAgICAgICBjb25zdCBleHBlY3RlZFNlcnZlclBvcyA9IE51bWJlcih3YXRjaFN0YXRlLmJhc2VQb3NpdGlvblNlY29uZHMgIT0gbnVsbCA/IHdhdGNoU3RhdGUuYmFzZVBvc2l0aW9uU2Vjb25kcyA6IHdhdGNoU3RhdGUucG9zaXRpb25TZWNvbmRzKSArIChlbGFwc2VkU2VjICogKHdhdGNoU3RhdGUucGxheWJhY2tSYXRlIHx8IDEuMCkpO1xuICAgICAgICBjb25zdCBob3N0RHJpZnQgPSBNYXRoLmFicyhjdXJUaW1lIC0gZXhwZWN0ZWRTZXJ2ZXJQb3MpO1xuXG4gICAgICAgIGlmIChob3N0RHJpZnQgPiA0LjAgfHwgKG5vd01zIC0gbGFzdEhvc3RTeW5jVGltZVJlZi5jdXJyZW50ID4gMjAwMDAgJiYgaG9zdERyaWZ0ID4gMi4wKSkge1xuICAgICAgICAgIGxhc3RIb3N0U3luY1RpbWVSZWYuY3VycmVudCA9IG5vd01zO1xuICAgICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBjdXJUaW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY3VyVGltZSA9PT0gbnVsbCkge1xuICAgICAgICBzZXRMb2NhbFRpbWUodCA9PiAobWF4RHVyID4gMCA/IE1hdGgubWluKHQgKyAxLCBNYXRoLmZsb29yKG1heER1cikpIDogdCArIDEpKTtcbiAgICAgIH1cbiAgICB9LCAxMDAwKTtcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbCh0aWNrKTtcbiAgfSwgW3dhdGNoU3RhdGUucGxheWluZywgcHJvdmlkZXIsIGR1cmF0aW9uLCBsb2NhbFRpbWUsIGNhbkNvbnRyb2xdKTtcblxuICAvLyBHXHUxRUVEaSBsXHUxRUM3bmggXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiAoUGxheSAvIFBhdXNlIC8gU2VlaylcbiAgY29uc3QgZ3VpTGVuaCA9IGFzeW5jIChhY3Rpb24sIGN1c3RvbVBvcykgPT4ge1xuICAgIGlmIChkYW5nR3VpTGVuaCkgcmV0dXJuO1xuICAgIHNldERhbmdHdWlMZW5oKHRydWUpO1xuICAgIHNldExvaSgnJyk7XG5cbiAgICBsZXQgcG9zID0gY3VzdG9tUG9zO1xuICAgIGlmIChwb3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICAgIHBvcyA9IHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWU7XG4gICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudD8uZ2V0Q3VycmVudFRpbWUpIHtcbiAgICAgICAgcG9zID0geXRQbGF5ZXJSZWYuY3VycmVudC5nZXRDdXJyZW50VGltZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9zID0gbG9jYWxUaW1lO1xuICAgICAgfVxuICAgIH1cbiAgICBwb3MgPSBNYXRoLm1heCgwLCBOdW1iZXIoKHBvcyB8fCAwKS50b0ZpeGVkKDIpKSk7XG5cbiAgICAvLyBDXHUxRUFEcCBuaFx1MUVBRHQgbFx1MUVBMWMgcXVhbiB0clx1MDBFQW4gbG9jYWwgcGxheWVyXG4gICAgaWYgKGFjdGlvbiA9PT0gJ3BsYXknKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBsYXlWaWRlbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZSgne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBsYXlWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ3BhdXNlJykge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LnBhdXNlKCk7XG4gICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wYXVzZVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wYXVzZVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZSgne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBhdXNlVmlkZW9cIixcImFyZ3NcIjpcIlwifScsICcqJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdzZWVrJykge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lID0gcG9zO1xuICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8uc2Vla1RvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8ocG9zLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFtwb3MsIHRydWVdIH0pLCAnKicpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy13YXRjaCcsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgYWN0aW9uLFxuICAgICAgICAgIHBvc2l0aW9uOiBwb3MsXG4gICAgICAgICAgZXhwZWN0ZWRSZXZpc2lvbjogd2F0Y2hTdGF0ZS5yZXZpc2lvbixcbiAgICAgICAgICBwbGF5YmFja1JhdGU6IHdhdGNoU3RhdGUucGxheWJhY2tSYXRlIHx8IDEuMFxuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIGQuc3RhdGUpIHtcbiAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IoZC5zdGF0ZS5wb3NpdGlvblNlY29uZHMgfHwgcG9zKSk7XG4gICAgICB9IGVsc2UgaWYgKGQuY29uZmxpY3QgJiYgZC5zdGF0ZSkge1xuICAgICAgICBzZXRXYXRjaFN0YXRlKGQuc3RhdGUpO1xuICAgICAgICBhcER1bmdEb25nQm8oZC5zdGF0ZSwgY2FuQ29udHJvbCwgcHJvdmlkZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0TG9pKGQubG9pIHx8ICdMXHUxRUQ3aSBjXHUxRUFEcCBuaFx1MUVBRHQgcGhcdTAwRTF0IHZpZGVvLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0TG9pKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RGFuZ0d1aUxlbmgoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyBcdTAxMTBcdTFFRDNuZyBiXHUxRUQ5IHZcdTFFQ0IgdHJcdTAwRUQgdmlkZW8gaGlcdTFFQzduIHRcdTFFQTFpIHJhIG5nb1x1MDBFMGkgXHUwMTExXHUxRUMzIGNoYXQgZ1x1MUVBRm4gdGltZXN0YW1wXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHZpZGVvVGltZVJlZikgdmlkZW9UaW1lUmVmLmN1cnJlbnQgPSBsb2NhbFRpbWU7XG4gIH0sIFtsb2NhbFRpbWUsIHZpZGVvVGltZVJlZl0pO1xuXG5cblxuICAvLyBOaFx1MUVBRG4geVx1MDBFQXUgY1x1MUVBN3UgdHVhIHRcdTFFRUIgU3R1ZHlEb2NrIChiXHUxRUE1bSBtXHUxRUQxYyB2aWRlbyB0cm9uZyBjaGF0L2doaSBjaFx1MDBGQSkuXG4gIC8vIENcdTAwRjMgcXV5XHUxRUMxbiBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIFx1MjE5MiBwaFx1MDBFMXQgbFx1MUVDN25oIHNlZWsgY2h1bmc7IGtoXHUwMEY0bmcgXHUyMTkyIGNoXHUxRUM5IHR1YSBjXHUxRUU1YyBiXHUxRUQ5IHBsYXllciBjXHUxRUU3YSBtXHUwMEVDbmguXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qgb25TZWVrUmVxID0gKGUpID0+IHtcbiAgICAgIGlmIChlLmRldGFpbD8ucGhvbmdJZCAmJiBTdHJpbmcoZS5kZXRhaWwucGhvbmdJZCkgIT09IFN0cmluZyhwaG9uZz8uaWQpKSByZXR1cm47XG4gICAgICBjb25zdCBzZWMgPSBNYXRoLm1heCgwLCBOdW1iZXIoZS5kZXRhaWw/LnNlYykgfHwgMCk7XG5cbiAgICAgIGlmICghaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSB7XG4gICAgICAgIGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgIHNldEhhc0ludGVyYWN0ZWQodHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKHNlYykpO1xuXG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgdmlkZW9SZWYuY3VycmVudC5jdXJyZW50VGltZSA9IHNlYztcbiAgICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8uc2Vla1RvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8oc2VjLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFtzZWMsIHRydWVdIH0pLCAnKicpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2FuQ29udHJvbCkge1xuICAgICAgICBndWlMZW5oKCdzZWVrJywgc2VjKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzci1zZWVrJywgb25TZWVrUmVxKTtcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3NyLXNlZWsnLCBvblNlZWtSZXEpO1xuICB9LCBbcGhvbmc/LmlkLCBjYW5Db250cm9sLCBwcm92aWRlciwgd2F0Y2hTdGF0ZT8ucmV2aXNpb25dKTtcblxuICBjb25zdCBoYW5kbGVTdGFydFZpZXdpbmcgPSAoKSA9PiB7XG4gICAgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBzZXRIYXNJbnRlcmFjdGVkKHRydWUpO1xuXG4gICAgY29uc3Qgbm93TXMgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHVwZGF0ZVRpbWVNcyA9IHdhdGNoU3RhdGUudXBkYXRlZEF0ID8gbmV3IERhdGUoU3RyaW5nKHdhdGNoU3RhdGUudXBkYXRlZEF0KS5yZXBsYWNlKCcgJywgJ1QnKSArIChTdHJpbmcod2F0Y2hTdGF0ZS51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKSA6IG5vd01zO1xuICAgIGNvbnN0IGVsYXBzZWRTZWMgPSBNYXRoLm1heCgwLCAobm93TXMgLSB1cGRhdGVUaW1lTXMpIC8gMTAwMCk7XG4gICAgbGV0IHRhcmdldFBvcyA9IE51bWJlcih3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICB0YXJnZXRQb3MgPSBOdW1iZXIod2F0Y2hTdGF0ZS5iYXNlUG9zaXRpb25TZWNvbmRzICE9IG51bGwgPyB3YXRjaFN0YXRlLmJhc2VQb3NpdGlvblNlY29uZHMgOiB3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcykgKyAoZWxhcHNlZFNlYyAqICh3YXRjaFN0YXRlLnBsYXliYWNrUmF0ZSB8fCAxLjApKTtcbiAgICB9XG4gICAgdGFyZ2V0UG9zID0gTWF0aC5tYXgoMCwgTnVtYmVyKHRhcmdldFBvcy50b0ZpeGVkKDIpKSk7XG5cbiAgICBoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKHRhcmdldFBvcykpO1xuXG4gICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICBjb25zdCB2ID0gdmlkZW9SZWYuY3VycmVudDtcbiAgICAgIGlmICh0YXJnZXRQb3MgPiAwKSB2LmN1cnJlbnRUaW1lID0gdGFyZ2V0UG9zO1xuICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICB2LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2LnBhdXNlKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgIGlmICh0YXJnZXRQb3MgPiAwKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5zZWVrVG8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnNlZWtUbyh0YXJnZXRQb3MsIHRydWUpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbdGFyZ2V0UG9zLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgIH1cbiAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBsYXlWaWRlbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKCd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwicGxheVZpZGVvXCIsXCJhcmdzXCI6XCJcIn0nLCAnKicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBhdXNlVmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBhdXNlVmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoJ3tcImV2ZW50XCI6XCJjb21tYW5kXCIsXCJmdW5jXCI6XCJwYXVzZVZpZGVvXCIsXCJhcmdzXCI6XCJcIn0nLCAnKicpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtNCBtaW4tdy0wIHctZnVsbFwiPlxuICAgICAgey8qIEtodW5nIHBoXHUwMEUxdCB2aWRlbyBjaFx1MDBFRG5oIFx1MjAxNCBraHVuZyBuZW9uIG1cdTFFREQgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBoXHUxRUM3IGdhbWUgYXJlbmEgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIHctZnVsbCBhc3BlY3QtdmlkZW8gYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMDUwNzBiXSB0by1ibGFjayByb3VuZGVkLTJ4bCBvdmVyZmxvdy1oaWRkZW4gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMTUgcmluZy0xIHJpbmctd2hpdGUvNSBzaGFkb3ctWzBfMF82MHB4X3JnYmEoMCwyNDIsMjU0LDAuMDcpLDBfMzBweF82MHB4Xy0xNXB4X3JnYmEoMCwwLDAsMC43KV1cIj5cbiAgICAgICAgey8qIE92ZXJsYXkgQXV0b3BsYXkgLyBHZXN0dXJlIGNobyBuZ1x1MDFCMFx1MUVERGkgeGVtICovfVxuICAgICAgICB7IWhhc0ludGVyYWN0ZWQgJiYgIWNhbkNvbnRyb2wgJiYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgfHwgcHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnKSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIHotMjAgYmctYmxhY2svNzUgYmFja2Ryb3AtYmx1ci1zbSBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTQgdGV4dC1jZW50ZXIgYW5pbWF0ZS1mYWRlSW5cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xNCBoLTE0IHJvdW5kZWQtZnVsbCBiZy1bIzAwRjJGRV0vMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC0yeGwgbWItMyBzaGFkb3ctWzBfMF8yNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBhbmltYXRlLXB1bHNlXCI+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REZBQ1xuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBtYi0xXCI+WGVtIENodW5nIENcdTAwRjluZyBQaFx1MDBGMm5nPC9wPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTMwMCBtYXgtdy14cyBtYi00XCI+XG4gICAgICAgICAgICAgIEJcdTFFQTVtIG5cdTAwRkF0IGJcdTAwRUFuIGRcdTAxQjBcdTFFREJpIFx1MDExMVx1MUVDMyBjXHUxRUE1cCBxdXlcdTFFQzFuIFx1MDBFMm0gdGhhbmggdlx1MDBFMCBjXHUwMEY5bmcgdGhlbyBkXHUwMEY1aSB0aW1lbGluZSB2XHUxRURCaSBjaFx1MUVFNyBwaFx1MDBGMm5nLlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImJ0bi12aWV3ZXItc3RhcnQtd2F0Y2hcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlU3RhcnRWaWV3aW5nfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIuNSByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzQjgyRjZdIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIHNoYWRvdy1sZyBob3ZlcjpvcGFjaXR5LTkwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTI1QjY8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPkJcdTFFQUZ0IFx1MDExMVx1MUVBN3UgeGVtIGNcdTAwRjluZyBwaFx1MDBGMm5nPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFZpZGVvIGVsZW1lbnRzIHRoZW8gcHJvdmlkZXIgKi99XG4gICAgICAgIHt5dElkID8gKFxuICAgICAgICAgIDxkaXYga2V5PXtgeXQtd3JhcC0ke3Bob25nLmlkfWB9IGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgcmVsYXRpdmUgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctYmxhY2tcIj5cbiAgICAgICAgICAgIDxpZnJhbWVcbiAgICAgICAgICAgICAgaWQ9e3l0Q29udGFpbmVySWR9XG4gICAgICAgICAgICAgIGtleT17YHl0LWZyYW1lLSR7cGhvbmcuaWR9YH1cbiAgICAgICAgICAgICAgc3JjPXtgaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvJHt5dElkfT9lbmFibGVqc2FwaT0xJm9yaWdpbj0ke2VuY29kZVVSSUNvbXBvbmVudCh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gOiAnJyl9JndpZGdldF9yZWZlcnJlcj0ke2VuY29kZVVSSUNvbXBvbmVudCh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5sb2NhdGlvbi5ocmVmIDogJycpfSZyZWw9MCZtb2Rlc3RicmFuZGluZz0xJnBsYXlzaW5saW5lPTFgfVxuICAgICAgICAgICAgICB0aXRsZT17cGhvbmcudGVuIHx8ICdZb3VUdWJlIFZpZGVvJ31cbiAgICAgICAgICAgICAgYWxsb3c9XCJhY2NlbGVyb21ldGVyOyBhdXRvcGxheTsgY2xpcGJvYXJkLXdyaXRlOyBlbmNyeXB0ZWQtbWVkaWE7IGd5cm9zY29wZTsgcGljdHVyZS1pbi1waWN0dXJlOyB3ZWItc2hhcmVcIlxuICAgICAgICAgICAgICBhbGxvd0Z1bGxTY3JlZW5cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBib3JkZXItMFwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogZHJ2SWQgPyAoXG4gICAgICAgICAgPGlmcmFtZVxuICAgICAgICAgICAgc3JjPXtgaHR0cHM6Ly9kcml2ZS5nb29nbGUuY29tL2ZpbGUvZC8ke2RydklkfS9wcmV2aWV3YH1cbiAgICAgICAgICAgIHRpdGxlPXtwaG9uZy50ZW59XG4gICAgICAgICAgICBhbGxvdz1cImF1dG9wbGF5OyBmdWxsc2NyZWVuXCJcbiAgICAgICAgICAgIGFsbG93RnVsbFNjcmVlblxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbFwiXG4gICAgICAgICAgLz5cbiAgICAgICAgKSA6IHRydWNUaWVwVXJsID8gKFxuICAgICAgICAgIDx2aWRlb1xuICAgICAgICAgICAgcmVmPXt2aWRlb1JlZn1cbiAgICAgICAgICAgIHNyYz17dHJ1Y1RpZXBVcmx9XG4gICAgICAgICAgICBwbGF5c0lubGluZVxuICAgICAgICAgICAgZGF0YS10ZXN0aWQ9XCJzdHVkeS12aWRlby1wbGF5ZXJcIlxuICAgICAgICAgICAgY29udHJvbHM9e2NhbkNvbnRyb2x9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb250YWluXCJcbiAgICAgICAgICAgIG9uTG9hZGVkTWV0YWRhdGE9e2UgPT4ge1xuICAgICAgICAgICAgICBpZiAoZS50YXJnZXQuZHVyYXRpb24gPiAwKSBzZXREdXJhdGlvbihlLnRhcmdldC5kdXJhdGlvbik7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25QbGF5PXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmICF3YXRjaFN0YXRlLnBsYXlpbmcgJiYgIWRhbmdHdWlMZW5oKSB7XG4gICAgICAgICAgICAgICAgZ3VpTGVuaCgncGxheScsIHZpZGVvUmVmLmN1cnJlbnQ/LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uUGF1c2U9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgd2F0Y2hTdGF0ZS5wbGF5aW5nICYmICFkYW5nR3VpTGVuaCkge1xuICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3BhdXNlJywgdmlkZW9SZWYuY3VycmVudD8uY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25FbmRlZD17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCkgaGFuaERvbmdRdWV1ZSgnc2tpcCcpO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uU2Vla2VkPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghY2FuQ29udHJvbCB8fCBkYW5nR3VpTGVuaCB8fCBpc1NlZWtpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICBjb25zdCBjdXIgPSB2aWRlb1JlZi5jdXJyZW50Py5jdXJyZW50VGltZTtcbiAgICAgICAgICAgICAgaWYgKGN1ciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgICAgICAgICAgIC8vIENoXHUxRUQxbmcgdlx1MDBGMm5nIGxcdTFFQjdwOiBtXHUxRUNEaSBnXHUwMEUxbiBjdXJyZW50VGltZSBuXHUxRUQ5aSBiXHUxRUQ5IChvcHRpbWlzdGljIHNlZWssIGRyaWZ0LWNvcnJlY3Rpb25cbiAgICAgICAgICAgICAgLy8gY1x1MUVFN2EgYXBEdW5nRG9uZ0JvKSBcdTAxMTFcdTFFQzF1IGJcdTFFQUZuICdzZWVrZWQnLiBDaFx1MUVDOSBnXHUxRUVEaSBsXHUxRUM3bmgga2hpIHZcdTFFQ0IgdHJcdTAwRUQgbFx1MUVDN2NoIGtoXHUxRUNGaVxuICAgICAgICAgICAgICAvLyB2XHUxRUNCIHRyXHUwMEVEIHNlcnZlciBrXHUxRUYzIHZcdTFFQ0RuZyA+MS41cyBcdTIwMTQgdFx1MUVFOWMgbmdcdTAxQjBcdTFFRERpIGRcdTAwRjluZyB0aFx1MUVBRHQgc1x1MUVGMSB0dWEgcXVhIHRoYW5oIGNvbnRyb2xzLlxuICAgICAgICAgICAgICBjb25zdCBzdCA9IHdhdGNoU3RhdGU7XG4gICAgICAgICAgICAgIGNvbnN0IHVwZE1zID0gc3Q/LnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyhzdC51cGRhdGVkQXQpLnJlcGxhY2UoJyAnLCAnVCcpICsgKFN0cmluZyhzdC51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKSA6IERhdGUubm93KCk7XG4gICAgICAgICAgICAgIGNvbnN0IGVsYXBzZWQgPSBNYXRoLm1heCgwLCAoRGF0ZS5ub3coKSAtIHVwZE1zKSAvIDEwMDApO1xuICAgICAgICAgICAgICBjb25zdCBreVZvbmcgPSBzdD8ucGxheWluZ1xuICAgICAgICAgICAgICAgID8gTnVtYmVyKHN0LmJhc2VQb3NpdGlvblNlY29uZHMgfHwgMCkgKyBlbGFwc2VkICogKHN0LnBsYXliYWNrUmF0ZSB8fCAxKVxuICAgICAgICAgICAgICAgIDogTnVtYmVyKHN0Py5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgICAgICAgICAgIGlmIChNYXRoLmFicyhjdXIgLSBreVZvbmcpID4gMS41KSBndWlMZW5oKCdzZWVrJywgY3VyKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgLz5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGgtZnVsbCB0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIHAtNiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC0yeGwgbWItMlwiPlx1MjZBMFx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkxpbmsgdmlkZW8ga2hcdTAwRjRuZyBoXHUxRUQ3IHRyXHUxRUUzIHBoXHUwMEUxdCB0clx1MUVGMWMgdGlcdTFFQkZwIGhvXHUxRUI3YyBraFx1MDBGNG5nIGhcdTFFRTNwIGxcdTFFQzcuPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBUaFx1MDBGNG5nIGJcdTAwRTFvIHJpXHUwMEVBbmcgY2hvIEdvb2dsZSBEcml2ZSAqL31cbiAgICAgIHtkcnZJZCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMy41IHB5LTIgYmctYW1iZXItNTAwLzEwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzIwIHJvdW5kZWQteGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyB0ZXh0LWFtYmVyLTMwMFwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc21cIj5cdTIxMzlcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgPHNwYW4+R29vZ2xlIERyaXZlIHBoXHUwMEUxdCBcdTFFREYgY2hcdTFFQkYgXHUwMTExXHUxRUQ5IDxzdHJvbmc+WGVtIFx1MDExMVx1MUVEOWMgbFx1MUVBRHA8L3N0cm9uZz4gKEdvb2dsZSBEcml2ZSBraFx1MDBGNG5nIGhcdTFFRDcgdHJcdTFFRTMgQVBJIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gdFx1MUVFQiB4YSkuPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBUaGFuaCBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIEhvc3QgXHUyMDE0IFx1MUVBOW4ga2hpIGZ1bGxzY3JlZW4gKi99XG4gICAgICB7IWlzUm9vbVdpZGUgJiYgKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1ncmFkaWVudC10by1iIGZyb20tWyMxNjFiMjZdIHRvLVsjMGYxNDFkXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8xMCByb3VuZGVkLTJ4bCBwLTMgc206cC0zLjUgZmxleCBmbGV4LWNvbCBnYXAtMyBzaGFkb3cteGxcIj5cblxuXG4gICAgICAgIHsvKiBUaGFuaCBjXHUwMEY0bmcgY1x1MUVFNSBwaFx1MDBFMXQgY2h1bmcgKGNoXHUxRUM5IGhpXHUxRUMzbiB0aFx1MUVDQiBjaG8gSG9zdCAvIFRlYWNoZXIga2hpIGRcdTAwRjluZyBwcm92aWRlciBjXHUwMEYzIHRoXHUxRUMzIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24pICovfVxuICAgICAgICB7Y2FuQ29udHJvbCAmJiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnIHx8IHByb3ZpZGVyID09PSAnWU9VVFVCRScpICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgaXRlbXMtY2VudGVyIGdhcC0zIHB0LTIgYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiYnRuLWhvc3Qtd2F0Y2gtdG9nZ2xlXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgod2F0Y2hTdGF0ZS5wbGF5aW5nID8gJ3BhdXNlJyA6ICdwbGF5Jyl9XG4gICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIHNtOnctYXV0byBweC00IHB5LTIgcm91bmRlZC14bCBmb250LWJsYWNrIHRleHQteHMgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEuNSBzaGFkb3ctbWQgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyIGRpc2FibGVkOm9wYWNpdHktNTAgJHtcbiAgICAgICAgICAgICAgICB3YXRjaFN0YXRlLnBsYXlpbmdcbiAgICAgICAgICAgICAgICAgID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC80MCBob3ZlcjpiZy1hbWJlci01MDAvMzAgc2hhZG93LVswXzBfMTJweF9yZ2JhKDI0NSwxNTgsMTEsMC4yNSldJ1xuICAgICAgICAgICAgICAgICAgOiAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzAwYzZmZl0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBob3ZlcjpicmlnaHRuZXNzLTExMCdcbiAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICA8c3Bhbj57d2F0Y2hTdGF0ZS5wbGF5aW5nID8gJ1x1MjNGOCcgOiAnXHUyNUI2J308L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPnt3YXRjaFN0YXRlLnBsYXlpbmcgPyAnVFx1MUVBMW0gRFx1MUVFQm5nIENcdTFFQTMgUGhcdTAwRjJuZycgOiAnUGhcdTAwRTF0IENodW5nIENcdTFFQTMgUGhcdTAwRjJuZyd9PC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjUgdy1mdWxsXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGlkPVwiaG9zdC1kdXJhdGlvbi1sYWJlbFwiIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIHtkaW5oRGFuZ0dpYXlQaHV0KGxvY2FsVGltZSl9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgaWQ9XCJob3N0LXNlZWstc2xpZGVyXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwicmFuZ2VcIlxuICAgICAgICAgICAgICAgIG1pbj1cIjBcIlxuICAgICAgICAgICAgICAgIG1heD17ZHVyYXRpb24gPiAwID8gZHVyYXRpb24gOiBNYXRoLm1heChsb2NhbFRpbWUsIDMwMCl9XG4gICAgICAgICAgICAgICAgc3RlcD1cIjFcIlxuICAgICAgICAgICAgICAgIHZhbHVlPXtsb2NhbFRpbWV9XG4gICAgICAgICAgICAgICAgb25Nb3VzZURvd249eygpID0+IHsgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgIG9uVG91Y2hTdGFydD17KCkgPT4geyBpc1NlZWtpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0TG9jYWxUaW1lKE51bWJlcihlLnRhcmdldC52YWx1ZSkpfVxuICAgICAgICAgICAgICAgIG9uTW91c2VVcD17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBpc1NlZWtpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaCgnc2VlaycsIE51bWJlcihlLnRhcmdldC52YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgb25Ub3VjaEVuZD17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBpc1NlZWtpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaCgnc2VlaycsIE51bWJlcihlLnRhcmdldC52YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGgtMS41IGJnLXdoaXRlLzEwIHJvdW5kZWQtbGcgYXBwZWFyYW5jZS1ub25lIGN1cnNvci1wb2ludGVyIGFjY2VudC1bIzAwRjJGRV1cIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICB7ZHVyYXRpb24gPiAwID8gZGluaERhbmdHaWF5UGh1dChkdXJhdGlvbikgOiAnLS06LS0nfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7bG9pICYmIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1yb3NlLTQwMFwiPntsb2l9PC9wPn1cbiAgICAgICAge3Bob25nLm1vVGEgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgbGVhZGluZy1yZWxheGVkIHB0LTFcIj57cGhvbmcubW9UYX08L3A+fVxuXG4gICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBcdTI1MDBcdTI1MDBcdTI1MDAgVlx1MDBEOU5HIDE6IFRSVU5HIFRcdTAwQzJNIENcdTFFQTRVIEhcdTAwQ0NOSCBWSURFTyAmIEhcdTAwQzBORyBcdTAxMTBcdTFFRTJJIFlPVVRVQkUgVFJcdTFFRjBDIFRJXHUxRUJFUCBcdTI1MDBcdTI1MDBcdTI1MDAgKi99XG4gICAgICB7IWlzUm9vbVdpZGUgJiYgKFxuICAgICAgICA8ZGl2IGlkPVwidnVuZzEteW91dHViZS1zdHVkaW9cIiBzdHlsZT17eyBvdmVyZmxvd0FuY2hvcjogJ25vbmUnIH19IGNsYXNzTmFtZT1cImJnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzE2MWIyNl0gdG8tWyMwZjE0MWRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC0zLjUgc206cC00IGZsZXggZmxleC1jb2wgZ2FwLTMgc2hhZG93LXhsXCI+XG4gICAgICAgICAgey8qIEhlYWRlciB0cnVuZyB0XHUwMEUybSAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBwYi0yLjUgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ3LTggaC04IHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tYnIgZnJvbS1bIzAwRjJGRV0vMjAgdG8tdmlvbGV0LTUwMC8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXNtIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgwLDI0MiwyNTQsMC4yNSldXCI+XG4gICAgICAgICAgICAgICAgXHVEODNDXHVERkFDXG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC14cyBzbTp0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5DXHUxRUE1dSBoXHUwMEVDbmggVmlkZW8gJiBIXHUwMEUwbmcgXHUwMTExXHUxRUUzaSBZb3VUdWJlPC9zcGFuPlxuICAgICAgICAgICAgICAgICAge3F1ZXVlTGlzdC5maWx0ZXIocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQtZnVsbCBiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3F1ZXVlTGlzdC5maWx0ZXIocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpLmxlbmd0aH0gXHUwMTExYW5nIGNoXHUxRUREXG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMFwiPlRcdTAwRUNtIGtpXHUxRUJGbSB2aWRlbywgXHUwMTExXHUwMUIwYSB2XHUwMEUwbyBoXHUwMEUwbmcgY2hcdTFFREQgdlx1MDBFMCBjaFx1MUVBMXkgdmlkZW8ga2hcdTAwRTFjIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgY1x1MUVBMyBwaFx1MDBGMm5nPC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgey8qIFRhYiBzZWxlY3RvciAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBiZy1bIzBCMEUxNF0gcC0xIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tbWVkaWEtdGFiLXNlYXJjaFwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRNZWRpYVRhYignc2VhcmNoJyl9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEuNSByb3VuZGVkLWxnIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICAgICAgICBtZWRpYVRhYiA9PT0gJ3NlYXJjaCdcbiAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIHNoYWRvdy1tZCdcbiAgICAgICAgICAgICAgICAgICAgICA6ICd0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDBEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+VFx1MDBFQ20gWW91VHViZTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLW1lZGlhLXRhYi1xdWV1ZVwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRNZWRpYVRhYigncXVldWUnKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMS41IHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgICAgICAgIG1lZGlhVGFiID09PSAncXVldWUnXG4gICAgICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLXZpb2xldC01MDAgdG8tZnVjaHNpYS01MDAgdGV4dC13aGl0ZSBzaGFkb3ctbWQnXG4gICAgICAgICAgICAgICAgICAgICAgOiAndGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENDQjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPkhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpICh7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBUb2dnbGUgdGh1IGdcdTFFQ0RuICovfVxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tdG9nZ2xlLXN0dWRpb1wiXG4gICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBjdXJZID0gd2luZG93LnNjcm9sbFk7XG4gICAgICAgICAgICAgICAgICBzZXREYU1vUm9uZ1N0dWRpbyhwcmV2ID0+ICFwcmV2KTtcbiAgICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuc2Nyb2xsWSAhPT0gY3VyWSkge1xuICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbyh7IHRvcDogY3VyWSwgYmVoYXZpb3I6ICdpbnN0YW50JyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICB0aXRsZT17ZGFNb1JvbmdTdHVkaW8gPyAnVGh1IGdcdTFFQ0RuJyA6ICdNXHUxRURGIHJcdTFFRDluZyd9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLXhsIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAge2RhTW9Sb25nU3R1ZGlvID8gJ1x1MjVCMicgOiAnXHUyNUJDJ31cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiBUb2FzdCB0aFx1MDBGNG5nIGJcdTAwRTFvIC8gTFx1MUVEN2kgKi99XG4gICAgICAgICAge3Rob25nQmFvVmlkZW8gJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zIHB5LTIgcm91bmRlZC14bCBiZy1lbWVyYWxkLTUwMC8xNSBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQtZW1lcmFsZC0zMDAgdGV4dC14cyBmb250LWJvbGQgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgYW5pbWF0ZS1mYWRlSW5cIj5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNzI4PC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj57dGhvbmdCYW9WaWRlb308L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuICAgICAgICAgIHtsb2lWaWRlbyAmJiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMiByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzE1IGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdGV4dC1yb3NlLTMwMCB0ZXh0LXhzIGZvbnQtYm9sZCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTI2QTBcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPntsb2lWaWRlb308L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuXG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwIGVhc2UtaW4tb3V0IG92ZXJmbG93LWhpZGRlbiBmbGV4IGZsZXgtY29sIG1pbi1oLTAgJHtcbiAgICAgICAgICAgICAgZGFNb1JvbmdTdHVkaW8gPyAnbWF4LWgtWzM4MHB4XSBvcGFjaXR5LTEwMCcgOiAnbWF4LWgtMCBvcGFjaXR5LTAgcG9pbnRlci1ldmVudHMtbm9uZSdcbiAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgc3R5bGU9e3sgb3ZlcmZsb3dBbmNob3I6ICdub25lJyB9fT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1bMzQwcHhdIGZsZXggZmxleC1jb2wgbWluLWgtMCBvdmVyZmxvdy1oaWRkZW4gc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgey8qIFRBQiAxOiBUXHUwMENDTSBLSVx1MUVCRU0gWU9VVFVCRSAmIFx1MDExMFx1MUVENEkgVklERU8gKi99XG4gICAgICAgICAgICAgIHttZWRpYVRhYiA9PT0gJ3NlYXJjaCcgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1mdWxsIGZsZXggZmxleC1jb2wgZ2FwLTIuNSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICB7LyogXHUwMEQ0IHRcdTAwRUNtIGtpXHUxRUJGbSAvIGRcdTAwRTFuIGxpbmsgXHUwMTExYSBuXHUwMTAzbmcgKi99XG4gICAgICAgICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17KGUpID0+IHRpbUtpZW1Zb3VUdWJlKGUpfSBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC0yIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIGZsZXgtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYWJzb2x1dGUgbGVmdC0zIHRvcC0xLzIgLXRyYW5zbGF0ZS15LTEvMiB0ZXh0LXNsYXRlLTQwMCB0ZXh0LXhzXCI+XHVEODNEXHVERDBEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtdnVuZzEteW91dHViZS1zZWFyY2hcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt5dFF1ZXJ5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRZdFF1ZXJ5KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJOaFx1MUVBRHAgdFx1MUVFQiBraFx1MDBGM2EgdFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmUgKHZkOiBsb2ZpIGhcdTFFQ0RjIGJcdTAwRTBpLi4uKSBob1x1MUVCN2MgZFx1MDBFMW4gbGluayB2aWRlby4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBmb2N1czpib3JkZXItWyMwMEYyRkVdLzYwIHJvdW5kZWQteGwgcGwtOCBwci0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLXRpbS1raWVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXsheXRRdWVyeS50cmltKCkgfHwgc2VhcmNoaW5nWXR9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zLjUgcHktMiByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIGhvdmVyOmJyaWdodG5lc3MtMTEwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBzaGFkb3ctbWQgZGlzYWJsZWQ6b3BhY2l0eS00MCB3aGl0ZXNwYWNlLW5vd3JhcCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7c2VhcmNoaW5nWXQgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYW5pbWF0ZS1zcGluXCI+XHUyM0YzPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MDExMGFuZyB0XHUwMEVDbS4uLjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5UXHUwMEVDbSBraVx1MUVCRm08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgey8qIEFjdGlvbiBidXR0b25zIHBoXHUxRUU1IGtoaSBcdTAwRjQgaW5wdXQgbFx1MDBFMCAxIGxpbmsgdmlkZW8gdHJcdTFFRjFjIHRpXHUxRUJGcCAqL31cbiAgICAgICAgICAgICAgICAgICAge0Jvb2xlYW4oeXRRdWVyeS50cmltKCkuc3RhcnRzV2l0aCgnaHR0cDovLycpIHx8IHl0UXVlcnkudHJpbSgpLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vJykgfHwgeXRRdWVyeS5pbmNsdWRlcygneW91dHUnKSkgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcC0yIHJvdW5kZWQteGwgYmctWyMwQjBFMTRdLzgwIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzIwIGZsZXgtd3JhcCBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDE3PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5QaFx1MDBFMXQgaGlcdTFFQzduIGxpXHUwMEVBbiBrXHUxRUJGdCB2aWRlbzo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS1waGF0LW5nYXktbGlua1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGRvaVZpZGVvKHl0UXVlcnkudHJpbSgpLCAnVmlkZW8gdFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdEb2lWaWRlb31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1bIzAwRjJGRV0gdGV4dC1ibGFjayB0ZXh0LXhzIGZvbnQtYmxhY2sgaG92ZXI6YmctWyMwMGUxZWNdIGFjdGl2ZTpzY2FsZS05NSBzaGFkb3ctc21cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2IFBoXHUwMEUxdCBuZ2F5IGNcdTFFQTMgcGhcdTAwRjJuZ1xuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS1lbnF1ZXVlLWxpbmtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdlbnF1ZXVlJywgeyB2aWRlb1VybDogeXRRdWVyeS50cmltKCksIHRpdGxlOiAnVmlkZW8gdFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQnIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLWVtZXJhbGQtNTAwLzIwIHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICArIFRoXHUwMEVBbSB2XHUwMEUwbyBjdVx1MUVEMWkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtYWRkLW5leHQtbGlua1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ2FkZF9uZXh0JywgeyB2aWRlb1VybDogeXRRdWVyeS50cmltKCksIHRpdGxlOiAnVmlkZW8gdFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQnIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy12aW9sZXQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICsgUGhcdTAwRTF0IGtcdTFFQkYgdGlcdTFFQkZwXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDwvZm9ybT5cblxuICAgICAgICAgICAgICAgICAgey8qIFRyXHUxRUExbmcgdGhcdTAwRTFpIGxcdTFFRDdpIHRcdTAwRUNtIGtpXHUxRUJGbSAqL31cbiAgICAgICAgICAgICAgICAgIHtzZWFyY2hMb2kgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMi41IHJvdW5kZWQteGwgYmctYW1iZXItNTAwLzEwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIHRleHQteHMgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHUyNkEwXHVGRTBGIHtzZWFyY2hMb2l9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNlYXJjaExvaSgnJyl9IGNsYXNzTmFtZT1cInRleHQtYW1iZXItNDAwIGZvbnQtYm9sZCBob3Zlcjp1bmRlcmxpbmVcIj5cdTAxMTBcdTAwRjNuZzwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBLXHUxRUJGdCBxdVx1MUVBMyB0XHUwMEVDbSBraVx1MUVCRm0gWW91VHViZSAqL31cbiAgICAgICAgICAgICAgICAgIHt5dFJlc3VsdHMubGVuZ3RoID4gMCA/IChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMS41IG1pbi1oLTAgb3ZlcmZsb3ctaGlkZGVuXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0ZBPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5LXHUxRUJGdCBxdVx1MUVBMyBZb3VUdWJlICh7eXRSZXN1bHRzLmxlbmd0aH0gdmlkZW8pOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLWRvbmcta2V0LXF1YVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0WXRSZXN1bHRzKFtdKTsgc2V0U2VhcmNoTG9pKCcnKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMiBweS0wLjUgcm91bmRlZC1tZCBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgdGV4dC1bMTBweF0gZm9udC1ib2xkIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNSBcdTAxMTBcdTAwRjNuZyBrXHUxRUJGdCBxdVx1MUVBM1xuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBzcGFjZS15LTIgb3ZlcmZsb3cteS1hdXRvIHByLTEgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3l0UmVzdWx0cy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2VXJsID0gYGh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9JHtpdGVtLnZpZGVvSWR9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2l0ZW0udmlkZW9JZCB8fCBpZHh9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJncm91cCBiZy1bIzBCMEUxNF0gaG92ZXI6YmctWyMxMjE3MjFdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6Ym9yZGVyLVsjMDBGMkZFXS8zMCByb3VuZGVkLXhsIHAtMi41IGZsZXggaXRlbXMtY2VudGVyIGdhcC0zIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogVGh1bWJuYWlsICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSB3LTI0IHNtOnctMjggYXNwZWN0LXZpZGVvIHJvdW5kZWQtbGcgb3ZlcmZsb3ctaGlkZGVuIGJnLWJsYWNrIHNocmluay0wIGJvcmRlciBib3JkZXItd2hpdGUvNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW1nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjPXtpdGVtLnRodW1ibmFpbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbHQ9e2l0ZW0udGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY292ZXIgZ3JvdXAtaG92ZXI6c2NhbGUtMTA1IHRyYW5zaXRpb24tdHJhbnNmb3JtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nPVwibGF6eVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFic29sdXRlIGJvdHRvbS0xIHJpZ2h0LTEgYmctYmxhY2svODAgcHgtMSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtbW9ubyB0ZXh0LXdoaXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgWW91VHViZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFRoXHUwMEY0bmcgdGluIHZpZGVvICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgbWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDUgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS0yMDAgbGluZS1jbGFtcC0yIGdyb3VwLWhvdmVyOnRleHQtWyMwMEYyRkVdIHRyYW5zaXRpb24tY29sb3JzXCIgdGl0bGU9e2l0ZW0udGl0bGV9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpdGVtLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2g1PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG10LTEgdGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDAgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj57aXRlbS5jaGFubmVsVGl0bGUgfHwgJ0tcdTAwRUFuaCBZb3VUdWJlJ308L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2l0ZW0ucHVibGlzaGVkQXQgJiYgPHNwYW4+XHUyMDIyIHtpdGVtLnB1Ymxpc2hlZEF0fTwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBCXHUxRUQ5IDMgblx1MDBGQXQgdGhhbyB0XHUwMEUxYyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDaFx1MUVBMXkgdmlkZW8gblx1MDBFMHkgbmdheSBsXHUxRUFEcCB0XHUxRUU5YyBjaG8gY1x1MUVBMyBwaFx1MDBGMm5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBkb2lWaWRlbyh2VXJsLCBpdGVtLnRpdGxlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0RvaVZpZGVvfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMDBjNmZmXSB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC1bMTFweF0gc2hhZG93LXNtIGhvdmVyOmJyaWdodG5lc3MtMTEwIGFjdGl2ZTpzY2FsZS05NSBkaXNhYmxlZDpvcGFjaXR5LTQwIHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2IFBoXHUwMEUxdCBuZ2F5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJUaFx1MDBFQW0gdlx1MDBFMG8gY3VcdTFFRDFpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdlbnF1ZXVlJywgeyB2aWRlb1VybDogdlVybCwgdGl0bGU6IGl0ZW0udGl0bGUgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMS41IHJvdW5kZWQtbGcgYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIGhvdmVyOmJnLWVtZXJhbGQtNTAwLzI1IHRleHQtWzExcHhdIGZvbnQtYm9sZCBhY3RpdmU6c2NhbGUtOTUgZGlzYWJsZWQ6b3BhY2l0eS00MCB3aGl0ZXNwYWNlLW5vd3JhcCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgSFx1MDBFMG5nIGNoXHUxRUREXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJUaFx1MDBFQW0gXHUwMTExXHUxRUMzIHBoXHUwMEUxdCBrXHUxRUJGIHRpXHUxRUJGcCBzYXUgdmlkZW8gaGlcdTFFQzduIHRcdTFFQTFpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdhZGRfbmV4dCcsIHsgdmlkZW9Vcmw6IHZVcmwsIHRpdGxlOiBpdGVtLnRpdGxlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLXZpb2xldC01MDAvMTUgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCBob3ZlcjpiZy12aW9sZXQtNTAwLzI1IHRleHQtWzEwcHhdIGZvbnQtYm9sZCBhY3RpdmU6c2NhbGUtOTUgZGlzYWJsZWQ6b3BhY2l0eS00MCB3aGl0ZXNwYWNlLW5vd3JhcCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgS1x1MUVCRiB0aVx1MUVCRnBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIC8qIEdcdTFFRTNpIFx1MDBGRCB0XHUxRUVCIGtoXHUwMEYzYSB0XHUwMEVDbSBraVx1MUVCRm0gbmhhbmggKyBraHVuZyB0aFx1MDBGNG5nIHRpbiBnaVx1MUVFRiBjaGlcdTFFQzF1IGNhbyBjXHUxRUQxIFx1MDExMVx1MUVDQm5oICovXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wganVzdGlmeS1iZXR3ZWVuIGdhcC0yIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTEuNSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDAgZm9udC1ib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBHXHUxRUUzaSBcdTAwRkQgY2hcdTFFRTcgXHUwMTExXHUxRUMxIGhcdTFFQ0RjIHRcdTFFQURwICYgdGhcdTAxQjAgZ2lcdTAwRTNuOlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7W1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdcdUQ4M0NcdURGQTcgTG9maSBoXHUxRUNEYyB0XHUxRUFEcCcsIHE6ICdsb2ZpIGhpcCBob3AgcmFkaW8gYmVhdHMgdG8gcmVsYXggc3R1ZHkgdG8nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1RDgzQ1x1REYyN1x1RkUwRiBUaVx1MUVCRm5nIG1cdTAxQjBhICYgUGlhbm8nLCBxOiAncmFpbiBzb3VuZHMgcmVsYXhpbmcgcGlhbm8gc3R1ZHkgZm9jdXMnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1MjYxNSBOaFx1MUVBMWMgcXVcdTAwRTFuIGNcdTAwRTAgcGhcdTAwRUEnLCBxOiAnY29mZmVlIHNob3AgamF6eiBwaWFubyBjaGlsbCBzdHVkeScgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHVEODNEXHVEQ0RBIFRcdTFFQURwIHRydW5nIFx1MDBGNG4gdGhpJywgcTogJ3N0dWR5IG11c2ljIGFscGhhIHdhdmVzIGNvbmNlbnRyYXRpb24nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1RDgzRFx1REQyQyBUaFx1MDBFRCBuZ2hpXHUxRUM3bSBIXHUwMEYzYSBoXHUxRUNEYycsIHE6ICd0aFx1MDBFRCBuZ2hpXHUxRUM3bSBoXHUwMEYzYSBoXHUxRUNEYyB0aFx1MDBGQSB2XHUxRUNCJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBdLm1hcCgoY2hpcCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17Y2hpcC5xfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gdGltS2llbVlvdVR1YmUoZSwgY2hpcC5xKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQtWzExcHhdIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y2hpcC5sYWJlbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtMyBiZy1bIzBCMEUxNF0vNjAgYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQteGwgdGV4dC1jZW50ZXIgdGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBnYXAtMSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhsXCI+XHVEODNEXHVEQ0ZBPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwXCI+VFx1MDBFQ20ga2lcdTFFQkZtICYgUGhcdTAwRTF0IHZpZGVvIFlvdVR1YmU8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCBtYXgtdy1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBOaFx1MUVBRHAgdFx1MUVFQiBraFx1MDBGM2EgYlx1MDBFMGkgaFx1MUVDRGMgaG9cdTFFQjdjIGRcdTAwRTFuIGxpXHUwMEVBbiBrXHUxRUJGdCBZb3VUdWJlIFx1MUVERiB0clx1MDBFQW4gXHUwMTExXHUxRUMzIHRcdTAwRUNtIGtpXHUxRUJGbSB2XHUwMEUwIHBoXHUwMEUxdCBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGNobyB0XHUxRUE1dCBjXHUxRUEzIHRoXHUwMEUwbmggdmlcdTAwRUFuIHRyb25nIHBoXHUwMEYybmcuXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICB7LyogVEFCIDI6IFFVXHUxRUEyTiBMXHUwMEREIEhcdTAwQzBORyBcdTAxMTBcdTFFRTJJIChRVUVVRSkgKi99XG4gICAgICAgICAgICAgIHttZWRpYVRhYiA9PT0gJ3F1ZXVlJyAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLWZ1bGwgZmxleCBmbGV4LWNvbCBnYXAtMi41IG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGZsZXgtd3JhcCBnYXAtMiBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0NCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPkhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHZpZGVvICh7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RofSBjaFx1MUVERCk8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7cXVldWVMaXN0LnNvbWUocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLXF1ZXVlLXNraXBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdza2lwJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctYW1iZXItNTAwLzE1IHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLWFtYmVyLTUwMC8yNSBkaXNhYmxlZDpvcGFjaXR5LTQwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MjNFRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVDRiBxdWEgLyBCXHUwMEUwaSB0aVx1MUVCRnA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGFpUXVldWV9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkxcdTAwRTBtIG1cdTFFREJpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIgcHktMSByb3VuZGVkLWxnIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LXhzIGJvcmRlciBib3JkZXItd2hpdGUvMTAgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzRFx1REQwNFxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICB7LyogVGhcdTAwRUFtIGxpbmsgbmhhbmggdlx1MDBFMG8gcXVldWUgKi99XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgIDxRdWV1ZUlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgb25BZGQ9eyh1LCB0KSA9PiBoYW5oRG9uZ1F1ZXVlKCdlbnF1ZXVlJywgeyB2aWRlb1VybDogdSwgdGl0bGU6IHQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgb25BZGROZXh0PXsodSwgdCkgPT4gaGFuaERvbmdRdWV1ZSgnYWRkX25leHQnLCB7IHZpZGVvVXJsOiB1LCB0aXRsZTogdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICB7LyogRGFuaCBzXHUwMEUxY2ggdmlkZW8gdHJvbmcgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgKi99XG4gICAgICAgICAgICAgICAgICB7cXVldWVMaXN0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00IGJnLVsjMEIwRTE0XS82MCBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC14bCB0ZXh0LWNlbnRlciB0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIGdhcC0xLjUgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtMnhsXCI+XHVEODNEXHVEQ0NCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMFwiPkhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIGhpXHUxRUM3biBcdTAxMTFhbmcgdHJcdTFFRDFuZzwvcD5cbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCBtYXgtdy1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgQ2h1eVx1MUVDM24gc2FuZyB0YWIgPHN0cm9uZz5UXHUwMEVDbSBZb3VUdWJlPC9zdHJvbmc+IGhvXHUxRUI3YyBkXHUwMEUxbiBsaVx1MDBFQW4ga1x1MUVCRnQgdlx1MDBFMG8gXHUwMEY0IHRyXHUwMEVBbiBcdTAxMTFcdTFFQzMgXHUwMTExXHUwMUIwYSB2aWRlbyB2XHUwMEUwbyBkYW5oIHNcdTAwRTFjaCBwaFx1MDBFMXQgbGlcdTAwRUFuIHRcdTFFRTVjLlxuICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBzcGFjZS15LTEuNSBvdmVyZmxvdy15LWF1dG8gcHItMSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3F1ZXVlTGlzdC5tYXAoKHEsIGlkeCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3EuaWQgfHwgaWR4fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41IGJnLVsjMEIwRTE0XSBib3JkZXIgcm91bmRlZC14bCBwLTIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxLnRyYW5nVGhhaSA9PT0gJ3BsYXlpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdib3JkZXItZW1lcmFsZC01MDAvNDAgc2hhZG93LVswXzBfMTVweF9yZ2JhKDUyLDIxMSwxNTMsMC4xNSldIGJnLWVtZXJhbGQtOTUwLzIwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYm9yZGVyLXdoaXRlLzUgaG92ZXI6Ym9yZGVyLXdoaXRlLzE1J1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy02IGgtNiByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzExcHhdIGZvbnQtYmxhY2sgc2hyaW5rLTAgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHEudHJhbmdUaGFpID09PSAncGxheWluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctZW1lcmFsZC01MDAgdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xMHB4X3JnYmEoNTIsMjExLDE1MywwLjQpXSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRyYW5nVGhhaSA9PT0gJ3BsYXlpbmcnID8gJ1x1MjVCNicgOiBpZHggKyAxfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge3EudGh1bWIgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtxLnRodW1ifSBhbHQ9XCJcIiBjbGFzc05hbWU9XCJ3LTEyIGgtNyByb3VuZGVkLW1kIG9iamVjdC1jb3ZlciBzaHJpbmstMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwXCIgbG9hZGluZz1cImxhenlcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMjAwIGZvbnQtYm9sZCB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudGl0bGUgfHwgcS52aWRlb1VybH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRyYW5nVGhhaSA9PT0gJ3BsYXlpbmcnID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWVtZXJhbGQtNDAwIGZvbnQtYm9sZFwiPlx1MjVDRiBcdTAxMTBhbmcgcGhcdTAwRTF0PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+VGhcdTAwRUFtIGJcdTFFREZpOiB7cS5hZGRlZEJ5IHx8ICdUaFx1MDBFMG5oIHZpXHUwMEVBbid9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJQaFx1MDBFMXQgdmlkZW8gblx1MDBFMHkgbmdheVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3BsYXlfbm93JywgeyBpZDogcS5pZCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1bIzAwRjJGRV0vMjAgdGV4dC1bIzAwRjJGRV0gaG92ZXI6YmctWyMwMEYyRkVdLzMwIHRleHQteHMgZm9udC1ibGFjayBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2IFBoXHUwMEUxdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiWFx1MDBGM2Ega2hcdTFFQ0ZpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgncmVtb3ZlJywgeyBpZDogcS5pZCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy03IGgtNyByb3VuZGVkLWxnIGJnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS0zMDAgaG92ZXI6Ymctcm9zZS01MDAvMjUgdGV4dC14cyBmb250LWJsYWNrIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG5cbiAgKTtcbn1cblxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ29tcG9uZW50OiBDYW1wdXMgRm9jdXMgUm9vbSAoU3R1ZHkgQ2FmXHUwMEU5ICYgUG9tb2Rvcm8gU2Vzc2lvbikgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5leHBvcnQgZnVuY3Rpb24gQ2FtcHVzRm9jdXNSb29tKHtcbiAgcGhvbmcsXG4gIHBob25nTWluaEtob2EsXG4gIGF1dGgsXG4gIGRvbmdQaG9uZ0hpZW5UYWksXG4gIHNvTmd1b2ksXG4gIGlzRm9jdXNNb2RlLFxuICBzZXRJc0ZvY3VzTW9kZVxufSkge1xuICBjb25zdCBbZm9jdXNTdGF0ZSwgc2V0Rm9jdXNTdGF0ZV0gPSB1c2VTdGF0ZSh7XG4gICAgcGhhc2U6ICdmb2N1cycsXG4gICAgc3RhdHVzOiAncGF1c2VkJyxcbiAgICBkdXJhdGlvblNlY29uZHM6IDE1MDAsXG4gICAgcmVtYWluaW5nU2Vjb25kczogMTUwMCxcbiAgICBwcmVzZXQ6ICcyNV81JyxcbiAgICByZXZpc2lvbjogMSxcbiAgICBjYW5Db250cm9sOiBmYWxzZSxcbiAgICB1cGRhdGVkQXQ6IG51bGwsXG4gICAgc2VydmVyTm93OiBudWxsXG4gIH0pO1xuICBjb25zdCBbbG9jYWxSZW1haW5pbmcsIHNldExvY2FsUmVtYWluaW5nXSA9IHVzZVN0YXRlKDE1MDApO1xuICBjb25zdCBbZGFuZ0d1aUxlbmgsIHNldERhbmdHdWlMZW5oXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2xvaSwgc2V0TG9pXSA9IHVzZVN0YXRlKCcnKTtcblxuICAvLyBBdWRpbyBzdGF0ZSAoQW1iaWVudCBwbGF5YmFjaylcbiAgbGV0IGNhdUhpbmggPSB7fTtcbiAgdHJ5IHsgY2F1SGluaCA9IHBob25nLmNhdUhpbmggPyBKU09OLnBhcnNlKHBob25nLmNhdUhpbmgpIDoge307IH0gY2F0Y2ggeyAvKiBiXHUxRUNGIHF1YSAqLyB9XG4gIGNvbnN0IG5oYWNVcmwgPSBjYXVIaW5oLm5oYWNVcmwgPyB1cmxNZWRpYUZlKGNhdUhpbmgubmhhY1VybCkgOiAnJztcbiAgY29uc3QgYXVkaW9SZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IFthdWRpb1BsYXlpbmcsIHNldEF1ZGlvUGxheWluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFthdWRpb1ZvbHVtZSwgc2V0QXVkaW9Wb2x1bWVdID0gdXNlU3RhdGUoMC41KTtcbiAgY29uc3QgW2F1ZGlvTXV0ZWQsIHNldEF1ZGlvTXV0ZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbaGFzSW50ZXJhY3RlZEF1ZGlvLCBzZXRIYXNJbnRlcmFjdGVkQXVkaW9dID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8vIEF1dGhvcml6YXRpb25cbiAgY29uc3QgW2NhbkNvbnRyb2wsIHNldENhbkNvbnRyb2xdID0gdXNlU3RhdGUoQm9vbGVhbihhdXRoLnVzZXI/LmlzVGVhY2hlciB8fCBwaG9uZz8uY2FuQ29udHJvbCB8fCBwaG9uZz8ubGFDaHVQaG9uZykpO1xuICBjb25zdCBpc0hvc3QgPSBjYW5Db250cm9sO1xuXG4gIC8vIFN5bmMgc3RhdGUgcmVjb25jaWxpYXRpb24gaGVscGVyXG4gIGNvbnN0IGFwRHVuZ0ZvY3VzU3RhdGUgPSAoc3QpID0+IHtcbiAgICBpZiAoIXN0KSByZXR1cm47XG4gICAgc2V0Rm9jdXNTdGF0ZShzdCk7XG4gICAgY29uc3QgcmVtID0gTnVtYmVyKHN0LnJlbWFpbmluZ1NlY29uZHMgPz8gMTUwMCk7XG4gICAgc2V0TG9jYWxSZW1haW5pbmcocmVtKTtcbiAgfTtcblxuICAvLyAxLiBQb2xsaW5nIEZvY3VzIFN0YXRlIChldmVyeSAzMDAwbXMpIHdpdGggdmlzaWJpbGl0eSByZWNvbmNpbGlhdGlvbiAmIHN0cmljdCBjbGVhbnVwXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG5cbiAgICBjb25zdCBmZXRjaEZvY3VzID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctZm9jdXM/cGhvbmdJZD0ke2VuY29kZVVSSUNvbXBvbmVudChwaG9uZy5pZCl9YCk7XG4gICAgICAgIGlmICghcmVzLm9rKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICAgIGlmICh0eXBlb2YgZC5jYW5Db250cm9sID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHNldENhbkNvbnRyb2woZC5jYW5Db250cm9sKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXBEdW5nRm9jdXNTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8qIGJcdTFFQ0YgcXVhIGtoaSBoXHUxRUU3eSBrXHUxRUJGdCBuXHUxRUQxaSAqL1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmZXRjaEZvY3VzKCk7XG4gICAgY29uc3QgdGltZXIgPSBzZXRJbnRlcnZhbChmZXRjaEZvY3VzLCAzMDAwKTtcblxuICAgIGNvbnN0IGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UgPSAoKSA9PiB7XG4gICAgICBpZiAoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAndmlzaWJsZScgJiYgYWN0aXZlKSB7XG4gICAgICAgIGZldGNoRm9jdXMoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlKTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBhY3RpdmUgPSBmYWxzZTtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UpO1xuICAgIH07XG4gIH0sIFtwaG9uZy5pZF0pO1xuXG4gIC8vIDIuIExvY2FsIENvdW50ZG93biBUaWNrIChldmVyeSAxMDAwbXMgd2hlbiBzdGF0dXMgPT09ICdydW5uaW5nJylcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZm9jdXNTdGF0ZS5zdGF0dXMgIT09ICdydW5uaW5nJykgcmV0dXJuO1xuICAgIGNvbnN0IHRpY2sgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBzZXRMb2NhbFJlbWFpbmluZyhyID0+IE1hdGgubWF4KDAsIHIgLSAxKSk7XG4gICAgfSwgMTAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodGljayk7XG4gIH0sIFtmb2N1c1N0YXRlLnN0YXR1c10pO1xuXG4gIC8vIDMuIENvbW1hbmQgZGlzcGF0Y2hlciB3aXRoIG9wdGltaXN0aWMgY29uY3VycmVuY3kgKHJldmlzaW9uIGNoZWNrICYgY29uZmxpY3QgaGFuZGxpbmcpXG4gIGNvbnN0IGd1aUxlbmggPSBhc3luYyAoYWN0aW9uLCBleHRyYVBheWxvYWQgPSB7fSkgPT4ge1xuICAgIGlmIChkYW5nR3VpTGVuaCkgcmV0dXJuO1xuICAgIHNldERhbmdHdWlMZW5oKHRydWUpO1xuICAgIHNldExvaSgnJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctZm9jdXMnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgIGFjdGlvbixcbiAgICAgICAgICBleHBlY3RlZFJldmlzaW9uOiBmb2N1c1N0YXRlLnJldmlzaW9uLFxuICAgICAgICAgIC4uLmV4dHJhUGF5bG9hZFxuICAgICAgICB9KVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICBhcER1bmdGb2N1c1N0YXRlKGQuc3RhdGUpO1xuICAgICAgfSBlbHNlIGlmIChyZXMuc3RhdHVzID09PSA0MDkgJiYgZC5zdGF0ZSkge1xuICAgICAgICAvLyBDb25jdXJyZW5jeSBjb25mbGljdDogYWRvcHQgbGF0ZXN0IHNlcnZlciBzdGF0ZVxuICAgICAgICBhcER1bmdGb2N1c1N0YXRlKGQuc3RhdGUpO1xuICAgICAgICBzZXRMb2koJ1x1MDExMFx1MDBFMyBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGxcdTFFQTFpIHBoaVx1MDBFQW4gdGhlbyBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldExvaShkLmxvaSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyBjXHUxRUFEcCBuaFx1MUVBRHQgdHJcdTFFQTFuZyB0aFx1MDBFMWkgcGhcdTAwRjJuZyBoXHUxRUNEYyB0XHUxRUFEcC4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldERhbmdHdWlMZW5oKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gNC4gQW1iaWVudCBBdWRpbyBDb250cm9sc1xuICBjb25zdCBiYXRBbVRoYW5oID0gKCkgPT4ge1xuICAgIHNldEhhc0ludGVyYWN0ZWRBdWRpbyh0cnVlKTtcbiAgICBpZiAoYXVkaW9SZWYuY3VycmVudCkge1xuICAgICAgYXVkaW9SZWYuY3VycmVudC5wbGF5KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHNldEF1ZGlvUGxheWluZyh0cnVlKTtcbiAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUud2FybignQXV0b3BsYXkgYmxvY2tlZCBvciBhdWRpbyBsb2FkIGVycm9yOicsIGVycik7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdG9nZ2xlQXVkaW9QbGF5ID0gKCkgPT4ge1xuICAgIGlmICghYXVkaW9SZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGlmIChhdWRpb1BsYXlpbmcpIHtcbiAgICAgIGF1ZGlvUmVmLmN1cnJlbnQucGF1c2UoKTtcbiAgICAgIHNldEF1ZGlvUGxheWluZyhmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJhdEFtVGhhbmgoKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdG9nZ2xlQXVkaW9NdXRlID0gKCkgPT4ge1xuICAgIGlmICghYXVkaW9SZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGNvbnN0IG5ld011dGUgPSAhYXVkaW9NdXRlZDtcbiAgICBhdWRpb1JlZi5jdXJyZW50Lm11dGVkID0gbmV3TXV0ZTtcbiAgICBzZXRBdWRpb011dGVkKG5ld011dGUpO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVZvbHVtZUNoYW5nZSA9IChlKSA9PiB7XG4gICAgY29uc3QgdmFsID0gcGFyc2VGbG9hdChlLnRhcmdldC52YWx1ZSk7XG4gICAgc2V0QXVkaW9Wb2x1bWUodmFsKTtcbiAgICBpZiAoYXVkaW9SZWYuY3VycmVudCkge1xuICAgICAgYXVkaW9SZWYuY3VycmVudC52b2x1bWUgPSB2YWw7XG4gICAgICBpZiAodmFsID4gMCAmJiBhdWRpb011dGVkKSB7XG4gICAgICAgIGF1ZGlvUmVmLmN1cnJlbnQubXV0ZWQgPSBmYWxzZTtcbiAgICAgICAgc2V0QXVkaW9NdXRlZChmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGlzQnJlYWsgPSBmb2N1c1N0YXRlLnBoYXNlID09PSAnYnJlYWsnO1xuICBjb25zdCBpc1J1bm5pbmcgPSBmb2N1c1N0YXRlLnN0YXR1cyA9PT0gJ3J1bm5pbmcnO1xuICBjb25zdCBkdXJhdGlvbiA9IGZvY3VzU3RhdGUuZHVyYXRpb25TZWNvbmRzIHx8IChpc0JyZWFrID8gMzAwIDogMTUwMCk7XG4gIGNvbnN0IHByb2dyZXNzUGVyY2VudCA9IE1hdGgubWluKDEwMCwgTWF0aC5tYXgoMCwgKChkdXJhdGlvbiAtIGxvY2FsUmVtYWluaW5nKSAvIGR1cmF0aW9uKSAqIDEwMCkpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC00IG1pbi13LTAgdy1mdWxsXCI+XG4gICAgICB7LyogSGlkZGVuIEF1ZGlvIGVsZW1lbnQgZm9yIGFtYmllbnQgc291bmR0cmFjayAqL31cbiAgICAgIHtuaGFjVXJsICYmIChcbiAgICAgICAgPGF1ZGlvXG4gICAgICAgICAgcmVmPXthdWRpb1JlZn1cbiAgICAgICAgICBzcmM9e25oYWNVcmx9XG4gICAgICAgICAgbG9vcFxuICAgICAgICAgIHByZWxvYWQ9XCJub25lXCJcbiAgICAgICAgICBvbkVuZGVkPXsoKSA9PiBzZXRBdWRpb1BsYXlpbmcoZmFsc2UpfVxuICAgICAgICAgIG9uRXJyb3I9eygpID0+IHNldEF1ZGlvUGxheWluZyhmYWxzZSl9XG4gICAgICAgIC8+XG4gICAgICApfVxuXG4gICAgICB7LyogSGVhZGVyIGJhcjogUHJlc2VuY2UsIEhvc3QgYmFkZ2UsIEZvY3VzIE1vZGUgdG9nZ2xlLCBDbG9zZSBSb29tICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTQgZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMyBzaGFkb3ctbGdcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2BweC0yLjUgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC1bMTBweF0gZm9udC1ib2xkIGJvcmRlciAke3Bob25nLnBoYW1WaSA9PT0gJ3RydW9uZycgPyAnYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTQwMCBib3JkZXItZW1lcmFsZC01MDAvMzAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgIHtwaG9uZy5waGFtVmkgPT09ICd0cnVvbmcnID8gJ1x1RDgzQ1x1REYxMCBUb1x1MDBFMG4gdHJcdTAxQjBcdTFFRERuZycgOiBgXHVEODNEXHVERDEyIExcdTFFREJwICR7cGhvbmcubG9wVGVuIHx8ICcnfWB9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGlkPVwiZm9jdXMtaG9zdC1iYWRnZVwiIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICBDaFx1MUVFNyBwaFx1MDBGMm5nOiA8c3Ryb25nIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtMjAwXCI+e3Bob25nLmNodVBob25nVGVufTwvc3Ryb25nPlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBpZD1cImZvY3VzLXJvb20tcHJlc2VuY2VcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBweC0yLjUgcHktMC41IHJvdW5kZWQtZnVsbCBiZy1bIzAwRjJGRV0vMTAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMjAgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgXHVEODNEXHVEQzY1IHtzb05ndW9pIHx8IDF9IG5nXHUwMUIwXHUxRUREaSBcdTAxMTFhbmcgY1x1MDBGOW5nIHRcdTFFQURwIHRydW5nXG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG1sLWF1dG9cIj5cbiAgICAgICAgICB7aXNGb2N1c01vZGUgJiYgKFxuICAgICAgICAgICAgPHNwYW4gaWQ9XCJmb2N1cy1tb2RlLWFjdGl2ZS1pbmRpY2F0b3JcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1wdXJwbGUtNDAwIGJnLXB1cnBsZS01MDAvMTAgcHgtMiBweS0wLjUgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItcHVycGxlLTUwMC8yMCBhbmltYXRlLXB1bHNlXCI+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REZBRiBcdTAxMTBhbmcgYlx1MUVBRHQgRm9jdXMgTW9kZVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICl9XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtbW9kZS10b2dnbGVcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc0ZvY3VzTW9kZSghaXNGb2N1c01vZGUpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke2lzRm9jdXNNb2RlID8gJ2JnLXB1cnBsZS01MDAvMjAgdGV4dC1wdXJwbGUtMzAwIGJvcmRlci1wdXJwbGUtNTAwLzQwIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgxNjgsODUsMjQ3LDAuMyldJyA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGQUY8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj57aXNGb2N1c01vZGUgPyAnXHUyMUE5IFRob1x1MDBFMXQgRm9jdXMgTW9kZScgOiAnRm9jdXMgTW9kZSd9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAge2NhbkNvbnRyb2wgJiYgcGhvbmcuY2h1UGhvbmdLaG9hICE9PSAnaGUtdGhvbmcnICYmIChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e2RvbmdQaG9uZ0hpZW5UYWl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTUgaG92ZXI6Ymctcm9zZS01MDAvMjUgdGV4dC1yb3NlLTMwMCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgIFx1MDExMFx1MDBGM25nIHBoXHUwMEYybmdcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBNYWluIEZvY3VzIENlbnRlcnBpZWNlIENhcmQgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YHJlbGF0aXZlIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLTN4bCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgcC02IHNtOnAtOCBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciB0ZXh0LWNlbnRlciBzaGFkb3ctMnhsICR7aXNCcmVhayA/ICdiZy1ncmFkaWVudC10by1iIGZyb20tWyMxRTE3MTBdIHRvLVsjMTMxMTBFXSBib3JkZXItYW1iZXItNTAwLzMwJyA6ICdiZy1ncmFkaWVudC10by1iIGZyb20tWyMwRjFFMjhdIHRvLVsjMEExMjE5XSBib3JkZXItWyMwMEYyRkVdLzMwJ31gfT5cbiAgICAgICAgey8qIEdsb3cgYmFja2Ryb3AgYWNjZW50ICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGFic29sdXRlIC10b3AtMjQgLWxlZnQtMjQgdy03MiBoLTcyIHJvdW5kZWQtZnVsbCBibHVyLTN4bCBvcGFjaXR5LTIwIHBvaW50ZXItZXZlbnRzLW5vbmUgJHtpc0JyZWFrID8gJ2JnLWFtYmVyLTUwMCcgOiAnYmctWyMwMEYyRkVdJ31gfSAvPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGFic29sdXRlIC1ib3R0b20tMjQgLXJpZ2h0LTI0IHctNzIgaC03MiByb3VuZGVkLWZ1bGwgYmx1ci0zeGwgb3BhY2l0eS0yMCBwb2ludGVyLWV2ZW50cy1ub25lICR7aXNCcmVhayA/ICdiZy1vcmFuZ2UtNTAwJyA6ICdiZy1pbmRpZ28tNTAwJ31gfSAvPlxuXG4gICAgICAgIHsvKiBQaGFzZSAmIFN0YXR1cyBCYWRnZXMgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0yLjUgbWItNiB6LTEwXCI+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGlkPVwiZm9jdXMtcGhhc2UtYmFkZ2VcIlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTEgcm91bmRlZC1mdWxsIHRleHQteHMgZm9udC1leHRyYWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIGJvcmRlciBzaGFkb3ctc20gJHtpc0JyZWFrID8gJ2JnLWFtYmVyLTUwMC8xNSB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJyA6ICdiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyLVsjMDBGMkZFXS80MCd9YH0+XG4gICAgICAgICAgICB7aXNCcmVhayA/ICdcdTI2MTUgR2lcdTFFREQgTmdoXHUxRUM5IE5nXHUwMUExaSAoQnJlYWspJyA6ICdcdUQ4M0NcdURGNDUgUGhpXHUwMEVBbiBUXHUxRUFEcCBUcnVuZyAoRm9jdXMpJ31cbiAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgaWQ9XCJmb2N1cy1zdGF0dXMtYmFkZ2VcIlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke2lzUnVubmluZyA/ICdiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtNDAwIGJvcmRlci1lbWVyYWxkLTUwMC8zMCcgOiAnYmctc2xhdGUtNTAwLzE1IHRleHQtc2xhdGUtNDAwIGJvcmRlci1zbGF0ZS01MDAvMzAnfWB9PlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdy0yIGgtMiByb3VuZGVkLWZ1bGwgJHtpc1J1bm5pbmcgPyAnYmctZW1lcmFsZC00MDAgYW5pbWF0ZS1wdWxzZScgOiAnYmctc2xhdGUtNDAwJ31gfSAvPlxuICAgICAgICAgICAgPHNwYW4+e2lzUnVubmluZyA/ICdcdTAxMTBhbmcgXHUwMTExXHUxRUJGbScgOiAnVFx1MUVBMW0gZFx1MUVFQm5nJ308L3NwYW4+XG4gICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtcHJlc2V0LXRvZ2dsZVwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGRpc2FibGVkPXshY2FuQ29udHJvbCB8fCBkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGNhbkNvbnRyb2wgJiYgZ3VpTGVuaCgnc2V0X3ByZXNldCcsIHsgcHJlc2V0OiBmb2N1c1N0YXRlLnByZXNldCA9PT0gJzUwXzEwJyA/ICcyNV81JyA6ICc1MF8xMCcgfSl9XG4gICAgICAgICAgICB0aXRsZT17Y2FuQ29udHJvbCA/ICdCXHUxRUE1bSBcdTAxMTFcdTFFQzMgXHUwMTExXHUxRUQ1aSBjaHUga1x1MUVGMyBQb21vZG9ybycgOiAnQ2h1IGtcdTFFRjMgUG9tb2Rvcm8gaGlcdTFFQzduIHRcdTFFQTFpJ31cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LW1vbm8gZm9udC1ib2xkIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke2NhbkNvbnRyb2wgPyAnaG92ZXI6c2NhbGUtMTA1IGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlciBiZy13aGl0ZS8xMCB0ZXh0LXdoaXRlIGJvcmRlci13aGl0ZS8yMCcgOiAnY3Vyc29yLWRlZmF1bHQgYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgXHUyNjk5XHVGRTBGIHtmb2N1c1N0YXRlLnByZXNldCA9PT0gJzUwXzEwJyA/ICc1MCAvIDEwIHBoXHUwMEZBdCcgOiAnMjUgLyA1IHBoXHUwMEZBdCd9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBNYXNzaXZlIFRpbWVyIERpc3BsYXkgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXktMiBzbTpteS00IHotMTBcIj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgaWQ9XCJmb2N1cy10aW1lci1kaXNwbGF5XCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGZvbnQtbW9ubyB0ZXh0LTZ4bCBzbTp0ZXh0LTh4bCBmb250LWJsYWNrIHRyYWNraW5nLXdpZGVzdCBibG9jayB0cmFuc2l0aW9uLWFsbCBzZWxlY3Qtbm9uZSAke2lzQnJlYWsgPyAndGV4dC1hbWJlci0zMDAgZHJvcC1zaGFkb3ctWzBfMF8zNXB4X3JnYmEoMjQ1LDE1OCwxMSwwLjM1KV0nIDogJ3RleHQtWyMwMEYyRkVdIGRyb3Atc2hhZG93LVswXzBfMzVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0nfWB9PlxuICAgICAgICAgICAge2RpbmhEYW5nR2lheVBodXQobG9jYWxSZW1haW5pbmcpfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIFByb2dyZXNzIGJhciAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgbWF4LXctbWQgaC0yIGJnLWJsYWNrLzQwIHJvdW5kZWQtZnVsbCBvdmVyZmxvdy1oaWRkZW4gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBteS00IHotMTBcIj5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BoLWZ1bGwgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMTAwMCAke2lzQnJlYWsgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1vcmFuZ2UtNTAwJyA6ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjM0I4MkY2XSd9YH1cbiAgICAgICAgICAgIHN0eWxlPXt7IHdpZHRoOiBgJHtwcm9ncmVzc1BlcmNlbnR9JWAgfX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogQ29udHJvbCBCdXR0b25zIGZvciBIb3N0L1RlYWNoZXIgKi99XG4gICAgICAgIHtjYW5Db250cm9sID8gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0zIG10LTQgei0xMFwiPlxuICAgICAgICAgICAgeyFpc1J1bm5pbmcgPyAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1zdGFydFwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3N0YXJ0Jyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNiBweS0zIHJvdW5kZWQtMnhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1lbWVyYWxkLTQwMCB0by10ZWFsLTUwMCBob3Zlcjpmcm9tLWVtZXJhbGQtMzAwIGhvdmVyOnRvLXRlYWwtNDAwIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXNtIHNoYWRvdy1bMF8wXzIwcHhfcmdiYSg1MiwyMTEsMTUzLDAuMyldIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyNUI2PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPkJcdTFFQUZ0IFx1MDExMVx1MUVBN3U8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXBhdXNlXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgncGF1c2UnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC02IHB5LTMgcm91bmRlZC0yeGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1vcmFuZ2UtNTAwIGhvdmVyOmZyb20tYW1iZXItMzAwIGhvdmVyOnRvLW9yYW5nZS00MDAgdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQtc20gc2hhZG93LVswXzBfMjBweF9yZ2JhKDI1MSwxOTEsMzYsMC4zKV0gYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTIzRjg8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+VFx1MUVBMW0gZFx1MUVFQm5nPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtcmVzZXRcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdyZXNldCcpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTMgcm91bmRlZC0yeGwgYmctd2hpdGUvMTAgaG92ZXI6Ymctd2hpdGUvMTUgdGV4dC1zbGF0ZS0yMDAgdGV4dC1zbSBmb250LWJvbGQgYm9yZGVyIGJvcmRlci13aGl0ZS8xNSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwNDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+XHUwMTEwXHUxRUI3dCBsXHUxRUExaTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICB7aXNCcmVhayA/IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXN0YXJ0LWZvY3VzXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgnc3RhcnRfZm9jdXMnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTMgcm91bmRlZC0yeGwgYmctWyMwMEYyRkVdLzIwIGhvdmVyOmJnLVsjMDBGMkZFXS8zMCB0ZXh0LVsjMDBGMkZFXSB0ZXh0LXNtIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkFGPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlZcdTAwRTBvIFRcdTFFQURwIHRydW5nPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1zdGFydC1icmVha1wiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3N0YXJ0X2JyZWFrJyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0zIHJvdW5kZWQtMnhsIGJnLWFtYmVyLTUwMC8yMCBob3ZlcjpiZy1hbWJlci01MDAvMzAgdGV4dC1hbWJlci0zMDAgdGV4dC1zbSBmb250LWJvbGQgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvNDAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjYxNTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5OZ2hcdTFFQzkgbmdcdTAxQTFpPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBtdC0zIHotMTBcIj5cbiAgICAgICAgICAgIFx1MjNGMyBcdTAxMTBcdTFFRDNuZyBoXHUxRUQzIFBvbW9kb3JvIGRvIGNoXHUxRUU3IHBoXHUwMEYybmcgXHUwMTExaVx1MUVDMXUgcGhcdTFFRDFpIFx1MjAxNCBoXHUwMEUzeSB0XHUxRUFEcCB0cnVuZyBoXHUxRUJGdCBtXHUwMEVDbmggdlx1MDBFMG8gY1x1MDBGNG5nIHZpXHUxRUM3Yy9oXHUxRUNEYyB0XHUxRUFEcCBuaFx1MDBFOSFcbiAgICAgICAgICA8L3A+XG4gICAgICAgICl9XG5cbiAgICAgICAge2xvaSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtcm9zZS00MDAgbXQtNCB6LTEwXCI+e2xvaX08L3A+fVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBBbWJpZW50IEF1ZGlvIFBsYXllciBDYXJkICovfVxuICAgICAge25oYWNVcmwgPyAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC00IHNtOnAtNSBmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTQgc2hhZG93LXhsXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMy41IG1pbi13LTAgdy1mdWxsIHNtOnctYXV0b1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2B3LTEyIGgtMTIgcm91bmRlZC0yeGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC14bCBzaHJpbmstMCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHthdWRpb1BsYXlpbmcgPyAnYmctWyM4QjVDRjZdLzIwIHRleHQtWyM4QjVDRjZdIGJvcmRlci1bIzhCNUNGNl0vNDAgc2hhZG93LVswXzBfMTVweF9yZ2JhKDEzOSw5MiwyNDYsMC4zKV0gYW5pbWF0ZS1wdWxzZScgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGQTdcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4tdy0wXCI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtd2hpdGUgdHJ1bmNhdGVcIj5cdTAwQzJtIHRoYW5oIG5cdTFFQzFuIEFtYmllbnQ8L3A+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAge2F1ZGlvUGxheWluZyA/ICdcdTAxMTBhbmcgcGhcdTAwRTF0IGtoXHUwMEY0bmcgZ2lhbiBoXHUxRUNEYyB0XHUxRUFEcCcgOiAnXHUwMEMybSB0aGFuaCBjXHUxRUU1YyBiXHUxRUQ5IHRoZW8gdGhpXHUxRUJGdCBiXHUxRUNCJ31cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBnYXAtMyB3LWZ1bGwgc206dy1hdXRvIGp1c3RpZnktZW5kXCI+XG4gICAgICAgICAgICB7IWhhc0ludGVyYWN0ZWRBdWRpbyAmJiAhYXVkaW9QbGF5aW5nICYmIChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLXN0YXJ0LWZvY3VzLWF1ZGlvXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXtiYXRBbVRoYW5ofVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMiByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzhCNUNGNl0gdG8tWyM2MzY2RjFdIHRleHQtd2hpdGUgdGV4dC14cyBmb250LWJvbGQgc2hhZG93LWxnIGhvdmVyOm9wYWNpdHktOTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDBBPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPkJcdTFFQUR0IFx1MDBFMm0gdGhhbmggdFx1MUVBRHAgdHJ1bmc8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImZvY3VzLWF1ZGlvLXRvZ2dsZVwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVBdWRpb1BsYXl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMS41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHthdWRpb1BsYXlpbmcgPyAnYmctWyM4QjVDRjZdLzIwIHRleHQtWyM4QjVDRjZdIGJvcmRlci1bIzhCNUNGNl0vNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAgPHNwYW4+e2F1ZGlvUGxheWluZyA/ICdcdTIzRjggVFx1MUVBMW0gZFx1MUVFQm5nJyA6ICdcdTI1QjYgUGhcdTAwRTF0IHRpXHUxRUJGcCd9PC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e3RvZ2dsZUF1ZGlvTXV0ZX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0yIHJvdW5kZWQteGwgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQteHMgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAge2F1ZGlvTXV0ZWQgfHwgYXVkaW9Wb2x1bWUgPT09IDAgPyAnXHVEODNEXHVERDA3JyA6ICdcdUQ4M0RcdUREMDknfVxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICB0eXBlPVwicmFuZ2VcIlxuICAgICAgICAgICAgICBtaW49XCIwXCJcbiAgICAgICAgICAgICAgbWF4PVwiMVwiXG4gICAgICAgICAgICAgIHN0ZXA9XCIwLjA1XCJcbiAgICAgICAgICAgICAgdmFsdWU9e2F1ZGlvTXV0ZWQgPyAwIDogYXVkaW9Wb2x1bWV9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVWb2x1bWVDaGFuZ2V9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMjQgaC0xLjUgYmctd2hpdGUvMTAgcm91bmRlZC1sZyBhcHBlYXJhbmNlLW5vbmUgY3Vyc29yLXBvaW50ZXIgYWNjZW50LVsjOEI1Q0Y2XVwiXG4gICAgICAgICAgICAgIHRpdGxlPVwiXHUwMEMybSBsXHUwMUIwXHUxRUUzbmcgbmhcdTFFQTFjIG5cdTFFQzFuXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKSA6IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQtMnhsIHAtNCB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwXCI+XG4gICAgICAgICAgICBcdTI2MTUgUGhcdTAwRjJuZyBcdTFFREYgY2hcdTFFQkYgXHUwMTExXHUxRUQ5IHRcdTAxMjluaCBsXHUxRUI3bmcgKGNoXHUwMUIwYSBnXHUxRUFGbiBsaW5rIFx1MDBFMm0gdGhhbmggblx1MUVDMW4pIFx1MjAxNCBDaHV5XHUwMEVBbiB0XHUwMEUybSB0XHUxRUQxaSBcdTAxMTFhIHZcdTAwRTBvIGJcdTAwRTBpIHZcdTFFREYuXG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHtwaG9uZy5tb1RhICYmIChcbiAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgcHgtMiBsZWFkaW5nLXJlbGF4ZWRcIj5cbiAgICAgICAgICB7cGhvbmcubW9UYX1cbiAgICAgICAgPC9wPlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICJBQUFBLE1BQU0sRUFBRSxVQUFVLFdBQVcsT0FBTyxJQUFJO0FBQ3hDLFNBQVMsa0JBQWtCLGVBQWUsV0FBVyxtQkFBbUIscUJBQXFCLGtCQUFrQjtBQUsvRyxNQUFNLGFBQWEsQ0FBQyxPQUFPLE1BQU07QUFBRSxNQUFJLFNBQVMsb0JBQW9CLFVBQVcsSUFBRztBQUFHO0FBSTlFLGdCQUFTLFdBQVcsRUFBRSxPQUFPLFVBQVUsR0FBRztBQUMvQyxRQUFNLENBQUMsR0FBRyxJQUFJLElBQUksTUFBTSxTQUFTLEVBQUU7QUFDbkMsUUFBTSxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVM7QUFDN0IsU0FDRSxvQ0FBQyxTQUFJLFdBQVUsK0JBQ2I7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLElBQUc7QUFBQSxNQUNILE1BQUs7QUFBQSxNQUNMLE9BQU87QUFBQSxNQUNQLFVBQVUsT0FBSyxLQUFLLEVBQUUsT0FBTyxLQUFLO0FBQUEsTUFDbEMsV0FBVyxPQUFLO0FBQUUsWUFBSSxFQUFFLFFBQVEsV0FBVyxJQUFJO0FBQUUsWUFBRSxlQUFlO0FBQUcsZ0JBQU0sRUFBRSxLQUFLLENBQUM7QUFBRyxlQUFLLEVBQUU7QUFBQSxRQUFHO0FBQUEsTUFBRTtBQUFBLE1BQ2xHLGFBQVk7QUFBQSxNQUNaLFdBQVU7QUFBQTtBQUFBLEVBQ1osR0FDQTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQU8sTUFBSztBQUFBLE1BQVMsSUFBRztBQUFBLE1BQXFCLFVBQVUsQ0FBQztBQUFBLE1BQ3ZELFNBQVMsTUFBTTtBQUFFLGtC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
