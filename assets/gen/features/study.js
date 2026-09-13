// GEN TU src/features/study.jsx — KHONG SUA TAY
const { useState, useEffect, useRef } = React;
import { dinhDangGiayPhut, idGoogleDrive, idYoutube, laVideoTrucTiepFe, napYouTubeIframeApi, urlMediaFe } from "../lib/helpers.js";
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
  hanhDongPhong
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
  return /* @__PURE__ */ React.createElement("div", { id: "study-dock-container", className: "bg-[#151A23] border border-white/10 rounded-2xl p-4 flex flex-col min-h-[380px] shadow-xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 pb-3 border-b border-white/10 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 flex-wrap" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "tab-study-chat",
      type: "button",
      onClick: () => setDockTab("chat"),
      className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${dockTab === "chat" ? "bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40" : "bg-white/5 text-slate-400 hover:text-white border border-transparent"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC}"),
    /* @__PURE__ */ React.createElement("span", null, "Chat ph\xF2ng")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "tab-study-notes",
      type: "button",
      onClick: () => setDockTab("notes"),
      className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${dockTab === "notes" ? "bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40" : "bg-white/5 text-slate-400 hover:text-white border border-transparent"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4DD}"),
    /* @__PURE__ */ React.createElement("span", null, "Ghi ch\xFA")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "tab-study-whiteboard",
      type: "button",
      onClick: () => setDockTab("whiteboard"),
      className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${dockTab === "whiteboard" ? "bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40" : "bg-white/5 text-slate-400 hover:text-white border border-transparent"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F3A8}"),
    /* @__PURE__ */ React.createElement("span", null, "B\u1EA3ng v\u1EBD")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "tab-study-sheet",
      type: "button",
      onClick: () => setDockTab("sheet"),
      className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${dockTab === "sheet" ? "bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40" : "bg-white/5 text-slate-400 hover:text-white border border-transparent"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4CA}"),
    /* @__PURE__ */ React.createElement("span", null, "B\u1EA3ng t\xEDnh")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "tab-study-voice",
      type: "button",
      onClick: () => setDockTab("voice"),
      className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${dockTab === "voice" ? "bg-amber-400/20 text-amber-300 border border-amber-400/40" : "bg-white/5 text-slate-400 hover:text-white border border-transparent"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F399}\uFE0F"),
    /* @__PURE__ */ React.createElement("span", null, "Voice (1-1)")
  ), isStaff && /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "tab-study-quan-tri",
      type: "button",
      onClick: () => setDockTab("quan-tri"),
      className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${dockTab === "quan-tri" ? "bg-violet-500/20 text-violet-300 border border-violet-500/40" : "bg-white/5 text-slate-400 hover:text-white border border-transparent"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u2699\uFE0F"),
    /* @__PURE__ */ React.createElement("span", null, "Quy\u1EC1n")
  )), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline" }, "Study Workspace", vaiTroPhong !== "member" ? ` \xB7 ${vaiTroPhong === "host" ? "Ch\u1EE7 ph\xF2ng" : vaiTroPhong === "teacher" ? "Gi\xE1o vi\xEAn" : "Co-host"}` : "")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col pt-3 min-h-[300px]" }, dockTab === "chat" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-h-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto space-y-3 pr-1 max-h-72 text-xs" }, phongChat.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 text-center py-8" }, "Ch\u01B0a c\xF3 tin nh\u1EAFn \u2014 h\xE3y g\u1EEDi c\xE2u h\u1ECFi ho\u1EB7c trao \u0111\u1ED5i v\u1EC1 b\xE0i gi\u1EA3ng!") : phongChat.map((m, idx) => /* @__PURE__ */ React.createElement("div", { key: m.id || idx, className: "text-xs group" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-1 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-300 text-[11px]" }, m.tenNguoiGui), m.vaiTro === "giao_vien" ? /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30" }, "GVCN") : m.lopTen ? /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/20" }, m.lopTen) : null, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500" }, m.taoLuc ? (/* @__PURE__ */ new Date(m.taoLuc.replace(" ", "T") + "Z")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""), m.videoTimeSec != null && m.videoTimeSec > 0 && /* @__PURE__ */ React.createElement(
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
  )))), voiceNotice && /* @__PURE__ */ React.createElement("p", { id: "voice-status-notice", className: "text-xs text-slate-300 font-mono bg-black/40 px-3 py-1.5 rounded-lg border border-white/5" }, voiceNotice), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 max-w-xs" }, "* Ghi ch\xFA: K\u1EBFt n\u1ED1i tho\u1EA1i P2P y\xEAu c\u1EA7u m\u1EA1ng kh\xF4ng ch\u1EB7n UDP. Restrictive NAT c\xF3 th\u1EC3 c\u1EA7n relay TURN.")), dockTab === "quan-tri" && isStaff && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-3 overflow-y-auto max-h-80 pr-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
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
  videoTimeRef
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
  const [watchCaps, setWatchCaps] = useState(null);
  const [provider, setProvider] = useState("UNSUPPORTED");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dangGuiLenh, setDangGuiLenh] = useState(false);
  const [loi, setLoi] = useState("");
  const [videoMoi, setVideoMoi] = useState("");
  const [queueList, setQueueList] = useState([]);
  const [queueBusy, setQueueBusy] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const caps = watchCaps || myCaps || {};
  const duocDoiVideo = canControl || caps.video_change === true;
  const duocQueue = canControl || caps.queue === true;
  const duocChat = caps.chat !== false;
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
  let cauHinh = {};
  try {
    cauHinh = phong.cauHinh ? JSON.parse(phong.cauHinh) : {};
  } catch {
  }
  const videoUrl = cauHinh.videoUrl || "";
  const ytId = videoUrl ? idYoutube(videoUrl) : null;
  const drvId = videoUrl ? idGoogleDrive(videoUrl) : null;
  const trucTiepUrl = videoUrl && !ytId && !drvId && laVideoTrucTiepFe(videoUrl) ? urlMediaFe(videoUrl) : "";
  useEffect(() => {
    if (!ytId) return;
    let destroyed = false;
    napYouTubeIframeApi(() => {
      if (destroyed || !document.getElementById(ytContainerId)) return;
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
      } catch {
      }
    });
    return () => {
      destroyed = true;
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
        }
        ytPlayerRef.current = null;
      }
    };
  }, [ytId, phong.id]);
  const apDungDongBo = (st, ctrl, prov) => {
    const nowMs = Date.now();
    const serverTimeMs = st.serverNow ? new Date(st.serverNow).getTime() : nowMs;
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
  const doiVideo = async (url) => {
    const u = String(url || videoMoi || "").trim();
    if (!u || dangGuiLenh) return;
    setDangGuiLenh(true);
    setLoi("");
    try {
      const res = await fetch("/api/phong-watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phongId: phong.id, action: "set_video", videoUrl: u, expectedRevision: watchState.revision })
      });
      const d = await res.json();
      if (!d.ok) setLoi(d.loi || "Kh\xF4ng \u0111\u1ED5i \u0111\u01B0\u1EE3c video.");
      else setVideoMoi("");
    } catch {
      setLoi("M\u1EA5t k\u1EBFt n\u1ED1i m\xE1y ch\u1EE7.");
    } finally {
      setDangGuiLenh(false);
    }
  };
  const taiQueue = async () => {
    try {
      const res = await fetch(`/api/phong-queue?phongId=${phong.id}&action=list`);
      const d = await res.json();
      if (d.ok) {
        setQueueList(d.queue || []);
        if (d.caps) setWatchCaps((prev) => ({ ...prev || {}, ...d.caps }));
      }
    } catch {
    }
  };
  useEffect(() => {
    taiQueue();
    const t = setInterval(taiQueue, 5e3);
    return () => clearInterval(t);
  }, [phong.id]);
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
      if (!d.ok) setLoi(d.loi || "Thao t\xE1c h\xE0ng \u0111\u1EE3i th\u1EA5t b\u1EA1i.");
      else await taiQueue();
    } catch {
      setLoi("M\u1EA5t k\u1EBFt n\u1ED1i m\xE1y ch\u1EE7.");
    } finally {
      setQueueBusy(false);
    }
  };
  const saoChepLinkPhong = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}#/phong/${phong.id}`);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2e3);
    } catch {
    }
  };
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
  )), ytId ? /* @__PURE__ */ React.createElement("div", { className: "w-full h-full flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { id: ytContainerId, className: "w-full h-full" })) : drvId ? /* @__PURE__ */ React.createElement(
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
        if (canControl && !dangGuiLenh && !isSeekingRef.current) {
          guiLenh("seek", videoRef.current?.currentTime);
        }
      }
    }
  ) : /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center h-full text-xs text-slate-500 p-6 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl mb-2" }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "Link video kh\xF4ng h\u1ED7 tr\u1EE3 ph\xE1t tr\u1EF1c ti\u1EBFp ho\u1EB7c kh\xF4ng h\u1EE3p l\u1EC7."))), drvId && /* @__PURE__ */ React.createElement("div", { className: "px-3.5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-300" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm" }, "\u2139\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "Google Drive ph\xE1t \u1EDF ch\u1EBF \u0111\u1ED9 ", /* @__PURE__ */ React.createElement("strong", null, "Xem \u0111\u1ED9c l\u1EADp"), " (Google Drive kh\xF4ng h\u1ED7 tr\u1EE3 API \u0111i\u1EC1u khi\u1EC3n t\u1EEB xa).")), /* @__PURE__ */ React.createElement("div", { className: "bg-[#151A23] border border-white/10 rounded-2xl p-4 flex flex-col gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-white/10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${phong.phamVi === "truong" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-slate-400 border-white/10"}` }, phong.phamVi === "truong" ? "\u{1F310} To\xE0n tr\u01B0\u1EDDng" : `\u{1F512} Ch\u1EC9 l\u1EDBp ${phong.lopTen || ""}`), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-200 font-bold truncate max-w-[200px] sm:max-w-xs" }, phong.ten), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-slate-400" }, "\u2022 Ch\u1EE7 ph\xF2ng: ", /* @__PURE__ */ React.createElement("strong", { className: "text-slate-200" }, phong.chuPhongTen))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, provider !== "GOOGLE_DRIVE" && provider !== "UNSUPPORTED" ? /* @__PURE__ */ React.createElement("span", { id: "sync-state-badge", className: `text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${watchState.playing ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-300 border-amber-500/30"}` }, /* @__PURE__ */ React.createElement("span", { className: `w-1.5 h-1.5 rounded-full ${watchState.playing ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}` }), /* @__PURE__ */ React.createElement("span", null, watchState.playing ? canControl ? "\u0110ang ph\xE1t chung" : "\u0110ang ph\xE1t c\xF9ng ph\xF2ng" : canControl ? "T\u1EA1m d\u1EEBng" : "T\u1EA1m d\u1EEBng theo ch\u1EE7 ph\xF2ng")) : /* @__PURE__ */ React.createElement("span", { id: "sync-state-badge", className: "text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10" }, "Xem \u0111\u1ED9c l\u1EADp"), canControl && /* @__PURE__ */ React.createElement("span", { id: "host-badge", className: "text-[10px] font-black px-2 py-0.5 rounded-md bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30" }, "Ch\u1EE7 ph\xF2ng"), caps.invite !== false && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-copy-room-link",
      onClick: saoChepLinkPhong,
      title: "Sao ch\xE9p link m\u1EDDi v\xE0o ph\xF2ng",
      className: "px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold border border-white/10 transition-all"
    },
    linkCopied ? "\u2713 \u0110\xE3 copy" : "\u{1F517} M\u1EDDi"
  ), (canControl || auth.user?.isTeacher) && phong.chuPhongKhoa !== "he-thong" && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: dongPhongHienTai,
      className: "px-3 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 transition-all"
    },
    "\u0110\xF3ng ph\xF2ng"
  ))), canControl && (provider === "NATIVE_HTML5" || provider === "YOUTUBE") && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row items-center gap-3 pt-1" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      id: "btn-host-watch-toggle",
      type: "button",
      onClick: () => guiLenh(watchState.playing ? "pause" : "play"),
      disabled: dangGuiLenh,
      className: `w-full sm:w-auto px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 ${watchState.playing ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30" : "bg-[#00F2FE] text-black hover:bg-[#00e1ec]"}`
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
  ), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono text-slate-400 shrink-0" }, duration > 0 ? dinhDangGiayPhut(duration) : "--:--"))), loi && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-400" }, loi), phong.moTa && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 leading-relaxed pt-1" }, phong.moTa), duocDoiVideo && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 pt-1" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "input-video-moi",
      type: "url",
      value: videoMoi,
      onChange: (e) => setVideoMoi(e.target.value),
      placeholder: "D\xE1n link YouTube / video m\u1EDBi \u0111\u1EC3 ph\xE1t ngay\u2026",
      className: "flex-1 bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/60"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-doi-video",
      onClick: () => doiVideo(),
      disabled: !videoMoi.trim() || dangGuiLenh,
      className: "px-3.5 py-2 rounded-xl bg-[#00F2FE] text-black text-xs font-black hover:bg-[#00e1ec] disabled:opacity-30 shrink-0"
    },
    "\u25B6 Ph\xE1t video n\xE0y"
  )), (duocQueue || queueList.length > 0) && /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-white/10 flex flex-col gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] uppercase font-bold tracking-wider text-slate-400" }, "\u{1F4CB} H\xE0ng \u0111\u1EE3i (", queueList.filter((q) => q.trangThai === "queued").length, ")"), duocDoiVideo && queueList.some((q) => q.trangThai === "queued") && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => hanhDongQueue("skip"),
      disabled: queueBusy,
      className: "px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold hover:bg-amber-500/25 disabled:opacity-40"
    },
    "\u23ED Ph\xE1t ti\u1EBFp theo"
  )), duocQueue && /* @__PURE__ */ React.createElement(
    QueueInput,
    {
      onAdd: (u, t) => hanhDongQueue("enqueue", { videoUrl: u, title: t }),
      onAddNext: (u, t) => hanhDongQueue("add_next", { videoUrl: u, title: t })
    }
  ), queueList.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500" }, "H\xE0ng \u0111\u1EE3i tr\u1ED1ng \u2014 th\xEAm link video \u0111\u1EC3 ph\xE1t l\u1EA7n l\u01B0\u1EE3t.") : /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5" }, queueList.map((q, idx) => /* @__PURE__ */ React.createElement("div", { key: q.id, className: "flex items-center gap-2 bg-[#0B0E14] border border-white/10 rounded-xl px-2.5 py-1.5" }, /* @__PURE__ */ React.createElement("span", { className: `w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${q.trangThai === "playing" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-slate-400"}` }, q.trangThai === "playing" ? "\u25B6" : idx + 1), q.thumb && /* @__PURE__ */ React.createElement("img", { src: q.thumb, alt: "", className: "w-10 h-6 rounded object-cover shrink-0", loading: "lazy" }), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-200 font-semibold truncate" }, q.title || q.videoUrl), /* @__PURE__ */ React.createElement("p", { className: "text-[9px] text-slate-500 truncate" }, "th\xEAm b\u1EDFi ", q.addedBy || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 shrink-0" }, q.trangThai === "queued" && duocDoiVideo && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      title: "Ph\xE1t ngay",
      onClick: () => hanhDongQueue("play_now", { id: q.id }),
      disabled: queueBusy,
      className: "w-6 h-6 rounded-lg bg-[#00F2FE]/15 text-[#00F2FE] text-[10px] font-black hover:bg-[#00F2FE]/25"
    },
    "\u25B6"
  ), q.trangThai === "queued" && duocQueue && idx > 0 && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      title: "\u0110\u01B0a l\xEAn \u0111\u1EA7u",
      onClick: () => {
        const ids = queueList.filter((x) => x.trangThai === "queued").map((x) => x.id);
        ids.splice(ids.indexOf(q.id), 1);
        ids.unshift(q.id);
        hanhDongQueue("reorder", { ids });
      },
      disabled: queueBusy,
      className: "w-6 h-6 rounded-lg bg-white/10 text-slate-300 text-[10px] font-black hover:bg-white/15"
    },
    "\u2191"
  ), duocChat && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      title: "G\u1EEDi v\xE0o chat ph\xF2ng",
      onClick: () => hanhDongQueue("send_to_chat", { id: q.id }),
      disabled: queueBusy,
      className: "w-6 h-6 rounded-lg bg-white/10 text-slate-300 text-[10px] font-black hover:bg-white/15"
    },
    "\u{1F4AC}"
  ), (duocQueue || q.addedByKhoa === phongMinhKhoa) && q.trangThai === "queued" && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      title: "X\xF3a kh\u1ECFi h\xE0ng \u0111\u1EE3i",
      onClick: () => hanhDongQueue("remove", { id: q.id }),
      disabled: queueBusy,
      className: "w-6 h-6 rounded-lg bg-rose-500/10 text-rose-300 text-[10px] font-black hover:bg-rose-500/20"
    },
    "\u2715"
  ))))))));
}
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvc3R1ZHkuanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9ID0gUmVhY3Q7XG5pbXBvcnQgeyBkaW5oRGFuZ0dpYXlQaHV0LCBpZEdvb2dsZURyaXZlLCBpZFlvdXR1YmUsIGxhVmlkZW9UcnVjVGllcEZlLCBuYXBZb3VUdWJlSWZyYW1lQXBpLCB1cmxNZWRpYUZlIH0gZnJvbSAnLi4vbGliL2hlbHBlcnMuanMnO1xuXG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBTVFVEWSBET0NLOiBLSFx1MDBENE5HIEdJQU4gQ1x1MUVEOE5HIFRcdTAwQzFDIFBIXHUwMEQyTkcgWU9VVFVCRSAoUEhBU0UgNEYpIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuZXhwb3J0IGZ1bmN0aW9uIFN0dWR5RG9jayh7IHBob25nLCBwaG9uZ01pbmhLaG9hLCBhdXRoLCBwaG9uZ0NoYXQgPSBbXSwgb25TZW5kUGhvbmdDaGF0LCBvblhvYVRpblBob25nLFxuICBteUNhcHMgPSB7fSwgaXNTdGFmZiA9IGZhbHNlLCB2YWlUcm9QaG9uZyA9ICdtZW1iZXInLCB0aGFuaFZpZW4gPSBbXSxcbiAgcG9saWNpZXMgPSBudWxsLCBncmFudHMgPSBbXSwgdmlkZW9UaW1lUmVmLCBzZWVrVmlkZW8sIGhhbmhEb25nUGhvbmcgfSkge1xuICBjb25zdCBbZG9ja1RhYiwgc2V0RG9ja1RhYl0gPSBSZWFjdC51c2VTdGF0ZSgnY2hhdCcpOyAvLyAnY2hhdCcgfCAnbm90ZXMnIHwgJ3doaXRlYm9hcmQnIHwgJ3NoZWV0JyB8ICd2b2ljZScgfCAncXVhbi10cmknXG5cbiAgLy8gQ2FwYWJpbGl0eSBwaFx1MDBFRGEgY2xpZW50IGNoXHUxRUM5IFx1MDExMVx1MUVDMyBcdTFFQTluL2hpXHUxRUM3biBVSSBcdTIwMTQgbVx1MUVDRGkgcXV5XHUxRUMxbiB0aFx1MUVBRHQgZG8gc2VydmVyIHF1eVx1MUVCRnQuXG4gIGNvbnN0IGNvUXV5ZW4gPSAoY2FwKSA9PiBteUNhcHNbY2FwXSAhPT0gZmFsc2U7XG4gIGNvbnN0IGxheVZpVHJpVmlkZW8gPSAoKSA9PiBNYXRoLmZsb29yKHZpZGVvVGltZVJlZj8uY3VycmVudCB8fCAwKSB8fCBudWxsO1xuICAvLyBCXHUxRUE1bSBtXHUxRUQxYyB0aFx1MUVERGkgZ2lhbiBcdTIxOTIgZ1x1MUVFRGkgZXZlbnQgY2hvIENhbXB1c1dhdGNoVG9nZXRoZXIgeFx1MUVFRCBsXHUwMEZEXG4gIC8vIChjXHUwMEYzIHZpZGVvX2NvbnRyb2wgXHUyMTkyIHR1YSBjaHVuZyBjXHUxRUEzIHBoXHUwMEYybmc7IGtoXHUwMEY0bmcgXHUyMTkyIHR1YSBjXHUxRUU1YyBiXHUxRUQ5IHBsYXllciBjXHUxRUU3YSBtXHUwMEVDbmgpLlxuICBjb25zdCB5ZXVDYXVUdWEgPSAoc2VjKSA9PiB7XG4gICAgaWYgKHNlYyA9PSBudWxsIHx8ICEoc2VjID49IDApKSByZXR1cm47XG4gICAgaWYgKHNlZWtWaWRlbykgeyBzZWVrVmlkZW8oc2VjLCBteUNhcHMudmlkZW9fY29udHJvbCA9PT0gdHJ1ZSk7IHJldHVybjsgfVxuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnc3Itc2VlaycsIHsgZGV0YWlsOiB7IHBob25nSWQ6IHBob25nLmlkLCBzZWMgfSB9KSk7XG4gIH07XG5cbiAgLy8gMS4gUm9vbSBDaGF0IFN0YXRlXG4gIGNvbnN0IFtjaGF0SW5wdXQsIHNldENoYXRJbnB1dF0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtjaGF0U2VuZGluZywgc2V0Q2hhdFNlbmRpbmddID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBjaGF0Q29tcG9zaW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgY2hhdEVuZFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiID09PSAnY2hhdCcgJiYgY2hhdEVuZFJlZi5jdXJyZW50KSB7XG4gICAgICBjaGF0RW5kUmVmLmN1cnJlbnQuc2Nyb2xsSW50b1ZpZXcoeyBiZWhhdmlvcjogJ3Ntb290aCcgfSk7XG4gICAgfVxuICB9LCBbcGhvbmdDaGF0Lmxlbmd0aCwgZG9ja1RhYl0pO1xuXG4gIGNvbnN0IGhhbmRsZVNlbmRSb29tQ2hhdCA9IChlKSA9PiB7XG4gICAgZT8ucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCB0eHQgPSBjaGF0SW5wdXQudHJpbSgpO1xuICAgIGlmICghdHh0IHx8IGNoYXRTZW5kaW5nKSByZXR1cm47XG4gICAgc2V0Q2hhdElucHV0KCcnKTtcbiAgICBzZXRDaGF0U2VuZGluZyh0cnVlKTtcbiAgICBpZiAob25TZW5kUGhvbmdDaGF0KSB7XG4gICAgICBQcm9taXNlLnJlc29sdmUob25TZW5kUGhvbmdDaGF0KHR4dCkpLmNhdGNoKCgpID0+IHtcbiAgICAgICAgc2V0Q2hhdElucHV0KGN1ciA9PiBjdXIgPyBjdXIgOiB0eHQpO1xuICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgIHNldENoYXRTZW5kaW5nKGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRDaGF0U2VuZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIDIuIFNoYXJlZCBOb3RlcyBcdTIwMTQgZW50cnkgYXBwZW5kIChtXHUxRUQ3aSBuZ1x1MDFCMFx1MUVERGkgdGhcdTAwRUFtIGdoaSBjaFx1MDBGQSByaVx1MDBFQW5nLCBraFx1MDBGNG5nIGdoaSBcdTAxMTFcdTAwRTggbmhhdSlcbiAgY29uc3QgW25vdGVzTGlzdCwgc2V0Tm90ZXNMaXN0XSA9IFJlYWN0LnVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW25vdGVJbnB1dCwgc2V0Tm90ZUlucHV0XSA9IFJlYWN0LnVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW25vdGVXaXRoVGltZSwgc2V0Tm90ZVdpdGhUaW1lXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBbbm90ZXNDYW5Xcml0ZSwgc2V0Tm90ZXNDYW5Xcml0ZV0gPSBSZWFjdC51c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW25vdGVzTm90aWNlLCBzZXROb3Rlc05vdGljZV0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IG5vdGVzVmVyc2lvblJlZiA9IFJlYWN0LnVzZVJlZigwKTtcbiAgY29uc3Qgbm90ZUNvbXBvc2luZ1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZG9ja1RhYiAhPT0gJ25vdGVzJykgcmV0dXJuO1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoTm90ZXMgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT1ub3Rlc2ApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBkLm9rKSB7XG4gICAgICAgICAgc2V0Tm90ZXNMaXN0KEFycmF5LmlzQXJyYXkoZC5wYXlsb2FkPy5ub3RlcykgPyBkLnBheWxvYWQubm90ZXMgOiBbXSk7XG4gICAgICAgICAgbm90ZXNWZXJzaW9uUmVmLmN1cnJlbnQgPSBkLnZlcnNpb24gfHwgMDtcbiAgICAgICAgICBzZXROb3Rlc0NhbldyaXRlKGQuY2FuV3JpdGUgIT09IGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RpdmUgJiYgZC5jb2RlID09PSAnY2FwYWJpbGl0eV9vZmYnKSB7XG4gICAgICAgICAgc2V0Tm90ZXNDYW5Xcml0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIGZldGNoTm90ZXMoKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGZldGNoTm90ZXMsIDMwMDApO1xuICAgIHJldHVybiAoKSA9PiB7IGFjdGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludGVydmFsKTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiXSk7XG5cbiAgY29uc3QgdGhlbUdoaUNodSA9IGFzeW5jICgpID0+IHtcbiAgICBjb25zdCB0ZXh0ID0gbm90ZUlucHV0LnRyaW0oKTtcbiAgICBpZiAoIXRleHQpIHJldHVybjtcbiAgICBzZXROb3Rlc05vdGljZSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgcmVzb3VyY2U6ICdub3RlcycsXG4gICAgICAgICAgcGF5bG9hZDogeyB0ZXh0LCB2aWRlb1RpbWVTZWM6IG5vdGVXaXRoVGltZSA/IGxheVZpVHJpVmlkZW8oKSA6IG51bGwgfVxuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSB7XG4gICAgICAgIHNldE5vdGVJbnB1dCgnJyk7XG4gICAgICAgIHNldE5vdGVzTGlzdChwcmV2ID0+IFsuLi5wcmV2LCB7IGlkOiBkLmlkLCB0ZW46IGF1dGgudXNlcj8udGVuIHx8ICdCXHUxRUExbicsIG5vaUR1bmc6IHRleHQsIHZpZGVvVGltZVNlYzogbm90ZVdpdGhUaW1lID8gbGF5VmlUcmlWaWRlbygpIDogbnVsbCwgY3VhVG9pOiAxIH1dKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldE5vdGVzTm90aWNlKGQubG9pIHx8ICdLaFx1MDBGNG5nIGxcdTAxQjB1IFx1MDExMVx1MDFCMFx1MUVFM2MgZ2hpIGNoXHUwMEZBLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggeyBzZXROb3Rlc05vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkuJyk7IH1cbiAgfTtcblxuICBjb25zdCB4b2FHaGlDaHUgPSBhc3luYyAoaWQpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIHJlc291cmNlOiAnbm90ZXMnLCBhY3Rpb246ICd4b2Ffbm90ZScsIGlkIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHNldE5vdGVzTGlzdChwcmV2ID0+IHByZXYuZmlsdGVyKG4gPT4gbi5pZCAhPT0gaWQpKTtcbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gMy4gU2hhcmVkIFdoaXRlYm9hcmQgU3RhdGVcbiAgY29uc3QgY2FudmFzUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBbd2JTdHJva2VzLCBzZXRXYlN0cm9rZXNdID0gUmVhY3QudXNlU3RhdGUoW10pO1xuICBjb25zdCBbd2JDb2xvciwgc2V0V2JDb2xvcl0gPSBSZWFjdC51c2VTdGF0ZSgnIzAwRjJGRScpO1xuICBjb25zdCBbd2JXaWR0aCwgc2V0V2JXaWR0aF0gPSBSZWFjdC51c2VTdGF0ZSgzKTtcbiAgY29uc3QgW3diVG9vbCwgc2V0V2JUb29sXSA9IFJlYWN0LnVzZVN0YXRlKCdwZW4nKTtcbiAgY29uc3QgaXNEcmF3aW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgY3VycmVudFN0cm9rZVJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgd2JWZXJzaW9uUmVmID0gUmVhY3QudXNlUmVmKDApO1xuXG4gIGNvbnN0IHJlZHJhd0NhbnZhcyA9IFJlYWN0LnVzZUNhbGxiYWNrKChzdHJva2VzKSA9PiB7XG4gICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFjYW52YXMpIHJldHVybjtcbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgc3Ryb2tlcy5mb3JFYWNoKHMgPT4ge1xuICAgICAgaWYgKCFzLnBvaW50cyB8fCBzLnBvaW50cy5sZW5ndGggPCAyKSByZXR1cm47XG4gICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzLnRvb2wgPT09ICdlcmFzZXInID8gJyMwQjBFMTQnIDogKHMuY29sb3IgfHwgJyMwMEYyRkUnKTtcbiAgICAgIGN0eC5saW5lV2lkdGggPSBzLndpZHRoIHx8IDM7XG4gICAgICBjdHgubGluZUNhcCA9ICdyb3VuZCc7XG4gICAgICBjdHgubGluZUpvaW4gPSAncm91bmQnO1xuICAgICAgY3R4Lm1vdmVUbyhzLnBvaW50c1swXS54LCBzLnBvaW50c1swXS55KTtcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcy5wb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3R4LmxpbmVUbyhzLnBvaW50c1tpXS54LCBzLnBvaW50c1tpXS55KTtcbiAgICAgIH1cbiAgICAgIGN0eC5zdHJva2UoKTtcbiAgICB9KTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IFt3YkNhbldyaXRlLCBzZXRXYkNhbldyaXRlXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpO1xuXG4gIC8vIFx1MDBDMXAgMSBvcCB2XHUwMEUwbyBtXHUxRUEzbmcgc3Ryb2tlcyAocmVwbGF5IGFwcGVuZC1vbmx5KTogJ3N0cm9rZScgdGhcdTAwRUFtIG5cdTAwRTl0LCAnY2xlYXInIHhvXHUwMEUxIHNcdTFFQTFjaC5cbiAgY29uc3QgYXBEdW5nT3AgPSAoc3Ryb2tlcywgb3ApID0+IHtcbiAgICBpZiAob3AudHlwZSA9PT0gJ2NsZWFyJykgcmV0dXJuIFtdO1xuICAgIGlmIChvcC50eXBlID09PSAnc3Ryb2tlJyAmJiBvcC5zdHJva2UpIHJldHVybiBbLi4uc3Ryb2tlcywgb3Auc3Ryb2tlXTtcbiAgICByZXR1cm4gc3Ryb2tlcztcbiAgfTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAnd2hpdGVib2FyZCcpIHJldHVybjtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaFdiID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mcmVzb3VyY2U9d2hpdGVib2FyZCZzYXVJZD0ke3diVmVyc2lvblJlZi5jdXJyZW50fWApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBkLm9rKSB7XG4gICAgICAgICAgY29uc3Qgb3BzID0gQXJyYXkuaXNBcnJheShkLnBheWxvYWQ/Lm9wcykgPyBkLnBheWxvYWQub3BzIDogW107XG4gICAgICAgICAgaWYgKG9wcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIE5cdTFFQkZ1IGNcdTAwRjMgb3AgJ2NsZWFyJyB0cm9uZyBsb1x1MUVBMXQgbVx1MUVEQmkgXHUyMTkyIGJ1aWxkIGxcdTFFQTFpIHRcdTFFRUIgXHUwMTExXHUxRUE3dSBjaG8gY2hcdTFFQUZjXG4gICAgICAgICAgICBpZiAob3BzLnNvbWUobyA9PiBvLnR5cGUgPT09ICdjbGVhcicpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGZ1bGwgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT13aGl0ZWJvYXJkJnNhdUlkPTBgKTtcbiAgICAgICAgICAgICAgY29uc3QgZGYgPSBhd2FpdCBmdWxsLmpzb24oKTtcbiAgICAgICAgICAgICAgaWYgKGFjdGl2ZSAmJiBkZi5vaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbE9wcyA9IEFycmF5LmlzQXJyYXkoZGYucGF5bG9hZD8ub3BzKSA/IGRmLnBheWxvYWQub3BzIDogW107XG4gICAgICAgICAgICAgICAgY29uc3QgcmVidWlsdCA9IGFsbE9wcy5yZWR1Y2UoYXBEdW5nT3AsIFtdKTtcbiAgICAgICAgICAgICAgICBzZXRXYlN0cm9rZXMocmVidWlsdCk7XG4gICAgICAgICAgICAgICAgcmVkcmF3Q2FudmFzKHJlYnVpbHQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzZXRXYlN0cm9rZXMocHJldiA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dCA9IG9wcy5yZWR1Y2UoYXBEdW5nT3AsIHByZXYpO1xuICAgICAgICAgICAgICAgIHJlZHJhd0NhbnZhcyhuZXh0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHdiVmVyc2lvblJlZi5jdXJyZW50ID0gZC52ZXJzaW9uIHx8IDA7XG4gICAgICAgICAgc2V0V2JDYW5Xcml0ZShkLmNhbldyaXRlICE9PSBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aXZlICYmIGQuY29kZSA9PT0gJ2NhcGFiaWxpdHlfb2ZmJykge1xuICAgICAgICAgIHNldFdiQ2FuV3JpdGUoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfTtcbiAgICBmZXRjaFdiKCk7XG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmZXRjaFdiLCAzMDAwKTtcbiAgICByZXR1cm4gKCkgPT4geyBhY3RpdmUgPSBmYWxzZTsgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7IH07XG4gIH0sIFtwaG9uZy5pZCwgZG9ja1RhYiwgcmVkcmF3Q2FudmFzXSk7XG5cbiAgY29uc3Qgc3RhcnREcmF3aW5nID0gKGUpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICBpZiAoIWNhbnZhcykgcmV0dXJuO1xuICAgIGNvbnN0IHJlY3QgPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgY2xpZW50WCA9IGUuY2xpZW50WCA/PyAoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXT8uY2xpZW50WCk7XG4gICAgY29uc3QgY2xpZW50WSA9IGUuY2xpZW50WSA/PyAoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXT8uY2xpZW50WSk7XG4gICAgY29uc3QgeCA9IGNsaWVudFggLSByZWN0LmxlZnQ7XG4gICAgY29uc3QgeSA9IGNsaWVudFkgLSByZWN0LnRvcDtcbiAgICBpc0RyYXdpbmdSZWYuY3VycmVudCA9IHRydWU7XG4gICAgY3VycmVudFN0cm9rZVJlZi5jdXJyZW50ID0ge1xuICAgICAgdG9vbDogd2JUb29sLFxuICAgICAgY29sb3I6IHdiQ29sb3IsXG4gICAgICB3aWR0aDogd2JUb29sID09PSAnZXJhc2VyJyA/IDE2IDogd2JXaWR0aCxcbiAgICAgIHBvaW50czogW3sgeCwgeSB9XVxuICAgIH07XG4gIH07XG5cbiAgY29uc3QgZHJhd01vdmUgPSAoZSkgPT4ge1xuICAgIGlmICghaXNEcmF3aW5nUmVmLmN1cnJlbnQgfHwgIWN1cnJlbnRTdHJva2VSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgIGlmICghY2FudmFzKSByZXR1cm47XG4gICAgY29uc3QgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBjbGllbnRYID0gZS5jbGllbnRYID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRYKTtcbiAgICBjb25zdCBjbGllbnRZID0gZS5jbGllbnRZID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRZKTtcbiAgICBjb25zdCB4ID0gY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICBjb25zdCB5ID0gY2xpZW50WSAtIHJlY3QudG9wO1xuICAgIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5wb2ludHMucHVzaCh7IHgsIHkgfSk7XG4gICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC50b29sID09PSAnZXJhc2VyJyA/ICcjMEIwRTE0JyA6IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5jb2xvcjtcbiAgICBjdHgubGluZVdpZHRoID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LndpZHRoO1xuICAgIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcbiAgICBjdHgubGluZUpvaW4gPSAncm91bmQnO1xuICAgIGNvbnN0IHB0cyA9IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5wb2ludHM7XG4gICAgaWYgKHB0cy5sZW5ndGggPj0gMikge1xuICAgICAgY3R4Lm1vdmVUbyhwdHNbcHRzLmxlbmd0aCAtIDJdLngsIHB0c1twdHMubGVuZ3RoIC0gMl0ueSk7XG4gICAgICBjdHgubGluZVRvKHB0c1twdHMubGVuZ3RoIC0gMV0ueCwgcHRzW3B0cy5sZW5ndGggLSAxXS55KTtcbiAgICAgIGN0eC5zdHJva2UoKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgc3RvcERyYXdpbmcgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFpc0RyYXdpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGlzRHJhd2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRTdHJva2VSZWYuY3VycmVudCAmJiBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQucG9pbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNvbnN0IHN0cm9rZSA9IGN1cnJlbnRTdHJva2VSZWYuY3VycmVudDtcbiAgICAgIGNvbnN0IG5leHRTdHJva2VzID0gWy4uLndiU3Ryb2tlcywgc3Ryb2tlXTtcbiAgICAgIHNldFdiU3Ryb2tlcyhuZXh0U3Ryb2tlcyk7XG4gICAgICBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgICAgcmVzb3VyY2U6ICd3aGl0ZWJvYXJkJyxcbiAgICAgICAgICAgIHBheWxvYWQ6IHsgdHlwZTogJ3N0cm9rZScsIHN0cm9rZSB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoZC5vayAmJiBkLmlkKSB3YlZlcnNpb25SZWYuY3VycmVudCA9IE1hdGgubWF4KHdiVmVyc2lvblJlZi5jdXJyZW50LCBkLmlkKTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9XG4gIH07XG5cbiAgY29uc3QgY2xlYXJXaGl0ZWJvYXJkID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghY29uZmlybSgnQlx1MUVBMW4gY1x1MDBGMyBjaFx1MUVBRmMgbXVcdTFFRDFuIHhcdTAwRjNhIHNcdTFFQTFjaCBiXHUxRUEzbmcgdlx1MUVCRD8gKGNoXHUxRUM5IHF1XHUxRUEzbiB0clx1MUVDQiBwaFx1MDBGMm5nKScpKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgcmVzb3VyY2U6ICd3aGl0ZWJvYXJkJyxcbiAgICAgICAgICBwYXlsb2FkOiB7IHR5cGU6ICdjbGVhcicgfVxuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rKSB7XG4gICAgICAgIHNldFdiU3Ryb2tlcyhbXSk7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgICAgICBpZiAoY2FudmFzKSB7XG4gICAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIC8vIDQuIFNoYXJlZCBTaGVldCBTdGF0ZSAoOCBjb2xzIHggMTAgcm93cykgXHUyMDE0IHVwc2VydCB0XHUxRUVCbmcgXHUwMEY0LCBraFx1MDBGNG5nIHdob2xlLWRvYyBjb25mbGljdFxuICBjb25zdCBDT0xTID0gWydBJywgJ0InLCAnQycsICdEJywgJ0UnLCAnRicsICdHJywgJ0gnXTtcbiAgY29uc3QgUk9XUyA9IFsxLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCA5LCAxMF07XG4gIGNvbnN0IFtzaGVldENlbGxzLCBzZXRTaGVldENlbGxzXSA9IFJlYWN0LnVzZVN0YXRlKHt9KTtcbiAgY29uc3QgW3NoZWV0Q2FuV3JpdGUsIHNldFNoZWV0Q2FuV3JpdGVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IHNoZWV0U2F2ZVRpbWVyc1JlZiA9IFJlYWN0LnVzZVJlZih7fSk7XG4gIGNvbnN0IHNoZWV0Rm9jdXNlZENlbGxSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHNoZWV0UG9sbFJlZiA9IFJlYWN0LnVzZVJlZigwKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAnc2hlZXQnKSByZXR1cm47XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG4gICAgY29uc3QgZmV0Y2hTaGVldCA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPXNoZWV0YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2spIHtcbiAgICAgICAgICBjb25zdCBpbmNvbWluZyA9IGQucGF5bG9hZD8uY2VsbHMgfHwge307XG4gICAgICAgICAgLy8gS2hcdTAwRjRuZyBnaGkgXHUwMTExXHUwMEU4IFx1MDBGNCBcdTAxMTFhbmcgZ1x1MDBGNSBkXHUxRURGXG4gICAgICAgICAgc2V0U2hlZXRDZWxscyhwcmV2ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IHsgLi4uaW5jb21pbmcgfTtcbiAgICAgICAgICAgIGNvbnN0IGRhbmdHbyA9IHNoZWV0Rm9jdXNlZENlbGxSZWYuY3VycmVudDtcbiAgICAgICAgICAgIGlmIChkYW5nR28gJiYgcHJldltkYW5nR29dICE9PSB1bmRlZmluZWQpIG1lcmdlZFtkYW5nR29dID0gcHJldltkYW5nR29dO1xuICAgICAgICAgICAgcmV0dXJuIG1lcmdlZDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzZXRTaGVldENhbldyaXRlKGQuY2FuV3JpdGUgIT09IGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RpdmUgJiYgZC5jb2RlID09PSAnY2FwYWJpbGl0eV9vZmYnKSB7XG4gICAgICAgICAgc2V0U2hlZXRDYW5Xcml0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIGZldGNoU2hlZXQoKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGZldGNoU2hlZXQsIDMwMDApO1xuICAgIHJldHVybiAoKSA9PiB7IGFjdGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludGVydmFsKTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2VsbENoYW5nZSA9IChjZWxsS2V5LCB2YWwpID0+IHtcbiAgICBzZXRTaGVldENlbGxzKHByZXYgPT4gKHsgLi4ucHJldiwgW2NlbGxLZXldOiB2YWwgfSkpO1xuICAgIGNvbnN0IHRpbWVycyA9IHNoZWV0U2F2ZVRpbWVyc1JlZi5jdXJyZW50O1xuICAgIGlmICh0aW1lcnNbY2VsbEtleV0pIGNsZWFyVGltZW91dCh0aW1lcnNbY2VsbEtleV0pO1xuICAgIHRpbWVyc1tjZWxsS2V5XSA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgICAgcmVzb3VyY2U6ICdzaGVldCcsXG4gICAgICAgICAgICBwYXlsb2FkOiB7IGNlbGw6IGNlbGxLZXksIHZhbHVlOiB2YWwgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH0sIDgwMCk7XG4gIH07XG5cbiAgLy8gNS4gMS10by0xIFdlYlJUQyBWb2ljZSBDaGF0IFx1MjAxNCBwYWlyLWJvdW5kICh0XHUxRUQxaSBcdTAxMTFhIDEgY1x1MUVCN3AvcGhcdTAwRjJuZywgc2lnbmFsaW5nIHJpXHUwMEVBbmcgdFx1MDFCMClcbiAgY29uc3QgW3ZvaWNlSm9pbmVkLCBzZXRWb2ljZUpvaW5lZF0gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFttaWNNdXRlZCwgc2V0TWljTXV0ZWRdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7IC8vIERlZmF1bHQgT0ZGXG4gIGNvbnN0IFt2b2ljZVN0YXRlLCBzZXRWb2ljZVN0YXRlXSA9IFJlYWN0LnVzZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgY29uc3QgW3ZvaWNlTm90aWNlLCBzZXRWb2ljZU5vdGljZV0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFt2b2ljZVBhaXIsIHNldFZvaWNlUGFpcl0gPSBSZWFjdC51c2VTdGF0ZShudWxsKTsgICAgICAgLy8ge2FjdGl2ZSwgYVRlbiwgYlRlbiwgeW91SW4sIHNsb3R9XG4gIGNvbnN0IFt2b2ljZVJlcXVlc3RlZCwgc2V0Vm9pY2VSZXF1ZXN0ZWRdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbeWV1Q2F1Vm9pY2UsIHNldFlldUNhdVZvaWNlXSA9IFJlYWN0LnVzZVN0YXRlKFtdKTsgICAgIC8vIHN0YWZmOiBkYW5oIHNcdTAwRTFjaCB4aW4gcXV5XHUxRUMxblxuICBjb25zdCBwY1JlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgbG9jYWxTdHJlYW1SZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHJlbW90ZUF1ZGlvUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCBsYXN0U2lnbmFsSWRSZWYgPSBSZWFjdC51c2VSZWYoMCk7XG4gIGNvbnN0IHZvaWNlUG9sbFRpbWVyUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB2b2ljZVNsb3RSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IHZvaWNlSm9pbmVkUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgcGVuZGluZ0NhbmRpZGF0ZXNSZWYgPSBSZWFjdC51c2VSZWYoW10pO1xuICB2b2ljZUpvaW5lZFJlZi5jdXJyZW50ID0gdm9pY2VKb2luZWQ7XG5cbiAgY29uc3QgZHVuZ0tldE5vaVZvaWNlID0gKCkgPT4ge1xuICAgIGlmIChsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldFRyYWNrcygpLmZvckVhY2godCA9PiB0LnN0b3AoKSk7XG4gICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHBjUmVmLmN1cnJlbnQpIHtcbiAgICAgIHBjUmVmLmN1cnJlbnQuY2xvc2UoKTtcbiAgICAgIHBjUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIH1cbiAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50ID0gW107XG4gICAgc2V0TWljTXV0ZWQodHJ1ZSk7XG4gIH07XG5cbiAgLy8gUG9sbCB0clx1MUVBMW5nIHRoXHUwMEUxaSBjXHUxRUI3cCArIHRcdTAwRURuIGhpXHUxRUM3dSBjXHUxRUU3YSBwYXJ0bmVyIChzZXJ2ZXIgY2hcdTFFQzkgdHJcdTFFQTMgc2lnbmFsIGNcdTFFRTdhIG5nXHUwMUIwXHUxRUREaSB0cm9uZyBjXHUxRUI3cCkuXG4gIGNvbnN0IHBvbGxWb2ljZSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctY29sbGFiP3Bob25nSWQ9JHtwaG9uZy5pZH0mYWN0aW9uPXZvaWNlX3BvbGwmc2F1SWQ9JHtsYXN0U2lnbmFsSWRSZWYuY3VycmVudH1gKTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSByZXR1cm47XG4gICAgICBpZiAoZC5wYWlyKSBzZXRWb2ljZVBhaXIoZC5wYWlyKTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGQueWV1Q2F1Vm9pY2UpKSBzZXRZZXVDYXVWb2ljZShkLnlldUNhdVZvaWNlKTtcbiAgICAgIGNvbnN0IHBjID0gcGNSZWYuY3VycmVudDtcbiAgICAgIGlmICghdm9pY2VKb2luZWRSZWYuY3VycmVudCB8fCAhcGMpIHJldHVybjtcbiAgICAgIGZvciAoY29uc3Qgc2lnIG9mIGQuc2lnbmFscyB8fCBbXSkge1xuICAgICAgICBsYXN0U2lnbmFsSWRSZWYuY3VycmVudCA9IE1hdGgubWF4KGxhc3RTaWduYWxJZFJlZi5jdXJyZW50LCBzaWcuaWQpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ29mZmVyJykge1xuICAgICAgICAgICAgLy8gT2ZmZXIgbVx1MUVEQmkgaG9cdTFFQjdjIHJlLW9mZmVyIChcdTAxMTFcdTFFRDFpIHBoXHUwMUIwXHUwMUExbmcgYlx1MUVBRHQgbWljIG11XHUxRUQ5bikgXHUwMTExXHUxRUMxdSBzZXQgbFx1MUVBMWkgcmVtb3RlICsgdHJcdTFFQTMgYW5zd2VyLlxuICAgICAgICAgICAgYXdhaXQgcGMuc2V0UmVtb3RlRGVzY3JpcHRpb24obmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbihzaWcucGF5bG9hZCkpO1xuICAgICAgICAgICAgLy8gWFx1MUVBMyBjXHUwMEUxYyBjYW5kaWRhdGUgdFx1MUVEQmkgc1x1MUVEQm0gdHJcdTAxQjBcdTFFREJjIGtoaSBjXHUwMEYzIHJlbW90ZURlc2NyaXB0aW9uLlxuICAgICAgICAgICAgZm9yIChjb25zdCBjIG9mIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuYWRkSWNlQ2FuZGlkYXRlKG5ldyBSVENJY2VDYW5kaWRhdGUoYykpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGFucyA9IGF3YWl0IHBjLmNyZWF0ZUFuc3dlcigpO1xuICAgICAgICAgICAgYXdhaXQgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihhbnMpO1xuICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdhbnN3ZXInLCBwYXlsb2FkOiBhbnMgfSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdhbnN3ZXInKSB7XG4gICAgICAgICAgICBpZiAocGMuc2lnbmFsaW5nU3RhdGUgPT09ICdoYXZlLWxvY2FsLW9mZmVyJykge1xuICAgICAgICAgICAgICBhd2FpdCBwYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKHNpZy5wYXlsb2FkKSk7XG4gICAgICAgICAgICAgIGZvciAoY29uc3QgYyBvZiBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGMuYWRkSWNlQ2FuZGlkYXRlKG5ldyBSVENJY2VDYW5kaWRhdGUoYykpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50ID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ2NhbmRpZGF0ZScpIHtcbiAgICAgICAgICAgIGlmIChwYy5yZW1vdGVEZXNjcmlwdGlvbikge1xuICAgICAgICAgICAgICBhd2FpdCBwYy5hZGRJY2VDYW5kaWRhdGUobmV3IFJUQ0ljZUNhbmRpZGF0ZShzaWcucGF5bG9hZCkpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlbmRpbmdDYW5kaWRhdGVzUmVmLmN1cnJlbnQucHVzaChzaWcucGF5bG9hZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChzaWcuc2lnbmFsVHlwZSA9PT0gJ2xlYXZlJykge1xuICAgICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ05nXHUwMUIwXHUxRUREaSBraWEgXHUwMTExXHUwMEUzIG5nXHUxRUFGdCB2b2ljZS4nKTtcbiAgICAgICAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgZHVuZ0tldE5vaVZvaWNlKCk7XG4gICAgICAgICAgICBzZXRWb2ljZUpvaW5lZChmYWxzZSk7XG4gICAgICAgICAgICB2b2ljZVNsb3RSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgc2lnbmFsIGxcdTFFRDdpICovIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgLy8gUG9sbCBjaFx1MUVBMXkga2hpIHRhYiB2b2ljZSBtXHUxRURGICh4ZW0gdHJcdTFFQTFuZyB0aFx1MDBFMWkgY1x1MUVCN3ApIGhvXHUxRUI3YyBcdTAxMTFhbmcgdHJvbmcgY1x1MUVCN3AuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICd2b2ljZScgJiYgIXZvaWNlSm9pbmVkKSByZXR1cm47XG4gICAgcG9sbFZvaWNlKCk7XG4gICAgdm9pY2VQb2xsVGltZXJSZWYuY3VycmVudCA9IHNldEludGVydmFsKHBvbGxWb2ljZSwgMTUwMCk7XG4gICAgcmV0dXJuICgpID0+IHsgaWYgKHZvaWNlUG9sbFRpbWVyUmVmLmN1cnJlbnQpIGNsZWFySW50ZXJ2YWwodm9pY2VQb2xsVGltZXJSZWYuY3VycmVudCk7IH07XG4gIH0sIFtwaG9uZy5pZCwgZG9ja1RhYiwgdm9pY2VKb2luZWRdKTtcblxuICBjb25zdCBqb2luVm9pY2UgPSBhc3luYyAoKSA9PiB7XG4gICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMGFuZyB4aW4gY2hcdTFFRDcgdHJvbmcgY1x1MUVCN3Agdm9pY2UuLi4nKTtcbiAgICBzZXRWb2ljZVN0YXRlKCdjb25uZWN0aW5nJyk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIDEuIEdpXHUwMEUwbmggc2xvdCB0clx1MDBFQW4gc2VydmVyIHRyXHUwMUIwXHUxRURCYyAoc2VydmVyLWF1dGhvcml0YXRpdmU6IHRcdTFFRDFpIFx1MDExMWEgMSBjXHUxRUI3cCAxLTEvcGhcdTAwRjJuZylcbiAgICAgIGNvbnN0IGpvaW5SZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfam9pbicgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgam9pbkRhdGEgPSBhd2FpdCBqb2luUmVzLmpzb24oKTtcbiAgICAgIGlmICgham9pbkRhdGEub2spIHtcbiAgICAgICAgaWYgKGpvaW5EYXRhLmNvZGUgPT09ICdncmFudF9yZXF1aXJlZCcpIHtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnQlx1MUVBMW4gY1x1MUVBN24gXHUwMTExXHUwMUIwXHUxRUUzYyBjXHUxRUE1cCBxdXlcdTFFQzFuIHZvaWNlIFx1MjAxNCBoXHUwMEUzeSBiXHUxRUE1bSBcIlhpbiBxdXlcdTFFQzFuIHZvaWNlXCIuJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2Uoam9pbkRhdGEubG9pIHx8ICdLaFx1MDBGNG5nIHRoXHUxRUMzIHRoYW0gZ2lhIHZvaWNlLicpO1xuICAgICAgICB9XG4gICAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2b2ljZVNsb3RSZWYuY3VycmVudCA9IGpvaW5EYXRhLnNsb3Q7XG4gICAgICBzZXRWb2ljZUpvaW5lZCh0cnVlKTtcblxuICAgICAgLy8gMi4gWGluIG1pYyBUUlx1MDFBRlx1MUVEQUMga2hpIHRcdTFFQTFvIG9mZmVyIFx1MjAxNCB0cmFjayBwaFx1MUVBM2kgY1x1MDBGMyBzXHUxRUI1biB0cm9uZyBTRFAgbmVnb3RpYXRpb24sXG4gICAgICAvLyAgICBhZGRUcmFjayBzYXUga2hpIFx1MDExMVx1MDBFMyBiXHUxRUFGdCB0YXkgbVx1MDBFMCBraFx1MDBGNG5nIHJlbmVnb3RpYXRlIFx1MjE5MiBuZ1x1MDFCMFx1MUVERGkga2lhIGtoXHUwMEY0bmcgbmdoZSBcdTAxMTFcdTAxQjBcdTFFRTNjLlxuICAgICAgLy8gICAgTWljIGtoXHUxRURGaSBcdTAxMTFcdTFFQTd1IG11dGVkIChlbmFibGVkPWZhbHNlKSBcdTIwMTQgdXNlciB0XHUxRUYxIGJcdTFFQUR0IGJcdTFFQjFuZyBuXHUwMEZBdCBNaWMuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7IGF1ZGlvOiB0cnVlLCB2aWRlbzogZmFsc2UgfSk7XG4gICAgICAgIHN0cmVhbS5nZXRBdWRpb1RyYWNrcygpLmZvckVhY2godCA9PiB7IHQuZW5hYmxlZCA9IGZhbHNlOyB9KTtcbiAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudCA9IHN0cmVhbTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnS2hcdTAwRjRuZyB4aW4gXHUwMTExXHUwMUIwXHUxRUUzYyBtaWNybyBcdTIwMTQgYlx1MUVBMW4gY2hcdTFFQzkgbmdoZSBcdTAxMTFcdTAxQjBcdTFFRTNjLCBraFx1MDBGNG5nIG5cdTAwRjNpIFx1MDExMVx1MDFCMFx1MUVFM2MuJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIDMuIFRcdTFFQTFvIHBlZXIgY29ubmVjdGlvblxuICAgICAgY29uc3QgcGMgPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oe1xuICAgICAgICBpY2VTZXJ2ZXJzOiBbeyB1cmxzOiAnc3R1bjpzdHVuLmwuZ29vZ2xlLmNvbToxOTMwMicgfV1cbiAgICAgIH0pO1xuICAgICAgcGNSZWYuY3VycmVudCA9IHBjO1xuICAgICAgaWYgKGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRUcmFja3MoKS5mb3JFYWNoKHQgPT4gcGMuYWRkVHJhY2sodCwgbG9jYWxTdHJlYW1SZWYuY3VycmVudCkpO1xuICAgICAgfVxuXG4gICAgICBwYy5vbmljZWNhbmRpZGF0ZSA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQuY2FuZGlkYXRlKSB7XG4gICAgICAgICAgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsXG4gICAgICAgICAgICAgIHNpZ25hbFR5cGU6ICdjYW5kaWRhdGUnLFxuICAgICAgICAgICAgICBwYXlsb2FkOiBldmVudC5jYW5kaWRhdGVcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBwYy5vbnRyYWNrID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChyZW1vdGVBdWRpb1JlZi5jdXJyZW50ICYmIGV2ZW50LnN0cmVhbXNbMF0pIHtcbiAgICAgICAgICByZW1vdGVBdWRpb1JlZi5jdXJyZW50LnNyY09iamVjdCA9IGV2ZW50LnN0cmVhbXNbMF07XG4gICAgICAgICAgcmVtb3RlQXVkaW9SZWYuY3VycmVudC5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBwYy5vbmNvbm5lY3Rpb25zdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgcyA9IHBjLmNvbm5lY3Rpb25TdGF0ZTtcbiAgICAgICAgaWYgKHMgPT09ICdjb25uZWN0ZWQnKSB7XG4gICAgICAgICAgc2V0Vm9pY2VTdGF0ZSgnY29ubmVjdGVkJyk7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MjcxMyBcdTAxMTBhbmcga1x1MUVCRnQgblx1MUVEMWkgdGhvXHUxRUExaSAxLTEgdHJcdTFFRjFjIHRpXHUxRUJGcC4nKTtcbiAgICAgICAgfSBlbHNlIGlmIChzID09PSAnZmFpbGVkJyB8fCBzID09PSAnZGlzY29ubmVjdGVkJykge1xuICAgICAgICAgIHNldFZvaWNlU3RhdGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSB0aG9cdTFFQTFpIChtXHUxRUExbmcgY2hcdTFFQjduIFAyUCBuXHUxRUJGdSBraFx1MDBGNG5nIGNcdTAwRjMgVFVSTikuJyk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIDQuIFNsb3QgJ2InIChuZ1x1MDFCMFx1MUVERGkgdlx1MDBFMG8gc2F1KSB0XHUxRUExbyBvZmZlcjsgc2xvdCAnYScgY2hcdTFFREQgb2ZmZXIgdFx1MUVFQiBwb2xsLlxuICAgICAgaWYgKGpvaW5EYXRhLnNsb3QgPT09ICdiJykge1xuICAgICAgICBjb25zdCBvZmZlciA9IGF3YWl0IHBjLmNyZWF0ZU9mZmVyKCk7XG4gICAgICAgIGF3YWl0IHBjLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpO1xuICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ29mZmVyJywgcGF5bG9hZDogb2ZmZXIgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBcdTAwRTMgdlx1MDBFMG8gY1x1MUVCN3AgXHUyMDE0IFx1MDExMWFuZyBiXHUxRUFGdCB0YXkgdlx1MUVEQmkgJyArICh2b2ljZVBhaXI/LmFUZW4gfHwgJ25nXHUwMUIwXHUxRUREaSBraWEnKSArICdcdTIwMjYnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdCXHUxRUExbiBsXHUwMEUwIG5nXHUwMUIwXHUxRUREaSBcdTAxMTFcdTFFQTd1IHRpXHUwMEVBbiBcdTIwMTQgY2hcdTFFREQgdGhcdTAwRUFtIDEgbmdcdTAxQjBcdTFFRERpIHZcdTAwRTBvIHZvaWNlXHUyMDI2Jyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBzZXRWb2ljZU5vdGljZSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkgdm9pY2U6ICcgKyBlcnIubWVzc2FnZSk7XG4gICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgeGluUXV5ZW5Wb2ljZSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3JlcXVlc3QnIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgZC5ncmFudGVkKSB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKCdCXHUxRUExbiBcdTAxMTFcdTAwRTMgXHUwMTExXHUwMUIwXHUxRUUzYyBwaFx1MDBFOXAgdm9pY2UgXHUyMDE0IGJcdTFFQTVtIFRoYW0gZ2lhLicpO1xuICAgICAgfSBlbHNlIGlmIChkLm9rKSB7XG4gICAgICAgIHNldFZvaWNlUmVxdWVzdGVkKHRydWUpO1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwXHUwMEUzIGdcdTFFRURpIHlcdTAwRUF1IGNcdTFFQTd1IFx1MjAxNCBjaFx1MUVERCBxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZyBkdXlcdTFFQzd0LicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoZC5sb2kgfHwgJ0toXHUwMEY0bmcgZ1x1MUVFRGkgXHUwMTExXHUwMUIwXHUxRUUzYyB5XHUwMEVBdSBjXHUxRUE3dS4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHsgc2V0Vm9pY2VOb3RpY2UoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpLicpOyB9XG4gIH07XG5cbiAgY29uc3QgbmdhdFZvaWNlQ2FwID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghY29uZmlybSgnTmdcdTFFQUZ0IGNcdTFFQjdwIHZvaWNlIFx1MDExMWFuZyBob1x1MUVBMXQgXHUwMTExXHUxRUQ5bmc/JykpIHJldHVybjtcbiAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2VfZW5kJyB9KVxuICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICBwb2xsVm9pY2UoKTtcbiAgfTtcblxuICBjb25zdCB0b2dnbGVNaWMgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKG1pY011dGVkKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoIWxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAvLyBNaWMgYlx1MUVDQiB0XHUxRUVCIGNoXHUxRUQxaSBsXHUwMEZBYyBqb2luIFx1MjE5MiB4aW4gbFx1MUVBMWk7IGFkZFRyYWNrIG11XHUxRUQ5biBjXHUxRUE3biByZW5lZ290aWF0ZSAob2ZmZXIgbVx1MUVEQmkpLlxuICAgICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgYXVkaW86IHRydWUsIHZpZGVvOiBmYWxzZSB9KTtcbiAgICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50ID0gc3RyZWFtO1xuICAgICAgICAgIGNvbnN0IHBjID0gcGNSZWYuY3VycmVudDtcbiAgICAgICAgICBpZiAocGMpIHtcbiAgICAgICAgICAgIHN0cmVhbS5nZXRUcmFja3MoKS5mb3JFYWNoKHRyYWNrID0+IHBjLmFkZFRyYWNrKHRyYWNrLCBzdHJlYW0pKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IG9mZmVyID0gYXdhaXQgcGMuY3JlYXRlT2ZmZXIoKTtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihvZmZlcik7XG4gICAgICAgICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnb2ZmZXInLCBwYXlsb2FkOiBvZmZlciB9KVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiByZW5lZ290aWF0aW9uIHRoXHUxRUE1dCBiXHUxRUExaSBcdTIwMTQgbmdoZSB2XHUxRUFCbiBcdTAxMTFcdTAxQjBcdTFFRTNjICovIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRBdWRpb1RyYWNrcygpLmZvckVhY2godCA9PiB7IHQuZW5hYmxlZCA9IHRydWU7IH0pO1xuICAgICAgICB9XG4gICAgICAgIHNldE1pY011dGVkKGZhbHNlKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBhbGVydCgnS2hcdTAwRjRuZyB0aFx1MUVDMyBtXHUxRURGIG1pY3JvOiAnICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgICBsb2NhbFN0cmVhbVJlZi5jdXJyZW50LmdldEF1ZGlvVHJhY2tzKCkuZm9yRWFjaCh0ID0+IHsgdC5lbmFibGVkID0gZmFsc2U7IH0pO1xuICAgICAgfVxuICAgICAgc2V0TWljTXV0ZWQodHJ1ZSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGxlYXZlVm9pY2UgPSAoKSA9PiB7XG4gICAgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdsZWF2ZScsIHBheWxvYWQ6IHt9IH0pXG4gICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgIGR1bmdLZXROb2lWb2ljZSgpO1xuICAgIHNldFZvaWNlSm9pbmVkKGZhbHNlKTtcbiAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICB2b2ljZVNsb3RSZWYuY3VycmVudCA9IG51bGw7XG4gICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMFx1MDBFMyBuZ1x1MUVBRnQgdm9pY2UuJyk7XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGlkPVwic3R1ZHktZG9jay1jb250YWluZXJcIiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTQgZmxleCBmbGV4LWNvbCBtaW4taC1bMzgwcHhdIHNoYWRvdy14bFwiPlxuICAgICAgey8qIFN0dWR5IERvY2sgVGFiIE5hdmlnYXRpb24gKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBwYi0zIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMCBmbGV4LXdyYXBcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGZsZXgtd3JhcFwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LWNoYXRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdjaGF0Jyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHtkb2NrVGFiID09PSAnY2hhdCcgPyAnYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci10cmFuc3BhcmVudCd9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQUM8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5DaGF0IHBoXHUwMEYybmc8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktbm90ZXNcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdub3RlcycpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7ZG9ja1RhYiA9PT0gJ25vdGVzJyA/ICdiZy1bIzAwRjJGRV0vMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXRyYW5zcGFyZW50J31gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENERDwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkdoaSBjaFx1MDBGQTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS13aGl0ZWJvYXJkXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignd2hpdGVib2FyZCcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7ZG9ja1RhYiA9PT0gJ3doaXRlYm9hcmQnID8gJ2JnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItdHJhbnNwYXJlbnQnfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkE4PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Qlx1MUVBM25nIHZcdTFFQkQ8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktc2hlZXRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdzaGVldCcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7ZG9ja1RhYiA9PT0gJ3NoZWV0JyA/ICdiZy1bIzAwRjJGRV0vMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXRyYW5zcGFyZW50J31gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENDQTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkJcdTFFQTNuZyB0XHUwMEVEbmg8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktdm9pY2VcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCd2b2ljZScpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7ZG9ja1RhYiA9PT0gJ3ZvaWNlJyA/ICdiZy1hbWJlci00MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci00MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXRyYW5zcGFyZW50J31gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REY5OVx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPlZvaWNlICgxLTEpPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktcXVhbi10cmlcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYigncXVhbi10cmknKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7ZG9ja1RhYiA9PT0gJ3F1YW4tdHJpJyA/ICdiZy12aW9sZXQtNTAwLzIwIHRleHQtdmlvbGV0LTMwMCBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXRyYW5zcGFyZW50J31gfT5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNjk5XHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5RdXlcdTFFQzFuPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIGZvbnQtYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgaGlkZGVuIHNtOmlubGluZVwiPlxuICAgICAgICAgIFN0dWR5IFdvcmtzcGFjZXt2YWlUcm9QaG9uZyAhPT0gJ21lbWJlcicgPyBgIFx1MDBCNyAke3ZhaVRyb1Bob25nID09PSAnaG9zdCcgPyAnQ2hcdTFFRTcgcGhcdTAwRjJuZycgOiB2YWlUcm9QaG9uZyA9PT0gJ3RlYWNoZXInID8gJ0dpXHUwMEUxbyB2aVx1MDBFQW4nIDogJ0NvLWhvc3QnfWAgOiAnJ31cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBEb2NrIENvbnRlbnQgQm9keSAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgcHQtMyBtaW4taC1bMzAwcHhdXCI+XG4gICAgICAgIHsvKiBUQUIgMTogQ0hBVCBQSFx1MDBEMk5HICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ2NoYXQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIG1pbi1oLTBcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXktYXV0byBzcGFjZS15LTMgcHItMSBtYXgtaC03MiB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgIHtwaG9uZ0NoYXQubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwIHRleHQtY2VudGVyIHB5LThcIj5DaFx1MDFCMGEgY1x1MDBGMyB0aW4gbmhcdTFFQUZuIFx1MjAxNCBoXHUwMEUzeSBnXHUxRUVEaSBjXHUwMEUydSBoXHUxRUNGaSBob1x1MUVCN2MgdHJhbyBcdTAxMTFcdTFFRDVpIHZcdTFFQzEgYlx1MDBFMGkgZ2lcdTFFQTNuZyE8L3A+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgcGhvbmdDaGF0Lm1hcCgobSwgaWR4KSA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17bS5pZCB8fCBpZHh9IGNsYXNzTmFtZT1cInRleHQteHMgZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtYi0xIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMCB0ZXh0LVsxMXB4XVwiPnttLnRlbk5ndW9pR3VpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICB7bS52YWlUcm8gPT09ICdnaWFvX3ZpZW4nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuMiByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzBcIj5HVkNOPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICkgOiBtLmxvcFRlbiA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMjBcIj57bS5sb3BUZW59PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bS50YW9MdWMgPyBuZXcgRGF0ZShtLnRhb0x1Yy5yZXBsYWNlKCcgJywgJ1QnKSArICdaJykudG9Mb2NhbGVUaW1lU3RyaW5nKFtdLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSkgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAge20udmlkZW9UaW1lU2VjICE9IG51bGwgJiYgbS52aWRlb1RpbWVTZWMgPiAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHlldUNhdVR1YShtLnZpZGVvVGltZVNlYyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtteUNhcHMudmlkZW9fY29udHJvbCA/ICdUdWEgdmlkZW8gY1x1MUVBMyBwaFx1MDBGMm5nIHRcdTFFREJpIG1cdTFFRDFjIG5cdTAwRTB5JyA6ICdUdWEgdmlkZW8gY1x1MUVFN2EgYlx1MUVBMW4gdFx1MUVEQmkgbVx1MUVEMWMgblx1MDBFMHknfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCBob3ZlcjpiZy12aW9sZXQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNiB7ZGluaERhbmdHaWF5UGh1dChtLnZpZGVvVGltZVNlYyl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiWG9cdTAwRTEgdGluIG5oXHUxRUFGbiBuXHUwMEUweSAocXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jaGF0P3Bob25nSWQ9JHtwaG9uZy5pZH0maWQ9JHttLmlkfWAsIHsgbWV0aG9kOiAnREVMRVRFJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQub2sgJiYgb25Yb2FUaW5QaG9uZykgb25Yb2FUaW5QaG9uZyhtLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHsgLyogYlx1MUVDRiBxdWEgKi8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcGFjaXR5LTAgZ3JvdXAtaG92ZXI6b3BhY2l0eS0xMDAgcHgtMSB0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtcm9zZS00MDAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLXhsIHB4LTMgcHktMiB0ZXh0LXNsYXRlLTIwMCB0ZXh0LXhzIGxlYWRpbmctcmVsYXhlZCBicmVhay13b3Jkc1wiPlxuICAgICAgICAgICAgICAgICAgICAgIHttLm5vaUR1bmd9XG4gICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDxkaXYgcmVmPXtjaGF0RW5kUmVmfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVTZW5kUm9vbUNoYXR9IGNsYXNzTmFtZT1cInB0LTMgYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzEwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG10LWF1dG9cIj5cbiAgICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1waG9uZy1jaGF0XCJcbiAgICAgICAgICAgICAgICByb3dzPXsxfVxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtjb1F1eWVuKCdjaGF0JykgPyAnTmhcdTFFQUZuIHRpbiB0cm9uZyBwaFx1MDBGMm5nIGhcdTFFQ0RjLi4uICh0aW4gbmhcdTFFQUZuIHRcdTFFRjEgZ1x1MUVBRm4gbVx1MUVEMWMgdmlkZW8gaGlcdTFFQzduIHRcdTFFQTFpKScgOiAnQ2hhdCBcdTAxMTFhbmcgYlx1MUVDQiBxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZyBraFx1MDBGM2EnfVxuICAgICAgICAgICAgICAgIHZhbHVlPXtjaGF0SW5wdXR9XG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjb1F1eWVuKCdjaGF0Jyl9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Q2hhdElucHV0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ9eygpID0+IHsgY2hhdENvbXBvc2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPXsoKSA9PiB7IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCA9IGZhbHNlOyB9fVxuICAgICAgICAgICAgICAgIG9uS2V5RG93bj17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUubmF0aXZlRXZlbnQ/LmlzQ29tcG9zaW5nIHx8IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZVNlbmRSb29tQ2hhdCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXs1MDB9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcHgtMyBweS0yIHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNjAgcmVzaXplLW5vbmUgbWluLWgtWzM4cHhdIG1heC1oLTI0IGRpc2FibGVkOm9wYWNpdHktNDBcIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tc2VuZC1waG9uZy1jaGF0XCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNoYXRJbnB1dC50cmltKCkgfHwgY2hhdFNlbmRpbmcgfHwgIWNvUXV5ZW4oJ2NoYXQnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgcm91bmRlZC14bCBiZy1bIzAwRjJGRV0gaG92ZXI6YmctWyMwMGUxZWNdIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktMzAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICBHXHUxRUVEaVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDI6IEdISSBDSFx1MDBEQSBDXHUxRUQ4TkcgVFx1MDBDMUMgXHUyMDE0IGVudHJ5IGFwcGVuZCwgY1x1MDBGMyBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdub3RlcycgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICAgIDxzcGFuPkdoaSBjaFx1MDBGQSBjaHVuZyBjXHUxRUU3YSBwaFx1MDBGMm5nIFx1MjAxNCBtXHUxRUQ3aSBuZ1x1MDFCMFx1MUVERGkgdGhcdTAwRUFtIG1cdTFFRDl0IGRcdTAwRjJuZywgY1x1MDBGMyB0aFx1MUVDMyBnXHUxRUFGbiBtXHUxRUQxYyB2aWRlbzwvc3Bhbj5cbiAgICAgICAgICAgICAge25vdGVzTm90aWNlICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtcm9zZS0zMDAgZm9udC1ib2xkXCI+e25vdGVzTm90aWNlfTwvc3Bhbj59XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXktYXV0byBzcGFjZS15LTIgcHItMSBtYXgtaC02NCBtaW4taC1bMTgwcHhdIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0yLjVcIj5cbiAgICAgICAgICAgICAge25vdGVzTGlzdC5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDAgdGV4dC1jZW50ZXIgcHktOFwiPkNoXHUwMUIwYSBjXHUwMEYzIGdoaSBjaFx1MDBGQSBcdTIwMTQgdGhcdTAwRUFtIGRcdTAwRjJuZyBcdTAxMTFcdTFFQTd1IHRpXHUwMEVBbiBjaG8gY1x1MUVBMyBwaFx1MDBGMm5nLjwvcD5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICBub3Rlc0xpc3QubWFwKChuKSA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17bi5pZH0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1zdGFydCBnYXAtMiBncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBmbGV4LXdyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTQwMFwiPntuLnRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bi52aWRlb1RpbWVTZWMgIT0gbnVsbCAmJiBuLnZpZGVvVGltZVNlYyA+IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geWV1Q2F1VHVhKG4udmlkZW9UaW1lU2VjKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0xLjUgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrIGJnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCBob3ZlcjpiZy12aW9sZXQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2IHtkaW5oRGFuZ0dpYXlQaHV0KG4udmlkZW9UaW1lU2VjKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTYwMCBmb250LW1vbm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge24udGFvTHVjID8gbmV3IERhdGUobi50YW9MdWMucmVwbGFjZSgnICcsICdUJykgKyAnWicpLnRvTG9jYWxlVGltZVN0cmluZyhbXSwgeyBob3VyOiAnMi1kaWdpdCcsIG1pbnV0ZTogJzItZGlnaXQnIH0pIDogJyd9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTIwMCBsZWFkaW5nLXJlbGF4ZWQgYnJlYWstd29yZHNcIj57bi5ub2lEdW5nfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIHsobi5jdWFUb2kgfHwgaXNTdGFmZikgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geG9hR2hpQ2h1KG4uaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJYb1x1MDBFMSBnaGkgY2hcdTAwRkFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHRleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtcm9zZS00MDAgdGV4dC1bMTBweF0gcHgtMSB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICB7bm90ZXNDYW5Xcml0ZSA/IChcbiAgICAgICAgICAgICAgPGZvcm1cbiAgICAgICAgICAgICAgICBvblN1Ym1pdD17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICBpZiAoIWUubmF0aXZlRXZlbnQ/LmlzQ29tcG9zaW5nICYmICFub3RlQ29tcG9zaW5nUmVmLmN1cnJlbnQpIHRoZW1HaGlDaHUoKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgaWQ9XCJzdHVkeS1ub3RlLWlucHV0XCJcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtub3RlSW5wdXR9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXROb3RlSW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0PXsoKSA9PiB7IG5vdGVDb21wb3NpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPXsoKSA9PiB7IG5vdGVDb21wb3NpbmdSZWYuY3VycmVudCA9IGZhbHNlOyB9fVxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJUaFx1MDBFQW0gZ2hpIGNoXHUwMEZBIGNobyBwaFx1MDBGMm5nLi4uXCJcbiAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17MTAwMH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwIHJvdW5kZWQteGwgcHgtMyBweS0yIHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0Tm90ZVdpdGhUaW1lKHYgPT4gIXYpfVxuICAgICAgICAgICAgICAgICAgdGl0bGU9e25vdGVXaXRoVGltZSA/ICdcdTAxMTBhbmcgZ1x1MUVBRm4gbVx1MUVEMWMgdmlkZW8gdlx1MDBFMG8gZ2hpIGNoXHUwMEZBJyA6ICdLaFx1MDBGNG5nIGdcdTFFQUZuIG1cdTFFRDFjIHZpZGVvJ31cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTIuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7bm90ZVdpdGhUaW1lID8gJ2JnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlci12aW9sZXQtNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNTAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICAgICAgICBcdTIzRjFcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLWFkZC1ub3RlXCJcbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshbm90ZUlucHV0LnRyaW0oKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMiByb3VuZGVkLXhsIGJnLVsjMDBGMkZFXSB0ZXh0LWJsYWNrIHRleHQteHMgZm9udC1ibGFjayBkaXNhYmxlZDpvcGFjaXR5LTMwXCI+XG4gICAgICAgICAgICAgICAgICBUaFx1MDBFQW1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1hbWJlci0zMDAvODAgdGV4dC1jZW50ZXIgcHktMVwiPlx1RDgzRFx1REQxMiBHaGkgY2hcdTAwRkEgXHUwMTExYW5nIFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgY2hcdTFFQzkgeGVtIFx1MjAxNCBxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZyBcdTAxMTFcdTAwRTMga2hcdTAwRjNhLjwvcD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRBQiAzOiBCXHUxRUEyTkcgVlx1MUVCQyBDXHUxRUQ4TkcgVFx1MDBDMUMgKFNIQVJFRCBXSElURUJPQVJEKSAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICd3aGl0ZWJvYXJkJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMlwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgZmxleC13cmFwIHRleHQteHMgcGItMVwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi13Yi1wZW5cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0V2JUb29sKCdwZW4nKX1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshd2JDYW5Xcml0ZX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTIuNSBweS0xIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgZGlzYWJsZWQ6b3BhY2l0eS00MCAke3diVG9vbCA9PT0gJ3BlbicgPyAnYmctWyMwMEYyRkVdIHRleHQtYmxhY2snIDogJ2JnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwJ31gfT5cbiAgICAgICAgICAgICAgICAgIFx1MjcwRlx1RkUwRiBCXHUwMEZBdCB2XHUxRUJEXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi13Yi1lcmFzZXJcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0V2JUb29sKCdlcmFzZXInKX1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshd2JDYW5Xcml0ZX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTIuNSBweS0xIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgZGlzYWJsZWQ6b3BhY2l0eS00MCAke3diVG9vbCA9PT0gJ2VyYXNlcicgPyAnYmctcm9zZS01MDAgdGV4dC13aGl0ZScgOiAnYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAnfWB9PlxuICAgICAgICAgICAgICAgICAgXHVEODNFXHVEREY5IFRcdTFFQTl5XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBtbC0yXCI+XG4gICAgICAgICAgICAgICAgICB7WycjMDBGMkZFJywgJyNGRkI4MDAnLCAnI0Y0M0Y1RScsICcjRkZGRkZGJ10ubWFwKGMgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAga2V5PXtjfVxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshd2JDYW5Xcml0ZX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldFdiQ29sb3IoYyk7IHNldFdiVG9vbCgncGVuJyk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy01IGgtNSByb3VuZGVkLWZ1bGwgYm9yZGVyIGRpc2FibGVkOm9wYWNpdHktNDAgJHt3YkNvbG9yID09PSBjICYmIHdiVG9vbCA9PT0gJ3BlbicgPyAnc2NhbGUtMTEwIGJvcmRlci13aGl0ZSByaW5nLTIgcmluZy1jeWFuLTQwMCcgOiAnYm9yZGVyLXRyYW5zcGFyZW50J31gfVxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6IGMgfX1cbiAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17Y31cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAge2lzU3RhZmYgJiYgKFxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4td2ItY2xlYXJcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17Y2xlYXJXaGl0ZWJvYXJkfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy13aGl0ZS81IGhvdmVyOmJnLXJvc2UtNTAwLzIwIHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXhzIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgWFx1MDBGM2EgYlx1MUVBM25nXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgb3ZlcmZsb3ctaGlkZGVuIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJlbGF0aXZlIHRvdWNoLW5vbmUgbWluLWgtWzIyMHB4XVwiPlxuICAgICAgICAgICAgICB7IXdiQ2FuV3JpdGUgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgaW5zZXQtMCB6LTEwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLWJsYWNrLzQwIHRleHQtWzExcHhdIHRleHQtYW1iZXItMzAwLzkwIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgXHVEODNEXHVERDEyIEJcdTFFQTNuZyB2XHUxRUJEIFx1MDExMWFuZyBcdTFFREYgY2hcdTFFQkYgXHUwMTExXHUxRUQ5IGNoXHUxRUM5IHhlbVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8Y2FudmFzXG4gICAgICAgICAgICAgICAgaWQ9XCJzdHVkeS13aGl0ZWJvYXJkLWNhbnZhc1wiXG4gICAgICAgICAgICAgICAgcmVmPXtjYW52YXNSZWZ9XG4gICAgICAgICAgICAgICAgd2lkdGg9ezY0MH1cbiAgICAgICAgICAgICAgICBoZWlnaHQ9ezMyMH1cbiAgICAgICAgICAgICAgICBvbk1vdXNlRG93bj17d2JDYW5Xcml0ZSA/IHN0YXJ0RHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvbk1vdXNlTW92ZT17d2JDYW5Xcml0ZSA/IGRyYXdNb3ZlIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uTW91c2VVcD17d2JDYW5Xcml0ZSA/IHN0b3BEcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17d2JDYW5Xcml0ZSA/IHN0b3BEcmF3aW5nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uVG91Y2hTdGFydD17d2JDYW5Xcml0ZSA/IHN0YXJ0RHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvblRvdWNoTW92ZT17d2JDYW5Xcml0ZSA/IGRyYXdNb3ZlIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIG9uVG91Y2hFbmQ9e3diQ2FuV3JpdGUgPyBzdG9wRHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgaC1mdWxsICR7d2JDYW5Xcml0ZSA/ICdjdXJzb3ItY3Jvc3NoYWlyJyA6ICdjdXJzb3Itbm90LWFsbG93ZWQnfWB9XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDQ6IEJcdTFFQTJORyBUXHUwMENETkggQ1x1MUVEOE5HIFRcdTAwQzFDIChTSEFSRUQgU0hFRVQgOHgxMCkgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAnc2hlZXQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0yIG92ZXJmbG93LXgtYXV0b1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgICBCXHUxRUEzbmcgdFx1MDBFRG5oIHBoXHUwMEUybiB0XHUwMEVEY2ggc1x1MUVEMSBsaVx1MUVDN3UgLyBtXHUxRUQxYyB0aFx1MUVERGkgZ2lhbiBoXHUxRUNEYyB0XHUxRUFEcCAoTFx1MDFCMHUgdFx1MUVGMSBcdTAxMTFcdTFFRDluZylcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3ctYXV0byBtYXgtaC03MiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgYmctWyMwQjBFMTRdXCI+XG4gICAgICAgICAgICAgIDx0YWJsZSBpZD1cInN0dWR5LXNoZWV0LXRhYmxlXCIgY2xhc3NOYW1lPVwidy1mdWxsIHRleHQteHMgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyLWNvbGxhcHNlXCI+XG4gICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImJnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwidy04IHAtMSB0ZXh0LWNlbnRlciBib3JkZXItciBib3JkZXItd2hpdGUvMTAgdGV4dC1bMTBweF1cIj4jPC90aD5cbiAgICAgICAgICAgICAgICAgICAge0NPTFMubWFwKGMgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgIDx0aCBrZXk9e2N9IGNsYXNzTmFtZT1cInAtMS41IHRleHQtY2VudGVyIGJvcmRlci1yIGJvcmRlci13aGl0ZS8xMCBtaW4tdy1bNzBweF0gdGV4dC1bMTFweF0gZm9udC1ib2xkIHRleHQtY3lhbi0zMDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtjfVxuICAgICAgICAgICAgICAgICAgICAgIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgIHtST1dTLm1hcChyID0+IChcbiAgICAgICAgICAgICAgICAgICAgPHRyIGtleT17cn0gY2xhc3NOYW1lPVwiYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvWzAuMDJdXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMSB0ZXh0LWNlbnRlciBiZy13aGl0ZS81IHRleHQtc2xhdGUtNTAwIGZvbnQtbW9ubyB0ZXh0LVsxMHB4XSBib3JkZXItciBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtyfVxuICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAge0NPTFMubWFwKGMgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2VsbEtleSA9IGAke2N9JHtyfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQga2V5PXtjZWxsS2V5fSBjbGFzc05hbWU9XCJwLTAgYm9yZGVyLXIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtY2VsbD17Y2VsbEtleX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtzaGVldENlbGxzW2NlbGxLZXldIHx8ICcnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVhZE9ubHk9eyFzaGVldENhbldyaXRlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Gb2N1cz17KCkgPT4geyBzaGVldEZvY3VzZWRDZWxsUmVmLmN1cnJlbnQgPSBjZWxsS2V5OyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoKSA9PiB7IHNoZWV0Rm9jdXNlZENlbGxSZWYuY3VycmVudCA9IG51bGw7IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzaGVldENhbldyaXRlICYmIGhhbmRsZUNlbGxDaGFuZ2UoY2VsbEtleSwgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIGJnLXRyYW5zcGFyZW50IHB4LTIgcHktMSB0ZXh0LXhzIHRleHQtd2hpdGUgZm9jdXM6YmctWyMxNTFBMjNdIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1bIzAwRjJGRV0gJHshc2hlZXRDYW5Xcml0ZSA/ICdvcGFjaXR5LTYwIGN1cnNvci1ub3QtYWxsb3dlZCcgOiAnJ31gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBUQUIgNTogMS1UTy0xIFdFQlJUQyBWT0lDRSBcdTIwMTQgcGFpci1ib3VuZCwgY1x1MDBGMyB4aW4gcXV5XHUxRUMxbiAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICd2b2ljZScgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNiB0ZXh0LWNlbnRlciBnYXAtNFwiPlxuICAgICAgICAgICAgPGF1ZGlvIHJlZj17cmVtb3RlQXVkaW9SZWZ9IGF1dG9QbGF5IC8+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTYgaC0xNiByb3VuZGVkLTN4bCBiZy1hbWJlci00MDAvMTUgYm9yZGVyIGJvcmRlci1hbWJlci00MDAvMzAgdGV4dC1hbWJlci00MDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC0zeGwgc2hhZG93LVswXzBfMjBweF9yZ2JhKDI0NSwxNTgsMTEsMC4yKV1cIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERjk5XHVGRTBGXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC13aGl0ZVwiPlRob1x1MUVBMWkgVHJcdTFFRjFjIFRpXHUxRUJGcCAxLTEgVHJvbmcgUGhcdTAwRjJuZzwvaDQ+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDAgbWF4LXcteHMgbXQtMVwiPlxuICAgICAgICAgICAgICAgIE1cdTFFRDdpIHBoXHUwMEYybmcgdFx1MUVEMWkgXHUwMTExYSBtXHUxRUQ5dCBjXHUxRUI3cCB2b2ljZSAxLTEuIE1pY3JvIG1cdTFFQjdjIFx1MDExMVx1MUVDQm5oIHRcdTFFQUZ0IGtoaSBjaFx1MDFCMGEgYlx1MUVBRHQuXG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogVHJcdTFFQTFuZyB0aFx1MDBFMWkgY1x1MUVCN3AgaGlcdTFFQzduIHRcdTFFQTFpICovfVxuICAgICAgICAgICAge3ZvaWNlUGFpcj8uYWN0aXZlICE9PSB1bmRlZmluZWQgJiYgKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgYmctd2hpdGUvNSBweC0zIHB5LTEgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgICB7dm9pY2VQYWlyPy5hVGVuID8gYCR7dm9pY2VQYWlyLmFUZW59JHt2b2ljZVBhaXIuYlRlbiA/ICcgXHUyMTk0ICcgKyB2b2ljZVBhaXIuYlRlbiA6ICcgXHUwMEI3IFx1MDExMWFuZyBjaFx1MUVERCBuZ1x1MDFCMFx1MUVERGkgdGhcdTFFRTkgMid9YCA6ICdDaFx1MDFCMGEgY1x1MDBGMyBjXHUxRUI3cCB2b2ljZSBuXHUwMEUwbyd9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgZmxleC13cmFwIGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgICAgICAgIHshdm9pY2VKb2luZWQgPyAoXG4gICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgIHtjb1F1eWVuKCd2b2ljZScpID8gKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2Utam9pblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17am9pblZvaWNlfVxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt2b2ljZVBhaXI/LmFjdGl2ZSAmJiAhdm9pY2VQYWlyPy55b3VJbn1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIuNSByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tb3JhbmdlLTUwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC14cyBzaGFkb3ctbGcgaG92ZXI6b3BhY2l0eS05MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS00MFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHt2b2ljZVBhaXI/LmFjdGl2ZSA/ICdcdTAxMTBhbmcgY1x1MDBGMyBjXHUxRUI3cCB2b2ljZSBraFx1MDBFMWMnIDogdm9pY2VQYWlyPy5hVGVuID8gJ1ZcdTAwRTBvIGNcdTFFQjdwIHZcdTFFREJpICcgKyB2b2ljZVBhaXIuYVRlbiA6ICdUaGFtIGdpYSB2b2ljZSd9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLXJlcXVlc3RcIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3hpblF1eWVuVm9pY2V9XG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZvaWNlUmVxdWVzdGVkfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMi41IHJvdW5kZWQteGwgYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0yMDAgYm9yZGVyIGJvcmRlci13aGl0ZS8xNSBmb250LWJvbGQgdGV4dC14cyBob3ZlcjpiZy13aGl0ZS8xNSB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3ZvaWNlUmVxdWVzdGVkID8gJ1x1MjNGMyBcdTAxMTBhbmcgY2hcdTFFREQgZHV5XHUxRUM3dFx1MjAyNicgOiAnXHVEODNEXHVERTRCIFhpbiBxdXlcdTFFQzFuIHZvaWNlJ31cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS10b2dnbGUtbWljXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlTWljfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC00IHB5LTIuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHttaWNNdXRlZCA/ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3ZlcjpiZy13aGl0ZS8xNScgOiAnYmctZW1lcmFsZC01MDAgdGV4dC1ibGFjayd9YH0+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPnttaWNNdXRlZCA/ICdcdUQ4M0RcdUREMDcgQlx1MUVBRHQgTWljJyA6ICdcdUQ4M0NcdURGOTlcdUZFMEYgTWljIFx1MDExMGFuZyBCXHUxRUFEdCd9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1sZWF2ZVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2xlYXZlVm9pY2V9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMi41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMjAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzMwIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgIFJcdTFFRERpIHZvaWNlXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAge2lzU3RhZmYgJiYgdm9pY2VQYWlyPy5hVGVuICYmICF2b2ljZVBhaXI/LnlvdUluICYmIChcbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLWVuZFwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtuZ2F0Vm9pY2VDYXB9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzEwIHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8yNSB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8yMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgTmdcdTFFQUZ0IGNcdTFFQjdwIHZvaWNlXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFN0YWZmOiBkYW5oIHNcdTAwRTFjaCB4aW4gcXV5XHUxRUMxbiB2b2ljZSAqL31cbiAgICAgICAgICAgIHtpc1N0YWZmICYmIHlldUNhdVZvaWNlLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy1zbSBiZy13aGl0ZS81IGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTIuNSB0ZXh0LWxlZnRcIj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHRleHQtYW1iZXItMzAwIG1iLTEuNVwiPlx1MDExMGFuZyB4aW4gcXV5XHUxRUMxbiB2b2ljZTwvcD5cbiAgICAgICAgICAgICAgICB7eWV1Q2F1Vm9pY2UubWFwKHIgPT4gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3Iua2hvYX0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyBweS0xXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtMjAwIGZvbnQtc2VtaWJvbGQgZmxleC0xIHRydW5jYXRlXCI+e3IudGVuIHx8ICdUaFx1MDBFMG5oIHZpXHUwMEVBbid9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4geyBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiByLmtob2EsIGNhcGFiaWxpdHk6ICd2b2ljZScsIG9uOiB0cnVlIH0pOyBpZiAoZD8ub2spIHNldFlldUNhdVZvaWNlKHByZXYgPT4gcHJldi5maWx0ZXIoeCA9PiB4Lmtob2EgIT09IHIua2hvYSkpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctZW1lcmFsZC01MDAvMjAgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIER1eVx1MUVDN3RcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHIua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246IGZhbHNlIH0pOyBpZiAoZD8ub2spIHNldFlldUNhdVZvaWNlKHByZXYgPT4gcHJldi5maWx0ZXIoeCA9PiB4Lmtob2EgIT09IHIua2hvYSkpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzI1IHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgIFRcdTFFRUIgY2hcdTFFRDFpXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAge3ZvaWNlTm90aWNlICYmIChcbiAgICAgICAgICAgICAgPHAgaWQ9XCJ2b2ljZS1zdGF0dXMtbm90aWNlXCIgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTMwMCBmb250LW1vbm8gYmctYmxhY2svNDAgcHgtMyBweS0xLjUgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICB7dm9pY2VOb3RpY2V9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCBtYXgtdy14c1wiPlxuICAgICAgICAgICAgICAqIEdoaSBjaFx1MDBGQTogS1x1MUVCRnQgblx1MUVEMWkgdGhvXHUxRUExaSBQMlAgeVx1MDBFQXUgY1x1MUVBN3UgbVx1MUVBMW5nIGtoXHUwMEY0bmcgY2hcdTFFQjduIFVEUC4gUmVzdHJpY3RpdmUgTkFUIGNcdTAwRjMgdGhcdTFFQzMgY1x1MUVBN24gcmVsYXkgVFVSTi5cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDY6IFFVXHUxRUEyTiBUUlx1MUVDQSBQSFx1MDBEMk5HIChzdGFmZiBvbmx5KSBcdTIwMTQgcG9saWN5IG1hdHJpeCArIG1lbWJlciBhY3Rpb25zICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ3F1YW4tdHJpJyAmJiBpc1N0YWZmICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0zIG92ZXJmbG93LXktYXV0byBtYXgtaC04MCBwci0xXCI+XG4gICAgICAgICAgICB7LyogUXVpY2sgYWN0aW9ucyB0aGVvIG1cdTAwRjQgaFx1MDBFQ25oIFx1MDExMVx1MDBFMyBjaFx1MUVEMXQgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjYXAgb2YgWydub3RlcycsICd3aGl0ZWJvYXJkJywgJ3NoZWV0J10pIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdwb2xpY3knLCB7IGNhcGFiaWxpdHk6IGNhcCwgZW5hYmxlZDogMSwgYWNjZXNzTW9kZTogJ3N0YWZmX29ubHknIH0pO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xNSB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdGV4dC1bMTFweF0gZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgXHVEODNEXHVERDEyIEtoXHUwMEYzYSBjXHUxRUQ5bmcgdFx1MDBFMWMgKGNoXHUxRUM5IHhlbSlcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNhcCBvZiBbJ25vdGVzJywgJ3doaXRlYm9hcmQnLCAnc2hlZXQnXSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiAxLCBhY2Nlc3NNb2RlOiAnZXZlcnlvbmUnIH0pO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC14bCBiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtMzAwIGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMzAgdGV4dC1bMTFweF0gZm9udC1ib2xkIGhvdmVyOmJnLWVtZXJhbGQtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgXHVEODNEXHVERDEzIE1cdTFFREYgY1x1MUVEOW5nIHRcdTAwRTFjIGNobyBtXHUxRUNEaSBuZ1x1MDFCMFx1MUVERGlcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFBvbGljeSBtYXRyaXggKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0zXCI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdGV4dC1zbGF0ZS00MDAgbWItMlwiPkNoXHUwMEVEbmggc1x1MDBFMWNoIGNcdTAwRjRuZyBjXHUxRUU1PC9wPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMS41XCI+XG4gICAgICAgICAgICAgICAge1tcbiAgICAgICAgICAgICAgICAgIFsndmlkZW9fY29udHJvbCcsICdcdTAxMTBpXHUxRUMxdSBraGlcdTFFQzNuIHBoXHUwMEUxdCAocGxheS9wYXVzZS90dWEpJ10sXG4gICAgICAgICAgICAgICAgICBbJ3ZpZGVvX2NoYW5nZScsICdcdTAxMTBcdTFFRDVpIHZpZGVvIFx1MDExMWFuZyBwaFx1MDBFMXQnXSxcbiAgICAgICAgICAgICAgICAgIFsncXVldWUnLCAnSFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdmlkZW8nXSxcbiAgICAgICAgICAgICAgICAgIFsnY2hhdCcsICdDaGF0IHBoXHUwMEYybmcnXSxcbiAgICAgICAgICAgICAgICAgIFsnbm90ZXMnLCAnR2hpIGNoXHUwMEZBIGNodW5nJ10sXG4gICAgICAgICAgICAgICAgICBbJ3doaXRlYm9hcmQnLCAnQlx1MUVBM25nIHZcdTFFQkQnXSxcbiAgICAgICAgICAgICAgICAgIFsnc2hlZXQnLCAnQlx1MUVBM25nIHRcdTAwRURuaCddLFxuICAgICAgICAgICAgICAgICAgWyd2b2ljZScsICdWb2ljZSAxLTEnXSxcbiAgICAgICAgICAgICAgICAgIFsnaW52aXRlJywgJ01cdTFFRERpIG5nXHUwMUIwXHUxRUREaSB2XHUwMEUwbyBwaFx1MDBGMm5nJ10sXG4gICAgICAgICAgICAgICAgXS5tYXAoKFtjYXAsIG5oYW5dKSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBwb2wgPSBwb2xpY2llcz8uW2NhcF0gfHwgeyBlbmFibGVkOiAxLCBhY2Nlc3NfbW9kZTogJ3N0YWZmX29ubHknIH07XG4gICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17Y2FwfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmxleC0xIHRleHQtc2xhdGUtMzAwIHRydW5jYXRlXCI+e25oYW59PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdwb2xpY3knLCB7IGNhcGFiaWxpdHk6IGNhcCwgZW5hYmxlZDogcG9sLmVuYWJsZWQgPyAwIDogMSwgYWNjZXNzTW9kZTogcG9sLmFjY2Vzc19tb2RlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e3BvbC5lbmFibGVkID8gJ1x1MDExMGFuZyBiXHUxRUFEdCBcdTIwMTQgYlx1MUVBNW0gXHUwMTExXHUxRUMzIHRcdTFFQUZ0JyA6ICdcdTAxMTBhbmcgdFx1MUVBRnQgXHUyMDE0IGJcdTFFQTVtIFx1MDExMVx1MUVDMyBiXHUxRUFEdCd9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTggaC00LjUgcHgtMC41IHJvdW5kZWQtZnVsbCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgJHtwb2wuZW5hYmxlZCA/ICdiZy1lbWVyYWxkLTUwMC8zMCBib3JkZXItZW1lcmFsZC01MDAvNDAganVzdGlmeS1lbmQnIDogJ2JnLXdoaXRlLzUgYm9yZGVyLXdoaXRlLzE1IGp1c3RpZnktc3RhcnQnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdy0zIGgtMyByb3VuZGVkLWZ1bGwgJHtwb2wuZW5hYmxlZCA/ICdiZy1lbWVyYWxkLTQwMCcgOiAnYmctc2xhdGUtNTAwJ31gfT48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3BvbC5hY2Nlc3NfbW9kZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshcG9sLmVuYWJsZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBoYW5oRG9uZ1Bob25nPy4oJ3BvbGljeScsIHsgY2FwYWJpbGl0eTogY2FwLCBlbmFibGVkOiAxLCBhY2Nlc3NNb2RlOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgcHgtMS41IHB5LTEgdGV4dC1bMTBweF0gdGV4dC1zbGF0ZS0yMDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTAgZGlzYWJsZWQ6b3BhY2l0eS00MFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInN0YWZmX29ubHlcIj5RdVx1MUVBM24gdHJcdTFFQ0I8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJzZWxlY3RlZF9tZW1iZXJzXCI+TVx1MUVEOXQgc1x1MUVEMSBuZ1x1MDFCMFx1MUVERGk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJldmVyeW9uZVwiPk1cdTFFQ0RpIG5nXHUwMUIwXHUxRUREaTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIG9wYWNpdHktNjBcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZsZXgtMSB0ZXh0LXNsYXRlLTQwMFwiPktpXHUxRUMzbSBkdXlcdTFFQzd0IChraWNrL3hvXHUwMEUxIHRpbik8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIGZvbnQtYm9sZCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMCByb3VuZGVkIHB4LTEuNSBweS0wLjVcIj5MVVx1MDBENE4gUVVcdTFFQTJOIFRSXHUxRUNBPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogUXVcdTFFQTNuIGxcdTAwRkQgdGhcdTAwRTBuaCB2aVx1MDBFQW4gKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgcC0zXCI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdGV4dC1zbGF0ZS00MDAgbWItMlwiPlRoXHUwMEUwbmggdmlcdTAwRUFuICYgcXV5XHUxRUMxbiByaVx1MDBFQW5nPC9wPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMS41XCI+XG4gICAgICAgICAgICAgICAgeyh0aGFuaFZpZW4gfHwgW10pLm1hcCh0diA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUhvc3QgPSBCb29sZWFuKHR2LmxhQ2h1UGhvbmcpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgbGFHViA9IHR2LnZhaVRybyA9PT0gJ2dpYW9fdmllbic7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsYUNvSG9zdCA9IHR2LnZhaVRyb1Bob25nID09PSAnY29faG9zdCc7XG4gICAgICAgICAgICAgICAgICBjb25zdCBncmFudFZvaWNlID0gKGdyYW50cyB8fCBbXSkuc29tZShnID0+IGcua2hvYSA9PT0gdHYua2hvYSAmJiBnLmNhcGFiaWxpdHkgPT09ICd2b2ljZScgJiYgZy50cmFuZ1RoYWkgPT09ICdncmFudGVkJyk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBncmFudFZpZGVvID0gKGdyYW50cyB8fCBbXSkuc29tZShnID0+IGcua2hvYSA9PT0gdHYua2hvYSAmJiBnLmNhcGFiaWxpdHkgPT09ICd2aWRlb19jb250cm9sJyAmJiBnLnRyYW5nVGhhaSA9PT0gJ2dyYW50ZWQnKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXt0di5raG9hIHx8IHR2LnRlbn0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSB0ZXh0LXhzIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtMjAwIGZvbnQtc2VtaWJvbGQgdHJ1bmNhdGUgbWF4LXctWzExMHB4XVwiPnt0di50ZW59PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIHtsYUhvc3QgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LWFtYmVyLTQwMCBmb250LWJvbGRcIj5cdTI2MDUgaG9zdDwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAge2xhR1YgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LVsjMDBGMkZFXSBmb250LWJvbGRcIj5HVjwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAge2xhQ29Ib3N0ICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC12aW9sZXQtMzAwIGZvbnQtYm9sZFwiPmNvLWhvc3Q8L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgIHshbGFIb3N0ICYmICFsYUdWICYmIHR2Lmtob2EgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWwtYXV0byBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7KHZhaVRyb1Bob25nID09PSAnaG9zdCcgfHwgYXV0aC51c2VyPy5pc1RlYWNoZXIpICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/Lignc2V0X2NvX2hvc3QnLCB7IGtob2FUVjogdHYua2hvYSwgb246ICFsYUNvSG9zdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtsYUNvSG9zdCA/ICdUaHUgcXV5XHUxRUMxbiBjby1ob3N0JyA6ICdDXHUxRUE1cCBjby1ob3N0J31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgJHtsYUNvSG9zdCA/ICdiZy12aW9sZXQtNTAwLzIwIHRleHQtdmlvbGV0LTMwMCBib3JkZXItdmlvbGV0LTUwMC80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjby1ob3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHR2Lmtob2EsIGNhcGFiaWxpdHk6ICd2b2ljZScsIG9uOiAhZ3JhbnRWb2ljZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNcdTFFQTVwL3RodSBxdXlcdTFFQzFuIHZvaWNlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyICR7Z3JhbnRWb2ljZSA/ICdiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERjk5XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndmlkZW9fY29udHJvbCcsIG9uOiAhZ3JhbnRWaWRlbyB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNcdTFFQTVwL3RodSBxdXlcdTFFQzFuIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gdmlkZW9cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgJHtncmFudFZpZGVvID8gJ2JnLWN5YW4tNTAwLzIwIHRleHQtY3lhbi0zMDAgYm9yZGVyLWN5YW4tNTAwLzQwJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7IGlmIChjb25maXJtKGBLaWNrICR7dHYudGVufSBraFx1MUVDRmkgcGhcdTAwRjJuZz9gKSkgeyBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdraWNrJywgeyBraG9hVFY6IHR2Lmtob2EgfSk7IGlmIChkICYmICFkLm9rKSBhbGVydChkLmxvaSB8fCAnS2hcdTAwRjRuZyBraWNrIFx1MDExMVx1MDFCMFx1MUVFM2MuJyk7IH0gfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIktpY2sga2hcdTFFQ0ZpIHBoXHUwMEYybmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgYmctcm9zZS01MDAvMTAgdGV4dC1yb3NlLTMwMCBib3JkZXItcm9zZS01MDAvMjUgaG92ZXI6Ymctcm9zZS01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBraWNrXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICB7KHRoYW5oVmllbiB8fCBbXSkubGVuZ3RoID09PSAwICYmIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwXCI+Q2hcdTAxQjBhIGNcdTAwRjMgdGhcdTAwRTBuaCB2aVx1MDBFQW4uPC9wPn1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFx1MDExMFx1MUVENWkvYlx1MUVDRiBtXHUxRUFEdCBraFx1MUVBOXUgXHUyMDE0IGNoXHUxRUM5IGhvc3QvR1YgKi99XG4gICAgICAgICAgICB7KHZhaVRyb1Bob25nID09PSAnaG9zdCcgfHwgYXV0aC51c2VyPy5pc1RlYWNoZXIpICYmIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtMyBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiTVx1MUVBRHQga2hcdTFFQTl1IG1cdTFFREJpIChcdTAxMTFcdTFFQzMgdHJcdTFFRDFuZyA9IGJcdTFFQ0YgbVx1MUVBRHQga2hcdTFFQTl1KVwiXG4gICAgICAgICAgICAgICAgICBpZD1cImlucHV0LXBob25nLW1hdC1raGF1LW1vaVwiXG4gICAgICAgICAgICAgICAgICBtYXhMZW5ndGg9ezEwMH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIHB4LTIuNSBweS0xLjUgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MFwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wdXQtcGhvbmctbWF0LWtoYXUtbW9pJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1rID0gZWw/LnZhbHVlIHx8ICcnO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gbWsudHJpbSgpXG4gICAgICAgICAgICAgICAgICAgICAgPyBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2RvaV9tYXRfa2hhdScsIHsgbWF0S2hhdU1vaTogbWsudHJpbSgpIH0pXG4gICAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2JvX21hdF9raGF1Jywge30pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZCAmJiAhZC5vaykgYWxlcnQoZC5sb2kgfHwgJ0toXHUwMEY0bmcgXHUwMTExXHUxRUQ1aSBcdTAxMTFcdTAxQjBcdTFFRTNjIG1cdTFFQUR0IGtoXHUxRUE5dS4nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsKSBlbC52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQtbGcgYmctYW1iZXItNTAwLzE1IHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1hbWJlci01MDAvMjVcIj5cbiAgICAgICAgICAgICAgICAgIFx1MDExMFx1MUVENWkgLyBCXHUxRUNGXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gQ2FtcHVzV2F0Y2hUb2dldGhlcih7XG4gIHBob25nLFxuICBwaG9uZ01pbmhLaG9hLFxuICBhdXRoLFxuICBkb25nUGhvbmdIaWVuVGFpLFxuICBzb05ndW9pLFxuICBteUNhcHMsXG4gIHZpZGVvVGltZVJlZlxufSkge1xuICBjb25zdCBbd2F0Y2hTdGF0ZSwgc2V0V2F0Y2hTdGF0ZV0gPSB1c2VTdGF0ZSh7XG4gICAgcGxheWluZzogZmFsc2UsXG4gICAgcG9zaXRpb25TZWNvbmRzOiAwLFxuICAgIGJhc2VQb3NpdGlvblNlY29uZHM6IDAsXG4gICAgcGxheWJhY2tSYXRlOiAxLjAsXG4gICAgcmV2aXNpb246IDEsXG4gICAgdXBkYXRlZEF0OiAnJyxcbiAgICBzZXJ2ZXJOb3c6ICcnLFxuICAgIHVwZGF0ZWRCeTogJydcbiAgfSk7XG4gIGNvbnN0IFtjYW5Db250cm9sLCBzZXRDYW5Db250cm9sXSA9IHVzZVN0YXRlKEJvb2xlYW4oYXV0aD8udXNlcj8uaXNUZWFjaGVyIHx8IHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nKSk7XG4gIGNvbnN0IFt3YXRjaENhcHMsIHNldFdhdGNoQ2Fwc10gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW3Byb3ZpZGVyLCBzZXRQcm92aWRlcl0gPSB1c2VTdGF0ZSgnVU5TVVBQT1JURUQnKTtcbiAgY29uc3QgW2hhc0ludGVyYWN0ZWQsIHNldEhhc0ludGVyYWN0ZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9jYWxUaW1lLCBzZXRMb2NhbFRpbWVdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtkdXJhdGlvbiwgc2V0RHVyYXRpb25dID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtkYW5nR3VpTGVuaCwgc2V0RGFuZ0d1aUxlbmhdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9pLCBzZXRMb2ldID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbdmlkZW9Nb2ksIHNldFZpZGVvTW9pXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3F1ZXVlTGlzdCwgc2V0UXVldWVMaXN0XSA9IHVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW3F1ZXVlQnVzeSwgc2V0UXVldWVCdXN5XSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2xpbmtDb3BpZWQsIHNldExpbmtDb3BpZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBjYXBzID0gd2F0Y2hDYXBzIHx8IG15Q2FwcyB8fCB7fTtcbiAgY29uc3QgZHVvY0RvaVZpZGVvID0gY2FuQ29udHJvbCB8fCBjYXBzLnZpZGVvX2NoYW5nZSA9PT0gdHJ1ZTtcbiAgY29uc3QgZHVvY1F1ZXVlID0gY2FuQ29udHJvbCB8fCBjYXBzLnF1ZXVlID09PSB0cnVlO1xuICBjb25zdCBkdW9jQ2hhdCA9IGNhcHMuY2hhdCAhPT0gZmFsc2U7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAocGhvbmc/LmNhbkNvbnRyb2wgfHwgcGhvbmc/LmxhQ2h1UGhvbmcgfHwgYXV0aD8udXNlcj8uaXNUZWFjaGVyKSB7XG4gICAgICBzZXRDYW5Db250cm9sKHRydWUpO1xuICAgIH1cbiAgfSwgW3Bob25nPy5jYW5Db250cm9sLCBwaG9uZz8ubGFDaHVQaG9uZywgYXV0aD8udXNlcj8uaXNUZWFjaGVyXSk7XG5cbiAgY29uc3QgdmlkZW9SZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IHl0UGxheWVyUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCB5dENvbnRhaW5lcklkID0gYHl0LXBsYXllci0ke3Bob25nLmlkfWA7XG4gIGNvbnN0IGlzU2Vla2luZ1JlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGhhc0ludGVyYWN0ZWRSZWYgPSB1c2VSZWYoZmFsc2UpO1xuXG4gIGxldCBjYXVIaW5oID0ge307XG4gIHRyeSB7IGNhdUhpbmggPSBwaG9uZy5jYXVIaW5oID8gSlNPTi5wYXJzZShwaG9uZy5jYXVIaW5oKSA6IHt9OyB9IGNhdGNoIHsgfVxuICBjb25zdCB2aWRlb1VybCA9IGNhdUhpbmgudmlkZW9VcmwgfHwgJyc7XG4gIGNvbnN0IHl0SWQgPSB2aWRlb1VybCA/IGlkWW91dHViZSh2aWRlb1VybCkgOiBudWxsO1xuICBjb25zdCBkcnZJZCA9IHZpZGVvVXJsID8gaWRHb29nbGVEcml2ZSh2aWRlb1VybCkgOiBudWxsO1xuICBjb25zdCB0cnVjVGllcFVybCA9IHZpZGVvVXJsICYmICF5dElkICYmICFkcnZJZCAmJiBsYVZpZGVvVHJ1Y1RpZXBGZSh2aWRlb1VybCkgPyB1cmxNZWRpYUZlKHZpZGVvVXJsKSA6ICcnO1xuXG4gIC8vIEtoXHUxRURGaSB0XHUxRUExbyBZb3VUdWJlIElGcmFtZSBQbGF5ZXIga2hpIHByb3ZpZGVyIGxcdTAwRTAgWW91VHViZVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICgheXRJZCkgcmV0dXJuO1xuICAgIGxldCBkZXN0cm95ZWQgPSBmYWxzZTtcbiAgICBuYXBZb3VUdWJlSWZyYW1lQXBpKCgpID0+IHtcbiAgICAgIGlmIChkZXN0cm95ZWQgfHwgIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpKSByZXR1cm47XG4gICAgICB0cnkge1xuICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50ID0gbmV3IHdpbmRvdy5ZVC5QbGF5ZXIoeXRDb250YWluZXJJZCwge1xuICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICAgICAgdmlkZW9JZDogeXRJZCxcbiAgICAgICAgICBwbGF5ZXJWYXJzOiB7XG4gICAgICAgICAgICBhdXRvcGxheTogMCxcbiAgICAgICAgICAgIGNvbnRyb2xzOiBjYW5Db250cm9sID8gMSA6IDAsXG4gICAgICAgICAgICBkaXNhYmxla2I6IGNhbkNvbnRyb2wgPyAwIDogMSxcbiAgICAgICAgICAgIG1vZGVzdGJyYW5kaW5nOiAxLFxuICAgICAgICAgICAgcmVsOiAwLFxuICAgICAgICAgICAgcGxheXNpbmxpbmU6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgb25SZWFkeTogKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChkZXN0cm95ZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldC5nZXREdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBldmVudC50YXJnZXQuZ2V0RHVyYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAoZCA+IDApIHNldER1cmF0aW9uKGQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25TdGF0ZUNoYW5nZTogKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmICFkYW5nR3VpTGVuaCAmJiAhaXNTZWVraW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuZGF0YSA9PT0gMSAmJiAhd2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oKCdwbGF5JywgZXZlbnQudGFyZ2V0LmdldEN1cnJlbnRUaW1lKCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuZGF0YSA9PT0gMiAmJiB3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3BhdXNlJywgZXZlbnQudGFyZ2V0LmdldEN1cnJlbnRUaW1lKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIHsgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGRlc3Ryb3llZCA9IHRydWU7XG4gICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFBsYXllclJlZi5jdXJyZW50LmRlc3Ryb3kpIHtcbiAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5kZXN0cm95KCk7IH0gY2F0Y2ggeyB9XG4gICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgfVxuICAgIH07XG4gIH0sIFt5dElkLCBwaG9uZy5pZF0pO1xuXG4gIC8vIFx1MDBDMXAgZFx1MUVFNW5nIHRyXHUxRUExbmcgdGhcdTAwRTFpIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgdFx1MUVFQiBzZXJ2ZXJcbiAgY29uc3QgYXBEdW5nRG9uZ0JvID0gKHN0LCBjdHJsLCBwcm92KSA9PiB7XG4gICAgY29uc3Qgbm93TXMgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHNlcnZlclRpbWVNcyA9IHN0LnNlcnZlck5vdyA/IG5ldyBEYXRlKHN0LnNlcnZlck5vdykuZ2V0VGltZSgpIDogbm93TXM7XG4gICAgY29uc3QgdXBkYXRlVGltZU1zID0gc3QudXBkYXRlZEF0ID8gbmV3IERhdGUoU3RyaW5nKHN0LnVwZGF0ZWRBdCkucmVwbGFjZSgnICcsICdUJykgKyAoU3RyaW5nKHN0LnVwZGF0ZWRBdCkuaW5jbHVkZXMoJ1QnKSA/ICcnIDogJ1onKSkuZ2V0VGltZSgpIDogbm93TXM7XG4gICAgY29uc3QgZWxhcHNlZFNlYyA9IE1hdGgubWF4KDAsIChub3dNcyAtIHVwZGF0ZVRpbWVNcykgLyAxMDAwKTtcblxuICAgIGxldCB0YXJnZXRQb3MgPSBOdW1iZXIoc3QucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICB0YXJnZXRQb3MgPSBOdW1iZXIoc3QuYmFzZVBvc2l0aW9uU2Vjb25kcyB8fCAwKSArIChlbGFwc2VkU2VjICogKHN0LnBsYXliYWNrUmF0ZSB8fCAxLjApKTtcbiAgICB9XG4gICAgc2V0TG9jYWxUaW1lKE1hdGgubWF4KDAsIE1hdGguZmxvb3IodGFyZ2V0UG9zKSkpO1xuXG4gICAgaWYgKGN0cmwgJiYgaXNTZWVraW5nUmVmLmN1cnJlbnQpIHJldHVybjtcblxuICAgIGlmIChwcm92ID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICBjb25zdCB2ID0gdmlkZW9SZWYuY3VycmVudDtcbiAgICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICAgIGNvbnN0IGRyaWZ0ID0gTWF0aC5hYnModi5jdXJyZW50VGltZSAtIHRhcmdldFBvcyk7XG4gICAgICAgIGlmIChkcmlmdCA+IDEuNSkge1xuICAgICAgICAgIHYuY3VycmVudFRpbWUgPSB0YXJnZXRQb3M7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHYucGF1c2VkICYmIChoYXNJbnRlcmFjdGVkIHx8IGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCB8fCBjdHJsKSkge1xuICAgICAgICAgIHYucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodi5wbGF5YmFja1JhdGUgIT09IChzdC5wbGF5YmFja1JhdGUgfHwgMS4wKSkge1xuICAgICAgICAgIHYucGxheWJhY2tSYXRlID0gc3QucGxheWJhY2tSYXRlIHx8IDEuMDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCF2LnBhdXNlZCkgdi5wYXVzZSgpO1xuICAgICAgICBjb25zdCBkcmlmdCA9IE1hdGguYWJzKHYuY3VycmVudFRpbWUgLSBzdC5wb3NpdGlvblNlY29uZHMpO1xuICAgICAgICBpZiAoZHJpZnQgPiAwLjgpIHtcbiAgICAgICAgICB2LmN1cnJlbnRUaW1lID0gc3QucG9zaXRpb25TZWNvbmRzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcm92ID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFBsYXllclJlZi5jdXJyZW50LmdldFBsYXllclN0YXRlKSB7XG4gICAgICBjb25zdCBwID0geXRQbGF5ZXJSZWYuY3VycmVudDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGN1ciA9IHAuZ2V0Q3VycmVudFRpbWUoKSB8fCAwO1xuICAgICAgICBjb25zdCBkcmlmdCA9IE1hdGguYWJzKGN1ciAtIHRhcmdldFBvcyk7XG4gICAgICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICAgICAgaWYgKGRyaWZ0ID4gMS41KSB7XG4gICAgICAgICAgICBwLnNlZWtUbyh0YXJnZXRQb3MsIHRydWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwcyA9IHAuZ2V0UGxheWVyU3RhdGUoKTtcbiAgICAgICAgICBpZiAocHMgIT09IDEgJiYgcHMgIT09IDMgJiYgKGhhc0ludGVyYWN0ZWQgfHwgY3RybCkpIHtcbiAgICAgICAgICAgIHAucGxheVZpZGVvKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHBzID0gcC5nZXRQbGF5ZXJTdGF0ZSgpO1xuICAgICAgICAgIGlmIChwcyA9PT0gMSkgcC5wYXVzZVZpZGVvKCk7XG4gICAgICAgICAgaWYgKE1hdGguYWJzKGN1ciAtIHN0LnBvc2l0aW9uU2Vjb25kcykgPiAwLjgpIHtcbiAgICAgICAgICAgIHAuc2Vla1RvKHN0LnBvc2l0aW9uU2Vjb25kcywgdHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHsgfVxuICAgIH1cbiAgfTtcblxuICAvLyBQb2xsIHRyXHUxRUExbmcgdGhcdTAwRTFpIG1cdTAwRTF5IGNoXHUxRUU3IG1cdTFFRDdpIDIuNXNcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaFdhdGNoID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctd2F0Y2g/cGhvbmdJZD0ke3Bob25nLmlkfWApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKCFhY3RpdmUpIHJldHVybjtcbiAgICAgICAgaWYgKGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgICAgc2V0Q2FuQ29udHJvbChCb29sZWFuKGQuY2FuQ29udHJvbCkpO1xuICAgICAgICAgIGlmIChkLmNhcHMpIHNldFdhdGNoQ2FwcyhkLmNhcHMpO1xuICAgICAgICAgIHNldFByb3ZpZGVyKGQucHJvdmlkZXIgfHwgJ1VOU1VQUE9SVEVEJyk7XG4gICAgICAgICAgYXBEdW5nRG9uZ0JvKGQuc3RhdGUsIEJvb2xlYW4oZC5jYW5Db250cm9sKSwgZC5wcm92aWRlciB8fCAnVU5TVVBQT1JURUQnKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7IH1cbiAgICB9O1xuXG4gICAgZmV0Y2hXYXRjaCgpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoZmV0Y2hXYXRjaCwgMjUwMCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgfTtcbiAgfSwgW3Bob25nLmlkLCBoYXNJbnRlcmFjdGVkXSk7XG5cbiAgLy8gVGltZXIgdFx1MDEwM25nIGxvY2FsVGltZSBcdTAxMTFcdTFFQzF1IFx1MDExMVx1MUVCN24ga2hpIHBsYXlpbmdcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXdhdGNoU3RhdGUucGxheWluZykgcmV0dXJuO1xuICAgIGNvbnN0IHRpY2sgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAoIWlzU2Vla2luZ1JlZi5jdXJyZW50KSB7XG4gICAgICAgIHNldExvY2FsVGltZSh0ID0+IHQgKyAxKTtcbiAgICAgIH1cbiAgICB9LCAxMDAwKTtcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbCh0aWNrKTtcbiAgfSwgW3dhdGNoU3RhdGUucGxheWluZ10pO1xuXG4gIC8vIEdcdTFFRURpIGxcdTFFQzduaCBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIChQbGF5IC8gUGF1c2UgLyBTZWVrKVxuICBjb25zdCBndWlMZW5oID0gYXN5bmMgKGFjdGlvbiwgY3VzdG9tUG9zKSA9PiB7XG4gICAgaWYgKGRhbmdHdWlMZW5oKSByZXR1cm47XG4gICAgc2V0RGFuZ0d1aUxlbmgodHJ1ZSk7XG4gICAgc2V0TG9pKCcnKTtcblxuICAgIGxldCBwb3MgPSBjdXN0b21Qb3M7XG4gICAgaWYgKHBvcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgcG9zID0gdmlkZW9SZWYuY3VycmVudC5jdXJyZW50VGltZTtcbiAgICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5nZXRDdXJyZW50VGltZSkge1xuICAgICAgICBwb3MgPSB5dFBsYXllclJlZi5jdXJyZW50LmdldEN1cnJlbnRUaW1lKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwb3MgPSBsb2NhbFRpbWU7XG4gICAgICB9XG4gICAgfVxuICAgIHBvcyA9IE1hdGgubWF4KDAsIE51bWJlcigocG9zIHx8IDApLnRvRml4ZWQoMikpKTtcblxuICAgIC8vIENcdTFFQURwIG5oXHUxRUFEdCBsXHUxRUExYyBxdWFuIHRyXHUwMEVBbiBsb2NhbCBwbGF5ZXJcbiAgICBpZiAoYWN0aW9uID09PSAncGxheScpIHtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkgdmlkZW9SZWYuY3VycmVudC5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5wbGF5VmlkZW8pIHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdwYXVzZScpIHtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkgdmlkZW9SZWYuY3VycmVudC5wYXVzZSgpO1xuICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5wYXVzZVZpZGVvKSB5dFBsYXllclJlZi5jdXJyZW50LnBhdXNlVmlkZW8oKTtcbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ3NlZWsnKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSBwb3M7XG4gICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LnNlZWtUbykgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8ocG9zLCB0cnVlKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctd2F0Y2gnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgIGFjdGlvbixcbiAgICAgICAgICBwb3NpdGlvbjogcG9zLFxuICAgICAgICAgIGV4cGVjdGVkUmV2aXNpb246IHdhdGNoU3RhdGUucmV2aXNpb24sXG4gICAgICAgICAgcGxheWJhY2tSYXRlOiB3YXRjaFN0YXRlLnBsYXliYWNrUmF0ZSB8fCAxLjBcbiAgICAgICAgfSlcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKGQuc3RhdGUucG9zaXRpb25TZWNvbmRzIHx8IHBvcykpO1xuICAgICAgfSBlbHNlIGlmIChkLmNvbmZsaWN0ICYmIGQuc3RhdGUpIHtcbiAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgYXBEdW5nRG9uZ0JvKGQuc3RhdGUsIGNhbkNvbnRyb2wsIHByb3ZpZGVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldExvaShkLmxvaSB8fCAnTFx1MUVEN2kgY1x1MUVBRHAgbmhcdTFFQUR0IHBoXHUwMEUxdCB2aWRlby4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaSgnTVx1MUVBNXQga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldERhbmdHdWlMZW5oKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gXHUwMTEwXHUxRUQzbmcgYlx1MUVEOSB2XHUxRUNCIHRyXHUwMEVEIHZpZGVvIGhpXHUxRUM3biB0XHUxRUExaSByYSBuZ29cdTAwRTBpIFx1MDExMVx1MUVDMyBjaGF0IGdcdTFFQUZuIHRpbWVzdGFtcFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh2aWRlb1RpbWVSZWYpIHZpZGVvVGltZVJlZi5jdXJyZW50ID0gbG9jYWxUaW1lO1xuICB9LCBbbG9jYWxUaW1lLCB2aWRlb1RpbWVSZWZdKTtcblxuICAvLyBcdTAxMTBcdTFFRDVpIHZpZGVvIFx1MDExMWFuZyBwaFx1MDBFMXQgKGNhcGFiaWxpdHkgdmlkZW9fY2hhbmdlKVxuICBjb25zdCBkb2lWaWRlbyA9IGFzeW5jICh1cmwpID0+IHtcbiAgICBjb25zdCB1ID0gU3RyaW5nKHVybCB8fCB2aWRlb01vaSB8fCAnJykudHJpbSgpO1xuICAgIGlmICghdSB8fCBkYW5nR3VpTGVuaCkgcmV0dXJuO1xuICAgIHNldERhbmdHdWlMZW5oKHRydWUpO1xuICAgIHNldExvaSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXdhdGNoJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3NldF92aWRlbycsIHZpZGVvVXJsOiB1LCBleHBlY3RlZFJldmlzaW9uOiB3YXRjaFN0YXRlLnJldmlzaW9uIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSBzZXRMb2koZC5sb2kgfHwgJ0toXHUwMEY0bmcgXHUwMTExXHUxRUQ1aSBcdTAxMTFcdTAxQjBcdTFFRTNjIHZpZGVvLicpO1xuICAgICAgZWxzZSBzZXRWaWRlb01vaSgnJyk7XG4gICAgfSBjYXRjaCB7IHNldExvaSgnTVx1MUVBNXQga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuJyk7IH1cbiAgICBmaW5hbGx5IHsgc2V0RGFuZ0d1aUxlbmgoZmFsc2UpOyB9XG4gIH07XG5cbiAgLy8gSFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdmlkZW8gXHUyMDE0IHBvbGwgNXNcbiAgY29uc3QgdGFpUXVldWUgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLXF1ZXVlP3Bob25nSWQ9JHtwaG9uZy5pZH0mYWN0aW9uPWxpc3RgKTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHtcbiAgICAgICAgc2V0UXVldWVMaXN0KGQucXVldWUgfHwgW10pO1xuICAgICAgICBpZiAoZC5jYXBzKSBzZXRXYXRjaENhcHMocHJldiA9PiAoeyAuLi4ocHJldiB8fCB7fSksIC4uLmQuY2FwcyB9KSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IC8qIGJcdTFFQ0YgcXVhICovIH1cbiAgfTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICB0YWlRdWV1ZSgpO1xuICAgIGNvbnN0IHQgPSBzZXRJbnRlcnZhbCh0YWlRdWV1ZSwgNTAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodCk7XG4gIH0sIFtwaG9uZy5pZF0pO1xuXG4gIGNvbnN0IGhhbmhEb25nUXVldWUgPSBhc3luYyAoYWN0aW9uLCBleHRyYSA9IHt9KSA9PiB7XG4gICAgaWYgKHF1ZXVlQnVzeSkgcmV0dXJuO1xuICAgIHNldFF1ZXVlQnVzeSh0cnVlKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctcXVldWUnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uLCAuLi5leHRyYSB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghZC5vaykgc2V0TG9pKGQubG9pIHx8ICdUaGFvIHRcdTAwRTFjIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHRoXHUxRUE1dCBiXHUxRUExaS4nKTtcbiAgICAgIGVsc2UgYXdhaXQgdGFpUXVldWUoKTtcbiAgICB9IGNhdGNoIHsgc2V0TG9pKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTsgfVxuICAgIGZpbmFsbHkgeyBzZXRRdWV1ZUJ1c3koZmFsc2UpOyB9XG4gIH07XG5cbiAgY29uc3Qgc2FvQ2hlcExpbmtQaG9uZyA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoYCR7bG9jYXRpb24ub3JpZ2lufSR7bG9jYXRpb24ucGF0aG5hbWV9Iy9waG9uZy8ke3Bob25nLmlkfWApO1xuICAgICAgc2V0TGlua0NvcGllZCh0cnVlKTtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0TGlua0NvcGllZChmYWxzZSksIDIwMDApO1xuICAgIH0gY2F0Y2ggeyAvKiBjbGlwYm9hcmQgYlx1MUVDQiBjaFx1MUVCN24gKi8gfVxuICB9O1xuXG4gIC8vIE5oXHUxRUFEbiB5XHUwMEVBdSBjXHUxRUE3dSB0dWEgdFx1MUVFQiBTdHVkeURvY2sgKGJcdTFFQTVtIG1cdTFFRDFjIHZpZGVvIHRyb25nIGNoYXQvZ2hpIGNoXHUwMEZBKS5cbiAgLy8gQ1x1MDBGMyBxdXlcdTFFQzFuIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gXHUyMTkyIHBoXHUwMEUxdCBsXHUxRUM3bmggc2VlayBjaHVuZzsga2hcdTAwRjRuZyBcdTIxOTIgY2hcdTFFQzkgdHVhIGNcdTFFRTVjIGJcdTFFRDkgcGxheWVyIGNcdTFFRTdhIG1cdTAwRUNuaC5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBvblNlZWtSZXEgPSAoZSkgPT4ge1xuICAgICAgaWYgKGUuZGV0YWlsPy5waG9uZ0lkICE9PSBwaG9uZy5pZCkgcmV0dXJuO1xuICAgICAgY29uc3Qgc2VjID0gTWF0aC5tYXgoMCwgTnVtYmVyKGUuZGV0YWlsLnNlYykgfHwgMCk7XG4gICAgICBpZiAoY2FuQ29udHJvbCkge1xuICAgICAgICBndWlMZW5oKCdzZWVrJywgc2VjKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkgdmlkZW9SZWYuY3VycmVudC5jdXJyZW50VGltZSA9IHNlYztcbiAgICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5zZWVrVG8pIHl0UGxheWVyUmVmLmN1cnJlbnQuc2Vla1RvKHNlYywgdHJ1ZSk7XG4gICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKHNlYykpO1xuICAgICAgfVxuICAgIH07XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3NyLXNlZWsnLCBvblNlZWtSZXEpO1xuICAgIHJldHVybiAoKSA9PiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignc3Itc2VlaycsIG9uU2Vla1JlcSk7XG4gIH0sIFtwaG9uZy5pZCwgY2FuQ29udHJvbCwgcHJvdmlkZXIsIHdhdGNoU3RhdGUucmV2aXNpb25dKTtcblxuICBjb25zdCBoYW5kbGVTdGFydFZpZXdpbmcgPSAoKSA9PiB7XG4gICAgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBzZXRIYXNJbnRlcmFjdGVkKHRydWUpO1xuICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgY29uc3QgdiA9IHZpZGVvUmVmLmN1cnJlbnQ7XG4gICAgICBjb25zdCBwID0gdi5wbGF5KCk7XG4gICAgICBpZiAocCAmJiB0eXBlb2YgcC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHAudGhlbigoKSA9PiB7XG4gICAgICAgICAgaWYgKCF3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgICAgIHYucGF1c2UoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgJiYgeXRQbGF5ZXJSZWYuY3VycmVudD8ucGxheVZpZGVvKSB7XG4gICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtNCBtaW4tdy0wIHctZnVsbFwiPlxuICAgICAgey8qIEtodW5nIHBoXHUwMEUxdCB2aWRlbyBjaFx1MDBFRG5oICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSB3LWZ1bGwgYXNwZWN0LXZpZGVvIGJnLWJsYWNrIHJvdW5kZWQtMnhsIG92ZXJmbG93LWhpZGRlbiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHNoYWRvdy0yeGxcIj5cbiAgICAgICAgey8qIE92ZXJsYXkgQXV0b3BsYXkgLyBHZXN0dXJlIGNobyBuZ1x1MDFCMFx1MUVERGkgeGVtICovfVxuICAgICAgICB7IWhhc0ludGVyYWN0ZWQgJiYgIWNhbkNvbnRyb2wgJiYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgfHwgcHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnKSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIHotMjAgYmctYmxhY2svNzUgYmFja2Ryb3AtYmx1ci1zbSBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTQgdGV4dC1jZW50ZXIgYW5pbWF0ZS1mYWRlSW5cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xNCBoLTE0IHJvdW5kZWQtZnVsbCBiZy1bIzAwRjJGRV0vMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC0yeGwgbWItMyBzaGFkb3ctWzBfMF8yNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBhbmltYXRlLXB1bHNlXCI+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REZBQ1xuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBtYi0xXCI+WGVtIENodW5nIENcdTAwRjluZyBQaFx1MDBGMm5nPC9wPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTMwMCBtYXgtdy14cyBtYi00XCI+XG4gICAgICAgICAgICAgIEJcdTFFQTVtIG5cdTAwRkF0IGJcdTAwRUFuIGRcdTAxQjBcdTFFREJpIFx1MDExMVx1MUVDMyBjXHUxRUE1cCBxdXlcdTFFQzFuIFx1MDBFMm0gdGhhbmggdlx1MDBFMCBjXHUwMEY5bmcgdGhlbyBkXHUwMEY1aSB0aW1lbGluZSB2XHUxRURCaSBjaFx1MUVFNyBwaFx1MDBGMm5nLlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImJ0bi12aWV3ZXItc3RhcnQtd2F0Y2hcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlU3RhcnRWaWV3aW5nfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIuNSByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzQjgyRjZdIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIHNoYWRvdy1sZyBob3ZlcjpvcGFjaXR5LTkwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTI1QjY8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPkJcdTFFQUZ0IFx1MDExMVx1MUVBN3UgeGVtIGNcdTAwRjluZyBwaFx1MDBGMm5nPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFZpZGVvIGVsZW1lbnRzIHRoZW8gcHJvdmlkZXIgKi99XG4gICAgICAgIHt5dElkID8gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICAgICAgPGRpdiBpZD17eXRDb250YWluZXJJZH0gY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbFwiIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBkcnZJZCA/IChcbiAgICAgICAgICA8aWZyYW1lXG4gICAgICAgICAgICBzcmM9e2BodHRwczovL2RyaXZlLmdvb2dsZS5jb20vZmlsZS9kLyR7ZHJ2SWR9L3ByZXZpZXdgfVxuICAgICAgICAgICAgdGl0bGU9e3Bob25nLnRlbn1cbiAgICAgICAgICAgIGFsbG93PVwiYXV0b3BsYXk7IGZ1bGxzY3JlZW5cIlxuICAgICAgICAgICAgYWxsb3dGdWxsU2NyZWVuXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsXCJcbiAgICAgICAgICAvPlxuICAgICAgICApIDogdHJ1Y1RpZXBVcmwgPyAoXG4gICAgICAgICAgPHZpZGVvXG4gICAgICAgICAgICByZWY9e3ZpZGVvUmVmfVxuICAgICAgICAgICAgc3JjPXt0cnVjVGllcFVybH1cbiAgICAgICAgICAgIHBsYXlzSW5saW5lXG4gICAgICAgICAgICBkYXRhLXRlc3RpZD1cInN0dWR5LXZpZGVvLXBsYXllclwiXG4gICAgICAgICAgICBjb250cm9scz17Y2FuQ29udHJvbH1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvbnRhaW5cIlxuICAgICAgICAgICAgb25Mb2FkZWRNZXRhZGF0YT17ZSA9PiB7XG4gICAgICAgICAgICAgIGlmIChlLnRhcmdldC5kdXJhdGlvbiA+IDApIHNldER1cmF0aW9uKGUudGFyZ2V0LmR1cmF0aW9uKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvblBsYXk9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgIXdhdGNoU3RhdGUucGxheWluZyAmJiAhZGFuZ0d1aUxlbmgpIHtcbiAgICAgICAgICAgICAgICBndWlMZW5oKCdwbGF5JywgdmlkZW9SZWYuY3VycmVudD8uY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25QYXVzZT17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiB3YXRjaFN0YXRlLnBsYXlpbmcgJiYgIWRhbmdHdWlMZW5oKSB7XG4gICAgICAgICAgICAgICAgZ3VpTGVuaCgncGF1c2UnLCB2aWRlb1JlZi5jdXJyZW50Py5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvblNlZWtlZD17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiAhZGFuZ0d1aUxlbmggJiYgIWlzU2Vla2luZ1JlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgZ3VpTGVuaCgnc2VlaycsIHZpZGVvUmVmLmN1cnJlbnQ/LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAvPlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgaC1mdWxsIHRleHQteHMgdGV4dC1zbGF0ZS01MDAgcC02IHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBtYi0yXCI+XHUyNkEwXHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+TGluayB2aWRlbyBraFx1MDBGNG5nIGhcdTFFRDcgdHJcdTFFRTMgcGhcdTAwRTF0IHRyXHUxRUYxYyB0aVx1MUVCRnAgaG9cdTFFQjdjIGtoXHUwMEY0bmcgaFx1MUVFM3AgbFx1MUVDNy48L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIFRoXHUwMEY0bmcgYlx1MDBFMW8gcmlcdTAwRUFuZyBjaG8gR29vZ2xlIERyaXZlICovfVxuICAgICAge2RydklkICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zLjUgcHktMiBiZy1hbWJlci01MDAvMTAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMjAgcm91bmRlZC14bCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIHRleHQtYW1iZXItMzAwXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbVwiPlx1MjEzOVx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICA8c3Bhbj5Hb29nbGUgRHJpdmUgcGhcdTAwRTF0IFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgPHN0cm9uZz5YZW0gXHUwMTExXHUxRUQ5YyBsXHUxRUFEcDwvc3Ryb25nPiAoR29vZ2xlIERyaXZlIGtoXHUwMEY0bmcgaFx1MUVENyB0clx1MUVFMyBBUEkgXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiB0XHUxRUVCIHhhKS48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIFRoYW5oIHRyXHUxRUExbmcgdGhcdTAwRTFpIHBoXHUwMEYybmcgJiBcdTAxMTBpXHUxRUMxdSBraGlcdTFFQzNuIEhvc3QgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNCBmbGV4IGZsZXgtY29sIGdhcC0zXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMi41IHBiLTIuNSBib3JkZXItYiBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgcHgtMi41IHB5LTAuNSByb3VuZGVkLWZ1bGwgdGV4dC1bMTBweF0gZm9udC1ib2xkIGJvcmRlciAke3Bob25nLnBoYW1WaSA9PT0gJ3RydW9uZycgPyAnYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTQwMCBib3JkZXItZW1lcmFsZC01MDAvMzAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAge3Bob25nLnBoYW1WaSA9PT0gJ3RydW9uZycgPyAnXHVEODNDXHVERjEwIFRvXHUwMEUwbiB0clx1MDFCMFx1MUVERG5nJyA6IGBcdUQ4M0RcdUREMTIgQ2hcdTFFQzkgbFx1MUVEQnAgJHtwaG9uZy5sb3BUZW4gfHwgJyd9YH1cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS0yMDAgZm9udC1ib2xkIHRydW5jYXRlIG1heC13LVsyMDBweF0gc206bWF4LXcteHNcIj57cGhvbmcudGVufTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICAgIFx1MjAyMiBDaFx1MUVFNyBwaFx1MDBGMm5nOiA8c3Ryb25nIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtMjAwXCI+e3Bob25nLmNodVBob25nVGVufTwvc3Ryb25nPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41XCI+XG4gICAgICAgICAgICB7LyogU3luYyBTdGF0ZSBCYWRnZSAqL31cbiAgICAgICAgICAgIHtwcm92aWRlciAhPT0gJ0dPT0dMRV9EUklWRScgJiYgcHJvdmlkZXIgIT09ICdVTlNVUFBPUlRFRCcgPyAoXG4gICAgICAgICAgICAgIDxzcGFuIGlkPVwic3luYy1zdGF0ZS1iYWRnZVwiIGNsYXNzTmFtZT17YHRleHQtWzExcHhdIGZvbnQtYm9sZCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHB4LTIuNSBweS0xIHJvdW5kZWQtZnVsbCBib3JkZXIgJHt3YXRjaFN0YXRlLnBsYXlpbmcgPyAnYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTQwMCBib3JkZXItZW1lcmFsZC01MDAvMzAnIDogJ2JnLWFtYmVyLTUwMC8xNSB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzMwJ31gfT5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTEuNSBoLTEuNSByb3VuZGVkLWZ1bGwgJHt3YXRjaFN0YXRlLnBsYXlpbmcgPyAnYmctZW1lcmFsZC00MDAgYW5pbWF0ZS1wdWxzZScgOiAnYmctYW1iZXItNDAwJ31gfT48L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3dhdGNoU3RhdGUucGxheWluZyA/IChjYW5Db250cm9sID8gJ1x1MDExMGFuZyBwaFx1MDBFMXQgY2h1bmcnIDogJ1x1MDExMGFuZyBwaFx1MDBFMXQgY1x1MDBGOW5nIHBoXHUwMEYybmcnKSA6IChjYW5Db250cm9sID8gJ1RcdTFFQTFtIGRcdTFFRUJuZycgOiAnVFx1MUVBMW0gZFx1MUVFQm5nIHRoZW8gY2hcdTFFRTcgcGhcdTAwRjJuZycpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJzeW5jLXN0YXRlLWJhZGdlXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgZm9udC1tZWRpdW0gcHgtMiBweS0wLjUgcm91bmRlZC1mdWxsIGJnLXdoaXRlLzUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICAgIFhlbSBcdTAxMTFcdTFFRDljIGxcdTFFQURwXG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIHtjYW5Db250cm9sICYmIChcbiAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJob3N0LWJhZGdlXCIgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ibGFjayBweC0yIHB5LTAuNSByb3VuZGVkLW1kIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMFwiPlxuICAgICAgICAgICAgICAgIENoXHUxRUU3IHBoXHUwMEYybmdcbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAge2NhcHMuaW52aXRlICE9PSBmYWxzZSAmJiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1jb3B5LXJvb20tbGlua1wiXG4gICAgICAgICAgICAgICAgb25DbGljaz17c2FvQ2hlcExpbmtQaG9uZ31cbiAgICAgICAgICAgICAgICB0aXRsZT1cIlNhbyBjaFx1MDBFOXAgbGluayBtXHUxRUREaSB2XHUwMEUwbyBwaFx1MDBGMm5nXCJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLXhsIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICB7bGlua0NvcGllZCA/ICdcdTI3MTMgXHUwMTEwXHUwMEUzIGNvcHknIDogJ1x1RDgzRFx1REQxNyBNXHUxRUREaSd9XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgeyhjYW5Db250cm9sIHx8IGF1dGgudXNlcj8uaXNUZWFjaGVyKSAmJiBwaG9uZy5jaHVQaG9uZ0tob2EgIT09ICdoZS10aG9uZycgJiYgKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17ZG9uZ1Bob25nSGllblRhaX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xNSBob3ZlcjpiZy1yb3NlLTUwMC8yNSB0ZXh0LXJvc2UtMzAwIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICBcdTAxMTBcdTAwRjNuZyBwaFx1MDBGMm5nXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIFRoYW5oIGNcdTAwRjRuZyBjXHUxRUU1IHBoXHUwMEUxdCBjaHVuZyAoY2hcdTFFQzkgaGlcdTFFQzNuIHRoXHUxRUNCIGNobyBIb3N0IC8gVGVhY2hlciBraGkgZFx1MDBGOW5nIHByb3ZpZGVyIGNcdTAwRjMgdGhcdTFFQzMgXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbikgKi99XG4gICAgICAgIHtjYW5Db250cm9sICYmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgfHwgcHJvdmlkZXIgPT09ICdZT1VUVUJFJykgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBpdGVtcy1jZW50ZXIgZ2FwLTMgcHQtMVwiPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImJ0bi1ob3N0LXdhdGNoLXRvZ2dsZVwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKHdhdGNoU3RhdGUucGxheWluZyA/ICdwYXVzZScgOiAncGxheScpfVxuICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBzbTp3LWF1dG8gcHgtNCBweS0yIHJvdW5kZWQteGwgZm9udC1ibGFjayB0ZXh0LXhzIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xLjUgc2hhZG93LXNtIGFjdGl2ZTpzY2FsZS05NSBkaXNhYmxlZDpvcGFjaXR5LTUwICR7d2F0Y2hTdGF0ZS5wbGF5aW5nID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC80MCBob3ZlcjpiZy1hbWJlci01MDAvMzAnIDogJ2JnLVsjMDBGMkZFXSB0ZXh0LWJsYWNrIGhvdmVyOmJnLVsjMDBlMWVjXSd9YH0+XG4gICAgICAgICAgICAgIDxzcGFuPnt3YXRjaFN0YXRlLnBsYXlpbmcgPyAnXHUyM0Y4JyA6ICdcdTI1QjYnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+e3dhdGNoU3RhdGUucGxheWluZyA/ICdUXHUxRUExbSBEXHUxRUVCbmcgQ1x1MUVBMyBQaFx1MDBGMm5nJyA6ICdQaFx1MDBFMXQgQ2h1bmcgQ1x1MUVBMyBQaFx1MDBGMm5nJ308L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSB3LWZ1bGxcIj5cbiAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJob3N0LWR1cmF0aW9uLWxhYmVsXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1tb25vIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAge2RpbmhEYW5nR2lheVBodXQobG9jYWxUaW1lKX1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICBpZD1cImhvc3Qtc2Vlay1zbGlkZXJcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJyYW5nZVwiXG4gICAgICAgICAgICAgICAgbWluPVwiMFwiXG4gICAgICAgICAgICAgICAgbWF4PXtkdXJhdGlvbiA+IDAgPyBkdXJhdGlvbiA6IE1hdGgubWF4KGxvY2FsVGltZSwgMzAwKX1cbiAgICAgICAgICAgICAgICBzdGVwPVwiMVwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e2xvY2FsVGltZX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlRG93bj17KCkgPT4geyBpc1NlZWtpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgb25Ub3VjaFN0YXJ0PXsoKSA9PiB7IGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRMb2NhbFRpbWUoTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSl9XG4gICAgICAgICAgICAgICAgb25Nb3VzZVVwPXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oKCdzZWVrJywgTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBvblRvdWNoRW5kPXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oKCdzZWVrJywgTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgaC0xLjUgYmctd2hpdGUvMTAgcm91bmRlZC1sZyBhcHBlYXJhbmNlLW5vbmUgY3Vyc29yLXBvaW50ZXIgYWNjZW50LVsjMDBGMkZFXVwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIHtkdXJhdGlvbiA+IDAgPyBkaW5oRGFuZ0dpYXlQaHV0KGR1cmF0aW9uKSA6ICctLTotLSd9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHtsb2kgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXJvc2UtNDAwXCI+e2xvaX08L3A+fVxuICAgICAgICB7cGhvbmcubW9UYSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCBsZWFkaW5nLXJlbGF4ZWQgcHQtMVwiPntwaG9uZy5tb1RhfTwvcD59XG5cbiAgICAgICAgey8qIFx1MDExMFx1MUVENWkgdmlkZW8gXHUyMDE0IGNhcGFiaWxpdHkgdmlkZW9fY2hhbmdlICovfVxuICAgICAgICB7ZHVvY0RvaVZpZGVvICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHB0LTFcIj5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD1cImlucHV0LXZpZGVvLW1vaVwiXG4gICAgICAgICAgICAgIHR5cGU9XCJ1cmxcIlxuICAgICAgICAgICAgICB2YWx1ZT17dmlkZW9Nb2l9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFZpZGVvTW9pKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJEXHUwMEUxbiBsaW5rIFlvdVR1YmUgLyB2aWRlbyBtXHUxRURCaSBcdTAxMTFcdTFFQzMgcGhcdTAwRTF0IG5nYXlcdTIwMjZcIlxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBweC0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS82MFwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgaWQ9XCJidG4tZG9pLXZpZGVvXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZG9pVmlkZW8oKX1cbiAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF2aWRlb01vaS50cmltKCkgfHwgZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMuNSBweS0yIHJvdW5kZWQteGwgYmctWyMwMEYyRkVdIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJsYWNrIGhvdmVyOmJnLVsjMDBlMWVjXSBkaXNhYmxlZDpvcGFjaXR5LTMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgIFx1MjVCNiBQaFx1MDBFMXQgdmlkZW8gblx1MDBFMHlcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBIXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB2aWRlbyBcdTIwMTQgY2FwYWJpbGl0eSBxdWV1ZSAqL31cbiAgICAgICAgeyhkdW9jUXVldWUgfHwgcXVldWVMaXN0Lmxlbmd0aCA+IDApICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB0LTIgYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzEwIGZsZXggZmxleC1jb2wgZ2FwLTJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0RcdURDQ0IgSFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgKHtxdWV1ZUxpc3QuZmlsdGVyKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnKS5sZW5ndGh9KVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgIHtkdW9jRG9pVmlkZW8gJiYgcXVldWVMaXN0LnNvbWUocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpICYmIChcbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3NraXAnKX1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLWFtYmVyLTUwMC8xNSB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctYW1iZXItNTAwLzI1IGRpc2FibGVkOm9wYWNpdHktNDBcIj5cbiAgICAgICAgICAgICAgICAgIFx1MjNFRCBQaFx1MDBFMXQgdGlcdTFFQkZwIHRoZW9cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7ZHVvY1F1ZXVlICYmIChcbiAgICAgICAgICAgICAgPFF1ZXVlSW5wdXQgb25BZGQ9eyh1LCB0KSA9PiBoYW5oRG9uZ1F1ZXVlKCdlbnF1ZXVlJywgeyB2aWRlb1VybDogdSwgdGl0bGU6IHQgfSl9XG4gICAgICAgICAgICAgICAgb25BZGROZXh0PXsodSwgdCkgPT4gaGFuaERvbmdRdWV1ZSgnYWRkX25leHQnLCB7IHZpZGVvVXJsOiB1LCB0aXRsZTogdCB9KX0gLz5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIHtxdWV1ZUxpc3QubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMFwiPkhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHRyXHUxRUQxbmcgXHUyMDE0IHRoXHUwMEVBbSBsaW5rIHZpZGVvIFx1MDExMVx1MUVDMyBwaFx1MDBFMXQgbFx1MUVBN24gbFx1MDFCMFx1MUVFM3QuPC9wPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNVwiPlxuICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3QubWFwKChxLCBpZHgpID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtxLmlkfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdy01IGgtNSByb3VuZGVkLW1kIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGZvbnQtYmxhY2sgc2hyaW5rLTAgJHtxLnRyYW5nVGhhaSA9PT0gJ3BsYXlpbmcnID8gJ2JnLWVtZXJhbGQtNTAwLzIwIHRleHQtZW1lcmFsZC0zMDAnIDogJ2JnLXdoaXRlLzEwIHRleHQtc2xhdGUtNDAwJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICB7cS50cmFuZ1RoYWkgPT09ICdwbGF5aW5nJyA/ICdcdTI1QjYnIDogaWR4ICsgMX1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICB7cS50aHVtYiAmJiA8aW1nIHNyYz17cS50aHVtYn0gYWx0PVwiXCIgY2xhc3NOYW1lPVwidy0xMCBoLTYgcm91bmRlZCBvYmplY3QtY292ZXIgc2hyaW5rLTBcIiBsb2FkaW5nPVwibGF6eVwiIC8+fVxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS0yMDAgZm9udC1zZW1pYm9sZCB0cnVuY2F0ZVwiPntxLnRpdGxlIHx8IHEudmlkZW9Vcmx9PC9wPlxuICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1zbGF0ZS01MDAgdHJ1bmNhdGVcIj50aFx1MDBFQW0gYlx1MUVERmkge3EuYWRkZWRCeSB8fCAnXHUyMDE0J308L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncXVldWVkJyAmJiBkdW9jRG9pVmlkZW8gJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgdGl0bGU9XCJQaFx1MDBFMXQgbmdheVwiIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3BsYXlfbm93JywgeyBpZDogcS5pZCB9KX0gZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy02IGgtNiByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSB0ZXh0LVsxMHB4XSBmb250LWJsYWNrIGhvdmVyOmJnLVsjMDBGMkZFXS8yNVwiPlx1MjVCNjwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncXVldWVkJyAmJiBkdW9jUXVldWUgJiYgaWR4ID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiB0aXRsZT1cIlx1MDExMFx1MDFCMGEgbFx1MDBFQW4gXHUwMTExXHUxRUE3dVwiIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaWRzID0gcXVldWVMaXN0LmZpbHRlcih4ID0+IHgudHJhbmdUaGFpID09PSAncXVldWVkJykubWFwKHggPT4geC5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkcy5zcGxpY2UoaWRzLmluZGV4T2YocS5pZCksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZHMudW5zaGlmdChxLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuaERvbmdRdWV1ZSgncmVvcmRlcicsIHsgaWRzIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfX0gZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy02IGgtNiByb3VuZGVkLWxnIGJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIHRleHQtWzEwcHhdIGZvbnQtYmxhY2sgaG92ZXI6Ymctd2hpdGUvMTVcIj5cdTIxOTE8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIHtkdW9jQ2hhdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiB0aXRsZT1cIkdcdTFFRURpIHZcdTAwRTBvIGNoYXQgcGhcdTAwRjJuZ1wiIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3NlbmRfdG9fY2hhdCcsIHsgaWQ6IHEuaWQgfSl9IGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctNiBoLTYgcm91bmRlZC1sZyBiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCB0ZXh0LVsxMHB4XSBmb250LWJsYWNrIGhvdmVyOmJnLXdoaXRlLzE1XCI+XHVEODNEXHVEQ0FDPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICB7KGR1b2NRdWV1ZSB8fCBxLmFkZGVkQnlLaG9hID09PSBwaG9uZ01pbmhLaG9hKSAmJiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgdGl0bGU9XCJYXHUwMEYzYSBraFx1MUVDRmkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcIiBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdyZW1vdmUnLCB7IGlkOiBxLmlkIH0pfSBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTYgaC02IHJvdW5kZWQtbGcgYmctcm9zZS01MDAvMTAgdGV4dC1yb3NlLTMwMCB0ZXh0LVsxMHB4XSBmb250LWJsYWNrIGhvdmVyOmJnLXJvc2UtNTAwLzIwXCI+XHUyNzE1PC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbi8vIFx1MDBENCBuaFx1MUVBRHAgbGluayB0aFx1MDBFQW0gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgXHUyMDE0IHRcdTAwRTFjaCBuaFx1MUVDRiBcdTAxMTFcdTFFQzMga2hcdTAwRjRuZyByZS1yZW5kZXIgdG9cdTAwRTBuIHBhbmVsXG5leHBvcnQgZnVuY3Rpb24gUXVldWVJbnB1dCh7IG9uQWRkLCBvbkFkZE5leHQgfSkge1xuICBjb25zdCBbdiwgc2V0Vl0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IG9rID0gdi50cmltKCkubGVuZ3RoID4gMDtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgIDxpbnB1dFxuICAgICAgICBpZD1cImlucHV0LXF1ZXVlLWFkZFwiXG4gICAgICAgIHR5cGU9XCJ1cmxcIlxuICAgICAgICB2YWx1ZT17dn1cbiAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0VihlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgIG9uS2V5RG93bj17ZSA9PiB7IGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiBvaykgeyBlLnByZXZlbnREZWZhdWx0KCk7IG9uQWRkKHYudHJpbSgpKTsgc2V0VignJyk7IH0gfX1cbiAgICAgICAgcGxhY2Vob2xkZXI9XCJUaFx1MDBFQW0gbGluayB2aWRlbyB2XHUwMEUwbyBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaVx1MjAyNlwiXG4gICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIHB4LTIuNSBweS0xLjUgdGV4dC1bMTFweF0gdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTBcIlxuICAgICAgLz5cbiAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGlkPVwiYnRuLXF1ZXVlLWFkZC1uZXh0XCIgZGlzYWJsZWQ9eyFva31cbiAgICAgICAgb25DbGljaz17KCkgPT4geyBvbkFkZE5leHQodi50cmltKCkpOyBzZXRWKCcnKTsgfX1cbiAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLXZpb2xldC01MDAvMTUgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctdmlvbGV0LTUwMC8yNSBkaXNhYmxlZDpvcGFjaXR5LTMwIHdoaXRlc3BhY2Utbm93cmFwXCI+XG4gICAgICAgICtQaFx1MDBFMXQga1x1MUVCRlxuICAgICAgPC9idXR0b24+XG4gICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBpZD1cImJ0bi1xdWV1ZS1lbnF1ZXVlXCIgZGlzYWJsZWQ9eyFva31cbiAgICAgICAgb25DbGljaz17KCkgPT4geyBvbkFkZCh2LnRyaW0oKSk7IHNldFYoJycpOyB9fVxuICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMS41IHJvdW5kZWQtbGcgYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1bIzAwRjJGRV0vMjUgZGlzYWJsZWQ6b3BhY2l0eS0zMCB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxuICAgICAgICArQ3VcdTFFRDFpIGhcdTAwRTBuZ1xuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDb21wb25lbnQ6IENhbXB1cyBGb2N1cyBSb29tIChTdHVkeSBDYWZcdTAwRTkgJiBQb21vZG9ybyBTZXNzaW9uKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBmdW5jdGlvbiBDYW1wdXNGb2N1c1Jvb20oe1xuICBwaG9uZyxcbiAgcGhvbmdNaW5oS2hvYSxcbiAgYXV0aCxcbiAgZG9uZ1Bob25nSGllblRhaSxcbiAgc29OZ3VvaSxcbiAgaXNGb2N1c01vZGUsXG4gIHNldElzRm9jdXNNb2RlXG59KSB7XG4gIGNvbnN0IFtmb2N1c1N0YXRlLCBzZXRGb2N1c1N0YXRlXSA9IHVzZVN0YXRlKHtcbiAgICBwaGFzZTogJ2ZvY3VzJyxcbiAgICBzdGF0dXM6ICdwYXVzZWQnLFxuICAgIGR1cmF0aW9uU2Vjb25kczogMTUwMCxcbiAgICByZW1haW5pbmdTZWNvbmRzOiAxNTAwLFxuICAgIHByZXNldDogJzI1XzUnLFxuICAgIHJldmlzaW9uOiAxLFxuICAgIGNhbkNvbnRyb2w6IGZhbHNlLFxuICAgIHVwZGF0ZWRBdDogbnVsbCxcbiAgICBzZXJ2ZXJOb3c6IG51bGxcbiAgfSk7XG4gIGNvbnN0IFtsb2NhbFJlbWFpbmluZywgc2V0TG9jYWxSZW1haW5pbmddID0gdXNlU3RhdGUoMTUwMCk7XG4gIGNvbnN0IFtkYW5nR3VpTGVuaCwgc2V0RGFuZ0d1aUxlbmhdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9pLCBzZXRMb2ldID0gdXNlU3RhdGUoJycpO1xuXG4gIC8vIEF1ZGlvIHN0YXRlIChBbWJpZW50IHBsYXliYWNrKVxuICBsZXQgY2F1SGluaCA9IHt9O1xuICB0cnkgeyBjYXVIaW5oID0gcGhvbmcuY2F1SGluaCA/IEpTT04ucGFyc2UocGhvbmcuY2F1SGluaCkgOiB7fTsgfSBjYXRjaCB7IC8qIGJcdTFFQ0YgcXVhICovIH1cbiAgY29uc3QgbmhhY1VybCA9IGNhdUhpbmgubmhhY1VybCA/IHVybE1lZGlhRmUoY2F1SGluaC5uaGFjVXJsKSA6ICcnO1xuICBjb25zdCBhdWRpb1JlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgW2F1ZGlvUGxheWluZywgc2V0QXVkaW9QbGF5aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2F1ZGlvVm9sdW1lLCBzZXRBdWRpb1ZvbHVtZV0gPSB1c2VTdGF0ZSgwLjUpO1xuICBjb25zdCBbYXVkaW9NdXRlZCwgc2V0QXVkaW9NdXRlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtoYXNJbnRlcmFjdGVkQXVkaW8sIHNldEhhc0ludGVyYWN0ZWRBdWRpb10gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgLy8gQXV0aG9yaXphdGlvblxuICBjb25zdCBbY2FuQ29udHJvbCwgc2V0Q2FuQ29udHJvbF0gPSB1c2VTdGF0ZShCb29sZWFuKGF1dGgudXNlcj8uaXNUZWFjaGVyIHx8IHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nKSk7XG4gIGNvbnN0IGlzSG9zdCA9IGNhbkNvbnRyb2w7XG5cbiAgLy8gU3luYyBzdGF0ZSByZWNvbmNpbGlhdGlvbiBoZWxwZXJcbiAgY29uc3QgYXBEdW5nRm9jdXNTdGF0ZSA9IChzdCkgPT4ge1xuICAgIGlmICghc3QpIHJldHVybjtcbiAgICBzZXRGb2N1c1N0YXRlKHN0KTtcbiAgICBjb25zdCByZW0gPSBOdW1iZXIoc3QucmVtYWluaW5nU2Vjb25kcyA/PyAxNTAwKTtcbiAgICBzZXRMb2NhbFJlbWFpbmluZyhyZW0pO1xuICB9O1xuXG4gIC8vIDEuIFBvbGxpbmcgRm9jdXMgU3RhdGUgKGV2ZXJ5IDMwMDBtcykgd2l0aCB2aXNpYmlsaXR5IHJlY29uY2lsaWF0aW9uICYgc3RyaWN0IGNsZWFudXBcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcblxuICAgIGNvbnN0IGZldGNoRm9jdXMgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1mb2N1cz9waG9uZ0lkPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHBob25nLmlkKX1gKTtcbiAgICAgICAgaWYgKCFyZXMub2spIHJldHVybjtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChhY3RpdmUgJiYgZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkLmNhbkNvbnRyb2wgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgc2V0Q2FuQ29udHJvbChkLmNhbkNvbnRyb2wpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhcER1bmdGb2N1c1N0YXRlKGQuc3RhdGUpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLyogYlx1MUVDRiBxdWEga2hpIGhcdTFFRTd5IGtcdTFFQkZ0IG5cdTFFRDFpICovXG4gICAgICB9XG4gICAgfTtcblxuICAgIGZldGNoRm9jdXMoKTtcbiAgICBjb25zdCB0aW1lciA9IHNldEludGVydmFsKGZldGNoRm9jdXMsIDMwMDApO1xuXG4gICAgY29uc3QgaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSA9ICgpID0+IHtcbiAgICAgIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09ICd2aXNpYmxlJyAmJiBhY3RpdmUpIHtcbiAgICAgICAgZmV0Y2hGb2N1cygpO1xuICAgICAgfVxuICAgIH07XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UpO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSk7XG4gICAgfTtcbiAgfSwgW3Bob25nLmlkXSk7XG5cbiAgLy8gMi4gTG9jYWwgQ291bnRkb3duIFRpY2sgKGV2ZXJ5IDEwMDBtcyB3aGVuIHN0YXR1cyA9PT0gJ3J1bm5pbmcnKVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChmb2N1c1N0YXRlLnN0YXR1cyAhPT0gJ3J1bm5pbmcnKSByZXR1cm47XG4gICAgY29uc3QgdGljayA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHNldExvY2FsUmVtYWluaW5nKHIgPT4gTWF0aC5tYXgoMCwgciAtIDEpKTtcbiAgICB9LCAxMDAwKTtcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbCh0aWNrKTtcbiAgfSwgW2ZvY3VzU3RhdGUuc3RhdHVzXSk7XG5cbiAgLy8gMy4gQ29tbWFuZCBkaXNwYXRjaGVyIHdpdGggb3B0aW1pc3RpYyBjb25jdXJyZW5jeSAocmV2aXNpb24gY2hlY2sgJiBjb25mbGljdCBoYW5kbGluZylcbiAgY29uc3QgZ3VpTGVuaCA9IGFzeW5jIChhY3Rpb24sIGV4dHJhUGF5bG9hZCA9IHt9KSA9PiB7XG4gICAgaWYgKGRhbmdHdWlMZW5oKSByZXR1cm47XG4gICAgc2V0RGFuZ0d1aUxlbmgodHJ1ZSk7XG4gICAgc2V0TG9pKCcnKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1mb2N1cycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgYWN0aW9uLFxuICAgICAgICAgIGV4cGVjdGVkUmV2aXNpb246IGZvY3VzU3RhdGUucmV2aXNpb24sXG4gICAgICAgICAgLi4uZXh0cmFQYXlsb2FkXG4gICAgICAgIH0pXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgIGFwRHVuZ0ZvY3VzU3RhdGUoZC5zdGF0ZSk7XG4gICAgICB9IGVsc2UgaWYgKHJlcy5zdGF0dXMgPT09IDQwOSAmJiBkLnN0YXRlKSB7XG4gICAgICAgIC8vIENvbmN1cnJlbmN5IGNvbmZsaWN0OiBhZG9wdCBsYXRlc3Qgc2VydmVyIHN0YXRlXG4gICAgICAgIGFwRHVuZ0ZvY3VzU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIHNldExvaSgnXHUwMTEwXHUwMEUzIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgbFx1MUVBMWkgcGhpXHUwMEVBbiB0aGVvIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0TG9pKGQubG9pIHx8ICdLaFx1MDBGNG5nIHRoXHUxRUMzIGNcdTFFQURwIG5oXHUxRUFEdCB0clx1MUVBMW5nIHRoXHUwMEUxaSBwaFx1MDBGMm5nIGhcdTFFQ0RjIHRcdTFFQURwLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0TG9pKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RGFuZ0d1aUxlbmgoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyA0LiBBbWJpZW50IEF1ZGlvIENvbnRyb2xzXG4gIGNvbnN0IGJhdEFtVGhhbmggPSAoKSA9PiB7XG4gICAgc2V0SGFzSW50ZXJhY3RlZEF1ZGlvKHRydWUpO1xuICAgIGlmIChhdWRpb1JlZi5jdXJyZW50KSB7XG4gICAgICBhdWRpb1JlZi5jdXJyZW50LnBsYXkoKS50aGVuKCgpID0+IHtcbiAgICAgICAgc2V0QXVkaW9QbGF5aW5nKHRydWUpO1xuICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS53YXJuKCdBdXRvcGxheSBibG9ja2VkIG9yIGF1ZGlvIGxvYWQgZXJyb3I6JywgZXJyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB0b2dnbGVBdWRpb1BsYXkgPSAoKSA9PiB7XG4gICAgaWYgKCFhdWRpb1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgaWYgKGF1ZGlvUGxheWluZykge1xuICAgICAgYXVkaW9SZWYuY3VycmVudC5wYXVzZSgpO1xuICAgICAgc2V0QXVkaW9QbGF5aW5nKGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYmF0QW1UaGFuaCgpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB0b2dnbGVBdWRpb011dGUgPSAoKSA9PiB7XG4gICAgaWYgKCFhdWRpb1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgY29uc3QgbmV3TXV0ZSA9ICFhdWRpb011dGVkO1xuICAgIGF1ZGlvUmVmLmN1cnJlbnQubXV0ZWQgPSBuZXdNdXRlO1xuICAgIHNldEF1ZGlvTXV0ZWQobmV3TXV0ZSk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlVm9sdW1lQ2hhbmdlID0gKGUpID0+IHtcbiAgICBjb25zdCB2YWwgPSBwYXJzZUZsb2F0KGUudGFyZ2V0LnZhbHVlKTtcbiAgICBzZXRBdWRpb1ZvbHVtZSh2YWwpO1xuICAgIGlmIChhdWRpb1JlZi5jdXJyZW50KSB7XG4gICAgICBhdWRpb1JlZi5jdXJyZW50LnZvbHVtZSA9IHZhbDtcbiAgICAgIGlmICh2YWwgPiAwICYmIGF1ZGlvTXV0ZWQpIHtcbiAgICAgICAgYXVkaW9SZWYuY3VycmVudC5tdXRlZCA9IGZhbHNlO1xuICAgICAgICBzZXRBdWRpb011dGVkKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgY29uc3QgaXNCcmVhayA9IGZvY3VzU3RhdGUucGhhc2UgPT09ICdicmVhayc7XG4gIGNvbnN0IGlzUnVubmluZyA9IGZvY3VzU3RhdGUuc3RhdHVzID09PSAncnVubmluZyc7XG4gIGNvbnN0IGR1cmF0aW9uID0gZm9jdXNTdGF0ZS5kdXJhdGlvblNlY29uZHMgfHwgKGlzQnJlYWsgPyAzMDAgOiAxNTAwKTtcbiAgY29uc3QgcHJvZ3Jlc3NQZXJjZW50ID0gTWF0aC5taW4oMTAwLCBNYXRoLm1heCgwLCAoKGR1cmF0aW9uIC0gbG9jYWxSZW1haW5pbmcpIC8gZHVyYXRpb24pICogMTAwKSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTQgbWluLXctMCB3LWZ1bGxcIj5cbiAgICAgIHsvKiBIaWRkZW4gQXVkaW8gZWxlbWVudCBmb3IgYW1iaWVudCBzb3VuZHRyYWNrICovfVxuICAgICAge25oYWNVcmwgJiYgKFxuICAgICAgICA8YXVkaW9cbiAgICAgICAgICByZWY9e2F1ZGlvUmVmfVxuICAgICAgICAgIHNyYz17bmhhY1VybH1cbiAgICAgICAgICBsb29wXG4gICAgICAgICAgcHJlbG9hZD1cIm5vbmVcIlxuICAgICAgICAgIG9uRW5kZWQ9eygpID0+IHNldEF1ZGlvUGxheWluZyhmYWxzZSl9XG4gICAgICAgICAgb25FcnJvcj17KCkgPT4gc2V0QXVkaW9QbGF5aW5nKGZhbHNlKX1cbiAgICAgICAgLz5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBIZWFkZXIgYmFyOiBQcmVzZW5jZSwgSG9zdCBiYWRnZSwgRm9jdXMgTW9kZSB0b2dnbGUsIENsb3NlIFJvb20gKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNCBmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zIHNoYWRvdy1sZ1wiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHB4LTIuNSBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgYm9yZGVyICR7cGhvbmcucGhhbVZpID09PSAndHJ1b25nJyA/ICdiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtNDAwIGJvcmRlci1lbWVyYWxkLTUwMC8zMCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAge3Bob25nLnBoYW1WaSA9PT0gJ3RydW9uZycgPyAnXHVEODNDXHVERjEwIFRvXHUwMEUwbiB0clx1MDFCMFx1MUVERG5nJyA6IGBcdUQ4M0RcdUREMTIgTFx1MUVEQnAgJHtwaG9uZy5sb3BUZW4gfHwgJyd9YH1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gaWQ9XCJmb2N1cy1ob3N0LWJhZGdlXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgIENoXHUxRUU3IHBoXHUwMEYybmc6IDxzdHJvbmcgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0yMDBcIj57cGhvbmcuY2h1UGhvbmdUZW59PC9zdHJvbmc+XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGlkPVwiZm9jdXMtcm9vbS1wcmVzZW5jZVwiIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHB4LTIuNSBweS0wLjUgcm91bmRlZC1mdWxsIGJnLVsjMDBGMkZFXS8xMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8yMCBmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgICBcdUQ4M0RcdURDNjUge3NvTmd1b2kgfHwgMX0gbmdcdTAxQjBcdTFFRERpIFx1MDExMWFuZyBjXHUwMEY5bmcgdFx1MUVBRHAgdHJ1bmdcbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbWwtYXV0b1wiPlxuICAgICAgICAgIHtpc0ZvY3VzTW9kZSAmJiAoXG4gICAgICAgICAgICA8c3BhbiBpZD1cImZvY3VzLW1vZGUtYWN0aXZlLWluZGljYXRvclwiIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXB1cnBsZS00MDAgYmctcHVycGxlLTUwMC8xMCBweC0yIHB5LTAuNSByb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci1wdXJwbGUtNTAwLzIwIGFuaW1hdGUtcHVsc2VcIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERkFGIFx1MDExMGFuZyBiXHUxRUFEdCBGb2N1cyBNb2RlXG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgKX1cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1tb2RlLXRvZ2dsZVwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzRm9jdXNNb2RlKCFpc0ZvY3VzTW9kZSl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7aXNGb2N1c01vZGUgPyAnYmctcHVycGxlLTUwMC8yMCB0ZXh0LXB1cnBsZS0zMDAgYm9yZGVyLXB1cnBsZS01MDAvNDAgc2hhZG93LVswXzBfMTJweF9yZ2JhKDE2OCw4NSwyNDcsMC4zKV0nIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REZBRjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPntpc0ZvY3VzTW9kZSA/ICdcdTIxQTkgVGhvXHUwMEUxdCBGb2N1cyBNb2RlJyA6ICdGb2N1cyBNb2RlJ308L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICB7Y2FuQ29udHJvbCAmJiBwaG9uZy5jaHVQaG9uZ0tob2EgIT09ICdoZS10aG9uZycgJiYgKFxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17ZG9uZ1Bob25nSGllblRhaX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xNSBob3ZlcjpiZy1yb3NlLTUwMC8yNSB0ZXh0LXJvc2UtMzAwIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgXHUwMTEwXHUwMEYzbmcgcGhcdTAwRjJuZ1xuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIE1haW4gRm9jdXMgQ2VudGVycGllY2UgQ2FyZCAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPXtgcmVsYXRpdmUgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtM3hsIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBwLTYgc206cC04IGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyIHNoYWRvdy0yeGwgJHtpc0JyZWFrID8gJ2JnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzFFMTcxMF0gdG8tWyMxMzExMEVdIGJvcmRlci1hbWJlci01MDAvMzAnIDogJ2JnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzBGMUUyOF0gdG8tWyMwQTEyMTldIGJvcmRlci1bIzAwRjJGRV0vMzAnfWB9PlxuICAgICAgICB7LyogR2xvdyBiYWNrZHJvcCBhY2NlbnQgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgYWJzb2x1dGUgLXRvcC0yNCAtbGVmdC0yNCB3LTcyIGgtNzIgcm91bmRlZC1mdWxsIGJsdXItM3hsIG9wYWNpdHktMjAgcG9pbnRlci1ldmVudHMtbm9uZSAke2lzQnJlYWsgPyAnYmctYW1iZXItNTAwJyA6ICdiZy1bIzAwRjJGRV0nfWB9IC8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgYWJzb2x1dGUgLWJvdHRvbS0yNCAtcmlnaHQtMjQgdy03MiBoLTcyIHJvdW5kZWQtZnVsbCBibHVyLTN4bCBvcGFjaXR5LTIwIHBvaW50ZXItZXZlbnRzLW5vbmUgJHtpc0JyZWFrID8gJ2JnLW9yYW5nZS01MDAnIDogJ2JnLWluZGlnby01MDAnfWB9IC8+XG5cbiAgICAgICAgey8qIFBoYXNlICYgU3RhdHVzIEJhZGdlcyAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTIuNSBtYi02IHotMTBcIj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgaWQ9XCJmb2N1cy1waGFzZS1iYWRnZVwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LWV4dHJhYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgYm9yZGVyIHNoYWRvdy1zbSAke2lzQnJlYWsgPyAnYmctYW1iZXItNTAwLzE1IHRleHQtYW1iZXItMzAwIGJvcmRlci1hbWJlci01MDAvNDAnIDogJ2JnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXItWyMwMEYyRkVdLzQwJ31gfT5cbiAgICAgICAgICAgIHtpc0JyZWFrID8gJ1x1MjYxNSBHaVx1MUVERCBOZ2hcdTFFQzkgTmdcdTAxQTFpIChCcmVhayknIDogJ1x1RDgzQ1x1REY0NSBQaGlcdTAwRUFuIFRcdTFFQURwIFRydW5nIChGb2N1cyknfVxuICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBpZD1cImZvY3VzLXN0YXR1cy1iYWRnZVwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEgcm91bmRlZC1mdWxsIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7aXNSdW5uaW5nID8gJ2JnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC00MDAgYm9yZGVyLWVtZXJhbGQtNTAwLzMwJyA6ICdiZy1zbGF0ZS01MDAvMTUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXNsYXRlLTUwMC8zMCd9YH0+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTIgaC0yIHJvdW5kZWQtZnVsbCAke2lzUnVubmluZyA/ICdiZy1lbWVyYWxkLTQwMCBhbmltYXRlLXB1bHNlJyA6ICdiZy1zbGF0ZS00MDAnfWB9IC8+XG4gICAgICAgICAgICA8c3Bhbj57aXNSdW5uaW5nID8gJ1x1MDExMGFuZyBcdTAxMTFcdTFFQkZtJyA6ICdUXHUxRUExbSBkXHUxRUVCbmcnfTwvc3Bhbj5cbiAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1wcmVzZXQtdG9nZ2xlXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgZGlzYWJsZWQ9eyFjYW5Db250cm9sIHx8IGRhbmdHdWlMZW5ofVxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gY2FuQ29udHJvbCAmJiBndWlMZW5oKCdzZXRfcHJlc2V0JywgeyBwcmVzZXQ6IGZvY3VzU3RhdGUucHJlc2V0ID09PSAnNTBfMTAnID8gJzI1XzUnIDogJzUwXzEwJyB9KX1cbiAgICAgICAgICAgIHRpdGxlPXtjYW5Db250cm9sID8gJ0JcdTFFQTVtIFx1MDExMVx1MUVDMyBcdTAxMTFcdTFFRDVpIGNodSBrXHUxRUYzIFBvbW9kb3JvJyA6ICdDaHUga1x1MUVGMyBQb21vZG9ybyBoaVx1MUVDN24gdFx1MUVBMWknfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtbW9ubyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7Y2FuQ29udHJvbCA/ICdob3ZlcjpzY2FsZS0xMDUgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyIGJnLXdoaXRlLzEwIHRleHQtd2hpdGUgYm9yZGVyLXdoaXRlLzIwJyA6ICdjdXJzb3ItZGVmYXVsdCBiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICBcdTI2OTlcdUZFMEYge2ZvY3VzU3RhdGUucHJlc2V0ID09PSAnNTBfMTAnID8gJzUwIC8gMTAgcGhcdTAwRkF0JyA6ICcyNSAvIDUgcGhcdTAwRkF0J31cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIE1hc3NpdmUgVGltZXIgRGlzcGxheSAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteS0yIHNtOm15LTQgei0xMFwiPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBpZD1cImZvY3VzLXRpbWVyLWRpc3BsYXlcIlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgZm9udC1tb25vIHRleHQtNnhsIHNtOnRleHQtOHhsIGZvbnQtYmxhY2sgdHJhY2tpbmctd2lkZXN0IGJsb2NrIHRyYW5zaXRpb24tYWxsIHNlbGVjdC1ub25lICR7aXNCcmVhayA/ICd0ZXh0LWFtYmVyLTMwMCBkcm9wLXNoYWRvdy1bMF8wXzM1cHhfcmdiYSgyNDUsMTU4LDExLDAuMzUpXScgOiAndGV4dC1bIzAwRjJGRV0gZHJvcC1zaGFkb3ctWzBfMF8zNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSd9YH0+XG4gICAgICAgICAgICB7ZGluaERhbmdHaWF5UGh1dChsb2NhbFJlbWFpbmluZyl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogUHJvZ3Jlc3MgYmFyICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy1tZCBoLTIgYmctYmxhY2svNDAgcm91bmRlZC1mdWxsIG92ZXJmbG93LWhpZGRlbiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIG15LTQgei0xMFwiPlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGgtZnVsbCB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0xMDAwICR7aXNCcmVhayA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLW9yYW5nZS01MDAnIDogJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzQjgyRjZdJ31gfVxuICAgICAgICAgICAgc3R5bGU9e3sgd2lkdGg6IGAke3Byb2dyZXNzUGVyY2VudH0lYCB9fVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBDb250cm9sIEJ1dHRvbnMgZm9yIEhvc3QvVGVhY2hlciAqL31cbiAgICAgICAge2NhbkNvbnRyb2wgPyAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTMgbXQtNCB6LTEwXCI+XG4gICAgICAgICAgICB7IWlzUnVubmluZyA/IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXN0YXJ0XCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgnc3RhcnQnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC02IHB5LTMgcm91bmRlZC0yeGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLWVtZXJhbGQtNDAwIHRvLXRlYWwtNTAwIGhvdmVyOmZyb20tZW1lcmFsZC0zMDAgaG92ZXI6dG8tdGVhbC00MDAgdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQtc20gc2hhZG93LVswXzBfMjBweF9yZ2JhKDUyLDIxMSwxNTMsMC4zKV0gYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTI1QjY8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVBRnQgXHUwMTExXHUxRUE3dTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtcGF1c2VcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdwYXVzZScpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMyByb3VuZGVkLTJ4bCBiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLW9yYW5nZS01MDAgaG92ZXI6ZnJvbS1hbWJlci0zMDAgaG92ZXI6dG8tb3JhbmdlLTQwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC1zbSBzaGFkb3ctWzBfMF8yMHB4X3JnYmEoMjUxLDE5MSwzNiwwLjMpXSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjNGODwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5UXHUxRUExbSBkXHUxRUVCbmc8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1yZXNldFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3Jlc2V0Jyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMyByb3VuZGVkLTJ4bCBiZy13aGl0ZS8xMCBob3ZlcjpiZy13aGl0ZS8xNSB0ZXh0LXNsYXRlLTIwMCB0ZXh0LXNtIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDA0PC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTAxMTBcdTFFQjd0IGxcdTFFQTFpPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIHtpc0JyZWFrID8gKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtc3RhcnQtZm9jdXNcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdzdGFydF9mb2N1cycpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMyByb3VuZGVkLTJ4bCBiZy1bIzAwRjJGRV0vMjAgaG92ZXI6YmctWyMwMEYyRkVdLzMwIHRleHQtWyMwMEYyRkVdIHRleHQtc20gZm9udC1ib2xkIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGQUY8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+Vlx1MDBFMG8gVFx1MUVBRHAgdHJ1bmc8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXN0YXJ0LWJyZWFrXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgnc3RhcnRfYnJlYWsnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTMgcm91bmRlZC0yeGwgYmctYW1iZXItNTAwLzIwIGhvdmVyOmJnLWFtYmVyLTUwMC8zMCB0ZXh0LWFtYmVyLTMwMCB0ZXh0LXNtIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC80MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyNjE1PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPk5naFx1MUVDOSBuZ1x1MDFBMWk8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIG10LTMgei0xMFwiPlxuICAgICAgICAgICAgXHUyM0YzIFx1MDExMFx1MUVEM25nIGhcdTFFRDMgUG9tb2Rvcm8gZG8gY2hcdTFFRTcgcGhcdTAwRjJuZyBcdTAxMTFpXHUxRUMxdSBwaFx1MUVEMWkgXHUyMDE0IGhcdTAwRTN5IHRcdTFFQURwIHRydW5nIGhcdTFFQkZ0IG1cdTAwRUNuaCB2XHUwMEUwbyBjXHUwMEY0bmcgdmlcdTFFQzdjL2hcdTFFQ0RjIHRcdTFFQURwIG5oXHUwMEU5IVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgKX1cblxuICAgICAgICB7bG9pICYmIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1yb3NlLTQwMCBtdC00IHotMTBcIj57bG9pfTwvcD59XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIEFtYmllbnQgQXVkaW8gUGxheWVyIENhcmQgKi99XG4gICAgICB7bmhhY1VybCA/IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTQgc206cC01IGZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtNCBzaGFkb3cteGxcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zLjUgbWluLXctMCB3LWZ1bGwgc206dy1hdXRvXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YHctMTIgaC0xMiByb3VuZGVkLTJ4bCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXhsIHNocmluay0wIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke2F1ZGlvUGxheWluZyA/ICdiZy1bIzhCNUNGNl0vMjAgdGV4dC1bIzhCNUNGNl0gYm9yZGVyLVsjOEI1Q0Y2XS80MCBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMTM5LDkyLDI0NiwwLjMpXSBhbmltYXRlLXB1bHNlJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REZBN1xuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi13LTBcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC13aGl0ZSB0cnVuY2F0ZVwiPlx1MDBDMm0gdGhhbmggblx1MUVDMW4gQW1iaWVudDwvcD5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICB7YXVkaW9QbGF5aW5nID8gJ1x1MDExMGFuZyBwaFx1MDBFMXQga2hcdTAwRjRuZyBnaWFuIGhcdTFFQ0RjIHRcdTFFQURwJyA6ICdcdTAwQzJtIHRoYW5oIGNcdTFFRTVjIGJcdTFFRDkgdGhlbyB0aGlcdTFFQkZ0IGJcdTFFQ0InfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0zIHctZnVsbCBzbTp3LWF1dG8ganVzdGlmeS1lbmRcIj5cbiAgICAgICAgICAgIHshaGFzSW50ZXJhY3RlZEF1ZGlvICYmICFhdWRpb1BsYXlpbmcgJiYgKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tc3RhcnQtZm9jdXMtYXVkaW9cIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2JhdEFtVGhhbmh9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjOEI1Q0Y2XSB0by1bIzYzNjZGMV0gdGV4dC13aGl0ZSB0ZXh0LXhzIGZvbnQtYm9sZCBzaGFkb3ctbGcgaG92ZXI6b3BhY2l0eS05MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMEE8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVBRHQgXHUwMEUybSB0aGFuaCB0XHUxRUFEcCB0cnVuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiZm9jdXMtYXVkaW8tdG9nZ2xlXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e3RvZ2dsZUF1ZGlvUGxheX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke2F1ZGlvUGxheWluZyA/ICdiZy1bIzhCNUNGNl0vMjAgdGV4dC1bIzhCNUNGNl0gYm9yZGVyLVsjOEI1Q0Y2XS80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTMwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgICA8c3Bhbj57YXVkaW9QbGF5aW5nID8gJ1x1MjNGOCBUXHUxRUExbSBkXHUxRUVCbmcnIDogJ1x1MjVCNiBQaFx1MDBFMXQgdGlcdTFFQkZwJ308L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlQXVkaW9NdXRlfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTIgcm91bmRlZC14bCBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC14cyB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICB7YXVkaW9NdXRlZCB8fCBhdWRpb1ZvbHVtZSA9PT0gMCA/ICdcdUQ4M0RcdUREMDcnIDogJ1x1RDgzRFx1REQwOSd9XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIHR5cGU9XCJyYW5nZVwiXG4gICAgICAgICAgICAgIG1pbj1cIjBcIlxuICAgICAgICAgICAgICBtYXg9XCIxXCJcbiAgICAgICAgICAgICAgc3RlcD1cIjAuMDVcIlxuICAgICAgICAgICAgICB2YWx1ZT17YXVkaW9NdXRlZCA/IDAgOiBhdWRpb1ZvbHVtZX1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZVZvbHVtZUNoYW5nZX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0yNCBoLTEuNSBiZy13aGl0ZS8xMCByb3VuZGVkLWxnIGFwcGVhcmFuY2Utbm9uZSBjdXJzb3ItcG9pbnRlciBhY2NlbnQtWyM4QjVDRjZdXCJcbiAgICAgICAgICAgICAgdGl0bGU9XCJcdTAwQzJtIGxcdTAxQjBcdTFFRTNuZyBuaFx1MUVBMWMgblx1MUVDMW5cIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC0yeGwgcC00IHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDBcIj5cbiAgICAgICAgICAgIFx1MjYxNSBQaFx1MDBGMm5nIFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgdFx1MDEyOW5oIGxcdTFFQjduZyAoY2hcdTAxQjBhIGdcdTFFQUZuIGxpbmsgXHUwMEUybSB0aGFuaCBuXHUxRUMxbikgXHUyMDE0IENodXlcdTAwRUFuIHRcdTAwRTJtIHRcdTFFRDFpIFx1MDExMWEgdlx1MDBFMG8gYlx1MDBFMGkgdlx1MUVERi5cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAge3Bob25nLm1vVGEgJiYgKFxuICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCBweC0yIGxlYWRpbmctcmVsYXhlZFwiPlxuICAgICAgICAgIHtwaG9uZy5tb1RhfVxuICAgICAgICA8L3A+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIkFBQUEsTUFBTSxFQUFFLFVBQVUsV0FBVyxPQUFPLElBQUk7QUFDeEMsU0FBUyxrQkFBa0IsZUFBZSxXQUFX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
