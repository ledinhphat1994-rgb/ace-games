import mqtt, { type MqttClient } from 'mqtt';

export interface RoomInfo {
  roomId: string;
  gameId: string;
  hostName: string;
  hostId: string;
  status: 'waiting' | 'playing';
  createdAt: number;
  options?: Record<string, any>;
}

export interface PlayerInfo {
  id: string;
  name: string;
  role: 'host' | 'guest'; // host = X / Đỏ / Trắng, guest = O / Đen
}

export type MoveCallback = (data: {
  type: string;
  payload: any;
  senderId: string;
  senderName: string;
}) => void;

// Danh sách Broker dự phòng tốc độ cao hỗ trợ WebSocket TLS (HiveMQ & Mosquitto đạt 100% chuyển phát không giới hạn tần số)
const BROKER_URLS = [
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081',
  'wss://broker.emqx.io:8084/mqtt',
];

class MultiplayerService {
  private client: MqttClient | null = null;
  private currentRoom: RoomInfo | null = null;
  private currentRole: 'host' | 'guest' | null = null;
  private opponent: { id: string; name: string } | null = null;
  private moveListeners: MoveCallback[] = [];
  private roomUpdateListeners: ((rooms: RoomInfo[]) => void)[] = [];
  private statusListeners: ((status: 'idle' | 'searching' | 'waiting_opponent' | 'connected' | 'disconnected') => void)[] = [];
  private localPlayerId: string;
  private activeRooms: Map<string, RoomInfo> = new Map();
  private heartbeatTimer: any = null;
  private cleanupTimer: any = null;
  private currentGameId: string = 'caro';

  // Quản lý Broker Failover & Tự phục hồi kết nối
  private currentBrokerIndex: number = 0;
  private isLobbyListening: boolean = false;
  private connectPromise: Promise<MqttClient> | null = null;
  private consecutiveFailures: number = 0;

  constructor() {
    // Unique in-memory client ID per tab/window so 2 tabs in same browser can play against each other smoothly
    this.localPlayerId = 'p_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36).slice(-4);
  }

  public getPlayerId(): string {
    return this.localPlayerId;
  }

  private inMemoryName: string | null = null;

  public getPlayerName(): string {
    if (this.inMemoryName) return this.inMemoryName;
    try {
      const saved = sessionStorage.getItem('ace_player_name');
      if (saved) {
        this.inMemoryName = saved;
        return saved;
      }
    } catch {}
    const animals = ['KỳThủ', 'CaoThủ', 'BạchHổ', 'HắcBáo', 'ChiếnBinh', 'HiệpSĩ', 'PhượngHoàng', 'ĐạiBàng'];
    const chosen = animals[Math.floor(Math.random() * animals.length)];
    const randomName = `${chosen}_${Math.floor(10 + Math.random() * 90)}`;
    this.inMemoryName = randomName;
    try {
      sessionStorage.setItem('ace_player_name', randomName);
    } catch {}
    return randomName;
  }

  public setPlayerName(name: string) {
    const clean = name.trim() || this.getPlayerName();
    this.inMemoryName = clean;
    try {
      sessionStorage.setItem('ace_player_name', clean);
    } catch {}
  }

  public getRandomNewName(): string {
    const animals = ['KỳThủ', 'CaoThủ', 'BạchHổ', 'HắcBáo', 'ChiếnBinh', 'HiệpSĩ', 'PhượngHoàng', 'ĐạiBàng'];
    const chosen = animals[Math.floor(Math.random() * animals.length)];
    const num = Math.floor(10 + Math.random() * 90);
    const newName = `${chosen}_${num}`;
    this.setPlayerName(newName);
    return newName;
  }

  // --- TOPIC HELPERS (Version 3: Cách ly tuyệt đối theo gameId) ---
  private getLobbyTopic(gameId?: string): string {
    const gid = gameId || this.currentGameId;
    return `acegames/v3/${gid}/lobby`;
  }

  private getRoomTopic(roomId?: string, gameId?: string): string {
    const gid = gameId || this.currentRoom?.gameId || this.currentGameId;
    const rid = roomId || this.currentRoom?.roomId;
    return `acegames/v3/${gid}/room/${rid}`;
  }

  // --- KẾT NỐI VÀ CHUYỂN ĐỔI BROKER DỰ PHÒNG KHI CÓ SỰ CỐ ---
  private ensureConnected(): Promise<MqttClient> {
    if (this.client && this.client.connected) {
      return Promise.resolve(this.client);
    }
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise((resolve) => {
      let isSettled = false;

      const attemptConnection = () => {
        const brokerUrl = BROKER_URLS[this.currentBrokerIndex];
        const clientId = `ace_${this.localPlayerId}_${Math.random().toString(16).slice(2, 8)}`;

        const client = mqtt.connect(brokerUrl, {
          clientId,
          clean: true,
          connectTimeout: 5000,
          reconnectPeriod: 3000,
          queueQoSZero: false,
        });

        const connectionTimeout = setTimeout(() => {
          if (!client.connected) {
            triggerFailover('timeout');
          }
        }, 5500);

        const triggerFailover = (reason: string) => {
          this.consecutiveFailures++;
          if (this.consecutiveFailures >= 2) {
            this.consecutiveFailures = 0;
            clearTimeout(connectionTimeout);
            try {
              client.removeAllListeners();
              client.end(true);
            } catch {}
            // Đổi sang Broker kế tiếp trong danh sách dự phòng
            this.currentBrokerIndex = (this.currentBrokerIndex + 1) % BROKER_URLS.length;
            console.warn(`[Multiplayer] Switch to fallback broker: ${BROKER_URLS[this.currentBrokerIndex]} (${reason})`);
            setTimeout(attemptConnection, 400);
          }
        };

        client.on('connect', () => {
          clearTimeout(connectionTimeout);
          this.consecutiveFailures = 0;
          this.client = client;

          // Tự động đăng ký lại topic khi vừa kết nối hoặc khi mạng phục hồi
          this.resubscribeActiveTopics();

          if (!isSettled) {
            isSettled = true;
            this.connectPromise = null;
            resolve(client);
          }
        });

        client.on('reconnect', () => {
          // Bắt đầu quy trình tự phục hồi
          if (this.client && this.client.connected) {
            this.resubscribeActiveTopics();
          }
        });

        client.on('error', (err) => {
          console.warn('[Multiplayer] Broker error:', err.message);
          triggerFailover('error');
        });

        client.on('close', () => {
          if (!client.connected && !isSettled) {
            triggerFailover('close');
          }
        });

        client.on('message', (topic, message) => {
          try {
            const data = JSON.parse(message.toString());
            this.handleIncomingMessage(topic, data);
          } catch {}
        });
      };

      attemptConnection();
    });

    return this.connectPromise;
  }

  // Tự động đăng ký lại các topic phòng và sảnh khi mạng khôi phục (khắc phục mất session do clean: true)
  private resubscribeActiveTopics() {
    if (!this.client || !this.client.connected) return;

    if (this.isLobbyListening) {
      const lobbyTopic = this.getLobbyTopic();
      this.client.subscribe(lobbyTopic, { qos: 0 });
      this.broadcastToLobby({ type: 'lobby_query', senderId: this.localPlayerId });
    }

    if (this.currentRoom) {
      const roomTopic = this.getRoomTopic();
      this.client.subscribe(roomTopic, { qos: 0 });

      if (this.currentRole === 'host' && this.currentRoom.status === 'waiting') {
        this.broadcastToLobby({ type: 'room_alive', room: this.currentRoom });
      } else if (this.currentRoom.status === 'playing') {
        // Gửi ping_sync để đồng bộ lại trạng thái ngay khi có kết nối
        this.sendAction('ping_sync', {
          senderId: this.localPlayerId,
          role: this.currentRole,
          timestamp: Date.now(),
        });
      }
    }
  }

  // --- LOBBY MANAGEMENT ---
  public async listenLobby(gameId: string, onRoomsUpdate: (rooms: RoomInfo[]) => void) {
    this.currentGameId = gameId;
    this.isLobbyListening = true;
    if (!this.roomUpdateListeners.includes(onRoomsUpdate)) {
      this.roomUpdateListeners.push(onRoomsUpdate);
    }

    const client = await this.ensureConnected();
    const lobbyTopic = this.getLobbyTopic(gameId);
    client.subscribe(lobbyTopic, { qos: 0 });

    // Yêu cầu các phòng đang chờ báo cáo hiện diện
    this.broadcastToLobby({ type: 'lobby_query', senderId: this.localPlayerId });

    // Dọn dẹp định kỳ phòng quá hạn (>16s không nhận nhịp tim)
    if (!this.cleanupTimer) {
      this.cleanupTimer = setInterval(() => {
        const now = Date.now();
        let changed = false;
        this.activeRooms.forEach((r, id) => {
          if (now - r.createdAt > 16000 && r.hostId !== this.localPlayerId) {
            this.activeRooms.delete(id);
            changed = true;
          }
        });
        if (changed) this.notifyRoomsUpdated();
      }, 4000);
    }
  }

  public stopListeningLobby() {
    this.isLobbyListening = false;
    this.roomUpdateListeners = [];
    if (this.client && this.client.connected) {
      try {
        this.client.unsubscribe(this.getLobbyTopic());
      } catch {}
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private broadcastToLobby(data: any) {
    if (this.client && this.client.connected) {
      this.client.publish(this.getLobbyTopic(), JSON.stringify(data), { qos: 0 });
    }
  }

  private notifyRoomsUpdated() {
    const list = Array.from(this.activeRooms.values())
      .filter(r => r.status === 'waiting' && r.hostId !== this.localPlayerId);
    this.roomUpdateListeners.forEach(cb => cb(list));
  }

  public normalizeRoomId(raw: string): string {
    return raw.trim().toUpperCase().replace(/^(PHONG|ROOM)[-_]?/i, '');
  }

  // --- ROOM HOSTING / JOINING ---
  public async createRoom(gameId: string, options?: Record<string, any>): Promise<RoomInfo> {
    this.currentGameId = gameId;
    await this.ensureConnected();

    // Hủy đăng ký phòng cũ nếu có
    if (this.currentRoom && this.client) {
      try {
        this.client.unsubscribe(this.getRoomTopic());
      } catch {}
    }

    // Mã phòng 5 chữ số sạch đẹp (từ 10000 đến 99999, tương đương 90.000 phòng đồng thời không trùng)
    const roomId = Math.floor(10000 + Math.random() * 90000).toString();
    const room: RoomInfo = {
      roomId,
      gameId,
      hostName: this.getPlayerName(),
      hostId: this.localPlayerId,
      status: 'waiting',
      createdAt: Date.now(),
      options: options || {},
    };

    this.currentRoom = room;
    this.currentRole = 'host';
    this.opponent = null;
    this.activeRooms.set(roomId, room);
    this.notifyRoomsUpdated();

    // Subscribe vào topic phòng v3 cô lập
    await this.subscribeToRoom(roomId, gameId);

    // Phát tín hiệu phòng lên sảnh
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.currentRoom && this.currentRoom.status === 'waiting') {
        this.broadcastToLobby({
          type: 'room_alive',
          room: { ...this.currentRoom, createdAt: Date.now() },
        });
      }
    }, 3000);

    // Initial broadcast
    this.broadcastToLobby({ type: 'room_alive', room });
    this.notifyStatus('waiting_opponent');
    this.emitRoomChanged();

    return room;
  }

  public async joinRoom(gameId: string, rawRoomId: string): Promise<boolean> {
    this.currentGameId = gameId;
    const roomId = this.normalizeRoomId(rawRoomId);
    if (!roomId) return false;

    await this.ensureConnected();

    // Hủy đăng ký phòng cũ nếu có
    if (this.currentRoom && this.client) {
      try {
        this.client.unsubscribe(this.getRoomTopic());
      } catch {}
    }

    this.currentRole = 'guest';
    this.currentRoom = {
      roomId,
      gameId,
      hostName: 'Chủ phòng',
      hostId: '',
      status: 'playing',
      createdAt: Date.now(),
    };

    this.emitRoomChanged();

    // Chờ đăng ký topic hoàn tất trước khi phát tín hiệu vào phòng
    await this.subscribeToRoom(roomId, gameId);

    // Phát tín hiệu tham gia phòng
    const sendJoin = () => {
      this.sendRoomMessage({
        type: 'guest_joined',
        guestId: this.localPlayerId,
        guestName: this.getPlayerName(),
      });
    };

    sendJoin();
    // Bắn thêm lần 2 sau 300ms đề phòng mất gói tin ban đầu
    setTimeout(sendJoin, 300);

    this.notifyStatus('connected');
    return true;
  }

  public findAvailableRoom(gameId: string): RoomInfo | null {
    const available = Array.from(this.activeRooms.values()).find(
      r => r.gameId === gameId && r.status === 'waiting' && r.hostId !== this.localPlayerId
    );
    return available || null;
  }

  public isBotMatch(): boolean {
    return false; // Chế độ PVP Online 100% người thật, không ép Bot
  }

  // --- QUICK MATCH: Tự động ghép với người đang chờ ---
  public async quickMatch(gameId: string): Promise<{ action: 'joined' | 'hosted'; room: RoomInfo }> {
    this.notifyStatus('searching');
    await this.ensureConnected();

    // Tìm xem có phòng nào đang mở sẵn không
    const available = Array.from(this.activeRooms.values()).find(
      r => r.gameId === gameId && r.status === 'waiting' && r.hostId !== this.localPlayerId
    );

    if (available) {
      await this.joinRoom(gameId, available.roomId);
      return { action: 'joined', room: available };
    }

    // Nếu chưa có, tạo phòng mới và làm chủ phòng đợi người khác
    const room = await this.createRoom(gameId);
    return { action: 'hosted', room };
  }

  private subscribeToRoom(roomId: string, gameId?: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.client) return resolve();
      const topic = this.getRoomTopic(roomId, gameId);
      this.client.subscribe(topic, { qos: 0 }, () => {
        resolve();
      });
    });
  }

  public sendMove(payload: any) {
    this.sendRoomMessage({
      type: 'game_move',
      payload,
      senderId: this.localPlayerId,
      senderName: this.getPlayerName(),
    }, 0);
  }

  public sendAction(type: string, payload: any = {}, qos: 0 | 1 = 0) {
    this.sendRoomMessage({
      type,
      payload,
      senderId: this.localPlayerId,
      senderName: this.getPlayerName(),
    }, qos);
  }

  private sendRoomMessage(data: any, qos: 0 | 1 = 0) {
    if (!this.currentRoom || !this.client) return;
    const topic = this.getRoomTopic();
    this.client.publish(topic, JSON.stringify(data), { qos });
  }

  private handleIncomingMessage(topic: string, data: any) {
    // 1. Lobby Topic Messages
    if (topic.includes('/lobby')) {
      if (data.type === 'room_alive' && data.room) {
        this.activeRooms.set(data.room.roomId, data.room);
        this.notifyRoomsUpdated();
      } else if (data.type === 'room_closed' && data.roomId) {
        this.activeRooms.delete(data.roomId);
        this.notifyRoomsUpdated();
      } else if (data.type === 'lobby_query' && this.currentRoom && this.currentRole === 'host') {
        this.broadcastToLobby({ type: 'room_alive', room: this.currentRoom });
      }
      return;
    }

    // 2. Room Topic Messages (Khớp chính xác topic phòng hiện tại)
    const expectedRoomTopic = this.currentRoom ? this.getRoomTopic() : '';

    if (expectedRoomTopic && topic === expectedRoomTopic) {
      if (data.type === 'guest_joined') {
        if (this.currentRole === 'host') {
          this.opponent = { id: data.guestId, name: data.guestName };
          if (this.currentRoom) {
            this.currentRoom.status = 'playing';
            this.broadcastToLobby({ type: 'room_closed', roomId: this.currentRoom.roomId });
          }

          // Send handshake back to guest with host info
          this.sendRoomMessage({
            type: 'host_ack',
            hostId: this.localPlayerId,
            hostName: this.getPlayerName(),
            roomOptions: this.currentRoom?.options || {},
          });
          this.notifyStatus('connected');
        }
      } else if (data.type === 'host_ack') {
        if (this.currentRole === 'guest') {
          this.opponent = { id: data.hostId, name: data.hostName };
          if (this.currentRoom) {
            this.currentRoom.hostName = data.hostName;
            this.currentRoom.options = data.roomOptions;
          }
          this.notifyStatus('connected');
        }
      } else if (data.type === 'ping_sync') {
        if (data.senderId !== this.localPlayerId) {
          // Phản hồi ping_ack để bên kia xác nhận kênh 2 chiều hoạt động
          this.sendAction('ping_ack', {
            senderId: this.localPlayerId,
            role: this.currentRole,
            timestamp: Date.now(),
          });
          this.moveListeners.forEach(cb => cb(data));
        }
      } else if (data.type === 'ping_ack') {
        if (data.senderId !== this.localPlayerId) {
          this.moveListeners.forEach(cb => cb(data));
        }
      } else if (data.type !== 'guest_joined' && data.type !== 'host_ack' && data.type !== 'player_left') {
        if (data.senderId !== this.localPlayerId) {
          if (data.senderName && (!this.opponent || !this.opponent.name || this.opponent.name === 'ĐỐI THỦ')) {
            this.opponent = { id: data.senderId, name: data.senderName };
          }
          this.moveListeners.forEach(cb => cb(data));
        }
      } else if (data.type === 'player_left') {
        if (data.senderId !== this.localPlayerId) {
          if (data.senderName && (!this.opponent || !this.opponent.name || this.opponent.name === 'ĐỐI THỦ')) {
            this.opponent = { id: data.senderId, name: data.senderName };
          }
          this.notifyStatus('disconnected');
        }
      }
    }
  }

  public onMove(callback: MoveCallback) {
    if (!this.moveListeners.includes(callback)) {
      this.moveListeners.push(callback);
    }
  }

  public offMove(callback: MoveCallback) {
    this.moveListeners = this.moveListeners.filter(cb => cb !== callback);
  }

  public onStatusChange(callback: (status: any) => void) {
    if (!this.statusListeners.includes(callback)) {
      this.statusListeners.push(callback);
    }
  }

  public offStatusChange(callback: (status: any) => void) {
    this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
  }

  private notifyStatus(status: 'idle' | 'searching' | 'waiting_opponent' | 'connected' | 'disconnected') {
    this.statusListeners.forEach(cb => cb(status));
  }

  public leaveRoom() {
    if (this.currentRoom) {
      if (this.client) {
        try {
          this.client.unsubscribe(this.getRoomTopic());
        } catch {}
      }
      this.activeRooms.delete(this.currentRoom.roomId);
      this.sendAction('player_left');
      if (this.currentRole === 'host') {
        this.broadcastToLobby({ type: 'room_closed', roomId: this.currentRoom.roomId });
      }
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.currentRoom = null;
    this.currentRole = null;
    this.opponent = null;
    this.notifyStatus('idle');
    this.emitRoomChanged();
    this.notifyRoomsUpdated();
  }

  private emitRoomChanged() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('acegames:room_changed', { detail: this.currentRoom }));
    }
  }

  public emitCurrentRoom() {
    this.emitRoomChanged();
  }

  public getCurrentRoom(): RoomInfo | null {
    return this.currentRoom;
  }

  public getRole(): 'host' | 'guest' | null {
    return this.currentRole;
  }

  public getOpponent() {
    return this.opponent;
  }
}

export const multiplayer = new MultiplayerService();
