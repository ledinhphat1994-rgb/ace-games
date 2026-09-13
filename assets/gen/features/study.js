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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvc3R1ZHkuanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9ID0gUmVhY3Q7XG5pbXBvcnQgeyBkaW5oRGFuZ0dpYXlQaHV0LCBpZEdvb2dsZURyaXZlLCBpZFlvdXR1YmUsIGxhVmlkZW9UcnVjVGllcEZlLCBuYXBZb3VUdWJlSWZyYW1lQXBpLCB1cmxNZWRpYUZlIH0gZnJvbSAnLi4vbGliL2hlbHBlcnMuanMnO1xuXG5cbi8vIFx1MDBENCBuaFx1MUVBRHAgbGluayB0aFx1MDBFQW0gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgXHUyMDE0IGRcdTAwRjluZyBjaHVuZyBjaG8gU3R1ZHlEb2NrIHZcdTAwRTAgQ2FtcHVzV2F0Y2hUb2dldGhlclxuZXhwb3J0IGZ1bmN0aW9uIFF1ZXVlSW5wdXQoeyBvbkFkZCwgb25BZGROZXh0IH0pIHtcbiAgY29uc3QgW3YsIHNldFZdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBvayA9IHYudHJpbSgpLmxlbmd0aCA+IDA7XG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICA8aW5wdXRcbiAgICAgICAgaWQ9XCJpbnB1dC1xdWV1ZS1hZGRcIlxuICAgICAgICB0eXBlPVwidXJsXCJcbiAgICAgICAgdmFsdWU9e3Z9XG4gICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFYoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICBvbktleURvd249e2UgPT4geyBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgb2spIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBvbkFkZCh2LnRyaW0oKSk7IHNldFYoJycpOyB9IH19XG4gICAgICAgIHBsYWNlaG9sZGVyPVwiVGhcdTAwRUFtIGxpbmsgdmlkZW8gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcdTIwMjZcIlxuICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0yLjUgcHktMS41IHRleHQtWzExcHhdIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgIC8+XG4gICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBpZD1cImJ0bi1xdWV1ZS1hZGQtbmV4dFwiIGRpc2FibGVkPXshb2t9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHsgb25BZGROZXh0KHYudHJpbSgpKTsgc2V0VignJyk7IH19XG4gICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy12aW9sZXQtNTAwLzE1IHRleHQtdmlvbGV0LTMwMCBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLXZpb2xldC01MDAvMjUgZGlzYWJsZWQ6b3BhY2l0eS0zMCB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxuICAgICAgICArUGhcdTAwRTF0IGtcdTFFQkZcbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJidG4tcXVldWUtZW5xdWV1ZVwiIGRpc2FibGVkPXshb2t9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHsgb25BZGQodi50cmltKCkpOyBzZXRWKCcnKTsgfX1cbiAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctWyMwMEYyRkVdLzI1IGRpc2FibGVkOm9wYWNpdHktMzAgd2hpdGVzcGFjZS1ub3dyYXBcIj5cbiAgICAgICAgK0N1XHUxRUQxaSBoXHUwMEUwbmdcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgU1RVRFkgRE9DSzogS0hcdTAwRDRORyBHSUFOIENcdTFFRDhORyBUXHUwMEMxQyBQSFx1MDBEMk5HIFlPVVRVQkUgKFBIQVNFIDRGKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBmdW5jdGlvbiBTdHVkeURvY2soeyBwaG9uZywgcGhvbmdNaW5oS2hvYSwgYXV0aCwgcGhvbmdDaGF0ID0gW10sIG9uU2VuZFBob25nQ2hhdCwgb25Yb2FUaW5QaG9uZyxcbiAgbXlDYXBzID0ge30sIGlzU3RhZmYgPSBmYWxzZSwgdmFpVHJvUGhvbmcgPSAnbWVtYmVyJywgdGhhbmhWaWVuID0gW10sXG4gIHBvbGljaWVzID0gbnVsbCwgZ3JhbnRzID0gW10sIHZpZGVvVGltZVJlZiwgc2Vla1ZpZGVvLCBoYW5oRG9uZ1Bob25nLFxuICBjYW5Db250cm9sID0gZmFsc2UsIGRvbmdQaG9uZ0hpZW5UYWkgfSkge1xuICBjb25zdCBbZG9ja1RhYiwgc2V0RG9ja1RhYl0gPSBSZWFjdC51c2VTdGF0ZSgnY2hhdCcpOyAvLyAnY2hhdCcgfCAnbm90ZXMnIHwgJ3doaXRlYm9hcmQnIHwgJ3NoZWV0JyB8ICd2b2ljZScgfCAncXVhbi10cmknXG5cbiAgLy8gQ2FwYWJpbGl0eSBwaFx1MDBFRGEgY2xpZW50IGNoXHUxRUM5IFx1MDExMVx1MUVDMyBcdTFFQTluL2hpXHUxRUM3biBVSSBcdTIwMTQgbVx1MUVDRGkgcXV5XHUxRUMxbiB0aFx1MUVBRHQgZG8gc2VydmVyIHF1eVx1MUVCRnQuXG4gIGNvbnN0IGNvUXV5ZW4gPSAoY2FwKSA9PiBteUNhcHNbY2FwXSAhPT0gZmFsc2U7XG4gIGNvbnN0IGxheVZpVHJpVmlkZW8gPSAoKSA9PiBNYXRoLmZsb29yKHZpZGVvVGltZVJlZj8uY3VycmVudCB8fCAwKSB8fCBudWxsO1xuICAvLyBCXHUxRUE1bSBtXHUxRUQxYyB0aFx1MUVERGkgZ2lhbiBcdTIxOTIgZ1x1MUVFRGkgZXZlbnQgY2hvIENhbXB1c1dhdGNoVG9nZXRoZXIgeFx1MUVFRCBsXHUwMEZEXG4gIC8vIChjXHUwMEYzIHZpZGVvX2NvbnRyb2wgXHUyMTkyIHR1YSBjaHVuZyBjXHUxRUEzIHBoXHUwMEYybmc7IGtoXHUwMEY0bmcgXHUyMTkyIHR1YSBjXHUxRUU1YyBiXHUxRUQ5IHBsYXllciBjXHUxRUU3YSBtXHUwMEVDbmgpLlxuICBjb25zdCB5ZXVDYXVUdWEgPSAoc2VjKSA9PiB7XG4gICAgaWYgKHNlYyA9PSBudWxsIHx8ICEoc2VjID49IDApKSByZXR1cm47XG4gICAgaWYgKHNlZWtWaWRlbykgeyBzZWVrVmlkZW8oc2VjLCBteUNhcHMudmlkZW9fY29udHJvbCA9PT0gdHJ1ZSk7IHJldHVybjsgfVxuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnc3Itc2VlaycsIHsgZGV0YWlsOiB7IHBob25nSWQ6IHBob25nLmlkLCBzZWMgfSB9KSk7XG4gIH07XG5cbiAgLy8gMS4gUm9vbSBDaGF0IFN0YXRlXG4gIGNvbnN0IFtjaGF0SW5wdXQsIHNldENoYXRJbnB1dF0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtjaGF0U2VuZGluZywgc2V0Q2hhdFNlbmRpbmddID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBjaGF0Q29tcG9zaW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgY2hhdEVuZFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiID09PSAnY2hhdCcgJiYgY2hhdEVuZFJlZi5jdXJyZW50KSB7XG4gICAgICBjaGF0RW5kUmVmLmN1cnJlbnQuc2Nyb2xsSW50b1ZpZXcoeyBiZWhhdmlvcjogJ3Ntb290aCcgfSk7XG4gICAgfVxuICB9LCBbcGhvbmdDaGF0Lmxlbmd0aCwgZG9ja1RhYl0pO1xuXG4gIGNvbnN0IGhhbmRsZVNlbmRSb29tQ2hhdCA9IChlKSA9PiB7XG4gICAgZT8ucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCB0eHQgPSBjaGF0SW5wdXQudHJpbSgpO1xuICAgIGlmICghdHh0IHx8IGNoYXRTZW5kaW5nKSByZXR1cm47XG4gICAgc2V0Q2hhdElucHV0KCcnKTtcbiAgICBzZXRDaGF0U2VuZGluZyh0cnVlKTtcbiAgICBpZiAob25TZW5kUGhvbmdDaGF0KSB7XG4gICAgICBQcm9taXNlLnJlc29sdmUob25TZW5kUGhvbmdDaGF0KHR4dCkpLmNhdGNoKCgpID0+IHtcbiAgICAgICAgc2V0Q2hhdElucHV0KGN1ciA9PiBjdXIgPyBjdXIgOiB0eHQpO1xuICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgIHNldENoYXRTZW5kaW5nKGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRDaGF0U2VuZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIDIuIFNoYXJlZCBOb3RlcyBcdTIwMTQgZW50cnkgYXBwZW5kIChtXHUxRUQ3aSBuZ1x1MDFCMFx1MUVERGkgdGhcdTAwRUFtIGdoaSBjaFx1MDBGQSByaVx1MDBFQW5nLCBraFx1MDBGNG5nIGdoaSBcdTAxMTFcdTAwRTggbmhhdSlcbiAgY29uc3QgW25vdGVzTGlzdCwgc2V0Tm90ZXNMaXN0XSA9IFJlYWN0LnVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW25vdGVJbnB1dCwgc2V0Tm90ZUlucHV0XSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW25vdGVXaXRoVGltZSwgc2V0Tm90ZVdpdGhUaW1lXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBbbm90ZXNDYW5Xcml0ZSwgc2V0Tm90ZXNDYW5Xcml0ZV0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW25vdGVzTm90aWNlLCBzZXROb3Rlc05vdGljZV0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IG5vdGVzVmVyc2lvblJlZiA9IFJlYWN0LnVzZVJlZigwKTtcbiAgY29uc3Qgbm90ZUNvbXBvc2luZ1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiAhPT0gJ25vdGVzJykgcmV0dXJuO1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoTm90ZXMgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT1ub3Rlc2ApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBkLm9rKSB7XG4gICAgICAgICAgc2V0Tm90ZXNMaXN0KEFycmF5LmlzQXJyYXkoZC5wYXlsb2FkPy5ub3RlcykgPyBkLnBheWxvYWQubm90ZXMgOiBbXSk7XG4gICAgICAgICAgbm90ZXNWZXJzaW9uUmVmLmN1cnJlbnQgPSBkLnZlcnNpb24gfHwgMDtcbiAgICAgICAgICBzZXROb3Rlc0NhbldyaXRlKGQuY2FuV3JpdGUgIT09IGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RpdmUgJiYgZC5jb2RlID09PSAnY2FwYWJpbGl0eV9vZmYnKSB7XG4gICAgICAgICAgc2V0Tm90ZXNDYW5Xcml0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIGZldGNoTm90ZXMoKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGZldGNoTm90ZXMsIDMwMDApO1xuICAgIHJldHVybiAoKSA9PiB7IGFjdGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludGVydmFsKTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiXSk7XG5cbiAgY29uc3QgdGhlbUdoaUNodSA9IGFzeW5jICgpID0+IHtcbiAgICBjb25zdCB0ZXh0ID0gbm90ZUlucHV0LnRyaW0oKTtcbiAgICBpZiAoIXRleHQpIHJldHVybjtcbiAgICBzZXROb3Rlc05vdGljZSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgcmVzb3VyY2U6ICdub3RlcycsXG4gICAgICAgICAgcGF5bG9hZDogeyB0ZXh0LCB2aWRlb1RpbWVTZWM6IG5vdGVXaXRoVGltZSA/IGxheVZpVHJpVmlkZW8oKSA6IG51bGwgfVxuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSB7XG4gICAgICAgIHNldE5vdGVJbnB1dCgnJyk7XG4gICAgICAgIHNldE5vdGVzTGlzdChwcmV2ID0+IFsuLi5wcmV2LCB7IGlkOiBkLmlkLCB0ZW46IGF1dGgudXNlcj8udGVuIHx8ICdCXHUxRUExbicsIG5vaUR1bmc6IHRleHQsIHZpZGVvVGltZVNlYzogbm90ZVdpdGhUaW1lID8gbGF5VmlUcmlWaWRlbygpIDogbnVsbCwgY3VhVG9pOiAxIH1dKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldE5vdGVzTm90aWNlKGQubG9pIHx8ICdLaFx1MDBGNG5nIGxcdTAxQjB1IFx1MDExMVx1MDFCMFx1MUVFM2MgZ2hpIGNoXHUwMEZBLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggeyBzZXROb3Rlc05vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkuJyk7IH1cbiAgfTtcblxuICBjb25zdCB4b2FHaGlDaHUgPSBhc3luYyAoaWQpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIHJlc291cmNlOiAnbm90ZXMnLCBhY3Rpb246ICd4b2Ffbm90ZScsIGlkIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHNldE5vdGVzTGlzdChwcmV2ID0+IHByZXYuZmlsdGVyKG4gPT4gbi5pZCAhPT0gaWQpKTtcbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gMy4gU2hhcmVkIFdoaXRlYm9hcmQgU3RhdGVcbiAgY29uc3QgY2FudmFzUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBbd2JTdHJva2VzLCBzZXRXYlN0cm9rZXNdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbd2JDb2xvciwgc2V0V2JDb2xvcl0gPSBSZWFjdC51c2VTdGF0ZSgnIzAwRjJGRScpO1xuICBjb25zdCBbd2JXaWR0aCwgc2V0V2JXaWR0aF0gPSBSZWFjdC51c2VTdGF0ZSgzKTtcbiAgY29uc3QgW3diVG9vbCwgc2V0V2JUb29sXSA9IFJlYWN0LnVzZVN0YXRlKCdwZW4nKTtcbiAgY29uc3QgaXNEcmF3aW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgY3VycmVudFN0cm9rZVJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgd2JWZXJzaW9uUmVmID0gUmVhY3QudXNlUmVmKDApO1xuXG4gIGNvbnN0IHJlZHJhd0NhbnZhcyA9IFJlYWN0LnVzZUNhbGxiYWNrKChzdHJva2VzKSA9PiB7XG4gICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFjYW52YXMpIHJldHVybjtcbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgc3Ryb2tlcy5mb3JFYWNoKHMgPT4ge1xuICAgICAgaWYgKCFzLnBvaW50cyB8fCBzLnBvaW50cy5sZW5ndGggPCAyKSByZXR1cm47XG4gICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzLnRvb2wgPT09ICdlcmFzZXInID8gJyMwQjBFMTQnIDogKHMuY29sb3IgfHwgJyMwMEYyRkUnKTtcbiAgICAgIGN0eC5saW5lV2lkdGggPSBzLndpZHRoIHx8IDM7XG4gICAgICBjdHgubGluZUNhcCA9ICdyb3VuZCc7XG4gICAgICBjdHgubGluZUpvaW4gPSAncm91bmQnO1xuICAgICAgY3R4Lm1vdmVUbyhzLnBvaW50c1swXS54LCBzLnBvaW50c1swXS55KTtcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcy5wb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3R4LmxpbmVUbyhzLnBvaW50c1tpXS54LCBzLnBvaW50c1tpXS55KTtcbiAgICAgIH1cbiAgICAgIGN0eC5zdHJva2UoKTtcbiAgICB9KTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IFt3YkNhbldyaXRlLCBzZXRXYkNhbldyaXRlXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpO1xuXG4gIC8vIFx1MDBDMXAgMSBvcCB2XHUwMEUwbyBtXHUxRUEzbmcgc3Ryb2tlcyAocmVwbGF5IGFwcGVuZC1vbmx5KTogJ3N0cm9rZScgdGhcdTAwRUFtIG5cdTAwRTl0LCAnY2xlYXInIHhvXHUwMEUxIHNcdTFFQTFjaC5cbiAgY29uc3QgYXBEdW5nT3AgPSAoc3Ryb2tlcywgb3ApID0+IHtcbiAgICBpZiAob3AudHlwZSA9PT0gJ2NsZWFyJykgcmV0dXJuIFtdO1xuICAgIGlmIChvcC50eXBlID09PSAnc3Ryb2tlJyAmJiBvcC5zdHJva2UpIHJldHVybiBbLi4uc3Ryb2tlcywgb3Auc3Ryb2tlXTtcbiAgICByZXR1cm4gc3Ryb2tlcztcbiAgfTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAnd2hpdGVib2FyZCcpIHJldHVybjtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaFdiID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mcmVzb3VyY2U9d2hpdGVib2FyZCZzYXVJZD0ke3diVmVyc2lvblJlZi5jdXJyZW50fWApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBkLm9rKSB7XG4gICAgICAgICAgY29uc3Qgb3BzID0gQXJyYXkuaXNBcnJheShkLnBheWxvYWQ/Lm9wcykgPyBkLnBheWxvYWQub3BzIDogW107XG4gICAgICAgICAgaWYgKG9wcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIE5cdTFFQkZ1IGNcdTAwRjMgb3AgJ2NsZWFyJyB0cm9uZyBsb1x1MUVBMXQgbVx1MUVEQmkgXHUyMTkyIGJ1aWxkIGxcdTFFQTFpIHRcdTFFRUIgXHUwMTExXHUxRUE3dSBjaG8gY2hcdTFFQUZjXG4gICAgICAgICAgICBpZiAob3BzLnNvbWUobyA9PiBvLnR5cGUgPT09ICdjbGVhcicpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGZ1bGwgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT13aGl0ZWJvYXJkJnNhdUlkPTBgKTtcbiAgICAgICAgICAgICAgY29uc3QgZGYgPSBhd2FpdCBmdWxsLmpzb24oKTtcbiAgICAgICAgICAgICAgaWYgKGFjdGl2ZSAmJiBkZi5vaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbE9wcyA9IEFycmF5LmlzQXJyYXkoZGYucGF5bG9hZD8ub3BzKSA/IGRmLnBheWxvYWQub3BzIDogW107XG4gICAgICAgICAgICAgICAgY29uc3QgcmVidWlsdCA9IGFsbE9wcy5yZWR1Y2UoYXBEdW5nT3AsIFtdKTtcbiAgICAgICAgICAgICAgICBzZXRXYlN0cm9rZXMocmVidWlsdCk7XG4gICAgICAgICAgICAgICAgcmVkcmF3Q2FudmFzKHJlYnVpbHQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzZXRXYlN0cm9rZXMocHJldiA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dCA9IG9wcy5yZWR1Y2UoYXBEdW5nT3AsIHByZXYpO1xuICAgICAgICAgICAgICAgIHJlZHJhd0NhbnZhcyhuZXh0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHdiVmVyc2lvblJlZi5jdXJyZW50ID0gZC52ZXJzaW9uIHx8IDA7XG4gICAgICAgICAgc2V0V2JDYW5Xcml0ZShkLmNhbldyaXRlICE9PSBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aXZlICYmIGQuY29kZSA9PT0gJ2NhcGFiaWxpdHlfb2ZmJykge1xuICAgICAgICAgIHNldFdiQ2FuV3JpdGUoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfTtcbiAgICBmZXRjaFdiKCk7XG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmZXRjaFdiLCAzMDAwKTtcbiAgICByZXR1cm4gKCkgPT4geyBhY3RpdmUgPSBmYWxzZTsgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7IH07XG4gIH0sIFtwaG9uZy5pZCwgZG9ja1RhYiwgcmVkcmF3Q2FudmFzXSk7XG5cbiAgY29uc3Qgc3RhcnREcmF3aW5nID0gKGUpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICBpZiAoIWNhbnZhcykgcmV0dXJuO1xuICAgIGNvbnN0IHJlY3QgPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgY2xpZW50WCA9IGUuY2xpZW50WCA/PyAoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXT8uY2xpZW50WCk7XG4gICAgY29uc3QgY2xpZW50WSA9IGUuY2xpZW50WSA/PyAoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXT8uY2xpZW50WSk7XG4gICAgY29uc3QgeCA9IGNsaWVudFggLSByZWN0LmxlZnQ7XG4gICAgY29uc3QgeSA9IGNsaWVudFkgLSByZWN0LnRvcDtcbiAgICBpc0RyYXdpbmdSZWYuY3VycmVudCA9IHRydWU7XG4gICAgY3VycmVudFN0cm9rZVJlZi5jdXJyZW50ID0ge1xuICAgICAgdG9vbDogd2JUb29sLFxuICAgICAgY29sb3I6IHdiQ29sb3IsXG4gICAgICB3aWR0aDogd2JUb29sID09PSAnZXJhc2VyJyA/IDE2IDogd2JXaWR0aCxcbiAgICAgIHBvaW50czogW3sgeCwgeSB9XVxuICAgIH07XG4gIH07XG5cbiAgY29uc3QgZHJhd01vdmUgPSAoZSkgPT4ge1xuICAgIGlmICghaXNEcmF3aW5nUmVmLmN1cnJlbnQgfHwgIWN1cnJlbnRTdHJva2VSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgIGlmICghY2FudmFzKSByZXR1cm47XG4gICAgY29uc3QgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBjbGllbnRYID0gZS5jbGllbnRYID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRYKTtcbiAgICBjb25zdCBjbGllbnRZID0gZS5jbGllbnRZID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRZKTtcbiAgICBjb25zdCB4ID0gY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICBjb25zdCB5ID0gY2xpZW50WSAtIHJlY3QudG9wO1xuICAgIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5wb2ludHMucHVzaCh7IHgsIHkgfSk7XG4gICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC50b29sID09PSAnZXJhc2VyJyA/ICcjMEIwRTE0JyA6IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5jb2xvcjtcbiAgICBjdHgubGluZVdpZHRoID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LndpZHRoO1xuICAgIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcbiAgICBjdHgubGluZUpvaW4gPSAncm91bmQnO1xuICAgIGNvbnN0IHB0cyA9IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5wb2ludHM7XG4gICAgaWYgKHB0cy5sZW5ndGggPj0gMikge1xuICAgICAgY3R4Lm1vdmVUbyhwdHNbcHRzLmxlbmd0aCAtIDJdLngsIHB0c1twdHMubGVuZ3RoIC0gMl0ueSk7XG4gICAgICBjdHgubGluZVRvKHB0c1twdHMubGVuZ3RoIC0gMV0ueCwgcHRzW3B0cy5sZW5ndGggLSAxXS55KTtcbiAgICAgIGN0eC5zdHJva2UoKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgc3RvcERyYXdpbmcgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFpc0RyYXdpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGlzRHJhd2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRTdHJva2VSZWYuY3VycmVudCAmJiBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQucG9pbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNvbnN0IHN0cm9rZSA9IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudDtcbiAgICAgIGNvbnN0IG5leHRTdHJva2VzID0gWy4uLndiU3Ryb2tlcywgc3Ryb2tlXTtcbiAgICAgIHNldFdiU3Ryb2tlcyhuZXh0U3Ryb2tlcyk7XG4gICAgICBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgICAgcmVzb3VyY2U6ICd3aGl0ZWJvYXJkJyxcbiAgICAgICAgICAgIHBheWxvYWQ6IHsgdHlwZTogJ3N0cm9rZScsIHN0cm9rZSB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoZC5vayAmJiBkLmlkKSB3YlZlcnNpb25SZWYuY3VycmVudCA9IE1hdGgubWF4KHdiVmVyc2lvblJlZi5jdXJyZW50LCBkLmlkKTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9XG4gIH07XG5cbiAgY29uc3QgY2xlYXJXaGl0ZWJvYXJkID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghY29uZmlybSgnQlx1MUVBMW4gY1x1MDBGMyBjaFx1MUVBRmMgbXVcdTFFRDFuIHhcdTAwRjNhIHNcdTFFQTFjaCBiXHUxRUEzbmcgdlx1MUVCRD8gKGNoXHUxRUM5IHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nKScpKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgcmVzb3VyY2U6ICd3aGl0ZWJvYXJkJyxcbiAgICAgICAgICBwYXlsb2FkOiB7IHR5cGU6ICdjbGVhcicgfVxuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSB7XG4gICAgICAgIHNldFdiU3Ryb2tlcyhbXSk7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgICAgICBpZiAoY2FudmFzKSB7XG4gICAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIC8vIDQuIFNoYXJlZCBTaGVldCBTdGF0ZSAoOCBjb2xzIHggMTAgcm93cykgXHUyMDE0IHVwc2VydCB0XHUxRUVCbmcgXHUwMEY0LCBraFx1MDBGNG5nIHdob2xlLWRvYyBjb25mbGljdFxuICBjb25zdCBDT0xTID0gWydBJywgJ0InLCAnQycsICdEJywgJ0UnLCAnRicsICdHJywgJ0gnXTtcbiAgY29uc3QgUk9XUyA9IFsxLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCA5LCAxMF07XG4gIGNvbnN0IFtzaGVldENlbGxzLCBzZXRTaGVldENlbGxzXSA9IFJlYWN0LnVzZVN0YXRlKHt9KTtcbiAgY29uc3QgW3NoZWV0Q2FuV3JpdGUsIHNldFNoZWV0Q2FuV3JpdGVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IHNoZWV0U2F2ZVRpbWVyc1JlZiA9IFJlYWN0LnVzZVJlZih7fSk7XG4gIGNvbnN0IHNoZWV0Rm9jdXNlZENlbGxSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHNoZWV0UG9sbFJlZiA9IFJlYWN0LnVzZVJlZigwKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAnc2hlZXQnKSByZXR1cm47XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG4gICAgY29uc3QgZmV0Y2hTaGVldCA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPXNoZWV0YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2spIHtcbiAgICAgICAgICBjb25zdCBpbmNvbWluZyA9IGQucGF5bG9hZD8uY2VsbHMgfHwge307XG4gICAgICAgICAgLy8gS2hcdTAwRjRuZyBnaGkgXHUwMTExXHUwMEU4IFx1MDBGNCBcdTAxMTFhbmcgZ1x1MDBGNSBkXHUxRURGXG4gICAgICAgICAgc2V0U2hlZXRDZWxscyhwcmV2ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IHsgLi4uaW5jb21pbmcgfTtcbiAgICAgICAgICAgIGNvbnN0IGRhbmdHbyA9IHNoZWV0Rm9jdXNlZENlbGxSZWYuY3VycmVudDtcbiAgICAgICAgICAgIGlmIChkYW5nR28gJiYgcHJldltkYW5nR29dICE9PSB1bmRlZmluZWQpIG1lcmdlZFtkYW5nR29dID0gcHJldltkYW5nR29dO1xuICAgICAgICAgICAgcmV0dXJuIG1lcmdlZDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzZXRTaGVldENhbldyaXRlKGQuY2FuV3JpdGUgIT09IGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RpdmUgJiYgZC5jb2RlID09PSAnY2FwYWJpbGl0eV9vZmYnKSB7XG4gICAgICAgICAgc2V0U2hlZXRDYW5Xcml0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIGZldGNoU2hlZXQoKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGZldGNoU2hlZXQsIDMwMDApO1xuICAgIHJldHVybiAoKSA9PiB7IGFjdGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludGVydmFsKTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2VsbENoYW5nZSA9IChjZWxsS2V5LCB2YWwpID0+IHtcbiAgICBzZXRTaGVldENlbGxzKHByZXYgPT4gKHsgLi4ucHJldiwgW2NlbGxLZXldOiB2YWwgfSkpO1xuICAgIGNvbnN0IHRpbWVycyA9IHNoZWV0U2F2ZVRpbWVyc1JlZi5jdXJyZW50O1xuICAgIGlmICh0aW1lcnNbY2VsbEtleV0pIGNsZWFyVGltZW91dCh0aW1lcnNbY2VsbEtleV0pO1xuICAgIHRpbWVyc1tjZWxsS2V5XSA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgICAgcmVzb3VyY2U6ICdzaGVldCcsXG4gICAgICAgICAgICBwYXlsb2FkOiB7IGNlbGw6IGNlbGxLZXksIHZhbHVlOiB2YWwgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH0sIDgwMCk7XG4gIH07XG5cbiAgLy8gNS4gMS10by0xIFdlYlJUQyBWb2ljZSBDaGF0IFx1MjAxNCBwYWlyLWJvdW5kICh0XHUxRUQxaSBcdTAxMTFhIDEgY1x1MUVCN3AvcGhcdTAwRjJuZywgc2lnbmFsaW5nIHJpXHUwMEVBbmcgdFx1MDFCMClcbiAgY29uc3QgW3ZvaWNlSm9pbmVkLCBzZXRWb2ljZUpvaW5lZF0gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFttaWNNdXRlZCwgc2V0TWljTXV0ZWRdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7IC8vIERlZmF1bHQgT0ZGXG4gIGNvbnN0IFt2b2ljZVN0YXRlLCBzZXRWb2ljZVN0YXRlXSA9IFJlYWN0LnVzZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgY29uc3QgW3ZvaWNlTm90aWNlLCBzZXRWb2ljZU5vdGljZV0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFt2b2ljZVBhaXIsIHNldFZvaWNlUGFpcl0gPSBSZWFjdC51c2VTdGF0ZShudWxsKTsgICAgICAgLy8ge2FjdGl2ZSwgYVRlbiwgYlRlbiwgeW91SW4sIHNsb3R9XG4gIGNvbnN0IFt2b2ljZVJlcXVlc3RlZCwgc2V0Vm9pY2VSZXF1ZXN0ZWRdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbeWV1Q2F1Vm9pY2UsIHNldFlldUNhdVZvaWNlXSA9IFJlYWN0LnVzZVN0YXRlKFtdKTsgICAgIC8vIHN0YWZmOiBkYW5oIHNcdTAwRTFjaCB4aW4gcXV5XHUxRUMxblxuICBjb25zdCBwY1JlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgbG9jYWxTdHJlYW1SZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHJlbW90ZUF1ZGlvUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBsYXN0U2lnbmFsSWRSZWYgPSBSZWFjdC51c2VSZWYoMCk7XG4gIGNvbnN0IHZvaWNlUG9sbFRpbWVyUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB2b2ljZVNsb3RSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHZvaWNlSm9pbmVkUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgcGVuZGluZ0NhbmRpZGF0ZXNSZWYgPSBSZWFjdC51c2VSZWYoW10pO1xuICB2b2ljZUpvaW5lZFJlZi5jdXJyZW50ID0gdm9pY2VKb2luZWQ7XG5cbiAgY29uc3QgZHVuZ0tldE5vaVZvaWNlID0gKCkgPT4ge1xuICAgIGlmIChsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldFRyYWNrcygpLmZvckVhY2godCA9PiB0LnN0b3AoKSk7XG4gICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHBjUmVmLmN1cnJlbnQpIHtcbiAgICAgIHBjUmVmLmN1cnJlbnQuY2xvc2UoKTtcbiAgICAgIHBjUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIH1cbiAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50ID0gW107XG4gICAgc2V0TWljTXV0ZWQodHJ1ZSk7XG4gIH07XG5cbiAgLy8gUG9sbCB0clx1MUVBMW5nIHRoXHUwMEUxaSBjXHUxRUI3cCArIHRcdTAwRURuIGhpXHUxRUM3dSBjXHUxRUU3YSBwYXJ0bmVyIChzZXJ2ZXIgY2hcdTFFQzkgdHJcdTFFQTMgc2lnbmFsIGNcdTFFRTdhIG5nXHUwMUIwXHUxRUREaSB0cm9uZyBjXHUxRUI3cCkuXG4gIGNvbnN0IHBvbGxWb2ljZSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mYWN0aW9uPXZvaWNlX3BvbGwmc2F1SWQ9JHtsYXN0U2lnbmFsSWRSZWYuY3VycmVudH1gKTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSByZXR1cm47XG4gICAgICBpZiAoZC5wYWlyKSBzZXRWb2ljZVBhaXIoZC5wYWlyKTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGQueWV1Q2F1Vm9pY2UpKSBzZXRZZXVDYXVWb2ljZShkLnlldUNhdVZvaWNlKTtcbiAgICAgIGNvbnN0IHBjID0gcGNSZWYuY3VycmVudDtcbiAgICAgIGlmICghdm9pY2VKb2luZWRSZWYuY3VycmVudCB8fCAhcGMpIHJldHVybjtcbiAgICAgIGZvciAoY29uc3Qgc2lnIG9mIGQuc2lnbmFscyB8fCBbXSkge1xuICAgICAgICBsYXN0U2lnbmFsSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KGxhc3RTaWduYWxJZFJlZi5jdXJyZW50LCBzaWcuaWQpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ29mZmVyJykge1xuICAgICAgICAgICAgLy8gT2ZmZXIgbVx1MUVEQmkgaG9cdTFFQjdjIHJlLW9mZmVyIChcdTAxMTFcdTFFRDFpIHBoXHUwMUIwXHUwMUExbmcgYlx1MUVBRHQgbWljIG11XHUxRUQ5bikgXHUwMTExXHUxRUMxdSBzZXQgbFx1MUVBMWkgcmVtb3RlICsgdHJcdTFFQTMgYW5zd2VyLlxuICAgICAgICAgICAgYXdhaXQgcGMuc2V0UmVtb3RlRGVzY3JpcHRpb24obmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbihzaWcucGF5bG9hZCkpO1xuICAgICAgICAgICAgLy8gWFx1MUVBMyBjXHUwMEUxYyBjYW5kaWRhdGUgdFx1MUVEQmkgc1x1MUVEQm0gdHJcdTAxQjBcdTFFREJjIGtoaSBjXHUwMEYzIHJlbW90ZURlc2NyaXB0aW9uLlxuICAgICAgICAgICAgZm9yIChjb25zdCBjIG9mIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuYWRkSWNlQ2FuZGlkYXRlKG5ldyBSVENJY2VDYW5kaWRhdGUoYykpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGFucyA9IGF3YWl0IHBjLmNyZWF0ZUFuc3dlcigpO1xuICAgICAgICAgICAgYXdhaXQgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihhbnMpO1xuICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdhbnN3ZXInLCBwYXlsb2FkOiBhbnMgfSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdhbnN3ZXInKSB7XG4gICAgICAgICAgICBpZiAocGMuc2lnbmFsaW5nU3RhdGUgPT09ICdoYXZlLWxvY2FsLW9mZmVyJykge1xuICAgICAgICAgICAgICBhd2FpdCBwYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKHNpZy5wYXlsb2FkKSk7XG4gICAgICAgICAgICAgIGZvciAoY29uc3QgYyBvZiBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGMuYWRkSWNlQ2FuZGlkYXRlKG5ldyBSVENJY2VDYW5kaWRhdGUoYykpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50ID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ2NhbmRpZGF0ZScpIHtcbiAgICAgICAgICAgIGlmIChwYy5yZW1vdGVEZXNjcmlwdGlvbikge1xuICAgICAgICAgICAgICBhd2FpdCBwYy5hZGRJY2VDYW5kaWRhdGUobmV3IFJUQ0ljZUNhbmRpZGF0ZShzaWcucGF5bG9hZCkpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQucHVzaChzaWcucGF5bG9hZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ2xlYXZlJykge1xuICAgICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ05nXHUwMUIwXHUxRUREaSBraWEgXHUwMTExXHUwMEUzIG5nXHUxRUFGdCB2b2ljZS4nKTtcbiAgICAgICAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgZHVuZ0tldE5vaVZvaWNlKCk7XG4gICAgICAgICAgICBzZXRWb2ljZUpvaW5lZChmYWxzZSk7XG4gICAgICAgICAgICB2b2ljZVNsb3RSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgc2lnbmFsIGxcdTFFRDdpICovIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gUG9sbCBjaFx1MUVBMXkga2hpIHRhYiB2b2ljZSBtXHUxRURGICh4ZW0gdHJcdTFFQTFuZyB0aFx1MDBFMWkgY1x1MUVCN3ApIGhvXHUxRUI3YyBcdTAxMTFhbmcgdHJvbmcgY1x1MUVCN3AuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICd2b2ljZScgJiYgIXZvaWNlSm9pbmVkKSByZXR1cm47XG4gICAgcG9sbFZvaWNlKCk7XG4gICAgdm9pY2VQb2xsVGltZXJSZWYuY3VycmVudCA9IHNldEludGVydmFsKHBvbGxWb2ljZSwgMTUwMCk7XG4gICAgcmV0dXJuICgpID0+IHsgaWYgKHZvaWNlUG9sbFRpbWVyUmVmLmN1cnJlbnQpIGNsZWFySW50ZXJ2YWwodm9pY2VQb2xsVGltZXJSZWYuY3VycmVudCk7IH07XG4gIH0sIFtwaG9uZy5pZCwgZG9ja1RhYiwgdm9pY2VKb2luZWRdKTtcblxuICBjb25zdCBqb2luVm9pY2UgPSBhc3luYyAoKSA9PiB7XG4gICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMGFuZyB4aW4gY2hcdTFFRDcgdHJvbmcgY1x1MUVCN3Agdm9pY2UuLi4nKTtcbiAgICBzZXRWb2ljZVN0YXRlKCdjb25uZWN0aW5nJyk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIDEuIEdpXHUwMEUwbmggc2xvdCB0clx1MDBFQW4gc2VydmVyIHRyXHUwMUIwXHUxRURCYyAoc2VydmVyLWF1dGhvcml0YXRpdmU6IHRcdTFFRDFpIFx1MDExMWEgMSBjXHUxRUI3cCAxLTEvcGhcdTAwRjJuZylcbiAgICAgIGNvbnN0IGpvaW5SZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfam9pbicgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgam9pbkRhdGEgPSBhd2FpdCBqb2luUmVzLmpzb24oKTtcbiAgICAgIGlmICgham9pbkRhdGEub2spIHtcbiAgICAgICAgaWYgKGpvaW5EYXRhLmNvZGUgPT09ICdncmFudF9yZXF1aXJlZCcpIHtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnQlx1MUVBMW4gY1x1MUVBN24gXHUwMTExXHUwMUIwXHUxRUUzYyBjXHUxRUE1cCBxdXlcdTFFQzFuIHZvaWNlIFx1MjAxNCBoXHUwMEUzeSBiXHUxRUE1bSBcIlhpbiBxdXlcdTFFQzFuIHZvaWNlXCIuJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2Uoam9pbkRhdGEubG9pIHx8ICdLaFx1MDBGNG5nIHRoXHUxRUMzIHRoYW0gZ2lhIHZvaWNlLicpO1xuICAgICAgICB9XG4gICAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2b2ljZVNsb3RSZWYuY3VycmVudCA9IGpvaW5EYXRhLnNsb3Q7XG4gICAgICBzZXRWb2ljZUpvaW5lZCh0cnVlKTtcblxuICAgICAgLy8gMi4gWGluIG1pYyBUUlx1MDFBRlx1MUVEQUMga2hpIHRcdTFFQTFvIG9mZmVyIFx1MjAxNCB0cmFjayBwaFx1MUVBM2kgY1x1MDBGMyBzXHUxRUI1biB0cm9uZyBTRFAgbmVnb3RpYXRpb24sXG4gICAgICAvLyAgICBhZGRUcmFjayBzYXUga2hpIFx1MDExMVx1MDBFMyBiXHUxRUFGdCB0YXkgbVx1MDBFMCBraFx1MDBGNG5nIHJlbmVnb3RpYXRlIFx1MjE5MiBuZ1x1MDFCMFx1MUVERGkga2lhIGtoXHUwMEY0bmcgbmdoZSBcdTAxMTFcdTAxQjBcdTFFRTNjLlxuICAgICAgLy8gICAgTWljIGtoXHUxRURGaSBcdTAxMTFcdTFFQTd1IG11dGVkIChlbmFibGVkPWZhbHNlKSBcdTIwMTQgdXNlciB0XHUxRUYxIGJcdTFFQUR0IGJcdTFFQjFuZyBuXHUwMEZBdCBNaWMuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7IGF1ZGlvOiB0cnVlLCB2aWRlbzogZmFsc2UgfSk7XG4gICAgICAgIHN0cmVhbS5nZXRBdWRpb1RyYWNrcygpLmZvckVhY2godCA9PiB7IHQuZW5hYmxlZCA9IGZhbHNlOyB9KTtcbiAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudCA9IHN0cmVhbTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnS2hcdTAwRjRuZyB4aW4gXHUwMTExXHUwMUIwXHUxRUUzYyBtaWNybyBcdTIwMTQgYlx1MUVBMW4gY2hcdTFFQzkgbmdoZSBcdTAxMTFcdTAxQjBcdTFFRTNjLCBraFx1MDBGNG5nIG5cdTAwRjNpIFx1MDExMVx1MDFCMFx1MUVFM2MuJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIDMuIFRcdTFFQTFvIHBlZXIgY29ubmVjdGlvblxuICAgICAgY29uc3QgcGMgPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oe1xuICAgICAgICBpY2VTZXJ2ZXJzOiBbeyB1cmxzOiAnc3R1bjpzdHVuLmwuZ29vZ2xlLmNvbToxOTMwMicgfV1cbiAgICAgIH0pO1xuICAgICAgcGNSZWYuY3VycmVudCA9IHBjO1xuICAgICAgaWYgKGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRUcmFja3MoKS5mb3JFYWNoKHQgPT4gcGMuYWRkVHJhY2sodCwgbG9jYWxTdHJlYW1SZWYuY3VycmVudCkpO1xuICAgICAgfVxuXG4gICAgICBwYy5vbmljZWNhbmRpZGF0ZSA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQuY2FuZGlkYXRlKSB7XG4gICAgICAgICAgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsXG4gICAgICAgICAgICAgIHNpZ25hbFR5cGU6ICdjYW5kaWRhdGUnLFxuICAgICAgICAgICAgICBwYXlsb2FkOiBldmVudC5jYW5kaWRhdGVcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBwYy5vbnRyYWNrID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChyZW1vdGVBdWRpb1JlZi5jdXJyZW50ICYmIGV2ZW50LnN0cmVhbXNbMF0pIHtcbiAgICAgICAgICByZW1vdGVBdWRpb1JlZi5jdXJyZW50LnNyY09iamVjdCA9IGV2ZW50LnN0cmVhbXNbMF07XG4gICAgICAgICAgcmVtb3RlQXVkaW9SZWYuY3VycmVudC5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBwYy5vbmNvbm5lY3Rpb25zdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgcyA9IHBjLmNvbm5lY3Rpb25TdGF0ZTtcbiAgICAgICAgaWYgKHMgPT09ICdjb25uZWN0ZWQnKSB7XG4gICAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnY29ubmVjdGVkJyk7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MjcxMyBcdTAxMTBhbmcga1x1MUVCRnQgblx1MUVEMWkgdGhvXHUxRUExaSAxLTEgdHJcdTFFRjFjIHRpXHUxRUJGcC4nKTtcbiAgICAgICAgfSBlbHNlIGlmIChzID09PSAnZmFpbGVkJyB8fCBzID09PSAnZGlzY29ubmVjdGVkJykge1xuICAgICAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSB0aG9cdTFFQTFpIChtXHUxRUExbmcgY2hcdTFFQjduIFAyUCBuXHUxRUJGdSBraFx1MDBGNG5nIGNcdTAwRjMgVFVSTikuJyk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIDQuIFNsb3QgJ2InIChuZ1x1MDFCMFx1MUVERGkgdlx1MDBFMG8gc2F1KSB0XHUxRUExbyBvZmZlcjsgc2xvdCAnYScgY2hcdTFFREQgb2ZmZXIgdFx1MUVFQiBwb2xsLlxuICAgICAgaWYgKGpvaW5EYXRhLnNsb3QgPT09ICdiJykge1xuICAgICAgICBjb25zdCBvZmZlciA9IGF3YWl0IHBjLmNyZWF0ZU9mZmVyKCk7XG4gICAgICAgIGF3YWl0IHBjLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpO1xuICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ29mZmVyJywgcGF5bG9hZDogb2ZmZXIgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBcdTAwRTMgdlx1MDBFMG8gY1x1MUVCN3AgXHUyMDE0IFx1MDExMWFuZyBiXHUxRUFGdCB0YXkgdlx1MUVEQmkgJyArICh2b2ljZVBhaXI/LmFUZW4gfHwgJ25nXHUwMUIwXHUxRUREaSBraWEnKSArICdcdTIwMjYnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdCXHUxRUExbiBsXHUwMEUwIG5nXHUwMUIwXHUxRUREaSBcdTAxMTFcdTFFQTd1IHRpXHUwMEVBbiBcdTIwMTQgY2hcdTFFREQgdGhcdTAwRUFtIDEgbmdcdTAxQjBcdTFFRERpIHZcdTAwRTBvIHZvaWNlXHUyMDI2Jyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBzZXRWb2ljZU5vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkgdm9pY2U6ICcgKyBlcnIubWVzc2FnZSk7XG4gICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgeGluUXV5ZW5Wb2ljZSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3JlcXVlc3QnIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgZC5ncmFudGVkKSB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdCXHUxRUExbiBcdTAxMTFcdTAwRTMgXHUwMTExXHUwMUIwXHUxRUUzYyBwaFx1MDBFOXAgdm9pY2UgXHUyMDE0IGJcdTFFQTVtIFRoYW0gZ2lhLicpO1xuICAgICAgfSBlbHNlIGlmIChkLm9rKSB7XG4gICAgICAgIHNldFZvaWNlUmVxdWVzdGVkKHRydWUpO1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwXHUwMEUzIGdcdTFFRURpIHlcdTAwRUF1IGNcdTFFQTd1IFx1MjAxNCBjaFx1MUVERCBxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZyBkdXlcdTFFQzd0LicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoZC5sb2kgfHwgJ0toXHUwMEY0bmcgZ1x1MUVFRGkgXHUwMTExXHUwMUIwXHUxRUUzYyB5XHUwMEVBdSBjXHUxRUE3dS4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHsgc2V0Vm9pY2VOb3RpY2UoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpLicpOyB9XG4gIH07XG5cbiAgY29uc3QgbmdhdFZvaWNlQ2FwID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghY29uZmlybSgnTmdcdTFFQUZ0IGNcdTFFQjdwIHZvaWNlIFx1MDExMWFuZyBob1x1MUVBMXQgXHUwMTExXHUxRUQ5bmc/JykpIHJldHVybjtcbiAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2VfZW5kJyB9KVxuICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICBwb2xsVm9pY2UoKTtcbiAgfTtcblxuICBjb25zdCB0b2dnbGVNaWMgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKG1pY011dGVkKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoIWxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAvLyBNaWMgYlx1MUVDQiB0XHUxRUVCIGNoXHUxRUQxaSBsXHUwMEZBYyBqb2luIFx1MjE5MiB4aW4gbFx1MUVBMWk7IGFkZFRyYWNrIG11XHUxRUQ5biBjXHUxRUE3biByZW5lZ290aWF0ZSAob2ZmZXIgbVx1MUVEQmkpLlxuICAgICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgYXVkaW86IHRydWUsIHZpZGVvOiBmYWxzZSB9KTtcbiAgICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50ID0gc3RyZWFtO1xuICAgICAgICAgIGNvbnN0IHBjID0gcGNSZWYuY3VycmVudDtcbiAgICAgICAgICBpZiAocGMpIHtcbiAgICAgICAgICAgIHN0cmVhbS5nZXRUcmFja3MoKS5mb3JFYWNoKHRyYWNrID0+IHBjLmFkZFRyYWNrKHRyYWNrLCBzdHJlYW0pKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IG9mZmVyID0gYXdhaXQgcGMuY3JlYXRlT2ZmZXIoKTtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihvZmZlcik7XG4gICAgICAgICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnb2ZmZXInLCBwYXlsb2FkOiBvZmZlciB9KVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiByZW5lZ290aWF0aW9uIHRoXHUxRUE1dCBiXHUxRUExaSBcdTIwMTQgbmdoZSB2XHUxRUFCbiBcdTAxMTFcdTAxQjBcdTFFRTNjICovIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRBdWRpb1RyYWNrcygpLmZvckVhY2godCA9PiB7IHQuZW5hYmxlZCA9IHRydWU7IH0pO1xuICAgICAgICB9XG4gICAgICAgIHNldE1pY011dGVkKGZhbHNlKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBhbGVydCgnS2hcdTAwRjRuZyB0aFx1MUVDMyBtXHUxRURGIG1pY3JvOiAnICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldEF1ZGlvVHJhY2tzKCkuZm9yRWFjaCh0ID0+IHsgdC5lbmFibGVkID0gZmFsc2U7IH0pO1xuICAgICAgfVxuICAgICAgc2V0TWljTXV0ZWQodHJ1ZSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGxlYXZlVm9pY2UgPSAoKSA9PiB7XG4gICAgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdsZWF2ZScsIHBheWxvYWQ6IHt9IH0pXG4gICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgIGR1bmdLZXROb2lWb2ljZSgpO1xuICAgIHNldFZvaWNlSm9pbmVkKGZhbHNlKTtcbiAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICB2b2ljZVNsb3RSZWYuY3VycmVudCA9IG51bGw7XG4gICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMFx1MDBFMyBuZ1x1MUVBRnQgdm9pY2UuJyk7XG4gIH07XG5cbiAgLy8gNi4gVmlkZW8gJiBRdWV1ZSBDb25maWcgU3RhdGUgKFRhYiBjb25maWcpXG4gIGNvbnN0IFt2aWRlb01vaSwgc2V0VmlkZW9Nb2ldID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbZGFuZ0RvaVZpZGVvLCBzZXREYW5nRG9pVmlkZW9dID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbY29uZmlnTG9pLCBzZXRDb25maWdMb2ldID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbcXVldWVMaXN0LCBzZXRRdWV1ZUxpc3RdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbcXVldWVCdXN5LCBzZXRRdWV1ZUJ1c3ldID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IHRhaVF1ZXVlID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1xdWV1ZT9waG9uZ0lkPSR7cGhvbmcuaWR9JmFjdGlvbj1saXN0YCk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSBzZXRRdWV1ZUxpc3QoZC5xdWV1ZSB8fCBbXSk7XG4gICAgfSBjYXRjaCB7IH1cbiAgfTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiID09PSAnY29uZmlnJykge1xuICAgICAgdGFpUXVldWUoKTtcbiAgICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwodGFpUXVldWUsIDQwMDApO1xuICAgICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgIH1cbiAgfSwgW2RvY2tUYWIsIHBob25nLmlkXSk7XG5cbiAgY29uc3QgZG9pVmlkZW8gPSBhc3luYyAodXJsKSA9PiB7XG4gICAgY29uc3QgdSA9IFN0cmluZyh1cmwgfHwgdmlkZW9Nb2kgfHwgJycpLnRyaW0oKTtcbiAgICBpZiAoIXUgfHwgZGFuZ0RvaVZpZGVvKSByZXR1cm47XG4gICAgc2V0RGFuZ0RvaVZpZGVvKHRydWUpO1xuICAgIHNldENvbmZpZ0xvaSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXdhdGNoJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3NldF92aWRlbycsIHZpZGVvVXJsOiB1IH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSB7XG4gICAgICAgIHNldENvbmZpZ0xvaShkLmxvaSB8fCAnS2hcdTAwRjRuZyBcdTAxMTFcdTFFRDVpIFx1MDExMVx1MDFCMFx1MUVFM2MgdmlkZW8uJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRWaWRlb01vaSgnJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRDb25maWdMb2koJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXREYW5nRG9pVmlkZW8oZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBoYW5oRG9uZ1F1ZXVlID0gYXN5bmMgKGFjdGlvbiwgZXh0cmEgPSB7fSkgPT4ge1xuICAgIGlmIChxdWV1ZUJ1c3kpIHJldHVybjtcbiAgICBzZXRRdWV1ZUJ1c3kodHJ1ZSk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXF1ZXVlJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbiwgLi4uZXh0cmEgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoIWQub2spIHNldENvbmZpZ0xvaShkLmxvaSB8fCAnVGhhbyB0XHUwMEUxYyBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB0aFx1MUVBNXQgYlx1MUVBMWkuJyk7XG4gICAgICBlbHNlIGF3YWl0IHRhaVF1ZXVlKCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRDb25maWdMb2koJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRRdWV1ZUJ1c3koZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgaWQ9XCJzdHVkeS1kb2NrLWNvbnRhaW5lclwiIGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNCBmbGV4IGZsZXgtY29sIG1pbi1oLVs0MjBweF0gbGc6bWluLWgtWzQ4MHB4XSBzaGFkb3cteGxcIj5cbiAgICAgIHsvKiBTdHVkeSBEb2NrIFRhYiBOYXZpZ2F0aW9uIFx1MjAxNCBHXHUxRUNEbiBnXHUwMEUwbmcsIHRoXHUxRUE5bSBtXHUxRUY5LCBuXHUwMEZBdCBuXHUxRUQ1aSBiXHUxRUFEdCAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIHBiLTMgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIGZsZXgtd3JhcFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LWNoYXRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdjaGF0Jyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnY2hhdCdcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENBQzwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkNoYXQgcGhcdTAwRjJuZzwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1ub3Rlc1wiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ25vdGVzJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnbm90ZXMnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDREQ8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5HaGkgY2hcdTAwRkE8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktd2hpdGVib2FyZFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3doaXRlYm9hcmQnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICd3aGl0ZWJvYXJkJ1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkE4PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Qlx1MUVBM25nIHZcdTFFQkQ8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktc2hlZXRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdzaGVldCcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3NoZWV0J1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0NBPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Qlx1MUVBM25nIHRcdTAwRURuaDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS12b2ljZVwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3ZvaWNlJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAndm9pY2UnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1hbWJlci01MDAgdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMjUxLDE5MSwzNiwwLjM1KV0gYm9yZGVyIGJvcmRlci1hbWJlci00MDAvNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERjk5XHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Vm9pY2UgKDEtMSk8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktbWVtYmVyc1wiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ21lbWJlcnMnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICdtZW1iZXJzJ1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1lbWVyYWxkLTQwMCB0by10ZWFsLTUwMCB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSg1MiwyMTEsMTUzLDAuMzUpXSBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNDAwLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REM2NTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPlRoXHUwMEUwbmggdmlcdTAwRUFue3RoYW5oVmllbi5sZW5ndGggPiAwID8gYCAoJHt0aGFuaFZpZW4ubGVuZ3RofSlgIDogJyd9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIHsoY2FuQ29udHJvbCB8fCBpc1N0YWZmKSAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LWNvbmZpZ1wiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdjb25maWcnKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgICBkb2NrVGFiID09PSAnY29uZmlnJ1xuICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLXZpb2xldC01MDAgdG8tZnVjaHNpYS01MDAgdGV4dC13aGl0ZSBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMTM5LDkyLDI0NiwwLjM1KV0gYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzUwJ1xuICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REZBNTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+VmlkZW88L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktcXVhbi10cmlcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYigncXVhbi10cmknKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgICBkb2NrVGFiID09PSAncXVhbi10cmknXG4gICAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tdmlvbGV0LTUwMCB0by1wdXJwbGUtNTAwIHRleHQtd2hpdGUgc2hhZG93LVswXzBfMTVweF9yZ2JhKDEzOSw5MiwyNDYsMC4zNSldIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC81MCdcbiAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICA8c3Bhbj5cdTI2OTlcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlF1eVx1MUVDMW48L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogRG9jayBDb250ZW50IEJvZHkgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIHB0LTMgbWluLWgtWzMwMHB4XVwiPlxuICAgICAgICB7LyogVEFCIDE6IENIQVQgUEhcdTAwRDJORyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdjaGF0JyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBtaW4taC0wXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy15LWF1dG8gc3BhY2UteS0zIHByLTEgbWF4LWgtNzIgbGc6bWF4LWgtWzM4MHB4XSB4bDptYXgtaC1bNDQwcHhdIHRleHQteHNcIj5cbiAgICAgICAgICAgICAge3Bob25nQ2hhdC5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDAgdGV4dC1jZW50ZXIgcHktOFwiPkNoXHUwMUIwYSBjXHUwMEYzIHRpbiBuaFx1MUVBRm4gXHUyMDE0IGhcdTAwRTN5IGdcdTFFRURpIGNcdTAwRTJ1IGhcdTFFQ0ZpIGhvXHUxRUI3YyB0cmFvIFx1MDExMVx1MUVENWkgdlx1MUVDMSBiXHUwMEUwaSBnaVx1MUVBM25nITwvcD5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICBwaG9uZ0NoYXQubWFwKChtLCBpZHgpID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXttLmlkIHx8IGlkeH0gY2xhc3NOYW1lPVwidGV4dC14cyBncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG1iLTEgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwIHRleHQtWzExcHhdXCI+e20udGVuTmd1b2lHdWl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIHttLnZhaVRybyA9PT0gJ2dpYW9fdmllbicgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMFwiPkdWQ048L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgKSA6IG0ubG9wVGVuID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuMiByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8yMFwiPnttLmxvcFRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHttLnRhb0x1YyA/IG5ldyBEYXRlKG0udGFvTHVjLnJlcGxhY2UoJyAnLCAnVCcpICsgJ1onKS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JyB9KSA6ICcnfVxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICB7bS52aWRlb1RpbWVTZWMgIT0gbnVsbCAmJiBtLnZpZGVvVGltZVNlYyA+IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geWV1Q2F1VHVhKG0udmlkZW9UaW1lU2VjKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e215Q2Fwcy52aWRlb19jb250cm9sID8gJ1R1YSB2aWRlbyBjXHUxRUEzIHBoXHUwMEYybmcgdFx1MUVEQmkgbVx1MUVEMWMgblx1MDBFMHknIDogJ1R1YSB2aWRlbyBjXHUxRUU3YSBiXHUxRUExbiB0XHUxRURCaSBtXHUxRUQxYyBuXHUwMEUweSd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIGhvdmVyOmJnLXZpb2xldC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2IHtkaW5oRGFuZ0dpYXlQaHV0KG0udmlkZW9UaW1lU2VjKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAge2lzU3RhZmYgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJYb1x1MDBFMSB0aW4gbmhcdTFFQUZuIG5cdTAwRTB5IChxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZylcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNoYXQ/cGhvbmdJZD0ke3Bob25nLmlkfSZpZD0ke20uaWR9YCwgeyBtZXRob2Q6ICdERUxFVEUnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZC5vayAmJiBvblhvYVRpblBob25nKSBvblhvYVRpblBob25nKG0uaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBiXHUxRUNGIHF1YSAqLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wYWNpdHktMCBncm91cC1ob3ZlcjpvcGFjaXR5LTEwMCBweC0xIHRleHQtWzlweF0gdGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1yb3NlLTQwMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQteGwgcHgtMyBweS0yIHRleHQtc2xhdGUtMjAwIHRleHQteHMgbGVhZGluZy1yZWxheGVkIGJyZWFrLXdvcmRzXCI+XG4gICAgICAgICAgICAgICAgICAgICAge20ubm9pRHVuZ31cbiAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPGRpdiByZWY9e2NoYXRFbmRSZWZ9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVNlbmRSb29tQ2hhdH0gY2xhc3NOYW1lPVwicHQtMyBib3JkZXItdCBib3JkZXItd2hpdGUvMTAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbXQtYXV0b1wiPlxuICAgICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICBpZD1cImlucHV0LXBob25nLWNoYXRcIlxuICAgICAgICAgICAgICAgIHJvd3M9ezF9XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e2NvUXV5ZW4oJ2NoYXQnKSA/ICdOaFx1MUVBRm4gdGluIHRyb25nIHBoXHUwMEYybmcgaFx1MUVDRGMuLi4gKHRpbiBuaFx1MUVBRm4gdFx1MUVGMSBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbyBoaVx1MUVDN24gdFx1MUVBMWkpJyA6ICdDaGF0IFx1MDExMWFuZyBiXHUxRUNCIHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nIGtoXHUwMEYzYSd9XG4gICAgICAgICAgICAgICAgdmFsdWU9e2NoYXRJbnB1dH1cbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNvUXV5ZW4oJ2NoYXQnKX1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRDaGF0SW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25TdGFydD17KCkgPT4geyBjaGF0Q29tcG9zaW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ9eygpID0+IHsgY2hhdENvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7IH19XG4gICAgICAgICAgICAgICAgb25LZXlEb3duPXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiAhZS5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5uYXRpdmVFdmVudD8uaXNDb21wb3NpbmcgfHwgY2hhdENvbXBvc2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlU2VuZFJvb21DaGF0KCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBtYXhMZW5ndGg9ezUwMH1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBweC0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS82MCByZXNpemUtbm9uZSBtaW4taC1bMzhweF0gbWF4LWgtMjQgZGlzYWJsZWQ6b3BhY2l0eS00MFwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1zZW5kLXBob25nLWNoYXRcIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXshY2hhdElucHV0LnRyaW0oKSB8fCBjaGF0U2VuZGluZyB8fCAhY29RdXllbignY2hhdCcpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMiByb3VuZGVkLXhsIGJnLVsjMDBGMkZFXSBob3ZlcjpiZy1bIzAwZTFlY10gdGV4dC1ibGFjayB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS0zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIEdcdTFFRURpXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgMjogR0hJIENIXHUwMERBIENcdTFFRDhORyBUXHUwMEMxQyBcdTIwMTQgZW50cnkgYXBwZW5kLCBjXHUwMEYzIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ25vdGVzJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMlwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgPHNwYW4+R2hpIGNoXHUwMEZBIGNodW5nIGNcdTFFRTdhIHBoXHUwMEYybmcgXHUyMDE0IG1cdTFFRDdpIG5nXHUwMUIwXHUxRUREaSB0aFx1MDBFQW0gbVx1MUVEOXQgZFx1MDBGMm5nLCBjXHUwMEYzIHRoXHUxRUMzIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvPC9zcGFuPlxuICAgICAgICAgICAgICB7bm90ZXNOb3RpY2UgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1yb3NlLTMwMCBmb250LWJvbGRcIj57bm90ZXNOb3RpY2V9PC9zcGFuPn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHNwYWNlLXktMiBwci0xIG1heC1oLTY0IG1pbi1oLVsxODBweF0gYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTIuNVwiPlxuICAgICAgICAgICAgICB7bm90ZXNMaXN0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCB0ZXh0LWNlbnRlciBweS04XCI+Q2hcdTAxQjBhIGNcdTAwRjMgZ2hpIGNoXHUwMEZBIFx1MjAxNCB0aFx1MDBFQW0gZFx1MDBGMm5nIFx1MDExMVx1MUVBN3UgdGlcdTAwRUFuIGNobyBjXHUxRUEzIHBoXHUwMEYybmcuPC9wPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIG5vdGVzTGlzdC5tYXAoKG4pID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtuLmlkfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLXN0YXJ0IGdhcC0yIGdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtNDAwXCI+e24udGVufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtuLnZpZGVvVGltZVNlYyAhPSBudWxsICYmIG4udmlkZW9UaW1lU2VjID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB5ZXVDYXVUdWEobi52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIGhvdmVyOmJnLXZpb2xldC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYge2RpbmhEYW5nR2lheVBodXQobi52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNjAwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7bi50YW9MdWMgPyBuZXcgRGF0ZShuLnRhb0x1Yy5yZXBsYWNlKCcgJywgJ1QnKSArICdaJykudG9Mb2NhbGVUaW1lU3RyaW5nKFtdLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSkgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMjAwIGxlYWRpbmctcmVsYXhlZCBicmVhay13b3Jkc1wiPntuLm5vaUR1bmd9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgeyhuLmN1YVRvaSB8fCBpc1N0YWZmKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB4b2FHaGlDaHUobi5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlhvXHUwMEUxIGdoaSBjaFx1MDBGQVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcGFjaXR5LTAgZ3JvdXAtaG92ZXI6b3BhY2l0eS0xMDAgdGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1yb3NlLTQwMCB0ZXh0LVsxMHB4XSBweC0xIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHtub3Rlc0NhbldyaXRlID8gKFxuICAgICAgICAgICAgICA8Zm9ybVxuICAgICAgICAgICAgICAgIG9uU3VibWl0PXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIGlmICghZS5uYXRpdmVFdmVudD8uaXNDb21wb3NpbmcgJiYgIW5vdGVDb21wb3NpbmdSZWYuY3VycmVudCkgdGhlbUdoaUNodSgpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICBpZD1cInN0dWR5LW5vdGUtaW5wdXRcIlxuICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e25vdGVJbnB1dH1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldE5vdGVJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ9eygpID0+IHsgbm90ZUNvbXBvc2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ9eygpID0+IHsgbm90ZUNvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7IH19XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlRoXHUwMEVBbSBnaGkgY2hcdTAwRkEgY2hvIHBoXHUwMEYybmcuLi5cIlxuICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXsxMDAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTAgcm91bmRlZC14bCBweC0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmVcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXROb3RlV2l0aFRpbWUodiA9PiAhdil9XG4gICAgICAgICAgICAgICAgICB0aXRsZT17bm90ZVdpdGhUaW1lID8gJ1x1MDExMGFuZyBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbyB2XHUwMEUwbyBnaGkgY2hcdTAwRkEnIDogJ0toXHUwMEY0bmcgZ1x1MUVBRm4gbVx1MUVEMWMgdmlkZW8nfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtub3RlV2l0aFRpbWUgPyAnYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyLXZpb2xldC01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS01MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAgICAgIFx1MjNGMVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tYWRkLW5vdGVcIlxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFub3RlSW5wdXQudHJpbSgpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIHJvdW5kZWQteGwgYmctWyMwMEYyRkVdIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJsYWNrIGRpc2FibGVkOm9wYWNpdHktMzBcIj5cbiAgICAgICAgICAgICAgICAgIFRoXHUwMEVBbVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LWFtYmVyLTMwMC84MCB0ZXh0LWNlbnRlciBweS0xXCI+XHVEODNEXHVERDEyIEdoaSBjaFx1MDBGQSBcdTAxMTFhbmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSBjaFx1MUVDOSB4ZW0gXHUyMDE0IHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nIFx1MDExMVx1MDBFMyBraFx1MDBGM2EuPC9wPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDM6IEJcdTFFQTJORyBWXHUxRUJDIENcdTFFRDhORyBUXHUwMEMxQyAoU0hBUkVEIFdISVRFQk9BUkQpICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ3doaXRlYm9hcmQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0yXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBmbGV4LXdyYXAgdGV4dC14cyBwYi0xXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLXBlblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRXYlRvb2woJ3BlbicpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JUb29sID09PSAncGVuJyA/ICdiZy1bIzAwRjJGRV0gdGV4dC1ibGFjaycgOiAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAnfWB9PlxuICAgICAgICAgICAgICAgICAgXHUyNzBGXHVGRTBGIEJcdTAwRkF0IHZcdTFFQkRcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLWVyYXNlclwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRXYlRvb2woJ2VyYXNlcicpfVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMi41IHB5LTEgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JUb29sID09PSAnZXJhc2VyJyA/ICdiZy1yb3NlLTUwMCB0ZXh0LXdoaXRlJyA6ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCd9YH0+XG4gICAgICAgICAgICAgICAgICBcdUQ4M0VcdURERjkgVFx1MUVBOXlcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIG1sLTJcIj5cbiAgICAgICAgICAgICAgICAgIHtbJyMwMEYyRkUnLCAnI0ZGQjgwMCcsICcjRjQzRjVFJywgJyNGRkZGRkYnXS5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e2N9XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF3YkNhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0V2JDb2xvcihjKTsgc2V0V2JUb29sKCdwZW4nKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTUgaC01IHJvdW5kZWQtZnVsbCBib3JkZXIgZGlzYWJsZWQ6b3BhY2l0eS00MCAke3diQ29sb3IgPT09IGMgJiYgd2JUb29sID09PSAncGVuJyA/ICdzY2FsZS0xMTAgYm9yZGVyLXdoaXRlIHJpbmctMiByaW5nLWN5YW4tNDAwJyA6ICdib3JkZXItdHJhbnNwYXJlbnQnfWB9XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogYyB9fVxuICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtjfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICB7aXNTdGFmZiAmJiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi13Yi1jbGVhclwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtjbGVhcldoaXRlYm9hcmR9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXdoaXRlLzUgaG92ZXI6Ymctcm9zZS01MDAvMjAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQteHMgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICBYXHUwMEYzYSBiXHUxRUEzbmdcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBvdmVyZmxvdy1oaWRkZW4gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcmVsYXRpdmUgdG91Y2gtbm9uZSBtaW4taC1bMjIwcHhdXCI+XG4gICAgICAgICAgICAgIHshd2JDYW5Xcml0ZSAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIHotMTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctYmxhY2svNDAgdGV4dC1bMTFweF0gdGV4dC1hbWJlci0zMDAvOTAgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTIgQlx1MUVBM25nIHZcdTFFQkQgXHUwMTExYW5nIFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgY2hcdTFFQzkgeGVtXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDxjYW52YXNcbiAgICAgICAgICAgICAgICBpZD1cInN0dWR5LXdoaXRlYm9hcmQtY2FudmFzXCJcbiAgICAgICAgICAgICAgICByZWY9e2NhbnZhc1JlZn1cbiAgICAgICAgICAgICAgICB3aWR0aD17NjQwfVxuICAgICAgICAgICAgICAgIGhlaWdodD17MzIwfVxuICAgICAgICAgICAgICAgIG9uTW91c2VEb3duPXt3YkNhbldyaXRlID8gc3RhcnREcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uTW91c2VNb3ZlPXt3YkNhbldyaXRlID8gZHJhd01vdmUgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZVVwPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaFN0YXJ0PXt3YkNhbldyaXRlID8gc3RhcnREcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uVG91Y2hNb3ZlPXt3YkNhbldyaXRlID8gZHJhd01vdmUgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaEVuZD17d2JDYW5Xcml0ZSA/IHN0b3BEcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBoLWZ1bGwgJHt3YkNhbldyaXRlID8gJ2N1cnNvci1jcm9zc2hhaXInIDogJ2N1cnNvci1ub3QtYWxsb3dlZCd9YH1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNDogQlx1MUVBMk5HIFRcdTAwQ0ROSCBDXHUxRUQ4TkcgVFx1MDBDMUMgKFNIQVJFRCBTSEVFVCA4eDEwKSAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdzaGVldCcgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTIgb3ZlcmZsb3cteC1hdXRvXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICAgIEJcdTFFQTNuZyB0XHUwMEVEbmggcGhcdTAwRTJuIHRcdTAwRURjaCBzXHUxRUQxIGxpXHUxRUM3dSAvIG1cdTFFRDFjIHRoXHUxRUREaSBnaWFuIGhcdTFFQ0RjIHRcdTFFQURwIChMXHUwMUIwdSB0XHUxRUYxIFx1MDExMVx1MUVEOW5nKVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy1hdXRvIG1heC1oLTcyIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBiZy1bIzBCMEUxNF1cIj5cbiAgICAgICAgICAgICAgPHRhYmxlIGlkPVwic3R1ZHktc2hlZXQtdGFibGVcIiBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC14cyB0ZXh0LXNsYXRlLTMwMCBib3JkZXItY29sbGFwc2VcIj5cbiAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItYiBib3JkZXItd2hpdGUvMTAgZm9udC1tb25vXCI+XG4gICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJ3LTggcC0xIHRleHQtY2VudGVyIGJvcmRlci1yIGJvcmRlci13aGl0ZS8xMCB0ZXh0LVsxMHB4XVwiPiM8L3RoPlxuICAgICAgICAgICAgICAgICAgICB7Q09MUy5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgPHRoIGtleT17Y30gY2xhc3NOYW1lPVwicC0xLjUgdGV4dC1jZW50ZXIgYm9yZGVyLXIgYm9yZGVyLXdoaXRlLzEwIG1pbi13LVs3MHB4XSB0ZXh0LVsxMXB4XSBmb250LWJvbGQgdGV4dC1jeWFuLTMwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge2N9XG4gICAgICAgICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAge1JPV1MubWFwKHIgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8dHIga2V5PXtyfSBjbGFzc05hbWU9XCJib3JkZXItYiBib3JkZXItd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS9bMC4wMl1cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0xIHRleHQtY2VudGVyIGJnLXdoaXRlLzUgdGV4dC1zbGF0ZS01MDAgZm9udC1tb25vIHRleHQtWzEwcHhdIGJvcmRlci1yIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3J9XG4gICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICB7Q09MUy5tYXAoYyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjZWxsS2V5ID0gYCR7Y30ke3J9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBrZXk9e2NlbGxLZXl9IGNsYXNzTmFtZT1cInAtMCBib3JkZXItciBib3JkZXItd2hpdGUvNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS1jZWxsPXtjZWxsS2V5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3NoZWV0Q2VsbHNbY2VsbEtleV0gfHwgJyd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFkT25seT17IXNoZWV0Q2FuV3JpdGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkZvY3VzPXsoKSA9PiB7IHNoZWV0Rm9jdXNlZENlbGxSZWYuY3VycmVudCA9IGNlbGxLZXk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IHsgc2hlZXRGb2N1c2VkQ2VsbFJlZi5jdXJyZW50ID0gbnVsbDsgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNoZWV0Q2FuV3JpdGUgJiYgaGFuZGxlQ2VsbENoYW5nZShjZWxsS2V5LCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgYmctdHJhbnNwYXJlbnQgcHgtMiBweS0xIHRleHQteHMgdGV4dC13aGl0ZSBmb2N1czpiZy1bIzE1MUEyM10gZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLVsjMDBGMkZFXSAkeyFzaGVldENhbldyaXRlID8gJ29wYWNpdHktNjAgY3Vyc29yLW5vdC1hbGxvd2VkJyA6ICcnfWB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRBQiA1OiAxLVRPLTEgV0VCUlRDIFZPSUNFIFx1MjAxNCBwYWlyLWJvdW5kLCBjXHUwMEYzIHhpbiBxdXlcdTFFQzFuICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ3ZvaWNlJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC02IHRleHQtY2VudGVyIGdhcC00XCI+XG4gICAgICAgICAgICA8YXVkaW8gcmVmPXtyZW1vdGVBdWRpb1JlZn0gYXV0b1BsYXkgLz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xNiBoLTE2IHJvdW5kZWQtM3hsIGJnLWFtYmVyLTQwMC8xNSBib3JkZXIgYm9yZGVyLWFtYmVyLTQwMC8zMCB0ZXh0LWFtYmVyLTQwMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LTN4bCBzaGFkb3ctWzBfMF8yMHB4X3JnYmEoMjQ1LDE1OCwxMSwwLjIpXVwiPlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcdUZFMEZcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlXCI+VGhvXHUxRUExaSBUclx1MUVGMWMgVGlcdTFFQkZwIDEtMSBUcm9uZyBQaFx1MDBGMm5nPC9oND5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBtYXgtdy14cyBtdC0xXCI+XG4gICAgICAgICAgICAgICAgTVx1MUVEN2kgcGhcdTAwRjJuZyB0XHUxRUQxaSBcdTAxMTFhIG1cdTFFRDl0IGNcdTFFQjdwIHZvaWNlIDEtMS4gTWljcm8gbVx1MUVCN2MgXHUwMTExXHUxRUNCbmggdFx1MUVBRnQga2hpIGNoXHUwMUIwYSBiXHUxRUFEdC5cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBUclx1MUVBMW5nIHRoXHUwMEUxaSBjXHUxRUI3cCBoaVx1MUVDN24gdFx1MUVBMWkgKi99XG4gICAgICAgICAgICB7dm9pY2VQYWlyPy5hY3RpdmUgIT09IHVuZGVmaW5lZCAmJiAoXG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBiZy13aGl0ZS81IHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICAgIHt2b2ljZVBhaXI/LmFUZW4gPyBgJHt2b2ljZVBhaXIuYVRlbn0ke3ZvaWNlUGFpci5iVGVuID8gJyBcdTIxOTQgJyArIHZvaWNlUGFpci5iVGVuIDogJyBcdTAwQjcgXHUwMTExYW5nIGNoXHUxRUREIG5nXHUwMUIwXHUxRUREaSB0aFx1MUVFOSAyJ31gIDogJ0NoXHUwMUIwYSBjXHUwMEYzIGNcdTFFQjdwIHZvaWNlIG5cdTAwRTBvJ31cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyBmbGV4LXdyYXAganVzdGlmeS1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgeyF2b2ljZUpvaW5lZCA/IChcbiAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAge2NvUXV5ZW4oJ3ZvaWNlJykgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1qb2luXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtqb2luVm9pY2V9XG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZvaWNlUGFpcj8uYWN0aXZlICYmICF2b2ljZVBhaXI/LnlvdUlufVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMi41IHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1vcmFuZ2UtNTAwIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIHNoYWRvdy1sZyBob3ZlcjpvcGFjaXR5LTkwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3ZvaWNlUGFpcj8uYWN0aXZlID8gJ1x1MDExMGFuZyBjXHUwMEYzIGNcdTFFQjdwIHZvaWNlIGtoXHUwMEUxYycgOiB2b2ljZVBhaXI/LmFUZW4gPyAnVlx1MDBFMG8gY1x1MUVCN3Agdlx1MUVEQmkgJyArIHZvaWNlUGFpci5hVGVuIDogJ1RoYW0gZ2lhIHZvaWNlJ31cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2UtcmVxdWVzdFwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17eGluUXV5ZW5Wb2ljZX1cbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dm9pY2VSZXF1ZXN0ZWR9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNSBweS0yLjUgcm91bmRlZC14bCBiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTIwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IGZvbnQtYm9sZCB0ZXh0LXhzIGhvdmVyOmJnLXdoaXRlLzE1IHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7dm9pY2VSZXF1ZXN0ZWQgPyAnXHUyM0YzIFx1MDExMGFuZyBjaFx1MUVERCBkdXlcdTFFQzd0XHUyMDI2JyA6ICdcdUQ4M0RcdURFNEIgWGluIHF1eVx1MUVDMW4gdm9pY2UnfVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLXRvZ2dsZS1taWNcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVNaWN9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTQgcHktMi41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke21pY011dGVkID8gJ2JnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOmJnLXdoaXRlLzE1JyA6ICdiZy1lbWVyYWxkLTUwMCB0ZXh0LWJsYWNrJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+e21pY011dGVkID8gJ1x1RDgzRFx1REQwNyBCXHUxRUFEdCBNaWMnIDogJ1x1RDgzQ1x1REY5OVx1RkUwRiBNaWMgXHUwMTEwYW5nIEJcdTFFQUR0J308L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLWxlYXZlXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17bGVhdmVWb2ljZX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8yMCB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMzAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgUlx1MUVERGkgdm9pY2VcbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICB7aXNTdGFmZiAmJiB2b2ljZVBhaXI/LmFUZW4gJiYgIXZvaWNlUGFpcj8ueW91SW4gJiYgKFxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2UtZW5kXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e25nYXRWb2ljZUNhcH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMi41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzI1IHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzIwIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICBOZ1x1MUVBRnQgY1x1MUVCN3Agdm9pY2VcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogU3RhZmY6IGRhbmggc1x1MDBFMWNoIHhpbiBxdXlcdTFFQzFuIHZvaWNlICovfVxuICAgICAgICAgICAge2lzU3RhZmYgJiYgeWV1Q2F1Vm9pY2UubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIG1heC13LXNtIGJnLXdoaXRlLzUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtMi41IHRleHQtbGVmdFwiPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdGV4dC1hbWJlci0zMDAgbWItMS41XCI+XHUwMTEwYW5nIHhpbiBxdXlcdTFFQzFuIHZvaWNlPC9wPlxuICAgICAgICAgICAgICAgIHt5ZXVDYXVWb2ljZS5tYXAociA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17ci5raG9hfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIHB5LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0yMDAgZm9udC1zZW1pYm9sZCBmbGV4LTEgdHJ1bmNhdGVcIj57ci50ZW4gfHwgJ1RoXHUwMEUwbmggdmlcdTAwRUFuJ308L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHIua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246IHRydWUgfSk7IGlmIChkPy5vaykgc2V0WWV1Q2F1Vm9pY2UocHJldiA9PiBwcmV2LmZpbHRlcih4ID0+IHgua2hvYSAhPT0gci5raG9hKSk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1lbWVyYWxkLTUwMC8yMCB0ZXh0LWVtZXJhbGQtMzAwIGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLWVtZXJhbGQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgRHV5XHUxRUM3dFxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHsgY29uc3QgZCA9IGF3YWl0IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogci5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogZmFsc2UgfSk7IGlmIChkPy5vaykgc2V0WWV1Q2F1Vm9pY2UocHJldiA9PiBwcmV2LmZpbHRlcih4ID0+IHgua2hvYSAhPT0gci5raG9hKSk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1yb3NlLTUwMC8xNSB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMjUgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgVFx1MUVFQiBjaFx1MUVEMWlcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICB7dm9pY2VOb3RpY2UgJiYgKFxuICAgICAgICAgICAgICA8cCBpZD1cInZvaWNlLXN0YXR1cy1ub3RpY2VcIiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIGZvbnQtbW9ubyBiZy1ibGFjay80MCBweC0zIHB5LTEuNSByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItd2hpdGUvNVwiPlxuICAgICAgICAgICAgICAgIHt2b2ljZU5vdGljZX1cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIG1heC13LXhzXCI+XG4gICAgICAgICAgICAgICogR2hpIGNoXHUwMEZBOiBLXHUxRUJGdCBuXHUxRUQxaSB0aG9cdTFFQTFpIFAyUCB5XHUwMEVBdSBjXHUxRUE3dSBtXHUxRUExbmcga2hcdTAwRjRuZyBjaFx1MUVCN24gVURQLiBSZXN0cmljdGl2ZSBOQVQgY1x1MDBGMyB0aFx1MUVDMyBjXHUxRUE3biByZWxheSBUVVJOLlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNzogVEhcdTAwQzBOSCBWSVx1MDBDQU4gVFJPTkcgUEhcdTAwRDJORyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdtZW1iZXJzJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMyBvdmVyZmxvdy15LWF1dG8gbWF4LWgtODAgbGc6bWF4LWgtWzQyMHB4XSBwci0xXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwYi0yIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQzY1PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlRoXHUwMEUwbmggdmlcdTAwRUFuIHRyb25nIHBoXHUwMEYybmcgKHt0aGFuaFZpZW4ubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgICBcdTAxMTBhbmcgdHJcdTFFRjFjIHR1eVx1MUVCRm5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtMlwiPlxuICAgICAgICAgICAgICB7dGhhbmhWaWVuLm1hcCgodHYsIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhSG9zdCA9IHR2LmxhQ2h1UGhvbmcgPT09IDEgfHwgdHYudmFpVHJvUGhvbmcgPT09ICdob3N0JztcbiAgICAgICAgICAgICAgICBjb25zdCBsYUdWID0gdHYudmFpVHJvID09PSAnZ2lhb192aWVuJztcbiAgICAgICAgICAgICAgICBjb25zdCBsYUNvSG9zdCA9IHR2LnZhaVRyb1Bob25nID09PSAnY29ob3N0JztcbiAgICAgICAgICAgICAgICBjb25zdCBncmFudFZvaWNlID0gZ3JhbnRzLnNvbWUoZyA9PiBnLmtob2FUViA9PT0gdHYua2hvYSAmJiBnLmNhcGFiaWxpdHkgPT09ICd2b2ljZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50VmlkZW8gPSBncmFudHMuc29tZShnID0+IGcua2hvYVRWID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZpZGVvX2NvbnRyb2wnKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgIGtleT17dHYua2hvYSB8fCB0di50ZW4gfHwgaWR4fVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41IHAtMi41IHJvdW5kZWQteGwgYmctd2hpdGUvWzAuMDNdIGhvdmVyOmJnLXdoaXRlL1swLjA2XSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTggaC04IHJvdW5kZWQtZnVsbCBiZy1ncmFkaWVudC10by1iciBmcm9tLXRlYWwtNTAwLzIwIHRvLWVtZXJhbGQtNTAwLzIwIGJvcmRlciBib3JkZXItdGVhbC01MDAvMzAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC14cyBmb250LWJsYWNrIHRleHQtdGVhbC0zMDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7dHYuYXZhdGFyID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3R2LmF2YXRhcn0gYWx0PVwiXCIgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCByb3VuZGVkLWZ1bGwgb2JqZWN0LWNvdmVyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgKHR2LnRlbiB8fCAnPycpLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtMjAwIHRydW5jYXRlXCI+e3R2LnRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bGFIb3N0ICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0RcdURDNTEgSG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAge2xhR1YgJiYgIWxhSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERjkzIEdpXHUwMEUxbyB2aVx1MDBFQW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUNvSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyQjUwIENvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCBibG9jayB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3R2LmxvcFRlbiA/IGBMXHUxRURCcCAke3R2LmxvcFRlbn1gIDogKGxhR1YgPyAnR2lcdTAwRTFvIHZpXHUwMEVBbiB0clx1MDFCMFx1MUVERG5nJyA6ICdIXHUxRUNEYyBzaW5oJyl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICB7LyogTWVtYmVyIGFjdGlvbnMgblx1MUVCRnUgbFx1MDBFMCBob3N0L0dWICovfVxuICAgICAgICAgICAgICAgICAgICB7KHZhaVRyb1Bob25nID09PSAnaG9zdCcgfHwgYXV0aC51c2VyPy5pc1RlYWNoZXIpICYmICFsYUhvc3QgJiYgdHYua2hvYSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdzZXRfY29faG9zdCcsIHsga2hvYVRWOiB0di5raG9hLCBvbjogIWxhQ29Ib3N0IH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17bGFDb0hvc3QgPyAnVGh1IHF1eVx1MUVDMW4gY28taG9zdCcgOiAnQ1x1MUVBNXAgY28taG9zdCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYUNvSG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyLXZpb2xldC01MDAvNDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogIWdyYW50Vm9pY2UgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gbWljXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy02IGgtNiByb3VuZGVkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYW50Vm9pY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcdUZFMEZcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndmlkZW9fY29udHJvbCcsIG9uOiAhZ3JhbnRWaWRlbyB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDXHUxRUE1cC90aHUgcXV5XHUxRUMxbiB2aWRlb1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNiBoLTYgcm91bmRlZCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LVsxMHB4XSBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFudFZpZGVvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ibHVlLTUwMC8yMCB0ZXh0LWJsdWUtMzAwIGJvcmRlci1ibHVlLTUwMC80MCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERkE1XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlybShgS2ljayAke3R2LnRlbn0ga2hcdTFFQ0ZpIHBoXHUwMEYybmc/YCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2tpY2snLCB7IGtob2FUVjogdHYua2hvYSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkICYmICFkLm9rKSBhbGVydChkLmxvaSB8fCAnS2hcdTAwRjRuZyBraWNrIFx1MDExMVx1MDFCMFx1MUVFM2MuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIktpY2sga2hcdTFFQ0ZpIHBoXHUwMEYybmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTYgaC02IHJvdW5kZWQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTBweF0gYm9yZGVyIGJnLXJvc2UtNTAwLzEwIHRleHQtcm9zZS0zMDAgYm9yZGVyLXJvc2UtNTAwLzI1IGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9KX1cblxuICAgICAgICAgICAgICB7dGhhbmhWaWVuLmxlbmd0aCA9PT0gMCAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS04IHRleHQtc2xhdGUtNTAwIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgIENoXHUwMUIwYSBjXHUwMEYzIHRoXHUwMEUwbmggdmlcdTAwRUFuIG5cdTAwRTBvIHRyb25nIHBoXHUwMEYybmcuXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDg6IENcdTFFQTRVIEhcdTAwQ0NOSCBWSURFTyAmIEhcdTAwQzBORyBcdTAxMTBcdTFFRTJJIChIb3N0IC8gU3RhZmYpICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ2NvbmZpZycgJiYgKGNhbkNvbnRyb2wgfHwgaXNTdGFmZikgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTMuNSBvdmVyZmxvdy15LWF1dG8gbWF4LWgtODAgbGc6bWF4LWgtWzQyMHB4XSBwci0xIHRleHQteHNcIj5cbiAgICAgICAgICAgIHsvKiAxLiBcdTAxMTBcdTFFRDVpIHZpZGVvIFx1MDExMWFuZyBwaFx1MDBFMXQgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0zIGZsZXggZmxleC1jb2wgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkE1PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MDExMFx1MUVENWkgdmlkZW8gXHUwMTExYW5nIHBoXHUwMEUxdCBuZ2F5PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtY29uZmlnLXZpZGVvLW1vaVwiXG4gICAgICAgICAgICAgICAgICB0eXBlPVwidXJsXCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXt2aWRlb01vaX1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFZpZGVvTW9pKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17ZSA9PiB7IGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiB2aWRlb01vaS50cmltKCkpIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBkb2lWaWRlbygpOyB9IH19XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkRcdTAwRTFuIGxpbmsgWW91VHViZSAvIHZpZGVvIG1cdTFFREJpLi4uXCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIHB4LTIuNSBweS0xLjUgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MFwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLWNvbmZpZy1kb2ktdmlkZW9cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZG9pVmlkZW8oKX1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshdmlkZW9Nb2kudHJpbSgpIHx8IGRhbmdEb2lWaWRlb31cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQtbGcgYmctWyMwMEYyRkVdIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIGhvdmVyOmJnLVsjMDBlMWVjXSBhY3RpdmU6c2NhbGUtOTUgZGlzYWJsZWQ6b3BhY2l0eS0zMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAge2RhbmdEb2lWaWRlbyA/ICcuLi4nIDogJ1x1MjVCNiBQaFx1MDBFMXQnfVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAge2NvbmZpZ0xvaSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXJvc2UtNDAwXCI+e2NvbmZpZ0xvaX08L3A+fVxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiAyLiBIXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB2aWRlbyAoUXVldWUpICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtMyBmbGV4IGZsZXgtY29sIGdhcC0yLjVcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW5cIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHRleHQtc2xhdGUtNDAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENDQjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPkhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHZpZGVvICh7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3Quc29tZShxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykgJiYgKFxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnc2tpcCcpfVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yIHB5LTAuNSByb3VuZGVkLW1kIGJnLWFtYmVyLTUwMC8xNSB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctYW1iZXItNTAwLzI1IGRpc2FibGVkOm9wYWNpdHktNDBcIj5cbiAgICAgICAgICAgICAgICAgICAgXHUyM0VEIEJcdTFFQ0YgcXVhIC8gVGlcdTFFQkZwIHRoZW9cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBcdTAwRDQgdGhcdTAwRUFtIHZpZGVvIHZcdTAwRTBvIHF1ZXVlICovfVxuICAgICAgICAgICAgICA8UXVldWVJbnB1dFxuICAgICAgICAgICAgICAgIG9uQWRkPXsodSwgdCkgPT4gaGFuaERvbmdRdWV1ZSgnZW5xdWV1ZScsIHsgdmlkZW9Vcmw6IHUsIHRpdGxlOiB0IH0pfVxuICAgICAgICAgICAgICAgIG9uQWRkTmV4dD17KHUsIHQpID0+IGhhbmhEb25nUXVldWUoJ2FkZF9uZXh0JywgeyB2aWRlb1VybDogdSwgdGl0bGU6IHQgfSl9XG4gICAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgICAgey8qIERhbmggc1x1MDBFMWNoIHF1ZXVlICovfVxuICAgICAgICAgICAgICB7cXVldWVMaXN0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCBweS0yIHRleHQtY2VudGVyXCI+SFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdHJcdTFFRDFuZyBcdTIwMTQgdGhcdTAwRUFtIGxpbmsgdmlkZW8gXHUwMTExXHUxRUMzIHBoXHUwMEUxdCBsXHUxRUE3biBsXHUwMUIwXHUxRUUzdC48L3A+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNSBtYXgtaC00OCBvdmVyZmxvdy15LWF1dG8gcHItMVwiPlxuICAgICAgICAgICAgICAgICAge3F1ZXVlTGlzdC5tYXAoKHEsIGlkeCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17cS5pZCB8fCBpZHh9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC1sZyBwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTUgaC01IHJvdW5kZWQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTBweF0gZm9udC1ibGFjayBzaHJpbmstMCAke3EudHJhbmdUaGFpID09PSAncGxheWluZycgPyAnYmctZW1lcmFsZC01MDAvMjAgdGV4dC1lbWVyYWxkLTMwMCcgOiAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncGxheWluZycgPyAnXHUyNUI2JyA6IGlkeCArIDF9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIHtxLnRodW1iICYmIDxpbWcgc3JjPXtxLnRodW1ifSBhbHQ9XCJcIiBjbGFzc05hbWU9XCJ3LTEwIGgtNiByb3VuZGVkIG9iamVjdC1jb3ZlciBzaHJpbmstMFwiIGxvYWRpbmc9XCJsYXp5XCIgLz59XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgbWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS0yMDAgZm9udC1tZWRpdW0gdHJ1bmNhdGVcIj57cS50aXRsZSB8fCBxLnZpZGVvVXJsfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1zbGF0ZS01MDAgdHJ1bmNhdGVcIj50aFx1MDBFQW0gYlx1MUVERmkge3EuYWRkZWRCeSB8fCAnXHUyMDE0J308L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncXVldWVkJyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlBoXHUwMEUxdCBuZ2F5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdwbGF5X25vdycsIHsgaWQ6IHEuaWQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTYgaC02IHJvdW5kZWQgYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIHRleHQtWzEwcHhdIGZvbnQtYmxhY2sgaG92ZXI6YmctWyMwMEYyRkVdLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJYXHUwMEYzYSBraFx1MUVDRmkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3JlbW92ZScsIHsgaWQ6IHEuaWQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTYgaC02IHJvdW5kZWQgYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTMwMCB0ZXh0LVsxMHB4XSBmb250LWJsYWNrIGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogMy4gVFx1MDBGOXkgY2hcdTFFQ0RuIHBoXHUwMEYybmcgJiBcdTAxMTBcdTAwRjNuZyBwaFx1MDBGMm5nICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtMyBmbGV4IGZsZXgtY29sIGdhcC0yLjVcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgICAgIFx1MjY5OVx1RkUwRiBUaGFvIHRcdTAwRTFjIHBoXHUwMEYybmdcbiAgICAgICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgICAgIHsvKiBcdTAxMTBcdTFFRDVpL2JcdTFFQ0YgbVx1MUVBRHQga2hcdTFFQTl1ICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJNXHUxRUFEdCBraFx1MUVBOXUgbVx1MUVEQmkgKFx1MDExMVx1MUVDMyB0clx1MUVEMW5nID0gYlx1MUVDRilcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1jb25maWctbWF0LWtoYXUtbW9pXCJcbiAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17MTAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnB1dC1jb25maWctbWF0LWtoYXUtbW9pJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1rID0gZWw/LnZhbHVlIHx8ICcnO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gbWsudHJpbSgpXG4gICAgICAgICAgICAgICAgICAgICAgPyBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2RvaV9tYXRfa2hhdScsIHsgbWF0S2hhdU1vaTogbWsudHJpbSgpIH0pXG4gICAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2JvX21hdF9raGF1Jywge30pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZCAmJiAhZC5vaykgYWxlcnQoZC5sb2kgfHwgJ0toXHUwMEY0bmcgXHUwMTExXHUxRUQ1aSBcdTAxMTFcdTAxQjBcdTFFRTNjIG1cdTFFQUR0IGtoXHUxRUE5dS4nKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBhbGVydCgnXHUwMTEwXHUwMEUzIGNcdTFFQURwIG5oXHUxRUFEdCBtXHUxRUFEdCBraFx1MUVBOXUgcGhcdTAwRjJuZyB0aFx1MDBFMG5oIGNcdTAwRjRuZy4nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsKSBlbC52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLWFtYmVyLTUwMC8yNSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgXHUwMTEwXHUxRUQ1aSBNS1xuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogTlx1MDBGQXQgXHUwMTExXHUwMEYzbmcgcGhcdTAwRjJuZyAqL31cbiAgICAgICAgICAgICAge2RvbmdQaG9uZ0hpZW5UYWkgJiYgcGhvbmcuY2h1UGhvbmdLaG9hICE9PSAnaGUtdGhvbmcnICYmIChcbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLWNvbmZpZy1kb25nLXBob25nXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpcm0oJ0JcdTFFQTFuIGNcdTAwRjMgY2hcdTFFQUZjIGNoXHUxRUFGbiBtdVx1MUVEMW4gXHUwMTExXHUwMEYzbmcgcGhcdTAwRjJuZyBoXHUxRUNEYyBuXHUwMEUweSBraFx1MDBGNG5nPycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgZG9uZ1Bob25nSGllblRhaSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB5LTIgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xNSBob3ZlcjpiZy1yb3NlLTUwMC8yNSB0ZXh0LXJvc2UtMzAwIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERUQxPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+XHUwMTEwXHUwMEYzbmcgcGhcdTAwRjJuZyBoXHUxRUNEYyBuXHUwMEUweTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNjogUVVcdTFFQTJOIFRSXHUxRUNBIFBIXHUwMEQyTkcgKHN0YWZmIG9ubHkpIFx1MjAxNCBwb2xpY3kgbWF0cml4ICsgbWVtYmVyIGFjdGlvbnMgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAncXVhbi10cmknICYmIGlzU3RhZmYgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTMgb3ZlcmZsb3cteS1hdXRvIG1heC1oLTgwIHByLTFcIj5cbiAgICAgICAgICAgIHsvKiBRdWljayBhY3Rpb25zIHRoZW8gbVx1MDBGNCBoXHUwMEVDbmggXHUwMTExXHUwMEUzIGNoXHUxRUQxdCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNhcCBvZiBbJ25vdGVzJywgJ3doaXRlYm9hcmQnLCAnc2hlZXQnXSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiAxLCBhY2Nlc3NNb2RlOiAnc3RhZmZfb25seScgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgaG92ZXI6Ymctcm9zZS01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTIgS2hcdTAwRjNhIGNcdTFFRDluZyB0XHUwMEUxYyAoY2hcdTFFQzkgeGVtKVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2FwIG9mIFsnbm90ZXMnLCAnd2hpdGVib2FyZCcsICdzaGVldCddKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6ICdldmVyeW9uZScgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLXhsIGJnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgaG92ZXI6YmctZW1lcmFsZC01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0RcdUREMTMgTVx1MUVERiBjXHUxRUQ5bmcgdFx1MDBFMWMgY2hvIG1cdTFFQ0RpIG5nXHUwMUIwXHUxRUREaVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogUG9saWN5IG1hdHJpeCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTNcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBtYi0yXCI+Q2hcdTAwRURuaCBzXHUwMEUxY2ggY1x1MDBGNG5nIGNcdTFFRTU8L3A+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgICB7W1xuICAgICAgICAgICAgICAgICAgWyd2aWRlb19jb250cm9sJywgJ1x1MDExMGlcdTFFQzF1IGtoaVx1MUVDM24gcGhcdTAwRTF0IChwbGF5L3BhdXNlL3R1YSknXSxcbiAgICAgICAgICAgICAgICAgIFsndmlkZW9fY2hhbmdlJywgJ1x1MDExMFx1MUVENWkgdmlkZW8gXHUwMTExYW5nIHBoXHUwMEUxdCddLFxuICAgICAgICAgICAgICAgICAgWydxdWV1ZScsICdIXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB2aWRlbyddLFxuICAgICAgICAgICAgICAgICAgWydjaGF0JywgJ0NoYXQgcGhcdTAwRjJuZyddLFxuICAgICAgICAgICAgICAgICAgWydub3RlcycsICdHaGkgY2hcdTAwRkEgY2h1bmcnXSxcbiAgICAgICAgICAgICAgICAgIFsnd2hpdGVib2FyZCcsICdCXHUxRUEzbmcgdlx1MUVCRCddLFxuICAgICAgICAgICAgICAgICAgWydzaGVldCcsICdCXHUxRUEzbmcgdFx1MDBFRG5oJ10sXG4gICAgICAgICAgICAgICAgICBbJ3ZvaWNlJywgJ1ZvaWNlIDEtMSddLFxuICAgICAgICAgICAgICAgICAgWydpbnZpdGUnLCAnTVx1MUVERGkgbmdcdTAxQjBcdTFFRERpIHZcdTAwRTBvIHBoXHUwMEYybmcnXSxcbiAgICAgICAgICAgICAgICBdLm1hcCgoW2NhcCwgbmhhbl0pID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHBvbCA9IHBvbGljaWVzPy5bY2FwXSB8fCB7IGVuYWJsZWQ6IDEsIGFjY2Vzc19tb2RlOiAnc3RhZmZfb25seScgfTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtjYXB9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmbGV4LTEgdGV4dC1zbGF0ZS0zMDAgdHJ1bmNhdGVcIj57bmhhbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiBwb2wuZW5hYmxlZCA/IDAgOiAxLCBhY2Nlc3NNb2RlOiBwb2wuYWNjZXNzX21vZGUgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cG9sLmVuYWJsZWQgPyAnXHUwMTEwYW5nIGJcdTFFQUR0IFx1MjAxNCBiXHUxRUE1bSBcdTAxMTFcdTFFQzMgdFx1MUVBRnQnIDogJ1x1MDExMGFuZyB0XHUxRUFGdCBcdTIwMTQgYlx1MUVBNW0gXHUwMTExXHUxRUMzIGJcdTFFQUR0J31cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctOCBoLTQuNSBweC0wLjUgcm91bmRlZC1mdWxsIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciAke3BvbC5lbmFibGVkID8gJ2JnLWVtZXJhbGQtNTAwLzMwIGJvcmRlci1lbWVyYWxkLTUwMC80MCBqdXN0aWZ5LWVuZCcgOiAnYmctd2hpdGUvNSBib3JkZXItd2hpdGUvMTUganVzdGlmeS1zdGFydCd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTMgaC0zIHJvdW5kZWQtZnVsbCAke3BvbC5lbmFibGVkID8gJ2JnLWVtZXJhbGQtNDAwJyA6ICdiZy1zbGF0ZS01MDAnfWB9Pjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17cG9sLmFjY2Vzc19tb2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFwb2wuZW5hYmxlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0xLjUgcHktMSB0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTIwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwic3RhZmZfb25seVwiPlF1XHUxRUEzbiB0clx1MUVDQjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInNlbGVjdGVkX21lbWJlcnNcIj5NXHUxRUQ5dCBzXHUxRUQxIG5nXHUwMUIwXHUxRUREaTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImV2ZXJ5b25lXCI+TVx1MUVDRGkgbmdcdTAxQjBcdTFFRERpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgb3BhY2l0eS02MFwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmxleC0xIHRleHQtc2xhdGUtNDAwXCI+S2lcdTFFQzNtIGR1eVx1MUVDN3QgKGtpY2sveG9cdTAwRTEgdGluKTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gZm9udC1ib2xkIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHJvdW5kZWQgcHgtMS41IHB5LTAuNVwiPkxVXHUwMEQ0TiBRVVx1MUVBMk4gVFJcdTFFQ0E8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBRdVx1MUVBM24gbFx1MDBGRCB0aFx1MDBFMG5oIHZpXHUwMEVBbiAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTNcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCBtYi0yXCI+VGhcdTAwRTBuaCB2aVx1MDBFQW4gJiBxdXlcdTFFQzFuIHJpXHUwMEVBbmc8L3A+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjVcIj5cbiAgICAgICAgICAgICAgICB7KHRoYW5oVmllbiB8fCBbXSkubWFwKHR2ID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhSG9zdCA9IEJvb2xlYW4odHYubGFDaHVQaG9uZyk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUdWID0gdHYudmFpVHJvID09PSAnZ2lhb192aWVuJztcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhQ29Ib3N0ID0gdHYudmFpVHJvUGhvbmcgPT09ICdjb19ob3N0JztcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50Vm9pY2UgPSAoZ3JhbnRzIHx8IFtdKS5zb21lKGcgPT4gZy5raG9hID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZvaWNlJyAmJiBnLnRyYW5nVGhhaSA9PT0gJ2dyYW50ZWQnKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50VmlkZW8gPSAoZ3JhbnRzIHx8IFtdKS5zb21lKGcgPT4gZy5raG9hID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZpZGVvX2NvbnRyb2wnICYmIGcudHJhbmdUaGFpID09PSAnZ3JhbnRlZCcpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3R2Lmtob2EgfHwgdHYudGVufSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHRleHQteHMgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0yMDAgZm9udC1zZW1pYm9sZCB0cnVuY2F0ZSBtYXgtdy1bMTEwcHhdXCI+e3R2LnRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAge2xhSG9zdCAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtYW1iZXItNDAwIGZvbnQtYm9sZFwiPlx1MjYwNSBob3N0PC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7bGFHViAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtWyMwMEYyRkVdIGZvbnQtYm9sZFwiPkdWPC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7bGFDb0hvc3QgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXZpb2xldC0zMDAgZm9udC1ib2xkXCI+Y28taG9zdDwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAgeyFsYUhvc3QgJiYgIWxhR1YgJiYgdHYua2hvYSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtbC1hdXRvIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHsodmFpVHJvUGhvbmcgPT09ICdob3N0JyB8fCBhdXRoLnVzZXI/LmlzVGVhY2hlcikgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdzZXRfY29faG9zdCcsIHsga2hvYVRWOiB0di5raG9hLCBvbjogIWxhQ29Ib3N0IH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2xhQ29Ib3N0ID8gJ1RodSBxdXlcdTFFQzFuIGNvLWhvc3QnIDogJ0NcdTFFQTVwIGNvLWhvc3QnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2xhQ29Ib3N0ID8gJ2JnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlci12aW9sZXQtNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246ICFncmFudFZvaWNlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gdm9pY2VcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgJHtncmFudFZvaWNlID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHR2Lmtob2EsIGNhcGFiaWxpdHk6ICd2aWRlb19jb250cm9sJywgb246ICFncmFudFZpZGVvIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiB2aWRlb1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2dyYW50VmlkZW8gPyAnYmctY3lhbi01MDAvMjAgdGV4dC1jeWFuLTMwMCBib3JkZXItY3lhbi01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHsgaWYgKGNvbmZpcm0oYEtpY2sgJHt0di50ZW59IGtoXHUxRUNGaSBwaFx1MDBGMm5nP2ApKSB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2tpY2snLCB7IGtob2FUVjogdHYua2hvYSB9KTsgaWYgKGQgJiYgIWQub2spIGFsZXJ0KGQubG9pIHx8ICdLaFx1MDBGNG5nIGtpY2sgXHUwMTExXHUwMUIwXHUxRUUzYy4nKTsgfSB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiS2ljayBraFx1MUVDRmkgcGhcdTAwRjJuZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciBiZy1yb3NlLTUwMC8xMCB0ZXh0LXJvc2UtMzAwIGJvcmRlci1yb3NlLTUwMC8yNSBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgIHsodGhhbmhWaWVuIHx8IFtdKS5sZW5ndGggPT09IDAgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDBcIj5DaFx1MDFCMGEgY1x1MDBGMyB0aFx1MDBFMG5oIHZpXHUwMEVBbi48L3A+fVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogXHUwMTEwXHUxRUQ1aS9iXHUxRUNGIG1cdTFFQUR0IGtoXHUxRUE5dSBcdTIwMTQgY2hcdTFFQzkgaG9zdC9HViAqL31cbiAgICAgICAgICAgIHsodmFpVHJvUGhvbmcgPT09ICdob3N0JyB8fCBhdXRoLnVzZXI/LmlzVGVhY2hlcikgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0zIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJNXHUxRUFEdCBraFx1MUVBOXUgbVx1MUVEQmkgKFx1MDExMVx1MUVDMyB0clx1MUVEMW5nID0gYlx1MUVDRiBtXHUxRUFEdCBraFx1MUVBOXUpXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtcGhvbmctbWF0LWtoYXUtbW9pXCJcbiAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17MTAwfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnB1dC1waG9uZy1tYXQta2hhdS1tb2knKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWsgPSBlbD8udmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBtay50cmltKClcbiAgICAgICAgICAgICAgICAgICAgICA/IGF3YWl0IGhhbmhEb25nUGhvbmc/LignZG9pX21hdF9raGF1JywgeyBtYXRLaGF1TW9pOiBtay50cmltKCkgfSlcbiAgICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IGhhbmhEb25nUGhvbmc/LignYm9fbWF0X2toYXUnLCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkICYmICFkLm9rKSBhbGVydChkLmxvaSB8fCAnS2hcdTAwRjRuZyBcdTAxMTFcdTFFRDVpIFx1MDExMVx1MDFCMFx1MUVFM2MgbVx1MUVBRHQga2hcdTFFQTl1LicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWwpIGVsLnZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC1sZyBiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLWFtYmVyLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgXHUwMTEwXHUxRUQ1aSAvIEJcdTFFQ0ZcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDYW1wdXNXYXRjaFRvZ2V0aGVyKHtcbiAgcGhvbmcsXG4gIHBob25nTWluaEtob2EsXG4gIGF1dGgsXG4gIGRvbmdQaG9uZ0hpZW5UYWksXG4gIHNvTmd1b2ksXG4gIG15Q2FwcyxcbiAgdmlkZW9UaW1lUmVmLFxuICBpc1Jvb21XaWRlLFxufSkge1xuICBjb25zdCBbd2F0Y2hTdGF0ZSwgc2V0V2F0Y2hTdGF0ZV0gPSB1c2VTdGF0ZSh7XG4gICAgcGxheWluZzogZmFsc2UsXG4gICAgcG9zaXRpb25TZWNvbmRzOiAwLFxuICAgIGJhc2VQb3NpdGlvblNlY29uZHM6IDAsXG4gICAgcGxheWJhY2tSYXRlOiAxLjAsXG4gICAgcmV2aXNpb246IDEsXG4gICAgdXBkYXRlZEF0OiAnJyxcbiAgICBzZXJ2ZXJOb3c6ICcnLFxuICAgIHVwZGF0ZWRCeTogJydcbiAgfSk7XG4gIGNvbnN0IFtjYW5Db250cm9sLCBzZXRDYW5Db250cm9sXSA9IHVzZVN0YXRlKEJvb2xlYW4oYXV0aD8udXNlcj8uaXNUZWFjaGVyIHx8IHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nKSk7XG4gIGNvbnN0IFt3YXRjaENhcHMsIHNldFdhdGNoQ2Fwc10gPSB1c2VTdGF0ZSh7fSk7XG4gIGNvbnN0IGdldEluaXRpYWxWaWRlb1VybCA9ICgpID0+IHtcbiAgICBsZXQgYyA9IHt9O1xuICAgIHRyeSB7IGMgPSBwaG9uZz8uY2F1SGluaCA/IEpTT04ucGFyc2UocGhvbmcuY2F1SGluaCkgOiB7fTsgfSBjYXRjaCB7IH1cbiAgICByZXR1cm4gYy52aWRlb1VybCB8fCBwaG9uZz8udmlkZW9VcmwgfHwgJyc7XG4gIH07XG5cbiAgY29uc3QgZ2V0SW5pdGlhbFByb3ZpZGVyID0gKHUpID0+IHtcbiAgICBpZiAoIXUpIHJldHVybiAnVU5TVVBQT1JURUQnO1xuICAgIGlmIChpZFlvdXR1YmUodSkpIHJldHVybiAnWU9VVFVCRSc7XG4gICAgaWYgKGlkR29vZ2xlRHJpdmUodSkpIHJldHVybiAnR09PR0xFX0RSSVZFJztcbiAgICBpZiAobGFWaWRlb1RydWNUaWVwRmUodSkpIHJldHVybiAnTkFUSVZFX0hUTUw1JztcbiAgICByZXR1cm4gJ1VOU1VQUE9SVEVEJztcbiAgfTtcblxuICBjb25zdCBpbml0VXJsID0gZ2V0SW5pdGlhbFZpZGVvVXJsKCk7XG4gIGNvbnN0IFthY3RpdmVWaWRlb1VybCwgc2V0QWN0aXZlVmlkZW9VcmxdID0gdXNlU3RhdGUoaW5pdFVybCk7XG4gIGNvbnN0IFtwcm92aWRlciwgc2V0UHJvdmlkZXJdID0gdXNlU3RhdGUoKCkgPT4gZ2V0SW5pdGlhbFByb3ZpZGVyKGluaXRVcmwpKTtcbiAgY29uc3QgW2hhc0ludGVyYWN0ZWQsIHNldEhhc0ludGVyYWN0ZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9jYWxUaW1lLCBzZXRMb2NhbFRpbWVdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtkdXJhdGlvbiwgc2V0RHVyYXRpb25dID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtkYW5nR3VpTGVuaCwgc2V0RGFuZ0d1aUxlbmhdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9pLCBzZXRMb2ldID0gdXNlU3RhdGUoJycpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nIHx8IGF1dGg/LnVzZXI/LmlzVGVhY2hlcikge1xuICAgICAgc2V0Q2FuQ29udHJvbCh0cnVlKTtcbiAgICB9XG4gIH0sIFtwaG9uZz8uY2FuQ29udHJvbCwgcGhvbmc/LmxhQ2h1UGhvbmcsIGF1dGg/LnVzZXI/LmlzVGVhY2hlcl0pO1xuXG4gIGNvbnN0IHZpZGVvUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCB5dFBsYXllclJlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgeXRDb250YWluZXJJZCA9IGB5dC1wbGF5ZXItJHtwaG9uZy5pZH1gO1xuICBjb25zdCBpc1NlZWtpbmdSZWYgPSB1c2VSZWYoZmFsc2UpO1xuICBjb25zdCBoYXNJbnRlcmFjdGVkUmVmID0gdXNlUmVmKGZhbHNlKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBjID0ge307XG4gICAgdHJ5IHsgYyA9IHBob25nPy5jYXVIaW5oID8gSlNPTi5wYXJzZShwaG9uZy5jYXVIaW5oKSA6IHt9OyB9IGNhdGNoIHsgfVxuICAgIGNvbnN0IG5leHRVcmwgPSBjLnZpZGVvVXJsIHx8IHBob25nPy52aWRlb1VybCB8fCAnJztcbiAgICBpZiAobmV4dFVybCAmJiBuZXh0VXJsICE9PSBhY3RpdmVWaWRlb1VybCkge1xuICAgICAgc2V0QWN0aXZlVmlkZW9VcmwobmV4dFVybCk7XG4gICAgICBzZXRQcm92aWRlcihnZXRJbml0aWFsUHJvdmlkZXIobmV4dFVybCkpO1xuICAgIH1cbiAgfSwgW3Bob25nPy5jYXVIaW5oLCBwaG9uZz8udmlkZW9VcmxdKTtcblxuICBjb25zdCB2aWRlb1VybCA9IGFjdGl2ZVZpZGVvVXJsO1xuICBjb25zdCB5dElkID0gdmlkZW9VcmwgPyBpZFlvdXR1YmUodmlkZW9VcmwpIDogbnVsbDtcbiAgY29uc3QgZHJ2SWQgPSB2aWRlb1VybCA/IGlkR29vZ2xlRHJpdmUodmlkZW9VcmwpIDogbnVsbDtcbiAgY29uc3QgdHJ1Y1RpZXBVcmwgPSB2aWRlb1VybCAmJiAheXRJZCAmJiAhZHJ2SWQgJiYgbGFWaWRlb1RydWNUaWVwRmUodmlkZW9VcmwpID8gdXJsTWVkaWFGZSh2aWRlb1VybCkgOiAnJztcblxuICAvLyBLaFx1MUVERmkgdFx1MUVBMW8gWW91VHViZSBJRnJhbWUgUGxheWVyIGtoaSB5dElkIGNcdTAwRjMgZ2lcdTAwRTEgdHJcdTFFQ0IgKGhcdTFFRDcgdHJcdTFFRTMgcmV0cnkga2hpIERPTSBcdTAxMTFhbmcgcmVuZGVyKVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICgheXRJZCkgcmV0dXJuO1xuICAgIGxldCBkZXN0cm95ZWQgPSBmYWxzZTtcbiAgICBsZXQgcmV0cnlUaW1lciA9IG51bGw7XG4gICAgbGV0IGF0dGVtcHRzID0gMDtcblxuICAgIGNvbnN0IGtob2lUYW9QbGF5ZXIgPSAoKSA9PiB7XG4gICAgICBpZiAoZGVzdHJveWVkKSByZXR1cm47XG4gICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgaWYgKCFlbCkge1xuICAgICAgICBpZiAoYXR0ZW1wdHMrKyA8IDI1KSB7XG4gICAgICAgICAgcmV0cnlUaW1lciA9IHNldFRpbWVvdXQoa2hvaVRhb1BsYXllciwgODApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gRGVzdHJveSBwbGF5ZXIgY1x1MDE2OSBuXHUxRUJGdSBjXHUwMEYzXG4gICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFBsYXllclJlZi5jdXJyZW50LmRlc3Ryb3kpIHtcbiAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5kZXN0cm95KCk7IH0gY2F0Y2gge31cbiAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQgPSBuZXcgd2luZG93LllULlBsYXllcih5dENvbnRhaW5lcklkLCB7XG4gICAgICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgICAgICB2aWRlb0lkOiB5dElkLFxuICAgICAgICAgIHBsYXllclZhcnM6IHtcbiAgICAgICAgICAgIGF1dG9wbGF5OiAwLFxuICAgICAgICAgICAgY29udHJvbHM6IGNhbkNvbnRyb2wgPyAxIDogMCxcbiAgICAgICAgICAgIGRpc2FibGVrYjogY2FuQ29udHJvbCA/IDAgOiAxLFxuICAgICAgICAgICAgbW9kZXN0YnJhbmRpbmc6IDEsXG4gICAgICAgICAgICByZWw6IDAsXG4gICAgICAgICAgICBwbGF5c2lubGluZTogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICBvblJlYWR5OiAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGRlc3Ryb3llZCkgcmV0dXJuO1xuICAgICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LmdldER1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IGV2ZW50LnRhcmdldC5nZXREdXJhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChkID4gMCkgc2V0RHVyYXRpb24oZCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZyAmJiBldmVudC50YXJnZXQucGxheVZpZGVvKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHsgZXZlbnQudGFyZ2V0LnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHdhdGNoU3RhdGUucG9zaXRpb25TZWNvbmRzID4gMCAmJiBldmVudC50YXJnZXQuc2Vla1RvKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHsgZXZlbnQudGFyZ2V0LnNlZWtUbyh3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcywgdHJ1ZSk7IH0gY2F0Y2gge31cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uU3RhdGVDaGFuZ2U6IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiAhZGFuZ0d1aUxlbmggJiYgIWlzU2Vla2luZ1JlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGEgPT09IDEgJiYgIXdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaCgncGxheScsIGV2ZW50LnRhcmdldC5nZXRDdXJyZW50VGltZSgpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmRhdGEgPT09IDIgJiYgd2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oKCdwYXVzZScsIGV2ZW50LnRhcmdldC5nZXRDdXJyZW50VGltZSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignTFx1MUVEN2kga2hcdTFFREZpIHRcdTFFQTFvIFlUIFBsYXllcjonLCBlcnIpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBuYXBZb3VUdWJlSWZyYW1lQXBpKCgpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoa2hvaVRhb1BsYXllciwgNTApO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGRlc3Ryb3llZCA9IHRydWU7XG4gICAgICBpZiAocmV0cnlUaW1lcikgY2xlYXJUaW1lb3V0KHJldHJ5VGltZXIpO1xuICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQgJiYgeXRQbGF5ZXJSZWYuY3VycmVudC5kZXN0cm95KSB7XG4gICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQuZGVzdHJveSgpOyB9IGNhdGNoIHsgfVxuICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuICB9LCBbeXRJZCwgcGhvbmcuaWQsIGNhbkNvbnRyb2xdKTtcblxuICAvLyBcdTAwQzFwIGRcdTFFRTVuZyB0clx1MUVBMW5nIHRoXHUwMEUxaSBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IHRcdTFFRUIgc2VydmVyXG4gIGNvbnN0IGFwRHVuZ0RvbmdCbyA9IChzdCwgY3RybCwgcHJvdikgPT4ge1xuICAgIGlmICghc3QpIHJldHVybjtcbiAgICBjb25zdCBub3dNcyA9IERhdGUubm93KCk7XG4gICAgY29uc3QgX3NlcnZlclRpbWVNcyA9IHN0LnNlcnZlck5vdyA/IG5ldyBEYXRlKHN0LnNlcnZlck5vdykuZ2V0VGltZSgpIDogbm93TXM7XG4gICAgY29uc3QgdXBkYXRlVGltZU1zID0gc3QudXBkYXRlZEF0ID8gbmV3IERhdGUoU3RyaW5nKHN0LnVwZGF0ZWRBdCkucmVwbGFjZSgnICcsICdUJykgKyAoU3RyaW5nKHN0LnVwZGF0ZWRBdCkuaW5jbHVkZXMoJ1QnKSA/ICcnIDogJ1onKSkuZ2V0VGltZSgpIDogbm93TXM7XG4gICAgY29uc3QgZWxhcHNlZFNlYyA9IE1hdGgubWF4KDAsIChub3dNcyAtIHVwZGF0ZVRpbWVNcykgLyAxMDAwKTtcblxuICAgIGxldCB0YXJnZXRQb3MgPSBOdW1iZXIoc3QucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICB0YXJnZXRQb3MgPSBOdW1iZXIoc3QuYmFzZVBvc2l0aW9uU2Vjb25kcyB8fCAwKSArIChlbGFwc2VkU2VjICogKHN0LnBsYXliYWNrUmF0ZSB8fCAxLjApKTtcbiAgICB9XG4gICAgc2V0TG9jYWxUaW1lKE1hdGgubWF4KDAsIE1hdGguZmxvb3IodGFyZ2V0UG9zKSkpO1xuXG4gICAgaWYgKGN0cmwgJiYgaXNTZWVraW5nUmVmLmN1cnJlbnQpIHJldHVybjtcblxuICAgIGlmIChwcm92ID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICBjb25zdCB2ID0gdmlkZW9SZWYuY3VycmVudDtcbiAgICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICAgIGNvbnN0IGRyaWZ0ID0gTWF0aC5hYnModi5jdXJyZW50VGltZSAtIHRhcmdldFBvcyk7XG4gICAgICAgIGlmIChkcmlmdCA+IDEuNSkge1xuICAgICAgICAgIHYuY3VycmVudFRpbWUgPSB0YXJnZXRQb3M7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHYucGF1c2VkICYmIChoYXNJbnRlcmFjdGVkIHx8IGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCB8fCBjdHJsKSkge1xuICAgICAgICAgIHYucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodi5wbGF5YmFja1JhdGUgIT09IChzdC5wbGF5YmFja1JhdGUgfHwgMS4wKSkge1xuICAgICAgICAgIHYucGxheWJhY2tSYXRlID0gc3QucGxheWJhY2tSYXRlIHx8IDEuMDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCF2LnBhdXNlZCkgdi5wYXVzZSgpO1xuICAgICAgICBjb25zdCBkcmlmdCA9IE1hdGguYWJzKHYuY3VycmVudFRpbWUgLSBzdC5wb3NpdGlvblNlY29uZHMpO1xuICAgICAgICBpZiAoZHJpZnQgPiAwLjgpIHtcbiAgICAgICAgICB2LmN1cnJlbnRUaW1lID0gc3QucG9zaXRpb25TZWNvbmRzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcm92ID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFBsYXllclJlZi5jdXJyZW50LmdldFBsYXllclN0YXRlKSB7XG4gICAgICBjb25zdCBwID0geXRQbGF5ZXJSZWYuY3VycmVudDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGN1ciA9IHAuZ2V0Q3VycmVudFRpbWUoKSB8fCAwO1xuICAgICAgICBjb25zdCBkcmlmdCA9IE1hdGguYWJzKGN1ciAtIHRhcmdldFBvcyk7XG4gICAgICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICAgICAgaWYgKGRyaWZ0ID4gMS41KSB7XG4gICAgICAgICAgICBwLnNlZWtUbyh0YXJnZXRQb3MsIHRydWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwcyA9IHAuZ2V0UGxheWVyU3RhdGUoKTtcbiAgICAgICAgICBpZiAocHMgIT09IDEgJiYgcHMgIT09IDMgJiYgKGhhc0ludGVyYWN0ZWQgfHwgY3RybCkpIHtcbiAgICAgICAgICAgIHAucGxheVZpZGVvKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHBzID0gcC5nZXRQbGF5ZXJTdGF0ZSgpO1xuICAgICAgICAgIGlmIChwcyA9PT0gMSkgcC5wYXVzZVZpZGVvKCk7XG4gICAgICAgICAgaWYgKE1hdGguYWJzKGN1ciAtIHN0LnBvc2l0aW9uU2Vjb25kcykgPiAwLjgpIHtcbiAgICAgICAgICAgIHAuc2Vla1RvKHN0LnBvc2l0aW9uU2Vjb25kcywgdHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHsgfVxuICAgIH1cbiAgfTtcblxuICAvLyBQb2xsIHRyXHUxRUExbmcgdGhcdTAwRTFpIG1cdTAwRTF5IGNoXHUxRUU3IG1cdTFFRDdpIDIuNXNcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaFdhdGNoID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctd2F0Y2g/cGhvbmdJZD0ke3Bob25nLmlkfWApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKCFhY3RpdmUpIHJldHVybjtcbiAgICAgICAgaWYgKGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgICAgc2V0Q2FuQ29udHJvbChCb29sZWFuKGQuY2FuQ29udHJvbCkpO1xuICAgICAgICAgIGlmIChkLmNhcHMpIHNldFdhdGNoQ2FwcyhkLmNhcHMpO1xuICAgICAgICAgIHNldFByb3ZpZGVyKGQucHJvdmlkZXIgfHwgJ1VOU1VQUE9SVEVEJyk7XG4gICAgICAgICAgaWYgKGQucGhvbmc/LnZpZGVvVXJsICYmIGQucGhvbmcudmlkZW9VcmwgIT09IGFjdGl2ZVZpZGVvVXJsKSB7XG4gICAgICAgICAgICBzZXRBY3RpdmVWaWRlb1VybChkLnBob25nLnZpZGVvVXJsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXBEdW5nRG9uZ0JvKGQuc3RhdGUsIEJvb2xlYW4oZC5jYW5Db250cm9sKSwgZC5wcm92aWRlciB8fCAnVU5TVVBQT1JURUQnKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7IH1cbiAgICB9O1xuXG4gICAgZmV0Y2hXYXRjaCgpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoZmV0Y2hXYXRjaCwgMjUwMCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgfTtcbiAgfSwgW3Bob25nLmlkLCBoYXNJbnRlcmFjdGVkXSk7XG5cbiAgLy8gVGltZXIgdFx1MDEwM25nIGxvY2FsVGltZSBcdTAxMTFcdTFFQzF1IFx1MDExMVx1MUVCN24ga2hpIHBsYXlpbmdcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXdhdGNoU3RhdGUucGxheWluZykgcmV0dXJuO1xuICAgIGNvbnN0IHRpY2sgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAoIWlzU2Vla2luZ1JlZi5jdXJyZW50KSB7XG4gICAgICAgIHNldExvY2FsVGltZSh0ID0+IHQgKyAxKTtcbiAgICAgIH1cbiAgICB9LCAxMDAwKTtcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbCh0aWNrKTtcbiAgfSwgW3dhdGNoU3RhdGUucGxheWluZ10pO1xuXG4gIC8vIEdcdTFFRURpIGxcdTFFQzduaCBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIChQbGF5IC8gUGF1c2UgLyBTZWVrKVxuICBjb25zdCBndWlMZW5oID0gYXN5bmMgKGFjdGlvbiwgY3VzdG9tUG9zKSA9PiB7XG4gICAgaWYgKGRhbmdHdWlMZW5oKSByZXR1cm47XG4gICAgc2V0RGFuZ0d1aUxlbmgodHJ1ZSk7XG4gICAgc2V0TG9pKCcnKTtcblxuICAgIGxldCBwb3MgPSBjdXN0b21Qb3M7XG4gICAgaWYgKHBvcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgcG9zID0gdmlkZW9SZWYuY3VycmVudC5jdXJyZW50VGltZTtcbiAgICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5nZXRDdXJyZW50VGltZSkge1xuICAgICAgICBwb3MgPSB5dFBsYXllclJlZi5jdXJyZW50LmdldEN1cnJlbnRUaW1lKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwb3MgPSBsb2NhbFRpbWU7XG4gICAgICB9XG4gICAgfVxuICAgIHBvcyA9IE1hdGgubWF4KDAsIE51bWJlcigocG9zIHx8IDApLnRvRml4ZWQoMikpKTtcblxuICAgIC8vIENcdTFFQURwIG5oXHUxRUFEdCBsXHUxRUExYyBxdWFuIHRyXHUwMEVBbiBsb2NhbCBwbGF5ZXJcbiAgICBpZiAoYWN0aW9uID09PSAncGxheScpIHtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkgdmlkZW9SZWYuY3VycmVudC5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5wbGF5VmlkZW8pIHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdwYXVzZScpIHtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkgdmlkZW9SZWYuY3VycmVudC5wYXVzZSgpO1xuICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5wYXVzZVZpZGVvKSB5dFBsYXllclJlZi5jdXJyZW50LnBhdXNlVmlkZW8oKTtcbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ3NlZWsnKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSBwb3M7XG4gICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LnNlZWtUbykgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8ocG9zLCB0cnVlKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctd2F0Y2gnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgIGFjdGlvbixcbiAgICAgICAgICBwb3NpdGlvbjogcG9zLFxuICAgICAgICAgIGV4cGVjdGVkUmV2aXNpb246IHdhdGNoU3RhdGUucmV2aXNpb24sXG4gICAgICAgICAgcGxheWJhY2tSYXRlOiB3YXRjaFN0YXRlLnBsYXliYWNrUmF0ZSB8fCAxLjBcbiAgICAgICAgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKGQuc3RhdGUucG9zaXRpb25TZWNvbmRzIHx8IHBvcykpO1xuICAgICAgfSBlbHNlIGlmIChkLmNvbmZsaWN0ICYmIGQuc3RhdGUpIHtcbiAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgYXBEdW5nRG9uZ0JvKGQuc3RhdGUsIGNhbkNvbnRyb2wsIHByb3ZpZGVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldExvaShkLmxvaSB8fCAnTFx1MUVEN2kgY1x1MUVBRHAgbmhcdTFFQUR0IHBoXHUwMEUxdCB2aWRlby4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaSgnTVx1MUVBNXQga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldERhbmdHdWlMZW5oKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gXHUwMTEwXHUxRUQzbmcgYlx1MUVEOSB2XHUxRUNCIHRyXHUwMEVEIHZpZGVvIGhpXHUxRUM3biB0XHUxRUExaSByYSBuZ29cdTAwRTBpIFx1MDExMVx1MUVDMyBjaGF0IGdcdTFFQUZuIHRpbWVzdGFtcFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh2aWRlb1RpbWVSZWYpIHZpZGVvVGltZVJlZi5jdXJyZW50ID0gbG9jYWxUaW1lO1xuICB9LCBbbG9jYWxUaW1lLCB2aWRlb1RpbWVSZWZdKTtcblxuXG5cbiAgLy8gTmhcdTFFQURuIHlcdTAwRUF1IGNcdTFFQTd1IHR1YSB0XHUxRUVCIFN0dWR5RG9jayAoYlx1MUVBNW0gbVx1MUVEMWMgdmlkZW8gdHJvbmcgY2hhdC9naGkgY2hcdTAwRkEpLlxuICAvLyBDXHUwMEYzIHF1eVx1MUVDMW4gXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiBcdTIxOTIgcGhcdTAwRTF0IGxcdTFFQzduaCBzZWVrIGNodW5nOyBraFx1MDBGNG5nIFx1MjE5MiBjaFx1MUVDOSB0dWEgY1x1MUVFNWMgYlx1MUVEOSBwbGF5ZXIgY1x1MUVFN2EgbVx1MDBFQ25oLlxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IG9uU2Vla1JlcSA9IChlKSA9PiB7XG4gICAgICBpZiAoZS5kZXRhaWw/LnBob25nSWQgIT09IHBob25nLmlkKSByZXR1cm47XG4gICAgICBjb25zdCBzZWMgPSBNYXRoLm1heCgwLCBOdW1iZXIoZS5kZXRhaWwuc2VjKSB8fCAwKTtcbiAgICAgIGlmIChjYW5Db250cm9sKSB7XG4gICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBzZWMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lID0gc2VjO1xuICAgICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LnNlZWtUbykgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8oc2VjLCB0cnVlKTtcbiAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3Ioc2VjKSk7XG4gICAgICB9XG4gICAgfTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc3Itc2VlaycsIG9uU2Vla1JlcSk7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdzci1zZWVrJywgb25TZWVrUmVxKTtcbiAgfSwgW3Bob25nLmlkLCBjYW5Db250cm9sLCBwcm92aWRlciwgd2F0Y2hTdGF0ZS5yZXZpc2lvbl0pO1xuXG4gIGNvbnN0IGhhbmRsZVN0YXJ0Vmlld2luZyA9ICgpID0+IHtcbiAgICBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHNldEhhc0ludGVyYWN0ZWQodHJ1ZSk7XG4gICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICBjb25zdCB2ID0gdmlkZW9SZWYuY3VycmVudDtcbiAgICAgIGNvbnN0IHAgPSB2LnBsYXkoKTtcbiAgICAgIGlmIChwICYmIHR5cGVvZiBwLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcC50aGVuKCgpID0+IHtcbiAgICAgICAgICBpZiAoIXdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICAgICAgdi5wYXVzZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5wbGF5VmlkZW8pIHtcbiAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcpIHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC00IG1pbi13LTAgdy1mdWxsXCI+XG4gICAgICB7LyogS2h1bmcgcGhcdTAwRTF0IHZpZGVvIGNoXHUwMEVEbmggKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIHctZnVsbCBhc3BlY3QtdmlkZW8gYmctYmxhY2sgcm91bmRlZC0yeGwgb3ZlcmZsb3ctaGlkZGVuIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LTJ4bFwiPlxuICAgICAgICB7LyogT3ZlcmxheSBBdXRvcGxheSAvIEdlc3R1cmUgY2hvIG5nXHUwMUIwXHUxRUREaSB4ZW0gKi99XG4gICAgICAgIHshaGFzSW50ZXJhY3RlZCAmJiAhY2FuQ29udHJvbCAmJiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyB8fCBwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScpICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgei0yMCBiZy1ibGFjay83NSBiYWNrZHJvcC1ibHVyLXNtIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNCB0ZXh0LWNlbnRlciBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTE0IGgtMTQgcm91bmRlZC1mdWxsIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LTJ4bCBtYi0zIHNoYWRvdy1bMF8wXzI1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGFuaW1hdGUtcHVsc2VcIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERkFDXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlIG1iLTFcIj5YZW0gQ2h1bmcgQ1x1MDBGOW5nIFBoXHUwMEYybmc8L3A+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIG1heC13LXhzIG1iLTRcIj5cbiAgICAgICAgICAgICAgQlx1MUVBNW0gblx1MDBGQXQgYlx1MDBFQW4gZFx1MDFCMFx1MUVEQmkgXHUwMTExXHUxRUMzIGNcdTFFQTVwIHF1eVx1MUVDMW4gXHUwMEUybSB0aGFuaCB2XHUwMEUwIGNcdTAwRjluZyB0aGVvIGRcdTAwRjVpIHRpbWVsaW5lIHZcdTFFREJpIGNoXHUxRUU3IHBoXHUwMEYybmcuXG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiYnRuLXZpZXdlci1zdGFydC13YXRjaFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVTdGFydFZpZXdpbmd9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMi41IHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzNCODJGNl0gdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQteHMgc2hhZG93LWxnIGhvdmVyOm9wYWNpdHktOTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MjVCNjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVBRnQgXHUwMTExXHUxRUE3dSB4ZW0gY1x1MDBGOW5nIHBoXHUwMEYybmc8L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVmlkZW8gZWxlbWVudHMgdGhlbyBwcm92aWRlciAqL31cbiAgICAgICAge3l0SWQgPyAoXG4gICAgICAgICAgPGRpdiBrZXk9e2B5dC13cmFwLSR7cGhvbmcuaWR9LSR7eXRJZH1gfSBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPXt5dENvbnRhaW5lcklkfSBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsXCIgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IGRydklkID8gKFxuICAgICAgICAgIDxpZnJhbWVcbiAgICAgICAgICAgIHNyYz17YGh0dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS9maWxlL2QvJHtkcnZJZH0vcHJldmlld2B9XG4gICAgICAgICAgICB0aXRsZT17cGhvbmcudGVufVxuICAgICAgICAgICAgYWxsb3c9XCJhdXRvcGxheTsgZnVsbHNjcmVlblwiXG4gICAgICAgICAgICBhbGxvd0Z1bGxTY3JlZW5cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGxcIlxuICAgICAgICAgIC8+XG4gICAgICAgICkgOiB0cnVjVGllcFVybCA/IChcbiAgICAgICAgICA8dmlkZW9cbiAgICAgICAgICAgIHJlZj17dmlkZW9SZWZ9XG4gICAgICAgICAgICBzcmM9e3RydWNUaWVwVXJsfVxuICAgICAgICAgICAgcGxheXNJbmxpbmVcbiAgICAgICAgICAgIGRhdGEtdGVzdGlkPVwic3R1ZHktdmlkZW8tcGxheWVyXCJcbiAgICAgICAgICAgIGNvbnRyb2xzPXtjYW5Db250cm9sfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY29udGFpblwiXG4gICAgICAgICAgICBvbkxvYWRlZE1ldGFkYXRhPXtlID0+IHtcbiAgICAgICAgICAgICAgaWYgKGUudGFyZ2V0LmR1cmF0aW9uID4gMCkgc2V0RHVyYXRpb24oZS50YXJnZXQuZHVyYXRpb24pO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uUGxheT17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiAhd2F0Y2hTdGF0ZS5wbGF5aW5nICYmICFkYW5nR3VpTGVuaCkge1xuICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3BsYXknLCB2aWRlb1JlZi5jdXJyZW50Py5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvblBhdXNlPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmIHdhdGNoU3RhdGUucGxheWluZyAmJiAhZGFuZ0d1aUxlbmgpIHtcbiAgICAgICAgICAgICAgICBndWlMZW5oKCdwYXVzZScsIHZpZGVvUmVmLmN1cnJlbnQ/LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uU2Vla2VkPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghY2FuQ29udHJvbCB8fCBkYW5nR3VpTGVuaCB8fCBpc1NlZWtpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICBjb25zdCBjdXIgPSB2aWRlb1JlZi5jdXJyZW50Py5jdXJyZW50VGltZTtcbiAgICAgICAgICAgICAgaWYgKGN1ciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgICAgICAgICAgIC8vIENoXHUxRUQxbmcgdlx1MDBGMm5nIGxcdTFFQjdwOiBtXHUxRUNEaSBnXHUwMEUxbiBjdXJyZW50VGltZSBuXHUxRUQ5aSBiXHUxRUQ5IChvcHRpbWlzdGljIHNlZWssIGRyaWZ0LWNvcnJlY3Rpb25cbiAgICAgICAgICAgICAgLy8gY1x1MUVFN2EgYXBEdW5nRG9uZ0JvKSBcdTAxMTFcdTFFQzF1IGJcdTFFQUZuICdzZWVrZWQnLiBDaFx1MUVDOSBnXHUxRUVEaSBsXHUxRUM3bmgga2hpIHZcdTFFQ0IgdHJcdTAwRUQgbFx1MUVDN2NoIGtoXHUxRUNGaVxuICAgICAgICAgICAgICAvLyB2XHUxRUNCIHRyXHUwMEVEIHNlcnZlciBrXHUxRUYzIHZcdTFFQ0RuZyA+MS41cyBcdTIwMTQgdFx1MUVFOWMgbmdcdTAxQjBcdTFFRERpIGRcdTAwRjluZyB0aFx1MUVBRHQgc1x1MUVGMSB0dWEgcXVhIHRoYW5oIGNvbnRyb2xzLlxuICAgICAgICAgICAgICBjb25zdCBzdCA9IHdhdGNoU3RhdGU7XG4gICAgICAgICAgICAgIGNvbnN0IHVwZE1zID0gc3Q/LnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyhzdC51cGRhdGVkQXQpLnJlcGxhY2UoJyAnLCAnVCcpICsgKFN0cmluZyhzdC51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKSA6IERhdGUubm93KCk7XG4gICAgICAgICAgICAgIGNvbnN0IGVsYXBzZWQgPSBNYXRoLm1heCgwLCAoRGF0ZS5ub3coKSAtIHVwZE1zKSAvIDEwMDApO1xuICAgICAgICAgICAgICBjb25zdCBreVZvbmcgPSBzdD8ucGxheWluZ1xuICAgICAgICAgICAgICAgID8gTnVtYmVyKHN0LmJhc2VQb3NpdGlvblNlY29uZHMgfHwgMCkgKyBlbGFwc2VkICogKHN0LnBsYXliYWNrUmF0ZSB8fCAxKVxuICAgICAgICAgICAgICAgIDogTnVtYmVyKHN0Py5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgICAgICAgICAgIGlmIChNYXRoLmFicyhjdXIgLSBreVZvbmcpID4gMS41KSBndWlMZW5oKCdzZWVrJywgY3VyKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgLz5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGgtZnVsbCB0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIHAtNiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC0yeGwgbWItMlwiPlx1MjZBMFx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkxpbmsgdmlkZW8ga2hcdTAwRjRuZyBoXHUxRUQ3IHRyXHUxRUUzIHBoXHUwMEUxdCB0clx1MUVGMWMgdGlcdTFFQkZwIGhvXHUxRUI3YyBraFx1MDBGNG5nIGhcdTFFRTNwIGxcdTFFQzcuPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBUaFx1MDBGNG5nIGJcdTAwRTFvIHJpXHUwMEVBbmcgY2hvIEdvb2dsZSBEcml2ZSAqL31cbiAgICAgIHtkcnZJZCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMy41IHB5LTIgYmctYW1iZXItNTAwLzEwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzIwIHJvdW5kZWQteGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyB0ZXh0LWFtYmVyLTMwMFwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc21cIj5cdTIxMzlcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgPHNwYW4+R29vZ2xlIERyaXZlIHBoXHUwMEUxdCBcdTFFREYgY2hcdTFFQkYgXHUwMTExXHUxRUQ5IDxzdHJvbmc+WGVtIFx1MDExMVx1MUVEOWMgbFx1MUVBRHA8L3N0cm9uZz4gKEdvb2dsZSBEcml2ZSBraFx1MDBGNG5nIGhcdTFFRDcgdHJcdTFFRTMgQVBJIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gdFx1MUVFQiB4YSkuPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBUaGFuaCBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIEhvc3QgXHUyMDE0IFx1MUVBOW4ga2hpIGZ1bGxzY3JlZW4gKi99XG4gICAgICB7IWlzUm9vbVdpZGUgJiYgKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTMgc206cC0zLjUgZmxleCBmbGV4LWNvbCBnYXAtMyBzaGFkb3cteGxcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBmbGV4LXdyYXAgbWluLXctMFwiPlxuICAgICAgICAgICAgey8qIENoXHUxRUM5IGhpXHUxRUM3biB0clx1MUVBMW5nIHRoXHUwMEUxaSBwaFx1MDBFMXQgY2hvIGhvc3QgKi99XG4gICAgICAgICAgICB7Y2FuQ29udHJvbCAmJiBwcm92aWRlciAhPT0gJ0dPT0dMRV9EUklWRScgJiYgcHJvdmlkZXIgIT09ICdVTlNVUFBPUlRFRCcgJiYgKFxuICAgICAgICAgICAgICA8c3BhbiBpZD1cInN5bmMtc3RhdGUtYmFkZ2VcIiBjbGFzc05hbWU9e2B0ZXh0LXhzIGZvbnQtYmxhY2sgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcHgtMyBweS0xLjUgcm91bmRlZC14bCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHt3YXRjaFN0YXRlLnBsYXlpbmcgPyAnYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTQwMCBib3JkZXItZW1lcmFsZC01MDAvMzAgc2hhZG93LVswXzBfMTJweF9yZ2JhKDE2LDE4NSwxMjksMC4yKV0nIDogJ2JnLWFtYmVyLTUwMC8xNSB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzMwIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgyNDUsMTU4LDExLDAuMildJ31gfT5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTIgaC0yIHJvdW5kZWQtZnVsbCAke3dhdGNoU3RhdGUucGxheWluZyA/ICdiZy1lbWVyYWxkLTQwMCBhbmltYXRlLXB1bHNlJyA6ICdiZy1hbWJlci00MDAnfWB9Pjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57d2F0Y2hTdGF0ZS5wbGF5aW5nID8gJ1x1MDExMGFuZyBwaFx1MDBFMXQgY2h1bmcnIDogJ1RcdTFFQTFtIGRcdTFFRUJuZyd9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICB7Y2FuQ29udHJvbCAmJiAoXG4gICAgICAgICAgICAgIDxzcGFuIGlkPVwiaG9zdC1iYWRnZVwiIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtYmxhY2sgcHgtMi41IHB5LTEgcm91bmRlZC14bCBiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgc2hhZG93LXNtIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyNjA1PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPkNoXHUxRUU3IHBoXHUwMEYybmc8L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBzaHJpbmstMCBtbC1hdXRvXCI+XG4gICAgICAgICAgICB7KGNhbkNvbnRyb2wgfHwgYXV0aC51c2VyPy5pc1RlYWNoZXIpICYmIHBob25nLmNodVBob25nS2hvYSAhPT0gJ2hlLXRob25nJyAmJiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXtkb25nUGhvbmdIaWVuVGFpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTUgaG92ZXI6Ymctcm9zZS01MDAvMjUgdGV4dC1yb3NlLTMwMCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRyYW5zaXRpb24tYWxsIGhvdmVyOnNjYWxlLTEwNSBhY3RpdmU6c2NhbGUtOTVcIj5cbiAgICAgICAgICAgICAgICBcdTAxMTBcdTAwRjNuZyBwaFx1MDBGMm5nXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIFRoYW5oIGNcdTAwRjRuZyBjXHUxRUU1IHBoXHUwMEUxdCBjaHVuZyAoY2hcdTFFQzkgaGlcdTFFQzNuIHRoXHUxRUNCIGNobyBIb3N0IC8gVGVhY2hlciBraGkgZFx1MDBGOW5nIHByb3ZpZGVyIGNcdTAwRjMgdGhcdTFFQzMgXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbikgKi99XG4gICAgICAgIHtjYW5Db250cm9sICYmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgfHwgcHJvdmlkZXIgPT09ICdZT1VUVUJFJykgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBpdGVtcy1jZW50ZXIgZ2FwLTMgcHQtMiBib3JkZXItdCBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJidG4taG9zdC13YXRjaC10b2dnbGVcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCh3YXRjaFN0YXRlLnBsYXlpbmcgPyAncGF1c2UnIDogJ3BsYXknKX1cbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgc206dy1hdXRvIHB4LTQgcHktMiByb3VuZGVkLXhsIGZvbnQtYmxhY2sgdGV4dC14cyB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMS41IHNoYWRvdy1tZCBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXIgZGlzYWJsZWQ6b3BhY2l0eS01MCAke1xuICAgICAgICAgICAgICAgIHdhdGNoU3RhdGUucGxheWluZ1xuICAgICAgICAgICAgICAgICAgPyAnYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzQwIGhvdmVyOmJnLWFtYmVyLTUwMC8zMCBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMjQ1LDE1OCwxMSwwLjI1KV0nXG4gICAgICAgICAgICAgICAgICA6ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMDBjNmZmXSB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGhvdmVyOmJyaWdodG5lc3MtMTEwJ1xuICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgIDxzcGFuPnt3YXRjaFN0YXRlLnBsYXlpbmcgPyAnXHUyM0Y4JyA6ICdcdTI1QjYnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+e3dhdGNoU3RhdGUucGxheWluZyA/ICdUXHUxRUExbSBEXHUxRUVCbmcgQ1x1MUVBMyBQaFx1MDBGMm5nJyA6ICdQaFx1MDBFMXQgQ2h1bmcgQ1x1MUVBMyBQaFx1MDBGMm5nJ308L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSB3LWZ1bGxcIj5cbiAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJob3N0LWR1cmF0aW9uLWxhYmVsXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1tb25vIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAge2RpbmhEYW5nR2lheVBodXQobG9jYWxUaW1lKX1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICBpZD1cImhvc3Qtc2Vlay1zbGlkZXJcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJyYW5nZVwiXG4gICAgICAgICAgICAgICAgbWluPVwiMFwiXG4gICAgICAgICAgICAgICAgbWF4PXtkdXJhdGlvbiA+IDAgPyBkdXJhdGlvbiA6IE1hdGgubWF4KGxvY2FsVGltZSwgMzAwKX1cbiAgICAgICAgICAgICAgICBzdGVwPVwiMVwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e2xvY2FsVGltZX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlRG93bj17KCkgPT4geyBpc1NlZWtpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgb25Ub3VjaFN0YXJ0PXsoKSA9PiB7IGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRMb2NhbFRpbWUoTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSl9XG4gICAgICAgICAgICAgICAgb25Nb3VzZVVwPXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oKCdzZWVrJywgTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBvblRvdWNoRW5kPXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oKCdzZWVrJywgTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgaC0xLjUgYmctd2hpdGUvMTAgcm91bmRlZC1sZyBhcHBlYXJhbmNlLW5vbmUgY3Vyc29yLXBvaW50ZXIgYWNjZW50LVsjMDBGMkZFXVwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIHtkdXJhdGlvbiA+IDAgPyBkaW5oRGFuZ0dpYXlQaHV0KGR1cmF0aW9uKSA6ICctLTotLSd9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHtsb2kgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXJvc2UtNDAwXCI+e2xvaX08L3A+fVxuICAgICAgICB7cGhvbmcubW9UYSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCBsZWFkaW5nLXJlbGF4ZWQgcHQtMVwiPntwaG9uZy5tb1RhfTwvcD59XG5cbiAgICAgIDwvZGl2PlxuICAgICAgKX1cbiAgICA8L2Rpdj5cblxuICApO1xufVxuXG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDb21wb25lbnQ6IENhbXB1cyBGb2N1cyBSb29tIChTdHVkeSBDYWZcdTAwRTkgJiBQb21vZG9ybyBTZXNzaW9uKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBmdW5jdGlvbiBDYW1wdXNGb2N1c1Jvb20oe1xuICBwaG9uZyxcbiAgcGhvbmdNaW5oS2hvYSxcbiAgYXV0aCxcbiAgZG9uZ1Bob25nSGllblRhaSxcbiAgc29OZ3VvaSxcbiAgaXNGb2N1c01vZGUsXG4gIHNldElzRm9jdXNNb2RlXG59KSB7XG4gIGNvbnN0IFtmb2N1c1N0YXRlLCBzZXRGb2N1c1N0YXRlXSA9IHVzZVN0YXRlKHtcbiAgICBwaGFzZTogJ2ZvY3VzJyxcbiAgICBzdGF0dXM6ICdwYXVzZWQnLFxuICAgIGR1cmF0aW9uU2Vjb25kczogMTUwMCxcbiAgICByZW1haW5pbmdTZWNvbmRzOiAxNTAwLFxuICAgIHByZXNldDogJzI1XzUnLFxuICAgIHJldmlzaW9uOiAxLFxuICAgIGNhbkNvbnRyb2w6IGZhbHNlLFxuICAgIHVwZGF0ZWRBdDogbnVsbCxcbiAgICBzZXJ2ZXJOb3c6IG51bGxcbiAgfSk7XG4gIGNvbnN0IFtsb2NhbFJlbWFpbmluZywgc2V0TG9jYWxSZW1haW5pbmddID0gdXNlU3RhdGUoMTUwMCk7XG4gIGNvbnN0IFtkYW5nR3VpTGVuaCwgc2V0RGFuZ0d1aUxlbmhdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9pLCBzZXRMb2ldID0gdXNlU3RhdGUoJycpO1xuXG4gIC8vIEF1ZGlvIHN0YXRlIChBbWJpZW50IHBsYXliYWNrKVxuICBsZXQgY2F1SGluaCA9IHt9O1xuICB0cnkgeyBjYXVIaW5oID0gcGhvbmcuY2F1SGluaCA/IEpTT04ucGFyc2UocGhvbmcuY2F1SGluaCkgOiB7fTsgfSBjYXRjaCB7IC8qIGJcdTFFQ0YgcXVhICovIH1cbiAgY29uc3QgbmhhY1VybCA9IGNhdUhpbmgubmhhY1VybCA/IHVybE1lZGlhRmUoY2F1SGluaC5uaGFjVXJsKSA6ICcnO1xuICBjb25zdCBhdWRpb1JlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgW2F1ZGlvUGxheWluZywgc2V0QXVkaW9QbGF5aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2F1ZGlvVm9sdW1lLCBzZXRBdWRpb1ZvbHVtZV0gPSB1c2VTdGF0ZSgwLjUpO1xuICBjb25zdCBbYXVkaW9NdXRlZCwgc2V0QXVkaW9NdXRlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtoYXNJbnRlcmFjdGVkQXVkaW8sIHNldEhhc0ludGVyYWN0ZWRBdWRpb10gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgLy8gQXV0aG9yaXphdGlvblxuICBjb25zdCBbY2FuQ29udHJvbCwgc2V0Q2FuQ29udHJvbF0gPSB1c2VTdGF0ZShCb29sZWFuKGF1dGgudXNlcj8uaXNUZWFjaGVyIHx8IHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nKSk7XG4gIGNvbnN0IGlzSG9zdCA9IGNhbkNvbnRyb2w7XG5cbiAgLy8gU3luYyBzdGF0ZSByZWNvbmNpbGlhdGlvbiBoZWxwZXJcbiAgY29uc3QgYXBEdW5nRm9jdXNTdGF0ZSA9IChzdCkgPT4ge1xuICAgIGlmICghc3QpIHJldHVybjtcbiAgICBzZXRGb2N1c1N0YXRlKHN0KTtcbiAgICBjb25zdCByZW0gPSBOdW1iZXIoc3QucmVtYWluaW5nU2Vjb25kcyA/PyAxNTAwKTtcbiAgICBzZXRMb2NhbFJlbWFpbmluZyhyZW0pO1xuICB9O1xuXG4gIC8vIDEuIFBvbGxpbmcgRm9jdXMgU3RhdGUgKGV2ZXJ5IDMwMDBtcykgd2l0aCB2aXNpYmlsaXR5IHJlY29uY2lsaWF0aW9uICYgc3RyaWN0IGNsZWFudXBcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcblxuICAgIGNvbnN0IGZldGNoRm9jdXMgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1mb2N1cz9waG9uZ0lkPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHBob25nLmlkKX1gKTtcbiAgICAgICAgaWYgKCFyZXMub2spIHJldHVybjtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChhY3RpdmUgJiYgZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkLmNhbkNvbnRyb2wgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgc2V0Q2FuQ29udHJvbChkLmNhbkNvbnRyb2wpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhcER1bmdGb2N1c1N0YXRlKGQuc3RhdGUpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLyogYlx1MUVDRiBxdWEga2hpIGhcdTFFRTd5IGtcdTFFQkZ0IG5cdTFFRDFpICovXG4gICAgICB9XG4gICAgfTtcblxuICAgIGZldGNoRm9jdXMoKTtcbiAgICBjb25zdCB0aW1lciA9IHNldEludGVydmFsKGZldGNoRm9jdXMsIDMwMDApO1xuXG4gICAgY29uc3QgaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSA9ICgpID0+IHtcbiAgICAgIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09ICd2aXNpYmxlJyAmJiBhY3RpdmUpIHtcbiAgICAgICAgZmV0Y2hGb2N1cygpO1xuICAgICAgfVxuICAgIH07XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UpO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSk7XG4gICAgfTtcbiAgfSwgW3Bob25nLmlkXSk7XG5cbiAgLy8gMi4gTG9jYWwgQ291bnRkb3duIFRpY2sgKGV2ZXJ5IDEwMDBtcyB3aGVuIHN0YXR1cyA9PT0gJ3J1bm5pbmcnKVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChmb2N1c1N0YXRlLnN0YXR1cyAhPT0gJ3J1bm5pbmcnKSByZXR1cm47XG4gICAgY29uc3QgdGljayA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHNldExvY2FsUmVtYWluaW5nKHIgPT4gTWF0aC5tYXgoMCwgciAtIDEpKTtcbiAgICB9LCAxMDAwKTtcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbCh0aWNrKTtcbiAgfSwgW2ZvY3VzU3RhdGUuc3RhdHVzXSk7XG5cbiAgLy8gMy4gQ29tbWFuZCBkaXNwYXRjaGVyIHdpdGggb3B0aW1pc3RpYyBjb25jdXJyZW5jeSAocmV2aXNpb24gY2hlY2sgJiBjb25mbGljdCBoYW5kbGluZylcbiAgY29uc3QgZ3VpTGVuaCA9IGFzeW5jIChhY3Rpb24sIGV4dHJhUGF5bG9hZCA9IHt9KSA9PiB7XG4gICAgaWYgKGRhbmdHdWlMZW5oKSByZXR1cm47XG4gICAgc2V0RGFuZ0d1aUxlbmgodHJ1ZSk7XG4gICAgc2V0TG9pKCcnKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1mb2N1cycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgYWN0aW9uLFxuICAgICAgICAgIGV4cGVjdGVkUmV2aXNpb246IGZvY3VzU3RhdGUucmV2aXNpb24sXG4gICAgICAgICAgLi4uZXh0cmFQYXlsb2FkXG4gICAgICAgIH0pXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgIGFwRHVuZ0ZvY3VzU3RhdGUoZC5zdGF0ZSk7XG4gICAgICB9IGVsc2UgaWYgKHJlcy5zdGF0dXMgPT09IDQwOSAmJiBkLnN0YXRlKSB7XG4gICAgICAgIC8vIENvbmN1cnJlbmN5IGNvbmZsaWN0OiBhZG9wdCBsYXRlc3Qgc2VydmVyIHN0YXRlXG4gICAgICAgIGFwRHVuZ0ZvY3VzU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIHNldExvaSgnXHUwMTEwXHUwMEUzIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgbFx1MUVBMWkgcGhpXHUwMEVBbiB0aGVvIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0TG9pKGQubG9pIHx8ICdLaFx1MDBGNG5nIHRoXHUxRUMzIGNcdTFFQURwIG5oXHUxRUFEdCB0clx1MUVBMW5nIHRoXHUwMEUxaSBwaFx1MDBGMm5nIGhcdTFFQ0RjIHRcdTFFQURwLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0TG9pKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RGFuZ0d1aUxlbmgoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyA0LiBBbWJpZW50IEF1ZGlvIENvbnRyb2xzXG4gIGNvbnN0IGJhdEFtVGhhbmggPSAoKSA9PiB7XG4gICAgc2V0SGFzSW50ZXJhY3RlZEF1ZGlvKHRydWUpO1xuICAgIGlmIChhdWRpb1JlZi5jdXJyZW50KSB7XG4gICAgICBhdWRpb1JlZi5jdXJyZW50LnBsYXkoKS50aGVuKCgpID0+IHtcbiAgICAgICAgc2V0QXVkaW9QbGF5aW5nKHRydWUpO1xuICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS53YXJuKCdBdXRvcGxheSBibG9ja2VkIG9yIGF1ZGlvIGxvYWQgZXJyb3I6JywgZXJyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB0b2dnbGVBdWRpb1BsYXkgPSAoKSA9PiB7XG4gICAgaWYgKCFhdWRpb1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgaWYgKGF1ZGlvUGxheWluZykge1xuICAgICAgYXVkaW9SZWYuY3VycmVudC5wYXVzZSgpO1xuICAgICAgc2V0QXVkaW9QbGF5aW5nKGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYmF0QW1UaGFuaCgpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB0b2dnbGVBdWRpb011dGUgPSAoKSA9PiB7XG4gICAgaWYgKCFhdWRpb1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgY29uc3QgbmV3TXV0ZSA9ICFhdWRpb011dGVkO1xuICAgIGF1ZGlvUmVmLmN1cnJlbnQubXV0ZWQgPSBuZXdNdXRlO1xuICAgIHNldEF1ZGlvTXV0ZWQobmV3TXV0ZSk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlVm9sdW1lQ2hhbmdlID0gKGUpID0+IHtcbiAgICBjb25zdCB2YWwgPSBwYXJzZUZsb2F0KGUudGFyZ2V0LnZhbHVlKTtcbiAgICBzZXRBdWRpb1ZvbHVtZSh2YWwpO1xuICAgIGlmIChhdWRpb1JlZi5jdXJyZW50KSB7XG4gICAgICBhdWRpb1JlZi5jdXJyZW50LnZvbHVtZSA9IHZhbDtcbiAgICAgIGlmICh2YWwgPiAwICYmIGF1ZGlvTXV0ZWQpIHtcbiAgICAgICAgYXVkaW9SZWYuY3VycmVudC5tdXRlZCA9IGZhbHNlO1xuICAgICAgICBzZXRBdWRpb011dGVkKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgY29uc3QgaXNCcmVhayA9IGZvY3VzU3RhdGUucGhhc2UgPT09ICdicmVhayc7XG4gIGNvbnN0IGlzUnVubmluZyA9IGZvY3VzU3RhdGUuc3RhdHVzID09PSAncnVubmluZyc7XG4gIGNvbnN0IGR1cmF0aW9uID0gZm9jdXNTdGF0ZS5kdXJhdGlvblNlY29uZHMgfHwgKGlzQnJlYWsgPyAzMDAgOiAxNTAwKTtcbiAgY29uc3QgcHJvZ3Jlc3NQZXJjZW50ID0gTWF0aC5taW4oMTAwLCBNYXRoLm1heCgwLCAoKGR1cmF0aW9uIC0gbG9jYWxSZW1haW5pbmcpIC8gZHVyYXRpb24pICogMTAwKSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTQgbWluLXctMCB3LWZ1bGxcIj5cbiAgICAgIHsvKiBIaWRkZW4gQXVkaW8gZWxlbWVudCBmb3IgYW1iaWVudCBzb3VuZHRyYWNrICovfVxuICAgICAge25oYWNVcmwgJiYgKFxuICAgICAgICA8YXVkaW9cbiAgICAgICAgICByZWY9e2F1ZGlvUmVmfVxuICAgICAgICAgIHNyYz17bmhhY1VybH1cbiAgICAgICAgICBsb29wXG4gICAgICAgICAgcHJlbG9hZD1cIm5vbmVcIlxuICAgICAgICAgIG9uRW5kZWQ9eygpID0+IHNldEF1ZGlvUGxheWluZyhmYWxzZSl9XG4gICAgICAgICAgb25FcnJvcj17KCkgPT4gc2V0QXVkaW9QbGF5aW5nKGZhbHNlKX1cbiAgICAgICAgLz5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBIZWFkZXIgYmFyOiBQcmVzZW5jZSwgSG9zdCBiYWRnZSwgRm9jdXMgTW9kZSB0b2dnbGUsIENsb3NlIFJvb20gKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNCBmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zIHNoYWRvdy1sZ1wiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHB4LTIuNSBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgYm9yZGVyICR7cGhvbmcucGhhbVZpID09PSAndHJ1b25nJyA/ICdiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtNDAwIGJvcmRlci1lbWVyYWxkLTUwMC8zMCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAge3Bob25nLnBoYW1WaSA9PT0gJ3RydW9uZycgPyAnXHVEODNDXHVERjEwIFRvXHUwMEUwbiB0clx1MDFCMFx1MUVERG5nJyA6IGBcdUQ4M0RcdUREMTIgTFx1MUVEQnAgJHtwaG9uZy5sb3BUZW4gfHwgJyd9YH1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gaWQ9XCJmb2N1cy1ob3N0LWJhZGdlXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgIENoXHUxRUU3IHBoXHUwMEYybmc6IDxzdHJvbmcgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0yMDBcIj57cGhvbmcuY2h1UGhvbmdUZW59PC9zdHJvbmc+XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGlkPVwiZm9jdXMtcm9vbS1wcmVzZW5jZVwiIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHB4LTIuNSBweS0wLjUgcm91bmRlZC1mdWxsIGJnLVsjMDBGMkZFXS8xMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8yMCBmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgICBcdUQ4M0RcdURDNjUge3NvTmd1b2kgfHwgMX0gbmdcdTAxQjBcdTFFRERpIFx1MDExMWFuZyBjXHUwMEY5bmcgdFx1MUVBRHAgdHJ1bmdcbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbWwtYXV0b1wiPlxuICAgICAgICAgIHtpc0ZvY3VzTW9kZSAmJiAoXG4gICAgICAgICAgICA8c3BhbiBpZD1cImZvY3VzLW1vZGUtYWN0aXZlLWluZGljYXRvclwiIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXB1cnBsZS00MDAgYmctcHVycGxlLTUwMC8xMCBweC0yIHB5LTAuNSByb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci1wdXJwbGUtNTAwLzIwIGFuaW1hdGUtcHVsc2VcIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERkFGIFx1MDExMGFuZyBiXHUxRUFEdCBGb2N1cyBNb2RlXG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgKX1cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1tb2RlLXRvZ2dsZVwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzRm9jdXNNb2RlKCFpc0ZvY3VzTW9kZSl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7aXNGb2N1c01vZGUgPyAnYmctcHVycGxlLTUwMC8yMCB0ZXh0LXB1cnBsZS0zMDAgYm9yZGVyLXB1cnBsZS01MDAvNDAgc2hhZG93LVswXzBfMTJweF9yZ2JhKDE2OCw4NSwyNDcsMC4zKV0nIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REZBRjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPntpc0ZvY3VzTW9kZSA/ICdcdTIxQTkgVGhvXHUwMEUxdCBGb2N1cyBNb2RlJyA6ICdGb2N1cyBNb2RlJ308L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICB7Y2FuQ29udHJvbCAmJiBwaG9uZy5jaHVQaG9uZ0tob2EgIT09ICdoZS10aG9uZycgJiYgKFxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17ZG9uZ1Bob25nSGllblRhaX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xNSBob3ZlcjpiZy1yb3NlLTUwMC8yNSB0ZXh0LXJvc2UtMzAwIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgXHUwMTEwXHUwMEYzbmcgcGhcdTAwRjJuZ1xuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIE1haW4gRm9jdXMgQ2VudGVycGllY2UgQ2FyZCAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPXtgcmVsYXRpdmUgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtM3hsIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBwLTYgc206cC04IGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyIHNoYWRvdy0yeGwgJHtpc0JyZWFrID8gJ2JnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzFFMTcxMF0gdG8tWyMxMzExMEVdIGJvcmRlci1hbWJlci01MDAvMzAnIDogJ2JnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzBGMUUyOF0gdG8tWyMwQTEyMTldIGJvcmRlci1bIzAwRjJGRV0vMzAnfWB9PlxuICAgICAgICB7LyogR2xvdyBiYWNrZHJvcCBhY2NlbnQgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgYWJzb2x1dGUgLXRvcC0yNCAtbGVmdC0yNCB3LTcyIGgtNzIgcm91bmRlZC1mdWxsIGJsdXItM3hsIG9wYWNpdHktMjAgcG9pbnRlci1ldmVudHMtbm9uZSAke2lzQnJlYWsgPyAnYmctYW1iZXItNTAwJyA6ICdiZy1bIzAwRjJGRV0nfWB9IC8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgYWJzb2x1dGUgLWJvdHRvbS0yNCAtcmlnaHQtMjQgdy03MiBoLTcyIHJvdW5kZWQtZnVsbCBibHVyLTN4bCBvcGFjaXR5LTIwIHBvaW50ZXItZXZlbnRzLW5vbmUgJHtpc0JyZWFrID8gJ2JnLW9yYW5nZS01MDAnIDogJ2JnLWluZGlnby01MDAnfWB9IC8+XG5cbiAgICAgICAgey8qIFBoYXNlICYgU3RhdHVzIEJhZGdlcyAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTIuNSBtYi02IHotMTBcIj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgaWQ9XCJmb2N1cy1waGFzZS1iYWRnZVwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LWV4dHJhYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgYm9yZGVyIHNoYWRvdy1zbSAke2lzQnJlYWsgPyAnYmctYW1iZXItNTAwLzE1IHRleHQtYW1iZXItMzAwIGJvcmRlci1hbWJlci01MDAvNDAnIDogJ2JnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXItWyMwMEYyRkVdLzQwJ31gfT5cbiAgICAgICAgICAgIHtpc0JyZWFrID8gJ1x1MjYxNSBHaVx1MUVERCBOZ2hcdTFFQzkgTmdcdTAxQTFpIChCcmVhayknIDogJ1x1RDgzQ1x1REY0NSBQaGlcdTAwRUFuIFRcdTFFQURwIFRydW5nIChGb2N1cyknfVxuICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBpZD1cImZvY3VzLXN0YXR1cy1iYWRnZVwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEgcm91bmRlZC1mdWxsIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7aXNSdW5uaW5nID8gJ2JnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC00MDAgYm9yZGVyLWVtZXJhbGQtNTAwLzMwJyA6ICdiZy1zbGF0ZS01MDAvMTUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXNsYXRlLTUwMC8zMCd9YH0+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTIgaC0yIHJvdW5kZWQtZnVsbCAke2lzUnVubmluZyA/ICdiZy1lbWVyYWxkLTQwMCBhbmltYXRlLXB1bHNlJyA6ICdiZy1zbGF0ZS00MDAnfWB9IC8+XG4gICAgICAgICAgICA8c3Bhbj57aXNSdW5uaW5nID8gJ1x1MDExMGFuZyBcdTAxMTFcdTFFQkZtJyA6ICdUXHUxRUExbSBkXHUxRUVCbmcnfTwvc3Bhbj5cbiAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1wcmVzZXQtdG9nZ2xlXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgZGlzYWJsZWQ9eyFjYW5Db250cm9sIHx8IGRhbmdHdWlMZW5ofVxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gY2FuQ29udHJvbCAmJiBndWlMZW5oKCdzZXRfcHJlc2V0JywgeyBwcmVzZXQ6IGZvY3VzU3RhdGUucHJlc2V0ID09PSAnNTBfMTAnID8gJzI1XzUnIDogJzUwXzEwJyB9KX1cbiAgICAgICAgICAgIHRpdGxlPXtjYW5Db250cm9sID8gJ0JcdTFFQTVtIFx1MDExMVx1MUVDMyBcdTAxMTFcdTFFRDVpIGNodSBrXHUxRUYzIFBvbW9kb3JvJyA6ICdDaHUga1x1MUVGMyBQb21vZG9ybyBoaVx1MUVDN24gdFx1MUVBMWknfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtbW9ubyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7Y2FuQ29udHJvbCA/ICdob3ZlcjpzY2FsZS0xMDUgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyIGJnLXdoaXRlLzEwIHRleHQtd2hpdGUgYm9yZGVyLXdoaXRlLzIwJyA6ICdjdXJzb3ItZGVmYXVsdCBiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICBcdTI2OTlcdUZFMEYge2ZvY3VzU3RhdGUucHJlc2V0ID09PSAnNTBfMTAnID8gJzUwIC8gMTAgcGhcdTAwRkF0JyA6ICcyNSAvIDUgcGhcdTAwRkF0J31cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIE1hc3NpdmUgVGltZXIgRGlzcGxheSAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteS0yIHNtOm15LTQgei0xMFwiPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBpZD1cImZvY3VzLXRpbWVyLWRpc3BsYXlcIlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgZm9udC1tb25vIHRleHQtNnhsIHNtOnRleHQtOHhsIGZvbnQtYmxhY2sgdHJhY2tpbmctd2lkZXN0IGJsb2NrIHRyYW5zaXRpb24tYWxsIHNlbGVjdC1ub25lICR7aXNCcmVhayA/ICd0ZXh0LWFtYmVyLTMwMCBkcm9wLXNoYWRvdy1bMF8wXzM1cHhfcmdiYSgyNDUsMTU4LDExLDAuMzUpXScgOiAndGV4dC1bIzAwRjJGRV0gZHJvcC1zaGFkb3ctWzBfMF8zNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSd9YH0+XG4gICAgICAgICAgICB7ZGluaERhbmdHaWF5UGh1dChsb2NhbFJlbWFpbmluZyl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogUHJvZ3Jlc3MgYmFyICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy1tZCBoLTIgYmctYmxhY2svNDAgcm91bmRlZC1mdWxsIG92ZXJmbG93LWhpZGRlbiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIG15LTQgei0xMFwiPlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGgtZnVsbCB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0xMDAwICR7aXNCcmVhayA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLW9yYW5nZS01MDAnIDogJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzQjgyRjZdJ31gfVxuICAgICAgICAgICAgc3R5bGU9e3sgd2lkdGg6IGAke3Byb2dyZXNzUGVyY2VudH0lYCB9fVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBDb250cm9sIEJ1dHRvbnMgZm9yIEhvc3QvVGVhY2hlciAqL31cbiAgICAgICAge2NhbkNvbnRyb2wgPyAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTMgbXQtNCB6LTEwXCI+XG4gICAgICAgICAgICB7IWlzUnVubmluZyA/IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXN0YXJ0XCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgnc3RhcnQnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC02IHB5LTMgcm91bmRlZC0yeGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLWVtZXJhbGQtNDAwIHRvLXRlYWwtNTAwIGhvdmVyOmZyb20tZW1lcmFsZC0zMDAgaG92ZXI6dG8tdGVhbC00MDAgdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQtc20gc2hhZG93LVswXzBfMjBweF9yZ2JhKDUyLDIxMSwxNTMsMC4zKV0gYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTI1QjY8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVBRnQgXHUwMTExXHUxRUE3dTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtcGF1c2VcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdwYXVzZScpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMyByb3VuZGVkLTJ4bCBiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLW9yYW5nZS01MDAgaG92ZXI6ZnJvbS1hbWJlci0zMDAgaG92ZXI6dG8tb3JhbmdlLTQwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC1zbSBzaGFkb3ctWzBfMF8yMHB4X3JnYmEoMjUxLDE5MSwzNiwwLjMpXSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjNGODwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5UXHUxRUExbSBkXHUxRUVCbmc8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1yZXNldFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3Jlc2V0Jyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMyByb3VuZGVkLTJ4bCBiZy13aGl0ZS8xMCBob3ZlcjpiZy13aGl0ZS8xNSB0ZXh0LXNsYXRlLTIwMCB0ZXh0LXNtIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDA0PC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTAxMTBcdTFFQjd0IGxcdTFFQTFpPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIHtpc0JyZWFrID8gKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtc3RhcnQtZm9jdXNcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdzdGFydF9mb2N1cycpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMyByb3VuZGVkLTJ4bCBiZy1bIzAwRjJGRV0vMjAgaG92ZXI6YmctWyMwMEYyRkVdLzMwIHRleHQtWyMwMEYyRkVdIHRleHQtc20gZm9udC1ib2xkIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGQUY8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+Vlx1MDBFMG8gVFx1MUVBRHAgdHJ1bmc8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXN0YXJ0LWJyZWFrXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgnc3RhcnRfYnJlYWsnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTMgcm91bmRlZC0yeGwgYmctYW1iZXItNTAwLzIwIGhvdmVyOmJnLWFtYmVyLTUwMC8zMCB0ZXh0LWFtYmVyLTMwMCB0ZXh0LXNtIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC80MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyNjE1PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPk5naFx1MUVDOSBuZ1x1MDFBMWk8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIG10LTMgei0xMFwiPlxuICAgICAgICAgICAgXHUyM0YzIFx1MDExMFx1MUVEM25nIGhcdTFFRDMgUG9tb2Rvcm8gZG8gY2hcdTFFRTcgcGhcdTAwRjJuZyBcdTAxMTFpXHUxRUMxdSBwaFx1MUVEMWkgXHUyMDE0IGhcdTAwRTN5IHRcdTFFQURwIHRydW5nIGhcdTFFQkZ0IG1cdTAwRUNuaCB2XHUwMEUwbyBjXHUwMEY0bmcgdmlcdTFFQzdjL2hcdTFFQ0RjIHRcdTFFQURwIG5oXHUwMEU5IVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgKX1cblxuICAgICAgICB7bG9pICYmIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1yb3NlLTQwMCBtdC00IHotMTBcIj57bG9pfTwvcD59XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIEFtYmllbnQgQXVkaW8gUGxheWVyIENhcmQgKi99XG4gICAgICB7bmhhY1VybCA/IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTQgc206cC01IGZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtNCBzaGFkb3cteGxcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zLjUgbWluLXctMCB3LWZ1bGwgc206dy1hdXRvXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YHctMTIgaC0xMiByb3VuZGVkLTJ4bCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXhsIHNocmluay0wIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke2F1ZGlvUGxheWluZyA/ICdiZy1bIzhCNUNGNl0vMjAgdGV4dC1bIzhCNUNGNl0gYm9yZGVyLVsjOEI1Q0Y2XS80MCBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMTM5LDkyLDI0NiwwLjMpXSBhbmltYXRlLXB1bHNlJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REZBN1xuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi13LTBcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC13aGl0ZSB0cnVuY2F0ZVwiPlx1MDBDMm0gdGhhbmggblx1MUVDMW4gQW1iaWVudDwvcD5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICB7YXVkaW9QbGF5aW5nID8gJ1x1MDExMGFuZyBwaFx1MDBFMXQga2hcdTAwRjRuZyBnaWFuIGhcdTFFQ0RjIHRcdTFFQURwJyA6ICdcdTAwQzJtIHRoYW5oIGNcdTFFRTVjIGJcdTFFRDkgdGhlbyB0aGlcdTFFQkZ0IGJcdTFFQ0InfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0zIHctZnVsbCBzbTp3LWF1dG8ganVzdGlmeS1lbmRcIj5cbiAgICAgICAgICAgIHshaGFzSW50ZXJhY3RlZEF1ZGlvICYmICFhdWRpb1BsYXlpbmcgJiYgKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tc3RhcnQtZm9jdXMtYXVkaW9cIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2JhdEFtVGhhbmh9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjOEI1Q0Y2XSB0by1bIzYzNjZGMV0gdGV4dC13aGl0ZSB0ZXh0LXhzIGZvbnQtYm9sZCBzaGFkb3ctbGcgaG92ZXI6b3BhY2l0eS05MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMEE8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVBRHQgXHUwMEUybSB0aGFuaCB0XHUxRUFEcCB0cnVuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiZm9jdXMtYXVkaW8tdG9nZ2xlXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e3RvZ2dsZUF1ZGlvUGxheX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke2F1ZGlvUGxheWluZyA/ICdiZy1bIzhCNUNGNl0vMjAgdGV4dC1bIzhCNUNGNl0gYm9yZGVyLVsjOEI1Q0Y2XS80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTMwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgICA8c3Bhbj57YXVkaW9QbGF5aW5nID8gJ1x1MjNGOCBUXHUxRUExbSBkXHUxRUVCbmcnIDogJ1x1MjVCNiBQaFx1MDBFMXQgdGlcdTFFQkZwJ308L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlQXVkaW9NdXRlfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTIgcm91bmRlZC14bCBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC14cyB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICB7YXVkaW9NdXRlZCB8fCBhdWRpb1ZvbHVtZSA9PT0gMCA/ICdcdUQ4M0RcdUREMDcnIDogJ1x1RDgzRFx1REQwOSd9XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIHR5cGU9XCJyYW5nZVwiXG4gICAgICAgICAgICAgIG1pbj1cIjBcIlxuICAgICAgICAgICAgICBtYXg9XCIxXCJcbiAgICAgICAgICAgICAgc3RlcD1cIjAuMDVcIlxuICAgICAgICAgICAgICB2YWx1ZT17YXVkaW9NdXRlZCA/IDAgOiBhdWRpb1ZvbHVtZX1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZVZvbHVtZUNoYW5nZX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0yNCBoLTEuNSBiZy13aGl0ZS8xMCByb3VuZGVkLWxnIGFwcGVhcmFuY2Utbm9uZSBjdXJzb3ItcG9pbnRlciBhY2NlbnQtWyM4QjVDRjZdXCJcbiAgICAgICAgICAgICAgdGl0bGU9XCJcdTAwQzJtIGxcdTAxQjBcdTFFRTNuZyBuaFx1MUVBMWMgblx1MUVDMW5cIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC0yeGwgcC00IHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDBcIj5cbiAgICAgICAgICAgIFx1MjYxNSBQaFx1MDBGMm5nIFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgdFx1MDEyOW5oIGxcdTFFQjduZyAoY2hcdTAxQjBhIGdcdTFFQUZuIGxpbmsgXHUwMEUybSB0aGFuaCBuXHUxRUMxbikgXHUyMDE0IENodXlcdTAwRUFuIHRcdTAwRTJtIHRcdTFFRDFpIFx1MDExMWEgdlx1MDBFMG8gYlx1MDBFMGkgdlx1MUVERi5cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAge3Bob25nLm1vVGEgJiYgKFxuICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCBweC0yIGxlYWRpbmctcmVsYXhlZFwiPlxuICAgICAgICAgIHtwaG9uZy5tb1RhfVxuICAgICAgICA8L3A+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIkFBQUEsTUFBTSxFQUFFLFVBQVUsV0FBVyxPQUFPLElBQUk7QUFDeEMsU0FBUyxrQkFBa0IsZUFBZSxXQUFXLG1CQUFtQixxQkFBcUIsa0JBQWtCO0FBSXhHLGdCQUFTLFdBQVcsRUFBRSxPQUFPLFVBQVUsR0FBRztBQUMvQyxRQUFN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b0NBQUMsY0FBSyxxQkFBUztBQUFBLEVBQ2pCLENBRUosSUFFQSxvQ0FBQyxPQUFFLFdBQVUsc0NBQW1DLHVMQUVoRCxHQUdELE9BQU8sb0NBQUMsT0FBRSxXQUFVLHFDQUFtQyxHQUFJLENBQzlELEdBR0MsVUFDQyxvQ0FBQyxTQUFJLFdBQVUsdUlBQ2Isb0NBQUMsU0FBSSxXQUFVLHdEQUNiLG9DQUFDLFNBQUksV0FBVyxpR0FBaUcsZUFBZSw0R0FBNEcsMkNBQTJDLE1BQUksV0FFM1IsR0FDQSxvQ0FBQyxTQUFJLFdBQVUsYUFDYixvQ0FBQyxPQUFFLFdBQVUsMkNBQXdDLDhCQUFvQixHQUN6RSxvQ0FBQyxPQUFFLFdBQVUseUNBQ1YsZUFBZSxzREFBaUMsc0RBQ25ELENBQ0YsQ0FDRixHQUVBLG9DQUFDLFNBQUksV0FBVSxvRUFDWixDQUFDLHNCQUFzQixDQUFDLGdCQUN2QjtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsSUFBRztBQUFBLE1BQ0gsTUFBSztBQUFBLE1BQ0wsU0FBUztBQUFBLE1BQ1QsV0FBVTtBQUFBO0FBQUEsSUFDVixvQ0FBQyxjQUFLLFdBQUU7QUFBQSxJQUNSLG9DQUFDLGNBQUsscUNBQXNCO0FBQUEsRUFDOUIsR0FHRjtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsSUFBRztBQUFBLE1BQ0gsTUFBSztBQUFBLE1BQ0wsU0FBUztBQUFBLE1BQ1QsV0FBVyw0RkFBNEYsZUFBZSx1REFBdUQsMkNBQTJDO0FBQUE7QUFBQSxJQUN4TixvQ0FBQyxjQUFNLGVBQWUsOEJBQWUsMEJBQWM7QUFBQSxFQUNyRCxHQUVBO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxNQUFLO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVCxXQUFVO0FBQUE7QUFBQSxJQUNULGNBQWMsZ0JBQWdCLElBQUksY0FBTztBQUFBLEVBQzVDLEdBRUE7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLE1BQUs7QUFBQSxNQUNMLEtBQUk7QUFBQSxNQUNKLEtBQUk7QUFBQSxNQUNKLE1BQUs7QUFBQSxNQUNMLE9BQU8sYUFBYSxJQUFJO0FBQUEsTUFDeEIsVUFBVTtBQUFBLE1BQ1YsV0FBVTtBQUFBLE1BQ1YsT0FBTTtBQUFBO0FBQUEsRUFDUixDQUNGLENBQ0YsSUFFQSxvQ0FBQyxTQUFJLFdBQVUsb0VBQ2Isb0NBQUMsT0FBRSxXQUFVLGdDQUE2QixpTEFFMUMsQ0FDRixHQUdELE1BQU0sUUFDTCxvQ0FBQyxPQUFFLFdBQVUscURBQ1YsTUFBTSxJQUNULENBRUo7QUFFSjsiLAogICJuYW1lcyI6IFtdCn0K
