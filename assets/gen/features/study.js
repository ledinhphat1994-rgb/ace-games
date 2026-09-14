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
  const queueListRef = useRef(queueList);
  queueListRef.current = queueList;
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
          if (d.videoUrl) {
            durationRef.current = 0;
            setDuration(0);
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
            const finalDur = durationRef.current || duration || localTime;
            if (finalDur > 0) setLocalTime(Math.floor(finalDur));
            if (d.state) {
              setWatchState(d.state);
            } else {
              setWatchState((prev) => ({ ...prev, playing: false, positionSeconds: finalDur }));
            }
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
  const handleVideoEnded = () => {
    const hasNextInQueue = queueListRef.current && queueListRef.current.length > 0;
    if (canControl && hasNextInQueue) {
      if (!isSkippingRef.current && !hasTriggeredSkipRef.current) {
        console.log("Video k\u1EBFt th\xFAc -> t\u1EF1 \u0111\u1ED9ng chuy\u1EC3n ti\u1EBFp h\xE0ng \u0111\u1EE3i");
        hanhDongQueue("skip");
      }
      return;
    }
    console.log("Video k\u1EBFt th\xFAc -> T\u1EA1m d\u1EEBng ph\xE1t video t\u1EA1i \u0111i\u1EC3m cu\u1ED1i cho to\xE0n b\u1ED9 ph\xF2ng");
    hasTriggeredSkipRef.current = true;
    isSkippingRef.current = false;
    const finalDur = durationRef.current || duration || localTime;
    if (finalDur > 0) {
      setLocalTime(Math.floor(finalDur));
    }
    if (provider === "YOUTUBE") {
      if (ytPlayerRef.current?.pauseVideo) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {
        }
      }
      const ifr = document.getElementById(ytContainerId);
      ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
    } else if (provider === "NATIVE_HTML5" && videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
      }
    }
    if (canControl) {
      const targetPos = finalDur > 0 ? Number(finalDur.toFixed(2)) : void 0;
      guiLenhRef.current?.("pause", targetPos);
    } else {
      setViewerIsPaused(true);
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
  const lastGoLiveClickTimeRef = useRef(0);
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
    const maxDur = durationRef.current || duration;
    if (maxDur > 0) {
      if (!st?.playing && targetPos >= maxDur - 2.5) {
        targetPos = maxDur;
      } else {
        targetPos = Math.min(targetPos, maxDur);
      }
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
        const maxDur = durationRef.current || duration;
        const clampedCur = maxDur > 0 ? Math.min(cur, maxDur) : cur;
        setLocalTime(Math.floor(clampedCur));
      }
      const pState = data.event === "onStateChange" ? typeof data.info === "number" ? data.info : data.info?.playerState : data.event === "infoDelivery" ? data.info?.playerState : void 0;
      if (canControl && !dangGuiLenhRef.current && !isSeekingRef.current) {
        const curTime = !isNaN(cur) && cur >= 0 ? cur : void 0;
        if (pState === 1 && !watchStateRef.current.playing) {
          console.log("V\xF9ng 2: Ch\u1EE7 ph\xF2ng b\u1EA5m Play tr\xEAn YouTube -> \u0111\u1ED3ng b\u1ED9 c\u1EA3 ph\xF2ng");
          guiLenhRef.current?.("play", curTime);
        } else if (pState === 2 && watchStateRef.current.playing) {
          const maxDur = durationRef.current || duration;
          if (maxDur > 5 && curTime !== void 0 && curTime >= maxDur - 2.5) {
            console.log("Video ch\u1EA1m ng\u01B0\u1EE1ng cu\u1ED1i -> k\xEDch ho\u1EA1t handleVideoEnded thay v\xEC pause l\u1EEDng l\u01A1");
            handleVideoEnded();
          } else {
            console.log("V\xF9ng 2: Ch\u1EE7 ph\xF2ng b\u1EA5m Pause tr\xEAn YouTube -> \u0111\u1ED3ng b\u1ED9 c\u1EA3 ph\xF2ng");
            guiLenhRef.current?.("pause", curTime);
          }
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
      } else if (!canControl && !isProgrammaticActionRef.current && Date.now() - lastGoLiveClickTimeRef.current > 3500) {
        if (pState === 2 && watchStateRef.current.playing) {
          console.log("onMsg: Ng\u01B0\u1EDDi xem t\u1EF1 b\u1EA5m T\u1EA1m d\u1EEBng tr\xEAn YouTube -> chuy\u1EC3n sang xem ri\xEAng");
          isLiveWithHostRef.current = false;
          setIsLiveWithHost(false);
          setViewerIsPaused(true);
        } else if (pState === 1) {
          setViewerIsPaused(false);
        }
      }
      const isEnded = data.event === "onStateChange" && (data.info === 0 || data.info?.playerState === 0) || data.event === "infoDelivery" && data.info?.playerState === 0 || data.info && data.info.playerState === 0;
      if (isEnded) {
        handleVideoEnded();
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
                handleVideoEnded();
                return;
              }
              if (canControl && !dangGuiLenhRef.current && !isSeekingRef.current) {
                const curPos = typeof event.target?.getCurrentTime === "function" ? event.target.getCurrentTime() : void 0;
                if (event.data === 1 && !watchStateRef.current.playing) {
                  console.log("YT Player onStateChange === 1 -> \u0111\u1ED3ng b\u1ED9 Play c\u1EA3 ph\xF2ng");
                  guiLenhRef.current?.("play", curPos);
                } else if (event.data === 2 && watchStateRef.current.playing) {
                  const maxDur = durationRef.current || duration;
                  if (maxDur > 5 && curPos !== void 0 && curPos >= maxDur - 2.5) {
                    console.log("YT onStateChange === 2 ch\u1EA1m ng\u01B0\u1EE1ng cu\u1ED1i -> k\xEDch ho\u1EA1t handleVideoEnded");
                    handleVideoEnded();
                  } else {
                    console.log("YT Player onStateChange === 2 -> \u0111\u1ED3ng b\u1ED9 Pause c\u1EA3 ph\xF2ng");
                    guiLenhRef.current?.("pause", curPos);
                  }
                }
              } else if (!canControl && !isProgrammaticActionRef.current && Date.now() - lastGoLiveClickTimeRef.current > 3500) {
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
    const maxDur = durationRef.current || duration;
    if (maxDur > 0) {
      if (!st.playing && targetPos >= maxDur - 2.5) {
        targetPos = maxDur;
      } else {
        targetPos = Math.min(targetPos, maxDur);
      }
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
    if (maxDur > 0 && targetPos >= maxDur) {
      setLocalTime(Math.floor(maxDur));
      if (prov === "NATIVE_HTML5" && videoRef.current) {
        try {
          videoRef.current.currentTime = maxDur;
          videoRef.current.pause();
        } catch {
        }
      } else if (prov === "YOUTUBE") {
        const p = ytPlayerRef.current;
        const ifr = document.getElementById(ytContainerId);
        if (p?.seekTo) {
          try {
            p.seekTo(maxDur, true);
          } catch {
          }
        }
        ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [maxDur, true] }), "*");
        if (p?.pauseVideo) {
          try {
            p.pauseVideo();
          } catch {
          }
        }
        ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
      }
      setViewerIsPaused(true);
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
          setViewerIsPaused(false);
        } else {
          v.pause();
          v.currentTime = Number(st.positionSeconds || 0);
          setLocalTime(Math.floor(Number(st.positionSeconds || 0)));
          setViewerIsPaused(true);
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
          ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
          const pSec = Number(st.positionSeconds || 0);
          if (p?.seekTo) {
            try {
              p.seekTo(pSec, true);
            } catch {
            }
          }
          ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [pSec, true] }), "*");
          setLocalTime(Math.floor(pSec));
          setViewerIsPaused(true);
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
            ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
          }
          setLocalTime(Math.floor(targetPos));
          setViewerIsPaused(false);
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
            ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
          }
        } else {
          if (ps === 1 || ps === 3) {
            if (p?.pauseVideo) {
              try {
                p.pauseVideo();
              } catch {
              }
            }
            ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
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
          ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
        } else if (!st.playing) {
          if (p?.pauseVideo) {
            try {
              p.pauseVideo();
            } catch {
            }
          }
          ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
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
    const onUnload = () => {
      if (canControl && watchStateRef.current?.playing) {
        try {
          const payload = JSON.stringify({
            phongId: phong.id,
            action: "pause",
            position: localTime,
            expectedRevision: watchStateRef.current.revision,
            playbackRate: 1
          });
          navigator.sendBeacon("/api/phong-watch", new Blob([payload], { type: "application/json" }));
        } catch {
        }
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [canControl, phong.id, localTime]);
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
              const maxDur2 = durationRef.current || duration;
              const clampedCur = maxDur2 > 0 ? Math.min(cur, maxDur2) : cur;
              setLocalTime(Math.floor(clampedCur));
            }
          }
          if (p.getPlayerState && p.getPlayerState() === 0) {
            handleVideoEnded();
            return;
          }
        } catch {
        }
      } else if (provider === "NATIVE_HTML5" && videoRef.current) {
        const cur = videoRef.current.currentTime;
        if (!isNaN(cur)) {
          curTime = cur;
          const maxDur2 = durationRef.current || duration;
          const clampedCur = maxDur2 > 0 ? Math.min(cur, maxDur2) : cur;
          setLocalTime(Math.floor(clampedCur));
        }
      }
      const maxDur = durationRef.current || duration;
      const currentPos = curTime !== null ? curTime : localTime;
      if (maxDur > 5 && (currentPos >= maxDur - 1 || localTime >= maxDur)) {
        handleVideoEnded();
        return;
      }
      if (canControl && curTime !== null && curTime > 0 && !dangGuiLenhRef.current && !isSeekingRef.current) {
        const nowMs = Date.now();
        if (!lastHostSyncTimeRef.current) lastHostSyncTimeRef.current = nowMs;
        const updateTimeMs = watchState.updatedAt ? (/* @__PURE__ */ new Date(String(watchState.updatedAt).replace(" ", "T") + (String(watchState.updatedAt).includes("T") ? "" : "Z"))).getTime() : nowMs;
        const elapsedSec = Math.max(0, (nowMs - updateTimeMs) / 1e3);
        const expectedServerPos = Number(watchState.basePositionSeconds != null ? watchState.basePositionSeconds : watchState.positionSeconds) + elapsedSec * (watchState.playbackRate || 1);
        const hostDrift = Math.abs(curTime - expectedServerPos);
        const daQua15s = nowMs - lastHostSyncTimeRef.current > 15e3;
        if ((hostDrift > 3 || daQua15s) && nowMs - lastHostSyncTimeRef.current > 4e3) {
          lastHostSyncTimeRef.current = nowMs;
          guiLenh("seek", curTime);
        }
      }
      if (curTime === null) {
        setLocalTime((t) => {
          if (maxDur > 0) {
            if (t >= maxDur) return Math.floor(maxDur);
            return Math.min(t + 1, Math.floor(maxDur));
          }
          return t + 1;
        });
      }
    }, 1e3);
    return () => clearInterval(tick);
  }, [watchState.playing, viewerIsPaused, isLiveWithHost, provider, duration, localTime, canControl]);
  const pendingGuiLenhRef = useRef(null);
  const guiLenh = async (action, customPos) => {
    if (dangGuiLenhRef.current) {
      pendingGuiLenhRef.current = { action, customPos };
      return;
    }
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
        ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
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
        ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
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
      const currentRev = watchStateRef.current?.revision || watchState.revision || 1;
      const res = await fetch("/api/phong-watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phongId: phong.id,
          action,
          position: pos,
          expectedRevision: currentRev,
          playbackRate: watchStateRef.current?.playbackRate || watchState.playbackRate || 1
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
      if (pendingGuiLenhRef.current) {
        const next = pendingGuiLenhRef.current;
        pendingGuiLenhRef.current = null;
        guiLenh(next.action, next.customPos);
      }
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
        ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
      } else {
        if (ytPlayerRef.current?.pauseVideo) {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch {
          }
        }
        ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
      }
    }
  };
  const handleGoLive = () => {
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      setHasInteracted(true);
    }
    isProgrammaticActionRef.current = true;
    lastGoLiveClickTimeRef.current = Date.now();
    let targetPos = getHostCurrentPos();
    const maxDur = durationRef.current || duration;
    const isVideoEnded = maxDur > 0 && (targetPos >= maxDur - 1.5 || !watchState.playing && targetPos >= maxDur - 3);
    if (isVideoEnded) {
      targetPos = maxDur;
    } else if (maxDur > 0 && targetPos > maxDur) {
      targetPos = maxDur;
    }
    setLocalTime(Math.floor(targetPos));
    isLiveWithHostRef.current = true;
    setIsLiveWithHost(true);
    setViewerIsPaused(!watchState.playing || isVideoEnded);
    lastAppliedRevisionRef.current = watchState.revision;
    if (provider === "NATIVE_HTML5" && videoRef.current) {
      videoRef.current.currentTime = targetPos;
      if (watchState.playing && !isVideoEnded) {
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
      if (watchState.playing && !isVideoEnded) {
        if (ytPlayerRef.current?.playVideo) {
          try {
            ytPlayerRef.current.playVideo();
          } catch {
          }
        }
        ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
      } else {
        if (ytPlayerRef.current?.pauseVideo) {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch {
          }
        }
        ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
      }
    }
    setTimeout(() => {
      isProgrammaticActionRef.current = false;
    }, 3500);
  };
  const handleHostTogglePlay = () => {
    if (watchState.playing) {
      guiLenh("pause");
    } else {
      const maxDur = durationRef.current || duration;
      hasTriggeredSkipRef.current = false;
      isSkippingRef.current = false;
      if (maxDur > 0 && localTime >= maxDur - 1.5) {
        setLocalTime(0);
        guiLenh("seek", 0);
        setTimeout(() => guiLenh("play", 0), 100);
      } else {
        guiLenh("play");
      }
    }
  };
  const handleViewerTogglePlay = () => {
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      setHasInteracted(true);
    }
    if (viewerIsPaused) {
      const maxDur = durationRef.current || duration;
      let startSec = localTime;
      if (maxDur > 0 && localTime >= maxDur - 1.5) {
        startSec = 0;
        setLocalTime(0);
      }
      setViewerIsPaused(false);
      if (provider === "NATIVE_HTML5" && videoRef.current) {
        if (startSec === 0) videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
        });
      } else if (provider === "YOUTUBE") {
        if (startSec === 0) {
          if (ytPlayerRef.current?.seekTo) {
            try {
              ytPlayerRef.current.seekTo(0, true);
            } catch {
            }
          }
          const ifr2 = document.getElementById(ytContainerId);
          ifr2?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [0, true] }), "*");
        }
        if (ytPlayerRef.current?.playVideo) {
          try {
            ytPlayerRef.current.playVideo();
          } catch {
          }
        }
        const ifr = document.getElementById(ytContainerId);
        ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
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
        ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
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
          handleVideoEnded();
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
      onClick: handleHostTogglePlay,
      disabled: dangGuiLenh,
      className: `w-full sm:w-auto px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-50 ${watchState.playing ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]" : "bg-gradient-to-r from-[#00F2FE] to-[#00c6ff] text-black shadow-[0_0_15px_rgba(0,242,254,0.35)] hover:brightness-110"}`
    },
    /* @__PURE__ */ React.createElement("span", null, watchState.playing ? "\u23F8" : "\u25B6"),
    /* @__PURE__ */ React.createElement("span", null, watchState.playing ? "T\u1EA1m D\u1EEBng C\u1EA3 Ph\xF2ng" : (() => {
      const maxDur = durationRef.current || duration;
      if (maxDur > 0 && localTime >= maxDur - 1.5) {
        return "Ph\xE1t L\u1EA1i C\u1EA3 Ph\xF2ng";
      }
      return "Ph\xE1t Chung C\u1EA3 Ph\xF2ng";
    })())
  ), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex items-center gap-2.5 w-full" }, /* @__PURE__ */ React.createElement("span", { id: "host-duration-label", className: "text-[11px] font-mono text-slate-400 shrink-0" }, dinhDangGiayPhut(localTime)), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "host-seek-slider",
      type: "range",
      min: "0",
      max: duration > 0 ? duration : durationRef.current > 0 ? durationRef.current : Math.max(localTime, 300),
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
        hasTriggeredSkipRef.current = false;
        guiLenh("seek", Number(e.target.value));
      },
      onTouchEnd: (e) => {
        isSeekingRef.current = false;
        hasTriggeredSkipRef.current = false;
        guiLenh("seek", Number(e.target.value));
      },
      className: "flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00F2FE]"
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono text-slate-400 shrink-0" }, duration > 0 ? dinhDangGiayPhut(duration) : durationRef.current > 0 ? dinhDangGiayPhut(durationRef.current) : "--:--"))), !canControl && (provider === "NATIVE_HTML5" || provider === "YOUTUBE") && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-white/10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 w-full sm:w-auto" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-viewer-watch-toggle",
      type: "button",
      onClick: handleViewerTogglePlay,
      className: `w-full sm:w-auto px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer ${viewerIsPaused ? "bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-black shadow-[0_0_15px_rgba(0,242,254,0.35)] hover:brightness-110" : "bg-white/10 text-white border border-white/15 hover:bg-white/15"}`
    },
    /* @__PURE__ */ React.createElement("span", null, viewerIsPaused ? "\u25B6" : "\u23F8"),
    /* @__PURE__ */ React.createElement("span", null, viewerIsPaused ? (() => {
      const maxDur = durationRef.current || duration;
      if (maxDur > 0 && localTime >= maxDur - 1.5) return "Ph\xE1t L\u1EA1i Video";
      return "Ti\u1EBFp T\u1EE5c Xem";
    })() : "T\u1EA1m D\u1EEBng Video")
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
    /* @__PURE__ */ React.createElement("span", null, isLiveWithHost ? "Tr\u1EF1c Ti\u1EBFp" : (() => {
      if (!watchState.playing) {
        return "Tr\u1EF1c Ti\u1EBFp (Ch\u1EE7 ph\xF2ng t\u1EA1m d\u1EEBng)";
      }
      const maxDur = durationRef.current || duration;
      const hPos = getHostCurrentPos();
      if (maxDur > 0 && hPos >= maxDur - 1) {
        return "Tr\u1EF1c Ti\u1EBFp (H\u1EBFt video)";
      }
      const d = Math.round(hPos - localTime);
      return d > 2 ? `Tr\u1EF1c Ti\u1EBFp (Ch\u1EADm ${d > 60 ? dinhDangGiayPhut(d) : d + "s"})` : "V\xE0o Tr\u1EF1c Ti\u1EBFp";
    })())
  )), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex items-center gap-2.5 w-full" }, /* @__PURE__ */ React.createElement("span", { id: "viewer-duration-label", className: "text-[11px] font-mono text-slate-400 shrink-0" }, dinhDangGiayPhut(localTime)), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "viewer-seek-slider",
      type: "range",
      min: "0",
      max: duration > 0 ? duration : durationRef.current > 0 ? durationRef.current : Math.max(localTime, 300),
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
  ), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono text-slate-400 shrink-0" }, duration > 0 ? dinhDangGiayPhut(duration) : durationRef.current > 0 ? dinhDangGiayPhut(durationRef.current) : "--:--"))), loi && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-400" }, loi), phong.moTa && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 leading-relaxed pt-1" }, phong.moTa)), !isRoomWide && /* @__PURE__ */ React.createElement("div", { id: "vung1-youtube-studio", style: { overflowAnchor: "none" }, className: "bg-gradient-to-b from-[#161b26] to-[#0f141d] border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 pb-2.5 border-b border-white/10 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-8 h-8 rounded-xl bg-gradient-to-br from-[#00F2FE]/20 to-violet-500/20 text-[#00F2FE] border border-[#00F2FE]/30 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(0,242,254,0.25)]" }, "\u{1F3AC}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "text-xs sm:text-sm font-black text-white flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "C\u1EA5u h\xECnh Video & H\xE0ng \u0111\u1EE3i YouTube"), queueList.filter((q) => q.trangThai === "queued").length > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded-full bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 text-[10px] font-bold" }, queueList.filter((q) => q.trangThai === "queued").length, " \u0111ang ch\u1EDD")), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-400" }, "T\xECm ki\u1EBFm video, \u0111\u01B0a v\xE0o h\xE0ng ch\u1EDD v\xE0 ch\u1EA1y video kh\xE1c \u0111\u1ED3ng b\u1ED9 c\u1EA3 ph\xF2ng"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center bg-[#0B0E14] p-1 rounded-xl border border-white/10" }, /* @__PURE__ */ React.createElement(
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvc3R1ZHkuanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9ID0gUmVhY3Q7XG5pbXBvcnQgeyBkaW5oRGFuZ0dpYXlQaHV0LCBnaXVOZ3V5ZW5WaVRyaUN1b24sIGlkR29vZ2xlRHJpdmUsIGlkWW91dHViZSwgbGFWaWRlb1RydWNUaWVwRmUsIG5hcFlvdVR1YmVJZnJhbWVBcGksIHVybE1lZGlhRmUgfSBmcm9tICcuLi9saWIvaGVscGVycy5qcyc7XG5cbi8vIEJcdTFFQ0YgcXVhIHRpY2sga2hpIHRhYiBcdTAxMTFhbmcgXHUxRURGIE5cdTFFQzBOIFx1MjAxNCB0clx1MDBFMW5oIGNcdTFFRDluZyBkXHUxRUQzbiByZXF1ZXN0IENsb3VkZmxhcmUgdlx1MDBGNCBcdTAwRURjaCBraGkga2hcdTAwRjRuZyBhaSB4ZW0uXG4vLyBLaFx1MDBGNG5nIGRcdTAwRjluZyBjaG8gcG9sbCB0XHUwMEVEbiBoaVx1MUVDN3UgdGhcdTFFRERpIGdpYW4gdGhcdTFFRjFjICh2ZCB2b2ljZSBzaWduYWxpbmcpIHZcdTAwRUMgYlx1MUVDRiBsXHUxRUUxIHRpY2sgY1x1MDBGMyB0aFx1MUVDMyBsXHUwMEUwbSB0cmVvXG4vLyBiXHUxRUFGdCB0YXkga1x1MUVCRnQgblx1MUVEMWkgaG9cdTFFQjdjIHRyXHUxRUM1IHRcdTAwRURuIGhpXHUxRUM3dSBcInJcdTFFRERpIHZvaWNlXCIgY1x1MUVFN2EgbmdcdTAxQjBcdTFFRERpIGtpYS5cbmNvbnN0IGtoaUhpZW5UaGkgPSAoZm4pID0+ICgpID0+IHsgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnKSBmbigpOyB9O1xuXG5cbi8vIFx1MDBENCBuaFx1MUVBRHAgbGluayB0aFx1MDBFQW0gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgXHUyMDE0IGRcdTAwRjluZyBjaHVuZyBjaG8gU3R1ZHlEb2NrIHZcdTAwRTAgQ2FtcHVzV2F0Y2hUb2dldGhlclxuZXhwb3J0IGZ1bmN0aW9uIFF1ZXVlSW5wdXQoeyBvbkFkZCwgb25BZGROZXh0IH0pIHtcbiAgY29uc3QgW3YsIHNldFZdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBvayA9IHYudHJpbSgpLmxlbmd0aCA+IDA7XG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICA8aW5wdXRcbiAgICAgICAgaWQ9XCJpbnB1dC1xdWV1ZS1hZGRcIlxuICAgICAgICB0eXBlPVwidXJsXCJcbiAgICAgICAgdmFsdWU9e3Z9XG4gICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFYoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICBvbktleURvd249e2UgPT4geyBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgb2spIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBvbkFkZCh2LnRyaW0oKSk7IHNldFYoJycpOyB9IH19XG4gICAgICAgIHBsYWNlaG9sZGVyPVwiVGhcdTAwRUFtIGxpbmsgdmlkZW8gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcdTIwMjZcIlxuICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0yLjUgcHktMS41IHRleHQtWzExcHhdIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgIC8+XG4gICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBpZD1cImJ0bi1xdWV1ZS1hZGQtbmV4dFwiIGRpc2FibGVkPXshb2t9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHsgb25BZGROZXh0KHYudHJpbSgpKTsgc2V0VignJyk7IH19XG4gICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy12aW9sZXQtNTAwLzE1IHRleHQtdmlvbGV0LTMwMCBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLXZpb2xldC01MDAvMjUgZGlzYWJsZWQ6b3BhY2l0eS0zMCB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxuICAgICAgICArUGhcdTAwRTF0IGtcdTFFQkZcbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJidG4tcXVldWUtZW5xdWV1ZVwiIGRpc2FibGVkPXshb2t9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHsgb25BZGQodi50cmltKCkpOyBzZXRWKCcnKTsgfX1cbiAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctWyMwMEYyRkVdLzI1IGRpc2FibGVkOm9wYWNpdHktMzAgd2hpdGVzcGFjZS1ub3dyYXBcIj5cbiAgICAgICAgK0N1XHUxRUQxaSBoXHUwMEUwbmdcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgU1RVRFkgRE9DSzogS0hcdTAwRDRORyBHSUFOIENcdTFFRDhORyBUXHUwMEMxQyBQSFx1MDBEMk5HIFlPVVRVQkUgKFBIQVNFIDRGKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBmdW5jdGlvbiBTdHVkeURvY2soeyBwaG9uZywgcGhvbmdNaW5oS2hvYSwgYXV0aCwgcGhvbmdDaGF0ID0gW10sIG9uU2VuZFBob25nQ2hhdCwgb25Yb2FUaW5QaG9uZyxcbiAgbXlDYXBzID0ge30sIGlzU3RhZmYgPSBmYWxzZSwgdmFpVHJvUGhvbmcgPSAnbWVtYmVyJywgdGhhbmhWaWVuID0gW10sXG4gIHBvbGljaWVzID0gbnVsbCwgZ3JhbnRzID0gW10sIHZpZGVvVGltZVJlZiwgc2Vla1ZpZGVvLCBoYW5oRG9uZ1Bob25nLFxuICBjYW5Db250cm9sOiBfY2FuQ29udHJvbCA9IGZhbHNlLCBkb25nUGhvbmdIaWVuVGFpOiBfZG9uZ1Bob25nSGllblRhaSwgaXNSb29tV2lkZSA9IGZhbHNlIH0pIHtcbiAgY29uc3QgW2RvY2tUYWIsIHNldERvY2tUYWJdID0gUmVhY3QudXNlU3RhdGUoJ2NoYXQnKTsgLy8gJ2NoYXQnIHwgJ25vdGVzJyB8ICd3aGl0ZWJvYXJkJyB8ICdzaGVldCcgfCAndm9pY2UnIHwgJ3F1YW4tdHJpJ1xuICBjb25zdCBbc2hvd0Vtb2ppLCBzZXRTaG93RW1vamldID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8vIENhcGFiaWxpdHkgcGhcdTAwRURhIGNsaWVudCBjaFx1MUVDOSBcdTAxMTFcdTFFQzMgXHUxRUE5bi9oaVx1MUVDN24gVUkgXHUyMDE0IG1cdTFFQ0RpIHF1eVx1MUVDMW4gdGhcdTFFQUR0IGRvIHNlcnZlciBxdXlcdTFFQkZ0LlxuICBjb25zdCBjb1F1eWVuID0gKGNhcCkgPT4gbXlDYXBzW2NhcF0gIT09IGZhbHNlO1xuICBjb25zdCBsYXlWaVRyaVZpZGVvID0gKCkgPT4gTWF0aC5mbG9vcih2aWRlb1RpbWVSZWY/LmN1cnJlbnQgfHwgMCkgfHwgbnVsbDtcbiAgLy8gQlx1MUVBNW0gbVx1MUVEMWMgdGhcdTFFRERpIGdpYW4gXHUyMTkyIGdcdTFFRURpIGV2ZW50IGNobyBDYW1wdXNXYXRjaFRvZ2V0aGVyIHhcdTFFRUQgbFx1MDBGRFxuICAvLyAoY1x1MDBGMyB2aWRlb19jb250cm9sIFx1MjE5MiB0dWEgY2h1bmcgY1x1MUVBMyBwaFx1MDBGMm5nOyBraFx1MDBGNG5nIFx1MjE5MiB0dWEgY1x1MUVFNWMgYlx1MUVEOSBwbGF5ZXIgY1x1MUVFN2EgbVx1MDBFQ25oKS5cbiAgY29uc3QgeWV1Q2F1VHVhID0gKHNlYykgPT4ge1xuICAgIGlmIChzZWMgPT0gbnVsbCB8fCAhKHNlYyA+PSAwKSkgcmV0dXJuO1xuICAgIGlmIChzZWVrVmlkZW8pIHsgc2Vla1ZpZGVvKE51bWJlcihzZWMpLCBteUNhcHMudmlkZW9fY29udHJvbCA9PT0gdHJ1ZSk7IHJldHVybjsgfVxuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnc3Itc2VlaycsIHsgZGV0YWlsOiB7IHBob25nSWQ6IHBob25nPy5pZCwgc2VjOiBOdW1iZXIoc2VjKSB9IH0pKTtcbiAgfTtcblxuICAvLyAxLiBSb29tIENoYXQgU3RhdGVcbiAgY29uc3QgW2NoYXRJbnB1dCwgc2V0Q2hhdElucHV0XSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2NoYXRTZW5kaW5nLCBzZXRDaGF0U2VuZGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IGNoYXRDb21wb3NpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBjaGF0RW5kUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgPT09ICdjaGF0JyAmJiBjaGF0RW5kUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHAgPSBjaGF0RW5kUmVmLmN1cnJlbnQucGFyZW50RWxlbWVudDtcbiAgICAgIGlmIChwICYmIHAuc2Nyb2xsSGVpZ2h0ID4gcC5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgcC5zY3JvbGxUbyh7IHRvcDogcC5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtwaG9uZ0NoYXQubGVuZ3RoLCBkb2NrVGFiXSk7XG5cbiAgY29uc3QgaGFuZGxlU2VuZFJvb21DaGF0ID0gKGUpID0+IHtcbiAgICBlPy5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IHR4dCA9IGNoYXRJbnB1dC50cmltKCk7XG4gICAgaWYgKCF0eHQgfHwgY2hhdFNlbmRpbmcpIHJldHVybjtcbiAgICBzZXRDaGF0SW5wdXQoJycpO1xuICAgIHNldENoYXRTZW5kaW5nKHRydWUpO1xuICAgIGlmIChvblNlbmRQaG9uZ0NoYXQpIHtcbiAgICAgIFByb21pc2UucmVzb2x2ZShvblNlbmRQaG9uZ0NoYXQodHh0KSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICBzZXRDaGF0SW5wdXQoY3VyID0+IGN1ciA/IGN1ciA6IHR4dCk7XG4gICAgICB9KS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgc2V0Q2hhdFNlbmRpbmcoZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldENoYXRTZW5kaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gMi4gU2hhcmVkIE5vdGVzIFx1MjAxNCBlbnRyeSBhcHBlbmQgKG1cdTFFRDdpIG5nXHUwMUIwXHUxRUREaSB0aFx1MDBFQW0gZ2hpIGNoXHUwMEZBIHJpXHUwMEVBbmcsIGtoXHUwMEY0bmcgZ2hpIFx1MDExMVx1MDBFOCBuaGF1KVxuICBjb25zdCBbbm90ZXNMaXN0LCBzZXROb3Rlc0xpc3RdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbbm90ZUlucHV0LCBzZXROb3RlSW5wdXRdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbbm90ZVdpdGhUaW1lLCBzZXROb3RlV2l0aFRpbWVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IFtub3Rlc0NhbldyaXRlLCBzZXROb3Rlc0NhbldyaXRlXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBbbm90ZXNOb3RpY2UsIHNldE5vdGVzTm90aWNlXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3Qgbm90ZXNWZXJzaW9uUmVmID0gUmVhY3QudXNlUmVmKDApO1xuICBjb25zdCBub3RlQ29tcG9zaW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAnbm90ZXMnKSByZXR1cm47XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG4gICAgY29uc3QgZmV0Y2hOb3RlcyA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPW5vdGVzYCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2spIHtcbiAgICAgICAgICBzZXROb3Rlc0xpc3QoQXJyYXkuaXNBcnJheShkLnBheWxvYWQ/Lm5vdGVzKSA/IGQucGF5bG9hZC5ub3RlcyA6IFtdKTtcbiAgICAgICAgICBub3Rlc1ZlcnNpb25SZWYuY3VycmVudCA9IGQudmVyc2lvbiB8fCAwO1xuICAgICAgICAgIHNldE5vdGVzQ2FuV3JpdGUoZC5jYW5Xcml0ZSAhPT0gZmFsc2UpO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGl2ZSAmJiBkLmNvZGUgPT09ICdjYXBhYmlsaXR5X29mZicpIHtcbiAgICAgICAgICBzZXROb3Rlc0NhbldyaXRlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7fVxuICAgIH07XG4gICAgZmV0Y2hOb3RlcygpO1xuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaShmZXRjaE5vdGVzKSwgMzAwMCk7XG4gICAgcmV0dXJuICgpID0+IHsgYWN0aXZlID0gZmFsc2U7IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpOyB9O1xuICB9LCBbcGhvbmcuaWQsIGRvY2tUYWJdKTtcblxuICBjb25zdCB0aGVtR2hpQ2h1ID0gYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHRleHQgPSBub3RlSW5wdXQudHJpbSgpO1xuICAgIGlmICghdGV4dCkgcmV0dXJuO1xuICAgIHNldE5vdGVzTm90aWNlKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICByZXNvdXJjZTogJ25vdGVzJyxcbiAgICAgICAgICBwYXlsb2FkOiB7IHRleHQsIHZpZGVvVGltZVNlYzogbm90ZVdpdGhUaW1lID8gbGF5VmlUcmlWaWRlbygpIDogbnVsbCB9XG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHtcbiAgICAgICAgc2V0Tm90ZUlucHV0KCcnKTtcbiAgICAgICAgc2V0Tm90ZXNMaXN0KHByZXYgPT4gWy4uLnByZXYsIHsgaWQ6IGQuaWQsIHRlbjogYXV0aC51c2VyPy50ZW4gfHwgJ0JcdTFFQTFuJywgbm9pRHVuZzogdGV4dCwgdmlkZW9UaW1lU2VjOiBub3RlV2l0aFRpbWUgPyBsYXlWaVRyaVZpZGVvKCkgOiBudWxsLCBjdWFUb2k6IDEgfV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Tm90ZXNOb3RpY2UoZC5sb2kgfHwgJ0toXHUwMEY0bmcgbFx1MDFCMHUgXHUwMTExXHUwMUIwXHUxRUUzYyBnaGkgY2hcdTAwRkEuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IHNldE5vdGVzTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaS4nKTsgfVxuICB9O1xuXG4gIGNvbnN0IHhvYUdoaUNodSA9IGFzeW5jIChpZCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgcmVzb3VyY2U6ICdub3RlcycsIGFjdGlvbjogJ3hvYV9ub3RlJywgaWQgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vaykgc2V0Tm90ZXNMaXN0KHByZXYgPT4gcHJldi5maWx0ZXIobiA9PiBuLmlkICE9PSBpZCkpO1xuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICAvLyAzLiBTaGFyZWQgV2hpdGVib2FyZCBTdGF0ZVxuICBjb25zdCBjYW52YXNSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IFt3YlN0cm9rZXMsIHNldFdiU3Ryb2tlc10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFt3YkNvbG9yLCBzZXRXYkNvbG9yXSA9IFJlYWN0LnVzZVN0YXRlKCcjMDBGMkZFJyk7XG4gIGNvbnN0IFt3YldpZHRoLCBzZXRXYldpZHRoXSA9IFJlYWN0LnVzZVN0YXRlKDMpO1xuICBjb25zdCBbd2JUb29sLCBzZXRXYlRvb2xdID0gUmVhY3QudXNlU3RhdGUoJ3BlbicpO1xuICBjb25zdCBpc0RyYXdpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBjdXJyZW50U3Ryb2tlUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB3YlZlcnNpb25SZWYgPSBSZWFjdC51c2VSZWYoMCk7XG5cbiAgY29uc3QgcmVkcmF3Q2FudmFzID0gUmVhY3QudXNlQ2FsbGJhY2soKHN0cm9rZXMpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICBpZiAoIWNhbnZhcykgcmV0dXJuO1xuICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICBzdHJva2VzLmZvckVhY2gocyA9PiB7XG4gICAgICBpZiAoIXMucG9pbnRzIHx8IHMucG9pbnRzLmxlbmd0aCA8IDIpIHJldHVybjtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHMudG9vbCA9PT0gJ2VyYXNlcicgPyAnIzBCMEUxNCcgOiAocy5jb2xvciB8fCAnIzAwRjJGRScpO1xuICAgICAgY3R4LmxpbmVXaWR0aCA9IHMud2lkdGggfHwgMztcbiAgICAgIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcbiAgICAgIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICBjdHgubW92ZVRvKHMucG9pbnRzWzBdLngsIHMucG9pbnRzWzBdLnkpO1xuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBzLnBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjdHgubGluZVRvKHMucG9pbnRzW2ldLngsIHMucG9pbnRzW2ldLnkpO1xuICAgICAgfVxuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH0pO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgW3diQ2FuV3JpdGUsIHNldFdiQ2FuV3JpdGVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG5cbiAgLy8gXHUwMEMxcCAxIG9wIHZcdTAwRTBvIG1cdTFFQTNuZyBzdHJva2VzIChyZXBsYXkgYXBwZW5kLW9ubHkpOiAnc3Ryb2tlJyB0aFx1MDBFQW0gblx1MDBFOXQsICdjbGVhcicgeG9cdTAwRTEgc1x1MUVBMWNoLlxuICBjb25zdCBhcER1bmdPcCA9IChzdHJva2VzLCBvcCkgPT4ge1xuICAgIGlmIChvcC50eXBlID09PSAnY2xlYXInKSByZXR1cm4gW107XG4gICAgaWYgKG9wLnR5cGUgPT09ICdzdHJva2UnICYmIG9wLnN0cm9rZSkgcmV0dXJuIFsuLi5zdHJva2VzLCBvcC5zdHJva2VdO1xuICAgIHJldHVybiBzdHJva2VzO1xuICB9O1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICd3aGl0ZWJvYXJkJykgcmV0dXJuO1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoV2IgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT13aGl0ZWJvYXJkJnNhdUlkPSR7d2JWZXJzaW9uUmVmLmN1cnJlbnR9YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2spIHtcbiAgICAgICAgICBjb25zdCBvcHMgPSBBcnJheS5pc0FycmF5KGQucGF5bG9hZD8ub3BzKSA/IGQucGF5bG9hZC5vcHMgOiBbXTtcbiAgICAgICAgICBpZiAob3BzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gTlx1MUVCRnUgY1x1MDBGMyBvcCAnY2xlYXInIHRyb25nIGxvXHUxRUExdCBtXHUxRURCaSBcdTIxOTIgYnVpbGQgbFx1MUVBMWkgdFx1MUVFQiBcdTAxMTFcdTFFQTd1IGNobyBjaFx1MUVBRmNcbiAgICAgICAgICAgIGlmIChvcHMuc29tZShvID0+IG8udHlwZSA9PT0gJ2NsZWFyJykpIHtcbiAgICAgICAgICAgICAgY29uc3QgZnVsbCA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPXdoaXRlYm9hcmQmc2F1SWQ9MGApO1xuICAgICAgICAgICAgICBjb25zdCBkZiA9IGF3YWl0IGZ1bGwuanNvbigpO1xuICAgICAgICAgICAgICBpZiAoYWN0aXZlICYmIGRmLm9rKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsT3BzID0gQXJyYXkuaXNBcnJheShkZi5wYXlsb2FkPy5vcHMpID8gZGYucGF5bG9hZC5vcHMgOiBbXTtcbiAgICAgICAgICAgICAgICBjb25zdCByZWJ1aWx0ID0gYWxsT3BzLnJlZHVjZShhcER1bmdPcCwgW10pO1xuICAgICAgICAgICAgICAgIHNldFdiU3Ryb2tlcyhyZWJ1aWx0KTtcbiAgICAgICAgICAgICAgICByZWRyYXdDYW52YXMocmVidWlsdCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNldFdiU3Ryb2tlcyhwcmV2ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gb3BzLnJlZHVjZShhcER1bmdPcCwgcHJldik7XG4gICAgICAgICAgICAgICAgcmVkcmF3Q2FudmFzKG5leHQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgd2JWZXJzaW9uUmVmLmN1cnJlbnQgPSBkLnZlcnNpb24gfHwgMDtcbiAgICAgICAgICBzZXRXYkNhbldyaXRlKGQuY2FuV3JpdGUgIT09IGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RpdmUgJiYgZC5jb2RlID09PSAnY2FwYWJpbGl0eV9vZmYnKSB7XG4gICAgICAgICAgc2V0V2JDYW5Xcml0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIGZldGNoV2IoKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGtoaUhpZW5UaGkoZmV0Y2hXYiksIDMwMDApO1xuICAgIHJldHVybiAoKSA9PiB7IGFjdGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludGVydmFsKTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiLCByZWRyYXdDYW52YXNdKTtcblxuICBjb25zdCBzdGFydERyYXdpbmcgPSAoZSkgPT4ge1xuICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgIGlmICghY2FudmFzKSByZXR1cm47XG4gICAgY29uc3QgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBjbGllbnRYID0gZS5jbGllbnRYID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRYKTtcbiAgICBjb25zdCBjbGllbnRZID0gZS5jbGllbnRZID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRZKTtcbiAgICBjb25zdCB4ID0gY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICBjb25zdCB5ID0gY2xpZW50WSAtIHJlY3QudG9wO1xuICAgIGlzRHJhd2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQgPSB7XG4gICAgICB0b29sOiB3YlRvb2wsXG4gICAgICBjb2xvcjogd2JDb2xvcixcbiAgICAgIHdpZHRoOiB3YlRvb2wgPT09ICdlcmFzZXInID8gMTYgOiB3YldpZHRoLFxuICAgICAgcG9pbnRzOiBbeyB4LCB5IH1dXG4gICAgfTtcbiAgfTtcblxuICBjb25zdCBkcmF3TW92ZSA9IChlKSA9PiB7XG4gICAgaWYgKCFpc0RyYXdpbmdSZWYuY3VycmVudCB8fCAhY3VycmVudFN0cm9rZVJlZi5jdXJyZW50KSByZXR1cm47XG4gICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFjYW52YXMpIHJldHVybjtcbiAgICBjb25zdCByZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGNsaWVudFggPSBlLmNsaWVudFggPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFgpO1xuICAgIGNvbnN0IGNsaWVudFkgPSBlLmNsaWVudFkgPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFkpO1xuICAgIGNvbnN0IHggPSBjbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIGNvbnN0IHkgPSBjbGllbnRZIC0gcmVjdC50b3A7XG4gICAgY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnBvaW50cy5wdXNoKHsgeCwgeSB9KTtcbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnRvb2wgPT09ICdlcmFzZXInID8gJyMwQjBFMTQnIDogY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LmNvbG9yO1xuICAgIGN0eC5saW5lV2lkdGggPSBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQud2lkdGg7XG4gICAgY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuICAgIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgY29uc3QgcHRzID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnBvaW50cztcbiAgICBpZiAocHRzLmxlbmd0aCA+PSAyKSB7XG4gICAgICBjdHgubW92ZVRvKHB0c1twdHMubGVuZ3RoIC0gMl0ueCwgcHRzW3B0cy5sZW5ndGggLSAyXS55KTtcbiAgICAgIGN0eC5saW5lVG8ocHRzW3B0cy5sZW5ndGggLSAxXS54LCBwdHNbcHRzLmxlbmd0aCAtIDFdLnkpO1xuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBzdG9wRHJhd2luZyA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIWlzRHJhd2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgaXNEcmF3aW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFN0cm9rZVJlZi5jdXJyZW50ICYmIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5wb2ludHMubGVuZ3RoID4gMSkge1xuICAgICAgY29uc3Qgc3Ryb2tlID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50O1xuICAgICAgY29uc3QgbmV4dFN0cm9rZXMgPSBbLi4ud2JTdHJva2VzLCBzdHJva2VdO1xuICAgICAgc2V0V2JTdHJva2VzKG5leHRTdHJva2VzKTtcbiAgICAgIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICByZXNvdXJjZTogJ3doaXRlYm9hcmQnLFxuICAgICAgICAgICAgcGF5bG9hZDogeyB0eXBlOiAnc3Ryb2tlJywgc3Ryb2tlIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChkLm9rICYmIGQuaWQpIHdiVmVyc2lvblJlZi5jdXJyZW50ID0gTWF0aC5tYXgod2JWZXJzaW9uUmVmLmN1cnJlbnQsIGQuaWQpO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH1cbiAgfTtcblxuICBjb25zdCBjbGVhcldoaXRlYm9hcmQgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFjb25maXJtKCdCXHUxRUExbiBjXHUwMEYzIGNoXHUxRUFGYyBtdVx1MUVEMW4geFx1MDBGM2Egc1x1MUVBMWNoIGJcdTFFQTNuZyB2XHUxRUJEPyAoY2hcdTFFQzkgcXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcpJykpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICByZXNvdXJjZTogJ3doaXRlYm9hcmQnLFxuICAgICAgICAgIHBheWxvYWQ6IHsgdHlwZTogJ2NsZWFyJyB9XG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHtcbiAgICAgICAgc2V0V2JTdHJva2VzKFtdKTtcbiAgICAgICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgICAgIGlmIChjYW52YXMpIHtcbiAgICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gNC4gU2hhcmVkIFNoZWV0IFN0YXRlICg4IGNvbHMgeCAxMCByb3dzKSBcdTIwMTQgdXBzZXJ0IHRcdTFFRUJuZyBcdTAwRjQsIGtoXHUwMEY0bmcgd2hvbGUtZG9jIGNvbmZsaWN0XG4gIGNvbnN0IENPTFMgPSBbJ0EnLCAnQicsICdDJywgJ0QnLCAnRScsICdGJywgJ0cnLCAnSCddO1xuICBjb25zdCBST1dTID0gWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwXTtcbiAgY29uc3QgW3NoZWV0Q2VsbHMsIHNldFNoZWV0Q2VsbHNdID0gUmVhY3QudXNlU3RhdGUoe30pO1xuICBjb25zdCBbc2hlZXRDYW5Xcml0ZSwgc2V0U2hlZXRDYW5Xcml0ZV0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3Qgc2hlZXRTYXZlVGltZXJzUmVmID0gUmVhY3QudXNlUmVmKHt9KTtcbiAgY29uc3Qgc2hlZXRGb2N1c2VkQ2VsbFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgc2hlZXRQb2xsUmVmID0gUmVhY3QudXNlUmVmKDApO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICdzaGVldCcpIHJldHVybjtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaFNoZWV0ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mcmVzb3VyY2U9c2hlZXRgKTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChhY3RpdmUgJiYgZC5vaykge1xuICAgICAgICAgIGNvbnN0IGluY29taW5nID0gZC5wYXlsb2FkPy5jZWxscyB8fCB7fTtcbiAgICAgICAgICAvLyBLaFx1MDBGNG5nIGdoaSBcdTAxMTFcdTAwRTggXHUwMEY0IFx1MDExMWFuZyBnXHUwMEY1IGRcdTFFREZcbiAgICAgICAgICBzZXRTaGVldENlbGxzKHByZXYgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWVyZ2VkID0geyAuLi5pbmNvbWluZyB9O1xuICAgICAgICAgICAgY29uc3QgZGFuZ0dvID0gc2hlZXRGb2N1c2VkQ2VsbFJlZi5jdXJyZW50O1xuICAgICAgICAgICAgaWYgKGRhbmdHbyAmJiBwcmV2W2RhbmdHb10gIT09IHVuZGVmaW5lZCkgbWVyZ2VkW2RhbmdHb10gPSBwcmV2W2RhbmdHb107XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHNldFNoZWV0Q2FuV3JpdGUoZC5jYW5Xcml0ZSAhPT0gZmFsc2UpO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGl2ZSAmJiBkLmNvZGUgPT09ICdjYXBhYmlsaXR5X29mZicpIHtcbiAgICAgICAgICBzZXRTaGVldENhbldyaXRlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7fVxuICAgIH07XG4gICAgZmV0Y2hTaGVldCgpO1xuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaShmZXRjaFNoZWV0KSwgMzAwMCk7XG4gICAgcmV0dXJuICgpID0+IHsgYWN0aXZlID0gZmFsc2U7IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpOyB9O1xuICB9LCBbcGhvbmcuaWQsIGRvY2tUYWJdKTtcblxuICBjb25zdCBoYW5kbGVDZWxsQ2hhbmdlID0gKGNlbGxLZXksIHZhbCkgPT4ge1xuICAgIHNldFNoZWV0Q2VsbHMocHJldiA9PiAoeyAuLi5wcmV2LCBbY2VsbEtleV06IHZhbCB9KSk7XG4gICAgY29uc3QgdGltZXJzID0gc2hlZXRTYXZlVGltZXJzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKHRpbWVyc1tjZWxsS2V5XSkgY2xlYXJUaW1lb3V0KHRpbWVyc1tjZWxsS2V5XSk7XG4gICAgdGltZXJzW2NlbGxLZXldID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICByZXNvdXJjZTogJ3NoZWV0JyxcbiAgICAgICAgICAgIHBheWxvYWQ6IHsgY2VsbDogY2VsbEtleSwgdmFsdWU6IHZhbCB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfSwgODAwKTtcbiAgfTtcblxuICAvLyA1LiAxLXRvLTEgV2ViUlRDIFZvaWNlIENoYXQgXHUyMDE0IHBhaXItYm91bmQgKHRcdTFFRDFpIFx1MDExMWEgMSBjXHUxRUI3cC9waFx1MDBGMm5nLCBzaWduYWxpbmcgcmlcdTAwRUFuZyB0XHUwMUIwKVxuICBjb25zdCBbdm9pY2VKb2luZWQsIHNldFZvaWNlSm9pbmVkXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW21pY011dGVkLCBzZXRNaWNNdXRlZF0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTsgLy8gRGVmYXVsdCBPRkZcbiAgY29uc3QgW3ZvaWNlU3RhdGUsIHNldFZvaWNlU3RhdGVdID0gUmVhY3QudXNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICBjb25zdCBbdm9pY2VOb3RpY2UsIHNldFZvaWNlTm90aWNlXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3ZvaWNlUGFpciwgc2V0Vm9pY2VQYWlyXSA9IFJlYWN0LnVzZVN0YXRlKG51bGwpOyAgICAgICAvLyB7YWN0aXZlLCBhVGVuLCBiVGVuLCB5b3VJbiwgc2xvdH1cbiAgY29uc3QgW3ZvaWNlUmVxdWVzdGVkLCBzZXRWb2ljZVJlcXVlc3RlZF0gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFt5ZXVDYXVWb2ljZSwgc2V0WWV1Q2F1Vm9pY2VdID0gUmVhY3QudXNlU3RhdGUoW10pOyAgICAgLy8gc3RhZmY6IGRhbmggc1x1MDBFMWNoIHhpbiBxdXlcdTFFQzFuXG4gIGNvbnN0IHBjUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBsb2NhbFN0cmVhbVJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgcmVtb3RlQXVkaW9SZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGxhc3RTaWduYWxJZFJlZiA9IFJlYWN0LnVzZVJlZigwKTtcbiAgY29uc3Qgdm9pY2VQb2xsVGltZXJSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHZvaWNlU2xvdFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgdm9pY2VKb2luZWRSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBwZW5kaW5nQ2FuZGlkYXRlc1JlZiA9IFJlYWN0LnVzZVJlZihbXSk7XG4gIHZvaWNlSm9pbmVkUmVmLmN1cnJlbnQgPSB2b2ljZUpvaW5lZDtcblxuICBjb25zdCBkdW5nS2V0Tm9pVm9pY2UgPSAoKSA9PiB7XG4gICAgaWYgKGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0VHJhY2tzKCkuZm9yRWFjaCh0ID0+IHQuc3RvcCgpKTtcbiAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAocGNSZWYuY3VycmVudCkge1xuICAgICAgcGNSZWYuY3VycmVudC5jbG9zZSgpO1xuICAgICAgcGNSZWYuY3VycmVudCA9IG51bGw7XG4gICAgfVxuICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQgPSBbXTtcbiAgICBzZXRNaWNNdXRlZCh0cnVlKTtcbiAgfTtcblxuICAvLyBQb2xsIHRyXHUxRUExbmcgdGhcdTAwRTFpIGNcdTFFQjdwICsgdFx1MDBFRG4gaGlcdTFFQzd1IGNcdTFFRTdhIHBhcnRuZXIgKHNlcnZlciBjaFx1MUVDOSB0clx1MUVBMyBzaWduYWwgY1x1MUVFN2EgbmdcdTAxQjBcdTFFRERpIHRyb25nIGNcdTFFQjdwKS5cbiAgY29uc3QgcG9sbFZvaWNlID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZhY3Rpb249dm9pY2VfcG9sbCZzYXVJZD0ke2xhc3RTaWduYWxJZFJlZi5jdXJyZW50fWApO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoIWQub2spIHJldHVybjtcbiAgICAgIGlmIChkLnBhaXIpIHNldFZvaWNlUGFpcihkLnBhaXIpO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZC55ZXVDYXVWb2ljZSkpIHNldFlldUNhdVZvaWNlKGQueWV1Q2F1Vm9pY2UpO1xuICAgICAgY29uc3QgcGMgPSBwY1JlZi5jdXJyZW50O1xuICAgICAgaWYgKCF2b2ljZUpvaW5lZFJlZi5jdXJyZW50IHx8ICFwYykgcmV0dXJuO1xuICAgICAgZm9yIChjb25zdCBzaWcgb2YgZC5zaWduYWxzIHx8IFtdKSB7XG4gICAgICAgIGxhc3RTaWduYWxJZFJlZi5jdXJyZW50ID0gTWF0aC5tYXgobGFzdFNpZ25hbElkUmVmLmN1cnJlbnQsIHNpZy5pZCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnb2ZmZXInKSB7XG4gICAgICAgICAgICAvLyBPZmZlciBtXHUxRURCaSBob1x1MUVCN2MgcmUtb2ZmZXIgKFx1MDExMVx1MUVEMWkgcGhcdTAxQjBcdTAxQTFuZyBiXHUxRUFEdCBtaWMgbXVcdTFFRDluKSBcdTAxMTFcdTFFQzF1IHNldCBsXHUxRUExaSByZW1vdGUgKyB0clx1MUVBMyBhbnN3ZXIuXG4gICAgICAgICAgICBhd2FpdCBwYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKHNpZy5wYXlsb2FkKSk7XG4gICAgICAgICAgICAvLyBYXHUxRUEzIGNcdTAwRTFjIGNhbmRpZGF0ZSB0XHUxRURCaSBzXHUxRURCbSB0clx1MDFCMFx1MUVEQmMga2hpIGNcdTAwRjMgcmVtb3RlRGVzY3JpcHRpb24uXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGMgb2YgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICBhd2FpdCBwYy5hZGRJY2VDYW5kaWRhdGUobmV3IFJUQ0ljZUNhbmRpZGF0ZShjKSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCA9IFtdO1xuICAgICAgICAgICAgY29uc3QgYW5zID0gYXdhaXQgcGMuY3JlYXRlQW5zd2VyKCk7XG4gICAgICAgICAgICBhd2FpdCBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKGFucyk7XG4gICAgICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ2Fuc3dlcicsIHBheWxvYWQ6IGFucyB9KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ2Fuc3dlcicpIHtcbiAgICAgICAgICAgIGlmIChwYy5zaWduYWxpbmdTdGF0ZSA9PT0gJ2hhdmUtbG9jYWwtb2ZmZXInKSB7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLnNldFJlbW90ZURlc2NyaXB0aW9uKG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24oc2lnLnBheWxvYWQpKTtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBjIG9mIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwYy5hZGRJY2VDYW5kaWRhdGUobmV3IFJUQ0ljZUNhbmRpZGF0ZShjKSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnY2FuZGlkYXRlJykge1xuICAgICAgICAgICAgaWYgKHBjLnJlbW90ZURlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLmFkZEljZUNhbmRpZGF0ZShuZXcgUlRDSWNlQ2FuZGlkYXRlKHNpZy5wYXlsb2FkKSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudC5wdXNoKHNpZy5wYXlsb2FkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnbGVhdmUnKSB7XG4gICAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnTmdcdTAxQjBcdTFFRERpIGtpYSBcdTAxMTFcdTAwRTMgbmdcdTFFQUZ0IHZvaWNlLicpO1xuICAgICAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgICAgICAgICBkdW5nS2V0Tm9pVm9pY2UoKTtcbiAgICAgICAgICAgIHNldFZvaWNlSm9pbmVkKGZhbHNlKTtcbiAgICAgICAgICAgIHZvaWNlU2xvdFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggeyAvKiBiXHUxRUNGIHF1YSBzaWduYWwgbFx1MUVEN2kgKi8gfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICAvLyBQb2xsIGNoXHUxRUExeSBraGkgdGFiIHZvaWNlIG1cdTFFREYgKHhlbSB0clx1MUVBMW5nIHRoXHUwMEUxaSBjXHUxRUI3cCkgaG9cdTFFQjdjIFx1MDExMWFuZyB0cm9uZyBjXHUxRUI3cC5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiAhPT0gJ3ZvaWNlJyAmJiAhdm9pY2VKb2luZWQpIHJldHVybjtcbiAgICBwb2xsVm9pY2UoKTtcbiAgICB2b2ljZVBvbGxUaW1lclJlZi5jdXJyZW50ID0gc2V0SW50ZXJ2YWwocG9sbFZvaWNlLCAxNTAwKTtcbiAgICByZXR1cm4gKCkgPT4geyBpZiAodm9pY2VQb2xsVGltZXJSZWYuY3VycmVudCkgY2xlYXJJbnRlcnZhbCh2b2ljZVBvbGxUaW1lclJlZi5jdXJyZW50KTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiLCB2b2ljZUpvaW5lZF0pO1xuXG4gIGNvbnN0IGpvaW5Wb2ljZSA9IGFzeW5jICgpID0+IHtcbiAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwYW5nIHhpbiBjaFx1MUVENyB0cm9uZyBjXHUxRUI3cCB2b2ljZS4uLicpO1xuICAgIHNldFZvaWNlU3RhdGUoJ2Nvbm5lY3RpbmcnKTtcbiAgICB0cnkge1xuICAgICAgLy8gMS4gR2lcdTAwRTBuaCBzbG90IHRyXHUwMEVBbiBzZXJ2ZXIgdHJcdTAxQjBcdTFFREJjIChzZXJ2ZXItYXV0aG9yaXRhdGl2ZTogdFx1MUVEMWkgXHUwMTExYSAxIGNcdTFFQjdwIDEtMS9waFx1MDBGMm5nKVxuICAgICAgY29uc3Qgam9pblJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9qb2luJyB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBqb2luRGF0YSA9IGF3YWl0IGpvaW5SZXMuanNvbigpO1xuICAgICAgaWYgKCFqb2luRGF0YS5vaykge1xuICAgICAgICBpZiAoam9pbkRhdGEuY29kZSA9PT0gJ2dyYW50X3JlcXVpcmVkJykge1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdCXHUxRUExbiBjXHUxRUE3biBcdTAxMTFcdTAxQjBcdTFFRTNjIGNcdTFFQTVwIHF1eVx1MUVDMW4gdm9pY2UgXHUyMDE0IGhcdTAwRTN5IGJcdTFFQTVtIFwiWGluIHF1eVx1MUVDMW4gdm9pY2VcIi4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZShqb2luRGF0YS5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgdGhhbSBnaWEgdm9pY2UuJyk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZvaWNlU2xvdFJlZi5jdXJyZW50ID0gam9pbkRhdGEuc2xvdDtcbiAgICAgIHNldFZvaWNlSm9pbmVkKHRydWUpO1xuXG4gICAgICAvLyAyLiBYaW4gbWljIFRSXHUwMUFGXHUxRURBQyBraGkgdFx1MUVBMW8gb2ZmZXIgXHUyMDE0IHRyYWNrIHBoXHUxRUEzaSBjXHUwMEYzIHNcdTFFQjVuIHRyb25nIFNEUCBuZWdvdGlhdGlvbixcbiAgICAgIC8vICAgIGFkZFRyYWNrIHNhdSBraGkgXHUwMTExXHUwMEUzIGJcdTFFQUZ0IHRheSBtXHUwMEUwIGtoXHUwMEY0bmcgcmVuZWdvdGlhdGUgXHUyMTkyIG5nXHUwMUIwXHUxRUREaSBraWEga2hcdTAwRjRuZyBuZ2hlIFx1MDExMVx1MDFCMFx1MUVFM2MuXG4gICAgICAvLyAgICBNaWMga2hcdTFFREZpIFx1MDExMVx1MUVBN3UgbXV0ZWQgKGVuYWJsZWQ9ZmFsc2UpIFx1MjAxNCB1c2VyIHRcdTFFRjEgYlx1MUVBRHQgYlx1MUVCMW5nIG5cdTAwRkF0IE1pYy5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgYXVkaW86IHRydWUsIHZpZGVvOiBmYWxzZSB9KTtcbiAgICAgICAgc3RyZWFtLmdldEF1ZGlvVHJhY2tzKCkuZm9yRWFjaCh0ID0+IHsgdC5lbmFibGVkID0gZmFsc2U7IH0pO1xuICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50ID0gc3RyZWFtO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdLaFx1MDBGNG5nIHhpbiBcdTAxMTFcdTAxQjBcdTFFRTNjIG1pY3JvIFx1MjAxNCBiXHUxRUExbiBjaFx1MUVDOSBuZ2hlIFx1MDExMVx1MDFCMFx1MUVFM2MsIGtoXHUwMEY0bmcgblx1MDBGM2kgXHUwMTExXHUwMUIwXHUxRUUzYy4nKTtcbiAgICAgIH1cblxuICAgICAgLy8gMy4gVFx1MUVBMW8gcGVlciBjb25uZWN0aW9uXG4gICAgICBjb25zdCBwYyA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbih7XG4gICAgICAgIGljZVNlcnZlcnM6IFt7IHVybHM6ICdzdHVuOnN0dW4ubC5nb29nbGUuY29tOjE5MzAyJyB9XVxuICAgICAgfSk7XG4gICAgICBwY1JlZi5jdXJyZW50ID0gcGM7XG4gICAgICBpZiAobG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldFRyYWNrcygpLmZvckVhY2godCA9PiBwYy5hZGRUcmFjayh0LCBsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSk7XG4gICAgICB9XG5cbiAgICAgIHBjLm9uaWNlY2FuZGlkYXRlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5jYW5kaWRhdGUpIHtcbiAgICAgICAgICBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICAgICAgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJyxcbiAgICAgICAgICAgICAgc2lnbmFsVHlwZTogJ2NhbmRpZGF0ZScsXG4gICAgICAgICAgICAgIHBheWxvYWQ6IGV2ZW50LmNhbmRpZGF0ZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHBjLm9udHJhY2sgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKHJlbW90ZUF1ZGlvUmVmLmN1cnJlbnQgJiYgZXZlbnQuc3RyZWFtc1swXSkge1xuICAgICAgICAgIHJlbW90ZUF1ZGlvUmVmLmN1cnJlbnQuc3JjT2JqZWN0ID0gZXZlbnQuc3RyZWFtc1swXTtcbiAgICAgICAgICByZW1vdGVBdWRpb1JlZi5jdXJyZW50LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHBjLm9uY29ubmVjdGlvbnN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBzID0gcGMuY29ubmVjdGlvblN0YXRlO1xuICAgICAgICBpZiAocyA9PT0gJ2Nvbm5lY3RlZCcpIHtcbiAgICAgICAgICBzZXRWb2ljZVN0YXRlKCdjb25uZWN0ZWQnKTtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnXHUyNzEzIFx1MDExMGFuZyBrXHUxRUJGdCBuXHUxRUQxaSB0aG9cdTFFQTFpIDEtMSB0clx1MUVGMWMgdGlcdTFFQkZwLicpO1xuICAgICAgICB9IGVsc2UgaWYgKHMgPT09ICdmYWlsZWQnIHx8IHMgPT09ICdkaXNjb25uZWN0ZWQnKSB7XG4gICAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIHRob1x1MUVBMWkgKG1cdTFFQTFuZyBjaFx1MUVCN24gUDJQIG5cdTFFQkZ1IGtoXHUwMEY0bmcgY1x1MDBGMyBUVVJOKS4nKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgLy8gNC4gU2xvdCAnYicgKG5nXHUwMUIwXHUxRUREaSB2XHUwMEUwbyBzYXUpIHRcdTFFQTFvIG9mZmVyOyBzbG90ICdhJyBjaFx1MUVERCBvZmZlciB0XHUxRUVCIHBvbGwuXG4gICAgICBpZiAoam9pbkRhdGEuc2xvdCA9PT0gJ2InKSB7XG4gICAgICAgIGNvbnN0IG9mZmVyID0gYXdhaXQgcGMuY3JlYXRlT2ZmZXIoKTtcbiAgICAgICAgYXdhaXQgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihvZmZlcik7XG4gICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnb2ZmZXInLCBwYXlsb2FkOiBvZmZlciB9KVxuICAgICAgICB9KTtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMFx1MDBFMyB2XHUwMEUwbyBjXHUxRUI3cCBcdTIwMTQgXHUwMTExYW5nIGJcdTFFQUZ0IHRheSB2XHUxRURCaSAnICsgKHZvaWNlUGFpcj8uYVRlbiB8fCAnbmdcdTAxQjBcdTFFRERpIGtpYScpICsgJ1x1MjAyNicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0JcdTFFQTFuIGxcdTAwRTAgbmdcdTAxQjBcdTFFRERpIFx1MDExMVx1MUVBN3UgdGlcdTAwRUFuIFx1MjAxNCBjaFx1MUVERCB0aFx1MDBFQW0gMSBuZ1x1MDFCMFx1MUVERGkgdlx1MDBFMG8gdm9pY2VcdTIwMjYnKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHNldFZvaWNlTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSB2b2ljZTogJyArIGVyci5tZXNzYWdlKTtcbiAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB4aW5RdXllblZvaWNlID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2VfcmVxdWVzdCcgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vayAmJiBkLmdyYW50ZWQpIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0JcdTFFQTFuIFx1MDExMVx1MDBFMyBcdTAxMTFcdTAxQjBcdTFFRTNjIHBoXHUwMEU5cCB2b2ljZSBcdTIwMTQgYlx1MUVBNW0gVGhhbSBnaWEuJyk7XG4gICAgICB9IGVsc2UgaWYgKGQub2spIHtcbiAgICAgICAgc2V0Vm9pY2VSZXF1ZXN0ZWQodHJ1ZSk7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBcdTAwRTMgZ1x1MUVFRGkgeVx1MDBFQXUgY1x1MUVBN3UgXHUyMDE0IGNoXHUxRUREIHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nIGR1eVx1MUVDN3QuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRWb2ljZU5vdGljZShkLmxvaSB8fCAnS2hcdTAwRjRuZyBnXHUxRUVEaSBcdTAxMTFcdTAxQjBcdTFFRTNjIHlcdTAwRUF1IGNcdTFFQTd1LicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggeyBzZXRWb2ljZU5vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkuJyk7IH1cbiAgfTtcblxuICBjb25zdCBuZ2F0Vm9pY2VDYXAgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFjb25maXJtKCdOZ1x1MUVBRnQgY1x1MUVCN3Agdm9pY2UgXHUwMTExYW5nIGhvXHUxRUExdCBcdTAxMTFcdTFFRDluZz8nKSkgcmV0dXJuO1xuICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9lbmQnIH0pXG4gICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgIHBvbGxWb2ljZSgpO1xuICB9O1xuXG4gIGNvbnN0IHRvZ2dsZU1pYyA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAobWljTXV0ZWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICghbG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgICAgIC8vIE1pYyBiXHUxRUNCIHRcdTFFRUIgY2hcdTFFRDFpIGxcdTAwRkFjIGpvaW4gXHUyMTkyIHhpbiBsXHUxRUExaTsgYWRkVHJhY2sgbXVcdTFFRDluIGNcdTFFQTduIHJlbmVnb3RpYXRlIChvZmZlciBtXHUxRURCaSkuXG4gICAgICAgICAgY29uc3Qgc3RyZWFtID0gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoeyBhdWRpbzogdHJ1ZSwgdmlkZW86IGZhbHNlIH0pO1xuICAgICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQgPSBzdHJlYW07XG4gICAgICAgICAgY29uc3QgcGMgPSBwY1JlZi5jdXJyZW50O1xuICAgICAgICAgIGlmIChwYykge1xuICAgICAgICAgICAgc3RyZWFtLmdldFRyYWNrcygpLmZvckVhY2godHJhY2sgPT4gcGMuYWRkVHJhY2sodHJhY2ssIHN0cmVhbSkpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3Qgb2ZmZXIgPSBhd2FpdCBwYy5jcmVhdGVPZmZlcigpO1xuICAgICAgICAgICAgICBhd2FpdCBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcbiAgICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdvZmZlcicsIHBheWxvYWQ6IG9mZmVyIH0pXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIHJlbmVnb3RpYXRpb24gdGhcdTFFQTV0IGJcdTFFQTFpIFx1MjAxNCBuZ2hlIHZcdTFFQUJuIFx1MDExMVx1MDFCMFx1MUVFM2MgKi8gfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldEF1ZGlvVHJhY2tzKCkuZm9yRWFjaCh0ID0+IHsgdC5lbmFibGVkID0gdHJ1ZTsgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0TWljTXV0ZWQoZmFsc2UpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGFsZXJ0KCdLaFx1MDBGNG5nIHRoXHUxRUMzIG1cdTFFREYgbWljcm86ICcgKyBlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0QXVkaW9UcmFja3MoKS5mb3JFYWNoKHQgPT4geyB0LmVuYWJsZWQgPSBmYWxzZTsgfSk7XG4gICAgICB9XG4gICAgICBzZXRNaWNNdXRlZCh0cnVlKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgbGVhdmVWb2ljZSA9ICgpID0+IHtcbiAgICBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ2xlYXZlJywgcGF5bG9hZDoge30gfSlcbiAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgZHVuZ0tldE5vaVZvaWNlKCk7XG4gICAgc2V0Vm9pY2VKb2luZWQoZmFsc2UpO1xuICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgIHZvaWNlU2xvdFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwXHUwMEUzIG5nXHUxRUFGdCB2b2ljZS4nKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgaWQ9XCJzdHVkeS1kb2NrLWNvbnRhaW5lclwiIHN0eWxlPXt7IG92ZXJmbG93QW5jaG9yOiAnbm9uZScgfX0gY2xhc3NOYW1lPXtgYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMTYxYjI2XSB0by1bIzBmMTQxZF0gYm9yZGVyIGJvcmRlci13aGl0ZS9bMC4wOF0gcm91bmRlZC0yeGwgcC00IGZsZXggZmxleC1jb2wgc2hhZG93LXhsICR7aXNSb29tV2lkZSA/ICdtaW4taC1bY2FsYygxMDB2aC0xNjBweCldIGgtZnVsbCBmbGV4LTEnIDogJ2gtWzYyMHB4XSBsZzpoLVs2ODBweF0nfWB9PlxuICAgICAgey8qIFN0dWR5IERvY2sgVGFiIE5hdmlnYXRpb24gXHUyMDE0IEdcdTFFQ0RuIGdcdTAwRTBuZywgdGhcdTFFQTltIG1cdTFFRjksIG5cdTAwRkF0IG5cdTFFRDVpIGJcdTFFQUR0ICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgcGItMyBib3JkZXItYiBib3JkZXItd2hpdGUvMTAgZmxleC13cmFwIHNocmluay0wXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZmxleC13cmFwXCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktY2hhdFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ2NoYXQnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdjaGF0J1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0FDPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Q2hhdCBwaFx1MDBGMm5nPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LW5vdGVzXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignbm90ZXMnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdub3RlcydcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENERDwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkdoaSBjaFx1MDBGQTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS13aGl0ZWJvYXJkXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignd2hpdGVib2FyZCcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3doaXRlYm9hcmQnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGQTg8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5CXHUxRUEzbmcgdlx1MUVCRDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1zaGVldFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3NoZWV0Jyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnc2hlZXQnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQ0E8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5CXHUxRUEzbmcgdFx1MDBFRG5oPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LXZvaWNlXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYigndm9pY2UnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICd2b2ljZSdcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLWFtYmVyLTUwMCB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgyNTEsMTkxLDM2LDAuMzUpXSBib3JkZXIgYm9yZGVyLWFtYmVyLTQwMC81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGOTlcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5Wb2ljZSAoMS0xKTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1tZW1iZXJzXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignbWVtYmVycycpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ21lbWJlcnMnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLWVtZXJhbGQtNDAwIHRvLXRlYWwtNTAwIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDUyLDIxMSwxNTMsMC4zNSldIGJvcmRlciBib3JkZXItZW1lcmFsZC00MDAvNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQzY1PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+VGhcdTAwRTBuaCB2aVx1MDBFQW57dGhhbmhWaWVuLmxlbmd0aCA+IDAgPyBgICgke3RoYW5oVmllbi5sZW5ndGh9KWAgOiAnJ308L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICB7aXNTdGFmZiAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LXF1YW4tdHJpXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3F1YW4tdHJpJyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3F1YW4tdHJpJ1xuICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLXZpb2xldC01MDAgdG8tcHVycGxlLTUwMCB0ZXh0LXdoaXRlIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgxMzksOTIsMjQ2LDAuMzUpXSBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvNTAnXG4gICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNjk5XHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5RdXlcdTFFQzFuPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIERvY2sgQ29udGVudCBCb2R5ICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBwdC0zIG1pbi1oLTAgaC1mdWxsIG92ZXJmbG93LWhpZGRlblwiPlxuICAgICAgICB7LyogVEFCIDE6IENIQVQgUEhcdTAwRDJORyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdjaGF0JyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBtaW4taC0wIGgtZnVsbFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHNwYWNlLXktMyBwci0xIG1pbi1oLTAgdGV4dC14c1wiPlxuICAgICAgICAgICAgICB7cGhvbmdDaGF0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCB0ZXh0LWNlbnRlciBweS04XCI+Q2hcdTAxQjBhIGNcdTAwRjMgdGluIG5oXHUxRUFGbiBcdTIwMTQgaFx1MDBFM3kgZ1x1MUVFRGkgY1x1MDBFMnUgaFx1MUVDRmkgaG9cdTFFQjdjIHRyYW8gXHUwMTExXHUxRUQ1aSB2XHUxRUMxIGJcdTAwRTBpIGdpXHUxRUEzbmchPC9wPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIHBob25nQ2hhdC5tYXAoKG0sIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgbXlOYW1lID0gU3RyaW5nKGF1dGg/LnVzZXI/LmhvVGVuIHx8IGF1dGg/LnVzZXI/Lm5hbWUgfHwgYXV0aD8udXNlcj8udGVuIHx8ICcnKS50cmltKCk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUNoaW5oTWluaCA9IEJvb2xlYW4oXG4gICAgICAgICAgICAgICAgICAgIG0uY3VhVG9pIHx8XG4gICAgICAgICAgICAgICAgICAgIChtLmtob2EgJiYgcGhvbmdNaW5oS2hvYSAmJiBtLmtob2EgPT09IHBob25nTWluaEtob2EpIHx8XG4gICAgICAgICAgICAgICAgICAgIChteU5hbWUgJiYgbS50ZW5OZ3VvaUd1aSAmJiBtLnRlbk5ndW9pR3VpLnRyaW0oKS50b0xvd2VyQ2FzZSgpID09PSBteU5hbWUudG9Mb3dlckNhc2UoKSlcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBjb25zdCB0aW1lU3RyID0gbS50YW9MdWMgPyBuZXcgRGF0ZShtLnRhb0x1Yy5yZXBsYWNlKCcgJywgJ1QnKSArIChtLnRhb0x1Yy5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JyB9KSA6ICcnO1xuXG4gICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAga2V5PXttLmlkIHx8IGlkeH1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGZsZXgtY29sIGdyb3VwIHctZnVsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFDaGluaE1pbmggPyAnaXRlbXMtZW5kJyA6ICdpdGVtcy1zdGFydCdcbiAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgey8qIEhlYWRlciB0aFx1MDBGNG5nIHRpbiBuZ1x1MDFCMFx1MUVERGkgZ1x1MUVFRGkgKi99XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IG1iLTEgdGV4dC1bMTFweF0gJHtsYUNoaW5oTWluaCA/ICdmbGV4LXJvdy1yZXZlcnNlJyA6ICcnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgZm9udC1leHRyYWJvbGQgJHtsYUNoaW5oTWluaCA/ICd0ZXh0LVsjMDBGMkZFXScgOiAndGV4dC1zbGF0ZS0yMDAnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7bS50ZW5OZ3VvaUd1aX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUNoaW5oTWluaCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIHNoYWRvdy1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJcdTFFQTFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICB7bS52YWlUcm8gPT09ICdnaWFvX3ZpZW4nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdWQ05cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IG0ubG9wVGVuID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzIwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge20ubG9wVGVufVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7dGltZVN0cn1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiWG9cdTAwRTEgdGluIG5oXHUxRUFGbiBuXHUwMEUweSAocXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jaGF0P3Bob25nSWQ9JHtwaG9uZy5pZH0maWQ9JHttLmlkfWAsIHsgbWV0aG9kOiAnREVMRVRFJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkLm9rICYmIG9uWG9hVGluUGhvbmcpIG9uWG9hVGluUGhvbmcobS5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgKi8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHB4LTEgdGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTUwMCBob3Zlcjp0ZXh0LXJvc2UtNDAwIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIHsvKiBCdWJibGUgdGluIG5oXHUxRUFGbiAqL31cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BtYXgtdy1bODUlXSBzbTptYXgtdy1bNzglXSBweC0zLjUgcHktMiB0ZXh0LXhzIGxlYWRpbmctcmVsYXhlZCBicmVhay13b3JkcyBzaGFkb3ctbWQgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGFDaGluaE1pbmhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdyb3VuZGVkLTJ4bCByb3VuZGVkLXRyLXhzIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwYjRkOF0vMjUgdmlhLVsjMDA3N2I2XS8zMCB0by1bIzAwRjJGRV0vMjAgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgdGV4dC13aGl0ZSBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMTIpXSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdyb3VuZGVkLTJ4bCByb3VuZGVkLXRsLXhzIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOmJvcmRlci13aGl0ZS8yMCB0ZXh0LXNsYXRlLTIwMCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIndoaXRlc3BhY2UtcHJlLXdyYXBcIj57bS5ub2lEdW5nfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIHttLnZpZGVvVGltZVNlYyAhPSBudWxsICYmIG0udmlkZW9UaW1lU2VjID49IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geWV1Q2F1VHVhKG0udmlkZW9UaW1lU2VjKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJtdC0xLjUgaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIGdhcC0xIHB4LTIgcHktMC41IHJvdW5kZWQtbGcgdGV4dC1bMTBweF0gZm9udC1ibGFjayBiZy1jeWFuLTQwMC8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCBob3ZlcjpiZy1bIzAwRjJGRV0vMzAgdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTI1QjY8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+e2RpbmhEYW5nR2lheVBodXQobS52aWRlb1RpbWVTZWMpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPGRpdiByZWY9e2NoYXRFbmRSZWZ9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVNlbmRSb29tQ2hhdH0gY2xhc3NOYW1lPVwicHQtMiBib3JkZXItdCBib3JkZXItd2hpdGUvOCBmbGV4IGZsZXgtY29sIGdhcC0yIG10LWF1dG8gc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgey8qIEVtb2ppIHBhbmVsICovfVxuICAgICAgICAgICAgICB7c2hvd0Vtb2ppICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGdhcC0xIHAtMiBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bFwiPlxuICAgICAgICAgICAgICAgICAge1snXHVEODNEXHVERTBBJywnXHVEODNEXHVERTAyJywnXHVEODNFXHVERDcwJywnXHVEODNEXHVERTBFJywnXHVEODNFXHVERDE0JywnXHVEODNEXHVERTA1JywnXHVEODNEXHVERTJEJywnXHVEODNEXHVERDI1JywnXHUyNzY0XHVGRTBGJywnXHVEODNEXHVEQzREJywnXHVEODNEXHVERTRGJywnXHVEODNDXHVERjg5JywnXHUyNzA1JywnXHVEODNEXHVEQ0FGJywnXHVEODNEXHVEQzRCJywnXHVEODNEXHVEQ0RBJywnXHUyNzBGXHVGRTBGJywnXHVEODNDXHVERkFGJywnXHVEODNDXHVERjFGJywnXHVEODNEXHVEQ0ExJywnXHUyNkExJywnXHVEODNDXHVERkM2JywnXHVEODNFXHVERDFEJywnXHVEODNEXHVEQ0FBJywnXHVEODNFXHVERDI5J10ubWFwKGVtID0+IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBrZXk9e2VtfSB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldENoYXRJbnB1dCh2ID0+IHYgKyBlbSk7IHNldFNob3dFbW9qaShmYWxzZSk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1sZyBob3ZlcjpzY2FsZS0xMjUgdHJhbnNpdGlvbi10cmFuc2Zvcm0gYWN0aXZlOnNjYWxlLTk1IHB4LTFcIj57ZW19PC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgZmxleC0xXCI+XG4gICAgICAgICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1waG9uZy1jaGF0XCJcbiAgICAgICAgICAgICAgICAgICAgcm93cz17MX1cbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e2NvUXV5ZW4oJ2NoYXQnKSA/ICdOaFx1MUVBRm4gdGluIHBoXHUwMEYybmcgaFx1MUVDRGMuLi4nIDogJ0NoYXQgXHUwMTExYW5nIGJcdTFFQ0Iga2hcdTAwRjNhJ31cbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2NoYXRJbnB1dH1cbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjb1F1eWVuKCdjaGF0Jyl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldENoYXRJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25TdGFydD17KCkgPT4geyBjaGF0Q29tcG9zaW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPXsoKSA9PiB7IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCA9IGZhbHNlOyB9fVxuICAgICAgICAgICAgICAgICAgICBvbktleURvd249e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiAhZS5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUubmF0aXZlRXZlbnQ/LmlzQ29tcG9zaW5nIHx8IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlU2VuZFJvb21DaGF0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICBtYXhMZW5ndGg9ezUwMH1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHB4LTQgcHktMi41IHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTAgZm9jdXM6c2hhZG93LVswXzBfMTJweF9yZ2JhKDAsMjQyLDI1NCwwLjEyKV0gcmVzaXplLW5vbmUgbWluLWgtWzM4cHhdIG1heC1oLTI0IGRpc2FibGVkOm9wYWNpdHktNDAgdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7LyogRW1vamkgYnV0dG9uICovfVxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjb1F1eWVuKCdjaGF0Jyl9XG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93RW1vamkodiA9PiAhdil9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTkgaC05IHJvdW5kZWQtMnhsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtYmFzZSB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTMwIHNocmluay0wIGFjdGl2ZTpzY2FsZS05MCAke1xuICAgICAgICAgICAgICAgICAgICBzaG93RW1vamkgPyAnYmctWyMwMEYyRkVdLzIwIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIHRleHQtWyMwMEYyRkVdJyA6ICdiZy13aGl0ZS81IGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSBob3ZlcjpiZy13aGl0ZS8xMCdcbiAgICAgICAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDaFx1MUVDRG4gZW1vamlcIj5cbiAgICAgICAgICAgICAgICAgIFx1RDgzRFx1REUwQVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIHsvKiBTZW5kIGJ1dHRvbiAqL31cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXNlbmQtcGhvbmctY2hhdFwiXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNoYXRJbnB1dC50cmltKCkgfHwgY2hhdFNlbmRpbmcgfHwgIWNvUXV5ZW4oJ2NoYXQnKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctOSBoLTkgcm91bmRlZC0yeGwgYmctZ3JhZGllbnQtdG8tYnIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzQjgyRjZdIHRleHQtYmxhY2sgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTMwIHNocmluay0wIGhvdmVyOmJyaWdodG5lc3MtMTEwIGFjdGl2ZTpzY2FsZS05MCBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMCwyNDIsMjU0LDAuMyldXCI+XG4gICAgICAgICAgICAgICAgICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiIGNsYXNzTmFtZT1cInctNCBoLTRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0zLjQ3OCAyLjQwNWEuNzUuNzUgMCAwMC0uOTI2Ljk0bDIuNDMyIDcuOTA1SDEzLjVhLjc1Ljc1IDAgMDEwIDEuNUg0Ljk4NGwtMi40MzIgNy45MDVhLjc1Ljc1IDAgMDAuOTI2Ljk0IDYwLjUxOSA2MC41MTkgMCAwMDE4LjQ0NS04Ljk4Ni43NS43NSAwIDAwMC0xLjIxOEE2MC41MTcgNjAuNTE3IDAgMDAzLjQ3OCAyLjQwNXpcIiAvPlxuICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgMjogR0hJIENIXHUwMERBIENcdTFFRDhORyBUXHUwMEMxQyBcdTIwMTQgZW50cnkgYXBwZW5kLCBjXHUwMEYzIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ25vdGVzJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMiBtaW4taC0wIGgtZnVsbFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgPHNwYW4+R2hpIGNoXHUwMEZBIGNodW5nIGNcdTFFRTdhIHBoXHUwMEYybmcgXHUyMDE0IG1cdTFFRDdpIG5nXHUwMUIwXHUxRUREaSB0aFx1MDBFQW0gbVx1MUVEOXQgZFx1MDBGMm5nLCBjXHUwMEYzIHRoXHUxRUMzIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvPC9zcGFuPlxuICAgICAgICAgICAgICB7bm90ZXNOb3RpY2UgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1yb3NlLTMwMCBmb250LWJvbGRcIj57bm90ZXNOb3RpY2V9PC9zcGFuPn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHNwYWNlLXktMiBwci0xIG1pbi1oLTAgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTIuNVwiPlxuICAgICAgICAgICAgICB7bm90ZXNMaXN0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCB0ZXh0LWNlbnRlciBweS04XCI+Q2hcdTAxQjBhIGNcdTAwRjMgZ2hpIGNoXHUwMEZBIFx1MjAxNCB0aFx1MDBFQW0gZFx1MDBGMm5nIFx1MDExMVx1MUVBN3UgdGlcdTAwRUFuIGNobyBjXHUxRUEzIHBoXHUwMEYybmcuPC9wPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIG5vdGVzTGlzdC5tYXAoKG4pID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtuLmlkfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLXN0YXJ0IGdhcC0yIGdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtNDAwXCI+e24udGVufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtuLnZpZGVvVGltZVNlYyAhPSBudWxsICYmIG4udmlkZW9UaW1lU2VjID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB5ZXVDYXVUdWEobi52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIGhvdmVyOmJnLXZpb2xldC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYge2RpbmhEYW5nR2lheVBodXQobi52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNjAwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7bi50YW9MdWMgPyBuZXcgRGF0ZShuLnRhb0x1Yy5yZXBsYWNlKCcgJywgJ1QnKSArICdaJykudG9Mb2NhbGVUaW1lU3RyaW5nKFtdLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSkgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMjAwIGxlYWRpbmctcmVsYXhlZCBicmVhay13b3Jkc1wiPntuLm5vaUR1bmd9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgeyhuLmN1YVRvaSB8fCBpc1N0YWZmKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB4b2FHaGlDaHUobi5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlhvXHUwMEUxIGdoaSBjaFx1MDBGQVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcGFjaXR5LTAgZ3JvdXAtaG92ZXI6b3BhY2l0eS0xMDAgdGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1yb3NlLTQwMCB0ZXh0LVsxMHB4XSBweC0xIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHtub3Rlc0NhbldyaXRlID8gKFxuICAgICAgICAgICAgICA8Zm9ybVxuICAgICAgICAgICAgICAgIG9uU3VibWl0PXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIGlmICghZS5uYXRpdmVFdmVudD8uaXNDb21wb3NpbmcgJiYgIW5vdGVDb21wb3NpbmdSZWYuY3VycmVudCkgdGhlbUdoaUNodSgpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICBpZD1cInN0dWR5LW5vdGUtaW5wdXRcIlxuICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e25vdGVJbnB1dH1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldE5vdGVJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ9eygpID0+IHsgbm90ZUNvbXBvc2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ9eygpID0+IHsgbm90ZUNvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7IH19XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlRoXHUwMEVBbSBnaGkgY2hcdTAwRkEgY2hvIHBoXHUwMEYybmcuLi5cIlxuICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXsxMDAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTAgcm91bmRlZC14bCBweC0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmVcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXROb3RlV2l0aFRpbWUodiA9PiAhdil9XG4gICAgICAgICAgICAgICAgICB0aXRsZT17bm90ZVdpdGhUaW1lID8gJ1x1MDExMGFuZyBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbyB2XHUwMEUwbyBnaGkgY2hcdTAwRkEnIDogJ0toXHUwMEY0bmcgZ1x1MUVBRm4gbVx1MUVEMWMgdmlkZW8nfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtub3RlV2l0aFRpbWUgPyAnYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyLXZpb2xldC01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS01MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAgICAgIFx1MjNGMVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tYWRkLW5vdGVcIlxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFub3RlSW5wdXQudHJpbSgpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIHJvdW5kZWQteGwgYmctWyMwMEYyRkVdIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJsYWNrIGRpc2FibGVkOm9wYWNpdHktMzBcIj5cbiAgICAgICAgICAgICAgICAgIFRoXHUwMEVBbVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LWFtYmVyLTMwMC84MCB0ZXh0LWNlbnRlciBweS0xXCI+XHVEODNEXHVERDEyIEdoaSBjaFx1MDBGQSBcdTAxMTFhbmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSBjaFx1MUVDOSB4ZW0gXHUyMDE0IHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nIFx1MDExMVx1MDBFMyBraFx1MDBGM2EuPC9wPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDM6IEJcdTFFQTJORyBWXHUxRUJDIENcdTFFRDhORyBUXHUwMEMxQyAoU0hBUkVEIFdISVRFQk9BUkQpICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ3doaXRlYm9hcmQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0yIG1pbi1oLTAgaC1mdWxsXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBmbGV4LXdyYXAgdGV4dC14cyBwYi0xXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLXBlblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRXYlRvb2woJ3BlbicpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JUb29sID09PSAncGVuJyA/ICdiZy1bIzAwRjJGRV0gdGV4dC1ibGFjaycgOiAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAnfWB9PlxuICAgICAgICAgICAgICAgICAgXHUyNzBGXHVGRTBGIEJcdTAwRkF0IHZcdTFFQkRcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLWVyYXNlclwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRXYlRvb2woJ2VyYXNlcicpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JUb29sID09PSAnZXJhc2VyJyA/ICdiZy1yb3NlLTUwMCB0ZXh0LXdoaXRlJyA6ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCd9YH0+XG4gICAgICAgICAgICAgICAgICBcdUQ4M0VcdURERjkgVFx1MUVBOXlcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIG1sLTJcIj5cbiAgICAgICAgICAgICAgICAgIHtbJyMwMEYyRkUnLCAnI0ZGQjgwMCcsICcjRjQzRjVFJywgJyNGRkZGRkYnXS5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e2N9XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0V2JDb2xvcihjKTsgc2V0V2JUb29sKCdwZW4nKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTUgaC01IHJvdW5kZWQtZnVsbCBib3JkZXIgZGlzYWJsZWQ6b3BhY2l0eS00MCAke3diQ29sb3IgPT09IGMgJiYgd2JUb29sID09PSAncGVuJyA/ICdzY2FsZS0xMTAgYm9yZGVyLXdoaXRlIHJpbmctMiByaW5nLWN5YW4tNDAwJyA6ICdib3JkZXItdHJhbnNwYXJlbnQnfWB9XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogYyB9fVxuICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtjfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICB7aXNTdGFmZiAmJiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi13Yi1jbGVhclwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtjbGVhcldoaXRlYm9hcmR9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXdoaXRlLzUgaG92ZXI6Ymctcm9zZS01MDAvMjAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQteHMgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICBYXHUwMEYzYSBiXHUxRUEzbmdcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBvdmVyZmxvdy1oaWRkZW4gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcmVsYXRpdmUgdG91Y2gtbm9uZSBtaW4taC1bMjIwcHhdXCI+XG4gICAgICAgICAgICAgIHshd2JDYW5Xcml0ZSAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIHotMTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctYmxhY2svNDAgdGV4dC1bMTFweF0gdGV4dC1hbWJlci0zMDAvOTAgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTIgQlx1MUVBM25nIHZcdTFFQkQgXHUwMTExYW5nIFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgY2hcdTFFQzkgeGVtXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDxjYW52YXNcbiAgICAgICAgICAgICAgICBpZD1cInN0dWR5LXdoaXRlYm9hcmQtY2FudmFzXCJcbiAgICAgICAgICAgICAgICByZWY9e2NhbnZhc1JlZn1cbiAgICAgICAgICAgICAgICB3aWR0aD17NjQwfVxuICAgICAgICAgICAgICAgIGhlaWdodD17MzIwfVxuICAgICAgICAgICAgICAgIG9uTW91c2VEb3duPXt3YkNhbldyaXRlID8gc3RhcnREcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uTW91c2VNb3ZlPXt3YkNhbldyaXRlID8gZHJhd01vdmUgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZVVwPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaFN0YXJ0PXt3YkNhbldyaXRlID8gc3RhcnREcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uVG91Y2hNb3ZlPXt3YkNhbldyaXRlID8gZHJhd01vdmUgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaEVuZD17d2JDYW5Xcml0ZSA/IHN0b3BEcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBoLWZ1bGwgJHt3YkNhbldyaXRlID8gJ2N1cnNvci1jcm9zc2hhaXInIDogJ2N1cnNvci1ub3QtYWxsb3dlZCd9YH1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNDogQlx1MUVBMk5HIFRcdTAwQ0ROSCBDXHUxRUQ4TkcgVFx1MDBDMUMgKFNIQVJFRCBTSEVFVCA4eDEwKSAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdzaGVldCcgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTIgb3ZlcmZsb3cteC1hdXRvIG1pbi1oLTAgaC1mdWxsXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgIEJcdTFFQTNuZyB0XHUwMEVEbmggcGhcdTAwRTJuIHRcdTAwRURjaCBzXHUxRUQxIGxpXHUxRUM3dSAvIG1cdTFFRDFjIHRoXHUxRUREaSBnaWFuIGhcdTFFQ0RjIHRcdTFFQURwIChMXHUwMUIwdSB0XHUxRUYxIFx1MDExMVx1MUVEOW5nKVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy1hdXRvIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBiZy1bIzBCMEUxNF0gbWluLWgtMFwiPlxuICAgICAgICAgICAgICA8dGFibGUgaWQ9XCJzdHVkeS1zaGVldC10YWJsZVwiIGNsYXNzTmFtZT1cInctZnVsbCB0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIGJvcmRlci1jb2xsYXBzZVwiPlxuICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMCBmb250LW1vbm9cIj5cbiAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInctOCBwLTEgdGV4dC1jZW50ZXIgYm9yZGVyLXIgYm9yZGVyLXdoaXRlLzEwIHRleHQtWzEwcHhdXCI+IzwvdGg+XG4gICAgICAgICAgICAgICAgICAgIHtDT0xTLm1hcChjID0+IChcbiAgICAgICAgICAgICAgICAgICAgICA8dGgga2V5PXtjfSBjbGFzc05hbWU9XCJwLTEuNSB0ZXh0LWNlbnRlciBib3JkZXItciBib3JkZXItd2hpdGUvMTAgbWluLXctWzcwcHhdIHRleHQtWzExcHhdIGZvbnQtYm9sZCB0ZXh0LWN5YW4tMzAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7Y31cbiAgICAgICAgICAgICAgICAgICAgICA8L3RoPlxuICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICB7Uk9XUy5tYXAociA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDx0ciBrZXk9e3J9IGNsYXNzTmFtZT1cImJvcmRlci1iIGJvcmRlci13aGl0ZS81IGhvdmVyOmJnLXdoaXRlL1swLjAyXVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTEgdGV4dC1jZW50ZXIgYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTUwMCBmb250LW1vbm8gdGV4dC1bMTBweF0gYm9yZGVyLXIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cn1cbiAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgIHtDT0xTLm1hcChjID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNlbGxLZXkgPSBgJHtjfSR7cn1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGtleT17Y2VsbEtleX0gY2xhc3NOYW1lPVwicC0wIGJvcmRlci1yIGJvcmRlci13aGl0ZS81XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLWNlbGw9e2NlbGxLZXl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17c2hlZXRDZWxsc1tjZWxsS2V5XSB8fCAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlYWRPbmx5PXshc2hlZXRDYW5Xcml0ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRm9jdXM9eygpID0+IHsgc2hlZXRGb2N1c2VkQ2VsbFJlZi5jdXJyZW50ID0gY2VsbEtleTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17KCkgPT4geyBzaGVldEZvY3VzZWRDZWxsUmVmLmN1cnJlbnQgPSBudWxsOyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2hlZXRDYW5Xcml0ZSAmJiBoYW5kbGVDZWxsQ2hhbmdlKGNlbGxLZXksIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBiZy10cmFuc3BhcmVudCBweC0yIHB5LTEgdGV4dC14cyB0ZXh0LXdoaXRlIGZvY3VzOmJnLVsjMTUxQTIzXSBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctWyMwMEYyRkVdICR7IXNoZWV0Q2FuV3JpdGUgPyAnb3BhY2l0eS02MCBjdXJzb3Itbm90LWFsbG93ZWQnIDogJyd9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDU6IDEtVE8tMSBXRUJSVEMgVk9JQ0UgXHUyMDE0IHBhaXItYm91bmQsIGNcdTAwRjMgeGluIHF1eVx1MUVDMW4gKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAndm9pY2UnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTYgdGV4dC1jZW50ZXIgZ2FwLTRcIj5cbiAgICAgICAgICAgIDxhdWRpbyByZWY9e3JlbW90ZUF1ZGlvUmVmfSBhdXRvUGxheSAvPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTE2IGgtMTYgcm91bmRlZC0zeGwgYmctYW1iZXItNDAwLzE1IGJvcmRlciBib3JkZXItYW1iZXItNDAwLzMwIHRleHQtYW1iZXItNDAwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtM3hsIHNoYWRvdy1bMF8wXzIwcHhfcmdiYSgyNDUsMTU4LDExLDAuMildXCI+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REY5OVx1RkUwRlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtd2hpdGVcIj5UaG9cdTFFQTFpIFRyXHUxRUYxYyBUaVx1MUVCRnAgMS0xIFRyb25nIFBoXHUwMEYybmc8L2g0PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIG1heC13LXhzIG10LTFcIj5cbiAgICAgICAgICAgICAgICBNXHUxRUQ3aSBwaFx1MDBGMm5nIHRcdTFFRDFpIFx1MDExMWEgbVx1MUVEOXQgY1x1MUVCN3Agdm9pY2UgMS0xLiBNaWNybyBtXHUxRUI3YyBcdTAxMTFcdTFFQ0JuaCB0XHUxRUFGdCBraGkgY2hcdTAxQjBhIGJcdTFFQUR0LlxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFRyXHUxRUExbmcgdGhcdTAwRTFpIGNcdTFFQjdwIGhpXHUxRUM3biB0XHUxRUExaSAqL31cbiAgICAgICAgICAgIHt2b2ljZVBhaXI/LmFjdGl2ZSAhPT0gdW5kZWZpbmVkICYmIChcbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1tb25vIHRleHQtc2xhdGUtNDAwIGJnLXdoaXRlLzUgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgICAge3ZvaWNlUGFpcj8uYVRlbiA/IGAke3ZvaWNlUGFpci5hVGVufSR7dm9pY2VQYWlyLmJUZW4gPyAnIFx1MjE5NCAnICsgdm9pY2VQYWlyLmJUZW4gOiAnIFx1MDBCNyBcdTAxMTFhbmcgY2hcdTFFREQgbmdcdTAxQjBcdTFFRERpIHRoXHUxRUU5IDInfWAgOiAnQ2hcdTAxQjBhIGNcdTAwRjMgY1x1MUVCN3Agdm9pY2Ugblx1MDBFMG8nfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zIGZsZXgtd3JhcCBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICAgICAgICB7IXZvaWNlSm9pbmVkID8gKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICB7Y29RdXllbigndm9pY2UnKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLWpvaW5cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2pvaW5Wb2ljZX1cbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dm9pY2VQYWlyPy5hY3RpdmUgJiYgIXZvaWNlUGFpcj8ueW91SW59XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNSBweS0yLjUgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLW9yYW5nZS01MDAgdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQteHMgc2hhZG93LWxnIGhvdmVyOm9wYWNpdHktOTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktNDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7dm9pY2VQYWlyPy5hY3RpdmUgPyAnXHUwMTEwYW5nIGNcdTAwRjMgY1x1MUVCN3Agdm9pY2Uga2hcdTAwRTFjJyA6IHZvaWNlUGFpcj8uYVRlbiA/ICdWXHUwMEUwbyBjXHUxRUI3cCB2XHUxRURCaSAnICsgdm9pY2VQYWlyLmFUZW4gOiAnVGhhbSBnaWEgdm9pY2UnfVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1yZXF1ZXN0XCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt4aW5RdXllblZvaWNlfVxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt2b2ljZVJlcXVlc3RlZH1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIuNSByb3VuZGVkLXhsIGJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMjAwIGJvcmRlciBib3JkZXItd2hpdGUvMTUgZm9udC1ib2xkIHRleHQteHMgaG92ZXI6Ymctd2hpdGUvMTUgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHt2b2ljZVJlcXVlc3RlZCA/ICdcdTIzRjMgXHUwMTEwYW5nIGNoXHUxRUREIGR1eVx1MUVDN3RcdTIwMjYnIDogJ1x1RDgzRFx1REU0QiBYaW4gcXV5XHUxRUMxbiB2b2ljZSd9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2UtdG9nZ2xlLW1pY1wiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RvZ2dsZU1pY31cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtNCBweS0yLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7bWljTXV0ZWQgPyAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6Ymctd2hpdGUvMTUnIDogJ2JnLWVtZXJhbGQtNTAwIHRleHQtYmxhY2snfWB9PlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj57bWljTXV0ZWQgPyAnXHVEODNEXHVERDA3IEJcdTFFQUR0IE1pYycgOiAnXHVEODNDXHVERjk5XHVGRTBGIE1pYyBcdTAxMTBhbmcgQlx1MUVBRHQnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2UtbGVhdmVcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtsZWF2ZVZvaWNlfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzIwIHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8zMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgICBSXHUxRUREaSB2b2ljZVxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIHtpc1N0YWZmICYmIHZvaWNlUGFpcj8uYVRlbiAmJiAhdm9pY2VQYWlyPy55b3VJbiAmJiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1lbmRcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17bmdhdFZvaWNlQ2FwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xMCB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMjUgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMjAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgIE5nXHUxRUFGdCBjXHUxRUI3cCB2b2ljZVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBTdGFmZjogZGFuaCBzXHUwMEUxY2ggeGluIHF1eVx1MUVDMW4gdm9pY2UgKi99XG4gICAgICAgICAgICB7aXNTdGFmZiAmJiB5ZXVDYXVWb2ljZS5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgbWF4LXctc20gYmctd2hpdGUvNSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0yLjUgdGV4dC1sZWZ0XCI+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LWFtYmVyLTMwMCBtYi0xLjVcIj5cdTAxMTBhbmcgeGluIHF1eVx1MUVDMW4gdm9pY2U8L3A+XG4gICAgICAgICAgICAgICAge3lldUNhdVZvaWNlLm1hcChyID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtyLmtob2F9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgcHktMVwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTIwMCBmb250LXNlbWlib2xkIGZsZXgtMSB0cnVuY2F0ZVwiPntyLnRlbiB8fCAnVGhcdTAwRTBuaCB2aVx1MDBFQW4nfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHsgY29uc3QgZCA9IGF3YWl0IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogci5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogdHJ1ZSB9KTsgaWYgKGQ/Lm9rKSBzZXRZZXVDYXVWb2ljZShwcmV2ID0+IHByZXYuZmlsdGVyKHggPT4geC5raG9hICE9PSByLmtob2EpKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLWVtZXJhbGQtNTAwLzIwIHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctZW1lcmFsZC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICBEdXlcdTFFQzd0XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4geyBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiByLmtob2EsIGNhcGFiaWxpdHk6ICd2b2ljZScsIG9uOiBmYWxzZSB9KTsgaWYgKGQ/Lm9rKSBzZXRZZXVDYXVWb2ljZShwcmV2ID0+IHByZXYuZmlsdGVyKHggPT4geC5raG9hICE9PSByLmtob2EpKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8yNSB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICBUXHUxRUVCIGNoXHUxRUQxaVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIHt2b2ljZU5vdGljZSAmJiAoXG4gICAgICAgICAgICAgIDxwIGlkPVwidm9pY2Utc3RhdHVzLW5vdGljZVwiIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS0zMDAgZm9udC1tb25vIGJnLWJsYWNrLzQwIHB4LTMgcHktMS41IHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS81XCI+XG4gICAgICAgICAgICAgICAge3ZvaWNlTm90aWNlfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgbWF4LXcteHNcIj5cbiAgICAgICAgICAgICAgKiBHaGkgY2hcdTAwRkE6IEtcdTFFQkZ0IG5cdTFFRDFpIHRob1x1MUVBMWkgUDJQIHlcdTAwRUF1IGNcdTFFQTd1IG1cdTFFQTFuZyBraFx1MDBGNG5nIGNoXHUxRUI3biBVRFAuIFJlc3RyaWN0aXZlIE5BVCBjXHUwMEYzIHRoXHUxRUMzIGNcdTFFQTduIHJlbGF5IFRVUk4uXG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRBQiA3OiBUSFx1MDBDME5IIFZJXHUwMENBTiBUUk9ORyBQSFx1MDBEMk5HICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ21lbWJlcnMnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0zIG1pbi1oLTAgaC1mdWxsXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwYi0yIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQzY1PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlRoXHUwMEUwbmggdmlcdTAwRUFuIHRyb25nIHBoXHUwMEYybmcgKHt0aGFuaFZpZW4ubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgICBcdTAxMTBhbmcgdHJcdTFFRjFjIHR1eVx1MUVCRm5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTIgb3ZlcmZsb3cteS1hdXRvIHByLTEgbWluLWgtMFwiPlxuICAgICAgICAgICAgICB7dGhhbmhWaWVuLm1hcCgodHYsIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhSG9zdCA9IHR2LmxhQ2h1UGhvbmcgPT09IDEgfHwgdHYudmFpVHJvUGhvbmcgPT09ICdob3N0JztcbiAgICAgICAgICAgICAgICBjb25zdCBsYUdWID0gdHYudmFpVHJvID09PSAnZ2lhb192aWVuJztcbiAgICAgICAgICAgICAgICBjb25zdCBsYUNvSG9zdCA9IHR2LnZhaVRyb1Bob25nID09PSAnY29ob3N0JztcbiAgICAgICAgICAgICAgICBjb25zdCBncmFudFZvaWNlID0gZ3JhbnRzLnNvbWUoZyA9PiBnLmtob2FUViA9PT0gdHYua2hvYSAmJiBnLmNhcGFiaWxpdHkgPT09ICd2b2ljZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50VmlkZW8gPSBncmFudHMuc29tZShnID0+IGcua2hvYVRWID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZpZGVvX2NvbnRyb2wnKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgIGtleT17dHYua2hvYSB8fCB0di50ZW4gfHwgaWR4fVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41IHAtMi41IHJvdW5kZWQteGwgYmctd2hpdGUvWzAuMDNdIGhvdmVyOmJnLXdoaXRlL1swLjA2XSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgaG92ZXI6Ym9yZGVyLXRlYWwtNTAwLzI1IHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLWZ1bGwgYmctZ3JhZGllbnQtdG8tYnIgZnJvbS10ZWFsLTUwMC8yMCB0by1lbWVyYWxkLTUwMC8yMCBib3JkZXIgYm9yZGVyLXRlYWwtNTAwLzMwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteHMgZm9udC1ibGFjayB0ZXh0LXRlYWwtMzAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3R2LmF2YXRhciA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXt0di5hdmF0YXJ9IGFsdD1cIlwiIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgcm91bmRlZC1mdWxsIG9iamVjdC1jb3ZlclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICh0di50ZW4gfHwgJz8nKS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTIwMCB0cnVuY2F0ZVwiPnt0di50ZW59PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2xhSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNEXHVEQzUxIEhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUdWICYmICFsYUhvc3QgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzQ1x1REY5MyBHaVx1MDBFMW8gdmlcdTAwRUFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICB7bGFDb0hvc3QgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MkI1MCBDby1ob3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgYmxvY2sgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt0di5sb3BUZW4gPyBgTFx1MUVEQnAgJHt0di5sb3BUZW59YCA6IChsYUdWID8gJ0dpXHUwMEUxbyB2aVx1MDBFQW4gdHJcdTAxQjBcdTFFRERuZycgOiAnSFx1MUVDRGMgc2luaCcpfVxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgey8qIE1lbWJlciBhY3Rpb25zIG5cdTFFQkZ1IGxcdTAwRTAgaG9zdC9HViAqL31cbiAgICAgICAgICAgICAgICAgICAgeyh2YWlUcm9QaG9uZyA9PT0gJ2hvc3QnIHx8IGF1dGgudXNlcj8uaXNUZWFjaGVyKSAmJiAhbGFIb3N0ICYmIHR2Lmtob2EgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/Lignc2V0X2NvX2hvc3QnLCB7IGtob2FUVjogdHYua2hvYSwgb246ICFsYUNvSG9zdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2xhQ29Ib3N0ID8gJ1RodSBxdXlcdTFFQzFuIGNvLWhvc3QnIDogJ0NcdTFFQTVwIGNvLWhvc3QnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFDb0hvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlci12aW9sZXQtNTAwLzQwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjby1ob3N0XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246ICFncmFudFZvaWNlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNcdTFFQTVwL3RodSBxdXlcdTFFQzFuIG1pY1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNiBoLTYgcm91bmRlZCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LVsxMHB4XSBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFudFZvaWNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC80MCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERjk5XHVGRTBGXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZpZGVvX2NvbnRyb2wnLCBvbjogIWdyYW50VmlkZW8gfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gdmlkZW9cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTYgaC02IHJvdW5kZWQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTBweF0gYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JhbnRWaWRlb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctYmx1ZS01MDAvMjAgdGV4dC1ibHVlLTMwMCBib3JkZXItYmx1ZS01MDAvNDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzQ1x1REZBNVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpcm0oYEtpY2sgJHt0di50ZW59IGtoXHUxRUNGaSBwaFx1MDBGMm5nP2ApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdraWNrJywgeyBraG9hVFY6IHR2Lmtob2EgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZCAmJiAhZC5vaykgYWxlcnQoZC5sb2kgfHwgJ0toXHUwMEY0bmcga2ljayBcdTAxMTFcdTAxQjBcdTFFRTNjLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJLaWNrIGtoXHUxRUNGaSBwaFx1MDBGMm5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy02IGgtNiByb3VuZGVkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGJvcmRlciBiZy1yb3NlLTUwMC8xMCB0ZXh0LXJvc2UtMzAwIGJvcmRlci1yb3NlLTUwMC8yNSBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSl9XG5cbiAgICAgICAgICAgICAge3RoYW5oVmllbi5sZW5ndGggPT09IDAgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgcHktOCB0ZXh0LXNsYXRlLTUwMCB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgICBDaFx1MDFCMGEgY1x1MDBGMyB0aFx1MDBFMG5oIHZpXHUwMEVBbiBuXHUwMEUwbyB0cm9uZyBwaFx1MDBGMm5nLlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cblxuXG4gICAgICAgIHsvKiBUQUIgNjogUVVcdTFFQTJOIFRSXHUxRUNBIFBIXHUwMEQyTkcgKHN0YWZmIG9ubHkpIFx1MjAxNCBwb2xpY3kgbWF0cml4ICsgbWVtYmVyIGFjdGlvbnMgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAncXVhbi10cmknICYmIGlzU3RhZmYgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTMgb3ZlcmZsb3cteS1hdXRvIG1pbi1oLTAgcHItMSBoLWZ1bGxcIj5cbiAgICAgICAgICAgIHsvKiBRdWljayBhY3Rpb25zIHRoZW8gbVx1MDBGNCBoXHUwMEVDbmggXHUwMTExXHUwMEUzIGNoXHUxRUQxdCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNhcCBvZiBbJ25vdGVzJywgJ3doaXRlYm9hcmQnLCAnc2hlZXQnXSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiAxLCBhY2Nlc3NNb2RlOiAnc3RhZmZfb25seScgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTIgS2hcdTAwRjNhIGNcdTFFRDluZyB0XHUwMEUxYyAoY2hcdTFFQzkgeGVtKVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2FwIG9mIFsnbm90ZXMnLCAnd2hpdGVib2FyZCcsICdzaGVldCddKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6ICdldmVyeW9uZScgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgaG92ZXI6YmctZW1lcmFsZC01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTMgTVx1MUVERiBjXHUxRUQ5bmcgdFx1MDBFMWMgY2hvIG1cdTFFQ0RpIG5nXHUwMUIwXHUxRUREaVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogUG9saWN5IG1hdHJpeCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTNcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBtYi0yXCI+Q2hcdTAwRURuaCBzXHUwMEUxY2ggY1x1MDBGNG5nIGNcdTFFRTU8L3A+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgICB7W1xuICAgICAgICAgICAgICAgICAgWyd2aWRlb19jb250cm9sJywgJ1x1MDExMGlcdTFFQzF1IGtoaVx1MUVDM24gcGhcdTAwRTF0IChwbGF5L3BhdXNlL3R1YSknXSxcbiAgICAgICAgICAgICAgICAgIFsndmlkZW9fY2hhbmdlJywgJ1x1MDExMFx1MUVENWkgdmlkZW8gXHUwMTExYW5nIHBoXHUwMEUxdCddLFxuICAgICAgICAgICAgICAgICAgWydxdWV1ZScsICdIXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB2aWRlbyddLFxuICAgICAgICAgICAgICAgICAgWydjaGF0JywgJ0NoYXQgcGhcdTAwRjJuZyddLFxuICAgICAgICAgICAgICAgICAgWydub3RlcycsICdHaGkgY2hcdTAwRkEgY2h1bmcnXSxcbiAgICAgICAgICAgICAgICAgIFsnd2hpdGVib2FyZCcsICdCXHUxRUEzbmcgdlx1MUVCRCddLFxuICAgICAgICAgICAgICAgICAgWydzaGVldCcsICdCXHUxRUEzbmcgdFx1MDBFRG5oJ10sXG4gICAgICAgICAgICAgICAgICBbJ3ZvaWNlJywgJ1ZvaWNlIDEtMSddLFxuICAgICAgICAgICAgICAgICAgWydpbnZpdGUnLCAnTVx1MUVERGkgbmdcdTAxQjBcdTFFRERpIHZcdTAwRTBvIHBoXHUwMEYybmcnXSxcbiAgICAgICAgICAgICAgICBdLm1hcCgoW2NhcCwgbmhhbl0pID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHBvbCA9IHBvbGljaWVzPy5bY2FwXSB8fCB7IGVuYWJsZWQ6IDEsIGFjY2Vzc19tb2RlOiAnc3RhZmZfb25seScgfTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtjYXB9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmbGV4LTEgdGV4dC1zbGF0ZS0zMDAgdHJ1bmNhdGVcIj57bmhhbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiBwb2wuZW5hYmxlZCA/IDAgOiAxLCBhY2Nlc3NNb2RlOiBwb2wuYWNjZXNzX21vZGUgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cG9sLmVuYWJsZWQgPyAnXHUwMTEwYW5nIGJcdTFFQUR0IFx1MjAxNCBiXHUxRUE1bSBcdTAxMTFcdTFFQzMgdFx1MUVBRnQnIDogJ1x1MDExMGFuZyB0XHUxRUFGdCBcdTIwMTQgYlx1MUVBNW0gXHUwMTExXHUxRUMzIGJcdTFFQUR0J31cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctOCBoLTQuNSBweC0wLjUgcm91bmRlZC1mdWxsIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciAke3BvbC5lbmFibGVkID8gJ2JnLWVtZXJhbGQtNTAwLzMwIGJvcmRlci1lbWVyYWxkLTUwMC80MCBqdXN0aWZ5LWVuZCcgOiAnYmctd2hpdGUvNSBib3JkZXItd2hpdGUvMTUganVzdGlmeS1zdGFydCd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTMgaC0zIHJvdW5kZWQtZnVsbCAke3BvbC5lbmFibGVkID8gJ2JnLWVtZXJhbGQtNDAwJyA6ICdiZy1zbGF0ZS01MDAnfWB9Pjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17cG9sLmFjY2Vzc19tb2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFwb2wuZW5hYmxlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0xLjUgcHktMSB0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTIwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwic3RhZmZfb25seVwiPlF1XHUxRUEzbiB0clx1MUVDQjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInNlbGVjdGVkX21lbWJlcnNcIj5NXHUxRUQ5dCBzXHUxRUQxIG5nXHUwMUIwXHUxRUREaTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImV2ZXJ5b25lXCI+TVx1MUVDRGkgbmdcdTAxQjBcdTFFRERpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgb3BhY2l0eS02MFwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmxleC0xIHRleHQtc2xhdGUtNDAwXCI+S2lcdTFFQzNtIGR1eVx1MUVDN3QgKGtpY2sveG9cdTAwRTEgdGluKTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gZm9udC1ib2xkIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHJvdW5kZWQgcHgtMS41IHB5LTAuNVwiPkxVXHUwMEQ0TiBRVVx1MUVBMk4gVFJcdTFFQ0E8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBRdVx1MUVBM24gbFx1MDBGRCB0aFx1MDBFMG5oIHZpXHUwMEVBbiAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTNcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBtYi0yXCI+VGhcdTAwRTBuaCB2aVx1MDBFQW4gJiBxdXlcdTFFQzFuIHJpXHUwMEVBbmc8L3A+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgICB7KHRoYW5oVmllbiB8fCBbXSkubWFwKHR2ID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhSG9zdCA9IEJvb2xlYW4odHYubGFDaHVQaG9uZyk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUdWID0gdHYudmFpVHJvID09PSAnZ2lhb192aWVuJztcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhQ29Ib3N0ID0gdHYudmFpVHJvUGhvbmcgPT09ICdjb19ob3N0JztcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50Vm9pY2UgPSAoZ3JhbnRzIHx8IFtdKS5zb21lKGcgPT4gZy5raG9hID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZvaWNlJyAmJiBnLnRyYW5nVGhhaSA9PT0gJ2dyYW50ZWQnKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50VmlkZW8gPSAoZ3JhbnRzIHx8IFtdKS5zb21lKGcgPT4gZy5raG9hID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZpZGVvX2NvbnRyb2wnICYmIGcudHJhbmdUaGFpID09PSAnZ3JhbnRlZCcpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3R2Lmtob2EgfHwgdHYudGVufSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHRleHQteHMgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0yMDAgZm9udC1zZW1pYm9sZCB0cnVuY2F0ZSBtYXgtdy1bMTEwcHhdXCI+e3R2LnRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAge2xhSG9zdCAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtYW1iZXItNDAwIGZvbnQtYm9sZFwiPlx1MjYwNSBob3N0PC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7bGFHViAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtWyMwMEYyRkVdIGZvbnQtYm9sZFwiPkdWPC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7bGFDb0hvc3QgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXZpb2xldC0zMDAgZm9udC1ib2xkXCI+Y28taG9zdDwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAgeyFsYUhvc3QgJiYgIWxhR1YgJiYgdHYua2hvYSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtbC1hdXRvIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHsodmFpVHJvUGhvbmcgPT09ICdob3N0JyB8fCBhdXRoLnVzZXI/LmlzVGVhY2hlcikgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdzZXRfY29faG9zdCcsIHsga2hvYVRWOiB0di5raG9hLCBvbjogIWxhQ29Ib3N0IH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2xhQ29Ib3N0ID8gJ1RodSBxdXlcdTFFQzFuIGNvLWhvc3QnIDogJ0NcdTFFQTVwIGNvLWhvc3QnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2xhQ29Ib3N0ID8gJ2JnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlci12aW9sZXQtNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246ICFncmFudFZvaWNlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gdm9pY2VcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgJHtncmFudFZvaWNlID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHR2Lmtob2EsIGNhcGFiaWxpdHk6ICd2aWRlb19jb250cm9sJywgb246ICFncmFudFZpZGVvIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiB2aWRlb1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2dyYW50VmlkZW8gPyAnYmctY3lhbi01MDAvMjAgdGV4dC1jeWFuLTMwMCBib3JkZXItY3lhbi01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHsgaWYgKGNvbmZpcm0oYEtpY2sgJHt0di50ZW59IGtoXHUxRUNGaSBwaFx1MDBGMm5nP2ApKSB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2tpY2snLCB7IGtob2FUVjogdHYua2hvYSB9KTsgaWYgKGQgJiYgIWQub2spIGFsZXJ0KGQubG9pIHx8ICdLaFx1MDBGNG5nIGtpY2sgXHUwMTExXHUwMUIwXHUxRUUzYy4nKTsgfSB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiS2ljayBraFx1MUVDRmkgcGhcdTAwRjJuZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciBiZy1yb3NlLTUwMC8xMCB0ZXh0LXJvc2UtMzAwIGJvcmRlci1yb3NlLTUwMC8yNSBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgIHsodGhhbmhWaWVuIHx8IFtdKS5sZW5ndGggPT09IDAgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDBcIj5DaFx1MDFCMGEgY1x1MDBGMyB0aFx1MDBFMG5oIHZpXHUwMEVBbi48L3A+fVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogXHUwMTEwXHUxRUQ1aS9iXHUxRUNGIG1cdTFFQUR0IGtoXHUxRUE5dSBcdTIwMTQgY2hcdTFFQzkgaG9zdC9HViAqL31cbiAgICAgICAgICAgIHsodmFpVHJvUGhvbmcgPT09ICdob3N0JyB8fCBhdXRoLnVzZXI/LmlzVGVhY2hlcikgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0zIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJNXHUxRUFEdCBraFx1MUVBOXUgbVx1MUVEQmkgKFx1MDExMVx1MUVDMyB0clx1MUVEMW5nID0gYlx1MUVDRiBtXHUxRUFEdCBraFx1MUVBOXUpXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtcGhvbmctbWF0LWtoYXUtbW9pXCJcbiAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17MTAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnB1dC1waG9uZy1tYXQta2hhdS1tb2knKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWsgPSBlbD8udmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBtay50cmltKClcbiAgICAgICAgICAgICAgICAgICAgICA/IGF3YWl0IGhhbmhEb25nUGhvbmc/LignZG9pX21hdF9raGF1JywgeyBtYXRLaGF1TW9pOiBtay50cmltKCkgfSlcbiAgICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IGhhbmhEb25nUGhvbmc/LignYm9fbWF0X2toYXUnLCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkICYmICFkLm9rKSBhbGVydChkLmxvaSB8fCAnS2hcdTAwRjRuZyBcdTAxMTFcdTFFRDVpIFx1MDExMVx1MDFCMFx1MUVFM2MgbVx1MUVBRHQga2hcdTFFQTl1LicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWwpIGVsLnZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC1sZyBiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLWFtYmVyLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgXHUwMTEwXHUxRUQ1aSAvIEJcdTFFQ0ZcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDYW1wdXNXYXRjaFRvZ2V0aGVyKHtcbiAgcGhvbmcsXG4gIHBob25nTWluaEtob2E6IF9waG9uZ01pbmhLaG9hLFxuICBhdXRoLFxuICBkb25nUGhvbmdIaWVuVGFpOiBfZG9uZ1Bob25nSGllblRhaSxcbiAgc29OZ3VvaTogX3NvTmd1b2ksXG4gIG15Q2FwcyxcbiAgdmlkZW9UaW1lUmVmLFxuICBpc1Jvb21XaWRlLFxuICBsYXlvdXRSYXRpbyA9ICc2OjQnLFxuICBoYW5oRG9uZ1Bob25nOiBfaGFuaERvbmdQaG9uZyxcbiAgaXNTdGFmZiA9IGZhbHNlLFxufSkge1xuICBjb25zdCBbd2F0Y2hTdGF0ZSwgc2V0V2F0Y2hTdGF0ZV0gPSB1c2VTdGF0ZSh7XG4gICAgcGxheWluZzogZmFsc2UsXG4gICAgcG9zaXRpb25TZWNvbmRzOiAwLFxuICAgIGJhc2VQb3NpdGlvblNlY29uZHM6IDAsXG4gICAgcGxheWJhY2tSYXRlOiAxLjAsXG4gICAgcmV2aXNpb246IDEsXG4gICAgdXBkYXRlZEF0OiAnJyxcbiAgICBzZXJ2ZXJOb3c6ICcnLFxuICAgIHVwZGF0ZWRCeTogJydcbiAgfSk7XG4gIGNvbnN0IFtjYW5Db250cm9sLCBzZXRDYW5Db250cm9sXSA9IHVzZVN0YXRlKEJvb2xlYW4oXG4gICAgYXV0aD8udXNlcj8uaXNUZWFjaGVyIHx8IHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nIHx8IG15Q2Fwcz8udmlkZW9fY29udHJvbCB8fCBteUNhcHM/LnZpZGVvX2NoYW5nZSB8fCBpc1N0YWZmXG4gICkpO1xuICBjb25zdCBbX3dhdGNoQ2Fwcywgc2V0V2F0Y2hDYXBzXSA9IHVzZVN0YXRlKHt9KTtcbiAgY29uc3QgZ2V0SW5pdGlhbFZpZGVvVXJsID0gKCkgPT4ge1xuICAgIGxldCBjID0ge307XG4gICAgdHJ5IHsgYyA9IHBob25nPy5jYXVIaW5oID8gSlNPTi5wYXJzZShwaG9uZy5jYXVIaW5oKSA6IHt9OyB9IGNhdGNoIHsgfVxuICAgIHJldHVybiBjLnZpZGVvVXJsIHx8IHBob25nPy52aWRlb1VybCB8fCAnJztcbiAgfTtcblxuICBjb25zdCBnZXRJbml0aWFsUHJvdmlkZXIgPSAodSkgPT4ge1xuICAgIGlmICghdSkgcmV0dXJuICdVTlNVUFBPUlRFRCc7XG4gICAgaWYgKGlkWW91dHViZSh1KSkgcmV0dXJuICdZT1VUVUJFJztcbiAgICBpZiAoaWRHb29nbGVEcml2ZSh1KSkgcmV0dXJuICdHT09HTEVfRFJJVkUnO1xuICAgIGlmIChsYVZpZGVvVHJ1Y1RpZXBGZSh1KSkgcmV0dXJuICdOQVRJVkVfSFRNTDUnO1xuICAgIHJldHVybiAnVU5TVVBQT1JURUQnO1xuICB9O1xuXG4gIGNvbnN0IGluaXRVcmwgPSBnZXRJbml0aWFsVmlkZW9VcmwoKTtcbiAgY29uc3QgW2FjdGl2ZVZpZGVvVXJsLCBzZXRBY3RpdmVWaWRlb1VybF0gPSB1c2VTdGF0ZShpbml0VXJsKTtcbiAgY29uc3QgW3Byb3ZpZGVyLCBzZXRQcm92aWRlcl0gPSB1c2VTdGF0ZSgoKSA9PiBnZXRJbml0aWFsUHJvdmlkZXIoaW5pdFVybCkpO1xuICBjb25zdCBbaGFzSW50ZXJhY3RlZCwgc2V0SGFzSW50ZXJhY3RlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2NhbFRpbWUsIHNldExvY2FsVGltZV0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW2R1cmF0aW9uLCBzZXREdXJhdGlvbl0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW2RhbmdHdWlMZW5oLCBzZXREYW5nR3VpTGVuaF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2ksIHNldExvaV0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gQ2hcdTFFQkYgXHUwMTExXHUxRUQ5IHhlbSB0clx1MUVGMWMgdGlcdTFFQkZwIGNcdTAwRjluZyBjaFx1MUVFNyBwaFx1MDBGMm5nIGhheSB0XHUxRUExbSBkXHUxRUVCbmcveGVtIHJpXHUwMEVBbmcgY1x1MUVFN2EgbmdcdTAxQjBcdTFFRERpIHRoYW0gZ2lhXG4gIGNvbnN0IFtpc0xpdmVXaXRoSG9zdCwgc2V0SXNMaXZlV2l0aEhvc3RdID0gdXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IGlzTGl2ZVdpdGhIb3N0UmVmID0gdXNlUmVmKHRydWUpO1xuICBjb25zdCBbdmlld2VySXNQYXVzZWQsIHNldFZpZXdlcklzUGF1c2VkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgaXNQcm9ncmFtbWF0aWNBY3Rpb25SZWYgPSB1c2VSZWYoZmFsc2UpO1xuXG4gIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDXHUxRUE0VSBIXHUwMENDTkggVklERU8sIFRcdTAwQ0NNIEtJXHUxRUJFTSBZT1VUVUJFICYgSFx1MDBDME5HIFx1MDExMFx1MUVFMkkgVFx1MUVBMEkgVlx1MDBEOU5HIDEgXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IFttZWRpYVRhYiwgc2V0TWVkaWFUYWJdID0gdXNlU3RhdGUoJ3NlYXJjaCcpOyAvLyAnc2VhcmNoJyB8ICdxdWV1ZSdcbiAgY29uc3QgW3ZpZGVvTW9pLCBzZXRWaWRlb01vaV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtkYW5nRG9pVmlkZW8sIHNldERhbmdEb2lWaWRlb10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2lWaWRlbywgc2V0TG9pVmlkZW9dID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbdGhvbmdCYW9WaWRlbywgc2V0VGhvbmdCYW9WaWRlb10gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gWW91VHViZSBTZWFyY2ggU3RhdGVcbiAgY29uc3QgW3l0UXVlcnksIHNldFl0UXVlcnldID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbeXRSZXN1bHRzLCBzZXRZdFJlc3VsdHNdID0gdXNlU3RhdGUoW10pO1xuICBjb25zdCBbc2VhcmNoaW5nWXQsIHNldFNlYXJjaGluZ1l0XSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3NlYXJjaExvaSwgc2V0U2VhcmNoTG9pXSA9IHVzZVN0YXRlKCcnKTtcblxuICAvLyBRdWV1ZSBTdGF0ZVxuICBjb25zdCBbcXVldWVMaXN0LCBzZXRRdWV1ZUxpc3RdID0gdXNlU3RhdGUoW10pO1xuICBjb25zdCBxdWV1ZUxpc3RSZWYgPSB1c2VSZWYocXVldWVMaXN0KTtcbiAgcXVldWVMaXN0UmVmLmN1cnJlbnQgPSBxdWV1ZUxpc3Q7XG4gIGNvbnN0IFtxdWV1ZUJ1c3ksIHNldFF1ZXVlQnVzeV0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtkYU1vUm9uZ1N0dWRpbywgc2V0RGFNb1JvbmdTdHVkaW9dID0gdXNlU3RhdGUodHJ1ZSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAocGhvbmc/LmNhbkNvbnRyb2wgfHwgcGhvbmc/LmxhQ2h1UGhvbmcgfHwgYXV0aD8udXNlcj8uaXNUZWFjaGVyIHx8IG15Q2Fwcz8udmlkZW9fY29udHJvbCB8fCBteUNhcHM/LnZpZGVvX2NoYW5nZSB8fCBpc1N0YWZmKSB7XG4gICAgICBzZXRDYW5Db250cm9sKHRydWUpO1xuICAgIH1cbiAgfSwgW3Bob25nPy5jYW5Db250cm9sLCBwaG9uZz8ubGFDaHVQaG9uZywgYXV0aD8udXNlcj8uaXNUZWFjaGVyLCBteUNhcHMsIGlzU3RhZmZdKTtcblxuICAvLyBUXHUxRUEzaSBkYW5oIHNcdTAwRTFjaCBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB0XHUxRUVCIHNlcnZlclxuICBjb25zdCB0YWlRdWV1ZSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctcXVldWU/cGhvbmdJZD0ke3Bob25nLmlkfSZhY3Rpb249bGlzdGApO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vaykgc2V0UXVldWVMaXN0KGQucXVldWUgfHwgW10pO1xuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHRhaVF1ZXVlKCk7XG4gICAgY29uc3QgdGltZXIgPSBzZXRJbnRlcnZhbChraGlIaWVuVGhpKHRhaVF1ZXVlKSwgNDAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICB9LCBbcGhvbmcuaWRdKTtcblxuICAvLyBcdTAxMTBcdTFFRDVpIHZpZGVvIFx1MDExMWFuZyBwaFx1MDBFMXRcbiAgY29uc3QgZG9pVmlkZW8gPSBhc3luYyAodXJsLCB0aXRsZSkgPT4ge1xuICAgIGNvbnN0IHUgPSBTdHJpbmcodXJsIHx8IHZpZGVvTW9pIHx8IHl0UXVlcnkgfHwgJycpLnRyaW0oKTtcbiAgICBpZiAoIXUgfHwgZGFuZ0RvaVZpZGVvKSByZXR1cm47XG4gICAgc2V0RGFuZ0RvaVZpZGVvKHRydWUpO1xuICAgIHNldExvaVZpZGVvKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctd2F0Y2gnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAnc2V0X3ZpZGVvJywgdmlkZW9Vcmw6IHUsIGF1dG9QbGF5OiB0cnVlIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSB7XG4gICAgICAgIHNldExvaVZpZGVvKGQubG9pIHx8ICdLaFx1MDBGNG5nIFx1MDExMVx1MUVENWkgXHUwMTExXHUwMUIwXHUxRUUzYyB2aWRlby4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKHUpO1xuICAgICAgICBzZXRQcm92aWRlcihnZXRJbml0aWFsUHJvdmlkZXIodSkpO1xuICAgICAgICBzZXRWaWRlb01vaSgnJyk7XG4gICAgICAgIGlmIChkLnN0YXRlKSB7XG4gICAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgICBzZXRMb2NhbFRpbWUoMCk7XG4gICAgICAgIH1cbiAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSAwO1xuICAgICAgICBzZXREdXJhdGlvbigwKTtcbiAgICAgICAgY29uc3QgbmV3WXRJZCA9IGlkWW91dHViZSh1KTtcbiAgICAgICAgaWYgKG5ld1l0SWQgJiYgeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFJlYWR5UmVmLmN1cnJlbnQgJiYgdHlwZW9mIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQoeyB2aWRlb0lkOiBuZXdZdElkLCBzdGFydFNlY29uZHM6IDAgfSk7XG4gICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpO1xuICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBzZXRUaG9uZ0Jhb1ZpZGVvKGBcdTAxMTBhbmcgcGhcdTAwRTF0OiAke3RpdGxlIHx8IHV9YCk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VGhvbmdCYW9WaWRlbygnJyksIDQwMDApO1xuICAgICAgICB0YWlRdWV1ZSgpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0TG9pVmlkZW8oJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXREYW5nRG9pVmlkZW8oZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyBUXHUwMEVDbSBraVx1MUVCRm0gWW91VHViZVxuICBjb25zdCB0aW1LaWVtWW91VHViZSA9IGFzeW5jIChlLCB0dUtob2EpID0+IHtcbiAgICBlPy5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IHEgPSBTdHJpbmcodHVLaG9hIHx8IHl0UXVlcnkgfHwgJycpLnRyaW0oKTtcbiAgICBpZiAoIXEgfHwgc2VhcmNoaW5nWXQpIHJldHVybjtcbiAgICBpZiAodHVLaG9hKSBzZXRZdFF1ZXJ5KHR1S2hvYSk7XG5cbiAgICAvLyBOXHUxRUJGdSBuZ1x1MDFCMFx1MUVERGkgZFx1MDBGOW5nIGRcdTAwRTFuIGxpXHUwMEVBbiBrXHUxRUJGdCB2aWRlbyBZb3VUdWJlXG4gICAgY29uc3QgaWRZdCA9IGlkWW91dHViZShxKTtcbiAgICBpZiAoaWRZdCkge1xuICAgICAgc2V0WXRSZXN1bHRzKFt7XG4gICAgICAgIHZpZGVvSWQ6IGlkWXQsXG4gICAgICAgIHRpdGxlOiAnVmlkZW8gWW91VHViZSAodFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQgXHUwMTExXHUwMEUzIGRcdTAwRTFuKScsXG4gICAgICAgIGNoYW5uZWxUaXRsZTogJ1lvdVR1YmUnLFxuICAgICAgICB0aHVtYm5haWw6IGBodHRwczovL2kueXRpbWcuY29tL3ZpLyR7aWRZdH0vaHFkZWZhdWx0LmpwZ2AsXG4gICAgICAgIHB1Ymxpc2hlZEF0OiAnVHJcdTFFRjFjIHRpXHUxRUJGcCdcbiAgICAgIH1dKTtcbiAgICAgIHNldFNlYXJjaExvaSgnJyk7XG4gICAgICBzZXRNZWRpYVRhYignc2VhcmNoJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0U2VhcmNoaW5nWXQodHJ1ZSk7XG4gICAgc2V0U2VhcmNoTG9pKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkveW91dHViZS1zZWFyY2g/cT0ke2VuY29kZVVSSUNvbXBvbmVudChxKX1gKTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgQXJyYXkuaXNBcnJheShkLml0ZW1zKSkge1xuICAgICAgICBpZiAoZC5pdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBzZXRTZWFyY2hMb2koJ0toXHUwMEY0bmcgdFx1MDBFQ20gdGhcdTFFQTV5IHZpZGVvIG5cdTAwRTBvIHBoXHUwMEY5IGhcdTFFRTNwIHZcdTFFREJpIHRcdTFFRUIga2hcdTAwRjNhIG5cdTAwRTB5LicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldFl0UmVzdWx0cyhkLml0ZW1zKTtcbiAgICAgICAgICBzZXRNZWRpYVRhYignc2VhcmNoJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFNlYXJjaExvaShkLmxvaSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyB0XHUwMEVDbSBraVx1MUVCRm0gdmlkZW8gbFx1MDBGQWMgblx1MDBFMHkuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRTZWFyY2hMb2koJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIGtoaSB0XHUwMEVDbSBraVx1MUVCRm0gWW91VHViZS4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0U2VhcmNoaW5nWXQoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB2aWRlb1JlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgeXRQbGF5ZXJSZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IHl0Q29udGFpbmVySWQgPSBgeXQtcGxheWVyLSR7cGhvbmcuaWR9YDtcbiAgY29uc3QgaXNTZWVraW5nUmVmID0gdXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgaGFzSW50ZXJhY3RlZFJlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGR1cmF0aW9uUmVmID0gdXNlUmVmKDApO1xuICBjb25zdCBoYXNUcmlnZ2VyZWRTa2lwUmVmID0gdXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgaXNTa2lwcGluZ1JlZiA9IHVzZVJlZihmYWxzZSk7XG5cbiAgLy8gVGhhbyB0XHUwMEUxYyBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaSAoZW5xdWV1ZSwgYWRkX25leHQsIHBsYXlfbm93LCBza2lwLCByZW1vdmUpXG4gIGNvbnN0IGhhbmhEb25nUXVldWUgPSBhc3luYyAoYWN0aW9uLCBleHRyYSA9IHt9KSA9PiB7XG4gICAgaWYgKGFjdGlvbiA9PT0gJ3NraXAnKSB7XG4gICAgICBpZiAoaXNTa2lwcGluZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHF1ZXVlQnVzeSkgcmV0dXJuO1xuICAgICAgc2V0UXVldWVCdXN5KHRydWUpO1xuICAgIH1cbiAgICBzZXRMb2lWaWRlbygnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXF1ZXVlJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbiwgLi4uZXh0cmEgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoIWQub2spIHtcbiAgICAgICAgc2V0TG9pVmlkZW8oZC5sb2kgfHwgJ1RoYW8gdFx1MDBFMWMgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdGhcdTFFQTV0IGJcdTFFQTFpLicpO1xuICAgICAgICBpZiAoYWN0aW9uID09PSAnc2tpcCcpIHtcbiAgICAgICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ2VucXVldWUnKSB7XG4gICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbyhgXHUwMTEwXHUwMEUzIHRoXHUwMEVBbSB2XHUwMEUwbyBjdVx1MUVEMWkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2k6ICR7ZXh0cmEudGl0bGUgfHwgJ1ZpZGVvJ31gKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCAzNTAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdhZGRfbmV4dCcpIHtcbiAgICAgICAgICBzZXRUaG9uZ0Jhb1ZpZGVvKGBcdTAxMTBcdTAwRTMgdGhcdTAwRUFtIHBoXHUwMEUxdCBrXHUxRUJGIHRpXHUxRUJGcDogJHtleHRyYS50aXRsZSB8fCAnVmlkZW8nfWApO1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VGhvbmdCYW9WaWRlbygnJyksIDM1MDApO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ3BsYXlfbm93JyB8fCBhY3Rpb24gPT09ICdza2lwJykge1xuICAgICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgIGlmIChkLnZpZGVvVXJsKSB7XG4gICAgICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gMDtcbiAgICAgICAgICAgIHNldER1cmF0aW9uKDApO1xuICAgICAgICAgICAgc2V0QWN0aXZlVmlkZW9VcmwoZC52aWRlb1VybCk7XG4gICAgICAgICAgICBzZXRQcm92aWRlcihnZXRJbml0aWFsUHJvdmlkZXIoZC52aWRlb1VybCkpO1xuICAgICAgICAgICAgaWYgKGQuc3RhdGUpIHtcbiAgICAgICAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgICAgICAgc2V0TG9jYWxUaW1lKDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbmV3WXRJZCA9IGlkWW91dHViZShkLnZpZGVvVXJsKTtcbiAgICAgICAgICAgIGlmIChuZXdZdElkICYmIHl0UGxheWVyUmVmLmN1cnJlbnQgJiYgeXRSZWFkeVJlZi5jdXJyZW50ICYmIHR5cGVvZiB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQoeyB2aWRlb0lkOiBuZXdZdElkLCBzdGFydFNlY29uZHM6IDAgfSk7XG4gICAgICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbygnXHUwMTEwYW5nIGNodXlcdTFFQzNuIHZpZGVvIHRpXHUxRUJGcCB0aGVvLi4uJyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCAzMDAwKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGQuZW1wdHkpIHtcbiAgICAgICAgICAgIC8vIEhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIGhcdTFFQkZ0IHZpZGVvOiBUVVlcdTFFQzZUIFx1MDExMFx1MUVEMEkgS0hcdTAwRDRORyBYXHUwMEQzQSBEVVJBVElPTlxuICAgICAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc3QgZmluYWxEdXIgPSBkdXJhdGlvblJlZi5jdXJyZW50IHx8IGR1cmF0aW9uIHx8IGxvY2FsVGltZTtcbiAgICAgICAgICAgIGlmIChmaW5hbER1ciA+IDApIHNldExvY2FsVGltZShNYXRoLmZsb29yKGZpbmFsRHVyKSk7XG4gICAgICAgICAgICBpZiAoZC5zdGF0ZSkge1xuICAgICAgICAgICAgICBzZXRXYXRjaFN0YXRlKGQuc3RhdGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2V0V2F0Y2hTdGF0ZShwcmV2ID0+ICh7IC4uLnByZXYsIHBsYXlpbmc6IGZhbHNlLCBwb3NpdGlvblNlY29uZHM6IGZpbmFsRHVyIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldFRob25nQmFvVmlkZW8oJ0hcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIFx1MDExMVx1MDBFMyBoXHUxRUJGdCB2aWRlby4nKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VGhvbmdCYW9WaWRlbygnJyksIDMwMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0YWlRdWV1ZSgpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0TG9pVmlkZW8oJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgICAgaWYgKGFjdGlvbiA9PT0gJ3NraXAnKSB7XG4gICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKGFjdGlvbiAhPT0gJ3NraXAnKSB7XG4gICAgICAgIHNldFF1ZXVlQnVzeShmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFhcdTFFRUQgbFx1MDBGRCBraGkgdmlkZW8ga1x1MUVCRnQgdGhcdTAwRkFjIChFbmRlZCBob1x1MUVCN2MgY2hcdTFFQTFtIGR1cmF0aW9uIGN1XHUxRUQxaSlcbiAgY29uc3QgaGFuZGxlVmlkZW9FbmRlZCA9ICgpID0+IHtcbiAgICAvLyAxLiBOXHUxRUJGdSBjXHUwMEYzIHZpZGVvIHRpXHUxRUJGcCB0aGVvIHRyb25nIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIC0+IFRcdTFFRjEgXHUwMTExXHUxRUQ5bmcgY2h1eVx1MUVDM24gYlx1MDBFMGlcbiAgICBjb25zdCBoYXNOZXh0SW5RdWV1ZSA9IHF1ZXVlTGlzdFJlZi5jdXJyZW50ICYmIHF1ZXVlTGlzdFJlZi5jdXJyZW50Lmxlbmd0aCA+IDA7XG4gICAgaWYgKGNhbkNvbnRyb2wgJiYgaGFzTmV4dEluUXVldWUpIHtcbiAgICAgIGlmICghaXNTa2lwcGluZ1JlZi5jdXJyZW50ICYmICFoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1ZpZGVvIGtcdTFFQkZ0IHRoXHUwMEZBYyAtPiB0XHUxRUYxIFx1MDExMVx1MUVEOW5nIGNodXlcdTFFQzNuIHRpXHUxRUJGcCBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaScpO1xuICAgICAgICBoYW5oRG9uZ1F1ZXVlKCdza2lwJyk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gMi4gS2hcdTAwRjRuZyBjXHUwMEYybiB2aWRlbyB0cm9uZyBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaSAtPiBEXHUxRUVBTkcgUEhcdTAwQzFUIFZcdTAwQzAgS0hcdTAwRDNBIFRcdTFFQTBJIFx1MDExMElcdTFFQzJNIENVXHUxRUQwSSBWSURFT1xuICAgIGNvbnNvbGUubG9nKCdWaWRlbyBrXHUxRUJGdCB0aFx1MDBGQWMgLT4gVFx1MUVBMW0gZFx1MUVFQm5nIHBoXHUwMEUxdCB2aWRlbyB0XHUxRUExaSBcdTAxMTFpXHUxRUMzbSBjdVx1MUVEMWkgY2hvIHRvXHUwMEUwbiBiXHUxRUQ5IHBoXHUwMEYybmcnKTtcbiAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgIGNvbnN0IGZpbmFsRHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbiB8fCBsb2NhbFRpbWU7XG4gICAgaWYgKGZpbmFsRHVyID4gMCkge1xuICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IoZmluYWxEdXIpKTtcbiAgICB9XG5cbiAgICAvLyBEXHUxRUVCbmcgcGxheWVyIFlvdVR1YmUvSFRNTDUgY1x1MUVFNWMgYlx1MUVEOVxuICAgIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8ucGF1c2VWaWRlbykge1xuICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBhdXNlVmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgfVxuICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BhdXNlVmlkZW8nLCBhcmdzOiBbXSB9KSwgJyonKTtcbiAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICB0cnkgeyB2aWRlb1JlZi5jdXJyZW50LnBhdXNlKCk7IH0gY2F0Y2gge31cbiAgICB9XG5cbiAgICBpZiAoY2FuQ29udHJvbCkge1xuICAgICAgLy8gQ2hcdTFFRTcgcGhcdTAwRjJuZzogTHVcdTAwRjRuIGdcdTFFRURpIGxcdTFFQzduaCBwYXVzZSB0XHUxRUExaSBmaW5hbER1ciBsXHUwMEVBbiBtXHUwMEUxeSBjaFx1MUVFN1xuICAgICAgLy8gQlx1MUVDRiBxdWEgXHUwMTExaVx1MUVDMXUga2lcdTFFQzduIHdhdGNoU3RhdGUucGxheWluZyBcdTAxMTFcdTFFQzMgXHUwMTExXHUxRUEzbSBiXHUxRUEzbyB2XHUxRUNCIHRyXHUwMEVEIGxcdTAxQjB1IHRyXHUwMEVBbiBzZXJ2ZXIgbHVcdTAwRjRuIGxcdTAwRTAgZ2lcdTAwRTJ5IGtcdTFFQkZ0IHRoXHUwMEZBY1xuICAgICAgY29uc3QgdGFyZ2V0UG9zID0gZmluYWxEdXIgPiAwID8gTnVtYmVyKGZpbmFsRHVyLnRvRml4ZWQoMikpIDogdW5kZWZpbmVkO1xuICAgICAgZ3VpTGVuaFJlZi5jdXJyZW50Py4oJ3BhdXNlJywgdGFyZ2V0UG9zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTmdcdTAxQjBcdTFFRERpIHRoYW0gZ2lhOiBcdTAxMTBcdTAwRTFuaCBkXHUxRUE1dSBcdTAxMTFcdTAwRTMgZFx1MUVFQm5nLCBraFx1MDBGNG5nIHRcdTFFRjEgY2hcdTFFQTF5IHRpXHUxRUJGcCBuXHUxRUJGdSBraFx1MDBGNG5nIGNcdTAwRjMgbFx1MUVDN25oIGJcdTFFQUR0IGxcdTFFQTFpXG4gICAgICBzZXRWaWV3ZXJJc1BhdXNlZCh0cnVlKTtcbiAgICB9XG4gIH07XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgYyA9IHt9O1xuICAgIHRyeSB7IGMgPSBwaG9uZz8uY2F1SGluaCA/IEpTT04ucGFyc2UocGhvbmcuY2F1SGluaCkgOiB7fTsgfSBjYXRjaCB7IH1cbiAgICBjb25zdCBuZXh0VXJsID0gYy52aWRlb1VybCB8fCBwaG9uZz8udmlkZW9VcmwgfHwgJyc7XG4gICAgaWYgKG5leHRVcmwgJiYgbmV4dFVybCAhPT0gYWN0aXZlVmlkZW9VcmwpIHtcbiAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gMDtcbiAgICAgIHNldER1cmF0aW9uKDApO1xuICAgICAgc2V0QWN0aXZlVmlkZW9VcmwobmV4dFVybCk7XG4gICAgICBzZXRQcm92aWRlcihnZXRJbml0aWFsUHJvdmlkZXIobmV4dFVybCkpO1xuICAgICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICBzZXRJc0xpdmVXaXRoSG9zdCh0cnVlKTtcbiAgICAgIHNldFZpZXdlcklzUGF1c2VkKGZhbHNlKTtcbiAgICB9XG4gIH0sIFtwaG9uZz8uY2F1SGluaCwgcGhvbmc/LnZpZGVvVXJsXSk7XG5cbiAgY29uc3QgdmlkZW9VcmwgPSBhY3RpdmVWaWRlb1VybDtcbiAgY29uc3QgeXRJZCA9IHZpZGVvVXJsID8gaWRZb3V0dWJlKHZpZGVvVXJsKSA6IG51bGw7XG4gIGNvbnN0IGRydklkID0gdmlkZW9VcmwgPyBpZEdvb2dsZURyaXZlKHZpZGVvVXJsKSA6IG51bGw7XG4gIGNvbnN0IHRydWNUaWVwVXJsID0gdmlkZW9VcmwgJiYgIXl0SWQgJiYgIWRydklkICYmIGxhVmlkZW9UcnVjVGllcEZlKHZpZGVvVXJsKSA/IHVybE1lZGlhRmUodmlkZW9VcmwpIDogJyc7XG5cbiAgY29uc3QgW195dFBsYXllclJlYWR5LCBzZXRZdFBsYXllclJlYWR5XSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgeXRSZWFkeVJlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGN1cnJlbnRZdElkUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBoYXNTZWVrZWRJbml0UmVmID0gdXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgbGFzdEhvc3RTeW5jVGltZVJlZiA9IHVzZVJlZigwKTtcbiAgY29uc3QgbGFzdEFwcGxpZWRSZXZpc2lvblJlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgbGFzdEhvc3RUcmFja1RpbWVSZWYgPSB1c2VSZWYoeyB0aW1lOiAwLCBzdGFtcDogRGF0ZS5ub3coKSB9KTtcbiAgY29uc3QgbGFzdEdvTGl2ZUNsaWNrVGltZVJlZiA9IHVzZVJlZigwKTtcblxuICBjb25zdCB3YXRjaFN0YXRlUmVmID0gdXNlUmVmKHdhdGNoU3RhdGUpO1xuICB3YXRjaFN0YXRlUmVmLmN1cnJlbnQgPSB3YXRjaFN0YXRlO1xuICBjb25zdCBkYW5nR3VpTGVuaFJlZiA9IHVzZVJlZihkYW5nR3VpTGVuaCk7XG4gIGRhbmdHdWlMZW5oUmVmLmN1cnJlbnQgPSBkYW5nR3VpTGVuaDtcbiAgY29uc3QgZ3VpTGVuaFJlZiA9IHVzZVJlZihudWxsKTtcblxuICAvLyBUXHUwMEVEbmggdlx1MUVDQiB0clx1MDBFRCB0aFx1MUVERGkgZ2lhbiB0clx1MUVGMWMgdGlcdTFFQkZwIGhpXHUxRUM3biB0XHUxRUExaSBjXHUxRUU3YSBjaFx1MUVFNyBwaFx1MDBGMm5nIChnaVx1MUVEQmkgaFx1MUVBMW4ga2hcdTAwRjRuZyB2XHUwMUIwXHUxRUUzdCBxdVx1MDBFMSBcdTAxMTFcdTFFRDkgZFx1MDBFMGkgdmlkZW8pXG4gIGNvbnN0IGdldEhvc3RDdXJyZW50UG9zID0gKCkgPT4ge1xuICAgIGNvbnN0IHN0ID0gd2F0Y2hTdGF0ZVJlZi5jdXJyZW50IHx8IHdhdGNoU3RhdGU7XG4gICAgY29uc3Qgbm93TXMgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHVwZGF0ZVRpbWVNcyA9IHN0Py51cGRhdGVkQXRcbiAgICAgID8gbmV3IERhdGUoU3RyaW5nKHN0LnVwZGF0ZWRBdCkucmVwbGFjZSgnICcsICdUJykgKyAoU3RyaW5nKHN0LnVwZGF0ZWRBdCkuaW5jbHVkZXMoJ1QnKSA/ICcnIDogJ1onKSkuZ2V0VGltZSgpXG4gICAgICA6IG5vd01zO1xuICAgIGNvbnN0IGVsYXBzZWRTZWMgPSBNYXRoLm1heCgwLCAobm93TXMgLSB1cGRhdGVUaW1lTXMpIC8gMTAwMCk7XG4gICAgbGV0IHRhcmdldFBvcyA9IE51bWJlcihzdD8ucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgIGlmIChzdD8ucGxheWluZykge1xuICAgICAgdGFyZ2V0UG9zID0gTnVtYmVyKHN0LmJhc2VQb3NpdGlvblNlY29uZHMgIT0gbnVsbCA/IHN0LmJhc2VQb3NpdGlvblNlY29uZHMgOiBzdC5wb3NpdGlvblNlY29uZHMpICsgKGVsYXBzZWRTZWMgKiAoc3QucGxheWJhY2tSYXRlIHx8IDEuMCkpO1xuICAgIH1cbiAgICBjb25zdCBtYXhEdXIgPSBkdXJhdGlvblJlZi5jdXJyZW50IHx8IGR1cmF0aW9uO1xuICAgIGlmIChtYXhEdXIgPiAwKSB7XG4gICAgICAvLyBOXHUxRUJGdSBtXHUwMEUxeSBjaFx1MUVFNyBcdTAxMTFhbmcgcGF1c2Ugdlx1MDBFMCB2XHUxRUNCIHRyXHUwMEVEIFx1MUVERiBzXHUwMEUxdCBjdVx1MUVEMWkgdmlkZW8gKGNcdTAwRjJuIDwgMi41cykgLT4gY29pIG5oXHUwMUIwIHZpZGVvIFx1MDExMVx1MDBFMyBoXHUxRUJGdFxuICAgICAgaWYgKCFzdD8ucGxheWluZyAmJiB0YXJnZXRQb3MgPj0gbWF4RHVyIC0gMi41KSB7XG4gICAgICAgIHRhcmdldFBvcyA9IG1heER1cjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRhcmdldFBvcyA9IE1hdGgubWluKHRhcmdldFBvcywgbWF4RHVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIE1hdGgubWF4KDAsIE51bWJlcih0YXJnZXRQb3MudG9GaXhlZCgyKSkpO1xuICB9O1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBUXHUxRUE2TkcgMTogTFx1MUVBRm5nIG5naGUgdHJcdTFFRjFjIHRpXHUxRUJGcCB0aW4gbmhcdTFFQUZuIHBvc3RNZXNzYWdlIHRcdTFFRUIgWW91VHViZSBJRnJhbWUgXHUyNTAwXHUyNTAwXG4gIC8vIFlvdVR1YmUgSUZyYW1lIGx1XHUwMEY0biBwaFx1MDBFMXQgY1x1MDBFMWMgc1x1MUVGMSBraVx1MUVDN24gb25TdGF0ZUNoYW5nZSAmIGluZm9EZWxpdmVyeSByYSBwYXJlbnQgd2luZG93XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qgb25Nc2cgPSAoZSkgPT4ge1xuICAgICAgbGV0IGRhdGEgPSBlLmRhdGE7XG4gICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIGlmIChkYXRhLmluY2x1ZGVzKCdldmVudD0nKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhkYXRhKTtcbiAgICAgICAgICAgICAgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICBldmVudDogcGFyYW1zLmdldCgnZXZlbnQnKSxcbiAgICAgICAgICAgICAgICBpbmZvOiBwYXJhbXMuZ2V0KCdpbmZvJykgPyBKU09OLnBhcnNlKHBhcmFtcy5nZXQoJ2luZm8nKSkgOiBwYXJhbXMuZ2V0KCdpbmZvJylcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gY2F0Y2ggeyByZXR1cm47IH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFkYXRhIHx8IHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0JykgcmV0dXJuO1xuXG4gICAgICAvLyBDXHUxRUFEcCBuaFx1MUVBRHQgXHUwMTExXHUxRUQ5IGRcdTAwRTBpIHZpZGVvIHRoXHUxRUYxYyB0XHUxRUJGIChkdXJhdGlvbilcbiAgICAgIGNvbnN0IGQgPSBOdW1iZXIoZGF0YS5pbmZvPy5kdXJhdGlvbiB8fCBkYXRhLmR1cmF0aW9uIHx8IDApO1xuICAgICAgaWYgKGQgPiAwKSB7XG4gICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSBkO1xuICAgICAgICBzZXREdXJhdGlvbihwcmV2ID0+IChwcmV2ID4gMCA/IHByZXYgOiBkKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIENcdTFFQURwIG5oXHUxRUFEdCB0aFx1MUVERGkgZ2lhbiB0aFx1MUVGMWMgdFx1MUVCRiAoa1x1MUVCOXAga2hcdTAwRjRuZyB2XHUwMUIwXHUxRUUzdCBxdVx1MDBFMSBcdTAxMTFcdTFFRDkgZFx1MDBFMGkgdmlkZW8pXG4gICAgICBjb25zdCBjdXIgPSBOdW1iZXIoZGF0YS5pbmZvPy5jdXJyZW50VGltZSk7XG4gICAgICBpZiAoIWlzTmFOKGN1cikgJiYgY3VyID49IDAgJiYgIWlzU2Vla2luZ1JlZi5jdXJyZW50KSB7XG4gICAgICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgICAgIGNvbnN0IGNsYW1wZWRDdXIgPSBtYXhEdXIgPiAwID8gTWF0aC5taW4oY3VyLCBtYXhEdXIpIDogY3VyO1xuICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjbGFtcGVkQ3VyKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFx1MjUwMFx1MjUwMCBWXHUwMEQ5TkcgMjogXHUwMTEwXHUxRUQyTkcgQlx1MUVEOCBUSEFPIFRcdTAwQzFDIENcdTFFRTZBIENIXHUxRUU2IFBIXHUwMEQyTkcgSE9cdTFFQjZDIENIXHUxRUJFIFx1MDExMFx1MUVEOCBYRU0gQ1x1MUVFNkEgTkdcdTAxQUZcdTFFRENJIFRIQU0gR0lBIFx1MjUwMFx1MjUwMFxuICAgICAgY29uc3QgcFN0YXRlID0gZGF0YS5ldmVudCA9PT0gJ29uU3RhdGVDaGFuZ2UnXG4gICAgICAgID8gKHR5cGVvZiBkYXRhLmluZm8gPT09ICdudW1iZXInID8gZGF0YS5pbmZvIDogZGF0YS5pbmZvPy5wbGF5ZXJTdGF0ZSlcbiAgICAgICAgOiAoZGF0YS5ldmVudCA9PT0gJ2luZm9EZWxpdmVyeScgPyBkYXRhLmluZm8/LnBsYXllclN0YXRlIDogdW5kZWZpbmVkKTtcblxuICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgIWRhbmdHdWlMZW5oUmVmLmN1cnJlbnQgJiYgIWlzU2Vla2luZ1JlZi5jdXJyZW50KSB7XG4gICAgICAgIC8vIDEuIEJcdTFFQUZ0IFBsYXkgLyBQYXVzZSB0clx1MUVGMWMgdGlcdTFFQkZwIHRcdTFFRUIgbVx1MDBFMG4gaFx1MDBFQ25oIHZpZGVvIFlvdVR1YmVcbiAgICAgICAgY29uc3QgY3VyVGltZSA9ICFpc05hTihjdXIpICYmIGN1ciA+PSAwID8gY3VyIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIGlmIChwU3RhdGUgPT09IDEgJiYgIXdhdGNoU3RhdGVSZWYuY3VycmVudC5wbGF5aW5nKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1ZcdTAwRjluZyAyOiBDaFx1MUVFNyBwaFx1MDBGMm5nIGJcdTFFQTVtIFBsYXkgdHJcdTAwRUFuIFlvdVR1YmUgLT4gXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBjXHUxRUEzIHBoXHUwMEYybmcnKTtcbiAgICAgICAgICBndWlMZW5oUmVmLmN1cnJlbnQ/LigncGxheScsIGN1clRpbWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHBTdGF0ZSA9PT0gMiAmJiB3YXRjaFN0YXRlUmVmLmN1cnJlbnQucGxheWluZykge1xuICAgICAgICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgICAgICAgaWYgKG1heER1ciA+IDUgJiYgY3VyVGltZSAhPT0gdW5kZWZpbmVkICYmIGN1clRpbWUgPj0gbWF4RHVyIC0gMi41KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnVmlkZW8gY2hcdTFFQTFtIG5nXHUwMUIwXHUxRUUxbmcgY3VcdTFFRDFpIC0+IGtcdTAwRURjaCBob1x1MUVBMXQgaGFuZGxlVmlkZW9FbmRlZCB0aGF5IHZcdTAwRUMgcGF1c2UgbFx1MUVFRG5nIGxcdTAxQTEnKTtcbiAgICAgICAgICAgIGhhbmRsZVZpZGVvRW5kZWQoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1ZcdTAwRjluZyAyOiBDaFx1MUVFNyBwaFx1MDBGMm5nIGJcdTFFQTVtIFBhdXNlIHRyXHUwMEVBbiBZb3VUdWJlIC0+IFx1MDExMVx1MUVEM25nIGJcdTFFRDkgY1x1MUVBMyBwaFx1MDBGMm5nJyk7XG4gICAgICAgICAgICBndWlMZW5oUmVmLmN1cnJlbnQ/LigncGF1c2UnLCBjdXJUaW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyAyLiBCXHUxRUFGdCB0aGFvIHRcdTAwRTFjIHR1YSAoU2VlaykgdHJcdTAwRUFuIHRoYW5oIHRpXHUxRUJGbiB0clx1MDBFQ25oIFx1MDExMVx1MUVDRiBZb3VUdWJlICgwOjI5IC8gMjo0MTozMilcbiAgICAgICAgaWYgKCFpc05hTihjdXIpICYmIGN1ciA+PSAwKSB7XG4gICAgICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICBjb25zdCBwcmV2ID0gbGFzdEhvc3RUcmFja1RpbWVSZWYuY3VycmVudDtcbiAgICAgICAgICBjb25zdCBkdCA9IE1hdGgubWF4KDAsIChub3cgLSBwcmV2LnN0YW1wKSAvIDEwMDApO1xuICAgICAgICAgIGNvbnN0IGV4cGVjdGVkID0gd2F0Y2hTdGF0ZVJlZi5jdXJyZW50LnBsYXlpbmcgPyAocHJldi50aW1lICsgZHQpIDogcHJldi50aW1lO1xuICAgICAgICAgIGNvbnN0IGRlbHRhID0gTWF0aC5hYnMoY3VyIC0gZXhwZWN0ZWQpO1xuXG4gICAgICAgICAgLy8gTlx1MUVCRnUgdGhcdTFFRERpIGdpYW4gbmhcdTFFQTN5IGxcdTFFQzdjaCA+IDEuOCBnaVx1MDBFMnkgdHJvbmcga2hvXHUxRUEzbmcgdGhcdTFFRERpIGdpYW4gbmdcdTFFQUZuIChkdCA8IDRzKVxuICAgICAgICAgIC8vIGNoXHUxRUU5bmcgdFx1MUVDRiBjaFx1MUVFNyBwaFx1MDBGMm5nIHZcdTFFRUJhIGNsaWNrIGhvXHUxRUI3YyBrXHUwMEU5byB0aGFuaCBcdTAxMTFcdTFFQ0YgdHJcdTAwRUFuIHZpZGVvIFlvdVR1YmVcbiAgICAgICAgICBpZiAoZHQgPiAwLjI1ICYmIGR0IDwgNC4wICYmIGRlbHRhID4gMS44KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgVlx1MDBGOW5nIDI6IENoXHUxRUU3IHBoXHUwMEYybmcgdHVhIHRyXHUwMEVBbiB0aGFuaCBcdTAxMTFcdTFFQ0YgWW91VHViZSAoJHtjdXIudG9GaXhlZCgxKX1zLCBsXHUxRUM3Y2ggJHtkZWx0YS50b0ZpeGVkKDEpfXMpIC0+IFx1MDExMVx1MUVEM25nIGJcdTFFRDkgY1x1MUVBMyBwaFx1MDBGMm5nYCk7XG4gICAgICAgICAgICBsYXN0SG9zdFRyYWNrVGltZVJlZi5jdXJyZW50ID0geyB0aW1lOiBjdXIsIHN0YW1wOiBub3cgfTtcbiAgICAgICAgICAgIGd1aUxlbmhSZWYuY3VycmVudD8uKCdzZWVrJywgY3VyKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGR0ID49IDAuNSkge1xuICAgICAgICAgICAgbGFzdEhvc3RUcmFja1RpbWVSZWYuY3VycmVudCA9IHsgdGltZTogY3VyLCBzdGFtcDogbm93IH07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFjYW5Db250cm9sICYmICFpc1Byb2dyYW1tYXRpY0FjdGlvblJlZi5jdXJyZW50ICYmIChEYXRlLm5vdygpIC0gbGFzdEdvTGl2ZUNsaWNrVGltZVJlZi5jdXJyZW50ID4gMzUwMCkpIHtcbiAgICAgICAgLy8gTkdcdTAxQUZcdTFFRENJIFRIQU0gR0lBOiBUXHUxRUYxIGRvIHRcdTFFQTFtIGRcdTFFRUJuZyBob1x1MUVCN2MgdGlcdTFFQkZwIHRcdTFFRTVjIHhlbSAoY2hcdTFFQzkgbmhcdTFFQURuIHNcdTFFRjEga2lcdTFFQzduIHBhdXNlIHNhdSBraGkgaFx1MUVCRnQgdGhcdTFFRERpIGdpYW4gZ3JhY2UgcGVyaW9kIEdvIExpdmUpXG4gICAgICAgIGlmIChwU3RhdGUgPT09IDIgJiYgd2F0Y2hTdGF0ZVJlZi5jdXJyZW50LnBsYXlpbmcpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnb25Nc2c6IE5nXHUwMUIwXHUxRUREaSB4ZW0gdFx1MUVGMSBiXHUxRUE1bSBUXHUxRUExbSBkXHUxRUVCbmcgdHJcdTAwRUFuIFlvdVR1YmUgLT4gY2h1eVx1MUVDM24gc2FuZyB4ZW0gcmlcdTAwRUFuZycpO1xuICAgICAgICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICBzZXRJc0xpdmVXaXRoSG9zdChmYWxzZSk7XG4gICAgICAgICAgc2V0Vmlld2VySXNQYXVzZWQodHJ1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAocFN0YXRlID09PSAxKSB7XG4gICAgICAgICAgc2V0Vmlld2VySXNQYXVzZWQoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE5oXHUxRUFEbiBkaVx1MUVDN24gdHJcdTFFQTFuZyB0aFx1MDBFMWkga1x1MUVCRnQgdGhcdTAwRkFjIHZpZGVvOiAwID0gRU5ERURcbiAgICAgIGNvbnN0IGlzRW5kZWQgPSAoZGF0YS5ldmVudCA9PT0gJ29uU3RhdGVDaGFuZ2UnICYmIChkYXRhLmluZm8gPT09IDAgfHwgZGF0YS5pbmZvPy5wbGF5ZXJTdGF0ZSA9PT0gMCkpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgKGRhdGEuZXZlbnQgPT09ICdpbmZvRGVsaXZlcnknICYmIGRhdGEuaW5mbz8ucGxheWVyU3RhdGUgPT09IDApIHx8XG4gICAgICAgICAgICAgICAgICAgICAgKGRhdGEuaW5mbyAmJiBkYXRhLmluZm8ucGxheWVyU3RhdGUgPT09IDApO1xuXG4gICAgICBpZiAoaXNFbmRlZCkge1xuICAgICAgICBoYW5kbGVWaWRlb0VuZGVkKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgb25Nc2cpO1xuICAgIHJldHVybiAoKSA9PiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uTXNnKTtcbiAgfSwgW2NhbkNvbnRyb2wsIHBob25nLmlkXSk7XG5cbiAgLy8gR1x1MUVFRGkgbGlzdGVuaW5nIGhhbmRzaGFrZSBcdTAxMTFcdTFFQ0JuaCBrXHUxRUYzIHZcdTAwRTBvIGlmcmFtZSBZb3VUdWJlIFx1MDExMVx1MUVDMyBrXHUwMEVEY2ggaG9cdTFFQTF0IGV2ZW50IHN0cmVhbVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICgheXRJZCkgcmV0dXJuO1xuICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgIGlmICghaWZyKSByZXR1cm47XG4gICAgY29uc3QgdCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmci5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnbGlzdGVuaW5nJyB9KSwgJyonKTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9LCAxNTAwKTtcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbCh0KTtcbiAgfSwgW3l0SWQsIHBob25nLmlkXSk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFRcdTFFQTZORyAyOiBLaFx1MUVERmkgdFx1MUVBMW8gdlx1MDBFMCBrXHUxRUJGdCBuXHUxRUQxaSBZb3VUdWJlIElGcmFtZSBQbGF5ZXIgQVBJIHRyXHUxRUYxYyB0aVx1MUVCRnAgdlx1MDBFMG8gaWZyYW1lIFx1MjUwMFx1MjUwMFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICgheXRJZCkgcmV0dXJuO1xuICAgIGxldCBkZXN0cm95ZWQgPSBmYWxzZTtcbiAgICBsZXQgcmV0cnlUaW1lciA9IG51bGw7XG4gICAgbGV0IGF0dGVtcHRzID0gMDtcblxuICAgIC8vIE5cdTFFQkZ1IHBsYXllciBcdTAxMTFcdTAwRTMgdFx1MUVEM24gdFx1MUVBMWkgdlx1MDBFMCBzXHUxRUI1biBzXHUwMEUwbmc6IGNodXlcdTFFQzNuIGJcdTAwRTBpIHRcdTFFRTljIHRoXHUwMEVDIHF1YSBsb2FkVmlkZW9CeUlkIChraFx1MDBGNG5nIHJlbG9hZCBET00vaWZyYW1lKVxuICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50ICYmIHl0UmVhZHlSZWYuY3VycmVudCAmJiB0eXBlb2YgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoY3VycmVudFl0SWRSZWYuY3VycmVudCAhPT0geXRJZCkge1xuICAgICAgICAgIGN1cnJlbnRZdElkUmVmLmN1cnJlbnQgPSB5dElkO1xuICAgICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSAwO1xuICAgICAgICAgIHNldER1cmF0aW9uKDApO1xuICAgICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgIGNvbnN0IHN0YXJ0U2VjID0gTnVtYmVyKHdhdGNoU3RhdGUucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCh7XG4gICAgICAgICAgICB2aWRlb0lkOiB5dElkLFxuICAgICAgICAgICAgc3RhcnRTZWNvbmRzOiBzdGFydFNlY1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdMXHUxRUQ3aSBsb2FkVmlkZW9CeUlkOicsIGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGN1cnJlbnRZdElkUmVmLmN1cnJlbnQgPSB5dElkO1xuICAgIGhhc1NlZWtlZEluaXRSZWYuY3VycmVudCA9IGZhbHNlO1xuXG4gICAgY29uc3Qga2hvaVRhb1BsYXllciA9ICgpID0+IHtcbiAgICAgIGlmIChkZXN0cm95ZWQpIHJldHVybjtcbiAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICBpZiAoIWVsKSB7XG4gICAgICAgIGlmIChhdHRlbXB0cysrIDwgMzApIHtcbiAgICAgICAgICByZXRyeVRpbWVyID0gc2V0VGltZW91dChraG9pVGFvUGxheWVyLCAxMDApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKCF3aW5kb3cuWVQgfHwgIXdpbmRvdy5ZVC5QbGF5ZXIpIHtcbiAgICAgICAgaWYgKGF0dGVtcHRzKysgPCAzMCkge1xuICAgICAgICAgIHJldHJ5VGltZXIgPSBzZXRUaW1lb3V0KGtob2lUYW9QbGF5ZXIsIDE1MCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50ID0gbmV3IHdpbmRvdy5ZVC5QbGF5ZXIoZWwsIHtcbiAgICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAgIG9uUmVhZHk6IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoZGVzdHJveWVkKSByZXR1cm47XG4gICAgICAgICAgICAgIHl0UmVhZHlSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgICAgICAgIHNldFl0UGxheWVyUmVhZHkodHJ1ZSk7XG5cbiAgICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldC5nZXREdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBldmVudC50YXJnZXQuZ2V0RHVyYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAoZCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSBkO1xuICAgICAgICAgICAgICAgICAgc2V0RHVyYXRpb24oZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gVFx1MDBFRG5oIHZcdTFFQ0IgdHJcdTAwRUQgdGhcdTFFRERpIGdpYW4gaGlcdTFFQzduIHRcdTFFQTFpIGNcdTFFRTdhIHBoXHUwMEYybmcgXHUwMTExXHUxRUMzIHNlZWsgbmdheSBsXHUwMEZBYyBraFx1MUVERmkgdFx1MUVBMW9cbiAgICAgICAgICAgICAgY29uc3Qgbm93TXMgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICBjb25zdCB1cGRhdGVUaW1lTXMgPSB3YXRjaFN0YXRlLnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyh3YXRjaFN0YXRlLnVwZGF0ZWRBdCkucmVwbGFjZSgnICcsICdUJykgKyAoU3RyaW5nKHdhdGNoU3RhdGUudXBkYXRlZEF0KS5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS5nZXRUaW1lKCkgOiBub3dNcztcbiAgICAgICAgICAgICAgY29uc3QgZWxhcHNlZFNlYyA9IE1hdGgubWF4KDAsIChub3dNcyAtIHVwZGF0ZVRpbWVNcykgLyAxMDAwKTtcbiAgICAgICAgICAgICAgbGV0IHRQb3MgPSBOdW1iZXIod2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgICAgICAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgICB0UG9zID0gTnVtYmVyKHdhdGNoU3RhdGUuYmFzZVBvc2l0aW9uU2Vjb25kcyAhPSBudWxsID8gd2F0Y2hTdGF0ZS5iYXNlUG9zaXRpb25TZWNvbmRzIDogd2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMpICsgKGVsYXBzZWRTZWMgKiAod2F0Y2hTdGF0ZS5wbGF5YmFja1JhdGUgfHwgMS4wKSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAodFBvcyA+IDAgJiYgZXZlbnQudGFyZ2V0LnNlZWtUbykge1xuICAgICAgICAgICAgICAgIGhhc1NlZWtlZEluaXRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdHJ5IHsgZXZlbnQudGFyZ2V0LnNlZWtUbyh0UG9zLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZyAmJiAoY2FuQ29udHJvbCB8fCBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQgfHwgaGFzSW50ZXJhY3RlZCkgJiYgZXZlbnQudGFyZ2V0LnBsYXlWaWRlbykge1xuICAgICAgICAgICAgICAgIHRyeSB7IGV2ZW50LnRhcmdldC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25TdGF0ZUNoYW5nZTogKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChldmVudC50YXJnZXQgJiYgZXZlbnQudGFyZ2V0LmdldER1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IGV2ZW50LnRhcmdldC5nZXREdXJhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChkID4gMCAmJiBkdXJhdGlvblJlZi5jdXJyZW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gZDtcbiAgICAgICAgICAgICAgICAgIHNldER1cmF0aW9uKGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIFZpZGVvIGtcdTFFQkZ0IHRoXHUwMEZBYzoga1x1MDBFRGNoIGhvXHUxRUExdCBjaHV5XHUxRUMzbiBiXHUwMEUwaSBob1x1MUVCN2MgZFx1MUVFQm5nIGNcdTFFQTMgcGhcdTAwRjJuZ1xuICAgICAgICAgICAgICBpZiAoZXZlbnQuZGF0YSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGhhbmRsZVZpZGVvRW5kZWQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiAhZGFuZ0d1aUxlbmhSZWYuY3VycmVudCAmJiAhaXNTZWVraW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJQb3MgPSB0eXBlb2YgZXZlbnQudGFyZ2V0Py5nZXRDdXJyZW50VGltZSA9PT0gJ2Z1bmN0aW9uJyA/IGV2ZW50LnRhcmdldC5nZXRDdXJyZW50VGltZSgpIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5kYXRhID09PSAxICYmICF3YXRjaFN0YXRlUmVmLmN1cnJlbnQucGxheWluZykge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1lUIFBsYXllciBvblN0YXRlQ2hhbmdlID09PSAxIC0+IFx1MDExMVx1MUVEM25nIGJcdTFFRDkgUGxheSBjXHUxRUEzIHBoXHUwMEYybmcnKTtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmhSZWYuY3VycmVudD8uKCdwbGF5JywgY3VyUG9zKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmRhdGEgPT09IDIgJiYgd2F0Y2hTdGF0ZVJlZi5jdXJyZW50LnBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgICAgICAgICAgICAgICBpZiAobWF4RHVyID4gNSAmJiBjdXJQb3MgIT09IHVuZGVmaW5lZCAmJiBjdXJQb3MgPj0gbWF4RHVyIC0gMi41KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdZVCBvblN0YXRlQ2hhbmdlID09PSAyIGNoXHUxRUExbSBuZ1x1MDFCMFx1MUVFMW5nIGN1XHUxRUQxaSAtPiBrXHUwMEVEY2ggaG9cdTFFQTF0IGhhbmRsZVZpZGVvRW5kZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlVmlkZW9FbmRlZCgpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1lUIFBsYXllciBvblN0YXRlQ2hhbmdlID09PSAyIC0+IFx1MDExMVx1MUVEM25nIGJcdTFFRDkgUGF1c2UgY1x1MUVBMyBwaFx1MDBGMm5nJyk7XG4gICAgICAgICAgICAgICAgICAgIGd1aUxlbmhSZWYuY3VycmVudD8uKCdwYXVzZScsIGN1clBvcyk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFjYW5Db250cm9sICYmICFpc1Byb2dyYW1tYXRpY0FjdGlvblJlZi5jdXJyZW50ICYmIChEYXRlLm5vdygpIC0gbGFzdEdvTGl2ZUNsaWNrVGltZVJlZi5jdXJyZW50ID4gMzUwMCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuZGF0YSA9PT0gMiAmJiB3YXRjaFN0YXRlUmVmLmN1cnJlbnQucGxheWluZykge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1lUIFBsYXllciBvblN0YXRlQ2hhbmdlID09PSAyOiBOZ1x1MDFCMFx1MUVERGkgeGVtIHRcdTFFQTFtIGRcdTFFRUJuZyBZb3VUdWJlIC0+IGNodXlcdTFFQzNuIHNhbmcgeGVtIHJpXHUwMEVBbmcnKTtcbiAgICAgICAgICAgICAgICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIHNldElzTGl2ZVdpdGhIb3N0KGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgIHNldFZpZXdlcklzUGF1c2VkKHRydWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuZGF0YSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgc2V0Vmlld2VySXNQYXVzZWQoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBZb3VUdWJlIFBsYXllciBBUEk6JywgZXJyKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbmFwWW91VHViZUlmcmFtZUFwaSgoKSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KGtob2lUYW9QbGF5ZXIsIDEwMCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgZGVzdHJveWVkID0gdHJ1ZTtcbiAgICAgIGlmIChyZXRyeVRpbWVyKSBjbGVhclRpbWVvdXQocmV0cnlUaW1lcik7XG4gICAgfTtcbiAgfSwgW3l0SWQsIHBob25nLmlkLCBjYW5Db250cm9sXSk7XG5cbiAgLy8gXHUwMEMxcCBkXHUxRUU1bmcgdHJcdTFFQTFuZyB0aFx1MDBFMWkgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSB0XHUxRUVCIHNlcnZlciAoY2hcdTFFRDFuZyBnaVx1MUVBRHQgY2hcdTFFQURwIGNoXHUxRUREbiBjaG8gY1x1MUVBMyBIb3N0IGxcdTFFQUJuIE5nXHUwMUIwXHUxRUREaSB4ZW0pXG4gIGNvbnN0IGFwRHVuZ0RvbmdCbyA9IChzdCwgY3RybCwgcHJvdikgPT4ge1xuICAgIGlmICghc3QpIHJldHVybjtcbiAgICBjb25zdCBub3dNcyA9IERhdGUubm93KCk7XG4gICAgY29uc3QgdXBkYXRlVGltZU1zID0gc3QudXBkYXRlZEF0ID8gbmV3IERhdGUoU3RyaW5nKHN0LnVwZGF0ZWRBdCkucmVwbGFjZSgnICcsICdUJykgKyAoU3RyaW5nKHN0LnVwZGF0ZWRBdCkuaW5jbHVkZXMoJ1QnKSA/ICcnIDogJ1onKSkuZ2V0VGltZSgpIDogbm93TXM7XG4gICAgY29uc3QgZWxhcHNlZFNlYyA9IE1hdGgubWF4KDAsIChub3dNcyAtIHVwZGF0ZVRpbWVNcykgLyAxMDAwKTtcblxuICAgIGxldCB0YXJnZXRQb3MgPSBOdW1iZXIoc3QucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICB0YXJnZXRQb3MgPSBOdW1iZXIoc3QuYmFzZVBvc2l0aW9uU2Vjb25kcyAhPSBudWxsID8gc3QuYmFzZVBvc2l0aW9uU2Vjb25kcyA6IHN0LnBvc2l0aW9uU2Vjb25kcykgKyAoZWxhcHNlZFNlYyAqIChzdC5wbGF5YmFja1JhdGUgfHwgMS4wKSk7XG4gICAgfVxuICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgaWYgKG1heER1ciA+IDApIHtcbiAgICAgIGlmICghc3QucGxheWluZyAmJiB0YXJnZXRQb3MgPj0gbWF4RHVyIC0gMi41KSB7XG4gICAgICAgIHRhcmdldFBvcyA9IG1heER1cjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRhcmdldFBvcyA9IE1hdGgubWluKHRhcmdldFBvcywgbWF4RHVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDBcdTI1MDAgTkdVWVx1MDBDQU4gVFx1MUVBRUMgVlx1MDBDME5HOiBDSFx1MUVFNiBQSFx1MDBEMk5HIExcdTAwQzAgTkdVXHUxRUQyTiBQSFx1MDBDMVQgKFNPVVJDRSBPRiBUUlVUSCkgXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgLy8gVmlkZW8gY1x1MUVFN2EgQ2hcdTFFRTcgcGhcdTAwRjJuZyBcdTAxMTFhbmcgcGhcdTAwRTF0IHRcdTFFRjEgbmhpXHUwMEVBbiBtXHUwMUIwXHUxRUUzdCBtXHUwMEUwIDYwZnBzIHRyXHUwMEVBbiBZb3VUdWJlLlxuICAgIC8vIFR1eVx1MUVDN3QgXHUwMTExXHUxRUQxaSBLSFx1MDBENE5HIGdcdTFFQ0RpIHNlZWtUbyBoYXkgXHUwMEU5cCBwbGF5VmlkZW8gbFx1MDBFMG0gZ2lcdTFFQUR0IGxcdTAwRjlpL2toXHUxRUYxbmcgaFx1MDBFQ25oIHZpZGVvIGNcdTFFRTdhIENoXHUxRUU3IHBoXHUwMEYybmchXG4gICAgaWYgKGN0cmwpIHtcbiAgICAgIGlmIChpc1NlZWtpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgaWYgKHByb3YgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5nZXRDdXJyZW50VGltZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGN1ciA9IHl0UGxheWVyUmVmLmN1cnJlbnQuZ2V0Q3VycmVudFRpbWUoKTtcbiAgICAgICAgICBpZiAoY3VyID4gMCAmJiAhaXNOYU4oY3VyKSkgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IoY3VyKSk7XG4gICAgICAgIH0gY2F0Y2gge31cbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDBcdTI1MDAgXHUwMTEwXHUxRUQwSSBWXHUxRURBSSBIXHUxRUNDQyBTSU5IIC8gTkdcdTAxQUZcdTFFRENJIFhFTSBUUk9ORyBQSFx1MDBEMk5HIFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIC8vIE5cdTFFQkZ1IG5nXHUwMUIwXHUxRUREaSB4ZW0gXHUwMTExYW5nIFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgeGVtIHJpXHUwMEVBbmcgKCFpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50KTpcbiAgICAvLyBUVVlcdTFFQzZUIFx1MDExMFx1MUVEMEkgS0hcdTAwRDRORyBcdTAwRTlwIHNlZWtUbyBoYXkgcGxheVZpZGVvIGxcdTAwRTBtIGdpXHUwMEUxbiBcdTAxMTFvXHUxRUExbiB2aVx1MUVDN2MgeGVtIGNcdTFFRTdhIG5nXHUwMUIwXHUxRUREaSB0aGFtIGdpYSFcbiAgICBpZiAoIWlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBOXHUxRUJGdSB2aWRlbyBcdTAxMTFcdTAwRTMgY2hcdTFFQTFtIFx1MDExMVx1MUVCRm4gXHUwMTExaVx1MUVDM20gY3VcdTFFRDFpICh0YXJnZXRQb3MgPj0gbWF4RHVyKSB2XHUwMEUwIG1heER1ciA+IDA6XG4gICAgLy8gTmdcdTAxQjBcdTFFRERpIHhlbSBwaFx1MUVBM2kgZFx1MUVFQm5nIGxcdTFFQTFpIHRcdTFFQTFpIFx1MDExMWlcdTFFQzNtIGN1XHUxRUQxaSBWXHUwMEMwIFRVQSBcdTAxMTBcdTFFQkVOIEhcdTFFQkVUIFZJREVPIHkgY2hhbmcgY2hcdTFFRTcgcGhcdTAwRjJuZ1xuICAgIGlmIChtYXhEdXIgPiAwICYmIHRhcmdldFBvcyA+PSBtYXhEdXIpIHtcbiAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKG1heER1cikpO1xuICAgICAgaWYgKHByb3YgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lID0gbWF4RHVyO1xuICAgICAgICAgIHZpZGVvUmVmLmN1cnJlbnQucGF1c2UoKTtcbiAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgfSBlbHNlIGlmIChwcm92ID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgY29uc3QgcCA9IHl0UGxheWVyUmVmLmN1cnJlbnQ7XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZiAocD8uc2Vla1RvKSB7IHRyeSB7IHAuc2Vla1RvKG1heER1ciwgdHJ1ZSk7IH0gY2F0Y2gge30gfVxuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFttYXhEdXIsIHRydWVdIH0pLCAnKicpO1xuICAgICAgICBpZiAocD8ucGF1c2VWaWRlbykgeyB0cnkgeyBwLnBhdXNlVmlkZW8oKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGF1c2VWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgfVxuICAgICAgc2V0Vmlld2VySXNQYXVzZWQodHJ1ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNOZXdSZXZpc2lvbiA9IGxhc3RBcHBsaWVkUmV2aXNpb25SZWYuY3VycmVudCAhPT0gbnVsbCAmJiBzdC5yZXZpc2lvbiAhPT0gbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50O1xuICAgIGlmIChsYXN0QXBwbGllZFJldmlzaW9uUmVmLmN1cnJlbnQgPT09IG51bGwpIHtcbiAgICAgIGxhc3RBcHBsaWVkUmV2aXNpb25SZWYuY3VycmVudCA9IHN0LnJldmlzaW9uO1xuICAgIH1cblxuICAgIGlmIChwcm92ID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICBjb25zdCB2ID0gdmlkZW9SZWYuY3VycmVudDtcbiAgICAgIGlmICghaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ICYmIHRhcmdldFBvcyA+IDApIHtcbiAgICAgICAgaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgdi5jdXJyZW50VGltZSA9IHRhcmdldFBvcztcbiAgICAgIH1cbiAgICAgIGlmIChpc05ld1JldmlzaW9uKSB7XG4gICAgICAgIGxhc3RBcHBsaWVkUmV2aXNpb25SZWYuY3VycmVudCA9IHN0LnJldmlzaW9uO1xuICAgICAgICBpZiAoc3QucGxheWluZykge1xuICAgICAgICAgIHYuY3VycmVudFRpbWUgPSB0YXJnZXRQb3M7XG4gICAgICAgICAgaWYgKGhhc0ludGVyYWN0ZWQgfHwgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSB2LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IodGFyZ2V0UG9zKSk7XG4gICAgICAgICAgc2V0Vmlld2VySXNQYXVzZWQoZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHYucGF1c2UoKTtcbiAgICAgICAgICB2LmN1cnJlbnRUaW1lID0gTnVtYmVyKHN0LnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihOdW1iZXIoc3QucG9zaXRpb25TZWNvbmRzIHx8IDApKSk7XG4gICAgICAgICAgc2V0Vmlld2VySXNQYXVzZWQodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBzZXRMb2NhbFRpbWUoTWF0aC5tYXgoMCwgTWF0aC5mbG9vcih0YXJnZXRQb3MpKSk7XG4gICAgICBpZiAoc3QucGxheWluZykge1xuICAgICAgICBjb25zdCBkcmlmdCA9IE1hdGguYWJzKHYuY3VycmVudFRpbWUgLSB0YXJnZXRQb3MpO1xuICAgICAgICBpZiAoZHJpZnQgPiAzLjApIHtcbiAgICAgICAgICB2LmN1cnJlbnRUaW1lID0gdGFyZ2V0UG9zO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2LnBhdXNlZCAmJiAoaGFzSW50ZXJhY3RlZCB8fCBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpKSB7XG4gICAgICAgICAgdi5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIXYucGF1c2VkKSB2LnBhdXNlKCk7XG4gICAgICAgIGNvbnN0IGRyaWZ0ID0gTWF0aC5hYnModi5jdXJyZW50VGltZSAtIHN0LnBvc2l0aW9uU2Vjb25kcyk7XG4gICAgICAgIGlmIChkcmlmdCA+IDIuMCkge1xuICAgICAgICAgIHYuY3VycmVudFRpbWUgPSBzdC5wb3NpdGlvblNlY29uZHM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHByb3YgPT09ICdZT1VUVUJFJykge1xuICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICBjb25zdCBwID0geXRQbGF5ZXJSZWYuY3VycmVudDtcbiAgICAgIGxldCBjdXIgPSBudWxsO1xuICAgICAgbGV0IHBzID0gbnVsbDtcbiAgICAgIGlmIChwICYmIHR5cGVvZiBwLmdldEN1cnJlbnRUaW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRyeSB7IGN1ciA9IHAuZ2V0Q3VycmVudFRpbWUoKTsgfSBjYXRjaCB7fVxuICAgICAgfVxuICAgICAgaWYgKHAgJiYgdHlwZW9mIHAuZ2V0UGxheWVyU3RhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdHJ5IHsgcHMgPSBwLmdldFBsYXllclN0YXRlKCk7IH0gY2F0Y2gge31cbiAgICAgIH1cblxuICAgICAgLy8gSW5pdGlhbCBzZWVrIG5cdTFFQkZ1IG5nXHUwMUIwXHUxRUREaSB4ZW0gY2hcdTAxQjBhIHRcdTFFRUJuZyB0dWEgXHUwMTExXHUxRUJGbiBtXHUxRUQxYyBjXHUxRUU3YSBjaFx1MUVFNyBwaFx1MDBGMm5nXG4gICAgICBpZiAoIWhhc1NlZWtlZEluaXRSZWYuY3VycmVudCAmJiB0YXJnZXRQb3MgPiAwKSB7XG4gICAgICAgIGhhc1NlZWtlZEluaXRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgIGlmIChwPy5zZWVrVG8pIHsgdHJ5IHsgcC5zZWVrVG8odGFyZ2V0UG9zLCB0cnVlKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3RhcmdldFBvcywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEtoaSBwaFx1MDBFMXQgaGlcdTFFQzduIHRoYW8gdFx1MDBFMWMgbVx1MUVEQmkgdFx1MUVFQiBjaFx1MUVFNyBwaFx1MDBGMm5nIChSZXZpc2lvbiB0aGF5IFx1MDExMVx1MUVENWkgZG8gY2hcdTFFRTcgcGhcdTAwRjJuZyBiXHUxRUE1bSBWXHUwMEY5bmcgMSBob1x1MUVCN2MgVlx1MDBGOW5nIDIpXG4gICAgICBpZiAoaXNOZXdSZXZpc2lvbikge1xuICAgICAgICBsYXN0QXBwbGllZFJldmlzaW9uUmVmLmN1cnJlbnQgPSBzdC5yZXZpc2lvbjtcbiAgICAgICAgaWYgKCFzdC5wbGF5aW5nKSB7XG4gICAgICAgICAgLy8gQ2hcdTFFRTcgcGhcdTAwRjJuZyBiXHUxRUE1bSBUXHUxRUExbSBkXHUxRUVCbmc6IExcdTFFQURwIHRcdTFFRTljIHRcdTFFQTFtIGRcdTFFRUJuZyB2XHUwMEUwIHR1YSB2XHUxRUMxIFx1MDExMVx1MDBGQW5nIHZcdTFFQ0IgdHJcdTAwRUQgY2hcdTFFRTcgcGhcdTAwRjJuZyBcdTAxMTFcdTAwRTMgZFx1MUVFQm5nXG4gICAgICAgICAgaWYgKHA/LnBhdXNlVmlkZW8pIHsgdHJ5IHsgcC5wYXVzZVZpZGVvKCk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGF1c2VWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgICAgIGNvbnN0IHBTZWMgPSBOdW1iZXIoc3QucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgICAgICAgIGlmIChwPy5zZWVrVG8pIHsgdHJ5IHsgcC5zZWVrVG8ocFNlYywgdHJ1ZSk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3BTZWMsIHRydWVdIH0pLCAnKicpO1xuICAgICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKHBTZWMpKTtcbiAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZCh0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDaFx1MUVFNyBwaFx1MDBGMm5nIGJcdTFFQTVtIFBoXHUwMEUxdCB0aVx1MUVCRnAgaG9cdTFFQjdjIHZcdTFFRUJhIFR1YSB0aFx1MUVERGkgZ2lhbjogTFx1MUVBRHAgdFx1MUVFOWMgdHVhIHZcdTAwRTAgcGhcdTAwRTF0IHkgY2hhbmcgY2hcdTFFRTcgcGhcdTAwRjJuZ1xuICAgICAgICAgIGlmIChwPy5zZWVrVG8pIHsgdHJ5IHsgcC5zZWVrVG8odGFyZ2V0UG9zLCB0cnVlKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbdGFyZ2V0UG9zLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgICAgICBpZiAoaGFzSW50ZXJhY3RlZCB8fCBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIGlmIChwPy5wbGF5VmlkZW8pIHsgdHJ5IHsgcC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BsYXlWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcih0YXJnZXRQb3MpKTtcbiAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZChmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBHaVx1MUVFRiBuaFx1MUVDQnAgcGhcdTAwRTF0IFx1MUVENW4gXHUwMTExXHUxRUNCbmggdHJvbmcgY1x1MDBFMWMgY2h1IGtcdTFFRjMgcG9sbCBcdTAxMTFcdTFFQ0JuaCBrXHUxRUYzXG4gICAgICBzZXRMb2NhbFRpbWUoTWF0aC5tYXgoMCwgTWF0aC5mbG9vcih0YXJnZXRQb3MpKSk7XG5cbiAgICAgIGlmIChjdXIgIT09IG51bGwgJiYgIWlzTmFOKGN1cikpIHtcbiAgICAgICAgY29uc3QgZHJpZnQgPSBNYXRoLmFicyhjdXIgLSB0YXJnZXRQb3MpO1xuICAgICAgICBpZiAoc3QucGxheWluZykge1xuICAgICAgICAgIGlmIChkcmlmdCA+IDMuNSkge1xuICAgICAgICAgICAgaWYgKHA/LnNlZWtUbykgeyB0cnkgeyBwLnNlZWtUbyh0YXJnZXRQb3MsIHRydWUpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3RhcmdldFBvcywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgocHMgPT09IDIgfHwgcHMgPT09IDUpICYmIChoYXNJbnRlcmFjdGVkIHx8IGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCkpIHtcbiAgICAgICAgICAgIGlmIChwPy5wbGF5VmlkZW8pIHsgdHJ5IHsgcC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BsYXlWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBLaGkgc2VydmVyIGJcdTAwRTFvIHBhdXNlLCBsdVx1MDBGNG4gZ1x1MUVFRGkgcGF1c2Ugblx1MUVCRnUgcGxheWVyIFx1MDExMWFuZyBwaFx1MDBFMXRcbiAgICAgICAgICBpZiAocHMgPT09IDEgfHwgcHMgPT09IDMpIHtcbiAgICAgICAgICAgIGlmIChwPy5wYXVzZVZpZGVvKSB7IHRyeSB7IHAucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGF1c2VWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZHJpZnQgPiAxLjgpIHtcbiAgICAgICAgICAgIGlmIChwPy5zZWVrVG8pIHsgdHJ5IHsgcC5zZWVrVG8oc3QucG9zaXRpb25TZWNvbmRzLCB0cnVlKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFtzdC5wb3NpdGlvblNlY29uZHMsIHRydWVdIH0pLCAnKicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHN0LnBsYXlpbmcgJiYgKGhhc0ludGVyYWN0ZWQgfHwgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSAmJiBwcyAhPT0gMSkge1xuICAgICAgICAgIGlmIChwPy5wbGF5VmlkZW8pIHsgdHJ5IHsgcC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwbGF5VmlkZW8nLCBhcmdzOiBbXSB9KSwgJyonKTtcbiAgICAgICAgfSBlbHNlIGlmICghc3QucGxheWluZykge1xuICAgICAgICAgIGlmIChwPy5wYXVzZVZpZGVvKSB7IHRyeSB7IHAucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BhdXNlVmlkZW8nLCBhcmdzOiBbXSB9KSwgJyonKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBQb2xsIHRyXHUxRUExbmcgdGhcdTAwRTFpIG1cdTAwRTF5IGNoXHUxRUU3IG1cdTFFRDdpIDEuMnMgXHUwMTExXHUxRUMzIG5nXHUwMUIwXHUxRUREaSB0aGFtIGdpYSBiXHUxRUFGdCBrXHUxRUNCcCB0XHUxRUU5YyB0aFx1MDBFQyB0aGFvIHRcdTAwRTFjIGNcdTFFRTdhIGNoXHUxRUU3IHBoXHUwMEYybmdcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaFdhdGNoID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctd2F0Y2g/cGhvbmdJZD0ke3Bob25nLmlkfWApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKCFhY3RpdmUpIHJldHVybjtcbiAgICAgICAgaWYgKGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgICAgc2V0Q2FuQ29udHJvbChCb29sZWFuKGQuY2FuQ29udHJvbCkpO1xuICAgICAgICAgIGlmIChkLmNhcHMpIHNldFdhdGNoQ2FwcyhkLmNhcHMpO1xuICAgICAgICAgIHNldFByb3ZpZGVyKGQucHJvdmlkZXIgfHwgJ1VOU1VQUE9SVEVEJyk7XG4gICAgICAgICAgaWYgKGQucGhvbmc/LnZpZGVvVXJsICYmIGQucGhvbmcudmlkZW9VcmwgIT09IGFjdGl2ZVZpZGVvVXJsKSB7XG4gICAgICAgICAgICBzZXRBY3RpdmVWaWRlb1VybChkLnBob25nLnZpZGVvVXJsKTtcbiAgICAgICAgICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICAgICAgc2V0SXNMaXZlV2l0aEhvc3QodHJ1ZSk7XG4gICAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZChmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGFwRHVuZ0RvbmdCbyhkLnN0YXRlLCBCb29sZWFuKGQuY2FuQ29udHJvbCksIGQucHJvdmlkZXIgfHwgJ1VOU1VQUE9SVEVEJyk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggeyB9XG4gICAgfTtcblxuICAgIGZldGNoV2F0Y2goKTtcbiAgICBjb25zdCB0aW1lciA9IHNldEludGVydmFsKGtoaUhpZW5UaGkoZmV0Y2hXYXRjaCksIDEyMDApO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBhY3RpdmUgPSBmYWxzZTtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgIH07XG4gIH0sIFtwaG9uZy5pZCwgaGFzSW50ZXJhY3RlZF0pO1xuXG4gIC8vIFRcdTFFRjEgXHUwMTExXHUxRUQ5bmcgdFx1MUVBMW0gZFx1MUVFQm5nIHBoXHUwMEYybmcga2hpIGNoXHUxRUU3IHBoXHUwMEYybmcgXHUwMTExXHUwMEYzbmcgdGFiIHRyXHUwMEVDbmggZHV5XHUxRUM3dFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IG9uVW5sb2FkID0gKCkgPT4ge1xuICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgd2F0Y2hTdGF0ZVJlZi5jdXJyZW50Py5wbGF5aW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgcGF5bG9hZCA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgICAgYWN0aW9uOiAncGF1c2UnLFxuICAgICAgICAgICAgcG9zaXRpb246IGxvY2FsVGltZSxcbiAgICAgICAgICAgIGV4cGVjdGVkUmV2aXNpb246IHdhdGNoU3RhdGVSZWYuY3VycmVudC5yZXZpc2lvbixcbiAgICAgICAgICAgIHBsYXliYWNrUmF0ZTogMS4wXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgbmF2aWdhdG9yLnNlbmRCZWFjb24oJy9hcGkvcGhvbmctd2F0Y2gnLCBuZXcgQmxvYihbcGF5bG9hZF0sIHsgdHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nIH0pKTtcbiAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgfVxuICAgIH07XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2JlZm9yZXVubG9hZCcsIG9uVW5sb2FkKTtcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JlZm9yZXVubG9hZCcsIG9uVW5sb2FkKTtcbiAgfSwgW2NhbkNvbnRyb2wsIHBob25nLmlkLCBsb2NhbFRpbWVdKTtcblxuICAvLyBcdTI1MDBcdTI1MDAgVFx1MUVBNk5HIDMgJiA0OiBQb3NpdGlvbmFsIFdhdGNoZG9nICYgQ1x1MUVBRHAgbmhcdTFFQUR0IGxvY2FsVGltZSBtXHUwMUIwXHUxRUUzdCBtXHUwMEUwIFx1MjUwMFx1MjUwMFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGlzUGxheWluZyA9IGNhbkNvbnRyb2wgPyB3YXRjaFN0YXRlLnBsYXlpbmcgOiAoaXNMaXZlV2l0aEhvc3QgPyB3YXRjaFN0YXRlLnBsYXlpbmcgOiAhdmlld2VySXNQYXVzZWQpO1xuICAgIGlmICghaXNQbGF5aW5nKSByZXR1cm47XG4gICAgY29uc3QgdGljayA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmIChpc1NlZWtpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuXG4gICAgICBsZXQgY3VyVGltZSA9IG51bGw7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgcCA9IHl0UGxheWVyUmVmLmN1cnJlbnQ7XG4gICAgICAgICAgaWYgKHAuZ2V0RHVyYXRpb24pIHtcbiAgICAgICAgICAgIGNvbnN0IGQgPSBwLmdldER1cmF0aW9uKCk7XG4gICAgICAgICAgICBpZiAoZCA+IDApIHtcbiAgICAgICAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IGQ7XG4gICAgICAgICAgICAgIGlmIChkdXJhdGlvbiA9PT0gMCkgc2V0RHVyYXRpb24oZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwLmdldEN1cnJlbnRUaW1lKSB7XG4gICAgICAgICAgICBjb25zdCBjdXIgPSBwLmdldEN1cnJlbnRUaW1lKCk7XG4gICAgICAgICAgICBpZiAoY3VyICE9PSB1bmRlZmluZWQgJiYgY3VyICE9PSBudWxsICYmICFpc05hTihjdXIpKSB7XG4gICAgICAgICAgICAgIGN1clRpbWUgPSBjdXI7XG4gICAgICAgICAgICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgICAgICAgICAgIGNvbnN0IGNsYW1wZWRDdXIgPSBtYXhEdXIgPiAwID8gTWF0aC5taW4oY3VyLCBtYXhEdXIpIDogY3VyO1xuICAgICAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjbGFtcGVkQ3VyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwLmdldFBsYXllclN0YXRlICYmIHAuZ2V0UGxheWVyU3RhdGUoKSA9PT0gMCkge1xuICAgICAgICAgICAgaGFuZGxlVmlkZW9FbmRlZCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgICBjb25zdCBjdXIgPSB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lO1xuICAgICAgICBpZiAoIWlzTmFOKGN1cikpIHtcbiAgICAgICAgICBjdXJUaW1lID0gY3VyO1xuICAgICAgICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgICAgICAgY29uc3QgY2xhbXBlZEN1ciA9IG1heER1ciA+IDAgPyBNYXRoLm1pbihjdXIsIG1heER1cikgOiBjdXI7XG4gICAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IoY2xhbXBlZEN1cikpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEdpXHUwMEUxbSBzXHUwMEUxdCB2XHUxRUNCIHRyXHUwMEVEOiBuXHUxRUJGdSB2aWRlbyBcdTAxMTFcdTAwRTMgcGhcdTAwRTF0IFx1MDExMVx1MUVCRm4gZ2lcdTAwRTJ5IGN1XHUxRUQxaSBjXHUwMEY5bmcgaG9cdTFFQjdjIHF1XHUwMEUxIGR1cmF0aW9uXG4gICAgICBjb25zdCBtYXhEdXIgPSBkdXJhdGlvblJlZi5jdXJyZW50IHx8IGR1cmF0aW9uO1xuICAgICAgY29uc3QgY3VycmVudFBvcyA9IGN1clRpbWUgIT09IG51bGwgPyBjdXJUaW1lIDogbG9jYWxUaW1lO1xuICAgICAgaWYgKG1heER1ciA+IDUgJiYgKGN1cnJlbnRQb3MgPj0gbWF4RHVyIC0gMS4wIHx8IGxvY2FsVGltZSA+PSBtYXhEdXIpKSB7XG4gICAgICAgIGhhbmRsZVZpZGVvRW5kZWQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2FuQ29udHJvbCAmJiBjdXJUaW1lICE9PSBudWxsICYmIGN1clRpbWUgPiAwICYmICFkYW5nR3VpTGVuaFJlZi5jdXJyZW50ICYmICFpc1NlZWtpbmdSZWYuY3VycmVudCkge1xuICAgICAgICBjb25zdCBub3dNcyA9IERhdGUubm93KCk7XG4gICAgICAgIGlmICghbGFzdEhvc3RTeW5jVGltZVJlZi5jdXJyZW50KSBsYXN0SG9zdFN5bmNUaW1lUmVmLmN1cnJlbnQgPSBub3dNcztcbiAgICAgICAgY29uc3QgdXBkYXRlVGltZU1zID0gd2F0Y2hTdGF0ZS51cGRhdGVkQXQgPyBuZXcgRGF0ZShTdHJpbmcod2F0Y2hTdGF0ZS51cGRhdGVkQXQpLnJlcGxhY2UoJyAnLCAnVCcpICsgKFN0cmluZyh3YXRjaFN0YXRlLnVwZGF0ZWRBdCkuaW5jbHVkZXMoJ1QnKSA/ICcnIDogJ1onKSkuZ2V0VGltZSgpIDogbm93TXM7XG4gICAgICAgIGNvbnN0IGVsYXBzZWRTZWMgPSBNYXRoLm1heCgwLCAobm93TXMgLSB1cGRhdGVUaW1lTXMpIC8gMTAwMCk7XG4gICAgICAgIGNvbnN0IGV4cGVjdGVkU2VydmVyUG9zID0gTnVtYmVyKHdhdGNoU3RhdGUuYmFzZVBvc2l0aW9uU2Vjb25kcyAhPSBudWxsID8gd2F0Y2hTdGF0ZS5iYXNlUG9zaXRpb25TZWNvbmRzIDogd2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMpICsgKGVsYXBzZWRTZWMgKiAod2F0Y2hTdGF0ZS5wbGF5YmFja1JhdGUgfHwgMS4wKSk7XG4gICAgICAgIGNvbnN0IGhvc3REcmlmdCA9IE1hdGguYWJzKGN1clRpbWUgLSBleHBlY3RlZFNlcnZlclBvcyk7XG5cbiAgICAgICAgY29uc3QgZGFRdWExNXMgPSAobm93TXMgLSBsYXN0SG9zdFN5bmNUaW1lUmVmLmN1cnJlbnQgPiAxNTAwMCk7XG4gICAgICAgIGlmICgoaG9zdERyaWZ0ID4gMy4wIHx8IGRhUXVhMTVzKSAmJiAobm93TXMgLSBsYXN0SG9zdFN5bmNUaW1lUmVmLmN1cnJlbnQgPiA0MDAwKSkge1xuICAgICAgICAgIGxhc3RIb3N0U3luY1RpbWVSZWYuY3VycmVudCA9IG5vd01zO1xuICAgICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBjdXJUaW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY3VyVGltZSA9PT0gbnVsbCkge1xuICAgICAgICBzZXRMb2NhbFRpbWUodCA9PiB7XG4gICAgICAgICAgaWYgKG1heER1ciA+IDApIHtcbiAgICAgICAgICAgIGlmICh0ID49IG1heER1cikgcmV0dXJuIE1hdGguZmxvb3IobWF4RHVyKTtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLm1pbih0ICsgMSwgTWF0aC5mbG9vcihtYXhEdXIpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHQgKyAxO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LCAxMDAwKTtcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbCh0aWNrKTtcbiAgfSwgW3dhdGNoU3RhdGUucGxheWluZywgdmlld2VySXNQYXVzZWQsIGlzTGl2ZVdpdGhIb3N0LCBwcm92aWRlciwgZHVyYXRpb24sIGxvY2FsVGltZSwgY2FuQ29udHJvbF0pO1xuXG4gIGNvbnN0IHBlbmRpbmdHdWlMZW5oUmVmID0gdXNlUmVmKG51bGwpO1xuXG4gIC8vIEdcdTFFRURpIGxcdTFFQzduaCBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIChQbGF5IC8gUGF1c2UgLyBTZWVrKVxuICBjb25zdCBndWlMZW5oID0gYXN5bmMgKGFjdGlvbiwgY3VzdG9tUG9zKSA9PiB7XG4gICAgaWYgKGRhbmdHdWlMZW5oUmVmLmN1cnJlbnQpIHtcbiAgICAgIHBlbmRpbmdHdWlMZW5oUmVmLmN1cnJlbnQgPSB7IGFjdGlvbiwgY3VzdG9tUG9zIH07XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNldERhbmdHdWlMZW5oKHRydWUpO1xuICAgIGRhbmdHdWlMZW5oUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHNldExvaSgnJyk7XG5cbiAgICBsZXQgcG9zID0gY3VzdG9tUG9zO1xuICAgIGlmIChwb3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICAgIHBvcyA9IHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWU7XG4gICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudD8uZ2V0Q3VycmVudFRpbWUpIHtcbiAgICAgICAgcG9zID0geXRQbGF5ZXJSZWYuY3VycmVudC5nZXRDdXJyZW50VGltZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9zID0gbG9jYWxUaW1lO1xuICAgICAgfVxuICAgIH1cbiAgICBwb3MgPSBNYXRoLm1heCgwLCBOdW1iZXIoKHBvcyB8fCAwKS50b0ZpeGVkKDIpKSk7XG5cbiAgICAvLyBDXHUxRUFEcCBuaFx1MUVBRHQgbFx1MUVBMWMgcXVhbiB0clx1MDBFQW4gbG9jYWwgcGxheWVyXG4gICAgaWYgKGFjdGlvbiA9PT0gJ3BsYXknKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBsYXlWaWRlbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwbGF5VmlkZW8nLCBhcmdzOiBbXSB9KSwgJyonKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ3BhdXNlJykge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LnBhdXNlKCk7XG4gICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wYXVzZVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wYXVzZVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwYXVzZVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdzZWVrJykge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lID0gcG9zO1xuICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8uc2Vla1RvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8ocG9zLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFtwb3MsIHRydWVdIH0pLCAnKicpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBjdXJyZW50UmV2ID0gd2F0Y2hTdGF0ZVJlZi5jdXJyZW50Py5yZXZpc2lvbiB8fCB3YXRjaFN0YXRlLnJldmlzaW9uIHx8IDE7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy13YXRjaCcsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgYWN0aW9uLFxuICAgICAgICAgIHBvc2l0aW9uOiBwb3MsXG4gICAgICAgICAgZXhwZWN0ZWRSZXZpc2lvbjogY3VycmVudFJldixcbiAgICAgICAgICBwbGF5YmFja1JhdGU6IHdhdGNoU3RhdGVSZWYuY3VycmVudD8ucGxheWJhY2tSYXRlIHx8IHdhdGNoU3RhdGUucGxheWJhY2tSYXRlIHx8IDEuMFxuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIGQuc3RhdGUpIHtcbiAgICAgICAgbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ID0gZC5zdGF0ZS5yZXZpc2lvbjtcbiAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IoZC5zdGF0ZS5wb3NpdGlvblNlY29uZHMgfHwgcG9zKSk7XG4gICAgICB9IGVsc2UgaWYgKGQuY29uZmxpY3QgJiYgZC5zdGF0ZSkge1xuICAgICAgICBzZXRXYXRjaFN0YXRlKGQuc3RhdGUpO1xuICAgICAgICBhcER1bmdEb25nQm8oZC5zdGF0ZSwgY2FuQ29udHJvbCwgcHJvdmlkZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0TG9pKGQubG9pIHx8ICdMXHUxRUQ3aSBjXHUxRUFEcCBuaFx1MUVBRHQgcGhcdTAwRTF0IHZpZGVvLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0TG9pKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RGFuZ0d1aUxlbmgoZmFsc2UpO1xuICAgICAgZGFuZ0d1aUxlbmhSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgaWYgKHBlbmRpbmdHdWlMZW5oUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgY29uc3QgbmV4dCA9IHBlbmRpbmdHdWlMZW5oUmVmLmN1cnJlbnQ7XG4gICAgICAgIHBlbmRpbmdHdWlMZW5oUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICBndWlMZW5oKG5leHQuYWN0aW9uLCBuZXh0LmN1c3RvbVBvcyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGd1aUxlbmhSZWYuY3VycmVudCA9IGd1aUxlbmg7XG5cbiAgLy8gXHUwMTEwXHUxRUQzbmcgYlx1MUVEOSB2XHUxRUNCIHRyXHUwMEVEIHZpZGVvIGhpXHUxRUM3biB0XHUxRUExaSByYSBuZ29cdTAwRTBpIFx1MDExMVx1MUVDMyBjaGF0IGdcdTFFQUZuIHRpbWVzdGFtcFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh2aWRlb1RpbWVSZWYpIHZpZGVvVGltZVJlZi5jdXJyZW50ID0gbG9jYWxUaW1lO1xuICB9LCBbbG9jYWxUaW1lLCB2aWRlb1RpbWVSZWZdKTtcblxuXG5cbiAgLy8gTmhcdTFFQURuIHlcdTAwRUF1IGNcdTFFQTd1IHR1YSB0XHUxRUVCIFN0dWR5RG9jayAoYlx1MUVBNW0gbVx1MUVEMWMgdmlkZW8gdHJvbmcgY2hhdC9naGkgY2hcdTAwRkEpLlxuICAvLyBDXHUwMEYzIHF1eVx1MUVDMW4gXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiBcdTIxOTIgcGhcdTAwRTF0IGxcdTFFQzduaCBzZWVrIGNodW5nOyBraFx1MDBGNG5nIFx1MjE5MiBjaFx1MUVDOSB0dWEgY1x1MUVFNWMgYlx1MUVEOSBwbGF5ZXIgY1x1MUVFN2EgbVx1MDBFQ25oLlxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IG9uU2Vla1JlcSA9IChlKSA9PiB7XG4gICAgICBpZiAoZS5kZXRhaWw/LnBob25nSWQgJiYgU3RyaW5nKGUuZGV0YWlsLnBob25nSWQpICE9PSBTdHJpbmcocGhvbmc/LmlkKSkgcmV0dXJuO1xuICAgICAgY29uc3Qgc2VjID0gTWF0aC5tYXgoMCwgTnVtYmVyKGUuZGV0YWlsPy5zZWMpIHx8IDApO1xuXG4gICAgICBpZiAoIWhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCkge1xuICAgICAgICBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICBzZXRIYXNJbnRlcmFjdGVkKHRydWUpO1xuICAgICAgfVxuXG4gICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihzZWMpKTtcblxuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICAgIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSBzZWM7XG4gICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnNlZWtUbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQuc2Vla1RvKHNlYywgdHJ1ZSk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbc2VjLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNhbkNvbnRyb2wpIHtcbiAgICAgICAgZ3VpTGVuaCgnc2VlaycsIHNlYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIHNldElzTGl2ZVdpdGhIb3N0KGZhbHNlKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzci1zZWVrJywgb25TZWVrUmVxKTtcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3NyLXNlZWsnLCBvblNlZWtSZXEpO1xuICB9LCBbcGhvbmc/LmlkLCBjYW5Db250cm9sLCBwcm92aWRlciwgd2F0Y2hTdGF0ZT8ucmV2aXNpb25dKTtcblxuICBjb25zdCBoYW5kbGVTdGFydFZpZXdpbmcgPSAoKSA9PiB7XG4gICAgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBzZXRIYXNJbnRlcmFjdGVkKHRydWUpO1xuICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHNldElzTGl2ZVdpdGhIb3N0KHRydWUpO1xuICAgIHNldFZpZXdlcklzUGF1c2VkKGZhbHNlKTtcblxuICAgIGNvbnN0IG5vd01zID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCB1cGRhdGVUaW1lTXMgPSB3YXRjaFN0YXRlLnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyh3YXRjaFN0YXRlLnVwZGF0ZWRBdCkucmVwbGFjZSgnICcsICdUJykgKyAoU3RyaW5nKHdhdGNoU3RhdGUudXBkYXRlZEF0KS5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS5nZXRUaW1lKCkgOiBub3dNcztcbiAgICBjb25zdCBlbGFwc2VkU2VjID0gTWF0aC5tYXgoMCwgKG5vd01zIC0gdXBkYXRlVGltZU1zKSAvIDEwMDApO1xuICAgIGxldCB0YXJnZXRQb3MgPSBOdW1iZXIod2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgaWYgKHdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgdGFyZ2V0UG9zID0gTnVtYmVyKHdhdGNoU3RhdGUuYmFzZVBvc2l0aW9uU2Vjb25kcyAhPSBudWxsID8gd2F0Y2hTdGF0ZS5iYXNlUG9zaXRpb25TZWNvbmRzIDogd2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMpICsgKGVsYXBzZWRTZWMgKiAod2F0Y2hTdGF0ZS5wbGF5YmFja1JhdGUgfHwgMS4wKSk7XG4gICAgfVxuICAgIHRhcmdldFBvcyA9IE1hdGgubWF4KDAsIE51bWJlcih0YXJnZXRQb3MudG9GaXhlZCgyKSkpO1xuXG4gICAgaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcih0YXJnZXRQb3MpKTtcblxuICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgY29uc3QgdiA9IHZpZGVvUmVmLmN1cnJlbnQ7XG4gICAgICBpZiAodGFyZ2V0UG9zID4gMCkgdi5jdXJyZW50VGltZSA9IHRhcmdldFBvcztcbiAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgdi5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdi5wYXVzZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICBpZiAodGFyZ2V0UG9zID4gMCkge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8uc2Vla1RvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8odGFyZ2V0UG9zLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3RhcmdldFBvcywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICB9XG4gICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wbGF5VmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwbGF5VmlkZW8nLCBhcmdzOiBbXSB9KSwgJyonKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wYXVzZVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wYXVzZVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BhdXNlVmlkZW8nLCBhcmdzOiBbXSB9KSwgJyonKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gTmdcdTAxQjBcdTFFRERpIHRoYW0gZ2lhIGJcdTFFQTVtIG5cdTAwRkF0IFwiVHJcdTFFRjFjIHRpXHUxRUJGcFwiIFx1MDExMVx1MUVDMyBuaFx1MUVBM3kgdlx1MUVDMSB0aW1lbGluZSBjXHUxRUU3YSBjaFx1MUVFNyBwaFx1MDBGMm5nXG4gIGNvbnN0IGhhbmRsZUdvTGl2ZSA9ICgpID0+IHtcbiAgICBpZiAoIWhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCkge1xuICAgICAgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgIHNldEhhc0ludGVyYWN0ZWQodHJ1ZSk7XG4gICAgfVxuICAgIGlzUHJvZ3JhbW1hdGljQWN0aW9uUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIGxhc3RHb0xpdmVDbGlja1RpbWVSZWYuY3VycmVudCA9IERhdGUubm93KCk7XG5cbiAgICBsZXQgdGFyZ2V0UG9zID0gZ2V0SG9zdEN1cnJlbnRQb3MoKTtcbiAgICBjb25zdCBtYXhEdXIgPSBkdXJhdGlvblJlZi5jdXJyZW50IHx8IGR1cmF0aW9uO1xuICAgIGNvbnN0IGlzVmlkZW9FbmRlZCA9IG1heER1ciA+IDAgJiYgKHRhcmdldFBvcyA+PSBtYXhEdXIgLSAxLjUgfHwgKCF3YXRjaFN0YXRlLnBsYXlpbmcgJiYgdGFyZ2V0UG9zID49IG1heER1ciAtIDMuMCkpO1xuICAgIGlmIChpc1ZpZGVvRW5kZWQpIHtcbiAgICAgIHRhcmdldFBvcyA9IG1heER1cjtcbiAgICB9IGVsc2UgaWYgKG1heER1ciA+IDAgJiYgdGFyZ2V0UG9zID4gbWF4RHVyKSB7XG4gICAgICB0YXJnZXRQb3MgPSBtYXhEdXI7XG4gICAgfVxuXG4gICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IodGFyZ2V0UG9zKSk7XG4gICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IHRydWU7XG4gICAgc2V0SXNMaXZlV2l0aEhvc3QodHJ1ZSk7XG4gICAgc2V0Vmlld2VySXNQYXVzZWQoIXdhdGNoU3RhdGUucGxheWluZyB8fCBpc1ZpZGVvRW5kZWQpO1xuICAgIGxhc3RBcHBsaWVkUmV2aXNpb25SZWYuY3VycmVudCA9IHdhdGNoU3RhdGUucmV2aXNpb247XG5cbiAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSB0YXJnZXRQb3M7XG4gICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nICYmICFpc1ZpZGVvRW5kZWQpIHtcbiAgICAgICAgdmlkZW9SZWYuY3VycmVudC5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlkZW9SZWYuY3VycmVudC5wYXVzZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnNlZWtUbykge1xuICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnNlZWtUbyh0YXJnZXRQb3MsIHRydWUpOyB9IGNhdGNoIHt9XG4gICAgICB9XG4gICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3RhcmdldFBvcywgdHJ1ZV0gfSksICcqJyk7XG5cbiAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcgJiYgIWlzVmlkZW9FbmRlZCkge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8ucGxheVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGxheVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8ucGF1c2VWaWRlbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwYXVzZVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpc1Byb2dyYW1tYXRpY0FjdGlvblJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgfSwgMzUwMCk7XG4gIH07XG5cbiAgLy8gQ2hcdTFFRTcgcGhcdTAwRjJuZyBiXHUxRUE1bSBQaFx1MDBFMXQgLyBUXHUxRUExbSBkXHUxRUVCbmcgLyBQaFx1MDBFMXQgbFx1MUVBMWlcbiAgY29uc3QgaGFuZGxlSG9zdFRvZ2dsZVBsYXkgPSAoKSA9PiB7XG4gICAgaWYgKHdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgZ3VpTGVuaCgncGF1c2UnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICBpZiAobWF4RHVyID4gMCAmJiBsb2NhbFRpbWUgPj0gbWF4RHVyIC0gMS41KSB7XG4gICAgICAgIC8vIFZpZGVvIFx1MDExMVx1MDBFMyBrXHUxRUJGdCB0aFx1MDBGQWMgLT4gQlx1MUVBNW0gcGhcdTAwRTF0IGxcdTFFQTFpIHRcdTFFRUIgXHUwMTExXHUxRUE3dVxuICAgICAgICBzZXRMb2NhbFRpbWUoMCk7XG4gICAgICAgIGd1aUxlbmgoJ3NlZWsnLCAwKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiBndWlMZW5oKCdwbGF5JywgMCksIDEwMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBndWlMZW5oKCdwbGF5Jyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIE5nXHUwMUIwXHUxRUREaSB0aGFtIGdpYSB0XHUxRUYxIGJcdTFFQTVtIFRcdTFFQTFtIGRcdTFFRUJuZyAvIFRpXHUxRUJGcCB0XHUxRUU1YyBjXHUxRUU1YyBiXHUxRUQ5XG4gIGNvbnN0IGhhbmRsZVZpZXdlclRvZ2dsZVBsYXkgPSAoKSA9PiB7XG4gICAgaWYgKCFoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpIHtcbiAgICAgIGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICBzZXRIYXNJbnRlcmFjdGVkKHRydWUpO1xuICAgIH1cbiAgICBpZiAodmlld2VySXNQYXVzZWQpIHtcbiAgICAgIC8vIFRpXHUxRUJGcCB0XHUxRUU1YyBwaFx1MDBFMXRcbiAgICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgICBsZXQgc3RhcnRTZWMgPSBsb2NhbFRpbWU7XG4gICAgICBpZiAobWF4RHVyID4gMCAmJiBsb2NhbFRpbWUgPj0gbWF4RHVyIC0gMS41KSB7XG4gICAgICAgIHN0YXJ0U2VjID0gMDtcbiAgICAgICAgc2V0TG9jYWxUaW1lKDApO1xuICAgICAgfVxuICAgICAgc2V0Vmlld2VySXNQYXVzZWQoZmFsc2UpO1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICAgIGlmIChzdGFydFNlYyA9PT0gMCkgdmlkZW9SZWYuY3VycmVudC5jdXJyZW50VGltZSA9IDA7XG4gICAgICAgIHZpZGVvUmVmLmN1cnJlbnQucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgICBpZiAoc3RhcnRTZWMgPT09IDApIHtcbiAgICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8uc2Vla1RvKSB7IHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQuc2Vla1RvKDAsIHRydWUpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFswLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8ucGxheVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BsYXlWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUXHUxRUExbSBkXHUxRUVCbmdcbiAgICAgIHNldFZpZXdlcklzUGF1c2VkKHRydWUpO1xuICAgICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgc2V0SXNMaXZlV2l0aEhvc3QoZmFsc2UpO1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICAgIHZpZGVvUmVmLmN1cnJlbnQucGF1c2UoKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8ucGF1c2VWaWRlbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGF1c2VWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBOZ1x1MDFCMFx1MUVERGkgdGhhbSBnaWEgdFx1MUVGMSB0dWEgdHJcdTAwRUFuIHNsaWRlciBjXHUxRUU1YyBiXHUxRUQ5XG4gIGNvbnN0IGhhbmRsZVZpZXdlclNlZWsgPSAoc2VjKSA9PiB7XG4gICAgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICBzZXRMb2NhbFRpbWUoc2VjKTtcbiAgICBpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgc2V0SXNMaXZlV2l0aEhvc3QoZmFsc2UpO1xuICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgdmlkZW9SZWYuY3VycmVudC5jdXJyZW50VGltZSA9IHNlYztcbiAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5zZWVrVG8pIHtcbiAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8oc2VjLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgfVxuICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFtzZWMsIHRydWVdIH0pLCAnKicpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPXtgZmxleCBmbGV4LWNvbCBtaW4tdy0wIHctZnVsbCAke2lzUm9vbVdpZGUgPyAnaC1mdWxsIGZsZXgtMSBtaW4taC0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlcicgOiAnZ2FwLTQnfWB9PlxuICAgICAgey8qIEtodW5nIHBoXHUwMEUxdCB2aWRlbyBjaFx1MDBFRG5oIFx1MjAxNCBraHVuZyBuZW9uIG1cdTFFREQgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBoXHUxRUM3IGdhbWUgYXJlbmEgKi99XG4gICAgICA8ZGl2XG4gICAgICAgIHN0eWxlPXtcbiAgICAgICAgICBpc1Jvb21XaWRlICYmIGxheW91dFJhdGlvID09PSAnMTA6MCdcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgIG1heEhlaWdodDogJ2NhbGMoMTAwdmggLSA3NnB4KScsXG4gICAgICAgICAgICAgICAgbWF4V2lkdGg6ICdjYWxjKCgxMDB2aCAtIDc2cHgpICogMTYgLyA5KScsXG4gICAgICAgICAgICAgICAgYXNwZWN0UmF0aW86ICcxNiAvIDknLFxuICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAnYXV0bycsXG4gICAgICAgICAgICAgICAgbWFyZ2luOiAnMCBhdXRvJyxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiBpc1Jvb21XaWRlXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICBtYXhIZWlnaHQ6ICdjYWxjKDEwMHZoIC0gODRweCknLFxuICAgICAgICAgICAgICAgIGFzcGVjdFJhdGlvOiAnMTYgLyA5JyxcbiAgICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgICAgIGhlaWdodDogJ2F1dG8nLFxuICAgICAgICAgICAgICAgIG1hcmdpbjogJzAgYXV0bycsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgIH1cbiAgICAgICAgY2xhc3NOYW1lPVwicmVsYXRpdmUgdy1mdWxsIGFzcGVjdC12aWRlbyBiZy1ncmFkaWVudC10by1iIGZyb20tWyMwNTA3MGJdIHRvLWJsYWNrIHJvdW5kZWQtMnhsIG92ZXJmbG93LWhpZGRlbiBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8xNSByaW5nLTEgcmluZy13aGl0ZS81IHNoYWRvdy1bMF8wXzYwcHhfcmdiYSgwLDI0MiwyNTQsMC4wNyksMF8zMHB4XzYwcHhfLTE1cHhfcmdiYSgwLDAsMCwwLjcpXVwiXG4gICAgICA+XG4gICAgICAgIHsvKiBPdmVybGF5IEF1dG9wbGF5IC8gR2VzdHVyZSBjaG8gbmdcdTAxQjBcdTFFRERpIHhlbSAqL31cbiAgICAgICAgeyFoYXNJbnRlcmFjdGVkICYmICFjYW5Db250cm9sICYmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnIHx8IHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JykgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgaW5zZXQtMCB6LTIwIGJnLWJsYWNrLzc1IGJhY2tkcm9wLWJsdXItc20gZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00IHRleHQtY2VudGVyIGFuaW1hdGUtZmFkZUluXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTQgaC0xNCByb3VuZGVkLWZ1bGwgYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtMnhsIG1iLTMgc2hhZG93LVswXzBfMjVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYW5pbWF0ZS1wdWxzZVwiPlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGQUNcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtd2hpdGUgbWItMVwiPlhlbSBDaHVuZyBDXHUwMEY5bmcgUGhcdTAwRjJuZzwvcD5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS0zMDAgbWF4LXcteHMgbWItNFwiPlxuICAgICAgICAgICAgICBCXHUxRUE1bSBuXHUwMEZBdCBiXHUwMEVBbiBkXHUwMUIwXHUxRURCaSBcdTAxMTFcdTFFQzMgY1x1MUVBNXAgcXV5XHUxRUMxbiBcdTAwRTJtIHRoYW5oIHZcdTAwRTAgY1x1MDBGOW5nIHRoZW8gZFx1MDBGNWkgdGltZWxpbmUgdlx1MUVEQmkgY2hcdTFFRTcgcGhcdTAwRjJuZy5cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJidG4tdmlld2VyLXN0YXJ0LXdhdGNoXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVN0YXJ0Vmlld2luZ31cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNSBweS0yLjUgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjM0I4MkY2XSB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC14cyBzaGFkb3ctbGcgaG92ZXI6b3BhY2l0eS05MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNUI2PC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5CXHUxRUFGdCBcdTAxMTFcdTFFQTd1IHhlbSBjXHUwMEY5bmcgcGhcdTAwRjJuZzwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBWaWRlbyBlbGVtZW50cyB0aGVvIHByb3ZpZGVyICovfVxuICAgICAgICB7eXRJZCA/IChcbiAgICAgICAgICA8ZGl2IGtleT17YHl0LXdyYXAtJHtwaG9uZy5pZH1gfSBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIHJlbGF0aXZlIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLWJsYWNrXCI+XG4gICAgICAgICAgICA8aWZyYW1lXG4gICAgICAgICAgICAgIGlkPXt5dENvbnRhaW5lcklkfVxuICAgICAgICAgICAgICBrZXk9e2B5dC1mcmFtZS0ke3Bob25nLmlkfWB9XG4gICAgICAgICAgICAgIHNyYz17YGh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkLyR7eXRJZH0/ZW5hYmxlanNhcGk9MSZvcmlnaW49JHtlbmNvZGVVUklDb21wb25lbnQodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cubG9jYXRpb24ub3JpZ2luIDogJycpfSZ3aWRnZXRfcmVmZXJyZXI9JHtlbmNvZGVVUklDb21wb25lbnQodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cubG9jYXRpb24uaHJlZiA6ICcnKX0mcmVsPTAmbW9kZXN0YnJhbmRpbmc9MSZwbGF5c2lubGluZT0xYH1cbiAgICAgICAgICAgICAgdGl0bGU9e3Bob25nLnRlbiB8fCAnWW91VHViZSBWaWRlbyd9XG4gICAgICAgICAgICAgIGFsbG93PVwiYWNjZWxlcm9tZXRlcjsgYXV0b3BsYXk7IGNsaXBib2FyZC13cml0ZTsgZW5jcnlwdGVkLW1lZGlhOyBneXJvc2NvcGU7IHBpY3R1cmUtaW4tcGljdHVyZTsgd2ViLXNoYXJlXCJcbiAgICAgICAgICAgICAgYWxsb3dGdWxsU2NyZWVuXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgYm9yZGVyLTBcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IGRydklkID8gKFxuICAgICAgICAgIDxpZnJhbWVcbiAgICAgICAgICAgIHNyYz17YGh0dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS9maWxlL2QvJHtkcnZJZH0vcHJldmlld2B9XG4gICAgICAgICAgICB0aXRsZT17cGhvbmcudGVufVxuICAgICAgICAgICAgYWxsb3c9XCJhdXRvcGxheTsgZnVsbHNjcmVlblwiXG4gICAgICAgICAgICBhbGxvd0Z1bGxTY3JlZW5cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGxcIlxuICAgICAgICAgIC8+XG4gICAgICAgICkgOiB0cnVjVGllcFVybCA/IChcbiAgICAgICAgICA8dmlkZW9cbiAgICAgICAgICAgIHJlZj17dmlkZW9SZWZ9XG4gICAgICAgICAgICBzcmM9e3RydWNUaWVwVXJsfVxuICAgICAgICAgICAgcGxheXNJbmxpbmVcbiAgICAgICAgICAgIGRhdGEtdGVzdGlkPVwic3R1ZHktdmlkZW8tcGxheWVyXCJcbiAgICAgICAgICAgIGNvbnRyb2xzPXt0cnVlfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY29udGFpblwiXG4gICAgICAgICAgICBvbkxvYWRlZE1ldGFkYXRhPXtlID0+IHtcbiAgICAgICAgICAgICAgaWYgKGUudGFyZ2V0LmR1cmF0aW9uID4gMCkgc2V0RHVyYXRpb24oZS50YXJnZXQuZHVyYXRpb24pO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uUGxheT17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiAhd2F0Y2hTdGF0ZS5wbGF5aW5nICYmICFkYW5nR3VpTGVuaCkge1xuICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3BsYXknLCB2aWRlb1JlZi5jdXJyZW50Py5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWNhbkNvbnRyb2wgJiYgIWlzUHJvZ3JhbW1hdGljQWN0aW9uUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZChmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvblBhdXNlPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmIHdhdGNoU3RhdGUucGxheWluZyAmJiAhZGFuZ0d1aUxlbmgpIHtcbiAgICAgICAgICAgICAgICBndWlMZW5oKCdwYXVzZScsIHZpZGVvUmVmLmN1cnJlbnQ/LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICghY2FuQ29udHJvbCAmJiAhaXNQcm9ncmFtbWF0aWNBY3Rpb25SZWYuY3VycmVudCAmJiB3YXRjaFN0YXRlUmVmLmN1cnJlbnQucGxheWluZykge1xuICAgICAgICAgICAgICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzZXRJc0xpdmVXaXRoSG9zdChmYWxzZSk7XG4gICAgICAgICAgICAgICAgc2V0Vmlld2VySXNQYXVzZWQodHJ1ZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvbkVuZGVkPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGhhbmRsZVZpZGVvRW5kZWQoKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvblNlZWtlZD17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoaXNQcm9ncmFtbWF0aWNBY3Rpb25SZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCkge1xuICAgICAgICAgICAgICAgIGlmIChkYW5nR3VpTGVuaCB8fCBpc1NlZWtpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1ciA9IHZpZGVvUmVmLmN1cnJlbnQ/LmN1cnJlbnRUaW1lO1xuICAgICAgICAgICAgICAgIGlmIChjdXIgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIC8vIENoXHUxRUQxbmcgdlx1MDBGMm5nIGxcdTFFQjdwOiBtXHUxRUNEaSBnXHUwMEUxbiBjdXJyZW50VGltZSBuXHUxRUQ5aSBiXHUxRUQ5IChvcHRpbWlzdGljIHNlZWssIGRyaWZ0LWNvcnJlY3Rpb25cbiAgICAgICAgICAgICAgICAvLyBjXHUxRUU3YSBhcER1bmdEb25nQm8pIFx1MDExMVx1MUVDMXUgYlx1MUVBRm4gJ3NlZWtlZCcuIENoXHUxRUM5IGdcdTFFRURpIGxcdTFFQzduaCBraGkgdlx1MUVDQiB0clx1MDBFRCBsXHUxRUM3Y2gga2hcdTFFQ0ZpXG4gICAgICAgICAgICAgICAgLy8gdlx1MUVDQiB0clx1MDBFRCBzZXJ2ZXIga1x1MUVGMyB2XHUxRUNEbmcgPjEuNXMgXHUyMDE0IHRcdTFFRTljIG5nXHUwMUIwXHUxRUREaSBkXHUwMEY5bmcgdGhcdTFFQUR0IHNcdTFFRjEgdHVhIHF1YSB0aGFuaCBjb250cm9scy5cbiAgICAgICAgICAgICAgICBjb25zdCBzdCA9IHdhdGNoU3RhdGU7XG4gICAgICAgICAgICAgICAgY29uc3QgdXBkTXMgPSBzdD8udXBkYXRlZEF0ID8gbmV3IERhdGUoU3RyaW5nKHN0LnVwZGF0ZWRBdCkucmVwbGFjZSgnICcsICdUJykgKyAoU3RyaW5nKHN0LnVwZGF0ZWRBdCkuaW5jbHVkZXMoJ1QnKSA/ICcnIDogJ1onKSkuZ2V0VGltZSgpIDogRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbGFwc2VkID0gTWF0aC5tYXgoMCwgKERhdGUubm93KCkgLSB1cGRNcykgLyAxMDAwKTtcbiAgICAgICAgICAgICAgICBjb25zdCBreVZvbmcgPSBzdD8ucGxheWluZ1xuICAgICAgICAgICAgICAgICAgPyBOdW1iZXIoc3QuYmFzZVBvc2l0aW9uU2Vjb25kcyB8fCAwKSArIGVsYXBzZWQgKiAoc3QucGxheWJhY2tSYXRlIHx8IDEpXG4gICAgICAgICAgICAgICAgICA6IE51bWJlcihzdD8ucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhjdXIgLSBreVZvbmcpID4gMS41KSBndWlMZW5oKCdzZWVrJywgY3VyKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXIgPSB2aWRlb1JlZi5jdXJyZW50Py5jdXJyZW50VGltZSB8fCAwO1xuICAgICAgICAgICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKGN1cikpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGhvc3RQb3MgPSBnZXRIb3N0Q3VycmVudFBvcygpO1xuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhjdXIgLSBob3N0UG9zKSA+IDMuMCkge1xuICAgICAgICAgICAgICAgICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgc2V0SXNMaXZlV2l0aEhvc3QoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAvPlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgaC1mdWxsIHRleHQteHMgdGV4dC1zbGF0ZS01MDAgcC02IHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBtYi0yXCI+XHUyNkEwXHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+TGluayB2aWRlbyBraFx1MDBGNG5nIGhcdTFFRDcgdHJcdTFFRTMgcGhcdTAwRTF0IHRyXHUxRUYxYyB0aVx1MUVCRnAgaG9cdTFFQjdjIGtoXHUwMEY0bmcgaFx1MUVFM3AgbFx1MUVDNy48L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIFRoXHUwMEY0bmcgYlx1MDBFMW8gcmlcdTAwRUFuZyBjaG8gR29vZ2xlIERyaXZlICovfVxuICAgICAge2RydklkICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zLjUgcHktMiBiZy1hbWJlci01MDAvMTAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMjAgcm91bmRlZC14bCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIHRleHQtYW1iZXItMzAwXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbVwiPlx1MjEzOVx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICA8c3Bhbj5Hb29nbGUgRHJpdmUgcGhcdTAwRTF0IFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgPHN0cm9uZz5YZW0gXHUwMTExXHUxRUQ5YyBsXHUxRUFEcDwvc3Ryb25nPiAoR29vZ2xlIERyaXZlIGtoXHUwMEY0bmcgaFx1MUVENyB0clx1MUVFMyBBUEkgXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiB0XHUxRUVCIHhhKS48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIFRoYW5oIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gSG9zdCAmIE5nXHUwMUIwXHUxRUREaSB4ZW0gXHUyMDE0IFx1MUVBOW4ga2hpIGZ1bGxzY3JlZW4gKi99XG4gICAgICB7IWlzUm9vbVdpZGUgJiYgKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1ncmFkaWVudC10by1iIGZyb20tWyMxNjFiMjZdIHRvLVsjMGYxNDFkXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8xMCByb3VuZGVkLTJ4bCBwLTMgc206cC0zLjUgZmxleCBmbGV4LWNvbCBnYXAtMyBzaGFkb3cteGxcIj5cblxuICAgICAgICB7LyogVGhhbmggY1x1MDBGNG5nIGNcdTFFRTUgcGhcdTAwRTF0IGNodW5nIChjaG8gSG9zdCAvIFRlYWNoZXIga2hpIGRcdTAwRjluZyBwcm92aWRlciBjXHUwMEYzIHRoXHUxRUMzIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24pICovfVxuICAgICAgICB7Y2FuQ29udHJvbCAmJiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnIHx8IHByb3ZpZGVyID09PSAnWU9VVFVCRScpICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgaXRlbXMtY2VudGVyIGdhcC0zIHB0LTIgYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiYnRuLWhvc3Qtd2F0Y2gtdG9nZ2xlXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZUhvc3RUb2dnbGVQbGF5fVxuICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBzbTp3LWF1dG8gcHgtNCBweS0yIHJvdW5kZWQteGwgZm9udC1ibGFjayB0ZXh0LXhzIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xLjUgc2hhZG93LW1kIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlciBkaXNhYmxlZDpvcGFjaXR5LTUwICR7XG4gICAgICAgICAgICAgICAgd2F0Y2hTdGF0ZS5wbGF5aW5nXG4gICAgICAgICAgICAgICAgICA/ICdiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvNDAgaG92ZXI6YmctYW1iZXItNTAwLzMwIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgyNDUsMTU4LDExLDAuMjUpXSdcbiAgICAgICAgICAgICAgICAgIDogJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMwMGM2ZmZdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gaG92ZXI6YnJpZ2h0bmVzcy0xMTAnXG4gICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgPHNwYW4+e3dhdGNoU3RhdGUucGxheWluZyA/ICdcdTIzRjgnIDogJ1x1MjVCNid9PC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICB7d2F0Y2hTdGF0ZS5wbGF5aW5nXG4gICAgICAgICAgICAgICAgICA/ICdUXHUxRUExbSBEXHUxRUVCbmcgQ1x1MUVBMyBQaFx1MDBGMm5nJ1xuICAgICAgICAgICAgICAgICAgOiAoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKG1heER1ciA+IDAgJiYgbG9jYWxUaW1lID49IG1heER1ciAtIDEuNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdQaFx1MDBFMXQgTFx1MUVBMWkgQ1x1MUVBMyBQaFx1MDBGMm5nJztcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdQaFx1MDBFMXQgQ2h1bmcgQ1x1MUVBMyBQaFx1MDBGMm5nJztcbiAgICAgICAgICAgICAgICAgICAgfSkoKX1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjUgdy1mdWxsXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGlkPVwiaG9zdC1kdXJhdGlvbi1sYWJlbFwiIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIHtkaW5oRGFuZ0dpYXlQaHV0KGxvY2FsVGltZSl9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgaWQ9XCJob3N0LXNlZWstc2xpZGVyXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwicmFuZ2VcIlxuICAgICAgICAgICAgICAgIG1pbj1cIjBcIlxuICAgICAgICAgICAgICAgIG1heD17ZHVyYXRpb24gPiAwID8gZHVyYXRpb24gOiAoZHVyYXRpb25SZWYuY3VycmVudCA+IDAgPyBkdXJhdGlvblJlZi5jdXJyZW50IDogTWF0aC5tYXgobG9jYWxUaW1lLCAzMDApKX1cbiAgICAgICAgICAgICAgICBzdGVwPVwiMVwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e2xvY2FsVGltZX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlRG93bj17KCkgPT4geyBpc1NlZWtpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgb25Ub3VjaFN0YXJ0PXsoKSA9PiB7IGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRMb2NhbFRpbWUoTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSl9XG4gICAgICAgICAgICAgICAgb25Nb3VzZVVwPXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBOdW1iZXIoZS50YXJnZXQudmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uVG91Y2hFbmQ9e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaCgnc2VlaycsIE51bWJlcihlLnRhcmdldC52YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGgtMS41IGJnLXdoaXRlLzEwIHJvdW5kZWQtbGcgYXBwZWFyYW5jZS1ub25lIGN1cnNvci1wb2ludGVyIGFjY2VudC1bIzAwRjJGRV1cIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICB7ZHVyYXRpb24gPiAwID8gZGluaERhbmdHaWF5UGh1dChkdXJhdGlvbikgOiAoZHVyYXRpb25SZWYuY3VycmVudCA+IDAgPyBkaW5oRGFuZ0dpYXlQaHV0KGR1cmF0aW9uUmVmLmN1cnJlbnQpIDogJy0tOi0tJyl9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUaGFuaCBjXHUwMEY0bmcgY1x1MUVFNSBjaG8gTmdcdTAxQjBcdTFFRERpIHRoYW0gZ2lhICh0XHUxRUExbSBkXHUxRUVCbmcgcmlcdTAwRUFuZywgdGltZWxpbmUgcmlcdTAwRUFuZyAmIG5cdTAwRkF0IHRyXHUxRUYxYyB0aVx1MUVCRnAgdGhlbyBjaFx1MUVFNyBwaFx1MDBGMm5nKSAqL31cbiAgICAgICAgeyFjYW5Db250cm9sICYmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgfHwgcHJvdmlkZXIgPT09ICdZT1VUVUJFJykgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBpdGVtcy1jZW50ZXIgZ2FwLTMgcHQtMiBib3JkZXItdCBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdy1mdWxsIHNtOnctYXV0b1wiPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tdmlld2VyLXdhdGNoLXRvZ2dsZVwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlVmlld2VyVG9nZ2xlUGxheX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgc206dy1hdXRvIHB4LTQgcHktMiByb3VuZGVkLXhsIGZvbnQtYmxhY2sgdGV4dC14cyB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMS41IHNoYWRvdy1tZCBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXIgJHtcbiAgICAgICAgICAgICAgICAgIHZpZXdlcklzUGF1c2VkXG4gICAgICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gaG92ZXI6YnJpZ2h0bmVzcy0xMTAnXG4gICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzEwIHRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xNSBob3ZlcjpiZy13aGl0ZS8xNSdcbiAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3ZpZXdlcklzUGF1c2VkID8gJ1x1MjVCNicgOiAnXHUyM0Y4J308L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgICB7dmlld2VySXNQYXVzZWRcbiAgICAgICAgICAgICAgICAgICAgPyAoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXhEdXIgPiAwICYmIGxvY2FsVGltZSA+PSBtYXhEdXIgLSAxLjUpIHJldHVybiAnUGhcdTAwRTF0IExcdTFFQTFpIFZpZGVvJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnVGlcdTFFQkZwIFRcdTFFRTVjIFhlbSc7XG4gICAgICAgICAgICAgICAgICAgICAgfSkoKVxuICAgICAgICAgICAgICAgICAgICA6ICdUXHUxRUExbSBEXHUxRUVCbmcgVmlkZW8nfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZpZXdlci1nby1saXZlLWJhclwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlR29MaXZlfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBzbTp3LWF1dG8gcHgtNCBweS0yIHJvdW5kZWQteGwgZm9udC1ibGFjayB0ZXh0LXhzIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xLjUgc2hhZG93LW1kIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlciAke1xuICAgICAgICAgICAgICAgICAgaXNMaXZlV2l0aEhvc3RcbiAgICAgICAgICAgICAgICAgICAgPyAnYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTQwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwJ1xuICAgICAgICAgICAgICAgICAgICA6ICdiZy1ncmFkaWVudC10by1yIGZyb20tcm9zZS02MDAgdG8tcmVkLTYwMCB0ZXh0LXdoaXRlIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgyNDQsNjMsOTQsMC41KV0gYW5pbWF0ZS1wdWxzZSBob3ZlcjpicmlnaHRuZXNzLTExMCdcbiAgICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgICAgICB0aXRsZT17aXNMaXZlV2l0aEhvc3QgPyAnXHUwMTEwYW5nIHhlbSB0clx1MUVGMWMgdGlcdTFFQkZwIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgdlx1MUVEQmkgY2hcdTFFRTcgcGhcdTAwRjJuZycgOiAnQlx1MUVBNW0gXHUwMTExXHUxRUMzIG5oXHUxRUEzeSB0XHUxRURCaSB2aWRlbyBcdTAxMTFhbmcgY2hcdTFFQTF5IGNcdTFFRTdhIGNoXHUxRUU3IHBoXHUwMEYybmcnfT5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTIgaC0yIHJvdW5kZWQtZnVsbCAke2lzTGl2ZVdpdGhIb3N0ID8gJ2JnLXJvc2UtNTAwIGFuaW1hdGUtcHVsc2UnIDogJ2JnLXdoaXRlJ31gfSAvPlxuICAgICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgICAge2lzTGl2ZVdpdGhIb3N0XG4gICAgICAgICAgICAgICAgICAgID8gJ1RyXHUxRUYxYyBUaVx1MUVCRnAnXG4gICAgICAgICAgICAgICAgICAgIDogKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghd2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnVHJcdTFFRjFjIFRpXHUxRUJGcCAoQ2hcdTFFRTcgcGhcdTAwRjJuZyB0XHUxRUExbSBkXHUxRUVCbmcpJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBoUG9zID0gZ2V0SG9zdEN1cnJlbnRQb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXhEdXIgPiAwICYmIGhQb3MgPj0gbWF4RHVyIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1RyXHUxRUYxYyBUaVx1MUVCRnAgKEhcdTFFQkZ0IHZpZGVvKSc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gTWF0aC5yb3VuZChoUG9zIC0gbG9jYWxUaW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkID4gMiA/IGBUclx1MUVGMWMgVGlcdTFFQkZwIChDaFx1MUVBRG0gJHtkID4gNjAgPyBkaW5oRGFuZ0dpYXlQaHV0KGQpIDogZCArICdzJ30pYCA6ICdWXHUwMEUwbyBUclx1MUVGMWMgVGlcdTFFQkZwJztcbiAgICAgICAgICAgICAgICAgICAgICB9KSgpfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSB3LWZ1bGxcIj5cbiAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJ2aWV3ZXItZHVyYXRpb24tbGFiZWxcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICB7ZGluaERhbmdHaWF5UGh1dChsb2NhbFRpbWUpfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIGlkPVwidmlld2VyLXNlZWstc2xpZGVyXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwicmFuZ2VcIlxuICAgICAgICAgICAgICAgIG1pbj1cIjBcIlxuICAgICAgICAgICAgICAgIG1heD17ZHVyYXRpb24gPiAwID8gZHVyYXRpb24gOiAoZHVyYXRpb25SZWYuY3VycmVudCA+IDAgPyBkdXJhdGlvblJlZi5jdXJyZW50IDogTWF0aC5tYXgobG9jYWxUaW1lLCAzMDApKX1cbiAgICAgICAgICAgICAgICBzdGVwPVwiMVwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e2xvY2FsVGltZX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlRG93bj17KCkgPT4geyBpc1NlZWtpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgb25Ub3VjaFN0YXJ0PXsoKSA9PiB7IGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRMb2NhbFRpbWUoTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSl9XG4gICAgICAgICAgICAgICAgb25Nb3VzZVVwPXtlID0+IGhhbmRsZVZpZXdlclNlZWsoTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSl9XG4gICAgICAgICAgICAgICAgb25Ub3VjaEVuZD17ZSA9PiBoYW5kbGVWaWV3ZXJTZWVrKE51bWJlcihlLnRhcmdldC52YWx1ZSkpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBoLTEuNSBiZy13aGl0ZS8xMCByb3VuZGVkLWxnIGFwcGVhcmFuY2Utbm9uZSBjdXJzb3ItcG9pbnRlciBhY2NlbnQtWyMwMEYyRkVdXCJcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1tb25vIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAge2R1cmF0aW9uID4gMCA/IGRpbmhEYW5nR2lheVBodXQoZHVyYXRpb24pIDogKGR1cmF0aW9uUmVmLmN1cnJlbnQgPiAwID8gZGluaERhbmdHaWF5UGh1dChkdXJhdGlvblJlZi5jdXJyZW50KSA6ICctLTotLScpfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7bG9pICYmIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1yb3NlLTQwMFwiPntsb2l9PC9wPn1cbiAgICAgICAge3Bob25nLm1vVGEgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgbGVhZGluZy1yZWxheGVkIHB0LTFcIj57cGhvbmcubW9UYX08L3A+fVxuXG4gICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBcdTI1MDBcdTI1MDBcdTI1MDAgVlx1MDBEOU5HIDE6IFRSVU5HIFRcdTAwQzJNIENcdTFFQTRVIEhcdTAwQ0NOSCBWSURFTyAmIEhcdTAwQzBORyBcdTAxMTBcdTFFRTJJIFlPVVRVQkUgVFJcdTFFRjBDIFRJXHUxRUJFUCBcdTI1MDBcdTI1MDBcdTI1MDAgKi99XG4gICAgICB7IWlzUm9vbVdpZGUgJiYgKFxuICAgICAgICA8ZGl2IGlkPVwidnVuZzEteW91dHViZS1zdHVkaW9cIiBzdHlsZT17eyBvdmVyZmxvd0FuY2hvcjogJ25vbmUnIH19IGNsYXNzTmFtZT1cImJnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzE2MWIyNl0gdG8tWyMwZjE0MWRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC0zLjUgc206cC00IGZsZXggZmxleC1jb2wgZ2FwLTMgc2hhZG93LXhsXCI+XG4gICAgICAgICAgey8qIEhlYWRlciB0cnVuZyB0XHUwMEUybSAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBwYi0yLjUgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ3LTggaC04IHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tYnIgZnJvbS1bIzAwRjJGRV0vMjAgdG8tdmlvbGV0LTUwMC8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXNtIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgwLDI0MiwyNTQsMC4yNSldXCI+XG4gICAgICAgICAgICAgICAgXHVEODNDXHVERkFDXG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC14cyBzbTp0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5DXHUxRUE1dSBoXHUwMEVDbmggVmlkZW8gJiBIXHUwMEUwbmcgXHUwMTExXHUxRUUzaSBZb3VUdWJlPC9zcGFuPlxuICAgICAgICAgICAgICAgICAge3F1ZXVlTGlzdC5maWx0ZXIocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQtZnVsbCBiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3F1ZXVlTGlzdC5maWx0ZXIocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpLmxlbmd0aH0gXHUwMTExYW5nIGNoXHUxRUREXG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMFwiPlRcdTAwRUNtIGtpXHUxRUJGbSB2aWRlbywgXHUwMTExXHUwMUIwYSB2XHUwMEUwbyBoXHUwMEUwbmcgY2hcdTFFREQgdlx1MDBFMCBjaFx1MUVBMXkgdmlkZW8ga2hcdTAwRTFjIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgY1x1MUVBMyBwaFx1MDBGMm5nPC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgey8qIFRhYiBzZWxlY3RvciAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBiZy1bIzBCMEUxNF0gcC0xIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tbWVkaWEtdGFiLXNlYXJjaFwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIGdpdU5ndXllblZpVHJpQ3VvbigoKSA9PiBzZXRNZWRpYVRhYignc2VhcmNoJykpO1xuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMS41IHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgICAgICAgIG1lZGlhVGFiID09PSAnc2VhcmNoJ1xuICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LW1kJ1xuICAgICAgICAgICAgICAgICAgICAgIDogJ3RleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMEQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5UXHUwMEVDbSBZb3VUdWJlPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tbWVkaWEtdGFiLXF1ZXVlXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgZ2l1Tmd1eWVuVmlUcmlDdW9uKCgpID0+IHNldE1lZGlhVGFiKCdxdWV1ZScpKTtcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEuNSByb3VuZGVkLWxnIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICAgICAgICBtZWRpYVRhYiA9PT0gJ3F1ZXVlJ1xuICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS12aW9sZXQtNTAwIHRvLWZ1Y2hzaWEtNTAwIHRleHQtd2hpdGUgc2hhZG93LW1kJ1xuICAgICAgICAgICAgICAgICAgICAgIDogJ3RleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQ0I8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5IXHUwMEUwbmcgXHUwMTExXHUxRUUzaSAoe3F1ZXVlTGlzdC5maWx0ZXIocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpLmxlbmd0aH0pPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogVG9nZ2xlIHRodSBnXHUxRUNEbiAqL31cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLXRvZ2dsZS1zdHVkaW9cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgZ2l1Tmd1eWVuVmlUcmlDdW9uKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0RGFNb1JvbmdTdHVkaW8ocHJldiA9PiAhcHJldik7XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIHRpdGxlPXtkYU1vUm9uZ1N0dWRpbyA/ICdUaHUgZ1x1MUVDRG4nIDogJ01cdTFFREYgclx1MUVEOW5nJ31cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTggaC04IHJvdW5kZWQteGwgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICB7ZGFNb1JvbmdTdHVkaW8gPyAnXHUyNUIyJyA6ICdcdTI1QkMnfVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgey8qIFRvYXN0IHRoXHUwMEY0bmcgYlx1MDBFMW8gLyBMXHUxRUQ3aSAqL31cbiAgICAgICAgICB7dGhvbmdCYW9WaWRlbyAmJiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMiByb3VuZGVkLXhsIGJnLWVtZXJhbGQtNTAwLzE1IGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMzAgdGV4dC1lbWVyYWxkLTMwMCB0ZXh0LXhzIGZvbnQtYm9sZCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTI3Mjg8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPnt0aG9uZ0Jhb1ZpZGVvfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG4gICAgICAgICAge2xvaVZpZGVvICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMyBweS0yIHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTUgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0ZXh0LXJvc2UtMzAwIHRleHQteHMgZm9udC1ib2xkIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGFuaW1hdGUtZmFkZUluXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MjZBMFx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+e2xvaVZpZGVvfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICBjbGFzc05hbWU9e2B0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0zMDAgZWFzZS1pbi1vdXQgb3ZlcmZsb3ctaGlkZGVuIGZsZXggZmxleC1jb2wgbWluLWgtMCAke1xuICAgICAgICAgICAgICBkYU1vUm9uZ1N0dWRpbyA/ICdtYXgtaC1bMzgwcHhdIG9wYWNpdHktMTAwJyA6ICdtYXgtaC0wIG9wYWNpdHktMCBwb2ludGVyLWV2ZW50cy1ub25lJ1xuICAgICAgICAgICAgfWB9XG4gICAgICAgICAgICBzdHlsZT17eyBvdmVyZmxvd0FuY2hvcjogJ25vbmUnIH19PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLVszNDBweF0gZmxleCBmbGV4LWNvbCBtaW4taC0wIG92ZXJmbG93LWhpZGRlbiBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICB7LyogVEFCIDE6IFRcdTAwQ0NNIEtJXHUxRUJFTSBZT1VUVUJFICYgXHUwMTEwXHUxRUQ0SSBWSURFTyAqL31cbiAgICAgICAgICAgICAge21lZGlhVGFiID09PSAnc2VhcmNoJyAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLWZ1bGwgZmxleCBmbGV4LWNvbCBnYXAtMi41IG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgIHsvKiBcdTAwRDQgdFx1MDBFQ20ga2lcdTFFQkZtIC8gZFx1MDBFMW4gbGluayBcdTAxMTFhIG5cdTAxMDNuZyAqL31cbiAgICAgICAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXsoZSkgPT4gdGltS2llbVlvdVR1YmUoZSl9IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTIgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgZmxleC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBsZWZ0LTMgdG9wLTEvMiAtdHJhbnNsYXRlLXktMS8yIHRleHQtc2xhdGUtNDAwIHRleHQteHNcIj5cdUQ4M0RcdUREMEQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC12dW5nMS15b3V0dWJlLXNlYXJjaFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3l0UXVlcnl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFl0UXVlcnkoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIk5oXHUxRUFEcCB0XHUxRUVCIGtoXHUwMEYzYSB0XHUwMEVDbSBraVx1MUVCRm0gWW91VHViZSAodmQ6IGxvZmkgaFx1MUVDRGMgYlx1MDBFMGkuLi4pIGhvXHUxRUI3YyBkXHUwMEUxbiBsaW5rIHZpZGVvLi4uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNjAgcm91bmRlZC14bCBwbC04IHByLTMgcHktMiB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSB0cmFuc2l0aW9uLWFsbFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtdGltLWtpZW1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF5dFF1ZXJ5LnRyaW0oKSB8fCBzZWFyY2hpbmdZdH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMuNSBweS0yIHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQteHMgaG92ZXI6YnJpZ2h0bmVzcy0xMTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIHNoYWRvdy1tZCBkaXNhYmxlZDpvcGFjaXR5LTQwIHdoaXRlc3BhY2Utbm93cmFwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzZWFyY2hpbmdZdCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhbmltYXRlLXNwaW5cIj5cdTIzRjM8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHUwMTEwYW5nIHRcdTAwRUNtLi4uPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDBEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlRcdTAwRUNtIGtpXHUxRUJGbTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICB7LyogQWN0aW9uIGJ1dHRvbnMgcGhcdTFFRTUga2hpIFx1MDBGNCBpbnB1dCBsXHUwMEUwIDEgbGluayB2aWRlbyB0clx1MUVGMWMgdGlcdTFFQkZwICovfVxuICAgICAgICAgICAgICAgICAgICB7Qm9vbGVhbih5dFF1ZXJ5LnRyaW0oKS5zdGFydHNXaXRoKCdodHRwOi8vJykgfHwgeXRRdWVyeS50cmltKCkuc3RhcnRzV2l0aCgnaHR0cHM6Ly8nKSB8fCB5dFF1ZXJ5LmluY2x1ZGVzKCd5b3V0dScpKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBwLTIgcm91bmRlZC14bCBiZy1bIzBCMEUxNF0vODAgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMjAgZmxleC13cmFwIGFuaW1hdGUtZmFkZUluXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMTc8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlBoXHUwMEUxdCBoaVx1MUVDN24gbGlcdTAwRUFuIGtcdTFFQkZ0IHZpZGVvOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLXBoYXQtbmdheS1saW5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZG9pVmlkZW8oeXRRdWVyeS50cmltKCksICdWaWRlbyB0XHUxRUVCIGxpXHUwMEVBbiBrXHUxRUJGdCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0RvaVZpZGVvfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXSB0ZXh0LWJsYWNrIHRleHQteHMgZm9udC1ibGFjayBob3ZlcjpiZy1bIzAwZTFlY10gYWN0aXZlOnNjYWxlLTk1IHNoYWRvdy1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYgUGhcdTAwRTF0IG5nYXkgY1x1MUVBMyBwaFx1MDBGMm5nXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLWVucXVldWUtbGlua1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ2VucXVldWUnLCB7IHZpZGVvVXJsOiB5dFF1ZXJ5LnRyaW0oKSwgdGl0bGU6ICdWaWRlbyB0XHUxRUVCIGxpXHUwMEVBbiBrXHUxRUJGdCcgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctZW1lcmFsZC01MDAvMjAgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLWVtZXJhbGQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICsgVGhcdTAwRUFtIHZcdTAwRTBvIGN1XHUxRUQxaSBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS1hZGQtbmV4dC1saW5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnYWRkX25leHQnLCB7IHZpZGVvVXJsOiB5dFF1ZXJ5LnRyaW0oKSwgdGl0bGU6ICdWaWRlbyB0XHUxRUVCIGxpXHUwMEVBbiBrXHUxRUJGdCcgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLXZpb2xldC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKyBQaFx1MDBFMXQga1x1MUVCRiB0aVx1MUVCRnBcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9mb3JtPlxuXG4gICAgICAgICAgICAgICAgICB7LyogVHJcdTFFQTFuZyB0aFx1MDBFMWkgbFx1MUVEN2kgdFx1MDBFQ20ga2lcdTFFQkZtICovfVxuICAgICAgICAgICAgICAgICAge3NlYXJjaExvaSAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC0yLjUgcm91bmRlZC14bCBiZy1hbWJlci01MDAvMTAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgdGV4dC14cyBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTI2QTBcdUZFMEYge3NlYXJjaExvaX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2VhcmNoTG9pKCcnKX0gY2xhc3NOYW1lPVwidGV4dC1hbWJlci00MDAgZm9udC1ib2xkIGhvdmVyOnVuZGVybGluZVwiPlx1MDExMFx1MDBGM25nPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgey8qIEtcdTFFQkZ0IHF1XHUxRUEzIHRcdTAwRUNtIGtpXHUxRUJGbSBZb3VUdWJlICovfVxuICAgICAgICAgICAgICAgICAge3l0UmVzdWx0cy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0xLjUgbWluLWgtMCBvdmVyZmxvdy1oaWRkZW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDRkE8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPktcdTFFQkZ0IHF1XHUxRUEzIFlvdVR1YmUgKHt5dFJlc3VsdHMubGVuZ3RofSB2aWRlbyk6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtZG9uZy1rZXQtcXVhXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRZdFJlc3VsdHMoW10pOyBzZXRTZWFyY2hMb2koJycpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yIHB5LTAuNSByb3VuZGVkLW1kIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LVsxMHB4XSBmb250LWJvbGQgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1IFx1MDExMFx1MDBGM25nIGtcdTFFQkZ0IHF1XHUxRUEzXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIHNwYWNlLXktMiBvdmVyZmxvdy15LWF1dG8gcHItMSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7eXRSZXN1bHRzLm1hcCgoaXRlbSwgaWR4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZVcmwgPSBgaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj0ke2l0ZW0udmlkZW9JZH1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17aXRlbS52aWRlb0lkIHx8IGlkeH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImdyb3VwIGJnLVsjMEIwRTE0XSBob3ZlcjpiZy1bIzEyMTcyMV0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3Zlcjpib3JkZXItWyMwMEYyRkVdLzMwIHJvdW5kZWQteGwgcC0yLjUgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBUaHVtYm5haWwgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIHctMjQgc206dy0yOCBhc3BlY3QtdmlkZW8gcm91bmRlZC1sZyBvdmVyZmxvdy1oaWRkZW4gYmctYmxhY2sgc2hyaW5rLTAgYm9yZGVyIGJvcmRlci13aGl0ZS81XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmM9e2l0ZW0udGh1bWJuYWlsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsdD17aXRlbS50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBncm91cC1ob3ZlcjpzY2FsZS0xMDUgdHJhbnNpdGlvbi10cmFuc2Zvcm1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRpbmc9XCJsYXp5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYWJzb2x1dGUgYm90dG9tLTEgcmlnaHQtMSBiZy1ibGFjay84MCBweC0xIHB5LTAuMiByb3VuZGVkIHRleHQtWzlweF0gZm9udC1tb25vIHRleHQtd2hpdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBZb3VUdWJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogVGhcdTAwRjRuZyB0aW4gdmlkZW8gKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoNSBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTIwMCBsaW5lLWNsYW1wLTIgZ3JvdXAtaG92ZXI6dGV4dC1bIzAwRjJGRV0gdHJhbnNpdGlvbi1jb2xvcnNcIiB0aXRsZT17aXRlbS50aXRsZX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2l0ZW0udGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvaDU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbXQtMSB0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPntpdGVtLmNoYW5uZWxUaXRsZSB8fCAnS1x1MDBFQW5oIFlvdVR1YmUnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXRlbS5wdWJsaXNoZWRBdCAmJiA8c3Bhbj5cdTIwMjIge2l0ZW0ucHVibGlzaGVkQXR9PC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIEJcdTFFRDkgMyBuXHUwMEZBdCB0aGFvIHRcdTAwRTFjICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGl0ZW1zLWNlbnRlciBnYXAtMS41IHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNoXHUxRUExeSB2aWRlbyBuXHUwMEUweSBuZ2F5IGxcdTFFQURwIHRcdTFFRTljIGNobyBjXHUxRUEzIHBoXHUwMEYybmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGRvaVZpZGVvKHZVcmwsIGl0ZW0udGl0bGUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nRG9pVmlkZW99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMwMGM2ZmZdIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LVsxMXB4XSBzaGFkb3ctc20gaG92ZXI6YnJpZ2h0bmVzcy0xMTAgYWN0aXZlOnNjYWxlLTk1IGRpc2FibGVkOm9wYWNpdHktNDAgd2hpdGVzcGFjZS1ub3dyYXAgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYgUGhcdTAwRTF0IG5nYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlRoXHUwMEVBbSB2XHUwMEUwbyBjdVx1MUVEMWkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ2VucXVldWUnLCB7IHZpZGVvVXJsOiB2VXJsLCB0aXRsZTogaXRlbS50aXRsZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtMzAwIGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMzAgaG92ZXI6YmctZW1lcmFsZC01MDAvMjUgdGV4dC1bMTFweF0gZm9udC1ib2xkIGFjdGl2ZTpzY2FsZS05NSBkaXNhYmxlZDpvcGFjaXR5LTQwIHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBIXHUwMEUwbmcgY2hcdTFFRERcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlRoXHUwMEVBbSBcdTAxMTFcdTFFQzMgcGhcdTAwRTF0IGtcdTFFQkYgdGlcdTFFQkZwIHNhdSB2aWRlbyBoaVx1MUVDN24gdFx1MUVBMWlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ2FkZF9uZXh0JywgeyB2aWRlb1VybDogdlVybCwgdGl0bGU6IGl0ZW0udGl0bGUgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMS41IHJvdW5kZWQtbGcgYmctdmlvbGV0LTUwMC8xNSB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIGhvdmVyOmJnLXZpb2xldC01MDAvMjUgdGV4dC1bMTBweF0gZm9udC1ib2xkIGFjdGl2ZTpzY2FsZS05NSBkaXNhYmxlZDpvcGFjaXR5LTQwIHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBLXHUxRUJGIHRpXHUxRUJGcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgLyogR1x1MUVFM2kgXHUwMEZEIHRcdTFFRUIga2hcdTAwRjNhIHRcdTAwRUNtIGtpXHUxRUJGbSBuaGFuaCArIGtodW5nIHRoXHUwMEY0bmcgdGluIGdpXHUxRUVGIGNoaVx1MUVDMXUgY2FvIGNcdTFFRDEgXHUwMTExXHUxRUNCbmggKi9cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtMS41IHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCBmb250LWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIEdcdTFFRTNpIFx1MDBGRCBjaFx1MUVFNyBcdTAxMTFcdTFFQzEgaFx1MUVDRGMgdFx1MUVBRHAgJiB0aFx1MDFCMCBnaVx1MDBFM246XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1RDgzQ1x1REZBNyBMb2ZpIGhcdTFFQ0RjIHRcdTFFQURwJywgcTogJ2xvZmkgaGlwIGhvcCByYWRpbyBiZWF0cyB0byByZWxheCBzdHVkeSB0bycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHVEODNDXHVERjI3XHVGRTBGIFRpXHUxRUJGbmcgbVx1MDFCMGEgJiBQaWFubycsIHE6ICdyYWluIHNvdW5kcyByZWxheGluZyBwaWFubyBzdHVkeSBmb2N1cycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHUyNjE1IE5oXHUxRUExYyBxdVx1MDBFMW4gY1x1MDBFMCBwaFx1MDBFQScsIHE6ICdjb2ZmZWUgc2hvcCBqYXp6IHBpYW5vIGNoaWxsIHN0dWR5JyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdcdUQ4M0RcdURDREEgVFx1MUVBRHAgdHJ1bmcgXHUwMEY0biB0aGknLCBxOiAnc3R1ZHkgbXVzaWMgYWxwaGEgd2F2ZXMgY29uY2VudHJhdGlvbicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHVEODNEXHVERDJDIFRoXHUwMEVEIG5naGlcdTFFQzdtIEhcdTAwRjNhIGhcdTFFQ0RjJywgcTogJ3RoXHUwMEVEIG5naGlcdTFFQzdtIGhcdTAwRjNhIGhcdTFFQ0RjIHRoXHUwMEZBIHZcdTFFQ0InIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIF0ubWFwKChjaGlwKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtjaGlwLnF9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB0aW1LaWVtWW91VHViZShlLCBjaGlwLnEpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC1bMTFweF0gdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtjaGlwLmxhYmVsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC0zIGJnLVsjMEIwRTE0XS82MCBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC14bCB0ZXh0LWNlbnRlciB0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIGdhcC0xIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteGxcIj5cdUQ4M0RcdURDRkE8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDBcIj5UXHUwMEVDbSBraVx1MUVCRm0gJiBQaFx1MDBFMXQgdmlkZW8gWW91VHViZTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwIG1heC13LXNtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIE5oXHUxRUFEcCB0XHUxRUVCIGtoXHUwMEYzYSBiXHUwMEUwaSBoXHUxRUNEYyBob1x1MUVCN2MgZFx1MDBFMW4gbGlcdTAwRUFuIGtcdTFFQkZ0IFlvdVR1YmUgXHUxRURGIHRyXHUwMEVBbiBcdTAxMTFcdTFFQzMgdFx1MDBFQ20ga2lcdTFFQkZtIHZcdTAwRTAgcGhcdTAwRTF0IFx1MDExMVx1MUVEM25nIGJcdTFFRDkgY2hvIHRcdTFFQTV0IGNcdTFFQTMgdGhcdTAwRTBuaCB2aVx1MDBFQW4gdHJvbmcgcGhcdTAwRjJuZy5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgIHsvKiBUQUIgMjogUVVcdTFFQTJOIExcdTAwREQgSFx1MDBDME5HIFx1MDExMFx1MUVFMkkgKFFVRVVFKSAqL31cbiAgICAgICAgICAgICAge21lZGlhVGFiID09PSAncXVldWUnICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtZnVsbCBmbGV4IGZsZXgtY29sIGdhcC0yLjUgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZmxleC13cmFwIGdhcC0yIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQ0I8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+SFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdmlkZW8gKHtxdWV1ZUxpc3QuZmlsdGVyKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnKS5sZW5ndGh9IGNoXHUxRUREKTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3Quc29tZShxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtcXVldWUtc2tpcFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3NraXAnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6YmctYW1iZXItNTAwLzI1IGRpc2FibGVkOm9wYWNpdHktNDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHUyM0VEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5CXHUxRUNGIHF1YSAvIEJcdTAwRTBpIHRpXHUxRUJGcDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0YWlRdWV1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiTFx1MDBFMG0gbVx1MUVEQmkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMiBweS0xIHJvdW5kZWQtbGcgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHRleHQteHMgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNEXHVERDA0XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBUaFx1MDBFQW0gbGluayBuaGFuaCB2XHUwMEUwbyBxdWV1ZSAqL31cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgPFF1ZXVlSW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICBvbkFkZD17KHUsIHQpID0+IGhhbmhEb25nUXVldWUoJ2VucXVldWUnLCB7IHZpZGVvVXJsOiB1LCB0aXRsZTogdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkFkZE5leHQ9eyh1LCB0KSA9PiBoYW5oRG9uZ1F1ZXVlKCdhZGRfbmV4dCcsIHsgdmlkZW9Vcmw6IHUsIHRpdGxlOiB0IH0pfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBEYW5oIHNcdTAwRTFjaCB2aWRlbyB0cm9uZyBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaSAqL31cbiAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3QubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTQgYmctWyMwQjBFMTRdLzYwIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLXhsIHRleHQtY2VudGVyIHRleHQteHMgdGV4dC1zbGF0ZS00MDAgZ2FwLTEuNSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC0yeGxcIj5cdUQ4M0RcdURDQ0I8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwXCI+SFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgaGlcdTFFQzduIFx1MDExMWFuZyB0clx1MUVEMW5nPC9wPlxuICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwIG1heC13LXNtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBDaHV5XHUxRUMzbiBzYW5nIHRhYiA8c3Ryb25nPlRcdTAwRUNtIFlvdVR1YmU8L3N0cm9uZz4gaG9cdTFFQjdjIGRcdTAwRTFuIGxpXHUwMEVBbiBrXHUxRUJGdCB2XHUwMEUwbyBcdTAwRjQgdHJcdTAwRUFuIFx1MDExMVx1MUVDMyBcdTAxMTFcdTAxQjBhIHZpZGVvIHZcdTAwRTBvIGRhbmggc1x1MDBFMWNoIHBoXHUwMEUxdCBsaVx1MDBFQW4gdFx1MUVFNWMuXG4gICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIHNwYWNlLXktMS41IG92ZXJmbG93LXktYXV0byBwci0xIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7cXVldWVMaXN0Lm1hcCgocSwgaWR4KSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17cS5pZCB8fCBpZHh9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjUgYmctWyMwQjBFMTRdIGJvcmRlciByb3VuZGVkLXhsIHAtMiB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHEudHJhbmdUaGFpID09PSAncGxheWluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JvcmRlci1lbWVyYWxkLTUwMC80MCBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoNTIsMjExLDE1MywwLjE1KV0gYmctZW1lcmFsZC05NTAvMjAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdib3JkZXItd2hpdGUvNSBob3Zlcjpib3JkZXItd2hpdGUvMTUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTYgaC02IHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTFweF0gZm9udC1ibGFjayBzaHJpbmstMCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcS50cmFuZ1RoYWkgPT09ICdwbGF5aW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1lbWVyYWxkLTUwMCB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzEwcHhfcmdiYSg1MiwyMTEsMTUzLDAuNCldJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncGxheWluZycgPyAnXHUyNUI2JyA6IGlkeCArIDF9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICB7cS50aHVtYiAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3EudGh1bWJ9IGFsdD1cIlwiIGNsYXNzTmFtZT1cInctMTIgaC03IHJvdW5kZWQtbWQgb2JqZWN0LWNvdmVyIHNocmluay0wIGJvcmRlciBib3JkZXItd2hpdGUvMTBcIiBsb2FkaW5nPVwibGF6eVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgbWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS0yMDAgZm9udC1ib2xkIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cS50aXRsZSB8fCBxLnZpZGVvVXJsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncGxheWluZycgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtZW1lcmFsZC00MDAgZm9udC1ib2xkXCI+XHUyNUNGIFx1MDExMGFuZyBwaFx1MDBFMXQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5UaFx1MDBFQW0gYlx1MUVERmk6IHtxLmFkZGVkQnkgfHwgJ1RoXHUwMEUwbmggdmlcdTAwRUFuJ308L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncXVldWVkJyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlBoXHUwMEUxdCB2aWRlbyBuXHUwMEUweSBuZ2F5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgncGxheV9ub3cnLCB7IGlkOiBxLmlkIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBob3ZlcjpiZy1bIzAwRjJGRV0vMzAgdGV4dC14cyBmb250LWJsYWNrIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYgUGhcdTAwRTF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJYXHUwMEYzYSBraFx1MUVDRmkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdyZW1vdmUnLCB7IGlkOiBxLmlkIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTcgaC03IHJvdW5kZWQtbGcgYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTMwMCBob3ZlcjpiZy1yb3NlLTUwMC8yNSB0ZXh0LXhzIGZvbnQtYmxhY2sgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cbiAgICA8L2Rpdj5cblxuICApO1xufVxuXG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDb21wb25lbnQ6IENhbXB1cyBGb2N1cyBSb29tIChTdHVkeSBDYWZcdTAwRTkgJiBQb21vZG9ybyBTZXNzaW9uKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBmdW5jdGlvbiBDYW1wdXNGb2N1c1Jvb20oe1xuICBwaG9uZyxcbiAgcGhvbmdNaW5oS2hvYSxcbiAgYXV0aCxcbiAgZG9uZ1Bob25nSGllblRhaSxcbiAgc29OZ3VvaSxcbiAgaXNGb2N1c01vZGUsXG4gIHNldElzRm9jdXNNb2RlXG59KSB7XG4gIGNvbnN0IFtmb2N1c1N0YXRlLCBzZXRGb2N1c1N0YXRlXSA9IHVzZVN0YXRlKHtcbiAgICBwaGFzZTogJ2ZvY3VzJyxcbiAgICBzdGF0dXM6ICdwYXVzZWQnLFxuICAgIGR1cmF0aW9uU2Vjb25kczogMTUwMCxcbiAgICByZW1haW5pbmdTZWNvbmRzOiAxNTAwLFxuICAgIHByZXNldDogJzI1XzUnLFxuICAgIHJldmlzaW9uOiAxLFxuICAgIGNhbkNvbnRyb2w6IGZhbHNlLFxuICAgIHVwZGF0ZWRBdDogbnVsbCxcbiAgICBzZXJ2ZXJOb3c6IG51bGxcbiAgfSk7XG4gIGNvbnN0IFtsb2NhbFJlbWFpbmluZywgc2V0TG9jYWxSZW1haW5pbmddID0gdXNlU3RhdGUoMTUwMCk7XG4gIGNvbnN0IFtkYW5nR3VpTGVuaCwgc2V0RGFuZ0d1aUxlbmhdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9pLCBzZXRMb2ldID0gdXNlU3RhdGUoJycpO1xuXG4gIC8vIEF1ZGlvIHN0YXRlIChBbWJpZW50IHBsYXliYWNrKVxuICBsZXQgY2F1SGluaCA9IHt9O1xuICB0cnkgeyBjYXVIaW5oID0gcGhvbmcuY2F1SGluaCA/IEpTT04ucGFyc2UocGhvbmcuY2F1SGluaCkgOiB7fTsgfSBjYXRjaCB7IC8qIGJcdTFFQ0YgcXVhICovIH1cbiAgY29uc3QgbmhhY1VybCA9IGNhdUhpbmgubmhhY1VybCA/IHVybE1lZGlhRmUoY2F1SGluaC5uaGFjVXJsKSA6ICcnO1xuICBjb25zdCBhdWRpb1JlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgW2F1ZGlvUGxheWluZywgc2V0QXVkaW9QbGF5aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2F1ZGlvVm9sdW1lLCBzZXRBdWRpb1ZvbHVtZV0gPSB1c2VTdGF0ZSgwLjUpO1xuICBjb25zdCBbYXVkaW9NdXRlZCwgc2V0QXVkaW9NdXRlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtoYXNJbnRlcmFjdGVkQXVkaW8sIHNldEhhc0ludGVyYWN0ZWRBdWRpb10gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgLy8gQXV0aG9yaXphdGlvblxuICBjb25zdCBbY2FuQ29udHJvbCwgc2V0Q2FuQ29udHJvbF0gPSB1c2VTdGF0ZShCb29sZWFuKGF1dGgudXNlcj8uaXNUZWFjaGVyIHx8IHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nKSk7XG4gIGNvbnN0IGlzSG9zdCA9IGNhbkNvbnRyb2w7XG5cbiAgLy8gU3luYyBzdGF0ZSByZWNvbmNpbGlhdGlvbiBoZWxwZXJcbiAgY29uc3QgYXBEdW5nRm9jdXNTdGF0ZSA9IChzdCkgPT4ge1xuICAgIGlmICghc3QpIHJldHVybjtcbiAgICBzZXRGb2N1c1N0YXRlKHN0KTtcbiAgICBjb25zdCByZW0gPSBOdW1iZXIoc3QucmVtYWluaW5nU2Vjb25kcyA/PyAxNTAwKTtcbiAgICBzZXRMb2NhbFJlbWFpbmluZyhyZW0pO1xuICB9O1xuXG4gIC8vIDEuIFBvbGxpbmcgRm9jdXMgU3RhdGUgKGV2ZXJ5IDMwMDBtcykgd2l0aCB2aXNpYmlsaXR5IHJlY29uY2lsaWF0aW9uICYgc3RyaWN0IGNsZWFudXBcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcblxuICAgIGNvbnN0IGZldGNoRm9jdXMgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1mb2N1cz9waG9uZ0lkPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHBob25nLmlkKX1gKTtcbiAgICAgICAgaWYgKCFyZXMub2spIHJldHVybjtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChhY3RpdmUgJiYgZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkLmNhbkNvbnRyb2wgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgc2V0Q2FuQ29udHJvbChkLmNhbkNvbnRyb2wpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhcER1bmdGb2N1c1N0YXRlKGQuc3RhdGUpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLyogYlx1MUVDRiBxdWEga2hpIGhcdTFFRTd5IGtcdTFFQkZ0IG5cdTFFRDFpICovXG4gICAgICB9XG4gICAgfTtcblxuICAgIGZldGNoRm9jdXMoKTtcbiAgICBjb25zdCB0aW1lciA9IHNldEludGVydmFsKGZldGNoRm9jdXMsIDMwMDApO1xuXG4gICAgY29uc3QgaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSA9ICgpID0+IHtcbiAgICAgIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09ICd2aXNpYmxlJyAmJiBhY3RpdmUpIHtcbiAgICAgICAgZmV0Y2hGb2N1cygpO1xuICAgICAgfVxuICAgIH07XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UpO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSk7XG4gICAgfTtcbiAgfSwgW3Bob25nLmlkXSk7XG5cbiAgLy8gMi4gTG9jYWwgQ291bnRkb3duIFRpY2sgKGV2ZXJ5IDEwMDBtcyB3aGVuIHN0YXR1cyA9PT0gJ3J1bm5pbmcnKVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChmb2N1c1N0YXRlLnN0YXR1cyAhPT0gJ3J1bm5pbmcnKSByZXR1cm47XG4gICAgY29uc3QgdGljayA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHNldExvY2FsUmVtYWluaW5nKHIgPT4gTWF0aC5tYXgoMCwgciAtIDEpKTtcbiAgICB9LCAxMDAwKTtcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbCh0aWNrKTtcbiAgfSwgW2ZvY3VzU3RhdGUuc3RhdHVzXSk7XG5cbiAgLy8gMy4gQ29tbWFuZCBkaXNwYXRjaGVyIHdpdGggb3B0aW1pc3RpYyBjb25jdXJyZW5jeSAocmV2aXNpb24gY2hlY2sgJiBjb25mbGljdCBoYW5kbGluZylcbiAgY29uc3QgZ3VpTGVuaCA9IGFzeW5jIChhY3Rpb24sIGV4dHJhUGF5bG9hZCA9IHt9KSA9PiB7XG4gICAgaWYgKGRhbmdHdWlMZW5oKSByZXR1cm47XG4gICAgc2V0RGFuZ0d1aUxlbmgodHJ1ZSk7XG4gICAgc2V0TG9pKCcnKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1mb2N1cycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgYWN0aW9uLFxuICAgICAgICAgIGV4cGVjdGVkUmV2aXNpb246IGZvY3VzU3RhdGUucmV2aXNpb24sXG4gICAgICAgICAgLi4uZXh0cmFQYXlsb2FkXG4gICAgICAgIH0pXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgIGFwRHVuZ0ZvY3VzU3RhdGUoZC5zdGF0ZSk7XG4gICAgICB9IGVsc2UgaWYgKHJlcy5zdGF0dXMgPT09IDQwOSAmJiBkLnN0YXRlKSB7XG4gICAgICAgIC8vIENvbmN1cnJlbmN5IGNvbmZsaWN0OiBhZG9wdCBsYXRlc3Qgc2VydmVyIHN0YXRlXG4gICAgICAgIGFwRHVuZ0ZvY3VzU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIHNldExvaSgnXHUwMTEwXHUwMEUzIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgbFx1MUVBMWkgcGhpXHUwMEVBbiB0aGVvIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0TG9pKGQubG9pIHx8ICdLaFx1MDBGNG5nIHRoXHUxRUMzIGNcdTFFQURwIG5oXHUxRUFEdCB0clx1MUVBMW5nIHRoXHUwMEUxaSBwaFx1MDBGMm5nIGhcdTFFQ0RjIHRcdTFFQURwLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0TG9pKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RGFuZ0d1aUxlbmgoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyA0LiBBbWJpZW50IEF1ZGlvIENvbnRyb2xzXG4gIGNvbnN0IGJhdEFtVGhhbmggPSAoKSA9PiB7XG4gICAgc2V0SGFzSW50ZXJhY3RlZEF1ZGlvKHRydWUpO1xuICAgIGlmIChhdWRpb1JlZi5jdXJyZW50KSB7XG4gICAgICBhdWRpb1JlZi5jdXJyZW50LnBsYXkoKS50aGVuKCgpID0+IHtcbiAgICAgICAgc2V0QXVkaW9QbGF5aW5nKHRydWUpO1xuICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS53YXJuKCdBdXRvcGxheSBibG9ja2VkIG9yIGF1ZGlvIGxvYWQgZXJyb3I6JywgZXJyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB0b2dnbGVBdWRpb1BsYXkgPSAoKSA9PiB7XG4gICAgaWYgKCFhdWRpb1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgaWYgKGF1ZGlvUGxheWluZykge1xuICAgICAgYXVkaW9SZWYuY3VycmVudC5wYXVzZSgpO1xuICAgICAgc2V0QXVkaW9QbGF5aW5nKGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYmF0QW1UaGFuaCgpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB0b2dnbGVBdWRpb011dGUgPSAoKSA9PiB7XG4gICAgaWYgKCFhdWRpb1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgY29uc3QgbmV3TXV0ZSA9ICFhdWRpb011dGVkO1xuICAgIGF1ZGlvUmVmLmN1cnJlbnQubXV0ZWQgPSBuZXdNdXRlO1xuICAgIHNldEF1ZGlvTXV0ZWQobmV3TXV0ZSk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlVm9sdW1lQ2hhbmdlID0gKGUpID0+IHtcbiAgICBjb25zdCB2YWwgPSBwYXJzZUZsb2F0KGUudGFyZ2V0LnZhbHVlKTtcbiAgICBzZXRBdWRpb1ZvbHVtZSh2YWwpO1xuICAgIGlmIChhdWRpb1JlZi5jdXJyZW50KSB7XG4gICAgICBhdWRpb1JlZi5jdXJyZW50LnZvbHVtZSA9IHZhbDtcbiAgICAgIGlmICh2YWwgPiAwICYmIGF1ZGlvTXV0ZWQpIHtcbiAgICAgICAgYXVkaW9SZWYuY3VycmVudC5tdXRlZCA9IGZhbHNlO1xuICAgICAgICBzZXRBdWRpb011dGVkKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgY29uc3QgaXNCcmVhayA9IGZvY3VzU3RhdGUucGhhc2UgPT09ICdicmVhayc7XG4gIGNvbnN0IGlzUnVubmluZyA9IGZvY3VzU3RhdGUuc3RhdHVzID09PSAncnVubmluZyc7XG4gIGNvbnN0IGR1cmF0aW9uID0gZm9jdXNTdGF0ZS5kdXJhdGlvblNlY29uZHMgfHwgKGlzQnJlYWsgPyAzMDAgOiAxNTAwKTtcbiAgY29uc3QgcHJvZ3Jlc3NQZXJjZW50ID0gTWF0aC5taW4oMTAwLCBNYXRoLm1heCgwLCAoKGR1cmF0aW9uIC0gbG9jYWxSZW1haW5pbmcpIC8gZHVyYXRpb24pICogMTAwKSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTQgbWluLXctMCB3LWZ1bGxcIj5cbiAgICAgIHsvKiBIaWRkZW4gQXVkaW8gZWxlbWVudCBmb3IgYW1iaWVudCBzb3VuZHRyYWNrICovfVxuICAgICAge25oYWNVcmwgJiYgKFxuICAgICAgICA8YXVkaW9cbiAgICAgICAgICByZWY9e2F1ZGlvUmVmfVxuICAgICAgICAgIHNyYz17bmhhY1VybH1cbiAgICAgICAgICBsb29wXG4gICAgICAgICAgcHJlbG9hZD1cIm5vbmVcIlxuICAgICAgICAgIG9uRW5kZWQ9eygpID0+IHNldEF1ZGlvUGxheWluZyhmYWxzZSl9XG4gICAgICAgICAgb25FcnJvcj17KCkgPT4gc2V0QXVkaW9QbGF5aW5nKGZhbHNlKX1cbiAgICAgICAgLz5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBIZWFkZXIgYmFyOiBQcmVzZW5jZSwgSG9zdCBiYWRnZSwgRm9jdXMgTW9kZSB0b2dnbGUsIENsb3NlIFJvb20gKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNCBmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zIHNoYWRvdy1sZ1wiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHB4LTIuNSBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgYm9yZGVyICR7cGhvbmcucGhhbVZpID09PSAndHJ1b25nJyA/ICdiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtNDAwIGJvcmRlci1lbWVyYWxkLTUwMC8zMCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAge3Bob25nLnBoYW1WaSA9PT0gJ3RydW9uZycgPyAnXHVEODNDXHVERjEwIFRvXHUwMEUwbiB0clx1MDFCMFx1MUVERG5nJyA6IGBcdUQ4M0RcdUREMTIgTFx1MUVEQnAgJHtwaG9uZy5sb3BUZW4gfHwgJyd9YH1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gaWQ9XCJmb2N1cy1ob3N0LWJhZGdlXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgIENoXHUxRUU3IHBoXHUwMEYybmc6IDxzdHJvbmcgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0yMDBcIj57cGhvbmcuY2h1UGhvbmdUZW59PC9zdHJvbmc+XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGlkPVwiZm9jdXMtcm9vbS1wcmVzZW5jZVwiIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHB4LTIuNSBweS0wLjUgcm91bmRlZC1mdWxsIGJnLVsjMDBGMkZFXS8xMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8yMCBmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgICBcdUQ4M0RcdURDNjUge3NvTmd1b2kgfHwgMX0gbmdcdTAxQjBcdTFFRERpIFx1MDExMWFuZyBjXHUwMEY5bmcgdFx1MUVBRHAgdHJ1bmdcbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbWwtYXV0b1wiPlxuICAgICAgICAgIHtpc0ZvY3VzTW9kZSAmJiAoXG4gICAgICAgICAgICA8c3BhbiBpZD1cImZvY3VzLW1vZGUtYWN0aXZlLWluZGljYXRvclwiIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXB1cnBsZS00MDAgYmctcHVycGxlLTUwMC8xMCBweC0yIHB5LTAuNSByb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci1wdXJwbGUtNTAwLzIwIGFuaW1hdGUtcHVsc2VcIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERkFGIFx1MDExMGFuZyBiXHUxRUFEdCBGb2N1cyBNb2RlXG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgKX1cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1tb2RlLXRvZ2dsZVwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzRm9jdXNNb2RlKCFpc0ZvY3VzTW9kZSl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7aXNGb2N1c01vZGUgPyAnYmctcHVycGxlLTUwMC8yMCB0ZXh0LXB1cnBsZS0zMDAgYm9yZGVyLXB1cnBsZS01MDAvNDAgc2hhZG93LVswXzBfMTJweF9yZ2JhKDE2OCw4NSwyNDcsMC4zKV0nIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REZBRjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPntpc0ZvY3VzTW9kZSA/ICdcdTIxQTkgVGhvXHUwMEUxdCBGb2N1cyBNb2RlJyA6ICdGb2N1cyBNb2RlJ308L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICB7Y2FuQ29udHJvbCAmJiBwaG9uZy5jaHVQaG9uZ0tob2EgIT09ICdoZS10aG9uZycgJiYgKFxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17ZG9uZ1Bob25nSGllblRhaX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xNSBob3ZlcjpiZy1yb3NlLTUwMC8yNSB0ZXh0LXJvc2UtMzAwIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgXHUwMTEwXHUwMEYzbmcgcGhcdTAwRjJuZ1xuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIE1haW4gRm9jdXMgQ2VudGVycGllY2UgQ2FyZCAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPXtgcmVsYXRpdmUgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtM3hsIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBwLTYgc206cC04IGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyIHNoYWRvdy0yeGwgJHtpc0JyZWFrID8gJ2JnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzFFMTcxMF0gdG8tWyMxMzExMEVdIGJvcmRlci1hbWJlci01MDAvMzAnIDogJ2JnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzBGMUUyOF0gdG8tWyMwQTEyMTldIGJvcmRlci1bIzAwRjJGRV0vMzAnfWB9PlxuICAgICAgICB7LyogR2xvdyBiYWNrZHJvcCBhY2NlbnQgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgYWJzb2x1dGUgLXRvcC0yNCAtbGVmdC0yNCB3LTcyIGgtNzIgcm91bmRlZC1mdWxsIGJsdXItM3hsIG9wYWNpdHktMjAgcG9pbnRlci1ldmVudHMtbm9uZSAke2lzQnJlYWsgPyAnYmctYW1iZXItNTAwJyA6ICdiZy1bIzAwRjJGRV0nfWB9IC8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgYWJzb2x1dGUgLWJvdHRvbS0yNCAtcmlnaHQtMjQgdy03MiBoLTcyIHJvdW5kZWQtZnVsbCBibHVyLTN4bCBvcGFjaXR5LTIwIHBvaW50ZXItZXZlbnRzLW5vbmUgJHtpc0JyZWFrID8gJ2JnLW9yYW5nZS01MDAnIDogJ2JnLWluZGlnby01MDAnfWB9IC8+XG5cbiAgICAgICAgey8qIFBoYXNlICYgU3RhdHVzIEJhZGdlcyAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTIuNSBtYi02IHotMTBcIj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgaWQ9XCJmb2N1cy1waGFzZS1iYWRnZVwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LWV4dHJhYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgYm9yZGVyIHNoYWRvdy1zbSAke2lzQnJlYWsgPyAnYmctYW1iZXItNTAwLzE1IHRleHQtYW1iZXItMzAwIGJvcmRlci1hbWJlci01MDAvNDAnIDogJ2JnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXItWyMwMEYyRkVdLzQwJ31gfT5cbiAgICAgICAgICAgIHtpc0JyZWFrID8gJ1x1MjYxNSBHaVx1MUVERCBOZ2hcdTFFQzkgTmdcdTAxQTFpIChCcmVhayknIDogJ1x1RDgzQ1x1REY0NSBQaGlcdTAwRUFuIFRcdTFFQURwIFRydW5nIChGb2N1cyknfVxuICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBpZD1cImZvY3VzLXN0YXR1cy1iYWRnZVwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEgcm91bmRlZC1mdWxsIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7aXNSdW5uaW5nID8gJ2JnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC00MDAgYm9yZGVyLWVtZXJhbGQtNTAwLzMwJyA6ICdiZy1zbGF0ZS01MDAvMTUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXNsYXRlLTUwMC8zMCd9YH0+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTIgaC0yIHJvdW5kZWQtZnVsbCAke2lzUnVubmluZyA/ICdiZy1lbWVyYWxkLTQwMCBhbmltYXRlLXB1bHNlJyA6ICdiZy1zbGF0ZS00MDAnfWB9IC8+XG4gICAgICAgICAgICA8c3Bhbj57aXNSdW5uaW5nID8gJ1x1MDExMGFuZyBcdTAxMTFcdTFFQkZtJyA6ICdUXHUxRUExbSBkXHUxRUVCbmcnfTwvc3Bhbj5cbiAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1wcmVzZXQtdG9nZ2xlXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgZGlzYWJsZWQ9eyFjYW5Db250cm9sIHx8IGRhbmdHdWlMZW5ofVxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gY2FuQ29udHJvbCAmJiBndWlMZW5oKCdzZXRfcHJlc2V0JywgeyBwcmVzZXQ6IGZvY3VzU3RhdGUucHJlc2V0ID09PSAnNTBfMTAnID8gJzI1XzUnIDogJzUwXzEwJyB9KX1cbiAgICAgICAgICAgIHRpdGxlPXtjYW5Db250cm9sID8gJ0JcdTFFQTVtIFx1MDExMVx1MUVDMyBcdTAxMTFcdTFFRDVpIGNodSBrXHUxRUYzIFBvbW9kb3JvJyA6ICdDaHUga1x1MUVGMyBQb21vZG9ybyBoaVx1MUVDN24gdFx1MUVBMWknfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtbW9ubyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7Y2FuQ29udHJvbCA/ICdob3ZlcjpzY2FsZS0xMDUgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyIGJnLXdoaXRlLzEwIHRleHQtd2hpdGUgYm9yZGVyLXdoaXRlLzIwJyA6ICdjdXJzb3ItZGVmYXVsdCBiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICBcdTI2OTlcdUZFMEYge2ZvY3VzU3RhdGUucHJlc2V0ID09PSAnNTBfMTAnID8gJzUwIC8gMTAgcGhcdTAwRkF0JyA6ICcyNSAvIDUgcGhcdTAwRkF0J31cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIE1hc3NpdmUgVGltZXIgRGlzcGxheSAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteS0yIHNtOm15LTQgei0xMFwiPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBpZD1cImZvY3VzLXRpbWVyLWRpc3BsYXlcIlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgZm9udC1tb25vIHRleHQtNnhsIHNtOnRleHQtOHhsIGZvbnQtYmxhY2sgdHJhY2tpbmctd2lkZXN0IGJsb2NrIHRyYW5zaXRpb24tYWxsIHNlbGVjdC1ub25lICR7aXNCcmVhayA/ICd0ZXh0LWFtYmVyLTMwMCBkcm9wLXNoYWRvdy1bMF8wXzM1cHhfcmdiYSgyNDUsMTU4LDExLDAuMzUpXScgOiAndGV4dC1bIzAwRjJGRV0gZHJvcC1zaGFkb3ctWzBfMF8zNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSd9YH0+XG4gICAgICAgICAgICB7ZGluaERhbmdHaWF5UGh1dChsb2NhbFJlbWFpbmluZyl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogUHJvZ3Jlc3MgYmFyICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy1tZCBoLTIgYmctYmxhY2svNDAgcm91bmRlZC1mdWxsIG92ZXJmbG93LWhpZGRlbiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIG15LTQgei0xMFwiPlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGgtZnVsbCB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0xMDAwICR7aXNCcmVhayA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLW9yYW5nZS01MDAnIDogJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzQjgyRjZdJ31gfVxuICAgICAgICAgICAgc3R5bGU9e3sgd2lkdGg6IGAke3Byb2dyZXNzUGVyY2VudH0lYCB9fVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBDb250cm9sIEJ1dHRvbnMgZm9yIEhvc3QvVGVhY2hlciAqL31cbiAgICAgICAge2NhbkNvbnRyb2wgPyAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTMgbXQtNCB6LTEwXCI+XG4gICAgICAgICAgICB7IWlzUnVubmluZyA/IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXN0YXJ0XCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgnc3RhcnQnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC02IHB5LTMgcm91bmRlZC0yeGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLWVtZXJhbGQtNDAwIHRvLXRlYWwtNTAwIGhvdmVyOmZyb20tZW1lcmFsZC0zMDAgaG92ZXI6dG8tdGVhbC00MDAgdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQtc20gc2hhZG93LVswXzBfMjBweF9yZ2JhKDUyLDIxMSwxNTMsMC4zKV0gYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTI1QjY8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVBRnQgXHUwMTExXHUxRUE3dTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtcGF1c2VcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdwYXVzZScpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMyByb3VuZGVkLTJ4bCBiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLW9yYW5nZS01MDAgaG92ZXI6ZnJvbS1hbWJlci0zMDAgaG92ZXI6dG8tb3JhbmdlLTQwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC1zbSBzaGFkb3ctWzBfMF8yMHB4X3JnYmEoMjUxLDE5MSwzNiwwLjMpXSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjNGODwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5UXHUxRUExbSBkXHUxRUVCbmc8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1yZXNldFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3Jlc2V0Jyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMyByb3VuZGVkLTJ4bCBiZy13aGl0ZS8xMCBob3ZlcjpiZy13aGl0ZS8xNSB0ZXh0LXNsYXRlLTIwMCB0ZXh0LXNtIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDA0PC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTAxMTBcdTFFQjd0IGxcdTFFQTFpPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIHtpc0JyZWFrID8gKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtc3RhcnQtZm9jdXNcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdzdGFydF9mb2N1cycpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMyByb3VuZGVkLTJ4bCBiZy1bIzAwRjJGRV0vMjAgaG92ZXI6YmctWyMwMEYyRkVdLzMwIHRleHQtWyMwMEYyRkVdIHRleHQtc20gZm9udC1ib2xkIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGQUY8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+Vlx1MDBFMG8gVFx1MUVBRHAgdHJ1bmc8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXN0YXJ0LWJyZWFrXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgnc3RhcnRfYnJlYWsnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTMgcm91bmRlZC0yeGwgYmctYW1iZXItNTAwLzIwIGhvdmVyOmJnLWFtYmVyLTUwMC8zMCB0ZXh0LWFtYmVyLTMwMCB0ZXh0LXNtIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC80MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyNjE1PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPk5naFx1MUVDOSBuZ1x1MDFBMWk8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIG10LTMgei0xMFwiPlxuICAgICAgICAgICAgXHUyM0YzIFx1MDExMFx1MUVEM25nIGhcdTFFRDMgUG9tb2Rvcm8gZG8gY2hcdTFFRTcgcGhcdTAwRjJuZyBcdTAxMTFpXHUxRUMxdSBwaFx1MUVEMWkgXHUyMDE0IGhcdTAwRTN5IHRcdTFFQURwIHRydW5nIGhcdTFFQkZ0IG1cdTAwRUNuaCB2XHUwMEUwbyBjXHUwMEY0bmcgdmlcdTFFQzdjL2hcdTFFQ0RjIHRcdTFFQURwIG5oXHUwMEU5IVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgKX1cblxuICAgICAgICB7bG9pICYmIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1yb3NlLTQwMCBtdC00IHotMTBcIj57bG9pfTwvcD59XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIEFtYmllbnQgQXVkaW8gUGxheWVyIENhcmQgKi99XG4gICAgICB7bmhhY1VybCA/IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTQgc206cC01IGZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtNCBzaGFkb3cteGxcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zLjUgbWluLXctMCB3LWZ1bGwgc206dy1hdXRvXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YHctMTIgaC0xMiByb3VuZGVkLTJ4bCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXhsIHNocmluay0wIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke2F1ZGlvUGxheWluZyA/ICdiZy1bIzhCNUNGNl0vMjAgdGV4dC1bIzhCNUNGNl0gYm9yZGVyLVsjOEI1Q0Y2XS80MCBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMTM5LDkyLDI0NiwwLjMpXSBhbmltYXRlLXB1bHNlJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REZBN1xuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi13LTBcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC13aGl0ZSB0cnVuY2F0ZVwiPlx1MDBDMm0gdGhhbmggblx1MUVDMW4gQW1iaWVudDwvcD5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICB7YXVkaW9QbGF5aW5nID8gJ1x1MDExMGFuZyBwaFx1MDBFMXQga2hcdTAwRjRuZyBnaWFuIGhcdTFFQ0RjIHRcdTFFQURwJyA6ICdcdTAwQzJtIHRoYW5oIGNcdTFFRTVjIGJcdTFFRDkgdGhlbyB0aGlcdTFFQkZ0IGJcdTFFQ0InfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0zIHctZnVsbCBzbTp3LWF1dG8ganVzdGlmeS1lbmRcIj5cbiAgICAgICAgICAgIHshaGFzSW50ZXJhY3RlZEF1ZGlvICYmICFhdWRpb1BsYXlpbmcgJiYgKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tc3RhcnQtZm9jdXMtYXVkaW9cIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2JhdEFtVGhhbmh9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjOEI1Q0Y2XSB0by1bIzYzNjZGMV0gdGV4dC13aGl0ZSB0ZXh0LXhzIGZvbnQtYm9sZCBzaGFkb3ctbGcgaG92ZXI6b3BhY2l0eS05MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMEE8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVBRHQgXHUwMEUybSB0aGFuaCB0XHUxRUFEcCB0cnVuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiZm9jdXMtYXVkaW8tdG9nZ2xlXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e3RvZ2dsZUF1ZGlvUGxheX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke2F1ZGlvUGxheWluZyA/ICdiZy1bIzhCNUNGNl0vMjAgdGV4dC1bIzhCNUNGNl0gYm9yZGVyLVsjOEI1Q0Y2XS80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTMwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgICA8c3Bhbj57YXVkaW9QbGF5aW5nID8gJ1x1MjNGOCBUXHUxRUExbSBkXHUxRUVCbmcnIDogJ1x1MjVCNiBQaFx1MDBFMXQgdGlcdTFFQkZwJ308L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlQXVkaW9NdXRlfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTIgcm91bmRlZC14bCBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC14cyB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICB7YXVkaW9NdXRlZCB8fCBhdWRpb1ZvbHVtZSA9PT0gMCA/ICdcdUQ4M0RcdUREMDcnIDogJ1x1RDgzRFx1REQwOSd9XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIHR5cGU9XCJyYW5nZVwiXG4gICAgICAgICAgICAgIG1pbj1cIjBcIlxuICAgICAgICAgICAgICBtYXg9XCIxXCJcbiAgICAgICAgICAgICAgc3RlcD1cIjAuMDVcIlxuICAgICAgICAgICAgICB2YWx1ZT17YXVkaW9NdXRlZCA/IDAgOiBhdWRpb1ZvbHVtZX1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZVZvbHVtZUNoYW5nZX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0yNCBoLTEuNSBiZy13aGl0ZS8xMCByb3VuZGVkLWxnIGFwcGVhcmFuY2Utbm9uZSBjdXJzb3ItcG9pbnRlciBhY2NlbnQtWyM4QjVDRjZdXCJcbiAgICAgICAgICAgICAgdGl0bGU9XCJcdTAwQzJtIGxcdTAxQjBcdTFFRTNuZyBuaFx1MUVBMWMgblx1MUVDMW5cIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC0yeGwgcC00IHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDBcIj5cbiAgICAgICAgICAgIFx1MjYxNSBQaFx1MDBGMm5nIFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgdFx1MDEyOW5oIGxcdTFFQjduZyAoY2hcdTAxQjBhIGdcdTFFQUZuIGxpbmsgXHUwMEUybSB0aGFuaCBuXHUxRUMxbikgXHUyMDE0IENodXlcdTAwRUFuIHRcdTAwRTJtIHRcdTFFRDFpIFx1MDExMWEgdlx1MDBFMG8gYlx1MDBFMGkgdlx1MUVERi5cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAge3Bob25nLm1vVGEgJiYgKFxuICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCBweC0yIGxlYWRpbmctcmVsYXhlZFwiPlxuICAgICAgICAgIHtwaG9uZy5tb1RhfVxuICAgICAgICA8L3A+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIkFBQUEsTUFBTSxFQUFFLFVBQVUsV0FBVyxPQUFPLElBQUk7QUFDeEMsU0FBUyxrQkFBa0Isb0JBQW9CLGVBQWUsV0FBVyxtQkFBbUIscUJBQXFCLGtCQUFrQjtBQUtuSSxNQUFNLGFBQWEsQ0FBQyxPQUFPLE1BQU07QUFBRSxNQUFJLFNBQVMsb0JBQW9CLFVBQVcsSUFBRztBQUFHO0FBSTlFLGdCQUFTLFdBQVcsRUFBRSxPQUFPLFVBQVUsR0FBRztBQUMvQyxRQUFNLENBQUMsR0FBRyxJQUFJLElBQUksTUFBTSxTQUFTLEVBQUU7QUFDbkMsUUFBTSxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVM7QUFDN0IsU0FDRSxvQ0FBQyxTQUFJLFdB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QUFBQTtBQUFBLElBQ1Ysb0NBQUMsY0FBSyxRQUFDO0FBQUEsSUFDUCxvQ0FBQyxjQUFLLHFCQUFTO0FBQUEsRUFDakIsQ0FFSixJQUVBLG9DQUFDLE9BQUUsV0FBVSxzQ0FBbUMsdUxBRWhELEdBR0QsT0FBTyxvQ0FBQyxPQUFFLFdBQVUscUNBQW1DLEdBQUksQ0FDOUQsR0FHQyxVQUNDLG9DQUFDLFNBQUksV0FBVSx1SUFDYixvQ0FBQyxTQUFJLFdBQVUsd0RBQ2Isb0NBQUMsU0FBSSxXQUFXLGlHQUFpRyxlQUFlLDRHQUE0RywyQ0FBMkMsTUFBSSxXQUUzUixHQUNBLG9DQUFDLFNBQUksV0FBVSxhQUNiLG9DQUFDLE9BQUUsV0FBVSwyQ0FBd0MsOEJBQW9CLEdBQ3pFLG9DQUFDLE9BQUUsV0FBVSx5Q0FDVixlQUFlLHNEQUFpQyxzREFDbkQsQ0FDRixDQUNGLEdBRUEsb0NBQUMsU0FBSSxXQUFVLG9FQUNaLENBQUMsc0JBQXNCLENBQUMsZ0JBQ3ZCO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFLO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVCxXQUFVO0FBQUE7QUFBQSxJQUNWLG9DQUFDLGNBQUssV0FBRTtBQUFBLElBQ1Isb0NBQUMsY0FBSyxxQ0FBc0I7QUFBQSxFQUM5QixHQUdGO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFLO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVCxXQUFXLDRGQUE0RixlQUFlLHVEQUF1RCwyQ0FBMkM7QUFBQTtBQUFBLElBQ3hOLG9DQUFDLGNBQU0sZUFBZSw4QkFBZSwwQkFBYztBQUFBLEVBQ3JELEdBRUE7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLFNBQVM7QUFBQSxNQUNULFdBQVU7QUFBQTtBQUFBLElBQ1QsY0FBYyxnQkFBZ0IsSUFBSSxjQUFPO0FBQUEsRUFDNUMsR0FFQTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsTUFBSztBQUFBLE1BQ0wsS0FBSTtBQUFBLE1BQ0osS0FBSTtBQUFBLE1BQ0osTUFBSztBQUFBLE1BQ0wsT0FBTyxhQUFhLElBQUk7QUFBQSxNQUN4QixVQUFVO0FBQUEsTUFDVixXQUFVO0FBQUEsTUFDVixPQUFNO0FBQUE7QUFBQSxFQUNSLENBQ0YsQ0FDRixJQUVBLG9DQUFDLFNBQUksV0FBVSxvRUFDYixvQ0FBQyxPQUFFLFdBQVUsZ0NBQTZCLGlMQUUxQyxDQUNGLEdBR0QsTUFBTSxRQUNMLG9DQUFDLE9BQUUsV0FBVSxxREFDVixNQUFNLElBQ1QsQ0FFSjtBQUVKOyIsCiAgIm5hbWVzIjogWyJtYXhEdXIiLCAiaWZyIl0KfQo=
