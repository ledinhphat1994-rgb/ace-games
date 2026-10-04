import type { RoomChatMessage, ThanhVienPhong } from '@shared/protocol/room'
import { useState, useEffect } from 'react'

export interface GameRoomChatBridgeData {
  messages: RoomChatMessage[]
  onSend: (text: string) => Promise<boolean> | boolean | void
  roomTitle?: string
  roomMembers?: ThanhVienPhong[]
}

let activeBridge: GameRoomChatBridgeData | null = null
const bridgeListeners = new Set<(bridge: GameRoomChatBridgeData | null) => void>()

export function registerGameRoomChatBridge(data: GameRoomChatBridgeData | null) {
  activeBridge = data
  bridgeListeners.forEach((listener) => listener(activeBridge))
}

export function useGameRoomChatBridge(): GameRoomChatBridgeData | null {
  const [bridge, setBridge] = useState<GameRoomChatBridgeData | null>(() => activeBridge)

  useEffect(() => {
    setBridge(activeBridge)
    const listener = (b: GameRoomChatBridgeData | null) => setBridge(b)
    bridgeListeners.add(listener)
    return () => {
      bridgeListeners.delete(listener)
    }
  }, [])

  return bridge
}
