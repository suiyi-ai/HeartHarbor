# 讯飞虚拟人后端代理服务器

## 功能说明

此服务器作为小程序端和讯飞虚拟人服务之间的代理，解决小程序无法直接连接外部WebSocket服务的问题。

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置API信息

复制 `.env.example` 为 `.env`，并填写您的讯飞API信息：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
XF_APP_ID=your_app_id_here
XF_API_KEY=your_api_key_here
XF_API_SECRET=your_api_secret_here
XF_AVATAR_ID=your_avatar_id_here
```

### 3. 启动服务器

```bash
npm start
```

或者使用开发模式（自动重启）：

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动。

## API接口

### WebSocket代理

- **连接地址**: `ws://localhost:3000`
- **协议**: 与讯飞官方WebSocket协议兼容

### HTTP接口

- **健康检查**: `GET /health`
- **连接状态**: `GET /api/connections`

## 小程序端配置

修改小程序代码，连接代理服务器：

```javascript
// 在虚拟人组件中修改连接地址
initSDK() {
  this.webSocket = uni.connectSocket({
    url: 'ws://your-server-ip:3000', // 替换为您的服务器地址
    header: {
      'content-type': 'application/json'
    }
  });
}
```

## 部署说明

### 本地开发

1. 确保防火墙允许3000端口访问
2. 配置小程序开发工具的网络权限

### 生产部署

1. 部署到云服务器（阿里云/腾讯云等）
2. 配置HTTPS证书
3. 配置域名和SSL
4. 修改小程序连接地址为 `wss://your-domain.com`

## 故障排除

### 连接失败

1. 检查 `.env` 文件中的API配置是否正确
2. 检查服务器端口是否被占用
3. 检查防火墙设置

### 讯飞服务连接失败

1. 确认API密钥和密钥是否正确
2. 检查网络连接是否正常
3. 查看服务器日志获取详细错误信息

## 技术架构

- **WebSocket代理**: 双向消息转发
- **讯飞鉴权**: 自动处理签名认证
- **连接管理**: 多客户端并发支持
- **错误处理**: 完善的异常处理机制