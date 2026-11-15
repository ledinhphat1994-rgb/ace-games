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

  constructor() {
    // Generate or load permanent unique anonymous client ID
    let pid = localStorage.getItem('ace_player_id');
    if (!pid) {
      pid = 'user_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('ace_player_id', pid);
    }
    this.localPlayerId = pid;
  }

  public getPlayerId(): string {
    return this.localPlayerId;
  }

  public getPlayerName(): string {
    const saved = localStorage.getItem('ace_player_name');
    if (saved) return saved;
    const randomName = 'KỳThủ_' + Math.floor(100 + Math.random() * 900);
    localStorage.setItem('ace_player_name', randomName);
    return randomName;
  }

  public setPlayerName(name: string) {
    const clean = name.trim() || this.getPlayerName();
    localStorage.setItem('ace_player_name', clean);
  }

  public getRandomNewName(): string {
    const animals = ['Hổ', 'Rồng', 'Ưng', 'Báo', 'Sói', 'Phượng', 'ChiếnBinh', 'CaoThủ', 'HiệpSĩ'];
    const chosen = animals[Math.floor(Math.random() * animals.length)];
    const num = Math.floor(10 + Math.random() * 90);
    const newName = `${chosen}_${num}`;
    this.setPlayerName(newName);
    return newName;
  }

  private ensureConnected(): Promise<MqttClient> {
    return new Promise((resolve) => {
      if (this.client && this.client.connected) {
        return resolve(this.client);
      }

      // Public fast WebSocket MQTT Broker (TLS wss port 8084)
      const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
      const client = mqtt.connect(brokerUrl, {
        clientId: `ace_${this.localPlayerId}_${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 3000,
      });

      client.on('connect', () => {
        this.client = client;
        resolve(client);
      });

      client.on('error', (err) => {
        console.warn('MQTT Connection Warning:', err);
      });

      client.on('message', (topic, message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleIncomingMessage(topic, data);
        } catch {}
      });
    });
  }

  // --- LOBBY MANAGEMENT ---
  public async listenLobby(gameId: string, onRoomsUpdate: (rooms: RoomInfo[]) => void) {
    this.currentGameId = gameId;
    if (!this.roomUpdateListeners.includes(onRoomsUpdate)) {
      this.roomUpdateListeners.push(onRoomsUpdate);
    }

    const client = await this.ensureConnected();
    const lobbyTopic = `acegames/v2/${gameId}/lobby`;
    client.subscribe(lobbyTopic, { qos: 0 });

    // Request rooms announcement
    this.broadcastToLobby({ type: 'lobby_query', senderId: this.localPlayerId });

    // Periodic cleanup of stale rooms (older than 15s without heartbeat)
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
    this.roomUpdateListeners = [];
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private broadcastToLobby(data: any) {
    if (this.client && this.client.connected) {
      this.client.publish(`acegames/v2/${this.currentGameId}/lobby`, JSON.stringify(data));
    }
  }

  private notifyRoomsUpdated() {
    const list = Array.from(this.activeRooms.values()).filter(r => r.status === 'waiting');
    this.roomUpdateListeners.forEach(cb => cb(list));
  }

  // --- ROOM HOSTING / JOINING ---
  public async createRoom(gameId: string, options?: Record<string, any>): Promise<RoomInfo> {
    this.currentGameId = gameId;
    await this.ensureConnected();

    // 4-digit simple memorable room code
    const roomId = 'PHONG-' + Math.floor(1000 + Math.random() * 9000);
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

    // Subscribe to room topic
    this.subscribeToRoom(roomId);

    // Start advertising this room on lobby
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

    return room;
  }

  public async joinRoom(gameId: string, roomId: string): Promise<boolean> {
    this.currentGameId = gameId;
    await this.ensureConnected();

    this.currentRole = 'guest';
    this.currentRoom = {
      roomId,
      gameId,
      hostName: 'Đối thủ',
      hostId: '',
      status: 'playing',
      createdAt: Date.now(),
    };

    // Subscribe to room topic
    this.subscribeToRoom(roomId);

    // Announce join to host
    this.sendRoomMessage({
      type: 'guest_joined',
      guestId: this.localPlayerId,
      guestName: this.getPlayerName(),
    });

    this.notifyStatus('connected');
    return true;
  }

  // --- QUICK MATCH: 1-Click Instant Pairing ---
  public async quickMatch(gameId: string): Promise<{ action: 'joined' | 'hosted'; room: RoomInfo }> {
    this.notifyStatus('searching');
    await this.ensureConnected();

    // Look for any existing waiting room
    const available = Array.from(this.activeRooms.values()).find(
      r => r.gameId === gameId && r.status === 'waiting' && r.hostId !== this.localPlayerId
    );

    if (available) {
      await this.joinRoom(gameId, available.roomId);
      return { action: 'joined', room: available };
    }

    // Otherwise create room and wait for incoming player
    const room = await this.createRoom(gameId);
    return { action: 'hosted', room };
  }

  private subscribeToRoom(roomId: string) {
    if (this.client) {
      this.client.subscribe(`acegames/v2/room/${roomId}`, { qos: 1 });
    }
  }

  public sendMove(payload: any) {
    this.sendRoomMessage({
      type: 'game_move',
      payload,
      senderId: this.localPlayerId,
      senderName: this.getPlayerName(),
    });
  }

  public sendAction(type: string, payload: any = {}) {
    this.sendRoomMessage({
      type,
      payload,
      senderId: this.localPlayerId,
      senderName: this.getPlayerName(),
    });
  }

  private sendRoomMessage(data: any) {
    if (!this.currentRoom || !this.client) return;
    this.client.publish(
      `acegames/v2/room/${this.currentRoom.roomId}`,
      JSON.stringify(data),
      { qos: 1 }
    );
  }

  private handleIncomingMessage(topic: string, data: any) {
    // Lobby Topic Messages
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

    // Room Topic Messages
    if (this.currentRoom && topic.endsWith(this.currentRoom.roomId)) {
      if (data.type === 'guest_joined') {
        if (this.currentRole === 'host') {
          this.opponent = { id: data.guestId, name: data.guestName };
          if (this.currentRoom) this.currentRoom.status = 'playing';
          this.broadcastToLobby({ type: 'room_closed', roomId: this.currentRoom.roomId });
          
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
      } else if (data.type === 'game_move' || data.type === 'game_restart') {
        if (data.senderId !== this.localPlayerId) {
          this.moveListeners.forEach(cb => cb(data));
        }
      } else if (data.type === 'player_left') {
        if (data.senderId !== this.localPlayerId) {
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
