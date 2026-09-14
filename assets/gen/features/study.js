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
  const lastAppliedRevisionRef = useRef(null);
  const lastHostTrackTimeRef = useRef({ time: 0, stamp: Date.now() });
  const watchStateRef = useRef(watchState);
  watchStateRef.current = watchState;
  const dangGuiLenhRef = useRef(dangGuiLenh);
  dangGuiLenhRef.current = dangGuiLenh;
  const guiLenhRef = useRef(null);
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
      if (canControl && !dangGuiLenhRef.current && !isSeekingRef.current) {
        const pState = data.event === "onStateChange" ? typeof data.info === "number" ? data.info : data.info?.playerState : data.event === "infoDelivery" ? data.info?.playerState : void 0;
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
  }, [watchState.playing, provider, duration, localTime, canControl]);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvc3R1ZHkuanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9ID0gUmVhY3Q7XG5pbXBvcnQgeyBkaW5oRGFuZ0dpYXlQaHV0LCBnaXVOZ3V5ZW5WaVRyaUN1b24sIGlkR29vZ2xlRHJpdmUsIGlkWW91dHViZSwgbGFWaWRlb1RydWNUaWVwRmUsIG5hcFlvdVR1YmVJZnJhbWVBcGksIHVybE1lZGlhRmUgfSBmcm9tICcuLi9saWIvaGVscGVycy5qcyc7XG5cbi8vIEJcdTFFQ0YgcXVhIHRpY2sga2hpIHRhYiBcdTAxMTFhbmcgXHUxRURGIE5cdTFFQzBOIFx1MjAxNCB0clx1MDBFMW5oIGNcdTFFRDluZyBkXHUxRUQzbiByZXF1ZXN0IENsb3VkZmxhcmUgdlx1MDBGNCBcdTAwRURjaCBraGkga2hcdTAwRjRuZyBhaSB4ZW0uXG4vLyBLaFx1MDBGNG5nIGRcdTAwRjluZyBjaG8gcG9sbCB0XHUwMEVEbiBoaVx1MUVDN3UgdGhcdTFFRERpIGdpYW4gdGhcdTFFRjFjICh2ZCB2b2ljZSBzaWduYWxpbmcpIHZcdTAwRUMgYlx1MUVDRiBsXHUxRUUxIHRpY2sgY1x1MDBGMyB0aFx1MUVDMyBsXHUwMEUwbSB0cmVvXG4vLyBiXHUxRUFGdCB0YXkga1x1MUVCRnQgblx1MUVEMWkgaG9cdTFFQjdjIHRyXHUxRUM1IHRcdTAwRURuIGhpXHUxRUM3dSBcInJcdTFFRERpIHZvaWNlXCIgY1x1MUVFN2EgbmdcdTAxQjBcdTFFRERpIGtpYS5cbmNvbnN0IGtoaUhpZW5UaGkgPSAoZm4pID0+ICgpID0+IHsgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnKSBmbigpOyB9O1xuXG5cbi8vIFx1MDBENCBuaFx1MUVBRHAgbGluayB0aFx1MDBFQW0gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgXHUyMDE0IGRcdTAwRjluZyBjaHVuZyBjaG8gU3R1ZHlEb2NrIHZcdTAwRTAgQ2FtcHVzV2F0Y2hUb2dldGhlclxuZXhwb3J0IGZ1bmN0aW9uIFF1ZXVlSW5wdXQoeyBvbkFkZCwgb25BZGROZXh0IH0pIHtcbiAgY29uc3QgW3YsIHNldFZdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBvayA9IHYudHJpbSgpLmxlbmd0aCA+IDA7XG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICA8aW5wdXRcbiAgICAgICAgaWQ9XCJpbnB1dC1xdWV1ZS1hZGRcIlxuICAgICAgICB0eXBlPVwidXJsXCJcbiAgICAgICAgdmFsdWU9e3Z9XG4gICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFYoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICBvbktleURvd249e2UgPT4geyBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgb2spIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBvbkFkZCh2LnRyaW0oKSk7IHNldFYoJycpOyB9IH19XG4gICAgICAgIHBsYWNlaG9sZGVyPVwiVGhcdTAwRUFtIGxpbmsgdmlkZW8gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcdTIwMjZcIlxuICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0yLjUgcHktMS41IHRleHQtWzExcHhdIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgIC8+XG4gICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBpZD1cImJ0bi1xdWV1ZS1hZGQtbmV4dFwiIGRpc2FibGVkPXshb2t9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHsgb25BZGROZXh0KHYudHJpbSgpKTsgc2V0VignJyk7IH19XG4gICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy12aW9sZXQtNTAwLzE1IHRleHQtdmlvbGV0LTMwMCBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLXZpb2xldC01MDAvMjUgZGlzYWJsZWQ6b3BhY2l0eS0zMCB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxuICAgICAgICArUGhcdTAwRTF0IGtcdTFFQkZcbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJidG4tcXVldWUtZW5xdWV1ZVwiIGRpc2FibGVkPXshb2t9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHsgb25BZGQodi50cmltKCkpOyBzZXRWKCcnKTsgfX1cbiAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctWyMwMEYyRkVdLzI1IGRpc2FibGVkOm9wYWNpdHktMzAgd2hpdGVzcGFjZS1ub3dyYXBcIj5cbiAgICAgICAgK0N1XHUxRUQxaSBoXHUwMEUwbmdcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgU1RVRFkgRE9DSzogS0hcdTAwRDRORyBHSUFOIENcdTFFRDhORyBUXHUwMEMxQyBQSFx1MDBEMk5HIFlPVVRVQkUgKFBIQVNFIDRGKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBmdW5jdGlvbiBTdHVkeURvY2soeyBwaG9uZywgcGhvbmdNaW5oS2hvYSwgYXV0aCwgcGhvbmdDaGF0ID0gW10sIG9uU2VuZFBob25nQ2hhdCwgb25Yb2FUaW5QaG9uZyxcbiAgbXlDYXBzID0ge30sIGlzU3RhZmYgPSBmYWxzZSwgdmFpVHJvUGhvbmcgPSAnbWVtYmVyJywgdGhhbmhWaWVuID0gW10sXG4gIHBvbGljaWVzID0gbnVsbCwgZ3JhbnRzID0gW10sIHZpZGVvVGltZVJlZiwgc2Vla1ZpZGVvLCBoYW5oRG9uZ1Bob25nLFxuICBjYW5Db250cm9sOiBfY2FuQ29udHJvbCA9IGZhbHNlLCBkb25nUGhvbmdIaWVuVGFpOiBfZG9uZ1Bob25nSGllblRhaSwgaXNSb29tV2lkZSA9IGZhbHNlIH0pIHtcbiAgY29uc3QgW2RvY2tUYWIsIHNldERvY2tUYWJdID0gUmVhY3QudXNlU3RhdGUoJ2NoYXQnKTsgLy8gJ2NoYXQnIHwgJ25vdGVzJyB8ICd3aGl0ZWJvYXJkJyB8ICdzaGVldCcgfCAndm9pY2UnIHwgJ3F1YW4tdHJpJ1xuICBjb25zdCBbc2hvd0Vtb2ppLCBzZXRTaG93RW1vamldID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8vIENhcGFiaWxpdHkgcGhcdTAwRURhIGNsaWVudCBjaFx1MUVDOSBcdTAxMTFcdTFFQzMgXHUxRUE5bi9oaVx1MUVDN24gVUkgXHUyMDE0IG1cdTFFQ0RpIHF1eVx1MUVDMW4gdGhcdTFFQUR0IGRvIHNlcnZlciBxdXlcdTFFQkZ0LlxuICBjb25zdCBjb1F1eWVuID0gKGNhcCkgPT4gbXlDYXBzW2NhcF0gIT09IGZhbHNlO1xuICBjb25zdCBsYXlWaVRyaVZpZGVvID0gKCkgPT4gTWF0aC5mbG9vcih2aWRlb1RpbWVSZWY/LmN1cnJlbnQgfHwgMCkgfHwgbnVsbDtcbiAgLy8gQlx1MUVBNW0gbVx1MUVEMWMgdGhcdTFFRERpIGdpYW4gXHUyMTkyIGdcdTFFRURpIGV2ZW50IGNobyBDYW1wdXNXYXRjaFRvZ2V0aGVyIHhcdTFFRUQgbFx1MDBGRFxuICAvLyAoY1x1MDBGMyB2aWRlb19jb250cm9sIFx1MjE5MiB0dWEgY2h1bmcgY1x1MUVBMyBwaFx1MDBGMm5nOyBraFx1MDBGNG5nIFx1MjE5MiB0dWEgY1x1MUVFNWMgYlx1MUVEOSBwbGF5ZXIgY1x1MUVFN2EgbVx1MDBFQ25oKS5cbiAgY29uc3QgeWV1Q2F1VHVhID0gKHNlYykgPT4ge1xuICAgIGlmIChzZWMgPT0gbnVsbCB8fCAhKHNlYyA+PSAwKSkgcmV0dXJuO1xuICAgIGlmIChzZWVrVmlkZW8pIHsgc2Vla1ZpZGVvKE51bWJlcihzZWMpLCBteUNhcHMudmlkZW9fY29udHJvbCA9PT0gdHJ1ZSk7IHJldHVybjsgfVxuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnc3Itc2VlaycsIHsgZGV0YWlsOiB7IHBob25nSWQ6IHBob25nPy5pZCwgc2VjOiBOdW1iZXIoc2VjKSB9IH0pKTtcbiAgfTtcblxuICAvLyAxLiBSb29tIENoYXQgU3RhdGVcbiAgY29uc3QgW2NoYXRJbnB1dCwgc2V0Q2hhdElucHV0XSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2NoYXRTZW5kaW5nLCBzZXRDaGF0U2VuZGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IGNoYXRDb21wb3NpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBjaGF0RW5kUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgPT09ICdjaGF0JyAmJiBjaGF0RW5kUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHAgPSBjaGF0RW5kUmVmLmN1cnJlbnQucGFyZW50RWxlbWVudDtcbiAgICAgIGlmIChwICYmIHAuc2Nyb2xsSGVpZ2h0ID4gcC5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgcC5zY3JvbGxUbyh7IHRvcDogcC5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtwaG9uZ0NoYXQubGVuZ3RoLCBkb2NrVGFiXSk7XG5cbiAgY29uc3QgaGFuZGxlU2VuZFJvb21DaGF0ID0gKGUpID0+IHtcbiAgICBlPy5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IHR4dCA9IGNoYXRJbnB1dC50cmltKCk7XG4gICAgaWYgKCF0eHQgfHwgY2hhdFNlbmRpbmcpIHJldHVybjtcbiAgICBzZXRDaGF0SW5wdXQoJycpO1xuICAgIHNldENoYXRTZW5kaW5nKHRydWUpO1xuICAgIGlmIChvblNlbmRQaG9uZ0NoYXQpIHtcbiAgICAgIFByb21pc2UucmVzb2x2ZShvblNlbmRQaG9uZ0NoYXQodHh0KSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICBzZXRDaGF0SW5wdXQoY3VyID0+IGN1ciA/IGN1ciA6IHR4dCk7XG4gICAgICB9KS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgc2V0Q2hhdFNlbmRpbmcoZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldENoYXRTZW5kaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gMi4gU2hhcmVkIE5vdGVzIFx1MjAxNCBlbnRyeSBhcHBlbmQgKG1cdTFFRDdpIG5nXHUwMUIwXHUxRUREaSB0aFx1MDBFQW0gZ2hpIGNoXHUwMEZBIHJpXHUwMEVBbmcsIGtoXHUwMEY0bmcgZ2hpIFx1MDExMVx1MDBFOCBuaGF1KVxuICBjb25zdCBbbm90ZXNMaXN0LCBzZXROb3Rlc0xpc3RdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbbm90ZUlucHV0LCBzZXROb3RlSW5wdXRdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbbm90ZVdpdGhUaW1lLCBzZXROb3RlV2l0aFRpbWVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IFtub3Rlc0NhbldyaXRlLCBzZXROb3Rlc0NhbldyaXRlXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBbbm90ZXNOb3RpY2UsIHNldE5vdGVzTm90aWNlXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3Qgbm90ZXNWZXJzaW9uUmVmID0gUmVhY3QudXNlUmVmKDApO1xuICBjb25zdCBub3RlQ29tcG9zaW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAnbm90ZXMnKSByZXR1cm47XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG4gICAgY29uc3QgZmV0Y2hOb3RlcyA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPW5vdGVzYCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2spIHtcbiAgICAgICAgICBzZXROb3Rlc0xpc3QoQXJyYXkuaXNBcnJheShkLnBheWxvYWQ/Lm5vdGVzKSA/IGQucGF5bG9hZC5ub3RlcyA6IFtdKTtcbiAgICAgICAgICBub3Rlc1ZlcnNpb25SZWYuY3VycmVudCA9IGQudmVyc2lvbiB8fCAwO1xuICAgICAgICAgIHNldE5vdGVzQ2FuV3JpdGUoZC5jYW5Xcml0ZSAhPT0gZmFsc2UpO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGl2ZSAmJiBkLmNvZGUgPT09ICdjYXBhYmlsaXR5X29mZicpIHtcbiAgICAgICAgICBzZXROb3Rlc0NhbldyaXRlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7fVxuICAgIH07XG4gICAgZmV0Y2hOb3RlcygpO1xuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaShmZXRjaE5vdGVzKSwgMzAwMCk7XG4gICAgcmV0dXJuICgpID0+IHsgYWN0aXZlID0gZmFsc2U7IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpOyB9O1xuICB9LCBbcGhvbmcuaWQsIGRvY2tUYWJdKTtcblxuICBjb25zdCB0aGVtR2hpQ2h1ID0gYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHRleHQgPSBub3RlSW5wdXQudHJpbSgpO1xuICAgIGlmICghdGV4dCkgcmV0dXJuO1xuICAgIHNldE5vdGVzTm90aWNlKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICByZXNvdXJjZTogJ25vdGVzJyxcbiAgICAgICAgICBwYXlsb2FkOiB7IHRleHQsIHZpZGVvVGltZVNlYzogbm90ZVdpdGhUaW1lID8gbGF5VmlUcmlWaWRlbygpIDogbnVsbCB9XG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHtcbiAgICAgICAgc2V0Tm90ZUlucHV0KCcnKTtcbiAgICAgICAgc2V0Tm90ZXNMaXN0KHByZXYgPT4gWy4uLnByZXYsIHsgaWQ6IGQuaWQsIHRlbjogYXV0aC51c2VyPy50ZW4gfHwgJ0JcdTFFQTFuJywgbm9pRHVuZzogdGV4dCwgdmlkZW9UaW1lU2VjOiBub3RlV2l0aFRpbWUgPyBsYXlWaVRyaVZpZGVvKCkgOiBudWxsLCBjdWFUb2k6IDEgfV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Tm90ZXNOb3RpY2UoZC5sb2kgfHwgJ0toXHUwMEY0bmcgbFx1MDFCMHUgXHUwMTExXHUwMUIwXHUxRUUzYyBnaGkgY2hcdTAwRkEuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IHNldE5vdGVzTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaS4nKTsgfVxuICB9O1xuXG4gIGNvbnN0IHhvYUdoaUNodSA9IGFzeW5jIChpZCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgcmVzb3VyY2U6ICdub3RlcycsIGFjdGlvbjogJ3hvYV9ub3RlJywgaWQgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vaykgc2V0Tm90ZXNMaXN0KHByZXYgPT4gcHJldi5maWx0ZXIobiA9PiBuLmlkICE9PSBpZCkpO1xuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICAvLyAzLiBTaGFyZWQgV2hpdGVib2FyZCBTdGF0ZVxuICBjb25zdCBjYW52YXNSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IFt3YlN0cm9rZXMsIHNldFdiU3Ryb2tlc10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFt3YkNvbG9yLCBzZXRXYkNvbG9yXSA9IFJlYWN0LnVzZVN0YXRlKCcjMDBGMkZFJyk7XG4gIGNvbnN0IFt3YldpZHRoLCBzZXRXYldpZHRoXSA9IFJlYWN0LnVzZVN0YXRlKDMpO1xuICBjb25zdCBbd2JUb29sLCBzZXRXYlRvb2xdID0gUmVhY3QudXNlU3RhdGUoJ3BlbicpO1xuICBjb25zdCBpc0RyYXdpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBjdXJyZW50U3Ryb2tlUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB3YlZlcnNpb25SZWYgPSBSZWFjdC51c2VSZWYoMCk7XG5cbiAgY29uc3QgcmVkcmF3Q2FudmFzID0gUmVhY3QudXNlQ2FsbGJhY2soKHN0cm9rZXMpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICBpZiAoIWNhbnZhcykgcmV0dXJuO1xuICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICBzdHJva2VzLmZvckVhY2gocyA9PiB7XG4gICAgICBpZiAoIXMucG9pbnRzIHx8IHMucG9pbnRzLmxlbmd0aCA8IDIpIHJldHVybjtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHMudG9vbCA9PT0gJ2VyYXNlcicgPyAnIzBCMEUxNCcgOiAocy5jb2xvciB8fCAnIzAwRjJGRScpO1xuICAgICAgY3R4LmxpbmVXaWR0aCA9IHMud2lkdGggfHwgMztcbiAgICAgIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcbiAgICAgIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICBjdHgubW92ZVRvKHMucG9pbnRzWzBdLngsIHMucG9pbnRzWzBdLnkpO1xuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBzLnBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjdHgubGluZVRvKHMucG9pbnRzW2ldLngsIHMucG9pbnRzW2ldLnkpO1xuICAgICAgfVxuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH0pO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgW3diQ2FuV3JpdGUsIHNldFdiQ2FuV3JpdGVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG5cbiAgLy8gXHUwMEMxcCAxIG9wIHZcdTAwRTBvIG1cdTFFQTNuZyBzdHJva2VzIChyZXBsYXkgYXBwZW5kLW9ubHkpOiAnc3Ryb2tlJyB0aFx1MDBFQW0gblx1MDBFOXQsICdjbGVhcicgeG9cdTAwRTEgc1x1MUVBMWNoLlxuICBjb25zdCBhcER1bmdPcCA9IChzdHJva2VzLCBvcCkgPT4ge1xuICAgIGlmIChvcC50eXBlID09PSAnY2xlYXInKSByZXR1cm4gW107XG4gICAgaWYgKG9wLnR5cGUgPT09ICdzdHJva2UnICYmIG9wLnN0cm9rZSkgcmV0dXJuIFsuLi5zdHJva2VzLCBvcC5zdHJva2VdO1xuICAgIHJldHVybiBzdHJva2VzO1xuICB9O1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICd3aGl0ZWJvYXJkJykgcmV0dXJuO1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoV2IgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT13aGl0ZWJvYXJkJnNhdUlkPSR7d2JWZXJzaW9uUmVmLmN1cnJlbnR9YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2spIHtcbiAgICAgICAgICBjb25zdCBvcHMgPSBBcnJheS5pc0FycmF5KGQucGF5bG9hZD8ub3BzKSA/IGQucGF5bG9hZC5vcHMgOiBbXTtcbiAgICAgICAgICBpZiAob3BzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gTlx1MUVCRnUgY1x1MDBGMyBvcCAnY2xlYXInIHRyb25nIGxvXHUxRUExdCBtXHUxRURCaSBcdTIxOTIgYnVpbGQgbFx1MUVBMWkgdFx1MUVFQiBcdTAxMTFcdTFFQTd1IGNobyBjaFx1MUVBRmNcbiAgICAgICAgICAgIGlmIChvcHMuc29tZShvID0+IG8udHlwZSA9PT0gJ2NsZWFyJykpIHtcbiAgICAgICAgICAgICAgY29uc3QgZnVsbCA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPXdoaXRlYm9hcmQmc2F1SWQ9MGApO1xuICAgICAgICAgICAgICBjb25zdCBkZiA9IGF3YWl0IGZ1bGwuanNvbigpO1xuICAgICAgICAgICAgICBpZiAoYWN0aXZlICYmIGRmLm9rKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsT3BzID0gQXJyYXkuaXNBcnJheShkZi5wYXlsb2FkPy5vcHMpID8gZGYucGF5bG9hZC5vcHMgOiBbXTtcbiAgICAgICAgICAgICAgICBjb25zdCByZWJ1aWx0ID0gYWxsT3BzLnJlZHVjZShhcER1bmdPcCwgW10pO1xuICAgICAgICAgICAgICAgIHNldFdiU3Ryb2tlcyhyZWJ1aWx0KTtcbiAgICAgICAgICAgICAgICByZWRyYXdDYW52YXMocmVidWlsdCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNldFdiU3Ryb2tlcyhwcmV2ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gb3BzLnJlZHVjZShhcER1bmdPcCwgcHJldik7XG4gICAgICAgICAgICAgICAgcmVkcmF3Q2FudmFzKG5leHQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgd2JWZXJzaW9uUmVmLmN1cnJlbnQgPSBkLnZlcnNpb24gfHwgMDtcbiAgICAgICAgICBzZXRXYkNhbldyaXRlKGQuY2FuV3JpdGUgIT09IGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RpdmUgJiYgZC5jb2RlID09PSAnY2FwYWJpbGl0eV9vZmYnKSB7XG4gICAgICAgICAgc2V0V2JDYW5Xcml0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIGZldGNoV2IoKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGtoaUhpZW5UaGkoZmV0Y2hXYiksIDMwMDApO1xuICAgIHJldHVybiAoKSA9PiB7IGFjdGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludGVydmFsKTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiLCByZWRyYXdDYW52YXNdKTtcblxuICBjb25zdCBzdGFydERyYXdpbmcgPSAoZSkgPT4ge1xuICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgIGlmICghY2FudmFzKSByZXR1cm47XG4gICAgY29uc3QgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBjbGllbnRYID0gZS5jbGllbnRYID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRYKTtcbiAgICBjb25zdCBjbGllbnRZID0gZS5jbGllbnRZID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRZKTtcbiAgICBjb25zdCB4ID0gY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICBjb25zdCB5ID0gY2xpZW50WSAtIHJlY3QudG9wO1xuICAgIGlzRHJhd2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQgPSB7XG4gICAgICB0b29sOiB3YlRvb2wsXG4gICAgICBjb2xvcjogd2JDb2xvcixcbiAgICAgIHdpZHRoOiB3YlRvb2wgPT09ICdlcmFzZXInID8gMTYgOiB3YldpZHRoLFxuICAgICAgcG9pbnRzOiBbeyB4LCB5IH1dXG4gICAgfTtcbiAgfTtcblxuICBjb25zdCBkcmF3TW92ZSA9IChlKSA9PiB7XG4gICAgaWYgKCFpc0RyYXdpbmdSZWYuY3VycmVudCB8fCAhY3VycmVudFN0cm9rZVJlZi5jdXJyZW50KSByZXR1cm47XG4gICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFjYW52YXMpIHJldHVybjtcbiAgICBjb25zdCByZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGNsaWVudFggPSBlLmNsaWVudFggPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFgpO1xuICAgIGNvbnN0IGNsaWVudFkgPSBlLmNsaWVudFkgPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFkpO1xuICAgIGNvbnN0IHggPSBjbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIGNvbnN0IHkgPSBjbGllbnRZIC0gcmVjdC50b3A7XG4gICAgY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnBvaW50cy5wdXNoKHsgeCwgeSB9KTtcbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnRvb2wgPT09ICdlcmFzZXInID8gJyMwQjBFMTQnIDogY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LmNvbG9yO1xuICAgIGN0eC5saW5lV2lkdGggPSBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQud2lkdGg7XG4gICAgY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuICAgIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgY29uc3QgcHRzID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnBvaW50cztcbiAgICBpZiAocHRzLmxlbmd0aCA+PSAyKSB7XG4gICAgICBjdHgubW92ZVRvKHB0c1twdHMubGVuZ3RoIC0gMl0ueCwgcHRzW3B0cy5sZW5ndGggLSAyXS55KTtcbiAgICAgIGN0eC5saW5lVG8ocHRzW3B0cy5sZW5ndGggLSAxXS54LCBwdHNbcHRzLmxlbmd0aCAtIDFdLnkpO1xuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBzdG9wRHJhd2luZyA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIWlzRHJhd2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgaXNEcmF3aW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFN0cm9rZVJlZi5jdXJyZW50ICYmIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5wb2ludHMubGVuZ3RoID4gMSkge1xuICAgICAgY29uc3Qgc3Ryb2tlID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50O1xuICAgICAgY29uc3QgbmV4dFN0cm9rZXMgPSBbLi4ud2JTdHJva2VzLCBzdHJva2VdO1xuICAgICAgc2V0V2JTdHJva2VzKG5leHRTdHJva2VzKTtcbiAgICAgIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICByZXNvdXJjZTogJ3doaXRlYm9hcmQnLFxuICAgICAgICAgICAgcGF5bG9hZDogeyB0eXBlOiAnc3Ryb2tlJywgc3Ryb2tlIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChkLm9rICYmIGQuaWQpIHdiVmVyc2lvblJlZi5jdXJyZW50ID0gTWF0aC5tYXgod2JWZXJzaW9uUmVmLmN1cnJlbnQsIGQuaWQpO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH1cbiAgfTtcblxuICBjb25zdCBjbGVhcldoaXRlYm9hcmQgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFjb25maXJtKCdCXHUxRUExbiBjXHUwMEYzIGNoXHUxRUFGYyBtdVx1MUVEMW4geFx1MDBGM2Egc1x1MUVBMWNoIGJcdTFFQTNuZyB2XHUxRUJEPyAoY2hcdTFFQzkgcXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcpJykpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICByZXNvdXJjZTogJ3doaXRlYm9hcmQnLFxuICAgICAgICAgIHBheWxvYWQ6IHsgdHlwZTogJ2NsZWFyJyB9XG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHtcbiAgICAgICAgc2V0V2JTdHJva2VzKFtdKTtcbiAgICAgICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgICAgIGlmIChjYW52YXMpIHtcbiAgICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gNC4gU2hhcmVkIFNoZWV0IFN0YXRlICg4IGNvbHMgeCAxMCByb3dzKSBcdTIwMTQgdXBzZXJ0IHRcdTFFRUJuZyBcdTAwRjQsIGtoXHUwMEY0bmcgd2hvbGUtZG9jIGNvbmZsaWN0XG4gIGNvbnN0IENPTFMgPSBbJ0EnLCAnQicsICdDJywgJ0QnLCAnRScsICdGJywgJ0cnLCAnSCddO1xuICBjb25zdCBST1dTID0gWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwXTtcbiAgY29uc3QgW3NoZWV0Q2VsbHMsIHNldFNoZWV0Q2VsbHNdID0gUmVhY3QudXNlU3RhdGUoe30pO1xuICBjb25zdCBbc2hlZXRDYW5Xcml0ZSwgc2V0U2hlZXRDYW5Xcml0ZV0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3Qgc2hlZXRTYXZlVGltZXJzUmVmID0gUmVhY3QudXNlUmVmKHt9KTtcbiAgY29uc3Qgc2hlZXRGb2N1c2VkQ2VsbFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgc2hlZXRQb2xsUmVmID0gUmVhY3QudXNlUmVmKDApO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICdzaGVldCcpIHJldHVybjtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaFNoZWV0ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mcmVzb3VyY2U9c2hlZXRgKTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChhY3RpdmUgJiYgZC5vaykge1xuICAgICAgICAgIGNvbnN0IGluY29taW5nID0gZC5wYXlsb2FkPy5jZWxscyB8fCB7fTtcbiAgICAgICAgICAvLyBLaFx1MDBGNG5nIGdoaSBcdTAxMTFcdTAwRTggXHUwMEY0IFx1MDExMWFuZyBnXHUwMEY1IGRcdTFFREZcbiAgICAgICAgICBzZXRTaGVldENlbGxzKHByZXYgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWVyZ2VkID0geyAuLi5pbmNvbWluZyB9O1xuICAgICAgICAgICAgY29uc3QgZGFuZ0dvID0gc2hlZXRGb2N1c2VkQ2VsbFJlZi5jdXJyZW50O1xuICAgICAgICAgICAgaWYgKGRhbmdHbyAmJiBwcmV2W2RhbmdHb10gIT09IHVuZGVmaW5lZCkgbWVyZ2VkW2RhbmdHb10gPSBwcmV2W2RhbmdHb107XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHNldFNoZWV0Q2FuV3JpdGUoZC5jYW5Xcml0ZSAhPT0gZmFsc2UpO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGl2ZSAmJiBkLmNvZGUgPT09ICdjYXBhYmlsaXR5X29mZicpIHtcbiAgICAgICAgICBzZXRTaGVldENhbldyaXRlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7fVxuICAgIH07XG4gICAgZmV0Y2hTaGVldCgpO1xuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaShmZXRjaFNoZWV0KSwgMzAwMCk7XG4gICAgcmV0dXJuICgpID0+IHsgYWN0aXZlID0gZmFsc2U7IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpOyB9O1xuICB9LCBbcGhvbmcuaWQsIGRvY2tUYWJdKTtcblxuICBjb25zdCBoYW5kbGVDZWxsQ2hhbmdlID0gKGNlbGxLZXksIHZhbCkgPT4ge1xuICAgIHNldFNoZWV0Q2VsbHMocHJldiA9PiAoeyAuLi5wcmV2LCBbY2VsbEtleV06IHZhbCB9KSk7XG4gICAgY29uc3QgdGltZXJzID0gc2hlZXRTYXZlVGltZXJzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKHRpbWVyc1tjZWxsS2V5XSkgY2xlYXJUaW1lb3V0KHRpbWVyc1tjZWxsS2V5XSk7XG4gICAgdGltZXJzW2NlbGxLZXldID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICByZXNvdXJjZTogJ3NoZWV0JyxcbiAgICAgICAgICAgIHBheWxvYWQ6IHsgY2VsbDogY2VsbEtleSwgdmFsdWU6IHZhbCB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfSwgODAwKTtcbiAgfTtcblxuICAvLyA1LiAxLXRvLTEgV2ViUlRDIFZvaWNlIENoYXQgXHUyMDE0IHBhaXItYm91bmQgKHRcdTFFRDFpIFx1MDExMWEgMSBjXHUxRUI3cC9waFx1MDBGMm5nLCBzaWduYWxpbmcgcmlcdTAwRUFuZyB0XHUwMUIwKVxuICBjb25zdCBbdm9pY2VKb2luZWQsIHNldFZvaWNlSm9pbmVkXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW21pY011dGVkLCBzZXRNaWNNdXRlZF0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTsgLy8gRGVmYXVsdCBPRkZcbiAgY29uc3QgW3ZvaWNlU3RhdGUsIHNldFZvaWNlU3RhdGVdID0gUmVhY3QudXNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICBjb25zdCBbdm9pY2VOb3RpY2UsIHNldFZvaWNlTm90aWNlXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3ZvaWNlUGFpciwgc2V0Vm9pY2VQYWlyXSA9IFJlYWN0LnVzZVN0YXRlKG51bGwpOyAgICAgICAvLyB7YWN0aXZlLCBhVGVuLCBiVGVuLCB5b3VJbiwgc2xvdH1cbiAgY29uc3QgW3ZvaWNlUmVxdWVzdGVkLCBzZXRWb2ljZVJlcXVlc3RlZF0gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFt5ZXVDYXVWb2ljZSwgc2V0WWV1Q2F1Vm9pY2VdID0gUmVhY3QudXNlU3RhdGUoW10pOyAgICAgLy8gc3RhZmY6IGRhbmggc1x1MDBFMWNoIHhpbiBxdXlcdTFFQzFuXG4gIGNvbnN0IHBjUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBsb2NhbFN0cmVhbVJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgcmVtb3RlQXVkaW9SZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGxhc3RTaWduYWxJZFJlZiA9IFJlYWN0LnVzZVJlZigwKTtcbiAgY29uc3Qgdm9pY2VQb2xsVGltZXJSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHZvaWNlU2xvdFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgdm9pY2VKb2luZWRSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBwZW5kaW5nQ2FuZGlkYXRlc1JlZiA9IFJlYWN0LnVzZVJlZihbXSk7XG4gIHZvaWNlSm9pbmVkUmVmLmN1cnJlbnQgPSB2b2ljZUpvaW5lZDtcblxuICBjb25zdCBkdW5nS2V0Tm9pVm9pY2UgPSAoKSA9PiB7XG4gICAgaWYgKGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0VHJhY2tzKCkuZm9yRWFjaCh0ID0+IHQuc3RvcCgpKTtcbiAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAocGNSZWYuY3VycmVudCkge1xuICAgICAgcGNSZWYuY3VycmVudC5jbG9zZSgpO1xuICAgICAgcGNSZWYuY3VycmVudCA9IG51bGw7XG4gICAgfVxuICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQgPSBbXTtcbiAgICBzZXRNaWNNdXRlZCh0cnVlKTtcbiAgfTtcblxuICAvLyBQb2xsIHRyXHUxRUExbmcgdGhcdTAwRTFpIGNcdTFFQjdwICsgdFx1MDBFRG4gaGlcdTFFQzd1IGNcdTFFRTdhIHBhcnRuZXIgKHNlcnZlciBjaFx1MUVDOSB0clx1MUVBMyBzaWduYWwgY1x1MUVFN2EgbmdcdTAxQjBcdTFFRERpIHRyb25nIGNcdTFFQjdwKS5cbiAgY29uc3QgcG9sbFZvaWNlID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZhY3Rpb249dm9pY2VfcG9sbCZzYXVJZD0ke2xhc3RTaWduYWxJZFJlZi5jdXJyZW50fWApO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoIWQub2spIHJldHVybjtcbiAgICAgIGlmIChkLnBhaXIpIHNldFZvaWNlUGFpcihkLnBhaXIpO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZC55ZXVDYXVWb2ljZSkpIHNldFlldUNhdVZvaWNlKGQueWV1Q2F1Vm9pY2UpO1xuICAgICAgY29uc3QgcGMgPSBwY1JlZi5jdXJyZW50O1xuICAgICAgaWYgKCF2b2ljZUpvaW5lZFJlZi5jdXJyZW50IHx8ICFwYykgcmV0dXJuO1xuICAgICAgZm9yIChjb25zdCBzaWcgb2YgZC5zaWduYWxzIHx8IFtdKSB7XG4gICAgICAgIGxhc3RTaWduYWxJZFJlZi5jdXJyZW50ID0gTWF0aC5tYXgobGFzdFNpZ25hbElkUmVmLmN1cnJlbnQsIHNpZy5pZCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnb2ZmZXInKSB7XG4gICAgICAgICAgICAvLyBPZmZlciBtXHUxRURCaSBob1x1MUVCN2MgcmUtb2ZmZXIgKFx1MDExMVx1MUVEMWkgcGhcdTAxQjBcdTAxQTFuZyBiXHUxRUFEdCBtaWMgbXVcdTFFRDluKSBcdTAxMTFcdTFFQzF1IHNldCBsXHUxRUExaSByZW1vdGUgKyB0clx1MUVBMyBhbnN3ZXIuXG4gICAgICAgICAgICBhd2FpdCBwYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKHNpZy5wYXlsb2FkKSk7XG4gICAgICAgICAgICAvLyBYXHUxRUEzIGNcdTAwRTFjIGNhbmRpZGF0ZSB0XHUxRURCaSBzXHUxRURCbSB0clx1MDFCMFx1MUVEQmMga2hpIGNcdTAwRjMgcmVtb3RlRGVzY3JpcHRpb24uXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGMgb2YgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICBhd2FpdCBwYy5hZGRJY2VDYW5kaWRhdGUobmV3IFJUQ0ljZUNhbmRpZGF0ZShjKSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCA9IFtdO1xuICAgICAgICAgICAgY29uc3QgYW5zID0gYXdhaXQgcGMuY3JlYXRlQW5zd2VyKCk7XG4gICAgICAgICAgICBhd2FpdCBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKGFucyk7XG4gICAgICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ2Fuc3dlcicsIHBheWxvYWQ6IGFucyB9KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ2Fuc3dlcicpIHtcbiAgICAgICAgICAgIGlmIChwYy5zaWduYWxpbmdTdGF0ZSA9PT0gJ2hhdmUtbG9jYWwtb2ZmZXInKSB7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLnNldFJlbW90ZURlc2NyaXB0aW9uKG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24oc2lnLnBheWxvYWQpKTtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBjIG9mIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwYy5hZGRJY2VDYW5kaWRhdGUobmV3IFJUQ0ljZUNhbmRpZGF0ZShjKSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnY2FuZGlkYXRlJykge1xuICAgICAgICAgICAgaWYgKHBjLnJlbW90ZURlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLmFkZEljZUNhbmRpZGF0ZShuZXcgUlRDSWNlQ2FuZGlkYXRlKHNpZy5wYXlsb2FkKSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudC5wdXNoKHNpZy5wYXlsb2FkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnbGVhdmUnKSB7XG4gICAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnTmdcdTAxQjBcdTFFRERpIGtpYSBcdTAxMTFcdTAwRTMgbmdcdTFFQUZ0IHZvaWNlLicpO1xuICAgICAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgICAgICAgICBkdW5nS2V0Tm9pVm9pY2UoKTtcbiAgICAgICAgICAgIHNldFZvaWNlSm9pbmVkKGZhbHNlKTtcbiAgICAgICAgICAgIHZvaWNlU2xvdFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggeyAvKiBiXHUxRUNGIHF1YSBzaWduYWwgbFx1MUVEN2kgKi8gfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICAvLyBQb2xsIGNoXHUxRUExeSBraGkgdGFiIHZvaWNlIG1cdTFFREYgKHhlbSB0clx1MUVBMW5nIHRoXHUwMEUxaSBjXHUxRUI3cCkgaG9cdTFFQjdjIFx1MDExMWFuZyB0cm9uZyBjXHUxRUI3cC5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiAhPT0gJ3ZvaWNlJyAmJiAhdm9pY2VKb2luZWQpIHJldHVybjtcbiAgICBwb2xsVm9pY2UoKTtcbiAgICB2b2ljZVBvbGxUaW1lclJlZi5jdXJyZW50ID0gc2V0SW50ZXJ2YWwocG9sbFZvaWNlLCAxNTAwKTtcbiAgICByZXR1cm4gKCkgPT4geyBpZiAodm9pY2VQb2xsVGltZXJSZWYuY3VycmVudCkgY2xlYXJJbnRlcnZhbCh2b2ljZVBvbGxUaW1lclJlZi5jdXJyZW50KTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiLCB2b2ljZUpvaW5lZF0pO1xuXG4gIGNvbnN0IGpvaW5Wb2ljZSA9IGFzeW5jICgpID0+IHtcbiAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwYW5nIHhpbiBjaFx1MUVENyB0cm9uZyBjXHUxRUI3cCB2b2ljZS4uLicpO1xuICAgIHNldFZvaWNlU3RhdGUoJ2Nvbm5lY3RpbmcnKTtcbiAgICB0cnkge1xuICAgICAgLy8gMS4gR2lcdTAwRTBuaCBzbG90IHRyXHUwMEVBbiBzZXJ2ZXIgdHJcdTAxQjBcdTFFREJjIChzZXJ2ZXItYXV0aG9yaXRhdGl2ZTogdFx1MUVEMWkgXHUwMTExYSAxIGNcdTFFQjdwIDEtMS9waFx1MDBGMm5nKVxuICAgICAgY29uc3Qgam9pblJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9qb2luJyB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBqb2luRGF0YSA9IGF3YWl0IGpvaW5SZXMuanNvbigpO1xuICAgICAgaWYgKCFqb2luRGF0YS5vaykge1xuICAgICAgICBpZiAoam9pbkRhdGEuY29kZSA9PT0gJ2dyYW50X3JlcXVpcmVkJykge1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdCXHUxRUExbiBjXHUxRUE3biBcdTAxMTFcdTAxQjBcdTFFRTNjIGNcdTFFQTVwIHF1eVx1MUVDMW4gdm9pY2UgXHUyMDE0IGhcdTAwRTN5IGJcdTFFQTVtIFwiWGluIHF1eVx1MUVDMW4gdm9pY2VcIi4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZShqb2luRGF0YS5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgdGhhbSBnaWEgdm9pY2UuJyk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZvaWNlU2xvdFJlZi5jdXJyZW50ID0gam9pbkRhdGEuc2xvdDtcbiAgICAgIHNldFZvaWNlSm9pbmVkKHRydWUpO1xuXG4gICAgICAvLyAyLiBYaW4gbWljIFRSXHUwMUFGXHUxRURBQyBraGkgdFx1MUVBMW8gb2ZmZXIgXHUyMDE0IHRyYWNrIHBoXHUxRUEzaSBjXHUwMEYzIHNcdTFFQjVuIHRyb25nIFNEUCBuZWdvdGlhdGlvbixcbiAgICAgIC8vICAgIGFkZFRyYWNrIHNhdSBraGkgXHUwMTExXHUwMEUzIGJcdTFFQUZ0IHRheSBtXHUwMEUwIGtoXHUwMEY0bmcgcmVuZWdvdGlhdGUgXHUyMTkyIG5nXHUwMUIwXHUxRUREaSBraWEga2hcdTAwRjRuZyBuZ2hlIFx1MDExMVx1MDFCMFx1MUVFM2MuXG4gICAgICAvLyAgICBNaWMga2hcdTFFREZpIFx1MDExMVx1MUVBN3UgbXV0ZWQgKGVuYWJsZWQ9ZmFsc2UpIFx1MjAxNCB1c2VyIHRcdTFFRjEgYlx1MUVBRHQgYlx1MUVCMW5nIG5cdTAwRkF0IE1pYy5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgYXVkaW86IHRydWUsIHZpZGVvOiBmYWxzZSB9KTtcbiAgICAgICAgc3RyZWFtLmdldEF1ZGlvVHJhY2tzKCkuZm9yRWFjaCh0ID0+IHsgdC5lbmFibGVkID0gZmFsc2U7IH0pO1xuICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50ID0gc3RyZWFtO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdLaFx1MDBGNG5nIHhpbiBcdTAxMTFcdTAxQjBcdTFFRTNjIG1pY3JvIFx1MjAxNCBiXHUxRUExbiBjaFx1MUVDOSBuZ2hlIFx1MDExMVx1MDFCMFx1MUVFM2MsIGtoXHUwMEY0bmcgblx1MDBGM2kgXHUwMTExXHUwMUIwXHUxRUUzYy4nKTtcbiAgICAgIH1cblxuICAgICAgLy8gMy4gVFx1MUVBMW8gcGVlciBjb25uZWN0aW9uXG4gICAgICBjb25zdCBwYyA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbih7XG4gICAgICAgIGljZVNlcnZlcnM6IFt7IHVybHM6ICdzdHVuOnN0dW4ubC5nb29nbGUuY29tOjE5MzAyJyB9XVxuICAgICAgfSk7XG4gICAgICBwY1JlZi5jdXJyZW50ID0gcGM7XG4gICAgICBpZiAobG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldFRyYWNrcygpLmZvckVhY2godCA9PiBwYy5hZGRUcmFjayh0LCBsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSk7XG4gICAgICB9XG5cbiAgICAgIHBjLm9uaWNlY2FuZGlkYXRlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5jYW5kaWRhdGUpIHtcbiAgICAgICAgICBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICAgICAgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJyxcbiAgICAgICAgICAgICAgc2lnbmFsVHlwZTogJ2NhbmRpZGF0ZScsXG4gICAgICAgICAgICAgIHBheWxvYWQ6IGV2ZW50LmNhbmRpZGF0ZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHBjLm9udHJhY2sgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKHJlbW90ZUF1ZGlvUmVmLmN1cnJlbnQgJiYgZXZlbnQuc3RyZWFtc1swXSkge1xuICAgICAgICAgIHJlbW90ZUF1ZGlvUmVmLmN1cnJlbnQuc3JjT2JqZWN0ID0gZXZlbnQuc3RyZWFtc1swXTtcbiAgICAgICAgICByZW1vdGVBdWRpb1JlZi5jdXJyZW50LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHBjLm9uY29ubmVjdGlvbnN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBzID0gcGMuY29ubmVjdGlvblN0YXRlO1xuICAgICAgICBpZiAocyA9PT0gJ2Nvbm5lY3RlZCcpIHtcbiAgICAgICAgICBzZXRWb2ljZVN0YXRlKCdjb25uZWN0ZWQnKTtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnXHUyNzEzIFx1MDExMGFuZyBrXHUxRUJGdCBuXHUxRUQxaSB0aG9cdTFFQTFpIDEtMSB0clx1MUVGMWMgdGlcdTFFQkZwLicpO1xuICAgICAgICB9IGVsc2UgaWYgKHMgPT09ICdmYWlsZWQnIHx8IHMgPT09ICdkaXNjb25uZWN0ZWQnKSB7XG4gICAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIHRob1x1MUVBMWkgKG1cdTFFQTFuZyBjaFx1MUVCN24gUDJQIG5cdTFFQkZ1IGtoXHUwMEY0bmcgY1x1MDBGMyBUVVJOKS4nKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgLy8gNC4gU2xvdCAnYicgKG5nXHUwMUIwXHUxRUREaSB2XHUwMEUwbyBzYXUpIHRcdTFFQTFvIG9mZmVyOyBzbG90ICdhJyBjaFx1MUVERCBvZmZlciB0XHUxRUVCIHBvbGwuXG4gICAgICBpZiAoam9pbkRhdGEuc2xvdCA9PT0gJ2InKSB7XG4gICAgICAgIGNvbnN0IG9mZmVyID0gYXdhaXQgcGMuY3JlYXRlT2ZmZXIoKTtcbiAgICAgICAgYXdhaXQgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihvZmZlcik7XG4gICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnb2ZmZXInLCBwYXlsb2FkOiBvZmZlciB9KVxuICAgICAgICB9KTtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMFx1MDBFMyB2XHUwMEUwbyBjXHUxRUI3cCBcdTIwMTQgXHUwMTExYW5nIGJcdTFFQUZ0IHRheSB2XHUxRURCaSAnICsgKHZvaWNlUGFpcj8uYVRlbiB8fCAnbmdcdTAxQjBcdTFFRERpIGtpYScpICsgJ1x1MjAyNicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0JcdTFFQTFuIGxcdTAwRTAgbmdcdTAxQjBcdTFFRERpIFx1MDExMVx1MUVBN3UgdGlcdTAwRUFuIFx1MjAxNCBjaFx1MUVERCB0aFx1MDBFQW0gMSBuZ1x1MDFCMFx1MUVERGkgdlx1MDBFMG8gdm9pY2VcdTIwMjYnKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHNldFZvaWNlTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSB2b2ljZTogJyArIGVyci5tZXNzYWdlKTtcbiAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB4aW5RdXllblZvaWNlID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2VfcmVxdWVzdCcgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vayAmJiBkLmdyYW50ZWQpIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0JcdTFFQTFuIFx1MDExMVx1MDBFMyBcdTAxMTFcdTAxQjBcdTFFRTNjIHBoXHUwMEU5cCB2b2ljZSBcdTIwMTQgYlx1MUVBNW0gVGhhbSBnaWEuJyk7XG4gICAgICB9IGVsc2UgaWYgKGQub2spIHtcbiAgICAgICAgc2V0Vm9pY2VSZXF1ZXN0ZWQodHJ1ZSk7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBcdTAwRTMgZ1x1MUVFRGkgeVx1MDBFQXUgY1x1MUVBN3UgXHUyMDE0IGNoXHUxRUREIHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nIGR1eVx1MUVDN3QuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRWb2ljZU5vdGljZShkLmxvaSB8fCAnS2hcdTAwRjRuZyBnXHUxRUVEaSBcdTAxMTFcdTAxQjBcdTFFRTNjIHlcdTAwRUF1IGNcdTFFQTd1LicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggeyBzZXRWb2ljZU5vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkuJyk7IH1cbiAgfTtcblxuICBjb25zdCBuZ2F0Vm9pY2VDYXAgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFjb25maXJtKCdOZ1x1MUVBRnQgY1x1MUVCN3Agdm9pY2UgXHUwMTExYW5nIGhvXHUxRUExdCBcdTAxMTFcdTFFRDluZz8nKSkgcmV0dXJuO1xuICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9lbmQnIH0pXG4gICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgIHBvbGxWb2ljZSgpO1xuICB9O1xuXG4gIGNvbnN0IHRvZ2dsZU1pYyA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAobWljTXV0ZWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICghbG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgICAgIC8vIE1pYyBiXHUxRUNCIHRcdTFFRUIgY2hcdTFFRDFpIGxcdTAwRkFjIGpvaW4gXHUyMTkyIHhpbiBsXHUxRUExaTsgYWRkVHJhY2sgbXVcdTFFRDluIGNcdTFFQTduIHJlbmVnb3RpYXRlIChvZmZlciBtXHUxRURCaSkuXG4gICAgICAgICAgY29uc3Qgc3RyZWFtID0gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoeyBhdWRpbzogdHJ1ZSwgdmlkZW86IGZhbHNlIH0pO1xuICAgICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQgPSBzdHJlYW07XG4gICAgICAgICAgY29uc3QgcGMgPSBwY1JlZi5jdXJyZW50O1xuICAgICAgICAgIGlmIChwYykge1xuICAgICAgICAgICAgc3RyZWFtLmdldFRyYWNrcygpLmZvckVhY2godHJhY2sgPT4gcGMuYWRkVHJhY2sodHJhY2ssIHN0cmVhbSkpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3Qgb2ZmZXIgPSBhd2FpdCBwYy5jcmVhdGVPZmZlcigpO1xuICAgICAgICAgICAgICBhd2FpdCBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcbiAgICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdvZmZlcicsIHBheWxvYWQ6IG9mZmVyIH0pXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIHJlbmVnb3RpYXRpb24gdGhcdTFFQTV0IGJcdTFFQTFpIFx1MjAxNCBuZ2hlIHZcdTFFQUJuIFx1MDExMVx1MDFCMFx1MUVFM2MgKi8gfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldEF1ZGlvVHJhY2tzKCkuZm9yRWFjaCh0ID0+IHsgdC5lbmFibGVkID0gdHJ1ZTsgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0TWljTXV0ZWQoZmFsc2UpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGFsZXJ0KCdLaFx1MDBGNG5nIHRoXHUxRUMzIG1cdTFFREYgbWljcm86ICcgKyBlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0QXVkaW9UcmFja3MoKS5mb3JFYWNoKHQgPT4geyB0LmVuYWJsZWQgPSBmYWxzZTsgfSk7XG4gICAgICB9XG4gICAgICBzZXRNaWNNdXRlZCh0cnVlKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgbGVhdmVWb2ljZSA9ICgpID0+IHtcbiAgICBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ2xlYXZlJywgcGF5bG9hZDoge30gfSlcbiAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgZHVuZ0tldE5vaVZvaWNlKCk7XG4gICAgc2V0Vm9pY2VKb2luZWQoZmFsc2UpO1xuICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgIHZvaWNlU2xvdFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwXHUwMEUzIG5nXHUxRUFGdCB2b2ljZS4nKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgaWQ9XCJzdHVkeS1kb2NrLWNvbnRhaW5lclwiIHN0eWxlPXt7IG92ZXJmbG93QW5jaG9yOiAnbm9uZScgfX0gY2xhc3NOYW1lPXtgYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMTYxYjI2XSB0by1bIzBmMTQxZF0gYm9yZGVyIGJvcmRlci13aGl0ZS9bMC4wOF0gcm91bmRlZC0yeGwgcC00IGZsZXggZmxleC1jb2wgc2hhZG93LXhsICR7aXNSb29tV2lkZSA/ICdtaW4taC1bY2FsYygxMDB2aC0xNjBweCldIGgtZnVsbCBmbGV4LTEnIDogJ2gtWzYyMHB4XSBsZzpoLVs2ODBweF0nfWB9PlxuICAgICAgey8qIFN0dWR5IERvY2sgVGFiIE5hdmlnYXRpb24gXHUyMDE0IEdcdTFFQ0RuIGdcdTAwRTBuZywgdGhcdTFFQTltIG1cdTFFRjksIG5cdTAwRkF0IG5cdTFFRDVpIGJcdTFFQUR0ICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgcGItMyBib3JkZXItYiBib3JkZXItd2hpdGUvMTAgZmxleC13cmFwIHNocmluay0wXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZmxleC13cmFwXCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktY2hhdFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ2NoYXQnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdjaGF0J1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0FDPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Q2hhdCBwaFx1MDBGMm5nPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LW5vdGVzXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignbm90ZXMnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdub3RlcydcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENERDwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkdoaSBjaFx1MDBGQTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS13aGl0ZWJvYXJkXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignd2hpdGVib2FyZCcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3doaXRlYm9hcmQnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGQTg8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5CXHUxRUEzbmcgdlx1MUVCRDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1zaGVldFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3NoZWV0Jyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnc2hlZXQnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQ0E8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5CXHUxRUEzbmcgdFx1MDBFRG5oPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LXZvaWNlXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYigndm9pY2UnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICd2b2ljZSdcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLWFtYmVyLTUwMCB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgyNTEsMTkxLDM2LDAuMzUpXSBib3JkZXIgYm9yZGVyLWFtYmVyLTQwMC81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGOTlcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5Wb2ljZSAoMS0xKTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1tZW1iZXJzXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignbWVtYmVycycpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ21lbWJlcnMnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLWVtZXJhbGQtNDAwIHRvLXRlYWwtNTAwIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDUyLDIxMSwxNTMsMC4zNSldIGJvcmRlciBib3JkZXItZW1lcmFsZC00MDAvNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQzY1PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+VGhcdTAwRTBuaCB2aVx1MDBFQW57dGhhbmhWaWVuLmxlbmd0aCA+IDAgPyBgICgke3RoYW5oVmllbi5sZW5ndGh9KWAgOiAnJ308L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICB7aXNTdGFmZiAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LXF1YW4tdHJpXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3F1YW4tdHJpJyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3F1YW4tdHJpJ1xuICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLXZpb2xldC01MDAgdG8tcHVycGxlLTUwMCB0ZXh0LXdoaXRlIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgxMzksOTIsMjQ2LDAuMzUpXSBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvNTAnXG4gICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNjk5XHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5RdXlcdTFFQzFuPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIERvY2sgQ29udGVudCBCb2R5ICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBwdC0zIG1pbi1oLTAgaC1mdWxsIG92ZXJmbG93LWhpZGRlblwiPlxuICAgICAgICB7LyogVEFCIDE6IENIQVQgUEhcdTAwRDJORyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdjaGF0JyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBtaW4taC0wIGgtZnVsbFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHNwYWNlLXktMyBwci0xIG1pbi1oLTAgdGV4dC14c1wiPlxuICAgICAgICAgICAgICB7cGhvbmdDaGF0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCB0ZXh0LWNlbnRlciBweS04XCI+Q2hcdTAxQjBhIGNcdTAwRjMgdGluIG5oXHUxRUFGbiBcdTIwMTQgaFx1MDBFM3kgZ1x1MUVFRGkgY1x1MDBFMnUgaFx1MUVDRmkgaG9cdTFFQjdjIHRyYW8gXHUwMTExXHUxRUQ1aSB2XHUxRUMxIGJcdTAwRTBpIGdpXHUxRUEzbmchPC9wPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIHBob25nQ2hhdC5tYXAoKG0sIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgbXlOYW1lID0gU3RyaW5nKGF1dGg/LnVzZXI/LmhvVGVuIHx8IGF1dGg/LnVzZXI/Lm5hbWUgfHwgYXV0aD8udXNlcj8udGVuIHx8ICcnKS50cmltKCk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUNoaW5oTWluaCA9IEJvb2xlYW4oXG4gICAgICAgICAgICAgICAgICAgIG0uY3VhVG9pIHx8XG4gICAgICAgICAgICAgICAgICAgIChtLmtob2EgJiYgcGhvbmdNaW5oS2hvYSAmJiBtLmtob2EgPT09IHBob25nTWluaEtob2EpIHx8XG4gICAgICAgICAgICAgICAgICAgIChteU5hbWUgJiYgbS50ZW5OZ3VvaUd1aSAmJiBtLnRlbk5ndW9pR3VpLnRyaW0oKS50b0xvd2VyQ2FzZSgpID09PSBteU5hbWUudG9Mb3dlckNhc2UoKSlcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBjb25zdCB0aW1lU3RyID0gbS50YW9MdWMgPyBuZXcgRGF0ZShtLnRhb0x1Yy5yZXBsYWNlKCcgJywgJ1QnKSArIChtLnRhb0x1Yy5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JyB9KSA6ICcnO1xuXG4gICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAga2V5PXttLmlkIHx8IGlkeH1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGZsZXgtY29sIGdyb3VwIHctZnVsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFDaGluaE1pbmggPyAnaXRlbXMtZW5kJyA6ICdpdGVtcy1zdGFydCdcbiAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgey8qIEhlYWRlciB0aFx1MDBGNG5nIHRpbiBuZ1x1MDFCMFx1MUVERGkgZ1x1MUVFRGkgKi99XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IG1iLTEgdGV4dC1bMTFweF0gJHtsYUNoaW5oTWluaCA/ICdmbGV4LXJvdy1yZXZlcnNlJyA6ICcnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgZm9udC1leHRyYWJvbGQgJHtsYUNoaW5oTWluaCA/ICd0ZXh0LVsjMDBGMkZFXScgOiAndGV4dC1zbGF0ZS0yMDAnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7bS50ZW5OZ3VvaUd1aX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUNoaW5oTWluaCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIHNoYWRvdy1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJcdTFFQTFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICB7bS52YWlUcm8gPT09ICdnaWFvX3ZpZW4nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdWQ05cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IG0ubG9wVGVuID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzIwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge20ubG9wVGVufVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7dGltZVN0cn1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiWG9cdTAwRTEgdGluIG5oXHUxRUFGbiBuXHUwMEUweSAocXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jaGF0P3Bob25nSWQ9JHtwaG9uZy5pZH0maWQ9JHttLmlkfWAsIHsgbWV0aG9kOiAnREVMRVRFJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkLm9rICYmIG9uWG9hVGluUGhvbmcpIG9uWG9hVGluUGhvbmcobS5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgKi8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHB4LTEgdGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTUwMCBob3Zlcjp0ZXh0LXJvc2UtNDAwIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIHsvKiBCdWJibGUgdGluIG5oXHUxRUFGbiAqL31cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BtYXgtdy1bODUlXSBzbTptYXgtdy1bNzglXSBweC0zLjUgcHktMiB0ZXh0LXhzIGxlYWRpbmctcmVsYXhlZCBicmVhay13b3JkcyBzaGFkb3ctbWQgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGFDaGluaE1pbmhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdyb3VuZGVkLTJ4bCByb3VuZGVkLXRyLXhzIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwYjRkOF0vMjUgdmlhLVsjMDA3N2I2XS8zMCB0by1bIzAwRjJGRV0vMjAgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgdGV4dC13aGl0ZSBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMTIpXSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdyb3VuZGVkLTJ4bCByb3VuZGVkLXRsLXhzIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOmJvcmRlci13aGl0ZS8yMCB0ZXh0LXNsYXRlLTIwMCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIndoaXRlc3BhY2UtcHJlLXdyYXBcIj57bS5ub2lEdW5nfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIHttLnZpZGVvVGltZVNlYyAhPSBudWxsICYmIG0udmlkZW9UaW1lU2VjID49IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geWV1Q2F1VHVhKG0udmlkZW9UaW1lU2VjKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJtdC0xLjUgaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIGdhcC0xIHB4LTIgcHktMC41IHJvdW5kZWQtbGcgdGV4dC1bMTBweF0gZm9udC1ibGFjayBiZy1jeWFuLTQwMC8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCBob3ZlcjpiZy1bIzAwRjJGRV0vMzAgdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTI1QjY8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+e2RpbmhEYW5nR2lheVBodXQobS52aWRlb1RpbWVTZWMpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPGRpdiByZWY9e2NoYXRFbmRSZWZ9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVNlbmRSb29tQ2hhdH0gY2xhc3NOYW1lPVwicHQtMiBib3JkZXItdCBib3JkZXItd2hpdGUvOCBmbGV4IGZsZXgtY29sIGdhcC0yIG10LWF1dG8gc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgey8qIEVtb2ppIHBhbmVsICovfVxuICAgICAgICAgICAgICB7c2hvd0Vtb2ppICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGdhcC0xIHAtMiBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bFwiPlxuICAgICAgICAgICAgICAgICAge1snXHVEODNEXHVERTBBJywnXHVEODNEXHVERTAyJywnXHVEODNFXHVERDcwJywnXHVEODNEXHVERTBFJywnXHVEODNFXHVERDE0JywnXHVEODNEXHVERTA1JywnXHVEODNEXHVERTJEJywnXHVEODNEXHVERDI1JywnXHUyNzY0XHVGRTBGJywnXHVEODNEXHVEQzREJywnXHVEODNEXHVERTRGJywnXHVEODNDXHVERjg5JywnXHUyNzA1JywnXHVEODNEXHVEQ0FGJywnXHVEODNEXHVEQzRCJywnXHVEODNEXHVEQ0RBJywnXHUyNzBGXHVGRTBGJywnXHVEODNDXHVERkFGJywnXHVEODNDXHVERjFGJywnXHVEODNEXHVEQ0ExJywnXHUyNkExJywnXHVEODNDXHVERkM2JywnXHVEODNFXHVERDFEJywnXHVEODNEXHVEQ0FBJywnXHVEODNFXHVERDI5J10ubWFwKGVtID0+IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBrZXk9e2VtfSB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldENoYXRJbnB1dCh2ID0+IHYgKyBlbSk7IHNldFNob3dFbW9qaShmYWxzZSk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1sZyBob3ZlcjpzY2FsZS0xMjUgdHJhbnNpdGlvbi10cmFuc2Zvcm0gYWN0aXZlOnNjYWxlLTk1IHB4LTFcIj57ZW19PC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgZmxleC0xXCI+XG4gICAgICAgICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1waG9uZy1jaGF0XCJcbiAgICAgICAgICAgICAgICAgICAgcm93cz17MX1cbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e2NvUXV5ZW4oJ2NoYXQnKSA/ICdOaFx1MUVBRm4gdGluIHBoXHUwMEYybmcgaFx1MUVDRGMuLi4nIDogJ0NoYXQgXHUwMTExYW5nIGJcdTFFQ0Iga2hcdTAwRjNhJ31cbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2NoYXRJbnB1dH1cbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjb1F1eWVuKCdjaGF0Jyl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldENoYXRJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25TdGFydD17KCkgPT4geyBjaGF0Q29tcG9zaW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPXsoKSA9PiB7IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCA9IGZhbHNlOyB9fVxuICAgICAgICAgICAgICAgICAgICBvbktleURvd249e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiAhZS5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUubmF0aXZlRXZlbnQ/LmlzQ29tcG9zaW5nIHx8IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlU2VuZFJvb21DaGF0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICBtYXhMZW5ndGg9ezUwMH1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHB4LTQgcHktMi41IHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTAgZm9jdXM6c2hhZG93LVswXzBfMTJweF9yZ2JhKDAsMjQyLDI1NCwwLjEyKV0gcmVzaXplLW5vbmUgbWluLWgtWzM4cHhdIG1heC1oLTI0IGRpc2FibGVkOm9wYWNpdHktNDAgdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7LyogRW1vamkgYnV0dG9uICovfVxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjb1F1eWVuKCdjaGF0Jyl9XG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93RW1vamkodiA9PiAhdil9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTkgaC05IHJvdW5kZWQtMnhsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtYmFzZSB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTMwIHNocmluay0wIGFjdGl2ZTpzY2FsZS05MCAke1xuICAgICAgICAgICAgICAgICAgICBzaG93RW1vamkgPyAnYmctWyMwMEYyRkVdLzIwIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIHRleHQtWyMwMEYyRkVdJyA6ICdiZy13aGl0ZS81IGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSBob3ZlcjpiZy13aGl0ZS8xMCdcbiAgICAgICAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDaFx1MUVDRG4gZW1vamlcIj5cbiAgICAgICAgICAgICAgICAgIFx1RDgzRFx1REUwQVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIHsvKiBTZW5kIGJ1dHRvbiAqL31cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXNlbmQtcGhvbmctY2hhdFwiXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNoYXRJbnB1dC50cmltKCkgfHwgY2hhdFNlbmRpbmcgfHwgIWNvUXV5ZW4oJ2NoYXQnKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctOSBoLTkgcm91bmRlZC0yeGwgYmctZ3JhZGllbnQtdG8tYnIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzQjgyRjZdIHRleHQtYmxhY2sgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTMwIHNocmluay0wIGhvdmVyOmJyaWdodG5lc3MtMTEwIGFjdGl2ZTpzY2FsZS05MCBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMCwyNDIsMjU0LDAuMyldXCI+XG4gICAgICAgICAgICAgICAgICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiIGNsYXNzTmFtZT1cInctNCBoLTRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0zLjQ3OCAyLjQwNWEuNzUuNzUgMCAwMC0uOTI2Ljk0bDIuNDMyIDcuOTA1SDEzLjVhLjc1Ljc1IDAgMDEwIDEuNUg0Ljk4NGwtMi40MzIgNy45MDVhLjc1Ljc1IDAgMDAuOTI2Ljk0IDYwLjUxOSA2MC41MTkgMCAwMDE4LjQ0NS04Ljk4Ni43NS43NSAwIDAwMC0xLjIxOEE2MC41MTcgNjAuNTE3IDAgMDAzLjQ3OCAyLjQwNXpcIiAvPlxuICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgMjogR0hJIENIXHUwMERBIENcdTFFRDhORyBUXHUwMEMxQyBcdTIwMTQgZW50cnkgYXBwZW5kLCBjXHUwMEYzIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ25vdGVzJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMiBtaW4taC0wIGgtZnVsbFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgPHNwYW4+R2hpIGNoXHUwMEZBIGNodW5nIGNcdTFFRTdhIHBoXHUwMEYybmcgXHUyMDE0IG1cdTFFRDdpIG5nXHUwMUIwXHUxRUREaSB0aFx1MDBFQW0gbVx1MUVEOXQgZFx1MDBGMm5nLCBjXHUwMEYzIHRoXHUxRUMzIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvPC9zcGFuPlxuICAgICAgICAgICAgICB7bm90ZXNOb3RpY2UgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1yb3NlLTMwMCBmb250LWJvbGRcIj57bm90ZXNOb3RpY2V9PC9zcGFuPn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHNwYWNlLXktMiBwci0xIG1pbi1oLTAgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTIuNVwiPlxuICAgICAgICAgICAgICB7bm90ZXNMaXN0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCB0ZXh0LWNlbnRlciBweS04XCI+Q2hcdTAxQjBhIGNcdTAwRjMgZ2hpIGNoXHUwMEZBIFx1MjAxNCB0aFx1MDBFQW0gZFx1MDBGMm5nIFx1MDExMVx1MUVBN3UgdGlcdTAwRUFuIGNobyBjXHUxRUEzIHBoXHUwMEYybmcuPC9wPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIG5vdGVzTGlzdC5tYXAoKG4pID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtuLmlkfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLXN0YXJ0IGdhcC0yIGdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtNDAwXCI+e24udGVufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtuLnZpZGVvVGltZVNlYyAhPSBudWxsICYmIG4udmlkZW9UaW1lU2VjID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB5ZXVDYXVUdWEobi52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIGhvdmVyOmJnLXZpb2xldC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYge2RpbmhEYW5nR2lheVBodXQobi52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNjAwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7bi50YW9MdWMgPyBuZXcgRGF0ZShuLnRhb0x1Yy5yZXBsYWNlKCcgJywgJ1QnKSArICdaJykudG9Mb2NhbGVUaW1lU3RyaW5nKFtdLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSkgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMjAwIGxlYWRpbmctcmVsYXhlZCBicmVhay13b3Jkc1wiPntuLm5vaUR1bmd9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgeyhuLmN1YVRvaSB8fCBpc1N0YWZmKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB4b2FHaGlDaHUobi5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlhvXHUwMEUxIGdoaSBjaFx1MDBGQVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcGFjaXR5LTAgZ3JvdXAtaG92ZXI6b3BhY2l0eS0xMDAgdGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1yb3NlLTQwMCB0ZXh0LVsxMHB4XSBweC0xIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHtub3Rlc0NhbldyaXRlID8gKFxuICAgICAgICAgICAgICA8Zm9ybVxuICAgICAgICAgICAgICAgIG9uU3VibWl0PXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIGlmICghZS5uYXRpdmVFdmVudD8uaXNDb21wb3NpbmcgJiYgIW5vdGVDb21wb3NpbmdSZWYuY3VycmVudCkgdGhlbUdoaUNodSgpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICBpZD1cInN0dWR5LW5vdGUtaW5wdXRcIlxuICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e25vdGVJbnB1dH1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldE5vdGVJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ9eygpID0+IHsgbm90ZUNvbXBvc2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ9eygpID0+IHsgbm90ZUNvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7IH19XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlRoXHUwMEVBbSBnaGkgY2hcdTAwRkEgY2hvIHBoXHUwMEYybmcuLi5cIlxuICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXsxMDAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTAgcm91bmRlZC14bCBweC0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmVcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXROb3RlV2l0aFRpbWUodiA9PiAhdil9XG4gICAgICAgICAgICAgICAgICB0aXRsZT17bm90ZVdpdGhUaW1lID8gJ1x1MDExMGFuZyBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbyB2XHUwMEUwbyBnaGkgY2hcdTAwRkEnIDogJ0toXHUwMEY0bmcgZ1x1MUVBRm4gbVx1MUVEMWMgdmlkZW8nfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtub3RlV2l0aFRpbWUgPyAnYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyLXZpb2xldC01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS01MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAgICAgIFx1MjNGMVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tYWRkLW5vdGVcIlxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFub3RlSW5wdXQudHJpbSgpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIHJvdW5kZWQteGwgYmctWyMwMEYyRkVdIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJsYWNrIGRpc2FibGVkOm9wYWNpdHktMzBcIj5cbiAgICAgICAgICAgICAgICAgIFRoXHUwMEVBbVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LWFtYmVyLTMwMC84MCB0ZXh0LWNlbnRlciBweS0xXCI+XHVEODNEXHVERDEyIEdoaSBjaFx1MDBGQSBcdTAxMTFhbmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSBjaFx1MUVDOSB4ZW0gXHUyMDE0IHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nIFx1MDExMVx1MDBFMyBraFx1MDBGM2EuPC9wPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDM6IEJcdTFFQTJORyBWXHUxRUJDIENcdTFFRDhORyBUXHUwMEMxQyAoU0hBUkVEIFdISVRFQk9BUkQpICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ3doaXRlYm9hcmQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0yIG1pbi1oLTAgaC1mdWxsXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBmbGV4LXdyYXAgdGV4dC14cyBwYi0xXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLXBlblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRXYlRvb2woJ3BlbicpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JUb29sID09PSAncGVuJyA/ICdiZy1bIzAwRjJGRV0gdGV4dC1ibGFjaycgOiAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAnfWB9PlxuICAgICAgICAgICAgICAgICAgXHUyNzBGXHVGRTBGIEJcdTAwRkF0IHZcdTFFQkRcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLWVyYXNlclwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRXYlRvb2woJ2VyYXNlcicpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JUb29sID09PSAnZXJhc2VyJyA/ICdiZy1yb3NlLTUwMCB0ZXh0LXdoaXRlJyA6ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCd9YH0+XG4gICAgICAgICAgICAgICAgICBcdUQ4M0VcdURERjkgVFx1MUVBOXlcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIG1sLTJcIj5cbiAgICAgICAgICAgICAgICAgIHtbJyMwMEYyRkUnLCAnI0ZGQjgwMCcsICcjRjQzRjVFJywgJyNGRkZGRkYnXS5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e2N9XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0V2JDb2xvcihjKTsgc2V0V2JUb29sKCdwZW4nKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTUgaC01IHJvdW5kZWQtZnVsbCBib3JkZXIgZGlzYWJsZWQ6b3BhY2l0eS00MCAke3diQ29sb3IgPT09IGMgJiYgd2JUb29sID09PSAncGVuJyA/ICdzY2FsZS0xMTAgYm9yZGVyLXdoaXRlIHJpbmctMiByaW5nLWN5YW4tNDAwJyA6ICdib3JkZXItdHJhbnNwYXJlbnQnfWB9XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogYyB9fVxuICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtjfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICB7aXNTdGFmZiAmJiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi13Yi1jbGVhclwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtjbGVhcldoaXRlYm9hcmR9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXdoaXRlLzUgaG92ZXI6Ymctcm9zZS01MDAvMjAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQteHMgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICBYXHUwMEYzYSBiXHUxRUEzbmdcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBvdmVyZmxvdy1oaWRkZW4gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcmVsYXRpdmUgdG91Y2gtbm9uZSBtaW4taC1bMjIwcHhdXCI+XG4gICAgICAgICAgICAgIHshd2JDYW5Xcml0ZSAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIHotMTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctYmxhY2svNDAgdGV4dC1bMTFweF0gdGV4dC1hbWJlci0zMDAvOTAgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTIgQlx1MUVBM25nIHZcdTFFQkQgXHUwMTExYW5nIFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgY2hcdTFFQzkgeGVtXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDxjYW52YXNcbiAgICAgICAgICAgICAgICBpZD1cInN0dWR5LXdoaXRlYm9hcmQtY2FudmFzXCJcbiAgICAgICAgICAgICAgICByZWY9e2NhbnZhc1JlZn1cbiAgICAgICAgICAgICAgICB3aWR0aD17NjQwfVxuICAgICAgICAgICAgICAgIGhlaWdodD17MzIwfVxuICAgICAgICAgICAgICAgIG9uTW91c2VEb3duPXt3YkNhbldyaXRlID8gc3RhcnREcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uTW91c2VNb3ZlPXt3YkNhbldyaXRlID8gZHJhd01vdmUgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZVVwPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaFN0YXJ0PXt3YkNhbldyaXRlID8gc3RhcnREcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uVG91Y2hNb3ZlPXt3YkNhbldyaXRlID8gZHJhd01vdmUgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaEVuZD17d2JDYW5Xcml0ZSA/IHN0b3BEcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBoLWZ1bGwgJHt3YkNhbldyaXRlID8gJ2N1cnNvci1jcm9zc2hhaXInIDogJ2N1cnNvci1ub3QtYWxsb3dlZCd9YH1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNDogQlx1MUVBMk5HIFRcdTAwQ0ROSCBDXHUxRUQ4TkcgVFx1MDBDMUMgKFNIQVJFRCBTSEVFVCA4eDEwKSAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdzaGVldCcgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTIgb3ZlcmZsb3cteC1hdXRvIG1pbi1oLTAgaC1mdWxsXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgIEJcdTFFQTNuZyB0XHUwMEVEbmggcGhcdTAwRTJuIHRcdTAwRURjaCBzXHUxRUQxIGxpXHUxRUM3dSAvIG1cdTFFRDFjIHRoXHUxRUREaSBnaWFuIGhcdTFFQ0RjIHRcdTFFQURwIChMXHUwMUIwdSB0XHUxRUYxIFx1MDExMVx1MUVEOW5nKVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy1hdXRvIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBiZy1bIzBCMEUxNF0gbWluLWgtMFwiPlxuICAgICAgICAgICAgICA8dGFibGUgaWQ9XCJzdHVkeS1zaGVldC10YWJsZVwiIGNsYXNzTmFtZT1cInctZnVsbCB0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIGJvcmRlci1jb2xsYXBzZVwiPlxuICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMCBmb250LW1vbm9cIj5cbiAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInctOCBwLTEgdGV4dC1jZW50ZXIgYm9yZGVyLXIgYm9yZGVyLXdoaXRlLzEwIHRleHQtWzEwcHhdXCI+IzwvdGg+XG4gICAgICAgICAgICAgICAgICAgIHtDT0xTLm1hcChjID0+IChcbiAgICAgICAgICAgICAgICAgICAgICA8dGgga2V5PXtjfSBjbGFzc05hbWU9XCJwLTEuNSB0ZXh0LWNlbnRlciBib3JkZXItciBib3JkZXItd2hpdGUvMTAgbWluLXctWzcwcHhdIHRleHQtWzExcHhdIGZvbnQtYm9sZCB0ZXh0LWN5YW4tMzAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7Y31cbiAgICAgICAgICAgICAgICAgICAgICA8L3RoPlxuICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICB7Uk9XUy5tYXAociA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDx0ciBrZXk9e3J9IGNsYXNzTmFtZT1cImJvcmRlci1iIGJvcmRlci13aGl0ZS81IGhvdmVyOmJnLXdoaXRlL1swLjAyXVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTEgdGV4dC1jZW50ZXIgYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTUwMCBmb250LW1vbm8gdGV4dC1bMTBweF0gYm9yZGVyLXIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cn1cbiAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgIHtDT0xTLm1hcChjID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNlbGxLZXkgPSBgJHtjfSR7cn1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGtleT17Y2VsbEtleX0gY2xhc3NOYW1lPVwicC0wIGJvcmRlci1yIGJvcmRlci13aGl0ZS81XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLWNlbGw9e2NlbGxLZXl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17c2hlZXRDZWxsc1tjZWxsS2V5XSB8fCAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlYWRPbmx5PXshc2hlZXRDYW5Xcml0ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRm9jdXM9eygpID0+IHsgc2hlZXRGb2N1c2VkQ2VsbFJlZi5jdXJyZW50ID0gY2VsbEtleTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17KCkgPT4geyBzaGVldEZvY3VzZWRDZWxsUmVmLmN1cnJlbnQgPSBudWxsOyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2hlZXRDYW5Xcml0ZSAmJiBoYW5kbGVDZWxsQ2hhbmdlKGNlbGxLZXksIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBiZy10cmFuc3BhcmVudCBweC0yIHB5LTEgdGV4dC14cyB0ZXh0LXdoaXRlIGZvY3VzOmJnLVsjMTUxQTIzXSBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctWyMwMEYyRkVdICR7IXNoZWV0Q2FuV3JpdGUgPyAnb3BhY2l0eS02MCBjdXJzb3Itbm90LWFsbG93ZWQnIDogJyd9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDU6IDEtVE8tMSBXRUJSVEMgVk9JQ0UgXHUyMDE0IHBhaXItYm91bmQsIGNcdTAwRjMgeGluIHF1eVx1MUVDMW4gKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAndm9pY2UnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTYgdGV4dC1jZW50ZXIgZ2FwLTRcIj5cbiAgICAgICAgICAgIDxhdWRpbyByZWY9e3JlbW90ZUF1ZGlvUmVmfSBhdXRvUGxheSAvPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTE2IGgtMTYgcm91bmRlZC0zeGwgYmctYW1iZXItNDAwLzE1IGJvcmRlciBib3JkZXItYW1iZXItNDAwLzMwIHRleHQtYW1iZXItNDAwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtM3hsIHNoYWRvdy1bMF8wXzIwcHhfcmdiYSgyNDUsMTU4LDExLDAuMildXCI+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REY5OVx1RkUwRlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtd2hpdGVcIj5UaG9cdTFFQTFpIFRyXHUxRUYxYyBUaVx1MUVCRnAgMS0xIFRyb25nIFBoXHUwMEYybmc8L2g0PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIG1heC13LXhzIG10LTFcIj5cbiAgICAgICAgICAgICAgICBNXHUxRUQ3aSBwaFx1MDBGMm5nIHRcdTFFRDFpIFx1MDExMWEgbVx1MUVEOXQgY1x1MUVCN3Agdm9pY2UgMS0xLiBNaWNybyBtXHUxRUI3YyBcdTAxMTFcdTFFQ0JuaCB0XHUxRUFGdCBraGkgY2hcdTAxQjBhIGJcdTFFQUR0LlxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFRyXHUxRUExbmcgdGhcdTAwRTFpIGNcdTFFQjdwIGhpXHUxRUM3biB0XHUxRUExaSAqL31cbiAgICAgICAgICAgIHt2b2ljZVBhaXI/LmFjdGl2ZSAhPT0gdW5kZWZpbmVkICYmIChcbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1tb25vIHRleHQtc2xhdGUtNDAwIGJnLXdoaXRlLzUgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgICAge3ZvaWNlUGFpcj8uYVRlbiA/IGAke3ZvaWNlUGFpci5hVGVufSR7dm9pY2VQYWlyLmJUZW4gPyAnIFx1MjE5NCAnICsgdm9pY2VQYWlyLmJUZW4gOiAnIFx1MDBCNyBcdTAxMTFhbmcgY2hcdTFFREQgbmdcdTAxQjBcdTFFRERpIHRoXHUxRUU5IDInfWAgOiAnQ2hcdTAxQjBhIGNcdTAwRjMgY1x1MUVCN3Agdm9pY2Ugblx1MDBFMG8nfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zIGZsZXgtd3JhcCBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICAgICAgICB7IXZvaWNlSm9pbmVkID8gKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICB7Y29RdXllbigndm9pY2UnKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLWpvaW5cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2pvaW5Wb2ljZX1cbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dm9pY2VQYWlyPy5hY3RpdmUgJiYgIXZvaWNlUGFpcj8ueW91SW59XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNSBweS0yLjUgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLW9yYW5nZS01MDAgdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQteHMgc2hhZG93LWxnIGhvdmVyOm9wYWNpdHktOTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktNDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7dm9pY2VQYWlyPy5hY3RpdmUgPyAnXHUwMTEwYW5nIGNcdTAwRjMgY1x1MUVCN3Agdm9pY2Uga2hcdTAwRTFjJyA6IHZvaWNlUGFpcj8uYVRlbiA/ICdWXHUwMEUwbyBjXHUxRUI3cCB2XHUxRURCaSAnICsgdm9pY2VQYWlyLmFUZW4gOiAnVGhhbSBnaWEgdm9pY2UnfVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1yZXF1ZXN0XCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt4aW5RdXllblZvaWNlfVxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt2b2ljZVJlcXVlc3RlZH1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIuNSByb3VuZGVkLXhsIGJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMjAwIGJvcmRlciBib3JkZXItd2hpdGUvMTUgZm9udC1ib2xkIHRleHQteHMgaG92ZXI6Ymctd2hpdGUvMTUgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHt2b2ljZVJlcXVlc3RlZCA/ICdcdTIzRjMgXHUwMTEwYW5nIGNoXHUxRUREIGR1eVx1MUVDN3RcdTIwMjYnIDogJ1x1RDgzRFx1REU0QiBYaW4gcXV5XHUxRUMxbiB2b2ljZSd9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2UtdG9nZ2xlLW1pY1wiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RvZ2dsZU1pY31cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtNCBweS0yLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7bWljTXV0ZWQgPyAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6Ymctd2hpdGUvMTUnIDogJ2JnLWVtZXJhbGQtNTAwIHRleHQtYmxhY2snfWB9PlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj57bWljTXV0ZWQgPyAnXHVEODNEXHVERDA3IEJcdTFFQUR0IE1pYycgOiAnXHVEODNDXHVERjk5XHVGRTBGIE1pYyBcdTAxMTBhbmcgQlx1MUVBRHQnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2UtbGVhdmVcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtsZWF2ZVZvaWNlfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzIwIHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8zMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgICBSXHUxRUREaSB2b2ljZVxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIHtpc1N0YWZmICYmIHZvaWNlUGFpcj8uYVRlbiAmJiAhdm9pY2VQYWlyPy55b3VJbiAmJiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1lbmRcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17bmdhdFZvaWNlQ2FwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xMCB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMjUgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMjAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgIE5nXHUxRUFGdCBjXHUxRUI3cCB2b2ljZVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBTdGFmZjogZGFuaCBzXHUwMEUxY2ggeGluIHF1eVx1MUVDMW4gdm9pY2UgKi99XG4gICAgICAgICAgICB7aXNTdGFmZiAmJiB5ZXVDYXVWb2ljZS5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgbWF4LXctc20gYmctd2hpdGUvNSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0yLjUgdGV4dC1sZWZ0XCI+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LWFtYmVyLTMwMCBtYi0xLjVcIj5cdTAxMTBhbmcgeGluIHF1eVx1MUVDMW4gdm9pY2U8L3A+XG4gICAgICAgICAgICAgICAge3lldUNhdVZvaWNlLm1hcChyID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtyLmtob2F9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgcHktMVwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTIwMCBmb250LXNlbWlib2xkIGZsZXgtMSB0cnVuY2F0ZVwiPntyLnRlbiB8fCAnVGhcdTAwRTBuaCB2aVx1MDBFQW4nfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHsgY29uc3QgZCA9IGF3YWl0IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogci5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogdHJ1ZSB9KTsgaWYgKGQ/Lm9rKSBzZXRZZXVDYXVWb2ljZShwcmV2ID0+IHByZXYuZmlsdGVyKHggPT4geC5raG9hICE9PSByLmtob2EpKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLWVtZXJhbGQtNTAwLzIwIHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctZW1lcmFsZC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICBEdXlcdTFFQzd0XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4geyBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiByLmtob2EsIGNhcGFiaWxpdHk6ICd2b2ljZScsIG9uOiBmYWxzZSB9KTsgaWYgKGQ/Lm9rKSBzZXRZZXVDYXVWb2ljZShwcmV2ID0+IHByZXYuZmlsdGVyKHggPT4geC5raG9hICE9PSByLmtob2EpKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8yNSB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICBUXHUxRUVCIGNoXHUxRUQxaVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIHt2b2ljZU5vdGljZSAmJiAoXG4gICAgICAgICAgICAgIDxwIGlkPVwidm9pY2Utc3RhdHVzLW5vdGljZVwiIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS0zMDAgZm9udC1tb25vIGJnLWJsYWNrLzQwIHB4LTMgcHktMS41IHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS81XCI+XG4gICAgICAgICAgICAgICAge3ZvaWNlTm90aWNlfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgbWF4LXcteHNcIj5cbiAgICAgICAgICAgICAgKiBHaGkgY2hcdTAwRkE6IEtcdTFFQkZ0IG5cdTFFRDFpIHRob1x1MUVBMWkgUDJQIHlcdTAwRUF1IGNcdTFFQTd1IG1cdTFFQTFuZyBraFx1MDBGNG5nIGNoXHUxRUI3biBVRFAuIFJlc3RyaWN0aXZlIE5BVCBjXHUwMEYzIHRoXHUxRUMzIGNcdTFFQTduIHJlbGF5IFRVUk4uXG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRBQiA3OiBUSFx1MDBDME5IIFZJXHUwMENBTiBUUk9ORyBQSFx1MDBEMk5HICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ21lbWJlcnMnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0zIG1pbi1oLTAgaC1mdWxsXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwYi0yIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQzY1PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlRoXHUwMEUwbmggdmlcdTAwRUFuIHRyb25nIHBoXHUwMEYybmcgKHt0aGFuaFZpZW4ubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgICBcdTAxMTBhbmcgdHJcdTFFRjFjIHR1eVx1MUVCRm5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTIgb3ZlcmZsb3cteS1hdXRvIHByLTEgbWluLWgtMFwiPlxuICAgICAgICAgICAgICB7dGhhbmhWaWVuLm1hcCgodHYsIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhSG9zdCA9IHR2LmxhQ2h1UGhvbmcgPT09IDEgfHwgdHYudmFpVHJvUGhvbmcgPT09ICdob3N0JztcbiAgICAgICAgICAgICAgICBjb25zdCBsYUdWID0gdHYudmFpVHJvID09PSAnZ2lhb192aWVuJztcbiAgICAgICAgICAgICAgICBjb25zdCBsYUNvSG9zdCA9IHR2LnZhaVRyb1Bob25nID09PSAnY29ob3N0JztcbiAgICAgICAgICAgICAgICBjb25zdCBncmFudFZvaWNlID0gZ3JhbnRzLnNvbWUoZyA9PiBnLmtob2FUViA9PT0gdHYua2hvYSAmJiBnLmNhcGFiaWxpdHkgPT09ICd2b2ljZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50VmlkZW8gPSBncmFudHMuc29tZShnID0+IGcua2hvYVRWID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZpZGVvX2NvbnRyb2wnKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgIGtleT17dHYua2hvYSB8fCB0di50ZW4gfHwgaWR4fVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41IHAtMi41IHJvdW5kZWQteGwgYmctd2hpdGUvWzAuMDNdIGhvdmVyOmJnLXdoaXRlL1swLjA2XSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgaG92ZXI6Ym9yZGVyLXRlYWwtNTAwLzI1IHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLWZ1bGwgYmctZ3JhZGllbnQtdG8tYnIgZnJvbS10ZWFsLTUwMC8yMCB0by1lbWVyYWxkLTUwMC8yMCBib3JkZXIgYm9yZGVyLXRlYWwtNTAwLzMwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteHMgZm9udC1ibGFjayB0ZXh0LXRlYWwtMzAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3R2LmF2YXRhciA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXt0di5hdmF0YXJ9IGFsdD1cIlwiIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgcm91bmRlZC1mdWxsIG9iamVjdC1jb3ZlclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICh0di50ZW4gfHwgJz8nKS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTIwMCB0cnVuY2F0ZVwiPnt0di50ZW59PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2xhSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNEXHVEQzUxIEhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUdWICYmICFsYUhvc3QgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzQ1x1REY5MyBHaVx1MDBFMW8gdmlcdTAwRUFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICB7bGFDb0hvc3QgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MkI1MCBDby1ob3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgYmxvY2sgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt0di5sb3BUZW4gPyBgTFx1MUVEQnAgJHt0di5sb3BUZW59YCA6IChsYUdWID8gJ0dpXHUwMEUxbyB2aVx1MDBFQW4gdHJcdTAxQjBcdTFFRERuZycgOiAnSFx1MUVDRGMgc2luaCcpfVxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgey8qIE1lbWJlciBhY3Rpb25zIG5cdTFFQkZ1IGxcdTAwRTAgaG9zdC9HViAqL31cbiAgICAgICAgICAgICAgICAgICAgeyh2YWlUcm9QaG9uZyA9PT0gJ2hvc3QnIHx8IGF1dGgudXNlcj8uaXNUZWFjaGVyKSAmJiAhbGFIb3N0ICYmIHR2Lmtob2EgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/Lignc2V0X2NvX2hvc3QnLCB7IGtob2FUVjogdHYua2hvYSwgb246ICFsYUNvSG9zdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2xhQ29Ib3N0ID8gJ1RodSBxdXlcdTFFQzFuIGNvLWhvc3QnIDogJ0NcdTFFQTVwIGNvLWhvc3QnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFDb0hvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlci12aW9sZXQtNTAwLzQwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjby1ob3N0XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246ICFncmFudFZvaWNlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNcdTFFQTVwL3RodSBxdXlcdTFFQzFuIG1pY1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNiBoLTYgcm91bmRlZCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LVsxMHB4XSBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFudFZvaWNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC80MCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERjk5XHVGRTBGXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZpZGVvX2NvbnRyb2wnLCBvbjogIWdyYW50VmlkZW8gfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gdmlkZW9cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTYgaC02IHJvdW5kZWQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTBweF0gYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JhbnRWaWRlb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctYmx1ZS01MDAvMjAgdGV4dC1ibHVlLTMwMCBib3JkZXItYmx1ZS01MDAvNDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzQ1x1REZBNVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpcm0oYEtpY2sgJHt0di50ZW59IGtoXHUxRUNGaSBwaFx1MDBGMm5nP2ApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdraWNrJywgeyBraG9hVFY6IHR2Lmtob2EgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZCAmJiAhZC5vaykgYWxlcnQoZC5sb2kgfHwgJ0toXHUwMEY0bmcga2ljayBcdTAxMTFcdTAxQjBcdTFFRTNjLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJLaWNrIGtoXHUxRUNGaSBwaFx1MDBGMm5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy02IGgtNiByb3VuZGVkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGJvcmRlciBiZy1yb3NlLTUwMC8xMCB0ZXh0LXJvc2UtMzAwIGJvcmRlci1yb3NlLTUwMC8yNSBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSl9XG5cbiAgICAgICAgICAgICAge3RoYW5oVmllbi5sZW5ndGggPT09IDAgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgcHktOCB0ZXh0LXNsYXRlLTUwMCB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgICBDaFx1MDFCMGEgY1x1MDBGMyB0aFx1MDBFMG5oIHZpXHUwMEVBbiBuXHUwMEUwbyB0cm9uZyBwaFx1MDBGMm5nLlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cblxuXG4gICAgICAgIHsvKiBUQUIgNjogUVVcdTFFQTJOIFRSXHUxRUNBIFBIXHUwMEQyTkcgKHN0YWZmIG9ubHkpIFx1MjAxNCBwb2xpY3kgbWF0cml4ICsgbWVtYmVyIGFjdGlvbnMgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAncXVhbi10cmknICYmIGlzU3RhZmYgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTMgb3ZlcmZsb3cteS1hdXRvIG1pbi1oLTAgcHItMSBoLWZ1bGxcIj5cbiAgICAgICAgICAgIHsvKiBRdWljayBhY3Rpb25zIHRoZW8gbVx1MDBGNCBoXHUwMEVDbmggXHUwMTExXHUwMEUzIGNoXHUxRUQxdCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNhcCBvZiBbJ25vdGVzJywgJ3doaXRlYm9hcmQnLCAnc2hlZXQnXSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiAxLCBhY2Nlc3NNb2RlOiAnc3RhZmZfb25seScgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTIgS2hcdTAwRjNhIGNcdTFFRDluZyB0XHUwMEUxYyAoY2hcdTFFQzkgeGVtKVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2FwIG9mIFsnbm90ZXMnLCAnd2hpdGVib2FyZCcsICdzaGVldCddKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6ICdldmVyeW9uZScgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgaG92ZXI6YmctZW1lcmFsZC01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTMgTVx1MUVERiBjXHUxRUQ5bmcgdFx1MDBFMWMgY2hvIG1cdTFFQ0RpIG5nXHUwMUIwXHUxRUREaVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogUG9saWN5IG1hdHJpeCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTNcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBtYi0yXCI+Q2hcdTAwRURuaCBzXHUwMEUxY2ggY1x1MDBGNG5nIGNcdTFFRTU8L3A+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgICB7W1xuICAgICAgICAgICAgICAgICAgWyd2aWRlb19jb250cm9sJywgJ1x1MDExMGlcdTFFQzF1IGtoaVx1MUVDM24gcGhcdTAwRTF0IChwbGF5L3BhdXNlL3R1YSknXSxcbiAgICAgICAgICAgICAgICAgIFsndmlkZW9fY2hhbmdlJywgJ1x1MDExMFx1MUVENWkgdmlkZW8gXHUwMTExYW5nIHBoXHUwMEUxdCddLFxuICAgICAgICAgICAgICAgICAgWydxdWV1ZScsICdIXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB2aWRlbyddLFxuICAgICAgICAgICAgICAgICAgWydjaGF0JywgJ0NoYXQgcGhcdTAwRjJuZyddLFxuICAgICAgICAgICAgICAgICAgWydub3RlcycsICdHaGkgY2hcdTAwRkEgY2h1bmcnXSxcbiAgICAgICAgICAgICAgICAgIFsnd2hpdGVib2FyZCcsICdCXHUxRUEzbmcgdlx1MUVCRCddLFxuICAgICAgICAgICAgICAgICAgWydzaGVldCcsICdCXHUxRUEzbmcgdFx1MDBFRG5oJ10sXG4gICAgICAgICAgICAgICAgICBbJ3ZvaWNlJywgJ1ZvaWNlIDEtMSddLFxuICAgICAgICAgICAgICAgICAgWydpbnZpdGUnLCAnTVx1MUVERGkgbmdcdTAxQjBcdTFFRERpIHZcdTAwRTBvIHBoXHUwMEYybmcnXSxcbiAgICAgICAgICAgICAgICBdLm1hcCgoW2NhcCwgbmhhbl0pID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHBvbCA9IHBvbGljaWVzPy5bY2FwXSB8fCB7IGVuYWJsZWQ6IDEsIGFjY2Vzc19tb2RlOiAnc3RhZmZfb25seScgfTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtjYXB9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmbGV4LTEgdGV4dC1zbGF0ZS0zMDAgdHJ1bmNhdGVcIj57bmhhbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiBwb2wuZW5hYmxlZCA/IDAgOiAxLCBhY2Nlc3NNb2RlOiBwb2wuYWNjZXNzX21vZGUgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cG9sLmVuYWJsZWQgPyAnXHUwMTEwYW5nIGJcdTFFQUR0IFx1MjAxNCBiXHUxRUE1bSBcdTAxMTFcdTFFQzMgdFx1MUVBRnQnIDogJ1x1MDExMGFuZyB0XHUxRUFGdCBcdTIwMTQgYlx1MUVBNW0gXHUwMTExXHUxRUMzIGJcdTFFQUR0J31cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctOCBoLTQuNSBweC0wLjUgcm91bmRlZC1mdWxsIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciAke3BvbC5lbmFibGVkID8gJ2JnLWVtZXJhbGQtNTAwLzMwIGJvcmRlci1lbWVyYWxkLTUwMC80MCBqdXN0aWZ5LWVuZCcgOiAnYmctd2hpdGUvNSBib3JkZXItd2hpdGUvMTUganVzdGlmeS1zdGFydCd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTMgaC0zIHJvdW5kZWQtZnVsbCAke3BvbC5lbmFibGVkID8gJ2JnLWVtZXJhbGQtNDAwJyA6ICdiZy1zbGF0ZS01MDAnfWB9Pjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17cG9sLmFjY2Vzc19tb2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFwb2wuZW5hYmxlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0xLjUgcHktMSB0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTIwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwic3RhZmZfb25seVwiPlF1XHUxRUEzbiB0clx1MUVDQjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInNlbGVjdGVkX21lbWJlcnNcIj5NXHUxRUQ5dCBzXHUxRUQxIG5nXHUwMUIwXHUxRUREaTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImV2ZXJ5b25lXCI+TVx1MUVDRGkgbmdcdTAxQjBcdTFFRERpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgb3BhY2l0eS02MFwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmxleC0xIHRleHQtc2xhdGUtNDAwXCI+S2lcdTFFQzNtIGR1eVx1MUVDN3QgKGtpY2sveG9cdTAwRTEgdGluKTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gZm9udC1ib2xkIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHJvdW5kZWQgcHgtMS41IHB5LTAuNVwiPkxVXHUwMEQ0TiBRVVx1MUVBMk4gVFJcdTFFQ0E8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBRdVx1MUVBM24gbFx1MDBGRCB0aFx1MDBFMG5oIHZpXHUwMEVBbiAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTNcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBtYi0yXCI+VGhcdTAwRTBuaCB2aVx1MDBFQW4gJiBxdXlcdTFFQzFuIHJpXHUwMEVBbmc8L3A+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgICB7KHRoYW5oVmllbiB8fCBbXSkubWFwKHR2ID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhSG9zdCA9IEJvb2xlYW4odHYubGFDaHVQaG9uZyk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUdWID0gdHYudmFpVHJvID09PSAnZ2lhb192aWVuJztcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhQ29Ib3N0ID0gdHYudmFpVHJvUGhvbmcgPT09ICdjb19ob3N0JztcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50Vm9pY2UgPSAoZ3JhbnRzIHx8IFtdKS5zb21lKGcgPT4gZy5raG9hID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZvaWNlJyAmJiBnLnRyYW5nVGhhaSA9PT0gJ2dyYW50ZWQnKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50VmlkZW8gPSAoZ3JhbnRzIHx8IFtdKS5zb21lKGcgPT4gZy5raG9hID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZpZGVvX2NvbnRyb2wnICYmIGcudHJhbmdUaGFpID09PSAnZ3JhbnRlZCcpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3R2Lmtob2EgfHwgdHYudGVufSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHRleHQteHMgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0yMDAgZm9udC1zZW1pYm9sZCB0cnVuY2F0ZSBtYXgtdy1bMTEwcHhdXCI+e3R2LnRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAge2xhSG9zdCAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtYW1iZXItNDAwIGZvbnQtYm9sZFwiPlx1MjYwNSBob3N0PC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7bGFHViAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtWyMwMEYyRkVdIGZvbnQtYm9sZFwiPkdWPC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7bGFDb0hvc3QgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXZpb2xldC0zMDAgZm9udC1ib2xkXCI+Y28taG9zdDwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAgeyFsYUhvc3QgJiYgIWxhR1YgJiYgdHYua2hvYSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtbC1hdXRvIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHsodmFpVHJvUGhvbmcgPT09ICdob3N0JyB8fCBhdXRoLnVzZXI/LmlzVGVhY2hlcikgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdzZXRfY29faG9zdCcsIHsga2hvYVRWOiB0di5raG9hLCBvbjogIWxhQ29Ib3N0IH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2xhQ29Ib3N0ID8gJ1RodSBxdXlcdTFFQzFuIGNvLWhvc3QnIDogJ0NcdTFFQTVwIGNvLWhvc3QnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2xhQ29Ib3N0ID8gJ2JnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlci12aW9sZXQtNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246ICFncmFudFZvaWNlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gdm9pY2VcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgJHtncmFudFZvaWNlID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHR2Lmtob2EsIGNhcGFiaWxpdHk6ICd2aWRlb19jb250cm9sJywgb246ICFncmFudFZpZGVvIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiB2aWRlb1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2dyYW50VmlkZW8gPyAnYmctY3lhbi01MDAvMjAgdGV4dC1jeWFuLTMwMCBib3JkZXItY3lhbi01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHsgaWYgKGNvbmZpcm0oYEtpY2sgJHt0di50ZW59IGtoXHUxRUNGaSBwaFx1MDBGMm5nP2ApKSB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2tpY2snLCB7IGtob2FUVjogdHYua2hvYSB9KTsgaWYgKGQgJiYgIWQub2spIGFsZXJ0KGQubG9pIHx8ICdLaFx1MDBGNG5nIGtpY2sgXHUwMTExXHUwMUIwXHUxRUUzYy4nKTsgfSB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiS2ljayBraFx1MUVDRmkgcGhcdTAwRjJuZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciBiZy1yb3NlLTUwMC8xMCB0ZXh0LXJvc2UtMzAwIGJvcmRlci1yb3NlLTUwMC8yNSBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgIHsodGhhbmhWaWVuIHx8IFtdKS5sZW5ndGggPT09IDAgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDBcIj5DaFx1MDFCMGEgY1x1MDBGMyB0aFx1MDBFMG5oIHZpXHUwMEVBbi48L3A+fVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogXHUwMTEwXHUxRUQ1aS9iXHUxRUNGIG1cdTFFQUR0IGtoXHUxRUE5dSBcdTIwMTQgY2hcdTFFQzkgaG9zdC9HViAqL31cbiAgICAgICAgICAgIHsodmFpVHJvUGhvbmcgPT09ICdob3N0JyB8fCBhdXRoLnVzZXI/LmlzVGVhY2hlcikgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0zIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJNXHUxRUFEdCBraFx1MUVBOXUgbVx1MUVEQmkgKFx1MDExMVx1MUVDMyB0clx1MUVEMW5nID0gYlx1MUVDRiBtXHUxRUFEdCBraFx1MUVBOXUpXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtcGhvbmctbWF0LWtoYXUtbW9pXCJcbiAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17MTAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnB1dC1waG9uZy1tYXQta2hhdS1tb2knKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWsgPSBlbD8udmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBtay50cmltKClcbiAgICAgICAgICAgICAgICAgICAgICA/IGF3YWl0IGhhbmhEb25nUGhvbmc/LignZG9pX21hdF9raGF1JywgeyBtYXRLaGF1TW9pOiBtay50cmltKCkgfSlcbiAgICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IGhhbmhEb25nUGhvbmc/LignYm9fbWF0X2toYXUnLCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkICYmICFkLm9rKSBhbGVydChkLmxvaSB8fCAnS2hcdTAwRjRuZyBcdTAxMTFcdTFFRDVpIFx1MDExMVx1MDFCMFx1MUVFM2MgbVx1MUVBRHQga2hcdTFFQTl1LicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWwpIGVsLnZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC1sZyBiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLWFtYmVyLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgXHUwMTEwXHUxRUQ1aSAvIEJcdTFFQ0ZcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDYW1wdXNXYXRjaFRvZ2V0aGVyKHtcbiAgcGhvbmcsXG4gIHBob25nTWluaEtob2E6IF9waG9uZ01pbmhLaG9hLFxuICBhdXRoLFxuICBkb25nUGhvbmdIaWVuVGFpOiBfZG9uZ1Bob25nSGllblRhaSxcbiAgc29OZ3VvaTogX3NvTmd1b2ksXG4gIG15Q2FwcyxcbiAgdmlkZW9UaW1lUmVmLFxuICBpc1Jvb21XaWRlLFxuICBoYW5oRG9uZ1Bob25nOiBfaGFuaERvbmdQaG9uZyxcbiAgaXNTdGFmZiA9IGZhbHNlLFxufSkge1xuICBjb25zdCBbd2F0Y2hTdGF0ZSwgc2V0V2F0Y2hTdGF0ZV0gPSB1c2VTdGF0ZSh7XG4gICAgcGxheWluZzogZmFsc2UsXG4gICAgcG9zaXRpb25TZWNvbmRzOiAwLFxuICAgIGJhc2VQb3NpdGlvblNlY29uZHM6IDAsXG4gICAgcGxheWJhY2tSYXRlOiAxLjAsXG4gICAgcmV2aXNpb246IDEsXG4gICAgdXBkYXRlZEF0OiAnJyxcbiAgICBzZXJ2ZXJOb3c6ICcnLFxuICAgIHVwZGF0ZWRCeTogJydcbiAgfSk7XG4gIGNvbnN0IFtjYW5Db250cm9sLCBzZXRDYW5Db250cm9sXSA9IHVzZVN0YXRlKEJvb2xlYW4oXG4gICAgYXV0aD8udXNlcj8uaXNUZWFjaGVyIHx8IHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nIHx8IG15Q2Fwcz8udmlkZW9fY29udHJvbCB8fCBteUNhcHM/LnZpZGVvX2NoYW5nZSB8fCBpc1N0YWZmXG4gICkpO1xuICBjb25zdCBbX3dhdGNoQ2Fwcywgc2V0V2F0Y2hDYXBzXSA9IHVzZVN0YXRlKHt9KTtcbiAgY29uc3QgZ2V0SW5pdGlhbFZpZGVvVXJsID0gKCkgPT4ge1xuICAgIGxldCBjID0ge307XG4gICAgdHJ5IHsgYyA9IHBob25nPy5jYXVIaW5oID8gSlNPTi5wYXJzZShwaG9uZy5jYXVIaW5oKSA6IHt9OyB9IGNhdGNoIHsgfVxuICAgIHJldHVybiBjLnZpZGVvVXJsIHx8IHBob25nPy52aWRlb1VybCB8fCAnJztcbiAgfTtcblxuICBjb25zdCBnZXRJbml0aWFsUHJvdmlkZXIgPSAodSkgPT4ge1xuICAgIGlmICghdSkgcmV0dXJuICdVTlNVUFBPUlRFRCc7XG4gICAgaWYgKGlkWW91dHViZSh1KSkgcmV0dXJuICdZT1VUVUJFJztcbiAgICBpZiAoaWRHb29nbGVEcml2ZSh1KSkgcmV0dXJuICdHT09HTEVfRFJJVkUnO1xuICAgIGlmIChsYVZpZGVvVHJ1Y1RpZXBGZSh1KSkgcmV0dXJuICdOQVRJVkVfSFRNTDUnO1xuICAgIHJldHVybiAnVU5TVVBQT1JURUQnO1xuICB9O1xuXG4gIGNvbnN0IGluaXRVcmwgPSBnZXRJbml0aWFsVmlkZW9VcmwoKTtcbiAgY29uc3QgW2FjdGl2ZVZpZGVvVXJsLCBzZXRBY3RpdmVWaWRlb1VybF0gPSB1c2VTdGF0ZShpbml0VXJsKTtcbiAgY29uc3QgW3Byb3ZpZGVyLCBzZXRQcm92aWRlcl0gPSB1c2VTdGF0ZSgoKSA9PiBnZXRJbml0aWFsUHJvdmlkZXIoaW5pdFVybCkpO1xuICBjb25zdCBbaGFzSW50ZXJhY3RlZCwgc2V0SGFzSW50ZXJhY3RlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2NhbFRpbWUsIHNldExvY2FsVGltZV0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW2R1cmF0aW9uLCBzZXREdXJhdGlvbl0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW2RhbmdHdWlMZW5oLCBzZXREYW5nR3VpTGVuaF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2ksIHNldExvaV0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENcdTFFQTRVIEhcdTAwQ0NOSCBWSURFTywgVFx1MDBDQ00gS0lcdTFFQkVNIFlPVVRVQkUgJiBIXHUwMEMwTkcgXHUwMTEwXHUxRUUySSBUXHUxRUEwSSBWXHUwMEQ5TkcgMSBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3QgW21lZGlhVGFiLCBzZXRNZWRpYVRhYl0gPSB1c2VTdGF0ZSgnc2VhcmNoJyk7IC8vICdzZWFyY2gnIHwgJ3F1ZXVlJ1xuICBjb25zdCBbdmlkZW9Nb2ksIHNldFZpZGVvTW9pXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2RhbmdEb2lWaWRlbywgc2V0RGFuZ0RvaVZpZGVvXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2xvaVZpZGVvLCBzZXRMb2lWaWRlb10gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFt0aG9uZ0Jhb1ZpZGVvLCBzZXRUaG9uZ0Jhb1ZpZGVvXSA9IHVzZVN0YXRlKCcnKTtcblxuICAvLyBZb3VUdWJlIFNlYXJjaCBTdGF0ZVxuICBjb25zdCBbeXRRdWVyeSwgc2V0WXRRdWVyeV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFt5dFJlc3VsdHMsIHNldFl0UmVzdWx0c10gPSB1c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFtzZWFyY2hpbmdZdCwgc2V0U2VhcmNoaW5nWXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2VhcmNoTG9pLCBzZXRTZWFyY2hMb2ldID0gdXNlU3RhdGUoJycpO1xuXG4gIC8vIFF1ZXVlIFN0YXRlXG4gIGNvbnN0IFtxdWV1ZUxpc3QsIHNldFF1ZXVlTGlzdF0gPSB1c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFtxdWV1ZUJ1c3ksIHNldFF1ZXVlQnVzeV0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtkYU1vUm9uZ1N0dWRpbywgc2V0RGFNb1JvbmdTdHVkaW9dID0gdXNlU3RhdGUodHJ1ZSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAocGhvbmc/LmNhbkNvbnRyb2wgfHwgcGhvbmc/LmxhQ2h1UGhvbmcgfHwgYXV0aD8udXNlcj8uaXNUZWFjaGVyIHx8IG15Q2Fwcz8udmlkZW9fY29udHJvbCB8fCBteUNhcHM/LnZpZGVvX2NoYW5nZSB8fCBpc1N0YWZmKSB7XG4gICAgICBzZXRDYW5Db250cm9sKHRydWUpO1xuICAgIH1cbiAgfSwgW3Bob25nPy5jYW5Db250cm9sLCBwaG9uZz8ubGFDaHVQaG9uZywgYXV0aD8udXNlcj8uaXNUZWFjaGVyLCBteUNhcHMsIGlzU3RhZmZdKTtcblxuICAvLyBUXHUxRUEzaSBkYW5oIHNcdTAwRTFjaCBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB0XHUxRUVCIHNlcnZlclxuICBjb25zdCB0YWlRdWV1ZSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctcXVldWU/cGhvbmdJZD0ke3Bob25nLmlkfSZhY3Rpb249bGlzdGApO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vaykgc2V0UXVldWVMaXN0KGQucXVldWUgfHwgW10pO1xuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHRhaVF1ZXVlKCk7XG4gICAgY29uc3QgdGltZXIgPSBzZXRJbnRlcnZhbChraGlIaWVuVGhpKHRhaVF1ZXVlKSwgNDAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICB9LCBbcGhvbmcuaWRdKTtcblxuICAvLyBcdTAxMTBcdTFFRDVpIHZpZGVvIFx1MDExMWFuZyBwaFx1MDBFMXRcbiAgY29uc3QgZG9pVmlkZW8gPSBhc3luYyAodXJsLCB0aXRsZSkgPT4ge1xuICAgIGNvbnN0IHUgPSBTdHJpbmcodXJsIHx8IHZpZGVvTW9pIHx8IHl0UXVlcnkgfHwgJycpLnRyaW0oKTtcbiAgICBpZiAoIXUgfHwgZGFuZ0RvaVZpZGVvKSByZXR1cm47XG4gICAgc2V0RGFuZ0RvaVZpZGVvKHRydWUpO1xuICAgIHNldExvaVZpZGVvKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctd2F0Y2gnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAnc2V0X3ZpZGVvJywgdmlkZW9Vcmw6IHUsIGF1dG9QbGF5OiB0cnVlIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSB7XG4gICAgICAgIHNldExvaVZpZGVvKGQubG9pIHx8ICdLaFx1MDBGNG5nIFx1MDExMVx1MUVENWkgXHUwMTExXHUwMUIwXHUxRUUzYyB2aWRlby4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKHUpO1xuICAgICAgICBzZXRQcm92aWRlcihnZXRJbml0aWFsUHJvdmlkZXIodSkpO1xuICAgICAgICBzZXRWaWRlb01vaSgnJyk7XG4gICAgICAgIGlmIChkLnN0YXRlKSB7XG4gICAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgICBzZXRMb2NhbFRpbWUoMCk7XG4gICAgICAgIH1cbiAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSAwO1xuICAgICAgICBzZXREdXJhdGlvbigwKTtcbiAgICAgICAgY29uc3QgbmV3WXRJZCA9IGlkWW91dHViZSh1KTtcbiAgICAgICAgaWYgKG5ld1l0SWQgJiYgeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFJlYWR5UmVmLmN1cnJlbnQgJiYgdHlwZW9mIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQoeyB2aWRlb0lkOiBuZXdZdElkLCBzdGFydFNlY29uZHM6IDAgfSk7XG4gICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpO1xuICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBzZXRUaG9uZ0Jhb1ZpZGVvKGBcdTAxMTBhbmcgcGhcdTAwRTF0OiAke3RpdGxlIHx8IHV9YCk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VGhvbmdCYW9WaWRlbygnJyksIDQwMDApO1xuICAgICAgICB0YWlRdWV1ZSgpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0TG9pVmlkZW8oJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXREYW5nRG9pVmlkZW8oZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyBUXHUwMEVDbSBraVx1MUVCRm0gWW91VHViZVxuICBjb25zdCB0aW1LaWVtWW91VHViZSA9IGFzeW5jIChlLCB0dUtob2EpID0+IHtcbiAgICBlPy5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IHEgPSBTdHJpbmcodHVLaG9hIHx8IHl0UXVlcnkgfHwgJycpLnRyaW0oKTtcbiAgICBpZiAoIXEgfHwgc2VhcmNoaW5nWXQpIHJldHVybjtcbiAgICBpZiAodHVLaG9hKSBzZXRZdFF1ZXJ5KHR1S2hvYSk7XG5cbiAgICAvLyBOXHUxRUJGdSBuZ1x1MDFCMFx1MUVERGkgZFx1MDBGOW5nIGRcdTAwRTFuIGxpXHUwMEVBbiBrXHUxRUJGdCB2aWRlbyBZb3VUdWJlXG4gICAgY29uc3QgaWRZdCA9IGlkWW91dHViZShxKTtcbiAgICBpZiAoaWRZdCkge1xuICAgICAgc2V0WXRSZXN1bHRzKFt7XG4gICAgICAgIHZpZGVvSWQ6IGlkWXQsXG4gICAgICAgIHRpdGxlOiAnVmlkZW8gWW91VHViZSAodFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQgXHUwMTExXHUwMEUzIGRcdTAwRTFuKScsXG4gICAgICAgIGNoYW5uZWxUaXRsZTogJ1lvdVR1YmUnLFxuICAgICAgICB0aHVtYm5haWw6IGBodHRwczovL2kueXRpbWcuY29tL3ZpLyR7aWRZdH0vaHFkZWZhdWx0LmpwZ2AsXG4gICAgICAgIHB1Ymxpc2hlZEF0OiAnVHJcdTFFRjFjIHRpXHUxRUJGcCdcbiAgICAgIH1dKTtcbiAgICAgIHNldFNlYXJjaExvaSgnJyk7XG4gICAgICBzZXRNZWRpYVRhYignc2VhcmNoJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0U2VhcmNoaW5nWXQodHJ1ZSk7XG4gICAgc2V0U2VhcmNoTG9pKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkveW91dHViZS1zZWFyY2g/cT0ke2VuY29kZVVSSUNvbXBvbmVudChxKX1gKTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgQXJyYXkuaXNBcnJheShkLml0ZW1zKSkge1xuICAgICAgICBpZiAoZC5pdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBzZXRTZWFyY2hMb2koJ0toXHUwMEY0bmcgdFx1MDBFQ20gdGhcdTFFQTV5IHZpZGVvIG5cdTAwRTBvIHBoXHUwMEY5IGhcdTFFRTNwIHZcdTFFREJpIHRcdTFFRUIga2hcdTAwRjNhIG5cdTAwRTB5LicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldFl0UmVzdWx0cyhkLml0ZW1zKTtcbiAgICAgICAgICBzZXRNZWRpYVRhYignc2VhcmNoJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFNlYXJjaExvaShkLmxvaSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyB0XHUwMEVDbSBraVx1MUVCRm0gdmlkZW8gbFx1MDBGQWMgblx1MDBFMHkuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRTZWFyY2hMb2koJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIGtoaSB0XHUwMEVDbSBraVx1MUVCRm0gWW91VHViZS4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0U2VhcmNoaW5nWXQoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB2aWRlb1JlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgeXRQbGF5ZXJSZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IHl0Q29udGFpbmVySWQgPSBgeXQtcGxheWVyLSR7cGhvbmcuaWR9YDtcbiAgY29uc3QgaXNTZWVraW5nUmVmID0gdXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgaGFzSW50ZXJhY3RlZFJlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGR1cmF0aW9uUmVmID0gdXNlUmVmKDApO1xuICBjb25zdCBoYXNUcmlnZ2VyZWRTa2lwUmVmID0gdXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgaXNTa2lwcGluZ1JlZiA9IHVzZVJlZihmYWxzZSk7XG5cbiAgLy8gVGhhbyB0XHUwMEUxYyBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaSAoZW5xdWV1ZSwgYWRkX25leHQsIHBsYXlfbm93LCBza2lwLCByZW1vdmUpXG4gIGNvbnN0IGhhbmhEb25nUXVldWUgPSBhc3luYyAoYWN0aW9uLCBleHRyYSA9IHt9KSA9PiB7XG4gICAgaWYgKGFjdGlvbiA9PT0gJ3NraXAnKSB7XG4gICAgICBpZiAoaXNTa2lwcGluZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHF1ZXVlQnVzeSkgcmV0dXJuO1xuICAgICAgc2V0UXVldWVCdXN5KHRydWUpO1xuICAgIH1cbiAgICBzZXRMb2lWaWRlbygnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXF1ZXVlJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbiwgLi4uZXh0cmEgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoIWQub2spIHtcbiAgICAgICAgc2V0TG9pVmlkZW8oZC5sb2kgfHwgJ1RoYW8gdFx1MDBFMWMgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdGhcdTFFQTV0IGJcdTFFQTFpLicpO1xuICAgICAgICBpZiAoYWN0aW9uID09PSAnc2tpcCcpIHtcbiAgICAgICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ2VucXVldWUnKSB7XG4gICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbyhgXHUwMTEwXHUwMEUzIHRoXHUwMEVBbSB2XHUwMEUwbyBjdVx1MUVEMWkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2k6ICR7ZXh0cmEudGl0bGUgfHwgJ1ZpZGVvJ31gKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCAzNTAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdhZGRfbmV4dCcpIHtcbiAgICAgICAgICBzZXRUaG9uZ0Jhb1ZpZGVvKGBcdTAxMTBcdTAwRTMgdGhcdTAwRUFtIHBoXHUwMEUxdCBrXHUxRUJGIHRpXHUxRUJGcDogJHtleHRyYS50aXRsZSB8fCAnVmlkZW8nfWApO1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VGhvbmdCYW9WaWRlbygnJyksIDM1MDApO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ3BsYXlfbm93JyB8fCBhY3Rpb24gPT09ICdza2lwJykge1xuICAgICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSAwO1xuICAgICAgICAgIHNldER1cmF0aW9uKDApO1xuICAgICAgICAgIGlmIChkLnZpZGVvVXJsKSB7XG4gICAgICAgICAgICBzZXRBY3RpdmVWaWRlb1VybChkLnZpZGVvVXJsKTtcbiAgICAgICAgICAgIHNldFByb3ZpZGVyKGdldEluaXRpYWxQcm92aWRlcihkLnZpZGVvVXJsKSk7XG4gICAgICAgICAgICBpZiAoZC5zdGF0ZSkge1xuICAgICAgICAgICAgICBzZXRXYXRjaFN0YXRlKGQuc3RhdGUpO1xuICAgICAgICAgICAgICBzZXRMb2NhbFRpbWUoMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBuZXdZdElkID0gaWRZb3V0dWJlKGQudmlkZW9VcmwpO1xuICAgICAgICAgICAgaWYgKG5ld1l0SWQgJiYgeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFJlYWR5UmVmLmN1cnJlbnQgJiYgdHlwZW9mIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCh7IHZpZGVvSWQ6IG5ld1l0SWQsIHN0YXJ0U2Vjb25kczogMCB9KTtcbiAgICAgICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpO1xuICAgICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZXRUaG9uZ0Jhb1ZpZGVvKCdcdTAxMTBhbmcgY2h1eVx1MUVDM24gdmlkZW8gdGlcdTFFQkZwIHRoZW8uLi4nKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VGhvbmdCYW9WaWRlbygnJyksIDMwMDApO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZC5lbXB0eSkge1xuICAgICAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbygnSFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgXHUwMTExXHUwMEUzIGhcdTFFQkZ0IHZpZGVvLicpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUaG9uZ0Jhb1ZpZGVvKCcnKSwgMzAwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRhaVF1ZXVlKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRMb2lWaWRlbygnTVx1MUVBNXQga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgICBpZiAoYWN0aW9uID09PSAnc2tpcCcpIHtcbiAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBpZiAoYWN0aW9uICE9PSAnc2tpcCcpIHtcbiAgICAgICAgc2V0UXVldWVCdXN5KGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgYyA9IHt9O1xuICAgIHRyeSB7IGMgPSBwaG9uZz8uY2F1SGluaCA/IEpTT04ucGFyc2UocGhvbmcuY2F1SGluaCkgOiB7fTsgfSBjYXRjaCB7IH1cbiAgICBjb25zdCBuZXh0VXJsID0gYy52aWRlb1VybCB8fCBwaG9uZz8udmlkZW9VcmwgfHwgJyc7XG4gICAgaWYgKG5leHRVcmwgJiYgbmV4dFVybCAhPT0gYWN0aXZlVmlkZW9VcmwpIHtcbiAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gMDtcbiAgICAgIHNldER1cmF0aW9uKDApO1xuICAgICAgc2V0QWN0aXZlVmlkZW9VcmwobmV4dFVybCk7XG4gICAgICBzZXRQcm92aWRlcihnZXRJbml0aWFsUHJvdmlkZXIobmV4dFVybCkpO1xuICAgIH1cbiAgfSwgW3Bob25nPy5jYXVIaW5oLCBwaG9uZz8udmlkZW9VcmxdKTtcblxuICBjb25zdCB2aWRlb1VybCA9IGFjdGl2ZVZpZGVvVXJsO1xuICBjb25zdCB5dElkID0gdmlkZW9VcmwgPyBpZFlvdXR1YmUodmlkZW9VcmwpIDogbnVsbDtcbiAgY29uc3QgZHJ2SWQgPSB2aWRlb1VybCA/IGlkR29vZ2xlRHJpdmUodmlkZW9VcmwpIDogbnVsbDtcbiAgY29uc3QgdHJ1Y1RpZXBVcmwgPSB2aWRlb1VybCAmJiAheXRJZCAmJiAhZHJ2SWQgJiYgbGFWaWRlb1RydWNUaWVwRmUodmlkZW9VcmwpID8gdXJsTWVkaWFGZSh2aWRlb1VybCkgOiAnJztcblxuICBjb25zdCBbX3l0UGxheWVyUmVhZHksIHNldFl0UGxheWVyUmVhZHldID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCB5dFJlYWR5UmVmID0gdXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgY3VycmVudFl0SWRSZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IGhhc1NlZWtlZEluaXRSZWYgPSB1c2VSZWYoZmFsc2UpO1xuICBjb25zdCBsYXN0SG9zdFN5bmNUaW1lUmVmID0gdXNlUmVmKDApO1xuICBjb25zdCBsYXN0QXBwbGllZFJldmlzaW9uUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBsYXN0SG9zdFRyYWNrVGltZVJlZiA9IHVzZVJlZih7IHRpbWU6IDAsIHN0YW1wOiBEYXRlLm5vdygpIH0pO1xuXG4gIGNvbnN0IHdhdGNoU3RhdGVSZWYgPSB1c2VSZWYod2F0Y2hTdGF0ZSk7XG4gIHdhdGNoU3RhdGVSZWYuY3VycmVudCA9IHdhdGNoU3RhdGU7XG4gIGNvbnN0IGRhbmdHdWlMZW5oUmVmID0gdXNlUmVmKGRhbmdHdWlMZW5oKTtcbiAgZGFuZ0d1aUxlbmhSZWYuY3VycmVudCA9IGRhbmdHdWlMZW5oO1xuICBjb25zdCBndWlMZW5oUmVmID0gdXNlUmVmKG51bGwpO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBUXHUxRUE2TkcgMTogTFx1MUVBRm5nIG5naGUgdHJcdTFFRjFjIHRpXHUxRUJGcCB0aW4gbmhcdTFFQUZuIHBvc3RNZXNzYWdlIHRcdTFFRUIgWW91VHViZSBJRnJhbWUgXHUyNTAwXHUyNTAwXG4gIC8vIFlvdVR1YmUgSUZyYW1lIGx1XHUwMEY0biBwaFx1MDBFMXQgY1x1MDBFMWMgc1x1MUVGMSBraVx1MUVDN24gb25TdGF0ZUNoYW5nZSAmIGluZm9EZWxpdmVyeSByYSBwYXJlbnQgd2luZG93XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qgb25Nc2cgPSAoZSkgPT4ge1xuICAgICAgbGV0IGRhdGEgPSBlLmRhdGE7XG4gICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIGlmIChkYXRhLmluY2x1ZGVzKCdldmVudD0nKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhkYXRhKTtcbiAgICAgICAgICAgICAgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICBldmVudDogcGFyYW1zLmdldCgnZXZlbnQnKSxcbiAgICAgICAgICAgICAgICBpbmZvOiBwYXJhbXMuZ2V0KCdpbmZvJykgPyBKU09OLnBhcnNlKHBhcmFtcy5nZXQoJ2luZm8nKSkgOiBwYXJhbXMuZ2V0KCdpbmZvJylcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gY2F0Y2ggeyByZXR1cm47IH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFkYXRhIHx8IHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0JykgcmV0dXJuO1xuXG4gICAgICAvLyBDXHUxRUFEcCBuaFx1MUVBRHQgXHUwMTExXHUxRUQ5IGRcdTAwRTBpIHZpZGVvIHRoXHUxRUYxYyB0XHUxRUJGIChkdXJhdGlvbilcbiAgICAgIGNvbnN0IGQgPSBOdW1iZXIoZGF0YS5pbmZvPy5kdXJhdGlvbiB8fCBkYXRhLmR1cmF0aW9uIHx8IDApO1xuICAgICAgaWYgKGQgPiAwKSB7XG4gICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSBkO1xuICAgICAgICBzZXREdXJhdGlvbihwcmV2ID0+IChwcmV2ID4gMCA/IHByZXYgOiBkKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIENcdTFFQURwIG5oXHUxRUFEdCB0aFx1MUVERGkgZ2lhbiB0aFx1MUVGMWMgdFx1MUVCRlxuICAgICAgY29uc3QgY3VyID0gTnVtYmVyKGRhdGEuaW5mbz8uY3VycmVudFRpbWUpO1xuICAgICAgaWYgKCFpc05hTihjdXIpICYmIGN1ciA+PSAwICYmICFpc1NlZWtpbmdSZWYuY3VycmVudCkge1xuICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjdXIpKTtcbiAgICAgIH1cblxuICAgICAgLy8gXHUyNTAwXHUyNTAwIFZcdTAwRDlORyAyOiBcdTAxMTBcdTFFRDJORyBCXHUxRUQ4IFRIQU8gVFx1MDBDMUMgQ1x1MUVFNkEgQ0hcdTFFRTYgUEhcdTAwRDJORyBUUlx1MUVGMEMgVElcdTFFQkVQIFRSXHUwMENBTiBNXHUwMEMwTiBIXHUwMENDTkggWU9VVFVCRSBcdTI1MDBcdTI1MDBcbiAgICAgIGlmIChjYW5Db250cm9sICYmICFkYW5nR3VpTGVuaFJlZi5jdXJyZW50ICYmICFpc1NlZWtpbmdSZWYuY3VycmVudCkge1xuICAgICAgICAvLyAxLiBCXHUxRUFGdCBQbGF5IC8gUGF1c2UgdHJcdTFFRjFjIHRpXHUxRUJGcCB0XHUxRUVCIG1cdTAwRTBuIGhcdTAwRUNuaCB2aWRlbyBZb3VUdWJlXG4gICAgICAgIGNvbnN0IHBTdGF0ZSA9IGRhdGEuZXZlbnQgPT09ICdvblN0YXRlQ2hhbmdlJ1xuICAgICAgICAgID8gKHR5cGVvZiBkYXRhLmluZm8gPT09ICdudW1iZXInID8gZGF0YS5pbmZvIDogZGF0YS5pbmZvPy5wbGF5ZXJTdGF0ZSlcbiAgICAgICAgICA6IChkYXRhLmV2ZW50ID09PSAnaW5mb0RlbGl2ZXJ5JyA/IGRhdGEuaW5mbz8ucGxheWVyU3RhdGUgOiB1bmRlZmluZWQpO1xuXG4gICAgICAgIGNvbnN0IGN1clRpbWUgPSAhaXNOYU4oY3VyKSAmJiBjdXIgPj0gMCA/IGN1ciA6IHVuZGVmaW5lZDtcblxuICAgICAgICBpZiAocFN0YXRlID09PSAxICYmICF3YXRjaFN0YXRlUmVmLmN1cnJlbnQucGxheWluZykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdWXHUwMEY5bmcgMjogQ2hcdTFFRTcgcGhcdTAwRjJuZyBiXHUxRUE1bSBQbGF5IHRyXHUwMEVBbiBZb3VUdWJlIC0+IFx1MDExMVx1MUVEM25nIGJcdTFFRDkgY1x1MUVBMyBwaFx1MDBGMm5nJyk7XG4gICAgICAgICAgZ3VpTGVuaFJlZi5jdXJyZW50Py4oJ3BsYXknLCBjdXJUaW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChwU3RhdGUgPT09IDIgJiYgd2F0Y2hTdGF0ZVJlZi5jdXJyZW50LnBsYXlpbmcpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnVlx1MDBGOW5nIDI6IENoXHUxRUU3IHBoXHUwMEYybmcgYlx1MUVBNW0gUGF1c2UgdHJcdTAwRUFuIFlvdVR1YmUgLT4gXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBjXHUxRUEzIHBoXHUwMEYybmcnKTtcbiAgICAgICAgICBndWlMZW5oUmVmLmN1cnJlbnQ/LigncGF1c2UnLCBjdXJUaW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDIuIEJcdTFFQUZ0IHRoYW8gdFx1MDBFMWMgdHVhIChTZWVrKSB0clx1MDBFQW4gdGhhbmggdGlcdTFFQkZuIHRyXHUwMEVDbmggXHUwMTExXHUxRUNGIFlvdVR1YmUgKDA6MjkgLyAyOjQxOjMyKVxuICAgICAgICBpZiAoIWlzTmFOKGN1cikgJiYgY3VyID49IDApIHtcbiAgICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICAgIGNvbnN0IHByZXYgPSBsYXN0SG9zdFRyYWNrVGltZVJlZi5jdXJyZW50O1xuICAgICAgICAgIGNvbnN0IGR0ID0gTWF0aC5tYXgoMCwgKG5vdyAtIHByZXYuc3RhbXApIC8gMTAwMCk7XG4gICAgICAgICAgY29uc3QgZXhwZWN0ZWQgPSB3YXRjaFN0YXRlUmVmLmN1cnJlbnQucGxheWluZyA/IChwcmV2LnRpbWUgKyBkdCkgOiBwcmV2LnRpbWU7XG4gICAgICAgICAgY29uc3QgZGVsdGEgPSBNYXRoLmFicyhjdXIgLSBleHBlY3RlZCk7XG5cbiAgICAgICAgICAvLyBOXHUxRUJGdSB0aFx1MUVERGkgZ2lhbiBuaFx1MUVBM3kgbFx1MUVDN2NoID4gMS44IGdpXHUwMEUyeSB0cm9uZyBraG9cdTFFQTNuZyB0aFx1MUVERGkgZ2lhbiBuZ1x1MUVBRm4gKGR0IDwgNHMpXG4gICAgICAgICAgLy8gY2hcdTFFRTluZyB0XHUxRUNGIGNoXHUxRUU3IHBoXHUwMEYybmcgdlx1MUVFQmEgY2xpY2sgaG9cdTFFQjdjIGtcdTAwRTlvIHRoYW5oIFx1MDExMVx1MUVDRiB0clx1MDBFQW4gdmlkZW8gWW91VHViZVxuICAgICAgICAgIGlmIChkdCA+IDAuMjUgJiYgZHQgPCA0LjAgJiYgZGVsdGEgPiAxLjgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBWXHUwMEY5bmcgMjogQ2hcdTFFRTcgcGhcdTAwRjJuZyB0dWEgdHJcdTAwRUFuIHRoYW5oIFx1MDExMVx1MUVDRiBZb3VUdWJlICgke2N1ci50b0ZpeGVkKDEpfXMsIGxcdTFFQzdjaCAke2RlbHRhLnRvRml4ZWQoMSl9cykgLT4gXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBjXHUxRUEzIHBoXHUwMEYybmdgKTtcbiAgICAgICAgICAgIGxhc3RIb3N0VHJhY2tUaW1lUmVmLmN1cnJlbnQgPSB7IHRpbWU6IGN1ciwgc3RhbXA6IG5vdyB9O1xuICAgICAgICAgICAgZ3VpTGVuaFJlZi5jdXJyZW50Py4oJ3NlZWsnLCBjdXIpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZHQgPj0gMC41KSB7XG4gICAgICAgICAgICBsYXN0SG9zdFRyYWNrVGltZVJlZi5jdXJyZW50ID0geyB0aW1lOiBjdXIsIHN0YW1wOiBub3cgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTmhcdTFFQURuIGRpXHUxRUM3biB0clx1MUVBMW5nIHRoXHUwMEUxaSBrXHUxRUJGdCB0aFx1MDBGQWMgdmlkZW86IDAgPSBFTkRFRFxuICAgICAgY29uc3QgaXNFbmRlZCA9IChkYXRhLmV2ZW50ID09PSAnb25TdGF0ZUNoYW5nZScgJiYgKGRhdGEuaW5mbyA9PT0gMCB8fCBkYXRhLmluZm8/LnBsYXllclN0YXRlID09PSAwKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAoZGF0YS5ldmVudCA9PT0gJ2luZm9EZWxpdmVyeScgJiYgZGF0YS5pbmZvPy5wbGF5ZXJTdGF0ZSA9PT0gMCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAoZGF0YS5pbmZvICYmIGRhdGEuaW5mby5wbGF5ZXJTdGF0ZSA9PT0gMCk7XG5cbiAgICAgIGlmIChpc0VuZGVkKSB7XG4gICAgICAgIGlmIChjYW5Db250cm9sICYmICFpc1NraXBwaW5nUmVmLmN1cnJlbnQgJiYgIWhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdZb3VUdWJlIGlmcmFtZSBwb3N0TWVzc2FnZTogVmlkZW8ga1x1MUVCRnQgdGhcdTAwRkFjIC0+IHRcdTFFRjEgXHUwMTExXHUxRUQ5bmcgY2h1eVx1MUVDM24gdGlcdTFFQkZwIHZpZGVvIHRpXHUxRUJGcCB0aGVvJyk7XG4gICAgICAgICAgaGFuaERvbmdRdWV1ZSgnc2tpcCcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgb25Nc2cpO1xuICAgIHJldHVybiAoKSA9PiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uTXNnKTtcbiAgfSwgW2NhbkNvbnRyb2wsIHBob25nLmlkXSk7XG5cbiAgLy8gR1x1MUVFRGkgbGlzdGVuaW5nIGhhbmRzaGFrZSBcdTAxMTFcdTFFQ0JuaCBrXHUxRUYzIHZcdTAwRTBvIGlmcmFtZSBZb3VUdWJlIFx1MDExMVx1MUVDMyBrXHUwMEVEY2ggaG9cdTFFQTF0IGV2ZW50IHN0cmVhbVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICgheXRJZCkgcmV0dXJuO1xuICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgIGlmICghaWZyKSByZXR1cm47XG4gICAgY29uc3QgdCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmci5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnbGlzdGVuaW5nJyB9KSwgJyonKTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9LCAxNTAwKTtcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbCh0KTtcbiAgfSwgW3l0SWQsIHBob25nLmlkXSk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFRcdTFFQTZORyAyOiBLaFx1MUVERmkgdFx1MUVBMW8gdlx1MDBFMCBrXHUxRUJGdCBuXHUxRUQxaSBZb3VUdWJlIElGcmFtZSBQbGF5ZXIgQVBJIHRyXHUxRUYxYyB0aVx1MUVCRnAgdlx1MDBFMG8gaWZyYW1lIFx1MjUwMFx1MjUwMFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICgheXRJZCkgcmV0dXJuO1xuICAgIGxldCBkZXN0cm95ZWQgPSBmYWxzZTtcbiAgICBsZXQgcmV0cnlUaW1lciA9IG51bGw7XG4gICAgbGV0IGF0dGVtcHRzID0gMDtcblxuICAgIC8vIE5cdTFFQkZ1IHBsYXllciBcdTAxMTFcdTAwRTMgdFx1MUVEM24gdFx1MUVBMWkgdlx1MDBFMCBzXHUxRUI1biBzXHUwMEUwbmc6IGNodXlcdTFFQzNuIGJcdTAwRTBpIHRcdTFFRTljIHRoXHUwMEVDIHF1YSBsb2FkVmlkZW9CeUlkIChraFx1MDBGNG5nIHJlbG9hZCBET00vaWZyYW1lKVxuICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50ICYmIHl0UmVhZHlSZWYuY3VycmVudCAmJiB0eXBlb2YgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoY3VycmVudFl0SWRSZWYuY3VycmVudCAhPT0geXRJZCkge1xuICAgICAgICAgIGN1cnJlbnRZdElkUmVmLmN1cnJlbnQgPSB5dElkO1xuICAgICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSAwO1xuICAgICAgICAgIHNldER1cmF0aW9uKDApO1xuICAgICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgIGNvbnN0IHN0YXJ0U2VjID0gTnVtYmVyKHdhdGNoU3RhdGUucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCh7XG4gICAgICAgICAgICB2aWRlb0lkOiB5dElkLFxuICAgICAgICAgICAgc3RhcnRTZWNvbmRzOiBzdGFydFNlY1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdMXHUxRUQ3aSBsb2FkVmlkZW9CeUlkOicsIGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGN1cnJlbnRZdElkUmVmLmN1cnJlbnQgPSB5dElkO1xuICAgIGhhc1NlZWtlZEluaXRSZWYuY3VycmVudCA9IGZhbHNlO1xuXG4gICAgY29uc3Qga2hvaVRhb1BsYXllciA9ICgpID0+IHtcbiAgICAgIGlmIChkZXN0cm95ZWQpIHJldHVybjtcbiAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICBpZiAoIWVsKSB7XG4gICAgICAgIGlmIChhdHRlbXB0cysrIDwgMzApIHtcbiAgICAgICAgICByZXRyeVRpbWVyID0gc2V0VGltZW91dChraG9pVGFvUGxheWVyLCAxMDApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKCF3aW5kb3cuWVQgfHwgIXdpbmRvdy5ZVC5QbGF5ZXIpIHtcbiAgICAgICAgaWYgKGF0dGVtcHRzKysgPCAzMCkge1xuICAgICAgICAgIHJldHJ5VGltZXIgPSBzZXRUaW1lb3V0KGtob2lUYW9QbGF5ZXIsIDE1MCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50ID0gbmV3IHdpbmRvdy5ZVC5QbGF5ZXIoZWwsIHtcbiAgICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAgIG9uUmVhZHk6IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoZGVzdHJveWVkKSByZXR1cm47XG4gICAgICAgICAgICAgIHl0UmVhZHlSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgICAgICAgIHNldFl0UGxheWVyUmVhZHkodHJ1ZSk7XG5cbiAgICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldC5nZXREdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBldmVudC50YXJnZXQuZ2V0RHVyYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAoZCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSBkO1xuICAgICAgICAgICAgICAgICAgc2V0RHVyYXRpb24oZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gVFx1MDBFRG5oIHZcdTFFQ0IgdHJcdTAwRUQgdGhcdTFFRERpIGdpYW4gaGlcdTFFQzduIHRcdTFFQTFpIGNcdTFFRTdhIHBoXHUwMEYybmcgXHUwMTExXHUxRUMzIHNlZWsgbmdheSBsXHUwMEZBYyBraFx1MUVERmkgdFx1MUVBMW9cbiAgICAgICAgICAgICAgY29uc3Qgbm93TXMgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICBjb25zdCB1cGRhdGVUaW1lTXMgPSB3YXRjaFN0YXRlLnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyh3YXRjaFN0YXRlLnVwZGF0ZWRBdCkucmVwbGFjZSgnICcsICdUJykgKyAoU3RyaW5nKHdhdGNoU3RhdGUudXBkYXRlZEF0KS5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS5nZXRUaW1lKCkgOiBub3dNcztcbiAgICAgICAgICAgICAgY29uc3QgZWxhcHNlZFNlYyA9IE1hdGgubWF4KDAsIChub3dNcyAtIHVwZGF0ZVRpbWVNcykgLyAxMDAwKTtcbiAgICAgICAgICAgICAgbGV0IHRQb3MgPSBOdW1iZXIod2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgICAgICAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgICB0UG9zID0gTnVtYmVyKHdhdGNoU3RhdGUuYmFzZVBvc2l0aW9uU2Vjb25kcyAhPSBudWxsID8gd2F0Y2hTdGF0ZS5iYXNlUG9zaXRpb25TZWNvbmRzIDogd2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMpICsgKGVsYXBzZWRTZWMgKiAod2F0Y2hTdGF0ZS5wbGF5YmFja1JhdGUgfHwgMS4wKSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAodFBvcyA+IDAgJiYgZXZlbnQudGFyZ2V0LnNlZWtUbykge1xuICAgICAgICAgICAgICAgIGhhc1NlZWtlZEluaXRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdHJ5IHsgZXZlbnQudGFyZ2V0LnNlZWtUbyh0UG9zLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZyAmJiAoY2FuQ29udHJvbCB8fCBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQgfHwgaGFzSW50ZXJhY3RlZCkgJiYgZXZlbnQudGFyZ2V0LnBsYXlWaWRlbykge1xuICAgICAgICAgICAgICAgIHRyeSB7IGV2ZW50LnRhcmdldC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25TdGF0ZUNoYW5nZTogKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChldmVudC50YXJnZXQgJiYgZXZlbnQudGFyZ2V0LmdldER1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IGV2ZW50LnRhcmdldC5nZXREdXJhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChkID4gMCAmJiBkdXJhdGlvblJlZi5jdXJyZW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gZDtcbiAgICAgICAgICAgICAgICAgIHNldER1cmF0aW9uKGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIFZpZGVvIGtcdTFFQkZ0IHRoXHUwMEZBYzoga1x1MDBFRGNoIGhvXHUxRUExdCBjaHV5XHUxRUMzbiBiXHUwMEUwaSBuZ2F5IGxcdTFFQURwIHRcdTFFRTljXG4gICAgICAgICAgICAgIGlmIChldmVudC5kYXRhID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgIWlzU2tpcHBpbmdSZWYuY3VycmVudCAmJiAhaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnWVQgUGxheWVyIG9uU3RhdGVDaGFuZ2UgPT09IDAgKEVOREVEKSAtPiB0XHUxRUYxIFx1MDExMVx1MUVEOW5nIGNodXlcdTFFQzNuIHRpXHUxRUJGcCBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaScpO1xuICAgICAgICAgICAgICAgICAgaGFuaERvbmdRdWV1ZSgnc2tpcCcpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmICFkYW5nR3VpTGVuaFJlZi5jdXJyZW50ICYmICFpc1NlZWtpbmdSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1clBvcyA9IHR5cGVvZiBldmVudC50YXJnZXQ/LmdldEN1cnJlbnRUaW1lID09PSAnZnVuY3Rpb24nID8gZXZlbnQudGFyZ2V0LmdldEN1cnJlbnRUaW1lKCkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGEgPT09IDEgJiYgIXdhdGNoU3RhdGVSZWYuY3VycmVudC5wbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnWVQgUGxheWVyIG9uU3RhdGVDaGFuZ2UgPT09IDEgLT4gXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBQbGF5IGNcdTFFQTMgcGhcdTAwRjJuZycpO1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaFJlZi5jdXJyZW50Py4oJ3BsYXknLCBjdXJQb3MpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuZGF0YSA9PT0gMiAmJiB3YXRjaFN0YXRlUmVmLmN1cnJlbnQucGxheWluZykge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1lUIFBsYXllciBvblN0YXRlQ2hhbmdlID09PSAyIC0+IFx1MDExMVx1MUVEM25nIGJcdTFFRDkgUGF1c2UgY1x1MUVBMyBwaFx1MDBGMm5nJyk7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oUmVmLmN1cnJlbnQ/LigncGF1c2UnLCBjdXJQb3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBZb3VUdWJlIFBsYXllciBBUEk6JywgZXJyKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbmFwWW91VHViZUlmcmFtZUFwaSgoKSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KGtob2lUYW9QbGF5ZXIsIDEwMCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgZGVzdHJveWVkID0gdHJ1ZTtcbiAgICAgIGlmIChyZXRyeVRpbWVyKSBjbGVhclRpbWVvdXQocmV0cnlUaW1lcik7XG4gICAgfTtcbiAgfSwgW3l0SWQsIHBob25nLmlkLCBjYW5Db250cm9sXSk7XG5cbiAgLy8gXHUwMEMxcCBkXHUxRUU1bmcgdHJcdTFFQTFuZyB0aFx1MDBFMWkgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSB0XHUxRUVCIHNlcnZlciAoY2hcdTFFRDFuZyBnaVx1MUVBRHQgY2hcdTFFQURwIGNoXHUxRUREbiBjaG8gY1x1MUVBMyBIb3N0IGxcdTFFQUJuIE5nXHUwMUIwXHUxRUREaSB4ZW0pXG4gIGNvbnN0IGFwRHVuZ0RvbmdCbyA9IChzdCwgY3RybCwgcHJvdikgPT4ge1xuICAgIGlmICghc3QpIHJldHVybjtcbiAgICBjb25zdCBub3dNcyA9IERhdGUubm93KCk7XG4gICAgY29uc3QgdXBkYXRlVGltZU1zID0gc3QudXBkYXRlZEF0ID8gbmV3IERhdGUoU3RyaW5nKHN0LnVwZGF0ZWRBdCkucmVwbGFjZSgnICcsICdUJykgKyAoU3RyaW5nKHN0LnVwZGF0ZWRBdCkuaW5jbHVkZXMoJ1QnKSA/ICcnIDogJ1onKSkuZ2V0VGltZSgpIDogbm93TXM7XG4gICAgY29uc3QgZWxhcHNlZFNlYyA9IE1hdGgubWF4KDAsIChub3dNcyAtIHVwZGF0ZVRpbWVNcykgLyAxMDAwKTtcblxuICAgIGxldCB0YXJnZXRQb3MgPSBOdW1iZXIoc3QucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICB0YXJnZXRQb3MgPSBOdW1iZXIoc3QuYmFzZVBvc2l0aW9uU2Vjb25kcyAhPSBudWxsID8gc3QuYmFzZVBvc2l0aW9uU2Vjb25kcyA6IHN0LnBvc2l0aW9uU2Vjb25kcykgKyAoZWxhcHNlZFNlYyAqIChzdC5wbGF5YmFja1JhdGUgfHwgMS4wKSk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwXHUyNTAwIE5HVVlcdTAwQ0FOIFRcdTFFQUVDIFZcdTAwQzBORzogQ0hcdTFFRTYgUEhcdTAwRDJORyBMXHUwMEMwIE5HVVx1MUVEMk4gUEhcdTAwQzFUIChTT1VSQ0UgT0YgVFJVVEgpIFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIC8vIFZpZGVvIGNcdTFFRTdhIENoXHUxRUU3IHBoXHUwMEYybmcgXHUwMTExYW5nIHBoXHUwMEUxdCB0XHUxRUYxIG5oaVx1MDBFQW4gbVx1MDFCMFx1MUVFM3QgbVx1MDBFMCA2MGZwcyB0clx1MDBFQW4gWW91VHViZS5cbiAgICAvLyBUdXlcdTFFQzd0IFx1MDExMVx1MUVEMWkgS0hcdTAwRDRORyBnXHUxRUNEaSBzZWVrVG8gaGF5IFx1MDBFOXAgcGxheVZpZGVvIGxcdTAwRTBtIGdpXHUxRUFEdCBsXHUwMEY5aS9raFx1MUVGMW5nIGhcdTAwRUNuaCB2aWRlbyBjXHUxRUU3YSBDaFx1MUVFNyBwaFx1MDBGMm5nIVxuICAgIGlmIChjdHJsKSB7XG4gICAgICBpZiAoaXNTZWVraW5nUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgIGlmIChwcm92ID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudD8uZ2V0Q3VycmVudFRpbWUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBjdXIgPSB5dFBsYXllclJlZi5jdXJyZW50LmdldEN1cnJlbnRUaW1lKCk7XG4gICAgICAgICAgaWYgKGN1ciA+IDAgJiYgIWlzTmFOKGN1cikpIHNldExvY2FsVGltZShNYXRoLmZsb29yKGN1cikpO1xuICAgICAgICB9IGNhdGNoIHt9XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFx1MDExMFx1MUVEMEkgVlx1MUVEQUkgSFx1MUVDQ0MgU0lOSCAvIE5HXHUwMUFGXHUxRURDSSBYRU0gVFJPTkcgUEhcdTAwRDJORyAoWSBDSEFORyBDSFx1MUVFNiBQSFx1MDBEMk5HKSBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBpc05ld1JldmlzaW9uID0gbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ICE9PSBudWxsICYmIHN0LnJldmlzaW9uICE9PSBsYXN0QXBwbGllZFJldmlzaW9uUmVmLmN1cnJlbnQ7XG4gICAgaWYgKGxhc3RBcHBsaWVkUmV2aXNpb25SZWYuY3VycmVudCA9PT0gbnVsbCkge1xuICAgICAgbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ID0gc3QucmV2aXNpb247XG4gICAgfVxuXG4gICAgaWYgKHByb3YgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHYgPSB2aWRlb1JlZi5jdXJyZW50O1xuICAgICAgaWYgKCFoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgJiYgdGFyZ2V0UG9zID4gMCkge1xuICAgICAgICBoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICB2LmN1cnJlbnRUaW1lID0gdGFyZ2V0UG9zO1xuICAgICAgfVxuICAgICAgaWYgKGlzTmV3UmV2aXNpb24pIHtcbiAgICAgICAgbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ID0gc3QucmV2aXNpb247XG4gICAgICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICAgICAgdi5jdXJyZW50VGltZSA9IHRhcmdldFBvcztcbiAgICAgICAgICBpZiAoaGFzSW50ZXJhY3RlZCB8fCBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpIHYucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcih0YXJnZXRQb3MpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2LnBhdXNlKCk7XG4gICAgICAgICAgdi5jdXJyZW50VGltZSA9IE51bWJlcihzdC5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IoTnVtYmVyKHN0LnBvc2l0aW9uU2Vjb25kcyB8fCAwKSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc2V0TG9jYWxUaW1lKE1hdGgubWF4KDAsIE1hdGguZmxvb3IodGFyZ2V0UG9zKSkpO1xuICAgICAgaWYgKHN0LnBsYXlpbmcpIHtcbiAgICAgICAgY29uc3QgZHJpZnQgPSBNYXRoLmFicyh2LmN1cnJlbnRUaW1lIC0gdGFyZ2V0UG9zKTtcbiAgICAgICAgaWYgKGRyaWZ0ID4gMy4wKSB7XG4gICAgICAgICAgdi5jdXJyZW50VGltZSA9IHRhcmdldFBvcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodi5wYXVzZWQgJiYgKGhhc0ludGVyYWN0ZWQgfHwgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSkge1xuICAgICAgICAgIHYucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCF2LnBhdXNlZCkgdi5wYXVzZSgpO1xuICAgICAgICBjb25zdCBkcmlmdCA9IE1hdGguYWJzKHYuY3VycmVudFRpbWUgLSBzdC5wb3NpdGlvblNlY29uZHMpO1xuICAgICAgICBpZiAoZHJpZnQgPiAyLjApIHtcbiAgICAgICAgICB2LmN1cnJlbnRUaW1lID0gc3QucG9zaXRpb25TZWNvbmRzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcm92ID09PSAnWU9VVFVCRScpIHtcbiAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgY29uc3QgcCA9IHl0UGxheWVyUmVmLmN1cnJlbnQ7XG4gICAgICBsZXQgY3VyID0gbnVsbDtcbiAgICAgIGxldCBwcyA9IG51bGw7XG4gICAgICBpZiAocCAmJiB0eXBlb2YgcC5nZXRDdXJyZW50VGltZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0cnkgeyBjdXIgPSBwLmdldEN1cnJlbnRUaW1lKCk7IH0gY2F0Y2gge31cbiAgICAgIH1cbiAgICAgIGlmIChwICYmIHR5cGVvZiBwLmdldFBsYXllclN0YXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRyeSB7IHBzID0gcC5nZXRQbGF5ZXJTdGF0ZSgpOyB9IGNhdGNoIHt9XG4gICAgICB9XG5cbiAgICAgIC8vIEluaXRpYWwgc2VlayBuXHUxRUJGdSBuZ1x1MDFCMFx1MUVERGkgeGVtIGNoXHUwMUIwYSB0XHUxRUVCbmcgdHVhIFx1MDExMVx1MUVCRm4gbVx1MUVEMWMgY1x1MUVFN2EgY2hcdTFFRTcgcGhcdTAwRjJuZ1xuICAgICAgaWYgKCFoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgJiYgdGFyZ2V0UG9zID4gMCkge1xuICAgICAgICBoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICBpZiAocD8uc2Vla1RvKSB7IHRyeSB7IHAuc2Vla1RvKHRhcmdldFBvcywgdHJ1ZSk7IH0gY2F0Y2gge30gfVxuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFt0YXJnZXRQb3MsIHRydWVdIH0pLCAnKicpO1xuICAgICAgfVxuXG4gICAgICAvLyBLaGkgcGhcdTAwRTF0IGhpXHUxRUM3biB0aGFvIHRcdTAwRTFjIG1cdTFFREJpIHRcdTFFRUIgY2hcdTFFRTcgcGhcdTAwRjJuZyAoUmV2aXNpb24gdGhheSBcdTAxMTFcdTFFRDVpIGRvIGNoXHUxRUU3IHBoXHUwMEYybmcgYlx1MUVBNW0gVlx1MDBGOW5nIDEgaG9cdTFFQjdjIFZcdTAwRjluZyAyKVxuICAgICAgaWYgKGlzTmV3UmV2aXNpb24pIHtcbiAgICAgICAgbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ID0gc3QucmV2aXNpb247XG4gICAgICAgIGlmICghc3QucGxheWluZykge1xuICAgICAgICAgIC8vIENoXHUxRUU3IHBoXHUwMEYybmcgYlx1MUVBNW0gVFx1MUVBMW0gZFx1MUVFQm5nOiBMXHUxRUFEcCB0XHUxRUU5YyB0XHUxRUExbSBkXHUxRUVCbmcgdlx1MDBFMCB0dWEgdlx1MUVDMSBcdTAxMTFcdTAwRkFuZyB2XHUxRUNCIHRyXHUwMEVEIGNoXHUxRUU3IHBoXHUwMEYybmcgXHUwMTExXHUwMEUzIGRcdTFFRUJuZ1xuICAgICAgICAgIGlmIChwPy5wYXVzZVZpZGVvKSB7IHRyeSB7IHAucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKCd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwicGF1c2VWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgICAgICBjb25zdCBwU2VjID0gTnVtYmVyKHN0LnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICAgICAgICBpZiAocD8uc2Vla1RvKSB7IHRyeSB7IHAuc2Vla1RvKHBTZWMsIHRydWUpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFtwU2VjLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihwU2VjKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ2hcdTFFRTcgcGhcdTAwRjJuZyBiXHUxRUE1bSBQaFx1MDBFMXQgdGlcdTFFQkZwIGhvXHUxRUI3YyB2XHUxRUVCYSBUdWEgdGhcdTFFRERpIGdpYW46IExcdTFFQURwIHRcdTFFRTljIHR1YSB2XHUwMEUwIHBoXHUwMEUxdCB5IGNoYW5nIGNoXHUxRUU3IHBoXHUwMEYybmdcbiAgICAgICAgICBpZiAocD8uc2Vla1RvKSB7IHRyeSB7IHAuc2Vla1RvKHRhcmdldFBvcywgdHJ1ZSk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3RhcmdldFBvcywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICAgICAgaWYgKGhhc0ludGVyYWN0ZWQgfHwgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICBpZiAocD8ucGxheVZpZGVvKSB7IHRyeSB7IHAucGxheVZpZGVvKCk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZSgne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBsYXlWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IodGFyZ2V0UG9zKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBHaVx1MUVFRiBuaFx1MUVDQnAgcGhcdTAwRTF0IFx1MUVENW4gXHUwMTExXHUxRUNCbmggdHJvbmcgY1x1MDBFMWMgY2h1IGtcdTFFRjMgcG9sbCBcdTAxMTFcdTFFQ0JuaCBrXHUxRUYzXG4gICAgICBzZXRMb2NhbFRpbWUoTWF0aC5tYXgoMCwgTWF0aC5mbG9vcih0YXJnZXRQb3MpKSk7XG5cbiAgICAgIGlmIChjdXIgIT09IG51bGwgJiYgIWlzTmFOKGN1cikpIHtcbiAgICAgICAgY29uc3QgZHJpZnQgPSBNYXRoLmFicyhjdXIgLSB0YXJnZXRQb3MpO1xuICAgICAgICBpZiAoc3QucGxheWluZykge1xuICAgICAgICAgIGlmIChkcmlmdCA+IDMuNSkge1xuICAgICAgICAgICAgaWYgKHA/LnNlZWtUbykgeyB0cnkgeyBwLnNlZWtUbyh0YXJnZXRQb3MsIHRydWUpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3RhcmdldFBvcywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgocHMgPT09IDIgfHwgcHMgPT09IDUpICYmIChoYXNJbnRlcmFjdGVkIHx8IGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCkpIHtcbiAgICAgICAgICAgIGlmIChwPy5wbGF5VmlkZW8pIHsgdHJ5IHsgcC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKCd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwicGxheVZpZGVvXCIsXCJhcmdzXCI6XCJcIn0nLCAnKicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBLaGkgc2VydmVyIGJcdTAwRTFvIHBhdXNlLCBsdVx1MDBGNG4gZ1x1MUVFRGkgcGF1c2Ugblx1MUVCRnUgcGxheWVyIFx1MDExMWFuZyBwaFx1MDBFMXRcbiAgICAgICAgICBpZiAocHMgPT09IDEgfHwgcHMgPT09IDMpIHtcbiAgICAgICAgICAgIGlmIChwPy5wYXVzZVZpZGVvKSB7IHRyeSB7IHAucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoJ3tcImV2ZW50XCI6XCJjb21tYW5kXCIsXCJmdW5jXCI6XCJwYXVzZVZpZGVvXCIsXCJhcmdzXCI6XCJcIn0nLCAnKicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZHJpZnQgPiAxLjgpIHtcbiAgICAgICAgICAgIGlmIChwPy5zZWVrVG8pIHsgdHJ5IHsgcC5zZWVrVG8oc3QucG9zaXRpb25TZWNvbmRzLCB0cnVlKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFtzdC5wb3NpdGlvblNlY29uZHMsIHRydWVdIH0pLCAnKicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHN0LnBsYXlpbmcgJiYgKGhhc0ludGVyYWN0ZWQgfHwgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSAmJiBwcyAhPT0gMSkge1xuICAgICAgICAgIGlmIChwPy5wbGF5VmlkZW8pIHsgdHJ5IHsgcC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZSgne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBsYXlWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgICAgfSBlbHNlIGlmICghc3QucGxheWluZykge1xuICAgICAgICAgIGlmIChwPy5wYXVzZVZpZGVvKSB7IHRyeSB7IHAucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKCd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwicGF1c2VWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBQb2xsIHRyXHUxRUExbmcgdGhcdTAwRTFpIG1cdTAwRTF5IGNoXHUxRUU3IG1cdTFFRDdpIDEuMnMgXHUwMTExXHUxRUMzIG5nXHUwMUIwXHUxRUREaSB0aGFtIGdpYSBiXHUxRUFGdCBrXHUxRUNCcCB0XHUxRUU5YyB0aFx1MDBFQyB0aGFvIHRcdTAwRTFjIGNcdTFFRTdhIGNoXHUxRUU3IHBoXHUwMEYybmdcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaFdhdGNoID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctd2F0Y2g/cGhvbmdJZD0ke3Bob25nLmlkfWApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKCFhY3RpdmUpIHJldHVybjtcbiAgICAgICAgaWYgKGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgICAgc2V0Q2FuQ29udHJvbChCb29sZWFuKGQuY2FuQ29udHJvbCkpO1xuICAgICAgICAgIGlmIChkLmNhcHMpIHNldFdhdGNoQ2FwcyhkLmNhcHMpO1xuICAgICAgICAgIHNldFByb3ZpZGVyKGQucHJvdmlkZXIgfHwgJ1VOU1VQUE9SVEVEJyk7XG4gICAgICAgICAgaWYgKGQucGhvbmc/LnZpZGVvVXJsICYmIGQucGhvbmcudmlkZW9VcmwgIT09IGFjdGl2ZVZpZGVvVXJsKSB7XG4gICAgICAgICAgICBzZXRBY3RpdmVWaWRlb1VybChkLnBob25nLnZpZGVvVXJsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXBEdW5nRG9uZ0JvKGQuc3RhdGUsIEJvb2xlYW4oZC5jYW5Db250cm9sKSwgZC5wcm92aWRlciB8fCAnVU5TVVBQT1JURUQnKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7IH1cbiAgICB9O1xuXG4gICAgZmV0Y2hXYXRjaCgpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaShmZXRjaFdhdGNoKSwgMTIwMCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgfTtcbiAgfSwgW3Bob25nLmlkLCBoYXNJbnRlcmFjdGVkXSk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFRcdTFFQTZORyAzICYgNDogUG9zaXRpb25hbCBXYXRjaGRvZyAmIENcdTFFQURwIG5oXHUxRUFEdCBsb2NhbFRpbWUgbVx1MDFCMFx1MUVFM3QgbVx1MDBFMCBcdTI1MDBcdTI1MDBcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXdhdGNoU3RhdGUucGxheWluZykgcmV0dXJuO1xuICAgIGNvbnN0IHRpY2sgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAoaXNTZWVraW5nUmVmLmN1cnJlbnQpIHJldHVybjtcblxuICAgICAgbGV0IGN1clRpbWUgPSBudWxsO1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHAgPSB5dFBsYXllclJlZi5jdXJyZW50O1xuICAgICAgICAgIGlmIChwLmdldER1cmF0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBkID0gcC5nZXREdXJhdGlvbigpO1xuICAgICAgICAgICAgaWYgKGQgPiAwKSB7XG4gICAgICAgICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSBkO1xuICAgICAgICAgICAgICBpZiAoZHVyYXRpb24gPT09IDApIHNldER1cmF0aW9uKGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocC5nZXRDdXJyZW50VGltZSkge1xuICAgICAgICAgICAgY29uc3QgY3VyID0gcC5nZXRDdXJyZW50VGltZSgpO1xuICAgICAgICAgICAgaWYgKGN1ciAhPT0gdW5kZWZpbmVkICYmIGN1ciAhPT0gbnVsbCAmJiAhaXNOYU4oY3VyKSkge1xuICAgICAgICAgICAgICBjdXJUaW1lID0gY3VyO1xuICAgICAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjdXIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHAuZ2V0UGxheWVyU3RhdGUgJiYgcC5nZXRQbGF5ZXJTdGF0ZSgpID09PSAwKSB7XG4gICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiAhaXNTa2lwcGluZ1JlZi5jdXJyZW50ICYmICFoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1BsYXllclN0YXRlID09PSAwIC0+IHRcdTFFRjEgXHUwMTExXHUxRUQ5bmcgY2h1eVx1MUVDM24gdGlcdTFFQkZwIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpJyk7XG4gICAgICAgICAgICAgIGhhbmhEb25nUXVldWUoJ3NraXAnKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgfVxuXG4gICAgICAvLyBHaVx1MDBFMW0gc1x1MDBFMXQgdlx1MUVDQiB0clx1MDBFRDogblx1MUVCRnUgdmlkZW8gXHUwMTExXHUwMEUzIHBoXHUwMEUxdCBcdTAxMTFcdTFFQkZuIGdpXHUwMEUyeSBjdVx1MUVEMWkgY1x1MDBGOW5nIGhvXHUxRUI3YyBxdVx1MDBFMSBkdXJhdGlvblxuICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgIGNvbnN0IGN1cnJlbnRQb3MgPSBjdXJUaW1lICE9PSBudWxsID8gY3VyVGltZSA6IGxvY2FsVGltZTtcbiAgICAgIGlmIChtYXhEdXIgPiA1ICYmIChjdXJyZW50UG9zID49IG1heER1ciAtIDEuMiB8fCBsb2NhbFRpbWUgPj0gbWF4RHVyKSkge1xuICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiAhaXNTa2lwcGluZ1JlZi5jdXJyZW50ICYmICFoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgUG9zaXRpb25hbCBXYXRjaGRvZzogY3VycmVudFBvcyAoJHtjdXJyZW50UG9zLnRvRml4ZWQoMSl9cykgPj0gZHVyYXRpb24gKCR7bWF4RHVyfXMpIC0+IHRcdTFFRjEgXHUwMTExXHUxRUQ5bmcgY2h1eVx1MUVDM24gdGlcdTFFQkZwYCk7XG4gICAgICAgICAgaGFuaERvbmdRdWV1ZSgnc2tpcCcpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2FuQ29udHJvbCAmJiBjdXJUaW1lICE9PSBudWxsICYmIGN1clRpbWUgPiAwICYmICFkYW5nR3VpTGVuaFJlZi5jdXJyZW50ICYmICFpc1NlZWtpbmdSZWYuY3VycmVudCkge1xuICAgICAgICBjb25zdCBub3dNcyA9IERhdGUubm93KCk7XG4gICAgICAgIGlmICghbGFzdEhvc3RTeW5jVGltZVJlZi5jdXJyZW50KSBsYXN0SG9zdFN5bmNUaW1lUmVmLmN1cnJlbnQgPSBub3dNcztcbiAgICAgICAgY29uc3QgdXBkYXRlVGltZU1zID0gd2F0Y2hTdGF0ZS51cGRhdGVkQXQgPyBuZXcgRGF0ZShTdHJpbmcod2F0Y2hTdGF0ZS51cGRhdGVkQXQpLnJlcGxhY2UoJyAnLCAnVCcpICsgKFN0cmluZyh3YXRjaFN0YXRlLnVwZGF0ZWRBdCkuaW5jbHVkZXMoJ1QnKSA/ICcnIDogJ1onKSkuZ2V0VGltZSgpIDogbm93TXM7XG4gICAgICAgIGNvbnN0IGVsYXBzZWRTZWMgPSBNYXRoLm1heCgwLCAobm93TXMgLSB1cGRhdGVUaW1lTXMpIC8gMTAwMCk7XG4gICAgICAgIGNvbnN0IGV4cGVjdGVkU2VydmVyUG9zID0gTnVtYmVyKHdhdGNoU3RhdGUuYmFzZVBvc2l0aW9uU2Vjb25kcyAhPSBudWxsID8gd2F0Y2hTdGF0ZS5iYXNlUG9zaXRpb25TZWNvbmRzIDogd2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMpICsgKGVsYXBzZWRTZWMgKiAod2F0Y2hTdGF0ZS5wbGF5YmFja1JhdGUgfHwgMS4wKSk7XG4gICAgICAgIGNvbnN0IGhvc3REcmlmdCA9IE1hdGguYWJzKGN1clRpbWUgLSBleHBlY3RlZFNlcnZlclBvcyk7XG5cbiAgICAgICAgaWYgKGhvc3REcmlmdCA+IDMuMCAmJiAobm93TXMgLSBsYXN0SG9zdFN5bmNUaW1lUmVmLmN1cnJlbnQgPiA0MDAwKSkge1xuICAgICAgICAgIGxhc3RIb3N0U3luY1RpbWVSZWYuY3VycmVudCA9IG5vd01zO1xuICAgICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBjdXJUaW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY3VyVGltZSA9PT0gbnVsbCkge1xuICAgICAgICBzZXRMb2NhbFRpbWUodCA9PiAobWF4RHVyID4gMCA/IE1hdGgubWluKHQgKyAxLCBNYXRoLmZsb29yKG1heER1cikpIDogdCArIDEpKTtcbiAgICAgIH1cbiAgICB9LCAxMDAwKTtcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbCh0aWNrKTtcbiAgfSwgW3dhdGNoU3RhdGUucGxheWluZywgcHJvdmlkZXIsIGR1cmF0aW9uLCBsb2NhbFRpbWUsIGNhbkNvbnRyb2xdKTtcblxuICAvLyBHXHUxRUVEaSBsXHUxRUM3bmggXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiAoUGxheSAvIFBhdXNlIC8gU2VlaylcbiAgY29uc3QgZ3VpTGVuaCA9IGFzeW5jIChhY3Rpb24sIGN1c3RvbVBvcykgPT4ge1xuICAgIGlmIChkYW5nR3VpTGVuaFJlZi5jdXJyZW50KSByZXR1cm47XG4gICAgc2V0RGFuZ0d1aUxlbmgodHJ1ZSk7XG4gICAgZGFuZ0d1aUxlbmhSZWYuY3VycmVudCA9IHRydWU7XG4gICAgc2V0TG9pKCcnKTtcblxuICAgIGxldCBwb3MgPSBjdXN0b21Qb3M7XG4gICAgaWYgKHBvcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgcG9zID0gdmlkZW9SZWYuY3VycmVudC5jdXJyZW50VGltZTtcbiAgICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5nZXRDdXJyZW50VGltZSkge1xuICAgICAgICBwb3MgPSB5dFBsYXllclJlZi5jdXJyZW50LmdldEN1cnJlbnRUaW1lKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwb3MgPSBsb2NhbFRpbWU7XG4gICAgICB9XG4gICAgfVxuICAgIHBvcyA9IE1hdGgubWF4KDAsIE51bWJlcigocG9zIHx8IDApLnRvRml4ZWQoMikpKTtcblxuICAgIC8vIENcdTFFQURwIG5oXHUxRUFEdCBsXHUxRUExYyBxdWFuIHRyXHUwMEVBbiBsb2NhbCBwbGF5ZXJcbiAgICBpZiAoYWN0aW9uID09PSAncGxheScpIHtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkgdmlkZW9SZWYuY3VycmVudC5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8ucGxheVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKCd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwicGxheVZpZGVvXCIsXCJhcmdzXCI6XCJcIn0nLCAnKicpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAncGF1c2UnKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQucGF1c2UoKTtcbiAgICAgIGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBhdXNlVmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBhdXNlVmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKCd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwicGF1c2VWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ3NlZWsnKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSBwb3M7XG4gICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5zZWVrVG8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnNlZWtUbyhwb3MsIHRydWUpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3BvcywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXdhdGNoJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICBhY3Rpb24sXG4gICAgICAgICAgcG9zaXRpb246IHBvcyxcbiAgICAgICAgICBleHBlY3RlZFJldmlzaW9uOiB3YXRjaFN0YXRlLnJldmlzaW9uLFxuICAgICAgICAgIHBsYXliYWNrUmF0ZTogd2F0Y2hTdGF0ZS5wbGF5YmFja1JhdGUgfHwgMS4wXG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICBsYXN0QXBwbGllZFJldmlzaW9uUmVmLmN1cnJlbnQgPSBkLnN0YXRlLnJldmlzaW9uO1xuICAgICAgICBzZXRXYXRjaFN0YXRlKGQuc3RhdGUpO1xuICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihkLnN0YXRlLnBvc2l0aW9uU2Vjb25kcyB8fCBwb3MpKTtcbiAgICAgIH0gZWxzZSBpZiAoZC5jb25mbGljdCAmJiBkLnN0YXRlKSB7XG4gICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIGFwRHVuZ0RvbmdCbyhkLnN0YXRlLCBjYW5Db250cm9sLCBwcm92aWRlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRMb2koZC5sb2kgfHwgJ0xcdTFFRDdpIGNcdTFFQURwIG5oXHUxRUFEdCBwaFx1MDBFMXQgdmlkZW8uJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRMb2koJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXREYW5nR3VpTGVuaChmYWxzZSk7XG4gICAgICBkYW5nR3VpTGVuaFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgfVxuICB9O1xuXG4gIGd1aUxlbmhSZWYuY3VycmVudCA9IGd1aUxlbmg7XG5cbiAgLy8gXHUwMTEwXHUxRUQzbmcgYlx1MUVEOSB2XHUxRUNCIHRyXHUwMEVEIHZpZGVvIGhpXHUxRUM3biB0XHUxRUExaSByYSBuZ29cdTAwRTBpIFx1MDExMVx1MUVDMyBjaGF0IGdcdTFFQUZuIHRpbWVzdGFtcFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh2aWRlb1RpbWVSZWYpIHZpZGVvVGltZVJlZi5jdXJyZW50ID0gbG9jYWxUaW1lO1xuICB9LCBbbG9jYWxUaW1lLCB2aWRlb1RpbWVSZWZdKTtcblxuXG5cbiAgLy8gTmhcdTFFQURuIHlcdTAwRUF1IGNcdTFFQTd1IHR1YSB0XHUxRUVCIFN0dWR5RG9jayAoYlx1MUVBNW0gbVx1MUVEMWMgdmlkZW8gdHJvbmcgY2hhdC9naGkgY2hcdTAwRkEpLlxuICAvLyBDXHUwMEYzIHF1eVx1MUVDMW4gXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiBcdTIxOTIgcGhcdTAwRTF0IGxcdTFFQzduaCBzZWVrIGNodW5nOyBraFx1MDBGNG5nIFx1MjE5MiBjaFx1MUVDOSB0dWEgY1x1MUVFNWMgYlx1MUVEOSBwbGF5ZXIgY1x1MUVFN2EgbVx1MDBFQ25oLlxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IG9uU2Vla1JlcSA9IChlKSA9PiB7XG4gICAgICBpZiAoZS5kZXRhaWw/LnBob25nSWQgJiYgU3RyaW5nKGUuZGV0YWlsLnBob25nSWQpICE9PSBTdHJpbmcocGhvbmc/LmlkKSkgcmV0dXJuO1xuICAgICAgY29uc3Qgc2VjID0gTWF0aC5tYXgoMCwgTnVtYmVyKGUuZGV0YWlsPy5zZWMpIHx8IDApO1xuXG4gICAgICBpZiAoIWhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCkge1xuICAgICAgICBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICBzZXRIYXNJbnRlcmFjdGVkKHRydWUpO1xuICAgICAgfVxuXG4gICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihzZWMpKTtcblxuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICAgIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSBzZWM7XG4gICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnNlZWtUbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQuc2Vla1RvKHNlYywgdHJ1ZSk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbc2VjLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNhbkNvbnRyb2wpIHtcbiAgICAgICAgZ3VpTGVuaCgnc2VlaycsIHNlYyk7XG4gICAgICB9XG4gICAgfTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc3Itc2VlaycsIG9uU2Vla1JlcSk7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdzci1zZWVrJywgb25TZWVrUmVxKTtcbiAgfSwgW3Bob25nPy5pZCwgY2FuQ29udHJvbCwgcHJvdmlkZXIsIHdhdGNoU3RhdGU/LnJldmlzaW9uXSk7XG5cbiAgY29uc3QgaGFuZGxlU3RhcnRWaWV3aW5nID0gKCkgPT4ge1xuICAgIGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgc2V0SGFzSW50ZXJhY3RlZCh0cnVlKTtcblxuICAgIGNvbnN0IG5vd01zID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCB1cGRhdGVUaW1lTXMgPSB3YXRjaFN0YXRlLnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyh3YXRjaFN0YXRlLnVwZGF0ZWRBdCkucmVwbGFjZSgnICcsICdUJykgKyAoU3RyaW5nKHdhdGNoU3RhdGUudXBkYXRlZEF0KS5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS5nZXRUaW1lKCkgOiBub3dNcztcbiAgICBjb25zdCBlbGFwc2VkU2VjID0gTWF0aC5tYXgoMCwgKG5vd01zIC0gdXBkYXRlVGltZU1zKSAvIDEwMDApO1xuICAgIGxldCB0YXJnZXRQb3MgPSBOdW1iZXIod2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgaWYgKHdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgdGFyZ2V0UG9zID0gTnVtYmVyKHdhdGNoU3RhdGUuYmFzZVBvc2l0aW9uU2Vjb25kcyAhPSBudWxsID8gd2F0Y2hTdGF0ZS5iYXNlUG9zaXRpb25TZWNvbmRzIDogd2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMpICsgKGVsYXBzZWRTZWMgKiAod2F0Y2hTdGF0ZS5wbGF5YmFja1JhdGUgfHwgMS4wKSk7XG4gICAgfVxuICAgIHRhcmdldFBvcyA9IE1hdGgubWF4KDAsIE51bWJlcih0YXJnZXRQb3MudG9GaXhlZCgyKSkpO1xuXG4gICAgaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcih0YXJnZXRQb3MpKTtcblxuICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgY29uc3QgdiA9IHZpZGVvUmVmLmN1cnJlbnQ7XG4gICAgICBpZiAodGFyZ2V0UG9zID4gMCkgdi5jdXJyZW50VGltZSA9IHRhcmdldFBvcztcbiAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgdi5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdi5wYXVzZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICBpZiAodGFyZ2V0UG9zID4gMCkge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8uc2Vla1RvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8odGFyZ2V0UG9zLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3RhcmdldFBvcywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICB9XG4gICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wbGF5VmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZSgne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBsYXlWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wYXVzZVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wYXVzZVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKCd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwicGF1c2VWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTQgbWluLXctMCB3LWZ1bGxcIj5cbiAgICAgIHsvKiBLaHVuZyBwaFx1MDBFMXQgdmlkZW8gY2hcdTAwRURuaCBcdTIwMTQga2h1bmcgbmVvbiBtXHUxRUREIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgaFx1MUVDNyBnYW1lIGFyZW5hICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSB3LWZ1bGwgYXNwZWN0LXZpZGVvIGJnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzA1MDcwYl0gdG8tYmxhY2sgcm91bmRlZC0yeGwgb3ZlcmZsb3ctaGlkZGVuIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzE1IHJpbmctMSByaW5nLXdoaXRlLzUgc2hhZG93LVswXzBfNjBweF9yZ2JhKDAsMjQyLDI1NCwwLjA3KSwwXzMwcHhfNjBweF8tMTVweF9yZ2JhKDAsMCwwLDAuNyldXCI+XG4gICAgICAgIHsvKiBPdmVybGF5IEF1dG9wbGF5IC8gR2VzdHVyZSBjaG8gbmdcdTAxQjBcdTFFRERpIHhlbSAqL31cbiAgICAgICAgeyFoYXNJbnRlcmFjdGVkICYmICFjYW5Db250cm9sICYmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnIHx8IHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JykgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgaW5zZXQtMCB6LTIwIGJnLWJsYWNrLzc1IGJhY2tkcm9wLWJsdXItc20gZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00IHRleHQtY2VudGVyIGFuaW1hdGUtZmFkZUluXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTQgaC0xNCByb3VuZGVkLWZ1bGwgYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtMnhsIG1iLTMgc2hhZG93LVswXzBfMjVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYW5pbWF0ZS1wdWxzZVwiPlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGQUNcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtd2hpdGUgbWItMVwiPlhlbSBDaHVuZyBDXHUwMEY5bmcgUGhcdTAwRjJuZzwvcD5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS0zMDAgbWF4LXcteHMgbWItNFwiPlxuICAgICAgICAgICAgICBCXHUxRUE1bSBuXHUwMEZBdCBiXHUwMEVBbiBkXHUwMUIwXHUxRURCaSBcdTAxMTFcdTFFQzMgY1x1MUVBNXAgcXV5XHUxRUMxbiBcdTAwRTJtIHRoYW5oIHZcdTAwRTAgY1x1MDBGOW5nIHRoZW8gZFx1MDBGNWkgdGltZWxpbmUgdlx1MUVEQmkgY2hcdTFFRTcgcGhcdTAwRjJuZy5cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJidG4tdmlld2VyLXN0YXJ0LXdhdGNoXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVN0YXJ0Vmlld2luZ31cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNSBweS0yLjUgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjM0I4MkY2XSB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC14cyBzaGFkb3ctbGcgaG92ZXI6b3BhY2l0eS05MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNUI2PC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5CXHUxRUFGdCBcdTAxMTFcdTFFQTd1IHhlbSBjXHUwMEY5bmcgcGhcdTAwRjJuZzwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBWaWRlbyBlbGVtZW50cyB0aGVvIHByb3ZpZGVyICovfVxuICAgICAgICB7eXRJZCA/IChcbiAgICAgICAgICA8ZGl2IGtleT17YHl0LXdyYXAtJHtwaG9uZy5pZH1gfSBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIHJlbGF0aXZlIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLWJsYWNrXCI+XG4gICAgICAgICAgICA8aWZyYW1lXG4gICAgICAgICAgICAgIGlkPXt5dENvbnRhaW5lcklkfVxuICAgICAgICAgICAgICBrZXk9e2B5dC1mcmFtZS0ke3Bob25nLmlkfWB9XG4gICAgICAgICAgICAgIHNyYz17YGh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkLyR7eXRJZH0/ZW5hYmxlanNhcGk9MSZvcmlnaW49JHtlbmNvZGVVUklDb21wb25lbnQodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cubG9jYXRpb24ub3JpZ2luIDogJycpfSZ3aWRnZXRfcmVmZXJyZXI9JHtlbmNvZGVVUklDb21wb25lbnQodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cubG9jYXRpb24uaHJlZiA6ICcnKX0mcmVsPTAmbW9kZXN0YnJhbmRpbmc9MSZwbGF5c2lubGluZT0xYH1cbiAgICAgICAgICAgICAgdGl0bGU9e3Bob25nLnRlbiB8fCAnWW91VHViZSBWaWRlbyd9XG4gICAgICAgICAgICAgIGFsbG93PVwiYWNjZWxlcm9tZXRlcjsgYXV0b3BsYXk7IGNsaXBib2FyZC13cml0ZTsgZW5jcnlwdGVkLW1lZGlhOyBneXJvc2NvcGU7IHBpY3R1cmUtaW4tcGljdHVyZTsgd2ViLXNoYXJlXCJcbiAgICAgICAgICAgICAgYWxsb3dGdWxsU2NyZWVuXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgYm9yZGVyLTBcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IGRydklkID8gKFxuICAgICAgICAgIDxpZnJhbWVcbiAgICAgICAgICAgIHNyYz17YGh0dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS9maWxlL2QvJHtkcnZJZH0vcHJldmlld2B9XG4gICAgICAgICAgICB0aXRsZT17cGhvbmcudGVufVxuICAgICAgICAgICAgYWxsb3c9XCJhdXRvcGxheTsgZnVsbHNjcmVlblwiXG4gICAgICAgICAgICBhbGxvd0Z1bGxTY3JlZW5cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGxcIlxuICAgICAgICAgIC8+XG4gICAgICAgICkgOiB0cnVjVGllcFVybCA/IChcbiAgICAgICAgICA8dmlkZW9cbiAgICAgICAgICAgIHJlZj17dmlkZW9SZWZ9XG4gICAgICAgICAgICBzcmM9e3RydWNUaWVwVXJsfVxuICAgICAgICAgICAgcGxheXNJbmxpbmVcbiAgICAgICAgICAgIGRhdGEtdGVzdGlkPVwic3R1ZHktdmlkZW8tcGxheWVyXCJcbiAgICAgICAgICAgIGNvbnRyb2xzPXtjYW5Db250cm9sfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY29udGFpblwiXG4gICAgICAgICAgICBvbkxvYWRlZE1ldGFkYXRhPXtlID0+IHtcbiAgICAgICAgICAgICAgaWYgKGUudGFyZ2V0LmR1cmF0aW9uID4gMCkgc2V0RHVyYXRpb24oZS50YXJnZXQuZHVyYXRpb24pO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uUGxheT17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiAhd2F0Y2hTdGF0ZS5wbGF5aW5nICYmICFkYW5nR3VpTGVuaCkge1xuICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3BsYXknLCB2aWRlb1JlZi5jdXJyZW50Py5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvblBhdXNlPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmIHdhdGNoU3RhdGUucGxheWluZyAmJiAhZGFuZ0d1aUxlbmgpIHtcbiAgICAgICAgICAgICAgICBndWlMZW5oKCdwYXVzZScsIHZpZGVvUmVmLmN1cnJlbnQ/LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uRW5kZWQ9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wpIGhhbmhEb25nUXVldWUoJ3NraXAnKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvblNlZWtlZD17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWNhbkNvbnRyb2wgfHwgZGFuZ0d1aUxlbmggfHwgaXNTZWVraW5nUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgICAgICAgY29uc3QgY3VyID0gdmlkZW9SZWYuY3VycmVudD8uY3VycmVudFRpbWU7XG4gICAgICAgICAgICAgIGlmIChjdXIgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAvLyBDaFx1MUVEMW5nIHZcdTAwRjJuZyBsXHUxRUI3cDogbVx1MUVDRGkgZ1x1MDBFMW4gY3VycmVudFRpbWUgblx1MUVEOWkgYlx1MUVEOSAob3B0aW1pc3RpYyBzZWVrLCBkcmlmdC1jb3JyZWN0aW9uXG4gICAgICAgICAgICAgIC8vIGNcdTFFRTdhIGFwRHVuZ0RvbmdCbykgXHUwMTExXHUxRUMxdSBiXHUxRUFGbiAnc2Vla2VkJy4gQ2hcdTFFQzkgZ1x1MUVFRGkgbFx1MUVDN25oIGtoaSB2XHUxRUNCIHRyXHUwMEVEIGxcdTFFQzdjaCBraFx1MUVDRmlcbiAgICAgICAgICAgICAgLy8gdlx1MUVDQiB0clx1MDBFRCBzZXJ2ZXIga1x1MUVGMyB2XHUxRUNEbmcgPjEuNXMgXHUyMDE0IHRcdTFFRTljIG5nXHUwMUIwXHUxRUREaSBkXHUwMEY5bmcgdGhcdTFFQUR0IHNcdTFFRjEgdHVhIHF1YSB0aGFuaCBjb250cm9scy5cbiAgICAgICAgICAgICAgY29uc3Qgc3QgPSB3YXRjaFN0YXRlO1xuICAgICAgICAgICAgICBjb25zdCB1cGRNcyA9IHN0Py51cGRhdGVkQXQgPyBuZXcgRGF0ZShTdHJpbmcoc3QudXBkYXRlZEF0KS5yZXBsYWNlKCcgJywgJ1QnKSArIChTdHJpbmcoc3QudXBkYXRlZEF0KS5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS5nZXRUaW1lKCkgOiBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICBjb25zdCBlbGFwc2VkID0gTWF0aC5tYXgoMCwgKERhdGUubm93KCkgLSB1cGRNcykgLyAxMDAwKTtcbiAgICAgICAgICAgICAgY29uc3Qga3lWb25nID0gc3Q/LnBsYXlpbmdcbiAgICAgICAgICAgICAgICA/IE51bWJlcihzdC5iYXNlUG9zaXRpb25TZWNvbmRzIHx8IDApICsgZWxhcHNlZCAqIChzdC5wbGF5YmFja1JhdGUgfHwgMSlcbiAgICAgICAgICAgICAgICA6IE51bWJlcihzdD8ucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VyIC0ga3lWb25nKSA+IDEuNSkgZ3VpTGVuaCgnc2VlaycsIGN1cik7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgIC8+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBoLWZ1bGwgdGV4dC14cyB0ZXh0LXNsYXRlLTUwMCBwLTYgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtMnhsIG1iLTJcIj5cdTI2QTBcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5MaW5rIHZpZGVvIGtoXHUwMEY0bmcgaFx1MUVENyB0clx1MUVFMyBwaFx1MDBFMXQgdHJcdTFFRjFjIHRpXHUxRUJGcCBob1x1MUVCN2Mga2hcdTAwRjRuZyBoXHUxRUUzcCBsXHUxRUM3Ljwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogVGhcdTAwRjRuZyBiXHUwMEUxbyByaVx1MDBFQW5nIGNobyBHb29nbGUgRHJpdmUgKi99XG4gICAgICB7ZHJ2SWQgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMuNSBweS0yIGJnLWFtYmVyLTUwMC8xMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8yMCByb3VuZGVkLXhsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgdGV4dC1hbWJlci0zMDBcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtXCI+XHUyMTM5XHVGRTBGPC9zcGFuPlxuICAgICAgICAgIDxzcGFuPkdvb2dsZSBEcml2ZSBwaFx1MDBFMXQgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSA8c3Ryb25nPlhlbSBcdTAxMTFcdTFFRDljIGxcdTFFQURwPC9zdHJvbmc+IChHb29nbGUgRHJpdmUga2hcdTAwRjRuZyBoXHUxRUQ3IHRyXHUxRUUzIEFQSSBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIHRcdTFFRUIgeGEpLjwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogVGhhbmggXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiBIb3N0IFx1MjAxNCBcdTFFQTluIGtoaSBmdWxsc2NyZWVuICovfVxuICAgICAgeyFpc1Jvb21XaWRlICYmIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMTYxYjI2XSB0by1bIzBmMTQxZF0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMTAgcm91bmRlZC0yeGwgcC0zIHNtOnAtMy41IGZsZXggZmxleC1jb2wgZ2FwLTMgc2hhZG93LXhsXCI+XG5cblxuICAgICAgICB7LyogVGhhbmggY1x1MDBGNG5nIGNcdTFFRTUgcGhcdTAwRTF0IGNodW5nIChjaFx1MUVDOSBoaVx1MUVDM24gdGhcdTFFQ0IgY2hvIEhvc3QgLyBUZWFjaGVyIGtoaSBkXHUwMEY5bmcgcHJvdmlkZXIgY1x1MDBGMyB0aFx1MUVDMyBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuKSAqL31cbiAgICAgICAge2NhbkNvbnRyb2wgJiYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyB8fCBwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGl0ZW1zLWNlbnRlciBnYXAtMyBwdC0yIGJvcmRlci10IGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImJ0bi1ob3N0LXdhdGNoLXRvZ2dsZVwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKHdhdGNoU3RhdGUucGxheWluZyA/ICdwYXVzZScgOiAncGxheScpfVxuICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBzbTp3LWF1dG8gcHgtNCBweS0yIHJvdW5kZWQteGwgZm9udC1ibGFjayB0ZXh0LXhzIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xLjUgc2hhZG93LW1kIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlciBkaXNhYmxlZDpvcGFjaXR5LTUwICR7XG4gICAgICAgICAgICAgICAgd2F0Y2hTdGF0ZS5wbGF5aW5nXG4gICAgICAgICAgICAgICAgICA/ICdiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvNDAgaG92ZXI6YmctYW1iZXItNTAwLzMwIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgyNDUsMTU4LDExLDAuMjUpXSdcbiAgICAgICAgICAgICAgICAgIDogJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMwMGM2ZmZdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gaG92ZXI6YnJpZ2h0bmVzcy0xMTAnXG4gICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgPHNwYW4+e3dhdGNoU3RhdGUucGxheWluZyA/ICdcdTIzRjgnIDogJ1x1MjVCNid9PC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj57d2F0Y2hTdGF0ZS5wbGF5aW5nID8gJ1RcdTFFQTFtIERcdTFFRUJuZyBDXHUxRUEzIFBoXHUwMEYybmcnIDogJ1BoXHUwMEUxdCBDaHVuZyBDXHUxRUEzIFBoXHUwMEYybmcnfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41IHctZnVsbFwiPlxuICAgICAgICAgICAgICA8c3BhbiBpZD1cImhvc3QtZHVyYXRpb24tbGFiZWxcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICB7ZGluaERhbmdHaWF5UGh1dChsb2NhbFRpbWUpfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIGlkPVwiaG9zdC1zZWVrLXNsaWRlclwiXG4gICAgICAgICAgICAgICAgdHlwZT1cInJhbmdlXCJcbiAgICAgICAgICAgICAgICBtaW49XCIwXCJcbiAgICAgICAgICAgICAgICBtYXg9e2R1cmF0aW9uID4gMCA/IGR1cmF0aW9uIDogTWF0aC5tYXgobG9jYWxUaW1lLCAzMDApfVxuICAgICAgICAgICAgICAgIHN0ZXA9XCIxXCJcbiAgICAgICAgICAgICAgICB2YWx1ZT17bG9jYWxUaW1lfVxuICAgICAgICAgICAgICAgIG9uTW91c2VEb3duPXsoKSA9PiB7IGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICBvblRvdWNoU3RhcnQ9eygpID0+IHsgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldExvY2FsVGltZShOdW1iZXIoZS50YXJnZXQudmFsdWUpKX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlVXA9e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBOdW1iZXIoZS50YXJnZXQudmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uVG91Y2hFbmQ9e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBOdW1iZXIoZS50YXJnZXQudmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBoLTEuNSBiZy13aGl0ZS8xMCByb3VuZGVkLWxnIGFwcGVhcmFuY2Utbm9uZSBjdXJzb3ItcG9pbnRlciBhY2NlbnQtWyMwMEYyRkVdXCJcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1tb25vIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAge2R1cmF0aW9uID4gMCA/IGRpbmhEYW5nR2lheVBodXQoZHVyYXRpb24pIDogJy0tOi0tJ31cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAge2xvaSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtcm9zZS00MDBcIj57bG9pfTwvcD59XG4gICAgICAgIHtwaG9uZy5tb1RhICYmIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIGxlYWRpbmctcmVsYXhlZCBwdC0xXCI+e3Bob25nLm1vVGF9PC9wPn1cblxuICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogXHUyNTAwXHUyNTAwXHUyNTAwIFZcdTAwRDlORyAxOiBUUlVORyBUXHUwMEMyTSBDXHUxRUE0VSBIXHUwMENDTkggVklERU8gJiBIXHUwMEMwTkcgXHUwMTEwXHUxRUUySSBZT1VUVUJFIFRSXHUxRUYwQyBUSVx1MUVCRVAgXHUyNTAwXHUyNTAwXHUyNTAwICovfVxuICAgICAgeyFpc1Jvb21XaWRlICYmIChcbiAgICAgICAgPGRpdiBpZD1cInZ1bmcxLXlvdXR1YmUtc3R1ZGlvXCIgc3R5bGU9e3sgb3ZlcmZsb3dBbmNob3I6ICdub25lJyB9fSBjbGFzc05hbWU9XCJiZy1ncmFkaWVudC10by1iIGZyb20tWyMxNjFiMjZdIHRvLVsjMGYxNDFkXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtMy41IHNtOnAtNCBmbGV4IGZsZXgtY29sIGdhcC0zIHNoYWRvdy14bFwiPlxuICAgICAgICAgIHsvKiBIZWFkZXIgdHJ1bmcgdFx1MDBFMm0gKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgcGItMi41IGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMCBmbGV4LXdyYXBcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLWJyIGZyb20tWyMwMEYyRkVdLzIwIHRvLXZpb2xldC01MDAvMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMzAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1zbSBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMCwyNDIsMjU0LDAuMjUpXVwiPlxuICAgICAgICAgICAgICAgIFx1RDgzQ1x1REZBQ1xuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQteHMgc206dGV4dC1zbSBmb250LWJsYWNrIHRleHQtd2hpdGUgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+Q1x1MUVBNXUgaFx1MDBFQ25oIFZpZGVvICYgSFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgWW91VHViZTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3QuZmlsdGVyKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnKS5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkLWZ1bGwgYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3QuZmlsdGVyKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnKS5sZW5ndGh9IFx1MDExMWFuZyBjaFx1MUVERFxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDBcIj5UXHUwMEVDbSBraVx1MUVCRm0gdmlkZW8sIFx1MDExMVx1MDFCMGEgdlx1MDBFMG8gaFx1MDBFMG5nIGNoXHUxRUREIHZcdTAwRTAgY2hcdTFFQTF5IHZpZGVvIGtoXHUwMEUxYyBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGNcdTFFQTMgcGhcdTAwRjJuZzwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgIHsvKiBUYWIgc2VsZWN0b3IgKi99XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgYmctWyMwQjBFMTRdIHAtMSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLW1lZGlhLXRhYi1zZWFyY2hcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBnaXVOZ3V5ZW5WaVRyaUN1b24oKCkgPT4gc2V0TWVkaWFUYWIoJ3NlYXJjaCcpKTtcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEuNSByb3VuZGVkLWxnIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICAgICAgICBtZWRpYVRhYiA9PT0gJ3NlYXJjaCdcbiAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIHNoYWRvdy1tZCdcbiAgICAgICAgICAgICAgICAgICAgICA6ICd0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDBEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+VFx1MDBFQ20gWW91VHViZTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLW1lZGlhLXRhYi1xdWV1ZVwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIGdpdU5ndXllblZpVHJpQ3VvbigoKSA9PiBzZXRNZWRpYVRhYigncXVldWUnKSk7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgICAgICAgbWVkaWFUYWIgPT09ICdxdWV1ZSdcbiAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tdmlvbGV0LTUwMCB0by1mdWNoc2lhLTUwMCB0ZXh0LXdoaXRlIHNoYWRvdy1tZCdcbiAgICAgICAgICAgICAgICAgICAgICA6ICd0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0NCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+SFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgKHtxdWV1ZUxpc3QuZmlsdGVyKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnKS5sZW5ndGh9KTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgey8qIFRvZ2dsZSB0aHUgZ1x1MUVDRG4gKi99XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBpZD1cImJ0bi10b2dnbGUtc3R1ZGlvXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgIGdpdU5ndXllblZpVHJpQ3VvbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldERhTW9Sb25nU3R1ZGlvKHByZXYgPT4gIXByZXYpO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICB0aXRsZT17ZGFNb1JvbmdTdHVkaW8gPyAnVGh1IGdcdTFFQ0RuJyA6ICdNXHUxRURGIHJcdTFFRDluZyd9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLXhsIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAge2RhTW9Sb25nU3R1ZGlvID8gJ1x1MjVCMicgOiAnXHUyNUJDJ31cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiBUb2FzdCB0aFx1MDBGNG5nIGJcdTAwRTFvIC8gTFx1MUVEN2kgKi99XG4gICAgICAgICAge3Rob25nQmFvVmlkZW8gJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zIHB5LTIgcm91bmRlZC14bCBiZy1lbWVyYWxkLTUwMC8xNSBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQtZW1lcmFsZC0zMDAgdGV4dC14cyBmb250LWJvbGQgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgYW5pbWF0ZS1mYWRlSW5cIj5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNzI4PC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj57dGhvbmdCYW9WaWRlb308L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuICAgICAgICAgIHtsb2lWaWRlbyAmJiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMiByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzE1IGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdGV4dC1yb3NlLTMwMCB0ZXh0LXhzIGZvbnQtYm9sZCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTI2QTBcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPntsb2lWaWRlb308L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuXG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwIGVhc2UtaW4tb3V0IG92ZXJmbG93LWhpZGRlbiBmbGV4IGZsZXgtY29sIG1pbi1oLTAgJHtcbiAgICAgICAgICAgICAgZGFNb1JvbmdTdHVkaW8gPyAnbWF4LWgtWzM4MHB4XSBvcGFjaXR5LTEwMCcgOiAnbWF4LWgtMCBvcGFjaXR5LTAgcG9pbnRlci1ldmVudHMtbm9uZSdcbiAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgc3R5bGU9e3sgb3ZlcmZsb3dBbmNob3I6ICdub25lJyB9fT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1bMzQwcHhdIGZsZXggZmxleC1jb2wgbWluLWgtMCBvdmVyZmxvdy1oaWRkZW4gc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgey8qIFRBQiAxOiBUXHUwMENDTSBLSVx1MUVCRU0gWU9VVFVCRSAmIFx1MDExMFx1MUVENEkgVklERU8gKi99XG4gICAgICAgICAgICAgIHttZWRpYVRhYiA9PT0gJ3NlYXJjaCcgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1mdWxsIGZsZXggZmxleC1jb2wgZ2FwLTIuNSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICB7LyogXHUwMEQ0IHRcdTAwRUNtIGtpXHUxRUJGbSAvIGRcdTAwRTFuIGxpbmsgXHUwMTExYSBuXHUwMTAzbmcgKi99XG4gICAgICAgICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17KGUpID0+IHRpbUtpZW1Zb3VUdWJlKGUpfSBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC0yIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIGZsZXgtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYWJzb2x1dGUgbGVmdC0zIHRvcC0xLzIgLXRyYW5zbGF0ZS15LTEvMiB0ZXh0LXNsYXRlLTQwMCB0ZXh0LXhzXCI+XHVEODNEXHVERDBEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtdnVuZzEteW91dHViZS1zZWFyY2hcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt5dFF1ZXJ5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRZdFF1ZXJ5KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJOaFx1MUVBRHAgdFx1MUVFQiBraFx1MDBGM2EgdFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmUgKHZkOiBsb2ZpIGhcdTFFQ0RjIGJcdTAwRTBpLi4uKSBob1x1MUVCN2MgZFx1MDBFMW4gbGluayB2aWRlby4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBmb2N1czpib3JkZXItWyMwMEYyRkVdLzYwIHJvdW5kZWQteGwgcGwtOCBwci0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLXRpbS1raWVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXsheXRRdWVyeS50cmltKCkgfHwgc2VhcmNoaW5nWXR9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zLjUgcHktMiByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIGhvdmVyOmJyaWdodG5lc3MtMTEwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBzaGFkb3ctbWQgZGlzYWJsZWQ6b3BhY2l0eS00MCB3aGl0ZXNwYWNlLW5vd3JhcCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7c2VhcmNoaW5nWXQgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYW5pbWF0ZS1zcGluXCI+XHUyM0YzPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MDExMGFuZyB0XHUwMEVDbS4uLjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5UXHUwMEVDbSBraVx1MUVCRm08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgey8qIEFjdGlvbiBidXR0b25zIHBoXHUxRUU1IGtoaSBcdTAwRjQgaW5wdXQgbFx1MDBFMCAxIGxpbmsgdmlkZW8gdHJcdTFFRjFjIHRpXHUxRUJGcCAqL31cbiAgICAgICAgICAgICAgICAgICAge0Jvb2xlYW4oeXRRdWVyeS50cmltKCkuc3RhcnRzV2l0aCgnaHR0cDovLycpIHx8IHl0UXVlcnkudHJpbSgpLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vJykgfHwgeXRRdWVyeS5pbmNsdWRlcygneW91dHUnKSkgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcC0yIHJvdW5kZWQteGwgYmctWyMwQjBFMTRdLzgwIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzIwIGZsZXgtd3JhcCBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDE3PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5QaFx1MDBFMXQgaGlcdTFFQzduIGxpXHUwMEVBbiBrXHUxRUJGdCB2aWRlbzo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS1waGF0LW5nYXktbGlua1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGRvaVZpZGVvKHl0UXVlcnkudHJpbSgpLCAnVmlkZW8gdFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdEb2lWaWRlb31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1bIzAwRjJGRV0gdGV4dC1ibGFjayB0ZXh0LXhzIGZvbnQtYmxhY2sgaG92ZXI6YmctWyMwMGUxZWNdIGFjdGl2ZTpzY2FsZS05NSBzaGFkb3ctc21cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2IFBoXHUwMEUxdCBuZ2F5IGNcdTFFQTMgcGhcdTAwRjJuZ1xuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS1lbnF1ZXVlLWxpbmtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdlbnF1ZXVlJywgeyB2aWRlb1VybDogeXRRdWVyeS50cmltKCksIHRpdGxlOiAnVmlkZW8gdFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQnIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLWVtZXJhbGQtNTAwLzIwIHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICArIFRoXHUwMEVBbSB2XHUwMEUwbyBjdVx1MUVEMWkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtYWRkLW5leHQtbGlua1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ2FkZF9uZXh0JywgeyB2aWRlb1VybDogeXRRdWVyeS50cmltKCksIHRpdGxlOiAnVmlkZW8gdFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQnIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy12aW9sZXQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICsgUGhcdTAwRTF0IGtcdTFFQkYgdGlcdTFFQkZwXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDwvZm9ybT5cblxuICAgICAgICAgICAgICAgICAgey8qIFRyXHUxRUExbmcgdGhcdTAwRTFpIGxcdTFFRDdpIHRcdTAwRUNtIGtpXHUxRUJGbSAqL31cbiAgICAgICAgICAgICAgICAgIHtzZWFyY2hMb2kgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMi41IHJvdW5kZWQteGwgYmctYW1iZXItNTAwLzEwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIHRleHQteHMgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHUyNkEwXHVGRTBGIHtzZWFyY2hMb2l9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNlYXJjaExvaSgnJyl9IGNsYXNzTmFtZT1cInRleHQtYW1iZXItNDAwIGZvbnQtYm9sZCBob3Zlcjp1bmRlcmxpbmVcIj5cdTAxMTBcdTAwRjNuZzwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBLXHUxRUJGdCBxdVx1MUVBMyB0XHUwMEVDbSBraVx1MUVCRm0gWW91VHViZSAqL31cbiAgICAgICAgICAgICAgICAgIHt5dFJlc3VsdHMubGVuZ3RoID4gMCA/IChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMS41IG1pbi1oLTAgb3ZlcmZsb3ctaGlkZGVuXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0ZBPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5LXHUxRUJGdCBxdVx1MUVBMyBZb3VUdWJlICh7eXRSZXN1bHRzLmxlbmd0aH0gdmlkZW8pOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLWRvbmcta2V0LXF1YVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0WXRSZXN1bHRzKFtdKTsgc2V0U2VhcmNoTG9pKCcnKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMiBweS0wLjUgcm91bmRlZC1tZCBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgdGV4dC1bMTBweF0gZm9udC1ib2xkIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNSBcdTAxMTBcdTAwRjNuZyBrXHUxRUJGdCBxdVx1MUVBM1xuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBzcGFjZS15LTIgb3ZlcmZsb3cteS1hdXRvIHByLTEgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3l0UmVzdWx0cy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2VXJsID0gYGh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9JHtpdGVtLnZpZGVvSWR9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2l0ZW0udmlkZW9JZCB8fCBpZHh9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJncm91cCBiZy1bIzBCMEUxNF0gaG92ZXI6YmctWyMxMjE3MjFdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6Ym9yZGVyLVsjMDBGMkZFXS8zMCByb3VuZGVkLXhsIHAtMi41IGZsZXggaXRlbXMtY2VudGVyIGdhcC0zIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogVGh1bWJuYWlsICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSB3LTI0IHNtOnctMjggYXNwZWN0LXZpZGVvIHJvdW5kZWQtbGcgb3ZlcmZsb3ctaGlkZGVuIGJnLWJsYWNrIHNocmluay0wIGJvcmRlciBib3JkZXItd2hpdGUvNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW1nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjPXtpdGVtLnRodW1ibmFpbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbHQ9e2l0ZW0udGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY292ZXIgZ3JvdXAtaG92ZXI6c2NhbGUtMTA1IHRyYW5zaXRpb24tdHJhbnNmb3JtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nPVwibGF6eVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFic29sdXRlIGJvdHRvbS0xIHJpZ2h0LTEgYmctYmxhY2svODAgcHgtMSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtbW9ubyB0ZXh0LXdoaXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgWW91VHViZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFRoXHUwMEY0bmcgdGluIHZpZGVvICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgbWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDUgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS0yMDAgbGluZS1jbGFtcC0yIGdyb3VwLWhvdmVyOnRleHQtWyMwMEYyRkVdIHRyYW5zaXRpb24tY29sb3JzXCIgdGl0bGU9e2l0ZW0udGl0bGV9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpdGVtLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2g1PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG10LTEgdGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDAgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj57aXRlbS5jaGFubmVsVGl0bGUgfHwgJ0tcdTAwRUFuaCBZb3VUdWJlJ308L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2l0ZW0ucHVibGlzaGVkQXQgJiYgPHNwYW4+XHUyMDIyIHtpdGVtLnB1Ymxpc2hlZEF0fTwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBCXHUxRUQ5IDMgblx1MDBGQXQgdGhhbyB0XHUwMEUxYyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDaFx1MUVBMXkgdmlkZW8gblx1MDBFMHkgbmdheSBsXHUxRUFEcCB0XHUxRUU5YyBjaG8gY1x1MUVBMyBwaFx1MDBGMm5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBkb2lWaWRlbyh2VXJsLCBpdGVtLnRpdGxlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0RvaVZpZGVvfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMDBjNmZmXSB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC1bMTFweF0gc2hhZG93LXNtIGhvdmVyOmJyaWdodG5lc3MtMTEwIGFjdGl2ZTpzY2FsZS05NSBkaXNhYmxlZDpvcGFjaXR5LTQwIHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2IFBoXHUwMEUxdCBuZ2F5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJUaFx1MDBFQW0gdlx1MDBFMG8gY3VcdTFFRDFpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdlbnF1ZXVlJywgeyB2aWRlb1VybDogdlVybCwgdGl0bGU6IGl0ZW0udGl0bGUgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMS41IHJvdW5kZWQtbGcgYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIGhvdmVyOmJnLWVtZXJhbGQtNTAwLzI1IHRleHQtWzExcHhdIGZvbnQtYm9sZCBhY3RpdmU6c2NhbGUtOTUgZGlzYWJsZWQ6b3BhY2l0eS00MCB3aGl0ZXNwYWNlLW5vd3JhcCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgSFx1MDBFMG5nIGNoXHUxRUREXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJUaFx1MDBFQW0gXHUwMTExXHUxRUMzIHBoXHUwMEUxdCBrXHUxRUJGIHRpXHUxRUJGcCBzYXUgdmlkZW8gaGlcdTFFQzduIHRcdTFFQTFpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdhZGRfbmV4dCcsIHsgdmlkZW9Vcmw6IHZVcmwsIHRpdGxlOiBpdGVtLnRpdGxlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLXZpb2xldC01MDAvMTUgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCBob3ZlcjpiZy12aW9sZXQtNTAwLzI1IHRleHQtWzEwcHhdIGZvbnQtYm9sZCBhY3RpdmU6c2NhbGUtOTUgZGlzYWJsZWQ6b3BhY2l0eS00MCB3aGl0ZXNwYWNlLW5vd3JhcCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgS1x1MUVCRiB0aVx1MUVCRnBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIC8qIEdcdTFFRTNpIFx1MDBGRCB0XHUxRUVCIGtoXHUwMEYzYSB0XHUwMEVDbSBraVx1MUVCRm0gbmhhbmggKyBraHVuZyB0aFx1MDBGNG5nIHRpbiBnaVx1MUVFRiBjaGlcdTFFQzF1IGNhbyBjXHUxRUQxIFx1MDExMVx1MUVDQm5oICovXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wganVzdGlmeS1iZXR3ZWVuIGdhcC0yIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTEuNSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDAgZm9udC1ib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBHXHUxRUUzaSBcdTAwRkQgY2hcdTFFRTcgXHUwMTExXHUxRUMxIGhcdTFFQ0RjIHRcdTFFQURwICYgdGhcdTAxQjAgZ2lcdTAwRTNuOlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7W1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdcdUQ4M0NcdURGQTcgTG9maSBoXHUxRUNEYyB0XHUxRUFEcCcsIHE6ICdsb2ZpIGhpcCBob3AgcmFkaW8gYmVhdHMgdG8gcmVsYXggc3R1ZHkgdG8nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1RDgzQ1x1REYyN1x1RkUwRiBUaVx1MUVCRm5nIG1cdTAxQjBhICYgUGlhbm8nLCBxOiAncmFpbiBzb3VuZHMgcmVsYXhpbmcgcGlhbm8gc3R1ZHkgZm9jdXMnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1MjYxNSBOaFx1MUVBMWMgcXVcdTAwRTFuIGNcdTAwRTAgcGhcdTAwRUEnLCBxOiAnY29mZmVlIHNob3AgamF6eiBwaWFubyBjaGlsbCBzdHVkeScgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHVEODNEXHVEQ0RBIFRcdTFFQURwIHRydW5nIFx1MDBGNG4gdGhpJywgcTogJ3N0dWR5IG11c2ljIGFscGhhIHdhdmVzIGNvbmNlbnRyYXRpb24nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1RDgzRFx1REQyQyBUaFx1MDBFRCBuZ2hpXHUxRUM3bSBIXHUwMEYzYSBoXHUxRUNEYycsIHE6ICd0aFx1MDBFRCBuZ2hpXHUxRUM3bSBoXHUwMEYzYSBoXHUxRUNEYyB0aFx1MDBGQSB2XHUxRUNCJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBdLm1hcCgoY2hpcCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17Y2hpcC5xfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gdGltS2llbVlvdVR1YmUoZSwgY2hpcC5xKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQtWzExcHhdIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y2hpcC5sYWJlbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtMyBiZy1bIzBCMEUxNF0vNjAgYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQteGwgdGV4dC1jZW50ZXIgdGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBnYXAtMSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhsXCI+XHVEODNEXHVEQ0ZBPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwXCI+VFx1MDBFQ20ga2lcdTFFQkZtICYgUGhcdTAwRTF0IHZpZGVvIFlvdVR1YmU8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCBtYXgtdy1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBOaFx1MUVBRHAgdFx1MUVFQiBraFx1MDBGM2EgYlx1MDBFMGkgaFx1MUVDRGMgaG9cdTFFQjdjIGRcdTAwRTFuIGxpXHUwMEVBbiBrXHUxRUJGdCBZb3VUdWJlIFx1MUVERiB0clx1MDBFQW4gXHUwMTExXHUxRUMzIHRcdTAwRUNtIGtpXHUxRUJGbSB2XHUwMEUwIHBoXHUwMEUxdCBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGNobyB0XHUxRUE1dCBjXHUxRUEzIHRoXHUwMEUwbmggdmlcdTAwRUFuIHRyb25nIHBoXHUwMEYybmcuXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICB7LyogVEFCIDI6IFFVXHUxRUEyTiBMXHUwMEREIEhcdTAwQzBORyBcdTAxMTBcdTFFRTJJIChRVUVVRSkgKi99XG4gICAgICAgICAgICAgIHttZWRpYVRhYiA9PT0gJ3F1ZXVlJyAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLWZ1bGwgZmxleCBmbGV4LWNvbCBnYXAtMi41IG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGZsZXgtd3JhcCBnYXAtMiBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0NCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPkhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHZpZGVvICh7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RofSBjaFx1MUVERCk8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7cXVldWVMaXN0LnNvbWUocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLXF1ZXVlLXNraXBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdza2lwJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctYW1iZXItNTAwLzE1IHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLWFtYmVyLTUwMC8yNSBkaXNhYmxlZDpvcGFjaXR5LTQwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MjNFRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVDRiBxdWEgLyBCXHUwMEUwaSB0aVx1MUVCRnA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGFpUXVldWV9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkxcdTAwRTBtIG1cdTFFREJpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIgcHktMSByb3VuZGVkLWxnIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LXhzIGJvcmRlciBib3JkZXItd2hpdGUvMTAgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzRFx1REQwNFxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICB7LyogVGhcdTAwRUFtIGxpbmsgbmhhbmggdlx1MDBFMG8gcXVldWUgKi99XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgIDxRdWV1ZUlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgb25BZGQ9eyh1LCB0KSA9PiBoYW5oRG9uZ1F1ZXVlKCdlbnF1ZXVlJywgeyB2aWRlb1VybDogdSwgdGl0bGU6IHQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgb25BZGROZXh0PXsodSwgdCkgPT4gaGFuaERvbmdRdWV1ZSgnYWRkX25leHQnLCB7IHZpZGVvVXJsOiB1LCB0aXRsZTogdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICB7LyogRGFuaCBzXHUwMEUxY2ggdmlkZW8gdHJvbmcgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgKi99XG4gICAgICAgICAgICAgICAgICB7cXVldWVMaXN0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00IGJnLVsjMEIwRTE0XS82MCBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC14bCB0ZXh0LWNlbnRlciB0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIGdhcC0xLjUgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtMnhsXCI+XHVEODNEXHVEQ0NCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMFwiPkhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIGhpXHUxRUM3biBcdTAxMTFhbmcgdHJcdTFFRDFuZzwvcD5cbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCBtYXgtdy1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgQ2h1eVx1MUVDM24gc2FuZyB0YWIgPHN0cm9uZz5UXHUwMEVDbSBZb3VUdWJlPC9zdHJvbmc+IGhvXHUxRUI3YyBkXHUwMEUxbiBsaVx1MDBFQW4ga1x1MUVCRnQgdlx1MDBFMG8gXHUwMEY0IHRyXHUwMEVBbiBcdTAxMTFcdTFFQzMgXHUwMTExXHUwMUIwYSB2aWRlbyB2XHUwMEUwbyBkYW5oIHNcdTAwRTFjaCBwaFx1MDBFMXQgbGlcdTAwRUFuIHRcdTFFRTVjLlxuICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBzcGFjZS15LTEuNSBvdmVyZmxvdy15LWF1dG8gcHItMSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3F1ZXVlTGlzdC5tYXAoKHEsIGlkeCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3EuaWQgfHwgaWR4fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41IGJnLVsjMEIwRTE0XSBib3JkZXIgcm91bmRlZC14bCBwLTIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxLnRyYW5nVGhhaSA9PT0gJ3BsYXlpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdib3JkZXItZW1lcmFsZC01MDAvNDAgc2hhZG93LVswXzBfMTVweF9yZ2JhKDUyLDIxMSwxNTMsMC4xNSldIGJnLWVtZXJhbGQtOTUwLzIwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYm9yZGVyLXdoaXRlLzUgaG92ZXI6Ym9yZGVyLXdoaXRlLzE1J1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy02IGgtNiByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzExcHhdIGZvbnQtYmxhY2sgc2hyaW5rLTAgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHEudHJhbmdUaGFpID09PSAncGxheWluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctZW1lcmFsZC01MDAgdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xMHB4X3JnYmEoNTIsMjExLDE1MywwLjQpXSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRyYW5nVGhhaSA9PT0gJ3BsYXlpbmcnID8gJ1x1MjVCNicgOiBpZHggKyAxfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge3EudGh1bWIgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtxLnRodW1ifSBhbHQ9XCJcIiBjbGFzc05hbWU9XCJ3LTEyIGgtNyByb3VuZGVkLW1kIG9iamVjdC1jb3ZlciBzaHJpbmstMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwXCIgbG9hZGluZz1cImxhenlcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMjAwIGZvbnQtYm9sZCB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudGl0bGUgfHwgcS52aWRlb1VybH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRyYW5nVGhhaSA9PT0gJ3BsYXlpbmcnID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWVtZXJhbGQtNDAwIGZvbnQtYm9sZFwiPlx1MjVDRiBcdTAxMTBhbmcgcGhcdTAwRTF0PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+VGhcdTAwRUFtIGJcdTFFREZpOiB7cS5hZGRlZEJ5IHx8ICdUaFx1MDBFMG5oIHZpXHUwMEVBbid9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJQaFx1MDBFMXQgdmlkZW8gblx1MDBFMHkgbmdheVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3BsYXlfbm93JywgeyBpZDogcS5pZCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1bIzAwRjJGRV0vMjAgdGV4dC1bIzAwRjJGRV0gaG92ZXI6YmctWyMwMEYyRkVdLzMwIHRleHQteHMgZm9udC1ibGFjayBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2IFBoXHUwMEUxdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiWFx1MDBGM2Ega2hcdTFFQ0ZpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgncmVtb3ZlJywgeyBpZDogcS5pZCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy03IGgtNyByb3VuZGVkLWxnIGJnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS0zMDAgaG92ZXI6Ymctcm9zZS01MDAvMjUgdGV4dC14cyBmb250LWJsYWNrIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG5cbiAgKTtcbn1cblxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ29tcG9uZW50OiBDYW1wdXMgRm9jdXMgUm9vbSAoU3R1ZHkgQ2FmXHUwMEU5ICYgUG9tb2Rvcm8gU2Vzc2lvbikgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5leHBvcnQgZnVuY3Rpb24gQ2FtcHVzRm9jdXNSb29tKHtcbiAgcGhvbmcsXG4gIHBob25nTWluaEtob2EsXG4gIGF1dGgsXG4gIGRvbmdQaG9uZ0hpZW5UYWksXG4gIHNvTmd1b2ksXG4gIGlzRm9jdXNNb2RlLFxuICBzZXRJc0ZvY3VzTW9kZVxufSkge1xuICBjb25zdCBbZm9jdXNTdGF0ZSwgc2V0Rm9jdXNTdGF0ZV0gPSB1c2VTdGF0ZSh7XG4gICAgcGhhc2U6ICdmb2N1cycsXG4gICAgc3RhdHVzOiAncGF1c2VkJyxcbiAgICBkdXJhdGlvblNlY29uZHM6IDE1MDAsXG4gICAgcmVtYWluaW5nU2Vjb25kczogMTUwMCxcbiAgICBwcmVzZXQ6ICcyNV81JyxcbiAgICByZXZpc2lvbjogMSxcbiAgICBjYW5Db250cm9sOiBmYWxzZSxcbiAgICB1cGRhdGVkQXQ6IG51bGwsXG4gICAgc2VydmVyTm93OiBudWxsXG4gIH0pO1xuICBjb25zdCBbbG9jYWxSZW1haW5pbmcsIHNldExvY2FsUmVtYWluaW5nXSA9IHVzZVN0YXRlKDE1MDApO1xuICBjb25zdCBbZGFuZ0d1aUxlbmgsIHNldERhbmdHdWlMZW5oXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2xvaSwgc2V0TG9pXSA9IHVzZVN0YXRlKCcnKTtcblxuICAvLyBBdWRpbyBzdGF0ZSAoQW1iaWVudCBwbGF5YmFjaylcbiAgbGV0IGNhdUhpbmggPSB7fTtcbiAgdHJ5IHsgY2F1SGluaCA9IHBob25nLmNhdUhpbmggPyBKU09OLnBhcnNlKHBob25nLmNhdUhpbmgpIDoge307IH0gY2F0Y2ggeyAvKiBiXHUxRUNGIHF1YSAqLyB9XG4gIGNvbnN0IG5oYWNVcmwgPSBjYXVIaW5oLm5oYWNVcmwgPyB1cmxNZWRpYUZlKGNhdUhpbmgubmhhY1VybCkgOiAnJztcbiAgY29uc3QgYXVkaW9SZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IFthdWRpb1BsYXlpbmcsIHNldEF1ZGlvUGxheWluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFthdWRpb1ZvbHVtZSwgc2V0QXVkaW9Wb2x1bWVdID0gdXNlU3RhdGUoMC41KTtcbiAgY29uc3QgW2F1ZGlvTXV0ZWQsIHNldEF1ZGlvTXV0ZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbaGFzSW50ZXJhY3RlZEF1ZGlvLCBzZXRIYXNJbnRlcmFjdGVkQXVkaW9dID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8vIEF1dGhvcml6YXRpb25cbiAgY29uc3QgW2NhbkNvbnRyb2wsIHNldENhbkNvbnRyb2xdID0gdXNlU3RhdGUoQm9vbGVhbihhdXRoLnVzZXI/LmlzVGVhY2hlciB8fCBwaG9uZz8uY2FuQ29udHJvbCB8fCBwaG9uZz8ubGFDaHVQaG9uZykpO1xuICBjb25zdCBpc0hvc3QgPSBjYW5Db250cm9sO1xuXG4gIC8vIFN5bmMgc3RhdGUgcmVjb25jaWxpYXRpb24gaGVscGVyXG4gIGNvbnN0IGFwRHVuZ0ZvY3VzU3RhdGUgPSAoc3QpID0+IHtcbiAgICBpZiAoIXN0KSByZXR1cm47XG4gICAgc2V0Rm9jdXNTdGF0ZShzdCk7XG4gICAgY29uc3QgcmVtID0gTnVtYmVyKHN0LnJlbWFpbmluZ1NlY29uZHMgPz8gMTUwMCk7XG4gICAgc2V0TG9jYWxSZW1haW5pbmcocmVtKTtcbiAgfTtcblxuICAvLyAxLiBQb2xsaW5nIEZvY3VzIFN0YXRlIChldmVyeSAzMDAwbXMpIHdpdGggdmlzaWJpbGl0eSByZWNvbmNpbGlhdGlvbiAmIHN0cmljdCBjbGVhbnVwXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG5cbiAgICBjb25zdCBmZXRjaEZvY3VzID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctZm9jdXM/cGhvbmdJZD0ke2VuY29kZVVSSUNvbXBvbmVudChwaG9uZy5pZCl9YCk7XG4gICAgICAgIGlmICghcmVzLm9rKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICAgIGlmICh0eXBlb2YgZC5jYW5Db250cm9sID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHNldENhbkNvbnRyb2woZC5jYW5Db250cm9sKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXBEdW5nRm9jdXNTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8qIGJcdTFFQ0YgcXVhIGtoaSBoXHUxRUU3eSBrXHUxRUJGdCBuXHUxRUQxaSAqL1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmZXRjaEZvY3VzKCk7XG4gICAgY29uc3QgdGltZXIgPSBzZXRJbnRlcnZhbChmZXRjaEZvY3VzLCAzMDAwKTtcblxuICAgIGNvbnN0IGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UgPSAoKSA9PiB7XG4gICAgICBpZiAoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAndmlzaWJsZScgJiYgYWN0aXZlKSB7XG4gICAgICAgIGZldGNoRm9jdXMoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlKTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBhY3RpdmUgPSBmYWxzZTtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UpO1xuICAgIH07XG4gIH0sIFtwaG9uZy5pZF0pO1xuXG4gIC8vIDIuIExvY2FsIENvdW50ZG93biBUaWNrIChldmVyeSAxMDAwbXMgd2hlbiBzdGF0dXMgPT09ICdydW5uaW5nJylcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZm9jdXNTdGF0ZS5zdGF0dXMgIT09ICdydW5uaW5nJykgcmV0dXJuO1xuICAgIGNvbnN0IHRpY2sgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBzZXRMb2NhbFJlbWFpbmluZyhyID0+IE1hdGgubWF4KDAsIHIgLSAxKSk7XG4gICAgfSwgMTAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodGljayk7XG4gIH0sIFtmb2N1c1N0YXRlLnN0YXR1c10pO1xuXG4gIC8vIDMuIENvbW1hbmQgZGlzcGF0Y2hlciB3aXRoIG9wdGltaXN0aWMgY29uY3VycmVuY3kgKHJldmlzaW9uIGNoZWNrICYgY29uZmxpY3QgaGFuZGxpbmcpXG4gIGNvbnN0IGd1aUxlbmggPSBhc3luYyAoYWN0aW9uLCBleHRyYVBheWxvYWQgPSB7fSkgPT4ge1xuICAgIGlmIChkYW5nR3VpTGVuaCkgcmV0dXJuO1xuICAgIHNldERhbmdHdWlMZW5oKHRydWUpO1xuICAgIHNldExvaSgnJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctZm9jdXMnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgIGFjdGlvbixcbiAgICAgICAgICBleHBlY3RlZFJldmlzaW9uOiBmb2N1c1N0YXRlLnJldmlzaW9uLFxuICAgICAgICAgIC4uLmV4dHJhUGF5bG9hZFxuICAgICAgICB9KVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICBhcER1bmdGb2N1c1N0YXRlKGQuc3RhdGUpO1xuICAgICAgfSBlbHNlIGlmIChyZXMuc3RhdHVzID09PSA0MDkgJiYgZC5zdGF0ZSkge1xuICAgICAgICAvLyBDb25jdXJyZW5jeSBjb25mbGljdDogYWRvcHQgbGF0ZXN0IHNlcnZlciBzdGF0ZVxuICAgICAgICBhcER1bmdGb2N1c1N0YXRlKGQuc3RhdGUpO1xuICAgICAgICBzZXRMb2koJ1x1MDExMFx1MDBFMyBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGxcdTFFQTFpIHBoaVx1MDBFQW4gdGhlbyBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldExvaShkLmxvaSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyBjXHUxRUFEcCBuaFx1MUVBRHQgdHJcdTFFQTFuZyB0aFx1MDBFMWkgcGhcdTAwRjJuZyBoXHUxRUNEYyB0XHUxRUFEcC4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldERhbmdHdWlMZW5oKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gNC4gQW1iaWVudCBBdWRpbyBDb250cm9sc1xuICBjb25zdCBiYXRBbVRoYW5oID0gKCkgPT4ge1xuICAgIHNldEhhc0ludGVyYWN0ZWRBdWRpbyh0cnVlKTtcbiAgICBpZiAoYXVkaW9SZWYuY3VycmVudCkge1xuICAgICAgYXVkaW9SZWYuY3VycmVudC5wbGF5KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHNldEF1ZGlvUGxheWluZyh0cnVlKTtcbiAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUud2FybignQXV0b3BsYXkgYmxvY2tlZCBvciBhdWRpbyBsb2FkIGVycm9yOicsIGVycik7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdG9nZ2xlQXVkaW9QbGF5ID0gKCkgPT4ge1xuICAgIGlmICghYXVkaW9SZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGlmIChhdWRpb1BsYXlpbmcpIHtcbiAgICAgIGF1ZGlvUmVmLmN1cnJlbnQucGF1c2UoKTtcbiAgICAgIHNldEF1ZGlvUGxheWluZyhmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJhdEFtVGhhbmgoKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdG9nZ2xlQXVkaW9NdXRlID0gKCkgPT4ge1xuICAgIGlmICghYXVkaW9SZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGNvbnN0IG5ld011dGUgPSAhYXVkaW9NdXRlZDtcbiAgICBhdWRpb1JlZi5jdXJyZW50Lm11dGVkID0gbmV3TXV0ZTtcbiAgICBzZXRBdWRpb011dGVkKG5ld011dGUpO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVZvbHVtZUNoYW5nZSA9IChlKSA9PiB7XG4gICAgY29uc3QgdmFsID0gcGFyc2VGbG9hdChlLnRhcmdldC52YWx1ZSk7XG4gICAgc2V0QXVkaW9Wb2x1bWUodmFsKTtcbiAgICBpZiAoYXVkaW9SZWYuY3VycmVudCkge1xuICAgICAgYXVkaW9SZWYuY3VycmVudC52b2x1bWUgPSB2YWw7XG4gICAgICBpZiAodmFsID4gMCAmJiBhdWRpb011dGVkKSB7XG4gICAgICAgIGF1ZGlvUmVmLmN1cnJlbnQubXV0ZWQgPSBmYWxzZTtcbiAgICAgICAgc2V0QXVkaW9NdXRlZChmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGlzQnJlYWsgPSBmb2N1c1N0YXRlLnBoYXNlID09PSAnYnJlYWsnO1xuICBjb25zdCBpc1J1bm5pbmcgPSBmb2N1c1N0YXRlLnN0YXR1cyA9PT0gJ3J1bm5pbmcnO1xuICBjb25zdCBkdXJhdGlvbiA9IGZvY3VzU3RhdGUuZHVyYXRpb25TZWNvbmRzIHx8IChpc0JyZWFrID8gMzAwIDogMTUwMCk7XG4gIGNvbnN0IHByb2dyZXNzUGVyY2VudCA9IE1hdGgubWluKDEwMCwgTWF0aC5tYXgoMCwgKChkdXJhdGlvbiAtIGxvY2FsUmVtYWluaW5nKSAvIGR1cmF0aW9uKSAqIDEwMCkpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC00IG1pbi13LTAgdy1mdWxsXCI+XG4gICAgICB7LyogSGlkZGVuIEF1ZGlvIGVsZW1lbnQgZm9yIGFtYmllbnQgc291bmR0cmFjayAqL31cbiAgICAgIHtuaGFjVXJsICYmIChcbiAgICAgICAgPGF1ZGlvXG4gICAgICAgICAgcmVmPXthdWRpb1JlZn1cbiAgICAgICAgICBzcmM9e25oYWNVcmx9XG4gICAgICAgICAgbG9vcFxuICAgICAgICAgIHByZWxvYWQ9XCJub25lXCJcbiAgICAgICAgICBvbkVuZGVkPXsoKSA9PiBzZXRBdWRpb1BsYXlpbmcoZmFsc2UpfVxuICAgICAgICAgIG9uRXJyb3I9eygpID0+IHNldEF1ZGlvUGxheWluZyhmYWxzZSl9XG4gICAgICAgIC8+XG4gICAgICApfVxuXG4gICAgICB7LyogSGVhZGVyIGJhcjogUHJlc2VuY2UsIEhvc3QgYmFkZ2UsIEZvY3VzIE1vZGUgdG9nZ2xlLCBDbG9zZSBSb29tICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTQgZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMyBzaGFkb3ctbGdcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2BweC0yLjUgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC1bMTBweF0gZm9udC1ib2xkIGJvcmRlciAke3Bob25nLnBoYW1WaSA9PT0gJ3RydW9uZycgPyAnYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTQwMCBib3JkZXItZW1lcmFsZC01MDAvMzAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgIHtwaG9uZy5waGFtVmkgPT09ICd0cnVvbmcnID8gJ1x1RDgzQ1x1REYxMCBUb1x1MDBFMG4gdHJcdTAxQjBcdTFFRERuZycgOiBgXHVEODNEXHVERDEyIExcdTFFREJwICR7cGhvbmcubG9wVGVuIHx8ICcnfWB9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGlkPVwiZm9jdXMtaG9zdC1iYWRnZVwiIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICBDaFx1MUVFNyBwaFx1MDBGMm5nOiA8c3Ryb25nIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtMjAwXCI+e3Bob25nLmNodVBob25nVGVufTwvc3Ryb25nPlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBpZD1cImZvY3VzLXJvb20tcHJlc2VuY2VcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBweC0yLjUgcHktMC41IHJvdW5kZWQtZnVsbCBiZy1bIzAwRjJGRV0vMTAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMjAgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgXHVEODNEXHVEQzY1IHtzb05ndW9pIHx8IDF9IG5nXHUwMUIwXHUxRUREaSBcdTAxMTFhbmcgY1x1MDBGOW5nIHRcdTFFQURwIHRydW5nXG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG1sLWF1dG9cIj5cbiAgICAgICAgICB7aXNGb2N1c01vZGUgJiYgKFxuICAgICAgICAgICAgPHNwYW4gaWQ9XCJmb2N1cy1tb2RlLWFjdGl2ZS1pbmRpY2F0b3JcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1wdXJwbGUtNDAwIGJnLXB1cnBsZS01MDAvMTAgcHgtMiBweS0wLjUgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItcHVycGxlLTUwMC8yMCBhbmltYXRlLXB1bHNlXCI+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REZBRiBcdTAxMTBhbmcgYlx1MUVBRHQgRm9jdXMgTW9kZVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICl9XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtbW9kZS10b2dnbGVcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc0ZvY3VzTW9kZSghaXNGb2N1c01vZGUpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke2lzRm9jdXNNb2RlID8gJ2JnLXB1cnBsZS01MDAvMjAgdGV4dC1wdXJwbGUtMzAwIGJvcmRlci1wdXJwbGUtNTAwLzQwIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgxNjgsODUsMjQ3LDAuMyldJyA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGQUY8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj57aXNGb2N1c01vZGUgPyAnXHUyMUE5IFRob1x1MDBFMXQgRm9jdXMgTW9kZScgOiAnRm9jdXMgTW9kZSd9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAge2NhbkNvbnRyb2wgJiYgcGhvbmcuY2h1UGhvbmdLaG9hICE9PSAnaGUtdGhvbmcnICYmIChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e2RvbmdQaG9uZ0hpZW5UYWl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTUgaG92ZXI6Ymctcm9zZS01MDAvMjUgdGV4dC1yb3NlLTMwMCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgIFx1MDExMFx1MDBGM25nIHBoXHUwMEYybmdcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBNYWluIEZvY3VzIENlbnRlcnBpZWNlIENhcmQgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YHJlbGF0aXZlIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLTN4bCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgcC02IHNtOnAtOCBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciB0ZXh0LWNlbnRlciBzaGFkb3ctMnhsICR7aXNCcmVhayA/ICdiZy1ncmFkaWVudC10by1iIGZyb20tWyMxRTE3MTBdIHRvLVsjMTMxMTBFXSBib3JkZXItYW1iZXItNTAwLzMwJyA6ICdiZy1ncmFkaWVudC10by1iIGZyb20tWyMwRjFFMjhdIHRvLVsjMEExMjE5XSBib3JkZXItWyMwMEYyRkVdLzMwJ31gfT5cbiAgICAgICAgey8qIEdsb3cgYmFja2Ryb3AgYWNjZW50ICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGFic29sdXRlIC10b3AtMjQgLWxlZnQtMjQgdy03MiBoLTcyIHJvdW5kZWQtZnVsbCBibHVyLTN4bCBvcGFjaXR5LTIwIHBvaW50ZXItZXZlbnRzLW5vbmUgJHtpc0JyZWFrID8gJ2JnLWFtYmVyLTUwMCcgOiAnYmctWyMwMEYyRkVdJ31gfSAvPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGFic29sdXRlIC1ib3R0b20tMjQgLXJpZ2h0LTI0IHctNzIgaC03MiByb3VuZGVkLWZ1bGwgYmx1ci0zeGwgb3BhY2l0eS0yMCBwb2ludGVyLWV2ZW50cy1ub25lICR7aXNCcmVhayA/ICdiZy1vcmFuZ2UtNTAwJyA6ICdiZy1pbmRpZ28tNTAwJ31gfSAvPlxuXG4gICAgICAgIHsvKiBQaGFzZSAmIFN0YXR1cyBCYWRnZXMgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0yLjUgbWItNiB6LTEwXCI+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGlkPVwiZm9jdXMtcGhhc2UtYmFkZ2VcIlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTEgcm91bmRlZC1mdWxsIHRleHQteHMgZm9udC1leHRyYWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIGJvcmRlciBzaGFkb3ctc20gJHtpc0JyZWFrID8gJ2JnLWFtYmVyLTUwMC8xNSB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJyA6ICdiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyLVsjMDBGMkZFXS80MCd9YH0+XG4gICAgICAgICAgICB7aXNCcmVhayA/ICdcdTI2MTUgR2lcdTFFREQgTmdoXHUxRUM5IE5nXHUwMUExaSAoQnJlYWspJyA6ICdcdUQ4M0NcdURGNDUgUGhpXHUwMEVBbiBUXHUxRUFEcCBUcnVuZyAoRm9jdXMpJ31cbiAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgaWQ9XCJmb2N1cy1zdGF0dXMtYmFkZ2VcIlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke2lzUnVubmluZyA/ICdiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtNDAwIGJvcmRlci1lbWVyYWxkLTUwMC8zMCcgOiAnYmctc2xhdGUtNTAwLzE1IHRleHQtc2xhdGUtNDAwIGJvcmRlci1zbGF0ZS01MDAvMzAnfWB9PlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdy0yIGgtMiByb3VuZGVkLWZ1bGwgJHtpc1J1bm5pbmcgPyAnYmctZW1lcmFsZC00MDAgYW5pbWF0ZS1wdWxzZScgOiAnYmctc2xhdGUtNDAwJ31gfSAvPlxuICAgICAgICAgICAgPHNwYW4+e2lzUnVubmluZyA/ICdcdTAxMTBhbmcgXHUwMTExXHUxRUJGbScgOiAnVFx1MUVBMW0gZFx1MUVFQm5nJ308L3NwYW4+XG4gICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtcHJlc2V0LXRvZ2dsZVwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGRpc2FibGVkPXshY2FuQ29udHJvbCB8fCBkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGNhbkNvbnRyb2wgJiYgZ3VpTGVuaCgnc2V0X3ByZXNldCcsIHsgcHJlc2V0OiBmb2N1c1N0YXRlLnByZXNldCA9PT0gJzUwXzEwJyA/ICcyNV81JyA6ICc1MF8xMCcgfSl9XG4gICAgICAgICAgICB0aXRsZT17Y2FuQ29udHJvbCA/ICdCXHUxRUE1bSBcdTAxMTFcdTFFQzMgXHUwMTExXHUxRUQ1aSBjaHUga1x1MUVGMyBQb21vZG9ybycgOiAnQ2h1IGtcdTFFRjMgUG9tb2Rvcm8gaGlcdTFFQzduIHRcdTFFQTFpJ31cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LW1vbm8gZm9udC1ib2xkIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke2NhbkNvbnRyb2wgPyAnaG92ZXI6c2NhbGUtMTA1IGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlciBiZy13aGl0ZS8xMCB0ZXh0LXdoaXRlIGJvcmRlci13aGl0ZS8yMCcgOiAnY3Vyc29yLWRlZmF1bHQgYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgXHUyNjk5XHVGRTBGIHtmb2N1c1N0YXRlLnByZXNldCA9PT0gJzUwXzEwJyA/ICc1MCAvIDEwIHBoXHUwMEZBdCcgOiAnMjUgLyA1IHBoXHUwMEZBdCd9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBNYXNzaXZlIFRpbWVyIERpc3BsYXkgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXktMiBzbTpteS00IHotMTBcIj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgaWQ9XCJmb2N1cy10aW1lci1kaXNwbGF5XCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGZvbnQtbW9ubyB0ZXh0LTZ4bCBzbTp0ZXh0LTh4bCBmb250LWJsYWNrIHRyYWNraW5nLXdpZGVzdCBibG9jayB0cmFuc2l0aW9uLWFsbCBzZWxlY3Qtbm9uZSAke2lzQnJlYWsgPyAndGV4dC1hbWJlci0zMDAgZHJvcC1zaGFkb3ctWzBfMF8zNXB4X3JnYmEoMjQ1LDE1OCwxMSwwLjM1KV0nIDogJ3RleHQtWyMwMEYyRkVdIGRyb3Atc2hhZG93LVswXzBfMzVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0nfWB9PlxuICAgICAgICAgICAge2RpbmhEYW5nR2lheVBodXQobG9jYWxSZW1haW5pbmcpfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIFByb2dyZXNzIGJhciAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgbWF4LXctbWQgaC0yIGJnLWJsYWNrLzQwIHJvdW5kZWQtZnVsbCBvdmVyZmxvdy1oaWRkZW4gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBteS00IHotMTBcIj5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BoLWZ1bGwgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMTAwMCAke2lzQnJlYWsgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1vcmFuZ2UtNTAwJyA6ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjM0I4MkY2XSd9YH1cbiAgICAgICAgICAgIHN0eWxlPXt7IHdpZHRoOiBgJHtwcm9ncmVzc1BlcmNlbnR9JWAgfX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogQ29udHJvbCBCdXR0b25zIGZvciBIb3N0L1RlYWNoZXIgKi99XG4gICAgICAgIHtjYW5Db250cm9sID8gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0zIG10LTQgei0xMFwiPlxuICAgICAgICAgICAgeyFpc1J1bm5pbmcgPyAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1zdGFydFwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3N0YXJ0Jyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNiBweS0zIHJvdW5kZWQtMnhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1lbWVyYWxkLTQwMCB0by10ZWFsLTUwMCBob3Zlcjpmcm9tLWVtZXJhbGQtMzAwIGhvdmVyOnRvLXRlYWwtNDAwIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXNtIHNoYWRvdy1bMF8wXzIwcHhfcmdiYSg1MiwyMTEsMTUzLDAuMyldIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyNUI2PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPkJcdTFFQUZ0IFx1MDExMVx1MUVBN3U8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXBhdXNlXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgncGF1c2UnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC02IHB5LTMgcm91bmRlZC0yeGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1vcmFuZ2UtNTAwIGhvdmVyOmZyb20tYW1iZXItMzAwIGhvdmVyOnRvLW9yYW5nZS00MDAgdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQtc20gc2hhZG93LVswXzBfMjBweF9yZ2JhKDI1MSwxOTEsMzYsMC4zKV0gYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTIzRjg8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+VFx1MUVBMW0gZFx1MUVFQm5nPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtcmVzZXRcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdyZXNldCcpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTMgcm91bmRlZC0yeGwgYmctd2hpdGUvMTAgaG92ZXI6Ymctd2hpdGUvMTUgdGV4dC1zbGF0ZS0yMDAgdGV4dC1zbSBmb250LWJvbGQgYm9yZGVyIGJvcmRlci13aGl0ZS8xNSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwNDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+XHUwMTEwXHUxRUI3dCBsXHUxRUExaTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICB7aXNCcmVhayA/IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXN0YXJ0LWZvY3VzXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgnc3RhcnRfZm9jdXMnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTMgcm91bmRlZC0yeGwgYmctWyMwMEYyRkVdLzIwIGhvdmVyOmJnLVsjMDBGMkZFXS8zMCB0ZXh0LVsjMDBGMkZFXSB0ZXh0LXNtIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkFGPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlZcdTAwRTBvIFRcdTFFQURwIHRydW5nPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1zdGFydC1icmVha1wiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3N0YXJ0X2JyZWFrJyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0zIHJvdW5kZWQtMnhsIGJnLWFtYmVyLTUwMC8yMCBob3ZlcjpiZy1hbWJlci01MDAvMzAgdGV4dC1hbWJlci0zMDAgdGV4dC1zbSBmb250LWJvbGQgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvNDAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjYxNTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5OZ2hcdTFFQzkgbmdcdTAxQTFpPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBtdC0zIHotMTBcIj5cbiAgICAgICAgICAgIFx1MjNGMyBcdTAxMTBcdTFFRDNuZyBoXHUxRUQzIFBvbW9kb3JvIGRvIGNoXHUxRUU3IHBoXHUwMEYybmcgXHUwMTExaVx1MUVDMXUgcGhcdTFFRDFpIFx1MjAxNCBoXHUwMEUzeSB0XHUxRUFEcCB0cnVuZyBoXHUxRUJGdCBtXHUwMEVDbmggdlx1MDBFMG8gY1x1MDBGNG5nIHZpXHUxRUM3Yy9oXHUxRUNEYyB0XHUxRUFEcCBuaFx1MDBFOSFcbiAgICAgICAgICA8L3A+XG4gICAgICAgICl9XG5cbiAgICAgICAge2xvaSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtcm9zZS00MDAgbXQtNCB6LTEwXCI+e2xvaX08L3A+fVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBBbWJpZW50IEF1ZGlvIFBsYXllciBDYXJkICovfVxuICAgICAge25oYWNVcmwgPyAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC00IHNtOnAtNSBmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTQgc2hhZG93LXhsXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMy41IG1pbi13LTAgdy1mdWxsIHNtOnctYXV0b1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2B3LTEyIGgtMTIgcm91bmRlZC0yeGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC14bCBzaHJpbmstMCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHthdWRpb1BsYXlpbmcgPyAnYmctWyM4QjVDRjZdLzIwIHRleHQtWyM4QjVDRjZdIGJvcmRlci1bIzhCNUNGNl0vNDAgc2hhZG93LVswXzBfMTVweF9yZ2JhKDEzOSw5MiwyNDYsMC4zKV0gYW5pbWF0ZS1wdWxzZScgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGQTdcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4tdy0wXCI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtd2hpdGUgdHJ1bmNhdGVcIj5cdTAwQzJtIHRoYW5oIG5cdTFFQzFuIEFtYmllbnQ8L3A+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAge2F1ZGlvUGxheWluZyA/ICdcdTAxMTBhbmcgcGhcdTAwRTF0IGtoXHUwMEY0bmcgZ2lhbiBoXHUxRUNEYyB0XHUxRUFEcCcgOiAnXHUwMEMybSB0aGFuaCBjXHUxRUU1YyBiXHUxRUQ5IHRoZW8gdGhpXHUxRUJGdCBiXHUxRUNCJ31cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBnYXAtMyB3LWZ1bGwgc206dy1hdXRvIGp1c3RpZnktZW5kXCI+XG4gICAgICAgICAgICB7IWhhc0ludGVyYWN0ZWRBdWRpbyAmJiAhYXVkaW9QbGF5aW5nICYmIChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLXN0YXJ0LWZvY3VzLWF1ZGlvXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXtiYXRBbVRoYW5ofVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMiByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzhCNUNGNl0gdG8tWyM2MzY2RjFdIHRleHQtd2hpdGUgdGV4dC14cyBmb250LWJvbGQgc2hhZG93LWxnIGhvdmVyOm9wYWNpdHktOTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDBBPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPkJcdTFFQUR0IFx1MDBFMm0gdGhhbmggdFx1MUVBRHAgdHJ1bmc8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImZvY3VzLWF1ZGlvLXRvZ2dsZVwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVBdWRpb1BsYXl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMS41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHthdWRpb1BsYXlpbmcgPyAnYmctWyM4QjVDRjZdLzIwIHRleHQtWyM4QjVDRjZdIGJvcmRlci1bIzhCNUNGNl0vNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAgPHNwYW4+e2F1ZGlvUGxheWluZyA/ICdcdTIzRjggVFx1MUVBMW0gZFx1MUVFQm5nJyA6ICdcdTI1QjYgUGhcdTAwRTF0IHRpXHUxRUJGcCd9PC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e3RvZ2dsZUF1ZGlvTXV0ZX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0yIHJvdW5kZWQteGwgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQteHMgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAge2F1ZGlvTXV0ZWQgfHwgYXVkaW9Wb2x1bWUgPT09IDAgPyAnXHVEODNEXHVERDA3JyA6ICdcdUQ4M0RcdUREMDknfVxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICB0eXBlPVwicmFuZ2VcIlxuICAgICAgICAgICAgICBtaW49XCIwXCJcbiAgICAgICAgICAgICAgbWF4PVwiMVwiXG4gICAgICAgICAgICAgIHN0ZXA9XCIwLjA1XCJcbiAgICAgICAgICAgICAgdmFsdWU9e2F1ZGlvTXV0ZWQgPyAwIDogYXVkaW9Wb2x1bWV9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVWb2x1bWVDaGFuZ2V9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMjQgaC0xLjUgYmctd2hpdGUvMTAgcm91bmRlZC1sZyBhcHBlYXJhbmNlLW5vbmUgY3Vyc29yLXBvaW50ZXIgYWNjZW50LVsjOEI1Q0Y2XVwiXG4gICAgICAgICAgICAgIHRpdGxlPVwiXHUwMEMybSBsXHUwMUIwXHUxRUUzbmcgbmhcdTFFQTFjIG5cdTFFQzFuXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKSA6IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQtMnhsIHAtNCB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwXCI+XG4gICAgICAgICAgICBcdTI2MTUgUGhcdTAwRjJuZyBcdTFFREYgY2hcdTFFQkYgXHUwMTExXHUxRUQ5IHRcdTAxMjluaCBsXHUxRUI3bmcgKGNoXHUwMUIwYSBnXHUxRUFGbiBsaW5rIFx1MDBFMm0gdGhhbmggblx1MUVDMW4pIFx1MjAxNCBDaHV5XHUwMEVBbiB0XHUwMEUybSB0XHUxRUQxaSBcdTAxMTFhIHZcdTAwRTBvIGJcdTAwRTBpIHZcdTFFREYuXG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHtwaG9uZy5tb1RhICYmIChcbiAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgcHgtMiBsZWFkaW5nLXJlbGF4ZWRcIj5cbiAgICAgICAgICB7cGhvbmcubW9UYX1cbiAgICAgICAgPC9wPlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICJBQUFBLE1BQU0sRUFBRSxVQUFVLFdBQVcsT0FBTyxJQUFJO0FBQ3hDLFNBQVMsa0JBQWtCLG9CQUFvQixlQUFlLFdBQVcsbUJBQW1CLHFCQUFxQixrQkFBa0I7QUFLbkksTUFBTSxhQUFhLENBQUMsT0FBTyxNQUFNO0FBQUUsTUFBSSxTQUFTLG9CQUFvQixVQUFXLElBQUc7QUFBRztBQUk5RSxnQkFBUyxXQUFXLEVBQUUsT0FBTyxVQUFVLEdBQUc7QUFDL0MsUUFBTSxDQUFDLEdBQUcsSUFBSSxJQUFJLE1BQU0sU0FBUyxFQUFFO0FBQ25DLFFBQU0sS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTO0FBQzdCLFNBQ0Usb0NBQUMsU0FBSSxXQUFVLCtCQUNiO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFLO0FBQUEsTUFDTCxPQUFPO0FBQUEsTUFDUCxVQUFVLE9BQUssS0FBSyxFQUFFLE9BQU8sS0FBSztBQUFBLE1BQ2xDLFdBQVcsT0FBSztBQUFFLFlBQUksRUFBRSxRQUFRLFdBQVcsSUFBSTtBQUFFLFlBQUUsZUFBZTtBQUFHLGdCQUFNLEVBQUUsS0FBSyxDQUFDO0FBQUcsZUFBSyxFQUFFO0FBQUEsUUFBRztBQUFBLE1BQUU7QUFBQSxNQUNsRyxhQUFZO0FBQUEsTUFDWixXQUFVO0FBQUE7QUFBQSxFQUNaLEdBQ0E7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUFPLE1BQUs7QUFBQSxNQUFTLElBQUc7QUFBQSxNQUFxQixVQUFVLENBQUM7QUFBQSxNQUN2RCxTQUFTLE1BQU07QUFBRSxrQkFBVSxFQUFFLEtBQUssQ0FBQztBQUFHLGFBQUssRUFB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
