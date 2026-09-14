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
  phongMinhKhoa: _phongMinhKhoa,
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
  dongPhongHienTai: _dongPhongHienTai
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
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
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
  return /* @__PURE__ */ React.createElement("div", { id: "study-dock-container", className: "bg-gradient-to-b from-[#161b26] to-[#0f141d] border border-white/[0.08] rounded-2xl p-4 flex flex-col h-full min-h-[420px] lg:min-h-[480px] shadow-xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 pb-3 border-b border-white/10 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
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
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col pt-3 min-h-[300px]" }, dockTab === "chat" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-h-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto space-y-3 pr-1 max-h-72 lg:max-h-[380px] xl:max-h-[440px] text-xs" }, phongChat.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 text-center py-8" }, "Ch\u01B0a c\xF3 tin nh\u1EAFn \u2014 h\xE3y g\u1EEDi c\xE2u h\u1ECFi ho\u1EB7c trao \u0111\u1ED5i v\u1EC1 b\xE0i gi\u1EA3ng!") : phongChat.map((m, idx) => /* @__PURE__ */ React.createElement("div", { key: m.id || idx, className: "text-xs group" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-1 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-300 text-[11px]" }, m.tenNguoiGui), m.vaiTro === "giao_vien" ? /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30" }, "GVCN") : m.lopTen ? /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/20" }, m.lopTen) : null, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500" }, m.taoLuc ? (/* @__PURE__ */ new Date(m.taoLuc.replace(" ", "T") + "Z")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""), isStaff && /* @__PURE__ */ React.createElement(
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
      className: "opacity-0 group-hover:opacity-100 px-1 text-[9px] text-slate-500 hover:text-rose-400 transition-all"
    },
    "\u2715"
  )), /* @__PURE__ */ React.createElement("p", { className: "bg-[#0B0E14] border border-white/5 hover:border-[#00F2FE]/15 rounded-xl px-3 py-2 text-slate-200 text-xs leading-relaxed break-words transition-colors" }, m.noiDung))), /* @__PURE__ */ React.createElement("div", { ref: chatEndRef })), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSendRoomChat, className: "pt-2 border-t border-white/8 flex flex-col gap-2 mt-auto" }, showEmoji && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1 p-2 bg-[#0B0E14] border border-white/10 rounded-2xl" }, ["\u{1F60A}", "\u{1F602}", "\u{1F970}", "\u{1F60E}", "\u{1F914}", "\u{1F605}", "\u{1F62D}", "\u{1F525}", "\u2764\uFE0F", "\u{1F44D}", "\u{1F64F}", "\u{1F389}", "\u2705", "\u{1F4AF}", "\u{1F44B}", "\u{1F4DA}", "\u270F\uFE0F", "\u{1F3AF}", "\u{1F31F}", "\u{1F4A1}", "\u26A1", "\u{1F3C6}", "\u{1F91D}", "\u{1F4AA}", "\u{1F929}"].map((em) => /* @__PURE__ */ React.createElement(
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
  )))), dockTab === "notes" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] text-slate-400" }, /* @__PURE__ */ React.createElement("span", null, "Ghi ch\xFA chung c\u1EE7a ph\xF2ng \u2014 m\u1ED7i ng\u01B0\u1EDDi th\xEAm m\u1ED9t d\xF2ng, c\xF3 th\u1EC3 g\u1EAFn m\u1ED1c video"), notesNotice && /* @__PURE__ */ React.createElement("span", { className: "text-rose-300 font-bold" }, notesNotice)), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto space-y-2 pr-1 max-h-64 min-h-[180px] bg-[#0B0E14] border border-white/10 rounded-xl p-2.5" }, notesList.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 text-center py-8" }, "Ch\u01B0a c\xF3 ghi ch\xFA \u2014 th\xEAm d\xF2ng \u0111\u1EA7u ti\xEAn cho c\u1EA3 ph\xF2ng.") : notesList.map((n) => /* @__PURE__ */ React.createElement("div", { key: n.id, className: "flex items-start gap-2 group" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-slate-400" }, n.ten), n.videoTimeSec != null && n.videoTimeSec > 0 && /* @__PURE__ */ React.createElement(
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
  ) : /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-amber-300/80 text-center py-1" }, "\u{1F512} Ghi ch\xFA \u0111ang \u1EDF ch\u1EBF \u0111\u1ED9 ch\u1EC9 xem \u2014 qu\u1EA3n tr\u1ECB ph\xF2ng \u0111\xE3 kh\xF3a.")), dockTab === "whiteboard" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 flex-wrap text-xs pb-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
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
  ))), dockTab === "sheet" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-2 overflow-x-auto" }, /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-slate-400" }, "B\u1EA3ng t\xEDnh ph\xE2n t\xEDch s\u1ED1 li\u1EC7u / m\u1ED1c th\u1EDDi gian h\u1ECDc t\u1EADp (L\u01B0u t\u1EF1 \u0111\u1ED9ng)"), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-auto max-h-72 border border-white/10 rounded-xl bg-[#0B0E14]" }, /* @__PURE__ */ React.createElement("table", { id: "study-sheet-table", className: "w-full text-xs text-slate-300 border-collapse" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "bg-white/5 text-slate-400 border-b border-white/10 font-mono" }, /* @__PURE__ */ React.createElement("th", { className: "w-8 p-1 text-center border-r border-white/10 text-[10px]" }, "#"), COLS.map((c) => /* @__PURE__ */ React.createElement("th", { key: c, className: "p-1.5 text-center border-r border-white/10 min-w-[70px] text-[11px] font-bold text-cyan-300" }, c)))), /* @__PURE__ */ React.createElement("tbody", null, ROWS.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r, className: "border-b border-white/5 hover:bg-white/[0.02]" }, /* @__PURE__ */ React.createElement("td", { className: "p-1 text-center bg-white/5 text-slate-500 font-mono text-[10px] border-r border-white/10" }, r), COLS.map((c) => {
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
  )))), voiceNotice && /* @__PURE__ */ React.createElement("p", { id: "voice-status-notice", className: "text-xs text-slate-300 font-mono bg-black/40 px-3 py-1.5 rounded-lg border border-white/5" }, voiceNotice), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 max-w-xs" }, "* Ghi ch\xFA: K\u1EBFt n\u1ED1i tho\u1EA1i P2P y\xEAu c\u1EA7u m\u1EA1ng kh\xF4ng ch\u1EB7n UDP. Restrictive NAT c\xF3 th\u1EC3 c\u1EA7n relay TURN.")), dockTab === "members" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-3 overflow-y-auto max-h-80 lg:max-h-[420px] pr-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between pb-2 border-b border-white/10" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-black text-white flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F465}"), /* @__PURE__ */ React.createElement("span", null, "Th\xE0nh vi\xEAn trong ph\xF2ng (", thanhVien.length, ")")), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-400" }, "\u0110ang tr\u1EF1c tuy\u1EBFn")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2" }, thanhVien.map((tv, idx) => {
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
  }), thanhVien.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "text-center py-8 text-slate-500 text-xs" }, "Ch\u01B0a c\xF3 th\xE0nh vi\xEAn n\xE0o trong ph\xF2ng."))), dockTab === "quan-tri" && isStaff && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-3 overflow-y-auto max-h-80 pr-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
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
  const hanhDongQueue = async (action, extra = {}) => {
    if (queueBusy) return;
    setQueueBusy(true);
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
      } else {
        if (action === "enqueue") {
          setThongBaoVideo(`\u0110\xE3 th\xEAm v\xE0o cu\u1ED1i h\xE0ng \u0111\u1EE3i: ${extra.title || "Video"}`);
          setTimeout(() => setThongBaoVideo(""), 3500);
        } else if (action === "add_next") {
          setThongBaoVideo(`\u0110\xE3 th\xEAm ph\xE1t k\u1EBF ti\u1EBFp: ${extra.title || "Video"}`);
          setTimeout(() => setThongBaoVideo(""), 3500);
        } else if (action === "play_now" || action === "skip") {
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
          }
          setThongBaoVideo("\u0110ang chuy\u1EC3n video...");
          setTimeout(() => setThongBaoVideo(""), 3e3);
        }
        await taiQueue();
      }
    } catch {
      setLoiVideo("M\u1EA5t k\u1EBFt n\u1ED1i m\xE1y ch\u1EE7.");
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
    try {
      c = phong?.cauHinh ? JSON.parse(phong.cauHinh) : {};
    } catch {
    }
    const nextUrl = c.videoUrl || phong?.videoUrl || "";
    if (nextUrl && nextUrl !== activeVideoUrl) {
      setActiveVideoUrl(nextUrl);
      setProvider(getInitialProvider(nextUrl));
    }
  }, [phong?.cauHinh, phong?.videoUrl]);
  const videoUrl = activeVideoUrl;
  const ytId = videoUrl ? idYoutube(videoUrl) : null;
  const drvId = videoUrl ? idGoogleDrive(videoUrl) : null;
  const trucTiepUrl = videoUrl && !ytId && !drvId && laVideoTrucTiepFe(videoUrl) ? urlMediaFe(videoUrl) : "";
  const [ytApiFailed, setYtApiFailed] = useState(false);
  const [_ytPlayerReady, setYtPlayerReady] = useState(false);
  const ytReadyRef = useRef(false);
  const currentYtIdRef = useRef(null);
  useEffect(() => {
    if (!ytId) return;
    let destroyed = false;
    let retryTimer = null;
    let fallbackTimer = null;
    let attempts = 0;
    if (ytPlayerRef.current && ytReadyRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
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
        console.warn("L\u1ED7i khi loadVideoById, kh\u1EDFi t\u1EA1o l\u1EA1i player:", e);
      }
    }
    currentYtIdRef.current = ytId;
    fallbackTimer = setTimeout(() => {
      if (!destroyed && !ytReadyRef.current) {
        console.warn("YouTube IFrame API kh\xF4ng ph\u1EA3n h\u1ED3i sau 3.2s -> k\xEDch ho\u1EA1t fallback iframe tr\u1EF1c ti\u1EBFp.");
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
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
        }
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
        const originUrl = typeof window !== "undefined" ? window.location.origin : "";
        ytPlayerRef.current = new window.YT.Player(ytContainerId, {
          width: "100%",
          height: "100%",
          videoId: ytId,
          playerVars: {
            autoplay: watchState.playing ? 1 : 0,
            controls: canControl ? 1 : 0,
            disablekb: canControl ? 0 : 1,
            enablejsapi: 1,
            origin: originUrl,
            widget_referrer: typeof window !== "undefined" ? window.location.href : "",
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
              if (canControl && !dangGuiLenh && !isSeekingRef.current) {
                if (event.data === 1 && !watchState.playing) {
                  guiLenh("play", event.target.getCurrentTime());
                } else if (event.data === 2 && watchState.playing) {
                  guiLenh("pause", event.target.getCurrentTime());
                } else if (event.data === 0) {
                  hanhDongQueue("skip");
                }
              }
            },
            onError: (err) => {
              console.warn("YouTube Player b\xE1o l\u1ED7i m\xE3:", err?.data);
              setYtApiFailed(true);
            }
          }
        });
      } catch (err) {
        console.warn("L\u1ED7i kh\u1EDFi t\u1EA1o YT Player:", err);
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
  const apDungDongBo = (st, ctrl, prov) => {
    if (!st) return;
    const nowMs = Date.now();
    const _serverTimeMs = st.serverNow ? new Date(st.serverNow).getTime() : nowMs;
    const updateTimeMs = st.updatedAt ? (/* @__PURE__ */ new Date(String(st.updatedAt).replace(" ", "T") + (String(st.updatedAt).includes("T") ? "" : "Z"))).getTime() : nowMs;
    const elapsedSec = Math.max(0, (nowMs - updateTimeMs) / 1e3);
    let targetPos = Number(st.positionSeconds || 0);
    if (st.playing) {
      targetPos = Number(st.basePositionSeconds || 0) + elapsedSec * (st.playbackRate || 1);
    }
    setLocalTime(Math.max(0, Math.floor(targetPos)));
    if (ctrl && isSeekingRef.current) return;
    if (prov === "NATIVE_HTML5" && videoRef.current) {
      const v = videoRef.current;
      if (st.playing) {
        const drift = Math.abs(v.currentTime - targetPos);
        if (drift > 1.5) {
          v.currentTime = targetPos;
        }
        if (v.paused && (hasInteracted || hasInteractedRef.current || ctrl)) {
          v.play().catch(() => {
          });
        }
        if (v.playbackRate !== (st.playbackRate || 1)) {
          v.playbackRate = st.playbackRate || 1;
        }
      } else {
        if (!v.paused) v.pause();
        const drift = Math.abs(v.currentTime - st.positionSeconds);
        if (drift > 0.8) {
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
        } catch {
        }
      } else if (ytApiFailed) {
        const ifr = document.querySelector(`iframe#yt-fallback-${phong.id}`);
        if (ifr && ifr.contentWindow) {
          try {
            if (st.playing) {
              ifr.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
            } else {
              ifr.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
            }
          } catch {
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
      if (!isSeekingRef.current) {
        setLocalTime((t) => t + 1);
      }
    }, 1e3);
    return () => clearInterval(tick);
  }, [watchState.playing]);
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
        if (ytApiFailed) {
          const ifr = document.querySelector(`iframe#yt-fallback-${phong.id}`);
          ifr?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
        }
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
        if (ytApiFailed) {
          const ifr = document.querySelector(`iframe#yt-fallback-${phong.id}`);
          ifr?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
        }
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
        if (ytApiFailed) {
          const ifr = document.querySelector(`iframe#yt-fallback-${phong.id}`);
          ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [pos, true] }), "*");
        }
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
    } else if (provider === "YOUTUBE" && ytPlayerRef.current?.playVideo) {
      if (watchState.playing) ytPlayerRef.current.playVideo();
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
  )), ytId ? ytApiFailed ? /* @__PURE__ */ React.createElement("div", { key: `yt-fallback-wrap-${phong.id}-${ytId}`, className: "w-full h-full relative" }, /* @__PURE__ */ React.createElement(
    "iframe",
    {
      id: `yt-fallback-${phong.id}`,
      key: `yt-iframe-${ytId}`,
      src: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=${watchState.playing ? 1 : 0}&start=${Math.floor(localTime || 0)}&enablejsapi=1&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}&rel=0&modestbranding=1&playsinline=1`,
      title: phong.ten || "YouTube Video",
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
      allowFullScreen: true,
      className: "w-full h-full border-0"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur border border-white/10 text-[10px] text-slate-300 pointer-events-none flex items-center gap-1 shadow" }, /* @__PURE__ */ React.createElement("span", null, "\u26A1"), /* @__PURE__ */ React.createElement("span", null, "Ph\xE1t tr\u1EF1c ti\u1EBFp YouTube"))) : /* @__PURE__ */ React.createElement("div", { key: `yt-wrap-${phong.id}`, className: "w-full h-full flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { id: ytContainerId, className: "w-full h-full" })) : drvId ? /* @__PURE__ */ React.createElement(
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
  ), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono text-slate-400 shrink-0" }, duration > 0 ? dinhDangGiayPhut(duration) : "--:--"))), loi && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-400" }, loi), phong.moTa && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 leading-relaxed pt-1" }, phong.moTa)), !isRoomWide && /* @__PURE__ */ React.createElement("div", { id: "vung1-youtube-studio", className: "bg-gradient-to-b from-[#161b26] to-[#0f141d] border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 pb-2.5 border-b border-white/10 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-8 h-8 rounded-xl bg-gradient-to-br from-[#00F2FE]/20 to-violet-500/20 text-[#00F2FE] border border-[#00F2FE]/30 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(0,242,254,0.25)]" }, "\u{1F3AC}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "text-xs sm:text-sm font-black text-white flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "C\u1EA5u h\xECnh Video & H\xE0ng \u0111\u1EE3i YouTube"), queueList.filter((q) => q.trangThai === "queued").length > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded-full bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 text-[10px] font-bold" }, queueList.filter((q) => q.trangThai === "queued").length, " \u0111ang ch\u1EDD")), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-400" }, "T\xECm ki\u1EBFm video, \u0111\u01B0a v\xE0o h\xE0ng ch\u1EDD v\xE0 ch\u1EA1y video kh\xE1c \u0111\u1ED3ng b\u1ED9 c\u1EA3 ph\xF2ng"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center bg-[#0B0E14] p-1 rounded-xl border border-white/10" }, /* @__PURE__ */ React.createElement(
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
  ))), thongBaoVideo && /* @__PURE__ */ React.createElement("div", { className: "px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn" }, /* @__PURE__ */ React.createElement("span", null, "\u2728"), /* @__PURE__ */ React.createElement("span", null, thongBaoVideo)), loiVideo && /* @__PURE__ */ React.createElement("div", { className: "px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fadeIn" }, /* @__PURE__ */ React.createElement("span", null, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("span", null, loiVideo)), daMoRongStudio && /* @__PURE__ */ React.createElement(React.Fragment, null, mediaTab === "search" && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-3" }, /* @__PURE__ */ React.createElement("form", { onSubmit: (e) => timKiemYouTube(e), className: "flex flex-col gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "relative flex-1" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" }, "\u{1F50D}"), /* @__PURE__ */ React.createElement(
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
  ))), searchLoi && /* @__PURE__ */ React.createElement("div", { className: "p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", null, "\u26A0\uFE0F ", searchLoi), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setSearchLoi(""), className: "text-amber-400 font-bold hover:underline" }, "\u0110\xF3ng")), ytResults.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-xs text-slate-400" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-300 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4FA}"), /* @__PURE__ */ React.createElement("span", null, "K\u1EBFt qu\u1EA3 YouTube (", ytResults.length, " video):")), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-vung1-dong-ket-qua",
      onClick: () => {
        setYtResults([]);
        setSearchLoi("");
      },
      className: "px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-bold"
    },
    "\u2715 \u0110\xF3ng k\u1EBFt qu\u1EA3"
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 max-h-72 overflow-y-auto pr-1" }, ytResults.map((item, idx) => {
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
          className: "px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00F2FE] to-[#00c6ff] text-black font-black text-[11px] shadow-sm hover:brightness-110 active:scale-95 disabled:opacity-40 whitespace-nowrap"
        },
        "\u25B6 Ph\xE1t ngay"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          title: "Th\xEAm v\xE0o cu\u1ED1i h\xE0ng \u0111\u1EE3i",
          onClick: () => hanhDongQueue("enqueue", { videoUrl: vUrl, title: item.title }),
          disabled: queueBusy,
          className: "px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 text-[11px] font-bold active:scale-95 disabled:opacity-40 whitespace-nowrap"
        },
        "+ H\xE0ng ch\u1EDD"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          title: "Th\xEAm \u0111\u1EC3 ph\xE1t k\u1EBF ti\u1EBFp sau video hi\u1EC7n t\u1EA1i",
          onClick: () => hanhDongQueue("add_next", { videoUrl: vUrl, title: item.title }),
          disabled: queueBusy,
          className: "px-2.5 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 text-[10px] font-bold active:scale-95 disabled:opacity-40 whitespace-nowrap"
        },
        "+ K\u1EBF ti\u1EBFp"
      ))
    );
  }))) : (
    /* Gợi ý từ khóa tìm kiếm nhanh khi chưa search */
    /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1.5 pt-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-wider" }, "G\u1EE3i \xFD ch\u1EE7 \u0111\u1EC1 h\u1ECDc t\u1EADp & th\u01B0 gi\xE3n:"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 flex-wrap" }, [
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
    ))))
  )), mediaTab === "queue" && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between flex-wrap gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-slate-300 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"), /* @__PURE__ */ React.createElement("span", null, "H\xE0ng \u0111\u1EE3i video (", queueList.filter((q) => q.trangThai === "queued").length, " ch\u1EDD)")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, queueList.some((q) => q.trangThai === "queued") && /* @__PURE__ */ React.createElement(
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
  ))), /* @__PURE__ */ React.createElement(
    QueueInput,
    {
      onAdd: (u, t) => hanhDongQueue("enqueue", { videoUrl: u, title: t }),
      onAddNext: (u, t) => hanhDongQueue("add_next", { videoUrl: u, title: t })
    }
  ), queueList.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "p-5 rounded-xl bg-[#0B0E14] border border-white/5 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u{1F4CB}"), /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-300" }, "H\xE0ng \u0111\u1EE3i hi\u1EC7n \u0111ang tr\u1ED1ng"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 max-w-sm" }, "Chuy\u1EC3n sang tab ", /* @__PURE__ */ React.createElement("strong", null, "T\xECm YouTube"), " ho\u1EB7c d\xE1n li\xEAn k\u1EBFt v\xE0o \xF4 tr\xEAn \u0111\u1EC3 ph\xE1t l\u1EA7n l\u01B0\u1EE3t c\xE1c b\xE0i h\u1ECDc & video gi\u1EA3i tr\xED.")) : /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5 max-h-64 overflow-y-auto pr-1" }, queueList.map((q, idx) => /* @__PURE__ */ React.createElement(
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvc3R1ZHkuanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9ID0gUmVhY3Q7XG5pbXBvcnQgeyBkaW5oRGFuZ0dpYXlQaHV0LCBpZEdvb2dsZURyaXZlLCBpZFlvdXR1YmUsIGxhVmlkZW9UcnVjVGllcEZlLCBuYXBZb3VUdWJlSWZyYW1lQXBpLCB1cmxNZWRpYUZlIH0gZnJvbSAnLi4vbGliL2hlbHBlcnMuanMnO1xuXG4vLyBCXHUxRUNGIHF1YSB0aWNrIGtoaSB0YWIgXHUwMTExYW5nIFx1MUVERiBOXHUxRUMwTiBcdTIwMTQgdHJcdTAwRTFuaCBjXHUxRUQ5bmcgZFx1MUVEM24gcmVxdWVzdCBDbG91ZGZsYXJlIHZcdTAwRjQgXHUwMEVEY2gga2hpIGtoXHUwMEY0bmcgYWkgeGVtLlxuLy8gS2hcdTAwRjRuZyBkXHUwMEY5bmcgY2hvIHBvbGwgdFx1MDBFRG4gaGlcdTFFQzd1IHRoXHUxRUREaSBnaWFuIHRoXHUxRUYxYyAodmQgdm9pY2Ugc2lnbmFsaW5nKSB2XHUwMEVDIGJcdTFFQ0YgbFx1MUVFMSB0aWNrIGNcdTAwRjMgdGhcdTFFQzMgbFx1MDBFMG0gdHJlb1xuLy8gYlx1MUVBRnQgdGF5IGtcdTFFQkZ0IG5cdTFFRDFpIGhvXHUxRUI3YyB0clx1MUVDNSB0XHUwMEVEbiBoaVx1MUVDN3UgXCJyXHUxRUREaSB2b2ljZVwiIGNcdTFFRTdhIG5nXHUwMUIwXHUxRUREaSBraWEuXG5jb25zdCBraGlIaWVuVGhpID0gKGZuKSA9PiAoKSA9PiB7IGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09ICd2aXNpYmxlJykgZm4oKTsgfTtcblxuXG4vLyBcdTAwRDQgbmhcdTFFQURwIGxpbmsgdGhcdTAwRUFtIHZcdTAwRTBvIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIFx1MjAxNCBkXHUwMEY5bmcgY2h1bmcgY2hvIFN0dWR5RG9jayB2XHUwMEUwIENhbXB1c1dhdGNoVG9nZXRoZXJcbmV4cG9ydCBmdW5jdGlvbiBRdWV1ZUlucHV0KHsgb25BZGQsIG9uQWRkTmV4dCB9KSB7XG4gIGNvbnN0IFt2LCBzZXRWXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3Qgb2sgPSB2LnRyaW0oKS5sZW5ndGggPiAwO1xuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgPGlucHV0XG4gICAgICAgIGlkPVwiaW5wdXQtcXVldWUtYWRkXCJcbiAgICAgICAgdHlwZT1cInVybFwiXG4gICAgICAgIHZhbHVlPXt2fVxuICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRWKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgb25LZXlEb3duPXtlID0+IHsgaWYgKGUua2V5ID09PSAnRW50ZXInICYmIG9rKSB7IGUucHJldmVudERlZmF1bHQoKTsgb25BZGQodi50cmltKCkpOyBzZXRWKCcnKTsgfSB9fVxuICAgICAgICBwbGFjZWhvbGRlcj1cIlRoXHUwMEVBbSBsaW5rIHZpZGVvIHZcdTAwRTBvIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXHUyMDI2XCJcbiAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMi41IHB5LTEuNSB0ZXh0LVsxMXB4XSB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MFwiXG4gICAgICAvPlxuICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJidG4tcXVldWUtYWRkLW5leHRcIiBkaXNhYmxlZD17IW9rfVxuICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IG9uQWRkTmV4dCh2LnRyaW0oKSk7IHNldFYoJycpOyB9fVxuICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMS41IHJvdW5kZWQtbGcgYmctdmlvbGV0LTUwMC8xNSB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy12aW9sZXQtNTAwLzI1IGRpc2FibGVkOm9wYWNpdHktMzAgd2hpdGVzcGFjZS1ub3dyYXBcIj5cbiAgICAgICAgK1BoXHUwMEUxdCBrXHUxRUJGXG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGlkPVwiYnRuLXF1ZXVlLWVucXVldWVcIiBkaXNhYmxlZD17IW9rfVxuICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IG9uQWRkKHYudHJpbSgpKTsgc2V0VignJyk7IH19XG4gICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLVsjMDBGMkZFXS8yNSBkaXNhYmxlZDpvcGFjaXR5LTMwIHdoaXRlc3BhY2Utbm93cmFwXCI+XG4gICAgICAgICtDdVx1MUVEMWkgaFx1MDBFMG5nXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFNUVURZIERPQ0s6IEtIXHUwMEQ0TkcgR0lBTiBDXHUxRUQ4TkcgVFx1MDBDMUMgUEhcdTAwRDJORyBZT1VUVUJFIChQSEFTRSA0RikgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5leHBvcnQgZnVuY3Rpb24gU3R1ZHlEb2NrKHsgcGhvbmcsIHBob25nTWluaEtob2E6IF9waG9uZ01pbmhLaG9hLCBhdXRoLCBwaG9uZ0NoYXQgPSBbXSwgb25TZW5kUGhvbmdDaGF0LCBvblhvYVRpblBob25nLFxuICBteUNhcHMgPSB7fSwgaXNTdGFmZiA9IGZhbHNlLCB2YWlUcm9QaG9uZyA9ICdtZW1iZXInLCB0aGFuaFZpZW4gPSBbXSxcbiAgcG9saWNpZXMgPSBudWxsLCBncmFudHMgPSBbXSwgdmlkZW9UaW1lUmVmLCBzZWVrVmlkZW8sIGhhbmhEb25nUGhvbmcsXG4gIGNhbkNvbnRyb2w6IF9jYW5Db250cm9sID0gZmFsc2UsIGRvbmdQaG9uZ0hpZW5UYWk6IF9kb25nUGhvbmdIaWVuVGFpIH0pIHtcbiAgY29uc3QgW2RvY2tUYWIsIHNldERvY2tUYWJdID0gUmVhY3QudXNlU3RhdGUoJ2NoYXQnKTsgLy8gJ2NoYXQnIHwgJ25vdGVzJyB8ICd3aGl0ZWJvYXJkJyB8ICdzaGVldCcgfCAndm9pY2UnIHwgJ3F1YW4tdHJpJ1xuICBjb25zdCBbc2hvd0Vtb2ppLCBzZXRTaG93RW1vamldID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8vIENhcGFiaWxpdHkgcGhcdTAwRURhIGNsaWVudCBjaFx1MUVDOSBcdTAxMTFcdTFFQzMgXHUxRUE5bi9oaVx1MUVDN24gVUkgXHUyMDE0IG1cdTFFQ0RpIHF1eVx1MUVDMW4gdGhcdTFFQUR0IGRvIHNlcnZlciBxdXlcdTFFQkZ0LlxuICBjb25zdCBjb1F1eWVuID0gKGNhcCkgPT4gbXlDYXBzW2NhcF0gIT09IGZhbHNlO1xuICBjb25zdCBsYXlWaVRyaVZpZGVvID0gKCkgPT4gTWF0aC5mbG9vcih2aWRlb1RpbWVSZWY/LmN1cnJlbnQgfHwgMCkgfHwgbnVsbDtcbiAgLy8gQlx1MUVBNW0gbVx1MUVEMWMgdGhcdTFFRERpIGdpYW4gXHUyMTkyIGdcdTFFRURpIGV2ZW50IGNobyBDYW1wdXNXYXRjaFRvZ2V0aGVyIHhcdTFFRUQgbFx1MDBGRFxuICAvLyAoY1x1MDBGMyB2aWRlb19jb250cm9sIFx1MjE5MiB0dWEgY2h1bmcgY1x1MUVBMyBwaFx1MDBGMm5nOyBraFx1MDBGNG5nIFx1MjE5MiB0dWEgY1x1MUVFNWMgYlx1MUVEOSBwbGF5ZXIgY1x1MUVFN2EgbVx1MDBFQ25oKS5cbiAgY29uc3QgeWV1Q2F1VHVhID0gKHNlYykgPT4ge1xuICAgIGlmIChzZWMgPT0gbnVsbCB8fCAhKHNlYyA+PSAwKSkgcmV0dXJuO1xuICAgIGlmIChzZWVrVmlkZW8pIHsgc2Vla1ZpZGVvKHNlYywgbXlDYXBzLnZpZGVvX2NvbnRyb2wgPT09IHRydWUpOyByZXR1cm47IH1cbiAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3NyLXNlZWsnLCB7IGRldGFpbDogeyBwaG9uZ0lkOiBwaG9uZy5pZCwgc2VjIH0gfSkpO1xuICB9O1xuXG4gIC8vIDEuIFJvb20gQ2hhdCBTdGF0ZVxuICBjb25zdCBbY2hhdElucHV0LCBzZXRDaGF0SW5wdXRdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbY2hhdFNlbmRpbmcsIHNldENoYXRTZW5kaW5nXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgY2hhdENvbXBvc2luZ1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGNoYXRFbmRSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiA9PT0gJ2NoYXQnICYmIGNoYXRFbmRSZWYuY3VycmVudCkge1xuICAgICAgY2hhdEVuZFJlZi5jdXJyZW50LnNjcm9sbEludG9WaWV3KHsgYmVoYXZpb3I6ICdzbW9vdGgnIH0pO1xuICAgIH1cbiAgfSwgW3Bob25nQ2hhdC5sZW5ndGgsIGRvY2tUYWJdKTtcblxuICBjb25zdCBoYW5kbGVTZW5kUm9vbUNoYXQgPSAoZSkgPT4ge1xuICAgIGU/LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgdHh0ID0gY2hhdElucHV0LnRyaW0oKTtcbiAgICBpZiAoIXR4dCB8fCBjaGF0U2VuZGluZykgcmV0dXJuO1xuICAgIHNldENoYXRJbnB1dCgnJyk7XG4gICAgc2V0Q2hhdFNlbmRpbmcodHJ1ZSk7XG4gICAgaWYgKG9uU2VuZFBob25nQ2hhdCkge1xuICAgICAgUHJvbWlzZS5yZXNvbHZlKG9uU2VuZFBob25nQ2hhdCh0eHQpKS5jYXRjaCgoKSA9PiB7XG4gICAgICAgIHNldENoYXRJbnB1dChjdXIgPT4gY3VyID8gY3VyIDogdHh0KTtcbiAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICBzZXRDaGF0U2VuZGluZyhmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0Q2hhdFNlbmRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyAyLiBTaGFyZWQgTm90ZXMgXHUyMDE0IGVudHJ5IGFwcGVuZCAobVx1MUVEN2kgbmdcdTAxQjBcdTFFRERpIHRoXHUwMEVBbSBnaGkgY2hcdTAwRkEgcmlcdTAwRUFuZywga2hcdTAwRjRuZyBnaGkgXHUwMTExXHUwMEU4IG5oYXUpXG4gIGNvbnN0IFtub3Rlc0xpc3QsIHNldE5vdGVzTGlzdF0gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFtub3RlSW5wdXQsIHNldE5vdGVJbnB1dF0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtub3RlV2l0aFRpbWUsIHNldE5vdGVXaXRoVGltZV0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW25vdGVzQ2FuV3JpdGUsIHNldE5vdGVzQ2FuV3JpdGVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IFtub3Rlc05vdGljZSwgc2V0Tm90ZXNOb3RpY2VdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBub3Rlc1ZlcnNpb25SZWYgPSBSZWFjdC51c2VSZWYoMCk7XG4gIGNvbnN0IG5vdGVDb21wb3NpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICdub3RlcycpIHJldHVybjtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaE5vdGVzID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mcmVzb3VyY2U9bm90ZXNgKTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChhY3RpdmUgJiYgZC5vaykge1xuICAgICAgICAgIHNldE5vdGVzTGlzdChBcnJheS5pc0FycmF5KGQucGF5bG9hZD8ubm90ZXMpID8gZC5wYXlsb2FkLm5vdGVzIDogW10pO1xuICAgICAgICAgIG5vdGVzVmVyc2lvblJlZi5jdXJyZW50ID0gZC52ZXJzaW9uIHx8IDA7XG4gICAgICAgICAgc2V0Tm90ZXNDYW5Xcml0ZShkLmNhbldyaXRlICE9PSBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aXZlICYmIGQuY29kZSA9PT0gJ2NhcGFiaWxpdHlfb2ZmJykge1xuICAgICAgICAgIHNldE5vdGVzQ2FuV3JpdGUoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfTtcbiAgICBmZXRjaE5vdGVzKCk7XG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChraGlIaWVuVGhpKGZldGNoTm90ZXMpLCAzMDAwKTtcbiAgICByZXR1cm4gKCkgPT4geyBhY3RpdmUgPSBmYWxzZTsgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7IH07XG4gIH0sIFtwaG9uZy5pZCwgZG9ja1RhYl0pO1xuXG4gIGNvbnN0IHRoZW1HaGlDaHUgPSBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgdGV4dCA9IG5vdGVJbnB1dC50cmltKCk7XG4gICAgaWYgKCF0ZXh0KSByZXR1cm47XG4gICAgc2V0Tm90ZXNOb3RpY2UoJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgIHJlc291cmNlOiAnbm90ZXMnLFxuICAgICAgICAgIHBheWxvYWQ6IHsgdGV4dCwgdmlkZW9UaW1lU2VjOiBub3RlV2l0aFRpbWUgPyBsYXlWaVRyaVZpZGVvKCkgOiBudWxsIH1cbiAgICAgICAgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vaykge1xuICAgICAgICBzZXROb3RlSW5wdXQoJycpO1xuICAgICAgICBzZXROb3Rlc0xpc3QocHJldiA9PiBbLi4ucHJldiwgeyBpZDogZC5pZCwgdGVuOiBhdXRoLnVzZXI/LnRlbiB8fCAnQlx1MUVBMW4nLCBub2lEdW5nOiB0ZXh0LCB2aWRlb1RpbWVTZWM6IG5vdGVXaXRoVGltZSA/IGxheVZpVHJpVmlkZW8oKSA6IG51bGwsIGN1YVRvaTogMSB9XSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXROb3Rlc05vdGljZShkLmxvaSB8fCAnS2hcdTAwRjRuZyBsXHUwMUIwdSBcdTAxMTFcdTAxQjBcdTFFRTNjIGdoaSBjaFx1MDBGQS4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHsgc2V0Tm90ZXNOb3RpY2UoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpLicpOyB9XG4gIH07XG5cbiAgY29uc3QgeG9hR2hpQ2h1ID0gYXN5bmMgKGlkKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCByZXNvdXJjZTogJ25vdGVzJywgYWN0aW9uOiAneG9hX25vdGUnLCBpZCB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSBzZXROb3Rlc0xpc3QocHJldiA9PiBwcmV2LmZpbHRlcihuID0+IG4uaWQgIT09IGlkKSk7XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIC8vIDMuIFNoYXJlZCBXaGl0ZWJvYXJkIFN0YXRlXG4gIGNvbnN0IGNhbnZhc1JlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgW3diU3Ryb2tlcywgc2V0V2JTdHJva2VzXSA9IFJlYWN0LnVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW3diQ29sb3IsIHNldFdiQ29sb3JdID0gUmVhY3QudXNlU3RhdGUoJyMwMEYyRkUnKTtcbiAgY29uc3QgW3diV2lkdGgsIHNldFdiV2lkdGhdID0gUmVhY3QudXNlU3RhdGUoMyk7XG4gIGNvbnN0IFt3YlRvb2wsIHNldFdiVG9vbF0gPSBSZWFjdC51c2VTdGF0ZSgncGVuJyk7XG4gIGNvbnN0IGlzRHJhd2luZ1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGN1cnJlbnRTdHJva2VSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHdiVmVyc2lvblJlZiA9IFJlYWN0LnVzZVJlZigwKTtcblxuICBjb25zdCByZWRyYXdDYW52YXMgPSBSZWFjdC51c2VDYWxsYmFjaygoc3Ryb2tlcykgPT4ge1xuICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgIGlmICghY2FudmFzKSByZXR1cm47XG4gICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIHN0cm9rZXMuZm9yRWFjaChzID0+IHtcbiAgICAgIGlmICghcy5wb2ludHMgfHwgcy5wb2ludHMubGVuZ3RoIDwgMikgcmV0dXJuO1xuICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgY3R4LnN0cm9rZVN0eWxlID0gcy50b29sID09PSAnZXJhc2VyJyA/ICcjMEIwRTE0JyA6IChzLmNvbG9yIHx8ICcjMDBGMkZFJyk7XG4gICAgICBjdHgubGluZVdpZHRoID0gcy53aWR0aCB8fCAzO1xuICAgICAgY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuICAgICAgY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcbiAgICAgIGN0eC5tb3ZlVG8ocy5wb2ludHNbMF0ueCwgcy5wb2ludHNbMF0ueSk7XG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHMucG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGN0eC5saW5lVG8ocy5wb2ludHNbaV0ueCwgcy5wb2ludHNbaV0ueSk7XG4gICAgICB9XG4gICAgICBjdHguc3Ryb2tlKCk7XG4gICAgfSk7XG4gIH0sIFtdKTtcblxuICBjb25zdCBbd2JDYW5Xcml0ZSwgc2V0V2JDYW5Xcml0ZV0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTtcblxuICAvLyBcdTAwQzFwIDEgb3Agdlx1MDBFMG8gbVx1MUVBM25nIHN0cm9rZXMgKHJlcGxheSBhcHBlbmQtb25seSk6ICdzdHJva2UnIHRoXHUwMEVBbSBuXHUwMEU5dCwgJ2NsZWFyJyB4b1x1MDBFMSBzXHUxRUExY2guXG4gIGNvbnN0IGFwRHVuZ09wID0gKHN0cm9rZXMsIG9wKSA9PiB7XG4gICAgaWYgKG9wLnR5cGUgPT09ICdjbGVhcicpIHJldHVybiBbXTtcbiAgICBpZiAob3AudHlwZSA9PT0gJ3N0cm9rZScgJiYgb3Auc3Ryb2tlKSByZXR1cm4gWy4uLnN0cm9rZXMsIG9wLnN0cm9rZV07XG4gICAgcmV0dXJuIHN0cm9rZXM7XG4gIH07XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiAhPT0gJ3doaXRlYm9hcmQnKSByZXR1cm47XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG4gICAgY29uc3QgZmV0Y2hXYiA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPXdoaXRlYm9hcmQmc2F1SWQ9JHt3YlZlcnNpb25SZWYuY3VycmVudH1gKTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChhY3RpdmUgJiYgZC5vaykge1xuICAgICAgICAgIGNvbnN0IG9wcyA9IEFycmF5LmlzQXJyYXkoZC5wYXlsb2FkPy5vcHMpID8gZC5wYXlsb2FkLm9wcyA6IFtdO1xuICAgICAgICAgIGlmIChvcHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBOXHUxRUJGdSBjXHUwMEYzIG9wICdjbGVhcicgdHJvbmcgbG9cdTFFQTF0IG1cdTFFREJpIFx1MjE5MiBidWlsZCBsXHUxRUExaSB0XHUxRUVCIFx1MDExMVx1MUVBN3UgY2hvIGNoXHUxRUFGY1xuICAgICAgICAgICAgaWYgKG9wcy5zb21lKG8gPT4gby50eXBlID09PSAnY2xlYXInKSkge1xuICAgICAgICAgICAgICBjb25zdCBmdWxsID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mcmVzb3VyY2U9d2hpdGVib2FyZCZzYXVJZD0wYCk7XG4gICAgICAgICAgICAgIGNvbnN0IGRmID0gYXdhaXQgZnVsbC5qc29uKCk7XG4gICAgICAgICAgICAgIGlmIChhY3RpdmUgJiYgZGYub2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbGxPcHMgPSBBcnJheS5pc0FycmF5KGRmLnBheWxvYWQ/Lm9wcykgPyBkZi5wYXlsb2FkLm9wcyA6IFtdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlYnVpbHQgPSBhbGxPcHMucmVkdWNlKGFwRHVuZ09wLCBbXSk7XG4gICAgICAgICAgICAgICAgc2V0V2JTdHJva2VzKHJlYnVpbHQpO1xuICAgICAgICAgICAgICAgIHJlZHJhd0NhbnZhcyhyZWJ1aWx0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2V0V2JTdHJva2VzKHByZXYgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBvcHMucmVkdWNlKGFwRHVuZ09wLCBwcmV2KTtcbiAgICAgICAgICAgICAgICByZWRyYXdDYW52YXMobmV4dCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICB3YlZlcnNpb25SZWYuY3VycmVudCA9IGQudmVyc2lvbiB8fCAwO1xuICAgICAgICAgIHNldFdiQ2FuV3JpdGUoZC5jYW5Xcml0ZSAhPT0gZmFsc2UpO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGl2ZSAmJiBkLmNvZGUgPT09ICdjYXBhYmlsaXR5X29mZicpIHtcbiAgICAgICAgICBzZXRXYkNhbldyaXRlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7fVxuICAgIH07XG4gICAgZmV0Y2hXYigpO1xuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaShmZXRjaFdiKSwgMzAwMCk7XG4gICAgcmV0dXJuICgpID0+IHsgYWN0aXZlID0gZmFsc2U7IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpOyB9O1xuICB9LCBbcGhvbmcuaWQsIGRvY2tUYWIsIHJlZHJhd0NhbnZhc10pO1xuXG4gIGNvbnN0IHN0YXJ0RHJhd2luZyA9IChlKSA9PiB7XG4gICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFjYW52YXMpIHJldHVybjtcbiAgICBjb25zdCByZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGNsaWVudFggPSBlLmNsaWVudFggPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFgpO1xuICAgIGNvbnN0IGNsaWVudFkgPSBlLmNsaWVudFkgPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFkpO1xuICAgIGNvbnN0IHggPSBjbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIGNvbnN0IHkgPSBjbGllbnRZIC0gcmVjdC50b3A7XG4gICAgaXNEcmF3aW5nUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudCA9IHtcbiAgICAgIHRvb2w6IHdiVG9vbCxcbiAgICAgIGNvbG9yOiB3YkNvbG9yLFxuICAgICAgd2lkdGg6IHdiVG9vbCA9PT0gJ2VyYXNlcicgPyAxNiA6IHdiV2lkdGgsXG4gICAgICBwb2ludHM6IFt7IHgsIHkgfV1cbiAgICB9O1xuICB9O1xuXG4gIGNvbnN0IGRyYXdNb3ZlID0gKGUpID0+IHtcbiAgICBpZiAoIWlzRHJhd2luZ1JlZi5jdXJyZW50IHx8ICFjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICBpZiAoIWNhbnZhcykgcmV0dXJuO1xuICAgIGNvbnN0IHJlY3QgPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgY2xpZW50WCA9IGUuY2xpZW50WCA/PyAoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXT8uY2xpZW50WCk7XG4gICAgY29uc3QgY2xpZW50WSA9IGUuY2xpZW50WSA/PyAoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXT8uY2xpZW50WSk7XG4gICAgY29uc3QgeCA9IGNsaWVudFggLSByZWN0LmxlZnQ7XG4gICAgY29uc3QgeSA9IGNsaWVudFkgLSByZWN0LnRvcDtcbiAgICBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQucG9pbnRzLnB1c2goeyB4LCB5IH0pO1xuICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQudG9vbCA9PT0gJ2VyYXNlcicgPyAnIzBCMEUxNCcgOiBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQuY29sb3I7XG4gICAgY3R4LmxpbmVXaWR0aCA9IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC53aWR0aDtcbiAgICBjdHgubGluZUNhcCA9ICdyb3VuZCc7XG4gICAgY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcbiAgICBjb25zdCBwdHMgPSBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQucG9pbnRzO1xuICAgIGlmIChwdHMubGVuZ3RoID49IDIpIHtcbiAgICAgIGN0eC5tb3ZlVG8ocHRzW3B0cy5sZW5ndGggLSAyXS54LCBwdHNbcHRzLmxlbmd0aCAtIDJdLnkpO1xuICAgICAgY3R4LmxpbmVUbyhwdHNbcHRzLmxlbmd0aCAtIDFdLngsIHB0c1twdHMubGVuZ3RoIC0gMV0ueSk7XG4gICAgICBjdHguc3Ryb2tlKCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHN0b3BEcmF3aW5nID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghaXNEcmF3aW5nUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICBpc0RyYXdpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQgJiYgY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnBvaW50cy5sZW5ndGggPiAxKSB7XG4gICAgICBjb25zdCBzdHJva2UgPSBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQ7XG4gICAgICBjb25zdCBuZXh0U3Ryb2tlcyA9IFsuLi53YlN0cm9rZXMsIHN0cm9rZV07XG4gICAgICBzZXRXYlN0cm9rZXMobmV4dFN0cm9rZXMpO1xuICAgICAgY3VycmVudFN0cm9rZVJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICAgIHJlc291cmNlOiAnd2hpdGVib2FyZCcsXG4gICAgICAgICAgICBwYXlsb2FkOiB7IHR5cGU6ICdzdHJva2UnLCBzdHJva2UgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGQub2sgJiYgZC5pZCkgd2JWZXJzaW9uUmVmLmN1cnJlbnQgPSBNYXRoLm1heCh3YlZlcnNpb25SZWYuY3VycmVudCwgZC5pZCk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGNsZWFyV2hpdGVib2FyZCA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIWNvbmZpcm0oJ0JcdTFFQTFuIGNcdTAwRjMgY2hcdTFFQUZjIG11XHUxRUQxbiB4XHUwMEYzYSBzXHUxRUExY2ggYlx1MUVBM25nIHZcdTFFQkQ/IChjaFx1MUVDOSBxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZyknKSkgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgIHJlc291cmNlOiAnd2hpdGVib2FyZCcsXG4gICAgICAgICAgcGF5bG9hZDogeyB0eXBlOiAnY2xlYXInIH1cbiAgICAgICAgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vaykge1xuICAgICAgICBzZXRXYlN0cm9rZXMoW10pO1xuICAgICAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICAgICAgaWYgKGNhbnZhcykge1xuICAgICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICAvLyA0LiBTaGFyZWQgU2hlZXQgU3RhdGUgKDggY29scyB4IDEwIHJvd3MpIFx1MjAxNCB1cHNlcnQgdFx1MUVFQm5nIFx1MDBGNCwga2hcdTAwRjRuZyB3aG9sZS1kb2MgY29uZmxpY3RcbiAgY29uc3QgQ09MUyA9IFsnQScsICdCJywgJ0MnLCAnRCcsICdFJywgJ0YnLCAnRycsICdIJ107XG4gIGNvbnN0IFJPV1MgPSBbMSwgMiwgMywgNCwgNSwgNiwgNywgOCwgOSwgMTBdO1xuICBjb25zdCBbc2hlZXRDZWxscywgc2V0U2hlZXRDZWxsc10gPSBSZWFjdC51c2VTdGF0ZSh7fSk7XG4gIGNvbnN0IFtzaGVldENhbldyaXRlLCBzZXRTaGVldENhbldyaXRlXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBzaGVldFNhdmVUaW1lcnNSZWYgPSBSZWFjdC51c2VSZWYoe30pO1xuICBjb25zdCBzaGVldEZvY3VzZWRDZWxsUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBzaGVldFBvbGxSZWYgPSBSZWFjdC51c2VSZWYoMCk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiAhPT0gJ3NoZWV0JykgcmV0dXJuO1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoU2hlZXQgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT1zaGVldGApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBkLm9rKSB7XG4gICAgICAgICAgY29uc3QgaW5jb21pbmcgPSBkLnBheWxvYWQ/LmNlbGxzIHx8IHt9O1xuICAgICAgICAgIC8vIEtoXHUwMEY0bmcgZ2hpIFx1MDExMVx1MDBFOCBcdTAwRjQgXHUwMTExYW5nIGdcdTAwRjUgZFx1MUVERlxuICAgICAgICAgIHNldFNoZWV0Q2VsbHMocHJldiA9PiB7XG4gICAgICAgICAgICBjb25zdCBtZXJnZWQgPSB7IC4uLmluY29taW5nIH07XG4gICAgICAgICAgICBjb25zdCBkYW5nR28gPSBzaGVldEZvY3VzZWRDZWxsUmVmLmN1cnJlbnQ7XG4gICAgICAgICAgICBpZiAoZGFuZ0dvICYmIHByZXZbZGFuZ0dvXSAhPT0gdW5kZWZpbmVkKSBtZXJnZWRbZGFuZ0dvXSA9IHByZXZbZGFuZ0dvXTtcbiAgICAgICAgICAgIHJldHVybiBtZXJnZWQ7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgc2V0U2hlZXRDYW5Xcml0ZShkLmNhbldyaXRlICE9PSBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aXZlICYmIGQuY29kZSA9PT0gJ2NhcGFiaWxpdHlfb2ZmJykge1xuICAgICAgICAgIHNldFNoZWV0Q2FuV3JpdGUoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfTtcbiAgICBmZXRjaFNoZWV0KCk7XG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChraGlIaWVuVGhpKGZldGNoU2hlZXQpLCAzMDAwKTtcbiAgICByZXR1cm4gKCkgPT4geyBhY3RpdmUgPSBmYWxzZTsgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7IH07XG4gIH0sIFtwaG9uZy5pZCwgZG9ja1RhYl0pO1xuXG4gIGNvbnN0IGhhbmRsZUNlbGxDaGFuZ2UgPSAoY2VsbEtleSwgdmFsKSA9PiB7XG4gICAgc2V0U2hlZXRDZWxscyhwcmV2ID0+ICh7IC4uLnByZXYsIFtjZWxsS2V5XTogdmFsIH0pKTtcbiAgICBjb25zdCB0aW1lcnMgPSBzaGVldFNhdmVUaW1lcnNSZWYuY3VycmVudDtcbiAgICBpZiAodGltZXJzW2NlbGxLZXldKSBjbGVhclRpbWVvdXQodGltZXJzW2NlbGxLZXldKTtcbiAgICB0aW1lcnNbY2VsbEtleV0gPSBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICAgIHJlc291cmNlOiAnc2hlZXQnLFxuICAgICAgICAgICAgcGF5bG9hZDogeyBjZWxsOiBjZWxsS2V5LCB2YWx1ZTogdmFsIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9LCA4MDApO1xuICB9O1xuXG4gIC8vIDUuIDEtdG8tMSBXZWJSVEMgVm9pY2UgQ2hhdCBcdTIwMTQgcGFpci1ib3VuZCAodFx1MUVEMWkgXHUwMTExYSAxIGNcdTFFQjdwL3BoXHUwMEYybmcsIHNpZ25hbGluZyByaVx1MDBFQW5nIHRcdTAxQjApXG4gIGNvbnN0IFt2b2ljZUpvaW5lZCwgc2V0Vm9pY2VKb2luZWRdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbWljTXV0ZWQsIHNldE1pY011dGVkXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpOyAvLyBEZWZhdWx0IE9GRlxuICBjb25zdCBbdm9pY2VTdGF0ZSwgc2V0Vm9pY2VTdGF0ZV0gPSBSZWFjdC51c2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gIGNvbnN0IFt2b2ljZU5vdGljZSwgc2V0Vm9pY2VOb3RpY2VdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbdm9pY2VQYWlyLCBzZXRWb2ljZVBhaXJdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7ICAgICAgIC8vIHthY3RpdmUsIGFUZW4sIGJUZW4sIHlvdUluLCBzbG90fVxuICBjb25zdCBbdm9pY2VSZXF1ZXN0ZWQsIHNldFZvaWNlUmVxdWVzdGVkXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3lldUNhdVZvaWNlLCBzZXRZZXVDYXVWb2ljZV0gPSBSZWFjdC51c2VTdGF0ZShbXSk7ICAgICAvLyBzdGFmZjogZGFuaCBzXHUwMEUxY2ggeGluIHF1eVx1MUVDMW5cbiAgY29uc3QgcGNSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGxvY2FsU3RyZWFtUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCByZW1vdGVBdWRpb1JlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgbGFzdFNpZ25hbElkUmVmID0gUmVhY3QudXNlUmVmKDApO1xuICBjb25zdCB2b2ljZVBvbGxUaW1lclJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgdm9pY2VTbG90UmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB2b2ljZUpvaW5lZFJlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IHBlbmRpbmdDYW5kaWRhdGVzUmVmID0gUmVhY3QudXNlUmVmKFtdKTtcbiAgdm9pY2VKb2luZWRSZWYuY3VycmVudCA9IHZvaWNlSm9pbmVkO1xuXG4gIGNvbnN0IGR1bmdLZXROb2lWb2ljZSA9ICgpID0+IHtcbiAgICBpZiAobG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRUcmFja3MoKS5mb3JFYWNoKHQgPT4gdC5zdG9wKCkpO1xuICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudCA9IG51bGw7XG4gICAgfVxuICAgIGlmIChwY1JlZi5jdXJyZW50KSB7XG4gICAgICBwY1JlZi5jdXJyZW50LmNsb3NlKCk7XG4gICAgICBwY1JlZi5jdXJyZW50ID0gbnVsbDtcbiAgICB9XG4gICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCA9IFtdO1xuICAgIHNldE1pY011dGVkKHRydWUpO1xuICB9O1xuXG4gIC8vIFBvbGwgdHJcdTFFQTFuZyB0aFx1MDBFMWkgY1x1MUVCN3AgKyB0XHUwMEVEbiBoaVx1MUVDN3UgY1x1MUVFN2EgcGFydG5lciAoc2VydmVyIGNoXHUxRUM5IHRyXHUxRUEzIHNpZ25hbCBjXHUxRUU3YSBuZ1x1MDFCMFx1MUVERGkgdHJvbmcgY1x1MUVCN3ApLlxuICBjb25zdCBwb2xsVm9pY2UgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JmFjdGlvbj12b2ljZV9wb2xsJnNhdUlkPSR7bGFzdFNpZ25hbElkUmVmLmN1cnJlbnR9YCk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghZC5vaykgcmV0dXJuO1xuICAgICAgaWYgKGQucGFpcikgc2V0Vm9pY2VQYWlyKGQucGFpcik7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShkLnlldUNhdVZvaWNlKSkgc2V0WWV1Q2F1Vm9pY2UoZC55ZXVDYXVWb2ljZSk7XG4gICAgICBjb25zdCBwYyA9IHBjUmVmLmN1cnJlbnQ7XG4gICAgICBpZiAoIXZvaWNlSm9pbmVkUmVmLmN1cnJlbnQgfHwgIXBjKSByZXR1cm47XG4gICAgICBmb3IgKGNvbnN0IHNpZyBvZiBkLnNpZ25hbHMgfHwgW10pIHtcbiAgICAgICAgbGFzdFNpZ25hbElkUmVmLmN1cnJlbnQgPSBNYXRoLm1heChsYXN0U2lnbmFsSWRSZWYuY3VycmVudCwgc2lnLmlkKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdvZmZlcicpIHtcbiAgICAgICAgICAgIC8vIE9mZmVyIG1cdTFFREJpIGhvXHUxRUI3YyByZS1vZmZlciAoXHUwMTExXHUxRUQxaSBwaFx1MDFCMFx1MDFBMW5nIGJcdTFFQUR0IG1pYyBtdVx1MUVEOW4pIFx1MDExMVx1MUVDMXUgc2V0IGxcdTFFQTFpIHJlbW90ZSArIHRyXHUxRUEzIGFuc3dlci5cbiAgICAgICAgICAgIGF3YWl0IHBjLnNldFJlbW90ZURlc2NyaXB0aW9uKG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24oc2lnLnBheWxvYWQpKTtcbiAgICAgICAgICAgIC8vIFhcdTFFQTMgY1x1MDBFMWMgY2FuZGlkYXRlIHRcdTFFREJpIHNcdTFFREJtIHRyXHUwMUIwXHUxRURCYyBraGkgY1x1MDBGMyByZW1vdGVEZXNjcmlwdGlvbi5cbiAgICAgICAgICAgIGZvciAoY29uc3QgYyBvZiBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLmFkZEljZUNhbmRpZGF0ZShuZXcgUlRDSWNlQ2FuZGlkYXRlKGMpKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50ID0gW107XG4gICAgICAgICAgICBjb25zdCBhbnMgPSBhd2FpdCBwYy5jcmVhdGVBbnN3ZXIoKTtcbiAgICAgICAgICAgIGF3YWl0IHBjLnNldExvY2FsRGVzY3JpcHRpb24oYW5zKTtcbiAgICAgICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnYW5zd2VyJywgcGF5bG9hZDogYW5zIH0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnYW5zd2VyJykge1xuICAgICAgICAgICAgaWYgKHBjLnNpZ25hbGluZ1N0YXRlID09PSAnaGF2ZS1sb2NhbC1vZmZlcicpIHtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuc2V0UmVtb3RlRGVzY3JpcHRpb24obmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbihzaWcucGF5bG9hZCkpO1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IGMgb2YgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBjLmFkZEljZUNhbmRpZGF0ZShuZXcgUlRDSWNlQ2FuZGlkYXRlKGMpKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdjYW5kaWRhdGUnKSB7XG4gICAgICAgICAgICBpZiAocGMucmVtb3RlRGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuYWRkSWNlQ2FuZGlkYXRlKG5ldyBSVENJY2VDYW5kaWRhdGUoc2lnLnBheWxvYWQpKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50LnB1c2goc2lnLnBheWxvYWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdsZWF2ZScpIHtcbiAgICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdOZ1x1MDFCMFx1MUVERGkga2lhIFx1MDExMVx1MDBFMyBuZ1x1MUVBRnQgdm9pY2UuJyk7XG4gICAgICAgICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgICAgIGR1bmdLZXROb2lWb2ljZSgpO1xuICAgICAgICAgICAgc2V0Vm9pY2VKb2luZWQoZmFsc2UpO1xuICAgICAgICAgICAgdm9pY2VTbG90UmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCB7IC8qIGJcdTFFQ0YgcXVhIHNpZ25hbCBsXHUxRUQ3aSAqLyB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIC8vIFBvbGwgY2hcdTFFQTF5IGtoaSB0YWIgdm9pY2UgbVx1MUVERiAoeGVtIHRyXHUxRUExbmcgdGhcdTAwRTFpIGNcdTFFQjdwKSBob1x1MUVCN2MgXHUwMTExYW5nIHRyb25nIGNcdTFFQjdwLlxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAndm9pY2UnICYmICF2b2ljZUpvaW5lZCkgcmV0dXJuO1xuICAgIHBvbGxWb2ljZSgpO1xuICAgIHZvaWNlUG9sbFRpbWVyUmVmLmN1cnJlbnQgPSBzZXRJbnRlcnZhbChwb2xsVm9pY2UsIDE1MDApO1xuICAgIHJldHVybiAoKSA9PiB7IGlmICh2b2ljZVBvbGxUaW1lclJlZi5jdXJyZW50KSBjbGVhckludGVydmFsKHZvaWNlUG9sbFRpbWVyUmVmLmN1cnJlbnQpOyB9O1xuICB9LCBbcGhvbmcuaWQsIGRvY2tUYWIsIHZvaWNlSm9pbmVkXSk7XG5cbiAgY29uc3Qgam9pblZvaWNlID0gYXN5bmMgKCkgPT4ge1xuICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBhbmcgeGluIGNoXHUxRUQ3IHRyb25nIGNcdTFFQjdwIHZvaWNlLi4uJyk7XG4gICAgc2V0Vm9pY2VTdGF0ZSgnY29ubmVjdGluZycpO1xuICAgIHRyeSB7XG4gICAgICAvLyAxLiBHaVx1MDBFMG5oIHNsb3QgdHJcdTAwRUFuIHNlcnZlciB0clx1MDFCMFx1MUVEQmMgKHNlcnZlci1hdXRob3JpdGF0aXZlOiB0XHUxRUQxaSBcdTAxMTFhIDEgY1x1MUVCN3AgMS0xL3BoXHUwMEYybmcpXG4gICAgICBjb25zdCBqb2luUmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX2pvaW4nIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGpvaW5EYXRhID0gYXdhaXQgam9pblJlcy5qc29uKCk7XG4gICAgICBpZiAoIWpvaW5EYXRhLm9rKSB7XG4gICAgICAgIGlmIChqb2luRGF0YS5jb2RlID09PSAnZ3JhbnRfcmVxdWlyZWQnKSB7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0JcdTFFQTFuIGNcdTFFQTduIFx1MDExMVx1MDFCMFx1MUVFM2MgY1x1MUVBNXAgcXV5XHUxRUMxbiB2b2ljZSBcdTIwMTQgaFx1MDBFM3kgYlx1MUVBNW0gXCJYaW4gcXV5XHUxRUMxbiB2b2ljZVwiLicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKGpvaW5EYXRhLmxvaSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyB0aGFtIGdpYSB2b2ljZS4nKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdm9pY2VTbG90UmVmLmN1cnJlbnQgPSBqb2luRGF0YS5zbG90O1xuICAgICAgc2V0Vm9pY2VKb2luZWQodHJ1ZSk7XG5cbiAgICAgIC8vIDIuIFhpbiBtaWMgVFJcdTAxQUZcdTFFREFDIGtoaSB0XHUxRUExbyBvZmZlciBcdTIwMTQgdHJhY2sgcGhcdTFFQTNpIGNcdTAwRjMgc1x1MUVCNW4gdHJvbmcgU0RQIG5lZ290aWF0aW9uLFxuICAgICAgLy8gICAgYWRkVHJhY2sgc2F1IGtoaSBcdTAxMTFcdTAwRTMgYlx1MUVBRnQgdGF5IG1cdTAwRTAga2hcdTAwRjRuZyByZW5lZ290aWF0ZSBcdTIxOTIgbmdcdTAxQjBcdTFFRERpIGtpYSBraFx1MDBGNG5nIG5naGUgXHUwMTExXHUwMUIwXHUxRUUzYy5cbiAgICAgIC8vICAgIE1pYyBraFx1MUVERmkgXHUwMTExXHUxRUE3dSBtdXRlZCAoZW5hYmxlZD1mYWxzZSkgXHUyMDE0IHVzZXIgdFx1MUVGMSBiXHUxRUFEdCBiXHUxRUIxbmcgblx1MDBGQXQgTWljLlxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc3RyZWFtID0gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoeyBhdWRpbzogdHJ1ZSwgdmlkZW86IGZhbHNlIH0pO1xuICAgICAgICBzdHJlYW0uZ2V0QXVkaW9UcmFja3MoKS5mb3JFYWNoKHQgPT4geyB0LmVuYWJsZWQgPSBmYWxzZTsgfSk7XG4gICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQgPSBzdHJlYW07XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0toXHUwMEY0bmcgeGluIFx1MDExMVx1MDFCMFx1MUVFM2MgbWljcm8gXHUyMDE0IGJcdTFFQTFuIGNoXHUxRUM5IG5naGUgXHUwMTExXHUwMUIwXHUxRUUzYywga2hcdTAwRjRuZyBuXHUwMEYzaSBcdTAxMTFcdTAxQjBcdTFFRTNjLicpO1xuICAgICAgfVxuXG4gICAgICAvLyAzLiBUXHUxRUExbyBwZWVyIGNvbm5lY3Rpb25cbiAgICAgIGNvbnN0IHBjID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKHtcbiAgICAgICAgaWNlU2VydmVyczogW3sgdXJsczogJ3N0dW46c3R1bi5sLmdvb2dsZS5jb206MTkzMDInIH1dXG4gICAgICB9KTtcbiAgICAgIHBjUmVmLmN1cnJlbnQgPSBwYztcbiAgICAgIGlmIChsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0VHJhY2tzKCkuZm9yRWFjaCh0ID0+IHBjLmFkZFRyYWNrKHQsIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpKTtcbiAgICAgIH1cblxuICAgICAgcGMub25pY2VjYW5kaWRhdGUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmNhbmRpZGF0ZSkge1xuICAgICAgICAgIGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgICAgICBhY3Rpb246ICd2b2ljZV9zaWduYWwnLFxuICAgICAgICAgICAgICBzaWduYWxUeXBlOiAnY2FuZGlkYXRlJyxcbiAgICAgICAgICAgICAgcGF5bG9hZDogZXZlbnQuY2FuZGlkYXRlXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcGMub250cmFjayA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAocmVtb3RlQXVkaW9SZWYuY3VycmVudCAmJiBldmVudC5zdHJlYW1zWzBdKSB7XG4gICAgICAgICAgcmVtb3RlQXVkaW9SZWYuY3VycmVudC5zcmNPYmplY3QgPSBldmVudC5zdHJlYW1zWzBdO1xuICAgICAgICAgIHJlbW90ZUF1ZGlvUmVmLmN1cnJlbnQucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcGMub25jb25uZWN0aW9uc3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHMgPSBwYy5jb25uZWN0aW9uU3RhdGU7XG4gICAgICAgIGlmIChzID09PSAnY29ubmVjdGVkJykge1xuICAgICAgICAgIHNldFZvaWNlU3RhdGUoJ2Nvbm5lY3RlZCcpO1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdcdTI3MTMgXHUwMTEwYW5nIGtcdTFFQkZ0IG5cdTFFRDFpIHRob1x1MUVBMWkgMS0xIHRyXHUxRUYxYyB0aVx1MUVCRnAuJyk7XG4gICAgICAgIH0gZWxzZSBpZiAocyA9PT0gJ2ZhaWxlZCcgfHwgcyA9PT0gJ2Rpc2Nvbm5lY3RlZCcpIHtcbiAgICAgICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnTVx1MUVBNXQga1x1MUVCRnQgblx1MUVEMWkgdGhvXHUxRUExaSAobVx1MUVBMW5nIGNoXHUxRUI3biBQMlAgblx1MUVCRnUga2hcdTAwRjRuZyBjXHUwMEYzIFRVUk4pLicpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyA0LiBTbG90ICdiJyAobmdcdTAxQjBcdTFFRERpIHZcdTAwRTBvIHNhdSkgdFx1MUVBMW8gb2ZmZXI7IHNsb3QgJ2EnIGNoXHUxRUREIG9mZmVyIHRcdTFFRUIgcG9sbC5cbiAgICAgIGlmIChqb2luRGF0YS5zbG90ID09PSAnYicpIHtcbiAgICAgICAgY29uc3Qgb2ZmZXIgPSBhd2FpdCBwYy5jcmVhdGVPZmZlcigpO1xuICAgICAgICBhd2FpdCBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcbiAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdvZmZlcicsIHBheWxvYWQ6IG9mZmVyIH0pXG4gICAgICAgIH0pO1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwXHUwMEUzIHZcdTAwRTBvIGNcdTFFQjdwIFx1MjAxNCBcdTAxMTFhbmcgYlx1MUVBRnQgdGF5IHZcdTFFREJpICcgKyAodm9pY2VQYWlyPy5hVGVuIHx8ICduZ1x1MDFCMFx1MUVERGkga2lhJykgKyAnXHUyMDI2Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnQlx1MUVBMW4gbFx1MDBFMCBuZ1x1MDFCMFx1MUVERGkgXHUwMTExXHUxRUE3dSB0aVx1MDBFQW4gXHUyMDE0IGNoXHUxRUREIHRoXHUwMEVBbSAxIG5nXHUwMUIwXHUxRUREaSB2XHUwMEUwbyB2b2ljZVx1MjAyNicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIHZvaWNlOiAnICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHhpblF1eWVuVm9pY2UgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9yZXF1ZXN0JyB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIGQuZ3JhbnRlZCkge1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnQlx1MUVBMW4gXHUwMTExXHUwMEUzIFx1MDExMVx1MDFCMFx1MUVFM2MgcGhcdTAwRTlwIHZvaWNlIFx1MjAxNCBiXHUxRUE1bSBUaGFtIGdpYS4nKTtcbiAgICAgIH0gZWxzZSBpZiAoZC5vaykge1xuICAgICAgICBzZXRWb2ljZVJlcXVlc3RlZCh0cnVlKTtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMFx1MDBFMyBnXHUxRUVEaSB5XHUwMEVBdSBjXHUxRUE3dSBcdTIwMTQgY2hcdTFFREQgcXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcgZHV5XHUxRUM3dC4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKGQubG9pIHx8ICdLaFx1MDBGNG5nIGdcdTFFRURpIFx1MDExMVx1MDFCMFx1MUVFM2MgeVx1MDBFQXUgY1x1MUVBN3UuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IHNldFZvaWNlTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaS4nKTsgfVxuICB9O1xuXG4gIGNvbnN0IG5nYXRWb2ljZUNhcCA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIWNvbmZpcm0oJ05nXHUxRUFGdCBjXHUxRUI3cCB2b2ljZSBcdTAxMTFhbmcgaG9cdTFFQTF0IFx1MDExMVx1MUVEOW5nPycpKSByZXR1cm47XG4gICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX2VuZCcgfSlcbiAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgcG9sbFZvaWNlKCk7XG4gIH07XG5cbiAgY29uc3QgdG9nZ2xlTWljID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmIChtaWNNdXRlZCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCFsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgLy8gTWljIGJcdTFFQ0IgdFx1MUVFQiBjaFx1MUVEMWkgbFx1MDBGQWMgam9pbiBcdTIxOTIgeGluIGxcdTFFQTFpOyBhZGRUcmFjayBtdVx1MUVEOW4gY1x1MUVBN24gcmVuZWdvdGlhdGUgKG9mZmVyIG1cdTFFREJpKS5cbiAgICAgICAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7IGF1ZGlvOiB0cnVlLCB2aWRlbzogZmFsc2UgfSk7XG4gICAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudCA9IHN0cmVhbTtcbiAgICAgICAgICBjb25zdCBwYyA9IHBjUmVmLmN1cnJlbnQ7XG4gICAgICAgICAgaWYgKHBjKSB7XG4gICAgICAgICAgICBzdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaCh0cmFjayA9PiBwYy5hZGRUcmFjayh0cmFjaywgc3RyZWFtKSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBvZmZlciA9IGF3YWl0IHBjLmNyZWF0ZU9mZmVyKCk7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpO1xuICAgICAgICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ29mZmVyJywgcGF5bG9hZDogb2ZmZXIgfSlcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogcmVuZWdvdGlhdGlvbiB0aFx1MUVBNXQgYlx1MUVBMWkgXHUyMDE0IG5naGUgdlx1MUVBQm4gXHUwMTExXHUwMUIwXHUxRUUzYyAqLyB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0QXVkaW9UcmFja3MoKS5mb3JFYWNoKHQgPT4geyB0LmVuYWJsZWQgPSB0cnVlOyB9KTtcbiAgICAgICAgfVxuICAgICAgICBzZXRNaWNNdXRlZChmYWxzZSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgYWxlcnQoJ0toXHUwMEY0bmcgdGhcdTFFQzMgbVx1MUVERiBtaWNybzogJyArIGVyci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRBdWRpb1RyYWNrcygpLmZvckVhY2godCA9PiB7IHQuZW5hYmxlZCA9IGZhbHNlOyB9KTtcbiAgICAgIH1cbiAgICAgIHNldE1pY011dGVkKHRydWUpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBsZWF2ZVZvaWNlID0gKCkgPT4ge1xuICAgIGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnbGVhdmUnLCBwYXlsb2FkOiB7fSB9KVxuICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICBkdW5nS2V0Tm9pVm9pY2UoKTtcbiAgICBzZXRWb2ljZUpvaW5lZChmYWxzZSk7XG4gICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgdm9pY2VTbG90UmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBcdTAwRTMgbmdcdTFFQUZ0IHZvaWNlLicpO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBpZD1cInN0dWR5LWRvY2stY29udGFpbmVyXCIgY2xhc3NOYW1lPVwiYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMTYxYjI2XSB0by1bIzBmMTQxZF0gYm9yZGVyIGJvcmRlci13aGl0ZS9bMC4wOF0gcm91bmRlZC0yeGwgcC00IGZsZXggZmxleC1jb2wgaC1mdWxsIG1pbi1oLVs0MjBweF0gbGc6bWluLWgtWzQ4MHB4XSBzaGFkb3cteGxcIj5cbiAgICAgIHsvKiBTdHVkeSBEb2NrIFRhYiBOYXZpZ2F0aW9uIFx1MjAxNCBHXHUxRUNEbiBnXHUwMEUwbmcsIHRoXHUxRUE5bSBtXHUxRUY5LCBuXHUwMEZBdCBuXHUxRUQ1aSBiXHUxRUFEdCAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIHBiLTMgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIGZsZXgtd3JhcFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LWNoYXRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdjaGF0Jyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnY2hhdCdcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENBQzwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkNoYXQgcGhcdTAwRjJuZzwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1ub3Rlc1wiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ25vdGVzJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnbm90ZXMnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDREQ8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5HaGkgY2hcdTAwRkE8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktd2hpdGVib2FyZFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3doaXRlYm9hcmQnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICd3aGl0ZWJvYXJkJ1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkE4PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Qlx1MUVBM25nIHZcdTFFQkQ8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktc2hlZXRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdzaGVldCcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3NoZWV0J1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0NBPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Qlx1MUVBM25nIHRcdTAwRURuaDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS12b2ljZVwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3ZvaWNlJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAndm9pY2UnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1hbWJlci01MDAgdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMjUxLDE5MSwzNiwwLjM1KV0gYm9yZGVyIGJvcmRlci1hbWJlci00MDAvNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERjk5XHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Vm9pY2UgKDEtMSk8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktbWVtYmVyc1wiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ21lbWJlcnMnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdtZW1iZXJzJ1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1lbWVyYWxkLTQwMCB0by10ZWFsLTUwMCB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSg1MiwyMTEsMTUzLDAuMzUpXSBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNDAwLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REM2NTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPlRoXHUwMEUwbmggdmlcdTAwRUFue3RoYW5oVmllbi5sZW5ndGggPiAwID8gYCAoJHt0aGFuaFZpZW4ubGVuZ3RofSlgIDogJyd9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAge2lzU3RhZmYgJiYgKFxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1xdWFuLXRyaVwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdxdWFuLXRyaScpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdxdWFuLXRyaSdcbiAgICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS12aW9sZXQtNTAwIHRvLXB1cnBsZS01MDAgdGV4dC13aGl0ZSBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMTM5LDkyLDI0NiwwLjM1KV0gYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzUwJ1xuICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MjY5OVx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+UXV5XHUxRUMxbjwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBEb2NrIENvbnRlbnQgQm9keSAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgcHQtMyBtaW4taC1bMzAwcHhdXCI+XG4gICAgICAgIHsvKiBUQUIgMTogQ0hBVCBQSFx1MDBEMk5HICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ2NoYXQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIG1pbi1oLTBcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXktYXV0byBzcGFjZS15LTMgcHItMSBtYXgtaC03MiBsZzptYXgtaC1bMzgwcHhdIHhsOm1heC1oLVs0NDBweF0gdGV4dC14c1wiPlxuICAgICAgICAgICAgICB7cGhvbmdDaGF0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCB0ZXh0LWNlbnRlciBweS04XCI+Q2hcdTAxQjBhIGNcdTAwRjMgdGluIG5oXHUxRUFGbiBcdTIwMTQgaFx1MDBFM3kgZ1x1MUVFRGkgY1x1MDBFMnUgaFx1MUVDRmkgaG9cdTFFQjdjIHRyYW8gXHUwMTExXHUxRUQ1aSB2XHUxRUMxIGJcdTAwRTBpIGdpXHUxRUEzbmchPC9wPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIHBob25nQ2hhdC5tYXAoKG0sIGlkeCkgPT4gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e20uaWQgfHwgaWR4fSBjbGFzc05hbWU9XCJ0ZXh0LXhzIGdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbWItMSBmbGV4LXdyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDAgdGV4dC1bMTFweF1cIj57bS50ZW5OZ3VvaUd1aX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAge20udmFpVHJvID09PSAnZ2lhb192aWVuJyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwXCI+R1ZDTjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICApIDogbS5sb3BUZW4gPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzIwXCI+e20ubG9wVGVufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge20udGFvTHVjID8gbmV3IERhdGUobS50YW9MdWMucmVwbGFjZSgnICcsICdUJykgKyAnWicpLnRvTG9jYWxlVGltZVN0cmluZyhbXSwgeyBob3VyOiAnMi1kaWdpdCcsIG1pbnV0ZTogJzItZGlnaXQnIH0pIDogJyd9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiWG9cdTAwRTEgdGluIG5oXHUxRUFGbiBuXHUwMEUweSAocXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jaGF0P3Bob25nSWQ9JHtwaG9uZy5pZH0maWQ9JHttLmlkfWAsIHsgbWV0aG9kOiAnREVMRVRFJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQub2sgJiYgb25Yb2FUaW5QaG9uZykgb25Yb2FUaW5QaG9uZyhtLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgKi8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcGFjaXR5LTAgZ3JvdXAtaG92ZXI6b3BhY2l0eS0xMDAgcHgtMSB0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtcm9zZS00MDAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvNSBob3Zlcjpib3JkZXItWyMwMEYyRkVdLzE1IHJvdW5kZWQteGwgcHgtMyBweS0yIHRleHQtc2xhdGUtMjAwIHRleHQteHMgbGVhZGluZy1yZWxheGVkIGJyZWFrLXdvcmRzIHRyYW5zaXRpb24tY29sb3JzXCI+XG4gICAgICAgICAgICAgICAgICAgICAge20ubm9pRHVuZ31cbiAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPGRpdiByZWY9e2NoYXRFbmRSZWZ9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVNlbmRSb29tQ2hhdH0gY2xhc3NOYW1lPVwicHQtMiBib3JkZXItdCBib3JkZXItd2hpdGUvOCBmbGV4IGZsZXgtY29sIGdhcC0yIG10LWF1dG9cIj5cbiAgICAgICAgICAgICAgey8qIEVtb2ppIHBhbmVsICovfVxuICAgICAgICAgICAgICB7c2hvd0Vtb2ppICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGdhcC0xIHAtMiBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bFwiPlxuICAgICAgICAgICAgICAgICAge1snXHVEODNEXHVERTBBJywnXHVEODNEXHVERTAyJywnXHVEODNFXHVERDcwJywnXHVEODNEXHVERTBFJywnXHVEODNFXHVERDE0JywnXHVEODNEXHVERTA1JywnXHVEODNEXHVERTJEJywnXHVEODNEXHVERDI1JywnXHUyNzY0XHVGRTBGJywnXHVEODNEXHVEQzREJywnXHVEODNEXHVERTRGJywnXHVEODNDXHVERjg5JywnXHUyNzA1JywnXHVEODNEXHVEQ0FGJywnXHVEODNEXHVEQzRCJywnXHVEODNEXHVEQ0RBJywnXHUyNzBGXHVGRTBGJywnXHVEODNDXHVERkFGJywnXHVEODNDXHVERjFGJywnXHVEODNEXHVEQ0ExJywnXHUyNkExJywnXHVEODNDXHVERkM2JywnXHVEODNFXHVERDFEJywnXHVEODNEXHVEQ0FBJywnXHVEODNFXHVERDI5J10ubWFwKGVtID0+IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBrZXk9e2VtfSB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldENoYXRJbnB1dCh2ID0+IHYgKyBlbSk7IHNldFNob3dFbW9qaShmYWxzZSk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1sZyBob3ZlcjpzY2FsZS0xMjUgdHJhbnNpdGlvbi10cmFuc2Zvcm0gYWN0aXZlOnNjYWxlLTk1IHB4LTFcIj57ZW19PC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgZmxleC0xXCI+XG4gICAgICAgICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1waG9uZy1jaGF0XCJcbiAgICAgICAgICAgICAgICAgICAgcm93cz17MX1cbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e2NvUXV5ZW4oJ2NoYXQnKSA/ICdOaFx1MUVBRm4gdGluIHBoXHUwMEYybmcgaFx1MUVDRGMuLi4nIDogJ0NoYXQgXHUwMTExYW5nIGJcdTFFQ0Iga2hcdTAwRjNhJ31cbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2NoYXRJbnB1dH1cbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjb1F1eWVuKCdjaGF0Jyl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldENoYXRJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25TdGFydD17KCkgPT4geyBjaGF0Q29tcG9zaW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPXsoKSA9PiB7IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCA9IGZhbHNlOyB9fVxuICAgICAgICAgICAgICAgICAgICBvbktleURvd249e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiAhZS5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUubmF0aXZlRXZlbnQ/LmlzQ29tcG9zaW5nIHx8IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlU2VuZFJvb21DaGF0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICBtYXhMZW5ndGg9ezUwMH1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHB4LTQgcHktMi41IHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTAgZm9jdXM6c2hhZG93LVswXzBfMTJweF9yZ2JhKDAsMjQyLDI1NCwwLjEyKV0gcmVzaXplLW5vbmUgbWluLWgtWzM4cHhdIG1heC1oLTI0IGRpc2FibGVkOm9wYWNpdHktNDAgdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7LyogRW1vamkgYnV0dG9uICovfVxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjb1F1eWVuKCdjaGF0Jyl9XG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93RW1vamkodiA9PiAhdil9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTkgaC05IHJvdW5kZWQtMnhsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtYmFzZSB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTMwIHNocmluay0wIGFjdGl2ZTpzY2FsZS05MCAke1xuICAgICAgICAgICAgICAgICAgICBzaG93RW1vamkgPyAnYmctWyMwMEYyRkVdLzIwIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIHRleHQtWyMwMEYyRkVdJyA6ICdiZy13aGl0ZS81IGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSBob3ZlcjpiZy13aGl0ZS8xMCdcbiAgICAgICAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDaFx1MUVDRG4gZW1vamlcIj5cbiAgICAgICAgICAgICAgICAgIFx1RDgzRFx1REUwQVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIHsvKiBTZW5kIGJ1dHRvbiAqL31cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXNlbmQtcGhvbmctY2hhdFwiXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNoYXRJbnB1dC50cmltKCkgfHwgY2hhdFNlbmRpbmcgfHwgIWNvUXV5ZW4oJ2NoYXQnKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctOSBoLTkgcm91bmRlZC0yeGwgYmctZ3JhZGllbnQtdG8tYnIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzQjgyRjZdIHRleHQtYmxhY2sgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTMwIHNocmluay0wIGhvdmVyOmJyaWdodG5lc3MtMTEwIGFjdGl2ZTpzY2FsZS05MCBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMCwyNDIsMjU0LDAuMyldXCI+XG4gICAgICAgICAgICAgICAgICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiIGNsYXNzTmFtZT1cInctNCBoLTRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0zLjQ3OCAyLjQwNWEuNzUuNzUgMCAwMC0uOTI2Ljk0bDIuNDMyIDcuOTA1SDEzLjVhLjc1Ljc1IDAgMDEwIDEuNUg0Ljk4NGwtMi40MzIgNy45MDVhLjc1Ljc1IDAgMDAuOTI2Ljk0IDYwLjUxOSA2MC41MTkgMCAwMDE4LjQ0NS04Ljk4Ni43NS43NSAwIDAwMC0xLjIxOEE2MC41MTcgNjAuNTE3IDAgMDAzLjQ3OCAyLjQwNXpcIiAvPlxuICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgMjogR0hJIENIXHUwMERBIENcdTFFRDhORyBUXHUwMEMxQyBcdTIwMTQgZW50cnkgYXBwZW5kLCBjXHUwMEYzIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ25vdGVzJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMlwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgPHNwYW4+R2hpIGNoXHUwMEZBIGNodW5nIGNcdTFFRTdhIHBoXHUwMEYybmcgXHUyMDE0IG1cdTFFRDdpIG5nXHUwMUIwXHUxRUREaSB0aFx1MDBFQW0gbVx1MUVEOXQgZFx1MDBGMm5nLCBjXHUwMEYzIHRoXHUxRUMzIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvPC9zcGFuPlxuICAgICAgICAgICAgICB7bm90ZXNOb3RpY2UgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1yb3NlLTMwMCBmb250LWJvbGRcIj57bm90ZXNOb3RpY2V9PC9zcGFuPn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHNwYWNlLXktMiBwci0xIG1heC1oLTY0IG1pbi1oLVsxODBweF0gYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTIuNVwiPlxuICAgICAgICAgICAgICB7bm90ZXNMaXN0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCB0ZXh0LWNlbnRlciBweS04XCI+Q2hcdTAxQjBhIGNcdTAwRjMgZ2hpIGNoXHUwMEZBIFx1MjAxNCB0aFx1MDBFQW0gZFx1MDBGMm5nIFx1MDExMVx1MUVBN3UgdGlcdTAwRUFuIGNobyBjXHUxRUEzIHBoXHUwMEYybmcuPC9wPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIG5vdGVzTGlzdC5tYXAoKG4pID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtuLmlkfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLXN0YXJ0IGdhcC0yIGdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtNDAwXCI+e24udGVufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtuLnZpZGVvVGltZVNlYyAhPSBudWxsICYmIG4udmlkZW9UaW1lU2VjID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB5ZXVDYXVUdWEobi52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIGhvdmVyOmJnLXZpb2xldC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYge2RpbmhEYW5nR2lheVBodXQobi52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNjAwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7bi50YW9MdWMgPyBuZXcgRGF0ZShuLnRhb0x1Yy5yZXBsYWNlKCcgJywgJ1QnKSArICdaJykudG9Mb2NhbGVUaW1lU3RyaW5nKFtdLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSkgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMjAwIGxlYWRpbmctcmVsYXhlZCBicmVhay13b3Jkc1wiPntuLm5vaUR1bmd9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgeyhuLmN1YVRvaSB8fCBpc1N0YWZmKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB4b2FHaGlDaHUobi5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlhvXHUwMEUxIGdoaSBjaFx1MDBGQVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcGFjaXR5LTAgZ3JvdXAtaG92ZXI6b3BhY2l0eS0xMDAgdGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1yb3NlLTQwMCB0ZXh0LVsxMHB4XSBweC0xIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHtub3Rlc0NhbldyaXRlID8gKFxuICAgICAgICAgICAgICA8Zm9ybVxuICAgICAgICAgICAgICAgIG9uU3VibWl0PXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIGlmICghZS5uYXRpdmVFdmVudD8uaXNDb21wb3NpbmcgJiYgIW5vdGVDb21wb3NpbmdSZWYuY3VycmVudCkgdGhlbUdoaUNodSgpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICBpZD1cInN0dWR5LW5vdGUtaW5wdXRcIlxuICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e25vdGVJbnB1dH1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldE5vdGVJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ9eygpID0+IHsgbm90ZUNvbXBvc2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ9eygpID0+IHsgbm90ZUNvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7IH19XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlRoXHUwMEVBbSBnaGkgY2hcdTAwRkEgY2hvIHBoXHUwMEYybmcuLi5cIlxuICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXsxMDAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTAgcm91bmRlZC14bCBweC0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmVcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXROb3RlV2l0aFRpbWUodiA9PiAhdil9XG4gICAgICAgICAgICAgICAgICB0aXRsZT17bm90ZVdpdGhUaW1lID8gJ1x1MDExMGFuZyBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbyB2XHUwMEUwbyBnaGkgY2hcdTAwRkEnIDogJ0toXHUwMEY0bmcgZ1x1MUVBRm4gbVx1MUVEMWMgdmlkZW8nfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtub3RlV2l0aFRpbWUgPyAnYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyLXZpb2xldC01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS01MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAgICAgIFx1MjNGMVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tYWRkLW5vdGVcIlxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFub3RlSW5wdXQudHJpbSgpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIHJvdW5kZWQteGwgYmctWyMwMEYyRkVdIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJsYWNrIGRpc2FibGVkOm9wYWNpdHktMzBcIj5cbiAgICAgICAgICAgICAgICAgIFRoXHUwMEVBbVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LWFtYmVyLTMwMC84MCB0ZXh0LWNlbnRlciBweS0xXCI+XHVEODNEXHVERDEyIEdoaSBjaFx1MDBGQSBcdTAxMTFhbmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSBjaFx1MUVDOSB4ZW0gXHUyMDE0IHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nIFx1MDExMVx1MDBFMyBraFx1MDBGM2EuPC9wPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDM6IEJcdTFFQTJORyBWXHUxRUJDIENcdTFFRDhORyBUXHUwMEMxQyAoU0hBUkVEIFdISVRFQk9BUkQpICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ3doaXRlYm9hcmQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0yXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBmbGV4LXdyYXAgdGV4dC14cyBwYi0xXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLXBlblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRXYlRvb2woJ3BlbicpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JUb29sID09PSAncGVuJyA/ICdiZy1bIzAwRjJGRV0gdGV4dC1ibGFjaycgOiAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAnfWB9PlxuICAgICAgICAgICAgICAgICAgXHUyNzBGXHVGRTBGIEJcdTAwRkF0IHZcdTFFQkRcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLWVyYXNlclwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRXYlRvb2woJ2VyYXNlcicpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JUb29sID09PSAnZXJhc2VyJyA/ICdiZy1yb3NlLTUwMCB0ZXh0LXdoaXRlJyA6ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCd9YH0+XG4gICAgICAgICAgICAgICAgICBcdUQ4M0VcdURERjkgVFx1MUVBOXlcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIG1sLTJcIj5cbiAgICAgICAgICAgICAgICAgIHtbJyMwMEYyRkUnLCAnI0ZGQjgwMCcsICcjRjQzRjVFJywgJyNGRkZGRkYnXS5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e2N9XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0V2JDb2xvcihjKTsgc2V0V2JUb29sKCdwZW4nKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTUgaC01IHJvdW5kZWQtZnVsbCBib3JkZXIgZGlzYWJsZWQ6b3BhY2l0eS00MCAke3diQ29sb3IgPT09IGMgJiYgd2JUb29sID09PSAncGVuJyA/ICdzY2FsZS0xMTAgYm9yZGVyLXdoaXRlIHJpbmctMiByaW5nLWN5YW4tNDAwJyA6ICdib3JkZXItdHJhbnNwYXJlbnQnfWB9XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogYyB9fVxuICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtjfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICB7aXNTdGFmZiAmJiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi13Yi1jbGVhclwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtjbGVhcldoaXRlYm9hcmR9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXdoaXRlLzUgaG92ZXI6Ymctcm9zZS01MDAvMjAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQteHMgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICBYXHUwMEYzYSBiXHUxRUEzbmdcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBvdmVyZmxvdy1oaWRkZW4gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcmVsYXRpdmUgdG91Y2gtbm9uZSBtaW4taC1bMjIwcHhdXCI+XG4gICAgICAgICAgICAgIHshd2JDYW5Xcml0ZSAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIHotMTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctYmxhY2svNDAgdGV4dC1bMTFweF0gdGV4dC1hbWJlci0zMDAvOTAgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTIgQlx1MUVBM25nIHZcdTFFQkQgXHUwMTExYW5nIFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgY2hcdTFFQzkgeGVtXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDxjYW52YXNcbiAgICAgICAgICAgICAgICBpZD1cInN0dWR5LXdoaXRlYm9hcmQtY2FudmFzXCJcbiAgICAgICAgICAgICAgICByZWY9e2NhbnZhc1JlZn1cbiAgICAgICAgICAgICAgICB3aWR0aD17NjQwfVxuICAgICAgICAgICAgICAgIGhlaWdodD17MzIwfVxuICAgICAgICAgICAgICAgIG9uTW91c2VEb3duPXt3YkNhbldyaXRlID8gc3RhcnREcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uTW91c2VNb3ZlPXt3YkNhbldyaXRlID8gZHJhd01vdmUgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZVVwPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaFN0YXJ0PXt3YkNhbldyaXRlID8gc3RhcnREcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uVG91Y2hNb3ZlPXt3YkNhbldyaXRlID8gZHJhd01vdmUgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaEVuZD17d2JDYW5Xcml0ZSA/IHN0b3BEcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBoLWZ1bGwgJHt3YkNhbldyaXRlID8gJ2N1cnNvci1jcm9zc2hhaXInIDogJ2N1cnNvci1ub3QtYWxsb3dlZCd9YH1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNDogQlx1MUVBMk5HIFRcdTAwQ0ROSCBDXHUxRUQ4TkcgVFx1MDBDMUMgKFNIQVJFRCBTSEVFVCA4eDEwKSAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdzaGVldCcgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTIgb3ZlcmZsb3cteC1hdXRvXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICAgIEJcdTFFQTNuZyB0XHUwMEVEbmggcGhcdTAwRTJuIHRcdTAwRURjaCBzXHUxRUQxIGxpXHUxRUM3dSAvIG1cdTFFRDFjIHRoXHUxRUREaSBnaWFuIGhcdTFFQ0RjIHRcdTFFQURwIChMXHUwMUIwdSB0XHUxRUYxIFx1MDExMVx1MUVEOW5nKVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy1hdXRvIG1heC1oLTcyIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBiZy1bIzBCMEUxNF1cIj5cbiAgICAgICAgICAgICAgPHRhYmxlIGlkPVwic3R1ZHktc2hlZXQtdGFibGVcIiBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC14cyB0ZXh0LXNsYXRlLTMwMCBib3JkZXItY29sbGFwc2VcIj5cbiAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItYiBib3JkZXItd2hpdGUvMTAgZm9udC1tb25vXCI+XG4gICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJ3LTggcC0xIHRleHQtY2VudGVyIGJvcmRlci1yIGJvcmRlci13aGl0ZS8xMCB0ZXh0LVsxMHB4XVwiPiM8L3RoPlxuICAgICAgICAgICAgICAgICAgICB7Q09MUy5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgPHRoIGtleT17Y30gY2xhc3NOYW1lPVwicC0xLjUgdGV4dC1jZW50ZXIgYm9yZGVyLXIgYm9yZGVyLXdoaXRlLzEwIG1pbi13LVs3MHB4XSB0ZXh0LVsxMXB4XSBmb250LWJvbGQgdGV4dC1jeWFuLTMwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge2N9XG4gICAgICAgICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAge1JPV1MubWFwKHIgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8dHIga2V5PXtyfSBjbGFzc05hbWU9XCJib3JkZXItYiBib3JkZXItd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS9bMC4wMl1cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0xIHRleHQtY2VudGVyIGJnLXdoaXRlLzUgdGV4dC1zbGF0ZS01MDAgZm9udC1tb25vIHRleHQtWzEwcHhdIGJvcmRlci1yIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3J9XG4gICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICB7Q09MUy5tYXAoYyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjZWxsS2V5ID0gYCR7Y30ke3J9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBrZXk9e2NlbGxLZXl9IGNsYXNzTmFtZT1cInAtMCBib3JkZXItciBib3JkZXItd2hpdGUvNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS1jZWxsPXtjZWxsS2V5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3NoZWV0Q2VsbHNbY2VsbEtleV0gfHwgJyd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFkT25seT17IXNoZWV0Q2FuV3JpdGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkZvY3VzPXsoKSA9PiB7IHNoZWV0Rm9jdXNlZENlbGxSZWYuY3VycmVudCA9IGNlbGxLZXk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IHsgc2hlZXRGb2N1c2VkQ2VsbFJlZi5jdXJyZW50ID0gbnVsbDsgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNoZWV0Q2FuV3JpdGUgJiYgaGFuZGxlQ2VsbENoYW5nZShjZWxsS2V5LCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgYmctdHJhbnNwYXJlbnQgcHgtMiBweS0xIHRleHQteHMgdGV4dC13aGl0ZSBmb2N1czpiZy1bIzE1MUEyM10gZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLVsjMDBGMkZFXSAkeyFzaGVldENhbldyaXRlID8gJ29wYWNpdHktNjAgY3Vyc29yLW5vdC1hbGxvd2VkJyA6ICcnfWB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRBQiA1OiAxLVRPLTEgV0VCUlRDIFZPSUNFIFx1MjAxNCBwYWlyLWJvdW5kLCBjXHUwMEYzIHhpbiBxdXlcdTFFQzFuICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ3ZvaWNlJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC02IHRleHQtY2VudGVyIGdhcC00XCI+XG4gICAgICAgICAgICA8YXVkaW8gcmVmPXtyZW1vdGVBdWRpb1JlZn0gYXV0b1BsYXkgLz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xNiBoLTE2IHJvdW5kZWQtM3hsIGJnLWFtYmVyLTQwMC8xNSBib3JkZXIgYm9yZGVyLWFtYmVyLTQwMC8zMCB0ZXh0LWFtYmVyLTQwMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LTN4bCBzaGFkb3ctWzBfMF8yMHB4X3JnYmEoMjQ1LDE1OCwxMSwwLjIpXVwiPlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcdUZFMEZcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlXCI+VGhvXHUxRUExaSBUclx1MUVGMWMgVGlcdTFFQkZwIDEtMSBUcm9uZyBQaFx1MDBGMm5nPC9oND5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBtYXgtdy14cyBtdC0xXCI+XG4gICAgICAgICAgICAgICAgTVx1MUVEN2kgcGhcdTAwRjJuZyB0XHUxRUQxaSBcdTAxMTFhIG1cdTFFRDl0IGNcdTFFQjdwIHZvaWNlIDEtMS4gTWljcm8gbVx1MUVCN2MgXHUwMTExXHUxRUNCbmggdFx1MUVBRnQga2hpIGNoXHUwMUIwYSBiXHUxRUFEdC5cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBUclx1MUVBMW5nIHRoXHUwMEUxaSBjXHUxRUI3cCBoaVx1MUVDN24gdFx1MUVBMWkgKi99XG4gICAgICAgICAgICB7dm9pY2VQYWlyPy5hY3RpdmUgIT09IHVuZGVmaW5lZCAmJiAoXG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBiZy13aGl0ZS81IHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICAgIHt2b2ljZVBhaXI/LmFUZW4gPyBgJHt2b2ljZVBhaXIuYVRlbn0ke3ZvaWNlUGFpci5iVGVuID8gJyBcdTIxOTQgJyArIHZvaWNlUGFpci5iVGVuIDogJyBcdTAwQjcgXHUwMTExYW5nIGNoXHUxRUREIG5nXHUwMUIwXHUxRUREaSB0aFx1MUVFOSAyJ31gIDogJ0NoXHUwMUIwYSBjXHUwMEYzIGNcdTFFQjdwIHZvaWNlIG5cdTAwRTBvJ31cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyBmbGV4LXdyYXAganVzdGlmeS1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgeyF2b2ljZUpvaW5lZCA/IChcbiAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAge2NvUXV5ZW4oJ3ZvaWNlJykgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1qb2luXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtqb2luVm9pY2V9XG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZvaWNlUGFpcj8uYWN0aXZlICYmICF2b2ljZVBhaXI/LnlvdUlufVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMi41IHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1vcmFuZ2UtNTAwIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIHNoYWRvdy1sZyBob3ZlcjpvcGFjaXR5LTkwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3ZvaWNlUGFpcj8uYWN0aXZlID8gJ1x1MDExMGFuZyBjXHUwMEYzIGNcdTFFQjdwIHZvaWNlIGtoXHUwMEUxYycgOiB2b2ljZVBhaXI/LmFUZW4gPyAnVlx1MDBFMG8gY1x1MUVCN3Agdlx1MUVEQmkgJyArIHZvaWNlUGFpci5hVGVuIDogJ1RoYW0gZ2lhIHZvaWNlJ31cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2UtcmVxdWVzdFwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17eGluUXV5ZW5Wb2ljZX1cbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dm9pY2VSZXF1ZXN0ZWR9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNSBweS0yLjUgcm91bmRlZC14bCBiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTIwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IGZvbnQtYm9sZCB0ZXh0LXhzIGhvdmVyOmJnLXdoaXRlLzE1IHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7dm9pY2VSZXF1ZXN0ZWQgPyAnXHUyM0YzIFx1MDExMGFuZyBjaFx1MUVERCBkdXlcdTFFQzd0XHUyMDI2JyA6ICdcdUQ4M0RcdURFNEIgWGluIHF1eVx1MUVDMW4gdm9pY2UnfVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLXRvZ2dsZS1taWNcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVNaWN9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTQgcHktMi41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke21pY011dGVkID8gJ2JnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOmJnLXdoaXRlLzE1JyA6ICdiZy1lbWVyYWxkLTUwMCB0ZXh0LWJsYWNrJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+e21pY011dGVkID8gJ1x1RDgzRFx1REQwNyBCXHUxRUFEdCBNaWMnIDogJ1x1RDgzQ1x1REY5OVx1RkUwRiBNaWMgXHUwMTEwYW5nIEJcdTFFQUR0J308L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLWxlYXZlXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17bGVhdmVWb2ljZX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8yMCB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMzAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgUlx1MUVERGkgdm9pY2VcbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICB7aXNTdGFmZiAmJiB2b2ljZVBhaXI/LmFUZW4gJiYgIXZvaWNlUGFpcj8ueW91SW4gJiYgKFxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2UtZW5kXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e25nYXRWb2ljZUNhcH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMi41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzI1IHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzIwIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICBOZ1x1MUVBRnQgY1x1MUVCN3Agdm9pY2VcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogU3RhZmY6IGRhbmggc1x1MDBFMWNoIHhpbiBxdXlcdTFFQzFuIHZvaWNlICovfVxuICAgICAgICAgICAge2lzU3RhZmYgJiYgeWV1Q2F1Vm9pY2UubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIG1heC13LXNtIGJnLXdoaXRlLzUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtMi41IHRleHQtbGVmdFwiPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdGV4dC1hbWJlci0zMDAgbWItMS41XCI+XHUwMTEwYW5nIHhpbiBxdXlcdTFFQzFuIHZvaWNlPC9wPlxuICAgICAgICAgICAgICAgIHt5ZXVDYXVWb2ljZS5tYXAociA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17ci5raG9hfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIHB5LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0yMDAgZm9udC1zZW1pYm9sZCBmbGV4LTEgdHJ1bmNhdGVcIj57ci50ZW4gfHwgJ1RoXHUwMEUwbmggdmlcdTAwRUFuJ308L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHIua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246IHRydWUgfSk7IGlmIChkPy5vaykgc2V0WWV1Q2F1Vm9pY2UocHJldiA9PiBwcmV2LmZpbHRlcih4ID0+IHgua2hvYSAhPT0gci5raG9hKSk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1lbWVyYWxkLTUwMC8yMCB0ZXh0LWVtZXJhbGQtMzAwIGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLWVtZXJhbGQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgRHV5XHUxRUM3dFxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHsgY29uc3QgZCA9IGF3YWl0IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogci5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogZmFsc2UgfSk7IGlmIChkPy5vaykgc2V0WWV1Q2F1Vm9pY2UocHJldiA9PiBwcmV2LmZpbHRlcih4ID0+IHgua2hvYSAhPT0gci5raG9hKSk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1yb3NlLTUwMC8xNSB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMjUgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgVFx1MUVFQiBjaFx1MUVEMWlcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICB7dm9pY2VOb3RpY2UgJiYgKFxuICAgICAgICAgICAgICA8cCBpZD1cInZvaWNlLXN0YXR1cy1ub3RpY2VcIiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIGZvbnQtbW9ubyBiZy1ibGFjay80MCBweC0zIHB5LTEuNSByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItd2hpdGUvNVwiPlxuICAgICAgICAgICAgICAgIHt2b2ljZU5vdGljZX1cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIG1heC13LXhzXCI+XG4gICAgICAgICAgICAgICogR2hpIGNoXHUwMEZBOiBLXHUxRUJGdCBuXHUxRUQxaSB0aG9cdTFFQTFpIFAyUCB5XHUwMEVBdSBjXHUxRUE3dSBtXHUxRUExbmcga2hcdTAwRjRuZyBjaFx1MUVCN24gVURQLiBSZXN0cmljdGl2ZSBOQVQgY1x1MDBGMyB0aFx1MUVDMyBjXHUxRUE3biByZWxheSBUVVJOLlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNzogVEhcdTAwQzBOSCBWSVx1MDBDQU4gVFJPTkcgUEhcdTAwRDJORyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdtZW1iZXJzJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMyBvdmVyZmxvdy15LWF1dG8gbWF4LWgtODAgbGc6bWF4LWgtWzQyMHB4XSBwci0xXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwYi0yIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQzY1PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlRoXHUwMEUwbmggdmlcdTAwRUFuIHRyb25nIHBoXHUwMEYybmcgKHt0aGFuaFZpZW4ubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgICBcdTAxMTBhbmcgdHJcdTFFRjFjIHR1eVx1MUVCRm5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtMlwiPlxuICAgICAgICAgICAgICB7dGhhbmhWaWVuLm1hcCgodHYsIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhSG9zdCA9IHR2LmxhQ2h1UGhvbmcgPT09IDEgfHwgdHYudmFpVHJvUGhvbmcgPT09ICdob3N0JztcbiAgICAgICAgICAgICAgICBjb25zdCBsYUdWID0gdHYudmFpVHJvID09PSAnZ2lhb192aWVuJztcbiAgICAgICAgICAgICAgICBjb25zdCBsYUNvSG9zdCA9IHR2LnZhaVRyb1Bob25nID09PSAnY29ob3N0JztcbiAgICAgICAgICAgICAgICBjb25zdCBncmFudFZvaWNlID0gZ3JhbnRzLnNvbWUoZyA9PiBnLmtob2FUViA9PT0gdHYua2hvYSAmJiBnLmNhcGFiaWxpdHkgPT09ICd2b2ljZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50VmlkZW8gPSBncmFudHMuc29tZShnID0+IGcua2hvYVRWID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZpZGVvX2NvbnRyb2wnKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgIGtleT17dHYua2hvYSB8fCB0di50ZW4gfHwgaWR4fVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41IHAtMi41IHJvdW5kZWQteGwgYmctd2hpdGUvWzAuMDNdIGhvdmVyOmJnLXdoaXRlL1swLjA2XSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgaG92ZXI6Ym9yZGVyLXRlYWwtNTAwLzI1IHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLWZ1bGwgYmctZ3JhZGllbnQtdG8tYnIgZnJvbS10ZWFsLTUwMC8yMCB0by1lbWVyYWxkLTUwMC8yMCBib3JkZXIgYm9yZGVyLXRlYWwtNTAwLzMwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteHMgZm9udC1ibGFjayB0ZXh0LXRlYWwtMzAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3R2LmF2YXRhciA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXt0di5hdmF0YXJ9IGFsdD1cIlwiIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgcm91bmRlZC1mdWxsIG9iamVjdC1jb3ZlclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICh0di50ZW4gfHwgJz8nKS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTIwMCB0cnVuY2F0ZVwiPnt0di50ZW59PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2xhSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNEXHVEQzUxIEhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUdWICYmICFsYUhvc3QgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzQ1x1REY5MyBHaVx1MDBFMW8gdmlcdTAwRUFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICB7bGFDb0hvc3QgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MkI1MCBDby1ob3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgYmxvY2sgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt0di5sb3BUZW4gPyBgTFx1MUVEQnAgJHt0di5sb3BUZW59YCA6IChsYUdWID8gJ0dpXHUwMEUxbyB2aVx1MDBFQW4gdHJcdTAxQjBcdTFFRERuZycgOiAnSFx1MUVDRGMgc2luaCcpfVxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgey8qIE1lbWJlciBhY3Rpb25zIG5cdTFFQkZ1IGxcdTAwRTAgaG9zdC9HViAqL31cbiAgICAgICAgICAgICAgICAgICAgeyh2YWlUcm9QaG9uZyA9PT0gJ2hvc3QnIHx8IGF1dGgudXNlcj8uaXNUZWFjaGVyKSAmJiAhbGFIb3N0ICYmIHR2Lmtob2EgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/Lignc2V0X2NvX2hvc3QnLCB7IGtob2FUVjogdHYua2hvYSwgb246ICFsYUNvSG9zdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2xhQ29Ib3N0ID8gJ1RodSBxdXlcdTFFQzFuIGNvLWhvc3QnIDogJ0NcdTFFQTVwIGNvLWhvc3QnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFDb0hvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlci12aW9sZXQtNTAwLzQwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjby1ob3N0XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246ICFncmFudFZvaWNlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNcdTFFQTVwL3RodSBxdXlcdTFFQzFuIG1pY1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNiBoLTYgcm91bmRlZCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LVsxMHB4XSBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFudFZvaWNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC80MCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERjk5XHVGRTBGXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZpZGVvX2NvbnRyb2wnLCBvbjogIWdyYW50VmlkZW8gfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gdmlkZW9cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTYgaC02IHJvdW5kZWQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTBweF0gYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JhbnRWaWRlb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctYmx1ZS01MDAvMjAgdGV4dC1ibHVlLTMwMCBib3JkZXItYmx1ZS01MDAvNDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzQ1x1REZBNVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpcm0oYEtpY2sgJHt0di50ZW59IGtoXHUxRUNGaSBwaFx1MDBGMm5nP2ApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdraWNrJywgeyBraG9hVFY6IHR2Lmtob2EgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZCAmJiAhZC5vaykgYWxlcnQoZC5sb2kgfHwgJ0toXHUwMEY0bmcga2ljayBcdTAxMTFcdTAxQjBcdTFFRTNjLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJLaWNrIGtoXHUxRUNGaSBwaFx1MDBGMm5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy02IGgtNiByb3VuZGVkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGJvcmRlciBiZy1yb3NlLTUwMC8xMCB0ZXh0LXJvc2UtMzAwIGJvcmRlci1yb3NlLTUwMC8yNSBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSl9XG5cbiAgICAgICAgICAgICAge3RoYW5oVmllbi5sZW5ndGggPT09IDAgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgcHktOCB0ZXh0LXNsYXRlLTUwMCB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgICBDaFx1MDFCMGEgY1x1MDBGMyB0aFx1MDBFMG5oIHZpXHUwMEVBbiBuXHUwMEUwbyB0cm9uZyBwaFx1MDBGMm5nLlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cblxuXG4gICAgICAgIHsvKiBUQUIgNjogUVVcdTFFQTJOIFRSXHUxRUNBIFBIXHUwMEQyTkcgKHN0YWZmIG9ubHkpIFx1MjAxNCBwb2xpY3kgbWF0cml4ICsgbWVtYmVyIGFjdGlvbnMgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAncXVhbi10cmknICYmIGlzU3RhZmYgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTMgb3ZlcmZsb3cteS1hdXRvIG1heC1oLTgwIHByLTFcIj5cbiAgICAgICAgICAgIHsvKiBRdWljayBhY3Rpb25zIHRoZW8gbVx1MDBGNCBoXHUwMEVDbmggXHUwMTExXHUwMEUzIGNoXHUxRUQxdCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNhcCBvZiBbJ25vdGVzJywgJ3doaXRlYm9hcmQnLCAnc2hlZXQnXSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiAxLCBhY2Nlc3NNb2RlOiAnc3RhZmZfb25seScgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTIgS2hcdTAwRjNhIGNcdTFFRDluZyB0XHUwMEUxYyAoY2hcdTFFQzkgeGVtKVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2FwIG9mIFsnbm90ZXMnLCAnd2hpdGVib2FyZCcsICdzaGVldCddKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6ICdldmVyeW9uZScgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgaG92ZXI6YmctZW1lcmFsZC01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTMgTVx1MUVERiBjXHUxRUQ5bmcgdFx1MDBFMWMgY2hvIG1cdTFFQ0RpIG5nXHUwMUIwXHUxRUREaVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogUG9saWN5IG1hdHJpeCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTNcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBtYi0yXCI+Q2hcdTAwRURuaCBzXHUwMEUxY2ggY1x1MDBGNG5nIGNcdTFFRTU8L3A+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgICB7W1xuICAgICAgICAgICAgICAgICAgWyd2aWRlb19jb250cm9sJywgJ1x1MDExMGlcdTFFQzF1IGtoaVx1MUVDM24gcGhcdTAwRTF0IChwbGF5L3BhdXNlL3R1YSknXSxcbiAgICAgICAgICAgICAgICAgIFsndmlkZW9fY2hhbmdlJywgJ1x1MDExMFx1MUVENWkgdmlkZW8gXHUwMTExYW5nIHBoXHUwMEUxdCddLFxuICAgICAgICAgICAgICAgICAgWydxdWV1ZScsICdIXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB2aWRlbyddLFxuICAgICAgICAgICAgICAgICAgWydjaGF0JywgJ0NoYXQgcGhcdTAwRjJuZyddLFxuICAgICAgICAgICAgICAgICAgWydub3RlcycsICdHaGkgY2hcdTAwRkEgY2h1bmcnXSxcbiAgICAgICAgICAgICAgICAgIFsnd2hpdGVib2FyZCcsICdCXHUxRUEzbmcgdlx1MUVCRCddLFxuICAgICAgICAgICAgICAgICAgWydzaGVldCcsICdCXHUxRUEzbmcgdFx1MDBFRG5oJ10sXG4gICAgICAgICAgICAgICAgICBbJ3ZvaWNlJywgJ1ZvaWNlIDEtMSddLFxuICAgICAgICAgICAgICAgICAgWydpbnZpdGUnLCAnTVx1MUVERGkgbmdcdTAxQjBcdTFFRERpIHZcdTAwRTBvIHBoXHUwMEYybmcnXSxcbiAgICAgICAgICAgICAgICBdLm1hcCgoW2NhcCwgbmhhbl0pID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHBvbCA9IHBvbGljaWVzPy5bY2FwXSB8fCB7IGVuYWJsZWQ6IDEsIGFjY2Vzc19tb2RlOiAnc3RhZmZfb25seScgfTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtjYXB9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmbGV4LTEgdGV4dC1zbGF0ZS0zMDAgdHJ1bmNhdGVcIj57bmhhbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiBwb2wuZW5hYmxlZCA/IDAgOiAxLCBhY2Nlc3NNb2RlOiBwb2wuYWNjZXNzX21vZGUgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cG9sLmVuYWJsZWQgPyAnXHUwMTEwYW5nIGJcdTFFQUR0IFx1MjAxNCBiXHUxRUE1bSBcdTAxMTFcdTFFQzMgdFx1MUVBRnQnIDogJ1x1MDExMGFuZyB0XHUxRUFGdCBcdTIwMTQgYlx1MUVBNW0gXHUwMTExXHUxRUMzIGJcdTFFQUR0J31cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctOCBoLTQuNSBweC0wLjUgcm91bmRlZC1mdWxsIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciAke3BvbC5lbmFibGVkID8gJ2JnLWVtZXJhbGQtNTAwLzMwIGJvcmRlci1lbWVyYWxkLTUwMC80MCBqdXN0aWZ5LWVuZCcgOiAnYmctd2hpdGUvNSBib3JkZXItd2hpdGUvMTUganVzdGlmeS1zdGFydCd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTMgaC0zIHJvdW5kZWQtZnVsbCAke3BvbC5lbmFibGVkID8gJ2JnLWVtZXJhbGQtNDAwJyA6ICdiZy1zbGF0ZS01MDAnfWB9Pjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17cG9sLmFjY2Vzc19tb2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFwb2wuZW5hYmxlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0xLjUgcHktMSB0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTIwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwic3RhZmZfb25seVwiPlF1XHUxRUEzbiB0clx1MUVDQjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInNlbGVjdGVkX21lbWJlcnNcIj5NXHUxRUQ5dCBzXHUxRUQxIG5nXHUwMUIwXHUxRUREaTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImV2ZXJ5b25lXCI+TVx1MUVDRGkgbmdcdTAxQjBcdTFFRERpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgb3BhY2l0eS02MFwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmxleC0xIHRleHQtc2xhdGUtNDAwXCI+S2lcdTFFQzNtIGR1eVx1MUVDN3QgKGtpY2sveG9cdTAwRTEgdGluKTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gZm9udC1ib2xkIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHJvdW5kZWQgcHgtMS41IHB5LTAuNVwiPkxVXHUwMEQ0TiBRVVx1MUVBMk4gVFJcdTFFQ0E8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBRdVx1MUVBM24gbFx1MDBGRCB0aFx1MDBFMG5oIHZpXHUwMEVBbiAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTNcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBtYi0yXCI+VGhcdTAwRTBuaCB2aVx1MDBFQW4gJiBxdXlcdTFFQzFuIHJpXHUwMEVBbmc8L3A+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgICB7KHRoYW5oVmllbiB8fCBbXSkubWFwKHR2ID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhSG9zdCA9IEJvb2xlYW4odHYubGFDaHVQaG9uZyk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUdWID0gdHYudmFpVHJvID09PSAnZ2lhb192aWVuJztcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhQ29Ib3N0ID0gdHYudmFpVHJvUGhvbmcgPT09ICdjb19ob3N0JztcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50Vm9pY2UgPSAoZ3JhbnRzIHx8IFtdKS5zb21lKGcgPT4gZy5raG9hID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZvaWNlJyAmJiBnLnRyYW5nVGhhaSA9PT0gJ2dyYW50ZWQnKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50VmlkZW8gPSAoZ3JhbnRzIHx8IFtdKS5zb21lKGcgPT4gZy5raG9hID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZpZGVvX2NvbnRyb2wnICYmIGcudHJhbmdUaGFpID09PSAnZ3JhbnRlZCcpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3R2Lmtob2EgfHwgdHYudGVufSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHRleHQteHMgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0yMDAgZm9udC1zZW1pYm9sZCB0cnVuY2F0ZSBtYXgtdy1bMTEwcHhdXCI+e3R2LnRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAge2xhSG9zdCAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtYW1iZXItNDAwIGZvbnQtYm9sZFwiPlx1MjYwNSBob3N0PC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7bGFHViAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtWyMwMEYyRkVdIGZvbnQtYm9sZFwiPkdWPC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7bGFDb0hvc3QgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXZpb2xldC0zMDAgZm9udC1ib2xkXCI+Y28taG9zdDwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAgeyFsYUhvc3QgJiYgIWxhR1YgJiYgdHYua2hvYSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtbC1hdXRvIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHsodmFpVHJvUGhvbmcgPT09ICdob3N0JyB8fCBhdXRoLnVzZXI/LmlzVGVhY2hlcikgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdzZXRfY29faG9zdCcsIHsga2hvYVRWOiB0di5raG9hLCBvbjogIWxhQ29Ib3N0IH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2xhQ29Ib3N0ID8gJ1RodSBxdXlcdTFFQzFuIGNvLWhvc3QnIDogJ0NcdTFFQTVwIGNvLWhvc3QnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2xhQ29Ib3N0ID8gJ2JnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlci12aW9sZXQtNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246ICFncmFudFZvaWNlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gdm9pY2VcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgJHtncmFudFZvaWNlID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHR2Lmtob2EsIGNhcGFiaWxpdHk6ICd2aWRlb19jb250cm9sJywgb246ICFncmFudFZpZGVvIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiB2aWRlb1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2dyYW50VmlkZW8gPyAnYmctY3lhbi01MDAvMjAgdGV4dC1jeWFuLTMwMCBib3JkZXItY3lhbi01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHsgaWYgKGNvbmZpcm0oYEtpY2sgJHt0di50ZW59IGtoXHUxRUNGaSBwaFx1MDBGMm5nP2ApKSB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2tpY2snLCB7IGtob2FUVjogdHYua2hvYSB9KTsgaWYgKGQgJiYgIWQub2spIGFsZXJ0KGQubG9pIHx8ICdLaFx1MDBGNG5nIGtpY2sgXHUwMTExXHUwMUIwXHUxRUUzYy4nKTsgfSB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiS2ljayBraFx1MUVDRmkgcGhcdTAwRjJuZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciBiZy1yb3NlLTUwMC8xMCB0ZXh0LXJvc2UtMzAwIGJvcmRlci1yb3NlLTUwMC8yNSBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgIHsodGhhbmhWaWVuIHx8IFtdKS5sZW5ndGggPT09IDAgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDBcIj5DaFx1MDFCMGEgY1x1MDBGMyB0aFx1MDBFMG5oIHZpXHUwMEVBbi48L3A+fVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogXHUwMTEwXHUxRUQ1aS9iXHUxRUNGIG1cdTFFQUR0IGtoXHUxRUE5dSBcdTIwMTQgY2hcdTFFQzkgaG9zdC9HViAqL31cbiAgICAgICAgICAgIHsodmFpVHJvUGhvbmcgPT09ICdob3N0JyB8fCBhdXRoLnVzZXI/LmlzVGVhY2hlcikgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0zIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJNXHUxRUFEdCBraFx1MUVBOXUgbVx1MUVEQmkgKFx1MDExMVx1MUVDMyB0clx1MUVEMW5nID0gYlx1MUVDRiBtXHUxRUFEdCBraFx1MUVBOXUpXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtcGhvbmctbWF0LWtoYXUtbW9pXCJcbiAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17MTAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnB1dC1waG9uZy1tYXQta2hhdS1tb2knKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWsgPSBlbD8udmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBtay50cmltKClcbiAgICAgICAgICAgICAgICAgICAgICA/IGF3YWl0IGhhbmhEb25nUGhvbmc/LignZG9pX21hdF9raGF1JywgeyBtYXRLaGF1TW9pOiBtay50cmltKCkgfSlcbiAgICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IGhhbmhEb25nUGhvbmc/LignYm9fbWF0X2toYXUnLCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkICYmICFkLm9rKSBhbGVydChkLmxvaSB8fCAnS2hcdTAwRjRuZyBcdTAxMTFcdTFFRDVpIFx1MDExMVx1MDFCMFx1MUVFM2MgbVx1MUVBRHQga2hcdTFFQTl1LicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWwpIGVsLnZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC1sZyBiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLWFtYmVyLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgXHUwMTEwXHUxRUQ1aSAvIEJcdTFFQ0ZcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDYW1wdXNXYXRjaFRvZ2V0aGVyKHtcbiAgcGhvbmcsXG4gIHBob25nTWluaEtob2E6IF9waG9uZ01pbmhLaG9hLFxuICBhdXRoLFxuICBkb25nUGhvbmdIaWVuVGFpOiBfZG9uZ1Bob25nSGllblRhaSxcbiAgc29OZ3VvaTogX3NvTmd1b2ksXG4gIG15Q2FwcyxcbiAgdmlkZW9UaW1lUmVmLFxuICBpc1Jvb21XaWRlLFxuICBoYW5oRG9uZ1Bob25nOiBfaGFuaERvbmdQaG9uZyxcbiAgaXNTdGFmZiA9IGZhbHNlLFxufSkge1xuICBjb25zdCBbd2F0Y2hTdGF0ZSwgc2V0V2F0Y2hTdGF0ZV0gPSB1c2VTdGF0ZSh7XG4gICAgcGxheWluZzogZmFsc2UsXG4gICAgcG9zaXRpb25TZWNvbmRzOiAwLFxuICAgIGJhc2VQb3NpdGlvblNlY29uZHM6IDAsXG4gICAgcGxheWJhY2tSYXRlOiAxLjAsXG4gICAgcmV2aXNpb246IDEsXG4gICAgdXBkYXRlZEF0OiAnJyxcbiAgICBzZXJ2ZXJOb3c6ICcnLFxuICAgIHVwZGF0ZWRCeTogJydcbiAgfSk7XG4gIGNvbnN0IFtjYW5Db250cm9sLCBzZXRDYW5Db250cm9sXSA9IHVzZVN0YXRlKEJvb2xlYW4oXG4gICAgYXV0aD8udXNlcj8uaXNUZWFjaGVyIHx8IHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nIHx8IG15Q2Fwcz8udmlkZW9fY29udHJvbCB8fCBteUNhcHM/LnZpZGVvX2NoYW5nZSB8fCBpc1N0YWZmXG4gICkpO1xuICBjb25zdCBbX3dhdGNoQ2Fwcywgc2V0V2F0Y2hDYXBzXSA9IHVzZVN0YXRlKHt9KTtcbiAgY29uc3QgZ2V0SW5pdGlhbFZpZGVvVXJsID0gKCkgPT4ge1xuICAgIGxldCBjID0ge307XG4gICAgdHJ5IHsgYyA9IHBob25nPy5jYXVIaW5oID8gSlNPTi5wYXJzZShwaG9uZy5jYXVIaW5oKSA6IHt9OyB9IGNhdGNoIHsgfVxuICAgIHJldHVybiBjLnZpZGVvVXJsIHx8IHBob25nPy52aWRlb1VybCB8fCAnJztcbiAgfTtcblxuICBjb25zdCBnZXRJbml0aWFsUHJvdmlkZXIgPSAodSkgPT4ge1xuICAgIGlmICghdSkgcmV0dXJuICdVTlNVUFBPUlRFRCc7XG4gICAgaWYgKGlkWW91dHViZSh1KSkgcmV0dXJuICdZT1VUVUJFJztcbiAgICBpZiAoaWRHb29nbGVEcml2ZSh1KSkgcmV0dXJuICdHT09HTEVfRFJJVkUnO1xuICAgIGlmIChsYVZpZGVvVHJ1Y1RpZXBGZSh1KSkgcmV0dXJuICdOQVRJVkVfSFRNTDUnO1xuICAgIHJldHVybiAnVU5TVVBQT1JURUQnO1xuICB9O1xuXG4gIGNvbnN0IGluaXRVcmwgPSBnZXRJbml0aWFsVmlkZW9VcmwoKTtcbiAgY29uc3QgW2FjdGl2ZVZpZGVvVXJsLCBzZXRBY3RpdmVWaWRlb1VybF0gPSB1c2VTdGF0ZShpbml0VXJsKTtcbiAgY29uc3QgW3Byb3ZpZGVyLCBzZXRQcm92aWRlcl0gPSB1c2VTdGF0ZSgoKSA9PiBnZXRJbml0aWFsUHJvdmlkZXIoaW5pdFVybCkpO1xuICBjb25zdCBbaGFzSW50ZXJhY3RlZCwgc2V0SGFzSW50ZXJhY3RlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2NhbFRpbWUsIHNldExvY2FsVGltZV0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW2R1cmF0aW9uLCBzZXREdXJhdGlvbl0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW2RhbmdHdWlMZW5oLCBzZXREYW5nR3VpTGVuaF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2ksIHNldExvaV0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENcdTFFQTRVIEhcdTAwQ0NOSCBWSURFTywgVFx1MDBDQ00gS0lcdTFFQkVNIFlPVVRVQkUgJiBIXHUwMEMwTkcgXHUwMTEwXHUxRUUySSBUXHUxRUEwSSBWXHUwMEQ5TkcgMSBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3QgW21lZGlhVGFiLCBzZXRNZWRpYVRhYl0gPSB1c2VTdGF0ZSgnc2VhcmNoJyk7IC8vICdzZWFyY2gnIHwgJ3F1ZXVlJ1xuICBjb25zdCBbdmlkZW9Nb2ksIHNldFZpZGVvTW9pXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2RhbmdEb2lWaWRlbywgc2V0RGFuZ0RvaVZpZGVvXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2xvaVZpZGVvLCBzZXRMb2lWaWRlb10gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFt0aG9uZ0Jhb1ZpZGVvLCBzZXRUaG9uZ0Jhb1ZpZGVvXSA9IHVzZVN0YXRlKCcnKTtcblxuICAvLyBZb3VUdWJlIFNlYXJjaCBTdGF0ZVxuICBjb25zdCBbeXRRdWVyeSwgc2V0WXRRdWVyeV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFt5dFJlc3VsdHMsIHNldFl0UmVzdWx0c10gPSB1c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFtzZWFyY2hpbmdZdCwgc2V0U2VhcmNoaW5nWXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2VhcmNoTG9pLCBzZXRTZWFyY2hMb2ldID0gdXNlU3RhdGUoJycpO1xuXG4gIC8vIFF1ZXVlIFN0YXRlXG4gIGNvbnN0IFtxdWV1ZUxpc3QsIHNldFF1ZXVlTGlzdF0gPSB1c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFtxdWV1ZUJ1c3ksIHNldFF1ZXVlQnVzeV0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtkYU1vUm9uZ1N0dWRpbywgc2V0RGFNb1JvbmdTdHVkaW9dID0gdXNlU3RhdGUodHJ1ZSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAocGhvbmc/LmNhbkNvbnRyb2wgfHwgcGhvbmc/LmxhQ2h1UGhvbmcgfHwgYXV0aD8udXNlcj8uaXNUZWFjaGVyIHx8IG15Q2Fwcz8udmlkZW9fY29udHJvbCB8fCBteUNhcHM/LnZpZGVvX2NoYW5nZSB8fCBpc1N0YWZmKSB7XG4gICAgICBzZXRDYW5Db250cm9sKHRydWUpO1xuICAgIH1cbiAgfSwgW3Bob25nPy5jYW5Db250cm9sLCBwaG9uZz8ubGFDaHVQaG9uZywgYXV0aD8udXNlcj8uaXNUZWFjaGVyLCBteUNhcHMsIGlzU3RhZmZdKTtcblxuICAvLyBUXHUxRUEzaSBkYW5oIHNcdTAwRTFjaCBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB0XHUxRUVCIHNlcnZlclxuICBjb25zdCB0YWlRdWV1ZSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctcXVldWU/cGhvbmdJZD0ke3Bob25nLmlkfSZhY3Rpb249bGlzdGApO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vaykgc2V0UXVldWVMaXN0KGQucXVldWUgfHwgW10pO1xuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHRhaVF1ZXVlKCk7XG4gICAgY29uc3QgdGltZXIgPSBzZXRJbnRlcnZhbChraGlIaWVuVGhpKHRhaVF1ZXVlKSwgNDAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICB9LCBbcGhvbmcuaWRdKTtcblxuICAvLyBcdTAxMTBcdTFFRDVpIHZpZGVvIFx1MDExMWFuZyBwaFx1MDBFMXRcbiAgY29uc3QgZG9pVmlkZW8gPSBhc3luYyAodXJsLCB0aXRsZSkgPT4ge1xuICAgIGNvbnN0IHUgPSBTdHJpbmcodXJsIHx8IHZpZGVvTW9pIHx8IHl0UXVlcnkgfHwgJycpLnRyaW0oKTtcbiAgICBpZiAoIXUgfHwgZGFuZ0RvaVZpZGVvKSByZXR1cm47XG4gICAgc2V0RGFuZ0RvaVZpZGVvKHRydWUpO1xuICAgIHNldExvaVZpZGVvKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctd2F0Y2gnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAnc2V0X3ZpZGVvJywgdmlkZW9Vcmw6IHUsIGF1dG9QbGF5OiB0cnVlIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSB7XG4gICAgICAgIHNldExvaVZpZGVvKGQubG9pIHx8ICdLaFx1MDBGNG5nIFx1MDExMVx1MUVENWkgXHUwMTExXHUwMUIwXHUxRUUzYyB2aWRlby4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKHUpO1xuICAgICAgICBzZXRQcm92aWRlcihnZXRJbml0aWFsUHJvdmlkZXIodSkpO1xuICAgICAgICBzZXRWaWRlb01vaSgnJyk7XG4gICAgICAgIGlmIChkLnN0YXRlKSB7XG4gICAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgICBzZXRMb2NhbFRpbWUoMCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmV3WXRJZCA9IGlkWW91dHViZSh1KTtcbiAgICAgICAgaWYgKG5ld1l0SWQgJiYgeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFJlYWR5UmVmLmN1cnJlbnQgJiYgdHlwZW9mIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQoeyB2aWRlb0lkOiBuZXdZdElkLCBzdGFydFNlY29uZHM6IDAgfSk7XG4gICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpO1xuICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBzZXRUaG9uZ0Jhb1ZpZGVvKGBcdTAxMTBhbmcgcGhcdTAwRTF0OiAke3RpdGxlIHx8IHV9YCk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VGhvbmdCYW9WaWRlbygnJyksIDQwMDApO1xuICAgICAgICB0YWlRdWV1ZSgpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0TG9pVmlkZW8oJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXREYW5nRG9pVmlkZW8oZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyBUXHUwMEVDbSBraVx1MUVCRm0gWW91VHViZVxuICBjb25zdCB0aW1LaWVtWW91VHViZSA9IGFzeW5jIChlLCB0dUtob2EpID0+IHtcbiAgICBlPy5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IHEgPSBTdHJpbmcodHVLaG9hIHx8IHl0UXVlcnkgfHwgJycpLnRyaW0oKTtcbiAgICBpZiAoIXEgfHwgc2VhcmNoaW5nWXQpIHJldHVybjtcbiAgICBpZiAodHVLaG9hKSBzZXRZdFF1ZXJ5KHR1S2hvYSk7XG5cbiAgICAvLyBOXHUxRUJGdSBuZ1x1MDFCMFx1MUVERGkgZFx1MDBGOW5nIGRcdTAwRTFuIGxpXHUwMEVBbiBrXHUxRUJGdCB2aWRlbyBZb3VUdWJlXG4gICAgY29uc3QgaWRZdCA9IGlkWW91dHViZShxKTtcbiAgICBpZiAoaWRZdCkge1xuICAgICAgc2V0WXRSZXN1bHRzKFt7XG4gICAgICAgIHZpZGVvSWQ6IGlkWXQsXG4gICAgICAgIHRpdGxlOiAnVmlkZW8gWW91VHViZSAodFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQgXHUwMTExXHUwMEUzIGRcdTAwRTFuKScsXG4gICAgICAgIGNoYW5uZWxUaXRsZTogJ1lvdVR1YmUnLFxuICAgICAgICB0aHVtYm5haWw6IGBodHRwczovL2kueXRpbWcuY29tL3ZpLyR7aWRZdH0vaHFkZWZhdWx0LmpwZ2AsXG4gICAgICAgIHB1Ymxpc2hlZEF0OiAnVHJcdTFFRjFjIHRpXHUxRUJGcCdcbiAgICAgIH1dKTtcbiAgICAgIHNldFNlYXJjaExvaSgnJyk7XG4gICAgICBzZXRNZWRpYVRhYignc2VhcmNoJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0U2VhcmNoaW5nWXQodHJ1ZSk7XG4gICAgc2V0U2VhcmNoTG9pKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkveW91dHViZS1zZWFyY2g/cT0ke2VuY29kZVVSSUNvbXBvbmVudChxKX1gKTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgQXJyYXkuaXNBcnJheShkLml0ZW1zKSkge1xuICAgICAgICBpZiAoZC5pdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBzZXRTZWFyY2hMb2koJ0toXHUwMEY0bmcgdFx1MDBFQ20gdGhcdTFFQTV5IHZpZGVvIG5cdTAwRTBvIHBoXHUwMEY5IGhcdTFFRTNwIHZcdTFFREJpIHRcdTFFRUIga2hcdTAwRjNhIG5cdTAwRTB5LicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldFl0UmVzdWx0cyhkLml0ZW1zKTtcbiAgICAgICAgICBzZXRNZWRpYVRhYignc2VhcmNoJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFNlYXJjaExvaShkLmxvaSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyB0XHUwMEVDbSBraVx1MUVCRm0gdmlkZW8gbFx1MDBGQWMgblx1MDBFMHkuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRTZWFyY2hMb2koJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIGtoaSB0XHUwMEVDbSBraVx1MUVCRm0gWW91VHViZS4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0U2VhcmNoaW5nWXQoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyBUaGFvIHRcdTAwRTFjIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIChlbnF1ZXVlLCBhZGRfbmV4dCwgcGxheV9ub3csIHNraXAsIHJlbW92ZSlcbiAgY29uc3QgaGFuaERvbmdRdWV1ZSA9IGFzeW5jIChhY3Rpb24sIGV4dHJhID0ge30pID0+IHtcbiAgICBpZiAocXVldWVCdXN5KSByZXR1cm47XG4gICAgc2V0UXVldWVCdXN5KHRydWUpO1xuICAgIHNldExvaVZpZGVvKCcnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctcXVldWUnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uLCAuLi5leHRyYSB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghZC5vaykge1xuICAgICAgICBzZXRMb2lWaWRlbyhkLmxvaSB8fCAnVGhhbyB0XHUwMEUxYyBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB0aFx1MUVBNXQgYlx1MUVBMWkuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoYWN0aW9uID09PSAnZW5xdWV1ZScpIHtcbiAgICAgICAgICBzZXRUaG9uZ0Jhb1ZpZGVvKGBcdTAxMTBcdTAwRTMgdGhcdTAwRUFtIHZcdTAwRTBvIGN1XHUxRUQxaSBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaTogJHtleHRyYS50aXRsZSB8fCAnVmlkZW8nfWApO1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VGhvbmdCYW9WaWRlbygnJyksIDM1MDApO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2FkZF9uZXh0Jykge1xuICAgICAgICAgIHNldFRob25nQmFvVmlkZW8oYFx1MDExMFx1MDBFMyB0aFx1MDBFQW0gcGhcdTAwRTF0IGtcdTFFQkYgdGlcdTFFQkZwOiAke2V4dHJhLnRpdGxlIHx8ICdWaWRlbyd9YCk7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUaG9uZ0Jhb1ZpZGVvKCcnKSwgMzUwMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAncGxheV9ub3cnIHx8IGFjdGlvbiA9PT0gJ3NraXAnKSB7XG4gICAgICAgICAgaWYgKGQudmlkZW9VcmwpIHtcbiAgICAgICAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKGQudmlkZW9VcmwpO1xuICAgICAgICAgICAgc2V0UHJvdmlkZXIoZ2V0SW5pdGlhbFByb3ZpZGVyKGQudmlkZW9VcmwpKTtcbiAgICAgICAgICAgIGlmIChkLnN0YXRlKSB7XG4gICAgICAgICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgICAgICAgIHNldExvY2FsVGltZSgwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG5ld1l0SWQgPSBpZFlvdXR1YmUoZC52aWRlb1VybCk7XG4gICAgICAgICAgICBpZiAobmV3WXRJZCAmJiB5dFBsYXllclJlZi5jdXJyZW50ICYmIHl0UmVhZHlSZWYuY3VycmVudCAmJiB0eXBlb2YgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkKHsgdmlkZW9JZDogbmV3WXRJZCwgc3RhcnRTZWNvbmRzOiAwIH0pO1xuICAgICAgICAgICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7XG4gICAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbygnXHUwMTEwYW5nIGNodXlcdTFFQzNuIHZpZGVvLi4uJyk7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUaG9uZ0Jhb1ZpZGVvKCcnKSwgMzAwMCk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGFpUXVldWUoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaVZpZGVvKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0UXVldWVCdXN5KGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdmlkZW9SZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IHl0UGxheWVyUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCB5dENvbnRhaW5lcklkID0gYHl0LXBsYXllci0ke3Bob25nLmlkfWA7XG4gIGNvbnN0IGlzU2Vla2luZ1JlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGhhc0ludGVyYWN0ZWRSZWYgPSB1c2VSZWYoZmFsc2UpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbGV0IGMgPSB7fTtcbiAgICB0cnkgeyBjID0gcGhvbmc/LmNhdUhpbmggPyBKU09OLnBhcnNlKHBob25nLmNhdUhpbmgpIDoge307IH0gY2F0Y2ggeyB9XG4gICAgY29uc3QgbmV4dFVybCA9IGMudmlkZW9VcmwgfHwgcGhvbmc/LnZpZGVvVXJsIHx8ICcnO1xuICAgIGlmIChuZXh0VXJsICYmIG5leHRVcmwgIT09IGFjdGl2ZVZpZGVvVXJsKSB7XG4gICAgICBzZXRBY3RpdmVWaWRlb1VybChuZXh0VXJsKTtcbiAgICAgIHNldFByb3ZpZGVyKGdldEluaXRpYWxQcm92aWRlcihuZXh0VXJsKSk7XG4gICAgfVxuICB9LCBbcGhvbmc/LmNhdUhpbmgsIHBob25nPy52aWRlb1VybF0pO1xuXG4gIGNvbnN0IHZpZGVvVXJsID0gYWN0aXZlVmlkZW9Vcmw7XG4gIGNvbnN0IHl0SWQgPSB2aWRlb1VybCA/IGlkWW91dHViZSh2aWRlb1VybCkgOiBudWxsO1xuICBjb25zdCBkcnZJZCA9IHZpZGVvVXJsID8gaWRHb29nbGVEcml2ZSh2aWRlb1VybCkgOiBudWxsO1xuICBjb25zdCB0cnVjVGllcFVybCA9IHZpZGVvVXJsICYmICF5dElkICYmICFkcnZJZCAmJiBsYVZpZGVvVHJ1Y1RpZXBGZSh2aWRlb1VybCkgPyB1cmxNZWRpYUZlKHZpZGVvVXJsKSA6ICcnO1xuXG4gIGNvbnN0IFt5dEFwaUZhaWxlZCwgc2V0WXRBcGlGYWlsZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbX3l0UGxheWVyUmVhZHksIHNldFl0UGxheWVyUmVhZHldID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCB5dFJlYWR5UmVmID0gdXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgY3VycmVudFl0SWRSZWYgPSB1c2VSZWYobnVsbCk7XG5cbiAgLy8gS2hcdTFFREZpIHRcdTFFQTFvIHZcdTAwRTAgcXVcdTFFQTNuIGxcdTAwRkQgWW91VHViZSBJRnJhbWUgUGxheWVyIChoXHUxRUQ3IHRyXHUxRUUzIHRcdTAwRTFpIHNcdTFFRUQgZFx1MUVFNW5nIGxvYWRWaWRlb0J5SWQgJiBmYWxsYmFjayB0clx1MUVGMWMgdGlcdTFFQkZwKVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICgheXRJZCkgcmV0dXJuO1xuICAgIGxldCBkZXN0cm95ZWQgPSBmYWxzZTtcbiAgICBsZXQgcmV0cnlUaW1lciA9IG51bGw7XG4gICAgbGV0IGZhbGxiYWNrVGltZXIgPSBudWxsO1xuICAgIGxldCBhdHRlbXB0cyA9IDA7XG5cbiAgICAvLyBOXHUxRUJGdSBwbGF5ZXIgXHUwMTExXHUwMEUzIHRcdTFFRDNuIHRcdTFFQTFpIHZcdTAwRTAgXHUwMTExXHUwMEUzIHNcdTFFQjVuIHNcdTAwRTBuZzogY2h1eVx1MUVDM24gdmlkZW8gdHJcdTFFRjFjIHRpXHUxRUJGcCBxdWEgbG9hZFZpZGVvQnlJZCAodHJcdTAwRTFuaCBkZXN0cm95IERPTSBnXHUwMEUyeSBsXHUxRUQ3aSBtXHUxRUE1dCBraHVuZylcbiAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFJlYWR5UmVmLmN1cnJlbnQgJiYgdHlwZW9mIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKGN1cnJlbnRZdElkUmVmLmN1cnJlbnQgIT09IHl0SWQpIHtcbiAgICAgICAgICBjdXJyZW50WXRJZFJlZi5jdXJyZW50ID0geXRJZDtcbiAgICAgICAgICBjb25zdCBzdGFydFNlYyA9IE51bWJlcih3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQoe1xuICAgICAgICAgICAgdmlkZW9JZDogeXRJZCxcbiAgICAgICAgICAgIHN0YXJ0U2Vjb25kczogc3RhcnRTZWNcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignTFx1MUVEN2kga2hpIGxvYWRWaWRlb0J5SWQsIGtoXHUxRURGaSB0XHUxRUExbyBsXHUxRUExaSBwbGF5ZXI6JywgZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY3VycmVudFl0SWRSZWYuY3VycmVudCA9IHl0SWQ7XG5cbiAgICAvLyBGYWxsYmFjazogblx1MUVCRnUgc2F1IDMuMnMgbVx1MDBFMCBZb3VUdWJlIEFQSSBjaFx1MDFCMGEgc1x1MUVCNW4gc1x1MDBFMG5nIGhvXHUxRUI3YyBiXHUxRUNCIGNoXHUxRUI3biBiXHUxRURGaSBhZGJsb2NrL21cdTFFQTFuZywga1x1MDBFRGNoIGhvXHUxRUExdCBpZnJhbWUgdHJcdTFFRjFjIHRpXHUxRUJGcFxuICAgIGZhbGxiYWNrVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICghZGVzdHJveWVkICYmICF5dFJlYWR5UmVmLmN1cnJlbnQpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdZb3VUdWJlIElGcmFtZSBBUEkga2hcdTAwRjRuZyBwaFx1MUVBM24gaFx1MUVEM2kgc2F1IDMuMnMgLT4ga1x1MDBFRGNoIGhvXHUxRUExdCBmYWxsYmFjayBpZnJhbWUgdHJcdTFFRjFjIHRpXHUxRUJGcC4nKTtcbiAgICAgICAgc2V0WXRBcGlGYWlsZWQodHJ1ZSk7XG4gICAgICB9XG4gICAgfSwgMzIwMCk7XG5cbiAgICBjb25zdCBraG9pVGFvUGxheWVyID0gKCkgPT4ge1xuICAgICAgaWYgKGRlc3Ryb3llZCkgcmV0dXJuO1xuICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgIGlmICghZWwpIHtcbiAgICAgICAgaWYgKGF0dGVtcHRzKysgPCAzMCkge1xuICAgICAgICAgIHJldHJ5VGltZXIgPSBzZXRUaW1lb3V0KGtob2lUYW9QbGF5ZXIsIDgwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRZdEFwaUZhaWxlZCh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIERlc3Ryb3kgcGxheWVyIGNcdTAxNjkgblx1MUVCRnUgY1x1MDBGMyB0clx1MDFCMFx1MUVEQmMga2hpIHRcdTFFQTFvIG1cdTFFREJpIHRyXHUwMEVBbiBjb250YWluZXJcbiAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50ICYmIHl0UGxheWVyUmVmLmN1cnJlbnQuZGVzdHJveSkge1xuICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LmRlc3Ryb3koKTsgfSBjYXRjaCB7fVxuICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgeXRSZWFkeVJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIHNldFl0UGxheWVyUmVhZHkoZmFsc2UpO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBpZiAoIXdpbmRvdy5ZVCB8fCAhd2luZG93LllULlBsYXllcikge1xuICAgICAgICAgIGlmIChhdHRlbXB0cysrIDwgMzApIHtcbiAgICAgICAgICAgIHJldHJ5VGltZXIgPSBzZXRUaW1lb3V0KGtob2lUYW9QbGF5ZXIsIDEwMCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldFl0QXBpRmFpbGVkKHRydWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBvcmlnaW5VcmwgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gOiAnJztcblxuICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50ID0gbmV3IHdpbmRvdy5ZVC5QbGF5ZXIoeXRDb250YWluZXJJZCwge1xuICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICAgICAgdmlkZW9JZDogeXRJZCxcbiAgICAgICAgICBwbGF5ZXJWYXJzOiB7XG4gICAgICAgICAgICBhdXRvcGxheTogd2F0Y2hTdGF0ZS5wbGF5aW5nID8gMSA6IDAsXG4gICAgICAgICAgICBjb250cm9sczogY2FuQ29udHJvbCA/IDEgOiAwLFxuICAgICAgICAgICAgZGlzYWJsZWtiOiBjYW5Db250cm9sID8gMCA6IDEsXG4gICAgICAgICAgICBlbmFibGVqc2FwaTogMSxcbiAgICAgICAgICAgIG9yaWdpbjogb3JpZ2luVXJsLFxuICAgICAgICAgICAgd2lkZ2V0X3JlZmVycmVyOiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5sb2NhdGlvbi5ocmVmIDogJycsXG4gICAgICAgICAgICBtb2Rlc3RicmFuZGluZzogMSxcbiAgICAgICAgICAgIHJlbDogMCxcbiAgICAgICAgICAgIHBsYXlzaW5saW5lOiAxLFxuICAgICAgICAgICAgZnM6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgb25SZWFkeTogKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChkZXN0cm95ZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgaWYgKGZhbGxiYWNrVGltZXIpIGNsZWFyVGltZW91dChmYWxsYmFja1RpbWVyKTtcbiAgICAgICAgICAgICAgeXRSZWFkeVJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgc2V0WXRQbGF5ZXJSZWFkeSh0cnVlKTtcbiAgICAgICAgICAgICAgc2V0WXRBcGlGYWlsZWQoZmFsc2UpO1xuXG4gICAgICAgICAgICAgIGlmIChldmVudC50YXJnZXQuZ2V0RHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gZXZlbnQudGFyZ2V0LmdldER1cmF0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKGQgPiAwKSBzZXREdXJhdGlvbihkKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAod2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMgPiAwICYmIGV2ZW50LnRhcmdldC5zZWVrVG8pIHtcbiAgICAgICAgICAgICAgICB0cnkgeyBldmVudC50YXJnZXQuc2Vla1RvKHdhdGNoU3RhdGUucG9zaXRpb25TZWNvbmRzLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcgJiYgZXZlbnQudGFyZ2V0LnBsYXlWaWRlbykge1xuICAgICAgICAgICAgICAgIHRyeSB7IGV2ZW50LnRhcmdldC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25TdGF0ZUNoYW5nZTogKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmICFkYW5nR3VpTGVuaCAmJiAhaXNTZWVraW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuZGF0YSA9PT0gMSAmJiAhd2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oKCdwbGF5JywgZXZlbnQudGFyZ2V0LmdldEN1cnJlbnRUaW1lKCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuZGF0YSA9PT0gMiAmJiB3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3BhdXNlJywgZXZlbnQudGFyZ2V0LmdldEN1cnJlbnRUaW1lKCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuZGF0YSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgLy8gVmlkZW8gWW91VHViZSBrXHUxRUJGdCB0aFx1MDBGQWMgLT4gdFx1MUVGMSBcdTAxMTFcdTFFRDluZyBjaHV5XHUxRUMzbiBzYW5nIHZpZGVvIHRpXHUxRUJGcCB0aGVvIHRyb25nIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXG4gICAgICAgICAgICAgICAgICBoYW5oRG9uZ1F1ZXVlKCdza2lwJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25FcnJvcjogKGVycikgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1lvdVR1YmUgUGxheWVyIGJcdTAwRTFvIGxcdTFFRDdpIG1cdTAwRTM6JywgZXJyPy5kYXRhKTtcbiAgICAgICAgICAgICAgLy8gTlx1MUVCRnUgZ1x1MUVCN3AgbFx1MUVEN2kgY1x1MUVBNW0gbmhcdTAwRkFuZyAoMTAxLCAxNTApIGhvXHUxRUI3YyBsXHUxRUQ3aSBwbGF5ZXIsIGtcdTAwRURjaCBob1x1MUVBMXQgZmFsbGJhY2sgdHJcdTFFRjFjIHRpXHUxRUJGcFxuICAgICAgICAgICAgICBzZXRZdEFwaUZhaWxlZCh0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignTFx1MUVEN2kga2hcdTFFREZpIHRcdTFFQTFvIFlUIFBsYXllcjonLCBlcnIpO1xuICAgICAgICBzZXRZdEFwaUZhaWxlZCh0cnVlKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbmFwWW91VHViZUlmcmFtZUFwaSgoKSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KGtob2lUYW9QbGF5ZXIsIDYwKTtcbiAgICB9KTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBkZXN0cm95ZWQgPSB0cnVlO1xuICAgICAgaWYgKHJldHJ5VGltZXIpIGNsZWFyVGltZW91dChyZXRyeVRpbWVyKTtcbiAgICAgIGlmIChmYWxsYmFja1RpbWVyKSBjbGVhclRpbWVvdXQoZmFsbGJhY2tUaW1lcik7XG4gICAgfTtcbiAgfSwgW3l0SWQsIHBob25nLmlkLCBjYW5Db250cm9sXSk7XG5cbiAgLy8gXHUwMEMxcCBkXHUxRUU1bmcgdHJcdTFFQTFuZyB0aFx1MDBFMWkgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSB0XHUxRUVCIHNlcnZlclxuICBjb25zdCBhcER1bmdEb25nQm8gPSAoc3QsIGN0cmwsIHByb3YpID0+IHtcbiAgICBpZiAoIXN0KSByZXR1cm47XG4gICAgY29uc3Qgbm93TXMgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IF9zZXJ2ZXJUaW1lTXMgPSBzdC5zZXJ2ZXJOb3cgPyBuZXcgRGF0ZShzdC5zZXJ2ZXJOb3cpLmdldFRpbWUoKSA6IG5vd01zO1xuICAgIGNvbnN0IHVwZGF0ZVRpbWVNcyA9IHN0LnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyhzdC51cGRhdGVkQXQpLnJlcGxhY2UoJyAnLCAnVCcpICsgKFN0cmluZyhzdC51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKSA6IG5vd01zO1xuICAgIGNvbnN0IGVsYXBzZWRTZWMgPSBNYXRoLm1heCgwLCAobm93TXMgLSB1cGRhdGVUaW1lTXMpIC8gMTAwMCk7XG5cbiAgICBsZXQgdGFyZ2V0UG9zID0gTnVtYmVyKHN0LnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICBpZiAoc3QucGxheWluZykge1xuICAgICAgdGFyZ2V0UG9zID0gTnVtYmVyKHN0LmJhc2VQb3NpdGlvblNlY29uZHMgfHwgMCkgKyAoZWxhcHNlZFNlYyAqIChzdC5wbGF5YmFja1JhdGUgfHwgMS4wKSk7XG4gICAgfVxuICAgIHNldExvY2FsVGltZShNYXRoLm1heCgwLCBNYXRoLmZsb29yKHRhcmdldFBvcykpKTtcblxuICAgIGlmIChjdHJsICYmIGlzU2Vla2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG5cbiAgICBpZiAocHJvdiA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgY29uc3QgdiA9IHZpZGVvUmVmLmN1cnJlbnQ7XG4gICAgICBpZiAoc3QucGxheWluZykge1xuICAgICAgICBjb25zdCBkcmlmdCA9IE1hdGguYWJzKHYuY3VycmVudFRpbWUgLSB0YXJnZXRQb3MpO1xuICAgICAgICBpZiAoZHJpZnQgPiAxLjUpIHtcbiAgICAgICAgICB2LmN1cnJlbnRUaW1lID0gdGFyZ2V0UG9zO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2LnBhdXNlZCAmJiAoaGFzSW50ZXJhY3RlZCB8fCBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQgfHwgY3RybCkpIHtcbiAgICAgICAgICB2LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHYucGxheWJhY2tSYXRlICE9PSAoc3QucGxheWJhY2tSYXRlIHx8IDEuMCkpIHtcbiAgICAgICAgICB2LnBsYXliYWNrUmF0ZSA9IHN0LnBsYXliYWNrUmF0ZSB8fCAxLjA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghdi5wYXVzZWQpIHYucGF1c2UoKTtcbiAgICAgICAgY29uc3QgZHJpZnQgPSBNYXRoLmFicyh2LmN1cnJlbnRUaW1lIC0gc3QucG9zaXRpb25TZWNvbmRzKTtcbiAgICAgICAgaWYgKGRyaWZ0ID4gMC44KSB7XG4gICAgICAgICAgdi5jdXJyZW50VGltZSA9IHN0LnBvc2l0aW9uU2Vjb25kcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvdiA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFBsYXllclJlZi5jdXJyZW50LmdldFBsYXllclN0YXRlKSB7XG4gICAgICAgIGNvbnN0IHAgPSB5dFBsYXllclJlZi5jdXJyZW50O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGN1ciA9IHAuZ2V0Q3VycmVudFRpbWUoKSB8fCAwO1xuICAgICAgICAgIGNvbnN0IGRyaWZ0ID0gTWF0aC5hYnMoY3VyIC0gdGFyZ2V0UG9zKTtcbiAgICAgICAgICBpZiAoc3QucGxheWluZykge1xuICAgICAgICAgICAgaWYgKGRyaWZ0ID4gMS41KSB7XG4gICAgICAgICAgICAgIHAuc2Vla1RvKHRhcmdldFBvcywgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBwcyA9IHAuZ2V0UGxheWVyU3RhdGUoKTtcbiAgICAgICAgICAgIGlmIChwcyAhPT0gMSAmJiBwcyAhPT0gMyAmJiAoaGFzSW50ZXJhY3RlZCB8fCBjdHJsKSkge1xuICAgICAgICAgICAgICBwLnBsYXlWaWRlbygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBwcyA9IHAuZ2V0UGxheWVyU3RhdGUoKTtcbiAgICAgICAgICAgIGlmIChwcyA9PT0gMSkgcC5wYXVzZVZpZGVvKCk7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VyIC0gc3QucG9zaXRpb25TZWNvbmRzKSA+IDAuOCkge1xuICAgICAgICAgICAgICBwLnNlZWtUbyhzdC5wb3NpdGlvblNlY29uZHMsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCB7IH1cbiAgICAgIH0gZWxzZSBpZiAoeXRBcGlGYWlsZWQpIHtcbiAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgaWZyYW1lI3l0LWZhbGxiYWNrLSR7cGhvbmcuaWR9YCk7XG4gICAgICAgIGlmIChpZnIgJiYgaWZyLmNvbnRlbnRXaW5kb3cpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHN0LnBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgaWZyLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UoJ3tcImV2ZW50XCI6XCJjb21tYW5kXCIsXCJmdW5jXCI6XCJwbGF5VmlkZW9cIixcImFyZ3NcIjpcIlwifScsICcqJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZnIuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSgne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBhdXNlVmlkZW9cIixcImFyZ3NcIjpcIlwifScsICcqJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFBvbGwgdHJcdTFFQTFuZyB0aFx1MDBFMWkgbVx1MDBFMXkgY2hcdTFFRTcgbVx1MUVEN2kgMi41c1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoV2F0Y2ggPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy13YXRjaD9waG9uZ0lkPSR7cGhvbmcuaWR9YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoIWFjdGl2ZSkgcmV0dXJuO1xuICAgICAgICBpZiAoZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgICBzZXRDYW5Db250cm9sKEJvb2xlYW4oZC5jYW5Db250cm9sKSk7XG4gICAgICAgICAgaWYgKGQuY2Fwcykgc2V0V2F0Y2hDYXBzKGQuY2Fwcyk7XG4gICAgICAgICAgc2V0UHJvdmlkZXIoZC5wcm92aWRlciB8fCAnVU5TVVBQT1JURUQnKTtcbiAgICAgICAgICBpZiAoZC5waG9uZz8udmlkZW9VcmwgJiYgZC5waG9uZy52aWRlb1VybCAhPT0gYWN0aXZlVmlkZW9VcmwpIHtcbiAgICAgICAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKGQucGhvbmcudmlkZW9VcmwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhcER1bmdEb25nQm8oZC5zdGF0ZSwgQm9vbGVhbihkLmNhbkNvbnRyb2wpLCBkLnByb3ZpZGVyIHx8ICdVTlNVUFBPUlRFRCcpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHsgfVxuICAgIH07XG5cbiAgICBmZXRjaFdhdGNoKCk7XG4gICAgY29uc3QgdGltZXIgPSBzZXRJbnRlcnZhbChraGlIaWVuVGhpKGZldGNoV2F0Y2gpLCAyNTAwKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICB9O1xuICB9LCBbcGhvbmcuaWQsIGhhc0ludGVyYWN0ZWRdKTtcblxuICAvLyBUaW1lciB0XHUwMTAzbmcgbG9jYWxUaW1lIFx1MDExMVx1MUVDMXUgXHUwMTExXHUxRUI3biBraGkgcGxheWluZ1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghd2F0Y2hTdGF0ZS5wbGF5aW5nKSByZXR1cm47XG4gICAgY29uc3QgdGljayA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmICghaXNTZWVraW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgc2V0TG9jYWxUaW1lKHQgPT4gdCArIDEpO1xuICAgICAgfVxuICAgIH0sIDEwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpY2spO1xuICB9LCBbd2F0Y2hTdGF0ZS5wbGF5aW5nXSk7XG5cbiAgLy8gR1x1MUVFRGkgbFx1MUVDN25oIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gKFBsYXkgLyBQYXVzZSAvIFNlZWspXG4gIGNvbnN0IGd1aUxlbmggPSBhc3luYyAoYWN0aW9uLCBjdXN0b21Qb3MpID0+IHtcbiAgICBpZiAoZGFuZ0d1aUxlbmgpIHJldHVybjtcbiAgICBzZXREYW5nR3VpTGVuaCh0cnVlKTtcbiAgICBzZXRMb2koJycpO1xuXG4gICAgbGV0IHBvcyA9IGN1c3RvbVBvcztcbiAgICBpZiAocG9zID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgICBwb3MgPSB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lO1xuICAgICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LmdldEN1cnJlbnRUaW1lKSB7XG4gICAgICAgIHBvcyA9IHl0UGxheWVyUmVmLmN1cnJlbnQuZ2V0Q3VycmVudFRpbWUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBvcyA9IGxvY2FsVGltZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcG9zID0gTWF0aC5tYXgoMCwgTnVtYmVyKChwb3MgfHwgMCkudG9GaXhlZCgyKSkpO1xuXG4gICAgLy8gQ1x1MUVBRHAgbmhcdTFFQUR0IGxcdTFFQTFjIHF1YW4gdHJcdTAwRUFuIGxvY2FsIHBsYXllclxuICAgIGlmIChhY3Rpb24gPT09ICdwbGF5Jykge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wbGF5VmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHl0QXBpRmFpbGVkKSB7XG4gICAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgaWZyYW1lI3l0LWZhbGxiYWNrLSR7cGhvbmcuaWR9YCk7XG4gICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZSgne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBsYXlWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAncGF1c2UnKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQucGF1c2UoKTtcbiAgICAgIGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBhdXNlVmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBhdXNlVmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGlmICh5dEFwaUZhaWxlZCkge1xuICAgICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGlmcmFtZSN5dC1mYWxsYmFjay0ke3Bob25nLmlkfWApO1xuICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoJ3tcImV2ZW50XCI6XCJjb21tYW5kXCIsXCJmdW5jXCI6XCJwYXVzZVZpZGVvXCIsXCJhcmdzXCI6XCJcIn0nLCAnKicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdzZWVrJykge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lID0gcG9zO1xuICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8uc2Vla1RvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8ocG9zLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGlmICh5dEFwaUZhaWxlZCkge1xuICAgICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGlmcmFtZSN5dC1mYWxsYmFjay0ke3Bob25nLmlkfWApO1xuICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3BvcywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctd2F0Y2gnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgIGFjdGlvbixcbiAgICAgICAgICBwb3NpdGlvbjogcG9zLFxuICAgICAgICAgIGV4cGVjdGVkUmV2aXNpb246IHdhdGNoU3RhdGUucmV2aXNpb24sXG4gICAgICAgICAgcGxheWJhY2tSYXRlOiB3YXRjaFN0YXRlLnBsYXliYWNrUmF0ZSB8fCAxLjBcbiAgICAgICAgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKGQuc3RhdGUucG9zaXRpb25TZWNvbmRzIHx8IHBvcykpO1xuICAgICAgfSBlbHNlIGlmIChkLmNvbmZsaWN0ICYmIGQuc3RhdGUpIHtcbiAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgYXBEdW5nRG9uZ0JvKGQuc3RhdGUsIGNhbkNvbnRyb2wsIHByb3ZpZGVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldExvaShkLmxvaSB8fCAnTFx1MUVEN2kgY1x1MUVBRHAgbmhcdTFFQUR0IHBoXHUwMEUxdCB2aWRlby4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaSgnTVx1MUVBNXQga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldERhbmdHdWlMZW5oKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gXHUwMTEwXHUxRUQzbmcgYlx1MUVEOSB2XHUxRUNCIHRyXHUwMEVEIHZpZGVvIGhpXHUxRUM3biB0XHUxRUExaSByYSBuZ29cdTAwRTBpIFx1MDExMVx1MUVDMyBjaGF0IGdcdTFFQUZuIHRpbWVzdGFtcFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh2aWRlb1RpbWVSZWYpIHZpZGVvVGltZVJlZi5jdXJyZW50ID0gbG9jYWxUaW1lO1xuICB9LCBbbG9jYWxUaW1lLCB2aWRlb1RpbWVSZWZdKTtcblxuXG5cbiAgLy8gTmhcdTFFQURuIHlcdTAwRUF1IGNcdTFFQTd1IHR1YSB0XHUxRUVCIFN0dWR5RG9jayAoYlx1MUVBNW0gbVx1MUVEMWMgdmlkZW8gdHJvbmcgY2hhdC9naGkgY2hcdTAwRkEpLlxuICAvLyBDXHUwMEYzIHF1eVx1MUVDMW4gXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiBcdTIxOTIgcGhcdTAwRTF0IGxcdTFFQzduaCBzZWVrIGNodW5nOyBraFx1MDBGNG5nIFx1MjE5MiBjaFx1MUVDOSB0dWEgY1x1MUVFNWMgYlx1MUVEOSBwbGF5ZXIgY1x1MUVFN2EgbVx1MDBFQ25oLlxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IG9uU2Vla1JlcSA9IChlKSA9PiB7XG4gICAgICBpZiAoZS5kZXRhaWw/LnBob25nSWQgIT09IHBob25nLmlkKSByZXR1cm47XG4gICAgICBjb25zdCBzZWMgPSBNYXRoLm1heCgwLCBOdW1iZXIoZS5kZXRhaWwuc2VjKSB8fCAwKTtcbiAgICAgIGlmIChjYW5Db250cm9sKSB7XG4gICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBzZWMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lID0gc2VjO1xuICAgICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LnNlZWtUbykgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8oc2VjLCB0cnVlKTtcbiAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3Ioc2VjKSk7XG4gICAgICB9XG4gICAgfTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc3Itc2VlaycsIG9uU2Vla1JlcSk7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdzci1zZWVrJywgb25TZWVrUmVxKTtcbiAgfSwgW3Bob25nLmlkLCBjYW5Db250cm9sLCBwcm92aWRlciwgd2F0Y2hTdGF0ZS5yZXZpc2lvbl0pO1xuXG4gIGNvbnN0IGhhbmRsZVN0YXJ0Vmlld2luZyA9ICgpID0+IHtcbiAgICBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHNldEhhc0ludGVyYWN0ZWQodHJ1ZSk7XG4gICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICBjb25zdCB2ID0gdmlkZW9SZWYuY3VycmVudDtcbiAgICAgIGNvbnN0IHAgPSB2LnBsYXkoKTtcbiAgICAgIGlmIChwICYmIHR5cGVvZiBwLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcC50aGVuKCgpID0+IHtcbiAgICAgICAgICBpZiAoIXdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICAgICAgdi5wYXVzZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5wbGF5VmlkZW8pIHtcbiAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcpIHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC00IG1pbi13LTAgdy1mdWxsXCI+XG4gICAgICB7LyogS2h1bmcgcGhcdTAwRTF0IHZpZGVvIGNoXHUwMEVEbmggXHUyMDE0IGtodW5nIG5lb24gbVx1MUVERCBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGhcdTFFQzcgZ2FtZSBhcmVuYSAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgdy1mdWxsIGFzcGVjdC12aWRlbyBiZy1ncmFkaWVudC10by1iIGZyb20tWyMwNTA3MGJdIHRvLWJsYWNrIHJvdW5kZWQtMnhsIG92ZXJmbG93LWhpZGRlbiBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8xNSByaW5nLTEgcmluZy13aGl0ZS81IHNoYWRvdy1bMF8wXzYwcHhfcmdiYSgwLDI0MiwyNTQsMC4wNyksMF8zMHB4XzYwcHhfLTE1cHhfcmdiYSgwLDAsMCwwLjcpXVwiPlxuICAgICAgICB7LyogT3ZlcmxheSBBdXRvcGxheSAvIEdlc3R1cmUgY2hvIG5nXHUwMUIwXHUxRUREaSB4ZW0gKi99XG4gICAgICAgIHshaGFzSW50ZXJhY3RlZCAmJiAhY2FuQ29udHJvbCAmJiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyB8fCBwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScpICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgei0yMCBiZy1ibGFjay83NSBiYWNrZHJvcC1ibHVyLXNtIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNCB0ZXh0LWNlbnRlciBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTE0IGgtMTQgcm91bmRlZC1mdWxsIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LTJ4bCBtYi0zIHNoYWRvdy1bMF8wXzI1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGFuaW1hdGUtcHVsc2VcIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERkFDXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlIG1iLTFcIj5YZW0gQ2h1bmcgQ1x1MDBGOW5nIFBoXHUwMEYybmc8L3A+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIG1heC13LXhzIG1iLTRcIj5cbiAgICAgICAgICAgICAgQlx1MUVBNW0gblx1MDBGQXQgYlx1MDBFQW4gZFx1MDFCMFx1MUVEQmkgXHUwMTExXHUxRUMzIGNcdTFFQTVwIHF1eVx1MUVDMW4gXHUwMEUybSB0aGFuaCB2XHUwMEUwIGNcdTAwRjluZyB0aGVvIGRcdTAwRjVpIHRpbWVsaW5lIHZcdTFFREJpIGNoXHUxRUU3IHBoXHUwMEYybmcuXG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiYnRuLXZpZXdlci1zdGFydC13YXRjaFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVTdGFydFZpZXdpbmd9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMi41IHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzNCODJGNl0gdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQteHMgc2hhZG93LWxnIGhvdmVyOm9wYWNpdHktOTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MjVCNjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVBRnQgXHUwMTExXHUxRUE3dSB4ZW0gY1x1MDBGOW5nIHBoXHUwMEYybmc8L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVmlkZW8gZWxlbWVudHMgdGhlbyBwcm92aWRlciAqL31cbiAgICAgICAge3l0SWQgPyAoXG4gICAgICAgICAgeXRBcGlGYWlsZWQgPyAoXG4gICAgICAgICAgICA8ZGl2IGtleT17YHl0LWZhbGxiYWNrLXdyYXAtJHtwaG9uZy5pZH0tJHt5dElkfWB9IGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgcmVsYXRpdmVcIj5cbiAgICAgICAgICAgICAgPGlmcmFtZVxuICAgICAgICAgICAgICAgIGlkPXtgeXQtZmFsbGJhY2stJHtwaG9uZy5pZH1gfVxuICAgICAgICAgICAgICAgIGtleT17YHl0LWlmcmFtZS0ke3l0SWR9YH1cbiAgICAgICAgICAgICAgICBzcmM9e2BodHRwczovL3d3dy55b3V0dWJlLW5vY29va2llLmNvbS9lbWJlZC8ke3l0SWR9P2F1dG9wbGF5PSR7d2F0Y2hTdGF0ZS5wbGF5aW5nID8gMSA6IDB9JnN0YXJ0PSR7TWF0aC5mbG9vcihsb2NhbFRpbWUgfHwgMCl9JmVuYWJsZWpzYXBpPTEmb3JpZ2luPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmxvY2F0aW9uLm9yaWdpbiA6ICcnKX0mcmVsPTAmbW9kZXN0YnJhbmRpbmc9MSZwbGF5c2lubGluZT0xYH1cbiAgICAgICAgICAgICAgICB0aXRsZT17cGhvbmcudGVuIHx8ICdZb3VUdWJlIFZpZGVvJ31cbiAgICAgICAgICAgICAgICBhbGxvdz1cImFjY2VsZXJvbWV0ZXI7IGF1dG9wbGF5OyBjbGlwYm9hcmQtd3JpdGU7IGVuY3J5cHRlZC1tZWRpYTsgZ3lyb3Njb3BlOyBwaWN0dXJlLWluLXBpY3R1cmU7IHdlYi1zaGFyZVwiXG4gICAgICAgICAgICAgICAgYWxsb3dGdWxsU2NyZWVuXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBib3JkZXItMFwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgdG9wLTIgcmlnaHQtMiBweC0yIHB5LTAuNSByb3VuZGVkIGJnLWJsYWNrLzcwIGJhY2tkcm9wLWJsdXIgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTMwMCBwb2ludGVyLWV2ZW50cy1ub25lIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIHNoYWRvd1wiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjZBMTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5QaFx1MDBFMXQgdHJcdTFFRjFjIHRpXHUxRUJGcCBZb3VUdWJlPC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICA8ZGl2IGtleT17YHl0LXdyYXAtJHtwaG9uZy5pZH1gfSBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgICAgICAgIDxkaXYgaWQ9e3l0Q29udGFpbmVySWR9IGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGxcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKVxuICAgICAgICApIDogZHJ2SWQgPyAoXG4gICAgICAgICAgPGlmcmFtZVxuICAgICAgICAgICAgc3JjPXtgaHR0cHM6Ly9kcml2ZS5nb29nbGUuY29tL2ZpbGUvZC8ke2RydklkfS9wcmV2aWV3YH1cbiAgICAgICAgICAgIHRpdGxlPXtwaG9uZy50ZW59XG4gICAgICAgICAgICBhbGxvdz1cImF1dG9wbGF5OyBmdWxsc2NyZWVuXCJcbiAgICAgICAgICAgIGFsbG93RnVsbFNjcmVlblxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbFwiXG4gICAgICAgICAgLz5cbiAgICAgICAgKSA6IHRydWNUaWVwVXJsID8gKFxuICAgICAgICAgIDx2aWRlb1xuICAgICAgICAgICAgcmVmPXt2aWRlb1JlZn1cbiAgICAgICAgICAgIHNyYz17dHJ1Y1RpZXBVcmx9XG4gICAgICAgICAgICBwbGF5c0lubGluZVxuICAgICAgICAgICAgZGF0YS10ZXN0aWQ9XCJzdHVkeS12aWRlby1wbGF5ZXJcIlxuICAgICAgICAgICAgY29udHJvbHM9e2NhbkNvbnRyb2x9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb250YWluXCJcbiAgICAgICAgICAgIG9uTG9hZGVkTWV0YWRhdGE9e2UgPT4ge1xuICAgICAgICAgICAgICBpZiAoZS50YXJnZXQuZHVyYXRpb24gPiAwKSBzZXREdXJhdGlvbihlLnRhcmdldC5kdXJhdGlvbik7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25QbGF5PXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmICF3YXRjaFN0YXRlLnBsYXlpbmcgJiYgIWRhbmdHdWlMZW5oKSB7XG4gICAgICAgICAgICAgICAgZ3VpTGVuaCgncGxheScsIHZpZGVvUmVmLmN1cnJlbnQ/LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uUGF1c2U9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgd2F0Y2hTdGF0ZS5wbGF5aW5nICYmICFkYW5nR3VpTGVuaCkge1xuICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3BhdXNlJywgdmlkZW9SZWYuY3VycmVudD8uY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25FbmRlZD17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCkgaGFuaERvbmdRdWV1ZSgnc2tpcCcpO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uU2Vla2VkPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghY2FuQ29udHJvbCB8fCBkYW5nR3VpTGVuaCB8fCBpc1NlZWtpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICBjb25zdCBjdXIgPSB2aWRlb1JlZi5jdXJyZW50Py5jdXJyZW50VGltZTtcbiAgICAgICAgICAgICAgaWYgKGN1ciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgICAgICAgICAgIC8vIENoXHUxRUQxbmcgdlx1MDBGMm5nIGxcdTFFQjdwOiBtXHUxRUNEaSBnXHUwMEUxbiBjdXJyZW50VGltZSBuXHUxRUQ5aSBiXHUxRUQ5IChvcHRpbWlzdGljIHNlZWssIGRyaWZ0LWNvcnJlY3Rpb25cbiAgICAgICAgICAgICAgLy8gY1x1MUVFN2EgYXBEdW5nRG9uZ0JvKSBcdTAxMTFcdTFFQzF1IGJcdTFFQUZuICdzZWVrZWQnLiBDaFx1MUVDOSBnXHUxRUVEaSBsXHUxRUM3bmgga2hpIHZcdTFFQ0IgdHJcdTAwRUQgbFx1MUVDN2NoIGtoXHUxRUNGaVxuICAgICAgICAgICAgICAvLyB2XHUxRUNCIHRyXHUwMEVEIHNlcnZlciBrXHUxRUYzIHZcdTFFQ0RuZyA+MS41cyBcdTIwMTQgdFx1MUVFOWMgbmdcdTAxQjBcdTFFRERpIGRcdTAwRjluZyB0aFx1MUVBRHQgc1x1MUVGMSB0dWEgcXVhIHRoYW5oIGNvbnRyb2xzLlxuICAgICAgICAgICAgICBjb25zdCBzdCA9IHdhdGNoU3RhdGU7XG4gICAgICAgICAgICAgIGNvbnN0IHVwZE1zID0gc3Q/LnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyhzdC51cGRhdGVkQXQpLnJlcGxhY2UoJyAnLCAnVCcpICsgKFN0cmluZyhzdC51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKSA6IERhdGUubm93KCk7XG4gICAgICAgICAgICAgIGNvbnN0IGVsYXBzZWQgPSBNYXRoLm1heCgwLCAoRGF0ZS5ub3coKSAtIHVwZE1zKSAvIDEwMDApO1xuICAgICAgICAgICAgICBjb25zdCBreVZvbmcgPSBzdD8ucGxheWluZ1xuICAgICAgICAgICAgICAgID8gTnVtYmVyKHN0LmJhc2VQb3NpdGlvblNlY29uZHMgfHwgMCkgKyBlbGFwc2VkICogKHN0LnBsYXliYWNrUmF0ZSB8fCAxKVxuICAgICAgICAgICAgICAgIDogTnVtYmVyKHN0Py5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgICAgICAgICAgIGlmIChNYXRoLmFicyhjdXIgLSBreVZvbmcpID4gMS41KSBndWlMZW5oKCdzZWVrJywgY3VyKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgLz5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGgtZnVsbCB0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIHAtNiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC0yeGwgbWItMlwiPlx1MjZBMFx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkxpbmsgdmlkZW8ga2hcdTAwRjRuZyBoXHUxRUQ3IHRyXHUxRUUzIHBoXHUwMEUxdCB0clx1MUVGMWMgdGlcdTFFQkZwIGhvXHUxRUI3YyBraFx1MDBGNG5nIGhcdTFFRTNwIGxcdTFFQzcuPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBUaFx1MDBGNG5nIGJcdTAwRTFvIHJpXHUwMEVBbmcgY2hvIEdvb2dsZSBEcml2ZSAqL31cbiAgICAgIHtkcnZJZCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMy41IHB5LTIgYmctYW1iZXItNTAwLzEwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzIwIHJvdW5kZWQteGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyB0ZXh0LWFtYmVyLTMwMFwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc21cIj5cdTIxMzlcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgPHNwYW4+R29vZ2xlIERyaXZlIHBoXHUwMEUxdCBcdTFFREYgY2hcdTFFQkYgXHUwMTExXHUxRUQ5IDxzdHJvbmc+WGVtIFx1MDExMVx1MUVEOWMgbFx1MUVBRHA8L3N0cm9uZz4gKEdvb2dsZSBEcml2ZSBraFx1MDBGNG5nIGhcdTFFRDcgdHJcdTFFRTMgQVBJIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gdFx1MUVFQiB4YSkuPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBUaGFuaCBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIEhvc3QgXHUyMDE0IFx1MUVBOW4ga2hpIGZ1bGxzY3JlZW4gKi99XG4gICAgICB7IWlzUm9vbVdpZGUgJiYgKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1ncmFkaWVudC10by1iIGZyb20tWyMxNjFiMjZdIHRvLVsjMGYxNDFkXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8xMCByb3VuZGVkLTJ4bCBwLTMgc206cC0zLjUgZmxleCBmbGV4LWNvbCBnYXAtMyBzaGFkb3cteGxcIj5cblxuXG4gICAgICAgIHsvKiBUaGFuaCBjXHUwMEY0bmcgY1x1MUVFNSBwaFx1MDBFMXQgY2h1bmcgKGNoXHUxRUM5IGhpXHUxRUMzbiB0aFx1MUVDQiBjaG8gSG9zdCAvIFRlYWNoZXIga2hpIGRcdTAwRjluZyBwcm92aWRlciBjXHUwMEYzIHRoXHUxRUMzIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24pICovfVxuICAgICAgICB7Y2FuQ29udHJvbCAmJiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnIHx8IHByb3ZpZGVyID09PSAnWU9VVFVCRScpICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgaXRlbXMtY2VudGVyIGdhcC0zIHB0LTIgYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiYnRuLWhvc3Qtd2F0Y2gtdG9nZ2xlXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgod2F0Y2hTdGF0ZS5wbGF5aW5nID8gJ3BhdXNlJyA6ICdwbGF5Jyl9XG4gICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIHNtOnctYXV0byBweC00IHB5LTIgcm91bmRlZC14bCBmb250LWJsYWNrIHRleHQteHMgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEuNSBzaGFkb3ctbWQgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyIGRpc2FibGVkOm9wYWNpdHktNTAgJHtcbiAgICAgICAgICAgICAgICB3YXRjaFN0YXRlLnBsYXlpbmdcbiAgICAgICAgICAgICAgICAgID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC80MCBob3ZlcjpiZy1hbWJlci01MDAvMzAgc2hhZG93LVswXzBfMTJweF9yZ2JhKDI0NSwxNTgsMTEsMC4yNSldJ1xuICAgICAgICAgICAgICAgICAgOiAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzAwYzZmZl0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBob3ZlcjpicmlnaHRuZXNzLTExMCdcbiAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICA8c3Bhbj57d2F0Y2hTdGF0ZS5wbGF5aW5nID8gJ1x1MjNGOCcgOiAnXHUyNUI2J308L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPnt3YXRjaFN0YXRlLnBsYXlpbmcgPyAnVFx1MUVBMW0gRFx1MUVFQm5nIENcdTFFQTMgUGhcdTAwRjJuZycgOiAnUGhcdTAwRTF0IENodW5nIENcdTFFQTMgUGhcdTAwRjJuZyd9PC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjUgdy1mdWxsXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGlkPVwiaG9zdC1kdXJhdGlvbi1sYWJlbFwiIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIHtkaW5oRGFuZ0dpYXlQaHV0KGxvY2FsVGltZSl9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgaWQ9XCJob3N0LXNlZWstc2xpZGVyXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwicmFuZ2VcIlxuICAgICAgICAgICAgICAgIG1pbj1cIjBcIlxuICAgICAgICAgICAgICAgIG1heD17ZHVyYXRpb24gPiAwID8gZHVyYXRpb24gOiBNYXRoLm1heChsb2NhbFRpbWUsIDMwMCl9XG4gICAgICAgICAgICAgICAgc3RlcD1cIjFcIlxuICAgICAgICAgICAgICAgIHZhbHVlPXtsb2NhbFRpbWV9XG4gICAgICAgICAgICAgICAgb25Nb3VzZURvd249eygpID0+IHsgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgIG9uVG91Y2hTdGFydD17KCkgPT4geyBpc1NlZWtpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0TG9jYWxUaW1lKE51bWJlcihlLnRhcmdldC52YWx1ZSkpfVxuICAgICAgICAgICAgICAgIG9uTW91c2VVcD17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBpc1NlZWtpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaCgnc2VlaycsIE51bWJlcihlLnRhcmdldC52YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgb25Ub3VjaEVuZD17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBpc1NlZWtpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaCgnc2VlaycsIE51bWJlcihlLnRhcmdldC52YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGgtMS41IGJnLXdoaXRlLzEwIHJvdW5kZWQtbGcgYXBwZWFyYW5jZS1ub25lIGN1cnNvci1wb2ludGVyIGFjY2VudC1bIzAwRjJGRV1cIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICB7ZHVyYXRpb24gPiAwID8gZGluaERhbmdHaWF5UGh1dChkdXJhdGlvbikgOiAnLS06LS0nfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7bG9pICYmIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1yb3NlLTQwMFwiPntsb2l9PC9wPn1cbiAgICAgICAge3Bob25nLm1vVGEgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgbGVhZGluZy1yZWxheGVkIHB0LTFcIj57cGhvbmcubW9UYX08L3A+fVxuXG4gICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBcdTI1MDBcdTI1MDBcdTI1MDAgVlx1MDBEOU5HIDE6IFRSVU5HIFRcdTAwQzJNIENcdTFFQTRVIEhcdTAwQ0NOSCBWSURFTyAmIEhcdTAwQzBORyBcdTAxMTBcdTFFRTJJIFlPVVRVQkUgVFJcdTFFRjBDIFRJXHUxRUJFUCBcdTI1MDBcdTI1MDBcdTI1MDAgKi99XG4gICAgICB7IWlzUm9vbVdpZGUgJiYgKFxuICAgICAgICA8ZGl2IGlkPVwidnVuZzEteW91dHViZS1zdHVkaW9cIiBjbGFzc05hbWU9XCJiZy1ncmFkaWVudC10by1iIGZyb20tWyMxNjFiMjZdIHRvLVsjMGYxNDFkXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtMy41IHNtOnAtNCBmbGV4IGZsZXgtY29sIGdhcC0zIHNoYWRvdy14bFwiPlxuICAgICAgICAgIHsvKiBIZWFkZXIgdHJ1bmcgdFx1MDBFMm0gKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgcGItMi41IGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMCBmbGV4LXdyYXBcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLWJyIGZyb20tWyMwMEYyRkVdLzIwIHRvLXZpb2xldC01MDAvMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMzAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1zbSBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMCwyNDIsMjU0LDAuMjUpXVwiPlxuICAgICAgICAgICAgICAgIFx1RDgzQ1x1REZBQ1xuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQteHMgc206dGV4dC1zbSBmb250LWJsYWNrIHRleHQtd2hpdGUgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+Q1x1MUVBNXUgaFx1MDBFQ25oIFZpZGVvICYgSFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgWW91VHViZTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3QuZmlsdGVyKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnKS5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkLWZ1bGwgYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3QuZmlsdGVyKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnKS5sZW5ndGh9IFx1MDExMWFuZyBjaFx1MUVERFxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDBcIj5UXHUwMEVDbSBraVx1MUVCRm0gdmlkZW8sIFx1MDExMVx1MDFCMGEgdlx1MDBFMG8gaFx1MDBFMG5nIGNoXHUxRUREIHZcdTAwRTAgY2hcdTFFQTF5IHZpZGVvIGtoXHUwMEUxYyBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGNcdTFFQTMgcGhcdTAwRjJuZzwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgIHsvKiBUYWIgc2VsZWN0b3IgKi99XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgYmctWyMwQjBFMTRdIHAtMSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLW1lZGlhLXRhYi1zZWFyY2hcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0TWVkaWFUYWIoJ3NlYXJjaCcpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgICAgICAgbWVkaWFUYWIgPT09ICdzZWFyY2gnXG4gICAgICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctbWQnXG4gICAgICAgICAgICAgICAgICAgICAgOiAndGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPlRcdTAwRUNtIFlvdVR1YmU8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi1tZWRpYS10YWItcXVldWVcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0TWVkaWFUYWIoJ3F1ZXVlJyl9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEuNSByb3VuZGVkLWxnIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICAgICAgICBtZWRpYVRhYiA9PT0gJ3F1ZXVlJ1xuICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS12aW9sZXQtNTAwIHRvLWZ1Y2hzaWEtNTAwIHRleHQtd2hpdGUgc2hhZG93LW1kJ1xuICAgICAgICAgICAgICAgICAgICAgIDogJ3RleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQ0I8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5IXHUwMEUwbmcgXHUwMTExXHUxRUUzaSAoe3F1ZXVlTGlzdC5maWx0ZXIocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpLmxlbmd0aH0pPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogVG9nZ2xlIHRodSBnXHUxRUNEbiAqL31cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLXRvZ2dsZS1zdHVkaW9cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERhTW9Sb25nU3R1ZGlvKCFkYU1vUm9uZ1N0dWRpbyl9XG4gICAgICAgICAgICAgICAgdGl0bGU9e2RhTW9Sb25nU3R1ZGlvID8gJ1RodSBnXHUxRUNEbicgOiAnTVx1MUVERiByXHUxRUQ5bmcnfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctOCBoLTggcm91bmRlZC14bCBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgIHtkYU1vUm9uZ1N0dWRpbyA/ICdcdTI1QjInIDogJ1x1MjVCQyd9XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7LyogVG9hc3QgdGhcdTAwRjRuZyBiXHUwMEUxbyAvIExcdTFFRDdpICovfVxuICAgICAgICAgIHt0aG9uZ0Jhb1ZpZGVvICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMyBweS0yIHJvdW5kZWQteGwgYmctZW1lcmFsZC01MDAvMTUgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LWVtZXJhbGQtMzAwIHRleHQteHMgZm9udC1ib2xkIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGFuaW1hdGUtZmFkZUluXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MjcyODwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+e3Rob25nQmFvVmlkZW99PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgICB7bG9pVmlkZW8gJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zIHB5LTIgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xNSBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRleHQtcm9zZS0zMDAgdGV4dC14cyBmb250LWJvbGQgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgYW5pbWF0ZS1mYWRlSW5cIj5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNkEwXHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj57bG9pVmlkZW99PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cblxuICAgICAgICAgIHtkYU1vUm9uZ1N0dWRpbyAmJiAoXG4gICAgICAgICAgICA8PlxuICAgICAgICAgICAgICB7LyogVEFCIDE6IFRcdTAwQ0NNIEtJXHUxRUJFTSBZT1VUVUJFICYgXHUwMTEwXHUxRUQ0SSBWSURFTyAqL31cbiAgICAgICAgICAgICAge21lZGlhVGFiID09PSAnc2VhcmNoJyAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC0zXCI+XG4gICAgICAgICAgICAgICAgICB7LyogXHUwMEQ0IHRcdTAwRUNtIGtpXHUxRUJGbSAvIGRcdTAwRTFuIGxpbmsgXHUwMTExYSBuXHUwMTAzbmcgKi99XG4gICAgICAgICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17KGUpID0+IHRpbUtpZW1Zb3VUdWJlKGUpfSBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIGZsZXgtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYWJzb2x1dGUgbGVmdC0zIHRvcC0xLzIgLXRyYW5zbGF0ZS15LTEvMiB0ZXh0LXNsYXRlLTQwMCB0ZXh0LXhzXCI+XHVEODNEXHVERDBEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtdnVuZzEteW91dHViZS1zZWFyY2hcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt5dFF1ZXJ5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRZdFF1ZXJ5KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJOaFx1MUVBRHAgdFx1MUVFQiBraFx1MDBGM2EgdFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmUgKHZkOiBsb2ZpIGhcdTFFQ0RjIGJcdTAwRTBpLi4uKSBob1x1MUVCN2MgZFx1MDBFMW4gbGluayB2aWRlby4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBmb2N1czpib3JkZXItWyMwMEYyRkVdLzYwIHJvdW5kZWQteGwgcGwtOCBwci0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLXRpbS1raWVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXsheXRRdWVyeS50cmltKCkgfHwgc2VhcmNoaW5nWXR9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zLjUgcHktMiByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIGhvdmVyOmJyaWdodG5lc3MtMTEwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBzaGFkb3ctbWQgZGlzYWJsZWQ6b3BhY2l0eS00MCB3aGl0ZXNwYWNlLW5vd3JhcCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7c2VhcmNoaW5nWXQgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYW5pbWF0ZS1zcGluXCI+XHUyM0YzPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MDExMGFuZyB0XHUwMEVDbS4uLjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5UXHUwMEVDbSBraVx1MUVCRm08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgey8qIEFjdGlvbiBidXR0b25zIHBoXHUxRUU1IGtoaSBcdTAwRjQgaW5wdXQgbFx1MDBFMCAxIGxpbmsgdmlkZW8gdHJcdTFFRjFjIHRpXHUxRUJGcCAqL31cbiAgICAgICAgICAgICAgICAgICAge0Jvb2xlYW4oeXRRdWVyeS50cmltKCkuc3RhcnRzV2l0aCgnaHR0cDovLycpIHx8IHl0UXVlcnkudHJpbSgpLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vJykgfHwgeXRRdWVyeS5pbmNsdWRlcygneW91dHUnKSkgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcC0yIHJvdW5kZWQteGwgYmctWyMwQjBFMTRdLzgwIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzIwIGZsZXgtd3JhcCBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDE3PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5QaFx1MDBFMXQgaGlcdTFFQzduIGxpXHUwMEVBbiBrXHUxRUJGdCB2aWRlbzo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS1waGF0LW5nYXktbGlua1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGRvaVZpZGVvKHl0UXVlcnkudHJpbSgpLCAnVmlkZW8gdFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdEb2lWaWRlb31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1bIzAwRjJGRV0gdGV4dC1ibGFjayB0ZXh0LXhzIGZvbnQtYmxhY2sgaG92ZXI6YmctWyMwMGUxZWNdIGFjdGl2ZTpzY2FsZS05NSBzaGFkb3ctc21cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2IFBoXHUwMEUxdCBuZ2F5IGNcdTFFQTMgcGhcdTAwRjJuZ1xuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS1lbnF1ZXVlLWxpbmtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdlbnF1ZXVlJywgeyB2aWRlb1VybDogeXRRdWVyeS50cmltKCksIHRpdGxlOiAnVmlkZW8gdFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQnIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLWVtZXJhbGQtNTAwLzIwIHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICArIFRoXHUwMEVBbSB2XHUwMEUwbyBjdVx1MUVEMWkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtYWRkLW5leHQtbGlua1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ2FkZF9uZXh0JywgeyB2aWRlb1VybDogeXRRdWVyeS50cmltKCksIHRpdGxlOiAnVmlkZW8gdFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQnIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy12aW9sZXQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICsgUGhcdTAwRTF0IGtcdTFFQkYgdGlcdTFFQkZwXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDwvZm9ybT5cblxuICAgICAgICAgICAgICAgICAgey8qIFRyXHUxRUExbmcgdGhcdTAwRTFpIGxcdTFFRDdpIHRcdTAwRUNtIGtpXHUxRUJGbSAqL31cbiAgICAgICAgICAgICAgICAgIHtzZWFyY2hMb2kgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMyByb3VuZGVkLXhsIGJnLWFtYmVyLTUwMC8xMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCB0ZXh0LXhzIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MjZBMFx1RkUwRiB7c2VhcmNoTG9pfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRTZWFyY2hMb2koJycpfSBjbGFzc05hbWU9XCJ0ZXh0LWFtYmVyLTQwMCBmb250LWJvbGQgaG92ZXI6dW5kZXJsaW5lXCI+XHUwMTEwXHUwMEYzbmc8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICB7LyogS1x1MUVCRnQgcXVcdTFFQTMgdFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmUgKi99XG4gICAgICAgICAgICAgICAgICB7eXRSZXN1bHRzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQteHMgdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENGQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+S1x1MUVCRnQgcXVcdTFFQTMgWW91VHViZSAoe3l0UmVzdWx0cy5sZW5ndGh9IHZpZGVvKTo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS1kb25nLWtldC1xdWFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldFl0UmVzdWx0cyhbXSk7IHNldFNlYXJjaExvaSgnJyk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIgcHktMC41IHJvdW5kZWQtbWQgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHRleHQtWzEwcHhdIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTUgXHUwMTEwXHUwMEYzbmcga1x1MUVCRnQgcXVcdTFFQTNcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTIgbWF4LWgtNzIgb3ZlcmZsb3cteS1hdXRvIHByLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt5dFJlc3VsdHMubWFwKChpdGVtLCBpZHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdlVybCA9IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PSR7aXRlbS52aWRlb0lkfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtpdGVtLnZpZGVvSWQgfHwgaWR4fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZ3JvdXAgYmctWyMwQjBFMTRdIGhvdmVyOmJnLVsjMTIxNzIxXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOmJvcmRlci1bIzAwRjJGRV0vMzAgcm91bmRlZC14bCBwLTIuNSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFRodW1ibmFpbCAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgdy0yNCBzbTp3LTI4IGFzcGVjdC12aWRlbyByb3VuZGVkLWxnIG92ZXJmbG93LWhpZGRlbiBiZy1ibGFjayBzaHJpbmstMCBib3JkZXIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGltZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYz17aXRlbS50aHVtYm5haWx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWx0PXtpdGVtLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvdmVyIGdyb3VwLWhvdmVyOnNjYWxlLTEwNSB0cmFuc2l0aW9uLXRyYW5zZm9ybVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZz1cImxhenlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBib3R0b20tMSByaWdodC0xIGJnLWJsYWNrLzgwIHB4LTEgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LW1vbm8gdGV4dC13aGl0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFlvdVR1YmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBUaFx1MDBGNG5nIHRpbiB2aWRlbyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGg1IGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtMjAwIGxpbmUtY2xhbXAtMiBncm91cC1ob3Zlcjp0ZXh0LVsjMDBGMkZFXSB0cmFuc2l0aW9uLWNvbG9yc1wiIHRpdGxlPXtpdGVtLnRpdGxlfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXRlbS50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9oNT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtdC0xIHRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0uY2hhbm5lbFRpdGxlIHx8ICdLXHUwMEVBbmggWW91VHViZSd9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpdGVtLnB1Ymxpc2hlZEF0ICYmIDxzcGFuPlx1MjAyMiB7aXRlbS5wdWJsaXNoZWRBdH08L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogQlx1MUVEOSAzIG5cdTAwRkF0IHRoYW8gdFx1MDBFMWMgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgaXRlbXMtY2VudGVyIGdhcC0xLjUgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ2hcdTFFQTF5IHZpZGVvIG5cdTAwRTB5IG5nYXkgbFx1MUVBRHAgdFx1MUVFOWMgY2hvIGNcdTFFQTMgcGhcdTAwRjJuZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZG9pVmlkZW8odlVybCwgaXRlbS50aXRsZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdEb2lWaWRlb31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMS41IHJvdW5kZWQtbGcgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzAwYzZmZl0gdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQtWzExcHhdIHNoYWRvdy1zbSBob3ZlcjpicmlnaHRuZXNzLTExMCBhY3RpdmU6c2NhbGUtOTUgZGlzYWJsZWQ6b3BhY2l0eS00MCB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNiBQaFx1MDBFMXQgbmdheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiVGhcdTAwRUFtIHZcdTAwRTBvIGN1XHUxRUQxaSBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnZW5xdWV1ZScsIHsgdmlkZW9Vcmw6IHZVcmwsIHRpdGxlOiBpdGVtLnRpdGxlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8yNSB0ZXh0LVsxMXB4XSBmb250LWJvbGQgYWN0aXZlOnNjYWxlLTk1IGRpc2FibGVkOm9wYWNpdHktNDAgd2hpdGVzcGFjZS1ub3dyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIEhcdTAwRTBuZyBjaFx1MUVERFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiVGhcdTAwRUFtIFx1MDExMVx1MUVDMyBwaFx1MDBFMXQga1x1MUVCRiB0aVx1MUVCRnAgc2F1IHZpZGVvIGhpXHUxRUM3biB0XHUxRUExaVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnYWRkX25leHQnLCB7IHZpZGVvVXJsOiB2VXJsLCB0aXRsZTogaXRlbS50aXRsZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy12aW9sZXQtNTAwLzE1IHRleHQtdmlvbGV0LTMwMCBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvMzAgaG92ZXI6YmctdmlvbGV0LTUwMC8yNSB0ZXh0LVsxMHB4XSBmb250LWJvbGQgYWN0aXZlOnNjYWxlLTk1IGRpc2FibGVkOm9wYWNpdHktNDAgd2hpdGVzcGFjZS1ub3dyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIEtcdTFFQkYgdGlcdTFFQkZwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAvKiBHXHUxRUUzaSBcdTAwRkQgdFx1MUVFQiBraFx1MDBGM2EgdFx1MDBFQ20ga2lcdTFFQkZtIG5oYW5oIGtoaSBjaFx1MDFCMGEgc2VhcmNoICovXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtMS41IHB0LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCBmb250LWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBHXHUxRUUzaSBcdTAwRkQgY2hcdTFFRTcgXHUwMTExXHUxRUMxIGhcdTFFQ0RjIHRcdTFFQURwICYgdGhcdTAxQjAgZ2lcdTAwRTNuOlxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7W1xuICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHVEODNDXHVERkE3IExvZmkgaFx1MUVDRGMgdFx1MUVBRHAnLCBxOiAnbG9maSBoaXAgaG9wIHJhZGlvIGJlYXRzIHRvIHJlbGF4IHN0dWR5IHRvJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHVEODNDXHVERjI3XHVGRTBGIFRpXHUxRUJGbmcgbVx1MDFCMGEgJiBQaWFubycsIHE6ICdyYWluIHNvdW5kcyByZWxheGluZyBwaWFubyBzdHVkeSBmb2N1cycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1MjYxNSBOaFx1MUVBMWMgcXVcdTAwRTFuIGNcdTAwRTAgcGhcdTAwRUEnLCBxOiAnY29mZmVlIHNob3AgamF6eiBwaWFubyBjaGlsbCBzdHVkeScgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1RDgzRFx1RENEQSBUXHUxRUFEcCB0cnVuZyBcdTAwRjRuIHRoaScsIHE6ICdzdHVkeSBtdXNpYyBhbHBoYSB3YXZlcyBjb25jZW50cmF0aW9uJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHVEODNEXHVERDJDIFRoXHUwMEVEIG5naGlcdTFFQzdtIEhcdTAwRjNhIGhcdTFFQ0RjJywgcTogJ3RoXHUwMEVEIG5naGlcdTFFQzdtIGhcdTAwRjNhIGhcdTFFQ0RjIHRoXHUwMEZBIHZcdTFFQ0InIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBdLm1hcCgoY2hpcCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtjaGlwLnF9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHRpbUtpZW1Zb3VUdWJlKGUsIGNoaXAucSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC1bMTFweF0gdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y2hpcC5sYWJlbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgIHsvKiBUQUIgMjogUVVcdTFFQTJOIExcdTAwREQgSFx1MDBDME5HIFx1MDExMFx1MUVFMkkgKFFVRVVFKSAqL31cbiAgICAgICAgICAgICAge21lZGlhVGFiID09PSAncXVldWUnICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTNcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGZsZXgtd3JhcCBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0NCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPkhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHZpZGVvICh7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RofSBjaFx1MUVERCk8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7cXVldWVMaXN0LnNvbWUocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLXF1ZXVlLXNraXBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdza2lwJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctYW1iZXItNTAwLzE1IHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLWFtYmVyLTUwMC8yNSBkaXNhYmxlZDpvcGFjaXR5LTQwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MjNFRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVDRiBxdWEgLyBCXHUwMEUwaSB0aVx1MUVCRnA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGFpUXVldWV9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkxcdTAwRTBtIG1cdTFFREJpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIgcHktMSByb3VuZGVkLWxnIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LXhzIGJvcmRlciBib3JkZXItd2hpdGUvMTAgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzRFx1REQwNFxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICB7LyogVGhcdTAwRUFtIGxpbmsgbmhhbmggdlx1MDBFMG8gcXVldWUgKi99XG4gICAgICAgICAgICAgICAgICA8UXVldWVJbnB1dFxuICAgICAgICAgICAgICAgICAgICBvbkFkZD17KHUsIHQpID0+IGhhbmhEb25nUXVldWUoJ2VucXVldWUnLCB7IHZpZGVvVXJsOiB1LCB0aXRsZTogdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgb25BZGROZXh0PXsodSwgdCkgPT4gaGFuaERvbmdRdWV1ZSgnYWRkX25leHQnLCB7IHZpZGVvVXJsOiB1LCB0aXRsZTogdCB9KX1cbiAgICAgICAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBEYW5oIHNcdTAwRTFjaCB2aWRlbyB0cm9uZyBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaSAqL31cbiAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3QubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNSByb3VuZGVkLXhsIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgdGV4dC1jZW50ZXIgdGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC0yeGxcIj5cdUQ4M0RcdURDQ0I8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwXCI+SFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgaGlcdTFFQzduIFx1MDExMWFuZyB0clx1MUVEMW5nPC9wPlxuICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwIG1heC13LXNtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBDaHV5XHUxRUMzbiBzYW5nIHRhYiA8c3Ryb25nPlRcdTAwRUNtIFlvdVR1YmU8L3N0cm9uZz4gaG9cdTFFQjdjIGRcdTAwRTFuIGxpXHUwMEVBbiBrXHUxRUJGdCB2XHUwMEUwbyBcdTAwRjQgdHJcdTAwRUFuIFx1MDExMVx1MUVDMyBwaFx1MDBFMXQgbFx1MUVBN24gbFx1MDFCMFx1MUVFM3QgY1x1MDBFMWMgYlx1MDBFMGkgaFx1MUVDRGMgJiB2aWRlbyBnaVx1MUVBM2kgdHJcdTAwRUQuXG4gICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjUgbWF4LWgtNjQgb3ZlcmZsb3cteS1hdXRvIHByLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7cXVldWVMaXN0Lm1hcCgocSwgaWR4KSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17cS5pZCB8fCBpZHh9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjUgYmctWyMwQjBFMTRdIGJvcmRlciByb3VuZGVkLXhsIHAtMiB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHEudHJhbmdUaGFpID09PSAncGxheWluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JvcmRlci1lbWVyYWxkLTUwMC80MCBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoNTIsMjExLDE1MywwLjE1KV0gYmctZW1lcmFsZC05NTAvMjAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdib3JkZXItd2hpdGUvNSBob3Zlcjpib3JkZXItd2hpdGUvMTUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTYgaC02IHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTFweF0gZm9udC1ibGFjayBzaHJpbmstMCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcS50cmFuZ1RoYWkgPT09ICdwbGF5aW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1lbWVyYWxkLTUwMCB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzEwcHhfcmdiYSg1MiwyMTEsMTUzLDAuNCldJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncGxheWluZycgPyAnXHUyNUI2JyA6IGlkeCArIDF9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICB7cS50aHVtYiAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3EudGh1bWJ9IGFsdD1cIlwiIGNsYXNzTmFtZT1cInctMTIgaC03IHJvdW5kZWQtbWQgb2JqZWN0LWNvdmVyIHNocmluay0wIGJvcmRlciBib3JkZXItd2hpdGUvMTBcIiBsb2FkaW5nPVwibGF6eVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgbWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS0yMDAgZm9udC1ib2xkIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cS50aXRsZSB8fCBxLnZpZGVvVXJsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncGxheWluZycgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtZW1lcmFsZC00MDAgZm9udC1ib2xkXCI+XHUyNUNGIFx1MDExMGFuZyBwaFx1MDBFMXQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5UaFx1MDBFQW0gYlx1MUVERmk6IHtxLmFkZGVkQnkgfHwgJ1RoXHUwMEUwbmggdmlcdTAwRUFuJ308L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncXVldWVkJyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlBoXHUwMEUxdCB2aWRlbyBuXHUwMEUweSBuZ2F5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgncGxheV9ub3cnLCB7IGlkOiBxLmlkIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBob3ZlcjpiZy1bIzAwRjJGRV0vMzAgdGV4dC14cyBmb250LWJsYWNrIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYgUGhcdTAwRTF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJYXHUwMEYzYSBraFx1MUVDRmkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdyZW1vdmUnLCB7IGlkOiBxLmlkIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTcgaC03IHJvdW5kZWQtbGcgYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTMwMCBob3ZlcjpiZy1yb3NlLTUwMC8yNSB0ZXh0LXhzIGZvbnQtYmxhY2sgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC8+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuICAgIDwvZGl2PlxuXG4gICk7XG59XG5cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENvbXBvbmVudDogQ2FtcHVzIEZvY3VzIFJvb20gKFN0dWR5IENhZlx1MDBFOSAmIFBvbW9kb3JvIFNlc3Npb24pIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuZXhwb3J0IGZ1bmN0aW9uIENhbXB1c0ZvY3VzUm9vbSh7XG4gIHBob25nLFxuICBwaG9uZ01pbmhLaG9hLFxuICBhdXRoLFxuICBkb25nUGhvbmdIaWVuVGFpLFxuICBzb05ndW9pLFxuICBpc0ZvY3VzTW9kZSxcbiAgc2V0SXNGb2N1c01vZGVcbn0pIHtcbiAgY29uc3QgW2ZvY3VzU3RhdGUsIHNldEZvY3VzU3RhdGVdID0gdXNlU3RhdGUoe1xuICAgIHBoYXNlOiAnZm9jdXMnLFxuICAgIHN0YXR1czogJ3BhdXNlZCcsXG4gICAgZHVyYXRpb25TZWNvbmRzOiAxNTAwLFxuICAgIHJlbWFpbmluZ1NlY29uZHM6IDE1MDAsXG4gICAgcHJlc2V0OiAnMjVfNScsXG4gICAgcmV2aXNpb246IDEsXG4gICAgY2FuQ29udHJvbDogZmFsc2UsXG4gICAgdXBkYXRlZEF0OiBudWxsLFxuICAgIHNlcnZlck5vdzogbnVsbFxuICB9KTtcbiAgY29uc3QgW2xvY2FsUmVtYWluaW5nLCBzZXRMb2NhbFJlbWFpbmluZ10gPSB1c2VTdGF0ZSgxNTAwKTtcbiAgY29uc3QgW2RhbmdHdWlMZW5oLCBzZXREYW5nR3VpTGVuaF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2ksIHNldExvaV0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gQXVkaW8gc3RhdGUgKEFtYmllbnQgcGxheWJhY2spXG4gIGxldCBjYXVIaW5oID0ge307XG4gIHRyeSB7IGNhdUhpbmggPSBwaG9uZy5jYXVIaW5oID8gSlNPTi5wYXJzZShwaG9uZy5jYXVIaW5oKSA6IHt9OyB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgKi8gfVxuICBjb25zdCBuaGFjVXJsID0gY2F1SGluaC5uaGFjVXJsID8gdXJsTWVkaWFGZShjYXVIaW5oLm5oYWNVcmwpIDogJyc7XG4gIGNvbnN0IGF1ZGlvUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBbYXVkaW9QbGF5aW5nLCBzZXRBdWRpb1BsYXlpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbYXVkaW9Wb2x1bWUsIHNldEF1ZGlvVm9sdW1lXSA9IHVzZVN0YXRlKDAuNSk7XG4gIGNvbnN0IFthdWRpb011dGVkLCBzZXRBdWRpb011dGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2hhc0ludGVyYWN0ZWRBdWRpbywgc2V0SGFzSW50ZXJhY3RlZEF1ZGlvXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICAvLyBBdXRob3JpemF0aW9uXG4gIGNvbnN0IFtjYW5Db250cm9sLCBzZXRDYW5Db250cm9sXSA9IHVzZVN0YXRlKEJvb2xlYW4oYXV0aC51c2VyPy5pc1RlYWNoZXIgfHwgcGhvbmc/LmNhbkNvbnRyb2wgfHwgcGhvbmc/LmxhQ2h1UGhvbmcpKTtcbiAgY29uc3QgaXNIb3N0ID0gY2FuQ29udHJvbDtcblxuICAvLyBTeW5jIHN0YXRlIHJlY29uY2lsaWF0aW9uIGhlbHBlclxuICBjb25zdCBhcER1bmdGb2N1c1N0YXRlID0gKHN0KSA9PiB7XG4gICAgaWYgKCFzdCkgcmV0dXJuO1xuICAgIHNldEZvY3VzU3RhdGUoc3QpO1xuICAgIGNvbnN0IHJlbSA9IE51bWJlcihzdC5yZW1haW5pbmdTZWNvbmRzID8/IDE1MDApO1xuICAgIHNldExvY2FsUmVtYWluaW5nKHJlbSk7XG4gIH07XG5cbiAgLy8gMS4gUG9sbGluZyBGb2N1cyBTdGF0ZSAoZXZlcnkgMzAwMG1zKSB3aXRoIHZpc2liaWxpdHkgcmVjb25jaWxpYXRpb24gJiBzdHJpY3QgY2xlYW51cFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuXG4gICAgY29uc3QgZmV0Y2hGb2N1cyA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWZvY3VzP3Bob25nSWQ9JHtlbmNvZGVVUklDb21wb25lbnQocGhvbmcuaWQpfWApO1xuICAgICAgICBpZiAoIXJlcy5vaykgcmV0dXJuO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBkLm9rICYmIGQuc3RhdGUpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGQuY2FuQ29udHJvbCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBzZXRDYW5Db250cm9sKGQuY2FuQ29udHJvbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGFwRHVuZ0ZvY3VzU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvKiBiXHUxRUNGIHF1YSBraGkgaFx1MUVFN3kga1x1MUVCRnQgblx1MUVEMWkgKi9cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZmV0Y2hGb2N1cygpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoZmV0Y2hGb2N1cywgMzAwMCk7XG5cbiAgICBjb25zdCBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlID0gKCkgPT4ge1xuICAgICAgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnICYmIGFjdGl2ZSkge1xuICAgICAgICBmZXRjaEZvY3VzKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlKTtcbiAgICB9O1xuICB9LCBbcGhvbmcuaWRdKTtcblxuICAvLyAyLiBMb2NhbCBDb3VudGRvd24gVGljayAoZXZlcnkgMTAwMG1zIHdoZW4gc3RhdHVzID09PSAncnVubmluZycpXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGZvY3VzU3RhdGUuc3RhdHVzICE9PSAncnVubmluZycpIHJldHVybjtcbiAgICBjb25zdCB0aWNrID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgc2V0TG9jYWxSZW1haW5pbmcociA9PiBNYXRoLm1heCgwLCByIC0gMSkpO1xuICAgIH0sIDEwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpY2spO1xuICB9LCBbZm9jdXNTdGF0ZS5zdGF0dXNdKTtcblxuICAvLyAzLiBDb21tYW5kIGRpc3BhdGNoZXIgd2l0aCBvcHRpbWlzdGljIGNvbmN1cnJlbmN5IChyZXZpc2lvbiBjaGVjayAmIGNvbmZsaWN0IGhhbmRsaW5nKVxuICBjb25zdCBndWlMZW5oID0gYXN5bmMgKGFjdGlvbiwgZXh0cmFQYXlsb2FkID0ge30pID0+IHtcbiAgICBpZiAoZGFuZ0d1aUxlbmgpIHJldHVybjtcbiAgICBzZXREYW5nR3VpTGVuaCh0cnVlKTtcbiAgICBzZXRMb2koJycpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWZvY3VzJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICBhY3Rpb24sXG4gICAgICAgICAgZXhwZWN0ZWRSZXZpc2lvbjogZm9jdXNTdGF0ZS5yZXZpc2lvbixcbiAgICAgICAgICAuLi5leHRyYVBheWxvYWRcbiAgICAgICAgfSlcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIGQuc3RhdGUpIHtcbiAgICAgICAgYXBEdW5nRm9jdXNTdGF0ZShkLnN0YXRlKTtcbiAgICAgIH0gZWxzZSBpZiAocmVzLnN0YXR1cyA9PT0gNDA5ICYmIGQuc3RhdGUpIHtcbiAgICAgICAgLy8gQ29uY3VycmVuY3kgY29uZmxpY3Q6IGFkb3B0IGxhdGVzdCBzZXJ2ZXIgc3RhdGVcbiAgICAgICAgYXBEdW5nRm9jdXNTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgc2V0TG9pKCdcdTAxMTBcdTAwRTMgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBsXHUxRUExaSBwaGlcdTAwRUFuIHRoZW8gbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRMb2koZC5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgY1x1MUVBRHAgbmhcdTFFQUR0IHRyXHUxRUExbmcgdGhcdTAwRTFpIHBoXHUwMEYybmcgaFx1MUVDRGMgdFx1MUVBRHAuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRMb2koJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXREYW5nR3VpTGVuaChmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIDQuIEFtYmllbnQgQXVkaW8gQ29udHJvbHNcbiAgY29uc3QgYmF0QW1UaGFuaCA9ICgpID0+IHtcbiAgICBzZXRIYXNJbnRlcmFjdGVkQXVkaW8odHJ1ZSk7XG4gICAgaWYgKGF1ZGlvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGF1ZGlvUmVmLmN1cnJlbnQucGxheSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBzZXRBdWRpb1BsYXlpbmcodHJ1ZSk7XG4gICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0F1dG9wbGF5IGJsb2NrZWQgb3IgYXVkaW8gbG9hZCBlcnJvcjonLCBlcnIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHRvZ2dsZUF1ZGlvUGxheSA9ICgpID0+IHtcbiAgICBpZiAoIWF1ZGlvUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICBpZiAoYXVkaW9QbGF5aW5nKSB7XG4gICAgICBhdWRpb1JlZi5jdXJyZW50LnBhdXNlKCk7XG4gICAgICBzZXRBdWRpb1BsYXlpbmcoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBiYXRBbVRoYW5oKCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHRvZ2dsZUF1ZGlvTXV0ZSA9ICgpID0+IHtcbiAgICBpZiAoIWF1ZGlvUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICBjb25zdCBuZXdNdXRlID0gIWF1ZGlvTXV0ZWQ7XG4gICAgYXVkaW9SZWYuY3VycmVudC5tdXRlZCA9IG5ld011dGU7XG4gICAgc2V0QXVkaW9NdXRlZChuZXdNdXRlKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVWb2x1bWVDaGFuZ2UgPSAoZSkgPT4ge1xuICAgIGNvbnN0IHZhbCA9IHBhcnNlRmxvYXQoZS50YXJnZXQudmFsdWUpO1xuICAgIHNldEF1ZGlvVm9sdW1lKHZhbCk7XG4gICAgaWYgKGF1ZGlvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGF1ZGlvUmVmLmN1cnJlbnQudm9sdW1lID0gdmFsO1xuICAgICAgaWYgKHZhbCA+IDAgJiYgYXVkaW9NdXRlZCkge1xuICAgICAgICBhdWRpb1JlZi5jdXJyZW50Lm11dGVkID0gZmFsc2U7XG4gICAgICAgIHNldEF1ZGlvTXV0ZWQoZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBjb25zdCBpc0JyZWFrID0gZm9jdXNTdGF0ZS5waGFzZSA9PT0gJ2JyZWFrJztcbiAgY29uc3QgaXNSdW5uaW5nID0gZm9jdXNTdGF0ZS5zdGF0dXMgPT09ICdydW5uaW5nJztcbiAgY29uc3QgZHVyYXRpb24gPSBmb2N1c1N0YXRlLmR1cmF0aW9uU2Vjb25kcyB8fCAoaXNCcmVhayA/IDMwMCA6IDE1MDApO1xuICBjb25zdCBwcm9ncmVzc1BlcmNlbnQgPSBNYXRoLm1pbigxMDAsIE1hdGgubWF4KDAsICgoZHVyYXRpb24gLSBsb2NhbFJlbWFpbmluZykgLyBkdXJhdGlvbikgKiAxMDApKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtNCBtaW4tdy0wIHctZnVsbFwiPlxuICAgICAgey8qIEhpZGRlbiBBdWRpbyBlbGVtZW50IGZvciBhbWJpZW50IHNvdW5kdHJhY2sgKi99XG4gICAgICB7bmhhY1VybCAmJiAoXG4gICAgICAgIDxhdWRpb1xuICAgICAgICAgIHJlZj17YXVkaW9SZWZ9XG4gICAgICAgICAgc3JjPXtuaGFjVXJsfVxuICAgICAgICAgIGxvb3BcbiAgICAgICAgICBwcmVsb2FkPVwibm9uZVwiXG4gICAgICAgICAgb25FbmRlZD17KCkgPT4gc2V0QXVkaW9QbGF5aW5nKGZhbHNlKX1cbiAgICAgICAgICBvbkVycm9yPXsoKSA9PiBzZXRBdWRpb1BsYXlpbmcoZmFsc2UpfVxuICAgICAgICAvPlxuICAgICAgKX1cblxuICAgICAgey8qIEhlYWRlciBiYXI6IFByZXNlbmNlLCBIb3N0IGJhZGdlLCBGb2N1cyBNb2RlIHRvZ2dsZSwgQ2xvc2UgUm9vbSAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC00IGZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMgc2hhZG93LWxnXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1mdWxsIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBib3JkZXIgJHtwaG9uZy5waGFtVmkgPT09ICd0cnVvbmcnID8gJ2JnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC00MDAgYm9yZGVyLWVtZXJhbGQtNTAwLzMwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICB7cGhvbmcucGhhbVZpID09PSAndHJ1b25nJyA/ICdcdUQ4M0NcdURGMTAgVG9cdTAwRTBuIHRyXHUwMUIwXHUxRUREbmcnIDogYFx1RDgzRFx1REQxMiBMXHUxRURCcCAke3Bob25nLmxvcFRlbiB8fCAnJ31gfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBpZD1cImZvY3VzLWhvc3QtYmFkZ2VcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgQ2hcdTFFRTcgcGhcdTAwRjJuZzogPHN0cm9uZyBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTIwMFwiPntwaG9uZy5jaHVQaG9uZ1Rlbn08L3N0cm9uZz5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gaWQ9XCJmb2N1cy1yb29tLXByZXNlbmNlXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gcHgtMi41IHB5LTAuNSByb3VuZGVkLWZ1bGwgYmctWyMwMEYyRkVdLzEwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzIwIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgIFx1RDgzRFx1REM2NSB7c29OZ3VvaSB8fCAxfSBuZ1x1MDFCMFx1MUVERGkgXHUwMTExYW5nIGNcdTAwRjluZyB0XHUxRUFEcCB0cnVuZ1xuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtbC1hdXRvXCI+XG4gICAgICAgICAge2lzRm9jdXNNb2RlICYmIChcbiAgICAgICAgICAgIDxzcGFuIGlkPVwiZm9jdXMtbW9kZS1hY3RpdmUtaW5kaWNhdG9yXCIgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtcHVycGxlLTQwMCBiZy1wdXJwbGUtNTAwLzEwIHB4LTIgcHktMC41IHJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLXB1cnBsZS01MDAvMjAgYW5pbWF0ZS1wdWxzZVwiPlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGQUYgXHUwMTEwYW5nIGJcdTFFQUR0IEZvY3VzIE1vZGVcbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICApfVxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLW1vZGUtdG9nZ2xlXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNGb2N1c01vZGUoIWlzRm9jdXNNb2RlKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMS41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHtpc0ZvY3VzTW9kZSA/ICdiZy1wdXJwbGUtNTAwLzIwIHRleHQtcHVycGxlLTMwMCBib3JkZXItcHVycGxlLTUwMC80MCBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMTY4LDg1LDI0NywwLjMpXScgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkFGPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+e2lzRm9jdXNNb2RlID8gJ1x1MjFBOSBUaG9cdTAwRTF0IEZvY3VzIE1vZGUnIDogJ0ZvY3VzIE1vZGUnfTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIHtjYW5Db250cm9sICYmIHBob25nLmNodVBob25nS2hvYSAhPT0gJ2hlLXRob25nJyAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXtkb25nUGhvbmdIaWVuVGFpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzE1IGhvdmVyOmJnLXJvc2UtNTAwLzI1IHRleHQtcm9zZS0zMDAgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICBcdTAxMTBcdTAwRjNuZyBwaFx1MDBGMm5nXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogTWFpbiBGb2N1cyBDZW50ZXJwaWVjZSBDYXJkICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9e2ByZWxhdGl2ZSBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC0zeGwgYm9yZGVyIHRyYW5zaXRpb24tYWxsIHAtNiBzbTpwLTggZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgdGV4dC1jZW50ZXIgc2hhZG93LTJ4bCAke2lzQnJlYWsgPyAnYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMUUxNzEwXSB0by1bIzEzMTEwRV0gYm9yZGVyLWFtYmVyLTUwMC8zMCcgOiAnYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMEYxRTI4XSB0by1bIzBBMTIxOV0gYm9yZGVyLVsjMDBGMkZFXS8zMCd9YH0+XG4gICAgICAgIHsvKiBHbG93IGJhY2tkcm9wIGFjY2VudCAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BhYnNvbHV0ZSAtdG9wLTI0IC1sZWZ0LTI0IHctNzIgaC03MiByb3VuZGVkLWZ1bGwgYmx1ci0zeGwgb3BhY2l0eS0yMCBwb2ludGVyLWV2ZW50cy1ub25lICR7aXNCcmVhayA/ICdiZy1hbWJlci01MDAnIDogJ2JnLVsjMDBGMkZFXSd9YH0gLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BhYnNvbHV0ZSAtYm90dG9tLTI0IC1yaWdodC0yNCB3LTcyIGgtNzIgcm91bmRlZC1mdWxsIGJsdXItM3hsIG9wYWNpdHktMjAgcG9pbnRlci1ldmVudHMtbm9uZSAke2lzQnJlYWsgPyAnYmctb3JhbmdlLTUwMCcgOiAnYmctaW5kaWdvLTUwMCd9YH0gLz5cblxuICAgICAgICB7LyogUGhhc2UgJiBTdGF0dXMgQmFkZ2VzICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMi41IG1iLTYgei0xMFwiPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBpZD1cImZvY3VzLXBoYXNlLWJhZGdlXCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtZXh0cmFib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciBib3JkZXIgc2hhZG93LXNtICR7aXNCcmVhayA/ICdiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC80MCcgOiAnYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlci1bIzAwRjJGRV0vNDAnfWB9PlxuICAgICAgICAgICAge2lzQnJlYWsgPyAnXHUyNjE1IEdpXHUxRUREIE5naFx1MUVDOSBOZ1x1MDFBMWkgKEJyZWFrKScgOiAnXHVEODNDXHVERjQ1IFBoaVx1MDBFQW4gVFx1MUVBRHAgVHJ1bmcgKEZvY3VzKSd9XG4gICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGlkPVwiZm9jdXMtc3RhdHVzLWJhZGdlXCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHtpc1J1bm5pbmcgPyAnYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTQwMCBib3JkZXItZW1lcmFsZC01MDAvMzAnIDogJ2JnLXNsYXRlLTUwMC8xNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItc2xhdGUtNTAwLzMwJ31gfT5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHctMiBoLTIgcm91bmRlZC1mdWxsICR7aXNSdW5uaW5nID8gJ2JnLWVtZXJhbGQtNDAwIGFuaW1hdGUtcHVsc2UnIDogJ2JnLXNsYXRlLTQwMCd9YH0gLz5cbiAgICAgICAgICAgIDxzcGFuPntpc1J1bm5pbmcgPyAnXHUwMTEwYW5nIFx1MDExMVx1MUVCRm0nIDogJ1RcdTFFQTFtIGRcdTFFRUJuZyd9PC9zcGFuPlxuICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXByZXNldC10b2dnbGVcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBkaXNhYmxlZD17IWNhbkNvbnRyb2wgfHwgZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBjYW5Db250cm9sICYmIGd1aUxlbmgoJ3NldF9wcmVzZXQnLCB7IHByZXNldDogZm9jdXNTdGF0ZS5wcmVzZXQgPT09ICc1MF8xMCcgPyAnMjVfNScgOiAnNTBfMTAnIH0pfVxuICAgICAgICAgICAgdGl0bGU9e2NhbkNvbnRyb2wgPyAnQlx1MUVBNW0gXHUwMTExXHUxRUMzIFx1MDExMVx1MUVENWkgY2h1IGtcdTFFRjMgUG9tb2Rvcm8nIDogJ0NodSBrXHUxRUYzIFBvbW9kb3JvIGhpXHUxRUM3biB0XHUxRUExaSd9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEgcm91bmRlZC1mdWxsIHRleHQteHMgZm9udC1tb25vIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtjYW5Db250cm9sID8gJ2hvdmVyOnNjYWxlLTEwNSBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXIgYmctd2hpdGUvMTAgdGV4dC13aGl0ZSBib3JkZXItd2hpdGUvMjAnIDogJ2N1cnNvci1kZWZhdWx0IGJnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgIFx1MjY5OVx1RkUwRiB7Zm9jdXNTdGF0ZS5wcmVzZXQgPT09ICc1MF8xMCcgPyAnNTAgLyAxMCBwaFx1MDBGQXQnIDogJzI1IC8gNSBwaFx1MDBGQXQnfVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogTWFzc2l2ZSBUaW1lciBEaXNwbGF5ICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm15LTIgc206bXktNCB6LTEwXCI+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGlkPVwiZm9jdXMtdGltZXItZGlzcGxheVwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2Bmb250LW1vbm8gdGV4dC02eGwgc206dGV4dC04eGwgZm9udC1ibGFjayB0cmFja2luZy13aWRlc3QgYmxvY2sgdHJhbnNpdGlvbi1hbGwgc2VsZWN0LW5vbmUgJHtpc0JyZWFrID8gJ3RleHQtYW1iZXItMzAwIGRyb3Atc2hhZG93LVswXzBfMzVweF9yZ2JhKDI0NSwxNTgsMTEsMC4zNSldJyA6ICd0ZXh0LVsjMDBGMkZFXSBkcm9wLXNoYWRvdy1bMF8wXzM1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldJ31gfT5cbiAgICAgICAgICAgIHtkaW5oRGFuZ0dpYXlQaHV0KGxvY2FsUmVtYWluaW5nKX1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBQcm9ncmVzcyBiYXIgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIG1heC13LW1kIGgtMiBiZy1ibGFjay80MCByb3VuZGVkLWZ1bGwgb3ZlcmZsb3ctaGlkZGVuIGJvcmRlciBib3JkZXItd2hpdGUvMTAgbXktNCB6LTEwXCI+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgaC1mdWxsIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTEwMDAgJHtpc0JyZWFrID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tb3JhbmdlLTUwMCcgOiAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzNCODJGNl0nfWB9XG4gICAgICAgICAgICBzdHlsZT17eyB3aWR0aDogYCR7cHJvZ3Jlc3NQZXJjZW50fSVgIH19XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIENvbnRyb2wgQnV0dG9ucyBmb3IgSG9zdC9UZWFjaGVyICovfVxuICAgICAgICB7Y2FuQ29udHJvbCA/IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMyBtdC00IHotMTBcIj5cbiAgICAgICAgICAgIHshaXNSdW5uaW5nID8gKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtc3RhcnRcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdzdGFydCcpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMyByb3VuZGVkLTJ4bCBiZy1ncmFkaWVudC10by1yIGZyb20tZW1lcmFsZC00MDAgdG8tdGVhbC01MDAgaG92ZXI6ZnJvbS1lbWVyYWxkLTMwMCBob3Zlcjp0by10ZWFsLTQwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC1zbSBzaGFkb3ctWzBfMF8yMHB4X3JnYmEoNTIsMjExLDE1MywwLjMpXSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjVCNjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5CXHUxRUFGdCBcdTAxMTFcdTFFQTd1PC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1wYXVzZVwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3BhdXNlJyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNiBweS0zIHJvdW5kZWQtMnhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tb3JhbmdlLTUwMCBob3Zlcjpmcm9tLWFtYmVyLTMwMCBob3Zlcjp0by1vcmFuZ2UtNDAwIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXNtIHNoYWRvdy1bMF8wXzIwcHhfcmdiYSgyNTEsMTkxLDM2LDAuMyldIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyM0Y4PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlRcdTFFQTFtIGRcdTFFRUJuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXJlc2V0XCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgncmVzZXQnKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0zIHJvdW5kZWQtMnhsIGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzE1IHRleHQtc2xhdGUtMjAwIHRleHQtc20gZm9udC1ib2xkIGJvcmRlciBib3JkZXItd2hpdGUvMTUgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMDQ8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MDExMFx1MUVCN3QgbFx1MUVBMWk8L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAge2lzQnJlYWsgPyAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1zdGFydC1mb2N1c1wiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3N0YXJ0X2ZvY3VzJyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0zIHJvdW5kZWQtMnhsIGJnLVsjMDBGMkZFXS8yMCBob3ZlcjpiZy1bIzAwRjJGRV0vMzAgdGV4dC1bIzAwRjJGRV0gdGV4dC1zbSBmb250LWJvbGQgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REZBRjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5WXHUwMEUwbyBUXHUxRUFEcCB0cnVuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtc3RhcnQtYnJlYWtcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdzdGFydF9icmVhaycpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMyByb3VuZGVkLTJ4bCBiZy1hbWJlci01MDAvMjAgaG92ZXI6YmctYW1iZXItNTAwLzMwIHRleHQtYW1iZXItMzAwIHRleHQtc20gZm9udC1ib2xkIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzQwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTI2MTU8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+TmdoXHUxRUM5IG5nXHUwMUExaTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDAgbXQtMyB6LTEwXCI+XG4gICAgICAgICAgICBcdTIzRjMgXHUwMTEwXHUxRUQzbmcgaFx1MUVEMyBQb21vZG9ybyBkbyBjaFx1MUVFNyBwaFx1MDBGMm5nIFx1MDExMWlcdTFFQzF1IHBoXHUxRUQxaSBcdTIwMTQgaFx1MDBFM3kgdFx1MUVBRHAgdHJ1bmcgaFx1MUVCRnQgbVx1MDBFQ25oIHZcdTAwRTBvIGNcdTAwRjRuZyB2aVx1MUVDN2MvaFx1MUVDRGMgdFx1MUVBRHAgbmhcdTAwRTkhXG4gICAgICAgICAgPC9wPlxuICAgICAgICApfVxuXG4gICAgICAgIHtsb2kgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXJvc2UtNDAwIG10LTQgei0xMFwiPntsb2l9PC9wPn1cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQW1iaWVudCBBdWRpbyBQbGF5ZXIgQ2FyZCAqL31cbiAgICAgIHtuaGFjVXJsID8gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNCBzbTpwLTUgZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHNoYWRvdy14bFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMuNSBtaW4tdy0wIHctZnVsbCBzbTp3LWF1dG9cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgdy0xMiBoLTEyIHJvdW5kZWQtMnhsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteGwgc2hyaW5rLTAgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7YXVkaW9QbGF5aW5nID8gJ2JnLVsjOEI1Q0Y2XS8yMCB0ZXh0LVsjOEI1Q0Y2XSBib3JkZXItWyM4QjVDRjZdLzQwIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgxMzksOTIsMjQ2LDAuMyldIGFuaW1hdGUtcHVsc2UnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAgXHVEODNDXHVERkE3XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLXctMFwiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIHRydW5jYXRlXCI+XHUwMEMybSB0aGFuaCBuXHUxRUMxbiBBbWJpZW50PC9wPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgIHthdWRpb1BsYXlpbmcgPyAnXHUwMTEwYW5nIHBoXHUwMEUxdCBraFx1MDBGNG5nIGdpYW4gaFx1MUVDRGMgdFx1MUVBRHAnIDogJ1x1MDBDMm0gdGhhbmggY1x1MUVFNWMgYlx1MUVEOSB0aGVvIHRoaVx1MUVCRnQgYlx1MUVDQid9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIgZ2FwLTMgdy1mdWxsIHNtOnctYXV0byBqdXN0aWZ5LWVuZFwiPlxuICAgICAgICAgICAgeyFoYXNJbnRlcmFjdGVkQXVkaW8gJiYgIWF1ZGlvUGxheWluZyAmJiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1zdGFydC1mb2N1cy1hdWRpb1wiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17YmF0QW1UaGFuaH1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1yIGZyb20tWyM4QjVDRjZdIHRvLVsjNjM2NkYxXSB0ZXh0LXdoaXRlIHRleHQteHMgZm9udC1ib2xkIHNoYWRvdy1sZyBob3ZlcjpvcGFjaXR5LTkwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5CXHUxRUFEdCBcdTAwRTJtIHRoYW5oIHRcdTFFQURwIHRydW5nPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJmb2N1cy1hdWRpby10b2dnbGVcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlQXVkaW9QbGF5fVxuICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7YXVkaW9QbGF5aW5nID8gJ2JnLVsjOEI1Q0Y2XS8yMCB0ZXh0LVsjOEI1Q0Y2XSBib3JkZXItWyM4QjVDRjZdLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtMzAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICAgIDxzcGFuPnthdWRpb1BsYXlpbmcgPyAnXHUyM0Y4IFRcdTFFQTFtIGRcdTFFRUJuZycgOiAnXHUyNUI2IFBoXHUwMEUxdCB0aVx1MUVCRnAnfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVBdWRpb011dGV9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiByb3VuZGVkLXhsIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXhzIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgIHthdWRpb011dGVkIHx8IGF1ZGlvVm9sdW1lID09PSAwID8gJ1x1RDgzRFx1REQwNycgOiAnXHVEODNEXHVERDA5J31cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgdHlwZT1cInJhbmdlXCJcbiAgICAgICAgICAgICAgbWluPVwiMFwiXG4gICAgICAgICAgICAgIG1heD1cIjFcIlxuICAgICAgICAgICAgICBzdGVwPVwiMC4wNVwiXG4gICAgICAgICAgICAgIHZhbHVlPXthdWRpb011dGVkID8gMCA6IGF1ZGlvVm9sdW1lfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17aGFuZGxlVm9sdW1lQ2hhbmdlfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTI0IGgtMS41IGJnLXdoaXRlLzEwIHJvdW5kZWQtbGcgYXBwZWFyYW5jZS1ub25lIGN1cnNvci1wb2ludGVyIGFjY2VudC1bIzhCNUNGNl1cIlxuICAgICAgICAgICAgICB0aXRsZT1cIlx1MDBDMm0gbFx1MDFCMFx1MUVFM25nIG5oXHUxRUExYyBuXHUxRUMxblwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICkgOiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLTJ4bCBwLTQgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMFwiPlxuICAgICAgICAgICAgXHUyNjE1IFBoXHUwMEYybmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSB0XHUwMTI5bmggbFx1MUVCN25nIChjaFx1MDFCMGEgZ1x1MUVBRm4gbGluayBcdTAwRTJtIHRoYW5oIG5cdTFFQzFuKSBcdTIwMTQgQ2h1eVx1MDBFQW4gdFx1MDBFMm0gdFx1MUVEMWkgXHUwMTExYSB2XHUwMEUwbyBiXHUwMEUwaSB2XHUxRURGLlxuICAgICAgICAgIDwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7cGhvbmcubW9UYSAmJiAoXG4gICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIHB4LTIgbGVhZGluZy1yZWxheGVkXCI+XG4gICAgICAgICAge3Bob25nLm1vVGF9XG4gICAgICAgIDwvcD5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiQUFBQSxNQUFNLEVBQUUsVUFBVSxXQUFXLE9BQU8sSUFBSTtBQUN4QyxTQUFTLGtCQUFrQixlQUFlLFdBQVcsbUJBQW1CLHFCQUFxQixrQkFBa0I7QUFLL0csTUFBTSxhQUFhLENBQUMsT0FBTyxNQUFNO0FBQUUsTUFBSSxTQUFTLG9CQUFvQixVQUFXLElBQUc7QUFBRztBQUk5RSxnQkFBUyxXQUFXLEVBQUUsT0FBTyxVQUFVLEdBQUc7QUFDL0MsUUFBTSxDQUFDLEdBQUcsSUFBSSxJQUFJLE1BQU0sU0FBUyxFQUFFO0FBQ25DLFFBQU0sS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTO0FBQzdCLFNBQ0Usb0NBQUMsU0FBSSxXQUFVLCtCQUNiO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFLO0FBQUEsTUFDTCxPQUFPO0FBQUEsTUFDUCxVQUFVLE9BQUssS0FBSyxFQUFFLE9BQU8sS0FBSztBQUFBLE1BQ2xDLFdBQVcsT0FBSztBQUFFLFlBQUksRUFBRSxRQUFRLFdBQVcsSUFBSTtBQUFFLFlBQUUsZUFBZTtBQUFHLGdCQUFNLEVBQUUsS0FBSyxDQUFDO0FBQUcsZUFBSyxFQUFFO0FBQUEsUUFBRztBQUFBLE1BQUU7QUFBQSxNQUNsRyxhQUFZO0FBQUEsTUFDWixXQUFVO0FBQUE7QUFBQSxFQUNaLEdBQ0E7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUFPLE1BQUs7QUFBQSxNQUFTLElBQUc7QUFBQSxNQUFxQixVQUFVLENBQUM7QUFBQSxNQUN2RCxTQUFTLE1BQU07QUFBRSxrQkFB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
