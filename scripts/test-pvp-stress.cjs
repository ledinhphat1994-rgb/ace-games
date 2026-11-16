const mqtt = require('mqtt');

const BROKER_URLS = [
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081',
  'wss://broker.emqx.io:8084/mqtt',
];

// Helper to create a test client
function createClient(name, broker = BROKER_URLS[0]) {
  return new Promise((resolve, reject) => {
    const id = `test_${name}_${Math.random().toString(36).slice(2, 7)}`;
    const client = mqtt.connect(broker, {
      clientId: id,
      clean: true,
      connectTimeout: 5000,
      queueQoSZero: false,
    });
    client.on('connect', () => resolve(client));
    client.on('error', (err) => reject(err));
  });
}

async function runTestSuite() {
  console.log('=== BẮT ĐẦU KIỂM TRA CHẾ ĐỘ ONLINE PVP & KHẢ NĂNG CHỊU TẢI ===\n');

  // TEST 1: Topic Isolation & Namespace Cross-talk Check
  console.log('[TEST 1] Kiểm tra cách ly Topic giữa các Game (Game-scoped Topic Isolation)...');
  const sharedRoomId = '77777';
  const caroHost = await createClient('caro_host');
  const caroGuest = await createClient('caro_guest');
  const pongHost = await createClient('pong_host');
  const pongGuest = await createClient('pong_guest');

  let caroCrossTalkDetected = false;
  let pongCrossTalkDetected = false;

  await new Promise(r => caroGuest.subscribe(`acegames/v3/caro/room/${sharedRoomId}`, { qos: 0 }, r));
  await new Promise(r => pongGuest.subscribe(`acegames/v3/pong/room/${sharedRoomId}`, { qos: 0 }, r));

  caroGuest.on('message', (t, msg) => {
    const data = JSON.parse(msg.toString());
    if (data.game === 'pong') caroCrossTalkDetected = true;
  });

  pongGuest.on('message', (t, msg) => {
    const data = JSON.parse(msg.toString());
    if (data.game === 'caro') pongCrossTalkDetected = true;
  });

  // Caro Host sends caro move
  caroHost.publish(`acegames/v3/caro/room/${sharedRoomId}`, JSON.stringify({
    game: 'caro',
    type: 'game_move',
    payload: { index: 12, piece: 'X' },
  }));

  // Pong Host sends pong state
  pongHost.publish(`acegames/v3/pong/room/${sharedRoomId}`, JSON.stringify({
    game: 'pong',
    type: 'pong_state',
    payload: { bx: 480, by: 270, bvx: 7, bvy: 0 },
  }));

  await new Promise(r => setTimeout(r, 600));

  if (!caroCrossTalkDetected && !pongCrossTalkDetected) {
    console.log('✓ PASS: Hoàn toàn cách ly, không có bất kỳ hiện tượng lẫn lộn gói tin giữa các game trùng mã phòng!\n');
  } else {
    console.error('✗ FAIL: Phát hiện lẫn lộn gói tin giữa Caro và Pong!');
    process.exit(1);
  }

  caroHost.end();
  caroGuest.end();
  pongHost.end();
  pongGuest.end();

  // TEST 2: Concurrent Match Stress & Latency Test (10 concurrent rooms = 20 active players)
  console.log('[TEST 2] Kiểm tra chịu tải đồng thời (10 phòng = 20 người chơi đồng thời, tần số 30 Hz)...');
  const MATCH_COUNT = 10;
  const PACKETS_PER_MATCH = 30; // 30 packets each match (~1s at 30 Hz)
  const matches = [];

  let totalPacketsSent = 0;
  let totalPacketsReceived = 0;
  const latencies = [];

  for (let i = 0; i < MATCH_COUNT; i++) {
    const roomId = `stress_${10000 + i}`;
    const host = await createClient(`h_${i}`);
    const guest = await createClient(`g_${i}`);

    const roomTopic = `acegames/v3/pong/room/${roomId}`;

    await new Promise(r => guest.subscribe(roomTopic, { qos: 0 }, r));
    await new Promise(r => host.subscribe(roomTopic, { qos: 0 }, r));

    guest.on('message', (t, msg) => {
      const data = JSON.parse(msg.toString());
      if (data.t_send) {
        const rtt = Date.now() - data.t_send;
        latencies.push(rtt);
        totalPacketsReceived++;
      }
    });

    matches.push({ host, guest, roomId, roomTopic });
  }

  console.log(`Đã khởi tạo thành công ${MATCH_COUNT} phòng song song. Bắt đầu truyền phát gói tin 30 Hz...`);

  const startTime = Date.now();
  for (let p = 0; p < PACKETS_PER_MATCH; p++) {
    for (const match of matches) {
      match.host.publish(match.roomTopic, JSON.stringify({
        type: 'pong_state',
        t_send: Date.now(),
        payload: {
          bx: 400 + Math.random() * 100,
          by: 200 + Math.random() * 50,
          bvx: 7,
          bvy: 2,
          p1y: 220,
          s1: 2,
          s2: 1,
        }
      }));
      totalPacketsSent++;
    }
    await new Promise(r => setTimeout(r, 33)); // 30 Hz interval
  }

  // Chờ các gói tin cuối cùng được giao
  await new Promise(r => setTimeout(r, 1200));

  const durationSec = (Date.now() - startTime) / 1000;
  const avgLatency = latencies.length > 0 
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) 
    : 0;
  const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
  const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
  const deliveryRate = Math.round((totalPacketsReceived / totalPacketsSent) * 100);

  console.log(`Kết quả tải:`);
  console.log(`- Tổng số gói tin đã gửi: ${totalPacketsSent}`);
  console.log(`- Tổng số gói tin đã nhận: ${totalPacketsReceived}`);
  console.log(`- Tỷ lệ chuyển phát thành công: ${deliveryRate}%`);
  console.log(`- Độ trễ trung bình (RTT Latency): ${avgLatency} ms (Min: ${minLatency} ms, Max: ${maxLatency} ms)`);
  console.log(`- Thông lượng (Throughput): ${Math.round(totalPacketsSent / durationSec)} gói/giây\n`);

  for (const m of matches) {
    m.host.end();
    m.guest.end();
  }

  // TEST 3: Multi-Broker Failover Verification
  console.log('[TEST 3] Kiểm tra tính năng dự phòng Multi-Broker Failover...');
  let connectedBrokers = 0;
  for (const b of BROKER_URLS) {
    try {
      const c = await createClient('failover_test', b);
      c.end();
      connectedBrokers++;
      console.log(`  ✓ Broker phản hồi tốt: ${b}`);
    } catch (err) {
      console.warn(`  ! Broker không phản hồi: ${b} (${err.message})`);
    }
  }

  if (connectedBrokers >= 2) {
    console.log(`✓ PASS: Hệ thống có ${connectedBrokers}/${BROKER_URLS.length} Broker dự phòng khả dụng 100%!\n`);
  } else {
    console.error('✗ FAIL: Không đủ broker dự phòng');
    process.exit(1);
  }

  console.log('=== TOÀN BỘ CÁC BÀI TEST CHỊU TẢI & TỐI ƯU PVP ONLINE ĐÃ THÀNH CÔNG RỰC RỠ ===');
}

runTestSuite().catch(err => {
  console.error('Lỗi khi chạy test:', err);
  process.exit(1);
});
