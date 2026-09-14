// GEN TU src/features/study.jsx — KHONG SUA TAY
const { useState, useEffect, useRef } = React;
import { dinhDangGiayPhut, giuNguyenViTriCuon, idGoogleDrive, idYoutube, laVideoTrucTiepFe, napYouTubeIframeApi, urlMediaFe } from "../lib/helpers.js";
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
  layoutRatio = "6:4",
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
  const [isLiveWithHost, setIsLiveWithHost] = useState(true);
  const isLiveWithHostRef = useRef(true);
  const [viewerIsPaused, setViewerIsPaused] = useState(false);
  const isProgrammaticActionRef = useRef(false);
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
      isLiveWithHostRef.current = true;
      setIsLiveWithHost(true);
      setViewerIsPaused(false);
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
  const lastAppliedRevisionRef = useRef(null);
  const lastHostTrackTimeRef = useRef({ time: 0, stamp: Date.now() });
  const watchStateRef = useRef(watchState);
  watchStateRef.current = watchState;
  const dangGuiLenhRef = useRef(dangGuiLenh);
  dangGuiLenhRef.current = dangGuiLenh;
  const guiLenhRef = useRef(null);
  const getHostCurrentPos = () => {
    const st = watchStateRef.current || watchState;
    const nowMs = Date.now();
    const updateTimeMs = st?.updatedAt ? (/* @__PURE__ */ new Date(String(st.updatedAt).replace(" ", "T") + (String(st.updatedAt).includes("T") ? "" : "Z"))).getTime() : nowMs;
    const elapsedSec = Math.max(0, (nowMs - updateTimeMs) / 1e3);
    let targetPos = Number(st?.positionSeconds || 0);
    if (st?.playing) {
      targetPos = Number(st.basePositionSeconds != null ? st.basePositionSeconds : st.positionSeconds) + elapsedSec * (st.playbackRate || 1);
    }
    return Math.max(0, Number(targetPos.toFixed(2)));
  };
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
      const pState = data.event === "onStateChange" ? typeof data.info === "number" ? data.info : data.info?.playerState : data.event === "infoDelivery" ? data.info?.playerState : void 0;
      if (canControl && !dangGuiLenhRef.current && !isSeekingRef.current) {
        const curTime = !isNaN(cur) && cur >= 0 ? cur : void 0;
        if (pState === 1 && !watchStateRef.current.playing) {
          console.log("V\xF9ng 2: Ch\u1EE7 ph\xF2ng b\u1EA5m Play tr\xEAn YouTube -> \u0111\u1ED3ng b\u1ED9 c\u1EA3 ph\xF2ng");
          guiLenhRef.current?.("play", curTime);
        } else if (pState === 2 && watchStateRef.current.playing) {
          console.log("V\xF9ng 2: Ch\u1EE7 ph\xF2ng b\u1EA5m Pause tr\xEAn YouTube -> \u0111\u1ED3ng b\u1ED9 c\u1EA3 ph\xF2ng");
          guiLenhRef.current?.("pause", curTime);
        }
        if (!isNaN(cur) && cur >= 0) {
          const now = Date.now();
          const prev = lastHostTrackTimeRef.current;
          const dt = Math.max(0, (now - prev.stamp) / 1e3);
          const expected = watchStateRef.current.playing ? prev.time + dt : prev.time;
          const delta = Math.abs(cur - expected);
          if (dt > 0.25 && dt < 4 && delta > 1.8) {
            console.log(`V\xF9ng 2: Ch\u1EE7 ph\xF2ng tua tr\xEAn thanh \u0111\u1ECF YouTube (${cur.toFixed(1)}s, l\u1EC7ch ${delta.toFixed(1)}s) -> \u0111\u1ED3ng b\u1ED9 c\u1EA3 ph\xF2ng`);
            lastHostTrackTimeRef.current = { time: cur, stamp: now };
            guiLenhRef.current?.("seek", cur);
          } else if (dt >= 0.5) {
            lastHostTrackTimeRef.current = { time: cur, stamp: now };
          }
        }
      } else if (!canControl && !isProgrammaticActionRef.current) {
        if (pState === 2 && watchStateRef.current.playing) {
          console.log("onMsg: Ng\u01B0\u1EDDi xem t\u1EF1 b\u1EA5m T\u1EA1m d\u1EEBng tr\xEAn YouTube -> chuy\u1EC3n sang xem ri\xEAng");
          isLiveWithHostRef.current = false;
          setIsLiveWithHost(false);
          setViewerIsPaused(true);
        } else if (pState === 1) {
          setViewerIsPaused(false);
        }
        if (isLiveWithHostRef.current && !isNaN(cur) && cur >= 0) {
          const hostPos = getHostCurrentPos();
          const drift = Math.abs(cur - hostPos);
          if (drift > 3.5) {
            console.log(`onMsg: Ng\u01B0\u1EDDi xem t\u1EF1 tua l\u1EC7ch kh\u1ECFi ch\u1EE7 ph\xF2ng (${drift.toFixed(1)}s) -> chuy\u1EC3n sang xem ri\xEAng`);
            isLiveWithHostRef.current = false;
            setIsLiveWithHost(false);
          }
        }
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
              if (canControl && !dangGuiLenhRef.current && !isSeekingRef.current) {
                const curPos = typeof event.target?.getCurrentTime === "function" ? event.target.getCurrentTime() : void 0;
                if (event.data === 1 && !watchStateRef.current.playing) {
                  console.log("YT Player onStateChange === 1 -> \u0111\u1ED3ng b\u1ED9 Play c\u1EA3 ph\xF2ng");
                  guiLenhRef.current?.("play", curPos);
                } else if (event.data === 2 && watchStateRef.current.playing) {
                  console.log("YT Player onStateChange === 2 -> \u0111\u1ED3ng b\u1ED9 Pause c\u1EA3 ph\xF2ng");
                  guiLenhRef.current?.("pause", curPos);
                }
              } else if (!canControl && !isProgrammaticActionRef.current) {
                if (event.data === 2 && watchStateRef.current.playing) {
                  console.log("YT Player onStateChange === 2: Ng\u01B0\u1EDDi xem t\u1EA1m d\u1EEBng YouTube -> chuy\u1EC3n sang xem ri\xEAng");
                  isLiveWithHostRef.current = false;
                  setIsLiveWithHost(false);
                  setViewerIsPaused(true);
                } else if (event.data === 1) {
                  setViewerIsPaused(false);
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
    if (!isLiveWithHostRef.current) {
      return;
    }
    const isNewRevision = lastAppliedRevisionRef.current !== null && st.revision !== lastAppliedRevisionRef.current;
    if (lastAppliedRevisionRef.current === null) {
      lastAppliedRevisionRef.current = st.revision;
    }
    if (prov === "NATIVE_HTML5" && videoRef.current) {
      const v = videoRef.current;
      if (!hasSeekedInitRef.current && targetPos > 0) {
        hasSeekedInitRef.current = true;
        v.currentTime = targetPos;
      }
      if (isNewRevision) {
        lastAppliedRevisionRef.current = st.revision;
        if (st.playing) {
          v.currentTime = targetPos;
          if (hasInteracted || hasInteractedRef.current) v.play().catch(() => {
          });
          setLocalTime(Math.floor(targetPos));
        } else {
          v.pause();
          v.currentTime = Number(st.positionSeconds || 0);
          setLocalTime(Math.floor(Number(st.positionSeconds || 0)));
        }
        return;
      }
      setLocalTime(Math.max(0, Math.floor(targetPos)));
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
      if (isNewRevision) {
        lastAppliedRevisionRef.current = st.revision;
        if (!st.playing) {
          if (p?.pauseVideo) {
            try {
              p.pauseVideo();
            } catch {
            }
          }
          ifr?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
          const pSec = Number(st.positionSeconds || 0);
          if (p?.seekTo) {
            try {
              p.seekTo(pSec, true);
            } catch {
            }
          }
          ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [pSec, true] }), "*");
          setLocalTime(Math.floor(pSec));
        } else {
          if (p?.seekTo) {
            try {
              p.seekTo(targetPos, true);
            } catch {
            }
          }
          ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [targetPos, true] }), "*");
          if (hasInteracted || hasInteractedRef.current) {
            if (p?.playVideo) {
              try {
                p.playVideo();
              } catch {
              }
            }
            ifr?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
          }
          setLocalTime(Math.floor(targetPos));
        }
        return;
      }
      setLocalTime(Math.max(0, Math.floor(targetPos)));
      if (cur !== null && !isNaN(cur)) {
        const drift = Math.abs(cur - targetPos);
        if (st.playing) {
          if (drift > 3.5) {
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
          if (ps === 1 || ps === 3) {
            if (p?.pauseVideo) {
              try {
                p.pauseVideo();
              } catch {
              }
            }
            ifr?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
          }
          if (drift > 1.8) {
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
        if (st.playing && (hasInteracted || hasInteractedRef.current) && ps !== 1) {
          if (p?.playVideo) {
            try {
              p.playVideo();
            } catch {
            }
          }
          ifr?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
        } else if (!st.playing) {
          if (p?.pauseVideo) {
            try {
              p.pauseVideo();
            } catch {
            }
          }
          ifr?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
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
            isLiveWithHostRef.current = true;
            setIsLiveWithHost(true);
            setViewerIsPaused(false);
          }
          apDungDongBo(d.state, Boolean(d.canControl), d.provider || "UNSUPPORTED");
        }
      } catch {
      }
    };
    fetchWatch();
    const timer = setInterval(khiHienThi(fetchWatch), 1200);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [phong.id, hasInteracted]);
  useEffect(() => {
    const isPlaying = canControl ? watchState.playing : isLiveWithHost ? watchState.playing : !viewerIsPaused;
    if (!isPlaying) return;
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
      } else if (provider === "NATIVE_HTML5" && videoRef.current) {
        const cur = videoRef.current.currentTime;
        if (!isNaN(cur)) {
          curTime = cur;
          setLocalTime(Math.floor(cur));
        }
      }
      const maxDur = durationRef.current || duration;
      const currentPos = curTime !== null ? curTime : localTime;
      if (canControl && maxDur > 5 && (currentPos >= maxDur - 1.2 || localTime >= maxDur)) {
        if (!isSkippingRef.current && !hasTriggeredSkipRef.current) {
          console.log(`Positional Watchdog: currentPos (${currentPos.toFixed(1)}s) >= duration (${maxDur}s) -> t\u1EF1 \u0111\u1ED9ng chuy\u1EC3n ti\u1EBFp`);
          hanhDongQueue("skip");
          return;
        }
      }
      if (canControl && curTime !== null && curTime > 0 && !dangGuiLenhRef.current && !isSeekingRef.current) {
        const nowMs = Date.now();
        if (!lastHostSyncTimeRef.current) lastHostSyncTimeRef.current = nowMs;
        const updateTimeMs = watchState.updatedAt ? (/* @__PURE__ */ new Date(String(watchState.updatedAt).replace(" ", "T") + (String(watchState.updatedAt).includes("T") ? "" : "Z"))).getTime() : nowMs;
        const elapsedSec = Math.max(0, (nowMs - updateTimeMs) / 1e3);
        const expectedServerPos = Number(watchState.basePositionSeconds != null ? watchState.basePositionSeconds : watchState.positionSeconds) + elapsedSec * (watchState.playbackRate || 1);
        const hostDrift = Math.abs(curTime - expectedServerPos);
        if (hostDrift > 3 && nowMs - lastHostSyncTimeRef.current > 4e3) {
          lastHostSyncTimeRef.current = nowMs;
          guiLenh("seek", curTime);
        }
      }
      if (curTime === null) {
        setLocalTime((t) => maxDur > 0 ? Math.min(t + 1, Math.floor(maxDur)) : t + 1);
      }
    }, 1e3);
    return () => clearInterval(tick);
  }, [watchState.playing, viewerIsPaused, isLiveWithHost, provider, duration, localTime, canControl]);
  const guiLenh = async (action, customPos) => {
    if (dangGuiLenhRef.current) return;
    setDangGuiLenh(true);
    dangGuiLenhRef.current = true;
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
        lastAppliedRevisionRef.current = d.state.revision;
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
      dangGuiLenhRef.current = false;
    }
  };
  guiLenhRef.current = guiLenh;
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
      } else {
        isLiveWithHostRef.current = false;
        setIsLiveWithHost(false);
      }
    };
    window.addEventListener("sr-seek", onSeekReq);
    return () => window.removeEventListener("sr-seek", onSeekReq);
  }, [phong?.id, canControl, provider, watchState?.revision]);
  const handleStartViewing = () => {
    hasInteractedRef.current = true;
    setHasInteracted(true);
    isLiveWithHostRef.current = true;
    setIsLiveWithHost(true);
    setViewerIsPaused(false);
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
  const handleGoLive = () => {
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      setHasInteracted(true);
    }
    isProgrammaticActionRef.current = true;
    const targetPos = getHostCurrentPos();
    setLocalTime(Math.floor(targetPos));
    isLiveWithHostRef.current = true;
    setIsLiveWithHost(true);
    setViewerIsPaused(!watchState.playing);
    lastAppliedRevisionRef.current = watchState.revision;
    if (provider === "NATIVE_HTML5" && videoRef.current) {
      videoRef.current.currentTime = targetPos;
      if (watchState.playing) {
        videoRef.current.play().catch(() => {
        });
      } else {
        videoRef.current.pause();
      }
    } else if (provider === "YOUTUBE") {
      if (ytPlayerRef.current?.seekTo) {
        try {
          ytPlayerRef.current.seekTo(targetPos, true);
        } catch {
        }
      }
      const ifr = document.getElementById(ytContainerId);
      ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [targetPos, true] }), "*");
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
    setTimeout(() => {
      isProgrammaticActionRef.current = false;
    }, 800);
  };
  const handleViewerTogglePlay = () => {
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      setHasInteracted(true);
    }
    if (viewerIsPaused) {
      setViewerIsPaused(false);
      if (provider === "NATIVE_HTML5" && videoRef.current) {
        videoRef.current.play().catch(() => {
        });
      } else if (provider === "YOUTUBE") {
        if (ytPlayerRef.current?.playVideo) {
          try {
            ytPlayerRef.current.playVideo();
          } catch {
          }
        }
        const ifr = document.getElementById(ytContainerId);
        ifr?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
      }
    } else {
      setViewerIsPaused(true);
      isLiveWithHostRef.current = false;
      setIsLiveWithHost(false);
      if (provider === "NATIVE_HTML5" && videoRef.current) {
        videoRef.current.pause();
      } else if (provider === "YOUTUBE") {
        if (ytPlayerRef.current?.pauseVideo) {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch {
          }
        }
        const ifr = document.getElementById(ytContainerId);
        ifr?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
      }
    }
  };
  const handleViewerSeek = (sec) => {
    isSeekingRef.current = false;
    setLocalTime(sec);
    isLiveWithHostRef.current = false;
    setIsLiveWithHost(false);
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
  };
  return /* @__PURE__ */ React.createElement("div", { className: `flex flex-col min-w-0 w-full ${isRoomWide ? "h-full flex-1 min-h-0 items-center justify-center" : "gap-4"}` }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: isRoomWide && layoutRatio === "10:0" ? {
        maxHeight: "calc(100vh - 76px)",
        maxWidth: "calc((100vh - 76px) * 16 / 9)",
        aspectRatio: "16 / 9",
        width: "100%",
        height: "auto",
        margin: "0 auto"
      } : isRoomWide ? {
        maxHeight: "calc(100vh - 84px)",
        aspectRatio: "16 / 9",
        width: "100%",
        height: "auto",
        margin: "0 auto"
      } : void 0,
      className: "relative w-full aspect-video bg-gradient-to-b from-[#05070b] to-black rounded-2xl overflow-hidden border border-[#00F2FE]/15 ring-1 ring-white/5 shadow-[0_0_60px_rgba(0,242,254,0.07),0_30px_60px_-15px_rgba(0,0,0,0.7)]"
    },
    !hasInteracted && !canControl && (provider === "YOUTUBE" || provider === "NATIVE_HTML5") && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 z-20 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "w-14 h-14 rounded-full bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40 flex items-center justify-center text-2xl mb-3 shadow-[0_0_25px_rgba(0,242,254,0.35)] animate-pulse" }, "\u{1F3AC}"), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-black text-white mb-1" }, "Xem Chung C\xF9ng Ph\xF2ng"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-300 max-w-xs mb-4" }, "B\u1EA5m n\xFAt b\xEAn d\u01B0\u1EDBi \u0111\u1EC3 c\u1EA5p quy\u1EC1n \xE2m thanh v\xE0 c\xF9ng theo d\xF5i timeline v\u1EDBi ch\u1EE7 ph\xF2ng."), /* @__PURE__ */ React.createElement(
      "button",
      {
        id: "btn-viewer-start-watch",
        type: "button",
        onClick: handleStartViewing,
        className: "px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#3B82F6] text-black font-black text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u25B6"),
      /* @__PURE__ */ React.createElement("span", null, "B\u1EAFt \u0111\u1EA7u xem c\xF9ng ph\xF2ng")
    )),
    provider !== "UNSUPPORTED" && /* @__PURE__ */ React.createElement("div", { className: "absolute top-3.5 right-3.5 z-10 pointer-events-auto flex items-center gap-2" }, canControl ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-[#00F2FE]/30 text-[#00F2FE] text-xs font-black shadow-lg" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-[#00F2FE] animate-pulse" }), /* @__PURE__ */ React.createElement("span", null, "CH\u1EE6 PH\xD2NG TR\u1EF0C TI\u1EBEP")) : isLiveWithHost ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-rose-500/40 text-rose-400 text-xs font-black shadow-lg" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-rose-500 animate-pulse" }), /* @__PURE__ */ React.createElement("span", null, "TR\u1EF0C TI\u1EBEP")) : /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        id: "btn-viewer-go-live-float",
        onClick: handleGoLive,
        className: "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-[0_0_20px_rgba(244,63,94,0.7)] animate-pulse cursor-pointer active:scale-95 transition-all",
        title: "B\u1EA5m \u0111\u1EC3 chuy\u1EC3n \u0111\u1EBFn video tr\u1EF1c ti\u1EBFp \u0111ang ph\xE1t c\u1EE7a ch\u1EE7 ph\xF2ng"
      },
      /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-white animate-ping" }),
      /* @__PURE__ */ React.createElement("span", null, "\u{1F534} Xem c\xF9ng ch\u1EE7 ph\xF2ng ", (() => {
        const hPos = getHostCurrentPos();
        const d = Math.round(hPos - localTime);
        return d > 2 ? `(-${d > 60 ? dinhDangGiayPhut(d) : d + "s"})` : "";
      })())
    )),
    ytId ? /* @__PURE__ */ React.createElement("div", { key: `yt-wrap-${phong.id}`, className: "w-full h-full relative flex items-center justify-center bg-black" }, /* @__PURE__ */ React.createElement(
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
        controls: true,
        className: "w-full h-full object-contain",
        onLoadedMetadata: (e) => {
          if (e.target.duration > 0) setDuration(e.target.duration);
        },
        onPlay: () => {
          if (canControl && !watchState.playing && !dangGuiLenh) {
            guiLenh("play", videoRef.current?.currentTime);
          } else if (!canControl && !isProgrammaticActionRef.current) {
            setViewerIsPaused(false);
          }
        },
        onPause: () => {
          if (canControl && watchState.playing && !dangGuiLenh) {
            guiLenh("pause", videoRef.current?.currentTime);
          } else if (!canControl && !isProgrammaticActionRef.current && watchStateRef.current.playing) {
            isLiveWithHostRef.current = false;
            setIsLiveWithHost(false);
            setViewerIsPaused(true);
          }
        },
        onEnded: () => {
          if (canControl) hanhDongQueue("skip");
        },
        onSeeked: () => {
          if (isProgrammaticActionRef.current) return;
          if (canControl) {
            if (dangGuiLenh || isSeekingRef.current) return;
            const cur = videoRef.current?.currentTime;
            if (cur === void 0) return;
            const st = watchState;
            const updMs = st?.updatedAt ? (/* @__PURE__ */ new Date(String(st.updatedAt).replace(" ", "T") + (String(st.updatedAt).includes("T") ? "" : "Z"))).getTime() : Date.now();
            const elapsed = Math.max(0, (Date.now() - updMs) / 1e3);
            const kyVong = st?.playing ? Number(st.basePositionSeconds || 0) + elapsed * (st.playbackRate || 1) : Number(st?.positionSeconds || 0);
            if (Math.abs(cur - kyVong) > 1.5) guiLenh("seek", cur);
          } else {
            const cur = videoRef.current?.currentTime || 0;
            setLocalTime(Math.floor(cur));
            const hostPos = getHostCurrentPos();
            if (Math.abs(cur - hostPos) > 3) {
              isLiveWithHostRef.current = false;
              setIsLiveWithHost(false);
            }
          }
        }
      }
    ) : /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center h-full text-xs text-slate-500 p-6 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl mb-2" }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "Link video kh\xF4ng h\u1ED7 tr\u1EE3 ph\xE1t tr\u1EF1c ti\u1EBFp ho\u1EB7c kh\xF4ng h\u1EE3p l\u1EC7."))
  ), drvId && /* @__PURE__ */ React.createElement("div", { className: "px-3.5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-300" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm" }, "\u2139\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "Google Drive ph\xE1t \u1EDF ch\u1EBF \u0111\u1ED9 ", /* @__PURE__ */ React.createElement("strong", null, "Xem \u0111\u1ED9c l\u1EADp"), " (Google Drive kh\xF4ng h\u1ED7 tr\u1EE3 API \u0111i\u1EC1u khi\u1EC3n t\u1EEB xa).")), !isRoomWide && /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-b from-[#161b26] to-[#0f141d] border border-[#00F2FE]/10 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-3 shadow-xl" }, canControl && (provider === "NATIVE_HTML5" || provider === "YOUTUBE") && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-white/10" }, /* @__PURE__ */ React.createElement(
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
  ), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono text-slate-400 shrink-0" }, duration > 0 ? dinhDangGiayPhut(duration) : "--:--"))), !canControl && (provider === "NATIVE_HTML5" || provider === "YOUTUBE") && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-white/10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 w-full sm:w-auto" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-viewer-watch-toggle",
      type: "button",
      onClick: handleViewerTogglePlay,
      className: `w-full sm:w-auto px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer ${viewerIsPaused ? "bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black shadow-[0_0_15px_rgba(0,242,254,0.35)] hover:brightness-110" : "bg-white/10 text-white border border-white/15 hover:bg-white/15"}`
    },
    /* @__PURE__ */ React.createElement("span", null, viewerIsPaused ? "\u25B6" : "\u23F8"),
    /* @__PURE__ */ React.createElement("span", null, viewerIsPaused ? "Ti\u1EBFp T\u1EE5c Xem" : "T\u1EA1m D\u1EEBng Video")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-viewer-go-live-bar",
      type: "button",
      onClick: handleGoLive,
      className: `w-full sm:w-auto px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer ${isLiveWithHost ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" : "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse hover:brightness-110"}`,
      title: isLiveWithHost ? "\u0110ang xem tr\u1EF1c ti\u1EBFp \u0111\u1ED3ng b\u1ED9 v\u1EDBi ch\u1EE7 ph\xF2ng" : "B\u1EA5m \u0111\u1EC3 nh\u1EA3y t\u1EDBi video \u0111ang ch\u1EA1y c\u1EE7a ch\u1EE7 ph\xF2ng"
    },
    /* @__PURE__ */ React.createElement("span", { className: `w-2 h-2 rounded-full ${isLiveWithHost ? "bg-rose-500 animate-pulse" : "bg-white"}` }),
    /* @__PURE__ */ React.createElement("span", null, isLiveWithHost ? "Tr\u1EF1c Ti\u1EBFp" : `Tr\u1EF1c Ti\u1EBFp ${(() => {
      const hPos = getHostCurrentPos();
      const d = Math.round(hPos - localTime);
      return d > 2 ? `(Ch\u1EADm ${d > 60 ? dinhDangGiayPhut(d) : d + "s"})` : "";
    })()}`)
  )), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex items-center gap-2.5 w-full" }, /* @__PURE__ */ React.createElement("span", { id: "viewer-duration-label", className: "text-[11px] font-mono text-slate-400 shrink-0" }, dinhDangGiayPhut(localTime)), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "viewer-seek-slider",
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
      onMouseUp: (e) => handleViewerSeek(Number(e.target.value)),
      onTouchEnd: (e) => handleViewerSeek(Number(e.target.value)),
      className: "flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00F2FE]"
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono text-slate-400 shrink-0" }, duration > 0 ? dinhDangGiayPhut(duration) : "--:--"))), loi && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-400" }, loi), phong.moTa && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 leading-relaxed pt-1" }, phong.moTa)), !isRoomWide && /* @__PURE__ */ React.createElement("div", { id: "vung1-youtube-studio", style: { overflowAnchor: "none" }, className: "bg-gradient-to-b from-[#161b26] to-[#0f141d] border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 pb-2.5 border-b border-white/10 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-8 h-8 rounded-xl bg-gradient-to-br from-[#00F2FE]/20 to-violet-500/20 text-[#00F2FE] border border-[#00F2FE]/30 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(0,242,254,0.25)]" }, "\u{1F3AC}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "text-xs sm:text-sm font-black text-white flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "C\u1EA5u h\xECnh Video & H\xE0ng \u0111\u1EE3i YouTube"), queueList.filter((q) => q.trangThai === "queued").length > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded-full bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 text-[10px] font-bold" }, queueList.filter((q) => q.trangThai === "queued").length, " \u0111ang ch\u1EDD")), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-400" }, "T\xECm ki\u1EBFm video, \u0111\u01B0a v\xE0o h\xE0ng ch\u1EDD v\xE0 ch\u1EA1y video kh\xE1c \u0111\u1ED3ng b\u1ED9 c\u1EA3 ph\xF2ng"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center bg-[#0B0E14] p-1 rounded-xl border border-white/10" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-media-tab-search",
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        giuNguyenViTriCuon(() => setMediaTab("search"));
      },
      className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${mediaTab === "search" ? "bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black shadow-md" : "text-slate-400 hover:text-white"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F50D}"),
    /* @__PURE__ */ React.createElement("span", null, "T\xECm YouTube")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-media-tab-queue",
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        giuNguyenViTriCuon(() => setMediaTab("queue"));
      },
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
        giuNguyenViTriCuon(() => {
          setDaMoRongStudio((prev) => !prev);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvc3R1ZHkuanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9ID0gUmVhY3Q7XG5pbXBvcnQgeyBkaW5oRGFuZ0dpYXlQaHV0LCBnaXVOZ3V5ZW5WaVRyaUN1b24sIGlkR29vZ2xlRHJpdmUsIGlkWW91dHViZSwgbGFWaWRlb1RydWNUaWVwRmUsIG5hcFlvdVR1YmVJZnJhbWVBcGksIHVybE1lZGlhRmUgfSBmcm9tICcuLi9saWIvaGVscGVycy5qcyc7XG5cbi8vIEJcdTFFQ0YgcXVhIHRpY2sga2hpIHRhYiBcdTAxMTFhbmcgXHUxRURGIE5cdTFFQzBOIFx1MjAxNCB0clx1MDBFMW5oIGNcdTFFRDluZyBkXHUxRUQzbiByZXF1ZXN0IENsb3VkZmxhcmUgdlx1MDBGNCBcdTAwRURjaCBraGkga2hcdTAwRjRuZyBhaSB4ZW0uXG4vLyBLaFx1MDBGNG5nIGRcdTAwRjluZyBjaG8gcG9sbCB0XHUwMEVEbiBoaVx1MUVDN3UgdGhcdTFFRERpIGdpYW4gdGhcdTFFRjFjICh2ZCB2b2ljZSBzaWduYWxpbmcpIHZcdTAwRUMgYlx1MUVDRiBsXHUxRUUxIHRpY2sgY1x1MDBGMyB0aFx1MUVDMyBsXHUwMEUwbSB0cmVvXG4vLyBiXHUxRUFGdCB0YXkga1x1MUVCRnQgblx1MUVEMWkgaG9cdTFFQjdjIHRyXHUxRUM1IHRcdTAwRURuIGhpXHUxRUM3dSBcInJcdTFFRERpIHZvaWNlXCIgY1x1MUVFN2EgbmdcdTAxQjBcdTFFRERpIGtpYS5cbmNvbnN0IGtoaUhpZW5UaGkgPSAoZm4pID0+ICgpID0+IHsgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnKSBmbigpOyB9O1xuXG5cbi8vIFx1MDBENCBuaFx1MUVBRHAgbGluayB0aFx1MDBFQW0gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgXHUyMDE0IGRcdTAwRjluZyBjaHVuZyBjaG8gU3R1ZHlEb2NrIHZcdTAwRTAgQ2FtcHVzV2F0Y2hUb2dldGhlclxuZXhwb3J0IGZ1bmN0aW9uIFF1ZXVlSW5wdXQoeyBvbkFkZCwgb25BZGROZXh0IH0pIHtcbiAgY29uc3QgW3YsIHNldFZdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBvayA9IHYudHJpbSgpLmxlbmd0aCA+IDA7XG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICA8aW5wdXRcbiAgICAgICAgaWQ9XCJpbnB1dC1xdWV1ZS1hZGRcIlxuICAgICAgICB0eXBlPVwidXJsXCJcbiAgICAgICAgdmFsdWU9e3Z9XG4gICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFYoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICBvbktleURvd249e2UgPT4geyBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgb2spIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBvbkFkZCh2LnRyaW0oKSk7IHNldFYoJycpOyB9IH19XG4gICAgICAgIHBsYWNlaG9sZGVyPVwiVGhcdTAwRUFtIGxpbmsgdmlkZW8gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcdTIwMjZcIlxuICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0yLjUgcHktMS41IHRleHQtWzExcHhdIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgIC8+XG4gICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBpZD1cImJ0bi1xdWV1ZS1hZGQtbmV4dFwiIGRpc2FibGVkPXshb2t9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHsgb25BZGROZXh0KHYudHJpbSgpKTsgc2V0VignJyk7IH19XG4gICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy12aW9sZXQtNTAwLzE1IHRleHQtdmlvbGV0LTMwMCBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLXZpb2xldC01MDAvMjUgZGlzYWJsZWQ6b3BhY2l0eS0zMCB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxuICAgICAgICArUGhcdTAwRTF0IGtcdTFFQkZcbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJidG4tcXVldWUtZW5xdWV1ZVwiIGRpc2FibGVkPXshb2t9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHsgb25BZGQodi50cmltKCkpOyBzZXRWKCcnKTsgfX1cbiAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctWyMwMEYyRkVdLzI1IGRpc2FibGVkOm9wYWNpdHktMzAgd2hpdGVzcGFjZS1ub3dyYXBcIj5cbiAgICAgICAgK0N1XHUxRUQxaSBoXHUwMEUwbmdcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgU1RVRFkgRE9DSzogS0hcdTAwRDRORyBHSUFOIENcdTFFRDhORyBUXHUwMEMxQyBQSFx1MDBEMk5HIFlPVVRVQkUgKFBIQVNFIDRGKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBmdW5jdGlvbiBTdHVkeURvY2soeyBwaG9uZywgcGhvbmdNaW5oS2hvYSwgYXV0aCwgcGhvbmdDaGF0ID0gW10sIG9uU2VuZFBob25nQ2hhdCwgb25Yb2FUaW5QaG9uZyxcbiAgbXlDYXBzID0ge30sIGlzU3RhZmYgPSBmYWxzZSwgdmFpVHJvUGhvbmcgPSAnbWVtYmVyJywgdGhhbmhWaWVuID0gW10sXG4gIHBvbGljaWVzID0gbnVsbCwgZ3JhbnRzID0gW10sIHZpZGVvVGltZVJlZiwgc2Vla1ZpZGVvLCBoYW5oRG9uZ1Bob25nLFxuICBjYW5Db250cm9sOiBfY2FuQ29udHJvbCA9IGZhbHNlLCBkb25nUGhvbmdIaWVuVGFpOiBfZG9uZ1Bob25nSGllblRhaSwgaXNSb29tV2lkZSA9IGZhbHNlIH0pIHtcbiAgY29uc3QgW2RvY2tUYWIsIHNldERvY2tUYWJdID0gUmVhY3QudXNlU3RhdGUoJ2NoYXQnKTsgLy8gJ2NoYXQnIHwgJ25vdGVzJyB8ICd3aGl0ZWJvYXJkJyB8ICdzaGVldCcgfCAndm9pY2UnIHwgJ3F1YW4tdHJpJ1xuICBjb25zdCBbc2hvd0Vtb2ppLCBzZXRTaG93RW1vamldID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8vIENhcGFiaWxpdHkgcGhcdTAwRURhIGNsaWVudCBjaFx1MUVDOSBcdTAxMTFcdTFFQzMgXHUxRUE5bi9oaVx1MUVDN24gVUkgXHUyMDE0IG1cdTFFQ0RpIHF1eVx1MUVDMW4gdGhcdTFFQUR0IGRvIHNlcnZlciBxdXlcdTFFQkZ0LlxuICBjb25zdCBjb1F1eWVuID0gKGNhcCkgPT4gbXlDYXBzW2NhcF0gIT09IGZhbHNlO1xuICBjb25zdCBsYXlWaVRyaVZpZGVvID0gKCkgPT4gTWF0aC5mbG9vcih2aWRlb1RpbWVSZWY/LmN1cnJlbnQgfHwgMCkgfHwgbnVsbDtcbiAgLy8gQlx1MUVBNW0gbVx1MUVEMWMgdGhcdTFFRERpIGdpYW4gXHUyMTkyIGdcdTFFRURpIGV2ZW50IGNobyBDYW1wdXNXYXRjaFRvZ2V0aGVyIHhcdTFFRUQgbFx1MDBGRFxuICAvLyAoY1x1MDBGMyB2aWRlb19jb250cm9sIFx1MjE5MiB0dWEgY2h1bmcgY1x1MUVBMyBwaFx1MDBGMm5nOyBraFx1MDBGNG5nIFx1MjE5MiB0dWEgY1x1MUVFNWMgYlx1MUVEOSBwbGF5ZXIgY1x1MUVFN2EgbVx1MDBFQ25oKS5cbiAgY29uc3QgeWV1Q2F1VHVhID0gKHNlYykgPT4ge1xuICAgIGlmIChzZWMgPT0gbnVsbCB8fCAhKHNlYyA+PSAwKSkgcmV0dXJuO1xuICAgIGlmIChzZWVrVmlkZW8pIHsgc2Vla1ZpZGVvKE51bWJlcihzZWMpLCBteUNhcHMudmlkZW9fY29udHJvbCA9PT0gdHJ1ZSk7IHJldHVybjsgfVxuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnc3Itc2VlaycsIHsgZGV0YWlsOiB7IHBob25nSWQ6IHBob25nPy5pZCwgc2VjOiBOdW1iZXIoc2VjKSB9IH0pKTtcbiAgfTtcblxuICAvLyAxLiBSb29tIENoYXQgU3RhdGVcbiAgY29uc3QgW2NoYXRJbnB1dCwgc2V0Q2hhdElucHV0XSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2NoYXRTZW5kaW5nLCBzZXRDaGF0U2VuZGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IGNoYXRDb21wb3NpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBjaGF0RW5kUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgPT09ICdjaGF0JyAmJiBjaGF0RW5kUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHAgPSBjaGF0RW5kUmVmLmN1cnJlbnQucGFyZW50RWxlbWVudDtcbiAgICAgIGlmIChwICYmIHAuc2Nyb2xsSGVpZ2h0ID4gcC5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgcC5zY3JvbGxUbyh7IHRvcDogcC5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtwaG9uZ0NoYXQubGVuZ3RoLCBkb2NrVGFiXSk7XG5cbiAgY29uc3QgaGFuZGxlU2VuZFJvb21DaGF0ID0gKGUpID0+IHtcbiAgICBlPy5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IHR4dCA9IGNoYXRJbnB1dC50cmltKCk7XG4gICAgaWYgKCF0eHQgfHwgY2hhdFNlbmRpbmcpIHJldHVybjtcbiAgICBzZXRDaGF0SW5wdXQoJycpO1xuICAgIHNldENoYXRTZW5kaW5nKHRydWUpO1xuICAgIGlmIChvblNlbmRQaG9uZ0NoYXQpIHtcbiAgICAgIFByb21pc2UucmVzb2x2ZShvblNlbmRQaG9uZ0NoYXQodHh0KSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICBzZXRDaGF0SW5wdXQoY3VyID0+IGN1ciA/IGN1ciA6IHR4dCk7XG4gICAgICB9KS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgc2V0Q2hhdFNlbmRpbmcoZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldENoYXRTZW5kaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gMi4gU2hhcmVkIE5vdGVzIFx1MjAxNCBlbnRyeSBhcHBlbmQgKG1cdTFFRDdpIG5nXHUwMUIwXHUxRUREaSB0aFx1MDBFQW0gZ2hpIGNoXHUwMEZBIHJpXHUwMEVBbmcsIGtoXHUwMEY0bmcgZ2hpIFx1MDExMVx1MDBFOCBuaGF1KVxuICBjb25zdCBbbm90ZXNMaXN0LCBzZXROb3Rlc0xpc3RdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbbm90ZUlucHV0LCBzZXROb3RlSW5wdXRdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbbm90ZVdpdGhUaW1lLCBzZXROb3RlV2l0aFRpbWVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IFtub3Rlc0NhbldyaXRlLCBzZXROb3Rlc0NhbldyaXRlXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBbbm90ZXNOb3RpY2UsIHNldE5vdGVzTm90aWNlXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3Qgbm90ZXNWZXJzaW9uUmVmID0gUmVhY3QudXNlUmVmKDApO1xuICBjb25zdCBub3RlQ29tcG9zaW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAnbm90ZXMnKSByZXR1cm47XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG4gICAgY29uc3QgZmV0Y2hOb3RlcyA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPW5vdGVzYCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2spIHtcbiAgICAgICAgICBzZXROb3Rlc0xpc3QoQXJyYXkuaXNBcnJheShkLnBheWxvYWQ/Lm5vdGVzKSA/IGQucGF5bG9hZC5ub3RlcyA6IFtdKTtcbiAgICAgICAgICBub3Rlc1ZlcnNpb25SZWYuY3VycmVudCA9IGQudmVyc2lvbiB8fCAwO1xuICAgICAgICAgIHNldE5vdGVzQ2FuV3JpdGUoZC5jYW5Xcml0ZSAhPT0gZmFsc2UpO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGl2ZSAmJiBkLmNvZGUgPT09ICdjYXBhYmlsaXR5X29mZicpIHtcbiAgICAgICAgICBzZXROb3Rlc0NhbldyaXRlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7fVxuICAgIH07XG4gICAgZmV0Y2hOb3RlcygpO1xuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaShmZXRjaE5vdGVzKSwgMzAwMCk7XG4gICAgcmV0dXJuICgpID0+IHsgYWN0aXZlID0gZmFsc2U7IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpOyB9O1xuICB9LCBbcGhvbmcuaWQsIGRvY2tUYWJdKTtcblxuICBjb25zdCB0aGVtR2hpQ2h1ID0gYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHRleHQgPSBub3RlSW5wdXQudHJpbSgpO1xuICAgIGlmICghdGV4dCkgcmV0dXJuO1xuICAgIHNldE5vdGVzTm90aWNlKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICByZXNvdXJjZTogJ25vdGVzJyxcbiAgICAgICAgICBwYXlsb2FkOiB7IHRleHQsIHZpZGVvVGltZVNlYzogbm90ZVdpdGhUaW1lID8gbGF5VmlUcmlWaWRlbygpIDogbnVsbCB9XG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHtcbiAgICAgICAgc2V0Tm90ZUlucHV0KCcnKTtcbiAgICAgICAgc2V0Tm90ZXNMaXN0KHByZXYgPT4gWy4uLnByZXYsIHsgaWQ6IGQuaWQsIHRlbjogYXV0aC51c2VyPy50ZW4gfHwgJ0JcdTFFQTFuJywgbm9pRHVuZzogdGV4dCwgdmlkZW9UaW1lU2VjOiBub3RlV2l0aFRpbWUgPyBsYXlWaVRyaVZpZGVvKCkgOiBudWxsLCBjdWFUb2k6IDEgfV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Tm90ZXNOb3RpY2UoZC5sb2kgfHwgJ0toXHUwMEY0bmcgbFx1MDFCMHUgXHUwMTExXHUwMUIwXHUxRUUzYyBnaGkgY2hcdTAwRkEuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IHNldE5vdGVzTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaS4nKTsgfVxuICB9O1xuXG4gIGNvbnN0IHhvYUdoaUNodSA9IGFzeW5jIChpZCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgcmVzb3VyY2U6ICdub3RlcycsIGFjdGlvbjogJ3hvYV9ub3RlJywgaWQgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vaykgc2V0Tm90ZXNMaXN0KHByZXYgPT4gcHJldi5maWx0ZXIobiA9PiBuLmlkICE9PSBpZCkpO1xuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICAvLyAzLiBTaGFyZWQgV2hpdGVib2FyZCBTdGF0ZVxuICBjb25zdCBjYW52YXNSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IFt3YlN0cm9rZXMsIHNldFdiU3Ryb2tlc10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFt3YkNvbG9yLCBzZXRXYkNvbG9yXSA9IFJlYWN0LnVzZVN0YXRlKCcjMDBGMkZFJyk7XG4gIGNvbnN0IFt3YldpZHRoLCBzZXRXYldpZHRoXSA9IFJlYWN0LnVzZVN0YXRlKDMpO1xuICBjb25zdCBbd2JUb29sLCBzZXRXYlRvb2xdID0gUmVhY3QudXNlU3RhdGUoJ3BlbicpO1xuICBjb25zdCBpc0RyYXdpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBjdXJyZW50U3Ryb2tlUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB3YlZlcnNpb25SZWYgPSBSZWFjdC51c2VSZWYoMCk7XG5cbiAgY29uc3QgcmVkcmF3Q2FudmFzID0gUmVhY3QudXNlQ2FsbGJhY2soKHN0cm9rZXMpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICBpZiAoIWNhbnZhcykgcmV0dXJuO1xuICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICBzdHJva2VzLmZvckVhY2gocyA9PiB7XG4gICAgICBpZiAoIXMucG9pbnRzIHx8IHMucG9pbnRzLmxlbmd0aCA8IDIpIHJldHVybjtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHMudG9vbCA9PT0gJ2VyYXNlcicgPyAnIzBCMEUxNCcgOiAocy5jb2xvciB8fCAnIzAwRjJGRScpO1xuICAgICAgY3R4LmxpbmVXaWR0aCA9IHMud2lkdGggfHwgMztcbiAgICAgIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcbiAgICAgIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICBjdHgubW92ZVRvKHMucG9pbnRzWzBdLngsIHMucG9pbnRzWzBdLnkpO1xuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBzLnBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjdHgubGluZVRvKHMucG9pbnRzW2ldLngsIHMucG9pbnRzW2ldLnkpO1xuICAgICAgfVxuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH0pO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgW3diQ2FuV3JpdGUsIHNldFdiQ2FuV3JpdGVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG5cbiAgLy8gXHUwMEMxcCAxIG9wIHZcdTAwRTBvIG1cdTFFQTNuZyBzdHJva2VzIChyZXBsYXkgYXBwZW5kLW9ubHkpOiAnc3Ryb2tlJyB0aFx1MDBFQW0gblx1MDBFOXQsICdjbGVhcicgeG9cdTAwRTEgc1x1MUVBMWNoLlxuICBjb25zdCBhcER1bmdPcCA9IChzdHJva2VzLCBvcCkgPT4ge1xuICAgIGlmIChvcC50eXBlID09PSAnY2xlYXInKSByZXR1cm4gW107XG4gICAgaWYgKG9wLnR5cGUgPT09ICdzdHJva2UnICYmIG9wLnN0cm9rZSkgcmV0dXJuIFsuLi5zdHJva2VzLCBvcC5zdHJva2VdO1xuICAgIHJldHVybiBzdHJva2VzO1xuICB9O1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICd3aGl0ZWJvYXJkJykgcmV0dXJuO1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoV2IgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT13aGl0ZWJvYXJkJnNhdUlkPSR7d2JWZXJzaW9uUmVmLmN1cnJlbnR9YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2spIHtcbiAgICAgICAgICBjb25zdCBvcHMgPSBBcnJheS5pc0FycmF5KGQucGF5bG9hZD8ub3BzKSA/IGQucGF5bG9hZC5vcHMgOiBbXTtcbiAgICAgICAgICBpZiAob3BzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gTlx1MUVCRnUgY1x1MDBGMyBvcCAnY2xlYXInIHRyb25nIGxvXHUxRUExdCBtXHUxRURCaSBcdTIxOTIgYnVpbGQgbFx1MUVBMWkgdFx1MUVFQiBcdTAxMTFcdTFFQTd1IGNobyBjaFx1MUVBRmNcbiAgICAgICAgICAgIGlmIChvcHMuc29tZShvID0+IG8udHlwZSA9PT0gJ2NsZWFyJykpIHtcbiAgICAgICAgICAgICAgY29uc3QgZnVsbCA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPXdoaXRlYm9hcmQmc2F1SWQ9MGApO1xuICAgICAgICAgICAgICBjb25zdCBkZiA9IGF3YWl0IGZ1bGwuanNvbigpO1xuICAgICAgICAgICAgICBpZiAoYWN0aXZlICYmIGRmLm9rKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsT3BzID0gQXJyYXkuaXNBcnJheShkZi5wYXlsb2FkPy5vcHMpID8gZGYucGF5bG9hZC5vcHMgOiBbXTtcbiAgICAgICAgICAgICAgICBjb25zdCByZWJ1aWx0ID0gYWxsT3BzLnJlZHVjZShhcER1bmdPcCwgW10pO1xuICAgICAgICAgICAgICAgIHNldFdiU3Ryb2tlcyhyZWJ1aWx0KTtcbiAgICAgICAgICAgICAgICByZWRyYXdDYW52YXMocmVidWlsdCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNldFdiU3Ryb2tlcyhwcmV2ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gb3BzLnJlZHVjZShhcER1bmdPcCwgcHJldik7XG4gICAgICAgICAgICAgICAgcmVkcmF3Q2FudmFzKG5leHQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgd2JWZXJzaW9uUmVmLmN1cnJlbnQgPSBkLnZlcnNpb24gfHwgMDtcbiAgICAgICAgICBzZXRXYkNhbldyaXRlKGQuY2FuV3JpdGUgIT09IGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RpdmUgJiYgZC5jb2RlID09PSAnY2FwYWJpbGl0eV9vZmYnKSB7XG4gICAgICAgICAgc2V0V2JDYW5Xcml0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIGZldGNoV2IoKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGtoaUhpZW5UaGkoZmV0Y2hXYiksIDMwMDApO1xuICAgIHJldHVybiAoKSA9PiB7IGFjdGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludGVydmFsKTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiLCByZWRyYXdDYW52YXNdKTtcblxuICBjb25zdCBzdGFydERyYXdpbmcgPSAoZSkgPT4ge1xuICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgIGlmICghY2FudmFzKSByZXR1cm47XG4gICAgY29uc3QgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBjbGllbnRYID0gZS5jbGllbnRYID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRYKTtcbiAgICBjb25zdCBjbGllbnRZID0gZS5jbGllbnRZID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRZKTtcbiAgICBjb25zdCB4ID0gY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICBjb25zdCB5ID0gY2xpZW50WSAtIHJlY3QudG9wO1xuICAgIGlzRHJhd2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQgPSB7XG4gICAgICB0b29sOiB3YlRvb2wsXG4gICAgICBjb2xvcjogd2JDb2xvcixcbiAgICAgIHdpZHRoOiB3YlRvb2wgPT09ICdlcmFzZXInID8gMTYgOiB3YldpZHRoLFxuICAgICAgcG9pbnRzOiBbeyB4LCB5IH1dXG4gICAgfTtcbiAgfTtcblxuICBjb25zdCBkcmF3TW92ZSA9IChlKSA9PiB7XG4gICAgaWYgKCFpc0RyYXdpbmdSZWYuY3VycmVudCB8fCAhY3VycmVudFN0cm9rZVJlZi5jdXJyZW50KSByZXR1cm47XG4gICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFjYW52YXMpIHJldHVybjtcbiAgICBjb25zdCByZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGNsaWVudFggPSBlLmNsaWVudFggPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFgpO1xuICAgIGNvbnN0IGNsaWVudFkgPSBlLmNsaWVudFkgPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFkpO1xuICAgIGNvbnN0IHggPSBjbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIGNvbnN0IHkgPSBjbGllbnRZIC0gcmVjdC50b3A7XG4gICAgY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnBvaW50cy5wdXNoKHsgeCwgeSB9KTtcbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnRvb2wgPT09ICdlcmFzZXInID8gJyMwQjBFMTQnIDogY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LmNvbG9yO1xuICAgIGN0eC5saW5lV2lkdGggPSBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQud2lkdGg7XG4gICAgY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuICAgIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgY29uc3QgcHRzID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnBvaW50cztcbiAgICBpZiAocHRzLmxlbmd0aCA+PSAyKSB7XG4gICAgICBjdHgubW92ZVRvKHB0c1twdHMubGVuZ3RoIC0gMl0ueCwgcHRzW3B0cy5sZW5ndGggLSAyXS55KTtcbiAgICAgIGN0eC5saW5lVG8ocHRzW3B0cy5sZW5ndGggLSAxXS54LCBwdHNbcHRzLmxlbmd0aCAtIDFdLnkpO1xuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBzdG9wRHJhd2luZyA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIWlzRHJhd2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgaXNEcmF3aW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFN0cm9rZVJlZi5jdXJyZW50ICYmIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5wb2ludHMubGVuZ3RoID4gMSkge1xuICAgICAgY29uc3Qgc3Ryb2tlID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50O1xuICAgICAgY29uc3QgbmV4dFN0cm9rZXMgPSBbLi4ud2JTdHJva2VzLCBzdHJva2VdO1xuICAgICAgc2V0V2JTdHJva2VzKG5leHRTdHJva2VzKTtcbiAgICAgIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICByZXNvdXJjZTogJ3doaXRlYm9hcmQnLFxuICAgICAgICAgICAgcGF5bG9hZDogeyB0eXBlOiAnc3Ryb2tlJywgc3Ryb2tlIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChkLm9rICYmIGQuaWQpIHdiVmVyc2lvblJlZi5jdXJyZW50ID0gTWF0aC5tYXgod2JWZXJzaW9uUmVmLmN1cnJlbnQsIGQuaWQpO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH1cbiAgfTtcblxuICBjb25zdCBjbGVhcldoaXRlYm9hcmQgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFjb25maXJtKCdCXHUxRUExbiBjXHUwMEYzIGNoXHUxRUFGYyBtdVx1MUVEMW4geFx1MDBGM2Egc1x1MUVBMWNoIGJcdTFFQTNuZyB2XHUxRUJEPyAoY2hcdTFFQzkgcXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcpJykpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICByZXNvdXJjZTogJ3doaXRlYm9hcmQnLFxuICAgICAgICAgIHBheWxvYWQ6IHsgdHlwZTogJ2NsZWFyJyB9XG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHtcbiAgICAgICAgc2V0V2JTdHJva2VzKFtdKTtcbiAgICAgICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgICAgIGlmIChjYW52YXMpIHtcbiAgICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gNC4gU2hhcmVkIFNoZWV0IFN0YXRlICg4IGNvbHMgeCAxMCByb3dzKSBcdTIwMTQgdXBzZXJ0IHRcdTFFRUJuZyBcdTAwRjQsIGtoXHUwMEY0bmcgd2hvbGUtZG9jIGNvbmZsaWN0XG4gIGNvbnN0IENPTFMgPSBbJ0EnLCAnQicsICdDJywgJ0QnLCAnRScsICdGJywgJ0cnLCAnSCddO1xuICBjb25zdCBST1dTID0gWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwXTtcbiAgY29uc3QgW3NoZWV0Q2VsbHMsIHNldFNoZWV0Q2VsbHNdID0gUmVhY3QudXNlU3RhdGUoe30pO1xuICBjb25zdCBbc2hlZXRDYW5Xcml0ZSwgc2V0U2hlZXRDYW5Xcml0ZV0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3Qgc2hlZXRTYXZlVGltZXJzUmVmID0gUmVhY3QudXNlUmVmKHt9KTtcbiAgY29uc3Qgc2hlZXRGb2N1c2VkQ2VsbFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgc2hlZXRQb2xsUmVmID0gUmVhY3QudXNlUmVmKDApO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICdzaGVldCcpIHJldHVybjtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaFNoZWV0ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mcmVzb3VyY2U9c2hlZXRgKTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChhY3RpdmUgJiYgZC5vaykge1xuICAgICAgICAgIGNvbnN0IGluY29taW5nID0gZC5wYXlsb2FkPy5jZWxscyB8fCB7fTtcbiAgICAgICAgICAvLyBLaFx1MDBGNG5nIGdoaSBcdTAxMTFcdTAwRTggXHUwMEY0IFx1MDExMWFuZyBnXHUwMEY1IGRcdTFFREZcbiAgICAgICAgICBzZXRTaGVldENlbGxzKHByZXYgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWVyZ2VkID0geyAuLi5pbmNvbWluZyB9O1xuICAgICAgICAgICAgY29uc3QgZGFuZ0dvID0gc2hlZXRGb2N1c2VkQ2VsbFJlZi5jdXJyZW50O1xuICAgICAgICAgICAgaWYgKGRhbmdHbyAmJiBwcmV2W2RhbmdHb10gIT09IHVuZGVmaW5lZCkgbWVyZ2VkW2RhbmdHb10gPSBwcmV2W2RhbmdHb107XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHNldFNoZWV0Q2FuV3JpdGUoZC5jYW5Xcml0ZSAhPT0gZmFsc2UpO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGl2ZSAmJiBkLmNvZGUgPT09ICdjYXBhYmlsaXR5X29mZicpIHtcbiAgICAgICAgICBzZXRTaGVldENhbldyaXRlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7fVxuICAgIH07XG4gICAgZmV0Y2hTaGVldCgpO1xuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaShmZXRjaFNoZWV0KSwgMzAwMCk7XG4gICAgcmV0dXJuICgpID0+IHsgYWN0aXZlID0gZmFsc2U7IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpOyB9O1xuICB9LCBbcGhvbmcuaWQsIGRvY2tUYWJdKTtcblxuICBjb25zdCBoYW5kbGVDZWxsQ2hhbmdlID0gKGNlbGxLZXksIHZhbCkgPT4ge1xuICAgIHNldFNoZWV0Q2VsbHMocHJldiA9PiAoeyAuLi5wcmV2LCBbY2VsbEtleV06IHZhbCB9KSk7XG4gICAgY29uc3QgdGltZXJzID0gc2hlZXRTYXZlVGltZXJzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKHRpbWVyc1tjZWxsS2V5XSkgY2xlYXJUaW1lb3V0KHRpbWVyc1tjZWxsS2V5XSk7XG4gICAgdGltZXJzW2NlbGxLZXldID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICByZXNvdXJjZTogJ3NoZWV0JyxcbiAgICAgICAgICAgIHBheWxvYWQ6IHsgY2VsbDogY2VsbEtleSwgdmFsdWU6IHZhbCB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfSwgODAwKTtcbiAgfTtcblxuICAvLyA1LiAxLXRvLTEgV2ViUlRDIFZvaWNlIENoYXQgXHUyMDE0IHBhaXItYm91bmQgKHRcdTFFRDFpIFx1MDExMWEgMSBjXHUxRUI3cC9waFx1MDBGMm5nLCBzaWduYWxpbmcgcmlcdTAwRUFuZyB0XHUwMUIwKVxuICBjb25zdCBbdm9pY2VKb2luZWQsIHNldFZvaWNlSm9pbmVkXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW21pY011dGVkLCBzZXRNaWNNdXRlZF0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTsgLy8gRGVmYXVsdCBPRkZcbiAgY29uc3QgW3ZvaWNlU3RhdGUsIHNldFZvaWNlU3RhdGVdID0gUmVhY3QudXNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICBjb25zdCBbdm9pY2VOb3RpY2UsIHNldFZvaWNlTm90aWNlXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3ZvaWNlUGFpciwgc2V0Vm9pY2VQYWlyXSA9IFJlYWN0LnVzZVN0YXRlKG51bGwpOyAgICAgICAvLyB7YWN0aXZlLCBhVGVuLCBiVGVuLCB5b3VJbiwgc2xvdH1cbiAgY29uc3QgW3ZvaWNlUmVxdWVzdGVkLCBzZXRWb2ljZVJlcXVlc3RlZF0gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFt5ZXVDYXVWb2ljZSwgc2V0WWV1Q2F1Vm9pY2VdID0gUmVhY3QudXNlU3RhdGUoW10pOyAgICAgLy8gc3RhZmY6IGRhbmggc1x1MDBFMWNoIHhpbiBxdXlcdTFFQzFuXG4gIGNvbnN0IHBjUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBsb2NhbFN0cmVhbVJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgcmVtb3RlQXVkaW9SZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGxhc3RTaWduYWxJZFJlZiA9IFJlYWN0LnVzZVJlZigwKTtcbiAgY29uc3Qgdm9pY2VQb2xsVGltZXJSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHZvaWNlU2xvdFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgdm9pY2VKb2luZWRSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBwZW5kaW5nQ2FuZGlkYXRlc1JlZiA9IFJlYWN0LnVzZVJlZihbXSk7XG4gIHZvaWNlSm9pbmVkUmVmLmN1cnJlbnQgPSB2b2ljZUpvaW5lZDtcblxuICBjb25zdCBkdW5nS2V0Tm9pVm9pY2UgPSAoKSA9PiB7XG4gICAgaWYgKGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0VHJhY2tzKCkuZm9yRWFjaCh0ID0+IHQuc3RvcCgpKTtcbiAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAocGNSZWYuY3VycmVudCkge1xuICAgICAgcGNSZWYuY3VycmVudC5jbG9zZSgpO1xuICAgICAgcGNSZWYuY3VycmVudCA9IG51bGw7XG4gICAgfVxuICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQgPSBbXTtcbiAgICBzZXRNaWNNdXRlZCh0cnVlKTtcbiAgfTtcblxuICAvLyBQb2xsIHRyXHUxRUExbmcgdGhcdTAwRTFpIGNcdTFFQjdwICsgdFx1MDBFRG4gaGlcdTFFQzd1IGNcdTFFRTdhIHBhcnRuZXIgKHNlcnZlciBjaFx1MUVDOSB0clx1MUVBMyBzaWduYWwgY1x1MUVFN2EgbmdcdTAxQjBcdTFFRERpIHRyb25nIGNcdTFFQjdwKS5cbiAgY29uc3QgcG9sbFZvaWNlID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZhY3Rpb249dm9pY2VfcG9sbCZzYXVJZD0ke2xhc3RTaWduYWxJZFJlZi5jdXJyZW50fWApO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoIWQub2spIHJldHVybjtcbiAgICAgIGlmIChkLnBhaXIpIHNldFZvaWNlUGFpcihkLnBhaXIpO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZC55ZXVDYXVWb2ljZSkpIHNldFlldUNhdVZvaWNlKGQueWV1Q2F1Vm9pY2UpO1xuICAgICAgY29uc3QgcGMgPSBwY1JlZi5jdXJyZW50O1xuICAgICAgaWYgKCF2b2ljZUpvaW5lZFJlZi5jdXJyZW50IHx8ICFwYykgcmV0dXJuO1xuICAgICAgZm9yIChjb25zdCBzaWcgb2YgZC5zaWduYWxzIHx8IFtdKSB7XG4gICAgICAgIGxhc3RTaWduYWxJZFJlZi5jdXJyZW50ID0gTWF0aC5tYXgobGFzdFNpZ25hbElkUmVmLmN1cnJlbnQsIHNpZy5pZCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnb2ZmZXInKSB7XG4gICAgICAgICAgICAvLyBPZmZlciBtXHUxRURCaSBob1x1MUVCN2MgcmUtb2ZmZXIgKFx1MDExMVx1MUVEMWkgcGhcdTAxQjBcdTAxQTFuZyBiXHUxRUFEdCBtaWMgbXVcdTFFRDluKSBcdTAxMTFcdTFFQzF1IHNldCBsXHUxRUExaSByZW1vdGUgKyB0clx1MUVBMyBhbnN3ZXIuXG4gICAgICAgICAgICBhd2FpdCBwYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKHNpZy5wYXlsb2FkKSk7XG4gICAgICAgICAgICAvLyBYXHUxRUEzIGNcdTAwRTFjIGNhbmRpZGF0ZSB0XHUxRURCaSBzXHUxRURCbSB0clx1MDFCMFx1MUVEQmMga2hpIGNcdTAwRjMgcmVtb3RlRGVzY3JpcHRpb24uXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGMgb2YgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICBhd2FpdCBwYy5hZGRJY2VDYW5kaWRhdGUobmV3IFJUQ0ljZUNhbmRpZGF0ZShjKSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCA9IFtdO1xuICAgICAgICAgICAgY29uc3QgYW5zID0gYXdhaXQgcGMuY3JlYXRlQW5zd2VyKCk7XG4gICAgICAgICAgICBhd2FpdCBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKGFucyk7XG4gICAgICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ2Fuc3dlcicsIHBheWxvYWQ6IGFucyB9KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ2Fuc3dlcicpIHtcbiAgICAgICAgICAgIGlmIChwYy5zaWduYWxpbmdTdGF0ZSA9PT0gJ2hhdmUtbG9jYWwtb2ZmZXInKSB7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLnNldFJlbW90ZURlc2NyaXB0aW9uKG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24oc2lnLnBheWxvYWQpKTtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBjIG9mIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwYy5hZGRJY2VDYW5kaWRhdGUobmV3IFJUQ0ljZUNhbmRpZGF0ZShjKSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnY2FuZGlkYXRlJykge1xuICAgICAgICAgICAgaWYgKHBjLnJlbW90ZURlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLmFkZEljZUNhbmRpZGF0ZShuZXcgUlRDSWNlQ2FuZGlkYXRlKHNpZy5wYXlsb2FkKSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudC5wdXNoKHNpZy5wYXlsb2FkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnbGVhdmUnKSB7XG4gICAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnTmdcdTAxQjBcdTFFRERpIGtpYSBcdTAxMTFcdTAwRTMgbmdcdTFFQUZ0IHZvaWNlLicpO1xuICAgICAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgICAgICAgICBkdW5nS2V0Tm9pVm9pY2UoKTtcbiAgICAgICAgICAgIHNldFZvaWNlSm9pbmVkKGZhbHNlKTtcbiAgICAgICAgICAgIHZvaWNlU2xvdFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggeyAvKiBiXHUxRUNGIHF1YSBzaWduYWwgbFx1MUVEN2kgKi8gfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICAvLyBQb2xsIGNoXHUxRUExeSBraGkgdGFiIHZvaWNlIG1cdTFFREYgKHhlbSB0clx1MUVBMW5nIHRoXHUwMEUxaSBjXHUxRUI3cCkgaG9cdTFFQjdjIFx1MDExMWFuZyB0cm9uZyBjXHUxRUI3cC5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiAhPT0gJ3ZvaWNlJyAmJiAhdm9pY2VKb2luZWQpIHJldHVybjtcbiAgICBwb2xsVm9pY2UoKTtcbiAgICB2b2ljZVBvbGxUaW1lclJlZi5jdXJyZW50ID0gc2V0SW50ZXJ2YWwocG9sbFZvaWNlLCAxNTAwKTtcbiAgICByZXR1cm4gKCkgPT4geyBpZiAodm9pY2VQb2xsVGltZXJSZWYuY3VycmVudCkgY2xlYXJJbnRlcnZhbCh2b2ljZVBvbGxUaW1lclJlZi5jdXJyZW50KTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiLCB2b2ljZUpvaW5lZF0pO1xuXG4gIGNvbnN0IGpvaW5Wb2ljZSA9IGFzeW5jICgpID0+IHtcbiAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwYW5nIHhpbiBjaFx1MUVENyB0cm9uZyBjXHUxRUI3cCB2b2ljZS4uLicpO1xuICAgIHNldFZvaWNlU3RhdGUoJ2Nvbm5lY3RpbmcnKTtcbiAgICB0cnkge1xuICAgICAgLy8gMS4gR2lcdTAwRTBuaCBzbG90IHRyXHUwMEVBbiBzZXJ2ZXIgdHJcdTAxQjBcdTFFREJjIChzZXJ2ZXItYXV0aG9yaXRhdGl2ZTogdFx1MUVEMWkgXHUwMTExYSAxIGNcdTFFQjdwIDEtMS9waFx1MDBGMm5nKVxuICAgICAgY29uc3Qgam9pblJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9qb2luJyB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBqb2luRGF0YSA9IGF3YWl0IGpvaW5SZXMuanNvbigpO1xuICAgICAgaWYgKCFqb2luRGF0YS5vaykge1xuICAgICAgICBpZiAoam9pbkRhdGEuY29kZSA9PT0gJ2dyYW50X3JlcXVpcmVkJykge1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdCXHUxRUExbiBjXHUxRUE3biBcdTAxMTFcdTAxQjBcdTFFRTNjIGNcdTFFQTVwIHF1eVx1MUVDMW4gdm9pY2UgXHUyMDE0IGhcdTAwRTN5IGJcdTFFQTVtIFwiWGluIHF1eVx1MUVDMW4gdm9pY2VcIi4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZShqb2luRGF0YS5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgdGhhbSBnaWEgdm9pY2UuJyk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZvaWNlU2xvdFJlZi5jdXJyZW50ID0gam9pbkRhdGEuc2xvdDtcbiAgICAgIHNldFZvaWNlSm9pbmVkKHRydWUpO1xuXG4gICAgICAvLyAyLiBYaW4gbWljIFRSXHUwMUFGXHUxRURBQyBraGkgdFx1MUVBMW8gb2ZmZXIgXHUyMDE0IHRyYWNrIHBoXHUxRUEzaSBjXHUwMEYzIHNcdTFFQjVuIHRyb25nIFNEUCBuZWdvdGlhdGlvbixcbiAgICAgIC8vICAgIGFkZFRyYWNrIHNhdSBraGkgXHUwMTExXHUwMEUzIGJcdTFFQUZ0IHRheSBtXHUwMEUwIGtoXHUwMEY0bmcgcmVuZWdvdGlhdGUgXHUyMTkyIG5nXHUwMUIwXHUxRUREaSBraWEga2hcdTAwRjRuZyBuZ2hlIFx1MDExMVx1MDFCMFx1MUVFM2MuXG4gICAgICAvLyAgICBNaWMga2hcdTFFREZpIFx1MDExMVx1MUVBN3UgbXV0ZWQgKGVuYWJsZWQ9ZmFsc2UpIFx1MjAxNCB1c2VyIHRcdTFFRjEgYlx1MUVBRHQgYlx1MUVCMW5nIG5cdTAwRkF0IE1pYy5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgYXVkaW86IHRydWUsIHZpZGVvOiBmYWxzZSB9KTtcbiAgICAgICAgc3RyZWFtLmdldEF1ZGlvVHJhY2tzKCkuZm9yRWFjaCh0ID0+IHsgdC5lbmFibGVkID0gZmFsc2U7IH0pO1xuICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50ID0gc3RyZWFtO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdLaFx1MDBGNG5nIHhpbiBcdTAxMTFcdTAxQjBcdTFFRTNjIG1pY3JvIFx1MjAxNCBiXHUxRUExbiBjaFx1MUVDOSBuZ2hlIFx1MDExMVx1MDFCMFx1MUVFM2MsIGtoXHUwMEY0bmcgblx1MDBGM2kgXHUwMTExXHUwMUIwXHUxRUUzYy4nKTtcbiAgICAgIH1cblxuICAgICAgLy8gMy4gVFx1MUVBMW8gcGVlciBjb25uZWN0aW9uXG4gICAgICBjb25zdCBwYyA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbih7XG4gICAgICAgIGljZVNlcnZlcnM6IFt7IHVybHM6ICdzdHVuOnN0dW4ubC5nb29nbGUuY29tOjE5MzAyJyB9XVxuICAgICAgfSk7XG4gICAgICBwY1JlZi5jdXJyZW50ID0gcGM7XG4gICAgICBpZiAobG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldFRyYWNrcygpLmZvckVhY2godCA9PiBwYy5hZGRUcmFjayh0LCBsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSk7XG4gICAgICB9XG5cbiAgICAgIHBjLm9uaWNlY2FuZGlkYXRlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5jYW5kaWRhdGUpIHtcbiAgICAgICAgICBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICAgICAgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJyxcbiAgICAgICAgICAgICAgc2lnbmFsVHlwZTogJ2NhbmRpZGF0ZScsXG4gICAgICAgICAgICAgIHBheWxvYWQ6IGV2ZW50LmNhbmRpZGF0ZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHBjLm9udHJhY2sgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKHJlbW90ZUF1ZGlvUmVmLmN1cnJlbnQgJiYgZXZlbnQuc3RyZWFtc1swXSkge1xuICAgICAgICAgIHJlbW90ZUF1ZGlvUmVmLmN1cnJlbnQuc3JjT2JqZWN0ID0gZXZlbnQuc3RyZWFtc1swXTtcbiAgICAgICAgICByZW1vdGVBdWRpb1JlZi5jdXJyZW50LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHBjLm9uY29ubmVjdGlvbnN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBzID0gcGMuY29ubmVjdGlvblN0YXRlO1xuICAgICAgICBpZiAocyA9PT0gJ2Nvbm5lY3RlZCcpIHtcbiAgICAgICAgICBzZXRWb2ljZVN0YXRlKCdjb25uZWN0ZWQnKTtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnXHUyNzEzIFx1MDExMGFuZyBrXHUxRUJGdCBuXHUxRUQxaSB0aG9cdTFFQTFpIDEtMSB0clx1MUVGMWMgdGlcdTFFQkZwLicpO1xuICAgICAgICB9IGVsc2UgaWYgKHMgPT09ICdmYWlsZWQnIHx8IHMgPT09ICdkaXNjb25uZWN0ZWQnKSB7XG4gICAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIHRob1x1MUVBMWkgKG1cdTFFQTFuZyBjaFx1MUVCN24gUDJQIG5cdTFFQkZ1IGtoXHUwMEY0bmcgY1x1MDBGMyBUVVJOKS4nKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgLy8gNC4gU2xvdCAnYicgKG5nXHUwMUIwXHUxRUREaSB2XHUwMEUwbyBzYXUpIHRcdTFFQTFvIG9mZmVyOyBzbG90ICdhJyBjaFx1MUVERCBvZmZlciB0XHUxRUVCIHBvbGwuXG4gICAgICBpZiAoam9pbkRhdGEuc2xvdCA9PT0gJ2InKSB7XG4gICAgICAgIGNvbnN0IG9mZmVyID0gYXdhaXQgcGMuY3JlYXRlT2ZmZXIoKTtcbiAgICAgICAgYXdhaXQgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihvZmZlcik7XG4gICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnb2ZmZXInLCBwYXlsb2FkOiBvZmZlciB9KVxuICAgICAgICB9KTtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMFx1MDBFMyB2XHUwMEUwbyBjXHUxRUI3cCBcdTIwMTQgXHUwMTExYW5nIGJcdTFFQUZ0IHRheSB2XHUxRURCaSAnICsgKHZvaWNlUGFpcj8uYVRlbiB8fCAnbmdcdTAxQjBcdTFFRERpIGtpYScpICsgJ1x1MjAyNicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0JcdTFFQTFuIGxcdTAwRTAgbmdcdTAxQjBcdTFFRERpIFx1MDExMVx1MUVBN3UgdGlcdTAwRUFuIFx1MjAxNCBjaFx1MUVERCB0aFx1MDBFQW0gMSBuZ1x1MDFCMFx1MUVERGkgdlx1MDBFMG8gdm9pY2VcdTIwMjYnKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHNldFZvaWNlTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSB2b2ljZTogJyArIGVyci5tZXNzYWdlKTtcbiAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB4aW5RdXllblZvaWNlID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2VfcmVxdWVzdCcgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vayAmJiBkLmdyYW50ZWQpIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0JcdTFFQTFuIFx1MDExMVx1MDBFMyBcdTAxMTFcdTAxQjBcdTFFRTNjIHBoXHUwMEU5cCB2b2ljZSBcdTIwMTQgYlx1MUVBNW0gVGhhbSBnaWEuJyk7XG4gICAgICB9IGVsc2UgaWYgKGQub2spIHtcbiAgICAgICAgc2V0Vm9pY2VSZXF1ZXN0ZWQodHJ1ZSk7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBcdTAwRTMgZ1x1MUVFRGkgeVx1MDBFQXUgY1x1MUVBN3UgXHUyMDE0IGNoXHUxRUREIHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nIGR1eVx1MUVDN3QuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRWb2ljZU5vdGljZShkLmxvaSB8fCAnS2hcdTAwRjRuZyBnXHUxRUVEaSBcdTAxMTFcdTAxQjBcdTFFRTNjIHlcdTAwRUF1IGNcdTFFQTd1LicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggeyBzZXRWb2ljZU5vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkuJyk7IH1cbiAgfTtcblxuICBjb25zdCBuZ2F0Vm9pY2VDYXAgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFjb25maXJtKCdOZ1x1MUVBRnQgY1x1MUVCN3Agdm9pY2UgXHUwMTExYW5nIGhvXHUxRUExdCBcdTAxMTFcdTFFRDluZz8nKSkgcmV0dXJuO1xuICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9lbmQnIH0pXG4gICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgIHBvbGxWb2ljZSgpO1xuICB9O1xuXG4gIGNvbnN0IHRvZ2dsZU1pYyA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAobWljTXV0ZWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICghbG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgICAgIC8vIE1pYyBiXHUxRUNCIHRcdTFFRUIgY2hcdTFFRDFpIGxcdTAwRkFjIGpvaW4gXHUyMTkyIHhpbiBsXHUxRUExaTsgYWRkVHJhY2sgbXVcdTFFRDluIGNcdTFFQTduIHJlbmVnb3RpYXRlIChvZmZlciBtXHUxRURCaSkuXG4gICAgICAgICAgY29uc3Qgc3RyZWFtID0gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoeyBhdWRpbzogdHJ1ZSwgdmlkZW86IGZhbHNlIH0pO1xuICAgICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQgPSBzdHJlYW07XG4gICAgICAgICAgY29uc3QgcGMgPSBwY1JlZi5jdXJyZW50O1xuICAgICAgICAgIGlmIChwYykge1xuICAgICAgICAgICAgc3RyZWFtLmdldFRyYWNrcygpLmZvckVhY2godHJhY2sgPT4gcGMuYWRkVHJhY2sodHJhY2ssIHN0cmVhbSkpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3Qgb2ZmZXIgPSBhd2FpdCBwYy5jcmVhdGVPZmZlcigpO1xuICAgICAgICAgICAgICBhd2FpdCBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcbiAgICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdvZmZlcicsIHBheWxvYWQ6IG9mZmVyIH0pXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIHJlbmVnb3RpYXRpb24gdGhcdTFFQTV0IGJcdTFFQTFpIFx1MjAxNCBuZ2hlIHZcdTFFQUJuIFx1MDExMVx1MDFCMFx1MUVFM2MgKi8gfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldEF1ZGlvVHJhY2tzKCkuZm9yRWFjaCh0ID0+IHsgdC5lbmFibGVkID0gdHJ1ZTsgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0TWljTXV0ZWQoZmFsc2UpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGFsZXJ0KCdLaFx1MDBGNG5nIHRoXHUxRUMzIG1cdTFFREYgbWljcm86ICcgKyBlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0QXVkaW9UcmFja3MoKS5mb3JFYWNoKHQgPT4geyB0LmVuYWJsZWQgPSBmYWxzZTsgfSk7XG4gICAgICB9XG4gICAgICBzZXRNaWNNdXRlZCh0cnVlKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgbGVhdmVWb2ljZSA9ICgpID0+IHtcbiAgICBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ2xlYXZlJywgcGF5bG9hZDoge30gfSlcbiAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgZHVuZ0tldE5vaVZvaWNlKCk7XG4gICAgc2V0Vm9pY2VKb2luZWQoZmFsc2UpO1xuICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgIHZvaWNlU2xvdFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwXHUwMEUzIG5nXHUxRUFGdCB2b2ljZS4nKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgaWQ9XCJzdHVkeS1kb2NrLWNvbnRhaW5lclwiIHN0eWxlPXt7IG92ZXJmbG93QW5jaG9yOiAnbm9uZScgfX0gY2xhc3NOYW1lPXtgYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMTYxYjI2XSB0by1bIzBmMTQxZF0gYm9yZGVyIGJvcmRlci13aGl0ZS9bMC4wOF0gcm91bmRlZC0yeGwgcC00IGZsZXggZmxleC1jb2wgc2hhZG93LXhsICR7aXNSb29tV2lkZSA/ICdtaW4taC1bY2FsYygxMDB2aC0xNjBweCldIGgtZnVsbCBmbGV4LTEnIDogJ2gtWzYyMHB4XSBsZzpoLVs2ODBweF0nfWB9PlxuICAgICAgey8qIFN0dWR5IERvY2sgVGFiIE5hdmlnYXRpb24gXHUyMDE0IEdcdTFFQ0RuIGdcdTAwRTBuZywgdGhcdTFFQTltIG1cdTFFRjksIG5cdTAwRkF0IG5cdTFFRDVpIGJcdTFFQUR0ICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgcGItMyBib3JkZXItYiBib3JkZXItd2hpdGUvMTAgZmxleC13cmFwIHNocmluay0wXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZmxleC13cmFwXCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktY2hhdFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ2NoYXQnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdjaGF0J1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0FDPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Q2hhdCBwaFx1MDBGMm5nPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LW5vdGVzXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignbm90ZXMnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdub3RlcydcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENERDwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkdoaSBjaFx1MDBGQTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS13aGl0ZWJvYXJkXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignd2hpdGVib2FyZCcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3doaXRlYm9hcmQnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGQTg8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5CXHUxRUEzbmcgdlx1MUVCRDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1zaGVldFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3NoZWV0Jyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnc2hlZXQnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQ0E8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5CXHUxRUEzbmcgdFx1MDBFRG5oPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LXZvaWNlXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYigndm9pY2UnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICd2b2ljZSdcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLWFtYmVyLTUwMCB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgyNTEsMTkxLDM2LDAuMzUpXSBib3JkZXIgYm9yZGVyLWFtYmVyLTQwMC81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGOTlcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5Wb2ljZSAoMS0xKTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1tZW1iZXJzXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignbWVtYmVycycpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ21lbWJlcnMnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLWVtZXJhbGQtNDAwIHRvLXRlYWwtNTAwIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDUyLDIxMSwxNTMsMC4zNSldIGJvcmRlciBib3JkZXItZW1lcmFsZC00MDAvNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQzY1PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+VGhcdTAwRTBuaCB2aVx1MDBFQW57dGhhbmhWaWVuLmxlbmd0aCA+IDAgPyBgICgke3RoYW5oVmllbi5sZW5ndGh9KWAgOiAnJ308L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICB7aXNTdGFmZiAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LXF1YW4tdHJpXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3F1YW4tdHJpJyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3F1YW4tdHJpJ1xuICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLXZpb2xldC01MDAgdG8tcHVycGxlLTUwMCB0ZXh0LXdoaXRlIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgxMzksOTIsMjQ2LDAuMzUpXSBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvNTAnXG4gICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNjk5XHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5RdXlcdTFFQzFuPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIERvY2sgQ29udGVudCBCb2R5ICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBwdC0zIG1pbi1oLTAgaC1mdWxsIG92ZXJmbG93LWhpZGRlblwiPlxuICAgICAgICB7LyogVEFCIDE6IENIQVQgUEhcdTAwRDJORyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdjaGF0JyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBtaW4taC0wIGgtZnVsbFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHNwYWNlLXktMyBwci0xIG1pbi1oLTAgdGV4dC14c1wiPlxuICAgICAgICAgICAgICB7cGhvbmdDaGF0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCB0ZXh0LWNlbnRlciBweS04XCI+Q2hcdTAxQjBhIGNcdTAwRjMgdGluIG5oXHUxRUFGbiBcdTIwMTQgaFx1MDBFM3kgZ1x1MUVFRGkgY1x1MDBFMnUgaFx1MUVDRmkgaG9cdTFFQjdjIHRyYW8gXHUwMTExXHUxRUQ1aSB2XHUxRUMxIGJcdTAwRTBpIGdpXHUxRUEzbmchPC9wPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIHBob25nQ2hhdC5tYXAoKG0sIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgbXlOYW1lID0gU3RyaW5nKGF1dGg/LnVzZXI/LmhvVGVuIHx8IGF1dGg/LnVzZXI/Lm5hbWUgfHwgYXV0aD8udXNlcj8udGVuIHx8ICcnKS50cmltKCk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUNoaW5oTWluaCA9IEJvb2xlYW4oXG4gICAgICAgICAgICAgICAgICAgIG0uY3VhVG9pIHx8XG4gICAgICAgICAgICAgICAgICAgIChtLmtob2EgJiYgcGhvbmdNaW5oS2hvYSAmJiBtLmtob2EgPT09IHBob25nTWluaEtob2EpIHx8XG4gICAgICAgICAgICAgICAgICAgIChteU5hbWUgJiYgbS50ZW5OZ3VvaUd1aSAmJiBtLnRlbk5ndW9pR3VpLnRyaW0oKS50b0xvd2VyQ2FzZSgpID09PSBteU5hbWUudG9Mb3dlckNhc2UoKSlcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBjb25zdCB0aW1lU3RyID0gbS50YW9MdWMgPyBuZXcgRGF0ZShtLnRhb0x1Yy5yZXBsYWNlKCcgJywgJ1QnKSArIChtLnRhb0x1Yy5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JyB9KSA6ICcnO1xuXG4gICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAga2V5PXttLmlkIHx8IGlkeH1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGZsZXgtY29sIGdyb3VwIHctZnVsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFDaGluaE1pbmggPyAnaXRlbXMtZW5kJyA6ICdpdGVtcy1zdGFydCdcbiAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgey8qIEhlYWRlciB0aFx1MDBGNG5nIHRpbiBuZ1x1MDFCMFx1MUVERGkgZ1x1MUVFRGkgKi99XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IG1iLTEgdGV4dC1bMTFweF0gJHtsYUNoaW5oTWluaCA/ICdmbGV4LXJvdy1yZXZlcnNlJyA6ICcnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgZm9udC1leHRyYWJvbGQgJHtsYUNoaW5oTWluaCA/ICd0ZXh0LVsjMDBGMkZFXScgOiAndGV4dC1zbGF0ZS0yMDAnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7bS50ZW5OZ3VvaUd1aX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUNoaW5oTWluaCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIHNoYWRvdy1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJcdTFFQTFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICB7bS52YWlUcm8gPT09ICdnaWFvX3ZpZW4nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdWQ05cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IG0ubG9wVGVuID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzIwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge20ubG9wVGVufVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7dGltZVN0cn1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiWG9cdTAwRTEgdGluIG5oXHUxRUFGbiBuXHUwMEUweSAocXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jaGF0P3Bob25nSWQ9JHtwaG9uZy5pZH0maWQ9JHttLmlkfWAsIHsgbWV0aG9kOiAnREVMRVRFJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkLm9rICYmIG9uWG9hVGluUGhvbmcpIG9uWG9hVGluUGhvbmcobS5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgKi8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHB4LTEgdGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTUwMCBob3Zlcjp0ZXh0LXJvc2UtNDAwIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIHsvKiBCdWJibGUgdGluIG5oXHUxRUFGbiAqL31cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BtYXgtdy1bODUlXSBzbTptYXgtdy1bNzglXSBweC0zLjUgcHktMiB0ZXh0LXhzIGxlYWRpbmctcmVsYXhlZCBicmVhay13b3JkcyBzaGFkb3ctbWQgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGFDaGluaE1pbmhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdyb3VuZGVkLTJ4bCByb3VuZGVkLXRyLXhzIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwYjRkOF0vMjUgdmlhLVsjMDA3N2I2XS8zMCB0by1bIzAwRjJGRV0vMjAgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgdGV4dC13aGl0ZSBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMTIpXSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdyb3VuZGVkLTJ4bCByb3VuZGVkLXRsLXhzIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOmJvcmRlci13aGl0ZS8yMCB0ZXh0LXNsYXRlLTIwMCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIndoaXRlc3BhY2UtcHJlLXdyYXBcIj57bS5ub2lEdW5nfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIHttLnZpZGVvVGltZVNlYyAhPSBudWxsICYmIG0udmlkZW9UaW1lU2VjID49IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geWV1Q2F1VHVhKG0udmlkZW9UaW1lU2VjKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJtdC0xLjUgaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIGdhcC0xIHB4LTIgcHktMC41IHJvdW5kZWQtbGcgdGV4dC1bMTBweF0gZm9udC1ibGFjayBiZy1jeWFuLTQwMC8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCBob3ZlcjpiZy1bIzAwRjJGRV0vMzAgdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTI1QjY8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+e2RpbmhEYW5nR2lheVBodXQobS52aWRlb1RpbWVTZWMpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPGRpdiByZWY9e2NoYXRFbmRSZWZ9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVNlbmRSb29tQ2hhdH0gY2xhc3NOYW1lPVwicHQtMiBib3JkZXItdCBib3JkZXItd2hpdGUvOCBmbGV4IGZsZXgtY29sIGdhcC0yIG10LWF1dG8gc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgey8qIEVtb2ppIHBhbmVsICovfVxuICAgICAgICAgICAgICB7c2hvd0Vtb2ppICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGdhcC0xIHAtMiBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bFwiPlxuICAgICAgICAgICAgICAgICAge1snXHVEODNEXHVERTBBJywnXHVEODNEXHVERTAyJywnXHVEODNFXHVERDcwJywnXHVEODNEXHVERTBFJywnXHVEODNFXHVERDE0JywnXHVEODNEXHVERTA1JywnXHVEODNEXHVERTJEJywnXHVEODNEXHVERDI1JywnXHUyNzY0XHVGRTBGJywnXHVEODNEXHVEQzREJywnXHVEODNEXHVERTRGJywnXHVEODNDXHVERjg5JywnXHUyNzA1JywnXHVEODNEXHVEQ0FGJywnXHVEODNEXHVEQzRCJywnXHVEODNEXHVEQ0RBJywnXHUyNzBGXHVGRTBGJywnXHVEODNDXHVERkFGJywnXHVEODNDXHVERjFGJywnXHVEODNEXHVEQ0ExJywnXHUyNkExJywnXHVEODNDXHVERkM2JywnXHVEODNFXHVERDFEJywnXHVEODNEXHVEQ0FBJywnXHVEODNFXHVERDI5J10ubWFwKGVtID0+IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBrZXk9e2VtfSB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldENoYXRJbnB1dCh2ID0+IHYgKyBlbSk7IHNldFNob3dFbW9qaShmYWxzZSk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1sZyBob3ZlcjpzY2FsZS0xMjUgdHJhbnNpdGlvbi10cmFuc2Zvcm0gYWN0aXZlOnNjYWxlLTk1IHB4LTFcIj57ZW19PC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgZmxleC0xXCI+XG4gICAgICAgICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1waG9uZy1jaGF0XCJcbiAgICAgICAgICAgICAgICAgICAgcm93cz17MX1cbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e2NvUXV5ZW4oJ2NoYXQnKSA/ICdOaFx1MUVBRm4gdGluIHBoXHUwMEYybmcgaFx1MUVDRGMuLi4nIDogJ0NoYXQgXHUwMTExYW5nIGJcdTFFQ0Iga2hcdTAwRjNhJ31cbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2NoYXRJbnB1dH1cbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjb1F1eWVuKCdjaGF0Jyl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldENoYXRJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25TdGFydD17KCkgPT4geyBjaGF0Q29tcG9zaW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPXsoKSA9PiB7IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCA9IGZhbHNlOyB9fVxuICAgICAgICAgICAgICAgICAgICBvbktleURvd249e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiAhZS5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUubmF0aXZlRXZlbnQ/LmlzQ29tcG9zaW5nIHx8IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlU2VuZFJvb21DaGF0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICBtYXhMZW5ndGg9ezUwMH1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHB4LTQgcHktMi41IHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTAgZm9jdXM6c2hhZG93LVswXzBfMTJweF9yZ2JhKDAsMjQyLDI1NCwwLjEyKV0gcmVzaXplLW5vbmUgbWluLWgtWzM4cHhdIG1heC1oLTI0IGRpc2FibGVkOm9wYWNpdHktNDAgdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7LyogRW1vamkgYnV0dG9uICovfVxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjb1F1eWVuKCdjaGF0Jyl9XG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93RW1vamkodiA9PiAhdil9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTkgaC05IHJvdW5kZWQtMnhsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtYmFzZSB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTMwIHNocmluay0wIGFjdGl2ZTpzY2FsZS05MCAke1xuICAgICAgICAgICAgICAgICAgICBzaG93RW1vamkgPyAnYmctWyMwMEYyRkVdLzIwIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIHRleHQtWyMwMEYyRkVdJyA6ICdiZy13aGl0ZS81IGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSBob3ZlcjpiZy13aGl0ZS8xMCdcbiAgICAgICAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDaFx1MUVDRG4gZW1vamlcIj5cbiAgICAgICAgICAgICAgICAgIFx1RDgzRFx1REUwQVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIHsvKiBTZW5kIGJ1dHRvbiAqL31cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXNlbmQtcGhvbmctY2hhdFwiXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNoYXRJbnB1dC50cmltKCkgfHwgY2hhdFNlbmRpbmcgfHwgIWNvUXV5ZW4oJ2NoYXQnKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctOSBoLTkgcm91bmRlZC0yeGwgYmctZ3JhZGllbnQtdG8tYnIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzQjgyRjZdIHRleHQtYmxhY2sgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTMwIHNocmluay0wIGhvdmVyOmJyaWdodG5lc3MtMTEwIGFjdGl2ZTpzY2FsZS05MCBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMCwyNDIsMjU0LDAuMyldXCI+XG4gICAgICAgICAgICAgICAgICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiIGNsYXNzTmFtZT1cInctNCBoLTRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0zLjQ3OCAyLjQwNWEuNzUuNzUgMCAwMC0uOTI2Ljk0bDIuNDMyIDcuOTA1SDEzLjVhLjc1Ljc1IDAgMDEwIDEuNUg0Ljk4NGwtMi40MzIgNy45MDVhLjc1Ljc1IDAgMDAuOTI2Ljk0IDYwLjUxOSA2MC41MTkgMCAwMDE4LjQ0NS04Ljk4Ni43NS43NSAwIDAwMC0xLjIxOEE2MC41MTcgNjAuNTE3IDAgMDAzLjQ3OCAyLjQwNXpcIiAvPlxuICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgMjogR0hJIENIXHUwMERBIENcdTFFRDhORyBUXHUwMEMxQyBcdTIwMTQgZW50cnkgYXBwZW5kLCBjXHUwMEYzIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ25vdGVzJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMiBtaW4taC0wIGgtZnVsbFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgPHNwYW4+R2hpIGNoXHUwMEZBIGNodW5nIGNcdTFFRTdhIHBoXHUwMEYybmcgXHUyMDE0IG1cdTFFRDdpIG5nXHUwMUIwXHUxRUREaSB0aFx1MDBFQW0gbVx1MUVEOXQgZFx1MDBGMm5nLCBjXHUwMEYzIHRoXHUxRUMzIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvPC9zcGFuPlxuICAgICAgICAgICAgICB7bm90ZXNOb3RpY2UgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1yb3NlLTMwMCBmb250LWJvbGRcIj57bm90ZXNOb3RpY2V9PC9zcGFuPn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHNwYWNlLXktMiBwci0xIG1pbi1oLTAgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTIuNVwiPlxuICAgICAgICAgICAgICB7bm90ZXNMaXN0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCB0ZXh0LWNlbnRlciBweS04XCI+Q2hcdTAxQjBhIGNcdTAwRjMgZ2hpIGNoXHUwMEZBIFx1MjAxNCB0aFx1MDBFQW0gZFx1MDBGMm5nIFx1MDExMVx1MUVBN3UgdGlcdTAwRUFuIGNobyBjXHUxRUEzIHBoXHUwMEYybmcuPC9wPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIG5vdGVzTGlzdC5tYXAoKG4pID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtuLmlkfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLXN0YXJ0IGdhcC0yIGdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtNDAwXCI+e24udGVufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtuLnZpZGVvVGltZVNlYyAhPSBudWxsICYmIG4udmlkZW9UaW1lU2VjID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB5ZXVDYXVUdWEobi52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIGhvdmVyOmJnLXZpb2xldC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYge2RpbmhEYW5nR2lheVBodXQobi52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNjAwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7bi50YW9MdWMgPyBuZXcgRGF0ZShuLnRhb0x1Yy5yZXBsYWNlKCcgJywgJ1QnKSArICdaJykudG9Mb2NhbGVUaW1lU3RyaW5nKFtdLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSkgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMjAwIGxlYWRpbmctcmVsYXhlZCBicmVhay13b3Jkc1wiPntuLm5vaUR1bmd9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgeyhuLmN1YVRvaSB8fCBpc1N0YWZmKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB4b2FHaGlDaHUobi5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlhvXHUwMEUxIGdoaSBjaFx1MDBGQVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcGFjaXR5LTAgZ3JvdXAtaG92ZXI6b3BhY2l0eS0xMDAgdGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1yb3NlLTQwMCB0ZXh0LVsxMHB4XSBweC0xIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHtub3Rlc0NhbldyaXRlID8gKFxuICAgICAgICAgICAgICA8Zm9ybVxuICAgICAgICAgICAgICAgIG9uU3VibWl0PXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIGlmICghZS5uYXRpdmVFdmVudD8uaXNDb21wb3NpbmcgJiYgIW5vdGVDb21wb3NpbmdSZWYuY3VycmVudCkgdGhlbUdoaUNodSgpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICBpZD1cInN0dWR5LW5vdGUtaW5wdXRcIlxuICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e25vdGVJbnB1dH1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldE5vdGVJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ9eygpID0+IHsgbm90ZUNvbXBvc2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ9eygpID0+IHsgbm90ZUNvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7IH19XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlRoXHUwMEVBbSBnaGkgY2hcdTAwRkEgY2hvIHBoXHUwMEYybmcuLi5cIlxuICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXsxMDAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTAgcm91bmRlZC14bCBweC0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmVcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXROb3RlV2l0aFRpbWUodiA9PiAhdil9XG4gICAgICAgICAgICAgICAgICB0aXRsZT17bm90ZVdpdGhUaW1lID8gJ1x1MDExMGFuZyBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbyB2XHUwMEUwbyBnaGkgY2hcdTAwRkEnIDogJ0toXHUwMEY0bmcgZ1x1MUVBRm4gbVx1MUVEMWMgdmlkZW8nfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtub3RlV2l0aFRpbWUgPyAnYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyLXZpb2xldC01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS01MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAgICAgIFx1MjNGMVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tYWRkLW5vdGVcIlxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFub3RlSW5wdXQudHJpbSgpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIHJvdW5kZWQteGwgYmctWyMwMEYyRkVdIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJsYWNrIGRpc2FibGVkOm9wYWNpdHktMzBcIj5cbiAgICAgICAgICAgICAgICAgIFRoXHUwMEVBbVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LWFtYmVyLTMwMC84MCB0ZXh0LWNlbnRlciBweS0xXCI+XHVEODNEXHVERDEyIEdoaSBjaFx1MDBGQSBcdTAxMTFhbmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSBjaFx1MUVDOSB4ZW0gXHUyMDE0IHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nIFx1MDExMVx1MDBFMyBraFx1MDBGM2EuPC9wPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDM6IEJcdTFFQTJORyBWXHUxRUJDIENcdTFFRDhORyBUXHUwMEMxQyAoU0hBUkVEIFdISVRFQk9BUkQpICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ3doaXRlYm9hcmQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0yIG1pbi1oLTAgaC1mdWxsXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBmbGV4LXdyYXAgdGV4dC14cyBwYi0xXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLXBlblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRXYlRvb2woJ3BlbicpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JUb29sID09PSAncGVuJyA/ICdiZy1bIzAwRjJGRV0gdGV4dC1ibGFjaycgOiAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAnfWB9PlxuICAgICAgICAgICAgICAgICAgXHUyNzBGXHVGRTBGIEJcdTAwRkF0IHZcdTFFQkRcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLWVyYXNlclwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRXYlRvb2woJ2VyYXNlcicpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JUb29sID09PSAnZXJhc2VyJyA/ICdiZy1yb3NlLTUwMCB0ZXh0LXdoaXRlJyA6ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCd9YH0+XG4gICAgICAgICAgICAgICAgICBcdUQ4M0VcdURERjkgVFx1MUVBOXlcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIG1sLTJcIj5cbiAgICAgICAgICAgICAgICAgIHtbJyMwMEYyRkUnLCAnI0ZGQjgwMCcsICcjRjQzRjVFJywgJyNGRkZGRkYnXS5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e2N9XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0V2JDb2xvcihjKTsgc2V0V2JUb29sKCdwZW4nKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTUgaC01IHJvdW5kZWQtZnVsbCBib3JkZXIgZGlzYWJsZWQ6b3BhY2l0eS00MCAke3diQ29sb3IgPT09IGMgJiYgd2JUb29sID09PSAncGVuJyA/ICdzY2FsZS0xMTAgYm9yZGVyLXdoaXRlIHJpbmctMiByaW5nLWN5YW4tNDAwJyA6ICdib3JkZXItdHJhbnNwYXJlbnQnfWB9XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogYyB9fVxuICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtjfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICB7aXNTdGFmZiAmJiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi13Yi1jbGVhclwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtjbGVhcldoaXRlYm9hcmR9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXdoaXRlLzUgaG92ZXI6Ymctcm9zZS01MDAvMjAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQteHMgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICBYXHUwMEYzYSBiXHUxRUEzbmdcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBvdmVyZmxvdy1oaWRkZW4gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcmVsYXRpdmUgdG91Y2gtbm9uZSBtaW4taC1bMjIwcHhdXCI+XG4gICAgICAgICAgICAgIHshd2JDYW5Xcml0ZSAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIHotMTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctYmxhY2svNDAgdGV4dC1bMTFweF0gdGV4dC1hbWJlci0zMDAvOTAgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTIgQlx1MUVBM25nIHZcdTFFQkQgXHUwMTExYW5nIFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgY2hcdTFFQzkgeGVtXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDxjYW52YXNcbiAgICAgICAgICAgICAgICBpZD1cInN0dWR5LXdoaXRlYm9hcmQtY2FudmFzXCJcbiAgICAgICAgICAgICAgICByZWY9e2NhbnZhc1JlZn1cbiAgICAgICAgICAgICAgICB3aWR0aD17NjQwfVxuICAgICAgICAgICAgICAgIGhlaWdodD17MzIwfVxuICAgICAgICAgICAgICAgIG9uTW91c2VEb3duPXt3YkNhbldyaXRlID8gc3RhcnREcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uTW91c2VNb3ZlPXt3YkNhbldyaXRlID8gZHJhd01vdmUgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZVVwPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaFN0YXJ0PXt3YkNhbldyaXRlID8gc3RhcnREcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uVG91Y2hNb3ZlPXt3YkNhbldyaXRlID8gZHJhd01vdmUgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaEVuZD17d2JDYW5Xcml0ZSA/IHN0b3BEcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBoLWZ1bGwgJHt3YkNhbldyaXRlID8gJ2N1cnNvci1jcm9zc2hhaXInIDogJ2N1cnNvci1ub3QtYWxsb3dlZCd9YH1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNDogQlx1MUVBMk5HIFRcdTAwQ0ROSCBDXHUxRUQ4TkcgVFx1MDBDMUMgKFNIQVJFRCBTSEVFVCA4eDEwKSAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdzaGVldCcgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTIgb3ZlcmZsb3cteC1hdXRvIG1pbi1oLTAgaC1mdWxsXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgIEJcdTFFQTNuZyB0XHUwMEVEbmggcGhcdTAwRTJuIHRcdTAwRURjaCBzXHUxRUQxIGxpXHUxRUM3dSAvIG1cdTFFRDFjIHRoXHUxRUREaSBnaWFuIGhcdTFFQ0RjIHRcdTFFQURwIChMXHUwMUIwdSB0XHUxRUYxIFx1MDExMVx1MUVEOW5nKVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy1hdXRvIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBiZy1bIzBCMEUxNF0gbWluLWgtMFwiPlxuICAgICAgICAgICAgICA8dGFibGUgaWQ9XCJzdHVkeS1zaGVldC10YWJsZVwiIGNsYXNzTmFtZT1cInctZnVsbCB0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIGJvcmRlci1jb2xsYXBzZVwiPlxuICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMCBmb250LW1vbm9cIj5cbiAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInctOCBwLTEgdGV4dC1jZW50ZXIgYm9yZGVyLXIgYm9yZGVyLXdoaXRlLzEwIHRleHQtWzEwcHhdXCI+IzwvdGg+XG4gICAgICAgICAgICAgICAgICAgIHtDT0xTLm1hcChjID0+IChcbiAgICAgICAgICAgICAgICAgICAgICA8dGgga2V5PXtjfSBjbGFzc05hbWU9XCJwLTEuNSB0ZXh0LWNlbnRlciBib3JkZXItciBib3JkZXItd2hpdGUvMTAgbWluLXctWzcwcHhdIHRleHQtWzExcHhdIGZvbnQtYm9sZCB0ZXh0LWN5YW4tMzAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7Y31cbiAgICAgICAgICAgICAgICAgICAgICA8L3RoPlxuICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICB7Uk9XUy5tYXAociA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDx0ciBrZXk9e3J9IGNsYXNzTmFtZT1cImJvcmRlci1iIGJvcmRlci13aGl0ZS81IGhvdmVyOmJnLXdoaXRlL1swLjAyXVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTEgdGV4dC1jZW50ZXIgYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTUwMCBmb250LW1vbm8gdGV4dC1bMTBweF0gYm9yZGVyLXIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cn1cbiAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgIHtDT0xTLm1hcChjID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNlbGxLZXkgPSBgJHtjfSR7cn1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGtleT17Y2VsbEtleX0gY2xhc3NOYW1lPVwicC0wIGJvcmRlci1yIGJvcmRlci13aGl0ZS81XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLWNlbGw9e2NlbGxLZXl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17c2hlZXRDZWxsc1tjZWxsS2V5XSB8fCAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlYWRPbmx5PXshc2hlZXRDYW5Xcml0ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRm9jdXM9eygpID0+IHsgc2hlZXRGb2N1c2VkQ2VsbFJlZi5jdXJyZW50ID0gY2VsbEtleTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17KCkgPT4geyBzaGVldEZvY3VzZWRDZWxsUmVmLmN1cnJlbnQgPSBudWxsOyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2hlZXRDYW5Xcml0ZSAmJiBoYW5kbGVDZWxsQ2hhbmdlKGNlbGxLZXksIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBiZy10cmFuc3BhcmVudCBweC0yIHB5LTEgdGV4dC14cyB0ZXh0LXdoaXRlIGZvY3VzOmJnLVsjMTUxQTIzXSBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctWyMwMEYyRkVdICR7IXNoZWV0Q2FuV3JpdGUgPyAnb3BhY2l0eS02MCBjdXJzb3Itbm90LWFsbG93ZWQnIDogJyd9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDU6IDEtVE8tMSBXRUJSVEMgVk9JQ0UgXHUyMDE0IHBhaXItYm91bmQsIGNcdTAwRjMgeGluIHF1eVx1MUVDMW4gKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAndm9pY2UnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTYgdGV4dC1jZW50ZXIgZ2FwLTRcIj5cbiAgICAgICAgICAgIDxhdWRpbyByZWY9e3JlbW90ZUF1ZGlvUmVmfSBhdXRvUGxheSAvPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTE2IGgtMTYgcm91bmRlZC0zeGwgYmctYW1iZXItNDAwLzE1IGJvcmRlciBib3JkZXItYW1iZXItNDAwLzMwIHRleHQtYW1iZXItNDAwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtM3hsIHNoYWRvdy1bMF8wXzIwcHhfcmdiYSgyNDUsMTU4LDExLDAuMildXCI+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REY5OVx1RkUwRlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtd2hpdGVcIj5UaG9cdTFFQTFpIFRyXHUxRUYxYyBUaVx1MUVCRnAgMS0xIFRyb25nIFBoXHUwMEYybmc8L2g0PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIG1heC13LXhzIG10LTFcIj5cbiAgICAgICAgICAgICAgICBNXHUxRUQ3aSBwaFx1MDBGMm5nIHRcdTFFRDFpIFx1MDExMWEgbVx1MUVEOXQgY1x1MUVCN3Agdm9pY2UgMS0xLiBNaWNybyBtXHUxRUI3YyBcdTAxMTFcdTFFQ0JuaCB0XHUxRUFGdCBraGkgY2hcdTAxQjBhIGJcdTFFQUR0LlxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFRyXHUxRUExbmcgdGhcdTAwRTFpIGNcdTFFQjdwIGhpXHUxRUM3biB0XHUxRUExaSAqL31cbiAgICAgICAgICAgIHt2b2ljZVBhaXI/LmFjdGl2ZSAhPT0gdW5kZWZpbmVkICYmIChcbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1tb25vIHRleHQtc2xhdGUtNDAwIGJnLXdoaXRlLzUgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgICAge3ZvaWNlUGFpcj8uYVRlbiA/IGAke3ZvaWNlUGFpci5hVGVufSR7dm9pY2VQYWlyLmJUZW4gPyAnIFx1MjE5NCAnICsgdm9pY2VQYWlyLmJUZW4gOiAnIFx1MDBCNyBcdTAxMTFhbmcgY2hcdTFFREQgbmdcdTAxQjBcdTFFRERpIHRoXHUxRUU5IDInfWAgOiAnQ2hcdTAxQjBhIGNcdTAwRjMgY1x1MUVCN3Agdm9pY2Ugblx1MDBFMG8nfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zIGZsZXgtd3JhcCBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICAgICAgICB7IXZvaWNlSm9pbmVkID8gKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICB7Y29RdXllbigndm9pY2UnKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLWpvaW5cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2pvaW5Wb2ljZX1cbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dm9pY2VQYWlyPy5hY3RpdmUgJiYgIXZvaWNlUGFpcj8ueW91SW59XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNSBweS0yLjUgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLW9yYW5nZS01MDAgdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQteHMgc2hhZG93LWxnIGhvdmVyOm9wYWNpdHktOTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktNDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7dm9pY2VQYWlyPy5hY3RpdmUgPyAnXHUwMTEwYW5nIGNcdTAwRjMgY1x1MUVCN3Agdm9pY2Uga2hcdTAwRTFjJyA6IHZvaWNlUGFpcj8uYVRlbiA/ICdWXHUwMEUwbyBjXHUxRUI3cCB2XHUxRURCaSAnICsgdm9pY2VQYWlyLmFUZW4gOiAnVGhhbSBnaWEgdm9pY2UnfVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1yZXF1ZXN0XCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt4aW5RdXllblZvaWNlfVxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt2b2ljZVJlcXVlc3RlZH1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIuNSByb3VuZGVkLXhsIGJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMjAwIGJvcmRlciBib3JkZXItd2hpdGUvMTUgZm9udC1ib2xkIHRleHQteHMgaG92ZXI6Ymctd2hpdGUvMTUgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHt2b2ljZVJlcXVlc3RlZCA/ICdcdTIzRjMgXHUwMTEwYW5nIGNoXHUxRUREIGR1eVx1MUVDN3RcdTIwMjYnIDogJ1x1RDgzRFx1REU0QiBYaW4gcXV5XHUxRUMxbiB2b2ljZSd9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2UtdG9nZ2xlLW1pY1wiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RvZ2dsZU1pY31cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtNCBweS0yLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7bWljTXV0ZWQgPyAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6Ymctd2hpdGUvMTUnIDogJ2JnLWVtZXJhbGQtNTAwIHRleHQtYmxhY2snfWB9PlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj57bWljTXV0ZWQgPyAnXHVEODNEXHVERDA3IEJcdTFFQUR0IE1pYycgOiAnXHVEODNDXHVERjk5XHVGRTBGIE1pYyBcdTAxMTBhbmcgQlx1MUVBRHQnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2UtbGVhdmVcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtsZWF2ZVZvaWNlfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzIwIHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8zMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgICBSXHUxRUREaSB2b2ljZVxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIHtpc1N0YWZmICYmIHZvaWNlUGFpcj8uYVRlbiAmJiAhdm9pY2VQYWlyPy55b3VJbiAmJiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1lbmRcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17bmdhdFZvaWNlQ2FwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xMCB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMjUgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMjAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgIE5nXHUxRUFGdCBjXHUxRUI3cCB2b2ljZVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBTdGFmZjogZGFuaCBzXHUwMEUxY2ggeGluIHF1eVx1MUVDMW4gdm9pY2UgKi99XG4gICAgICAgICAgICB7aXNTdGFmZiAmJiB5ZXVDYXVWb2ljZS5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgbWF4LXctc20gYmctd2hpdGUvNSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0yLjUgdGV4dC1sZWZ0XCI+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LWFtYmVyLTMwMCBtYi0xLjVcIj5cdTAxMTBhbmcgeGluIHF1eVx1MUVDMW4gdm9pY2U8L3A+XG4gICAgICAgICAgICAgICAge3lldUNhdVZvaWNlLm1hcChyID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtyLmtob2F9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgcHktMVwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTIwMCBmb250LXNlbWlib2xkIGZsZXgtMSB0cnVuY2F0ZVwiPntyLnRlbiB8fCAnVGhcdTAwRTBuaCB2aVx1MDBFQW4nfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHsgY29uc3QgZCA9IGF3YWl0IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogci5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogdHJ1ZSB9KTsgaWYgKGQ/Lm9rKSBzZXRZZXVDYXVWb2ljZShwcmV2ID0+IHByZXYuZmlsdGVyKHggPT4geC5raG9hICE9PSByLmtob2EpKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLWVtZXJhbGQtNTAwLzIwIHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctZW1lcmFsZC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICBEdXlcdTFFQzd0XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4geyBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiByLmtob2EsIGNhcGFiaWxpdHk6ICd2b2ljZScsIG9uOiBmYWxzZSB9KTsgaWYgKGQ/Lm9rKSBzZXRZZXVDYXVWb2ljZShwcmV2ID0+IHByZXYuZmlsdGVyKHggPT4geC5raG9hICE9PSByLmtob2EpKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8yNSB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICBUXHUxRUVCIGNoXHUxRUQxaVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIHt2b2ljZU5vdGljZSAmJiAoXG4gICAgICAgICAgICAgIDxwIGlkPVwidm9pY2Utc3RhdHVzLW5vdGljZVwiIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS0zMDAgZm9udC1tb25vIGJnLWJsYWNrLzQwIHB4LTMgcHktMS41IHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS81XCI+XG4gICAgICAgICAgICAgICAge3ZvaWNlTm90aWNlfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgbWF4LXcteHNcIj5cbiAgICAgICAgICAgICAgKiBHaGkgY2hcdTAwRkE6IEtcdTFFQkZ0IG5cdTFFRDFpIHRob1x1MUVBMWkgUDJQIHlcdTAwRUF1IGNcdTFFQTd1IG1cdTFFQTFuZyBraFx1MDBGNG5nIGNoXHUxRUI3biBVRFAuIFJlc3RyaWN0aXZlIE5BVCBjXHUwMEYzIHRoXHUxRUMzIGNcdTFFQTduIHJlbGF5IFRVUk4uXG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRBQiA3OiBUSFx1MDBDME5IIFZJXHUwMENBTiBUUk9ORyBQSFx1MDBEMk5HICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ21lbWJlcnMnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0zIG1pbi1oLTAgaC1mdWxsXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwYi0yIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQzY1PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlRoXHUwMEUwbmggdmlcdTAwRUFuIHRyb25nIHBoXHUwMEYybmcgKHt0aGFuaFZpZW4ubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgICBcdTAxMTBhbmcgdHJcdTFFRjFjIHR1eVx1MUVCRm5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTIgb3ZlcmZsb3cteS1hdXRvIHByLTEgbWluLWgtMFwiPlxuICAgICAgICAgICAgICB7dGhhbmhWaWVuLm1hcCgodHYsIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhSG9zdCA9IHR2LmxhQ2h1UGhvbmcgPT09IDEgfHwgdHYudmFpVHJvUGhvbmcgPT09ICdob3N0JztcbiAgICAgICAgICAgICAgICBjb25zdCBsYUdWID0gdHYudmFpVHJvID09PSAnZ2lhb192aWVuJztcbiAgICAgICAgICAgICAgICBjb25zdCBsYUNvSG9zdCA9IHR2LnZhaVRyb1Bob25nID09PSAnY29ob3N0JztcbiAgICAgICAgICAgICAgICBjb25zdCBncmFudFZvaWNlID0gZ3JhbnRzLnNvbWUoZyA9PiBnLmtob2FUViA9PT0gdHYua2hvYSAmJiBnLmNhcGFiaWxpdHkgPT09ICd2b2ljZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50VmlkZW8gPSBncmFudHMuc29tZShnID0+IGcua2hvYVRWID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZpZGVvX2NvbnRyb2wnKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgIGtleT17dHYua2hvYSB8fCB0di50ZW4gfHwgaWR4fVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41IHAtMi41IHJvdW5kZWQteGwgYmctd2hpdGUvWzAuMDNdIGhvdmVyOmJnLXdoaXRlL1swLjA2XSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgaG92ZXI6Ym9yZGVyLXRlYWwtNTAwLzI1IHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLWZ1bGwgYmctZ3JhZGllbnQtdG8tYnIgZnJvbS10ZWFsLTUwMC8yMCB0by1lbWVyYWxkLTUwMC8yMCBib3JkZXIgYm9yZGVyLXRlYWwtNTAwLzMwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteHMgZm9udC1ibGFjayB0ZXh0LXRlYWwtMzAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3R2LmF2YXRhciA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXt0di5hdmF0YXJ9IGFsdD1cIlwiIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgcm91bmRlZC1mdWxsIG9iamVjdC1jb3ZlclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICh0di50ZW4gfHwgJz8nKS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTIwMCB0cnVuY2F0ZVwiPnt0di50ZW59PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2xhSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNEXHVEQzUxIEhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUdWICYmICFsYUhvc3QgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzQ1x1REY5MyBHaVx1MDBFMW8gdmlcdTAwRUFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICB7bGFDb0hvc3QgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MkI1MCBDby1ob3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgYmxvY2sgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt0di5sb3BUZW4gPyBgTFx1MUVEQnAgJHt0di5sb3BUZW59YCA6IChsYUdWID8gJ0dpXHUwMEUxbyB2aVx1MDBFQW4gdHJcdTAxQjBcdTFFRERuZycgOiAnSFx1MUVDRGMgc2luaCcpfVxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgey8qIE1lbWJlciBhY3Rpb25zIG5cdTFFQkZ1IGxcdTAwRTAgaG9zdC9HViAqL31cbiAgICAgICAgICAgICAgICAgICAgeyh2YWlUcm9QaG9uZyA9PT0gJ2hvc3QnIHx8IGF1dGgudXNlcj8uaXNUZWFjaGVyKSAmJiAhbGFIb3N0ICYmIHR2Lmtob2EgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/Lignc2V0X2NvX2hvc3QnLCB7IGtob2FUVjogdHYua2hvYSwgb246ICFsYUNvSG9zdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2xhQ29Ib3N0ID8gJ1RodSBxdXlcdTFFQzFuIGNvLWhvc3QnIDogJ0NcdTFFQTVwIGNvLWhvc3QnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFDb0hvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlci12aW9sZXQtNTAwLzQwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjby1ob3N0XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246ICFncmFudFZvaWNlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNcdTFFQTVwL3RodSBxdXlcdTFFQzFuIG1pY1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNiBoLTYgcm91bmRlZCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LVsxMHB4XSBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFudFZvaWNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC80MCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERjk5XHVGRTBGXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZpZGVvX2NvbnRyb2wnLCBvbjogIWdyYW50VmlkZW8gfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gdmlkZW9cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTYgaC02IHJvdW5kZWQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTBweF0gYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JhbnRWaWRlb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctYmx1ZS01MDAvMjAgdGV4dC1ibHVlLTMwMCBib3JkZXItYmx1ZS01MDAvNDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzQ1x1REZBNVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpcm0oYEtpY2sgJHt0di50ZW59IGtoXHUxRUNGaSBwaFx1MDBGMm5nP2ApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdraWNrJywgeyBraG9hVFY6IHR2Lmtob2EgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZCAmJiAhZC5vaykgYWxlcnQoZC5sb2kgfHwgJ0toXHUwMEY0bmcga2ljayBcdTAxMTFcdTAxQjBcdTFFRTNjLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJLaWNrIGtoXHUxRUNGaSBwaFx1MDBGMm5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy02IGgtNiByb3VuZGVkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGJvcmRlciBiZy1yb3NlLTUwMC8xMCB0ZXh0LXJvc2UtMzAwIGJvcmRlci1yb3NlLTUwMC8yNSBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSl9XG5cbiAgICAgICAgICAgICAge3RoYW5oVmllbi5sZW5ndGggPT09IDAgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgcHktOCB0ZXh0LXNsYXRlLTUwMCB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgICBDaFx1MDFCMGEgY1x1MDBGMyB0aFx1MDBFMG5oIHZpXHUwMEVBbiBuXHUwMEUwbyB0cm9uZyBwaFx1MDBGMm5nLlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cblxuXG4gICAgICAgIHsvKiBUQUIgNjogUVVcdTFFQTJOIFRSXHUxRUNBIFBIXHUwMEQyTkcgKHN0YWZmIG9ubHkpIFx1MjAxNCBwb2xpY3kgbWF0cml4ICsgbWVtYmVyIGFjdGlvbnMgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAncXVhbi10cmknICYmIGlzU3RhZmYgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTMgb3ZlcmZsb3cteS1hdXRvIG1pbi1oLTAgcHItMSBoLWZ1bGxcIj5cbiAgICAgICAgICAgIHsvKiBRdWljayBhY3Rpb25zIHRoZW8gbVx1MDBGNCBoXHUwMEVDbmggXHUwMTExXHUwMEUzIGNoXHUxRUQxdCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNhcCBvZiBbJ25vdGVzJywgJ3doaXRlYm9hcmQnLCAnc2hlZXQnXSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiAxLCBhY2Nlc3NNb2RlOiAnc3RhZmZfb25seScgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTIgS2hcdTAwRjNhIGNcdTFFRDluZyB0XHUwMEUxYyAoY2hcdTFFQzkgeGVtKVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2FwIG9mIFsnbm90ZXMnLCAnd2hpdGVib2FyZCcsICdzaGVldCddKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6ICdldmVyeW9uZScgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgaG92ZXI6YmctZW1lcmFsZC01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTMgTVx1MUVERiBjXHUxRUQ5bmcgdFx1MDBFMWMgY2hvIG1cdTFFQ0RpIG5nXHUwMUIwXHUxRUREaVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogUG9saWN5IG1hdHJpeCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTNcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBtYi0yXCI+Q2hcdTAwRURuaCBzXHUwMEUxY2ggY1x1MDBGNG5nIGNcdTFFRTU8L3A+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgICB7W1xuICAgICAgICAgICAgICAgICAgWyd2aWRlb19jb250cm9sJywgJ1x1MDExMGlcdTFFQzF1IGtoaVx1MUVDM24gcGhcdTAwRTF0IChwbGF5L3BhdXNlL3R1YSknXSxcbiAgICAgICAgICAgICAgICAgIFsndmlkZW9fY2hhbmdlJywgJ1x1MDExMFx1MUVENWkgdmlkZW8gXHUwMTExYW5nIHBoXHUwMEUxdCddLFxuICAgICAgICAgICAgICAgICAgWydxdWV1ZScsICdIXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB2aWRlbyddLFxuICAgICAgICAgICAgICAgICAgWydjaGF0JywgJ0NoYXQgcGhcdTAwRjJuZyddLFxuICAgICAgICAgICAgICAgICAgWydub3RlcycsICdHaGkgY2hcdTAwRkEgY2h1bmcnXSxcbiAgICAgICAgICAgICAgICAgIFsnd2hpdGVib2FyZCcsICdCXHUxRUEzbmcgdlx1MUVCRCddLFxuICAgICAgICAgICAgICAgICAgWydzaGVldCcsICdCXHUxRUEzbmcgdFx1MDBFRG5oJ10sXG4gICAgICAgICAgICAgICAgICBbJ3ZvaWNlJywgJ1ZvaWNlIDEtMSddLFxuICAgICAgICAgICAgICAgICAgWydpbnZpdGUnLCAnTVx1MUVERGkgbmdcdTAxQjBcdTFFRERpIHZcdTAwRTBvIHBoXHUwMEYybmcnXSxcbiAgICAgICAgICAgICAgICBdLm1hcCgoW2NhcCwgbmhhbl0pID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHBvbCA9IHBvbGljaWVzPy5bY2FwXSB8fCB7IGVuYWJsZWQ6IDEsIGFjY2Vzc19tb2RlOiAnc3RhZmZfb25seScgfTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtjYXB9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmbGV4LTEgdGV4dC1zbGF0ZS0zMDAgdHJ1bmNhdGVcIj57bmhhbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiBwb2wuZW5hYmxlZCA/IDAgOiAxLCBhY2Nlc3NNb2RlOiBwb2wuYWNjZXNzX21vZGUgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cG9sLmVuYWJsZWQgPyAnXHUwMTEwYW5nIGJcdTFFQUR0IFx1MjAxNCBiXHUxRUE1bSBcdTAxMTFcdTFFQzMgdFx1MUVBRnQnIDogJ1x1MDExMGFuZyB0XHUxRUFGdCBcdTIwMTQgYlx1MUVBNW0gXHUwMTExXHUxRUMzIGJcdTFFQUR0J31cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctOCBoLTQuNSBweC0wLjUgcm91bmRlZC1mdWxsIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciAke3BvbC5lbmFibGVkID8gJ2JnLWVtZXJhbGQtNTAwLzMwIGJvcmRlci1lbWVyYWxkLTUwMC80MCBqdXN0aWZ5LWVuZCcgOiAnYmctd2hpdGUvNSBib3JkZXItd2hpdGUvMTUganVzdGlmeS1zdGFydCd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTMgaC0zIHJvdW5kZWQtZnVsbCAke3BvbC5lbmFibGVkID8gJ2JnLWVtZXJhbGQtNDAwJyA6ICdiZy1zbGF0ZS01MDAnfWB9Pjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17cG9sLmFjY2Vzc19tb2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFwb2wuZW5hYmxlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0xLjUgcHktMSB0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTIwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwic3RhZmZfb25seVwiPlF1XHUxRUEzbiB0clx1MUVDQjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInNlbGVjdGVkX21lbWJlcnNcIj5NXHUxRUQ5dCBzXHUxRUQxIG5nXHUwMUIwXHUxRUREaTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImV2ZXJ5b25lXCI+TVx1MUVDRGkgbmdcdTAxQjBcdTFFRERpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgb3BhY2l0eS02MFwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmxleC0xIHRleHQtc2xhdGUtNDAwXCI+S2lcdTFFQzNtIGR1eVx1MUVDN3QgKGtpY2sveG9cdTAwRTEgdGluKTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gZm9udC1ib2xkIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHJvdW5kZWQgcHgtMS41IHB5LTAuNVwiPkxVXHUwMEQ0TiBRVVx1MUVBMk4gVFJcdTFFQ0E8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBRdVx1MUVBM24gbFx1MDBGRCB0aFx1MDBFMG5oIHZpXHUwMEVBbiAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTNcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBtYi0yXCI+VGhcdTAwRTBuaCB2aVx1MDBFQW4gJiBxdXlcdTFFQzFuIHJpXHUwMEVBbmc8L3A+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgICB7KHRoYW5oVmllbiB8fCBbXSkubWFwKHR2ID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhSG9zdCA9IEJvb2xlYW4odHYubGFDaHVQaG9uZyk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUdWID0gdHYudmFpVHJvID09PSAnZ2lhb192aWVuJztcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhQ29Ib3N0ID0gdHYudmFpVHJvUGhvbmcgPT09ICdjb19ob3N0JztcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50Vm9pY2UgPSAoZ3JhbnRzIHx8IFtdKS5zb21lKGcgPT4gZy5raG9hID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZvaWNlJyAmJiBnLnRyYW5nVGhhaSA9PT0gJ2dyYW50ZWQnKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50VmlkZW8gPSAoZ3JhbnRzIHx8IFtdKS5zb21lKGcgPT4gZy5raG9hID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZpZGVvX2NvbnRyb2wnICYmIGcudHJhbmdUaGFpID09PSAnZ3JhbnRlZCcpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3R2Lmtob2EgfHwgdHYudGVufSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHRleHQteHMgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0yMDAgZm9udC1zZW1pYm9sZCB0cnVuY2F0ZSBtYXgtdy1bMTEwcHhdXCI+e3R2LnRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAge2xhSG9zdCAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtYW1iZXItNDAwIGZvbnQtYm9sZFwiPlx1MjYwNSBob3N0PC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7bGFHViAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtWyMwMEYyRkVdIGZvbnQtYm9sZFwiPkdWPC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7bGFDb0hvc3QgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXZpb2xldC0zMDAgZm9udC1ib2xkXCI+Y28taG9zdDwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAgeyFsYUhvc3QgJiYgIWxhR1YgJiYgdHYua2hvYSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtbC1hdXRvIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHsodmFpVHJvUGhvbmcgPT09ICdob3N0JyB8fCBhdXRoLnVzZXI/LmlzVGVhY2hlcikgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdzZXRfY29faG9zdCcsIHsga2hvYVRWOiB0di5raG9hLCBvbjogIWxhQ29Ib3N0IH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2xhQ29Ib3N0ID8gJ1RodSBxdXlcdTFFQzFuIGNvLWhvc3QnIDogJ0NcdTFFQTVwIGNvLWhvc3QnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2xhQ29Ib3N0ID8gJ2JnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlci12aW9sZXQtNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246ICFncmFudFZvaWNlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gdm9pY2VcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgJHtncmFudFZvaWNlID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHR2Lmtob2EsIGNhcGFiaWxpdHk6ICd2aWRlb19jb250cm9sJywgb246ICFncmFudFZpZGVvIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiB2aWRlb1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2dyYW50VmlkZW8gPyAnYmctY3lhbi01MDAvMjAgdGV4dC1jeWFuLTMwMCBib3JkZXItY3lhbi01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHsgaWYgKGNvbmZpcm0oYEtpY2sgJHt0di50ZW59IGtoXHUxRUNGaSBwaFx1MDBGMm5nP2ApKSB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2tpY2snLCB7IGtob2FUVjogdHYua2hvYSB9KTsgaWYgKGQgJiYgIWQub2spIGFsZXJ0KGQubG9pIHx8ICdLaFx1MDBGNG5nIGtpY2sgXHUwMTExXHUwMUIwXHUxRUUzYy4nKTsgfSB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiS2ljayBraFx1MUVDRmkgcGhcdTAwRjJuZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciBiZy1yb3NlLTUwMC8xMCB0ZXh0LXJvc2UtMzAwIGJvcmRlci1yb3NlLTUwMC8yNSBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgIHsodGhhbmhWaWVuIHx8IFtdKS5sZW5ndGggPT09IDAgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDBcIj5DaFx1MDFCMGEgY1x1MDBGMyB0aFx1MDBFMG5oIHZpXHUwMEVBbi48L3A+fVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogXHUwMTEwXHUxRUQ1aS9iXHUxRUNGIG1cdTFFQUR0IGtoXHUxRUE5dSBcdTIwMTQgY2hcdTFFQzkgaG9zdC9HViAqL31cbiAgICAgICAgICAgIHsodmFpVHJvUGhvbmcgPT09ICdob3N0JyB8fCBhdXRoLnVzZXI/LmlzVGVhY2hlcikgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0zIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJNXHUxRUFEdCBraFx1MUVBOXUgbVx1MUVEQmkgKFx1MDExMVx1MUVDMyB0clx1MUVEMW5nID0gYlx1MUVDRiBtXHUxRUFEdCBraFx1MUVBOXUpXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtcGhvbmctbWF0LWtoYXUtbW9pXCJcbiAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17MTAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnB1dC1waG9uZy1tYXQta2hhdS1tb2knKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWsgPSBlbD8udmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBtay50cmltKClcbiAgICAgICAgICAgICAgICAgICAgICA/IGF3YWl0IGhhbmhEb25nUGhvbmc/LignZG9pX21hdF9raGF1JywgeyBtYXRLaGF1TW9pOiBtay50cmltKCkgfSlcbiAgICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IGhhbmhEb25nUGhvbmc/LignYm9fbWF0X2toYXUnLCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkICYmICFkLm9rKSBhbGVydChkLmxvaSB8fCAnS2hcdTAwRjRuZyBcdTAxMTFcdTFFRDVpIFx1MDExMVx1MDFCMFx1MUVFM2MgbVx1MUVBRHQga2hcdTFFQTl1LicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWwpIGVsLnZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC1sZyBiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLWFtYmVyLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgXHUwMTEwXHUxRUQ1aSAvIEJcdTFFQ0ZcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDYW1wdXNXYXRjaFRvZ2V0aGVyKHtcbiAgcGhvbmcsXG4gIHBob25nTWluaEtob2E6IF9waG9uZ01pbmhLaG9hLFxuICBhdXRoLFxuICBkb25nUGhvbmdIaWVuVGFpOiBfZG9uZ1Bob25nSGllblRhaSxcbiAgc29OZ3VvaTogX3NvTmd1b2ksXG4gIG15Q2FwcyxcbiAgdmlkZW9UaW1lUmVmLFxuICBpc1Jvb21XaWRlLFxuICBsYXlvdXRSYXRpbyA9ICc2OjQnLFxuICBoYW5oRG9uZ1Bob25nOiBfaGFuaERvbmdQaG9uZyxcbiAgaXNTdGFmZiA9IGZhbHNlLFxufSkge1xuICBjb25zdCBbd2F0Y2hTdGF0ZSwgc2V0V2F0Y2hTdGF0ZV0gPSB1c2VTdGF0ZSh7XG4gICAgcGxheWluZzogZmFsc2UsXG4gICAgcG9zaXRpb25TZWNvbmRzOiAwLFxuICAgIGJhc2VQb3NpdGlvblNlY29uZHM6IDAsXG4gICAgcGxheWJhY2tSYXRlOiAxLjAsXG4gICAgcmV2aXNpb246IDEsXG4gICAgdXBkYXRlZEF0OiAnJyxcbiAgICBzZXJ2ZXJOb3c6ICcnLFxuICAgIHVwZGF0ZWRCeTogJydcbiAgfSk7XG4gIGNvbnN0IFtjYW5Db250cm9sLCBzZXRDYW5Db250cm9sXSA9IHVzZVN0YXRlKEJvb2xlYW4oXG4gICAgYXV0aD8udXNlcj8uaXNUZWFjaGVyIHx8IHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nIHx8IG15Q2Fwcz8udmlkZW9fY29udHJvbCB8fCBteUNhcHM/LnZpZGVvX2NoYW5nZSB8fCBpc1N0YWZmXG4gICkpO1xuICBjb25zdCBbX3dhdGNoQ2Fwcywgc2V0V2F0Y2hDYXBzXSA9IHVzZVN0YXRlKHt9KTtcbiAgY29uc3QgZ2V0SW5pdGlhbFZpZGVvVXJsID0gKCkgPT4ge1xuICAgIGxldCBjID0ge307XG4gICAgdHJ5IHsgYyA9IHBob25nPy5jYXVIaW5oID8gSlNPTi5wYXJzZShwaG9uZy5jYXVIaW5oKSA6IHt9OyB9IGNhdGNoIHsgfVxuICAgIHJldHVybiBjLnZpZGVvVXJsIHx8IHBob25nPy52aWRlb1VybCB8fCAnJztcbiAgfTtcblxuICBjb25zdCBnZXRJbml0aWFsUHJvdmlkZXIgPSAodSkgPT4ge1xuICAgIGlmICghdSkgcmV0dXJuICdVTlNVUFBPUlRFRCc7XG4gICAgaWYgKGlkWW91dHViZSh1KSkgcmV0dXJuICdZT1VUVUJFJztcbiAgICBpZiAoaWRHb29nbGVEcml2ZSh1KSkgcmV0dXJuICdHT09HTEVfRFJJVkUnO1xuICAgIGlmIChsYVZpZGVvVHJ1Y1RpZXBGZSh1KSkgcmV0dXJuICdOQVRJVkVfSFRNTDUnO1xuICAgIHJldHVybiAnVU5TVVBQT1JURUQnO1xuICB9O1xuXG4gIGNvbnN0IGluaXRVcmwgPSBnZXRJbml0aWFsVmlkZW9VcmwoKTtcbiAgY29uc3QgW2FjdGl2ZVZpZGVvVXJsLCBzZXRBY3RpdmVWaWRlb1VybF0gPSB1c2VTdGF0ZShpbml0VXJsKTtcbiAgY29uc3QgW3Byb3ZpZGVyLCBzZXRQcm92aWRlcl0gPSB1c2VTdGF0ZSgoKSA9PiBnZXRJbml0aWFsUHJvdmlkZXIoaW5pdFVybCkpO1xuICBjb25zdCBbaGFzSW50ZXJhY3RlZCwgc2V0SGFzSW50ZXJhY3RlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2NhbFRpbWUsIHNldExvY2FsVGltZV0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW2R1cmF0aW9uLCBzZXREdXJhdGlvbl0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW2RhbmdHdWlMZW5oLCBzZXREYW5nR3VpTGVuaF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2ksIHNldExvaV0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gQ2hcdTFFQkYgXHUwMTExXHUxRUQ5IHhlbSB0clx1MUVGMWMgdGlcdTFFQkZwIGNcdTAwRjluZyBjaFx1MUVFNyBwaFx1MDBGMm5nIGhheSB0XHUxRUExbSBkXHUxRUVCbmcveGVtIHJpXHUwMEVBbmcgY1x1MUVFN2EgbmdcdTAxQjBcdTFFRERpIHRoYW0gZ2lhXG4gIGNvbnN0IFtpc0xpdmVXaXRoSG9zdCwgc2V0SXNMaXZlV2l0aEhvc3RdID0gdXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IGlzTGl2ZVdpdGhIb3N0UmVmID0gdXNlUmVmKHRydWUpO1xuICBjb25zdCBbdmlld2VySXNQYXVzZWQsIHNldFZpZXdlcklzUGF1c2VkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgaXNQcm9ncmFtbWF0aWNBY3Rpb25SZWYgPSB1c2VSZWYoZmFsc2UpO1xuXG4gIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDXHUxRUE0VSBIXHUwMENDTkggVklERU8sIFRcdTAwQ0NNIEtJXHUxRUJFTSBZT1VUVUJFICYgSFx1MDBDME5HIFx1MDExMFx1MUVFMkkgVFx1MUVBMEkgVlx1MDBEOU5HIDEgXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IFttZWRpYVRhYiwgc2V0TWVkaWFUYWJdID0gdXNlU3RhdGUoJ3NlYXJjaCcpOyAvLyAnc2VhcmNoJyB8ICdxdWV1ZSdcbiAgY29uc3QgW3ZpZGVvTW9pLCBzZXRWaWRlb01vaV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtkYW5nRG9pVmlkZW8sIHNldERhbmdEb2lWaWRlb10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2lWaWRlbywgc2V0TG9pVmlkZW9dID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbdGhvbmdCYW9WaWRlbywgc2V0VGhvbmdCYW9WaWRlb10gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gWW91VHViZSBTZWFyY2ggU3RhdGVcbiAgY29uc3QgW3l0UXVlcnksIHNldFl0UXVlcnldID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbeXRSZXN1bHRzLCBzZXRZdFJlc3VsdHNdID0gdXNlU3RhdGUoW10pO1xuICBjb25zdCBbc2VhcmNoaW5nWXQsIHNldFNlYXJjaGluZ1l0XSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3NlYXJjaExvaSwgc2V0U2VhcmNoTG9pXSA9IHVzZVN0YXRlKCcnKTtcblxuICAvLyBRdWV1ZSBTdGF0ZVxuICBjb25zdCBbcXVldWVMaXN0LCBzZXRRdWV1ZUxpc3RdID0gdXNlU3RhdGUoW10pO1xuICBjb25zdCBbcXVldWVCdXN5LCBzZXRRdWV1ZUJ1c3ldID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbZGFNb1JvbmdTdHVkaW8sIHNldERhTW9Sb25nU3R1ZGlvXSA9IHVzZVN0YXRlKHRydWUpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nIHx8IGF1dGg/LnVzZXI/LmlzVGVhY2hlciB8fCBteUNhcHM/LnZpZGVvX2NvbnRyb2wgfHwgbXlDYXBzPy52aWRlb19jaGFuZ2UgfHwgaXNTdGFmZikge1xuICAgICAgc2V0Q2FuQ29udHJvbCh0cnVlKTtcbiAgICB9XG4gIH0sIFtwaG9uZz8uY2FuQ29udHJvbCwgcGhvbmc/LmxhQ2h1UGhvbmcsIGF1dGg/LnVzZXI/LmlzVGVhY2hlciwgbXlDYXBzLCBpc1N0YWZmXSk7XG5cbiAgLy8gVFx1MUVBM2kgZGFuaCBzXHUwMEUxY2ggaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdFx1MUVFQiBzZXJ2ZXJcbiAgY29uc3QgdGFpUXVldWUgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLXF1ZXVlP3Bob25nSWQ9JHtwaG9uZy5pZH0mYWN0aW9uPWxpc3RgKTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHNldFF1ZXVlTGlzdChkLnF1ZXVlIHx8IFtdKTtcbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICB0YWlRdWV1ZSgpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaSh0YWlRdWV1ZSksIDQwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgfSwgW3Bob25nLmlkXSk7XG5cbiAgLy8gXHUwMTEwXHUxRUQ1aSB2aWRlbyBcdTAxMTFhbmcgcGhcdTAwRTF0XG4gIGNvbnN0IGRvaVZpZGVvID0gYXN5bmMgKHVybCwgdGl0bGUpID0+IHtcbiAgICBjb25zdCB1ID0gU3RyaW5nKHVybCB8fCB2aWRlb01vaSB8fCB5dFF1ZXJ5IHx8ICcnKS50cmltKCk7XG4gICAgaWYgKCF1IHx8IGRhbmdEb2lWaWRlbykgcmV0dXJuO1xuICAgIHNldERhbmdEb2lWaWRlbyh0cnVlKTtcbiAgICBzZXRMb2lWaWRlbygnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXdhdGNoJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3NldF92aWRlbycsIHZpZGVvVXJsOiB1LCBhdXRvUGxheTogdHJ1ZSB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghZC5vaykge1xuICAgICAgICBzZXRMb2lWaWRlbyhkLmxvaSB8fCAnS2hcdTAwRjRuZyBcdTAxMTFcdTFFRDVpIFx1MDExMVx1MDFCMFx1MUVFM2MgdmlkZW8uJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRBY3RpdmVWaWRlb1VybCh1KTtcbiAgICAgICAgc2V0UHJvdmlkZXIoZ2V0SW5pdGlhbFByb3ZpZGVyKHUpKTtcbiAgICAgICAgc2V0VmlkZW9Nb2koJycpO1xuICAgICAgICBpZiAoZC5zdGF0ZSkge1xuICAgICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgICAgc2V0TG9jYWxUaW1lKDApO1xuICAgICAgICB9XG4gICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gMDtcbiAgICAgICAgc2V0RHVyYXRpb24oMCk7XG4gICAgICAgIGNvbnN0IG5ld1l0SWQgPSBpZFlvdXR1YmUodSk7XG4gICAgICAgIGlmIChuZXdZdElkICYmIHl0UGxheWVyUmVmLmN1cnJlbnQgJiYgeXRSZWFkeVJlZi5jdXJyZW50ICYmIHR5cGVvZiB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkKHsgdmlkZW9JZDogbmV3WXRJZCwgc3RhcnRTZWNvbmRzOiAwIH0pO1xuICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTtcbiAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgc2V0VGhvbmdCYW9WaWRlbyhgXHUwMTEwYW5nIHBoXHUwMEUxdDogJHt0aXRsZSB8fCB1fWApO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCA0MDAwKTtcbiAgICAgICAgdGFpUXVldWUoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaVZpZGVvKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RGFuZ0RvaVZpZGVvKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gVFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmVcbiAgY29uc3QgdGltS2llbVlvdVR1YmUgPSBhc3luYyAoZSwgdHVLaG9hKSA9PiB7XG4gICAgZT8ucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBxID0gU3RyaW5nKHR1S2hvYSB8fCB5dFF1ZXJ5IHx8ICcnKS50cmltKCk7XG4gICAgaWYgKCFxIHx8IHNlYXJjaGluZ1l0KSByZXR1cm47XG4gICAgaWYgKHR1S2hvYSkgc2V0WXRRdWVyeSh0dUtob2EpO1xuXG4gICAgLy8gTlx1MUVCRnUgbmdcdTAxQjBcdTFFRERpIGRcdTAwRjluZyBkXHUwMEUxbiBsaVx1MDBFQW4ga1x1MUVCRnQgdmlkZW8gWW91VHViZVxuICAgIGNvbnN0IGlkWXQgPSBpZFlvdXR1YmUocSk7XG4gICAgaWYgKGlkWXQpIHtcbiAgICAgIHNldFl0UmVzdWx0cyhbe1xuICAgICAgICB2aWRlb0lkOiBpZFl0LFxuICAgICAgICB0aXRsZTogJ1ZpZGVvIFlvdVR1YmUgKHRcdTFFRUIgbGlcdTAwRUFuIGtcdTFFQkZ0IFx1MDExMVx1MDBFMyBkXHUwMEUxbiknLFxuICAgICAgICBjaGFubmVsVGl0bGU6ICdZb3VUdWJlJyxcbiAgICAgICAgdGh1bWJuYWlsOiBgaHR0cHM6Ly9pLnl0aW1nLmNvbS92aS8ke2lkWXR9L2hxZGVmYXVsdC5qcGdgLFxuICAgICAgICBwdWJsaXNoZWRBdDogJ1RyXHUxRUYxYyB0aVx1MUVCRnAnXG4gICAgICB9XSk7XG4gICAgICBzZXRTZWFyY2hMb2koJycpO1xuICAgICAgc2V0TWVkaWFUYWIoJ3NlYXJjaCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldFNlYXJjaGluZ1l0KHRydWUpO1xuICAgIHNldFNlYXJjaExvaSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3lvdXR1YmUtc2VhcmNoP3E9JHtlbmNvZGVVUklDb21wb25lbnQocSl9YCk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIEFycmF5LmlzQXJyYXkoZC5pdGVtcykpIHtcbiAgICAgICAgaWYgKGQuaXRlbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgc2V0U2VhcmNoTG9pKCdLaFx1MDBGNG5nIHRcdTAwRUNtIHRoXHUxRUE1eSB2aWRlbyBuXHUwMEUwbyBwaFx1MDBGOSBoXHUxRUUzcCB2XHUxRURCaSB0XHUxRUVCIGtoXHUwMEYzYSBuXHUwMEUweS4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRZdFJlc3VsdHMoZC5pdGVtcyk7XG4gICAgICAgICAgc2V0TWVkaWFUYWIoJ3NlYXJjaCcpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRTZWFyY2hMb2koZC5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgdFx1MDBFQ20ga2lcdTFFQkZtIHZpZGVvIGxcdTAwRkFjIG5cdTAwRTB5LicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0U2VhcmNoTG9pKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBraGkgdFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmUuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFNlYXJjaGluZ1l0KGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdmlkZW9SZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IHl0UGxheWVyUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCB5dENvbnRhaW5lcklkID0gYHl0LXBsYXllci0ke3Bob25nLmlkfWA7XG4gIGNvbnN0IGlzU2Vla2luZ1JlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGhhc0ludGVyYWN0ZWRSZWYgPSB1c2VSZWYoZmFsc2UpO1xuICBjb25zdCBkdXJhdGlvblJlZiA9IHVzZVJlZigwKTtcbiAgY29uc3QgaGFzVHJpZ2dlcmVkU2tpcFJlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGlzU2tpcHBpbmdSZWYgPSB1c2VSZWYoZmFsc2UpO1xuXG4gIC8vIFRoYW8gdFx1MDBFMWMgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgKGVucXVldWUsIGFkZF9uZXh0LCBwbGF5X25vdywgc2tpcCwgcmVtb3ZlKVxuICBjb25zdCBoYW5oRG9uZ1F1ZXVlID0gYXN5bmMgKGFjdGlvbiwgZXh0cmEgPSB7fSkgPT4ge1xuICAgIGlmIChhY3Rpb24gPT09ICdza2lwJykge1xuICAgICAgaWYgKGlzU2tpcHBpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChxdWV1ZUJ1c3kpIHJldHVybjtcbiAgICAgIHNldFF1ZXVlQnVzeSh0cnVlKTtcbiAgICB9XG4gICAgc2V0TG9pVmlkZW8oJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1xdWV1ZScsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb24sIC4uLmV4dHJhIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSB7XG4gICAgICAgIHNldExvaVZpZGVvKGQubG9pIHx8ICdUaGFvIHRcdTAwRTFjIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHRoXHUxRUE1dCBiXHUxRUExaS4nKTtcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ3NraXAnKSB7XG4gICAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChhY3Rpb24gPT09ICdlbnF1ZXVlJykge1xuICAgICAgICAgIHNldFRob25nQmFvVmlkZW8oYFx1MDExMFx1MDBFMyB0aFx1MDBFQW0gdlx1MDBFMG8gY3VcdTFFRDFpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpOiAke2V4dHJhLnRpdGxlIHx8ICdWaWRlbyd9YCk7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUaG9uZ0Jhb1ZpZGVvKCcnKSwgMzUwMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAnYWRkX25leHQnKSB7XG4gICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbyhgXHUwMTEwXHUwMEUzIHRoXHUwMEVBbSBwaFx1MDBFMXQga1x1MUVCRiB0aVx1MUVCRnA6ICR7ZXh0cmEudGl0bGUgfHwgJ1ZpZGVvJ31gKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCAzNTAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdwbGF5X25vdycgfHwgYWN0aW9uID09PSAnc2tpcCcpIHtcbiAgICAgICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gMDtcbiAgICAgICAgICBzZXREdXJhdGlvbigwKTtcbiAgICAgICAgICBpZiAoZC52aWRlb1VybCkge1xuICAgICAgICAgICAgc2V0QWN0aXZlVmlkZW9VcmwoZC52aWRlb1VybCk7XG4gICAgICAgICAgICBzZXRQcm92aWRlcihnZXRJbml0aWFsUHJvdmlkZXIoZC52aWRlb1VybCkpO1xuICAgICAgICAgICAgaWYgKGQuc3RhdGUpIHtcbiAgICAgICAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgICAgICAgc2V0TG9jYWxUaW1lKDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbmV3WXRJZCA9IGlkWW91dHViZShkLnZpZGVvVXJsKTtcbiAgICAgICAgICAgIGlmIChuZXdZdElkICYmIHl0UGxheWVyUmVmLmN1cnJlbnQgJiYgeXRSZWFkeVJlZi5jdXJyZW50ICYmIHR5cGVvZiB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQoeyB2aWRlb0lkOiBuZXdZdElkLCBzdGFydFNlY29uZHM6IDAgfSk7XG4gICAgICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbygnXHUwMTEwYW5nIGNodXlcdTFFQzNuIHZpZGVvIHRpXHUxRUJGcCB0aGVvLi4uJyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCAzMDAwKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGQuZW1wdHkpIHtcbiAgICAgICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNldFRob25nQmFvVmlkZW8oJ0hcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIFx1MDExMVx1MDBFMyBoXHUxRUJGdCB2aWRlby4nKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VGhvbmdCYW9WaWRlbygnJyksIDMwMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0YWlRdWV1ZSgpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0TG9pVmlkZW8oJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgICAgaWYgKGFjdGlvbiA9PT0gJ3NraXAnKSB7XG4gICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKGFjdGlvbiAhPT0gJ3NraXAnKSB7XG4gICAgICAgIHNldFF1ZXVlQnVzeShmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbGV0IGMgPSB7fTtcbiAgICB0cnkgeyBjID0gcGhvbmc/LmNhdUhpbmggPyBKU09OLnBhcnNlKHBob25nLmNhdUhpbmgpIDoge307IH0gY2F0Y2ggeyB9XG4gICAgY29uc3QgbmV4dFVybCA9IGMudmlkZW9VcmwgfHwgcGhvbmc/LnZpZGVvVXJsIHx8ICcnO1xuICAgIGlmIChuZXh0VXJsICYmIG5leHRVcmwgIT09IGFjdGl2ZVZpZGVvVXJsKSB7XG4gICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IDA7XG4gICAgICBzZXREdXJhdGlvbigwKTtcbiAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKG5leHRVcmwpO1xuICAgICAgc2V0UHJvdmlkZXIoZ2V0SW5pdGlhbFByb3ZpZGVyKG5leHRVcmwpKTtcbiAgICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgc2V0SXNMaXZlV2l0aEhvc3QodHJ1ZSk7XG4gICAgICBzZXRWaWV3ZXJJc1BhdXNlZChmYWxzZSk7XG4gICAgfVxuICB9LCBbcGhvbmc/LmNhdUhpbmgsIHBob25nPy52aWRlb1VybF0pO1xuXG4gIGNvbnN0IHZpZGVvVXJsID0gYWN0aXZlVmlkZW9Vcmw7XG4gIGNvbnN0IHl0SWQgPSB2aWRlb1VybCA/IGlkWW91dHViZSh2aWRlb1VybCkgOiBudWxsO1xuICBjb25zdCBkcnZJZCA9IHZpZGVvVXJsID8gaWRHb29nbGVEcml2ZSh2aWRlb1VybCkgOiBudWxsO1xuICBjb25zdCB0cnVjVGllcFVybCA9IHZpZGVvVXJsICYmICF5dElkICYmICFkcnZJZCAmJiBsYVZpZGVvVHJ1Y1RpZXBGZSh2aWRlb1VybCkgPyB1cmxNZWRpYUZlKHZpZGVvVXJsKSA6ICcnO1xuXG4gIGNvbnN0IFtfeXRQbGF5ZXJSZWFkeSwgc2V0WXRQbGF5ZXJSZWFkeV0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IHl0UmVhZHlSZWYgPSB1c2VSZWYoZmFsc2UpO1xuICBjb25zdCBjdXJyZW50WXRJZFJlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgaGFzU2Vla2VkSW5pdFJlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGxhc3RIb3N0U3luY1RpbWVSZWYgPSB1c2VSZWYoMCk7XG4gIGNvbnN0IGxhc3RBcHBsaWVkUmV2aXNpb25SZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IGxhc3RIb3N0VHJhY2tUaW1lUmVmID0gdXNlUmVmKHsgdGltZTogMCwgc3RhbXA6IERhdGUubm93KCkgfSk7XG5cbiAgY29uc3Qgd2F0Y2hTdGF0ZVJlZiA9IHVzZVJlZih3YXRjaFN0YXRlKTtcbiAgd2F0Y2hTdGF0ZVJlZi5jdXJyZW50ID0gd2F0Y2hTdGF0ZTtcbiAgY29uc3QgZGFuZ0d1aUxlbmhSZWYgPSB1c2VSZWYoZGFuZ0d1aUxlbmgpO1xuICBkYW5nR3VpTGVuaFJlZi5jdXJyZW50ID0gZGFuZ0d1aUxlbmg7XG4gIGNvbnN0IGd1aUxlbmhSZWYgPSB1c2VSZWYobnVsbCk7XG5cbiAgLy8gVFx1MDBFRG5oIHZcdTFFQ0IgdHJcdTAwRUQgdGhcdTFFRERpIGdpYW4gdHJcdTFFRjFjIHRpXHUxRUJGcCBoaVx1MUVDN24gdFx1MUVBMWkgY1x1MUVFN2EgY2hcdTFFRTcgcGhcdTAwRjJuZ1xuICBjb25zdCBnZXRIb3N0Q3VycmVudFBvcyA9ICgpID0+IHtcbiAgICBjb25zdCBzdCA9IHdhdGNoU3RhdGVSZWYuY3VycmVudCB8fCB3YXRjaFN0YXRlO1xuICAgIGNvbnN0IG5vd01zID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCB1cGRhdGVUaW1lTXMgPSBzdD8udXBkYXRlZEF0XG4gICAgICA/IG5ldyBEYXRlKFN0cmluZyhzdC51cGRhdGVkQXQpLnJlcGxhY2UoJyAnLCAnVCcpICsgKFN0cmluZyhzdC51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKVxuICAgICAgOiBub3dNcztcbiAgICBjb25zdCBlbGFwc2VkU2VjID0gTWF0aC5tYXgoMCwgKG5vd01zIC0gdXBkYXRlVGltZU1zKSAvIDEwMDApO1xuICAgIGxldCB0YXJnZXRQb3MgPSBOdW1iZXIoc3Q/LnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICBpZiAoc3Q/LnBsYXlpbmcpIHtcbiAgICAgIHRhcmdldFBvcyA9IE51bWJlcihzdC5iYXNlUG9zaXRpb25TZWNvbmRzICE9IG51bGwgPyBzdC5iYXNlUG9zaXRpb25TZWNvbmRzIDogc3QucG9zaXRpb25TZWNvbmRzKSArIChlbGFwc2VkU2VjICogKHN0LnBsYXliYWNrUmF0ZSB8fCAxLjApKTtcbiAgICB9XG4gICAgcmV0dXJuIE1hdGgubWF4KDAsIE51bWJlcih0YXJnZXRQb3MudG9GaXhlZCgyKSkpO1xuICB9O1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBUXHUxRUE2TkcgMTogTFx1MUVBRm5nIG5naGUgdHJcdTFFRjFjIHRpXHUxRUJGcCB0aW4gbmhcdTFFQUZuIHBvc3RNZXNzYWdlIHRcdTFFRUIgWW91VHViZSBJRnJhbWUgXHUyNTAwXHUyNTAwXG4gIC8vIFlvdVR1YmUgSUZyYW1lIGx1XHUwMEY0biBwaFx1MDBFMXQgY1x1MDBFMWMgc1x1MUVGMSBraVx1MUVDN24gb25TdGF0ZUNoYW5nZSAmIGluZm9EZWxpdmVyeSByYSBwYXJlbnQgd2luZG93XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qgb25Nc2cgPSAoZSkgPT4ge1xuICAgICAgbGV0IGRhdGEgPSBlLmRhdGE7XG4gICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIGlmIChkYXRhLmluY2x1ZGVzKCdldmVudD0nKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhkYXRhKTtcbiAgICAgICAgICAgICAgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICBldmVudDogcGFyYW1zLmdldCgnZXZlbnQnKSxcbiAgICAgICAgICAgICAgICBpbmZvOiBwYXJhbXMuZ2V0KCdpbmZvJykgPyBKU09OLnBhcnNlKHBhcmFtcy5nZXQoJ2luZm8nKSkgOiBwYXJhbXMuZ2V0KCdpbmZvJylcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gY2F0Y2ggeyByZXR1cm47IH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFkYXRhIHx8IHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0JykgcmV0dXJuO1xuXG4gICAgICAvLyBDXHUxRUFEcCBuaFx1MUVBRHQgXHUwMTExXHUxRUQ5IGRcdTAwRTBpIHZpZGVvIHRoXHUxRUYxYyB0XHUxRUJGIChkdXJhdGlvbilcbiAgICAgIGNvbnN0IGQgPSBOdW1iZXIoZGF0YS5pbmZvPy5kdXJhdGlvbiB8fCBkYXRhLmR1cmF0aW9uIHx8IDApO1xuICAgICAgaWYgKGQgPiAwKSB7XG4gICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSBkO1xuICAgICAgICBzZXREdXJhdGlvbihwcmV2ID0+IChwcmV2ID4gMCA/IHByZXYgOiBkKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIENcdTFFQURwIG5oXHUxRUFEdCB0aFx1MUVERGkgZ2lhbiB0aFx1MUVGMWMgdFx1MUVCRlxuICAgICAgY29uc3QgY3VyID0gTnVtYmVyKGRhdGEuaW5mbz8uY3VycmVudFRpbWUpO1xuICAgICAgaWYgKCFpc05hTihjdXIpICYmIGN1ciA+PSAwICYmICFpc1NlZWtpbmdSZWYuY3VycmVudCkge1xuICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjdXIpKTtcbiAgICAgIH1cblxuICAgICAgLy8gXHUyNTAwXHUyNTAwIFZcdTAwRDlORyAyOiBcdTAxMTBcdTFFRDJORyBCXHUxRUQ4IFRIQU8gVFx1MDBDMUMgQ1x1MUVFNkEgQ0hcdTFFRTYgUEhcdTAwRDJORyBIT1x1MUVCNkMgQ0hcdTFFQkUgXHUwMTEwXHUxRUQ4IFhFTSBDXHUxRUU2QSBOR1x1MDFBRlx1MUVEQ0kgVEhBTSBHSUEgXHUyNTAwXHUyNTAwXG4gICAgICBjb25zdCBwU3RhdGUgPSBkYXRhLmV2ZW50ID09PSAnb25TdGF0ZUNoYW5nZSdcbiAgICAgICAgPyAodHlwZW9mIGRhdGEuaW5mbyA9PT0gJ251bWJlcicgPyBkYXRhLmluZm8gOiBkYXRhLmluZm8/LnBsYXllclN0YXRlKVxuICAgICAgICA6IChkYXRhLmV2ZW50ID09PSAnaW5mb0RlbGl2ZXJ5JyA/IGRhdGEuaW5mbz8ucGxheWVyU3RhdGUgOiB1bmRlZmluZWQpO1xuXG4gICAgICBpZiAoY2FuQ29udHJvbCAmJiAhZGFuZ0d1aUxlbmhSZWYuY3VycmVudCAmJiAhaXNTZWVraW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgLy8gMS4gQlx1MUVBRnQgUGxheSAvIFBhdXNlIHRyXHUxRUYxYyB0aVx1MUVCRnAgdFx1MUVFQiBtXHUwMEUwbiBoXHUwMEVDbmggdmlkZW8gWW91VHViZVxuICAgICAgICBjb25zdCBjdXJUaW1lID0gIWlzTmFOKGN1cikgJiYgY3VyID49IDAgPyBjdXIgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgaWYgKHBTdGF0ZSA9PT0gMSAmJiAhd2F0Y2hTdGF0ZVJlZi5jdXJyZW50LnBsYXlpbmcpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnVlx1MDBGOW5nIDI6IENoXHUxRUU3IHBoXHUwMEYybmcgYlx1MUVBNW0gUGxheSB0clx1MDBFQW4gWW91VHViZSAtPiBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGNcdTFFQTMgcGhcdTAwRjJuZycpO1xuICAgICAgICAgIGd1aUxlbmhSZWYuY3VycmVudD8uKCdwbGF5JywgY3VyVGltZSk7XG4gICAgICAgIH0gZWxzZSBpZiAocFN0YXRlID09PSAyICYmIHdhdGNoU3RhdGVSZWYuY3VycmVudC5wbGF5aW5nKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1ZcdTAwRjluZyAyOiBDaFx1MUVFNyBwaFx1MDBGMm5nIGJcdTFFQTVtIFBhdXNlIHRyXHUwMEVBbiBZb3VUdWJlIC0+IFx1MDExMVx1MUVEM25nIGJcdTFFRDkgY1x1MUVBMyBwaFx1MDBGMm5nJyk7XG4gICAgICAgICAgZ3VpTGVuaFJlZi5jdXJyZW50Py4oJ3BhdXNlJywgY3VyVGltZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyAyLiBCXHUxRUFGdCB0aGFvIHRcdTAwRTFjIHR1YSAoU2VlaykgdHJcdTAwRUFuIHRoYW5oIHRpXHUxRUJGbiB0clx1MDBFQ25oIFx1MDExMVx1MUVDRiBZb3VUdWJlICgwOjI5IC8gMjo0MTozMilcbiAgICAgICAgaWYgKCFpc05hTihjdXIpICYmIGN1ciA+PSAwKSB7XG4gICAgICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICBjb25zdCBwcmV2ID0gbGFzdEhvc3RUcmFja1RpbWVSZWYuY3VycmVudDtcbiAgICAgICAgICBjb25zdCBkdCA9IE1hdGgubWF4KDAsIChub3cgLSBwcmV2LnN0YW1wKSAvIDEwMDApO1xuICAgICAgICAgIGNvbnN0IGV4cGVjdGVkID0gd2F0Y2hTdGF0ZVJlZi5jdXJyZW50LnBsYXlpbmcgPyAocHJldi50aW1lICsgZHQpIDogcHJldi50aW1lO1xuICAgICAgICAgIGNvbnN0IGRlbHRhID0gTWF0aC5hYnMoY3VyIC0gZXhwZWN0ZWQpO1xuXG4gICAgICAgICAgLy8gTlx1MUVCRnUgdGhcdTFFRERpIGdpYW4gbmhcdTFFQTN5IGxcdTFFQzdjaCA+IDEuOCBnaVx1MDBFMnkgdHJvbmcga2hvXHUxRUEzbmcgdGhcdTFFRERpIGdpYW4gbmdcdTFFQUZuIChkdCA8IDRzKVxuICAgICAgICAgIC8vIGNoXHUxRUU5bmcgdFx1MUVDRiBjaFx1MUVFNyBwaFx1MDBGMm5nIHZcdTFFRUJhIGNsaWNrIGhvXHUxRUI3YyBrXHUwMEU5byB0aGFuaCBcdTAxMTFcdTFFQ0YgdHJcdTAwRUFuIHZpZGVvIFlvdVR1YmVcbiAgICAgICAgICBpZiAoZHQgPiAwLjI1ICYmIGR0IDwgNC4wICYmIGRlbHRhID4gMS44KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgVlx1MDBGOW5nIDI6IENoXHUxRUU3IHBoXHUwMEYybmcgdHVhIHRyXHUwMEVBbiB0aGFuaCBcdTAxMTFcdTFFQ0YgWW91VHViZSAoJHtjdXIudG9GaXhlZCgxKX1zLCBsXHUxRUM3Y2ggJHtkZWx0YS50b0ZpeGVkKDEpfXMpIC0+IFx1MDExMVx1MUVEM25nIGJcdTFFRDkgY1x1MUVBMyBwaFx1MDBGMm5nYCk7XG4gICAgICAgICAgICBsYXN0SG9zdFRyYWNrVGltZVJlZi5jdXJyZW50ID0geyB0aW1lOiBjdXIsIHN0YW1wOiBub3cgfTtcbiAgICAgICAgICAgIGd1aUxlbmhSZWYuY3VycmVudD8uKCdzZWVrJywgY3VyKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGR0ID49IDAuNSkge1xuICAgICAgICAgICAgbGFzdEhvc3RUcmFja1RpbWVSZWYuY3VycmVudCA9IHsgdGltZTogY3VyLCBzdGFtcDogbm93IH07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFjYW5Db250cm9sICYmICFpc1Byb2dyYW1tYXRpY0FjdGlvblJlZi5jdXJyZW50KSB7XG4gICAgICAgIC8vIE5HXHUwMUFGXHUxRURDSSBUSEFNIEdJQTogVFx1MUVGMSBkbyB0XHUxRUExbSBkXHUxRUVCbmcgaG9cdTFFQjdjIHR1YSB4ZW0gcmlcdTAwRUFuZ1xuICAgICAgICBpZiAocFN0YXRlID09PSAyICYmIHdhdGNoU3RhdGVSZWYuY3VycmVudC5wbGF5aW5nKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ29uTXNnOiBOZ1x1MDFCMFx1MUVERGkgeGVtIHRcdTFFRjEgYlx1MUVBNW0gVFx1MUVBMW0gZFx1MUVFQm5nIHRyXHUwMEVBbiBZb3VUdWJlIC0+IGNodXlcdTFFQzNuIHNhbmcgeGVtIHJpXHUwMEVBbmcnKTtcbiAgICAgICAgICBpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgc2V0SXNMaXZlV2l0aEhvc3QoZmFsc2UpO1xuICAgICAgICAgIHNldFZpZXdlcklzUGF1c2VkKHRydWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHBTdGF0ZSA9PT0gMSkge1xuICAgICAgICAgIHNldFZpZXdlcklzUGF1c2VkKGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5cdTFFQkZ1IG5nXHUwMUIwXHUxRUREaSB4ZW0gdFx1MUVGMSB0dWEgbFx1MUVDN2NoIGtoXHUxRUNGaSBjaFx1MUVFNyBwaFx1MDBGMm5nID4gMy41c1xuICAgICAgICBpZiAoaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCAmJiAhaXNOYU4oY3VyKSAmJiBjdXIgPj0gMCkge1xuICAgICAgICAgIGNvbnN0IGhvc3RQb3MgPSBnZXRIb3N0Q3VycmVudFBvcygpO1xuICAgICAgICAgIGNvbnN0IGRyaWZ0ID0gTWF0aC5hYnMoY3VyIC0gaG9zdFBvcyk7XG4gICAgICAgICAgaWYgKGRyaWZ0ID4gMy41KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgb25Nc2c6IE5nXHUwMUIwXHUxRUREaSB4ZW0gdFx1MUVGMSB0dWEgbFx1MUVDN2NoIGtoXHUxRUNGaSBjaFx1MUVFNyBwaFx1MDBGMm5nICgke2RyaWZ0LnRvRml4ZWQoMSl9cykgLT4gY2h1eVx1MUVDM24gc2FuZyB4ZW0gcmlcdTAwRUFuZ2ApO1xuICAgICAgICAgICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgc2V0SXNMaXZlV2l0aEhvc3QoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBOaFx1MUVBRG4gZGlcdTFFQzduIHRyXHUxRUExbmcgdGhcdTAwRTFpIGtcdTFFQkZ0IHRoXHUwMEZBYyB2aWRlbzogMCA9IEVOREVEXG4gICAgICBjb25zdCBpc0VuZGVkID0gKGRhdGEuZXZlbnQgPT09ICdvblN0YXRlQ2hhbmdlJyAmJiAoZGF0YS5pbmZvID09PSAwIHx8IGRhdGEuaW5mbz8ucGxheWVyU3RhdGUgPT09IDApKSB8fFxuICAgICAgICAgICAgICAgICAgICAgIChkYXRhLmV2ZW50ID09PSAnaW5mb0RlbGl2ZXJ5JyAmJiBkYXRhLmluZm8/LnBsYXllclN0YXRlID09PSAwKSB8fFxuICAgICAgICAgICAgICAgICAgICAgIChkYXRhLmluZm8gJiYgZGF0YS5pbmZvLnBsYXllclN0YXRlID09PSAwKTtcblxuICAgICAgaWYgKGlzRW5kZWQpIHtcbiAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgIWlzU2tpcHBpbmdSZWYuY3VycmVudCAmJiAhaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1lvdVR1YmUgaWZyYW1lIHBvc3RNZXNzYWdlOiBWaWRlbyBrXHUxRUJGdCB0aFx1MDBGQWMgLT4gdFx1MUVGMSBcdTAxMTFcdTFFRDluZyBjaHV5XHUxRUMzbiB0aVx1MUVCRnAgdmlkZW8gdGlcdTFFQkZwIHRoZW8nKTtcbiAgICAgICAgICBoYW5oRG9uZ1F1ZXVlKCdza2lwJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBvbk1zZyk7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgb25Nc2cpO1xuICB9LCBbY2FuQ29udHJvbCwgcGhvbmcuaWRdKTtcblxuICAvLyBHXHUxRUVEaSBsaXN0ZW5pbmcgaGFuZHNoYWtlIFx1MDExMVx1MUVDQm5oIGtcdTFFRjMgdlx1MDBFMG8gaWZyYW1lIFlvdVR1YmUgXHUwMTExXHUxRUMzIGtcdTAwRURjaCBob1x1MUVBMXQgZXZlbnQgc3RyZWFtXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF5dElkKSByZXR1cm47XG4gICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgaWYgKCFpZnIpIHJldHVybjtcbiAgICBjb25zdCB0ID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWZyLmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdsaXN0ZW5pbmcnIH0pLCAnKicpO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH0sIDE1MDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHQpO1xuICB9LCBbeXRJZCwgcGhvbmcuaWRdKTtcblxuICAvLyBcdTI1MDBcdTI1MDAgVFx1MUVBNk5HIDI6IEtoXHUxRURGaSB0XHUxRUExbyB2XHUwMEUwIGtcdTFFQkZ0IG5cdTFFRDFpIFlvdVR1YmUgSUZyYW1lIFBsYXllciBBUEkgdHJcdTFFRjFjIHRpXHUxRUJGcCB2XHUwMEUwbyBpZnJhbWUgXHUyNTAwXHUyNTAwXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF5dElkKSByZXR1cm47XG4gICAgbGV0IGRlc3Ryb3llZCA9IGZhbHNlO1xuICAgIGxldCByZXRyeVRpbWVyID0gbnVsbDtcbiAgICBsZXQgYXR0ZW1wdHMgPSAwO1xuXG4gICAgLy8gTlx1MUVCRnUgcGxheWVyIFx1MDExMVx1MDBFMyB0XHUxRUQzbiB0XHUxRUExaSB2XHUwMEUwIHNcdTFFQjVuIHNcdTAwRTBuZzogY2h1eVx1MUVDM24gYlx1MDBFMGkgdFx1MUVFOWMgdGhcdTAwRUMgcXVhIGxvYWRWaWRlb0J5SWQgKGtoXHUwMEY0bmcgcmVsb2FkIERPTS9pZnJhbWUpXG4gICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQgJiYgeXRSZWFkeVJlZi5jdXJyZW50ICYmIHR5cGVvZiB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChjdXJyZW50WXRJZFJlZi5jdXJyZW50ICE9PSB5dElkKSB7XG4gICAgICAgICAgY3VycmVudFl0SWRSZWYuY3VycmVudCA9IHl0SWQ7XG4gICAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IDA7XG4gICAgICAgICAgc2V0RHVyYXRpb24oMCk7XG4gICAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgY29uc3Qgc3RhcnRTZWMgPSBOdW1iZXIod2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkKHtcbiAgICAgICAgICAgIHZpZGVvSWQ6IHl0SWQsXG4gICAgICAgICAgICBzdGFydFNlY29uZHM6IHN0YXJ0U2VjXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0xcdTFFRDdpIGxvYWRWaWRlb0J5SWQ6JywgZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY3VycmVudFl0SWRSZWYuY3VycmVudCA9IHl0SWQ7XG4gICAgaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ID0gZmFsc2U7XG5cbiAgICBjb25zdCBraG9pVGFvUGxheWVyID0gKCkgPT4ge1xuICAgICAgaWYgKGRlc3Ryb3llZCkgcmV0dXJuO1xuICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgIGlmICghZWwpIHtcbiAgICAgICAgaWYgKGF0dGVtcHRzKysgPCAzMCkge1xuICAgICAgICAgIHJldHJ5VGltZXIgPSBzZXRUaW1lb3V0KGtob2lUYW9QbGF5ZXIsIDEwMCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXdpbmRvdy5ZVCB8fCAhd2luZG93LllULlBsYXllcikge1xuICAgICAgICBpZiAoYXR0ZW1wdHMrKyA8IDMwKSB7XG4gICAgICAgICAgcmV0cnlUaW1lciA9IHNldFRpbWVvdXQoa2hvaVRhb1BsYXllciwgMTUwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQgPSBuZXcgd2luZG93LllULlBsYXllcihlbCwge1xuICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgb25SZWFkeTogKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChkZXN0cm95ZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgeXRSZWFkeVJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgc2V0WXRQbGF5ZXJSZWFkeSh0cnVlKTtcblxuICAgICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LmdldER1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IGV2ZW50LnRhcmdldC5nZXREdXJhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChkID4gMCkge1xuICAgICAgICAgICAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IGQ7XG4gICAgICAgICAgICAgICAgICBzZXREdXJhdGlvbihkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBUXHUwMEVEbmggdlx1MUVDQiB0clx1MDBFRCB0aFx1MUVERGkgZ2lhbiBoaVx1MUVDN24gdFx1MUVBMWkgY1x1MUVFN2EgcGhcdTAwRjJuZyBcdTAxMTFcdTFFQzMgc2VlayBuZ2F5IGxcdTAwRkFjIGtoXHUxRURGaSB0XHUxRUExb1xuICAgICAgICAgICAgICBjb25zdCBub3dNcyA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgIGNvbnN0IHVwZGF0ZVRpbWVNcyA9IHdhdGNoU3RhdGUudXBkYXRlZEF0ID8gbmV3IERhdGUoU3RyaW5nKHdhdGNoU3RhdGUudXBkYXRlZEF0KS5yZXBsYWNlKCcgJywgJ1QnKSArIChTdHJpbmcod2F0Y2hTdGF0ZS51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKSA6IG5vd01zO1xuICAgICAgICAgICAgICBjb25zdCBlbGFwc2VkU2VjID0gTWF0aC5tYXgoMCwgKG5vd01zIC0gdXBkYXRlVGltZU1zKSAvIDEwMDApO1xuICAgICAgICAgICAgICBsZXQgdFBvcyA9IE51bWJlcih3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICAgICAgICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICAgICAgICAgIHRQb3MgPSBOdW1iZXIod2F0Y2hTdGF0ZS5iYXNlUG9zaXRpb25TZWNvbmRzICE9IG51bGwgPyB3YXRjaFN0YXRlLmJhc2VQb3NpdGlvblNlY29uZHMgOiB3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcykgKyAoZWxhcHNlZFNlYyAqICh3YXRjaFN0YXRlLnBsYXliYWNrUmF0ZSB8fCAxLjApKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh0UG9zID4gMCAmJiBldmVudC50YXJnZXQuc2Vla1RvKSB7XG4gICAgICAgICAgICAgICAgaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0cnkgeyBldmVudC50YXJnZXQuc2Vla1RvKHRQb3MsIHRydWUpOyB9IGNhdGNoIHt9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nICYmIChjYW5Db250cm9sIHx8IGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCB8fCBoYXNJbnRlcmFjdGVkKSAmJiBldmVudC50YXJnZXQucGxheVZpZGVvKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHsgZXZlbnQudGFyZ2V0LnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblN0YXRlQ2hhbmdlOiAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldCAmJiBldmVudC50YXJnZXQuZ2V0RHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gZXZlbnQudGFyZ2V0LmdldER1cmF0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKGQgPiAwICYmIGR1cmF0aW9uUmVmLmN1cnJlbnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSBkO1xuICAgICAgICAgICAgICAgICAgc2V0RHVyYXRpb24oZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gVmlkZW8ga1x1MUVCRnQgdGhcdTAwRkFjOiBrXHUwMEVEY2ggaG9cdTFFQTF0IGNodXlcdTFFQzNuIGJcdTAwRTBpIG5nYXkgbFx1MUVBRHAgdFx1MUVFOWNcbiAgICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGEgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiAhaXNTa2lwcGluZ1JlZi5jdXJyZW50ICYmICFoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdZVCBQbGF5ZXIgb25TdGF0ZUNoYW5nZSA9PT0gMCAoRU5ERUQpIC0+IHRcdTFFRjEgXHUwMTExXHUxRUQ5bmcgY2h1eVx1MUVDM24gdGlcdTFFQkZwIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpJyk7XG4gICAgICAgICAgICAgICAgICBoYW5oRG9uZ1F1ZXVlKCdza2lwJyk7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgIWRhbmdHdWlMZW5oUmVmLmN1cnJlbnQgJiYgIWlzU2Vla2luZ1JlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VyUG9zID0gdHlwZW9mIGV2ZW50LnRhcmdldD8uZ2V0Q3VycmVudFRpbWUgPT09ICdmdW5jdGlvbicgPyBldmVudC50YXJnZXQuZ2V0Q3VycmVudFRpbWUoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuZGF0YSA9PT0gMSAmJiAhd2F0Y2hTdGF0ZVJlZi5jdXJyZW50LnBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdZVCBQbGF5ZXIgb25TdGF0ZUNoYW5nZSA9PT0gMSAtPiBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IFBsYXkgY1x1MUVBMyBwaFx1MDBGMm5nJyk7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oUmVmLmN1cnJlbnQ/LigncGxheScsIGN1clBvcyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5kYXRhID09PSAyICYmIHdhdGNoU3RhdGVSZWYuY3VycmVudC5wbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnWVQgUGxheWVyIG9uU3RhdGVDaGFuZ2UgPT09IDIgLT4gXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBQYXVzZSBjXHUxRUEzIHBoXHUwMEYybmcnKTtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmhSZWYuY3VycmVudD8uKCdwYXVzZScsIGN1clBvcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFjYW5Db250cm9sICYmICFpc1Byb2dyYW1tYXRpY0FjdGlvblJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGEgPT09IDIgJiYgd2F0Y2hTdGF0ZVJlZi5jdXJyZW50LnBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdZVCBQbGF5ZXIgb25TdGF0ZUNoYW5nZSA9PT0gMjogTmdcdTAxQjBcdTFFRERpIHhlbSB0XHUxRUExbSBkXHUxRUVCbmcgWW91VHViZSAtPiBjaHV5XHUxRUMzbiBzYW5nIHhlbSByaVx1MDBFQW5nJyk7XG4gICAgICAgICAgICAgICAgICBpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBzZXRJc0xpdmVXaXRoSG9zdChmYWxzZSk7XG4gICAgICAgICAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZCh0cnVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmRhdGEgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgIHNldFZpZXdlcklzUGF1c2VkKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkgWW91VHViZSBQbGF5ZXIgQVBJOicsIGVycik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIG5hcFlvdVR1YmVJZnJhbWVBcGkoKCkgPT4ge1xuICAgICAgc2V0VGltZW91dChraG9pVGFvUGxheWVyLCAxMDApO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGRlc3Ryb3llZCA9IHRydWU7XG4gICAgICBpZiAocmV0cnlUaW1lcikgY2xlYXJUaW1lb3V0KHJldHJ5VGltZXIpO1xuICAgIH07XG4gIH0sIFt5dElkLCBwaG9uZy5pZCwgY2FuQ29udHJvbF0pO1xuXG4gIC8vIFx1MDBDMXAgZFx1MUVFNW5nIHRyXHUxRUExbmcgdGhcdTAwRTFpIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgdFx1MUVFQiBzZXJ2ZXIgKGNoXHUxRUQxbmcgZ2lcdTFFQUR0IGNoXHUxRUFEcCBjaFx1MUVERG4gY2hvIGNcdTFFQTMgSG9zdCBsXHUxRUFCbiBOZ1x1MDFCMFx1MUVERGkgeGVtKVxuICBjb25zdCBhcER1bmdEb25nQm8gPSAoc3QsIGN0cmwsIHByb3YpID0+IHtcbiAgICBpZiAoIXN0KSByZXR1cm47XG4gICAgY29uc3Qgbm93TXMgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHVwZGF0ZVRpbWVNcyA9IHN0LnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyhzdC51cGRhdGVkQXQpLnJlcGxhY2UoJyAnLCAnVCcpICsgKFN0cmluZyhzdC51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKSA6IG5vd01zO1xuICAgIGNvbnN0IGVsYXBzZWRTZWMgPSBNYXRoLm1heCgwLCAobm93TXMgLSB1cGRhdGVUaW1lTXMpIC8gMTAwMCk7XG5cbiAgICBsZXQgdGFyZ2V0UG9zID0gTnVtYmVyKHN0LnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICBpZiAoc3QucGxheWluZykge1xuICAgICAgdGFyZ2V0UG9zID0gTnVtYmVyKHN0LmJhc2VQb3NpdGlvblNlY29uZHMgIT0gbnVsbCA/IHN0LmJhc2VQb3NpdGlvblNlY29uZHMgOiBzdC5wb3NpdGlvblNlY29uZHMpICsgKGVsYXBzZWRTZWMgKiAoc3QucGxheWJhY2tSYXRlIHx8IDEuMCkpO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBOR1VZXHUwMENBTiBUXHUxRUFFQyBWXHUwMEMwTkc6IENIXHUxRUU2IFBIXHUwMEQyTkcgTFx1MDBDMCBOR1VcdTFFRDJOIFBIXHUwMEMxVCAoU09VUkNFIE9GIFRSVVRIKSBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICAvLyBWaWRlbyBjXHUxRUU3YSBDaFx1MUVFNyBwaFx1MDBGMm5nIFx1MDExMWFuZyBwaFx1MDBFMXQgdFx1MUVGMSBuaGlcdTAwRUFuIG1cdTAxQjBcdTFFRTN0IG1cdTAwRTAgNjBmcHMgdHJcdTAwRUFuIFlvdVR1YmUuXG4gICAgLy8gVHV5XHUxRUM3dCBcdTAxMTFcdTFFRDFpIEtIXHUwMEQ0TkcgZ1x1MUVDRGkgc2Vla1RvIGhheSBcdTAwRTlwIHBsYXlWaWRlbyBsXHUwMEUwbSBnaVx1MUVBRHQgbFx1MDBGOWkva2hcdTFFRjFuZyBoXHUwMEVDbmggdmlkZW8gY1x1MUVFN2EgQ2hcdTFFRTcgcGhcdTAwRjJuZyFcbiAgICBpZiAoY3RybCkge1xuICAgICAgaWYgKGlzU2Vla2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICBpZiAocHJvdiA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LmdldEN1cnJlbnRUaW1lKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY3VyID0geXRQbGF5ZXJSZWYuY3VycmVudC5nZXRDdXJyZW50VGltZSgpO1xuICAgICAgICAgIGlmIChjdXIgPiAwICYmICFpc05hTihjdXIpKSBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjdXIpKTtcbiAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBcdTAxMTBcdTFFRDBJIFZcdTFFREFJIEhcdTFFQ0NDIFNJTkggLyBOR1x1MDFBRlx1MUVEQ0kgWEVNIFRST05HIFBIXHUwMEQyTkcgXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgLy8gTlx1MUVCRnUgbmdcdTAxQjBcdTFFRERpIHhlbSBcdTAxMTFhbmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSB4ZW0gcmlcdTAwRUFuZyAoIWlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQpOlxuICAgIC8vIFRVWVx1MUVDNlQgXHUwMTEwXHUxRUQwSSBLSFx1MDBENE5HIFx1MDBFOXAgc2Vla1RvIGhheSBwbGF5VmlkZW8gbFx1MDBFMG0gZ2lcdTAwRTFuIFx1MDExMW9cdTFFQTFuIHZpXHUxRUM3YyB4ZW0gY1x1MUVFN2EgbmdcdTAxQjBcdTFFRERpIHRoYW0gZ2lhIVxuICAgIGlmICghaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGlzTmV3UmV2aXNpb24gPSBsYXN0QXBwbGllZFJldmlzaW9uUmVmLmN1cnJlbnQgIT09IG51bGwgJiYgc3QucmV2aXNpb24gIT09IGxhc3RBcHBsaWVkUmV2aXNpb25SZWYuY3VycmVudDtcbiAgICBpZiAobGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ID09PSBudWxsKSB7XG4gICAgICBsYXN0QXBwbGllZFJldmlzaW9uUmVmLmN1cnJlbnQgPSBzdC5yZXZpc2lvbjtcbiAgICB9XG5cbiAgICBpZiAocHJvdiA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgY29uc3QgdiA9IHZpZGVvUmVmLmN1cnJlbnQ7XG4gICAgICBpZiAoIWhhc1NlZWtlZEluaXRSZWYuY3VycmVudCAmJiB0YXJnZXRQb3MgPiAwKSB7XG4gICAgICAgIGhhc1NlZWtlZEluaXRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgIHYuY3VycmVudFRpbWUgPSB0YXJnZXRQb3M7XG4gICAgICB9XG4gICAgICBpZiAoaXNOZXdSZXZpc2lvbikge1xuICAgICAgICBsYXN0QXBwbGllZFJldmlzaW9uUmVmLmN1cnJlbnQgPSBzdC5yZXZpc2lvbjtcbiAgICAgICAgaWYgKHN0LnBsYXlpbmcpIHtcbiAgICAgICAgICB2LmN1cnJlbnRUaW1lID0gdGFyZ2V0UG9zO1xuICAgICAgICAgIGlmIChoYXNJbnRlcmFjdGVkIHx8IGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCkgdi5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKHRhcmdldFBvcykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHYucGF1c2UoKTtcbiAgICAgICAgICB2LmN1cnJlbnRUaW1lID0gTnVtYmVyKHN0LnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihOdW1iZXIoc3QucG9zaXRpb25TZWNvbmRzIHx8IDApKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBzZXRMb2NhbFRpbWUoTWF0aC5tYXgoMCwgTWF0aC5mbG9vcih0YXJnZXRQb3MpKSk7XG4gICAgICBpZiAoc3QucGxheWluZykge1xuICAgICAgICBjb25zdCBkcmlmdCA9IE1hdGguYWJzKHYuY3VycmVudFRpbWUgLSB0YXJnZXRQb3MpO1xuICAgICAgICBpZiAoZHJpZnQgPiAzLjApIHtcbiAgICAgICAgICB2LmN1cnJlbnRUaW1lID0gdGFyZ2V0UG9zO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2LnBhdXNlZCAmJiAoaGFzSW50ZXJhY3RlZCB8fCBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpKSB7XG4gICAgICAgICAgdi5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIXYucGF1c2VkKSB2LnBhdXNlKCk7XG4gICAgICAgIGNvbnN0IGRyaWZ0ID0gTWF0aC5hYnModi5jdXJyZW50VGltZSAtIHN0LnBvc2l0aW9uU2Vjb25kcyk7XG4gICAgICAgIGlmIChkcmlmdCA+IDIuMCkge1xuICAgICAgICAgIHYuY3VycmVudFRpbWUgPSBzdC5wb3NpdGlvblNlY29uZHM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHByb3YgPT09ICdZT1VUVUJFJykge1xuICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICBjb25zdCBwID0geXRQbGF5ZXJSZWYuY3VycmVudDtcbiAgICAgIGxldCBjdXIgPSBudWxsO1xuICAgICAgbGV0IHBzID0gbnVsbDtcbiAgICAgIGlmIChwICYmIHR5cGVvZiBwLmdldEN1cnJlbnRUaW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRyeSB7IGN1ciA9IHAuZ2V0Q3VycmVudFRpbWUoKTsgfSBjYXRjaCB7fVxuICAgICAgfVxuICAgICAgaWYgKHAgJiYgdHlwZW9mIHAuZ2V0UGxheWVyU3RhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdHJ5IHsgcHMgPSBwLmdldFBsYXllclN0YXRlKCk7IH0gY2F0Y2gge31cbiAgICAgIH1cblxuICAgICAgLy8gSW5pdGlhbCBzZWVrIG5cdTFFQkZ1IG5nXHUwMUIwXHUxRUREaSB4ZW0gY2hcdTAxQjBhIHRcdTFFRUJuZyB0dWEgXHUwMTExXHUxRUJGbiBtXHUxRUQxYyBjXHUxRUU3YSBjaFx1MUVFNyBwaFx1MDBGMm5nXG4gICAgICBpZiAoIWhhc1NlZWtlZEluaXRSZWYuY3VycmVudCAmJiB0YXJnZXRQb3MgPiAwKSB7XG4gICAgICAgIGhhc1NlZWtlZEluaXRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgIGlmIChwPy5zZWVrVG8pIHsgdHJ5IHsgcC5zZWVrVG8odGFyZ2V0UG9zLCB0cnVlKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3RhcmdldFBvcywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEtoaSBwaFx1MDBFMXQgaGlcdTFFQzduIHRoYW8gdFx1MDBFMWMgbVx1MUVEQmkgdFx1MUVFQiBjaFx1MUVFNyBwaFx1MDBGMm5nIChSZXZpc2lvbiB0aGF5IFx1MDExMVx1MUVENWkgZG8gY2hcdTFFRTcgcGhcdTAwRjJuZyBiXHUxRUE1bSBWXHUwMEY5bmcgMSBob1x1MUVCN2MgVlx1MDBGOW5nIDIpXG4gICAgICBpZiAoaXNOZXdSZXZpc2lvbikge1xuICAgICAgICBsYXN0QXBwbGllZFJldmlzaW9uUmVmLmN1cnJlbnQgPSBzdC5yZXZpc2lvbjtcbiAgICAgICAgaWYgKCFzdC5wbGF5aW5nKSB7XG4gICAgICAgICAgLy8gQ2hcdTFFRTcgcGhcdTAwRjJuZyBiXHUxRUE1bSBUXHUxRUExbSBkXHUxRUVCbmc6IExcdTFFQURwIHRcdTFFRTljIHRcdTFFQTFtIGRcdTFFRUJuZyB2XHUwMEUwIHR1YSB2XHUxRUMxIFx1MDExMVx1MDBGQW5nIHZcdTFFQ0IgdHJcdTAwRUQgY2hcdTFFRTcgcGhcdTAwRjJuZyBcdTAxMTFcdTAwRTMgZFx1MUVFQm5nXG4gICAgICAgICAgaWYgKHA/LnBhdXNlVmlkZW8pIHsgdHJ5IHsgcC5wYXVzZVZpZGVvKCk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoJ3tcImV2ZW50XCI6XCJjb21tYW5kXCIsXCJmdW5jXCI6XCJwYXVzZVZpZGVvXCIsXCJhcmdzXCI6XCJcIn0nLCAnKicpO1xuICAgICAgICAgIGNvbnN0IHBTZWMgPSBOdW1iZXIoc3QucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgICAgICAgIGlmIChwPy5zZWVrVG8pIHsgdHJ5IHsgcC5zZWVrVG8ocFNlYywgdHJ1ZSk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3BTZWMsIHRydWVdIH0pLCAnKicpO1xuICAgICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKHBTZWMpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDaFx1MUVFNyBwaFx1MDBGMm5nIGJcdTFFQTVtIFBoXHUwMEUxdCB0aVx1MUVCRnAgaG9cdTFFQjdjIHZcdTFFRUJhIFR1YSB0aFx1MUVERGkgZ2lhbjogTFx1MUVBRHAgdFx1MUVFOWMgdHVhIHZcdTAwRTAgcGhcdTAwRTF0IHkgY2hhbmcgY2hcdTFFRTcgcGhcdTAwRjJuZ1xuICAgICAgICAgIGlmIChwPy5zZWVrVG8pIHsgdHJ5IHsgcC5zZWVrVG8odGFyZ2V0UG9zLCB0cnVlKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbdGFyZ2V0UG9zLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgICAgICBpZiAoaGFzSW50ZXJhY3RlZCB8fCBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIGlmIChwPy5wbGF5VmlkZW8pIHsgdHJ5IHsgcC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKCd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwicGxheVZpZGVvXCIsXCJhcmdzXCI6XCJcIn0nLCAnKicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcih0YXJnZXRQb3MpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIEdpXHUxRUVGIG5oXHUxRUNCcCBwaFx1MDBFMXQgXHUxRUQ1biBcdTAxMTFcdTFFQ0JuaCB0cm9uZyBjXHUwMEUxYyBjaHUga1x1MUVGMyBwb2xsIFx1MDExMVx1MUVDQm5oIGtcdTFFRjNcbiAgICAgIHNldExvY2FsVGltZShNYXRoLm1heCgwLCBNYXRoLmZsb29yKHRhcmdldFBvcykpKTtcblxuICAgICAgaWYgKGN1ciAhPT0gbnVsbCAmJiAhaXNOYU4oY3VyKSkge1xuICAgICAgICBjb25zdCBkcmlmdCA9IE1hdGguYWJzKGN1ciAtIHRhcmdldFBvcyk7XG4gICAgICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICAgICAgaWYgKGRyaWZ0ID4gMy41KSB7XG4gICAgICAgICAgICBpZiAocD8uc2Vla1RvKSB7IHRyeSB7IHAuc2Vla1RvKHRhcmdldFBvcywgdHJ1ZSk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbdGFyZ2V0UG9zLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKChwcyA9PT0gMiB8fCBwcyA9PT0gNSkgJiYgKGhhc0ludGVyYWN0ZWQgfHwgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSkge1xuICAgICAgICAgICAgaWYgKHA/LnBsYXlWaWRlbykgeyB0cnkgeyBwLnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoJ3tcImV2ZW50XCI6XCJjb21tYW5kXCIsXCJmdW5jXCI6XCJwbGF5VmlkZW9cIixcImFyZ3NcIjpcIlwifScsICcqJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEtoaSBzZXJ2ZXIgYlx1MDBFMW8gcGF1c2UsIGx1XHUwMEY0biBnXHUxRUVEaSBwYXVzZSBuXHUxRUJGdSBwbGF5ZXIgXHUwMTExYW5nIHBoXHUwMEUxdFxuICAgICAgICAgIGlmIChwcyA9PT0gMSB8fCBwcyA9PT0gMykge1xuICAgICAgICAgICAgaWYgKHA/LnBhdXNlVmlkZW8pIHsgdHJ5IHsgcC5wYXVzZVZpZGVvKCk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZSgne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBhdXNlVmlkZW9cIixcImFyZ3NcIjpcIlwifScsICcqJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChkcmlmdCA+IDEuOCkge1xuICAgICAgICAgICAgaWYgKHA/LnNlZWtUbykgeyB0cnkgeyBwLnNlZWtUbyhzdC5wb3NpdGlvblNlY29uZHMsIHRydWUpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3N0LnBvc2l0aW9uU2Vjb25kcywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc3QucGxheWluZyAmJiAoaGFzSW50ZXJhY3RlZCB8fCBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpICYmIHBzICE9PSAxKSB7XG4gICAgICAgICAgaWYgKHA/LnBsYXlWaWRlbykgeyB0cnkgeyBwLnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKCd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwicGxheVZpZGVvXCIsXCJhcmdzXCI6XCJcIn0nLCAnKicpO1xuICAgICAgICB9IGVsc2UgaWYgKCFzdC5wbGF5aW5nKSB7XG4gICAgICAgICAgaWYgKHA/LnBhdXNlVmlkZW8pIHsgdHJ5IHsgcC5wYXVzZVZpZGVvKCk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoJ3tcImV2ZW50XCI6XCJjb21tYW5kXCIsXCJmdW5jXCI6XCJwYXVzZVZpZGVvXCIsXCJhcmdzXCI6XCJcIn0nLCAnKicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFBvbGwgdHJcdTFFQTFuZyB0aFx1MDBFMWkgbVx1MDBFMXkgY2hcdTFFRTcgbVx1MUVEN2kgMS4ycyBcdTAxMTFcdTFFQzMgbmdcdTAxQjBcdTFFRERpIHRoYW0gZ2lhIGJcdTFFQUZ0IGtcdTFFQ0JwIHRcdTFFRTljIHRoXHUwMEVDIHRoYW8gdFx1MDBFMWMgY1x1MUVFN2EgY2hcdTFFRTcgcGhcdTAwRjJuZ1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoV2F0Y2ggPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy13YXRjaD9waG9uZ0lkPSR7cGhvbmcuaWR9YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoIWFjdGl2ZSkgcmV0dXJuO1xuICAgICAgICBpZiAoZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgICBzZXRDYW5Db250cm9sKEJvb2xlYW4oZC5jYW5Db250cm9sKSk7XG4gICAgICAgICAgaWYgKGQuY2Fwcykgc2V0V2F0Y2hDYXBzKGQuY2Fwcyk7XG4gICAgICAgICAgc2V0UHJvdmlkZXIoZC5wcm92aWRlciB8fCAnVU5TVVBQT1JURUQnKTtcbiAgICAgICAgICBpZiAoZC5waG9uZz8udmlkZW9VcmwgJiYgZC5waG9uZy52aWRlb1VybCAhPT0gYWN0aXZlVmlkZW9VcmwpIHtcbiAgICAgICAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKGQucGhvbmcudmlkZW9VcmwpO1xuICAgICAgICAgICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgICAgICBzZXRJc0xpdmVXaXRoSG9zdCh0cnVlKTtcbiAgICAgICAgICAgIHNldFZpZXdlcklzUGF1c2VkKGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXBEdW5nRG9uZ0JvKGQuc3RhdGUsIEJvb2xlYW4oZC5jYW5Db250cm9sKSwgZC5wcm92aWRlciB8fCAnVU5TVVBQT1JURUQnKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7IH1cbiAgICB9O1xuXG4gICAgZmV0Y2hXYXRjaCgpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaShmZXRjaFdhdGNoKSwgMTIwMCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgfTtcbiAgfSwgW3Bob25nLmlkLCBoYXNJbnRlcmFjdGVkXSk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFRcdTFFQTZORyAzICYgNDogUG9zaXRpb25hbCBXYXRjaGRvZyAmIENcdTFFQURwIG5oXHUxRUFEdCBsb2NhbFRpbWUgbVx1MDFCMFx1MUVFM3QgbVx1MDBFMCBcdTI1MDBcdTI1MDBcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBpc1BsYXlpbmcgPSBjYW5Db250cm9sID8gd2F0Y2hTdGF0ZS5wbGF5aW5nIDogKGlzTGl2ZVdpdGhIb3N0ID8gd2F0Y2hTdGF0ZS5wbGF5aW5nIDogIXZpZXdlcklzUGF1c2VkKTtcbiAgICBpZiAoIWlzUGxheWluZykgcmV0dXJuO1xuICAgIGNvbnN0IHRpY2sgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAoaXNTZWVraW5nUmVmLmN1cnJlbnQpIHJldHVybjtcblxuICAgICAgbGV0IGN1clRpbWUgPSBudWxsO1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHAgPSB5dFBsYXllclJlZi5jdXJyZW50O1xuICAgICAgICAgIGlmIChwLmdldER1cmF0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBkID0gcC5nZXREdXJhdGlvbigpO1xuICAgICAgICAgICAgaWYgKGQgPiAwKSB7XG4gICAgICAgICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSBkO1xuICAgICAgICAgICAgICBpZiAoZHVyYXRpb24gPT09IDApIHNldER1cmF0aW9uKGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocC5nZXRDdXJyZW50VGltZSkge1xuICAgICAgICAgICAgY29uc3QgY3VyID0gcC5nZXRDdXJyZW50VGltZSgpO1xuICAgICAgICAgICAgaWYgKGN1ciAhPT0gdW5kZWZpbmVkICYmIGN1ciAhPT0gbnVsbCAmJiAhaXNOYU4oY3VyKSkge1xuICAgICAgICAgICAgICBjdXJUaW1lID0gY3VyO1xuICAgICAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjdXIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHAuZ2V0UGxheWVyU3RhdGUgJiYgcC5nZXRQbGF5ZXJTdGF0ZSgpID09PSAwKSB7XG4gICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiAhaXNTa2lwcGluZ1JlZi5jdXJyZW50ICYmICFoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1BsYXllclN0YXRlID09PSAwIC0+IHRcdTFFRjEgXHUwMTExXHUxRUQ5bmcgY2h1eVx1MUVDM24gdGlcdTFFQkZwIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpJyk7XG4gICAgICAgICAgICAgIGhhbmhEb25nUXVldWUoJ3NraXAnKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgICBjb25zdCBjdXIgPSB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lO1xuICAgICAgICBpZiAoIWlzTmFOKGN1cikpIHtcbiAgICAgICAgICBjdXJUaW1lID0gY3VyO1xuICAgICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKGN1cikpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEdpXHUwMEUxbSBzXHUwMEUxdCB2XHUxRUNCIHRyXHUwMEVEOiBuXHUxRUJGdSB2aWRlbyBcdTAxMTFcdTAwRTMgcGhcdTAwRTF0IFx1MDExMVx1MUVCRm4gZ2lcdTAwRTJ5IGN1XHUxRUQxaSBjXHUwMEY5bmcgaG9cdTFFQjdjIHF1XHUwMEUxIGR1cmF0aW9uXG4gICAgICBjb25zdCBtYXhEdXIgPSBkdXJhdGlvblJlZi5jdXJyZW50IHx8IGR1cmF0aW9uO1xuICAgICAgY29uc3QgY3VycmVudFBvcyA9IGN1clRpbWUgIT09IG51bGwgPyBjdXJUaW1lIDogbG9jYWxUaW1lO1xuICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgbWF4RHVyID4gNSAmJiAoY3VycmVudFBvcyA+PSBtYXhEdXIgLSAxLjIgfHwgbG9jYWxUaW1lID49IG1heER1cikpIHtcbiAgICAgICAgaWYgKCFpc1NraXBwaW5nUmVmLmN1cnJlbnQgJiYgIWhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBQb3NpdGlvbmFsIFdhdGNoZG9nOiBjdXJyZW50UG9zICgke2N1cnJlbnRQb3MudG9GaXhlZCgxKX1zKSA+PSBkdXJhdGlvbiAoJHttYXhEdXJ9cykgLT4gdFx1MUVGMSBcdTAxMTFcdTFFRDluZyBjaHV5XHUxRUMzbiB0aVx1MUVCRnBgKTtcbiAgICAgICAgICBoYW5oRG9uZ1F1ZXVlKCdza2lwJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjYW5Db250cm9sICYmIGN1clRpbWUgIT09IG51bGwgJiYgY3VyVGltZSA+IDAgJiYgIWRhbmdHdWlMZW5oUmVmLmN1cnJlbnQgJiYgIWlzU2Vla2luZ1JlZi5jdXJyZW50KSB7XG4gICAgICAgIGNvbnN0IG5vd01zID0gRGF0ZS5ub3coKTtcbiAgICAgICAgaWYgKCFsYXN0SG9zdFN5bmNUaW1lUmVmLmN1cnJlbnQpIGxhc3RIb3N0U3luY1RpbWVSZWYuY3VycmVudCA9IG5vd01zO1xuICAgICAgICBjb25zdCB1cGRhdGVUaW1lTXMgPSB3YXRjaFN0YXRlLnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyh3YXRjaFN0YXRlLnVwZGF0ZWRBdCkucmVwbGFjZSgnICcsICdUJykgKyAoU3RyaW5nKHdhdGNoU3RhdGUudXBkYXRlZEF0KS5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS5nZXRUaW1lKCkgOiBub3dNcztcbiAgICAgICAgY29uc3QgZWxhcHNlZFNlYyA9IE1hdGgubWF4KDAsIChub3dNcyAtIHVwZGF0ZVRpbWVNcykgLyAxMDAwKTtcbiAgICAgICAgY29uc3QgZXhwZWN0ZWRTZXJ2ZXJQb3MgPSBOdW1iZXIod2F0Y2hTdGF0ZS5iYXNlUG9zaXRpb25TZWNvbmRzICE9IG51bGwgPyB3YXRjaFN0YXRlLmJhc2VQb3NpdGlvblNlY29uZHMgOiB3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcykgKyAoZWxhcHNlZFNlYyAqICh3YXRjaFN0YXRlLnBsYXliYWNrUmF0ZSB8fCAxLjApKTtcbiAgICAgICAgY29uc3QgaG9zdERyaWZ0ID0gTWF0aC5hYnMoY3VyVGltZSAtIGV4cGVjdGVkU2VydmVyUG9zKTtcblxuICAgICAgICBpZiAoaG9zdERyaWZ0ID4gMy4wICYmIChub3dNcyAtIGxhc3RIb3N0U3luY1RpbWVSZWYuY3VycmVudCA+IDQwMDApKSB7XG4gICAgICAgICAgbGFzdEhvc3RTeW5jVGltZVJlZi5jdXJyZW50ID0gbm93TXM7XG4gICAgICAgICAgZ3VpTGVuaCgnc2VlaycsIGN1clRpbWUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjdXJUaW1lID09PSBudWxsKSB7XG4gICAgICAgIHNldExvY2FsVGltZSh0ID0+IChtYXhEdXIgPiAwID8gTWF0aC5taW4odCArIDEsIE1hdGguZmxvb3IobWF4RHVyKSkgOiB0ICsgMSkpO1xuICAgICAgfVxuICAgIH0sIDEwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpY2spO1xuICB9LCBbd2F0Y2hTdGF0ZS5wbGF5aW5nLCB2aWV3ZXJJc1BhdXNlZCwgaXNMaXZlV2l0aEhvc3QsIHByb3ZpZGVyLCBkdXJhdGlvbiwgbG9jYWxUaW1lLCBjYW5Db250cm9sXSk7XG5cbiAgLy8gR1x1MUVFRGkgbFx1MUVDN25oIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gKFBsYXkgLyBQYXVzZSAvIFNlZWspXG4gIGNvbnN0IGd1aUxlbmggPSBhc3luYyAoYWN0aW9uLCBjdXN0b21Qb3MpID0+IHtcbiAgICBpZiAoZGFuZ0d1aUxlbmhSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIHNldERhbmdHdWlMZW5oKHRydWUpO1xuICAgIGRhbmdHdWlMZW5oUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHNldExvaSgnJyk7XG5cbiAgICBsZXQgcG9zID0gY3VzdG9tUG9zO1xuICAgIGlmIChwb3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICAgIHBvcyA9IHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWU7XG4gICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudD8uZ2V0Q3VycmVudFRpbWUpIHtcbiAgICAgICAgcG9zID0geXRQbGF5ZXJSZWYuY3VycmVudC5nZXRDdXJyZW50VGltZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9zID0gbG9jYWxUaW1lO1xuICAgICAgfVxuICAgIH1cbiAgICBwb3MgPSBNYXRoLm1heCgwLCBOdW1iZXIoKHBvcyB8fCAwKS50b0ZpeGVkKDIpKSk7XG5cbiAgICAvLyBDXHUxRUFEcCBuaFx1MUVBRHQgbFx1MUVBMWMgcXVhbiB0clx1MDBFQW4gbG9jYWwgcGxheWVyXG4gICAgaWYgKGFjdGlvbiA9PT0gJ3BsYXknKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBsYXlWaWRlbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZSgne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBsYXlWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ3BhdXNlJykge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LnBhdXNlKCk7XG4gICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wYXVzZVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wYXVzZVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZSgne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBhdXNlVmlkZW9cIixcImFyZ3NcIjpcIlwifScsICcqJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdzZWVrJykge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lID0gcG9zO1xuICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8uc2Vla1RvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8ocG9zLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFtwb3MsIHRydWVdIH0pLCAnKicpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy13YXRjaCcsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgYWN0aW9uLFxuICAgICAgICAgIHBvc2l0aW9uOiBwb3MsXG4gICAgICAgICAgZXhwZWN0ZWRSZXZpc2lvbjogd2F0Y2hTdGF0ZS5yZXZpc2lvbixcbiAgICAgICAgICBwbGF5YmFja1JhdGU6IHdhdGNoU3RhdGUucGxheWJhY2tSYXRlIHx8IDEuMFxuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIGQuc3RhdGUpIHtcbiAgICAgICAgbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ID0gZC5zdGF0ZS5yZXZpc2lvbjtcbiAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IoZC5zdGF0ZS5wb3NpdGlvblNlY29uZHMgfHwgcG9zKSk7XG4gICAgICB9IGVsc2UgaWYgKGQuY29uZmxpY3QgJiYgZC5zdGF0ZSkge1xuICAgICAgICBzZXRXYXRjaFN0YXRlKGQuc3RhdGUpO1xuICAgICAgICBhcER1bmdEb25nQm8oZC5zdGF0ZSwgY2FuQ29udHJvbCwgcHJvdmlkZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0TG9pKGQubG9pIHx8ICdMXHUxRUQ3aSBjXHUxRUFEcCBuaFx1MUVBRHQgcGhcdTAwRTF0IHZpZGVvLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0TG9pKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RGFuZ0d1aUxlbmgoZmFsc2UpO1xuICAgICAgZGFuZ0d1aUxlbmhSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgIH1cbiAgfTtcblxuICBndWlMZW5oUmVmLmN1cnJlbnQgPSBndWlMZW5oO1xuXG4gIC8vIFx1MDExMFx1MUVEM25nIGJcdTFFRDkgdlx1MUVDQiB0clx1MDBFRCB2aWRlbyBoaVx1MUVDN24gdFx1MUVBMWkgcmEgbmdvXHUwMEUwaSBcdTAxMTFcdTFFQzMgY2hhdCBnXHUxRUFGbiB0aW1lc3RhbXBcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAodmlkZW9UaW1lUmVmKSB2aWRlb1RpbWVSZWYuY3VycmVudCA9IGxvY2FsVGltZTtcbiAgfSwgW2xvY2FsVGltZSwgdmlkZW9UaW1lUmVmXSk7XG5cblxuXG4gIC8vIE5oXHUxRUFEbiB5XHUwMEVBdSBjXHUxRUE3dSB0dWEgdFx1MUVFQiBTdHVkeURvY2sgKGJcdTFFQTVtIG1cdTFFRDFjIHZpZGVvIHRyb25nIGNoYXQvZ2hpIGNoXHUwMEZBKS5cbiAgLy8gQ1x1MDBGMyBxdXlcdTFFQzFuIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gXHUyMTkyIHBoXHUwMEUxdCBsXHUxRUM3bmggc2VlayBjaHVuZzsga2hcdTAwRjRuZyBcdTIxOTIgY2hcdTFFQzkgdHVhIGNcdTFFRTVjIGJcdTFFRDkgcGxheWVyIGNcdTFFRTdhIG1cdTAwRUNuaC5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBvblNlZWtSZXEgPSAoZSkgPT4ge1xuICAgICAgaWYgKGUuZGV0YWlsPy5waG9uZ0lkICYmIFN0cmluZyhlLmRldGFpbC5waG9uZ0lkKSAhPT0gU3RyaW5nKHBob25nPy5pZCkpIHJldHVybjtcbiAgICAgIGNvbnN0IHNlYyA9IE1hdGgubWF4KDAsIE51bWJlcihlLmRldGFpbD8uc2VjKSB8fCAwKTtcblxuICAgICAgaWYgKCFoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgc2V0SGFzSW50ZXJhY3RlZCh0cnVlKTtcbiAgICAgIH1cblxuICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3Ioc2VjKSk7XG5cbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgICB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lID0gc2VjO1xuICAgICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5zZWVrVG8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnNlZWtUbyhzZWMsIHRydWUpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3NlYywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjYW5Db250cm9sKSB7XG4gICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBzZWMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICBzZXRJc0xpdmVXaXRoSG9zdChmYWxzZSk7XG4gICAgICB9XG4gICAgfTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc3Itc2VlaycsIG9uU2Vla1JlcSk7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdzci1zZWVrJywgb25TZWVrUmVxKTtcbiAgfSwgW3Bob25nPy5pZCwgY2FuQ29udHJvbCwgcHJvdmlkZXIsIHdhdGNoU3RhdGU/LnJldmlzaW9uXSk7XG5cbiAgY29uc3QgaGFuZGxlU3RhcnRWaWV3aW5nID0gKCkgPT4ge1xuICAgIGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgc2V0SGFzSW50ZXJhY3RlZCh0cnVlKTtcbiAgICBpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBzZXRJc0xpdmVXaXRoSG9zdCh0cnVlKTtcbiAgICBzZXRWaWV3ZXJJc1BhdXNlZChmYWxzZSk7XG5cbiAgICBjb25zdCBub3dNcyA9IERhdGUubm93KCk7XG4gICAgY29uc3QgdXBkYXRlVGltZU1zID0gd2F0Y2hTdGF0ZS51cGRhdGVkQXQgPyBuZXcgRGF0ZShTdHJpbmcod2F0Y2hTdGF0ZS51cGRhdGVkQXQpLnJlcGxhY2UoJyAnLCAnVCcpICsgKFN0cmluZyh3YXRjaFN0YXRlLnVwZGF0ZWRBdCkuaW5jbHVkZXMoJ1QnKSA/ICcnIDogJ1onKSkuZ2V0VGltZSgpIDogbm93TXM7XG4gICAgY29uc3QgZWxhcHNlZFNlYyA9IE1hdGgubWF4KDAsIChub3dNcyAtIHVwZGF0ZVRpbWVNcykgLyAxMDAwKTtcbiAgICBsZXQgdGFyZ2V0UG9zID0gTnVtYmVyKHdhdGNoU3RhdGUucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgIHRhcmdldFBvcyA9IE51bWJlcih3YXRjaFN0YXRlLmJhc2VQb3NpdGlvblNlY29uZHMgIT0gbnVsbCA/IHdhdGNoU3RhdGUuYmFzZVBvc2l0aW9uU2Vjb25kcyA6IHdhdGNoU3RhdGUucG9zaXRpb25TZWNvbmRzKSArIChlbGFwc2VkU2VjICogKHdhdGNoU3RhdGUucGxheWJhY2tSYXRlIHx8IDEuMCkpO1xuICAgIH1cbiAgICB0YXJnZXRQb3MgPSBNYXRoLm1heCgwLCBOdW1iZXIodGFyZ2V0UG9zLnRvRml4ZWQoMikpKTtcblxuICAgIGhhc1NlZWtlZEluaXRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IodGFyZ2V0UG9zKSk7XG5cbiAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHYgPSB2aWRlb1JlZi5jdXJyZW50O1xuICAgICAgaWYgKHRhcmdldFBvcyA+IDApIHYuY3VycmVudFRpbWUgPSB0YXJnZXRQb3M7XG4gICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgIHYucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHYucGF1c2UoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgaWYgKHRhcmdldFBvcyA+IDApIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnNlZWtUbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQuc2Vla1RvKHRhcmdldFBvcywgdHJ1ZSk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFt0YXJnZXRQb3MsIHRydWVdIH0pLCAnKicpO1xuICAgICAgfVxuICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8ucGxheVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoJ3tcImV2ZW50XCI6XCJjb21tYW5kXCIsXCJmdW5jXCI6XCJwbGF5VmlkZW9cIixcImFyZ3NcIjpcIlwifScsICcqJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8ucGF1c2VWaWRlbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZSgne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBhdXNlVmlkZW9cIixcImFyZ3NcIjpcIlwifScsICcqJyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIE5nXHUwMUIwXHUxRUREaSB0aGFtIGdpYSBiXHUxRUE1bSBuXHUwMEZBdCBcIlRyXHUxRUYxYyB0aVx1MUVCRnBcIiBcdTAxMTFcdTFFQzMgbmhcdTFFQTN5IHZcdTFFQzEgdGltZWxpbmUgY1x1MUVFN2EgY2hcdTFFRTcgcGhcdTAwRjJuZ1xuICBjb25zdCBoYW5kbGVHb0xpdmUgPSAoKSA9PiB7XG4gICAgaWYgKCFoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpIHtcbiAgICAgIGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICBzZXRIYXNJbnRlcmFjdGVkKHRydWUpO1xuICAgIH1cbiAgICBpc1Byb2dyYW1tYXRpY0FjdGlvblJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBjb25zdCB0YXJnZXRQb3MgPSBnZXRIb3N0Q3VycmVudFBvcygpO1xuICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKHRhcmdldFBvcykpO1xuICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHNldElzTGl2ZVdpdGhIb3N0KHRydWUpO1xuICAgIHNldFZpZXdlcklzUGF1c2VkKCF3YXRjaFN0YXRlLnBsYXlpbmcpO1xuICAgIGxhc3RBcHBsaWVkUmV2aXNpb25SZWYuY3VycmVudCA9IHdhdGNoU3RhdGUucmV2aXNpb247XG5cbiAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSB0YXJnZXRQb3M7XG4gICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgIHZpZGVvUmVmLmN1cnJlbnQucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpZGVvUmVmLmN1cnJlbnQucGF1c2UoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5zZWVrVG8pIHtcbiAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8odGFyZ2V0UG9zLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgfVxuICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFt0YXJnZXRQb3MsIHRydWVdIH0pLCAnKicpO1xuXG4gICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wbGF5VmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZSgne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBsYXlWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wYXVzZVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wYXVzZVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKCd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwicGF1c2VWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlzUHJvZ3JhbW1hdGljQWN0aW9uUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICB9LCA4MDApO1xuICB9O1xuXG4gIC8vIE5nXHUwMUIwXHUxRUREaSB0aGFtIGdpYSB0XHUxRUYxIGJcdTFFQTVtIFRcdTFFQTFtIGRcdTFFRUJuZyAvIFRpXHUxRUJGcCB0XHUxRUU1YyBjXHUxRUU1YyBiXHUxRUQ5XG4gIGNvbnN0IGhhbmRsZVZpZXdlclRvZ2dsZVBsYXkgPSAoKSA9PiB7XG4gICAgaWYgKCFoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpIHtcbiAgICAgIGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICBzZXRIYXNJbnRlcmFjdGVkKHRydWUpO1xuICAgIH1cbiAgICBpZiAodmlld2VySXNQYXVzZWQpIHtcbiAgICAgIC8vIFRpXHUxRUJGcCB0XHUxRUU1YyBwaFx1MDBFMXRcbiAgICAgIHNldFZpZXdlcklzUGF1c2VkKGZhbHNlKTtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgICB2aWRlb1JlZi5jdXJyZW50LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBsYXlWaWRlbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZSgne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBsYXlWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVFx1MUVBMW0gZFx1MUVFQm5nXG4gICAgICBzZXRWaWV3ZXJJc1BhdXNlZCh0cnVlKTtcbiAgICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIHNldElzTGl2ZVdpdGhIb3N0KGZhbHNlKTtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgICB2aWRlb1JlZi5jdXJyZW50LnBhdXNlKCk7XG4gICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBhdXNlVmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBhdXNlVmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKCd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwicGF1c2VWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gTmdcdTAxQjBcdTFFRERpIHRoYW0gZ2lhIHRcdTFFRjEgdHVhIHRyXHUwMEVBbiBzbGlkZXIgY1x1MUVFNWMgYlx1MUVEOVxuICBjb25zdCBoYW5kbGVWaWV3ZXJTZWVrID0gKHNlYykgPT4ge1xuICAgIGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgc2V0TG9jYWxUaW1lKHNlYyk7XG4gICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgIHNldElzTGl2ZVdpdGhIb3N0KGZhbHNlKTtcbiAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSBzZWM7XG4gICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8uc2Vla1RvKSB7XG4gICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQuc2Vla1RvKHNlYywgdHJ1ZSk7IH0gY2F0Y2gge31cbiAgICAgIH1cbiAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbc2VjLCB0cnVlXSB9KSwgJyonKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT17YGZsZXggZmxleC1jb2wgbWluLXctMCB3LWZ1bGwgJHtpc1Jvb21XaWRlID8gJ2gtZnVsbCBmbGV4LTEgbWluLWgtMCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXInIDogJ2dhcC00J31gfT5cbiAgICAgIHsvKiBLaHVuZyBwaFx1MDBFMXQgdmlkZW8gY2hcdTAwRURuaCBcdTIwMTQga2h1bmcgbmVvbiBtXHUxRUREIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgaFx1MUVDNyBnYW1lIGFyZW5hICovfVxuICAgICAgPGRpdlxuICAgICAgICBzdHlsZT17XG4gICAgICAgICAgaXNSb29tV2lkZSAmJiBsYXlvdXRSYXRpbyA9PT0gJzEwOjAnXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICBtYXhIZWlnaHQ6ICdjYWxjKDEwMHZoIC0gNzZweCknLFxuICAgICAgICAgICAgICAgIG1heFdpZHRoOiAnY2FsYygoMTAwdmggLSA3NnB4KSAqIDE2IC8gOSknLFxuICAgICAgICAgICAgICAgIGFzcGVjdFJhdGlvOiAnMTYgLyA5JyxcbiAgICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgICAgIGhlaWdodDogJ2F1dG8nLFxuICAgICAgICAgICAgICAgIG1hcmdpbjogJzAgYXV0bycsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDogaXNSb29tV2lkZVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgbWF4SGVpZ2h0OiAnY2FsYygxMDB2aCAtIDg0cHgpJyxcbiAgICAgICAgICAgICAgICBhc3BlY3RSYXRpbzogJzE2IC8gOScsXG4gICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICdhdXRvJyxcbiAgICAgICAgICAgICAgICBtYXJnaW46ICcwIGF1dG8nLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICB9XG4gICAgICAgIGNsYXNzTmFtZT1cInJlbGF0aXZlIHctZnVsbCBhc3BlY3QtdmlkZW8gYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMDUwNzBiXSB0by1ibGFjayByb3VuZGVkLTJ4bCBvdmVyZmxvdy1oaWRkZW4gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMTUgcmluZy0xIHJpbmctd2hpdGUvNSBzaGFkb3ctWzBfMF82MHB4X3JnYmEoMCwyNDIsMjU0LDAuMDcpLDBfMzBweF82MHB4Xy0xNXB4X3JnYmEoMCwwLDAsMC43KV1cIlxuICAgICAgPlxuICAgICAgICB7LyogT3ZlcmxheSBBdXRvcGxheSAvIEdlc3R1cmUgY2hvIG5nXHUwMUIwXHUxRUREaSB4ZW0gKi99XG4gICAgICAgIHshaGFzSW50ZXJhY3RlZCAmJiAhY2FuQ29udHJvbCAmJiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyB8fCBwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScpICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgei0yMCBiZy1ibGFjay83NSBiYWNrZHJvcC1ibHVyLXNtIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNCB0ZXh0LWNlbnRlciBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTE0IGgtMTQgcm91bmRlZC1mdWxsIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LTJ4bCBtYi0zIHNoYWRvdy1bMF8wXzI1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGFuaW1hdGUtcHVsc2VcIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERkFDXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlIG1iLTFcIj5YZW0gQ2h1bmcgQ1x1MDBGOW5nIFBoXHUwMEYybmc8L3A+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIG1heC13LXhzIG1iLTRcIj5cbiAgICAgICAgICAgICAgQlx1MUVBNW0gblx1MDBGQXQgYlx1MDBFQW4gZFx1MDFCMFx1MUVEQmkgXHUwMTExXHUxRUMzIGNcdTFFQTVwIHF1eVx1MUVDMW4gXHUwMEUybSB0aGFuaCB2XHUwMEUwIGNcdTAwRjluZyB0aGVvIGRcdTAwRjVpIHRpbWVsaW5lIHZcdTFFREJpIGNoXHUxRUU3IHBoXHUwMEYybmcuXG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiYnRuLXZpZXdlci1zdGFydC13YXRjaFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVTdGFydFZpZXdpbmd9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMi41IHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzNCODJGNl0gdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQteHMgc2hhZG93LWxnIGhvdmVyOm9wYWNpdHktOTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MjVCNjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVBRnQgXHUwMTExXHUxRUE3dSB4ZW0gY1x1MDBGOW5nIHBoXHUwMEYybmc8L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogRmxvYXRpbmcgTGl2ZSBCYWRnZSAmIFN5bmMgQnV0dG9uIChoaVx1MUVDM24gdGhcdTFFQ0IgdHJcdTFFRjFjIHRpXHUxRUJGcCB0clx1MDBFQW4gZ1x1MDBGM2MgdmlkZW8gY1x1MUVBMyB0aFx1MDFCMFx1MUVERG5nIGxcdTFFQUJuIGZ1bGxzY3JlZW4pICovfVxuICAgICAgICB7cHJvdmlkZXIgIT09ICdVTlNVUFBPUlRFRCcgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgdG9wLTMuNSByaWdodC0zLjUgei0xMCBwb2ludGVyLWV2ZW50cy1hdXRvIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICB7Y2FuQ29udHJvbCA/IChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHB4LTMgcHktMS41IHJvdW5kZWQtZnVsbCBiZy1ibGFjay83MCBiYWNrZHJvcC1ibHVyLW1kIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIHRleHQtWyMwMEYyRkVdIHRleHQteHMgZm9udC1ibGFjayBzaGFkb3ctbGdcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ3LTIgaC0yIHJvdW5kZWQtZnVsbCBiZy1bIzAwRjJGRV0gYW5pbWF0ZS1wdWxzZVwiIC8+XG4gICAgICAgICAgICAgICAgPHNwYW4+Q0hcdTFFRTYgUEhcdTAwRDJORyBUUlx1MUVGMEMgVElcdTFFQkVQPC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkgOiBpc0xpdmVXaXRoSG9zdCA/IChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHB4LTMgcHktMS41IHJvdW5kZWQtZnVsbCBiZy1ibGFjay83MCBiYWNrZHJvcC1ibHVyLW1kIGJvcmRlciBib3JkZXItcm9zZS01MDAvNDAgdGV4dC1yb3NlLTQwMCB0ZXh0LXhzIGZvbnQtYmxhY2sgc2hhZG93LWxnXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidy0yIGgtMiByb3VuZGVkLWZ1bGwgYmctcm9zZS01MDAgYW5pbWF0ZS1wdWxzZVwiIC8+XG4gICAgICAgICAgICAgICAgPHNwYW4+VFJcdTFFRjBDIFRJXHUxRUJFUDwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tdmlld2VyLWdvLWxpdmUtZmxvYXRcIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZUdvTGl2ZX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHB4LTMuNSBweS0xLjUgcm91bmRlZC1mdWxsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1yb3NlLTYwMCB0by1yZWQtNjAwIGhvdmVyOmZyb20tcm9zZS01MDAgaG92ZXI6dG8tcmVkLTUwMCB0ZXh0LXdoaXRlIHRleHQteHMgZm9udC1ibGFjayBzaGFkb3ctWzBfMF8yMHB4X3JnYmEoMjQ0LDYzLDk0LDAuNyldIGFuaW1hdGUtcHVsc2UgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsXCJcbiAgICAgICAgICAgICAgICB0aXRsZT1cIkJcdTFFQTVtIFx1MDExMVx1MUVDMyBjaHV5XHUxRUMzbiBcdTAxMTFcdTFFQkZuIHZpZGVvIHRyXHUxRUYxYyB0aVx1MUVCRnAgXHUwMTExYW5nIHBoXHUwMEUxdCBjXHUxRUU3YSBjaFx1MUVFNyBwaFx1MDBGMm5nXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidy0yIGgtMiByb3VuZGVkLWZ1bGwgYmctd2hpdGUgYW5pbWF0ZS1waW5nXCIgLz5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMzQgWGVtIGNcdTAwRjluZyBjaFx1MUVFNyBwaFx1MDBGMm5nIHsoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgaFBvcyA9IGdldEhvc3RDdXJyZW50UG9zKCk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBkID0gTWF0aC5yb3VuZChoUG9zIC0gbG9jYWxUaW1lKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBkID4gMiA/IGAoLSR7ZCA+IDYwID8gZGluaERhbmdHaWF5UGh1dChkKSA6IGQgKyAncyd9KWAgOiAnJztcbiAgICAgICAgICAgICAgICB9KSgpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBWaWRlbyBlbGVtZW50cyB0aGVvIHByb3ZpZGVyICovfVxuICAgICAgICB7eXRJZCA/IChcbiAgICAgICAgICA8ZGl2IGtleT17YHl0LXdyYXAtJHtwaG9uZy5pZH1gfSBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIHJlbGF0aXZlIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLWJsYWNrXCI+XG4gICAgICAgICAgICA8aWZyYW1lXG4gICAgICAgICAgICAgIGlkPXt5dENvbnRhaW5lcklkfVxuICAgICAgICAgICAgICBrZXk9e2B5dC1mcmFtZS0ke3Bob25nLmlkfWB9XG4gICAgICAgICAgICAgIHNyYz17YGh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkLyR7eXRJZH0/ZW5hYmxlanNhcGk9MSZvcmlnaW49JHtlbmNvZGVVUklDb21wb25lbnQodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cubG9jYXRpb24ub3JpZ2luIDogJycpfSZ3aWRnZXRfcmVmZXJyZXI9JHtlbmNvZGVVUklDb21wb25lbnQodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cubG9jYXRpb24uaHJlZiA6ICcnKX0mcmVsPTAmbW9kZXN0YnJhbmRpbmc9MSZwbGF5c2lubGluZT0xYH1cbiAgICAgICAgICAgICAgdGl0bGU9e3Bob25nLnRlbiB8fCAnWW91VHViZSBWaWRlbyd9XG4gICAgICAgICAgICAgIGFsbG93PVwiYWNjZWxlcm9tZXRlcjsgYXV0b3BsYXk7IGNsaXBib2FyZC13cml0ZTsgZW5jcnlwdGVkLW1lZGlhOyBneXJvc2NvcGU7IHBpY3R1cmUtaW4tcGljdHVyZTsgd2ViLXNoYXJlXCJcbiAgICAgICAgICAgICAgYWxsb3dGdWxsU2NyZWVuXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgYm9yZGVyLTBcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IGRydklkID8gKFxuICAgICAgICAgIDxpZnJhbWVcbiAgICAgICAgICAgIHNyYz17YGh0dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS9maWxlL2QvJHtkcnZJZH0vcHJldmlld2B9XG4gICAgICAgICAgICB0aXRsZT17cGhvbmcudGVufVxuICAgICAgICAgICAgYWxsb3c9XCJhdXRvcGxheTsgZnVsbHNjcmVlblwiXG4gICAgICAgICAgICBhbGxvd0Z1bGxTY3JlZW5cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGxcIlxuICAgICAgICAgIC8+XG4gICAgICAgICkgOiB0cnVjVGllcFVybCA/IChcbiAgICAgICAgICA8dmlkZW9cbiAgICAgICAgICAgIHJlZj17dmlkZW9SZWZ9XG4gICAgICAgICAgICBzcmM9e3RydWNUaWVwVXJsfVxuICAgICAgICAgICAgcGxheXNJbmxpbmVcbiAgICAgICAgICAgIGRhdGEtdGVzdGlkPVwic3R1ZHktdmlkZW8tcGxheWVyXCJcbiAgICAgICAgICAgIGNvbnRyb2xzPXt0cnVlfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY29udGFpblwiXG4gICAgICAgICAgICBvbkxvYWRlZE1ldGFkYXRhPXtlID0+IHtcbiAgICAgICAgICAgICAgaWYgKGUudGFyZ2V0LmR1cmF0aW9uID4gMCkgc2V0RHVyYXRpb24oZS50YXJnZXQuZHVyYXRpb24pO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uUGxheT17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiAhd2F0Y2hTdGF0ZS5wbGF5aW5nICYmICFkYW5nR3VpTGVuaCkge1xuICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3BsYXknLCB2aWRlb1JlZi5jdXJyZW50Py5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWNhbkNvbnRyb2wgJiYgIWlzUHJvZ3JhbW1hdGljQWN0aW9uUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZChmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvblBhdXNlPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmIHdhdGNoU3RhdGUucGxheWluZyAmJiAhZGFuZ0d1aUxlbmgpIHtcbiAgICAgICAgICAgICAgICBndWlMZW5oKCdwYXVzZScsIHZpZGVvUmVmLmN1cnJlbnQ/LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICghY2FuQ29udHJvbCAmJiAhaXNQcm9ncmFtbWF0aWNBY3Rpb25SZWYuY3VycmVudCAmJiB3YXRjaFN0YXRlUmVmLmN1cnJlbnQucGxheWluZykge1xuICAgICAgICAgICAgICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzZXRJc0xpdmVXaXRoSG9zdChmYWxzZSk7XG4gICAgICAgICAgICAgICAgc2V0Vmlld2VySXNQYXVzZWQodHJ1ZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvbkVuZGVkPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sKSBoYW5oRG9uZ1F1ZXVlKCdza2lwJyk7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25TZWVrZWQ9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGlzUHJvZ3JhbW1hdGljQWN0aW9uUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGFuZ0d1aUxlbmggfHwgaXNTZWVraW5nUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXIgPSB2aWRlb1JlZi5jdXJyZW50Py5jdXJyZW50VGltZTtcbiAgICAgICAgICAgICAgICBpZiAoY3VyID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAvLyBDaFx1MUVEMW5nIHZcdTAwRjJuZyBsXHUxRUI3cDogbVx1MUVDRGkgZ1x1MDBFMW4gY3VycmVudFRpbWUgblx1MUVEOWkgYlx1MUVEOSAob3B0aW1pc3RpYyBzZWVrLCBkcmlmdC1jb3JyZWN0aW9uXG4gICAgICAgICAgICAgICAgLy8gY1x1MUVFN2EgYXBEdW5nRG9uZ0JvKSBcdTAxMTFcdTFFQzF1IGJcdTFFQUZuICdzZWVrZWQnLiBDaFx1MUVDOSBnXHUxRUVEaSBsXHUxRUM3bmgga2hpIHZcdTFFQ0IgdHJcdTAwRUQgbFx1MUVDN2NoIGtoXHUxRUNGaVxuICAgICAgICAgICAgICAgIC8vIHZcdTFFQ0IgdHJcdTAwRUQgc2VydmVyIGtcdTFFRjMgdlx1MUVDRG5nID4xLjVzIFx1MjAxNCB0XHUxRUU5YyBuZ1x1MDFCMFx1MUVERGkgZFx1MDBGOW5nIHRoXHUxRUFEdCBzXHUxRUYxIHR1YSBxdWEgdGhhbmggY29udHJvbHMuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3QgPSB3YXRjaFN0YXRlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVwZE1zID0gc3Q/LnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyhzdC51cGRhdGVkQXQpLnJlcGxhY2UoJyAnLCAnVCcpICsgKFN0cmluZyhzdC51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKSA6IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZWxhcHNlZCA9IE1hdGgubWF4KDAsIChEYXRlLm5vdygpIC0gdXBkTXMpIC8gMTAwMCk7XG4gICAgICAgICAgICAgICAgY29uc3Qga3lWb25nID0gc3Q/LnBsYXlpbmdcbiAgICAgICAgICAgICAgICAgID8gTnVtYmVyKHN0LmJhc2VQb3NpdGlvblNlY29uZHMgfHwgMCkgKyBlbGFwc2VkICogKHN0LnBsYXliYWNrUmF0ZSB8fCAxKVxuICAgICAgICAgICAgICAgICAgOiBOdW1iZXIoc3Q/LnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VyIC0ga3lWb25nKSA+IDEuNSkgZ3VpTGVuaCgnc2VlaycsIGN1cik7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VyID0gdmlkZW9SZWYuY3VycmVudD8uY3VycmVudFRpbWUgfHwgMDtcbiAgICAgICAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjdXIpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBob3N0UG9zID0gZ2V0SG9zdEN1cnJlbnRQb3MoKTtcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VyIC0gaG9zdFBvcykgPiAzLjApIHtcbiAgICAgICAgICAgICAgICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIHNldElzTGl2ZVdpdGhIb3N0KGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgLz5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGgtZnVsbCB0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIHAtNiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC0yeGwgbWItMlwiPlx1MjZBMFx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkxpbmsgdmlkZW8ga2hcdTAwRjRuZyBoXHUxRUQ3IHRyXHUxRUUzIHBoXHUwMEUxdCB0clx1MUVGMWMgdGlcdTFFQkZwIGhvXHUxRUI3YyBraFx1MDBGNG5nIGhcdTFFRTNwIGxcdTFFQzcuPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBUaFx1MDBGNG5nIGJcdTAwRTFvIHJpXHUwMEVBbmcgY2hvIEdvb2dsZSBEcml2ZSAqL31cbiAgICAgIHtkcnZJZCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMy41IHB5LTIgYmctYW1iZXItNTAwLzEwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzIwIHJvdW5kZWQteGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyB0ZXh0LWFtYmVyLTMwMFwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc21cIj5cdTIxMzlcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgPHNwYW4+R29vZ2xlIERyaXZlIHBoXHUwMEUxdCBcdTFFREYgY2hcdTFFQkYgXHUwMTExXHUxRUQ5IDxzdHJvbmc+WGVtIFx1MDExMVx1MUVEOWMgbFx1MUVBRHA8L3N0cm9uZz4gKEdvb2dsZSBEcml2ZSBraFx1MDBGNG5nIGhcdTFFRDcgdHJcdTFFRTMgQVBJIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gdFx1MUVFQiB4YSkuPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBUaGFuaCBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIEhvc3QgJiBOZ1x1MDFCMFx1MUVERGkgeGVtIFx1MjAxNCBcdTFFQTluIGtoaSBmdWxsc2NyZWVuICovfVxuICAgICAgeyFpc1Jvb21XaWRlICYmIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMTYxYjI2XSB0by1bIzBmMTQxZF0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMTAgcm91bmRlZC0yeGwgcC0zIHNtOnAtMy41IGZsZXggZmxleC1jb2wgZ2FwLTMgc2hhZG93LXhsXCI+XG5cbiAgICAgICAgey8qIFRoYW5oIGNcdTAwRjRuZyBjXHUxRUU1IHBoXHUwMEUxdCBjaHVuZyAoY2hvIEhvc3QgLyBUZWFjaGVyIGtoaSBkXHUwMEY5bmcgcHJvdmlkZXIgY1x1MDBGMyB0aFx1MUVDMyBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuKSAqL31cbiAgICAgICAge2NhbkNvbnRyb2wgJiYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyB8fCBwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGl0ZW1zLWNlbnRlciBnYXAtMyBwdC0yIGJvcmRlci10IGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImJ0bi1ob3N0LXdhdGNoLXRvZ2dsZVwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKHdhdGNoU3RhdGUucGxheWluZyA/ICdwYXVzZScgOiAncGxheScpfVxuICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBzbTp3LWF1dG8gcHgtNCBweS0yIHJvdW5kZWQteGwgZm9udC1ibGFjayB0ZXh0LXhzIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xLjUgc2hhZG93LW1kIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlciBkaXNhYmxlZDpvcGFjaXR5LTUwICR7XG4gICAgICAgICAgICAgICAgd2F0Y2hTdGF0ZS5wbGF5aW5nXG4gICAgICAgICAgICAgICAgICA/ICdiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvNDAgaG92ZXI6YmctYW1iZXItNTAwLzMwIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgyNDUsMTU4LDExLDAuMjUpXSdcbiAgICAgICAgICAgICAgICAgIDogJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMwMGM2ZmZdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gaG92ZXI6YnJpZ2h0bmVzcy0xMTAnXG4gICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgPHNwYW4+e3dhdGNoU3RhdGUucGxheWluZyA/ICdcdTIzRjgnIDogJ1x1MjVCNid9PC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj57d2F0Y2hTdGF0ZS5wbGF5aW5nID8gJ1RcdTFFQTFtIERcdTFFRUJuZyBDXHUxRUEzIFBoXHUwMEYybmcnIDogJ1BoXHUwMEUxdCBDaHVuZyBDXHUxRUEzIFBoXHUwMEYybmcnfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41IHctZnVsbFwiPlxuICAgICAgICAgICAgICA8c3BhbiBpZD1cImhvc3QtZHVyYXRpb24tbGFiZWxcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICB7ZGluaERhbmdHaWF5UGh1dChsb2NhbFRpbWUpfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIGlkPVwiaG9zdC1zZWVrLXNsaWRlclwiXG4gICAgICAgICAgICAgICAgdHlwZT1cInJhbmdlXCJcbiAgICAgICAgICAgICAgICBtaW49XCIwXCJcbiAgICAgICAgICAgICAgICBtYXg9e2R1cmF0aW9uID4gMCA/IGR1cmF0aW9uIDogTWF0aC5tYXgobG9jYWxUaW1lLCAzMDApfVxuICAgICAgICAgICAgICAgIHN0ZXA9XCIxXCJcbiAgICAgICAgICAgICAgICB2YWx1ZT17bG9jYWxUaW1lfVxuICAgICAgICAgICAgICAgIG9uTW91c2VEb3duPXsoKSA9PiB7IGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICBvblRvdWNoU3RhcnQ9eygpID0+IHsgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldExvY2FsVGltZShOdW1iZXIoZS50YXJnZXQudmFsdWUpKX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlVXA9e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBOdW1iZXIoZS50YXJnZXQudmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uVG91Y2hFbmQ9e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBOdW1iZXIoZS50YXJnZXQudmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBoLTEuNSBiZy13aGl0ZS8xMCByb3VuZGVkLWxnIGFwcGVhcmFuY2Utbm9uZSBjdXJzb3ItcG9pbnRlciBhY2NlbnQtWyMwMEYyRkVdXCJcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1tb25vIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAge2R1cmF0aW9uID4gMCA/IGRpbmhEYW5nR2lheVBodXQoZHVyYXRpb24pIDogJy0tOi0tJ31cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRoYW5oIGNcdTAwRjRuZyBjXHUxRUU1IGNobyBOZ1x1MDFCMFx1MUVERGkgdGhhbSBnaWEgKHRcdTFFQTFtIGRcdTFFRUJuZyByaVx1MDBFQW5nLCB0aW1lbGluZSByaVx1MDBFQW5nICYgblx1MDBGQXQgdHJcdTFFRjFjIHRpXHUxRUJGcCB0aGVvIGNoXHUxRUU3IHBoXHUwMEYybmcpICovfVxuICAgICAgICB7IWNhbkNvbnRyb2wgJiYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyB8fCBwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGl0ZW1zLWNlbnRlciBnYXAtMyBwdC0yIGJvcmRlci10IGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB3LWZ1bGwgc206dy1hdXRvXCI+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi12aWV3ZXItd2F0Y2gtdG9nZ2xlXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVWaWV3ZXJUb2dnbGVQbGF5fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBzbTp3LWF1dG8gcHgtNCBweS0yIHJvdW5kZWQteGwgZm9udC1ibGFjayB0ZXh0LXhzIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xLjUgc2hhZG93LW1kIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlciAke1xuICAgICAgICAgICAgICAgICAgdmlld2VySXNQYXVzZWRcbiAgICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBob3ZlcjpicmlnaHRuZXNzLTExMCdcbiAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvMTAgdGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IGhvdmVyOmJnLXdoaXRlLzE1J1xuICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dmlld2VySXNQYXVzZWQgPyAnXHUyNUI2JyA6ICdcdTIzRjgnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dmlld2VySXNQYXVzZWQgPyAnVGlcdTFFQkZwIFRcdTFFRTVjIFhlbScgOiAnVFx1MUVBMW0gRFx1MUVFQm5nIFZpZGVvJ308L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi12aWV3ZXItZ28tbGl2ZS1iYXJcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZUdvTGl2ZX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgc206dy1hdXRvIHB4LTQgcHktMiByb3VuZGVkLXhsIGZvbnQtYmxhY2sgdGV4dC14cyB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMS41IHNoYWRvdy1tZCBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXIgJHtcbiAgICAgICAgICAgICAgICAgIGlzTGl2ZVdpdGhIb3N0XG4gICAgICAgICAgICAgICAgICAgID8gJ2JnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS00MDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCdcbiAgICAgICAgICAgICAgICAgICAgOiAnYmctZ3JhZGllbnQtdG8tciBmcm9tLXJvc2UtNjAwIHRvLXJlZC02MDAgdGV4dC13aGl0ZSBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMjQ0LDYzLDk0LDAuNSldIGFuaW1hdGUtcHVsc2UgaG92ZXI6YnJpZ2h0bmVzcy0xMTAnXG4gICAgICAgICAgICAgICAgfWB9XG4gICAgICAgICAgICAgICAgdGl0bGU9e2lzTGl2ZVdpdGhIb3N0ID8gJ1x1MDExMGFuZyB4ZW0gdHJcdTFFRjFjIHRpXHUxRUJGcCBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IHZcdTFFREJpIGNoXHUxRUU3IHBoXHUwMEYybmcnIDogJ0JcdTFFQTVtIFx1MDExMVx1MUVDMyBuaFx1MUVBM3kgdFx1MUVEQmkgdmlkZW8gXHUwMTExYW5nIGNoXHUxRUExeSBjXHUxRUU3YSBjaFx1MUVFNyBwaFx1MDBGMm5nJ30+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdy0yIGgtMiByb3VuZGVkLWZ1bGwgJHtpc0xpdmVXaXRoSG9zdCA/ICdiZy1yb3NlLTUwMCBhbmltYXRlLXB1bHNlJyA6ICdiZy13aGl0ZSd9YH0gLz5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICAgIHtpc0xpdmVXaXRoSG9zdFxuICAgICAgICAgICAgICAgICAgICA/ICdUclx1MUVGMWMgVGlcdTFFQkZwJ1xuICAgICAgICAgICAgICAgICAgICA6IGBUclx1MUVGMWMgVGlcdTFFQkZwICR7KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhQb3MgPSBnZXRIb3N0Q3VycmVudFBvcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IE1hdGgucm91bmQoaFBvcyAtIGxvY2FsVGltZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZCA+IDIgPyBgKENoXHUxRUFEbSAke2QgPiA2MCA/IGRpbmhEYW5nR2lheVBodXQoZCkgOiBkICsgJ3MnfSlgIDogJyc7XG4gICAgICAgICAgICAgICAgICAgICAgfSkoKX1gfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSB3LWZ1bGxcIj5cbiAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJ2aWV3ZXItZHVyYXRpb24tbGFiZWxcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICB7ZGluaERhbmdHaWF5UGh1dChsb2NhbFRpbWUpfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIGlkPVwidmlld2VyLXNlZWstc2xpZGVyXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwicmFuZ2VcIlxuICAgICAgICAgICAgICAgIG1pbj1cIjBcIlxuICAgICAgICAgICAgICAgIG1heD17ZHVyYXRpb24gPiAwID8gZHVyYXRpb24gOiBNYXRoLm1heChsb2NhbFRpbWUsIDMwMCl9XG4gICAgICAgICAgICAgICAgc3RlcD1cIjFcIlxuICAgICAgICAgICAgICAgIHZhbHVlPXtsb2NhbFRpbWV9XG4gICAgICAgICAgICAgICAgb25Nb3VzZURvd249eygpID0+IHsgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgIG9uVG91Y2hTdGFydD17KCkgPT4geyBpc1NlZWtpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0TG9jYWxUaW1lKE51bWJlcihlLnRhcmdldC52YWx1ZSkpfVxuICAgICAgICAgICAgICAgIG9uTW91c2VVcD17ZSA9PiBoYW5kbGVWaWV3ZXJTZWVrKE51bWJlcihlLnRhcmdldC52YWx1ZSkpfVxuICAgICAgICAgICAgICAgIG9uVG91Y2hFbmQ9e2UgPT4gaGFuZGxlVmlld2VyU2VlayhOdW1iZXIoZS50YXJnZXQudmFsdWUpKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgaC0xLjUgYmctd2hpdGUvMTAgcm91bmRlZC1sZyBhcHBlYXJhbmNlLW5vbmUgY3Vyc29yLXBvaW50ZXIgYWNjZW50LVsjMDBGMkZFXVwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIHtkdXJhdGlvbiA+IDAgPyBkaW5oRGFuZ0dpYXlQaHV0KGR1cmF0aW9uKSA6ICctLTotLSd9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHtsb2kgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXJvc2UtNDAwXCI+e2xvaX08L3A+fVxuICAgICAgICB7cGhvbmcubW9UYSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCBsZWFkaW5nLXJlbGF4ZWQgcHQtMVwiPntwaG9uZy5tb1RhfTwvcD59XG5cbiAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIFx1MjUwMFx1MjUwMFx1MjUwMCBWXHUwMEQ5TkcgMTogVFJVTkcgVFx1MDBDMk0gQ1x1MUVBNFUgSFx1MDBDQ05IIFZJREVPICYgSFx1MDBDME5HIFx1MDExMFx1MUVFMkkgWU9VVFVCRSBUUlx1MUVGMEMgVElcdTFFQkVQIFx1MjUwMFx1MjUwMFx1MjUwMCAqL31cbiAgICAgIHshaXNSb29tV2lkZSAmJiAoXG4gICAgICAgIDxkaXYgaWQ9XCJ2dW5nMS15b3V0dWJlLXN0dWRpb1wiIHN0eWxlPXt7IG92ZXJmbG93QW5jaG9yOiAnbm9uZScgfX0gY2xhc3NOYW1lPVwiYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMTYxYjI2XSB0by1bIzBmMTQxZF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTMuNSBzbTpwLTQgZmxleCBmbGV4LWNvbCBnYXAtMyBzaGFkb3cteGxcIj5cbiAgICAgICAgICB7LyogSGVhZGVyIHRydW5nIHRcdTAwRTJtICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIHBiLTIuNSBib3JkZXItYiBib3JkZXItd2hpdGUvMTAgZmxleC13cmFwXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInctOCBoLTggcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1iciBmcm9tLVsjMDBGMkZFXS8yMCB0by12aW9sZXQtNTAwLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtc20gc2hhZG93LVswXzBfMTJweF9yZ2JhKDAsMjQyLDI1NCwwLjI1KV1cIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0NcdURGQUNcbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHNtOnRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPkNcdTFFQTV1IGhcdTAwRUNuaCBWaWRlbyAmIEhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIFlvdVR1YmU8L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZC1mdWxsIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RofSBcdTAxMTFhbmcgY2hcdTFFRERcbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwXCI+VFx1MDBFQ20ga2lcdTFFQkZtIHZpZGVvLCBcdTAxMTFcdTAxQjBhIHZcdTAwRTBvIGhcdTAwRTBuZyBjaFx1MUVERCB2XHUwMEUwIGNoXHUxRUExeSB2aWRlbyBraFx1MDBFMWMgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBjXHUxRUEzIHBoXHUwMEYybmc8L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICB7LyogVGFiIHNlbGVjdG9yICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGJnLVsjMEIwRTE0XSBwLTEgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi1tZWRpYS10YWItc2VhcmNoXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgZ2l1Tmd1eWVuVmlUcmlDdW9uKCgpID0+IHNldE1lZGlhVGFiKCdzZWFyY2gnKSk7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgICAgICAgbWVkaWFUYWIgPT09ICdzZWFyY2gnXG4gICAgICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctbWQnXG4gICAgICAgICAgICAgICAgICAgICAgOiAndGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPlRcdTAwRUNtIFlvdVR1YmU8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi1tZWRpYS10YWItcXVldWVcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBnaXVOZ3V5ZW5WaVRyaUN1b24oKCkgPT4gc2V0TWVkaWFUYWIoJ3F1ZXVlJykpO1xuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMS41IHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgICAgICAgIG1lZGlhVGFiID09PSAncXVldWUnXG4gICAgICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLXZpb2xldC01MDAgdG8tZnVjaHNpYS01MDAgdGV4dC13aGl0ZSBzaGFkb3ctbWQnXG4gICAgICAgICAgICAgICAgICAgICAgOiAndGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENDQjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPkhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpICh7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBUb2dnbGUgdGh1IGdcdTFFQ0RuICovfVxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tdG9nZ2xlLXN0dWRpb1wiXG4gICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICBnaXVOZ3V5ZW5WaVRyaUN1b24oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXREYU1vUm9uZ1N0dWRpbyhwcmV2ID0+ICFwcmV2KTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgdGl0bGU9e2RhTW9Sb25nU3R1ZGlvID8gJ1RodSBnXHUxRUNEbicgOiAnTVx1MUVERiByXHUxRUQ5bmcnfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctOCBoLTggcm91bmRlZC14bCBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgIHtkYU1vUm9uZ1N0dWRpbyA/ICdcdTI1QjInIDogJ1x1MjVCQyd9XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7LyogVG9hc3QgdGhcdTAwRjRuZyBiXHUwMEUxbyAvIExcdTFFRDdpICovfVxuICAgICAgICAgIHt0aG9uZ0Jhb1ZpZGVvICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMyBweS0yIHJvdW5kZWQteGwgYmctZW1lcmFsZC01MDAvMTUgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LWVtZXJhbGQtMzAwIHRleHQteHMgZm9udC1ib2xkIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGFuaW1hdGUtZmFkZUluXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MjcyODwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+e3Rob25nQmFvVmlkZW99PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgICB7bG9pVmlkZW8gJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zIHB5LTIgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xNSBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRleHQtcm9zZS0zMDAgdGV4dC14cyBmb250LWJvbGQgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgYW5pbWF0ZS1mYWRlSW5cIj5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNkEwXHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj57bG9pVmlkZW99PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cblxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMCBlYXNlLWluLW91dCBvdmVyZmxvdy1oaWRkZW4gZmxleCBmbGV4LWNvbCBtaW4taC0wICR7XG4gICAgICAgICAgICAgIGRhTW9Sb25nU3R1ZGlvID8gJ21heC1oLVszODBweF0gb3BhY2l0eS0xMDAnIDogJ21heC1oLTAgb3BhY2l0eS0wIHBvaW50ZXItZXZlbnRzLW5vbmUnXG4gICAgICAgICAgICB9YH1cbiAgICAgICAgICAgIHN0eWxlPXt7IG92ZXJmbG93QW5jaG9yOiAnbm9uZScgfX0+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtWzM0MHB4XSBmbGV4IGZsZXgtY29sIG1pbi1oLTAgb3ZlcmZsb3ctaGlkZGVuIHNocmluay0wXCI+XG4gICAgICAgICAgICAgIHsvKiBUQUIgMTogVFx1MDBDQ00gS0lcdTFFQkVNIFlPVVRVQkUgJiBcdTAxMTBcdTFFRDRJIFZJREVPICovfVxuICAgICAgICAgICAgICB7bWVkaWFUYWIgPT09ICdzZWFyY2gnICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtZnVsbCBmbGV4IGZsZXgtY29sIGdhcC0yLjUgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgey8qIFx1MDBENCB0XHUwMEVDbSBraVx1MUVCRm0gLyBkXHUwMEUxbiBsaW5rIFx1MDExMWEgblx1MDEwM25nICovfVxuICAgICAgICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9eyhlKSA9PiB0aW1LaWVtWW91VHViZShlKX0gY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtMiBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBmbGV4LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFic29sdXRlIGxlZnQtMyB0b3AtMS8yIC10cmFuc2xhdGUteS0xLzIgdGV4dC1zbGF0ZS00MDAgdGV4dC14c1wiPlx1RDgzRFx1REQwRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImlucHV0LXZ1bmcxLXlvdXR1YmUtc2VhcmNoXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17eXRRdWVyeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0WXRRdWVyeShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiTmhcdTFFQURwIHRcdTFFRUIga2hcdTAwRjNhIHRcdTAwRUNtIGtpXHUxRUJGbSBZb3VUdWJlICh2ZDogbG9maSBoXHUxRUNEYyBiXHUwMEUwaS4uLikgaG9cdTFFQjdjIGRcdTAwRTFuIGxpbmsgdmlkZW8uLi5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS82MCByb3VuZGVkLXhsIHBsLTggcHItMyBweS0yIHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIHRyYW5zaXRpb24tYWxsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS10aW0ta2llbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXl0UXVlcnkudHJpbSgpIHx8IHNlYXJjaGluZ1l0fVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMy41IHB5LTIgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC14cyBob3ZlcjpicmlnaHRuZXNzLTExMCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgc2hhZG93LW1kIGRpc2FibGVkOm9wYWNpdHktNDAgd2hpdGVzcGFjZS1ub3dyYXAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3NlYXJjaGluZ1l0ID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFuaW1hdGUtc3BpblwiPlx1MjNGMzwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTAxMTBhbmcgdFx1MDBFQ20uLi48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMEQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+VFx1MDBFQ20ga2lcdTFFQkZtPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIHsvKiBBY3Rpb24gYnV0dG9ucyBwaFx1MUVFNSBraGkgXHUwMEY0IGlucHV0IGxcdTAwRTAgMSBsaW5rIHZpZGVvIHRyXHUxRUYxYyB0aVx1MUVCRnAgKi99XG4gICAgICAgICAgICAgICAgICAgIHtCb29sZWFuKHl0UXVlcnkudHJpbSgpLnN0YXJ0c1dpdGgoJ2h0dHA6Ly8nKSB8fCB5dFF1ZXJ5LnRyaW0oKS5zdGFydHNXaXRoKCdodHRwczovLycpIHx8IHl0UXVlcnkuaW5jbHVkZXMoJ3lvdXR1JykpICYmIChcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHAtMiByb3VuZGVkLXhsIGJnLVsjMEIwRTE0XS84MCBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8yMCBmbGV4LXdyYXAgYW5pbWF0ZS1mYWRlSW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQxNzwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+UGhcdTAwRTF0IGhpXHUxRUM3biBsaVx1MDBFQW4ga1x1MUVCRnQgdmlkZW86PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtcGhhdC1uZ2F5LWxpbmtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBkb2lWaWRlbyh5dFF1ZXJ5LnRyaW0oKSwgJ1ZpZGVvIHRcdTFFRUIgbGlcdTAwRUFuIGtcdTFFQkZ0Jyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nRG9pVmlkZW99XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctWyMwMEYyRkVdIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJsYWNrIGhvdmVyOmJnLVsjMDBlMWVjXSBhY3RpdmU6c2NhbGUtOTUgc2hhZG93LXNtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNiBQaFx1MDBFMXQgbmdheSBjXHUxRUEzIHBoXHUwMEYybmdcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtZW5xdWV1ZS1saW5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnZW5xdWV1ZScsIHsgdmlkZW9Vcmw6IHl0UXVlcnkudHJpbSgpLCB0aXRsZTogJ1ZpZGVvIHRcdTFFRUIgbGlcdTAwRUFuIGtcdTFFQkZ0JyB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1lbWVyYWxkLTUwMC8yMCB0ZXh0LWVtZXJhbGQtMzAwIGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMzAgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6YmctZW1lcmFsZC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKyBUaFx1MDBFQW0gdlx1MDBFMG8gY3VcdTFFRDFpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLWFkZC1uZXh0LWxpbmtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdhZGRfbmV4dCcsIHsgdmlkZW9Vcmw6IHl0UXVlcnkudHJpbSgpLCB0aXRsZTogJ1ZpZGVvIHRcdTFFRUIgbGlcdTAwRUFuIGtcdTFFQkZ0JyB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy12aW9sZXQtNTAwLzIwIHRleHQtdmlvbGV0LTMwMCBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvMzAgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6YmctdmlvbGV0LTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICArIFBoXHUwMEUxdCBrXHUxRUJGIHRpXHUxRUJGcFxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Zvcm0+XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBUclx1MUVBMW5nIHRoXHUwMEUxaSBsXHUxRUQ3aSB0XHUwMEVDbSBraVx1MUVCRm0gKi99XG4gICAgICAgICAgICAgICAgICB7c2VhcmNoTG9pICYmIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTIuNSByb3VuZGVkLXhsIGJnLWFtYmVyLTUwMC8xMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCB0ZXh0LXhzIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MjZBMFx1RkUwRiB7c2VhcmNoTG9pfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRTZWFyY2hMb2koJycpfSBjbGFzc05hbWU9XCJ0ZXh0LWFtYmVyLTQwMCBmb250LWJvbGQgaG92ZXI6dW5kZXJsaW5lXCI+XHUwMTEwXHUwMEYzbmc8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICB7LyogS1x1MUVCRnQgcXVcdTFFQTMgdFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmUgKi99XG4gICAgICAgICAgICAgICAgICB7eXRSZXN1bHRzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTEuNSBtaW4taC0wIG92ZXJmbG93LWhpZGRlblwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQteHMgdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENGQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+S1x1MUVCRnQgcXVcdTFFQTMgWW91VHViZSAoe3l0UmVzdWx0cy5sZW5ndGh9IHZpZGVvKTo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS1kb25nLWtldC1xdWFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldFl0UmVzdWx0cyhbXSk7IHNldFNlYXJjaExvaSgnJyk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIgcHktMC41IHJvdW5kZWQtbWQgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTUgXHUwMTEwXHUwMEYzbmcga1x1MUVCRnQgcXVcdTFFQTNcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgc3BhY2UteS0yIG92ZXJmbG93LXktYXV0byBwci0xIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt5dFJlc3VsdHMubWFwKChpdGVtLCBpZHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdlVybCA9IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PSR7aXRlbS52aWRlb0lkfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtpdGVtLnZpZGVvSWQgfHwgaWR4fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZ3JvdXAgYmctWyMwQjBFMTRdIGhvdmVyOmJnLVsjMTIxNzIxXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOmJvcmRlci1bIzAwRjJGRV0vMzAgcm91bmRlZC14bCBwLTIuNSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFRodW1ibmFpbCAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgdy0yNCBzbTp3LTI4IGFzcGVjdC12aWRlbyByb3VuZGVkLWxnIG92ZXJmbG93LWhpZGRlbiBiZy1ibGFjayBzaHJpbmstMCBib3JkZXIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGltZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYz17aXRlbS50aHVtYm5haWx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWx0PXtpdGVtLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvdmVyIGdyb3VwLWhvdmVyOnNjYWxlLTEwNSB0cmFuc2l0aW9uLXRyYW5zZm9ybVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZz1cImxhenlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBib3R0b20tMSByaWdodC0xIGJnLWJsYWNrLzgwIHB4LTEgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LW1vbm8gdGV4dC13aGl0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFlvdVR1YmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBUaFx1MDBGNG5nIHRpbiB2aWRlbyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGg1IGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtMjAwIGxpbmUtY2xhbXAtMiBncm91cC1ob3Zlcjp0ZXh0LVsjMDBGMkZFXSB0cmFuc2l0aW9uLWNvbG9yc1wiIHRpdGxlPXtpdGVtLnRpdGxlfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXRlbS50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9oNT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtdC0xIHRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0uY2hhbm5lbFRpdGxlIHx8ICdLXHUwMEVBbmggWW91VHViZSd9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpdGVtLnB1Ymxpc2hlZEF0ICYmIDxzcGFuPlx1MjAyMiB7aXRlbS5wdWJsaXNoZWRBdH08L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogQlx1MUVEOSAzIG5cdTAwRkF0IHRoYW8gdFx1MDBFMWMgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgaXRlbXMtY2VudGVyIGdhcC0xLjUgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ2hcdTFFQTF5IHZpZGVvIG5cdTAwRTB5IG5nYXkgbFx1MUVBRHAgdFx1MUVFOWMgY2hvIGNcdTFFQTMgcGhcdTAwRjJuZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZG9pVmlkZW8odlVybCwgaXRlbS50aXRsZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdEb2lWaWRlb31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMS41IHJvdW5kZWQtbGcgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzAwYzZmZl0gdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQtWzExcHhdIHNoYWRvdy1zbSBob3ZlcjpicmlnaHRuZXNzLTExMCBhY3RpdmU6c2NhbGUtOTUgZGlzYWJsZWQ6b3BhY2l0eS00MCB3aGl0ZXNwYWNlLW5vd3JhcCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNiBQaFx1MDBFMXQgbmdheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiVGhcdTAwRUFtIHZcdTAwRTBvIGN1XHUxRUQxaSBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnZW5xdWV1ZScsIHsgdmlkZW9Vcmw6IHZVcmwsIHRpdGxlOiBpdGVtLnRpdGxlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8yNSB0ZXh0LVsxMXB4XSBmb250LWJvbGQgYWN0aXZlOnNjYWxlLTk1IGRpc2FibGVkOm9wYWNpdHktNDAgd2hpdGVzcGFjZS1ub3dyYXAgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIEhcdTAwRTBuZyBjaFx1MUVERFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiVGhcdTAwRUFtIFx1MDExMVx1MUVDMyBwaFx1MDBFMXQga1x1MUVCRiB0aVx1MUVCRnAgc2F1IHZpZGVvIGhpXHUxRUM3biB0XHUxRUExaVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnYWRkX25leHQnLCB7IHZpZGVvVXJsOiB2VXJsLCB0aXRsZTogaXRlbS50aXRsZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy12aW9sZXQtNTAwLzE1IHRleHQtdmlvbGV0LTMwMCBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvMzAgaG92ZXI6YmctdmlvbGV0LTUwMC8yNSB0ZXh0LVsxMHB4XSBmb250LWJvbGQgYWN0aXZlOnNjYWxlLTk1IGRpc2FibGVkOm9wYWNpdHktNDAgd2hpdGVzcGFjZS1ub3dyYXAgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIEtcdTFFQkYgdGlcdTFFQkZwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAvKiBHXHUxRUUzaSBcdTAwRkQgdFx1MUVFQiBraFx1MDBGM2EgdFx1MDBFQ20ga2lcdTFFQkZtIG5oYW5oICsga2h1bmcgdGhcdTAwRjRuZyB0aW4gZ2lcdTFFRUYgY2hpXHUxRUMxdSBjYW8gY1x1MUVEMSBcdTAxMTFcdTFFQ0JuaCAqL1xuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC0xLjUgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwIGZvbnQtYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgR1x1MUVFM2kgXHUwMEZEIGNoXHUxRUU3IFx1MDExMVx1MUVDMSBoXHUxRUNEYyB0XHUxRUFEcCAmIHRoXHUwMUIwIGdpXHUwMEUzbjpcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBmbGV4LXdyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge1tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHVEODNDXHVERkE3IExvZmkgaFx1MUVDRGMgdFx1MUVBRHAnLCBxOiAnbG9maSBoaXAgaG9wIHJhZGlvIGJlYXRzIHRvIHJlbGF4IHN0dWR5IHRvJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdcdUQ4M0NcdURGMjdcdUZFMEYgVGlcdTFFQkZuZyBtXHUwMUIwYSAmIFBpYW5vJywgcTogJ3JhaW4gc291bmRzIHJlbGF4aW5nIHBpYW5vIHN0dWR5IGZvY3VzJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdcdTI2MTUgTmhcdTFFQTFjIHF1XHUwMEUxbiBjXHUwMEUwIHBoXHUwMEVBJywgcTogJ2NvZmZlZSBzaG9wIGphenogcGlhbm8gY2hpbGwgc3R1ZHknIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1RDgzRFx1RENEQSBUXHUxRUFEcCB0cnVuZyBcdTAwRjRuIHRoaScsIHE6ICdzdHVkeSBtdXNpYyBhbHBoYSB3YXZlcyBjb25jZW50cmF0aW9uJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdcdUQ4M0RcdUREMkMgVGhcdTAwRUQgbmdoaVx1MUVDN20gSFx1MDBGM2EgaFx1MUVDRGMnLCBxOiAndGhcdTAwRUQgbmdoaVx1MUVDN20gaFx1MDBGM2EgaFx1MUVDRGMgdGhcdTAwRkEgdlx1MUVDQicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXS5tYXAoKGNoaXApID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2NoaXAucX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHRpbUtpZW1Zb3VUdWJlKGUsIGNoaXAucSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0ZXh0LVsxMXB4XSB0cmFuc2l0aW9uLWFsbCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2NoaXAubGFiZWx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTMgYmctWyMwQjBFMTRdLzYwIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLXhsIHRleHQtY2VudGVyIHRleHQteHMgdGV4dC1zbGF0ZS00MDAgZ2FwLTEgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14bFwiPlx1RDgzRFx1RENGQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMFwiPlRcdTAwRUNtIGtpXHUxRUJGbSAmIFBoXHUwMEUxdCB2aWRlbyBZb3VUdWJlPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDAgbWF4LXctc21cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgTmhcdTFFQURwIHRcdTFFRUIga2hcdTAwRjNhIGJcdTAwRTBpIGhcdTFFQ0RjIGhvXHUxRUI3YyBkXHUwMEUxbiBsaVx1MDBFQW4ga1x1MUVCRnQgWW91VHViZSBcdTFFREYgdHJcdTAwRUFuIFx1MDExMVx1MUVDMyB0XHUwMEVDbSBraVx1MUVCRm0gdlx1MDBFMCBwaFx1MDBFMXQgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBjaG8gdFx1MUVBNXQgY1x1MUVBMyB0aFx1MDBFMG5oIHZpXHUwMEVBbiB0cm9uZyBwaFx1MDBGMm5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgey8qIFRBQiAyOiBRVVx1MUVBMk4gTFx1MDBERCBIXHUwMEMwTkcgXHUwMTEwXHUxRUUySSAoUVVFVUUpICovfVxuICAgICAgICAgICAgICB7bWVkaWFUYWIgPT09ICdxdWV1ZScgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1mdWxsIGZsZXggZmxleC1jb2wgZ2FwLTIuNSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBmbGV4LXdyYXAgZ2FwLTIgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENDQjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5IXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB2aWRlbyAoe3F1ZXVlTGlzdC5maWx0ZXIocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpLmxlbmd0aH0gY2hcdTFFREQpPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAge3F1ZXVlTGlzdC5zb21lKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS1xdWV1ZS1za2lwXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnc2tpcCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLWFtYmVyLTUwMC8xNSB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMCB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy1hbWJlci01MDAvMjUgZGlzYWJsZWQ6b3BhY2l0eS00MCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTIzRUQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPkJcdTFFQ0YgcXVhIC8gQlx1MDBFMGkgdGlcdTFFQkZwPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RhaVF1ZXVlfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJMXHUwMEUwbSBtXHUxRURCaSBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yIHB5LTEgcm91bmRlZC1sZyBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgdGV4dC14cyBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMDRcbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgey8qIFRoXHUwMEVBbSBsaW5rIG5oYW5oIHZcdTAwRTBvIHF1ZXVlICovfVxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICA8UXVldWVJbnB1dFxuICAgICAgICAgICAgICAgICAgICAgIG9uQWRkPXsodSwgdCkgPT4gaGFuaERvbmdRdWV1ZSgnZW5xdWV1ZScsIHsgdmlkZW9Vcmw6IHUsIHRpdGxlOiB0IH0pfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQWRkTmV4dD17KHUsIHQpID0+IGhhbmhEb25nUXVldWUoJ2FkZF9uZXh0JywgeyB2aWRlb1VybDogdSwgdGl0bGU6IHQgfSl9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgey8qIERhbmggc1x1MDBFMWNoIHZpZGVvIHRyb25nIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpICovfVxuICAgICAgICAgICAgICAgICAge3F1ZXVlTGlzdC5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNCBiZy1bIzBCMEUxNF0vNjAgYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQteGwgdGV4dC1jZW50ZXIgdGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBnYXAtMS41IG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bFwiPlx1RDgzRFx1RENDQjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDBcIj5IXHUwMEUwbmcgXHUwMTExXHUxRUUzaSBoaVx1MUVDN24gXHUwMTExYW5nIHRyXHUxRUQxbmc8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDAgbWF4LXctc21cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIENodXlcdTFFQzNuIHNhbmcgdGFiIDxzdHJvbmc+VFx1MDBFQ20gWW91VHViZTwvc3Ryb25nPiBob1x1MUVCN2MgZFx1MDBFMW4gbGlcdTAwRUFuIGtcdTFFQkZ0IHZcdTAwRTBvIFx1MDBGNCB0clx1MDBFQW4gXHUwMTExXHUxRUMzIFx1MDExMVx1MDFCMGEgdmlkZW8gdlx1MDBFMG8gZGFuaCBzXHUwMEUxY2ggcGhcdTAwRTF0IGxpXHUwMEVBbiB0XHUxRUU1Yy5cbiAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgc3BhY2UteS0xLjUgb3ZlcmZsb3cteS1hdXRvIHByLTEgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3QubWFwKChxLCBpZHgpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtxLmlkIHx8IGlkeH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSBiZy1bIzBCMEUxNF0gYm9yZGVyIHJvdW5kZWQteGwgcC0yIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcS50cmFuZ1RoYWkgPT09ICdwbGF5aW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYm9yZGVyLWVtZXJhbGQtNTAwLzQwIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSg1MiwyMTEsMTUzLDAuMTUpXSBiZy1lbWVyYWxkLTk1MC8yMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JvcmRlci13aGl0ZS81IGhvdmVyOmJvcmRlci13aGl0ZS8xNSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNiBoLTYgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LVsxMXB4XSBmb250LWJsYWNrIHNocmluay0wICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxLnRyYW5nVGhhaSA9PT0gJ3BsYXlpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWVtZXJhbGQtNTAwIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTBweF9yZ2JhKDUyLDIxMSwxNTMsMC40KV0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzEwIHRleHQtc2xhdGUtNDAwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cS50cmFuZ1RoYWkgPT09ICdwbGF5aW5nJyA/ICdcdTI1QjYnIDogaWR4ICsgMX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRodW1iICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17cS50aHVtYn0gYWx0PVwiXCIgY2xhc3NOYW1lPVwidy0xMiBoLTcgcm91bmRlZC1tZCBvYmplY3QtY292ZXIgc2hyaW5rLTAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMFwiIGxvYWRpbmc9XCJsYXp5XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTIwMCBmb250LWJvbGQgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRpdGxlIHx8IHEudmlkZW9Vcmx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cS50cmFuZ1RoYWkgPT09ICdwbGF5aW5nJyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1lbWVyYWxkLTQwMCBmb250LWJvbGRcIj5cdTI1Q0YgXHUwMTEwYW5nIHBoXHUwMEUxdDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlRoXHUwMEVBbSBiXHUxRURGaToge3EuYWRkZWRCeSB8fCAnVGhcdTAwRTBuaCB2aVx1MDBFQW4nfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiUGhcdTAwRTF0IHZpZGVvIG5cdTAwRTB5IG5nYXlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdwbGF5X25vdycsIHsgaWQ6IHEuaWQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGhvdmVyOmJnLVsjMDBGMkZFXS8zMCB0ZXh0LXhzIGZvbnQtYmxhY2sgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNiBQaFx1MDBFMXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncXVldWVkJyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlhcdTAwRjNhIGtoXHUxRUNGaSBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3JlbW92ZScsIHsgaWQ6IHEuaWQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctNyBoLTcgcm91bmRlZC1sZyBiZy1yb3NlLTUwMC8xNSB0ZXh0LXJvc2UtMzAwIGhvdmVyOmJnLXJvc2UtNTAwLzI1IHRleHQteHMgZm9udC1ibGFjayBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuICAgIDwvZGl2PlxuXG4gICk7XG59XG5cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENvbXBvbmVudDogQ2FtcHVzIEZvY3VzIFJvb20gKFN0dWR5IENhZlx1MDBFOSAmIFBvbW9kb3JvIFNlc3Npb24pIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuZXhwb3J0IGZ1bmN0aW9uIENhbXB1c0ZvY3VzUm9vbSh7XG4gIHBob25nLFxuICBwaG9uZ01pbmhLaG9hLFxuICBhdXRoLFxuICBkb25nUGhvbmdIaWVuVGFpLFxuICBzb05ndW9pLFxuICBpc0ZvY3VzTW9kZSxcbiAgc2V0SXNGb2N1c01vZGVcbn0pIHtcbiAgY29uc3QgW2ZvY3VzU3RhdGUsIHNldEZvY3VzU3RhdGVdID0gdXNlU3RhdGUoe1xuICAgIHBoYXNlOiAnZm9jdXMnLFxuICAgIHN0YXR1czogJ3BhdXNlZCcsXG4gICAgZHVyYXRpb25TZWNvbmRzOiAxNTAwLFxuICAgIHJlbWFpbmluZ1NlY29uZHM6IDE1MDAsXG4gICAgcHJlc2V0OiAnMjVfNScsXG4gICAgcmV2aXNpb246IDEsXG4gICAgY2FuQ29udHJvbDogZmFsc2UsXG4gICAgdXBkYXRlZEF0OiBudWxsLFxuICAgIHNlcnZlck5vdzogbnVsbFxuICB9KTtcbiAgY29uc3QgW2xvY2FsUmVtYWluaW5nLCBzZXRMb2NhbFJlbWFpbmluZ10gPSB1c2VTdGF0ZSgxNTAwKTtcbiAgY29uc3QgW2RhbmdHdWlMZW5oLCBzZXREYW5nR3VpTGVuaF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2ksIHNldExvaV0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gQXVkaW8gc3RhdGUgKEFtYmllbnQgcGxheWJhY2spXG4gIGxldCBjYXVIaW5oID0ge307XG4gIHRyeSB7IGNhdUhpbmggPSBwaG9uZy5jYXVIaW5oID8gSlNPTi5wYXJzZShwaG9uZy5jYXVIaW5oKSA6IHt9OyB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgKi8gfVxuICBjb25zdCBuaGFjVXJsID0gY2F1SGluaC5uaGFjVXJsID8gdXJsTWVkaWFGZShjYXVIaW5oLm5oYWNVcmwpIDogJyc7XG4gIGNvbnN0IGF1ZGlvUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBbYXVkaW9QbGF5aW5nLCBzZXRBdWRpb1BsYXlpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbYXVkaW9Wb2x1bWUsIHNldEF1ZGlvVm9sdW1lXSA9IHVzZVN0YXRlKDAuNSk7XG4gIGNvbnN0IFthdWRpb011dGVkLCBzZXRBdWRpb011dGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2hhc0ludGVyYWN0ZWRBdWRpbywgc2V0SGFzSW50ZXJhY3RlZEF1ZGlvXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICAvLyBBdXRob3JpemF0aW9uXG4gIGNvbnN0IFtjYW5Db250cm9sLCBzZXRDYW5Db250cm9sXSA9IHVzZVN0YXRlKEJvb2xlYW4oYXV0aC51c2VyPy5pc1RlYWNoZXIgfHwgcGhvbmc/LmNhbkNvbnRyb2wgfHwgcGhvbmc/LmxhQ2h1UGhvbmcpKTtcbiAgY29uc3QgaXNIb3N0ID0gY2FuQ29udHJvbDtcblxuICAvLyBTeW5jIHN0YXRlIHJlY29uY2lsaWF0aW9uIGhlbHBlclxuICBjb25zdCBhcER1bmdGb2N1c1N0YXRlID0gKHN0KSA9PiB7XG4gICAgaWYgKCFzdCkgcmV0dXJuO1xuICAgIHNldEZvY3VzU3RhdGUoc3QpO1xuICAgIGNvbnN0IHJlbSA9IE51bWJlcihzdC5yZW1haW5pbmdTZWNvbmRzID8/IDE1MDApO1xuICAgIHNldExvY2FsUmVtYWluaW5nKHJlbSk7XG4gIH07XG5cbiAgLy8gMS4gUG9sbGluZyBGb2N1cyBTdGF0ZSAoZXZlcnkgMzAwMG1zKSB3aXRoIHZpc2liaWxpdHkgcmVjb25jaWxpYXRpb24gJiBzdHJpY3QgY2xlYW51cFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuXG4gICAgY29uc3QgZmV0Y2hGb2N1cyA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWZvY3VzP3Bob25nSWQ9JHtlbmNvZGVVUklDb21wb25lbnQocGhvbmcuaWQpfWApO1xuICAgICAgICBpZiAoIXJlcy5vaykgcmV0dXJuO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBkLm9rICYmIGQuc3RhdGUpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGQuY2FuQ29udHJvbCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBzZXRDYW5Db250cm9sKGQuY2FuQ29udHJvbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGFwRHVuZ0ZvY3VzU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvKiBiXHUxRUNGIHF1YSBraGkgaFx1MUVFN3kga1x1MUVCRnQgblx1MUVEMWkgKi9cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZmV0Y2hGb2N1cygpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoZmV0Y2hGb2N1cywgMzAwMCk7XG5cbiAgICBjb25zdCBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlID0gKCkgPT4ge1xuICAgICAgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnICYmIGFjdGl2ZSkge1xuICAgICAgICBmZXRjaEZvY3VzKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlKTtcbiAgICB9O1xuICB9LCBbcGhvbmcuaWRdKTtcblxuICAvLyAyLiBMb2NhbCBDb3VudGRvd24gVGljayAoZXZlcnkgMTAwMG1zIHdoZW4gc3RhdHVzID09PSAncnVubmluZycpXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGZvY3VzU3RhdGUuc3RhdHVzICE9PSAncnVubmluZycpIHJldHVybjtcbiAgICBjb25zdCB0aWNrID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgc2V0TG9jYWxSZW1haW5pbmcociA9PiBNYXRoLm1heCgwLCByIC0gMSkpO1xuICAgIH0sIDEwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpY2spO1xuICB9LCBbZm9jdXNTdGF0ZS5zdGF0dXNdKTtcblxuICAvLyAzLiBDb21tYW5kIGRpc3BhdGNoZXIgd2l0aCBvcHRpbWlzdGljIGNvbmN1cnJlbmN5IChyZXZpc2lvbiBjaGVjayAmIGNvbmZsaWN0IGhhbmRsaW5nKVxuICBjb25zdCBndWlMZW5oID0gYXN5bmMgKGFjdGlvbiwgZXh0cmFQYXlsb2FkID0ge30pID0+IHtcbiAgICBpZiAoZGFuZ0d1aUxlbmgpIHJldHVybjtcbiAgICBzZXREYW5nR3VpTGVuaCh0cnVlKTtcbiAgICBzZXRMb2koJycpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWZvY3VzJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICBhY3Rpb24sXG4gICAgICAgICAgZXhwZWN0ZWRSZXZpc2lvbjogZm9jdXNTdGF0ZS5yZXZpc2lvbixcbiAgICAgICAgICAuLi5leHRyYVBheWxvYWRcbiAgICAgICAgfSlcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIGQuc3RhdGUpIHtcbiAgICAgICAgYXBEdW5nRm9jdXNTdGF0ZShkLnN0YXRlKTtcbiAgICAgIH0gZWxzZSBpZiAocmVzLnN0YXR1cyA9PT0gNDA5ICYmIGQuc3RhdGUpIHtcbiAgICAgICAgLy8gQ29uY3VycmVuY3kgY29uZmxpY3Q6IGFkb3B0IGxhdGVzdCBzZXJ2ZXIgc3RhdGVcbiAgICAgICAgYXBEdW5nRm9jdXNTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgc2V0TG9pKCdcdTAxMTBcdTAwRTMgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBsXHUxRUExaSBwaGlcdTAwRUFuIHRoZW8gbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRMb2koZC5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgY1x1MUVBRHAgbmhcdTFFQUR0IHRyXHUxRUExbmcgdGhcdTAwRTFpIHBoXHUwMEYybmcgaFx1MUVDRGMgdFx1MUVBRHAuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRMb2koJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXREYW5nR3VpTGVuaChmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIDQuIEFtYmllbnQgQXVkaW8gQ29udHJvbHNcbiAgY29uc3QgYmF0QW1UaGFuaCA9ICgpID0+IHtcbiAgICBzZXRIYXNJbnRlcmFjdGVkQXVkaW8odHJ1ZSk7XG4gICAgaWYgKGF1ZGlvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGF1ZGlvUmVmLmN1cnJlbnQucGxheSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBzZXRBdWRpb1BsYXlpbmcodHJ1ZSk7XG4gICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0F1dG9wbGF5IGJsb2NrZWQgb3IgYXVkaW8gbG9hZCBlcnJvcjonLCBlcnIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHRvZ2dsZUF1ZGlvUGxheSA9ICgpID0+IHtcbiAgICBpZiAoIWF1ZGlvUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICBpZiAoYXVkaW9QbGF5aW5nKSB7XG4gICAgICBhdWRpb1JlZi5jdXJyZW50LnBhdXNlKCk7XG4gICAgICBzZXRBdWRpb1BsYXlpbmcoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBiYXRBbVRoYW5oKCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHRvZ2dsZUF1ZGlvTXV0ZSA9ICgpID0+IHtcbiAgICBpZiAoIWF1ZGlvUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICBjb25zdCBuZXdNdXRlID0gIWF1ZGlvTXV0ZWQ7XG4gICAgYXVkaW9SZWYuY3VycmVudC5tdXRlZCA9IG5ld011dGU7XG4gICAgc2V0QXVkaW9NdXRlZChuZXdNdXRlKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVWb2x1bWVDaGFuZ2UgPSAoZSkgPT4ge1xuICAgIGNvbnN0IHZhbCA9IHBhcnNlRmxvYXQoZS50YXJnZXQudmFsdWUpO1xuICAgIHNldEF1ZGlvVm9sdW1lKHZhbCk7XG4gICAgaWYgKGF1ZGlvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGF1ZGlvUmVmLmN1cnJlbnQudm9sdW1lID0gdmFsO1xuICAgICAgaWYgKHZhbCA+IDAgJiYgYXVkaW9NdXRlZCkge1xuICAgICAgICBhdWRpb1JlZi5jdXJyZW50Lm11dGVkID0gZmFsc2U7XG4gICAgICAgIHNldEF1ZGlvTXV0ZWQoZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBjb25zdCBpc0JyZWFrID0gZm9jdXNTdGF0ZS5waGFzZSA9PT0gJ2JyZWFrJztcbiAgY29uc3QgaXNSdW5uaW5nID0gZm9jdXNTdGF0ZS5zdGF0dXMgPT09ICdydW5uaW5nJztcbiAgY29uc3QgZHVyYXRpb24gPSBmb2N1c1N0YXRlLmR1cmF0aW9uU2Vjb25kcyB8fCAoaXNCcmVhayA/IDMwMCA6IDE1MDApO1xuICBjb25zdCBwcm9ncmVzc1BlcmNlbnQgPSBNYXRoLm1pbigxMDAsIE1hdGgubWF4KDAsICgoZHVyYXRpb24gLSBsb2NhbFJlbWFpbmluZykgLyBkdXJhdGlvbikgKiAxMDApKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtNCBtaW4tdy0wIHctZnVsbFwiPlxuICAgICAgey8qIEhpZGRlbiBBdWRpbyBlbGVtZW50IGZvciBhbWJpZW50IHNvdW5kdHJhY2sgKi99XG4gICAgICB7bmhhY1VybCAmJiAoXG4gICAgICAgIDxhdWRpb1xuICAgICAgICAgIHJlZj17YXVkaW9SZWZ9XG4gICAgICAgICAgc3JjPXtuaGFjVXJsfVxuICAgICAgICAgIGxvb3BcbiAgICAgICAgICBwcmVsb2FkPVwibm9uZVwiXG4gICAgICAgICAgb25FbmRlZD17KCkgPT4gc2V0QXVkaW9QbGF5aW5nKGZhbHNlKX1cbiAgICAgICAgICBvbkVycm9yPXsoKSA9PiBzZXRBdWRpb1BsYXlpbmcoZmFsc2UpfVxuICAgICAgICAvPlxuICAgICAgKX1cblxuICAgICAgey8qIEhlYWRlciBiYXI6IFByZXNlbmNlLCBIb3N0IGJhZGdlLCBGb2N1cyBNb2RlIHRvZ2dsZSwgQ2xvc2UgUm9vbSAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC00IGZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMgc2hhZG93LWxnXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1mdWxsIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBib3JkZXIgJHtwaG9uZy5waGFtVmkgPT09ICd0cnVvbmcnID8gJ2JnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC00MDAgYm9yZGVyLWVtZXJhbGQtNTAwLzMwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICB7cGhvbmcucGhhbVZpID09PSAndHJ1b25nJyA/ICdcdUQ4M0NcdURGMTAgVG9cdTAwRTBuIHRyXHUwMUIwXHUxRUREbmcnIDogYFx1RDgzRFx1REQxMiBMXHUxRURCcCAke3Bob25nLmxvcFRlbiB8fCAnJ31gfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBpZD1cImZvY3VzLWhvc3QtYmFkZ2VcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgQ2hcdTFFRTcgcGhcdTAwRjJuZzogPHN0cm9uZyBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTIwMFwiPntwaG9uZy5jaHVQaG9uZ1Rlbn08L3N0cm9uZz5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gaWQ9XCJmb2N1cy1yb29tLXByZXNlbmNlXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gcHgtMi41IHB5LTAuNSByb3VuZGVkLWZ1bGwgYmctWyMwMEYyRkVdLzEwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzIwIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgIFx1RDgzRFx1REM2NSB7c29OZ3VvaSB8fCAxfSBuZ1x1MDFCMFx1MUVERGkgXHUwMTExYW5nIGNcdTAwRjluZyB0XHUxRUFEcCB0cnVuZ1xuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtbC1hdXRvXCI+XG4gICAgICAgICAge2lzRm9jdXNNb2RlICYmIChcbiAgICAgICAgICAgIDxzcGFuIGlkPVwiZm9jdXMtbW9kZS1hY3RpdmUtaW5kaWNhdG9yXCIgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtcHVycGxlLTQwMCBiZy1wdXJwbGUtNTAwLzEwIHB4LTIgcHktMC41IHJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLXB1cnBsZS01MDAvMjAgYW5pbWF0ZS1wdWxzZVwiPlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGQUYgXHUwMTEwYW5nIGJcdTFFQUR0IEZvY3VzIE1vZGVcbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICApfVxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLW1vZGUtdG9nZ2xlXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNGb2N1c01vZGUoIWlzRm9jdXNNb2RlKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMS41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHtpc0ZvY3VzTW9kZSA/ICdiZy1wdXJwbGUtNTAwLzIwIHRleHQtcHVycGxlLTMwMCBib3JkZXItcHVycGxlLTUwMC80MCBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMTY4LDg1LDI0NywwLjMpXScgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkFGPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+e2lzRm9jdXNNb2RlID8gJ1x1MjFBOSBUaG9cdTAwRTF0IEZvY3VzIE1vZGUnIDogJ0ZvY3VzIE1vZGUnfTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIHtjYW5Db250cm9sICYmIHBob25nLmNodVBob25nS2hvYSAhPT0gJ2hlLXRob25nJyAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXtkb25nUGhvbmdIaWVuVGFpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzE1IGhvdmVyOmJnLXJvc2UtNTAwLzI1IHRleHQtcm9zZS0zMDAgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICBcdTAxMTBcdTAwRjNuZyBwaFx1MDBGMm5nXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogTWFpbiBGb2N1cyBDZW50ZXJwaWVjZSBDYXJkICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9e2ByZWxhdGl2ZSBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC0zeGwgYm9yZGVyIHRyYW5zaXRpb24tYWxsIHAtNiBzbTpwLTggZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgdGV4dC1jZW50ZXIgc2hhZG93LTJ4bCAke2lzQnJlYWsgPyAnYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMUUxNzEwXSB0by1bIzEzMTEwRV0gYm9yZGVyLWFtYmVyLTUwMC8zMCcgOiAnYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMEYxRTI4XSB0by1bIzBBMTIxOV0gYm9yZGVyLVsjMDBGMkZFXS8zMCd9YH0+XG4gICAgICAgIHsvKiBHbG93IGJhY2tkcm9wIGFjY2VudCAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BhYnNvbHV0ZSAtdG9wLTI0IC1sZWZ0LTI0IHctNzIgaC03MiByb3VuZGVkLWZ1bGwgYmx1ci0zeGwgb3BhY2l0eS0yMCBwb2ludGVyLWV2ZW50cy1ub25lICR7aXNCcmVhayA/ICdiZy1hbWJlci01MDAnIDogJ2JnLVsjMDBGMkZFXSd9YH0gLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BhYnNvbHV0ZSAtYm90dG9tLTI0IC1yaWdodC0yNCB3LTcyIGgtNzIgcm91bmRlZC1mdWxsIGJsdXItM3hsIG9wYWNpdHktMjAgcG9pbnRlci1ldmVudHMtbm9uZSAke2lzQnJlYWsgPyAnYmctb3JhbmdlLTUwMCcgOiAnYmctaW5kaWdvLTUwMCd9YH0gLz5cblxuICAgICAgICB7LyogUGhhc2UgJiBTdGF0dXMgQmFkZ2VzICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMi41IG1iLTYgei0xMFwiPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBpZD1cImZvY3VzLXBoYXNlLWJhZGdlXCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtZXh0cmFib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciBib3JkZXIgc2hhZG93LXNtICR7aXNCcmVhayA/ICdiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC80MCcgOiAnYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlci1bIzAwRjJGRV0vNDAnfWB9PlxuICAgICAgICAgICAge2lzQnJlYWsgPyAnXHUyNjE1IEdpXHUxRUREIE5naFx1MUVDOSBOZ1x1MDFBMWkgKEJyZWFrKScgOiAnXHVEODNDXHVERjQ1IFBoaVx1MDBFQW4gVFx1MUVBRHAgVHJ1bmcgKEZvY3VzKSd9XG4gICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGlkPVwiZm9jdXMtc3RhdHVzLWJhZGdlXCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHtpc1J1bm5pbmcgPyAnYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTQwMCBib3JkZXItZW1lcmFsZC01MDAvMzAnIDogJ2JnLXNsYXRlLTUwMC8xNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItc2xhdGUtNTAwLzMwJ31gfT5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHctMiBoLTIgcm91bmRlZC1mdWxsICR7aXNSdW5uaW5nID8gJ2JnLWVtZXJhbGQtNDAwIGFuaW1hdGUtcHVsc2UnIDogJ2JnLXNsYXRlLTQwMCd9YH0gLz5cbiAgICAgICAgICAgIDxzcGFuPntpc1J1bm5pbmcgPyAnXHUwMTEwYW5nIFx1MDExMVx1MUVCRm0nIDogJ1RcdTFFQTFtIGRcdTFFRUJuZyd9PC9zcGFuPlxuICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXByZXNldC10b2dnbGVcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBkaXNhYmxlZD17IWNhbkNvbnRyb2wgfHwgZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBjYW5Db250cm9sICYmIGd1aUxlbmgoJ3NldF9wcmVzZXQnLCB7IHByZXNldDogZm9jdXNTdGF0ZS5wcmVzZXQgPT09ICc1MF8xMCcgPyAnMjVfNScgOiAnNTBfMTAnIH0pfVxuICAgICAgICAgICAgdGl0bGU9e2NhbkNvbnRyb2wgPyAnQlx1MUVBNW0gXHUwMTExXHUxRUMzIFx1MDExMVx1MUVENWkgY2h1IGtcdTFFRjMgUG9tb2Rvcm8nIDogJ0NodSBrXHUxRUYzIFBvbW9kb3JvIGhpXHUxRUM3biB0XHUxRUExaSd9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEgcm91bmRlZC1mdWxsIHRleHQteHMgZm9udC1tb25vIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtjYW5Db250cm9sID8gJ2hvdmVyOnNjYWxlLTEwNSBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXIgYmctd2hpdGUvMTAgdGV4dC13aGl0ZSBib3JkZXItd2hpdGUvMjAnIDogJ2N1cnNvci1kZWZhdWx0IGJnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgIFx1MjY5OVx1RkUwRiB7Zm9jdXNTdGF0ZS5wcmVzZXQgPT09ICc1MF8xMCcgPyAnNTAgLyAxMCBwaFx1MDBGQXQnIDogJzI1IC8gNSBwaFx1MDBGQXQnfVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogTWFzc2l2ZSBUaW1lciBEaXNwbGF5ICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm15LTIgc206bXktNCB6LTEwXCI+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGlkPVwiZm9jdXMtdGltZXItZGlzcGxheVwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2Bmb250LW1vbm8gdGV4dC02eGwgc206dGV4dC04eGwgZm9udC1ibGFjayB0cmFja2luZy13aWRlc3QgYmxvY2sgdHJhbnNpdGlvbi1hbGwgc2VsZWN0LW5vbmUgJHtpc0JyZWFrID8gJ3RleHQtYW1iZXItMzAwIGRyb3Atc2hhZG93LVswXzBfMzVweF9yZ2JhKDI0NSwxNTgsMTEsMC4zNSldJyA6ICd0ZXh0LVsjMDBGMkZFXSBkcm9wLXNoYWRvdy1bMF8wXzM1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldJ31gfT5cbiAgICAgICAgICAgIHtkaW5oRGFuZ0dpYXlQaHV0KGxvY2FsUmVtYWluaW5nKX1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBQcm9ncmVzcyBiYXIgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIG1heC13LW1kIGgtMiBiZy1ibGFjay80MCByb3VuZGVkLWZ1bGwgb3ZlcmZsb3ctaGlkZGVuIGJvcmRlciBib3JkZXItd2hpdGUvMTAgbXktNCB6LTEwXCI+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgaC1mdWxsIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTEwMDAgJHtpc0JyZWFrID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tb3JhbmdlLTUwMCcgOiAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzNCODJGNl0nfWB9XG4gICAgICAgICAgICBzdHlsZT17eyB3aWR0aDogYCR7cHJvZ3Jlc3NQZXJjZW50fSVgIH19XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIENvbnRyb2wgQnV0dG9ucyBmb3IgSG9zdC9UZWFjaGVyICovfVxuICAgICAgICB7Y2FuQ29udHJvbCA/IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMyBtdC00IHotMTBcIj5cbiAgICAgICAgICAgIHshaXNSdW5uaW5nID8gKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtc3RhcnRcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdzdGFydCcpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMyByb3VuZGVkLTJ4bCBiZy1ncmFkaWVudC10by1yIGZyb20tZW1lcmFsZC00MDAgdG8tdGVhbC01MDAgaG92ZXI6ZnJvbS1lbWVyYWxkLTMwMCBob3Zlcjp0by10ZWFsLTQwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC1zbSBzaGFkb3ctWzBfMF8yMHB4X3JnYmEoNTIsMjExLDE1MywwLjMpXSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjVCNjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5CXHUxRUFGdCBcdTAxMTFcdTFFQTd1PC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1wYXVzZVwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3BhdXNlJyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNiBweS0zIHJvdW5kZWQtMnhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tb3JhbmdlLTUwMCBob3Zlcjpmcm9tLWFtYmVyLTMwMCBob3Zlcjp0by1vcmFuZ2UtNDAwIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXNtIHNoYWRvdy1bMF8wXzIwcHhfcmdiYSgyNTEsMTkxLDM2LDAuMyldIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyM0Y4PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlRcdTFFQTFtIGRcdTFFRUJuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXJlc2V0XCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgncmVzZXQnKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0zIHJvdW5kZWQtMnhsIGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzE1IHRleHQtc2xhdGUtMjAwIHRleHQtc20gZm9udC1ib2xkIGJvcmRlciBib3JkZXItd2hpdGUvMTUgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMDQ8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MDExMFx1MUVCN3QgbFx1MUVBMWk8L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAge2lzQnJlYWsgPyAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1zdGFydC1mb2N1c1wiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3N0YXJ0X2ZvY3VzJyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0zIHJvdW5kZWQtMnhsIGJnLVsjMDBGMkZFXS8yMCBob3ZlcjpiZy1bIzAwRjJGRV0vMzAgdGV4dC1bIzAwRjJGRV0gdGV4dC1zbSBmb250LWJvbGQgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REZBRjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5WXHUwMEUwbyBUXHUxRUFEcCB0cnVuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtc3RhcnQtYnJlYWtcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdzdGFydF9icmVhaycpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMyByb3VuZGVkLTJ4bCBiZy1hbWJlci01MDAvMjAgaG92ZXI6YmctYW1iZXItNTAwLzMwIHRleHQtYW1iZXItMzAwIHRleHQtc20gZm9udC1ib2xkIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzQwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTI2MTU8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+TmdoXHUxRUM5IG5nXHUwMUExaTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDAgbXQtMyB6LTEwXCI+XG4gICAgICAgICAgICBcdTIzRjMgXHUwMTEwXHUxRUQzbmcgaFx1MUVEMyBQb21vZG9ybyBkbyBjaFx1MUVFNyBwaFx1MDBGMm5nIFx1MDExMWlcdTFFQzF1IHBoXHUxRUQxaSBcdTIwMTQgaFx1MDBFM3kgdFx1MUVBRHAgdHJ1bmcgaFx1MUVCRnQgbVx1MDBFQ25oIHZcdTAwRTBvIGNcdTAwRjRuZyB2aVx1MUVDN2MvaFx1MUVDRGMgdFx1MUVBRHAgbmhcdTAwRTkhXG4gICAgICAgICAgPC9wPlxuICAgICAgICApfVxuXG4gICAgICAgIHtsb2kgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXJvc2UtNDAwIG10LTQgei0xMFwiPntsb2l9PC9wPn1cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQW1iaWVudCBBdWRpbyBQbGF5ZXIgQ2FyZCAqL31cbiAgICAgIHtuaGFjVXJsID8gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNCBzbTpwLTUgZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHNoYWRvdy14bFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMuNSBtaW4tdy0wIHctZnVsbCBzbTp3LWF1dG9cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgdy0xMiBoLTEyIHJvdW5kZWQtMnhsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteGwgc2hyaW5rLTAgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7YXVkaW9QbGF5aW5nID8gJ2JnLVsjOEI1Q0Y2XS8yMCB0ZXh0LVsjOEI1Q0Y2XSBib3JkZXItWyM4QjVDRjZdLzQwIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgxMzksOTIsMjQ2LDAuMyldIGFuaW1hdGUtcHVsc2UnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAgXHVEODNDXHVERkE3XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLXctMFwiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIHRydW5jYXRlXCI+XHUwMEMybSB0aGFuaCBuXHUxRUMxbiBBbWJpZW50PC9wPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgIHthdWRpb1BsYXlpbmcgPyAnXHUwMTEwYW5nIHBoXHUwMEUxdCBraFx1MDBGNG5nIGdpYW4gaFx1MUVDRGMgdFx1MUVBRHAnIDogJ1x1MDBDMm0gdGhhbmggY1x1MUVFNWMgYlx1MUVEOSB0aGVvIHRoaVx1MUVCRnQgYlx1MUVDQid9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIgZ2FwLTMgdy1mdWxsIHNtOnctYXV0byBqdXN0aWZ5LWVuZFwiPlxuICAgICAgICAgICAgeyFoYXNJbnRlcmFjdGVkQXVkaW8gJiYgIWF1ZGlvUGxheWluZyAmJiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1zdGFydC1mb2N1cy1hdWRpb1wiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17YmF0QW1UaGFuaH1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1yIGZyb20tWyM4QjVDRjZdIHRvLVsjNjM2NkYxXSB0ZXh0LXdoaXRlIHRleHQteHMgZm9udC1ib2xkIHNoYWRvdy1sZyBob3ZlcjpvcGFjaXR5LTkwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5CXHUxRUFEdCBcdTAwRTJtIHRoYW5oIHRcdTFFQURwIHRydW5nPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJmb2N1cy1hdWRpby10b2dnbGVcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlQXVkaW9QbGF5fVxuICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7YXVkaW9QbGF5aW5nID8gJ2JnLVsjOEI1Q0Y2XS8yMCB0ZXh0LVsjOEI1Q0Y2XSBib3JkZXItWyM4QjVDRjZdLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtMzAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICAgIDxzcGFuPnthdWRpb1BsYXlpbmcgPyAnXHUyM0Y4IFRcdTFFQTFtIGRcdTFFRUJuZycgOiAnXHUyNUI2IFBoXHUwMEUxdCB0aVx1MUVCRnAnfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVBdWRpb011dGV9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiByb3VuZGVkLXhsIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXhzIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgIHthdWRpb011dGVkIHx8IGF1ZGlvVm9sdW1lID09PSAwID8gJ1x1RDgzRFx1REQwNycgOiAnXHVEODNEXHVERDA5J31cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgdHlwZT1cInJhbmdlXCJcbiAgICAgICAgICAgICAgbWluPVwiMFwiXG4gICAgICAgICAgICAgIG1heD1cIjFcIlxuICAgICAgICAgICAgICBzdGVwPVwiMC4wNVwiXG4gICAgICAgICAgICAgIHZhbHVlPXthdWRpb011dGVkID8gMCA6IGF1ZGlvVm9sdW1lfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17aGFuZGxlVm9sdW1lQ2hhbmdlfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTI0IGgtMS41IGJnLXdoaXRlLzEwIHJvdW5kZWQtbGcgYXBwZWFyYW5jZS1ub25lIGN1cnNvci1wb2ludGVyIGFjY2VudC1bIzhCNUNGNl1cIlxuICAgICAgICAgICAgICB0aXRsZT1cIlx1MDBDMm0gbFx1MDFCMFx1MUVFM25nIG5oXHUxRUExYyBuXHUxRUMxblwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICkgOiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLTJ4bCBwLTQgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMFwiPlxuICAgICAgICAgICAgXHUyNjE1IFBoXHUwMEYybmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSB0XHUwMTI5bmggbFx1MUVCN25nIChjaFx1MDFCMGEgZ1x1MUVBRm4gbGluayBcdTAwRTJtIHRoYW5oIG5cdTFFQzFuKSBcdTIwMTQgQ2h1eVx1MDBFQW4gdFx1MDBFMm0gdFx1MUVEMWkgXHUwMTExYSB2XHUwMEUwbyBiXHUwMEUwaSB2XHUxRURGLlxuICAgICAgICAgIDwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7cGhvbmcubW9UYSAmJiAoXG4gICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIHB4LTIgbGVhZGluZy1yZWxheGVkXCI+XG4gICAgICAgICAge3Bob25nLm1vVGF9XG4gICAgICAgIDwvcD5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiQUFBQSxNQUFNLEVBQUUsVUFBVSxXQUFXLE9BQU8sSUFBSTtBQUN4QyxTQUFTLGtCQUFrQixvQkFBb0IsZUFBZSxXQUFXLG1CQUFtQixxQkFBcUIsa0JBQWtCO0FBS25JLE1BQU0sYUFBYSxDQUFDLE9BQU8sTUFBTTtBQUFFLE1BQUksU0FBUyxvQkFBb0IsVUFBVyxJQUFHO0FBQUc7QUFJOUUsZ0JBQVMsV0FBVyxFQUFFLE9BQU8sVUFBVSxHQUFHO0FBQy9DLFFBQU0sQ0FBQyxHQUFHLElBQUksSUFBSSxNQUFNLFNBQVMsRUFBRTtBQUNuQyxRQUFNLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUztBQUM3QixTQUNFLG9DQUFDLFNBQUksV0FBVSwrQkFDYjtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsSUFBRztBQUFBLE1BQ0gsTUFBSztBQUFBLE1BQ0wsT0FBTztBQUFBLE1BQ1AsVUFBVSxPQUFLLEtBQUssRUFBRSxP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
