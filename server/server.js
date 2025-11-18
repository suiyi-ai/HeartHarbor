const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

// 中间件
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json());

// 讯飞鉴权工具类
class XunfeiAuth {
  constructor(appId, apiKey, apiSecret) {
    this.appId = appId;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  // 生成鉴权URL
  generateAuthUrl(hostUrl, uri) {
    const url = new URL(hostUrl + uri);
    const host = url.host;
    const date = new Date().toUTCString();
    
    // 生成签名
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${uri} HTTP/1.1`;
    const signature = crypto.createHmac('sha256', this.apiSecret)
      .update(signatureOrigin)
      .digest('base64');
    
    const authorization = `api_key="${this.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    
    return {
      url: url.toString(),
      headers: {
        'Authorization': authorization,
        'Host': host,
        'Date': date,
        'Content-Type': 'application/json'
      }
    };
  }

  // 生成WebSocket连接URL
  generateWebSocketUrl() {
    const hostUrl = 'wss://avatar.cn-huadong-1.xf-yun.com';
    const uri = '/v1/interact';
    return this.generateAuthUrl(hostUrl, uri);
  }
}

// 创建讯飞鉴权实例
const xfAuth = new XunfeiAuth(
  process.env.XF_APP_ID,
  process.env.XF_API_KEY,
  process.env.XF_API_SECRET
);

// WebSocket代理类
class WebSocketProxy {
  constructor() {
    this.clientConnections = new Map(); // 存储客户端连接
    this.xfConnections = new Map();    // 存储讯飞连接
  }

  // 处理客户端连接
  handleClientConnection(ws, req) {
    const clientId = this.generateClientId();
    this.clientConnections.set(clientId, ws);

    console.log(`客户端 ${clientId} 已连接`);

    // 建立到讯飞的连接
    this.connectToXunfei(clientId);

    // 处理客户端消息
    ws.on('message', (message) => {
      console.log(`收到客户端 ${clientId} 消息:`, message.toString());
      this.forwardToXunfei(clientId, message);
    });

    // 处理连接关闭
    ws.on('close', () => {
      console.log(`客户端 ${clientId} 断开连接`);
      this.cleanupConnection(clientId);
    });

    ws.on('error', (error) => {
      console.error(`客户端 ${clientId} 连接错误:`, error);
      this.cleanupConnection(clientId);
    });
  }

  // 连接到讯飞服务
  connectToXunfei(clientId) {
    try {
      const authInfo = xfAuth.generateWebSocketUrl();
      
      const xfWs = new WebSocket(authInfo.url, {
        headers: authInfo.headers
      });

      this.xfConnections.set(clientId, xfWs);

      xfWs.on('open', () => {
        console.log(`讯飞服务连接已建立 (客户端: ${clientId})`);
        
        // 发送初始化消息
        const initMessage = {
          header: {
            app_id: process.env.XF_APP_ID,
            uid: clientId
          },
          parameter: {
            chat: {
              domain: "general",
              temperature: 0.5,
              max_tokens: 2048
            }
          },
          payload: {
            message: {
              text: ""
            }
          }
        };

        xfWs.send(JSON.stringify(initMessage));
      });

      xfWs.on('message', (message) => {
        console.log(`收到讯飞消息 (客户端: ${clientId}):`, message.toString());
        this.forwardToClient(clientId, message);
      });

      xfWs.on('close', (code, reason) => {
        console.log(`讯飞连接关闭 (客户端: ${clientId}):`, code, reason);
        this.cleanupConnection(clientId);
      });

      xfWs.on('error', (error) => {
        console.error(`讯飞连接错误 (客户端: ${clientId}):`, error);
        this.cleanupConnection(clientId);
      });

    } catch (error) {
      console.error(`连接讯飞服务失败 (客户端: ${clientId}):`, error);
      this.cleanupConnection(clientId);
    }
  }

  // 转发消息到讯飞
  forwardToXunfei(clientId, message) {
    const xfWs = this.xfConnections.get(clientId);
    if (xfWs && xfWs.readyState === WebSocket.OPEN) {
      try {
        // 解析客户端消息并构建讯飞格式
        const clientData = JSON.parse(message.toString());
        const xfMessage = {
          header: {
            app_id: process.env.XF_APP_ID,
            uid: clientId
          },
          parameter: {
            chat: {
              domain: "general",
              temperature: 0.5,
              max_tokens: 2048
            }
          },
          payload: {
            message: {
              text: clientData.text || ""
            }
          }
        };

        xfWs.send(JSON.stringify(xfMessage));
      } catch (error) {
        console.error(`转发消息到讯飞失败:`, error);
      }
    }
  }

  // 转发消息到客户端
  forwardToClient(clientId, message) {
    const clientWs = this.clientConnections.get(clientId);
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      try {
        clientWs.send(message.toString());
      } catch (error) {
        console.error(`转发消息到客户端失败:`, error);
      }
    }
  }

  // 清理连接
  cleanupConnection(clientId) {
    const clientWs = this.clientConnections.get(clientId);
    const xfWs = this.xfConnections.get(clientId);

    if (clientWs) {
      try {
        // 使用合法的关闭码
        clientWs.close(1000, 'Normal closure');
      } catch (error) {
        console.log('客户端WebSocket关闭异常:', error);
      }
      this.clientConnections.delete(clientId);
    }

    if (xfWs) {
      try {
        // 使用合法的关闭码
        xfWs.close(1000, 'Normal closure');
      } catch (error) {
        console.log('讯飞WebSocket关闭异常:', error);
      }
      this.xfConnections.delete(clientId);
    }
  }

  // 生成客户端ID
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 创建代理实例
const proxy = new WebSocketProxy();

// 创建HTTP服务器
const server = app.listen(PORT, () => {
  console.log(`代理服务器运行在端口 ${PORT}`);
  console.log('请确保已正确配置 .env 文件中的讯飞API信息');
});

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  proxy.handleClientConnection(ws, req);
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: proxy.clientConnections.size
  });
});

// 获取连接信息接口
app.get('/api/connections', (req, res) => {
  res.json({
    active_clients: proxy.clientConnections.size,
    active_xf_connections: proxy.xfConnections.size
  });
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});