// GEN TU src/features/study.jsx — KHONG SUA TAY
const { useState, useEffect, useRef } = React;
import { dinhDangGiayPhut, idGoogleDrive, idYoutube, laVideoTrucTiepFe, napYouTubeIframeApi, urlMediaFe } from "../lib/helpers.js";
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
    const interval = setInterval(fetchNotes, 3e3);
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
    const interval = setInterval(fetchWb, 3e3);
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
    const interval = setInterval(fetchSheet, 3e3);
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
      const timer = setInterval(taiQueue, 4e3);
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
    const timer = setInterval(fetchWatch, 2500);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvc3R1ZHkuanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9ID0gUmVhY3Q7XG5pbXBvcnQgeyBkaW5oRGFuZ0dpYXlQaHV0LCBpZEdvb2dsZURyaXZlLCBpZFlvdXR1YmUsIGxhVmlkZW9UcnVjVGllcEZlLCBuYXBZb3VUdWJlSWZyYW1lQXBpLCB1cmxNZWRpYUZlIH0gZnJvbSAnLi4vbGliL2hlbHBlcnMuanMnO1xuXG5cbi8vIFx1MDBENCBuaFx1MUVBRHAgbGluayB0aFx1MDBFQW0gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgXHUyMDE0IGRcdTAwRjluZyBjaHVuZyBjaG8gU3R1ZHlEb2NrIHZcdTAwRTAgQ2FtcHVzV2F0Y2hUb2dldGhlclxuZXhwb3J0IGZ1bmN0aW9uIFF1ZXVlSW5wdXQoeyBvbkFkZCwgb25BZGROZXh0IH0pIHtcbiAgY29uc3QgW3YsIHNldFZdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBvayA9IHYudHJpbSgpLmxlbmd0aCA+IDA7XG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICA8aW5wdXRcbiAgICAgICAgaWQ9XCJpbnB1dC1xdWV1ZS1hZGRcIlxuICAgICAgICB0eXBlPVwidXJsXCJcbiAgICAgICAgdmFsdWU9e3Z9XG4gICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFYoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICBvbktleURvd249e2UgPT4geyBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgb2spIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBvbkFkZCh2LnRyaW0oKSk7IHNldFYoJycpOyB9IH19XG4gICAgICAgIHBsYWNlaG9sZGVyPVwiVGhcdTAwRUFtIGxpbmsgdmlkZW8gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcdTIwMjZcIlxuICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0yLjUgcHktMS41IHRleHQtWzExcHhdIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgIC8+XG4gICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBpZD1cImJ0bi1xdWV1ZS1hZGQtbmV4dFwiIGRpc2FibGVkPXshb2t9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHsgb25BZGROZXh0KHYudHJpbSgpKTsgc2V0VignJyk7IH19XG4gICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy12aW9sZXQtNTAwLzE1IHRleHQtdmlvbGV0LTMwMCBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLXZpb2xldC01MDAvMjUgZGlzYWJsZWQ6b3BhY2l0eS0zMCB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxuICAgICAgICArUGhcdTAwRTF0IGtcdTFFQkZcbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJidG4tcXVldWUtZW5xdWV1ZVwiIGRpc2FibGVkPXshb2t9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHsgb25BZGQodi50cmltKCkpOyBzZXRWKCcnKTsgfX1cbiAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctWyMwMEYyRkVdLzI1IGRpc2FibGVkOm9wYWNpdHktMzAgd2hpdGVzcGFjZS1ub3dyYXBcIj5cbiAgICAgICAgK0N1XHUxRUQxaSBoXHUwMEUwbmdcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgU1RVRFkgRE9DSzogS0hcdTAwRDRORyBHSUFOIENcdTFFRDhORyBUXHUwMEMxQyBQSFx1MDBEMk5HIFlPVVRVQkUgKFBIQVNFIDRGKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBmdW5jdGlvbiBTdHVkeURvY2soeyBwaG9uZywgcGhvbmdNaW5oS2hvYSwgYXV0aCwgcGhvbmdDaGF0ID0gW10sIG9uU2VuZFBob25nQ2hhdCwgb25Yb2FUaW5QaG9uZyxcbiAgbXlDYXBzID0ge30sIGlzU3RhZmYgPSBmYWxzZSwgdmFpVHJvUGhvbmcgPSAnbWVtYmVyJywgdGhhbmhWaWVuID0gW10sXG4gIHBvbGljaWVzID0gbnVsbCwgZ3JhbnRzID0gW10sIHZpZGVvVGltZVJlZiwgc2Vla1ZpZGVvLCBoYW5oRG9uZ1Bob25nLFxuICBjYW5Db250cm9sID0gZmFsc2UsIGRvbmdQaG9uZ0hpZW5UYWkgfSkge1xuICBjb25zdCBbZG9ja1RhYiwgc2V0RG9ja1RhYl0gPSBSZWFjdC51c2VTdGF0ZSgnY2hhdCcpOyAvLyAnY2hhdCcgfCAnbm90ZXMnIHwgJ3doaXRlYm9hcmQnIHwgJ3NoZWV0JyB8ICd2b2ljZScgfCAncXVhbi10cmknXG5cbiAgLy8gQ2FwYWJpbGl0eSBwaFx1MDBFRGEgY2xpZW50IGNoXHUxRUM5IFx1MDExMVx1MUVDMyBcdTFFQTluL2hpXHUxRUM3biBVSSBcdTIwMTQgbVx1MUVDRGkgcXV5XHUxRUMxbiB0aFx1MUVBRHQgZG8gc2VydmVyIHF1eVx1MUVCRnQuXG4gIGNvbnN0IGNvUXV5ZW4gPSAoY2FwKSA9PiBteUNhcHNbY2FwXSAhPT0gZmFsc2U7XG4gIGNvbnN0IGxheVZpVHJpVmlkZW8gPSAoKSA9PiBNYXRoLmZsb29yKHZpZGVvVGltZVJlZj8uY3VycmVudCB8fCAwKSB8fCBudWxsO1xuICAvLyBCXHUxRUE1bSBtXHUxRUQxYyB0aFx1MUVERGkgZ2lhbiBcdTIxOTIgZ1x1MUVFRGkgZXZlbnQgY2hvIENhbXB1c1dhdGNoVG9nZXRoZXIgeFx1MUVFRCBsXHUwMEZEXG4gIC8vIChjXHUwMEYzIHZpZGVvX2NvbnRyb2wgXHUyMTkyIHR1YSBjaHVuZyBjXHUxRUEzIHBoXHUwMEYybmc7IGtoXHUwMEY0bmcgXHUyMTkyIHR1YSBjXHUxRUU1YyBiXHUxRUQ5IHBsYXllciBjXHUxRUU3YSBtXHUwMEVDbmgpLlxuICBjb25zdCB5ZXVDYXVUdWEgPSAoc2VjKSA9PiB7XG4gICAgaWYgKHNlYyA9PSBudWxsIHx8ICEoc2VjID49IDApKSByZXR1cm47XG4gICAgaWYgKHNlZWtWaWRlbykgeyBzZWVrVmlkZW8oc2VjLCBteUNhcHMudmlkZW9fY29udHJvbCA9PT0gdHJ1ZSk7IHJldHVybjsgfVxuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnc3Itc2VlaycsIHsgZGV0YWlsOiB7IHBob25nSWQ6IHBob25nLmlkLCBzZWMgfSB9KSk7XG4gIH07XG5cbiAgLy8gMS4gUm9vbSBDaGF0IFN0YXRlXG4gIGNvbnN0IFtjaGF0SW5wdXQsIHNldENoYXRJbnB1dF0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtjaGF0U2VuZGluZywgc2V0Q2hhdFNlbmRpbmddID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBjaGF0Q29tcG9zaW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgY2hhdEVuZFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiID09PSAnY2hhdCcgJiYgY2hhdEVuZFJlZi5jdXJyZW50KSB7XG4gICAgICBjaGF0RW5kUmVmLmN1cnJlbnQuc2Nyb2xsSW50b1ZpZXcoeyBiZWhhdmlvcjogJ3Ntb290aCcgfSk7XG4gICAgfVxuICB9LCBbcGhvbmdDaGF0Lmxlbmd0aCwgZG9ja1RhYl0pO1xuXG4gIGNvbnN0IGhhbmRsZVNlbmRSb29tQ2hhdCA9IChlKSA9PiB7XG4gICAgZT8ucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCB0eHQgPSBjaGF0SW5wdXQudHJpbSgpO1xuICAgIGlmICghdHh0IHx8IGNoYXRTZW5kaW5nKSByZXR1cm47XG4gICAgc2V0Q2hhdElucHV0KCcnKTtcbiAgICBzZXRDaGF0U2VuZGluZyh0cnVlKTtcbiAgICBpZiAob25TZW5kUGhvbmdDaGF0KSB7XG4gICAgICBQcm9taXNlLnJlc29sdmUob25TZW5kUGhvbmdDaGF0KHR4dCkpLmNhdGNoKCgpID0+IHtcbiAgICAgICAgc2V0Q2hhdElucHV0KGN1ciA9PiBjdXIgPyBjdXIgOiB0eHQpO1xuICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgIHNldENoYXRTZW5kaW5nKGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRDaGF0U2VuZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIDIuIFNoYXJlZCBOb3RlcyBcdTIwMTQgZW50cnkgYXBwZW5kIChtXHUxRUQ3aSBuZ1x1MDFCMFx1MUVERGkgdGhcdTAwRUFtIGdoaSBjaFx1MDBGQSByaVx1MDBFQW5nLCBraFx1MDBGNG5nIGdoaSBcdTAxMTFcdTAwRTggbmhhdSlcbiAgY29uc3QgW25vdGVzTGlzdCwgc2V0Tm90ZXNMaXN0XSA9IFJlYWN0LnVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW25vdGVJbnB1dCwgc2V0Tm90ZUlucHV0XSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW25vdGVXaXRoVGltZSwgc2V0Tm90ZVdpdGhUaW1lXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBbbm90ZXNDYW5Xcml0ZSwgc2V0Tm90ZXNDYW5Xcml0ZV0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW25vdGVzTm90aWNlLCBzZXROb3Rlc05vdGljZV0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IG5vdGVzVmVyc2lvblJlZiA9IFJlYWN0LnVzZVJlZigwKTtcbiAgY29uc3Qgbm90ZUNvbXBvc2luZ1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiAhPT0gJ25vdGVzJykgcmV0dXJuO1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoTm90ZXMgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT1ub3Rlc2ApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBkLm9rKSB7XG4gICAgICAgICAgc2V0Tm90ZXNMaXN0KEFycmF5LmlzQXJyYXkoZC5wYXlsb2FkPy5ub3RlcykgPyBkLnBheWxvYWQubm90ZXMgOiBbXSk7XG4gICAgICAgICAgbm90ZXNWZXJzaW9uUmVmLmN1cnJlbnQgPSBkLnZlcnNpb24gfHwgMDtcbiAgICAgICAgICBzZXROb3Rlc0NhbldyaXRlKGQuY2FuV3JpdGUgIT09IGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RpdmUgJiYgZC5jb2RlID09PSAnY2FwYWJpbGl0eV9vZmYnKSB7XG4gICAgICAgICAgc2V0Tm90ZXNDYW5Xcml0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIGZldGNoTm90ZXMoKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGZldGNoTm90ZXMsIDMwMDApO1xuICAgIHJldHVybiAoKSA9PiB7IGFjdGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludGVydmFsKTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiXSk7XG5cbiAgY29uc3QgdGhlbUdoaUNodSA9IGFzeW5jICgpID0+IHtcbiAgICBjb25zdCB0ZXh0ID0gbm90ZUlucHV0LnRyaW0oKTtcbiAgICBpZiAoIXRleHQpIHJldHVybjtcbiAgICBzZXROb3Rlc05vdGljZSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgcmVzb3VyY2U6ICdub3RlcycsXG4gICAgICAgICAgcGF5bG9hZDogeyB0ZXh0LCB2aWRlb1RpbWVTZWM6IG5vdGVXaXRoVGltZSA/IGxheVZpVHJpVmlkZW8oKSA6IG51bGwgfVxuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSB7XG4gICAgICAgIHNldE5vdGVJbnB1dCgnJyk7XG4gICAgICAgIHNldE5vdGVzTGlzdChwcmV2ID0+IFsuLi5wcmV2LCB7IGlkOiBkLmlkLCB0ZW46IGF1dGgudXNlcj8udGVuIHx8ICdCXHUxRUExbicsIG5vaUR1bmc6IHRleHQsIHZpZGVvVGltZVNlYzogbm90ZVdpdGhUaW1lID8gbGF5VmlUcmlWaWRlbygpIDogbnVsbCwgY3VhVG9pOiAxIH1dKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldE5vdGVzTm90aWNlKGQubG9pIHx8ICdLaFx1MDBGNG5nIGxcdTAxQjB1IFx1MDExMVx1MDFCMFx1MUVFM2MgZ2hpIGNoXHUwMEZBLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggeyBzZXROb3Rlc05vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkuJyk7IH1cbiAgfTtcblxuICBjb25zdCB4b2FHaGlDaHUgPSBhc3luYyAoaWQpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIHJlc291cmNlOiAnbm90ZXMnLCBhY3Rpb246ICd4b2Ffbm90ZScsIGlkIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHNldE5vdGVzTGlzdChwcmV2ID0+IHByZXYuZmlsdGVyKG4gPT4gbi5pZCAhPT0gaWQpKTtcbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gMy4gU2hhcmVkIFdoaXRlYm9hcmQgU3RhdGVcbiAgY29uc3QgY2FudmFzUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBbd2JTdHJva2VzLCBzZXRXYlN0cm9rZXNdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbd2JDb2xvciwgc2V0V2JDb2xvcl0gPSBSZWFjdC51c2VTdGF0ZSgnIzAwRjJGRScpO1xuICBjb25zdCBbd2JXaWR0aCwgc2V0V2JXaWR0aF0gPSBSZWFjdC51c2VTdGF0ZSgzKTtcbiAgY29uc3QgW3diVG9vbCwgc2V0V2JUb29sXSA9IFJlYWN0LnVzZVN0YXRlKCdwZW4nKTtcbiAgY29uc3QgaXNEcmF3aW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgY3VycmVudFN0cm9rZVJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgd2JWZXJzaW9uUmVmID0gUmVhY3QudXNlUmVmKDApO1xuXG4gIGNvbnN0IHJlZHJhd0NhbnZhcyA9IFJlYWN0LnVzZUNhbGxiYWNrKChzdHJva2VzKSA9PiB7XG4gICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFjYW52YXMpIHJldHVybjtcbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgc3Ryb2tlcy5mb3JFYWNoKHMgPT4ge1xuICAgICAgaWYgKCFzLnBvaW50cyB8fCBzLnBvaW50cy5sZW5ndGggPCAyKSByZXR1cm47XG4gICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzLnRvb2wgPT09ICdlcmFzZXInID8gJyMwQjBFMTQnIDogKHMuY29sb3IgfHwgJyMwMEYyRkUnKTtcbiAgICAgIGN0eC5saW5lV2lkdGggPSBzLndpZHRoIHx8IDM7XG4gICAgICBjdHgubGluZUNhcCA9ICdyb3VuZCc7XG4gICAgICBjdHgubGluZUpvaW4gPSAncm91bmQnO1xuICAgICAgY3R4Lm1vdmVUbyhzLnBvaW50c1swXS54LCBzLnBvaW50c1swXS55KTtcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcy5wb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3R4LmxpbmVUbyhzLnBvaW50c1tpXS54LCBzLnBvaW50c1tpXS55KTtcbiAgICAgIH1cbiAgICAgIGN0eC5zdHJva2UoKTtcbiAgICB9KTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IFt3YkNhbldyaXRlLCBzZXRXYkNhbldyaXRlXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpO1xuXG4gIC8vIFx1MDBDMXAgMSBvcCB2XHUwMEUwbyBtXHUxRUEzbmcgc3Ryb2tlcyAocmVwbGF5IGFwcGVuZC1vbmx5KTogJ3N0cm9rZScgdGhcdTAwRUFtIG5cdTAwRTl0LCAnY2xlYXInIHhvXHUwMEUxIHNcdTFFQTFjaC5cbiAgY29uc3QgYXBEdW5nT3AgPSAoc3Ryb2tlcywgb3ApID0+IHtcbiAgICBpZiAob3AudHlwZSA9PT0gJ2NsZWFyJykgcmV0dXJuIFtdO1xuICAgIGlmIChvcC50eXBlID09PSAnc3Ryb2tlJyAmJiBvcC5zdHJva2UpIHJldHVybiBbLi4uc3Ryb2tlcywgb3Auc3Ryb2tlXTtcbiAgICByZXR1cm4gc3Ryb2tlcztcbiAgfTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAnd2hpdGVib2FyZCcpIHJldHVybjtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaFdiID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mcmVzb3VyY2U9d2hpdGVib2FyZCZzYXVJZD0ke3diVmVyc2lvblJlZi5jdXJyZW50fWApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBkLm9rKSB7XG4gICAgICAgICAgY29uc3Qgb3BzID0gQXJyYXkuaXNBcnJheShkLnBheWxvYWQ/Lm9wcykgPyBkLnBheWxvYWQub3BzIDogW107XG4gICAgICAgICAgaWYgKG9wcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIE5cdTFFQkZ1IGNcdTAwRjMgb3AgJ2NsZWFyJyB0cm9uZyBsb1x1MUVBMXQgbVx1MUVEQmkgXHUyMTkyIGJ1aWxkIGxcdTFFQTFpIHRcdTFFRUIgXHUwMTExXHUxRUE3dSBjaG8gY2hcdTFFQUZjXG4gICAgICAgICAgICBpZiAob3BzLnNvbWUobyA9PiBvLnR5cGUgPT09ICdjbGVhcicpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGZ1bGwgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT13aGl0ZWJvYXJkJnNhdUlkPTBgKTtcbiAgICAgICAgICAgICAgY29uc3QgZGYgPSBhd2FpdCBmdWxsLmpzb24oKTtcbiAgICAgICAgICAgICAgaWYgKGFjdGl2ZSAmJiBkZi5vaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbE9wcyA9IEFycmF5LmlzQXJyYXkoZGYucGF5bG9hZD8ub3BzKSA/IGRmLnBheWxvYWQub3BzIDogW107XG4gICAgICAgICAgICAgICAgY29uc3QgcmVidWlsdCA9IGFsbE9wcy5yZWR1Y2UoYXBEdW5nT3AsIFtdKTtcbiAgICAgICAgICAgICAgICBzZXRXYlN0cm9rZXMocmVidWlsdCk7XG4gICAgICAgICAgICAgICAgcmVkcmF3Q2FudmFzKHJlYnVpbHQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzZXRXYlN0cm9rZXMocHJldiA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dCA9IG9wcy5yZWR1Y2UoYXBEdW5nT3AsIHByZXYpO1xuICAgICAgICAgICAgICAgIHJlZHJhd0NhbnZhcyhuZXh0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHdiVmVyc2lvblJlZi5jdXJyZW50ID0gZC52ZXJzaW9uIHx8IDA7XG4gICAgICAgICAgc2V0V2JDYW5Xcml0ZShkLmNhbldyaXRlICE9PSBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aXZlICYmIGQuY29kZSA9PT0gJ2NhcGFiaWxpdHlfb2ZmJykge1xuICAgICAgICAgIHNldFdiQ2FuV3JpdGUoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfTtcbiAgICBmZXRjaFdiKCk7XG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmZXRjaFdiLCAzMDAwKTtcbiAgICByZXR1cm4gKCkgPT4geyBhY3RpdmUgPSBmYWxzZTsgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7IH07XG4gIH0sIFtwaG9uZy5pZCwgZG9ja1RhYiwgcmVkcmF3Q2FudmFzXSk7XG5cbiAgY29uc3Qgc3RhcnREcmF3aW5nID0gKGUpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICBpZiAoIWNhbnZhcykgcmV0dXJuO1xuICAgIGNvbnN0IHJlY3QgPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgY2xpZW50WCA9IGUuY2xpZW50WCA/PyAoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXT8uY2xpZW50WCk7XG4gICAgY29uc3QgY2xpZW50WSA9IGUuY2xpZW50WSA/PyAoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXT8uY2xpZW50WSk7XG4gICAgY29uc3QgeCA9IGNsaWVudFggLSByZWN0LmxlZnQ7XG4gICAgY29uc3QgeSA9IGNsaWVudFkgLSByZWN0LnRvcDtcbiAgICBpc0RyYXdpbmdSZWYuY3VycmVudCA9IHRydWU7XG4gICAgY3VycmVudFN0cm9rZVJlZi5jdXJyZW50ID0ge1xuICAgICAgdG9vbDogd2JUb29sLFxuICAgICAgY29sb3I6IHdiQ29sb3IsXG4gICAgICB3aWR0aDogd2JUb29sID09PSAnZXJhc2VyJyA/IDE2IDogd2JXaWR0aCxcbiAgICAgIHBvaW50czogW3sgeCwgeSB9XVxuICAgIH07XG4gIH07XG5cbiAgY29uc3QgZHJhd01vdmUgPSAoZSkgPT4ge1xuICAgIGlmICghaXNEcmF3aW5nUmVmLmN1cnJlbnQgfHwgIWN1cnJlbnRTdHJva2VSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgIGlmICghY2FudmFzKSByZXR1cm47XG4gICAgY29uc3QgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBjbGllbnRYID0gZS5jbGllbnRYID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRYKTtcbiAgICBjb25zdCBjbGllbnRZID0gZS5jbGllbnRZID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRZKTtcbiAgICBjb25zdCB4ID0gY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICBjb25zdCB5ID0gY2xpZW50WSAtIHJlY3QudG9wO1xuICAgIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5wb2ludHMucHVzaCh7IHgsIHkgfSk7XG4gICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC50b29sID09PSAnZXJhc2VyJyA/ICcjMEIwRTE0JyA6IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5jb2xvcjtcbiAgICBjdHgubGluZVdpZHRoID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LndpZHRoO1xuICAgIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcbiAgICBjdHgubGluZUpvaW4gPSAncm91bmQnO1xuICAgIGNvbnN0IHB0cyA9IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5wb2ludHM7XG4gICAgaWYgKHB0cy5sZW5ndGggPj0gMikge1xuICAgICAgY3R4Lm1vdmVUbyhwdHNbcHRzLmxlbmd0aCAtIDJdLngsIHB0c1twdHMubGVuZ3RoIC0gMl0ueSk7XG4gICAgICBjdHgubGluZVRvKHB0c1twdHMubGVuZ3RoIC0gMV0ueCwgcHRzW3B0cy5sZW5ndGggLSAxXS55KTtcbiAgICAgIGN0eC5zdHJva2UoKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgc3RvcERyYXdpbmcgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFpc0RyYXdpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGlzRHJhd2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRTdHJva2VSZWYuY3VycmVudCAmJiBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQucG9pbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNvbnN0IHN0cm9rZSA9IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudDtcbiAgICAgIGNvbnN0IG5leHRTdHJva2VzID0gWy4uLndiU3Ryb2tlcywgc3Ryb2tlXTtcbiAgICAgIHNldFdiU3Ryb2tlcyhuZXh0U3Ryb2tlcyk7XG4gICAgICBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgICAgcmVzb3VyY2U6ICd3aGl0ZWJvYXJkJyxcbiAgICAgICAgICAgIHBheWxvYWQ6IHsgdHlwZTogJ3N0cm9rZScsIHN0cm9rZSB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoZC5vayAmJiBkLmlkKSB3YlZlcnNpb25SZWYuY3VycmVudCA9IE1hdGgubWF4KHdiVmVyc2lvblJlZi5jdXJyZW50LCBkLmlkKTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9XG4gIH07XG5cbiAgY29uc3QgY2xlYXJXaGl0ZWJvYXJkID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghY29uZmlybSgnQlx1MUVBMW4gY1x1MDBGMyBjaFx1MUVBRmMgbXVcdTFFRDFuIHhcdTAwRjNhIHNcdTFFQTFjaCBiXHUxRUEzbmcgdlx1MUVCRD8gKGNoXHUxRUM5IHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nKScpKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgcmVzb3VyY2U6ICd3aGl0ZWJvYXJkJyxcbiAgICAgICAgICBwYXlsb2FkOiB7IHR5cGU6ICdjbGVhcicgfVxuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSB7XG4gICAgICAgIHNldFdiU3Ryb2tlcyhbXSk7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgICAgICBpZiAoY2FudmFzKSB7XG4gICAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIC8vIDQuIFNoYXJlZCBTaGVldCBTdGF0ZSAoOCBjb2xzIHggMTAgcm93cykgXHUyMDE0IHVwc2VydCB0XHUxRUVCbmcgXHUwMEY0LCBraFx1MDBGNG5nIHdob2xlLWRvYyBjb25mbGljdFxuICBjb25zdCBDT0xTID0gWydBJywgJ0InLCAnQycsICdEJywgJ0UnLCAnRicsICdHJywgJ0gnXTtcbiAgY29uc3QgUk9XUyA9IFsxLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCA5LCAxMF07XG4gIGNvbnN0IFtzaGVldENlbGxzLCBzZXRTaGVldENlbGxzXSA9IFJlYWN0LnVzZVN0YXRlKHt9KTtcbiAgY29uc3QgW3NoZWV0Q2FuV3JpdGUsIHNldFNoZWV0Q2FuV3JpdGVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IHNoZWV0U2F2ZVRpbWVyc1JlZiA9IFJlYWN0LnVzZVJlZih7fSk7XG4gIGNvbnN0IHNoZWV0Rm9jdXNlZENlbGxSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHNoZWV0UG9sbFJlZiA9IFJlYWN0LnVzZVJlZigwKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAnc2hlZXQnKSByZXR1cm47XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG4gICAgY29uc3QgZmV0Y2hTaGVldCA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPXNoZWV0YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2spIHtcbiAgICAgICAgICBjb25zdCBpbmNvbWluZyA9IGQucGF5bG9hZD8uY2VsbHMgfHwge307XG4gICAgICAgICAgLy8gS2hcdTAwRjRuZyBnaGkgXHUwMTExXHUwMEU4IFx1MDBGNCBcdTAxMTFhbmcgZ1x1MDBGNSBkXHUxRURGXG4gICAgICAgICAgc2V0U2hlZXRDZWxscyhwcmV2ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IHsgLi4uaW5jb21pbmcgfTtcbiAgICAgICAgICAgIGNvbnN0IGRhbmdHbyA9IHNoZWV0Rm9jdXNlZENlbGxSZWYuY3VycmVudDtcbiAgICAgICAgICAgIGlmIChkYW5nR28gJiYgcHJldltkYW5nR29dICE9PSB1bmRlZmluZWQpIG1lcmdlZFtkYW5nR29dID0gcHJldltkYW5nR29dO1xuICAgICAgICAgICAgcmV0dXJuIG1lcmdlZDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzZXRTaGVldENhbldyaXRlKGQuY2FuV3JpdGUgIT09IGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RpdmUgJiYgZC5jb2RlID09PSAnY2FwYWJpbGl0eV9vZmYnKSB7XG4gICAgICAgICAgc2V0U2hlZXRDYW5Xcml0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIGZldGNoU2hlZXQoKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGZldGNoU2hlZXQsIDMwMDApO1xuICAgIHJldHVybiAoKSA9PiB7IGFjdGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludGVydmFsKTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2VsbENoYW5nZSA9IChjZWxsS2V5LCB2YWwpID0+IHtcbiAgICBzZXRTaGVldENlbGxzKHByZXYgPT4gKHsgLi4ucHJldiwgW2NlbGxLZXldOiB2YWwgfSkpO1xuICAgIGNvbnN0IHRpbWVycyA9IHNoZWV0U2F2ZVRpbWVyc1JlZi5jdXJyZW50O1xuICAgIGlmICh0aW1lcnNbY2VsbEtleV0pIGNsZWFyVGltZW91dCh0aW1lcnNbY2VsbEtleV0pO1xuICAgIHRpbWVyc1tjZWxsS2V5XSA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgICAgcmVzb3VyY2U6ICdzaGVldCcsXG4gICAgICAgICAgICBwYXlsb2FkOiB7IGNlbGw6IGNlbGxLZXksIHZhbHVlOiB2YWwgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH0sIDgwMCk7XG4gIH07XG5cbiAgLy8gNS4gMS10by0xIFdlYlJUQyBWb2ljZSBDaGF0IFx1MjAxNCBwYWlyLWJvdW5kICh0XHUxRUQxaSBcdTAxMTFhIDEgY1x1MUVCN3AvcGhcdTAwRjJuZywgc2lnbmFsaW5nIHJpXHUwMEVBbmcgdFx1MDFCMClcbiAgY29uc3QgW3ZvaWNlSm9pbmVkLCBzZXRWb2ljZUpvaW5lZF0gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFttaWNNdXRlZCwgc2V0TWljTXV0ZWRdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7IC8vIERlZmF1bHQgT0ZGXG4gIGNvbnN0IFt2b2ljZVN0YXRlLCBzZXRWb2ljZVN0YXRlXSA9IFJlYWN0LnVzZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgY29uc3QgW3ZvaWNlTm90aWNlLCBzZXRWb2ljZU5vdGljZV0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFt2b2ljZVBhaXIsIHNldFZvaWNlUGFpcl0gPSBSZWFjdC51c2VTdGF0ZShudWxsKTsgICAgICAgLy8ge2FjdGl2ZSwgYVRlbiwgYlRlbiwgeW91SW4sIHNsb3R9XG4gIGNvbnN0IFt2b2ljZVJlcXVlc3RlZCwgc2V0Vm9pY2VSZXF1ZXN0ZWRdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbeWV1Q2F1Vm9pY2UsIHNldFlldUNhdVZvaWNlXSA9IFJlYWN0LnVzZVN0YXRlKFtdKTsgICAgIC8vIHN0YWZmOiBkYW5oIHNcdTAwRTFjaCB4aW4gcXV5XHUxRUMxblxuICBjb25zdCBwY1JlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgbG9jYWxTdHJlYW1SZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHJlbW90ZUF1ZGlvUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBsYXN0U2lnbmFsSWRSZWYgPSBSZWFjdC51c2VSZWYoMCk7XG4gIGNvbnN0IHZvaWNlUG9sbFRpbWVyUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB2b2ljZVNsb3RSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHZvaWNlSm9pbmVkUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgcGVuZGluZ0NhbmRpZGF0ZXNSZWYgPSBSZWFjdC51c2VSZWYoW10pO1xuICB2b2ljZUpvaW5lZFJlZi5jdXJyZW50ID0gdm9pY2VKb2luZWQ7XG5cbiAgY29uc3QgZHVuZ0tldE5vaVZvaWNlID0gKCkgPT4ge1xuICAgIGlmIChsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldFRyYWNrcygpLmZvckVhY2godCA9PiB0LnN0b3AoKSk7XG4gICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHBjUmVmLmN1cnJlbnQpIHtcbiAgICAgIHBjUmVmLmN1cnJlbnQuY2xvc2UoKTtcbiAgICAgIHBjUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIH1cbiAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50ID0gW107XG4gICAgc2V0TWljTXV0ZWQodHJ1ZSk7XG4gIH07XG5cbiAgLy8gUG9sbCB0clx1MUVBMW5nIHRoXHUwMEUxaSBjXHUxRUI3cCArIHRcdTAwRURuIGhpXHUxRUM3dSBjXHUxRUU3YSBwYXJ0bmVyIChzZXJ2ZXIgY2hcdTFFQzkgdHJcdTFFQTMgc2lnbmFsIGNcdTFFRTdhIG5nXHUwMUIwXHUxRUREaSB0cm9uZyBjXHUxRUI3cCkuXG4gIGNvbnN0IHBvbGxWb2ljZSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mYWN0aW9uPXZvaWNlX3BvbGwmc2F1SWQ9JHtsYXN0U2lnbmFsSWRSZWYuY3VycmVudH1gKTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSByZXR1cm47XG4gICAgICBpZiAoZC5wYWlyKSBzZXRWb2ljZVBhaXIoZC5wYWlyKTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGQueWV1Q2F1Vm9pY2UpKSBzZXRZZXVDYXVWb2ljZShkLnlldUNhdVZvaWNlKTtcbiAgICAgIGNvbnN0IHBjID0gcGNSZWYuY3VycmVudDtcbiAgICAgIGlmICghdm9pY2VKb2luZWRSZWYuY3VycmVudCB8fCAhcGMpIHJldHVybjtcbiAgICAgIGZvciAoY29uc3Qgc2lnIG9mIGQuc2lnbmFscyB8fCBbXSkge1xuICAgICAgICBsYXN0U2lnbmFsSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KGxhc3RTaWduYWxJZFJlZi5jdXJyZW50LCBzaWcuaWQpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ29mZmVyJykge1xuICAgICAgICAgICAgLy8gT2ZmZXIgbVx1MUVEQmkgaG9cdTFFQjdjIHJlLW9mZmVyIChcdTAxMTFcdTFFRDFpIHBoXHUwMUIwXHUwMUExbmcgYlx1MUVBRHQgbWljIG11XHUxRUQ5bikgXHUwMTExXHUxRUMxdSBzZXQgbFx1MUVBMWkgcmVtb3RlICsgdHJcdTFFQTMgYW5zd2VyLlxuICAgICAgICAgICAgYXdhaXQgcGMuc2V0UmVtb3RlRGVzY3JpcHRpb24obmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbihzaWcucGF5bG9hZCkpO1xuICAgICAgICAgICAgLy8gWFx1MUVBMyBjXHUwMEUxYyBjYW5kaWRhdGUgdFx1MUVEQmkgc1x1MUVEQm0gdHJcdTAxQjBcdTFFREJjIGtoaSBjXHUwMEYzIHJlbW90ZURlc2NyaXB0aW9uLlxuICAgICAgICAgICAgZm9yIChjb25zdCBjIG9mIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuYWRkSWNlQ2FuZGlkYXRlKG5ldyBSVENJY2VDYW5kaWRhdGUoYykpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGFucyA9IGF3YWl0IHBjLmNyZWF0ZUFuc3dlcigpO1xuICAgICAgICAgICAgYXdhaXQgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihhbnMpO1xuICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdhbnN3ZXInLCBwYXlsb2FkOiBhbnMgfSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdhbnN3ZXInKSB7XG4gICAgICAgICAgICBpZiAocGMuc2lnbmFsaW5nU3RhdGUgPT09ICdoYXZlLWxvY2FsLW9mZmVyJykge1xuICAgICAgICAgICAgICBhd2FpdCBwYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKHNpZy5wYXlsb2FkKSk7XG4gICAgICAgICAgICAgIGZvciAoY29uc3QgYyBvZiBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGMuYWRkSWNlQ2FuZGlkYXRlKG5ldyBSVENJY2VDYW5kaWRhdGUoYykpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50ID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ2NhbmRpZGF0ZScpIHtcbiAgICAgICAgICAgIGlmIChwYy5yZW1vdGVEZXNjcmlwdGlvbikge1xuICAgICAgICAgICAgICBhd2FpdCBwYy5hZGRJY2VDYW5kaWRhdGUobmV3IFJUQ0ljZUNhbmRpZGF0ZShzaWcucGF5bG9hZCkpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQucHVzaChzaWcucGF5bG9hZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ2xlYXZlJykge1xuICAgICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ05nXHUwMUIwXHUxRUREaSBraWEgXHUwMTExXHUwMEUzIG5nXHUxRUFGdCB2b2ljZS4nKTtcbiAgICAgICAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgZHVuZ0tldE5vaVZvaWNlKCk7XG4gICAgICAgICAgICBzZXRWb2ljZUpvaW5lZChmYWxzZSk7XG4gICAgICAgICAgICB2b2ljZVNsb3RSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgc2lnbmFsIGxcdTFFRDdpICovIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gUG9sbCBjaFx1MUVBMXkga2hpIHRhYiB2b2ljZSBtXHUxRURGICh4ZW0gdHJcdTFFQTFuZyB0aFx1MDBFMWkgY1x1MUVCN3ApIGhvXHUxRUI3YyBcdTAxMTFhbmcgdHJvbmcgY1x1MUVCN3AuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICd2b2ljZScgJiYgIXZvaWNlSm9pbmVkKSByZXR1cm47XG4gICAgcG9sbFZvaWNlKCk7XG4gICAgdm9pY2VQb2xsVGltZXJSZWYuY3VycmVudCA9IHNldEludGVydmFsKHBvbGxWb2ljZSwgMTUwMCk7XG4gICAgcmV0dXJuICgpID0+IHsgaWYgKHZvaWNlUG9sbFRpbWVyUmVmLmN1cnJlbnQpIGNsZWFySW50ZXJ2YWwodm9pY2VQb2xsVGltZXJSZWYuY3VycmVudCk7IH07XG4gIH0sIFtwaG9uZy5pZCwgZG9ja1RhYiwgdm9pY2VKb2luZWRdKTtcblxuICBjb25zdCBqb2luVm9pY2UgPSBhc3luYyAoKSA9PiB7XG4gICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMGFuZyB4aW4gY2hcdTFFRDcgdHJvbmcgY1x1MUVCN3Agdm9pY2UuLi4nKTtcbiAgICBzZXRWb2ljZVN0YXRlKCdjb25uZWN0aW5nJyk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIDEuIEdpXHUwMEUwbmggc2xvdCB0clx1MDBFQW4gc2VydmVyIHRyXHUwMUIwXHUxRURCYyAoc2VydmVyLWF1dGhvcml0YXRpdmU6IHRcdTFFRDFpIFx1MDExMWEgMSBjXHUxRUI3cCAxLTEvcGhcdTAwRjJuZylcbiAgICAgIGNvbnN0IGpvaW5SZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfam9pbicgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgam9pbkRhdGEgPSBhd2FpdCBqb2luUmVzLmpzb24oKTtcbiAgICAgIGlmICgham9pbkRhdGEub2spIHtcbiAgICAgICAgaWYgKGpvaW5EYXRhLmNvZGUgPT09ICdncmFudF9yZXF1aXJlZCcpIHtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnQlx1MUVBMW4gY1x1MUVBN24gXHUwMTExXHUwMUIwXHUxRUUzYyBjXHUxRUE1cCBxdXlcdTFFQzFuIHZvaWNlIFx1MjAxNCBoXHUwMEUzeSBiXHUxRUE1bSBcIlhpbiBxdXlcdTFFQzFuIHZvaWNlXCIuJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2Uoam9pbkRhdGEubG9pIHx8ICdLaFx1MDBGNG5nIHRoXHUxRUMzIHRoYW0gZ2lhIHZvaWNlLicpO1xuICAgICAgICB9XG4gICAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2b2ljZVNsb3RSZWYuY3VycmVudCA9IGpvaW5EYXRhLnNsb3Q7XG4gICAgICBzZXRWb2ljZUpvaW5lZCh0cnVlKTtcblxuICAgICAgLy8gMi4gWGluIG1pYyBUUlx1MDFBRlx1MUVEQUMga2hpIHRcdTFFQTFvIG9mZmVyIFx1MjAxNCB0cmFjayBwaFx1MUVBM2kgY1x1MDBGMyBzXHUxRUI1biB0cm9uZyBTRFAgbmVnb3RpYXRpb24sXG4gICAgICAvLyAgICBhZGRUcmFjayBzYXUga2hpIFx1MDExMVx1MDBFMyBiXHUxRUFGdCB0YXkgbVx1MDBFMCBraFx1MDBGNG5nIHJlbmVnb3RpYXRlIFx1MjE5MiBuZ1x1MDFCMFx1MUVERGkga2lhIGtoXHUwMEY0bmcgbmdoZSBcdTAxMTFcdTAxQjBcdTFFRTNjLlxuICAgICAgLy8gICAgTWljIGtoXHUxRURGaSBcdTAxMTFcdTFFQTd1IG11dGVkIChlbmFibGVkPWZhbHNlKSBcdTIwMTQgdXNlciB0XHUxRUYxIGJcdTFFQUR0IGJcdTFFQjFuZyBuXHUwMEZBdCBNaWMuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7IGF1ZGlvOiB0cnVlLCB2aWRlbzogZmFsc2UgfSk7XG4gICAgICAgIHN0cmVhbS5nZXRBdWRpb1RyYWNrcygpLmZvckVhY2godCA9PiB7IHQuZW5hYmxlZCA9IGZhbHNlOyB9KTtcbiAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudCA9IHN0cmVhbTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnS2hcdTAwRjRuZyB4aW4gXHUwMTExXHUwMUIwXHUxRUUzYyBtaWNybyBcdTIwMTQgYlx1MUVBMW4gY2hcdTFFQzkgbmdoZSBcdTAxMTFcdTAxQjBcdTFFRTNjLCBraFx1MDBGNG5nIG5cdTAwRjNpIFx1MDExMVx1MDFCMFx1MUVFM2MuJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIDMuIFRcdTFFQTFvIHBlZXIgY29ubmVjdGlvblxuICAgICAgY29uc3QgcGMgPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oe1xuICAgICAgICBpY2VTZXJ2ZXJzOiBbeyB1cmxzOiAnc3R1bjpzdHVuLmwuZ29vZ2xlLmNvbToxOTMwMicgfV1cbiAgICAgIH0pO1xuICAgICAgcGNSZWYuY3VycmVudCA9IHBjO1xuICAgICAgaWYgKGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRUcmFja3MoKS5mb3JFYWNoKHQgPT4gcGMuYWRkVHJhY2sodCwgbG9jYWxTdHJlYW1SZWYuY3VycmVudCkpO1xuICAgICAgfVxuXG4gICAgICBwYy5vbmljZWNhbmRpZGF0ZSA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQuY2FuZGlkYXRlKSB7XG4gICAgICAgICAgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsXG4gICAgICAgICAgICAgIHNpZ25hbFR5cGU6ICdjYW5kaWRhdGUnLFxuICAgICAgICAgICAgICBwYXlsb2FkOiBldmVudC5jYW5kaWRhdGVcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBwYy5vbnRyYWNrID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChyZW1vdGVBdWRpb1JlZi5jdXJyZW50ICYmIGV2ZW50LnN0cmVhbXNbMF0pIHtcbiAgICAgICAgICByZW1vdGVBdWRpb1JlZi5jdXJyZW50LnNyY09iamVjdCA9IGV2ZW50LnN0cmVhbXNbMF07XG4gICAgICAgICAgcmVtb3RlQXVkaW9SZWYuY3VycmVudC5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBwYy5vbmNvbm5lY3Rpb25zdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgcyA9IHBjLmNvbm5lY3Rpb25TdGF0ZTtcbiAgICAgICAgaWYgKHMgPT09ICdjb25uZWN0ZWQnKSB7XG4gICAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnY29ubmVjdGVkJyk7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MjcxMyBcdTAxMTBhbmcga1x1MUVCRnQgblx1MUVEMWkgdGhvXHUxRUExaSAxLTEgdHJcdTFFRjFjIHRpXHUxRUJGcC4nKTtcbiAgICAgICAgfSBlbHNlIGlmIChzID09PSAnZmFpbGVkJyB8fCBzID09PSAnZGlzY29ubmVjdGVkJykge1xuICAgICAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSB0aG9cdTFFQTFpIChtXHUxRUExbmcgY2hcdTFFQjduIFAyUCBuXHUxRUJGdSBraFx1MDBGNG5nIGNcdTAwRjMgVFVSTikuJyk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIDQuIFNsb3QgJ2InIChuZ1x1MDFCMFx1MUVERGkgdlx1MDBFMG8gc2F1KSB0XHUxRUExbyBvZmZlcjsgc2xvdCAnYScgY2hcdTFFREQgb2ZmZXIgdFx1MUVFQiBwb2xsLlxuICAgICAgaWYgKGpvaW5EYXRhLnNsb3QgPT09ICdiJykge1xuICAgICAgICBjb25zdCBvZmZlciA9IGF3YWl0IHBjLmNyZWF0ZU9mZmVyKCk7XG4gICAgICAgIGF3YWl0IHBjLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpO1xuICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ29mZmVyJywgcGF5bG9hZDogb2ZmZXIgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBcdTAwRTMgdlx1MDBFMG8gY1x1MUVCN3AgXHUyMDE0IFx1MDExMWFuZyBiXHUxRUFGdCB0YXkgdlx1MUVEQmkgJyArICh2b2ljZVBhaXI/LmFUZW4gfHwgJ25nXHUwMUIwXHUxRUREaSBraWEnKSArICdcdTIwMjYnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdCXHUxRUExbiBsXHUwMEUwIG5nXHUwMUIwXHUxRUREaSBcdTAxMTFcdTFFQTd1IHRpXHUwMEVBbiBcdTIwMTQgY2hcdTFFREQgdGhcdTAwRUFtIDEgbmdcdTAxQjBcdTFFRERpIHZcdTAwRTBvIHZvaWNlXHUyMDI2Jyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBzZXRWb2ljZU5vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkgdm9pY2U6ICcgKyBlcnIubWVzc2FnZSk7XG4gICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgeGluUXV5ZW5Wb2ljZSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3JlcXVlc3QnIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgZC5ncmFudGVkKSB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdCXHUxRUExbiBcdTAxMTFcdTAwRTMgXHUwMTExXHUwMUIwXHUxRUUzYyBwaFx1MDBFOXAgdm9pY2UgXHUyMDE0IGJcdTFFQTVtIFRoYW0gZ2lhLicpO1xuICAgICAgfSBlbHNlIGlmIChkLm9rKSB7XG4gICAgICAgIHNldFZvaWNlUmVxdWVzdGVkKHRydWUpO1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwXHUwMEUzIGdcdTFFRURpIHlcdTAwRUF1IGNcdTFFQTd1IFx1MjAxNCBjaFx1MUVERCBxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZyBkdXlcdTFFQzd0LicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoZC5sb2kgfHwgJ0toXHUwMEY0bmcgZ1x1MUVFRGkgXHUwMTExXHUwMUIwXHUxRUUzYyB5XHUwMEVBdSBjXHUxRUE3dS4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHsgc2V0Vm9pY2VOb3RpY2UoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpLicpOyB9XG4gIH07XG5cbiAgY29uc3QgbmdhdFZvaWNlQ2FwID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghY29uZmlybSgnTmdcdTFFQUZ0IGNcdTFFQjdwIHZvaWNlIFx1MDExMWFuZyBob1x1MUVBMXQgXHUwMTExXHUxRUQ5bmc/JykpIHJldHVybjtcbiAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2VfZW5kJyB9KVxuICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICBwb2xsVm9pY2UoKTtcbiAgfTtcblxuICBjb25zdCB0b2dnbGVNaWMgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKG1pY011dGVkKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoIWxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAvLyBNaWMgYlx1MUVDQiB0XHUxRUVCIGNoXHUxRUQxaSBsXHUwMEZBYyBqb2luIFx1MjE5MiB4aW4gbFx1MUVBMWk7IGFkZFRyYWNrIG11XHUxRUQ5biBjXHUxRUE3biByZW5lZ290aWF0ZSAob2ZmZXIgbVx1MUVEQmkpLlxuICAgICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgYXVkaW86IHRydWUsIHZpZGVvOiBmYWxzZSB9KTtcbiAgICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50ID0gc3RyZWFtO1xuICAgICAgICAgIGNvbnN0IHBjID0gcGNSZWYuY3VycmVudDtcbiAgICAgICAgICBpZiAocGMpIHtcbiAgICAgICAgICAgIHN0cmVhbS5nZXRUcmFja3MoKS5mb3JFYWNoKHRyYWNrID0+IHBjLmFkZFRyYWNrKHRyYWNrLCBzdHJlYW0pKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IG9mZmVyID0gYXdhaXQgcGMuY3JlYXRlT2ZmZXIoKTtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihvZmZlcik7XG4gICAgICAgICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnb2ZmZXInLCBwYXlsb2FkOiBvZmZlciB9KVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiByZW5lZ290aWF0aW9uIHRoXHUxRUE1dCBiXHUxRUExaSBcdTIwMTQgbmdoZSB2XHUxRUFCbiBcdTAxMTFcdTAxQjBcdTFFRTNjICovIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRBdWRpb1RyYWNrcygpLmZvckVhY2godCA9PiB7IHQuZW5hYmxlZCA9IHRydWU7IH0pO1xuICAgICAgICB9XG4gICAgICAgIHNldE1pY011dGVkKGZhbHNlKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBhbGVydCgnS2hcdTAwRjRuZyB0aFx1MUVDMyBtXHUxRURGIG1pY3JvOiAnICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldEF1ZGlvVHJhY2tzKCkuZm9yRWFjaCh0ID0+IHsgdC5lbmFibGVkID0gZmFsc2U7IH0pO1xuICAgICAgfVxuICAgICAgc2V0TWljTXV0ZWQodHJ1ZSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGxlYXZlVm9pY2UgPSAoKSA9PiB7XG4gICAgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdsZWF2ZScsIHBheWxvYWQ6IHt9IH0pXG4gICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgIGR1bmdLZXROb2lWb2ljZSgpO1xuICAgIHNldFZvaWNlSm9pbmVkKGZhbHNlKTtcbiAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICB2b2ljZVNsb3RSZWYuY3VycmVudCA9IG51bGw7XG4gICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMFx1MDBFMyBuZ1x1MUVBRnQgdm9pY2UuJyk7XG4gIH07XG5cbiAgLy8gNi4gVmlkZW8gJiBRdWV1ZSBDb25maWcgU3RhdGUgKFRhYiBjb25maWcpXG4gIGNvbnN0IFt2aWRlb01vaSwgc2V0VmlkZW9Nb2ldID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbZGFuZ0RvaVZpZGVvLCBzZXREYW5nRG9pVmlkZW9dID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbY29uZmlnTG9pLCBzZXRDb25maWdMb2ldID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbcXVldWVMaXN0LCBzZXRRdWV1ZUxpc3RdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbcXVldWVCdXN5LCBzZXRRdWV1ZUJ1c3ldID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IHRhaVF1ZXVlID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1xdWV1ZT9waG9uZ0lkPSR7cGhvbmcuaWR9JmFjdGlvbj1saXN0YCk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSBzZXRRdWV1ZUxpc3QoZC5xdWV1ZSB8fCBbXSk7XG4gICAgfSBjYXRjaCB7IH1cbiAgfTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiID09PSAnY29uZmlnJykge1xuICAgICAgdGFpUXVldWUoKTtcbiAgICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwodGFpUXVldWUsIDQwMDApO1xuICAgICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgIH1cbiAgfSwgW2RvY2tUYWIsIHBob25nLmlkXSk7XG5cbiAgY29uc3QgZG9pVmlkZW8gPSBhc3luYyAodXJsKSA9PiB7XG4gICAgY29uc3QgdSA9IFN0cmluZyh1cmwgfHwgdmlkZW9Nb2kgfHwgJycpLnRyaW0oKTtcbiAgICBpZiAoIXUgfHwgZGFuZ0RvaVZpZGVvKSByZXR1cm47XG4gICAgc2V0RGFuZ0RvaVZpZGVvKHRydWUpO1xuICAgIHNldENvbmZpZ0xvaSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXdhdGNoJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3NldF92aWRlbycsIHZpZGVvVXJsOiB1IH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSB7XG4gICAgICAgIHNldENvbmZpZ0xvaShkLmxvaSB8fCAnS2hcdTAwRjRuZyBcdTAxMTFcdTFFRDVpIFx1MDExMVx1MDFCMFx1MUVFM2MgdmlkZW8uJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRWaWRlb01vaSgnJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRDb25maWdMb2koJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXREYW5nRG9pVmlkZW8oZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBoYW5oRG9uZ1F1ZXVlID0gYXN5bmMgKGFjdGlvbiwgZXh0cmEgPSB7fSkgPT4ge1xuICAgIGlmIChxdWV1ZUJ1c3kpIHJldHVybjtcbiAgICBzZXRRdWV1ZUJ1c3kodHJ1ZSk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXF1ZXVlJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbiwgLi4uZXh0cmEgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoIWQub2spIHNldENvbmZpZ0xvaShkLmxvaSB8fCAnVGhhbyB0XHUwMEUxYyBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB0aFx1MUVBNXQgYlx1MUVBMWkuJyk7XG4gICAgICBlbHNlIGF3YWl0IHRhaVF1ZXVlKCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRDb25maWdMb2koJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRRdWV1ZUJ1c3koZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgaWQ9XCJzdHVkeS1kb2NrLWNvbnRhaW5lclwiIGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNCBmbGV4IGZsZXgtY29sIG1pbi1oLVs0MjBweF0gbGc6bWluLWgtWzQ4MHB4XSBzaGFkb3cteGxcIj5cbiAgICAgIHsvKiBTdHVkeSBEb2NrIFRhYiBOYXZpZ2F0aW9uIFx1MjAxNCBHXHUxRUNEbiBnXHUwMEUwbmcsIHRoXHUxRUE5bSBtXHUxRUY5LCBuXHUwMEZBdCBuXHUxRUQ1aSBiXHUxRUFEdCAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIHBiLTMgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIGZsZXgtd3JhcFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LWNoYXRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdjaGF0Jyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnY2hhdCdcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENBQzwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkNoYXQgcGhcdTAwRjJuZzwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1ub3Rlc1wiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ25vdGVzJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnbm90ZXMnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDREQ8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5HaGkgY2hcdTAwRkE8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktd2hpdGVib2FyZFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3doaXRlYm9hcmQnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICd3aGl0ZWJvYXJkJ1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkE4PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Qlx1MUVBM25nIHZcdTFFQkQ8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktc2hlZXRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdzaGVldCcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3NoZWV0J1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0NBPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Qlx1MUVBM25nIHRcdTAwRURuaDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS12b2ljZVwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3ZvaWNlJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAndm9pY2UnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1hbWJlci01MDAgdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMjUxLDE5MSwzNiwwLjM1KV0gYm9yZGVyIGJvcmRlci1hbWJlci00MDAvNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERjk5XHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Vm9pY2UgKDEtMSk8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktbWVtYmVyc1wiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ21lbWJlcnMnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdtZW1iZXJzJ1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1lbWVyYWxkLTQwMCB0by10ZWFsLTUwMCB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSg1MiwyMTEsMTUzLDAuMzUpXSBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNDAwLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REM2NTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPlRoXHUwMEUwbmggdmlcdTAwRUFue3RoYW5oVmllbi5sZW5ndGggPiAwID8gYCAoJHt0aGFuaFZpZW4ubGVuZ3RofSlgIDogJyd9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIHsoY2FuQ29udHJvbCB8fCBpc1N0YWZmKSAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LWNvbmZpZ1wiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdjb25maWcnKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgICBkb2NrVGFiID09PSAnY29uZmlnJ1xuICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLXZpb2xldC01MDAgdG8tZnVjaHNpYS01MDAgdGV4dC13aGl0ZSBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMTM5LDkyLDI0NiwwLjM1KV0gYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzUwJ1xuICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REZBNTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+VmlkZW88L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktcXVhbi10cmlcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYigncXVhbi10cmknKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgICBkb2NrVGFiID09PSAncXVhbi10cmknXG4gICAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tdmlvbGV0LTUwMCB0by1wdXJwbGUtNTAwIHRleHQtd2hpdGUgc2hhZG93LVswXzBfMTVweF9yZ2JhKDEzOSw5MiwyNDYsMC4zNSldIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC81MCdcbiAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICA8c3Bhbj5cdTI2OTlcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlF1eVx1MUVDMW48L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogRG9jayBDb250ZW50IEJvZHkgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIHB0LTMgbWluLWgtWzMwMHB4XVwiPlxuICAgICAgICB7LyogVEFCIDE6IENIQVQgUEhcdTAwRDJORyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdjaGF0JyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBtaW4taC0wXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy15LWF1dG8gc3BhY2UteS0zIHByLTEgbWF4LWgtNzIgbGc6bWF4LWgtWzM4MHB4XSB4bDptYXgtaC1bNDQwcHhdIHRleHQteHNcIj5cbiAgICAgICAgICAgICAge3Bob25nQ2hhdC5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDAgdGV4dC1jZW50ZXIgcHktOFwiPkNoXHUwMUIwYSBjXHUwMEYzIHRpbiBuaFx1MUVBRm4gXHUyMDE0IGhcdTAwRTN5IGdcdTFFRURpIGNcdTAwRTJ1IGhcdTFFQ0ZpIGhvXHUxRUI3YyB0cmFvIFx1MDExMVx1MUVENWkgdlx1MUVDMSBiXHUwMEUwaSBnaVx1MUVBM25nITwvcD5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICBwaG9uZ0NoYXQubWFwKChtLCBpZHgpID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXttLmlkIHx8IGlkeH0gY2xhc3NOYW1lPVwidGV4dC14cyBncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG1iLTEgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwIHRleHQtWzExcHhdXCI+e20udGVuTmd1b2lHdWl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIHttLnZhaVRybyA9PT0gJ2dpYW9fdmllbicgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMFwiPkdWQ048L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgKSA6IG0ubG9wVGVuID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuMiByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8yMFwiPnttLmxvcFRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHttLnRhb0x1YyA/IG5ldyBEYXRlKG0udGFvTHVjLnJlcGxhY2UoJyAnLCAnVCcpICsgJ1onKS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JyB9KSA6ICcnfVxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICB7bS52aWRlb1RpbWVTZWMgIT0gbnVsbCAmJiBtLnZpZGVvVGltZVNlYyA+IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geWV1Q2F1VHVhKG0udmlkZW9UaW1lU2VjKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e215Q2Fwcy52aWRlb19jb250cm9sID8gJ1R1YSB2aWRlbyBjXHUxRUEzIHBoXHUwMEYybmcgdFx1MUVEQmkgbVx1MUVEMWMgblx1MDBFMHknIDogJ1R1YSB2aWRlbyBjXHUxRUU3YSBiXHUxRUExbiB0XHUxRURCaSBtXHUxRUQxYyBuXHUwMEUweSd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIGhvdmVyOmJnLXZpb2xldC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2IHtkaW5oRGFuZ0dpYXlQaHV0KG0udmlkZW9UaW1lU2VjKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAge2lzU3RhZmYgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJYb1x1MDBFMSB0aW4gbmhcdTFFQUZuIG5cdTAwRTB5IChxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZylcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNoYXQ/cGhvbmdJZD0ke3Bob25nLmlkfSZpZD0ke20uaWR9YCwgeyBtZXRob2Q6ICdERUxFVEUnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZC5vayAmJiBvblhvYVRpblBob25nKSBvblhvYVRpblBob25nKG0uaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBiXHUxRUNGIHF1YSAqLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wYWNpdHktMCBncm91cC1ob3ZlcjpvcGFjaXR5LTEwMCBweC0xIHRleHQtWzlweF0gdGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1yb3NlLTQwMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQteGwgcHgtMyBweS0yIHRleHQtc2xhdGUtMjAwIHRleHQteHMgbGVhZGluZy1yZWxheGVkIGJyZWFrLXdvcmRzXCI+XG4gICAgICAgICAgICAgICAgICAgICAge20ubm9pRHVuZ31cbiAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPGRpdiByZWY9e2NoYXRFbmRSZWZ9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVNlbmRSb29tQ2hhdH0gY2xhc3NOYW1lPVwicHQtMyBib3JkZXItdCBib3JkZXItd2hpdGUvMTAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbXQtYXV0b1wiPlxuICAgICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICBpZD1cImlucHV0LXBob25nLWNoYXRcIlxuICAgICAgICAgICAgICAgIHJvd3M9ezF9XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e2NvUXV5ZW4oJ2NoYXQnKSA/ICdOaFx1MUVBRm4gdGluIHRyb25nIHBoXHUwMEYybmcgaFx1MUVDRGMuLi4gKHRpbiBuaFx1MUVBRm4gdFx1MUVGMSBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbyBoaVx1MUVDN24gdFx1MUVBMWkpJyA6ICdDaGF0IFx1MDExMWFuZyBiXHUxRUNCIHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nIGtoXHUwMEYzYSd9XG4gICAgICAgICAgICAgICAgdmFsdWU9e2NoYXRJbnB1dH1cbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNvUXV5ZW4oJ2NoYXQnKX1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRDaGF0SW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25TdGFydD17KCkgPT4geyBjaGF0Q29tcG9zaW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ9eygpID0+IHsgY2hhdENvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7IH19XG4gICAgICAgICAgICAgICAgb25LZXlEb3duPXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiAhZS5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5uYXRpdmVFdmVudD8uaXNDb21wb3NpbmcgfHwgY2hhdENvbXBvc2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlU2VuZFJvb21DaGF0KCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBtYXhMZW5ndGg9ezUwMH1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBweC0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS82MCByZXNpemUtbm9uZSBtaW4taC1bMzhweF0gbWF4LWgtMjQgZGlzYWJsZWQ6b3BhY2l0eS00MFwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1zZW5kLXBob25nLWNoYXRcIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXshY2hhdElucHV0LnRyaW0oKSB8fCBjaGF0U2VuZGluZyB8fCAhY29RdXllbignY2hhdCcpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMiByb3VuZGVkLXhsIGJnLVsjMDBGMkZFXSBob3ZlcjpiZy1bIzAwZTFlY10gdGV4dC1ibGFjayB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS0zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIEdcdTFFRURpXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgMjogR0hJIENIXHUwMERBIENcdTFFRDhORyBUXHUwMEMxQyBcdTIwMTQgZW50cnkgYXBwZW5kLCBjXHUwMEYzIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ25vdGVzJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMlwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgPHNwYW4+R2hpIGNoXHUwMEZBIGNodW5nIGNcdTFFRTdhIHBoXHUwMEYybmcgXHUyMDE0IG1cdTFFRDdpIG5nXHUwMUIwXHUxRUREaSB0aFx1MDBFQW0gbVx1MUVEOXQgZFx1MDBGMm5nLCBjXHUwMEYzIHRoXHUxRUMzIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvPC9zcGFuPlxuICAgICAgICAgICAgICB7bm90ZXNOb3RpY2UgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1yb3NlLTMwMCBmb250LWJvbGRcIj57bm90ZXNOb3RpY2V9PC9zcGFuPn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHNwYWNlLXktMiBwci0xIG1heC1oLTY0IG1pbi1oLVsxODBweF0gYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTIuNVwiPlxuICAgICAgICAgICAgICB7bm90ZXNMaXN0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCB0ZXh0LWNlbnRlciBweS04XCI+Q2hcdTAxQjBhIGNcdTAwRjMgZ2hpIGNoXHUwMEZBIFx1MjAxNCB0aFx1MDBFQW0gZFx1MDBGMm5nIFx1MDExMVx1MUVBN3UgdGlcdTAwRUFuIGNobyBjXHUxRUEzIHBoXHUwMEYybmcuPC9wPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIG5vdGVzTGlzdC5tYXAoKG4pID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtuLmlkfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLXN0YXJ0IGdhcC0yIGdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtNDAwXCI+e24udGVufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtuLnZpZGVvVGltZVNlYyAhPSBudWxsICYmIG4udmlkZW9UaW1lU2VjID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB5ZXVDYXVUdWEobi52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIGhvdmVyOmJnLXZpb2xldC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYge2RpbmhEYW5nR2lheVBodXQobi52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNjAwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7bi50YW9MdWMgPyBuZXcgRGF0ZShuLnRhb0x1Yy5yZXBsYWNlKCcgJywgJ1QnKSArICdaJykudG9Mb2NhbGVUaW1lU3RyaW5nKFtdLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSkgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMjAwIGxlYWRpbmctcmVsYXhlZCBicmVhay13b3Jkc1wiPntuLm5vaUR1bmd9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgeyhuLmN1YVRvaSB8fCBpc1N0YWZmKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB4b2FHaGlDaHUobi5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlhvXHUwMEUxIGdoaSBjaFx1MDBGQVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcGFjaXR5LTAgZ3JvdXAtaG92ZXI6b3BhY2l0eS0xMDAgdGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1yb3NlLTQwMCB0ZXh0LVsxMHB4XSBweC0xIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHtub3Rlc0NhbldyaXRlID8gKFxuICAgICAgICAgICAgICA8Zm9ybVxuICAgICAgICAgICAgICAgIG9uU3VibWl0PXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIGlmICghZS5uYXRpdmVFdmVudD8uaXNDb21wb3NpbmcgJiYgIW5vdGVDb21wb3NpbmdSZWYuY3VycmVudCkgdGhlbUdoaUNodSgpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICBpZD1cInN0dWR5LW5vdGUtaW5wdXRcIlxuICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e25vdGVJbnB1dH1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldE5vdGVJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ9eygpID0+IHsgbm90ZUNvbXBvc2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ9eygpID0+IHsgbm90ZUNvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7IH19XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlRoXHUwMEVBbSBnaGkgY2hcdTAwRkEgY2hvIHBoXHUwMEYybmcuLi5cIlxuICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXsxMDAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTAgcm91bmRlZC14bCBweC0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmVcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXROb3RlV2l0aFRpbWUodiA9PiAhdil9XG4gICAgICAgICAgICAgICAgICB0aXRsZT17bm90ZVdpdGhUaW1lID8gJ1x1MDExMGFuZyBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbyB2XHUwMEUwbyBnaGkgY2hcdTAwRkEnIDogJ0toXHUwMEY0bmcgZ1x1MUVBRm4gbVx1MUVEMWMgdmlkZW8nfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtub3RlV2l0aFRpbWUgPyAnYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyLXZpb2xldC01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS01MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAgICAgIFx1MjNGMVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tYWRkLW5vdGVcIlxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFub3RlSW5wdXQudHJpbSgpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIHJvdW5kZWQteGwgYmctWyMwMEYyRkVdIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJsYWNrIGRpc2FibGVkOm9wYWNpdHktMzBcIj5cbiAgICAgICAgICAgICAgICAgIFRoXHUwMEVBbVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LWFtYmVyLTMwMC84MCB0ZXh0LWNlbnRlciBweS0xXCI+XHVEODNEXHVERDEyIEdoaSBjaFx1MDBGQSBcdTAxMTFhbmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSBjaFx1MUVDOSB4ZW0gXHUyMDE0IHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nIFx1MDExMVx1MDBFMyBraFx1MDBGM2EuPC9wPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDM6IEJcdTFFQTJORyBWXHUxRUJDIENcdTFFRDhORyBUXHUwMEMxQyAoU0hBUkVEIFdISVRFQk9BUkQpICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ3doaXRlYm9hcmQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0yXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBmbGV4LXdyYXAgdGV4dC14cyBwYi0xXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLXBlblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRXYlRvb2woJ3BlbicpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JUb29sID09PSAncGVuJyA/ICdiZy1bIzAwRjJGRV0gdGV4dC1ibGFjaycgOiAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAnfWB9PlxuICAgICAgICAgICAgICAgICAgXHUyNzBGXHVGRTBGIEJcdTAwRkF0IHZcdTFFQkRcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLWVyYXNlclwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRXYlRvb2woJ2VyYXNlcicpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JUb29sID09PSAnZXJhc2VyJyA/ICdiZy1yb3NlLTUwMCB0ZXh0LXdoaXRlJyA6ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCd9YH0+XG4gICAgICAgICAgICAgICAgICBcdUQ4M0VcdURERjkgVFx1MUVBOXlcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIG1sLTJcIj5cbiAgICAgICAgICAgICAgICAgIHtbJyMwMEYyRkUnLCAnI0ZGQjgwMCcsICcjRjQzRjVFJywgJyNGRkZGRkYnXS5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e2N9XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0V2JDb2xvcihjKTsgc2V0V2JUb29sKCdwZW4nKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTUgaC01IHJvdW5kZWQtZnVsbCBib3JkZXIgZGlzYWJsZWQ6b3BhY2l0eS00MCAke3diQ29sb3IgPT09IGMgJiYgd2JUb29sID09PSAncGVuJyA/ICdzY2FsZS0xMTAgYm9yZGVyLXdoaXRlIHJpbmctMiByaW5nLWN5YW4tNDAwJyA6ICdib3JkZXItdHJhbnNwYXJlbnQnfWB9XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogYyB9fVxuICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtjfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICB7aXNTdGFmZiAmJiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi13Yi1jbGVhclwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtjbGVhcldoaXRlYm9hcmR9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXdoaXRlLzUgaG92ZXI6Ymctcm9zZS01MDAvMjAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQteHMgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICBYXHUwMEYzYSBiXHUxRUEzbmdcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBvdmVyZmxvdy1oaWRkZW4gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcmVsYXRpdmUgdG91Y2gtbm9uZSBtaW4taC1bMjIwcHhdXCI+XG4gICAgICAgICAgICAgIHshd2JDYW5Xcml0ZSAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIHotMTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctYmxhY2svNDAgdGV4dC1bMTFweF0gdGV4dC1hbWJlci0zMDAvOTAgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTIgQlx1MUVBM25nIHZcdTFFQkQgXHUwMTExYW5nIFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgY2hcdTFFQzkgeGVtXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDxjYW52YXNcbiAgICAgICAgICAgICAgICBpZD1cInN0dWR5LXdoaXRlYm9hcmQtY2FudmFzXCJcbiAgICAgICAgICAgICAgICByZWY9e2NhbnZhc1JlZn1cbiAgICAgICAgICAgICAgICB3aWR0aD17NjQwfVxuICAgICAgICAgICAgICAgIGhlaWdodD17MzIwfVxuICAgICAgICAgICAgICAgIG9uTW91c2VEb3duPXt3YkNhbldyaXRlID8gc3RhcnREcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uTW91c2VNb3ZlPXt3YkNhbldyaXRlID8gZHJhd01vdmUgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZVVwPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaFN0YXJ0PXt3YkNhbldyaXRlID8gc3RhcnREcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uVG91Y2hNb3ZlPXt3YkNhbldyaXRlID8gZHJhd01vdmUgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaEVuZD17d2JDYW5Xcml0ZSA/IHN0b3BEcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBoLWZ1bGwgJHt3YkNhbldyaXRlID8gJ2N1cnNvci1jcm9zc2hhaXInIDogJ2N1cnNvci1ub3QtYWxsb3dlZCd9YH1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNDogQlx1MUVBMk5HIFRcdTAwQ0ROSCBDXHUxRUQ4TkcgVFx1MDBDMUMgKFNIQVJFRCBTSEVFVCA4eDEwKSAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdzaGVldCcgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTIgb3ZlcmZsb3cteC1hdXRvXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICAgIEJcdTFFQTNuZyB0XHUwMEVEbmggcGhcdTAwRTJuIHRcdTAwRURjaCBzXHUxRUQxIGxpXHUxRUM3dSAvIG1cdTFFRDFjIHRoXHUxRUREaSBnaWFuIGhcdTFFQ0RjIHRcdTFFQURwIChMXHUwMUIwdSB0XHUxRUYxIFx1MDExMVx1MUVEOW5nKVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy1hdXRvIG1heC1oLTcyIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBiZy1bIzBCMEUxNF1cIj5cbiAgICAgICAgICAgICAgPHRhYmxlIGlkPVwic3R1ZHktc2hlZXQtdGFibGVcIiBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC14cyB0ZXh0LXNsYXRlLTMwMCBib3JkZXItY29sbGFwc2VcIj5cbiAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItYiBib3JkZXItd2hpdGUvMTAgZm9udC1tb25vXCI+XG4gICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJ3LTggcC0xIHRleHQtY2VudGVyIGJvcmRlci1yIGJvcmRlci13aGl0ZS8xMCB0ZXh0LVsxMHB4XVwiPiM8L3RoPlxuICAgICAgICAgICAgICAgICAgICB7Q09MUy5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgPHRoIGtleT17Y30gY2xhc3NOYW1lPVwicC0xLjUgdGV4dC1jZW50ZXIgYm9yZGVyLXIgYm9yZGVyLXdoaXRlLzEwIG1pbi13LVs3MHB4XSB0ZXh0LVsxMXB4XSBmb250LWJvbGQgdGV4dC1jeWFuLTMwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge2N9XG4gICAgICAgICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAge1JPV1MubWFwKHIgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8dHIga2V5PXtyfSBjbGFzc05hbWU9XCJib3JkZXItYiBib3JkZXItd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS9bMC4wMl1cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0xIHRleHQtY2VudGVyIGJnLXdoaXRlLzUgdGV4dC1zbGF0ZS01MDAgZm9udC1tb25vIHRleHQtWzEwcHhdIGJvcmRlci1yIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3J9XG4gICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICB7Q09MUy5tYXAoYyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjZWxsS2V5ID0gYCR7Y30ke3J9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBrZXk9e2NlbGxLZXl9IGNsYXNzTmFtZT1cInAtMCBib3JkZXItciBib3JkZXItd2hpdGUvNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS1jZWxsPXtjZWxsS2V5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3NoZWV0Q2VsbHNbY2VsbEtleV0gfHwgJyd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFkT25seT17IXNoZWV0Q2FuV3JpdGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkZvY3VzPXsoKSA9PiB7IHNoZWV0Rm9jdXNlZENlbGxSZWYuY3VycmVudCA9IGNlbGxLZXk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IHsgc2hlZXRGb2N1c2VkQ2VsbFJlZi5jdXJyZW50ID0gbnVsbDsgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNoZWV0Q2FuV3JpdGUgJiYgaGFuZGxlQ2VsbENoYW5nZShjZWxsS2V5LCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgYmctdHJhbnNwYXJlbnQgcHgtMiBweS0xIHRleHQteHMgdGV4dC13aGl0ZSBmb2N1czpiZy1bIzE1MUEyM10gZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLVsjMDBGMkZFXSAkeyFzaGVldENhbldyaXRlID8gJ29wYWNpdHktNjAgY3Vyc29yLW5vdC1hbGxvd2VkJyA6ICcnfWB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRBQiA1OiAxLVRPLTEgV0VCUlRDIFZPSUNFIFx1MjAxNCBwYWlyLWJvdW5kLCBjXHUwMEYzIHhpbiBxdXlcdTFFQzFuICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ3ZvaWNlJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC02IHRleHQtY2VudGVyIGdhcC00XCI+XG4gICAgICAgICAgICA8YXVkaW8gcmVmPXtyZW1vdGVBdWRpb1JlZn0gYXV0b1BsYXkgLz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xNiBoLTE2IHJvdW5kZWQtM3hsIGJnLWFtYmVyLTQwMC8xNSBib3JkZXIgYm9yZGVyLWFtYmVyLTQwMC8zMCB0ZXh0LWFtYmVyLTQwMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LTN4bCBzaGFkb3ctWzBfMF8yMHB4X3JnYmEoMjQ1LDE1OCwxMSwwLjIpXVwiPlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcdUZFMEZcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlXCI+VGhvXHUxRUExaSBUclx1MUVGMWMgVGlcdTFFQkZwIDEtMSBUcm9uZyBQaFx1MDBGMm5nPC9oND5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBtYXgtdy14cyBtdC0xXCI+XG4gICAgICAgICAgICAgICAgTVx1MUVEN2kgcGhcdTAwRjJuZyB0XHUxRUQxaSBcdTAxMTFhIG1cdTFFRDl0IGNcdTFFQjdwIHZvaWNlIDEtMS4gTWljcm8gbVx1MUVCN2MgXHUwMTExXHUxRUNCbmggdFx1MUVBRnQga2hpIGNoXHUwMUIwYSBiXHUxRUFEdC5cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBUclx1MUVBMW5nIHRoXHUwMEUxaSBjXHUxRUI3cCBoaVx1MUVDN24gdFx1MUVBMWkgKi99XG4gICAgICAgICAgICB7dm9pY2VQYWlyPy5hY3RpdmUgIT09IHVuZGVmaW5lZCAmJiAoXG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBiZy13aGl0ZS81IHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICAgIHt2b2ljZVBhaXI/LmFUZW4gPyBgJHt2b2ljZVBhaXIuYVRlbn0ke3ZvaWNlUGFpci5iVGVuID8gJyBcdTIxOTQgJyArIHZvaWNlUGFpci5iVGVuIDogJyBcdTAwQjcgXHUwMTExYW5nIGNoXHUxRUREIG5nXHUwMUIwXHUxRUREaSB0aFx1MUVFOSAyJ31gIDogJ0NoXHUwMUIwYSBjXHUwMEYzIGNcdTFFQjdwIHZvaWNlIG5cdTAwRTBvJ31cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyBmbGV4LXdyYXAganVzdGlmeS1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgeyF2b2ljZUpvaW5lZCA/IChcbiAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAge2NvUXV5ZW4oJ3ZvaWNlJykgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1qb2luXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtqb2luVm9pY2V9XG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZvaWNlUGFpcj8uYWN0aXZlICYmICF2b2ljZVBhaXI/LnlvdUlufVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMi41IHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1vcmFuZ2UtNTAwIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIHNoYWRvdy1sZyBob3ZlcjpvcGFjaXR5LTkwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3ZvaWNlUGFpcj8uYWN0aXZlID8gJ1x1MDExMGFuZyBjXHUwMEYzIGNcdTFFQjdwIHZvaWNlIGtoXHUwMEUxYycgOiB2b2ljZVBhaXI/LmFUZW4gPyAnVlx1MDBFMG8gY1x1MUVCN3Agdlx1MUVEQmkgJyArIHZvaWNlUGFpci5hVGVuIDogJ1RoYW0gZ2lhIHZvaWNlJ31cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2UtcmVxdWVzdFwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17eGluUXV5ZW5Wb2ljZX1cbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dm9pY2VSZXF1ZXN0ZWR9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNSBweS0yLjUgcm91bmRlZC14bCBiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTIwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IGZvbnQtYm9sZCB0ZXh0LXhzIGhvdmVyOmJnLXdoaXRlLzE1IHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7dm9pY2VSZXF1ZXN0ZWQgPyAnXHUyM0YzIFx1MDExMGFuZyBjaFx1MUVERCBkdXlcdTFFQzd0XHUyMDI2JyA6ICdcdUQ4M0RcdURFNEIgWGluIHF1eVx1MUVDMW4gdm9pY2UnfVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLXRvZ2dsZS1taWNcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVNaWN9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTQgcHktMi41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke21pY011dGVkID8gJ2JnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOmJnLXdoaXRlLzE1JyA6ICdiZy1lbWVyYWxkLTUwMCB0ZXh0LWJsYWNrJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+e21pY011dGVkID8gJ1x1RDgzRFx1REQwNyBCXHUxRUFEdCBNaWMnIDogJ1x1RDgzQ1x1REY5OVx1RkUwRiBNaWMgXHUwMTEwYW5nIEJcdTFFQUR0J308L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLWxlYXZlXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17bGVhdmVWb2ljZX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8yMCB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMzAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgUlx1MUVERGkgdm9pY2VcbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICB7aXNTdGFmZiAmJiB2b2ljZVBhaXI/LmFUZW4gJiYgIXZvaWNlUGFpcj8ueW91SW4gJiYgKFxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2UtZW5kXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e25nYXRWb2ljZUNhcH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMi41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzI1IHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzIwIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICBOZ1x1MUVBRnQgY1x1MUVCN3Agdm9pY2VcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogU3RhZmY6IGRhbmggc1x1MDBFMWNoIHhpbiBxdXlcdTFFQzFuIHZvaWNlICovfVxuICAgICAgICAgICAge2lzU3RhZmYgJiYgeWV1Q2F1Vm9pY2UubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIG1heC13LXNtIGJnLXdoaXRlLzUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtMi41IHRleHQtbGVmdFwiPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdGV4dC1hbWJlci0zMDAgbWItMS41XCI+XHUwMTEwYW5nIHhpbiBxdXlcdTFFQzFuIHZvaWNlPC9wPlxuICAgICAgICAgICAgICAgIHt5ZXVDYXVWb2ljZS5tYXAociA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17ci5raG9hfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIHB5LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0yMDAgZm9udC1zZW1pYm9sZCBmbGV4LTEgdHJ1bmNhdGVcIj57ci50ZW4gfHwgJ1RoXHUwMEUwbmggdmlcdTAwRUFuJ308L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHIua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246IHRydWUgfSk7IGlmIChkPy5vaykgc2V0WWV1Q2F1Vm9pY2UocHJldiA9PiBwcmV2LmZpbHRlcih4ID0+IHgua2hvYSAhPT0gci5raG9hKSk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1lbWVyYWxkLTUwMC8yMCB0ZXh0LWVtZXJhbGQtMzAwIGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLWVtZXJhbGQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgRHV5XHUxRUM3dFxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHsgY29uc3QgZCA9IGF3YWl0IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogci5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogZmFsc2UgfSk7IGlmIChkPy5vaykgc2V0WWV1Q2F1Vm9pY2UocHJldiA9PiBwcmV2LmZpbHRlcih4ID0+IHgua2hvYSAhPT0gci5raG9hKSk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1yb3NlLTUwMC8xNSB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMjUgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgVFx1MUVFQiBjaFx1MUVEMWlcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICB7dm9pY2VOb3RpY2UgJiYgKFxuICAgICAgICAgICAgICA8cCBpZD1cInZvaWNlLXN0YXR1cy1ub3RpY2VcIiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIGZvbnQtbW9ubyBiZy1ibGFjay80MCBweC0zIHB5LTEuNSByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItd2hpdGUvNVwiPlxuICAgICAgICAgICAgICAgIHt2b2ljZU5vdGljZX1cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIG1heC13LXhzXCI+XG4gICAgICAgICAgICAgICogR2hpIGNoXHUwMEZBOiBLXHUxRUJGdCBuXHUxRUQxaSB0aG9cdTFFQTFpIFAyUCB5XHUwMEVBdSBjXHUxRUE3dSBtXHUxRUExbmcga2hcdTAwRjRuZyBjaFx1MUVCN24gVURQLiBSZXN0cmljdGl2ZSBOQVQgY1x1MDBGMyB0aFx1MUVDMyBjXHUxRUE3biByZWxheSBUVVJOLlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNzogVEhcdTAwQzBOSCBWSVx1MDBDQU4gVFJPTkcgUEhcdTAwRDJORyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdtZW1iZXJzJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMyBvdmVyZmxvdy15LWF1dG8gbWF4LWgtODAgbGc6bWF4LWgtWzQyMHB4XSBwci0xXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwYi0yIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQzY1PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlRoXHUwMEUwbmggdmlcdTAwRUFuIHRyb25nIHBoXHUwMEYybmcgKHt0aGFuaFZpZW4ubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgICBcdTAxMTBhbmcgdHJcdTFFRjFjIHR1eVx1MUVCRm5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtMlwiPlxuICAgICAgICAgICAgICB7dGhhbmhWaWVuLm1hcCgodHYsIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhSG9zdCA9IHR2LmxhQ2h1UGhvbmcgPT09IDEgfHwgdHYudmFpVHJvUGhvbmcgPT09ICdob3N0JztcbiAgICAgICAgICAgICAgICBjb25zdCBsYUdWID0gdHYudmFpVHJvID09PSAnZ2lhb192aWVuJztcbiAgICAgICAgICAgICAgICBjb25zdCBsYUNvSG9zdCA9IHR2LnZhaVRyb1Bob25nID09PSAnY29ob3N0JztcbiAgICAgICAgICAgICAgICBjb25zdCBncmFudFZvaWNlID0gZ3JhbnRzLnNvbWUoZyA9PiBnLmtob2FUViA9PT0gdHYua2hvYSAmJiBnLmNhcGFiaWxpdHkgPT09ICd2b2ljZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50VmlkZW8gPSBncmFudHMuc29tZShnID0+IGcua2hvYVRWID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZpZGVvX2NvbnRyb2wnKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgIGtleT17dHYua2hvYSB8fCB0di50ZW4gfHwgaWR4fVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41IHAtMi41IHJvdW5kZWQteGwgYmctd2hpdGUvWzAuMDNdIGhvdmVyOmJnLXdoaXRlL1swLjA2XSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTggaC04IHJvdW5kZWQtZnVsbCBiZy1ncmFkaWVudC10by1iciBmcm9tLXRlYWwtNTAwLzIwIHRvLWVtZXJhbGQtNTAwLzIwIGJvcmRlciBib3JkZXItdGVhbC01MDAvMzAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC14cyBmb250LWJsYWNrIHRleHQtdGVhbC0zMDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7dHYuYXZhdGFyID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3R2LmF2YXRhcn0gYWx0PVwiXCIgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCByb3VuZGVkLWZ1bGwgb2JqZWN0LWNvdmVyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgKHR2LnRlbiB8fCAnPycpLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtMjAwIHRydW5jYXRlXCI+e3R2LnRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bGFIb3N0ICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0RcdURDNTEgSG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAge2xhR1YgJiYgIWxhSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERjkzIEdpXHUwMEUxbyB2aVx1MDBFQW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUNvSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyQjUwIENvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCBibG9jayB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3R2LmxvcFRlbiA/IGBMXHUxRURCcCAke3R2LmxvcFRlbn1gIDogKGxhR1YgPyAnR2lcdTAwRTFvIHZpXHUwMEVBbiB0clx1MDFCMFx1MUVERG5nJyA6ICdIXHUxRUNEYyBzaW5oJyl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICB7LyogTWVtYmVyIGFjdGlvbnMgblx1MUVCRnUgbFx1MDBFMCBob3N0L0dWICovfVxuICAgICAgICAgICAgICAgICAgICB7KHZhaVRyb1Bob25nID09PSAnaG9zdCcgfHwgYXV0aC51c2VyPy5pc1RlYWNoZXIpICYmICFsYUhvc3QgJiYgdHYua2hvYSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdzZXRfY29faG9zdCcsIHsga2hvYVRWOiB0di5raG9hLCBvbjogIWxhQ29Ib3N0IH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17bGFDb0hvc3QgPyAnVGh1IHF1eVx1MUVDMW4gY28taG9zdCcgOiAnQ1x1MUVBNXAgY28taG9zdCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYUNvSG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyLXZpb2xldC01MDAvNDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogIWdyYW50Vm9pY2UgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gbWljXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy02IGgtNiByb3VuZGVkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYW50Vm9pY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcdUZFMEZcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndmlkZW9fY29udHJvbCcsIG9uOiAhZ3JhbnRWaWRlbyB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDXHUxRUE1cC90aHUgcXV5XHUxRUMxbiB2aWRlb1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNiBoLTYgcm91bmRlZCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LVsxMHB4XSBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFudFZpZGVvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ibHVlLTUwMC8yMCB0ZXh0LWJsdWUtMzAwIGJvcmRlci1ibHVlLTUwMC80MCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERkE1XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlybShgS2ljayAke3R2LnRlbn0ga2hcdTFFQ0ZpIHBoXHUwMEYybmc/YCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2tpY2snLCB7IGtob2FUVjogdHYua2hvYSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkICYmICFkLm9rKSBhbGVydChkLmxvaSB8fCAnS2hcdTAwRjRuZyBraWNrIFx1MDExMVx1MDFCMFx1MUVFM2MuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIktpY2sga2hcdTFFQ0ZpIHBoXHUwMEYybmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTYgaC02IHJvdW5kZWQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTBweF0gYm9yZGVyIGJnLXJvc2UtNTAwLzEwIHRleHQtcm9zZS0zMDAgYm9yZGVyLXJvc2UtNTAwLzI1IGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9KX1cblxuICAgICAgICAgICAgICB7dGhhbmhWaWVuLmxlbmd0aCA9PT0gMCAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS04IHRleHQtc2xhdGUtNTAwIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgIENoXHUwMUIwYSBjXHUwMEYzIHRoXHUwMEUwbmggdmlcdTAwRUFuIG5cdTAwRTBvIHRyb25nIHBoXHUwMEYybmcuXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDg6IENcdTFFQTRVIEhcdTAwQ0NOSCBWSURFTyAmIEhcdTAwQzBORyBcdTAxMTBcdTFFRTJJIChIb3N0IC8gU3RhZmYpICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ2NvbmZpZycgJiYgKGNhbkNvbnRyb2wgfHwgaXNTdGFmZikgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTMuNSBvdmVyZmxvdy15LWF1dG8gbWF4LWgtODAgbGc6bWF4LWgtWzQyMHB4XSBwci0xIHRleHQteHNcIj5cbiAgICAgICAgICAgIHsvKiAxLiBcdTAxMTBcdTFFRDVpIHZpZGVvIFx1MDExMWFuZyBwaFx1MDBFMXQgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0zIGZsZXggZmxleC1jb2wgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkE1PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MDExMFx1MUVENWkgdmlkZW8gXHUwMTExYW5nIHBoXHUwMEUxdCBuZ2F5PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtY29uZmlnLXZpZGVvLW1vaVwiXG4gICAgICAgICAgICAgICAgICB0eXBlPVwidXJsXCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXt2aWRlb01vaX1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFZpZGVvTW9pKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17ZSA9PiB7IGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiB2aWRlb01vaS50cmltKCkpIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBkb2lWaWRlbygpOyB9IH19XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkRcdTAwRTFuIGxpbmsgWW91VHViZSAvIHZpZGVvIG1cdTFFREJpLi4uXCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIHB4LTIuNSBweS0xLjUgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MFwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLWNvbmZpZy1kb2ktdmlkZW9cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZG9pVmlkZW8oKX1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshdmlkZW9Nb2kudHJpbSgpIHx8IGRhbmdEb2lWaWRlb31cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQtbGcgYmctWyMwMEYyRkVdIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIGhvdmVyOmJnLVsjMDBlMWVjXSBhY3RpdmU6c2NhbGUtOTUgZGlzYWJsZWQ6b3BhY2l0eS0zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAge2RhbmdEb2lWaWRlbyA/ICcuLi4nIDogJ1x1MjVCNiBQaFx1MDBFMXQnfVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAge2NvbmZpZ0xvaSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXJvc2UtNDAwXCI+e2NvbmZpZ0xvaX08L3A+fVxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiAyLiBIXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB2aWRlbyAoUXVldWUpICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtMyBmbGV4IGZsZXgtY29sIGdhcC0yLjVcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW5cIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHRleHQtc2xhdGUtNDAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENDQjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPkhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHZpZGVvICh7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3Quc29tZShxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykgJiYgKFxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnc2tpcCcpfVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yIHB5LTAuNSByb3VuZGVkLW1kIGJnLWFtYmVyLTUwMC8xNSB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctYW1iZXItNTAwLzI1IGRpc2FibGVkOm9wYWNpdHktNDBcIj5cbiAgICAgICAgICAgICAgICAgICAgXHUyM0VEIEJcdTFFQ0YgcXVhIC8gVGlcdTFFQkZwIHRoZW9cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBcdTAwRDQgdGhcdTAwRUFtIHZpZGVvIHZcdTAwRTBvIHF1ZXVlICovfVxuICAgICAgICAgICAgICA8UXVldWVJbnB1dFxuICAgICAgICAgICAgICAgIG9uQWRkPXsodSwgdCkgPT4gaGFuaERvbmdRdWV1ZSgnZW5xdWV1ZScsIHsgdmlkZW9Vcmw6IHUsIHRpdGxlOiB0IH0pfVxuICAgICAgICAgICAgICAgIG9uQWRkTmV4dD17KHUsIHQpID0+IGhhbmhEb25nUXVldWUoJ2FkZF9uZXh0JywgeyB2aWRlb1VybDogdSwgdGl0bGU6IHQgfSl9XG4gICAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgICAgey8qIERhbmggc1x1MDBFMWNoIHF1ZXVlICovfVxuICAgICAgICAgICAgICB7cXVldWVMaXN0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCBweS0yIHRleHQtY2VudGVyXCI+SFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdHJcdTFFRDFuZyBcdTIwMTQgdGhcdTAwRUFtIGxpbmsgdmlkZW8gXHUwMTExXHUxRUMzIHBoXHUwMEUxdCBsXHUxRUE3biBsXHUwMUIwXHUxRUUzdC48L3A+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNSBtYXgtaC00OCBvdmVyZmxvdy15LWF1dG8gcHItMVwiPlxuICAgICAgICAgICAgICAgICAge3F1ZXVlTGlzdC5tYXAoKHEsIGlkeCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17cS5pZCB8fCBpZHh9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC1sZyBwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTUgaC01IHJvdW5kZWQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTBweF0gZm9udC1ibGFjayBzaHJpbmstMCAke3EudHJhbmdUaGFpID09PSAncGxheWluZycgPyAnYmctZW1lcmFsZC01MDAvMjAgdGV4dC1lbWVyYWxkLTMwMCcgOiAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncGxheWluZycgPyAnXHUyNUI2JyA6IGlkeCArIDF9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIHtxLnRodW1iICYmIDxpbWcgc3JjPXtxLnRodW1ifSBhbHQ9XCJcIiBjbGFzc05hbWU9XCJ3LTEwIGgtNiByb3VuZGVkIG9iamVjdC1jb3ZlciBzaHJpbmstMFwiIGxvYWRpbmc9XCJsYXp5XCIgLz59XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgbWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS0yMDAgZm9udC1tZWRpdW0gdHJ1bmNhdGVcIj57cS50aXRsZSB8fCBxLnZpZGVvVXJsfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1zbGF0ZS01MDAgdHJ1bmNhdGVcIj50aFx1MDBFQW0gYlx1MUVERmkge3EuYWRkZWRCeSB8fCAnXHUyMDE0J308L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncXVldWVkJyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlBoXHUwMEUxdCBuZ2F5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdwbGF5X25vdycsIHsgaWQ6IHEuaWQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTYgaC02IHJvdW5kZWQgYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIHRleHQtWzEwcHhdIGZvbnQtYmxhY2sgaG92ZXI6YmctWyMwMEYyRkVdLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJYXHUwMEYzYSBraFx1MUVDRmkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3JlbW92ZScsIHsgaWQ6IHEuaWQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTYgaC02IHJvdW5kZWQgYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTMwMCB0ZXh0LVsxMHB4XSBmb250LWJsYWNrIGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogMy4gVFx1MDBGOXkgY2hcdTFFQ0RuIHBoXHUwMEYybmcgJiBcdTAxMTBcdTAwRjNuZyBwaFx1MDBGMm5nICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtMyBmbGV4IGZsZXgtY29sIGdhcC0yLjVcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgICAgIFx1MjY5OVx1RkUwRiBUaGFvIHRcdTAwRTFjIHBoXHUwMEYybmdcbiAgICAgICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgICAgIHsvKiBcdTAxMTBcdTFFRDVpL2JcdTFFQ0YgbVx1MUVBRHQga2hcdTFFQTl1ICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJNXHUxRUFEdCBraFx1MUVBOXUgbVx1MUVEQmkgKFx1MDExMVx1MUVDMyB0clx1MUVEMW5nID0gYlx1MUVDRilcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1jb25maWctbWF0LWtoYXUtbW9pXCJcbiAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17MTAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnB1dC1jb25maWctbWF0LWtoYXUtbW9pJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1rID0gZWw/LnZhbHVlIHx8ICcnO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gbWsudHJpbSgpXG4gICAgICAgICAgICAgICAgICAgICAgPyBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2RvaV9tYXRfa2hhdScsIHsgbWF0S2hhdU1vaTogbWsudHJpbSgpIH0pXG4gICAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2JvX21hdF9raGF1Jywge30pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZCAmJiAhZC5vaykgYWxlcnQoZC5sb2kgfHwgJ0toXHUwMEY0bmcgXHUwMTExXHUxRUQ1aSBcdTAxMTFcdTAxQjBcdTFFRTNjIG1cdTFFQUR0IGtoXHUxRUE5dS4nKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBhbGVydCgnXHUwMTEwXHUwMEUzIGNcdTFFQURwIG5oXHUxRUFEdCBtXHUxRUFEdCBraFx1MUVBOXUgcGhcdTAwRjJuZyB0aFx1MDBFMG5oIGNcdTAwRjRuZy4nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsKSBlbC52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLWFtYmVyLTUwMC8yNSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgXHUwMTEwXHUxRUQ1aSBNS1xuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogTlx1MDBGQXQgXHUwMTExXHUwMEYzbmcgcGhcdTAwRjJuZyAqL31cbiAgICAgICAgICAgICAge2RvbmdQaG9uZ0hpZW5UYWkgJiYgcGhvbmcuY2h1UGhvbmdLaG9hICE9PSAnaGUtdGhvbmcnICYmIChcbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLWNvbmZpZy1kb25nLXBob25nXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpcm0oJ0JcdTFFQTFuIGNcdTAwRjMgY2hcdTFFQUZjIGNoXHUxRUFGbiBtdVx1MUVEMW4gXHUwMTExXHUwMEYzbmcgcGhcdTAwRjJuZyBoXHUxRUNEYyBuXHUwMEUweSBraFx1MDBGNG5nPycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgZG9uZ1Bob25nSGllblRhaSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB5LTIgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xNSBob3ZlcjpiZy1yb3NlLTUwMC8yNSB0ZXh0LXJvc2UtMzAwIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERUQxPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+XHUwMTEwXHUwMEYzbmcgcGhcdTAwRjJuZyBoXHUxRUNEYyBuXHUwMEUweTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNjogUVVcdTFFQTJOIFRSXHUxRUNBIFBIXHUwMEQyTkcgKHN0YWZmIG9ubHkpIFx1MjAxNCBwb2xpY3kgbWF0cml4ICsgbWVtYmVyIGFjdGlvbnMgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAncXVhbi10cmknICYmIGlzU3RhZmYgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTMgb3ZlcmZsb3cteS1hdXRvIG1heC1oLTgwIHByLTFcIj5cbiAgICAgICAgICAgIHsvKiBRdWljayBhY3Rpb25zIHRoZW8gbVx1MDBGNCBoXHUwMEVDbmggXHUwMTExXHUwMEUzIGNoXHUxRUQxdCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNhcCBvZiBbJ25vdGVzJywgJ3doaXRlYm9hcmQnLCAnc2hlZXQnXSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiAxLCBhY2Nlc3NNb2RlOiAnc3RhZmZfb25seScgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTIgS2hcdTAwRjNhIGNcdTFFRDluZyB0XHUwMEUxYyAoY2hcdTFFQzkgeGVtKVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2FwIG9mIFsnbm90ZXMnLCAnd2hpdGVib2FyZCcsICdzaGVldCddKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6ICdldmVyeW9uZScgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgaG92ZXI6YmctZW1lcmFsZC01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTMgTVx1MUVERiBjXHUxRUQ5bmcgdFx1MDBFMWMgY2hvIG1cdTFFQ0RpIG5nXHUwMUIwXHUxRUREaVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogUG9saWN5IG1hdHJpeCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTNcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBtYi0yXCI+Q2hcdTAwRURuaCBzXHUwMEUxY2ggY1x1MDBGNG5nIGNcdTFFRTU8L3A+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgICB7W1xuICAgICAgICAgICAgICAgICAgWyd2aWRlb19jb250cm9sJywgJ1x1MDExMGlcdTFFQzF1IGtoaVx1MUVDM24gcGhcdTAwRTF0IChwbGF5L3BhdXNlL3R1YSknXSxcbiAgICAgICAgICAgICAgICAgIFsndmlkZW9fY2hhbmdlJywgJ1x1MDExMFx1MUVENWkgdmlkZW8gXHUwMTExYW5nIHBoXHUwMEUxdCddLFxuICAgICAgICAgICAgICAgICAgWydxdWV1ZScsICdIXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB2aWRlbyddLFxuICAgICAgICAgICAgICAgICAgWydjaGF0JywgJ0NoYXQgcGhcdTAwRjJuZyddLFxuICAgICAgICAgICAgICAgICAgWydub3RlcycsICdHaGkgY2hcdTAwRkEgY2h1bmcnXSxcbiAgICAgICAgICAgICAgICAgIFsnd2hpdGVib2FyZCcsICdCXHUxRUEzbmcgdlx1MUVCRCddLFxuICAgICAgICAgICAgICAgICAgWydzaGVldCcsICdCXHUxRUEzbmcgdFx1MDBFRG5oJ10sXG4gICAgICAgICAgICAgICAgICBbJ3ZvaWNlJywgJ1ZvaWNlIDEtMSddLFxuICAgICAgICAgICAgICAgICAgWydpbnZpdGUnLCAnTVx1MUVERGkgbmdcdTAxQjBcdTFFRERpIHZcdTAwRTBvIHBoXHUwMEYybmcnXSxcbiAgICAgICAgICAgICAgICBdLm1hcCgoW2NhcCwgbmhhbl0pID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHBvbCA9IHBvbGljaWVzPy5bY2FwXSB8fCB7IGVuYWJsZWQ6IDEsIGFjY2Vzc19tb2RlOiAnc3RhZmZfb25seScgfTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtjYXB9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmbGV4LTEgdGV4dC1zbGF0ZS0zMDAgdHJ1bmNhdGVcIj57bmhhbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiBwb2wuZW5hYmxlZCA/IDAgOiAxLCBhY2Nlc3NNb2RlOiBwb2wuYWNjZXNzX21vZGUgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cG9sLmVuYWJsZWQgPyAnXHUwMTEwYW5nIGJcdTFFQUR0IFx1MjAxNCBiXHUxRUE1bSBcdTAxMTFcdTFFQzMgdFx1MUVBRnQnIDogJ1x1MDExMGFuZyB0XHUxRUFGdCBcdTIwMTQgYlx1MUVBNW0gXHUwMTExXHUxRUMzIGJcdTFFQUR0J31cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctOCBoLTQuNSBweC0wLjUgcm91bmRlZC1mdWxsIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciAke3BvbC5lbmFibGVkID8gJ2JnLWVtZXJhbGQtNTAwLzMwIGJvcmRlci1lbWVyYWxkLTUwMC80MCBqdXN0aWZ5LWVuZCcgOiAnYmctd2hpdGUvNSBib3JkZXItd2hpdGUvMTUganVzdGlmeS1zdGFydCd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTMgaC0zIHJvdW5kZWQtZnVsbCAke3BvbC5lbmFibGVkID8gJ2JnLWVtZXJhbGQtNDAwJyA6ICdiZy1zbGF0ZS01MDAnfWB9Pjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17cG9sLmFjY2Vzc19tb2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFwb2wuZW5hYmxlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0xLjUgcHktMSB0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTIwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwic3RhZmZfb25seVwiPlF1XHUxRUEzbiB0clx1MUVDQjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInNlbGVjdGVkX21lbWJlcnNcIj5NXHUxRUQ5dCBzXHUxRUQxIG5nXHUwMUIwXHUxRUREaTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImV2ZXJ5b25lXCI+TVx1MUVDRGkgbmdcdTAxQjBcdTFFRERpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgb3BhY2l0eS02MFwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmxleC0xIHRleHQtc2xhdGUtNDAwXCI+S2lcdTFFQzNtIGR1eVx1MUVDN3QgKGtpY2sveG9cdTAwRTEgdGluKTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gZm9udC1ib2xkIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHJvdW5kZWQgcHgtMS41IHB5LTAuNVwiPkxVXHUwMEQ0TiBRVVx1MUVBMk4gVFJcdTFFQ0E8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBRdVx1MUVBM24gbFx1MDBGRCB0aFx1MDBFMG5oIHZpXHUwMEVBbiAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTNcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBtYi0yXCI+VGhcdTAwRTBuaCB2aVx1MDBFQW4gJiBxdXlcdTFFQzFuIHJpXHUwMEVBbmc8L3A+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgICB7KHRoYW5oVmllbiB8fCBbXSkubWFwKHR2ID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhSG9zdCA9IEJvb2xlYW4odHYubGFDaHVQaG9uZyk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUdWID0gdHYudmFpVHJvID09PSAnZ2lhb192aWVuJztcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhQ29Ib3N0ID0gdHYudmFpVHJvUGhvbmcgPT09ICdjb19ob3N0JztcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50Vm9pY2UgPSAoZ3JhbnRzIHx8IFtdKS5zb21lKGcgPT4gZy5raG9hID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZvaWNlJyAmJiBnLnRyYW5nVGhhaSA9PT0gJ2dyYW50ZWQnKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50VmlkZW8gPSAoZ3JhbnRzIHx8IFtdKS5zb21lKGcgPT4gZy5raG9hID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZpZGVvX2NvbnRyb2wnICYmIGcudHJhbmdUaGFpID09PSAnZ3JhbnRlZCcpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3R2Lmtob2EgfHwgdHYudGVufSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHRleHQteHMgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0yMDAgZm9udC1zZW1pYm9sZCB0cnVuY2F0ZSBtYXgtdy1bMTEwcHhdXCI+e3R2LnRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAge2xhSG9zdCAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtYW1iZXItNDAwIGZvbnQtYm9sZFwiPlx1MjYwNSBob3N0PC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7bGFHViAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtWyMwMEYyRkVdIGZvbnQtYm9sZFwiPkdWPC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7bGFDb0hvc3QgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXZpb2xldC0zMDAgZm9udC1ib2xkXCI+Y28taG9zdDwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAgeyFsYUhvc3QgJiYgIWxhR1YgJiYgdHYua2hvYSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtbC1hdXRvIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHsodmFpVHJvUGhvbmcgPT09ICdob3N0JyB8fCBhdXRoLnVzZXI/LmlzVGVhY2hlcikgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdzZXRfY29faG9zdCcsIHsga2hvYVRWOiB0di5raG9hLCBvbjogIWxhQ29Ib3N0IH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2xhQ29Ib3N0ID8gJ1RodSBxdXlcdTFFQzFuIGNvLWhvc3QnIDogJ0NcdTFFQTVwIGNvLWhvc3QnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2xhQ29Ib3N0ID8gJ2JnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlci12aW9sZXQtNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246ICFncmFudFZvaWNlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gdm9pY2VcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgJHtncmFudFZvaWNlID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHR2Lmtob2EsIGNhcGFiaWxpdHk6ICd2aWRlb19jb250cm9sJywgb246ICFncmFudFZpZGVvIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiB2aWRlb1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2dyYW50VmlkZW8gPyAnYmctY3lhbi01MDAvMjAgdGV4dC1jeWFuLTMwMCBib3JkZXItY3lhbi01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHsgaWYgKGNvbmZpcm0oYEtpY2sgJHt0di50ZW59IGtoXHUxRUNGaSBwaFx1MDBGMm5nP2ApKSB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2tpY2snLCB7IGtob2FUVjogdHYua2hvYSB9KTsgaWYgKGQgJiYgIWQub2spIGFsZXJ0KGQubG9pIHx8ICdLaFx1MDBGNG5nIGtpY2sgXHUwMTExXHUwMUIwXHUxRUUzYy4nKTsgfSB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiS2ljayBraFx1MUVDRmkgcGhcdTAwRjJuZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciBiZy1yb3NlLTUwMC8xMCB0ZXh0LXJvc2UtMzAwIGJvcmRlci1yb3NlLTUwMC8yNSBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgIHsodGhhbmhWaWVuIHx8IFtdKS5sZW5ndGggPT09IDAgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDBcIj5DaFx1MDFCMGEgY1x1MDBGMyB0aFx1MDBFMG5oIHZpXHUwMEVBbi48L3A+fVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogXHUwMTEwXHUxRUQ1aS9iXHUxRUNGIG1cdTFFQUR0IGtoXHUxRUE5dSBcdTIwMTQgY2hcdTFFQzkgaG9zdC9HViAqL31cbiAgICAgICAgICAgIHsodmFpVHJvUGhvbmcgPT09ICdob3N0JyB8fCBhdXRoLnVzZXI/LmlzVGVhY2hlcikgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0zIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJNXHUxRUFEdCBraFx1MUVBOXUgbVx1MUVEQmkgKFx1MDExMVx1MUVDMyB0clx1MUVEMW5nID0gYlx1MUVDRiBtXHUxRUFEdCBraFx1MUVBOXUpXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtcGhvbmctbWF0LWtoYXUtbW9pXCJcbiAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17MTAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnB1dC1waG9uZy1tYXQta2hhdS1tb2knKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWsgPSBlbD8udmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBtay50cmltKClcbiAgICAgICAgICAgICAgICAgICAgICA/IGF3YWl0IGhhbmhEb25nUGhvbmc/LignZG9pX21hdF9raGF1JywgeyBtYXRLaGF1TW9pOiBtay50cmltKCkgfSlcbiAgICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IGhhbmhEb25nUGhvbmc/LignYm9fbWF0X2toYXUnLCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkICYmICFkLm9rKSBhbGVydChkLmxvaSB8fCAnS2hcdTAwRjRuZyBcdTAxMTFcdTFFRDVpIFx1MDExMVx1MDFCMFx1MUVFM2MgbVx1MUVBRHQga2hcdTFFQTl1LicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWwpIGVsLnZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC1sZyBiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLWFtYmVyLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgXHUwMTEwXHUxRUQ1aSAvIEJcdTFFQ0ZcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDYW1wdXNXYXRjaFRvZ2V0aGVyKHtcbiAgcGhvbmcsXG4gIHBob25nTWluaEtob2EsXG4gIGF1dGgsXG4gIGRvbmdQaG9uZ0hpZW5UYWksXG4gIHNvTmd1b2ksXG4gIG15Q2FwcyxcbiAgdmlkZW9UaW1lUmVmLFxuICBpc1Jvb21XaWRlXG59KSB7XG4gIGNvbnN0IFt3YXRjaFN0YXRlLCBzZXRXYXRjaFN0YXRlXSA9IHVzZVN0YXRlKHtcbiAgICBwbGF5aW5nOiBmYWxzZSxcbiAgICBwb3NpdGlvblNlY29uZHM6IDAsXG4gICAgYmFzZVBvc2l0aW9uU2Vjb25kczogMCxcbiAgICBwbGF5YmFja1JhdGU6IDEuMCxcbiAgICByZXZpc2lvbjogMSxcbiAgICB1cGRhdGVkQXQ6ICcnLFxuICAgIHNlcnZlck5vdzogJycsXG4gICAgdXBkYXRlZEJ5OiAnJ1xuICB9KTtcbiAgY29uc3QgW2NhbkNvbnRyb2wsIHNldENhbkNvbnRyb2xdID0gdXNlU3RhdGUoQm9vbGVhbihhdXRoPy51c2VyPy5pc1RlYWNoZXIgfHwgcGhvbmc/LmNhbkNvbnRyb2wgfHwgcGhvbmc/LmxhQ2h1UGhvbmcpKTtcbiAgY29uc3QgW3dhdGNoQ2Fwcywgc2V0V2F0Y2hDYXBzXSA9IHVzZVN0YXRlKHt9KTtcbiAgY29uc3QgZ2V0SW5pdGlhbFZpZGVvVXJsID0gKCkgPT4ge1xuICAgIGxldCBjID0ge307XG4gICAgdHJ5IHsgYyA9IHBob25nPy5jYXVIaW5oID8gSlNPTi5wYXJzZShwaG9uZy5jYXVIaW5oKSA6IHt9OyB9IGNhdGNoIHsgfVxuICAgIHJldHVybiBjLnZpZGVvVXJsIHx8IHBob25nPy52aWRlb1VybCB8fCAnJztcbiAgfTtcblxuICBjb25zdCBnZXRJbml0aWFsUHJvdmlkZXIgPSAodSkgPT4ge1xuICAgIGlmICghdSkgcmV0dXJuICdVTlNVUFBPUlRFRCc7XG4gICAgaWYgKGlkWW91dHViZSh1KSkgcmV0dXJuICdZT1VUVUJFJztcbiAgICBpZiAoaWRHb29nbGVEcml2ZSh1KSkgcmV0dXJuICdHT09HTEVfRFJJVkUnO1xuICAgIGlmIChsYVZpZGVvVHJ1Y1RpZXBGZSh1KSkgcmV0dXJuICdOQVRJVkVfSFRNTDUnO1xuICAgIHJldHVybiAnVU5TVVBQT1JURUQnO1xuICB9O1xuXG4gIGNvbnN0IGluaXRVcmwgPSBnZXRJbml0aWFsVmlkZW9VcmwoKTtcbiAgY29uc3QgW2FjdGl2ZVZpZGVvVXJsLCBzZXRBY3RpdmVWaWRlb1VybF0gPSB1c2VTdGF0ZShpbml0VXJsKTtcbiAgY29uc3QgW3Byb3ZpZGVyLCBzZXRQcm92aWRlcl0gPSB1c2VTdGF0ZSgoKSA9PiBnZXRJbml0aWFsUHJvdmlkZXIoaW5pdFVybCkpO1xuICBjb25zdCBbaGFzSW50ZXJhY3RlZCwgc2V0SGFzSW50ZXJhY3RlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2NhbFRpbWUsIHNldExvY2FsVGltZV0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW2R1cmF0aW9uLCBzZXREdXJhdGlvbl0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW2RhbmdHdWlMZW5oLCBzZXREYW5nR3VpTGVuaF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2ksIHNldExvaV0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAocGhvbmc/LmNhbkNvbnRyb2wgfHwgcGhvbmc/LmxhQ2h1UGhvbmcgfHwgYXV0aD8udXNlcj8uaXNUZWFjaGVyKSB7XG4gICAgICBzZXRDYW5Db250cm9sKHRydWUpO1xuICAgIH1cbiAgfSwgW3Bob25nPy5jYW5Db250cm9sLCBwaG9uZz8ubGFDaHVQaG9uZywgYXV0aD8udXNlcj8uaXNUZWFjaGVyXSk7XG5cbiAgY29uc3QgdmlkZW9SZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IHl0UGxheWVyUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCB5dENvbnRhaW5lcklkID0gYHl0LXBsYXllci0ke3Bob25nLmlkfWA7XG4gIGNvbnN0IGlzU2Vla2luZ1JlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGhhc0ludGVyYWN0ZWRSZWYgPSB1c2VSZWYoZmFsc2UpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbGV0IGMgPSB7fTtcbiAgICB0cnkgeyBjID0gcGhvbmc/LmNhdUhpbmggPyBKU09OLnBhcnNlKHBob25nLmNhdUhpbmgpIDoge307IH0gY2F0Y2ggeyB9XG4gICAgY29uc3QgbmV4dFVybCA9IGMudmlkZW9VcmwgfHwgcGhvbmc/LnZpZGVvVXJsIHx8ICcnO1xuICAgIGlmIChuZXh0VXJsICYmIG5leHRVcmwgIT09IGFjdGl2ZVZpZGVvVXJsKSB7XG4gICAgICBzZXRBY3RpdmVWaWRlb1VybChuZXh0VXJsKTtcbiAgICAgIHNldFByb3ZpZGVyKGdldEluaXRpYWxQcm92aWRlcihuZXh0VXJsKSk7XG4gICAgfVxuICB9LCBbcGhvbmc/LmNhdUhpbmgsIHBob25nPy52aWRlb1VybF0pO1xuXG4gIGNvbnN0IHZpZGVvVXJsID0gYWN0aXZlVmlkZW9Vcmw7XG4gIGNvbnN0IHl0SWQgPSB2aWRlb1VybCA/IGlkWW91dHViZSh2aWRlb1VybCkgOiBudWxsO1xuICBjb25zdCBkcnZJZCA9IHZpZGVvVXJsID8gaWRHb29nbGVEcml2ZSh2aWRlb1VybCkgOiBudWxsO1xuICBjb25zdCB0cnVjVGllcFVybCA9IHZpZGVvVXJsICYmICF5dElkICYmICFkcnZJZCAmJiBsYVZpZGVvVHJ1Y1RpZXBGZSh2aWRlb1VybCkgPyB1cmxNZWRpYUZlKHZpZGVvVXJsKSA6ICcnO1xuXG4gIC8vIEtoXHUxRURGaSB0XHUxRUExbyBZb3VUdWJlIElGcmFtZSBQbGF5ZXIga2hpIHl0SWQgY1x1MDBGMyBnaVx1MDBFMSB0clx1MUVDQiAoaFx1MUVENyB0clx1MUVFMyByZXRyeSBraGkgRE9NIFx1MDExMWFuZyByZW5kZXIpXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF5dElkKSByZXR1cm47XG4gICAgbGV0IGRlc3Ryb3llZCA9IGZhbHNlO1xuICAgIGxldCByZXRyeVRpbWVyID0gbnVsbDtcbiAgICBsZXQgYXR0ZW1wdHMgPSAwO1xuXG4gICAgY29uc3Qga2hvaVRhb1BsYXllciA9ICgpID0+IHtcbiAgICAgIGlmIChkZXN0cm95ZWQpIHJldHVybjtcbiAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICBpZiAoIWVsKSB7XG4gICAgICAgIGlmIChhdHRlbXB0cysrIDwgMjUpIHtcbiAgICAgICAgICByZXRyeVRpbWVyID0gc2V0VGltZW91dChraG9pVGFvUGxheWVyLCA4MCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBEZXN0cm95IHBsYXllciBjXHUwMTY5IG5cdTFFQkZ1IGNcdTAwRjNcbiAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50ICYmIHl0UGxheWVyUmVmLmN1cnJlbnQuZGVzdHJveSkge1xuICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LmRlc3Ryb3koKTsgfSBjYXRjaCB7fVxuICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudCA9IG5ldyB3aW5kb3cuWVQuUGxheWVyKHl0Q29udGFpbmVySWQsIHtcbiAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgIGhlaWdodDogJzEwMCUnLFxuICAgICAgICAgIHZpZGVvSWQ6IHl0SWQsXG4gICAgICAgICAgcGxheWVyVmFyczoge1xuICAgICAgICAgICAgYXV0b3BsYXk6IDAsXG4gICAgICAgICAgICBjb250cm9sczogY2FuQ29udHJvbCA/IDEgOiAwLFxuICAgICAgICAgICAgZGlzYWJsZWtiOiBjYW5Db250cm9sID8gMCA6IDEsXG4gICAgICAgICAgICBtb2Rlc3RicmFuZGluZzogMSxcbiAgICAgICAgICAgIHJlbDogMCxcbiAgICAgICAgICAgIHBsYXlzaW5saW5lOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAgIG9uUmVhZHk6IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoZGVzdHJveWVkKSByZXR1cm47XG4gICAgICAgICAgICAgIGlmIChldmVudC50YXJnZXQuZ2V0RHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gZXZlbnQudGFyZ2V0LmdldER1cmF0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKGQgPiAwKSBzZXREdXJhdGlvbihkKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nICYmIGV2ZW50LnRhcmdldC5wbGF5VmlkZW8pIHtcbiAgICAgICAgICAgICAgICB0cnkgeyBldmVudC50YXJnZXQucGxheVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAod2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMgPiAwICYmIGV2ZW50LnRhcmdldC5zZWVrVG8pIHtcbiAgICAgICAgICAgICAgICB0cnkgeyBldmVudC50YXJnZXQuc2Vla1RvKHdhdGNoU3RhdGUucG9zaXRpb25TZWNvbmRzLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25TdGF0ZUNoYW5nZTogKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmICFkYW5nR3VpTGVuaCAmJiAhaXNTZWVraW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuZGF0YSA9PT0gMSAmJiAhd2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oKCdwbGF5JywgZXZlbnQudGFyZ2V0LmdldEN1cnJlbnRUaW1lKCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuZGF0YSA9PT0gMiAmJiB3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3BhdXNlJywgZXZlbnQudGFyZ2V0LmdldEN1cnJlbnRUaW1lKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdMXHUxRUQ3aSBraFx1MUVERmkgdFx1MUVBMW8gWVQgUGxheWVyOicsIGVycik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIG5hcFlvdVR1YmVJZnJhbWVBcGkoKCkgPT4ge1xuICAgICAgc2V0VGltZW91dChraG9pVGFvUGxheWVyLCA1MCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgZGVzdHJveWVkID0gdHJ1ZTtcbiAgICAgIGlmIChyZXRyeVRpbWVyKSBjbGVhclRpbWVvdXQocmV0cnlUaW1lcik7XG4gICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFBsYXllclJlZi5jdXJyZW50LmRlc3Ryb3kpIHtcbiAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5kZXN0cm95KCk7IH0gY2F0Y2ggeyB9XG4gICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgfVxuICAgIH07XG4gIH0sIFt5dElkLCBwaG9uZy5pZCwgY2FuQ29udHJvbF0pO1xuXG4gIC8vIFx1MDBDMXAgZFx1MUVFNW5nIHRyXHUxRUExbmcgdGhcdTAwRTFpIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgdFx1MUVFQiBzZXJ2ZXJcbiAgY29uc3QgYXBEdW5nRG9uZ0JvID0gKHN0LCBjdHJsLCBwcm92KSA9PiB7XG4gICAgaWYgKCFzdCkgcmV0dXJuO1xuICAgIGNvbnN0IG5vd01zID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBfc2VydmVyVGltZU1zID0gc3Quc2VydmVyTm93ID8gbmV3IERhdGUoc3Quc2VydmVyTm93KS5nZXRUaW1lKCkgOiBub3dNcztcbiAgICBjb25zdCB1cGRhdGVUaW1lTXMgPSBzdC51cGRhdGVkQXQgPyBuZXcgRGF0ZShTdHJpbmcoc3QudXBkYXRlZEF0KS5yZXBsYWNlKCcgJywgJ1QnKSArIChTdHJpbmcoc3QudXBkYXRlZEF0KS5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS5nZXRUaW1lKCkgOiBub3dNcztcbiAgICBjb25zdCBlbGFwc2VkU2VjID0gTWF0aC5tYXgoMCwgKG5vd01zIC0gdXBkYXRlVGltZU1zKSAvIDEwMDApO1xuXG4gICAgbGV0IHRhcmdldFBvcyA9IE51bWJlcihzdC5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgaWYgKHN0LnBsYXlpbmcpIHtcbiAgICAgIHRhcmdldFBvcyA9IE51bWJlcihzdC5iYXNlUG9zaXRpb25TZWNvbmRzIHx8IDApICsgKGVsYXBzZWRTZWMgKiAoc3QucGxheWJhY2tSYXRlIHx8IDEuMCkpO1xuICAgIH1cbiAgICBzZXRMb2NhbFRpbWUoTWF0aC5tYXgoMCwgTWF0aC5mbG9vcih0YXJnZXRQb3MpKSk7XG5cbiAgICBpZiAoY3RybCAmJiBpc1NlZWtpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuXG4gICAgaWYgKHByb3YgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHYgPSB2aWRlb1JlZi5jdXJyZW50O1xuICAgICAgaWYgKHN0LnBsYXlpbmcpIHtcbiAgICAgICAgY29uc3QgZHJpZnQgPSBNYXRoLmFicyh2LmN1cnJlbnRUaW1lIC0gdGFyZ2V0UG9zKTtcbiAgICAgICAgaWYgKGRyaWZ0ID4gMS41KSB7XG4gICAgICAgICAgdi5jdXJyZW50VGltZSA9IHRhcmdldFBvcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodi5wYXVzZWQgJiYgKGhhc0ludGVyYWN0ZWQgfHwgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50IHx8IGN0cmwpKSB7XG4gICAgICAgICAgdi5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2LnBsYXliYWNrUmF0ZSAhPT0gKHN0LnBsYXliYWNrUmF0ZSB8fCAxLjApKSB7XG4gICAgICAgICAgdi5wbGF5YmFja1JhdGUgPSBzdC5wbGF5YmFja1JhdGUgfHwgMS4wO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIXYucGF1c2VkKSB2LnBhdXNlKCk7XG4gICAgICAgIGNvbnN0IGRyaWZ0ID0gTWF0aC5hYnModi5jdXJyZW50VGltZSAtIHN0LnBvc2l0aW9uU2Vjb25kcyk7XG4gICAgICAgIGlmIChkcmlmdCA+IDAuOCkge1xuICAgICAgICAgIHYuY3VycmVudFRpbWUgPSBzdC5wb3NpdGlvblNlY29uZHM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHByb3YgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50ICYmIHl0UGxheWVyUmVmLmN1cnJlbnQuZ2V0UGxheWVyU3RhdGUpIHtcbiAgICAgIGNvbnN0IHAgPSB5dFBsYXllclJlZi5jdXJyZW50O1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY3VyID0gcC5nZXRDdXJyZW50VGltZSgpIHx8IDA7XG4gICAgICAgIGNvbnN0IGRyaWZ0ID0gTWF0aC5hYnMoY3VyIC0gdGFyZ2V0UG9zKTtcbiAgICAgICAgaWYgKHN0LnBsYXlpbmcpIHtcbiAgICAgICAgICBpZiAoZHJpZnQgPiAxLjUpIHtcbiAgICAgICAgICAgIHAuc2Vla1RvKHRhcmdldFBvcywgdHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHBzID0gcC5nZXRQbGF5ZXJTdGF0ZSgpO1xuICAgICAgICAgIGlmIChwcyAhPT0gMSAmJiBwcyAhPT0gMyAmJiAoaGFzSW50ZXJhY3RlZCB8fCBjdHJsKSkge1xuICAgICAgICAgICAgcC5wbGF5VmlkZW8oKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgcHMgPSBwLmdldFBsYXllclN0YXRlKCk7XG4gICAgICAgICAgaWYgKHBzID09PSAxKSBwLnBhdXNlVmlkZW8oKTtcbiAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VyIC0gc3QucG9zaXRpb25TZWNvbmRzKSA+IDAuOCkge1xuICAgICAgICAgICAgcC5zZWVrVG8oc3QucG9zaXRpb25TZWNvbmRzLCB0cnVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggeyB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFBvbGwgdHJcdTFFQTFuZyB0aFx1MDBFMWkgbVx1MDBFMXkgY2hcdTFFRTcgbVx1MUVEN2kgMi41c1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoV2F0Y2ggPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy13YXRjaD9waG9uZ0lkPSR7cGhvbmcuaWR9YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoIWFjdGl2ZSkgcmV0dXJuO1xuICAgICAgICBpZiAoZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgICBzZXRDYW5Db250cm9sKEJvb2xlYW4oZC5jYW5Db250cm9sKSk7XG4gICAgICAgICAgaWYgKGQuY2Fwcykgc2V0V2F0Y2hDYXBzKGQuY2Fwcyk7XG4gICAgICAgICAgc2V0UHJvdmlkZXIoZC5wcm92aWRlciB8fCAnVU5TVVBQT1JURUQnKTtcbiAgICAgICAgICBpZiAoZC5waG9uZz8udmlkZW9VcmwgJiYgZC5waG9uZy52aWRlb1VybCAhPT0gYWN0aXZlVmlkZW9VcmwpIHtcbiAgICAgICAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKGQucGhvbmcudmlkZW9VcmwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhcER1bmdEb25nQm8oZC5zdGF0ZSwgQm9vbGVhbihkLmNhbkNvbnRyb2wpLCBkLnByb3ZpZGVyIHx8ICdVTlNVUFBPUlRFRCcpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHsgfVxuICAgIH07XG5cbiAgICBmZXRjaFdhdGNoKCk7XG4gICAgY29uc3QgdGltZXIgPSBzZXRJbnRlcnZhbChmZXRjaFdhdGNoLCAyNTAwKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICB9O1xuICB9LCBbcGhvbmcuaWQsIGhhc0ludGVyYWN0ZWRdKTtcblxuICAvLyBUaW1lciB0XHUwMTAzbmcgbG9jYWxUaW1lIFx1MDExMVx1MUVDMXUgXHUwMTExXHUxRUI3biBraGkgcGxheWluZ1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghd2F0Y2hTdGF0ZS5wbGF5aW5nKSByZXR1cm47XG4gICAgY29uc3QgdGljayA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmICghaXNTZWVraW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgc2V0TG9jYWxUaW1lKHQgPT4gdCArIDEpO1xuICAgICAgfVxuICAgIH0sIDEwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpY2spO1xuICB9LCBbd2F0Y2hTdGF0ZS5wbGF5aW5nXSk7XG5cbiAgLy8gR1x1MUVFRGkgbFx1MUVDN25oIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gKFBsYXkgLyBQYXVzZSAvIFNlZWspXG4gIGNvbnN0IGd1aUxlbmggPSBhc3luYyAoYWN0aW9uLCBjdXN0b21Qb3MpID0+IHtcbiAgICBpZiAoZGFuZ0d1aUxlbmgpIHJldHVybjtcbiAgICBzZXREYW5nR3VpTGVuaCh0cnVlKTtcbiAgICBzZXRMb2koJycpO1xuXG4gICAgbGV0IHBvcyA9IGN1c3RvbVBvcztcbiAgICBpZiAocG9zID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgICBwb3MgPSB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lO1xuICAgICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LmdldEN1cnJlbnRUaW1lKSB7XG4gICAgICAgIHBvcyA9IHl0UGxheWVyUmVmLmN1cnJlbnQuZ2V0Q3VycmVudFRpbWUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBvcyA9IGxvY2FsVGltZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcG9zID0gTWF0aC5tYXgoMCwgTnVtYmVyKChwb3MgfHwgMCkudG9GaXhlZCgyKSkpO1xuXG4gICAgLy8gQ1x1MUVBRHAgbmhcdTFFQUR0IGxcdTFFQTFjIHF1YW4gdHJcdTAwRUFuIGxvY2FsIHBsYXllclxuICAgIGlmIChhY3Rpb24gPT09ICdwbGF5Jykge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBsYXlWaWRlbykgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTtcbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ3BhdXNlJykge1xuICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LnBhdXNlKCk7XG4gICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBhdXNlVmlkZW8pIHl0UGxheWVyUmVmLmN1cnJlbnQucGF1c2VWaWRlbygpO1xuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAnc2VlaycpIHtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkgdmlkZW9SZWYuY3VycmVudC5jdXJyZW50VGltZSA9IHBvcztcbiAgICAgIGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudD8uc2Vla1RvKSB5dFBsYXllclJlZi5jdXJyZW50LnNlZWtUbyhwb3MsIHRydWUpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy13YXRjaCcsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgYWN0aW9uLFxuICAgICAgICAgIHBvc2l0aW9uOiBwb3MsXG4gICAgICAgICAgZXhwZWN0ZWRSZXZpc2lvbjogd2F0Y2hTdGF0ZS5yZXZpc2lvbixcbiAgICAgICAgICBwbGF5YmFja1JhdGU6IHdhdGNoU3RhdGUucGxheWJhY2tSYXRlIHx8IDEuMFxuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIGQuc3RhdGUpIHtcbiAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IoZC5zdGF0ZS5wb3NpdGlvblNlY29uZHMgfHwgcG9zKSk7XG4gICAgICB9IGVsc2UgaWYgKGQuY29uZmxpY3QgJiYgZC5zdGF0ZSkge1xuICAgICAgICBzZXRXYXRjaFN0YXRlKGQuc3RhdGUpO1xuICAgICAgICBhcER1bmdEb25nQm8oZC5zdGF0ZSwgY2FuQ29udHJvbCwgcHJvdmlkZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0TG9pKGQubG9pIHx8ICdMXHUxRUQ3aSBjXHUxRUFEcCBuaFx1MUVBRHQgcGhcdTAwRTF0IHZpZGVvLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0TG9pKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RGFuZ0d1aUxlbmgoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyBcdTAxMTBcdTFFRDNuZyBiXHUxRUQ5IHZcdTFFQ0IgdHJcdTAwRUQgdmlkZW8gaGlcdTFFQzduIHRcdTFFQTFpIHJhIG5nb1x1MDBFMGkgXHUwMTExXHUxRUMzIGNoYXQgZ1x1MUVBRm4gdGltZXN0YW1wXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHZpZGVvVGltZVJlZikgdmlkZW9UaW1lUmVmLmN1cnJlbnQgPSBsb2NhbFRpbWU7XG4gIH0sIFtsb2NhbFRpbWUsIHZpZGVvVGltZVJlZl0pO1xuXG5cblxuICAvLyBOaFx1MUVBRG4geVx1MDBFQXUgY1x1MUVBN3UgdHVhIHRcdTFFRUIgU3R1ZHlEb2NrIChiXHUxRUE1bSBtXHUxRUQxYyB2aWRlbyB0cm9uZyBjaGF0L2doaSBjaFx1MDBGQSkuXG4gIC8vIENcdTAwRjMgcXV5XHUxRUMxbiBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIFx1MjE5MiBwaFx1MDBFMXQgbFx1MUVDN25oIHNlZWsgY2h1bmc7IGtoXHUwMEY0bmcgXHUyMTkyIGNoXHUxRUM5IHR1YSBjXHUxRUU1YyBiXHUxRUQ5IHBsYXllciBjXHUxRUU3YSBtXHUwMEVDbmguXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qgb25TZWVrUmVxID0gKGUpID0+IHtcbiAgICAgIGlmIChlLmRldGFpbD8ucGhvbmdJZCAhPT0gcGhvbmcuaWQpIHJldHVybjtcbiAgICAgIGNvbnN0IHNlYyA9IE1hdGgubWF4KDAsIE51bWJlcihlLmRldGFpbC5zZWMpIHx8IDApO1xuICAgICAgaWYgKGNhbkNvbnRyb2wpIHtcbiAgICAgICAgZ3VpTGVuaCgnc2VlaycsIHNlYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSBzZWM7XG4gICAgICAgIGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudD8uc2Vla1RvKSB5dFBsYXllclJlZi5jdXJyZW50LnNlZWtUbyhzZWMsIHRydWUpO1xuICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihzZWMpKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzci1zZWVrJywgb25TZWVrUmVxKTtcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3NyLXNlZWsnLCBvblNlZWtSZXEpO1xuICB9LCBbcGhvbmcuaWQsIGNhbkNvbnRyb2wsIHByb3ZpZGVyLCB3YXRjaFN0YXRlLnJldmlzaW9uXSk7XG5cbiAgY29uc3QgaGFuZGxlU3RhcnRWaWV3aW5nID0gKCkgPT4ge1xuICAgIGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgc2V0SGFzSW50ZXJhY3RlZCh0cnVlKTtcbiAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHYgPSB2aWRlb1JlZi5jdXJyZW50O1xuICAgICAgY29uc3QgcCA9IHYucGxheSgpO1xuICAgICAgaWYgKHAgJiYgdHlwZW9mIHAudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBwLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGlmICghd2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgICAgICB2LnBhdXNlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBsYXlWaWRlbykge1xuICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZykgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTQgbWluLXctMCB3LWZ1bGxcIj5cbiAgICAgIHsvKiBLaHVuZyBwaFx1MDBFMXQgdmlkZW8gY2hcdTAwRURuaCAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgdy1mdWxsIGFzcGVjdC12aWRlbyBiZy1ibGFjayByb3VuZGVkLTJ4bCBvdmVyZmxvdy1oaWRkZW4gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctMnhsXCI+XG4gICAgICAgIHsvKiBPdmVybGF5IEF1dG9wbGF5IC8gR2VzdHVyZSBjaG8gbmdcdTAxQjBcdTFFRERpIHhlbSAqL31cbiAgICAgICAgeyFoYXNJbnRlcmFjdGVkICYmICFjYW5Db250cm9sICYmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnIHx8IHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JykgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgaW5zZXQtMCB6LTIwIGJnLWJsYWNrLzc1IGJhY2tkcm9wLWJsdXItc20gZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00IHRleHQtY2VudGVyIGFuaW1hdGUtZmFkZUluXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTQgaC0xNCByb3VuZGVkLWZ1bGwgYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtMnhsIG1iLTMgc2hhZG93LVswXzBfMjVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYW5pbWF0ZS1wdWxzZVwiPlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGQUNcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtd2hpdGUgbWItMVwiPlhlbSBDaHVuZyBDXHUwMEY5bmcgUGhcdTAwRjJuZzwvcD5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS0zMDAgbWF4LXcteHMgbWItNFwiPlxuICAgICAgICAgICAgICBCXHUxRUE1bSBuXHUwMEZBdCBiXHUwMEVBbiBkXHUwMUIwXHUxRURCaSBcdTAxMTFcdTFFQzMgY1x1MUVBNXAgcXV5XHUxRUMxbiBcdTAwRTJtIHRoYW5oIHZcdTAwRTAgY1x1MDBGOW5nIHRoZW8gZFx1MDBGNWkgdGltZWxpbmUgdlx1MUVEQmkgY2hcdTFFRTcgcGhcdTAwRjJuZy5cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJidG4tdmlld2VyLXN0YXJ0LXdhdGNoXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVN0YXJ0Vmlld2luZ31cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNSBweS0yLjUgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjM0I4MkY2XSB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC14cyBzaGFkb3ctbGcgaG92ZXI6b3BhY2l0eS05MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNUI2PC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5CXHUxRUFGdCBcdTAxMTFcdTFFQTd1IHhlbSBjXHUwMEY5bmcgcGhcdTAwRjJuZzwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBWaWRlbyBlbGVtZW50cyB0aGVvIHByb3ZpZGVyICovfVxuICAgICAgICB7eXRJZCA/IChcbiAgICAgICAgICA8ZGl2IGtleT17YHl0LXdyYXAtJHtwaG9uZy5pZH0tJHt5dElkfWB9IGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXJcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9e3l0Q29udGFpbmVySWR9IGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGxcIiAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogZHJ2SWQgPyAoXG4gICAgICAgICAgPGlmcmFtZVxuICAgICAgICAgICAgc3JjPXtgaHR0cHM6Ly9kcml2ZS5nb29nbGUuY29tL2ZpbGUvZC8ke2RydklkfS9wcmV2aWV3YH1cbiAgICAgICAgICAgIHRpdGxlPXtwaG9uZy50ZW59XG4gICAgICAgICAgICBhbGxvdz1cImF1dG9wbGF5OyBmdWxsc2NyZWVuXCJcbiAgICAgICAgICAgIGFsbG93RnVsbFNjcmVlblxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbFwiXG4gICAgICAgICAgLz5cbiAgICAgICAgKSA6IHRydWNUaWVwVXJsID8gKFxuICAgICAgICAgIDx2aWRlb1xuICAgICAgICAgICAgcmVmPXt2aWRlb1JlZn1cbiAgICAgICAgICAgIHNyYz17dHJ1Y1RpZXBVcmx9XG4gICAgICAgICAgICBwbGF5c0lubGluZVxuICAgICAgICAgICAgZGF0YS10ZXN0aWQ9XCJzdHVkeS12aWRlby1wbGF5ZXJcIlxuICAgICAgICAgICAgY29udHJvbHM9e2NhbkNvbnRyb2x9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb250YWluXCJcbiAgICAgICAgICAgIG9uTG9hZGVkTWV0YWRhdGE9e2UgPT4ge1xuICAgICAgICAgICAgICBpZiAoZS50YXJnZXQuZHVyYXRpb24gPiAwKSBzZXREdXJhdGlvbihlLnRhcmdldC5kdXJhdGlvbik7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25QbGF5PXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmICF3YXRjaFN0YXRlLnBsYXlpbmcgJiYgIWRhbmdHdWlMZW5oKSB7XG4gICAgICAgICAgICAgICAgZ3VpTGVuaCgncGxheScsIHZpZGVvUmVmLmN1cnJlbnQ/LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uUGF1c2U9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgd2F0Y2hTdGF0ZS5wbGF5aW5nICYmICFkYW5nR3VpTGVuaCkge1xuICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3BhdXNlJywgdmlkZW9SZWYuY3VycmVudD8uY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25TZWVrZWQ9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFjYW5Db250cm9sIHx8IGRhbmdHdWlMZW5oIHx8IGlzU2Vla2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICAgICAgICAgIGNvbnN0IGN1ciA9IHZpZGVvUmVmLmN1cnJlbnQ/LmN1cnJlbnRUaW1lO1xuICAgICAgICAgICAgICBpZiAoY3VyID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgLy8gQ2hcdTFFRDFuZyB2XHUwMEYybmcgbFx1MUVCN3A6IG1cdTFFQ0RpIGdcdTAwRTFuIGN1cnJlbnRUaW1lIG5cdTFFRDlpIGJcdTFFRDkgKG9wdGltaXN0aWMgc2VlaywgZHJpZnQtY29ycmVjdGlvblxuICAgICAgICAgICAgICAvLyBjXHUxRUU3YSBhcER1bmdEb25nQm8pIFx1MDExMVx1MUVDMXUgYlx1MUVBRm4gJ3NlZWtlZCcuIENoXHUxRUM5IGdcdTFFRURpIGxcdTFFQzduaCBraGkgdlx1MUVDQiB0clx1MDBFRCBsXHUxRUM3Y2gga2hcdTFFQ0ZpXG4gICAgICAgICAgICAgIC8vIHZcdTFFQ0IgdHJcdTAwRUQgc2VydmVyIGtcdTFFRjMgdlx1MUVDRG5nID4xLjVzIFx1MjAxNCB0XHUxRUU5YyBuZ1x1MDFCMFx1MUVERGkgZFx1MDBGOW5nIHRoXHUxRUFEdCBzXHUxRUYxIHR1YSBxdWEgdGhhbmggY29udHJvbHMuXG4gICAgICAgICAgICAgIGNvbnN0IHN0ID0gd2F0Y2hTdGF0ZTtcbiAgICAgICAgICAgICAgY29uc3QgdXBkTXMgPSBzdD8udXBkYXRlZEF0ID8gbmV3IERhdGUoU3RyaW5nKHN0LnVwZGF0ZWRBdCkucmVwbGFjZSgnICcsICdUJykgKyAoU3RyaW5nKHN0LnVwZGF0ZWRBdCkuaW5jbHVkZXMoJ1QnKSA/ICcnIDogJ1onKSkuZ2V0VGltZSgpIDogRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgY29uc3QgZWxhcHNlZCA9IE1hdGgubWF4KDAsIChEYXRlLm5vdygpIC0gdXBkTXMpIC8gMTAwMCk7XG4gICAgICAgICAgICAgIGNvbnN0IGt5Vm9uZyA9IHN0Py5wbGF5aW5nXG4gICAgICAgICAgICAgICAgPyBOdW1iZXIoc3QuYmFzZVBvc2l0aW9uU2Vjb25kcyB8fCAwKSArIGVsYXBzZWQgKiAoc3QucGxheWJhY2tSYXRlIHx8IDEpXG4gICAgICAgICAgICAgICAgOiBOdW1iZXIoc3Q/LnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGN1ciAtIGt5Vm9uZykgPiAxLjUpIGd1aUxlbmgoJ3NlZWsnLCBjdXIpO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICAvPlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgaC1mdWxsIHRleHQteHMgdGV4dC1zbGF0ZS01MDAgcC02IHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBtYi0yXCI+XHUyNkEwXHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+TGluayB2aWRlbyBraFx1MDBGNG5nIGhcdTFFRDcgdHJcdTFFRTMgcGhcdTAwRTF0IHRyXHUxRUYxYyB0aVx1MUVCRnAgaG9cdTFFQjdjIGtoXHUwMEY0bmcgaFx1MUVFM3AgbFx1MUVDNy48L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIFRoXHUwMEY0bmcgYlx1MDBFMW8gcmlcdTAwRUFuZyBjaG8gR29vZ2xlIERyaXZlICovfVxuICAgICAge2RydklkICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zLjUgcHktMiBiZy1hbWJlci01MDAvMTAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMjAgcm91bmRlZC14bCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIHRleHQtYW1iZXItMzAwXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbVwiPlx1MjEzOVx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICA8c3Bhbj5Hb29nbGUgRHJpdmUgcGhcdTAwRTF0IFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgPHN0cm9uZz5YZW0gXHUwMTExXHUxRUQ5YyBsXHUxRUFEcDwvc3Ryb25nPiAoR29vZ2xlIERyaXZlIGtoXHUwMEY0bmcgaFx1MUVENyB0clx1MUVFMyBBUEkgXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiB0XHUxRUVCIHhhKS48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIFRoYW5oIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gSG9zdCBcdTIwMTQgXHUxRUE5biBraGkgZnVsbHNjcmVlbiAqL31cbiAgICAgIHshaXNSb29tV2lkZSAmJiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtMyBzbTpwLTMuNSBmbGV4IGZsZXgtY29sIGdhcC0zIHNoYWRvdy14bFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTNcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcCBtaW4tdy0wXCI+XG4gICAgICAgICAgICB7LyogQ2hcdTFFQzkgaGlcdTFFQzduIHRyXHUxRUExbmcgdGhcdTAwRTFpIHBoXHUwMEUxdCBjaG8gaG9zdCAqL31cbiAgICAgICAgICAgIHtjYW5Db250cm9sICYmIHByb3ZpZGVyICE9PSAnR09PR0xFX0RSSVZFJyAmJiBwcm92aWRlciAhPT0gJ1VOU1VQUE9SVEVEJyAmJiAoXG4gICAgICAgICAgICAgIDxzcGFuIGlkPVwic3luYy1zdGF0ZS1iYWRnZVwiIGNsYXNzTmFtZT17YHRleHQteHMgZm9udC1ibGFjayBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke3dhdGNoU3RhdGUucGxheWluZyA/ICdiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtNDAwIGJvcmRlci1lbWVyYWxkLTUwMC8zMCBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMTYsMTg1LDEyOSwwLjIpXScgOiAnYmctYW1iZXItNTAwLzE1IHRleHQtYW1iZXItMzAwIGJvcmRlci1hbWJlci01MDAvMzAgc2hhZG93LVswXzBfMTJweF9yZ2JhKDI0NSwxNTgsMTEsMC4yKV0nfWB9PlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHctMiBoLTIgcm91bmRlZC1mdWxsICR7d2F0Y2hTdGF0ZS5wbGF5aW5nID8gJ2JnLWVtZXJhbGQtNDAwIGFuaW1hdGUtcHVsc2UnIDogJ2JnLWFtYmVyLTQwMCd9YH0+PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt3YXRjaFN0YXRlLnBsYXlpbmcgPyAnXHUwMTEwYW5nIHBoXHUwMEUxdCBjaHVuZycgOiAnVFx1MUVBMW0gZFx1MUVFQm5nJ308L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIHtjYW5Db250cm9sICYmIChcbiAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJob3N0LWJhZGdlXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1ibGFjayBweC0yLjUgcHktMSByb3VuZGVkLXhsIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCBzaGFkb3ctc20gZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTI2MDU8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+Q2hcdTFFRTcgcGhcdTAwRjJuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHNocmluay0wIG1sLWF1dG9cIj5cbiAgICAgICAgICAgIHsoY2FuQ29udHJvbCB8fCBhdXRoLnVzZXI/LmlzVGVhY2hlcikgJiYgcGhvbmcuY2h1UGhvbmdLaG9hICE9PSAnaGUtdGhvbmcnICYmIChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2RvbmdQaG9uZ0hpZW5UYWl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xNSBob3ZlcjpiZy1yb3NlLTUwMC8yNSB0ZXh0LXJvc2UtMzAwIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdHJhbnNpdGlvbi1hbGwgaG92ZXI6c2NhbGUtMTA1IGFjdGl2ZTpzY2FsZS05NVwiPlxuICAgICAgICAgICAgICAgIFx1MDExMFx1MDBGM25nIHBoXHUwMEYybmdcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogVGhhbmggY1x1MDBGNG5nIGNcdTFFRTUgcGhcdTAwRTF0IGNodW5nIChjaFx1MUVDOSBoaVx1MUVDM24gdGhcdTFFQ0IgY2hvIEhvc3QgLyBUZWFjaGVyIGtoaSBkXHUwMEY5bmcgcHJvdmlkZXIgY1x1MDBGMyB0aFx1MUVDMyBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuKSAqL31cbiAgICAgICAge2NhbkNvbnRyb2wgJiYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyB8fCBwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGl0ZW1zLWNlbnRlciBnYXAtMyBwdC0yIGJvcmRlci10IGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImJ0bi1ob3N0LXdhdGNoLXRvZ2dsZVwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKHdhdGNoU3RhdGUucGxheWluZyA/ICdwYXVzZScgOiAncGxheScpfVxuICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBzbTp3LWF1dG8gcHgtNCBweS0yIHJvdW5kZWQteGwgZm9udC1ibGFjayB0ZXh0LXhzIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xLjUgc2hhZG93LW1kIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlciBkaXNhYmxlZDpvcGFjaXR5LTUwICR7XG4gICAgICAgICAgICAgICAgd2F0Y2hTdGF0ZS5wbGF5aW5nXG4gICAgICAgICAgICAgICAgICA/ICdiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvNDAgaG92ZXI6YmctYW1iZXItNTAwLzMwIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgyNDUsMTU4LDExLDAuMjUpXSdcbiAgICAgICAgICAgICAgICAgIDogJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMwMGM2ZmZdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gaG92ZXI6YnJpZ2h0bmVzcy0xMTAnXG4gICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgPHNwYW4+e3dhdGNoU3RhdGUucGxheWluZyA/ICdcdTIzRjgnIDogJ1x1MjVCNid9PC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj57d2F0Y2hTdGF0ZS5wbGF5aW5nID8gJ1RcdTFFQTFtIERcdTFFRUJuZyBDXHUxRUEzIFBoXHUwMEYybmcnIDogJ1BoXHUwMEUxdCBDaHVuZyBDXHUxRUEzIFBoXHUwMEYybmcnfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41IHctZnVsbFwiPlxuICAgICAgICAgICAgICA8c3BhbiBpZD1cImhvc3QtZHVyYXRpb24tbGFiZWxcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICB7ZGluaERhbmdHaWF5UGh1dChsb2NhbFRpbWUpfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIGlkPVwiaG9zdC1zZWVrLXNsaWRlclwiXG4gICAgICAgICAgICAgICAgdHlwZT1cInJhbmdlXCJcbiAgICAgICAgICAgICAgICBtaW49XCIwXCJcbiAgICAgICAgICAgICAgICBtYXg9e2R1cmF0aW9uID4gMCA/IGR1cmF0aW9uIDogTWF0aC5tYXgobG9jYWxUaW1lLCAzMDApfVxuICAgICAgICAgICAgICAgIHN0ZXA9XCIxXCJcbiAgICAgICAgICAgICAgICB2YWx1ZT17bG9jYWxUaW1lfVxuICAgICAgICAgICAgICAgIG9uTW91c2VEb3duPXsoKSA9PiB7IGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICBvblRvdWNoU3RhcnQ9eygpID0+IHsgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldExvY2FsVGltZShOdW1iZXIoZS50YXJnZXQudmFsdWUpKX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlVXA9e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBOdW1iZXIoZS50YXJnZXQudmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uVG91Y2hFbmQ9e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBOdW1iZXIoZS50YXJnZXQudmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBoLTEuNSBiZy13aGl0ZS8xMCByb3VuZGVkLWxnIGFwcGVhcmFuY2Utbm9uZSBjdXJzb3ItcG9pbnRlciBhY2NlbnQtWyMwMEYyRkVdXCJcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1tb25vIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAge2R1cmF0aW9uID4gMCA/IGRpbmhEYW5nR2lheVBodXQoZHVyYXRpb24pIDogJy0tOi0tJ31cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAge2xvaSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtcm9zZS00MDBcIj57bG9pfTwvcD59XG4gICAgICAgIHtwaG9uZy5tb1RhICYmIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIGxlYWRpbmctcmVsYXhlZCBwdC0xXCI+e3Bob25nLm1vVGF9PC9wPn1cblxuICAgICAgPC9kaXY+XG4gICAgICApfVxuICAgIDwvZGl2PlxuXG4gICk7XG59XG5cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENvbXBvbmVudDogQ2FtcHVzIEZvY3VzIFJvb20gKFN0dWR5IENhZlx1MDBFOSAmIFBvbW9kb3JvIFNlc3Npb24pIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuZXhwb3J0IGZ1bmN0aW9uIENhbXB1c0ZvY3VzUm9vbSh7XG4gIHBob25nLFxuICBwaG9uZ01pbmhLaG9hLFxuICBhdXRoLFxuICBkb25nUGhvbmdIaWVuVGFpLFxuICBzb05ndW9pLFxuICBpc0ZvY3VzTW9kZSxcbiAgc2V0SXNGb2N1c01vZGVcbn0pIHtcbiAgY29uc3QgW2ZvY3VzU3RhdGUsIHNldEZvY3VzU3RhdGVdID0gdXNlU3RhdGUoe1xuICAgIHBoYXNlOiAnZm9jdXMnLFxuICAgIHN0YXR1czogJ3BhdXNlZCcsXG4gICAgZHVyYXRpb25TZWNvbmRzOiAxNTAwLFxuICAgIHJlbWFpbmluZ1NlY29uZHM6IDE1MDAsXG4gICAgcHJlc2V0OiAnMjVfNScsXG4gICAgcmV2aXNpb246IDEsXG4gICAgY2FuQ29udHJvbDogZmFsc2UsXG4gICAgdXBkYXRlZEF0OiBudWxsLFxuICAgIHNlcnZlck5vdzogbnVsbFxuICB9KTtcbiAgY29uc3QgW2xvY2FsUmVtYWluaW5nLCBzZXRMb2NhbFJlbWFpbmluZ10gPSB1c2VTdGF0ZSgxNTAwKTtcbiAgY29uc3QgW2RhbmdHdWlMZW5oLCBzZXREYW5nR3VpTGVuaF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtsb2ksIHNldExvaV0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gQXVkaW8gc3RhdGUgKEFtYmllbnQgcGxheWJhY2spXG4gIGxldCBjYXVIaW5oID0ge307XG4gIHRyeSB7IGNhdUhpbmggPSBwaG9uZy5jYXVIaW5oID8gSlNPTi5wYXJzZShwaG9uZy5jYXVIaW5oKSA6IHt9OyB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgKi8gfVxuICBjb25zdCBuaGFjVXJsID0gY2F1SGluaC5uaGFjVXJsID8gdXJsTWVkaWFGZShjYXVIaW5oLm5oYWNVcmwpIDogJyc7XG4gIGNvbnN0IGF1ZGlvUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBbYXVkaW9QbGF5aW5nLCBzZXRBdWRpb1BsYXlpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbYXVkaW9Wb2x1bWUsIHNldEF1ZGlvVm9sdW1lXSA9IHVzZVN0YXRlKDAuNSk7XG4gIGNvbnN0IFthdWRpb011dGVkLCBzZXRBdWRpb011dGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2hhc0ludGVyYWN0ZWRBdWRpbywgc2V0SGFzSW50ZXJhY3RlZEF1ZGlvXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICAvLyBBdXRob3JpemF0aW9uXG4gIGNvbnN0IFtjYW5Db250cm9sLCBzZXRDYW5Db250cm9sXSA9IHVzZVN0YXRlKEJvb2xlYW4oYXV0aC51c2VyPy5pc1RlYWNoZXIgfHwgcGhvbmc/LmNhbkNvbnRyb2wgfHwgcGhvbmc/LmxhQ2h1UGhvbmcpKTtcbiAgY29uc3QgaXNIb3N0ID0gY2FuQ29udHJvbDtcblxuICAvLyBTeW5jIHN0YXRlIHJlY29uY2lsaWF0aW9uIGhlbHBlclxuICBjb25zdCBhcER1bmdGb2N1c1N0YXRlID0gKHN0KSA9PiB7XG4gICAgaWYgKCFzdCkgcmV0dXJuO1xuICAgIHNldEZvY3VzU3RhdGUoc3QpO1xuICAgIGNvbnN0IHJlbSA9IE51bWJlcihzdC5yZW1haW5pbmdTZWNvbmRzID8/IDE1MDApO1xuICAgIHNldExvY2FsUmVtYWluaW5nKHJlbSk7XG4gIH07XG5cbiAgLy8gMS4gUG9sbGluZyBGb2N1cyBTdGF0ZSAoZXZlcnkgMzAwMG1zKSB3aXRoIHZpc2liaWxpdHkgcmVjb25jaWxpYXRpb24gJiBzdHJpY3QgY2xlYW51cFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuXG4gICAgY29uc3QgZmV0Y2hGb2N1cyA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWZvY3VzP3Bob25nSWQ9JHtlbmNvZGVVUklDb21wb25lbnQocGhvbmcuaWQpfWApO1xuICAgICAgICBpZiAoIXJlcy5vaykgcmV0dXJuO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBkLm9rICYmIGQuc3RhdGUpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGQuY2FuQ29udHJvbCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBzZXRDYW5Db250cm9sKGQuY2FuQ29udHJvbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGFwRHVuZ0ZvY3VzU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvKiBiXHUxRUNGIHF1YSBraGkgaFx1MUVFN3kga1x1MUVCRnQgblx1MUVEMWkgKi9cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZmV0Y2hGb2N1cygpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoZmV0Y2hGb2N1cywgMzAwMCk7XG5cbiAgICBjb25zdCBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlID0gKCkgPT4ge1xuICAgICAgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnICYmIGFjdGl2ZSkge1xuICAgICAgICBmZXRjaEZvY3VzKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlKTtcbiAgICB9O1xuICB9LCBbcGhvbmcuaWRdKTtcblxuICAvLyAyLiBMb2NhbCBDb3VudGRvd24gVGljayAoZXZlcnkgMTAwMG1zIHdoZW4gc3RhdHVzID09PSAncnVubmluZycpXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGZvY3VzU3RhdGUuc3RhdHVzICE9PSAncnVubmluZycpIHJldHVybjtcbiAgICBjb25zdCB0aWNrID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgc2V0TG9jYWxSZW1haW5pbmcociA9PiBNYXRoLm1heCgwLCByIC0gMSkpO1xuICAgIH0sIDEwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpY2spO1xuICB9LCBbZm9jdXNTdGF0ZS5zdGF0dXNdKTtcblxuICAvLyAzLiBDb21tYW5kIGRpc3BhdGNoZXIgd2l0aCBvcHRpbWlzdGljIGNvbmN1cnJlbmN5IChyZXZpc2lvbiBjaGVjayAmIGNvbmZsaWN0IGhhbmRsaW5nKVxuICBjb25zdCBndWlMZW5oID0gYXN5bmMgKGFjdGlvbiwgZXh0cmFQYXlsb2FkID0ge30pID0+IHtcbiAgICBpZiAoZGFuZ0d1aUxlbmgpIHJldHVybjtcbiAgICBzZXREYW5nR3VpTGVuaCh0cnVlKTtcbiAgICBzZXRMb2koJycpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWZvY3VzJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICBhY3Rpb24sXG4gICAgICAgICAgZXhwZWN0ZWRSZXZpc2lvbjogZm9jdXNTdGF0ZS5yZXZpc2lvbixcbiAgICAgICAgICAuLi5leHRyYVBheWxvYWRcbiAgICAgICAgfSlcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIGQuc3RhdGUpIHtcbiAgICAgICAgYXBEdW5nRm9jdXNTdGF0ZShkLnN0YXRlKTtcbiAgICAgIH0gZWxzZSBpZiAocmVzLnN0YXR1cyA9PT0gNDA5ICYmIGQuc3RhdGUpIHtcbiAgICAgICAgLy8gQ29uY3VycmVuY3kgY29uZmxpY3Q6IGFkb3B0IGxhdGVzdCBzZXJ2ZXIgc3RhdGVcbiAgICAgICAgYXBEdW5nRm9jdXNTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgc2V0TG9pKCdcdTAxMTBcdTAwRTMgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBsXHUxRUExaSBwaGlcdTAwRUFuIHRoZW8gbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRMb2koZC5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgY1x1MUVBRHAgbmhcdTFFQUR0IHRyXHUxRUExbmcgdGhcdTAwRTFpIHBoXHUwMEYybmcgaFx1MUVDRGMgdFx1MUVBRHAuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRMb2koJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXREYW5nR3VpTGVuaChmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIDQuIEFtYmllbnQgQXVkaW8gQ29udHJvbHNcbiAgY29uc3QgYmF0QW1UaGFuaCA9ICgpID0+IHtcbiAgICBzZXRIYXNJbnRlcmFjdGVkQXVkaW8odHJ1ZSk7XG4gICAgaWYgKGF1ZGlvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGF1ZGlvUmVmLmN1cnJlbnQucGxheSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBzZXRBdWRpb1BsYXlpbmcodHJ1ZSk7XG4gICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0F1dG9wbGF5IGJsb2NrZWQgb3IgYXVkaW8gbG9hZCBlcnJvcjonLCBlcnIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHRvZ2dsZUF1ZGlvUGxheSA9ICgpID0+IHtcbiAgICBpZiAoIWF1ZGlvUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICBpZiAoYXVkaW9QbGF5aW5nKSB7XG4gICAgICBhdWRpb1JlZi5jdXJyZW50LnBhdXNlKCk7XG4gICAgICBzZXRBdWRpb1BsYXlpbmcoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBiYXRBbVRoYW5oKCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHRvZ2dsZUF1ZGlvTXV0ZSA9ICgpID0+IHtcbiAgICBpZiAoIWF1ZGlvUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICBjb25zdCBuZXdNdXRlID0gIWF1ZGlvTXV0ZWQ7XG4gICAgYXVkaW9SZWYuY3VycmVudC5tdXRlZCA9IG5ld011dGU7XG4gICAgc2V0QXVkaW9NdXRlZChuZXdNdXRlKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVWb2x1bWVDaGFuZ2UgPSAoZSkgPT4ge1xuICAgIGNvbnN0IHZhbCA9IHBhcnNlRmxvYXQoZS50YXJnZXQudmFsdWUpO1xuICAgIHNldEF1ZGlvVm9sdW1lKHZhbCk7XG4gICAgaWYgKGF1ZGlvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGF1ZGlvUmVmLmN1cnJlbnQudm9sdW1lID0gdmFsO1xuICAgICAgaWYgKHZhbCA+IDAgJiYgYXVkaW9NdXRlZCkge1xuICAgICAgICBhdWRpb1JlZi5jdXJyZW50Lm11dGVkID0gZmFsc2U7XG4gICAgICAgIHNldEF1ZGlvTXV0ZWQoZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBjb25zdCBpc0JyZWFrID0gZm9jdXNTdGF0ZS5waGFzZSA9PT0gJ2JyZWFrJztcbiAgY29uc3QgaXNSdW5uaW5nID0gZm9jdXNTdGF0ZS5zdGF0dXMgPT09ICdydW5uaW5nJztcbiAgY29uc3QgZHVyYXRpb24gPSBmb2N1c1N0YXRlLmR1cmF0aW9uU2Vjb25kcyB8fCAoaXNCcmVhayA/IDMwMCA6IDE1MDApO1xuICBjb25zdCBwcm9ncmVzc1BlcmNlbnQgPSBNYXRoLm1pbigxMDAsIE1hdGgubWF4KDAsICgoZHVyYXRpb24gLSBsb2NhbFJlbWFpbmluZykgLyBkdXJhdGlvbikgKiAxMDApKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtNCBtaW4tdy0wIHctZnVsbFwiPlxuICAgICAgey8qIEhpZGRlbiBBdWRpbyBlbGVtZW50IGZvciBhbWJpZW50IHNvdW5kdHJhY2sgKi99XG4gICAgICB7bmhhY1VybCAmJiAoXG4gICAgICAgIDxhdWRpb1xuICAgICAgICAgIHJlZj17YXVkaW9SZWZ9XG4gICAgICAgICAgc3JjPXtuaGFjVXJsfVxuICAgICAgICAgIGxvb3BcbiAgICAgICAgICBwcmVsb2FkPVwibm9uZVwiXG4gICAgICAgICAgb25FbmRlZD17KCkgPT4gc2V0QXVkaW9QbGF5aW5nKGZhbHNlKX1cbiAgICAgICAgICBvbkVycm9yPXsoKSA9PiBzZXRBdWRpb1BsYXlpbmcoZmFsc2UpfVxuICAgICAgICAvPlxuICAgICAgKX1cblxuICAgICAgey8qIEhlYWRlciBiYXI6IFByZXNlbmNlLCBIb3N0IGJhZGdlLCBGb2N1cyBNb2RlIHRvZ2dsZSwgQ2xvc2UgUm9vbSAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC00IGZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMgc2hhZG93LWxnXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1mdWxsIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBib3JkZXIgJHtwaG9uZy5waGFtVmkgPT09ICd0cnVvbmcnID8gJ2JnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC00MDAgYm9yZGVyLWVtZXJhbGQtNTAwLzMwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICB7cGhvbmcucGhhbVZpID09PSAndHJ1b25nJyA/ICdcdUQ4M0NcdURGMTAgVG9cdTAwRTBuIHRyXHUwMUIwXHUxRUREbmcnIDogYFx1RDgzRFx1REQxMiBMXHUxRURCcCAke3Bob25nLmxvcFRlbiB8fCAnJ31gfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBpZD1cImZvY3VzLWhvc3QtYmFkZ2VcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgQ2hcdTFFRTcgcGhcdTAwRjJuZzogPHN0cm9uZyBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTIwMFwiPntwaG9uZy5jaHVQaG9uZ1Rlbn08L3N0cm9uZz5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gaWQ9XCJmb2N1cy1yb29tLXByZXNlbmNlXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gcHgtMi41IHB5LTAuNSByb3VuZGVkLWZ1bGwgYmctWyMwMEYyRkVdLzEwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzIwIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgIFx1RDgzRFx1REM2NSB7c29OZ3VvaSB8fCAxfSBuZ1x1MDFCMFx1MUVERGkgXHUwMTExYW5nIGNcdTAwRjluZyB0XHUxRUFEcCB0cnVuZ1xuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtbC1hdXRvXCI+XG4gICAgICAgICAge2lzRm9jdXNNb2RlICYmIChcbiAgICAgICAgICAgIDxzcGFuIGlkPVwiZm9jdXMtbW9kZS1hY3RpdmUtaW5kaWNhdG9yXCIgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtcHVycGxlLTQwMCBiZy1wdXJwbGUtNTAwLzEwIHB4LTIgcHktMC41IHJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLXB1cnBsZS01MDAvMjAgYW5pbWF0ZS1wdWxzZVwiPlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGQUYgXHUwMTEwYW5nIGJcdTFFQUR0IEZvY3VzIE1vZGVcbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICApfVxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLW1vZGUtdG9nZ2xlXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNGb2N1c01vZGUoIWlzRm9jdXNNb2RlKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMS41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHtpc0ZvY3VzTW9kZSA/ICdiZy1wdXJwbGUtNTAwLzIwIHRleHQtcHVycGxlLTMwMCBib3JkZXItcHVycGxlLTUwMC80MCBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMTY4LDg1LDI0NywwLjMpXScgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkFGPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+e2lzRm9jdXNNb2RlID8gJ1x1MjFBOSBUaG9cdTAwRTF0IEZvY3VzIE1vZGUnIDogJ0ZvY3VzIE1vZGUnfTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIHtjYW5Db250cm9sICYmIHBob25nLmNodVBob25nS2hvYSAhPT0gJ2hlLXRob25nJyAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXtkb25nUGhvbmdIaWVuVGFpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzE1IGhvdmVyOmJnLXJvc2UtNTAwLzI1IHRleHQtcm9zZS0zMDAgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICBcdTAxMTBcdTAwRjNuZyBwaFx1MDBGMm5nXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogTWFpbiBGb2N1cyBDZW50ZXJwaWVjZSBDYXJkICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9e2ByZWxhdGl2ZSBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC0zeGwgYm9yZGVyIHRyYW5zaXRpb24tYWxsIHAtNiBzbTpwLTggZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgdGV4dC1jZW50ZXIgc2hhZG93LTJ4bCAke2lzQnJlYWsgPyAnYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMUUxNzEwXSB0by1bIzEzMTEwRV0gYm9yZGVyLWFtYmVyLTUwMC8zMCcgOiAnYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMEYxRTI4XSB0by1bIzBBMTIxOV0gYm9yZGVyLVsjMDBGMkZFXS8zMCd9YH0+XG4gICAgICAgIHsvKiBHbG93IGJhY2tkcm9wIGFjY2VudCAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BhYnNvbHV0ZSAtdG9wLTI0IC1sZWZ0LTI0IHctNzIgaC03MiByb3VuZGVkLWZ1bGwgYmx1ci0zeGwgb3BhY2l0eS0yMCBwb2ludGVyLWV2ZW50cy1ub25lICR7aXNCcmVhayA/ICdiZy1hbWJlci01MDAnIDogJ2JnLVsjMDBGMkZFXSd9YH0gLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BhYnNvbHV0ZSAtYm90dG9tLTI0IC1yaWdodC0yNCB3LTcyIGgtNzIgcm91bmRlZC1mdWxsIGJsdXItM3hsIG9wYWNpdHktMjAgcG9pbnRlci1ldmVudHMtbm9uZSAke2lzQnJlYWsgPyAnYmctb3JhbmdlLTUwMCcgOiAnYmctaW5kaWdvLTUwMCd9YH0gLz5cblxuICAgICAgICB7LyogUGhhc2UgJiBTdGF0dXMgQmFkZ2VzICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMi41IG1iLTYgei0xMFwiPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBpZD1cImZvY3VzLXBoYXNlLWJhZGdlXCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtZXh0cmFib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciBib3JkZXIgc2hhZG93LXNtICR7aXNCcmVhayA/ICdiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC80MCcgOiAnYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlci1bIzAwRjJGRV0vNDAnfWB9PlxuICAgICAgICAgICAge2lzQnJlYWsgPyAnXHUyNjE1IEdpXHUxRUREIE5naFx1MUVDOSBOZ1x1MDFBMWkgKEJyZWFrKScgOiAnXHVEODNDXHVERjQ1IFBoaVx1MDBFQW4gVFx1MUVBRHAgVHJ1bmcgKEZvY3VzKSd9XG4gICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGlkPVwiZm9jdXMtc3RhdHVzLWJhZGdlXCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHtpc1J1bm5pbmcgPyAnYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTQwMCBib3JkZXItZW1lcmFsZC01MDAvMzAnIDogJ2JnLXNsYXRlLTUwMC8xNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItc2xhdGUtNTAwLzMwJ31gfT5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHctMiBoLTIgcm91bmRlZC1mdWxsICR7aXNSdW5uaW5nID8gJ2JnLWVtZXJhbGQtNDAwIGFuaW1hdGUtcHVsc2UnIDogJ2JnLXNsYXRlLTQwMCd9YH0gLz5cbiAgICAgICAgICAgIDxzcGFuPntpc1J1bm5pbmcgPyAnXHUwMTEwYW5nIFx1MDExMVx1MUVCRm0nIDogJ1RcdTFFQTFtIGRcdTFFRUJuZyd9PC9zcGFuPlxuICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXByZXNldC10b2dnbGVcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBkaXNhYmxlZD17IWNhbkNvbnRyb2wgfHwgZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBjYW5Db250cm9sICYmIGd1aUxlbmgoJ3NldF9wcmVzZXQnLCB7IHByZXNldDogZm9jdXNTdGF0ZS5wcmVzZXQgPT09ICc1MF8xMCcgPyAnMjVfNScgOiAnNTBfMTAnIH0pfVxuICAgICAgICAgICAgdGl0bGU9e2NhbkNvbnRyb2wgPyAnQlx1MUVBNW0gXHUwMTExXHUxRUMzIFx1MDExMVx1MUVENWkgY2h1IGtcdTFFRjMgUG9tb2Rvcm8nIDogJ0NodSBrXHUxRUYzIFBvbW9kb3JvIGhpXHUxRUM3biB0XHUxRUExaSd9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEgcm91bmRlZC1mdWxsIHRleHQteHMgZm9udC1tb25vIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtjYW5Db250cm9sID8gJ2hvdmVyOnNjYWxlLTEwNSBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXIgYmctd2hpdGUvMTAgdGV4dC13aGl0ZSBib3JkZXItd2hpdGUvMjAnIDogJ2N1cnNvci1kZWZhdWx0IGJnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgIFx1MjY5OVx1RkUwRiB7Zm9jdXNTdGF0ZS5wcmVzZXQgPT09ICc1MF8xMCcgPyAnNTAgLyAxMCBwaFx1MDBGQXQnIDogJzI1IC8gNSBwaFx1MDBGQXQnfVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogTWFzc2l2ZSBUaW1lciBEaXNwbGF5ICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm15LTIgc206bXktNCB6LTEwXCI+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGlkPVwiZm9jdXMtdGltZXItZGlzcGxheVwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2Bmb250LW1vbm8gdGV4dC02eGwgc206dGV4dC04eGwgZm9udC1ibGFjayB0cmFja2luZy13aWRlc3QgYmxvY2sgdHJhbnNpdGlvbi1hbGwgc2VsZWN0LW5vbmUgJHtpc0JyZWFrID8gJ3RleHQtYW1iZXItMzAwIGRyb3Atc2hhZG93LVswXzBfMzVweF9yZ2JhKDI0NSwxNTgsMTEsMC4zNSldJyA6ICd0ZXh0LVsjMDBGMkZFXSBkcm9wLXNoYWRvdy1bMF8wXzM1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldJ31gfT5cbiAgICAgICAgICAgIHtkaW5oRGFuZ0dpYXlQaHV0KGxvY2FsUmVtYWluaW5nKX1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBQcm9ncmVzcyBiYXIgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIG1heC13LW1kIGgtMiBiZy1ibGFjay80MCByb3VuZGVkLWZ1bGwgb3ZlcmZsb3ctaGlkZGVuIGJvcmRlciBib3JkZXItd2hpdGUvMTAgbXktNCB6LTEwXCI+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgaC1mdWxsIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTEwMDAgJHtpc0JyZWFrID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tb3JhbmdlLTUwMCcgOiAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzNCODJGNl0nfWB9XG4gICAgICAgICAgICBzdHlsZT17eyB3aWR0aDogYCR7cHJvZ3Jlc3NQZXJjZW50fSVgIH19XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIENvbnRyb2wgQnV0dG9ucyBmb3IgSG9zdC9UZWFjaGVyICovfVxuICAgICAgICB7Y2FuQ29udHJvbCA/IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMyBtdC00IHotMTBcIj5cbiAgICAgICAgICAgIHshaXNSdW5uaW5nID8gKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtc3RhcnRcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdzdGFydCcpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMyByb3VuZGVkLTJ4bCBiZy1ncmFkaWVudC10by1yIGZyb20tZW1lcmFsZC00MDAgdG8tdGVhbC01MDAgaG92ZXI6ZnJvbS1lbWVyYWxkLTMwMCBob3Zlcjp0by10ZWFsLTQwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC1zbSBzaGFkb3ctWzBfMF8yMHB4X3JnYmEoNTIsMjExLDE1MywwLjMpXSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjVCNjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5CXHUxRUFGdCBcdTAxMTFcdTFFQTd1PC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1wYXVzZVwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3BhdXNlJyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNiBweS0zIHJvdW5kZWQtMnhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tb3JhbmdlLTUwMCBob3Zlcjpmcm9tLWFtYmVyLTMwMCBob3Zlcjp0by1vcmFuZ2UtNDAwIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXNtIHNoYWRvdy1bMF8wXzIwcHhfcmdiYSgyNTEsMTkxLDM2LDAuMyldIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyM0Y4PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlRcdTFFQTFtIGRcdTFFRUJuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXJlc2V0XCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgncmVzZXQnKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0zIHJvdW5kZWQtMnhsIGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzE1IHRleHQtc2xhdGUtMjAwIHRleHQtc20gZm9udC1ib2xkIGJvcmRlciBib3JkZXItd2hpdGUvMTUgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMDQ8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MDExMFx1MUVCN3QgbFx1MUVBMWk8L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAge2lzQnJlYWsgPyAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1zdGFydC1mb2N1c1wiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3N0YXJ0X2ZvY3VzJyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0zIHJvdW5kZWQtMnhsIGJnLVsjMDBGMkZFXS8yMCBob3ZlcjpiZy1bIzAwRjJGRV0vMzAgdGV4dC1bIzAwRjJGRV0gdGV4dC1zbSBmb250LWJvbGQgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REZBRjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5WXHUwMEUwbyBUXHUxRUFEcCB0cnVuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtc3RhcnQtYnJlYWtcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdzdGFydF9icmVhaycpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMyByb3VuZGVkLTJ4bCBiZy1hbWJlci01MDAvMjAgaG92ZXI6YmctYW1iZXItNTAwLzMwIHRleHQtYW1iZXItMzAwIHRleHQtc20gZm9udC1ib2xkIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzQwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTI2MTU8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+TmdoXHUxRUM5IG5nXHUwMUExaTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDAgbXQtMyB6LTEwXCI+XG4gICAgICAgICAgICBcdTIzRjMgXHUwMTEwXHUxRUQzbmcgaFx1MUVEMyBQb21vZG9ybyBkbyBjaFx1MUVFNyBwaFx1MDBGMm5nIFx1MDExMWlcdTFFQzF1IHBoXHUxRUQxaSBcdTIwMTQgaFx1MDBFM3kgdFx1MUVBRHAgdHJ1bmcgaFx1MUVCRnQgbVx1MDBFQ25oIHZcdTAwRTBvIGNcdTAwRjRuZyB2aVx1MUVDN2MvaFx1MUVDRGMgdFx1MUVBRHAgbmhcdTAwRTkhXG4gICAgICAgICAgPC9wPlxuICAgICAgICApfVxuXG4gICAgICAgIHtsb2kgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXJvc2UtNDAwIG10LTQgei0xMFwiPntsb2l9PC9wPn1cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQW1iaWVudCBBdWRpbyBQbGF5ZXIgQ2FyZCAqL31cbiAgICAgIHtuaGFjVXJsID8gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNCBzbTpwLTUgZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHNoYWRvdy14bFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMuNSBtaW4tdy0wIHctZnVsbCBzbTp3LWF1dG9cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgdy0xMiBoLTEyIHJvdW5kZWQtMnhsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteGwgc2hyaW5rLTAgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7YXVkaW9QbGF5aW5nID8gJ2JnLVsjOEI1Q0Y2XS8yMCB0ZXh0LVsjOEI1Q0Y2XSBib3JkZXItWyM4QjVDRjZdLzQwIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgxMzksOTIsMjQ2LDAuMyldIGFuaW1hdGUtcHVsc2UnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAgXHVEODNDXHVERkE3XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLXctMFwiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIHRydW5jYXRlXCI+XHUwMEMybSB0aGFuaCBuXHUxRUMxbiBBbWJpZW50PC9wPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgIHthdWRpb1BsYXlpbmcgPyAnXHUwMTEwYW5nIHBoXHUwMEUxdCBraFx1MDBGNG5nIGdpYW4gaFx1MUVDRGMgdFx1MUVBRHAnIDogJ1x1MDBDMm0gdGhhbmggY1x1MUVFNWMgYlx1MUVEOSB0aGVvIHRoaVx1MUVCRnQgYlx1MUVDQid9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIgZ2FwLTMgdy1mdWxsIHNtOnctYXV0byBqdXN0aWZ5LWVuZFwiPlxuICAgICAgICAgICAgeyFoYXNJbnRlcmFjdGVkQXVkaW8gJiYgIWF1ZGlvUGxheWluZyAmJiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1zdGFydC1mb2N1cy1hdWRpb1wiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17YmF0QW1UaGFuaH1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1yIGZyb20tWyM4QjVDRjZdIHRvLVsjNjM2NkYxXSB0ZXh0LXdoaXRlIHRleHQteHMgZm9udC1ib2xkIHNoYWRvdy1sZyBob3ZlcjpvcGFjaXR5LTkwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5CXHUxRUFEdCBcdTAwRTJtIHRoYW5oIHRcdTFFQURwIHRydW5nPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJmb2N1cy1hdWRpby10b2dnbGVcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlQXVkaW9QbGF5fVxuICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7YXVkaW9QbGF5aW5nID8gJ2JnLVsjOEI1Q0Y2XS8yMCB0ZXh0LVsjOEI1Q0Y2XSBib3JkZXItWyM4QjVDRjZdLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtMzAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICAgIDxzcGFuPnthdWRpb1BsYXlpbmcgPyAnXHUyM0Y4IFRcdTFFQTFtIGRcdTFFRUJuZycgOiAnXHUyNUI2IFBoXHUwMEUxdCB0aVx1MUVCRnAnfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVBdWRpb011dGV9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiByb3VuZGVkLXhsIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXhzIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgIHthdWRpb011dGVkIHx8IGF1ZGlvVm9sdW1lID09PSAwID8gJ1x1RDgzRFx1REQwNycgOiAnXHVEODNEXHVERDA5J31cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgdHlwZT1cInJhbmdlXCJcbiAgICAgICAgICAgICAgbWluPVwiMFwiXG4gICAgICAgICAgICAgIG1heD1cIjFcIlxuICAgICAgICAgICAgICBzdGVwPVwiMC4wNVwiXG4gICAgICAgICAgICAgIHZhbHVlPXthdWRpb011dGVkID8gMCA6IGF1ZGlvVm9sdW1lfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17aGFuZGxlVm9sdW1lQ2hhbmdlfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTI0IGgtMS41IGJnLXdoaXRlLzEwIHJvdW5kZWQtbGcgYXBwZWFyYW5jZS1ub25lIGN1cnNvci1wb2ludGVyIGFjY2VudC1bIzhCNUNGNl1cIlxuICAgICAgICAgICAgICB0aXRsZT1cIlx1MDBDMm0gbFx1MDFCMFx1MUVFM25nIG5oXHUxRUExYyBuXHUxRUMxblwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICkgOiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLTJ4bCBwLTQgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMFwiPlxuICAgICAgICAgICAgXHUyNjE1IFBoXHUwMEYybmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSB0XHUwMTI5bmggbFx1MUVCN25nIChjaFx1MDFCMGEgZ1x1MUVBRm4gbGluayBcdTAwRTJtIHRoYW5oIG5cdTFFQzFuKSBcdTIwMTQgQ2h1eVx1MDBFQW4gdFx1MDBFMm0gdFx1MUVEMWkgXHUwMTExYSB2XHUwMEUwbyBiXHUwMEUwaSB2XHUxRURGLlxuICAgICAgICAgIDwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7cGhvbmcubW9UYSAmJiAoXG4gICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIHB4LTIgbGVhZGluZy1yZWxheGVkXCI+XG4gICAgICAgICAge3Bob25nLm1vVGF9XG4gICAgICAgIDwvcD5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiQUFBQSxNQUFNLEVBQUUsVUFBVSxXQUFXLE9BQU8sSUFBSTtBQUN4QyxTQUFTLGtCQUFrQixlQUFlLFdBQVcsbUJBQW1CLHFCQUFxQixrQkFBa0I7QUFJeEcsZ0JBQVMsV0FBVyxFQUFFLE9BQU8sVUFBVSxHQUFHO0FBQy9DLFFBQU0s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
