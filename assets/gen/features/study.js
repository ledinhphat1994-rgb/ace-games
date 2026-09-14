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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvc3R1ZHkuanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9ID0gUmVhY3Q7XG5pbXBvcnQgeyBkaW5oRGFuZ0dpYXlQaHV0LCBnaXVOZ3V5ZW5WaVRyaUN1b24sIGlkR29vZ2xlRHJpdmUsIGlkWW91dHViZSwgbGFWaWRlb1RydWNUaWVwRmUsIG5hcFlvdVR1YmVJZnJhbWVBcGksIHVybE1lZGlhRmUgfSBmcm9tICcuLi9saWIvaGVscGVycy5qcyc7XG5cbi8vIEJcdTFFQ0YgcXVhIHRpY2sga2hpIHRhYiBcdTAxMTFhbmcgXHUxRURGIE5cdTFFQzBOIFx1MjAxNCB0clx1MDBFMW5oIGNcdTFFRDluZyBkXHUxRUQzbiByZXF1ZXN0IENsb3VkZmxhcmUgdlx1MDBGNCBcdTAwRURjaCBraGkga2hcdTAwRjRuZyBhaSB4ZW0uXG4vLyBLaFx1MDBGNG5nIGRcdTAwRjluZyBjaG8gcG9sbCB0XHUwMEVEbiBoaVx1MUVDN3UgdGhcdTFFRERpIGdpYW4gdGhcdTFFRjFjICh2ZCB2b2ljZSBzaWduYWxpbmcpIHZcdTAwRUMgYlx1MUVDRiBsXHUxRUUxIHRpY2sgY1x1MDBGMyB0aFx1MUVDMyBsXHUwMEUwbSB0cmVvXG4vLyBiXHUxRUFGdCB0YXkga1x1MUVCRnQgblx1MUVEMWkgaG9cdTFFQjdjIHRyXHUxRUM1IHRcdTAwRURuIGhpXHUxRUM3dSBcInJcdTFFRERpIHZvaWNlXCIgY1x1MUVFN2EgbmdcdTAxQjBcdTFFRERpIGtpYS5cbmNvbnN0IGtoaUhpZW5UaGkgPSAoZm4pID0+ICgpID0+IHsgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnKSBmbigpOyB9O1xuXG5cbi8vIFx1MDBENCBuaFx1MUVBRHAgbGluayB0aFx1MDBFQW0gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgXHUyMDE0IGRcdTAwRjluZyBjaHVuZyBjaG8gU3R1ZHlEb2NrIHZcdTAwRTAgQ2FtcHVzV2F0Y2hUb2dldGhlclxuZXhwb3J0IGZ1bmN0aW9uIFF1ZXVlSW5wdXQoeyBvbkFkZCwgb25BZGROZXh0LCBvblN1Z2dlc3QsIGNhbkNvbnRyb2wgPSB0cnVlIH0pIHtcbiAgY29uc3QgW3YsIHNldFZdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBvayA9IHYudHJpbSgpLmxlbmd0aCA+IDA7XG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICA8aW5wdXRcbiAgICAgICAgaWQ9XCJpbnB1dC1xdWV1ZS1hZGRcIlxuICAgICAgICB0eXBlPVwidXJsXCJcbiAgICAgICAgdmFsdWU9e3Z9XG4gICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFYoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICBvbktleURvd249e2UgPT4ge1xuICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiBvaykge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wpIHtcbiAgICAgICAgICAgICAgb25BZGQodi50cmltKCkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvblN1Z2dlc3QpIHtcbiAgICAgICAgICAgICAgb25TdWdnZXN0KHYudHJpbSgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldFYoJycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfX1cbiAgICAgICAgcGxhY2Vob2xkZXI9e2NhbkNvbnRyb2wgPyBcIlRoXHUwMEVBbSBsaW5rIHZpZGVvIHZcdTAwRTBvIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXHUyMDI2XCIgOiBcIkRcdTAwRTFuIGxpbmsgdmlkZW8gXHUwMTExXHUxRUMxIHh1XHUxRUE1dCBjaG8gY2hcdTFFRTcgcGhcdTAwRjJuZ1x1MjAyNlwifVxuICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0yLjUgcHktMS41IHRleHQtWzExcHhdIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwXCJcbiAgICAgIC8+XG4gICAgICB7Y2FuQ29udHJvbCA/IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBpZD1cImJ0bi1xdWV1ZS1hZGQtbmV4dFwiIGRpc2FibGVkPXshb2t9XG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IG9uQWRkTmV4dCh2LnRyaW0oKSk7IHNldFYoJycpOyB9fVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLXZpb2xldC01MDAvMTUgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctdmlvbGV0LTUwMC8yNSBkaXNhYmxlZDpvcGFjaXR5LTMwIHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICArUGhcdTAwRTF0IGtcdTFFQkZcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBpZD1cImJ0bi1xdWV1ZS1lbnF1ZXVlXCIgZGlzYWJsZWQ9eyFva31cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgb25BZGQodi50cmltKCkpOyBzZXRWKCcnKTsgfX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGhvdmVyOmJnLVsjMDBGMkZFXS8yNSBkaXNhYmxlZDpvcGFjaXR5LTMwIHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICArQ3VcdTFFRDFpIGhcdTAwRTBuZ1xuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8Lz5cbiAgICAgICkgOiAoXG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGlkPVwiYnRuLXF1ZXVlLXN1Z2dlc3RcIiBkaXNhYmxlZD17IW9rfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgaWYgKG9uU3VnZ2VzdCkgb25TdWdnZXN0KHYudHJpbSgpKTsgc2V0VignJyk7IH19XG4gICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC1sZyBiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLWFtYmVyLTUwMCB0ZXh0LWJsYWNrIHRleHQtWzEwcHhdIGZvbnQtYmxhY2sgaG92ZXI6YnJpZ2h0bmVzcy0xMTAgYWN0aXZlOnNjYWxlLTk1IGRpc2FibGVkOm9wYWNpdHktMzAgd2hpdGVzcGFjZS1ub3dyYXAgY3Vyc29yLXBvaW50ZXIgc2hhZG93LXNtXCI+XG4gICAgICAgICAgXHVEODNEXHVEQ0ExIFx1MDExMFx1MUVDMSB4dVx1MUVBNXRcbiAgICAgICAgPC9idXR0b24+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgU1RVRFkgRE9DSzogS0hcdTAwRDRORyBHSUFOIENcdTFFRDhORyBUXHUwMEMxQyBQSFx1MDBEMk5HIFlPVVRVQkUgKFBIQVNFIDRGKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBmdW5jdGlvbiBTdHVkeURvY2soeyBwaG9uZywgcGhvbmdNaW5oS2hvYSwgYXV0aCwgcGhvbmdDaGF0ID0gW10sIG9uU2VuZFBob25nQ2hhdCwgb25Yb2FUaW5QaG9uZyxcbiAgbXlDYXBzID0ge30sIGlzU3RhZmYgPSBmYWxzZSwgdmFpVHJvUGhvbmcgPSAnbWVtYmVyJywgdGhhbmhWaWVuID0gW10sXG4gIHBvbGljaWVzID0gbnVsbCwgZ3JhbnRzID0gW10sIHZpZGVvVGltZVJlZiwgc2Vla1ZpZGVvLCBoYW5oRG9uZ1Bob25nLFxuICBjYW5Db250cm9sOiBfY2FuQ29udHJvbCA9IGZhbHNlLCBkb25nUGhvbmdIaWVuVGFpOiBfZG9uZ1Bob25nSGllblRhaSwgaXNSb29tV2lkZSA9IGZhbHNlIH0pIHtcbiAgY29uc3QgW2RvY2tUYWIsIHNldERvY2tUYWJdID0gUmVhY3QudXNlU3RhdGUoJ2NoYXQnKTsgLy8gJ2NoYXQnIHwgJ25vdGVzJyB8ICd3aGl0ZWJvYXJkJyB8ICdzaGVldCcgfCAndm9pY2UnIHwgJ3F1YW4tdHJpJ1xuICBjb25zdCBbc2hvd0Vtb2ppLCBzZXRTaG93RW1vamldID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8vIENhcGFiaWxpdHkgcGhcdTAwRURhIGNsaWVudCBjaFx1MUVDOSBcdTAxMTFcdTFFQzMgXHUxRUE5bi9oaVx1MUVDN24gVUkgXHUyMDE0IG1cdTFFQ0RpIHF1eVx1MUVDMW4gdGhcdTFFQUR0IGRvIHNlcnZlciBxdXlcdTFFQkZ0LlxuICBjb25zdCBjb1F1eWVuID0gKGNhcCkgPT4gbXlDYXBzW2NhcF0gIT09IGZhbHNlO1xuICBjb25zdCBfbGF5VmlUcmlWaWRlbyA9ICgpID0+IE1hdGguZmxvb3IodmlkZW9UaW1lUmVmPy5jdXJyZW50IHx8IDApIHx8IG51bGw7XG4gIC8vIEJcdTFFQTVtIG1cdTFFRDFjIHRoXHUxRUREaSBnaWFuIFx1MjE5MiBnXHUxRUVEaSBldmVudCBjaG8gQ2FtcHVzV2F0Y2hUb2dldGhlciB4XHUxRUVEIGxcdTAwRkRcbiAgLy8gKGNcdTAwRjMgdmlkZW9fY29udHJvbCBcdTIxOTIgdHVhIGNodW5nIGNcdTFFQTMgcGhcdTAwRjJuZzsga2hcdTAwRjRuZyBcdTIxOTIgdHVhIGNcdTFFRTVjIGJcdTFFRDkgcGxheWVyIGNcdTFFRTdhIG1cdTAwRUNuaCkuXG4gIGNvbnN0IHlldUNhdVR1YSA9IChzZWMpID0+IHtcbiAgICBpZiAoc2VjID09IG51bGwgfHwgIShzZWMgPj0gMCkpIHJldHVybjtcbiAgICBpZiAoc2Vla1ZpZGVvKSB7IHNlZWtWaWRlbyhOdW1iZXIoc2VjKSwgbXlDYXBzLnZpZGVvX2NvbnRyb2wgPT09IHRydWUpOyByZXR1cm47IH1cbiAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3NyLXNlZWsnLCB7IGRldGFpbDogeyBwaG9uZ0lkOiBwaG9uZz8uaWQsIHNlYzogTnVtYmVyKHNlYykgfSB9KSk7XG4gIH07XG5cbiAgLy8gMS4gUm9vbSBDaGF0IFN0YXRlXG4gIGNvbnN0IFtjaGF0SW5wdXQsIHNldENoYXRJbnB1dF0gPSBSZWFjdC51c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtjaGF0U2VuZGluZywgc2V0Q2hhdFNlbmRpbmddID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBjaGF0Q29tcG9zaW5nUmVmID0gUmVhY3QudXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgY2hhdEVuZFJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiID09PSAnY2hhdCcgJiYgY2hhdEVuZFJlZi5jdXJyZW50KSB7XG4gICAgICBjb25zdCBwID0gY2hhdEVuZFJlZi5jdXJyZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgICBpZiAocCAmJiBwLnNjcm9sbEhlaWdodCA+IHAuY2xpZW50SGVpZ2h0KSB7XG4gICAgICAgIHAuc2Nyb2xsVG8oeyB0b3A6IHAuc2Nyb2xsSGVpZ2h0LCBiZWhhdmlvcjogJ3Ntb290aCcgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCBbcGhvbmdDaGF0Lmxlbmd0aCwgZG9ja1RhYl0pO1xuXG4gIGNvbnN0IGhhbmRsZVNlbmRSb29tQ2hhdCA9IChlKSA9PiB7XG4gICAgZT8ucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCB0eHQgPSBjaGF0SW5wdXQudHJpbSgpO1xuICAgIGlmICghdHh0IHx8IGNoYXRTZW5kaW5nKSByZXR1cm47XG4gICAgc2V0Q2hhdElucHV0KCcnKTtcbiAgICBzZXRDaGF0U2VuZGluZyh0cnVlKTtcbiAgICBpZiAob25TZW5kUGhvbmdDaGF0KSB7XG4gICAgICBQcm9taXNlLnJlc29sdmUob25TZW5kUGhvbmdDaGF0KHR4dCkpLmNhdGNoKCgpID0+IHtcbiAgICAgICAgc2V0Q2hhdElucHV0KGN1ciA9PiBjdXIgPyBjdXIgOiB0eHQpO1xuICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgIHNldENoYXRTZW5kaW5nKGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRDaGF0U2VuZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG5cblxuICAvLyAzLiBTaGFyZWQgV2hpdGVib2FyZCBTdGF0ZVxuICBjb25zdCBjYW52YXNSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IFt3YlN0cm9rZXMsIHNldFdiU3Ryb2tlc10gPSBSZWFjdC51c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFt3YkNvbG9yLCBzZXRXYkNvbG9yXSA9IFJlYWN0LnVzZVN0YXRlKCcjMDBGMkZFJyk7XG4gIGNvbnN0IFt3YldpZHRoLCBzZXRXYldpZHRoXSA9IFJlYWN0LnVzZVN0YXRlKDMpO1xuICBjb25zdCBbd2JUb29sLCBzZXRXYlRvb2xdID0gUmVhY3QudXNlU3RhdGUoJ3BlbicpO1xuICBjb25zdCBpc0RyYXdpbmdSZWYgPSBSZWFjdC51c2VSZWYoZmFsc2UpO1xuICBjb25zdCBjdXJyZW50U3Ryb2tlUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB3YlZlcnNpb25SZWYgPSBSZWFjdC51c2VSZWYoMCk7XG5cbiAgY29uc3QgcmVkcmF3Q2FudmFzID0gUmVhY3QudXNlQ2FsbGJhY2soKHN0cm9rZXMpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICBpZiAoIWNhbnZhcykgcmV0dXJuO1xuICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICBzdHJva2VzLmZvckVhY2gocyA9PiB7XG4gICAgICBpZiAoIXMucG9pbnRzIHx8IHMucG9pbnRzLmxlbmd0aCA8IDIpIHJldHVybjtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHMudG9vbCA9PT0gJ2VyYXNlcicgPyAnIzBCMEUxNCcgOiAocy5jb2xvciB8fCAnIzAwRjJGRScpO1xuICAgICAgY3R4LmxpbmVXaWR0aCA9IHMud2lkdGggfHwgMztcbiAgICAgIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcbiAgICAgIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICBjdHgubW92ZVRvKHMucG9pbnRzWzBdLngsIHMucG9pbnRzWzBdLnkpO1xuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBzLnBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjdHgubGluZVRvKHMucG9pbnRzW2ldLngsIHMucG9pbnRzW2ldLnkpO1xuICAgICAgfVxuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH0pO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgW3diQ2FuV3JpdGUsIHNldFdiQ2FuV3JpdGVdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG5cbiAgLy8gXHUwMEMxcCAxIG9wIHZcdTAwRTBvIG1cdTFFQTNuZyBzdHJva2VzIChyZXBsYXkgYXBwZW5kLW9ubHkpOiAnc3Ryb2tlJyB0aFx1MDBFQW0gblx1MDBFOXQsICdjbGVhcicgeG9cdTAwRTEgc1x1MUVBMWNoLlxuICBjb25zdCBhcER1bmdPcCA9IChzdHJva2VzLCBvcCkgPT4ge1xuICAgIGlmIChvcC50eXBlID09PSAnY2xlYXInKSByZXR1cm4gW107XG4gICAgaWYgKG9wLnR5cGUgPT09ICdzdHJva2UnICYmIG9wLnN0cm9rZSkgcmV0dXJuIFsuLi5zdHJva2VzLCBvcC5zdHJva2VdO1xuICAgIHJldHVybiBzdHJva2VzO1xuICB9O1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRvY2tUYWIgIT09ICd3aGl0ZWJvYXJkJykgcmV0dXJuO1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoV2IgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy1jb2xsYWI/cGhvbmdJZD0ke3Bob25nLmlkfSZyZXNvdXJjZT13aGl0ZWJvYXJkJnNhdUlkPSR7d2JWZXJzaW9uUmVmLmN1cnJlbnR9YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2spIHtcbiAgICAgICAgICBjb25zdCBvcHMgPSBBcnJheS5pc0FycmF5KGQucGF5bG9hZD8ub3BzKSA/IGQucGF5bG9hZC5vcHMgOiBbXTtcbiAgICAgICAgICBpZiAob3BzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gTlx1MUVCRnUgY1x1MDBGMyBvcCAnY2xlYXInIHRyb25nIGxvXHUxRUExdCBtXHUxRURCaSBcdTIxOTIgYnVpbGQgbFx1MUVBMWkgdFx1MUVFQiBcdTAxMTFcdTFFQTd1IGNobyBjaFx1MUVBRmNcbiAgICAgICAgICAgIGlmIChvcHMuc29tZShvID0+IG8udHlwZSA9PT0gJ2NsZWFyJykpIHtcbiAgICAgICAgICAgICAgY29uc3QgZnVsbCA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JnJlc291cmNlPXdoaXRlYm9hcmQmc2F1SWQ9MGApO1xuICAgICAgICAgICAgICBjb25zdCBkZiA9IGF3YWl0IGZ1bGwuanNvbigpO1xuICAgICAgICAgICAgICBpZiAoYWN0aXZlICYmIGRmLm9rKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsT3BzID0gQXJyYXkuaXNBcnJheShkZi5wYXlsb2FkPy5vcHMpID8gZGYucGF5bG9hZC5vcHMgOiBbXTtcbiAgICAgICAgICAgICAgICBjb25zdCByZWJ1aWx0ID0gYWxsT3BzLnJlZHVjZShhcER1bmdPcCwgW10pO1xuICAgICAgICAgICAgICAgIHNldFdiU3Ryb2tlcyhyZWJ1aWx0KTtcbiAgICAgICAgICAgICAgICByZWRyYXdDYW52YXMocmVidWlsdCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNldFdiU3Ryb2tlcyhwcmV2ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gb3BzLnJlZHVjZShhcER1bmdPcCwgcHJldik7XG4gICAgICAgICAgICAgICAgcmVkcmF3Q2FudmFzKG5leHQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgd2JWZXJzaW9uUmVmLmN1cnJlbnQgPSBkLnZlcnNpb24gfHwgMDtcbiAgICAgICAgICBzZXRXYkNhbldyaXRlKGQuY2FuV3JpdGUgIT09IGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RpdmUgJiYgZC5jb2RlID09PSAnY2FwYWJpbGl0eV9vZmYnKSB7XG4gICAgICAgICAgc2V0V2JDYW5Xcml0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIGZldGNoV2IoKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGtoaUhpZW5UaGkoZmV0Y2hXYiksIDMwMDApO1xuICAgIHJldHVybiAoKSA9PiB7IGFjdGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludGVydmFsKTsgfTtcbiAgfSwgW3Bob25nLmlkLCBkb2NrVGFiLCByZWRyYXdDYW52YXNdKTtcblxuICBjb25zdCBzdGFydERyYXdpbmcgPSAoZSkgPT4ge1xuICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgIGlmICghY2FudmFzKSByZXR1cm47XG4gICAgY29uc3QgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBjbGllbnRYID0gZS5jbGllbnRYID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRYKTtcbiAgICBjb25zdCBjbGllbnRZID0gZS5jbGllbnRZID8/IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdPy5jbGllbnRZKTtcbiAgICBjb25zdCB4ID0gY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICBjb25zdCB5ID0gY2xpZW50WSAtIHJlY3QudG9wO1xuICAgIGlzRHJhd2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQgPSB7XG4gICAgICB0b29sOiB3YlRvb2wsXG4gICAgICBjb2xvcjogd2JDb2xvcixcbiAgICAgIHdpZHRoOiB3YlRvb2wgPT09ICdlcmFzZXInID8gMTYgOiB3YldpZHRoLFxuICAgICAgcG9pbnRzOiBbeyB4LCB5IH1dXG4gICAgfTtcbiAgfTtcblxuICBjb25zdCBkcmF3TW92ZSA9IChlKSA9PiB7XG4gICAgaWYgKCFpc0RyYXdpbmdSZWYuY3VycmVudCB8fCAhY3VycmVudFN0cm9rZVJlZi5jdXJyZW50KSByZXR1cm47XG4gICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFjYW52YXMpIHJldHVybjtcbiAgICBjb25zdCByZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGNsaWVudFggPSBlLmNsaWVudFggPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFgpO1xuICAgIGNvbnN0IGNsaWVudFkgPSBlLmNsaWVudFkgPz8gKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0/LmNsaWVudFkpO1xuICAgIGNvbnN0IHggPSBjbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIGNvbnN0IHkgPSBjbGllbnRZIC0gcmVjdC50b3A7XG4gICAgY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnBvaW50cy5wdXNoKHsgeCwgeSB9KTtcbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnRvb2wgPT09ICdlcmFzZXInID8gJyMwQjBFMTQnIDogY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LmNvbG9yO1xuICAgIGN0eC5saW5lV2lkdGggPSBjdXJyZW50U3Ryb2tlUmVmLmN1cnJlbnQud2lkdGg7XG4gICAgY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuICAgIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgY29uc3QgcHRzID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50LnBvaW50cztcbiAgICBpZiAocHRzLmxlbmd0aCA+PSAyKSB7XG4gICAgICBjdHgubW92ZVRvKHB0c1twdHMubGVuZ3RoIC0gMl0ueCwgcHRzW3B0cy5sZW5ndGggLSAyXS55KTtcbiAgICAgIGN0eC5saW5lVG8ocHRzW3B0cy5sZW5ndGggLSAxXS54LCBwdHNbcHRzLmxlbmd0aCAtIDFdLnkpO1xuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBzdG9wRHJhd2luZyA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIWlzRHJhd2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgaXNEcmF3aW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFN0cm9rZVJlZi5jdXJyZW50ICYmIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudC5wb2ludHMubGVuZ3RoID4gMSkge1xuICAgICAgY29uc3Qgc3Ryb2tlID0gY3VycmVudFN0cm9rZVJlZi5jdXJyZW50O1xuICAgICAgY29uc3QgbmV4dFN0cm9rZXMgPSBbLi4ud2JTdHJva2VzLCBzdHJva2VdO1xuICAgICAgc2V0V2JTdHJva2VzKG5leHRTdHJva2VzKTtcbiAgICAgIGN1cnJlbnRTdHJva2VSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICByZXNvdXJjZTogJ3doaXRlYm9hcmQnLFxuICAgICAgICAgICAgcGF5bG9hZDogeyB0eXBlOiAnc3Ryb2tlJywgc3Ryb2tlIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChkLm9rICYmIGQuaWQpIHdiVmVyc2lvblJlZi5jdXJyZW50ID0gTWF0aC5tYXgod2JWZXJzaW9uUmVmLmN1cnJlbnQsIGQuaWQpO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH1cbiAgfTtcblxuICBjb25zdCBjbGVhcldoaXRlYm9hcmQgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFjb25maXJtKCdCXHUxRUExbiBjXHUwMEYzIGNoXHUxRUFGYyBtdVx1MUVEMW4geFx1MDBGM2Egc1x1MUVBMWNoIGJcdTFFQTNuZyB2XHUxRUJEPyAoY2hcdTFFQzkgcXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcpJykpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICByZXNvdXJjZTogJ3doaXRlYm9hcmQnLFxuICAgICAgICAgIHBheWxvYWQ6IHsgdHlwZTogJ2NsZWFyJyB9XG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHtcbiAgICAgICAgc2V0V2JTdHJva2VzKFtdKTtcbiAgICAgICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgICAgIGlmIChjYW52YXMpIHtcbiAgICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cblxuXG4gIC8vIDUuIDEtdG8tMSBXZWJSVEMgVm9pY2UgQ2hhdCBcdTIwMTQgcGFpci1ib3VuZCAodFx1MUVEMWkgXHUwMTExYSAxIGNcdTFFQjdwL3BoXHUwMEYybmcsIHNpZ25hbGluZyByaVx1MDBFQW5nIHRcdTAxQjApXG4gIGNvbnN0IFt2b2ljZUpvaW5lZCwgc2V0Vm9pY2VKb2luZWRdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbWljTXV0ZWQsIHNldE1pY011dGVkXSA9IFJlYWN0LnVzZVN0YXRlKHRydWUpOyAvLyBEZWZhdWx0IE9GRlxuICBjb25zdCBbdm9pY2VTdGF0ZSwgc2V0Vm9pY2VTdGF0ZV0gPSBSZWFjdC51c2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gIGNvbnN0IFt2b2ljZU5vdGljZSwgc2V0Vm9pY2VOb3RpY2VdID0gUmVhY3QudXNlU3RhdGUoJycpO1xuICBjb25zdCBbdm9pY2VQYWlyLCBzZXRWb2ljZVBhaXJdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7ICAgICAgIC8vIHthY3RpdmUsIGFUZW4sIGJUZW4sIHlvdUluLCBzbG90fVxuICBjb25zdCBbdm9pY2VSZXF1ZXN0ZWQsIHNldFZvaWNlUmVxdWVzdGVkXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3lldUNhdVZvaWNlLCBzZXRZZXVDYXVWb2ljZV0gPSBSZWFjdC51c2VTdGF0ZShbXSk7ICAgICAvLyBzdGFmZjogZGFuaCBzXHUwMEUxY2ggeGluIHF1eVx1MUVDMW5cbiAgY29uc3QgcGNSZWYgPSBSZWFjdC51c2VSZWYobnVsbCk7XG4gIGNvbnN0IGxvY2FsU3RyZWFtUmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCByZW1vdGVBdWRpb1JlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3QgbGFzdFNpZ25hbElkUmVmID0gUmVhY3QudXNlUmVmKDApO1xuICBjb25zdCB2b2ljZVBvbGxUaW1lclJlZiA9IFJlYWN0LnVzZVJlZihudWxsKTtcbiAgY29uc3Qgdm9pY2VTbG90UmVmID0gUmVhY3QudXNlUmVmKG51bGwpO1xuICBjb25zdCB2b2ljZUpvaW5lZFJlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IHBlbmRpbmdDYW5kaWRhdGVzUmVmID0gUmVhY3QudXNlUmVmKFtdKTtcbiAgdm9pY2VKb2luZWRSZWYuY3VycmVudCA9IHZvaWNlSm9pbmVkO1xuXG4gIGNvbnN0IGR1bmdLZXROb2lWb2ljZSA9ICgpID0+IHtcbiAgICBpZiAobG9jYWxTdHJlYW1SZWYuY3VycmVudCkge1xuICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRUcmFja3MoKS5mb3JFYWNoKHQgPT4gdC5zdG9wKCkpO1xuICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudCA9IG51bGw7XG4gICAgfVxuICAgIGlmIChwY1JlZi5jdXJyZW50KSB7XG4gICAgICBwY1JlZi5jdXJyZW50LmNsb3NlKCk7XG4gICAgICBwY1JlZi5jdXJyZW50ID0gbnVsbDtcbiAgICB9XG4gICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCA9IFtdO1xuICAgIHNldE1pY011dGVkKHRydWUpO1xuICB9O1xuXG4gIC8vIFBvbGwgdHJcdTFFQTFuZyB0aFx1MDBFMWkgY1x1MUVCN3AgKyB0XHUwMEVEbiBoaVx1MUVDN3UgY1x1MUVFN2EgcGFydG5lciAoc2VydmVyIGNoXHUxRUM5IHRyXHUxRUEzIHNpZ25hbCBjXHUxRUU3YSBuZ1x1MDFCMFx1MUVERGkgdHJvbmcgY1x1MUVCN3ApLlxuICBjb25zdCBwb2xsVm9pY2UgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNvbGxhYj9waG9uZ0lkPSR7cGhvbmcuaWR9JmFjdGlvbj12b2ljZV9wb2xsJnNhdUlkPSR7bGFzdFNpZ25hbElkUmVmLmN1cnJlbnR9YCk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghZC5vaykgcmV0dXJuO1xuICAgICAgaWYgKGQucGFpcikgc2V0Vm9pY2VQYWlyKGQucGFpcik7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShkLnlldUNhdVZvaWNlKSkgc2V0WWV1Q2F1Vm9pY2UoZC55ZXVDYXVWb2ljZSk7XG4gICAgICBjb25zdCBwYyA9IHBjUmVmLmN1cnJlbnQ7XG4gICAgICBpZiAoIXZvaWNlSm9pbmVkUmVmLmN1cnJlbnQgfHwgIXBjKSByZXR1cm47XG4gICAgICBmb3IgKGNvbnN0IHNpZyBvZiBkLnNpZ25hbHMgfHwgW10pIHtcbiAgICAgICAgbGFzdFNpZ25hbElkUmVmLmN1cnJlbnQgPSBNYXRoLm1heChsYXN0U2lnbmFsSWRSZWYuY3VycmVudCwgc2lnLmlkKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdvZmZlcicpIHtcbiAgICAgICAgICAgIC8vIE9mZmVyIG1cdTFFREJpIGhvXHUxRUI3YyByZS1vZmZlciAoXHUwMTExXHUxRUQxaSBwaFx1MDFCMFx1MDFBMW5nIGJcdTFFQUR0IG1pYyBtdVx1MUVEOW4pIFx1MDExMVx1MUVDMXUgc2V0IGxcdTFFQTFpIHJlbW90ZSArIHRyXHUxRUEzIGFuc3dlci5cbiAgICAgICAgICAgIGF3YWl0IHBjLnNldFJlbW90ZURlc2NyaXB0aW9uKG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24oc2lnLnBheWxvYWQpKTtcbiAgICAgICAgICAgIC8vIFhcdTFFQTMgY1x1MDBFMWMgY2FuZGlkYXRlIHRcdTFFREJpIHNcdTFFREJtIHRyXHUwMUIwXHUxRURCYyBraGkgY1x1MDBGMyByZW1vdGVEZXNjcmlwdGlvbi5cbiAgICAgICAgICAgIGZvciAoY29uc3QgYyBvZiBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLmFkZEljZUNhbmRpZGF0ZShuZXcgUlRDSWNlQ2FuZGlkYXRlKGMpKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50ID0gW107XG4gICAgICAgICAgICBjb25zdCBhbnMgPSBhd2FpdCBwYy5jcmVhdGVBbnN3ZXIoKTtcbiAgICAgICAgICAgIGF3YWl0IHBjLnNldExvY2FsRGVzY3JpcHRpb24oYW5zKTtcbiAgICAgICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnYW5zd2VyJywgcGF5bG9hZDogYW5zIH0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZy5zaWduYWxUeXBlID09PSAnYW5zd2VyJykge1xuICAgICAgICAgICAgaWYgKHBjLnNpZ25hbGluZ1N0YXRlID09PSAnaGF2ZS1sb2NhbC1vZmZlcicpIHtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuc2V0UmVtb3RlRGVzY3JpcHRpb24obmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbihzaWcucGF5bG9hZCkpO1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IGMgb2YgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBjLmFkZEljZUNhbmRpZGF0ZShuZXcgUlRDSWNlQ2FuZGlkYXRlKGMpKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcGVuZGluZ0NhbmRpZGF0ZXNSZWYuY3VycmVudCA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdjYW5kaWRhdGUnKSB7XG4gICAgICAgICAgICBpZiAocGMucmVtb3RlRGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgYXdhaXQgcGMuYWRkSWNlQ2FuZGlkYXRlKG5ldyBSVENJY2VDYW5kaWRhdGUoc2lnLnBheWxvYWQpKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZW5kaW5nQ2FuZGlkYXRlc1JlZi5jdXJyZW50LnB1c2goc2lnLnBheWxvYWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoc2lnLnNpZ25hbFR5cGUgPT09ICdsZWF2ZScpIHtcbiAgICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdOZ1x1MDFCMFx1MUVERGkga2lhIFx1MDExMVx1MDBFMyBuZ1x1MUVBRnQgdm9pY2UuJyk7XG4gICAgICAgICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgICAgIGR1bmdLZXROb2lWb2ljZSgpO1xuICAgICAgICAgICAgc2V0Vm9pY2VKb2luZWQoZmFsc2UpO1xuICAgICAgICAgICAgdm9pY2VTbG90UmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCB7IC8qIGJcdTFFQ0YgcXVhIHNpZ25hbCBsXHUxRUQ3aSAqLyB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9O1xuXG4gIC8vIFBvbGwgY2hcdTFFQTF5IGtoaSB0YWIgdm9pY2UgbVx1MUVERiAoeGVtIHRyXHUxRUExbmcgdGhcdTAwRTFpIGNcdTFFQjdwKSBob1x1MUVCN2MgXHUwMTExYW5nIHRyb25nIGNcdTFFQjdwLlxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb2NrVGFiICE9PSAndm9pY2UnICYmICF2b2ljZUpvaW5lZCkgcmV0dXJuO1xuICAgIHBvbGxWb2ljZSgpO1xuICAgIHZvaWNlUG9sbFRpbWVyUmVmLmN1cnJlbnQgPSBzZXRJbnRlcnZhbChwb2xsVm9pY2UsIDE1MDApO1xuICAgIHJldHVybiAoKSA9PiB7IGlmICh2b2ljZVBvbGxUaW1lclJlZi5jdXJyZW50KSBjbGVhckludGVydmFsKHZvaWNlUG9sbFRpbWVyUmVmLmN1cnJlbnQpOyB9O1xuICB9LCBbcGhvbmcuaWQsIGRvY2tUYWIsIHZvaWNlSm9pbmVkXSk7XG5cbiAgY29uc3Qgam9pblZvaWNlID0gYXN5bmMgKCkgPT4ge1xuICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBhbmcgeGluIGNoXHUxRUQ3IHRyb25nIGNcdTFFQjdwIHZvaWNlLi4uJyk7XG4gICAgc2V0Vm9pY2VTdGF0ZSgnY29ubmVjdGluZycpO1xuICAgIHRyeSB7XG4gICAgICAvLyAxLiBHaVx1MDBFMG5oIHNsb3QgdHJcdTAwRUFuIHNlcnZlciB0clx1MDFCMFx1MUVEQmMgKHNlcnZlci1hdXRob3JpdGF0aXZlOiB0XHUxRUQxaSBcdTAxMTFhIDEgY1x1MUVCN3AgMS0xL3BoXHUwMEYybmcpXG4gICAgICBjb25zdCBqb2luUmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX2pvaW4nIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGpvaW5EYXRhID0gYXdhaXQgam9pblJlcy5qc29uKCk7XG4gICAgICBpZiAoIWpvaW5EYXRhLm9rKSB7XG4gICAgICAgIGlmIChqb2luRGF0YS5jb2RlID09PSAnZ3JhbnRfcmVxdWlyZWQnKSB7XG4gICAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0JcdTFFQTFuIGNcdTFFQTduIFx1MDExMVx1MDFCMFx1MUVFM2MgY1x1MUVBNXAgcXV5XHUxRUMxbiB2b2ljZSBcdTIwMTQgaFx1MDBFM3kgYlx1MUVBNW0gXCJYaW4gcXV5XHUxRUMxbiB2b2ljZVwiLicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKGpvaW5EYXRhLmxvaSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyB0aGFtIGdpYSB2b2ljZS4nKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdm9pY2VTbG90UmVmLmN1cnJlbnQgPSBqb2luRGF0YS5zbG90O1xuICAgICAgc2V0Vm9pY2VKb2luZWQodHJ1ZSk7XG5cbiAgICAgIC8vIDIuIFhpbiBtaWMgVFJcdTAxQUZcdTFFREFDIGtoaSB0XHUxRUExbyBvZmZlciBcdTIwMTQgdHJhY2sgcGhcdTFFQTNpIGNcdTAwRjMgc1x1MUVCNW4gdHJvbmcgU0RQIG5lZ290aWF0aW9uLFxuICAgICAgLy8gICAgYWRkVHJhY2sgc2F1IGtoaSBcdTAxMTFcdTAwRTMgYlx1MUVBRnQgdGF5IG1cdTAwRTAga2hcdTAwRjRuZyByZW5lZ290aWF0ZSBcdTIxOTIgbmdcdTAxQjBcdTFFRERpIGtpYSBraFx1MDBGNG5nIG5naGUgXHUwMTExXHUwMUIwXHUxRUUzYy5cbiAgICAgIC8vICAgIE1pYyBraFx1MUVERmkgXHUwMTExXHUxRUE3dSBtdXRlZCAoZW5hYmxlZD1mYWxzZSkgXHUyMDE0IHVzZXIgdFx1MUVGMSBiXHUxRUFEdCBiXHUxRUIxbmcgblx1MDBGQXQgTWljLlxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc3RyZWFtID0gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoeyBhdWRpbzogdHJ1ZSwgdmlkZW86IGZhbHNlIH0pO1xuICAgICAgICBzdHJlYW0uZ2V0QXVkaW9UcmFja3MoKS5mb3JFYWNoKHQgPT4geyB0LmVuYWJsZWQgPSBmYWxzZTsgfSk7XG4gICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQgPSBzdHJlYW07XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0toXHUwMEY0bmcgeGluIFx1MDExMVx1MDFCMFx1MUVFM2MgbWljcm8gXHUyMDE0IGJcdTFFQTFuIGNoXHUxRUM5IG5naGUgXHUwMTExXHUwMUIwXHUxRUUzYywga2hcdTAwRjRuZyBuXHUwMEYzaSBcdTAxMTFcdTAxQjBcdTFFRTNjLicpO1xuICAgICAgfVxuXG4gICAgICAvLyAzLiBUXHUxRUExbyBwZWVyIGNvbm5lY3Rpb25cbiAgICAgIGNvbnN0IHBjID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKHtcbiAgICAgICAgaWNlU2VydmVyczogW3sgdXJsczogJ3N0dW46c3R1bi5sLmdvb2dsZS5jb206MTkzMDInIH1dXG4gICAgICB9KTtcbiAgICAgIHBjUmVmLmN1cnJlbnQgPSBwYztcbiAgICAgIGlmIChsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0VHJhY2tzKCkuZm9yRWFjaCh0ID0+IHBjLmFkZFRyYWNrKHQsIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpKTtcbiAgICAgIH1cblxuICAgICAgcGMub25pY2VjYW5kaWRhdGUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmNhbmRpZGF0ZSkge1xuICAgICAgICAgIGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgICAgICBhY3Rpb246ICd2b2ljZV9zaWduYWwnLFxuICAgICAgICAgICAgICBzaWduYWxUeXBlOiAnY2FuZGlkYXRlJyxcbiAgICAgICAgICAgICAgcGF5bG9hZDogZXZlbnQuY2FuZGlkYXRlXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcGMub250cmFjayA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAocmVtb3RlQXVkaW9SZWYuY3VycmVudCAmJiBldmVudC5zdHJlYW1zWzBdKSB7XG4gICAgICAgICAgcmVtb3RlQXVkaW9SZWYuY3VycmVudC5zcmNPYmplY3QgPSBldmVudC5zdHJlYW1zWzBdO1xuICAgICAgICAgIHJlbW90ZUF1ZGlvUmVmLmN1cnJlbnQucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcGMub25jb25uZWN0aW9uc3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHMgPSBwYy5jb25uZWN0aW9uU3RhdGU7XG4gICAgICAgIGlmIChzID09PSAnY29ubmVjdGVkJykge1xuICAgICAgICAgIHNldFZvaWNlU3RhdGUoJ2Nvbm5lY3RlZCcpO1xuICAgICAgICAgIHNldFZvaWNlTm90aWNlKCdcdTI3MTMgXHUwMTEwYW5nIGtcdTFFQkZ0IG5cdTFFRDFpIHRob1x1MUVBMWkgMS0xIHRyXHUxRUYxYyB0aVx1MUVCRnAuJyk7XG4gICAgICAgIH0gZWxzZSBpZiAocyA9PT0gJ2ZhaWxlZCcgfHwgcyA9PT0gJ2Rpc2Nvbm5lY3RlZCcpIHtcbiAgICAgICAgICBzZXRWb2ljZVN0YXRlKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgICBzZXRWb2ljZU5vdGljZSgnTVx1MUVBNXQga1x1MUVCRnQgblx1MUVEMWkgdGhvXHUxRUExaSAobVx1MUVBMW5nIGNoXHUxRUI3biBQMlAgblx1MUVCRnUga2hcdTAwRjRuZyBjXHUwMEYzIFRVUk4pLicpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyA0LiBTbG90ICdiJyAobmdcdTAxQjBcdTFFRERpIHZcdTAwRTBvIHNhdSkgdFx1MUVBMW8gb2ZmZXI7IHNsb3QgJ2EnIGNoXHUxRUREIG9mZmVyIHRcdTFFRUIgcG9sbC5cbiAgICAgIGlmIChqb2luRGF0YS5zbG90ID09PSAnYicpIHtcbiAgICAgICAgY29uc3Qgb2ZmZXIgPSBhd2FpdCBwYy5jcmVhdGVPZmZlcigpO1xuICAgICAgICBhd2FpdCBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcbiAgICAgICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX3NpZ25hbCcsIHNpZ25hbFR5cGU6ICdvZmZlcicsIHBheWxvYWQ6IG9mZmVyIH0pXG4gICAgICAgIH0pO1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnXHUwMTEwXHUwMEUzIHZcdTAwRTBvIGNcdTFFQjdwIFx1MjAxNCBcdTAxMTFhbmcgYlx1MUVBRnQgdGF5IHZcdTFFREJpICcgKyAodm9pY2VQYWlyPy5hVGVuIHx8ICduZ1x1MDFCMFx1MUVERGkga2lhJykgKyAnXHUyMDI2Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnQlx1MUVBMW4gbFx1MDBFMCBuZ1x1MDFCMFx1MUVERGkgXHUwMTExXHUxRUE3dSB0aVx1MDBFQW4gXHUyMDE0IGNoXHUxRUREIHRoXHUwMEVBbSAxIG5nXHUwMUIwXHUxRUREaSB2XHUwMEUwbyB2b2ljZVx1MjAyNicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgc2V0Vm9pY2VOb3RpY2UoJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIHZvaWNlOiAnICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHhpblF1eWVuVm9pY2UgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9yZXF1ZXN0JyB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIGQuZ3JhbnRlZCkge1xuICAgICAgICBzZXRWb2ljZU5vdGljZSgnQlx1MUVBMW4gXHUwMTExXHUwMEUzIFx1MDExMVx1MDFCMFx1MUVFM2MgcGhcdTAwRTlwIHZvaWNlIFx1MjAxNCBiXHUxRUE1bSBUaGFtIGdpYS4nKTtcbiAgICAgIH0gZWxzZSBpZiAoZC5vaykge1xuICAgICAgICBzZXRWb2ljZVJlcXVlc3RlZCh0cnVlKTtcbiAgICAgICAgc2V0Vm9pY2VOb3RpY2UoJ1x1MDExMFx1MDBFMyBnXHUxRUVEaSB5XHUwMEVBdSBjXHUxRUE3dSBcdTIwMTQgY2hcdTFFREQgcXVcdTFFQTNuIHRyXHUxRUNCIHBoXHUwMEYybmcgZHV5XHUxRUM3dC4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFZvaWNlTm90aWNlKGQubG9pIHx8ICdLaFx1MDBGNG5nIGdcdTFFRURpIFx1MDExMVx1MDFCMFx1MUVFM2MgeVx1MDBFQXUgY1x1MUVBN3UuJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IHNldFZvaWNlTm90aWNlKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaS4nKTsgfVxuICB9O1xuXG4gIGNvbnN0IG5nYXRWb2ljZUNhcCA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIWNvbmZpcm0oJ05nXHUxRUFGdCBjXHUxRUI3cCB2b2ljZSBcdTAxMTFhbmcgaG9cdTFFQTF0IFx1MDExMVx1MUVEOW5nPycpKSByZXR1cm47XG4gICAgYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctY29sbGFiJywge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3ZvaWNlX2VuZCcgfSlcbiAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgcG9sbFZvaWNlKCk7XG4gIH07XG5cbiAgY29uc3QgdG9nZ2xlTWljID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmIChtaWNNdXRlZCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCFsb2NhbFN0cmVhbVJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgLy8gTWljIGJcdTFFQ0IgdFx1MUVFQiBjaFx1MUVEMWkgbFx1MDBGQWMgam9pbiBcdTIxOTIgeGluIGxcdTFFQTFpOyBhZGRUcmFjayBtdVx1MUVEOW4gY1x1MUVBN24gcmVuZWdvdGlhdGUgKG9mZmVyIG1cdTFFREJpKS5cbiAgICAgICAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7IGF1ZGlvOiB0cnVlLCB2aWRlbzogZmFsc2UgfSk7XG4gICAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudCA9IHN0cmVhbTtcbiAgICAgICAgICBjb25zdCBwYyA9IHBjUmVmLmN1cnJlbnQ7XG4gICAgICAgICAgaWYgKHBjKSB7XG4gICAgICAgICAgICBzdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaCh0cmFjayA9PiBwYy5hZGRUcmFjayh0cmFjaywgc3RyZWFtKSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBvZmZlciA9IGF3YWl0IHBjLmNyZWF0ZU9mZmVyKCk7XG4gICAgICAgICAgICAgIGF3YWl0IHBjLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpO1xuICAgICAgICAgICAgICBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1jb2xsYWInLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwaG9uZ0lkOiBwaG9uZy5pZCwgYWN0aW9uOiAndm9pY2Vfc2lnbmFsJywgc2lnbmFsVHlwZTogJ29mZmVyJywgcGF5bG9hZDogb2ZmZXIgfSlcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogcmVuZWdvdGlhdGlvbiB0aFx1MUVBNXQgYlx1MUVBMWkgXHUyMDE0IG5naGUgdlx1MUVBQm4gXHUwMTExXHUwMUIwXHUxRUUzYyAqLyB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQuZ2V0QXVkaW9UcmFja3MoKS5mb3JFYWNoKHQgPT4geyB0LmVuYWJsZWQgPSB0cnVlOyB9KTtcbiAgICAgICAgfVxuICAgICAgICBzZXRNaWNNdXRlZChmYWxzZSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgYWxlcnQoJ0toXHUwMEY0bmcgdGhcdTFFQzMgbVx1MUVERiBtaWNybzogJyArIGVyci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGxvY2FsU3RyZWFtUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgbG9jYWxTdHJlYW1SZWYuY3VycmVudC5nZXRBdWRpb1RyYWNrcygpLmZvckVhY2godCA9PiB7IHQuZW5hYmxlZCA9IGZhbHNlOyB9KTtcbiAgICAgIH1cbiAgICAgIHNldE1pY011dGVkKHRydWUpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBsZWF2ZVZvaWNlID0gKCkgPT4ge1xuICAgIGZldGNoKCcvYXBpL3Bob25nLWNvbGxhYicsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb246ICd2b2ljZV9zaWduYWwnLCBzaWduYWxUeXBlOiAnbGVhdmUnLCBwYXlsb2FkOiB7fSB9KVxuICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICBkdW5nS2V0Tm9pVm9pY2UoKTtcbiAgICBzZXRWb2ljZUpvaW5lZChmYWxzZSk7XG4gICAgc2V0Vm9pY2VTdGF0ZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgdm9pY2VTbG90UmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIHNldFZvaWNlTm90aWNlKCdcdTAxMTBcdTAwRTMgbmdcdTFFQUZ0IHZvaWNlLicpO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBpZD1cInN0dWR5LWRvY2stY29udGFpbmVyXCIgc3R5bGU9e3sgb3ZlcmZsb3dBbmNob3I6ICdub25lJyB9fSBjbGFzc05hbWU9e2BiZy1ncmFkaWVudC10by1iIGZyb20tWyMxNjFiMjZdIHRvLVsjMGYxNDFkXSBib3JkZXIgYm9yZGVyLXdoaXRlL1swLjA4XSByb3VuZGVkLTJ4bCBwLTQgZmxleCBmbGV4LWNvbCBzaGFkb3cteGwgJHtpc1Jvb21XaWRlID8gJ21pbi1oLVtjYWxjKDEwMHZoLTE2MHB4KV0gaC1mdWxsIGZsZXgtMScgOiAnaC1bNjIwcHhdIGxnOmgtWzY4MHB4XSd9YH0+XG4gICAgICB7LyogU3R1ZHkgRG9jayBUYWIgTmF2aWdhdGlvbiBcdTIwMTQgR1x1MUVDRG4gZ1x1MDBFMG5nLCB0aFx1MUVBOW0gbVx1MUVGOSwgblx1MDBGQXQgblx1MUVENWkgYlx1MUVBRHQgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBwYi0zIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMCBmbGV4LXdyYXAgc2hyaW5rLTBcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBmbGV4LXdyYXBcIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBpZD1cInRhYi1zdHVkeS1jaGF0XCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYignY2hhdCcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ2NoYXQnXG4gICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQUM8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5DaGF0IHBoXHUwMEYybmc8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktd2hpdGVib2FyZFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldERvY2tUYWIoJ3doaXRlYm9hcmQnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMuNSBweS0yIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgIGRvY2tUYWIgPT09ICd3aGl0ZWJvYXJkJ1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzOGJkZjhdIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNTAnXG4gICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXdoaXRlIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6c2NhbGUtMTA1J1xuICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkE4PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+Qlx1MUVBM25nIHZcdTFFQkQ8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktdm9pY2VcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCd2b2ljZScpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgZG9ja1RhYiA9PT0gJ3ZvaWNlJ1xuICAgICAgICAgICAgICAgID8gJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tYW1iZXItNTAwIHRleHQtYmxhY2sgc2hhZG93LVswXzBfMTVweF9yZ2JhKDI1MSwxOTEsMzYsMC4zNSldIGJvcmRlciBib3JkZXItYW1iZXItNDAwLzUwJ1xuICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgIDxzcGFuPlx1RDgzQ1x1REY5OVx1RkUwRjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPlZvaWNlICgxLTEpPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGlkPVwidGFiLXN0dWR5LW1lbWJlcnNcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREb2NrVGFiKCdtZW1iZXJzJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zLjUgcHktMiByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NSAke1xuICAgICAgICAgICAgICBkb2NrVGFiID09PSAnbWVtYmVycydcbiAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tZW1lcmFsZC00MDAgdG8tdGVhbC01MDAgdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoNTIsMjExLDE1MywwLjM1KV0gYm9yZGVyIGJvcmRlci1lbWVyYWxkLTQwMC81MCdcbiAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3ZlcjpzY2FsZS0xMDUnXG4gICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDNjU8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5UaFx1MDBFMG5oIHZpXHUwMEVBbnt0aGFuaFZpZW4ubGVuZ3RoID4gMCA/IGAgKCR7dGhhbmhWaWVuLmxlbmd0aH0pYCA6ICcnfTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJ0YWItc3R1ZHktcXVhbi10cmlcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RG9ja1RhYigncXVhbi10cmknKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTIgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgICBkb2NrVGFiID09PSAncXVhbi10cmknXG4gICAgICAgICAgICAgICAgICA/ICdiZy1ncmFkaWVudC10by1yIGZyb20tdmlvbGV0LTUwMCB0by1wdXJwbGUtNTAwIHRleHQtd2hpdGUgc2hhZG93LVswXzBfMTVweF9yZ2JhKDEzOSw5MiwyNDYsMC4zNSldIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC81MCdcbiAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS0zMDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnNjYWxlLTEwNSdcbiAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICA8c3Bhbj5cdTI2OTlcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlF1eVx1MUVDMW48L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogRG9jayBDb250ZW50IEJvZHkgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIHB0LTMgbWluLWgtMCBoLWZ1bGwgb3ZlcmZsb3ctaGlkZGVuXCI+XG4gICAgICAgIHsvKiBUQUIgMTogQ0hBVCBQSFx1MDBEMk5HICovfVxuICAgICAgICB7ZG9ja1RhYiA9PT0gJ2NoYXQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIG1pbi1oLTAgaC1mdWxsXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy15LWF1dG8gc3BhY2UteS0zIHByLTEgbWluLWgtMCB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgIHtwaG9uZ0NoYXQubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwIHRleHQtY2VudGVyIHB5LThcIj5DaFx1MDFCMGEgY1x1MDBGMyB0aW4gbmhcdTFFQUZuIFx1MjAxNCBoXHUwMEUzeSBnXHUxRUVEaSBjXHUwMEUydSBoXHUxRUNGaSBob1x1MUVCN2MgdHJhbyBcdTAxMTFcdTFFRDVpIHZcdTFFQzEgYlx1MDBFMGkgZ2lcdTFFQTNuZyE8L3A+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgcGhvbmdDaGF0Lm1hcCgobSwgaWR4KSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBteU5hbWUgPSBTdHJpbmcoYXV0aD8udXNlcj8uaG9UZW4gfHwgYXV0aD8udXNlcj8ubmFtZSB8fCBhdXRoPy51c2VyPy50ZW4gfHwgJycpLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhQ2hpbmhNaW5oID0gQm9vbGVhbihcbiAgICAgICAgICAgICAgICAgICAgbS5jdWFUb2kgfHxcbiAgICAgICAgICAgICAgICAgICAgKG0ua2hvYSAmJiBwaG9uZ01pbmhLaG9hICYmIG0ua2hvYSA9PT0gcGhvbmdNaW5oS2hvYSkgfHxcbiAgICAgICAgICAgICAgICAgICAgKG15TmFtZSAmJiBtLnRlbk5ndW9pR3VpICYmIG0udGVuTmd1b2lHdWkudHJpbSgpLnRvTG93ZXJDYXNlKCkgPT09IG15TmFtZS50b0xvd2VyQ2FzZSgpKVxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHRpbWVTdHIgPSBtLnRhb0x1YyA/IG5ldyBEYXRlKG0udGFvTHVjLnJlcGxhY2UoJyAnLCAnVCcpICsgKG0udGFvTHVjLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLnRvTG9jYWxlVGltZVN0cmluZyhbXSwgeyBob3VyOiAnMi1kaWdpdCcsIG1pbnV0ZTogJzItZGlnaXQnIH0pIDogJyc7XG5cbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e20uaWQgfHwgaWR4fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXggZmxleC1jb2wgZ3JvdXAgdy1mdWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYUNoaW5oTWluaCA/ICdpdGVtcy1lbmQnIDogJ2l0ZW1zLXN0YXJ0J1xuICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICB7LyogSGVhZGVyIHRoXHUwMEY0bmcgdGluIG5nXHUwMUIwXHUxRUREaSBnXHUxRUVEaSAqL31cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgbWItMSB0ZXh0LVsxMXB4XSAke2xhQ2hpbmhNaW5oID8gJ2ZsZXgtcm93LXJldmVyc2UnIDogJyd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2Bmb250LWV4dHJhYm9sZCAke2xhQ2hpbmhNaW5oID8gJ3RleHQtWyMwMEYyRkVdJyA6ICd0ZXh0LXNsYXRlLTIwMCd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHttLnRlbk5ndW9pR3VpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2xhQ2hpbmhNaW5oICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuMiByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy1bIzAwRjJGRV0vMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgc2hhZG93LXNtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQlx1MUVBMW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHttLnZhaVRybyA9PT0gJ2dpYW9fdmllbicgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgR1ZDTlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogbS5sb3BUZW4gPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjIgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMjBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7bS5sb3BUZW59XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgZm9udC1tb25vXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHt0aW1lU3RyfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2lzU3RhZmYgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJYb1x1MDBFMSB0aW4gbmhcdTFFQUZuIG5cdTAwRTB5IChxdVx1MUVBM24gdHJcdTFFQ0IgcGhcdTAwRjJuZylcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLWNoYXQ/cGhvbmdJZD0ke3Bob25nLmlkfSZpZD0ke20uaWR9YCwgeyBtZXRob2Q6ICdERUxFVEUnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQub2sgJiYgb25Yb2FUaW5QaG9uZykgb25Yb2FUaW5QaG9uZyhtLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBiXHUxRUNGIHF1YSAqLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcGFjaXR5LTAgZ3JvdXAtaG92ZXI6b3BhY2l0eS0xMDAgcHgtMSB0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtcm9zZS00MDAgdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgey8qIEJ1YmJsZSB0aW4gbmhcdTFFQUZuICovfVxuICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YG1heC13LVs4NSVdIHNtOm1heC13LVs3OCVdIHB4LTMuNSBweS0yIHRleHQteHMgbGVhZGluZy1yZWxheGVkIGJyZWFrLXdvcmRzIHNoYWRvdy1tZCB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsYUNoaW5oTWluaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ3JvdW5kZWQtMnhsIHJvdW5kZWQtdHIteHMgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBiNGQ4XS8yNSB2aWEtWyMwMDc3YjZdLzMwIHRvLVsjMDBGMkZFXS8yMCBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCB0ZXh0LXdoaXRlIHNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDI0MiwyNTQsMC4xMildJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ3JvdW5kZWQtMnhsIHJvdW5kZWQtdGwteHMgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgaG92ZXI6Ym9yZGVyLXdoaXRlLzIwIHRleHQtc2xhdGUtMjAwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwid2hpdGVzcGFjZS1wcmUtd3JhcFwiPnttLm5vaUR1bmd9PC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAge20udmlkZW9UaW1lU2VjICE9IG51bGwgJiYgbS52aWRlb1RpbWVTZWMgPj0gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB5ZXVDYXVUdWEobS52aWRlb1RpbWVTZWMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm10LTEuNSBpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgcHgtMiBweS0wLjUgcm91bmRlZC1sZyB0ZXh0LVsxMHB4XSBmb250LWJsYWNrIGJnLWN5YW4tNDAwLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIGhvdmVyOmJnLVsjMDBGMkZFXS8zMCB0cmFuc2l0aW9uLWFsbCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MjVCNjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj57ZGluaERhbmdHaWF5UGh1dChtLnZpZGVvVGltZVNlYyl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8ZGl2IHJlZj17Y2hhdEVuZFJlZn0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU2VuZFJvb21DaGF0fSBjbGFzc05hbWU9XCJwdC0yIGJvcmRlci10IGJvcmRlci13aGl0ZS84IGZsZXggZmxleC1jb2wgZ2FwLTIgbXQtYXV0byBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICB7LyogRW1vamkgcGFuZWwgKi99XG4gICAgICAgICAgICAgIHtzaG93RW1vamkgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgZ2FwLTEgcC0yIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsXCI+XG4gICAgICAgICAgICAgICAgICB7WydcdUQ4M0RcdURFMEEnLCdcdUQ4M0RcdURFMDInLCdcdUQ4M0VcdURENzAnLCdcdUQ4M0RcdURFMEUnLCdcdUQ4M0VcdUREMTQnLCdcdUQ4M0RcdURFMDUnLCdcdUQ4M0RcdURFMkQnLCdcdUQ4M0RcdUREMjUnLCdcdTI3NjRcdUZFMEYnLCdcdUQ4M0RcdURDNEQnLCdcdUQ4M0RcdURFNEYnLCdcdUQ4M0NcdURGODknLCdcdTI3MDUnLCdcdUQ4M0RcdURDQUYnLCdcdUQ4M0RcdURDNEInLCdcdUQ4M0RcdURDREEnLCdcdTI3MEZcdUZFMEYnLCdcdUQ4M0NcdURGQUYnLCdcdUQ4M0NcdURGMUYnLCdcdUQ4M0RcdURDQTEnLCdcdTI2QTEnLCdcdUQ4M0NcdURGQzYnLCdcdUQ4M0VcdUREMUQnLCdcdUQ4M0RcdURDQUEnLCdcdUQ4M0VcdUREMjknXS5tYXAoZW0gPT4gKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGtleT17ZW19IHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0Q2hhdElucHV0KHYgPT4gdiArIGVtKTsgc2V0U2hvd0Vtb2ppKGZhbHNlKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LWxnIGhvdmVyOnNjYWxlLTEyNSB0cmFuc2l0aW9uLXRyYW5zZm9ybSBhY3RpdmU6c2NhbGUtOTUgcHgtMVwiPntlbX08L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBmbGV4LTFcIj5cbiAgICAgICAgICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgICBpZD1cImlucHV0LXBob25nLWNoYXRcIlxuICAgICAgICAgICAgICAgICAgICByb3dzPXsxfVxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17Y29RdXllbignY2hhdCcpID8gJ05oXHUxRUFGbiB0aW4gcGhcdTAwRjJuZyBoXHUxRUNEYy4uLicgOiAnQ2hhdCBcdTAxMTFhbmcgYlx1MUVDQiBraFx1MDBGM2EnfVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Y2hhdElucHV0fVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNvUXV5ZW4oJ2NoYXQnKX1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Q2hhdElucHV0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0PXsoKSA9PiB7IGNoYXRDb21wb3NpbmdSZWYuY3VycmVudCA9IHRydWU7IH19XG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ9eygpID0+IHsgY2hhdENvbXBvc2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7IH19XG4gICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInICYmICFlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5uYXRpdmVFdmVudD8uaXNDb21wb3NpbmcgfHwgY2hhdENvbXBvc2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVTZW5kUm9vbUNoYXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgIG1heExlbmd0aD17NTAwfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcHgtNCBweS0yLjUgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS81MCBmb2N1czpzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMCwyNDIsMjU0LDAuMTIpXSByZXNpemUtbm9uZSBtaW4taC1bMzhweF0gbWF4LWgtMjQgZGlzYWJsZWQ6b3BhY2l0eS00MCB0cmFuc2l0aW9uLWFsbFwiXG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHsvKiBFbW9qaSBidXR0b24gKi99XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNvUXV5ZW4oJ2NoYXQnKX1cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNob3dFbW9qaSh2ID0+ICF2KX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctOSBoLTkgcm91bmRlZC0yeGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1iYXNlIHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktMzAgc2hyaW5rLTAgYWN0aXZlOnNjYWxlLTkwICR7XG4gICAgICAgICAgICAgICAgICAgIHNob3dFbW9qaSA/ICdiZy1bIzAwRjJGRV0vMjAgYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgdGV4dC1bIzAwRjJGRV0nIDogJ2JnLXdoaXRlLzUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIGhvdmVyOmJnLXdoaXRlLzEwJ1xuICAgICAgICAgICAgICAgICAgfWB9XG4gICAgICAgICAgICAgICAgICB0aXRsZT1cIkNoXHUxRUNEbiBlbW9qaVwiPlxuICAgICAgICAgICAgICAgICAgXHVEODNEXHVERTBBXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgey8qIFNlbmQgYnV0dG9uICovfVxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tc2VuZC1waG9uZy1jaGF0XCJcbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshY2hhdElucHV0LnRyaW0oKSB8fCBjaGF0U2VuZGluZyB8fCAhY29RdXllbignY2hhdCcpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy05IGgtOSByb3VuZGVkLTJ4bCBiZy1ncmFkaWVudC10by1iciBmcm9tLVsjMDBGMkZFXSB0by1bIzNCODJGNl0gdGV4dC1ibGFjayBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGRpc2FibGVkOm9wYWNpdHktMzAgc2hyaW5rLTAgaG92ZXI6YnJpZ2h0bmVzcy0xMTAgYWN0aXZlOnNjYWxlLTkwIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgwLDI0MiwyNTQsMC4zKV1cIj5cbiAgICAgICAgICAgICAgICAgIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwiY3VycmVudENvbG9yXCIgY2xhc3NOYW1lPVwidy00IGgtNFwiPlxuICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTMuNDc4IDIuNDA1YS43NS43NSAwIDAwLS45MjYuOTRsMi40MzIgNy45MDVIMTMuNWEuNzUuNzUgMCAwMTAgMS41SDQuOTg0bC0yLjQzMiA3LjkwNWEuNzUuNzUgMCAwMC45MjYuOTQgNjAuNTE5IDYwLjUxOSAwIDAwMTguNDQ1LTguOTg2Ljc1Ljc1IDAgMDAwLTEuMjE4QTYwLjUxNyA2MC41MTcgMCAwMDMuNDc4IDIuNDA1elwiIC8+XG4gICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cblxuXG4gICAgICAgIHsvKiBUQUIgMzogQlx1MUVBMk5HIFZcdTFFQkMgQ1x1MUVEOE5HIFRcdTAwQzFDIChTSEFSRUQgV0hJVEVCT0FSRCkgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAnd2hpdGVib2FyZCcgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTIgbWluLWgtMCBoLWZ1bGxcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIGZsZXgtd3JhcCB0ZXh0LXhzIHBiLTFcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4td2ItcGVuXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFdiVG9vbCgncGVuJyl9XG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXdiQ2FuV3JpdGV9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0yLjUgcHktMSByb3VuZGVkLWxnIHRleHQteHMgZm9udC1ib2xkIGRpc2FibGVkOm9wYWNpdHktNDAgJHt3YlRvb2wgPT09ICdwZW4nID8gJ2JnLVsjMDBGMkZFXSB0ZXh0LWJsYWNrJyA6ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCd9YH0+XG4gICAgICAgICAgICAgICAgICBcdTI3MEZcdUZFMEYgQlx1MDBGQXQgdlx1MUVCRFxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4td2ItZXJhc2VyXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFdiVG9vbCgnZXJhc2VyJyl9XG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXdiQ2FuV3JpdGV9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0yLjUgcHktMSByb3VuZGVkLWxnIHRleHQteHMgZm9udC1ib2xkIGRpc2FibGVkOm9wYWNpdHktNDAgJHt3YlRvb2wgPT09ICdlcmFzZXInID8gJ2JnLXJvc2UtNTAwIHRleHQtd2hpdGUnIDogJ2JnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwJ31gfT5cbiAgICAgICAgICAgICAgICAgIFx1RDgzRVx1RERGOSBUXHUxRUE5eVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgbWwtMlwiPlxuICAgICAgICAgICAgICAgICAge1snIzAwRjJGRScsICcjRkZCODAwJywgJyNGNDNGNUUnLCAnI0ZGRkZGRiddLm1hcChjID0+IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIGtleT17Y31cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXdiQ2FuV3JpdGV9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRXYkNvbG9yKGMpOyBzZXRXYlRvb2woJ3BlbicpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNSBoLTUgcm91bmRlZC1mdWxsIGJvcmRlciBkaXNhYmxlZDpvcGFjaXR5LTQwICR7d2JDb2xvciA9PT0gYyAmJiB3YlRvb2wgPT09ICdwZW4nID8gJ3NjYWxlLTExMCBib3JkZXItd2hpdGUgcmluZy0yIHJpbmctY3lhbi00MDAnIDogJ2JvcmRlci10cmFuc3BhcmVudCd9YH1cbiAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiBjIH19XG4gICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2N9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIHtpc1N0YWZmICYmIChcbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXdiLWNsZWFyXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2NsZWFyV2hpdGVib2FyZH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctd2hpdGUvNSBob3ZlcjpiZy1yb3NlLTUwMC8yMCB0ZXh0LXJvc2UtMzAwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdGV4dC14cyBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgIFhcdTAwRjNhIGJcdTFFQTNuZ1xuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIG92ZXJmbG93LWhpZGRlbiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByZWxhdGl2ZSB0b3VjaC1ub25lIG1pbi1oLVsyMjBweF1cIj5cbiAgICAgICAgICAgICAgeyF3YkNhbldyaXRlICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgei0xMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBiZy1ibGFjay80MCB0ZXh0LVsxMXB4XSB0ZXh0LWFtYmVyLTMwMC85MCBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgIFx1RDgzRFx1REQxMiBCXHUxRUEzbmcgdlx1MUVCRCBcdTAxMTFhbmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSBjaFx1MUVDOSB4ZW1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPGNhbnZhc1xuICAgICAgICAgICAgICAgIGlkPVwic3R1ZHktd2hpdGVib2FyZC1jYW52YXNcIlxuICAgICAgICAgICAgICAgIHJlZj17Y2FudmFzUmVmfVxuICAgICAgICAgICAgICAgIHdpZHRoPXs2NDB9XG4gICAgICAgICAgICAgICAgaGVpZ2h0PXszMjB9XG4gICAgICAgICAgICAgICAgb25Nb3VzZURvd249e3diQ2FuV3JpdGUgPyBzdGFydERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Nb3VzZU1vdmU9e3diQ2FuV3JpdGUgPyBkcmF3TW92ZSA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvbk1vdXNlVXA9e3diQ2FuV3JpdGUgPyBzdG9wRHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9e3diQ2FuV3JpdGUgPyBzdG9wRHJhd2luZyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvblRvdWNoU3RhcnQ9e3diQ2FuV3JpdGUgPyBzdGFydERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgb25Ub3VjaE1vdmU9e3diQ2FuV3JpdGUgPyBkcmF3TW92ZSA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBvblRvdWNoRW5kPXt3YkNhbldyaXRlID8gc3RvcERyYXdpbmcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIGgtZnVsbCAke3diQ2FuV3JpdGUgPyAnY3Vyc29yLWNyb3NzaGFpcicgOiAnY3Vyc29yLW5vdC1hbGxvd2VkJ31gfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cblxuXG4gICAgICAgIHsvKiBUQUIgNTogMS1UTy0xIFdFQlJUQyBWT0lDRSBcdTIwMTQgcGFpci1ib3VuZCwgY1x1MDBGMyB4aW4gcXV5XHUxRUMxbiAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICd2b2ljZScgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNiB0ZXh0LWNlbnRlciBnYXAtNFwiPlxuICAgICAgICAgICAgPGF1ZGlvIHJlZj17cmVtb3RlQXVkaW9SZWZ9IGF1dG9QbGF5IC8+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTYgaC0xNiByb3VuZGVkLTN4bCBiZy1hbWJlci00MDAvMTUgYm9yZGVyIGJvcmRlci1hbWJlci00MDAvMzAgdGV4dC1hbWJlci00MDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC0zeGwgc2hhZG93LVswXzBfMjBweF9yZ2JhKDI0NSwxNTgsMTEsMC4yKV1cIj5cbiAgICAgICAgICAgICAgXHVEODNDXHVERjk5XHVGRTBGXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC13aGl0ZVwiPlRob1x1MUVBMWkgVHJcdTFFRjFjIFRpXHUxRUJGcCAxLTEgVHJvbmcgUGhcdTAwRjJuZzwvaDQ+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDAgbWF4LXcteHMgbXQtMVwiPlxuICAgICAgICAgICAgICAgIE1cdTFFRDdpIHBoXHUwMEYybmcgdFx1MUVEMWkgXHUwMTExYSBtXHUxRUQ5dCBjXHUxRUI3cCB2b2ljZSAxLTEuIE1pY3JvIG1cdTFFQjdjIFx1MDExMVx1MUVDQm5oIHRcdTFFQUZ0IGtoaSBjaFx1MDFCMGEgYlx1MUVBRHQuXG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogVHJcdTFFQTFuZyB0aFx1MDBFMWkgY1x1MUVCN3AgaGlcdTFFQzduIHRcdTFFQTFpICovfVxuICAgICAgICAgICAge3ZvaWNlUGFpcj8uYWN0aXZlICE9PSB1bmRlZmluZWQgJiYgKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgYmctd2hpdGUvNSBweC0zIHB5LTEgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgICAgICB7dm9pY2VQYWlyPy5hVGVuID8gYCR7dm9pY2VQYWlyLmFUZW59JHt2b2ljZVBhaXIuYlRlbiA/ICcgXHUyMTk0ICcgKyB2b2ljZVBhaXIuYlRlbiA6ICcgXHUwMEI3IFx1MDExMWFuZyBjaFx1MUVERCBuZ1x1MDFCMFx1MUVERGkgdGhcdTFFRTkgMid9YCA6ICdDaFx1MDFCMGEgY1x1MDBGMyBjXHUxRUI3cCB2b2ljZSBuXHUwMEUwbyd9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgZmxleC13cmFwIGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgICAgICAgIHshdm9pY2VKb2luZWQgPyAoXG4gICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgIHtjb1F1eWVuKCd2b2ljZScpID8gKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdm9pY2Utam9pblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17am9pblZvaWNlfVxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt2b2ljZVBhaXI/LmFjdGl2ZSAmJiAhdm9pY2VQYWlyPy55b3VJbn1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIuNSByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1hbWJlci00MDAgdG8tb3JhbmdlLTUwMCB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC14cyBzaGFkb3ctbGcgaG92ZXI6b3BhY2l0eS05MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZGlzYWJsZWQ6b3BhY2l0eS00MFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHt2b2ljZVBhaXI/LmFjdGl2ZSA/ICdcdTAxMTBhbmcgY1x1MDBGMyBjXHUxRUI3cCB2b2ljZSBraFx1MDBFMWMnIDogdm9pY2VQYWlyPy5hVGVuID8gJ1ZcdTAwRTBvIGNcdTFFQjdwIHZcdTFFREJpICcgKyB2b2ljZVBhaXIuYVRlbiA6ICdUaGFtIGdpYSB2b2ljZSd9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLXJlcXVlc3RcIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3hpblF1eWVuVm9pY2V9XG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZvaWNlUmVxdWVzdGVkfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMi41IHJvdW5kZWQteGwgYmctd2hpdGUvMTAgdGV4dC1zbGF0ZS0yMDAgYm9yZGVyIGJvcmRlci13aGl0ZS8xNSBmb250LWJvbGQgdGV4dC14cyBob3ZlcjpiZy13aGl0ZS8xNSB0cmFuc2l0aW9uLWFsbCBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3ZvaWNlUmVxdWVzdGVkID8gJ1x1MjNGMyBcdTAxMTBhbmcgY2hcdTFFREQgZHV5XHUxRUM3dFx1MjAyNicgOiAnXHVEODNEXHVERTRCIFhpbiBxdXlcdTFFQzFuIHZvaWNlJ31cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS10b2dnbGUtbWljXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlTWljfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC00IHB5LTIuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHttaWNNdXRlZCA/ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3ZlcjpiZy13aGl0ZS8xNScgOiAnYmctZW1lcmFsZC01MDAgdGV4dC1ibGFjayd9YH0+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPnttaWNNdXRlZCA/ICdcdUQ4M0RcdUREMDcgQlx1MUVBRHQgTWljJyA6ICdcdUQ4M0NcdURGOTlcdUZFMEYgTWljIFx1MDExMGFuZyBCXHUxRUFEdCd9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12b2ljZS1sZWF2ZVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2xlYXZlVm9pY2V9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMi41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMjAgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLXJvc2UtNTAwLzMwIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgIFJcdTFFRERpIHZvaWNlXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAge2lzU3RhZmYgJiYgdm9pY2VQYWlyPy5hVGVuICYmICF2b2ljZVBhaXI/LnlvdUluICYmIChcbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZvaWNlLWVuZFwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtuZ2F0Vm9pY2VDYXB9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIuNSByb3VuZGVkLXhsIGJnLXJvc2UtNTAwLzEwIHRleHQtcm9zZS0zMDAgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8yNSB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8yMCB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICAgICAgTmdcdTFFQUZ0IGNcdTFFQjdwIHZvaWNlXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFN0YWZmOiBkYW5oIHNcdTAwRTFjaCB4aW4gcXV5XHUxRUMxbiB2b2ljZSAqL31cbiAgICAgICAgICAgIHtpc1N0YWZmICYmIHlldUNhdVZvaWNlLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy1zbSBiZy13aGl0ZS81IGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTIuNSB0ZXh0LWxlZnRcIj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHRleHQtYW1iZXItMzAwIG1iLTEuNVwiPlx1MDExMGFuZyB4aW4gcXV5XHUxRUMxbiB2b2ljZTwvcD5cbiAgICAgICAgICAgICAgICB7eWV1Q2F1Vm9pY2UubWFwKHIgPT4gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3Iua2hvYX0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyBweS0xXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtMjAwIGZvbnQtc2VtaWJvbGQgZmxleC0xIHRydW5jYXRlXCI+e3IudGVuIHx8ICdUaFx1MDBFMG5oIHZpXHUwMEVBbid9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4geyBjb25zdCBkID0gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiByLmtob2EsIGNhcGFiaWxpdHk6ICd2b2ljZScsIG9uOiB0cnVlIH0pOyBpZiAoZD8ub2spIHNldFlldUNhdVZvaWNlKHByZXYgPT4gcHJldi5maWx0ZXIoeCA9PiB4Lmtob2EgIT09IHIua2hvYSkpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctZW1lcmFsZC01MDAvMjAgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIER1eVx1MUVDN3RcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7IGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2dyYW50JywgeyBraG9hVFY6IHIua2hvYSwgY2FwYWJpbGl0eTogJ3ZvaWNlJywgb246IGZhbHNlIH0pOyBpZiAoZD8ub2spIHNldFlldUNhdVZvaWNlKHByZXYgPT4gcHJldi5maWx0ZXIoeCA9PiB4Lmtob2EgIT09IHIua2hvYSkpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzI1IHRleHQtWzEwcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgICAgICAgIFRcdTFFRUIgY2hcdTFFRDFpXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAge3ZvaWNlTm90aWNlICYmIChcbiAgICAgICAgICAgICAgPHAgaWQ9XCJ2b2ljZS1zdGF0dXMtbm90aWNlXCIgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTMwMCBmb250LW1vbm8gYmctYmxhY2svNDAgcHgtMyBweS0xLjUgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICB7dm9pY2VOb3RpY2V9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCBtYXgtdy14c1wiPlxuICAgICAgICAgICAgICAqIEdoaSBjaFx1MDBGQTogS1x1MUVCRnQgblx1MUVEMWkgdGhvXHUxRUExaSBQMlAgeVx1MDBFQXUgY1x1MUVBN3UgbVx1MUVBMW5nIGtoXHUwMEY0bmcgY2hcdTFFQjduIFVEUC4gUmVzdHJpY3RpdmUgTkFUIGNcdTAwRjMgdGhcdTFFQzMgY1x1MUVBN24gcmVsYXkgVFVSTi5cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVEFCIDc6IFRIXHUwMEMwTkggVklcdTAwQ0FOIFRST05HIFBIXHUwMEQyTkcgKi99XG4gICAgICAgIHtkb2NrVGFiID09PSAnbWVtYmVycycgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgZ2FwLTMgbWluLWgtMCBoLWZ1bGxcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHBiLTIgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ibGFjayB0ZXh0LXdoaXRlIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDNjU8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+VGhcdTAwRTBuaCB2aVx1MDBFQW4gdHJvbmcgcGhcdTAwRjJuZyAoe3RoYW5oVmllbi5sZW5ndGh9KTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgICAgIFx1MDExMGFuZyB0clx1MUVGMWMgdHV5XHUxRUJGblxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMiBvdmVyZmxvdy15LWF1dG8gcHItMSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgIHt0aGFuaFZpZW4ubWFwKCh0diwgaWR4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGFIb3N0ID0gdHYubGFDaHVQaG9uZyA9PT0gMSB8fCB0di52YWlUcm9QaG9uZyA9PT0gJ2hvc3QnO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhR1YgPSB0di52YWlUcm8gPT09ICdnaWFvX3ZpZW4nO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhQ29Ib3N0ID0gdHYudmFpVHJvUGhvbmcgPT09ICdjb2hvc3QnO1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50Vm9pY2UgPSBncmFudHMuc29tZShnID0+IGcua2hvYVRWID09PSB0di5raG9hICYmIGcuY2FwYWJpbGl0eSA9PT0gJ3ZvaWNlJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JhbnRWaWRlbyA9IGdyYW50cy5zb21lKGcgPT4gZy5raG9hVFYgPT09IHR2Lmtob2EgJiYgZy5jYXBhYmlsaXR5ID09PSAndmlkZW9fY29udHJvbCcpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAga2V5PXt0di5raG9hIHx8IHR2LnRlbiB8fCBpZHh9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjUgcC0yLjUgcm91bmRlZC14bCBiZy13aGl0ZS9bMC4wM10gaG92ZXI6Ymctd2hpdGUvWzAuMDZdIGJvcmRlciBib3JkZXItd2hpdGUvNSBob3Zlcjpib3JkZXItdGVhbC01MDAvMjUgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTggaC04IHJvdW5kZWQtZnVsbCBiZy1ncmFkaWVudC10by1iciBmcm9tLXRlYWwtNTAwLzIwIHRvLWVtZXJhbGQtNTAwLzIwIGJvcmRlciBib3JkZXItdGVhbC01MDAvMzAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC14cyBmb250LWJsYWNrIHRleHQtdGVhbC0zMDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7dHYuYXZhdGFyID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3R2LmF2YXRhcn0gYWx0PVwiXCIgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCByb3VuZGVkLWZ1bGwgb2JqZWN0LWNvdmVyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgKHR2LnRlbiB8fCAnPycpLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtMjAwIHRydW5jYXRlXCI+e3R2LnRlbn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bGFIb3N0ICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ibGFjayBiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0RcdURDNTEgSG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAge2xhR1YgJiYgIWxhSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctWyMwMEYyRkVdLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERjkzIEdpXHUwMEUxbyB2aVx1MDBFQW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsYUNvSG9zdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyIGJvcmRlci12aW9sZXQtNTAwLzMwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyQjUwIENvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCBibG9jayB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3R2LmxvcFRlbiA/IGBMXHUxRURCcCAke3R2LmxvcFRlbn1gIDogKGxhR1YgPyAnR2lcdTAwRTFvIHZpXHUwMEVBbiB0clx1MDFCMFx1MUVERG5nJyA6ICdIXHUxRUNEYyBzaW5oJyl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICB7LyogTWVtYmVyIGFjdGlvbnMgblx1MUVCRnUgbFx1MDBFMCBob3N0L0dWICovfVxuICAgICAgICAgICAgICAgICAgICB7KHZhaVRyb1Bob25nID09PSAnaG9zdCcgfHwgYXV0aC51c2VyPy5pc1RlYWNoZXIpICYmICFsYUhvc3QgJiYgdHYua2hvYSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdzZXRfY29faG9zdCcsIHsga2hvYVRWOiB0di5raG9hLCBvbjogIWxhQ29Ib3N0IH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17bGFDb0hvc3QgPyAnVGh1IHF1eVx1MUVDMW4gY28taG9zdCcgOiAnQ1x1MUVBNXAgY28taG9zdCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYUNvSG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyLXZpb2xldC01MDAvNDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGJvcmRlci13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvLWhvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogIWdyYW50Vm9pY2UgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ1x1MUVBNXAvdGh1IHF1eVx1MUVDMW4gbWljXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy02IGgtNiByb3VuZGVkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYW50Vm9pY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICBcdUQ4M0NcdURGOTlcdUZFMEZcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndmlkZW9fY29udHJvbCcsIG9uOiAhZ3JhbnRWaWRlbyB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDXHUxRUE1cC90aHUgcXV5XHUxRUMxbiB2aWRlb1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctNiBoLTYgcm91bmRlZCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LVsxMHB4XSBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFudFZpZGVvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ibHVlLTUwMC8yMCB0ZXh0LWJsdWUtMzAwIGJvcmRlci1ibHVlLTUwMC80MCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHVEODNDXHVERkE1XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlybShgS2ljayAke3R2LnRlbn0ga2hcdTFFQ0ZpIHBoXHUwMEYybmc/YCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBhd2FpdCBoYW5oRG9uZ1Bob25nPy4oJ2tpY2snLCB7IGtob2FUVjogdHYua2hvYSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkICYmICFkLm9rKSBhbGVydChkLmxvaSB8fCAnS2hcdTAwRjRuZyBraWNrIFx1MDExMVx1MDFCMFx1MUVFM2MuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIktpY2sga2hcdTFFQ0ZpIHBoXHUwMEYybmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTYgaC02IHJvdW5kZWQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTBweF0gYm9yZGVyIGJnLXJvc2UtNTAwLzEwIHRleHQtcm9zZS0zMDAgYm9yZGVyLXJvc2UtNTAwLzI1IGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxNVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9KX1cblxuICAgICAgICAgICAgICB7dGhhbmhWaWVuLmxlbmd0aCA9PT0gMCAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS04IHRleHQtc2xhdGUtNTAwIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgIENoXHUwMUIwYSBjXHUwMEYzIHRoXHUwMEUwbmggdmlcdTAwRUFuIG5cdTAwRTBvIHRyb25nIHBoXHUwMEYybmcuXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuXG5cbiAgICAgICAgey8qIFRBQiA2OiBRVVx1MUVBMk4gVFJcdTFFQ0EgUEhcdTAwRDJORyAoc3RhZmYgb25seSkgXHUyMDE0IHBvbGljeSBtYXRyaXggKyBtZW1iZXIgYWN0aW9ucyAqL31cbiAgICAgICAge2RvY2tUYWIgPT09ICdxdWFuLXRyaScgJiYgaXNTdGFmZiAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMyBvdmVyZmxvdy15LWF1dG8gbWluLWgtMCBwci0xIGgtZnVsbFwiPlxuICAgICAgICAgICAgey8qIFF1aWNrIGFjdGlvbnMgdGhlbyBtXHUwMEY0IGhcdTAwRUNuaCBcdTAxMTFcdTAwRTMgY2hcdTFFRDF0ICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBmbGV4LXdyYXBcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2FwIG9mIFsnbm90ZXMnLCAnd2hpdGVib2FyZCcsICdzaGVldCddKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IDEsIGFjY2Vzc01vZGU6ICdzdGFmZl9vbmx5JyB9KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTUgdGV4dC1yb3NlLTMwMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRleHQtWzExcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1yb3NlLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgIFx1RDgzRFx1REQxMiBLaFx1MDBGM2EgY1x1MUVEOW5nIHRcdTAwRTFjIChjaFx1MUVDOSB4ZW0pXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjYXAgb2YgWydub3RlcycsICd3aGl0ZWJvYXJkJywgJ3NoZWV0J10pIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdwb2xpY3knLCB7IGNhcGFiaWxpdHk6IGNhcCwgZW5hYmxlZDogMSwgYWNjZXNzTW9kZTogJ2V2ZXJ5b25lJyB9KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQteGwgYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQtWzExcHhdIGZvbnQtYm9sZCBob3ZlcjpiZy1lbWVyYWxkLTUwMC8yNVwiPlxuICAgICAgICAgICAgICAgIFx1RDgzRFx1REQxMyBNXHUxRURGIGNcdTFFRDluZyB0XHUwMEUxYyBjaG8gbVx1MUVDRGkgbmdcdTAxQjBcdTFFRERpXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBQb2xpY3kgbWF0cml4ICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtM1wiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHRleHQtc2xhdGUtNDAwIG1iLTJcIj5DaFx1MDBFRG5oIHNcdTAwRTFjaCBjXHUwMEY0bmcgY1x1MUVFNTwvcD5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNVwiPlxuICAgICAgICAgICAgICAgIHtbXG4gICAgICAgICAgICAgICAgICBbJ3ZpZGVvX2NvbnRyb2wnLCAnXHUwMTEwaVx1MUVDMXUga2hpXHUxRUMzbiBwaFx1MDBFMXQgKHBsYXkvcGF1c2UvdHVhKSddLFxuICAgICAgICAgICAgICAgICAgWyd2aWRlb19jaGFuZ2UnLCAnXHUwMTEwXHUxRUQ1aSB2aWRlbyBcdTAxMTFhbmcgcGhcdTAwRTF0J10sXG4gICAgICAgICAgICAgICAgICBbJ3F1ZXVlJywgJ0hcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHZpZGVvJ10sXG4gICAgICAgICAgICAgICAgICBbJ2NoYXQnLCAnQ2hhdCBwaFx1MDBGMm5nJ10sXG4gICAgICAgICAgICAgICAgICBbJ3doaXRlYm9hcmQnLCAnQlx1MUVBM25nIHZcdTFFQkQnXSxcbiAgICAgICAgICAgICAgICAgIFsndm9pY2UnLCAnVm9pY2UgMS0xJ10sXG4gICAgICAgICAgICAgICAgICBbJ2ludml0ZScsICdNXHUxRUREaSBuZ1x1MDFCMFx1MUVERGkgdlx1MDBFMG8gcGhcdTAwRjJuZyddLFxuICAgICAgICAgICAgICAgIF0ubWFwKChbY2FwLCBuaGFuXSkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgcG9sID0gcG9saWNpZXM/LltjYXBdIHx8IHsgZW5hYmxlZDogMSwgYWNjZXNzX21vZGU6ICdzdGFmZl9vbmx5JyB9O1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e2NhcH0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14c1wiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZsZXgtMSB0ZXh0LXNsYXRlLTMwMCB0cnVuY2F0ZVwiPntuaGFufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LigncG9saWN5JywgeyBjYXBhYmlsaXR5OiBjYXAsIGVuYWJsZWQ6IHBvbC5lbmFibGVkID8gMCA6IDEsIGFjY2Vzc01vZGU6IHBvbC5hY2Nlc3NfbW9kZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtwb2wuZW5hYmxlZCA/ICdcdTAxMTBhbmcgYlx1MUVBRHQgXHUyMDE0IGJcdTFFQTVtIFx1MDExMVx1MUVDMyB0XHUxRUFGdCcgOiAnXHUwMTEwYW5nIHRcdTFFQUZ0IFx1MjAxNCBiXHUxRUE1bSBcdTAxMTFcdTFFQzMgYlx1MUVBRHQnfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy04IGgtNC41IHB4LTAuNSByb3VuZGVkLWZ1bGwgYm9yZGVyIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyICR7cG9sLmVuYWJsZWQgPyAnYmctZW1lcmFsZC01MDAvMzAgYm9yZGVyLWVtZXJhbGQtNTAwLzQwIGp1c3RpZnktZW5kJyA6ICdiZy13aGl0ZS81IGJvcmRlci13aGl0ZS8xNSBqdXN0aWZ5LXN0YXJ0J31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHctMyBoLTMgcm91bmRlZC1mdWxsICR7cG9sLmVuYWJsZWQgPyAnYmctZW1lcmFsZC00MDAnIDogJ2JnLXNsYXRlLTUwMCd9YH0+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtwb2wuYWNjZXNzX21vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXBvbC5lbmFibGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gaGFuaERvbmdQaG9uZz8uKCdwb2xpY3knLCB7IGNhcGFiaWxpdHk6IGNhcCwgZW5hYmxlZDogMSwgYWNjZXNzTW9kZTogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIHB4LTEuNSBweS0xIHRleHQtWzEwcHhdIHRleHQtc2xhdGUtMjAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMEYyRkVdLzUwIGRpc2FibGVkOm9wYWNpdHktNDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJzdGFmZl9vbmx5XCI+UXVcdTFFQTNuIHRyXHUxRUNCPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwic2VsZWN0ZWRfbWVtYmVyc1wiPk1cdTFFRDl0IHNcdTFFRDEgbmdcdTAxQjBcdTFFRERpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiZXZlcnlvbmVcIj5NXHUxRUNEaSBuZ1x1MDFCMFx1MUVERGk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyBvcGFjaXR5LTYwXCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmbGV4LTEgdGV4dC1zbGF0ZS00MDBcIj5LaVx1MUVDM20gZHV5XHUxRUM3dCAoa2ljay94b1x1MDBFMSB0aW4pPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSBmb250LWJvbGQgdGV4dC1hbWJlci0zMDAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgcm91bmRlZCBweC0xLjUgcHktMC41XCI+TFVcdTAwRDROIFFVXHUxRUEyTiBUUlx1MUVDQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFF1XHUxRUEzbiBsXHUwMEZEIHRoXHUwMEUwbmggdmlcdTAwRUFuICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHAtM1wiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHRleHQtc2xhdGUtNDAwIG1iLTJcIj5UaFx1MDBFMG5oIHZpXHUwMEVBbiAmIHF1eVx1MUVDMW4gcmlcdTAwRUFuZzwvcD5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNVwiPlxuICAgICAgICAgICAgICAgIHsodGhhbmhWaWVuIHx8IFtdKS5tYXAodHYgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgbGFIb3N0ID0gQm9vbGVhbih0di5sYUNodVBob25nKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhR1YgPSB0di52YWlUcm8gPT09ICdnaWFvX3ZpZW4nO1xuICAgICAgICAgICAgICAgICAgY29uc3QgbGFDb0hvc3QgPSB0di52YWlUcm9QaG9uZyA9PT0gJ2NvX2hvc3QnO1xuICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbnRWb2ljZSA9IChncmFudHMgfHwgW10pLnNvbWUoZyA9PiBnLmtob2EgPT09IHR2Lmtob2EgJiYgZy5jYXBhYmlsaXR5ID09PSAndm9pY2UnICYmIGcudHJhbmdUaGFpID09PSAnZ3JhbnRlZCcpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbnRWaWRlbyA9IChncmFudHMgfHwgW10pLnNvbWUoZyA9PiBnLmtob2EgPT09IHR2Lmtob2EgJiYgZy5jYXBhYmlsaXR5ID09PSAndmlkZW9fY29udHJvbCcgJiYgZy50cmFuZ1RoYWkgPT09ICdncmFudGVkJyk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17dHYua2hvYSB8fCB0di50ZW59IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgdGV4dC14cyBmbGV4LXdyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTIwMCBmb250LXNlbWlib2xkIHRydW5jYXRlIG1heC13LVsxMTBweF1cIj57dHYudGVufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICB7bGFIb3N0ICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1hbWJlci00MDAgZm9udC1ib2xkXCI+XHUyNjA1IGhvc3Q8L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgIHtsYUdWICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1bIzAwRjJGRV0gZm9udC1ib2xkXCI+R1Y8L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgIHtsYUNvSG9zdCAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtdmlvbGV0LTMwMCBmb250LWJvbGRcIj5jby1ob3N0PC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICB7IWxhSG9zdCAmJiAhbGFHViAmJiB0di5raG9hICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1sLWF1dG8gZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgeyh2YWlUcm9QaG9uZyA9PT0gJ2hvc3QnIHx8IGF1dGgudXNlcj8uaXNUZWFjaGVyKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1Bob25nPy4oJ3NldF9jb19ob3N0JywgeyBraG9hVFY6IHR2Lmtob2EsIG9uOiAhbGFDb0hvc3QgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17bGFDb0hvc3QgPyAnVGh1IHF1eVx1MUVDMW4gY28taG9zdCcgOiAnQ1x1MUVBNXAgY28taG9zdCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyICR7bGFDb0hvc3QgPyAnYmctdmlvbGV0LTUwMC8yMCB0ZXh0LXZpb2xldC0zMDAgYm9yZGVyLXZpb2xldC01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY28taG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdQaG9uZz8uKCdncmFudCcsIHsga2hvYVRWOiB0di5raG9hLCBjYXBhYmlsaXR5OiAndm9pY2UnLCBvbjogIWdyYW50Vm9pY2UgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDXHUxRUE1cC90aHUgcXV5XHUxRUMxbiB2b2ljZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMS41IHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJvcmRlciAke2dyYW50Vm9pY2UgPyAnYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlci1hbWJlci01MDAvNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzQ1x1REY5OVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUGhvbmc/LignZ3JhbnQnLCB7IGtob2FUVjogdHYua2hvYSwgY2FwYWJpbGl0eTogJ3ZpZGVvX2NvbnRyb2wnLCBvbjogIWdyYW50VmlkZW8gfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDXHUxRUE1cC90aHUgcXV5XHUxRUMxbiBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIHZpZGVvXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyICR7Z3JhbnRWaWRlbyA/ICdiZy1jeWFuLTUwMC8yMCB0ZXh0LWN5YW4tMzAwIGJvcmRlci1jeWFuLTUwMC80MCcgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNUI2XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4geyBpZiAoY29uZmlybShgS2ljayAke3R2LnRlbn0ga2hcdTFFQ0ZpIHBoXHUwMEYybmc/YCkpIHsgY29uc3QgZCA9IGF3YWl0IGhhbmhEb25nUGhvbmc/Ligna2ljaycsIHsga2hvYVRWOiB0di5raG9hIH0pOyBpZiAoZCAmJiAhZC5vaykgYWxlcnQoZC5sb2kgfHwgJ0toXHUwMEY0bmcga2ljayBcdTAxMTFcdTAxQjBcdTFFRTNjLicpOyB9IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJLaWNrIGtoXHUxRUNGaSBwaFx1MDBGMm5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJvbGQgYm9yZGVyIGJnLXJvc2UtNTAwLzEwIHRleHQtcm9zZS0zMDAgYm9yZGVyLXJvc2UtNTAwLzI1IGhvdmVyOmJnLXJvc2UtNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2lja1xuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgeyh0aGFuaFZpZW4gfHwgW10pLmxlbmd0aCA9PT0gMCAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMFwiPkNoXHUwMUIwYSBjXHUwMEYzIHRoXHUwMEUwbmggdmlcdTAwRUFuLjwvcD59XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBcdTAxMTBcdTFFRDVpL2JcdTFFQ0YgbVx1MUVBRHQga2hcdTFFQTl1IFx1MjAxNCBjaFx1MUVDOSBob3N0L0dWICovfVxuICAgICAgICAgICAgeyh2YWlUcm9QaG9uZyA9PT0gJ2hvc3QnIHx8IGF1dGgudXNlcj8uaXNUZWFjaGVyKSAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC14bCBwLTMgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIk1cdTFFQUR0IGtoXHUxRUE5dSBtXHUxRURCaSAoXHUwMTExXHUxRUMzIHRyXHUxRUQxbmcgPSBiXHUxRUNGIG1cdTFFQUR0IGtoXHUxRUE5dSlcIlxuICAgICAgICAgICAgICAgICAgaWQ9XCJpbnB1dC1waG9uZy1tYXQta2hhdS1tb2lcIlxuICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXsxMDB9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBweC0yLjUgcHktMS41IHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1bIzAwRjJGRV0vNTBcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucHV0LXBob25nLW1hdC1raGF1LW1vaScpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtayA9IGVsPy52YWx1ZSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IG1rLnRyaW0oKVxuICAgICAgICAgICAgICAgICAgICAgID8gYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdkb2lfbWF0X2toYXUnLCB7IG1hdEtoYXVNb2k6IG1rLnRyaW0oKSB9KVxuICAgICAgICAgICAgICAgICAgICAgIDogYXdhaXQgaGFuaERvbmdQaG9uZz8uKCdib19tYXRfa2hhdScsIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGQgJiYgIWQub2spIGFsZXJ0KGQubG9pIHx8ICdLaFx1MDBGNG5nIFx1MDExMVx1MUVENWkgXHUwMTExXHUwMUIwXHUxRUUzYyBtXHUxRUFEdCBraFx1MUVBOXUuJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbCkgZWwudmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEuNSByb3VuZGVkLWxnIGJnLWFtYmVyLTUwMC8xNSB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgaG92ZXI6YmctYW1iZXItNTAwLzI1XCI+XG4gICAgICAgICAgICAgICAgICBcdTAxMTBcdTFFRDVpIC8gQlx1MUVDRlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIENhbXB1c1dhdGNoVG9nZXRoZXIoe1xuICBwaG9uZyxcbiAgcGhvbmdNaW5oS2hvYSxcbiAgYXV0aCxcbiAgZG9uZ1Bob25nSGllblRhaTogX2RvbmdQaG9uZ0hpZW5UYWksXG4gIHNvTmd1b2k6IF9zb05ndW9pLFxuICBteUNhcHMsXG4gIHZpZGVvVGltZVJlZixcbiAgaXNSb29tV2lkZSxcbiAgbGF5b3V0UmF0aW8gPSAnNjo0JyxcbiAgaGFuaERvbmdQaG9uZzogX2hhbmhEb25nUGhvbmcsXG4gIGlzU3RhZmYgPSBmYWxzZSxcbn0pIHtcbiAgY29uc3QgW3dhdGNoU3RhdGUsIHNldFdhdGNoU3RhdGVdID0gdXNlU3RhdGUoe1xuICAgIHBsYXlpbmc6IGZhbHNlLFxuICAgIHBvc2l0aW9uU2Vjb25kczogMCxcbiAgICBiYXNlUG9zaXRpb25TZWNvbmRzOiAwLFxuICAgIHBsYXliYWNrUmF0ZTogMS4wLFxuICAgIHJldmlzaW9uOiAxLFxuICAgIHVwZGF0ZWRBdDogJycsXG4gICAgc2VydmVyTm93OiAnJyxcbiAgICB1cGRhdGVkQnk6ICcnXG4gIH0pO1xuICBjb25zdCBbY2FuQ29udHJvbCwgc2V0Q2FuQ29udHJvbF0gPSB1c2VTdGF0ZShCb29sZWFuKFxuICAgIGF1dGg/LnVzZXI/LmlzVGVhY2hlciB8fCBwaG9uZz8uY2FuQ29udHJvbCB8fCBwaG9uZz8ubGFDaHVQaG9uZyB8fCBteUNhcHM/LnZpZGVvX2NvbnRyb2wgfHwgbXlDYXBzPy52aWRlb19jaGFuZ2UgfHwgaXNTdGFmZlxuICApKTtcbiAgY29uc3QgW193YXRjaENhcHMsIHNldFdhdGNoQ2Fwc10gPSB1c2VTdGF0ZSh7fSk7XG4gIGNvbnN0IGdldEluaXRpYWxWaWRlb1VybCA9ICgpID0+IHtcbiAgICBsZXQgYyA9IHt9O1xuICAgIHRyeSB7IGMgPSBwaG9uZz8uY2F1SGluaCA/IEpTT04ucGFyc2UocGhvbmcuY2F1SGluaCkgOiB7fTsgfSBjYXRjaCB7IH1cbiAgICByZXR1cm4gYy52aWRlb1VybCB8fCBwaG9uZz8udmlkZW9VcmwgfHwgJyc7XG4gIH07XG5cbiAgY29uc3QgZ2V0SW5pdGlhbFByb3ZpZGVyID0gKHUpID0+IHtcbiAgICBpZiAoIXUpIHJldHVybiAnVU5TVVBQT1JURUQnO1xuICAgIGlmIChpZFlvdXR1YmUodSkpIHJldHVybiAnWU9VVFVCRSc7XG4gICAgaWYgKGlkR29vZ2xlRHJpdmUodSkpIHJldHVybiAnR09PR0xFX0RSSVZFJztcbiAgICBpZiAobGFWaWRlb1RydWNUaWVwRmUodSkpIHJldHVybiAnTkFUSVZFX0hUTUw1JztcbiAgICByZXR1cm4gJ1VOU1VQUE9SVEVEJztcbiAgfTtcblxuICBjb25zdCBpbml0VXJsID0gZ2V0SW5pdGlhbFZpZGVvVXJsKCk7XG4gIGNvbnN0IFthY3RpdmVWaWRlb1VybCwgc2V0QWN0aXZlVmlkZW9VcmxdID0gdXNlU3RhdGUoaW5pdFVybCk7XG4gIGNvbnN0IFtwcm92aWRlciwgc2V0UHJvdmlkZXJdID0gdXNlU3RhdGUoKCkgPT4gZ2V0SW5pdGlhbFByb3ZpZGVyKGluaXRVcmwpKTtcbiAgY29uc3QgW2hhc0ludGVyYWN0ZWQsIHNldEhhc0ludGVyYWN0ZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9jYWxUaW1lLCBzZXRMb2NhbFRpbWVdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtkdXJhdGlvbiwgc2V0RHVyYXRpb25dID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtkYW5nR3VpTGVuaCwgc2V0RGFuZ0d1aUxlbmhdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9pLCBzZXRMb2ldID0gdXNlU3RhdGUoJycpO1xuXG4gIC8vIENoXHUxRUJGIFx1MDExMVx1MUVEOSB4ZW0gdHJcdTFFRjFjIHRpXHUxRUJGcCBjXHUwMEY5bmcgY2hcdTFFRTcgcGhcdTAwRjJuZyBoYXkgdFx1MUVBMW0gZFx1MUVFQm5nL3hlbSByaVx1MDBFQW5nIGNcdTFFRTdhIG5nXHUwMUIwXHUxRUREaSB0aGFtIGdpYVxuICBjb25zdCBbaXNMaXZlV2l0aEhvc3QsIHNldElzTGl2ZVdpdGhIb3N0XSA9IHVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBpc0xpdmVXaXRoSG9zdFJlZiA9IHVzZVJlZih0cnVlKTtcbiAgY29uc3QgW3ZpZXdlcklzUGF1c2VkLCBzZXRWaWV3ZXJJc1BhdXNlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IGlzUHJvZ3JhbW1hdGljQWN0aW9uUmVmID0gdXNlUmVmKGZhbHNlKTtcblxuICAvLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ1x1MUVBNFUgSFx1MDBDQ05IIFZJREVPLCBUXHUwMENDTSBLSVx1MUVCRU0gWU9VVFVCRSAmIEhcdTAwQzBORyBcdTAxMTBcdTFFRTJJIFRcdTFFQTBJIFZcdTAwRDlORyAxIFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCBbbWVkaWFUYWIsIHNldE1lZGlhVGFiXSA9IHVzZVN0YXRlKCdzZWFyY2gnKTsgLy8gJ3NlYXJjaCcgfCAncXVldWUnXG4gIGNvbnN0IFt2aWRlb01vaSwgc2V0VmlkZW9Nb2ldID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbZGFuZ0RvaVZpZGVvLCBzZXREYW5nRG9pVmlkZW9dID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbG9pVmlkZW8sIHNldExvaVZpZGVvXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3Rob25nQmFvVmlkZW8sIHNldFRob25nQmFvVmlkZW9dID0gdXNlU3RhdGUoJycpO1xuXG4gIC8vIFlvdVR1YmUgU2VhcmNoIFN0YXRlXG4gIGNvbnN0IFt5dFF1ZXJ5LCBzZXRZdFF1ZXJ5XSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3l0UmVzdWx0cywgc2V0WXRSZXN1bHRzXSA9IHVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW3NlYXJjaGluZ1l0LCBzZXRTZWFyY2hpbmdZdF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzZWFyY2hMb2ksIHNldFNlYXJjaExvaV0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gUXVldWUgU3RhdGVcbiAgY29uc3QgW3F1ZXVlTGlzdCwgc2V0UXVldWVMaXN0XSA9IHVzZVN0YXRlKFtdKTtcbiAgY29uc3QgcXVldWVMaXN0UmVmID0gdXNlUmVmKHF1ZXVlTGlzdCk7XG4gIHF1ZXVlTGlzdFJlZi5jdXJyZW50ID0gcXVldWVMaXN0O1xuICBjb25zdCBbcXVldWVCdXN5LCBzZXRRdWV1ZUJ1c3ldID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbZGFNb1JvbmdTdHVkaW8sIHNldERhTW9Sb25nU3R1ZGlvXSA9IHVzZVN0YXRlKHRydWUpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHBob25nPy5jYW5Db250cm9sIHx8IHBob25nPy5sYUNodVBob25nIHx8IGF1dGg/LnVzZXI/LmlzVGVhY2hlciB8fCBteUNhcHM/LnZpZGVvX2NvbnRyb2wgfHwgbXlDYXBzPy52aWRlb19jaGFuZ2UgfHwgaXNTdGFmZikge1xuICAgICAgc2V0Q2FuQ29udHJvbCh0cnVlKTtcbiAgICB9XG4gIH0sIFtwaG9uZz8uY2FuQ29udHJvbCwgcGhvbmc/LmxhQ2h1UGhvbmcsIGF1dGg/LnVzZXI/LmlzVGVhY2hlciwgbXlDYXBzLCBpc1N0YWZmXSk7XG5cbiAgLy8gVFx1MUVBM2kgZGFuaCBzXHUwMEUxY2ggaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgdFx1MUVFQiBzZXJ2ZXJcbiAgY29uc3QgdGFpUXVldWUgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3Bob25nLXF1ZXVlP3Bob25nSWQ9JHtwaG9uZy5pZH0mYWN0aW9uPWxpc3RgKTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2spIHNldFF1ZXVlTGlzdChkLnF1ZXVlIHx8IFtdKTtcbiAgICB9IGNhdGNoIHt9XG4gIH07XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICB0YWlRdWV1ZSgpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaSh0YWlRdWV1ZSksIDQwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgfSwgW3Bob25nLmlkXSk7XG5cbiAgLy8gXHUwMTEwXHUxRUQ1aSB2aWRlbyBcdTAxMTFhbmcgcGhcdTAwRTF0XG4gIGNvbnN0IGRvaVZpZGVvID0gYXN5bmMgKHVybCwgdGl0bGUpID0+IHtcbiAgICBjb25zdCB1ID0gU3RyaW5nKHVybCB8fCB2aWRlb01vaSB8fCB5dFF1ZXJ5IHx8ICcnKS50cmltKCk7XG4gICAgaWYgKCF1IHx8IGRhbmdEb2lWaWRlbykgcmV0dXJuO1xuICAgIHNldERhbmdEb2lWaWRlbyh0cnVlKTtcbiAgICBzZXRMb2lWaWRlbygnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXdhdGNoJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGhvbmdJZDogcGhvbmcuaWQsIGFjdGlvbjogJ3NldF92aWRlbycsIHZpZGVvVXJsOiB1LCBhdXRvUGxheTogdHJ1ZSB9KVxuICAgICAgfSk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghZC5vaykge1xuICAgICAgICBzZXRMb2lWaWRlbyhkLmxvaSB8fCAnS2hcdTAwRjRuZyBcdTAxMTFcdTFFRDVpIFx1MDExMVx1MDFCMFx1MUVFM2MgdmlkZW8uJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRBY3RpdmVWaWRlb1VybCh1KTtcbiAgICAgICAgc2V0UHJvdmlkZXIoZ2V0SW5pdGlhbFByb3ZpZGVyKHUpKTtcbiAgICAgICAgc2V0VmlkZW9Nb2koJycpO1xuICAgICAgICBpZiAoZC5zdGF0ZSkge1xuICAgICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgICAgc2V0TG9jYWxUaW1lKDApO1xuICAgICAgICB9XG4gICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gMDtcbiAgICAgICAgc2V0RHVyYXRpb24oMCk7XG4gICAgICAgIGNvbnN0IG5ld1l0SWQgPSBpZFlvdXR1YmUodSk7XG4gICAgICAgIGlmIChuZXdZdElkICYmIHl0UGxheWVyUmVmLmN1cnJlbnQgJiYgeXRSZWFkeVJlZi5jdXJyZW50ICYmIHR5cGVvZiB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkKHsgdmlkZW9JZDogbmV3WXRJZCwgc3RhcnRTZWNvbmRzOiAwIH0pO1xuICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTtcbiAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgc2V0VGhvbmdCYW9WaWRlbyhgXHUwMTEwYW5nIHBoXHUwMEUxdDogJHt0aXRsZSB8fCB1fWApO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCA0MDAwKTtcbiAgICAgICAgdGFpUXVldWUoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaVZpZGVvKCdNXHUxRUE1dCBrXHUxRUJGdCBuXHUxRUQxaSBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0RGFuZ0RvaVZpZGVvKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gVFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmVcbiAgY29uc3QgdGltS2llbVlvdVR1YmUgPSBhc3luYyAoZSwgdHVLaG9hKSA9PiB7XG4gICAgZT8ucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBxID0gU3RyaW5nKHR1S2hvYSB8fCB5dFF1ZXJ5IHx8ICcnKS50cmltKCk7XG4gICAgaWYgKCFxIHx8IHNlYXJjaGluZ1l0KSByZXR1cm47XG4gICAgaWYgKHR1S2hvYSkgc2V0WXRRdWVyeSh0dUtob2EpO1xuXG4gICAgLy8gTlx1MUVCRnUgbmdcdTAxQjBcdTFFRERpIGRcdTAwRjluZyBkXHUwMEUxbiBsaVx1MDBFQW4ga1x1MUVCRnQgdmlkZW8gWW91VHViZVxuICAgIGNvbnN0IGlkWXQgPSBpZFlvdXR1YmUocSk7XG4gICAgaWYgKGlkWXQpIHtcbiAgICAgIHNldFl0UmVzdWx0cyhbe1xuICAgICAgICB2aWRlb0lkOiBpZFl0LFxuICAgICAgICB0aXRsZTogJ1ZpZGVvIFlvdVR1YmUgKHRcdTFFRUIgbGlcdTAwRUFuIGtcdTFFQkZ0IFx1MDExMVx1MDBFMyBkXHUwMEUxbiknLFxuICAgICAgICBjaGFubmVsVGl0bGU6ICdZb3VUdWJlJyxcbiAgICAgICAgdGh1bWJuYWlsOiBgaHR0cHM6Ly9pLnl0aW1nLmNvbS92aS8ke2lkWXR9L2hxZGVmYXVsdC5qcGdgLFxuICAgICAgICBwdWJsaXNoZWRBdDogJ1RyXHUxRUYxYyB0aVx1MUVCRnAnXG4gICAgICB9XSk7XG4gICAgICBzZXRTZWFyY2hMb2koJycpO1xuICAgICAgc2V0TWVkaWFUYWIoJ3NlYXJjaCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldFNlYXJjaGluZ1l0KHRydWUpO1xuICAgIHNldFNlYXJjaExvaSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3lvdXR1YmUtc2VhcmNoP3E9JHtlbmNvZGVVUklDb21wb25lbnQocSl9YCk7XG4gICAgICBjb25zdCBkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmIChkLm9rICYmIEFycmF5LmlzQXJyYXkoZC5pdGVtcykpIHtcbiAgICAgICAgaWYgKGQuaXRlbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgc2V0U2VhcmNoTG9pKCdLaFx1MDBGNG5nIHRcdTAwRUNtIHRoXHUxRUE1eSB2aWRlbyBuXHUwMEUwbyBwaFx1MDBGOSBoXHUxRUUzcCB2XHUxRURCaSB0XHUxRUVCIGtoXHUwMEYzYSBuXHUwMEUweS4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRZdFJlc3VsdHMoZC5pdGVtcyk7XG4gICAgICAgICAgc2V0TWVkaWFUYWIoJ3NlYXJjaCcpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRTZWFyY2hMb2koZC5sb2kgfHwgJ0toXHUwMEY0bmcgdGhcdTFFQzMgdFx1MDBFQ20ga2lcdTFFQkZtIHZpZGVvIGxcdTAwRkFjIG5cdTAwRTB5LicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgc2V0U2VhcmNoTG9pKCdMXHUxRUQ3aSBrXHUxRUJGdCBuXHUxRUQxaSBraGkgdFx1MDBFQ20ga2lcdTFFQkZtIFlvdVR1YmUuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFNlYXJjaGluZ1l0KGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdmlkZW9SZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IHl0UGxheWVyUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCB5dENvbnRhaW5lcklkID0gYHl0LXBsYXllci0ke3Bob25nLmlkfWA7XG4gIGNvbnN0IGlzU2Vla2luZ1JlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGhhc0ludGVyYWN0ZWRSZWYgPSB1c2VSZWYoZmFsc2UpO1xuICBjb25zdCBkdXJhdGlvblJlZiA9IHVzZVJlZigwKTtcbiAgY29uc3QgaGFzVHJpZ2dlcmVkU2tpcFJlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IGlzU2tpcHBpbmdSZWYgPSB1c2VSZWYoZmFsc2UpO1xuXG4gIC8vIFRoYW8gdFx1MDBFMWMgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgKGVucXVldWUsIGFkZF9uZXh0LCBwbGF5X25vdywgc2tpcCwgcmVtb3ZlKVxuICBjb25zdCBoYW5oRG9uZ1F1ZXVlID0gYXN5bmMgKGFjdGlvbiwgZXh0cmEgPSB7fSkgPT4ge1xuICAgIGlmIChhY3Rpb24gPT09ICdza2lwJykge1xuICAgICAgaWYgKGlzU2tpcHBpbmdSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChxdWV1ZUJ1c3kpIHJldHVybjtcbiAgICAgIHNldFF1ZXVlQnVzeSh0cnVlKTtcbiAgICB9XG4gICAgc2V0TG9pVmlkZW8oJycpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9waG9uZy1xdWV1ZScsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBob25nSWQ6IHBob25nLmlkLCBhY3Rpb24sIC4uLmV4dHJhIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFkLm9rKSB7XG4gICAgICAgIHNldExvaVZpZGVvKGQubG9pIHx8ICdUaGFvIHRcdTAwRTFjIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHRoXHUxRUE1dCBiXHUxRUExaS4nKTtcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ3NraXAnKSB7XG4gICAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChhY3Rpb24gPT09ICdlbnF1ZXVlJykge1xuICAgICAgICAgIHNldFRob25nQmFvVmlkZW8oYFx1MDExMFx1MDBFMyB0aFx1MDBFQW0gdlx1MDBFMG8gY3VcdTFFRDFpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpOiAke2V4dHJhLnRpdGxlIHx8ICdWaWRlbyd9YCk7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUaG9uZ0Jhb1ZpZGVvKCcnKSwgMzUwMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAnYWRkX25leHQnKSB7XG4gICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbyhgXHUwMTEwXHUwMEUzIHRoXHUwMEVBbSBwaFx1MDBFMXQga1x1MUVCRiB0aVx1MUVCRnA6ICR7ZXh0cmEudGl0bGUgfHwgJ1ZpZGVvJ31gKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCAzNTAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdzdWdnZXN0Jykge1xuICAgICAgICAgIHNldFRob25nQmFvVmlkZW8oYFx1MDExMFx1MDBFMyBnXHUxRUVEaSBcdTAxMTFcdTFFQzEgeHVcdTFFQTV0IGNobyBjaFx1MUVFNyBwaFx1MDBGMm5nIGR1eVx1MUVDN3Q6ICR7ZXh0cmEudGl0bGUgfHwgJ1ZpZGVvJ31gKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCA0MDAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdhcHByb3ZlX3N1Z2dlc3Rpb24nKSB7XG4gICAgICAgICAgaWYgKGV4dHJhLnBsYXlOb3cgJiYgZC52aWRlb1VybCkge1xuICAgICAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IDA7XG4gICAgICAgICAgICBzZXREdXJhdGlvbigwKTtcbiAgICAgICAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKGQudmlkZW9VcmwpO1xuICAgICAgICAgICAgc2V0UHJvdmlkZXIoZ2V0SW5pdGlhbFByb3ZpZGVyKGQudmlkZW9VcmwpKTtcbiAgICAgICAgICAgIGlmIChkLnN0YXRlKSB7XG4gICAgICAgICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgICAgICAgIHNldExvY2FsVGltZSgwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG5ld1l0SWQgPSBpZFlvdXR1YmUoZC52aWRlb1VybCk7XG4gICAgICAgICAgICBpZiAobmV3WXRJZCAmJiB5dFBsYXllclJlZi5jdXJyZW50ICYmIHl0UmVhZHlSZWYuY3VycmVudCAmJiB0eXBlb2YgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkKHsgdmlkZW9JZDogbmV3WXRJZCwgc3RhcnRTZWNvbmRzOiAwIH0pO1xuICAgICAgICAgICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7XG4gICAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldFRob25nQmFvVmlkZW8oJ1x1MDExMFx1MDBFMyBkdXlcdTFFQzd0IHZcdTAwRTAgcGhcdTAwRTF0IHZpZGVvIG5nYXkgbFx1MUVBRHAgdFx1MUVFOWMhJyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCAzNTAwKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbygnXHUwMTEwXHUwMEUzIGR1eVx1MUVDN3QgdmlkZW8gdlx1MDBFMG8gaFx1MDBFMG5nIFx1MDExMVx1MUVFM2khJyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRob25nQmFvVmlkZW8oJycpLCAzNTAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAncmVqZWN0X3N1Z2dlc3Rpb24nKSB7XG4gICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbygnXHUwMTEwXHUwMEUzIGhcdTFFRTd5L3RcdTFFRUIgY2hcdTFFRDFpIHZpZGVvIFx1MDExMVx1MUVDMSB4dVx1MUVBNXQuJyk7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUaG9uZ0Jhb1ZpZGVvKCcnKSwgMzUwMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAncGxheV9ub3cnIHx8IGFjdGlvbiA9PT0gJ3NraXAnKSB7XG4gICAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgaWYgKGQudmlkZW9VcmwpIHtcbiAgICAgICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSAwO1xuICAgICAgICAgICAgc2V0RHVyYXRpb24oMCk7XG4gICAgICAgICAgICBzZXRBY3RpdmVWaWRlb1VybChkLnZpZGVvVXJsKTtcbiAgICAgICAgICAgIHNldFByb3ZpZGVyKGdldEluaXRpYWxQcm92aWRlcihkLnZpZGVvVXJsKSk7XG4gICAgICAgICAgICBpZiAoZC5zdGF0ZSkge1xuICAgICAgICAgICAgICBzZXRXYXRjaFN0YXRlKGQuc3RhdGUpO1xuICAgICAgICAgICAgICBzZXRMb2NhbFRpbWUoMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBuZXdZdElkID0gaWRZb3V0dWJlKGQudmlkZW9VcmwpO1xuICAgICAgICAgICAgaWYgKG5ld1l0SWQgJiYgeXRQbGF5ZXJSZWYuY3VycmVudCAmJiB5dFJlYWR5UmVmLmN1cnJlbnQgJiYgdHlwZW9mIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQubG9hZFZpZGVvQnlJZCh7IHZpZGVvSWQ6IG5ld1l0SWQsIHN0YXJ0U2Vjb25kczogMCB9KTtcbiAgICAgICAgICAgICAgICB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpO1xuICAgICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZXRUaG9uZ0Jhb1ZpZGVvKCdcdTAxMTBhbmcgY2h1eVx1MUVDM24gdmlkZW8gdGlcdTFFQkZwIHRoZW8uLi4nKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VGhvbmdCYW9WaWRlbygnJyksIDMwMDApO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZC5lbXB0eSkge1xuICAgICAgICAgICAgLy8gSFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgaFx1MUVCRnQgdmlkZW86IFRVWVx1MUVDNlQgXHUwMTEwXHUxRUQwSSBLSFx1MDBENE5HIFhcdTAwRDNBIERVUkFUSU9OXG4gICAgICAgICAgICBoYXNUcmlnZ2VyZWRTa2lwUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBmaW5hbER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb24gfHwgbG9jYWxUaW1lO1xuICAgICAgICAgICAgaWYgKGZpbmFsRHVyID4gMCkgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IoZmluYWxEdXIpKTtcbiAgICAgICAgICAgIGlmIChkLnN0YXRlKSB7XG4gICAgICAgICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzZXRXYXRjaFN0YXRlKHByZXYgPT4gKHsgLi4ucHJldiwgcGxheWluZzogZmFsc2UsIHBvc2l0aW9uU2Vjb25kczogZmluYWxEdXIgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0VGhvbmdCYW9WaWRlbygnSFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgXHUwMTExXHUwMEUzIGhcdTFFQkZ0IHZpZGVvLicpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUaG9uZ0Jhb1ZpZGVvKCcnKSwgMzAwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRhaVF1ZXVlKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRMb2lWaWRlbygnTVx1MUVBNXQga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgICBpZiAoYWN0aW9uID09PSAnc2tpcCcpIHtcbiAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIGlzU2tpcHBpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBpZiAoYWN0aW9uICE9PSAnc2tpcCcpIHtcbiAgICAgICAgc2V0UXVldWVCdXN5KGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gWFx1MUVFRCBsXHUwMEZEIGtoaSB2aWRlbyBrXHUxRUJGdCB0aFx1MDBGQWMgKEVuZGVkIGhvXHUxRUI3YyBjaFx1MUVBMW0gZHVyYXRpb24gY3VcdTFFRDFpKVxuICBjb25zdCBoYW5kbGVWaWRlb0VuZGVkID0gKCkgPT4ge1xuICAgIC8vIDEuIE5cdTFFQkZ1IGNcdTAwRjMgdmlkZW8gdGlcdTFFQkZwIHRoZW8gdHJvbmcgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgLT4gVFx1MUVGMSBcdTAxMTFcdTFFRDluZyBjaHV5XHUxRUMzbiBiXHUwMEUwaVxuICAgIGNvbnN0IGhhc05leHRJblF1ZXVlID0gcXVldWVMaXN0UmVmLmN1cnJlbnQgJiYgcXVldWVMaXN0UmVmLmN1cnJlbnQubGVuZ3RoID4gMDtcbiAgICBpZiAoY2FuQ29udHJvbCAmJiBoYXNOZXh0SW5RdWV1ZSkge1xuICAgICAgaWYgKCFpc1NraXBwaW5nUmVmLmN1cnJlbnQgJiYgIWhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCkge1xuICAgICAgICBjb25zb2xlLmxvZygnVmlkZW8ga1x1MUVCRnQgdGhcdTAwRkFjIC0+IHRcdTFFRjEgXHUwMTExXHUxRUQ5bmcgY2h1eVx1MUVDM24gdGlcdTFFQkZwIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpJyk7XG4gICAgICAgIGhhbmhEb25nUXVldWUoJ3NraXAnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyAyLiBLaFx1MDBGNG5nIGNcdTAwRjJuIHZpZGVvIHRyb25nIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIC0+IERcdTFFRUFORyBQSFx1MDBDMVQgVlx1MDBDMCBLSFx1MDBEM0EgVFx1MUVBMEkgXHUwMTEwSVx1MUVDMk0gQ1VcdTFFRDBJIFZJREVPXG4gICAgY29uc29sZS5sb2coJ1ZpZGVvIGtcdTFFQkZ0IHRoXHUwMEZBYyAtPiBUXHUxRUExbSBkXHUxRUVCbmcgcGhcdTAwRTF0IHZpZGVvIHRcdTFFQTFpIFx1MDExMWlcdTFFQzNtIGN1XHUxRUQxaSBjaG8gdG9cdTAwRTBuIGJcdTFFRDkgcGhcdTAwRjJuZycpO1xuICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IHRydWU7XG4gICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgY29uc3QgZmluYWxEdXIgPSBkdXJhdGlvblJlZi5jdXJyZW50IHx8IGR1cmF0aW9uIHx8IGxvY2FsVGltZTtcbiAgICBpZiAoZmluYWxEdXIgPiAwKSB7XG4gICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihmaW5hbER1cikpO1xuICAgIH1cblxuICAgIC8vIERcdTFFRUJuZyBwbGF5ZXIgWW91VHViZS9IVE1MNSBjXHUxRUU1YyBiXHUxRUQ5XG4gICAgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wYXVzZVZpZGVvKSB7XG4gICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICB9XG4gICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGF1c2VWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIHRyeSB7IHZpZGVvUmVmLmN1cnJlbnQucGF1c2UoKTsgfSBjYXRjaCB7fVxuICAgIH1cblxuICAgIGlmIChjYW5Db250cm9sKSB7XG4gICAgICAvLyBDaFx1MUVFNyBwaFx1MDBGMm5nOiBMdVx1MDBGNG4gZ1x1MUVFRGkgbFx1MUVDN25oIHBhdXNlIHRcdTFFQTFpIGZpbmFsRHVyIGxcdTAwRUFuIG1cdTAwRTF5IGNoXHUxRUU3XG4gICAgICAvLyBCXHUxRUNGIHF1YSBcdTAxMTFpXHUxRUMxdSBraVx1MUVDN24gd2F0Y2hTdGF0ZS5wbGF5aW5nIFx1MDExMVx1MUVDMyBcdTAxMTFcdTFFQTNtIGJcdTFFQTNvIHZcdTFFQ0IgdHJcdTAwRUQgbFx1MDFCMHUgdHJcdTAwRUFuIHNlcnZlciBsdVx1MDBGNG4gbFx1MDBFMCBnaVx1MDBFMnkga1x1MUVCRnQgdGhcdTAwRkFjXG4gICAgICBjb25zdCB0YXJnZXRQb3MgPSBmaW5hbER1ciA+IDAgPyBOdW1iZXIoZmluYWxEdXIudG9GaXhlZCgyKSkgOiB1bmRlZmluZWQ7XG4gICAgICBndWlMZW5oUmVmLmN1cnJlbnQ/LigncGF1c2UnLCB0YXJnZXRQb3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBOZ1x1MDFCMFx1MUVERGkgdGhhbSBnaWE6IFx1MDExMFx1MDBFMW5oIGRcdTFFQTV1IFx1MDExMVx1MDBFMyBkXHUxRUVCbmcsIGtoXHUwMEY0bmcgdFx1MUVGMSBjaFx1MUVBMXkgdGlcdTFFQkZwIG5cdTFFQkZ1IGtoXHUwMEY0bmcgY1x1MDBGMyBsXHUxRUM3bmggYlx1MUVBRHQgbFx1MUVBMWlcbiAgICAgIHNldFZpZXdlcklzUGF1c2VkKHRydWUpO1xuICAgIH1cbiAgfTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBjID0ge307XG4gICAgdHJ5IHsgYyA9IHBob25nPy5jYXVIaW5oID8gSlNPTi5wYXJzZShwaG9uZy5jYXVIaW5oKSA6IHt9OyB9IGNhdGNoIHsgfVxuICAgIGNvbnN0IG5leHRVcmwgPSBjLnZpZGVvVXJsIHx8IHBob25nPy52aWRlb1VybCB8fCAnJztcbiAgICBpZiAobmV4dFVybCAmJiBuZXh0VXJsICE9PSBhY3RpdmVWaWRlb1VybCkge1xuICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSAwO1xuICAgICAgc2V0RHVyYXRpb24oMCk7XG4gICAgICBzZXRBY3RpdmVWaWRlb1VybChuZXh0VXJsKTtcbiAgICAgIHNldFByb3ZpZGVyKGdldEluaXRpYWxQcm92aWRlcihuZXh0VXJsKSk7XG4gICAgICBpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgIHNldElzTGl2ZVdpdGhIb3N0KHRydWUpO1xuICAgICAgc2V0Vmlld2VySXNQYXVzZWQoZmFsc2UpO1xuICAgIH1cbiAgfSwgW3Bob25nPy5jYXVIaW5oLCBwaG9uZz8udmlkZW9VcmxdKTtcblxuICBjb25zdCB2aWRlb1VybCA9IGFjdGl2ZVZpZGVvVXJsO1xuICBjb25zdCB5dElkID0gdmlkZW9VcmwgPyBpZFlvdXR1YmUodmlkZW9VcmwpIDogbnVsbDtcbiAgY29uc3QgZHJ2SWQgPSB2aWRlb1VybCA/IGlkR29vZ2xlRHJpdmUodmlkZW9VcmwpIDogbnVsbDtcbiAgY29uc3QgdHJ1Y1RpZXBVcmwgPSB2aWRlb1VybCAmJiAheXRJZCAmJiAhZHJ2SWQgJiYgbGFWaWRlb1RydWNUaWVwRmUodmlkZW9VcmwpID8gdXJsTWVkaWFGZSh2aWRlb1VybCkgOiAnJztcblxuICBjb25zdCBbX3l0UGxheWVyUmVhZHksIHNldFl0UGxheWVyUmVhZHldID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCB5dFJlYWR5UmVmID0gdXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgY3VycmVudFl0SWRSZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IGhhc1NlZWtlZEluaXRSZWYgPSB1c2VSZWYoZmFsc2UpO1xuICBjb25zdCBsYXN0SG9zdFN5bmNUaW1lUmVmID0gdXNlUmVmKDApO1xuICBjb25zdCBsYXN0QXBwbGllZFJldmlzaW9uUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBsYXN0SG9zdFRyYWNrVGltZVJlZiA9IHVzZVJlZih7IHRpbWU6IDAsIHN0YW1wOiBEYXRlLm5vdygpIH0pO1xuICBjb25zdCBsYXN0R29MaXZlQ2xpY2tUaW1lUmVmID0gdXNlUmVmKDApO1xuXG4gIGNvbnN0IHdhdGNoU3RhdGVSZWYgPSB1c2VSZWYod2F0Y2hTdGF0ZSk7XG4gIHdhdGNoU3RhdGVSZWYuY3VycmVudCA9IHdhdGNoU3RhdGU7XG4gIGNvbnN0IGRhbmdHdWlMZW5oUmVmID0gdXNlUmVmKGRhbmdHdWlMZW5oKTtcbiAgZGFuZ0d1aUxlbmhSZWYuY3VycmVudCA9IGRhbmdHdWlMZW5oO1xuICBjb25zdCBndWlMZW5oUmVmID0gdXNlUmVmKG51bGwpO1xuXG4gIC8vIFRcdTAwRURuaCB2XHUxRUNCIHRyXHUwMEVEIHRoXHUxRUREaSBnaWFuIHRyXHUxRUYxYyB0aVx1MUVCRnAgaGlcdTFFQzduIHRcdTFFQTFpIGNcdTFFRTdhIGNoXHUxRUU3IHBoXHUwMEYybmcgKGdpXHUxRURCaSBoXHUxRUExbiBraFx1MDBGNG5nIHZcdTAxQjBcdTFFRTN0IHF1XHUwMEUxIFx1MDExMVx1MUVEOSBkXHUwMEUwaSB2aWRlbylcbiAgY29uc3QgZ2V0SG9zdEN1cnJlbnRQb3MgPSAoKSA9PiB7XG4gICAgY29uc3Qgc3QgPSB3YXRjaFN0YXRlUmVmLmN1cnJlbnQgfHwgd2F0Y2hTdGF0ZTtcbiAgICBjb25zdCBub3dNcyA9IERhdGUubm93KCk7XG4gICAgY29uc3QgdXBkYXRlVGltZU1zID0gc3Q/LnVwZGF0ZWRBdFxuICAgICAgPyBuZXcgRGF0ZShTdHJpbmcoc3QudXBkYXRlZEF0KS5yZXBsYWNlKCcgJywgJ1QnKSArIChTdHJpbmcoc3QudXBkYXRlZEF0KS5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS5nZXRUaW1lKClcbiAgICAgIDogbm93TXM7XG4gICAgY29uc3QgZWxhcHNlZFNlYyA9IE1hdGgubWF4KDAsIChub3dNcyAtIHVwZGF0ZVRpbWVNcykgLyAxMDAwKTtcbiAgICBsZXQgdGFyZ2V0UG9zID0gTnVtYmVyKHN0Py5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgaWYgKHN0Py5wbGF5aW5nKSB7XG4gICAgICB0YXJnZXRQb3MgPSBOdW1iZXIoc3QuYmFzZVBvc2l0aW9uU2Vjb25kcyAhPSBudWxsID8gc3QuYmFzZVBvc2l0aW9uU2Vjb25kcyA6IHN0LnBvc2l0aW9uU2Vjb25kcykgKyAoZWxhcHNlZFNlYyAqIChzdC5wbGF5YmFja1JhdGUgfHwgMS4wKSk7XG4gICAgfVxuICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgaWYgKG1heER1ciA+IDApIHtcbiAgICAgIC8vIE5cdTFFQkZ1IG1cdTAwRTF5IGNoXHUxRUU3IFx1MDExMWFuZyBwYXVzZSB2XHUwMEUwIHZcdTFFQ0IgdHJcdTAwRUQgXHUxRURGIHNcdTAwRTF0IGN1XHUxRUQxaSB2aWRlbyAoY1x1MDBGMm4gPCAyLjVzKSAtPiBjb2kgbmhcdTAxQjAgdmlkZW8gXHUwMTExXHUwMEUzIGhcdTFFQkZ0XG4gICAgICBpZiAoIXN0Py5wbGF5aW5nICYmIHRhcmdldFBvcyA+PSBtYXhEdXIgLSAyLjUpIHtcbiAgICAgICAgdGFyZ2V0UG9zID0gbWF4RHVyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGFyZ2V0UG9zID0gTWF0aC5taW4odGFyZ2V0UG9zLCBtYXhEdXIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gTWF0aC5tYXgoMCwgTnVtYmVyKHRhcmdldFBvcy50b0ZpeGVkKDIpKSk7XG4gIH07XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFRcdTFFQTZORyAxOiBMXHUxRUFGbmcgbmdoZSB0clx1MUVGMWMgdGlcdTFFQkZwIHRpbiBuaFx1MUVBRm4gcG9zdE1lc3NhZ2UgdFx1MUVFQiBZb3VUdWJlIElGcmFtZSBcdTI1MDBcdTI1MDBcbiAgLy8gWW91VHViZSBJRnJhbWUgbHVcdTAwRjRuIHBoXHUwMEUxdCBjXHUwMEUxYyBzXHUxRUYxIGtpXHUxRUM3biBvblN0YXRlQ2hhbmdlICYgaW5mb0RlbGl2ZXJ5IHJhIHBhcmVudCB3aW5kb3dcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBvbk1zZyA9IChlKSA9PiB7XG4gICAgICBsZXQgZGF0YSA9IGUuZGF0YTtcbiAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgaWYgKGRhdGEuaW5jbHVkZXMoJ2V2ZW50PScpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKGRhdGEpO1xuICAgICAgICAgICAgICBkYXRhID0ge1xuICAgICAgICAgICAgICAgIGV2ZW50OiBwYXJhbXMuZ2V0KCdldmVudCcpLFxuICAgICAgICAgICAgICAgIGluZm86IHBhcmFtcy5nZXQoJ2luZm8nKSA/IEpTT04ucGFyc2UocGFyYW1zLmdldCgnaW5mbycpKSA6IHBhcmFtcy5nZXQoJ2luZm8nKVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBjYXRjaCB7IHJldHVybjsgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWRhdGEgfHwgdHlwZW9mIGRhdGEgIT09ICdvYmplY3QnKSByZXR1cm47XG5cbiAgICAgIC8vIENcdTFFQURwIG5oXHUxRUFEdCBcdTAxMTFcdTFFRDkgZFx1MDBFMGkgdmlkZW8gdGhcdTFFRjFjIHRcdTFFQkYgKGR1cmF0aW9uKVxuICAgICAgY29uc3QgZCA9IE51bWJlcihkYXRhLmluZm8/LmR1cmF0aW9uIHx8IGRhdGEuZHVyYXRpb24gfHwgMCk7XG4gICAgICBpZiAoZCA+IDApIHtcbiAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IGQ7XG4gICAgICAgIHNldER1cmF0aW9uKHByZXYgPT4gKHByZXYgPiAwID8gcHJldiA6IGQpKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ1x1MUVBRHAgbmhcdTFFQUR0IHRoXHUxRUREaSBnaWFuIHRoXHUxRUYxYyB0XHUxRUJGIChrXHUxRUI5cCBraFx1MDBGNG5nIHZcdTAxQjBcdTFFRTN0IHF1XHUwMEUxIFx1MDExMVx1MUVEOSBkXHUwMEUwaSB2aWRlbylcbiAgICAgIGNvbnN0IGN1ciA9IE51bWJlcihkYXRhLmluZm8/LmN1cnJlbnRUaW1lKTtcbiAgICAgIGlmICghaXNOYU4oY3VyKSAmJiBjdXIgPj0gMCAmJiAhaXNTZWVraW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgICAgY29uc3QgY2xhbXBlZEN1ciA9IG1heER1ciA+IDAgPyBNYXRoLm1pbihjdXIsIG1heER1cikgOiBjdXI7XG4gICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKGNsYW1wZWRDdXIpKTtcbiAgICAgIH1cblxuICAgICAgLy8gXHUyNTAwXHUyNTAwIFZcdTAwRDlORyAyOiBcdTAxMTBcdTFFRDJORyBCXHUxRUQ4IFRIQU8gVFx1MDBDMUMgQ1x1MUVFNkEgQ0hcdTFFRTYgUEhcdTAwRDJORyBIT1x1MUVCNkMgQ0hcdTFFQkUgXHUwMTEwXHUxRUQ4IFhFTSBDXHUxRUU2QSBOR1x1MDFBRlx1MUVEQ0kgVEhBTSBHSUEgXHUyNTAwXHUyNTAwXG4gICAgICBjb25zdCBwU3RhdGUgPSBkYXRhLmV2ZW50ID09PSAnb25TdGF0ZUNoYW5nZSdcbiAgICAgICAgPyAodHlwZW9mIGRhdGEuaW5mbyA9PT0gJ251bWJlcicgPyBkYXRhLmluZm8gOiBkYXRhLmluZm8/LnBsYXllclN0YXRlKVxuICAgICAgICA6IChkYXRhLmV2ZW50ID09PSAnaW5mb0RlbGl2ZXJ5JyA/IGRhdGEuaW5mbz8ucGxheWVyU3RhdGUgOiB1bmRlZmluZWQpO1xuXG4gICAgICBpZiAoY2FuQ29udHJvbCAmJiAhZGFuZ0d1aUxlbmhSZWYuY3VycmVudCAmJiAhaXNTZWVraW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgLy8gMS4gQlx1MUVBRnQgUGxheSAvIFBhdXNlIHRyXHUxRUYxYyB0aVx1MUVCRnAgdFx1MUVFQiBtXHUwMEUwbiBoXHUwMEVDbmggdmlkZW8gWW91VHViZVxuICAgICAgICBjb25zdCBjdXJUaW1lID0gIWlzTmFOKGN1cikgJiYgY3VyID49IDAgPyBjdXIgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgaWYgKHBTdGF0ZSA9PT0gMSAmJiAhd2F0Y2hTdGF0ZVJlZi5jdXJyZW50LnBsYXlpbmcpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnVlx1MDBGOW5nIDI6IENoXHUxRUU3IHBoXHUwMEYybmcgYlx1MUVBNW0gUGxheSB0clx1MDBFQW4gWW91VHViZSAtPiBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGNcdTFFQTMgcGhcdTAwRjJuZycpO1xuICAgICAgICAgIGd1aUxlbmhSZWYuY3VycmVudD8uKCdwbGF5JywgY3VyVGltZSk7XG4gICAgICAgIH0gZWxzZSBpZiAocFN0YXRlID09PSAyICYmIHdhdGNoU3RhdGVSZWYuY3VycmVudC5wbGF5aW5nKSB7XG4gICAgICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgICAgICBpZiAobWF4RHVyID4gNSAmJiBjdXJUaW1lICE9PSB1bmRlZmluZWQgJiYgY3VyVGltZSA+PSBtYXhEdXIgLSAyLjUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdWaWRlbyBjaFx1MUVBMW0gbmdcdTAxQjBcdTFFRTFuZyBjdVx1MUVEMWkgLT4ga1x1MDBFRGNoIGhvXHUxRUExdCBoYW5kbGVWaWRlb0VuZGVkIHRoYXkgdlx1MDBFQyBwYXVzZSBsXHUxRUVEbmcgbFx1MDFBMScpO1xuICAgICAgICAgICAgaGFuZGxlVmlkZW9FbmRlZCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnVlx1MDBGOW5nIDI6IENoXHUxRUU3IHBoXHUwMEYybmcgYlx1MUVBNW0gUGF1c2UgdHJcdTAwRUFuIFlvdVR1YmUgLT4gXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBjXHUxRUEzIHBoXHUwMEYybmcnKTtcbiAgICAgICAgICAgIGd1aUxlbmhSZWYuY3VycmVudD8uKCdwYXVzZScsIGN1clRpbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDIuIEJcdTFFQUZ0IHRoYW8gdFx1MDBFMWMgdHVhIChTZWVrKSB0clx1MDBFQW4gdGhhbmggdGlcdTFFQkZuIHRyXHUwMEVDbmggXHUwMTExXHUxRUNGIFlvdVR1YmUgKDA6MjkgLyAyOjQxOjMyKVxuICAgICAgICBpZiAoIWlzTmFOKGN1cikgJiYgY3VyID49IDApIHtcbiAgICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICAgIGNvbnN0IHByZXYgPSBsYXN0SG9zdFRyYWNrVGltZVJlZi5jdXJyZW50O1xuICAgICAgICAgIGNvbnN0IGR0ID0gTWF0aC5tYXgoMCwgKG5vdyAtIHByZXYuc3RhbXApIC8gMTAwMCk7XG4gICAgICAgICAgY29uc3QgZXhwZWN0ZWQgPSB3YXRjaFN0YXRlUmVmLmN1cnJlbnQucGxheWluZyA/IChwcmV2LnRpbWUgKyBkdCkgOiBwcmV2LnRpbWU7XG4gICAgICAgICAgY29uc3QgZGVsdGEgPSBNYXRoLmFicyhjdXIgLSBleHBlY3RlZCk7XG5cbiAgICAgICAgICAvLyBOXHUxRUJGdSB0aFx1MUVERGkgZ2lhbiBuaFx1MUVBM3kgbFx1MUVDN2NoID4gMS44IGdpXHUwMEUyeSB0cm9uZyBraG9cdTFFQTNuZyB0aFx1MUVERGkgZ2lhbiBuZ1x1MUVBRm4gKGR0IDwgNHMpXG4gICAgICAgICAgLy8gY2hcdTFFRTluZyB0XHUxRUNGIGNoXHUxRUU3IHBoXHUwMEYybmcgdlx1MUVFQmEgY2xpY2sgaG9cdTFFQjdjIGtcdTAwRTlvIHRoYW5oIFx1MDExMVx1MUVDRiB0clx1MDBFQW4gdmlkZW8gWW91VHViZVxuICAgICAgICAgIGlmIChkdCA+IDAuMjUgJiYgZHQgPCA0LjAgJiYgZGVsdGEgPiAxLjgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBWXHUwMEY5bmcgMjogQ2hcdTFFRTcgcGhcdTAwRjJuZyB0dWEgdHJcdTAwRUFuIHRoYW5oIFx1MDExMVx1MUVDRiBZb3VUdWJlICgke2N1ci50b0ZpeGVkKDEpfXMsIGxcdTFFQzdjaCAke2RlbHRhLnRvRml4ZWQoMSl9cykgLT4gXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBjXHUxRUEzIHBoXHUwMEYybmdgKTtcbiAgICAgICAgICAgIGxhc3RIb3N0VHJhY2tUaW1lUmVmLmN1cnJlbnQgPSB7IHRpbWU6IGN1ciwgc3RhbXA6IG5vdyB9O1xuICAgICAgICAgICAgZ3VpTGVuaFJlZi5jdXJyZW50Py4oJ3NlZWsnLCBjdXIpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZHQgPj0gMC41KSB7XG4gICAgICAgICAgICBsYXN0SG9zdFRyYWNrVGltZVJlZi5jdXJyZW50ID0geyB0aW1lOiBjdXIsIHN0YW1wOiBub3cgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIWNhbkNvbnRyb2wgJiYgIWlzUHJvZ3JhbW1hdGljQWN0aW9uUmVmLmN1cnJlbnQgJiYgKERhdGUubm93KCkgLSBsYXN0R29MaXZlQ2xpY2tUaW1lUmVmLmN1cnJlbnQgPiAzNTAwKSkge1xuICAgICAgICAvLyBOR1x1MDFBRlx1MUVEQ0kgVEhBTSBHSUE6IFRcdTFFRjEgZG8gdFx1MUVBMW0gZFx1MUVFQm5nIGhvXHUxRUI3YyB0aVx1MUVCRnAgdFx1MUVFNWMgeGVtIChjaFx1MUVDOSBuaFx1MUVBRG4gc1x1MUVGMSBraVx1MUVDN24gcGF1c2Ugc2F1IGtoaSBoXHUxRUJGdCB0aFx1MUVERGkgZ2lhbiBncmFjZSBwZXJpb2QgR28gTGl2ZSlcbiAgICAgICAgaWYgKHBTdGF0ZSA9PT0gMiAmJiB3YXRjaFN0YXRlUmVmLmN1cnJlbnQucGxheWluZykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdvbk1zZzogTmdcdTAxQjBcdTFFRERpIHhlbSB0XHUxRUYxIGJcdTFFQTVtIFRcdTFFQTFtIGRcdTFFRUJuZyB0clx1MDBFQW4gWW91VHViZSAtPiBjaHV5XHUxRUMzbiBzYW5nIHhlbSByaVx1MDBFQW5nJyk7XG4gICAgICAgICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgIHNldElzTGl2ZVdpdGhIb3N0KGZhbHNlKTtcbiAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZCh0cnVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChwU3RhdGUgPT09IDEpIHtcbiAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZChmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTmhcdTFFQURuIGRpXHUxRUM3biB0clx1MUVBMW5nIHRoXHUwMEUxaSBrXHUxRUJGdCB0aFx1MDBGQWMgdmlkZW86IDAgPSBFTkRFRFxuICAgICAgY29uc3QgaXNFbmRlZCA9IChkYXRhLmV2ZW50ID09PSAnb25TdGF0ZUNoYW5nZScgJiYgKGRhdGEuaW5mbyA9PT0gMCB8fCBkYXRhLmluZm8/LnBsYXllclN0YXRlID09PSAwKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAoZGF0YS5ldmVudCA9PT0gJ2luZm9EZWxpdmVyeScgJiYgZGF0YS5pbmZvPy5wbGF5ZXJTdGF0ZSA9PT0gMCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAoZGF0YS5pbmZvICYmIGRhdGEuaW5mby5wbGF5ZXJTdGF0ZSA9PT0gMCk7XG5cbiAgICAgIGlmIChpc0VuZGVkKSB7XG4gICAgICAgIGhhbmRsZVZpZGVvRW5kZWQoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBvbk1zZyk7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgb25Nc2cpO1xuICB9LCBbY2FuQ29udHJvbCwgcGhvbmcuaWRdKTtcblxuICAvLyBHXHUxRUVEaSBsaXN0ZW5pbmcgaGFuZHNoYWtlIFx1MDExMVx1MUVDQm5oIGtcdTFFRjMgdlx1MDBFMG8gaWZyYW1lIFlvdVR1YmUgXHUwMTExXHUxRUMzIGtcdTAwRURjaCBob1x1MUVBMXQgZXZlbnQgc3RyZWFtXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF5dElkKSByZXR1cm47XG4gICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgaWYgKCFpZnIpIHJldHVybjtcbiAgICBjb25zdCB0ID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWZyLmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdsaXN0ZW5pbmcnIH0pLCAnKicpO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH0sIDE1MDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHQpO1xuICB9LCBbeXRJZCwgcGhvbmcuaWRdKTtcblxuICAvLyBcdTI1MDBcdTI1MDAgVFx1MUVBNk5HIDI6IEtoXHUxRURGaSB0XHUxRUExbyB2XHUwMEUwIGtcdTFFQkZ0IG5cdTFFRDFpIFlvdVR1YmUgSUZyYW1lIFBsYXllciBBUEkgdHJcdTFFRjFjIHRpXHUxRUJGcCB2XHUwMEUwbyBpZnJhbWUgXHUyNTAwXHUyNTAwXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF5dElkKSByZXR1cm47XG4gICAgbGV0IGRlc3Ryb3llZCA9IGZhbHNlO1xuICAgIGxldCByZXRyeVRpbWVyID0gbnVsbDtcbiAgICBsZXQgYXR0ZW1wdHMgPSAwO1xuXG4gICAgLy8gTlx1MUVCRnUgcGxheWVyIFx1MDExMVx1MDBFMyB0XHUxRUQzbiB0XHUxRUExaSB2XHUwMEUwIHNcdTFFQjVuIHNcdTAwRTBuZzogY2h1eVx1MUVDM24gYlx1MDBFMGkgdFx1MUVFOWMgdGhcdTAwRUMgcXVhIGxvYWRWaWRlb0J5SWQgKGtoXHUwMEY0bmcgcmVsb2FkIERPTS9pZnJhbWUpXG4gICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQgJiYgeXRSZWFkeVJlZi5jdXJyZW50ICYmIHR5cGVvZiB5dFBsYXllclJlZi5jdXJyZW50LmxvYWRWaWRlb0J5SWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChjdXJyZW50WXRJZFJlZi5jdXJyZW50ICE9PSB5dElkKSB7XG4gICAgICAgICAgY3VycmVudFl0SWRSZWYuY3VycmVudCA9IHl0SWQ7XG4gICAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IDA7XG4gICAgICAgICAgc2V0RHVyYXRpb24oMCk7XG4gICAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgaXNTa2lwcGluZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgY29uc3Qgc3RhcnRTZWMgPSBOdW1iZXIod2F0Y2hTdGF0ZS5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5sb2FkVmlkZW9CeUlkKHtcbiAgICAgICAgICAgIHZpZGVvSWQ6IHl0SWQsXG4gICAgICAgICAgICBzdGFydFNlY29uZHM6IHN0YXJ0U2VjXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICAgICAgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0xcdTFFRDdpIGxvYWRWaWRlb0J5SWQ6JywgZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY3VycmVudFl0SWRSZWYuY3VycmVudCA9IHl0SWQ7XG4gICAgaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ID0gZmFsc2U7XG5cbiAgICBjb25zdCBraG9pVGFvUGxheWVyID0gKCkgPT4ge1xuICAgICAgaWYgKGRlc3Ryb3llZCkgcmV0dXJuO1xuICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgIGlmICghZWwpIHtcbiAgICAgICAgaWYgKGF0dGVtcHRzKysgPCAzMCkge1xuICAgICAgICAgIHJldHJ5VGltZXIgPSBzZXRUaW1lb3V0KGtob2lUYW9QbGF5ZXIsIDEwMCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXdpbmRvdy5ZVCB8fCAhd2luZG93LllULlBsYXllcikge1xuICAgICAgICBpZiAoYXR0ZW1wdHMrKyA8IDMwKSB7XG4gICAgICAgICAgcmV0cnlUaW1lciA9IHNldFRpbWVvdXQoa2hvaVRhb1BsYXllciwgMTUwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHl0UGxheWVyUmVmLmN1cnJlbnQgPSBuZXcgd2luZG93LllULlBsYXllcihlbCwge1xuICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgb25SZWFkeTogKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChkZXN0cm95ZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgeXRSZWFkeVJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgc2V0WXRQbGF5ZXJSZWFkeSh0cnVlKTtcblxuICAgICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LmdldER1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IGV2ZW50LnRhcmdldC5nZXREdXJhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChkID4gMCkge1xuICAgICAgICAgICAgICAgICAgZHVyYXRpb25SZWYuY3VycmVudCA9IGQ7XG4gICAgICAgICAgICAgICAgICBzZXREdXJhdGlvbihkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBUXHUwMEVEbmggdlx1MUVDQiB0clx1MDBFRCB0aFx1MUVERGkgZ2lhbiBoaVx1MUVDN24gdFx1MUVBMWkgY1x1MUVFN2EgcGhcdTAwRjJuZyBcdTAxMTFcdTFFQzMgc2VlayBuZ2F5IGxcdTAwRkFjIGtoXHUxRURGaSB0XHUxRUExb1xuICAgICAgICAgICAgICBjb25zdCBub3dNcyA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgIGNvbnN0IHVwZGF0ZVRpbWVNcyA9IHdhdGNoU3RhdGUudXBkYXRlZEF0ID8gbmV3IERhdGUoU3RyaW5nKHdhdGNoU3RhdGUudXBkYXRlZEF0KS5yZXBsYWNlKCcgJywgJ1QnKSArIChTdHJpbmcod2F0Y2hTdGF0ZS51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKSA6IG5vd01zO1xuICAgICAgICAgICAgICBjb25zdCBlbGFwc2VkU2VjID0gTWF0aC5tYXgoMCwgKG5vd01zIC0gdXBkYXRlVGltZU1zKSAvIDEwMDApO1xuICAgICAgICAgICAgICBsZXQgdFBvcyA9IE51bWJlcih3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICAgICAgICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICAgICAgICAgIHRQb3MgPSBOdW1iZXIod2F0Y2hTdGF0ZS5iYXNlUG9zaXRpb25TZWNvbmRzICE9IG51bGwgPyB3YXRjaFN0YXRlLmJhc2VQb3NpdGlvblNlY29uZHMgOiB3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcykgKyAoZWxhcHNlZFNlYyAqICh3YXRjaFN0YXRlLnBsYXliYWNrUmF0ZSB8fCAxLjApKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh0UG9zID4gMCAmJiBldmVudC50YXJnZXQuc2Vla1RvKSB7XG4gICAgICAgICAgICAgICAgaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0cnkgeyBldmVudC50YXJnZXQuc2Vla1RvKHRQb3MsIHRydWUpOyB9IGNhdGNoIHt9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nICYmIChjYW5Db250cm9sIHx8IGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCB8fCBoYXNJbnRlcmFjdGVkKSAmJiBldmVudC50YXJnZXQucGxheVZpZGVvKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHsgZXZlbnQudGFyZ2V0LnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblN0YXRlQ2hhbmdlOiAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldCAmJiBldmVudC50YXJnZXQuZ2V0RHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gZXZlbnQudGFyZ2V0LmdldER1cmF0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKGQgPiAwICYmIGR1cmF0aW9uUmVmLmN1cnJlbnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgIGR1cmF0aW9uUmVmLmN1cnJlbnQgPSBkO1xuICAgICAgICAgICAgICAgICAgc2V0RHVyYXRpb24oZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gVmlkZW8ga1x1MUVCRnQgdGhcdTAwRkFjOiBrXHUwMEVEY2ggaG9cdTFFQTF0IGNodXlcdTFFQzNuIGJcdTAwRTBpIGhvXHUxRUI3YyBkXHUxRUVCbmcgY1x1MUVBMyBwaFx1MDBGMm5nXG4gICAgICAgICAgICAgIGlmIChldmVudC5kYXRhID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlVmlkZW9FbmRlZCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmICFkYW5nR3VpTGVuaFJlZi5jdXJyZW50ICYmICFpc1NlZWtpbmdSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1clBvcyA9IHR5cGVvZiBldmVudC50YXJnZXQ/LmdldEN1cnJlbnRUaW1lID09PSAnZnVuY3Rpb24nID8gZXZlbnQudGFyZ2V0LmdldEN1cnJlbnRUaW1lKCkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGEgPT09IDEgJiYgIXdhdGNoU3RhdGVSZWYuY3VycmVudC5wbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnWVQgUGxheWVyIG9uU3RhdGVDaGFuZ2UgPT09IDEgLT4gXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBQbGF5IGNcdTFFQTMgcGhcdTAwRjJuZycpO1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaFJlZi5jdXJyZW50Py4oJ3BsYXknLCBjdXJQb3MpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuZGF0YSA9PT0gMiAmJiB3YXRjaFN0YXRlUmVmLmN1cnJlbnQucGxheWluZykge1xuICAgICAgICAgICAgICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgICAgICAgICAgICAgIGlmIChtYXhEdXIgPiA1ICYmIGN1clBvcyAhPT0gdW5kZWZpbmVkICYmIGN1clBvcyA+PSBtYXhEdXIgLSAyLjUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1lUIG9uU3RhdGVDaGFuZ2UgPT09IDIgY2hcdTFFQTFtIG5nXHUwMUIwXHUxRUUxbmcgY3VcdTFFRDFpIC0+IGtcdTAwRURjaCBob1x1MUVBMXQgaGFuZGxlVmlkZW9FbmRlZCcpO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVWaWRlb0VuZGVkKCk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnWVQgUGxheWVyIG9uU3RhdGVDaGFuZ2UgPT09IDIgLT4gXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBQYXVzZSBjXHUxRUEzIHBoXHUwMEYybmcnKTtcbiAgICAgICAgICAgICAgICAgICAgZ3VpTGVuaFJlZi5jdXJyZW50Py4oJ3BhdXNlJywgY3VyUG9zKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWNhbkNvbnRyb2wgJiYgIWlzUHJvZ3JhbW1hdGljQWN0aW9uUmVmLmN1cnJlbnQgJiYgKERhdGUubm93KCkgLSBsYXN0R29MaXZlQ2xpY2tUaW1lUmVmLmN1cnJlbnQgPiAzNTAwKSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5kYXRhID09PSAyICYmIHdhdGNoU3RhdGVSZWYuY3VycmVudC5wbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnWVQgUGxheWVyIG9uU3RhdGVDaGFuZ2UgPT09IDI6IE5nXHUwMUIwXHUxRUREaSB4ZW0gdFx1MUVBMW0gZFx1MUVFQm5nIFlvdVR1YmUgLT4gY2h1eVx1MUVDM24gc2FuZyB4ZW0gcmlcdTAwRUFuZycpO1xuICAgICAgICAgICAgICAgICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgc2V0SXNMaXZlV2l0aEhvc3QoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgc2V0Vmlld2VySXNQYXVzZWQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5kYXRhID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZChmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0xcdTFFRDdpIGtcdTFFQkZ0IG5cdTFFRDFpIFlvdVR1YmUgUGxheWVyIEFQSTonLCBlcnIpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBuYXBZb3VUdWJlSWZyYW1lQXBpKCgpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoa2hvaVRhb1BsYXllciwgMTAwKTtcbiAgICB9KTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBkZXN0cm95ZWQgPSB0cnVlO1xuICAgICAgaWYgKHJldHJ5VGltZXIpIGNsZWFyVGltZW91dChyZXRyeVRpbWVyKTtcbiAgICB9O1xuICB9LCBbeXRJZCwgcGhvbmcuaWQsIGNhbkNvbnRyb2xdKTtcblxuICAvLyBcdTAwQzFwIGRcdTFFRTVuZyB0clx1MUVBMW5nIHRoXHUwMEUxaSBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IHRcdTFFRUIgc2VydmVyIChjaFx1MUVEMW5nIGdpXHUxRUFEdCBjaFx1MUVBRHAgY2hcdTFFRERuIGNobyBjXHUxRUEzIEhvc3QgbFx1MUVBQm4gTmdcdTAxQjBcdTFFRERpIHhlbSlcbiAgY29uc3QgYXBEdW5nRG9uZ0JvID0gKHN0LCBjdHJsLCBwcm92KSA9PiB7XG4gICAgaWYgKCFzdCkgcmV0dXJuO1xuICAgIGNvbnN0IG5vd01zID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCB1cGRhdGVUaW1lTXMgPSBzdC51cGRhdGVkQXQgPyBuZXcgRGF0ZShTdHJpbmcoc3QudXBkYXRlZEF0KS5yZXBsYWNlKCcgJywgJ1QnKSArIChTdHJpbmcoc3QudXBkYXRlZEF0KS5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS5nZXRUaW1lKCkgOiBub3dNcztcbiAgICBjb25zdCBlbGFwc2VkU2VjID0gTWF0aC5tYXgoMCwgKG5vd01zIC0gdXBkYXRlVGltZU1zKSAvIDEwMDApO1xuXG4gICAgbGV0IHRhcmdldFBvcyA9IE51bWJlcihzdC5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgaWYgKHN0LnBsYXlpbmcpIHtcbiAgICAgIHRhcmdldFBvcyA9IE51bWJlcihzdC5iYXNlUG9zaXRpb25TZWNvbmRzICE9IG51bGwgPyBzdC5iYXNlUG9zaXRpb25TZWNvbmRzIDogc3QucG9zaXRpb25TZWNvbmRzKSArIChlbGFwc2VkU2VjICogKHN0LnBsYXliYWNrUmF0ZSB8fCAxLjApKTtcbiAgICB9XG4gICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICBpZiAobWF4RHVyID4gMCkge1xuICAgICAgaWYgKCFzdC5wbGF5aW5nICYmIHRhcmdldFBvcyA+PSBtYXhEdXIgLSAyLjUpIHtcbiAgICAgICAgdGFyZ2V0UG9zID0gbWF4RHVyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGFyZ2V0UG9zID0gTWF0aC5taW4odGFyZ2V0UG9zLCBtYXhEdXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBOR1VZXHUwMENBTiBUXHUxRUFFQyBWXHUwMEMwTkc6IENIXHUxRUU2IFBIXHUwMEQyTkcgTFx1MDBDMCBOR1VcdTFFRDJOIFBIXHUwMEMxVCAoU09VUkNFIE9GIFRSVVRIKSBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICAvLyBWaWRlbyBjXHUxRUU3YSBDaFx1MUVFNyBwaFx1MDBGMm5nIFx1MDExMWFuZyBwaFx1MDBFMXQgdFx1MUVGMSBuaGlcdTAwRUFuIG1cdTAxQjBcdTFFRTN0IG1cdTAwRTAgNjBmcHMgdHJcdTAwRUFuIFlvdVR1YmUuXG4gICAgLy8gVHV5XHUxRUM3dCBcdTAxMTFcdTFFRDFpIEtIXHUwMEQ0TkcgZ1x1MUVDRGkgc2Vla1RvIGhheSBcdTAwRTlwIHBsYXlWaWRlbyBsXHUwMEUwbSBnaVx1MUVBRHQgbFx1MDBGOWkva2hcdTFFRjFuZyBoXHUwMEVDbmggdmlkZW8gY1x1MUVFN2EgQ2hcdTFFRTcgcGhcdTAwRjJuZyFcbiAgICBpZiAoY3RybCkge1xuICAgICAgaWYgKGlzU2Vla2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICBpZiAocHJvdiA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQ/LmdldEN1cnJlbnRUaW1lKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY3VyID0geXRQbGF5ZXJSZWYuY3VycmVudC5nZXRDdXJyZW50VGltZSgpO1xuICAgICAgICAgIGlmIChjdXIgPiAwICYmICFpc05hTihjdXIpKSBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjdXIpKTtcbiAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBcdTAxMTBcdTFFRDBJIFZcdTFFREFJIEhcdTFFQ0NDIFNJTkggLyBOR1x1MDFBRlx1MUVEQ0kgWEVNIFRST05HIFBIXHUwMEQyTkcgXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgLy8gTlx1MUVCRnUgbmdcdTAxQjBcdTFFRERpIHhlbSBcdTAxMTFhbmcgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSB4ZW0gcmlcdTAwRUFuZyAoIWlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQpOlxuICAgIC8vIFRVWVx1MUVDNlQgXHUwMTEwXHUxRUQwSSBLSFx1MDBENE5HIFx1MDBFOXAgc2Vla1RvIGhheSBwbGF5VmlkZW8gbFx1MDBFMG0gZ2lcdTAwRTFuIFx1MDExMW9cdTFFQTFuIHZpXHUxRUM3YyB4ZW0gY1x1MUVFN2EgbmdcdTAxQjBcdTFFRERpIHRoYW0gZ2lhIVxuICAgIGlmICghaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIE5cdTFFQkZ1IHZpZGVvIFx1MDExMVx1MDBFMyBjaFx1MUVBMW0gXHUwMTExXHUxRUJGbiBcdTAxMTFpXHUxRUMzbSBjdVx1MUVEMWkgKHRhcmdldFBvcyA+PSBtYXhEdXIpIHZcdTAwRTAgbWF4RHVyID4gMDpcbiAgICAvLyBOZ1x1MDFCMFx1MUVERGkgeGVtIHBoXHUxRUEzaSBkXHUxRUVCbmcgbFx1MUVBMWkgdFx1MUVBMWkgXHUwMTExaVx1MUVDM20gY3VcdTFFRDFpIFZcdTAwQzAgVFVBIFx1MDExMFx1MUVCRU4gSFx1MUVCRVQgVklERU8geSBjaGFuZyBjaFx1MUVFNyBwaFx1MDBGMm5nXG4gICAgaWYgKG1heER1ciA+IDAgJiYgdGFyZ2V0UG9zID49IG1heER1cikge1xuICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IobWF4RHVyKSk7XG4gICAgICBpZiAocHJvdiA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSBtYXhEdXI7XG4gICAgICAgICAgdmlkZW9SZWYuY3VycmVudC5wYXVzZSgpO1xuICAgICAgICB9IGNhdGNoIHt9XG4gICAgICB9IGVsc2UgaWYgKHByb3YgPT09ICdZT1VUVUJFJykge1xuICAgICAgICBjb25zdCBwID0geXRQbGF5ZXJSZWYuY3VycmVudDtcbiAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICAgIGlmIChwPy5zZWVrVG8pIHsgdHJ5IHsgcC5zZWVrVG8obWF4RHVyLCB0cnVlKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW21heER1ciwgdHJ1ZV0gfSksICcqJyk7XG4gICAgICAgIGlmIChwPy5wYXVzZVZpZGVvKSB7IHRyeSB7IHAucGF1c2VWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwYXVzZVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICB9XG4gICAgICBzZXRWaWV3ZXJJc1BhdXNlZCh0cnVlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc05ld1JldmlzaW9uID0gbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ICE9PSBudWxsICYmIHN0LnJldmlzaW9uICE9PSBsYXN0QXBwbGllZFJldmlzaW9uUmVmLmN1cnJlbnQ7XG4gICAgaWYgKGxhc3RBcHBsaWVkUmV2aXNpb25SZWYuY3VycmVudCA9PT0gbnVsbCkge1xuICAgICAgbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ID0gc3QucmV2aXNpb247XG4gICAgfVxuXG4gICAgaWYgKHByb3YgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHYgPSB2aWRlb1JlZi5jdXJyZW50O1xuICAgICAgaWYgKCFoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgJiYgdGFyZ2V0UG9zID4gMCkge1xuICAgICAgICBoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICB2LmN1cnJlbnRUaW1lID0gdGFyZ2V0UG9zO1xuICAgICAgfVxuICAgICAgaWYgKGlzTmV3UmV2aXNpb24pIHtcbiAgICAgICAgbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ID0gc3QucmV2aXNpb247XG4gICAgICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICAgICAgdi5jdXJyZW50VGltZSA9IHRhcmdldFBvcztcbiAgICAgICAgICBpZiAoaGFzSW50ZXJhY3RlZCB8fCBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpIHYucGxheSgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcih0YXJnZXRQb3MpKTtcbiAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZChmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdi5wYXVzZSgpO1xuICAgICAgICAgIHYuY3VycmVudFRpbWUgPSBOdW1iZXIoc3QucG9zaXRpb25TZWNvbmRzIHx8IDApO1xuICAgICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKE51bWJlcihzdC5wb3NpdGlvblNlY29uZHMgfHwgMCkpKTtcbiAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZCh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHNldExvY2FsVGltZShNYXRoLm1heCgwLCBNYXRoLmZsb29yKHRhcmdldFBvcykpKTtcbiAgICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICAgIGNvbnN0IGRyaWZ0ID0gTWF0aC5hYnModi5jdXJyZW50VGltZSAtIHRhcmdldFBvcyk7XG4gICAgICAgIGlmIChkcmlmdCA+IDMuMCkge1xuICAgICAgICAgIHYuY3VycmVudFRpbWUgPSB0YXJnZXRQb3M7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHYucGF1c2VkICYmIChoYXNJbnRlcmFjdGVkIHx8IGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCkpIHtcbiAgICAgICAgICB2LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghdi5wYXVzZWQpIHYucGF1c2UoKTtcbiAgICAgICAgY29uc3QgZHJpZnQgPSBNYXRoLmFicyh2LmN1cnJlbnRUaW1lIC0gc3QucG9zaXRpb25TZWNvbmRzKTtcbiAgICAgICAgaWYgKGRyaWZ0ID4gMi4wKSB7XG4gICAgICAgICAgdi5jdXJyZW50VGltZSA9IHN0LnBvc2l0aW9uU2Vjb25kcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvdiA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgIGNvbnN0IHAgPSB5dFBsYXllclJlZi5jdXJyZW50O1xuICAgICAgbGV0IGN1ciA9IG51bGw7XG4gICAgICBsZXQgcHMgPSBudWxsO1xuICAgICAgaWYgKHAgJiYgdHlwZW9mIHAuZ2V0Q3VycmVudFRpbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdHJ5IHsgY3VyID0gcC5nZXRDdXJyZW50VGltZSgpOyB9IGNhdGNoIHt9XG4gICAgICB9XG4gICAgICBpZiAocCAmJiB0eXBlb2YgcC5nZXRQbGF5ZXJTdGF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0cnkgeyBwcyA9IHAuZ2V0UGxheWVyU3RhdGUoKTsgfSBjYXRjaCB7fVxuICAgICAgfVxuXG4gICAgICAvLyBJbml0aWFsIHNlZWsgblx1MUVCRnUgbmdcdTAxQjBcdTFFRERpIHhlbSBjaFx1MDFCMGEgdFx1MUVFQm5nIHR1YSBcdTAxMTFcdTFFQkZuIG1cdTFFRDFjIGNcdTFFRTdhIGNoXHUxRUU3IHBoXHUwMEYybmdcbiAgICAgIGlmICghaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ICYmIHRhcmdldFBvcyA+IDApIHtcbiAgICAgICAgaGFzU2Vla2VkSW5pdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgaWYgKHA/LnNlZWtUbykgeyB0cnkgeyBwLnNlZWtUbyh0YXJnZXRQb3MsIHRydWUpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbdGFyZ2V0UG9zLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgIH1cblxuICAgICAgLy8gS2hpIHBoXHUwMEUxdCBoaVx1MUVDN24gdGhhbyB0XHUwMEUxYyBtXHUxRURCaSB0XHUxRUVCIGNoXHUxRUU3IHBoXHUwMEYybmcgKFJldmlzaW9uIHRoYXkgXHUwMTExXHUxRUQ1aSBkbyBjaFx1MUVFNyBwaFx1MDBGMm5nIGJcdTFFQTVtIFZcdTAwRjluZyAxIGhvXHUxRUI3YyBWXHUwMEY5bmcgMilcbiAgICAgIGlmIChpc05ld1JldmlzaW9uKSB7XG4gICAgICAgIGxhc3RBcHBsaWVkUmV2aXNpb25SZWYuY3VycmVudCA9IHN0LnJldmlzaW9uO1xuICAgICAgICBpZiAoIXN0LnBsYXlpbmcpIHtcbiAgICAgICAgICAvLyBDaFx1MUVFNyBwaFx1MDBGMm5nIGJcdTFFQTVtIFRcdTFFQTFtIGRcdTFFRUJuZzogTFx1MUVBRHAgdFx1MUVFOWMgdFx1MUVBMW0gZFx1MUVFQm5nIHZcdTAwRTAgdHVhIHZcdTFFQzEgXHUwMTExXHUwMEZBbmcgdlx1MUVDQiB0clx1MDBFRCBjaFx1MUVFNyBwaFx1MDBGMm5nIFx1MDExMVx1MDBFMyBkXHUxRUVCbmdcbiAgICAgICAgICBpZiAocD8ucGF1c2VWaWRlbykgeyB0cnkgeyBwLnBhdXNlVmlkZW8oKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwYXVzZVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICAgICAgY29uc3QgcFNlYyA9IE51bWJlcihzdC5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgICAgICAgaWYgKHA/LnNlZWtUbykgeyB0cnkgeyBwLnNlZWtUbyhwU2VjLCB0cnVlKTsgfSBjYXRjaCB7fSB9XG4gICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbcFNlYywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IocFNlYykpO1xuICAgICAgICAgIHNldFZpZXdlcklzUGF1c2VkKHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENoXHUxRUU3IHBoXHUwMEYybmcgYlx1MUVBNW0gUGhcdTAwRTF0IHRpXHUxRUJGcCBob1x1MUVCN2Mgdlx1MUVFQmEgVHVhIHRoXHUxRUREaSBnaWFuOiBMXHUxRUFEcCB0XHUxRUU5YyB0dWEgdlx1MDBFMCBwaFx1MDBFMXQgeSBjaGFuZyBjaFx1MUVFNyBwaFx1MDBGMm5nXG4gICAgICAgICAgaWYgKHA/LnNlZWtUbykgeyB0cnkgeyBwLnNlZWtUbyh0YXJnZXRQb3MsIHRydWUpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFt0YXJnZXRQb3MsIHRydWVdIH0pLCAnKicpO1xuICAgICAgICAgIGlmIChoYXNJbnRlcmFjdGVkIHx8IGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgaWYgKHA/LnBsYXlWaWRlbykgeyB0cnkgeyBwLnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGxheVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKHRhcmdldFBvcykpO1xuICAgICAgICAgIHNldFZpZXdlcklzUGF1c2VkKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIEdpXHUxRUVGIG5oXHUxRUNCcCBwaFx1MDBFMXQgXHUxRUQ1biBcdTAxMTFcdTFFQ0JuaCB0cm9uZyBjXHUwMEUxYyBjaHUga1x1MUVGMyBwb2xsIFx1MDExMVx1MUVDQm5oIGtcdTFFRjNcbiAgICAgIHNldExvY2FsVGltZShNYXRoLm1heCgwLCBNYXRoLmZsb29yKHRhcmdldFBvcykpKTtcblxuICAgICAgaWYgKGN1ciAhPT0gbnVsbCAmJiAhaXNOYU4oY3VyKSkge1xuICAgICAgICBjb25zdCBkcmlmdCA9IE1hdGguYWJzKGN1ciAtIHRhcmdldFBvcyk7XG4gICAgICAgIGlmIChzdC5wbGF5aW5nKSB7XG4gICAgICAgICAgaWYgKGRyaWZ0ID4gMy41KSB7XG4gICAgICAgICAgICBpZiAocD8uc2Vla1RvKSB7IHRyeSB7IHAuc2Vla1RvKHRhcmdldFBvcywgdHJ1ZSk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbdGFyZ2V0UG9zLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKChwcyA9PT0gMiB8fCBwcyA9PT0gNSkgJiYgKGhhc0ludGVyYWN0ZWQgfHwgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSkge1xuICAgICAgICAgICAgaWYgKHA/LnBsYXlWaWRlbykgeyB0cnkgeyBwLnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGxheVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEtoaSBzZXJ2ZXIgYlx1MDBFMW8gcGF1c2UsIGx1XHUwMEY0biBnXHUxRUVEaSBwYXVzZSBuXHUxRUJGdSBwbGF5ZXIgXHUwMTExYW5nIHBoXHUwMEUxdFxuICAgICAgICAgIGlmIChwcyA9PT0gMSB8fCBwcyA9PT0gMykge1xuICAgICAgICAgICAgaWYgKHA/LnBhdXNlVmlkZW8pIHsgdHJ5IHsgcC5wYXVzZVZpZGVvKCk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwYXVzZVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChkcmlmdCA+IDEuOCkge1xuICAgICAgICAgICAgaWYgKHA/LnNlZWtUbykgeyB0cnkgeyBwLnNlZWtUbyhzdC5wb3NpdGlvblNlY29uZHMsIHRydWUpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3N0LnBvc2l0aW9uU2Vjb25kcywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc3QucGxheWluZyAmJiAoaGFzSW50ZXJhY3RlZCB8fCBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQpICYmIHBzICE9PSAxKSB7XG4gICAgICAgICAgaWYgKHA/LnBsYXlWaWRlbykgeyB0cnkgeyBwLnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9IH1cbiAgICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BsYXlWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgICB9IGVsc2UgaWYgKCFzdC5wbGF5aW5nKSB7XG4gICAgICAgICAgaWYgKHA/LnBhdXNlVmlkZW8pIHsgdHJ5IHsgcC5wYXVzZVZpZGVvKCk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGF1c2VWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFBvbGwgdHJcdTFFQTFuZyB0aFx1MDBFMWkgbVx1MDBFMXkgY2hcdTFFRTcgbVx1MUVEN2kgMS4ycyBcdTAxMTFcdTFFQzMgbmdcdTAxQjBcdTFFRERpIHRoYW0gZ2lhIGJcdTFFQUZ0IGtcdTFFQ0JwIHRcdTFFRTljIHRoXHUwMEVDIHRoYW8gdFx1MDBFMWMgY1x1MUVFN2EgY2hcdTFFRTcgcGhcdTAwRjJuZ1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuICAgIGNvbnN0IGZldGNoV2F0Y2ggPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9waG9uZy13YXRjaD9waG9uZ0lkPSR7cGhvbmcuaWR9YCk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoIWFjdGl2ZSkgcmV0dXJuO1xuICAgICAgICBpZiAoZC5vayAmJiBkLnN0YXRlKSB7XG4gICAgICAgICAgc2V0V2F0Y2hTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgICBzZXRDYW5Db250cm9sKEJvb2xlYW4oZC5jYW5Db250cm9sKSk7XG4gICAgICAgICAgaWYgKGQuY2Fwcykgc2V0V2F0Y2hDYXBzKGQuY2Fwcyk7XG4gICAgICAgICAgc2V0UHJvdmlkZXIoZC5wcm92aWRlciB8fCAnVU5TVVBQT1JURUQnKTtcbiAgICAgICAgICBpZiAoZC5waG9uZz8udmlkZW9VcmwgJiYgZC5waG9uZy52aWRlb1VybCAhPT0gYWN0aXZlVmlkZW9VcmwpIHtcbiAgICAgICAgICAgIHNldEFjdGl2ZVZpZGVvVXJsKGQucGhvbmcudmlkZW9VcmwpO1xuICAgICAgICAgICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgICAgICBzZXRJc0xpdmVXaXRoSG9zdCh0cnVlKTtcbiAgICAgICAgICAgIHNldFZpZXdlcklzUGF1c2VkKGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXBEdW5nRG9uZ0JvKGQuc3RhdGUsIEJvb2xlYW4oZC5jYW5Db250cm9sKSwgZC5wcm92aWRlciB8fCAnVU5TVVBQT1JURUQnKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7IH1cbiAgICB9O1xuXG4gICAgZmV0Y2hXYXRjaCgpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoa2hpSGllblRoaShmZXRjaFdhdGNoKSwgMTIwMCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgfTtcbiAgfSwgW3Bob25nLmlkLCBoYXNJbnRlcmFjdGVkXSk7XG5cbiAgLy8gVFx1MUVGMSBcdTAxMTFcdTFFRDluZyB0XHUxRUExbSBkXHUxRUVCbmcgcGhcdTAwRjJuZyBraGkgY2hcdTFFRTcgcGhcdTAwRjJuZyBcdTAxMTFcdTAwRjNuZyB0YWIgdHJcdTAwRUNuaCBkdXlcdTFFQzd0XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qgb25VbmxvYWQgPSAoKSA9PiB7XG4gICAgICBpZiAoY2FuQ29udHJvbCAmJiB3YXRjaFN0YXRlUmVmLmN1cnJlbnQ/LnBsYXlpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBwYXlsb2FkID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcGhvbmdJZDogcGhvbmcuaWQsXG4gICAgICAgICAgICBhY3Rpb246ICdwYXVzZScsXG4gICAgICAgICAgICBwb3NpdGlvbjogbG9jYWxUaW1lLFxuICAgICAgICAgICAgZXhwZWN0ZWRSZXZpc2lvbjogd2F0Y2hTdGF0ZVJlZi5jdXJyZW50LnJldmlzaW9uLFxuICAgICAgICAgICAgcGxheWJhY2tSYXRlOiAxLjBcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBuYXZpZ2F0b3Iuc2VuZEJlYWNvbignL2FwaS9waG9uZy13YXRjaCcsIG5ldyBCbG9iKFtwYXlsb2FkXSwgeyB0eXBlOiAnYXBwbGljYXRpb24vanNvbicgfSkpO1xuICAgICAgICB9IGNhdGNoIHt9XG4gICAgICB9XG4gICAgfTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgb25VbmxvYWQpO1xuICAgIHJldHVybiAoKSA9PiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgb25VbmxvYWQpO1xuICB9LCBbY2FuQ29udHJvbCwgcGhvbmcuaWQsIGxvY2FsVGltZV0pO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBUXHUxRUE2TkcgMyAmIDQ6IFBvc2l0aW9uYWwgV2F0Y2hkb2cgJiBDXHUxRUFEcCBuaFx1MUVBRHQgbG9jYWxUaW1lIG1cdTAxQjBcdTFFRTN0IG1cdTAwRTAgXHUyNTAwXHUyNTAwXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgaXNQbGF5aW5nID0gY2FuQ29udHJvbCA/IHdhdGNoU3RhdGUucGxheWluZyA6IChpc0xpdmVXaXRoSG9zdCA/IHdhdGNoU3RhdGUucGxheWluZyA6ICF2aWV3ZXJJc1BhdXNlZCk7XG4gICAgaWYgKCFpc1BsYXlpbmcpIHJldHVybjtcbiAgICBjb25zdCB0aWNrID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKGlzU2Vla2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG5cbiAgICAgIGxldCBjdXJUaW1lID0gbnVsbDtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnICYmIHl0UGxheWVyUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBwID0geXRQbGF5ZXJSZWYuY3VycmVudDtcbiAgICAgICAgICBpZiAocC5nZXREdXJhdGlvbikge1xuICAgICAgICAgICAgY29uc3QgZCA9IHAuZ2V0RHVyYXRpb24oKTtcbiAgICAgICAgICAgIGlmIChkID4gMCkge1xuICAgICAgICAgICAgICBkdXJhdGlvblJlZi5jdXJyZW50ID0gZDtcbiAgICAgICAgICAgICAgaWYgKGR1cmF0aW9uID09PSAwKSBzZXREdXJhdGlvbihkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHAuZ2V0Q3VycmVudFRpbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1ciA9IHAuZ2V0Q3VycmVudFRpbWUoKTtcbiAgICAgICAgICAgIGlmIChjdXIgIT09IHVuZGVmaW5lZCAmJiBjdXIgIT09IG51bGwgJiYgIWlzTmFOKGN1cikpIHtcbiAgICAgICAgICAgICAgY3VyVGltZSA9IGN1cjtcbiAgICAgICAgICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgICAgICAgICAgY29uc3QgY2xhbXBlZEN1ciA9IG1heER1ciA+IDAgPyBNYXRoLm1pbihjdXIsIG1heER1cikgOiBjdXI7XG4gICAgICAgICAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKGNsYW1wZWRDdXIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHAuZ2V0UGxheWVyU3RhdGUgJiYgcC5nZXRQbGF5ZXJTdGF0ZSgpID09PSAwKSB7XG4gICAgICAgICAgICBoYW5kbGVWaWRlb0VuZGVkKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIHt9XG4gICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICAgIGNvbnN0IGN1ciA9IHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWU7XG4gICAgICAgIGlmICghaXNOYU4oY3VyKSkge1xuICAgICAgICAgIGN1clRpbWUgPSBjdXI7XG4gICAgICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgICAgICBjb25zdCBjbGFtcGVkQ3VyID0gbWF4RHVyID4gMCA/IE1hdGgubWluKGN1ciwgbWF4RHVyKSA6IGN1cjtcbiAgICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihjbGFtcGVkQ3VyKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gR2lcdTAwRTFtIHNcdTAwRTF0IHZcdTFFQ0IgdHJcdTAwRUQ6IG5cdTFFQkZ1IHZpZGVvIFx1MDExMVx1MDBFMyBwaFx1MDBFMXQgXHUwMTExXHUxRUJGbiBnaVx1MDBFMnkgY3VcdTFFRDFpIGNcdTAwRjluZyBob1x1MUVCN2MgcXVcdTAwRTEgZHVyYXRpb25cbiAgICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgICBjb25zdCBjdXJyZW50UG9zID0gY3VyVGltZSAhPT0gbnVsbCA/IGN1clRpbWUgOiBsb2NhbFRpbWU7XG4gICAgICBpZiAobWF4RHVyID4gNSAmJiAoY3VycmVudFBvcyA+PSBtYXhEdXIgLSAxLjAgfHwgbG9jYWxUaW1lID49IG1heER1cikpIHtcbiAgICAgICAgaGFuZGxlVmlkZW9FbmRlZCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChjYW5Db250cm9sICYmIGN1clRpbWUgIT09IG51bGwgJiYgY3VyVGltZSA+IDAgJiYgIWRhbmdHdWlMZW5oUmVmLmN1cnJlbnQgJiYgIWlzU2Vla2luZ1JlZi5jdXJyZW50KSB7XG4gICAgICAgIGNvbnN0IG5vd01zID0gRGF0ZS5ub3coKTtcbiAgICAgICAgaWYgKCFsYXN0SG9zdFN5bmNUaW1lUmVmLmN1cnJlbnQpIGxhc3RIb3N0U3luY1RpbWVSZWYuY3VycmVudCA9IG5vd01zO1xuICAgICAgICBjb25zdCB1cGRhdGVUaW1lTXMgPSB3YXRjaFN0YXRlLnVwZGF0ZWRBdCA/IG5ldyBEYXRlKFN0cmluZyh3YXRjaFN0YXRlLnVwZGF0ZWRBdCkucmVwbGFjZSgnICcsICdUJykgKyAoU3RyaW5nKHdhdGNoU3RhdGUudXBkYXRlZEF0KS5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS5nZXRUaW1lKCkgOiBub3dNcztcbiAgICAgICAgY29uc3QgZWxhcHNlZFNlYyA9IE1hdGgubWF4KDAsIChub3dNcyAtIHVwZGF0ZVRpbWVNcykgLyAxMDAwKTtcbiAgICAgICAgY29uc3QgZXhwZWN0ZWRTZXJ2ZXJQb3MgPSBOdW1iZXIod2F0Y2hTdGF0ZS5iYXNlUG9zaXRpb25TZWNvbmRzICE9IG51bGwgPyB3YXRjaFN0YXRlLmJhc2VQb3NpdGlvblNlY29uZHMgOiB3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcykgKyAoZWxhcHNlZFNlYyAqICh3YXRjaFN0YXRlLnBsYXliYWNrUmF0ZSB8fCAxLjApKTtcbiAgICAgICAgY29uc3QgaG9zdERyaWZ0ID0gTWF0aC5hYnMoY3VyVGltZSAtIGV4cGVjdGVkU2VydmVyUG9zKTtcblxuICAgICAgICBjb25zdCBkYVF1YTE1cyA9IChub3dNcyAtIGxhc3RIb3N0U3luY1RpbWVSZWYuY3VycmVudCA+IDE1MDAwKTtcbiAgICAgICAgaWYgKChob3N0RHJpZnQgPiAzLjAgfHwgZGFRdWExNXMpICYmIChub3dNcyAtIGxhc3RIb3N0U3luY1RpbWVSZWYuY3VycmVudCA+IDQwMDApKSB7XG4gICAgICAgICAgbGFzdEhvc3RTeW5jVGltZVJlZi5jdXJyZW50ID0gbm93TXM7XG4gICAgICAgICAgZ3VpTGVuaCgnc2VlaycsIGN1clRpbWUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjdXJUaW1lID09PSBudWxsKSB7XG4gICAgICAgIHNldExvY2FsVGltZSh0ID0+IHtcbiAgICAgICAgICBpZiAobWF4RHVyID4gMCkge1xuICAgICAgICAgICAgaWYgKHQgPj0gbWF4RHVyKSByZXR1cm4gTWF0aC5mbG9vcihtYXhEdXIpO1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgubWluKHQgKyAxLCBNYXRoLmZsb29yKG1heER1cikpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdCArIDE7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sIDEwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpY2spO1xuICB9LCBbd2F0Y2hTdGF0ZS5wbGF5aW5nLCB2aWV3ZXJJc1BhdXNlZCwgaXNMaXZlV2l0aEhvc3QsIHByb3ZpZGVyLCBkdXJhdGlvbiwgbG9jYWxUaW1lLCBjYW5Db250cm9sXSk7XG5cbiAgY29uc3QgcGVuZGluZ0d1aUxlbmhSZWYgPSB1c2VSZWYobnVsbCk7XG5cbiAgLy8gR1x1MUVFRGkgbFx1MUVDN25oIFx1MDExMWlcdTFFQzF1IGtoaVx1MUVDM24gKFBsYXkgLyBQYXVzZSAvIFNlZWspXG4gIGNvbnN0IGd1aUxlbmggPSBhc3luYyAoYWN0aW9uLCBjdXN0b21Qb3MpID0+IHtcbiAgICBpZiAoZGFuZ0d1aUxlbmhSZWYuY3VycmVudCkge1xuICAgICAgcGVuZGluZ0d1aUxlbmhSZWYuY3VycmVudCA9IHsgYWN0aW9uLCBjdXN0b21Qb3MgfTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2V0RGFuZ0d1aUxlbmgodHJ1ZSk7XG4gICAgZGFuZ0d1aUxlbmhSZWYuY3VycmVudCA9IHRydWU7XG4gICAgc2V0TG9pKCcnKTtcblxuICAgIGxldCBwb3MgPSBjdXN0b21Qb3M7XG4gICAgaWYgKHBvcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgcG9zID0gdmlkZW9SZWYuY3VycmVudC5jdXJyZW50VGltZTtcbiAgICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJyAmJiB5dFBsYXllclJlZi5jdXJyZW50Py5nZXRDdXJyZW50VGltZSkge1xuICAgICAgICBwb3MgPSB5dFBsYXllclJlZi5jdXJyZW50LmdldEN1cnJlbnRUaW1lKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwb3MgPSBsb2NhbFRpbWU7XG4gICAgICB9XG4gICAgfVxuICAgIHBvcyA9IE1hdGgubWF4KDAsIE51bWJlcigocG9zIHx8IDApLnRvRml4ZWQoMikpKTtcblxuICAgIC8vIENcdTFFQURwIG5oXHUxRUFEdCBsXHUxRUExYyBxdWFuIHRyXHUwMEVBbiBsb2NhbCBwbGF5ZXJcbiAgICBpZiAoYWN0aW9uID09PSAncGxheScpIHtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkgdmlkZW9SZWYuY3VycmVudC5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8ucGxheVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wbGF5VmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BsYXlWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAncGF1c2UnKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQucGF1c2UoKTtcbiAgICAgIGVsc2UgaWYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBhdXNlVmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBhdXNlVmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BhdXNlVmlkZW8nLCBhcmdzOiBbXSB9KSwgJyonKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ3NlZWsnKSB7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHZpZGVvUmVmLmN1cnJlbnQuY3VycmVudFRpbWUgPSBwb3M7XG4gICAgICBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5zZWVrVG8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnNlZWtUbyhwb3MsIHRydWUpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3BvcywgdHJ1ZV0gfSksICcqJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRSZXYgPSB3YXRjaFN0YXRlUmVmLmN1cnJlbnQ/LnJldmlzaW9uIHx8IHdhdGNoU3RhdGUucmV2aXNpb24gfHwgMTtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3Bob25nLXdhdGNoJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBwaG9uZ0lkOiBwaG9uZy5pZCxcbiAgICAgICAgICBhY3Rpb24sXG4gICAgICAgICAgcG9zaXRpb246IHBvcyxcbiAgICAgICAgICBleHBlY3RlZFJldmlzaW9uOiBjdXJyZW50UmV2LFxuICAgICAgICAgIHBsYXliYWNrUmF0ZTogd2F0Y2hTdGF0ZVJlZi5jdXJyZW50Py5wbGF5YmFja1JhdGUgfHwgd2F0Y2hTdGF0ZS5wbGF5YmFja1JhdGUgfHwgMS4wXG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICBsYXN0QXBwbGllZFJldmlzaW9uUmVmLmN1cnJlbnQgPSBkLnN0YXRlLnJldmlzaW9uO1xuICAgICAgICBzZXRXYXRjaFN0YXRlKGQuc3RhdGUpO1xuICAgICAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcihkLnN0YXRlLnBvc2l0aW9uU2Vjb25kcyB8fCBwb3MpKTtcbiAgICAgIH0gZWxzZSBpZiAoZC5jb25mbGljdCAmJiBkLnN0YXRlKSB7XG4gICAgICAgIHNldFdhdGNoU3RhdGUoZC5zdGF0ZSk7XG4gICAgICAgIGFwRHVuZ0RvbmdCbyhkLnN0YXRlLCBjYW5Db250cm9sLCBwcm92aWRlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRMb2koZC5sb2kgfHwgJ0xcdTFFRDdpIGNcdTFFQURwIG5oXHUxRUFEdCBwaFx1MDBFMXQgdmlkZW8uJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRMb2koJ01cdTFFQTV0IGtcdTFFQkZ0IG5cdTFFRDFpIG1cdTAwRTF5IGNoXHUxRUU3LicpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXREYW5nR3VpTGVuaChmYWxzZSk7XG4gICAgICBkYW5nR3VpTGVuaFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICBpZiAocGVuZGluZ0d1aUxlbmhSZWYuY3VycmVudCkge1xuICAgICAgICBjb25zdCBuZXh0ID0gcGVuZGluZ0d1aUxlbmhSZWYuY3VycmVudDtcbiAgICAgICAgcGVuZGluZ0d1aUxlbmhSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICAgIGd1aUxlbmgobmV4dC5hY3Rpb24sIG5leHQuY3VzdG9tUG9zKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZ3VpTGVuaFJlZi5jdXJyZW50ID0gZ3VpTGVuaDtcblxuICAvLyBcdTAxMTBcdTFFRDNuZyBiXHUxRUQ5IHZcdTFFQ0IgdHJcdTAwRUQgdmlkZW8gaGlcdTFFQzduIHRcdTFFQTFpIHJhIG5nb1x1MDBFMGkgXHUwMTExXHUxRUMzIGNoYXQgZ1x1MUVBRm4gdGltZXN0YW1wXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHZpZGVvVGltZVJlZikgdmlkZW9UaW1lUmVmLmN1cnJlbnQgPSBsb2NhbFRpbWU7XG4gIH0sIFtsb2NhbFRpbWUsIHZpZGVvVGltZVJlZl0pO1xuXG5cblxuICAvLyBOaFx1MUVBRG4geVx1MDBFQXUgY1x1MUVBN3UgdHVhIHRcdTFFRUIgU3R1ZHlEb2NrIChiXHUxRUE1bSBtXHUxRUQxYyB2aWRlbyB0cm9uZyBjaGF0L2doaSBjaFx1MDBGQSkuXG4gIC8vIENcdTAwRjMgcXV5XHUxRUMxbiBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIFx1MjE5MiBwaFx1MDBFMXQgbFx1MUVDN25oIHNlZWsgY2h1bmc7IGtoXHUwMEY0bmcgXHUyMTkyIGNoXHUxRUM5IHR1YSBjXHUxRUU1YyBiXHUxRUQ5IHBsYXllciBjXHUxRUU3YSBtXHUwMEVDbmguXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qgb25TZWVrUmVxID0gKGUpID0+IHtcbiAgICAgIGlmIChlLmRldGFpbD8ucGhvbmdJZCAmJiBTdHJpbmcoZS5kZXRhaWwucGhvbmdJZCkgIT09IFN0cmluZyhwaG9uZz8uaWQpKSByZXR1cm47XG4gICAgICBjb25zdCBzZWMgPSBNYXRoLm1heCgwLCBOdW1iZXIoZS5kZXRhaWw/LnNlYykgfHwgMCk7XG5cbiAgICAgIGlmICghaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSB7XG4gICAgICAgIGhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgIHNldEhhc0ludGVyYWN0ZWQodHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKHNlYykpO1xuXG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgdmlkZW9SZWYuY3VycmVudC5jdXJyZW50VGltZSA9IHNlYztcbiAgICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8uc2Vla1RvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8oc2VjLCB0cnVlKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3NlZWtUbycsIGFyZ3M6IFtzZWMsIHRydWVdIH0pLCAnKicpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2FuQ29udHJvbCkge1xuICAgICAgICBndWlMZW5oKCdzZWVrJywgc2VjKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgc2V0SXNMaXZlV2l0aEhvc3QoZmFsc2UpO1xuICAgICAgfVxuICAgIH07XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3NyLXNlZWsnLCBvblNlZWtSZXEpO1xuICAgIHJldHVybiAoKSA9PiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignc3Itc2VlaycsIG9uU2Vla1JlcSk7XG4gIH0sIFtwaG9uZz8uaWQsIGNhbkNvbnRyb2wsIHByb3ZpZGVyLCB3YXRjaFN0YXRlPy5yZXZpc2lvbl0pO1xuXG4gIGNvbnN0IGhhbmRsZVN0YXJ0Vmlld2luZyA9ICgpID0+IHtcbiAgICBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHNldEhhc0ludGVyYWN0ZWQodHJ1ZSk7XG4gICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IHRydWU7XG4gICAgc2V0SXNMaXZlV2l0aEhvc3QodHJ1ZSk7XG4gICAgc2V0Vmlld2VySXNQYXVzZWQoZmFsc2UpO1xuXG4gICAgY29uc3Qgbm93TXMgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHVwZGF0ZVRpbWVNcyA9IHdhdGNoU3RhdGUudXBkYXRlZEF0ID8gbmV3IERhdGUoU3RyaW5nKHdhdGNoU3RhdGUudXBkYXRlZEF0KS5yZXBsYWNlKCcgJywgJ1QnKSArIChTdHJpbmcod2F0Y2hTdGF0ZS51cGRhdGVkQXQpLmluY2x1ZGVzKCdUJykgPyAnJyA6ICdaJykpLmdldFRpbWUoKSA6IG5vd01zO1xuICAgIGNvbnN0IGVsYXBzZWRTZWMgPSBNYXRoLm1heCgwLCAobm93TXMgLSB1cGRhdGVUaW1lTXMpIC8gMTAwMCk7XG4gICAgbGV0IHRhcmdldFBvcyA9IE51bWJlcih3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcyB8fCAwKTtcbiAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICB0YXJnZXRQb3MgPSBOdW1iZXIod2F0Y2hTdGF0ZS5iYXNlUG9zaXRpb25TZWNvbmRzICE9IG51bGwgPyB3YXRjaFN0YXRlLmJhc2VQb3NpdGlvblNlY29uZHMgOiB3YXRjaFN0YXRlLnBvc2l0aW9uU2Vjb25kcykgKyAoZWxhcHNlZFNlYyAqICh3YXRjaFN0YXRlLnBsYXliYWNrUmF0ZSB8fCAxLjApKTtcbiAgICB9XG4gICAgdGFyZ2V0UG9zID0gTWF0aC5tYXgoMCwgTnVtYmVyKHRhcmdldFBvcy50b0ZpeGVkKDIpKSk7XG5cbiAgICBoYXNTZWVrZWRJbml0UmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHNldExvY2FsVGltZShNYXRoLmZsb29yKHRhcmdldFBvcykpO1xuXG4gICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICBjb25zdCB2ID0gdmlkZW9SZWYuY3VycmVudDtcbiAgICAgIGlmICh0YXJnZXRQb3MgPiAwKSB2LmN1cnJlbnRUaW1lID0gdGFyZ2V0UG9zO1xuICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZykge1xuICAgICAgICB2LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2LnBhdXNlKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgIGlmICh0YXJnZXRQb3MgPiAwKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5zZWVrVG8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnNlZWtUbyh0YXJnZXRQb3MsIHRydWUpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbdGFyZ2V0UG9zLCB0cnVlXSB9KSwgJyonKTtcbiAgICAgIH1cbiAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBsYXlWaWRlbykge1xuICAgICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQucGxheVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BsYXlWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnBhdXNlVmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBhdXNlVmlkZW8oKTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGF1c2VWaWRlbycsIGFyZ3M6IFtdIH0pLCAnKicpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBOZ1x1MDFCMFx1MUVERGkgdGhhbSBnaWEgYlx1MUVBNW0gblx1MDBGQXQgXCJUclx1MUVGMWMgdGlcdTFFQkZwXCIgXHUwMTExXHUxRUMzIG5oXHUxRUEzeSB2XHUxRUMxIHRpbWVsaW5lIGNcdTFFRTdhIGNoXHUxRUU3IHBoXHUwMEYybmdcbiAgY29uc3QgaGFuZGxlR29MaXZlID0gKCkgPT4ge1xuICAgIGlmICghaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50KSB7XG4gICAgICBoYXNJbnRlcmFjdGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgc2V0SGFzSW50ZXJhY3RlZCh0cnVlKTtcbiAgICB9XG4gICAgaXNQcm9ncmFtbWF0aWNBY3Rpb25SZWYuY3VycmVudCA9IHRydWU7XG4gICAgbGFzdEdvTGl2ZUNsaWNrVGltZVJlZi5jdXJyZW50ID0gRGF0ZS5ub3coKTtcblxuICAgIGxldCB0YXJnZXRQb3MgPSBnZXRIb3N0Q3VycmVudFBvcygpO1xuICAgIGNvbnN0IG1heER1ciA9IGR1cmF0aW9uUmVmLmN1cnJlbnQgfHwgZHVyYXRpb247XG4gICAgY29uc3QgaXNWaWRlb0VuZGVkID0gbWF4RHVyID4gMCAmJiAodGFyZ2V0UG9zID49IG1heER1ciAtIDEuNSB8fCAoIXdhdGNoU3RhdGUucGxheWluZyAmJiB0YXJnZXRQb3MgPj0gbWF4RHVyIC0gMy4wKSk7XG4gICAgaWYgKGlzVmlkZW9FbmRlZCkge1xuICAgICAgdGFyZ2V0UG9zID0gbWF4RHVyO1xuICAgIH0gZWxzZSBpZiAobWF4RHVyID4gMCAmJiB0YXJnZXRQb3MgPiBtYXhEdXIpIHtcbiAgICAgIHRhcmdldFBvcyA9IG1heER1cjtcbiAgICB9XG5cbiAgICBzZXRMb2NhbFRpbWUoTWF0aC5mbG9vcih0YXJnZXRQb3MpKTtcbiAgICBpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICBzZXRJc0xpdmVXaXRoSG9zdCh0cnVlKTtcbiAgICBzZXRWaWV3ZXJJc1BhdXNlZCghd2F0Y2hTdGF0ZS5wbGF5aW5nIHx8IGlzVmlkZW9FbmRlZCk7XG4gICAgbGFzdEFwcGxpZWRSZXZpc2lvblJlZi5jdXJyZW50ID0gd2F0Y2hTdGF0ZS5yZXZpc2lvbjtcblxuICAgIGlmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgJiYgdmlkZW9SZWYuY3VycmVudCkge1xuICAgICAgdmlkZW9SZWYuY3VycmVudC5jdXJyZW50VGltZSA9IHRhcmdldFBvcztcbiAgICAgIGlmICh3YXRjaFN0YXRlLnBsYXlpbmcgJiYgIWlzVmlkZW9FbmRlZCkge1xuICAgICAgICB2aWRlb1JlZi5jdXJyZW50LnBsYXkoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWRlb1JlZi5jdXJyZW50LnBhdXNlKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICBpZiAoeXRQbGF5ZXJSZWYuY3VycmVudD8uc2Vla1RvKSB7XG4gICAgICAgIHRyeSB7IHl0UGxheWVyUmVmLmN1cnJlbnQuc2Vla1RvKHRhcmdldFBvcywgdHJ1ZSk7IH0gY2F0Y2gge31cbiAgICAgIH1cbiAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdzZWVrVG8nLCBhcmdzOiBbdGFyZ2V0UG9zLCB0cnVlXSB9KSwgJyonKTtcblxuICAgICAgaWYgKHdhdGNoU3RhdGUucGxheWluZyAmJiAhaXNWaWRlb0VuZGVkKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wbGF5VmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwbGF5VmlkZW8nLCBhcmdzOiBbXSB9KSwgJyonKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wYXVzZVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wYXVzZVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBpZnI/LmNvbnRlbnRXaW5kb3c/LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsgZXZlbnQ6ICdjb21tYW5kJywgZnVuYzogJ3BhdXNlVmlkZW8nLCBhcmdzOiBbXSB9KSwgJyonKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlzUHJvZ3JhbW1hdGljQWN0aW9uUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICB9LCAzNTAwKTtcbiAgfTtcblxuICAvLyBDaFx1MUVFNyBwaFx1MDBGMm5nIGJcdTFFQTVtIFBoXHUwMEUxdCAvIFRcdTFFQTFtIGRcdTFFRUJuZyAvIFBoXHUwMEUxdCBsXHUxRUExaVxuICBjb25zdCBoYW5kbGVIb3N0VG9nZ2xlUGxheSA9ICgpID0+IHtcbiAgICBpZiAod2F0Y2hTdGF0ZS5wbGF5aW5nKSB7XG4gICAgICBndWlMZW5oKCdwYXVzZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBtYXhEdXIgPSBkdXJhdGlvblJlZi5jdXJyZW50IHx8IGR1cmF0aW9uO1xuICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICBpc1NraXBwaW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGlmIChtYXhEdXIgPiAwICYmIGxvY2FsVGltZSA+PSBtYXhEdXIgLSAxLjUpIHtcbiAgICAgICAgLy8gVmlkZW8gXHUwMTExXHUwMEUzIGtcdTFFQkZ0IHRoXHUwMEZBYyAtPiBCXHUxRUE1bSBwaFx1MDBFMXQgbFx1MUVBMWkgdFx1MUVFQiBcdTAxMTFcdTFFQTd1XG4gICAgICAgIHNldExvY2FsVGltZSgwKTtcbiAgICAgICAgZ3VpTGVuaCgnc2VlaycsIDApO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGd1aUxlbmgoJ3BsYXknLCAwKSwgMTAwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGd1aUxlbmgoJ3BsYXknKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gTmdcdTAxQjBcdTFFRERpIHRoYW0gZ2lhIHRcdTFFRjEgYlx1MUVBNW0gVFx1MUVBMW0gZFx1MUVFQm5nIC8gVGlcdTFFQkZwIHRcdTFFRTVjIGNcdTFFRTVjIGJcdTFFRDlcbiAgY29uc3QgaGFuZGxlVmlld2VyVG9nZ2xlUGxheSA9ICgpID0+IHtcbiAgICBpZiAoIWhhc0ludGVyYWN0ZWRSZWYuY3VycmVudCkge1xuICAgICAgaGFzSW50ZXJhY3RlZFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgIHNldEhhc0ludGVyYWN0ZWQodHJ1ZSk7XG4gICAgfVxuICAgIGlmICh2aWV3ZXJJc1BhdXNlZCkge1xuICAgICAgLy8gVGlcdTFFQkZwIHRcdTFFRTVjIHBoXHUwMEUxdFxuICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgIGxldCBzdGFydFNlYyA9IGxvY2FsVGltZTtcbiAgICAgIGlmIChtYXhEdXIgPiAwICYmIGxvY2FsVGltZSA+PSBtYXhEdXIgLSAxLjUpIHtcbiAgICAgICAgc3RhcnRTZWMgPSAwO1xuICAgICAgICBzZXRMb2NhbFRpbWUoMCk7XG4gICAgICB9XG4gICAgICBzZXRWaWV3ZXJJc1BhdXNlZChmYWxzZSk7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgaWYgKHN0YXJ0U2VjID09PSAwKSB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lID0gMDtcbiAgICAgICAgdmlkZW9SZWYuY3VycmVudC5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICAgIGlmIChzdGFydFNlYyA9PT0gMCkge1xuICAgICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5zZWVrVG8pIHsgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5zZWVrVG8oMCwgdHJ1ZSk7IH0gY2F0Y2gge30gfVxuICAgICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHl0Q29udGFpbmVySWQpO1xuICAgICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogWzAsIHRydWVdIH0pLCAnKicpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wbGF5VmlkZW8pIHtcbiAgICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnBsYXlWaWRlbygpOyB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoeXRDb250YWluZXJJZCk7XG4gICAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAncGxheVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRcdTFFQTFtIGRcdTFFRUJuZ1xuICAgICAgc2V0Vmlld2VySXNQYXVzZWQodHJ1ZSk7XG4gICAgICBpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICBzZXRJc0xpdmVXaXRoSG9zdChmYWxzZSk7XG4gICAgICBpZiAocHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnICYmIHZpZGVvUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgdmlkZW9SZWYuY3VycmVudC5wYXVzZSgpO1xuICAgICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSB7XG4gICAgICAgIGlmICh5dFBsYXllclJlZi5jdXJyZW50Py5wYXVzZVZpZGVvKSB7XG4gICAgICAgICAgdHJ5IHsgeXRQbGF5ZXJSZWYuY3VycmVudC5wYXVzZVZpZGVvKCk7IH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgICAgaWZyPy5jb250ZW50V2luZG93Py5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7IGV2ZW50OiAnY29tbWFuZCcsIGZ1bmM6ICdwYXVzZVZpZGVvJywgYXJnczogW10gfSksICcqJyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIE5nXHUwMUIwXHUxRUREaSB0aGFtIGdpYSB0XHUxRUYxIHR1YSB0clx1MDBFQW4gc2xpZGVyIGNcdTFFRTVjIGJcdTFFRDlcbiAgY29uc3QgaGFuZGxlVmlld2VyU2VlayA9IChzZWMpID0+IHtcbiAgICBpc1NlZWtpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgIHNldExvY2FsVGltZShzZWMpO1xuICAgIGlzTGl2ZVdpdGhIb3N0UmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICBzZXRJc0xpdmVXaXRoSG9zdChmYWxzZSk7XG4gICAgaWYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyAmJiB2aWRlb1JlZi5jdXJyZW50KSB7XG4gICAgICB2aWRlb1JlZi5jdXJyZW50LmN1cnJlbnRUaW1lID0gc2VjO1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdZT1VUVUJFJykge1xuICAgICAgaWYgKHl0UGxheWVyUmVmLmN1cnJlbnQ/LnNlZWtUbykge1xuICAgICAgICB0cnkgeyB5dFBsYXllclJlZi5jdXJyZW50LnNlZWtUbyhzZWMsIHRydWUpOyB9IGNhdGNoIHt9XG4gICAgICB9XG4gICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh5dENvbnRhaW5lcklkKTtcbiAgICAgIGlmcj8uY29udGVudFdpbmRvdz8ucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeyBldmVudDogJ2NvbW1hbmQnLCBmdW5jOiAnc2Vla1RvJywgYXJnczogW3NlYywgdHJ1ZV0gfSksICcqJyk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9e2BmbGV4IGZsZXgtY29sIG1pbi13LTAgdy1mdWxsICR7aXNSb29tV2lkZSA/ICdoLWZ1bGwgZmxleC0xIG1pbi1oLTAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyJyA6ICdnYXAtNCd9YH0+XG4gICAgICB7LyogS2h1bmcgcGhcdTAwRTF0IHZpZGVvIGNoXHUwMEVEbmggXHUyMDE0IGtodW5nIG5lb24gbVx1MUVERCBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGhcdTFFQzcgZ2FtZSBhcmVuYSAqL31cbiAgICAgIDxkaXZcbiAgICAgICAgc3R5bGU9e1xuICAgICAgICAgIGlzUm9vbVdpZGUgJiYgbGF5b3V0UmF0aW8gPT09ICcxMDowJ1xuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgbWF4SGVpZ2h0OiAnY2FsYygxMDB2aCAtIDc2cHgpJyxcbiAgICAgICAgICAgICAgICBtYXhXaWR0aDogJ2NhbGMoKDEwMHZoIC0gNzZweCkgKiAxNiAvIDkpJyxcbiAgICAgICAgICAgICAgICBhc3BlY3RSYXRpbzogJzE2IC8gOScsXG4gICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICdhdXRvJyxcbiAgICAgICAgICAgICAgICBtYXJnaW46ICcwIGF1dG8nLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICA6IGlzUm9vbVdpZGVcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgIG1heEhlaWdodDogJ2NhbGMoMTAwdmggLSA4NHB4KScsXG4gICAgICAgICAgICAgICAgYXNwZWN0UmF0aW86ICcxNiAvIDknLFxuICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAnYXV0bycsXG4gICAgICAgICAgICAgICAgbWFyZ2luOiAnMCBhdXRvJyxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB1bmRlZmluZWRcbiAgICAgICAgfVxuICAgICAgICBjbGFzc05hbWU9XCJyZWxhdGl2ZSB3LWZ1bGwgYXNwZWN0LXZpZGVvIGJnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzA1MDcwYl0gdG8tYmxhY2sgcm91bmRlZC0yeGwgb3ZlcmZsb3ctaGlkZGVuIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzE1IHJpbmctMSByaW5nLXdoaXRlLzUgc2hhZG93LVswXzBfNjBweF9yZ2JhKDAsMjQyLDI1NCwwLjA3KSwwXzMwcHhfNjBweF8tMTVweF9yZ2JhKDAsMCwwLDAuNyldXCJcbiAgICAgID5cbiAgICAgICAgey8qIE92ZXJsYXkgQXV0b3BsYXkgLyBHZXN0dXJlIGNobyBuZ1x1MDFCMFx1MUVERGkgeGVtICovfVxuICAgICAgICB7IWhhc0ludGVyYWN0ZWQgJiYgIWNhbkNvbnRyb2wgJiYgKHByb3ZpZGVyID09PSAnWU9VVFVCRScgfHwgcHJvdmlkZXIgPT09ICdOQVRJVkVfSFRNTDUnKSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIHotMjAgYmctYmxhY2svNzUgYmFja2Ryb3AtYmx1ci1zbSBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTQgdGV4dC1jZW50ZXIgYW5pbWF0ZS1mYWRlSW5cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xNCBoLTE0IHJvdW5kZWQtZnVsbCBiZy1bIzAwRjJGRV0vMjAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vNDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC0yeGwgbWItMyBzaGFkb3ctWzBfMF8yNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBhbmltYXRlLXB1bHNlXCI+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REZBQ1xuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBtYi0xXCI+WGVtIENodW5nIENcdTAwRjluZyBQaFx1MDBGMm5nPC9wPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTMwMCBtYXgtdy14cyBtYi00XCI+XG4gICAgICAgICAgICAgIEJcdTFFQTVtIG5cdTAwRkF0IGJcdTAwRUFuIGRcdTAxQjBcdTFFREJpIFx1MDExMVx1MUVDMyBjXHUxRUE1cCBxdXlcdTFFQzFuIFx1MDBFMm0gdGhhbmggdlx1MDBFMCBjXHUwMEY5bmcgdGhlbyBkXHUwMEY1aSB0aW1lbGluZSB2XHUxRURCaSBjaFx1MUVFNyBwaFx1MDBGMm5nLlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImJ0bi12aWV3ZXItc3RhcnQtd2F0Y2hcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlU3RhcnRWaWV3aW5nfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIuNSByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwRjJGRV0gdG8tWyMzQjgyRjZdIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXhzIHNoYWRvdy1sZyBob3ZlcjpvcGFjaXR5LTkwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTI1QjY8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPkJcdTFFQUZ0IFx1MDExMVx1MUVBN3UgeGVtIGNcdTAwRjluZyBwaFx1MDBGMm5nPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFZpZGVvIGVsZW1lbnRzIHRoZW8gcHJvdmlkZXIgKi99XG4gICAgICAgIHt5dElkID8gKFxuICAgICAgICAgIDxkaXYga2V5PXtgeXQtd3JhcC0ke3Bob25nLmlkfWB9IGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgcmVsYXRpdmUgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctYmxhY2tcIj5cbiAgICAgICAgICAgIDxpZnJhbWVcbiAgICAgICAgICAgICAgaWQ9e3l0Q29udGFpbmVySWR9XG4gICAgICAgICAgICAgIGtleT17YHl0LWZyYW1lLSR7cGhvbmcuaWR9YH1cbiAgICAgICAgICAgICAgc3JjPXtgaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvJHt5dElkfT9lbmFibGVqc2FwaT0xJm9yaWdpbj0ke2VuY29kZVVSSUNvbXBvbmVudCh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gOiAnJyl9JndpZGdldF9yZWZlcnJlcj0ke2VuY29kZVVSSUNvbXBvbmVudCh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5sb2NhdGlvbi5ocmVmIDogJycpfSZyZWw9MCZtb2Rlc3RicmFuZGluZz0xJnBsYXlzaW5saW5lPTFgfVxuICAgICAgICAgICAgICB0aXRsZT17cGhvbmcudGVuIHx8ICdZb3VUdWJlIFZpZGVvJ31cbiAgICAgICAgICAgICAgYWxsb3c9XCJhY2NlbGVyb21ldGVyOyBhdXRvcGxheTsgY2xpcGJvYXJkLXdyaXRlOyBlbmNyeXB0ZWQtbWVkaWE7IGd5cm9zY29wZTsgcGljdHVyZS1pbi1waWN0dXJlOyB3ZWItc2hhcmVcIlxuICAgICAgICAgICAgICBhbGxvd0Z1bGxTY3JlZW5cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBib3JkZXItMFwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogZHJ2SWQgPyAoXG4gICAgICAgICAgPGlmcmFtZVxuICAgICAgICAgICAgc3JjPXtgaHR0cHM6Ly9kcml2ZS5nb29nbGUuY29tL2ZpbGUvZC8ke2RydklkfS9wcmV2aWV3YH1cbiAgICAgICAgICAgIHRpdGxlPXtwaG9uZy50ZW59XG4gICAgICAgICAgICBhbGxvdz1cImF1dG9wbGF5OyBmdWxsc2NyZWVuXCJcbiAgICAgICAgICAgIGFsbG93RnVsbFNjcmVlblxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbFwiXG4gICAgICAgICAgLz5cbiAgICAgICAgKSA6IHRydWNUaWVwVXJsID8gKFxuICAgICAgICAgIDx2aWRlb1xuICAgICAgICAgICAgcmVmPXt2aWRlb1JlZn1cbiAgICAgICAgICAgIHNyYz17dHJ1Y1RpZXBVcmx9XG4gICAgICAgICAgICBwbGF5c0lubGluZVxuICAgICAgICAgICAgZGF0YS10ZXN0aWQ9XCJzdHVkeS12aWRlby1wbGF5ZXJcIlxuICAgICAgICAgICAgY29udHJvbHM9e3RydWV9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb250YWluXCJcbiAgICAgICAgICAgIG9uTG9hZGVkTWV0YWRhdGE9e2UgPT4ge1xuICAgICAgICAgICAgICBpZiAoZS50YXJnZXQuZHVyYXRpb24gPiAwKSBzZXREdXJhdGlvbihlLnRhcmdldC5kdXJhdGlvbik7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25QbGF5PXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sICYmICF3YXRjaFN0YXRlLnBsYXlpbmcgJiYgIWRhbmdHdWlMZW5oKSB7XG4gICAgICAgICAgICAgICAgZ3VpTGVuaCgncGxheScsIHZpZGVvUmVmLmN1cnJlbnQ/LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICghY2FuQ29udHJvbCAmJiAhaXNQcm9ncmFtbWF0aWNBY3Rpb25SZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICAgIHNldFZpZXdlcklzUGF1c2VkKGZhbHNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uUGF1c2U9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGNhbkNvbnRyb2wgJiYgd2F0Y2hTdGF0ZS5wbGF5aW5nICYmICFkYW5nR3VpTGVuaCkge1xuICAgICAgICAgICAgICAgIGd1aUxlbmgoJ3BhdXNlJywgdmlkZW9SZWYuY3VycmVudD8uY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFjYW5Db250cm9sICYmICFpc1Byb2dyYW1tYXRpY0FjdGlvblJlZi5jdXJyZW50ICYmIHdhdGNoU3RhdGVSZWYuY3VycmVudC5wbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgaXNMaXZlV2l0aEhvc3RSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHNldElzTGl2ZVdpdGhIb3N0KGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZXRWaWV3ZXJJc1BhdXNlZCh0cnVlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uRW5kZWQ9eygpID0+IHtcbiAgICAgICAgICAgICAgaGFuZGxlVmlkZW9FbmRlZCgpO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uU2Vla2VkPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChpc1Byb2dyYW1tYXRpY0FjdGlvblJlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICAgICAgICAgIGlmIChjYW5Db250cm9sKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRhbmdHdWlMZW5oIHx8IGlzU2Vla2luZ1JlZi5jdXJyZW50KSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgY3VyID0gdmlkZW9SZWYuY3VycmVudD8uY3VycmVudFRpbWU7XG4gICAgICAgICAgICAgICAgaWYgKGN1ciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgLy8gQ2hcdTFFRDFuZyB2XHUwMEYybmcgbFx1MUVCN3A6IG1cdTFFQ0RpIGdcdTAwRTFuIGN1cnJlbnRUaW1lIG5cdTFFRDlpIGJcdTFFRDkgKG9wdGltaXN0aWMgc2VlaywgZHJpZnQtY29ycmVjdGlvblxuICAgICAgICAgICAgICAgIC8vIGNcdTFFRTdhIGFwRHVuZ0RvbmdCbykgXHUwMTExXHUxRUMxdSBiXHUxRUFGbiAnc2Vla2VkJy4gQ2hcdTFFQzkgZ1x1MUVFRGkgbFx1MUVDN25oIGtoaSB2XHUxRUNCIHRyXHUwMEVEIGxcdTFFQzdjaCBraFx1MUVDRmlcbiAgICAgICAgICAgICAgICAvLyB2XHUxRUNCIHRyXHUwMEVEIHNlcnZlciBrXHUxRUYzIHZcdTFFQ0RuZyA+MS41cyBcdTIwMTQgdFx1MUVFOWMgbmdcdTAxQjBcdTFFRERpIGRcdTAwRjluZyB0aFx1MUVBRHQgc1x1MUVGMSB0dWEgcXVhIHRoYW5oIGNvbnRyb2xzLlxuICAgICAgICAgICAgICAgIGNvbnN0IHN0ID0gd2F0Y2hTdGF0ZTtcbiAgICAgICAgICAgICAgICBjb25zdCB1cGRNcyA9IHN0Py51cGRhdGVkQXQgPyBuZXcgRGF0ZShTdHJpbmcoc3QudXBkYXRlZEF0KS5yZXBsYWNlKCcgJywgJ1QnKSArIChTdHJpbmcoc3QudXBkYXRlZEF0KS5pbmNsdWRlcygnVCcpID8gJycgOiAnWicpKS5nZXRUaW1lKCkgOiBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVsYXBzZWQgPSBNYXRoLm1heCgwLCAoRGF0ZS5ub3coKSAtIHVwZE1zKSAvIDEwMDApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGt5Vm9uZyA9IHN0Py5wbGF5aW5nXG4gICAgICAgICAgICAgICAgICA/IE51bWJlcihzdC5iYXNlUG9zaXRpb25TZWNvbmRzIHx8IDApICsgZWxhcHNlZCAqIChzdC5wbGF5YmFja1JhdGUgfHwgMSlcbiAgICAgICAgICAgICAgICAgIDogTnVtYmVyKHN0Py5wb3NpdGlvblNlY29uZHMgfHwgMCk7XG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGN1ciAtIGt5Vm9uZykgPiAxLjUpIGd1aUxlbmgoJ3NlZWsnLCBjdXIpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1ciA9IHZpZGVvUmVmLmN1cnJlbnQ/LmN1cnJlbnRUaW1lIHx8IDA7XG4gICAgICAgICAgICAgICAgc2V0TG9jYWxUaW1lKE1hdGguZmxvb3IoY3VyKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaG9zdFBvcyA9IGdldEhvc3RDdXJyZW50UG9zKCk7XG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGN1ciAtIGhvc3RQb3MpID4gMy4wKSB7XG4gICAgICAgICAgICAgICAgICBpc0xpdmVXaXRoSG9zdFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBzZXRJc0xpdmVXaXRoSG9zdChmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9fVxuICAgICAgICAgIC8+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBoLWZ1bGwgdGV4dC14cyB0ZXh0LXNsYXRlLTUwMCBwLTYgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtMnhsIG1iLTJcIj5cdTI2QTBcdUZFMEY8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj5MaW5rIHZpZGVvIGtoXHUwMEY0bmcgaFx1MUVENyB0clx1MUVFMyBwaFx1MDBFMXQgdHJcdTFFRjFjIHRpXHUxRUJGcCBob1x1MUVCN2Mga2hcdTAwRjRuZyBoXHUxRUUzcCBsXHUxRUM3Ljwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogVGhcdTAwRjRuZyBiXHUwMEUxbyByaVx1MDBFQW5nIGNobyBHb29nbGUgRHJpdmUgKi99XG4gICAgICB7ZHJ2SWQgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMuNSBweS0yIGJnLWFtYmVyLTUwMC8xMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8yMCByb3VuZGVkLXhsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgdGV4dC1hbWJlci0zMDBcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtXCI+XHUyMTM5XHVGRTBGPC9zcGFuPlxuICAgICAgICAgIDxzcGFuPkdvb2dsZSBEcml2ZSBwaFx1MDBFMXQgXHUxRURGIGNoXHUxRUJGIFx1MDExMVx1MUVEOSA8c3Ryb25nPlhlbSBcdTAxMTFcdTFFRDljIGxcdTFFQURwPC9zdHJvbmc+IChHb29nbGUgRHJpdmUga2hcdTAwRjRuZyBoXHUxRUQ3IHRyXHUxRUUzIEFQSSBcdTAxMTFpXHUxRUMxdSBraGlcdTFFQzNuIHRcdTFFRUIgeGEpLjwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogVGhhbmggXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbiBIb3N0ICYgTmdcdTAxQjBcdTFFRERpIHhlbSBcdTIwMTQgXHUxRUE5biBraGkgZnVsbHNjcmVlbiAqL31cbiAgICAgIHshaXNSb29tV2lkZSAmJiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLWdyYWRpZW50LXRvLWIgZnJvbS1bIzE2MWIyNl0gdG8tWyMwZjE0MWRdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzEwIHJvdW5kZWQtMnhsIHAtMyBzbTpwLTMuNSBmbGV4IGZsZXgtY29sIGdhcC0zIHNoYWRvdy14bFwiPlxuXG4gICAgICAgIHsvKiBUaGFuaCBjXHUwMEY0bmcgY1x1MUVFNSBwaFx1MDBFMXQgY2h1bmcgKGNobyBIb3N0IC8gVGVhY2hlciBraGkgZFx1MDBGOW5nIHByb3ZpZGVyIGNcdTAwRjMgdGhcdTFFQzMgXHUwMTExaVx1MUVDMXUga2hpXHUxRUMzbikgKi99XG4gICAgICAgIHtjYW5Db250cm9sICYmIChwcm92aWRlciA9PT0gJ05BVElWRV9IVE1MNScgfHwgcHJvdmlkZXIgPT09ICdZT1VUVUJFJykgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBpdGVtcy1jZW50ZXIgZ2FwLTMgcHQtMiBib3JkZXItdCBib3JkZXItd2hpdGUvMTBcIj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJidG4taG9zdC13YXRjaC10b2dnbGVcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlSG9zdFRvZ2dsZVBsYXl9XG4gICAgICAgICAgICAgIGRpc2FibGVkPXtkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIHNtOnctYXV0byBweC00IHB5LTIgcm91bmRlZC14bCBmb250LWJsYWNrIHRleHQteHMgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEuNSBzaGFkb3ctbWQgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyIGRpc2FibGVkOm9wYWNpdHktNTAgJHtcbiAgICAgICAgICAgICAgICB3YXRjaFN0YXRlLnBsYXlpbmdcbiAgICAgICAgICAgICAgICAgID8gJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC80MCBob3ZlcjpiZy1hbWJlci01MDAvMzAgc2hhZG93LVswXzBfMTJweF9yZ2JhKDI0NSwxNTgsMTEsMC4yNSldJ1xuICAgICAgICAgICAgICAgICAgOiAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzAwYzZmZl0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBob3ZlcjpicmlnaHRuZXNzLTExMCdcbiAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICA8c3Bhbj57d2F0Y2hTdGF0ZS5wbGF5aW5nID8gJ1x1MjNGOCcgOiAnXHUyNUI2J308L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgIHt3YXRjaFN0YXRlLnBsYXlpbmdcbiAgICAgICAgICAgICAgICAgID8gJ1RcdTFFQTFtIERcdTFFRUJuZyBDXHUxRUEzIFBoXHUwMEYybmcnXG4gICAgICAgICAgICAgICAgICA6ICgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAobWF4RHVyID4gMCAmJiBsb2NhbFRpbWUgPj0gbWF4RHVyIC0gMS41KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1BoXHUwMEUxdCBMXHUxRUExaSBDXHUxRUEzIFBoXHUwMEYybmcnO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1BoXHUwMEUxdCBDaHVuZyBDXHUxRUEzIFBoXHUwMEYybmcnO1xuICAgICAgICAgICAgICAgICAgICB9KSgpfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSB3LWZ1bGxcIj5cbiAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJob3N0LWR1cmF0aW9uLWxhYmVsXCIgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1tb25vIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAge2RpbmhEYW5nR2lheVBodXQobG9jYWxUaW1lKX1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICBpZD1cImhvc3Qtc2Vlay1zbGlkZXJcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJyYW5nZVwiXG4gICAgICAgICAgICAgICAgbWluPVwiMFwiXG4gICAgICAgICAgICAgICAgbWF4PXtkdXJhdGlvbiA+IDAgPyBkdXJhdGlvbiA6IChkdXJhdGlvblJlZi5jdXJyZW50ID4gMCA/IGR1cmF0aW9uUmVmLmN1cnJlbnQgOiBNYXRoLm1heChsb2NhbFRpbWUsIDMwMCkpfVxuICAgICAgICAgICAgICAgIHN0ZXA9XCIxXCJcbiAgICAgICAgICAgICAgICB2YWx1ZT17bG9jYWxUaW1lfVxuICAgICAgICAgICAgICAgIG9uTW91c2VEb3duPXsoKSA9PiB7IGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICBvblRvdWNoU3RhcnQ9eygpID0+IHsgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldExvY2FsVGltZShOdW1iZXIoZS50YXJnZXQudmFsdWUpKX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlVXA9e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGhhc1RyaWdnZXJlZFNraXBSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgZ3VpTGVuaCgnc2VlaycsIE51bWJlcihlLnRhcmdldC52YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgb25Ub3VjaEVuZD17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBpc1NlZWtpbmdSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgaGFzVHJpZ2dlcmVkU2tpcFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBndWlMZW5oKCdzZWVrJywgTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgaC0xLjUgYmctd2hpdGUvMTAgcm91bmRlZC1sZyBhcHBlYXJhbmNlLW5vbmUgY3Vyc29yLXBvaW50ZXIgYWNjZW50LVsjMDBGMkZFXVwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIHtkdXJhdGlvbiA+IDAgPyBkaW5oRGFuZ0dpYXlQaHV0KGR1cmF0aW9uKSA6IChkdXJhdGlvblJlZi5jdXJyZW50ID4gMCA/IGRpbmhEYW5nR2lheVBodXQoZHVyYXRpb25SZWYuY3VycmVudCkgOiAnLS06LS0nKX1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFRoYW5oIGNcdTAwRjRuZyBjXHUxRUU1IGNobyBOZ1x1MDFCMFx1MUVERGkgdGhhbSBnaWEgKHRcdTFFQTFtIGRcdTFFRUJuZyByaVx1MDBFQW5nLCB0aW1lbGluZSByaVx1MDBFQW5nICYgblx1MDBGQXQgdHJcdTFFRjFjIHRpXHUxRUJGcCB0aGVvIGNoXHUxRUU3IHBoXHUwMEYybmcpICovfVxuICAgICAgICB7IWNhbkNvbnRyb2wgJiYgKHByb3ZpZGVyID09PSAnTkFUSVZFX0hUTUw1JyB8fCBwcm92aWRlciA9PT0gJ1lPVVRVQkUnKSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGl0ZW1zLWNlbnRlciBnYXAtMyBwdC0yIGJvcmRlci10IGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB3LWZ1bGwgc206dy1hdXRvXCI+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi12aWV3ZXItd2F0Y2gtdG9nZ2xlXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVWaWV3ZXJUb2dnbGVQbGF5fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBzbTp3LWF1dG8gcHgtNCBweS0yIHJvdW5kZWQteGwgZm9udC1ibGFjayB0ZXh0LXhzIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xLjUgc2hhZG93LW1kIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlciAke1xuICAgICAgICAgICAgICAgICAgdmlld2VySXNQYXVzZWRcbiAgICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMCwyNDIsMjU0LDAuMzUpXSBob3ZlcjpicmlnaHRuZXNzLTExMCdcbiAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvMTAgdGV4dC13aGl0ZSBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IGhvdmVyOmJnLXdoaXRlLzE1J1xuICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dmlld2VySXNQYXVzZWQgPyAnXHUyNUI2JyA6ICdcdTIzRjgnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICAgIHt2aWV3ZXJJc1BhdXNlZFxuICAgICAgICAgICAgICAgICAgICA/ICgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXhEdXIgPSBkdXJhdGlvblJlZi5jdXJyZW50IHx8IGR1cmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1heER1ciA+IDAgJiYgbG9jYWxUaW1lID49IG1heER1ciAtIDEuNSkgcmV0dXJuICdQaFx1MDBFMXQgTFx1MUVBMWkgVmlkZW8nO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdUaVx1MUVCRnAgVFx1MUVFNWMgWGVtJztcbiAgICAgICAgICAgICAgICAgICAgICB9KSgpXG4gICAgICAgICAgICAgICAgICAgIDogJ1RcdTFFQTFtIERcdTFFRUJuZyBWaWRlbyd9XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tdmlld2VyLWdvLWxpdmUtYmFyXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVHb0xpdmV9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIHNtOnctYXV0byBweC00IHB5LTIgcm91bmRlZC14bCBmb250LWJsYWNrIHRleHQteHMgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEuNSBzaGFkb3ctbWQgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyICR7XG4gICAgICAgICAgICAgICAgICBpc0xpdmVXaXRoSG9zdFxuICAgICAgICAgICAgICAgICAgICA/ICdiZy1yb3NlLTUwMC8xNSB0ZXh0LXJvc2UtNDAwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMzAnXG4gICAgICAgICAgICAgICAgICAgIDogJ2JnLWdyYWRpZW50LXRvLXIgZnJvbS1yb3NlLTYwMCB0by1yZWQtNjAwIHRleHQtd2hpdGUgc2hhZG93LVswXzBfMTVweF9yZ2JhKDI0NCw2Myw5NCwwLjUpXSBhbmltYXRlLXB1bHNlIGhvdmVyOmJyaWdodG5lc3MtMTEwJ1xuICAgICAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgICAgIHRpdGxlPXtpc0xpdmVXaXRoSG9zdCA/ICdcdTAxMTBhbmcgeGVtIHRyXHUxRUYxYyB0aVx1MUVCRnAgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSB2XHUxRURCaSBjaFx1MUVFNyBwaFx1MDBGMm5nJyA6ICdCXHUxRUE1bSBcdTAxMTFcdTFFQzMgbmhcdTFFQTN5IHRcdTFFREJpIHZpZGVvIFx1MDExMWFuZyBjaFx1MUVBMXkgY1x1MUVFN2EgY2hcdTFFRTcgcGhcdTAwRjJuZyd9PlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHctMiBoLTIgcm91bmRlZC1mdWxsICR7aXNMaXZlV2l0aEhvc3QgPyAnYmctcm9zZS01MDAgYW5pbWF0ZS1wdWxzZScgOiAnYmctd2hpdGUnfWB9IC8+XG4gICAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgICB7aXNMaXZlV2l0aEhvc3RcbiAgICAgICAgICAgICAgICAgICAgPyAnVHJcdTFFRjFjIFRpXHUxRUJGcCdcbiAgICAgICAgICAgICAgICAgICAgOiAoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF3YXRjaFN0YXRlLnBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdUclx1MUVGMWMgVGlcdTFFQkZwIChDaFx1MUVFNyBwaFx1MDBGMm5nIHRcdTFFQTFtIGRcdTFFRUJuZyknO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF4RHVyID0gZHVyYXRpb25SZWYuY3VycmVudCB8fCBkdXJhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhQb3MgPSBnZXRIb3N0Q3VycmVudFBvcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1heER1ciA+IDAgJiYgaFBvcyA+PSBtYXhEdXIgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnVHJcdTFFRjFjIFRpXHUxRUJGcCAoSFx1MUVCRnQgdmlkZW8pJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBNYXRoLnJvdW5kKGhQb3MgLSBsb2NhbFRpbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQgPiAyID8gYFRyXHUxRUYxYyBUaVx1MUVCRnAgKENoXHUxRUFEbSAke2QgPiA2MCA/IGRpbmhEYW5nR2lheVBodXQoZCkgOiBkICsgJ3MnfSlgIDogJ1ZcdTAwRTBvIFRyXHUxRUYxYyBUaVx1MUVCRnAnO1xuICAgICAgICAgICAgICAgICAgICAgIH0pKCl9XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41IHctZnVsbFwiPlxuICAgICAgICAgICAgICA8c3BhbiBpZD1cInZpZXdlci1kdXJhdGlvbi1sYWJlbFwiIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtbW9ubyB0ZXh0LXNsYXRlLTQwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIHtkaW5oRGFuZ0dpYXlQaHV0KGxvY2FsVGltZSl9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgaWQ9XCJ2aWV3ZXItc2Vlay1zbGlkZXJcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJyYW5nZVwiXG4gICAgICAgICAgICAgICAgbWluPVwiMFwiXG4gICAgICAgICAgICAgICAgbWF4PXtkdXJhdGlvbiA+IDAgPyBkdXJhdGlvbiA6IChkdXJhdGlvblJlZi5jdXJyZW50ID4gMCA/IGR1cmF0aW9uUmVmLmN1cnJlbnQgOiBNYXRoLm1heChsb2NhbFRpbWUsIDMwMCkpfVxuICAgICAgICAgICAgICAgIHN0ZXA9XCIxXCJcbiAgICAgICAgICAgICAgICB2YWx1ZT17bG9jYWxUaW1lfVxuICAgICAgICAgICAgICAgIG9uTW91c2VEb3duPXsoKSA9PiB7IGlzU2Vla2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTsgfX1cbiAgICAgICAgICAgICAgICBvblRvdWNoU3RhcnQ9eygpID0+IHsgaXNTZWVraW5nUmVmLmN1cnJlbnQgPSB0cnVlOyB9fVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldExvY2FsVGltZShOdW1iZXIoZS50YXJnZXQudmFsdWUpKX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlVXA9e2UgPT4gaGFuZGxlVmlld2VyU2VlayhOdW1iZXIoZS50YXJnZXQudmFsdWUpKX1cbiAgICAgICAgICAgICAgICBvblRvdWNoRW5kPXtlID0+IGhhbmRsZVZpZXdlclNlZWsoTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIGgtMS41IGJnLXdoaXRlLzEwIHJvdW5kZWQtbGcgYXBwZWFyYW5jZS1ub25lIGN1cnNvci1wb2ludGVyIGFjY2VudC1bIzAwRjJGRV1cIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICB7ZHVyYXRpb24gPiAwID8gZGluaERhbmdHaWF5UGh1dChkdXJhdGlvbikgOiAoZHVyYXRpb25SZWYuY3VycmVudCA+IDAgPyBkaW5oRGFuZ0dpYXlQaHV0KGR1cmF0aW9uUmVmLmN1cnJlbnQpIDogJy0tOi0tJyl9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHtsb2kgJiYgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXJvc2UtNDAwXCI+e2xvaX08L3A+fVxuICAgICAgICB7cGhvbmcubW9UYSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCBsZWFkaW5nLXJlbGF4ZWQgcHQtMVwiPntwaG9uZy5tb1RhfTwvcD59XG5cbiAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIFx1MjUwMFx1MjUwMFx1MjUwMCBWXHUwMEQ5TkcgMTogVFJVTkcgVFx1MDBDMk0gQ1x1MUVBNFUgSFx1MDBDQ05IIFZJREVPICYgSFx1MDBDME5HIFx1MDExMFx1MUVFMkkgWU9VVFVCRSBUUlx1MUVGMEMgVElcdTFFQkVQIFx1MjUwMFx1MjUwMFx1MjUwMCAqL31cbiAgICAgIHshaXNSb29tV2lkZSAmJiAoXG4gICAgICAgIDxkaXYgaWQ9XCJ2dW5nMS15b3V0dWJlLXN0dWRpb1wiIHN0eWxlPXt7IG92ZXJmbG93QW5jaG9yOiAnbm9uZScgfX0gY2xhc3NOYW1lPVwiYmctZ3JhZGllbnQtdG8tYiBmcm9tLVsjMTYxYjI2XSB0by1bIzBmMTQxZF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTMuNSBzbTpwLTQgZmxleCBmbGV4LWNvbCBnYXAtMyBzaGFkb3cteGxcIj5cbiAgICAgICAgICB7LyogSGVhZGVyIHRydW5nIHRcdTAwRTJtICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIHBiLTIuNSBib3JkZXItYiBib3JkZXItd2hpdGUvMTAgZmxleC13cmFwXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInctOCBoLTggcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1iciBmcm9tLVsjMDBGMkZFXS8yMCB0by12aW9sZXQtNTAwLzIwIHRleHQtWyMwMEYyRkVdIGJvcmRlciBib3JkZXItWyMwMEYyRkVdLzMwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtc20gc2hhZG93LVswXzBfMTJweF9yZ2JhKDAsMjQyLDI1NCwwLjI1KV1cIj5cbiAgICAgICAgICAgICAgICBcdUQ4M0NcdURGQUNcbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHNtOnRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPkNcdTFFQTV1IGhcdTAwRUNuaCBWaWRlbyAmIEhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIFlvdVR1YmU8L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTEuNSBweS0wLjUgcm91bmRlZC1mdWxsIGJnLVsjMDBGMkZFXS8xNSB0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RofSBcdTAxMTFhbmcgY2hcdTFFRERcbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwXCI+VFx1MDBFQ20ga2lcdTFFQkZtIHZpZGVvLCBcdTAxMTFcdTAxQjBhIHZcdTAwRTBvIGhcdTAwRTBuZyBjaFx1MUVERCB2XHUwMEUwIGNoXHUxRUExeSB2aWRlbyBraFx1MDBFMWMgXHUwMTExXHUxRUQzbmcgYlx1MUVEOSBjXHUxRUEzIHBoXHUwMEYybmc8L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICB7LyogVGFiIHNlbGVjdG9yICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGJnLVsjMEIwRTE0XSBwLTEgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi1tZWRpYS10YWItc2VhcmNoXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgZ2l1Tmd1eWVuVmlUcmlDdW9uKCgpID0+IHNldE1lZGlhVGFiKCdzZWFyY2gnKSk7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgJHtcbiAgICAgICAgICAgICAgICAgICAgbWVkaWFUYWIgPT09ICdzZWFyY2gnXG4gICAgICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzM4YmRmOF0gdGV4dC1ibGFjayBzaGFkb3ctbWQnXG4gICAgICAgICAgICAgICAgICAgICAgOiAndGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPlRcdTAwRUNtIFlvdVR1YmU8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBpZD1cImJ0bi1tZWRpYS10YWItcXVldWVcIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBnaXVOZ3V5ZW5WaVRyaUN1b24oKCkgPT4gc2V0TWVkaWFUYWIoJ3F1ZXVlJykpO1xuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMS41IHJvdW5kZWQtbGcgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgY3Vyc29yLXBvaW50ZXIgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgICAgICAgIG1lZGlhVGFiID09PSAncXVldWUnXG4gICAgICAgICAgICAgICAgICAgICAgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLXZpb2xldC01MDAgdG8tZnVjaHNpYS01MDAgdGV4dC13aGl0ZSBzaGFkb3ctbWQnXG4gICAgICAgICAgICAgICAgICAgICAgOiAndGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENDQjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPkhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpICh7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAncXVldWVkJykubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBUb2dnbGUgdGh1IGdcdTFFQ0RuICovfVxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgaWQ9XCJidG4tdG9nZ2xlLXN0dWRpb1wiXG4gICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICBnaXVOZ3V5ZW5WaVRyaUN1b24oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXREYU1vUm9uZ1N0dWRpbyhwcmV2ID0+ICFwcmV2KTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgdGl0bGU9e2RhTW9Sb25nU3R1ZGlvID8gJ1RodSBnXHUxRUNEbicgOiAnTVx1MUVERiByXHUxRUQ5bmcnfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctOCBoLTggcm91bmRlZC14bCBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgIHtkYU1vUm9uZ1N0dWRpbyA/ICdcdTI1QjInIDogJ1x1MjVCQyd9XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7LyogVG9hc3QgdGhcdTAwRjRuZyBiXHUwMEUxbyAvIExcdTFFRDdpICovfVxuICAgICAgICAgIHt0aG9uZ0Jhb1ZpZGVvICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMyBweS0yIHJvdW5kZWQteGwgYmctZW1lcmFsZC01MDAvMTUgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LWVtZXJhbGQtMzAwIHRleHQteHMgZm9udC1ib2xkIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGFuaW1hdGUtZmFkZUluXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlx1MjcyODwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+e3Rob25nQmFvVmlkZW99PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgICB7bG9pVmlkZW8gJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC0zIHB5LTIgcm91bmRlZC14bCBiZy1yb3NlLTUwMC8xNSBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRleHQtcm9zZS0zMDAgdGV4dC14cyBmb250LWJvbGQgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgYW5pbWF0ZS1mYWRlSW5cIj5cbiAgICAgICAgICAgICAgPHNwYW4+XHUyNkEwXHVGRTBGPC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj57bG9pVmlkZW99PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cblxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMCBlYXNlLWluLW91dCBvdmVyZmxvdy1oaWRkZW4gZmxleCBmbGV4LWNvbCBtaW4taC0wICR7XG4gICAgICAgICAgICAgIGRhTW9Sb25nU3R1ZGlvID8gJ21heC1oLVszODBweF0gb3BhY2l0eS0xMDAnIDogJ21heC1oLTAgb3BhY2l0eS0wIHBvaW50ZXItZXZlbnRzLW5vbmUnXG4gICAgICAgICAgICB9YH1cbiAgICAgICAgICAgIHN0eWxlPXt7IG92ZXJmbG93QW5jaG9yOiAnbm9uZScgfX0+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtWzM0MHB4XSBmbGV4IGZsZXgtY29sIG1pbi1oLTAgb3ZlcmZsb3ctaGlkZGVuIHNocmluay0wXCI+XG4gICAgICAgICAgICAgIHsvKiBUQUIgMTogVFx1MDBDQ00gS0lcdTFFQkVNIFlPVVRVQkUgJiBcdTAxMTBcdTFFRDRJIFZJREVPICovfVxuICAgICAgICAgICAgICB7bWVkaWFUYWIgPT09ICdzZWFyY2gnICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtZnVsbCBmbGV4IGZsZXgtY29sIGdhcC0yLjUgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgey8qIFx1MDBENCB0XHUwMEVDbSBraVx1MUVCRm0gLyBkXHUwMEUxbiBsaW5rIFx1MDExMWEgblx1MDEwM25nICovfVxuICAgICAgICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9eyhlKSA9PiB0aW1LaWVtWW91VHViZShlKX0gY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtMiBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBmbGV4LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFic29sdXRlIGxlZnQtMyB0b3AtMS8yIC10cmFuc2xhdGUteS0xLzIgdGV4dC1zbGF0ZS00MDAgdGV4dC14c1wiPlx1RDgzRFx1REQwRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImlucHV0LXZ1bmcxLXlvdXR1YmUtc2VhcmNoXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17eXRRdWVyeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0WXRRdWVyeShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiTmhcdTFFQURwIHRcdTFFRUIga2hcdTAwRjNhIHRcdTAwRUNtIGtpXHUxRUJGbSBZb3VUdWJlICh2ZDogbG9maSBoXHUxRUNEYyBiXHUwMEUwaS4uLikgaG9cdTFFQjdjIGRcdTAwRTFuIGxpbmsgdmlkZW8uLi5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyMwQjBFMTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgZm9jdXM6Ym9yZGVyLVsjMDBGMkZFXS82MCByb3VuZGVkLXhsIHBsLTggcHItMyBweS0yIHRleHQteHMgdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIHRyYW5zaXRpb24tYWxsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS10aW0ta2llbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXl0UXVlcnkudHJpbSgpIHx8IHNlYXJjaGluZ1l0fVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMy41IHB5LTIgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjMzhiZGY4XSB0ZXh0LWJsYWNrIGZvbnQtYmxhY2sgdGV4dC14cyBob3ZlcjpicmlnaHRuZXNzLTExMCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgc2hhZG93LW1kIGRpc2FibGVkOm9wYWNpdHktNDAgd2hpdGVzcGFjZS1ub3dyYXAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3NlYXJjaGluZ1l0ID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFuaW1hdGUtc3BpblwiPlx1MjNGMzwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTAxMTBhbmcgdFx1MDBFQ20uLi48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdUREMEQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+VFx1MDBFQ20ga2lcdTFFQkZtPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIHsvKiBBY3Rpb24gYnV0dG9ucyBwaFx1MUVFNSBraGkgXHUwMEY0IGlucHV0IGxcdTAwRTAgMSBsaW5rIHZpZGVvIHRyXHUxRUYxYyB0aVx1MUVCRnAgKi99XG4gICAgICAgICAgICAgICAgICAgIHtCb29sZWFuKHl0UXVlcnkudHJpbSgpLnN0YXJ0c1dpdGgoJ2h0dHA6Ly8nKSB8fCB5dFF1ZXJ5LnRyaW0oKS5zdGFydHNXaXRoKCdodHRwczovLycpIHx8IHl0UXVlcnkuaW5jbHVkZXMoJ3lvdXR1JykpICYmIChcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHAtMiByb3VuZGVkLXhsIGJnLVsjMEIwRTE0XS84MCBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS8yMCBmbGV4LXdyYXAgYW5pbWF0ZS1mYWRlSW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQxNzwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+UGhcdTAwRTF0IGhpXHUxRUM3biBsaVx1MDBFQW4ga1x1MUVCRnQgdmlkZW86PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2NhbkNvbnRyb2wgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImJ0bi12dW5nMS1waGF0LW5nYXktbGlua1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBkb2lWaWRlbyh5dFF1ZXJ5LnRyaW0oKSwgJ1ZpZGVvIHRcdTFFRUIgbGlcdTAwRUFuIGtcdTFFQkZ0Jyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0RvaVZpZGVvfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy1bIzAwRjJGRV0gdGV4dC1ibGFjayB0ZXh0LXhzIGZvbnQtYmxhY2sgaG92ZXI6YmctWyMwMGUxZWNdIGFjdGl2ZTpzY2FsZS05NSBzaGFkb3ctc21cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNiBQaFx1MDBFMXQgbmdheSBjXHUxRUEzIHBoXHUwMEYybmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLWVucXVldWUtbGlua1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdlbnF1ZXVlJywgeyB2aWRlb1VybDogeXRRdWVyeS50cmltKCksIHRpdGxlOiAnVmlkZW8gdFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQnIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctZW1lcmFsZC01MDAvMjAgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLWVtZXJhbGQtNTAwLzMwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFRoXHUwMEVBbSB2XHUwMEUwbyBjdVx1MUVEMWkgaFx1MDBFMG5nIFx1MDExMVx1MUVFM2lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLWFkZC1uZXh0LWxpbmtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnYWRkX25leHQnLCB7IHZpZGVvVXJsOiB5dFF1ZXJ5LnRyaW0oKSwgdGl0bGU6ICdWaWRlbyB0XHUxRUVCIGxpXHUwMEVBbiBrXHUxRUJGdCcgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy12aW9sZXQtNTAwLzIwIHRleHQtdmlvbGV0LTMwMCBib3JkZXIgYm9yZGVyLXZpb2xldC01MDAvMzAgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6YmctdmlvbGV0LTUwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBQaFx1MDBFMXQga1x1MUVCRiB0aVx1MUVCRnBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtc3VnZ2VzdC1saW5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdzdWdnZXN0JywgeyB2aWRlb1VybDogeXRRdWVyeS50cmltKCksIHRpdGxlOiAnVmlkZW8gdFx1MUVFQiBsaVx1MDBFQW4ga1x1MUVCRnQnIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgcm91bmRlZC1sZyBiZy1ncmFkaWVudC10by1yIGZyb20tYW1iZXItNDAwIHRvLWFtYmVyLTUwMCB0ZXh0LWJsYWNrIHRleHQteHMgZm9udC1ibGFjayBob3ZlcjpicmlnaHRuZXNzLTExMCBhY3RpdmU6c2NhbGUtOTUgc2hhZG93LXNtIGN1cnNvci1wb2ludGVyIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDQTE8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHUwMTEwXHUxRUMxIHh1XHUxRUE1dCBjaG8gY2hcdTFFRTcgcGhcdTAwRjJuZzwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9mb3JtPlxuXG4gICAgICAgICAgICAgICAgICB7LyogVHJcdTFFQTFuZyB0aFx1MDBFMWkgbFx1MUVEN2kgdFx1MDBFQ20ga2lcdTFFQkZtICovfVxuICAgICAgICAgICAgICAgICAge3NlYXJjaExvaSAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC0yLjUgcm91bmRlZC14bCBiZy1hbWJlci01MDAvMTAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgdGV4dC14cyBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTI2QTBcdUZFMEYge3NlYXJjaExvaX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2VhcmNoTG9pKCcnKX0gY2xhc3NOYW1lPVwidGV4dC1hbWJlci00MDAgZm9udC1ib2xkIGhvdmVyOnVuZGVybGluZVwiPlx1MDExMFx1MDBGM25nPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgey8qIEtcdTFFQkZ0IHF1XHUxRUEzIHRcdTAwRUNtIGtpXHUxRUJGbSBZb3VUdWJlICovfVxuICAgICAgICAgICAgICAgICAge3l0UmVzdWx0cy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIGdhcC0xLjUgbWluLWgtMCBvdmVyZmxvdy1oaWRkZW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdUQ4M0RcdURDRkE8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPktcdTFFQkZ0IHF1XHUxRUEzIFlvdVR1YmUgKHt5dFJlc3VsdHMubGVuZ3RofSB2aWRlbyk6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tdnVuZzEtZG9uZy1rZXQtcXVhXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRZdFJlc3VsdHMoW10pOyBzZXRTZWFyY2hMb2koJycpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yIHB5LTAuNSByb3VuZGVkLW1kIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LVsxMHB4XSBmb250LWJvbGQgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHUyNzE1IFx1MDExMFx1MDBGM25nIGtcdTFFQkZ0IHF1XHUxRUEzXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIHNwYWNlLXktMiBvdmVyZmxvdy15LWF1dG8gcHItMSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7eXRSZXN1bHRzLm1hcCgoaXRlbSwgaWR4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZVcmwgPSBgaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj0ke2l0ZW0udmlkZW9JZH1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17aXRlbS52aWRlb0lkIHx8IGlkeH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImdyb3VwIGJnLVsjMEIwRTE0XSBob3ZlcjpiZy1bIzEyMTcyMV0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBob3Zlcjpib3JkZXItWyMwMEYyRkVdLzMwIHJvdW5kZWQteGwgcC0yLjUgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBUaHVtYm5haWwgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIHctMjQgc206dy0yOCBhc3BlY3QtdmlkZW8gcm91bmRlZC1sZyBvdmVyZmxvdy1oaWRkZW4gYmctYmxhY2sgc2hyaW5rLTAgYm9yZGVyIGJvcmRlci13aGl0ZS81XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmM9e2l0ZW0udGh1bWJuYWlsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsdD17aXRlbS50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBncm91cC1ob3ZlcjpzY2FsZS0xMDUgdHJhbnNpdGlvbi10cmFuc2Zvcm1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRpbmc9XCJsYXp5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYWJzb2x1dGUgYm90dG9tLTEgcmlnaHQtMSBiZy1ibGFjay84MCBweC0xIHB5LTAuMiByb3VuZGVkIHRleHQtWzlweF0gZm9udC1tb25vIHRleHQtd2hpdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBZb3VUdWJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogVGhcdTAwRjRuZyB0aW4gdmlkZW8gKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoNSBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTIwMCBsaW5lLWNsYW1wLTIgZ3JvdXAtaG92ZXI6dGV4dC1bIzAwRjJGRV0gdHJhbnNpdGlvbi1jb2xvcnNcIiB0aXRsZT17aXRlbS50aXRsZX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2l0ZW0udGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvaDU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbXQtMSB0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPntpdGVtLmNoYW5uZWxUaXRsZSB8fCAnS1x1MDBFQW5oIFlvdVR1YmUnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXRlbS5wdWJsaXNoZWRBdCAmJiA8c3Bhbj5cdTIwMjIge2l0ZW0ucHVibGlzaGVkQXR9PC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIEJcdTFFRDkgblx1MDBGQXQgdGhhbyB0XHUwMEUxYzogQ2hcdTFFRTcgcGhcdTAwRjJuZyBjXHUwMEYzIDMgcXV5XHUxRUMxbiBwaFx1MDBFMXQvY2hcdTFFREQva1x1MUVCRiB0aVx1MUVCRnA7IE5nXHUwMUIwXHUxRUREaSB0aGFtIGdpYSBjaFx1MUVDOSBcdTAxMTFcdTAxQjBcdTFFRTNjIFx1MDExMVx1MUVDMSB4dVx1MUVBNXQgY2hvIGNoXHUxRUU3IHBoXHUwMEYybmcgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgaXRlbXMtY2VudGVyIGdhcC0xLjUgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2NhbkNvbnRyb2wgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ2hcdTFFQTF5IHZpZGVvIG5cdTAwRTB5IG5nYXkgbFx1MUVBRHAgdFx1MUVFOWMgY2hvIGNcdTFFQTMgcGhcdTAwRjJuZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGRvaVZpZGVvKHZVcmwsIGl0ZW0udGl0bGUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0RvaVZpZGVvfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMS41IHJvdW5kZWQtbGcgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDBGMkZFXSB0by1bIzAwYzZmZl0gdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQtWzExcHhdIHNoYWRvdy1zbSBob3ZlcjpicmlnaHRuZXNzLTExMCBhY3RpdmU6c2NhbGUtOTUgZGlzYWJsZWQ6b3BhY2l0eS00MCB3aGl0ZXNwYWNlLW5vd3JhcCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYgUGhcdTAwRTF0IG5nYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJUaFx1MDBFQW0gdlx1MDBFMG8gY3VcdTFFRDFpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnZW5xdWV1ZScsIHsgdmlkZW9Vcmw6IHZVcmwsIHRpdGxlOiBpdGVtLnRpdGxlLCB0aHVtYjogaXRlbS50aHVtYm5haWwgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xLjUgcm91bmRlZC1sZyBiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtMzAwIGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMzAgaG92ZXI6YmctZW1lcmFsZC01MDAvMjUgdGV4dC1bMTFweF0gZm9udC1ib2xkIGFjdGl2ZTpzY2FsZS05NSBkaXNhYmxlZDpvcGFjaXR5LTQwIHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgSFx1MDBFMG5nIGNoXHUxRUREXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiVGhcdTAwRUFtIFx1MDExMVx1MUVDMyBwaFx1MDBFMXQga1x1MUVCRiB0aVx1MUVCRnAgc2F1IHZpZGVvIGhpXHUxRUM3biB0XHUxRUExaVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ2FkZF9uZXh0JywgeyB2aWRlb1VybDogdlVybCwgdGl0bGU6IGl0ZW0udGl0bGUsIHRodW1iOiBpdGVtLnRodW1ibmFpbCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEuNSByb3VuZGVkLWxnIGJnLXZpb2xldC01MDAvMTUgdGV4dC12aW9sZXQtMzAwIGJvcmRlciBib3JkZXItdmlvbGV0LTUwMC8zMCBob3ZlcjpiZy12aW9sZXQtNTAwLzI1IHRleHQtWzEwcHhdIGZvbnQtYm9sZCBhY3RpdmU6c2NhbGUtOTUgZGlzYWJsZWQ6b3BhY2l0eS00MCB3aGl0ZXNwYWNlLW5vd3JhcCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIEtcdTFFQkYgdGlcdTFFQkZwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiR1x1MUVFRGkgXHUwMTExXHUxRUMxIHh1XHUxRUE1dCB2aWRlbyBuXHUwMEUweSBjaG8gY2hcdTFFRTcgcGhcdTAwRjJuZyBwaFx1MDBFQSBkdXlcdTFFQzd0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmhEb25nUXVldWUoJ3N1Z2dlc3QnLCB7IHZpZGVvVXJsOiB2VXJsLCB0aXRsZTogaXRlbS50aXRsZSwgdGh1bWI6IGl0ZW0udGh1bWJuYWlsIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQtbGcgYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1hbWJlci01MDAgdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQteHMgc2hhZG93LW1kIGhvdmVyOmJyaWdodG5lc3MtMTEwIGFjdGl2ZTpzY2FsZS05NSBkaXNhYmxlZDpvcGFjaXR5LTQwIHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENBMTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MDExMFx1MUVDMSB4dVx1MUVBNXQgY2hvIGNoXHUxRUU3IHBoXHUwMEYybmc8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIC8qIEdcdTFFRTNpIFx1MDBGRCB0XHUxRUVCIGtoXHUwMEYzYSB0XHUwMEVDbSBraVx1MUVCRm0gbmhhbmggKyBraHVuZyB0aFx1MDBGNG5nIHRpbiBnaVx1MUVFRiBjaGlcdTFFQzF1IGNhbyBjXHUxRUQxIFx1MDExMVx1MUVDQm5oICovXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wganVzdGlmeS1iZXR3ZWVuIGdhcC0yIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTEuNSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDAgZm9udC1ib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBHXHUxRUUzaSBcdTAwRkQgY2hcdTFFRTcgXHUwMTExXHUxRUMxIGhcdTFFQ0RjIHRcdTFFQURwICYgdGhcdTAxQjAgZ2lcdTAwRTNuOlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGZsZXgtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7W1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdcdUQ4M0NcdURGQTcgTG9maSBoXHUxRUNEYyB0XHUxRUFEcCcsIHE6ICdsb2ZpIGhpcCBob3AgcmFkaW8gYmVhdHMgdG8gcmVsYXggc3R1ZHkgdG8nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1RDgzQ1x1REYyN1x1RkUwRiBUaVx1MUVCRm5nIG1cdTAxQjBhICYgUGlhbm8nLCBxOiAncmFpbiBzb3VuZHMgcmVsYXhpbmcgcGlhbm8gc3R1ZHkgZm9jdXMnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1MjYxNSBOaFx1MUVBMWMgcXVcdTAwRTFuIGNcdTAwRTAgcGhcdTAwRUEnLCBxOiAnY29mZmVlIHNob3AgamF6eiBwaWFubyBjaGlsbCBzdHVkeScgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnXHVEODNEXHVEQ0RBIFRcdTFFQURwIHRydW5nIFx1MDBGNG4gdGhpJywgcTogJ3N0dWR5IG11c2ljIGFscGhhIHdhdmVzIGNvbmNlbnRyYXRpb24nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1x1RDgzRFx1REQyQyBUaFx1MDBFRCBuZ2hpXHUxRUM3bSBIXHUwMEYzYSBoXHUxRUNEYycsIHE6ICd0aFx1MDBFRCBuZ2hpXHUxRUM3bSBoXHUwMEYzYSBoXHUxRUNEYyB0aFx1MDBGQSB2XHUxRUNCJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBdLm1hcCgoY2hpcCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17Y2hpcC5xfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gdGltS2llbVlvdVR1YmUoZSwgY2hpcC5xKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LVsjMDBGMkZFXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQtWzExcHhdIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y2hpcC5sYWJlbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtMyBiZy1bIzBCMEUxNF0vNjAgYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQteGwgdGV4dC1jZW50ZXIgdGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBnYXAtMSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhsXCI+XHVEODNEXHVEQ0ZBPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtjYW5Db250cm9sID8gJ1RcdTAwRUNtIGtpXHUxRUJGbSAmIFBoXHUwMEUxdCB2aWRlbyBZb3VUdWJlJyA6ICdUXHUwMEVDbSBraVx1MUVCRm0gJiBcdTAxMTBcdTFFQzEgeHVcdTFFQTV0IHZpZGVvIFlvdVR1YmUnfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDAgbWF4LXctc21cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge2NhbkNvbnRyb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdOaFx1MUVBRHAgdFx1MUVFQiBraFx1MDBGM2EgYlx1MDBFMGkgaFx1MUVDRGMgaG9cdTFFQjdjIGRcdTAwRTFuIGxpXHUwMEVBbiBrXHUxRUJGdCBZb3VUdWJlIFx1MUVERiB0clx1MDBFQW4gXHUwMTExXHUxRUMzIHRcdTAwRUNtIGtpXHUxRUJGbSB2XHUwMEUwIHBoXHUwMEUxdCBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGNobyB0XHUxRUE1dCBjXHUxRUEzIHRoXHUwMEUwbmggdmlcdTAwRUFuIHRyb25nIHBoXHUwMEYybmcuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ05oXHUxRUFEcCB0XHUxRUVCIGtoXHUwMEYzYSBob1x1MUVCN2MgZFx1MDBFMW4gbGlcdTAwRUFuIGtcdTFFQkZ0IFlvdVR1YmUgXHUxRURGIHRyXHUwMEVBbiBcdTAxMTFcdTFFQzMgdFx1MDBFQ20ga2lcdTFFQkZtIHZpZGVvIHZcdTAwRTAgXHUwMTExXHUxRUMxIHh1XHUxRUE1dCBjaG8gY2hcdTFFRTcgcGhcdTAwRjJuZyBkdXlcdTFFQzd0IHBoXHUwMEUxdC4nfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgey8qIFRBQiAyOiBRVVx1MUVBMk4gTFx1MDBERCBIXHUwMEMwTkcgXHUwMTEwXHUxRUUySSAoUVVFVUUpICovfVxuICAgICAgICAgICAgICB7bWVkaWFUYWIgPT09ICdxdWV1ZScgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1mdWxsIGZsZXggZmxleC1jb2wgZ2FwLTIuNSBtaW4taC0wXCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBmbGV4LXdyYXAgZ2FwLTIgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS0zMDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1RENDQjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5IXHUwMEUwbmcgXHUwMTExXHUxRUUzaSB2aWRlbyAoe3F1ZXVlTGlzdC5maWx0ZXIocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpLmxlbmd0aH0gY2hcdTFFREQpPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAge2NhbkNvbnRyb2wgJiYgcXVldWVMaXN0LnNvbWUocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiYnRuLXZ1bmcxLXF1ZXVlLXNraXBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdza2lwJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctYW1iZXItNTAwLzE1IHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGhvdmVyOmJnLWFtYmVyLTUwMC8yNSBkaXNhYmxlZDpvcGFjaXR5LTQwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1MjNFRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+Qlx1MUVDRiBxdWEgLyBCXHUwMEUwaSB0aVx1MUVCRnA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGFpUXVldWV9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkxcdTAwRTBtIG1cdTFFREJpIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIgcHktMSByb3VuZGVkLWxnIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LXhzIGJvcmRlciBib3JkZXItd2hpdGUvMTAgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIFx1RDgzRFx1REQwNFxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICB7LyogVGhcdTAwRUFtIGxpbmsgbmhhbmggdlx1MDBFMG8gcXVldWUgLyBcdTAxMTBcdTFFQzEgeHVcdTFFQTV0IHZpZGVvICovfVxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICA8UXVldWVJbnB1dFxuICAgICAgICAgICAgICAgICAgICAgIGNhbkNvbnRyb2w9e2NhbkNvbnRyb2x9XG4gICAgICAgICAgICAgICAgICAgICAgb25BZGQ9eyh1LCB0KSA9PiBoYW5oRG9uZ1F1ZXVlKCdlbnF1ZXVlJywgeyB2aWRlb1VybDogdSwgdGl0bGU6IHQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgb25BZGROZXh0PXsodSwgdCkgPT4gaGFuaERvbmdRdWV1ZSgnYWRkX25leHQnLCB7IHZpZGVvVXJsOiB1LCB0aXRsZTogdCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICBvblN1Z2dlc3Q9eyh1LCB0KSA9PiBoYW5oRG9uZ1F1ZXVlKCdzdWdnZXN0JywgeyB2aWRlb1VybDogdSwgdGl0bGU6IHQgfHwgJ1ZpZGVvIFx1MDExMVx1MUVDMSB4dVx1MUVBNXQnIH0pfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBEYW5oIHNcdTAwRTFjaCBcdTAxMTFcdTFFQzEgeHVcdTFFQTV0IHRcdTFFRUIgdGhcdTAwRTBuaCB2aVx1MDBFQW4gKi99XG4gICAgICAgICAgICAgICAgICB7cXVldWVMaXN0LnNvbWUocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3N1Z2dlc3RlZCcpICYmIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1hbWJlci05NTAvMjUgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgcm91bmRlZC14bCBwLTIuNSBmbGV4IGZsZXgtY29sIGdhcC0yIHNocmluay0wIGFuaW1hdGUtZmFkZUluXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtYW1iZXItMzAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVEQ0ExPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y2FuQ29udHJvbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBgVmlkZW8gXHUwMTExXHUxRUMxIHh1XHUxRUE1dCB0XHUxRUVCIHRoXHUwMEUwbmggdmlcdTAwRUFuICgke3F1ZXVlTGlzdC5maWx0ZXIocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3N1Z2dlc3RlZCcpLmxlbmd0aH0pYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBgXHUwMTEwXHUxRUMxIHh1XHUxRUE1dCBcdTAxMTFhbmcgY2hcdTFFREQgY2hcdTFFRTcgcGhcdTAwRjJuZyBkdXlcdTFFQzd0ICgke3F1ZXVlTGlzdC5maWx0ZXIocSA9PiBxLnRyYW5nVGhhaSA9PT0gJ3N1Z2dlc3RlZCcpLmxlbmd0aH0pYH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2NhbkNvbnRyb2wgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWFtYmVyLTQwMC85MCBmb250LWJvbGQgYmctYW1iZXItNTAwLzE1IGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHB4LTIgcHktMC41IHJvdW5kZWQtZnVsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENoXHUxRUREIGJcdTFFQTFuIGR1eVx1MUVDN3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMS41IG1heC1oLTM2IG92ZXJmbG93LXktYXV0byBwci0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cXVldWVMaXN0LmZpbHRlcihxID0+IHEudHJhbmdUaGFpID09PSAnc3VnZ2VzdGVkJykubWFwKChzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzTWluZSA9IHMuYWRkZWRCeUtob2EgPT09IHBob25nTWluaEtob2E7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3MuaWR9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGJnLVsjMEIwRTE0XSBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8yMCByb3VuZGVkLWxnIHAtMS41IHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cy50aHVtYiAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtzLnRodW1ifSBhbHQ9XCJcIiBjbGFzc05hbWU9XCJ3LTEyIGgtNyByb3VuZGVkIG9iamVjdC1jb3ZlciBzaHJpbmstMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwXCIgbG9hZGluZz1cImxhenlcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTIwMCBmb250LWJvbGQgdHJ1bmNhdGVcIiB0aXRsZT17cy50aXRsZSB8fCBzLnZpZGVvVXJsfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cy50aXRsZSB8fCBzLnZpZGVvVXJsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtYW1iZXItNDAwLzgwIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHUwMTEwXHUxRUMxIHh1XHUxRUE1dCBiXHUxRURGaTogPHNwYW4gY2xhc3NOYW1lPXtpc01pbmUgPyAndGV4dC1jeWFuLTMwMCBmb250LWJvbGQnIDogJyd9Pntpc01pbmUgPyAnQlx1MUVBMW4nIDogKHMuYWRkZWRCeSB8fCAnVGhcdTAwRTBuaCB2aVx1MDBFQW4nKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y2FuQ29udHJvbCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJEdXlcdTFFQzd0IHZcdTAwRTBvIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgnYXBwcm92ZV9zdWdnZXN0aW9uJywgeyBpZDogcy5pZCwgcGxheU5vdzogZmFsc2UgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIgcHktMSByb3VuZGVkIGJnLWVtZXJhbGQtNTAwLzIwIHRleHQtZW1lcmFsZC0zMDAgaG92ZXI6YmctZW1lcmFsZC01MDAvMzAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjcxMyBIXHUwMEUwbmcgY2hcdTFFRERcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJEdXlcdTFFQzd0IHZcdTAwRTAgcGhcdTAwRTF0IG5nYXkgbFx1MUVBRHAgdFx1MUVFOWNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdhcHByb3ZlX3N1Z2dlc3Rpb24nLCB7IGlkOiBzLmlkLCBwbGF5Tm93OiB0cnVlIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yIHB5LTEgcm91bmRlZCBiZy1jeWFuLTUwMC8yMCB0ZXh0LWN5YW4tMzAwIGhvdmVyOmJnLWN5YW4tNTAwLzMwIGJvcmRlciBib3JkZXItY3lhbi01MDAvMzAgdGV4dC1bMTBweF0gZm9udC1ib2xkIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI1QjYgUGhcdTAwRTF0IG5nYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJUXHUxRUVCIGNoXHUxRUQxaSBcdTAxMTFcdTFFQzEgeHVcdTFFQTV0IG5cdTAwRTB5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgncmVqZWN0X3N1Z2dlc3Rpb24nLCB7IGlkOiBzLmlkIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTYgaC02IHJvdW5kZWQgYmctcm9zZS01MDAvMjAgdGV4dC1yb3NlLTMwMCBob3ZlcjpiZy1yb3NlLTUwMC8zMCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRleHQteHMgZm9udC1ib2xkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTWluZSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkhcdTFFRTd5IFx1MDExMVx1MUVDMSB4dVx1MUVBNXQgY1x1MUVFN2EgYlx1MUVBMW5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdyZWplY3Rfc3VnZ2VzdGlvbicsIHsgaWQ6IHMuaWQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtxdWV1ZUJ1c3l9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIgcHktMSByb3VuZGVkIGJnLXJvc2UtNTAwLzE1IHRleHQtcm9zZS0zMDAgaG92ZXI6Ymctcm9zZS01MDAvMjUgYm9yZGVyIGJvcmRlci1yb3NlLTUwMC8zMCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgYWN0aXZlOnNjYWxlLTk1IGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhcdTFFRTd5IFx1MDExMVx1MUVDMSB4dVx1MUVBNXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgey8qIERhbmggc1x1MDBFMWNoIHZpZGVvIHRyb25nIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIGNoXHUwMEVEbmggdGhcdTFFRTljICovfVxuICAgICAgICAgICAgICAgICAgeygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZmljaWFsUXVldWUgPSBxdWV1ZUxpc3QuZmlsdGVyKHEgPT4gcS50cmFuZ1RoYWkgPT09ICdwbGF5aW5nJyB8fCBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAob2ZmaWNpYWxRdWV1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00IGJnLVsjMEIwRTE0XS82MCBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC14bCB0ZXh0LWNlbnRlciB0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIGdhcC0xLjUgbWluLWgtMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bFwiPlx1RDgzRFx1RENDQjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwXCI+SFx1MDBFMG5nIFx1MDExMVx1MUVFM2kgaGlcdTFFQzduIFx1MDExMWFuZyB0clx1MUVEMW5nPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCBtYXgtdy1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtjYW5Db250cm9sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdDaHV5XHUxRUMzbiBzYW5nIHRhYiBUXHUwMEVDbSBZb3VUdWJlIGhvXHUxRUI3YyBkXHUwMEUxbiBsaVx1MDBFQW4ga1x1MUVCRnQgdlx1MDBFMG8gXHUwMEY0IHRyXHUwMEVBbiBcdTAxMTFcdTFFQzMgXHUwMTExXHUwMUIwYSB2aWRlbyB2XHUwMEUwbyBkYW5oIHNcdTAwRTFjaCBwaFx1MDBFMXQgbGlcdTAwRUFuIHRcdTFFRTVjLidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ0NoXHUwMUIwYSBjXHUwMEYzIHZpZGVvIG5cdTAwRTBvIHRyb25nIGhcdTAwRTBuZyBcdTAxMTFcdTFFRTNpIHBoXHUwMEUxdC4gQlx1MUVBMW4gY1x1MDBGMyB0aFx1MUVDMyB0XHUwMEVDbSBraVx1MUVCRm0gdlx1MDBFMCBcdTAxMTFcdTFFQzEgeHVcdTFFQTV0IHZpZGVvIGNobyBjaFx1MUVFNyBwaFx1MDBGMm5nIGR1eVx1MUVDN3QuJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIHNwYWNlLXktMS41IG92ZXJmbG93LXktYXV0byBwci0xIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtvZmZpY2lhbFF1ZXVlLm1hcCgocSwgaWR4KSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3EuaWQgfHwgaWR4fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjUgYmctWyMwQjBFMTRdIGJvcmRlciByb3VuZGVkLXhsIHAtMiB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcS50cmFuZ1RoYWkgPT09ICdwbGF5aW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdib3JkZXItZW1lcmFsZC01MDAvNDAgc2hhZG93LVswXzBfMTVweF9yZ2JhKDUyLDIxMSwxNTMsMC4xNSldIGJnLWVtZXJhbGQtOTUwLzIwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdib3JkZXItd2hpdGUvNSBob3Zlcjpib3JkZXItd2hpdGUvMTUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTYgaC02IHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1bMTFweF0gZm9udC1ibGFjayBzaHJpbmstMCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxLnRyYW5nVGhhaSA9PT0gJ3BsYXlpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctZW1lcmFsZC01MDAgdGV4dC1ibGFjayBzaGFkb3ctWzBfMF8xMHB4X3JnYmEoNTIsMjExLDE1MywwLjQpXSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTQwMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRyYW5nVGhhaSA9PT0gJ3BsYXlpbmcnID8gJ1x1MjVCNicgOiBpZHggKyAxfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtxLnRodW1iICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtxLnRodW1ifSBhbHQ9XCJcIiBjbGFzc05hbWU9XCJ3LTEyIGgtNyByb3VuZGVkLW1kIG9iamVjdC1jb3ZlciBzaHJpbmstMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwXCIgbG9hZGluZz1cImxhenlcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtMjAwIGZvbnQtYm9sZCB0cnVuY2F0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cS50aXRsZSB8fCBxLnZpZGVvVXJsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3EudHJhbmdUaGFpID09PSAncGxheWluZycgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1lbWVyYWxkLTQwMCBmb250LWJvbGRcIj5cdTI1Q0YgXHUwMTEwYW5nIHBoXHUwMEUxdDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5UaFx1MDBFQW0gYlx1MUVERmk6IHtxLmFkZGVkQnkgfHwgJ1RoXHUwMEUwbmggdmlcdTAwRUFuJ308L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y2FuQ29udHJvbCAmJiBxLnRyYW5nVGhhaSA9PT0gJ3F1ZXVlZCcgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlBoXHUwMEUxdCB2aWRlbyBuXHUwMEUweSBuZ2F5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5oRG9uZ1F1ZXVlKCdwbGF5X25vdycsIHsgaWQ6IHEuaWQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3F1ZXVlQnVzeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSByb3VuZGVkLWxnIGJnLVsjMDBGMkZFXS8yMCB0ZXh0LVsjMDBGMkZFXSBob3ZlcjpiZy1bIzAwRjJGRV0vMzAgdGV4dC14cyBmb250LWJsYWNrIGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1MjVCNiBQaFx1MDBFMXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlhcdTAwRjNhIGtoXHUxRUNGaSBoXHUwMEUwbmcgXHUwMTExXHUxRUUzaVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuaERvbmdRdWV1ZSgncmVtb3ZlJywgeyBpZDogcS5pZCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17cXVldWVCdXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctNyBoLTcgcm91bmRlZC1sZyBiZy1yb3NlLTUwMC8xNSB0ZXh0LXJvc2UtMzAwIGhvdmVyOmJnLXJvc2UtNTAwLzI1IHRleHQteHMgZm9udC1ibGFjayBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdTI3MTVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfSkoKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG5cbiAgKTtcbn1cblxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ29tcG9uZW50OiBDYW1wdXMgRm9jdXMgUm9vbSAoU3R1ZHkgQ2FmXHUwMEU5ICYgUG9tb2Rvcm8gU2Vzc2lvbikgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5leHBvcnQgZnVuY3Rpb24gQ2FtcHVzRm9jdXNSb29tKHtcbiAgcGhvbmcsXG4gIHBob25nTWluaEtob2EsXG4gIGF1dGgsXG4gIGRvbmdQaG9uZ0hpZW5UYWksXG4gIHNvTmd1b2ksXG4gIGlzRm9jdXNNb2RlLFxuICBzZXRJc0ZvY3VzTW9kZVxufSkge1xuICBjb25zdCBbZm9jdXNTdGF0ZSwgc2V0Rm9jdXNTdGF0ZV0gPSB1c2VTdGF0ZSh7XG4gICAgcGhhc2U6ICdmb2N1cycsXG4gICAgc3RhdHVzOiAncGF1c2VkJyxcbiAgICBkdXJhdGlvblNlY29uZHM6IDE1MDAsXG4gICAgcmVtYWluaW5nU2Vjb25kczogMTUwMCxcbiAgICBwcmVzZXQ6ICcyNV81JyxcbiAgICByZXZpc2lvbjogMSxcbiAgICBjYW5Db250cm9sOiBmYWxzZSxcbiAgICB1cGRhdGVkQXQ6IG51bGwsXG4gICAgc2VydmVyTm93OiBudWxsXG4gIH0pO1xuICBjb25zdCBbbG9jYWxSZW1haW5pbmcsIHNldExvY2FsUmVtYWluaW5nXSA9IHVzZVN0YXRlKDE1MDApO1xuICBjb25zdCBbZGFuZ0d1aUxlbmgsIHNldERhbmdHdWlMZW5oXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2xvaSwgc2V0TG9pXSA9IHVzZVN0YXRlKCcnKTtcblxuICAvLyBBdWRpbyBzdGF0ZSAoQW1iaWVudCBwbGF5YmFjaylcbiAgbGV0IGNhdUhpbmggPSB7fTtcbiAgdHJ5IHsgY2F1SGluaCA9IHBob25nLmNhdUhpbmggPyBKU09OLnBhcnNlKHBob25nLmNhdUhpbmgpIDoge307IH0gY2F0Y2ggeyAvKiBiXHUxRUNGIHF1YSAqLyB9XG4gIGNvbnN0IG5oYWNVcmwgPSBjYXVIaW5oLm5oYWNVcmwgPyB1cmxNZWRpYUZlKGNhdUhpbmgubmhhY1VybCkgOiAnJztcbiAgY29uc3QgYXVkaW9SZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IFthdWRpb1BsYXlpbmcsIHNldEF1ZGlvUGxheWluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFthdWRpb1ZvbHVtZSwgc2V0QXVkaW9Wb2x1bWVdID0gdXNlU3RhdGUoMC41KTtcbiAgY29uc3QgW2F1ZGlvTXV0ZWQsIHNldEF1ZGlvTXV0ZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbaGFzSW50ZXJhY3RlZEF1ZGlvLCBzZXRIYXNJbnRlcmFjdGVkQXVkaW9dID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8vIEF1dGhvcml6YXRpb25cbiAgY29uc3QgW2NhbkNvbnRyb2wsIHNldENhbkNvbnRyb2xdID0gdXNlU3RhdGUoQm9vbGVhbihhdXRoLnVzZXI/LmlzVGVhY2hlciB8fCBwaG9uZz8uY2FuQ29udHJvbCB8fCBwaG9uZz8ubGFDaHVQaG9uZykpO1xuICBjb25zdCBpc0hvc3QgPSBjYW5Db250cm9sO1xuXG4gIC8vIFN5bmMgc3RhdGUgcmVjb25jaWxpYXRpb24gaGVscGVyXG4gIGNvbnN0IGFwRHVuZ0ZvY3VzU3RhdGUgPSAoc3QpID0+IHtcbiAgICBpZiAoIXN0KSByZXR1cm47XG4gICAgc2V0Rm9jdXNTdGF0ZShzdCk7XG4gICAgY29uc3QgcmVtID0gTnVtYmVyKHN0LnJlbWFpbmluZ1NlY29uZHMgPz8gMTUwMCk7XG4gICAgc2V0TG9jYWxSZW1haW5pbmcocmVtKTtcbiAgfTtcblxuICAvLyAxLiBQb2xsaW5nIEZvY3VzIFN0YXRlIChldmVyeSAzMDAwbXMpIHdpdGggdmlzaWJpbGl0eSByZWNvbmNpbGlhdGlvbiAmIHN0cmljdCBjbGVhbnVwXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XG5cbiAgICBjb25zdCBmZXRjaEZvY3VzID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGhvbmctZm9jdXM/cGhvbmdJZD0ke2VuY29kZVVSSUNvbXBvbmVudChwaG9uZy5pZCl9YCk7XG4gICAgICAgIGlmICghcmVzLm9rKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoYWN0aXZlICYmIGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICAgIGlmICh0eXBlb2YgZC5jYW5Db250cm9sID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHNldENhbkNvbnRyb2woZC5jYW5Db250cm9sKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXBEdW5nRm9jdXNTdGF0ZShkLnN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8qIGJcdTFFQ0YgcXVhIGtoaSBoXHUxRUU3eSBrXHUxRUJGdCBuXHUxRUQxaSAqL1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmZXRjaEZvY3VzKCk7XG4gICAgY29uc3QgdGltZXIgPSBzZXRJbnRlcnZhbChmZXRjaEZvY3VzLCAzMDAwKTtcblxuICAgIGNvbnN0IGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UgPSAoKSA9PiB7XG4gICAgICBpZiAoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAndmlzaWJsZScgJiYgYWN0aXZlKSB7XG4gICAgICAgIGZldGNoRm9jdXMoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlKTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBhY3RpdmUgPSBmYWxzZTtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UpO1xuICAgIH07XG4gIH0sIFtwaG9uZy5pZF0pO1xuXG4gIC8vIDIuIExvY2FsIENvdW50ZG93biBUaWNrIChldmVyeSAxMDAwbXMgd2hlbiBzdGF0dXMgPT09ICdydW5uaW5nJylcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZm9jdXNTdGF0ZS5zdGF0dXMgIT09ICdydW5uaW5nJykgcmV0dXJuO1xuICAgIGNvbnN0IHRpY2sgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBzZXRMb2NhbFJlbWFpbmluZyhyID0+IE1hdGgubWF4KDAsIHIgLSAxKSk7XG4gICAgfSwgMTAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodGljayk7XG4gIH0sIFtmb2N1c1N0YXRlLnN0YXR1c10pO1xuXG4gIC8vIDMuIENvbW1hbmQgZGlzcGF0Y2hlciB3aXRoIG9wdGltaXN0aWMgY29uY3VycmVuY3kgKHJldmlzaW9uIGNoZWNrICYgY29uZmxpY3QgaGFuZGxpbmcpXG4gIGNvbnN0IGd1aUxlbmggPSBhc3luYyAoYWN0aW9uLCBleHRyYVBheWxvYWQgPSB7fSkgPT4ge1xuICAgIGlmIChkYW5nR3VpTGVuaCkgcmV0dXJuO1xuICAgIHNldERhbmdHdWlMZW5oKHRydWUpO1xuICAgIHNldExvaSgnJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hcGkvcGhvbmctZm9jdXMnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHBob25nSWQ6IHBob25nLmlkLFxuICAgICAgICAgIGFjdGlvbixcbiAgICAgICAgICBleHBlY3RlZFJldmlzaW9uOiBmb2N1c1N0YXRlLnJldmlzaW9uLFxuICAgICAgICAgIC4uLmV4dHJhUGF5bG9hZFxuICAgICAgICB9KVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGQub2sgJiYgZC5zdGF0ZSkge1xuICAgICAgICBhcER1bmdGb2N1c1N0YXRlKGQuc3RhdGUpO1xuICAgICAgfSBlbHNlIGlmIChyZXMuc3RhdHVzID09PSA0MDkgJiYgZC5zdGF0ZSkge1xuICAgICAgICAvLyBDb25jdXJyZW5jeSBjb25mbGljdDogYWRvcHQgbGF0ZXN0IHNlcnZlciBzdGF0ZVxuICAgICAgICBhcER1bmdGb2N1c1N0YXRlKGQuc3RhdGUpO1xuICAgICAgICBzZXRMb2koJ1x1MDExMFx1MDBFMyBcdTAxMTFcdTFFRDNuZyBiXHUxRUQ5IGxcdTFFQTFpIHBoaVx1MDBFQW4gdGhlbyBtXHUwMEUxeSBjaFx1MUVFNy4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldExvaShkLmxvaSB8fCAnS2hcdTAwRjRuZyB0aFx1MUVDMyBjXHUxRUFEcCBuaFx1MUVBRHQgdHJcdTFFQTFuZyB0aFx1MDBFMWkgcGhcdTAwRjJuZyBoXHUxRUNEYyB0XHUxRUFEcC4nKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldExvaSgnTFx1MUVEN2kga1x1MUVCRnQgblx1MUVEMWkgbVx1MDBFMXkgY2hcdTFFRTcuJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldERhbmdHdWlMZW5oKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gNC4gQW1iaWVudCBBdWRpbyBDb250cm9sc1xuICBjb25zdCBiYXRBbVRoYW5oID0gKCkgPT4ge1xuICAgIHNldEhhc0ludGVyYWN0ZWRBdWRpbyh0cnVlKTtcbiAgICBpZiAoYXVkaW9SZWYuY3VycmVudCkge1xuICAgICAgYXVkaW9SZWYuY3VycmVudC5wbGF5KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHNldEF1ZGlvUGxheWluZyh0cnVlKTtcbiAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUud2FybignQXV0b3BsYXkgYmxvY2tlZCBvciBhdWRpbyBsb2FkIGVycm9yOicsIGVycik7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdG9nZ2xlQXVkaW9QbGF5ID0gKCkgPT4ge1xuICAgIGlmICghYXVkaW9SZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGlmIChhdWRpb1BsYXlpbmcpIHtcbiAgICAgIGF1ZGlvUmVmLmN1cnJlbnQucGF1c2UoKTtcbiAgICAgIHNldEF1ZGlvUGxheWluZyhmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJhdEFtVGhhbmgoKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdG9nZ2xlQXVkaW9NdXRlID0gKCkgPT4ge1xuICAgIGlmICghYXVkaW9SZWYuY3VycmVudCkgcmV0dXJuO1xuICAgIGNvbnN0IG5ld011dGUgPSAhYXVkaW9NdXRlZDtcbiAgICBhdWRpb1JlZi5jdXJyZW50Lm11dGVkID0gbmV3TXV0ZTtcbiAgICBzZXRBdWRpb011dGVkKG5ld011dGUpO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVZvbHVtZUNoYW5nZSA9IChlKSA9PiB7XG4gICAgY29uc3QgdmFsID0gcGFyc2VGbG9hdChlLnRhcmdldC52YWx1ZSk7XG4gICAgc2V0QXVkaW9Wb2x1bWUodmFsKTtcbiAgICBpZiAoYXVkaW9SZWYuY3VycmVudCkge1xuICAgICAgYXVkaW9SZWYuY3VycmVudC52b2x1bWUgPSB2YWw7XG4gICAgICBpZiAodmFsID4gMCAmJiBhdWRpb011dGVkKSB7XG4gICAgICAgIGF1ZGlvUmVmLmN1cnJlbnQubXV0ZWQgPSBmYWxzZTtcbiAgICAgICAgc2V0QXVkaW9NdXRlZChmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGlzQnJlYWsgPSBmb2N1c1N0YXRlLnBoYXNlID09PSAnYnJlYWsnO1xuICBjb25zdCBpc1J1bm5pbmcgPSBmb2N1c1N0YXRlLnN0YXR1cyA9PT0gJ3J1bm5pbmcnO1xuICBjb25zdCBkdXJhdGlvbiA9IGZvY3VzU3RhdGUuZHVyYXRpb25TZWNvbmRzIHx8IChpc0JyZWFrID8gMzAwIDogMTUwMCk7XG4gIGNvbnN0IHByb2dyZXNzUGVyY2VudCA9IE1hdGgubWluKDEwMCwgTWF0aC5tYXgoMCwgKChkdXJhdGlvbiAtIGxvY2FsUmVtYWluaW5nKSAvIGR1cmF0aW9uKSAqIDEwMCkpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC00IG1pbi13LTAgdy1mdWxsXCI+XG4gICAgICB7LyogSGlkZGVuIEF1ZGlvIGVsZW1lbnQgZm9yIGFtYmllbnQgc291bmR0cmFjayAqL31cbiAgICAgIHtuaGFjVXJsICYmIChcbiAgICAgICAgPGF1ZGlvXG4gICAgICAgICAgcmVmPXthdWRpb1JlZn1cbiAgICAgICAgICBzcmM9e25oYWNVcmx9XG4gICAgICAgICAgbG9vcFxuICAgICAgICAgIHByZWxvYWQ9XCJub25lXCJcbiAgICAgICAgICBvbkVuZGVkPXsoKSA9PiBzZXRBdWRpb1BsYXlpbmcoZmFsc2UpfVxuICAgICAgICAgIG9uRXJyb3I9eygpID0+IHNldEF1ZGlvUGxheWluZyhmYWxzZSl9XG4gICAgICAgIC8+XG4gICAgICApfVxuXG4gICAgICB7LyogSGVhZGVyIGJhcjogUHJlc2VuY2UsIEhvc3QgYmFkZ2UsIEZvY3VzIE1vZGUgdG9nZ2xlLCBDbG9zZSBSb29tICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTQgZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMyBzaGFkb3ctbGdcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2BweC0yLjUgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC1bMTBweF0gZm9udC1ib2xkIGJvcmRlciAke3Bob25nLnBoYW1WaSA9PT0gJ3RydW9uZycgPyAnYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTQwMCBib3JkZXItZW1lcmFsZC01MDAvMzAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgIHtwaG9uZy5waGFtVmkgPT09ICd0cnVvbmcnID8gJ1x1RDgzQ1x1REYxMCBUb1x1MDBFMG4gdHJcdTAxQjBcdTFFRERuZycgOiBgXHVEODNEXHVERDEyIExcdTFFREJwICR7cGhvbmcubG9wVGVuIHx8ICcnfWB9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGlkPVwiZm9jdXMtaG9zdC1iYWRnZVwiIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICBDaFx1MUVFNyBwaFx1MDBGMm5nOiA8c3Ryb25nIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtMjAwXCI+e3Bob25nLmNodVBob25nVGVufTwvc3Ryb25nPlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBpZD1cImZvY3VzLXJvb20tcHJlc2VuY2VcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBweC0yLjUgcHktMC41IHJvdW5kZWQtZnVsbCBiZy1bIzAwRjJGRV0vMTAgdGV4dC1bIzAwRjJGRV0gYm9yZGVyIGJvcmRlci1bIzAwRjJGRV0vMjAgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgXHVEODNEXHVEQzY1IHtzb05ndW9pIHx8IDF9IG5nXHUwMUIwXHUxRUREaSBcdTAxMTFhbmcgY1x1MDBGOW5nIHRcdTFFQURwIHRydW5nXG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG1sLWF1dG9cIj5cbiAgICAgICAgICB7aXNGb2N1c01vZGUgJiYgKFxuICAgICAgICAgICAgPHNwYW4gaWQ9XCJmb2N1cy1tb2RlLWFjdGl2ZS1pbmRpY2F0b3JcIiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1wdXJwbGUtNDAwIGJnLXB1cnBsZS01MDAvMTAgcHgtMiBweS0wLjUgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItcHVycGxlLTUwMC8yMCBhbmltYXRlLXB1bHNlXCI+XG4gICAgICAgICAgICAgIFx1RDgzQ1x1REZBRiBcdTAxMTBhbmcgYlx1MUVBRHQgRm9jdXMgTW9kZVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICl9XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtbW9kZS10b2dnbGVcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc0ZvY3VzTW9kZSghaXNGb2N1c01vZGUpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke2lzRm9jdXNNb2RlID8gJ2JnLXB1cnBsZS01MDAvMjAgdGV4dC1wdXJwbGUtMzAwIGJvcmRlci1wdXJwbGUtNTAwLzQwIHNoYWRvdy1bMF8wXzEycHhfcmdiYSgxNjgsODUsMjQ3LDAuMyldJyA6ICdiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtc2xhdGUtMzAwIGJvcmRlci13aGl0ZS8xMCd9YH0+XG4gICAgICAgICAgICA8c3Bhbj5cdUQ4M0NcdURGQUY8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj57aXNGb2N1c01vZGUgPyAnXHUyMUE5IFRob1x1MDBFMXQgRm9jdXMgTW9kZScgOiAnRm9jdXMgTW9kZSd9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAge2NhbkNvbnRyb2wgJiYgcGhvbmcuY2h1UGhvbmdLaG9hICE9PSAnaGUtdGhvbmcnICYmIChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e2RvbmdQaG9uZ0hpZW5UYWl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHJvdW5kZWQteGwgYmctcm9zZS01MDAvMTUgaG92ZXI6Ymctcm9zZS01MDAvMjUgdGV4dC1yb3NlLTMwMCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzMwIHRyYW5zaXRpb24tYWxsXCI+XG4gICAgICAgICAgICAgIFx1MDExMFx1MDBGM25nIHBoXHUwMEYybmdcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBNYWluIEZvY3VzIENlbnRlcnBpZWNlIENhcmQgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YHJlbGF0aXZlIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLTN4bCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgcC02IHNtOnAtOCBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciB0ZXh0LWNlbnRlciBzaGFkb3ctMnhsICR7aXNCcmVhayA/ICdiZy1ncmFkaWVudC10by1iIGZyb20tWyMxRTE3MTBdIHRvLVsjMTMxMTBFXSBib3JkZXItYW1iZXItNTAwLzMwJyA6ICdiZy1ncmFkaWVudC10by1iIGZyb20tWyMwRjFFMjhdIHRvLVsjMEExMjE5XSBib3JkZXItWyMwMEYyRkVdLzMwJ31gfT5cbiAgICAgICAgey8qIEdsb3cgYmFja2Ryb3AgYWNjZW50ICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGFic29sdXRlIC10b3AtMjQgLWxlZnQtMjQgdy03MiBoLTcyIHJvdW5kZWQtZnVsbCBibHVyLTN4bCBvcGFjaXR5LTIwIHBvaW50ZXItZXZlbnRzLW5vbmUgJHtpc0JyZWFrID8gJ2JnLWFtYmVyLTUwMCcgOiAnYmctWyMwMEYyRkVdJ31gfSAvPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGFic29sdXRlIC1ib3R0b20tMjQgLXJpZ2h0LTI0IHctNzIgaC03MiByb3VuZGVkLWZ1bGwgYmx1ci0zeGwgb3BhY2l0eS0yMCBwb2ludGVyLWV2ZW50cy1ub25lICR7aXNCcmVhayA/ICdiZy1vcmFuZ2UtNTAwJyA6ICdiZy1pbmRpZ28tNTAwJ31gfSAvPlxuXG4gICAgICAgIHsvKiBQaGFzZSAmIFN0YXR1cyBCYWRnZXMgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0yLjUgbWItNiB6LTEwXCI+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGlkPVwiZm9jdXMtcGhhc2UtYmFkZ2VcIlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMy41IHB5LTEgcm91bmRlZC1mdWxsIHRleHQteHMgZm9udC1leHRyYWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIGJvcmRlciBzaGFkb3ctc20gJHtpc0JyZWFrID8gJ2JnLWFtYmVyLTUwMC8xNSB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzQwJyA6ICdiZy1bIzAwRjJGRV0vMTUgdGV4dC1bIzAwRjJGRV0gYm9yZGVyLVsjMDBGMkZFXS80MCd9YH0+XG4gICAgICAgICAgICB7aXNCcmVhayA/ICdcdTI2MTUgR2lcdTFFREQgTmdoXHUxRUM5IE5nXHUwMUExaSAoQnJlYWspJyA6ICdcdUQ4M0NcdURGNDUgUGhpXHUwMEVBbiBUXHUxRUFEcCBUcnVuZyAoRm9jdXMpJ31cbiAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgaWQ9XCJmb2N1cy1zdGF0dXMtYmFkZ2VcIlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtYm9sZCBib3JkZXIgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSAke2lzUnVubmluZyA/ICdiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtNDAwIGJvcmRlci1lbWVyYWxkLTUwMC8zMCcgOiAnYmctc2xhdGUtNTAwLzE1IHRleHQtc2xhdGUtNDAwIGJvcmRlci1zbGF0ZS01MDAvMzAnfWB9PlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdy0yIGgtMiByb3VuZGVkLWZ1bGwgJHtpc1J1bm5pbmcgPyAnYmctZW1lcmFsZC00MDAgYW5pbWF0ZS1wdWxzZScgOiAnYmctc2xhdGUtNDAwJ31gfSAvPlxuICAgICAgICAgICAgPHNwYW4+e2lzUnVubmluZyA/ICdcdTAxMTBhbmcgXHUwMTExXHUxRUJGbScgOiAnVFx1MUVBMW0gZFx1MUVFQm5nJ308L3NwYW4+XG4gICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtcHJlc2V0LXRvZ2dsZVwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGRpc2FibGVkPXshY2FuQ29udHJvbCB8fCBkYW5nR3VpTGVuaH1cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGNhbkNvbnRyb2wgJiYgZ3VpTGVuaCgnc2V0X3ByZXNldCcsIHsgcHJlc2V0OiBmb2N1c1N0YXRlLnByZXNldCA9PT0gJzUwXzEwJyA/ICcyNV81JyA6ICc1MF8xMCcgfSl9XG4gICAgICAgICAgICB0aXRsZT17Y2FuQ29udHJvbCA/ICdCXHUxRUE1bSBcdTAxMTFcdTFFQzMgXHUwMTExXHUxRUQ1aSBjaHUga1x1MUVGMyBQb21vZG9ybycgOiAnQ2h1IGtcdTFFRjMgUG9tb2Rvcm8gaGlcdTFFQzduIHRcdTFFQTFpJ31cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LW1vbm8gZm9udC1ib2xkIGJvcmRlciB0cmFuc2l0aW9uLWFsbCAke2NhbkNvbnRyb2wgPyAnaG92ZXI6c2NhbGUtMTA1IGFjdGl2ZTpzY2FsZS05NSBjdXJzb3ItcG9pbnRlciBiZy13aGl0ZS8xMCB0ZXh0LXdoaXRlIGJvcmRlci13aGl0ZS8yMCcgOiAnY3Vyc29yLWRlZmF1bHQgYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgXHUyNjk5XHVGRTBGIHtmb2N1c1N0YXRlLnByZXNldCA9PT0gJzUwXzEwJyA/ICc1MCAvIDEwIHBoXHUwMEZBdCcgOiAnMjUgLyA1IHBoXHUwMEZBdCd9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBNYXNzaXZlIFRpbWVyIERpc3BsYXkgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXktMiBzbTpteS00IHotMTBcIj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgaWQ9XCJmb2N1cy10aW1lci1kaXNwbGF5XCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGZvbnQtbW9ubyB0ZXh0LTZ4bCBzbTp0ZXh0LTh4bCBmb250LWJsYWNrIHRyYWNraW5nLXdpZGVzdCBibG9jayB0cmFuc2l0aW9uLWFsbCBzZWxlY3Qtbm9uZSAke2lzQnJlYWsgPyAndGV4dC1hbWJlci0zMDAgZHJvcC1zaGFkb3ctWzBfMF8zNXB4X3JnYmEoMjQ1LDE1OCwxMSwwLjM1KV0nIDogJ3RleHQtWyMwMEYyRkVdIGRyb3Atc2hhZG93LVswXzBfMzVweF9yZ2JhKDAsMjQyLDI1NCwwLjM1KV0nfWB9PlxuICAgICAgICAgICAge2RpbmhEYW5nR2lheVBodXQobG9jYWxSZW1haW5pbmcpfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIFByb2dyZXNzIGJhciAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgbWF4LXctbWQgaC0yIGJnLWJsYWNrLzQwIHJvdW5kZWQtZnVsbCBvdmVyZmxvdy1oaWRkZW4gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBteS00IHotMTBcIj5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BoLWZ1bGwgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMTAwMCAke2lzQnJlYWsgPyAnYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1vcmFuZ2UtNTAwJyA6ICdiZy1ncmFkaWVudC10by1yIGZyb20tWyMwMEYyRkVdIHRvLVsjM0I4MkY2XSd9YH1cbiAgICAgICAgICAgIHN0eWxlPXt7IHdpZHRoOiBgJHtwcm9ncmVzc1BlcmNlbnR9JWAgfX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogQ29udHJvbCBCdXR0b25zIGZvciBIb3N0L1RlYWNoZXIgKi99XG4gICAgICAgIHtjYW5Db250cm9sID8gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0zIG10LTQgei0xMFwiPlxuICAgICAgICAgICAgeyFpc1J1bm5pbmcgPyAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1zdGFydFwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3N0YXJ0Jyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNiBweS0zIHJvdW5kZWQtMnhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1lbWVyYWxkLTQwMCB0by10ZWFsLTUwMCBob3Zlcjpmcm9tLWVtZXJhbGQtMzAwIGhvdmVyOnRvLXRlYWwtNDAwIHRleHQtYmxhY2sgZm9udC1ibGFjayB0ZXh0LXNtIHNoYWRvdy1bMF8wXzIwcHhfcmdiYSg1MiwyMTEsMTUzLDAuMyldIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHUyNUI2PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPkJcdTFFQUZ0IFx1MDExMVx1MUVBN3U8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXBhdXNlXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgncGF1c2UnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC02IHB5LTMgcm91bmRlZC0yeGwgYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTQwMCB0by1vcmFuZ2UtNTAwIGhvdmVyOmZyb20tYW1iZXItMzAwIGhvdmVyOnRvLW9yYW5nZS00MDAgdGV4dC1ibGFjayBmb250LWJsYWNrIHRleHQtc20gc2hhZG93LVswXzBfMjBweF9yZ2JhKDI1MSwxOTEsMzYsMC4zKV0gYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGRpc2FibGVkOm9wYWNpdHktNTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cdTIzRjg8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4+VFx1MUVBMW0gZFx1MUVFQm5nPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgaWQ9XCJidG4tZm9jdXMtcmVzZXRcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBndWlMZW5oKCdyZXNldCcpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTMgcm91bmRlZC0yeGwgYmctd2hpdGUvMTAgaG92ZXI6Ymctd2hpdGUvMTUgdGV4dC1zbGF0ZS0yMDAgdGV4dC1zbSBmb250LWJvbGQgYm9yZGVyIGJvcmRlci13aGl0ZS8xNSBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlx1RDgzRFx1REQwNDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+XHUwMTEwXHUxRUI3dCBsXHUxRUExaTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICB7aXNCcmVhayA/IChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLWZvY3VzLXN0YXJ0LWZvY3VzXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZGFuZ0d1aUxlbmh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ3VpTGVuaCgnc3RhcnRfZm9jdXMnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTMgcm91bmRlZC0yeGwgYmctWyMwMEYyRkVdLzIwIGhvdmVyOmJnLVsjMDBGMkZFXS8zMCB0ZXh0LVsjMDBGMkZFXSB0ZXh0LXNtIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLVsjMDBGMkZFXS80MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBkaXNhYmxlZDpvcGFjaXR5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNDXHVERkFGPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPlZcdTAwRTBvIFRcdTFFQURwIHRydW5nPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBpZD1cImJ0bi1mb2N1cy1zdGFydC1icmVha1wiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RhbmdHdWlMZW5ofVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGd1aUxlbmgoJ3N0YXJ0X2JyZWFrJyl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0zIHJvdW5kZWQtMnhsIGJnLWFtYmVyLTUwMC8yMCBob3ZlcjpiZy1hbWJlci01MDAvMzAgdGV4dC1hbWJlci0zMDAgdGV4dC1zbSBmb250LWJvbGQgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvNDAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZGlzYWJsZWQ6b3BhY2l0eS01MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlx1MjYxNTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5OZ2hcdTFFQzkgbmdcdTAxQTFpPC9zcGFuPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBtdC0zIHotMTBcIj5cbiAgICAgICAgICAgIFx1MjNGMyBcdTAxMTBcdTFFRDNuZyBoXHUxRUQzIFBvbW9kb3JvIGRvIGNoXHUxRUU3IHBoXHUwMEYybmcgXHUwMTExaVx1MUVDMXUgcGhcdTFFRDFpIFx1MjAxNCBoXHUwMEUzeSB0XHUxRUFEcCB0cnVuZyBoXHUxRUJGdCBtXHUwMEVDbmggdlx1MDBFMG8gY1x1MDBGNG5nIHZpXHUxRUM3Yy9oXHUxRUNEYyB0XHUxRUFEcCBuaFx1MDBFOSFcbiAgICAgICAgICA8L3A+XG4gICAgICAgICl9XG5cbiAgICAgICAge2xvaSAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtcm9zZS00MDAgbXQtNCB6LTEwXCI+e2xvaX08L3A+fVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBBbWJpZW50IEF1ZGlvIFBsYXllciBDYXJkICovfVxuICAgICAge25oYWNVcmwgPyAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNTFBMjNdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC00IHNtOnAtNSBmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTQgc2hhZG93LXhsXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMy41IG1pbi13LTAgdy1mdWxsIHNtOnctYXV0b1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2B3LTEyIGgtMTIgcm91bmRlZC0yeGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC14bCBzaHJpbmstMCBib3JkZXIgdHJhbnNpdGlvbi1hbGwgJHthdWRpb1BsYXlpbmcgPyAnYmctWyM4QjVDRjZdLzIwIHRleHQtWyM4QjVDRjZdIGJvcmRlci1bIzhCNUNGNl0vNDAgc2hhZG93LVswXzBfMTVweF9yZ2JhKDEzOSw5MiwyNDYsMC4zKV0gYW5pbWF0ZS1wdWxzZScgOiAnYmctd2hpdGUvNSB0ZXh0LXNsYXRlLTQwMCBib3JkZXItd2hpdGUvMTAnfWB9PlxuICAgICAgICAgICAgICBcdUQ4M0NcdURGQTdcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4tdy0wXCI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtd2hpdGUgdHJ1bmNhdGVcIj5cdTAwQzJtIHRoYW5oIG5cdTFFQzFuIEFtYmllbnQ8L3A+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAge2F1ZGlvUGxheWluZyA/ICdcdTAxMTBhbmcgcGhcdTAwRTF0IGtoXHUwMEY0bmcgZ2lhbiBoXHUxRUNEYyB0XHUxRUFEcCcgOiAnXHUwMEMybSB0aGFuaCBjXHUxRUU1YyBiXHUxRUQ5IHRoZW8gdGhpXHUxRUJGdCBiXHUxRUNCJ31cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBnYXAtMyB3LWZ1bGwgc206dy1hdXRvIGp1c3RpZnktZW5kXCI+XG4gICAgICAgICAgICB7IWhhc0ludGVyYWN0ZWRBdWRpbyAmJiAhYXVkaW9QbGF5aW5nICYmIChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGlkPVwiYnRuLXN0YXJ0LWZvY3VzLWF1ZGlvXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXtiYXRBbVRoYW5ofVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMiByb3VuZGVkLXhsIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzhCNUNGNl0gdG8tWyM2MzY2RjFdIHRleHQtd2hpdGUgdGV4dC14cyBmb250LWJvbGQgc2hhZG93LWxnIGhvdmVyOm9wYWNpdHktOTAgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+XHVEODNEXHVERDBBPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuPkJcdTFFQUR0IFx1MDBFMm0gdGhhbmggdFx1MUVBRHAgdHJ1bmc8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBpZD1cImZvY3VzLWF1ZGlvLXRvZ2dsZVwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVBdWRpb1BsYXl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgcHktMS41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgYm9yZGVyIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgJHthdWRpb1BsYXlpbmcgPyAnYmctWyM4QjVDRjZdLzIwIHRleHQtWyM4QjVDRjZdIGJvcmRlci1bIzhCNUNGNl0vNDAnIDogJ2JnLXdoaXRlLzUgdGV4dC1zbGF0ZS0zMDAgYm9yZGVyLXdoaXRlLzEwJ31gfT5cbiAgICAgICAgICAgICAgPHNwYW4+e2F1ZGlvUGxheWluZyA/ICdcdTIzRjggVFx1MUVBMW0gZFx1MUVFQm5nJyA6ICdcdTI1QjYgUGhcdTAwRTF0IHRpXHUxRUJGcCd9PC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e3RvZ2dsZUF1ZGlvTXV0ZX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0yIHJvdW5kZWQteGwgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXNsYXRlLTMwMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHRleHQteHMgdHJhbnNpdGlvbi1hbGxcIj5cbiAgICAgICAgICAgICAge2F1ZGlvTXV0ZWQgfHwgYXVkaW9Wb2x1bWUgPT09IDAgPyAnXHVEODNEXHVERDA3JyA6ICdcdUQ4M0RcdUREMDknfVxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICB0eXBlPVwicmFuZ2VcIlxuICAgICAgICAgICAgICBtaW49XCIwXCJcbiAgICAgICAgICAgICAgbWF4PVwiMVwiXG4gICAgICAgICAgICAgIHN0ZXA9XCIwLjA1XCJcbiAgICAgICAgICAgICAgdmFsdWU9e2F1ZGlvTXV0ZWQgPyAwIDogYXVkaW9Wb2x1bWV9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVWb2x1bWVDaGFuZ2V9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMjQgaC0xLjUgYmctd2hpdGUvMTAgcm91bmRlZC1sZyBhcHBlYXJhbmNlLW5vbmUgY3Vyc29yLXBvaW50ZXIgYWNjZW50LVsjOEI1Q0Y2XVwiXG4gICAgICAgICAgICAgIHRpdGxlPVwiXHUwMEMybSBsXHUwMUIwXHUxRUUzbmcgbmhcdTFFQTFjIG5cdTFFQzFuXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKSA6IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE1MUEyM10gYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQtMnhsIHAtNCB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwXCI+XG4gICAgICAgICAgICBcdTI2MTUgUGhcdTAwRjJuZyBcdTFFREYgY2hcdTFFQkYgXHUwMTExXHUxRUQ5IHRcdTAxMjluaCBsXHUxRUI3bmcgKGNoXHUwMUIwYSBnXHUxRUFGbiBsaW5rIFx1MDBFMm0gdGhhbmggblx1MUVDMW4pIFx1MjAxNCBDaHV5XHUwMEVBbiB0XHUwMEUybSB0XHUxRUQxaSBcdTAxMTFhIHZcdTAwRTBvIGJcdTAwRTBpIHZcdTFFREYuXG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHtwaG9uZy5tb1RhICYmIChcbiAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgcHgtMiBsZWFkaW5nLXJlbGF4ZWRcIj5cbiAgICAgICAgICB7cGhvbmcubW9UYX1cbiAgICAgICAgPC9wPlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICJBQUFBLE1BQU0sRUFBRSxVQUFVLFdBQVcsT0FBTyxJQUFJO0FBQ3hDLFNBQVMsa0JBQWtCLG9CQUFvQixlQUFlLFdBQVcsbUJBQW1CLHFCQUFxQixrQkFBa0I7QUFLbkksTUFBTSxhQUFhLENBQUMsT0FBTyxNQUFNO0FBQUUsTUFBSSxTQUFTLG9CQUFvQixVQUFXLElBQUc7QUFBRztBQUk5RSxnQkFBUyxXQUFXLEVBQUUsT0FBTyxXQUFXLFdBQVcsYUFBYSxLQUFLLEdBQUc7QUFDN0UsUUFBTSxDQUFDLEdBQUcsSUFBSSxJQUFJLE1BQU0sU0FBUyxFQUFFO0FBQ25DLFFBQU0sS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTO0FBQzdCLFNBQ0Usb0NBQUMsU0FBSSxXQUFVLCtCQUNiO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxJQUFHO0FBQUEsTUFDSCxNQUFLO0FBQUEsTUFDTCxPQUFPO0FBQUEsTUFDUCxVQUFVLE9BQUssS0FBSyxFQUFFLE9BQU8s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
