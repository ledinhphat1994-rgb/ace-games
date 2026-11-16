import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Pause, 
  Timer,
  Bot,
  Globe,
  LogOut
} from 'lucide-react';
import { soundManager } from '../utils/sound';
import { OnlineLobbyModal } from '../components/OnlineLobbyModal';
import { OpponentLeftModal } from '../components/OpponentLeftModal';
import { multiplayer, type RoomInfo } from '../utils/multiplayer';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

type PongDifficulty = 'easy' | 'medium' | 'hard';

export const GamePong: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);
  const [serveNotice, setServeNotice] = useState<string | null>(null);

  // Cấu hình chơi offline (Đấu Máy)
  const [difficulty, setDifficulty] = useState<PongDifficulty>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_pong');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['easy', 'medium', 'hard'].includes(parsed.difficulty)) return parsed.difficulty;
      }
    } catch {}
    return 'medium';
  });

  const [targetScore, setTargetScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_pong');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.targetScore === 'number') return parsed.targetScore;
      }
    } catch {}
    return 5;
  });

  // Điểm số trận đấu
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [rallyCount, setRallyCount] = useState(0);

  // Trạng thái chơi Online nhiều người qua mạng (Đồng bộ với Cờ Tướng / Cờ Caro)
  const [isOnlineMode, setIsOnlineMode] = useState<boolean>(false);
  const [isWaitingForFriend, setIsWaitingForFriend] = useState<boolean>(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState<boolean>(false);
  const [onlineRoom, setOnlineRoom] = useState<RoomInfo | null>(null);
  const [playerRole, setPlayerRole] = useState<'host' | 'guest'>('host');
  const [opponentName, setOpponentName] = useState<string>('ĐỐI THỦ');
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);
  const [isOpponentLeftModalOpen, setIsOpponentLeftModalOpen] = useState<boolean>(false);

  // Audio synthesizer ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((freq: number, type: OscillatorType = 'sine', duration: number = 0.08) => {
    if (!soundManager.isSoundOn()) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, []);

  // Lưu cài đặt vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ace_game_settings_pong', JSON.stringify({ difficulty, targetScore }));
    } catch {}
  }, [difficulty, targetScore]);

  // Game state ref dùng cho vòng lặp 60 FPS
  const stateRef = useRef({
    cw: 960,
    ch: 540,
    p1: { x: 30, y: 222, w: 16, h: 96, speed: 9, targetY: 222 },
    p2: { x: 914, y: 222, w: 16, h: 96, speed: 6.8, targetY: 222 },
    ball: { 
      x: 480, 
      y: 270, 
      vx: 0, 
      vy: 0, 
      speed: 7.0, 
      radius: 8,
      trail: [] as TrailPoint[] 
    },
    particles: [] as Particle[],
    shake: 0,
    keys: {
      w: false,
      s: false,
      up: false,
      down: false,
    },
    p1Score: 0,
    p2Score: 0,
    rally: 0,
    targetScore: 5,
    difficulty: 'medium' as PongDifficulty,
    isPlaying: false,
    isPaused: false,
    isOnlineMode: false,
    playerRole: 'host' as 'host' | 'guest',
    isWaitingForFriend: false,
    isServing: false
  });

  const lastSyncTimeRef = useRef<number>(0);
  const lastPaddleSendTimeRef = useRef<number>(0);
  const lastSentPaddleYRef = useRef<number>(-999);
  const lastGuestHitTimeRef = useRef<number>(0);
  const serveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Throttled paddle sender: Chỉ gửi khi di chuyển >= 1.5px và sau >= 25ms để tiết kiệm băng thông và giảm tải MQTT
  const sendPaddleThrottled = useCallback((y: number) => {
    const rounded = Math.round(y);
    const now = performance.now();
    if (Math.abs(rounded - lastSentPaddleYRef.current) >= 1.5 && now - lastPaddleSendTimeRef.current >= 25) {
      lastPaddleSendTimeRef.current = now;
      lastSentPaddleYRef.current = rounded;
      multiplayer.sendAction('pong_paddle', { y: rounded });
    }
  }, []);

  // Đồng bộ props & state vào stateRef
  useEffect(() => {
    const s = stateRef.current;
    s.difficulty = difficulty;
    s.targetScore = targetScore;
    s.isPaused = isPaused;
    s.isPlaying = isPlaying;
    s.isOnlineMode = isOnlineMode;
    s.playerRole = playerRole;
    s.isWaitingForFriend = isWaitingForFriend;
    
    // Tốc độ AI theo cấp độ
    if (difficulty === 'easy') s.p2.speed = 4.8;
    else if (difficulty === 'medium') s.p2.speed = 6.8;
    else s.p2.speed = 8.6;
  }, [difficulty, targetScore, isPaused, isPlaying, isOnlineMode, playerRole, isWaitingForFriend]);

  // Tạo hiệu ứng tia lửa va chạm
  const spawnSparks = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const particles = stateRef.current.particles;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 2,
        life: 0,
        maxLife: Math.random() * 20 + 15,
      });
    }
  }, []);

  // Phát bóng sau quãng chờ chuẩn bị
  const launchServe = useCallback((towardsP1: boolean) => {
    const s = stateRef.current;
    s.ball.x = s.cw / 2;
    s.ball.y = s.ch / 2;
    s.ball.speed = 7.0;
    s.ball.trail = [];
    s.rally = 0;
    setRallyCount(0);
    s.isServing = true;
    setServeNotice('CHUẨN BỊ...');

    if (serveTimerRef.current) clearTimeout(serveTimerRef.current);

    // Gửi tín hiệu chờ giao bóng nếu online
    if (s.isOnlineMode && s.playerRole === 'host') {
      multiplayer.sendAction('pong_serve_wait', {
        s1: s.p1Score,
        s2: s.p2Score,
      });
    }

    serveTimerRef.current = setTimeout(() => {
      s.isServing = false;
      setServeNotice(null);
      const angle = (Math.random() * 0.6 - 0.3);
      const dir = towardsP1 ? -1 : 1;
      s.ball.vx = dir * s.ball.speed * Math.cos(angle);
      s.ball.vy = s.ball.speed * Math.sin(angle);
      playTone(480, 'sine', 0.1);

      if (s.isOnlineMode && s.playerRole === 'host') {
        multiplayer.sendAction('pong_serve_launch', {
          bx: s.ball.x,
          by: s.ball.y,
          bvx: s.ball.vx,
          bvy: s.ball.vy,
          speed: s.ball.speed,
          s1: s.p1Score,
          s2: s.p2Score,
          rally: 0
        });

        // Gửi ngay 1 gói pong_state để đảm bảo khách đồng bộ tuyệt đối
        multiplayer.sendAction('pong_state', {
          bx: Math.round(s.ball.x * 10) / 10,
          by: Math.round(s.ball.y * 10) / 10,
          bvx: Math.round(s.ball.vx * 100) / 100,
          bvy: Math.round(s.ball.vy * 100) / 100,
          speed: s.ball.speed,
          p1y: Math.round(s.p1.y),
          s1: s.p1Score,
          s2: s.p2Score,
          rally: 0
        });
      }
    }, 850);
  }, [playTone]);

  // Bắt đầu hoặc làm mới ván đấu
  const resetGame = useCallback((notifyRemote: boolean = true) => {
    soundManager.playButtonClick();
    if (serveTimerRef.current) clearTimeout(serveTimerRef.current);

    const s = stateRef.current;
    s.p1.y = s.ch / 2 - s.p1.h / 2;
    s.p2.y = s.ch / 2 - s.p2.h / 2;
    s.ball.x = s.cw / 2;
    s.ball.y = s.ch / 2;
    s.ball.vx = 0;
    s.ball.vy = 0;
    s.ball.speed = 7.0;
    s.ball.trail = [];
    s.p1Score = 0;
    s.p2Score = 0;
    s.rally = 0;
    s.particles = [];
    s.shake = 0;
    setP1Score(0);
    setP2Score(0);
    setRallyCount(0);
    setWinner(null);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    s.isPlaying = true;

    // Chỉ Host hoặc Offline mới tính toán giao bóng
    const isMaster = !s.isOnlineMode || s.playerRole === 'host';
    if (isMaster) {
      launchServe(Math.random() < 0.5);
    } else {
      s.isServing = true;
      setServeNotice('CHUẨN BỊ...');
    }

    if (notifyRemote && s.isOnlineMode && !s.isWaitingForFriend) {
      multiplayer.sendAction('game_restart');
    }
  }, [launchServe]);

  // Sao chép link mời phòng online
  const handleCopyInvite = useCallback(() => {
    if (!onlineRoom) return;
    soundManager.playButtonClick();
    const cleanId = multiplayer.normalizeRoomId(onlineRoom.roomId);
    const url = `${window.location.origin}${window.location.pathname}?game=pong&room=${cleanId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    });
  }, [onlineRoom]);

  // Rời phòng online quay về đấu máy
  const handleLeaveRoom = useCallback(() => {
    soundManager.playButtonClick();
    if (serveTimerRef.current) clearTimeout(serveTimerRef.current);
    multiplayer.leaveRoom();
    const s = stateRef.current;
    s.isOnlineMode = false;
    s.isWaitingForFriend = false;
    s.playerRole = 'host';
    setIsOnlineMode(false);
    setIsWaitingForFriend(false);
    setOnlineRoom(null);
    setPlayerRole('host');
    setOpponentName('ĐỐI THỦ');
    setServeNotice(null);
    resetGame(false);
  }, [resetGame]);

  // Tự động vào phòng khi mở qua Link URL hoặc vào bàn game ngay khi mở trò chơi (đồng bộ với Cờ Tướng)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const gameParam = params.get('game');
    if (roomParam && (!gameParam || gameParam === 'pong')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());

      multiplayer.joinRoom('pong', roomParam).then((ok) => {
        if (ok) {
          const room = multiplayer.getCurrentRoom();
          if (room) {
            const s = stateRef.current;
            s.isOnlineMode = true;
            s.isWaitingForFriend = false;
            s.playerRole = 'guest';
            setIsOnlineMode(true);
            setIsWaitingForFriend(false);
            setOnlineRoom(room);
            setPlayerRole('guest');
            const opp = multiplayer.getOpponent();
            if (opp?.name) setOpponentName(opp.name);
            else if (room.hostName) setOpponentName(room.hostName);
            resetGame(false);
          }
        }
      });
    } else {
      // Mặc định vào bàn game luôn, không qua màn hình chờ rườm rà
      resetGame(false);
    }
  }, [resetGame]);

  // Lắng nghe dữ liệu mạng từ đối thủ qua MQTT
  useEffect(() => {
    if (!isOnlineMode && !isWaitingForFriend) return;

    const handleMessage = (data: any) => {
      if (data.senderName) setOpponentName(data.senderName);

      if (data.type === 'ping_sync') {
        // Đối thủ vừa phục hồi kết nối: Nếu là Host thì gửi ngay pong_state hiện tại để đồng bộ tức thì
        const s = stateRef.current;
        if (playerRole === 'host' && s.isPlaying) {
          multiplayer.sendAction('pong_state', {
            bx: Math.round(s.ball.x * 10) / 10,
            by: Math.round(s.ball.y * 10) / 10,
            bvx: Math.round(s.ball.vx * 100) / 100,
            bvy: Math.round(s.ball.vy * 100) / 100,
            speed: s.ball.speed,
            p1y: Math.round(s.p1.y),
            s1: s.p1Score,
            s2: s.p2Score,
            rally: s.rally
          });
        }
      } else if (data.type === 'pong_paddle') {
        const s = stateRef.current;
        if (playerRole === 'host') {
          s.p2.targetY = data.payload.y;
        } else {
          s.p1.targetY = data.payload.y;
        }
      } else if (data.type === 'pong_p2_hit') {
        // Khách (P2) thông báo đã đón đỡ bóng thành công
        if (playerRole === 'host') {
          const s = stateRef.current;
          s.p2.targetY = data.payload.y;
          s.p2.y = data.payload.y;

          if (!s.isServing && s.isPlaying) {
            const hitOffset = data.payload.hitOffset ?? ((data.payload.ballY - (s.p2.y + s.p2.h / 2)) / (s.p2.h / 2));
            const clampedOffset = Math.max(-1, Math.min(1, hitOffset));
            const angle = clampedOffset * (Math.PI / 3);
            s.ball.speed = Math.min(15.0, (data.payload.speed || s.ball.speed) + 0.35);
            s.ball.vx = -s.ball.speed * Math.cos(angle);
            s.ball.vy = s.ball.speed * Math.sin(angle);
            s.ball.x = s.p2.x - s.ball.radius - 4;
            if (data.payload.ballY !== undefined) {
              s.ball.y = data.payload.ballY;
            }

            s.rally++;
            setRallyCount(s.rally);
            playTone(520 + Math.min(s.rally * 30, 400), 'triangle', 0.08);
            spawnSparks(s.ball.x, s.ball.y, '#f43f5e', 14);

            // Gửi xác nhận trạng thái bóng mới ngay lập tức
            multiplayer.sendAction('pong_state', {
              bx: Math.round(s.ball.x * 10) / 10,
              by: Math.round(s.ball.y * 10) / 10,
              bvx: Math.round(s.ball.vx * 100) / 100,
              bvy: Math.round(s.ball.vy * 100) / 100,
              speed: s.ball.speed,
              p1y: Math.round(s.p1.y),
              s1: s.p1Score,
              s2: s.p2Score,
              rally: s.rally,
              sound: 'hit'
            });
          }
        }
      } else if (data.type === 'pong_serve_wait') {
        if (playerRole === 'guest') {
          const s = stateRef.current;
          s.isPlaying = true;
          setIsPlaying(true);
          s.ball.x = s.cw / 2;
          s.ball.y = s.ch / 2;
          s.ball.vx = 0;
          s.ball.vy = 0;
          s.ball.trail = [];
          s.p1Score = data.payload.s1 ?? s.p1Score;
          s.p2Score = data.payload.s2 ?? s.p2Score;
          setP1Score(s.p1Score);
          setP2Score(s.p2Score);
          setServeNotice('CHUẨN BỊ...');
        }
      } else if (data.type === 'pong_serve_launch') {
        if (playerRole === 'guest') {
          const s = stateRef.current;
          s.isPlaying = true;
          setIsPlaying(true);
          s.ball.x = data.payload.bx;
          s.ball.y = data.payload.by;
          s.ball.vx = data.payload.bvx;
          s.ball.vy = data.payload.bvy;
          s.ball.speed = data.payload.speed;
          s.ball.trail = [];
          s.p1Score = data.payload.s1;
          s.p2Score = data.payload.s2;
          s.rally = data.payload.rally;
          setP1Score(data.payload.s1);
          setP2Score(data.payload.s2);
          setRallyCount(data.payload.rally);
          setServeNotice(null);
          playTone(480, 'sine', 0.1);
        }
      } else if (data.type === 'pong_state') {
        if (playerRole === 'guest') {
          const s = stateRef.current;
          const now = performance.now();
          const justHit = (now - lastGuestHitTimeRef.current < 260);

          // Tự động khôi phục và xóa thông báo chuẩn bị nếu bóng đã được host phát đi
          s.isPlaying = true;
          setIsPlaying(true);
          if (data.payload.bvx !== 0 || data.payload.bvy !== 0) {
            s.isServing = false;
            setServeNotice(null);
          }

          // Cập nhật vị trí bóng với cơ chế Dead-Reckoning (khử giật lùi vị trí qua mạng)
          if (!justHit || data.payload.bvx < 0) {
            s.ball.vx = data.payload.bvx;
            s.ball.vy = data.payload.bvy;
            s.ball.speed = data.payload.speed || s.ball.speed;

            const dx = data.payload.bx - s.ball.x;
            const dy = data.payload.by - s.ball.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 80) {
              s.ball.x = data.payload.bx;
              s.ball.y = data.payload.by;
            } else {
              s.ball.x += dx * 0.45;
              s.ball.y += dy * 0.45;
            }
          }

          s.p1.targetY = data.payload.p1y;
          s.p1Score = data.payload.s1;
          s.p2Score = data.payload.s2;
          s.rally = data.payload.rally;
          setP1Score(data.payload.s1);
          setP2Score(data.payload.s2);
          setRallyCount(data.payload.rally);
          if (data.payload.sound === 'hit') {
            playTone(580, 'triangle', 0.08);
            spawnSparks(s.p1.x + s.p1.w, s.ball.y, '#22d3ee', 10);
          } else if (data.payload.sound === 'bounce') {
            playTone(420, 'sine', 0.05);
            spawnSparks(s.ball.x, s.ball.y, '#38bdf8', 6);
          }
        }
      } else if (data.type === 'pong_goal') {
        const s = stateRef.current;
        s.p1Score = data.payload.s1;
        s.p2Score = data.payload.s2;
        setP1Score(data.payload.s1);
        setP2Score(data.payload.s2);
        s.shake = 12;
        if (data.payload.scorer === 'p1') {
          playTone(680, 'sawtooth', 0.25);
          spawnSparks(s.cw - 10, s.ch / 2, '#22d3ee', 30);
        } else {
          playTone(180, 'sawtooth', 0.25);
          spawnSparks(10, s.ch / 2, '#f43f5e', 30);
        }
      } else if (data.type === 'pong_game_over') {
        setIsPlaying(false);
        setWinner(data.payload.winner);
        setIsGameOver(true);
        const amIWinner = (playerRole === 'host' && data.payload.winner === 'p1') || (playerRole === 'guest' && data.payload.winner === 'p2');
        if (amIWinner) {
          soundManager.playVictory();
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          try {
            const wins = parseInt(localStorage.getItem('acegames_pong_wins') || '0', 10);
            localStorage.setItem('acegames_pong_wins', (wins + 1).toString());
          } catch {}
        } else {
          soundManager.playDefeat();
        }
      } else if (data.type === 'game_restart') {
        // Đối thủ yêu cầu chơi lại
        resetGame(false);
      }
    };

    const handleStatus = (status: string) => {
      if (status === 'connected') {
        const opp = multiplayer.getOpponent();
        if (opp?.name) setOpponentName(opp.name);
        const s = stateRef.current;
        s.isWaitingForFriend = false;
        s.isOnlineMode = true;
        setIsWaitingForFriend(false);
        setIsOnlineMode(true);
        soundManager.playGameLaunch();

        // Nếu là Host: đợi 350ms để đảm bảo MQTT kết nối 2 chiều ổn định rồi phát bóng
        if (s.playerRole === 'host') {
          setTimeout(() => {
            resetGame(false);
          }, 350);
        } else {
          resetGame(false);
        }
      } else if (status === 'disconnected') {
        if (stateRef.current.isOnlineMode && !stateRef.current.isWaitingForFriend) {
          setIsOpponentLeftModalOpen(true);
        }
      }
    };

    multiplayer.onMove(handleMessage);
    multiplayer.onStatusChange(handleStatus);

    return () => {
      multiplayer.offMove(handleMessage);
      multiplayer.offStatusChange(handleStatus);
    };
  }, [isOnlineMode, isWaitingForFriend, playerRole, resetGame, playTone, spawnSparks]);

  // Rời phòng an toàn CHỈ KHI component unmount thực sự
  const isOnlineModeRef = useRef(isOnlineMode);
  isOnlineModeRef.current = isOnlineMode;

  useEffect(() => {
    return () => {
      if (isOnlineModeRef.current) {
        multiplayer.leaveRoom();
      }
    };
  }, []);

  // Xử lý phím bấm điều khiển
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.key === 'w' || e.key === 'W') k.w = true;
      if (e.key === 's' || e.key === 'S') k.s = true;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        k.up = true;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        k.down = true;
      }
      if (e.key === ' ' && !stateRef.current.isPlaying && !isWaitingForFriend) {
        e.preventDefault();
        resetGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.key === 'w' || e.key === 'W') k.w = false;
      if (e.key === 's' || e.key === 'S') k.s = false;
      if (e.key === 'ArrowUp') k.up = false;
      if (e.key === 'ArrowDown') k.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetGame, isWaitingForFriend]);

  // Điều khiển chuột & chạm trên bàn đấu
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isWaitingForFriend) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = stateRef.current.ch / rect.height;
    const pointerY = (e.clientY - rect.top) * scaleY;

    const s = stateRef.current;
    if (!isOnlineMode || playerRole === 'host') {
      // Đấu máy hoặc Chủ phòng: điều khiển P1 (bên trái)
      s.p1.targetY = Math.max(0, Math.min(s.ch - s.p1.h, pointerY - s.p1.h / 2));
      s.p1.y = s.p1.targetY;
      if (isOnlineMode && !isWaitingForFriend) {
        sendPaddleThrottled(s.p1.y);
      }
    } else {
      // Khách Online: điều khiển P2 (bên phải)
      s.p2.targetY = Math.max(0, Math.min(s.ch - s.p2.h, pointerY - s.p2.h / 2));
      s.p2.y = s.p2.targetY;
      sendPaddleThrottled(s.p2.y);
    }
  };

  // Cập nhật vật lý & trạng thái trò chơi (chạy liên tục 60 FPS cả khi tab ở nền)
  const updateGamePhysics = useCallback((dt: number) => {
    const s = stateRef.current;
    const { cw, ch, p1, p2, ball } = s;

    // Cập nhật vị trí thanh đỡ & bóng nếu đang chơi và không tạm dừng
    if (!s.isPlaying || s.isPaused || s.isWaitingForFriend) return;

    // --- 1. Cập nhật thanh đỡ P1 ---
    if (!s.isOnlineMode || s.playerRole === 'host') {
      if (s.keys.w || s.keys.up) p1.y = Math.max(0, p1.y - p1.speed * dt);
      if (s.keys.s || s.keys.down) p1.y = Math.min(ch - p1.h, p1.y + p1.speed * dt);
      if (s.isOnlineMode && !s.isWaitingForFriend && (s.keys.w || s.keys.s || s.keys.up || s.keys.down)) {
        sendPaddleThrottled(p1.y);
      }
    } else {
      // Khách: thanh P1 thuộc Host, lướt mượt mà tới vị trí nhận từ mạng
      p1.y += (p1.targetY - p1.y) * Math.min(1.0, 0.55 * dt);
    }

    // --- 2. Cập nhật thanh đỡ P2 (Máy hoặc Khách Online) ---
    if (!s.isOnlineMode) {
      // Trí tuệ nhân tạo (AI) bám bóng
      const targetY = ball.y - p2.h / 2;
      const diffY = targetY - p2.y;
      if (ball.vx > 0 || ball.x > cw * 0.45) {
        if (Math.abs(diffY) > 8) {
          p2.y += Math.sign(diffY) * Math.min(Math.abs(diffY), p2.speed * dt);
        }
      }
      p2.y = Math.max(0, Math.min(ch - p2.h, p2.y));
    } else if (s.playerRole === 'guest') {
      // Khách điều khiển P2 bằng phím W/S hoặc Mũi tên
      if (s.keys.w || s.keys.up) p2.y = Math.max(0, p2.y - p2.speed * dt);
      if (s.keys.s || s.keys.down) p2.y = Math.min(ch - p2.h, p2.y + p2.speed * dt);

      // Gửi cập nhật vị trí thanh đỡ P2 sang Host (có throttle)
      sendPaddleThrottled(p2.y);
    } else {
      // Host: thanh P2 thuộc Khách, lướt mượt mà tới vị trí nhận từ mạng
      p2.y += (p2.targetY - p2.y) * Math.min(1.0, 0.55 * dt);
    }

        // --- 3. Vật lý bóng (Chỉ Host hoặc Offline tính toán chính thức) ---
        const isPhysicsMaster = !s.isOnlineMode || s.playerRole === 'host';

        if (isPhysicsMaster) {
          if (!s.isServing) {
            ball.x += ball.vx * dt;
            ball.y += ball.vy * dt;

            // Bật tường trên & dưới
            let bounced = false;
            if (ball.y - ball.radius <= 0) {
              ball.y = ball.radius;
              ball.vy = Math.abs(ball.vy);
              bounced = true;
            } else if (ball.y + ball.radius >= ch) {
              ball.y = ch - ball.radius;
              ball.vy = -Math.abs(ball.vy);
              bounced = true;
            }

            if (bounced) {
              playTone(420, 'sine', 0.05);
              spawnSparks(ball.x, ball.y, '#38bdf8', 6);
            }

            // Va chạm thanh đỡ 1 (Bên Trái - Xanh Cyan - Quét liên tục tránh lọt bóng)
            let hit = false;
            if (
              ball.vx < 0 &&
              ball.x - ball.radius <= p1.x + p1.w + 6 &&
              ball.x + ball.radius >= p1.x - 8 &&
              ball.y >= p1.y - ball.radius - 8 &&
              ball.y <= p1.y + p1.h + ball.radius + 8
            ) {
              ball.x = p1.x + p1.w + ball.radius;
              const hitOffset = (ball.y - (p1.y + p1.h / 2)) / (p1.h / 2);
              const angle = hitOffset * (Math.PI / 3);
              ball.speed = Math.min(15.0, ball.speed + 0.35);
              ball.vx = ball.speed * Math.cos(angle);
              ball.vy = ball.speed * Math.sin(angle);

              s.rally++;
              setRallyCount(s.rally);
              playTone(580 + Math.min(s.rally * 30, 400), 'triangle', 0.08);
              spawnSparks(ball.x, ball.y, '#22d3ee', 12);
              hit = true;
            }

            // Va chạm thanh đỡ 2 (Bên Phải - Đỏ Rose - Quét liên tục tránh lọt bóng)
            if (
              ball.vx > 0 &&
              ball.x + ball.radius >= p2.x - 6 &&
              ball.x - ball.radius <= p2.x + p2.w + 8 &&
              ball.y >= p2.y - ball.radius - 8 &&
              ball.y <= p2.y + p2.h + ball.radius + 8
            ) {
              ball.x = p2.x - ball.radius;
              const hitOffset = (ball.y - (p2.y + p2.h / 2)) / (p2.h / 2);
              const angle = hitOffset * (Math.PI / 3);
              ball.speed = Math.min(15.0, ball.speed + 0.35);
              ball.vx = -ball.speed * Math.cos(angle);
              ball.vy = ball.speed * Math.sin(angle);

              s.rally++;
              setRallyCount(s.rally);
              playTone(520 + Math.min(s.rally * 30, 400), 'triangle', 0.08);
              spawnSparks(ball.x, ball.y, '#f43f5e', 12);
              hit = true;
            }

            // Ghi bàn (Bóng lọt qua khung thành với vùng đệm triệt tiêu độ trễ mạng)
            if (ball.x + ball.radius < -25) {
              // P2 ghi bàn!
              s.p2Score++;
              setP2Score(s.p2Score);
              s.shake = 12;
              playTone(180, 'sawtooth', 0.25);
              spawnSparks(10, s.ch / 2, '#f43f5e', 30);

              if (s.isOnlineMode) {
                multiplayer.sendAction('pong_goal', { s1: s.p1Score, s2: s.p2Score, scorer: 'p2' });
              }

              if (s.p2Score >= s.targetScore) {
                s.isPlaying = false;
                setIsPlaying(false);
                setWinner('p2');
                setIsGameOver(true);
                if (s.isOnlineMode) {
                  multiplayer.sendAction('pong_game_over', { winner: 'p2' });
                }
                soundManager.playDefeat();
              } else {
                launchServe(true);
              }
            } else if (ball.x - ball.radius > (s.isOnlineMode ? cw + 95 : cw + 25)) {
              // P1 ghi bàn (thêm vùng đệm 95px khi online để khách kịp gửi tín hiệu đỡ bóng qua mạng)
              s.p1Score++;
              setP1Score(s.p1Score);
              s.shake = 12;
              playTone(680, 'sawtooth', 0.25);
              spawnSparks(s.cw - 10, s.ch / 2, '#22d3ee', 30);

              if (s.isOnlineMode) {
                multiplayer.sendAction('pong_goal', { s1: s.p1Score, s2: s.p2Score, scorer: 'p1' });
              }

              if (s.p1Score >= s.targetScore) {
                s.isPlaying = false;
                setIsPlaying(false);
                setWinner('p1');
                setIsGameOver(true);
                if (s.isOnlineMode) {
                  multiplayer.sendAction('pong_game_over', { winner: 'p1' });
                }
                soundManager.playVictory();
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                try {
                  const wins = parseInt(localStorage.getItem('acegames_pong_wins') || '0', 10);
                  localStorage.setItem('acegames_pong_wins', (wins + 1).toString());
                } catch {}
              } else {
                launchServe(false);
              }
            }

            // Đồng bộ trạng thái bóng sang khách qua mạng (30 Hz ~33.3ms khi bóng tự do, 0ms tức thì khi va chạm)
            if (s.isOnlineMode && !s.isWaitingForFriend) {
              const now = performance.now();
              if (hit || bounced || now - lastSyncTimeRef.current >= 33.3) {
                lastSyncTimeRef.current = now;
                multiplayer.sendAction('pong_state', {
                  bx: Math.round(ball.x * 10) / 10,
                  by: Math.round(ball.y * 10) / 10,
                  bvx: Math.round(ball.vx * 100) / 100,
                  bvy: Math.round(ball.vy * 100) / 100,
                  speed: ball.speed,
                  p1y: Math.round(p1.y),
                  s1: s.p1Score,
                  s2: s.p2Score,
                  rally: s.rally,
                  sound: hit ? 'hit' : bounced ? 'bounce' : undefined
                });
              }
            }
          }
        } else {
          // Phía khách: Dự đoán di chuyển mượt mà & phản hồi va chạm cục bộ tức thì!
          ball.x += ball.vx * dt;
          ball.y += ball.vy * dt;
          if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = Math.abs(ball.vy);
            playTone(420, 'sine', 0.05);
          } else if (ball.y + ball.radius >= ch) {
            ball.y = ch - ball.radius;
            ball.vy = -Math.abs(ball.vy);
            playTone(420, 'sine', 0.05);
          }

          // Kiểm tra va chạm P2 ngay trên máy khách (Client-side Hit Prediction chống lọt bóng)
          if (
            ball.vx > 0 &&
            ball.x + ball.radius >= p2.x - 6 &&
            ball.x - ball.radius <= p2.x + p2.w + 8 &&
            ball.y >= p2.y - ball.radius - 8 &&
            ball.y <= p2.y + p2.h + ball.radius + 8
          ) {
            lastGuestHitTimeRef.current = performance.now();
            ball.x = p2.x - ball.radius;
            const hitOffset = (ball.y - (p2.y + p2.h / 2)) / (p2.h / 2);
            const clampedOffset = Math.max(-1, Math.min(1, hitOffset));
            const angle = clampedOffset * (Math.PI / 3);
            ball.speed = Math.min(15.0, ball.speed + 0.35);
            ball.vx = -ball.speed * Math.cos(angle);
            ball.vy = ball.speed * Math.sin(angle);

            s.rally++;
            setRallyCount(s.rally);
            playTone(520 + Math.min(s.rally * 30, 400), 'triangle', 0.08);
            spawnSparks(ball.x, ball.y, '#f43f5e', 14);

            // Báo ngay sang Host để đồng bộ
            multiplayer.sendAction('pong_p2_hit', {
              y: Math.round(p2.y),
              ballY: Math.round(ball.y),
              hitOffset: Math.round(clampedOffset * 100) / 100,
              speed: Math.round(ball.speed * 10) / 10,
              bvx: Math.round(ball.vx * 100) / 100,
              bvy: Math.round(ball.vy * 100) / 100
            });
          }

          // Giới hạn an toàn trên máy khách
          ball.x = Math.max(-30, Math.min(cw + 30, ball.x));
        }

        // Thêm điểm vệt sáng đuôi bóng
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 8) ball.trail.shift();

        // Cập nhật hạt bụi tia lửa
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += dt;
        if (p.life >= p.maxLife) {
          s.particles.splice(i, 1);
        }
      }

      if (s.shake > 0) s.shake = Math.max(0, s.shake - dt);
  }, [playTone, spawnSparks, launchServe, sendPaddleThrottled]);

  // Vẽ đồ họa bàn bóng bàn lên Canvas
  const renderCanvas = useCallback((ctx: CanvasRenderingContext2D) => {
      const s = stateRef.current;
      const { cw, ch, p1, p2, ball } = s;

      // --- VẼ GIAO DIỆN SÂN ĐẤU CANVAS ---
      ctx.save();

      // Rung màn hình khi ghi bàn
      if (s.shake > 0) {
        const dx = (Math.random() - 0.5) * s.shake;
        const dy = (Math.random() - 0.5) * s.shake;
        ctx.translate(dx, dy);
      }

      // Nền đen vũ trụ
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, cw, ch);

      // Lưới Cyberpunk chìm
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < cw; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ch);
        ctx.stroke();
      }
      for (let y = 0; y < ch; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }

      // Vạch kẻ sân trung tâm dạng nét đứt Neon (x = 480)
      ctx.setLineDash([12, 14]);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cw / 2, 0);
      ctx.lineTo(cw / 2, ch);
      ctx.stroke();
      ctx.setLineDash([]);

      // Điểm số Neon khổng lồ in chìm dưới nền
      ctx.font = '900 110px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Điểm P1 (Bên Trái - Xanh Cyan)
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.fillText(s.p1Score.toString(), cw / 4, ch / 2);
      
      // Điểm P2 (Bên Phải - Đỏ Rose)
      ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
      ctx.fillText(s.p2Score.toString(), (3 * cw) / 4, ch / 2);

      // Vẽ vệt sáng đuôi bóng
      if (s.isPlaying && !s.isServing) {
        for (let i = 0; i < ball.trail.length; i++) {
          const pt = ball.trail[i];
          const alpha = (i + 1) / (ball.trail.length * 2.5);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, ball.radius * (0.4 + 0.6 * (i / ball.trail.length)), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
          ctx.fill();
        }
      }

      // Vẽ quả bóng tỏa sáng
      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();

      // Vẽ thanh đỡ P1 (Trái - Xanh Cyan)
      ctx.save();
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.roundRect(p1.x, p1.y, p1.w, p1.h, 6);
      ctx.fill();
      ctx.fillStyle = '#a5f3fc';
      ctx.beginPath();
      ctx.roundRect(p1.x + 2, p1.y + 4, p1.w - 4, p1.h - 8, 3);
      ctx.fill();
      ctx.restore();

      // Vẽ thanh đỡ P2 (Phải - Đỏ Rose)
      ctx.save();
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.roundRect(p2.x, p2.y, p2.w, p2.h, 6);
      ctx.fill();
      ctx.fillStyle = '#fecdd3';
      ctx.beginPath();
      ctx.roundRect(p2.x + 2, p2.y + 4, p2.w - 4, p2.h - 8, 3);
      ctx.fill();
      ctx.restore();

      // Vẽ các hạt tia lửa
      for (const p of s.particles) {
        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

    ctx.restore();
  }, []);

  // Vòng lặp chính 60 FPS tích hợp Web Worker ticker (Chống trình duyệt đóng băng ở background)
  useEffect(() => {
    const workerScript = `
      let intervalId = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (!intervalId) {
            intervalId = setInterval(function() {
              self.postMessage('tick');
            }, 16.666);
          }
        } else if (e.data === 'stop') {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      };
    `;
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    let worker: Worker | null = null;
    try {
      worker = new Worker(workerUrl);
    } catch {
      worker = null;
    }

    let lastPhysicsTime = performance.now();
    let animId: number;

    // Worker tick xử lý vật lý & mạng 60 FPS liên tục không bao giờ bị dừng
    if (worker) {
      worker.onmessage = () => {
        const now = performance.now();
        const rawDt = (now - lastPhysicsTime) / 16.666;
        lastPhysicsTime = now;
        const dt = Math.max(0.1, Math.min(rawDt, 3.0));
        updateGamePhysics(dt);

        // Vẽ luôn canvas nếu tab đang bị nền (khi requestAnimationFrame bị trình duyệt tạm dừng)
        if (document.hidden) {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) renderCanvas(ctx);
          }
        }
      };
      worker.postMessage('start');
    }

    // Vòng lặp render V-Sync khi tab hiển thị
    const renderLoop = () => {
      const now = performance.now();
      if (!worker) {
        const rawDt = (now - lastPhysicsTime) / 16.666;
        lastPhysicsTime = now;
        const dt = Math.max(0.1, Math.min(rawDt, 3.0));
        updateGamePhysics(dt);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) renderCanvas(ctx);
      }
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      if (worker) {
        worker.postMessage('stop');
        worker.terminate();
      }
      URL.revokeObjectURL(workerUrl);
    };
  }, [updateGamePhysics, renderCanvas]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-hidden bg-[#070b14]">
      {/* Top HUD: Căn giữa tuyệt đối VÙNG 1 so với trục tâm sân đấu */}
      <div className="game-top-hud relative flex items-center justify-between w-full max-w-[min(98vw,1440px)] px-3 sm:px-6 py-2 rounded-2xl bg-slate-900/95 border border-white/10 shadow-lg flex-shrink-0 mb-2 min-h-[52px]">
        {/* Khối Trái: Đấu Máy / Chơi Online hoặc Mã Phòng / Rời Bàn */}
        <div className="flex items-center gap-2 sm:gap-4 z-10">
          {isOnlineMode || isWaitingForFriend ? (
            /* Khi đang trong trận Online: Bấm vào tên phòng là copy ngay link mời */
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyInvite}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono font-black text-xs transition cursor-pointer active:scale-95 shadow-sm"
                title="Bấm để sao chép link mời"
              >
                {isOnlineMode && !isWaitingForFriend ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400/40" />
                )}
                <span>{copiedInvite ? '✓ ĐÃ COPY!' : `PHÒNG: ${onlineRoom?.roomId || ''}`}</span>
              </button>

              <button
                onClick={handleLeaveRoom}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs border border-rose-500/30 shadow-sm transition cursor-pointer active:scale-95"
                title="Rời khỏi phòng đấu"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Rời Bàn</span>
              </button>
            </div>
          ) : (
            /* Khi chơi bình thường (Đấu Máy) */
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Cấp độ máy AI */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-cyan-300 font-bold text-xs">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Đấu Máy:</span>
                </div>
                {(['easy', 'medium', 'hard'] as PongDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDifficulty(d);
                      resetGame();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      difficulty === d
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {d === 'easy' ? 'Dễ' : d === 'medium' ? 'Vừa' : 'Khó'}
                  </button>
                ))}
              </div>

              {/* Nút Chơi Online dùng chung như Cờ Tướng */}
              <button
                onClick={() => setIsLobbyOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition cursor-pointer active:scale-95 shadow-sm"
                title="Tạo phòng mời bạn bè hoặc chơi online qua mạng"
              >
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Chơi Online</span>
              </button>
            </div>
          )}
        </div>

        {/* VÙNG 1: TỶ SỐ TRỰC TIẾP / TRẠNG THÁI CHỜ - CĂN CHÍNH GIỮA TUYỆT ĐỐI 100% THEO TÂM SÂN ĐẤU */}
        {isWaitingForFriend ? (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(245,158,11,0.25)] whitespace-nowrap z-0 pointer-events-none">
            <Timer className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="tracking-wide">CHỜ ĐỐI THỦ...</span>
          </div>
        ) : (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[340px] sm:w-[420px] h-full flex items-center justify-center z-0 pointer-events-none select-none">
            {/* Dấu hai chấm neo tuyệt đối tại chính giữa 50% trục sân đấu */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <span className="text-gray-400 font-black text-base sm:text-lg select-none">:</span>
            </div>

            {/* Bên Trái: Xanh Cyan (Host / P1) - Neo từ 50% mở rộng sang trái */}
            <div className="absolute right-[calc(50%+12px)] top-1/2 -translate-y-1/2 flex items-center justify-end gap-2 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] shrink-0" />
              <span className="text-xs sm:text-sm font-black text-cyan-400 tracking-wide max-w-[85px] sm:max-w-[130px] truncate text-right">
                {isOnlineMode ? (playerRole === 'host' ? 'BẠN' : opponentName.toUpperCase()) : 'BẠN'}
              </span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono w-7 text-right">{p1Score}</span>
            </div>

            {/* Bên Phải: Đỏ Rose (Guest / P2 / Máy) - Neo từ 50% mở rộng sang phải */}
            <div className="absolute left-[calc(50%+12px)] top-1/2 -translate-y-1/2 flex items-center justify-start gap-2 whitespace-nowrap">
              <span className="text-xl sm:text-2xl font-black text-white font-mono w-7 text-left">{p2Score}</span>
              <span className="text-xs sm:text-sm font-black text-rose-400 tracking-wide max-w-[85px] sm:max-w-[130px] truncate text-left">
                {isOnlineMode ? (playerRole === 'guest' ? 'BẠN' : opponentName.toUpperCase()) : 'MÁY'}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] shrink-0" />
            </div>
          </div>
        )}

        {/* Khối Phải: Điểm thắng, Tạm dừng, Ván mới */}
        <div className="flex items-center gap-2 z-10">
          {rallyCount > 2 && (
            <span className="hidden xl:inline-flex items-center px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-mono text-xs font-bold shadow-sm">
              Đường bóng: {rallyCount}
            </span>
          )}
          {!isOnlineMode && (
            <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
              {[5, 7, 11].map((pts) => (
                <button
                  key={pts}
                  onClick={() => {
                    setTargetScore(pts);
                    resetGame();
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    targetScore === pts
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={`Chạm ${pts} điểm để thắng`}
                >
                  {pts}đ
                </button>
              ))}
            </div>
          )}

          {!isOnlineMode && (
            <button
              onClick={() => setIsPaused(prev => !prev)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
              title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => resetGame()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title="Ván Mới"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sân đấu rạp phim 16:9 khổng lồ */}
      <div className="game-arena-box relative w-full aspect-[16/9] max-w-[min(98vw,1440px)] max-h-[calc(100dvh-130px)] bg-slate-950 rounded-3xl overflow-hidden border-4 border-cyan-500/50 shadow-[0_0_60px_rgba(6,182,212,0.35)] touch-none flex-1 min-h-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          onPointerMove={handlePointerMove}
          className="w-full h-full block cursor-pointer"
        />

        {/* Thông báo chuẩn bị giao bóng */}
        {serveNotice && !isWaitingForFriend && isPlaying && !isGameOver && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-cyan-500/25 border border-cyan-400/50 text-cyan-300 text-xs sm:text-sm font-black tracking-widest uppercase animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.5)] z-20 pointer-events-none">
            {serveNotice}
          </div>
        )}



        {/* Màn hình tạm dừng (Offline) */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-30">
            <Pause className="w-14 h-14 text-cyan-400 animate-pulse" />
            <span className="text-2xl font-black text-white uppercase tracking-wider">ĐANG TẠM DỪNG</span>
            <button
              onClick={() => setIsPaused(false)}
              className="px-8 py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-base uppercase tracking-wider transition cursor-pointer active:scale-95 shadow-lg shadow-cyan-500/40"
            >
              Tiếp Tục
            </button>
          </div>
        )}

        {/* Màn hình kết thúc trận đấu */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-in fade-in">
            <div className="w-full max-w-sm bg-gradient-to-b from-[#0f172a] via-[#0b1120] to-[#070b14] border-2 border-cyan-500/50 rounded-3xl p-6 text-center shadow-[0_0_60px_rgba(6,182,212,0.35)] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Trophy className={`w-8 h-8 ${winner === 'p1' ? 'text-cyan-400' : 'text-rose-400'} animate-bounce`} />
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
                  {isOnlineMode ? (
                    ((playerRole === 'host' && winner === 'p1') || (playerRole === 'guest' && winner === 'p2'))
                      ? 'BẠN CHIẾN THẮNG!'
                      : 'ĐỐI THỦ CHIẾN THẮNG!'
                  ) : (
                    winner === 'p1' ? 'BẠN CHIẾN THẮNG!' : 'MÁY CHIẾN THẮNG!'
                  )}
                </h3>
                <p className="text-sm text-gray-300 font-semibold mt-1">
                  Tỷ số chung cuộc: <strong className="text-cyan-400 font-mono text-base">{p1Score}</strong> - <strong className="text-rose-400 font-mono text-base">{p2Score}</strong>
                </p>
              </div>

              <button
                onClick={() => resetGame()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-base shadow-lg shadow-cyan-500/40 transition cursor-pointer active:scale-95 uppercase tracking-wider"
              >
                Chơi Ván Mới
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Sảnh Chơi Online (Dùng chung chuẩn hệ thống) */}
      <OnlineLobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        gameId="pong"
        gameTitle="Bóng Bàn"
        onJoinedMatch={(room, role) => {
          const s = stateRef.current;
          s.isOnlineMode = true;
          s.playerRole = role;
          s.isWaitingForFriend = false;
          setIsOnlineMode(true);
          setOnlineRoom(room);
          setPlayerRole(role);
          const opp = multiplayer.getOpponent();
          if (opp?.name) setOpponentName(opp.name);
          else if (role === 'guest' && room.hostName) setOpponentName(room.hostName);
          setIsWaitingForFriend(false);
          resetGame(false);
        }}
        onWaitingInBackground={(room) => {
          if (serveTimerRef.current) clearTimeout(serveTimerRef.current);
          const s = stateRef.current;
          s.isPlaying = false;
          s.isWaitingForFriend = true;
          s.ball.x = s.cw / 2;
          s.ball.y = s.ch / 2;
          s.ball.vx = 0;
          s.ball.vy = 0;
          s.ball.trail = [];
          s.p1.y = s.ch / 2 - s.p1.h / 2;
          s.p2.y = s.ch / 2 - s.p2.h / 2;
          setP1Score(0);
          setP2Score(0);
          setServeNotice(null);
          setIsPlaying(false);
          setOnlineRoom(room);
          setPlayerRole('host');
          setIsOnlineMode(true);
          setIsWaitingForFriend(true);
          setIsLobbyOpen(false);
        }}
      />

      {/* Modal Thông Báo Đối Thủ Đã Rời Bàn */}
      <OpponentLeftModal
        isOpen={isOpponentLeftModalOpen}
        opponentName={opponentName}
        onClose={() => {
          setIsOpponentLeftModalOpen(false);
          handleLeaveRoom();
        }}
        onFindNewMatch={() => {
          setIsOpponentLeftModalOpen(false);
          handleLeaveRoom();
          setIsLobbyOpen(true);
        }}
      />
    </div>
  );
};