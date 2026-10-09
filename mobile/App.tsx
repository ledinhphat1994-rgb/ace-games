import React, { useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native'
import { SnakeSkiaArena } from './src/games/snake/SnakeSkiaArena'

type TabType = 'games' | 'study' | 'community'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('games')
  const [activeGame, setActiveGame] = useState<string | null>(null)

  // Nếu đang vào game Rắn Săn Mồi -> Hiển thị trực tiếp Skia Arena 120 FPS toàn màn hình
  if (activeGame === 'snake') {
    return (
      <View style={styles.fullscreenGame}>
        <StatusBar hidden />
        <SnakeSkiaArena onBack={() => setActiveGame(null)} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Header Native */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>DIGITAL CAMPUS</Text>
          <Text style={styles.brandSubtitle}>GDTX Định Quán · Lớp 10A7</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>NATIVE GPU</Text>
        </View>
      </View>

      {/* Nội dung theo Tab */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'games' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ĐẤU TRƯỜNG TRÒ CHƠI NATIVE</Text>
            <Text style={styles.sectionSubtitle}>
              Render trực tiếp bằng GPU Skia · Khóa cứng 60–120 FPS
            </Text>

            {/* Thẻ Game Rắn Săn Mồi Skia */}
            <TouchableOpacity
              style={[styles.gameCard, styles.gameCardHighlight]}
              activeOpacity={0.85}
              onPress={() => setActiveGame('snake')}
            >
              <View style={styles.gameCardHeader}>
                <View style={styles.gameIconBox}>
                  <Text style={styles.gameIconEmoji}>🐍</Text>
                </View>
                <View style={styles.gameInfo}>
                  <View style={styles.gameTitleRow}>
                    <Text style={styles.gameTitle}>RẮN SĂN MỒI 3D</Text>
                    <View style={styles.tagSkia}>
                      <Text style={styles.tagSkiaText}>SKIA 120FPS</Text>
                    </View>
                  </View>
                  <Text style={styles.gameDesc}>
                    Công nghệ đồ họa Skia GPU C++ · Độ trễ cảm ứng 0ms
                  </Text>
                </View>
              </View>
              <View style={styles.playBtnRow}>
                <Text style={styles.playBtnText}>CHƠI NGAY (NATIVE) →</Text>
              </View>
            </TouchableOpacity>

            {/* Các game khác */}
            <View style={styles.gridRow}>
              <View style={[styles.gameMiniCard, styles.halfCard]}>
                <Text style={styles.miniCardIcon}>♟️</Text>
                <Text style={styles.miniCardTitle}>Cờ Vua</Text>
                <Text style={styles.miniCardSubtitle}>Đối kháng Realtime</Text>
              </View>
              <View style={[styles.gameMiniCard, styles.halfCard]}>
                <Text style={styles.miniCardIcon}>🔴</Text>
                <Text style={styles.miniCardTitle}>Cờ Tướng</Text>
                <Text style={styles.miniCardSubtitle}>Chiến thuật đỉnh cao</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={[styles.gameMiniCard, styles.halfCard]}>
                <Text style={styles.miniCardIcon}>❌</Text>
                <Text style={styles.miniCardTitle}>Cờ Caro</Text>
                <Text style={styles.miniCardSubtitle}>1v1 Xếp hạng Glicko</Text>
              </View>
              <View style={[styles.gameMiniCard, styles.halfCard]}>
                <Text style={styles.miniCardIcon}>🧠</Text>
                <Text style={styles.miniCardTitle}>Trí Nhớ</Text>
                <Text style={styles.miniCardSubtitle}>Lật thẻ tính giờ</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'study' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HỌC TẬP & PHÒNG HỌC</Text>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>Phòng học trực tuyến và tài liệu PDF</Text>
              <Text style={styles.emptySubtext}>Kết nối trực tiếp máy chủ Cloudflare</Text>
            </View>
          </View>
        )}

        {activeTab === 'community' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CỘNG ĐỒNG LỚP HỌC</Text>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>Trò chuyện sảnh toàn trường & Bạn bè</Text>
              <Text style={styles.emptySubtext}>Giao thức WebSocket Durable Objects</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Thanh Bottom Tabs Native */}
      <View style={styles.bottomTabs}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'games' && styles.tabButtonActive]}
          onPress={() => setActiveTab('games')}
        >
          <Text style={styles.tabIcon}>🎮</Text>
          <Text style={[styles.tabLabel, activeTab === 'games' && styles.tabLabelActive]}>
            Game
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'study' && styles.tabButtonActive]}
          onPress={() => setActiveTab('study')}
        >
          <Text style={styles.tabIcon}>📖</Text>
          <Text style={[styles.tabLabel, activeTab === 'study' && styles.tabLabelActive]}>
            Học tập
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'community' && styles.tabButtonActive]}
          onPress={() => setActiveTab('community')}
        >
          <Text style={styles.tabIcon}>👥</Text>
          <Text style={[styles.tabLabel, activeTab === 'community' && styles.tabLabelActive]}>
            Cộng đồng
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020c24',
  },
  fullscreenGame: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandTitle: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  onlineText: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 4,
  },
  gameCard: {
    backgroundColor: '#071330',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 18,
    padding: 16,
  },
  gameCardHighlight: {
    borderColor: '#38bdf8',
    backgroundColor: '#0a1940',
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  gameIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameIconEmoji: {
    fontSize: 28,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gameTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  tagSkia: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    borderColor: '#eab308',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagSkiaText: {
    color: '#fef08a',
    fontSize: 9,
    fontWeight: '900',
  },
  gameDesc: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  playBtnRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'flex-end',
  },
  playBtnText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  gameMiniCard: {
    backgroundColor: '#071330',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  miniCardIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  miniCardTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  miniCardSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#071330',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    color: '#f8fafc',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  bottomTabs: {
    flexDirection: 'row',
    backgroundColor: '#020a1c',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabButtonActive: {},
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
})
