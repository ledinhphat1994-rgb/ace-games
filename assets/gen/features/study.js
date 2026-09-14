// GEN TU src/features/study.jsx — KHONG SUA TAY
const { useState, useEffect, useRef } = React;
import { dinhDangGiayPhut, giuNguyenViTriCuon, idGoogleDrive, idYoutube, laVideoTrucTiepFe, napYouTubeIframeApi, urlMediaFe } from "../lib/helpers.js";
const khiHienThi = (fn) => () => {
  if (document.visibilityState === "visible") fn();
};
export function QueueInput({ onAdd, onAddNext, onSuggest, canControl = true }) {
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
          if (canControl) {
            onAdd(v.trim());
          } else if (onSuggest) {
            onSuggest(v.trim());
          }
          setV("");
        }
      },
      placeholder: canControl ? "Th\xEAm link video v\xE0o h\xE0ng \u0111\u1EE3i\u2026" : "D\xE1n link video \u0111\u1EC1 xu\u1EA5t cho ch\u1EE7 ph\xF2ng\u2026",
      className: "flex-1 bg-[#0B0E14] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]/50"
    }
  ), canControl ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-queue-add-next",
      disabled: !ok,
      onClick: () => {
        onAddNext(v.trim());
        setV("");
      },
      className: "px-2.5 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/30 text-[10px] font-bold hover:bg-violet-500/25 disabled:opacity-30 whitespace-nowrap cursor-pointer"
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
      className: "px-2.5 py-1.5 rounded-lg bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 text-[10px] font-bold hover:bg-[#00F2FE]/25 disabled:opacity-30 whitespace-nowrap cursor-pointer"
    },
    "+Cu\u1ED1i h\xE0ng"
  )) : /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: "btn-queue-suggest",
      disabled: !ok,
      onClick: () => {
        if (onSuggest) onSuggest(v.trim());
        setV("");
      },
      className: "px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-black text-[10px] font-black hover:brightness-110 active:scale-95 disabled:opacity-30 whitespace-nowrap cursor-pointer shadow-sm"
    },
    "\u{1F4A1} \u0110\u1EC1 xu\u1EA5t"
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
  const _layViTriVideo = () => Math.floor(videoTimeRef?.current || 0) || null;
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
  )))), dockTab === "whiteboard" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col gap-2 min-h-0 h-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 flex-wrap text-xs pb-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
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
  ))), dockTab === "voice" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col items-center justify-center p-6 text-center gap-4" }, /* @__PURE__ */ React.createElement("audio", { ref: remoteAudioRef, autoPlay: true }), /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 rounded-3xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.2)]" }, "\u{1F399}\uFE0F"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "text-sm font-black text-white" }, "Tho\u1EA1i Tr\u1EF1c Ti\u1EBFp 1-1 Trong Ph\xF2ng"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 max-w-xs mt-1" }, "M\u1ED7i ph\xF2ng t\u1ED1i \u0111a m\u1ED9t c\u1EB7p voice 1-1. Micro m\u1EB7c \u0111\u1ECBnh t\u1EAFt khi ch\u01B0a b\u1EADt.")), voicePair?.active !== void 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10" }, voicePair?.aTen ? `${voicePair.aTen}${voicePair.bTen ? " \u2194 " + voicePair.bTen : " \xB7 \u0111ang ch\u1EDD ng\u01B0\u1EDDi th\u1EE9 2"}` : "Ch\u01B0a c\xF3 c\u1EB7p voice n\xE0o"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 flex-wrap justify-center" }, !voiceJoined ? /* @__PURE__ */ React.createElement(React.Fragment, null, coQuyen("voice") ? /* @__PURE__ */ React.createElement(
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
    ["whiteboard", "B\u1EA3ng v\u1EBD"],
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
        } else if (action === "suggest") {
          setThongBaoVideo(`\u0110\xE3 g\u1EEDi \u0111\u1EC1 xu\u1EA5t cho ch\u1EE7 ph\xF2ng duy\u1EC7t: ${extra.title || "Video"}`);
          setTimeout(() => setThongBaoVideo(""), 4e3);
        } else if (action === "approve_suggestion") {
          if (extra.playNow && d.videoUrl) {
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
            setThongBaoVideo("\u0110\xE3 duy\u1EC7t v\xE0 ph\xE1t video ngay l\u1EADp t\u1EE9c!");
            setTimeout(() => setThongBaoVideo(""), 3500);
          } else {
            setThongBaoVideo("\u0110\xE3 duy\u1EC7t video v\xE0o h\xE0ng \u0111\u1EE3i!");
            setTimeout(() => setThongBaoVideo(""), 3500);
          }
        } else if (action === "reject_suggestion") {
          setThongBaoVideo("\u0110\xE3 h\u1EE7y/t\u1EEB ch\u1ED1i video \u0111\u1EC1 xu\u1EA5t.");
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
    const elapsedSec = st?.playing && st?._receivedAt ? Math.max(0, (Date.now() - st._receivedAt) / 1e3) : 0;
    let targetPos = Number(st?.positionSeconds || 0);
    if (st?.playing) {
      targetPos += elapsedSec * (st?.playbackRate || 1);
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
      } else if (!canControl && !isProgrammaticActionRef.current) {
        if (!isLiveWithHostRef.current && pState === 2) {
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
              const tPos = getHostCurrentPos();
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
              } else if (!canControl && !isProgrammaticActionRef.current) {
                if (!isLiveWithHostRef.current && event.data === 2) {
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
    const elapsedSec = st.playing && st._receivedAt ? Math.max(0, (Date.now() - st._receivedAt) / 1e3) : 0;
    let targetPos = Number(st.positionSeconds || 0);
    if (st.playing) {
      targetPos += elapsedSec * (st.playbackRate || 1);
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
          if (drift > 2.5) {
            if (p?.seekTo) {
              try {
                p.seekTo(targetPos, true);
              } catch {
              }
            }
            ifr?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [targetPos, true] }), "*");
          }
          if ((ps === 2 || ps === 5 || ps === -1) && (hasInteracted || hasInteractedRef.current)) {
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
          if (drift > 1.5) {
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
          const st = { ...d.state, _receivedAt: Date.now() };
          setWatchState(st);
          setCanControl(Boolean(d.canControl));
          if (d.caps) setWatchCaps(d.caps);
          setProvider(d.provider || "UNSUPPORTED");
          if (d.phong?.videoUrl && d.phong.videoUrl !== activeVideoUrl) {
            setActiveVideoUrl(d.phong.videoUrl);
            isLiveWithHostRef.current = true;
            setIsLiveWithHost(true);
            setViewerIsPaused(false);
          }
          apDungDongBo(st, Boolean(d.canControl), d.provider || "UNSUPPORTED");
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
        if (watchState.playing && nowMs - lastHostSyncTimeRef.current >= 4e3) {
          lastHostSyncTimeRef.current = nowMs;
          fetch("/api/phong-watch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phongId: phong.id,
              action: "sync_pos",
              position: Math.max(0, Number(curTime.toFixed(2)))
            })
          }).catch(() => {
          });
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
        const st = { ...d.state, _receivedAt: Date.now() };
        lastAppliedRevisionRef.current = d.state.revision;
        setWatchState(st);
        setLocalTime(Math.floor(d.state.positionSeconds || pos));
      } else if (d.conflict && d.state) {
        const st = { ...d.state, _receivedAt: Date.now() };
        setWatchState(st);
        apDungDongBo(st, canControl, provider);
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
    const targetPos = getHostCurrentPos();
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
    )), Boolean(ytQuery.trim().startsWith("http://") || ytQuery.trim().startsWith("https://") || ytQuery.includes("youtu")) && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 p-2 rounded-xl bg-[#0B0E14]/80 border border-[#00F2FE]/20 flex-wrap animate-fadeIn" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-slate-400 flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F517}"), /* @__PURE__ */ React.createElement("span", null, "Ph\xE1t hi\u1EC7n li\xEAn k\u1EBFt video:")), canControl ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
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
    )) : /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        id: "btn-vung1-suggest-link",
        onClick: () => hanhDongQueue("suggest", { videoUrl: ytQuery.trim(), title: "Video t\u1EEB li\xEAn k\u1EBFt" }),
        disabled: queueBusy,
        className: "px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-black text-xs font-black hover:brightness-110 active:scale-95 shadow-sm cursor-pointer flex items-center gap-1.5"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4A1}"),
      /* @__PURE__ */ React.createElement("span", null, "\u0110\u1EC1 xu\u1EA5t cho ch\u1EE7 ph\xF2ng")
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
        /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row items-center gap-1.5 shrink-0" }, canControl ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
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
            onClick: () => hanhDongQueue("enqueue", { videoUrl: vUrl, title: item.title, thumb: item.thumbnail }),
            disabled: queueBusy,
            className: "px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 text-[11px] font-bold active:scale-95 disabled:opacity-40 whitespace-nowrap cursor-pointer"
          },
          "+ H\xE0ng ch\u1EDD"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            title: "Th\xEAm \u0111\u1EC3 ph\xE1t k\u1EBF ti\u1EBFp sau video hi\u1EC7n t\u1EA1i",
            onClick: () => hanhDongQueue("add_next", { videoUrl: vUrl, title: item.title, thumb: item.thumbnail }),
            disabled: queueBusy,
            className: "px-2.5 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 text-[10px] font-bold active:scale-95 disabled:opacity-40 whitespace-nowrap cursor-pointer"
          },
          "+ K\u1EBF ti\u1EBFp"
        )) : /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            title: "G\u1EEDi \u0111\u1EC1 xu\u1EA5t video n\xE0y cho ch\u1EE7 ph\xF2ng ph\xEA duy\u1EC7t",
            onClick: () => hanhDongQueue("suggest", { videoUrl: vUrl, title: item.title, thumb: item.thumbnail }),
            disabled: queueBusy,
            className: "px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs shadow-md hover:brightness-110 active:scale-95 disabled:opacity-40 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          },
          /* @__PURE__ */ React.createElement("span", null, "\u{1F4A1}"),
          /* @__PURE__ */ React.createElement("span", null, "\u0110\u1EC1 xu\u1EA5t cho ch\u1EE7 ph\xF2ng")
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
      )))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col items-center justify-center p-3 bg-[#0B0E14]/60 border border-white/5 rounded-xl text-center text-xs text-slate-400 gap-1 min-h-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, "\u{1F4FA}"), /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-300" }, canControl ? "T\xECm ki\u1EBFm & Ph\xE1t video YouTube" : "T\xECm ki\u1EBFm & \u0110\u1EC1 xu\u1EA5t video YouTube"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 max-w-sm" }, canControl ? "Nh\u1EADp t\u1EEB kh\xF3a b\xE0i h\u1ECDc ho\u1EB7c d\xE1n li\xEAn k\u1EBFt YouTube \u1EDF tr\xEAn \u0111\u1EC3 t\xECm ki\u1EBFm v\xE0 ph\xE1t \u0111\u1ED3ng b\u1ED9 cho t\u1EA5t c\u1EA3 th\xE0nh vi\xEAn trong ph\xF2ng." : "Nh\u1EADp t\u1EEB kh\xF3a ho\u1EB7c d\xE1n li\xEAn k\u1EBFt YouTube \u1EDF tr\xEAn \u0111\u1EC3 t\xECm ki\u1EBFm video v\xE0 \u0111\u1EC1 xu\u1EA5t cho ch\u1EE7 ph\xF2ng duy\u1EC7t ph\xE1t.")))
    )), mediaTab === "queue" && /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col gap-2.5 min-h-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between flex-wrap gap-2 shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-slate-300 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"), /* @__PURE__ */ React.createElement("span", null, "H\xE0ng \u0111\u1EE3i video (", queueList.filter((q) => q.trangThai === "queued").length, " ch\u1EDD)")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, canControl && queueList.some((q) => q.trangThai === "queued") && /* @__PURE__ */ React.createElement(
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
        canControl,
        onAdd: (u, t) => hanhDongQueue("enqueue", { videoUrl: u, title: t }),
        onAddNext: (u, t) => hanhDongQueue("add_next", { videoUrl: u, title: t }),
        onSuggest: (u, t) => hanhDongQueue("suggest", { videoUrl: u, title: t || "Video \u0111\u1EC1 xu\u1EA5t" })
      }
    )), queueList.some((q) => q.trangThai === "suggested") && /* @__PURE__ */ React.createElement("div", { className: "bg-amber-950/25 border border-amber-500/30 rounded-xl p-2.5 flex flex-col gap-2 shrink-0 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-amber-300 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4A1}"), /* @__PURE__ */ React.createElement("span", null, canControl ? `Video \u0111\u1EC1 xu\u1EA5t t\u1EEB th\xE0nh vi\xEAn (${queueList.filter((q) => q.trangThai === "suggested").length})` : `\u0110\u1EC1 xu\u1EA5t \u0111ang ch\u1EDD ch\u1EE7 ph\xF2ng duy\u1EC7t (${queueList.filter((q) => q.trangThai === "suggested").length})`)), canControl && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-amber-400/90 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full" }, "Ch\u1EDD b\u1EA1n duy\u1EC7t")), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5 max-h-36 overflow-y-auto pr-1" }, queueList.filter((q) => q.trangThai === "suggested").map((s) => {
      const isMine = s.addedByKhoa === phongMinhKhoa;
      return /* @__PURE__ */ React.createElement("div", { key: s.id, className: "flex items-center gap-2 bg-[#0B0E14] border border-amber-500/20 rounded-lg p-1.5 transition-all" }, s.thumb && /* @__PURE__ */ React.createElement("img", { src: s.thumb, alt: "", className: "w-12 h-7 rounded object-cover shrink-0 border border-white/10", loading: "lazy" }), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-200 font-bold truncate", title: s.title || s.videoUrl }, s.title || s.videoUrl), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-amber-400/80 truncate" }, "\u0110\u1EC1 xu\u1EA5t b\u1EDFi: ", /* @__PURE__ */ React.createElement("span", { className: isMine ? "text-cyan-300 font-bold" : "" }, isMine ? "B\u1EA1n" : s.addedBy || "Th\xE0nh vi\xEAn"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 shrink-0" }, canControl ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          title: "Duy\u1EC7t v\xE0o h\xE0ng \u0111\u1EE3i",
          onClick: () => hanhDongQueue("approve_suggestion", { id: s.id, playNow: false }),
          disabled: queueBusy,
          className: "px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-[10px] font-bold active:scale-95 cursor-pointer"
        },
        "\u2713 H\xE0ng ch\u1EDD"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          title: "Duy\u1EC7t v\xE0 ph\xE1t ngay l\u1EADp t\u1EE9c",
          onClick: () => hanhDongQueue("approve_suggestion", { id: s.id, playNow: true }),
          disabled: queueBusy,
          className: "px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 text-[10px] font-bold active:scale-95 cursor-pointer"
        },
        "\u25B6 Ph\xE1t ngay"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          title: "T\u1EEB ch\u1ED1i \u0111\u1EC1 xu\u1EA5t n\xE0y",
          onClick: () => hanhDongQueue("reject_suggestion", { id: s.id }),
          disabled: queueBusy,
          className: "w-6 h-6 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-bold flex items-center justify-center active:scale-95 cursor-pointer"
        },
        "\u2715"
      )) : isMine && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          title: "H\u1EE7y \u0111\u1EC1 xu\u1EA5t c\u1EE7a b\u1EA1n",
          onClick: () => hanhDongQueue("reject_suggestion", { id: s.id }),
          disabled: queueBusy,
          className: "px-2 py-1 rounded bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 text-[10px] font-bold active:scale-95 cursor-pointer"
        },
        "H\u1EE7y \u0111\u1EC1 xu\u1EA5t"
      )));
    }))), (() => {
      const officialQueue = queueList.filter((q) => q.trangThai === "playing" || q.trangThai === "queued");
      if (officialQueue.length === 0) {
        return /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col items-center justify-center p-4 bg-[#0B0E14]/60 border border-white/5 rounded-xl text-center text-xs text-slate-400 gap-1.5 min-h-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u{1F4CB}"), /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-300" }, "H\xE0ng \u0111\u1EE3i hi\u1EC7n \u0111ang tr\u1ED1ng"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 max-w-sm" }, canControl ? "Chuy\u1EC3n sang tab T\xECm YouTube ho\u1EB7c d\xE1n li\xEAn k\u1EBFt v\xE0o \xF4 tr\xEAn \u0111\u1EC3 \u0111\u01B0a video v\xE0o danh s\xE1ch ph\xE1t li\xEAn t\u1EE5c." : "Ch\u01B0a c\xF3 video n\xE0o trong h\xE0ng \u0111\u1EE3i ph\xE1t. B\u1EA1n c\xF3 th\u1EC3 t\xECm ki\u1EBFm v\xE0 \u0111\u1EC1 xu\u1EA5t video cho ch\u1EE7 ph\xF2ng duy\u1EC7t."));
      }
      return /* @__PURE__ */ React.createElement("div", { className: "flex-1 space-y-1.5 overflow-y-auto pr-1 min-h-0" }, officialQueue.map((q, idx) => /* @__PURE__ */ React.createElement(
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
        canControl && q.trangThai === "queued" && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 shrink-0" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            title: "Ph\xE1t video n\xE0y ngay",
            onClick: () => hanhDongQueue("play_now", { id: q.id }),
            disabled: queueBusy,
            className: "px-2.5 py-1 rounded-lg bg-[#00F2FE]/20 text-[#00F2FE] hover:bg-[#00F2FE]/30 text-xs font-black active:scale-95 cursor-pointer"
          },
          "\u25B6 Ph\xE1t"
        ), /* @__PURE__ */ React.createElement(
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
      )));
    })()))
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvc3R1ZHkuanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9ID0gUmVhY3Q7XG5pbXBvcnQgeyBkaW5oRGFuZ0dpYXlQaHV0LCBnaXVOZ3V5ZW5WaVRyaUN1b24sIGlkR29vZ2xlRHJpdmUsIGlkWW91dHViZSwgbGFWaWRlb1RydWNUaWVwRmUsIG5hcFlvdVR1YmVJZnJhbWVBcGksIHVybE1lZGlhRmUgfSBmcm9tICcuLi9saWIvaGVscGVycy5qcyc7XG5cbi8vIEJcdTFFQ0YgcXVhIHRpY2sga2hpIHRhYiBcdTAxMTFhbmcgXHUxRURGIE5cdTFFQzBOIFx1MjAxNCB0clx1MDBFMW5oIGNcdTFFRDluZyBkXHUxRUQzbiByZXF1ZXN0IENsb3VkZmxhcmUgdlx1MDBGNCBcdTAwRURjaCBraGkga2hcdTAwRjRuZyBhaSB4ZW0uXG4vLyBLaFx1MDBGNG5nIGRcdTAwRjluZyBjaG8gcG9sbCB0XHUwMEVEbiBoaVx1MUVDN3UgdGhcdTFFRERpIGdpYW4gdGhcdTFFRjFjICh2ZCB2b2ljZSBzaWduYWxpbmcpIHZcdTAwRUMgYlx1MUVDRiBsXHUxRUUxIHRpY2sgY1x1MDBGMyB0aFx1MUVDMyBsXHUwMEUwbSB0cmVvXG4vLyBiXHUxRUFGdCB0YXkga1x1MUVCRnQgblx1MUVEMWkgaG9cdTFFQjdjIHRyXHUxRUM1IHRcdTAwRURuIGhpXHUxRUM3dSBcInJcdTFFRERpIHZvaWNlXCIgY1x1MUVFN2EgbmdcdTAxQjBcdTFFRERpIGtpYS5cbmNvbnN0IGtoaUhpZW5UaGkgPSAoZm4pID0+ICgpID0+IHsgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnKSBmbigpOyB9O1xuXG5cbi8vIFx1MDBENCBuaFx1MUVBRHAgbGluayB0aFx1MDBFQW0gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgXHUyMDE0IGRcdTAwRjluZyBjaHVuZyBjaG8gU3R1ZHlEb2NrIHZcdTAwRTAgQ2FtcHVzV2F0Y2hUb2dldGhlclxuZXhwb3J0IGZ1bmN0aW9uIFF1ZXVlSW5wdXQoeyBvbkFkZCwgb25BZGROZXh0LCBvblN1Z2dlc3QsIGNhbkNvbnRyb2wgPSB0cnVlIH0pIHtcbiAgY29uc3QgW3YsIHNldFZdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBvayA9IHYudHJpbSgpLmxlbmd0aCA+IDA7XG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICA8aW5wdXRcbiAgICAgICAgaWQ9XCJpbnB1dC1xdWV1ZS1hZGRcIlxuICAgICAgICB0eXBlPVwidXJsXCJcbiAgICAgICAgdmFsdWU9e3Z9XG4gICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFYoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICBvbktleURvd249e2UgPT4ge1xuICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiBvaykge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wpIHtcbiAgICAgICAgICAgICAgb25BZGQodi50cmltKCkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvblN1Z2dlc3QpIHtcbiAgICAgICAgICAgICAgb25TdWdnZXN0KHYudHJpbSgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldFYoJycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfX1cbiAgICAgICAgcGxhY2Vob2xkZXI9e2NhbkNvbnRyb2wgPyBcIlRoXHUwMEVBbSBsaW5rIHZpZGVvIHZcdTAwRTBvIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXHUyMDI2XCIgOiBcIkRcdTAwRTFuIGxpbmsgdmlkZW8gXHUwMTExXHUxRUMxIHh1XHUxRUE1dCBjaG8gY2hcdTFFRTcgcGhcdTAwRjJuZ1x1MjAyNlwifVxuICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0yLjUgcHktMS41IHRleHQtWzExcHhdIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgIC8+XG4gICAgICB7Y2FuQ29udHJvbCA/IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBpZD1cImJ0bi1xdWV1ZS1hZGQtbmV4dFwiIGRpc2FibGVkPXshb2t9XG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IG9uQWRkTmV4dCh2LnRyaW0oKSk7IHNldFYoJycpOyB9fVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLXZpb2xldC01MDAvMTUgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctdmlvbGV0LTUwMC8yNSBkaXNhYmxlZDpvcGFjaXR5LTMwIHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICArUGhcdTAwRTF0IGtcdTFFQkZcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBpZD1cImJ0bi1xdWV1ZS1lbnF1ZXVlXCIgZGlzYWJsZWQ9eyFva31cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgb25BZGQodi50cmltKCkpOyBzZXRWKCcnKTsgfX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLVsjMDBGMkZFXS8yNSBkaXNhYmxlZDpvcGFjaXR5LTMwIHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICArQ3VcdTFFRDFpIGhcdTAwRTBuZ1xuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8Lz5cbiAgICAgICkgOiAoXG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGlkPVwiYnRuLXF1ZXVlLXN1Z2dlc3RcIiBkaXNhYmxlZD17IW9rfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgaWYgKG9uU3VnZ2VzdCkgb25TdWdnZXN0KHYudHJpbSgpKTsgc2V0VignJyk7IH19XG4gICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC1sZyBiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLWFtYmVyLTUwMCB0ZXh0LWJsYWNrIHRleHQtWzEwcHhdIGZvbnQtYmxhY2sgaG92ZXI6YnJpZ2h0bmVzcy0xMTAgYWN0aXZlOnNjYWxlLTk1IGRpc2FibGVkOm9wYWNpdHktMzAgd2hpdGVzcGFjZS1ub3dyYXAgY3Vyc29yLXBvaW50ZXIgc2hhZG93LXNtXCI+XG4gICAgICAgICAgXHVEODNEXHVEQ0ExIFx1MDExMFx1MUVDMSB4dVx1MUVBNXRcbiAgICAgICAgPC9idXR0b24+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgU1RVRFkgRE9DSzogS0hcdTAwRDRORyBHSUFOIENcdTFFRDhORyBUXHUwMEMxQyBQSFx1MDBEMk5HIFlPVVRVQkUgKFBIQVNFIDRGKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBmdW5jdGlvbiBTdHVkeURvY2soeyBwaG9uZywgcGhvbmdNaW5oS2hvYSwgYXV0aCwgcGhvbmdDaGF0ID0gW10sIG9uU2VuZFBob25nQ2hhdCwgb25Yb2FUaW5QaG9uZyxcbiAgbXlDYXBzID0ge30sIGlzU3RhZmYgPSBmYWxzZSwgdmFpVHJvUGhvbmcgPSAnbWVtYmVyJywgdGhhbmhWaWVuID0gW10sXG4gIHBvbGljaWVzID0gbnVsbCwgZ3JhbnRzID0gW10sIHZpZGVvVGltZVJlZiwgc2Vla1ZpZGVvLCBoYW5oRG9uZ1Bob25nLFxuICBjYW5Db250cm9sOiBfY2FuQ29udHJvbCA9IGZhbHNlLCBkb25nUGhvbmdIaWVuVGFpOiBfZG9uZ1Bob25nSGllblRhaSwgaXNSb29tV2lkZSA9IGZhbHNlIH0pIHtcbiAgY29uc3QgW2RvY2tUYWIsIHNldERvY2tUYWJdID0gUmVhY3QudXNlU3RhdGUoJ2NoYXQnKTsgLy8gJ2NoYXQnIHwgJ25vdGVzJyB8ICd3aGl0ZWJvYXJkJyB8ICdzaGVldCcgfCAndm9pY2UnIHwgJ3F1YW4tdHJpJ1xuICBjb25zdCBbc2hvd0Vtb2ppLCBzZXRTaG93RW1vamldID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8vIENhcGFiaWxpdHkgcGhcdTAwRURhIGNsaWVudCBjaFx1MUVDOSBcdTAxMTFcdTFFQzMgXHUxRUE5bi9oaVx1MUVDN24gVUkgXHUyMDE0IG1cdTFFQ0RpIHF1eVx1MUVDMW4gdGhcdTFFQUR0IGRvIHNlcnZlciBxdXlcdTFFQkZ0LlxuICBjb25zdCBjb1F1eWVuID0gKGNhcCkgPT4gbXlDYXBzW2NhcF0gIT09IGZhbHNlO1xuICBjb25zdCBfbGF5VmlUcmlWaWRlbyA9ICgpID0+IE1hdGguZmxvb3IodmlkZW9UaW1lUmVmPy5jdXJyZW50IHx8IDApIHx8IG51bGw7XG4gIC8vIEJcdTFFQTVtIG1cdTFFRDFjIHRoXHUxRUREaSBnaWFuIFx1MjE5MiBnXHUxRUVEaSBldmVudCBjaG8gQ2FtcHVzV2F0Y2hUb2dldGhlciB4XHUxRUVEIGxcdTAwRkRcbiAgLy8gKGNcdTAwRjMgdmlkZW9fY29udHJvbCBcdTIxOTIgdHVhIGNodW5nIGNcdTFFQTMgcGhcdTAwRjJuZzsga2hcdTAwRjRuZyBcdTIxOTIgdHVhIGNcdTFFRTVjIGJcdTFFRDkgcGxheWVyIGNcdTFFRTdhIG1cdTAwRUNuaCkuXG4gIGNvbnN0IHlldUNhdVR1YSA9IChzZWMpID0+IHtcbiAgICBpZiAoc2VjID09IG51bGwgfHwgIShzZWMgPj0gMCkpIHJldHVybjtcbiAgICBpZiAoc2Vla1ZpZGVvKSB7IHNlZWtWaWRlbyhOdW1iZXIoc2VjKSwgbXlDYXBzLnZpZGVvX2NvbnRyb2wgPT09IHRydWUpOyByZXR1cm47IH1cbiAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3NyLXNlZWsnLCB7IGRldGFpbDogeyBwaG9uZ0lkOiBwaG9uZz8uaWQsIHNlYzogTnVtYmVyKHNlYykgfSB9KSk7XG4gIH07XG5cbiAgLy8gMS4gUm9vbSBDaGF0IFN0YXRlXG4gIGNvbnN0IFtjaGF0SW5wdXQsIHNldENoYXRJbnB1dF0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtjaGF0U2VuZGluZywgc2V0Q2hhdFNlbmRpbmddID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBjaGF0Q29tcG9zaW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgY2hhdEVuZFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiID09PSAnY2hhdCcgJiYgY2hhdEVuZFJlZi5jdXJyZW50KSB7XG4gICAgICBjb25zdCBwID0gY2hhdEVuZFJlZi5jdXJyZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgICBpZiAocCAmJiBwLnNjcm9sbEhlaWdodCA+IHAuY2xpZW50SGVpZ2h0KSB7XG4gICAgICAgIHAuc2Nyb2xsVG8oeyB0b3A6IHAuc2Nyb2xsSGVpZ2h0LCBiZWhhdmlvcjogJ3Ntb290aCcgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCBbcGhvbmdDaGF0Lmxlbmd0aCwgZG9ja1RhYl0pO1xuXG4gIGNvbnN0IGhhbmRsZVNlbmRSb29tQ2hhdCA9IChlKSA9PiB7XG4gICAgZT8ucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCB0eHQgPSBjaGF0SW5wdXQudHJpbSgpO1xuICAgIGlmICghdHh0IHx8IGNoYXRTZW5kaW5nKSByZXR1cm47XG4gICAgc2V0Q2hhdElucHV0KCcnKTtcbiAgICBzZXRDaGF0U2VuZGluZyh0cnVlKTtcbiAgICBpZiAob25TZW5kUGhvbmdDaGF0KSB7XG4gICAgICBQcm9taXNlLnJlc29sdmUob25TZW5kUGhvbmdDaGF0KHR4dCkpLmNhdGNoKCgpID0+IHtcbiAgICAgICAgc2V0Q2hhdElucHV0KGN1ciA9PiBjdXIgPyBjdXIgOiB0eHQpO1xuICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgIHNldENoYXRTZW5kaW5nKGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRDaGF0U2VuZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG5cblxuICAvLyAzLiBTaGFyZWQgV2hpdGVib2FyZCBTdGF0ZVxuICBjb25zdCBjYW52YXNSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IFt3YlN0cm9rZXMsIHNldFdiU3Ryb2tlc10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFt3YkNvbG9yLCBzZXRXYkNvbG9yXSA9IFJlYWN0LnVzZVN0YXRlKCcjMDBGMkZFJyk7XG4gIGNvbnN0IFt3YldpZHRoLCBzZXRXYldpZHRoXSA9IFJlYWN0LnVzZVN0YXRlKDMpO1xuICBjb25zdCBbd2JUb29sLCBzZXRXYlRvb2xdID0gUmVhY3QudXNlU3RhdGUoJ3BlbicpO1xuICBjb25zdCBpc0RyYXdpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBjdXJyZW50U3Ryb2tlUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB3YlZlcnNpb25SZWYgPSBSZWFjdC51c2VSZWYoMCk7XG5cbiAgY29uc3QgcmVkcmF3Q2FudmFzID0gUmVhY3QudXNlQ2FsbGJhY2soKHN0cm9rZXMpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICBpZiAoIWNhbnZhcykgcmV0dXJuO1xuICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICBzdHJva2VzLmZvckVhY2gocyA9PiB7XG4gICAgICBpZiAoIXMucG9pbnRzIHx8IHMucG9pbnRzLmxlbmd0aCA8IDIpIHJldHVybjtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHMudG9vbCA9PT0gJ2VyYXNlcicgPyAnIzBCMEUxNCcgOiAocy5jb2xvciB8fCAnIzAwRjJGRScpO1xuICAgICAgY3R4LmxpbmVXaWR0aCA9IHMud2lkdGggfHwgMztcbiAgICAgIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcbiAgICAgIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICBjdHgubW92ZVRvKHMucG9pbnRzWzBdLngsIHMucG9pbnRzWzBdLnkpO1xuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBzLnBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjdHgubGluZVRvKHMucG9pbnRzW2ldLngsIHMucG9pbnRzW2ldLnkpO1xuICAgICAgfVxuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH0pO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgW3diQ2FuV3JpdGUsIHNldFdiQ2FuV3JpdGVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG5cbiAgLy8gXHUwMEMxcCAxIG9wIHZcdTAwRTBvIG1cdTFFQTNuZyBzdHJva2VzIChyZXBsYXkgYXBwZW5kLW9ubHkpOiAnc3Ryb2tlJyB0aFx1MDBFQW0gblx1MDBFOXQsICdjbGVhcicgeG9cdTAwRTEgc1x1MUVBMWNoLlxuICBjb25zdCBhcER1bmdPcCA9IChzdHJva2VzLCBvcCkgPT4ge1xuICAgIGlmIChvcC50eXBlID09PSAnY2xlYXInKSByZXR1cm4gW107XG4gICAgaWYgKG9wLnR5cGUgPT09ICdzdHJva2UnICYmIG9wLnN0cm9rZSkgcmV0dXJuIFsuLi5zdHJva2VzLCBvcC5zdHJva2VdO1xuICAgIHJldHVybiBzdHJva2VzO1xuICB9O1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICd3aGl0ZWJvYXJkJykgcmV0dXJuO1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoV2IgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT13aGl0ZWJvYXJkJnNhdUlkPSR7d2JWZXJzaW9uUmVmLmN1cnJlbnR9YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2spIHtcbiAgICAgICAgICBjb25zdCBvcHMgPSBBcnJheS5pc0FycmF5KGQucGF5bG9hZD8ub3BzKSA/IGQucGF5bG9hZC5vcHMgOiBbXTtcbiAgICAgICAgICBpZiAob3BzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gTlx1MUVCRnUgY1x1MDBGMyBvcCAnY2xlYXInIHRyb25nIGxvXHUxRUExdCBtXHUxRURCaSBcdTIxOTIgYnVpbGQgbFx1MUVBMWkgdFx1MUVFQiBcdTAxMTFcdTFFQTd1IGNobyBjaFx1MUVBRmNcbiAgICAgICAgICAgIGlmIChvcHMuc29tZShvID0+IG8udHlwZSA9PT0gJ2NsZWFyJykpIHtcbiAgICAgICAgICAgICAgY29uc3QgZnVsbCA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPXdoaXRlYm9hcmQmc2F1SWQ9MGApO1xuICAgICAgICAgICAgICBjb25zdCBkZiA9IGF3YWl0IGZ1bGwuanNvbigpO1xuICAgICAgICAgICAgICBpZiAoYWN0aXZlICYmIGRmLm9rKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsT3BzID0gQXJyYXkuaXNBcnJheShkZi5wYXlsb2FkPy5vcHMpID8gZGYucGF5bG9hZC5vcHMgOiBbXTtcbiAgICAgICAgICAgICAgICBjb25zdCByZWJ1aWx0ID0gYWxsT3BzLnJlZHVjZShhcER1bmdPcCwgW10pO1xuICAgICAgICAgICAgICAgIHNldFdiU3Ryb2tlcyhyZWJ1aWx0KTtcbiAgICAgICAgICAgICAgICByZWRyYXdDYW52YXMocmVidWlsdCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNldFdiU3Ryb2tlcyhwcmV2ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gb3BzLnJlZHVjZShhcER1bmdPcCwgcHJldik7XG4gICAgICAgICAgICAgICAgcmVkcmF3Q2FudmFzKG5leHQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgd2JWZXJzaW9uUmVmLmN1cnJlbnQgPSBkLnZlcnNpb24gfHwgMDtcbiAgICAgICAgICBzZXRXYkNhbldyaXRlKGQuY2FuV3JpdGUgIT09IGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RpdmUgJiYgZC5jb2RlID09PSAnY2FwYWJpbGl0eV9vZmYnKSB7XG4gICAgICAgICAgc2V0V2JDYW5Xcml0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIGZldGNoV2IoKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGtoaUhpZW5UaGkoZmV0Y2hXYiksIDMwMDApO1xuICAgIHJldHVybiAoKSA9PiB7IGFjdGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludGVydmFsKTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiLCByZWRyYXdDYW52YXNdKTtcblxuICBjb25zdCBzdGFydERyYXdpbmcgPSAoZSkgPT4ge1xuICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgIGlmICghY2FudmFzKSByZXR1cm47XG4gICAgY29uc3QgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBjbGllbnRYID0gZS5jbGllbnRYID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRYKTtcbiAgICBjb25zdCBjbGllbnRZID0gZS5jbGllbnRZID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRZKTtcbiAgICBjb25zdCB4ID0gY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICBjb25zdCB5ID0gY2xpZW50WSAtIHJlY3QudG9wO1xuICAgIGlzRHJhd2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQgPSB7XG4gICAgICB0b29sOiB3YlRvb2wsXG4gICAgICBjb2xvcjogd2JDb2xvcixcbiAgICAgIHdpZHRoOiB3YlRvb2wgPT09ICdlcmFzZXInID8gMTYgOiB3YldpZHRoLFxuICAgICAgcG9pbnRzOiBbeyB4LCB5IH1dXG4gICAgfTtcbiAgfTtcblxuICBjb25zdCBkcmF3TW92ZSA9IChlKSA9PiB7XG4gICAgaWYgKCFpc0RyYXdpbmdSZWYuY3VycmVudCB8fCAhY3VycmVudFN0cm9rZVJlZi5jdXJyZW50KSByZXR1cm47XG4gICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFjYW52YXMpIHJldHVybjtcbiAgICBjb25zdCByZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGNsaWVudFggPSBlLmNsaWVudFggPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFgpO1xuICAgIGNvbnN0IGNsaWVudFkgPSBlLmNsaWVudFkgPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFkpO1xuICAgIGNvbnN0IHggPSBjbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIGNvbnN0IHkgPSBjbGllbnRZIC0gcmVjdC50b3A7XG4gICAgY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnBvaW50cy5wdXNoKHsgeCwgeSB9KTtcbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnRvb2wgPT09ICdlcmFzZXInID8gJyMwQjBFMTQnIDogY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LmNvbG9yO1xuICAgIGN0eC5saW5lV2lkdGggPSBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQud2lkdGg7XG4gICAgY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuICAgIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgY29uc3QgcHRzID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnBvaW50cztcbiAgICBpZiAocHRzLmxlbmd0aCA+PSAyKSB7XG4gICAgICBjdHgubW92ZVRvKHB0c1twdHMubGVuZ3RoIC0gMl0ueCwgcHRzW3B0cy5sZW5ndGggLSAyXS55KTtcbiAgICAgIGN0eC5saW5lVG8ocHRzW3B0cy5sZW5ndGggLSAxXS54LCBwdHNbcHRzLmxlbmd0aCAtIDFdLnkpO1xuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBzdG9wRHJhd2luZyA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIWlzRHJhd2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgaXNEcmF3aW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFN0cm9rZVJlZi5jdXJyZW50ICYmIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5wb2ludHMubGVuZ3RoID4gMSkge1xuICAgICAgY29uc3Qgc3Ryb2tlID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50O1xuICAgICAgY29uc3QgbmV4dFN0cm9rZXMgPSBbLi4ud2JTdHJva2VzLCBzdHJva2VdO1xuICAgICAgc2V0V2JTdHJva2VzKG5leHRTdHJva2VzKTtcbiAgICAgIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICByZXNvdXJjZTogJ3doaXRlYm9hcmQnLFxuICAgICAgICAgICAgcGF5bG9hZDogeyB0eXBlOiAnc3Ryb2tlJywgc3Ryb2tlIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChkLm9rICYmIGQuaWQpIHdiVmVyc2lvblJlZi5jdXJyZW50ID0gTWF0aC5tYXgod2JWZXJzaW9uUmVmLmN1cnJlbnQsIGQuaWQpO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH1cbiAgfTtcblxuICBjb25zdCBjbGVhcldoaXRlYm9hcmQgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFjb25maXJtKCdCXHUxRUExbiBjXHUwMEYzIGNoXHUxRUFGYyBtdVx1MUVEMW4geFx1MDBGM2Egc1x1MUVBMWNoIGJcdTFFQTNuZyB2XHUxRUJEPyAoY2hcdTFFQzkgcXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcpJykpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICByZXNvdXJjZTogJ3doaXRlYm9hcmQnLFxuICAgICAgICAgIHBheWxvYWQ6IHsgdHlwZTogJ2NsZWFyJyB9XG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHtcbiAgICAgICAgc2V0V2JTdHJva2VzKFtdKTtcbiAgICAgICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgICAgIGlmIChjYW52YXMpIHtcbiAgICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cblxuXG4gIC8vIDUuIDEtdG8tMSBXZWJSVEMgVm9pY2UgQ2hhdCBcdTIwMTQgcGFpci1ib3VuZCAodFx1MUVEMWkgXHUwMTExYSAxIGNcdTFFQjdwL3BoXHUwMEYybmcsIHNpZ25hbGluZyByaVx1MDBFQW5nIHRcdTAxQjApXG4gIGNvbnN0IFt2b2ljZUpvaW5lZCwgc2V0Vm9pY2VKb2luZWRdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbWljTXV0ZWQsIHNldE1pY011dGVkXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpOyAvLyBEZWZhdWx0IE9GRlxuICBjb25zdCBbdm9pY2VTdGF0ZSwgc2V0Vm9pY2VTdGF0ZV0gPSBSZWFjdC51c2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gIGNvbnN0IFt2b2ljZU5vdGljZSwgc2V0Vm9pY2VOb3RpY2VdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbdm9pY2VQYWlyLCBzZXRWb2ljZVBhaXJdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7ICAgICAgIC8vIHthY3RpdmUsIGFUZW4sIGJUZW4sIHlvdUluLCBzbG90fVxuICBjb25zdCBbdm9pY2VSZXF1ZXN0ZWQsIHNldFZvaWNlUmVxdWVzdGVkXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3lldUNhdVZvaWNlLCBzZXRZZXVDYXVWb2ljZV0gPSBSZWFjdC51c2VTdGF0ZShbXSk7ICAgICAvLyBzdGFmZjogZGFuaCBzXHUwMEUxY2ggeGluIHF1eVx1MUVDMW5cbiAgY29uc3QgcGNSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGxvY2FsU3RyZWFtUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCByZW1vdGVBdWRpb1JlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgbGFzdFNpZ25hbElkUmVmID0gUmVhY3QudXNlUmVmKDApO1xuICBjb25zdCB2b2ljZVBvbGxUaW1lclJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgdm9pY2VTbG90UmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB2b2ljZUpvaW5lZFJlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IHBlbmRpbmdDYW5kaWRhdGVzUmVmID0gUmVhY3QudXNlUmVmKFtdKTtcbiAgdm9pY2VKb2luZWRSZWYuY3VycmVudCA9IHZvaWNlSm9pbmVkO1xuXG4gIGNvbnN0IGR1bmdLZXROb2lWb2ljZSA9ICgpID0+IHtcbiAgICBpZiAobG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRUcmFja3MoKS5mb3JFYWNoKHQgPT4gdC5zdG9wKCkpO1xuICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudCA9IG51bGw7XG4gICAgfVxuICAgIGlmIChwY1JlZi5jdXJyZW50KSB7XG4gICAgICBwY1JlZi5jdXJyZW50LmNsb3NlKCk7XG4gICAgICBwY1JlZi5jdXJyZW50ID0gbnVsbDtcbiAgICB9XG4gICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCA9IFtdO1xuICAgIHNldE1pY011dGVkKHRydWUpO1xuICB9O1xuXG4gIC8vIFBvbGwgdHJcdTFFQTFuZyB0aFx1MDBFMWkgY1x1MUVCN3AgKyB0XHUwMEVEbiBoaVx1MUVDN3UgY1x1MUVFN2EgcGFydG5lciAoc2VydmVyIGNoXHUxRUM5IHRyXHUxRUEzIHNpZ25hbCBjXHUxRUU3YSBuZ1x1MDFCMFx1MUVERGkgdHJvbmcgY1x1MUVCN3ApLlxuICBjb25zdCBwb2xsVm9pY2UgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JmFjdGlvbj12b2ljZV9wb2xsJnNhdUlkPSR7bGFzdFNpZ25hbElkUmVmLmN1cnJlbnR9YCk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghZC5vaykgcmV0dXJuO1xuICAgICAgaWYgKGQucGFpcikgc2V0Vm9pY2VQYWlyKGQucGFpcik7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShkLnlldUNhdVZvaWNlKSkgc2V0WWV1Q2F1Vm9pY2UoZC55ZXVDYXVWb2ljZSk7XG4gICAgICBjb25zdCBwYyA9IHBjUmVmLmN1cnJlbnQ7XG4gICAgICBpZiAoIXZvaWNlSm9pbmVkUmVmLmN1cnJlbnQgfHwgIXBjKSByZXR1cm47XG4gICAgICBmb3IgKGNvbnN0IHNpZyBvZiBkLnNpZ25hbHMgfHwgW10pIHtcbiAgICAgICAgbGFzdFNpZ25hbElkUmVmLmN1cnJlbnQgPSBNYXRoLm1heChsYXN0U2lnbmFsSWRSZWYuY3VycmVudCwgc2lnLmlkKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdvZmZlcicpIHtcbiAgICAgICAgICAgIC8vIE9mZmVyIG1cdTFFREJpIGhvXHUxRUI3YyByZS1vZmZlciAoXHUwMTExXHUxRUQxaSBwaFx1MDFCMFx1MDFBMW5nIGJcdTFFQUR0IG1pYyBtdVx1MUVEOW4pIFx1MDExMVx1MUVDMXUgc2V0IGxcdTFFQTFpIHJlbW90ZSArIHRyXHUxRUEzIGFuc3dlci5cbiAgICAgICAgICAgIGF3YWl0IHBjLnNldFJlbW90ZURlc2NyaXB0aW9uKG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24oc2lnLnBheWxvYWQpKTtcbiAgICAgICAgICAgIC8vIFhcdTFFQTMgY1x1MDBFMWMgY2FuZGlkYXRlIHRcdTFFREJpIHNcdTFFREJtIHRyXHUwMUIwXHUxRURCYyBraGkgY1x1MDBGMyByZW1vdGVEZXNjcmlwdGlvbi5cbiAgICAgICAgICAgIGZvciAoY29uc3QgYyBvZiBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLmFkZEljZUNhbmRpZGF0ZShuZXcgUlRDSWNlQ2FuZGlkYXRlKGMpKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50ID0gW107XG4gICAgICAgICAgICBjb25zdCBhbnMgPSBhd2FpdCBwYy5jcmVhdGVBbnN3ZXIoKTtcbiAgICAgICAgICAgIGF3YWl0IHBjLnNldExvY2FsRGVzY3JpcHRpb24oYW5zKTtcbiAgICAgICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnYW5zd2VyJywgcGF5bG9hZDogYW5zIH0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnYW5zd2VyJykge1xuICAgICAgICAgICAgaWYgKHBjLnNpZ25hbGluZ1N0YXRlID09PSAnaGF2ZS1sb2NhbC1vZmZlcicpIHtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuc2V0UmVtb3RlRGVzY3JpcHRpb24obmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbihzaWcucGF5bG9hZCkpO1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IGMgb2YgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBjLmFkZEljZUNhbmRpZGF0ZShuZXcgUlRDSWNlQ2FuZGlkYXRlKGMpKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdjYW5kaWRhdGUnKSB7XG4gICAgICAgICAgICBpZiAocGMucmVtb3RlRGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuYWRkSWNlQ2FuZGlkYXRlKG5ldyBSVENJY2VDYW5kaWRhdGUoc2lnLnBheWxvYWQpKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50LnB1c2goc2lnLnBheWxvYWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdsZWF2ZScpIHtcbiAgICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdOZ1x1MDFCMFx1MUVERGkga2lhIFx1MDExMVx1MDBFMyBuZ1x1MUVBRnQgdm9pY2UuJyk7XG4gICAgICAgICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgICAgIGR1bmdLZXROb2lWb2ljZSgpO1xuICAgICAgICAgICAgc2V0Vm9pY2VKb2luZWQoZmFsc2UpO1xuICAgICAgICAgICAgdm9pY2VTbG90UmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCB7IC8qIGJcdTFFQ0YgcXVhIHNpZ25hbCBsXHUxRUQ3aSAqLyB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIC8vIFBvbGwgY2hcdTFFQTF5IGtoaSB0YWIgdm9pY2UgbVx1MUVERiAoeGVtIHRyXHUxRUExbmcgdGhcdTAwRTFpIGNcdTFFQjdwKSBob1x1MUVCN2MgXHUwMTExYW5nIHRyb25nIGNcdTFFQjdwLlxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAndm9pY2UnICYmICF2b2ljZUpvaW5lZCkgcmV0dXJuO1xuICAgIHBvbGxWb2ljZSgpO1xuICAgIHZvaWNlUG9sbFRpbWVyUmVmLmN1cnJlbnQgPSBzZXRJbnRlcnZhbChwb2xsVm9pY2UsIDE1MDApO1xuICAgIHJldHVybiAoKSA9PiB7IGlmICh2b2ljZVBvbGxUaW1lclJlZi5jdXJyZW50KSBjbGVhckludGVydmFsKHZvaWNlUG9sbFRpbWVyUmVmLmN1cnJlbnQpOyB9O1xuICB9LCBbcGhvbmcuaWQsIGRvY2tUYWIsIHZvaWNlSm9pbmVkXSk7XG5cbiAgY29uc3Qgam9pblZvaWNlID0gYXN5bmMgKCkgPT4ge1xuICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBhbmcgeGluIGNoXHUxRUQ3IHRyb25nIGNcdTFFQjdwIHZvaWNlLi4uJyk7XG4gICAgc2V0Vm9pY2VTdGF0ZSgnY29ubmVjdGluZycpO1xuICAgIHRyeSB7XG4gICAgICAvLyAxLiBHaVx1MDBFMG5oIHNsb3QgdHJcdTAwRUFuIHNlcnZlciB0clx1MDFCMFx1MUVEQmMgKHNlcnZlci1hdXRob3JpdGF0aXZlOiB0XHUxRUQxaSBcdTAxMTFhIDEgY1x1MUVCN3AgMS0xL3BoXHUwMEYybmcpXG4gICAgICBjb25zdCBqb2luUmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX2pvaW4nIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGpvaW5EYXRhID0gYXdhaXQgam9pblJlcy5qc29uKCk7XG4gICAgICBpZiAoIWpvaW5EYXRhLm9rKSB7XG4gICAgICAgIGlmIChqb2luRGF0YS5jb2RlID09PSAnZ3JhbnRfcmVxdWlyZWQnKSB7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0JcdTFFQTFuIGNcdTFFQTduIFx1MDExMVx1MDFCMFx1MUVFM2MgY1x1MUVBNXAgcXV5XHUxRUMxbiB2b2ljZSBcdTIwMTQgaFx1MDBFM3kgYlx1MUVBNW0gXCJYaW4gcXV5XHUxRUMxbiB2b2ljZVwiLicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKGpvaW5EYXRhLmxvaSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyB0aGFtIGdpYSB2b2ljZS4nKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdm9pY2VTbG90UmVmLmN1cnJlbnQgPSBqb2luRGF0YS5zbG90O1xuICAgICAgc2V0Vm9pY2VKb2luZWQodHJ1ZSk7XG5cbiAgICAgIC8vIDIuIFhpbiBtaWMgVFJcdTAxQUZcdTFFREFDIGtoaSB0XHUxRUExbyBvZmZlciBcdTIwMTQgdHJhY2sgcGhcdTFFQTNpIGNcdTAwRjMgc1x1MUVCNW4gdHJvbmcgU0RQIG5lZ290aWF0aW9uLFxuICAgICAgLy8gICAgYWRkVHJhY2sgc2F1IGtoaSBcdTAxMTFcdTAwRTMgYlx1MUVBRnQgdGF5IG1cdTAwRTAga2hcdTAwRjRuZyByZW5lZ290aWF0ZSBcdTIxOTIgbmdcdTAxQjBcdTFFRERpIGtpYSBraFx1MDBGNG5nIG5naGUgXHUwMTExXHUwMUIwXHUxRUUzYy5cbiAgICAgIC8vICAgIE1pYyBraFx1MUVERmkgXHUwMTExXHUxRUE3dSBtdXRlZCAoZW5hYmxlZD1mYWxzZSkgXHUyMDE0IHVzZXIgdFx1MUVGMSBiXHUxRUFEdCBiXHUxRUIxbmcgblx1MDBGQXQgTWljLlxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc3RyZWFtID0gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoeyBhdWRpbzogdHJ1ZSwgdmlkZW86IGZhbHNlIH0pO1xuICAgICAgICBzdHJlYW0uZ2V0QXVkaW9UcmFja3MoKS5mb3JFYWNoKHQgPT4geyB0LmVuYWJsZWQgPSBmYWxzZTsgfSk7XG4gICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQgPSBzdHJlYW07XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0toXHUwMEY0bmcgeGluIFx1MDExMVx1MDFCMFx1MUVFM2MgbWljcm8gXHUyMDE0IGJcdTFFQTFuIGNoXHUxRUM5IG5naGUgXHUwMTExXHUwMUIwXHUxRUUzYywga2hcdTAwRjRuZyBuXHUwMEYzaSBcdTAxMTFcdTAxQjBcdTFFRTNjLicpO1xuICAgICAgfVxuXG4gICAgICAvLyAzLiBUXHUxRUExbyBwZWVyIGNvbm5lY3Rpb25cbiAgICAgIGNvbnN0IHBjID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKHtcbiAgICAgICAgaWNlU2VydmVyczogW3sgdXJsczogJ3N0dW46c3R1bi5sLmdvb2dsZS5jb206MTkzMDInIH1dXG4gICAgICB9KTtcbiAgICAgIHBjUmVmLmN1cnJlbnQgPSBwYztcbiAgICAgIGlmIChsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0VHJhY2tzKCkuZm9yRWFjaCh0ID0+IHBjLmFkZFRyYWNrKHQsIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpKTtcbiAgICAgIH1cblxuICAgICAgcGMub25pY2VjYW5kaWRhdGUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmNhbmRpZGF0ZSkge1xuICAgICAgICAgIGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgICAgICBhY3Rpb246ICd2b2ljZV9zaWduYWwnLFxuICAgICAgICAgICAgICBzaWduYWxUeXBlOiAnY2FuZGlkYXRlJyxcbiAgICAgICAgICAgICAgcGF5bG9hZDogZXZlbnQuY2FuZGlkYXRlXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcGMub250cmFjayA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAocmVtb3RlQXVkaW9SZWYuY3VycmVudCAmJiBldmVudC5zdHJlYW1zWzBdKSB7XG4gICAgICAgICAgcmVtb3RlQXVkaW9SZWYuY3VycmVudC5zcmNPYmplY3QgPSBldmVudC5zdHJlYW1zWzBdO1xuICAgICAgICAgIHJlbW90ZUF1ZGlvUmVmLmN1cnJlbnQucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcGMub25jb25uZWN0aW9uc3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHMgPSBwYy5jb25uZWN0aW9uU3RhdGU7XG4gICAgICAgIGlmIChzID09PSAnY29ubmVjdGVkJykge1xuICAgICAgICAgIHNldFZvaWNlU3RhdGUoJ2Nvbm5lY3RlZCcpO1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdcdTI3MTMgXHUwMTEwYW5nIGtcdTFFQkZ0IG5cdTFFRDFpIHRob1x1MUVBMWkgMS0xIHRyXHUxRUYxYyB0aVx1MUVCRnAuJyk7XG4gICAgICAgIH0gZWxzZSBpZiAocyA9PT0gJ2ZhaWxlZCcgfHwgcyA9PT0gJ2Rpc2Nvbm5lY3RlZCcpIHtcbiAgICAgICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnTVx1MUVBNXQga1x1MUVCRnQgblx1MUVEMWkgdGhvXHUxRUExaSAobVx1MUVBMW5nIGNoXHUxRUI3biBQMlAgblx1MUVCRnUga2hcdTAwRjRuZyBjXHUwMEYzIFRVUk4pLicpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyA0LiBTbG90ICdiJyAobmdcdTAxQjBcdTFFRERpIHZcdTAwRTBvIHNhdSkgdFx1MUVBMW8gb2ZmZXI7IHNsb3QgJ2EnIGNoXHUxRUREIG9mZmVyIHRcdTFFRUIgcG9sbC5cbiAgICAgIGlmIChqb2luRGF0YS5zbG90ID09PSAnYicpIHtcbiAgICAgICAgY29uc3Qgb2ZmZXIgPSBhd2FpdCBwYy5jcmVhdGVPZmZlcigpO1xuICAgICAgICBhd2FpdCBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcbiAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdvZmZlcicsIHBheWxvYWQ6IG9mZmVyIH0pXG4gICAgICAgIH0pO1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwXHUwMEUzIHZcdTAwRTBvIGNcdTFFQjdwIFx1MjAxNCBcdTAxMTFhbmcgYlx1MUVBRnQgdGF5IHZcdTFFREJpICcgKyAodm9pY2VQYWlyPy5hVGVuIHx8ICduZ1x1MDFCMFx1MUVERGkga2lhJykgKyAnXHUyMDI2Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnQlx1MUVBMW4gbFx1MDBFMCBuZ1x1MDFCMFx1MUVERGkgXHUwMTExXHUxRUE3dSB0aVx1MDBFQW4gXHUyMDE0IGNoXHUxRUREIHRoXHUwMEVBbSAxIG5nXHUwMUIwXHUxRUREaSB2XHUwMEUwbyB2b2ljZVx1MjAyNicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIHZvaWNlOiAnICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHhpblF1eWVuVm9pY2UgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9yZXF1ZXN0JyB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIGQuZ3JhbnRlZCkge1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnQlx1MUVBMW4gXHUwMTExXHUwMEUzIFx1MDExMVx1MDFCMFx1MUVFM2MgcGhcdTAwRTlwIHZvaWNlIFx1MjAxNCBiXHUxRUE1bSBUaGFtIGdpYS4nKTtcbiAgICAgIH0gZWxzZSBpZiAoZC5vaykge1xuICAgICAgICBzZXRWb2ljZVJlcXVlc3RlZCh0cnVlKTtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMFx1MDBFMyBnXHUxRUVEaSB5XHUwMEVBdSBjXHUxRUE3dSBcdTIwMTQgY2hcdTFFREQgcXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcgZHV5XHUxRUM3dC4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKGQubG9pIHx8ICdLaFx1MDBGNG5nIGdcdTFFRURpIFx1MDExMVx1MDFCMFx1MUVFM2MgeVx1MDBFQXUgY1x1MUVBN3UuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IHNldFZvaWNlTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaS4nKTsgfVxuICB9O1xuXG4gIGNvbnN0IG5nYXRWb2ljZUNhcCA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIWNvbmZpcm0oJ05nXHUxRUFGdCBjXHUxRUI3cCB2b2ljZSBcdTAxMTFhbmcgaG9cdTFFQTF0IFx1MDExMVx1MUVEOW5nPycpKSByZXR1cm47XG4gICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX2VuZCcgfSlcbiAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgcG9sbFZvaWNlKCk7XG4gIH07XG5cbiAgY29uc3QgdG9nZ2xlTWljID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmIChtaWNNdXRlZCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCFsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgLy8gTWljIGJcdTFFQ0IgdFx1MUVFQiBjaFx1MUVEMWkgbFx1MDBGQWMgam9pbiBcdTIxOTIgeGluIGxcdTFFQTFpOyBhZGRUcmFjayBtdVx1MUVEOW4gY1x1MUVBN24gcmVuZWdvdGlhdGUgKG9mZmVyIG1cdTFFREJpKS5cbiAgICAgICAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7IGF1ZGlvOiB0cnVlLCB2aWRlbzogZmFsc2UgfSk7XG4gICAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudCA9IHN0cmVhbTtcbiAgICAgICAgICBjb25zdCBwYyA9IHBjUmVmLmN1cnJlbnQ7XG4gICAgICAgICAgaWYgKHBjKSB7XG4gICAgICAgICAgICBzdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaCh0cmFjayA9PiBwYy5hZGRUcmFjayh0cmFjaywgc3RyZWFtKSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBvZmZlciA9IGF3YWl0IHBjLmNyZWF0ZU9mZmVyKCk7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpO1xuICAgICAgICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ29mZmVyJywgcGF5bG9hZDogb2ZmZXIgfSlcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogcmVuZWdvdGlhdGlvbiB0aFx1MUVBNXQgYlx1MUVBMWkgXHUyMDE0IG5naGUgdlx1MUVBQm4gXHUwMTExXHUwMUIwXHUxRUUzYyAqLyB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0QXVkaW9UcmFja3MoKS5mb3JFYWNoKHQgPT4geyB0LmVuYWJsZWQgPSB0cnVlOyB9KTtcbiAgICAgICAgfVxuICAgICAgICBzZXRNaWNNdXRlZChmYWxzZSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgYWxlcnQoJ0toXHUwMEY0bmcgdGhcdTFFQzMgbVx1MUVERiBtaWNybzogJyArIGVyci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRBdWRpb1RyYWNrcygpLmZvckVhY2godCA9PiB7IHQuZW5hYmxlZCA9IGZhbHNlOyB9KTtcbiAgICAgIH1cbiAgICAgIHNldE1pY011dGVkKHRydWUpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBsZWF2ZVZvaWNlID0gKCkgPT4ge1xuICAgIGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnbGVhdmUnLCBwYXlsb2FkOiB7fSB9KVxuICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICBkdW5nS2V0Tm9pVm9pY2UoKTtcbiAgICBzZXRWb2ljZUpvaW5lZChmYWxzZSk7XG4gICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgdm9pY2VTbG90UmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBcdTAwRTMgbmdcdTFFQUZ0IHZvaWNlLicpO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBpZD1cInN0dWR5LWRvY2stY29udGFpbmVyXCIgc3R5bGU9e3sgb3ZlcmZsb3dBbmNob3I6ICdub25lJyB9fSBjbGFzc05hbWU9e2BiZy1ncmFkaWVudC10by1iIGZyb20tWyMxNjFiMjZdIHRvLVsjMGYxNDFkXSBib3JkZXIgYm9yZGVyLXdoaXRlL1swLjA4XSByb3VuZGVkLTJ4bCBwLTQgZmxleCBmbGV4LWNvbCBzaGFkb3cteGwgJHtpc1Jvb21XaWRlID8gJ21pbi1oLVtjYWxjKDEwMHZoLTE2MHB4KV0gaC1mdWxsIGZsZXgtMScgOiAnaC1bNjIwcHhdIGxnOmgtWzY4MHB4XSd9YH0+XG4gICAgICB7LyogU3R1ZHkgRG9jayBUYWIgTmF2aWdhdGlvbiBcdTIwMTQgR1x1MUVDRG4gZ1x1MDBFMG5nLCB0aFx1MUVBOW0gbVx1MUVGOSwgblx1MDBGQXQgblx1MUVENWkgYlx1MUVBRHQgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBwYi0zIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMCBmbGV4LXdyYXAgc2hyaW5rLTBcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBmbGV4LXdyYXBcIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1jaGF0XCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignY2hhdCcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ2NoYXQnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQUM8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5DaGF0IHBoXHUwMEYybmc8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktd2hpdGVib2FyZFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3doaXRlYm9hcmQnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICd3aGl0ZWJvYXJkJ1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkE4PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Qlx1MUVBM25nIHZcdTFFQkQ8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktdm9pY2VcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCd2b2ljZScpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3ZvaWNlJ1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tYW1iZXItNTAwIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDI1MSwxOTEsMzYsMC4zNSldIGJvcmRlciBib3JkZXItYW1iZXItNDAwLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REY5OVx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPlZvaWNlICgxLTEpPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LW1lbWJlcnNcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdtZW1iZXJzJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnbWVtYmVycydcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tZW1lcmFsZC00MDAgdG8tdGVhbC01MDAgdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoNTIsMjExLDE1MywwLjM1KV0gYm9yZGVyIGJvcmRlci1lbWVyYWxkLTQwMC81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDNjU8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5UaFx1MDBFMG5oIHZpXHUwMEVBbnt0aGFuaFZpZW4ubGVuZ3RoID4gMCA/IGAgKCR7dGhhbmhWaWVuLmxlbmd0aH0pYCA6ICcnfTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktcXVhbi10cmlcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYigncXVhbi10cmknKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgICBkb2NrVGFiID09PSAncXVhbi10cmknXG4gICAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tdmlvbGV0LTUwMCB0by1wdXJwbGUtNTAwIHRleHQtd2hpdGUgc2hhZG93LVswXzBfMTVweF9yZ2JhKDEzOSw5MiwyNDYsMC4zNSldIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC81MCdcbiAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICA8c3Bhbj5cdTI2OTlcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlF1eVx1MUVDMW48L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogRG9jayBDb250ZW50IEJvZHkgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIHB0LTMgbWluLWgtMCBoLWZ1bGwgb3ZlcmZsb3ctaGlkZGVuXCI+XG4gICAgICAgIHsvKiBUQUIgMTogQ0hBVCBQSFx1MDBEMk5HICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ2NoYXQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIG1pbi1oLTAgaC1mdWxsXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy15LWF1dG8gc3BhY2UteS0zIHByLTEgbWluLWgtMCB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgIHtwaG9uZ0NoYXQubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwIHRleHQtY2VudGVyIHB5LThcIj5DaFx1MDFCMGEgY1x1MDBGMyB0aW4gbmhcdTFFQUZuIFx1MjAxNCBoXHUwMEUzeSBnXHUxRUVEaSBjXHUwMEUydSBoXHUxRUNGaSBob1x1MUVCN2MgdHJhbyBcdTAxMTFcdTFFRDVpIHZcdTFFQzEgYlx1MDBFMGkgZ2lcdTFFQTNuZyE8L3A+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgcGhvbmdDaGF0Lm1hcCgobSwgaWR4KSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBteU5hbWUgPSBTdHJpbmcoYXV0aD8udXNlcj8uaG9UZW4gfHwgYXV0aD8udXNlcj8ubmFtZSB8fCBhdXRoPy51c2VyPy50ZW4gfHwgJycpLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhQ2hpbmhNaW5oID0gQm9vbGVhbihcbiAgICAgICAgICAgICAgICAgICAgbS5jdWFUb2kgfHxcbiAgICAgICAgICAgICAgICAgICAgKG0ua2hvYSAmJiBwaG9uZ01pbmhLaG9hICYmIG0ua2hvYSA9PT0gcGhvbmdNaW5oS2hvYSkgfHxcbiAgICAgICAgICAgICAgICAgICAgKG15TmFtZSAmJiBtLnRlbk5ndW9pR3VpICYmIG0udGVuTmd1b2lHdWkudHJpbSgpLnRvTG93ZXJDYXNlKCkgPT09IG15TmFtZS50b0xvd2VyQ2FzZSgpKVxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHRpbWVTdHIgPSBtLnRhb0x1YyA/IG5ldyBEYXRlKG0udGFvTHVjLnJlcGxhY2UoJyAnLCAnVCcpICsgKG0udGFvTHVjLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLnRvTG9jYWxlVGltZVN0cmluZyhbXSwgeyBob3VyOiAnMi1kaWdpdCcsIG1pbnV0ZTogJzItZGlnaXQnIH0pIDogJyc7XG5cbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e20uaWQgfHwgaWR4fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXggZmxleC1jb2wgZ3JvdXAgdy1mdWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYUNoaW5oTWluaCA/ICdpdGVtcy1lbmQnIDogJ2l0ZW1zLXN0YXJ0J1xuICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICB7LyogSGVhZGVyIHRoXHUwMEY0bmcgdGluIG5nXHUwMUIwXHUxRUREaSBnXHUxRUVEaSAqL31cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgbWItMSB0ZXh0LVsxMXB4XSAke2xhQ2hpbmhNaW5oID8gJ2ZsZXgtcm93LXJldmVyc2UnIDogJyd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2Bmb250LWV4dHJhYm9sZCAke2xhQ2hpbmhNaW5oID8gJ3RleHQtWyMwMEYyRkVdJyA6ICd0ZXh0LXNsYXRlLTIwMCd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHttLnRlbk5ndW9pR3VpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2xhQ2hpbmhNaW5oICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuMiByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy1bIzAwRjJGRV0vMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgc2hhZG93LXNtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQlx1MUVBMW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHttLnZhaVRybyA9PT0gJ2dpYW9fdmllbicgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgR1ZDTlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogbS5sb3BUZW4gPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMjBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7bS5sb3BUZW59XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgZm9udC1tb25vXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHt0aW1lU3RyfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2lzU3RhZmYgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJYb1x1MDBFMSB0aW4gbmhcdTFFQUZuIG5cdTAwRTB5IChxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZylcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNoYXQ/cGhvbmdJZD0ke3Bob25nLmlkfSZpZD0ke20uaWR9YCwgeyBtZXRob2Q6ICdERUxFVEUnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQub2sgJiYgb25Yb2FUaW5QaG9uZykgb25Yb2FUaW5QaG9uZyhtLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBiXHUxRUNGIHF1YSAqLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcGFjaXR5LTAgZ3JvdXAtaG92ZXI6b3BhY2l0eS0xMDAgcHgtMSB0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtcm9zZS00MDAgdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgey8qIEJ1YmJsZSB0aW4gbmhcdTFFQUZuICovfVxuICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YG1heC13LVs4NSVdIHNtOm1heC13LVs3OCVdIHB4LTMuNSBweS0yIHRleHQteHMgbGVhZGluZy1yZWxheGVkIGJyZWFrLXdvcmRzIHNoYWRvdy1tZCB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsYUNoaW5oTWluaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ3JvdW5kZWQtMnhsIHJvdW5kZWQtdHIteHMgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBiNGQ4XS8yNSB2aWEtWyMwMDc3YjZdLzMwIHRvLVsjMDBGMkZFXS8yMCBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCB0ZXh0LXdoaXRlIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4xMildJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ3JvdW5kZWQtMnhsIHJvdW5kZWQtdGwteHMgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6Ym9yZGVyLXdoaXRlLzIwIHRleHQtc2xhdGUtMjAwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwid2hpdGVzcGFjZS1wcmUtd3JhcFwiPnttLm5vaUR1bmd9PC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAge20udmlkZW9UaW1lU2VjICE9IG51bGwgJiYgbS52aWRlb1RpbWVTZWMgPj0gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB5ZXVDYXVUdWEobS52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm10LTEuNSBpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgcHgtMiBweS0wLjUgcm91bmRlZC1sZyB0ZXh0LVsxMHB4XSBmb250LWJsYWNrIGJnLWN5YW4tNDAwLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIGhvdmVyOmJnLVsjMDBGMkZFXS8zMCB0cmFuc2l0aW9uLWFsbCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MjVCNjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj57ZGluaERhbmdHaWF5UGh1dChtLnZpZGVvVGltZVNlYyl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8ZGl2IHJlZj17Y2hhdEVuZFJlZn0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU2VuZFJvb21DaGF0fSBjbGFzc05hbWU9XCJwdC0yIGJvcmRlci10IGJvcmRlci13aGl0ZS84IGZsZXggZmxleC1jb2wgZ2FwLTIgbXQtYXV0byBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICB7LyogRW1vamkgcGFuZWwgKi99XG4gICAgICAgICAgICAgIHtzaG93RW1vamkgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgZ2FwLTEgcC0yIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsXCI+XG4gICAgICAgICAgICAgICAgICB7WydcdUQ4M0RcdURFMEEnLCdcdUQ4M0RcdURFMDInLCdcdUQ4M0VcdURENzAnLCdcdUQ4M0RcdURFMEUnLCdcdUQ4M0VcdUREMTQnLCdcdUQ4M0RcdURFMDUnLCdcdUQ4M0RcdURFMkQnLCdcdUQ4M0RcdUREMjUnLCdcdTI3NjRcdUZFMEYnLCdcdUQ4M0RcdURDNEQnLCdcdUQ4M0RcdURFNEYnLCdcdUQ4M0NcdURGODknLCdcdTI3MDUnLCdcdUQ4M0RcdURDQUYnLCdcdUQ4M0RcdURDNEInLCdcdUQ4M0RcdURDREEnLCdcdTI3MEZcdUZFMEYnLCdcdUQ4M0NcdURGQUYnLCdcdUQ4M0NcdURGMUYnLCdcdUQ4M0RcdURDQTEnLCdcdTI2QTEnLCdcdUQ4M0NcdURGQzYnLCdcdUQ4M0VcdUREMUQnLCdcdUQ4M0RcdURDQUEnLCdcdUQ4M0VcdUREMjknXS5tYXAoZW0gPT4gKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGtleT17ZW19IHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0Q2hhdElucHV0KHYgPT4gdiArIGVtKTsgc2V0U2hvd0Vtb2ppKGZhbHNlKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LWxnIGhvdmVyOnNjYWxlLTEyNSB0cmFuc2l0aW9uLXRyYW5zZm9ybSBhY3RpdmU6c2NhbGUtOTUgcHgtMVwiPntlbX08L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBmbGV4LTFcIj5cbiAgICAgICAgICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgICBpZD1cImlucHV0LXBob25nLWNoYXRcIlxuICAgICAgICAgICAgICAgICAgICByb3dzPXsxfVxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17Y29RdXllbignY2hhdCcpID8gJ05oXHUxRUFGbiB0aW4gcGhcdTAwRjJuZyBoXHUxRUNEYy4uLicgOiAnQ2hhdCBcdTAxMTFhbmcgYlx1MUVDQiBraFx1MDBGM2EnfVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Y2hhdElucHV0fVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNvUXV5ZW4oJ2NoYXQnKX1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Q2hhdElucHV0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0PXsoKSA9PiB7IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ9eygpID0+IHsgY2hhdENvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7IH19XG4gICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInICYmICFlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5uYXRpdmVFdmVudD8uaXNDb21wb3NpbmcgfHwgY2hhdENvbXBvc2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVTZW5kUm9vbUNoYXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17NTAwfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcHgtNCBweS0yLjUgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MCBmb2N1czpzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMCwyNDIsMjU0LDAuMTIpXSByZXNpemUtbm9uZSBtaW4taC1bMzhweF0gbWF4LWgtMjQgZGlzYWJsZWQ6b3BhY2l0eS00MCB0cmFuc2l0aW9uLWFsbFwiXG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHsvKiBFbW9qaSBidXR0b24gKi99XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNvUXV5ZW4oJ2NoYXQnKX1cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNob3dFbW9qaSh2ID0+ICF2KX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctOSBoLTkgcm91bmRlZC0yeGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1iYXNlIHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktMzAgc2hyaW5rLTAgYWN0aXZlOnNjYWxlLTkwICR7XG4gICAgICAgICAgICAgICAgICAgIHNob3dFbW9qaSA/ICdiZy1bIzAwRjJGRV0vMjAgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgdGV4dC1bIzAwRjJGRV0nIDogJ2JnLXdoaXRlLzUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIGhvdmVyOmJnLXdoaXRlLzEwJ1xuICAgICAgICAgICAgICAgICAgfWB9XG4gICAgICAgICAgICAgICAgICB0aXRsZT1cIkNoXHUxRUNEbiBlbW9qaVwiPlxuICAgICAgICAgICAgICAgICAgXHVEODNEXHVERTBBXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgey8qIFNlbmQgYnV0dG9uICovfVxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tc2VuZC1waG9uZy1jaGF0XCJcbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshY2hhdElucHV0LnRyaW0oKSB8fCBjaGF0U2VuZGluZyB8fCAhY29RdXllbignY2hhdCcpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy05IGgtOSByb3VuZGVkLTJ4bCBiZy1ncmFkaWVudC10by1iciBmcm9tLVsjMDBGMkZFXSB0by1bIzNCODJGNl0gdGV4dC1ibGFjayBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktMzAgc2hyaW5rLTAgaG92ZXI6YnJpZ2h0bmVzcy0xMTAgYWN0aXZlOnNjYWxlLTkwIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgwLDI0MiwyNTQsMC4zKV1cIj5cbiAgICAgICAgICAgICAgICAgIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwiY3VycmVudENvbG9yXCIgY2xhc3NOYW1lPVwidy00IGgtNFwiPlxuICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTMuNDc4IDIuNDA1YS43NS43NSAwIDAwLS45MjYuOTRsMi40MzIgNy45MDVIMTMuNWEuNzUuNzUgMCAwMTAgMS41SDQuOTg0bC0yLjQzMiA3LjkwNWEuNzUuNzUgMCAwMC45MjYuOTQgNjAuNTE5IDYwLjUxOSAwIDAwMTguNDQ1LTguOTg2Ljc1Ljc1IDAgMDAwLTEuMjE4QTYwLjUxNyA2MC41MTcgMCAwMDMuNDc4IDIuNDA1elwiIC8+XG4gICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cblxuXG4gICAgICAgIHsvKiBUQUIgMzogQlx1MUVBMk5HIFZcdTFFQkMgQ1x1MUVEOE5HIFRcdTAwQzFDIChTSEFSRUQgV0hJVEVCT0FSRCkgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAnd2hpdGVib2FyZCcgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTIgbWluLWgtMCBoLWZ1bGxcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIGZsZXgtd3JhcCB0ZXh0LXhzIHBiLTFcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4td2ItcGVuXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFdiVG9vbCgncGVuJyl9XG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXdiQ2FuV3JpdGV9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0yLjUgcHktMSByb3VuZGVkLWxnIHRleHQteHMgZm9udC1ib2xkIGRpc2FibGVkOm9wYWNpdHktNDAgJHt3YlRvb2wgPT09ICdwZW4nID8gJ2JnLVsjMDBGMkZFXSB0ZXh0LWJsYWNrJyA6ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCd9YH0+XG4gICAgICAgICAgICAgICAgICBcdTI3MEZcdUZFMEYgQlx1MDBGQXQgdlx1MUVCRFxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4td2ItZXJhc2VyXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFdiVG9vbCgnZXJhc2VyJyl9XG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXdiQ2FuV3JpdGV9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0yLjUgcHktMSByb3VuZGVkLWxnIHRleHQteHMgZm9udC1ib2xkIGRpc2FibGVkOm9wYWNpdHktNDAgJHt3YlRvb2wgPT09ICdlcmFzZXInID8gJ2JnLXJvc2UtNTAwIHRleHQtd2hpdGUnIDogJ2JnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwJ31gfT5cbiAgICAgICAgICAgICAgICAgIFx1RDgzRVx1RERGOSBUXHUxRUE5eVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgbWwtMlwiPlxuICAgICAgICAgICAgICAgICAge1snIzAwRjJGRScsICcjRkZCODAwJywgJyNGNDNGNUUnLCAnI0ZGRkZGRiddLm1hcChjID0+IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIGtleT17Y31cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXdiQ2FuV3JpdGV9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRXYkNvbG9yKGMpOyBzZXRXYlRvb2woJ3BlbicpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNSBoLTUgcm91bmRlZC1mdWxsIGJvcmRlciBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JDb2xvciA9PT0gYyAmJiB3YlRvb2wgPT09ICdwZW4nID8gJ3NjYWxlLTExMCBib3JkZXItd2hpdGUgcmluZy0yIHJpbmctY3lhbi00MDAnIDogJ2JvcmRlci10cmFuc3BhcmVudCd9YH1cbiAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiBjIH19XG4gICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2N9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLWNsZWFyXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2NsZWFyV2hpdGVib2FyZH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctd2hpdGUvNSBob3ZlcjpiZy1yb3NlLTUwMC8yMCB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC14cyBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgIFhcdTAwRjNhIGJcdTFFQTNuZ1xuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIG92ZXJmbG93LWhpZGRlbiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByZWxhdGl2ZSB0b3VjaC1ub25lIG1pbi1oLVsyMjBweF1cIj5cbiAgICAgICAgICAgICAgeyF3YkNhbldyaXRlICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgei0xMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBiZy1ibGFjay80MCB0ZXh0LVsxMXB4XSB0ZXh0LWFtYmVyLTMwMC85MCBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgIFx1RDgzRFx1REQxMiBCXHUxRUEzbmcgdlx1MUVCRCBcdTAxMTFhbmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSBjaFx1MUVDOSB4ZW1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPGNhbnZhc1xuICAgICAgICAgICAgICAgIGlkPVwic3R1ZHktd2hpdGVib2FyZC1jYW52YXNcIlxuICAgICAgICAgICAgICAgIHJlZj17Y2FudmFzUmVmfVxuICAgICAgICAgICAgICAgIHdpZHRoPXs2NDB9XG4gICAgICAgICAgICAgICAgaGVpZ2h0PXszMjB9XG4gICAgICAgICAgICAgICAgb25Nb3VzZURvd249e3diQ2FuV3JpdGUgPyBzdGFydERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZU1vdmU9e3diQ2FuV3JpdGUgPyBkcmF3TW92ZSA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvbk1vdXNlVXA9e3diQ2FuV3JpdGUgPyBzdG9wRHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9e3diQ2FuV3JpdGUgPyBzdG9wRHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvblRvdWNoU3RhcnQ9e3diQ2FuV3JpdGUgPyBzdGFydERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaE1vdmU9e3diQ2FuV3JpdGUgPyBkcmF3TW92ZSA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvblRvdWNoRW5kPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIGgtZnVsbCAke3diQ2FuV3JpdGUgPyAnY3Vyc29yLWNyb3NzaGFpcicgOiAnY3Vyc29yLW5vdC1hbGxvd2VkJ31gfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cblxuXG4gICAgICAgIHsvKiBUQUIgNTogMS1UTy0xIFdFQlJUQyBWT0lDRSBcdTIwMTQgcGFpci1ib3VuZCwgY1x1MDBGMyB4aW4gcXV5XHUxRUMxbiAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICd2b2ljZScgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNiB0ZXh0LWNlbnRlciBnYXAtNFwiPlxuICAgICAgICAgICAgPGF1ZGlvIHJlZj17cmVtb3RlQXVkaW9SZWZ9IGF1dG9QbGF5IC8+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTYgaC0xNiByb3VuZGVkLTN4bCBiZy1hbWJlci00MDAvMTUgYm9yZGVyIGJvcmRlci1hbWJlci00MDAvMzAgdGV4dC1hbWJlci00MDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC0zeGwgc2hhZG93LVswXzBfMjBweF9yZ2JhKDI0NSwxNTgsMTEsMC4yKV1cIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERjk5XHVGRTBGXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC13aGl0ZVwiPlRob1x1MUVBMWkgVHJcdTFFRjFjIFRpXHUxRUJGcCAxLTEgVHJvbmcgUGhcdTAwRjJuZzwvaDQ+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDAgbWF4LXcteHMgbXQtMVwiPlxuICAgICAgICAgICAgICAgIE1cdTFFRDdpIHBoXHUwMEYybmcgdFx1MUVEMWkgXHUwMTExYSBtXHUxRUQ5dCBjXHUxRUI3cCB2b2ljZSAxLTEuIE1pY3JvIG1cdTFFQjdjIFx1MDExMVx1MUVDQm5oIHRcdTFFQUZ0IGtoaSBjaFx1MDFCMGEgYlx1MUVBRHQuXG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogVHJcdTFFQTFuZyB0aFx1MDBFMWkgY1x1MUVCN3AgaGlcdTFFQzduIHRcdTFFQTFpICovfVxuICAgICAgICAgICAge3ZvaWNlUGFpcj8uYWN0aXZlICE9PSB1bmRlZmluZWQgJiYgKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgYmctd2hpdGUvNSBweC0zIHB5LTEgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgICB7dm9pY2VQYWlyPy5hVGVuID8gYCR7dm9pY2VQYWlyLmFUZW59JHt2b2ljZVBhaXIuYlRlbiA/ICcgXHUyMTk0ICcgKyB2b2ljZVBhaXIuYlRlbiA6ICcgXHUwMEI3IFx1MDExMWFuZyBjaFx1MUVERCBuZ1x1MDFCMFx1MUVERGkgdGhcdTFFRTkgMid9YCA6ICdDaFx1MDFCMGEgY1x1MDBGMyBjXHUxRUI3cCB2b2ljZSBuXHUwMEUwbyd9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgZmxleC13cmFwIGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgICAgICAgIHshdm9pY2VKb2luZWQgPyAoXG4gICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgIHtjb1F1eWVuKCd2b2ljZScpID8gKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2Utam9pblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17am9pblZvaWNlfVxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt2b2ljZVBhaXI/LmFjdGl2ZSAmJiAhdm9pY2VQYWlyPy55b3VJbn1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIuNSByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tb3JhbmdlLTUwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC14cyBzaGFkb3ctbGcgaG92ZXI6b3BhY2l0eS05MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS00MFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHt2b2ljZVBhaXI/LmFjdGl2ZSA/ICdcdTAxMTBhbmcgY1x1MDBGMyBjXHUxRUI3cCB2b2ljZSBraFx1MDBFMWMnIDogdm9pY2VQYWlyPy5hVGVuID8gJ1ZcdTAwRTBvIGNcdTFFQjdwIHZcdTFFREJpICcgKyB2b2ljZVBhaXIuYVRlbiA6ICdUaGFtIGdpYSB2b2ljZSd9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLXJlcXVlc3RcIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3hpblF1eWVuVm9pY2V9XG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZvaWNlUmVxdWVzdGVkfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMi41IHJvdW5kZWQteGwgYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0yMDAgYm9yZGVyIGJvcmRlci13aGl0ZS8xNSBmb250LWJvbGQgdGV4dC14cyBob3ZlcjpiZy13aGl0ZS8xNSB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3ZvaWNlUmVxdWVzdGVkID8gJ1x1MjNGMyBcdTAxMTBhbmcgY2hcdTFFREQgZHV5XHUxRUM3dFx1MjAyNicgOiAnXHVEODNEXHVERTRCIFhpbiBxdXlcdTFFQzFuIHZvaWNlJ31cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS10b2dnbGUtbWljXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlTWljfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC00IHB5LTIuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHttaWNNdXRlZCA/ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3ZlcjpiZy13aGl0ZS8xNScgOiAnYmctZW1lcmFsZC01MDAgdGV4dC1ibGFjayd9YH0+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPnttaWNNdXRlZCA/ICdcdUQ4M0RcdUREMDcgQlx1MUVBRHQgTWljJyA6ICdcdUQ4M0NcdURGOTlcdUZFMEYgTWljIFx1MDExMGFuZyBCXHUxRUFEdCd9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1sZWF2ZVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2xlYXZlVm9pY2V9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMi41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMjAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzMwIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgIFJcdTFFRERpIHZvaWNlXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAge2lzU3RhZmYgJiYgdm9pY2VQYWlyPy5hVGVuICYmICF2b2ljZVBhaXI/LnlvdUluICYmIChcbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLWVuZFwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtuZ2F0Vm9pY2VDYXB9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzEwIHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8yNSB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8yMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgTmdcdTFFQUZ0IGNcdTFFQjdwIHZvaWNlXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFN0YWZmOiBkYW5oIHNcdTAwRTFjaCB4aW4gcXV5XHUxRUMxbiB2b2ljZSAqL31cbiAgICAgICAgICAgIHtpc1N0YWZmICYmIHlldUNhdVZvaWNlLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy1zbSBiZy13aGl0ZS81IGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTIuNSB0ZXh0LWxlZnRcIj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHRleHQtYW1iZXItMzAwIG1iLTEuNVwiPlx1MDExMGFuZyB4aW4gcXV5XHUxRUMxbiB2b2ljZTwvcD5cbiAgICAgICAgICAgICAgICB7eWV1Q2F1Vm9pY2UubWFwKHIgPT4gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3Iua2hvYX0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyBweS0xXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtMjAwIGZvbnQtc2VtaWJvbGQgZmxleC0xIHRydW5jYXRlXCI+e3IudGVuIHx8ICdUaFx1MDBFMG5oIHZpXHUwMEVBbid9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4geyBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiByLmtob2EsIGNhcGFiaWxpdHk6ICd2b2ljZScsIG9uOiB0cnVlIH0pOyBpZiAoZD8ub2spIHNldFlldUNhdVZvaWNlKHByZXYgPT4gcHJldi5maWx0ZXIoeCA9PiB4Lmtob2EgIT09IHIua2hvYSkpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctZW1lcmFsZC01MDAvMjAgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIER1eVx1MUVDN3RcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHIua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246IGZhbHNlIH0pOyBpZiAoZD8ub2spIHNldFlldUNhdVZvaWNlKHByZXYgPT4gcHJldi5maWx0ZXIoeCA9PiB4Lmtob2EgIT09IHIua2hvYSkpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzI1IHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgIFRcdTFFRUIgY2hcdTFFRDFpXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAge3ZvaWNlTm90aWNlICYmIChcbiAgICAgICAgICAgICAgPHAgaWQ9XCJ2b2ljZS1zdGF0dXMtbm90aWNlXCIgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTMwMCBmb250LW1vbm8gYmctYmxhY2svNDAgcHgtMyBweS0xLjUgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICB7dm9pY2VOb3RpY2V9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCBtYXgtdy14c1wiPlxuICAgICAgICAgICAgICAqIEdoaSBjaFx1MDBGQTogS1x1MUVCRnQgblx1MUVEMWkgdGhvXHUxRUExaSBQMlAgeVx1MDBFQXUgY1x1MUVBN3UgbVx1MUVBMW5nIGtoXHUwMEY0bmcgY2hcdTFFQjduIFVEUC4gUmVzdHJpY3RpdmUgTkFUIGNcdTAwRjMgdGhcdTFFQzMgY1x1MUVBN24gcmVsYXkgVFVSTi5cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDc6IFRIXHUwMEMwTkggVklcdTAwQ0FOIFRST05HIFBIXHUwMEQyTkcgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAnbWVtYmVycycgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTMgbWluLWgtMCBoLWZ1bGxcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHBiLTIgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ibGFjayB0ZXh0LXdoaXRlIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDNjU8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+VGhcdTAwRTBuaCB2aVx1MDBFQW4gdHJvbmcgcGhcdTAwRjJuZyAoe3RoYW5oVmllbi5sZW5ndGh9KTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgICAgIFx1MDExMGFuZyB0clx1MUVGMWMgdHV5XHUxRUJGblxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMiBvdmVyZmxvdy15LWF1dG8gcHItMSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgIHt0aGFuaFZpZW4ubWFwKCh0diwgaWR4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGFIb3N0ID0gdHYubGFDaHVQaG9uZyA9PT0gMSB8fCB0di52YWlUcm9QaG9uZyA9PT0gJ2hvc3QnO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhR1YgPSB0di52YWlUcm8gPT09ICdnaWFvX3ZpZW4nO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhQ29Ib3N0ID0gdHYudmFpVHJvUGhvbmcgPT09ICdjb2hvc3QnO1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50Vm9pY2UgPSBncmFudHMuc29tZShnID0+IGcua2hvYVRWID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZvaWNlJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JhbnRWaWRlbyA9IGdyYW50cy5zb21lKGcgPT4gZy5raG9hVFYgPT09IHR2Lmtob2EgJiYgZy5jYXBhYmlsaXR5ID09PSAndmlkZW9fY29udHJvbCcpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAga2V5PXt0di5raG9hIHx8IHR2LnRlbiB8fCBpZHh9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjUgcC0yLjUgcm91bmRlZC14bCBiZy13aGl0ZS9bMC4wM10gaG92ZXI6Ymctd2hpdGUvWzAuMDZdIGJvcmRlciBib3JkZXItd2hpdGUvNSBob3Zlcjpib3JkZXItdGVhbC01MDAvMjUgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTggaC04IHJvdW5kZWQtZnVsbCBiZy1ncmFkaWVudC10by1iciBmcm9tLXRlYWwtNTAwLzIwIHRvLWVtZXJhbGQtNTAwLzIwIGJvcmRlciBib3JkZXItdGVhbC01MDAvMzAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC14cyBmb250LWJsYWNrIHRleHQtdGVhbC0zMDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7dHYuYXZhdGFyID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3R2LmF2YXRhcn0gYWx0PVwiXCIgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCByb3VuZGVkLWZ1bGwgb2JqZWN0LWNvdmVyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgKHR2LnRlbiB8fCAnPycpLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtMjAwIHRydW5jYXRlXCI+e3R2LnRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bGFIb3N0ICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0RcdURDNTEgSG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAge2xhR1YgJiYgIWxhSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERjkzIEdpXHUwMEUxbyB2aVx1MDBFQW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUNvSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyQjUwIENvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCBibG9jayB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3R2LmxvcFRlbiA/IGBMXHUxRURCcCAke3R2LmxvcFRlbn1gIDogKGxhR1YgPyAnR2lcdTAwRTFvIHZpXHUwMEVBbiB0clx1MDFCMFx1MUVERG5nJyA6ICdIXHUxRUNEYyBzaW5oJyl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICB7LyogTWVtYmVyIGFjdGlvbnMgblx1MUVCRnUgbFx1MDBFMCBob3N0L0dWICovfVxuICAgICAgICAgICAgICAgICAgICB7KHZhaVRyb1Bob25nID09PSAnaG9zdCcgfHwgYXV0aC51c2VyPy5pc1RlYWNoZXIpICYmICFsYUhvc3QgJiYgdHYua2hvYSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdzZXRfY29faG9zdCcsIHsga2hvYVRWOiB0di5raG9hLCBvbjogIWxhQ29Ib3N0IH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17bGFDb0hvc3QgPyAnVGh1IHF1eVx1MUVDMW4gY28taG9zdCcgOiAnQ1x1MUVBNXAgY28taG9zdCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYUNvSG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyLXZpb2xldC01MDAvNDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogIWdyYW50Vm9pY2UgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gbWljXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy02IGgtNiByb3VuZGVkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYW50Vm9pY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcdUZFMEZcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndmlkZW9fY29udHJvbCcsIG9uOiAhZ3JhbnRWaWRlbyB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDXHUxRUE1cC90aHUgcXV5XHUxRUMxbiB2aWRlb1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNiBoLTYgcm91bmRlZCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LVsxMHB4XSBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFudFZpZGVvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ibHVlLTUwMC8yMCB0ZXh0LWJsdWUtMzAwIGJvcmRlci1ibHVlLTUwMC80MCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERkE1XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlybShgS2ljayAke3R2LnRlbn0ga2hcdTFFQ0ZpIHBoXHUwMEYybmc/YCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2tpY2snLCB7IGtob2FUVjogdHYua2hvYSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkICYmICFkLm9rKSBhbGVydChkLmxvaSB8fCAnS2hcdTAwRjRuZyBraWNrIFx1MDExMVx1MDFCMFx1MUVFM2MuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIktpY2sga2hcdTFFQ0ZpIHBoXHUwMEYybmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTYgaC02IHJvdW5kZWQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTBweF0gYm9yZGVyIGJnLXJvc2UtNTAwLzEwIHRleHQtcm9zZS0zMDAgYm9yZGVyLXJvc2UtNTAwLzI1IGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9KX1cblxuICAgICAgICAgICAgICB7dGhhbmhWaWVuLmxlbmd0aCA9PT0gMCAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS04IHRleHQtc2xhdGUtNTAwIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgIENoXHUwMUIwYSBjXHUwMEYzIHRoXHUwMEUwbmggdmlcdTAwRUFuIG5cdTAwRTBvIHRyb25nIHBoXHUwMEYybmcuXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuXG5cbiAgICAgICAgey8qIFRBQiA2OiBRVVx1MUVBMk4gVFJcdTFFQ0EgUEhcdTAwRDJORyAoc3RhZmYgb25seSkgXHUyMDE0IHBvbGljeSBtYXRyaXggKyBtZW1iZXIgYWN0aW9ucyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdxdWFuLXRyaScgJiYgaXNTdGFmZiAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMyBvdmVyZmxvdy15LWF1dG8gbWluLWgtMCBwci0xIGgtZnVsbFwiPlxuICAgICAgICAgICAgey8qIFF1aWNrIGFjdGlvbnMgdGhlbyBtXHUwMEY0IGhcdTAwRUNuaCBcdTAxMTFcdTAwRTMgY2hcdTFFRDF0ICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBmbGV4LXdyYXBcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2FwIG9mIFsnbm90ZXMnLCAnd2hpdGVib2FyZCcsICdzaGVldCddKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6ICdzdGFmZl9vbmx5JyB9KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRleHQtWzExcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgIFx1RDgzRFx1REQxMiBLaFx1MDBGM2EgY1x1MUVEOW5nIHRcdTAwRTFjIChjaFx1MUVDOSB4ZW0pXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjYXAgb2YgWydub3RlcycsICd3aGl0ZWJvYXJkJywgJ3NoZWV0J10pIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdwb2xpY3knLCB7IGNhcGFiaWxpdHk6IGNhcCwgZW5hYmxlZDogMSwgYWNjZXNzTW9kZTogJ2V2ZXJ5b25lJyB9KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQteGwgYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQtWzExcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgIFx1RDgzRFx1REQxMyBNXHUxRURGIGNcdTFFRDluZyB0XHUwMEUxYyBjaG8gbVx1MUVDRGkgbmdcdTAxQjBcdTFFRERpXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBQb2xpY3kgbWF0cml4ICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtM1wiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHRleHQtc2xhdGUtNDAwIG1iLTJcIj5DaFx1MDBFRG5oIHNcdTAwRTFjaCBjXHUwMEY0bmcgY1x1MUVFNTwvcD5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNVwiPlxuICAgICAgICAgICAgICAgIHtbXG4gICAgICAgICAgICAgICAgICBbJ3ZpZGVvX2NvbnRyb2wnLCAnXHUwMTEwaVx1MUVDMXUga2hpXHUxRUMzbiBwaFx1MDBFMXQgKHBsYXkvcGF1c2UvdHVhKSddLFxuICAgICAgICAgICAgICAgICAgWyd2aWRlb19jaGFuZ2UnLCAnXHUwMTEwXHUxRUQ1aSB2aWRlbyBcdTAxMTFhbmcgcGhcdTAwRTF0J10sXG4gICAgICAgICAgICAgICAgICBbJ3F1ZXVlJywgJ0hcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHZpZGVvJ10sXG4gICAgICAgICAgICAgICAgICBbJ2NoYXQnLCAnQ2hhdCBwaFx1MDBGMm5nJ10sXG4gICAgICAgICAgICAgICAgICBbJ3doaXRlYm9hcmQnLCAnQlx1MUVBM25nIHZcdTFFQkQnXSxcbiAgICAgICAgICAgICAgICAgIFsndm9pY2UnLCAnVm9pY2UgMS0xJ10sXG4gICAgICAgICAgICAgICAgICBbJ2ludml0ZScsICdNXHUxRUREaSBuZ1x1MDFCMFx1MUVERGkgdlx1MDBFMG8gcGhcdTAwRjJuZyddLFxuICAgICAgICAgICAgICAgIF0ubWFwKChbY2FwLCBuaGFuXSkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgcG9sID0gcG9saWNpZXM/LltjYXBdIHx8IHsgZW5hYmxlZDogMSwgYWNjZXNzX21vZGU6ICdzdGFmZl9vbmx5JyB9O1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e2NhcH0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14c1wiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZsZXgtMSB0ZXh0LXNsYXRlLTMwMCB0cnVuY2F0ZVwiPntuaGFufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IHBvbC5lbmFibGVkID8gMCA6IDEsIGFjY2Vzc01vZGU6IHBvbC5hY2Nlc3NfbW9kZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtwb2wuZW5hYmxlZCA/ICdcdTAxMTBhbmcgYlx1MUVBRHQgXHUyMDE0IGJcdTFFQTVtIFx1MDExMVx1MUVDMyB0XHUxRUFGdCcgOiAnXHUwMTEwYW5nIHRcdTFFQUZ0IFx1MjAxNCBiXHUxRUE1bSBcdTAxMTFcdTFFQzMgYlx1MUVBRHQnfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy04IGgtNC41IHB4LTAuNSByb3VuZGVkLWZ1bGwgYm9yZGVyIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyICR7cG9sLmVuYWJsZWQgPyAnYmctZW1lcmFsZC01MDAvMzAgYm9yZGVyLWVtZXJhbGQtNTAwLzQwIGp1c3RpZnktZW5kJyA6ICdiZy13aGl0ZS81IGJvcmRlci13aGl0ZS8xNSBqdXN0aWZ5LXN0YXJ0J31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHctMyBoLTMgcm91bmRlZC1mdWxsICR7cG9sLmVuYWJsZWQgPyAnYmctZW1lcmFsZC00MDAnIDogJ2JnLXNsYXRlLTUwMCd9YH0+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtwb2wuYWNjZXNzX21vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXBvbC5lbmFibGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gaGFuaERvbmdQaG9uZz8uKCdwb2xpY3knLCB7IGNhcGFiaWxpdHk6IGNhcCwgZW5hYmxlZDogMSwgYWNjZXNzTW9kZTogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIHB4LTEuNSBweS0xIHRleHQtWzEwcHhdIHRleHQtc2xhdGUtMjAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwIGRpc2FibGVkOm9wYWNpdHktNDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJzdGFmZl9vbmx5XCI+UXVcdTFFQTNuIHRyXHUxRUNCPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwic2VsZWN0ZWRfbWVtYmVyc1wiPk1cdTFFRDl0IHNcdTFFRDEgbmdcdTAxQjBcdTFFRERpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiZXZlcnlvbmVcIj5NXHUxRUNEaSBuZ1x1MDFCMFx1MUVERGk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyBvcGFjaXR5LTYwXCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmbGV4LTEgdGV4dC1zbGF0ZS00MDBcIj5LaVx1MUVDM20gZHV5XHUxRUM3dCAoa2ljay94b1x1MDBFMSB0aW4pPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSBmb250LWJvbGQgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgcm91bmRlZCBweC0xLjUgcHktMC41XCI+TFVcdTAwRDROIFFVXHUxRUEyTiBUUlx1MUVDQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFF1XHUxRUEzbiBsXHUwMEZEIHRoXHUwMEUwbmggdmlcdTAwRUFuICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtM1wiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHRleHQtc2xhdGUtNDAwIG1iLTJcIj5UaFx1MDBFMG5oIHZpXHUwMEVBbiAmIHF1eVx1MUVDMW4gcmlcdTAwRUFuZzwvcD5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNVwiPlxuICAgICAgICAgICAgICAgIHsodGhhbmhWaWVuIHx8IFtdKS5tYXAodHYgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgbGFIb3N0ID0gQm9vbGVhbih0di5sYUNodVBob25nKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhR1YgPSB0di52YWlUcm8gPT09ICdnaWFvX3ZpZW4nO1xuICAgICAgICAgICAgICAgICAgY29uc3QgbGFDb0hvc3QgPSB0di52YWlUcm9QaG9uZyA9PT0gJ2NvX2hvc3QnO1xuICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbnRWb2ljZSA9IChncmFudHMgfHwgW10pLnNvbWUoZyA9PiBnLmtob2EgPT09IHR2Lmtob2EgJiYgZy5jYXBhYmlsaXR5ID09PSAndm9pY2UnICYmIGcudHJhbmdUaGFpID09PSAnZ3JhbnRlZCcpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbnRWaWRlbyA9IChncmFudHMgfHwgW10pLnNvbWUoZyA9PiBnLmtob2EgPT09IHR2Lmtob2EgJiYgZy5jYXBhYmlsaXR5ID09PSAndmlkZW9fY29udHJvbCcgJiYgZy50cmFuZ1RoYWkgPT09ICdncmFudGVkJyk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17dHYua2hvYSB8fCB0di50ZW59IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgdGV4dC14cyBmbGV4LXdyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTIwMCBmb250LXNlbWlib2xkIHRydW5jYXRlIG1heC13LVsxMTBweF1cIj57dHYudGVufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICB7bGFIb3N0ICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1hbWJlci00MDAgZm9udC1ib2xkXCI+XHUyNjA1IGhvc3Q8L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgIHtsYUdWICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1bIzAwRjJGRV0gZm9udC1ib2xkXCI+R1Y8L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgIHtsYUNvSG9zdCAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtdmlvbGV0LTMwMCBmb250LWJvbGRcIj5jby1ob3N0PC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7IWxhSG9zdCAmJiAhbGFHViAmJiB0di5raG9hICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1sLWF1dG8gZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgeyh2YWlUcm9QaG9uZyA9PT0gJ2hvc3QnIHx8IGF1dGgudXNlcj8uaXNUZWFjaGVyKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ3NldF9jb19ob3N0JywgeyBraG9hVFY6IHR2Lmtob2EsIG9uOiAhbGFDb0hvc3QgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17bGFDb0hvc3QgPyAnVGh1IHF1eVx1MUVDMW4gY28taG9zdCcgOiAnQ1x1MUVBNXAgY28taG9zdCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyICR7bGFDb0hvc3QgPyAnYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyLXZpb2xldC01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY28taG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogIWdyYW50Vm9pY2UgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDXHUxRUE1cC90aHUgcXV5XHUxRUMxbiB2b2ljZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2dyYW50Vm9pY2UgPyAnYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlci1hbWJlci01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzQ1x1REY5OVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZpZGVvX2NvbnRyb2wnLCBvbjogIWdyYW50VmlkZW8gfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDXHUxRUE1cC90aHUgcXV5XHUxRUMxbiBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIHZpZGVvXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyICR7Z3JhbnRWaWRlbyA/ICdiZy1jeWFuLTUwMC8yMCB0ZXh0LWN5YW4tMzAwIGJvcmRlci1jeWFuLTUwMC80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4geyBpZiAoY29uZmlybShgS2ljayAke3R2LnRlbn0ga2hcdTFFQ0ZpIHBoXHUwMEYybmc/YCkpIHsgY29uc3QgZCA9IGF3YWl0IGhhbmhEb25nUGhvbmc/Ligna2ljaycsIHsga2hvYVRWOiB0di5raG9hIH0pOyBpZiAoZCAmJiAhZC5vaykgYWxlcnQoZC5sb2kgfHwgJ0toXHUwMEY0bmcga2ljayBcdTAxMTFcdTAxQjBcdTFFRTNjLicpOyB9IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJLaWNrIGtoXHUxRUNGaSBwaFx1MDBGMm5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyIGJnLXJvc2UtNTAwLzEwIHRleHQtcm9zZS0zMDAgYm9yZGVyLXJvc2UtNTAwLzI1IGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2lja1xuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgeyh0aGFuaFZpZW4gfHwgW10pLmxlbmd0aCA9PT0gMCAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMFwiPkNoXHUwMUIwYSBjXHUwMEYzIHRoXHUwMEUwbmggdmlcdTAwRUFuLjwvcD59XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBcdTAxMTBcdTFFRDVpL2JcdTFFQ0YgbVx1MUVBRHQga2hcdTFFQTl1IFx1MjAxNCBjaFx1MUVDOSBob3N0L0dWICovfVxuICAgICAgICAgICAgeyh2YWlUcm9QaG9uZyA9PT0gJ2hvc3QnIHx8IGF1dGgudXNlcj8uaXNUZWFjaGVyKSAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTMgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIk1cdTFFQUR0IGtoXHUxRUE5dSBtXHUxRURCaSAoXHUwMTExXHUxRUMzIHRyXHUxRUQxbmcgPSBiXHUxRUNGIG1cdTFFQUR0IGtoXHUxRUE5dSlcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1waG9uZy1tYXQta2hhdS1tb2lcIlxuICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXsxMDB9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0yLjUgcHktMS41IHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTBcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucHV0LXBob25nLW1hdC1raGF1LW1vaScpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtayA9IGVsPy52YWx1ZSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IG1rLnRyaW0oKVxuICAgICAgICAgICAgICAgICAgICAgID8gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdkb2lfbWF0X2toYXUnLCB7IG1hdEtoYXVNb2k6IG1rLnRyaW0oKSB9KVxuICAgICAgICAgICAgICAgICAgICAgIDogYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdib19tYXRfa2hhdScsIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGQgJiYgIWQub2spIGFsZXJ0KGQubG9pIHx8ICdLaFx1MDBGNG5nIFx1MDExMVx1MUVENWkgXHUwMTExXHUwMUIwXHUxRUUzYyBtXHUxRUFEdCBraFx1MUVBOXUuJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbCkgZWwudmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLWxnIGJnLWFtYmVyLTUwMC8xNSB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctYW1iZXItNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICBcdTAxMTBcdTFFRDVpIC8gQlx1MUVDRlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIENhbXB1c1dhdGNoVG9nZXRoZXIoe1xuICBwaG9uZyxcbiAgcGhvbmdNaW5oS2hvYSxcbiAgYXV0aCxcbiAgZG9uZ1Bob25nSGllblRhaTogX2RvbmdQaG9uZ0hpZW5UYWksXG4gIHNvTmd1b2k6IF9zb05ndW9pLFxuICBteUNhcHMsXG4gIHZpZGVvVGltZVJlZixcbiAgaXNSb29tV2lkZSxcbiAgbGF5b3V0UmF0aW8gPSAnNjo0JyxcbiAgaGFuaERvbmdQaG9uZzogX2hhbmhEb25nUGhvbmcsXG4gIGlzU3RhZmYgPSBmYWxzZSxcbn0pIHtcbiAgY29uc3QgW3dhdGNoU3RhdGUsIHNldFdhdGNoU3RhdGVdID0gdXNlU3RhdGUoe1xuICAgIHBsYXlpbmc6IGZhbHNlLFxuICAgIHBvc2l0aW9uU2Vjb25kczogMCxcbiAgICBiYXNlUG9zaXRpb25TZWNvbmRzOiAwLFxuICAgIHBsYXliYWNrUmF0ZTogMS4wLFxuICAgIHJldmlzaW9uOiAxLFxuICAgIHVwZGF0ZWRBdDogJycsXG4gICAgc2VydmVyTm93OiAnJyxcbiAgICB1cGRhdGVkQnk6ICcnXG4gIH0pO1xuICBjb25zdCBbY2FuQ29udHJvbCwgc2V0Q2FuQ29udHJvbF0gPSB1c2VTdGF0ZShCb29sZWFuKFxuICAgIGF1dGg/LnVzZXI/LmlzVGVhY2hlciB8fCBwaG9uZz8uY2FuQ29udHJvbCB8fCBwaG9uZz8ubGFDaHVQaG9uZyB8fCBteUNhcHM/LnZpZGVvX2NvbnRyb2wgfHwgbXlDYXBzPy52aWRlb19jaGFuZ2UgfHwgaXNTdGFmZlxuICApKTtcbiAgY29uc3QgW193YXRjaENhcHMsIHNldFdhdGNoQ2Fwc10gPSB1c2VTdGF0ZSh7fSk7XG4gIGNvbnN0IGdldEluaXRpYWxWaWRlb1VybCA9ICgpID0+IHtcbiAgICBsZXQgYyA9IHt9O1xuICAgIHRyeSB7IGMgPSBwaG9uZz8uY2F1SGluaCA/IEpTT04ucGFyc2UocGhvbmcuY2F1SGluaCkgOiB7fTsgfSBjYXRjaCB7IH1cbiAgICByZXR1cm4gYy52aWRlb1VybCB8fCBwaG9uZz8udmlkZW9VcmwgfHwgJyc7XG4gIH07XG5cbiAgY29uc3QgZ2V0SW5pdGlhbFByb3ZpZGVyID0gKHUpID0+IHtcbiAgICBpZiAoIXUpIHJldHVybiAnVU5TVVBQT1JURUQnO1xuICAgIGlmIChpZFlvdXR1YmUodSkpIHJldHVybiAnWU9VVFVCRSc7XG4gICAgaWYgKGlkR29vZ2xlRHJpdmUodSkpIHJldHVybiAnR09PR0xFX0RSSVZFJztcbiAgICBpZiAobGFWaWRlb1RydWNUaWVwRmUodSkpIHJldHVybiAnTkFUSVZFX0hUTUw1JztcbiAgICByZXR1cm4gJ1VOU1VQUE9SVEVEJztcbiAgfTtcblxuICBjb25zdCBpbml0VXJsID0gZ2V0SW5pdGlhbFZpZGVvVXJsKCk7XG4gIGNvbnN0IFthY3RpdmVWaWRlb1VybCwgc2V0QWN0aXZlVmlkZW9VcmxdID0gdXNlU3RhdGUoaW5pdFVybCk7XG4gIGNvbnN0IFtwcm92aWRlciwgc2V0UHJvdmlkZXJdID0gdXNlU3RhdGUoKCkgPT4gZ2V0SW5pdGlhbFByb3ZpZGVyKGluaXRVcmwpKTtcbiAgY29uc3QgW2hhc0ludGVyYWN0ZWQsIHNldEhhc0ludGVyYWN0ZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9jYWxUaW1lLCBzZXRMb2NhbFRpbWVdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtkdXJhdGlvbiwgc2V0RHVyYXRpb25dID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtkYW5nR3VpTGVuaCwgc2V0RGFuZ0d1aUxlbmhdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9pLCBzZXRMb2ldID0gdXNlU3RhdGUoJycpO1xuXG4gIC8vIENoXHUxRUJGIFx1MDExMVx1MUVEOSB4ZW0gdHJcdTFFRjFjIHRpXHUxRUJGcCBjXHUwMEY5bmcgY2hcdTFFRTcgcGhcdTAwRjJuZyBoYXkgdFx1MUVBMW0gZFx1MUVFQm5nL3hlbSByaVx1MDBFQW5nIGNcdTFFRTdhIG5nXHUwMUIwXHUxRUREaSB0aGFtIGdpYVxuICBjb25zdCBbaXNMaXZlV2l0aEhvc3QsIHNldElzTGl2ZVdpdGhIb3N0XSA9IHVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBpc0xpdmVXaXRoSG9zdFJlZiA9IHVzZVJlZih0cnVlKTtcbiAgY29uc3QgW3ZpZXdlcklzUGF1c2VkLCBzZXRWaWV3ZXJJc1BhdXNlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IGlzUHJvZ3JhbW1hdGljQWN0aW9uUmVmID0gdXNlUmVmKGZhbHNlKTtcblxuICAvLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ1x1MUVBNFUgSFx1MDBDQ05IIFZJREVPLCBUXHUwMENDTSBLSVx1MUVCRU0gWU9VVFVCRSAmIEhcdTAwQzBORyBcdTAxMTBcdTFFRTJJIFRcdTFFQTBJIFZcdTAwRDlORyAxIFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCBbbWVkaWFUYWIsIHNldE1lZGlhVGFiXSA9IHVzZVN0YXRlKCdzZWFyY2gnKTsgLy8gJ3NlYXJjaCcgfCAncXVldWUnXG4gIGNvbnN0IFt2aWRlb01vaSwgc2V0VmlkZW9Nb2ldID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbZGFuZ0RvaVZpZGVvLCBzZXREYW5nRG9pVmlkZW9dID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9pVmlkZW8sIHNldExvaVZpZGVvXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3Rob25nQmFvVmlkZW8sIHNldFRob25nQmFvVmlkZW9dID0gdXNlU3RhdGUoJycpO1xuXG4gIC8vIFlvdVR1YmUgU2VhcmNoIFN0YXRlXG4gIGNvbnN0IFt5dFF1ZXJ5LCBzZXRZdFF1ZXJ5XSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3l0UmVzdWx0cywgc2V0WXRSZXN1bHRzXSA9IHVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW3NlYXJjaGluZ1l0LCBzZXRTZWFyY2hpbmdZdF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzZWFyY2hMb2ksIHNldFNlYXJjaExvaV0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gUXVldWUgU3RhdGVcbiAgY29uc3QgW3F1ZXVlTGlzdCwgc2V0UXVldWVMaXN0XSA9IHVzZVN0YXRlKFtdKTtcbiAgY29uc3QgcXVldWVMaXN0UmVmID0gdXNlUmVmKHF1ZXVlTGlzdCk7XG4gIHF1ZXVlTGlzdFJlZi5jdXJyZW50ID0gcXVldWVMaXN0O1xuICBjb25zdCBbcXVldWVCdXN5LCBzZXRRdWV1ZUJ1c3ldID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbZGFNb1JvbmdTdHVkaW8sIHNldERhTW9Sb25nU3R1ZGlvXSA9IHVzZVN0YXRlKHRydWUpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nIHx8IGF1dGg/LnVzZXI/LmlzVGVhY2hlciB8fCBteUNhcHM/LnZpZGVvX2NvbnRyb2wgfHwgbXlDYXBzPy52aWRlb19jaGFuZ2UgfHwgaXNTdGFmZikge1xuICAgICAgc2V0Q2FuQ29udHJvbCh0cnVlKTtcbiAgICB9XG4gIH0sIFtwaG9uZz8uY2FuQ29udHJvbCwgcGhvbmc/LmxhQ2h1UGhvbmcsIGF1dGg/LnVzZXI/LmlzVGVhY2hlciwgbXlDYXBzLCBpc1N0YWZmXSk7XG5cbiAgLy8gVFx1MUVBM2kgZGFuaCBzXHUwMEUxY2ggaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdFx1MUVFQiBzZXJ2ZXJcbiAgY29uc3QgdGFpUXVldWUgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLXF1ZXVlP3Bob25nSWQ9JHtwaG9uZy5pZH0mYWN0aW9uPWxpc3RgKTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHNldFF1ZXVlTGlzdChkLnF1ZXVlIHx8IFtdKTtcbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICB0YWlRdWV1ZSgpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaSh0YWlRdWV1ZSksIDQwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgfSwgW3Bob25nLmlkXSk7XG5cbiAgLy8gXHUwMTEwXHUxRUQ1aSB2aWRlbyBcdTAxMTFhbmcgcGhcdTAwRTF0XG4gIGNvbnN0IGRvaVZpZGVvID0gYXN5bmMgKHVybCwgdGl0bGUpID0+IHtcbiAgICBjb25zdCB1ID0gU3RyaW5nKHVybCB8fCB2aWRlb01vaSB8fCB5dFF1ZXJ5IHx8ICcnKS50cmltKCk7XG4gICAgaWYgKCF1IHx8IGRhbmdEb2lWaWRlbykgcmV0dXJuO1xuICAgIHNldERhbmdEb2lWaWRlbyh0cnVlKTtcbiAgICBzZXRMb2lWaWRlbygnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXdhdGNoJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3NldF92aWRlbycsIHZpZGVvVXJsOiB1LCBhdXRvUGxheTogdHJ1ZSB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghZC5vaykge1xuICAgICAgICBzZXRMb2lWaWRlbyhkLmxvaSB8fCAnS2hcdTAwRjRuZyBcdTAxMTFcdTFFRDVpIFx1MDExMVx1MDFCMFx1MUVFM2MgdmlkZW8uJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRBY3RpdmVWaWRlb1VybCh1KTtcbiAgICAgICAgc2V0UHJvdmlkZXIoZ2V0SW5pdGlhbFByb3ZpZGVyKHUpKTtcbiAgICAgICAgc2V0VmlkZW9Nb2koJycpO1xuICAgICAgICBpZiAoZC5zdGF0ZSkge1xuICAgICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgICAgc2V0TG9jYWxUaW1lKDApO1xuICAgICAgICB9XG4gICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gMDtcbiAgICAgICAgc2V0RHVyYXRpb24oMCk7XG4gICAgICAgIGNvbnN0IG5ld1l0SWQgPSBpZFlvdXR1YmUodSk7XG4gICAgICAgIGlmIChuZXdZdElkICYmIHl0UGxheWVyUmVmLmN1cnJlbnQgJiYgeXRSZWFkeVJlZi5jdXJyZW50ICYmIHR5cGVvZiB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkKHsgdmlkZW9JZDogbmV3WXRJZCwgc3RhcnRTZWNvbmRzOiAwIH0pO1xuICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTtcbiAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgc2V0VGhvbmdCYW9WaWRlbyhgXHUwMTEwYW5nIHBoXHUwMEUxdDogJHt0aXRsZSB8fCB1fWApO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCA0MDAwKTtcbiAgICAgICAgdGFpUXVldWUoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaVZpZGVvKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RGFuZ0RvaVZpZGVvKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gVFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmVcbiAgY29uc3QgdGltS2llbVlvdVR1YmUgPSBhc3luYyAoZSwgdHVLaG9hKSA9PiB7XG4gICAgZT8ucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBxID0gU3RyaW5nKHR1S2hvYSB8fCB5dFF1ZXJ5IHx8ICcnKS50cmltKCk7XG4gICAgaWYgKCFxIHx8IHNlYXJjaGluZ1l0KSByZXR1cm47XG4gICAgaWYgKHR1S2hvYSkgc2V0WXRRdWVyeSh0dUtob2EpO1xuXG4gICAgLy8gTlx1MUVCRnUgbmdcdTAxQjBcdTFFRERpIGRcdTAwRjluZyBkXHUwMEUxbiBsaVx1MDBFQW4ga1x1MUVCRnQgdmlkZW8gWW91VHViZVxuICAgIGNvbnN0IGlkWXQgPSBpZFlvdXR1YmUocSk7XG4gICAgaWYgKGlkWXQpIHtcbiAgICAgIHNldFl0UmVzdWx0cyhbe1xuICAgICAgICB2aWRlb0lkOiBpZFl0LFxuICAgICAgICB0aXRsZTogJ1ZpZGVvIFlvdVR1YmUgKHRcdTFFRUIgbGlcdTAwRUFuIGtcdTFFQkZ0IFx1MDExMVx1MDBFMyBkXHUwMEUxbiknLFxuICAgICAgICBjaGFubmVsVGl0bGU6ICdZb3VUdWJlJyxcbiAgICAgICAgdGh1bWJuYWlsOiBgaHR0cHM6Ly9pLnl0aW1nLmNvbS92aS8ke2lkWXR9L2hxZGVmYXVsdC5qcGdgLFxuICAgICAgICBwdWJsaXNoZWRBdDogJ1RyXHUxRUYxYyB0aVx1MUVCRnAnXG4gICAgICB9XSk7XG4gICAgICBzZXRTZWFyY2hMb2koJycpO1xuICAgICAgc2V0TWVkaWFUYWIoJ3NlYXJjaCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldFNlYXJjaGluZ1l0KHRydWUpO1xuICAgIHNldFNlYXJjaExvaSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3lvdXR1YmUtc2VhcmNoP3E9JHtlbmNvZGVVUklDb21wb25lbnQocSl9YCk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIEFycmF5LmlzQXJyYXkoZC5pdGVtcykpIHtcbiAgICAgICAgaWYgKGQuaXRlbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgc2V0U2VhcmNoTG9pKCdLaFx1MDBGNG5nIHRcdTAwRUNtIHRoXHUxRUE1eSB2aWRlbyBuXHUwMEUwbyBwaFx1MDBGOSBoXHUxRUUzcCB2XHUxRURCaSB0XHUxRUVCIGtoXHUwMEYzYSBuXHUwMEUweS4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRZdFJlc3VsdHMoZC5pdGVtcyk7XG4gICAgICAgICAgc2V0TWVkaWFUYWIoJ3NlYXJjaCcpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRTZWFyY2hMb2koZC5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgdFx1MDBFQ20ga2lcdTFFQkZtIHZpZGVvIGxcdTAwRkFjIG5cdTAwRTB5LicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0U2VhcmNoTG9pKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBraGkgdFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmUuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFNlYXJjaGluZ1l0KGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdmlkZW9SZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IHl0UGxheWVyUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCB5dENvbnRhaW5lcklkID0gYHl0LXBsYXllci0ke3Bob25nLmlkfWA7XG4gIGNvbnN0IGlzU2Vla2luZ1JlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGhhc0ludGVyYWN0ZWRSZWYgPSB1c2VSZWYoZmFsc2UpO1xuICBjb25zdCBkdXJhdGlvblJlZiA9IHVzZVJlZigwKTtcbiAgY29uc3QgaGFzVHJpZ2dlcmVkU2tpcFJlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGlzU2tpcHBpbmdSZWYgPSB1c2VSZWYoZmFsc2UpO1xuXG4gIC8vIFRoYW8gdFx1MDBFMWMgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgKGVucXVldWUsIGFkZF9uZXh0LCBwbGF5X25vdywgc2tpcCwgcmVtb3ZlKVxuICBjb25zdCBoYW5oRG9uZ1F1ZXVlID0gYXN5bmMgKGFjdGlvbiwgZXh0cmEgPSB7fSkgPT4ge1xuICAgIGlmIChhY3Rpb24gPT09ICdza2lwJykge1xuICAgICAgaWYgKGlzU2tpcHBpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChxdWV1ZUJ1c3kpIHJldHVybjtcbiAgICAgIHNldFF1ZXVlQnVzeSh0cnVlKTtcbiAgICB9XG4gICAgc2V0TG9pVmlkZW8oJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1xdWV1ZScsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb24sIC4uLmV4dHJhIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSB7XG4gICAgICAgIHNldExvaVZpZGVvKGQubG9pIHx8ICdUaGFvIHRcdTAwRTFjIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHRoXHUxRUE1dCBiXHUxRUExaS4nKTtcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ3NraXAnKSB7XG4gICAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChhY3Rpb24gPT09ICdlbnF1ZXVlJykge1xuICAgICAgICAgIHNldFRob25nQmFvVmlkZW8oYFx1MDExMFx1MDBFMyB0aFx1MDBFQW0gdlx1MDBFMG8gY3VcdTFFRDFpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpOiAke2V4dHJhLnRpdGxlIHx8ICdWaWRlbyd9YCk7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUaG9uZ0Jhb1ZpZGVvKCcnKSwgMzUwMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAnYWRkX25leHQnKSB7XG4gICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbyhgXHUwMTEwXHUwMEUzIHRoXHUwMEVBbSBwaFx1MDBFMXQga1x1MUVCRiB0aVx1MUVCRnA6ICR7ZXh0cmEudGl0bGUgfHwgJ1ZpZGVvJ31gKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCAzNTAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdzdWdnZXN0Jykge1xuICAgICAgICAgIHNldFRob25nQmFvVmlkZW8oYFx1MDExMFx1MDBFMyBnXHUxRUVEaSBcdTAxMTFcdTFFQzEgeHVcdTFFQTV0IGNobyBjaFx1MUVFNyBwaFx1MDBGMm5nIGR1eVx1MUVDN3Q6ICR7ZXh0cmEudGl0bGUgfHwgJ1ZpZGVvJ31gKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCA0MDAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdhcHByb3ZlX3N1Z2dlc3Rpb24nKSB7XG4gICAgICAgICAgaWYgKGV4dHJhLnBsYXlOb3cgJiYgZC52aWRlb1VybCkge1xuICAgICAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IDA7XG4gICAgICAgICAgICBzZXREdXJhdGlvbigwKTtcbiAgICAgICAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKGQudmlkZW9VcmwpO1xuICAgICAgICAgICAgc2V0UHJvdmlkZXIoZ2V0SW5pdGlhbFByb3ZpZGVyKGQudmlkZW9VcmwpKTtcbiAgICAgICAgICAgIGlmIChkLnN0YXRlKSB7XG4gICAgICAgICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgICAgICAgIHNldExvY2FsVGltZSgwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG5ld1l0SWQgPSBpZFlvdXR1YmUoZC52aWRlb1VybCk7XG4gICAgICAgICAgICBpZiAobmV3WXRJZCAmJiB5dFBsYXllclJlZi5jdXJyZW50ICYmIHl0UmVhZHlSZWYuY3VycmVudCAmJiB0eXBlb2YgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkKHsgdmlkZW9JZDogbmV3WXRJZCwgc3RhcnRTZWNvbmRzOiAwIH0pO1xuICAgICAgICAgICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7XG4gICAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldFRob25nQmFvVmlkZW8oJ1x1MDExMFx1MDBFMyBkdXlcdTFFQzd0IHZcdTAwRTAgcGhcdTAwRTF0IHZpZGVvIG5nYXkgbFx1MUVBRHAgdFx1MUVFOWMhJyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCAzNTAwKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbygnXHUwMTEwXHUwMEUzIGR1eVx1MUVDN3QgdmlkZW8gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2khJyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCAzNTAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAncmVqZWN0X3N1Z2dlc3Rpb24nKSB7XG4gICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbygnXHUwMTEwXHUwMEUzIGhcdTFFRTd5L3RcdTFFRUIgY2hcdTFFRDFpIHZpZGVvIFx1MDExMVx1MUVDMSB4dVx1MUVBNXQuJyk7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUaG9uZ0Jhb1ZpZGVvKCcnKSwgMzUwMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAncGxheV9ub3cnIHx8IGFjdGlvbiA9PT0gJ3NraXAnKSB7XG4gICAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgaWYgKGQudmlkZW9VcmwpIHtcbiAgICAgICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSAwO1xuICAgICAgICAgICAgc2V0RHVyYXRpb24oMCk7XG4gICAgICAgICAgICBzZXRBY3RpdmVWaWRlb1VybChkLnZpZGVvVXJsKTtcbiAgICAgICAgICAgIHNldFByb3ZpZGVyKGdldEluaXRpYWxQcm92aWRlcihkLnZpZGVvVXJsKSk7XG4gICAgICAgICAgICBpZiAoZC5zdGF0ZSkge1xuICAgICAgICAgICAgICBzZXRXYXRjaFN0YXRlKGQuc3RhdGUpO1xuICAgICAgICAgICAgICBzZXRMb2NhbFRpbWUoMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBuZXdZdElkID0gaWRZb3V0dWJlKGQudmlkZW9VcmwpO1xuICAgICAgICAgICAgaWYgKG5ld1l0SWQgJiYgeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFJlYWR5UmVmLmN1cnJlbnQgJiYgdHlwZW9mIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCh7IHZpZGVvSWQ6IG5ld1l0SWQsIHN0YXJ0U2Vjb25kczogMCB9KTtcbiAgICAgICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpO1xuICAgICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZXRUaG9uZ0Jhb1ZpZGVvKCdcdTAxMTBhbmcgY2h1eVx1MUVDM24gdmlkZW8gdGlcdTFFQkZwIHRoZW8uLi4nKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VGhvbmdCYW9WaWRlbygnJyksIDMwMDApO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZC5lbXB0eSkge1xuICAgICAgICAgICAgLy8gSFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgaFx1MUVCRnQgdmlkZW86IFRVWVx1MUVDNlQgXHUwMTEwXHUxRUQwSSBLSFx1MDBENE5HIFhcdTAwRDNBIERVUkFUSU9OXG4gICAgICAgICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBmaW5hbER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb24gfHwgbG9jYWxUaW1lO1xuICAgICAgICAgICAgaWYgKGZpbmFsRHVyID4gMCkgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IoZmluYWxEdXIpKTtcbiAgICAgICAgICAgIGlmIChkLnN0YXRlKSB7XG4gICAgICAgICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzZXRXYXRjaFN0YXRlKHByZXYgPT4gKHsgLi4ucHJldiwgcGxheWluZzogZmFsc2UsIHBvc2l0aW9uU2Vjb25kczogZmluYWxEdXIgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbygnSFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgXHUwMTExXHUwMEUzIGhcdTFFQkZ0IHZpZGVvLicpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUaG9uZ0Jhb1ZpZGVvKCcnKSwgMzAwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRhaVF1ZXVlKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRMb2lWaWRlbygnTVx1MUVBNXQga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgICBpZiAoYWN0aW9uID09PSAnc2tpcCcpIHtcbiAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBpZiAoYWN0aW9uICE9PSAnc2tpcCcpIHtcbiAgICAgICAgc2V0UXVldWVCdXN5KGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gWFx1MUVFRCBsXHUwMEZEIGtoaSB2aWRlbyBrXHUxRUJGdCB0aFx1MDBGQWMgKEVuZGVkIGhvXHUxRUI3YyBjaFx1MUVBMW0gZHVyYXRpb24gY3VcdTFFRDFpKVxuICBjb25zdCBoYW5kbGVWaWRlb0VuZGVkID0gKCkgPT4ge1xuICAgIC8vIDEuIE5cdTFFQkZ1IGNcdTAwRjMgdmlkZW8gdGlcdTFFQkZwIHRoZW8gdHJvbmcgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgLT4gVFx1MUVGMSBcdTAxMTFcdTFFRDluZyBjaHV5XHUxRUMzbiBiXHUwMEUwaVxuICAgIGNvbnN0IGhhc05leHRJblF1ZXVlID0gcXVldWVMaXN0UmVmLmN1cnJlbnQgJiYgcXVldWVMaXN0UmVmLmN1cnJlbnQubGVuZ3RoID4gMDtcbiAgICBpZiAoY2FuQ29udHJvbCAmJiBoYXNOZXh0SW5RdWV1ZSkge1xuICAgICAgaWYgKCFpc1NraXBwaW5nUmVmLmN1cnJlbnQgJiYgIWhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCkge1xuICAgICAgICBjb25zb2xlLmxvZygnVmlkZW8ga1x1MUVCRnQgdGhcdTAwRkFjIC0+IHRcdTFFRjEgXHUwMTExXHUxRUQ5bmcgY2h1eVx1MUVDM24gdGlcdTFFQkZwIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpJyk7XG4gICAgICAgIGhhbmhEb25nUXVldWUoJ3NraXAnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyAyLiBLaFx1MDBGNG5nIGNcdTAwRjJuIHZpZGVvIHRyb25nIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIC0+IERcdTFFRUFORyBQSFx1MDBDMVQgVlx1MDBDMCBLSFx1MDBEM0EgVFx1MUVBMEkgXHUwMTEwSVx1MUVDMk0gQ1VcdTFFRDBJIFZJREVPXG4gICAgY29uc29sZS5sb2coJ1ZpZGVvIGtcdTFFQkZ0IHRoXHUwMEZBYyAtPiBUXHUxRUExbSBkXHUxRUVCbmcgcGhcdTAwRTF0IHZpZGVvIHRcdTFFQTFpIFx1MDExMWlcdTFFQzNtIGN1XHUxRUQxaSBjaG8gdG9cdTAwRTBuIGJcdTFFRDkgcGhcdTAwRjJuZycpO1xuICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IHRydWU7XG4gICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgY29uc3QgZmluYWxEdXIgPSBkdXJhdGlvblJlZi5jdXJyZW50IHx8IGR1cmF0aW9uIHx8IGxvY2FsVGltZTtcbiAgICBpZiAoZmluYWxEdXIgPiAwKSB7XG4gICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihmaW5hbER1cikpO1xuICAgIH1cblxuICAgIC8vIERcdTFFRUJuZyBwbGF5ZXIgWW91VHViZS9IVE1MNSBjXHUxRUU1YyBiXHUxRUQ5XG4gICAgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wYXVzZVZpZGVvKSB7XG4gICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICB9XG4gICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGF1c2VWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIHRyeSB7IHZpZGVvUmVmLmN1cnJlbnQucGF1c2UoKTsgfSBjYXRjaCB7fVxuICAgIH1cblxuICAgIGlmIChjYW5Db250cm9sKSB7XG4gICAgICAvLyBDaFx1MUVFNyBwaFx1MDBGMm5nOiBMdVx1MDBGNG4gZ1x1MUVFRGkgbFx1MUVDN25oIHBhdXNlIHRcdTFFQTFpIGZpbmFsRHVyIGxcdTAwRUFuIG1cdTAwRTF5IGNoXHUxRUU3XG4gICAgICAvLyBCXHUxRUNGIHF1YSBcdTAxMTFpXHUxRUMxdSBraVx1MUVDN24gd2F0Y2hTdGF0ZS5wbGF5aW5nIFx1MDExMVx1MUVDMyBcdTAxMTFcdTFFQTNtIGJcdTFFQTNvIHZcdTFFQ0IgdHJcdTAwRUQgbFx1MDFCMHUgdHJcdTAwRUFuIHNlcnZlciBsdVx1MDBGNG4gbFx1MDBFMCBnaVx1MDBFMnkga1x1MUVCRnQgdGhcdTAwRkFjXG4gICAgICBjb25zdCB0YXJnZXRQb3MgPSBmaW5hbER1ciA+IDAgPyBOdW1iZXIoZmluYWxEdXIudG9GaXhlZCgyKSkgOiB1bmRlZmluZWQ7XG4gICAgICBndWlMZW5oUmVmLmN1cnJlbnQ/LigncGF1c2UnLCB0YXJnZXRQb3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBOZ1x1MDFCMFx1MUVERGkgdGhhbSBnaWE6IFx1MDExMFx1MDBFMW5oIGRcdTFFQTV1IFx1MDExMVx1MDBFMyBkXHUxRUVCbmcsIGtoXHUwMEY0bmcgdFx1MUVGMSBjaFx1MUVBMXkgdGlcdTFFQkZwIG5cdTFFQkZ1IGtoXHUwMEY0bmcgY1x1MDBGMyBsXHUxRUM3bmggYlx1MUVBRHQgbFx1MUVBMWlcbiAgICAgIHNldFZpZXdlcklzUGF1c2VkKHRydWUpO1xuICAgIH1cbiAgfTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBjID0ge307XG4gICAgdHJ5IHsgYyA9IHBob25nPy5jYXVIaW5oID8gSlNPTi5wYXJzZShwaG9uZy5jYXVIaW5oKSA6IHt9OyB9IGNhdGNoIHsgfVxuICAgIGNvbnN0IG5leHRVcmwgPSBjLnZpZGVvVXJsIHx8IHBob25nPy52aWRlb1VybCB8fCAnJztcbiAgICBpZiAobmV4dFVybCAmJiBuZXh0VXJsICE9PSBhY3RpdmVWaWRlb1VybCkge1xuICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSAwO1xuICAgICAgc2V0RHVyYXRpb24oMCk7XG4gICAgICBzZXRBY3RpdmVWaWRlb1VybChuZXh0VXJsKTtcbiAgICAgIHNldFByb3ZpZGVyKGdldEluaXRpYWxQcm92aWRlcihuZXh0VXJsKSk7XG4gICAgICBpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgIHNldElzTGl2ZVdpdGhIb3N0KHRydWUpO1xuICAgICAgc2V0Vmlld2VySXNQYXVzZWQoZmFsc2UpO1xuICAgIH1cbiAgfSwgW3Bob25nPy5jYXVIaW5oLCBwaG9uZz8udmlkZW9VcmxdKTtcblxuICBjb25zdCB2aWRlb1VybCA9IGFjdGl2ZVZpZGVvVXJsO1xuICBjb25zdCB5dElkID0gdmlkZW9VcmwgPyBpZFlvdXR1YmUodmlkZW9VcmwpIDogbnVsbDtcbiAgY29uc3QgZHJ2SWQgPSB2aWRlb1VybCA/IGlkR29vZ2xlRHJpdmUodmlkZW9VcmwpIDogbnVsbDtcbiAgY29uc3QgdHJ1Y1RpZXBVcmwgPSB2aWRlb1VybCAmJiAheXRJZCAmJiAhZHJ2SWQgJiYgbGFWaWRlb1RydWNUaWVwRmUodmlkZW9VcmwpID8gdXJsTWVkaWFGZSh2aWRlb1VybCkgOiAnJztcblxuICBjb25zdCBbX3l0UGxheWVyUmVhZHksIHNldFl0UGxheWVyUmVhZHldID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCB5dFJlYWR5UmVmID0gdXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgY3VycmVudFl0SWRSZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IGhhc1NlZWtlZEluaXRSZWYgPSB1c2VSZWYoZmFsc2UpO1xuICBjb25zdCBsYXN0SG9zdFN5bmNUaW1lUmVmID0gdXNlUmVmKDApO1xuICBjb25zdCBsYXN0QXBwbGllZFJldmlzaW9uUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBsYXN0SG9zdFRyYWNrVGltZVJlZiA9IHVzZVJlZih7IHRpbWU6IDAsIHN0YW1wOiBEYXRlLm5vdygpIH0pO1xuICBjb25zdCBsYXN0R29MaXZlQ2xpY2tUaW1lUmVmID0gdXNlUmVmKDApO1xuXG4gIGNvbnN0IHdhdGNoU3RhdGVSZWYgPSB1c2VSZWYod2F0Y2hTdGF0ZSk7XG4gIHdhdGNoU3RhdGVSZWYuY3VycmVudCA9IHdhdGNoU3RhdGU7XG4gIGNvbnN0IGRhbmdHdWlMZW5oUmVmID0gdXNlUmVmKGRhbmdHdWlMZW5oKTtcbiAgZGFuZ0d1aUxlbmhSZWYuY3VycmVudCA9IGRhbmdHdWlMZW5oO1xuICBjb25zdCBndWlMZW5oUmVmID0gdXNlUmVmKG51bGwpO1xuXG4gIC8vIFRcdTAwRURuaCB2XHUxRUNCIHRyXHUwMEVEIHRoXHUxRUREaSBnaWFuIHRyXHUxRUYxYyB0aVx1MUVCRnAgaGlcdTFFQzduIHRcdTFFQTFpIGNcdTFFRTdhIGNoXHUxRUU3IHBoXHUwMEYybmcgKGdpXHUxRURCaSBoXHUxRUExbiBraFx1MDBGNG5nIHZcdTAxQjBcdTFFRTN0IHF1XHUwMEUxIFx1MDExMVx1MUVEOSBkXHUwMEUwaSB2aWRlbylcbiAgLy8gU1x1MUVFRCBkXHUxRUU1bmcgX3JlY2VpdmVkQXQgXHUwMTExXHUxRUMzIGxvXHUxRUExaSBiXHUxRUNGIGhvXHUwMEUwbiB0b1x1MDBFMG4gY2xvY2sgc2tldyBnaVx1MUVFRmEgbVx1MDBFMXkgY2hcdTFFRTcgdlx1MDBFMCB0clx1MDBFQ25oIGR1eVx1MUVDN3RcbiAgY29uc3QgZ2V0SG9zdEN1cnJlbnRQb3MgPSAoKSA9PiB7XG4gICAgY29uc3Qgc3QgPSB3YXRjaFN0YXRlUmVmLmN1cnJlbnQgfHwgd2F0Y2hTdGF0ZTtcbiAgICBjb25zdCBlbGFwc2VkU2VjID0gc3Q/LnBsYXlpbmcgJiYgc3Q/Ll9yZWNlaXZlZEF0XG4gICAgICA/IE1hdGgubWF4KDAsIChEYXRlLm5vdygpIC0gc3QuX3JlY2VpdmVkQXQpIC8gMTAwMClcbiAgICAgIDogMDtcbiAgICBsZXQgdGFyZ2V0UG9zID0gTnVtYmVyKHN0Py5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgaWYgKHN0Py5wbGF5aW5nKSB7XG4gICAgICB0YXJnZXRQb3MgKz0gZWxhcHNlZFNlYyAqIChzdD8ucGxheWJhY2tSYXRlIHx8IDEuMCk7XG4gICAgfVxuICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgaWYgKG1heER1ciA+IDApIHtcbiAgICAgIC8vIE5cdTFFQkZ1IG1cdTAwRTF5IGNoXHUxRUU3IFx1MDExMWFuZyBwYXVzZSB2XHUwMEUwIHZcdTFFQ0IgdHJcdTAwRUQgXHUxRURGIHNcdTAwRTF0IGN1XHUxRUQxaSB2aWRlbyAoY1x1MDBGMm4gPCAyLjVzKSAtPiBjb2kgbmhcdTAxQjAgdmlkZW8gXHUwMTExXHUwMEUzIGhcdTFFQkZ0XG4gICAgICBpZiAoIXN0Py5wbGF5aW5nICYmIHRhcmdldFBvcyA+PSBtYXhEdXIgLSAyLjUpIHtcbiAgICAgICAgdGFyZ2V0UG9zID0gbWF4RHVyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGFyZ2V0UG9zID0gTWF0aC5taW4odGFyZ2V0UG9zLCBtYXhEdXIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gTWF0aC5tYXgoMCwgTnVtYmVyKHRhcmdldFBvcy50b0ZpeGVkKDIpKSk7XG4gIH07XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFRcdTFFQTZORyAxOiBMXHUxRUFGbmcgbmdoZSB0clx1MUVGMWMgdGlcdTFFQkZwIHRpbiBuaFx1MUVBRm4gcG9zdE1lc3NhZ2UgdFx1MUVFQiBZb3VUdWJlIElGcmFtZSBcdTI1MDBcdTI1MDBcbiAgLy8gWW91VHViZSBJRnJhbWUgbHVcdTAwRjRuIHBoXHUwMEUxdCBjXHUwMEUxYyBzXHUxRUYxIGtpXHUxRUM3biBvblN0YXRlQ2hhbmdlICYgaW5mb0RlbGl2ZXJ5IHJhIHBhcmVudCB3aW5kb3dcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBvbk1zZyA9IChlKSA9PiB7XG4gICAgICBsZXQgZGF0YSA9IGUuZGF0YTtcbiAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgaWYgKGRhdGEuaW5jbHVkZXMoJ2V2ZW50PScpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKGRhdGEpO1xuICAgICAgICAgICAgICBkYXRhID0ge1xuICAgICAgICAgICAgICAgIGV2ZW50OiBwYXJhbXMuZ2V0KCdldmVudCcpLFxuICAgICAgICAgICAgICAgIGluZm86IHBhcmFtcy5nZXQoJ2luZm8nKSA/IEpTT04ucGFyc2UocGFyYW1zLmdldCgnaW5mbycpKSA6IHBhcmFtcy5nZXQoJ2luZm8nKVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBjYXRjaCB7IHJldHVybjsgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWRhdGEgfHwgdHlwZW9mIGRhdGEgIT09ICdvYmplY3QnKSByZXR1cm47XG5cbiAgICAgIC8vIENcdTFFQURwIG5oXHUxRUFEdCBcdTAxMTFcdTFFRDkgZFx1MDBFMGkgdmlkZW8gdGhcdTFFRjFjIHRcdTFFQkYgKGR1cmF0aW9uKVxuICAgICAgY29uc3QgZCA9IE51bWJlcihkYXRhLmluZm8/LmR1cmF0aW9uIHx8IGRhdGEuZHVyYXRpb24gfHwgMCk7XG4gICAgICBpZiAoZCA+IDApIHtcbiAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IGQ7XG4gICAgICAgIHNldER1cmF0aW9uKHByZXYgPT4gKHByZXYgPiAwID8gcHJldiA6IGQpKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ1x1MUVBRHAgbmhcdTFFQUR0IHRoXHUxRUREaSBnaWFuIHRoXHUxRUYxYyB0XHUxRUJGIChrXHUxRUI5cCBraFx1MDBGNG5nIHZcdTAxQjBcdTFFRTN0IHF1XHUwMEUxIFx1MDExMVx1MUVEOSBkXHUwMEUwaSB2aWRlbylcbiAgICAgIGNvbnN0IGN1ciA9IE51bWJlcihkYXRhLmluZm8/LmN1cnJlbnRUaW1lKTtcbiAgICAgIGlmICghaXNOYU4oY3VyKSAmJiBjdXIgPj0gMCAmJiAhaXNTZWVraW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgICAgY29uc3QgY2xhbXBlZEN1ciA9IG1heER1ciA+IDAgPyBNYXRoLm1pbihjdXIsIG1heER1cikgOiBjdXI7XG4gICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKGNsYW1wZWRDdXIpKTtcbiAgICAgIH1cblxuICAgICAgLy8gXHUyNTAwXHUyNTAwIFZcdTAwRDlORyAyOiBcdTAxMTBcdTFFRDJORyBCXHUxRUQ4IFRIQU8gVFx1MDBDMUMgQ1x1MUVFNkEgQ0hcdTFFRTYgUEhcdTAwRDJORyBIT1x1MUVCNkMgQ0hcdTFFQkUgXHUwMTEwXHUxRUQ4IFhFTSBDXHUxRUU2QSBOR1x1MDFBRlx1MUVEQ0kgVEhBTSBHSUEgXHUyNTAwXHUyNTAwXG4gICAgICBjb25zdCBwU3RhdGUgPSBkYXRhLmV2ZW50ID09PSAnb25TdGF0ZUNoYW5nZSdcbiAgICAgICAgPyAodHlwZW9mIGRhdGEuaW5mbyA9PT0gJ251bWJlcicgPyBkYXRhLmluZm8gOiBkYXRhLmluZm8/LnBsYXllclN0YXRlKVxuICAgICAgICA6IChkYXRhLmV2ZW50ID09PSAnaW5mb0RlbGl2ZXJ5JyA/IGRhdGEuaW5mbz8ucGxheWVyU3RhdGUgOiB1bmRlZmluZWQpO1xuXG4gICAgICBpZiAoY2FuQ29udHJvbCAmJiAhZGFuZ0d1aUxlbmhSZWYuY3VycmVudCAmJiAhaXNTZWVraW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgLy8gMS4gQlx1MUVBRnQgUGxheSAvIFBhdXNlIHRyXHUxRUYxYyB0aVx1MUVCRnAgdFx1MUVFQiBtXHUwMEUwbiBoXHUwMEVDbmggdmlkZW8gWW91VHViZVxuICAgICAgICBjb25zdCBjdXJUaW1lID0gIWlzTmFOKGN1cikgJiYgY3VyID49IDAgPyBjdXIgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgaWYgKHBTdGF0ZSA9PT0gMSAmJiAhd2F0Y2hTdGF0ZVJlZi5jdXJyZW50LnBsYXlpbmcpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnVlx1MDBGOW5nIDI6IENoXHUxRUU3IHBoXHUwMEYybmcgYlx1MUVBNW0gUGxheSB0clx1MDBFQW4gWW91VHViZSAtPiBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGNcdTFFQTMgcGhcdTAwRjJuZycpO1xuICAgICAgICAgIGd1aUxlbmhSZWYuY3VycmVudD8uKCdwbGF5JywgY3VyVGltZSk7XG4gICAgICAgIH0gZWxzZSBpZiAocFN0YXRlID09PSAyICYmIHdhdGNoU3RhdGVSZWYuY3VycmVudC5wbGF5aW5nKSB7XG4gICAgICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgICAgICBpZiAobWF4RHVyID4gNSAmJiBjdXJUaW1lICE9PSB1bmRlZmluZWQgJiYgY3VyVGltZSA+PSBtYXhEdXIgLSAyLjUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdWaWRlbyBjaFx1MUVBMW0gbmdcdTAxQjBcdTFFRTFuZyBjdVx1MUVEMWkgLT4ga1x1MDBFRGNoIGhvXHUxRUExdCBoYW5kbGVWaWRlb0VuZGVkIHRoYXkgdlx1MDBFQyBwYXVzZSBsXHUxRUVEbmcgbFx1MDFBMScpO1xuICAgICAgICAgICAgaGFuZGxlVmlkZW9FbmRlZCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnVlx1MDBGOW5nIDI6IENoXHUxRUU3IHBoXHUwMEYybmcgYlx1MUVBNW0gUGF1c2UgdHJcdTAwRUFuIFlvdVR1YmUgLT4gXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBjXHUxRUEzIHBoXHUwMEYybmcnKTtcbiAgICAgICAgICAgIGd1aUxlbmhSZWYuY3VycmVudD8uKCdwYXVzZScsIGN1clRpbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDIuIEJcdTFFQUZ0IHRoYW8gdFx1MDBFMWMgdHVhIChTZWVrKSB0clx1MDBFQW4gdGhhbmggdGlcdTFFQkZuIHRyXHUwMEVDbmggXHUwMTExXHUxRUNGIFlvdVR1YmUgKDA6MjkgLyAyOjQxOjMyKVxuICAgICAgICBpZiAoIWlzTmFOKGN1cikgJiYgY3VyID49IDApIHtcbiAgICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICAgIGNvbnN0IHByZXYgPSBsYXN0SG9zdFRyYWNrVGltZVJlZi5jdXJyZW50O1xuICAgICAgICAgIGNvbnN0IGR0ID0gTWF0aC5tYXgoMCwgKG5vdyAtIHByZXYuc3RhbXApIC8gMTAwMCk7XG4gICAgICAgICAgY29uc3QgZXhwZWN0ZWQgPSB3YXRjaFN0YXRlUmVmLmN1cnJlbnQucGxheWluZyA/IChwcmV2LnRpbWUgKyBkdCkgOiBwcmV2LnRpbWU7XG4gICAgICAgICAgY29uc3QgZGVsdGEgPSBNYXRoLmFicyhjdXIgLSBleHBlY3RlZCk7XG5cbiAgICAgICAgICAvLyBOXHUxRUJGdSB0aFx1MUVERGkgZ2lhbiBuaFx1MUVBM3kgbFx1MUVDN2NoID4gMS44IGdpXHUwMEUyeSB0cm9uZyBraG9cdTFFQTNuZyB0aFx1MUVERGkgZ2lhbiBuZ1x1MUVBRm4gKGR0IDwgNHMpXG4gICAgICAgICAgLy8gY2hcdTFFRTluZyB0XHUxRUNGIGNoXHUxRUU3IHBoXHUwMEYybmcgdlx1MUVFQmEgY2xpY2sgaG9cdTFFQjdjIGtcdTAwRTlvIHRoYW5oIFx1MDExMVx1MUVDRiB0clx1MDBFQW4gdmlkZW8gWW91VHViZVxuICAgICAgICAgIGlmIChkdCA+IDAuMjUgJiYgZHQgPCA0LjAgJiYgZGVsdGEgPiAxLjgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBWXHUwMEY5bmcgMjogQ2hcdTFFRTcgcGhcdTAwRjJuZyB0dWEgdHJcdTAwRUFuIHRoYW5oIFx1MDExMVx1MUVDRiBZb3VUdWJlICgke2N1ci50b0ZpeGVkKDEpfXMsIGxcdTFFQzdjaCAke2RlbHRhLnRvRml4ZWQoMSl9cykgLT4gXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBjXHUxRUEzIHBoXHUwMEYybmdgKTtcbiAgICAgICAgICAgIGxhc3RIb3N0VHJhY2tUaW1lUmVmLmN1cnJlbnQgPSB7IHRpbWU6IGN1ciwgc3RhbXA6IG5vdyB9O1xuICAgICAgICAgICAgZ3VpTGVuaFJlZi5jdXJyZW50Py4oJ3NlZWsnLCBjdXIpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZHQgPj0gMC41KSB7XG4gICAgICAgICAgICBsYXN0SG9zdFRyYWNrVGltZVJlZi5jdXJyZW50ID0geyB0aW1lOiBjdXIsIHN0YW1wOiBub3cgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIWNhbkNvbnRyb2wgJiYgIWlzUHJvZ3JhbW1hdGljQWN0aW9uUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgLy8gTkdcdTAxQUZcdTFFRENJIFRIQU0gR0lBOiBDaFx1MUVDOSBjXHUxRUFEcCBuaFx1MUVBRHQgdHJcdTFFQTFuZyB0aFx1MDBFMWkgVUkga2hpIFx1MDExMWFuZyB4ZW0gcmlcdTAwRUFuZywga2hcdTAwRjRuZyB0XHUxRUYxIFx1MDExMVx1MUVEOW5nIGhcdTFFRTd5IFx1MDExMVx1MUVEM25nIGJcdTFFRDkgVHJcdTFFRjFjIHRpXHUxRUJGcCBkbyBidWZmZXJpbmdcbiAgICAgICAgaWYgKCFpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50ICYmIHBTdGF0ZSA9PT0gMikge1xuICAgICAgICAgIHNldFZpZXdlcklzUGF1c2VkKHRydWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHBTdGF0ZSA9PT0gMSkge1xuICAgICAgICAgIHNldFZpZXdlcklzUGF1c2VkKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBOaFx1MUVBRG4gZGlcdTFFQzduIHRyXHUxRUExbmcgdGhcdTAwRTFpIGtcdTFFQkZ0IHRoXHUwMEZBYyB2aWRlbzogMCA9IEVOREVEXG4gICAgICBjb25zdCBpc0VuZGVkID0gKGRhdGEuZXZlbnQgPT09ICdvblN0YXRlQ2hhbmdlJyAmJiAoZGF0YS5pbmZvID09PSAwIHx8IGRhdGEuaW5mbz8ucGxheWVyU3RhdGUgPT09IDApKSB8fFxuICAgICAgICAgICAgICAgICAgICAgIChkYXRhLmV2ZW50ID09PSAnaW5mb0RlbGl2ZXJ5JyAmJiBkYXRhLmluZm8/LnBsYXllclN0YXRlID09PSAwKSB8fFxuICAgICAgICAgICAgICAgICAgICAgIChkYXRhLmluZm8gJiYgZGF0YS5pbmZvLnBsYXllclN0YXRlID09PSAwKTtcblxuICAgICAgaWYgKGlzRW5kZWQpIHtcbiAgICAgICAgaGFuZGxlVmlkZW9FbmRlZCgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uTXNnKTtcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBvbk1zZyk7XG4gIH0sIFtjYW5Db250cm9sLCBwaG9uZy5pZF0pO1xuXG4gIC8vIEdcdTFFRURpIGxpc3RlbmluZyBoYW5kc2hha2UgXHUwMTExXHUxRUNCbmgga1x1MUVGMyB2XHUwMEUwbyBpZnJhbWUgWW91VHViZSBcdTAxMTFcdTFFQzMga1x1MDBFRGNoIGhvXHUxRUExdCBldmVudCBzdHJlYW1cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXl0SWQpIHJldHVybjtcbiAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICBpZiAoIWlmcikgcmV0dXJuO1xuICAgIGNvbnN0IHQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBpZnIuY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2xpc3RlbmluZycgfSksICcqJyk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfSwgMTUwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodCk7XG4gIH0sIFt5dElkLCBwaG9uZy5pZF0pO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBUXHUxRUE2TkcgMjogS2hcdTFFREZpIHRcdTFFQTFvIHZcdTAwRTAga1x1MUVCRnQgblx1MUVEMWkgWW91VHViZSBJRnJhbWUgUGxheWVyIEFQSSB0clx1MUVGMWMgdGlcdTFFQkZwIHZcdTAwRTBvIGlmcmFtZSBcdTI1MDBcdTI1MDBcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXl0SWQpIHJldHVybjtcbiAgICBsZXQgZGVzdHJveWVkID0gZmFsc2U7XG4gICAgbGV0IHJldHJ5VGltZXIgPSBudWxsO1xuICAgIGxldCBhdHRlbXB0cyA9IDA7XG5cbiAgICAvLyBOXHUxRUJGdSBwbGF5ZXIgXHUwMTExXHUwMEUzIHRcdTFFRDNuIHRcdTFFQTFpIHZcdTAwRTAgc1x1MUVCNW4gc1x1MDBFMG5nOiBjaHV5XHUxRUMzbiBiXHUwMEUwaSB0XHUxRUU5YyB0aFx1MDBFQyBxdWEgbG9hZFZpZGVvQnlJZCAoa2hcdTAwRjRuZyByZWxvYWQgRE9NL2lmcmFtZSlcbiAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFJlYWR5UmVmLmN1cnJlbnQgJiYgdHlwZW9mIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKGN1cnJlbnRZdElkUmVmLmN1cnJlbnQgIT09IHl0SWQpIHtcbiAgICAgICAgICBjdXJyZW50WXRJZFJlZi5jdXJyZW50ID0geXRJZDtcbiAgICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gMDtcbiAgICAgICAgICBzZXREdXJhdGlvbigwKTtcbiAgICAgICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICBjb25zdCBzdGFydFNlYyA9IE51bWJlcih3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQoe1xuICAgICAgICAgICAgdmlkZW9JZDogeXRJZCxcbiAgICAgICAgICAgIHN0YXJ0U2Vjb25kczogc3RhcnRTZWNcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignTFx1MUVEN2kgbG9hZFZpZGVvQnlJZDonLCBlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjdXJyZW50WXRJZFJlZi5jdXJyZW50ID0geXRJZDtcbiAgICBoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgPSBmYWxzZTtcblxuICAgIGNvbnN0IGtob2lUYW9QbGF5ZXIgPSAoKSA9PiB7XG4gICAgICBpZiAoZGVzdHJveWVkKSByZXR1cm47XG4gICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgaWYgKCFlbCkge1xuICAgICAgICBpZiAoYXR0ZW1wdHMrKyA8IDMwKSB7XG4gICAgICAgICAgcmV0cnlUaW1lciA9IHNldFRpbWVvdXQoa2hvaVRhb1BsYXllciwgMTAwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICghd2luZG93LllUIHx8ICF3aW5kb3cuWVQuUGxheWVyKSB7XG4gICAgICAgIGlmIChhdHRlbXB0cysrIDwgMzApIHtcbiAgICAgICAgICByZXRyeVRpbWVyID0gc2V0VGltZW91dChraG9pVGFvUGxheWVyLCAxNTApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudCA9IG5ldyB3aW5kb3cuWVQuUGxheWVyKGVsLCB7XG4gICAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICBvblJlYWR5OiAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGRlc3Ryb3llZCkgcmV0dXJuO1xuICAgICAgICAgICAgICB5dFJlYWR5UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICAgICAgICBzZXRZdFBsYXllclJlYWR5KHRydWUpO1xuXG4gICAgICAgICAgICAgIGlmIChldmVudC50YXJnZXQuZ2V0RHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gZXZlbnQudGFyZ2V0LmdldER1cmF0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKGQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gZDtcbiAgICAgICAgICAgICAgICAgIHNldER1cmF0aW9uKGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIFRcdTAwRURuaCB2XHUxRUNCIHRyXHUwMEVEIHRoXHUxRUREaSBnaWFuIGhpXHUxRUM3biB0XHUxRUExaSBjXHUxRUU3YSBwaFx1MDBGMm5nIFx1MDExMVx1MUVDMyBzZWVrIG5nYXkgbFx1MDBGQWMga2hcdTFFREZpIHRcdTFFQTFvXG4gICAgICAgICAgICAgIGNvbnN0IHRQb3MgPSBnZXRIb3N0Q3VycmVudFBvcygpO1xuXG4gICAgICAgICAgICAgIGlmICh0UG9zID4gMCAmJiBldmVudC50YXJnZXQuc2Vla1RvKSB7XG4gICAgICAgICAgICAgICAgaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0cnkgeyBldmVudC50YXJnZXQuc2Vla1RvKHRQb3MsIHRydWUpOyB9IGNhdGNoIHt9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nICYmIChjYW5Db250cm9sIHx8IGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCB8fCBoYXNJbnRlcmFjdGVkKSAmJiBldmVudC50YXJnZXQucGxheVZpZGVvKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHsgZXZlbnQudGFyZ2V0LnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblN0YXRlQ2hhbmdlOiAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldCAmJiBldmVudC50YXJnZXQuZ2V0RHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gZXZlbnQudGFyZ2V0LmdldER1cmF0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKGQgPiAwICYmIGR1cmF0aW9uUmVmLmN1cnJlbnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSBkO1xuICAgICAgICAgICAgICAgICAgc2V0RHVyYXRpb24oZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gVmlkZW8ga1x1MUVCRnQgdGhcdTAwRkFjOiBrXHUwMEVEY2ggaG9cdTFFQTF0IGNodXlcdTFFQzNuIGJcdTAwRTBpIGhvXHUxRUI3YyBkXHUxRUVCbmcgY1x1MUVBMyBwaFx1MDBGMm5nXG4gICAgICAgICAgICAgIGlmIChldmVudC5kYXRhID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlVmlkZW9FbmRlZCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmICFkYW5nR3VpTGVuaFJlZi5jdXJyZW50ICYmICFpc1NlZWtpbmdSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1clBvcyA9IHR5cGVvZiBldmVudC50YXJnZXQ/LmdldEN1cnJlbnRUaW1lID09PSAnZnVuY3Rpb24nID8gZXZlbnQudGFyZ2V0LmdldEN1cnJlbnRUaW1lKCkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGEgPT09IDEgJiYgIXdhdGNoU3RhdGVSZWYuY3VycmVudC5wbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnWVQgUGxheWVyIG9uU3RhdGVDaGFuZ2UgPT09IDEgLT4gXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBQbGF5IGNcdTFFQTMgcGhcdTAwRjJuZycpO1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaFJlZi5jdXJyZW50Py4oJ3BsYXknLCBjdXJQb3MpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuZGF0YSA9PT0gMiAmJiB3YXRjaFN0YXRlUmVmLmN1cnJlbnQucGxheWluZykge1xuICAgICAgICAgICAgICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgICAgICAgICAgICAgIGlmIChtYXhEdXIgPiA1ICYmIGN1clBvcyAhPT0gdW5kZWZpbmVkICYmIGN1clBvcyA+PSBtYXhEdXIgLSAyLjUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1lUIG9uU3RhdGVDaGFuZ2UgPT09IDIgY2hcdTFFQTFtIG5nXHUwMUIwXHUxRUUxbmcgY3VcdTFFRDFpIC0+IGtcdTAwRURjaCBob1x1MUVBMXQgaGFuZGxlVmlkZW9FbmRlZCcpO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVWaWRlb0VuZGVkKCk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnWVQgUGxheWVyIG9uU3RhdGVDaGFuZ2UgPT09IDIgLT4gXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBQYXVzZSBjXHUxRUEzIHBoXHUwMEYybmcnKTtcbiAgICAgICAgICAgICAgICAgICAgZ3VpTGVuaFJlZi5jdXJyZW50Py4oJ3BhdXNlJywgY3VyUG9zKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWNhbkNvbnRyb2wgJiYgIWlzUHJvZ3JhbW1hdGljQWN0aW9uUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgJiYgZXZlbnQuZGF0YSA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgc2V0Vmlld2VySXNQYXVzZWQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5kYXRhID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZChmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIFlvdVR1YmUgUGxheWVyIEFQSTonLCBlcnIpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBuYXBZb3VUdWJlSWZyYW1lQXBpKCgpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoa2hvaVRhb1BsYXllciwgMTAwKTtcbiAgICB9KTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBkZXN0cm95ZWQgPSB0cnVlO1xuICAgICAgaWYgKHJldHJ5VGltZXIpIGNsZWFyVGltZW91dChyZXRyeVRpbWVyKTtcbiAgICB9O1xuICB9LCBbeXRJZCwgcGhvbmcuaWQsIGNhbkNvbnRyb2xdKTtcblxuICAvLyBcdTAwQzFwIGRcdTFFRTVuZyB0clx1MUVBMW5nIHRoXHUwMEUxaSBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IHRcdTFFRUIgc2VydmVyIChjaFx1MUVEMW5nIGdpXHUxRUFEdCBjaFx1MUVBRHAgY2hcdTFFRERuIGNobyBjXHUxRUEzIEhvc3QgbFx1MUVBQm4gTmdcdTAxQjBcdTFFRERpIHhlbSlcbiAgY29uc3QgYXBEdW5nRG9uZ0JvID0gKHN0LCBjdHJsLCBwcm92KSA9PiB7XG4gICAgaWYgKCFzdCkgcmV0dXJuO1xuICAgIGNvbnN0IGVsYXBzZWRTZWMgPSBzdC5wbGF5aW5nICYmIHN0Ll9yZWNlaXZlZEF0XG4gICAgICA/IE1hdGgubWF4KDAsIChEYXRlLm5vdygpIC0gc3QuX3JlY2VpdmVkQXQpIC8gMTAwMClcbiAgICAgIDogMDtcblxuICAgIGxldCB0YXJnZXRQb3MgPSBOdW1iZXIoc3QucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICB0YXJnZXRQb3MgKz0gZWxhcHNlZFNlYyAqIChzdC5wbGF5YmFja1JhdGUgfHwgMS4wKTtcbiAgICB9XG4gICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICBpZiAobWF4RHVyID4gMCkge1xuICAgICAgaWYgKCFzdC5wbGF5aW5nICYmIHRhcmdldFBvcyA+PSBtYXhEdXIgLSAyLjUpIHtcbiAgICAgICAgdGFyZ2V0UG9zID0gbWF4RHVyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGFyZ2V0UG9zID0gTWF0aC5taW4odGFyZ2V0UG9zLCBtYXhEdXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBOR1VZXHUwMENBTiBUXHUxRUFFQyBWXHUwMEMwTkc6IENIXHUxRUU2IFBIXHUwMEQyTkcgTFx1MDBDMCBOR1VcdTFFRDJOIFBIXHUwMEMxVCAoU09VUkNFIE9GIFRSVVRIKSBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICAvLyBWaWRlbyBjXHUxRUU3YSBDaFx1MUVFNyBwaFx1MDBGMm5nIFx1MDExMWFuZyBwaFx1MDBFMXQgdFx1MUVGMSBuaGlcdTAwRUFuIG1cdTAxQjBcdTFFRTN0IG1cdTAwRTAgNjBmcHMgdHJcdTAwRUFuIFlvdVR1YmUuXG4gICAgLy8gVHV5XHUxRUM3dCBcdTAxMTFcdTFFRDFpIEtIXHUwMEQ0TkcgZ1x1MUVDRGkgc2Vla1RvIGhheSBcdTAwRTlwIHBsYXlWaWRlbyBsXHUwMEUwbSBnaVx1MUVBRHQgbFx1MDBGOWkva2hcdTFFRjFuZyBoXHUwMEVDbmggdmlkZW8gY1x1MUVFN2EgQ2hcdTFFRTcgcGhcdTAwRjJuZyFcbiAgICBpZiAoY3RybCkge1xuICAgICAgaWYgKGlzU2Vla2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICBpZiAocHJvdiA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LmdldEN1cnJlbnRUaW1lKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY3VyID0geXRQbGF5ZXJSZWYuY3VycmVudC5nZXRDdXJyZW50VGltZSgpO1xuICAgICAgICAgIGlmIChjdXIgPiAwICYmICFpc05hTihjdXIpKSBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjdXIpKTtcbiAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBcdTAxMTBcdTFFRDBJIFZcdTFFREFJIEhcdTFFQ0NDIFNJTkggLyBOR1x1MDFBRlx1MUVEQ0kgWEVNIFRST05HIFBIXHUwMEQyTkcgXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgLy8gTlx1MUVCRnUgbmdcdTAxQjBcdTFFRERpIHhlbSBcdTAxMTFhbmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSB4ZW0gcmlcdTAwRUFuZyAoIWlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQpOlxuICAgIC8vIFRVWVx1MUVDNlQgXHUwMTEwXHUxRUQwSSBLSFx1MDBENE5HIFx1MDBFOXAgc2Vla1RvIGhheSBwbGF5VmlkZW8gbFx1MDBFMG0gZ2lcdTAwRTFuIFx1MDExMW9cdTFFQTFuIHZpXHUxRUM3YyB4ZW0gY1x1MUVFN2EgbmdcdTAxQjBcdTFFRERpIHRoYW0gZ2lhIVxuICAgIGlmICghaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIE5cdTFFQkZ1IHZpZGVvIFx1MDExMVx1MDBFMyBjaFx1MUVBMW0gXHUwMTExXHUxRUJGbiBcdTAxMTFpXHUxRUMzbSBjdVx1MUVEMWkgKHRhcmdldFBvcyA+PSBtYXhEdXIpIHZcdTAwRTAgbWF4RHVyID4gMDpcbiAgICAvLyBOZ1x1MDFCMFx1MUVERGkgeGVtIHBoXHUxRUEzaSBkXHUxRUVCbmcgbFx1MUVBMWkgdFx1MUVBMWkgXHUwMTExaVx1MUVDM20gY3VcdTFFRDFpIFZcdTAwQzAgVFVBIFx1MDExMFx1MUVCRU4gSFx1MUVCRVQgVklERU8geSBjaGFuZyBjaFx1MUVFNyBwaFx1MDBGMm5nXG4gICAgaWYgKG1heER1ciA+IDAgJiYgdGFyZ2V0UG9zID49IG1heER1cikge1xuICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IobWF4RHVyKSk7XG4gICAgICBpZiAocHJvdiA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSBtYXhEdXI7XG4gICAgICAgICAgdmlkZW9SZWYuY3VycmVudC5wYXVzZSgpO1xuICAgICAgICB9IGNhdGNoIHt9XG4gICAgICB9IGVsc2UgaWYgKHByb3YgPT09ICdZT1VUVUJFJykge1xuICAgICAgICBjb25zdCBwID0geXRQbGF5ZXJSZWYuY3VycmVudDtcbiAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICAgIGlmIChwPy5zZWVrVG8pIHsgdHJ5IHsgcC5zZWVrVG8obWF4RHVyLCB0cnVlKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW21heER1ciwgdHJ1ZV0gfSksICcqJyk7XG4gICAgICAgIGlmIChwPy5wYXVzZVZpZGVvKSB7IHRyeSB7IHAucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwYXVzZVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICB9XG4gICAgICBzZXRWaWV3ZXJJc1BhdXNlZCh0cnVlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc05ld1JldmlzaW9uID0gbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ICE9PSBudWxsICYmIHN0LnJldmlzaW9uICE9PSBsYXN0QXBwbGllZFJldmlzaW9uUmVmLmN1cnJlbnQ7XG4gICAgaWYgKGxhc3RBcHBsaWVkUmV2aXNpb25SZWYuY3VycmVudCA9PT0gbnVsbCkge1xuICAgICAgbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ID0gc3QucmV2aXNpb247XG4gICAgfVxuXG4gICAgaWYgKHByb3YgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHYgPSB2aWRlb1JlZi5jdXJyZW50O1xuICAgICAgaWYgKCFoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgJiYgdGFyZ2V0UG9zID4gMCkge1xuICAgICAgICBoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICB2LmN1cnJlbnRUaW1lID0gdGFyZ2V0UG9zO1xuICAgICAgfVxuICAgICAgaWYgKGlzTmV3UmV2aXNpb24pIHtcbiAgICAgICAgbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ID0gc3QucmV2aXNpb247XG4gICAgICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICAgICAgdi5jdXJyZW50VGltZSA9IHRhcmdldFBvcztcbiAgICAgICAgICBpZiAoaGFzSW50ZXJhY3RlZCB8fCBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpIHYucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcih0YXJnZXRQb3MpKTtcbiAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZChmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdi5wYXVzZSgpO1xuICAgICAgICAgIHYuY3VycmVudFRpbWUgPSBOdW1iZXIoc3QucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKE51bWJlcihzdC5wb3NpdGlvblNlY29uZHMgfHwgMCkpKTtcbiAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZCh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHNldExvY2FsVGltZShNYXRoLm1heCgwLCBNYXRoLmZsb29yKHRhcmdldFBvcykpKTtcbiAgICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICAgIGNvbnN0IGRyaWZ0ID0gTWF0aC5hYnModi5jdXJyZW50VGltZSAtIHRhcmdldFBvcyk7XG4gICAgICAgIGlmIChkcmlmdCA+IDMuMCkge1xuICAgICAgICAgIHYuY3VycmVudFRpbWUgPSB0YXJnZXRQb3M7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHYucGF1c2VkICYmIChoYXNJbnRlcmFjdGVkIHx8IGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCkpIHtcbiAgICAgICAgICB2LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghdi5wYXVzZWQpIHYucGF1c2UoKTtcbiAgICAgICAgY29uc3QgZHJpZnQgPSBNYXRoLmFicyh2LmN1cnJlbnRUaW1lIC0gc3QucG9zaXRpb25TZWNvbmRzKTtcbiAgICAgICAgaWYgKGRyaWZ0ID4gMi4wKSB7XG4gICAgICAgICAgdi5jdXJyZW50VGltZSA9IHN0LnBvc2l0aW9uU2Vjb25kcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvdiA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgIGNvbnN0IHAgPSB5dFBsYXllclJlZi5jdXJyZW50O1xuICAgICAgbGV0IGN1ciA9IG51bGw7XG4gICAgICBsZXQgcHMgPSBudWxsO1xuICAgICAgaWYgKHAgJiYgdHlwZW9mIHAuZ2V0Q3VycmVudFRpbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdHJ5IHsgY3VyID0gcC5nZXRDdXJyZW50VGltZSgpOyB9IGNhdGNoIHt9XG4gICAgICB9XG4gICAgICBpZiAocCAmJiB0eXBlb2YgcC5nZXRQbGF5ZXJTdGF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0cnkgeyBwcyA9IHAuZ2V0UGxheWVyU3RhdGUoKTsgfSBjYXRjaCB7fVxuICAgICAgfVxuXG4gICAgICAvLyBJbml0aWFsIHNlZWsgblx1MUVCRnUgbmdcdTAxQjBcdTFFRERpIHhlbSBjaFx1MDFCMGEgdFx1MUVFQm5nIHR1YSBcdTAxMTFcdTFFQkZuIG1cdTFFRDFjIGNcdTFFRTdhIGNoXHUxRUU3IHBoXHUwMEYybmdcbiAgICAgIGlmICghaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ICYmIHRhcmdldFBvcyA+IDApIHtcbiAgICAgICAgaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgaWYgKHA/LnNlZWtUbykgeyB0cnkgeyBwLnNlZWtUbyh0YXJnZXRQb3MsIHRydWUpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbdGFyZ2V0UG9zLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgIH1cblxuICAgICAgLy8gS2hpIHBoXHUwMEUxdCBoaVx1MUVDN24gdGhhbyB0XHUwMEUxYyBtXHUxRURCaSB0XHUxRUVCIGNoXHUxRUU3IHBoXHUwMEYybmcgKFJldmlzaW9uIHRoYXkgXHUwMTExXHUxRUQ1aSBkbyBjaFx1MUVFNyBwaFx1MDBGMm5nIGJcdTFFQTVtIFZcdTAwRjluZyAxIGhvXHUxRUI3YyBWXHUwMEY5bmcgMilcbiAgICAgIGlmIChpc05ld1JldmlzaW9uKSB7XG4gICAgICAgIGxhc3RBcHBsaWVkUmV2aXNpb25SZWYuY3VycmVudCA9IHN0LnJldmlzaW9uO1xuICAgICAgICBpZiAoIXN0LnBsYXlpbmcpIHtcbiAgICAgICAgICAvLyBDaFx1MUVFNyBwaFx1MDBGMm5nIGJcdTFFQTVtIFRcdTFFQTFtIGRcdTFFRUJuZzogTFx1MUVBRHAgdFx1MUVFOWMgdFx1MUVBMW0gZFx1MUVFQm5nIHZcdTAwRTAgdHVhIHZcdTFFQzEgXHUwMTExXHUwMEZBbmcgdlx1MUVDQiB0clx1MDBFRCBjaFx1MUVFNyBwaFx1MDBGMm5nIFx1MDExMVx1MDBFMyBkXHUxRUVCbmdcbiAgICAgICAgICBpZiAocD8ucGF1c2VWaWRlbykgeyB0cnkgeyBwLnBhdXNlVmlkZW8oKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwYXVzZVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICAgICAgY29uc3QgcFNlYyA9IE51bWJlcihzdC5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgICAgICAgaWYgKHA/LnNlZWtUbykgeyB0cnkgeyBwLnNlZWtUbyhwU2VjLCB0cnVlKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbcFNlYywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IocFNlYykpO1xuICAgICAgICAgIHNldFZpZXdlcklzUGF1c2VkKHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENoXHUxRUU3IHBoXHUwMEYybmcgYlx1MUVBNW0gUGhcdTAwRTF0IHRpXHUxRUJGcCBob1x1MUVCN2Mgdlx1MUVFQmEgVHVhIHRoXHUxRUREaSBnaWFuOiBMXHUxRUFEcCB0XHUxRUU5YyB0dWEgdlx1MDBFMCBwaFx1MDBFMXQgeSBjaGFuZyBjaFx1MUVFNyBwaFx1MDBGMm5nXG4gICAgICAgICAgaWYgKHA/LnNlZWtUbykgeyB0cnkgeyBwLnNlZWtUbyh0YXJnZXRQb3MsIHRydWUpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFt0YXJnZXRQb3MsIHRydWVdIH0pLCAnKicpO1xuICAgICAgICAgIGlmIChoYXNJbnRlcmFjdGVkIHx8IGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgaWYgKHA/LnBsYXlWaWRlbykgeyB0cnkgeyBwLnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGxheVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKHRhcmdldFBvcykpO1xuICAgICAgICAgIHNldFZpZXdlcklzUGF1c2VkKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIEdpXHUxRUVGIG5oXHUxRUNCcCBwaFx1MDBFMXQgXHUxRUQ1biBcdTAxMTFcdTFFQ0JuaCB0cm9uZyBjXHUwMEUxYyBjaHUga1x1MUVGMyBwb2xsIFx1MDExMVx1MUVDQm5oIGtcdTFFRjNcbiAgICAgIHNldExvY2FsVGltZShNYXRoLm1heCgwLCBNYXRoLmZsb29yKHRhcmdldFBvcykpKTtcblxuICAgICAgaWYgKGN1ciAhPT0gbnVsbCAmJiAhaXNOYU4oY3VyKSkge1xuICAgICAgICBjb25zdCBkcmlmdCA9IE1hdGguYWJzKGN1ciAtIHRhcmdldFBvcyk7XG4gICAgICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICAgICAgLy8gQ2hcdTFFQzkgdHVhIGtoaSBcdTAxMTFcdTFFRDkgbFx1MUVDN2NoIHRoXHUxRUREaSBnaWFuID4gMi41cyBcdTAxMTFcdTFFQzMgZ2lcdTFFRUYgcGxheWJhY2sgbVx1MDFCMFx1MUVFM3QgbVx1MDBFMCwga2hcdTAwRjRuZyBtaWNyby1zZWVrXG4gICAgICAgICAgaWYgKGRyaWZ0ID4gMi41KSB7XG4gICAgICAgICAgICBpZiAocD8uc2Vla1RvKSB7IHRyeSB7IHAuc2Vla1RvKHRhcmdldFBvcywgdHJ1ZSk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbdGFyZ2V0UG9zLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKChwcyA9PT0gMiB8fCBwcyA9PT0gNSB8fCBwcyA9PT0gLTEpICYmIChoYXNJbnRlcmFjdGVkIHx8IGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCkpIHtcbiAgICAgICAgICAgIGlmIChwPy5wbGF5VmlkZW8pIHsgdHJ5IHsgcC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BsYXlWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBLaGkgc2VydmVyIGJcdTAwRTFvIHBhdXNlLCBsdVx1MDBGNG4gZ1x1MUVFRGkgcGF1c2Ugblx1MUVCRnUgcGxheWVyIFx1MDExMWFuZyBwaFx1MDBFMXRcbiAgICAgICAgICBpZiAocHMgPT09IDEgfHwgcHMgPT09IDMpIHtcbiAgICAgICAgICAgIGlmIChwPy5wYXVzZVZpZGVvKSB7IHRyeSB7IHAucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGF1c2VWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZHJpZnQgPiAxLjUpIHtcbiAgICAgICAgICAgIGlmIChwPy5zZWVrVG8pIHsgdHJ5IHsgcC5zZWVrVG8oc3QucG9zaXRpb25TZWNvbmRzLCB0cnVlKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFtzdC5wb3NpdGlvblNlY29uZHMsIHRydWVdIH0pLCAnKicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHN0LnBsYXlpbmcgJiYgKGhhc0ludGVyYWN0ZWQgfHwgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSAmJiBwcyAhPT0gMSkge1xuICAgICAgICAgIGlmIChwPy5wbGF5VmlkZW8pIHsgdHJ5IHsgcC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwbGF5VmlkZW8nLCBhcmdzOiBbXSB9KSwgJyonKTtcbiAgICAgICAgfSBlbHNlIGlmICghc3QucGxheWluZykge1xuICAgICAgICAgIGlmIChwPy5wYXVzZVZpZGVvKSB7IHRyeSB7IHAucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BhdXNlVmlkZW8nLCBhcmdzOiBbXSB9KSwgJyonKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBQb2xsIHRyXHUxRUExbmcgdGhcdTAwRTFpIG1cdTAwRTF5IGNoXHUxRUU3IG1cdTFFRDdpIDEuMnMgXHUwMTExXHUxRUMzIG5nXHUwMUIwXHUxRUREaSB0aGFtIGdpYSBiXHUxRUFGdCBrXHUxRUNCcCB0XHUxRUU5YyB0aFx1MDBFQyB0aGFvIHRcdTAwRTFjIGNcdTFFRTdhIGNoXHUxRUU3IHBoXHUwMEYybmdcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcbiAgICBjb25zdCBmZXRjaFdhdGNoID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctd2F0Y2g/cGhvbmdJZD0ke3Bob25nLmlkfWApO1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKCFhY3RpdmUpIHJldHVybjtcbiAgICAgICAgaWYgKGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICAgIGNvbnN0IHN0ID0geyAuLi5kLnN0YXRlLCBfcmVjZWl2ZWRBdDogRGF0ZS5ub3coKSB9O1xuICAgICAgICAgIHNldFdhdGNoU3RhdGUoc3QpO1xuICAgICAgICAgIHNldENhbkNvbnRyb2woQm9vbGVhbihkLmNhbkNvbnRyb2wpKTtcbiAgICAgICAgICBpZiAoZC5jYXBzKSBzZXRXYXRjaENhcHMoZC5jYXBzKTtcbiAgICAgICAgICBzZXRQcm92aWRlcihkLnByb3ZpZGVyIHx8ICdVTlNVUFBPUlRFRCcpO1xuICAgICAgICAgIGlmIChkLnBob25nPy52aWRlb1VybCAmJiBkLnBob25nLnZpZGVvVXJsICE9PSBhY3RpdmVWaWRlb1VybCkge1xuICAgICAgICAgICAgc2V0QWN0aXZlVmlkZW9VcmwoZC5waG9uZy52aWRlb1VybCk7XG4gICAgICAgICAgICBpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgIHNldElzTGl2ZVdpdGhIb3N0KHRydWUpO1xuICAgICAgICAgICAgc2V0Vmlld2VySXNQYXVzZWQoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhcER1bmdEb25nQm8oc3QsIEJvb2xlYW4oZC5jYW5Db250cm9sKSwgZC5wcm92aWRlciB8fCAnVU5TVVBQT1JURUQnKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7IH1cbiAgICB9O1xuXG4gICAgZmV0Y2hXYXRjaCgpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaShmZXRjaFdhdGNoKSwgMTIwMCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgfTtcbiAgfSwgW3Bob25nLmlkLCBoYXNJbnRlcmFjdGVkXSk7XG5cbiAgLy8gVFx1MUVGMSBcdTAxMTFcdTFFRDluZyB0XHUxRUExbSBkXHUxRUVCbmcgcGhcdTAwRjJuZyBraGkgY2hcdTFFRTcgcGhcdTAwRjJuZyBcdTAxMTFcdTAwRjNuZyB0YWIgdHJcdTAwRUNuaCBkdXlcdTFFQzd0XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qgb25VbmxvYWQgPSAoKSA9PiB7XG4gICAgICBpZiAoY2FuQ29udHJvbCAmJiB3YXRjaFN0YXRlUmVmLmN1cnJlbnQ/LnBsYXlpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBwYXlsb2FkID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICBhY3Rpb246ICdwYXVzZScsXG4gICAgICAgICAgICBwb3NpdGlvbjogbG9jYWxUaW1lLFxuICAgICAgICAgICAgZXhwZWN0ZWRSZXZpc2lvbjogd2F0Y2hTdGF0ZVJlZi5jdXJyZW50LnJldmlzaW9uLFxuICAgICAgICAgICAgcGxheWJhY2tSYXRlOiAxLjBcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBuYXZpZ2F0b3Iuc2VuZEJlYWNvbignL2FwaS9waG9uZy13YXRjaCcsIG5ldyBCbG9iKFtwYXlsb2FkXSwgeyB0eXBlOiAnYXBwbGljYXRpb24vanNvbicgfSkpO1xuICAgICAgICB9IGNhdGNoIHt9XG4gICAgICB9XG4gICAgfTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgb25VbmxvYWQpO1xuICAgIHJldHVybiAoKSA9PiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgb25VbmxvYWQpO1xuICB9LCBbY2FuQ29udHJvbCwgcGhvbmcuaWQsIGxvY2FsVGltZV0pO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBUXHUxRUE2TkcgMyAmIDQ6IFBvc2l0aW9uYWwgV2F0Y2hkb2cgJiBDXHUxRUFEcCBuaFx1MUVBRHQgbG9jYWxUaW1lIG1cdTAxQjBcdTFFRTN0IG1cdTAwRTAgXHUyNTAwXHUyNTAwXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgaXNQbGF5aW5nID0gY2FuQ29udHJvbCA/IHdhdGNoU3RhdGUucGxheWluZyA6IChpc0xpdmVXaXRoSG9zdCA/IHdhdGNoU3RhdGUucGxheWluZyA6ICF2aWV3ZXJJc1BhdXNlZCk7XG4gICAgaWYgKCFpc1BsYXlpbmcpIHJldHVybjtcbiAgICBjb25zdCB0aWNrID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKGlzU2Vla2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG5cbiAgICAgIGxldCBjdXJUaW1lID0gbnVsbDtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBwID0geXRQbGF5ZXJSZWYuY3VycmVudDtcbiAgICAgICAgICBpZiAocC5nZXREdXJhdGlvbikge1xuICAgICAgICAgICAgY29uc3QgZCA9IHAuZ2V0RHVyYXRpb24oKTtcbiAgICAgICAgICAgIGlmIChkID4gMCkge1xuICAgICAgICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gZDtcbiAgICAgICAgICAgICAgaWYgKGR1cmF0aW9uID09PSAwKSBzZXREdXJhdGlvbihkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHAuZ2V0Q3VycmVudFRpbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1ciA9IHAuZ2V0Q3VycmVudFRpbWUoKTtcbiAgICAgICAgICAgIGlmIChjdXIgIT09IHVuZGVmaW5lZCAmJiBjdXIgIT09IG51bGwgJiYgIWlzTmFOKGN1cikpIHtcbiAgICAgICAgICAgICAgY3VyVGltZSA9IGN1cjtcbiAgICAgICAgICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgICAgICAgICAgY29uc3QgY2xhbXBlZEN1ciA9IG1heER1ciA+IDAgPyBNYXRoLm1pbihjdXIsIG1heER1cikgOiBjdXI7XG4gICAgICAgICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKGNsYW1wZWRDdXIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHAuZ2V0UGxheWVyU3RhdGUgJiYgcC5nZXRQbGF5ZXJTdGF0ZSgpID09PSAwKSB7XG4gICAgICAgICAgICBoYW5kbGVWaWRlb0VuZGVkKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIHt9XG4gICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICAgIGNvbnN0IGN1ciA9IHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWU7XG4gICAgICAgIGlmICghaXNOYU4oY3VyKSkge1xuICAgICAgICAgIGN1clRpbWUgPSBjdXI7XG4gICAgICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgICAgICBjb25zdCBjbGFtcGVkQ3VyID0gbWF4RHVyID4gMCA/IE1hdGgubWluKGN1ciwgbWF4RHVyKSA6IGN1cjtcbiAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjbGFtcGVkQ3VyKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gR2lcdTAwRTFtIHNcdTAwRTF0IHZcdTFFQ0IgdHJcdTAwRUQ6IG5cdTFFQkZ1IHZpZGVvIFx1MDExMVx1MDBFMyBwaFx1MDBFMXQgXHUwMTExXHUxRUJGbiBnaVx1MDBFMnkgY3VcdTFFRDFpIGNcdTAwRjluZyBob1x1MUVCN2MgcXVcdTAwRTEgZHVyYXRpb25cbiAgICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgICBjb25zdCBjdXJyZW50UG9zID0gY3VyVGltZSAhPT0gbnVsbCA/IGN1clRpbWUgOiBsb2NhbFRpbWU7XG4gICAgICBpZiAobWF4RHVyID4gNSAmJiAoY3VycmVudFBvcyA+PSBtYXhEdXIgLSAxLjAgfHwgbG9jYWxUaW1lID49IG1heER1cikpIHtcbiAgICAgICAgaGFuZGxlVmlkZW9FbmRlZCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChjYW5Db250cm9sICYmIGN1clRpbWUgIT09IG51bGwgJiYgY3VyVGltZSA+IDAgJiYgIWRhbmdHdWlMZW5oUmVmLmN1cnJlbnQgJiYgIWlzU2Vla2luZ1JlZi5jdXJyZW50KSB7XG4gICAgICAgIGNvbnN0IG5vd01zID0gRGF0ZS5ub3coKTtcbiAgICAgICAgaWYgKCFsYXN0SG9zdFN5bmNUaW1lUmVmLmN1cnJlbnQpIGxhc3RIb3N0U3luY1RpbWVSZWYuY3VycmVudCA9IG5vd01zO1xuICAgICAgICAvLyBDaFx1MUVFNyBwaFx1MDBGMm5nIFx1MDExMVx1MUVDQm5oIGtcdTFFRjMgZ1x1MUVFRGkgbVx1MUVEMWMgdGhcdTFFRERpIGdpYW4gdGhcdTFFRjFjIHRcdTFFQkYgbFx1MDBFQW4gbVx1MDBFMXkgY2hcdTFFRTcgcXVhIHN5bmNfcG9zXG4gICAgICAgIC8vIFR1eVx1MUVDN3QgXHUwMTExXHUxRUQxaSBLSFx1MDBENE5HIGdcdTFFQ0RpIGd1aUxlbmgoJ3NlZWsnKSB2XHUwMEVDIHNlZWsgc1x1MUVCRCBcdTAwRTlwIHNlZWtUbyBsXHUwMEVBbiBob3N0IHBsYXllciB2XHUwMEUwIGJ1bXAgcmV2aXNpb24gbFx1MDBFMG0gZ2lcdTFFQUR0IHRcdTFFQTV0IGNcdTFFQTMgbmdcdTAxQjBcdTFFRERpIHhlbSFcbiAgICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZyAmJiAobm93TXMgLSBsYXN0SG9zdFN5bmNUaW1lUmVmLmN1cnJlbnQgPj0gNDAwMCkpIHtcbiAgICAgICAgICBsYXN0SG9zdFN5bmNUaW1lUmVmLmN1cnJlbnQgPSBub3dNcztcbiAgICAgICAgICBmZXRjaCgnL2FwaS9waG9uZy13YXRjaCcsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgICAgICBhY3Rpb246ICdzeW5jX3BvcycsXG4gICAgICAgICAgICAgIHBvc2l0aW9uOiBNYXRoLm1heCgwLCBOdW1iZXIoY3VyVGltZS50b0ZpeGVkKDIpKSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjdXJUaW1lID09PSBudWxsKSB7XG4gICAgICAgIHNldExvY2FsVGltZSh0ID0+IHtcbiAgICAgICAgICBpZiAobWF4RHVyID4gMCkge1xuICAgICAgICAgICAgaWYgKHQgPj0gbWF4RHVyKSByZXR1cm4gTWF0aC5mbG9vcihtYXhEdXIpO1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgubWluKHQgKyAxLCBNYXRoLmZsb29yKG1heER1cikpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdCArIDE7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sIDEwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpY2spO1xuICB9LCBbd2F0Y2hTdGF0ZS5wbGF5aW5nLCB2aWV3ZXJJc1BhdXNlZCwgaXNMaXZlV2l0aEhvc3QsIHByb3ZpZGVyLCBkdXJhdGlvbiwgbG9jYWxUaW1lLCBjYW5Db250cm9sXSk7XG5cbiAgY29uc3QgcGVuZGluZ0d1aUxlbmhSZWYgPSB1c2VSZWYobnVsbCk7XG5cbiAgLy8gR1x1MUVFRGkgbFx1MUVDN25oIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gKFBsYXkgLyBQYXVzZSAvIFNlZWspXG4gIGNvbnN0IGd1aUxlbmggPSBhc3luYyAoYWN0aW9uLCBjdXN0b21Qb3MpID0+IHtcbiAgICBpZiAoZGFuZ0d1aUxlbmhSZWYuY3VycmVudCkge1xuICAgICAgcGVuZGluZ0d1aUxlbmhSZWYuY3VycmVudCA9IHsgYWN0aW9uLCBjdXN0b21Qb3MgfTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2V0RGFuZ0d1aUxlbmgodHJ1ZSk7XG4gICAgZGFuZ0d1aUxlbmhSZWYuY3VycmVudCA9IHRydWU7XG4gICAgc2V0TG9pKCcnKTtcblxuICAgIGxldCBwb3MgPSBjdXN0b21Qb3M7XG4gICAgaWYgKHBvcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgcG9zID0gdmlkZW9SZWYuY3VycmVudC5jdXJyZW50VGltZTtcbiAgICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5nZXRDdXJyZW50VGltZSkge1xuICAgICAgICBwb3MgPSB5dFBsYXllclJlZi5jdXJyZW50LmdldEN1cnJlbnRUaW1lKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwb3MgPSBsb2NhbFRpbWU7XG4gICAgICB9XG4gICAgfVxuICAgIHBvcyA9IE1hdGgubWF4KDAsIE51bWJlcigocG9zIHx8IDApLnRvRml4ZWQoMikpKTtcblxuICAgIC8vIENcdTFFQURwIG5oXHUxRUFEdCBsXHUxRUExYyBxdWFuIHRyXHUwMEVBbiBsb2NhbCBwbGF5ZXJcbiAgICBpZiAoYWN0aW9uID09PSAncGxheScpIHtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkgdmlkZW9SZWYuY3VycmVudC5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8ucGxheVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BsYXlWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAncGF1c2UnKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQucGF1c2UoKTtcbiAgICAgIGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBhdXNlVmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBhdXNlVmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BhdXNlVmlkZW8nLCBhcmdzOiBbXSB9KSwgJyonKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ3NlZWsnKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSBwb3M7XG4gICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5zZWVrVG8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnNlZWtUbyhwb3MsIHRydWUpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3BvcywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRSZXYgPSB3YXRjaFN0YXRlUmVmLmN1cnJlbnQ/LnJldmlzaW9uIHx8IHdhdGNoU3RhdGUucmV2aXNpb24gfHwgMTtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXdhdGNoJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICBhY3Rpb24sXG4gICAgICAgICAgcG9zaXRpb246IHBvcyxcbiAgICAgICAgICBleHBlY3RlZFJldmlzaW9uOiBjdXJyZW50UmV2LFxuICAgICAgICAgIHBsYXliYWNrUmF0ZTogd2F0Y2hTdGF0ZVJlZi5jdXJyZW50Py5wbGF5YmFja1JhdGUgfHwgd2F0Y2hTdGF0ZS5wbGF5YmFja1JhdGUgfHwgMS4wXG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICBjb25zdCBzdCA9IHsgLi4uZC5zdGF0ZSwgX3JlY2VpdmVkQXQ6IERhdGUubm93KCkgfTtcbiAgICAgICAgbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ID0gZC5zdGF0ZS5yZXZpc2lvbjtcbiAgICAgICAgc2V0V2F0Y2hTdGF0ZShzdCk7XG4gICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKGQuc3RhdGUucG9zaXRpb25TZWNvbmRzIHx8IHBvcykpO1xuICAgICAgfSBlbHNlIGlmIChkLmNvbmZsaWN0ICYmIGQuc3RhdGUpIHtcbiAgICAgICAgY29uc3Qgc3QgPSB7IC4uLmQuc3RhdGUsIF9yZWNlaXZlZEF0OiBEYXRlLm5vdygpIH07XG4gICAgICAgIHNldFdhdGNoU3RhdGUoc3QpO1xuICAgICAgICBhcER1bmdEb25nQm8oc3QsIGNhbkNvbnRyb2wsIHByb3ZpZGVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldExvaShkLmxvaSB8fCAnTFx1MUVEN2kgY1x1MUVBRHAgbmhcdTFFQUR0IHBoXHUwMEUxdCB2aWRlby4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaSgnTVx1MUVBNXQga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldERhbmdHdWlMZW5oKGZhbHNlKTtcbiAgICAgIGRhbmdHdWlMZW5oUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGlmIChwZW5kaW5nR3VpTGVuaFJlZi5jdXJyZW50KSB7XG4gICAgICAgIGNvbnN0IG5leHQgPSBwZW5kaW5nR3VpTGVuaFJlZi5jdXJyZW50O1xuICAgICAgICBwZW5kaW5nR3VpTGVuaFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgZ3VpTGVuaChuZXh0LmFjdGlvbiwgbmV4dC5jdXN0b21Qb3MpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBndWlMZW5oUmVmLmN1cnJlbnQgPSBndWlMZW5oO1xuXG4gIC8vIFx1MDExMFx1MUVEM25nIGJcdTFFRDkgdlx1MUVDQiB0clx1MDBFRCB2aWRlbyBoaVx1MUVDN24gdFx1MUVBMWkgcmEgbmdvXHUwMEUwaSBcdTAxMTFcdTFFQzMgY2hhdCBnXHUxRUFGbiB0aW1lc3RhbXBcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAodmlkZW9UaW1lUmVmKSB2aWRlb1RpbWVSZWYuY3VycmVudCA9IGxvY2FsVGltZTtcbiAgfSwgW2xvY2FsVGltZSwgdmlkZW9UaW1lUmVmXSk7XG5cblxuXG4gIC8vIE5oXHUxRUFEbiB5XHUwMEVBdSBjXHUxRUE3dSB0dWEgdFx1MUVFQiBTdHVkeURvY2sgKGJcdTFFQTVtIG1cdTFFRDFjIHZpZGVvIHRyb25nIGNoYXQvZ2hpIGNoXHUwMEZBKS5cbiAgLy8gQ1x1MDBGMyBxdXlcdTFFQzFuIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gXHUyMTkyIHBoXHUwMEUxdCBsXHUxRUM3bmggc2VlayBjaHVuZzsga2hcdTAwRjRuZyBcdTIxOTIgY2hcdTFFQzkgdHVhIGNcdTFFRTVjIGJcdTFFRDkgcGxheWVyIGNcdTFFRTdhIG1cdTAwRUNuaC5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBvblNlZWtSZXEgPSAoZSkgPT4ge1xuICAgICAgaWYgKGUuZGV0YWlsPy5waG9uZ0lkICYmIFN0cmluZyhlLmRldGFpbC5waG9uZ0lkKSAhPT0gU3RyaW5nKHBob25nPy5pZCkpIHJldHVybjtcbiAgICAgIGNvbnN0IHNlYyA9IE1hdGgubWF4KDAsIE51bWJlcihlLmRldGFpbD8uc2VjKSB8fCAwKTtcblxuICAgICAgaWYgKCFoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgc2V0SGFzSW50ZXJhY3RlZCh0cnVlKTtcbiAgICAgIH1cblxuICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3Ioc2VjKSk7XG5cbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgICB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lID0gc2VjO1xuICAgICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5zZWVrVG8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnNlZWtUbyhzZWMsIHRydWUpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3NlYywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjYW5Db250cm9sKSB7XG4gICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBzZWMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICBzZXRJc0xpdmVXaXRoSG9zdChmYWxzZSk7XG4gICAgICB9XG4gICAgfTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc3Itc2VlaycsIG9uU2Vla1JlcSk7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdzci1zZWVrJywgb25TZWVrUmVxKTtcbiAgfSwgW3Bob25nPy5pZCwgY2FuQ29udHJvbCwgcHJvdmlkZXIsIHdhdGNoU3RhdGU/LnJldmlzaW9uXSk7XG5cbiAgY29uc3QgaGFuZGxlU3RhcnRWaWV3aW5nID0gKCkgPT4ge1xuICAgIGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgc2V0SGFzSW50ZXJhY3RlZCh0cnVlKTtcbiAgICBpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBzZXRJc0xpdmVXaXRoSG9zdCh0cnVlKTtcbiAgICBzZXRWaWV3ZXJJc1BhdXNlZChmYWxzZSk7XG5cbiAgICBjb25zdCB0YXJnZXRQb3MgPSBnZXRIb3N0Q3VycmVudFBvcygpO1xuICAgIGhhc1NlZWtlZEluaXRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IodGFyZ2V0UG9zKSk7XG5cbiAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHYgPSB2aWRlb1JlZi5jdXJyZW50O1xuICAgICAgaWYgKHRhcmdldFBvcyA+IDApIHYuY3VycmVudFRpbWUgPSB0YXJnZXRQb3M7XG4gICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICAgIHYucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHYucGF1c2UoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgaWYgKHRhcmdldFBvcyA+IDApIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnNlZWtUbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQuc2Vla1RvKHRhcmdldFBvcywgdHJ1ZSk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFt0YXJnZXRQb3MsIHRydWVdIH0pLCAnKicpO1xuICAgICAgfVxuICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8ucGxheVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGxheVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8ucGF1c2VWaWRlbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwYXVzZVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIE5nXHUwMUIwXHUxRUREaSB0aGFtIGdpYSBiXHUxRUE1bSBuXHUwMEZBdCBcIlRyXHUxRUYxYyB0aVx1MUVCRnBcIiBcdTAxMTFcdTFFQzMgbmhcdTFFQTN5IHZcdTFFQzEgdGltZWxpbmUgY1x1MUVFN2EgY2hcdTFFRTcgcGhcdTAwRjJuZ1xuICBjb25zdCBoYW5kbGVHb0xpdmUgPSAoKSA9PiB7XG4gICAgaWYgKCFoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpIHtcbiAgICAgIGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICBzZXRIYXNJbnRlcmFjdGVkKHRydWUpO1xuICAgIH1cbiAgICBpc1Byb2dyYW1tYXRpY0FjdGlvblJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBsYXN0R29MaXZlQ2xpY2tUaW1lUmVmLmN1cnJlbnQgPSBEYXRlLm5vdygpO1xuXG4gICAgbGV0IHRhcmdldFBvcyA9IGdldEhvc3RDdXJyZW50UG9zKCk7XG4gICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICBjb25zdCBpc1ZpZGVvRW5kZWQgPSBtYXhEdXIgPiAwICYmICh0YXJnZXRQb3MgPj0gbWF4RHVyIC0gMS41IHx8ICghd2F0Y2hTdGF0ZS5wbGF5aW5nICYmIHRhcmdldFBvcyA+PSBtYXhEdXIgLSAzLjApKTtcbiAgICBpZiAoaXNWaWRlb0VuZGVkKSB7XG4gICAgICB0YXJnZXRQb3MgPSBtYXhEdXI7XG4gICAgfSBlbHNlIGlmIChtYXhEdXIgPiAwICYmIHRhcmdldFBvcyA+IG1heER1cikge1xuICAgICAgdGFyZ2V0UG9zID0gbWF4RHVyO1xuICAgIH1cblxuICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKHRhcmdldFBvcykpO1xuICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHNldElzTGl2ZVdpdGhIb3N0KHRydWUpO1xuICAgIHNldFZpZXdlcklzUGF1c2VkKCF3YXRjaFN0YXRlLnBsYXlpbmcgfHwgaXNWaWRlb0VuZGVkKTtcbiAgICBsYXN0QXBwbGllZFJldmlzaW9uUmVmLmN1cnJlbnQgPSB3YXRjaFN0YXRlLnJldmlzaW9uO1xuXG4gICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lID0gdGFyZ2V0UG9zO1xuICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZyAmJiAhaXNWaWRlb0VuZGVkKSB7XG4gICAgICAgIHZpZGVvUmVmLmN1cnJlbnQucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpZGVvUmVmLmN1cnJlbnQucGF1c2UoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5zZWVrVG8pIHtcbiAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8odGFyZ2V0UG9zLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgfVxuICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFt0YXJnZXRQb3MsIHRydWVdIH0pLCAnKicpO1xuXG4gICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nICYmICFpc1ZpZGVvRW5kZWQpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBsYXlWaWRlbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BsYXlWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBhdXNlVmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBhdXNlVmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGF1c2VWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaXNQcm9ncmFtbWF0aWNBY3Rpb25SZWYuY3VycmVudCA9IGZhbHNlO1xuICAgIH0sIDM1MDApO1xuICB9O1xuXG4gIC8vIENoXHUxRUU3IHBoXHUwMEYybmcgYlx1MUVBNW0gUGhcdTAwRTF0IC8gVFx1MUVBMW0gZFx1MUVFQm5nIC8gUGhcdTAwRTF0IGxcdTFFQTFpXG4gIGNvbnN0IGhhbmRsZUhvc3RUb2dnbGVQbGF5ID0gKCkgPT4ge1xuICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgIGd1aUxlbmgoJ3BhdXNlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgaWYgKG1heER1ciA+IDAgJiYgbG9jYWxUaW1lID49IG1heER1ciAtIDEuNSkge1xuICAgICAgICAvLyBWaWRlbyBcdTAxMTFcdTAwRTMga1x1MUVCRnQgdGhcdTAwRkFjIC0+IEJcdTFFQTVtIHBoXHUwMEUxdCBsXHUxRUExaSB0XHUxRUVCIFx1MDExMVx1MUVBN3VcbiAgICAgICAgc2V0TG9jYWxUaW1lKDApO1xuICAgICAgICBndWlMZW5oKCdzZWVrJywgMCk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gZ3VpTGVuaCgncGxheScsIDApLCAxMDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ3VpTGVuaCgncGxheScpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBOZ1x1MDFCMFx1MUVERGkgdGhhbSBnaWEgdFx1MUVGMSBiXHUxRUE1bSBUXHUxRUExbSBkXHUxRUVCbmcgLyBUaVx1MUVCRnAgdFx1MUVFNWMgY1x1MUVFNWMgYlx1MUVEOVxuICBjb25zdCBoYW5kbGVWaWV3ZXJUb2dnbGVQbGF5ID0gKCkgPT4ge1xuICAgIGlmICghaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSB7XG4gICAgICBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgc2V0SGFzSW50ZXJhY3RlZCh0cnVlKTtcbiAgICB9XG4gICAgaWYgKHZpZXdlcklzUGF1c2VkKSB7XG4gICAgICAvLyBUaVx1MUVCRnAgdFx1MUVFNWMgcGhcdTAwRTF0XG4gICAgICBjb25zdCBtYXhEdXIgPSBkdXJhdGlvblJlZi5jdXJyZW50IHx8IGR1cmF0aW9uO1xuICAgICAgbGV0IHN0YXJ0U2VjID0gbG9jYWxUaW1lO1xuICAgICAgaWYgKG1heER1ciA+IDAgJiYgbG9jYWxUaW1lID49IG1heER1ciAtIDEuNSkge1xuICAgICAgICBzdGFydFNlYyA9IDA7XG4gICAgICAgIHNldExvY2FsVGltZSgwKTtcbiAgICAgIH1cbiAgICAgIHNldFZpZXdlcklzUGF1c2VkKGZhbHNlKTtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgICBpZiAoc3RhcnRTZWMgPT09IDApIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSAwO1xuICAgICAgICB2aWRlb1JlZi5jdXJyZW50LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgaWYgKHN0YXJ0U2VjID09PSAwKSB7XG4gICAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnNlZWtUbykgeyB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnNlZWtUbygwLCB0cnVlKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbMCwgdHJ1ZV0gfSksICcqJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBsYXlWaWRlbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwbGF5VmlkZW8nLCBhcmdzOiBbXSB9KSwgJyonKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVFx1MUVBMW0gZFx1MUVFQm5nXG4gICAgICBzZXRWaWV3ZXJJc1BhdXNlZCh0cnVlKTtcbiAgICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIHNldElzTGl2ZVdpdGhIb3N0KGZhbHNlKTtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgICB2aWRlb1JlZi5jdXJyZW50LnBhdXNlKCk7XG4gICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBhdXNlVmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBhdXNlVmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BhdXNlVmlkZW8nLCBhcmdzOiBbXSB9KSwgJyonKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gTmdcdTAxQjBcdTFFRERpIHRoYW0gZ2lhIHRcdTFFRjEgdHVhIHRyXHUwMEVBbiBzbGlkZXIgY1x1MUVFNWMgYlx1MUVEOVxuICBjb25zdCBoYW5kbGVWaWV3ZXJTZWVrID0gKHNlYykgPT4ge1xuICAgIGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgc2V0TG9jYWxUaW1lKHNlYyk7XG4gICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgIHNldElzTGl2ZVdpdGhIb3N0KGZhbHNlKTtcbiAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSBzZWM7XG4gICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8uc2Vla1RvKSB7XG4gICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQuc2Vla1RvKHNlYywgdHJ1ZSk7IH0gY2F0Y2gge31cbiAgICAgIH1cbiAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbc2VjLCB0cnVlXSB9KSwgJyonKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT17YGZsZXggZmxleC1jb2wgbWluLXctMCB3LWZ1bGwgJHtpc1Jvb21XaWRlID8gJ2gtZnVsbCBmbGV4LTEgbWluLWgtMCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXInIDogJ2dhcC00J31gfT5cbiAgICAgIHsvKiBLaHVuZyBwaFx1MDBFMXQgdmlkZW8gY2hcdTAwRURuaCBcdTIwMTQga2h1bmcgbmVvbiBtXHUxRUREIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgaFx1MUVDNyBnYW1lIGFyZW5hICovfVxuICAgICAgPGRpdlxuICAgICAgICBzdHlsZT17XG4gICAgICAgICAgaXNSb29tV2lkZSAmJiBsYXlvdXRSYXRpbyA9PT0gJzEwOjAnXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICBtYXhIZWlnaHQ6ICdjYWxjKDEwMHZoIC0gNzZweCknLFxuICAgICAgICAgICAgICAgIG1heFdpZHRoOiAnY2FsYygoMTAwdmggLSA3NnB4KSAqIDE2IC8gOSknLFxuICAgICAgICAgICAgICAgIGFzcGVjdFJhdGlvOiAnMTYgLyA5JyxcbiAgICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgICAgIGhlaWdodDogJ2F1dG8nLFxuICAgICAgICAgICAgICAgIG1hcmdpbjogJzAgYXV0bycsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDogaXNSb29tV2lkZVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgbWF4SGVpZ2h0OiAnY2FsYygxMDB2aCAtIDg0cHgpJyxcbiAgICAgICAgICAgICAgICBhc3BlY3RSYXRpbzogJzE2IC8gOScsXG4gICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICdhdXRvJyxcbiAgICAgICAgICAgICAgICBtYXJnaW46ICcwIGF1dG8nLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICB9XG4gICAgICAgIGNsYXNzTmFtZT1cInJlbGF0aXZlIHctZnVsbCBhc3BlY3QtdmlkZW8gYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMDUwNzBiXSB0by1ibGFjayByb3VuZGVkLTJ4bCBvdmVyZmxvdy1oaWRkZW4gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMTUgcmluZy0xIHJpbmctd2hpdGUvNSBzaGFkb3ctWzBfMF82MHB4X3JnYmEoMCwyNDIsMjU0LDAuMDcpLDBfMzBweF82MHB4Xy0xNXB4X3JnYmEoMCwwLDAsMC43KV1cIlxuICAgICAgPlxuICAgICAgICB7LyogT3ZlcmxheSBBdXRvcGxheSAvIEdlc3R1cmUgY2hvIG5nXHUwMUIwXHUxRUREaSB4ZW0gKi99XG4gICAgICAgIHshaGFzSW50ZXJhY3RlZCAmJiAhY2FuQ29udHJvbCAmJiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyB8fCBwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScpICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgei0yMCBiZy1ibGFjay83NSBiYWNrZHJvcC1ibHVyLXNtIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNCB0ZXh0LWNlbnRlciBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTE0IGgtMTQgcm91bmRlZC1mdWxsIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LTJ4bCBtYi0zIHNoYWRvdy1bMF8wXzI1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGFuaW1hdGUtcHVsc2VcIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERkFDXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlIG1iLTFcIj5YZW0gQ2h1bmcgQ1x1MDBGOW5nIFBoXHUwMEYybmc8L3A+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIG1heC13LXhzIG1iLTRcIj5cbiAgICAgICAgICAgICAgQlx1MUVBNW0gblx1MDBGQXQgYlx1MDBFQW4gZFx1MDFCMFx1MUVEQmkgXHUwMTExXHUxRUMzIGNcdTFFQTVwIHF1eVx1MUVDMW4gXHUwMEUybSB0aGFuaCB2XHUwMEUwIGNcdTAwRjluZyB0aGVvIGRcdTAwRjVpIHRpbWVsaW5lIHZcdTFFREJpIGNoXHUxRUU3IHBoXHUwMEYybmcuXG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiYnRuLXZpZXdlci1zdGFydC13YXRjaFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVTdGFydFZpZXdpbmd9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMi41IHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzNCODJGNl0gdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQteHMgc2hhZG93LWxnIGhvdmVyOm9wYWNpdHktOTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MjVCNjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVBRnQgXHUwMTExXHUxRUE3dSB4ZW0gY1x1MDBGOW5nIHBoXHUwMEYybmc8L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVmlkZW8gZWxlbWVudHMgdGhlbyBwcm92aWRlciAqL31cbiAgICAgICAge3l0SWQgPyAoXG4gICAgICAgICAgPGRpdiBrZXk9e2B5dC13cmFwLSR7cGhvbmcuaWR9YH0gY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCByZWxhdGl2ZSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBiZy1ibGFja1wiPlxuICAgICAgICAgICAgPGlmcmFtZVxuICAgICAgICAgICAgICBpZD17eXRDb250YWluZXJJZH1cbiAgICAgICAgICAgICAga2V5PXtgeXQtZnJhbWUtJHtwaG9uZy5pZH1gfVxuICAgICAgICAgICAgICBzcmM9e2BodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8ke3l0SWR9P2VuYWJsZWpzYXBpPTEmb3JpZ2luPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmxvY2F0aW9uLm9yaWdpbiA6ICcnKX0md2lkZ2V0X3JlZmVycmVyPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmxvY2F0aW9uLmhyZWYgOiAnJyl9JnJlbD0wJm1vZGVzdGJyYW5kaW5nPTEmcGxheXNpbmxpbmU9MWB9XG4gICAgICAgICAgICAgIHRpdGxlPXtwaG9uZy50ZW4gfHwgJ1lvdVR1YmUgVmlkZW8nfVxuICAgICAgICAgICAgICBhbGxvdz1cImFjY2VsZXJvbWV0ZXI7IGF1dG9wbGF5OyBjbGlwYm9hcmQtd3JpdGU7IGVuY3J5cHRlZC1tZWRpYTsgZ3lyb3Njb3BlOyBwaWN0dXJlLWluLXBpY3R1cmU7IHdlYi1zaGFyZVwiXG4gICAgICAgICAgICAgIGFsbG93RnVsbFNjcmVlblxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIGJvcmRlci0wXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBkcnZJZCA/IChcbiAgICAgICAgICA8aWZyYW1lXG4gICAgICAgICAgICBzcmM9e2BodHRwczovL2RyaXZlLmdvb2dsZS5jb20vZmlsZS9kLyR7ZHJ2SWR9L3ByZXZpZXdgfVxuICAgICAgICAgICAgdGl0bGU9e3Bob25nLnRlbn1cbiAgICAgICAgICAgIGFsbG93PVwiYXV0b3BsYXk7IGZ1bGxzY3JlZW5cIlxuICAgICAgICAgICAgYWxsb3dGdWxsU2NyZWVuXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsXCJcbiAgICAgICAgICAvPlxuICAgICAgICApIDogdHJ1Y1RpZXBVcmwgPyAoXG4gICAgICAgICAgPHZpZGVvXG4gICAgICAgICAgICByZWY9e3ZpZGVvUmVmfVxuICAgICAgICAgICAgc3JjPXt0cnVjVGllcFVybH1cbiAgICAgICAgICAgIHBsYXlzSW5saW5lXG4gICAgICAgICAgICBkYXRhLXRlc3RpZD1cInN0dWR5LXZpZGVvLXBsYXllclwiXG4gICAgICAgICAgICBjb250cm9scz17dHJ1ZX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvbnRhaW5cIlxuICAgICAgICAgICAgb25Mb2FkZWRNZXRhZGF0YT17ZSA9PiB7XG4gICAgICAgICAgICAgIGlmIChlLnRhcmdldC5kdXJhdGlvbiA+IDApIHNldER1cmF0aW9uKGUudGFyZ2V0LmR1cmF0aW9uKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvblBsYXk9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgIXdhdGNoU3RhdGUucGxheWluZyAmJiAhZGFuZ0d1aUxlbmgpIHtcbiAgICAgICAgICAgICAgICBndWlMZW5oKCdwbGF5JywgdmlkZW9SZWYuY3VycmVudD8uY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFjYW5Db250cm9sICYmICFpc1Byb2dyYW1tYXRpY0FjdGlvblJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgc2V0Vmlld2VySXNQYXVzZWQoZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25QYXVzZT17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoY2FuQ29udHJvbCAmJiB3YXRjaFN0YXRlLnBsYXlpbmcgJiYgIWRhbmdHdWlMZW5oKSB7XG4gICAgICAgICAgICAgICAgZ3VpTGVuaCgncGF1c2UnLCB2aWRlb1JlZi5jdXJyZW50Py5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWNhbkNvbnRyb2wgJiYgIWlzUHJvZ3JhbW1hdGljQWN0aW9uUmVmLmN1cnJlbnQgJiYgd2F0Y2hTdGF0ZVJlZi5jdXJyZW50LnBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgICBpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgc2V0SXNMaXZlV2l0aEhvc3QoZmFsc2UpO1xuICAgICAgICAgICAgICAgIHNldFZpZXdlcklzUGF1c2VkKHRydWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25FbmRlZD17KCkgPT4ge1xuICAgICAgICAgICAgICBoYW5kbGVWaWRlb0VuZGVkKCk7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25TZWVrZWQ9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGlzUHJvZ3JhbW1hdGljQWN0aW9uUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGFuZ0d1aUxlbmggfHwgaXNTZWVraW5nUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXIgPSB2aWRlb1JlZi5jdXJyZW50Py5jdXJyZW50VGltZTtcbiAgICAgICAgICAgICAgICBpZiAoY3VyID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAvLyBDaFx1MUVEMW5nIHZcdTAwRjJuZyBsXHUxRUI3cDogbVx1MUVDRGkgZ1x1MDBFMW4gY3VycmVudFRpbWUgblx1MUVEOWkgYlx1MUVEOSAob3B0aW1pc3RpYyBzZWVrLCBkcmlmdC1jb3JyZWN0aW9uXG4gICAgICAgICAgICAgICAgLy8gY1x1MUVFN2EgYXBEdW5nRG9uZ0JvKSBcdTAxMTFcdTFFQzF1IGJcdTFFQUZuICdzZWVrZWQnLiBDaFx1MUVDOSBnXHUxRUVEaSBsXHUxRUM3bmgga2hpIHZcdTFFQ0IgdHJcdTAwRUQgbFx1MUVDN2NoIGtoXHUxRUNGaVxuICAgICAgICAgICAgICAgIC8vIHZcdTFFQ0IgdHJcdTAwRUQgc2VydmVyIGtcdTFFRjMgdlx1MUVDRG5nID4xLjVzIFx1MjAxNCB0XHUxRUU5YyBuZ1x1MDFCMFx1MUVERGkgZFx1MDBGOW5nIHRoXHUxRUFEdCBzXHUxRUYxIHR1YSBxdWEgdGhhbmggY29udHJvbHMuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3QgPSB3YXRjaFN0YXRlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVwZE1zID0gc3Q/LnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyhzdC51cGRhdGVkQXQpLnJlcGxhY2UoJyAnLCAnVCcpICsgKFN0cmluZyhzdC51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKSA6IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZWxhcHNlZCA9IE1hdGgubWF4KDAsIChEYXRlLm5vdygpIC0gdXBkTXMpIC8gMTAwMCk7XG4gICAgICAgICAgICAgICAgY29uc3Qga3lWb25nID0gc3Q/LnBsYXlpbmdcbiAgICAgICAgICAgICAgICAgID8gTnVtYmVyKHN0LmJhc2VQb3NpdGlvblNlY29uZHMgfHwgMCkgKyBlbGFwc2VkICogKHN0LnBsYXliYWNrUmF0ZSB8fCAxKVxuICAgICAgICAgICAgICAgICAgOiBOdW1iZXIoc3Q/LnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VyIC0ga3lWb25nKSA+IDEuNSkgZ3VpTGVuaCgnc2VlaycsIGN1cik7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VyID0gdmlkZW9SZWYuY3VycmVudD8uY3VycmVudFRpbWUgfHwgMDtcbiAgICAgICAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjdXIpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBob3N0UG9zID0gZ2V0SG9zdEN1cnJlbnRQb3MoKTtcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VyIC0gaG9zdFBvcykgPiAzLjApIHtcbiAgICAgICAgICAgICAgICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIHNldElzTGl2ZVdpdGhIb3N0KGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgLz5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGgtZnVsbCB0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIHAtNiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC0yeGwgbWItMlwiPlx1MjZBMFx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPkxpbmsgdmlkZW8ga2hcdTAwRjRuZyBoXHUxRUQ3IHRyXHUxRUUzIHBoXHUwMEUxdCB0clx1MUVGMWMgdGlcdTFFQkZwIGhvXHUxRUI3YyBraFx1MDBGNG5nIGhcdTFFRTNwIGxcdTFFQzcuPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBUaFx1MDBGNG5nIGJcdTAwRTFvIHJpXHUwMEVBbmcgY2hvIEdvb2dsZSBEcml2ZSAqL31cbiAgICAgIHtkcnZJZCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMy41IHB5LTIgYmctYW1iZXItNTAwLzEwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzIwIHJvdW5kZWQteGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyB0ZXh0LWFtYmVyLTMwMFwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc21cIj5cdTIxMzlcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgPHNwYW4+R29vZ2xlIERyaXZlIHBoXHUwMEUxdCBcdTFFREYgY2hcdTFFQkYgXHUwMTExXHUxRUQ5IDxzdHJvbmc+WGVtIFx1MDExMVx1MUVEOWMgbFx1MUVBRHA8L3N0cm9uZz4gKEdvb2dsZSBEcml2ZSBraFx1MDBGNG5nIGhcdTFFRDcgdHJcdTFFRTMgQVBJIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gdFx1MUVFQiB4YSkuPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBUaGFuaCBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIEhvc3QgJiBOZ1x1MDFCMFx1MUVERGkgeGVtIFx1MjAxNCBcdTFFQTluIGtoaSBmdWxsc2NyZWVuICovfVxuICAgICAgeyFpc1Jvb21XaWRlICYmIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMTYxYjI2XSB0by1bIzBmMTQxZF0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMTAgcm91bmRlZC0yeGwgcC0zIHNtOnAtMy41IGZsZXggZmxleC1jb2wgZ2FwLTMgc2hhZG93LXhsXCI+XG5cbiAgICAgICAgey8qIFRoYW5oIGNcdTAwRjRuZyBjXHUxRUU1IHBoXHUwMEUxdCBjaHVuZyAoY2hvIEhvc3QgLyBUZWFjaGVyIGtoaSBkXHUwMEY5bmcgcHJvdmlkZXIgY1x1MDBGMyB0aFx1MUVDMyBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuKSAqL31cbiAgICAgICAge2NhbkNvbnRyb2wgJiYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyB8fCBwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGl0ZW1zLWNlbnRlciBnYXAtMyBwdC0yIGJvcmRlci10IGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImJ0bi1ob3N0LXdhdGNoLXRvZ2dsZVwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVIb3N0VG9nZ2xlUGxheX1cbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgc206dy1hdXRvIHB4LTQgcHktMiByb3VuZGVkLXhsIGZvbnQtYmxhY2sgdGV4dC14cyB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMS41IHNoYWRvdy1tZCBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXIgZGlzYWJsZWQ6b3BhY2l0eS01MCAke1xuICAgICAgICAgICAgICAgIHdhdGNoU3RhdGUucGxheWluZ1xuICAgICAgICAgICAgICAgICAgPyAnYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzQwIGhvdmVyOmJnLWFtYmVyLTUwMC8zMCBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMjQ1LDE1OCwxMSwwLjI1KV0nXG4gICAgICAgICAgICAgICAgICA6ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMDBjNmZmXSB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGhvdmVyOmJyaWdodG5lc3MtMTEwJ1xuICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgIDxzcGFuPnt3YXRjaFN0YXRlLnBsYXlpbmcgPyAnXHUyM0Y4JyA6ICdcdTI1QjYnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAge3dhdGNoU3RhdGUucGxheWluZ1xuICAgICAgICAgICAgICAgICAgPyAnVFx1MUVBMW0gRFx1MUVFQm5nIENcdTFFQTMgUGhcdTAwRjJuZydcbiAgICAgICAgICAgICAgICAgIDogKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXhEdXIgPSBkdXJhdGlvblJlZi5jdXJyZW50IHx8IGR1cmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXhEdXIgPiAwICYmIGxvY2FsVGltZSA+PSBtYXhEdXIgLSAxLjUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnUGhcdTAwRTF0IExcdTFFQTFpIENcdTFFQTMgUGhcdTAwRjJuZyc7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnUGhcdTAwRTF0IENodW5nIENcdTFFQTMgUGhcdTAwRjJuZyc7XG4gICAgICAgICAgICAgICAgICAgIH0pKCl9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41IHctZnVsbFwiPlxuICAgICAgICAgICAgICA8c3BhbiBpZD1cImhvc3QtZHVyYXRpb24tbGFiZWxcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICB7ZGluaERhbmdHaWF5UGh1dChsb2NhbFRpbWUpfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIGlkPVwiaG9zdC1zZWVrLXNsaWRlclwiXG4gICAgICAgICAgICAgICAgdHlwZT1cInJhbmdlXCJcbiAgICAgICAgICAgICAgICBtaW49XCIwXCJcbiAgICAgICAgICAgICAgICBtYXg9e2R1cmF0aW9uID4gMCA/IGR1cmF0aW9uIDogKGR1cmF0aW9uUmVmLmN1cnJlbnQgPiAwID8gZHVyYXRpb25SZWYuY3VycmVudCA6IE1hdGgubWF4KGxvY2FsVGltZSwgMzAwKSl9XG4gICAgICAgICAgICAgICAgc3RlcD1cIjFcIlxuICAgICAgICAgICAgICAgIHZhbHVlPXtsb2NhbFRpbWV9XG4gICAgICAgICAgICAgICAgb25Nb3VzZURvd249eygpID0+IHsgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgIG9uVG91Y2hTdGFydD17KCkgPT4geyBpc1NlZWtpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0TG9jYWxUaW1lKE51bWJlcihlLnRhcmdldC52YWx1ZSkpfVxuICAgICAgICAgICAgICAgIG9uTW91c2VVcD17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBpc1NlZWtpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oKCdzZWVrJywgTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBvblRvdWNoRW5kPXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3NlZWsnLCBOdW1iZXIoZS50YXJnZXQudmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBoLTEuNSBiZy13aGl0ZS8xMCByb3VuZGVkLWxnIGFwcGVhcmFuY2Utbm9uZSBjdXJzb3ItcG9pbnRlciBhY2NlbnQtWyMwMEYyRkVdXCJcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1tb25vIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAge2R1cmF0aW9uID4gMCA/IGRpbmhEYW5nR2lheVBodXQoZHVyYXRpb24pIDogKGR1cmF0aW9uUmVmLmN1cnJlbnQgPiAwID8gZGluaERhbmdHaWF5UGh1dChkdXJhdGlvblJlZi5jdXJyZW50KSA6ICctLTotLScpfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVGhhbmggY1x1MDBGNG5nIGNcdTFFRTUgY2hvIE5nXHUwMUIwXHUxRUREaSB0aGFtIGdpYSAodFx1MUVBMW0gZFx1MUVFQm5nIHJpXHUwMEVBbmcsIHRpbWVsaW5lIHJpXHUwMEVBbmcgJiBuXHUwMEZBdCB0clx1MUVGMWMgdGlcdTFFQkZwIHRoZW8gY2hcdTFFRTcgcGhcdTAwRjJuZykgKi99XG4gICAgICAgIHshY2FuQ29udHJvbCAmJiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnIHx8IHByb3ZpZGVyID09PSAnWU9VVFVCRScpICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgaXRlbXMtY2VudGVyIGdhcC0zIHB0LTIgYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHctZnVsbCBzbTp3LWF1dG9cIj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZpZXdlci13YXRjaC10b2dnbGVcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVZpZXdlclRvZ2dsZVBsYXl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIHNtOnctYXV0byBweC00IHB5LTIgcm91bmRlZC14bCBmb250LWJsYWNrIHRleHQteHMgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEuNSBzaGFkb3ctbWQgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyICR7XG4gICAgICAgICAgICAgICAgICB2aWV3ZXJJc1BhdXNlZFxuICAgICAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4zNSldIGhvdmVyOmJyaWdodG5lc3MtMTEwJ1xuICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS8xMCB0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTUgaG92ZXI6Ymctd2hpdGUvMTUnXG4gICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgIDxzcGFuPnt2aWV3ZXJJc1BhdXNlZCA/ICdcdTI1QjYnIDogJ1x1MjNGOCd9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgICAge3ZpZXdlcklzUGF1c2VkXG4gICAgICAgICAgICAgICAgICAgID8gKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF4RHVyID4gMCAmJiBsb2NhbFRpbWUgPj0gbWF4RHVyIC0gMS41KSByZXR1cm4gJ1BoXHUwMEUxdCBMXHUxRUExaSBWaWRlbyc7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1RpXHUxRUJGcCBUXHUxRUU1YyBYZW0nO1xuICAgICAgICAgICAgICAgICAgICAgIH0pKClcbiAgICAgICAgICAgICAgICAgICAgOiAnVFx1MUVBMW0gRFx1MUVFQm5nIFZpZGVvJ31cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi12aWV3ZXItZ28tbGl2ZS1iYXJcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZUdvTGl2ZX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgc206dy1hdXRvIHB4LTQgcHktMiByb3VuZGVkLXhsIGZvbnQtYmxhY2sgdGV4dC14cyB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMS41IHNoYWRvdy1tZCBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXIgJHtcbiAgICAgICAgICAgICAgICAgIGlzTGl2ZVdpdGhIb3N0XG4gICAgICAgICAgICAgICAgICAgID8gJ2JnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS00MDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCdcbiAgICAgICAgICAgICAgICAgICAgOiAnYmctZ3JhZGllbnQtdG8tciBmcm9tLXJvc2UtNjAwIHRvLXJlZC02MDAgdGV4dC13aGl0ZSBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMjQ0LDYzLDk0LDAuNSldIGFuaW1hdGUtcHVsc2UgaG92ZXI6YnJpZ2h0bmVzcy0xMTAnXG4gICAgICAgICAgICAgICAgfWB9XG4gICAgICAgICAgICAgICAgdGl0bGU9e2lzTGl2ZVdpdGhIb3N0ID8gJ1x1MDExMGFuZyB4ZW0gdHJcdTFFRjFjIHRpXHUxRUJGcCBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IHZcdTFFREJpIGNoXHUxRUU3IHBoXHUwMEYybmcnIDogJ0JcdTFFQTVtIFx1MDExMVx1MUVDMyBuaFx1MUVBM3kgdFx1MUVEQmkgdmlkZW8gXHUwMTExYW5nIGNoXHUxRUExeSBjXHUxRUU3YSBjaFx1MUVFNyBwaFx1MDBGMm5nJ30+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdy0yIGgtMiByb3VuZGVkLWZ1bGwgJHtpc0xpdmVXaXRoSG9zdCA/ICdiZy1yb3NlLTUwMCBhbmltYXRlLXB1bHNlJyA6ICdiZy13aGl0ZSd9YH0gLz5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICAgIHtpc0xpdmVXaXRoSG9zdFxuICAgICAgICAgICAgICAgICAgICA/ICdUclx1MUVGMWMgVGlcdTFFQkZwJ1xuICAgICAgICAgICAgICAgICAgICA6ICgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1RyXHUxRUYxYyBUaVx1MUVCRnAgKENoXHUxRUU3IHBoXHUwMEYybmcgdFx1MUVBMW0gZFx1MUVFQm5nKSc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXhEdXIgPSBkdXJhdGlvblJlZi5jdXJyZW50IHx8IGR1cmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaFBvcyA9IGdldEhvc3RDdXJyZW50UG9zKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF4RHVyID4gMCAmJiBoUG9zID49IG1heER1ciAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdUclx1MUVGMWMgVGlcdTFFQkZwIChIXHUxRUJGdCB2aWRlbyknO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IE1hdGgucm91bmQoaFBvcyAtIGxvY2FsVGltZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZCA+IDIgPyBgVHJcdTFFRjFjIFRpXHUxRUJGcCAoQ2hcdTFFQURtICR7ZCA+IDYwID8gZGluaERhbmdHaWF5UGh1dChkKSA6IGQgKyAncyd9KWAgOiAnVlx1MDBFMG8gVHJcdTFFRjFjIFRpXHUxRUJGcCc7XG4gICAgICAgICAgICAgICAgICAgICAgfSkoKX1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjUgdy1mdWxsXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGlkPVwidmlld2VyLWR1cmF0aW9uLWxhYmVsXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1tb25vIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAge2RpbmhEYW5nR2lheVBodXQobG9jYWxUaW1lKX1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICBpZD1cInZpZXdlci1zZWVrLXNsaWRlclwiXG4gICAgICAgICAgICAgICAgdHlwZT1cInJhbmdlXCJcbiAgICAgICAgICAgICAgICBtaW49XCIwXCJcbiAgICAgICAgICAgICAgICBtYXg9e2R1cmF0aW9uID4gMCA/IGR1cmF0aW9uIDogKGR1cmF0aW9uUmVmLmN1cnJlbnQgPiAwID8gZHVyYXRpb25SZWYuY3VycmVudCA6IE1hdGgubWF4KGxvY2FsVGltZSwgMzAwKSl9XG4gICAgICAgICAgICAgICAgc3RlcD1cIjFcIlxuICAgICAgICAgICAgICAgIHZhbHVlPXtsb2NhbFRpbWV9XG4gICAgICAgICAgICAgICAgb25Nb3VzZURvd249eygpID0+IHsgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgIG9uVG91Y2hTdGFydD17KCkgPT4geyBpc1NlZWtpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0TG9jYWxUaW1lKE51bWJlcihlLnRhcmdldC52YWx1ZSkpfVxuICAgICAgICAgICAgICAgIG9uTW91c2VVcD17ZSA9PiBoYW5kbGVWaWV3ZXJTZWVrKE51bWJlcihlLnRhcmdldC52YWx1ZSkpfVxuICAgICAgICAgICAgICAgIG9uVG91Y2hFbmQ9e2UgPT4gaGFuZGxlVmlld2VyU2VlayhOdW1iZXIoZS50YXJnZXQudmFsdWUpKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgaC0xLjUgYmctd2hpdGUvMTAgcm91bmRlZC1sZyBhcHBlYXJhbmNlLW5vbmUgY3Vyc29yLXBvaW50ZXIgYWNjZW50LVsjMDBGMkZFXVwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIHtkdXJhdGlvbiA+IDAgPyBkaW5oRGFuZ0dpYXlQaHV0KGR1cmF0aW9uKSA6IChkdXJhdGlvblJlZi5jdXJyZW50ID4gMCA/IGRpbmhEYW5nR2lheVBodXQoZHVyYXRpb25SZWYuY3VycmVudCkgOiAnLS06LS0nKX1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAge2xvaSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtcm9zZS00MDBcIj57bG9pfTwvcD59XG4gICAgICAgIHtwaG9uZy5tb1RhICYmIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIGxlYWRpbmctcmVsYXhlZCBwdC0xXCI+e3Bob25nLm1vVGF9PC9wPn1cblxuICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogXHUyNTAwXHUyNTAwXHUyNTAwIFZcdTAwRDlORyAxOiBUUlVORyBUXHUwMEMyTSBDXHUxRUE0VSBIXHUwMENDTkggVklERU8gJiBIXHUwMEMwTkcgXHUwMTEwXHUxRUUySSBZT1VUVUJFIFRSXHUxRUYwQyBUSVx1MUVCRVAgXHUyNTAwXHUyNTAwXHUyNTAwICovfVxuICAgICAgeyFpc1Jvb21XaWRlICYmIChcbiAgICAgICAgPGRpdiBpZD1cInZ1bmcxLXlvdXR1YmUtc3R1ZGlvXCIgc3R5bGU9e3sgb3ZlcmZsb3dBbmNob3I6ICdub25lJyB9fSBjbGFzc05hbWU9XCJiZy1ncmFkaWVudC10by1iIGZyb20tWyMxNjFiMjZdIHRvLVsjMGYxNDFkXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtMy41IHNtOnAtNCBmbGV4IGZsZXgtY29sIGdhcC0zIHNoYWRvdy14bFwiPlxuICAgICAgICAgIHsvKiBIZWFkZXIgdHJ1bmcgdFx1MDBFMm0gKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgcGItMi41IGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMCBmbGV4LXdyYXBcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLWJyIGZyb20tWyMwMEYyRkVdLzIwIHRvLXZpb2xldC01MDAvMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMzAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1zbSBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMCwyNDIsMjU0LDAuMjUpXVwiPlxuICAgICAgICAgICAgICAgIFx1RDgzQ1x1REZBQ1xuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQteHMgc206dGV4dC1zbSBmb250LWJsYWNrIHRleHQtd2hpdGUgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+Q1x1MUVBNXUgaFx1MDBFQ25oIFZpZGVvICYgSFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgWW91VHViZTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3QuZmlsdGVyKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnKS5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkLWZ1bGwgYmctWyMwMEYyRkVdLzE1IHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3QuZmlsdGVyKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnKS5sZW5ndGh9IFx1MDExMWFuZyBjaFx1MUVERFxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDBcIj5UXHUwMEVDbSBraVx1MUVCRm0gdmlkZW8sIFx1MDExMVx1MDFCMGEgdlx1MDBFMG8gaFx1MDBFMG5nIGNoXHUxRUREIHZcdTAwRTAgY2hcdTFFQTF5IHZpZGVvIGtoXHUwMEUxYyBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGNcdTFFQTMgcGhcdTAwRjJuZzwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgIHsvKiBUYWIgc2VsZWN0b3IgKi99XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgYmctWyMwQjBFMTRdIHAtMSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLW1lZGlhLXRhYi1zZWFyY2hcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBnaXVOZ3V5ZW5WaVRyaUN1b24oKCkgPT4gc2V0TWVkaWFUYWIoJ3NlYXJjaCcpKTtcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEuNSByb3VuZGVkLWxnIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICAgICAgICBtZWRpYVRhYiA9PT0gJ3NlYXJjaCdcbiAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIHNoYWRvdy1tZCdcbiAgICAgICAgICAgICAgICAgICAgICA6ICd0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDBEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+VFx1MDBFQ20gWW91VHViZTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLW1lZGlhLXRhYi1xdWV1ZVwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIGdpdU5ndXllblZpVHJpQ3VvbigoKSA9PiBzZXRNZWRpYVRhYigncXVldWUnKSk7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgICAgICAgbWVkaWFUYWIgPT09ICdxdWV1ZSdcbiAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tdmlvbGV0LTUwMCB0by1mdWNoc2lhLTUwMCB0ZXh0LXdoaXRlIHNoYWRvdy1tZCdcbiAgICAgICAgICAgICAgICAgICAgICA6ICd0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0NCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+SFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgKHtxdWV1ZUxpc3QuZmlsdGVyKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdxdWV1ZWQnKS5sZW5ndGh9KTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgey8qIFRvZ2dsZSB0aHUgZ1x1MUVDRG4gKi99XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBpZD1cImJ0bi10b2dnbGUtc3R1ZGlvXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgIGdpdU5ndXllblZpVHJpQ3VvbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldERhTW9Sb25nU3R1ZGlvKHByZXYgPT4gIXByZXYpO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICB0aXRsZT17ZGFNb1JvbmdTdHVkaW8gPyAnVGh1IGdcdTFFQ0RuJyA6ICdNXHUxRURGIHJcdTFFRDluZyd9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLXhsIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAge2RhTW9Sb25nU3R1ZGlvID8gJ1x1MjVCMicgOiAnXHUyNUJDJ31cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiBUb2FzdCB0aFx1MDBGNG5nIGJcdTAwRTFvIC8gTFx1MUVEN2kgKi99XG4gICAgICAgICAge3Rob25nQmFvVmlkZW8gJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zIHB5LTIgcm91bmRlZC14bCBiZy1lbWVyYWxkLTUwMC8xNSBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQtZW1lcmFsZC0zMDAgdGV4dC14cyBmb250LWJvbGQgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgYW5pbWF0ZS1mYWRlSW5cIj5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNzI4PC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj57dGhvbmdCYW9WaWRlb308L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuICAgICAgICAgIHtsb2lWaWRlbyAmJiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMiByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzE1IGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdGV4dC1yb3NlLTMwMCB0ZXh0LXhzIGZvbnQtYm9sZCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTI2QTBcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPntsb2lWaWRlb308L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuXG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwIGVhc2UtaW4tb3V0IG92ZXJmbG93LWhpZGRlbiBmbGV4IGZsZXgtY29sIG1pbi1oLTAgJHtcbiAgICAgICAgICAgICAgZGFNb1JvbmdTdHVkaW8gPyAnbWF4LWgtWzM4MHB4XSBvcGFjaXR5LTEwMCcgOiAnbWF4LWgtMCBvcGFjaXR5LTAgcG9pbnRlci1ldmVudHMtbm9uZSdcbiAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgc3R5bGU9e3sgb3ZlcmZsb3dBbmNob3I6ICdub25lJyB9fT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1bMzQwcHhdIGZsZXggZmxleC1jb2wgbWluLWgtMCBvdmVyZmxvdy1oaWRkZW4gc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgey8qIFRBQiAxOiBUXHUwMENDTSBLSVx1MUVCRU0gWU9VVFVCRSAmIFx1MDExMFx1MUVENEkgVklERU8gKi99XG4gICAgICAgICAgICAgIHttZWRpYVRhYiA9PT0gJ3NlYXJjaCcgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1mdWxsIGZsZXggZmxleC1jb2wgZ2FwLTIuNSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICB7LyogXHUwMEQ0IHRcdTAwRUNtIGtpXHUxRUJGbSAvIGRcdTAwRTFuIGxpbmsgXHUwMTExYSBuXHUwMTAzbmcgKi99XG4gICAgICAgICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17KGUpID0+IHRpbUtpZW1Zb3VUdWJlKGUpfSBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC0yIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIGZsZXgtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYWJzb2x1dGUgbGVmdC0zIHRvcC0xLzIgLXRyYW5zbGF0ZS15LTEvMiB0ZXh0LXNsYXRlLTQwMCB0ZXh0LXhzXCI+XHVEODNEXHVERDBEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiaW5wdXQtdnVuZzEteW91dHViZS1zZWFyY2hcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt5dFF1ZXJ5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRZdFF1ZXJ5KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJOaFx1MUVBRHAgdFx1MUVFQiBraFx1MDBGM2EgdFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmUgKHZkOiBsb2ZpIGhcdTFFQ0RjIGJcdTAwRTBpLi4uKSBob1x1MUVCN2MgZFx1MDBFMW4gbGluayB2aWRlby4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBmb2N1czpib3JkZXItWyMwMEYyRkVdLzYwIHJvdW5kZWQteGwgcGwtOCBwci0zIHB5LTIgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLXRpbS1raWVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXsheXRRdWVyeS50cmltKCkgfHwgc2VhcmNoaW5nWXR9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zLjUgcHktMiByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIGhvdmVyOmJyaWdodG5lc3MtMTEwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBzaGFkb3ctbWQgZGlzYWJsZWQ6b3BhY2l0eS00MCB3aGl0ZXNwYWNlLW5vd3JhcCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7c2VhcmNoaW5nWXQgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYW5pbWF0ZS1zcGluXCI+XHUyM0YzPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MDExMGFuZyB0XHUwMEVDbS4uLjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5UXHUwMEVDbSBraVx1MUVCRm08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgey8qIEFjdGlvbiBidXR0b25zIHBoXHUxRUU1IGtoaSBcdTAwRjQgaW5wdXQgbFx1MDBFMCAxIGxpbmsgdmlkZW8gdHJcdTFFRjFjIHRpXHUxRUJGcCAqL31cbiAgICAgICAgICAgICAgICAgICAge0Jvb2xlYW4oeXRRdWVyeS50cmltKCkuc3RhcnRzV2l0aCgnaHR0cDovLycpIHx8IHl0UXVlcnkudHJpbSgpLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vJykgfHwgeXRRdWVyeS5pbmNsdWRlcygneW91dHUnKSkgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcC0yIHJvdW5kZWQteGwgYmctWyMwQjBFMTRdLzgwIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzIwIGZsZXgtd3JhcCBhbmltYXRlLWZhZGVJblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDE3PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5QaFx1MDBFMXQgaGlcdTFFQzduIGxpXHUwMEVBbiBrXHUxRUJGdCB2aWRlbzo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7Y2FuQ29udHJvbCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLXBoYXQtbmdheS1saW5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGRvaVZpZGVvKHl0UXVlcnkudHJpbSgpLCAnVmlkZW8gdFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nRG9pVmlkZW99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXSB0ZXh0LWJsYWNrIHRleHQteHMgZm9udC1ibGFjayBob3ZlcjpiZy1bIzAwZTFlY10gYWN0aXZlOnNjYWxlLTk1IHNoYWRvdy1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2IFBoXHUwMEUxdCBuZ2F5IGNcdTFFQTMgcGhcdTAwRjJuZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtZW5xdWV1ZS1saW5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ2VucXVldWUnLCB7IHZpZGVvVXJsOiB5dFF1ZXJ5LnRyaW0oKSwgdGl0bGU6ICdWaWRlbyB0XHUxRUVCIGxpXHUwMEVBbiBrXHUxRUJGdCcgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1lbWVyYWxkLTUwMC8yMCB0ZXh0LWVtZXJhbGQtMzAwIGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMzAgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6YmctZW1lcmFsZC01MDAvMzBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgVGhcdTAwRUFtIHZcdTAwRTBvIGN1XHUxRUQxaSBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtYWRkLW5leHQtbGlua1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdhZGRfbmV4dCcsIHsgdmlkZW9Vcmw6IHl0UXVlcnkudHJpbSgpLCB0aXRsZTogJ1ZpZGVvIHRcdTFFRUIgbGlcdTAwRUFuIGtcdTFFQkZ0JyB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLXZpb2xldC01MDAvMjAgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy12aW9sZXQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFBoXHUwMEUxdCBrXHUxRUJGIHRpXHUxRUJGcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS1zdWdnZXN0LWxpbmtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3N1Z2dlc3QnLCB7IHZpZGVvVXJsOiB5dFF1ZXJ5LnRyaW0oKSwgdGl0bGU6ICdWaWRlbyB0XHUxRUVCIGxpXHUwMEVBbiBrXHUxRUJGdCcgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLWxnIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tYW1iZXItNTAwIHRleHQtYmxhY2sgdGV4dC14cyBmb250LWJsYWNrIGhvdmVyOmJyaWdodG5lc3MtMTEwIGFjdGl2ZTpzY2FsZS05NSBzaGFkb3ctc20gY3Vyc29yLXBvaW50ZXIgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENBMTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTAxMTBcdTFFQzEgeHVcdTFFQTV0IGNobyBjaFx1MUVFNyBwaFx1MDBGMm5nPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Zvcm0+XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBUclx1MUVBMW5nIHRoXHUwMEUxaSBsXHUxRUQ3aSB0XHUwMEVDbSBraVx1MUVCRm0gKi99XG4gICAgICAgICAgICAgICAgICB7c2VhcmNoTG9pICYmIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTIuNSByb3VuZGVkLXhsIGJnLWFtYmVyLTUwMC8xMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCB0ZXh0LXhzIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MjZBMFx1RkUwRiB7c2VhcmNoTG9pfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRTZWFyY2hMb2koJycpfSBjbGFzc05hbWU9XCJ0ZXh0LWFtYmVyLTQwMCBmb250LWJvbGQgaG92ZXI6dW5kZXJsaW5lXCI+XHUwMTEwXHUwMEYzbmc8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICB7LyogS1x1MUVCRnQgcXVcdTFFQTMgdFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmUgKi99XG4gICAgICAgICAgICAgICAgICB7eXRSZXN1bHRzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTEuNSBtaW4taC0wIG92ZXJmbG93LWhpZGRlblwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQteHMgdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENGQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+S1x1MUVCRnQgcXVcdTFFQTMgWW91VHViZSAoe3l0UmVzdWx0cy5sZW5ndGh9IHZpZGVvKTo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS1kb25nLWtldC1xdWFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldFl0UmVzdWx0cyhbXSk7IHNldFNlYXJjaExvaSgnJyk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIgcHktMC41IHJvdW5kZWQtbWQgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTUgXHUwMTEwXHUwMEYzbmcga1x1MUVCRnQgcXVcdTFFQTNcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgc3BhY2UteS0yIG92ZXJmbG93LXktYXV0byBwci0xIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt5dFJlc3VsdHMubWFwKChpdGVtLCBpZHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdlVybCA9IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PSR7aXRlbS52aWRlb0lkfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtpdGVtLnZpZGVvSWQgfHwgaWR4fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZ3JvdXAgYmctWyMwQjBFMTRdIGhvdmVyOmJnLVsjMTIxNzIxXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOmJvcmRlci1bIzAwRjJGRV0vMzAgcm91bmRlZC14bCBwLTIuNSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFRodW1ibmFpbCAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgdy0yNCBzbTp3LTI4IGFzcGVjdC12aWRlbyByb3VuZGVkLWxnIG92ZXJmbG93LWhpZGRlbiBiZy1ibGFjayBzaHJpbmstMCBib3JkZXIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGltZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYz17aXRlbS50aHVtYm5haWx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWx0PXtpdGVtLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvdmVyIGdyb3VwLWhvdmVyOnNjYWxlLTEwNSB0cmFuc2l0aW9uLXRyYW5zZm9ybVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZz1cImxhenlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBib3R0b20tMSByaWdodC0xIGJnLWJsYWNrLzgwIHB4LTEgcHktMC4yIHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LW1vbm8gdGV4dC13aGl0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFlvdVR1YmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBUaFx1MDBGNG5nIHRpbiB2aWRlbyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGg1IGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtMjAwIGxpbmUtY2xhbXAtMiBncm91cC1ob3Zlcjp0ZXh0LVsjMDBGMkZFXSB0cmFuc2l0aW9uLWNvbG9yc1wiIHRpdGxlPXtpdGVtLnRpdGxlfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXRlbS50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9oNT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtdC0xIHRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0uY2hhbm5lbFRpdGxlIHx8ICdLXHUwMEVBbmggWW91VHViZSd9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpdGVtLnB1Ymxpc2hlZEF0ICYmIDxzcGFuPlx1MjAyMiB7aXRlbS5wdWJsaXNoZWRBdH08L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogQlx1MUVEOSBuXHUwMEZBdCB0aGFvIHRcdTAwRTFjOiBDaFx1MUVFNyBwaFx1MDBGMm5nIGNcdTAwRjMgMyBxdXlcdTFFQzFuIHBoXHUwMEUxdC9jaFx1MUVERC9rXHUxRUJGIHRpXHUxRUJGcDsgTmdcdTAxQjBcdTFFRERpIHRoYW0gZ2lhIGNoXHUxRUM5IFx1MDExMVx1MDFCMFx1MUVFM2MgXHUwMTExXHUxRUMxIHh1XHUxRUE1dCBjaG8gY2hcdTFFRTcgcGhcdTAwRjJuZyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y2FuQ29udHJvbCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDaFx1MUVBMXkgdmlkZW8gblx1MDBFMHkgbmdheSBsXHUxRUFEcCB0XHUxRUU5YyBjaG8gY1x1MUVBMyBwaFx1MDBGMm5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZG9pVmlkZW8odlVybCwgaXRlbS50aXRsZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nRG9pVmlkZW99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMDBjNmZmXSB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC1bMTFweF0gc2hhZG93LXNtIGhvdmVyOmJyaWdodG5lc3MtMTEwIGFjdGl2ZTpzY2FsZS05NSBkaXNhYmxlZDpvcGFjaXR5LTQwIHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNiBQaFx1MDBFMXQgbmdheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlRoXHUwMEVBbSB2XHUwMEUwbyBjdVx1MUVEMWkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdlbnF1ZXVlJywgeyB2aWRlb1VybDogdlVybCwgdGl0bGU6IGl0ZW0udGl0bGUsIHRodW1iOiBpdGVtLnRodW1ibmFpbCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8yNSB0ZXh0LVsxMXB4XSBmb250LWJvbGQgYWN0aXZlOnNjYWxlLTk1IGRpc2FibGVkOm9wYWNpdHktNDAgd2hpdGVzcGFjZS1ub3dyYXAgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBIXHUwMEUwbmcgY2hcdTFFRERcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJUaFx1MDBFQW0gXHUwMTExXHUxRUMzIHBoXHUwMEUxdCBrXHUxRUJGIHRpXHUxRUJGcCBzYXUgdmlkZW8gaGlcdTFFQzduIHRcdTFFQTFpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnYWRkX25leHQnLCB7IHZpZGVvVXJsOiB2VXJsLCB0aXRsZTogaXRlbS50aXRsZSwgdGh1bWI6IGl0ZW0udGh1bWJuYWlsIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMS41IHJvdW5kZWQtbGcgYmctdmlvbGV0LTUwMC8xNSB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIGhvdmVyOmJnLXZpb2xldC01MDAvMjUgdGV4dC1bMTBweF0gZm9udC1ib2xkIGFjdGl2ZTpzY2FsZS05NSBkaXNhYmxlZDpvcGFjaXR5LTQwIHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgS1x1MUVCRiB0aVx1MUVCRnBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJHXHUxRUVEaSBcdTAxMTFcdTFFQzEgeHVcdTFFQTV0IHZpZGVvIG5cdTAwRTB5IGNobyBjaFx1MUVFNyBwaFx1MDBGMm5nIHBoXHUwMEVBIGR1eVx1MUVDN3RcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnc3VnZ2VzdCcsIHsgdmlkZW9Vcmw6IHZVcmwsIHRpdGxlOiBpdGVtLnRpdGxlLCB0aHVtYjogaXRlbS50aHVtYm5haWwgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC1sZyBiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLWFtYmVyLTUwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC14cyBzaGFkb3ctbWQgaG92ZXI6YnJpZ2h0bmVzcy0xMTAgYWN0aXZlOnNjYWxlLTk1IGRpc2FibGVkOm9wYWNpdHktNDAgd2hpdGVzcGFjZS1ub3dyYXAgY3Vyc29yLXBvaW50ZXIgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0ExPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHUwMTEwXHUxRUMxIHh1XHUxRUE1dCBjaG8gY2hcdTFFRTcgcGhcdTAwRjJuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgLyogR1x1MUVFM2kgXHUwMEZEIHRcdTFFRUIga2hcdTAwRjNhIHRcdTAwRUNtIGtpXHUxRUJGbSBuaGFuaCArIGtodW5nIHRoXHUwMEY0bmcgdGluIGdpXHUxRUVGIGNoaVx1MUVDMXUgY2FvIGNcdTFFRDEgXHUwMTExXHUxRUNCbmggKi9cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtMS41IHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCBmb250LWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIEdcdTFFRTNpIFx1MDBGRCBjaFx1MUVFNyBcdTAxMTFcdTFFQzEgaFx1MUVDRGMgdFx1MUVBRHAgJiB0aFx1MDFCMCBnaVx1MDBFM246XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZmxleC13cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1RDgzQ1x1REZBNyBMb2ZpIGhcdTFFQ0RjIHRcdTFFQURwJywgcTogJ2xvZmkgaGlwIGhvcCByYWRpbyBiZWF0cyB0byByZWxheCBzdHVkeSB0bycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHVEODNDXHVERjI3XHVGRTBGIFRpXHUxRUJGbmcgbVx1MDFCMGEgJiBQaWFubycsIHE6ICdyYWluIHNvdW5kcyByZWxheGluZyBwaWFubyBzdHVkeSBmb2N1cycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHUyNjE1IE5oXHUxRUExYyBxdVx1MDBFMW4gY1x1MDBFMCBwaFx1MDBFQScsIHE6ICdjb2ZmZWUgc2hvcCBqYXp6IHBpYW5vIGNoaWxsIHN0dWR5JyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdcdUQ4M0RcdURDREEgVFx1MUVBRHAgdHJ1bmcgXHUwMEY0biB0aGknLCBxOiAnc3R1ZHkgbXVzaWMgYWxwaGEgd2F2ZXMgY29uY2VudHJhdGlvbicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHVEODNEXHVERDJDIFRoXHUwMEVEIG5naGlcdTFFQzdtIEhcdTAwRjNhIGhcdTFFQ0RjJywgcTogJ3RoXHUwMEVEIG5naGlcdTFFQzdtIGhcdTAwRjNhIGhcdTFFQ0RjIHRoXHUwMEZBIHZcdTFFQ0InIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIF0ubWFwKChjaGlwKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtjaGlwLnF9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB0aW1LaWVtWW91VHViZShlLCBjaGlwLnEpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC1bMTFweF0gdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtjaGlwLmxhYmVsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC0zIGJnLVsjMEIwRTE0XS82MCBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC14bCB0ZXh0LWNlbnRlciB0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIGdhcC0xIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteGxcIj5cdUQ4M0RcdURDRkE8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge2NhbkNvbnRyb2wgPyAnVFx1MDBFQ20ga2lcdTFFQkZtICYgUGhcdTAwRTF0IHZpZGVvIFlvdVR1YmUnIDogJ1RcdTAwRUNtIGtpXHUxRUJGbSAmIFx1MDExMFx1MUVDMSB4dVx1MUVBNXQgdmlkZW8gWW91VHViZSd9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCBtYXgtdy1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7Y2FuQ29udHJvbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ05oXHUxRUFEcCB0XHUxRUVCIGtoXHUwMEYzYSBiXHUwMEUwaSBoXHUxRUNEYyBob1x1MUVCN2MgZFx1MDBFMW4gbGlcdTAwRUFuIGtcdTFFQkZ0IFlvdVR1YmUgXHUxRURGIHRyXHUwMEVBbiBcdTAxMTFcdTFFQzMgdFx1MDBFQ20ga2lcdTFFQkZtIHZcdTAwRTAgcGhcdTAwRTF0IFx1MDExMVx1MUVEM25nIGJcdTFFRDkgY2hvIHRcdTFFQTV0IGNcdTFFQTMgdGhcdTAwRTBuaCB2aVx1MDBFQW4gdHJvbmcgcGhcdTAwRjJuZy4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnTmhcdTFFQURwIHRcdTFFRUIga2hcdTAwRjNhIGhvXHUxRUI3YyBkXHUwMEUxbiBsaVx1MDBFQW4ga1x1MUVCRnQgWW91VHViZSBcdTFFREYgdHJcdTAwRUFuIFx1MDExMVx1MUVDMyB0XHUwMEVDbSBraVx1MUVCRm0gdmlkZW8gdlx1MDBFMCBcdTAxMTFcdTFFQzEgeHVcdTFFQTV0IGNobyBjaFx1MUVFNyBwaFx1MDBGMm5nIGR1eVx1MUVDN3QgcGhcdTAwRTF0Lid9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICB7LyogVEFCIDI6IFFVXHUxRUEyTiBMXHUwMEREIEhcdTAwQzBORyBcdTAxMTBcdTFFRTJJIChRVUVVRSkgKi99XG4gICAgICAgICAgICAgIHttZWRpYVRhYiA9PT0gJ3F1ZXVlJyAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLWZ1bGwgZmxleCBmbGV4LWNvbCBnYXAtMi41IG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGZsZXgtd3JhcCBnYXAtMiBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTMwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0NCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPkhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHZpZGVvICh7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RofSBjaFx1MUVERCk8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7Y2FuQ29udHJvbCAmJiBxdWV1ZUxpc3Quc29tZShxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtcXVldWUtc2tpcFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3NraXAnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1hbWJlci01MDAvMTUgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6YmctYW1iZXItNTAwLzI1IGRpc2FibGVkOm9wYWNpdHktNDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHUyM0VEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5CXHUxRUNGIHF1YSAvIEJcdTAwRTBpIHRpXHUxRUJGcDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0YWlRdWV1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiTFx1MDBFMG0gbVx1MUVEQmkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMiBweS0xIHJvdW5kZWQtbGcgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHRleHQteHMgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNEXHVERDA0XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBUaFx1MDBFQW0gbGluayBuaGFuaCB2XHUwMEUwbyBxdWV1ZSAvIFx1MDExMFx1MUVDMSB4dVx1MUVBNXQgdmlkZW8gKi99XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgIDxRdWV1ZUlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgY2FuQ29udHJvbD17Y2FuQ29udHJvbH1cbiAgICAgICAgICAgICAgICAgICAgICBvbkFkZD17KHUsIHQpID0+IGhhbmhEb25nUXVldWUoJ2VucXVldWUnLCB7IHZpZGVvVXJsOiB1LCB0aXRsZTogdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkFkZE5leHQ9eyh1LCB0KSA9PiBoYW5oRG9uZ1F1ZXVlKCdhZGRfbmV4dCcsIHsgdmlkZW9Vcmw6IHUsIHRpdGxlOiB0IH0pfVxuICAgICAgICAgICAgICAgICAgICAgIG9uU3VnZ2VzdD17KHUsIHQpID0+IGhhbmhEb25nUXVldWUoJ3N1Z2dlc3QnLCB7IHZpZGVvVXJsOiB1LCB0aXRsZTogdCB8fCAnVmlkZW8gXHUwMTExXHUxRUMxIHh1XHUxRUE1dCcgfSl9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgey8qIERhbmggc1x1MDBFMWNoIFx1MDExMVx1MUVDMSB4dVx1MUVBNXQgdFx1MUVFQiB0aFx1MDBFMG5oIHZpXHUwMEVBbiAqL31cbiAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3Quc29tZShxID0+IHEudHJhbmdUaGFpID09PSAnc3VnZ2VzdGVkJykgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLWFtYmVyLTk1MC8yNSBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMCByb3VuZGVkLXhsIHAtMi41IGZsZXggZmxleC1jb2wgZ2FwLTIgc2hyaW5rLTAgYW5pbWF0ZS1mYWRlSW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1hbWJlci0zMDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQTE8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtjYW5Db250cm9sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGBWaWRlbyBcdTAxMTFcdTFFQzEgeHVcdTFFQTV0IHRcdTFFRUIgdGhcdTAwRTBuaCB2aVx1MDBFQW4gKCR7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAnc3VnZ2VzdGVkJykubGVuZ3RofSlgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGBcdTAxMTBcdTFFQzEgeHVcdTFFQTV0IFx1MDExMWFuZyBjaFx1MUVERCBjaFx1MUVFNyBwaFx1MDBGMm5nIGR1eVx1MUVDN3QgKCR7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAnc3VnZ2VzdGVkJykubGVuZ3RofSlgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7Y2FuQ29udHJvbCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtYW1iZXItNDAwLzkwIGZvbnQtYm9sZCBiZy1hbWJlci01MDAvMTUgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgcHgtMiBweS0wLjUgcm91bmRlZC1mdWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2hcdTFFREQgYlx1MUVBMW4gZHV5XHUxRUM3dFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjUgbWF4LWgtMzYgb3ZlcmZsb3cteS1hdXRvIHByLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtxdWV1ZUxpc3QuZmlsdGVyKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdzdWdnZXN0ZWQnKS5tYXAoKHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNNaW5lID0gcy5hZGRlZEJ5S2hvYSA9PT0gcGhvbmdNaW5oS2hvYTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17cy5pZH0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzIwIHJvdW5kZWQtbGcgcC0xLjUgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzLnRodW1iICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3MudGh1bWJ9IGFsdD1cIlwiIGNsYXNzTmFtZT1cInctMTIgaC03IHJvdW5kZWQgb2JqZWN0LWNvdmVyIHNocmluay0wIGJvcmRlciBib3JkZXItd2hpdGUvMTBcIiBsb2FkaW5nPVwibGF6eVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgbWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMjAwIGZvbnQtYm9sZCB0cnVuY2F0ZVwiIHRpdGxlPXtzLnRpdGxlIHx8IHMudmlkZW9Vcmx9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzLnRpdGxlIHx8IHMudmlkZW9Vcmx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1hbWJlci00MDAvODAgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTAxMTBcdTFFQzEgeHVcdTFFQTV0IGJcdTFFREZpOiA8c3BhbiBjbGFzc05hbWU9e2lzTWluZSA/ICd0ZXh0LWN5YW4tMzAwIGZvbnQtYm9sZCcgOiAnJ30+e2lzTWluZSA/ICdCXHUxRUExbicgOiAocy5hZGRlZEJ5IHx8ICdUaFx1MDBFMG5oIHZpXHUwMEVBbicpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtjYW5Db250cm9sID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkR1eVx1MUVDN3Qgdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdhcHByb3ZlX3N1Z2dlc3Rpb24nLCB7IGlkOiBzLmlkLCBwbGF5Tm93OiBmYWxzZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMiBweS0xIHJvdW5kZWQgYmctZW1lcmFsZC01MDAvMjAgdGV4dC1lbWVyYWxkLTMwMCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8zMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzEzIEhcdTAwRTBuZyBjaFx1MUVERFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkR1eVx1MUVDN3Qgdlx1MDBFMCBwaFx1MDBFMXQgbmdheSBsXHUxRUFEcCB0XHUxRUU5Y1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ2FwcHJvdmVfc3VnZ2VzdGlvbicsIHsgaWQ6IHMuaWQsIHBsYXlOb3c6IHRydWUgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIgcHktMSByb3VuZGVkIGJnLWN5YW4tNTAwLzIwIHRleHQtY3lhbi0zMDAgaG92ZXI6YmctY3lhbi01MDAvMzAgYm9yZGVyIGJvcmRlci1jeWFuLTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNiBQaFx1MDBFMXQgbmdheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlRcdTFFRUIgY2hcdTFFRDFpIFx1MDExMVx1MUVDMSB4dVx1MUVBNXQgblx1MDBFMHlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdyZWplY3Rfc3VnZ2VzdGlvbicsIHsgaWQ6IHMuaWQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctNiBoLTYgcm91bmRlZCBiZy1yb3NlLTUwMC8yMCB0ZXh0LXJvc2UtMzAwIGhvdmVyOmJnLXJvc2UtNTAwLzMwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdGV4dC14cyBmb250LWJvbGQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNNaW5lICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiSFx1MUVFN3kgXHUwMTExXHUxRUMxIHh1XHUxRUE1dCBjXHUxRUU3YSBiXHUxRUExblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3JlamVjdF9zdWdnZXN0aW9uJywgeyBpZDogcy5pZCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMiBweS0xIHJvdW5kZWQgYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTMwMCBob3ZlcjpiZy1yb3NlLTUwMC8yNSBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSFx1MUVFN3kgXHUwMTExXHUxRUMxIHh1XHUxRUE1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICB7LyogRGFuaCBzXHUwMEUxY2ggdmlkZW8gdHJvbmcgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgY2hcdTAwRURuaCB0aFx1MUVFOWMgKi99XG4gICAgICAgICAgICAgICAgICB7KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2ZmaWNpYWxRdWV1ZSA9IHF1ZXVlTGlzdC5maWx0ZXIocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3BsYXlpbmcnIHx8IHEudHJhbmdUaGFpID09PSAncXVldWVkJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvZmZpY2lhbFF1ZXVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTQgYmctWyMwQjBFMTRdLzYwIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLXhsIHRleHQtY2VudGVyIHRleHQteHMgdGV4dC1zbGF0ZS00MDAgZ2FwLTEuNSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtMnhsXCI+XHVEODNEXHVEQ0NCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDBcIj5IXHUwMEUwbmcgXHUwMTExXHUxRUUzaSBoaVx1MUVDN24gXHUwMTExYW5nIHRyXHUxRUQxbmc8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwIG1heC13LXNtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2NhbkNvbnRyb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ0NodXlcdTFFQzNuIHNhbmcgdGFiIFRcdTAwRUNtIFlvdVR1YmUgaG9cdTFFQjdjIGRcdTAwRTFuIGxpXHUwMEVBbiBrXHUxRUJGdCB2XHUwMEUwbyBcdTAwRjQgdHJcdTAwRUFuIFx1MDExMVx1MUVDMyBcdTAxMTFcdTAxQjBhIHZpZGVvIHZcdTAwRTBvIGRhbmggc1x1MDBFMWNoIHBoXHUwMEUxdCBsaVx1MDBFQW4gdFx1MUVFNWMuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnQ2hcdTAxQjBhIGNcdTAwRjMgdmlkZW8gblx1MDBFMG8gdHJvbmcgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgcGhcdTAwRTF0LiBCXHUxRUExbiBjXHUwMEYzIHRoXHUxRUMzIHRcdTAwRUNtIGtpXHUxRUJGbSB2XHUwMEUwIFx1MDExMVx1MUVDMSB4dVx1MUVBNXQgdmlkZW8gY2hvIGNoXHUxRUU3IHBoXHUwMEYybmcgZHV5XHUxRUM3dC4nfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgc3BhY2UteS0xLjUgb3ZlcmZsb3cteS1hdXRvIHByLTEgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge29mZmljaWFsUXVldWUubWFwKChxLCBpZHgpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17cS5pZCB8fCBpZHh9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSBiZy1bIzBCMEUxNF0gYm9yZGVyIHJvdW5kZWQteGwgcC0yIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxLnRyYW5nVGhhaSA9PT0gJ3BsYXlpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JvcmRlci1lbWVyYWxkLTUwMC80MCBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoNTIsMjExLDE1MywwLjE1KV0gYmctZW1lcmFsZC05NTAvMjAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JvcmRlci13aGl0ZS81IGhvdmVyOmJvcmRlci13aGl0ZS8xNSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNiBoLTYgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LVsxMXB4XSBmb250LWJsYWNrIHNocmluay0wICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHEudHJhbmdUaGFpID09PSAncGxheWluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1lbWVyYWxkLTUwMCB0ZXh0LWJsYWNrIHNoYWRvdy1bMF8wXzEwcHhfcmdiYSg1MiwyMTEsMTUzLDAuNCldJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzEwIHRleHQtc2xhdGUtNDAwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncGxheWluZycgPyAnXHUyNUI2JyA6IGlkeCArIDF9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudGh1bWIgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3EudGh1bWJ9IGFsdD1cIlwiIGNsYXNzTmFtZT1cInctMTIgaC03IHJvdW5kZWQtbWQgb2JqZWN0LWNvdmVyIHNocmluay0wIGJvcmRlciBib3JkZXItd2hpdGUvMTBcIiBsb2FkaW5nPVwibGF6eVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS0yMDAgZm9udC1ib2xkIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRpdGxlIHx8IHEudmlkZW9Vcmx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cS50cmFuZ1RoYWkgPT09ICdwbGF5aW5nJyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWVtZXJhbGQtNDAwIGZvbnQtYm9sZFwiPlx1MjVDRiBcdTAxMTBhbmcgcGhcdTAwRTF0PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlRoXHUwMEVBbSBiXHUxRURGaToge3EuYWRkZWRCeSB8fCAnVGhcdTAwRTBuaCB2aVx1MDBFQW4nfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtjYW5Db250cm9sICYmIHEudHJhbmdUaGFpID09PSAncXVldWVkJyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiUGhcdTAwRTF0IHZpZGVvIG5cdTAwRTB5IG5nYXlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3BsYXlfbm93JywgeyBpZDogcS5pZCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGhvdmVyOmJnLVsjMDBGMkZFXS8zMCB0ZXh0LXhzIGZvbnQtYmxhY2sgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2IFBoXHUwMEUxdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiWFx1MDBGM2Ega2hcdTFFQ0ZpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdyZW1vdmUnLCB7IGlkOiBxLmlkIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy03IGgtNyByb3VuZGVkLWxnIGJnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS0zMDAgaG92ZXI6Ymctcm9zZS01MDAvMjUgdGV4dC14cyBmb250LWJsYWNrIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9KSgpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cbiAgICA8L2Rpdj5cblxuICApO1xufVxuXG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDb21wb25lbnQ6IENhbXB1cyBGb2N1cyBSb29tIChTdHVkeSBDYWZcdTAwRTkgJiBQb21vZG9ybyBTZXNzaW9uKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBmdW5jdGlvbiBDYW1wdXNGb2N1c1Jvb20oe1xuICBwaG9uZyxcbiAgcGhvbmdNaW5oS2hvYSxcbiAgYXV0aCxcbiAgZG9uZ1Bob25nSGllblRhaSxcbiAgc29OZ3VvaSxcbiAgaXNGb2N1c01vZGUsXG4gIHNldElzRm9jdXNNb2RlXG59KSB7XG4gIGNvbnN0IFtmb2N1c1N0YXRlLCBzZXRGb2N1c1N0YXRlXSA9IHVzZVN0YXRlKHtcbiAgICBwaGFzZTogJ2ZvY3VzJyxcbiAgICBzdGF0dXM6ICdwYXVzZWQnLFxuICAgIGR1cmF0aW9uU2Vjb25kczogMTUwMCxcbiAgICByZW1haW5pbmdTZWNvbmRzOiAxNTAwLFxuICAgIHByZXNldDogJzI1XzUnLFxuICAgIHJldmlzaW9uOiAxLFxuICAgIGNhbkNvbnRyb2w6IGZhbHNlLFxuICAgIHVwZGF0ZWRBdDogbnVsbCxcbiAgICBzZXJ2ZXJOb3c6IG51bGxcbiAgfSk7XG4gIGNvbnN0IFtsb2NhbFJlbWFpbmluZywgc2V0TG9jYWxSZW1haW5pbmddID0gdXNlU3RhdGUoMTUwMCk7XG4gIGNvbnN0IFtkYW5nR3VpTGVuaCwgc2V0RGFuZ0d1aUxlbmhdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9pLCBzZXRMb2ldID0gdXNlU3RhdGUoJycpO1xuXG4gIC8vIEF1ZGlvIHN0YXRlIChBbWJpZW50IHBsYXliYWNrKVxuICBsZXQgY2F1SGluaCA9IHt9O1xuICB0cnkgeyBjYXVIaW5oID0gcGhvbmcuY2F1SGluaCA/IEpTT04ucGFyc2UocGhvbmcuY2F1SGluaCkgOiB7fTsgfSBjYXRjaCB7IC8qIGJcdTFFQ0YgcXVhICovIH1cbiAgY29uc3QgbmhhY1VybCA9IGNhdUhpbmgubmhhY1VybCA/IHVybE1lZGlhRmUoY2F1SGluaC5uaGFjVXJsKSA6ICcnO1xuICBjb25zdCBhdWRpb1JlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgW2F1ZGlvUGxheWluZywgc2V0QXVkaW9QbGF5aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2F1ZGlvVm9sdW1lLCBzZXRBdWRpb1ZvbHVtZV0gPSB1c2VTdGF0ZSgwLjUpO1xuICBjb25zdCBbYXVkaW9NdXRlZCwgc2V0QXVkaW9NdXRlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtoYXNJbnRlcmFjdGVkQXVkaW8sIHNldEhhc0ludGVyYWN0ZWRBdWRpb10gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgLy8gQXV0aG9yaXphdGlvblxuICBjb25zdCBbY2FuQ29udHJvbCwgc2V0Q2FuQ29udHJvbF0gPSB1c2VTdGF0ZShCb29sZWFuKGF1dGgudXNlcj8uaXNUZWFjaGVyIHx8IHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nKSk7XG4gIGNvbnN0IGlzSG9zdCA9IGNhbkNvbnRyb2w7XG5cbiAgLy8gU3luYyBzdGF0ZSByZWNvbmNpbGlhdGlvbiBoZWxwZXJcbiAgY29uc3QgYXBEdW5nRm9jdXNTdGF0ZSA9IChzdCkgPT4ge1xuICAgIGlmICghc3QpIHJldHVybjtcbiAgICBzZXRGb2N1c1N0YXRlKHN0KTtcbiAgICBjb25zdCByZW0gPSBOdW1iZXIoc3QucmVtYWluaW5nU2Vjb25kcyA/PyAxNTAwKTtcbiAgICBzZXRMb2NhbFJlbWFpbmluZyhyZW0pO1xuICB9O1xuXG4gIC8vIDEuIFBvbGxpbmcgRm9jdXMgU3RhdGUgKGV2ZXJ5IDMwMDBtcykgd2l0aCB2aXNpYmlsaXR5IHJlY29uY2lsaWF0aW9uICYgc3RyaWN0IGNsZWFudXBcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcblxuICAgIGNvbnN0IGZldGNoRm9jdXMgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1mb2N1cz9waG9uZ0lkPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHBob25nLmlkKX1gKTtcbiAgICAgICAgaWYgKCFyZXMub2spIHJldHVybjtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChhY3RpdmUgJiYgZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkLmNhbkNvbnRyb2wgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgc2V0Q2FuQ29udHJvbChkLmNhbkNvbnRyb2wpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhcER1bmdGb2N1c1N0YXRlKGQuc3RhdGUpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLyogYlx1MUVDRiBxdWEga2hpIGhcdTFFRTd5IGtcdTFFQkZ0IG5cdTFFRDFpICovXG4gICAgICB9XG4gICAgfTtcblxuICAgIGZldGNoRm9jdXMoKTtcbiAgICBjb25zdCB0aW1lciA9IHNldEludGVydmFsKGZldGNoRm9jdXMsIDMwMDApO1xuXG4gICAgY29uc3QgaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSA9ICgpID0+IHtcbiAgICAgIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09ICd2aXNpYmxlJyAmJiBhY3RpdmUpIHtcbiAgICAgICAgZmV0Y2hGb2N1cygpO1xuICAgICAgfVxuICAgIH07XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UpO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSk7XG4gICAgfTtcbiAgfSwgW3Bob25nLmlkXSk7XG5cbiAgLy8gMi4gTG9jYWwgQ291bnRkb3duIFRpY2sgKGV2ZXJ5IDEwMDBtcyB3aGVuIHN0YXR1cyA9PT0gJ3J1bm5pbmcnKVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChmb2N1c1N0YXRlLnN0YXR1cyAhPT0gJ3J1bm5pbmcnKSByZXR1cm47XG4gICAgY29uc3QgdGljayA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHNldExvY2FsUmVtYWluaW5nKHIgPT4gTWF0aC5tYXgoMCwgciAtIDEpKTtcbiAgICB9LCAxMDAwKTtcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbCh0aWNrKTtcbiAgfSwgW2ZvY3VzU3RhdGUuc3RhdHVzXSk7XG5cbiAgLy8gMy4gQ29tbWFuZCBkaXNwYXRjaGVyIHdpdGggb3B0aW1pc3RpYyBjb25jdXJyZW5jeSAocmV2aXNpb24gY2hlY2sgJiBjb25mbGljdCBoYW5kbGluZylcbiAgY29uc3QgZ3VpTGVuaCA9IGFzeW5jIChhY3Rpb24sIGV4dHJhUGF5bG9hZCA9IHt9KSA9PiB7XG4gICAgaWYgKGRhbmdHdWlMZW5oKSByZXR1cm47XG4gICAgc2V0RGFuZ0d1aUxlbmgodHJ1ZSk7XG4gICAgc2V0TG9pKCcnKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1mb2N1cycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgYWN0aW9uLFxuICAgICAgICAgIGV4cGVjdGVkUmV2aXNpb246IGZvY3VzU3RhdGUucmV2aXNpb24sXG4gICAgICAgICAgLi4uZXh0cmFQYXlsb2FkXG4gICAgICAgIH0pXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgIGFwRHVuZ0ZvY3VzU3RhdGUoZC5zdGF0ZSk7XG4gICAgICB9IGVsc2UgaWYgKHJlcy5zdGF0dXMgPT09IDQwOSAmJiBkLnN0YXRlKSB7XG4gICAgICAgIC8vIENvbmN1cnJlbmN5IGNvbmZsaWN0OiBhZG9wdCBsYXRlc3Qgc2VydmVyIHN0YXRlXG4gICAgICAgIGFwRHVuZ0ZvY3VzU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIHNldExvaSgnXHUwMTEwXHUwMEUzIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgbFx1MUVBMWkgcGhpXHUwMEVBbiB0aGVvIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0TG9pKGQubG9pIHx8ICdLaFx1MDBGNG5nIHRoXHUxRUMzIGNcdTFFQURwIG5oXHUxRUFEdCB0clx1MUVBMW5nIHRoXHUwMEUxaSBwaFx1MDBGMm5nIGhcdTFFQ0RjIHRcdTFFQURwLicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0TG9pKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RGFuZ0d1aUxlbmgoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyA0LiBBbWJpZW50IEF1ZGlvIENvbnRyb2xzXG4gIGNvbnN0IGJhdEFtVGhhbmggPSAoKSA9PiB7XG4gICAgc2V0SGFzSW50ZXJhY3RlZEF1ZGlvKHRydWUpO1xuICAgIGlmIChhdWRpb1JlZi5jdXJyZW50KSB7XG4gICAgICBhdWRpb1JlZi5jdXJyZW50LnBsYXkoKS50aGVuKCgpID0+IHtcbiAgICAgICAgc2V0QXVkaW9QbGF5aW5nKHRydWUpO1xuICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS53YXJuKCdBdXRvcGxheSBibG9ja2VkIG9yIGF1ZGlvIGxvYWQgZXJyb3I6JywgZXJyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB0b2dnbGVBdWRpb1BsYXkgPSAoKSA9PiB7XG4gICAgaWYgKCFhdWRpb1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgaWYgKGF1ZGlvUGxheWluZykge1xuICAgICAgYXVkaW9SZWYuY3VycmVudC5wYXVzZSgpO1xuICAgICAgc2V0QXVkaW9QbGF5aW5nKGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYmF0QW1UaGFuaCgpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB0b2dnbGVBdWRpb011dGUgPSAoKSA9PiB7XG4gICAgaWYgKCFhdWRpb1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgY29uc3QgbmV3TXV0ZSA9ICFhdWRpb011dGVkO1xuICAgIGF1ZGlvUmVmLmN1cnJlbnQubXV0ZWQgPSBuZXdNdXRlO1xuICAgIHNldEF1ZGlvTXV0ZWQobmV3TXV0ZSk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlVm9sdW1lQ2hhbmdlID0gKGUpID0+IHtcbiAgICBjb25zdCB2YWwgPSBwYXJzZUZsb2F0KGUudGFyZ2V0LnZhbHVlKTtcbiAgICBzZXRBdWRpb1ZvbHVtZSh2YWwpO1xuICAgIGlmIChhdWRpb1JlZi5jdXJyZW50KSB7XG4gICAgICBhdWRpb1JlZi5jdXJyZW50LnZvbHVtZSA9IHZhbDtcbiAgICAgIGlmICh2YWwgPiAwICYmIGF1ZGlvTXV0ZWQpIHtcbiAgICAgICAgYXVkaW9SZWYuY3VycmVudC5tdXRlZCA9IGZhbHNlO1xuICAgICAgICBzZXRBdWRpb011dGVkKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgY29uc3QgaXNCcmVhayA9IGZvY3VzU3RhdGUucGhhc2UgPT09ICdicmVhayc7XG4gIGNvbnN0IGlzUnVubmluZyA9IGZvY3VzU3RhdGUuc3RhdHVzID09PSAncnVubmluZyc7XG4gIGNvbnN0IGR1cmF0aW9uID0gZm9jdXNTdGF0ZS5kdXJhdGlvblNlY29uZHMgfHwgKGlzQnJlYWsgPyAzMDAgOiAxNTAwKTtcbiAgY29uc3QgcHJvZ3Jlc3NQZXJjZW50ID0gTWF0aC5taW4oMTAwLCBNYXRoLm1heCgwLCAoKGR1cmF0aW9uIC0gbG9jYWxSZW1haW5pbmcpIC8gZHVyYXRpb24pICogMTAwKSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTQgbWluLXctMCB3LWZ1bGxcIj5cbiAgICAgIHsvKiBIaWRkZW4gQXVkaW8gZWxlbWVudCBmb3IgYW1iaWVudCBzb3VuZHRyYWNrICovfVxuICAgICAge25oYWNVcmwgJiYgKFxuICAgICAgICA8YXVkaW9cbiAgICAgICAgICByZWY9e2F1ZGlvUmVmfVxuICAgICAgICAgIHNyYz17bmhhY1VybH1cbiAgICAgICAgICBsb29wXG4gICAgICAgICAgcHJlbG9hZD1cIm5vbmVcIlxuICAgICAgICAgIG9uRW5kZWQ9eygpID0+IHNldEF1ZGlvUGxheWluZyhmYWxzZSl9XG4gICAgICAgICAgb25FcnJvcj17KCkgPT4gc2V0QXVkaW9QbGF5aW5nKGZhbHNlKX1cbiAgICAgICAgLz5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBIZWFkZXIgYmFyOiBQcmVzZW5jZSwgSG9zdCBiYWRnZSwgRm9jdXMgTW9kZSB0b2dnbGUsIENsb3NlIFJvb20gKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNCBmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zIHNoYWRvdy1sZ1wiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHB4LTIuNSBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgYm9yZGVyICR7cGhvbmcucGhhbVZpID09PSAndHJ1b25nJyA/ICdiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtNDAwIGJvcmRlci1lbWVyYWxkLTUwMC8zMCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAge3Bob25nLnBoYW1WaSA9PT0gJ3RydW9uZycgPyAnXHVEODNDXHVERjEwIFRvXHUwMEUwbiB0clx1MDFCMFx1MUVERG5nJyA6IGBcdUQ4M0RcdUREMTIgTFx1MUVEQnAgJHtwaG9uZy5sb3BUZW4gfHwgJyd9YH1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gaWQ9XCJmb2N1cy1ob3N0LWJhZGdlXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgIENoXHUxRUU3IHBoXHUwMEYybmc6IDxzdHJvbmcgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0yMDBcIj57cGhvbmcuY2h1UGhvbmdUZW59PC9zdHJvbmc+XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGlkPVwiZm9jdXMtcm9vbS1wcmVzZW5jZVwiIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHB4LTIuNSBweS0wLjUgcm91bmRlZC1mdWxsIGJnLVsjMDBGMkZFXS8xMCB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8yMCBmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgICBcdUQ4M0RcdURDNjUge3NvTmd1b2kgfHwgMX0gbmdcdTAxQjBcdTFFRERpIFx1MDExMWFuZyBjXHUwMEY5bmcgdFx1MUVBRHAgdHJ1bmdcbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbWwtYXV0b1wiPlxuICAgICAgICAgIHtpc0ZvY3VzTW9kZSAmJiAoXG4gICAgICAgICAgICA8c3BhbiBpZD1cImZvY3VzLW1vZGUtYWN0aXZlLWluZGljYXRvclwiIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXB1cnBsZS00MDAgYmctcHVycGxlLTUwMC8xMCBweC0yIHB5LTAuNSByb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci1wdXJwbGUtNTAwLzIwIGFuaW1hdGUtcHVsc2VcIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERkFGIFx1MDExMGFuZyBiXHUxRUFEdCBGb2N1cyBNb2RlXG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgKX1cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1tb2RlLXRvZ2dsZVwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzRm9jdXNNb2RlKCFpc0ZvY3VzTW9kZSl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7aXNGb2N1c01vZGUgPyAnYmctcHVycGxlLTUwMC8yMCB0ZXh0LXB1cnBsZS0zMDAgYm9yZGVyLXB1cnBsZS01MDAvNDAgc2hhZG93LVswXzBfMTJweF9yZ2JhKDE2OCw4NSwyNDcsMC4zKV0nIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REZBRjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPntpc0ZvY3VzTW9kZSA/ICdcdTIxQTkgVGhvXHUwMEUxdCBGb2N1cyBNb2RlJyA6ICdGb2N1cyBNb2RlJ308L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICB7Y2FuQ29udHJvbCAmJiBwaG9uZy5jaHVQaG9uZ0tob2EgIT09ICdoZS10aG9uZycgJiYgKFxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17ZG9uZ1Bob25nSGllblRhaX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xNSBob3ZlcjpiZy1yb3NlLTUwMC8yNSB0ZXh0LXJvc2UtMzAwIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgXHUwMTEwXHUwMEYzbmcgcGhcdTAwRjJuZ1xuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIE1haW4gRm9jdXMgQ2VudGVycGllY2UgQ2FyZCAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPXtgcmVsYXRpdmUgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtM3hsIGJvcmRlciB0cmFuc2l0aW9uLWFsbCBwLTYgc206cC04IGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyIHNoYWRvdy0yeGwgJHtpc0JyZWFrID8gJ2JnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzFFMTcxMF0gdG8tWyMxMzExMEVdIGJvcmRlci1hbWJlci01MDAvMzAnIDogJ2JnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzBGMUUyOF0gdG8tWyMwQTEyMTldIGJvcmRlci1bIzAwRjJGRV0vMzAnfWB9PlxuICAgICAgICB7LyogR2xvdyBiYWNrZHJvcCBhY2NlbnQgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgYWJzb2x1dGUgLXRvcC0yNCAtbGVmdC0yNCB3LTcyIGgtNzIgcm91bmRlZC1mdWxsIGJsdXItM3hsIG9wYWNpdHktMjAgcG9pbnRlci1ldmVudHMtbm9uZSAke2lzQnJlYWsgPyAnYmctYW1iZXItNTAwJyA6ICdiZy1bIzAwRjJGRV0nfWB9IC8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgYWJzb2x1dGUgLWJvdHRvbS0yNCAtcmlnaHQtMjQgdy03MiBoLTcyIHJvdW5kZWQtZnVsbCBibHVyLTN4bCBvcGFjaXR5LTIwIHBvaW50ZXItZXZlbnRzLW5vbmUgJHtpc0JyZWFrID8gJ2JnLW9yYW5nZS01MDAnIDogJ2JnLWluZGlnby01MDAnfWB9IC8+XG5cbiAgICAgICAgey8qIFBoYXNlICYgU3RhdHVzIEJhZGdlcyAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTIuNSBtYi02IHotMTBcIj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgaWQ9XCJmb2N1cy1waGFzZS1iYWRnZVwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LWV4dHJhYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgYm9yZGVyIHNoYWRvdy1zbSAke2lzQnJlYWsgPyAnYmctYW1iZXItNTAwLzE1IHRleHQtYW1iZXItMzAwIGJvcmRlci1hbWJlci01MDAvNDAnIDogJ2JnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXItWyMwMEYyRkVdLzQwJ31gfT5cbiAgICAgICAgICAgIHtpc0JyZWFrID8gJ1x1MjYxNSBHaVx1MUVERCBOZ2hcdTFFQzkgTmdcdTAxQTFpIChCcmVhayknIDogJ1x1RDgzQ1x1REY0NSBQaGlcdTAwRUFuIFRcdTFFQURwIFRydW5nIChGb2N1cyknfVxuICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBpZD1cImZvY3VzLXN0YXR1cy1iYWRnZVwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIHB5LTEgcm91bmRlZC1mdWxsIHRleHQteHMgZm9udC1ib2xkIGJvcmRlciBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41ICR7aXNSdW5uaW5nID8gJ2JnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC00MDAgYm9yZGVyLWVtZXJhbGQtNTAwLzMwJyA6ICdiZy1zbGF0ZS01MDAvMTUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXNsYXRlLTUwMC8zMCd9YH0+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B3LTIgaC0yIHJvdW5kZWQtZnVsbCAke2lzUnVubmluZyA/ICdiZy1lbWVyYWxkLTQwMCBhbmltYXRlLXB1bHNlJyA6ICdiZy1zbGF0ZS00MDAnfWB9IC8+XG4gICAgICAgICAgICA8c3Bhbj57aXNSdW5uaW5nID8gJ1x1MDExMGFuZyBcdTAxMTFcdTFFQkZtJyA6ICdUXHUxRUExbSBkXHUxRUVCbmcnfTwvc3Bhbj5cbiAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1wcmVzZXQtdG9nZ2xlXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgZGlzYWJsZWQ9eyFjYW5Db250cm9sIHx8IGRhbmdHdWlMZW5ofVxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gY2FuQ29udHJvbCAmJiBndWlMZW5oKCdzZXRfcHJlc2V0JywgeyBwcmVzZXQ6IGZvY3VzU3RhdGUucHJlc2V0ID09PSAnNTBfMTAnID8gJzI1XzUnIDogJzUwXzEwJyB9KX1cbiAgICAgICAgICAgIHRpdGxlPXtjYW5Db250cm9sID8gJ0JcdTFFQTVtIFx1MDExMVx1MUVDMyBcdTAxMTFcdTFFRDVpIGNodSBrXHUxRUYzIFBvbW9kb3JvJyA6ICdDaHUga1x1MUVGMyBQb21vZG9ybyBoaVx1MUVDN24gdFx1MUVBMWknfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtbW9ubyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7Y2FuQ29udHJvbCA/ICdob3ZlcjpzY2FsZS0xMDUgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyIGJnLXdoaXRlLzEwIHRleHQtd2hpdGUgYm9yZGVyLXdoaXRlLzIwJyA6ICdjdXJzb3ItZGVmYXVsdCBiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICBcdTI2OTlcdUZFMEYge2ZvY3VzU3RhdGUucHJlc2V0ID09PSAnNTBfMTAnID8gJzUwIC8gMTAgcGhcdTAwRkF0JyA6ICcyNSAvIDUgcGhcdTAwRkF0J31cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIE1hc3NpdmUgVGltZXIgRGlzcGxheSAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteS0yIHNtOm15LTQgei0xMFwiPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBpZD1cImZvY3VzLXRpbWVyLWRpc3BsYXlcIlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgZm9udC1tb25vIHRleHQtNnhsIHNtOnRleHQtOHhsIGZvbnQtYmxhY2sgdHJhY2tpbmctd2lkZXN0IGJsb2NrIHRyYW5zaXRpb24tYWxsIHNlbGVjdC1ub25lICR7aXNCcmVhayA/ICd0ZXh0LWFtYmVyLTMwMCBkcm9wLXNoYWRvdy1bMF8wXzM1cHhfcmdiYSgyNDUsMTU4LDExLDAuMzUpXScgOiAndGV4dC1bIzAwRjJGRV0gZHJvcC1zaGFkb3ctWzBfMF8zNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSd9YH0+XG4gICAgICAgICAgICB7ZGluaERhbmdHaWF5UGh1dChsb2NhbFJlbWFpbmluZyl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogUHJvZ3Jlc3MgYmFyICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy1tZCBoLTIgYmctYmxhY2svNDAgcm91bmRlZC1mdWxsIG92ZXJmbG93LWhpZGRlbiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIG15LTQgei0xMFwiPlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGgtZnVsbCB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0xMDAwICR7aXNCcmVhayA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLW9yYW5nZS01MDAnIDogJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzQjgyRjZdJ31gfVxuICAgICAgICAgICAgc3R5bGU9e3sgd2lkdGg6IGAke3Byb2dyZXNzUGVyY2VudH0lYCB9fVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBDb250cm9sIEJ1dHRvbnMgZm9yIEhvc3QvVGVhY2hlciAqL31cbiAgICAgICAge2NhbkNvbnRyb2wgPyAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTMgbXQtNCB6LTEwXCI+XG4gICAgICAgICAgICB7IWlzUnVubmluZyA/IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXN0YXJ0XCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgnc3RhcnQnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC02IHB5LTMgcm91bmRlZC0yeGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLWVtZXJhbGQtNDAwIHRvLXRlYWwtNTAwIGhvdmVyOmZyb20tZW1lcmFsZC0zMDAgaG92ZXI6dG8tdGVhbC00MDAgdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQtc20gc2hhZG93LVswXzBfMjBweF9yZ2JhKDUyLDIxMSwxNTMsMC4zKV0gYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTI1QjY8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVBRnQgXHUwMTExXHUxRUE3dTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtcGF1c2VcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdwYXVzZScpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMyByb3VuZGVkLTJ4bCBiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLW9yYW5nZS01MDAgaG92ZXI6ZnJvbS1hbWJlci0zMDAgaG92ZXI6dG8tb3JhbmdlLTQwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC1zbSBzaGFkb3ctWzBfMF8yMHB4X3JnYmEoMjUxLDE5MSwzNiwwLjMpXSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjNGODwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5UXHUxRUExbSBkXHUxRUVCbmc8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1yZXNldFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3Jlc2V0Jyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMyByb3VuZGVkLTJ4bCBiZy13aGl0ZS8xMCBob3ZlcjpiZy13aGl0ZS8xNSB0ZXh0LXNsYXRlLTIwMCB0ZXh0LXNtIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDA0PC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTAxMTBcdTFFQjd0IGxcdTFFQTFpPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIHtpc0JyZWFrID8gKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtc3RhcnQtZm9jdXNcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdzdGFydF9mb2N1cycpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMyByb3VuZGVkLTJ4bCBiZy1bIzAwRjJGRV0vMjAgaG92ZXI6YmctWyMwMEYyRkVdLzMwIHRleHQtWyMwMEYyRkVdIHRleHQtc20gZm9udC1ib2xkIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzQwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGQUY8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+Vlx1MDBFMG8gVFx1MUVBRHAgdHJ1bmc8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXN0YXJ0LWJyZWFrXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgnc3RhcnRfYnJlYWsnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTMgcm91bmRlZC0yeGwgYmctYW1iZXItNTAwLzIwIGhvdmVyOmJnLWFtYmVyLTUwMC8zMCB0ZXh0LWFtYmVyLTMwMCB0ZXh0LXNtIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC80MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyNjE1PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPk5naFx1MUVDOSBuZ1x1MDFBMWk8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIG10LTMgei0xMFwiPlxuICAgICAgICAgICAgXHUyM0YzIFx1MDExMFx1MUVEM25nIGhcdTFFRDMgUG9tb2Rvcm8gZG8gY2hcdTFFRTcgcGhcdTAwRjJuZyBcdTAxMTFpXHUxRUMxdSBwaFx1MUVEMWkgXHUyMDE0IGhcdTAwRTN5IHRcdTFFQURwIHRydW5nIGhcdTFFQkZ0IG1cdTAwRUNuaCB2XHUwMEUwbyBjXHUwMEY0bmcgdmlcdTFFQzdjL2hcdTFFQ0RjIHRcdTFFQURwIG5oXHUwMEU5IVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgKX1cblxuICAgICAgICB7bG9pICYmIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1yb3NlLTQwMCBtdC00IHotMTBcIj57bG9pfTwvcD59XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIEFtYmllbnQgQXVkaW8gUGxheWVyIENhcmQgKi99XG4gICAgICB7bmhhY1VybCA/IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTQgc206cC01IGZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtNCBzaGFkb3cteGxcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zLjUgbWluLXctMCB3LWZ1bGwgc206dy1hdXRvXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YHctMTIgaC0xMiByb3VuZGVkLTJ4bCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXhsIHNocmluay0wIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke2F1ZGlvUGxheWluZyA/ICdiZy1bIzhCNUNGNl0vMjAgdGV4dC1bIzhCNUNGNl0gYm9yZGVyLVsjOEI1Q0Y2XS80MCBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMTM5LDkyLDI0NiwwLjMpXSBhbmltYXRlLXB1bHNlJyA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REZBN1xuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi13LTBcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC13aGl0ZSB0cnVuY2F0ZVwiPlx1MDBDMm0gdGhhbmggblx1MUVDMW4gQW1iaWVudDwvcD5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICB7YXVkaW9QbGF5aW5nID8gJ1x1MDExMGFuZyBwaFx1MDBFMXQga2hcdTAwRjRuZyBnaWFuIGhcdTFFQ0RjIHRcdTFFQURwJyA6ICdcdTAwQzJtIHRoYW5oIGNcdTFFRTVjIGJcdTFFRDkgdGhlbyB0aGlcdTFFQkZ0IGJcdTFFQ0InfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0zIHctZnVsbCBzbTp3LWF1dG8ganVzdGlmeS1lbmRcIj5cbiAgICAgICAgICAgIHshaGFzSW50ZXJhY3RlZEF1ZGlvICYmICFhdWRpb1BsYXlpbmcgJiYgKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tc3RhcnQtZm9jdXMtYXVkaW9cIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2JhdEFtVGhhbmh9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjOEI1Q0Y2XSB0by1bIzYzNjZGMV0gdGV4dC13aGl0ZSB0ZXh0LXhzIGZvbnQtYm9sZCBzaGFkb3ctbGcgaG92ZXI6b3BhY2l0eS05MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMEE8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVBRHQgXHUwMEUybSB0aGFuaCB0XHUxRUFEcCB0cnVuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGlkPVwiZm9jdXMtYXVkaW8tdG9nZ2xlXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e3RvZ2dsZUF1ZGlvUGxheX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke2F1ZGlvUGxheWluZyA/ICdiZy1bIzhCNUNGNl0vMjAgdGV4dC1bIzhCNUNGNl0gYm9yZGVyLVsjOEI1Q0Y2XS80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTMwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgICA8c3Bhbj57YXVkaW9QbGF5aW5nID8gJ1x1MjNGOCBUXHUxRUExbSBkXHUxRUVCbmcnIDogJ1x1MjVCNiBQaFx1MDBFMXQgdGlcdTFFQkZwJ308L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlQXVkaW9NdXRlfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTIgcm91bmRlZC14bCBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC14cyB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICB7YXVkaW9NdXRlZCB8fCBhdWRpb1ZvbHVtZSA9PT0gMCA/ICdcdUQ4M0RcdUREMDcnIDogJ1x1RDgzRFx1REQwOSd9XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIHR5cGU9XCJyYW5nZVwiXG4gICAgICAgICAgICAgIG1pbj1cIjBcIlxuICAgICAgICAgICAgICBtYXg9XCIxXCJcbiAgICAgICAgICAgICAgc3RlcD1cIjAuMDVcIlxuICAgICAgICAgICAgICB2YWx1ZT17YXVkaW9NdXRlZCA/IDAgOiBhdWRpb1ZvbHVtZX1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZVZvbHVtZUNoYW5nZX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0yNCBoLTEuNSBiZy13aGl0ZS8xMCByb3VuZGVkLWxnIGFwcGVhcmFuY2Utbm9uZSBjdXJzb3ItcG9pbnRlciBhY2NlbnQtWyM4QjVDRjZdXCJcbiAgICAgICAgICAgICAgdGl0bGU9XCJcdTAwQzJtIGxcdTAxQjBcdTFFRTNuZyBuaFx1MUVBMWMgblx1MUVDMW5cIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC0yeGwgcC00IHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDBcIj5cbiAgICAgICAgICAgIFx1MjYxNSBQaFx1MDBGMm5nIFx1MUVERiBjaFx1MUVCRiBcdTAxMTFcdTFFRDkgdFx1MDEyOW5oIGxcdTFFQjduZyAoY2hcdTAxQjBhIGdcdTFFQUZuIGxpbmsgXHUwMEUybSB0aGFuaCBuXHUxRUMxbikgXHUyMDE0IENodXlcdTAwRUFuIHRcdTAwRTJtIHRcdTFFRDFpIFx1MDExMWEgdlx1MDBFMG8gYlx1MDBFMGkgdlx1MUVERi5cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAge3Bob25nLm1vVGEgJiYgKFxuICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCBweC0yIGxlYWRpbmctcmVsYXhlZFwiPlxuICAgICAgICAgIHtwaG9uZy5tb1RhfVxuICAgICAgICA8L3A+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIkFBQUEsTUFBTSxFQUFFLFVBQVUsV0FBVyxPQUFPLElBQUk7QUFDeEMsU0FBUyxrQkFBa0Isb0JBQW9CLGVBQWUsV0FBVyxtQkFBbUIscUJBQXFCLGtCQUFrQjtBQUtuSSxNQUFNLGFBQWEsQ0FBQyxPQUFPLE1BQU07QUFBRSxNQUFJLFNBQVMsb0JBQW9CLFVBQVcsSUFBRztBQUFHO0FBSTlFLGdCQUFTLFdBQVcsRUFBRSxPQUFPLFdBQVcsV0FBVyxhQUFhLEtBQUssR0FBRztBQUM3RSxRQUFNLENBQUMsR0FBRyxJQUFJLElBQUksTUFBTSxTQUFTLEVBQUU7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
