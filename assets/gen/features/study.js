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
      seekVideo(sec, myCaps.video_control === true);
      return;
    }
    window.dispatchEvent(new CustomEvent("sr-seek", { detail: { phongId: phong.id, sec } }));
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
        m.videoTimeSec != null && m.videoTimeSec > 0 && /* @__PURE__ */ React.createElement(
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
              if (!hasSeekedInitRef.current && watchState.positionSeconds > 0 && event.target.seekTo) {
                hasSeekedInitRef.current = true;
                try {
                  event.target.seekTo(watchState.positionSeconds, true);
                } catch {
                }
              }
              if (watchState.playing && event.target.playVideo) {
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
      targetPos = Number(st.basePositionSeconds || 0) + elapsedSec * (st.playbackRate || 1);
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
      if (st.playing) {
        const drift = Math.abs(v.currentTime - targetPos);
        if (drift > 4) {
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
      if (ytPlayerRef.current && ytPlayerRef.current.getPlayerState) {
        const p = ytPlayerRef.current;
        try {
          const cur = p.getCurrentTime() || 0;
          const drift = Math.abs(cur - targetPos);
          if (st.playing) {
            if (drift > 5) {
              p.seekTo(targetPos, true);
            }
            const ps = p.getPlayerState();
            if ((ps === 2 || ps === 5) && (hasInteracted || hasInteractedRef.current)) {
              p.playVideo();
            }
          } else {
            const ps = p.getPlayerState();
            if (ps === 1) p.pauseVideo();
            if (Math.abs(cur - st.positionSeconds) > 3) {
              p.seekTo(st.positionSeconds, true);
            }
          }
        } catch {
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
      if (e.detail?.phongId !== phong.id) return;
      const sec = Math.max(0, Number(e.detail.sec) || 0);
      if (canControl) {
        guiLenh("seek", sec);
      } else {
        if (provider === "NATIVE_HTML5" && videoRef.current) videoRef.current.currentTime = sec;
        else if (provider === "YOUTUBE" && ytPlayerRef.current?.seekTo) ytPlayerRef.current.seekTo(sec, true);
        setLocalTime(Math.floor(sec));
      }
    };
    window.addEventListener("sr-seek", onSeekReq);
    return () => window.removeEventListener("sr-seek", onSeekReq);
  }, [phong.id, canControl, provider, watchState.revision]);
  const handleStartViewing = () => {
    hasInteractedRef.current = true;
    setHasInteracted(true);
    if (provider === "NATIVE_HTML5" && videoRef.current) {
      const v = videoRef.current;
      const p = v.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          if (!watchState.playing) {
            v.pause();
          }
        }).catch(() => {
        });
      }
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
      src: `https://www.youtube.com/embed/${ytId}?autoplay=${watchState.playing ? 1 : 0}&enablejsapi=1&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}&widget_referrer=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&rel=0&modestbranding=1&playsinline=1`,
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
      onClick: () => setDaMoRongStudio(!daMoRongStudio),
      title: daMoRongStudio ? "Thu g\u1ECDn" : "M\u1EDF r\u1ED9ng",
      className: "w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 flex items-center justify-center text-xs font-bold transition-all"
    },
    daMoRongStudio ? "\u25B2" : "\u25BC"
  ))), thongBaoVideo && /* @__PURE__ */ React.createElement("div", { className: "px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn" }, /* @__PURE__ */ React.createElement("span", null, "\u2728"), /* @__PURE__ */ React.createElement("span", null, thongBaoVideo)), loiVideo && /* @__PURE__ */ React.createElement("div", { className: "px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fadeIn" }, /* @__PURE__ */ React.createElement("span", null, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("span", null, loiVideo)), daMoRongStudio && /* @__PURE__ */ React.createElement("div", { className: "h-[340px] flex flex-col min-h-0 overflow-hidden" }, mediaTab === "search" && /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col gap-2.5 min-h-0" }, /* @__PURE__ */ React.createElement("form", { onSubmit: (e) => timKiemYouTube(e), className: "flex flex-col gap-2 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "relative flex-1" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" }, "\u{1F50D}"), /* @__PURE__ */ React.createElement(
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
  )))))));
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvc3R1ZHkuanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9ID0gUmVhY3Q7XG5pbXBvcnQgeyBkaW5oRGFuZ0dpYXlQaHV0LCBpZEdvb2dsZURyaXZlLCBpZFlvdXR1YmUsIGxhVmlkZW9UcnVjVGllcEZlLCBuYXBZb3VUdWJlSWZyYW1lQXBpLCB1cmxNZWRpYUZlIH0gZnJvbSAnLi4vbGliL2hlbHBlcnMuanMnO1xuXG4vLyBCXHUxRUNGIHF1YSB0aWNrIGtoaSB0YWIgXHUwMTExYW5nIFx1MUVERiBOXHUxRUMwTiBcdTIwMTQgdHJcdTAwRTFuaCBjXHUxRUQ5bmcgZFx1MUVEM24gcmVxdWVzdCBDbG91ZGZsYXJlIHZcdTAwRjQgXHUwMEVEY2gga2hpIGtoXHUwMEY0bmcgYWkgeGVtLlxuLy8gS2hcdTAwRjRuZyBkXHUwMEY5bmcgY2hvIHBvbGwgdFx1MDBFRG4gaGlcdTFFQzd1IHRoXHUxRUREaSBnaWFuIHRoXHUxRUYxYyAodmQgdm9pY2Ugc2lnbmFsaW5nKSB2XHUwMEVDIGJcdTFFQ0YgbFx1MUVFMSB0aWNrIGNcdTAwRjMgdGhcdTFFQzMgbFx1MDBFMG0gdHJlb1xuLy8gYlx1MUVBRnQgdGF5IGtcdTFFQkZ0IG5cdTFFRDFpIGhvXHUxRUI3YyB0clx1MUVDNSB0XHUwMEVEbiBoaVx1MUVDN3UgXCJyXHUxRUREaSB2b2ljZVwiIGNcdTFFRTdhIG5nXHUwMUIwXHUxRUREaSBraWEuXG5jb25zdCBraGlIaWVuVGhpID0gKGZuKSA9PiAoKSA9PiB7IGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09ICd2aXNpYmxlJykgZm4oKTsgfTtcblxuXG4vLyBcdTAwRDQgbmhcdTFFQURwIGxpbmsgdGhcdTAwRUFtIHZcdTAwRTBvIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIFx1MjAxNCBkXHUwMEY5bmcgY2h1bmcgY2hvIFN0dWR5RG9jayB2XHUwMEUwIENhbXB1c1dhdGNoVG9nZXRoZXJcbmV4cG9ydCBmdW5jdGlvbiBRdWV1ZUlucHV0KHsgb25BZGQsIG9uQWRkTmV4dCB9KSB7XG4gIGNvbnN0IFt2LCBzZXRWXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3Qgb2sgPSB2LnRyaW0oKS5sZW5ndGggPiAwO1xuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgPGlucHV0XG4gICAgICAgIGlkPVwiaW5wdXQtcXVldWUtYWRkXCJcbiAgICAgICAgdHlwZT1cInVybFwiXG4gICAgICAgIHZhbHVlPXt2fVxuICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRWKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgb25LZXlEb3duPXtlID0+IHsgaWYgKGUua2V5ID09PSAnRW50ZXInICYmIG9rKSB7IGUucHJldmVudERlZmF1bHQoKTsgb25BZGQodi50cmltKCkpOyBzZXRWKCcnKTsgfSB9fVxuICAgICAgICBwbGFjZWhvbGRlcj1cIlRoXHUwMEVBbSBsaW5rIHZpZGVvIHZcdTAwRTBvIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXHUyMDI2XCJcbiAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMi41IHB5LTEuNSB0ZXh0LVsxMXB4XSB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MFwiXG4gICAgICAvPlxuICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJidG4tcXVldWUtYWRkLW5leHRcIiBkaXNhYmxlZD17IW9rfVxuICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IG9uQWRkTmV4dCh2LnRyaW0oKSk7IHNldFYoJycpOyB9fVxuICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMS41IHJvdW5kZWQtbGcgYmctdmlvbGV0LTUwMC8xNSB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy12aW9sZXQtNTAwLzI1IGRpc2FibGVkOm9wYWNpdHktMzAgd2hpdGVzcGFjZS1ub3dyYXBcIj5cbiAgICAgICAgK1BoXHUwMEUxdCBrXHUxRUJGXG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGlkPVwiYnRuLXF1ZXVlLWVucXVldWVcIiBkaXNhYmxlZD17IW9rfVxuICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IG9uQWRkKHYudHJpbSgpKTsgc2V0VignJyk7IH19XG4gICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLVsjMDBGMkZFXS8yNSBkaXNhYmxlZDpvcGFjaXR5LTMwIHdoaXRlc3BhY2Utbm93cmFwXCI+XG4gICAgICAgICtDdVx1MUVEMWkgaFx1MDBFMG5nXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFNUVURZIERPQ0s6IEtIXHUwMEQ0TkcgR0lBTiBDXHUxRUQ4TkcgVFx1MDBDMUMgUEhcdTAwRDJORyBZT1VUVUJFIChQSEFTRSA0RikgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5leHBvcnQgZnVuY3Rpb24gU3R1ZHlEb2NrKHsgcGhvbmcsIHBob25nTWluaEtob2EsIGF1dGgsIHBob25nQ2hhdCA9IFtdLCBvblNlbmRQaG9uZ0NoYXQsIG9uWG9hVGluUGhvbmcsXG4gIG15Q2FwcyA9IHt9LCBpc1N0YWZmID0gZmFsc2UsIHZhaVRyb1Bob25nID0gJ21lbWJlcicsIHRoYW5oVmllbiA9IFtdLFxuICBwb2xpY2llcyA9IG51bGwsIGdyYW50cyA9IFtdLCB2aWRlb1RpbWVSZWYsIHNlZWtWaWRlbywgaGFuaERvbmdQaG9uZyxcbiAgY2FuQ29udHJvbDogX2NhbkNvbnRyb2wgPSBmYWxzZSwgZG9uZ1Bob25nSGllblRhaTogX2RvbmdQaG9uZ0hpZW5UYWksIGlzUm9vbVdpZGUgPSBmYWxzZSB9KSB7XG4gIGNvbnN0IFtkb2NrVGFiLCBzZXREb2NrVGFiXSA9IFJlYWN0LnVzZVN0YXRlKCdjaGF0Jyk7IC8vICdjaGF0JyB8ICdub3RlcycgfCAnd2hpdGVib2FyZCcgfCAnc2hlZXQnIHwgJ3ZvaWNlJyB8ICdxdWFuLXRyaSdcbiAgY29uc3QgW3Nob3dFbW9qaSwgc2V0U2hvd0Vtb2ppXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcblxuICAvLyBDYXBhYmlsaXR5IHBoXHUwMEVEYSBjbGllbnQgY2hcdTFFQzkgXHUwMTExXHUxRUMzIFx1MUVBOW4vaGlcdTFFQzduIFVJIFx1MjAxNCBtXHUxRUNEaSBxdXlcdTFFQzFuIHRoXHUxRUFEdCBkbyBzZXJ2ZXIgcXV5XHUxRUJGdC5cbiAgY29uc3QgY29RdXllbiA9IChjYXApID0+IG15Q2Fwc1tjYXBdICE9PSBmYWxzZTtcbiAgY29uc3QgbGF5VmlUcmlWaWRlbyA9ICgpID0+IE1hdGguZmxvb3IodmlkZW9UaW1lUmVmPy5jdXJyZW50IHx8IDApIHx8IG51bGw7XG4gIC8vIEJcdTFFQTVtIG1cdTFFRDFjIHRoXHUxRUREaSBnaWFuIFx1MjE5MiBnXHUxRUVEaSBldmVudCBjaG8gQ2FtcHVzV2F0Y2hUb2dldGhlciB4XHUxRUVEIGxcdTAwRkRcbiAgLy8gKGNcdTAwRjMgdmlkZW9fY29udHJvbCBcdTIxOTIgdHVhIGNodW5nIGNcdTFFQTMgcGhcdTAwRjJuZzsga2hcdTAwRjRuZyBcdTIxOTIgdHVhIGNcdTFFRTVjIGJcdTFFRDkgcGxheWVyIGNcdTFFRTdhIG1cdTAwRUNuaCkuXG4gIGNvbnN0IHlldUNhdVR1YSA9IChzZWMpID0+IHtcbiAgICBpZiAoc2VjID09IG51bGwgfHwgIShzZWMgPj0gMCkpIHJldHVybjtcbiAgICBpZiAoc2Vla1ZpZGVvKSB7IHNlZWtWaWRlbyhzZWMsIG15Q2Fwcy52aWRlb19jb250cm9sID09PSB0cnVlKTsgcmV0dXJuOyB9XG4gICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdzci1zZWVrJywgeyBkZXRhaWw6IHsgcGhvbmdJZDogcGhvbmcuaWQsIHNlYyB9IH0pKTtcbiAgfTtcblxuICAvLyAxLiBSb29tIENoYXQgU3RhdGVcbiAgY29uc3QgW2NoYXRJbnB1dCwgc2V0Q2hhdElucHV0XSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2NoYXRTZW5kaW5nLCBzZXRDaGF0U2VuZGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IGNoYXRDb21wb3NpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBjaGF0RW5kUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgPT09ICdjaGF0JyAmJiBjaGF0RW5kUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHAgPSBjaGF0RW5kUmVmLmN1cnJlbnQucGFyZW50RWxlbWVudDtcbiAgICAgIGlmIChwICYmIHAuc2Nyb2xsSGVpZ2h0ID4gcC5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgcC5zY3JvbGxUbyh7IHRvcDogcC5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtwaG9uZ0NoYXQubGVuZ3RoLCBkb2NrVGFiXSk7XG5cbiAgY29uc3QgaGFuZGxlU2VuZFJvb21DaGF0ID0gKGUpID0+IHtcbiAgICBlPy5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IHR4dCA9IGNoYXRJbnB1dC50cmltKCk7XG4gICAgaWYgKCF0eHQgfHwgY2hhdFNlbmRpbmcpIHJldHVybjtcbiAgICBzZXRDaGF0SW5wdXQoJycpO1xuICAgIHNldENoYXRTZW5kaW5nKHRydWUpO1xuICAgIGlmIChvblNlbmRQaG9uZ0NoYXQpIHtcbiAgICAgIFByb21pc2UucmVzb2x2ZShvblNlbmRQaG9uZ0NoYXQodHh0KSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICBzZXRDaGF0SW5wdXQoY3VyID0+IGN1ciA/IGN1ciA6IHR4dCk7XG4gICAgICB9KS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgc2V0Q2hhdFNlbmRpbmcoZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldENoYXRTZW5kaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gMi4gU2hhcmVkIE5vdGVzIFx1MjAxNCBlbnRyeSBhcHBlbmQgKG1cdTFFRDdpIG5nXHUwMUIwXHUxRUREaSB0aFx1MDBFQW0gZ2hpIGNoXHUwMEZBIHJpXHUwMEVBbmcsIGtoXHUwMEY0bmcgZ2hpIFx1MDExMVx1MDBFOCBuaGF1KVxuICBjb25zdCBbbm90ZXNMaXN0LCBzZXROb3Rlc0xpc3RdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbbm90ZUlucHV0LCBzZXROb3RlSW5wdXRdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbbm90ZVdpdGhUaW1lLCBzZXROb3RlV2l0aFRpbWVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IFtub3Rlc0NhbldyaXRlLCBzZXROb3Rlc0NhbldyaXRlXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBbbm90ZXNOb3RpY2UsIHNldE5vdGVzTm90aWNlXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3Qgbm90ZXNWZXJzaW9uUmVmID0gUmVhY3QudXNlUmVmKDApO1xuICBjb25zdCBub3RlQ29tcG9zaW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAnbm90ZXMnKSByZXR1cm47XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG4gICAgY29uc3QgZmV0Y2hOb3RlcyA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPW5vdGVzYCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2spIHtcbiAgICAgICAgICBzZXROb3Rlc0xpc3QoQXJyYXkuaXNBcnJheShkLnBheWxvYWQ/Lm5vdGVzKSA/IGQucGF5bG9hZC5ub3RlcyA6IFtdKTtcbiAgICAgICAgICBub3Rlc1ZlcnNpb25SZWYuY3VycmVudCA9IGQudmVyc2lvbiB8fCAwO1xuICAgICAgICAgIHNldE5vdGVzQ2FuV3JpdGUoZC5jYW5Xcml0ZSAhPT0gZmFsc2UpO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGl2ZSAmJiBkLmNvZGUgPT09ICdjYXBhYmlsaXR5X29mZicpIHtcbiAgICAgICAgICBzZXROb3Rlc0NhbldyaXRlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7fVxuICAgIH07XG4gICAgZmV0Y2hOb3RlcygpO1xuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaShmZXRjaE5vdGVzKSwgMzAwMCk7XG4gICAgcmV0dXJuICgpID0+IHsgYWN0aXZlID0gZmFsc2U7IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpOyB9O1xuICB9LCBbcGhvbmcuaWQsIGRvY2tUYWJdKTtcblxuICBjb25zdCB0aGVtR2hpQ2h1ID0gYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHRleHQgPSBub3RlSW5wdXQudHJpbSgpO1xuICAgIGlmICghdGV4dCkgcmV0dXJuO1xuICAgIHNldE5vdGVzTm90aWNlKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICByZXNvdXJjZTogJ25vdGVzJyxcbiAgICAgICAgICBwYXlsb2FkOiB7IHRleHQsIHZpZGVvVGltZVNlYzogbm90ZVdpdGhUaW1lID8gbGF5VmlUcmlWaWRlbygpIDogbnVsbCB9XG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHtcbiAgICAgICAgc2V0Tm90ZUlucHV0KCcnKTtcbiAgICAgICAgc2V0Tm90ZXNMaXN0KHByZXYgPT4gWy4uLnByZXYsIHsgaWQ6IGQuaWQsIHRlbjogYXV0aC51c2VyPy50ZW4gfHwgJ0JcdTFFQTFuJywgbm9pRHVuZzogdGV4dCwgdmlkZW9UaW1lU2VjOiBub3RlV2l0aFRpbWUgPyBsYXlWaVRyaVZpZGVvKCkgOiBudWxsLCBjdWFUb2k6IDEgfV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Tm90ZXNOb3RpY2UoZC5sb2kgfHwgJ0toXHUwMEY0bmcgbFx1MDFCMHUgXHUwMTExXHUwMUIwXHUxRUUzYyBnaGkgY2hcdTAwRkEuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IHNldE5vdGVzTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaS4nKTsgfVxuICB9O1xuXG4gIGNvbnN0IHhvYUdoaUNodSA9IGFzeW5jIChpZCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgcmVzb3VyY2U6ICdub3RlcycsIGFjdGlvbjogJ3hvYV9ub3RlJywgaWQgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vaykgc2V0Tm90ZXNMaXN0KHByZXYgPT4gcHJldi5maWx0ZXIobiA9PiBuLmlkICE9PSBpZCkpO1xuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICAvLyAzLiBTaGFyZWQgV2hpdGVib2FyZCBTdGF0ZVxuICBjb25zdCBjYW52YXNSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IFt3YlN0cm9rZXMsIHNldFdiU3Ryb2tlc10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFt3YkNvbG9yLCBzZXRXYkNvbG9yXSA9IFJlYWN0LnVzZVN0YXRlKCcjMDBGMkZFJyk7XG4gIGNvbnN0IFt3YldpZHRoLCBzZXRXYldpZHRoXSA9IFJlYWN0LnVzZVN0YXRlKDMpO1xuICBjb25zdCBbd2JUb29sLCBzZXRXYlRvb2xdID0gUmVhY3QudXNlU3RhdGUoJ3BlbicpO1xuICBjb25zdCBpc0RyYXdpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBjdXJyZW50U3Ryb2tlUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB3YlZlcnNpb25SZWYgPSBSZWFjdC51c2VSZWYoMCk7XG5cbiAgY29uc3QgcmVkcmF3Q2FudmFzID0gUmVhY3QudXNlQ2FsbGJhY2soKHN0cm9rZXMpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICBpZiAoIWNhbnZhcykgcmV0dXJuO1xuICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICBzdHJva2VzLmZvckVhY2gocyA9PiB7XG4gICAgICBpZiAoIXMucG9pbnRzIHx8IHMucG9pbnRzLmxlbmd0aCA8IDIpIHJldHVybjtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHMudG9vbCA9PT0gJ2VyYXNlcicgPyAnIzBCMEUxNCcgOiAocy5jb2xvciB8fCAnIzAwRjJGRScpO1xuICAgICAgY3R4LmxpbmVXaWR0aCA9IHMud2lkdGggfHwgMztcbiAgICAgIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcbiAgICAgIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICBjdHgubW92ZVRvKHMucG9pbnRzWzBdLngsIHMucG9pbnRzWzBdLnkpO1xuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBzLnBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjdHgubGluZVRvKHMucG9pbnRzW2ldLngsIHMucG9pbnRzW2ldLnkpO1xuICAgICAgfVxuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH0pO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgW3diQ2FuV3JpdGUsIHNldFdiQ2FuV3JpdGVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG5cbiAgLy8gXHUwMEMxcCAxIG9wIHZcdTAwRTBvIG1cdTFFQTNuZyBzdHJva2VzIChyZXBsYXkgYXBwZW5kLW9ubHkpOiAnc3Ryb2tlJyB0aFx1MDBFQW0gblx1MDBFOXQsICdjbGVhcicgeG9cdTAwRTEgc1x1MUVBMWNoLlxuICBjb25zdCBhcER1bmdPcCA9IChzdHJva2VzLCBvcCkgPT4ge1xuICAgIGlmIChvcC50eXBlID09PSAnY2xlYXInKSByZXR1cm4gW107XG4gICAgaWYgKG9wLnR5cGUgPT09ICdzdHJva2UnICYmIG9wLnN0cm9rZSkgcmV0dXJuIFsuLi5zdHJva2VzLCBvcC5zdHJva2VdO1xuICAgIHJldHVybiBzdHJva2VzO1xuICB9O1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICd3aGl0ZWJvYXJkJykgcmV0dXJuO1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoV2IgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT13aGl0ZWJvYXJkJnNhdUlkPSR7d2JWZXJzaW9uUmVmLmN1cnJlbnR9YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2spIHtcbiAgICAgICAgICBjb25zdCBvcHMgPSBBcnJheS5pc0FycmF5KGQucGF5bG9hZD8ub3BzKSA/IGQucGF5bG9hZC5vcHMgOiBbXTtcbiAgICAgICAgICBpZiAob3BzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gTlx1MUVCRnUgY1x1MDBGMyBvcCAnY2xlYXInIHRyb25nIGxvXHUxRUExdCBtXHUxRURCaSBcdTIxOTIgYnVpbGQgbFx1MUVBMWkgdFx1MUVFQiBcdTAxMTFcdTFFQTd1IGNobyBjaFx1MUVBRmNcbiAgICAgICAgICAgIGlmIChvcHMuc29tZShvID0+IG8udHlwZSA9PT0gJ2NsZWFyJykpIHtcbiAgICAgICAgICAgICAgY29uc3QgZnVsbCA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPXdoaXRlYm9hcmQmc2F1SWQ9MGApO1xuICAgICAgICAgICAgICBjb25zdCBkZiA9IGF3YWl0IGZ1bGwuanNvbigpO1xuICAgICAgICAgICAgICBpZiAoYWN0aXZlICYmIGRmLm9rKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsT3BzID0gQXJyYXkuaXNBcnJheShkZi5wYXlsb2FkPy5vcHMpID8gZGYucGF5bG9hZC5vcHMgOiBbXTtcbiAgICAgICAgICAgICAgICBjb25zdCByZWJ1aWx0ID0gYWxsT3BzLnJlZHVjZShhcER1bmdPcCwgW10pO1xuICAgICAgICAgICAgICAgIHNldFdiU3Ryb2tlcyhyZWJ1aWx0KTtcbiAgICAgICAgICAgICAgICByZWRyYXdDYW52YXMocmVidWlsdCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNldFdiU3Ryb2tlcyhwcmV2ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gb3BzLnJlZHVjZShhcER1bmdPcCwgcHJldik7XG4gICAgICAgICAgICAgICAgcmVkcmF3Q2FudmFzKG5leHQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgd2JWZXJzaW9uUmVmLmN1cnJlbnQgPSBkLnZlcnNpb24gfHwgMDtcbiAgICAgICAgICBzZXRXYkNhbldyaXRlKGQuY2FuV3JpdGUgIT09IGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RpdmUgJiYgZC5jb2RlID09PSAnY2FwYWJpbGl0eV9vZmYnKSB7XG4gICAgICAgICAgc2V0V2JDYW5Xcml0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIGZldGNoV2IoKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGtoaUhpZW5UaGkoZmV0Y2hXYiksIDMwMDApO1xuICAgIHJldHVybiAoKSA9PiB7IGFjdGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludGVydmFsKTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiLCByZWRyYXdDYW52YXNdKTtcblxuICBjb25zdCBzdGFydERyYXdpbmcgPSAoZSkgPT4ge1xuICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgIGlmICghY2FudmFzKSByZXR1cm47XG4gICAgY29uc3QgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBjbGllbnRYID0gZS5jbGllbnRYID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRYKTtcbiAgICBjb25zdCBjbGllbnRZID0gZS5jbGllbnRZID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRZKTtcbiAgICBjb25zdCB4ID0gY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICBjb25zdCB5ID0gY2xpZW50WSAtIHJlY3QudG9wO1xuICAgIGlzRHJhd2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQgPSB7XG4gICAgICB0b29sOiB3YlRvb2wsXG4gICAgICBjb2xvcjogd2JDb2xvcixcbiAgICAgIHdpZHRoOiB3YlRvb2wgPT09ICdlcmFzZXInID8gMTYgOiB3YldpZHRoLFxuICAgICAgcG9pbnRzOiBbeyB4LCB5IH1dXG4gICAgfTtcbiAgfTtcblxuICBjb25zdCBkcmF3TW92ZSA9IChlKSA9PiB7XG4gICAgaWYgKCFpc0RyYXdpbmdSZWYuY3VycmVudCB8fCAhY3VycmVudFN0cm9rZVJlZi5jdXJyZW50KSByZXR1cm47XG4gICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFjYW52YXMpIHJldHVybjtcbiAgICBjb25zdCByZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGNsaWVudFggPSBlLmNsaWVudFggPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFgpO1xuICAgIGNvbnN0IGNsaWVudFkgPSBlLmNsaWVudFkgPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFkpO1xuICAgIGNvbnN0IHggPSBjbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIGNvbnN0IHkgPSBjbGllbnRZIC0gcmVjdC50b3A7XG4gICAgY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnBvaW50cy5wdXNoKHsgeCwgeSB9KTtcbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnRvb2wgPT09ICdlcmFzZXInID8gJyMwQjBFMTQnIDogY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LmNvbG9yO1xuICAgIGN0eC5saW5lV2lkdGggPSBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQud2lkdGg7XG4gICAgY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuICAgIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgY29uc3QgcHRzID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnBvaW50cztcbiAgICBpZiAocHRzLmxlbmd0aCA+PSAyKSB7XG4gICAgICBjdHgubW92ZVRvKHB0c1twdHMubGVuZ3RoIC0gMl0ueCwgcHRzW3B0cy5sZW5ndGggLSAyXS55KTtcbiAgICAgIGN0eC5saW5lVG8ocHRzW3B0cy5sZW5ndGggLSAxXS54LCBwdHNbcHRzLmxlbmd0aCAtIDFdLnkpO1xuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBzdG9wRHJhd2luZyA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIWlzRHJhd2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgaXNEcmF3aW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFN0cm9rZVJlZi5jdXJyZW50ICYmIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5wb2ludHMubGVuZ3RoID4gMSkge1xuICAgICAgY29uc3Qgc3Ryb2tlID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50O1xuICAgICAgY29uc3QgbmV4dFN0cm9rZXMgPSBbLi4ud2JTdHJva2VzLCBzdHJva2VdO1xuICAgICAgc2V0V2JTdHJva2VzKG5leHRTdHJva2VzKTtcbiAgICAgIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICByZXNvdXJjZTogJ3doaXRlYm9hcmQnLFxuICAgICAgICAgICAgcGF5bG9hZDogeyB0eXBlOiAnc3Ryb2tlJywgc3Ryb2tlIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChkLm9rICYmIGQuaWQpIHdiVmVyc2lvblJlZi5jdXJyZW50ID0gTWF0aC5tYXgod2JWZXJzaW9uUmVmLmN1cnJlbnQsIGQuaWQpO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH1cbiAgfTtcblxuICBjb25zdCBjbGVhcldoaXRlYm9hcmQgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFjb25maXJtKCdCXHUxRUExbiBjXHUwMEYzIGNoXHUxRUFGYyBtdVx1MUVEMW4geFx1MDBGM2Egc1x1MUVBMWNoIGJcdTFFQTNuZyB2XHUxRUJEPyAoY2hcdTFFQzkgcXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcpJykpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICByZXNvdXJjZTogJ3doaXRlYm9hcmQnLFxuICAgICAgICAgIHBheWxvYWQ6IHsgdHlwZTogJ2NsZWFyJyB9XG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHtcbiAgICAgICAgc2V0V2JTdHJva2VzKFtdKTtcbiAgICAgICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgICAgIGlmIChjYW52YXMpIHtcbiAgICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gNC4gU2hhcmVkIFNoZWV0IFN0YXRlICg4IGNvbHMgeCAxMCByb3dzKSBcdTIwMTQgdXBzZXJ0IHRcdTFFRUJuZyBcdTAwRjQsIGtoXHUwMEY0bmcgd2hvbGUtZG9jIGNvbmZsaWN0XG4gIGNvbnN0IENPTFMgPSBbJ0EnLCAnQicsICdDJywgJ0QnLCAnRScsICdGJywgJ0cnLCAnSCddO1xuICBjb25zdCBST1dTID0gWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwXTtcbiAgY29uc3QgW3NoZWV0Q2VsbHMsIHNldFNoZWV0Q2VsbHNdID0gUmVhY3QudXNlU3RhdGUoe30pO1xuICBjb25zdCBbc2hlZXRDYW5Xcml0ZSwgc2V0U2hlZXRDYW5Xcml0ZV0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3Qgc2hlZXRTYXZlVGltZXJzUmVmID0gUmVhY3QudXNlUmVmKHt9KTtcbiAgY29uc3Qgc2hlZXRGb2N1c2VkQ2VsbFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgc2hlZXRQb2xsUmVmID0gUmVhY3QudXNlUmVmKDApO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICdzaGVldCcpIHJldHVybjtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaFNoZWV0ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mcmVzb3VyY2U9c2hlZXRgKTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChhY3RpdmUgJiYgZC5vaykge1xuICAgICAgICAgIGNvbnN0IGluY29taW5nID0gZC5wYXlsb2FkPy5jZWxscyB8fCB7fTtcbiAgICAgICAgICAvLyBLaFx1MDBGNG5nIGdoaSBcdTAxMTFcdTAwRTggXHUwMEY0IFx1MDExMWFuZyBnXHUwMEY1IGRcdTFFREZcbiAgICAgICAgICBzZXRTaGVldENlbGxzKHByZXYgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWVyZ2VkID0geyAuLi5pbmNvbWluZyB9O1xuICAgICAgICAgICAgY29uc3QgZGFuZ0dvID0gc2hlZXRGb2N1c2VkQ2VsbFJlZi5jdXJyZW50O1xuICAgICAgICAgICAgaWYgKGRhbmdHbyAmJiBwcmV2W2RhbmdHb10gIT09IHVuZGVmaW5lZCkgbWVyZ2VkW2RhbmdHb10gPSBwcmV2W2RhbmdHb107XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHNldFNoZWV0Q2FuV3JpdGUoZC5jYW5Xcml0ZSAhPT0gZmFsc2UpO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGl2ZSAmJiBkLmNvZGUgPT09ICdjYXBhYmlsaXR5X29mZicpIHtcbiAgICAgICAgICBzZXRTaGVldENhbldyaXRlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7fVxuICAgIH07XG4gICAgZmV0Y2hTaGVldCgpO1xuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaShmZXRjaFNoZWV0KSwgMzAwMCk7XG4gICAgcmV0dXJuICgpID0+IHsgYWN0aXZlID0gZmFsc2U7IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpOyB9O1xuICB9LCBbcGhvbmcuaWQsIGRvY2tUYWJdKTtcblxuICBjb25zdCBoYW5kbGVDZWxsQ2hhbmdlID0gKGNlbGxLZXksIHZhbCkgPT4ge1xuICAgIHNldFNoZWV0Q2VsbHMocHJldiA9PiAoeyAuLi5wcmV2LCBbY2VsbEtleV06IHZhbCB9KSk7XG4gICAgY29uc3QgdGltZXJzID0gc2hlZXRTYXZlVGltZXJzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKHRpbWVyc1tjZWxsS2V5XSkgY2xlYXJUaW1lb3V0KHRpbWVyc1tjZWxsS2V5XSk7XG4gICAgdGltZXJzW2NlbGxLZXldID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICByZXNvdXJjZTogJ3NoZWV0JyxcbiAgICAgICAgICAgIHBheWxvYWQ6IHsgY2VsbDogY2VsbEtleSwgdmFsdWU6IHZhbCB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfSwgODAwKTtcbiAgfTtcblxuICAvLyA1LiAxLXRvLTEgV2ViUlRDIFZvaWNlIENoYXQgXHUyMDE0IHBhaXItYm91bmQgKHRcdTFFRDFpIFx1MDExMWEgMSBjXHUxRUI3cC9waFx1MDBGMm5nLCBzaWduYWxpbmcgcmlcdTAwRUFuZyB0XHUwMUIwKVxuICBjb25zdCBbdm9pY2VKb2luZWQsIHNldFZvaWNlSm9pbmVkXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW21pY011dGVkLCBzZXRNaWNNdXRlZF0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTsgLy8gRGVmYXVsdCBPRkZcbiAgY29uc3QgW3ZvaWNlU3RhdGUsIHNldFZvaWNlU3RhdGVdID0gUmVhY3QudXNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICBjb25zdCBbdm9pY2VOb3RpY2UsIHNldFZvaWNlTm90aWNlXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3ZvaWNlUGFpciwgc2V0Vm9pY2VQYWlyXSA9IFJlYWN0LnVzZVN0YXRlKG51bGwpOyAgICAgICAvLyB7YWN0aXZlLCBhVGVuLCBiVGVuLCB5b3VJbiwgc2xvdH1cbiAgY29uc3QgW3ZvaWNlUmVxdWVzdGVkLCBzZXRWb2ljZVJlcXVlc3RlZF0gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFt5ZXVDYXVWb2ljZSwgc2V0WWV1Q2F1Vm9pY2VdID0gUmVhY3QudXNlU3RhdGUoW10pOyAgICAgLy8gc3RhZmY6IGRhbmggc1x1MDBFMWNoIHhpbiBxdXlcdTFFQzFuXG4gIGNvbnN0IHBjUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBsb2NhbFN0cmVhbVJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgcmVtb3RlQXVkaW9SZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGxhc3RTaWduYWxJZFJlZiA9IFJlYWN0LnVzZVJlZigwKTtcbiAgY29uc3Qgdm9pY2VQb2xsVGltZXJSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHZvaWNlU2xvdFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgdm9pY2VKb2luZWRSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBwZW5kaW5nQ2FuZGlkYXRlc1JlZiA9IFJlYWN0LnVzZVJlZihbXSk7XG4gIHZvaWNlSm9pbmVkUmVmLmN1cnJlbnQgPSB2b2ljZUpvaW5lZDtcblxuICBjb25zdCBkdW5nS2V0Tm9pVm9pY2UgPSAoKSA9PiB7XG4gICAgaWYgKGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0VHJhY2tzKCkuZm9yRWFjaCh0ID0+IHQuc3RvcCgpKTtcbiAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAocGNSZWYuY3VycmVudCkge1xuICAgICAgcGNSZWYuY3VycmVudC5jbG9zZSgpO1xuICAgICAgcGNSZWYuY3VycmVudCA9IG51bGw7XG4gICAgfVxuICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQgPSBbXTtcbiAgICBzZXRNaWNNdXRlZCh0cnVlKTtcbiAgfTtcblxuICAvLyBQb2xsIHRyXHUxRUExbmcgdGhcdTAwRTFpIGNcdTFFQjdwICsgdFx1MDBFRG4gaGlcdTFFQzd1IGNcdTFFRTdhIHBhcnRuZXIgKHNlcnZlciBjaFx1MUVDOSB0clx1MUVBMyBzaWduYWwgY1x1MUVFN2EgbmdcdTAxQjBcdTFFRERpIHRyb25nIGNcdTFFQjdwKS5cbiAgY29uc3QgcG9sbFZvaWNlID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZhY3Rpb249dm9pY2VfcG9sbCZzYXVJZD0ke2xhc3RTaWduYWxJZFJlZi5jdXJyZW50fWApO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoIWQub2spIHJldHVybjtcbiAgICAgIGlmIChkLnBhaXIpIHNldFZvaWNlUGFpcihkLnBhaXIpO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZC55ZXVDYXVWb2ljZSkpIHNldFlldUNhdVZvaWNlKGQueWV1Q2F1Vm9pY2UpO1xuICAgICAgY29uc3QgcGMgPSBwY1JlZi5jdXJyZW50O1xuICAgICAgaWYgKCF2b2ljZUpvaW5lZFJlZi5jdXJyZW50IHx8ICFwYykgcmV0dXJuO1xuICAgICAgZm9yIChjb25zdCBzaWcgb2YgZC5zaWduYWxzIHx8IFtdKSB7XG4gICAgICAgIGxhc3RTaWduYWxJZFJlZi5jdXJyZW50ID0gTWF0aC5tYXgobGFzdFNpZ25hbElkUmVmLmN1cnJlbnQsIHNpZy5pZCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnb2ZmZXInKSB7XG4gICAgICAgICAgICAvLyBPZmZlciBtXHUxRURCaSBob1x1MUVCN2MgcmUtb2ZmZXIgKFx1MDExMVx1MUVEMWkgcGhcdTAxQjBcdTAxQTFuZyBiXHUxRUFEdCBtaWMgbXVcdTFFRDluKSBcdTAxMTFcdTFFQzF1IHNldCBsXHUxRUExaSByZW1vdGUgKyB0clx1MUVBMyBhbnN3ZXIuXG4gICAgICAgICAgICBhd2FpdCBwYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKHNpZy5wYXlsb2FkKSk7XG4gICAgICAgICAgICAvLyBYXHUxRUEzIGNcdTAwRTFjIGNhbmRpZGF0ZSB0XHUxRURCaSBzXHUxRURCbSB0clx1MDFCMFx1MUVEQmMga2hpIGNcdTAwRjMgcmVtb3RlRGVzY3JpcHRpb24uXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGMgb2YgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICBhd2FpdCBwYy5hZGRJY2VDYW5kaWRhdGUobmV3IFJUQ0ljZUNhbmRpZGF0ZShjKSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCA9IFtdO1xuICAgICAgICAgICAgY29uc3QgYW5zID0gYXdhaXQgcGMuY3JlYXRlQW5zd2VyKCk7XG4gICAgICAgICAgICBhd2FpdCBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKGFucyk7XG4gICAgICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ2Fuc3dlcicsIHBheWxvYWQ6IGFucyB9KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ2Fuc3dlcicpIHtcbiAgICAgICAgICAgIGlmIChwYy5zaWduYWxpbmdTdGF0ZSA9PT0gJ2hhdmUtbG9jYWwtb2ZmZXInKSB7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLnNldFJlbW90ZURlc2NyaXB0aW9uKG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24oc2lnLnBheWxvYWQpKTtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBjIG9mIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwYy5hZGRJY2VDYW5kaWRhdGUobmV3IFJUQ0ljZUNhbmRpZGF0ZShjKSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnY2FuZGlkYXRlJykge1xuICAgICAgICAgICAgaWYgKHBjLnJlbW90ZURlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLmFkZEljZUNhbmRpZGF0ZShuZXcgUlRDSWNlQ2FuZGlkYXRlKHNpZy5wYXlsb2FkKSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudC5wdXNoKHNpZy5wYXlsb2FkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnbGVhdmUnKSB7XG4gICAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnTmdcdTAxQjBcdTFFRERpIGtpYSBcdTAxMTFcdTAwRTMgbmdcdTFFQUZ0IHZvaWNlLicpO1xuICAgICAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgICAgICAgICBkdW5nS2V0Tm9pVm9pY2UoKTtcbiAgICAgICAgICAgIHNldFZvaWNlSm9pbmVkKGZhbHNlKTtcbiAgICAgICAgICAgIHZvaWNlU2xvdFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggeyAvKiBiXHUxRUNGIHF1YSBzaWduYWwgbFx1MUVEN2kgKi8gfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICAvLyBQb2xsIGNoXHUxRUExeSBraGkgdGFiIHZvaWNlIG1cdTFFREYgKHhlbSB0clx1MUVBMW5nIHRoXHUwMEUxaSBjXHUxRUI3cCkgaG9cdTFFQjdjIFx1MDExMWFuZyB0cm9uZyBjXHUxRUI3cC5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiAhPT0gJ3ZvaWNlJyAmJiAhdm9pY2VKb2luZWQpIHJldHVybjtcbiAgICBwb2xsVm9pY2UoKTtcbiAgICB2b2ljZVBvbGxUaW1lclJlZi5jdXJyZW50ID0gc2V0SW50ZXJ2YWwocG9sbFZvaWNlLCAxNTAwKTtcbiAgICByZXR1cm4gKCkgPT4geyBpZiAodm9pY2VQb2xsVGltZXJSZWYuY3VycmVudCkgY2xlYXJJbnRlcnZhbCh2b2ljZVBvbGxUaW1lclJlZi5jdXJyZW50KTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiLCB2b2ljZUpvaW5lZF0pO1xuXG4gIGNvbnN0IGpvaW5Wb2ljZSA9IGFzeW5jICgpID0+IHtcbiAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwYW5nIHhpbiBjaFx1MUVENyB0cm9uZyBjXHUxRUI3cCB2b2ljZS4uLicpO1xuICAgIHNldFZvaWNlU3RhdGUoJ2Nvbm5lY3RpbmcnKTtcbiAgICB0cnkge1xuICAgICAgLy8gMS4gR2lcdTAwRTBuaCBzbG90IHRyXHUwMEVBbiBzZXJ2ZXIgdHJcdTAxQjBcdTFFREJjIChzZXJ2ZXItYXV0aG9yaXRhdGl2ZTogdFx1MUVEMWkgXHUwMTExYSAxIGNcdTFFQjdwIDEtMS9waFx1MDBGMm5nKVxuICAgICAgY29uc3Qgam9pblJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9qb2luJyB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBqb2luRGF0YSA9IGF3YWl0IGpvaW5SZXMuanNvbigpO1xuICAgICAgaWYgKCFqb2luRGF0YS5vaykge1xuICAgICAgICBpZiAoam9pbkRhdGEuY29kZSA9PT0gJ2dyYW50X3JlcXVpcmVkJykge1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdCXHUxRUExbiBjXHUxRUE3biBcdTAxMTFcdTAxQjBcdTFFRTNjIGNcdTFFQTVwIHF1eVx1MUVDMW4gdm9pY2UgXHUyMDE0IGhcdTAwRTN5IGJcdTFFQTVtIFwiWGluIHF1eVx1MUVDMW4gdm9pY2VcIi4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZShqb2luRGF0YS5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgdGhhbSBnaWEgdm9pY2UuJyk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZvaWNlU2xvdFJlZi5jdXJyZW50ID0gam9pbkRhdGEuc2xvdDtcbiAgICAgIHNldFZvaWNlSm9pbmVkKHRydWUpO1xuXG4gICAgICAvLyAyLiBYaW4gbWljIFRSXHUwMUFGXHUxRURBQyBraGkgdFx1MUVBMW8gb2ZmZXIgXHUyMDE0IHRyYWNrIHBoXHUxRUEzaSBjXHUwMEYzIHNcdTFFQjVuIHRyb25nIFNEUCBuZWdvdGlhdGlvbixcbiAgICAgIC8vICAgIGFkZFRyYWNrIHNhdSBraGkgXHUwMTExXHUwMEUzIGJcdTFFQUZ0IHRheSBtXHUwMEUwIGtoXHUwMEY0bmcgcmVuZWdvdGlhdGUgXHUyMTkyIG5nXHUwMUIwXHUxRUREaSBraWEga2hcdTAwRjRuZyBuZ2hlIFx1MDExMVx1MDFCMFx1MUVFM2MuXG4gICAgICAvLyAgICBNaWMga2hcdTFFREZpIFx1MDExMVx1MUVBN3UgbXV0ZWQgKGVuYWJsZWQ9ZmFsc2UpIFx1MjAxNCB1c2VyIHRcdTFFRjEgYlx1MUVBRHQgYlx1MUVCMW5nIG5cdTAwRkF0IE1pYy5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgYXVkaW86IHRydWUsIHZpZGVvOiBmYWxzZSB9KTtcbiAgICAgICAgc3RyZWFtLmdldEF1ZGlvVHJhY2tzKCkuZm9yRWFjaCh0ID0+IHsgdC5lbmFibGVkID0gZmFsc2U7IH0pO1xuICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50ID0gc3RyZWFtO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdLaFx1MDBGNG5nIHhpbiBcdTAxMTFcdTAxQjBcdTFFRTNjIG1pY3JvIFx1MjAxNCBiXHUxRUExbiBjaFx1MUVDOSBuZ2hlIFx1MDExMVx1MDFCMFx1MUVFM2MsIGtoXHUwMEY0bmcgblx1MDBGM2kgXHUwMTExXHUwMUIwXHUxRUUzYy4nKTtcbiAgICAgIH1cblxuICAgICAgLy8gMy4gVFx1MUVBMW8gcGVlciBjb25uZWN0aW9uXG4gICAgICBjb25zdCBwYyA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbih7XG4gICAgICAgIGljZVNlcnZlcnM6IFt7IHVybHM6ICdzdHVuOnN0dW4ubC5nb29nbGUuY29tOjE5MzAyJyB9XVxuICAgICAgfSk7XG4gICAgICBwY1JlZi5jdXJyZW50ID0gcGM7XG4gICAgICBpZiAobG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldFRyYWNrcygpLmZvckVhY2godCA9PiBwYy5hZGRUcmFjayh0LCBsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSk7XG4gICAgICB9XG5cbiAgICAgIHBjLm9uaWNlY2FuZGlkYXRlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5jYW5kaWRhdGUpIHtcbiAgICAgICAgICBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICAgICAgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJyxcbiAgICAgICAgICAgICAgc2lnbmFsVHlwZTogJ2NhbmRpZGF0ZScsXG4gICAgICAgICAgICAgIHBheWxvYWQ6IGV2ZW50LmNhbmRpZGF0ZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHBjLm9udHJhY2sgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKHJlbW90ZUF1ZGlvUmVmLmN1cnJlbnQgJiYgZXZlbnQuc3RyZWFtc1swXSkge1xuICAgICAgICAgIHJlbW90ZUF1ZGlvUmVmLmN1cnJlbnQuc3JjT2JqZWN0ID0gZXZlbnQuc3RyZWFtc1swXTtcbiAgICAgICAgICByZW1vdGVBdWRpb1JlZi5jdXJyZW50LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHBjLm9uY29ubmVjdGlvbnN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBzID0gcGMuY29ubmVjdGlvblN0YXRlO1xuICAgICAgICBpZiAocyA9PT0gJ2Nvbm5lY3RlZCcpIHtcbiAgICAgICAgICBzZXRWb2ljZVN0YXRlKCdjb25uZWN0ZWQnKTtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnXHUyNzEzIFx1MDExMGFuZyBrXHUxRUJGdCBuXHUxRUQxaSB0aG9cdTFFQTFpIDEtMSB0clx1MUVGMWMgdGlcdTFFQkZwLicpO1xuICAgICAgICB9IGVsc2UgaWYgKHMgPT09ICdmYWlsZWQnIHx8IHMgPT09ICdkaXNjb25uZWN0ZWQnKSB7XG4gICAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIHRob1x1MUVBMWkgKG1cdTFFQTFuZyBjaFx1MUVCN24gUDJQIG5cdTFFQkZ1IGtoXHUwMEY0bmcgY1x1MDBGMyBUVVJOKS4nKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgLy8gNC4gU2xvdCAnYicgKG5nXHUwMUIwXHUxRUREaSB2XHUwMEUwbyBzYXUpIHRcdTFFQTFvIG9mZmVyOyBzbG90ICdhJyBjaFx1MUVERCBvZmZlciB0XHUxRUVCIHBvbGwuXG4gICAgICBpZiAoam9pbkRhdGEuc2xvdCA9PT0gJ2InKSB7XG4gICAgICAgIGNvbnN0IG9mZmVyID0gYXdhaXQgcGMuY3JlYXRlT2ZmZXIoKTtcbiAgICAgICAgYXdhaXQgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihvZmZlcik7XG4gICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnb2ZmZXInLCBwYXlsb2FkOiBvZmZlciB9KVxuICAgICAgICB9KTtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMFx1MDBFMyB2XHUwMEUwbyBjXHUxRUI3cCBcdTIwMTQgXHUwMTExYW5nIGJcdTFFQUZ0IHRheSB2XHUxRURCaSAnICsgKHZvaWNlUGFpcj8uYVRlbiB8fCAnbmdcdTAxQjBcdTFFRERpIGtpYScpICsgJ1x1MjAyNicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0JcdTFFQTFuIGxcdTAwRTAgbmdcdTAxQjBcdTFFRERpIFx1MDExMVx1MUVBN3UgdGlcdTAwRUFuIFx1MjAxNCBjaFx1MUVERCB0aFx1MDBFQW0gMSBuZ1x1MDFCMFx1MUVERGkgdlx1MDBFMG8gdm9pY2VcdTIwMjYnKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHNldFZvaWNlTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSB2b2ljZTogJyArIGVyci5tZXNzYWdlKTtcbiAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB4aW5RdXllblZvaWNlID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2VfcmVxdWVzdCcgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vayAmJiBkLmdyYW50ZWQpIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0JcdTFFQTFuIFx1MDExMVx1MDBFMyBcdTAxMTFcdTAxQjBcdTFFRTNjIHBoXHUwMEU5cCB2b2ljZSBcdTIwMTQgYlx1MUVBNW0gVGhhbSBnaWEuJyk7XG4gICAgICB9IGVsc2UgaWYgKGQub2spIHtcbiAgICAgICAgc2V0Vm9pY2VSZXF1ZXN0ZWQodHJ1ZSk7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBcdTAwRTMgZ1x1MUVFRGkgeVx1MDBFQXUgY1x1MUVBN3UgXHUyMDE0IGNoXHUxRUREIHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nIGR1eVx1MUVDN3QuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRWb2ljZU5vdGljZShkLmxvaSB8fCAnS2hcdTAwRjRuZyBnXHUxRUVEaSBcdTAxMTFcdTAxQjBcdTFFRTNjIHlcdTAwRUF1IGNcdTFFQTd1LicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggeyBzZXRWb2ljZU5vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkuJyk7IH1cbiAgfTtcblxuICBjb25zdCBuZ2F0Vm9pY2VDYXAgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFjb25maXJtKCdOZ1x1MUVBRnQgY1x1MUVCN3Agdm9pY2UgXHUwMTExYW5nIGhvXHUxRUExdCBcdTAxMTFcdTFFRDluZz8nKSkgcmV0dXJuO1xuICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9lbmQnIH0pXG4gICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgIHBvbGxWb2ljZSgpO1xuICB9O1xuXG4gIGNvbnN0IHRvZ2dsZU1pYyA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAobWljTXV0ZWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICghbG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgICAgIC8vIE1pYyBiXHUxRUNCIHRcdTFFRUIgY2hcdTFFRDFpIGxcdTAwRkFjIGpvaW4gXHUyMTkyIHhpbiBsXHUxRUExaTsgYWRkVHJhY2sgbXVcdTFFRDluIGNcdTFFQTduIHJlbmVnb3RpYXRlIChvZmZlciBtXHUxRURCaSkuXG4gICAgICAgICAgY29uc3Qgc3RyZWFtID0gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoeyBhdWRpbzogdHJ1ZSwgdmlkZW86IGZhbHNlIH0pO1xuICAgICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQgPSBzdHJlYW07XG4gICAgICAgICAgY29uc3QgcGMgPSBwY1JlZi5jdXJyZW50O1xuICAgICAgICAgIGlmIChwYykge1xuICAgICAgICAgICAgc3RyZWFtLmdldFRyYWNrcygpLmZvckVhY2godHJhY2sgPT4gcGMuYWRkVHJhY2sodHJhY2ssIHN0cmVhbSkpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3Qgb2ZmZXIgPSBhd2FpdCBwYy5jcmVhdGVPZmZlcigpO1xuICAgICAgICAgICAgICBhd2FpdCBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcbiAgICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdvZmZlcicsIHBheWxvYWQ6IG9mZmVyIH0pXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIHJlbmVnb3RpYXRpb24gdGhcdTFFQTV0IGJcdTFFQTFpIFx1MjAxNCBuZ2hlIHZcdTFFQUJuIFx1MDExMVx1MDFCMFx1MUVFM2MgKi8gfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldEF1ZGlvVHJhY2tzKCkuZm9yRWFjaCh0ID0+IHsgdC5lbmFibGVkID0gdHJ1ZTsgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0TWljTXV0ZWQoZmFsc2UpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGFsZXJ0KCdLaFx1MDBGNG5nIHRoXHUxRUMzIG1cdTFFREYgbWljcm86ICcgKyBlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0QXVkaW9UcmFja3MoKS5mb3JFYWNoKHQgPT4geyB0LmVuYWJsZWQgPSBmYWxzZTsgfSk7XG4gICAgICB9XG4gICAgICBzZXRNaWNNdXRlZCh0cnVlKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgbGVhdmVWb2ljZSA9ICgpID0+IHtcbiAgICBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ2xlYXZlJywgcGF5bG9hZDoge30gfSlcbiAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgZHVuZ0tldE5vaVZvaWNlKCk7XG4gICAgc2V0Vm9pY2VKb2luZWQoZmFsc2UpO1xuICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgIHZvaWNlU2xvdFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwXHUwMEUzIG5nXHUxRUFGdCB2b2ljZS4nKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgaWQ9XCJzdHVkeS1kb2NrLWNvbnRhaW5lclwiIHN0eWxlPXt7IG92ZXJmbG93QW5jaG9yOiAnbm9uZScgfX0gY2xhc3NOYW1lPXtgYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMTYxYjI2XSB0by1bIzBmMTQxZF0gYm9yZGVyIGJvcmRlci13aGl0ZS9bMC4wOF0gcm91bmRlZC0yeGwgcC00IGZsZXggZmxleC1jb2wgc2hhZG93LXhsICR7aXNSb29tV2lkZSA/ICdtaW4taC1bY2FsYygxMDB2aC0xNjBweCldIGgtZnVsbCBmbGV4LTEnIDogJ2gtWzYyMHB4XSBsZzpoLVs2ODBweF0nfWB9PlxuICAgICAgey8qIFN0dWR5IERvY2sgVGFiIE5hdmlnYXRpb24gXHUyMDE0IEdcdTFFQ0RuIGdcdTAwRTBuZywgdGhcdTFFQTltIG1cdTFFRjksIG5cdTAwRkF0IG5cdTFFRDVpIGJcdTFFQUR0ICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgcGItMyBib3JkZXItYiBib3JkZXItd2hpdGUvMTAgZmxleC13cmFwIHNocmluay0wXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZmxleC13cmFwXCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktY2hhdFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ2NoYXQnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdjaGF0J1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0FDPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Q2hhdCBwaFx1MDBGMm5nPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LW5vdGVzXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignbm90ZXMnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdub3RlcydcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENERDwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkdoaSBjaFx1MDBGQTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS13aGl0ZWJvYXJkXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignd2hpdGVib2FyZCcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3doaXRlYm9hcmQnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGQTg8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5CXHUxRUEzbmcgdlx1MUVCRDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1zaGVldFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3NoZWV0Jyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnc2hlZXQnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQ0E8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5CXHUxRUEzbmcgdFx1MDBFRG5oPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LXZvaWNlXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYigndm9pY2UnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICd2b2ljZSdcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLWFtYmVyLTUwMCB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgyNTEsMTkxLDM2LDAuMzUpXSBib3JkZXIgYm9yZGVyLWFtYmVyLTQwMC81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGOTlcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5Wb2ljZSAoMS0xKTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1tZW1iZXJzXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignbWVtYmVycycpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ21lbWJlcnMnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLWVtZXJhbGQtNDAwIHRvLXRlYWwtNTAwIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDUyLDIxMSwxNTMsMC4zNSldIGJvcmRlciBib3JkZXItZW1lcmFsZC00MDAvNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQzY1PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+VGhcdTAwRTBuaCB2aVx1MDBFQW57dGhhbmhWaWVuLmxlbmd0aCA+IDAgPyBgICgke3RoYW5oVmllbi5sZW5ndGh9KWAgOiAnJ308L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICB7aXNTdGFmZiAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LXF1YW4tdHJpXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3F1YW4tdHJpJyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3F1YW4tdHJpJ1xuICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLXZpb2xldC01MDAgdG8tcHVycGxlLTUwMCB0ZXh0LXdoaXRlIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgxMzksOTIsMjQ2LDAuMzUpXSBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvNTAnXG4gICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNjk5XHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5RdXlcdTFFQzFuPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIERvY2sgQ29udGVudCBCb2R5ICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBwdC0zIG1pbi1oLTAgaC1mdWxsIG92ZXJmbG93LWhpZGRlblwiPlxuICAgICAgICB7LyogVEFCIDE6IENIQVQgUEhcdTAwRDJORyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdjaGF0JyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBtaW4taC0wIGgtZnVsbFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHNwYWNlLXktMyBwci0xIG1pbi1oLTAgdGV4dC14c1wiPlxuICAgICAgICAgICAgICB7cGhvbmdDaGF0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCB0ZXh0LWNlbnRlciBweS04XCI+Q2hcdTAxQjBhIGNcdTAwRjMgdGluIG5oXHUxRUFGbiBcdTIwMTQgaFx1MDBFM3kgZ1x1MUVFRGkgY1x1MDBFMnUgaFx1MUVDRmkgaG9cdTFFQjdjIHRyYW8gXHUwMTExXHUxRUQ1aSB2XHUxRUMxIGJcdTAwRTBpIGdpXHUxRUEzbmchPC9wPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIHBob25nQ2hhdC5tYXAoKG0sIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgbXlOYW1lID0gU3RyaW5nKGF1dGg/LnVzZXI/LmhvVGVuIHx8IGF1dGg/LnVzZXI/Lm5hbWUgfHwgYXV0aD8udXNlcj8udGVuIHx8ICcnKS50cmltKCk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUNoaW5oTWluaCA9IEJvb2xlYW4oXG4gICAgICAgICAgICAgICAgICAgIG0uY3VhVG9pIHx8XG4gICAgICAgICAgICAgICAgICAgIChtLmtob2EgJiYgcGhvbmdNaW5oS2hvYSAmJiBtLmtob2EgPT09IHBob25nTWluaEtob2EpIHx8XG4gICAgICAgICAgICAgICAgICAgIChteU5hbWUgJiYgbS50ZW5OZ3VvaUd1aSAmJiBtLnRlbk5ndW9pR3VpLnRyaW0oKS50b0xvd2VyQ2FzZSgpID09PSBteU5hbWUudG9Mb3dlckNhc2UoKSlcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBjb25zdCB0aW1lU3RyID0gbS50YW9MdWMgPyBuZXcgRGF0ZShtLnRhb0x1Yy5yZXBsYWNlKCcgJywgJ1QnKSArIChtLnRhb0x1Yy5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JyB9KSA6ICcnO1xuXG4gICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAga2V5PXttLmlkIHx8IGlkeH1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGZsZXgtY29sIGdyb3VwIHctZnVsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFDaGluaE1pbmggPyAnaXRlbXMtZW5kJyA6ICdpdGVtcy1zdGFydCdcbiAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgey8qIEhlYWRlciB0aFx1MDBGNG5nIHRpbiBuZ1x1MDFCMFx1MUVERGkgZ1x1MUVFRGkgKi99XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IG1iLTEgdGV4dC1bMTFweF0gJHtsYUNoaW5oTWluaCA/ICdmbGV4LXJvdy1yZXZlcnNlJyA6ICcnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgZm9udC1leHRyYWJvbGQgJHtsYUNoaW5oTWluaCA/ICd0ZXh0LVsjMDBGMkZFXScgOiAndGV4dC1zbGF0ZS0yMDAnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7bS50ZW5OZ3VvaUd1aX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUNoaW5oTWluaCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIHNoYWRvdy1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJcdTFFQTFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICB7bS52YWlUcm8gPT09ICdnaWFvX3ZpZW4nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdWQ05cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IG0ubG9wVGVuID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzIwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge20ubG9wVGVufVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7dGltZVN0cn1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiWG9cdTAwRTEgdGluIG5oXHUxRUFGbiBuXHUwMEUweSAocXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jaGF0P3Bob25nSWQ9JHtwaG9uZy5pZH0maWQ9JHttLmlkfWAsIHsgbWV0aG9kOiAnREVMRVRFJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkLm9rICYmIG9uWG9hVGluUGhvbmcpIG9uWG9hVGluUGhvbmcobS5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgKi8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHB4LTEgdGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTUwMCBob3Zlcjp0ZXh0LXJvc2UtNDAwIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIHsvKiBCdWJibGUgdGluIG5oXHUxRUFGbiAqL31cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BtYXgtdy1bODUlXSBzbTptYXgtdy1bNzglXSBweC0zLjUgcHktMiB0ZXh0LXhzIGxlYWRpbmctcmVsYXhlZCBicmVhay13b3JkcyBzaGFkb3ctbWQgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGFDaGluaE1pbmhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdyb3VuZGVkLTJ4bCByb3VuZGVkLXRyLXhzIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwYjRkOF0vMjUgdmlhLVsjMDA3N2I2XS8zMCB0by1bIzAwRjJGRV0vMjAgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgdGV4dC13aGl0ZSBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMTIpXSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdyb3VuZGVkLTJ4bCByb3VuZGVkLXRsLXhzIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOmJvcmRlci13aGl0ZS8yMCB0ZXh0LXNsYXRlLTIwMCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIndoaXRlc3BhY2UtcHJlLXdyYXBcIj57bS5ub2lEdW5nfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIHttLnZpZGVvVGltZVNlYyAhPSBudWxsICYmIG0udmlkZW9UaW1lU2VjID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB5ZXVDYXVUdWEobS52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm10LTEuNSBpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgcHgtMiBweS0wLjUgcm91bmRlZC1sZyB0ZXh0LVsxMHB4XSBmb250LWJsYWNrIGJnLWN5YW4tNDAwLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIGhvdmVyOmJnLVsjMDBGMkZFXS8zMCB0cmFuc2l0aW9uLWFsbCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MjVCNjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj57ZGluaERhbmdHaWF5UGh1dChtLnZpZGVvVGltZVNlYyl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8ZGl2IHJlZj17Y2hhdEVuZFJlZn0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU2VuZFJvb21DaGF0fSBjbGFzc05hbWU9XCJwdC0yIGJvcmRlci10IGJvcmRlci13aGl0ZS84IGZsZXggZmxleC1jb2wgZ2FwLTIgbXQtYXV0byBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICB7LyogRW1vamkgcGFuZWwgKi99XG4gICAgICAgICAgICAgIHtzaG93RW1vamkgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgZ2FwLTEgcC0yIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsXCI+XG4gICAgICAgICAgICAgICAgICB7WydcdUQ4M0RcdURFMEEnLCdcdUQ4M0RcdURFMDInLCdcdUQ4M0VcdURENzAnLCdcdUQ4M0RcdURFMEUnLCdcdUQ4M0VcdUREMTQnLCdcdUQ4M0RcdURFMDUnLCdcdUQ4M0RcdURFMkQnLCdcdUQ4M0RcdUREMjUnLCdcdTI3NjRcdUZFMEYnLCdcdUQ4M0RcdURDNEQnLCdcdUQ4M0RcdURFNEYnLCdcdUQ4M0NcdURGODknLCdcdTI3MDUnLCdcdUQ4M0RcdURDQUYnLCdcdUQ4M0RcdURDNEInLCdcdUQ4M0RcdURDREEnLCdcdTI3MEZcdUZFMEYnLCdcdUQ4M0NcdURGQUYnLCdcdUQ4M0NcdURGMUYnLCdcdUQ4M0RcdURDQTEnLCdcdTI2QTEnLCdcdUQ4M0NcdURGQzYnLCdcdUQ4M0VcdUREMUQnLCdcdUQ4M0RcdURDQUEnLCdcdUQ4M0VcdUREMjknXS5tYXAoZW0gPT4gKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGtleT17ZW19IHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0Q2hhdElucHV0KHYgPT4gdiArIGVtKTsgc2V0U2hvd0Vtb2ppKGZhbHNlKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LWxnIGhvdmVyOnNjYWxlLTEyNSB0cmFuc2l0aW9uLXRyYW5zZm9ybSBhY3RpdmU6c2NhbGUtOTUgcHgtMVwiPntlbX08L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBmbGV4LTFcIj5cbiAgICAgICAgICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgICBpZD1cImlucHV0LXBob25nLWNoYXRcIlxuICAgICAgICAgICAgICAgICAgICByb3dzPXsxfVxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17Y29RdXllbignY2hhdCcpID8gJ05oXHUxRUFGbiB0aW4gcGhcdTAwRjJuZyBoXHUxRUNEYy4uLicgOiAnQ2hhdCBcdTAxMTFhbmcgYlx1MUVDQiBraFx1MDBGM2EnfVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Y2hhdElucHV0fVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNvUXV5ZW4oJ2NoYXQnKX1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Q2hhdElucHV0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0PXsoKSA9PiB7IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ9eygpID0+IHsgY2hhdENvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7IH19XG4gICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInICYmICFlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5uYXRpdmVFdmVudD8uaXNDb21wb3NpbmcgfHwgY2hhdENvbXBvc2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVTZW5kUm9vbUNoYXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17NTAwfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcHgtNCBweS0yLjUgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MCBmb2N1czpzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMCwyNDIsMjU0LDAuMTIpXSByZXNpemUtbm9uZSBtaW4taC1bMzhweF0gbWF4LWgtMjQgZGlzYWJsZWQ6b3BhY2l0eS00MCB0cmFuc2l0aW9uLWFsbFwiXG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHsvKiBFbW9qaSBidXR0b24gKi99XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNvUXV5ZW4oJ2NoYXQnKX1cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNob3dFbW9qaSh2ID0+ICF2KX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctOSBoLTkgcm91bmRlZC0yeGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1iYXNlIHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktMzAgc2hyaW5rLTAgYWN0aXZlOnNjYWxlLTkwICR7XG4gICAgICAgICAgICAgICAgICAgIHNob3dFbW9qaSA/ICdiZy1bIzAwRjJGRV0vMjAgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgdGV4dC1bIzAwRjJGRV0nIDogJ2JnLXdoaXRlLzUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIGhvdmVyOmJnLXdoaXRlLzEwJ1xuICAgICAgICAgICAgICAgICAgfWB9XG4gICAgICAgICAgICAgICAgICB0aXRsZT1cIkNoXHUxRUNEbiBlbW9qaVwiPlxuICAgICAgICAgICAgICAgICAgXHVEODNEXHVERTBBXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgey8qIFNlbmQgYnV0dG9uICovfVxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tc2VuZC1waG9uZy1jaGF0XCJcbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshY2hhdElucHV0LnRyaW0oKSB8fCBjaGF0U2VuZGluZyB8fCAhY29RdXllbignY2hhdCcpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy05IGgtOSByb3VuZGVkLTJ4bCBiZy1ncmFkaWVudC10by1iciBmcm9tLVsjMDBGMkZFXSB0by1bIzNCODJGNl0gdGV4dC1ibGFjayBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktMzAgc2hyaW5rLTAgaG92ZXI6YnJpZ2h0bmVzcy0xMTAgYWN0aXZlOnNjYWxlLTkwIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgwLDI0MiwyNTQsMC4zKV1cIj5cbiAgICAgICAgICAgICAgICAgIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwiY3VycmVudENvbG9yXCIgY2xhc3NOYW1lPVwidy00IGgtNFwiPlxuICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTMuNDc4IDIuNDA1YS43NS43NSAwIDAwLS45MjYuOTRsMi40MzIgNy45MDVIMTMuNWEuNzUuNzUgMCAwMTAgMS41SDQuOTg0bC0yLjQzMiA3LjkwNWEuNzUuNzUgMCAwMC45MjYuOTQgNjAuNTE5IDYwLjUxOSAwIDAwMTguNDQ1LTguOTg2Ljc1Ljc1IDAgMDAwLTEuMjE4QTYwLjUxNyA2MC41MTcgMCAwMDMuNDc4IDIuNDA1elwiIC8+XG4gICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRBQiAyOiBHSEkgQ0hcdTAwREEgQ1x1MUVEOE5HIFRcdTAwQzFDIFx1MjAxNCBlbnRyeSBhcHBlbmQsIGNcdTAwRjMgZ1x1MUVBRm4gbVx1MUVEMWMgdmlkZW8gKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAnbm90ZXMnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0yIG1pbi1oLTAgaC1mdWxsXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICA8c3Bhbj5HaGkgY2hcdTAwRkEgY2h1bmcgY1x1MUVFN2EgcGhcdTAwRjJuZyBcdTIwMTQgbVx1MUVEN2kgbmdcdTAxQjBcdTFFRERpIHRoXHUwMEVBbSBtXHUxRUQ5dCBkXHUwMEYybmcsIGNcdTAwRjMgdGhcdTFFQzMgZ1x1MUVBRm4gbVx1MUVEMWMgdmlkZW88L3NwYW4+XG4gICAgICAgICAgICAgIHtub3Rlc05vdGljZSAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXJvc2UtMzAwIGZvbnQtYm9sZFwiPntub3Rlc05vdGljZX08L3NwYW4+fVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy15LWF1dG8gc3BhY2UteS0yIHByLTEgbWluLWgtMCBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtMi41XCI+XG4gICAgICAgICAgICAgIHtub3Rlc0xpc3QubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwIHRleHQtY2VudGVyIHB5LThcIj5DaFx1MDFCMGEgY1x1MDBGMyBnaGkgY2hcdTAwRkEgXHUyMDE0IHRoXHUwMEVBbSBkXHUwMEYybmcgXHUwMTExXHUxRUE3dSB0aVx1MDBFQW4gY2hvIGNcdTFFQTMgcGhcdTAwRjJuZy48L3A+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgbm90ZXNMaXN0Lm1hcCgobikgPT4gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e24uaWR9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtc3RhcnQgZ2FwLTIgZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgbWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1zbGF0ZS00MDBcIj57bi50ZW59PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge24udmlkZW9UaW1lU2VjICE9IG51bGwgJiYgbi52aWRlb1RpbWVTZWMgPiAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHlldUNhdVR1YShuLnZpZGVvVGltZVNlYyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuMiByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy12aW9sZXQtNTAwLzIwIHRleHQtdmlvbGV0LTMwMCBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvMzAgaG92ZXI6YmctdmlvbGV0LTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNiB7ZGluaERhbmdHaWF5UGh1dChuLnZpZGVvVGltZVNlYyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1zbGF0ZS02MDAgZm9udC1tb25vXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtuLnRhb0x1YyA/IG5ldyBEYXRlKG4udGFvTHVjLnJlcGxhY2UoJyAnLCAnVCcpICsgJ1onKS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JyB9KSA6ICcnfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS0yMDAgbGVhZGluZy1yZWxheGVkIGJyZWFrLXdvcmRzXCI+e24ubm9pRHVuZ308L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICB7KG4uY3VhVG9pIHx8IGlzU3RhZmYpICYmIChcbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHhvYUdoaUNodShuLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiWG9cdTAwRTEgZ2hpIGNoXHUwMEZBXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wYWNpdHktMCBncm91cC1ob3ZlcjpvcGFjaXR5LTEwMCB0ZXh0LXNsYXRlLTUwMCBob3Zlcjp0ZXh0LXJvc2UtNDAwIHRleHQtWzEwcHhdIHB4LTEgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAge25vdGVzQ2FuV3JpdGUgPyAoXG4gICAgICAgICAgICAgIDxmb3JtXG4gICAgICAgICAgICAgICAgb25TdWJtaXQ9e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgaWYgKCFlLm5hdGl2ZUV2ZW50Py5pc0NvbXBvc2luZyAmJiAhbm90ZUNvbXBvc2luZ1JlZi5jdXJyZW50KSB0aGVtR2hpQ2h1KCk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIGlkPVwic3R1ZHktbm90ZS1pbnB1dFwiXG4gICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17bm90ZUlucHV0fVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Tm90ZUlucHV0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25TdGFydD17KCkgPT4geyBub3RlQ29tcG9zaW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgICAgb25Db21wb3NpdGlvbkVuZD17KCkgPT4geyBub3RlQ29tcG9zaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTsgfX1cbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiVGhcdTAwRUFtIGdoaSBjaFx1MDBGQSBjaG8gcGhcdTAwRjJuZy4uLlwiXG4gICAgICAgICAgICAgICAgICBtYXhMZW5ndGg9ezEwMDB9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MCByb3VuZGVkLXhsIHB4LTMgcHktMiB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZVwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldE5vdGVXaXRoVGltZSh2ID0+ICF2KX1cbiAgICAgICAgICAgICAgICAgIHRpdGxlPXtub3RlV2l0aFRpbWUgPyAnXHUwMTEwYW5nIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvIHZcdTAwRTBvIGdoaSBjaFx1MDBGQScgOiAnS2hcdTAwRjRuZyBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbyd9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0yLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke25vdGVXaXRoVGltZSA/ICdiZy12aW9sZXQtNTAwLzIwIHRleHQtdmlvbGV0LTMwMCBib3JkZXItdmlvbGV0LTUwMC80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTUwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgICAgICAgXHUyM0YxXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi1hZGQtbm90ZVwiXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IW5vdGVJbnB1dC50cmltKCl9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgcm91bmRlZC14bCBiZy1bIzAwRjJGRV0gdGV4dC1ibGFjayB0ZXh0LXhzIGZvbnQtYmxhY2sgZGlzYWJsZWQ6b3BhY2l0eS0zMFwiPlxuICAgICAgICAgICAgICAgICAgVGhcdTAwRUFtXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtYW1iZXItMzAwLzgwIHRleHQtY2VudGVyIHB5LTFcIj5cdUQ4M0RcdUREMTIgR2hpIGNoXHUwMEZBIFx1MDExMWFuZyBcdTFFREYgY2hcdTFFQkYgXHUwMTExXHUxRUQ5IGNoXHUxRUM5IHhlbSBcdTIwMTQgcXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcgXHUwMTExXHUwMEUzIGtoXHUwMEYzYS48L3A+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgMzogQlx1MUVBMk5HIFZcdTFFQkMgQ1x1MUVEOE5HIFRcdTAwQzFDIChTSEFSRUQgV0hJVEVCT0FSRCkgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAnd2hpdGVib2FyZCcgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTIgbWluLWgtMCBoLWZ1bGxcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIGZsZXgtd3JhcCB0ZXh0LXhzIHBiLTFcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4td2ItcGVuXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFdiVG9vbCgncGVuJyl9XG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXdiQ2FuV3JpdGV9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0yLjUgcHktMSByb3VuZGVkLWxnIHRleHQteHMgZm9udC1ib2xkIGRpc2FibGVkOm9wYWNpdHktNDAgJHt3YlRvb2wgPT09ICdwZW4nID8gJ2JnLVsjMDBGMkZFXSB0ZXh0LWJsYWNrJyA6ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCd9YH0+XG4gICAgICAgICAgICAgICAgICBcdTI3MEZcdUZFMEYgQlx1MDBGQXQgdlx1MUVCRFxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4td2ItZXJhc2VyXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFdiVG9vbCgnZXJhc2VyJyl9XG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXdiQ2FuV3JpdGV9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0yLjUgcHktMSByb3VuZGVkLWxnIHRleHQteHMgZm9udC1ib2xkIGRpc2FibGVkOm9wYWNpdHktNDAgJHt3YlRvb2wgPT09ICdlcmFzZXInID8gJ2JnLXJvc2UtNTAwIHRleHQtd2hpdGUnIDogJ2JnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwJ31gfT5cbiAgICAgICAgICAgICAgICAgIFx1RDgzRVx1RERGOSBUXHUxRUE5eVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgbWwtMlwiPlxuICAgICAgICAgICAgICAgICAge1snIzAwRjJGRScsICcjRkZCODAwJywgJyNGNDNGNUUnLCAnI0ZGRkZGRiddLm1hcChjID0+IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIGtleT17Y31cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXdiQ2FuV3JpdGV9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRXYkNvbG9yKGMpOyBzZXRXYlRvb2woJ3BlbicpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNSBoLTUgcm91bmRlZC1mdWxsIGJvcmRlciBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JDb2xvciA9PT0gYyAmJiB3YlRvb2wgPT09ICdwZW4nID8gJ3NjYWxlLTExMCBib3JkZXItd2hpdGUgcmluZy0yIHJpbmctY3lhbi00MDAnIDogJ2JvcmRlci10cmFuc3BhcmVudCd9YH1cbiAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiBjIH19XG4gICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2N9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLWNsZWFyXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2NsZWFyV2hpdGVib2FyZH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctd2hpdGUvNSBob3ZlcjpiZy1yb3NlLTUwMC8yMCB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC14cyBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgIFhcdTAwRjNhIGJcdTFFQTNuZ1xuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIG92ZXJmbG93LWhpZGRlbiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByZWxhdGl2ZSB0b3VjaC1ub25lIG1pbi1oLVsyMjBweF1cIj5cbiAgICAgICAgICAgICAgeyF3YkNhbldyaXRlICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgei0xMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBiZy1ibGFjay80MCB0ZXh0LVsxMXB4XSB0ZXh0LWFtYmVyLTMwMC85MCBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgIFx1RDgzRFx1REQxMiBCXHUxRUEzbmcgdlx1MUVCRCBcdTAxMTFhbmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSBjaFx1MUVDOSB4ZW1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPGNhbnZhc1xuICAgICAgICAgICAgICAgIGlkPVwic3R1ZHktd2hpdGVib2FyZC1jYW52YXNcIlxuICAgICAgICAgICAgICAgIHJlZj17Y2FudmFzUmVmfVxuICAgICAgICAgICAgICAgIHdpZHRoPXs2NDB9XG4gICAgICAgICAgICAgICAgaGVpZ2h0PXszMjB9XG4gICAgICAgICAgICAgICAgb25Nb3VzZURvd249e3diQ2FuV3JpdGUgPyBzdGFydERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZU1vdmU9e3diQ2FuV3JpdGUgPyBkcmF3TW92ZSA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvbk1vdXNlVXA9e3diQ2FuV3JpdGUgPyBzdG9wRHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9e3diQ2FuV3JpdGUgPyBzdG9wRHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvblRvdWNoU3RhcnQ9e3diQ2FuV3JpdGUgPyBzdGFydERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaE1vdmU9e3diQ2FuV3JpdGUgPyBkcmF3TW92ZSA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvblRvdWNoRW5kPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIGgtZnVsbCAke3diQ2FuV3JpdGUgPyAnY3Vyc29yLWNyb3NzaGFpcicgOiAnY3Vyc29yLW5vdC1hbGxvd2VkJ31gfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRBQiA0OiBCXHUxRUEyTkcgVFx1MDBDRE5IIENcdTFFRDhORyBUXHUwMEMxQyAoU0hBUkVEIFNIRUVUIDh4MTApICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ3NoZWV0JyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMiBvdmVyZmxvdy14LWF1dG8gbWluLWgtMCBoLWZ1bGxcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgQlx1MUVBM25nIHRcdTAwRURuaCBwaFx1MDBFMm4gdFx1MDBFRGNoIHNcdTFFRDEgbGlcdTFFQzd1IC8gbVx1MUVEMWMgdGhcdTFFRERpIGdpYW4gaFx1MUVDRGMgdFx1MUVBRHAgKExcdTAxQjB1IHRcdTFFRjEgXHUwMTExXHUxRUQ5bmcpXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LWF1dG8gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIGJnLVsjMEIwRTE0XSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgIDx0YWJsZSBpZD1cInN0dWR5LXNoZWV0LXRhYmxlXCIgY2xhc3NOYW1lPVwidy1mdWxsIHRleHQteHMgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyLWNvbGxhcHNlXCI+XG4gICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImJnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwidy04IHAtMSB0ZXh0LWNlbnRlciBib3JkZXItciBib3JkZXItd2hpdGUvMTAgdGV4dC1bMTBweF1cIj4jPC90aD5cbiAgICAgICAgICAgICAgICAgICAge0NPTFMubWFwKGMgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgIDx0aCBrZXk9e2N9IGNsYXNzTmFtZT1cInAtMS41IHRleHQtY2VudGVyIGJvcmRlci1yIGJvcmRlci13aGl0ZS8xMCBtaW4tdy1bNzBweF0gdGV4dC1bMTFweF0gZm9udC1ib2xkIHRleHQtY3lhbi0zMDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtjfVxuICAgICAgICAgICAgICAgICAgICAgIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgIHtST1dTLm1hcChyID0+IChcbiAgICAgICAgICAgICAgICAgICAgPHRyIGtleT17cn0gY2xhc3NOYW1lPVwiYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvWzAuMDJdXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMSB0ZXh0LWNlbnRlciBiZy13aGl0ZS81IHRleHQtc2xhdGUtNTAwIGZvbnQtbW9ubyB0ZXh0LVsxMHB4XSBib3JkZXItciBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtyfVxuICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAge0NPTFMubWFwKGMgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2VsbEtleSA9IGAke2N9JHtyfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQga2V5PXtjZWxsS2V5fSBjbGFzc05hbWU9XCJwLTAgYm9yZGVyLXIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtY2VsbD17Y2VsbEtleX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtzaGVldENlbGxzW2NlbGxLZXldIHx8ICcnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVhZE9ubHk9eyFzaGVldENhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Gb2N1cz17KCkgPT4geyBzaGVldEZvY3VzZWRDZWxsUmVmLmN1cnJlbnQgPSBjZWxsS2V5OyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoKSA9PiB7IHNoZWV0Rm9jdXNlZENlbGxSZWYuY3VycmVudCA9IG51bGw7IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzaGVldENhbldyaXRlICYmIGhhbmRsZUNlbGxDaGFuZ2UoY2VsbEtleSwgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIGJnLXRyYW5zcGFyZW50IHB4LTIgcHktMSB0ZXh0LXhzIHRleHQtd2hpdGUgZm9jdXM6YmctWyMxNTFBMjNdIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1bIzAwRjJGRV0gJHshc2hlZXRDYW5Xcml0ZSA/ICdvcGFjaXR5LTYwIGN1cnNvci1ub3QtYWxsb3dlZCcgOiAnJ31gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNTogMS1UTy0xIFdFQlJUQyBWT0lDRSBcdTIwMTQgcGFpci1ib3VuZCwgY1x1MDBGMyB4aW4gcXV5XHUxRUMxbiAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICd2b2ljZScgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNiB0ZXh0LWNlbnRlciBnYXAtNFwiPlxuICAgICAgICAgICAgPGF1ZGlvIHJlZj17cmVtb3RlQXVkaW9SZWZ9IGF1dG9QbGF5IC8+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTYgaC0xNiByb3VuZGVkLTN4bCBiZy1hbWJlci00MDAvMTUgYm9yZGVyIGJvcmRlci1hbWJlci00MDAvMzAgdGV4dC1hbWJlci00MDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC0zeGwgc2hhZG93LVswXzBfMjBweF9yZ2JhKDI0NSwxNTgsMTEsMC4yKV1cIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERjk5XHVGRTBGXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC13aGl0ZVwiPlRob1x1MUVBMWkgVHJcdTFFRjFjIFRpXHUxRUJGcCAxLTEgVHJvbmcgUGhcdTAwRjJuZzwvaDQ+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDAgbWF4LXcteHMgbXQtMVwiPlxuICAgICAgICAgICAgICAgIE1cdTFFRDdpIHBoXHUwMEYybmcgdFx1MUVEMWkgXHUwMTExYSBtXHUxRUQ5dCBjXHUxRUI3cCB2b2ljZSAxLTEuIE1pY3JvIG1cdTFFQjdjIFx1MDExMVx1MUVDQm5oIHRcdTFFQUZ0IGtoaSBjaFx1MDFCMGEgYlx1MUVBRHQuXG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogVHJcdTFFQTFuZyB0aFx1MDBFMWkgY1x1MUVCN3AgaGlcdTFFQzduIHRcdTFFQTFpICovfVxuICAgICAgICAgICAge3ZvaWNlUGFpcj8uYWN0aXZlICE9PSB1bmRlZmluZWQgJiYgKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgYmctd2hpdGUvNSBweC0zIHB5LTEgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgICB7dm9pY2VQYWlyPy5hVGVuID8gYCR7dm9pY2VQYWlyLmFUZW59JHt2b2ljZVBhaXIuYlRlbiA/ICcgXHUyMTk0ICcgKyB2b2ljZVBhaXIuYlRlbiA6ICcgXHUwMEI3IFx1MDExMWFuZyBjaFx1MUVERCBuZ1x1MDFCMFx1MUVERGkgdGhcdTFFRTkgMid9YCA6ICdDaFx1MDFCMGEgY1x1MDBGMyBjXHUxRUI3cCB2b2ljZSBuXHUwMEUwbyd9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgZmxleC13cmFwIGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgICAgICAgIHshdm9pY2VKb2luZWQgPyAoXG4gICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgIHtjb1F1eWVuKCd2b2ljZScpID8gKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2Utam9pblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17am9pblZvaWNlfVxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt2b2ljZVBhaXI/LmFjdGl2ZSAmJiAhdm9pY2VQYWlyPy55b3VJbn1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIuNSByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tb3JhbmdlLTUwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC14cyBzaGFkb3ctbGcgaG92ZXI6b3BhY2l0eS05MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS00MFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHt2b2ljZVBhaXI/LmFjdGl2ZSA/ICdcdTAxMTBhbmcgY1x1MDBGMyBjXHUxRUI3cCB2b2ljZSBraFx1MDBFMWMnIDogdm9pY2VQYWlyPy5hVGVuID8gJ1ZcdTAwRTBvIGNcdTFFQjdwIHZcdTFFREJpICcgKyB2b2ljZVBhaXIuYVRlbiA6ICdUaGFtIGdpYSB2b2ljZSd9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLXJlcXVlc3RcIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3hpblF1eWVuVm9pY2V9XG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZvaWNlUmVxdWVzdGVkfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMi41IHJvdW5kZWQteGwgYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0yMDAgYm9yZGVyIGJvcmRlci13aGl0ZS8xNSBmb250LWJvbGQgdGV4dC14cyBob3ZlcjpiZy13aGl0ZS8xNSB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3ZvaWNlUmVxdWVzdGVkID8gJ1x1MjNGMyBcdTAxMTBhbmcgY2hcdTFFREQgZHV5XHUxRUM3dFx1MjAyNicgOiAnXHVEODNEXHVERTRCIFhpbiBxdXlcdTFFQzFuIHZvaWNlJ31cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS10b2dnbGUtbWljXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlTWljfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC00IHB5LTIuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHttaWNNdXRlZCA/ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3ZlcjpiZy13aGl0ZS8xNScgOiAnYmctZW1lcmFsZC01MDAgdGV4dC1ibGFjayd9YH0+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPnttaWNNdXRlZCA/ICdcdUQ4M0RcdUREMDcgQlx1MUVBRHQgTWljJyA6ICdcdUQ4M0NcdURGOTlcdUZFMEYgTWljIFx1MDExMGFuZyBCXHUxRUFEdCd9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1sZWF2ZVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2xlYXZlVm9pY2V9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMi41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMjAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzMwIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgIFJcdTFFRERpIHZvaWNlXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAge2lzU3RhZmYgJiYgdm9pY2VQYWlyPy5hVGVuICYmICF2b2ljZVBhaXI/LnlvdUluICYmIChcbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLWVuZFwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtuZ2F0Vm9pY2VDYXB9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzEwIHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8yNSB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8yMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgTmdcdTFFQUZ0IGNcdTFFQjdwIHZvaWNlXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFN0YWZmOiBkYW5oIHNcdTAwRTFjaCB4aW4gcXV5XHUxRUMxbiB2b2ljZSAqL31cbiAgICAgICAgICAgIHtpc1N0YWZmICYmIHlldUNhdVZvaWNlLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy1zbSBiZy13aGl0ZS81IGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTIuNSB0ZXh0LWxlZnRcIj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHRleHQtYW1iZXItMzAwIG1iLTEuNVwiPlx1MDExMGFuZyB4aW4gcXV5XHUxRUMxbiB2b2ljZTwvcD5cbiAgICAgICAgICAgICAgICB7eWV1Q2F1Vm9pY2UubWFwKHIgPT4gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3Iua2hvYX0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyBweS0xXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtMjAwIGZvbnQtc2VtaWJvbGQgZmxleC0xIHRydW5jYXRlXCI+e3IudGVuIHx8ICdUaFx1MDBFMG5oIHZpXHUwMEVBbid9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4geyBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiByLmtob2EsIGNhcGFiaWxpdHk6ICd2b2ljZScsIG9uOiB0cnVlIH0pOyBpZiAoZD8ub2spIHNldFlldUNhdVZvaWNlKHByZXYgPT4gcHJldi5maWx0ZXIoeCA9PiB4Lmtob2EgIT09IHIua2hvYSkpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctZW1lcmFsZC01MDAvMjAgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIER1eVx1MUVDN3RcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHIua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246IGZhbHNlIH0pOyBpZiAoZD8ub2spIHNldFlldUNhdVZvaWNlKHByZXYgPT4gcHJldi5maWx0ZXIoeCA9PiB4Lmtob2EgIT09IHIua2hvYSkpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzI1IHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgIFRcdTFFRUIgY2hcdTFFRDFpXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAge3ZvaWNlTm90aWNlICYmIChcbiAgICAgICAgICAgICAgPHAgaWQ9XCJ2b2ljZS1zdGF0dXMtbm90aWNlXCIgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTMwMCBmb250LW1vbm8gYmctYmxhY2svNDAgcHgtMyBweS0xLjUgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICB7dm9pY2VOb3RpY2V9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCBtYXgtdy14c1wiPlxuICAgICAgICAgICAgICAqIEdoaSBjaFx1MDBGQTogS1x1MUVCRnQgblx1MUVEMWkgdGhvXHUxRUExaSBQMlAgeVx1MDBFQXUgY1x1MUVBN3UgbVx1MUVBMW5nIGtoXHUwMEY0bmcgY2hcdTFFQjduIFVEUC4gUmVzdHJpY3RpdmUgTkFUIGNcdTAwRjMgdGhcdTFFQzMgY1x1MUVBN24gcmVsYXkgVFVSTi5cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDc6IFRIXHUwMEMwTkggVklcdTAwQ0FOIFRST05HIFBIXHUwMEQyTkcgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAnbWVtYmVycycgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTMgbWluLWgtMCBoLWZ1bGxcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHBiLTIgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ibGFjayB0ZXh0LXdoaXRlIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDNjU8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+VGhcdTAwRTBuaCB2aVx1MDBFQW4gdHJvbmcgcGhcdTAwRjJuZyAoe3RoYW5oVmllbi5sZW5ndGh9KTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgICAgIFx1MDExMGFuZyB0clx1MUVGMWMgdHV5XHUxRUJGblxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMiBvdmVyZmxvdy15LWF1dG8gcHItMSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgIHt0aGFuaFZpZW4ubWFwKCh0diwgaWR4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGFIb3N0ID0gdHYubGFDaHVQaG9uZyA9PT0gMSB8fCB0di52YWlUcm9QaG9uZyA9PT0gJ2hvc3QnO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhR1YgPSB0di52YWlUcm8gPT09ICdnaWFvX3ZpZW4nO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhQ29Ib3N0ID0gdHYudmFpVHJvUGhvbmcgPT09ICdjb2hvc3QnO1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50Vm9pY2UgPSBncmFudHMuc29tZShnID0+IGcua2hvYVRWID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZvaWNlJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JhbnRWaWRlbyA9IGdyYW50cy5zb21lKGcgPT4gZy5raG9hVFYgPT09IHR2Lmtob2EgJiYgZy5jYXBhYmlsaXR5ID09PSAndmlkZW9fY29udHJvbCcpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAga2V5PXt0di5raG9hIHx8IHR2LnRlbiB8fCBpZHh9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjUgcC0yLjUgcm91bmRlZC14bCBiZy13aGl0ZS9bMC4wM10gaG92ZXI6Ymctd2hpdGUvWzAuMDZdIGJvcmRlciBib3JkZXItd2hpdGUvNSBob3Zlcjpib3JkZXItdGVhbC01MDAvMjUgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTggaC04IHJvdW5kZWQtZnVsbCBiZy1ncmFkaWVudC10by1iciBmcm9tLXRlYWwtNTAwLzIwIHRvLWVtZXJhbGQtNTAwLzIwIGJvcmRlciBib3JkZXItdGVhbC01MDAvMzAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC14cyBmb250LWJsYWNrIHRleHQtdGVhbC0zMDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7dHYuYXZhdGFyID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3R2LmF2YXRhcn0gYWx0PVwiXCIgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCByb3VuZGVkLWZ1bGwgb2JqZWN0LWNvdmVyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgKHR2LnRlbiB8fCAnPycpLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtMjAwIHRydW5jYXRlXCI+e3R2LnRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bGFIb3N0ICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0RcdURDNTEgSG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAge2xhR1YgJiYgIWxhSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERjkzIEdpXHUwMEUxbyB2aVx1MDBFQW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUNvSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyQjUwIENvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCBibG9jayB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3R2LmxvcFRlbiA/IGBMXHUxRURCcCAke3R2LmxvcFRlbn1gIDogKGxhR1YgPyAnR2lcdTAwRTFvIHZpXHUwMEVBbiB0clx1MDFCMFx1MUVERG5nJyA6ICdIXHUxRUNEYyBzaW5oJyl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICB7LyogTWVtYmVyIGFjdGlvbnMgblx1MUVCRnUgbFx1MDBFMCBob3N0L0dWICovfVxuICAgICAgICAgICAgICAgICAgICB7KHZhaVRyb1Bob25nID09PSAnaG9zdCcgfHwgYXV0aC51c2VyPy5pc1RlYWNoZXIpICYmICFsYUhvc3QgJiYgdHYua2hvYSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdzZXRfY29faG9zdCcsIHsga2hvYVRWOiB0di5raG9hLCBvbjogIWxhQ29Ib3N0IH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17bGFDb0hvc3QgPyAnVGh1IHF1eVx1MUVDMW4gY28taG9zdCcgOiAnQ1x1MUVBNXAgY28taG9zdCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYUNvSG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyLXZpb2xldC01MDAvNDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogIWdyYW50Vm9pY2UgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gbWljXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy02IGgtNiByb3VuZGVkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYW50Vm9pY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcdUZFMEZcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndmlkZW9fY29udHJvbCcsIG9uOiAhZ3JhbnRWaWRlbyB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDXHUxRUE1cC90aHUgcXV5XHUxRUMxbiB2aWRlb1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNiBoLTYgcm91bmRlZCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LVsxMHB4XSBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFudFZpZGVvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ibHVlLTUwMC8yMCB0ZXh0LWJsdWUtMzAwIGJvcmRlci1ibHVlLTUwMC80MCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERkE1XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlybShgS2ljayAke3R2LnRlbn0ga2hcdTFFQ0ZpIHBoXHUwMEYybmc/YCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2tpY2snLCB7IGtob2FUVjogdHYua2hvYSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkICYmICFkLm9rKSBhbGVydChkLmxvaSB8fCAnS2hcdTAwRjRuZyBraWNrIFx1MDExMVx1MDFCMFx1MUVFM2MuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIktpY2sga2hcdTFFQ0ZpIHBoXHUwMEYybmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTYgaC02IHJvdW5kZWQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTBweF0gYm9yZGVyIGJnLXJvc2UtNTAwLzEwIHRleHQtcm9zZS0zMDAgYm9yZGVyLXJvc2UtNTAwLzI1IGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9KX1cblxuICAgICAgICAgICAgICB7dGhhbmhWaWVuLmxlbmd0aCA9PT0gMCAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS04IHRleHQtc2xhdGUtNTAwIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgIENoXHUwMUIwYSBjXHUwMEYzIHRoXHUwMEUwbmggdmlcdTAwRUFuIG5cdTAwRTBvIHRyb25nIHBoXHUwMEYybmcuXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuXG5cbiAgICAgICAgey8qIFRBQiA2OiBRVVx1MUVBMk4gVFJcdTFFQ0EgUEhcdTAwRDJORyAoc3RhZmYgb25seSkgXHUyMDE0IHBvbGljeSBtYXRyaXggKyBtZW1iZXIgYWN0aW9ucyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdxdWFuLXRyaScgJiYgaXNTdGFmZiAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMyBvdmVyZmxvdy15LWF1dG8gbWluLWgtMCBwci0xIGgtZnVsbFwiPlxuICAgICAgICAgICAgey8qIFF1aWNrIGFjdGlvbnMgdGhlbyBtXHUwMEY0IGhcdTAwRUNuaCBcdTAxMTFcdTAwRTMgY2hcdTFFRDF0ICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBmbGV4LXdyYXBcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2FwIG9mIFsnbm90ZXMnLCAnd2hpdGVib2FyZCcsICdzaGVldCddKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6ICdzdGFmZl9vbmx5JyB9KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRleHQtWzExcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgIFx1RDgzRFx1REQxMiBLaFx1MDBGM2EgY1x1MUVEOW5nIHRcdTAwRTFjIChjaFx1MUVDOSB4ZW0pXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjYXAgb2YgWydub3RlcycsICd3aGl0ZWJvYXJkJywgJ3NoZWV0J10pIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdwb2xpY3knLCB7IGNhcGFiaWxpdHk6IGNhcCwgZW5hYmxlZDogMSwgYWNjZXNzTW9kZTogJ2V2ZXJ5b25lJyB9KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQteGwgYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQtWzExcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgIFx1RDgzRFx1REQxMyBNXHUxRURGIGNcdTFFRDluZyB0XHUwMEUxYyBjaG8gbVx1MUVDRGkgbmdcdTAxQjBcdTFFRERpXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBQb2xpY3kgbWF0cml4ICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtM1wiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHRleHQtc2xhdGUtNDAwIG1iLTJcIj5DaFx1MDBFRG5oIHNcdTAwRTFjaCBjXHUwMEY0bmcgY1x1MUVFNTwvcD5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNVwiPlxuICAgICAgICAgICAgICAgIHtbXG4gICAgICAgICAgICAgICAgICBbJ3ZpZGVvX2NvbnRyb2wnLCAnXHUwMTEwaVx1MUVDMXUga2hpXHUxRUMzbiBwaFx1MDBFMXQgKHBsYXkvcGF1c2UvdHVhKSddLFxuICAgICAgICAgICAgICAgICAgWyd2aWRlb19jaGFuZ2UnLCAnXHUwMTEwXHUxRUQ1aSB2aWRlbyBcdTAxMTFhbmcgcGhcdTAwRTF0J10sXG4gICAgICAgICAgICAgICAgICBbJ3F1ZXVlJywgJ0hcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHZpZGVvJ10sXG4gICAgICAgICAgICAgICAgICBbJ2NoYXQnLCAnQ2hhdCBwaFx1MDBGMm5nJ10sXG4gICAgICAgICAgICAgICAgICBbJ25vdGVzJywgJ0doaSBjaFx1MDBGQSBjaHVuZyddLFxuICAgICAgICAgICAgICAgICAgWyd3aGl0ZWJvYXJkJywgJ0JcdTFFQTNuZyB2XHUxRUJEJ10sXG4gICAgICAgICAgICAgICAgICBbJ3NoZWV0JywgJ0JcdTFFQTNuZyB0XHUwMEVEbmgnXSxcbiAgICAgICAgICAgICAgICAgIFsndm9pY2UnLCAnVm9pY2UgMS0xJ10sXG4gICAgICAgICAgICAgICAgICBbJ2ludml0ZScsICdNXHUxRUREaSBuZ1x1MDFCMFx1MUVERGkgdlx1MDBFMG8gcGhcdTAwRjJuZyddLFxuICAgICAgICAgICAgICAgIF0ubWFwKChbY2FwLCBuaGFuXSkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgcG9sID0gcG9saWNpZXM/LltjYXBdIHx8IHsgZW5hYmxlZDogMSwgYWNjZXNzX21vZGU6ICdzdGFmZl9vbmx5JyB9O1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e2NhcH0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14c1wiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZsZXgtMSB0ZXh0LXNsYXRlLTMwMCB0cnVuY2F0ZVwiPntuaGFufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IHBvbC5lbmFibGVkID8gMCA6IDEsIGFjY2Vzc01vZGU6IHBvbC5hY2Nlc3NfbW9kZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtwb2wuZW5hYmxlZCA/ICdcdTAxMTBhbmcgYlx1MUVBRHQgXHUyMDE0IGJcdTFFQTVtIFx1MDExMVx1MUVDMyB0XHUxRUFGdCcgOiAnXHUwMTEwYW5nIHRcdTFFQUZ0IFx1MjAxNCBiXHUxRUE1bSBcdTAxMTFcdTFFQzMgYlx1MUVBRHQnfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy04IGgtNC41IHB4LTAuNSByb3VuZGVkLWZ1bGwgYm9yZGVyIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyICR7cG9sLmVuYWJsZWQgPyAnYmctZW1lcmFsZC01MDAvMzAgYm9yZGVyLWVtZXJhbGQtNTAwLzQwIGp1c3RpZnktZW5kJyA6ICdiZy13aGl0ZS81IGJvcmRlci13aGl0ZS8xNSBqdXN0aWZ5LXN0YXJ0J31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHctMyBoLTMgcm91bmRlZC1mdWxsICR7cG9sLmVuYWJsZWQgPyAnYmctZW1lcmFsZC00MDAnIDogJ2JnLXNsYXRlLTUwMCd9YH0+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtwb2wuYWNjZXNzX21vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXBvbC5lbmFibGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gaGFuaERvbmdQaG9uZz8uKCdwb2xpY3knLCB7IGNhcGFiaWxpdHk6IGNhcCwgZW5hYmxlZDogMSwgYWNjZXNzTW9kZTogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIHB4LTEuNSBweS0xIHRleHQtWzEwcHhdIHRleHQtc2xhdGUtMjAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwIGRpc2FibGVkOm9wYWNpdHktNDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJzdGFmZl9vbmx5XCI+UXVcdTFFQTNuIHRyXHUxRUNCPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwic2VsZWN0ZWRfbWVtYmVyc1wiPk1cdTFFRDl0IHNcdTFFRDEgbmdcdTAxQjBcdTFFRERpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiZXZlcnlvbmVcIj5NXHUxRUNEaSBuZ1x1MDFCMFx1MUVERGk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyBvcGFjaXR5LTYwXCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmbGV4LTEgdGV4dC1zbGF0ZS00MDBcIj5LaVx1MUVDM20gZHV5XHUxRUM3dCAoa2ljay94b1x1MDBFMSB0aW4pPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSBmb250LWJvbGQgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgcm91bmRlZCBweC0xLjUgcHktMC41XCI+TFVcdTAwRDROIFFVXHUxRUEyTiBUUlx1MUVDQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFF1XHUxRUEzbiBsXHUwMEZEIHRoXHUwMEUwbmggdmlcdTAwRUFuICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtM1wiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHRleHQtc2xhdGUtNDAwIG1iLTJcIj5UaFx1MDBFMG5oIHZpXHUwMEVBbiAmIHF1eVx1MUVDMW4gcmlcdTAwRUFuZzwvcD5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNVwiPlxuICAgICAgICAgICAgICAgIHsodGhhbmhWaWVuIHx8IFtdKS5tYXAodHYgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgbGFIb3N0ID0gQm9vbGVhbih0di5sYUNodVBob25nKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhR1YgPSB0di52YWlUcm8gPT09ICdnaWFvX3ZpZW4nO1xuICAgICAgICAgICAgICAgICAgY29uc3QgbGFDb0hvc3QgPSB0di52YWlUcm9QaG9uZyA9PT0gJ2NvX2hvc3QnO1xuICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbnRWb2ljZSA9IChncmFudHMgfHwgW10pLnNvbWUoZyA9PiBnLmtob2EgPT09IHR2Lmtob2EgJiYgZy5jYXBhYmlsaXR5ID09PSAndm9pY2UnICYmIGcudHJhbmdUaGFpID09PSAnZ3JhbnRlZCcpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbnRWaWRlbyA9IChncmFudHMgfHwgW10pLnNvbWUoZyA9PiBnLmtob2EgPT09IHR2Lmtob2EgJiYgZy5jYXBhYmlsaXR5ID09PSAndmlkZW9fY29udHJvbCcgJiYgZy50cmFuZ1RoYWkgPT09ICdncmFudGVkJyk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17dHYua2hvYSB8fCB0di50ZW59IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgdGV4dC14cyBmbGV4LXdyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTIwMCBmb250LXNlbWlib2xkIHRydW5jYXRlIG1heC13LVsxMTBweF1cIj57dHYudGVufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICB7bGFIb3N0ICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1hbWJlci00MDAgZm9udC1ib2xkXCI+XHUyNjA1IGhvc3Q8L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgIHtsYUdWICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1bIzAwRjJGRV0gZm9udC1ib2xkXCI+R1Y8L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgIHtsYUNvSG9zdCAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtdmlvbGV0LTMwMCBmb250LWJvbGRcIj5jby1ob3N0PC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7IWxhSG9zdCAmJiAhbGFHViAmJiB0di5raG9hICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1sLWF1dG8gZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgeyh2YWlUcm9QaG9uZyA9PT0gJ2hvc3QnIHx8IGF1dGgudXNlcj8uaXNUZWFjaGVyKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ3NldF9jb19ob3N0JywgeyBraG9hVFY6IHR2Lmtob2EsIG9uOiAhbGFDb0hvc3QgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17bGFDb0hvc3QgPyAnVGh1IHF1eVx1MUVDMW4gY28taG9zdCcgOiAnQ1x1MUVBNXAgY28taG9zdCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyICR7bGFDb0hvc3QgPyAnYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyLXZpb2xldC01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY28taG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogIWdyYW50Vm9pY2UgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDXHUxRUE1cC90aHUgcXV5XHUxRUMxbiB2b2ljZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2dyYW50Vm9pY2UgPyAnYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlci1hbWJlci01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzQ1x1REY5OVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZpZGVvX2NvbnRyb2wnLCBvbjogIWdyYW50VmlkZW8gfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDXHUxRUE1cC90aHUgcXV5XHUxRUMxbiBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIHZpZGVvXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyICR7Z3JhbnRWaWRlbyA/ICdiZy1jeWFuLTUwMC8yMCB0ZXh0LWN5YW4tMzAwIGJvcmRlci1jeWFuLTUwMC80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4geyBpZiAoY29uZmlybShgS2ljayAke3R2LnRlbn0ga2hcdTFFQ0ZpIHBoXHUwMEYybmc/YCkpIHsgY29uc3QgZCA9IGF3YWl0IGhhbmhEb25nUGhvbmc/Ligna2ljaycsIHsga2hvYVRWOiB0di5raG9hIH0pOyBpZiAoZCAmJiAhZC5vaykgYWxlcnQoZC5sb2kgfHwgJ0toXHUwMEY0bmcga2ljayBcdTAxMTFcdTAxQjBcdTFFRTNjLicpOyB9IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJLaWNrIGtoXHUxRUNGaSBwaFx1MDBGMm5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyIGJnLXJvc2UtNTAwLzEwIHRleHQtcm9zZS0zMDAgYm9yZGVyLXJvc2UtNTAwLzI1IGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2lja1xuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgeyh0aGFuaFZpZW4gfHwgW10pLmxlbmd0aCA9PT0gMCAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMFwiPkNoXHUwMUIwYSBjXHUwMEYzIHRoXHUwMEUwbmggdmlcdTAwRUFuLjwvcD59XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBcdTAxMTBcdTFFRDVpL2JcdTFFQ0YgbVx1MUVBRHQga2hcdTFFQTl1IFx1MjAxNCBjaFx1MUVDOSBob3N0L0dWICovfVxuICAgICAgICAgICAgeyh2YWlUcm9QaG9uZyA9PT0gJ2hvc3QnIHx8IGF1dGgudXNlcj8uaXNUZWFjaGVyKSAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTMgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIk1cdTFFQUR0IGtoXHUxRUE5dSBtXHUxRURCaSAoXHUwMTExXHUxRUMzIHRyXHUxRUQxbmcgPSBiXHUxRUNGIG1cdTFFQUR0IGtoXHUxRUE5dSlcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1waG9uZy1tYXQta2hhdS1tb2lcIlxuICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXsxMDB9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0yLjUgcHktMS41IHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTBcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucHV0LXBob25nLW1hdC1raGF1LW1vaScpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtayA9IGVsPy52YWx1ZSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IG1rLnRyaW0oKVxuICAgICAgICAgICAgICAgICAgICAgID8gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdkb2lfbWF0X2toYXUnLCB7IG1hdEtoYXVNb2k6IG1rLnRyaW0oKSB9KVxuICAgICAgICAgICAgICAgICAgICAgIDogYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdib19tYXRfa2hhdScsIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGQgJiYgIWQub2spIGFsZXJ0KGQubG9pIHx8ICdLaFx1MDBGNG5nIFx1MDExMVx1MUVENWkgXHUwMTExXHUwMUIwXHUxRUUzYyBtXHUxRUFEdCBraFx1MUVBOXUuJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbCkgZWwudmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLWxnIGJnLWFtYmVyLTUwMC8xNSB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctYW1iZXItNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICBcdTAxMTBcdTFFRDVpIC8gQlx1MUVDRlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIENhbXB1c1dhdGNoVG9nZXRoZXIoe1xuICBwaG9uZyxcbiAgcGhvbmdNaW5oS2hvYTogX3Bob25nTWluaEtob2EsXG4gIGF1dGgsXG4gIGRvbmdQaG9uZ0hpZW5UYWk6IF9kb25nUGhvbmdIaWVuVGFpLFxuICBzb05ndW9pOiBfc29OZ3VvaSxcbiAgbXlDYXBzLFxuICB2aWRlb1RpbWVSZWYsXG4gIGlzUm9vbVdpZGUsXG4gIGhhbmhEb25nUGhvbmc6IF9oYW5oRG9uZ1Bob25nLFxuICBpc1N0YWZmID0gZmFsc2UsXG59KSB7XG4gIGNvbnN0IFt3YXRjaFN0YXRlLCBzZXRXYXRjaFN0YXRlXSA9IHVzZVN0YXRlKHtcbiAgICBwbGF5aW5nOiBmYWxzZSxcbiAgICBwb3NpdGlvblNlY29uZHM6IDAsXG4gICAgYmFzZVBvc2l0aW9uU2Vjb25kczogMCxcbiAgICBwbGF5YmFja1JhdGU6IDEuMCxcbiAgICByZXZpc2lvbjogMSxcbiAgICB1cGRhdGVkQXQ6ICcnLFxuICAgIHNlcnZlck5vdzogJycsXG4gICAgdXBkYXRlZEJ5OiAnJ1xuICB9KTtcbiAgY29uc3QgW2NhbkNvbnRyb2wsIHNldENhbkNvbnRyb2xdID0gdXNlU3RhdGUoQm9vbGVhbihcbiAgICBhdXRoPy51c2VyPy5pc1RlYWNoZXIgfHwgcGhvbmc/LmNhbkNvbnRyb2wgfHwgcGhvbmc/LmxhQ2h1UGhvbmcgfHwgbXlDYXBzPy52aWRlb19jb250cm9sIHx8IG15Q2Fwcz8udmlkZW9fY2hhbmdlIHx8IGlzU3RhZmZcbiAgKSk7XG4gIGNvbnN0IFtfd2F0Y2hDYXBzLCBzZXRXYXRjaENhcHNdID0gdXNlU3RhdGUoe30pO1xuICBjb25zdCBnZXRJbml0aWFsVmlkZW9VcmwgPSAoKSA9PiB7XG4gICAgbGV0IGMgPSB7fTtcbiAgICB0cnkgeyBjID0gcGhvbmc/LmNhdUhpbmggPyBKU09OLnBhcnNlKHBob25nLmNhdUhpbmgpIDoge307IH0gY2F0Y2ggeyB9XG4gICAgcmV0dXJuIGMudmlkZW9VcmwgfHwgcGhvbmc/LnZpZGVvVXJsIHx8ICcnO1xuICB9O1xuXG4gIGNvbnN0IGdldEluaXRpYWxQcm92aWRlciA9ICh1KSA9PiB7XG4gICAgaWYgKCF1KSByZXR1cm4gJ1VOU1VQUE9SVEVEJztcbiAgICBpZiAoaWRZb3V0dWJlKHUpKSByZXR1cm4gJ1lPVVRVQkUnO1xuICAgIGlmIChpZEdvb2dsZURyaXZlKHUpKSByZXR1cm4gJ0dPT0dMRV9EUklWRSc7XG4gICAgaWYgKGxhVmlkZW9UcnVjVGllcEZlKHUpKSByZXR1cm4gJ05BVElWRV9IVE1MNSc7XG4gICAgcmV0dXJuICdVTlNVUFBPUlRFRCc7XG4gIH07XG5cbiAgY29uc3QgaW5pdFVybCA9IGdldEluaXRpYWxWaWRlb1VybCgpO1xuICBjb25zdCBbYWN0aXZlVmlkZW9VcmwsIHNldEFjdGl2ZVZpZGVvVXJsXSA9IHVzZVN0YXRlKGluaXRVcmwpO1xuICBjb25zdCBbcHJvdmlkZXIsIHNldFByb3ZpZGVyXSA9IHVzZVN0YXRlKCgpID0+IGdldEluaXRpYWxQcm92aWRlcihpbml0VXJsKSk7XG4gIGNvbnN0IFtoYXNJbnRlcmFjdGVkLCBzZXRIYXNJbnRlcmFjdGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2xvY2FsVGltZSwgc2V0TG9jYWxUaW1lXSA9IHVzZVN0YXRlKDApO1xuICBjb25zdCBbZHVyYXRpb24sIHNldER1cmF0aW9uXSA9IHVzZVN0YXRlKDApO1xuICBjb25zdCBbZGFuZ0d1aUxlbmgsIHNldERhbmdHdWlMZW5oXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2xvaSwgc2V0TG9pXSA9IHVzZVN0YXRlKCcnKTtcblxuICAvLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ1x1MUVBNFUgSFx1MDBDQ05IIFZJREVPLCBUXHUwMENDTSBLSVx1MUVCRU0gWU9VVFVCRSAmIEhcdTAwQzBORyBcdTAxMTBcdTFFRTJJIFRcdTFFQTBJIFZcdTAwRDlORyAxIFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCBbbWVkaWFUYWIsIHNldE1lZGlhVGFiXSA9IHVzZVN0YXRlKCdzZWFyY2gnKTsgLy8gJ3NlYXJjaCcgfCAncXVldWUnXG4gIGNvbnN0IFt2aWRlb01vaSwgc2V0VmlkZW9Nb2ldID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbZGFuZ0RvaVZpZGVvLCBzZXREYW5nRG9pVmlkZW9dID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9pVmlkZW8sIHNldExvaVZpZGVvXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3Rob25nQmFvVmlkZW8sIHNldFRob25nQmFvVmlkZW9dID0gdXNlU3RhdGUoJycpO1xuXG4gIC8vIFlvdVR1YmUgU2VhcmNoIFN0YXRlXG4gIGNvbnN0IFt5dFF1ZXJ5LCBzZXRZdFF1ZXJ5XSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3l0UmVzdWx0cywgc2V0WXRSZXN1bHRzXSA9IHVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW3NlYXJjaGluZ1l0LCBzZXRTZWFyY2hpbmdZdF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzZWFyY2hMb2ksIHNldFNlYXJjaExvaV0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gUXVldWUgU3RhdGVcbiAgY29uc3QgW3F1ZXVlTGlzdCwgc2V0UXVldWVMaXN0XSA9IHVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW3F1ZXVlQnVzeSwgc2V0UXVldWVCdXN5XSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2RhTW9Sb25nU3R1ZGlvLCBzZXREYU1vUm9uZ1N0dWRpb10gPSB1c2VTdGF0ZSh0cnVlKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChwaG9uZz8uY2FuQ29udHJvbCB8fCBwaG9uZz8ubGFDaHVQaG9uZyB8fCBhdXRoPy51c2VyPy5pc1RlYWNoZXIgfHwgbXlDYXBzPy52aWRlb19jb250cm9sIHx8IG15Q2Fwcz8udmlkZW9fY2hhbmdlIHx8IGlzU3RhZmYpIHtcbiAgICAgIHNldENhbkNvbnRyb2wodHJ1ZSk7XG4gICAgfVxuICB9LCBbcGhvbmc/LmNhbkNvbnRyb2wsIHBob25nPy5sYUNodVBob25nLCBhdXRoPy51c2VyPy5pc1RlYWNoZXIsIG15Q2FwcywgaXNTdGFmZl0pO1xuXG4gIC8vIFRcdTFFQTNpIGRhbmggc1x1MDBFMWNoIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHRcdTFFRUIgc2VydmVyXG4gIGNvbnN0IHRhaVF1ZXVlID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1xdWV1ZT9waG9uZ0lkPSR7cGhvbmcuaWR9JmFjdGlvbj1saXN0YCk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSBzZXRRdWV1ZUxpc3QoZC5xdWV1ZSB8fCBbXSk7XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgdGFpUXVldWUoKTtcbiAgICBjb25zdCB0aW1lciA9IHNldEludGVydmFsKGtoaUhpZW5UaGkodGFpUXVldWUpLCA0MDAwKTtcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gIH0sIFtwaG9uZy5pZF0pO1xuXG4gIC8vIFx1MDExMFx1MUVENWkgdmlkZW8gXHUwMTExYW5nIHBoXHUwMEUxdFxuICBjb25zdCBkb2lWaWRlbyA9IGFzeW5jICh1cmwsIHRpdGxlKSA9PiB7XG4gICAgY29uc3QgdSA9IFN0cmluZyh1cmwgfHwgdmlkZW9Nb2kgfHwgeXRRdWVyeSB8fCAnJykudHJpbSgpO1xuICAgIGlmICghdSB8fCBkYW5nRG9pVmlkZW8pIHJldHVybjtcbiAgICBzZXREYW5nRG9pVmlkZW8odHJ1ZSk7XG4gICAgc2V0TG9pVmlkZW8oJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy13YXRjaCcsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICdzZXRfdmlkZW8nLCB2aWRlb1VybDogdSwgYXV0b1BsYXk6IHRydWUgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoIWQub2spIHtcbiAgICAgICAgc2V0TG9pVmlkZW8oZC5sb2kgfHwgJ0toXHUwMEY0bmcgXHUwMTExXHUxRUQ1aSBcdTAxMTFcdTAxQjBcdTFFRTNjIHZpZGVvLicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0QWN0aXZlVmlkZW9VcmwodSk7XG4gICAgICAgIHNldFByb3ZpZGVyKGdldEluaXRpYWxQcm92aWRlcih1KSk7XG4gICAgICAgIHNldFZpZGVvTW9pKCcnKTtcbiAgICAgICAgaWYgKGQuc3RhdGUpIHtcbiAgICAgICAgICBzZXRXYXRjaFN0YXRlKGQuc3RhdGUpO1xuICAgICAgICAgIHNldExvY2FsVGltZSgwKTtcbiAgICAgICAgfVxuICAgICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IDA7XG4gICAgICAgIHNldER1cmF0aW9uKDApO1xuICAgICAgICBjb25zdCBuZXdZdElkID0gaWRZb3V0dWJlKHUpO1xuICAgICAgICBpZiAobmV3WXRJZCAmJiB5dFBsYXllclJlZi5jdXJyZW50ICYmIHl0UmVhZHlSZWYuY3VycmVudCAmJiB0eXBlb2YgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCh7IHZpZGVvSWQ6IG5ld1l0SWQsIHN0YXJ0U2Vjb25kczogMCB9KTtcbiAgICAgICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7XG4gICAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIHNldFRob25nQmFvVmlkZW8oYFx1MDExMGFuZyBwaFx1MDBFMXQ6ICR7dGl0bGUgfHwgdX1gKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUaG9uZ0Jhb1ZpZGVvKCcnKSwgNDAwMCk7XG4gICAgICAgIHRhaVF1ZXVlKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRMb2lWaWRlbygnTVx1MUVBNXQga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldERhbmdEb2lWaWRlbyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIFRcdTAwRUNtIGtpXHUxRUJGbSBZb3VUdWJlXG4gIGNvbnN0IHRpbUtpZW1Zb3VUdWJlID0gYXN5bmMgKGUsIHR1S2hvYSkgPT4ge1xuICAgIGU/LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgcSA9IFN0cmluZyh0dUtob2EgfHwgeXRRdWVyeSB8fCAnJykudHJpbSgpO1xuICAgIGlmICghcSB8fCBzZWFyY2hpbmdZdCkgcmV0dXJuO1xuICAgIGlmICh0dUtob2EpIHNldFl0UXVlcnkodHVLaG9hKTtcblxuICAgIC8vIE5cdTFFQkZ1IG5nXHUwMUIwXHUxRUREaSBkXHUwMEY5bmcgZFx1MDBFMW4gbGlcdTAwRUFuIGtcdTFFQkZ0IHZpZGVvIFlvdVR1YmVcbiAgICBjb25zdCBpZFl0ID0gaWRZb3V0dWJlKHEpO1xuICAgIGlmIChpZFl0KSB7XG4gICAgICBzZXRZdFJlc3VsdHMoW3tcbiAgICAgICAgdmlkZW9JZDogaWRZdCxcbiAgICAgICAgdGl0bGU6ICdWaWRlbyBZb3VUdWJlICh0XHUxRUVCIGxpXHUwMEVBbiBrXHUxRUJGdCBcdTAxMTFcdTAwRTMgZFx1MDBFMW4pJyxcbiAgICAgICAgY2hhbm5lbFRpdGxlOiAnWW91VHViZScsXG4gICAgICAgIHRodW1ibmFpbDogYGh0dHBzOi8vaS55dGltZy5jb20vdmkvJHtpZFl0fS9ocWRlZmF1bHQuanBnYCxcbiAgICAgICAgcHVibGlzaGVkQXQ6ICdUclx1MUVGMWMgdGlcdTFFQkZwJ1xuICAgICAgfV0pO1xuICAgICAgc2V0U2VhcmNoTG9pKCcnKTtcbiAgICAgIHNldE1lZGlhVGFiKCdzZWFyY2gnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRTZWFyY2hpbmdZdCh0cnVlKTtcbiAgICBzZXRTZWFyY2hMb2koJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS95b3V0dWJlLXNlYXJjaD9xPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHEpfWApO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vayAmJiBBcnJheS5pc0FycmF5KGQuaXRlbXMpKSB7XG4gICAgICAgIGlmIChkLml0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHNldFNlYXJjaExvaSgnS2hcdTAwRjRuZyB0XHUwMEVDbSB0aFx1MUVBNXkgdmlkZW8gblx1MDBFMG8gcGhcdTAwRjkgaFx1MUVFM3Agdlx1MUVEQmkgdFx1MUVFQiBraFx1MDBGM2Egblx1MDBFMHkuJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0WXRSZXN1bHRzKGQuaXRlbXMpO1xuICAgICAgICAgIHNldE1lZGlhVGFiKCdzZWFyY2gnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0U2VhcmNoTG9pKGQubG9pIHx8ICdLaFx1MDBGNG5nIHRoXHUxRUMzIHRcdTAwRUNtIGtpXHUxRUJGbSB2aWRlbyBsXHUwMEZBYyBuXHUwMEUweS4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldFNlYXJjaExvaSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkga2hpIHRcdTAwRUNtIGtpXHUxRUJGbSBZb3VUdWJlLicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRTZWFyY2hpbmdZdChmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHZpZGVvUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCB5dFBsYXllclJlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgeXRDb250YWluZXJJZCA9IGB5dC1wbGF5ZXItJHtwaG9uZy5pZH1gO1xuICBjb25zdCBpc1NlZWtpbmdSZWYgPSB1c2VSZWYoZmFsc2UpO1xuICBjb25zdCBoYXNJbnRlcmFjdGVkUmVmID0gdXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgZHVyYXRpb25SZWYgPSB1c2VSZWYoMCk7XG4gIGNvbnN0IGhhc1RyaWdnZXJlZFNraXBSZWYgPSB1c2VSZWYoZmFsc2UpO1xuICBjb25zdCBpc1NraXBwaW5nUmVmID0gdXNlUmVmKGZhbHNlKTtcblxuICAvLyBUaGFvIHRcdTAwRTFjIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIChlbnF1ZXVlLCBhZGRfbmV4dCwgcGxheV9ub3csIHNraXAsIHJlbW92ZSlcbiAgY29uc3QgaGFuaERvbmdRdWV1ZSA9IGFzeW5jIChhY3Rpb24sIGV4dHJhID0ge30pID0+IHtcbiAgICBpZiAoYWN0aW9uID09PSAnc2tpcCcpIHtcbiAgICAgIGlmIChpc1NraXBwaW5nUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocXVldWVCdXN5KSByZXR1cm47XG4gICAgICBzZXRRdWV1ZUJ1c3kodHJ1ZSk7XG4gICAgfVxuICAgIHNldExvaVZpZGVvKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctcXVldWUnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uLCAuLi5leHRyYSB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghZC5vaykge1xuICAgICAgICBzZXRMb2lWaWRlbyhkLmxvaSB8fCAnVGhhbyB0XHUwMEUxYyBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB0aFx1MUVBNXQgYlx1MUVBMWkuJyk7XG4gICAgICAgIGlmIChhY3Rpb24gPT09ICdza2lwJykge1xuICAgICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoYWN0aW9uID09PSAnZW5xdWV1ZScpIHtcbiAgICAgICAgICBzZXRUaG9uZ0Jhb1ZpZGVvKGBcdTAxMTBcdTAwRTMgdGhcdTAwRUFtIHZcdTAwRTBvIGN1XHUxRUQxaSBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaTogJHtleHRyYS50aXRsZSB8fCAnVmlkZW8nfWApO1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VGhvbmdCYW9WaWRlbygnJyksIDM1MDApO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2FkZF9uZXh0Jykge1xuICAgICAgICAgIHNldFRob25nQmFvVmlkZW8oYFx1MDExMFx1MDBFMyB0aFx1MDBFQW0gcGhcdTAwRTF0IGtcdTFFQkYgdGlcdTFFQkZwOiAke2V4dHJhLnRpdGxlIHx8ICdWaWRlbyd9YCk7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUaG9uZ0Jhb1ZpZGVvKCcnKSwgMzUwMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAncGxheV9ub3cnIHx8IGFjdGlvbiA9PT0gJ3NraXAnKSB7XG4gICAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IDA7XG4gICAgICAgICAgc2V0RHVyYXRpb24oMCk7XG4gICAgICAgICAgaWYgKGQudmlkZW9VcmwpIHtcbiAgICAgICAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKGQudmlkZW9VcmwpO1xuICAgICAgICAgICAgc2V0UHJvdmlkZXIoZ2V0SW5pdGlhbFByb3ZpZGVyKGQudmlkZW9VcmwpKTtcbiAgICAgICAgICAgIGlmIChkLnN0YXRlKSB7XG4gICAgICAgICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgICAgICAgIHNldExvY2FsVGltZSgwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG5ld1l0SWQgPSBpZFlvdXR1YmUoZC52aWRlb1VybCk7XG4gICAgICAgICAgICBpZiAobmV3WXRJZCAmJiB5dFBsYXllclJlZi5jdXJyZW50ICYmIHl0UmVhZHlSZWYuY3VycmVudCAmJiB0eXBlb2YgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkKHsgdmlkZW9JZDogbmV3WXRJZCwgc3RhcnRTZWNvbmRzOiAwIH0pO1xuICAgICAgICAgICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7XG4gICAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldFRob25nQmFvVmlkZW8oJ1x1MDExMGFuZyBjaHV5XHUxRUMzbiB2aWRlbyB0aVx1MUVCRnAgdGhlby4uLicpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUaG9uZ0Jhb1ZpZGVvKCcnKSwgMzAwMCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChkLmVtcHR5KSB7XG4gICAgICAgICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICBzZXRUaG9uZ0Jhb1ZpZGVvKCdIXHUwMEUwbmcgXHUwMTExXHUxRUUzaSBcdTAxMTFcdTAwRTMgaFx1MUVCRnQgdmlkZW8uJyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCAzMDAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGFpUXVldWUoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaVZpZGVvKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICAgIGlmIChhY3Rpb24gPT09ICdza2lwJykge1xuICAgICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmIChhY3Rpb24gIT09ICdza2lwJykge1xuICAgICAgICBzZXRRdWV1ZUJ1c3koZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBjID0ge307XG4gICAgdHJ5IHsgYyA9IHBob25nPy5jYXVIaW5oID8gSlNPTi5wYXJzZShwaG9uZy5jYXVIaW5oKSA6IHt9OyB9IGNhdGNoIHsgfVxuICAgIGNvbnN0IG5leHRVcmwgPSBjLnZpZGVvVXJsIHx8IHBob25nPy52aWRlb1VybCB8fCAnJztcbiAgICBpZiAobmV4dFVybCAmJiBuZXh0VXJsICE9PSBhY3RpdmVWaWRlb1VybCkge1xuICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSAwO1xuICAgICAgc2V0RHVyYXRpb24oMCk7XG4gICAgICBzZXRBY3RpdmVWaWRlb1VybChuZXh0VXJsKTtcbiAgICAgIHNldFByb3ZpZGVyKGdldEluaXRpYWxQcm92aWRlcihuZXh0VXJsKSk7XG4gICAgfVxuICB9LCBbcGhvbmc/LmNhdUhpbmgsIHBob25nPy52aWRlb1VybF0pO1xuXG4gIGNvbnN0IHZpZGVvVXJsID0gYWN0aXZlVmlkZW9Vcmw7XG4gIGNvbnN0IHl0SWQgPSB2aWRlb1VybCA/IGlkWW91dHViZSh2aWRlb1VybCkgOiBudWxsO1xuICBjb25zdCBkcnZJZCA9IHZpZGVvVXJsID8gaWRHb29nbGVEcml2ZSh2aWRlb1VybCkgOiBudWxsO1xuICBjb25zdCB0cnVjVGllcFVybCA9IHZpZGVvVXJsICYmICF5dElkICYmICFkcnZJZCAmJiBsYVZpZGVvVHJ1Y1RpZXBGZSh2aWRlb1VybCkgPyB1cmxNZWRpYUZlKHZpZGVvVXJsKSA6ICcnO1xuXG4gIGNvbnN0IFtfeXRQbGF5ZXJSZWFkeSwgc2V0WXRQbGF5ZXJSZWFkeV0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IHl0UmVhZHlSZWYgPSB1c2VSZWYoZmFsc2UpO1xuICBjb25zdCBjdXJyZW50WXRJZFJlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgaGFzU2Vla2VkSW5pdFJlZiA9IHVzZVJlZihmYWxzZSk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFRcdTFFQTZORyAxOiBMXHUxRUFGbmcgbmdoZSB0clx1MUVGMWMgdGlcdTFFQkZwIHRpbiBuaFx1MUVBRm4gcG9zdE1lc3NhZ2UgdFx1MUVFQiBZb3VUdWJlIElGcmFtZSBcdTI1MDBcdTI1MDBcbiAgLy8gWW91VHViZSBJRnJhbWUgbHVcdTAwRjRuIHBoXHUwMEUxdCBjXHUwMEUxYyBzXHUxRUYxIGtpXHUxRUM3biBvblN0YXRlQ2hhbmdlICYgaW5mb0RlbGl2ZXJ5IHJhIHBhcmVudCB3aW5kb3dcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBvbk1zZyA9IChlKSA9PiB7XG4gICAgICBsZXQgZGF0YSA9IGUuZGF0YTtcbiAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgaWYgKGRhdGEuaW5jbHVkZXMoJ2V2ZW50PScpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKGRhdGEpO1xuICAgICAgICAgICAgICBkYXRhID0ge1xuICAgICAgICAgICAgICAgIGV2ZW50OiBwYXJhbXMuZ2V0KCdldmVudCcpLFxuICAgICAgICAgICAgICAgIGluZm86IHBhcmFtcy5nZXQoJ2luZm8nKSA/IEpTT04ucGFyc2UocGFyYW1zLmdldCgnaW5mbycpKSA6IHBhcmFtcy5nZXQoJ2luZm8nKVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBjYXRjaCB7IHJldHVybjsgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWRhdGEgfHwgdHlwZW9mIGRhdGEgIT09ICdvYmplY3QnKSByZXR1cm47XG5cbiAgICAgIC8vIENcdTFFQURwIG5oXHUxRUFEdCBcdTAxMTFcdTFFRDkgZFx1MDBFMGkgdmlkZW8gdGhcdTFFRjFjIHRcdTFFQkYgKGR1cmF0aW9uKVxuICAgICAgY29uc3QgZCA9IE51bWJlcihkYXRhLmluZm8/LmR1cmF0aW9uIHx8IGRhdGEuZHVyYXRpb24gfHwgMCk7XG4gICAgICBpZiAoZCA+IDApIHtcbiAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IGQ7XG4gICAgICAgIHNldER1cmF0aW9uKHByZXYgPT4gKHByZXYgPiAwID8gcHJldiA6IGQpKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ1x1MUVBRHAgbmhcdTFFQUR0IHRoXHUxRUREaSBnaWFuIHRoXHUxRUYxYyB0XHUxRUJGXG4gICAgICBjb25zdCBjdXIgPSBOdW1iZXIoZGF0YS5pbmZvPy5jdXJyZW50VGltZSk7XG4gICAgICBpZiAoIWlzTmFOKGN1cikgJiYgY3VyID49IDAgJiYgIWlzU2Vla2luZ1JlZi5jdXJyZW50KSB7XG4gICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKGN1cikpO1xuICAgICAgfVxuXG4gICAgICAvLyBOaFx1MUVBRG4gZGlcdTFFQzduIHRyXHUxRUExbmcgdGhcdTAwRTFpIGtcdTFFQkZ0IHRoXHUwMEZBYyB2aWRlbzogMCA9IEVOREVEXG4gICAgICBjb25zdCBpc0VuZGVkID0gKGRhdGEuZXZlbnQgPT09ICdvblN0YXRlQ2hhbmdlJyAmJiAoZGF0YS5pbmZvID09PSAwIHx8IGRhdGEuaW5mbz8ucGxheWVyU3RhdGUgPT09IDApKSB8fFxuICAgICAgICAgICAgICAgICAgICAgIChkYXRhLmV2ZW50ID09PSAnaW5mb0RlbGl2ZXJ5JyAmJiBkYXRhLmluZm8/LnBsYXllclN0YXRlID09PSAwKSB8fFxuICAgICAgICAgICAgICAgICAgICAgIChkYXRhLmluZm8gJiYgZGF0YS5pbmZvLnBsYXllclN0YXRlID09PSAwKTtcblxuICAgICAgaWYgKGlzRW5kZWQpIHtcbiAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgIWlzU2tpcHBpbmdSZWYuY3VycmVudCAmJiAhaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1lvdVR1YmUgaWZyYW1lIHBvc3RNZXNzYWdlOiBWaWRlbyBrXHUxRUJGdCB0aFx1MDBGQWMgLT4gdFx1MUVGMSBcdTAxMTFcdTFFRDluZyBjaHV5XHUxRUMzbiB0aVx1MUVCRnAgdmlkZW8gdGlcdTFFQkZwIHRoZW8nKTtcbiAgICAgICAgICBoYW5oRG9uZ1F1ZXVlKCdza2lwJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBvbk1zZyk7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgb25Nc2cpO1xuICB9LCBbY2FuQ29udHJvbCwgcGhvbmcuaWRdKTtcblxuICAvLyBHXHUxRUVEaSBsaXN0ZW5pbmcgaGFuZHNoYWtlIFx1MDExMVx1MUVDQm5oIGtcdTFFRjMgdlx1MDBFMG8gaWZyYW1lIFlvdVR1YmUgXHUwMTExXHUxRUMzIGtcdTAwRURjaCBob1x1MUVBMXQgZXZlbnQgc3RyZWFtXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF5dElkKSByZXR1cm47XG4gICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgaWYgKCFpZnIpIHJldHVybjtcbiAgICBjb25zdCB0ID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWZyLmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdsaXN0ZW5pbmcnIH0pLCAnKicpO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH0sIDE1MDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHQpO1xuICB9LCBbeXRJZCwgcGhvbmcuaWRdKTtcblxuICAvLyBcdTI1MDBcdTI1MDAgVFx1MUVBNk5HIDI6IEtoXHUxRURGaSB0XHUxRUExbyB2XHUwMEUwIGtcdTFFQkZ0IG5cdTFFRDFpIFlvdVR1YmUgSUZyYW1lIFBsYXllciBBUEkgdHJcdTFFRjFjIHRpXHUxRUJGcCB2XHUwMEUwbyBpZnJhbWUgXHUyNTAwXHUyNTAwXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF5dElkKSByZXR1cm47XG4gICAgbGV0IGRlc3Ryb3llZCA9IGZhbHNlO1xuICAgIGxldCByZXRyeVRpbWVyID0gbnVsbDtcbiAgICBsZXQgYXR0ZW1wdHMgPSAwO1xuXG4gICAgLy8gTlx1MUVCRnUgcGxheWVyIFx1MDExMVx1MDBFMyB0XHUxRUQzbiB0XHUxRUExaSB2XHUwMEUwIHNcdTFFQjVuIHNcdTAwRTBuZzogY2h1eVx1MUVDM24gYlx1MDBFMGkgdFx1MUVFOWMgdGhcdTAwRUMgcXVhIGxvYWRWaWRlb0J5SWQgKGtoXHUwMEY0bmcgcmVsb2FkIERPTS9pZnJhbWUpXG4gICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQgJiYgeXRSZWFkeVJlZi5jdXJyZW50ICYmIHR5cGVvZiB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChjdXJyZW50WXRJZFJlZi5jdXJyZW50ICE9PSB5dElkKSB7XG4gICAgICAgICAgY3VycmVudFl0SWRSZWYuY3VycmVudCA9IHl0SWQ7XG4gICAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IDA7XG4gICAgICAgICAgc2V0RHVyYXRpb24oMCk7XG4gICAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgY29uc3Qgc3RhcnRTZWMgPSBOdW1iZXIod2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkKHtcbiAgICAgICAgICAgIHZpZGVvSWQ6IHl0SWQsXG4gICAgICAgICAgICBzdGFydFNlY29uZHM6IHN0YXJ0U2VjXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0xcdTFFRDdpIGxvYWRWaWRlb0J5SWQ6JywgZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY3VycmVudFl0SWRSZWYuY3VycmVudCA9IHl0SWQ7XG4gICAgaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ID0gZmFsc2U7XG5cbiAgICBjb25zdCBraG9pVGFvUGxheWVyID0gKCkgPT4ge1xuICAgICAgaWYgKGRlc3Ryb3llZCkgcmV0dXJuO1xuICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgIGlmICghZWwpIHtcbiAgICAgICAgaWYgKGF0dGVtcHRzKysgPCAzMCkge1xuICAgICAgICAgIHJldHJ5VGltZXIgPSBzZXRUaW1lb3V0KGtob2lUYW9QbGF5ZXIsIDEwMCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXdpbmRvdy5ZVCB8fCAhd2luZG93LllULlBsYXllcikge1xuICAgICAgICBpZiAoYXR0ZW1wdHMrKyA8IDMwKSB7XG4gICAgICAgICAgcmV0cnlUaW1lciA9IHNldFRpbWVvdXQoa2hvaVRhb1BsYXllciwgMTUwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQgPSBuZXcgd2luZG93LllULlBsYXllcihlbCwge1xuICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgb25SZWFkeTogKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChkZXN0cm95ZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgeXRSZWFkeVJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgc2V0WXRQbGF5ZXJSZWFkeSh0cnVlKTtcblxuICAgICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LmdldER1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IGV2ZW50LnRhcmdldC5nZXREdXJhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChkID4gMCkge1xuICAgICAgICAgICAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IGQ7XG4gICAgICAgICAgICAgICAgICBzZXREdXJhdGlvbihkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBDaFx1MUVDOSBzZWVrIDEgbFx1MUVBN24gZHV5IG5oXHUxRUE1dCBsXHUwMEZBYyBraFx1MUVERmkgdFx1MUVBMW8gblx1MUVCRnUgcGhcdTAwRjJuZyBcdTAxMTFhbmcgXHUxRURGIHZcdTFFQ0IgdHJcdTAwRUQgPiAwXG4gICAgICAgICAgICAgIGlmICghaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ICYmIHdhdGNoU3RhdGUucG9zaXRpb25TZWNvbmRzID4gMCAmJiBldmVudC50YXJnZXQuc2Vla1RvKSB7XG4gICAgICAgICAgICAgICAgaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0cnkgeyBldmVudC50YXJnZXQuc2Vla1RvKHdhdGNoU3RhdGUucG9zaXRpb25TZWNvbmRzLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZyAmJiBldmVudC50YXJnZXQucGxheVZpZGVvKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHsgZXZlbnQudGFyZ2V0LnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblN0YXRlQ2hhbmdlOiAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldCAmJiBldmVudC50YXJnZXQuZ2V0RHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gZXZlbnQudGFyZ2V0LmdldER1cmF0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKGQgPiAwICYmIGR1cmF0aW9uUmVmLmN1cnJlbnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSBkO1xuICAgICAgICAgICAgICAgICAgc2V0RHVyYXRpb24oZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gVmlkZW8ga1x1MUVCRnQgdGhcdTAwRkFjOiBrXHUwMEVEY2ggaG9cdTFFQTF0IGNodXlcdTFFQzNuIGJcdTAwRTBpIG5nYXkgbFx1MUVBRHAgdFx1MUVFOWNcbiAgICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGEgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiAhaXNTa2lwcGluZ1JlZi5jdXJyZW50ICYmICFoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdZVCBQbGF5ZXIgb25TdGF0ZUNoYW5nZSA9PT0gMCAoRU5ERUQpIC0+IHRcdTFFRjEgXHUwMTExXHUxRUQ5bmcgY2h1eVx1MUVDM24gdGlcdTFFQkZwIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpJyk7XG4gICAgICAgICAgICAgICAgICBoYW5oRG9uZ1F1ZXVlKCdza2lwJyk7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgIWRhbmdHdWlMZW5oICYmICFpc1NlZWtpbmdSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5kYXRhID09PSAxICYmICF3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3BsYXknLCBldmVudC50YXJnZXQuZ2V0Q3VycmVudFRpbWUoKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5kYXRhID09PSAyICYmIHdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaCgncGF1c2UnLCBldmVudC50YXJnZXQuZ2V0Q3VycmVudFRpbWUoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIFlvdVR1YmUgUGxheWVyIEFQSTonLCBlcnIpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBuYXBZb3VUdWJlSWZyYW1lQXBpKCgpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoa2hvaVRhb1BsYXllciwgMTAwKTtcbiAgICB9KTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBkZXN0cm95ZWQgPSB0cnVlO1xuICAgICAgaWYgKHJldHJ5VGltZXIpIGNsZWFyVGltZW91dChyZXRyeVRpbWVyKTtcbiAgICB9O1xuICB9LCBbeXRJZCwgcGhvbmcuaWQsIGNhbkNvbnRyb2xdKTtcblxuICAvLyBcdTAwQzFwIGRcdTFFRTVuZyB0clx1MUVBMW5nIHRoXHUwMEUxaSBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IHRcdTFFRUIgc2VydmVyIChjaFx1MUVEMW5nIGdpXHUxRUFEdCBjaFx1MUVBRHAgY2hcdTFFRERuIGNobyBjXHUxRUEzIEhvc3QgbFx1MUVBQm4gTmdcdTAxQjBcdTFFRERpIHhlbSlcbiAgY29uc3QgYXBEdW5nRG9uZ0JvID0gKHN0LCBjdHJsLCBwcm92KSA9PiB7XG4gICAgaWYgKCFzdCkgcmV0dXJuO1xuICAgIGNvbnN0IG5vd01zID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCB1cGRhdGVUaW1lTXMgPSBzdC51cGRhdGVkQXQgPyBuZXcgRGF0ZShTdHJpbmcoc3QudXBkYXRlZEF0KS5yZXBsYWNlKCcgJywgJ1QnKSArIChTdHJpbmcoc3QudXBkYXRlZEF0KS5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS5nZXRUaW1lKCkgOiBub3dNcztcbiAgICBjb25zdCBlbGFwc2VkU2VjID0gTWF0aC5tYXgoMCwgKG5vd01zIC0gdXBkYXRlVGltZU1zKSAvIDEwMDApO1xuXG4gICAgbGV0IHRhcmdldFBvcyA9IE51bWJlcihzdC5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgaWYgKHN0LnBsYXlpbmcpIHtcbiAgICAgIHRhcmdldFBvcyA9IE51bWJlcihzdC5iYXNlUG9zaXRpb25TZWNvbmRzIHx8IDApICsgKGVsYXBzZWRTZWMgKiAoc3QucGxheWJhY2tSYXRlIHx8IDEuMCkpO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBOR1VZXHUwMENBTiBUXHUxRUFFQyBWXHUwMEMwTkc6IENIXHUxRUU2IFBIXHUwMEQyTkcgTFx1MDBDMCBOR1VcdTFFRDJOIFBIXHUwMEMxVCAoU09VUkNFIE9GIFRSVVRIKSBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICAvLyBWaWRlbyBjXHUxRUU3YSBDaFx1MUVFNyBwaFx1MDBGMm5nIFx1MDExMWFuZyBwaFx1MDBFMXQgdFx1MUVGMSBuaGlcdTAwRUFuIG1cdTAxQjBcdTFFRTN0IG1cdTAwRTAgNjBmcHMgdHJcdTAwRUFuIFlvdVR1YmUuXG4gICAgLy8gVHV5XHUxRUM3dCBcdTAxMTFcdTFFRDFpIEtIXHUwMEQ0TkcgZ1x1MUVDRGkgc2Vla1RvIGhheSBcdTAwRTlwIHBsYXlWaWRlbyBsXHUwMEUwbSBnaVx1MUVBRHQgbFx1MDBGOWkva2hcdTFFRjFuZyBoXHUwMEVDbmggdmlkZW8gY1x1MUVFN2EgQ2hcdTFFRTcgcGhcdTAwRjJuZyFcbiAgICBpZiAoY3RybCkge1xuICAgICAgaWYgKGlzU2Vla2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICBpZiAocHJvdiA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LmdldEN1cnJlbnRUaW1lKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY3VyID0geXRQbGF5ZXJSZWYuY3VycmVudC5nZXRDdXJyZW50VGltZSgpO1xuICAgICAgICAgIGlmIChjdXIgPiAwICYmICFpc05hTihjdXIpKSBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjdXIpKTtcbiAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBcdTAxMTBcdTFFRDBJIFZcdTFFREFJIEhcdTFFQ0NDIFNJTkggLyBOR1x1MDFBRlx1MUVEQ0kgWEVNIFRST05HIFBIXHUwMEQyTkcgXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgc2V0TG9jYWxUaW1lKE1hdGgubWF4KDAsIE1hdGguZmxvb3IodGFyZ2V0UG9zKSkpO1xuXG4gICAgaWYgKHByb3YgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHYgPSB2aWRlb1JlZi5jdXJyZW50O1xuICAgICAgaWYgKHN0LnBsYXlpbmcpIHtcbiAgICAgICAgY29uc3QgZHJpZnQgPSBNYXRoLmFicyh2LmN1cnJlbnRUaW1lIC0gdGFyZ2V0UG9zKTtcbiAgICAgICAgaWYgKGRyaWZ0ID4gNC4wKSB7XG4gICAgICAgICAgdi5jdXJyZW50VGltZSA9IHRhcmdldFBvcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodi5wYXVzZWQgJiYgKGhhc0ludGVyYWN0ZWQgfHwgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSkge1xuICAgICAgICAgIHYucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCF2LnBhdXNlZCkgdi5wYXVzZSgpO1xuICAgICAgICBjb25zdCBkcmlmdCA9IE1hdGguYWJzKHYuY3VycmVudFRpbWUgLSBzdC5wb3NpdGlvblNlY29uZHMpO1xuICAgICAgICBpZiAoZHJpZnQgPiAyLjApIHtcbiAgICAgICAgICB2LmN1cnJlbnRUaW1lID0gc3QucG9zaXRpb25TZWNvbmRzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcm92ID09PSAnWU9VVFVCRScpIHtcbiAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50ICYmIHl0UGxheWVyUmVmLmN1cnJlbnQuZ2V0UGxheWVyU3RhdGUpIHtcbiAgICAgICAgY29uc3QgcCA9IHl0UGxheWVyUmVmLmN1cnJlbnQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY3VyID0gcC5nZXRDdXJyZW50VGltZSgpIHx8IDA7XG4gICAgICAgICAgY29uc3QgZHJpZnQgPSBNYXRoLmFicyhjdXIgLSB0YXJnZXRQb3MpO1xuICAgICAgICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICAgICAgICAvLyBDaFx1MUVDOSBzZWVrIG5cdTFFQkZ1IGxcdTFFQzdjaCBxdVx1MDBFMSA1IGdpXHUwMEUyeSAodHJcdTAwRTFuaCBnaVx1MUVBRHQgaFx1MDBFQ25oIGxpXHUwMEVBbiB0XHUxRUU1YyBkbyBsXHUxRUM3Y2ggY2xvY2spXG4gICAgICAgICAgICBpZiAoZHJpZnQgPiA1LjApIHtcbiAgICAgICAgICAgICAgcC5zZWVrVG8odGFyZ2V0UG9zLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHBzID0gcC5nZXRQbGF5ZXJTdGF0ZSgpO1xuICAgICAgICAgICAgLy8gQ0hcdTFFQzggZ1x1MUVDRGkgcGxheVZpZGVvIGtoaSBwbGF5ZXIgXHUwMTExYW5nIFRIXHUxRUYwQyBTXHUxRUYwIGJcdTFFQ0IgdFx1MUVBMW0gZFx1MUVFQm5nIChwcyA9PT0gMikgaG9cdTFFQjdjIGN1ZWQgKHBzID09PSA1KVxuICAgICAgICAgICAgaWYgKChwcyA9PT0gMiB8fCBwcyA9PT0gNSkgJiYgKGhhc0ludGVyYWN0ZWQgfHwgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSkge1xuICAgICAgICAgICAgICBwLnBsYXlWaWRlbygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBwcyA9IHAuZ2V0UGxheWVyU3RhdGUoKTtcbiAgICAgICAgICAgIGlmIChwcyA9PT0gMSkgcC5wYXVzZVZpZGVvKCk7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VyIC0gc3QucG9zaXRpb25TZWNvbmRzKSA+IDMuMCkge1xuICAgICAgICAgICAgICBwLnNlZWtUbyhzdC5wb3NpdGlvblNlY29uZHMsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCB7IH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gUG9sbCB0clx1MUVBMW5nIHRoXHUwMEUxaSBtXHUwMEUxeSBjaFx1MUVFNyBtXHUxRUQ3aSAyLjVzXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG4gICAgY29uc3QgZmV0Y2hXYXRjaCA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLXdhdGNoP3Bob25nSWQ9JHtwaG9uZy5pZH1gKTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmICghYWN0aXZlKSByZXR1cm47XG4gICAgICAgIGlmIChkLm9rICYmIGQuc3RhdGUpIHtcbiAgICAgICAgICBzZXRXYXRjaFN0YXRlKGQuc3RhdGUpO1xuICAgICAgICAgIHNldENhbkNvbnRyb2woQm9vbGVhbihkLmNhbkNvbnRyb2wpKTtcbiAgICAgICAgICBpZiAoZC5jYXBzKSBzZXRXYXRjaENhcHMoZC5jYXBzKTtcbiAgICAgICAgICBzZXRQcm92aWRlcihkLnByb3ZpZGVyIHx8ICdVTlNVUFBPUlRFRCcpO1xuICAgICAgICAgIGlmIChkLnBob25nPy52aWRlb1VybCAmJiBkLnBob25nLnZpZGVvVXJsICE9PSBhY3RpdmVWaWRlb1VybCkge1xuICAgICAgICAgICAgc2V0QWN0aXZlVmlkZW9VcmwoZC5waG9uZy52aWRlb1VybCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGFwRHVuZ0RvbmdCbyhkLnN0YXRlLCBCb29sZWFuKGQuY2FuQ29udHJvbCksIGQucHJvdmlkZXIgfHwgJ1VOU1VQUE9SVEVEJyk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggeyB9XG4gICAgfTtcblxuICAgIGZldGNoV2F0Y2goKTtcbiAgICBjb25zdCB0aW1lciA9IHNldEludGVydmFsKGtoaUhpZW5UaGkoZmV0Y2hXYXRjaCksIDI1MDApO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBhY3RpdmUgPSBmYWxzZTtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgIH07XG4gIH0sIFtwaG9uZy5pZCwgaGFzSW50ZXJhY3RlZF0pO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBUXHUxRUE2TkcgMyAmIDQ6IFBvc2l0aW9uYWwgV2F0Y2hkb2cgJiBDXHUxRUFEcCBuaFx1MUVBRHQgbG9jYWxUaW1lIG1cdTAxQjBcdTFFRTN0IG1cdTAwRTAgXHUyNTAwXHUyNTAwXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF3YXRjaFN0YXRlLnBsYXlpbmcpIHJldHVybjtcbiAgICBjb25zdCB0aWNrID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKGlzU2Vla2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG5cbiAgICAgIGxldCBjdXJUaW1lID0gbnVsbDtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBwID0geXRQbGF5ZXJSZWYuY3VycmVudDtcbiAgICAgICAgICBpZiAocC5nZXREdXJhdGlvbikge1xuICAgICAgICAgICAgY29uc3QgZCA9IHAuZ2V0RHVyYXRpb24oKTtcbiAgICAgICAgICAgIGlmIChkID4gMCkge1xuICAgICAgICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gZDtcbiAgICAgICAgICAgICAgaWYgKGR1cmF0aW9uID09PSAwKSBzZXREdXJhdGlvbihkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHAuZ2V0Q3VycmVudFRpbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1ciA9IHAuZ2V0Q3VycmVudFRpbWUoKTtcbiAgICAgICAgICAgIGlmIChjdXIgIT09IHVuZGVmaW5lZCAmJiBjdXIgIT09IG51bGwgJiYgIWlzTmFOKGN1cikpIHtcbiAgICAgICAgICAgICAgY3VyVGltZSA9IGN1cjtcbiAgICAgICAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IoY3VyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwLmdldFBsYXllclN0YXRlICYmIHAuZ2V0UGxheWVyU3RhdGUoKSA9PT0gMCkge1xuICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgIWlzU2tpcHBpbmdSZWYuY3VycmVudCAmJiAhaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdQbGF5ZXJTdGF0ZSA9PT0gMCAtPiB0XHUxRUYxIFx1MDExMVx1MUVEOW5nIGNodXlcdTFFQzNuIHRpXHUxRUJGcCBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaScpO1xuICAgICAgICAgICAgICBoYW5oRG9uZ1F1ZXVlKCdza2lwJyk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2gge31cbiAgICAgIH1cblxuICAgICAgLy8gR2lcdTAwRTFtIHNcdTAwRTF0IHZcdTFFQ0IgdHJcdTAwRUQ6IG5cdTFFQkZ1IHZpZGVvIFx1MDExMVx1MDBFMyBwaFx1MDBFMXQgXHUwMTExXHUxRUJGbiBnaVx1MDBFMnkgY3VcdTFFRDFpIGNcdTAwRjluZyBob1x1MUVCN2MgcXVcdTAwRTEgZHVyYXRpb25cbiAgICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgICBjb25zdCBjdXJyZW50UG9zID0gY3VyVGltZSAhPT0gbnVsbCA/IGN1clRpbWUgOiBsb2NhbFRpbWU7XG4gICAgICBpZiAobWF4RHVyID4gNSAmJiAoY3VycmVudFBvcyA+PSBtYXhEdXIgLSAxLjIgfHwgbG9jYWxUaW1lID49IG1heER1cikpIHtcbiAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgIWlzU2tpcHBpbmdSZWYuY3VycmVudCAmJiAhaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFBvc2l0aW9uYWwgV2F0Y2hkb2c6IGN1cnJlbnRQb3MgKCR7Y3VycmVudFBvcy50b0ZpeGVkKDEpfXMpID49IGR1cmF0aW9uICgke21heER1cn1zKSAtPiB0XHUxRUYxIFx1MDExMVx1MUVEOW5nIGNodXlcdTFFQzNuIHRpXHUxRUJGcGApO1xuICAgICAgICAgIGhhbmhEb25nUXVldWUoJ3NraXAnKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGN1clRpbWUgPT09IG51bGwpIHtcbiAgICAgICAgc2V0TG9jYWxUaW1lKHQgPT4gKG1heER1ciA+IDAgPyBNYXRoLm1pbih0ICsgMSwgTWF0aC5mbG9vcihtYXhEdXIpKSA6IHQgKyAxKSk7XG4gICAgICB9XG4gICAgfSwgMTAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodGljayk7XG4gIH0sIFt3YXRjaFN0YXRlLnBsYXlpbmcsIHByb3ZpZGVyLCBkdXJhdGlvbiwgbG9jYWxUaW1lLCBjYW5Db250cm9sXSk7XG5cbiAgLy8gR1x1MUVFRGkgbFx1MUVDN25oIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gKFBsYXkgLyBQYXVzZSAvIFNlZWspXG4gIGNvbnN0IGd1aUxlbmggPSBhc3luYyAoYWN0aW9uLCBjdXN0b21Qb3MpID0+IHtcbiAgICBpZiAoZGFuZ0d1aUxlbmgpIHJldHVybjtcbiAgICBzZXREYW5nR3VpTGVuaCh0cnVlKTtcbiAgICBzZXRMb2koJycpO1xuXG4gICAgbGV0IHBvcyA9IGN1c3RvbVBvcztcbiAgICBpZiAocG9zID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgICBwb3MgPSB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lO1xuICAgICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LmdldEN1cnJlbnRUaW1lKSB7XG4gICAgICAgIHBvcyA9IHl0UGxheWVyUmVmLmN1cnJlbnQuZ2V0Q3VycmVudFRpbWUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBvcyA9IGxvY2FsVGltZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcG9zID0gTWF0aC5tYXgoMCwgTnVtYmVyKChwb3MgfHwgMCkudG9GaXhlZCgyKSkpO1xuXG4gICAgLy8gQ1x1MUVBRHAgbmhcdTFFQUR0IGxcdTFFQTFjIHF1YW4gdHJcdTAwRUFuIGxvY2FsIHBsYXllclxuICAgIGlmIChhY3Rpb24gPT09ICdwbGF5Jykge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wbGF5VmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoJ3tcImV2ZW50XCI6XCJjb21tYW5kXCIsXCJmdW5jXCI6XCJwbGF5VmlkZW9cIixcImFyZ3NcIjpcIlwifScsICcqJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdwYXVzZScpIHtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkgdmlkZW9SZWYuY3VycmVudC5wYXVzZSgpO1xuICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8ucGF1c2VWaWRlbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoJ3tcImV2ZW50XCI6XCJjb21tYW5kXCIsXCJmdW5jXCI6XCJwYXVzZVZpZGVvXCIsXCJhcmdzXCI6XCJcIn0nLCAnKicpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAnc2VlaycpIHtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkgdmlkZW9SZWYuY3VycmVudC5jdXJyZW50VGltZSA9IHBvcztcbiAgICAgIGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnNlZWtUbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQuc2Vla1RvKHBvcywgdHJ1ZSk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbcG9zLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctd2F0Y2gnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgIGFjdGlvbixcbiAgICAgICAgICBwb3NpdGlvbjogcG9zLFxuICAgICAgICAgIGV4cGVjdGVkUmV2aXNpb246IHdhdGNoU3RhdGUucmV2aXNpb24sXG4gICAgICAgICAgcGxheWJhY2tSYXRlOiB3YXRjaFN0YXRlLnBsYXliYWNrUmF0ZSB8fCAxLjBcbiAgICAgICAgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKGQuc3RhdGUucG9zaXRpb25TZWNvbmRzIHx8IHBvcykpO1xuICAgICAgfSBlbHNlIGlmIChkLmNvbmZsaWN0ICYmIGQuc3RhdGUpIHtcbiAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgYXBEdW5nRG9uZ0JvKGQuc3RhdGUsIGNhbkNvbnRyb2wsIHByb3ZpZGVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldExvaShkLmxvaSB8fCAnTFx1MUVEN2kgY1x1MUVBRHAgbmhcdTFFQUR0IHBoXHUwMEUxdCB2aWRlby4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaSgnTVx1MUVBNXQga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldERhbmdHdWlMZW5oKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gXHUwMTEwXHUxRUQzbmcgYlx1MUVEOSB2XHUxRUNCIHRyXHUwMEVEIHZpZGVvIGhpXHUxRUM3biB0XHUxRUExaSByYSBuZ29cdTAwRTBpIFx1MDExMVx1MUVDMyBjaGF0IGdcdTFFQUZuIHRpbWVzdGFtcFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh2aWRlb1RpbWVSZWYpIHZpZGVvVGltZVJlZi5jdXJyZW50ID0gbG9jYWxUaW1lO1xuICB9LCBbbG9jYWxUaW1lLCB2aWRlb1RpbWVSZWZdKTtcblxuXG5cbiAgLy8gTmhcdTFFQURuIHlcdTAwRUF1IGNcdTFFQTd1IHR1YSB0XHUxRUVCIFN0dWR5RG9jayAoYlx1MUVBNW0gbVx1MUVEMWMgdmlkZW8gdHJvbmcgY2hhdC9naGkgY2hcdTAwRkEpLlxuICAvLyBDXHUwMEYzIHF1eVx1MUVDMW4gXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiBcdTIxOTIgcGhcdTAwRTF0IGxcdTFFQzduaCBzZWVrIGNodW5nOyBraFx1MDBGNG5nIFx1MjE5MiBjaFx1MUVDOSB0dWEgY1x1MUVFNWMgYlx1MUVEOSBwbGF5ZXIgY1x1MUVFN2EgbVx1MDBFQ25oLlxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IG9uU2Vla1JlcSA9IChlKSA9PiB7XG4gICAgICBpZiAoZS5kZXRhaWw/LnBob25nSWQgIT09IHBob25nLmlkKSByZXR1cm47XG4gICAgICBjb25zdCBzZWMgPSBNYXRoLm1heCgwLCBOdW1iZXIoZS5kZXRhaWwuc2VjKSB8fCAwKTtcbiAgICAgIGlmIChjYW5Db250cm9sKSB7XG4gICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBzZWMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lID0gc2VjO1xuICAgICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LnNlZWtUbykgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8oc2VjLCB0cnVlKTtcbiAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3Ioc2VjKSk7XG4gICAgICB9XG4gICAgfTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc3Itc2VlaycsIG9uU2Vla1JlcSk7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdzci1zZWVrJywgb25TZWVrUmVxKTtcbiAgfSwgW3Bob25nLmlkLCBjYW5Db250cm9sLCBwcm92aWRlciwgd2F0Y2hTdGF0ZS5yZXZpc2lvbl0pO1xuXG4gIGNvbnN0IGhhbmRsZVN0YXJ0Vmlld2luZyA9ICgpID0+IHtcbiAgICBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHNldEhhc0ludGVyYWN0ZWQodHJ1ZSk7XG4gICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICBjb25zdCB2ID0gdmlkZW9SZWYuY3VycmVudDtcbiAgICAgIGNvbnN0IHAgPSB2LnBsYXkoKTtcbiAgICAgIGlmIChwICYmIHR5cGVvZiBwLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcC50aGVuKCgpID0+IHtcbiAgICAgICAgICBpZiAoIXdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICAgICAgdi5wYXVzZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBsYXlWaWRlbykge1xuICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICB9XG4gICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoJ3tcImV2ZW50XCI6XCJjb21tYW5kXCIsXCJmdW5jXCI6XCJwbGF5VmlkZW9cIixcImFyZ3NcIjpcIlwifScsICcqJyk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC00IG1pbi13LTAgdy1mdWxsXCI+XG4gICAgICB7LyogS2h1bmcgcGhcdTAwRTF0IHZpZGVvIGNoXHUwMEVEbmggXHUyMDE0IGtodW5nIG5lb24gbVx1MUVERCBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGhcdTFFQzcgZ2FtZSBhcmVuYSAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgdy1mdWxsIGFzcGVjdC12aWRlbyBiZy1ncmFkaWVudC10by1iIGZyb20tWyMwNTA3MGJdIHRvLWJsYWNrIHJvdW5kZWQtMnhsIG92ZXJmbG93LWhpZGRlbiBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8xNSByaW5nLTEgcmluZy13aGl0ZS81IHNoYWRvdy1bMF8wXzYwcHhfcmdiYSgwLDI0MiwyNTQsMC4wNyksMF8zMHB4XzYwcHhfLTE1cHhfcmdiYSgwLDAsMCwwLjcpXVwiPlxuICAgICAgICB7LyogT3ZlcmxheSBBdXRvcGxheSAvIEdlc3R1cmUgY2hvIG5nXHUwMUIwXHUxRUREaSB4ZW0gKi99XG4gICAgICAgIHshaGFzSW50ZXJhY3RlZCAmJiAhY2FuQ29udHJvbCAmJiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyB8fCBwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScpICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgei0yMCBiZy1ibGFjay83NSBiYWNrZHJvcC1ibHVyLXNtIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNCB0ZXh0LWNlbnRlciBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTE0IGgtMTQgcm91bmRlZC1mdWxsIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LTJ4bCBtYi0zIHNoYWRvdy1bMF8wXzI1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGFuaW1hdGUtcHVsc2VcIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERkFDXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlIG1iLTFcIj5YZW0gQ2h1bmcgQ1x1MDBGOW5nIFBoXHUwMEYybmc8L3A+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIG1heC13LXhzIG1iLTRcIj5cbiAgICAgICAgICAgICAgQlx1MUVBNW0gblx1MDBGQXQgYlx1MDBFQW4gZFx1MDFCMFx1MUVEQmkgXHUwMTExXHUxRUMzIGNcdTFFQTVwIHF1eVx1MUVDMW4gXHUwMEUybSB0aGFuaCB2XHUwMEUwIGNcdTAwRjluZyB0aGVvIGRcdTAwRjVpIHRpbWVsaW5lIHZcdTFFREJpIGNoXHUxRUU3IHBoXHUwMEYybmcuXG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiYnRuLXZpZXdlci1zdGFydC13YXRjaFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVTdGFydFZpZXdpbmd9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMi41IHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzNCODJGNl0gdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQteHMgc2hhZG93LWxnIGhvdmVyOm9wYWNpdHktOTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MjVCNjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVBRnQgXHUwMTExXHUxRUE3dSB4ZW0gY1x1MDBGOW5nIHBoXHUwMEYybmc8L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVmlkZW8gZWxlbWVudHMgdGhlbyBwcm92aWRlciAqL31cbiAgICAgICAge3l0SWQgPyAoXG4gICAgICAgICAgPGRpdiBrZXk9e2B5dC13cmFwLSR7cGhvbmcuaWR9YH0gY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCByZWxhdGl2ZSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBiZy1ibGFja1wiPlxuICAgICAgICAgICAgPGlmcmFtZVxuICAgICAgICAgICAgICBpZD17eXRDb250YWluZXJJZH1cbiAgICAgICAgICAgICAga2V5PXtgeXQtZnJhbWUtJHtwaG9uZy5pZH1gfVxuICAgICAgICAgICAgICBzcmM9e2BodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8ke3l0SWR9P2F1dG9wbGF5PSR7d2F0Y2hTdGF0ZS5wbGF5aW5nID8gMSA6IDB9JmVuYWJsZWpzYXBpPTEmb3JpZ2luPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmxvY2F0aW9uLm9yaWdpbiA6ICcnKX0md2lkZ2V0X3JlZmVycmVyPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmxvY2F0aW9uLmhyZWYgOiAnJyl9JnJlbD0wJm1vZGVzdGJyYW5kaW5nPTEmcGxheXNpbmxpbmU9MWB9XG4gICAgICAgICAgICAgIHRpdGxlPXtwaG9uZy50ZW4gfHwgJ1lvdVR1YmUgVmlkZW8nfVxuICAgICAgICAgICAgICBhbGxvdz1cImFjY2VsZXJvbWV0ZXI7IGF1dG9wbGF5OyBjbGlwYm9hcmQtd3JpdGU7IGVuY3J5cHRlZC1tZWRpYTsgZ3lyb3Njb3BlOyBwaWN0dXJlLWluLXBpY3R1cmU7IHdlYi1zaGFyZVwiXG4gICAgICAgICAgICAgIGFsbG93RnVsbFNjcmVlblxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIGJvcmRlci0wXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBkcnZJZCA/IChcbiAgICAgICAgICA8aWZyYW1lXG4gICAgICAgICAgICBzcmM9e2BodHRwczovL2RyaXZlLmdvb2dsZS5jb20vZmlsZS9kLyR7ZHJ2SWR9L3ByZXZpZXdgfVxuICAgICAgICAgICAgdGl0bGU9e3Bob25nLnRlbn1cbiAgICAgICAgICAgIGFsbG93PVwiYXV0b3BsYXk7IGZ1bGxzY3JlZW5cIlxuICAgICAgICAgICAgYWxsb3dGdWxsU2NyZWVuXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsXCJcbiAgICAgICAgICAvPlxuICAgICAgICApIDogdHJ1Y1RpZXBVcmwgPyAoXG4gICAgICAgICAgPHZpZGVvXG4gICAgICAgICAgICByZWY9e3ZpZGVvUmVmfVxuICAgICAgICAgICAgc3JjPXt0cnVjVGllcFVybH1cbiAgICAgICAgICAgIHBsYXlzSW5saW5lXG4gICAgICAgICAgICBkYXRhLXRlc3RpZD1cInN0dWR5LXZpZGVvLXBsYXllclwiXG4gICAgICAgICAgICBjb250cm9scz17Y2FuQ29udHJvbH1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvbnRhaW5cIlxuICAgICAgICAgICAgb25Mb2FkZWRNZXRhZGF0YT17ZSA9PiB7XG4gICAgICAgICAgICAgIGlmIChlLnRhcmdldC5kdXJhdGlvbiA+IDApIHNldER1cmF0aW9uKGUudGFyZ2V0LmR1cmF0aW9uKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvblBsYXk9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgIXdhdGNoU3RhdGUucGxheWluZyAmJiAhZGFuZ0d1aUxlbmgpIHtcbiAgICAgICAgICAgICAgICBndWlMZW5oKCdwbGF5JywgdmlkZW9SZWYuY3VycmVudD8uY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25QYXVzZT17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiB3YXRjaFN0YXRlLnBsYXlpbmcgJiYgIWRhbmdHdWlMZW5oKSB7XG4gICAgICAgICAgICAgICAgZ3VpTGVuaCgncGF1c2UnLCB2aWRlb1JlZi5jdXJyZW50Py5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvbkVuZGVkPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sKSBoYW5oRG9uZ1F1ZXVlKCdza2lwJyk7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25TZWVrZWQ9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFjYW5Db250cm9sIHx8IGRhbmdHdWlMZW5oIHx8IGlzU2Vla2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICAgICAgICAgIGNvbnN0IGN1ciA9IHZpZGVvUmVmLmN1cnJlbnQ/LmN1cnJlbnRUaW1lO1xuICAgICAgICAgICAgICBpZiAoY3VyID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgLy8gQ2hcdTFFRDFuZyB2XHUwMEYybmcgbFx1MUVCN3A6IG1cdTFFQ0RpIGdcdTAwRTFuIGN1cnJlbnRUaW1lIG5cdTFFRDlpIGJcdTFFRDkgKG9wdGltaXN0aWMgc2VlaywgZHJpZnQtY29ycmVjdGlvblxuICAgICAgICAgICAgICAvLyBjXHUxRUU3YSBhcER1bmdEb25nQm8pIFx1MDExMVx1MUVDMXUgYlx1MUVBRm4gJ3NlZWtlZCcuIENoXHUxRUM5IGdcdTFFRURpIGxcdTFFQzduaCBraGkgdlx1MUVDQiB0clx1MDBFRCBsXHUxRUM3Y2gga2hcdTFFQ0ZpXG4gICAgICAgICAgICAgIC8vIHZcdTFFQ0IgdHJcdTAwRUQgc2VydmVyIGtcdTFFRjMgdlx1MUVDRG5nID4xLjVzIFx1MjAxNCB0XHUxRUU5YyBuZ1x1MDFCMFx1MUVERGkgZFx1MDBGOW5nIHRoXHUxRUFEdCBzXHUxRUYxIHR1YSBxdWEgdGhhbmggY29udHJvbHMuXG4gICAgICAgICAgICAgIGNvbnN0IHN0ID0gd2F0Y2hTdGF0ZTtcbiAgICAgICAgICAgICAgY29uc3QgdXBkTXMgPSBzdD8udXBkYXRlZEF0ID8gbmV3IERhdGUoU3RyaW5nKHN0LnVwZGF0ZWRBdCkucmVwbGFjZSgnICcsICdUJykgKyAoU3RyaW5nKHN0LnVwZGF0ZWRBdCkuaW5jbHVkZXMoJ1QnKSA/ICcnIDogJ1onKSkuZ2V0VGltZSgpIDogRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgY29uc3QgZWxhcHNlZCA9IE1hdGgubWF4KDAsIChEYXRlLm5vdygpIC0gdXBkTXMpIC8gMTAwMCk7XG4gICAgICAgICAgICAgIGNvbnN0IGt5Vm9uZyA9IHN0Py5wbGF5aW5nXG4gICAgICAgICAgICAgICAgPyBOdW1iZXIoc3QuYmFzZVBvc2l0aW9uU2Vjb25kcyB8fCAwKSArIGVsYXBzZWQgKiAoc3QucGxheWJhY2tSYXRlIHx8IDEpXG4gICAgICAgICAgICAgICAgOiBOdW1iZXIoc3Q/LnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGN1ciAtIGt5Vm9uZykgPiAxLjUpIGd1aUxlbmgoJ3NlZWsnLCBjdXIpO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICAvPlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgaC1mdWxsIHRleHQteHMgdGV4dC1zbGF0ZS01MDAgcC02IHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBtYi0yXCI+XHUyNkEwXHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+TGluayB2aWRlbyBraFx1MDBGNG5nIGhcdTFFRDcgdHJcdTFFRTMgcGhcdTAwRTF0IHRyXHUxRUYxYyB0aVx1MUVCRnAgaG9cdTFFQjdjIGtoXHUwMEY0bmcgaFx1MUVFM3AgbFx1MUVDNy48L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIFRoXHUwMEY0bmcgYlx1MDBFMW8gcmlcdTAwRUFuZyBjaG8gR29vZ2xlIERyaXZlICovfVxuICAgICAge2RydklkICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zLjUgcHktMiBiZy1hbWJlci01MDAvMTAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMjAgcm91bmRlZC14bCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIHRleHQtYW1iZXItMzAwXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbVwiPlx1MjEzOVx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICA8c3Bhbj5Hb29nbGUgRHJpdmUgcGhcdTAwRTF0IFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgPHN0cm9uZz5YZW0gXHUwMTExXHUxRUQ5YyBsXHUxRUFEcDwvc3Ryb25nPiAoR29vZ2xlIERyaXZlIGtoXHUwMEY0bmcgaFx1MUVENyB0clx1MUVFMyBBUEkgXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiB0XHUxRUVCIHhhKS48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIFRoYW5oIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gSG9zdCBcdTIwMTQgXHUxRUE5biBraGkgZnVsbHNjcmVlbiAqL31cbiAgICAgIHshaXNSb29tV2lkZSAmJiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzE2MWIyNl0gdG8tWyMwZjE0MWRdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzEwIHJvdW5kZWQtMnhsIHAtMyBzbTpwLTMuNSBmbGV4IGZsZXgtY29sIGdhcC0zIHNoYWRvdy14bFwiPlxuXG5cbiAgICAgICAgey8qIFRoYW5oIGNcdTAwRjRuZyBjXHUxRUU1IHBoXHUwMEUxdCBjaHVuZyAoY2hcdTFFQzkgaGlcdTFFQzNuIHRoXHUxRUNCIGNobyBIb3N0IC8gVGVhY2hlciBraGkgZFx1MDBGOW5nIHByb3ZpZGVyIGNcdTAwRjMgdGhcdTFFQzMgXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbikgKi99XG4gICAgICAgIHtjYW5Db250cm9sICYmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgfHwgcHJvdmlkZXIgPT09ICdZT1VUVUJFJykgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBpdGVtcy1jZW50ZXIgZ2FwLTMgcHQtMiBib3JkZXItdCBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJidG4taG9zdC13YXRjaC10b2dnbGVcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCh3YXRjaFN0YXRlLnBsYXlpbmcgPyAncGF1c2UnIDogJ3BsYXknKX1cbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgc206dy1hdXRvIHB4LTQgcHktMiByb3VuZGVkLXhsIGZvbnQtYmxhY2sgdGV4dC14cyB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMS41IHNoYWRvdy1tZCBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXIgZGlzYWJsZWQ6b3BhY2l0eS01MCAke1xuICAgICAgICAgICAgICAgIHdhdGNoU3RhdGUucGxheWluZ1xuICAgICAgICAgICAgICAgICAgPyAnYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzQwIGhvdmVyOmJnLWFtYmVyLTUwMC8zMCBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMjQ1LDE1OCwxMSwwLjI1KV0nXG4gICAgICAgICAgICAgICAgICA6ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMDBjNmZmXSB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGhvdmVyOmJyaWdodG5lc3MtMTEwJ1xuICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgIDxzcGFuPnt3YXRjaFN0YXRlLnBsYXlpbmcgPyAnXHUyM0Y4JyA6ICdcdTI1QjYnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+e3dhdGNoU3RhdGUucGxheWluZyA/ICdUXHUxRUExbSBEXHUxRUVCbmcgQ1x1MUVBMyBQaFx1MDBGMm5nJyA6ICdQaFx1MDBFMXQgQ2h1bmcgQ1x1MUVBMyBQaFx1MDBGMm5nJ308L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSB3LWZ1bGxcIj5cbiAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJob3N0LWR1cmF0aW9uLWxhYmVsXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1tb25vIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAge2RpbmhEYW5nR2lheVBodXQobG9jYWxUaW1lKX1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICBpZD1cImhvc3Qtc2Vlay1zbGlkZXJcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJyYW5nZVwiXG4gICAgICAgICAgICAgICAgbWluPVwiMFwiXG4gICAgICAgICAgICAgICAgbWF4PXtkdXJhdGlvbiA+IDAgPyBkdXJhdGlvbiA6IE1hdGgubWF4KGxvY2FsVGltZSwgMzAwKX1cbiAgICAgICAgICAgICAgICBzdGVwPVwiMVwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e2xvY2FsVGltZX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlRG93bj17KCkgPT4geyBpc1NlZWtpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgb25Ub3VjaFN0YXJ0PXsoKSA9PiB7IGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRMb2NhbFRpbWUoTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSl9XG4gICAgICAgICAgICAgICAgb25Nb3VzZVVwPXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oKCdzZWVrJywgTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBvblRvdWNoRW5kPXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oKCdzZWVrJywgTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgaC0xLjUgYmctd2hpdGUvMTAgcm91bmRlZC1sZyBhcHBlYXJhbmNlLW5vbmUgY3Vyc29yLXBvaW50ZXIgYWNjZW50LVsjMDBGMkZFXVwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIHtkdXJhdGlvbiA+IDAgPyBkaW5oRGFuZ0dpYXlQaHV0KGR1cmF0aW9uKSA6ICctLTotLSd9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHtsb2kgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXJvc2UtNDAwXCI+e2xvaX08L3A+fVxuICAgICAgICB7cGhvbmcubW9UYSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCBsZWFkaW5nLXJlbGF4ZWQgcHQtMVwiPntwaG9uZy5tb1RhfTwvcD59XG5cbiAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIFx1MjUwMFx1MjUwMFx1MjUwMCBWXHUwMEQ5TkcgMTogVFJVTkcgVFx1MDBDMk0gQ1x1MUVBNFUgSFx1MDBDQ05IIFZJREVPICYgSFx1MDBDME5HIFx1MDExMFx1MUVFMkkgWU9VVFVCRSBUUlx1MUVGMEMgVElcdTFFQkVQIFx1MjUwMFx1MjUwMFx1MjUwMCAqL31cbiAgICAgIHshaXNSb29tV2lkZSAmJiAoXG4gICAgICAgIDxkaXYgaWQ9XCJ2dW5nMS15b3V0dWJlLXN0dWRpb1wiIHN0eWxlPXt7IG92ZXJmbG93QW5jaG9yOiAnbm9uZScgfX0gY2xhc3NOYW1lPVwiYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMTYxYjI2XSB0by1bIzBmMTQxZF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTMuNSBzbTpwLTQgZmxleCBmbGV4LWNvbCBnYXAtMyBzaGFkb3cteGxcIj5cbiAgICAgICAgICB7LyogSGVhZGVyIHRydW5nIHRcdTAwRTJtICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIHBiLTIuNSBib3JkZXItYiBib3JkZXItd2hpdGUvMTAgZmxleC13cmFwXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInctOCBoLTggcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1iciBmcm9tLVsjMDBGMkZFXS8yMCB0by12aW9sZXQtNTAwLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtc20gc2hhZG93LVswXzBfMTJweF9yZ2JhKDAsMjQyLDI1NCwwLjI1KV1cIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0NcdURGQUNcbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHNtOnRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPkNcdTFFQTV1IGhcdTAwRUNuaCBWaWRlbyAmIEhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIFlvdVR1YmU8L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZC1mdWxsIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RofSBcdTAxMTFhbmcgY2hcdTFFRERcbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwXCI+VFx1MDBFQ20ga2lcdTFFQkZtIHZpZGVvLCBcdTAxMTFcdTAxQjBhIHZcdTAwRTBvIGhcdTAwRTBuZyBjaFx1MUVERCB2XHUwMEUwIGNoXHUxRUExeSB2aWRlbyBraFx1MDBFMWMgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBjXHUxRUEzIHBoXHUwMEYybmc8L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICB7LyogVGFiIHNlbGVjdG9yICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGJnLVsjMEIwRTE0XSBwLTEgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi1tZWRpYS10YWItc2VhcmNoXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldE1lZGlhVGFiKCdzZWFyY2gnKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMS41IHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgICAgICAgIG1lZGlhVGFiID09PSAnc2VhcmNoJ1xuICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LW1kJ1xuICAgICAgICAgICAgICAgICAgICAgIDogJ3RleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMEQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5UXHUwMEVDbSBZb3VUdWJlPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tbWVkaWEtdGFiLXF1ZXVlXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldE1lZGlhVGFiKCdxdWV1ZScpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgICAgICAgbWVkaWFUYWIgPT09ICdxdWV1ZSdcbiAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tdmlvbGV0LTUwMCB0by1mdWNoc2lhLTUwMCB0ZXh0LXdoaXRlIHNoYWRvdy1tZCdcbiAgICAgICAgICAgICAgICAgICAgICA6ICd0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0NCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+SFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgKHtxdWV1ZUxpc3QuZmlsdGVyKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnKS5sZW5ndGh9KTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgey8qIFRvZ2dsZSB0aHUgZ1x1MUVDRG4gKi99XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBpZD1cImJ0bi10b2dnbGUtc3R1ZGlvXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREYU1vUm9uZ1N0dWRpbyghZGFNb1JvbmdTdHVkaW8pfVxuICAgICAgICAgICAgICAgIHRpdGxlPXtkYU1vUm9uZ1N0dWRpbyA/ICdUaHUgZ1x1MUVDRG4nIDogJ01cdTFFREYgclx1MUVEOW5nJ31cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTggaC04IHJvdW5kZWQteGwgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICB7ZGFNb1JvbmdTdHVkaW8gPyAnXHUyNUIyJyA6ICdcdTI1QkMnfVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgey8qIFRvYXN0IHRoXHUwMEY0bmcgYlx1MDBFMW8gLyBMXHUxRUQ3aSAqL31cbiAgICAgICAgICB7dGhvbmdCYW9WaWRlbyAmJiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMiByb3VuZGVkLXhsIGJnLWVtZXJhbGQtNTAwLzE1IGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMzAgdGV4dC1lbWVyYWxkLTMwMCB0ZXh0LXhzIGZvbnQtYm9sZCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTI3Mjg8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPnt0aG9uZ0Jhb1ZpZGVvfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG4gICAgICAgICAge2xvaVZpZGVvICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMyBweS0yIHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTUgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0ZXh0LXJvc2UtMzAwIHRleHQteHMgZm9udC1ib2xkIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGFuaW1hdGUtZmFkZUluXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MjZBMFx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+e2xvaVZpZGVvfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG5cbiAgICAgICAgICB7ZGFNb1JvbmdTdHVkaW8gJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLVszNDBweF0gZmxleCBmbGV4LWNvbCBtaW4taC0wIG92ZXJmbG93LWhpZGRlblwiPlxuICAgICAgICAgICAgICB7LyogVEFCIDE6IFRcdTAwQ0NNIEtJXHUxRUJFTSBZT1VUVUJFICYgXHUwMTEwXHUxRUQ0SSBWSURFTyAqL31cbiAgICAgICAgICAgICAge21lZGlhVGFiID09PSAnc2VhcmNoJyAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLWZ1bGwgZmxleCBmbGV4LWNvbCBnYXAtMi41IG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgIHsvKiBcdTAwRDQgdFx1MDBFQ20ga2lcdTFFQkZtIC8gZFx1MDBFMW4gbGluayBcdTAxMTFhIG5cdTAxMDNuZyAqL31cbiAgICAgICAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXsoZSkgPT4gdGltS2llbVlvdVR1YmUoZSl9IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTIgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgZmxleC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBsZWZ0LTMgdG9wLTEvMiAtdHJhbnNsYXRlLXktMS8yIHRleHQtc2xhdGUtNDAwIHRleHQteHNcIj5cdUQ4M0RcdUREMEQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC12dW5nMS15b3V0dWJlLXNlYXJjaFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3l0UXVlcnl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFl0UXVlcnkoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIk5oXHUxRUFEcCB0XHUxRUVCIGtoXHUwMEYzYSB0XHUwMEVDbSBraVx1MUVCRm0gWW91VHViZSAodmQ6IGxvZmkgaFx1MUVDRGMgYlx1MDBFMGkuLi4pIGhvXHUxRUI3YyBkXHUwMEUxbiBsaW5rIHZpZGVvLi4uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNjAgcm91bmRlZC14bCBwbC04IHByLTMgcHktMiB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSB0cmFuc2l0aW9uLWFsbFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtdGltLWtpZW1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF5dFF1ZXJ5LnRyaW0oKSB8fCBzZWFyY2hpbmdZdH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMuNSBweS0yIHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQteHMgaG92ZXI6YnJpZ2h0bmVzcy0xMTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIHNoYWRvdy1tZCBkaXNhYmxlZDpvcGFjaXR5LTQwIHdoaXRlc3BhY2Utbm93cmFwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzZWFyY2hpbmdZdCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhbmltYXRlLXNwaW5cIj5cdTIzRjM8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHUwMTEwYW5nIHRcdTAwRUNtLi4uPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDBEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlRcdTAwRUNtIGtpXHUxRUJGbTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICB7LyogQWN0aW9uIGJ1dHRvbnMgcGhcdTFFRTUga2hpIFx1MDBGNCBpbnB1dCBsXHUwMEUwIDEgbGluayB2aWRlbyB0clx1MUVGMWMgdGlcdTFFQkZwICovfVxuICAgICAgICAgICAgICAgICAgICB7Qm9vbGVhbih5dFF1ZXJ5LnRyaW0oKS5zdGFydHNXaXRoKCdodHRwOi8vJykgfHwgeXRRdWVyeS50cmltKCkuc3RhcnRzV2l0aCgnaHR0cHM6Ly8nKSB8fCB5dFF1ZXJ5LmluY2x1ZGVzKCd5b3V0dScpKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBwLTIgcm91bmRlZC14bCBiZy1bIzBCMEUxNF0vODAgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMjAgZmxleC13cmFwIGFuaW1hdGUtZmFkZUluXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMTc8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlBoXHUwMEUxdCBoaVx1MUVDN24gbGlcdTAwRUFuIGtcdTFFQkZ0IHZpZGVvOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLXBoYXQtbmdheS1saW5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZG9pVmlkZW8oeXRRdWVyeS50cmltKCksICdWaWRlbyB0XHUxRUVCIGxpXHUwMEVBbiBrXHUxRUJGdCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0RvaVZpZGVvfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXSB0ZXh0LWJsYWNrIHRleHQteHMgZm9udC1ibGFjayBob3ZlcjpiZy1bIzAwZTFlY10gYWN0aXZlOnNjYWxlLTk1IHNoYWRvdy1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYgUGhcdTAwRTF0IG5nYXkgY1x1MUVBMyBwaFx1MDBGMm5nXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLWVucXVldWUtbGlua1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ2VucXVldWUnLCB7IHZpZGVvVXJsOiB5dFF1ZXJ5LnRyaW0oKSwgdGl0bGU6ICdWaWRlbyB0XHUxRUVCIGxpXHUwMEVBbiBrXHUxRUJGdCcgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctZW1lcmFsZC01MDAvMjAgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLWVtZXJhbGQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICsgVGhcdTAwRUFtIHZcdTAwRTBvIGN1XHUxRUQxaSBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS1hZGQtbmV4dC1saW5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnYWRkX25leHQnLCB7IHZpZGVvVXJsOiB5dFF1ZXJ5LnRyaW0oKSwgdGl0bGU6ICdWaWRlbyB0XHUxRUVCIGxpXHUwMEVBbiBrXHUxRUJGdCcgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLXZpb2xldC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKyBQaFx1MDBFMXQga1x1MUVCRiB0aVx1MUVCRnBcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9mb3JtPlxuXG4gICAgICAgICAgICAgICAgICB7LyogVHJcdTFFQTFuZyB0aFx1MDBFMWkgbFx1MUVEN2kgdFx1MDBFQ20ga2lcdTFFQkZtICovfVxuICAgICAgICAgICAgICAgICAge3NlYXJjaExvaSAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC0yLjUgcm91bmRlZC14bCBiZy1hbWJlci01MDAvMTAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgdGV4dC14cyBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTI2QTBcdUZFMEYge3NlYXJjaExvaX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2VhcmNoTG9pKCcnKX0gY2xhc3NOYW1lPVwidGV4dC1hbWJlci00MDAgZm9udC1ib2xkIGhvdmVyOnVuZGVybGluZVwiPlx1MDExMFx1MDBGM25nPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgey8qIEtcdTFFQkZ0IHF1XHUxRUEzIHRcdTAwRUNtIGtpXHUxRUJGbSBZb3VUdWJlICovfVxuICAgICAgICAgICAgICAgICAge3l0UmVzdWx0cy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0xLjUgbWluLWgtMCBvdmVyZmxvdy1oaWRkZW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDRkE8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPktcdTFFQkZ0IHF1XHUxRUEzIFlvdVR1YmUgKHt5dFJlc3VsdHMubGVuZ3RofSB2aWRlbyk6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtZG9uZy1rZXQtcXVhXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRZdFJlc3VsdHMoW10pOyBzZXRTZWFyY2hMb2koJycpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yIHB5LTAuNSByb3VuZGVkLW1kIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LVsxMHB4XSBmb250LWJvbGQgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1IFx1MDExMFx1MDBGM25nIGtcdTFFQkZ0IHF1XHUxRUEzXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIHNwYWNlLXktMiBvdmVyZmxvdy15LWF1dG8gcHItMSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7eXRSZXN1bHRzLm1hcCgoaXRlbSwgaWR4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZVcmwgPSBgaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj0ke2l0ZW0udmlkZW9JZH1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17aXRlbS52aWRlb0lkIHx8IGlkeH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImdyb3VwIGJnLVsjMEIwRTE0XSBob3ZlcjpiZy1bIzEyMTcyMV0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3Zlcjpib3JkZXItWyMwMEYyRkVdLzMwIHJvdW5kZWQteGwgcC0yLjUgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBUaHVtYm5haWwgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIHctMjQgc206dy0yOCBhc3BlY3QtdmlkZW8gcm91bmRlZC1sZyBvdmVyZmxvdy1oaWRkZW4gYmctYmxhY2sgc2hyaW5rLTAgYm9yZGVyIGJvcmRlci13aGl0ZS81XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmM9e2l0ZW0udGh1bWJuYWlsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsdD17aXRlbS50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBncm91cC1ob3ZlcjpzY2FsZS0xMDUgdHJhbnNpdGlvbi10cmFuc2Zvcm1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRpbmc9XCJsYXp5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYWJzb2x1dGUgYm90dG9tLTEgcmlnaHQtMSBiZy1ibGFjay84MCBweC0xIHB5LTAuMiByb3VuZGVkIHRleHQtWzlweF0gZm9udC1tb25vIHRleHQtd2hpdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBZb3VUdWJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogVGhcdTAwRjRuZyB0aW4gdmlkZW8gKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoNSBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTIwMCBsaW5lLWNsYW1wLTIgZ3JvdXAtaG92ZXI6dGV4dC1bIzAwRjJGRV0gdHJhbnNpdGlvbi1jb2xvcnNcIiB0aXRsZT17aXRlbS50aXRsZX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2l0ZW0udGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvaDU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbXQtMSB0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPntpdGVtLmNoYW5uZWxUaXRsZSB8fCAnS1x1MDBFQW5oIFlvdVR1YmUnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXRlbS5wdWJsaXNoZWRBdCAmJiA8c3Bhbj5cdTIwMjIge2l0ZW0ucHVibGlzaGVkQXR9PC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIEJcdTFFRDkgMyBuXHUwMEZBdCB0aGFvIHRcdTAwRTFjICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGl0ZW1zLWNlbnRlciBnYXAtMS41IHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNoXHUxRUExeSB2aWRlbyBuXHUwMEUweSBuZ2F5IGxcdTFFQURwIHRcdTFFRTljIGNobyBjXHUxRUEzIHBoXHUwMEYybmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGRvaVZpZGVvKHZVcmwsIGl0ZW0udGl0bGUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nRG9pVmlkZW99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMwMGM2ZmZdIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LVsxMXB4XSBzaGFkb3ctc20gaG92ZXI6YnJpZ2h0bmVzcy0xMTAgYWN0aXZlOnNjYWxlLTk1IGRpc2FibGVkOm9wYWNpdHktNDAgd2hpdGVzcGFjZS1ub3dyYXAgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYgUGhcdTAwRTF0IG5nYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlRoXHUwMEVBbSB2XHUwMEUwbyBjdVx1MUVEMWkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ2VucXVldWUnLCB7IHZpZGVvVXJsOiB2VXJsLCB0aXRsZTogaXRlbS50aXRsZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtMzAwIGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMzAgaG92ZXI6YmctZW1lcmFsZC01MDAvMjUgdGV4dC1bMTFweF0gZm9udC1ib2xkIGFjdGl2ZTpzY2FsZS05NSBkaXNhYmxlZDpvcGFjaXR5LTQwIHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBIXHUwMEUwbmcgY2hcdTFFRERcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlRoXHUwMEVBbSBcdTAxMTFcdTFFQzMgcGhcdTAwRTF0IGtcdTFFQkYgdGlcdTFFQkZwIHNhdSB2aWRlbyBoaVx1MUVDN24gdFx1MUVBMWlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ2FkZF9uZXh0JywgeyB2aWRlb1VybDogdlVybCwgdGl0bGU6IGl0ZW0udGl0bGUgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMS41IHJvdW5kZWQtbGcgYmctdmlvbGV0LTUwMC8xNSB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIGhvdmVyOmJnLXZpb2xldC01MDAvMjUgdGV4dC1bMTBweF0gZm9udC1ib2xkIGFjdGl2ZTpzY2FsZS05NSBkaXNhYmxlZDpvcGFjaXR5LTQwIHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBLXHUxRUJGIHRpXHUxRUJGcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgLyogR1x1MUVFM2kgXHUwMEZEIHRcdTFFRUIga2hcdTAwRjNhIHRcdTAwRUNtIGtpXHUxRUJGbSBuaGFuaCArIGtodW5nIHRoXHUwMEY0bmcgdGluIGdpXHUxRUVGIGNoaVx1MUVDMXUgY2FvIGNcdTFFRDEgXHUwMTExXHUxRUNCbmggKi9cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtMS41IHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCBmb250LWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIEdcdTFFRTNpIFx1MDBGRCBjaFx1MUVFNyBcdTAxMTFcdTFFQzEgaFx1MUVDRGMgdFx1MUVBRHAgJiB0aFx1MDFCMCBnaVx1MDBFM246XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1RDgzQ1x1REZBNyBMb2ZpIGhcdTFFQ0RjIHRcdTFFQURwJywgcTogJ2xvZmkgaGlwIGhvcCByYWRpbyBiZWF0cyB0byByZWxheCBzdHVkeSB0bycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHVEODNDXHVERjI3XHVGRTBGIFRpXHUxRUJGbmcgbVx1MDFCMGEgJiBQaWFubycsIHE6ICdyYWluIHNvdW5kcyByZWxheGluZyBwaWFubyBzdHVkeSBmb2N1cycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHUyNjE1IE5oXHUxRUExYyBxdVx1MDBFMW4gY1x1MDBFMCBwaFx1MDBFQScsIHE6ICdjb2ZmZWUgc2hvcCBqYXp6IHBpYW5vIGNoaWxsIHN0dWR5JyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdcdUQ4M0RcdURDREEgVFx1MUVBRHAgdHJ1bmcgXHUwMEY0biB0aGknLCBxOiAnc3R1ZHkgbXVzaWMgYWxwaGEgd2F2ZXMgY29uY2VudHJhdGlvbicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHVEODNEXHVERDJDIFRoXHUwMEVEIG5naGlcdTFFQzdtIEhcdTAwRjNhIGhcdTFFQ0RjJywgcTogJ3RoXHUwMEVEIG5naGlcdTFFQzdtIGhcdTAwRjNhIGhcdTFFQ0RjIHRoXHUwMEZBIHZcdTFFQ0InIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIF0ubWFwKChjaGlwKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtjaGlwLnF9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB0aW1LaWVtWW91VHViZShlLCBjaGlwLnEpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC1bMTFweF0gdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtjaGlwLmxhYmVsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC0zIGJnLVsjMEIwRTE0XS82MCBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC14bCB0ZXh0LWNlbnRlciB0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIGdhcC0xIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteGxcIj5cdUQ4M0RcdURDRkE8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDBcIj5UXHUwMEVDbSBraVx1MUVCRm0gJiBQaFx1MDBFMXQgdmlkZW8gWW91VHViZTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwIG1heC13LXNtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIE5oXHUxRUFEcCB0XHUxRUVCIGtoXHUwMEYzYSBiXHUwMEUwaSBoXHUxRUNEYyBob1x1MUVCN2MgZFx1MDBFMW4gbGlcdTAwRUFuIGtcdTFFQkZ0IFlvdVR1YmUgXHUxRURGIHRyXHUwMEVBbiBcdTAxMTFcdTFFQzMgdFx1MDBFQ20ga2lcdTFFQkZtIHZcdTAwRTAgcGhcdTAwRTF0IFx1MDExMVx1MUVEM25nIGJcdTFFRDkgY2hvIHRcdTFFQTV0IGNcdTFFQTMgdGhcdTAwRTBuaCB2aVx1MDBFQW4gdHJvbmcgcGhcdTAwRjJuZy5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgIHsvKiBUQUIgMjogUVVcdTFFQTJOIExcdTAwREQgSFx1MDBDME5HIFx1MDExMFx1MUVFMkkgKFFVRVVFKSAqL31cbiAgICAgICAgICAgICAge21lZGlhVGFiID09PSAncXVldWUnICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtZnVsbCBmbGV4IGZsZXgtY29sIGdhcC0yLjUgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZmxleC13cmFwIGdhcC0yIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQ0I8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+SFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdmlkZW8gKHtxdWV1ZUxpc3QuZmlsdGVyKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnKS5sZW5ndGh9IGNoXHUxRUREKTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3Quc29tZShxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtcXVldWUtc2tpcFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3NraXAnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6YmctYW1iZXItNTAwLzI1IGRpc2FibGVkOm9wYWNpdHktNDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHUyM0VEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5CXHUxRUNGIHF1YSAvIEJcdTAwRTBpIHRpXHUxRUJGcDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0YWlRdWV1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiTFx1MDBFMG0gbVx1MUVEQmkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMiBweS0xIHJvdW5kZWQtbGcgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHRleHQteHMgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNEXHVERDA0XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBUaFx1MDBFQW0gbGluayBuaGFuaCB2XHUwMEUwbyBxdWV1ZSAqL31cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgPFF1ZXVlSW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICBvbkFkZD17KHUsIHQpID0+IGhhbmhEb25nUXVldWUoJ2VucXVldWUnLCB7IHZpZGVvVXJsOiB1LCB0aXRsZTogdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkFkZE5leHQ9eyh1LCB0KSA9PiBoYW5oRG9uZ1F1ZXVlKCdhZGRfbmV4dCcsIHsgdmlkZW9Vcmw6IHUsIHRpdGxlOiB0IH0pfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBEYW5oIHNcdTAwRTFjaCB2aWRlbyB0cm9uZyBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaSAqL31cbiAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3QubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTQgYmctWyMwQjBFMTRdLzYwIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLXhsIHRleHQtY2VudGVyIHRleHQteHMgdGV4dC1zbGF0ZS00MDAgZ2FwLTEuNSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC0yeGxcIj5cdUQ4M0RcdURDQ0I8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwXCI+SFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgaGlcdTFFQzduIFx1MDExMWFuZyB0clx1MUVEMW5nPC9wPlxuICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwIG1heC13LXNtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBDaHV5XHUxRUMzbiBzYW5nIHRhYiA8c3Ryb25nPlRcdTAwRUNtIFlvdVR1YmU8L3N0cm9uZz4gaG9cdTFFQjdjIGRcdTAwRTFuIGxpXHUwMEVBbiBrXHUxRUJGdCB2XHUwMEUwbyBcdTAwRjQgdHJcdTAwRUFuIFx1MDExMVx1MUVDMyBcdTAxMTFcdTAxQjBhIHZpZGVvIHZcdTAwRTBvIGRhbmggc1x1MDBFMWNoIHBoXHUwMEUxdCBsaVx1MDBFQW4gdFx1MUVFNWMuXG4gICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIHNwYWNlLXktMS41IG92ZXJmbG93LXktYXV0byBwci0xIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7cXVldWVMaXN0Lm1hcCgocSwgaWR4KSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17cS5pZCB8fCBpZHh9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjUgYmctWyMwQjBFMTRdIGJvcmRlciByb3VuZGVkLXhsIHAtMiB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHEudHJhbmdUaGFpID09PSAncGxheWluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JvcmRlci1lbWVyYWxkLTUwMC80MCBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoNTIsMjExLDE1MywwLjE1KV0gYmctZW1lcmFsZC05NTAvMjAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdib3JkZXItd2hpdGUvNSBob3Zlcjpib3JkZXItd2hpdGUvMTUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTYgaC02IHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTFweF0gZm9udC1ibGFjayBzaHJpbmstMCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcS50cmFuZ1RoYWkgPT09ICdwbGF5aW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1lbWVyYWxkLTUwMCB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzEwcHhfcmdiYSg1MiwyMTEsMTUzLDAuNCldJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncGxheWluZycgPyAnXHUyNUI2JyA6IGlkeCArIDF9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICB7cS50aHVtYiAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3EudGh1bWJ9IGFsdD1cIlwiIGNsYXNzTmFtZT1cInctMTIgaC03IHJvdW5kZWQtbWQgb2JqZWN0LWNvdmVyIHNocmluay0wIGJvcmRlciBib3JkZXItd2hpdGUvMTBcIiBsb2FkaW5nPVwibGF6eVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgbWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS0yMDAgZm9udC1ib2xkIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cS50aXRsZSB8fCBxLnZpZGVvVXJsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncGxheWluZycgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtZW1lcmFsZC00MDAgZm9udC1ib2xkXCI+XHUyNUNGIFx1MDExMGFuZyBwaFx1MDBFMXQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5UaFx1MDBFQW0gYlx1MUVERmk6IHtxLmFkZGVkQnkgfHwgJ1RoXHUwMEUwbmggdmlcdTAwRUFuJ308L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncXVldWVkJyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlBoXHUwMEUxdCB2aWRlbyBuXHUwMEUweSBuZ2F5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgncGxheV9ub3cnLCB7IGlkOiBxLmlkIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBob3ZlcjpiZy1bIzAwRjJGRV0vMzAgdGV4dC14cyBmb250LWJsYWNrIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYgUGhcdTAwRTF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJYXHUwMEYzYSBraFx1MUVDRmkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdyZW1vdmUnLCB7IGlkOiBxLmlkIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTcgaC03IHJvdW5kZWQtbGcgYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTMwMCBob3ZlcjpiZy1yb3NlLTUwMC8yNSB0ZXh0LXhzIGZvbnQtYmxhY2sgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuICAgIDwvZGl2PlxuXG4gICk7XG59XG5cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENvbXBvbmVudDogQ2FtcHVzIEZvY3VzIFJvb20gKFN0dWR5IENhZlx1MDBFOSAmIFBvbW9kb3JvIFNlc3Npb24pIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuZXhwb3J0IGZ1bmN0aW9uIENhbXB1c0ZvY3VzUm9vbSh7XG4gIHBob25nLFxuICBwaG9uZ01pbmhLaG9hLFxuICBhdXRoLFxuICBkb25nUGhvbmdIaWVuVGFpLFxuICBzb05ndW9pLFxuICBpc0ZvY3VzTW9kZSxcbiAgc2V0SXNGb2N1c01vZGVcbn0pIHtcbiAgY29uc3QgW2ZvY3VzU3RhdGUsIHNldEZvY3VzU3RhdGVdID0gdXNlU3RhdGUoe1xuICAgIHBoYXNlOiAnZm9jdXMnLFxuICAgIHN0YXR1czogJ3BhdXNlZCcsXG4gICAgZHVyYXRpb25TZWNvbmRzOiAxNTAwLFxuICAgIHJlbWFpbmluZ1NlY29uZHM6IDE1MDAsXG4gICAgcHJlc2V0OiAnMjVfNScsXG4gICAgcmV2aXNpb246IDEsXG4gICAgY2FuQ29udHJvbDogZmFsc2UsXG4gICAgdXBkYXRlZEF0OiBudWxsLFxuICAgIHNlcnZlck5vdzogbnVsbFxuICB9KTtcbiAgY29uc3QgW2xvY2FsUmVtYWluaW5nLCBzZXRMb2NhbFJlbWFpbmluZ10gPSB1c2VTdGF0ZSgxNTAwKTtcbiAgY29uc3QgW2RhbmdHdWlMZW5oLCBzZXREYW5nR3VpTGVuaF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2ksIHNldExvaV0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gQXVkaW8gc3RhdGUgKEFtYmllbnQgcGxheWJhY2spXG4gIGxldCBjYXVIaW5oID0ge307XG4gIHRyeSB7IGNhdUhpbmggPSBwaG9uZy5jYXVIaW5oID8gSlNPTi5wYXJzZShwaG9uZy5jYXVIaW5oKSA6IHt9OyB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgKi8gfVxuICBjb25zdCBuaGFjVXJsID0gY2F1SGluaC5uaGFjVXJsID8gdXJsTWVkaWFGZShjYXVIaW5oLm5oYWNVcmwpIDogJyc7XG4gIGNvbnN0IGF1ZGlvUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBbYXVkaW9QbGF5aW5nLCBzZXRBdWRpb1BsYXlpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbYXVkaW9Wb2x1bWUsIHNldEF1ZGlvVm9sdW1lXSA9IHVzZVN0YXRlKDAuNSk7XG4gIGNvbnN0IFthdWRpb011dGVkLCBzZXRBdWRpb011dGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2hhc0ludGVyYWN0ZWRBdWRpbywgc2V0SGFzSW50ZXJhY3RlZEF1ZGlvXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICAvLyBBdXRob3JpemF0aW9uXG4gIGNvbnN0IFtjYW5Db250cm9sLCBzZXRDYW5Db250cm9sXSA9IHVzZVN0YXRlKEJvb2xlYW4oYXV0aC51c2VyPy5pc1RlYWNoZXIgfHwgcGhvbmc/LmNhbkNvbnRyb2wgfHwgcGhvbmc/LmxhQ2h1UGhvbmcpKTtcbiAgY29uc3QgaXNIb3N0ID0gY2FuQ29udHJvbDtcblxuICAvLyBTeW5jIHN0YXRlIHJlY29uY2lsaWF0aW9uIGhlbHBlclxuICBjb25zdCBhcER1bmdGb2N1c1N0YXRlID0gKHN0KSA9PiB7XG4gICAgaWYgKCFzdCkgcmV0dXJuO1xuICAgIHNldEZvY3VzU3RhdGUoc3QpO1xuICAgIGNvbnN0IHJlbSA9IE51bWJlcihzdC5yZW1haW5pbmdTZWNvbmRzID8/IDE1MDApO1xuICAgIHNldExvY2FsUmVtYWluaW5nKHJlbSk7XG4gIH07XG5cbiAgLy8gMS4gUG9sbGluZyBGb2N1cyBTdGF0ZSAoZXZlcnkgMzAwMG1zKSB3aXRoIHZpc2liaWxpdHkgcmVjb25jaWxpYXRpb24gJiBzdHJpY3QgY2xlYW51cFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuXG4gICAgY29uc3QgZmV0Y2hGb2N1cyA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWZvY3VzP3Bob25nSWQ9JHtlbmNvZGVVUklDb21wb25lbnQocGhvbmcuaWQpfWApO1xuICAgICAgICBpZiAoIXJlcy5vaykgcmV0dXJuO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBkLm9rICYmIGQuc3RhdGUpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGQuY2FuQ29udHJvbCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBzZXRDYW5Db250cm9sKGQuY2FuQ29udHJvbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGFwRHVuZ0ZvY3VzU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvKiBiXHUxRUNGIHF1YSBraGkgaFx1MUVFN3kga1x1MUVCRnQgblx1MUVEMWkgKi9cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZmV0Y2hGb2N1cygpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoZmV0Y2hGb2N1cywgMzAwMCk7XG5cbiAgICBjb25zdCBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlID0gKCkgPT4ge1xuICAgICAgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnICYmIGFjdGl2ZSkge1xuICAgICAgICBmZXRjaEZvY3VzKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlKTtcbiAgICB9O1xuICB9LCBbcGhvbmcuaWRdKTtcblxuICAvLyAyLiBMb2NhbCBDb3VudGRvd24gVGljayAoZXZlcnkgMTAwMG1zIHdoZW4gc3RhdHVzID09PSAncnVubmluZycpXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGZvY3VzU3RhdGUuc3RhdHVzICE9PSAncnVubmluZycpIHJldHVybjtcbiAgICBjb25zdCB0aWNrID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgc2V0TG9jYWxSZW1haW5pbmcociA9PiBNYXRoLm1heCgwLCByIC0gMSkpO1xuICAgIH0sIDEwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpY2spO1xuICB9LCBbZm9jdXNTdGF0ZS5zdGF0dXNdKTtcblxuICAvLyAzLiBDb21tYW5kIGRpc3BhdGNoZXIgd2l0aCBvcHRpbWlzdGljIGNvbmN1cnJlbmN5IChyZXZpc2lvbiBjaGVjayAmIGNvbmZsaWN0IGhhbmRsaW5nKVxuICBjb25zdCBndWlMZW5oID0gYXN5bmMgKGFjdGlvbiwgZXh0cmFQYXlsb2FkID0ge30pID0+IHtcbiAgICBpZiAoZGFuZ0d1aUxlbmgpIHJldHVybjtcbiAgICBzZXREYW5nR3VpTGVuaCh0cnVlKTtcbiAgICBzZXRMb2koJycpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWZvY3VzJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICBhY3Rpb24sXG4gICAgICAgICAgZXhwZWN0ZWRSZXZpc2lvbjogZm9jdXNTdGF0ZS5yZXZpc2lvbixcbiAgICAgICAgICAuLi5leHRyYVBheWxvYWRcbiAgICAgICAgfSlcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIGQuc3RhdGUpIHtcbiAgICAgICAgYXBEdW5nRm9jdXNTdGF0ZShkLnN0YXRlKTtcbiAgICAgIH0gZWxzZSBpZiAocmVzLnN0YXR1cyA9PT0gNDA5ICYmIGQuc3RhdGUpIHtcbiAgICAgICAgLy8gQ29uY3VycmVuY3kgY29uZmxpY3Q6IGFkb3B0IGxhdGVzdCBzZXJ2ZXIgc3RhdGVcbiAgICAgICAgYXBEdW5nRm9jdXNTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgc2V0TG9pKCdcdTAxMTBcdTAwRTMgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBsXHUxRUExaSBwaGlcdTAwRUFuIHRoZW8gbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRMb2koZC5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgY1x1MUVBRHAgbmhcdTFFQUR0IHRyXHUxRUExbmcgdGhcdTAwRTFpIHBoXHUwMEYybmcgaFx1MUVDRGMgdFx1MUVBRHAuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRMb2koJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXREYW5nR3VpTGVuaChmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIDQuIEFtYmllbnQgQXVkaW8gQ29udHJvbHNcbiAgY29uc3QgYmF0QW1UaGFuaCA9ICgpID0+IHtcbiAgICBzZXRIYXNJbnRlcmFjdGVkQXVkaW8odHJ1ZSk7XG4gICAgaWYgKGF1ZGlvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGF1ZGlvUmVmLmN1cnJlbnQucGxheSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBzZXRBdWRpb1BsYXlpbmcodHJ1ZSk7XG4gICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0F1dG9wbGF5IGJsb2NrZWQgb3IgYXVkaW8gbG9hZCBlcnJvcjonLCBlcnIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHRvZ2dsZUF1ZGlvUGxheSA9ICgpID0+IHtcbiAgICBpZiAoIWF1ZGlvUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICBpZiAoYXVkaW9QbGF5aW5nKSB7XG4gICAgICBhdWRpb1JlZi5jdXJyZW50LnBhdXNlKCk7XG4gICAgICBzZXRBdWRpb1BsYXlpbmcoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBiYXRBbVRoYW5oKCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHRvZ2dsZUF1ZGlvTXV0ZSA9ICgpID0+IHtcbiAgICBpZiAoIWF1ZGlvUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICBjb25zdCBuZXdNdXRlID0gIWF1ZGlvTXV0ZWQ7XG4gICAgYXVkaW9SZWYuY3VycmVudC5tdXRlZCA9IG5ld011dGU7XG4gICAgc2V0QXVkaW9NdXRlZChuZXdNdXRlKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVWb2x1bWVDaGFuZ2UgPSAoZSkgPT4ge1xuICAgIGNvbnN0IHZhbCA9IHBhcnNlRmxvYXQoZS50YXJnZXQudmFsdWUpO1xuICAgIHNldEF1ZGlvVm9sdW1lKHZhbCk7XG4gICAgaWYgKGF1ZGlvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGF1ZGlvUmVmLmN1cnJlbnQudm9sdW1lID0gdmFsO1xuICAgICAgaWYgKHZhbCA+IDAgJiYgYXVkaW9NdXRlZCkge1xuICAgICAgICBhdWRpb1JlZi5jdXJyZW50Lm11dGVkID0gZmFsc2U7XG4gICAgICAgIHNldEF1ZGlvTXV0ZWQoZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBjb25zdCBpc0JyZWFrID0gZm9jdXNTdGF0ZS5waGFzZSA9PT0gJ2JyZWFrJztcbiAgY29uc3QgaXNSdW5uaW5nID0gZm9jdXNTdGF0ZS5zdGF0dXMgPT09ICdydW5uaW5nJztcbiAgY29uc3QgZHVyYXRpb24gPSBmb2N1c1N0YXRlLmR1cmF0aW9uU2Vjb25kcyB8fCAoaXNCcmVhayA/IDMwMCA6IDE1MDApO1xuICBjb25zdCBwcm9ncmVzc1BlcmNlbnQgPSBNYXRoLm1pbigxMDAsIE1hdGgubWF4KDAsICgoZHVyYXRpb24gLSBsb2NhbFJlbWFpbmluZykgLyBkdXJhdGlvbikgKiAxMDApKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtNCBtaW4tdy0wIHctZnVsbFwiPlxuICAgICAgey8qIEhpZGRlbiBBdWRpbyBlbGVtZW50IGZvciBhbWJpZW50IHNvdW5kdHJhY2sgKi99XG4gICAgICB7bmhhY1VybCAmJiAoXG4gICAgICAgIDxhdWRpb1xuICAgICAgICAgIHJlZj17YXVkaW9SZWZ9XG4gICAgICAgICAgc3JjPXtuaGFjVXJsfVxuICAgICAgICAgIGxvb3BcbiAgICAgICAgICBwcmVsb2FkPVwibm9uZVwiXG4gICAgICAgICAgb25FbmRlZD17KCkgPT4gc2V0QXVkaW9QbGF5aW5nKGZhbHNlKX1cbiAgICAgICAgICBvbkVycm9yPXsoKSA9PiBzZXRBdWRpb1BsYXlpbmcoZmFsc2UpfVxuICAgICAgICAvPlxuICAgICAgKX1cblxuICAgICAgey8qIEhlYWRlciBiYXI6IFByZXNlbmNlLCBIb3N0IGJhZGdlLCBGb2N1cyBNb2RlIHRvZ2dsZSwgQ2xvc2UgUm9vbSAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC00IGZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMgc2hhZG93LWxnXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1mdWxsIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBib3JkZXIgJHtwaG9uZy5waGFtVmkgPT09ICd0cnVvbmcnID8gJ2JnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC00MDAgYm9yZGVyLWVtZXJhbGQtNTAwLzMwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICB7cGhvbmcucGhhbVZpID09PSAndHJ1b25nJyA/ICdcdUQ4M0NcdURGMTAgVG9cdTAwRTBuIHRyXHUwMUIwXHUxRUREbmcnIDogYFx1RDgzRFx1REQxMiBMXHUxRURCcCAke3Bob25nLmxvcFRlbiB8fCAnJ31gfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBpZD1cImZvY3VzLWhvc3QtYmFkZ2VcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgQ2hcdTFFRTcgcGhcdTAwRjJuZzogPHN0cm9uZyBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTIwMFwiPntwaG9uZy5jaHVQaG9uZ1Rlbn08L3N0cm9uZz5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gaWQ9XCJmb2N1cy1yb29tLXByZXNlbmNlXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gcHgtMi41IHB5LTAuNSByb3VuZGVkLWZ1bGwgYmctWyMwMEYyRkVdLzEwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzIwIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgIFx1RDgzRFx1REM2NSB7c29OZ3VvaSB8fCAxfSBuZ1x1MDFCMFx1MUVERGkgXHUwMTExYW5nIGNcdTAwRjluZyB0XHUxRUFEcCB0cnVuZ1xuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtbC1hdXRvXCI+XG4gICAgICAgICAge2lzRm9jdXNNb2RlICYmIChcbiAgICAgICAgICAgIDxzcGFuIGlkPVwiZm9jdXMtbW9kZS1hY3RpdmUtaW5kaWNhdG9yXCIgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtcHVycGxlLTQwMCBiZy1wdXJwbGUtNTAwLzEwIHB4LTIgcHktMC41IHJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLXB1cnBsZS01MDAvMjAgYW5pbWF0ZS1wdWxzZVwiPlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGQUYgXHUwMTEwYW5nIGJcdTFFQUR0IEZvY3VzIE1vZGVcbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICApfVxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLW1vZGUtdG9nZ2xlXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNGb2N1c01vZGUoIWlzRm9jdXNNb2RlKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMS41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHtpc0ZvY3VzTW9kZSA/ICdiZy1wdXJwbGUtNTAwLzIwIHRleHQtcHVycGxlLTMwMCBib3JkZXItcHVycGxlLTUwMC80MCBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMTY4LDg1LDI0NywwLjMpXScgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkFGPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+e2lzRm9jdXNNb2RlID8gJ1x1MjFBOSBUaG9cdTAwRTF0IEZvY3VzIE1vZGUnIDogJ0ZvY3VzIE1vZGUnfTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIHtjYW5Db250cm9sICYmIHBob25nLmNodVBob25nS2hvYSAhPT0gJ2hlLXRob25nJyAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXtkb25nUGhvbmdIaWVuVGFpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzE1IGhvdmVyOmJnLXJvc2UtNTAwLzI1IHRleHQtcm9zZS0zMDAgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICBcdTAxMTBcdTAwRjNuZyBwaFx1MDBGMm5nXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogTWFpbiBGb2N1cyBDZW50ZXJwaWVjZSBDYXJkICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9e2ByZWxhdGl2ZSBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC0zeGwgYm9yZGVyIHRyYW5zaXRpb24tYWxsIHAtNiBzbTpwLTggZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgdGV4dC1jZW50ZXIgc2hhZG93LTJ4bCAke2lzQnJlYWsgPyAnYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMUUxNzEwXSB0by1bIzEzMTEwRV0gYm9yZGVyLWFtYmVyLTUwMC8zMCcgOiAnYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMEYxRTI4XSB0by1bIzBBMTIxOV0gYm9yZGVyLVsjMDBGMkZFXS8zMCd9YH0+XG4gICAgICAgIHsvKiBHbG93IGJhY2tkcm9wIGFjY2VudCAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BhYnNvbHV0ZSAtdG9wLTI0IC1sZWZ0LTI0IHctNzIgaC03MiByb3VuZGVkLWZ1bGwgYmx1ci0zeGwgb3BhY2l0eS0yMCBwb2ludGVyLWV2ZW50cy1ub25lICR7aXNCcmVhayA/ICdiZy1hbWJlci01MDAnIDogJ2JnLVsjMDBGMkZFXSd9YH0gLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BhYnNvbHV0ZSAtYm90dG9tLTI0IC1yaWdodC0yNCB3LTcyIGgtNzIgcm91bmRlZC1mdWxsIGJsdXItM3hsIG9wYWNpdHktMjAgcG9pbnRlci1ldmVudHMtbm9uZSAke2lzQnJlYWsgPyAnYmctb3JhbmdlLTUwMCcgOiAnYmctaW5kaWdvLTUwMCd9YH0gLz5cblxuICAgICAgICB7LyogUGhhc2UgJiBTdGF0dXMgQmFkZ2VzICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMi41IG1iLTYgei0xMFwiPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBpZD1cImZvY3VzLXBoYXNlLWJhZGdlXCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtZXh0cmFib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciBib3JkZXIgc2hhZG93LXNtICR7aXNCcmVhayA/ICdiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC80MCcgOiAnYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlci1bIzAwRjJGRV0vNDAnfWB9PlxuICAgICAgICAgICAge2lzQnJlYWsgPyAnXHUyNjE1IEdpXHUxRUREIE5naFx1MUVDOSBOZ1x1MDFBMWkgKEJyZWFrKScgOiAnXHVEODNDXHVERjQ1IFBoaVx1MDBFQW4gVFx1MUVBRHAgVHJ1bmcgKEZvY3VzKSd9XG4gICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGlkPVwiZm9jdXMtc3RhdHVzLWJhZGdlXCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHtpc1J1bm5pbmcgPyAnYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTQwMCBib3JkZXItZW1lcmFsZC01MDAvMzAnIDogJ2JnLXNsYXRlLTUwMC8xNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItc2xhdGUtNTAwLzMwJ31gfT5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHctMiBoLTIgcm91bmRlZC1mdWxsICR7aXNSdW5uaW5nID8gJ2JnLWVtZXJhbGQtNDAwIGFuaW1hdGUtcHVsc2UnIDogJ2JnLXNsYXRlLTQwMCd9YH0gLz5cbiAgICAgICAgICAgIDxzcGFuPntpc1J1bm5pbmcgPyAnXHUwMTEwYW5nIFx1MDExMVx1MUVCRm0nIDogJ1RcdTFFQTFtIGRcdTFFRUJuZyd9PC9zcGFuPlxuICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXByZXNldC10b2dnbGVcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBkaXNhYmxlZD17IWNhbkNvbnRyb2wgfHwgZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBjYW5Db250cm9sICYmIGd1aUxlbmgoJ3NldF9wcmVzZXQnLCB7IHByZXNldDogZm9jdXNTdGF0ZS5wcmVzZXQgPT09ICc1MF8xMCcgPyAnMjVfNScgOiAnNTBfMTAnIH0pfVxuICAgICAgICAgICAgdGl0bGU9e2NhbkNvbnRyb2wgPyAnQlx1MUVBNW0gXHUwMTExXHUxRUMzIFx1MDExMVx1MUVENWkgY2h1IGtcdTFFRjMgUG9tb2Rvcm8nIDogJ0NodSBrXHUxRUYzIFBvbW9kb3JvIGhpXHUxRUM3biB0XHUxRUExaSd9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEgcm91bmRlZC1mdWxsIHRleHQteHMgZm9udC1tb25vIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtjYW5Db250cm9sID8gJ2hvdmVyOnNjYWxlLTEwNSBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXIgYmctd2hpdGUvMTAgdGV4dC13aGl0ZSBib3JkZXItd2hpdGUvMjAnIDogJ2N1cnNvci1kZWZhdWx0IGJnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgIFx1MjY5OVx1RkUwRiB7Zm9jdXNTdGF0ZS5wcmVzZXQgPT09ICc1MF8xMCcgPyAnNTAgLyAxMCBwaFx1MDBGQXQnIDogJzI1IC8gNSBwaFx1MDBGQXQnfVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogTWFzc2l2ZSBUaW1lciBEaXNwbGF5ICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm15LTIgc206bXktNCB6LTEwXCI+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGlkPVwiZm9jdXMtdGltZXItZGlzcGxheVwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2Bmb250LW1vbm8gdGV4dC02eGwgc206dGV4dC04eGwgZm9udC1ibGFjayB0cmFja2luZy13aWRlc3QgYmxvY2sgdHJhbnNpdGlvbi1hbGwgc2VsZWN0LW5vbmUgJHtpc0JyZWFrID8gJ3RleHQtYW1iZXItMzAwIGRyb3Atc2hhZG93LVswXzBfMzVweF9yZ2JhKDI0NSwxNTgsMTEsMC4zNSldJyA6ICd0ZXh0LVsjMDBGMkZFXSBkcm9wLXNoYWRvdy1bMF8wXzM1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldJ31gfT5cbiAgICAgICAgICAgIHtkaW5oRGFuZ0dpYXlQaHV0KGxvY2FsUmVtYWluaW5nKX1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBQcm9ncmVzcyBiYXIgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIG1heC13LW1kIGgtMiBiZy1ibGFjay80MCByb3VuZGVkLWZ1bGwgb3ZlcmZsb3ctaGlkZGVuIGJvcmRlciBib3JkZXItd2hpdGUvMTAgbXktNCB6LTEwXCI+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgaC1mdWxsIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTEwMDAgJHtpc0JyZWFrID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tb3JhbmdlLTUwMCcgOiAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzNCODJGNl0nfWB9XG4gICAgICAgICAgICBzdHlsZT17eyB3aWR0aDogYCR7cHJvZ3Jlc3NQZXJjZW50fSVgIH19XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIENvbnRyb2wgQnV0dG9ucyBmb3IgSG9zdC9UZWFjaGVyICovfVxuICAgICAgICB7Y2FuQ29udHJvbCA/IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMyBtdC00IHotMTBcIj5cbiAgICAgICAgICAgIHshaXNSdW5uaW5nID8gKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtc3RhcnRcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdzdGFydCcpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMyByb3VuZGVkLTJ4bCBiZy1ncmFkaWVudC10by1yIGZyb20tZW1lcmFsZC00MDAgdG8tdGVhbC01MDAgaG92ZXI6ZnJvbS1lbWVyYWxkLTMwMCBob3Zlcjp0by10ZWFsLTQwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC1zbSBzaGFkb3ctWzBfMF8yMHB4X3JnYmEoNTIsMjExLDE1MywwLjMpXSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjVCNjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5CXHUxRUFGdCBcdTAxMTFcdTFFQTd1PC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1wYXVzZVwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3BhdXNlJyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNiBweS0zIHJvdW5kZWQtMnhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tb3JhbmdlLTUwMCBob3Zlcjpmcm9tLWFtYmVyLTMwMCBob3Zlcjp0by1vcmFuZ2UtNDAwIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXNtIHNoYWRvdy1bMF8wXzIwcHhfcmdiYSgyNTEsMTkxLDM2LDAuMyldIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyM0Y4PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlRcdTFFQTFtIGRcdTFFRUJuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXJlc2V0XCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgncmVzZXQnKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0zIHJvdW5kZWQtMnhsIGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzE1IHRleHQtc2xhdGUtMjAwIHRleHQtc20gZm9udC1ib2xkIGJvcmRlciBib3JkZXItd2hpdGUvMTUgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMDQ8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MDExMFx1MUVCN3QgbFx1MUVBMWk8L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAge2lzQnJlYWsgPyAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1zdGFydC1mb2N1c1wiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3N0YXJ0X2ZvY3VzJyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0zIHJvdW5kZWQtMnhsIGJnLVsjMDBGMkZFXS8yMCBob3ZlcjpiZy1bIzAwRjJGRV0vMzAgdGV4dC1bIzAwRjJGRV0gdGV4dC1zbSBmb250LWJvbGQgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REZBRjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5WXHUwMEUwbyBUXHUxRUFEcCB0cnVuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtc3RhcnQtYnJlYWtcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdzdGFydF9icmVhaycpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMyByb3VuZGVkLTJ4bCBiZy1hbWJlci01MDAvMjAgaG92ZXI6YmctYW1iZXItNTAwLzMwIHRleHQtYW1iZXItMzAwIHRleHQtc20gZm9udC1ib2xkIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzQwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTI2MTU8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+TmdoXHUxRUM5IG5nXHUwMUExaTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDAgbXQtMyB6LTEwXCI+XG4gICAgICAgICAgICBcdTIzRjMgXHUwMTEwXHUxRUQzbmcgaFx1MUVEMyBQb21vZG9ybyBkbyBjaFx1MUVFNyBwaFx1MDBGMm5nIFx1MDExMWlcdTFFQzF1IHBoXHUxRUQxaSBcdTIwMTQgaFx1MDBFM3kgdFx1MUVBRHAgdHJ1bmcgaFx1MUVCRnQgbVx1MDBFQ25oIHZcdTAwRTBvIGNcdTAwRjRuZyB2aVx1MUVDN2MvaFx1MUVDRGMgdFx1MUVBRHAgbmhcdTAwRTkhXG4gICAgICAgICAgPC9wPlxuICAgICAgICApfVxuXG4gICAgICAgIHtsb2kgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXJvc2UtNDAwIG10LTQgei0xMFwiPntsb2l9PC9wPn1cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQW1iaWVudCBBdWRpbyBQbGF5ZXIgQ2FyZCAqL31cbiAgICAgIHtuaGFjVXJsID8gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNCBzbTpwLTUgZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHNoYWRvdy14bFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMuNSBtaW4tdy0wIHctZnVsbCBzbTp3LWF1dG9cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgdy0xMiBoLTEyIHJvdW5kZWQtMnhsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteGwgc2hyaW5rLTAgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7YXVkaW9QbGF5aW5nID8gJ2JnLVsjOEI1Q0Y2XS8yMCB0ZXh0LVsjOEI1Q0Y2XSBib3JkZXItWyM4QjVDRjZdLzQwIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgxMzksOTIsMjQ2LDAuMyldIGFuaW1hdGUtcHVsc2UnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAgXHVEODNDXHVERkE3XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLXctMFwiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIHRydW5jYXRlXCI+XHUwMEMybSB0aGFuaCBuXHUxRUMxbiBBbWJpZW50PC9wPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgIHthdWRpb1BsYXlpbmcgPyAnXHUwMTEwYW5nIHBoXHUwMEUxdCBraFx1MDBGNG5nIGdpYW4gaFx1MUVDRGMgdFx1MUVBRHAnIDogJ1x1MDBDMm0gdGhhbmggY1x1MUVFNWMgYlx1MUVEOSB0aGVvIHRoaVx1MUVCRnQgYlx1MUVDQid9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIgZ2FwLTMgdy1mdWxsIHNtOnctYXV0byBqdXN0aWZ5LWVuZFwiPlxuICAgICAgICAgICAgeyFoYXNJbnRlcmFjdGVkQXVkaW8gJiYgIWF1ZGlvUGxheWluZyAmJiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1zdGFydC1mb2N1cy1hdWRpb1wiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17YmF0QW1UaGFuaH1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1yIGZyb20tWyM4QjVDRjZdIHRvLVsjNjM2NkYxXSB0ZXh0LXdoaXRlIHRleHQteHMgZm9udC1ib2xkIHNoYWRvdy1sZyBob3ZlcjpvcGFjaXR5LTkwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5CXHUxRUFEdCBcdTAwRTJtIHRoYW5oIHRcdTFFQURwIHRydW5nPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJmb2N1cy1hdWRpby10b2dnbGVcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlQXVkaW9QbGF5fVxuICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7YXVkaW9QbGF5aW5nID8gJ2JnLVsjOEI1Q0Y2XS8yMCB0ZXh0LVsjOEI1Q0Y2XSBib3JkZXItWyM4QjVDRjZdLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtMzAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICAgIDxzcGFuPnthdWRpb1BsYXlpbmcgPyAnXHUyM0Y4IFRcdTFFQTFtIGRcdTFFRUJuZycgOiAnXHUyNUI2IFBoXHUwMEUxdCB0aVx1MUVCRnAnfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVBdWRpb011dGV9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiByb3VuZGVkLXhsIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXhzIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgIHthdWRpb011dGVkIHx8IGF1ZGlvVm9sdW1lID09PSAwID8gJ1x1RDgzRFx1REQwNycgOiAnXHVEODNEXHVERDA5J31cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgdHlwZT1cInJhbmdlXCJcbiAgICAgICAgICAgICAgbWluPVwiMFwiXG4gICAgICAgICAgICAgIG1heD1cIjFcIlxuICAgICAgICAgICAgICBzdGVwPVwiMC4wNVwiXG4gICAgICAgICAgICAgIHZhbHVlPXthdWRpb011dGVkID8gMCA6IGF1ZGlvVm9sdW1lfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17aGFuZGxlVm9sdW1lQ2hhbmdlfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTI0IGgtMS41IGJnLXdoaXRlLzEwIHJvdW5kZWQtbGcgYXBwZWFyYW5jZS1ub25lIGN1cnNvci1wb2ludGVyIGFjY2VudC1bIzhCNUNGNl1cIlxuICAgICAgICAgICAgICB0aXRsZT1cIlx1MDBDMm0gbFx1MDFCMFx1MUVFM25nIG5oXHUxRUExYyBuXHUxRUMxblwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICkgOiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLTJ4bCBwLTQgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMFwiPlxuICAgICAgICAgICAgXHUyNjE1IFBoXHUwMEYybmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSB0XHUwMTI5bmggbFx1MUVCN25nIChjaFx1MDFCMGEgZ1x1MUVBRm4gbGluayBcdTAwRTJtIHRoYW5oIG5cdTFFQzFuKSBcdTIwMTQgQ2h1eVx1MDBFQW4gdFx1MDBFMm0gdFx1MUVEMWkgXHUwMTExYSB2XHUwMEUwbyBiXHUwMEUwaSB2XHUxRURGLlxuICAgICAgICAgIDwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7cGhvbmcubW9UYSAmJiAoXG4gICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIHB4LTIgbGVhZGluZy1yZWxheGVkXCI+XG4gICAgICAgICAge3Bob25nLm1vVGF9XG4gICAgICAgIDwvcD5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiQUFBQSxNQUFNLEVBQUUsVUFBVSxXQUFXLE9BQU8sSUFBSTtBQUN4QyxTQUFTLGtCQUFrQixlQUFlLFdBQVcsbUJBQW1CLHFCQUFxQixrQkFBa0I7QUFLL0csTUFBTSxhQUFhLENBQUMsT0FBTyxNQUFNO0FBQUUsTUFBSSxTQUFTLG9CQUFvQixVQUFXLElBQUc7QUFBRztBQUk5RSxnQkFBUyxXQUFXLEVBQUUsT0FBTyxVQUFVLEdBQUc7QUFDL0MsUUFBTSxDQUFDLEdBQUcsSUFBSSxJQUFJLE1BQU0sU0FBUyxFQUFFO0FBQ25DLFFBQU0sS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTO0FBQzdCLFNBQ0Usb0NBQUMsU0FBSSxXQUFVLCtCQUNiO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFLO0FBQUEsTUFDTCxPQUFPO0FBQUEsTUFDUCxVQUFVLE9BQUssS0FBSyxFQUFFLE9BQU8sS0FBSztBQUFBLE1BQ2xDLFdBQVcsT0FBSztBQUFFLFlBQUksRUFBRSxRQUFRLFdBQVcsSUFBSTtBQUFFLFlBQUUsZUFBZTtBQUFHLGdCQUFNLEVBQUUsS0FBSyxDQUFDO0FBQUcsZUFBSyxFQUFFO0FBQUEsUUFBRztBQUFBLE1BQUU7QUFBQSxNQUNsRyxhQUFZO0FBQUEsTUFDWixXQUFVO0FBQUE7QUFBQSxFQUNaLEdBQ0E7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUFPLE1BQUs7QUFBQSxNQUFTLElBQUc7QUFBQSxNQUFxQixVQUFVLENBQUM7QUFBQSxNQUN2RCxTQUFTLE1BQU07QUFBRSxrQkFBVSxFQUFFLEtBQUssQ0FBQztBQUFHLGFBQUssRUFBRTtBQUFBLE1BQUc7QUFBQSxNQUNoRCxXQUFVO0FBQUE7QUFBQSxJQUEySztBQUFBLEVBRXZMLEdBQ0E7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUFP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
