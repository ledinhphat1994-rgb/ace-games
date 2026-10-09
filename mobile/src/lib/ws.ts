import { API_BASE_URL } from './api'

export type WsStatus = 'disconnected' | 'connecting' | 'connected'

export class CampusNativeWsClient {
  private ws: WebSocket | null = null
  private status: WsStatus = 'disconnected'
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private listeners: Set<(event: any) => void> = new Set()

  constructor(private onStatusChange?: (status: WsStatus) => void) {}

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    this.setStatus('connecting')
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws/campus'

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.setStatus('connected')
        this.startPing()
      }

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          this.listeners.forEach((listener) => listener(msg))
        } catch {
          // Bỏ qua message không phải JSON
        }
      }

      this.ws.onclose = () => {
        this.cleanup()
        this.setStatus('disconnected')
        this.scheduleReconnect()
      }

      this.ws.onerror = () => {
        this.cleanup()
        this.setStatus('disconnected')
      }
    } catch {
      this.setStatus('disconnected')
      this.scheduleReconnect()
    }
  }

  disconnect() {
    this.cleanup()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.setStatus('disconnected')
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data))
    }
  }

  addListener(callback: (event: any) => void) {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private setStatus(s: WsStatus) {
    this.status = s
    this.onStatusChange?.(s)
  }

  private startPing() {
    if (this.pingInterval) clearInterval(this.pingInterval)
    this.pingInterval = setInterval(() => {
      this.send({ loai: 'ping', t: Date.now() })
    }, 25000)
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, 3000)
  }
}
