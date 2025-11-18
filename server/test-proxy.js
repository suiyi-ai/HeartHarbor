// 测试代理服务器连接
const WebSocket = require('ws');

console.log('正在测试代理服务器连接...');

// 连接到本地代理服务器
const ws = new WebSocket('ws://localhost:3000');

ws.on('open', function open() {
  console.log('✅ 成功连接到代理服务器');
  
  // 发送测试消息
  const testMessage = {
    text: '你好，这是测试消息'
  };
  
  ws.send(JSON.stringify(testMessage));
  console.log('📤 发送测试消息:', testMessage);
});

ws.on('message', function incoming(data) {
  console.log('📥 收到代理服务器响应:', data.toString());
});

ws.on('error', function error(err) {
  console.error('❌ 连接错误:', err);
});

ws.on('close', function close() {
  console.log('🔌 连接已关闭');
});

// 5秒后自动关闭连接
setTimeout(() => {
  ws.close();
  console.log('测试完成');
}, 5000);