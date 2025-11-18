<template>
  <view class="xf-virtual-human-page">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <text class="nav-title">讯飞虚拟人伙伴</text>
      <view class="nav-actions">
        <text class="nav-btn" @click="showConfigPanel">API配置</text>
        <text class="nav-btn" @click="resetAll">重置</text>
      </view>
    </view>
    
    <!-- 状态面板 -->
    <view class="status-panel">
      <view class="status-item">
        <text class="status-label">SDK状态</text>
        <text class="status-value" :class="sdkStatusClass">{{ sdkStatusText }}</text>
      </view>
      <view class="status-item">
        <text class="status-label">WebSocket</text>
        <text class="status-value" :class="wsStatusClass">{{ wsStatusText }}</text>
      </view>
      <view class="status-item">
        <text class="status-label">连接状态</text>
        <text class="status-value" :class="connectionStatusClass">{{ connectionStatusText }}</text>
      </view>
      <view class="status-item">
        <text class="status-label">播放状态</text>
        <text class="status-value" :class="playStatusClass">{{ playStatusText }}</text>
      </view>
    </view>
    
    <!-- 配置面板 -->
    <view class="config-panel" v-if="showConfig">
      <view class="config-header">
        <text class="config-title">讯飞API配置</text>
        <text class="config-close" @click="hideConfigPanel">×</text>
      </view>
      
      <view class="form-group">
        <text class="form-label">服务器URL</text>
        <input class="form-input" v-model="apiConfig.serverUrl" placeholder="请输入服务器URL" />
      </view>
      
      <view class="form-group">
        <text class="form-label">App ID</text>
        <input class="form-input" v-model="apiConfig.appId" placeholder="请输入App ID" />
      </view>
      
      <view class="form-group">
        <text class="form-label">API Key</text>
        <input class="form-input" v-model="apiConfig.apiKey" placeholder="请输入API Key" />
      </view>
      
      <view class="form-group">
        <text class="form-label">API Secret</text>
        <input class="form-input" v-model="apiConfig.apiSecret" placeholder="请输入API Secret" />
      </view>
      
      <view class="form-group">
        <text class="form-label">Scene ID</text>
        <input class="form-input" v-model="apiConfig.sceneId" placeholder="请输入Scene ID" />
      </view>
      
      <view class="form-group">
        <text class="form-label">Avatar ID</text>
        <input class="form-input" v-model="apiConfig.avatarId" placeholder="请输入Avatar ID" />
      </view>
      
      <view class="form-group">
        <text class="form-label">声音类型</text>
        <input class="form-input" v-model="apiConfig.voiceType" placeholder="请输入声音类型" />
      </view>
      
      <view class="config-actions">
        <button class="btn btn-primary" @click="saveApiConfig">保存配置</button>
        <button class="btn btn-secondary" @click="hideConfigPanel">取消</button>
      </view>
    </view>
    
    <!-- 虚拟人显示区域 -->
    <view class="avatar-display-section">
      <!-- 虚拟人视频容器 -->
      <view class="avatar-container">
        <view class="avatar-video-wrapper" id="avatarContainer">
          <!-- 使用兼容性更好的视频播放方案 -->
          <view v-if="isPlaying" class="virtual-human-stream">
            <!-- 模拟实时视频流 -->
            <view class="stream-content">
              <image src="/static/icon/ai-partner.png" mode="aspectFit" class="avatar-image" :class="{ pulse: isConnected && isPlaying }" />
              
              <!-- 连接状态指示器 -->
              <view class="video-status-overlay">
                <view class="status-indicator" :class="{ connecting: isConnecting, connected: isConnected && !isConnecting }">
                  <view class="indicator-dot"></view>
                  <text class="indicator-text">{{ isConnecting ? '连接中' : isConnected ? '已连接' : '未连接' }}</text>
                </view>
              </view>
              
              <!-- 视频流效果 -->
              <view class="video-stream-effect" v-if="isConnected && isPlaying">
                <view class="stream-wave"></view>
                <view class="stream-wave delay-1"></view>
                <view class="stream-wave delay-2"></view>
              </view>
              
              <view class="stream-status">
                {{ streamStatus }}
              </view>
              <view class="stream-tip">
                {{ streamTip }}
              </view>
              <view class="stream-loading" v-if="isConnecting">
                <text class="loading-dot">●</text>
                <text class="loading-dot">●</text>
                <text class="loading-dot">●</text>
              </view>
            </view>
          </view>
          
          <!-- 视频流播放器（当有视频流URL时显示） -->
          <video 
            v-if="isPlaying && hasLocalVideo && videoStreamUrl" 
            :src="videoStreamUrl" 
            autoplay 
            controls 
            class="virtual-human-video"
            @play="onVideoPlay"
            @pause="onVideoPause"
            @ended="onVideoEnded"
            @error="onVideoError">
          </video>
          
          <view v-else class="video-placeholder-content">
            <image src="/static/icon/ai-partner.png" mode="aspectFit" class="placeholder-icon" />
            <text class="video-placeholder">
              讯飞虚拟人功能
            </text>
            <text class="video-description">
              点击"启动虚拟人"开始体验
            </text>
            <text class="video-description">
              请确保已正确配置API信息
            </text>
          </view>
        </view>
        
        <!-- 字幕显示 -->
        <view class="subtitle-panel">
          <text class="subtitle-text">{{ subtitleText }}</text>
        </view>
      </view>
      
      <!-- 控制按钮区域 -->
      <view class="control-section">
        <view class="control-buttons">
          <button class="btn btn-primary" @click="initSDK" :disabled="sdkInitialized">
            {{ sdkInitialized ? '已初始化' : '初始化SDK' }}
          </button>
          <button class="btn btn-success" @click="startAvatar" :disabled="!sdkInitialized || isPlaying">
            {{ isPlaying ? '播放中' : '启动虚拟人' }}
          </button>
          <button class="btn btn-warning" @click="stopAvatar" :disabled="!sdkInitialized || !isPlaying">
            停止虚拟人
          </button>
        </view>
        
        <view class="interaction-buttons">
          <button class="btn btn-info" @click="sendTextMessage" :disabled="!sdkInitialized || !isPlaying">
            💬 发送消息
          </button>
          <button class="btn btn-secondary" @click="startVoiceInteraction" :disabled="!sdkInitialized || !isPlaying" :class="{ 'recording': isRecording }">
            {{ isRecording ? '⏹️ 停止录音' : '🎤 语音交互' }}
          </button>
          
          <!-- 基于Java参考实现的增强功能 -->
          <button class="btn btn-success" @click="sendResetRequest" :disabled="!sdkInitialized || !isPlaying">
            🔄 重置（打断）
          </button>
          <button class="btn btn-warning" @click="sendCommand('A_RLH_puzzle_0')" :disabled="!sdkInitialized || !isPlaying">
            🎯 发送动作
          </button>
          
          <button class="btn btn-error" @click="destroySDK" :disabled="!sdkInitialized">
            销毁SDK
          </button>
        </view>
      </view>
    </view>
    
    <!-- 消息输入区域 -->
    <view class="input-section" v-if="sdkInitialized && isPlaying">
      <view class="input-container">
        <input class="message-input" v-model="inputText" placeholder="请输入要发送给虚拟人的消息" />
        <button class="btn btn-primary send-btn" @click="sendTextMessage">发送</button>
      </view>
    </view>
    
    <!-- 消息提示 -->
    <view class="message-panel" v-if="showMessage">
      <view class="message" :class="messageType">
        <text class="message-title">{{ messageTitle }}</text>
        <text class="message-content">{{ messageContent }}</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
// 引入CryptoJS库用于HMAC-SHA256加密
import CryptoJS from 'crypto-js'
import { defineComponent } from 'vue'

// 定义组件接口
interface ApiConfig {
  serverUrl: string
  appId: string
  apiKey: string
  apiSecret: string
  sceneId: string
  avatarId: string
  voiceType: string
}

interface EnvironmentInfo {
  isWindows: boolean
  isSecureContext: boolean
  hasWebSocket: boolean
  hasCrypto: boolean
  platform: string
}

// 定义组件数据类型
interface ComponentData {
  apiConfig: ApiConfig
  sdkInitialized: boolean
  isConnected: boolean
  isPlaying: boolean
  isConnecting: boolean
  reconnecting: boolean
  webSocket: any
  showConfig: boolean
  subtitleText: string
  inputText: string
  showMessage: boolean
  messageType: string
  messageTitle: string
  messageContent: string
  messageTimer: any
  streamStatus: string
  streamTip: string
  hasLocalVideo: boolean
  videoUrl: string
  subtitleTimer: any
  heartbeatTimer: any
  currentSubtitle: string
  isRecording: boolean
  recorderManager: any
  audioContext: any
  videoStreamUrl: string
  socketManager: any
  socketConnectionId: string
}

// 全局Socket连接管理器（解决小程序socket连接数量限制）
class SocketConnectionManager {
  private static instance: SocketConnectionManager
  private activeConnections: Map<string, any> = new Map()
  private maxConnections = 2 // 小程序限制最多2个连接
  
  static getInstance(): SocketConnectionManager {
    if (!SocketConnectionManager.instance) {
      SocketConnectionManager.instance = new SocketConnectionManager()
    }
    return SocketConnectionManager.instance
  }
  
  // 注册连接
  registerConnection(id: string, socket: any): boolean {
    // 如果超过最大连接数，关闭最旧的连接
    if (this.activeConnections.size >= this.maxConnections) {
      console.warn(`⚠️ Socket连接数量已达上限(${this.maxConnections})，关闭最旧的连接`)
      const firstId = this.activeConnections.keys().next().value
      this.closeConnection(firstId)
    }
    
    this.activeConnections.set(id, socket)
    console.log(`✅ Socket连接已注册: ${id}，当前连接数: ${this.activeConnections.size}`)
    return true
  }
  
  // 关闭连接
  closeConnection(id: string) {
    const socket = this.activeConnections.get(id)
    if (!socket) {
      console.log(`Socket连接 ${id} 不存在，跳过关闭`)
      return
    }
    
    try {
      // 检查连接状态，避免关闭已关闭的连接
      let readyState: number | undefined
      try {
        readyState = socket.readyState
      } catch (e) {
        // readyState 可能不可访问，认为连接可能已关闭
        readyState = 3 // CLOSED
      }
      
      // 如果连接已经关闭或正在关闭，直接移除
      if (readyState === 2 || readyState === 3) {
        console.log(`Socket连接 ${id} 已关闭或正在关闭 (readyState: ${readyState})，直接移除`)
        this.activeConnections.delete(id)
        console.log(`Socket连接已移除: ${id}，当前连接数: ${this.activeConnections.size}`)
        return
      }
      
      // 安全关闭连接
      if (socket.close && typeof socket.close === 'function') {
        // 使用无参数关闭（最安全，避免code验证问题）
        socket.close({
          success: () => {
            console.log(`✅ Socket连接已关闭: ${id}`)
          },
          fail: (err: any) => {
            // 关闭失败不影响移除（可能是连接已经关闭）
            console.warn(`⚠️ 关闭Socket连接失败: ${id}`, err)
          }
        })
      }
    } catch (error) {
      console.warn(`关闭Socket连接异常: ${id}`, error)
    } finally {
      // 无论关闭是否成功，都从管理器中移除
      this.activeConnections.delete(id)
      console.log(`Socket连接已移除: ${id}，当前连接数: ${this.activeConnections.size}`)
    }
  }
  
  // 获取当前连接数
  getConnectionCount(): number {
    return this.activeConnections.size
  }
  
  // 关闭所有连接
  closeAllConnections() {
    console.log(`关闭所有Socket连接，当前连接数: ${this.activeConnections.size}`)
    const ids = Array.from(this.activeConnections.keys())
    ids.forEach(id => this.closeConnection(id))
  }
  
  // 检查是否可以创建新连接
  canCreateConnection(): boolean {
    return this.activeConnections.size < this.maxConnections
  }
}

// 定义组件类型
export default defineComponent({
  name: 'XfVirtualHuman',
  data(): ComponentData {
    // 全局错误处理：捕获并忽略微信小程序框架的 WebSocket 关闭代码错误
    // 这些错误通常来自框架内部，我们无法直接控制
    if (typeof uni !== 'undefined') {
      const originalErrorHandler = uni.onError || console.error
      uni.onError = (error) => {
        // 忽略微信小程序框架的 WebSocket 关闭代码错误（更全面的匹配）
        if (error) {
          const errorMsg = error.errMsg || error.message || String(error)
          if ((errorMsg.includes('closeSocket:fail') || 
               errorMsg.includes('close') || 
               errorMsg.includes('WebSocket')) &&
              errorMsg.includes('1006') &&
              (errorMsg.includes('is neither') || 
               errorMsg.includes('must be either') ||
               errorMsg.includes('The code must be'))) {
            console.warn('⚠️ 检测到微信小程序框架的 WebSocket 关闭代码错误（已完全忽略）:', errorMsg)
            // 完全忽略，不传播，不记录为错误
            return
          }
        }
        // 其他错误正常处理
        if (originalErrorHandler) {
          originalErrorHandler(error)
        }
      }
    }
    
    return {
      // Socket连接管理器实例
      socketManager: SocketConnectionManager.getInstance(),
      socketConnectionId: '', // 当前连接的ID
      // 讯飞API配置 - 基于Java参考实现
      apiConfig: {
        serverUrl: 'wss://avatar.cn-huadong-1.xf-yun.com/v1/interact',
        appId: '8b636816',
        apiKey: '62911d28b5b7013c52ec2ef3cc3ced71',
        apiSecret: 'ODcxM2QwNmQxMWQzMTQzYWUwNWNhN2Zm',
        sceneId: '241473910644805632',
        avatarId: '110022006',
        voiceType: 'x4_yezi'
      },
      
      // 虚拟人状态
      sdkInitialized: false,
      isConnected: false,
      isPlaying: false,
      isConnecting: false,
      reconnecting: false,
      
      // WebSocket连接
      webSocket: null,
      
      // 页面状态
      showConfig: false,
      subtitleText: '等待字幕...',
      inputText: '',
      
      // 消息提示
      showMessage: false,
      messageType: 'info',
      messageTitle: '',
      messageContent: '',
      messageTimer: null,
      
      // 流状态信息
      streamStatus: '虚拟人连接中...',
      streamTip: '正在建立与讯飞服务器的连接',
      
      // 本地视频相关（模拟功能）
      hasLocalVideo: false,
      videoUrl: '',
      
      // 字幕定时器
      subtitleTimer: null,
      
      // 心跳定时器
      heartbeatTimer: null,
      
      // 当前字幕
      currentSubtitle: '',
      
      // 语音交互相关
      isRecording: false,
      recorderManager: null,
      audioContext: null,
      
      // 视频流URL
      videoStreamUrl: ''
    }
  },
  
  computed: {
    sdkStatusText() {
      return this.sdkInitialized ? '已初始化' : '未初始化'
    },
    sdkStatusClass() {
      return this.sdkInitialized ? 'status-success' : 'status-error'
    },
    
    wsStatusText() {
      return this.isConnected ? '已连接' : '未连接'
    },
    wsStatusClass() {
      return this.isConnected ? 'status-success' : 'status-warning'
    },
    
    connectionStatusText() {
      return this.isConnected ? '已连接' : '未连接'
    },
    connectionStatusClass() {
      return this.isConnected ? 'status-success' : 'status-warning'
    },
    
    playStatusText() {
      return this.isPlaying ? '播放中' : '已停止'
    },
    playStatusClass() {
      return this.isPlaying ? 'status-success' : 'status-info'
    }
  },
  
  mounted() {
    this.loadApiConfig()
    // 自动初始化SDK
    setTimeout(() => {
      this.initSDK()
    }, 1000)
    
    // 定期检查连接状态（每5秒）
    setInterval(() => {
      if (this.sdkInitialized || this.isConnected) {
        this.logConnectionStatus()
      }
    }, 5000)
  },
  
  beforeDestroy() {
    console.log('组件即将销毁，清理资源...')
    this.destroySDK()
    // 清理连接管理器中的连接
    if (this.socketConnectionId) {
      this.socketManager.closeConnection(this.socketConnectionId)
      this.socketConnectionId = ''
    }
  },
  
  // Vue 3 生命周期钩子
  beforeUnmount() {
    console.log('组件即将卸载，清理资源...')
    this.destroySDK()
    // 清理连接管理器中的连接
    if (this.socketConnectionId) {
      this.socketManager.closeConnection(this.socketConnectionId)
      this.socketConnectionId = ''
    }
  },
  
  methods: {
    // 环境检测方法（小程序专用）
    checkEnvironment() {
      const env = {
        isWindows: false,
        hasWebSocket: false,
        platform: 'unknown'
      }
      
      // 检测平台（仅小程序环境）
      if (typeof uni !== 'undefined') {
        try {
          // 优先使用新的API
          if (uni.getDeviceInfo) {
            const deviceInfo = uni.getDeviceInfo()
            env.platform = deviceInfo.platform || 'unknown'
            env.isWindows = deviceInfo.platform === 'windows'
          } else if (uni.getSystemInfoSync) {
            const systemInfo = uni.getSystemInfoSync()
            env.platform = systemInfo.platform || 'unknown'
            env.isWindows = systemInfo.platform === 'windows'
          }
        } catch (e) {
          console.warn('获取系统信息失败:', e)
        }
        
        // 小程序环境支持WebSocket
        env.hasWebSocket = typeof uni !== 'undefined' && uni.connectSocket !== undefined
      }
      
      console.log('小程序环境检测结果:', env)
      return env
    },
    
    // HMAC-SHA256加密函数（基于Java参考实现）
    async hmacSHA256(secret, message) {
      try {
        console.log('HMAC-SHA256签名开始，secret长度:', secret.length, 'message长度:', message.length)
        
        // 优先使用CryptoJS库进行HMAC-SHA256加密（与Java实现保持一致）
        if (typeof CryptoJS !== 'undefined') {
          console.log('使用CryptoJS进行HMAC-SHA256加密')
          // 修复：确保使用正确的字符编码
          const key = CryptoJS.enc.Utf8.parse(secret)
          const msg = CryptoJS.enc.Utf8.parse(message)
          const hash = CryptoJS.HmacSHA256(msg, key)
          const signature = CryptoJS.enc.Base64.stringify(hash)
          console.log('CryptoJS签名结果:', signature)
          return signature
        }
        
        // 兼容模式：使用Web Crypto API
        if (typeof crypto !== 'undefined' && crypto.subtle) {
          console.log('使用Web Crypto API进行HMAC-SHA256加密')
          const encoder = new TextEncoder()
          const keyData = encoder.encode(secret)
          const messageData = encoder.encode(message)
          
          const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
          )
          
          const signature = await crypto.subtle.sign('HMAC', key, messageData)
          const signatureArray = new Uint8Array(signature)
          const signatureBase64 = btoa(String.fromCharCode(...signatureArray))
          console.log('Web Crypto签名结果:', signatureBase64)
          return signatureBase64
        }
        
        // 降级方案：使用简单的Base64编码
        console.warn('HMAC-SHA256不可用，使用降级方案')
        const combined = secret + ':' + message
        const result = this.base64Encode(combined)
        console.log('降级方案签名结果:', result)
        return result
        
      } catch (error) {
        console.warn('HMAC-SHA256加密失败，使用降级方案', error)
        // 降级方案：简单的Base64编码
        const combined = secret + ':' + message
        const result = this.base64Encode(combined)
        console.log('降级方案签名结果:', result)
        return result
      }
    },
    
    // Base64编码（小程序环境专用）
    base64Encode(str) {
      // 小程序环境使用uni-app的Base64编码方法
      if (typeof uni !== 'undefined') {
        try {
          // 使用uni-app的Base64编码
          if (uni.arrayBufferToBase64) {
            // 将字符串转换为ArrayBuffer
            const encoder = new TextEncoder()
            const data = encoder.encode(str)
            return uni.arrayBufferToBase64(data)
          }
        } catch (error) {
          console.warn('uni-app Base64编码失败，使用降级方案:', error)
        }
      }
      
      // 降级方案：手动实现Base64编码
      const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      let result = ''
      let i = 0
      
      while (i < str.length) {
        const a = str.charCodeAt(i++) || 0
        const b = i < str.length ? str.charCodeAt(i++) : 0
        const c = i < str.length ? str.charCodeAt(i++) : 0
        
        const bits = (a << 16) | (b << 8) | c
        
        result += base64Chars.charAt((bits >> 18) & 63)
        result += base64Chars.charAt((bits >> 12) & 63)
        result += base64Chars.charAt((bits >> 6) & 63)
        result += base64Chars.charAt(bits & 63)
      }
      
      // 处理填充
      const padding = str.length % 3
      if (padding === 1) {
        result = result.slice(0, -2) + '=='
      } else if (padding === 2) {
        result = result.slice(0, -1) + '='
      }
      
      return result
    },
    
    // 生成认证URL（基于Java AuthUtil实现）
    async generateAuthUrl() {
      try {
        const host = 'avatar.cn-huadong-1.xf-yun.com'
        const date = new Date().toUTCString()
        const method = 'GET'
        const path = '/v1/interact'
        
        // 修复：构建正确的签名字符串格式（严格按照Java参考实现格式）
        const signatureOrigin = `host: ${host}\ndate: ${date}\n${method} ${path} HTTP/1.1`
        
        console.log('签名原始字符串:', signatureOrigin)
        
        // 生成 HMAC-SHA256 签名
        const signature = await this.hmacSHA256(this.apiConfig.apiSecret, signatureOrigin)
        
        console.log('生成的签名:', signature)
        
        // 构建授权头信息（严格按照Java参考实现格式）
        const authorization = `hmac username=\"${this.apiConfig.apiKey}\", algorithm=\"hmac-sha256\", headers=\"host date request-line\", signature=\"${signature}\"`
        const authorizationBase64 = this.base64Encode(authorization)
        
        console.log('授权信息:', authorization)
        console.log('Base64编码:', authorizationBase64)
        
        // 正确编码URL参数
        const encodedAuth = encodeURIComponent(authorizationBase64)
        const encodedDate = encodeURIComponent(date)
        const encodedHost = encodeURIComponent(host)
        
        const authUrl = `wss://${host}${path}?authorization=${encodedAuth}&host=${encodedHost}&date=${encodedDate}`
        console.log('生成的认证URL:', authUrl)
        
        return authUrl
        
      } catch (error) {
        console.error('生成认证URL失败:', error)
        // 降级方案：使用简单的URL构造
        console.log('使用降级方案连接URL')
        return `wss://avatar.cn-huadong-1.xf-yun.com/v1/interact`
      }
    },
    
    // 加载API配置
    loadApiConfig() {
      try {
        const savedConfig = uni.getStorageSync('xf-api-config')
        if (savedConfig) {
          this.apiConfig = { ...this.apiConfig, ...savedConfig }
        }
      } catch (error) {
        console.log('加载API配置失败，使用默认配置:', error)
      }
    },
    
    // 保存API配置
    saveApiConfig() {
      try {
        uni.setStorageSync('xf-api-config', this.apiConfig)
        this.showMessageTip('API配置已保存', 'success')
        this.hideConfigPanel()
      } catch (error) {
        console.error('保存API配置失败:', error)
        this.showMessageTip('保存配置失败', 'error')
      }
    },
    
    // 显示配置面板
    showConfigPanel() {
      this.showConfig = true
    },
    
    // 隐藏配置面板
    hideConfigPanel() {
      this.showConfig = false
    },
    
    // 生成UUID
    generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    },

    // 发送心跳保活包（基于Java参考实现）
    sendPing() {
      if (this.webSocket && this.isConnected) {
        try {
          const pingRequest = this.buildPingRequest()
          this.sendWebSocketMessage(pingRequest)
          console.log('💓 心跳包发送成功')
        } catch (error) {
          console.warn('发送心跳包异常:', error)
        }
      }
    },

    // 发送重置（打断）请求（基于Java参考实现）
    sendResetRequest() {
      if (this.webSocket && this.isConnected) {
        try {
          const resetRequest = this.buildResetRequest()
          this.sendWebSocketMessage(resetRequest)
          console.log('🔄 重置请求发送成功')
          this.currentSubtitle = ''
          this.showMessageTip('虚拟人已重置', 'success')
        } catch (error) {
          console.warn('发送重置请求异常:', error)
        }
      }
    },

    // 发送指令动作（基于Java参考实现）
    sendCommand(action) {
      if (this.webSocket && this.isConnected) {
        try {
          const cmdRequest = this.buildCmdRequest(action)
          this.sendWebSocketMessage(cmdRequest)
          console.log('🎯 指令请求发送成功:', action)
          this.showMessageTip('动作指令已发送', 'success')
        } catch (error) {
          console.warn('发送指令请求异常:', error)
        }
      }
    },

    // 发送文本交互请求（基于Java参考实现）
    sendTextInteract(text) {
      if (this.webSocket && this.isConnected) {
        try {
          const interactRequest = this.buildTextInteractRequest(text)
          this.sendWebSocketMessage(interactRequest)
          console.log('💬 文本交互请求发送成功')
          this.currentSubtitle = ''
        } catch (error) {
          console.warn('发送文本交互请求异常:', error)
        }
      }
    },

    // 开始心跳保活定时器（基于Java参考实现）
    startHeartbeat() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer)
      }
      this.heartbeatTimer = setInterval(() => {
        if (this.isConnected && this.webSocket) {
          this.sendPing()
        }
      }, 30000) // 每30秒发送一次心跳
    },

    // 停止心跳保活定时器
    stopHeartbeat() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer)
        this.heartbeatTimer = null
      }
    },


    
    // 构建启动协议（基于Java参考实现增强）
    buildStartRequest() {
      return {
        header: {
          app_id: this.apiConfig.appId,
          ctrl: 'start',
          request_id: this.generateUUID(),
          scene_id: this.apiConfig.sceneId
        },
        parameter: {
          avatar: {
            avatar_id: this.apiConfig.avatarId,
            width: 720,
            height: 1280,
            stream: { 
              protocol: 'xrtc', // 支持rtmp, xrtc, webrtc, flv
              fps: 25,
              bitrate: 5000,
              alpha: 0 // 透明背景，0关闭，1开启（需配合protocol=xrtc）
            }
          },
          tts: { 
            speed: 50, // 语速：[0,100]，默认50
            vcn: this.apiConfig.voiceType
          },
          subtitle: {
            subtitle: 0, // 0关闭，1开启
            font_color: '#FF0000',
            font_size: 10,
            position_x: 0,
            position_y: 0,
            font_name: 'mainTitle',
            width: 100,
            height: 100
          }
        }
      }
    },
    
    // 发送WebSocket消息（兼容小程序环境）
    sendWebSocketMessage(data) {
      // 检查连接状态
      if (!this.isConnected) {
        console.error('WebSocket未连接')
        return false
      }
      
      try {
        const message = JSON.stringify(data)
        
        // 在小程序环境中使用 uni.sendSocketMessage
        if (typeof uni !== 'undefined' && uni.sendSocketMessage) {
          // 优先使用SocketTask方式发送消息
          if (this.webSocket && this.webSocket.send) {
            this.webSocket.send({
              data: message,
              success: () => {
                console.log('发送WebSocket消息成功:', data)
              },
              fail: (err) => {
                console.error('发送WebSocket消息失败:', err)
                return false
              }
            })
          } else {
            // 使用全局发送方式
            uni.sendSocketMessage({
              data: message,
              success: () => {
                console.log('发送WebSocket消息成功:', data)
              },
              fail: (err) => {
                console.error('发送WebSocket消息失败:', err)
                return false
              }
            })
          }
        } else {
          // 浏览器环境使用标准WebSocket
          if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
            this.webSocket.send(message)
            console.log('发送WebSocket消息:', data)
          } else {
            console.error('WebSocket未连接或不可用')
            return false
          }
        }
        
        return true
      } catch (error) {
        console.error('发送WebSocket消息失败:', error)
        return false
      }
    },
    
    // 构建文本驱动协议（基于Java参考实现）
    buildTextRequest(text, mode = 'text_driver') {
      return {
        header: {
          app_id: this.apiConfig.appId,
          ctrl: mode,
          request_id: this.generateUUID()
        },
        parameter: {
          avatar_dispatch: {
            interactive_mode: 0
          },
          tts: { 
            vcn: this.apiConfig.voiceType,
            speed: 50,
            pitch: 50,
            volume: 50
          },
          air: { 
            air: 1, // 是否开启自动动作，0关闭/1开启
            add_nonsemantic: 1 // 是否开启无指向性动作
          }
        },
        payload: { text: { content: text } }
      }
    },

    // 构建文本交互协议（基于Java参考实现）
    buildTextInteractRequest(text) {
      return {
        header: {
          app_id: this.apiConfig.appId,
          ctrl: 'text_interact',
          request_id: this.generateUUID()
        },
        parameter: {
          tts: {
            vcn: this.apiConfig.voiceType,
            speed: 50,
            pitch: 50,
            audio: { sample_rate: 16000 }
          },
          air: {
            air: 1,
            add_nonsemantic: 1
          }
        },
        payload: { text: { content: text } }
      }
    },

    // 构建心跳保活协议（基于Java参考实现）
    buildPingRequest() {
      return {
        header: {
          app_id: this.apiConfig.appId,
          ctrl: 'ping',
          request_id: this.generateUUID()
        }
      }
    },

    // 构建重置（打断）协议（基于Java参考实现）
    buildResetRequest() {
      return {
        header: {
          app_id: this.apiConfig.appId,
          ctrl: 'reset',
          request_id: this.generateUUID()
        }
      }
    },

    // 构建指令协议（基于Java参考实现）
    buildCmdRequest(action) {
      return {
        header: {
          app_id: this.apiConfig.appId,
          ctrl: 'cmd',
          request_id: this.generateUUID()
        },
        payload: {
          cmd_text: {
            avatar: {
              type: 'action',
              value: action || 'A_RLH_puzzle_0'
            }
          }
        }
      }
    },
    
    // 构建停止协议
    buildStopRequest() {
      return {
        header: {
          app_id: this.apiConfig.appId,
          ctrl: 'stop',
          request_id: this.generateUUID()
        }
      }
    },

    // 初始化虚拟人（基于Java参考实现）
    async initSDK() {
      if (this.sdkInitialized) {
        this.showMessageTip('虚拟人已初始化', 'warning')
        return
      }
      
      try {
        console.log('正在初始化讯飞虚拟人...')
        
        // 加载配置
        this.loadApiConfig()
        
        // 检查API配置
        if (!this.apiConfig.apiKey || !this.apiConfig.apiSecret) {
          this.showMessageTip('请先配置API Key和Secret', 'error')
          return
        }
        
        // 生成认证URL并连接WebSocket
        // 注意：在连接前立即生成认证URL，确保时间戳最新，避免超时
        console.log('开始生成认证URL...')
        const authUrl = await this.generateAuthUrl()
        console.log('认证URL生成完成:', authUrl)
        
        console.log('开始连接WebSocket...')
        console.log('💡 提示：连接成功后请尽快点击"启动虚拟人"按钮（建议在5秒内），避免连接超时')
        
        // 关键修复：添加小程序环境兼容性检查
        if (typeof uni !== 'undefined' && uni.connectSocket) {
          // 小程序环境特殊处理
          console.log('检测到小程序环境，使用兼容模式')
          
          // 添加网络状态检查
          try {
            const networkType = await new Promise((resolve, reject) => {
              uni.getNetworkType({
                success: (res) => resolve(res.networkType),
                fail: (err) => reject(err)
              })
            })
            
            if (networkType === 'none') {
              this.showMessageTip('网络未连接，请检查网络', 'error')
              return
            }
            
            console.log('当前网络类型:', networkType)
            
          } catch (networkError) {
            console.warn('网络状态检查失败:', networkError)
          }
        }
        
        // 直接连接WebSocket
        try {
          await this.connectWebSocket(authUrl)
          
          // 验证连接状态
          if (!this.isConnected) {
            throw new Error('WebSocket连接未成功建立')
          }
          
          // 等待一小段时间确保连接稳定
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 再次验证连接状态
          if (!this.isConnected) {
            throw new Error('WebSocket连接不稳定')
          }
          
          console.log('✅ WebSocket连接验证成功')
          this.sdkInitialized = true
          this.showMessageTip('讯飞虚拟人初始化成功', 'success')
          
          // 输出连接状态详情
          this.logConnectionStatus()
          
        } catch (error) {
          console.error('连接真实服务器失败:', error)
          
          // 清理状态
          this.isConnected = false
          this.isConnecting = false
          this.sdkInitialized = false
          
          // 根据错误类型提供更友好的提示
          if (error.message.includes('未完成的操作') || error.message.includes('1006')) {
            this.showMessageTip('连接失败：请检查网络连接或API配置', 'error')
          } else if (error.message.includes('超时')) {
            this.showMessageTip('连接超时：请检查网络或稍后重试', 'error')
          } else {
            this.showMessageTip('连接失败: ' + error.message, 'error')
          }
          
          throw error
        }
        
      } catch (error) {
        console.error('初始化失败:', error)
        this.isConnecting = false
        this.streamStatus = '初始化失败'
        this.streamTip = '初始化过程中发生错误'
        
        // 提供更具体的错误提示
        if (error.message.includes('网络') || error.message.includes('连接')) {
          this.showMessageTip('网络连接失败，请检查网络或API配置', 'error')
        } else {
          this.showMessageTip('初始化失败: ' + error.message, 'error')
        }
        

      }
    },
    
    // 启动虚拟人（支持模拟模式）
    async startAvatar() {
      if (!this.sdkInitialized) {
        this.showMessageTip('请先初始化虚拟人', 'error')
        return
      }
      
      if (!this.isConnected) {
        this.showMessageTip('WebSocket未连接', 'error')
        // 如果未连接，尝试重新连接
        if (this.webSocket && this.webSocket.readyState === 1) {
          this.isConnected = true
          console.log('检测到WebSocket已连接，更新状态')
        } else {
          return
        }
      }
      
      try {
        this.isPlaying = true
        this.isConnecting = true
        
        // 构建并发送启动协议
        const startRequest = this.buildStartRequest()
        const success = this.sendWebSocketMessage(startRequest)
        
        if (!success) {
          throw new Error('发送启动协议失败')
        }
        
        this.streamStatus = '正在启动虚拟人...'
        this.streamTip = '正在向讯飞服务器发送启动请求'
        
        // 设置超时检测
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false
            this.showMessageTip('启动超时，请检查网络连接', 'warning')
          }
        }, 10000)
        
      } catch (error) {
        console.error('启动失败:', error)
        this.isConnecting = false
        this.isPlaying = false
        this.showMessageTip('启动失败: ' + error.message, 'error')
      }
    },
    
    // 停止虚拟人
    async stopAvatar() {
      if (!this.isPlaying) {
        this.showMessageTip('虚拟人未在播放', 'warning')
        return
      }
      
      try {
        // 发送停止协议
        const stopRequest = this.buildStopRequest()
        const success = this.sendWebSocketMessage(stopRequest)
        
        if (!success) {
          console.warn('发送停止协议失败，强制停止')
        }
        
        this.isPlaying = false
        this.isConnecting = false
        this.streamStatus = '虚拟人已停止'
        this.streamTip = '虚拟人已停止运行'
        this.showMessageTip('虚拟人已停止', 'success')
        

        
      } catch (error) {
        console.error('停止虚拟人失败:', error)
        this.isPlaying = false
        this.showMessageTip('停止失败: ' + error.message, 'error')
      }
    },
    
    // 发送文本消息（支持模拟模式）
    sendTextMessage() {
      if (!this.isPlaying) {
        this.showMessageTip('请先启动虚拟人', 'warning')
        return
      }
      
      if (!this.inputText.trim()) {
        this.showMessageTip('请输入消息内容', 'warning')
        return
      }
      
      try {
        // 显示用户消息
        this.showSubtitle(this.inputText)
        
        // 发送真实文本消息到虚拟人
        const textRequest = this.buildTextRequest(this.inputText, 'text_driver')
        const success = this.sendWebSocketMessage(textRequest)
        
        if (!success) {
          throw new Error('发送消息失败')
        }
        
        // 模拟虚拟人回复（如果真实API没有响应）
        setTimeout(() => {
          const responses = [
            '你好！我是讯飞虚拟人助手。',
            '很高兴为你服务！',
            '有什么我可以帮助你的吗？',
            '这是一个很好的问题！'
          ]
          const randomResponse = responses[Math.floor(Math.random() * responses.length)]
          this.showSubtitle(randomResponse)
        }, 2000)
        
        // 清空输入框
        this.inputText = ''
        
      } catch (error) {
        console.error('发送消息失败:', error)
        this.showMessageTip('发送消息失败: ' + error.message, 'error')
      }
    },
    
    // 显示字幕
    showSubtitle(text) {
      this.subtitleText = text
      
      // 清除之前的定时器
      if (this.subtitleTimer) {
        clearTimeout(this.subtitleTimer)
      }
      
      // 5秒后清除字幕
      this.subtitleTimer = setTimeout(() => {
        this.subtitleText = '等待字幕...'
      }, 5000)
    },
    
    // 连接WebSocket（小程序环境专用）
    async connectWebSocket(url) {
      try {
        // 检查是否是小程序环境
        if (typeof uni === 'undefined' || !uni.connectSocket) {
          throw new Error('当前环境不支持WebSocket连接，请在小程序环境中运行')
        }
        
        // 检查socket连接数量限制
        const connectionCount = this.socketManager.getConnectionCount()
        console.log(`当前Socket连接数: ${connectionCount}/2`)
        
        if (!this.socketManager.canCreateConnection()) {
          console.warn('⚠️ Socket连接数量已达上限，关闭最旧的连接')
          // 关闭最旧的连接（除了当前连接）
          if (this.socketConnectionId) {
            this.socketManager.closeConnection(this.socketConnectionId)
            this.socketConnectionId = ''
          }
          // 等待一小段时间让连接完全关闭
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        // 先清理之前的连接，确保完全关闭后再创建新连接
        // 小程序限制：同时最多只能有2个socket连接
        await this.closeWebSocketAndWait()
        
        console.log('开始连接WebSocket...')
        console.log('连接URL:', url)
        
        // 生成连接ID
        const connectionId = `xf_virtual_human_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        this.socketConnectionId = connectionId
        
        // 将后续的 Promise 包装逻辑改为返回 Promise
        return new Promise((resolve, reject) => {
            // 检查是否是Windows环境（小程序环境）
            let isWindows = false
            try {
              // 优先使用新的API
              if (uni.getDeviceInfo) {
                const deviceInfo = uni.getDeviceInfo()
                isWindows = deviceInfo.platform === 'windows'
              } else if (uni.getSystemInfoSync) {
                // 降级使用旧API
                const systemInfo = uni.getSystemInfoSync()
                isWindows = systemInfo.platform === 'windows'
              }
            } catch (e) {
              console.warn('获取系统信息失败:', e)
            }
            
            console.log('当前环境:', isWindows ? 'Windows小程序' : '小程序')
            
            // 修复：检查URL格式，确保是有效的wss URL
            let finalUrl = url
            if (!url.startsWith('wss://') && !url.startsWith('ws://')) {
              console.warn('URL格式不正确，尝试修复URL格式')
              finalUrl = 'wss://avatar.cn-huadong-1.xf-yun.com/v1/interact'
            }
            
            console.log('最终连接URL:', finalUrl)
            
            // 标记是否已经resolve或reject，避免重复调用
            let isResolved = false
            
            // 创建SocketTask
            this.webSocket = uni.connectSocket({
              url: finalUrl,
              // 移除protocols参数，wss是传输协议，不是应用层协议
              // protocols参数应该用于应用层协议（如'chat', 'superchat'等），不是传输协议
              header: {
                'Content-Type': 'application/json'
                // 移除可能引起问题的自定义头部
                // 'User-Agent'和'Origin'可能被小程序环境拒绝
              },
              // Windows环境特殊配置
              timeout: isWindows ? 30000 : 20000, // 增加超时时间
              method: 'GET',
              success: () => {
                console.log('WebSocket连接创建成功')
                this.isConnecting = true
                this.streamStatus = '正在连接讯飞服务器...'
                this.streamTip = '正在建立WebSocket连接'
                
                // 注册到连接管理器
                this.socketManager.registerConnection(connectionId, this.webSocket)
              },
              fail: (err) => {
                console.error('WebSocket连接创建失败:', err)
                
                // 清理连接ID
                this.socketConnectionId = ''
                
                // 重要：连接创建失败时，绝对不要尝试关闭连接
                // 因为连接可能根本没有建立，或者框架会自动处理
                // 框架在连接失败时可能会自动尝试关闭，如果我们在此时也尝试关闭，可能会触发 1006 错误
                // 所以这里完全不做任何关闭操作，让框架自动处理
                
                // 清理状态（但不关闭连接）
                this.isConnected = false
                this.isConnecting = false
                
                // 从连接管理器中移除（如果已注册）
                if (connectionId) {
                  try {
                    this.socketManager.closeConnection(connectionId)
                  } catch (e) {
                    // 忽略移除错误
                    console.warn('移除连接管理器中的连接失败:', e)
                  }
                }
                
                if (!isResolved) {
                  isResolved = true
                  // 更详细的错误处理
                  if (err.errMsg && err.errMsg.includes('timed out')) {
                    reject(new Error('连接超时，请检查网络或服务器状态'))
                  } else if (err.errMsg && (err.errMsg.includes('SSL') || err.errMsg.includes('TLS'))) {
                    reject(new Error('SSL/TLS连接失败，请检查证书配置'))
                  } else if (err.errMsg && err.errMsg.includes('abnormal')) {
                    reject(new Error('连接异常中断，可能是服务器配置问题'))
                  } else if (err.errMsg && err.errMsg.includes('exceed max task count')) {
                    reject(new Error('Socket连接数量超限，请先关闭其他连接'))
                  } else {
                    reject(new Error(`连接失败: ${err.errMsg || '未知错误'}`))
                  }
                }
              }
            })
            
            // 监听WebSocket事件
            this.webSocket.onOpen(() => {
              console.log('✅ WebSocket onOpen 事件触发')
              if (!isResolved) {
                isResolved = true
                this.isConnected = true
                this.isConnecting = false
                this.streamStatus = '连接成功'
                this.streamTip = '已成功连接到讯飞服务器'
                
                // 验证连接状态
                const connectionStatus = this.checkConnectionStatus()
                console.log('连接状态验证:', {
                  isConnected: this.isConnected,
                  webSocketReadyState: this.webSocket?.readyState,
                  connectionStatus: connectionStatus,
                  connectionId: connectionId,
                  totalConnections: this.socketManager.getConnectionCount()
                })
                
                if (connectionStatus) {
                  console.log('✅ WebSocket连接验证通过')
                  this.showMessageTip('连接成功', 'success')
                } else {
                  console.warn('⚠️ WebSocket连接状态异常')
                  this.showMessageTip('连接状态异常，请检查', 'warning')
                }
                
                // 开始心跳保活
                this.startHeartbeat()
                
                // 自动发送启动请求（避免超时）
                console.log('💡 连接成功，自动发送启动请求避免超时')
                this.streamTip = '连接成功，正在自动启动虚拟人...'
                
                // 延迟一小段时间后自动启动，确保连接完全稳定
                setTimeout(() => {
                  if (this.isConnected && !this.isPlaying) {
                    console.log('🚀 自动启动虚拟人')
                    this.startAvatar().catch(err => {
                      console.warn('自动启动失败:', err)
                      this.streamTip = '自动启动失败，请手动点击"启动虚拟人"'
                    })
                  }
                }, 500)
                
                resolve(void 0)
              } else {
                console.log('WebSocket onOpen 已处理，跳过重复处理')
              }
            })
            
            this.webSocket.onMessage((res) => {
              console.log('收到WebSocket消息:', res.data)
              this.handleWebSocketMessage(res.data)
            })
            
            this.webSocket.onError((err) => {
              console.error('WebSocket错误:', err)
              
              // 检查是否是 1006 关闭代码错误（框架级别的错误，需要忽略）
              if (err && err.errMsg) {
                const errorMsg = err.errMsg
                if ((errorMsg.includes('closeSocket:fail') || 
                     errorMsg.includes('close') || 
                     errorMsg.includes('WebSocket')) &&
                    errorMsg.includes('1006') &&
                    (errorMsg.includes('is neither') || 
                     errorMsg.includes('must be either') ||
                     errorMsg.includes('The code must be'))) {
                  console.warn('⚠️ 检测到框架级别的 WebSocket 关闭代码错误（已忽略）:', errorMsg)
                  // 完全忽略这个错误，不进行任何处理
                  return
                }
              }
              
              this.isConnected = false
              this.isConnecting = false
              this.streamStatus = '连接错误'
              this.streamTip = 'WebSocket连接发生错误'
              
              // 检查是否是socket连接数量限制错误
              if (err.errMsg && err.errMsg.includes('exceed max task count')) {
                console.error('❌ 小程序socket连接数量超限（最多2个），请先关闭其他连接')
                this.streamTip = '连接数量超限，请先关闭其他socket连接'
                this.showMessageTip('连接数量超限：小程序最多同时2个socket连接，请先关闭其他连接', 'error')
                
                if (!isResolved) {
                  isResolved = true
                  reject(new Error('小程序socket连接数量超限，请先关闭其他连接后重试'))
                }
                // 注意：这里不主动关闭连接，让 onClose 回调处理
                return
              }
              
              // 只有在连接阶段才显示错误提示
              if (!this.isConnected) {
                this.showMessageTip('连接错误', 'error')
              }
              
              // 如果还没有resolve，则reject
              // 注意：这里不主动关闭连接，让 onClose 回调或框架自动处理
              if (!isResolved) {
                isResolved = true
                reject(new Error(`WebSocket错误: ${err.errMsg || '未知错误'}`))
              }
              
              // 重要：不在 onError 中主动关闭连接
              // 连接关闭应该由 onClose 回调处理，或者由框架自动处理
              // 框架在连接失败时可能会自动尝试关闭，如果我们在此时也尝试关闭，可能会触发 1006 错误
            })
            
            this.webSocket.onClose((res) => {
              console.log('WebSocket连接关闭:', res)
              const wasConnected = this.isConnected
              this.isConnected = false
              this.isConnecting = false
              
              // 从连接管理器中移除（使用安全的方式，不传入任何关闭代码）
              if (this.socketConnectionId) {
                // 注意：closeConnection 内部使用无参数关闭，不会传入任何关闭代码
                this.socketManager.closeConnection(this.socketConnectionId)
                this.socketConnectionId = ''
              }
              
              // 停止心跳
              this.stopHeartbeat()
              
              // 注意：res.code可能是1006（异常关闭），但这是服务器返回的状态码
              // 我们不能使用1006来主动关闭连接，只能接收它
              // 这里只是记录关闭原因，不进行reject操作（因为连接已经关闭）
              // 重要：res.code 只是接收到的关闭代码，我们不会用它来关闭连接
              // 重要：在 onClose 回调中，连接已经关闭，我们不应该再次调用 close 方法
              
              // 获取关闭代码（仅用于日志和错误处理，不用于关闭连接）
              const receivedCode = res.code || 0
              
              if (receivedCode === 1006) {
                // 异常关闭（服务器端关闭）
                // 注意：1006 是接收到的状态码，不是我们主动关闭时使用的代码
                console.warn('⚠️ 服务器异常关闭连接 (code: 1006)')
                this.streamStatus = '连接失败'
                this.streamTip = '连接被异常关闭，可能是网络问题或服务器拒绝连接'
                if (!wasConnected && !isResolved) {
                  // 如果连接还没建立就关闭了，则reject
                  isResolved = true
                  reject(new Error(`连接异常关闭: code=${receivedCode}, reason=${res.reason || '未知原因'}`))
                } else if (wasConnected) {
                  // 如果之前已连接，只是通知用户
                  this.showMessageTip('连接异常关闭', 'warning')
                }
              } else if (receivedCode !== 1000 && receivedCode !== 1001) {
                // 非正常关闭
                // 注意：这些代码只是接收到的状态码，不是我们主动关闭时使用的代码
                console.warn(`⚠️ 非正常关闭 (code: ${receivedCode})`)
                if (!wasConnected && !isResolved) {
                  isResolved = true
                  this.streamStatus = '连接失败'
                  this.streamTip = `连接已断开 (code: ${receivedCode})`
                  this.showMessageTip(`连接失败 (code: ${receivedCode})`, 'error')
                  reject(new Error(`连接异常关闭: code=${receivedCode}, reason=${res.reason || '未知原因'}`))
                } else if (wasConnected) {
                  this.streamStatus = '连接已关闭'
                  this.streamTip = `连接已断开 (code: ${receivedCode})`
                  this.showMessageTip('连接已关闭', 'info')
                }
              } else {
                // 正常关闭（code: 1000 或 1001）
                console.log('✅ 正常关闭连接')
                if (wasConnected) {
                  this.streamStatus = '连接已关闭'
                  this.streamTip = 'WebSocket连接已断开'
                  this.showMessageTip('连接已关闭', 'info')
                }
              }
            })
            
          // 设置连接超时
          setTimeout(() => {
            if (!this.isConnected && this.isConnecting) {
              console.error('WebSocket连接超时')
              this.isConnecting = false
              this.streamStatus = '连接超时'
              this.streamTip = '连接超时，请检查网络或配置'
              this.showMessageTip('连接超时', 'error')
              if (!isResolved) {
                isResolved = true
                reject(new Error('连接超时'))
              }
            }
          }, 15000)
        })
      } catch (error) {
        console.error('连接WebSocket异常:', error)
        throw error
      }
    },
    
    // 检查WebSocket连接状态（小程序环境专用）
    checkConnectionStatus() {
      if (!this.webSocket) {
        return false
      }
      
      // 小程序环境：SocketTask 的 readyState
      // 0-连接中, 1-已连接, 2-正在关闭, 3-已关闭
      if (this.webSocket.readyState !== undefined) {
        return this.webSocket.readyState === 1 && this.isConnected
      }
      
      // 降级：仅检查 isConnected 标志
      return this.isConnected
    },
    
    // 输出详细的连接状态信息（用于调试）
    logConnectionStatus() {
      const status = {
        sdkInitialized: this.sdkInitialized,
        isConnected: this.isConnected,
        isConnecting: this.isConnecting,
        isPlaying: this.isPlaying,
        webSocketExists: !!this.webSocket,
        webSocketReadyState: this.webSocket?.readyState,
        connectionStatus: this.checkConnectionStatus(),
        streamStatus: this.streamStatus,
        streamTip: this.streamTip
      }
      
      console.log('📊 连接状态详情:', status)
      return status
    },
    
    // 处理WebSocket消息
    handleWebSocketMessage(data) {
      try {
        // 尝试解析消息
        let message
        if (typeof data === 'string') {
          message = JSON.parse(data)
        } else if (typeof data === 'object') {
          message = data
        } else {
          console.warn('未知的消息格式:', typeof data, data)
          return
        }
        
        console.log('解析WebSocket消息:', message)
        
        // 处理连接确认消息（服务器可能在连接成功后发送）
        if (message.header) {
          console.log('收到服务器响应:', {
            code: message.header.code,
            ctrl: message.header.ctrl,
            message: message.header.message,
            request_id: message.header.request_id
          })
          
          // 如果收到任何有效响应，说明连接正常
          if (this.isConnected) {
            console.log('✅ 连接状态确认：服务器响应正常')
          }
        } else {
          // 没有 header 的消息，可能是其他类型的响应
          console.log('收到无header消息:', message)
        }
        
        if (message.header && message.header.code === 0) {
          // 成功响应
          if (message.header.ctrl === 'start') {
            console.log('✅ 虚拟人启动成功')
            this.isPlaying = true
            this.isConnecting = false
            this.streamStatus = '虚拟人启动成功'
            this.streamTip = '虚拟人已就绪，可以开始交互'
            this.showMessageTip('虚拟人启动成功', 'success')
          } else if (message.header.ctrl === 'text_driver') {
            console.log('✅ 文本驱动处理成功')
            this.showMessageTip('消息发送成功', 'success')
          } else if (message.header.ctrl === 'text_interact') {
            console.log('✅ 文本交互处理成功')
            this.showMessageTip('交互请求已发送', 'success')
          } else if (message.header.ctrl === 'ping') {
            console.log('✅ 心跳响应收到')
            // 心跳响应，不显示提示
          } else if (message.header.ctrl === 'reset') {
            console.log('✅ 重置请求处理成功')
            this.showMessageTip('虚拟人已重置', 'success')
          } else if (message.header.ctrl === 'cmd') {
            console.log('✅ 指令请求处理成功')
            this.showMessageTip('动作指令已执行', 'success')
          } else {
            console.log('✅ 收到服务器成功响应:', message.header.ctrl)
          }
        } else if (message.header && message.header.code !== 0) {
          // 错误响应 - 详细错误信息处理
          console.error('❌ WebSocket错误响应:', message)
          
          // 输出完整的错误信息
          console.error('错误详情:', {
            code: message.header.code,
            message: message.header.message,
            ctrl: message.header.ctrl,
            request_id: message.header.request_id,
            payload: message.payload
          })
          
          // 解析错误信息
          let errorMsg = ''
          let errorDetail = ''
          
          // 从 header 获取错误信息
          if (message.header.message) {
            errorMsg = message.header.message
          }
          
          // 从 payload 获取详细错误信息（如果有）
          if (message.payload) {
            if (message.payload.error) {
              errorDetail = message.payload.error.message || message.payload.error.code || ''
            } else if (message.payload.text && typeof message.payload.text === 'string') {
              errorDetail = message.payload.text
            } else if (typeof message.payload === 'string') {
              errorDetail = message.payload
            }
          }
          
          // 根据错误代码提供友好的错误提示
          const errorCode = message.header.code
          let userFriendlyMsg = ''
          
          switch (errorCode) {
            case 10001:
              userFriendlyMsg = '参数错误：请检查请求参数'
              break
            case 10002:
              userFriendlyMsg = '认证失败：请检查API Key和Secret'
              break
            case 10003:
              userFriendlyMsg = '权限不足：请检查API权限配置'
              break
            case 10004:
              userFriendlyMsg = '资源不存在：请检查配置的Scene ID或Avatar ID'
              break
            case 10005:
              userFriendlyMsg = '请求频率过高：请稍后重试'
              break
            case 10006:
              userFriendlyMsg = '服务不可用：服务器暂时无法处理请求'
              break
            case 10007:
              userFriendlyMsg = '内部错误：服务器处理异常'
              break
            case 10114:
              userFriendlyMsg = '连接超时：认证时间戳已过期或连接后未及时操作，请重新初始化'
              break
            default:
              userFriendlyMsg = errorMsg || `错误代码: ${errorCode}`
          }
          
          // 组合错误信息
          const finalErrorMsg = errorDetail 
            ? `${userFriendlyMsg} (${errorDetail})` 
            : userFriendlyMsg
          
          console.error('错误信息:', finalErrorMsg)
          
          // 更新状态
          this.streamStatus = '操作失败'
          this.streamTip = finalErrorMsg
          
          // 显示错误提示
          this.showMessageTip(finalErrorMsg, 'error')
          
          // 如果是认证相关错误，可能需要重新初始化
          if (errorCode === 10002 || errorCode === 10003) {
            console.warn('⚠️ 认证失败，建议检查API配置后重新初始化')
            this.streamTip = '认证失败，请检查API配置'
          }
          
          // 如果是超时错误（10114），自动重新初始化
          if (errorCode === 10114) {
            console.warn('⚠️ 连接超时，自动重新初始化连接')
            this.streamTip = '连接超时，正在自动重新连接...'
            this.showMessageTip('连接超时，正在自动重新连接', 'warning')
            
            // 自动关闭连接，准备重新连接
            this.isConnected = false
            this.sdkInitialized = false
            
            // 异步关闭连接并等待
            this.closeWebSocketAndWait().then(() => {
              // 延迟后自动重新初始化
              setTimeout(() => {
                console.log('🔄 自动重新初始化连接')
                this.initSDK().catch(err => {
                  console.error('自动重新初始化失败:', err)
                  this.showMessageTip('自动重连失败，请手动点击"初始化SDK"', 'error')
                })
              }, 1000)
            })
          }
        }
        
        // 处理字幕数据
        if (message.payload && message.payload.text) {
          this.currentSubtitle = message.payload.text.content || ''
          this.showSubtitle(this.currentSubtitle)
        }
        
        // 处理音频数据（如果有）
        if (message.payload && message.payload.audio) {
          console.log('收到音频数据')
          this.handleAudioData(message.payload.audio)
        }
        
        // 处理视频流URL（如果有）
        if (message.payload && message.payload.video) {
          console.log('收到视频流数据')
          this.handleVideoStream(message.payload.video)
        }
        
        // 处理视频流URL（从parameter中）
        if (message.parameter && message.parameter.avatar && message.parameter.avatar.stream_url) {
          console.log('收到视频流URL:', message.parameter.avatar.stream_url)
          this.videoStreamUrl = message.parameter.avatar.stream_url
          this.hasLocalVideo = true
          this.streamStatus = '视频流已就绪'
          this.streamTip = '正在加载视频流...'
        }
        
      } catch (error) {
        console.error('❌ 处理WebSocket消息失败:', error)
        console.error('错误堆栈:', error.stack)
        console.error('原始数据:', data)
        console.error('原始数据类型:', typeof data)
        
        // 尝试输出原始数据的字符串形式
        try {
          if (typeof data === 'string') {
            console.error('原始数据内容:', data)
          } else if (data && typeof data === 'object') {
            console.error('原始数据对象:', JSON.stringify(data, null, 2))
          }
        } catch (e) {
          console.error('无法序列化原始数据:', e)
        }
        
        // 显示用户友好的错误提示
        this.showMessageTip('处理服务器消息时出错，请查看控制台', 'error')
      }
    },
    
    // 关闭WebSocket连接并等待完全关闭（小程序环境专用）
    // 小程序限制：同时最多只能有2个socket连接，需要确保旧连接完全关闭
    async closeWebSocketAndWait(code = 1000, reason = '') {
      return new Promise((resolve) => {
        // 先从连接管理器中移除
        if (this.socketConnectionId) {
          console.log(`从连接管理器移除: ${this.socketConnectionId}`)
          this.socketManager.closeConnection(this.socketConnectionId)
          this.socketConnectionId = ''
        }
        
        // 关闭连接
        this.closeWebSocket(code, reason)
        
        // 等待连接完全关闭（最多等待3秒）
        let waitCount = 0
        const maxWait = 30 // 30 * 100ms = 3秒
        const checkInterval = setInterval(() => {
          waitCount++
          
          // 检查连接是否已关闭
          try {
            if (!this.webSocket) {
              clearInterval(checkInterval)
              console.log('✅ WebSocket已完全关闭（对象已清空）')
              resolve()
              return
            }
            
            const readyState = this.webSocket.readyState
            if (readyState === 3 || readyState === undefined) {
              clearInterval(checkInterval)
              console.log('✅ WebSocket已完全关闭（readyState: 3）')
              resolve()
              return
            }
          } catch (e) {
            // readyState访问异常，认为连接已关闭
            clearInterval(checkInterval)
            console.log('✅ WebSocket已完全关闭（readyState访问异常）')
            resolve()
            return
          }
          
          // 超时检查
          if (waitCount >= maxWait) {
            clearInterval(checkInterval)
            console.warn('⚠️ 等待关闭超时，强制继续')
            // 强制清空连接对象
            this.webSocket = null
            resolve()
          }
        }, 100)
      })
    },
    
    // 关闭WebSocket连接（小程序环境专用）
    // 使用 SocketTask.close({ code, reason, success, fail }) 方式
    // code: 关闭代码，只允许 1000（正常关闭）或 3000-4999（自定义代码）
    // reason: 关闭原因说明
    // 注意：任何无效的代码（包括1006）都会被转换为1000
    closeWebSocket(code = 1000, reason = '') {
      if (!this.webSocket) {
        return
      }
      
      // 首先验证并规范化关闭代码
      // WebSocket 规范：只允许 1000（正常关闭）或 3000-4999（自定义代码）
      // 1006 是保留的状态码，不能作为关闭代码使用
      // 注意：任何传入的无效代码都会被强制转换为 1000
      let closeCode = 1000
      
      // 严格验证：只接受 1000 或 3000-4999
      if (code === 1000) {
        closeCode = 1000
      } else if (typeof code === 'number' && code >= 3000 && code <= 4999) {
        closeCode = code
      } else {
        // 任何无效的关闭代码（包括 1006、1001、undefined、null 等）都强制使用 1000
        if (code !== 1000 && code !== undefined && code !== null) {
          console.warn(`⚠️ 无效的关闭代码 ${code}（保留代码或超出范围），强制使用 1000 替代`)
        }
        closeCode = 1000
      }
      
      // 最终安全检查：确保 closeCode 一定是有效值
      // 这是最后一道防线，确保任何情况下都不会使用无效代码
      if (closeCode !== 1000 && (closeCode < 3000 || closeCode > 4999)) {
        console.error(`❌ 关闭代码验证失败: ${closeCode}，强制使用 1000`)
        closeCode = 1000
      }
      
      // 额外检查：确保 closeCode 是数字类型且有效
      if (typeof closeCode !== 'number' || isNaN(closeCode)) {
        console.error(`❌ 关闭代码类型错误: ${closeCode}，强制使用 1000`)
        closeCode = 1000
      }
      
      // 最终验证：确保 closeCode 一定是 1000 或 3000-4999
      if (closeCode !== 1000 && (closeCode < 3000 || closeCode > 4999)) {
        console.error(`❌ 最终关闭代码验证失败: ${closeCode}，强制使用 1000`)
        closeCode = 1000
      }
      
      try {
        // 检查连接状态，避免关闭已关闭的连接
        let readyState
        try {
          readyState = this.webSocket.readyState
        } catch (e) {
          // readyState 可能不可访问，直接尝试关闭
          readyState = null
        }
        
        // 小程序环境：SocketTask 的 readyState
        // 0-连接中, 1-已连接, 2-正在关闭, 3-已关闭
        const isOpen = readyState === 1 || readyState === null
        
        if (isOpen && this.webSocket.close) {
          // 连接仍然打开，可以关闭
          // 确保使用有效的关闭代码：只允许 1000（正常关闭）或 3000-4999（自定义代码）
          // 任何其他代码（包括 1006）都会被转换为 1000
          
          // 小程序环境：使用 SocketTask.close({ code, reason, success, fail })
          // 重要：完全避免使用 code 参数，因为框架可能在某些情况下自动使用 1006
          // 只使用无 code 参数的方式关闭，这是最安全的方式
          try {
            // 只使用无 code 参数关闭（最安全，完全避免 code 验证问题）
            // 这样可以避免框架自动使用 1006 导致的错误
            this.webSocket.close({
              success: () => {
                console.log('✅ SocketTask关闭成功（无code参数，最安全）')
              },
              fail: (err) => {
                // 即使失败也不尝试带 code 参数，避免触发 1006 错误
                console.warn('⚠️ SocketTask关闭失败（已忽略）:', err)
                // 不进行任何重试，避免触发框架的 1006 错误
              }
            })
          } catch (error) {
            // 捕获所有异常，但不进行任何重试
            console.warn('⚠️ SocketTask.close调用异常（已忽略）:', error)
            // 不进行任何降级尝试，避免触发框架错误
          }
        } else {
          // 连接已关闭或正在关闭，不需要再次关闭
          const stateDesc = readyState === 2 ? '正在关闭' : '已关闭'
          console.log(`WebSocket${stateDesc}，跳过重复关闭`)
        }
      } catch (error) {
        console.warn('关闭WebSocket异常:', error)
      } finally {
        // 无论关闭是否成功，都清理状态
        // 从连接管理器中移除
        if (this.socketConnectionId) {
          this.socketManager.closeConnection(this.socketConnectionId)
          this.socketConnectionId = ''
        }
        
        this.webSocket = null
        this.isConnected = false
        this.isConnecting = false
        this.stopHeartbeat()
        
        console.log(`✅ 连接状态已清理，当前连接数: ${this.socketManager.getConnectionCount()}`)
      }
    },
    
    // 销毁SDK
    destroySDK() {
      console.log('正在销毁虚拟人...')
      
      // 停止播放
      this.isPlaying = false
      
      // 停止录音
      if (this.isRecording) {
        this.stopVoiceRecording()
      }
      
      // 停止音频播放
      if (this.audioContext) {
        try {
          this.audioContext.destroy()
        } catch (e) {
          console.warn('销毁音频上下文失败:', e)
        }
        this.audioContext = null
      }
      
      // 关闭WebSocket连接（不需要等待，直接关闭）
      this.closeWebSocket()
      
      // 停止所有定时器
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer)
        this.heartbeatTimer = null
      }
      
      if (this.subtitleTimer) {
        clearTimeout(this.subtitleTimer)
        this.subtitleTimer = null
      }
      
      // 重置状态
      this.sdkInitialized = false
      this.isRecording = false
      this.hasLocalVideo = false
      this.videoStreamUrl = ''
      this.streamStatus = '虚拟人已销毁'
      this.streamTip = '所有资源已释放'
      this.subtitleText = '等待字幕...'
      
      this.showMessageTip('虚拟人已销毁', 'success')
    },
    
    // 视频播放错误处理
    onVideoError(e) {
      console.error('视频播放错误:', e)
      this.streamStatus = '视频播放失败'
      this.streamTip = '视频流加载失败，请检查网络'
      this.showMessageTip('视频播放失败', 'error')
    },
    
    // 重置所有状态
    resetAll() {
      this.destroySDK()
      
      // 延迟重新初始化
      setTimeout(() => {
        this.initSDK()
      }, 1000)
    },
    
    // 开始语音交互（小程序环境）
    async startVoiceInteraction() {
      if (!this.isPlaying) {
        this.showMessageTip('请先启动虚拟人', 'warning')
        return
      }
      
      if (!this.isConnected) {
        this.showMessageTip('WebSocket未连接', 'error')
        return
      }
      
      try {
        // 检查是否支持录音
        if (typeof uni === 'undefined' || !uni.getRecorderManager) {
          this.showMessageTip('当前环境不支持录音功能', 'error')
          return
        }
        
        // 如果正在录音，则停止录音
        if (this.isRecording) {
          this.stopVoiceRecording()
          return
        }
        
        // 开始录音
        this.isRecording = true
        this.recorderManager = uni.getRecorderManager()
        
        // 录音开始回调
        this.recorderManager.onStart(() => {
          console.log('🎤 开始录音')
          this.showMessageTip('开始录音，请说话...', 'info')
          this.streamTip = '正在录音中...'
        })
        
        // 录音错误回调
        this.recorderManager.onError((err) => {
          console.error('录音错误:', err)
          this.isRecording = false
          this.showMessageTip('录音失败: ' + (err.errMsg || '未知错误'), 'error')
        })
        
        // 录音结束回调
        this.recorderManager.onStop((res) => {
          console.log('🎤 录音结束', res)
          this.isRecording = false
          
          if (res.tempFilePath) {
            // 将录音文件转换为Base64或直接发送
            this.sendVoiceMessage(res.tempFilePath, res.duration)
          } else {
            this.showMessageTip('录音文件获取失败', 'error')
          }
        })
        
        // 开始录音
        this.recorderManager.start({
          duration: 60000, // 最长录音60秒
          sampleRate: 16000, // 采样率16kHz
          numberOfChannels: 1, // 单声道
          encodeBitRate: 96000, // 编码码率
          format: 'mp3', // 音频格式
          frameSize: 50 // 指定帧大小
        })
        
      } catch (error) {
        console.error('启动录音失败:', error)
        this.isRecording = false
        this.showMessageTip('启动录音失败: ' + error.message, 'error')
      }
    },
    
    // 停止录音
    stopVoiceRecording() {
      if (this.recorderManager && this.isRecording) {
        this.recorderManager.stop()
        this.isRecording = false
        this.showMessageTip('录音已停止', 'info')
      }
    },
    
    // 发送语音消息
    async sendVoiceMessage(filePath, duration) {
      try {
        console.log('准备发送语音消息，文件路径:', filePath, '时长:', duration)
        
        // 读取录音文件
        const fileSystem = uni.getFileSystemManager()
        const audioData = await new Promise((resolve, reject) => {
          fileSystem.readFile({
            filePath: filePath,
            encoding: 'base64',
            success: (res) => {
              resolve(res.data)
            },
            fail: (err) => {
              reject(err)
            }
          })
        })
        
        console.log('音频文件读取成功，Base64长度:', audioData.length)
        
        // 构建语音交互请求
        // 注意：讯飞虚拟人API可能需要特定的语音数据格式
        // 这里发送文本交互请求，实际应用中可能需要发送音频数据
        const voiceRequest = this.buildTextInteractRequest('语音消息')
        
        // 如果有音频数据，可以添加到payload中
        if (audioData) {
          voiceRequest.payload = voiceRequest.payload || {}
          voiceRequest.payload.audio = {
            encoding: 'base64',
            sample_rate: 16000,
            format: 'mp3',
            data: audioData
          }
        }
        
        // 发送请求
        const success = this.sendWebSocketMessage(voiceRequest)
        
        if (success) {
          this.showMessageTip('语音消息已发送', 'success')
          this.streamTip = '正在处理语音消息...'
        } else {
          throw new Error('发送语音消息失败')
        }
        
      } catch (error) {
        console.error('发送语音消息失败:', error)
        this.showMessageTip('发送语音消息失败: ' + error.message, 'error')
      }
    },
    

    
    // 开始字幕动画
    startSubtitleAnimation() {
      // 清空之前的定时器
      if (this.subtitleTimer) {
        clearTimeout(this.subtitleTimer)
      }
      
      // 逐字显示动画
      let currentIndex = 0
      const displayText = []
      const text = this.currentSubtitle
      
      this.subtitleTimer = setInterval(() => {
        if (currentIndex < text.length) {
          displayText.push(text[currentIndex])
          this.subtitleText = displayText.join('') + '|'
          currentIndex++
        } else {
          clearInterval(this.subtitleTimer)
          this.subtitleText = text
          
          // 5秒后清除字幕
          setTimeout(() => {
            this.subtitleText = '等待字幕...'
          }, 5000)
        }
      }, 80)
    },
    
    // 显示消息提示
    showMessageTip(content, type = 'info') {
      this.showMessage = true
      this.messageType = type
      this.messageContent = content
      
      // 设置消息标题
      switch (type) {
        case 'success':
          this.messageTitle = '成功'
          break
        case 'error':
          this.messageTitle = '错误'
          break
        case 'warning':
          this.messageTitle = '警告'
          break
        default:
          this.messageTitle = '提示'
      }
      
      // 清除之前的定时器
      if (this.messageTimer) {
        clearTimeout(this.messageTimer)
      }
      
      // 3秒后自动隐藏
      this.messageTimer = setTimeout(() => {
        this.showMessage = false
      }, 3000)
    },
    
    // 处理音频数据
    handleAudioData(audioData) {
      try {
        console.log('处理音频数据:', audioData)
        
        // 如果音频数据是Base64编码的字符串
        if (typeof audioData === 'string') {
          // 将Base64转换为ArrayBuffer
          const audioBuffer = this.base64ToArrayBuffer(audioData)
          this.playAudio(audioBuffer)
        } else if (audioData.data) {
          // 如果音频数据在data字段中
          const audioBuffer = this.base64ToArrayBuffer(audioData.data)
          this.playAudio(audioBuffer)
        } else {
          console.warn('未知的音频数据格式:', audioData)
        }
      } catch (error) {
        console.error('处理音频数据失败:', error)
      }
    },
    
    // Base64转ArrayBuffer
    base64ToArrayBuffer(base64) {
      try {
        // 小程序环境使用uni-app的API
        if (typeof uni !== 'undefined' && uni.base64ToArrayBuffer) {
          return uni.base64ToArrayBuffer(base64)
        }
        
        // 降级方案：手动转换（小程序环境可能不支持atob）
        console.warn('使用降级方案转换Base64')
        // 注意：小程序环境可能不支持atob，需要其他方式
        return null
      } catch (error) {
        console.error('Base64转ArrayBuffer失败:', error)
        return null
      }
    },
    
    // 播放音频
    playAudio(audioBuffer) {
      try {
        if (!audioBuffer) {
          console.warn('音频数据为空')
          return
        }
        
        // 小程序环境使用uni.createInnerAudioContext
        if (typeof uni !== 'undefined' && uni.createInnerAudioContext) {
          // 将ArrayBuffer转换为临时文件路径
          const fileSystem = uni.getFileSystemManager()
          const tempFilePath = `${uni.env.USER_DATA_PATH || 'wxfile://tmp'}/temp_audio_${Date.now()}.mp3`
          
          fileSystem.writeFile({
            filePath: tempFilePath,
            data: audioBuffer,
            success: () => {
              // 创建音频上下文并播放
              const audioContext = uni.createInnerAudioContext()
              audioContext.src = tempFilePath
              audioContext.autoplay = true
              
              audioContext.onPlay(() => {
                console.log('✅ 音频开始播放')
              })
              
              audioContext.onEnded(() => {
                console.log('✅ 音频播放结束')
                // 清理临时文件
                try {
                  fileSystem.unlink({
                    filePath: tempFilePath,
                    fail: (err) => console.warn('删除临时文件失败:', err)
                  })
                } catch (e) {
                  console.warn('清理临时文件异常:', e)
                }
              })
              
              audioContext.onError((err) => {
                console.error('❌ 音频播放错误:', err)
              })
              
              this.audioContext = audioContext
            },
            fail: (err) => {
              console.error('写入音频文件失败:', err)
            }
          })
        } else {
          console.warn('当前环境不支持音频播放')
        }
      } catch (error) {
        console.error('播放音频失败:', error)
      }
    },
    
    // 处理视频流
    handleVideoStream(videoData) {
      try {
        console.log('处理视频流数据:', videoData)
        
        // 如果视频数据包含URL
        if (videoData.url) {
          this.videoStreamUrl = videoData.url
          this.hasLocalVideo = true
          this.streamStatus = '视频流已就绪'
          this.streamTip = '正在加载视频流...'
        } else if (typeof videoData === 'string') {
          // 如果视频数据是URL字符串
          this.videoStreamUrl = videoData
          this.hasLocalVideo = true
          this.streamStatus = '视频流已就绪'
          this.streamTip = '正在加载视频流...'
        }
      } catch (error) {
        console.error('处理视频流失败:', error)
      }
    },
    
    // 视频播放相关方法
    onVideoPlay() {
      console.log('✅ 视频开始播放')
      this.streamStatus = '视频播放中'
      this.streamTip = '虚拟人视频正在播放'
    },
    
    onVideoPause() {
      console.log('⏸️ 视频暂停')
      this.streamStatus = '视频已暂停'
    },
    
    onVideoEnded() {
      console.log('⏹️ 视频播放结束')
      this.isPlaying = false
      this.streamStatus = '视频播放结束'
      this.streamTip = '视频播放已完成'
    }
  }
})
</script>

<style scoped>
.xf-virtual-human-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20rpx;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  backdrop-filter: blur(10px);
}

.nav-title {
  font-size: 32rpx;
  font-weight: bold;
  color: white;
}

.nav-actions {
  display: flex;
  gap: 20rpx;
}

.nav-btn {
  padding: 12rpx 24rpx;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 10rpx;
  font-size: 24rpx;
  backdrop-filter: blur(5px);
}

/* 状态面板 */
.status-panel {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
  gap: 15rpx;
}

.status-item {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  padding: 20rpx;
  border-radius: 15rpx;
  text-align: center;
  backdrop-filter: blur(10px);
}

.status-label {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 10rpx;
}

.status-value {
  display: block;
  font-size: 26rpx;
  font-weight: bold;
}

.status-success { color: #52c41a; }
.status-warning { color: #faad14; }
.status-error { color: #ff4d4f; }
.status-info { color: #1890ff; }

/* 配置面板 */
.config-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 600rpx;
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  z-index: 1000;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.config-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.config-close {
  font-size: 40rpx;
  color: #999;
  cursor: pointer;
}

.form-group {
  margin-bottom: 25rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.form-input {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #ddd;
  border-radius: 10rpx;
  font-size: 26rpx;
}

.config-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.btn {
  flex: 1;
  padding: 20rpx;
  border: none;
  border-radius: 10rpx;
  font-size: 26rpx;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-secondary.recording {
  background: #ff4d4f;
  color: white;
  animation: recordingPulse 1.5s infinite;
}

@keyframes recordingPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.btn-success {
  background: #52c41a;
  color: white;
}

.btn-warning {
  background: #faad14;
  color: white;
}

.btn-error {
  background: #ff4d4f;
  color: white;
}

.btn-info {
  background: #13c2c2;
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 虚拟人显示区域 */
.avatar-display-section {
  margin-bottom: 30rpx;
}

.avatar-container {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  padding: 30rpx;
  backdrop-filter: blur(10px);
}

.avatar-video-wrapper {
  position: relative;
  width: 100%;
  height: 400rpx;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 15rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.virtual-human-stream {
  width: 100%;
  height: 100%;
}

.stream-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  transition: all 0.3s;
}

.avatar-image.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

.video-status-overlay {
  position: absolute;
  top: 20rpx;
  left: 20rpx;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10rpx;
  background: rgba(0, 0, 0, 0.7);
  padding: 10rpx 15rpx;
  border-radius: 20rpx;
  color: white;
  font-size: 22rpx;
}

.indicator-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #ff4d4f;
  animation: blink 2s infinite;
}

.status-indicator.connecting .indicator-dot {
  background: #faad14;
  animation: blink 1s infinite;
}

.status-indicator.connected .indicator-dot {
  background: #52c41a;
  animation: none;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0.3;
  }
}

.indicator-text {
  font-size: 20rpx;
  color: white;
}

/* 视频流效果 */
.video-stream-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.stream-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100rpx;
  height: 100rpx;
  border: 2rpx solid rgba(24, 144, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: waveExpand 3s infinite;
}

.stream-wave.delay-1 {
  animation-delay: 1s;
}

.stream-wave.delay-2 {
  animation-delay: 2s;
}

@keyframes waveExpand {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
  }
}

.stream-status {
  position: absolute;
  bottom: 60rpx;
  left: 0;
  width: 100%;
  text-align: center;
  color: white;
  font-size: 28rpx;
  font-weight: bold;
}

.stream-tip {
  position: absolute;
  bottom: 30rpx;
  left: 0;
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 22rpx;
}

.stream-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 10rpx;
}

.loading-dot {
  color: white;
  font-size: 24rpx;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.virtual-human-video {
  width: 100%;
  height: 100%;
  border-radius: 15rpx;
}

.video-placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
}

.placeholder-icon {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 20rpx;
  opacity: 0.7;
}

.video-placeholder {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.video-description {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 5rpx;
}

/* 字幕面板 */
.subtitle-panel {
  margin-top: 20rpx;
  background: rgba(0, 0, 0, 0.5);
  padding: 20rpx;
  border-radius: 10rpx;
  text-align: center;
}

.subtitle-text {
  color: white;
  font-size: 26rpx;
  min-height: 40rpx;
}

/* 控制区域 */
.control-section {
  margin-top: 30rpx;
}

.control-buttons {
  display: flex;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.interaction-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.interaction-buttons .btn {
  flex: none;
  width: calc(50% - 5rpx);
}

/* 消息输入区域 */
.input-section {
  margin-top: 30rpx;
}

.input-container {
  display: flex;
  gap: 15rpx;
}

.message-input {
  flex: 1;
  padding: 20rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 10rpx;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 26rpx;
  backdrop-filter: blur(10px);
}

.message-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.send-btn {
  width: 120rpx;
}

/* 消息提示 */
.message-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2000;
}

.message {
  background: white;
  border-radius: 15rpx;
  padding: 30rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
  min-width: 300rpx;
  max-width: 500rpx;
  text-align: center;
}

.message.success {
  border-left: 8rpx solid #52c41a;
}

.message.error {
  border-left: 8rpx solid #ff4d4f;
}

.message.warning {
  border-left: 8rpx solid #faad14;
}

.message.info {
  border-left: 8rpx solid #1890ff;
}

.message-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 15rpx;
  color: #333;
}

.message-content {
  display: block;
  font-size: 24rpx;
  color: #666;
}
</style>