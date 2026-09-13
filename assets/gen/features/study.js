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
  canControl = false,
  dongPhongHienTai
}) {
  const [dockTab, setDockTab] = React.useState("chat");
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
  const [videoMoi, setVideoMoi] = React.useState("");
  const [dangDoiVideo, setDangDoiVideo] = React.useState(false);
  const [configLoi, setConfigLoi] = React.useState("");
  const [queueList, setQueueList] = React.useState([]);
  const [queueBusy, setQueueBusy] = React.useState(false);
  const taiQueue = async () => {
    try {
      const res = await fetch(`/api/phong-queue?phongId=${phong.id}&action=list`);
      const d = await res.json();
      if (d.ok) setQueueList(d.queue || []);
    } catch {
    }
  };
  React.useEffect(() => {
    if (dockTab === "config") {
      taiQueue();
      const timer = setInterval(khiHienThi(taiQueue), 4e3);
      return () => clearInterval(timer);
    }
  }, [dockTab, phong.id]);
  const doiVideo = async (url) => {
    const u = String(url || videoMoi || "").trim();
    if (!u || dangDoiVideo) return;
    setDangDoiVideo(true);
    setConfigLoi("");
    try {
      const res = await fetch("/api/phong-watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phongId: phong.id, action: "set_video", videoUrl: u })
      });
      const d = await res.json();
      if (!d.ok) {
        setConfigLoi(d.loi || "Kh\xF4ng \u0111\u1ED5i \u0111\u01B0\u1EE3c video.");
      } else {
        setVideoMoi("");
      }
    } catch {
      setConfigLoi("M\u1EA5t k\u1EBFt n\u1ED1i m\xE1y ch\u1EE7.");
    } finally {
      setDangDoiVideo(false);
    }
  };
  const hanhDongQueue = async (action, extra = {}) => {
    if (queueBusy) return;
    setQueueBusy(true);
    try {
      const res = await fetch("/api/phong-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phongId: phong.id, action, ...extra })
      });
      const d = await res.json();
      if (!d.ok) setConfigLoi(d.loi || "Thao t\xE1c h\xE0ng \u0111\u1EE3i th\u1EA5t b\u1EA1i.");
      else await taiQueue();
    } catch {
      setConfigLoi("M\u1EA5t k\u1EBFt n\u1ED1i m\xE1y ch\u1EE7.");
    } finally {
      setQueueBusy(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { id: "study-dock-container", className: "bg-[#151A23] border border-white/10 rounded-2xl p-4 flex flex-col min-h-[420px] lg:min-h-[480px] shadow-xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 pb-3 border-b border-white/10 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
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
  ), (canControl || isStaff) && /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "tab-study-config",
      type: "button",
      onClick: () => setDockTab("config"),
      className: `px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${dockTab === "config" ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.35)] border border-violet-500/50" : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:scale-105"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F3A5}"),
    /* @__PURE__ */ React.createElement("span", null, "Video")
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
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col pt-3 min-h-[300px]" }, dockTab === "chat" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-h-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto space-y-3 pr-1 max-h-72 lg:max-h-[380px] xl:max-h-[440px] text-xs" }, phongChat.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 text-center py-8" }, "Ch\u01B0a c\xF3 tin nh\u1EAFn \u2014 h\xE3y g\u1EEDi c\xE2u h\u1ECFi ho\u1EB7c trao \u0111\u1ED5i v\u1EC1 b\xE0i gi\u1EA3ng!") : phongChat.map((m, idx) => /* @__PURE__ */ React.createElement("div", { key: m.id || idx, className: "text-xs group" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-1 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-300 text-[11px]" }, m.tenNguoiGui), m.vaiTro === "giao_vien" ? /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30" }, "GVCN") : m.lopTen ? /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/20" }, m.lopTen) : null, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500" }, m.taoLuc ? (/* @__PURE__ */ new Date(m.taoLuc.replace(" ", "T") + "Z")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""), m.videoTimeSec != null && m.videoTimeSec > 0 && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => yeuCauTua(m.videoTimeSec),
      title: myCaps.video_control ? "Tua video c\u1EA3 ph\xF2ng t\u1EDBi m\u1ED1c n\xE0y" : "Tua video c\u1EE7a b\u1EA1n t\u1EDBi m\u1ED1c n\xE0y",
      className: "px-1.5 py-0.2 rounded text-[9px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30"
    },
    "\u25B6 ",
    dinhDangGiayPhut(m.videoTimeSec)
  ), isStaff && /* @__PURE__ */ React.createElement(
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
  )), /* @__PURE__ */ React.createElement("p", { className: "bg-[#0B0E14] border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs leading-relaxed break-words" }, m.noiDung))), /* @__PURE__ */ React.createElement("div", { ref: chatEndRef })), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSendRoomChat, className: "pt-3 border-t border-white/10 flex items-center gap-2 mt-auto" }, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      id: "input-phong-chat",
      rows: 1,
      placeholder: coQuyen("chat") ? "Nh\u1EAFn tin trong ph\xF2ng h\u1ECDc... (tin nh\u1EAFn t\u1EF1 g\u1EAFn m\u1ED1c video hi\u1EC7n t\u1EA1i)" : "Chat \u0111ang b\u1ECB qu\u1EA3n tr\u1ECB ph\xF2ng kh\xF3a",
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
      className: "flex-1 bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/60 resize-none min-h-[38px] max-h-24 disabled:opacity-40"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      id: "btn-send-phong-chat",
      disabled: !chatInput.trim() || chatSending || !coQuyen("chat"),
      className: "px-4 py-2 rounded-xl bg-[#00F2FE] hover:bg-[#00e1ec] text-black text-xs font-black transition-all disabled:opacity-30 shrink-0"
    },
    "G\u1EEDi"
  ))), dockTab === "notes" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] text-slate-400" }, /* @__PURE__ */ React.createElement("span", null, "Ghi ch\xFA chung c\u1EE7a ph\xF2ng \u2014 m\u1ED7i ng\u01B0\u1EDDi th\xEAm m\u1ED9t d\xF2ng, c\xF3 th\u1EC3 g\u1EAFn m\u1ED1c video"), notesNotice && /* @__PURE__ */ React.createElement("span", { className: "text-rose-300 font-bold" }, notesNotice)), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto space-y-2 pr-1 max-h-64 min-h-[180px] bg-[#0B0E14] border border-white/10 rounded-xl p-2.5" }, notesList.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 text-center py-8" }, "Ch\u01B0a c\xF3 ghi ch\xFA \u2014 th\xEAm d\xF2ng \u0111\u1EA7u ti\xEAn cho c\u1EA3 ph\xF2ng.") : notesList.map((n) => /* @__PURE__ */ React.createElement("div", { key: n.id, className: "flex items-start gap-2 group" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-slate-400" }, n.ten), n.videoTimeSec != null && n.videoTimeSec > 0 && /* @__PURE__ */ React.createElement(
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
        className: "flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all"
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
  }), thanhVien.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "text-center py-8 text-slate-500 text-xs" }, "Ch\u01B0a c\xF3 th\xE0nh vi\xEAn n\xE0o trong ph\xF2ng."))), dockTab === "config" && (canControl || isStaff) && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-3.5 overflow-y-auto max-h-80 lg:max-h-[420px] pr-1 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#0B0E14] border border-white/10 rounded-xl p-3 flex flex-col gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F3A5}"), /* @__PURE__ */ React.createElement("span", null, "\u0110\u1ED5i video \u0111ang ph\xE1t ngay")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "input-config-video-moi",
      type: "url",
      value: videoMoi,
      onChange: (e) => setVideoMoi(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter" && videoMoi.trim()) {
          e.preventDefault();
          doiVideo();
        }
      },
      placeholder: "D\xE1n link YouTube / video m\u1EDBi...",
      className: "flex-1 bg-[#151A23] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/50"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-config-doi-video",
      onClick: () => doiVideo(),
      disabled: !videoMoi.trim() || dangDoiVideo,
      className: "px-3 py-1.5 rounded-lg bg-[#00F2FE] text-black font-black text-xs hover:bg-[#00e1ec] active:scale-95 disabled:opacity-30 shrink-0"
    },
    dangDoiVideo ? "..." : "\u25B6 Ph\xE1t"
  )), configLoi && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-rose-400" }, configLoi)), /* @__PURE__ */ React.createElement("div", { className: "bg-[#0B0E14] border border-white/10 rounded-xl p-3 flex flex-col gap-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"), /* @__PURE__ */ React.createElement("span", null, "H\xE0ng \u0111\u1EE3i video (", queueList.filter((q) => q.trangThai === "queued").length, ")")), queueList.some((q) => q.trangThai === "queued") && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => hanhDongQueue("skip"),
      disabled: queueBusy,
      className: "px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold hover:bg-amber-500/25 disabled:opacity-40"
    },
    "\u23ED B\u1ECF qua / Ti\u1EBFp theo"
  )), /* @__PURE__ */ React.createElement(
    QueueInput,
    {
      onAdd: (u, t) => hanhDongQueue("enqueue", { videoUrl: u, title: t }),
      onAddNext: (u, t) => hanhDongQueue("add_next", { videoUrl: u, title: t })
    }
  ), queueList.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 py-2 text-center" }, "H\xE0ng \u0111\u1EE3i tr\u1ED1ng \u2014 th\xEAm link video \u0111\u1EC3 ph\xE1t l\u1EA7n l\u01B0\u1EE3t.") : /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5 max-h-48 overflow-y-auto pr-1" }, queueList.map((q, idx) => /* @__PURE__ */ React.createElement("div", { key: q.id || idx, className: "flex items-center gap-2 bg-[#151A23] border border-white/5 rounded-lg p-2" }, /* @__PURE__ */ React.createElement("span", { className: `w-5 h-5 rounded flex items-center justify-center text-[10px] font-black shrink-0 ${q.trangThai === "playing" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-slate-400"}` }, q.trangThai === "playing" ? "\u25B6" : idx + 1), q.thumb && /* @__PURE__ */ React.createElement("img", { src: q.thumb, alt: "", className: "w-10 h-6 rounded object-cover shrink-0", loading: "lazy" }), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-200 font-medium truncate" }, q.title || q.videoUrl), /* @__PURE__ */ React.createElement("p", { className: "text-[9px] text-slate-500 truncate" }, "th\xEAm b\u1EDFi ", q.addedBy || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 shrink-0" }, q.trangThai === "queued" && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      title: "Ph\xE1t ngay",
      onClick: () => hanhDongQueue("play_now", { id: q.id }),
      disabled: queueBusy,
      className: "w-6 h-6 rounded bg-[#00F2FE]/15 text-[#00F2FE] text-[10px] font-black hover:bg-[#00F2FE]/25"
    },
    "\u25B6"
  ), q.trangThai === "queued" && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      title: "X\xF3a kh\u1ECFi h\xE0ng \u0111\u1EE3i",
      onClick: () => hanhDongQueue("remove", { id: q.id }),
      disabled: queueBusy,
      className: "w-6 h-6 rounded bg-rose-500/15 text-rose-300 text-[10px] font-black hover:bg-rose-500/25"
    },
    "\u2715"
  )))))), /* @__PURE__ */ React.createElement("div", { className: "bg-[#0B0E14] border border-white/10 rounded-xl p-3 flex flex-col gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] uppercase font-bold tracking-wider text-slate-400" }, "\u2699\uFE0F Thao t\xE1c ph\xF2ng"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      placeholder: "M\u1EADt kh\u1EA9u m\u1EDBi (\u0111\u1EC3 tr\u1ED1ng = b\u1ECF)",
      id: "input-config-mat-khau-moi",
      maxLength: 100,
      className: "flex-1 bg-[#151A23] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/50"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: async () => {
        const el = document.getElementById("input-config-mat-khau-moi");
        const mk = el?.value || "";
        const d = mk.trim() ? await hanhDongPhong?.("doi_mat_khau", { matKhauMoi: mk.trim() }) : await hanhDongPhong?.("bo_mat_khau", {});
        if (d && !d.ok) alert(d.loi || "Kh\xF4ng \u0111\u1ED5i \u0111\u01B0\u1EE3c m\u1EADt kh\u1EA9u.");
        else alert("\u0110\xE3 c\u1EADp nh\u1EADt m\u1EADt kh\u1EA9u ph\xF2ng th\xE0nh c\xF4ng.");
        if (el) el.value = "";
      },
      className: "px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold hover:bg-amber-500/25 shrink-0"
    },
    "\u0110\u1ED5i MK"
  )), dongPhongHienTai && phong.chuPhongKhoa !== "he-thong" && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-config-dong-phong",
      onClick: () => {
        if (confirm("B\u1EA1n c\xF3 ch\u1EAFc ch\u1EAFn mu\u1ED1n \u0111\xF3ng ph\xF2ng h\u1ECDc n\xE0y kh\xF4ng?")) {
          dongPhongHienTai();
        }
      },
      className: "w-full py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 transition-all flex items-center justify-center gap-1.5"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F6D1}"),
    /* @__PURE__ */ React.createElement("span", null, "\u0110\xF3ng ph\xF2ng h\u1ECDc n\xE0y")
  ))), dockTab === "quan-tri" && isStaff && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-3 overflow-y-auto max-h-80 pr-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
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
  phongMinhKhoa,
  auth,
  dongPhongHienTai,
  soNguoi,
  myCaps,
  videoTimeRef,
  isRoomWide
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
  const [canControl, setCanControl] = useState(Boolean(auth?.user?.isTeacher || phong?.canControl || phong?.laChuPhong));
  const [watchCaps, setWatchCaps] = useState({});
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
  useEffect(() => {
    if (phong?.canControl || phong?.laChuPhong || auth?.user?.isTeacher) {
      setCanControl(true);
    }
  }, [phong?.canControl, phong?.laChuPhong, auth?.user?.isTeacher]);
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
  useEffect(() => {
    if (!ytId) return;
    let destroyed = false;
    let retryTimer = null;
    let attempts = 0;
    const khoiTaoPlayer = () => {
      if (destroyed) return;
      const el = document.getElementById(ytContainerId);
      if (!el) {
        if (attempts++ < 25) {
          retryTimer = setTimeout(khoiTaoPlayer, 80);
        }
        return;
      }
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
        }
        ytPlayerRef.current = null;
      }
      try {
        ytPlayerRef.current = new window.YT.Player(ytContainerId, {
          width: "100%",
          height: "100%",
          videoId: ytId,
          playerVars: {
            autoplay: 0,
            controls: canControl ? 1 : 0,
            disablekb: canControl ? 0 : 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1
          },
          events: {
            onReady: (event) => {
              if (destroyed) return;
              if (event.target.getDuration) {
                const d = event.target.getDuration();
                if (d > 0) setDuration(d);
              }
              if (watchState.playing && event.target.playVideo) {
                try {
                  event.target.playVideo();
                } catch {
                }
              }
              if (watchState.positionSeconds > 0 && event.target.seekTo) {
                try {
                  event.target.seekTo(watchState.positionSeconds, true);
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
                }
              }
            }
          }
        });
      } catch (err) {
        console.warn("L\u1ED7i kh\u1EDFi t\u1EA1o YT Player:", err);
      }
    };
    napYouTubeIframeApi(() => {
      setTimeout(khoiTaoPlayer, 50);
    });
    return () => {
      destroyed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
        }
        ytPlayerRef.current = null;
      }
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
    } else if (prov === "YOUTUBE" && ytPlayerRef.current && ytPlayerRef.current.getPlayerState) {
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
      else if (provider === "YOUTUBE" && ytPlayerRef.current?.playVideo) ytPlayerRef.current.playVideo();
    } else if (action === "pause") {
      if (provider === "NATIVE_HTML5" && videoRef.current) videoRef.current.pause();
      else if (provider === "YOUTUBE" && ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();
    } else if (action === "seek") {
      if (provider === "NATIVE_HTML5" && videoRef.current) videoRef.current.currentTime = pos;
      else if (provider === "YOUTUBE" && ytPlayerRef.current?.seekTo) ytPlayerRef.current.seekTo(pos, true);
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
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-4 min-w-0 w-full" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl" }, !hasInteracted && !canControl && (provider === "YOUTUBE" || provider === "NATIVE_HTML5") && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 z-20 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "w-14 h-14 rounded-full bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40 flex items-center justify-center text-2xl mb-3 shadow-[0_0_25px_rgba(0,242,254,0.35)] animate-pulse" }, "\u{1F3AC}"), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-black text-white mb-1" }, "Xem Chung C\xF9ng Ph\xF2ng"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-300 max-w-xs mb-4" }, "B\u1EA5m n\xFAt b\xEAn d\u01B0\u1EDBi \u0111\u1EC3 c\u1EA5p quy\u1EC1n \xE2m thanh v\xE0 c\xF9ng theo d\xF5i timeline v\u1EDBi ch\u1EE7 ph\xF2ng."), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-viewer-start-watch",
      type: "button",
      onClick: handleStartViewing,
      className: "px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#3B82F6] text-black font-black text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u25B6"),
    /* @__PURE__ */ React.createElement("span", null, "B\u1EAFt \u0111\u1EA7u xem c\xF9ng ph\xF2ng")
  )), ytId ? /* @__PURE__ */ React.createElement("div", { key: `yt-wrap-${phong.id}-${ytId}`, className: "w-full h-full flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { id: ytContainerId, className: "w-full h-full" })) : drvId ? /* @__PURE__ */ React.createElement(
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
  ) : /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center h-full text-xs text-slate-500 p-6 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl mb-2" }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "Link video kh\xF4ng h\u1ED7 tr\u1EE3 ph\xE1t tr\u1EF1c ti\u1EBFp ho\u1EB7c kh\xF4ng h\u1EE3p l\u1EC7."))), drvId && /* @__PURE__ */ React.createElement("div", { className: "px-3.5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-300" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm" }, "\u2139\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "Google Drive ph\xE1t \u1EDF ch\u1EBF \u0111\u1ED9 ", /* @__PURE__ */ React.createElement("strong", null, "Xem \u0111\u1ED9c l\u1EADp"), " (Google Drive kh\xF4ng h\u1ED7 tr\u1EE3 API \u0111i\u1EC1u khi\u1EC3n t\u1EEB xa).")), !isRoomWide && /* @__PURE__ */ React.createElement("div", { className: "bg-[#151A23] border border-white/10 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-3 shadow-xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap min-w-0" }, canControl && provider !== "GOOGLE_DRIVE" && provider !== "UNSUPPORTED" && /* @__PURE__ */ React.createElement("span", { id: "sync-state-badge", className: `text-xs font-black flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${watchState.playing ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]" : "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]"}` }, /* @__PURE__ */ React.createElement("span", { className: `w-2 h-2 rounded-full ${watchState.playing ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}` }), /* @__PURE__ */ React.createElement("span", null, watchState.playing ? "\u0110ang ph\xE1t chung" : "T\u1EA1m d\u1EEBng")), canControl && /* @__PURE__ */ React.createElement("span", { id: "host-badge", className: "text-[11px] font-black px-2.5 py-1 rounded-xl bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/40 shadow-sm flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "\u2605"), /* @__PURE__ */ React.createElement("span", null, "Ch\u1EE7 ph\xF2ng"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 shrink-0 ml-auto" }, (canControl || auth.user?.isTeacher) && phong.chuPhongKhoa !== "he-thong" && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: dongPhongHienTai,
      className: "px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 transition-all hover:scale-105 active:scale-95"
    },
    "\u0110\xF3ng ph\xF2ng"
  ))), canControl && (provider === "NATIVE_HTML5" || provider === "YOUTUBE") && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-white/10" }, /* @__PURE__ */ React.createElement(
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
  ), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono text-slate-400 shrink-0" }, duration > 0 ? dinhDangGiayPhut(duration) : "--:--"))), loi && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-400" }, loi), phong.moTa && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 leading-relaxed pt-1" }, phong.moTa)));
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvc3R1ZHkuanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9ID0gUmVhY3Q7XG5pbXBvcnQgeyBkaW5oRGFuZ0dpYXlQaHV0LCBpZEdvb2dsZURyaXZlLCBpZFlvdXR1YmUsIGxhVmlkZW9UcnVjVGllcEZlLCBuYXBZb3VUdWJlSWZyYW1lQXBpLCB1cmxNZWRpYUZlIH0gZnJvbSAnLi4vbGliL2hlbHBlcnMuanMnO1xuXG4vLyBCXHUxRUNGIHF1YSB0aWNrIGtoaSB0YWIgXHUwMTExYW5nIFx1MUVERiBOXHUxRUMwTiBcdTIwMTQgdHJcdTAwRTFuaCBjXHUxRUQ5bmcgZFx1MUVEM24gcmVxdWVzdCBDbG91ZGZsYXJlIHZcdTAwRjQgXHUwMEVEY2gga2hpIGtoXHUwMEY0bmcgYWkgeGVtLlxuLy8gS2hcdTAwRjRuZyBkXHUwMEY5bmcgY2hvIHBvbGwgdFx1MDBFRG4gaGlcdTFFQzd1IHRoXHUxRUREaSBnaWFuIHRoXHUxRUYxYyAodmQgdm9pY2Ugc2lnbmFsaW5nKSB2XHUwMEVDIGJcdTFFQ0YgbFx1MUVFMSB0aWNrIGNcdTAwRjMgdGhcdTFFQzMgbFx1MDBFMG0gdHJlb1xuLy8gYlx1MUVBRnQgdGF5IGtcdTFFQkZ0IG5cdTFFRDFpIGhvXHUxRUI3YyB0clx1MUVDNSB0XHUwMEVEbiBoaVx1MUVDN3UgXCJyXHUxRUREaSB2b2ljZVwiIGNcdTFFRTdhIG5nXHUwMUIwXHUxRUREaSBraWEuXG5jb25zdCBraGlIaWVuVGhpID0gKGZuKSA9PiAoKSA9PiB7IGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09ICd2aXNpYmxlJykgZm4oKTsgfTtcblxuXG4vLyBcdTAwRDQgbmhcdTFFQURwIGxpbmsgdGhcdTAwRUFtIHZcdTAwRTBvIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIFx1MjAxNCBkXHUwMEY5bmcgY2h1bmcgY2hvIFN0dWR5RG9jayB2XHUwMEUwIENhbXB1c1dhdGNoVG9nZXRoZXJcbmV4cG9ydCBmdW5jdGlvbiBRdWV1ZUlucHV0KHsgb25BZGQsIG9uQWRkTmV4dCB9KSB7XG4gIGNvbnN0IFt2LCBzZXRWXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3Qgb2sgPSB2LnRyaW0oKS5sZW5ndGggPiAwO1xuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgPGlucHV0XG4gICAgICAgIGlkPVwiaW5wdXQtcXVldWUtYWRkXCJcbiAgICAgICAgdHlwZT1cInVybFwiXG4gICAgICAgIHZhbHVlPXt2fVxuICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRWKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgb25LZXlEb3duPXtlID0+IHsgaWYgKGUua2V5ID09PSAnRW50ZXInICYmIG9rKSB7IGUucHJldmVudERlZmF1bHQoKTsgb25BZGQodi50cmltKCkpOyBzZXRWKCcnKTsgfSB9fVxuICAgICAgICBwbGFjZWhvbGRlcj1cIlRoXHUwMEVBbSBsaW5rIHZpZGVvIHZcdTAwRTBvIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXHUyMDI2XCJcbiAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMi41IHB5LTEuNSB0ZXh0LVsxMXB4XSB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MFwiXG4gICAgICAvPlxuICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJidG4tcXVldWUtYWRkLW5leHRcIiBkaXNhYmxlZD17IW9rfVxuICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IG9uQWRkTmV4dCh2LnRyaW0oKSk7IHNldFYoJycpOyB9fVxuICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMS41IHJvdW5kZWQtbGcgYmctdmlvbGV0LTUwMC8xNSB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy12aW9sZXQtNTAwLzI1IGRpc2FibGVkOm9wYWNpdHktMzAgd2hpdGVzcGFjZS1ub3dyYXBcIj5cbiAgICAgICAgK1BoXHUwMEUxdCBrXHUxRUJGXG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGlkPVwiYnRuLXF1ZXVlLWVucXVldWVcIiBkaXNhYmxlZD17IW9rfVxuICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IG9uQWRkKHYudHJpbSgpKTsgc2V0VignJyk7IH19XG4gICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLVsjMDBGMkZFXS8yNSBkaXNhYmxlZDpvcGFjaXR5LTMwIHdoaXRlc3BhY2Utbm93cmFwXCI+XG4gICAgICAgICtDdVx1MUVEMWkgaFx1MDBFMG5nXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFNUVURZIERPQ0s6IEtIXHUwMEQ0TkcgR0lBTiBDXHUxRUQ4TkcgVFx1MDBDMUMgUEhcdTAwRDJORyBZT1VUVUJFIChQSEFTRSA0RikgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5leHBvcnQgZnVuY3Rpb24gU3R1ZHlEb2NrKHsgcGhvbmcsIHBob25nTWluaEtob2EsIGF1dGgsIHBob25nQ2hhdCA9IFtdLCBvblNlbmRQaG9uZ0NoYXQsIG9uWG9hVGluUGhvbmcsXG4gIG15Q2FwcyA9IHt9LCBpc1N0YWZmID0gZmFsc2UsIHZhaVRyb1Bob25nID0gJ21lbWJlcicsIHRoYW5oVmllbiA9IFtdLFxuICBwb2xpY2llcyA9IG51bGwsIGdyYW50cyA9IFtdLCB2aWRlb1RpbWVSZWYsIHNlZWtWaWRlbywgaGFuaERvbmdQaG9uZyxcbiAgY2FuQ29udHJvbCA9IGZhbHNlLCBkb25nUGhvbmdIaWVuVGFpIH0pIHtcbiAgY29uc3QgW2RvY2tUYWIsIHNldERvY2tUYWJdID0gUmVhY3QudXNlU3RhdGUoJ2NoYXQnKTsgLy8gJ2NoYXQnIHwgJ25vdGVzJyB8ICd3aGl0ZWJvYXJkJyB8ICdzaGVldCcgfCAndm9pY2UnIHwgJ3F1YW4tdHJpJ1xuXG4gIC8vIENhcGFiaWxpdHkgcGhcdTAwRURhIGNsaWVudCBjaFx1MUVDOSBcdTAxMTFcdTFFQzMgXHUxRUE5bi9oaVx1MUVDN24gVUkgXHUyMDE0IG1cdTFFQ0RpIHF1eVx1MUVDMW4gdGhcdTFFQUR0IGRvIHNlcnZlciBxdXlcdTFFQkZ0LlxuICBjb25zdCBjb1F1eWVuID0gKGNhcCkgPT4gbXlDYXBzW2NhcF0gIT09IGZhbHNlO1xuICBjb25zdCBsYXlWaVRyaVZpZGVvID0gKCkgPT4gTWF0aC5mbG9vcih2aWRlb1RpbWVSZWY/LmN1cnJlbnQgfHwgMCkgfHwgbnVsbDtcbiAgLy8gQlx1MUVBNW0gbVx1MUVEMWMgdGhcdTFFRERpIGdpYW4gXHUyMTkyIGdcdTFFRURpIGV2ZW50IGNobyBDYW1wdXNXYXRjaFRvZ2V0aGVyIHhcdTFFRUQgbFx1MDBGRFxuICAvLyAoY1x1MDBGMyB2aWRlb19jb250cm9sIFx1MjE5MiB0dWEgY2h1bmcgY1x1MUVBMyBwaFx1MDBGMm5nOyBraFx1MDBGNG5nIFx1MjE5MiB0dWEgY1x1MUVFNWMgYlx1MUVEOSBwbGF5ZXIgY1x1MUVFN2EgbVx1MDBFQ25oKS5cbiAgY29uc3QgeWV1Q2F1VHVhID0gKHNlYykgPT4ge1xuICAgIGlmIChzZWMgPT0gbnVsbCB8fCAhKHNlYyA+PSAwKSkgcmV0dXJuO1xuICAgIGlmIChzZWVrVmlkZW8pIHsgc2Vla1ZpZGVvKHNlYywgbXlDYXBzLnZpZGVvX2NvbnRyb2wgPT09IHRydWUpOyByZXR1cm47IH1cbiAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3NyLXNlZWsnLCB7IGRldGFpbDogeyBwaG9uZ0lkOiBwaG9uZy5pZCwgc2VjIH0gfSkpO1xuICB9O1xuXG4gIC8vIDEuIFJvb20gQ2hhdCBTdGF0ZVxuICBjb25zdCBbY2hhdElucHV0LCBzZXRDaGF0SW5wdXRdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbY2hhdFNlbmRpbmcsIHNldENoYXRTZW5kaW5nXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgY2hhdENvbXBvc2luZ1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGNoYXRFbmRSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiA9PT0gJ2NoYXQnICYmIGNoYXRFbmRSZWYuY3VycmVudCkge1xuICAgICAgY2hhdEVuZFJlZi5jdXJyZW50LnNjcm9sbEludG9WaWV3KHsgYmVoYXZpb3I6ICdzbW9vdGgnIH0pO1xuICAgIH1cbiAgfSwgW3Bob25nQ2hhdC5sZW5ndGgsIGRvY2tUYWJdKTtcblxuICBjb25zdCBoYW5kbGVTZW5kUm9vbUNoYXQgPSAoZSkgPT4ge1xuICAgIGU/LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgdHh0ID0gY2hhdElucHV0LnRyaW0oKTtcbiAgICBpZiAoIXR4dCB8fCBjaGF0U2VuZGluZykgcmV0dXJuO1xuICAgIHNldENoYXRJbnB1dCgnJyk7XG4gICAgc2V0Q2hhdFNlbmRpbmcodHJ1ZSk7XG4gICAgaWYgKG9uU2VuZFBob25nQ2hhdCkge1xuICAgICAgUHJvbWlzZS5yZXNvbHZlKG9uU2VuZFBob25nQ2hhdCh0eHQpKS5jYXRjaCgoKSA9PiB7XG4gICAgICAgIHNldENoYXRJbnB1dChjdXIgPT4gY3VyID8gY3VyIDogdHh0KTtcbiAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICBzZXRDaGF0U2VuZGluZyhmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0Q2hhdFNlbmRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyAyLiBTaGFyZWQgTm90ZXMgXHUyMDE0IGVudHJ5IGFwcGVuZCAobVx1MUVEN2kgbmdcdTAxQjBcdTFFRERpIHRoXHUwMEVBbSBnaGkgY2hcdTAwRkEgcmlcdTAwRUFuZywga2hcdTAwRjRuZyBnaGkgXHUwMTExXHUwMEU4IG5oYXUpXG4gIGNvbnN0IFtub3Rlc0xpc3QsIHNldE5vdGVzTGlzdF0gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFtub3RlSW5wdXQsIHNldE5vdGVJbnB1dF0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtub3RlV2l0aFRpbWUsIHNldE5vdGVXaXRoVGltZV0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW25vdGVzQ2FuV3JpdGUsIHNldE5vdGVzQ2FuV3JpdGVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IFtub3Rlc05vdGljZSwgc2V0Tm90ZXNOb3RpY2VdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBub3Rlc1ZlcnNpb25SZWYgPSBSZWFjdC51c2VSZWYoMCk7XG4gIGNvbnN0IG5vdGVDb21wb3NpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICdub3RlcycpIHJldHVybjtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaE5vdGVzID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mcmVzb3VyY2U9bm90ZXNgKTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChhY3RpdmUgJiYgZC5vaykge1xuICAgICAgICAgIHNldE5vdGVzTGlzdChBcnJheS5pc0FycmF5KGQucGF5bG9hZD8ubm90ZXMpID8gZC5wYXlsb2FkLm5vdGVzIDogW10pO1xuICAgICAgICAgIG5vdGVzVmVyc2lvblJlZi5jdXJyZW50ID0gZC52ZXJzaW9uIHx8IDA7XG4gICAgICAgICAgc2V0Tm90ZXNDYW5Xcml0ZShkLmNhbldyaXRlICE9PSBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aXZlICYmIGQuY29kZSA9PT0gJ2NhcGFiaWxpdHlfb2ZmJykge1xuICAgICAgICAgIHNldE5vdGVzQ2FuV3JpdGUoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfTtcbiAgICBmZXRjaE5vdGVzKCk7XG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChraGlIaWVuVGhpKGZldGNoTm90ZXMpLCAzMDAwKTtcbiAgICByZXR1cm4gKCkgPT4geyBhY3RpdmUgPSBmYWxzZTsgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7IH07XG4gIH0sIFtwaG9uZy5pZCwgZG9ja1RhYl0pO1xuXG4gIGNvbnN0IHRoZW1HaGlDaHUgPSBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgdGV4dCA9IG5vdGVJbnB1dC50cmltKCk7XG4gICAgaWYgKCF0ZXh0KSByZXR1cm47XG4gICAgc2V0Tm90ZXNOb3RpY2UoJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgIHJlc291cmNlOiAnbm90ZXMnLFxuICAgICAgICAgIHBheWxvYWQ6IHsgdGV4dCwgdmlkZW9UaW1lU2VjOiBub3RlV2l0aFRpbWUgPyBsYXlWaVRyaVZpZGVvKCkgOiBudWxsIH1cbiAgICAgICAgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vaykge1xuICAgICAgICBzZXROb3RlSW5wdXQoJycpO1xuICAgICAgICBzZXROb3Rlc0xpc3QocHJldiA9PiBbLi4ucHJldiwgeyBpZDogZC5pZCwgdGVuOiBhdXRoLnVzZXI/LnRlbiB8fCAnQlx1MUVBMW4nLCBub2lEdW5nOiB0ZXh0LCB2aWRlb1RpbWVTZWM6IG5vdGVXaXRoVGltZSA/IGxheVZpVHJpVmlkZW8oKSA6IG51bGwsIGN1YVRvaTogMSB9XSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXROb3Rlc05vdGljZShkLmxvaSB8fCAnS2hcdTAwRjRuZyBsXHUwMUIwdSBcdTAxMTFcdTAxQjBcdTFFRTNjIGdoaSBjaFx1MDBGQS4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHsgc2V0Tm90ZXNOb3RpY2UoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpLicpOyB9XG4gIH07XG5cbiAgY29uc3QgeG9hR2hpQ2h1ID0gYXN5bmMgKGlkKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCByZXNvdXJjZTogJ25vdGVzJywgYWN0aW9uOiAneG9hX25vdGUnLCBpZCB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSBzZXROb3Rlc0xpc3QocHJldiA9PiBwcmV2LmZpbHRlcihuID0+IG4uaWQgIT09IGlkKSk7XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIC8vIDMuIFNoYXJlZCBXaGl0ZWJvYXJkIFN0YXRlXG4gIGNvbnN0IGNhbnZhc1JlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgW3diU3Ryb2tlcywgc2V0V2JTdHJva2VzXSA9IFJlYWN0LnVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW3diQ29sb3IsIHNldFdiQ29sb3JdID0gUmVhY3QudXNlU3RhdGUoJyMwMEYyRkUnKTtcbiAgY29uc3QgW3diV2lkdGgsIHNldFdiV2lkdGhdID0gUmVhY3QudXNlU3RhdGUoMyk7XG4gIGNvbnN0IFt3YlRvb2wsIHNldFdiVG9vbF0gPSBSZWFjdC51c2VTdGF0ZSgncGVuJyk7XG4gIGNvbnN0IGlzRHJhd2luZ1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGN1cnJlbnRTdHJva2VSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHdiVmVyc2lvblJlZiA9IFJlYWN0LnVzZVJlZigwKTtcblxuICBjb25zdCByZWRyYXdDYW52YXMgPSBSZWFjdC51c2VDYWxsYmFjaygoc3Ryb2tlcykgPT4ge1xuICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgIGlmICghY2FudmFzKSByZXR1cm47XG4gICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIHN0cm9rZXMuZm9yRWFjaChzID0+IHtcbiAgICAgIGlmICghcy5wb2ludHMgfHwgcy5wb2ludHMubGVuZ3RoIDwgMikgcmV0dXJuO1xuICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgY3R4LnN0cm9rZVN0eWxlID0gcy50b29sID09PSAnZXJhc2VyJyA/ICcjMEIwRTE0JyA6IChzLmNvbG9yIHx8ICcjMDBGMkZFJyk7XG4gICAgICBjdHgubGluZVdpZHRoID0gcy53aWR0aCB8fCAzO1xuICAgICAgY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuICAgICAgY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcbiAgICAgIGN0eC5tb3ZlVG8ocy5wb2ludHNbMF0ueCwgcy5wb2ludHNbMF0ueSk7XG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHMucG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGN0eC5saW5lVG8ocy5wb2ludHNbaV0ueCwgcy5wb2ludHNbaV0ueSk7XG4gICAgICB9XG4gICAgICBjdHguc3Ryb2tlKCk7XG4gICAgfSk7XG4gIH0sIFtdKTtcblxuICBjb25zdCBbd2JDYW5Xcml0ZSwgc2V0V2JDYW5Xcml0ZV0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTtcblxuICAvLyBcdTAwQzFwIDEgb3Agdlx1MDBFMG8gbVx1MUVBM25nIHN0cm9rZXMgKHJlcGxheSBhcHBlbmQtb25seSk6ICdzdHJva2UnIHRoXHUwMEVBbSBuXHUwMEU5dCwgJ2NsZWFyJyB4b1x1MDBFMSBzXHUxRUExY2guXG4gIGNvbnN0IGFwRHVuZ09wID0gKHN0cm9rZXMsIG9wKSA9PiB7XG4gICAgaWYgKG9wLnR5cGUgPT09ICdjbGVhcicpIHJldHVybiBbXTtcbiAgICBpZiAob3AudHlwZSA9PT0gJ3N0cm9rZScgJiYgb3Auc3Ryb2tlKSByZXR1cm4gWy4uLnN0cm9rZXMsIG9wLnN0cm9rZV07XG4gICAgcmV0dXJuIHN0cm9rZXM7XG4gIH07XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiAhPT0gJ3doaXRlYm9hcmQnKSByZXR1cm47XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG4gICAgY29uc3QgZmV0Y2hXYiA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPXdoaXRlYm9hcmQmc2F1SWQ9JHt3YlZlcnNpb25SZWYuY3VycmVudH1gKTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChhY3RpdmUgJiYgZC5vaykge1xuICAgICAgICAgIGNvbnN0IG9wcyA9IEFycmF5LmlzQXJyYXkoZC5wYXlsb2FkPy5vcHMpID8gZC5wYXlsb2FkLm9wcyA6IFtdO1xuICAgICAgICAgIGlmIChvcHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBOXHUxRUJGdSBjXHUwMEYzIG9wICdjbGVhcicgdHJvbmcgbG9cdTFFQTF0IG1cdTFFREJpIFx1MjE5MiBidWlsZCBsXHUxRUExaSB0XHUxRUVCIFx1MDExMVx1MUVBN3UgY2hvIGNoXHUxRUFGY1xuICAgICAgICAgICAgaWYgKG9wcy5zb21lKG8gPT4gby50eXBlID09PSAnY2xlYXInKSkge1xuICAgICAgICAgICAgICBjb25zdCBmdWxsID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mcmVzb3VyY2U9d2hpdGVib2FyZCZzYXVJZD0wYCk7XG4gICAgICAgICAgICAgIGNvbnN0IGRmID0gYXdhaXQgZnVsbC5qc29uKCk7XG4gICAgICAgICAgICAgIGlmIChhY3RpdmUgJiYgZGYub2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbGxPcHMgPSBBcnJheS5pc0FycmF5KGRmLnBheWxvYWQ/Lm9wcykgPyBkZi5wYXlsb2FkLm9wcyA6IFtdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlYnVpbHQgPSBhbGxPcHMucmVkdWNlKGFwRHVuZ09wLCBbXSk7XG4gICAgICAgICAgICAgICAgc2V0V2JTdHJva2VzKHJlYnVpbHQpO1xuICAgICAgICAgICAgICAgIHJlZHJhd0NhbnZhcyhyZWJ1aWx0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2V0V2JTdHJva2VzKHByZXYgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBvcHMucmVkdWNlKGFwRHVuZ09wLCBwcmV2KTtcbiAgICAgICAgICAgICAgICByZWRyYXdDYW52YXMobmV4dCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICB3YlZlcnNpb25SZWYuY3VycmVudCA9IGQudmVyc2lvbiB8fCAwO1xuICAgICAgICAgIHNldFdiQ2FuV3JpdGUoZC5jYW5Xcml0ZSAhPT0gZmFsc2UpO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGl2ZSAmJiBkLmNvZGUgPT09ICdjYXBhYmlsaXR5X29mZicpIHtcbiAgICAgICAgICBzZXRXYkNhbldyaXRlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7fVxuICAgIH07XG4gICAgZmV0Y2hXYigpO1xuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaShmZXRjaFdiKSwgMzAwMCk7XG4gICAgcmV0dXJuICgpID0+IHsgYWN0aXZlID0gZmFsc2U7IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpOyB9O1xuICB9LCBbcGhvbmcuaWQsIGRvY2tUYWIsIHJlZHJhd0NhbnZhc10pO1xuXG4gIGNvbnN0IHN0YXJ0RHJhd2luZyA9IChlKSA9PiB7XG4gICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFjYW52YXMpIHJldHVybjtcbiAgICBjb25zdCByZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGNsaWVudFggPSBlLmNsaWVudFggPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFgpO1xuICAgIGNvbnN0IGNsaWVudFkgPSBlLmNsaWVudFkgPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFkpO1xuICAgIGNvbnN0IHggPSBjbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIGNvbnN0IHkgPSBjbGllbnRZIC0gcmVjdC50b3A7XG4gICAgaXNEcmF3aW5nUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudCA9IHtcbiAgICAgIHRvb2w6IHdiVG9vbCxcbiAgICAgIGNvbG9yOiB3YkNvbG9yLFxuICAgICAgd2lkdGg6IHdiVG9vbCA9PT0gJ2VyYXNlcicgPyAxNiA6IHdiV2lkdGgsXG4gICAgICBwb2ludHM6IFt7IHgsIHkgfV1cbiAgICB9O1xuICB9O1xuXG4gIGNvbnN0IGRyYXdNb3ZlID0gKGUpID0+IHtcbiAgICBpZiAoIWlzRHJhd2luZ1JlZi5jdXJyZW50IHx8ICFjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICBpZiAoIWNhbnZhcykgcmV0dXJuO1xuICAgIGNvbnN0IHJlY3QgPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgY2xpZW50WCA9IGUuY2xpZW50WCA/PyAoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXT8uY2xpZW50WCk7XG4gICAgY29uc3QgY2xpZW50WSA9IGUuY2xpZW50WSA/PyAoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXT8uY2xpZW50WSk7XG4gICAgY29uc3QgeCA9IGNsaWVudFggLSByZWN0LmxlZnQ7XG4gICAgY29uc3QgeSA9IGNsaWVudFkgLSByZWN0LnRvcDtcbiAgICBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQucG9pbnRzLnB1c2goeyB4LCB5IH0pO1xuICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQudG9vbCA9PT0gJ2VyYXNlcicgPyAnIzBCMEUxNCcgOiBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQuY29sb3I7XG4gICAgY3R4LmxpbmVXaWR0aCA9IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC53aWR0aDtcbiAgICBjdHgubGluZUNhcCA9ICdyb3VuZCc7XG4gICAgY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcbiAgICBjb25zdCBwdHMgPSBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQucG9pbnRzO1xuICAgIGlmIChwdHMubGVuZ3RoID49IDIpIHtcbiAgICAgIGN0eC5tb3ZlVG8ocHRzW3B0cy5sZW5ndGggLSAyXS54LCBwdHNbcHRzLmxlbmd0aCAtIDJdLnkpO1xuICAgICAgY3R4LmxpbmVUbyhwdHNbcHRzLmxlbmd0aCAtIDFdLngsIHB0c1twdHMubGVuZ3RoIC0gMV0ueSk7XG4gICAgICBjdHguc3Ryb2tlKCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHN0b3BEcmF3aW5nID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghaXNEcmF3aW5nUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICBpc0RyYXdpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQgJiYgY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnBvaW50cy5sZW5ndGggPiAxKSB7XG4gICAgICBjb25zdCBzdHJva2UgPSBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQ7XG4gICAgICBjb25zdCBuZXh0U3Ryb2tlcyA9IFsuLi53YlN0cm9rZXMsIHN0cm9rZV07XG4gICAgICBzZXRXYlN0cm9rZXMobmV4dFN0cm9rZXMpO1xuICAgICAgY3VycmVudFN0cm9rZVJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICAgIHJlc291cmNlOiAnd2hpdGVib2FyZCcsXG4gICAgICAgICAgICBwYXlsb2FkOiB7IHR5cGU6ICdzdHJva2UnLCBzdHJva2UgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGQub2sgJiYgZC5pZCkgd2JWZXJzaW9uUmVmLmN1cnJlbnQgPSBNYXRoLm1heCh3YlZlcnNpb25SZWYuY3VycmVudCwgZC5pZCk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGNsZWFyV2hpdGVib2FyZCA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIWNvbmZpcm0oJ0JcdTFFQTFuIGNcdTAwRjMgY2hcdTFFQUZjIG11XHUxRUQxbiB4XHUwMEYzYSBzXHUxRUExY2ggYlx1MUVBM25nIHZcdTFFQkQ/IChjaFx1MUVDOSBxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZyknKSkgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgIHJlc291cmNlOiAnd2hpdGVib2FyZCcsXG4gICAgICAgICAgcGF5bG9hZDogeyB0eXBlOiAnY2xlYXInIH1cbiAgICAgICAgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vaykge1xuICAgICAgICBzZXRXYlN0cm9rZXMoW10pO1xuICAgICAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICAgICAgaWYgKGNhbnZhcykge1xuICAgICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICAvLyA0LiBTaGFyZWQgU2hlZXQgU3RhdGUgKDggY29scyB4IDEwIHJvd3MpIFx1MjAxNCB1cHNlcnQgdFx1MUVFQm5nIFx1MDBGNCwga2hcdTAwRjRuZyB3aG9sZS1kb2MgY29uZmxpY3RcbiAgY29uc3QgQ09MUyA9IFsnQScsICdCJywgJ0MnLCAnRCcsICdFJywgJ0YnLCAnRycsICdIJ107XG4gIGNvbnN0IFJPV1MgPSBbMSwgMiwgMywgNCwgNSwgNiwgNywgOCwgOSwgMTBdO1xuICBjb25zdCBbc2hlZXRDZWxscywgc2V0U2hlZXRDZWxsc10gPSBSZWFjdC51c2VTdGF0ZSh7fSk7XG4gIGNvbnN0IFtzaGVldENhbldyaXRlLCBzZXRTaGVldENhbldyaXRlXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBzaGVldFNhdmVUaW1lcnNSZWYgPSBSZWFjdC51c2VSZWYoe30pO1xuICBjb25zdCBzaGVldEZvY3VzZWRDZWxsUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBzaGVldFBvbGxSZWYgPSBSZWFjdC51c2VSZWYoMCk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiAhPT0gJ3NoZWV0JykgcmV0dXJuO1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoU2hlZXQgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT1zaGVldGApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBkLm9rKSB7XG4gICAgICAgICAgY29uc3QgaW5jb21pbmcgPSBkLnBheWxvYWQ/LmNlbGxzIHx8IHt9O1xuICAgICAgICAgIC8vIEtoXHUwMEY0bmcgZ2hpIFx1MDExMVx1MDBFOCBcdTAwRjQgXHUwMTExYW5nIGdcdTAwRjUgZFx1MUVERlxuICAgICAgICAgIHNldFNoZWV0Q2VsbHMocHJldiA9PiB7XG4gICAgICAgICAgICBjb25zdCBtZXJnZWQgPSB7IC4uLmluY29taW5nIH07XG4gICAgICAgICAgICBjb25zdCBkYW5nR28gPSBzaGVldEZvY3VzZWRDZWxsUmVmLmN1cnJlbnQ7XG4gICAgICAgICAgICBpZiAoZGFuZ0dvICYmIHByZXZbZGFuZ0dvXSAhPT0gdW5kZWZpbmVkKSBtZXJnZWRbZGFuZ0dvXSA9IHByZXZbZGFuZ0dvXTtcbiAgICAgICAgICAgIHJldHVybiBtZXJnZWQ7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgc2V0U2hlZXRDYW5Xcml0ZShkLmNhbldyaXRlICE9PSBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aXZlICYmIGQuY29kZSA9PT0gJ2NhcGFiaWxpdHlfb2ZmJykge1xuICAgICAgICAgIHNldFNoZWV0Q2FuV3JpdGUoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfTtcbiAgICBmZXRjaFNoZWV0KCk7XG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChraGlIaWVuVGhpKGZldGNoU2hlZXQpLCAzMDAwKTtcbiAgICByZXR1cm4gKCkgPT4geyBhY3RpdmUgPSBmYWxzZTsgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7IH07XG4gIH0sIFtwaG9uZy5pZCwgZG9ja1RhYl0pO1xuXG4gIGNvbnN0IGhhbmRsZUNlbGxDaGFuZ2UgPSAoY2VsbEtleSwgdmFsKSA9PiB7XG4gICAgc2V0U2hlZXRDZWxscyhwcmV2ID0+ICh7IC4uLnByZXYsIFtjZWxsS2V5XTogdmFsIH0pKTtcbiAgICBjb25zdCB0aW1lcnMgPSBzaGVldFNhdmVUaW1lcnNSZWYuY3VycmVudDtcbiAgICBpZiAodGltZXJzW2NlbGxLZXldKSBjbGVhclRpbWVvdXQodGltZXJzW2NlbGxLZXldKTtcbiAgICB0aW1lcnNbY2VsbEtleV0gPSBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICAgIHJlc291cmNlOiAnc2hlZXQnLFxuICAgICAgICAgICAgcGF5bG9hZDogeyBjZWxsOiBjZWxsS2V5LCB2YWx1ZTogdmFsIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9LCA4MDApO1xuICB9O1xuXG4gIC8vIDUuIDEtdG8tMSBXZWJSVEMgVm9pY2UgQ2hhdCBcdTIwMTQgcGFpci1ib3VuZCAodFx1MUVEMWkgXHUwMTExYSAxIGNcdTFFQjdwL3BoXHUwMEYybmcsIHNpZ25hbGluZyByaVx1MDBFQW5nIHRcdTAxQjApXG4gIGNvbnN0IFt2b2ljZUpvaW5lZCwgc2V0Vm9pY2VKb2luZWRdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbWljTXV0ZWQsIHNldE1pY011dGVkXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpOyAvLyBEZWZhdWx0IE9GRlxuICBjb25zdCBbdm9pY2VTdGF0ZSwgc2V0Vm9pY2VTdGF0ZV0gPSBSZWFjdC51c2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gIGNvbnN0IFt2b2ljZU5vdGljZSwgc2V0Vm9pY2VOb3RpY2VdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbdm9pY2VQYWlyLCBzZXRWb2ljZVBhaXJdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7ICAgICAgIC8vIHthY3RpdmUsIGFUZW4sIGJUZW4sIHlvdUluLCBzbG90fVxuICBjb25zdCBbdm9pY2VSZXF1ZXN0ZWQsIHNldFZvaWNlUmVxdWVzdGVkXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3lldUNhdVZvaWNlLCBzZXRZZXVDYXVWb2ljZV0gPSBSZWFjdC51c2VTdGF0ZShbXSk7ICAgICAvLyBzdGFmZjogZGFuaCBzXHUwMEUxY2ggeGluIHF1eVx1MUVDMW5cbiAgY29uc3QgcGNSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGxvY2FsU3RyZWFtUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCByZW1vdGVBdWRpb1JlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgbGFzdFNpZ25hbElkUmVmID0gUmVhY3QudXNlUmVmKDApO1xuICBjb25zdCB2b2ljZVBvbGxUaW1lclJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgdm9pY2VTbG90UmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB2b2ljZUpvaW5lZFJlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IHBlbmRpbmdDYW5kaWRhdGVzUmVmID0gUmVhY3QudXNlUmVmKFtdKTtcbiAgdm9pY2VKb2luZWRSZWYuY3VycmVudCA9IHZvaWNlSm9pbmVkO1xuXG4gIGNvbnN0IGR1bmdLZXROb2lWb2ljZSA9ICgpID0+IHtcbiAgICBpZiAobG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRUcmFja3MoKS5mb3JFYWNoKHQgPT4gdC5zdG9wKCkpO1xuICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudCA9IG51bGw7XG4gICAgfVxuICAgIGlmIChwY1JlZi5jdXJyZW50KSB7XG4gICAgICBwY1JlZi5jdXJyZW50LmNsb3NlKCk7XG4gICAgICBwY1JlZi5jdXJyZW50ID0gbnVsbDtcbiAgICB9XG4gICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCA9IFtdO1xuICAgIHNldE1pY011dGVkKHRydWUpO1xuICB9O1xuXG4gIC8vIFBvbGwgdHJcdTFFQTFuZyB0aFx1MDBFMWkgY1x1MUVCN3AgKyB0XHUwMEVEbiBoaVx1MUVDN3UgY1x1MUVFN2EgcGFydG5lciAoc2VydmVyIGNoXHUxRUM5IHRyXHUxRUEzIHNpZ25hbCBjXHUxRUU3YSBuZ1x1MDFCMFx1MUVERGkgdHJvbmcgY1x1MUVCN3ApLlxuICBjb25zdCBwb2xsVm9pY2UgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JmFjdGlvbj12b2ljZV9wb2xsJnNhdUlkPSR7bGFzdFNpZ25hbElkUmVmLmN1cnJlbnR9YCk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghZC5vaykgcmV0dXJuO1xuICAgICAgaWYgKGQucGFpcikgc2V0Vm9pY2VQYWlyKGQucGFpcik7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShkLnlldUNhdVZvaWNlKSkgc2V0WWV1Q2F1Vm9pY2UoZC55ZXVDYXVWb2ljZSk7XG4gICAgICBjb25zdCBwYyA9IHBjUmVmLmN1cnJlbnQ7XG4gICAgICBpZiAoIXZvaWNlSm9pbmVkUmVmLmN1cnJlbnQgfHwgIXBjKSByZXR1cm47XG4gICAgICBmb3IgKGNvbnN0IHNpZyBvZiBkLnNpZ25hbHMgfHwgW10pIHtcbiAgICAgICAgbGFzdFNpZ25hbElkUmVmLmN1cnJlbnQgPSBNYXRoLm1heChsYXN0U2lnbmFsSWRSZWYuY3VycmVudCwgc2lnLmlkKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdvZmZlcicpIHtcbiAgICAgICAgICAgIC8vIE9mZmVyIG1cdTFFREJpIGhvXHUxRUI3YyByZS1vZmZlciAoXHUwMTExXHUxRUQxaSBwaFx1MDFCMFx1MDFBMW5nIGJcdTFFQUR0IG1pYyBtdVx1MUVEOW4pIFx1MDExMVx1MUVDMXUgc2V0IGxcdTFFQTFpIHJlbW90ZSArIHRyXHUxRUEzIGFuc3dlci5cbiAgICAgICAgICAgIGF3YWl0IHBjLnNldFJlbW90ZURlc2NyaXB0aW9uKG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24oc2lnLnBheWxvYWQpKTtcbiAgICAgICAgICAgIC8vIFhcdTFFQTMgY1x1MDBFMWMgY2FuZGlkYXRlIHRcdTFFREJpIHNcdTFFREJtIHRyXHUwMUIwXHUxRURCYyBraGkgY1x1MDBGMyByZW1vdGVEZXNjcmlwdGlvbi5cbiAgICAgICAgICAgIGZvciAoY29uc3QgYyBvZiBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLmFkZEljZUNhbmRpZGF0ZShuZXcgUlRDSWNlQ2FuZGlkYXRlKGMpKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50ID0gW107XG4gICAgICAgICAgICBjb25zdCBhbnMgPSBhd2FpdCBwYy5jcmVhdGVBbnN3ZXIoKTtcbiAgICAgICAgICAgIGF3YWl0IHBjLnNldExvY2FsRGVzY3JpcHRpb24oYW5zKTtcbiAgICAgICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnYW5zd2VyJywgcGF5bG9hZDogYW5zIH0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnYW5zd2VyJykge1xuICAgICAgICAgICAgaWYgKHBjLnNpZ25hbGluZ1N0YXRlID09PSAnaGF2ZS1sb2NhbC1vZmZlcicpIHtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuc2V0UmVtb3RlRGVzY3JpcHRpb24obmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbihzaWcucGF5bG9hZCkpO1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IGMgb2YgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBjLmFkZEljZUNhbmRpZGF0ZShuZXcgUlRDSWNlQ2FuZGlkYXRlKGMpKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdjYW5kaWRhdGUnKSB7XG4gICAgICAgICAgICBpZiAocGMucmVtb3RlRGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuYWRkSWNlQ2FuZGlkYXRlKG5ldyBSVENJY2VDYW5kaWRhdGUoc2lnLnBheWxvYWQpKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50LnB1c2goc2lnLnBheWxvYWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdsZWF2ZScpIHtcbiAgICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdOZ1x1MDFCMFx1MUVERGkga2lhIFx1MDExMVx1MDBFMyBuZ1x1MUVBRnQgdm9pY2UuJyk7XG4gICAgICAgICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgICAgIGR1bmdLZXROb2lWb2ljZSgpO1xuICAgICAgICAgICAgc2V0Vm9pY2VKb2luZWQoZmFsc2UpO1xuICAgICAgICAgICAgdm9pY2VTbG90UmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCB7IC8qIGJcdTFFQ0YgcXVhIHNpZ25hbCBsXHUxRUQ3aSAqLyB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIC8vIFBvbGwgY2hcdTFFQTF5IGtoaSB0YWIgdm9pY2UgbVx1MUVERiAoeGVtIHRyXHUxRUExbmcgdGhcdTAwRTFpIGNcdTFFQjdwKSBob1x1MUVCN2MgXHUwMTExYW5nIHRyb25nIGNcdTFFQjdwLlxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAndm9pY2UnICYmICF2b2ljZUpvaW5lZCkgcmV0dXJuO1xuICAgIHBvbGxWb2ljZSgpO1xuICAgIHZvaWNlUG9sbFRpbWVyUmVmLmN1cnJlbnQgPSBzZXRJbnRlcnZhbChwb2xsVm9pY2UsIDE1MDApO1xuICAgIHJldHVybiAoKSA9PiB7IGlmICh2b2ljZVBvbGxUaW1lclJlZi5jdXJyZW50KSBjbGVhckludGVydmFsKHZvaWNlUG9sbFRpbWVyUmVmLmN1cnJlbnQpOyB9O1xuICB9LCBbcGhvbmcuaWQsIGRvY2tUYWIsIHZvaWNlSm9pbmVkXSk7XG5cbiAgY29uc3Qgam9pblZvaWNlID0gYXN5bmMgKCkgPT4ge1xuICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBhbmcgeGluIGNoXHUxRUQ3IHRyb25nIGNcdTFFQjdwIHZvaWNlLi4uJyk7XG4gICAgc2V0Vm9pY2VTdGF0ZSgnY29ubmVjdGluZycpO1xuICAgIHRyeSB7XG4gICAgICAvLyAxLiBHaVx1MDBFMG5oIHNsb3QgdHJcdTAwRUFuIHNlcnZlciB0clx1MDFCMFx1MUVEQmMgKHNlcnZlci1hdXRob3JpdGF0aXZlOiB0XHUxRUQxaSBcdTAxMTFhIDEgY1x1MUVCN3AgMS0xL3BoXHUwMEYybmcpXG4gICAgICBjb25zdCBqb2luUmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX2pvaW4nIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGpvaW5EYXRhID0gYXdhaXQgam9pblJlcy5qc29uKCk7XG4gICAgICBpZiAoIWpvaW5EYXRhLm9rKSB7XG4gICAgICAgIGlmIChqb2luRGF0YS5jb2RlID09PSAnZ3JhbnRfcmVxdWlyZWQnKSB7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0JcdTFFQTFuIGNcdTFFQTduIFx1MDExMVx1MDFCMFx1MUVFM2MgY1x1MUVBNXAgcXV5XHUxRUMxbiB2b2ljZSBcdTIwMTQgaFx1MDBFM3kgYlx1MUVBNW0gXCJYaW4gcXV5XHUxRUMxbiB2b2ljZVwiLicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKGpvaW5EYXRhLmxvaSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyB0aGFtIGdpYSB2b2ljZS4nKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdm9pY2VTbG90UmVmLmN1cnJlbnQgPSBqb2luRGF0YS5zbG90O1xuICAgICAgc2V0Vm9pY2VKb2luZWQodHJ1ZSk7XG5cbiAgICAgIC8vIDIuIFhpbiBtaWMgVFJcdTAxQUZcdTFFREFDIGtoaSB0XHUxRUExbyBvZmZlciBcdTIwMTQgdHJhY2sgcGhcdTFFQTNpIGNcdTAwRjMgc1x1MUVCNW4gdHJvbmcgU0RQIG5lZ290aWF0aW9uLFxuICAgICAgLy8gICAgYWRkVHJhY2sgc2F1IGtoaSBcdTAxMTFcdTAwRTMgYlx1MUVBRnQgdGF5IG1cdTAwRTAga2hcdTAwRjRuZyByZW5lZ290aWF0ZSBcdTIxOTIgbmdcdTAxQjBcdTFFRERpIGtpYSBraFx1MDBGNG5nIG5naGUgXHUwMTExXHUwMUIwXHUxRUUzYy5cbiAgICAgIC8vICAgIE1pYyBraFx1MUVERmkgXHUwMTExXHUxRUE3dSBtdXRlZCAoZW5hYmxlZD1mYWxzZSkgXHUyMDE0IHVzZXIgdFx1MUVGMSBiXHUxRUFEdCBiXHUxRUIxbmcgblx1MDBGQXQgTWljLlxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc3RyZWFtID0gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoeyBhdWRpbzogdHJ1ZSwgdmlkZW86IGZhbHNlIH0pO1xuICAgICAgICBzdHJlYW0uZ2V0QXVkaW9UcmFja3MoKS5mb3JFYWNoKHQgPT4geyB0LmVuYWJsZWQgPSBmYWxzZTsgfSk7XG4gICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQgPSBzdHJlYW07XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0toXHUwMEY0bmcgeGluIFx1MDExMVx1MDFCMFx1MUVFM2MgbWljcm8gXHUyMDE0IGJcdTFFQTFuIGNoXHUxRUM5IG5naGUgXHUwMTExXHUwMUIwXHUxRUUzYywga2hcdTAwRjRuZyBuXHUwMEYzaSBcdTAxMTFcdTAxQjBcdTFFRTNjLicpO1xuICAgICAgfVxuXG4gICAgICAvLyAzLiBUXHUxRUExbyBwZWVyIGNvbm5lY3Rpb25cbiAgICAgIGNvbnN0IHBjID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKHtcbiAgICAgICAgaWNlU2VydmVyczogW3sgdXJsczogJ3N0dW46c3R1bi5sLmdvb2dsZS5jb206MTkzMDInIH1dXG4gICAgICB9KTtcbiAgICAgIHBjUmVmLmN1cnJlbnQgPSBwYztcbiAgICAgIGlmIChsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0VHJhY2tzKCkuZm9yRWFjaCh0ID0+IHBjLmFkZFRyYWNrKHQsIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpKTtcbiAgICAgIH1cblxuICAgICAgcGMub25pY2VjYW5kaWRhdGUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmNhbmRpZGF0ZSkge1xuICAgICAgICAgIGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgICAgICBhY3Rpb246ICd2b2ljZV9zaWduYWwnLFxuICAgICAgICAgICAgICBzaWduYWxUeXBlOiAnY2FuZGlkYXRlJyxcbiAgICAgICAgICAgICAgcGF5bG9hZDogZXZlbnQuY2FuZGlkYXRlXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcGMub250cmFjayA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAocmVtb3RlQXVkaW9SZWYuY3VycmVudCAmJiBldmVudC5zdHJlYW1zWzBdKSB7XG4gICAgICAgICAgcmVtb3RlQXVkaW9SZWYuY3VycmVudC5zcmNPYmplY3QgPSBldmVudC5zdHJlYW1zWzBdO1xuICAgICAgICAgIHJlbW90ZUF1ZGlvUmVmLmN1cnJlbnQucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcGMub25jb25uZWN0aW9uc3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHMgPSBwYy5jb25uZWN0aW9uU3RhdGU7XG4gICAgICAgIGlmIChzID09PSAnY29ubmVjdGVkJykge1xuICAgICAgICAgIHNldFZvaWNlU3RhdGUoJ2Nvbm5lY3RlZCcpO1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdcdTI3MTMgXHUwMTEwYW5nIGtcdTFFQkZ0IG5cdTFFRDFpIHRob1x1MUVBMWkgMS0xIHRyXHUxRUYxYyB0aVx1MUVCRnAuJyk7XG4gICAgICAgIH0gZWxzZSBpZiAocyA9PT0gJ2ZhaWxlZCcgfHwgcyA9PT0gJ2Rpc2Nvbm5lY3RlZCcpIHtcbiAgICAgICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnTVx1MUVBNXQga1x1MUVCRnQgblx1MUVEMWkgdGhvXHUxRUExaSAobVx1MUVBMW5nIGNoXHUxRUI3biBQMlAgblx1MUVCRnUga2hcdTAwRjRuZyBjXHUwMEYzIFRVUk4pLicpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyA0LiBTbG90ICdiJyAobmdcdTAxQjBcdTFFRERpIHZcdTAwRTBvIHNhdSkgdFx1MUVBMW8gb2ZmZXI7IHNsb3QgJ2EnIGNoXHUxRUREIG9mZmVyIHRcdTFFRUIgcG9sbC5cbiAgICAgIGlmIChqb2luRGF0YS5zbG90ID09PSAnYicpIHtcbiAgICAgICAgY29uc3Qgb2ZmZXIgPSBhd2FpdCBwYy5jcmVhdGVPZmZlcigpO1xuICAgICAgICBhd2FpdCBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcbiAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdvZmZlcicsIHBheWxvYWQ6IG9mZmVyIH0pXG4gICAgICAgIH0pO1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwXHUwMEUzIHZcdTAwRTBvIGNcdTFFQjdwIFx1MjAxNCBcdTAxMTFhbmcgYlx1MUVBRnQgdGF5IHZcdTFFREJpICcgKyAodm9pY2VQYWlyPy5hVGVuIHx8ICduZ1x1MDFCMFx1MUVERGkga2lhJykgKyAnXHUyMDI2Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnQlx1MUVBMW4gbFx1MDBFMCBuZ1x1MDFCMFx1MUVERGkgXHUwMTExXHUxRUE3dSB0aVx1MDBFQW4gXHUyMDE0IGNoXHUxRUREIHRoXHUwMEVBbSAxIG5nXHUwMUIwXHUxRUREaSB2XHUwMEUwbyB2b2ljZVx1MjAyNicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIHZvaWNlOiAnICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHhpblF1eWVuVm9pY2UgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9yZXF1ZXN0JyB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIGQuZ3JhbnRlZCkge1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnQlx1MUVBMW4gXHUwMTExXHUwMEUzIFx1MDExMVx1MDFCMFx1MUVFM2MgcGhcdTAwRTlwIHZvaWNlIFx1MjAxNCBiXHUxRUE1bSBUaGFtIGdpYS4nKTtcbiAgICAgIH0gZWxzZSBpZiAoZC5vaykge1xuICAgICAgICBzZXRWb2ljZVJlcXVlc3RlZCh0cnVlKTtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMFx1MDBFMyBnXHUxRUVEaSB5XHUwMEVBdSBjXHUxRUE3dSBcdTIwMTQgY2hcdTFFREQgcXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcgZHV5XHUxRUM3dC4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKGQubG9pIHx8ICdLaFx1MDBGNG5nIGdcdTFFRURpIFx1MDExMVx1MDFCMFx1MUVFM2MgeVx1MDBFQXUgY1x1MUVBN3UuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IHNldFZvaWNlTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaS4nKTsgfVxuICB9O1xuXG4gIGNvbnN0IG5nYXRWb2ljZUNhcCA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIWNvbmZpcm0oJ05nXHUxRUFGdCBjXHUxRUI3cCB2b2ljZSBcdTAxMTFhbmcgaG9cdTFFQTF0IFx1MDExMVx1MUVEOW5nPycpKSByZXR1cm47XG4gICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX2VuZCcgfSlcbiAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgcG9sbFZvaWNlKCk7XG4gIH07XG5cbiAgY29uc3QgdG9nZ2xlTWljID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmIChtaWNNdXRlZCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCFsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgLy8gTWljIGJcdTFFQ0IgdFx1MUVFQiBjaFx1MUVEMWkgbFx1MDBGQWMgam9pbiBcdTIxOTIgeGluIGxcdTFFQTFpOyBhZGRUcmFjayBtdVx1MUVEOW4gY1x1MUVBN24gcmVuZWdvdGlhdGUgKG9mZmVyIG1cdTFFREJpKS5cbiAgICAgICAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7IGF1ZGlvOiB0cnVlLCB2aWRlbzogZmFsc2UgfSk7XG4gICAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudCA9IHN0cmVhbTtcbiAgICAgICAgICBjb25zdCBwYyA9IHBjUmVmLmN1cnJlbnQ7XG4gICAgICAgICAgaWYgKHBjKSB7XG4gICAgICAgICAgICBzdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaCh0cmFjayA9PiBwYy5hZGRUcmFjayh0cmFjaywgc3RyZWFtKSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBvZmZlciA9IGF3YWl0IHBjLmNyZWF0ZU9mZmVyKCk7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpO1xuICAgICAgICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ29mZmVyJywgcGF5bG9hZDogb2ZmZXIgfSlcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogcmVuZWdvdGlhdGlvbiB0aFx1MUVBNXQgYlx1MUVBMWkgXHUyMDE0IG5naGUgdlx1MUVBQm4gXHUwMTExXHUwMUIwXHUxRUUzYyAqLyB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0QXVkaW9UcmFja3MoKS5mb3JFYWNoKHQgPT4geyB0LmVuYWJsZWQgPSB0cnVlOyB9KTtcbiAgICAgICAgfVxuICAgICAgICBzZXRNaWNNdXRlZChmYWxzZSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgYWxlcnQoJ0toXHUwMEY0bmcgdGhcdTFFQzMgbVx1MUVERiBtaWNybzogJyArIGVyci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRBdWRpb1RyYWNrcygpLmZvckVhY2godCA9PiB7IHQuZW5hYmxlZCA9IGZhbHNlOyB9KTtcbiAgICAgIH1cbiAgICAgIHNldE1pY011dGVkKHRydWUpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBsZWF2ZVZvaWNlID0gKCkgPT4ge1xuICAgIGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnbGVhdmUnLCBwYXlsb2FkOiB7fSB9KVxuICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICBkdW5nS2V0Tm9pVm9pY2UoKTtcbiAgICBzZXRWb2ljZUpvaW5lZChmYWxzZSk7XG4gICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgdm9pY2VTbG90UmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBcdTAwRTMgbmdcdTFFQUZ0IHZvaWNlLicpO1xuICB9O1xuXG4gIC8vIDYuIFZpZGVvICYgUXVldWUgQ29uZmlnIFN0YXRlIChUYWIgY29uZmlnKVxuICBjb25zdCBbdmlkZW9Nb2ksIHNldFZpZGVvTW9pXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2RhbmdEb2lWaWRlbywgc2V0RGFuZ0RvaVZpZGVvXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2NvbmZpZ0xvaSwgc2V0Q29uZmlnTG9pXSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3F1ZXVlTGlzdCwgc2V0UXVldWVMaXN0XSA9IFJlYWN0LnVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW3F1ZXVlQnVzeSwgc2V0UXVldWVCdXN5XSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCB0YWlRdWV1ZSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctcXVldWU/cGhvbmdJZD0ke3Bob25nLmlkfSZhY3Rpb249bGlzdGApO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vaykgc2V0UXVldWVMaXN0KGQucXVldWUgfHwgW10pO1xuICAgIH0gY2F0Y2ggeyB9XG4gIH07XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiA9PT0gJ2NvbmZpZycpIHtcbiAgICAgIHRhaVF1ZXVlKCk7XG4gICAgICBjb25zdCB0aW1lciA9IHNldEludGVydmFsKGtoaUhpZW5UaGkodGFpUXVldWUpLCA0MDAwKTtcbiAgICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICB9XG4gIH0sIFtkb2NrVGFiLCBwaG9uZy5pZF0pO1xuXG4gIGNvbnN0IGRvaVZpZGVvID0gYXN5bmMgKHVybCkgPT4ge1xuICAgIGNvbnN0IHUgPSBTdHJpbmcodXJsIHx8IHZpZGVvTW9pIHx8ICcnKS50cmltKCk7XG4gICAgaWYgKCF1IHx8IGRhbmdEb2lWaWRlbykgcmV0dXJuO1xuICAgIHNldERhbmdEb2lWaWRlbyh0cnVlKTtcbiAgICBzZXRDb25maWdMb2koJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy13YXRjaCcsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICdzZXRfdmlkZW8nLCB2aWRlb1VybDogdSB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghZC5vaykge1xuICAgICAgICBzZXRDb25maWdMb2koZC5sb2kgfHwgJ0toXHUwMEY0bmcgXHUwMTExXHUxRUQ1aSBcdTAxMTFcdTAxQjBcdTFFRTNjIHZpZGVvLicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0VmlkZW9Nb2koJycpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0Q29uZmlnTG9pKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RGFuZ0RvaVZpZGVvKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgaGFuaERvbmdRdWV1ZSA9IGFzeW5jIChhY3Rpb24sIGV4dHJhID0ge30pID0+IHtcbiAgICBpZiAocXVldWVCdXN5KSByZXR1cm47XG4gICAgc2V0UXVldWVCdXN5KHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1xdWV1ZScsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb24sIC4uLmV4dHJhIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSBzZXRDb25maWdMb2koZC5sb2kgfHwgJ1RoYW8gdFx1MDBFMWMgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdGhcdTFFQTV0IGJcdTFFQTFpLicpO1xuICAgICAgZWxzZSBhd2FpdCB0YWlRdWV1ZSgpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0Q29uZmlnTG9pKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0UXVldWVCdXN5KGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGlkPVwic3R1ZHktZG9jay1jb250YWluZXJcIiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTQgZmxleCBmbGV4LWNvbCBtaW4taC1bNDIwcHhdIGxnOm1pbi1oLVs0ODBweF0gc2hhZG93LXhsXCI+XG4gICAgICB7LyogU3R1ZHkgRG9jayBUYWIgTmF2aWdhdGlvbiBcdTIwMTQgR1x1MUVDRG4gZ1x1MDBFMG5nLCB0aFx1MUVBOW0gbVx1MUVGOSwgblx1MDBGQXQgblx1MUVENWkgYlx1MUVBRHQgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBwYi0zIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMCBmbGV4LXdyYXBcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBmbGV4LXdyYXBcIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1jaGF0XCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignY2hhdCcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ2NoYXQnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQUM8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5DaGF0IHBoXHUwMEYybmc8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktbm90ZXNcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdub3RlcycpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ25vdGVzJ1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0REPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+R2hpIGNoXHUwMEZBPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LXdoaXRlYm9hcmRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCd3aGl0ZWJvYXJkJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnd2hpdGVib2FyZCdcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REZBODwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkJcdTFFQTNuZyB2XHUxRUJEPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LXNoZWV0XCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignc2hlZXQnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdzaGVldCdcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENDQTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkJcdTFFQTNuZyB0XHUwMEVEbmg8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktdm9pY2VcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCd2b2ljZScpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3ZvaWNlJ1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tYW1iZXItNTAwIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDI1MSwxOTEsMzYsMC4zNSldIGJvcmRlciBib3JkZXItYW1iZXItNDAwLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REY5OVx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPlZvaWNlICgxLTEpPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LW1lbWJlcnNcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdtZW1iZXJzJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnbWVtYmVycydcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tZW1lcmFsZC00MDAgdG8tdGVhbC01MDAgdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoNTIsMjExLDE1MywwLjM1KV0gYm9yZGVyIGJvcmRlci1lbWVyYWxkLTQwMC81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDNjU8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5UaFx1MDBFMG5oIHZpXHUwMEVBbnt0aGFuaFZpZW4ubGVuZ3RoID4gMCA/IGAgKCR7dGhhbmhWaWVuLmxlbmd0aH0pYCA6ICcnfTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICB7KGNhbkNvbnRyb2wgfHwgaXNTdGFmZikgJiYgKFxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1jb25maWdcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignY29uZmlnJyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ2NvbmZpZydcbiAgICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS12aW9sZXQtNTAwIHRvLWZ1Y2hzaWEtNTAwIHRleHQtd2hpdGUgc2hhZG93LVswXzBfMTVweF9yZ2JhKDEzOSw5MiwyNDYsMC4zNSldIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC81MCdcbiAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGQTU8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlZpZGVvPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKX1cbiAgICAgICAgICB7aXNTdGFmZiAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LXF1YW4tdHJpXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3F1YW4tdHJpJyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3F1YW4tdHJpJ1xuICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLXZpb2xldC01MDAgdG8tcHVycGxlLTUwMCB0ZXh0LXdoaXRlIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgxMzksOTIsMjQ2LDAuMzUpXSBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvNTAnXG4gICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNjk5XHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5RdXlcdTFFQzFuPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIERvY2sgQ29udGVudCBCb2R5ICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBwdC0zIG1pbi1oLVszMDBweF1cIj5cbiAgICAgICAgey8qIFRBQiAxOiBDSEFUIFBIXHUwMEQyTkcgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAnY2hhdCcgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgbWluLWgtMFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHNwYWNlLXktMyBwci0xIG1heC1oLTcyIGxnOm1heC1oLVszODBweF0geGw6bWF4LWgtWzQ0MHB4XSB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgIHtwaG9uZ0NoYXQubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwIHRleHQtY2VudGVyIHB5LThcIj5DaFx1MDFCMGEgY1x1MDBGMyB0aW4gbmhcdTFFQUZuIFx1MjAxNCBoXHUwMEUzeSBnXHUxRUVEaSBjXHUwMEUydSBoXHUxRUNGaSBob1x1MUVCN2MgdHJhbyBcdTAxMTFcdTFFRDVpIHZcdTFFQzEgYlx1MDBFMGkgZ2lcdTFFQTNuZyE8L3A+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgcGhvbmdDaGF0Lm1hcCgobSwgaWR4KSA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17bS5pZCB8fCBpZHh9IGNsYXNzTmFtZT1cInRleHQteHMgZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtYi0xIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMCB0ZXh0LVsxMXB4XVwiPnttLnRlbk5ndW9pR3VpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICB7bS52YWlUcm8gPT09ICdnaWFvX3ZpZW4nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuMiByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzBcIj5HVkNOPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICkgOiBtLmxvcFRlbiA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMjBcIj57bS5sb3BUZW59PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bS50YW9MdWMgPyBuZXcgRGF0ZShtLnRhb0x1Yy5yZXBsYWNlKCcgJywgJ1QnKSArICdaJykudG9Mb2NhbGVUaW1lU3RyaW5nKFtdLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSkgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAge20udmlkZW9UaW1lU2VjICE9IG51bGwgJiYgbS52aWRlb1RpbWVTZWMgPiAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHlldUNhdVR1YShtLnZpZGVvVGltZVNlYyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtteUNhcHMudmlkZW9fY29udHJvbCA/ICdUdWEgdmlkZW8gY1x1MUVBMyBwaFx1MDBGMm5nIHRcdTFFREJpIG1cdTFFRDFjIG5cdTAwRTB5JyA6ICdUdWEgdmlkZW8gY1x1MUVFN2EgYlx1MUVBMW4gdFx1MUVEQmkgbVx1MUVEMWMgblx1MDBFMHknfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCBob3ZlcjpiZy12aW9sZXQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNiB7ZGluaERhbmdHaWF5UGh1dChtLnZpZGVvVGltZVNlYyl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiWG9cdTAwRTEgdGluIG5oXHUxRUFGbiBuXHUwMEUweSAocXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jaGF0P3Bob25nSWQ9JHtwaG9uZy5pZH0maWQ9JHttLmlkfWAsIHsgbWV0aG9kOiAnREVMRVRFJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQub2sgJiYgb25Yb2FUaW5QaG9uZykgb25Yb2FUaW5QaG9uZyhtLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgKi8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcGFjaXR5LTAgZ3JvdXAtaG92ZXI6b3BhY2l0eS0xMDAgcHgtMSB0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtcm9zZS00MDAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLXhsIHB4LTMgcHktMiB0ZXh0LXNsYXRlLTIwMCB0ZXh0LXhzIGxlYWRpbmctcmVsYXhlZCBicmVhay13b3Jkc1wiPlxuICAgICAgICAgICAgICAgICAgICAgIHttLm5vaUR1bmd9XG4gICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDxkaXYgcmVmPXtjaGF0RW5kUmVmfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVTZW5kUm9vbUNoYXR9IGNsYXNzTmFtZT1cInB0LTMgYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzEwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG10LWF1dG9cIj5cbiAgICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1waG9uZy1jaGF0XCJcbiAgICAgICAgICAgICAgICByb3dzPXsxfVxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtjb1F1eWVuKCdjaGF0JykgPyAnTmhcdTFFQUZuIHRpbiB0cm9uZyBwaFx1MDBGMm5nIGhcdTFFQ0RjLi4uICh0aW4gbmhcdTFFQUZuIHRcdTFFRjEgZ1x1MUVBRm4gbVx1MUVEMWMgdmlkZW8gaGlcdTFFQzduIHRcdTFFQTFpKScgOiAnQ2hhdCBcdTAxMTFhbmcgYlx1MUVDQiBxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZyBraFx1MDBGM2EnfVxuICAgICAgICAgICAgICAgIHZhbHVlPXtjaGF0SW5wdXR9XG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjb1F1eWVuKCdjaGF0Jyl9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Q2hhdElucHV0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ9eygpID0+IHsgY2hhdENvbXBvc2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPXsoKSA9PiB7IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCA9IGZhbHNlOyB9fVxuICAgICAgICAgICAgICAgIG9uS2V5RG93bj17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUubmF0aXZlRXZlbnQ/LmlzQ29tcG9zaW5nIHx8IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZVNlbmRSb29tQ2hhdCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXs1MDB9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcHgtMyBweS0yIHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNjAgcmVzaXplLW5vbmUgbWluLWgtWzM4cHhdIG1heC1oLTI0IGRpc2FibGVkOm9wYWNpdHktNDBcIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tc2VuZC1waG9uZy1jaGF0XCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNoYXRJbnB1dC50cmltKCkgfHwgY2hhdFNlbmRpbmcgfHwgIWNvUXV5ZW4oJ2NoYXQnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgcm91bmRlZC14bCBiZy1bIzAwRjJGRV0gaG92ZXI6YmctWyMwMGUxZWNdIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktMzAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICBHXHUxRUVEaVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDI6IEdISSBDSFx1MDBEQSBDXHUxRUQ4TkcgVFx1MDBDMUMgXHUyMDE0IGVudHJ5IGFwcGVuZCwgY1x1MDBGMyBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdub3RlcycgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICAgIDxzcGFuPkdoaSBjaFx1MDBGQSBjaHVuZyBjXHUxRUU3YSBwaFx1MDBGMm5nIFx1MjAxNCBtXHUxRUQ3aSBuZ1x1MDFCMFx1MUVERGkgdGhcdTAwRUFtIG1cdTFFRDl0IGRcdTAwRjJuZywgY1x1MDBGMyB0aFx1MUVDMyBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbzwvc3Bhbj5cbiAgICAgICAgICAgICAge25vdGVzTm90aWNlICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtcm9zZS0zMDAgZm9udC1ib2xkXCI+e25vdGVzTm90aWNlfTwvc3Bhbj59XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXktYXV0byBzcGFjZS15LTIgcHItMSBtYXgtaC02NCBtaW4taC1bMTgwcHhdIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0yLjVcIj5cbiAgICAgICAgICAgICAge25vdGVzTGlzdC5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDAgdGV4dC1jZW50ZXIgcHktOFwiPkNoXHUwMUIwYSBjXHUwMEYzIGdoaSBjaFx1MDBGQSBcdTIwMTQgdGhcdTAwRUFtIGRcdTAwRjJuZyBcdTAxMTFcdTFFQTd1IHRpXHUwMEVBbiBjaG8gY1x1MUVBMyBwaFx1MDBGMm5nLjwvcD5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICBub3Rlc0xpc3QubWFwKChuKSA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17bi5pZH0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1zdGFydCBnYXAtMiBncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBmbGV4LXdyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTQwMFwiPntuLnRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bi52aWRlb1RpbWVTZWMgIT0gbnVsbCAmJiBuLnZpZGVvVGltZVNlYyA+IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geWV1Q2F1VHVhKG4udmlkZW9UaW1lU2VjKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCBob3ZlcjpiZy12aW9sZXQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2IHtkaW5oRGFuZ0dpYXlQaHV0KG4udmlkZW9UaW1lU2VjKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTYwMCBmb250LW1vbm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge24udGFvTHVjID8gbmV3IERhdGUobi50YW9MdWMucmVwbGFjZSgnICcsICdUJykgKyAnWicpLnRvTG9jYWxlVGltZVN0cmluZyhbXSwgeyBob3VyOiAnMi1kaWdpdCcsIG1pbnV0ZTogJzItZGlnaXQnIH0pIDogJyd9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTIwMCBsZWFkaW5nLXJlbGF4ZWQgYnJlYWstd29yZHNcIj57bi5ub2lEdW5nfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIHsobi5jdWFUb2kgfHwgaXNTdGFmZikgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geG9hR2hpQ2h1KG4uaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJYb1x1MDBFMSBnaGkgY2hcdTAwRkFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHRleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtcm9zZS00MDAgdGV4dC1bMTBweF0gcHgtMSB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICB7bm90ZXNDYW5Xcml0ZSA/IChcbiAgICAgICAgICAgICAgPGZvcm1cbiAgICAgICAgICAgICAgICBvblN1Ym1pdD17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICBpZiAoIWUubmF0aXZlRXZlbnQ/LmlzQ29tcG9zaW5nICYmICFub3RlQ29tcG9zaW5nUmVmLmN1cnJlbnQpIHRoZW1HaGlDaHUoKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgaWQ9XCJzdHVkeS1ub3RlLWlucHV0XCJcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtub3RlSW5wdXR9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXROb3RlSW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0PXsoKSA9PiB7IG5vdGVDb21wb3NpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPXsoKSA9PiB7IG5vdGVDb21wb3NpbmdSZWYuY3VycmVudCA9IGZhbHNlOyB9fVxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJUaFx1MDBFQW0gZ2hpIGNoXHUwMEZBIGNobyBwaFx1MDBGMm5nLi4uXCJcbiAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17MTAwMH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwIHJvdW5kZWQteGwgcHgtMyBweS0yIHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0Tm90ZVdpdGhUaW1lKHYgPT4gIXYpfVxuICAgICAgICAgICAgICAgICAgdGl0bGU9e25vdGVXaXRoVGltZSA/ICdcdTAxMTBhbmcgZ1x1MUVBRm4gbVx1MUVEMWMgdmlkZW8gdlx1MDBFMG8gZ2hpIGNoXHUwMEZBJyA6ICdLaFx1MDBGNG5nIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvJ31cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTIuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7bm90ZVdpdGhUaW1lID8gJ2JnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlci12aW9sZXQtNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNTAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICAgICAgICBcdTIzRjFcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLWFkZC1ub3RlXCJcbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshbm90ZUlucHV0LnRyaW0oKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMiByb3VuZGVkLXhsIGJnLVsjMDBGMkZFXSB0ZXh0LWJsYWNrIHRleHQteHMgZm9udC1ibGFjayBkaXNhYmxlZDpvcGFjaXR5LTMwXCI+XG4gICAgICAgICAgICAgICAgICBUaFx1MDBFQW1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1hbWJlci0zMDAvODAgdGV4dC1jZW50ZXIgcHktMVwiPlx1RDgzRFx1REQxMiBHaGkgY2hcdTAwRkEgXHUwMTExYW5nIFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgY2hcdTFFQzkgeGVtIFx1MjAxNCBxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZyBcdTAxMTFcdTAwRTMga2hcdTAwRjNhLjwvcD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRBQiAzOiBCXHUxRUEyTkcgVlx1MUVCQyBDXHUxRUQ4TkcgVFx1MDBDMUMgKFNIQVJFRCBXSElURUJPQVJEKSAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICd3aGl0ZWJvYXJkJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMlwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgZmxleC13cmFwIHRleHQteHMgcGItMVwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi13Yi1wZW5cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0V2JUb29sKCdwZW4nKX1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshd2JDYW5Xcml0ZX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTIuNSBweS0xIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgZGlzYWJsZWQ6b3BhY2l0eS00MCAke3diVG9vbCA9PT0gJ3BlbicgPyAnYmctWyMwMEYyRkVdIHRleHQtYmxhY2snIDogJ2JnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwJ31gfT5cbiAgICAgICAgICAgICAgICAgIFx1MjcwRlx1RkUwRiBCXHUwMEZBdCB2XHUxRUJEXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi13Yi1lcmFzZXJcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0V2JUb29sKCdlcmFzZXInKX1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshd2JDYW5Xcml0ZX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTIuNSBweS0xIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgZGlzYWJsZWQ6b3BhY2l0eS00MCAke3diVG9vbCA9PT0gJ2VyYXNlcicgPyAnYmctcm9zZS01MDAgdGV4dC13aGl0ZScgOiAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAnfWB9PlxuICAgICAgICAgICAgICAgICAgXHVEODNFXHVEREY5IFRcdTFFQTl5XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBtbC0yXCI+XG4gICAgICAgICAgICAgICAgICB7WycjMDBGMkZFJywgJyNGRkI4MDAnLCAnI0Y0M0Y1RScsICcjRkZGRkZGJ10ubWFwKGMgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAga2V5PXtjfVxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshd2JDYW5Xcml0ZX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldFdiQ29sb3IoYyk7IHNldFdiVG9vbCgncGVuJyk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy01IGgtNSByb3VuZGVkLWZ1bGwgYm9yZGVyIGRpc2FibGVkOm9wYWNpdHktNDAgJHt3YkNvbG9yID09PSBjICYmIHdiVG9vbCA9PT0gJ3BlbicgPyAnc2NhbGUtMTEwIGJvcmRlci13aGl0ZSByaW5nLTIgcmluZy1jeWFuLTQwMCcgOiAnYm9yZGVyLXRyYW5zcGFyZW50J31gfVxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6IGMgfX1cbiAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17Y31cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAge2lzU3RhZmYgJiYgKFxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4td2ItY2xlYXJcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17Y2xlYXJXaGl0ZWJvYXJkfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy13aGl0ZS81IGhvdmVyOmJnLXJvc2UtNTAwLzIwIHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXhzIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgWFx1MDBGM2EgYlx1MUVBM25nXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgb3ZlcmZsb3ctaGlkZGVuIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJlbGF0aXZlIHRvdWNoLW5vbmUgbWluLWgtWzIyMHB4XVwiPlxuICAgICAgICAgICAgICB7IXdiQ2FuV3JpdGUgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgaW5zZXQtMCB6LTEwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLWJsYWNrLzQwIHRleHQtWzExcHhdIHRleHQtYW1iZXItMzAwLzkwIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgXHVEODNEXHVERDEyIEJcdTFFQTNuZyB2XHUxRUJEIFx1MDExMWFuZyBcdTFFREYgY2hcdTFFQkYgXHUwMTExXHUxRUQ5IGNoXHUxRUM5IHhlbVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8Y2FudmFzXG4gICAgICAgICAgICAgICAgaWQ9XCJzdHVkeS13aGl0ZWJvYXJkLWNhbnZhc1wiXG4gICAgICAgICAgICAgICAgcmVmPXtjYW52YXNSZWZ9XG4gICAgICAgICAgICAgICAgd2lkdGg9ezY0MH1cbiAgICAgICAgICAgICAgICBoZWlnaHQ9ezMyMH1cbiAgICAgICAgICAgICAgICBvbk1vdXNlRG93bj17d2JDYW5Xcml0ZSA/IHN0YXJ0RHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvbk1vdXNlTW92ZT17d2JDYW5Xcml0ZSA/IGRyYXdNb3ZlIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uTW91c2VVcD17d2JDYW5Xcml0ZSA/IHN0b3BEcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17d2JDYW5Xcml0ZSA/IHN0b3BEcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uVG91Y2hTdGFydD17d2JDYW5Xcml0ZSA/IHN0YXJ0RHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvblRvdWNoTW92ZT17d2JDYW5Xcml0ZSA/IGRyYXdNb3ZlIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uVG91Y2hFbmQ9e3diQ2FuV3JpdGUgPyBzdG9wRHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgaC1mdWxsICR7d2JDYW5Xcml0ZSA/ICdjdXJzb3ItY3Jvc3NoYWlyJyA6ICdjdXJzb3Itbm90LWFsbG93ZWQnfWB9XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDQ6IEJcdTFFQTJORyBUXHUwMENETkggQ1x1MUVEOE5HIFRcdTAwQzFDIChTSEFSRUQgU0hFRVQgOHgxMCkgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAnc2hlZXQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0yIG92ZXJmbG93LXgtYXV0b1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgICBCXHUxRUEzbmcgdFx1MDBFRG5oIHBoXHUwMEUybiB0XHUwMEVEY2ggc1x1MUVEMSBsaVx1MUVDN3UgLyBtXHUxRUQxYyB0aFx1MUVERGkgZ2lhbiBoXHUxRUNEYyB0XHUxRUFEcCAoTFx1MDFCMHUgdFx1MUVGMSBcdTAxMTFcdTFFRDluZylcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3ctYXV0byBtYXgtaC03MiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgYmctWyMwQjBFMTRdXCI+XG4gICAgICAgICAgICAgIDx0YWJsZSBpZD1cInN0dWR5LXNoZWV0LXRhYmxlXCIgY2xhc3NOYW1lPVwidy1mdWxsIHRleHQteHMgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyLWNvbGxhcHNlXCI+XG4gICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImJnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwidy04IHAtMSB0ZXh0LWNlbnRlciBib3JkZXItciBib3JkZXItd2hpdGUvMTAgdGV4dC1bMTBweF1cIj4jPC90aD5cbiAgICAgICAgICAgICAgICAgICAge0NPTFMubWFwKGMgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgIDx0aCBrZXk9e2N9IGNsYXNzTmFtZT1cInAtMS41IHRleHQtY2VudGVyIGJvcmRlci1yIGJvcmRlci13aGl0ZS8xMCBtaW4tdy1bNzBweF0gdGV4dC1bMTFweF0gZm9udC1ib2xkIHRleHQtY3lhbi0zMDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtjfVxuICAgICAgICAgICAgICAgICAgICAgIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgIHtST1dTLm1hcChyID0+IChcbiAgICAgICAgICAgICAgICAgICAgPHRyIGtleT17cn0gY2xhc3NOYW1lPVwiYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvWzAuMDJdXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMSB0ZXh0LWNlbnRlciBiZy13aGl0ZS81IHRleHQtc2xhdGUtNTAwIGZvbnQtbW9ubyB0ZXh0LVsxMHB4XSBib3JkZXItciBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtyfVxuICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAge0NPTFMubWFwKGMgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2VsbEtleSA9IGAke2N9JHtyfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQga2V5PXtjZWxsS2V5fSBjbGFzc05hbWU9XCJwLTAgYm9yZGVyLXIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtY2VsbD17Y2VsbEtleX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtzaGVldENlbGxzW2NlbGxLZXldIHx8ICcnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVhZE9ubHk9eyFzaGVldENhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Gb2N1cz17KCkgPT4geyBzaGVldEZvY3VzZWRDZWxsUmVmLmN1cnJlbnQgPSBjZWxsS2V5OyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoKSA9PiB7IHNoZWV0Rm9jdXNlZENlbGxSZWYuY3VycmVudCA9IG51bGw7IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzaGVldENhbldyaXRlICYmIGhhbmRsZUNlbGxDaGFuZ2UoY2VsbEtleSwgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIGJnLXRyYW5zcGFyZW50IHB4LTIgcHktMSB0ZXh0LXhzIHRleHQtd2hpdGUgZm9jdXM6YmctWyMxNTFBMjNdIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1bIzAwRjJGRV0gJHshc2hlZXRDYW5Xcml0ZSA/ICdvcGFjaXR5LTYwIGN1cnNvci1ub3QtYWxsb3dlZCcgOiAnJ31gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNTogMS1UTy0xIFdFQlJUQyBWT0lDRSBcdTIwMTQgcGFpci1ib3VuZCwgY1x1MDBGMyB4aW4gcXV5XHUxRUMxbiAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICd2b2ljZScgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNiB0ZXh0LWNlbnRlciBnYXAtNFwiPlxuICAgICAgICAgICAgPGF1ZGlvIHJlZj17cmVtb3RlQXVkaW9SZWZ9IGF1dG9QbGF5IC8+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTYgaC0xNiByb3VuZGVkLTN4bCBiZy1hbWJlci00MDAvMTUgYm9yZGVyIGJvcmRlci1hbWJlci00MDAvMzAgdGV4dC1hbWJlci00MDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC0zeGwgc2hhZG93LVswXzBfMjBweF9yZ2JhKDI0NSwxNTgsMTEsMC4yKV1cIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERjk5XHVGRTBGXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC13aGl0ZVwiPlRob1x1MUVBMWkgVHJcdTFFRjFjIFRpXHUxRUJGcCAxLTEgVHJvbmcgUGhcdTAwRjJuZzwvaDQ+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDAgbWF4LXcteHMgbXQtMVwiPlxuICAgICAgICAgICAgICAgIE1cdTFFRDdpIHBoXHUwMEYybmcgdFx1MUVEMWkgXHUwMTExYSBtXHUxRUQ5dCBjXHUxRUI3cCB2b2ljZSAxLTEuIE1pY3JvIG1cdTFFQjdjIFx1MDExMVx1MUVDQm5oIHRcdTFFQUZ0IGtoaSBjaFx1MDFCMGEgYlx1MUVBRHQuXG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogVHJcdTFFQTFuZyB0aFx1MDBFMWkgY1x1MUVCN3AgaGlcdTFFQzduIHRcdTFFQTFpICovfVxuICAgICAgICAgICAge3ZvaWNlUGFpcj8uYWN0aXZlICE9PSB1bmRlZmluZWQgJiYgKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgYmctd2hpdGUvNSBweC0zIHB5LTEgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgICB7dm9pY2VQYWlyPy5hVGVuID8gYCR7dm9pY2VQYWlyLmFUZW59JHt2b2ljZVBhaXIuYlRlbiA/ICcgXHUyMTk0ICcgKyB2b2ljZVBhaXIuYlRlbiA6ICcgXHUwMEI3IFx1MDExMWFuZyBjaFx1MUVERCBuZ1x1MDFCMFx1MUVERGkgdGhcdTFFRTkgMid9YCA6ICdDaFx1MDFCMGEgY1x1MDBGMyBjXHUxRUI3cCB2b2ljZSBuXHUwMEUwbyd9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgZmxleC13cmFwIGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgICAgICAgIHshdm9pY2VKb2luZWQgPyAoXG4gICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgIHtjb1F1eWVuKCd2b2ljZScpID8gKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2Utam9pblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17am9pblZvaWNlfVxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt2b2ljZVBhaXI/LmFjdGl2ZSAmJiAhdm9pY2VQYWlyPy55b3VJbn1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIuNSByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tb3JhbmdlLTUwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC14cyBzaGFkb3ctbGcgaG92ZXI6b3BhY2l0eS05MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS00MFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHt2b2ljZVBhaXI/LmFjdGl2ZSA/ICdcdTAxMTBhbmcgY1x1MDBGMyBjXHUxRUI3cCB2b2ljZSBraFx1MDBFMWMnIDogdm9pY2VQYWlyPy5hVGVuID8gJ1ZcdTAwRTBvIGNcdTFFQjdwIHZcdTFFREJpICcgKyB2b2ljZVBhaXIuYVRlbiA6ICdUaGFtIGdpYSB2b2ljZSd9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLXJlcXVlc3RcIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3hpblF1eWVuVm9pY2V9XG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZvaWNlUmVxdWVzdGVkfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMi41IHJvdW5kZWQteGwgYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0yMDAgYm9yZGVyIGJvcmRlci13aGl0ZS8xNSBmb250LWJvbGQgdGV4dC14cyBob3ZlcjpiZy13aGl0ZS8xNSB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3ZvaWNlUmVxdWVzdGVkID8gJ1x1MjNGMyBcdTAxMTBhbmcgY2hcdTFFREQgZHV5XHUxRUM3dFx1MjAyNicgOiAnXHVEODNEXHVERTRCIFhpbiBxdXlcdTFFQzFuIHZvaWNlJ31cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS10b2dnbGUtbWljXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlTWljfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC00IHB5LTIuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHttaWNNdXRlZCA/ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3ZlcjpiZy13aGl0ZS8xNScgOiAnYmctZW1lcmFsZC01MDAgdGV4dC1ibGFjayd9YH0+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPnttaWNNdXRlZCA/ICdcdUQ4M0RcdUREMDcgQlx1MUVBRHQgTWljJyA6ICdcdUQ4M0NcdURGOTlcdUZFMEYgTWljIFx1MDExMGFuZyBCXHUxRUFEdCd9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1sZWF2ZVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2xlYXZlVm9pY2V9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMi41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMjAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzMwIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgIFJcdTFFRERpIHZvaWNlXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAge2lzU3RhZmYgJiYgdm9pY2VQYWlyPy5hVGVuICYmICF2b2ljZVBhaXI/LnlvdUluICYmIChcbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLWVuZFwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtuZ2F0Vm9pY2VDYXB9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzEwIHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8yNSB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8yMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgTmdcdTFFQUZ0IGNcdTFFQjdwIHZvaWNlXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFN0YWZmOiBkYW5oIHNcdTAwRTFjaCB4aW4gcXV5XHUxRUMxbiB2b2ljZSAqL31cbiAgICAgICAgICAgIHtpc1N0YWZmICYmIHlldUNhdVZvaWNlLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy1zbSBiZy13aGl0ZS81IGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTIuNSB0ZXh0LWxlZnRcIj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHRleHQtYW1iZXItMzAwIG1iLTEuNVwiPlx1MDExMGFuZyB4aW4gcXV5XHUxRUMxbiB2b2ljZTwvcD5cbiAgICAgICAgICAgICAgICB7eWV1Q2F1Vm9pY2UubWFwKHIgPT4gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3Iua2hvYX0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyBweS0xXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtMjAwIGZvbnQtc2VtaWJvbGQgZmxleC0xIHRydW5jYXRlXCI+e3IudGVuIHx8ICdUaFx1MDBFMG5oIHZpXHUwMEVBbid9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4geyBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiByLmtob2EsIGNhcGFiaWxpdHk6ICd2b2ljZScsIG9uOiB0cnVlIH0pOyBpZiAoZD8ub2spIHNldFlldUNhdVZvaWNlKHByZXYgPT4gcHJldi5maWx0ZXIoeCA9PiB4Lmtob2EgIT09IHIua2hvYSkpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctZW1lcmFsZC01MDAvMjAgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIER1eVx1MUVDN3RcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHIua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246IGZhbHNlIH0pOyBpZiAoZD8ub2spIHNldFlldUNhdVZvaWNlKHByZXYgPT4gcHJldi5maWx0ZXIoeCA9PiB4Lmtob2EgIT09IHIua2hvYSkpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzI1IHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgIFRcdTFFRUIgY2hcdTFFRDFpXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAge3ZvaWNlTm90aWNlICYmIChcbiAgICAgICAgICAgICAgPHAgaWQ9XCJ2b2ljZS1zdGF0dXMtbm90aWNlXCIgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTMwMCBmb250LW1vbm8gYmctYmxhY2svNDAgcHgtMyBweS0xLjUgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICB7dm9pY2VOb3RpY2V9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCBtYXgtdy14c1wiPlxuICAgICAgICAgICAgICAqIEdoaSBjaFx1MDBGQTogS1x1MUVCRnQgblx1MUVEMWkgdGhvXHUxRUExaSBQMlAgeVx1MDBFQXUgY1x1MUVBN3UgbVx1MUVBMW5nIGtoXHUwMEY0bmcgY2hcdTFFQjduIFVEUC4gUmVzdHJpY3RpdmUgTkFUIGNcdTAwRjMgdGhcdTFFQzMgY1x1MUVBN24gcmVsYXkgVFVSTi5cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDc6IFRIXHUwMEMwTkggVklcdTAwQ0FOIFRST05HIFBIXHUwMEQyTkcgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAnbWVtYmVycycgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTMgb3ZlcmZsb3cteS1hdXRvIG1heC1oLTgwIGxnOm1heC1oLVs0MjBweF0gcHItMVwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcGItMiBib3JkZXItYiBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJsYWNrIHRleHQtd2hpdGUgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REM2NTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5UaFx1MDBFMG5oIHZpXHUwMEVBbiB0cm9uZyBwaFx1MDBGMm5nICh7dGhhbmhWaWVuLmxlbmd0aH0pPC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICAgICAgXHUwMTEwYW5nIHRyXHUxRUYxYyB0dXlcdTFFQkZuXG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTJcIj5cbiAgICAgICAgICAgICAge3RoYW5oVmllbi5tYXAoKHR2LCBpZHgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBsYUhvc3QgPSB0di5sYUNodVBob25nID09PSAxIHx8IHR2LnZhaVRyb1Bob25nID09PSAnaG9zdCc7XG4gICAgICAgICAgICAgICAgY29uc3QgbGFHViA9IHR2LnZhaVRybyA9PT0gJ2dpYW9fdmllbic7XG4gICAgICAgICAgICAgICAgY29uc3QgbGFDb0hvc3QgPSB0di52YWlUcm9QaG9uZyA9PT0gJ2NvaG9zdCc7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JhbnRWb2ljZSA9IGdyYW50cy5zb21lKGcgPT4gZy5raG9hVFYgPT09IHR2Lmtob2EgJiYgZy5jYXBhYmlsaXR5ID09PSAndm9pY2UnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBncmFudFZpZGVvID0gZ3JhbnRzLnNvbWUoZyA9PiBnLmtob2FUViA9PT0gdHYua2hvYSAmJiBnLmNhcGFiaWxpdHkgPT09ICd2aWRlb19jb250cm9sJyk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICBrZXk9e3R2Lmtob2EgfHwgdHYudGVuIHx8IGlkeH1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSBwLTIuNSByb3VuZGVkLXhsIGJnLXdoaXRlL1swLjAzXSBob3ZlcjpiZy13aGl0ZS9bMC4wNl0gYm9yZGVyIGJvcmRlci13aGl0ZS81IHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLWZ1bGwgYmctZ3JhZGllbnQtdG8tYnIgZnJvbS10ZWFsLTUwMC8yMCB0by1lbWVyYWxkLTUwMC8yMCBib3JkZXIgYm9yZGVyLXRlYWwtNTAwLzMwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteHMgZm9udC1ibGFjayB0ZXh0LXRlYWwtMzAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3R2LmF2YXRhciA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXt0di5hdmF0YXJ9IGFsdD1cIlwiIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgcm91bmRlZC1mdWxsIG9iamVjdC1jb3ZlclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICh0di50ZW4gfHwgJz8nKS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTIwMCB0cnVuY2F0ZVwiPnt0di50ZW59PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2xhSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNEXHVEQzUxIEhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUdWICYmICFsYUhvc3QgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzQ1x1REY5MyBHaVx1MDBFMW8gdmlcdTAwRUFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICB7bGFDb0hvc3QgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MkI1MCBDby1ob3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgYmxvY2sgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt0di5sb3BUZW4gPyBgTFx1MUVEQnAgJHt0di5sb3BUZW59YCA6IChsYUdWID8gJ0dpXHUwMEUxbyB2aVx1MDBFQW4gdHJcdTAxQjBcdTFFRERuZycgOiAnSFx1MUVDRGMgc2luaCcpfVxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgey8qIE1lbWJlciBhY3Rpb25zIG5cdTFFQkZ1IGxcdTAwRTAgaG9zdC9HViAqL31cbiAgICAgICAgICAgICAgICAgICAgeyh2YWlUcm9QaG9uZyA9PT0gJ2hvc3QnIHx8IGF1dGgudXNlcj8uaXNUZWFjaGVyKSAmJiAhbGFIb3N0ICYmIHR2Lmtob2EgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/Lignc2V0X2NvX2hvc3QnLCB7IGtob2FUVjogdHYua2hvYSwgb246ICFsYUNvSG9zdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2xhQ29Ib3N0ID8gJ1RodSBxdXlcdTFFQzFuIGNvLWhvc3QnIDogJ0NcdTFFQTVwIGNvLWhvc3QnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFDb0hvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlci12aW9sZXQtNTAwLzQwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjby1ob3N0XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246ICFncmFudFZvaWNlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNcdTFFQTVwL3RodSBxdXlcdTFFQzFuIG1pY1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNiBoLTYgcm91bmRlZCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LVsxMHB4XSBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFudFZvaWNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC80MCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERjk5XHVGRTBGXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZpZGVvX2NvbnRyb2wnLCBvbjogIWdyYW50VmlkZW8gfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gdmlkZW9cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTYgaC02IHJvdW5kZWQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTBweF0gYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JhbnRWaWRlb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctYmx1ZS01MDAvMjAgdGV4dC1ibHVlLTMwMCBib3JkZXItYmx1ZS01MDAvNDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzQ1x1REZBNVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpcm0oYEtpY2sgJHt0di50ZW59IGtoXHUxRUNGaSBwaFx1MDBGMm5nP2ApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdraWNrJywgeyBraG9hVFY6IHR2Lmtob2EgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZCAmJiAhZC5vaykgYWxlcnQoZC5sb2kgfHwgJ0toXHUwMEY0bmcga2ljayBcdTAxMTFcdTAxQjBcdTFFRTNjLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJLaWNrIGtoXHUxRUNGaSBwaFx1MDBGMm5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy02IGgtNiByb3VuZGVkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGJvcmRlciBiZy1yb3NlLTUwMC8xMCB0ZXh0LXJvc2UtMzAwIGJvcmRlci1yb3NlLTUwMC8yNSBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSl9XG5cbiAgICAgICAgICAgICAge3RoYW5oVmllbi5sZW5ndGggPT09IDAgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgcHktOCB0ZXh0LXNsYXRlLTUwMCB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgICBDaFx1MDFCMGEgY1x1MDBGMyB0aFx1MDBFMG5oIHZpXHUwMEVBbiBuXHUwMEUwbyB0cm9uZyBwaFx1MDBGMm5nLlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRBQiA4OiBDXHUxRUE0VSBIXHUwMENDTkggVklERU8gJiBIXHUwMEMwTkcgXHUwMTEwXHUxRUUySSAoSG9zdCAvIFN0YWZmKSAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdjb25maWcnICYmIChjYW5Db250cm9sIHx8IGlzU3RhZmYpICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0zLjUgb3ZlcmZsb3cteS1hdXRvIG1heC1oLTgwIGxnOm1heC1oLVs0MjBweF0gcHItMSB0ZXh0LXhzXCI+XG4gICAgICAgICAgICB7LyogMS4gXHUwMTEwXHUxRUQ1aSB2aWRlbyBcdTAxMTFhbmcgcGhcdTAwRTF0ICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtMyBmbGV4IGZsZXgtY29sIGdhcC0yXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdGV4dC1zbGF0ZS00MDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REZBNTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTAxMTBcdTFFRDVpIHZpZGVvIFx1MDExMWFuZyBwaFx1MDBFMXQgbmdheTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICBpZD1cImlucHV0LWNvbmZpZy12aWRlby1tb2lcIlxuICAgICAgICAgICAgICAgICAgdHlwZT1cInVybFwiXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17dmlkZW9Nb2l9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRWaWRlb01vaShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICBvbktleURvd249e2UgPT4geyBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgdmlkZW9Nb2kudHJpbSgpKSB7IGUucHJldmVudERlZmF1bHQoKTsgZG9pVmlkZW8oKTsgfSB9fVxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJEXHUwMEUxbiBsaW5rIFlvdVR1YmUgLyB2aWRlbyBtXHUxRURCaS4uLlwiXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0yLjUgcHktMS41IHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTBcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi1jb25maWctZG9pLXZpZGVvXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGRvaVZpZGVvKCl9XG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXZpZGVvTW9pLnRyaW0oKSB8fCBkYW5nRG9pVmlkZW99XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXSB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC14cyBob3ZlcjpiZy1bIzAwZTFlY10gYWN0aXZlOnNjYWxlLTk1IGRpc2FibGVkOm9wYWNpdHktMzAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgIHtkYW5nRG9pVmlkZW8gPyAnLi4uJyA6ICdcdTI1QjYgUGhcdTAwRTF0J31cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIHtjb25maWdMb2kgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1yb3NlLTQwMFwiPntjb25maWdMb2l9PC9wPn1cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogMi4gSFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdmlkZW8gKFF1ZXVlKSAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTMgZmxleCBmbGV4LWNvbCBnYXAtMi41XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQ0I8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5IXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB2aWRlbyAoe3F1ZXVlTGlzdC5maWx0ZXIocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpLmxlbmd0aH0pPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7cXVldWVMaXN0LnNvbWUocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpICYmIChcbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3NraXAnKX1cbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMiBweS0wLjUgcm91bmRlZC1tZCBiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLWFtYmVyLTUwMC8yNSBkaXNhYmxlZDpvcGFjaXR5LTQwXCI+XG4gICAgICAgICAgICAgICAgICAgIFx1MjNFRCBCXHUxRUNGIHF1YSAvIFRpXHUxRUJGcCB0aGVvXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogXHUwMEQ0IHRoXHUwMEVBbSB2aWRlbyB2XHUwMEUwbyBxdWV1ZSAqL31cbiAgICAgICAgICAgICAgPFF1ZXVlSW5wdXRcbiAgICAgICAgICAgICAgICBvbkFkZD17KHUsIHQpID0+IGhhbmhEb25nUXVldWUoJ2VucXVldWUnLCB7IHZpZGVvVXJsOiB1LCB0aXRsZTogdCB9KX1cbiAgICAgICAgICAgICAgICBvbkFkZE5leHQ9eyh1LCB0KSA9PiBoYW5oRG9uZ1F1ZXVlKCdhZGRfbmV4dCcsIHsgdmlkZW9Vcmw6IHUsIHRpdGxlOiB0IH0pfVxuICAgICAgICAgICAgICAvPlxuXG4gICAgICAgICAgICAgIHsvKiBEYW5oIHNcdTAwRTFjaCBxdWV1ZSAqL31cbiAgICAgICAgICAgICAge3F1ZXVlTGlzdC5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDAgcHktMiB0ZXh0LWNlbnRlclwiPkhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHRyXHUxRUQxbmcgXHUyMDE0IHRoXHUwMEVBbSBsaW5rIHZpZGVvIFx1MDExMVx1MUVDMyBwaFx1MDBFMXQgbFx1MUVBN24gbFx1MDFCMFx1MUVFM3QuPC9wPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjUgbWF4LWgtNDggb3ZlcmZsb3cteS1hdXRvIHByLTFcIj5cbiAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3QubWFwKChxLCBpZHgpID0+IChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3EuaWQgfHwgaWR4fSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQtbGcgcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdy01IGgtNSByb3VuZGVkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGZvbnQtYmxhY2sgc2hyaW5rLTAgJHtxLnRyYW5nVGhhaSA9PT0gJ3BsYXlpbmcnID8gJ2JnLWVtZXJhbGQtNTAwLzIwIHRleHQtZW1lcmFsZC0zMDAnIDogJ2JnLXdoaXRlLzEwIHRleHQtc2xhdGUtNDAwJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRyYW5nVGhhaSA9PT0gJ3BsYXlpbmcnID8gJ1x1MjVCNicgOiBpZHggKyAxfVxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICB7cS50aHVtYiAmJiA8aW1nIHNyYz17cS50aHVtYn0gYWx0PVwiXCIgY2xhc3NOYW1lPVwidy0xMCBoLTYgcm91bmRlZCBvYmplY3QtY292ZXIgc2hyaW5rLTBcIiBsb2FkaW5nPVwibGF6eVwiIC8+fVxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtMjAwIGZvbnQtbWVkaXVtIHRydW5jYXRlXCI+e3EudGl0bGUgfHwgcS52aWRlb1VybH08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNTAwIHRydW5jYXRlXCI+dGhcdTAwRUFtIGJcdTFFREZpIHtxLmFkZGVkQnkgfHwgJ1x1MjAxNCd9PC9wPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJQaFx1MDBFMXQgbmdheVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgncGxheV9ub3cnLCB7IGlkOiBxLmlkIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy02IGgtNiByb3VuZGVkIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSB0ZXh0LVsxMHB4XSBmb250LWJsYWNrIGhvdmVyOmJnLVsjMDBGMkZFXS8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICB7cS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiWFx1MDBGM2Ega2hcdTFFQ0ZpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdyZW1vdmUnLCB7IGlkOiBxLmlkIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy02IGgtNiByb3VuZGVkIGJnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS0zMDAgdGV4dC1bMTBweF0gZm9udC1ibGFjayBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIDMuIFRcdTAwRjl5IGNoXHUxRUNEbiBwaFx1MDBGMm5nICYgXHUwMTEwXHUwMEYzbmcgcGhcdTAwRjJuZyAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTMgZmxleCBmbGV4LWNvbCBnYXAtMi41XCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgICBcdTI2OTlcdUZFMEYgVGhhbyB0XHUwMEUxYyBwaFx1MDBGMm5nXG4gICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICB7LyogXHUwMTEwXHUxRUQ1aS9iXHUxRUNGIG1cdTFFQUR0IGtoXHUxRUE5dSAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiTVx1MUVBRHQga2hcdTFFQTl1IG1cdTFFREJpIChcdTAxMTFcdTFFQzMgdHJcdTFFRDFuZyA9IGJcdTFFQ0YpXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtY29uZmlnLW1hdC1raGF1LW1vaVwiXG4gICAgICAgICAgICAgICAgICBtYXhMZW5ndGg9ezEwMH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIHB4LTIuNSBweS0xLjUgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MFwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wdXQtY29uZmlnLW1hdC1raGF1LW1vaScpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtayA9IGVsPy52YWx1ZSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IG1rLnRyaW0oKVxuICAgICAgICAgICAgICAgICAgICAgID8gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdkb2lfbWF0X2toYXUnLCB7IG1hdEtoYXVNb2k6IG1rLnRyaW0oKSB9KVxuICAgICAgICAgICAgICAgICAgICAgIDogYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdib19tYXRfa2hhdScsIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGQgJiYgIWQub2spIGFsZXJ0KGQubG9pIHx8ICdLaFx1MDBGNG5nIFx1MDExMVx1MUVENWkgXHUwMTExXHUwMUIwXHUxRUUzYyBtXHUxRUFEdCBraFx1MUVBOXUuJyk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgYWxlcnQoJ1x1MDExMFx1MDBFMyBjXHUxRUFEcCBuaFx1MUVBRHQgbVx1MUVBRHQga2hcdTFFQTl1IHBoXHUwMEYybmcgdGhcdTAwRTBuaCBjXHUwMEY0bmcuJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbCkgZWwudmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMS41IHJvdW5kZWQtbGcgYmctYW1iZXItNTAwLzE1IHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1hbWJlci01MDAvMjUgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgIFx1MDExMFx1MUVENWkgTUtcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgey8qIE5cdTAwRkF0IFx1MDExMVx1MDBGM25nIHBoXHUwMEYybmcgKi99XG4gICAgICAgICAgICAgIHtkb25nUGhvbmdIaWVuVGFpICYmIHBob25nLmNodVBob25nS2hvYSAhPT0gJ2hlLXRob25nJyAmJiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi1jb25maWctZG9uZy1waG9uZ1wiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25maXJtKCdCXHUxRUExbiBjXHUwMEYzIGNoXHUxRUFGYyBjaFx1MUVBRm4gbXVcdTFFRDFuIFx1MDExMVx1MDBGM25nIHBoXHUwMEYybmcgaFx1MUVDRGMgblx1MDBFMHkga2hcdTAwRjRuZz8nKSkge1xuICAgICAgICAgICAgICAgICAgICAgIGRvbmdQaG9uZ0hpZW5UYWkoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweS0yIHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTUgaG92ZXI6Ymctcm9zZS01MDAvMjUgdGV4dC1yb3NlLTMwMCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REVEMTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MDExMFx1MDBGM25nIHBoXHUwMEYybmcgaFx1MUVDRGMgblx1MDBFMHk8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDY6IFFVXHUxRUEyTiBUUlx1MUVDQSBQSFx1MDBEMk5HIChzdGFmZiBvbmx5KSBcdTIwMTQgcG9saWN5IG1hdHJpeCArIG1lbWJlciBhY3Rpb25zICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ3F1YW4tdHJpJyAmJiBpc1N0YWZmICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0zIG92ZXJmbG93LXktYXV0byBtYXgtaC04MCBwci0xXCI+XG4gICAgICAgICAgICB7LyogUXVpY2sgYWN0aW9ucyB0aGVvIG1cdTAwRjQgaFx1MDBFQ25oIFx1MDExMVx1MDBFMyBjaFx1MUVEMXQgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjYXAgb2YgWydub3RlcycsICd3aGl0ZWJvYXJkJywgJ3NoZWV0J10pIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdwb2xpY3knLCB7IGNhcGFiaWxpdHk6IGNhcCwgZW5hYmxlZDogMSwgYWNjZXNzTW9kZTogJ3N0YWZmX29ubHknIH0pO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xNSB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdGV4dC1bMTFweF0gZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgXHVEODNEXHVERDEyIEtoXHUwMEYzYSBjXHUxRUQ5bmcgdFx1MDBFMWMgKGNoXHUxRUM5IHhlbSlcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNhcCBvZiBbJ25vdGVzJywgJ3doaXRlYm9hcmQnLCAnc2hlZXQnXSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiAxLCBhY2Nlc3NNb2RlOiAnZXZlcnlvbmUnIH0pO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC14bCBiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtMzAwIGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMzAgdGV4dC1bMTFweF0gZm9udC1ib2xkIGhvdmVyOmJnLWVtZXJhbGQtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgXHVEODNEXHVERDEzIE1cdTFFREYgY1x1MUVEOW5nIHRcdTAwRTFjIGNobyBtXHUxRUNEaSBuZ1x1MDFCMFx1MUVERGlcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFBvbGljeSBtYXRyaXggKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0zXCI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdGV4dC1zbGF0ZS00MDAgbWItMlwiPkNoXHUwMEVEbmggc1x1MDBFMWNoIGNcdTAwRjRuZyBjXHUxRUU1PC9wPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMS41XCI+XG4gICAgICAgICAgICAgICAge1tcbiAgICAgICAgICAgICAgICAgIFsndmlkZW9fY29udHJvbCcsICdcdTAxMTBpXHUxRUMxdSBraGlcdTFFQzNuIHBoXHUwMEUxdCAocGxheS9wYXVzZS90dWEpJ10sXG4gICAgICAgICAgICAgICAgICBbJ3ZpZGVvX2NoYW5nZScsICdcdTAxMTBcdTFFRDVpIHZpZGVvIFx1MDExMWFuZyBwaFx1MDBFMXQnXSxcbiAgICAgICAgICAgICAgICAgIFsncXVldWUnLCAnSFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdmlkZW8nXSxcbiAgICAgICAgICAgICAgICAgIFsnY2hhdCcsICdDaGF0IHBoXHUwMEYybmcnXSxcbiAgICAgICAgICAgICAgICAgIFsnbm90ZXMnLCAnR2hpIGNoXHUwMEZBIGNodW5nJ10sXG4gICAgICAgICAgICAgICAgICBbJ3doaXRlYm9hcmQnLCAnQlx1MUVBM25nIHZcdTFFQkQnXSxcbiAgICAgICAgICAgICAgICAgIFsnc2hlZXQnLCAnQlx1MUVBM25nIHRcdTAwRURuaCddLFxuICAgICAgICAgICAgICAgICAgWyd2b2ljZScsICdWb2ljZSAxLTEnXSxcbiAgICAgICAgICAgICAgICAgIFsnaW52aXRlJywgJ01cdTFFRERpIG5nXHUwMUIwXHUxRUREaSB2XHUwMEUwbyBwaFx1MDBGMm5nJ10sXG4gICAgICAgICAgICAgICAgXS5tYXAoKFtjYXAsIG5oYW5dKSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBwb2wgPSBwb2xpY2llcz8uW2NhcF0gfHwgeyBlbmFibGVkOiAxLCBhY2Nlc3NfbW9kZTogJ3N0YWZmX29ubHknIH07XG4gICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17Y2FwfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmxleC0xIHRleHQtc2xhdGUtMzAwIHRydW5jYXRlXCI+e25oYW59PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdwb2xpY3knLCB7IGNhcGFiaWxpdHk6IGNhcCwgZW5hYmxlZDogcG9sLmVuYWJsZWQgPyAwIDogMSwgYWNjZXNzTW9kZTogcG9sLmFjY2Vzc19tb2RlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e3BvbC5lbmFibGVkID8gJ1x1MDExMGFuZyBiXHUxRUFEdCBcdTIwMTQgYlx1MUVBNW0gXHUwMTExXHUxRUMzIHRcdTFFQUZ0JyA6ICdcdTAxMTBhbmcgdFx1MUVBRnQgXHUyMDE0IGJcdTFFQTVtIFx1MDExMVx1MUVDMyBiXHUxRUFEdCd9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTggaC00LjUgcHgtMC41IHJvdW5kZWQtZnVsbCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgJHtwb2wuZW5hYmxlZCA/ICdiZy1lbWVyYWxkLTUwMC8zMCBib3JkZXItZW1lcmFsZC01MDAvNDAganVzdGlmeS1lbmQnIDogJ2JnLXdoaXRlLzUgYm9yZGVyLXdoaXRlLzE1IGp1c3RpZnktc3RhcnQnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdy0zIGgtMyByb3VuZGVkLWZ1bGwgJHtwb2wuZW5hYmxlZCA/ICdiZy1lbWVyYWxkLTQwMCcgOiAnYmctc2xhdGUtNTAwJ31gfT48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3BvbC5hY2Nlc3NfbW9kZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshcG9sLmVuYWJsZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiAxLCBhY2Nlc3NNb2RlOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMS41IHB5LTEgdGV4dC1bMTBweF0gdGV4dC1zbGF0ZS0yMDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTAgZGlzYWJsZWQ6b3BhY2l0eS00MFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInN0YWZmX29ubHlcIj5RdVx1MUVBM24gdHJcdTFFQ0I8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJzZWxlY3RlZF9tZW1iZXJzXCI+TVx1MUVEOXQgc1x1MUVEMSBuZ1x1MDFCMFx1MUVERGk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJldmVyeW9uZVwiPk1cdTFFQ0RpIG5nXHUwMUIwXHUxRUREaTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIG9wYWNpdHktNjBcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZsZXgtMSB0ZXh0LXNsYXRlLTQwMFwiPktpXHUxRUMzbSBkdXlcdTFFQzd0IChraWNrL3hvXHUwMEUxIHRpbik8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIGZvbnQtYm9sZCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMCByb3VuZGVkIHB4LTEuNSBweS0wLjVcIj5MVVx1MDBENE4gUVVcdTFFQTJOIFRSXHUxRUNBPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogUXVcdTFFQTNuIGxcdTAwRkQgdGhcdTAwRTBuaCB2aVx1MDBFQW4gKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0zXCI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdGV4dC1zbGF0ZS00MDAgbWItMlwiPlRoXHUwMEUwbmggdmlcdTAwRUFuICYgcXV5XHUxRUMxbiByaVx1MDBFQW5nPC9wPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMS41XCI+XG4gICAgICAgICAgICAgICAgeyh0aGFuaFZpZW4gfHwgW10pLm1hcCh0diA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUhvc3QgPSBCb29sZWFuKHR2LmxhQ2h1UGhvbmcpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgbGFHViA9IHR2LnZhaVRybyA9PT0gJ2dpYW9fdmllbic7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUNvSG9zdCA9IHR2LnZhaVRyb1Bob25nID09PSAnY29faG9zdCc7XG4gICAgICAgICAgICAgICAgICBjb25zdCBncmFudFZvaWNlID0gKGdyYW50cyB8fCBbXSkuc29tZShnID0+IGcua2hvYSA9PT0gdHYua2hvYSAmJiBnLmNhcGFiaWxpdHkgPT09ICd2b2ljZScgJiYgZy50cmFuZ1RoYWkgPT09ICdncmFudGVkJyk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBncmFudFZpZGVvID0gKGdyYW50cyB8fCBbXSkuc29tZShnID0+IGcua2hvYSA9PT0gdHYua2hvYSAmJiBnLmNhcGFiaWxpdHkgPT09ICd2aWRlb19jb250cm9sJyAmJiBnLnRyYW5nVGhhaSA9PT0gJ2dyYW50ZWQnKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXt0di5raG9hIHx8IHR2LnRlbn0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSB0ZXh0LXhzIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtMjAwIGZvbnQtc2VtaWJvbGQgdHJ1bmNhdGUgbWF4LXctWzExMHB4XVwiPnt0di50ZW59PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIHtsYUhvc3QgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LWFtYmVyLTQwMCBmb250LWJvbGRcIj5cdTI2MDUgaG9zdDwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAge2xhR1YgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LVsjMDBGMkZFXSBmb250LWJvbGRcIj5HVjwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAge2xhQ29Ib3N0ICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC12aW9sZXQtMzAwIGZvbnQtYm9sZFwiPmNvLWhvc3Q8L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgIHshbGFIb3N0ICYmICFsYUdWICYmIHR2Lmtob2EgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWwtYXV0byBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7KHZhaVRyb1Bob25nID09PSAnaG9zdCcgfHwgYXV0aC51c2VyPy5pc1RlYWNoZXIpICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/Lignc2V0X2NvX2hvc3QnLCB7IGtob2FUVjogdHYua2hvYSwgb246ICFsYUNvSG9zdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtsYUNvSG9zdCA/ICdUaHUgcXV5XHUxRUMxbiBjby1ob3N0JyA6ICdDXHUxRUE1cCBjby1ob3N0J31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgJHtsYUNvSG9zdCA/ICdiZy12aW9sZXQtNTAwLzIwIHRleHQtdmlvbGV0LTMwMCBib3JkZXItdmlvbGV0LTUwMC80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjby1ob3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHR2Lmtob2EsIGNhcGFiaWxpdHk6ICd2b2ljZScsIG9uOiAhZ3JhbnRWb2ljZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNcdTFFQTVwL3RodSBxdXlcdTFFQzFuIHZvaWNlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyICR7Z3JhbnRWb2ljZSA/ICdiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERjk5XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndmlkZW9fY29udHJvbCcsIG9uOiAhZ3JhbnRWaWRlbyB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNcdTFFQTVwL3RodSBxdXlcdTFFQzFuIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gdmlkZW9cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgJHtncmFudFZpZGVvID8gJ2JnLWN5YW4tNTAwLzIwIHRleHQtY3lhbi0zMDAgYm9yZGVyLWN5YW4tNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7IGlmIChjb25maXJtKGBLaWNrICR7dHYudGVufSBraFx1MUVDRmkgcGhcdTAwRjJuZz9gKSkgeyBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdraWNrJywgeyBraG9hVFY6IHR2Lmtob2EgfSk7IGlmIChkICYmICFkLm9rKSBhbGVydChkLmxvaSB8fCAnS2hcdTAwRjRuZyBraWNrIFx1MDExMVx1MDFCMFx1MUVFM2MuJyk7IH0gfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIktpY2sga2hcdTFFQ0ZpIHBoXHUwMEYybmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgYmctcm9zZS01MDAvMTAgdGV4dC1yb3NlLTMwMCBib3JkZXItcm9zZS01MDAvMjUgaG92ZXI6Ymctcm9zZS01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBraWNrXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICB7KHRoYW5oVmllbiB8fCBbXSkubGVuZ3RoID09PSAwICYmIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwXCI+Q2hcdTAxQjBhIGNcdTAwRjMgdGhcdTAwRTBuaCB2aVx1MDBFQW4uPC9wPn1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFx1MDExMFx1MUVENWkvYlx1MUVDRiBtXHUxRUFEdCBraFx1MUVBOXUgXHUyMDE0IGNoXHUxRUM5IGhvc3QvR1YgKi99XG4gICAgICAgICAgICB7KHZhaVRyb1Bob25nID09PSAnaG9zdCcgfHwgYXV0aC51c2VyPy5pc1RlYWNoZXIpICYmIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtMyBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiTVx1MUVBRHQga2hcdTFFQTl1IG1cdTFFREJpIChcdTAxMTFcdTFFQzMgdHJcdTFFRDFuZyA9IGJcdTFFQ0YgbVx1MUVBRHQga2hcdTFFQTl1KVwiXG4gICAgICAgICAgICAgICAgICBpZD1cImlucHV0LXBob25nLW1hdC1raGF1LW1vaVwiXG4gICAgICAgICAgICAgICAgICBtYXhMZW5ndGg9ezEwMH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIHB4LTIuNSBweS0xLjUgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MFwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wdXQtcGhvbmctbWF0LWtoYXUtbW9pJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1rID0gZWw/LnZhbHVlIHx8ICcnO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gbWsudHJpbSgpXG4gICAgICAgICAgICAgICAgICAgICAgPyBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2RvaV9tYXRfa2hhdScsIHsgbWF0S2hhdU1vaTogbWsudHJpbSgpIH0pXG4gICAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2JvX21hdF9raGF1Jywge30pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZCAmJiAhZC5vaykgYWxlcnQoZC5sb2kgfHwgJ0toXHUwMEY0bmcgXHUwMTExXHUxRUQ1aSBcdTAxMTFcdTAxQjBcdTFFRTNjIG1cdTFFQUR0IGtoXHUxRUE5dS4nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsKSBlbC52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQtbGcgYmctYW1iZXItNTAwLzE1IHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1hbWJlci01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICAgIFx1MDExMFx1MUVENWkgLyBCXHUxRUNGXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gQ2FtcHVzV2F0Y2hUb2dldGhlcih7XG4gIHBob25nLFxuICBwaG9uZ01pbmhLaG9hLFxuICBhdXRoLFxuICBkb25nUGhvbmdIaWVuVGFpLFxuICBzb05ndW9pLFxuICBteUNhcHMsXG4gIHZpZGVvVGltZVJlZixcbiAgaXNSb29tV2lkZSxcbn0pIHtcbiAgY29uc3QgW3dhdGNoU3RhdGUsIHNldFdhdGNoU3RhdGVdID0gdXNlU3RhdGUoe1xuICAgIHBsYXlpbmc6IGZhbHNlLFxuICAgIHBvc2l0aW9uU2Vjb25kczogMCxcbiAgICBiYXNlUG9zaXRpb25TZWNvbmRzOiAwLFxuICAgIHBsYXliYWNrUmF0ZTogMS4wLFxuICAgIHJldmlzaW9uOiAxLFxuICAgIHVwZGF0ZWRBdDogJycsXG4gICAgc2VydmVyTm93OiAnJyxcbiAgICB1cGRhdGVkQnk6ICcnXG4gIH0pO1xuICBjb25zdCBbY2FuQ29udHJvbCwgc2V0Q2FuQ29udHJvbF0gPSB1c2VTdGF0ZShCb29sZWFuKGF1dGg/LnVzZXI/LmlzVGVhY2hlciB8fCBwaG9uZz8uY2FuQ29udHJvbCB8fCBwaG9uZz8ubGFDaHVQaG9uZykpO1xuICBjb25zdCBbd2F0Y2hDYXBzLCBzZXRXYXRjaENhcHNdID0gdXNlU3RhdGUoe30pO1xuICBjb25zdCBnZXRJbml0aWFsVmlkZW9VcmwgPSAoKSA9PiB7XG4gICAgbGV0IGMgPSB7fTtcbiAgICB0cnkgeyBjID0gcGhvbmc/LmNhdUhpbmggPyBKU09OLnBhcnNlKHBob25nLmNhdUhpbmgpIDoge307IH0gY2F0Y2ggeyB9XG4gICAgcmV0dXJuIGMudmlkZW9VcmwgfHwgcGhvbmc/LnZpZGVvVXJsIHx8ICcnO1xuICB9O1xuXG4gIGNvbnN0IGdldEluaXRpYWxQcm92aWRlciA9ICh1KSA9PiB7XG4gICAgaWYgKCF1KSByZXR1cm4gJ1VOU1VQUE9SVEVEJztcbiAgICBpZiAoaWRZb3V0dWJlKHUpKSByZXR1cm4gJ1lPVVRVQkUnO1xuICAgIGlmIChpZEdvb2dsZURyaXZlKHUpKSByZXR1cm4gJ0dPT0dMRV9EUklWRSc7XG4gICAgaWYgKGxhVmlkZW9UcnVjVGllcEZlKHUpKSByZXR1cm4gJ05BVElWRV9IVE1MNSc7XG4gICAgcmV0dXJuICdVTlNVUFBPUlRFRCc7XG4gIH07XG5cbiAgY29uc3QgaW5pdFVybCA9IGdldEluaXRpYWxWaWRlb1VybCgpO1xuICBjb25zdCBbYWN0aXZlVmlkZW9VcmwsIHNldEFjdGl2ZVZpZGVvVXJsXSA9IHVzZVN0YXRlKGluaXRVcmwpO1xuICBjb25zdCBbcHJvdmlkZXIsIHNldFByb3ZpZGVyXSA9IHVzZVN0YXRlKCgpID0+IGdldEluaXRpYWxQcm92aWRlcihpbml0VXJsKSk7XG4gIGNvbnN0IFtoYXNJbnRlcmFjdGVkLCBzZXRIYXNJbnRlcmFjdGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2xvY2FsVGltZSwgc2V0TG9jYWxUaW1lXSA9IHVzZVN0YXRlKDApO1xuICBjb25zdCBbZHVyYXRpb24sIHNldER1cmF0aW9uXSA9IHVzZVN0YXRlKDApO1xuICBjb25zdCBbZGFuZ0d1aUxlbmgsIHNldERhbmdHdWlMZW5oXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2xvaSwgc2V0TG9pXSA9IHVzZVN0YXRlKCcnKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChwaG9uZz8uY2FuQ29udHJvbCB8fCBwaG9uZz8ubGFDaHVQaG9uZyB8fCBhdXRoPy51c2VyPy5pc1RlYWNoZXIpIHtcbiAgICAgIHNldENhbkNvbnRyb2wodHJ1ZSk7XG4gICAgfVxuICB9LCBbcGhvbmc/LmNhbkNvbnRyb2wsIHBob25nPy5sYUNodVBob25nLCBhdXRoPy51c2VyPy5pc1RlYWNoZXJdKTtcblxuICBjb25zdCB2aWRlb1JlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgeXRQbGF5ZXJSZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IHl0Q29udGFpbmVySWQgPSBgeXQtcGxheWVyLSR7cGhvbmcuaWR9YDtcbiAgY29uc3QgaXNTZWVraW5nUmVmID0gdXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgaGFzSW50ZXJhY3RlZFJlZiA9IHVzZVJlZihmYWxzZSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgYyA9IHt9O1xuICAgIHRyeSB7IGMgPSBwaG9uZz8uY2F1SGluaCA/IEpTT04ucGFyc2UocGhvbmcuY2F1SGluaCkgOiB7fTsgfSBjYXRjaCB7IH1cbiAgICBjb25zdCBuZXh0VXJsID0gYy52aWRlb1VybCB8fCBwaG9uZz8udmlkZW9VcmwgfHwgJyc7XG4gICAgaWYgKG5leHRVcmwgJiYgbmV4dFVybCAhPT0gYWN0aXZlVmlkZW9VcmwpIHtcbiAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKG5leHRVcmwpO1xuICAgICAgc2V0UHJvdmlkZXIoZ2V0SW5pdGlhbFByb3ZpZGVyKG5leHRVcmwpKTtcbiAgICB9XG4gIH0sIFtwaG9uZz8uY2F1SGluaCwgcGhvbmc/LnZpZGVvVXJsXSk7XG5cbiAgY29uc3QgdmlkZW9VcmwgPSBhY3RpdmVWaWRlb1VybDtcbiAgY29uc3QgeXRJZCA9IHZpZGVvVXJsID8gaWRZb3V0dWJlKHZpZGVvVXJsKSA6IG51bGw7XG4gIGNvbnN0IGRydklkID0gdmlkZW9VcmwgPyBpZEdvb2dsZURyaXZlKHZpZGVvVXJsKSA6IG51bGw7XG4gIGNvbnN0IHRydWNUaWVwVXJsID0gdmlkZW9VcmwgJiYgIXl0SWQgJiYgIWRydklkICYmIGxhVmlkZW9UcnVjVGllcEZlKHZpZGVvVXJsKSA/IHVybE1lZGlhRmUodmlkZW9VcmwpIDogJyc7XG5cbiAgLy8gS2hcdTFFREZpIHRcdTFFQTFvIFlvdVR1YmUgSUZyYW1lIFBsYXllciBraGkgeXRJZCBjXHUwMEYzIGdpXHUwMEUxIHRyXHUxRUNCIChoXHUxRUQ3IHRyXHUxRUUzIHJldHJ5IGtoaSBET00gXHUwMTExYW5nIHJlbmRlcilcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXl0SWQpIHJldHVybjtcbiAgICBsZXQgZGVzdHJveWVkID0gZmFsc2U7XG4gICAgbGV0IHJldHJ5VGltZXIgPSBudWxsO1xuICAgIGxldCBhdHRlbXB0cyA9IDA7XG5cbiAgICBjb25zdCBraG9pVGFvUGxheWVyID0gKCkgPT4ge1xuICAgICAgaWYgKGRlc3Ryb3llZCkgcmV0dXJuO1xuICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgIGlmICghZWwpIHtcbiAgICAgICAgaWYgKGF0dGVtcHRzKysgPCAyNSkge1xuICAgICAgICAgIHJldHJ5VGltZXIgPSBzZXRUaW1lb3V0KGtob2lUYW9QbGF5ZXIsIDgwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIERlc3Ryb3kgcGxheWVyIGNcdTAxNjkgblx1MUVCRnUgY1x1MDBGM1xuICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQgJiYgeXRQbGF5ZXJSZWYuY3VycmVudC5kZXN0cm95KSB7XG4gICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQuZGVzdHJveSgpOyB9IGNhdGNoIHt9XG4gICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50ID0gbmV3IHdpbmRvdy5ZVC5QbGF5ZXIoeXRDb250YWluZXJJZCwge1xuICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICAgICAgdmlkZW9JZDogeXRJZCxcbiAgICAgICAgICBwbGF5ZXJWYXJzOiB7XG4gICAgICAgICAgICBhdXRvcGxheTogMCxcbiAgICAgICAgICAgIGNvbnRyb2xzOiBjYW5Db250cm9sID8gMSA6IDAsXG4gICAgICAgICAgICBkaXNhYmxla2I6IGNhbkNvbnRyb2wgPyAwIDogMSxcbiAgICAgICAgICAgIG1vZGVzdGJyYW5kaW5nOiAxLFxuICAgICAgICAgICAgcmVsOiAwLFxuICAgICAgICAgICAgcGxheXNpbmxpbmU6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgb25SZWFkeTogKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChkZXN0cm95ZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldC5nZXREdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBldmVudC50YXJnZXQuZ2V0RHVyYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAoZCA+IDApIHNldER1cmF0aW9uKGQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcgJiYgZXZlbnQudGFyZ2V0LnBsYXlWaWRlbykge1xuICAgICAgICAgICAgICAgIHRyeSB7IGV2ZW50LnRhcmdldC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmICh3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcyA+IDAgJiYgZXZlbnQudGFyZ2V0LnNlZWtUbykge1xuICAgICAgICAgICAgICAgIHRyeSB7IGV2ZW50LnRhcmdldC5zZWVrVG8od2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMsIHRydWUpOyB9IGNhdGNoIHt9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblN0YXRlQ2hhbmdlOiAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgIWRhbmdHdWlMZW5oICYmICFpc1NlZWtpbmdSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5kYXRhID09PSAxICYmICF3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3BsYXknLCBldmVudC50YXJnZXQuZ2V0Q3VycmVudFRpbWUoKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5kYXRhID09PSAyICYmIHdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaCgncGF1c2UnLCBldmVudC50YXJnZXQuZ2V0Q3VycmVudFRpbWUoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0xcdTFFRDdpIGtoXHUxRURGaSB0XHUxRUExbyBZVCBQbGF5ZXI6JywgZXJyKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbmFwWW91VHViZUlmcmFtZUFwaSgoKSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KGtob2lUYW9QbGF5ZXIsIDUwKTtcbiAgICB9KTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBkZXN0cm95ZWQgPSB0cnVlO1xuICAgICAgaWYgKHJldHJ5VGltZXIpIGNsZWFyVGltZW91dChyZXRyeVRpbWVyKTtcbiAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50ICYmIHl0UGxheWVyUmVmLmN1cnJlbnQuZGVzdHJveSkge1xuICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LmRlc3Ryb3koKTsgfSBjYXRjaCB7IH1cbiAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgW3l0SWQsIHBob25nLmlkLCBjYW5Db250cm9sXSk7XG5cbiAgLy8gXHUwMEMxcCBkXHUxRUU1bmcgdHJcdTFFQTFuZyB0aFx1MDBFMWkgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSB0XHUxRUVCIHNlcnZlclxuICBjb25zdCBhcER1bmdEb25nQm8gPSAoc3QsIGN0cmwsIHByb3YpID0+IHtcbiAgICBpZiAoIXN0KSByZXR1cm47XG4gICAgY29uc3Qgbm93TXMgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IF9zZXJ2ZXJUaW1lTXMgPSBzdC5zZXJ2ZXJOb3cgPyBuZXcgRGF0ZShzdC5zZXJ2ZXJOb3cpLmdldFRpbWUoKSA6IG5vd01zO1xuICAgIGNvbnN0IHVwZGF0ZVRpbWVNcyA9IHN0LnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyhzdC51cGRhdGVkQXQpLnJlcGxhY2UoJyAnLCAnVCcpICsgKFN0cmluZyhzdC51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKSA6IG5vd01zO1xuICAgIGNvbnN0IGVsYXBzZWRTZWMgPSBNYXRoLm1heCgwLCAobm93TXMgLSB1cGRhdGVUaW1lTXMpIC8gMTAwMCk7XG5cbiAgICBsZXQgdGFyZ2V0UG9zID0gTnVtYmVyKHN0LnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICBpZiAoc3QucGxheWluZykge1xuICAgICAgdGFyZ2V0UG9zID0gTnVtYmVyKHN0LmJhc2VQb3NpdGlvblNlY29uZHMgfHwgMCkgKyAoZWxhcHNlZFNlYyAqIChzdC5wbGF5YmFja1JhdGUgfHwgMS4wKSk7XG4gICAgfVxuICAgIHNldExvY2FsVGltZShNYXRoLm1heCgwLCBNYXRoLmZsb29yKHRhcmdldFBvcykpKTtcblxuICAgIGlmIChjdHJsICYmIGlzU2Vla2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG5cbiAgICBpZiAocHJvdiA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgY29uc3QgdiA9IHZpZGVvUmVmLmN1cnJlbnQ7XG4gICAgICBpZiAoc3QucGxheWluZykge1xuICAgICAgICBjb25zdCBkcmlmdCA9IE1hdGguYWJzKHYuY3VycmVudFRpbWUgLSB0YXJnZXRQb3MpO1xuICAgICAgICBpZiAoZHJpZnQgPiAxLjUpIHtcbiAgICAgICAgICB2LmN1cnJlbnRUaW1lID0gdGFyZ2V0UG9zO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2LnBhdXNlZCAmJiAoaGFzSW50ZXJhY3RlZCB8fCBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQgfHwgY3RybCkpIHtcbiAgICAgICAgICB2LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHYucGxheWJhY2tSYXRlICE9PSAoc3QucGxheWJhY2tSYXRlIHx8IDEuMCkpIHtcbiAgICAgICAgICB2LnBsYXliYWNrUmF0ZSA9IHN0LnBsYXliYWNrUmF0ZSB8fCAxLjA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghdi5wYXVzZWQpIHYucGF1c2UoKTtcbiAgICAgICAgY29uc3QgZHJpZnQgPSBNYXRoLmFicyh2LmN1cnJlbnRUaW1lIC0gc3QucG9zaXRpb25TZWNvbmRzKTtcbiAgICAgICAgaWYgKGRyaWZ0ID4gMC44KSB7XG4gICAgICAgICAgdi5jdXJyZW50VGltZSA9IHN0LnBvc2l0aW9uU2Vjb25kcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvdiA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQgJiYgeXRQbGF5ZXJSZWYuY3VycmVudC5nZXRQbGF5ZXJTdGF0ZSkge1xuICAgICAgY29uc3QgcCA9IHl0UGxheWVyUmVmLmN1cnJlbnQ7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjdXIgPSBwLmdldEN1cnJlbnRUaW1lKCkgfHwgMDtcbiAgICAgICAgY29uc3QgZHJpZnQgPSBNYXRoLmFicyhjdXIgLSB0YXJnZXRQb3MpO1xuICAgICAgICBpZiAoc3QucGxheWluZykge1xuICAgICAgICAgIGlmIChkcmlmdCA+IDEuNSkge1xuICAgICAgICAgICAgcC5zZWVrVG8odGFyZ2V0UG9zLCB0cnVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcHMgPSBwLmdldFBsYXllclN0YXRlKCk7XG4gICAgICAgICAgaWYgKHBzICE9PSAxICYmIHBzICE9PSAzICYmIChoYXNJbnRlcmFjdGVkIHx8IGN0cmwpKSB7XG4gICAgICAgICAgICBwLnBsYXlWaWRlbygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBwcyA9IHAuZ2V0UGxheWVyU3RhdGUoKTtcbiAgICAgICAgICBpZiAocHMgPT09IDEpIHAucGF1c2VWaWRlbygpO1xuICAgICAgICAgIGlmIChNYXRoLmFicyhjdXIgLSBzdC5wb3NpdGlvblNlY29uZHMpID4gMC44KSB7XG4gICAgICAgICAgICBwLnNlZWtUbyhzdC5wb3NpdGlvblNlY29uZHMsIHRydWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7IH1cbiAgICB9XG4gIH07XG5cbiAgLy8gUG9sbCB0clx1MUVBMW5nIHRoXHUwMEUxaSBtXHUwMEUxeSBjaFx1MUVFNyBtXHUxRUQ3aSAyLjVzXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG4gICAgY29uc3QgZmV0Y2hXYXRjaCA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLXdhdGNoP3Bob25nSWQ9JHtwaG9uZy5pZH1gKTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmICghYWN0aXZlKSByZXR1cm47XG4gICAgICAgIGlmIChkLm9rICYmIGQuc3RhdGUpIHtcbiAgICAgICAgICBzZXRXYXRjaFN0YXRlKGQuc3RhdGUpO1xuICAgICAgICAgIHNldENhbkNvbnRyb2woQm9vbGVhbihkLmNhbkNvbnRyb2wpKTtcbiAgICAgICAgICBpZiAoZC5jYXBzKSBzZXRXYXRjaENhcHMoZC5jYXBzKTtcbiAgICAgICAgICBzZXRQcm92aWRlcihkLnByb3ZpZGVyIHx8ICdVTlNVUFBPUlRFRCcpO1xuICAgICAgICAgIGlmIChkLnBob25nPy52aWRlb1VybCAmJiBkLnBob25nLnZpZGVvVXJsICE9PSBhY3RpdmVWaWRlb1VybCkge1xuICAgICAgICAgICAgc2V0QWN0aXZlVmlkZW9VcmwoZC5waG9uZy52aWRlb1VybCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGFwRHVuZ0RvbmdCbyhkLnN0YXRlLCBCb29sZWFuKGQuY2FuQ29udHJvbCksIGQucHJvdmlkZXIgfHwgJ1VOU1VQUE9SVEVEJyk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggeyB9XG4gICAgfTtcblxuICAgIGZldGNoV2F0Y2goKTtcbiAgICBjb25zdCB0aW1lciA9IHNldEludGVydmFsKGtoaUhpZW5UaGkoZmV0Y2hXYXRjaCksIDI1MDApO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBhY3RpdmUgPSBmYWxzZTtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgIH07XG4gIH0sIFtwaG9uZy5pZCwgaGFzSW50ZXJhY3RlZF0pO1xuXG4gIC8vIFRpbWVyIHRcdTAxMDNuZyBsb2NhbFRpbWUgXHUwMTExXHUxRUMxdSBcdTAxMTFcdTFFQjduIGtoaSBwbGF5aW5nXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF3YXRjaFN0YXRlLnBsYXlpbmcpIHJldHVybjtcbiAgICBjb25zdCB0aWNrID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKCFpc1NlZWtpbmdSZWYuY3VycmVudCkge1xuICAgICAgICBzZXRMb2NhbFRpbWUodCA9PiB0ICsgMSk7XG4gICAgICB9XG4gICAgfSwgMTAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodGljayk7XG4gIH0sIFt3YXRjaFN0YXRlLnBsYXlpbmddKTtcblxuICAvLyBHXHUxRUVEaSBsXHUxRUM3bmggXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiAoUGxheSAvIFBhdXNlIC8gU2VlaylcbiAgY29uc3QgZ3VpTGVuaCA9IGFzeW5jIChhY3Rpb24sIGN1c3RvbVBvcykgPT4ge1xuICAgIGlmIChkYW5nR3VpTGVuaCkgcmV0dXJuO1xuICAgIHNldERhbmdHdWlMZW5oKHRydWUpO1xuICAgIHNldExvaSgnJyk7XG5cbiAgICBsZXQgcG9zID0gY3VzdG9tUG9zO1xuICAgIGlmIChwb3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICAgIHBvcyA9IHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWU7XG4gICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudD8uZ2V0Q3VycmVudFRpbWUpIHtcbiAgICAgICAgcG9zID0geXRQbGF5ZXJSZWYuY3VycmVudC5nZXRDdXJyZW50VGltZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9zID0gbG9jYWxUaW1lO1xuICAgICAgfVxuICAgIH1cbiAgICBwb3MgPSBNYXRoLm1heCgwLCBOdW1iZXIoKHBvcyB8fCAwKS50b0ZpeGVkKDIpKSk7XG5cbiAgICAvLyBDXHUxRUFEcCBuaFx1MUVBRHQgbFx1MUVBMWMgcXVhbiB0clx1MDBFQW4gbG9jYWwgcGxheWVyXG4gICAgaWYgKGFjdGlvbiA9PT0gJ3BsYXknKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudD8ucGxheVZpZGVvKSB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpO1xuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAncGF1c2UnKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQucGF1c2UoKTtcbiAgICAgIGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudD8ucGF1c2VWaWRlbykgeXRQbGF5ZXJSZWYuY3VycmVudC5wYXVzZVZpZGVvKCk7XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdzZWVrJykge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lID0gcG9zO1xuICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5zZWVrVG8pIHl0UGxheWVyUmVmLmN1cnJlbnQuc2Vla1RvKHBvcywgdHJ1ZSk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXdhdGNoJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICBhY3Rpb24sXG4gICAgICAgICAgcG9zaXRpb246IHBvcyxcbiAgICAgICAgICBleHBlY3RlZFJldmlzaW9uOiB3YXRjaFN0YXRlLnJldmlzaW9uLFxuICAgICAgICAgIHBsYXliYWNrUmF0ZTogd2F0Y2hTdGF0ZS5wbGF5YmFja1JhdGUgfHwgMS4wXG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICBzZXRXYXRjaFN0YXRlKGQuc3RhdGUpO1xuICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihkLnN0YXRlLnBvc2l0aW9uU2Vjb25kcyB8fCBwb3MpKTtcbiAgICAgIH0gZWxzZSBpZiAoZC5jb25mbGljdCAmJiBkLnN0YXRlKSB7XG4gICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIGFwRHVuZ0RvbmdCbyhkLnN0YXRlLCBjYW5Db250cm9sLCBwcm92aWRlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRMb2koZC5sb2kgfHwgJ0xcdTFFRDdpIGNcdTFFQURwIG5oXHUxRUFEdCBwaFx1MDBFMXQgdmlkZW8uJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRMb2koJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXREYW5nR3VpTGVuaChmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIFx1MDExMFx1MUVEM25nIGJcdTFFRDkgdlx1MUVDQiB0clx1MDBFRCB2aWRlbyBoaVx1MUVDN24gdFx1MUVBMWkgcmEgbmdvXHUwMEUwaSBcdTAxMTFcdTFFQzMgY2hhdCBnXHUxRUFGbiB0aW1lc3RhbXBcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAodmlkZW9UaW1lUmVmKSB2aWRlb1RpbWVSZWYuY3VycmVudCA9IGxvY2FsVGltZTtcbiAgfSwgW2xvY2FsVGltZSwgdmlkZW9UaW1lUmVmXSk7XG5cblxuXG4gIC8vIE5oXHUxRUFEbiB5XHUwMEVBdSBjXHUxRUE3dSB0dWEgdFx1MUVFQiBTdHVkeURvY2sgKGJcdTFFQTVtIG1cdTFFRDFjIHZpZGVvIHRyb25nIGNoYXQvZ2hpIGNoXHUwMEZBKS5cbiAgLy8gQ1x1MDBGMyBxdXlcdTFFQzFuIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gXHUyMTkyIHBoXHUwMEUxdCBsXHUxRUM3bmggc2VlayBjaHVuZzsga2hcdTAwRjRuZyBcdTIxOTIgY2hcdTFFQzkgdHVhIGNcdTFFRTVjIGJcdTFFRDkgcGxheWVyIGNcdTFFRTdhIG1cdTAwRUNuaC5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBvblNlZWtSZXEgPSAoZSkgPT4ge1xuICAgICAgaWYgKGUuZGV0YWlsPy5waG9uZ0lkICE9PSBwaG9uZy5pZCkgcmV0dXJuO1xuICAgICAgY29uc3Qgc2VjID0gTWF0aC5tYXgoMCwgTnVtYmVyKGUuZGV0YWlsLnNlYykgfHwgMCk7XG4gICAgICBpZiAoY2FuQ29udHJvbCkge1xuICAgICAgICBndWlMZW5oKCdzZWVrJywgc2VjKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkgdmlkZW9SZWYuY3VycmVudC5jdXJyZW50VGltZSA9IHNlYztcbiAgICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5zZWVrVG8pIHl0UGxheWVyUmVmLmN1cnJlbnQuc2Vla1RvKHNlYywgdHJ1ZSk7XG4gICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKHNlYykpO1xuICAgICAgfVxuICAgIH07XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3NyLXNlZWsnLCBvblNlZWtSZXEpO1xuICAgIHJldHVybiAoKSA9PiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignc3Itc2VlaycsIG9uU2Vla1JlcSk7XG4gIH0sIFtwaG9uZy5pZCwgY2FuQ29udHJvbCwgcHJvdmlkZXIsIHdhdGNoU3RhdGUucmV2aXNpb25dKTtcblxuICBjb25zdCBoYW5kbGVTdGFydFZpZXdpbmcgPSAoKSA9PiB7XG4gICAgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBzZXRIYXNJbnRlcmFjdGVkKHRydWUpO1xuICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgY29uc3QgdiA9IHZpZGVvUmVmLmN1cnJlbnQ7XG4gICAgICBjb25zdCBwID0gdi5wbGF5KCk7XG4gICAgICBpZiAocCAmJiB0eXBlb2YgcC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHAudGhlbigoKSA9PiB7XG4gICAgICAgICAgaWYgKCF3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgICAgIHYucGF1c2UoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudD8ucGxheVZpZGVvKSB7XG4gICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtNCBtaW4tdy0wIHctZnVsbFwiPlxuICAgICAgey8qIEtodW5nIHBoXHUwMEUxdCB2aWRlbyBjaFx1MDBFRG5oICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSB3LWZ1bGwgYXNwZWN0LXZpZGVvIGJnLWJsYWNrIHJvdW5kZWQtMnhsIG92ZXJmbG93LWhpZGRlbiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHNoYWRvdy0yeGxcIj5cbiAgICAgICAgey8qIE92ZXJsYXkgQXV0b3BsYXkgLyBHZXN0dXJlIGNobyBuZ1x1MDFCMFx1MUVERGkgeGVtICovfVxuICAgICAgICB7IWhhc0ludGVyYWN0ZWQgJiYgIWNhbkNvbnRyb2wgJiYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgfHwgcHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnKSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIHotMjAgYmctYmxhY2svNzUgYmFja2Ryb3AtYmx1ci1zbSBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTQgdGV4dC1jZW50ZXIgYW5pbWF0ZS1mYWRlSW5cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xNCBoLTE0IHJvdW5kZWQtZnVsbCBiZy1bIzAwRjJGRV0vMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC0yeGwgbWItMyBzaGFkb3ctWzBfMF8yNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBhbmltYXRlLXB1bHNlXCI+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REZBQ1xuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBtYi0xXCI+WGVtIENodW5nIENcdTAwRjluZyBQaFx1MDBGMm5nPC9wPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTMwMCBtYXgtdy14cyBtYi00XCI+XG4gICAgICAgICAgICAgIEJcdTFFQTVtIG5cdTAwRkF0IGJcdTAwRUFuIGRcdTAxQjBcdTFFREJpIFx1MDExMVx1MUVDMyBjXHUxRUE1cCBxdXlcdTFFQzFuIFx1MDBFMm0gdGhhbmggdlx1MDBFMCBjXHUwMEY5bmcgdGhlbyBkXHUwMEY1aSB0aW1lbGluZSB2XHUxRURCaSBjaFx1MUVFNyBwaFx1MDBGMm5nLlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImJ0bi12aWV3ZXItc3RhcnQtd2F0Y2hcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlU3RhcnRWaWV3aW5nfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIuNSByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzQjgyRjZdIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIHNoYWRvdy1sZyBob3ZlcjpvcGFjaXR5LTkwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTI1QjY8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPkJcdTFFQUZ0IFx1MDExMVx1MUVBN3UgeGVtIGNcdTAwRjluZyBwaFx1MDBGMm5nPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFZpZGVvIGVsZW1lbnRzIHRoZW8gcHJvdmlkZXIgKi99XG4gICAgICAgIHt5dElkID8gKFxuICAgICAgICAgIDxkaXYga2V5PXtgeXQtd3JhcC0ke3Bob25nLmlkfS0ke3l0SWR9YH0gY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICAgICAgPGRpdiBpZD17eXRDb250YWluZXJJZH0gY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbFwiIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBkcnZJZCA/IChcbiAgICAgICAgICA8aWZyYW1lXG4gICAgICAgICAgICBzcmM9e2BodHRwczovL2RyaXZlLmdvb2dsZS5jb20vZmlsZS9kLyR7ZHJ2SWR9L3ByZXZpZXdgfVxuICAgICAgICAgICAgdGl0bGU9e3Bob25nLnRlbn1cbiAgICAgICAgICAgIGFsbG93PVwiYXV0b3BsYXk7IGZ1bGxzY3JlZW5cIlxuICAgICAgICAgICAgYWxsb3dGdWxsU2NyZWVuXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsXCJcbiAgICAgICAgICAvPlxuICAgICAgICApIDogdHJ1Y1RpZXBVcmwgPyAoXG4gICAgICAgICAgPHZpZGVvXG4gICAgICAgICAgICByZWY9e3ZpZGVvUmVmfVxuICAgICAgICAgICAgc3JjPXt0cnVjVGllcFVybH1cbiAgICAgICAgICAgIHBsYXlzSW5saW5lXG4gICAgICAgICAgICBkYXRhLXRlc3RpZD1cInN0dWR5LXZpZGVvLXBsYXllclwiXG4gICAgICAgICAgICBjb250cm9scz17Y2FuQ29udHJvbH1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvbnRhaW5cIlxuICAgICAgICAgICAgb25Mb2FkZWRNZXRhZGF0YT17ZSA9PiB7XG4gICAgICAgICAgICAgIGlmIChlLnRhcmdldC5kdXJhdGlvbiA+IDApIHNldER1cmF0aW9uKGUudGFyZ2V0LmR1cmF0aW9uKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvblBsYXk9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgIXdhdGNoU3RhdGUucGxheWluZyAmJiAhZGFuZ0d1aUxlbmgpIHtcbiAgICAgICAgICAgICAgICBndWlMZW5oKCdwbGF5JywgdmlkZW9SZWYuY3VycmVudD8uY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25QYXVzZT17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiB3YXRjaFN0YXRlLnBsYXlpbmcgJiYgIWRhbmdHdWlMZW5oKSB7XG4gICAgICAgICAgICAgICAgZ3VpTGVuaCgncGF1c2UnLCB2aWRlb1JlZi5jdXJyZW50Py5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvblNlZWtlZD17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWNhbkNvbnRyb2wgfHwgZGFuZ0d1aUxlbmggfHwgaXNTZWVraW5nUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgICAgICAgY29uc3QgY3VyID0gdmlkZW9SZWYuY3VycmVudD8uY3VycmVudFRpbWU7XG4gICAgICAgICAgICAgIGlmIChjdXIgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAvLyBDaFx1MUVEMW5nIHZcdTAwRjJuZyBsXHUxRUI3cDogbVx1MUVDRGkgZ1x1MDBFMW4gY3VycmVudFRpbWUgblx1MUVEOWkgYlx1MUVEOSAob3B0aW1pc3RpYyBzZWVrLCBkcmlmdC1jb3JyZWN0aW9uXG4gICAgICAgICAgICAgIC8vIGNcdTFFRTdhIGFwRHVuZ0RvbmdCbykgXHUwMTExXHUxRUMxdSBiXHUxRUFGbiAnc2Vla2VkJy4gQ2hcdTFFQzkgZ1x1MUVFRGkgbFx1MUVDN25oIGtoaSB2XHUxRUNCIHRyXHUwMEVEIGxcdTFFQzdjaCBraFx1MUVDRmlcbiAgICAgICAgICAgICAgLy8gdlx1MUVDQiB0clx1MDBFRCBzZXJ2ZXIga1x1MUVGMyB2XHUxRUNEbmcgPjEuNXMgXHUyMDE0IHRcdTFFRTljIG5nXHUwMUIwXHUxRUREaSBkXHUwMEY5bmcgdGhcdTFFQUR0IHNcdTFFRjEgdHVhIHF1YSB0aGFuaCBjb250cm9scy5cbiAgICAgICAgICAgICAgY29uc3Qgc3QgPSB3YXRjaFN0YXRlO1xuICAgICAgICAgICAgICBjb25zdCB1cGRNcyA9IHN0Py51cGRhdGVkQXQgPyBuZXcgRGF0ZShTdHJpbmcoc3QudXBkYXRlZEF0KS5yZXBsYWNlKCcgJywgJ1QnKSArIChTdHJpbmcoc3QudXBkYXRlZEF0KS5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS5nZXRUaW1lKCkgOiBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICBjb25zdCBlbGFwc2VkID0gTWF0aC5tYXgoMCwgKERhdGUubm93KCkgLSB1cGRNcykgLyAxMDAwKTtcbiAgICAgICAgICAgICAgY29uc3Qga3lWb25nID0gc3Q/LnBsYXlpbmdcbiAgICAgICAgICAgICAgICA/IE51bWJlcihzdC5iYXNlUG9zaXRpb25TZWNvbmRzIHx8IDApICsgZWxhcHNlZCAqIChzdC5wbGF5YmFja1JhdGUgfHwgMSlcbiAgICAgICAgICAgICAgICA6IE51bWJlcihzdD8ucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VyIC0ga3lWb25nKSA+IDEuNSkgZ3VpTGVuaCgnc2VlaycsIGN1cik7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgIC8+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBoLWZ1bGwgdGV4dC14cyB0ZXh0LXNsYXRlLTUwMCBwLTYgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtMnhsIG1iLTJcIj5cdTI2QTBcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5MaW5rIHZpZGVvIGtoXHUwMEY0bmcgaFx1MUVENyB0clx1MUVFMyBwaFx1MDBFMXQgdHJcdTFFRjFjIHRpXHUxRUJGcCBob1x1MUVCN2Mga2hcdTAwRjRuZyBoXHUxRUUzcCBsXHUxRUM3Ljwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogVGhcdTAwRjRuZyBiXHUwMEUxbyByaVx1MDBFQW5nIGNobyBHb29nbGUgRHJpdmUgKi99XG4gICAgICB7ZHJ2SWQgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMuNSBweS0yIGJnLWFtYmVyLTUwMC8xMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8yMCByb3VuZGVkLXhsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgdGV4dC1hbWJlci0zMDBcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtXCI+XHUyMTM5XHVGRTBGPC9zcGFuPlxuICAgICAgICAgIDxzcGFuPkdvb2dsZSBEcml2ZSBwaFx1MDBFMXQgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSA8c3Ryb25nPlhlbSBcdTAxMTFcdTFFRDljIGxcdTFFQURwPC9zdHJvbmc+IChHb29nbGUgRHJpdmUga2hcdTAwRjRuZyBoXHUxRUQ3IHRyXHUxRUUzIEFQSSBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIHRcdTFFRUIgeGEpLjwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogVGhhbmggXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiBIb3N0IFx1MjAxNCBcdTFFQTluIGtoaSBmdWxsc2NyZWVuICovfVxuICAgICAgeyFpc1Jvb21XaWRlICYmIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC0zIHNtOnAtMy41IGZsZXggZmxleC1jb2wgZ2FwLTMgc2hhZG93LXhsXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZmxleC13cmFwIG1pbi13LTBcIj5cbiAgICAgICAgICAgIHsvKiBDaFx1MUVDOSBoaVx1MUVDN24gdHJcdTFFQTFuZyB0aFx1MDBFMWkgcGhcdTAwRTF0IGNobyBob3N0ICovfVxuICAgICAgICAgICAge2NhbkNvbnRyb2wgJiYgcHJvdmlkZXIgIT09ICdHT09HTEVfRFJJVkUnICYmIHByb3ZpZGVyICE9PSAnVU5TVVBQT1JURUQnICYmIChcbiAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJzeW5jLXN0YXRlLWJhZGdlXCIgY2xhc3NOYW1lPXtgdGV4dC14cyBmb250LWJsYWNrIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHB4LTMgcHktMS41IHJvdW5kZWQteGwgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7d2F0Y2hTdGF0ZS5wbGF5aW5nID8gJ2JnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC00MDAgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgxNiwxODUsMTI5LDAuMildJyA6ICdiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC8zMCBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMjQ1LDE1OCwxMSwwLjIpXSd9YH0+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdy0yIGgtMiByb3VuZGVkLWZ1bGwgJHt3YXRjaFN0YXRlLnBsYXlpbmcgPyAnYmctZW1lcmFsZC00MDAgYW5pbWF0ZS1wdWxzZScgOiAnYmctYW1iZXItNDAwJ31gfT48L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3dhdGNoU3RhdGUucGxheWluZyA/ICdcdTAxMTBhbmcgcGhcdTAwRTF0IGNodW5nJyA6ICdUXHUxRUExbSBkXHUxRUVCbmcnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAge2NhbkNvbnRyb2wgJiYgKFxuICAgICAgICAgICAgICA8c3BhbiBpZD1cImhvc3QtYmFkZ2VcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LWJsYWNrIHB4LTIuNSBweS0xIHJvdW5kZWQteGwgYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIHNoYWRvdy1zbSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjYwNTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5DaFx1MUVFNyBwaFx1MDBGMm5nPC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgc2hyaW5rLTAgbWwtYXV0b1wiPlxuICAgICAgICAgICAgeyhjYW5Db250cm9sIHx8IGF1dGgudXNlcj8uaXNUZWFjaGVyKSAmJiBwaG9uZy5jaHVQaG9uZ0tob2EgIT09ICdoZS10aG9uZycgJiYgKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17ZG9uZ1Bob25nSGllblRhaX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzE1IGhvdmVyOmJnLXJvc2UtNTAwLzI1IHRleHQtcm9zZS0zMDAgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0cmFuc2l0aW9uLWFsbCBob3ZlcjpzY2FsZS0xMDUgYWN0aXZlOnNjYWxlLTk1XCI+XG4gICAgICAgICAgICAgICAgXHUwMTEwXHUwMEYzbmcgcGhcdTAwRjJuZ1xuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBUaGFuaCBjXHUwMEY0bmcgY1x1MUVFNSBwaFx1MDBFMXQgY2h1bmcgKGNoXHUxRUM5IGhpXHUxRUMzbiB0aFx1MUVDQiBjaG8gSG9zdCAvIFRlYWNoZXIga2hpIGRcdTAwRjluZyBwcm92aWRlciBjXHUwMEYzIHRoXHUxRUMzIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24pICovfVxuICAgICAgICB7Y2FuQ29udHJvbCAmJiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnIHx8IHByb3ZpZGVyID09PSAnWU9VVFVCRScpICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgaXRlbXMtY2VudGVyIGdhcC0zIHB0LTIgYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiYnRuLWhvc3Qtd2F0Y2gtdG9nZ2xlXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgod2F0Y2hTdGF0ZS5wbGF5aW5nID8gJ3BhdXNlJyA6ICdwbGF5Jyl9XG4gICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIHNtOnctYXV0byBweC00IHB5LTIgcm91bmRlZC14bCBmb250LWJsYWNrIHRleHQteHMgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEuNSBzaGFkb3ctbWQgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyIGRpc2FibGVkOm9wYWNpdHktNTAgJHtcbiAgICAgICAgICAgICAgICB3YXRjaFN0YXRlLnBsYXlpbmdcbiAgICAgICAgICAgICAgICAgID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC80MCBob3ZlcjpiZy1hbWJlci01MDAvMzAgc2hhZG93LVswXzBfMTJweF9yZ2JhKDI0NSwxNTgsMTEsMC4yNSldJ1xuICAgICAgICAgICAgICAgICAgOiAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzAwYzZmZl0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBob3ZlcjpicmlnaHRuZXNzLTExMCdcbiAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICA8c3Bhbj57d2F0Y2hTdGF0ZS5wbGF5aW5nID8gJ1x1MjNGOCcgOiAnXHUyNUI2J308L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPnt3YXRjaFN0YXRlLnBsYXlpbmcgPyAnVFx1MUVBMW0gRFx1MUVFQm5nIENcdTFFQTMgUGhcdTAwRjJuZycgOiAnUGhcdTAwRTF0IENodW5nIENcdTFFQTMgUGhcdTAwRjJuZyd9PC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjUgdy1mdWxsXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGlkPVwiaG9zdC1kdXJhdGlvbi1sYWJlbFwiIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIHtkaW5oRGFuZ0dpYXlQaHV0KGxvY2FsVGltZSl9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgaWQ9XCJob3N0LXNlZWstc2xpZGVyXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwicmFuZ2VcIlxuICAgICAgICAgICAgICAgIG1pbj1cIjBcIlxuICAgICAgICAgICAgICAgIG1heD17ZHVyYXRpb24gPiAwID8gZHVyYXRpb24gOiBNYXRoLm1heChsb2NhbFRpbWUsIDMwMCl9XG4gICAgICAgICAgICAgICAgc3RlcD1cIjFcIlxuICAgICAgICAgICAgICAgIHZhbHVlPXtsb2NhbFRpbWV9XG4gICAgICAgICAgICAgICAgb25Nb3VzZURvd249eygpID0+IHsgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgIG9uVG91Y2hTdGFydD17KCkgPT4geyBpc1NlZWtpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0TG9jYWxUaW1lKE51bWJlcihlLnRhcmdldC52YWx1ZSkpfVxuICAgICAgICAgICAgICAgIG9uTW91c2VVcD17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBpc1NlZWtpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaCgnc2VlaycsIE51bWJlcihlLnRhcmdldC52YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgb25Ub3VjaEVuZD17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBpc1NlZWtpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaCgnc2VlaycsIE51bWJlcihlLnRhcmdldC52YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGgtMS41IGJnLXdoaXRlLzEwIHJvdW5kZWQtbGcgYXBwZWFyYW5jZS1ub25lIGN1cnNvci1wb2ludGVyIGFjY2VudC1bIzAwRjJGRV1cIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICB7ZHVyYXRpb24gPiAwID8gZGluaERhbmdHaWF5UGh1dChkdXJhdGlvbikgOiAnLS06LS0nfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7bG9pICYmIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1yb3NlLTQwMFwiPntsb2l9PC9wPn1cbiAgICAgICAge3Bob25nLm1vVGEgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgbGVhZGluZy1yZWxheGVkIHB0LTFcIj57cGhvbmcubW9UYX08L3A+fVxuXG4gICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG5cbiAgKTtcbn1cblxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ29tcG9uZW50OiBDYW1wdXMgRm9jdXMgUm9vbSAoU3R1ZHkgQ2FmXHUwMEU5ICYgUG9tb2Rvcm8gU2Vzc2lvbikgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5leHBvcnQgZnVuY3Rpb24gQ2FtcHVzRm9jdXNSb29tKHtcbiAgcGhvbmcsXG4gIHBob25nTWluaEtob2EsXG4gIGF1dGgsXG4gIGRvbmdQaG9uZ0hpZW5UYWksXG4gIHNvTmd1b2ksXG4gIGlzRm9jdXNNb2RlLFxuICBzZXRJc0ZvY3VzTW9kZVxufSkge1xuICBjb25zdCBbZm9jdXNTdGF0ZSwgc2V0Rm9jdXNTdGF0ZV0gPSB1c2VTdGF0ZSh7XG4gICAgcGhhc2U6ICdmb2N1cycsXG4gICAgc3RhdHVzOiAncGF1c2VkJyxcbiAgICBkdXJhdGlvblNlY29uZHM6IDE1MDAsXG4gICAgcmVtYWluaW5nU2Vjb25kczogMTUwMCxcbiAgICBwcmVzZXQ6ICcyNV81JyxcbiAgICByZXZpc2lvbjogMSxcbiAgICBjYW5Db250cm9sOiBmYWxzZSxcbiAgICB1cGRhdGVkQXQ6IG51bGwsXG4gICAgc2VydmVyTm93OiBudWxsXG4gIH0pO1xuICBjb25zdCBbbG9jYWxSZW1haW5pbmcsIHNldExvY2FsUmVtYWluaW5nXSA9IHVzZVN0YXRlKDE1MDApO1xuICBjb25zdCBbZGFuZ0d1aUxlbmgsIHNldERhbmdHdWlMZW5oXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2xvaSwgc2V0TG9pXSA9IHVzZVN0YXRlKCcnKTtcblxuICAvLyBBdWRpbyBzdGF0ZSAoQW1iaWVudCBwbGF5YmFjaylcbiAgbGV0IGNhdUhpbmggPSB7fTtcbiAgdHJ5IHsgY2F1SGluaCA9IHBob25nLmNhdUhpbmggPyBKU09OLnBhcnNlKHBob25nLmNhdUhpbmgpIDoge307IH0gY2F0Y2ggeyAvKiBiXHUxRUNGIHF1YSAqLyB9XG4gIGNvbnN0IG5oYWNVcmwgPSBjYXVIaW5oLm5oYWNVcmwgPyB1cmxNZWRpYUZlKGNhdUhpbmgubmhhY1VybCkgOiAnJztcbiAgY29uc3QgYXVkaW9SZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IFthdWRpb1BsYXlpbmcsIHNldEF1ZGlvUGxheWluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFthdWRpb1ZvbHVtZSwgc2V0QXVkaW9Wb2x1bWVdID0gdXNlU3RhdGUoMC41KTtcbiAgY29uc3QgW2F1ZGlvTXV0ZWQsIHNldEF1ZGlvTXV0ZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbaGFzSW50ZXJhY3RlZEF1ZGlvLCBzZXRIYXNJbnRlcmFjdGVkQXVkaW9dID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8vIEF1dGhvcml6YXRpb25cbiAgY29uc3QgW2NhbkNvbnRyb2wsIHNldENhbkNvbnRyb2xdID0gdXNlU3RhdGUoQm9vbGVhbihhdXRoLnVzZXI/LmlzVGVhY2hlciB8fCBwaG9uZz8uY2FuQ29udHJvbCB8fCBwaG9uZz8ubGFDaHVQaG9uZykpO1xuICBjb25zdCBpc0hvc3QgPSBjYW5Db250cm9sO1xuXG4gIC8vIFN5bmMgc3RhdGUgcmVjb25jaWxpYXRpb24gaGVscGVyXG4gIGNvbnN0IGFwRHVuZ0ZvY3VzU3RhdGUgPSAoc3QpID0+IHtcbiAgICBpZiAoIXN0KSByZXR1cm47XG4gICAgc2V0Rm9jdXNTdGF0ZShzdCk7XG4gICAgY29uc3QgcmVtID0gTnVtYmVyKHN0LnJlbWFpbmluZ1NlY29uZHMgPz8gMTUwMCk7XG4gICAgc2V0TG9jYWxSZW1haW5pbmcocmVtKTtcbiAgfTtcblxuICAvLyAxLiBQb2xsaW5nIEZvY3VzIFN0YXRlIChldmVyeSAzMDAwbXMpIHdpdGggdmlzaWJpbGl0eSByZWNvbmNpbGlhdGlvbiAmIHN0cmljdCBjbGVhbnVwXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG5cbiAgICBjb25zdCBmZXRjaEZvY3VzID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctZm9jdXM/cGhvbmdJZD0ke2VuY29kZVVSSUNvbXBvbmVudChwaG9uZy5pZCl9YCk7XG4gICAgICAgIGlmICghcmVzLm9rKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICAgIGlmICh0eXBlb2YgZC5jYW5Db250cm9sID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHNldENhbkNvbnRyb2woZC5jYW5Db250cm9sKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXBEdW5nRm9jdXNTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8qIGJcdTFFQ0YgcXVhIGtoaSBoXHUxRUU3eSBrXHUxRUJGdCBuXHUxRUQxaSAqL1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmZXRjaEZvY3VzKCk7XG4gICAgY29uc3QgdGltZXIgPSBzZXRJbnRlcnZhbChmZXRjaEZvY3VzLCAzMDAwKTtcblxuICAgIGNvbnN0IGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UgPSAoKSA9PiB7XG4gICAgICBpZiAoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAndmlzaWJsZScgJiYgYWN0aXZlKSB7XG4gICAgICAgIGZldGNoRm9jdXMoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlKTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBhY3RpdmUgPSBmYWxzZTtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UpO1xuICAgIH07XG4gIH0sIFtwaG9uZy5pZF0pO1xuXG4gIC8vIDIuIExvY2FsIENvdW50ZG93biBUaWNrIChldmVyeSAxMDAwbXMgd2hlbiBzdGF0dXMgPT09ICdydW5uaW5nJylcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZm9jdXNTdGF0ZS5zdGF0dXMgIT09ICdydW5uaW5nJykgcmV0dXJuO1xuICAgIGNvbnN0IHRpY2sgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBzZXRMb2NhbFJlbWFpbmluZyhyID0+IE1hdGgubWF4KDAsIHIgLSAxKSk7XG4gICAgfSwgMTAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodGljayk7XG4gIH0sIFtmb2N1c1N0YXRlLnN0YXR1c10pO1xuXG4gIC8vIDMuIENvbW1hbmQgZGlzcGF0Y2hlciB3aXRoIG9wdGltaXN0aWMgY29uY3VycmVuY3kgKHJldmlzaW9uIGNoZWNrICYgY29uZmxpY3QgaGFuZGxpbmcpXG4gIGNvbnN0IGd1aUxlbmggPSBhc3luYyAoYWN0aW9uLCBleHRyYVBheWxvYWQgPSB7fSkgPT4ge1xuICAgIGlmIChkYW5nR3VpTGVuaCkgcmV0dXJuO1xuICAgIHNldERhbmdHdWlMZW5oKHRydWUpO1xuICAgIHNldExvaSgnJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctZm9jdXMnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgIGFjdGlvbixcbiAgICAgICAgICBleHBlY3RlZFJldmlzaW9uOiBmb2N1c1N0YXRlLnJldmlzaW9uLFxuICAgICAgICAgIC4uLmV4dHJhUGF5bG9hZFxuICAgICAgICB9KVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICBhcER1bmdGb2N1c1N0YXRlKGQuc3RhdGUpO1xuICAgICAgfSBlbHNlIGlmIChyZXMuc3RhdHVzID09PSA0MDkgJiYgZC5zdGF0ZSkge1xuICAgICAgICAvLyBDb25jdXJyZW5jeSBjb25mbGljdDogYWRvcHQgbGF0ZXN0IHNlcnZlciBzdGF0ZVxuICAgICAgICBhcER1bmdGb2N1c1N0YXRlKGQuc3RhdGUpO1xuICAgICAgICBzZXRMb2koJ1x1MDExMFx1MDBFMyBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGxcdTFFQTFpIHBoaVx1MDBFQW4gdGhlbyBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldExvaShkLmxvaSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyBjXHUxRUFEcCBuaFx1MUVBRHQgdHJcdTFFQTFuZyB0aFx1MDBFMWkgcGhcdTAwRjJuZyBoXHUxRUNEYyB0XHUxRUFEcC4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldERhbmdHdWlMZW5oKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gNC4gQW1iaWVudCBBdWRpbyBDb250cm9sc1xuICBjb25zdCBiYXRBbVRoYW5oID0gKCkgPT4ge1xuICAgIHNldEhhc0ludGVyYWN0ZWRBdWRpbyh0cnVlKTtcbiAgICBpZiAoYXVkaW9SZWYuY3VycmVudCkge1xuICAgICAgYXVkaW9SZWYuY3VycmVudC5wbGF5KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHNldEF1ZGlvUGxheWluZyh0cnVlKTtcbiAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUud2FybignQXV0b3BsYXkgYmxvY2tlZCBvciBhdWRpbyBsb2FkIGVycm9yOicsIGVycik7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdG9nZ2xlQXVkaW9QbGF5ID0gKCkgPT4ge1xuICAgIGlmICghYXVkaW9SZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGlmIChhdWRpb1BsYXlpbmcpIHtcbiAgICAgIGF1ZGlvUmVmLmN1cnJlbnQucGF1c2UoKTtcbiAgICAgIHNldEF1ZGlvUGxheWluZyhmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJhdEFtVGhhbmgoKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdG9nZ2xlQXVkaW9NdXRlID0gKCkgPT4ge1xuICAgIGlmICghYXVkaW9SZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGNvbnN0IG5ld011dGUgPSAhYXVkaW9NdXRlZDtcbiAgICBhdWRpb1JlZi5jdXJyZW50Lm11dGVkID0gbmV3TXV0ZTtcbiAgICBzZXRBdWRpb011dGVkKG5ld011dGUpO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVZvbHVtZUNoYW5nZSA9IChlKSA9PiB7XG4gICAgY29uc3QgdmFsID0gcGFyc2VGbG9hdChlLnRhcmdldC52YWx1ZSk7XG4gICAgc2V0QXVkaW9Wb2x1bWUodmFsKTtcbiAgICBpZiAoYXVkaW9SZWYuY3VycmVudCkge1xuICAgICAgYXVkaW9SZWYuY3VycmVudC52b2x1bWUgPSB2YWw7XG4gICAgICBpZiAodmFsID4gMCAmJiBhdWRpb011dGVkKSB7XG4gICAgICAgIGF1ZGlvUmVmLmN1cnJlbnQubXV0ZWQgPSBmYWxzZTtcbiAgICAgICAgc2V0QXVkaW9NdXRlZChmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGlzQnJlYWsgPSBmb2N1c1N0YXRlLnBoYXNlID09PSAnYnJlYWsnO1xuICBjb25zdCBpc1J1bm5pbmcgPSBmb2N1c1N0YXRlLnN0YXR1cyA9PT0gJ3J1bm5pbmcnO1xuICBjb25zdCBkdXJhdGlvbiA9IGZvY3VzU3RhdGUuZHVyYXRpb25TZWNvbmRzIHx8IChpc0JyZWFrID8gMzAwIDogMTUwMCk7XG4gIGNvbnN0IHByb2dyZXNzUGVyY2VudCA9IE1hdGgubWluKDEwMCwgTWF0aC5tYXgoMCwgKChkdXJhdGlvbiAtIGxvY2FsUmVtYWluaW5nKSAvIGR1cmF0aW9uKSAqIDEwMCkpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC00IG1pbi13LTAgdy1mdWxsXCI+XG4gICAgICB7LyogSGlkZGVuIEF1ZGlvIGVsZW1lbnQgZm9yIGFtYmllbnQgc291bmR0cmFjayAqL31cbiAgICAgIHtuaGFjVXJsICYmIChcbiAgICAgICAgPGF1ZGlvXG4gICAgICAgICAgcmVmPXthdWRpb1JlZn1cbiAgICAgICAgICBzcmM9e25oYWNVcmx9XG4gICAgICAgICAgbG9vcFxuICAgICAgICAgIHByZWxvYWQ9XCJub25lXCJcbiAgICAgICAgICBvbkVuZGVkPXsoKSA9PiBzZXRBdWRpb1BsYXlpbmcoZmFsc2UpfVxuICAgICAgICAgIG9uRXJyb3I9eygpID0+IHNldEF1ZGlvUGxheWluZyhmYWxzZSl9XG4gICAgICAgIC8+XG4gICAgICApfVxuXG4gICAgICB7LyogSGVhZGVyIGJhcjogUHJlc2VuY2UsIEhvc3QgYmFkZ2UsIEZvY3VzIE1vZGUgdG9nZ2xlLCBDbG9zZSBSb29tICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTQgZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMyBzaGFkb3ctbGdcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2BweC0yLjUgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC1bMTBweF0gZm9udC1ib2xkIGJvcmRlciAke3Bob25nLnBoYW1WaSA9PT0gJ3RydW9uZycgPyAnYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTQwMCBib3JkZXItZW1lcmFsZC01MDAvMzAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgIHtwaG9uZy5waGFtVmkgPT09ICd0cnVvbmcnID8gJ1x1RDgzQ1x1REYxMCBUb1x1MDBFMG4gdHJcdTAxQjBcdTFFRERuZycgOiBgXHVEODNEXHVERDEyIExcdTFFREJwICR7cGhvbmcubG9wVGVuIHx8ICcnfWB9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGlkPVwiZm9jdXMtaG9zdC1iYWRnZVwiIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICBDaFx1MUVFNyBwaFx1MDBGMm5nOiA8c3Ryb25nIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtMjAwXCI+e3Bob25nLmNodVBob25nVGVufTwvc3Ryb25nPlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBpZD1cImZvY3VzLXJvb20tcHJlc2VuY2VcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBweC0yLjUgcHktMC41IHJvdW5kZWQtZnVsbCBiZy1bIzAwRjJGRV0vMTAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMjAgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgXHVEODNEXHVEQzY1IHtzb05ndW9pIHx8IDF9IG5nXHUwMUIwXHUxRUREaSBcdTAxMTFhbmcgY1x1MDBGOW5nIHRcdTFFQURwIHRydW5nXG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG1sLWF1dG9cIj5cbiAgICAgICAgICB7aXNGb2N1c01vZGUgJiYgKFxuICAgICAgICAgICAgPHNwYW4gaWQ9XCJmb2N1cy1tb2RlLWFjdGl2ZS1pbmRpY2F0b3JcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1wdXJwbGUtNDAwIGJnLXB1cnBsZS01MDAvMTAgcHgtMiBweS0wLjUgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItcHVycGxlLTUwMC8yMCBhbmltYXRlLXB1bHNlXCI+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REZBRiBcdTAxMTBhbmcgYlx1MUVBRHQgRm9jdXMgTW9kZVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICl9XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtbW9kZS10b2dnbGVcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc0ZvY3VzTW9kZSghaXNGb2N1c01vZGUpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke2lzRm9jdXNNb2RlID8gJ2JnLXB1cnBsZS01MDAvMjAgdGV4dC1wdXJwbGUtMzAwIGJvcmRlci1wdXJwbGUtNTAwLzQwIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgxNjgsODUsMjQ3LDAuMyldJyA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGQUY8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj57aXNGb2N1c01vZGUgPyAnXHUyMUE5IFRob1x1MDBFMXQgRm9jdXMgTW9kZScgOiAnRm9jdXMgTW9kZSd9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAge2NhbkNvbnRyb2wgJiYgcGhvbmcuY2h1UGhvbmdLaG9hICE9PSAnaGUtdGhvbmcnICYmIChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e2RvbmdQaG9uZ0hpZW5UYWl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTUgaG92ZXI6Ymctcm9zZS01MDAvMjUgdGV4dC1yb3NlLTMwMCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgIFx1MDExMFx1MDBGM25nIHBoXHUwMEYybmdcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBNYWluIEZvY3VzIENlbnRlcnBpZWNlIENhcmQgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YHJlbGF0aXZlIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLTN4bCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgcC02IHNtOnAtOCBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciB0ZXh0LWNlbnRlciBzaGFkb3ctMnhsICR7aXNCcmVhayA/ICdiZy1ncmFkaWVudC10by1iIGZyb20tWyMxRTE3MTBdIHRvLVsjMTMxMTBFXSBib3JkZXItYW1iZXItNTAwLzMwJyA6ICdiZy1ncmFkaWVudC10by1iIGZyb20tWyMwRjFFMjhdIHRvLVsjMEExMjE5XSBib3JkZXItWyMwMEYyRkVdLzMwJ31gfT5cbiAgICAgICAgey8qIEdsb3cgYmFja2Ryb3AgYWNjZW50ICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGFic29sdXRlIC10b3AtMjQgLWxlZnQtMjQgdy03MiBoLTcyIHJvdW5kZWQtZnVsbCBibHVyLTN4bCBvcGFjaXR5LTIwIHBvaW50ZXItZXZlbnRzLW5vbmUgJHtpc0JyZWFrID8gJ2JnLWFtYmVyLTUwMCcgOiAnYmctWyMwMEYyRkVdJ31gfSAvPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGFic29sdXRlIC1ib3R0b20tMjQgLXJpZ2h0LTI0IHctNzIgaC03MiByb3VuZGVkLWZ1bGwgYmx1ci0zeGwgb3BhY2l0eS0yMCBwb2ludGVyLWV2ZW50cy1ub25lICR7aXNCcmVhayA/ICdiZy1vcmFuZ2UtNTAwJyA6ICdiZy1pbmRpZ28tNTAwJ31gfSAvPlxuXG4gICAgICAgIHsvKiBQaGFzZSAmIFN0YXR1cyBCYWRnZXMgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0yLjUgbWItNiB6LTEwXCI+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGlkPVwiZm9jdXMtcGhhc2UtYmFkZ2VcIlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTEgcm91bmRlZC1mdWxsIHRleHQteHMgZm9udC1leHRyYWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIGJvcmRlciBzaGFkb3ctc20gJHtpc0JyZWFrID8gJ2JnLWFtYmVyLTUwMC8xNSB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJyA6ICdiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyLVsjMDBGMkZFXS80MCd9YH0+XG4gICAgICAgICAgICB7aXNCcmVhayA/ICdcdTI2MTUgR2lcdTFFREQgTmdoXHUxRUM5IE5nXHUwMUExaSAoQnJlYWspJyA6ICdcdUQ4M0NcdURGNDUgUGhpXHUwMEVBbiBUXHUxRUFEcCBUcnVuZyAoRm9jdXMpJ31cbiAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgaWQ9XCJmb2N1cy1zdGF0dXMtYmFkZ2VcIlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke2lzUnVubmluZyA/ICdiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtNDAwIGJvcmRlci1lbWVyYWxkLTUwMC8zMCcgOiAnYmctc2xhdGUtNTAwLzE1IHRleHQtc2xhdGUtNDAwIGJvcmRlci1zbGF0ZS01MDAvMzAnfWB9PlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdy0yIGgtMiByb3VuZGVkLWZ1bGwgJHtpc1J1bm5pbmcgPyAnYmctZW1lcmFsZC00MDAgYW5pbWF0ZS1wdWxzZScgOiAnYmctc2xhdGUtNDAwJ31gfSAvPlxuICAgICAgICAgICAgPHNwYW4+e2lzUnVubmluZyA/ICdcdTAxMTBhbmcgXHUwMTExXHUxRUJGbScgOiAnVFx1MUVBMW0gZFx1MUVFQm5nJ308L3NwYW4+XG4gICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtcHJlc2V0LXRvZ2dsZVwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGRpc2FibGVkPXshY2FuQ29udHJvbCB8fCBkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGNhbkNvbnRyb2wgJiYgZ3VpTGVuaCgnc2V0X3ByZXNldCcsIHsgcHJlc2V0OiBmb2N1c1N0YXRlLnByZXNldCA9PT0gJzUwXzEwJyA/ICcyNV81JyA6ICc1MF8xMCcgfSl9XG4gICAgICAgICAgICB0aXRsZT17Y2FuQ29udHJvbCA/ICdCXHUxRUE1bSBcdTAxMTFcdTFFQzMgXHUwMTExXHUxRUQ1aSBjaHUga1x1MUVGMyBQb21vZG9ybycgOiAnQ2h1IGtcdTFFRjMgUG9tb2Rvcm8gaGlcdTFFQzduIHRcdTFFQTFpJ31cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LW1vbm8gZm9udC1ib2xkIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke2NhbkNvbnRyb2wgPyAnaG92ZXI6c2NhbGUtMTA1IGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlciBiZy13aGl0ZS8xMCB0ZXh0LXdoaXRlIGJvcmRlci13aGl0ZS8yMCcgOiAnY3Vyc29yLWRlZmF1bHQgYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgXHUyNjk5XHVGRTBGIHtmb2N1c1N0YXRlLnByZXNldCA9PT0gJzUwXzEwJyA/ICc1MCAvIDEwIHBoXHUwMEZBdCcgOiAnMjUgLyA1IHBoXHUwMEZBdCd9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBNYXNzaXZlIFRpbWVyIERpc3BsYXkgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXktMiBzbTpteS00IHotMTBcIj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgaWQ9XCJmb2N1cy10aW1lci1kaXNwbGF5XCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGZvbnQtbW9ubyB0ZXh0LTZ4bCBzbTp0ZXh0LTh4bCBmb250LWJsYWNrIHRyYWNraW5nLXdpZGVzdCBibG9jayB0cmFuc2l0aW9uLWFsbCBzZWxlY3Qtbm9uZSAke2lzQnJlYWsgPyAndGV4dC1hbWJlci0zMDAgZHJvcC1zaGFkb3ctWzBfMF8zNXB4X3JnYmEoMjQ1LDE1OCwxMSwwLjM1KV0nIDogJ3RleHQtWyMwMEYyRkVdIGRyb3Atc2hhZG93LVswXzBfMzVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0nfWB9PlxuICAgICAgICAgICAge2RpbmhEYW5nR2lheVBodXQobG9jYWxSZW1haW5pbmcpfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIFByb2dyZXNzIGJhciAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgbWF4LXctbWQgaC0yIGJnLWJsYWNrLzQwIHJvdW5kZWQtZnVsbCBvdmVyZmxvdy1oaWRkZW4gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBteS00IHotMTBcIj5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BoLWZ1bGwgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMTAwMCAke2lzQnJlYWsgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1vcmFuZ2UtNTAwJyA6ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjM0I4MkY2XSd9YH1cbiAgICAgICAgICAgIHN0eWxlPXt7IHdpZHRoOiBgJHtwcm9ncmVzc1BlcmNlbnR9JWAgfX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogQ29udHJvbCBCdXR0b25zIGZvciBIb3N0L1RlYWNoZXIgKi99XG4gICAgICAgIHtjYW5Db250cm9sID8gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0zIG10LTQgei0xMFwiPlxuICAgICAgICAgICAgeyFpc1J1bm5pbmcgPyAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1zdGFydFwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3N0YXJ0Jyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNiBweS0zIHJvdW5kZWQtMnhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1lbWVyYWxkLTQwMCB0by10ZWFsLTUwMCBob3Zlcjpmcm9tLWVtZXJhbGQtMzAwIGhvdmVyOnRvLXRlYWwtNDAwIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXNtIHNoYWRvdy1bMF8wXzIwcHhfcmdiYSg1MiwyMTEsMTUzLDAuMyldIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyNUI2PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPkJcdTFFQUZ0IFx1MDExMVx1MUVBN3U8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXBhdXNlXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgncGF1c2UnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC02IHB5LTMgcm91bmRlZC0yeGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1vcmFuZ2UtNTAwIGhvdmVyOmZyb20tYW1iZXItMzAwIGhvdmVyOnRvLW9yYW5nZS00MDAgdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQtc20gc2hhZG93LVswXzBfMjBweF9yZ2JhKDI1MSwxOTEsMzYsMC4zKV0gYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTIzRjg8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+VFx1MUVBMW0gZFx1MUVFQm5nPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtcmVzZXRcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdyZXNldCcpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTMgcm91bmRlZC0yeGwgYmctd2hpdGUvMTAgaG92ZXI6Ymctd2hpdGUvMTUgdGV4dC1zbGF0ZS0yMDAgdGV4dC1zbSBmb250LWJvbGQgYm9yZGVyIGJvcmRlci13aGl0ZS8xNSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwNDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+XHUwMTEwXHUxRUI3dCBsXHUxRUExaTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICB7aXNCcmVhayA/IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXN0YXJ0LWZvY3VzXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgnc3RhcnRfZm9jdXMnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTMgcm91bmRlZC0yeGwgYmctWyMwMEYyRkVdLzIwIGhvdmVyOmJnLVsjMDBGMkZFXS8zMCB0ZXh0LVsjMDBGMkZFXSB0ZXh0LXNtIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkFGPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlZcdTAwRTBvIFRcdTFFQURwIHRydW5nPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1zdGFydC1icmVha1wiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3N0YXJ0X2JyZWFrJyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0zIHJvdW5kZWQtMnhsIGJnLWFtYmVyLTUwMC8yMCBob3ZlcjpiZy1hbWJlci01MDAvMzAgdGV4dC1hbWJlci0zMDAgdGV4dC1zbSBmb250LWJvbGQgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvNDAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjYxNTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5OZ2hcdTFFQzkgbmdcdTAxQTFpPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBtdC0zIHotMTBcIj5cbiAgICAgICAgICAgIFx1MjNGMyBcdTAxMTBcdTFFRDNuZyBoXHUxRUQzIFBvbW9kb3JvIGRvIGNoXHUxRUU3IHBoXHUwMEYybmcgXHUwMTExaVx1MUVDMXUgcGhcdTFFRDFpIFx1MjAxNCBoXHUwMEUzeSB0XHUxRUFEcCB0cnVuZyBoXHUxRUJGdCBtXHUwMEVDbmggdlx1MDBFMG8gY1x1MDBGNG5nIHZpXHUxRUM3Yy9oXHUxRUNEYyB0XHUxRUFEcCBuaFx1MDBFOSFcbiAgICAgICAgICA8L3A+XG4gICAgICAgICl9XG5cbiAgICAgICAge2xvaSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtcm9zZS00MDAgbXQtNCB6LTEwXCI+e2xvaX08L3A+fVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBBbWJpZW50IEF1ZGlvIFBsYXllciBDYXJkICovfVxuICAgICAge25oYWNVcmwgPyAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC00IHNtOnAtNSBmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTQgc2hhZG93LXhsXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMy41IG1pbi13LTAgdy1mdWxsIHNtOnctYXV0b1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2B3LTEyIGgtMTIgcm91bmRlZC0yeGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC14bCBzaHJpbmstMCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHthdWRpb1BsYXlpbmcgPyAnYmctWyM4QjVDRjZdLzIwIHRleHQtWyM4QjVDRjZdIGJvcmRlci1bIzhCNUNGNl0vNDAgc2hhZG93LVswXzBfMTVweF9yZ2JhKDEzOSw5MiwyNDYsMC4zKV0gYW5pbWF0ZS1wdWxzZScgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGQTdcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4tdy0wXCI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtd2hpdGUgdHJ1bmNhdGVcIj5cdTAwQzJtIHRoYW5oIG5cdTFFQzFuIEFtYmllbnQ8L3A+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAge2F1ZGlvUGxheWluZyA/ICdcdTAxMTBhbmcgcGhcdTAwRTF0IGtoXHUwMEY0bmcgZ2lhbiBoXHUxRUNEYyB0XHUxRUFEcCcgOiAnXHUwMEMybSB0aGFuaCBjXHUxRUU1YyBiXHUxRUQ5IHRoZW8gdGhpXHUxRUJGdCBiXHUxRUNCJ31cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBnYXAtMyB3LWZ1bGwgc206dy1hdXRvIGp1c3RpZnktZW5kXCI+XG4gICAgICAgICAgICB7IWhhc0ludGVyYWN0ZWRBdWRpbyAmJiAhYXVkaW9QbGF5aW5nICYmIChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLXN0YXJ0LWZvY3VzLWF1ZGlvXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXtiYXRBbVRoYW5ofVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMiByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzhCNUNGNl0gdG8tWyM2MzY2RjFdIHRleHQtd2hpdGUgdGV4dC14cyBmb250LWJvbGQgc2hhZG93LWxnIGhvdmVyOm9wYWNpdHktOTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDBBPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPkJcdTFFQUR0IFx1MDBFMm0gdGhhbmggdFx1MUVBRHAgdHJ1bmc8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImZvY3VzLWF1ZGlvLXRvZ2dsZVwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVBdWRpb1BsYXl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMS41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHthdWRpb1BsYXlpbmcgPyAnYmctWyM4QjVDRjZdLzIwIHRleHQtWyM4QjVDRjZdIGJvcmRlci1bIzhCNUNGNl0vNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAgPHNwYW4+e2F1ZGlvUGxheWluZyA/ICdcdTIzRjggVFx1MUVBMW0gZFx1MUVFQm5nJyA6ICdcdTI1QjYgUGhcdTAwRTF0IHRpXHUxRUJGcCd9PC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e3RvZ2dsZUF1ZGlvTXV0ZX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0yIHJvdW5kZWQteGwgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQteHMgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAge2F1ZGlvTXV0ZWQgfHwgYXVkaW9Wb2x1bWUgPT09IDAgPyAnXHVEODNEXHVERDA3JyA6ICdcdUQ4M0RcdUREMDknfVxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICB0eXBlPVwicmFuZ2VcIlxuICAgICAgICAgICAgICBtaW49XCIwXCJcbiAgICAgICAgICAgICAgbWF4PVwiMVwiXG4gICAgICAgICAgICAgIHN0ZXA9XCIwLjA1XCJcbiAgICAgICAgICAgICAgdmFsdWU9e2F1ZGlvTXV0ZWQgPyAwIDogYXVkaW9Wb2x1bWV9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVWb2x1bWVDaGFuZ2V9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMjQgaC0xLjUgYmctd2hpdGUvMTAgcm91bmRlZC1sZyBhcHBlYXJhbmNlLW5vbmUgY3Vyc29yLXBvaW50ZXIgYWNjZW50LVsjOEI1Q0Y2XVwiXG4gICAgICAgICAgICAgIHRpdGxlPVwiXHUwMEMybSBsXHUwMUIwXHUxRUUzbmcgbmhcdTFFQTFjIG5cdTFFQzFuXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKSA6IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQtMnhsIHAtNCB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwXCI+XG4gICAgICAgICAgICBcdTI2MTUgUGhcdTAwRjJuZyBcdTFFREYgY2hcdTFFQkYgXHUwMTExXHUxRUQ5IHRcdTAxMjluaCBsXHUxRUI3bmcgKGNoXHUwMUIwYSBnXHUxRUFGbiBsaW5rIFx1MDBFMm0gdGhhbmggblx1MUVDMW4pIFx1MjAxNCBDaHV5XHUwMEVBbiB0XHUwMEUybSB0XHUxRUQxaSBcdTAxMTFhIHZcdTAwRTBvIGJcdTAwRTBpIHZcdTFFREYuXG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHtwaG9uZy5tb1RhICYmIChcbiAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgcHgtMiBsZWFkaW5nLXJlbGF4ZWRcIj5cbiAgICAgICAgICB7cGhvbmcubW9UYX1cbiAgICAgICAgPC9wPlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICJBQUFBLE1BQU0sRUFBRSxVQUFVLFdBQVcsT0FBTyxJQUFJO0FBQ3hDLFNBQVMsa0JBQWtCLGVBQWUsV0FBVyxtQkFBbUIscUJBQXFCLGtCQUFrQjtBQUsvRyxNQUFNLGFBQWEsQ0FBQyxPQUFPLE1BQU07QUFBRSxNQUFJLFNBQVMsb0JBQW9CLFVBQVcsSUFBRztBQUFHO0FBSTlFLGdCQUFTLFdBQVcsRUFBRSxPQUFPLFVBQVUsR0FBRztBQUMvQyxRQUFNLENBQUMsR0FBRyxJQUFJLElBQUksTUFBTSxTQUFTLEVBQUU7QUFDbkMsUUFBTSxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVM7QUFDN0IsU0FDRSxvQ0FBQyxTQUFJLFdBQVUsK0JBQ2I7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLElBQUc7QUFBQSxNQUNILE1BQUs7QUFBQSxNQUNMLE9BQU87QUFBQSxNQUNQLFVBQVUsT0FBSyxLQUFLLEVBQUUsT0FBTyxLQUFLO0FBQUEsTUFDbEMsV0FBVyxPQUFLO0FBQUUsWUFBSSxFQUFFLFFBQVEsV0FBVyxJQUFJO0FBQUUsWUFBRSxlQUFlO0FBQUcsZ0JBQU0sRUFBRSxLQUFLLENBQUM7QUFBRyxlQUFLLEVBQUU7QUFBQSxRQUFHO0FBQUEsTUFBRTtBQUFBLE1BQ2xHLGFBQVk7QUFBQSxNQUNaLFdBQVU7QUFBQTtBQUFBLEVBQ1osR0FDQTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQU8sTUFBSztBQUFBLE1BQVMsSUFBRztBQUFBLE1BQXFCLFVBQVUsQ0FBQztBQUFBLE1BQ3ZELFNBQVMsTUFBTTtBQUFFLGtCQUFVLEVBQUUsS0FBSyxDQUFDO0FBQUcsYUFBSyxFQUFFO0FBQUEsTUFBRztBQUFBLE1BQ2hELFdBQVU7QUFBQTtBQUFBLElBQTJLO0FBQUEsRUFFdkwsR0FDQTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQU8sTUFBSztBQUFBLE1BQVMsSUFBRztBQUFBLE1BQW9CLFVBQVUsQ0FBQztBQUFBLE1BQ3RELFNBQVMsTUFBTTtBQUFFLGNBQU0sRUFBRSxLQUFLLENBQUM7QUFBRyxhQUFLLEVBQUU7QUFBQSxNQUFHO0FBQUEsTUFDNUMsV0FBVTtBQUFBO0FBQUEsSUFBdUs7QUFBQSxFQUVuTCxDQUNGO0FBRUo7QUFHTyxnQkFBUyxVQUFVO0FBQUEsRUFBRTtBQUFBLEVBQU87QUFBQSxFQUFlO0FBQUEsRUFBTSxZQUFZLENBQUM7QUFBQSxFQUFHO0FBQUEsRUFBaUI7QUFBQSxFQUN2RixTQUFTLENBQUM7QUFBQSxFQUFHLFVBQVU7QUFBQSxFQUFPLGNBQWM7QUFBQSxFQUFVLFlBQVksQ0FBQztBQUFBLEVBQ25FLFdBQVc7QUFBQSxFQUFNLFNBQVMsQ0FBQztBQUFBLEVBQUc7QUFBQSxFQUFjO0FBQUEsRUFBVztBQUFBLEVBQ3ZELGFBQWE7QUFBQSxFQUFPO0FBQWlCLEdBQUc7QUFDeEMsUUFBTSxDQUFDLFNBQVMsVUFBVSxJQUFJLE1BQU0sU0FBUyxNQUFNO0FBR25ELFFBQU0sVUFBVSxDQUFDLFFBQVEsT0FBTyxHQUFHLE1BQU07QUFDekMsUUFBTSxnQkFBZ0IsTUFBTSxLQUFLLE1BQU0sY0FBYyxXQUFXLENBQUMsS0FBSztBQUd0RSxRQUFNLFlBQVksQ0FBQyxRQUFRO0FBQ3pCLFFBQUksT0FBTyxRQUFRLEVBQUUsT0FBTyxHQUFJO0FBQ2hDLFFBQUksV0FBVztBQUFFLGdCQUFVLEtBQUssT0FBTyxrQkFBa0IsSUFBSTtBQUFHO0FBQUEsSUFBUTtBQUN4RSxXQUFPLGNBQWMsSUFBSSxZQUFZLFdBQVcsRUFBRSxRQUFRLEVBQUUsU0FBUyxNQUFNLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQztBQUFBLEVBQ3pGO0FBR0EsUUFBTSxDQUFDLFdBQVcsWUFBWSxJQUFJLE1BQU0sU0FBUyxFQUFFO0FBQ25ELFFBQU0sQ0FBQyxhQUFhLGNBQWMsSUFBSSxNQUFNLFNBQVMsS0FBSztBQUMxRCxRQUFNLG1CQUFtQixNQUFNLE9BQU8sS0FBSztBQUMzQyxRQUFNLGFBQWEsTUFBTSxPQUFPLElBQUk7QUFFcEMsUUFBTSxVQUFVLE1BQU07QUFDcEIsUUFBSSxZQUFZLFVBQVUsV0FBVyxTQUFTO0FBQzVDLGlCQUFXLFFBQVEsZUFBZSxFQUFFLFVBQVUsU0FBUyxDQUFDO0FBQUEsSUFDMUQ7QUFBQSxFQUNGLEdBQUcsQ0FBQyxVQUFVLFFBQVEsT0FBTyxDQUFDO0FBRTlCLFFBQU0scUJBQXFCLENBQUMsTUFBTTtBQUNoQyxPQUFHLGVBQWU7QUFDbEIsVUFBTSxNQUFNLFVBQVUsS0FBSztBQUMzQixRQUFJLENBQUMsT0FBTyxZQUFhO0FBQ3pCLGlCQUFhLEVBQUU7QUFDZixtQkFBZSxJQUFJO0FBQ25CLFFBQUksaUJBQWlCO0FBQ25CLGNBQVEsUUFBUSxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsTUFBTSxNQUFNO0FBQ2hELHFCQUFhLFNBQU8sTUFBTSxNQUFNLEdBQUc7QUFBQSxNQUNyQyxDQUFDLEVBQUUsUUFBUSxNQUFNO0FBQ2YsdUJBQWUsS0FBSztBQUFBLE1BQ3RCLENBQUM7QUFBQSxJQUNILE9BQU87QUFDTCxxQkFBZSxLQUFLO0FBQUEsSUFDdEI7QUFBQSxFQUNGO0FBR0EsUUFBTSxDQUFDLFdBQVcsWUFBWSxJQUFJLE1BQU0sU0FBUyxDQUFDLENBQUM7QUFDbkQsUUFBTSxDQUFDLFdBQVcsWUFBWSxJQUFJLE1BQU0sU0FBUyxFQUFFO0FBQ25ELFFBQU0sQ0FBQyxjQUFjLGVBQWUsSUFBSSxNQUFNLFNBQVMsSUFBSTtBQUMzRCxRQUFNLENBQUMsZUFBZSxnQkFBZ0IsSUFBSSxNQUFNLFNBQVMsSUFBSTtBQUM3RCxRQUFNLENBQUMsYUFBYSxjQUFjLElBQUksTUFBTSxTQUFTLEVBQUU7QUFDdkQsUUFBTSxrQkFBa0IsTUFBTSxPQUFPLENBQUM7QUFDdEMsUUFBTSxtQkFBbUIsTUFBTSxPQUFPLEtBQUs7QUFFM0MsUUFBTSxVQUFVLE1BQU07QUFDcEIsUUFBSSxZQUFZLFFBQVM7QUFDekIsUUFBSSxTQUFTO0FBQ2IsVUFBTSxhQUFhLFlBQVk7QUFDN0IsVUFBSTtBQUNGLGNBQU0sTUFBTSxNQUFNLE1BQU0sNkJBQTZCLE1BQU0sRUFBRSxpQkFBaUI7QUFDOUUsY0FBTSxJQUFJLE1BQU0sSUFBSSxLQUFLO0FBQ3pCLFlBQUksVUFBVSxFQUFFLElBQUk7QUFDbEIsdUJBQWEsTUFBTSxRQUFRLEVBQUUsU0FBUyxLQUFLLElBQUksRUFBRSxRQUFRLFFBQVEsQ0FBQyxDQUFDO0FBQ25FLDBCQUFnQixVQUFVLEVBQUUsV0FBVztBQUN2QywyQkFBaUIsRUFBRSxhQUFhLEtBQUs7QUFBQSxRQUN2QyxXQUFXLFVBQVUsRUFBRSxTQUFTLGtCQUFrQjtBQUNoRCwyQkFBaUIsS0FBSztBQUFBLFFBQ3hCO0FBQUEsTUFDRixRQUFRO0FBQUEsTUFBQztBQUFBLElBQ1g7QUFDQSxlQUFXO0FBQ1gsVUFBTSxXQUFXLFlBQVksV0FBVyxVQUFVLEdBQUcsR0FBSTtBQUN6RCxXQUFPLE1BQU07QUFBRSxlQUFTO0FBQU8sb0JBQWMsUUFBUTtBQUFBLElBQUc7QUFBQSxFQUMxRCxHQUFHLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQztBQUV0QixRQUFNLGFBQWEsWUFBWTtBQUM3QixVQUFNLE9BQU8sVUFBVSxLQUFLO0FBQzVCLFFBQUksQ0FBQyxLQUFNO0FBQ1gsbUJBQWUsRUFBRTtBQUNqQixRQUFJO0FBQ0YsWUFBTSxNQUFNLE1BQU0sTUFBTSxxQkFBcUI7QUFBQSxRQUMzQyxRQUFRO0FBQUEsUUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLFFBQzlDLE1BQU0sS0FBSyxVQUFVO0FBQUEsVUFDbkIsU0FBUyxNQUFNO0FBQUEsVUFDZixVQUFVO0FBQUEsVUFDVixTQUFTLEVBQUUsTUFBTSxjQUFjLGVBQWUsY0FBYyxJQUFJLEtBQUs7QUFBQSxRQUN2RSxDQUFDO0FBQUEsTUFDSCxDQUFDO0FBQ0QsWUFBTSxJQUFJLE1BQU0sSUFBSSxLQUFLO0FBQ3pCLFVBQUksRUFBRSxJQUFJO0FBQ1IscUJBQWEsRUFBRTtBQUNmLHFCQUFhLFVBQVEsQ0FBQyxHQUFHLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxLQUFLLEtBQUssTUFBTSxPQUFPLFlBQU8sU0FBUyxNQUFNLGNBQWMsZUFBZSxjQUFjLElBQUksTUFBTSxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQUEsTUFDM0osT0FBTztBQUNMLHVCQUFlLEVBQUUsT0FBTyxtREFBeUI7QUFBQSxNQUNuRDtBQUFBLElBQ0YsUUFBUTtBQUFFLHFCQUFlLDZCQUFjO0FBQUEsSUFBRztBQUFBLEVBQzVDO0FBRUEsUUFBTSxZQUFZLE9BQU8sT0FBTztBQUM5QixRQUFJO0FBQ0YsWUFBTSxNQUFNLE1BQU0sTUFBTSxxQkFBcUI7QUFBQSxRQUMzQyxRQUFRO0FBQUEsUUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLFFBQzlDLE1BQU0sS0FBSyxVQUFVLEVBQUUsU0FBUyxNQUFNLElBQUksVUFBVSxTQUFTLFFBQVEsWUFBWSxHQUFHLENBQUM7QUFBQSxNQUN2RixDQUFDO0FBQ0QsWUFBTSxJQUFJLE1BQU0sSUFBSSxLQUFLO0FBQ3pCLFVBQUksRUFBRSxHQUFJLGNBQWEsVUFBUSxLQUFLLE9BQU8sT0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDO0FBQUEsSUFDOUQsUUFBUTtBQUFBLElBQUM7QUFBQSxFQUNYO0FBR0EsUUFBTSxZQUFZLE1BQU0sT0FBTyxJQUFJO0FBQ25DLFFBQU0sQ0FBQyxXQUFXLFlBQVksSUFBSSxNQUFNLFNBQVMsQ0FBQyxDQUFDO0FBQ25ELFFBQU0sQ0FBQyxTQUFTLFVBQVUsSUFBSSxNQUFNLFNBQVMsU0FBUztBQUN0RCxRQUFNLENBQUMsU0FBUyxVQUFVLElBQUksTUFBTSxTQUFTLENBQUM7QUFDOUMsUUFBTSxDQUFDLFFBQVEsU0FBUyxJQUFJLE1BQU0sU0FBUyxLQUFLO0FBQ2hELFFBQU0sZUFBZSxNQUFNLE9BQU8sS0FBSztBQUN2QyxRQUFNLG1CQUFtQixNQUFNLE9BQU8sSUFBSTtBQUMxQyxRQUFNLGVBQWUsTUFBTSxPQUFPLENBQUM7QUFFbkMsUUFBTSxlQUFlLE1BQU0sWUFBWSxDQUFDLFlBQVk7QUFDbEQsVUFBTSxTQUFTLFVBQVU7QUFDekIsUUFBSSxDQUFDLE9BQVE7QUFDYixVQUFNLE1BQU0sT0FBTyxXQUFXLElBQUk7QUFDbEMsUUFBSSxVQUFVLEdBQUcsR0FBRyxPQUFPLE9BQU8sT0FBTyxNQUFNO0FBQy9DLFlBQVEsUUFBUSxPQUFLO0FBQ25CLFVBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxPQUFPLFNBQVMsRUFBRztBQUN0QyxVQUFJLFVBQVU7QUFDZCxVQUFJLGNBQWMsRUFBRSxTQUFTLFdBQVcsWUFBYSxFQUFFLFNBQVM7QUFDaEUsVUFBSSxZQUFZLEVBQUUsU0FBUztBQUMzQixVQUFJLFVBQVU7QUFDZCxVQUFJLFdBQVc7QUFDZixVQUFJLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQztBQUN2QyxlQUFTLElBQUksR0FBRyxJQUFJLEVBQUUsT0FBTyxRQUFRLEtBQUs7QUFDeEMsWUFBSSxPQUFPLEVBQUUsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUM7QUFBQSxNQUN6QztBQUNBLFVBQUksT0FBTztBQUFBLElBQ2IsQ0FBQztBQUFBLEVBQ0gsR0FBRyxDQUFDLENBQUM7QUFFTCxRQUFNLENBQUMsWUFBWSxhQUFhLElBQUksTUFBTSxTQUFTLElBQUk7QUFHdkQsUUFBTSxXQUFXLENBQUMsU0FBUyxPQUFPO0FBQ2hDLFFBQUksR0FBRyxTQUFTLFFBQVMsUUFBTyxDQUFDO0FBQ2pDLFFBQUksR0FBRyxTQUFTLFlBQVksR0FBRyxPQUFRLFFBQU8sQ0FBQyxHQUFHLFNBQVMsR0FBRyxNQUFNO0FBQ3BFLFdBQU87QUFBQSxFQUNUO0FBRUEsUUFBTSxVQUFVLE1BQU07QUFDcEIsUUFBSSxZQUFZLGFBQWM7QUFDOUIsUUFBSSxTQUFTO0FBQ2IsVUFBTSxVQUFVLFlBQVk7QUFDMUIsVUFBSTtBQUNGLGNBQU0sTUFBTSxNQUFNLE1BQU0sNkJBQTZCLE1BQU0sRUFBRSw4QkFBOEIsYUFBYSxPQUFPLEVBQUU7QUFDakgsY0FBTSxJQUFJLE1BQU0sSUFBSSxLQUFLO0FBQ3pCLFlBQUksVUFBVSxFQUFFLElBQUk7QUFDbEIsZ0JBQU0sTUFBTSxNQUFNLFFBQVEsRUFBRSxTQUFTLEdBQUcsSUFBSSxFQUFFLFFBQVEsTUFBTSxDQUFDO0FBQzdELGNBQUksSUFBSSxRQUFRO0FBRWQsZ0JBQUksSUFBSSxLQUFLLE9BQUssRUFBRSxTQUFTLE9BQU8sR0FBRztBQUNyQyxvQkFBTSxPQUFPLE1BQU0sTUFBTSw2QkFBNkIsTUFBTSxFQUFFLDhCQUE4QjtBQUM1RixvQkFBTSxLQUFLLE1BQU0sS0FBSyxLQUFLO0FBQzNCLGtCQUFJLFVBQVUsR0FBRyxJQUFJO0FBQ25CLHNCQUFNLFNBQVMsTUFBTSxRQUFRLEdBQUcsU0FBUyxHQUFHLElBQUksR0FBRyxRQUFRLE1BQU0sQ0FBQztBQUNsRSxzQkFBTSxVQUFVLE9BQU8sT0FBTyxVQUFVLENBQUMsQ0FBQztBQUMxQyw2QkFBYSxPQUFPO0FBQ3BCLDZCQUFhLE9BQU87QUFBQSxjQUN0QjtBQUFBLFlBQ0YsT0FBTztBQUNMLDJCQUFhLFVBQVE7QUFDbkIsc0JBQU0sT0FBTyxJQUFJLE9BQU8sVUFBVSxJQUFJO0FBQ3RDLDZCQUFhLElBQUk7QUFDakIsdUJBQU87QUFBQSxjQUNULENBQUM7QUFBQSxZQUNIO0FBQUEsVUFDRjtBQUNBLHVCQUFhLFVBQVUsRUFBRSxXQUFXO0FBQ3BDLHdCQUFjLEVBQUUsYUFBYSxLQUFLO0FBQUEsUUFDcEMsV0FBVyxVQUFVLEVBQUUsU0FBUyxrQkFBa0I7QUFDaEQsd0JBQWMsS0FBSztBQUFBLFFBQ3JCO0FBQUEsTUFDRixRQUFRO0FBQUEsTUFBQztBQUFBLElBQ1g7QUFDQSxZQUFRO0FBQ1IsVUFBTSxXQUFXLFlBQVksV0FBVyxPQUFPLEdBQUcsR0FBSTtBQUN0RCxXQUFPLE1BQU07QUFBRSxlQUFTO0FBQU8sb0JBQWMsUUFBUTtBQUFBLElBQUc7QUFBQSxFQUMxRCxHQUFHLENBQUMsTUFBTSxJQUFJLFNBQVMsWUFBWSxDQUFDO0FBRXBDLFFBQU0sZUFBZSxDQUFDLE1BQU07QUFDMUIsVUFBTSxTQUFTLFVBQVU7QUFDekIsUUFBSSxDQUFDLE9BQVE7QUFDYixVQUFNLE9BQU8sT0FBTyxzQkFBc0I7QUFDMUMsVUFBTSxVQUFVLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsR0FBRztBQUN6RCxVQUFNLFVBQVUsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxHQUFHO0FBQ3pELFVBQU0sSUFBSSxVQUFVLEtBQUs7QUFDekIsVUFBTSxJQUFJLFVBQVUsS0FBSztBQUN6QixpQkFBYSxVQUFVO0FBQ3ZCLHFCQUFpQixVQUFVO0FBQUEsTUFDekIsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLE1BQ1AsT0FBTyxXQUFXLFdBQVcsS0FBSztBQUFBLE1BQ2xDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0FBQUEsSUFDbkI7QUFBQSxFQUNGO0FBRUEsUUFBTSxXQUFXLENBQUMsTUFBTTtBQUN0QixRQUFJLENBQUMsYUFBYSxXQUFXLENBQUMsaUJBQWlCLFFBQVM7QUFDeEQsVUFBTSxTQUFTLFVBQVU7QUFDekIsUUFBSSxDQUFDLE9BQVE7QUFDYixVQUFNLE9BQU8sT0FBTyxzQkFBc0I7QUFDMUMsVUFBTSxVQUFVLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsR0FBRztBQUN6RCxVQUFNLFVBQVUsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxHQUFHO0FBQ3pELFVBQU0sSUFBSSxVQUFVLEtBQUs7QUFDekIsVUFBTSxJQUFJLFVBQVUsS0FBSztBQUN6QixxQkFBaUIsUUFBUSxPQUFPLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQztBQUM3QyxVQUFNLE1BQU0sT0FBTyxXQUFXLElBQUk7QUFDbEMsUUFBSSxVQUFVO0FBQ2QsUUFBSSxjQUFjLGlCQUFpQixRQUFRLFNBQVMsV0FBVyxZQUFZLGlCQUFpQixRQUFRO0FBQ3BHLFFBQUksWUFBWSxpQkFBaUIsUUFBUTtBQUN6QyxRQUFJLFVBQVU7QUFDZCxRQUFJLFdBQVc7QUFDZixVQUFNLE1BQU0saUJBQWlCLFFBQVE7QUFDckMsUUFBSSxJQUFJLFVBQVUsR0FBRztBQUNuQixVQUFJLE9BQU8sSUFBSSxJQUFJLFNBQVMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxJQUFJLFNBQVMsQ0FBQyxFQUFFLENBQUM7QUFDdkQsVUFBSSxPQUFPLElBQUksSUFBSSxTQUFTLENBQUMsRUFBRSxHQUFHLElBQUksSUFBSSxTQUFTLENBQUMsRUFBRSxDQUFDO0FBQ3ZELFVBQUksT0FBTztBQUFBLElBQ2I7QUFBQSxFQUNGO0FBRUEsUUFBTSxjQUFjLFlBQVk7QUFDOUIsUUFBSSxDQUFDLGFBQWEsUUFBUztBQUMzQixpQkFBYSxVQUFVO0FBQ3ZCLFFBQUksaUJBQWlCLFdBQVcsaUJBQWlCLFFBQVEsT0FBTyxTQUFTLEdBQUc7QUFDMUUsWUFBTSxTQUFTLGlCQUFpQjtBQUNoQyxZQUFNLGNBQWMsQ0FBQyxHQUFHLFdBQVcsTUFBTTtBQUN6QyxtQkFBYSxXQUFXO0FBQ3hCLHVCQUFpQixVQUFVO0FBQzNCLFVBQUk7QUFDRixjQUFNLE1BQU0sTUFBTSxNQUFNLHFCQUFxQjtBQUFBLFVBQzNDLFFBQVE7QUFBQSxVQUNSLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsVUFDOUMsTUFBTSxLQUFLLFVBQVU7QUFBQSxZQUNuQixTQUFTLE1BQU07QUFBQSxZQUNmLFVBQVU7QUFBQSxZQUNWLFNBQVMsRUFBRSxNQUFNLFVBQVUsT0FBTztBQUFBLFVBQ3BDLENBQUM7QUFBQSxRQUNILENBQUM7QUFDRCxjQUFNLElBQUksTUFBTSxJQUFJLEtBQUs7QUFDekIsWUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFJLGNBQWEsVUFBVSxLQUFLLElBQUksYUFBYSxTQUFTLEVBQUUsRUFBRTtBQUFBLE1BQzlFLFFBQVE7QUFBQSxNQUFDO0FBQUEsSUFDWDtBQUFBLEVBQ0Y7QUFFQSxRQUFNLGtCQUFrQixZQUFZO0FBQ2xDLFFBQUksQ0FBQyxRQUFRLCtHQUF5RCxFQUFHO0FBQ3pFLFFBQUk7QUFDRixZQUFNLE1BQU0sTUFBTSxNQUFNLHFCQUFxQjtBQUFBLFFBQzNDLFFBQVE7QUFBQSxRQUNSLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsUUFDOUMsTUFBTSxLQUFLLFVBQVU7QUFBQSxVQUNuQixTQUFTLE1BQU07QUFBQSxVQUNmLFVBQVU7QUFBQSxVQUNWLFNBQVMsRUFBRSxNQUFNLFFBQVE7QUFBQSxRQUMzQixDQUFDO0FBQUEsTUFDSCxDQUFDO0FBQ0QsWUFBTSxJQUFJLE1BQU0sSUFBSSxLQUFLO0FBQ3pCLFVBQUksRUFBRSxJQUFJO0FBQ1IscUJBQWEsQ0FBQyxDQUFDO0FBQ2YsY0FBTSxTQUFTLFVBQVU7QUFDekIsWUFBSSxRQUFRO0FBQ1YsZ0JBQU0sTUFBTSxPQUFPLFdBQVcsSUFBSTtBQUNsQyxjQUFJLFVBQVUsR0FBRyxHQUFHLE9BQU8sT0FBTyxPQUFPLE1BQU07QUFBQSxRQUNqRDtBQUFBLE1BQ0Y7QUFBQSxJQUNGLFFBQVE7QUFBQSxJQUFDO0FBQUEsRUFDWDtBQUdBLFFBQU0sT0FBTyxDQUFDLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssR0FBRztBQUNwRCxRQUFNLE9BQU8sQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxFQUFFO0FBQzNDLFFBQU0sQ0FBQyxZQUFZLGFBQWEsSUFBSSxNQUFNLFNBQVMsQ0FBQyxDQUFDO0FBQ3JELFFBQU0sQ0FBQyxlQUFlLGdCQUFnQixJQUFJLE1BQU0sU0FBUyxJQUFJO0FBQzdELFFBQU0scUJBQXFCLE1BQU0sT0FBTyxDQUFDLENBQUM7QUFDMUMsUUFBTSxzQkFBc0IsTUFBTSxPQUFPLElBQUk7QUFDN0MsUUFBTSxlQUFlLE1BQU0sT0FBTyxDQUFDO0FBRW5DLFFBQU0sVUFBVSxNQUFNO0FBQ3BCLFFBQUksWUFBWSxRQUFTO0FBQ3pCLFFBQUksU0FBUztBQUNiLFVBQU0sYUFBYSxZQUFZO0FBQzdCLFVBQUk7QUFDRixjQUFNLE1BQU0sTUFBTSxNQUFNLDZCQUE2QixNQUFNLEVBQUUsaUJBQWlCO0FBQzlFLGNBQU0sSUFBSSxNQUFNLElBQUksS0FBSztBQUN6QixZQUFJLFVBQVUsRUFBRSxJQUFJO0FBQ2xCLGdCQUFNLFdBQVcsRUFBRSxTQUFTLFNBQVMsQ0FBQztBQUV0Qyx3QkFBYyxVQUFRO0FBQ3BCLGtCQUFNLFNBQVMsRUFBRSxHQUFHLFNBQVM7QUFDN0Isa0JBQU0sU0FBUyxvQkFBb0I7QUFDbkMsZ0JBQUksVUFBVSxLQUFLLE1BQU0sTUFBTSxPQUFXLFFBQU8sTUFBTSxJQUFJLEtBQUssTUFBTTtBQUN0RSxtQkFBTztBQUFBLFVBQ1QsQ0FBQztBQUNELDJCQUFpQixFQUFFLGFBQWEsS0FBSztBQUFBLFFBQ3ZDLFdBQVcsVUFBVSxFQUFFLFNBQVMsa0JBQWtCO0FBQ2hELDJCQUFpQixLQUFLO0FBQUEsUUFDeEI7QUFBQSxNQUNGLFFBQVE7QUFBQSxNQUFDO0FBQUEsSUFDWDtBQUNBLGVBQVc7QUFDWCxVQUFNLFdBQVcsWUFBWSxXQUFXLFVBQVUsR0FBRyxHQUFJO0FBQ3pELFdBQU8sTUFBTTtBQUFFLGVBQVM7QUFBTyxvQkFBYyxRQUFRO0FBQUEsSUFBRztBQUFBLEVBQzFELEdBQUcsQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDO0FBRXRCLFFBQU0sbUJBQW1CLENBQUMsU0FBUyxRQUFRO0FBQ3pDLGtCQUFjLFdBQVMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxFQUFFO0FBQ25ELFVBQU0sU0FBUyxtQkFBbUI7QUFDbEMsUUFBSSxPQUFPLE9BQU8sRUFBRyxjQUFhLE9BQU8sT0FBTyxDQUFDO0FBQ2pELFdBQU8sT0FBTyxJQUFJLFdBQVcsWUFBWTtBQUN2QyxVQUFJO0FBQ0YsY0FBTSxNQUFNLHFCQUFxQjtBQUFBLFVBQy9CLFFBQVE7QUFBQSxVQUNSLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsVUFDOUMsTUFBTSxLQUFLLFVBQVU7QUFBQSxZQUNuQixTQUFTLE1BQU07QUFBQSxZQUNmLFVBQVU7QUFBQSxZQUNWLFNBQVMsRUFBRSxNQUFNLFNBQVMsT0FBTyxJQUFJO0FBQUEsVUFDdkMsQ0FBQztBQUFBLFFBQ0gsQ0FBQztBQUFBLE1BQ0gsUUFBUTtBQUFBLE1BQUM7QUFBQSxJQUNYLEdBQUcsR0FBRztBQUFBLEVBQ1I7QUFHQSxRQUFNLENBQUMsYUFBYSxjQUFjLElBQUksTUFBTSxTQUFTLEtBQUs7QUFDMUQsUUFBTSxDQUFDLFVBQVUsV0FBVyxJQUFJLE1BQU0sU0FBUyxJQUFJO0FBQ25ELFFBQU0sQ0FBQyxZQUFZLGFBQWEsSUFBSSxNQUFNLFNBQVMsY0FBYztBQUNqRSxRQUFNLENBQUMsYUFBYSxjQUFjLElBQUksTUFBTSxTQUFTLEVBQUU7QUFDdkQsUUFBTSxDQUFDLFdBQVcsWUFBWSxJQUFJLE1BQU0sU0FBUyxJQUFJO0FBQ3JELFFBQU0sQ0FBQyxnQkFBZ0IsaUJBQWlCLElBQUksTUFBTSxTQUFTLEtBQUs7QUFDaEUsUUFBTSxDQUFDLGFBQWEsY0FBYyxJQUFJLE1BQU0sU0FBUyxDQUFDLENBQUM7QUFDdkQsUUFBTSxRQUFRLE1BQU0sT0FBTyxJQUFJO0FBQy9CLFFBQU0saUJBQWlCLE1BQU0sT0FBTyxJQUFJO0FBQ3hDLFFBQU0saUJBQWlCLE1BQU0sT0FBTyxJQUFJO0FBQ3hDLFFBQU0sa0JBQWtCLE1BQU0sT0FBTyxDQUFDO0FBQ3RDLFFBQU0sb0JBQW9CLE1BQU0sT0FBTyxJQUFJO0FBQzNDLFFBQU0sZUFBZSxNQUFNLE9BQU8sSUFBSTtBQUN0QyxRQUFNLGlCQUFpQixNQUFNLE9BQU8sS0FBSztBQUN6QyxRQUFNLHVCQUF1QixNQUFNLE9BQU8sQ0FBQyxDQUFDO0FBQzVDLGlCQUFlLFVBQVU7QUFFekIsUUFBTSxrQkFBa0IsTUFBTTtBQUM1QixRQUFJLGVBQWUsU0FBUztBQUMxQixxQkFBZSxRQUFRLFVBQVUsRUFBRSxRQUFRLE9BQUssRUFBRSxLQUFLLENBQUM7QUFDeEQscUJBQWUsVUFBVTtBQUFBLElBQzNCO0FBQ0EsUUFBSSxNQUFNLFNBQVM7QUFDakIsWUFBTSxRQUFRLE1BQU07QUFDcEIsWUFBTSxVQUFVO0FBQUEsSUFDbEI7QUFDQSx5QkFBcUIsVUFBVSxDQUFDO0FBQ2hDLGdCQUFZLElBQUk7QUFBQSxFQUNsQjtBQUdBLFFBQU0sWUFBWSxZQUFZO0FBQzVCLFFBQUk7QUFDRixZQUFNLE1BQU0sTUFBTSxNQUFNLDZCQUE2QixNQUFNLEVBQUUsNEJBQTRCLGdCQUFnQixPQUFPLEVBQUU7QUFDbEgsWUFBTSxJQUFJLE1BQU0sSUFBSSxLQUFLO0FBQ3pCLFVBQUksQ0FBQyxFQUFFLEdBQUk7QUFDWCxVQUFJLEVBQUUsS0FBTSxjQUFhLEVBQUUsSUFBSTtBQUMvQixVQUFJLE1BQU0sUUFBUSxFQUFFLFdBQVcsRUFBRyxnQkFBZSxFQUFFLFdBQVc7QUFDOUQsWUFBTSxLQUFLLE1BQU07QUFDakIsVUFBSSxDQUFDLGVBQWUsV0FBVyxDQUFDLEdBQUk7QUFDcEMsaUJBQVcsT0FBTyxFQUFFLFdBQVcsQ0FBQyxHQUFHO0FBQ2pDLHdCQUFnQixVQUFVLEtBQUssSUFBSSxnQkFBZ0IsU0FBUyxJQUFJLEVBQUU7QUFDbEUsWUFBSTtBQUNGLGNBQUksSUFBSSxlQUFlLFNBQVM7QUFFOUIsa0JBQU0sR0FBRyxxQkFBcUIsSUFBSSxzQkFBc0IsSUFBSSxPQUFPLENBQUM7QUFFcEUsdUJBQVcsS0FBSyxxQkFBcUIsU0FBUztBQUM1QyxvQkFBTSxHQUFHLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLENBQUMsRUFBRSxNQUFNLE1BQU07QUFBQSxjQUFDLENBQUM7QUFBQSxZQUNqRTtBQUNBLGlDQUFxQixVQUFVLENBQUM7QUFDaEMsa0JBQU0sTUFBTSxNQUFNLEdBQUcsYUFBYTtBQUNsQyxrQkFBTSxHQUFHLG9CQUFvQixHQUFHO0FBQ2hDLGtCQUFNLE1BQU0scUJBQXFCO0FBQUEsY0FDL0IsUUFBUTtBQUFBLGNBQ1IsU0FBUyxFQUFFLGdCQUFnQixtQkFBbUI7QUFBQSxjQUM5QyxNQUFNLEtBQUssVUFBVSxFQUFFLFNBQVMsTUFBTSxJQUFJLFFBQVEsZ0JBQWdCLFlBQVksVUFBVSxTQUFTLElBQUksQ0FBQztBQUFBLFlBQ3hHLENBQUM7QUFBQSxVQUNILFdBQVcsSUFBSSxlQUFlLFVBQVU7QUFDdEMsZ0JBQUksR0FBRyxtQkFBbUIsb0JBQW9CO0FBQzVDLG9CQUFNLEdBQUcscUJBQXFCLElBQUksc0JBQXNCLElBQUksT0FBTyxDQUFDO0FBQ3BFLHlCQUFXLEtBQUsscUJBQXFCLFNBQVM7QUFDNUMsc0JBQU0sR0FBRyxnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsTUFBTSxNQUFNO0FBQUEsZ0JBQUMsQ0FBQztBQUFBLGNBQ2pFO0FBQ0EsbUNBQXFCLFVBQVUsQ0FBQztBQUFBLFlBQ2xDO0FBQUEsVUFDRixXQUFXLElBQUksZUFBZSxhQUFhO0FBQ3pDLGdCQUFJLEdBQUcsbUJBQW1CO0FBQ3hCLG9CQUFNLEdBQUcsZ0JBQWdCLElBQUksZ0JBQWdCLElBQUksT0FBTyxDQUFDLEVBQUUsTUFBTSxNQUFNO0FBQUEsY0FBQyxDQUFDO0FBQUEsWUFDM0UsT0FBTztBQUNMLG1DQUFxQixRQUFRLEtBQUssSUFBSSxPQUFPO0FBQUEsWUFDL0M7QUFBQSxVQUNGLFdBQVcsSUFBSSxlQUFlLFNBQVM7QUFDckMsMkJBQWUsaURBQTBCO0FBQ3pDLDBCQUFjLGNBQWM7QUFDNUIsNEJBQWdCO0FBQ2hCLDJCQUFlLEtBQUs7QUFDcEIseUJBQWEsVUFBVTtBQUFBLFVBQ3pCO0FBQUEsUUFDRixRQUFRO0FBQUEsUUFBMEI7QUFBQSxNQUNwQztBQUFBLElBQ0YsUUFBUTtBQUFBLElBQUM7QUFBQSxFQUNYO0FBR0EsUUFBTSxVQUFVLE1BQU07QUFDcEIsUUFBSSxZQUFZLFdBQVcsQ0FBQyxZQUFhO0FBQ3pDLGNBQVU7QUFDVixzQkFBa0IsVUFBVSxZQUFZLFdBQVcsSUFBSTtBQUN2RCxXQUFPLE1BQU07QUFBRSxVQUFJLGtCQUFrQixRQUFTLGVBQWMsa0JBQWtCLE9BQU87QUFBQSxJQUFHO0FBQUEsRUFDMUYsR0FBRyxDQUFDLE1BQU0sSUFBSSxTQUFTLFdBQVcsQ0FBQztBQUVuQyxRQUFNLFlBQVksWUFBWTtBQUM1QixtQkFBZSxnREFBaUM7QUFDaEQsa0JBQWMsWUFBWTtBQUMxQixRQUFJO0FBRUYsWUFBTSxVQUFVLE1BQU0sTUFBTSxxQkFBcUI7QUFBQSxRQUMvQyxRQUFRO0FBQUEsUUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLFFBQzlDLE1BQU0sS0FBSyxVQUFVLEVBQUUsU0FBUyxNQUFNLElBQUksUUFBUSxhQUFhLENBQUM7QUFBQSxNQUNsRSxDQUFDO0FBQ0QsWUFBTSxXQUFXLE1BQU0sUUFBUSxLQUFLO0FBQ3BDLFVBQUksQ0FBQyxTQUFTLElBQUk7QUFDaEIsWUFBSSxTQUFTLFNBQVMsa0JBQWtCO0FBQ3RDLHlCQUFlLGdIQUEyRDtBQUFBLFFBQzVFLE9BQU87QUFDTCx5QkFBZSxTQUFTLE9BQU8sbUNBQTJCO0FBQUEsUUFDNUQ7QUFDQSxzQkFBYyxjQUFjO0FBQzVCO0FBQUEsTUFDRjtBQUNBLG1CQUFhLFVBQVUsU0FBUztBQUNoQyxxQkFBZSxJQUFJO0FBS25CLFVBQUk7QUFDRixjQUFNLFNBQVMsTUFBTSxVQUFVLGFBQWEsYUFBYSxFQUFFLE9BQU8sTUFBTSxPQUFPLE1BQU0sQ0FBQztBQUN0RixlQUFPLGVBQWUsRUFBRSxRQUFRLE9BQUs7QUFBRSxZQUFFLFVBQVU7QUFBQSxRQUFPLENBQUM7QUFDM0QsdUJBQWUsVUFBVTtBQUFBLE1BQzNCLFFBQVE7QUFDTix1QkFBZSxnSUFBMkQ7QUFBQSxNQUM1RTtBQUdBLFlBQU0sS0FBSyxJQUFJLGtCQUFrQjtBQUFBLFFBQy9CLFlBQVksQ0FBQyxFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFBQSxNQUN2RCxDQUFDO0FBQ0QsWUFBTSxVQUFVO0FBQ2hCLFVBQUksZUFBZSxTQUFTO0FBQzFCLHVCQUFlLFFBQVEsVUFBVSxFQUFFLFFBQVEsT0FBSyxHQUFHLFNBQVMsR0FBRyxlQUFlLE9BQU8sQ0FBQztBQUFBLE1BQ3hGO0FBRUEsU0FBRyxpQkFBaUIsQ0FBQyxVQUFVO0FBQzdCLFlBQUksTUFBTSxXQUFXO0FBQ25CLGdCQUFNLHFCQUFxQjtBQUFBLFlBQ3pCLFFBQVE7QUFBQSxZQUNSLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsWUFDOUMsTUFBTSxLQUFLLFVBQVU7QUFBQSxjQUNuQixTQUFTLE1BQU07QUFBQSxjQUNmLFFBQVE7QUFBQSxjQUNSLFlBQVk7QUFBQSxjQUNaLFNBQVMsTUFBTTtBQUFBLFlBQ2pCLENBQUM7QUFBQSxVQUNILENBQUMsRUFBRSxNQUFNLE1BQU07QUFBQSxVQUFDLENBQUM7QUFBQSxRQUNuQjtBQUFBLE1BQ0Y7QUFFQSxTQUFHLFVBQVUsQ0FBQyxVQUFVO0FBQ3RCLFlBQUksZUFBZSxXQUFXLE1BQU0sUUFBUSxDQUFDLEdBQUc7QUFDOUMseUJBQWUsUUFBUSxZQUFZLE1BQU0sUUFBUSxDQUFDO0FBQ2xELHlCQUFlLFFBQVEsS0FBSyxFQUFFLE1BQU0sTUFBTTtBQUFBLFVBQUMsQ0FBQztBQUFBLFFBQzlDO0FBQUEsTUFDRjtBQUVBLFNBQUcsMEJBQTBCLE1BQU07QUFDakMsY0FBTSxJQUFJLEdBQUc7QUFDYixZQUFJLE1BQU0sYUFBYTtBQUNyQix3QkFBYyxXQUFXO0FBQ3pCLHlCQUFlLHdFQUFxQztBQUFBLFFBQ3RELFdBQVcsTUFBTSxZQUFZLE1BQU0sZ0JBQWdCO0FBQ2pELHdCQUFjLGNBQWM7QUFDNUIseUJBQWUsK0ZBQXNEO0FBQUEsUUFDdkU7QUFBQSxNQUNGO0FBR0EsVUFBSSxTQUFTLFNBQVMsS0FBSztBQUN6QixjQUFNLFFBQVEsTUFBTSxHQUFHLFlBQVk7QUFDbkMsY0FBTSxHQUFHLG9CQUFvQixLQUFLO0FBQ2xDLGNBQU0sTUFBTSxxQkFBcUI7QUFBQSxVQUMvQixRQUFRO0FBQUEsVUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLFVBQzlDLE1BQU0sS0FBSyxVQUFVLEVBQUUsU0FBUyxNQUFNLElBQUksUUFBUSxnQkFBZ0IsWUFBWSxTQUFTLFNBQVMsTUFBTSxDQUFDO0FBQUEsUUFDekcsQ0FBQztBQUNELHVCQUFlLHdFQUFvQyxXQUFXLFFBQVEseUJBQWUsUUFBRztBQUFBLE1BQzFGLE9BQU87QUFDTCx1QkFBZSxtSEFBcUQ7QUFBQSxNQUN0RTtBQUFBLElBQ0YsU0FBUyxLQUFLO0FBQ1oscUJBQWUsdUNBQXdCLElBQUksT0FBTztBQUNsRCxvQkFBYyxjQUFjO0FBQUEsSUFDOUI7QUFBQSxFQUNGO0FBRUEsUUFBTSxnQkFBZ0IsWUFBWTtBQUNoQyxRQUFJO0FBQ0YsWUFBTSxNQUFNLE1BQU0sTUFBTSxxQkFBcUI7QUFBQSxRQUMzQyxRQUFRO0FBQUEsUUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLFFBQzlDLE1BQU0sS0FBSyxVQUFVLEVBQUUsU0FBUyxNQUFNLElBQUksUUFBUSxnQkFBZ0IsQ0FBQztBQUFBLE1BQ3JFLENBQUM7QUFDRCxZQUFNLElBQUksTUFBTSxJQUFJLEtBQUs7QUFDekIsVUFBSSxFQUFFLE1BQU0sRUFBRSxTQUFTO0FBQ3JCLHVCQUFlLGlGQUF3QztBQUFBLE1BQ3pELFdBQVcsRUFBRSxJQUFJO0FBQ2YsMEJBQWtCLElBQUk7QUFDdEIsdUJBQWUsNkZBQTRDO0FBQUEsTUFDN0QsT0FBTztBQUNMLHVCQUFlLEVBQUUsT0FBTyx3REFBeUI7QUFBQSxNQUNuRDtBQUFBLElBQ0YsUUFBUTtBQUFFLHFCQUFlLDZCQUFjO0FBQUEsSUFBRztBQUFBLEVBQzVDO0FBRUEsUUFBTSxlQUFlLFlBQVk7QUFDL0IsUUFBSSxDQUFDLFFBQVEsOERBQWdDLEVBQUc7QUFDaEQsVUFBTSxNQUFNLHFCQUFxQjtBQUFBLE1BQy9CLFFBQVE7QUFBQSxNQUNSLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsTUFDOUMsTUFBTSxLQUFLLFVBQVUsRUFBRSxTQUFTLE1BQU0sSUFBSSxRQUFRLFlBQVksQ0FBQztBQUFBLElBQ2pFLENBQUMsRUFBRSxNQUFNLE1BQU07QUFBQSxJQUFDLENBQUM7QUFDakIsY0FBVTtBQUFBLEVBQ1o7QUFFQSxRQUFNLFlBQVksWUFBWTtBQUM1QixRQUFJLFVBQVU7QUFDWixVQUFJO0FBQ0YsWUFBSSxDQUFDLGVBQWUsU0FBUztBQUUzQixnQkFBTSxTQUFTLE1BQU0sVUFBVSxhQUFhLGFBQWEsRUFBRSxPQUFPLE1BQU0sT0FBTyxNQUFNLENBQUM7QUFDdEYseUJBQWUsVUFBVTtBQUN6QixnQkFBTSxLQUFLLE1BQU07QUFDakIsY0FBSSxJQUFJO0FBQ04sbUJBQU8sVUFBVSxFQUFFLFFBQVEsV0FBUyxHQUFHLFNBQVMsT0FBTyxNQUFNLENBQUM7QUFDOUQsZ0JBQUk7QUFDRixvQkFBTSxRQUFRLE1BQU0sR0FBRyxZQUFZO0FBQ25DLG9CQUFNLEdBQUcsb0JBQW9CLEtBQUs7QUFDbEMsb0JBQU0sTUFBTSxxQkFBcUI7QUFBQSxnQkFDL0IsUUFBUTtBQUFBLGdCQUNSLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsZ0JBQzlDLE1BQU0sS0FBSyxVQUFVLEVBQUUsU0FBUyxNQUFNLElBQUksUUFBUSxnQkFBZ0IsWUFBWSxTQUFTLFNBQVMsTUFBTSxDQUFDO0FBQUEsY0FDekcsQ0FBQztBQUFBLFlBQ0gsUUFBUTtBQUFBLFlBQStDO0FBQUEsVUFDekQ7QUFBQSxRQUNGLE9BQU87QUFDTCx5QkFBZSxRQUFRLGVBQWUsRUFBRSxRQUFRLE9BQUs7QUFBRSxjQUFFLFVBQVU7QUFBQSxVQUFNLENBQUM7QUFBQSxRQUM1RTtBQUNBLG9CQUFZLEtBQUs7QUFBQSxNQUNuQixTQUFTLEtBQUs7QUFDWixjQUFNLHNDQUF5QixJQUFJLE9BQU87QUFBQSxNQUM1QztBQUFBLElBQ0YsT0FBTztBQUNMLFVBQUksZUFBZSxTQUFTO0FBQzFCLHVCQUFlLFFBQVEsZUFBZSxFQUFFLFFBQVEsT0FBSztBQUFFLFlBQUUsVUFBVTtBQUFBLFFBQU8sQ0FBQztBQUFBLE1BQzdFO0FBQ0Esa0JBQVksSUFBSTtBQUFBLElBQ2xCO0FBQUEsRUFDRjtBQUVBLFFBQU0sYUFBYSxNQUFNO0FBQ3ZCLFVBQU0scUJBQXFCO0FBQUEsTUFDekIsUUFBUTtBQUFBLE1BQ1IsU0FBUyxFQUFFLGdCQUFnQixtQkFBbUI7QUFBQSxNQUM5QyxNQUFNLEtBQUssVUFBVSxFQUFFLFNBQVMsTUFBTSxJQUFJLFFBQVEsZ0JBQWdCLFlBQVksU0FBUyxTQUFTLENBQUMsRUFBRSxDQUFDO0FBQUEsSUFDdEcsQ0FBQyxFQUFFLE1BQU0sTUFBTTtBQUFBLElBQUMsQ0FBQztBQUNqQixvQkFBZ0I7QUFDaEIsbUJBQWUsS0FBSztBQUNwQixrQkFBYyxjQUFjO0FBQzVCLGlCQUFhLFVBQVU7QUFDdkIsbUJBQWUsNkJBQWdCO0FBQUEsRUFDakM7QUFHQSxRQUFNLENBQUMsVUFBVSxXQUFXLElBQUksTUFBTSxTQUFTLEVBQUU7QUFDakQsUUFBTSxDQUFDLGNBQWMsZUFBZSxJQUFJLE1BQU0sU0FBUyxLQUFLO0FBQzVELFFBQU0sQ0FBQyxXQUFXLFlBQVksSUFBSSxNQUFNLFNBQVMsRUFBRTtBQUNuRCxRQUFNLENBQUMsV0FBVyxZQUFZLElBQUksTUFBTSxTQUFTLENBQUMsQ0FBQztBQUNuRCxRQUFNLENBQUMsV0FBVyxZQUFZLElBQUksTUFBTSxTQUFTLEtBQUs7QUFFdEQsUUFBTSxXQUFXLFlBQVk7QUFDM0IsUUFBSTtBQUNGLFlBQU0sTUFBTSxNQUFNLE1BQU0sNEJBQTRCLE1BQU0sRUFBRSxjQUFjO0FBQzFFLFlBQU0sSUFBSSxNQUFNLElBQUksS0FBSztBQUN6QixVQUFJLEVBQUUsR0FBSSxjQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFBQSxJQUN0QyxRQUFRO0FBQUEsSUFBRTtBQUFBLEVBQ1o7QUFFQSxRQUFNLFVBQVUsTUFBTTtBQUNwQixRQUFJLFlBQVksVUFBVTtBQUN4QixlQUFTO0FBQ1QsWUFBTSxRQUFRLFlBQVksV0FBVyxRQUFRLEdBQUcsR0FBSTtBQUNwRCxhQUFPLE1BQU0sY0FBYyxLQUFLO0FBQUEsSUFDbEM7QUFBQSxFQUNGLEdBQUcsQ0FBQyxTQUFTLE1BQU0sRUFBRSxDQUFDO0FBRXRCLFFBQU0sV0FBVyxPQUFPLFFBQVE7QUFDOUIsVUFBTSxJQUFJLE9BQU8sT0FBTyxZQUFZLEVBQUUsRUFBRSxLQUFLO0FBQzdDLFFBQUksQ0FBQyxLQUFLLGFBQWM7QUFDeEIsb0JBQWdCLElBQUk7QUFDcEIsaUJBQWEsRUFBRTtBQUNmLFFBQUk7QUFDRixZQUFNLE1BQU0sTUFBTSxNQUFNLG9CQUFvQjtBQUFBLFFBQzFDLFFBQVE7QUFBQSxRQUNSLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsUUFDOUMsTUFBTSxLQUFLLFVBQVUsRUFBRSxTQUFTLE1BQU0sSUFBSSxRQUFRLGFBQWEsVUFBVSxFQUFFLENBQUM7QUFBQSxNQUM5RSxDQUFDO0FBQ0QsWUFBTSxJQUFJLE1BQU0sSUFBSSxLQUFLO0FBQ3pCLFVBQUksQ0FBQyxFQUFFLElBQUk7QUFDVCxxQkFBYSxFQUFFLE9BQU8sbURBQXVCO0FBQUEsTUFDL0MsT0FBTztBQUNMLG9CQUFZLEVBQUU7QUFBQSxNQUNoQjtBQUFBLElBQ0YsUUFBUTtBQUNOLG1CQUFhLDZDQUFzQjtBQUFBLElBQ3JDLFVBQUU7QUFDQSxzQkFBZ0IsS0FBSztBQUFBLElBQ3ZCO0FBQUEsRUFDRjtBQUVBLFFBQU0sZ0JBQWdCLE9BQU8sUUFBUSxRQUFRLENBQUMsTUFBTTtBQUNsRCxRQUFJLFVBQVc7QUFDZixpQkFBYSxJQUFJO0FBQ2pCLFFBQUk7QUFDRixZQUFNLE1BQU0sTUFBTSxNQUFNLG9CQUFvQjtBQUFBLFFBQzFDLFFBQVE7QUFBQSxRQUNSLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsUUFDOUMsTUFBTSxLQUFLLFVBQVUsRUFBRSxTQUFTLE1BQU0sSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDO0FBQUEsTUFDOUQsQ0FBQztBQUNELFlBQU0sSUFBSSxNQUFNLElBQUksS0FBSztBQUN6QixVQUFJLENBQUMsRUFBRSxHQUFJLGNBQWEsRUFBRSxPQUFPLHVEQUE2QjtBQUFBLFVBQ3pELE9BQU0sU0FBUztBQUFBLElBQ3RCLFFBQVE7QUFDTixtQkFBYSw2Q0FBc0I7QUFBQSxJQUNyQyxVQUFFO0FBQ0EsbUJBQWEsS0FBSztBQUFBLElBQ3BCO0FBQUEsRUFDRjtBQUVBLFNBQ0Usb0NBQUMsU0FBSSxJQUFHLHdCQUF1QixXQUFVLGdIQUV2QyxvQ0FBQyxTQUFJLFdBQVUscUZBQ2Isb0NBQUMsU0FBSSxXQUFVLHVDQUNiO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFLO0FBQUEsTUFDTCxTQUFTLE1BQU0sV0FBVyxNQUFNO0FBQUEsTUFDaEMsV0FBVyxxSEFDVCxZQUFZLFNBQ1IsOEhBQ0EscUdBQ047QUFBQTtBQUFBLElBQ0Esb0NBQUMsY0FBSyxXQUFFO0FBQUEsSUFDUixvQ0FBQyxjQUFLLGVBQVU7QUFBQSxFQUNsQixHQUNBO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFLO0FBQUEsTUFDTCxTQUFTLE1BQU0sV0FBVyxPQUFPO0FBQUEsTUFDakMsV0FBVyxxSEFDVCxZQUFZLFVBQ1IsOEhBQ0EscUdBQ047QUFBQTtBQUFBLElBQ0Esb0NBQUMsY0FBSyxXQUFFO0FBQUEsSUFDUixvQ0FBQyxjQUFLLFlBQU87QUFBQSxFQUNmLEdBQ0E7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLElBQUc7QUFBQSxNQUNILE1BQUs7QUFBQSxNQUNMLFNBQVMsTUFBTSxXQUFXLFlBQVk7QUFBQSxNQUN0QyxXQUFXLHFIQUNULFlBQVksZUFDUiw4SEFDQSxxR0FDTjtBQUFBO0FBQUEsSUFDQSxvQ0FBQyxjQUFLLFdBQUU7QUFBQSxJQUNSLG9DQUFDLGNBQUssbUJBQU87QUFBQSxFQUNmLEdBQ0E7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLElBQUc7QUFBQSxNQUNILE1BQUs7QUFBQSxNQUNMLFNBQVMsTUFBTSxXQUFXLE9BQU87QUFBQSxNQUNqQyxXQUFXLHFIQUNULFlBQVksVUFDUiw4SEFDQSxxR0FDTjtBQUFBO0FBQUEsSUFDQSxvQ0FBQyxjQUFLLFdBQUU7QUFBQSxJQUNSLG9DQUFDLGNBQUssbUJBQVM7QUFBQSxFQUNqQixHQUNBO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFLO0FBQUEsTUFDTCxTQUFTLE1BQU0sV0FBVyxPQUFPO0FBQUEsTUFDakMsV0FBVyxxSEFDVCxZQUFZLFVBQ1IsK0hBQ0EscUdBQ047QUFBQTtBQUFBLElBQ0Esb0NBQUMsY0FBSyxpQkFBRztBQUFBLElBQ1Qsb0NBQUMsY0FBSyxhQUFXO0FBQUEsRUFDbkIsR0FDQTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsSUFBRztBQUFBLE1BQ0gsTUFBSztBQUFBLE1BQ0wsU0FBUyxNQUFNLFdBQVcsU0FBUztBQUFBLE1BQ25DLFdBQVcscUhBQ1QsWUFBWSxZQUNSLGtJQUNBLHFHQUNOO0FBQUE7QUFBQSxJQUNBLG9DQUFDLGNBQUssV0FBRTtBQUFBLElBQ1Isb0NBQUMsY0FBSyxvQkFBVyxVQUFVLFNBQVMsSUFBSSxLQUFLLFVBQVUsTUFBTSxNQUFNLEVBQUc7QUFBQSxFQUN4RSxJQUNFLGNBQWMsWUFDZDtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsSUFBRztBQUFBLE1BQ0gsTUFBSztBQUFBLE1BQ0wsU0FBUyxNQUFNLFdBQVcsUUFBUTtBQUFBLE1BQ2xDLFdBQVcscUhBQ1QsWUFBWSxXQUNSLG1JQUNBLHFHQUNOO0FBQUE7QUFBQSxJQUNBLG9DQUFDLGNBQUssV0FBRTtBQUFBLElBQ1Isb0NBQUMsY0FBSyxPQUFLO0FBQUEsRUFDYixHQUVELFdBQ0M7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLElBQUc7QUFBQSxNQUNILE1BQUs7QUFBQSxNQUNMLFNBQVMsTUFBTSxXQUFXLFVBQVU7QUFBQSxNQUNwQyxXQUFXLHFIQUNULFlBQVksYUFDUixrSUFDQSxxR0FDTjtBQUFBO0FBQUEsSUFDQSxvQ0FBQyxjQUFLLGNBQUU7QUFBQSxJQUNSLG9DQUFDLGNBQUssWUFBSztBQUFBLEVBQ2IsQ0FFSixDQUNGLEdBR0Esb0NBQUMsU0FBSSxXQUFVLDZDQUVaLFlBQVksVUFDWCxvQ0FBQyxTQUFJLFdBQVUsa0NBQ2Isb0NBQUMsU0FBSSxXQUFVLDhGQUNaLFVBQVUsV0FBVyxJQUNwQixvQ0FBQyxPQUFFLFdBQVUsaURBQThDLDhIQUE4RCxJQUV6SCxVQUFVLElBQUksQ0FBQyxHQUFHLFFBQ2hCLG9DQUFDLFNBQUksS0FBSyxFQUFFLE1BQU0sS0FBSyxXQUFVLG1CQUMvQixvQ0FBQyxTQUFJLFdBQVUsNENBQ2Isb0NBQUMsVUFBSyxXQUFVLDBDQUF3QyxFQUFFLFdBQVksR0FDckUsRUFBRSxXQUFXLGNBQ1osb0NBQUMsVUFBSyxXQUFVLDJHQUF3RyxNQUFJLElBQzFILEVBQUUsU0FDSixvQ0FBQyxVQUFLLFdBQVUsMEdBQXdHLEVBQUUsTUFBTyxJQUMvSCxNQUNKLG9DQUFDLFVBQUssV0FBVSxnQ0FDYixFQUFFLFVBQVMsb0JBQUksS0FBSyxFQUFFLE9BQU8sUUFBUSxLQUFLLEdBQUcsSUFBSSxHQUFHLEdBQUUsbUJBQW1CLENBQUMsR0FBRyxFQUFFLE1BQU0sV0FBVyxRQUFRLFVBQVUsQ0FBQyxJQUFJLEVBQzFILEdBQ0MsRUFBRSxnQkFBZ0IsUUFBUSxFQUFFLGVBQWUsS0FDMUM7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLFNBQVMsTUFBTSxVQUFVLEVBQUUsWUFBWTtBQUFBLE1BQ3ZDLE9BQU8sT0FBTyxnQkFBZ0Isd0RBQW1DO0FBQUEsTUFDakUsV0FBVTtBQUFBO0FBQUEsSUFBa0k7QUFBQSxJQUN6SSxpQkFBaUIsRUFBRSxZQUFZO0FBQUEsRUFDcEMsR0FFRCxXQUNDO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxPQUFNO0FBQUEsTUFDTixTQUFTLFlBQVk7QUFDbkIsWUFBSTtBQUNGLGdCQUFNLE1BQU0sTUFBTSxNQUFNLDJCQUEyQixNQUFNLEVBQUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsU0FBUyxDQUFDO0FBQzlGLGdCQUFNLElBQUksTUFBTSxJQUFJLEtBQUs7QUFDekIsY0FBSSxFQUFFLE1BQU0sY0FBZSxlQUFjLEVBQUUsRUFBRTtBQUFBLFFBQy9DLFFBQVE7QUFBQSxRQUFlO0FBQUEsTUFDekI7QUFBQSxNQUNBLFdBQVU7QUFBQTtBQUFBLElBQXNHO0FBQUEsRUFFbEgsQ0FFSixHQUNBLG9DQUFDLE9BQUUsV0FBVSxnSEFDVixFQUFFLE9BQ0wsQ0FDRixDQUNELEdBRUgsb0NBQUMsU0FBSSxLQUFLLFlBQVksQ0FDeEIsR0FFQSxvQ0FBQyxVQUFLLFVBQVUsb0JBQW9CLFdBQVUsbUVBQzVDO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFNO0FBQUEsTUFDTixhQUFhLFFBQVEsTUFBTSxJQUFJLGdIQUFxRTtBQUFBLE1BQ3BHLE9BQU87QUFBQSxNQUNQLFVBQVUsQ0FBQyxRQUFRLE1BQU07QUFBQSxNQUN6QixVQUFVLE9BQUssYUFBYSxFQUFFLE9BQU8sS0FBSztBQUFBLE1BQzFDLG9CQUFvQixNQUFNO0FBQUUseUJBQWlCLFVBQVU7QUFBQSxNQUFNO0FBQUEsTUFDN0Qsa0JBQWtCLE1BQU07QUFBRSx5QkFBaUIsVUFBVTtBQUFBLE1BQU87QUFBQSxNQUM1RCxXQUFXLE9BQUs7QUFDZCxZQUFJLEVBQUUsUUFBUSxXQUFXLENBQUMsRUFBRSxVQUFVO0FBQ3BDLGNBQUksRUFBRSxhQUFhLGVBQWUsaUJBQWlCLFFBQVM7QUFDNUQsWUFBRSxlQUFlO0FBQ2pCLDZCQUFtQjtBQUFBLFFBQ3JCO0FBQUEsTUFDRjtBQUFBLE1BQ0EsV0FBVztBQUFBLE1BQ1gsV0FBVTtBQUFBO0FBQUEsRUFDWixHQUNBO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxJQUFHO0FBQUEsTUFDSCxVQUFVLENBQUMsVUFBVSxLQUFLLEtBQUssZUFBZSxDQUFDLFFBQVEsTUFBTTtBQUFBLE1BQzdELFdBQVU7QUFBQTtBQUFBLElBQWlJO0FBQUEsRUFFN0ksQ0FDRixDQUNGLEdBSUQsWUFBWSxXQUNYLG9DQUFDLFNBQUksV0FBVSxnQ0FDYixvQ0FBQyxTQUFJLFdBQVUsa0VBQ2Isb0NBQUMsY0FBSyxxSUFBdUUsR0FDNUUsZUFBZSxvQ0FBQyxVQUFLLFdBQVUsNkJBQTJCLFdBQVksQ0FDekUsR0FDQSxvQ0FBQyxTQUFJLFdBQVUsdUhBQ1osVUFBVSxXQUFXLElBQ3BCLG9DQUFDLE9BQUUsV0FBVSxpREFBOEMsK0ZBQWtELElBRTdHLFVBQVUsSUFBSSxDQUFDLE1BQ2Isb0NBQUMsU0FBSSxLQUFLLEVBQUUsSUFBSSxXQUFVLGtDQUN4QixvQ0FBQyxTQUFJLFdBQVUsb0JBQ2Isb0NBQUMsU0FBSSxXQUFVLHVDQUNiLG9DQUFDLFVBQUssV0FBVSwwQ0FBd0MsRUFBRSxHQUFJLEdBQzdELEVBQUUsZ0JBQWdCLFFBQVEsRUFBRSxlQUFlLEtBQzFDO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxTQUFTLE1BQU0sVUFBVSxFQUFFLFlBQVk7QUFBQSxNQUN2QyxXQUFVO0FBQUE7QUFBQSxJQUFrSTtBQUFBLElBQ3pJLGlCQUFpQixFQUFFLFlBQVk7QUFBQSxFQUNwQyxHQUVGLG9DQUFDLFVBQUssV0FBVSx5Q0FDYixFQUFFLFVBQVMsb0JBQUksS0FBSyxFQUFFLE9BQU8sUUFBUSxLQUFLLEdBQUcsSUFBSSxHQUFHLEdBQUUsbUJBQW1CLENBQUMsR0FBRyxFQUFFLE1BQU0sV0FBVyxRQUFRLFVBQVUsQ0FBQyxJQUFJLEVBQzFILENBQ0YsR0FDQSxvQ0FBQyxPQUFFLFdBQVUsd0RBQXNELEVBQUUsT0FBUSxDQUMvRSxJQUNFLEVBQUUsVUFBVSxZQUNaO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxTQUFTLE1BQU0sVUFBVSxFQUFFLEVBQUU7QUFBQSxNQUM3QixPQUFNO0FBQUEsTUFDTixXQUFVO0FBQUE7QUFBQSxJQUF1RztBQUFBLEVBRW5ILENBRUosQ0FDRCxDQUVMLEdBQ0MsZ0JBQ0M7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLFVBQVUsT0FBSztBQUNiLFVBQUUsZUFBZTtBQUNqQixZQUFJLENBQUMsRUFBRSxhQUFhLGVBQWUsQ0FBQyxpQkFBaUIsUUFBUyxZQUFXO0FBQUEsTUFDM0U7QUFBQSxNQUNBLFdBQVU7QUFBQTtBQUFBLElBRVY7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLElBQUc7QUFBQSxRQUNILE1BQUs7QUFBQSxRQUNMLE9BQU87QUFBQSxRQUNQLFVBQVUsT0FBSyxhQUFhLEVBQUUsT0FBTyxLQUFLO0FBQUEsUUFDMUMsb0JBQW9CLE1BQU07QUFBRSwyQkFBaUIsVUFBVTtBQUFBLFFBQU07QUFBQSxRQUM3RCxrQkFBa0IsTUFBTTtBQUFFLDJCQUFpQixVQUFVO0FBQUEsUUFBTztBQUFBLFFBQzVELGFBQVk7QUFBQSxRQUNaLFdBQVc7QUFBQSxRQUNYLFdBQVU7QUFBQTtBQUFBLElBQ1o7QUFBQSxJQUNBO0FBQUEsTUFBQztBQUFBO0FBQUEsUUFDQyxNQUFLO0FBQUEsUUFDTCxTQUFTLE1BQU0sZ0JBQWdCLE9BQUssQ0FBQyxDQUFDO0FBQUEsUUFDdEMsT0FBTyxlQUFlLHdEQUFtQztBQUFBLFFBQ3pELFdBQVcsa0VBQWtFLGVBQWUsMERBQTBELDJDQUEyQztBQUFBO0FBQUEsTUFBSTtBQUFBLElBRXZNO0FBQUEsSUFDQTtBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsTUFBSztBQUFBLFFBQ0wsSUFBRztBQUFBLFFBQ0gsVUFBVSxDQUFDLFVBQVUsS0FBSztBQUFBLFFBQzFCLFdBQVU7QUFBQTtBQUFBLE1BQXNGO0FBQUEsSUFFbEc7QUFBQSxFQUNGLElBRUEsb0NBQUMsT0FBRSxXQUFVLG9EQUFpRCxpSUFBMEQsQ0FFNUgsR0FJRCxZQUFZLGdCQUNYLG9DQUFDLFNBQUksV0FBVSxnQ0FDYixvQ0FBQyxTQUFJLFdBQVUsb0VBQ2Isb0NBQUMsU0FBSSxXQUFVLDZCQUNiO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxJQUFHO0FBQUEsTUFDSCxTQUFTLE1BQU0sVUFBVSxLQUFLO0FBQUEsTUFDOUIsVUFBVSxDQUFDO0FBQUEsTUFDWCxXQUFXLGdFQUFnRSxXQUFXLFFBQVEsNEJBQTRCLDRCQUE0QjtBQUFBO0FBQUEsSUFBSTtBQUFBLEVBRTVKLEdBQ0E7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLElBQUc7QUFBQSxNQUNILFNBQVMsTUFBTSxVQUFVLFFBQVE7QUFBQSxNQUNqQyxVQUFVLENBQUM7QUFBQSxNQUNYLFdBQVcsZ0VBQWdFLFdBQVcsV0FBVywyQkFBMkIsNEJBQTRCO0FBQUE7QUFBQSxJQUFJO0FBQUEsRUFFOUosR0FDQSxvQ0FBQyxTQUFJLFdBQVUsa0NBQ1osQ0FBQyxXQUFXLFdBQVcsV0FBVyxTQUFTLEVBQUUsSUFBSSxPQUNoRDtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsS0FBSztBQUFBLE1BQ0wsTUFBSztBQUFBLE1BQ0wsVUFBVSxDQUFDO0FBQUEsTUFDWCxTQUFTLE1BQU07QUFBRSxtQkFBVyxDQUFDO0FBQUcsa0JBQVUsS0FBSztBQUFBLE1BQUc7QUFBQSxNQUNsRCxXQUFXLG1EQUFtRCxZQUFZLEtBQUssV0FBVyxRQUFRLGdEQUFnRCxvQkFBb0I7QUFBQSxNQUN0SyxPQUFPLEVBQUUsWUFBWSxFQUFFO0FBQUEsTUFDdkIsT0FBTztBQUFBO0FBQUEsRUFDVCxDQUNELENBQ0gsQ0FDRixHQUNDLFdBQ0M7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLElBQUc7QUFBQSxNQUNILFNBQVM7QUFBQSxNQUNULFdBQVU7QUFBQTtBQUFBLElBQWdIO0FBQUEsRUFFNUgsQ0FFSixHQUNBLG9DQUFDLFNBQUksV0FBVSw4SUFDWixDQUFDLGNBQ0Esb0NBQUMsU0FBSSxXQUFVLGdIQUE2RyxpRkFFNUgsR0FFRjtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsSUFBRztBQUFBLE1BQ0gsS0FBSztBQUFBLE1BQ0wsT0FBTztBQUFBLE1BQ1AsUUFBUTtBQUFBLE1BQ1IsYUFBYSxhQUFhLGVBQWU7QUFBQSxNQUN6QyxhQUFhLGFBQWEsV0FBVztBQUFBLE1BQ3JDLFdBQVcsYUFBYSxjQUFjO0FBQUEsTUFDdEMsY0FBYyxhQUFhLGNBQWM7QUFBQSxNQUN6QyxjQUFjLGFBQWEsZUFBZTtBQUFBLE1BQzFDLGFBQWEsYUFBYSxXQUFXO0FBQUEsTUFDckMsWUFBWSxhQUFhLGNBQWM7QUFBQSxNQUN2QyxXQUFXLGlCQUFpQixhQUFhLHFCQUFxQixvQkFBb0I7QUFBQTtBQUFBLEVBQ3BGLENBQ0YsQ0FDRixHQUlELFlBQVksV0FDWCxvQ0FBQyxTQUFJLFdBQVUsZ0RBQ2Isb0NBQUMsU0FBSSxXQUFVLGdDQUE2QixtSUFFNUMsR0FDQSxvQ0FBQyxTQUFJLFdBQVUsa0ZBQ2Isb0NBQUMsV0FBTSxJQUFHLHFCQUFvQixXQUFVLG1EQUN0QyxvQ0FBQyxlQUNDLG9DQUFDLFFBQUcsV0FBVSxrRUFDWixvQ0FBQyxRQUFHLFdBQVUsOERBQTJELEdBQUMsR0FDekUsS0FBSyxJQUFJLE9BQ1Isb0NBQUMsUUFBRyxLQUFLLEdBQUcsV0FBVSxpR0FDbkIsQ0FDSCxDQUNELENBQ0gsQ0FDRixHQUNBLG9DQUFDLGVBQ0UsS0FBSyxJQUFJLE9BQ1Isb0NBQUMsUUFBRyxLQUFLLEdBQUcsV0FBVSxtREFDcEIsb0NBQUMsUUFBRyxXQUFVLDhGQUNYLENBQ0gsR0FDQyxLQUFLLElBQUksT0FBSztBQUNiLFVBQU0sVUFBVSxHQUFHLENBQUMsR0FBRyxDQUFDO0FBQ3hCLFdBQ0Usb0NBQUMsUUFBRyxLQUFLLFNBQVMsV0FBVSxpQ0FDMUI7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLE1BQUs7QUFBQSxRQUNMLGFBQVc7QUFBQSxRQUNYLE9BQU8sV0FBVyxPQUFPLEtBQUs7QUFBQSxRQUM5QixVQUFVLENBQUM7QUFBQSxRQUNYLFNBQVMsTUFBTTtBQUFFLDhCQUFvQixVQUFVO0FBQUEsUUFBUztBQUFBLFFBQ3hELFFBQVEsTUFBTTtBQUFFLDhCQUFvQixVQUFVO0FBQUEsUUFBTTtBQUFBLFFBQ3BELFVBQVUsT0FBSyxpQkFBaUIsaUJBQWlCLFNBQVMsRUFBRSxPQUFPLEtBQUs7QUFBQSxRQUN4RSxXQUFXLDhIQUE4SCxDQUFDLGdCQUFnQixrQ0FBa0MsRUFBRTtBQUFBO0FBQUEsSUFDaE0sQ0FDRjtBQUFBLEVBRUosQ0FBQyxDQUNILENBQ0QsQ0FDSCxDQUNGLENBQ0YsQ0FDRixHQUlELFlBQVksV0FDWCxvQ0FBQyxTQUFJLFdBQVUsNEVBQ2Isb0NBQUMsV0FBTSxLQUFLLGdCQUFnQixVQUFRLE1BQUMsR0FDckMsb0NBQUMsU0FBSSxXQUFVLHNLQUFtSyxpQkFFbEwsR0FDQSxvQ0FBQyxhQUNDLG9DQUFDLFFBQUcsV0FBVSxtQ0FBZ0MsbURBQStCLEdBQzdFLG9DQUFDLE9BQUUsV0FBVSwwQ0FBdUMsZ0lBRXBELENBQ0YsR0FHQyxXQUFXLFdBQVcsVUFDckIsb0NBQUMsT0FBRSxXQUFVLG1HQUNWLFdBQVcsT0FBTyxHQUFHLFVBQVUsSUFBSSxHQUFHLFVBQVUsT0FBTyxhQUFRLFVBQVUsT0FBTyxxREFBeUIsS0FBSyx1Q0FDakgsR0FHRixvQ0FBQyxTQUFJLFdBQVUsc0RBQ1osQ0FBQyxjQUNBLDBEQUNHLFFBQVEsT0FBTyxJQUNkO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxJQUFHO0FBQUEsTUFDSCxTQUFTO0FBQUEsTUFDVCxVQUFVLFdBQVcsVUFBVSxDQUFDLFdBQVc7QUFBQSxNQUMzQyxXQUFVO0FBQUE7QUFBQSxJQUNULFdBQVcsU0FBUywyQ0FBMkIsV0FBVyxPQUFPLDhCQUFpQixVQUFVLE9BQU87QUFBQSxFQUN0RyxJQUVBO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxJQUFHO0FBQUEsTUFDSCxTQUFTO0FBQUEsTUFDVCxVQUFVO0FBQUEsTUFDVixXQUFVO0FBQUE7QUFBQSxJQUNULGlCQUFpQiwrQ0FBc0I7QUFBQSxFQUMxQyxDQUVKLElBRUEsMERBQ0U7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLElBQUc7QUFBQSxNQUNILFNBQVM7QUFBQSxNQUNULFdBQVcscUZBQXFGLFdBQVcsaURBQWlELDJCQUEyQjtBQUFBO0FBQUEsSUFDdkwsb0NBQUMsY0FBTSxXQUFXLDJCQUFlLHdDQUFtQjtBQUFBLEVBQ3RELEdBQ0E7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLElBQUc7QUFBQSxNQUNILFNBQVM7QUFBQSxNQUNULFdBQVU7QUFBQTtBQUFBLElBQXNJO0FBQUEsRUFFbEosQ0FDRixHQUVELFdBQVcsV0FBVyxRQUFRLENBQUMsV0FBVyxTQUN6QztBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsTUFBSztBQUFBLE1BQ0wsSUFBRztBQUFBLE1BQ0gsU0FBUztBQUFBLE1BQ1QsV0FBVTtBQUFBO0FBQUEsSUFBc0k7QUFBQSxFQUVsSixDQUVKLEdBR0MsV0FBVyxZQUFZLFNBQVMsS0FDL0Isb0NBQUMsU0FBSSxXQUFVLGtGQUNiLG9DQUFDLE9BQUUsV0FBVSwwRUFBdUUsZ0NBQW9CLEdBQ3ZHLFlBQVksSUFBSSxPQUNmLG9DQUFDLFNBQUksS0FBSyxFQUFFLE1BQU0sV0FBVSwwQ0FDMUIsb0NBQUMsVUFBSyxXQUFVLGtEQUFnRCxFQUFFLE9BQU8sa0JBQWEsR0FDdEY7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLFNBQVMsWUFBWTtBQUFFLGNBQU0sSUFBSSxNQUFNLGdCQUFnQixTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sWUFBWSxTQUFTLElBQUksS0FBSyxDQUFDO0FBQUcsWUFBSSxHQUFHLEdBQUksZ0JBQWUsVUFBUSxLQUFLLE9BQU8sT0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUM7QUFBQSxNQUFHO0FBQUEsTUFDNUwsV0FBVTtBQUFBO0FBQUEsSUFBdUk7QUFBQSxFQUVuSixHQUNBO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxTQUFTLFlBQVk7QUFBRSxjQUFNLElBQUksTUFBTSxnQkFBZ0IsU0FBUyxFQUFFLFFBQVEsRUFBRSxNQUFNLFlBQVksU0FBUyxJQUFJLE1BQU0sQ0FBQztBQUFHLFlBQUksR0FBRyxHQUFJLGdCQUFlLFVBQVEsS0FBSyxPQUFPLE9BQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDO0FBQUEsTUFBRztBQUFBLE1BQzdMLFdBQVU7QUFBQTtBQUFBLElBQTJIO0FBQUEsRUFFdkksQ0FDRixDQUNELENBQ0gsR0FHRCxlQUNDLG9DQUFDLE9BQUUsSUFBRyx1QkFBc0IsV0FBVSwrRkFDbkMsV0FDSCxHQUVGLG9DQUFDLE9BQUUsV0FBVSx5Q0FBc0Msc0pBRW5ELENBQ0YsR0FJRCxZQUFZLGFBQ1gsb0NBQUMsU0FBSSxXQUFVLCtFQUNiLG9DQUFDLFNBQUksV0FBVSxxRUFDYixvQ0FBQyxVQUFLLFdBQVUsNkRBQ2Qsb0NBQUMsY0FBSyxXQUFFLEdBQ1Isb0NBQUMsY0FBSyxxQ0FBeUIsVUFBVSxRQUFPLEdBQUMsQ0FDbkQsR0FDQSxvQ0FBQyxVQUFLLFdBQVUsZ0NBQTZCLGdDQUU3QyxDQUNGLEdBRUEsb0NBQUMsU0FBSSxXQUFVLHlCQUNaLFVBQVUsSUFBSSxDQUFDLElBQUksUUFBUTtBQUMxQixVQUFNLFNBQVMsR0FBRyxlQUFlLEtBQUssR0FBRyxnQkFBZ0I7QUFDekQsVUFBTSxPQUFPLEdBQUcsV0FBVztBQUMzQixVQUFNLFdBQVcsR0FBRyxnQkFBZ0I7QUFDcEMsVUFBTSxhQUFhLE9BQU8sS0FBSyxPQUFLLEVBQUUsV0FBVyxHQUFHLFFBQVEsRUFBRSxlQUFlLE9BQU87QUFDcEYsVUFBTSxhQUFhLE9BQU8sS0FBSyxPQUFLLEVBQUUsV0FBVyxHQUFHLFFBQVEsRUFBRSxlQUFlLGVBQWU7QUFFNUYsV0FDRTtBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsS0FBSyxHQUFHLFFBQVEsR0FBRyxPQUFPO0FBQUEsUUFDMUIsV0FBVTtBQUFBO0FBQUEsTUFDVixvQ0FBQyxTQUFJLFdBQVUsb0xBQ1osR0FBRyxTQUNGLG9DQUFDLFNBQUksS0FBSyxHQUFHLFFBQVEsS0FBSSxJQUFHLFdBQVUsMkNBQTBDLEtBRS9FLEdBQUcsT0FBTyxLQUFLLE9BQU8sQ0FBQyxFQUFFLFlBQVksQ0FFMUM7QUFBQSxNQUNBLG9DQUFDLFNBQUksV0FBVSxvQkFDYixvQ0FBQyxTQUFJLFdBQVUsK0JBQ2Isb0NBQUMsVUFBSyxXQUFVLCtDQUE2QyxHQUFHLEdBQUksR0FDbkUsVUFDQyxvQ0FBQyxVQUFLLFdBQVUsb0hBQWlILGdCQUVqSSxHQUVELFFBQVEsQ0FBQyxVQUNSLG9DQUFDLFVBQUssV0FBVSxvSEFBaUgsMkJBRWpJLEdBRUQsWUFDQyxvQ0FBQyxVQUFLLFdBQVUsdUhBQW9ILGdCQUVwSSxDQUVKLEdBQ0Esb0NBQUMsVUFBSyxXQUFVLCtDQUNiLEdBQUcsU0FBUyxZQUFPLEdBQUcsTUFBTSxLQUFNLE9BQU8scUNBQXFCLGVBQ2pFLENBQ0Y7QUFBQSxPQUdFLGdCQUFnQixVQUFVLEtBQUssTUFBTSxjQUFjLENBQUMsVUFBVSxHQUFHLFFBQ2pFLG9DQUFDLFNBQUksV0FBVSxzQ0FDYjtBQUFBLFFBQUM7QUFBQTtBQUFBLFVBQ0MsTUFBSztBQUFBLFVBQ0wsU0FBUyxNQUFNLGdCQUFnQixlQUFlLEVBQUUsUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUFBLFVBQ2hGLE9BQU8sV0FBVywyQkFBc0I7QUFBQSxVQUN4QyxXQUFXLG9FQUNULFdBQ0ksMERBQ0EsNERBQ047QUFBQTtBQUFBLFFBQUk7QUFBQSxNQUVOLEdBQ0E7QUFBQSxRQUFDO0FBQUE7QUFBQSxVQUNDLE1BQUs7QUFBQSxVQUNMLFNBQVMsTUFBTSxnQkFBZ0IsU0FBUyxFQUFFLFFBQVEsR0FBRyxNQUFNLFlBQVksU0FBUyxJQUFJLENBQUMsV0FBVyxDQUFDO0FBQUEsVUFDakcsT0FBTTtBQUFBLFVBQ04sV0FBVyxzRkFDVCxhQUNJLHVEQUNBLDREQUNOO0FBQUE7QUFBQSxRQUFJO0FBQUEsTUFFTixHQUNBO0FBQUEsUUFBQztBQUFBO0FBQUEsVUFDQyxNQUFLO0FBQUEsVUFDTCxTQUFTLE1BQU0sZ0JBQWdCLFNBQVMsRUFBRSxRQUFRLEdBQUcsTUFBTSxZQUFZLGlCQUFpQixJQUFJLENBQUMsV0FBVyxDQUFDO0FBQUEsVUFDekcsT0FBTTtBQUFBLFVBQ04sV0FBVyxzRkFDVCxhQUNJLG9EQUNBLDREQUNOO0FBQUE7QUFBQSxRQUFJO0FBQUEsTUFFTixHQUNBO0FBQUEsUUFBQztBQUFBO0FBQUEsVUFDQyxNQUFLO0FBQUEsVUFDTCxTQUFTLFlBQVk7QUFDbkIsZ0JBQUksUUFBUSxRQUFRLEdBQUcsR0FBRyxzQkFBYyxHQUFHO0FBQ3pDLG9CQUFNLElBQUksTUFBTSxnQkFBZ0IsUUFBUSxFQUFFLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDM0Qsa0JBQUksS0FBSyxDQUFDLEVBQUUsR0FBSSxPQUFNLEVBQUUsT0FBTyxvQ0FBa0I7QUFBQSxZQUNuRDtBQUFBLFVBQ0Y7QUFBQSxVQUNBLE9BQU07QUFBQSxVQUNOLFdBQVU7QUFBQTtBQUFBLFFBQTJJO0FBQUEsTUFFdkosQ0FDRjtBQUFBLElBRUo7QUFBQSxFQUVKLENBQUMsR0FFQSxVQUFVLFdBQVcsS0FDcEIsb0NBQUMsU0FBSSxXQUFVLDZDQUEwQyx5REFFekQsQ0FFSixDQUNGLEdBSUQsWUFBWSxhQUFhLGNBQWMsWUFDdEMsb0NBQUMsU0FBSSxXQUFVLHlGQUViLG9DQUFDLFNBQUksV0FBVSw0RUFDYixvQ0FBQyxVQUFLLFdBQVUsNkZBQ2Qsb0NBQUMsY0FBSyxXQUFFLEdBQ1Isb0NBQUMsY0FBSyw0Q0FBd0IsQ0FDaEMsR0FDQSxvQ0FBQyxTQUFJLFdBQVUsNkJBQ2I7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLElBQUc7QUFBQSxNQUNILE1BQUs7QUFBQSxNQUNMLE9BQU87QUFBQSxNQUNQLFVBQVUsT0FBSyxZQUFZLEVBQUUsT0FBTyxLQUFLO0FBQUEsTUFDekMsV0FBVyxPQUFLO0FBQUUsWUFBSSxFQUFFLFFBQVEsV0FBVyxTQUFTLEtBQUssR0FBRztBQUFFLFlBQUUsZUFBZTtBQUFHLG1CQUFTO0FBQUEsUUFBRztBQUFBLE1BQUU7QUFBQSxNQUNoRyxhQUFZO0FBQUEsTUFDWixXQUFVO0FBQUE7QUFBQSxFQUNaLEdBQ0E7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLElBQUc7QUFBQSxNQUNILFNBQVMsTUFBTSxTQUFTO0FBQUEsTUFDeEIsVUFBVSxDQUFDLFNBQVMsS0FBSyxLQUFLO0FBQUEsTUFDOUIsV0FBVTtBQUFBO0FBQUEsSUFDVCxlQUFlLFFBQVE7QUFBQSxFQUMxQixDQUNGLEdBQ0MsYUFBYSxvQ0FBQyxPQUFFLFdBQVUsK0JBQTZCLFNBQVUsQ0FDcEUsR0FHQSxvQ0FBQyxTQUFJLFdBQVUsOEVBQ2Isb0NBQUMsU0FBSSxXQUFVLHVDQUNiLG9DQUFDLFVBQUssV0FBVSw2RkFDZCxvQ0FBQyxjQUFLLFdBQUUsR0FDUixvQ0FBQyxjQUFLLGlDQUFpQixVQUFVLE9BQU8sT0FBSyxFQUFFLGNBQWMsUUFBUSxFQUFFLFFBQU8sR0FBQyxDQUNqRixHQUNDLFVBQVUsS0FBSyxPQUFLLEVBQUUsY0FBYyxRQUFRLEtBQzNDO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxTQUFTLE1BQU0sY0FBYyxNQUFNO0FBQUEsTUFDbkMsVUFBVTtBQUFBLE1BQ1YsV0FBVTtBQUFBO0FBQUEsSUFBbUo7QUFBQSxFQUUvSixDQUVKLEdBR0E7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE9BQU8sQ0FBQyxHQUFHLE1BQU0sY0FBYyxXQUFXLEVBQUUsVUFBVSxHQUFHLE9BQU8sRUFBRSxDQUFDO0FBQUEsTUFDbkUsV0FBVyxDQUFDLEdBQUcsTUFBTSxjQUFjLFlBQVksRUFBRSxVQUFVLEdBQUcsT0FBTyxFQUFFLENBQUM7QUFBQTtBQUFBLEVBQzFFLEdBR0MsVUFBVSxXQUFXLElBQ3BCLG9DQUFDLE9BQUUsV0FBVSxpREFBOEMsMEdBQWtELElBRTdHLG9DQUFDLFNBQUksV0FBVSwrQ0FDWixVQUFVLElBQUksQ0FBQyxHQUFHLFFBQ2pCLG9DQUFDLFNBQUksS0FBSyxFQUFFLE1BQU0sS0FBSyxXQUFVLCtFQUMvQixvQ0FBQyxVQUFLLFdBQVcsb0ZBQW9GLEVBQUUsY0FBYyxZQUFZLHVDQUF1Qyw0QkFBNEIsTUFDak0sRUFBRSxjQUFjLFlBQVksV0FBTSxNQUFNLENBQzNDLEdBQ0MsRUFBRSxTQUFTLG9DQUFDLFNBQUksS0FBSyxFQUFFLE9BQU8sS0FBSSxJQUFHLFdBQVUsMENBQXlDLFNBQVEsUUFBTyxHQUN4RyxvQ0FBQyxTQUFJLFdBQVUsb0JBQ2Isb0NBQUMsT0FBRSxXQUFVLHFEQUFtRCxFQUFFLFNBQVMsRUFBRSxRQUFTLEdBQ3RGLG9DQUFDLE9BQUUsV0FBVSx3Q0FBcUMscUJBQVUsRUFBRSxXQUFXLFFBQUksQ0FDL0UsR0FDQSxvQ0FBQyxTQUFJLFdBQVUsc0NBQ1osRUFBRSxjQUFjLFlBQ2Y7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLE9BQU07QUFBQSxNQUNOLFNBQVMsTUFBTSxjQUFjLFlBQVksRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDO0FBQUEsTUFDckQsVUFBVTtBQUFBLE1BQ1YsV0FBVTtBQUFBO0FBQUEsSUFBOEY7QUFBQSxFQUUxRyxHQUVELEVBQUUsY0FBYyxZQUNmO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxPQUFNO0FBQUEsTUFDTixTQUFTLE1BQU0sY0FBYyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQztBQUFBLE1BQ25ELFVBQVU7QUFBQSxNQUNWLFdBQVU7QUFBQTtBQUFBLElBQTJGO0FBQUEsRUFFdkcsQ0FFSixDQUNGLENBQ0QsQ0FDSCxDQUVKLEdBR0Esb0NBQUMsU0FBSSxXQUFVLDhFQUNiLG9DQUFDLFVBQUssV0FBVSxtRUFBZ0UsbUNBRWhGLEdBR0Esb0NBQUMsU0FBSSxXQUFVLDZCQUNiO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxhQUFZO0FBQUEsTUFDWixJQUFHO0FBQUEsTUFDSCxXQUFXO0FBQUEsTUFDWCxXQUFVO0FBQUE7QUFBQSxFQUNaLEdBQ0E7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLFNBQVMsWUFBWTtBQUNuQixjQUFNLEtBQUssU0FBUyxlQUFlLDJCQUEyQjtBQUM5RCxjQUFNLEtBQUssSUFBSSxTQUFTO0FBQ3hCLGNBQU0sSUFBSSxHQUFHLEtBQUssSUFDZCxNQUFNLGdCQUFnQixnQkFBZ0IsRUFBRSxZQUFZLEdBQUcsS0FBSyxFQUFFLENBQUMsSUFDL0QsTUFBTSxnQkFBZ0IsZUFBZSxDQUFDLENBQUM7QUFDM0MsWUFBSSxLQUFLLENBQUMsRUFBRSxHQUFJLE9BQU0sRUFBRSxPQUFPLGdFQUEwQjtBQUFBLFlBQ3BELE9BQU0sNkVBQXdDO0FBQ25ELFlBQUksR0FBSSxJQUFHLFFBQVE7QUFBQSxNQUNyQjtBQUFBLE1BQ0EsV0FBVTtBQUFBO0FBQUEsSUFBMEk7QUFBQSxFQUV0SixDQUNGLEdBR0Msb0JBQW9CLE1BQU0saUJBQWlCLGNBQzFDO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxJQUFHO0FBQUEsTUFDSCxTQUFTLE1BQU07QUFDYixZQUFJLFFBQVEsOEZBQWlELEdBQUc7QUFDOUQsMkJBQWlCO0FBQUEsUUFDbkI7QUFBQSxNQUNGO0FBQUEsTUFDQSxXQUFVO0FBQUE7QUFBQSxJQUNWLG9DQUFDLGNBQUssV0FBRTtBQUFBLElBQ1Isb0NBQUMsY0FBSyx1Q0FBa0I7QUFBQSxFQUMxQixDQUVKLENBQ0YsR0FJRCxZQUFZLGNBQWMsV0FDekIsb0NBQUMsU0FBSSxXQUFVLDhEQUViLG9DQUFDLFNBQUksV0FBVSx1Q0FDYjtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsTUFBSztBQUFBLE1BQ0wsU0FBUyxZQUFZO0FBQ25CLG1CQUFXLE9BQU8sQ0FBQyxTQUFTLGNBQWMsT0FBTyxHQUFHO0FBQ2xELGdCQUFNLGdCQUFnQixVQUFVLEVBQUUsWUFBWSxLQUFLLFNBQVMsR0FBRyxZQUFZLGFBQWEsQ0FBQztBQUFBLFFBQzNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsV0FBVTtBQUFBO0FBQUEsSUFBMkg7QUFBQSxFQUV2SSxHQUNBO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxTQUFTLFlBQVk7QUFDbkIsbUJBQVcsT0FBTyxDQUFDLFNBQVMsY0FBYyxPQUFPLEdBQUc7QUFDbEQsZ0JBQU0sZ0JBQWdCLFVBQVUsRUFBRSxZQUFZLEtBQUssU0FBUyxHQUFHLFlBQVksV0FBVyxDQUFDO0FBQUEsUUFDekY7QUFBQSxNQUNGO0FBQUEsTUFDQSxXQUFVO0FBQUE7QUFBQSxJQUF1STtBQUFBLEVBRW5KLENBQ0YsR0FHQSxvQ0FBQyxTQUFJLFdBQVUsd0RBQ2Isb0NBQUMsT0FBRSxXQUFVLHdFQUFxRSxrQ0FBa0IsR0FDcEcsb0NBQUMsU0FBSSxXQUFVLGlCQUNaO0FBQUEsSUFDQyxDQUFDLGlCQUFpQixvREFBa0M7QUFBQSxJQUNwRCxDQUFDLGdCQUFnQix1Q0FBcUI7QUFBQSxJQUN0QyxDQUFDLFNBQVMsNkJBQWdCO0FBQUEsSUFDMUIsQ0FBQyxRQUFRLGVBQVk7QUFBQSxJQUNyQixDQUFDLFNBQVMsa0JBQWU7QUFBQSxJQUN6QixDQUFDLGNBQWMsbUJBQVM7QUFBQSxJQUN4QixDQUFDLFNBQVMsbUJBQVc7QUFBQSxJQUNyQixDQUFDLFNBQVMsV0FBVztBQUFBLElBQ3JCLENBQUMsVUFBVSwwQ0FBcUI7QUFBQSxFQUNsQyxFQUFFLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxNQUFNO0FBQ3JCLFVBQU0sTUFBTSxXQUFXLEdBQUcsS0FBSyxFQUFFLFNBQVMsR0FBRyxhQUFhLGFBQWE7QUFDdkUsV0FDRSxvQ0FBQyxTQUFJLEtBQUssS0FBSyxXQUFVLHFDQUN2QixvQ0FBQyxVQUFLLFdBQVUsb0NBQWtDLElBQUssR0FDdkQ7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLE1BQUs7QUFBQSxRQUNMLFNBQVMsTUFBTSxnQkFBZ0IsVUFBVSxFQUFFLFlBQVksS0FBSyxTQUFTLElBQUksVUFBVSxJQUFJLEdBQUcsWUFBWSxJQUFJLFlBQVksQ0FBQztBQUFBLFFBQ3ZILE9BQU8sSUFBSSxVQUFVLDZEQUEwQjtBQUFBLFFBQy9DLFdBQVcseUVBQXlFLElBQUksVUFBVSx3REFBd0QsMENBQTBDO0FBQUE7QUFBQSxNQUNwTSxvQ0FBQyxVQUFLLFdBQVcsd0JBQXdCLElBQUksVUFBVSxtQkFBbUIsY0FBYyxJQUFJO0FBQUEsSUFDOUYsR0FDQTtBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsT0FBTyxJQUFJO0FBQUEsUUFDWCxVQUFVLENBQUMsSUFBSTtBQUFBLFFBQ2YsVUFBVSxPQUFLLGdCQUFnQixVQUFVLEVBQUUsWUFBWSxLQUFLLFNBQVMsR0FBRyxZQUFZLEVBQUUsT0FBTyxNQUFNLENBQUM7QUFBQSxRQUNwRyxXQUFVO0FBQUE7QUFBQSxNQUNWLG9DQUFDLFlBQU8sT0FBTSxnQkFBYSxvQkFBUTtBQUFBLE1BQ25DLG9DQUFDLFlBQU8sT0FBTSxzQkFBbUIsa0NBQVk7QUFBQSxNQUM3QyxvQ0FBQyxZQUFPLE9BQU0sY0FBVywwQkFBUztBQUFBLElBQ3BDLENBQ0Y7QUFBQSxFQUVKLENBQUMsR0FDRCxvQ0FBQyxTQUFJLFdBQVUsZ0RBQ2Isb0NBQUMsVUFBSyxXQUFVLDJCQUF3Qix3Q0FBeUIsR0FDakUsb0NBQUMsVUFBSyxXQUFVLDBGQUF1Riw0QkFBYSxDQUN0SCxDQUNGLENBQ0YsR0FHQSxvQ0FBQyxTQUFJLFdBQVUsd0RBQ2Isb0NBQUMsT0FBRSxXQUFVLHdFQUFxRSx3Q0FBd0IsR0FDMUcsb0NBQUMsU0FBSSxXQUFVLGtCQUNYLGFBQWEsQ0FBQyxHQUFHLElBQUksUUFBTTtBQUMzQixVQUFNLFNBQVMsUUFBUSxHQUFHLFVBQVU7QUFDcEMsVUFBTSxPQUFPLEdBQUcsV0FBVztBQUMzQixVQUFNLFdBQVcsR0FBRyxnQkFBZ0I7QUFDcEMsVUFBTSxjQUFjLFVBQVUsQ0FBQyxHQUFHLEtBQUssT0FBSyxFQUFFLFNBQVMsR0FBRyxRQUFRLEVBQUUsZUFBZSxXQUFXLEVBQUUsY0FBYyxTQUFTO0FBQ3ZILFVBQU0sY0FBYyxVQUFVLENBQUMsR0FBRyxLQUFLLE9BQUssRUFBRSxTQUFTLEdBQUcsUUFBUSxFQUFFLGVBQWUsbUJBQW1CLEVBQUUsY0FBYyxTQUFTO0FBQy9ILFdBQ0Usb0NBQUMsU0FBSSxLQUFLLEdBQUcsUUFBUSxHQUFHLEtBQUssV0FBVSxpREFDckMsb0NBQUMsVUFBSyxXQUFVLHlEQUF1RCxHQUFHLEdBQUksR0FDN0UsVUFBVSxvQ0FBQyxVQUFLLFdBQVUseUNBQXNDLGFBQU0sR0FDdEUsUUFBUSxvQ0FBQyxVQUFLLFdBQVUseUNBQXNDLElBQUUsR0FDaEUsWUFBWSxvQ0FBQyxVQUFLLFdBQVUsMENBQXVDLFNBQU8sR0FDMUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxHQUFHLFFBQ3RCLG9DQUFDLFVBQUssV0FBVSxzQ0FDWixnQkFBZ0IsVUFBVSxLQUFLLE1BQU0sY0FDckM7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLE1BQUs7QUFBQSxRQUNMLFNBQVMsTUFBTSxnQkFBZ0IsZUFBZSxFQUFFLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUM7QUFBQSxRQUNoRixPQUFPLFdBQVcsMkJBQXNCO0FBQUEsUUFDeEMsV0FBVyxxREFBcUQsV0FBVywwREFBMEQsNERBQTREO0FBQUE7QUFBQSxNQUFJO0FBQUEsSUFFdk0sR0FFRjtBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsTUFBSztBQUFBLFFBQ0wsU0FBUyxNQUFNLGdCQUFnQixTQUFTLEVBQUUsUUFBUSxHQUFHLE1BQU0sWUFBWSxTQUFTLElBQUksQ0FBQyxXQUFXLENBQUM7QUFBQSxRQUNqRyxPQUFNO0FBQUEsUUFDTixXQUFXLHFEQUFxRCxhQUFhLHVEQUF1RCw0REFBNEQ7QUFBQTtBQUFBLE1BQUk7QUFBQSxJQUV0TSxHQUNBO0FBQUEsTUFBQztBQUFBO0FBQUEsUUFDQyxNQUFLO0FBQUEsUUFDTCxTQUFTLE1BQU0sZ0JBQWdCLFNBQVMsRUFBRSxRQUFRLEdBQUcsTUFBTSxZQUFZLGlCQUFpQixJQUFJLENBQUMsV0FBVyxDQUFDO0FBQUEsUUFDekcsT0FBTTtBQUFBLFFBQ04sV0FBVyxxREFBcUQsYUFBYSxvREFBb0QsNERBQTREO0FBQUE7QUFBQSxNQUFJO0FBQUEsSUFFbk0sR0FDQTtBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsTUFBSztBQUFBLFFBQ0wsU0FBUyxZQUFZO0FBQUUsY0FBSSxRQUFRLFFBQVEsR0FBRyxHQUFHLHNCQUFjLEdBQUc7QUFBRSxrQkFBTSxJQUFJLE1BQU0sZ0JBQWdCLFFBQVEsRUFBRSxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQUcsZ0JBQUksS0FBSyxDQUFDLEVBQUUsR0FBSSxPQUFNLEVBQUUsT0FBTyxvQ0FBa0I7QUFBQSxVQUFHO0FBQUEsUUFBRTtBQUFBLFFBQ3hMLE9BQU07QUFBQSxRQUNOLFdBQVU7QUFBQTtBQUFBLE1BQXlIO0FBQUEsSUFFckksQ0FDRixDQUVKO0FBQUEsRUFFSixDQUFDLElBQ0MsYUFBYSxDQUFDLEdBQUcsV0FBVyxLQUFLLG9DQUFDLE9BQUUsV0FBVSxnQ0FBNkIsbUNBQW1CLENBQ2xHLENBQ0YsSUFHRSxnQkFBZ0IsVUFBVSxLQUFLLE1BQU0sY0FDckMsb0NBQUMsU0FBSSxXQUFVLGdGQUNiO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxhQUFZO0FBQUEsTUFDWixJQUFHO0FBQUEsTUFDSCxXQUFXO0FBQUEsTUFDWCxXQUFVO0FBQUE7QUFBQSxFQUNaLEdBQ0E7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLFNBQVMsWUFBWTtBQUNuQixjQUFNLEtBQUssU0FBUyxlQUFlLDBCQUEwQjtBQUM3RCxjQUFNLEtBQUssSUFBSSxTQUFTO0FBQ3hCLGNBQU0sSUFBSSxHQUFHLEtBQUssSUFDZCxNQUFNLGdCQUFnQixnQkFBZ0IsRUFBRSxZQUFZLEdBQUcsS0FBSyxFQUFFLENBQUMsSUFDL0QsTUFBTSxnQkFBZ0IsZUFBZSxDQUFDLENBQUM7QUFDM0MsWUFBSSxLQUFLLENBQUMsRUFBRSxHQUFJLE9BQU0sRUFBRSxPQUFPLGdFQUEwQjtBQUN6RCxZQUFJLEdBQUksSUFBRyxRQUFRO0FBQUEsTUFDckI7QUFBQSxNQUNBLFdBQVU7QUFBQTtBQUFBLElBQStIO0FBQUEsRUFFM0ksQ0FDRixDQUVKLENBRUosQ0FDRjtBQUVKO0FBRU8sZ0JBQVMsb0JBQW9CO0FBQUEsRUFDbEM7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQ0YsR0FBRztBQUNELFFBQU0sQ0FBQyxZQUFZLGFBQWEsSUFBSSxTQUFTO0FBQUEsSUFDM0MsU0FBUztBQUFBLElBQ1QsaUJBQWlCO0FBQUEsSUFDakIscUJBQXFCO0FBQUEsSUFDckIsY0FBYztBQUFBLElBQ2QsVUFBVTtBQUFBLElBQ1YsV0FBVztBQUFBLElBQ1gsV0FBVztBQUFBLElBQ1gsV0FBVztBQUFBLEVBQ2IsQ0FBQztBQUNELFFBQU0sQ0FBQyxZQUFZLGFBQWEsSUFBSSxTQUFTLFFBQVEsTUFBTSxNQUFNLGFBQWEsT0FBTyxjQUFjLE9BQU8sVUFBVSxDQUFDO0FBQ3JILFFBQU0sQ0FBQyxXQUFXLFlBQVksSUFBSSxTQUFTLENBQUMsQ0FBQztBQUM3QyxRQUFNLHFCQUFxQixNQUFNO0FBQy9CLFFBQUksSUFBSSxDQUFDO0FBQ1QsUUFBSTtBQUFFLFVBQUksT0FBTyxVQUFVLEtBQUssTUFBTSxNQUFNLE9BQU8sSUFBSSxDQUFDO0FBQUEsSUFBRyxRQUFRO0FBQUEsSUFBRTtBQUNyRSxXQUFPLEVBQUUsWUFBWSxPQUFPLFlBQVk7QUFBQSxFQUMxQztBQUVBLFFBQU0scUJBQXFCLENBQUMsTUFBTTtBQUNoQyxRQUFJLENBQUMsRUFBRyxRQUFPO0FBQ2YsUUFBSSxVQUFVLENBQUMsRUFBRyxRQUFPO0FBQ3pCLFFBQUksY0FBYyxDQUFDLEVBQUcsUUFBTztBQUM3QixRQUFJLGtCQUFrQixDQUFDLEVBQUcsUUFBTztBQUNqQyxXQUFPO0FBQUEsRUFDVDtBQUVBLFFBQU0sVUFBVSxtQkFBbUI7QUFDbkMsUUFBTSxDQUFDLGdCQUFnQixpQkFBaUIsSUFBSSxTQUFTLE9BQU87QUFDNUQsUUFBTSxDQUFDLFVBQVUsV0FBVyxJQUFJLFNBQVMsTUFBTSxtQkFBbUIsT0FBTyxDQUFDO0FBQzFFLFFBQU0sQ0FBQyxlQUFlLGdCQUFnQixJQUFJLFNBQVMsS0FBSztBQUN4RCxRQUFNLENBQUMsV0FBVyxZQUFZLElBQUksU0FBUyxDQUFDO0FBQzVDLFFBQU0sQ0FBQyxVQUFVLFdBQVcsSUFBSSxTQUFTLENBQUM7QUFDMUMsUUFBTSxDQUFDLGFBQWEsY0FBYyxJQUFJLFNBQVMsS0FBSztBQUNwRCxRQUFNLENBQUMsS0FBSyxNQUFNLElBQUksU0FBUyxFQUFFO0FBRWpDLFlBQVUsTUFBTTtBQUNkLFFBQUksT0FBTyxjQUFjLE9BQU8sY0FBYyxNQUFNLE1BQU0sV0FBVztBQUNuRSxvQkFBYyxJQUFJO0FBQUEsSUFDcEI7QUFBQSxFQUNGLEdBQUcsQ0FBQyxPQUFPLFlBQVksT0FBTyxZQUFZLE1BQU0sTUFBTSxTQUFTLENBQUM7QUFFaEUsUUFBTSxXQUFXLE9BQU8sSUFBSTtBQUM1QixRQUFNLGNBQWMsT0FBTyxJQUFJO0FBQy9CLFFBQU0sZ0JBQWdCLGFBQWEsTUFBTSxFQUFFO0FBQzNDLFFBQU0sZUFBZSxPQUFPLEtBQUs7QUFDakMsUUFBTSxtQkFBbUIsT0FBTyxLQUFLO0FBRXJDLFlBQVUsTUFBTTtBQUNkLFFBQUksSUFBSSxDQUFDO0FBQ1QsUUFBSTtBQUFFLFVBQUksT0FBTyxVQUFVLEtBQUssTUFBTSxNQUFNLE9BQU8sSUFBSSxDQUFDO0FBQUEsSUFBRyxRQUFRO0FBQUEsSUFBRTtBQUNyRSxVQUFNLFVBQVUsRUFBRSxZQUFZLE9BQU8sWUFBWTtBQUNqRCxRQUFJLFdBQVcsWUFBWSxnQkFBZ0I7QUFDekMsd0JBQWtCLE9BQU87QUFDekIsa0JBQVksbUJBQW1CLE9BQU8sQ0FBQztBQUFBLElBQ3pDO0FBQUEsRUFDRixHQUFHLENBQUMsT0FBTyxTQUFTLE9BQU8sUUFBUSxDQUFDO0FBRXBDLFFBQU0sV0FBVztBQUNqQixRQUFNLE9BQU8sV0FBVyxVQUFVLFFBQVEsSUFBSTtBQUM5QyxRQUFNLFFBQVEsV0FBVyxjQUFjLFFBQVEsSUFBSTtBQUNuRCxRQUFNLGNBQWMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxTQUFTLGtCQUFrQixRQUFRLElBQUksV0FBVyxRQUFRLElBQUk7QUFHeEcsWUFBVSxNQUFNO0FBQ2QsUUFBSSxDQUFDLEtBQU07QUFDWCxRQUFJLFlBQVk7QUFDaEIsUUFBSSxhQUFhO0FBQ2pCLFFBQUksV0FBVztBQUVmLFVBQU0sZ0JBQWdCLE1BQU07QUFDMUIsVUFBSSxVQUFXO0FBQ2YsWUFBTSxLQUFLLFNBQVMsZUFBZSxhQUFhO0FBQ2hELFVBQUksQ0FBQyxJQUFJO0FBQ1AsWUFBSSxhQUFhLElBQUk7QUFDbkIsdUJBQWEsV0FBVyxlQUFlLEVBQUU7QUFBQSxRQUMzQztBQUNBO0FBQUEsTUFDRjtBQUdBLFVBQUksWUFBWSxXQUFXLFlBQVksUUFBUSxTQUFTO0FBQ3RELFlBQUk7QUFBRSxzQkFBWSxRQUFRLFFBQVE7QUFBQSxRQUFHLFFBQVE7QUFBQSxRQUFDO0FBQzlDLG9CQUFZLFVBQVU7QUFBQSxNQUN4QjtBQUVBLFVBQUk7QUFDRixvQkFBWSxVQUFVLElBQUksT0FBTyxHQUFHLE9BQU8sZUFBZTtBQUFBLFVBQ3hELE9BQU87QUFBQSxVQUNQLFFBQVE7QUFBQSxVQUNSLFNBQVM7QUFBQSxVQUNULFlBQVk7QUFBQSxZQUNWLFVBQVU7QUFBQSxZQUNWLFVBQVUsYUFBYSxJQUFJO0FBQUEsWUFDM0IsV0FBVyxhQUFhLElBQUk7QUFBQSxZQUM1QixnQkFBZ0I7QUFBQSxZQUNoQixLQUFLO0FBQUEsWUFDTCxhQUFhO0FBQUEsVUFDZjtBQUFBLFVBQ0EsUUFBUTtBQUFBLFlBQ04sU0FBUyxDQUFDLFVBQVU7QUFDbEIsa0JBQUksVUFBVztBQUNmLGtCQUFJLE1BQU0sT0FBTyxhQUFhO0FBQzVCLHNCQUFNLElBQUksTUFBTSxPQUFPLFlBQVk7QUFDbkMsb0JBQUksSUFBSSxFQUFHLGFBQVksQ0FBQztBQUFBLGNBQzFCO0FBQ0Esa0JBQUksV0FBVyxXQUFXLE1BQU0sT0FBTyxXQUFXO0FBQ2hELG9CQUFJO0FBQUUsd0JBQU0sT0FBTyxVQUFVO0FBQUEsZ0JBQUcsUUFBUTtBQUFBLGdCQUFDO0FBQUEsY0FDM0M7QUFDQSxrQkFBSSxXQUFXLGtCQUFrQixLQUFLLE1BQU0sT0FBTyxRQUFRO0FBQ3pELG9CQUFJO0FBQUUsd0JBQU0sT0FBTyxPQUFPLFdBQVcsaUJBQWlCLElBQUk7QUFBQSxnQkFBRyxRQUFRO0FBQUEsZ0JBQUM7QUFBQSxjQUN4RTtBQUFBLFlBQ0Y7QUFBQSxZQUNBLGVBQWUsQ0FBQyxVQUFVO0FBQ3hCLGtCQUFJLGNBQWMsQ0FBQyxlQUFlLENBQUMsYUFBYSxTQUFTO0FBQ3ZELG9CQUFJLE1BQU0sU0FBUyxLQUFLLENBQUMsV0FBVyxTQUFTO0FBQzNDLDBCQUFRLFFBQVEsTUFBTSxPQUFPLGVBQWUsQ0FBQztBQUFBLGdCQUMvQyxXQUFXLE1BQU0sU0FBUyxLQUFLLFdBQVcsU0FBUztBQUNqRCwwQkFBUSxTQUFTLE1BQU0sT0FBTyxlQUFlLENBQUM7QUFBQSxnQkFDaEQ7QUFBQSxjQUNGO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNILFNBQVMsS0FBSztBQUNaLGdCQUFRLEtBQUssMENBQTJCLEdBQUc7QUFBQSxNQUM3QztBQUFBLElBQ0Y7QUFFQSx3QkFBb0IsTUFBTTtBQUN4QixpQkFBVyxlQUFlLEVBQUU7QUFBQSxJQUM5QixDQUFDO0FBRUQsV0FBTyxNQUFNO0FBQ1gsa0JBQVk7QUFDWixVQUFJLFdBQVksY0FBYSxVQUFVO0FBQ3ZDLFVBQUksWUFBWSxXQUFXLFlBQVksUUFBUSxTQUFTO0FBQ3RELFlBQUk7QUFBRSxzQkFBWSxRQUFRLFFBQVE7QUFBQSxRQUFHLFFBQVE7QUFBQSxRQUFFO0FBQy9DLG9CQUFZLFVBQVU7QUFBQSxNQUN4QjtBQUFBLElBQ0Y7QUFBQSxFQUNGLEdBQUcsQ0FBQyxNQUFNLE1BQU0sSUFBSSxVQUFVLENBQUM7QUFHL0IsUUFBTSxlQUFlLENBQUMsSUFBSSxNQUFNLFNBQVM7QUFDdkMsUUFBSSxDQUFDLEdBQUk7QUFDVCxVQUFNLFFBQVEsS0FBSyxJQUFJO0FBQ3ZCLFVBQU0sZ0JBQWdCLEdBQUcsWUFBWSxJQUFJLEtBQUssR0FBRyxTQUFTLEVBQUUsUUFBUSxJQUFJO0FBQ3hFLFVBQU0sZUFBZSxHQUFHLGFBQVksb0JBQUksS0FBSyxPQUFPLEdBQUcsU0FBUyxFQUFFLFFBQVEsS0FBSyxHQUFHLEtBQUssT0FBTyxHQUFHLFNBQVMsRUFBRSxTQUFTLEdBQUcsSUFBSSxLQUFLLElBQUksR0FBRSxRQUFRLElBQUk7QUFDbkosVUFBTSxhQUFhLEtBQUssSUFBSSxJQUFJLFFBQVEsZ0JBQWdCLEdBQUk7QUFFNUQsUUFBSSxZQUFZLE9BQU8sR0FBRyxtQkFBbUIsQ0FBQztBQUM5QyxRQUFJLEdBQUcsU0FBUztBQUNkLGtCQUFZLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQyxJQUFLLGNBQWMsR0FBRyxnQkFBZ0I7QUFBQSxJQUN0RjtBQUNBLGlCQUFhLEtBQUssSUFBSSxHQUFHLEtBQUssTUFBTSxTQUFTLENBQUMsQ0FBQztBQUUvQyxRQUFJLFFBQVEsYUFBYSxRQUFTO0FBRWxDLFFBQUksU0FBUyxrQkFBa0IsU0FBUyxTQUFTO0FBQy9DLFlBQU0sSUFBSSxTQUFTO0FBQ25CLFVBQUksR0FBRyxTQUFTO0FBQ2QsY0FBTSxRQUFRLEtBQUssSUFBSSxFQUFFLGNBQWMsU0FBUztBQUNoRCxZQUFJLFFBQVEsS0FBSztBQUNmLFlBQUUsY0FBYztBQUFBLFFBQ2xCO0FBQ0EsWUFBSSxFQUFFLFdBQVcsaUJBQWlCLGlCQUFpQixXQUFXLE9BQU87QUFDbkUsWUFBRSxLQUFLLEVBQUUsTUFBTSxNQUFNO0FBQUEsVUFBQyxDQUFDO0FBQUEsUUFDekI7QUFDQSxZQUFJLEVBQUUsa0JBQWtCLEdBQUcsZ0JBQWdCLElBQU07QUFDL0MsWUFBRSxlQUFlLEdBQUcsZ0JBQWdCO0FBQUEsUUFDdEM7QUFBQSxNQUNGLE9BQU87QUFDTCxZQUFJLENBQUMsRUFBRSxPQUFRLEdBQUUsTUFBTTtBQUN2QixjQUFNLFFBQVEsS0FBSyxJQUFJLEVBQUUsY0FBYyxHQUFHLGVBQWU7QUFDekQsWUFBSSxRQUFRLEtBQUs7QUFDZixZQUFFLGNBQWMsR0FBRztBQUFBLFFBQ3JCO0FBQUEsTUFDRjtBQUFBLElBQ0YsV0FBVyxTQUFTLGFBQWEsWUFBWSxXQUFXLFlBQVksUUFBUSxnQkFBZ0I7QUFDMUYsWUFBTSxJQUFJLFlBQVk7QUFDdEIsVUFBSTtBQUNGLGNBQU0sTUFBTSxFQUFFLGVBQWUsS0FBSztBQUNsQyxjQUFNLFFBQVEsS0FBSyxJQUFJLE1BQU0sU0FBUztBQUN0QyxZQUFJLEdBQUcsU0FBUztBQUNkLGNBQUksUUFBUSxLQUFLO0FBQ2YsY0FBRSxPQUFPLFdBQVcsSUFBSTtBQUFBLFVBQzFCO0FBQ0EsZ0JBQU0sS0FBSyxFQUFFLGVBQWU7QUFDNUIsY0FBSSxPQUFPLEtBQUssT0FBTyxNQUFNLGlCQUFpQixPQUFPO0FBQ25ELGNBQUUsVUFBVTtBQUFBLFVBQ2Q7QUFBQSxRQUNGLE9BQU87QUFDTCxnQkFBTSxLQUFLLEVBQUUsZUFBZTtBQUM1QixjQUFJLE9BQU8sRUFBRyxHQUFFLFdBQVc7QUFDM0IsY0FBSSxLQUFLLElBQUksTUFBTSxHQUFHLGVBQWUsSUFBSSxLQUFLO0FBQzVDLGNBQUUsT0FBTyxHQUFHLGlCQUFpQixJQUFJO0FBQUEsVUFDbkM7QUFBQSxRQUNGO0FBQUEsTUFDRixRQUFRO0FBQUEsTUFBRTtBQUFBLElBQ1o7QUFBQSxFQUNGO0FBR0EsWUFBVSxNQUFNO0FBQ2QsUUFBSSxTQUFTO0FBQ2IsVUFBTSxhQUFhLFlBQVk7QUFDN0IsVUFBSTtBQUNGLGNBQU0sTUFBTSxNQUFNLE1BQU0sNEJBQTRCLE1BQU0sRUFBRSxFQUFFO0FBQzlELGNBQU0sSUFBSSxNQUFNLElBQUksS0FBSztBQUN6QixZQUFJLENBQUMsT0FBUTtBQUNiLFlBQUksRUFBRSxNQUFNLEVBQUUsT0FBTztBQUNuQix3QkFBYyxFQUFFLEtBQUs7QUFDckIsd0JBQWMsUUFBUSxFQUFFLFVBQVUsQ0FBQztBQUNuQyxjQUFJLEVBQUUsS0FBTSxjQUFhLEVBQUUsSUFBSTtBQUMvQixzQkFBWSxFQUFFLFlBQVksYUFBYTtBQUN2QyxjQUFJLEVBQUUsT0FBTyxZQUFZLEVBQUUsTUFBTSxhQUFhLGdCQUFnQjtBQUM1RCw4QkFBa0IsRUFBRSxNQUFNLFFBQVE7QUFBQSxVQUNwQztBQUNBLHVCQUFhLEVBQUUsT0FBTyxRQUFRLEVBQUUsVUFBVSxHQUFHLEVBQUUsWUFBWSxhQUFhO0FBQUEsUUFDMUU7QUFBQSxNQUNGLFFBQVE7QUFBQSxNQUFFO0FBQUEsSUFDWjtBQUVBLGVBQVc7QUFDWCxVQUFNLFFBQVEsWUFBWSxXQUFXLFVBQVUsR0FBRyxJQUFJO0FBQ3RELFdBQU8sTUFBTTtBQUNYLGVBQVM7QUFDVCxvQkFBYyxLQUFLO0FBQUEsSUFDckI7QUFBQSxFQUNGLEdBQUcsQ0FBQyxNQUFNLElBQUksYUFBYSxDQUFDO0FBRzVCLFlBQVUsTUFBTTtBQUNkLFFBQUksQ0FBQyxXQUFXLFFBQVM7QUFDekIsVUFBTSxPQUFPLFlBQVksTUFBTTtBQUM3QixVQUFJLENBQUMsYUFBYSxTQUFTO0FBQ3pCLHFCQUFhLE9BQUssSUFBSSxDQUFDO0FBQUEsTUFDekI7QUFBQSxJQUNGLEdBQUcsR0FBSTtBQUNQLFdBQU8sTUFBTSxjQUFjLElBQUk7QUFBQSxFQUNqQyxHQUFHLENBQUMsV0FBVyxPQUFPLENBQUM7QUFHdkIsUUFBTSxVQUFVLE9BQU8sUUFBUSxjQUFjO0FBQzNDLFFBQUksWUFBYTtBQUNqQixtQkFBZSxJQUFJO0FBQ25CLFdBQU8sRUFBRTtBQUVULFFBQUksTUFBTTtBQUNWLFFBQUksUUFBUSxRQUFXO0FBQ3JCLFVBQUksYUFBYSxrQkFBa0IsU0FBUyxTQUFTO0FBQ25ELGNBQU0sU0FBUyxRQUFRO0FBQUEsTUFDekIsV0FBVyxhQUFhLGFBQWEsWUFBWSxTQUFTLGdCQUFnQjtBQUN4RSxjQUFNLFlBQVksUUFBUSxlQUFlO0FBQUEsTUFDM0MsT0FBTztBQUNMLGNBQU07QUFBQSxNQUNSO0FBQUEsSUFDRjtBQUNBLFVBQU0sS0FBSyxJQUFJLEdBQUcsUUFBUSxPQUFPLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUcvQyxRQUFJLFdBQVcsUUFBUTtBQUNyQixVQUFJLGFBQWEsa0JBQWtCLFNBQVMsUUFBUyxVQUFTLFFBQVEsS0FBSyxFQUFFLE1BQU0sTUFBTTtBQUFBLE1BQUMsQ0FBQztBQUFBLGVBQ2xGLGFBQWEsYUFBYSxZQUFZLFNBQVMsVUFBVyxhQUFZLFFBQVEsVUFBVTtBQUFBLElBQ25HLFdBQVcsV0FBVyxTQUFTO0FBQzdCLFVBQUksYUFBYSxrQkFBa0IsU0FBUyxRQUFTLFVBQVMsUUFBUSxNQUFNO0FBQUEsZUFDbkUsYUFBYSxhQUFhLFlBQVksU0FBUyxXQUFZLGFBQVksUUFBUSxXQUFXO0FBQUEsSUFDckcsV0FBVyxXQUFXLFFBQVE7QUFDNUIsVUFBSSxhQUFhLGtCQUFrQixTQUFTLFFBQVMsVUFBUyxRQUFRLGNBQWM7QUFBQSxlQUMzRSxhQUFhLGFBQWEsWUFBWSxTQUFTLE9BQVEsYUFBWSxRQUFRLE9BQU8sS0FBSyxJQUFJO0FBQUEsSUFDdEc7QUFFQSxRQUFJO0FBQ0YsWUFBTSxNQUFNLE1BQU0sTUFBTSxvQkFBb0I7QUFBQSxRQUMxQyxRQUFRO0FBQUEsUUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLFFBQzlDLE1BQU0sS0FBSyxVQUFVO0FBQUEsVUFDbkIsU0FBUyxNQUFNO0FBQUEsVUFDZjtBQUFBLFVBQ0EsVUFBVTtBQUFBLFVBQ1Ysa0JBQWtCLFdBQVc7QUFBQSxVQUM3QixjQUFjLFdBQVcsZ0JBQWdCO0FBQUEsUUFDM0MsQ0FBQztBQUFBLE1BQ0gsQ0FBQztBQUNELFlBQU0sSUFBSSxNQUFNLElBQUksS0FBSztBQUN6QixVQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU87QUFDbkIsc0JBQWMsRUFBRSxLQUFLO0FBQ3JCLHFCQUFhLEtBQUssTUFBTSxFQUFFLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQztBQUFBLE1BQ3pELFdBQVcsRUFBRSxZQUFZLEVBQUUsT0FBTztBQUNoQyxzQkFBYyxFQUFFLEtBQUs7QUFDckIscUJBQWEsRUFBRSxPQUFPLFlBQVksUUFBUTtBQUFBLE1BQzVDLE9BQU87QUFDTCxlQUFPLEVBQUUsT0FBTyw0Q0FBMEI7QUFBQSxNQUM1QztBQUFBLElBQ0YsUUFBUTtBQUNOLGFBQU8sNkNBQXNCO0FBQUEsSUFDL0IsVUFBRTtBQUNBLHFCQUFlLEtBQUs7QUFBQSxJQUN0QjtBQUFBLEVBQ0Y7QUFHQSxZQUFVLE1BQU07QUFDZCxRQUFJLGFBQWMsY0FBYSxVQUFVO0FBQUEsRUFDM0MsR0FBRyxDQUFDLFdBQVcsWUFBWSxDQUFDO0FBTTVCLFlBQVUsTUFBTTtBQUNkLFVBQU0sWUFBWSxDQUFDLE1BQU07QUFDdkIsVUFBSSxFQUFFLFFBQVEsWUFBWSxNQUFNLEdBQUk7QUFDcEMsWUFBTSxNQUFNLEtBQUssSUFBSSxHQUFHLE9BQU8sRUFBRSxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ2pELFVBQUksWUFBWTtBQUNkLGdCQUFRLFFBQVEsR0FBRztBQUFBLE1BQ3JCLE9BQU87QUFDTCxZQUFJLGFBQWEsa0JBQWtCLFNBQVMsUUFBUyxVQUFTLFFBQVEsY0FBYztBQUFBLGlCQUMzRSxhQUFhLGFBQWEsWUFBWSxTQUFTLE9BQVEsYUFBWSxRQUFRLE9BQU8sS0FBSyxJQUFJO0FBQ3BHLHFCQUFhLEtBQUssTUFBTSxHQUFHLENBQUM7QUFBQSxNQUM5QjtBQUFBLElBQ0Y7QUFDQSxXQUFPLGlCQUFpQixXQUFXLFNBQVM7QUFDNUMsV0FBTyxNQUFNLE9BQU8sb0JBQW9CLFdBQVcsU0FBUztBQUFBLEVBQzlELEdBQUcsQ0FBQyxNQUFNLElBQUksWUFBWSxVQUFVLFdBQVcsUUFBUSxDQUFDO0FBRXhELFFBQU0scUJBQXFCLE1BQU07QUFDL0IscUJBQWlCLFVBQVU7QUFDM0IscUJBQWlCLElBQUk7QUFDckIsUUFBSSxhQUFhLGtCQUFrQixTQUFTLFNBQVM7QUFDbkQsWUFBTSxJQUFJLFNBQVM7QUFDbkIsWUFBTSxJQUFJLEVBQUUsS0FBSztBQUNqQixVQUFJLEtBQUssT0FBTyxFQUFFLFNBQVMsWUFBWTtBQUNyQyxVQUFFLEtBQUssTUFBTTtBQUNYLGNBQUksQ0FBQyxXQUFXLFNBQVM7QUFDdkIsY0FBRSxNQUFNO0FBQUEsVUFDVjtBQUFBLFFBQ0YsQ0FBQyxFQUFFLE1BQU0sTUFBTTtBQUFBLFFBQUMsQ0FBQztBQUFBLE1BQ25CO0FBQUEsSUFDRixXQUFXLGFBQWEsYUFBYSxZQUFZLFNBQVMsV0FBVztBQUNuRSxVQUFJLFdBQVcsUUFBUyxhQUFZLFFBQVEsVUFBVTtBQUFBLElBQ3hEO0FBQUEsRUFDRjtBQUVBLFNBQ0Usb0NBQUMsU0FBSSxXQUFVLHdDQUViLG9DQUFDLFNBQUksV0FBVSx5R0FFWixDQUFDLGlCQUFpQixDQUFDLGVBQWUsYUFBYSxhQUFhLGFBQWEsbUJBQ3hFLG9DQUFDLFNBQUksV0FBVSxpSUFDYixvQ0FBQyxTQUFJLFdBQVUsMExBQXVMLFdBRXRNLEdBQ0Esb0NBQUMsT0FBRSxXQUFVLHdDQUFxQyw0QkFBb0IsR0FDdEUsb0NBQUMsT0FBRSxXQUFVLDBDQUF1QyxtSkFFcEQsR0FDQTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsSUFBRztBQUFBLE1BQ0gsTUFBSztBQUFBLE1BQ0wsU0FBUztBQUFBLE1BQ1QsV0FBVTtBQUFBO0FBQUEsSUFDVixvQ0FBQyxjQUFLLFFBQUM7QUFBQSxJQUNQLG9DQUFDLGNBQUssNkNBQXNCO0FBQUEsRUFDOUIsQ0FDRixHQUlELE9BQ0Msb0NBQUMsU0FBSSxLQUFLLFdBQVcsTUFBTSxFQUFFLElBQUksSUFBSSxJQUFJLFdBQVUsb0RBQ2pELG9DQUFDLFNBQUksSUFBSSxlQUFlLFdBQVUsaUJBQWdCLENBQ3BELElBQ0UsUUFDRjtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsS0FBSyxtQ0FBbUMsS0FBSztBQUFBLE1BQzdDLE9BQU8sTUFBTTtBQUFBLE1BQ2IsT0FBTTtBQUFBLE1BQ04saUJBQWU7QUFBQSxNQUNmLFdBQVU7QUFBQTtBQUFBLEVBQ1osSUFDRSxjQUNGO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxhQUFXO0FBQUEsTUFDWCxlQUFZO0FBQUEsTUFDWixVQUFVO0FBQUEsTUFDVixXQUFVO0FBQUEsTUFDVixrQkFBa0IsT0FBSztBQUNyQixZQUFJLEVBQUUsT0FBTyxXQUFXLEVBQUcsYUFBWSxFQUFFLE9BQU8sUUFBUTtBQUFBLE1BQzFEO0FBQUEsTUFDQSxRQUFRLE1BQU07QUFDWixZQUFJLGNBQWMsQ0FBQyxXQUFXLFdBQVcsQ0FBQyxhQUFhO0FBQ3JELGtCQUFRLFFBQVEsU0FBUyxTQUFTLFdBQVc7QUFBQSxRQUMvQztBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVMsTUFBTTtBQUNiLFlBQUksY0FBYyxXQUFXLFdBQVcsQ0FBQyxhQUFhO0FBQ3BELGtCQUFRLFNBQVMsU0FBUyxTQUFTLFdBQVc7QUFBQSxRQUNoRDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFVBQVUsTUFBTTtBQUNkLFlBQUksQ0FBQyxjQUFjLGVBQWUsYUFBYSxRQUFTO0FBQ3hELGNBQU0sTUFBTSxTQUFTLFNBQVM7QUFDOUIsWUFBSSxRQUFRLE9BQVc7QUFJdkIsY0FBTSxLQUFLO0FBQ1gsY0FBTSxRQUFRLElBQUksYUFBWSxvQkFBSSxLQUFLLE9BQU8sR0FBRyxTQUFTLEVBQUUsUUFBUSxLQUFLLEdBQUcsS0FBSyxPQUFPLEdBQUcsU0FBUyxFQUFFLFNBQVMsR0FBRyxJQUFJLEtBQUssSUFBSSxHQUFFLFFBQVEsSUFBSSxLQUFLLElBQUk7QUFDdEosY0FBTSxVQUFVLEtBQUssSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLFNBQVMsR0FBSTtBQUN2RCxjQUFNLFNBQVMsSUFBSSxVQUNmLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQyxJQUFJLFdBQVcsR0FBRyxnQkFBZ0IsS0FDcEUsT0FBTyxJQUFJLG1CQUFtQixDQUFDO0FBQ25DLFlBQUksS0FBSyxJQUFJLE1BQU0sTUFBTSxJQUFJLElBQUssU0FBUSxRQUFRLEdBQUc7QUFBQSxNQUN2RDtBQUFBO0FBQUEsRUFDRixJQUVBLG9DQUFDLFNBQUksV0FBVSw2RkFDYixvQ0FBQyxVQUFLLFdBQVUsbUJBQWdCLGNBQUUsR0FDbEMsb0NBQUMsY0FBSyx1R0FBeUQsQ0FDakUsQ0FFSixHQUdDLFNBQ0Msb0NBQUMsU0FBSSxXQUFVLHNIQUNiLG9DQUFDLFVBQUssV0FBVSxhQUFVLGNBQUUsR0FDNUIsb0NBQUMsY0FBSyxzREFBMkIsb0NBQUMsZ0JBQU8sNEJBQVcsR0FBUyxxRkFBa0QsQ0FDakgsR0FJRCxDQUFDLGNBQ0Ysb0NBQUMsU0FBSSxXQUFVLGdHQUNiLG9DQUFDLFNBQUksV0FBVSx1REFDYixvQ0FBQyxTQUFJLFdBQVUsK0NBRVosY0FBYyxhQUFhLGtCQUFrQixhQUFhLGlCQUN6RCxvQ0FBQyxVQUFLLElBQUcsb0JBQW1CLFdBQVcsMkZBQTJGLFdBQVcsVUFBVSxvR0FBb0csMkZBQTJGLE1BQ3BWLG9DQUFDLFVBQUssV0FBVyx3QkFBd0IsV0FBVyxVQUFVLGlDQUFpQyxjQUFjLElBQUksR0FDakgsb0NBQUMsY0FBTSxXQUFXLFVBQVUsNEJBQW9CLG9CQUFXLENBQzdELEdBR0QsY0FDQyxvQ0FBQyxVQUFLLElBQUcsY0FBYSxXQUFVLCtJQUM5QixvQ0FBQyxjQUFLLFFBQUMsR0FDUCxvQ0FBQyxjQUFLLG1CQUFTLENBQ2pCLENBRUosR0FDQSxvQ0FBQyxTQUFJLFdBQVUsK0NBQ1gsY0FBYyxLQUFLLE1BQU0sY0FBYyxNQUFNLGlCQUFpQixjQUM5RDtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsTUFBSztBQUFBLE1BQ0wsU0FBUztBQUFBLE1BQ1QsV0FBVTtBQUFBO0FBQUEsSUFBc0s7QUFBQSxFQUVsTCxDQUVKLENBQ0YsR0FHQyxlQUFlLGFBQWEsa0JBQWtCLGFBQWEsY0FDMUQsb0NBQUMsU0FBSSxXQUFVLGdGQUNiO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFLO0FBQUEsTUFDTCxTQUFTLE1BQU0sUUFBUSxXQUFXLFVBQVUsVUFBVSxNQUFNO0FBQUEsTUFDNUQsVUFBVTtBQUFBLE1BQ1YsV0FBVyxpTEFDVCxXQUFXLFVBQ1AsNEhBQ0EscUhBQ047QUFBQTtBQUFBLElBQ0Esb0NBQUMsY0FBTSxXQUFXLFVBQVUsV0FBTSxRQUFJO0FBQUEsSUFDdEMsb0NBQUMsY0FBTSxXQUFXLFVBQVUsd0NBQXNCLGdDQUFzQjtBQUFBLEVBQzFFLEdBRUEsb0NBQUMsU0FBSSxXQUFVLDZDQUNiLG9DQUFDLFVBQUssSUFBRyx1QkFBc0IsV0FBVSxtREFDdEMsaUJBQWlCLFNBQVMsQ0FDN0IsR0FDQTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsSUFBRztBQUFBLE1BQ0gsTUFBSztBQUFBLE1BQ0wsS0FBSTtBQUFBLE1BQ0osS0FBSyxXQUFXLElBQUksV0FBVyxLQUFLLElBQUksV0FBVyxHQUFHO0FBQUEsTUFDdEQsTUFBSztBQUFBLE1BQ0wsT0FBTztBQUFBLE1BQ1AsYUFBYSxNQUFNO0FBQUUscUJBQWEsVUFBVTtBQUFBLE1BQU07QUFBQSxNQUNsRCxjQUFjLE1BQU07QUFBRSxxQkFBYSxVQUFVO0FBQUEsTUFBTTtBQUFBLE1BQ25ELFVBQVUsT0FBSyxhQUFhLE9BQU8sRUFBRSxPQUFPLEtBQUssQ0FBQztBQUFBLE1BQ2xELFdBQVcsT0FBSztBQUNkLHFCQUFhLFVBQVU7QUFDdkIsZ0JBQVEsUUFBUSxPQUFPLEVBQUUsT0FBTyxLQUFLLENBQUM7QUFBQSxNQUN4QztBQUFBLE1BQ0EsWUFBWSxPQUFLO0FBQ2YscUJBQWEsVUFBVTtBQUN2QixnQkFBUSxRQUFRLE9BQU8sRUFBRSxPQUFPLEtBQUssQ0FBQztBQUFBLE1BQ3hDO0FBQUEsTUFDQSxXQUFVO0FBQUE7QUFBQSxFQUNaLEdBQ0Esb0NBQUMsVUFBSyxXQUFVLG1EQUNiLFdBQVcsSUFBSSxpQkFBaUIsUUFBUSxJQUFJLE9BQy9DLENBQ0YsQ0FDRixHQUdELE9BQU8sb0NBQUMsT0FBRSxXQUFVLDJCQUF5QixHQUFJLEdBQ2pELE1BQU0sUUFBUSxvQ0FBQyxPQUFFLFdBQVUscURBQW1ELE1BQU0sSUFBSyxDQUU1RixDQUVGO0FBR0o7QUFJTyxnQkFBUyxnQkFBZ0I7QUFBQSxFQUM5QjtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGLEdBQUc7QUFDRCxRQUFNLENBQUMsWUFBWSxhQUFhLElBQUksU0FBUztBQUFBLElBQzNDLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLGlCQUFpQjtBQUFBLElBQ2pCLGtCQUFrQjtBQUFBLElBQ2xCLFFBQVE7QUFBQSxJQUNSLFVBQVU7QUFBQSxJQUNWLFlBQVk7QUFBQSxJQUNaLFdBQVc7QUFBQSxJQUNYLFdBQVc7QUFBQSxFQUNiLENBQUM7QUFDRCxRQUFNLENBQUMsZ0JBQWdCLGlCQUFpQixJQUFJLFNBQVMsSUFBSTtBQUN6RCxRQUFNLENBQUMsYUFBYSxjQUFjLElBQUksU0FBUyxLQUFLO0FBQ3BELFFBQU0sQ0FBQyxLQUFLLE1BQU0sSUFBSSxTQUFTLEVBQUU7QUFHakMsTUFBSSxVQUFVLENBQUM7QUFDZixNQUFJO0FBQUUsY0FBVSxNQUFNLFVBQVUsS0FBSyxNQUFNLE1BQU0sT0FBTyxJQUFJLENBQUM7QUFBQSxFQUFHLFFBQVE7QUFBQSxFQUFlO0FBQ3ZGLFFBQU0sVUFBVSxRQUFRLFVBQVUsV0FBVyxRQUFRLE9BQU8sSUFBSTtBQUNoRSxRQUFNLFdBQVcsT0FBTyxJQUFJO0FBQzVCLFFBQU0sQ0FBQyxjQUFjLGVBQWUsSUFBSSxTQUFTLEtBQUs7QUFDdEQsUUFBTSxDQUFDLGFBQWEsY0FBYyxJQUFJLFNBQVMsR0FBRztBQUNsRCxRQUFNLENBQUMsWUFBWSxhQUFhLElBQUksU0FBUyxLQUFLO0FBQ2xELFFBQU0sQ0FBQyxvQkFBb0IscUJBQXFCLElBQUksU0FBUyxLQUFLO0FBR2xFLFFBQU0sQ0FBQyxZQUFZLGFBQWEsSUFBSSxTQUFTLFFBQVEsS0FBSyxNQUFNLGFBQWEsT0FBTyxjQUFjLE9BQU8sVUFBVSxDQUFDO0FBQ3BILFFBQU0sU0FBUztBQUdmLFFBQU0sbUJBQW1CLENBQUMsT0FBTztBQUMvQixRQUFJLENBQUMsR0FBSTtBQUNULGtCQUFjLEVBQUU7QUFDaEIsVUFBTSxNQUFNLE9BQU8sR0FBRyxvQkFBb0IsSUFBSTtBQUM5QyxzQkFBa0IsR0FBRztBQUFBLEVBQ3ZCO0FBR0EsWUFBVSxNQUFNO0FBQ2QsUUFBSSxTQUFTO0FBRWIsVUFBTSxhQUFhLFlBQVk7QUFDN0IsVUFBSTtBQUNGLGNBQU0sTUFBTSxNQUFNLE1BQU0sNEJBQTRCLG1CQUFtQixNQUFNLEVBQUUsQ0FBQyxFQUFFO0FBQ2xGLFlBQUksQ0FBQyxJQUFJLEdBQUk7QUFDYixjQUFNLElBQUksTUFBTSxJQUFJLEtBQUs7QUFDekIsWUFBSSxVQUFVLEVBQUUsTUFBTSxFQUFFLE9BQU87QUFDN0IsY0FBSSxPQUFPLEVBQUUsZUFBZSxXQUFXO0FBQ3JDLDBCQUFjLEVBQUUsVUFBVTtBQUFBLFVBQzVCO0FBQ0EsMkJBQWlCLEVBQUUsS0FBSztBQUFBLFFBQzFCO0FBQUEsTUFDRixRQUFRO0FBQUEsTUFFUjtBQUFBLElBQ0Y7QUFFQSxlQUFXO0FBQ1gsVUFBTSxRQUFRLFlBQVksWUFBWSxHQUFJO0FBRTFDLFVBQU0seUJBQXlCLE1BQU07QUFDbkMsVUFBSSxTQUFTLG9CQUFvQixhQUFhLFFBQVE7QUFDcEQsbUJBQVc7QUFBQSxNQUNiO0FBQUEsSUFDRjtBQUNBLGFBQVMsaUJBQWlCLG9CQUFvQixzQkFBc0I7QUFFcEUsV0FBTyxNQUFNO0FBQ1gsZUFBUztBQUNULG9CQUFjLEtBQUs7QUFDbkIsZUFBUyxvQkFBb0Isb0JBQW9CLHNCQUFzQjtBQUFBLElBQ3pFO0FBQUEsRUFDRixHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7QUFHYixZQUFVLE1BQU07QUFDZCxRQUFJLFdBQVcsV0FBVyxVQUFXO0FBQ3JDLFVBQU0sT0FBTyxZQUFZLE1BQU07QUFDN0Isd0JBQWtCLE9BQUssS0FBSyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFBQSxJQUMzQyxHQUFHLEdBQUk7QUFDUCxXQUFPLE1BQU0sY0FBYyxJQUFJO0FBQUEsRUFDakMsR0FBRyxDQUFDLFdBQVcsTUFBTSxDQUFDO0FBR3RCLFFBQU0sVUFBVSxPQUFPLFFBQVEsZUFBZSxDQUFDLE1BQU07QUFDbkQsUUFBSSxZQUFhO0FBQ2pCLG1CQUFlLElBQUk7QUFDbkIsV0FBTyxFQUFFO0FBRVQsUUFBSTtBQUNGLFlBQU0sTUFBTSxNQUFNLE1BQU0sb0JBQW9CO0FBQUEsUUFDMUMsUUFBUTtBQUFBLFFBQ1IsU0FBUyxFQUFFLGdCQUFnQixtQkFBbUI7QUFBQSxRQUM5QyxNQUFNLEtBQUssVUFBVTtBQUFBLFVBQ25CLFNBQVMsTUFBTTtBQUFBLFVBQ2Y7QUFBQSxVQUNBLGtCQUFrQixXQUFXO0FBQUEsVUFDN0IsR0FBRztBQUFBLFFBQ0wsQ0FBQztBQUFBLE1BQ0gsQ0FBQztBQUVELFlBQU0sSUFBSSxNQUFNLElBQUksS0FBSztBQUN6QixVQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU87QUFDbkIseUJBQWlCLEVBQUUsS0FBSztBQUFBLE1BQzFCLFdBQVcsSUFBSSxXQUFXLE9BQU8sRUFBRSxPQUFPO0FBRXhDLHlCQUFpQixFQUFFLEtBQUs7QUFDeEIsZUFBTywyRUFBb0M7QUFBQSxNQUM3QyxPQUFPO0FBQ0wsZUFBTyxFQUFFLE9BQU8scUZBQThDO0FBQUEsTUFDaEU7QUFBQSxJQUNGLFFBQVE7QUFDTixhQUFPLDZDQUFzQjtBQUFBLElBQy9CLFVBQUU7QUFDQSxxQkFBZSxLQUFLO0FBQUEsSUFDdEI7QUFBQSxFQUNGO0FBR0EsUUFBTSxhQUFhLE1BQU07QUFDdkIsMEJBQXNCLElBQUk7QUFDMUIsUUFBSSxTQUFTLFNBQVM7QUFDcEIsZUFBUyxRQUFRLEtBQUssRUFBRSxLQUFLLE1BQU07QUFDakMsd0JBQWdCLElBQUk7QUFBQSxNQUN0QixDQUFDLEVBQUUsTUFBTSxTQUFPO0FBQ2QsZ0JBQVEsS0FBSyx5Q0FBeUMsR0FBRztBQUFBLE1BQzNELENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUVBLFFBQU0sa0JBQWtCLE1BQU07QUFDNUIsUUFBSSxDQUFDLFNBQVMsUUFBUztBQUN2QixRQUFJLGNBQWM7QUFDaEIsZUFBUyxRQUFRLE1BQU07QUFDdkIsc0JBQWdCLEtBQUs7QUFBQSxJQUN2QixPQUFPO0FBQ0wsaUJBQVc7QUFBQSxJQUNiO0FBQUEsRUFDRjtBQUVBLFFBQU0sa0JBQWtCLE1BQU07QUFDNUIsUUFBSSxDQUFDLFNBQVMsUUFBUztBQUN2QixVQUFNLFVBQVUsQ0FBQztBQUNqQixhQUFTLFFBQVEsUUFBUTtBQUN6QixrQkFBYyxPQUFPO0FBQUEsRUFDdkI7QUFFQSxRQUFNLHFCQUFxQixDQUFDLE1BQU07QUFDaEMsVUFBTSxNQUFNLFdBQVcsRUFBRSxPQUFPLEtBQUs7QUFDckMsbUJBQWUsR0FBRztBQUNsQixRQUFJLFNBQVMsU0FBUztBQUNwQixlQUFTLFFBQVEsU0FBUztBQUMxQixVQUFJLE1BQU0sS0FBSyxZQUFZO0FBQ3pCLGlCQUFTLFFBQVEsUUFBUTtBQUN6QixzQkFBYyxLQUFLO0FBQUEsTUFDckI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUVBLFFBQU0sVUFBVSxXQUFXLFVBQVU7QUFDckMsUUFBTSxZQUFZLFdBQVcsV0FBVztBQUN4QyxRQUFNLFdBQVcsV0FBVyxvQkFBb0IsVUFBVSxNQUFNO0FBQ2hFLFFBQU0sa0JBQWtCLEtBQUssSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFLLFdBQVcsa0JBQWtCLFdBQVksR0FBRyxDQUFDO0FBRWpHLFNBQ0Usb0NBQUMsU0FBSSxXQUFVLHdDQUVaLFdBQ0M7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLE1BQUk7QUFBQSxNQUNKLFNBQVE7QUFBQSxNQUNSLFNBQVMsTUFBTSxnQkFBZ0IsS0FBSztBQUFBLE1BQ3BDLFNBQVMsTUFBTSxnQkFBZ0IsS0FBSztBQUFBO0FBQUEsRUFDdEMsR0FJRixvQ0FBQyxTQUFJLFdBQVUscUhBQ2Isb0NBQUMsU0FBSSxXQUFVLHVDQUNiLG9DQUFDLFVBQUssV0FBVyx5REFBeUQsTUFBTSxXQUFXLFdBQVcsNkRBQTZELDJDQUEyQyxNQUMzTSxNQUFNLFdBQVcsV0FBVyx1Q0FBbUIsc0JBQVUsTUFBTSxVQUFVLEVBQUUsRUFDOUUsR0FDQSxvQ0FBQyxVQUFLLElBQUcsb0JBQW1CLFdBQVUsZ0NBQTZCLHVCQUN0RCxvQ0FBQyxZQUFPLFdBQVUsb0JBQWtCLE1BQU0sV0FBWSxDQUNuRSxHQUNBLG9DQUFDLFVBQUssSUFBRyx1QkFBc0IsV0FBVSxvSEFBaUgsY0FDcEosV0FBVyxHQUFFLG1EQUNuQixDQUNGLEdBRUEsb0NBQUMsU0FBSSxXQUFVLHFDQUNaLGVBQ0Msb0NBQUMsVUFBSyxJQUFHLCtCQUE4QixXQUFVLCtIQUE0SCx5Q0FFN0ssR0FFRjtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsSUFBRztBQUFBLE1BQ0gsTUFBSztBQUFBLE1BQ0wsU0FBUyxNQUFNLGVBQWUsQ0FBQyxXQUFXO0FBQUEsTUFDMUMsV0FBVyw0RkFBNEYsY0FBYyxpR0FBaUcsNkRBQTZEO0FBQUE7QUFBQSxJQUNuUixvQ0FBQyxjQUFLLFdBQUU7QUFBQSxJQUNSLG9DQUFDLGNBQU0sY0FBYywrQkFBdUIsWUFBYTtBQUFBLEVBQzNELEdBRUMsY0FBYyxNQUFNLGlCQUFpQixjQUNwQztBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsTUFBSztBQUFBLE1BQ0wsU0FBUztBQUFBLE1BQ1QsV0FBVTtBQUFBO0FBQUEsSUFBc0k7QUFBQSxFQUVsSixDQUVKLENBQ0YsR0FHQSxvQ0FBQyxTQUFJLFdBQVcsMkhBQTJILFVBQVUscUVBQXFFLGtFQUFrRSxNQUUxUixvQ0FBQyxTQUFJLFdBQVcsNEZBQTRGLFVBQVUsaUJBQWlCLGNBQWMsSUFBSSxHQUN6SixvQ0FBQyxTQUFJLFdBQVcsZ0dBQWdHLFVBQVUsa0JBQWtCLGVBQWUsSUFBSSxHQUcvSixvQ0FBQyxTQUFJLFdBQVUsa0VBQ2I7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLElBQUc7QUFBQSxNQUNILFdBQVcsNkZBQTZGLFVBQVUsdURBQXVELG9EQUFvRDtBQUFBO0FBQUEsSUFDNU4sVUFBVSxnREFBNEI7QUFBQSxFQUN6QyxHQUVBO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxXQUFXLDZFQUE2RSxZQUFZLDZEQUE2RCxvREFBb0Q7QUFBQTtBQUFBLElBQ3JOLG9DQUFDLFVBQUssV0FBVyx3QkFBd0IsWUFBWSxpQ0FBaUMsY0FBYyxJQUFJO0FBQUEsSUFDeEcsb0NBQUMsY0FBTSxZQUFZLDRCQUFhLG9CQUFXO0FBQUEsRUFDN0MsR0FFQTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsSUFBRztBQUFBLE1BQ0gsTUFBSztBQUFBLE1BQ0wsVUFBVSxDQUFDLGNBQWM7QUFBQSxNQUN6QixTQUFTLE1BQU0sY0FBYyxRQUFRLGNBQWMsRUFBRSxRQUFRLFdBQVcsV0FBVyxVQUFVLFNBQVMsUUFBUSxDQUFDO0FBQUEsTUFDL0csT0FBTyxhQUFhLDZEQUErQjtBQUFBLE1BQ25ELFdBQVcsNEVBQTRFLGFBQWEsMEZBQTBGLDBEQUEwRDtBQUFBO0FBQUEsSUFBSTtBQUFBLElBQ3hQLFdBQVcsV0FBVyxVQUFVLG9CQUFpQjtBQUFBLEVBQ3ZELENBQ0YsR0FHQSxvQ0FBQyxTQUFJLFdBQVUsdUJBQ2I7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLElBQUc7QUFBQSxNQUNILFdBQVcsOEZBQThGLFVBQVUsZ0VBQWdFLDREQUE0RDtBQUFBO0FBQUEsSUFDOU8saUJBQWlCLGNBQWM7QUFBQSxFQUNsQyxDQUNGLEdBR0Esb0NBQUMsU0FBSSxXQUFVLG1HQUNiO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxXQUFXLHVDQUF1QyxVQUFVLGtEQUFrRCw4Q0FBOEM7QUFBQSxNQUM1SixPQUFPLEVBQUUsT0FBTyxHQUFHLGVBQWUsSUFBSTtBQUFBO0FBQUEsRUFDeEMsQ0FDRixHQUdDLGFBQ0Msb0NBQUMsU0FBSSxXQUFVLGdFQUNaLENBQUMsWUFDQTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsSUFBRztBQUFBLE1BQ0gsTUFBSztBQUFBLE1BQ0wsVUFBVTtBQUFBLE1BQ1YsU0FBUyxNQUFNLFFBQVEsT0FBTztBQUFBLE1BQzlCLFdBQVU7QUFBQTtBQUFBLElBQ1Ysb0NBQUMsY0FBSyxRQUFDO0FBQUEsSUFDUCxvQ0FBQyxjQUFLLHdCQUFPO0FBQUEsRUFDZixJQUVBO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFLO0FBQUEsTUFDTCxVQUFVO0FBQUEsTUFDVixTQUFTLE1BQU0sUUFBUSxPQUFPO0FBQUEsTUFDOUIsV0FBVTtBQUFBO0FBQUEsSUFDVixvQ0FBQyxjQUFLLFFBQUM7QUFBQSxJQUNQLG9DQUFDLGNBQUssb0JBQVE7QUFBQSxFQUNoQixHQUdGO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFLO0FBQUEsTUFDTCxVQUFVO0FBQUEsTUFDVixTQUFTLE1BQU0sUUFBUSxPQUFPO0FBQUEsTUFDOUIsV0FBVTtBQUFBO0FBQUEsSUFDVixvQ0FBQyxjQUFLLFdBQUU7QUFBQSxJQUNSLG9DQUFDLGNBQUssd0JBQU87QUFBQSxFQUNmLEdBRUMsVUFDQztBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsSUFBRztBQUFBLE1BQ0gsTUFBSztBQUFBLE1BQ0wsVUFBVTtBQUFBLE1BQ1YsU0FBUyxNQUFNLFFBQVEsYUFBYTtBQUFBLE1BQ3BDLFdBQVU7QUFBQTtBQUFBLElBQ1Ysb0NBQUMsY0FBSyxXQUFFO0FBQUEsSUFDUixvQ0FBQyxjQUFLLHVCQUFhO0FBQUEsRUFDckIsSUFFQTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsSUFBRztBQUFBLE1BQ0gsTUFBSztBQUFBLE1BQ0wsVUFBVTtBQUFBLE1BQ1YsU0FBUyxNQUFNLFFBQVEsYUFBYTtBQUFBLE1BQ3BDLFdBQVU7QUFBQTtBQUFBLElBQ1Ysb0NBQUMsY0FBSyxRQUFDO0FBQUEsSUFDUCxvQ0FBQyxjQUFLLHFCQUFTO0FBQUEsRUFDakIsQ0FFSixJQUVBLG9DQUFDLE9BQUUsV0FBVSxzQ0FBbUMsdUxBRWhELEdBR0QsT0FBTyxvQ0FBQyxPQUFFLFdBQVUscUNBQW1DLEdBQUksQ0FDOUQsR0FHQyxVQUNDLG9DQUFDLFNBQUksV0FBVSx1SUFDYixvQ0FBQyxTQUFJLFdBQVUsd0RBQ2Isb0NBQUMsU0FBSSxXQUFXLGlHQUFpRyxlQUFlLDRHQUE0RywyQ0FBMkMsTUFBSSxXQUUzUixHQUNBLG9DQUFDLFNBQUksV0FBVSxhQUNiLG9DQUFDLE9BQUUsV0FBVSwyQ0FBd0MsOEJBQW9CLEdBQ3pFLG9DQUFDLE9BQUUsV0FBVSx5Q0FDVixlQUFlLHNEQUFpQyxzREFDbkQsQ0FDRixDQUNGLEdBRUEsb0NBQUMsU0FBSSxXQUFVLG9FQUNaLENBQUMsc0JBQXNCLENBQUMsZ0JBQ3ZCO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFLO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVCxXQUFVO0FBQUE7QUFBQSxJQUNWLG9DQUFDLGNBQUssV0FBRTtBQUFBLElBQ1Isb0NBQUMsY0FBSyxxQ0FBc0I7QUFBQSxFQUM5QixHQUdGO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFLO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVCxXQUFXLDRGQUE0RixlQUFlLHVEQUF1RCwyQ0FBMkM7QUFBQTtBQUFBLElBQ3hOLG9DQUFDLGNBQU0sZUFBZSw4QkFBZSwwQkFBYztBQUFBLEVBQ3JELEdBRUE7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLFNBQVM7QUFBQSxNQUNULFdBQVU7QUFBQTtBQUFBLElBQ1QsY0FBYyxnQkFBZ0IsSUFBSSxjQUFPO0FBQUEsRUFDNUMsR0FFQTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsTUFBSztBQUFBLE1BQ0wsS0FBSTtBQUFBLE1BQ0osS0FBSTtBQUFBLE1BQ0osTUFBSztBQUFBLE1BQ0wsT0FBTyxhQUFhLElBQUk7QUFBQSxNQUN4QixVQUFVO0FBQUEsTUFDVixXQUFVO0FBQUEsTUFDVixPQUFNO0FBQUE7QUFBQSxFQUNSLENBQ0YsQ0FDRixJQUVBLG9DQUFDLFNBQUksV0FBVSxvRUFDYixvQ0FBQyxPQUFFLFdBQVUsZ0NBQTZCLGlMQUUxQyxDQUNGLEdBR0QsTUFBTSxRQUNMLG9DQUFDLE9BQUUsV0FBVSxxREFDVixNQUFNLElBQ1QsQ0FFSjtBQUVKOyIsCiAgIm5hbWVzIjogW10KfQo=
