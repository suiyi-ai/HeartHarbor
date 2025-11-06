<template>
  <view class="virtual-human-page">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <text class="nav-title">虚拟人伙伴</text>
      <view class="nav-actions">
        <text class="nav-btn" @click="switchAvatar">切换形象</text>
        <text class="nav-btn" @click="clearHistory">清空历史</text>
      </view>
    </view>
    
    <!-- 上半部分：虚拟人容器区 -->
    <view class="avatar-container">
      <!-- 虚拟人占位框架 -->
      <view class="avatar-frame">
        <!-- 虚拟人形象占位区 -->
        <view class="avatar-placeholder">
          <text class="placeholder-text">虚拟人形象区域</text>
          <text class="placeholder-hint">(此处放置虚拟人组件)</text>
        </view>
        
        <!-- 状态指示器 -->
        <view class="status-indicator">
          <view class="status-dot" :class="statusClass"></view>
          <text class="status-text">{{ statusText }}</text>
        </view>
      </view>
      
      <!-- 快捷操作栏 -->
      <view class="quick-actions">
        <view class="action-item" @click="changeEmotion('smile')">
          <text class="action-icon">😊</text>
          <text class="action-label">微笑</text>
        </view>
        <view class="action-item" @click="changeEmotion('think')">
          <text class="action-icon">🤔</text>
          <text class="action-label">思考</text>
        </view>
        <view class="action-item" @click="changeEmotion('listen')">
          <text class="action-icon">👂</text>
          <text class="action-label">倾听</text>
        </view>
        <view class="action-item" @click="toggleMute">
          <text class="action-icon">{{ isMuted ? '🔇' : '🔊' }}</text>
          <text class="action-label">{{ isMuted ? '静音' : '有声' }}</text>
        </view>
      </view>
    </view>
    
    <!-- 下半部分：聊天功能区 -->
    <view class="chat-container">
      <!-- 消息列表 -->
      <scroll-view class="message-list" scroll-y="true">
        <view class="message-item" v-for="(msg, index) in messages" :key="index" 
              :class="msg.role === 'user' ? 'user-message' : 'ai-message'">
          <view class="message-avatar">
            <text>{{ msg.role === 'user' ? '👤' : '🤖' }}</text>
          </view>
          <view class="message-content">
            <text>{{ msg.content }}</text>
          </view>
        </view>
        
        <!-- 加载状态 -->
        <view class="message-item ai-message" v-if="isLoading">
          <view class="message-avatar">
            <text>🤖</text>
          </view>
          <view class="message-content">
            <view class="loading-dots">
              <text>.</text>
              <text>.</text>
              <text>.</text>
            </view>
          </view>
        </view>
      </scroll-view>
      
      <!-- 输入区域 -->
      <view class="input-area">
        <input class="message-input" v-model="inputText" placeholder="和虚拟人聊聊..." 
               @confirm="sendMessage" />
        <button class="send-btn" @click="sendMessage">发送</button>
      </view>
      
      <!-- 功能按钮 -->
      <view class="function-buttons">
        <view class="func-btn" @click="newConversation">
          <text>🆕</text>
          <text>新对话</text>
        </view>
        <view class="func-btn" @click="exportChat">
          <text>📤</text>
          <text>导出</text>
        </view>
        <view class="func-btn" @click="toggleSettings">
          <text>⚙️</text>
          <text>设置</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      // 页面状态
      currentEmotion: 'normal',
      isMuted: false,
      isSpeaking: false,
      isLoading: false,
      
      // 聊天数据
      messages: [
        {
          role: 'ai',
          content: '你好！我是你的虚拟人伙伴，很高兴与你交流。有什么想聊的吗？'
        }
      ],
      inputText: '',
      
      // 状态指示
      statusText: '在线',
      statusClass: 'online'
    }
  },
  
  methods: {
    // 虚拟人相关方法
    changeEmotion(emotion) {
      this.currentEmotion = emotion
      // 触发虚拟人表情变化
      this.$emit('emotionChange', emotion)
    },
    
    toggleMute() {
      this.isMuted = !this.isMuted
    },
    
    switchAvatar() {
      uni.showToast({
        title: '切换形象功能开发中',
        icon: 'none'
      })
    },
    
    // 聊天相关方法
    sendMessage() {
      if (!this.inputText.trim()) return
      
      // 添加用户消息
      this.messages.push({
        role: 'user',
        content: this.inputText
      })
      
      this.inputText = ''
      this.isLoading = true
      
      // 模拟AI回复
      setTimeout(() => {
        this.messages.push({
          role: 'ai',
          content: '收到你的消息了！这是一个模拟回复。虚拟人形象框架已准备好，你可以在这里集成真实的虚拟人组件。'
        })
        this.isLoading = false
      }, 1000)
    },
    
    newConversation() {
      this.messages = [{
        role: 'ai',
        content: '开始新的对话吧！'
      }]
    },
    
    clearHistory() {
      this.messages = []
      uni.showToast({
        title: '对话历史已清空',
        icon: 'success'
      })
    },
    
    exportChat() {
      uni.showToast({
        title: '导出功能开发中',
        icon: 'none'
      })
    },
    
    toggleSettings() {
      uni.showToast({
        title: '设置功能开发中',
        icon: 'none'
      })
    }
  }
}
</script>

<style scoped>
.virtual-human-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* 导航栏样式 */
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 2rpx solid #e6f3ff;
}

.nav-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1890ff;
}

.nav-actions {
  display: flex;
  gap: 20rpx;
}

.nav-btn {
  padding: 12rpx 20rpx;
  background: #f0f8ff;
  border-radius: 20rpx;
  font-size: 26rpx;
  color: #1890ff;
  border: 2rpx solid #e6f3ff;
}

.nav-btn:active {
  background: #e6f3ff;
  transform: scale(0.95);
}

/* 虚拟人容器区 */
.avatar-container {
  flex: 0.6;
  display: flex;
  flex-direction: column;
  padding: 30rpx;
}

.avatar-frame {
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 30rpx;
  margin-bottom: 20rpx;
  border: 3rpx solid #e6f3ff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.avatar-placeholder {
  text-align: center;
  padding: 60rpx;
}

.placeholder-text {
  display: block;
  font-size: 32rpx;
  color: #666;
  margin-bottom: 15rpx;
}

.placeholder-hint {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.status-indicator {
  position: absolute;
  top: 30rpx;
  right: 30rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.status-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #52c41a;
}

.status-dot.online {
  background: #52c41a;
}

.status-dot.offline {
  background: #ff4d4f;
}

.status-text {
  font-size: 24rpx;
  color: #666;
}

/* 快捷操作栏 */
.quick-actions {
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 25rpx;
  padding: 20rpx;
  border: 2rpx solid #e6f3ff;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15rpx;
  border-radius: 20rpx;
  transition: all 0.3s;
}

.action-item:active {
  background: #e6f3ff;
  transform: scale(0.95);
}

.action-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.action-label {
  font-size: 24rpx;
  color: #666;
}

/* 聊天容器区 */
.chat-container {
  flex: 0.4;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  border-top-left-radius: 30rpx;
  border-top-right-radius: 30rpx;
  border: 3rpx solid #e6f3ff;
}

.message-list {
  flex: 1;
  padding: 20rpx;
}

.message-item {
  display: flex;
  margin-bottom: 30rpx;
  align-items: flex-start;
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #e6f3ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  margin: 0 20rpx;
}

.message-content {
  max-width: 70%;
  background: #f8f9fa;
  border-radius: 25rpx;
  padding: 20rpx;
  font-size: 28rpx;
  line-height: 1.5;
}

.user-message .message-content {
  background: #1890ff;
  color: white;
}

.loading-dots text {
  animation: dot-bounce 1.4s infinite ease-in-out both;
}

.loading-dots text:nth-child(1) { animation-delay: -0.32s; }
.loading-dots text:nth-child(2) { animation-delay: -0.16s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1.2); opacity: 1; }
}

/* 输入区域 */
.input-area {
  display: flex;
  padding: 20rpx;
  border-top: 2rpx solid #f0f0f0;
  align-items: center;
}

.message-input {
  flex: 1;
  height: 80rpx;
  background: #f8f9fa;
  border: 2rpx solid #e6f3ff;
  border-radius: 40rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}

.send-btn {
  width: 120rpx;
  height: 80rpx;
  background: #1890ff;
  color: white;
  border-radius: 40rpx;
  margin-left: 20rpx;
  font-size: 28rpx;
}

.send-btn:active {
  background: #096dd9;
  transform: scale(0.95);
}

/* 功能按钮 */
.function-buttons {
  display: flex;
  justify-content: space-around;
  padding: 15rpx 20rpx;
  border-top: 2rpx solid #f0f0f0;
}

.func-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15rpx;
  border-radius: 20rpx;
}

.func-btn:active {
  background: #f0f8ff;
}

.func-btn text:first-child {
  font-size: 32rpx;
  margin-bottom: 8rpx;
}

.func-btn text:last-child {
  font-size: 22rpx;
  color: #666;
}
</style>